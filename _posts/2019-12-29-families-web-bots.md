---
layout: post
title: "Bot detection 101: Categories of web bots"
categories: [crawler]
tags: [Javascript, crawler, bots]
description: This blog post is the first of a series on bot detection. In this blog post, we classify web bots into 3 categories depending on the technological stack they use. We go through each of these categories and present their main pros and cons depending on the use case and the type of website the web bots operate on.
---

When I was finishing my Ph.D. I started to write a blog post about the basics of web bots and bot detection.
As of today, it has become relatively long but I haven't fond the time to finish it yet.
That's why I've decided to split it into multiple blog posts.

The first blog post of this series starts with a presentation of the different categories of web bots.
In the next blog posts, we'll discuss bot detection techniques and their resilience against the different bot categories.

# What is a web bot ?

A web bot is a program that automates tasks on the web.
The main reason to use bots instead of doing these tasks manually is mostly to achieve greater throughput, all while decreasing costs.
Web bots are used for several applications ranging from website automated testing to less ethical tasks,
such as <a href="https://www.owasp.org/index.php/OAT-003_Ad_Fraud">ad-fraud</a> or
<a href="https://www.owasp.org/index.php/Credential_stuffing">credential stuffing</a>.
Another common use-case for web bots is crawling, a task that consists in automatically gathering website content.

In this series of blog posts, we focus on crawlers, i.e. bots used to automatically gather content.
Nevertheless, most of the concepts presented transpose to bots used for other purposes.

*Disclaimer*: Respect the robots.txt policy of websites you want to crawl. Moreover, even if a website agrees to be crawled, use rate-limiting to decrease the impact of your crawler on the website.

# Categories of bots
We can categorize bots in three main categories depending on their technological stack:
- Capacity to execute JavaScript;
- Instrumentation framework;
- Use of a real browser;
- Use of a headless browser.

Each category has its pros and cons depending on the use case as well as the kind of website crawled (single page app, static content).

## Simple HTTP request libraries (bots 1)
The most simple web bots leverage HTTP request libraries, such as the <a href="https://docs.python.org/3/library/urllib.html">urllib</a> in Python or
the <a href="https://nodejs.org/api/http.html">http</a> request module in NodeJS.
While this kind of bots requires few CPU and RAM resources, it fails to loads pages with dynamic content, such as single page app (SPA), because it can't execute JavaScript code.
However, a possible solution to address the non-execution of JavaScript is to directly make GET or POST requests to the APIs responsible for loading the dynamic content of the page.
Moreover, since these bots are not based on an instrumented browser, they often need to rely on external libraries such as <a href="https://www.crummy.com/software/BeautifulSoup/">Beautiful Soup</a>
and <a href="https://cheerio.js.org/">Cheerio</a> to efficiently parse HTML and extract content.

The snippet below shows an example of a bot that leverages the urllib.request with BeautifulSoup to get the title of one of the pages of my website.

```python
import urllib.request
from bs4 import BeautifulSoup

url = "https://arh.antoinevastel.com/bots/areyouheadless"
page = urllib.request.urlopen(url)

soup = BeautifulSoup(page, features="html5lib")
h1 = soup.find("h1")
print(h1) # <h1>Are you chrome headless?</h1>
```

## Real browsers (Chrome, Firefox) instrumented with Selenium/Puppeteer (bots 2)

<a href="https://www.seleniumhq.org/">Selenium</a> and
<a href="https://pptr.dev/">Puppeteer</a> are browser automation frameworks.
They enable to automate tasks in a browser, such as loading a page, moving
the mouse or typing text using code.
While Puppeteer is mostly used to automate Chrome and Headless Chrome from NodeJS, Selenium can be used to automate a wide range of browsers, such as Firefox, Chrome, and Safari, using different programming languages (NodeJS, Python, Java).

Contrary to the first category of bots based on HTTP request libraries,
this kind of bots supports JavaScript execute since they are based on a real browser.
Nevertheless, automating a real browser comes at a cost:
it requires more CPU and RAM resources.
Indeed, while bots from category mostly use bandwidth, this family of bots also
requires the same CPU and memory resources as a normal browser you would use on your machine.
Thus, scaling to 100s of pages crawled in parallel can become a problem on low-end machines.
Moreover, you can't directly use this kind of bots on servers since they don't have any display server.
Thus, to address this problem, crawlers often leverage <a href="https://en.wikipedia.org/wiki/Xvfb">XVFB</a> (X virtual framebuffer), an X display server.

## Headless browsers (bots 3)

The last category of web bots leverage instrumented headless browsers.
Headless browsers are browsers that can be used without a graphical interface.
Contrary to the previous family of bots (bots 2), it does not
require to use XVFB for display.
One of the first popular headless browsers
was <a href="https://phantomjs.org/">PhantomJS</a>.
Contrary to bots 2, PhantomJS required significantly less CPU and RAM
resources, all while being able to execute JavaScript.

In 2017, Google released Headless Chrome, the headless version
of Google Chrome, which led to PhantomJS to stop being maintained.
Headless Chrome is actively maintained and can be instrumented using the low-level Chrome Devtools Protocol (CDP).
However, since writing all the tasks using CDP can be cumbersome,
several instrumentation frameworks, such as Puppeteer, have been developed.
Since Headless Chrome supports almost all of the features of a normal Chrome browser, websites visited by such bots tend to be quite similar to what a human would see.
Thus, it has become the go-to solution for a wide range of applications
ranging from automated tests to credential stuffing and crawling.
Concerning the CPU and RAM overhead, Chrome headless sits between
bots of category 1 based on HTTP-request libraries and bots of categories 2 based on normal
instrumented browsers.

If you want to learn how to make crawlers based on Puppeteer and Headless Chrome, you can read some of my previous blog posts (<a href="{% post_url 2018-09-17-simple-crawler-puppeteer %}">simple crawler with Puppeteer</a>, <a href="{% post_url 2018-09-20-parallel-crawler-puppeteer %}">parallel crawler with Puppeteer</a>).

In the next blog post (coming soon hopefully), we'll present how the different categories of bots presented in this blog post can be detected.