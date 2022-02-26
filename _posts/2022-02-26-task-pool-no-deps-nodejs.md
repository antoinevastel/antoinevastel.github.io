---
layout: post
title: "NodeJS/JavaScript: execute at most N tasks at the same time without external dependencies"
categories: [NodeJS]
tags: [NodeJS]
description: Short NodeJS/JavaScript example that showcases how you can execute at most N concurrent asynchronous tasks at the same time without using any external dependencies.
---

As I explained in <a href="{% post_url 2022-02-19-nodejs-https-proxy-no-dependencies %}">a previous blog post</a>, I try to rely less and less on external dependencies when using NodeJS (for security and pedagocgical reasons).

In this blog post, I show how to create a simple `Pool` class to handle a pool of tasks that can be run in parallel, all while limiting the task concurrency, and maximizing the throughput.
If you want a production-ready NodeJS package to do this, you can use <a href="http://bluebirdjs.com/docs/getting-started.html">Bluebird</a> and its <a href="http://bluebirdjs.com/docs/api/promise.map.html">Promise.map function</a> with the `concurrency` parameter.

## Precision regarding the problem to solve

Note that what we do in this article is more optimal than simply calling `Promise.all` in a loop.
Indeed, many solutions posted on StackOverflow suggest to do something that looks like the following code snippet:

```javascript
const tasks = [t1, t2, ..., tN];
const MAX_CONCURRENCY = 5;

const resultTasks = [];
for (let i = 0; i < tasks.length; i += MAX_CONCURRENCY) {
    // Get the MAX_CONCURRENCY tasks to run
    const tasksToRun = tasks.slice(i, i + MAX_CONCURRENCY);

    const tasksPromises = [];
    for (let task of tasksToRun) {
        tasksPromises.push(task());
    }

    // Wait for all MAX_CONCURRENCY tasks to finish
    const res = await Promise.all(tasksPromises);
    resultTasks.push(res);
}
```

In the example above, we run by tasks batch of `MAX_CONCURRENCY` tasks.
However, if we run 5 tasks in parallel and one of the tasks finishes before the others, then, we now only have 4 tasks running in parallel, even though there are still tasks waiting to be run in the `tasks` queue.

Indeed, `Promise.all` waits for all promises to succeed before it resolves.
It means we don't start any new tasks before all the 5 tasks have completed (`for` loop iteration is stopped until all tasks promises resolve).
Thus, at a given time our only guarantee is that we have <= 5 tasks running.

What we want is a solution where we maximize throughput, all while controlling the concurrency.
At a given time, we want to have `MAX_CONCURRENCY` tasks running in parallel, AND NOT `<= MAX_CONCURRENCY` tasks.

The solution we present in the next section is slightly complex since tt handles more than just concurrency management.
The idea is to have a generic solution that enables us to run any kind of tasks and handle success/error.
This could be useful for example to write scrapers where the notion of success/error may differ depending on the site targetted.
For example, some websites may return `403` in case of blocking, while others may return a response `200` with a different text.
Thus, having a generic solution enables us to maximize reusability across different projects.

## Task pool manager with control of max concurrency in NodeJS/JavaScript

```javascript
class Pool {

    // Our pool of tasks takes only 1 parameter: the max concurrency,
    // i.e. the maximum number of tasks executed at the same time
    constructor(concurrency) {
        this.tasks = [];
        this.concurrency = concurrency;
    }

    addTask(task) {
        this.tasks.push(task)
    }

    // Private class method
    async _executeTasks(iterator) {
        const results = [];
        // We leverage a shared iterator to control the maximum concurrency
        // For more details you can read this SO post:
        // https://stackoverflow.com/questions/40639432/what-is-the-best-way-to-limit-concurrency-when-using-es6s-promise-all
        // I used it as a starting point for the solution presented in the blog post
        for (let [_, task] of iterator) {
            try {
                // Run the task and await for it
                const res = await task.run();
                try {
                    // We defined a isSuccessful function that enables us to have different definition of success 
                    // based on the tasks we run.
                    // Thus, we can run heterogeneous tasks at the same time.
                    if (task.isSuccessful(res)) {
                        // If it's successfull, we call a callback function onSuccess.
                        // This function can be used for example to save the result to a database, 
                        // print something, or do nothing if not needed.
                        await task.onSuccess(res);
                        results.push(res);
                    } else {
                        // In case of error, we call a callback function onError.
                        // This function can be used for example to add the failed task to a queue of tasks to retry later.
                        await task.onError(res);
                    }
                } catch (e) {
                    await task.onError(res);
                }
            } catch (e) {
                task.onError(e);
            }

        }
        return results;
    }

    async run() {
        const iterator = this.tasks.entries();
        const tasksWorkers = new Array(this.concurrency).fill(iterator).map(this._executeTasks);
        const res = await Promise.allSettled(tasksWorkers);
        const flattenedArrays = [];
        res.forEach((subArray) => {
            if (subArray.value) {
                subArray.value.forEach(elt => flattenedArrays.push(elt))
            }
        })

        // We reset the list of tasks after we have run them
        // so that we can add new tasks to the pool and run only the newly added tasks
        this.tasks = [];
        return flattenedArrays;
    }
}

```

To use our `Pool` class, we need to define a set of task objects that have the following properties:
- `name`: a string used as an identifier of the task/for description purpose.
- `run`: an asynchronous function to execute the task.
- `isSuccessful`: an asynchronous function that takes as input the result of the task (returned by the `run` function) and that must return a boolean indicating whether or not the task should be considered as successful or not.
- `onSuccess`: an asynchronous function that takes as input the result of the task (returned by the `run` function) and is executed in case the task has been successful (as defined by `isSuccessful`).
- `onError`: an asynchronous function that takes as input the result of the task (returned by the `run` function) and is executed in case the task has not been successful (as defined by `isSuccessful`).

```javascript

(async () => {
    const MAX_CONCURRENCY = 5;
    const NUM_TASKS = 100;
    const p = new Pool(MAX_CONCURRENCY);


    const failedTasks = [];
    const successfullTasks = [];
    // Ccreate NUM_TASKS tasks and add them to the pool
    for (let i = 0; i < NUM_TASKS; i++) {
        p.addTask({
            name: `Task ${i}`,
            async run() {
                // A simple run function that displays the index of the task, waits 1s (to better observe parallelism) and
                // randomly throw an exception (to test error management)
                console.log(`Running task ${i}`);
                await sleep(1000);

                if (Math.random() > 0.7) {
                    throw new Error('TaskError');
                }

                return i;
            },
            async onSuccess(res) {
                console.log(`Run task ${i} successfuly, res = ${res}`);
                successfullTasks.push(this);
            },
            async onError(err) {
                console.log(`Task ${i} failed with error = ${err}`);
                failedTasks.push(this);
            },
            async isSuccessful(res) {
                return typeof res === 'number';
            }
        })
    }

    const tasksResult = await p.run();
    // contains results of successful tasks
    console.log(tasksResult);

    console.log(`Num failed tasks: ${failedTasks.length}`);
    console.log(`Num successful tasks: ${successfullTasks.length}`);

})();

```

The GIF below shows the execution of code above (100 tasks with `MAX_CONCURRENCY = 5`).
We see that not all tasks are executed at once.
At a given tasks, 5 tasks are executed, and whenever a task finishes, another task is automatically run without having to wait for the 4 others:
<br/>
<br/>
<img src="/assets/media/task-pool-exec.gif">