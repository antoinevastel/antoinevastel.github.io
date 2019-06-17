---
layout: post
title: Automatically beautify JavaScript files on the fly with Puppeteer and Chrome headless
categories: [JavaScript]
tags: [Javascript, crawler]
description: This post presents how to automatically beautify and save JavaScript files with the js-beautify when using a crawler based on Chrome headless and Puppeteer.
---

This post aims at presenting how to beautify/unminify all the JavaScript files loaded in a page.
The approach proposed uses Chrome headless instrumented by Puppeteer and the **js-beautify** library.
Other approaches are possible.
For example, one could use a simple HTTP library such as urllib.request in Python or the HTTP module in NodeJS and then parse the DOM to obtain the list of scripts included in the page in order to download all of them.
While this alternative approach requires less CPU and RAM resources than running a whole headless browser, not all the pages can be properly crawled without JavaScript support.
Moreover, in the case where you are already using a crawler based on a headless browser, it is a waste of time and bandwidth to load the scripts again since they have already been loaded by the crawler.

## Example
The solution proposed in this post is based on Chrome headless instrumented with Puppeteer.
Moreover, in our example, URLs are explored sequentially.
Doing it at scale would require both making the crawler explore URLs in parallel, as well as managing errors properly to avoid crashes.

The first step consists in installing the Puppeteer and js-beautify packages using npm install.
In the terminal run the following commands:
```javascript
npm install puppeteer
npm install js-beautify
```

We import the libraries and create a function **convertURLToFileName** that is used later to hash a URL in order to obtain a file name.

```javascript
const fs = require('fs');
const crypto = require('crypto');
const beautify = require('js-beautify').js
const puppeteer = require('puppeteer');

function convertURLToFileName(url) {
  return crypto.createHash('md5').update(url).digest("hex");
}
```

The second step consists in creating an instance of Chrome headless instrumented by Puppeteer.
For each URL to crawl, we define a handler **page.on('requestfinished')** to intercept all 
request whose type is **script**.
Whenever a request corresponding to a script triggers the handler, we use the **beautify** function of the **js-beautify** library to beautify scripts on the fly.


```javascript
(async () => {
  
  // List of URLs used in the example
  const urls = [
    'https://antoinevastel.com/bots',
    'https://antoinevastel.com',
  ];

  // We create an instance of Chrome headless
  const browser = await puppeteer.launch();

  for (const url of urls) {
    const page = await browser.newPage();
    const beautifiedFilePromises = [];
    page.on('requestfinished', async (interceptedRequest) => {
      // We intercept all requests whose type is 'script'
      if(interceptedRequest.resourceType() === 'script') {
        beautifiedFilePromises.push(new Promise(async (resolve) => {
          let redirectChain = interceptedRequest.redirectChain();
          if(redirectChain.length === 0) {
            let response = await interceptedRequest.response();
            const fileName = convertURLToFileName(interceptedRequest.url());
            if (response !== null) {
              // We obtain the content of the script
              let contentRequest = await response.text();

              // We use the beautify function from the js-beautify package
              // to beautify the code of the script
              const scriptBeautified = beautify(contentRequest, { 
                indent_size: 2, 
                space_in_empty_paren: true 
              });
              // We use 'writeFile' to save the beautified content to the disk asynchronously
              // We use promises that are stored in 'beautifiedFilePromises' to ensure 
              // all files have been written before we crawl another page 
              fs.writeFile(`files/${fileName}.js`, scriptBeautified, 'utf8', (err) => {
                if (err !== null) {
                  console.error(`Could not save the beautified file: ${err.message}`);
                }
                resolve();
              });
            }
          }
        })); 
      }
    });

    await page.goto(url);
    await Promise.all(beautifiedFilePromises);
    await page.close();
  }

  await browser.close();
})();
```

A complete working example is available <a href="https://github.com/antoinevastel/blog-post-beautify-js/tree/master">on Github.</a>
