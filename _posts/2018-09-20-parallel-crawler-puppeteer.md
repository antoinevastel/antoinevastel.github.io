---
layout: post
title: How to parallelize a web crawler
categories: [crawler]
tags: [crawler, Puppeteer]
description: Second post of a series about crawlers. We present how to parallelize a crawler based on Chrome headless and Puppeteer to take screenshots of the home page of the 100 most popular websites.
published: true
---

In the <a href="{% post_url 2018-09-17-simple-crawler-puppeteer %}">first post</a> of this series we 
presented a simple crawler based on Puppeteer and Chrome headless. 
We showed that while it was simple to crawl 100 pages to take a screenshot of their home page, it still required more than 8 minutes.
In this post, we explain how we can make our crawler faster by parallelizing it.

## Parallelization: Browsers vs pages
We can use two strategies to parallelize our crawler on a single machine:
1. Create more instance of Chrome headless;
2. Increase the number of simultaneous pages per browser.

We can combine the two approaches, i.e. increasing both the number of Chrome headless instances and the number of 
simultaneous pages per browser.
Be careful to adapt the number of browser instances and pages based on the characteristic of your machine, otherwise 
adding more browser instances will only degrade the performance.
Moreover, you should not open too many pages per browser since a crash of a page may bring down all the pages of this browser.
Browserless, a company providing crawling services 
even <a href="https://docs.browserless.io/blog/2018/06/04/puppeteer-best-practices.html">advises to run only a single page per browser</a>.
I have also noticed an increase in the frequency of bugs when I use more than 8-9 pages per browser in my experiments.

Creating a single page per browser to parallelize may add overhead since browser instances consume more resources than pages.
In this post, we define the number of browsers and the number of pages per browser as parameters so that they can be 
modified depending on your machine and your needs.

## Code of the parallel crawler

We use the same function as in the previous article to read the list of URLs. 
```javascript
const fs = require('fs');

function readURLFile(path) {
    return fs.readFileSync(path, 'utf-8')
        .split('\n')
        .map((elt) => {
            const url = elt.split(',')[1].replace('\r', '');
            return `http://${url.toLowerCase()}`;
        });
}
```

Then, we modify the code of the crawler presented in the first post of the series to make it parallel.
We define the number of browsers to create in a variable called `NUM_BROWSERS` and the number of pages per browser in 
the `NUM_PAGES` variable.
First, in the outer loop, we launch `NUM_BROWSERS` instances of Chrome headless.
We associate a promise to each of these browsers and we store the promise in the `promisesBrowsers` array.
Then, in the inner loop, for each browser, we create `NUM_PAGES` pages.
For each of these browsers and pages, we also associate a promise that we store in the `promisesPages` variable.
While there are URLs to fetch, i.e. `while (urls.length > 0)`, each page get an URL from the `urls` array, visit it,
and take a screenshot using the same code as the non-parallelized crawler.
When all the URLs have been processed, we resolve the pages promises using `resPage()`, we close the browser and we 
resolve every browser promises using `resBrowser`.

```javascript
const puppeteer = require('puppeteer');

const NUM_BROWSERS = 2;
const NUM_PAGES = 3;

(async () => {
    const startDate = new Date().getTime();
    const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3239.108 Safari/537.36';
    const urls = readURLFile('./urls.csv');

    const promisesBrowsers = [];
    for (let numBrowser= 0; numBrowser < NUM_BROWSERS; numBrowser++) {
        promisesBrowsers.push(new Promise(async (resBrowser) => {
            const browser = await puppeteer.launch();
            const promisesPages = [];

            for (let numPage = 0; numPage < NUM_PAGES; numPage++ ) {
                promisesPages.push(new Promise(async(resPage) => {
                    while(urls.length > 0) {
                        const url = urls.pop();
                        console.log(`Visiting url: ${url}`);
                        let page = await browser.newPage();
                        await page.setUserAgent(USER_AGENT);

                        try{
                            await page.goto(url);
                            let fileName = url.replace(/(\.|\/|:|%|#)/g, "_");
                            if (fileName.length > 100) {
                                fileName = fileName.substring(0, 100);
                            }
                            await page.screenshot({ path: `./screenshots/${fileName}.jpeg`, fullPage: true });
                        } catch(err) {
                            console.log(`An error occured on url: ${url}`);
                        } finally {
                            await page.close();
                        }
                    }

                    resPage();
                }));
            }

            await Promise.all(promisesPages);
            await browser.close();
            resBrowser();
        }));
    }

    await Promise.all(promisesBrowsers);
    console.log(`Time elapsed ${Math.round((new Date().getTime() - startDate) / 1000)} s`);

})();
```

We ran the code on the same MacBook Pro with a 4 cores i5 (2.3 GHz) connected to a gigabit connection via ethernet.
We set the number of browsers to 2 and the number of pages per browser to 3.
In total, it took 111 seconds, i.e. less than 2 minutes, to visit the 100 URLs and take a screenshot.
Compare to the non-parallelized version of the crawler, it is an improvement of 395 seconds (78%).
Thus, now it would 'only' take 13 days to crawl the top home page of the top Alexa 1M websites.