---
layout: post
title: "A common mistake while monitoring HTTP responses with Puppeteer"
categories: [Puppeteer]
tags: [Puppeteer]
description: In this blog post, we show how to solve a common bug while monitoring HTTP responses with Puppeteer.
---

**TL;DR**: Add this following line of code, even if you just care about HTTP responses.
```javascript
page.on('request', (request) => { request.continue()})
```
<br><br>


I write this blog post mostly for myself, since every few months, I tend to encounter the same bug where I need to monitor HTTP responses using Puppeteer, and I don't understand why my page doesn't load.
Then I start Googling stuff like "Puppeteer monitor response stuck MacOS", "setRequestInterception doesn't load".
Then, after a few minutes, I start to remember that I need to call ```request.continue()```, even if I'm only interested in HTTP responses.

## Monitoring HTTP requests
Before we see how to monitor HTTP responses with Puppeteer, let's first see how we can monitor HTTP requests.
Basically, to do this, you only need to allow request interception, and to define a listener on ```'request'```.
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setRequestInterception(true)

  page.on('request', (request) => {
    console.log('Request: ', request.method(), request.url())
    request.continue()
  })

  await page.goto('https://antoinevastel.com/')
  await browser.close()
})()
```

If you launch this program, you get the following output:
```shell
Request:  GET https://antoinevastel.com/
Request:  GET https://antoinevastel.com/assets/resources/bootstrap/css/bootstrap.min.css
Request:  GET https://antoinevastel.com/assets/resources/font-awesome/css/font-awesome.min.css
Request:  GET https://antoinevastel.com/assets/resources/syntax/syntax.css
Request:  GET https://antoinevastel.com/assets/css/style.css
Request:  GET https://antoinevastel.com/assets/resources/jquery/jquery.min.js
Request:  GET https://antoinevastel.com/assets/resources/bootstrap/js/bootstrap.min.js
Request:  GET https://antoinevastel.com/assets/js/app.js
Request:  GET https://www.gravatar.com/avatar/42c0cef4d509eedea70a02b9a4276913?s=35
...
```

## Monitoring HTTP responses

If you're only interested in monitoring HTTP responses and not HTTP requests, you may be tempted to adapt the previous program as follows:
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setRequestInterception(true)

  page.on('response', (response) => {
    console.log('Response: ', response.status(), response.url())
  })

  await page.goto('https://antoinevastel.com/')

  await browser.close()
})()
```

However, if you do this, you won't see any response logged in your terminal.
If you are in non-headless mode, you'll also see that the page doesn't load.

The reason is simple, it's because you forgot this line:
```javascript
request.continue()
```

Indeed, even if you don't care about outgoing HTTP requests, you still need to call ```request.continue()```.
As stated in the [official documentation](https://pptr.dev/#?product=Puppeteer&version=v5.5.0&show=api-pagesetrequestinterceptionvalue): 
> "Once request interception is enabled, every request will stall unless it's continued, responded or aborted"

Thus, the final version of your program to monitor HTTP responses should also include a listener to ```'request'``` that calls ```request.continue()```:
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on('request', (request) => { request.continue()})

  page.on('response', (response) => {
    console.log('Response: ', response.status(), response.url())
  })

  await page.goto('https://antoinevastel.com/')

  await browser.close()
})()
```

With this version, the page loads properly, and you can see the HTTP responses in the terminal:
```shell
Response:  200 https://antoinevastel.com/
Response:  200 https://antoinevastel.com/assets/resources/bootstrap/css/bootstrap.min.css
Response:  200 https://antoinevastel.com/assets/media/antoinevastel.jpeg
Response:  200 https://antoinevastel.com/assets/resources/syntax/syntax.css
Response:  200 https://antoinevastel.com/assets/js/app.js
Response:  200 https://antoinevastel.com/assets/resources/font-awesome/css/font-awesome.min.css
Response:  200 https://antoinevastel.com/assets/resources/bootstrap/js/bootstrap.min.js
Response:  200 https://antoinevastel.com/assets/resources/jquery/jquery.min.js
Response:  200 https://antoinevastel.com/assets/css/style.css
...
```
<br><br>
If you are interested in bots, the different automation frameworks, or headless browsers, you can check my new Github repository: [Bots Zoo](https://github.com/antoinevastel/bots-zoo).
It aims to showcase how to use the main bot technologies like Puppeteer, Selenium, and Playwright using several browsers such as (Headless) Chrome, (Headless) Firefox, and (Headless) Safari/WebKit.
