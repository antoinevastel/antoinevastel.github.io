---
layout: post
title: "Bot detection 101: How to detect web bots?"
categories: [JavaScript]
tags: [Javascript, crawler]
description: This blog post presents the main bot detection techniques and explain how behavioral approaches, fingerprinting, as well as CAPTCHA can be used to detect bots.
---

This blog post is the second of a series on the basics of bot detection.
In the <a href="{% post_url 2019-12-29-families-web-bots %}">first blog post</a>, we presented the different categories of web bots, ranging from simple bots that cannot execute JavaScript to more advanced bots that leverage headless browsers.
In this blog post, we present the main techniques used to detect them.

**Disclaimer:** this article was written before I joined Datadome.

# Bot detection techniques

We can distinguish two main families of detection techniques:
1. Behavioral detection: this family of approaches leverages the user's behavior, such as mouse movements or browsing speed, to predict whether a user is human or not.
2. Fingerprinting-based detection: this second family of approaches leverages information about the device and the browser, such as the browser version, the Operating System (OS) or the number of CPU cores.

## Behavioral detection

Behavioral approaches rely on the hypothesis that humans and bots don't behave the same.
Intuitively, we can imagine than bots tend to be faster than humans, or may not move their mouse when they navigate to different pages.
The fact that humans and bots don't behave the same is a strong hypothesis.
While it may be the case for naive bots, it is also possible to develop smart bots that exhibit human behavior.

Nevertheless, even when smart bots mimic human behavior, these approaches are still valuable.
Indeed, by forcing bots to change their behavior to appear more humans, it often results in them performing tasks slower, making them less rentable.

Besides navigation speed, behavioral approaches also apply heuristics or machine learning techniques on features extracted from the user interactions.
We present examples of features and classify them into two categories depending on where they are collected: server-side and client-side.

### Server-side features
To model the user's behavior, one can extract features from its requests, such as:
- The number of pages seen during a session;
- The total number of requests;
- The order of the pages seen (is there a pattern in the way pages are seen ? For example *url.com/test?item=1* ... *item=N*). To be more efficient, a bot may be tempted to enumerate all pages that follow a certain pattern, whereas humans may be slightly more chaotic.
- The average time between two consecutive pages;
- The kinds of resources loaded (some bots tend to block resources such as CSS, images, ads, and trackers since they are not useful for their task and requires bandwidth).

### Client-side features
Another source of behavioral features come from information collected in the browser, such as mouse and keyboard events.
For example, the following events can be collected using JavaScript:
- <a href="https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event">Mouse movements</a>;
- <a href="https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event">Mouse clicks</a>;
- <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event">Scroll;</a>
- <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document/keydown_event">Key pressed</a>, as well as the time between two consecutive keys pressed.

These features can then be used in heuristics and machine-learning models to predict if a user is human.
One of the limits of behavioral approaches lies in the amount of data they require before they can accurately classify whether a user is a human or a bot.
Indeed, while not using the mouse on a few pages can be normal,
it may become suspicious after 10 pages.
Thus, while in the long run, it may be effective to detect bots, it can struggle to detect them quickly.
This can be a problem against large-scale distributed crawlers, i.e. crawlers that run on multiple machines with different IP addresses.

Moreover, to keep track of a user's behavior during a session, these approaches often rely on session cookies.
However, since these cookies can easily be deleted, it is also safe to link the user's behavior to its IP address (a sort of IP reputation).
Thus, behavioral approaches are vulnerable against bots that frequently changes their IP address using proxy rotating services.


## Fingerprinting-based detection
A second family of detection approaches leverages fingerprinting.
Fingerprinting consists in collecting a set of attributes related to a device or a browser to characterize it.
What we call a fingerprint is simply the combination of all the attributes collected.
Fingerprinting can be used for several purposes:
1. Tracking, as a mechanism to regenerate cookies (<a href="https://hal.inria.fr/hal-01652021">I talk about this topic in one of the papers I published during my Ph.D. </a>);
2. Security, both to enhance authentication and to detect bots.

When fingerprinting is used for tracking, e.g. to regenerate deleted cookies, fingerprinters try to obtain a fingerprint as unique as possible to uniquely identify a device.
On the contrary, when fingerprinting is used for security, fingerprint attributes aim to obtain information about the nature of the device and the browser, such as the OS and the browser version.
In a security context, it's safe to assume that attackers are likely to lie on their fingerprints.
That's why security fingerprinting scripts tend to collect multiple attributes to correlate if their values are consistent with each other, or if some of them have been spoofed, i.e. purposefully modified.
I talk more about the topic of fingerprint consistency in this <a href="https://antoinevastel.com/tracking/2018/07/01/eval-canvasdef.html">blog post</a> and this <a href="https://hal.inria.fr/hal-01820197">paper.</a>

### Browser fingerprinting
Browser fingerprinting leverages JavaScript as well as the HTTP headers sent by the browser.
To detect bots, the idea is to collect information about the device, the OS and the browser.
Then, the fingerprint is sent back to a server that will apply heuristics to detect if the fingerprint belongs to known bots or if
it has been modified to try to hide the presence of a bot.
It's rather uncommon to apply detection heuristics directly in the browser since bot developers could easily get their hand on the fingerprinting
script (it's sent to the browser) and then look at it to understand why they are detected.
That's also the reason why these scripts tend to be obfuscated.

The next paragraphs provides more details regarding the attributes collected by bot detection fingerprinting scripts.
Theses scripts test the presence of attributes added by headless browsers or instrumentation frameworks:
- ```window.callPhantom```, ```window._phantom```, ```window.phantom``` for PhantomJS;
- ```window.__nightmare``` for Nightmare;
- ```navigator.webdriver``` for different automated browsers, ranging from Headless Chrome with Puppeteer, to Firefox with Selenium;
- ```document.__selenium_unwrapped```, ```document.__webdriver_evaluate```, ```document.__driver_evaluate``` as well as other properties that can be used to detect different kinds of browsers instrumented with Selenium.

Nevertheless, as we'll discuss in the next blog post, these attributes can be removed by bot developers.
That's why security fingerprinting scripts tend to go further by checking if the browser fingerprint has been modified.
To do it they also conduct consistency checks, such as the ones I present in my <a href="https://hal.inria.fr/hal-01820197">FP-Scanner paper</a>.

**Browser consistency.** The scripts verify if the user lied on the nature of the browser contained in the user agent.
They can do it using feature detection, i.e. testing if some features that should be present or not for the pretended browser are present, or by executing short JavaScript challenges.
The code snippet below shows a challenge that verifies the length of the string representation of the native eval function:
```javascript
eval.toString().length
```
While on Firefox and Safari it returns 37, it returns 33 on Chrome, and 39 on Internet Explorer.
Thus, in case a browser pretends to be Firefox in its user agent, but has a test that returns the 33, there is a chance it is a bot (or a user with a user agent spoofer).

**OS consistency.** Similarly, other tests aim to verify if the OS claimed in the user agent has been modified.
A simple test consists to verify if the OS contained in the user agent is consistent with the value of ```navigator.platform```, an attribute that returns the platform the browser is running on.
The list hereafter presents a mapping between the OS and some values returned by ```navigator.plaform```:
- Linux -> Linux i686, Linux x86_64 
- Windows -> Win32, Win64
- iOS -> iPhone, iPad
- Android -> Linux armv71, Linux i686
- macOS -> MacIntel
- FreeBSD -> FreeBSD amd64, FreeBSD i386

**Inconsistent feature behavior**
Although some features are available in the browser, their value may vary depending on whether the browser is running in headless mode or not.
Thus, a wide set of tests specifically aim to detect if the browser is running in headless mode.
Most of these tests target Headless Chrome as it has become the go-to solution to create bots.
Multiple commercial bot detection scripts used tests that I already presented on these two blog posts (<a href="{% post_url 2017-08-05-detect-chrome-headless %}">detecting headless Chrome v1</a>, <a href="{% post_url 2018-01-17-detect-chrome-headless-v2 %}">detecting headless Chrome v2</a>).
These tests aim to detect if features behave as they should behave in a normal Chrome, or if they behave as in Headless Chrome.
One of the examples taken from one of my previous blog post was the inconsistent behavior of the permission API.
```javascript
navigator.permissions.query({name:'notifications'}).then(function(permissionStatus) {
    if(Notification.permission === 'denied' && permissionStatus.state === 'prompt') {
        console.log('This is Chrome headless')	
    } else {
        console.log('This is not Chrome headless')
    }
});
```
In Headless Chrome, the previous test returns contradictory values.
On the one hands it claims that permission to send notifications is **denied** when using **Notification.permission**.
On the other hands it returns **prompt** when using **navigator.permissions.query**.

**Red pills** can be seen as techniques to fingerprint the system.
The idea behind red pills is to detect if a program, in our case a browser, is running in a virtual machine.
For (web) bot detection, we are interested in red pills that can run in a browser.
The reason red pills are interesting for bot detection is that crawling at scales requires significant infrastructure.
Generally, one of the easiest technique to obtain this infrastructure is  to use VMs from cloud providers, such as AWS and Azure.
Moreover, because the majority of users generally don't use browsers in VM to browse the web, it is relatively safe to assume that detecting browsers running in a VM is a strong signal of a non-human user.
If you want to learn more about red pills, I advise you to read this great paper: <a href="https://www.usenix.org/system/files/conference/woot14/woot14-ho.pdf">Tick Tock: Building Browser Red Pills from Timing Side Channels</a>
If you want to learn more about this topic, you can also have a look at the code of <a href="https://github.com/antoinevastel/fp-collect/blob/master/src/fpCollect.js">fp-collect</a>, a (unmaintained) fingerprinting library for bot detection.

Of course, the list of fingerprinting challenges presented in this blog post is not exhaustive.
There are many ways to detect bots, even when they try to hide their presence by modifying their fingerprints.
However, since it's an introduction, and also because I don't want to make my job more difficult, I won't reveal them here ;)

## CAPTCHAs
The last detection technique we present in this blog post is CAPTCHA.
CAPTCHAs leverage Turing tests, such as image and audio recognition to distinguish between bots and humans.
Others, such as Geetest (see image below), ask you to solve a puzzle.

<img src="/assets/media/captcha-geetest.png">

The reason CAPTCHAs based on image and audio recognition are so popular is that, until recently, these tasks were difficult to solve by programs.
However, with recent progress in automatic and audio recognition, the situation has evolved.
Moreover, solving image and audio recognition tasks help company hosting these CAPTCHAs to label data to train their machine learning models

## Conclusion

There is no silver bullet when it comes to bot detection.
Each technique has their pros and cons.
Behavioral and fingerprinting detection operate at different layers and rely on different features.
Browser fingerprinting is fast at taking a decision contrary to behavioral based approaches.
After a fingerprint is collected, we can already classify a user as human or a bot.
Collecting more fingerprint does not provide more information and does not help to make the classification more accurate, contrary to behavioral-based approaches that tend to get better the more data they can leverage.
In the case the decision is based on HTTP fingerprints, one can even block a bot
before it loads a page.
CAPTCHAs are also effective to detect bots.
However, they negatively impact user experience and can't be used in all situations: who would solve a CAPTCHA to watch an ad in order to avoid ad fraud?
Moreover, as we'll show in the next blog post of this series on bot detection, CAPTCHAs can be solved by bots using image and audio recognition techniques, as well as using CAPTCHA farm services, such as 2Captcha.

If you are passionate about bot detection and want to discuss about this topic, feel free to reach out to me on Twitter/Linkedin.
Bonus point, we may have opened positions (technical but not only) at <a href="https://datadome.co/">Datadome</a> to fight against bad bots.