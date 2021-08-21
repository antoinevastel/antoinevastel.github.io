---
layout: post
title: A simple crawling framework
categories: [crawler]
tags: [crawler, Puppeteer]
description: Third post of a series about crawlers. We present a simple crawling framework  based on Chrome headless and Puppeteer. We demonstrate how it can be used to increase crawling speed on Alexa top 10K.
published: false
---

In the <a href="{% post_url 2018-09-20-parallel-crawler-puppeteer %}">previous post</a>, we presented how to create a 
simple crawler capable of running multiple sites in parallel.
Nevertheless, if you try to run the code with multiple browsers and pages on a significant number of URLs, the code is 
probably going to crash or freeze since some promises will never resolve.
The program may crash for different reasons such as ...

In the post, we present a generic crawling framework that enables to run multiple brosers and pages in parallel.
The goal is to make crawling easier.
The framework will be responsible for the parallelization and error management so that you can focus on the logic 
of your framework such as the actions to perform on a page.

I do not claim this framework is the right one to solve your problem.
I write it in a way that help me speed up most of the experiments I conduct during my PhD.
You may be interested by other crawling frameworks such as XXX or XXXX.

# Overview of the framework
The framework is quite simple. It enables the following actions:
- You can execute code on a page (evaluateOnNewDocument) before the page is loaded (goto). This feature can be useful
to the change the user agent for example, or to inject code into the page.

Then, it loads a URL. Depending on whether or not the page loaded with success, there are two possible actions:
1. On success: You can execute some code if the page loads properly. For example, you may want to take a screenshot 
or get the content of a specific HTML element in the page.
2. On error: You can specify a function that is executed only when the page fails to load. You may want to save information 
about the error that occured.

In both cases, these functions return an array of URLs. Thus, it enables to add new URLs to visit while crawling. 
The URLs to visit are added to a queue and are processed in the reversed order they have beem added to the queue (LIFO).

   
## Main classes

The framework is constituted of three classes:

## Crawler
A single instance of chrome headless. 
The main functions are X and Z. 
It enables to launch crawl. 
It automatically closes the browser every Z pages visited, and manage failures, even of the whole browser, 
as well as potential freeze of Chrome headless that would engender requests that never resolve.

## CrawlerPool
This class manages a pool of crawlers, making it easier to parallelize your crawling process.

## URLManager
This class is responsible for distributing the URLs. 
For the moment it works only “locally”. 
Nevertheless, we could implement the same class where the getURL function would make a call to a remote server API. 
Moreover, it would also be better to dissociate the strategy to distribute URLs to adapt it on your need. 
Nevertheless, for most of my applications a simple LIFO strategy is often enough.

# Application: obtaining links

...

