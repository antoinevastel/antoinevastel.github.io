---
layout: post
title: "Equivalent of Promise.map (Bluebird) in Python"
categories: [Python]
tags: [Python]
description: In this blog post, we present a simple implementation of Bluebird's Promise.map function in Python using asyncio.
---

This blog post presents a simple implementation of Bluebird's Promise.map function in Python.
I tend to code most of my bots in NodeJS since I find it really convenient to manage asynchronous tasks (HTTP requests here) using await/async.
A NodeJS library I heavily rely on is Bluebird, and in particular, its Promise.map function.
Promise.map provides a simple mechanism to manage a pool of asynchronous tasks (promises) so that, at a given time, there are at most N tasks running (where N can be passed as an argument).

I was interested to know if there was an equivalent in Python.
After a quick search, I found: <a href="https://docs.python.org/3/library/concurrent.futures.html">concurrent.futures.ThreadPoolExecutor</a>.
However, `concurrent.futures.ThreadPoolExecutor.map` seems to take a synchronous function as input, which is not convenient if your code leverages asynchronous code, e.g. if you use `aiohttp` to make HTTP requests.

I didn't search further and used this as a pretext to get more familiar with Python `asyncio` and to code an equivalent of Bluebird's Promise.map in Python.

**Warning:** I don't think my implementation is really Pythonic, it must just be seen as an exercise ;)

## Promise.map: Example with aiohttp

To showcase our implementation of Promise.map in Python, we use an example of a parallel crawler, i.e. a crawler that fetches several pages in parallel.

First, we define an asynchronous `get_url` function to fetch the content of a single URL using `aiohttp` and extract all the links of the blog posts present on the page.
```python
import asyncio
import aiohttp
from bs4 import BeautifulSoup


async def get_url(url):
    connector = aiohttp.TCPConnector()
    session = aiohttp.ClientSession(connector=connector)

    headers = {
        "accept-language": "en-US;q=0.8,en;q=0.7",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36"
        # Add any header you want
    }

    print("Crawling: {}".format(url))
    results = []
    resp = await session.get(url, headers=headers)
    print("Crawled: {}".format(url))
    html_content = await resp.text()
    await connector.close()

    soup = BeautifulSoup(html_content, 'html.parser')
    for link in soup.select('a.storylink'):
        results.append('{};{}'.format(link.get('href'), link.text))

    return results

```

Now that we have our `get_url` function to asynchronously fetch the list of blog posts on an URL, we define the `promise_map` function that mimics the behavior of Bluebird's Promise.map function.

It takes 3 values as input:
1. `values`: the values you want to iterate on;
2. `mapper`: the function you want to apply on each value of `values`. Note that my implementation requires the mapper to have a single argument as a parameter;
3. `concurrency`: the number of parallel tasks.

```python
async def promise_map(values, mapper, concurrency):

    async def mapper_wrapper(iterator, mapper):
        # store all results of a given coroutine in a list
        res_coroutine = []
        
        # Iterate on the iterator
        # Note that this iterator is shared among all coroutines
        # so that each element of "values" is handled only once
        for elt in iterator:
            # Call the "mapper" function and wait for it to finish
            res_mapper = await mapper(elt)
            # Store the result of the function into res_coroutine
            res_coroutine.append(res_mapper)

        # When there's no more value to iterate on, the coroutine
        # return all its results
        return res_coroutine

    coroutines = []
    # get an iteror on the values we want to iterate on
    # the iterator will be shared among the "concurrency" workers
    values_iterator = iter(values)

    # Spawn "concurrency" coroutines
    for idx_concurrency in range(0, concurrency):
        # we store all returned coroutines in a list 
        coroutines.append(mapper_wrapper(values_iterator, mapper))

    # Once all coroutines have been spawned, we await them
    results = await asyncio.gather(*coroutines)

    # Each coroutine returns a list
    # We flatten the list of lists to obtain a list of raw value element
    res_coroutines = []
    for res_coroutine in results:
        for v in res_coroutine:
            res_coroutines.append(v)

    return res_coroutines


```

Finally, we define an asynchronous main function and apply our Pythonic implementation of Promise.map on a set of Hacker news URLs.

```python
async def main():
    # Number of pages we want to iterate on
    num_pages = 15

    # Number of concurrent requests
    concurrency = 4
    urls = ['https://news.ycombinator.com/news?p={}'.format(idx_page) for idx_page in range(1, num_pages)]

    # Launch  "concucrrency" coroutines (here 4) to fetch blog post titles present on Hacker news
    res = await promise_map(urls, get_url, concurrency)


loop = asyncio.get_event_loop()
loop.run_until_complete(main())
```

You can find the code of this bot on Github in my <a href="https://github.com/antoinevastel/bots-zoo/blob/main/python_http/parallel_coroutines_pool.py">Bots zoo</a> repository.
You'll also find other examples of bots in Python/NodeJS, as well as lists of user-agents and HTTP headers:
- Selenium, Puppeteer, Playwright bots;
- Parallel/sequential bots using simple NodeJS HTTP requests.
