---
layout: post
title: FP-Scanner, a bot detection library based on browser fingerprinting
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: xxxxx
---

I recently published a bot detection library based on browser fingerprinting: <a href="https://github.com/antoinevastel/fpscanner">FP-Scanner.</a>
In order not to be detected simply because of their user agent, bots tend to modify their user agent to pretend to be a legitimate browser.
For example, crawlers based on Chrome headless may modify their user agent from 
**Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/69.0.3071.115 Safari/537.36** to 
**Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36** 
to look like a normal Chrome.

Nevertheless, as I explained in two previous posts (<a href="{% post_url 2018-01-17-detect-chrome-headless-v2 %}">post 1</a> and <a href="{% post_url 2017-08-05-detect-chrome-headless %}">post 2</a>), 
Chrome and Chrome headless have differences in their fingerprint that can be exploited to detect them.
FP-Scanner's goal is to verify if some fingerprint attributes related to known bots such as Chrome headless or 
Phantom JS are present in the fingerprint of a browser.

You can see a demo of <a href="https://github.com/antoinevastel/fp-collect">FP-Collect</a>, the library used 
to collect fingerprints, and FP-Scanner <a href="https://antoinevastel.com/bots/"> on this page.</a>
When you visit the page, the website automatically collects the fingerprint of your browser, which helps me improve the library by fixing tests that have false positives and false negatives.

For programmers that want a simple page that can be used by a crawler to test its fingerprint, you may want to visit <a href="https://antoinevastel.com/bots/fpstructured">this page.</a>
When the page is loaded, you can run the following code to obtain both the value of the fingerprint as well as the output of FP-Scanner.


```javascript
const fp = JSON.parse(document.getElementById('fp').innerText);
const scanner = JSON.parse(document.getElementById('scanner').innerText);

console.log(scanner);
// It gives the following output:
/*  {PHANTOM_UA: {…}, PHANTOM_PROPERTIES: {…}, PHANTOM_ETSL: {…}, PHANTOM_LANGUAGE: {…}, PHANTOM_WEBSOCKET: {…}, …}
CHR_BATTERY: {name: "CHR_BATTERY", consistent: 3, data: {…}}
CHR_DEBUG_TOOLS: {name: "CHR_DEBUG_TOOLS", consistent: 3, data: {…}}
CHR_MEMORY: {name: "CHR_MEMORY", consistent: 3, data: {…}}
HEADCHR_CHROME_OBJ: {name: "HEADCHR_CHROME_OBJ", consistent: 3, data: {…}}
HEADCHR_IFRAME: {name: "HEADCHR_IFRAME", consistent: 3, data: {…}}
HEADCHR_PERMISSIONS: {name: "HEADCHR_PERMISSIONS", consistent: 3, data: {…}}
HEADCHR_PLUGINS: {name: "HEADCHR_PLUGINS", consistent: 3, data: {…}}
HEADCHR_UA: {name: "HEADCHR_UA", consistent: 3, data: {…}}
MQ_SCREEN: {name: "MQ_SCREEN", consistent: 1, data: {…}}
PHANTOM_ETSL: {name: "PHANTOM_ETSL", consistent: 3, data: {…}}
PHANTOM_LANGUAGE: {name: "PHANTOM_LANGUAGE", consistent: 3, data: {…}}
PHANTOM_OVERFLOW: {name: "PHANTOM_OVERFLOW", consistent: 3, data: {…}}
PHANTOM_PROPERTIES: {name: "PHANTOM_PROPERTIES", consistent: 3, data: {…}}
PHANTOM_UA: {name: "PHANTOM_UA", consistent: 3, data: {…}}
PHANTOM_WEBSOCKET: {name: "PHANTOM_WEBSOCKET", consistent: 3, data: {…}}
PHANTOM_WINDOW_HEIGHT: {name: "PHANTOM_WINDOW_HEIGHT", consistent: 3, data: {…}}
SELENIUM_DRIVER: {name: "SELENIUM_DRIVER", consistent: 3, data: {…}}
SEQUENTUM: {name: "SEQUENTUM", consistent: 3, data: {…}}
TRANSPARENT_PIXEL: {name: "TRANSPARENT_PIXEL", consistent: 3, data: {…}}
VIDEO_CODECS: {name: "VIDEO_CODECS", consistent: 3, data: {…}}
WEBDRIVER: {name: "WEBDRIVER", consistent: 3, data: {…}}
*/
```

Feel free to contact me if you have questions or remarks about FP-Scanner or bot detection in general.