---
layout: post
title: A simple crawler using Chrome headless with Puppeteer
categories: [crawler]
tags: [crawler, Puppeteer]
description: First post of a series about crawlers. We present how to use Chrome headless with Puppeteer to take screenshots of the home page of the 100 most popular websites.
published: true
---

This post is the first of a series about crawlers.
Crawlers are programs browsing the web to collect data present on websites.
There exist different solutions for crawling:
1. You can request HTML pages doing simple HTTP requests. For example, you can use Curl, the urllib module in Python or the request module in Node.
While this approach has a low overhead in term of CPU and memory consumption, it is not possible 
to collect content generated dynamically via JavaScript.

2. A second approach is to instrument Chrome or Firefox using a library such as Selenium.
Contrary to the first approach, it enables to get content generated using JavaScript but 
it adds more overhead.
Moreover, it needs to be used with XVFB to render the content if it is used on a server.

3. The last approach is to use headless browsers.
A headless browser is a browser that can be used without a graphical interface.
They have a lower overhead compared to the non-headless browsers instrumented (strategy 2), 
all while being able to get content generated using JavaScript.
Until recently, PhantomJS used to be one of the most popular headless browsers.
Now, the most popular is Chrome headless, which is often instrumented using the Puppeteer library.

That is why in this series of posts, we will focus on Chrome headless and Puppeteer.
The next part of this post presents how to build a simple crawler using Chrome headless and 
Puppeteer in order to take screenshots of the 100 most popular websites.

## A simple example: crawling 100 websites

The goal of our program is to crawl the 100 most popular websites based on the Alexa list, and 
for each of them, to take a screenshot of the home page.
First, we define a function *readURLFile* to read the URL file.
You can find a copy of the file <a href="/assets/media/urls.csv">here</a>.

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

Then we write the code related to the crawler.
We start by importing the Puppeteer library.
Be sure to install it using `npm install puppeteer`.
For each URL loaded from the file, we create a new page.
We override the default user agent in order to decrease our chance to be blocked by websites.
Using the `goto` function, we load the page, and then take a screenshot of the page that we store 
in a `screenshots` folder.
The code to visit the page and save the image is wrapped in a `try-catch` in order to catch errors 
such as a timeout when loading the page.

```javascript
const puppeteer = require('puppeteer');

(async () => {
    const startDate = new Date().getTime();
    const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3239.108 Safari/537.36';
    const urls = readURLFile('./urls.csv');
    const browser = await puppeteer.launch();

    for (let url of urls) {
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

    await browser.close();
    console.log(`Time elapsed ${Math.round((new Date().getTime() - startDate) / 1000)} s`);

})();
```

We ran the code on a MacBook Pro with a 4 cores i5 (2.3 GHz).
The computer was connected to the internet via ethernet cable on a gigabit connection.
In total, it took 506 seconds to execute, which is quite slow to visit only 100 URLs.

## Conclusion

In this post, we used Puppeteer and Chrome headless to crawl the 100 most popular websites 
and take screenshots of their home page.
While it was simple to write the code of the crawler, it still needs more than 8 minutes to 
crawl only 100 pages.
In proportion, it would take approximately 58 days to crawl to top Alexa 1 million.
In the next post, we will show how you can easily parallelize 
your crawling process by spawning multiple browsers and using multiple pages.
