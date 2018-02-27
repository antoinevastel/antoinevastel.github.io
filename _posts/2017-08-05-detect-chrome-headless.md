---
layout: post
title: Detecting Chrome Headless
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: This post presents techniques that enables to distinguish a vanilla Chrome browser from a Chrome browser running in headless mode.
---
**Edit:** I created a library that enables to detect bots and crawlers using fingerprinting.
It is still in development but you can start using it.
The code is available on <a href="https://github.com/antoinevastel/fpscanner">Github</a>.

# What's a headless browser?
A headless browser is a browser that can be used without a graphical interface.
It can be controlled programmatically to automate tasks, such as doing tests or taking screenshots of webpages.

# Why detect headless browser?
Beyond the two harmless use cases given previously, a headless browser can also be used to automate malicious tasks.
The most common cases are web scraping, increase advertisement impressions or look for vulnerabilities on a website.

Until now, one of the most popular headless browser was PhantomJS.
Since it is built on the Qt framework, it exhibits many differences compared to most popular browsers.
As presented in this <a href="https://blog.shapesecurity.com/2015/01/22/detecting-phantomjs-based-visitors/">post</a>, it is possible to detect it using some browser fingerprinting techniques.

Since version 59, Google released a headless version of its Chrome browser.
Unlike PhantomJS, it is based on a vanilla Chrome, and not on an external framework, making its presence more difficult to detect.

In the next part, we go through several techniques that can be used to distinguish a vanilla Chrome browser from a Chrome running in headless mode.

# Detect Chrome Headless
Warning: Our tests were made only on four devices (2 Linux, 2 Mac), which means that there are likely other ways to detect Chrome headless.

## User agent
We start with the user agent that is the attribute commonly used to detect the OS as well as the browser of the user.
On a Linux computer with Chrome version 59 it has the following value: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/59.0.3071.115 Safari/537.36"

Thus, we can check for the presence of Chrome headless: 
{% highlight javascript %}
if (/HeadlessChrome/.test(window.navigator.userAgent)) {
    console.log("Chrome headless detected");
}
{% endhighlight %}

User agent can also be obtained from the HTTP headers.
However, it is trivial to spoof if it in both cases.

## Plugins
navigator.plugins returns an array of plugins present in the browser.
Typically, on Chrome we find default plugins, such as Chrome PDF viewer or Google Native Client.
On the opposite, in headless mode, the array returned contains no plugin.

{% highlight javascript %}
if(navigator.plugins.length == 0) {
    console.log("It may be Chrome headless");
}
{% endhighlight %}

## Languages
In Chrome two Javascript attributes enable to obtain languages used by the user: navigator.language and navigator.languages.
The first one is the language of the browser UI, while the second one is an array of string
representing the user's preferred languages.
However, in headless mode, navigator.languages returns an empty string.

{% highlight javascript %}
if(navigator.languages == "") {
    console.log("Chrome headless detected");
}
{% endhighlight %}

## WebGL 
WebGL is an API to perform 3D rendering in an HTML canvas.
With this API, it is possible to query for the vendor of the graphic driver as well as the renderer of the graphic driver.

With a vanilla Chrome and Linux, I obtain the following values for renderer and vendor: "Google SwiftShader" and "Google Inc.".
In headless mode, I obtain "Mesa OffScreen", which is the technology used for rendering without using any sort of window system and "Brian Paul", which is the program that started the open source Mesa graphics library.

{% highlight javascript %}
var canvas = document.createElement('canvas');
var gl = canvas.getContext('webgl');

var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
var vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
var renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

if(vendor == "Brian Paul" && renderer == "Mesa OffScreen") {
    console.log("Chrome headless detected");
}
{% endhighlight %}

Not all Chrome headless will have the same values for vendor and renderer.
Others keep values that could also be found on non headless version.
However, "Mesa Offscreen" and "Brian Paul" indicates the presence of the headless version.


## Browser features
Modernizr library enables to test if a wide range of HTML and CSS features are present  in a browser.
The only difference we found between Chrome and headless Chrome was that the latter did not have the hairline feature, which detects support for hidpi/retina hairlines.

{% highlight javascript %}
if(!Modernizr["hairline"]) {
    console.log("It may be Chrome headless");
}
{% endhighlight %}


## Missing image
Finally, our last finding, which also seems to be the most robust, comes from the dimension of the image used by Chrome in case an image cannot be loaded.

In case of a vanilla Chrome, the image has a width and height that depends on the zoom of the browser, but are different from zero.
In a headless Chrome, the image has a width and an height equal to zero.

{% highlight javascript %}
var body = document.getElementsByTagName("body")[0];
var image = document.createElement("img");
image.src = "http://iloveponeydotcom32188.jg";
image.setAttribute("id", "fakeimage");
body.appendChild(image);
image.onerror = function(){
    if(image.width == 0 && image.height == 0) {
        console.log("Chrome headless detected");
    }
}
{% endhighlight %}