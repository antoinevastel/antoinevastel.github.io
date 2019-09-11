---
layout: post
title: Benchmark our JavaScript obfuscator
categories: [JavaScript]
tags: [Javascript, obfuscation, deobfuscation, benchmark]
description: In this blog post, we conduct a benchmark to measure the overhead added by the obfuscator we developed in the two previous blog posts.
---

In the two previous blog posts
(<a href="{% post_url 2019-09-04-home-made-obfuscator %}">post 1</a> and
<a href="{% post_url 2019-09-09-improving-obfuscator %}">post 2</a>), we created a JavaScript obfuscator
that applies simple code transformations to make programs less readable.
In this blog post, we measure the overhead of our obfuscation on the execution of the code.
To do so, we measure two metrics:
1. **Execution time.** Our obfuscator applies different kinds of code transformations such as replacing literals by dynamic function calls or splitting literals into multiple ternary statements. Because of these transformations, it can increase the time required
to parse and execute our script.
2. **Size of the obfuscated JS file.** Since JavaScript files need to be transferred from a server to a browser to be executed, the size of
the JavaScript file influences its load time.

The obfuscator developed in the previous blog posts is not production-ready.
Thus, this benchmark and the obfuscator only serve for educational purposes.

## Execution time

We measure the overhead added by our obfuscation in term of execution time.
Execution time depends on different parameters of our
obfuscator.
Indeed, increasing the maximum number of splits will require more operation to access a static member expression for example.
Moreover, the parsing time of the script is also impacted by the obfuscation.
Thus, for this blog post, we consider the execution time as the total time to parse the obfuscated JavaScript file
and execute the ```fingerprintCollector.collect``` function.
Moreover, for the benchmark to be more meaningful, we added more fingerprinting tests to our script, such as testing
for the presence of attributes added by phantomJS or Selenium.

### Protocol

We create a file **benchmark/execution_time.js** that contains the code for this part of the benchmark.
In this file, we create a function **benchmark** that takes 3 parameters:
1. **obfuscate** Whether or not it should obfuscate the code;
2. **transformationsConfig** The parameters for the obfuscator such as the maximum number of splits or the frequency
of ternary statements;
3. **numIterations** The number of iterations/measurements.

Depending on the parameters, this function generates a script that has been both obfuscated and minified,
 or a script that has only been modified.
Then, we run ``numIterations`` of our benchmark:
1. Create a Chrome headless browser instance using the Puppeteer library;
2. Create an empty page;
3. Load the fingerprinting (obfuscated or not) script, and measure the total execution time;
4. Store the execution time along with the different obfuscator parameters;
5. Close the Chrome headless browser instance.

The reason we create a new browser instance at each iteration is that otherwise, the browser can optimize the parsing
of the script, even when a new page is created.
Thus, depending on whether the script was executed for the first time or not, it has a huge impact on
its parsing time, which biases the benchmark.

```javascript
async function benchmark(obfuscate, transformationsConfig, numIterations) {
    await concatScripts();
    let fpScriptPath = '../dist/obfuscated.min.js';
    if (obfuscate) {
        obfuscateFPScript(transformationsConfig);
        await compress(path.resolve(__dirname, '../dist/obfuscated.js'));
    } else {
        await compress(path.resolve(__dirname, '../dist/simpleFingerprintCollector.js'));
        fpScriptPath = '../dist/simpleFingerprintCollector.min.js'
    }

    const fpScript = fs.readFileSync(fpScriptPath, 'utf8');
    const results = [];

    for (let i = 0; i < numIterations; i++) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('about:blank');
        const executionTime = await page.evaluate(`(async() => {
                const start = performance.now();
                eval(\`${fpScript}; window.tmpFingerprintCollector = fingerprintCollector;\`);
                await window.tmpFingerprintCollector.collect();
                return performance.now() - start;
            })();`);
        results.push(executionTime);
        await page.close();
        await browser.close();
    }

    return results;
}
```

Then, we run this function for different obfuscation parameters, as well as with no obfuscation.
For each configuration, we run 50 iterations of the benchmark.
In the case where no obfuscation is applied, we run 500 iterations.

```javascript
const results = [];
const numIterations = 50;
const encodingFrequencies = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const maxSplits = [1, 2, 3, 4, 5, 6];

// With obfuscation
for (const encodingFrequency of encodingFrequencies){
    for (const maxSplit of maxSplits) {
        const transformationsConfig = {
            frequency: {
                'encoding': encodingFrequency,
                'ternary':  1 - encodingFrequency
            },
            maxSplits: maxSplit
        };

        const executionTimes = await benchmark(true, transformationsConfig, numIterations);
        results.push({
            obfuscation: true,
            encodingFrequency: encodingFrequency,
            ternaryFrequency: 1 - encodingFrequency,
            maxSplits: maxSplit,
            executionTimes: executionTimes
        });
    }
}

// Without obfuscation
const executionTimes = await benchmark(false, {}, 10 * numIterations);
results.push({
    obfuscation: false,
    encodingFrequency: -1,
    ternaryFrequency: -1,
    maxSplits: -1,
    executionTimes: executionTimes
});

// We save the results of the benchmark
fs.writeFileSync('./results.csv', `${Object.keys(results[0]).join(',')}\n`);
const fileContent = [];
results.forEach(obj => {
    const rows = obj.executionTimes.map(execTime => {
        return `${obj.obfuscation},${obj.encodingFrequency},${obj.ternaryFrequency},${obj.maxSplits},${execTime}`;
    });
    return fileContent.push(...rows);
});

fs.appendFileSync('./results.csv', fileContent.join('\n'));
```

The results we discuss below originate from a benchmark run on a MacBook Pro 2017 (macOS Mojave)
with a 2.3Ghz intel Core i5 processor and 8GB of RAM.

### Results: general

The graph below plots the cumulative distribution functions (CDF) for the execution time of scripts
that have been obfuscated and minified, and for scripts that have only been minified.
We observe that scripts that have been obfuscated take more time to execute.
The 95th percentile for obfuscated scripts is 205.6 ms against 177.8 ms for non-obfuscated scripts,
which is an increase of 15.6% of the execution time.

<img src="/assets/media/cdf_exec.svg">

In the remainder of this section, we study how the different obfuscator parameters impact the
script execution time.

### Results: impact of ternary statements frequency

First, we study how the frequency of ternary expression impacts the execution time.
As a reminder, the obfuscator can either replace a substring of a literal with
a simple function call or it can replace it with a ternary statement.
The box plots below show how the execution time varies for when increasingly more
ternary statement transformations are applied.
We don't observe any significant correlation between the ternary frequency and the execution time.
For example, when the ternary frequency is 0.1, we have a 95th percentile equal to 221 ms, whereas it is
equal to 200.8 ms for a frequency of 0.7, and 226.7 ms for a frequency of 1.

<img src="/assets/media/exec_time_ternary_bp.svg">


### Results: impact of maxSplits

The second factor we study is the maximum number of splits when splitting literals
or static member properties.

The box plots below show how the execution time varies for increasing values of **maxSplits**.
Increasing the number of splits slightly increases the execution time.
While for ```maxSplits = 1``` (no split), the 95th percentile is equal to 203 ms, it grows to
215 ms for ```maxSplits = 6```.

<img src="/assets/media/exec_time_splits_bp.svg">

## JavaScript file size

The size of the JavaScript obfuscated file also depends on the different parameters of the obfuscator such as the maximum
number of splits.

### Protocol

We create a file **benchmark/size_file_bench.js** that contains the code to measure how
the obfuscation process impacts the size of the file obfuscated.
Similarly to the previous section, we create a function **studySize** that takes 3 parameters:
1. **obfuscate** Whether or not it should obfuscate the code;
2. **transformationsConfig** The parameters for the obfuscator such as the maximum number of splits or the frequency
of ternary statements;
3. **numIterations** The number of iterations/measurements.

Depending on the parameters, this function generates **numIterations** scripts that have
been both obfuscated and minified, or a script that has only been modified.
At each iteration, we save the size of the obfuscated/minified file along with the different obfuscation parameters.

```javascript
async function studySize(obfuscate, transformationsConfig, numIterations) {
    const results = [];

    for (let i = 0; i < numIterations; i++) {
        let fpScriptPath = '../dist/obfuscated.min.js';
        if (obfuscate) {
            obfuscateFPScript(transformationsConfig);
            await compress(path.resolve(__dirname, '../dist/obfuscated.js'));
        } else {
            await compress(path.resolve(__dirname, '../dist/simpleFingerprintCollector.js'));
            fpScriptPath = '../dist/simpleFingerprintCollector.min.js'
        }

        const statsFile = fs.statSync(fpScriptPath);
        results.push(statsFile["size"]);
    }
    return results;
}
```

Then, we run this function for different obfuscation parameters, as well as with no obfuscation.
For each configuration, we run 100 iterations.

```javascript
const results = [];
const numIterations = 100;
const encodingFrequencies = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const maxSplits = [1, 2, 3, 4, 5, 6];

await concatScripts();

// With obfuscation
for (const encodingFrequency of encodingFrequencies){
    for (const maxSplit of maxSplits) {
        const transformationsConfig = {
            frequency: {
                'encoding': encodingFrequency,
                'ternary':  1 - encodingFrequency
            },
            maxSplits: maxSplit
        };

        const fileSizes = await studySize(true, transformationsConfig, numIterations);
        results.push({
            obfuscation: true,
            encodingFrequency: encodingFrequency,
            ternaryFrequency: 1 - encodingFrequency,
            maxSplits: maxSplit,
            fileSizes: fileSizes
        });
    }
}

// Without obfuscation
const fileSizes = await studySize(false, {}, 1);
results.push({
    obfuscation: false,
    encodingFrequency: -1,
    ternaryFrequency: -1,
    maxSplits: -1,
    fileSizes: fileSizes
});


fs.writeFileSync('./results_size_files.csv', `${Object.keys(results[0]).join(',')}\n`);
const fileContent = [];
results.forEach(obj => {
    const rows = obj.fileSizes.map(fileSize => {
        return `${obj.obfuscation},${obj.encodingFrequency},${obj.ternaryFrequency},${obj.maxSplits},${fileSize}`;
    });
    return fileContent.push(...rows);
});

fs.appendFileSync('./results_size_files.csv', fileContent.join('\n'));
```

Similarly to the section on the execution time, we study how the ternary statements frequency
and the maximum number of splits impact the size of the generated files.

### Results: impact of ternary statements frequency

When no obfuscation is applied, we obtain a script of 5.5KB.
On the next graphs, it is represented by a horizontal red line.

The graph below presents the median size of the obfuscated file in KB for different ternary frequencies.

<img src="/assets/media/bar_filesize_ternary.svg">

We observe that no matter the frequency, the obfuscated and minified file is at least twice the size of the non-obfuscated but
minified file.
This can be explained by the fact that even when we don't use ternary statements, we still splits literals into multiple
substring, and replace them by function calls, which increase the number of instructions.
Moreover, we observe that the size of the obfuscated script grows almost linearly with the frequency of ternary
transformations, going from 12.6KB when the frequency is 0, to 20.6KB when the frequency is 1.

### Results: impact of maxSplits

The figure below presents the median size of the obfuscated file in KB for increasing values
of maximum number of splits.

<img src="/assets/media/bar_filesize_maxsplits.svg">

Similarly to the previous graph, we observe that the size of the obfuscated file grows as the number
of maximum splits allowed.

To conclude this blog post, if we had generated an obfuscated script with ```ternaryFrequency = 0.4```
and ```maxSplits = 3```, the obfuscated file would have been ~ 15.5KB, which is around 3 times bigger
than the non-obfuscated script.
Concerning the execution and parsing time, the obfuscated script would have been only 2.5% slower.
Once again, you can find the <a href="https://github.com/antoinevastel/simpleJSObfuscator">complete code on Github</a>.
