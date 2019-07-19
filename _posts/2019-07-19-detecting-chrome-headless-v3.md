---
layout: post
title: Detecting Chrome headless, the game goes on!
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: This post presents a new technique that enables to distinguish a vanilla Chrome browser from a Chrome browser running in headless mode.
---

Since the headless version of Chrome has been released in 2017, I have been trying to
create fingerprinting tests to distinguish real Chrome browsers from headless
(and often automated) Chrome headless browsers.
I have published two blog posts on this topic
in <a href="{% post_url 2017-08-05-detect-chrome-headless %}">August 2017</a> and
in <a href="{% post_url 2018-01-17-detect-chrome-headless-v2 %}"> January 2018</a>.
While I tend to play this game on the defender side, my two blog posts have also started a
cat and mouse game where <a href="https://intoli.com/blog/not-possible-to-block-chrome-headless/">companies</a> and
<a href="https://github.com/paulirish/headless-cat-n-mouse">developers</a> try to bypass
the different techniques by overriding their crawler fingerprint.

In this spirit of cat and mouse game, I have recently come up with a new detection technique
that renders all measures presented in these blog posts
(<a href="https://intoli.com/blog/not-possible-to-block-chrome-headless/">post 1</a>,
<a href="https://intoli.com/blog/making-chrome-headless-undetectable/">post 2</a>) or
these libraries (<a href="https://github.com/paulirish/headless-cat-n-mouse">library 1</a>,
<a href="https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth">library 2</a>) useless.
I may be overconfident concerning the false positive and false negative rates of my test, but I challenge you
to prove me wrong by testing it on your most advanced crawlers.


<a href="https://arh.antoinevastel.com/bots/areyouheadless" style="font-size:2.5em; margin:40px;">Click here to test your browser/crawler!</a>


Under the hood, I only verify if browsers pretending to be Chromium-based are who
they pretend to be.
Thus, if your Chrome headless pretends to be Safari, I won't catch it with my technique,
but because of the differences, it could be easily caught using many other fingerprinting techniques.



**Ph.D. opportunity:** if you are interested in doing a Ph.D. on browser fingerprinting, privacy, bot detection and/or web security, feel free to contact me by email.