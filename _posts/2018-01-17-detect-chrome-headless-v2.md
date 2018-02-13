---
layout: post
title: Detecting Chrome headless, new techniques
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: This post presents techniques that enables to distinguish a vanilla Chrome browser from a Chrome browser running in headless mode. It updates information presented in the post of August.
---

**Edit:** After the post got some attention on Hacker news, Paul Irish created 
a <a href="https://github.com/paulirish/headless-cat-n-mouse">Github repository</a> that models a game between a website that wants to detect the presence 
of Chrome headless, and a Chrome headless instance that tries to look like a non headless Chrome.

In August I wrote a <a href="{% post_url 2017-08-05-detect-chrome-headless %}"> post</a> on techniques to detect Chrome headless.
Since then I received messages saying that some of them were not working anymore.
After doing few tests on my computer, it happens that the last three techniques that used WebGL, feature detection as well 
as the size of the image used by Chrome when an image fails to load can't be used anymore to detect Chrome headless.

Thus, in this post I'll present techniques (new and from the previous post) that can be used to detect Chrome headless.

## User agent (Old)
We start with a naive technique already presented in the previous post: the user agent.
It is the attribute commonly used to detect the OS as well as the browser of the user.
On a Linux computer with Chrome version 63 it has the following value: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/63.0.3071.115 Safari/537.36"

Thus, we can check for the presence of Chrome headless: 
{% highlight javascript %}
if (/HeadlessChrome/.test(window.navigator.userAgent)) {
    console.log("Chrome headless detected");
}
{% endhighlight %}

User agent can also be obtained from the HTTP headers.
However, it is trivial to spoof if it in both cases.

## Webdriver (New)

In order to automate Chrome headless, a new property *webdriver* is added to the navigator object ([see Chromium code](https://cs.chromium.org/chromium/src/out/Debug/gen/blink/bindings/core/v8/V8Navigator.cpp?rcl=0d3c47615a4f512b82fa0f8da682fb13332b8d32&l=405)).
Thus, by testing if the property is present it is possible to detect Chrome headless.

{% highlight javascript %}
if(navigator.webdriver) {
    console.log("Chrome headless detected");
}
{% endhighlight %}

## Chrome (New)

*window.chrome* is an object that seems to provide features to Chrome extension developpers.
While it is available in vanilla mode, it's not available in headless mode.

{% highlight javascript %}
// isChrome is true if the browser is Chrome, Chromium or Opera
if(isChrome && !window.chrome) {
    console.log("Chrome headless detected");
}
{% endhighlight %}

## Permissions (New)

It's currently not possible to handle permissions in headless mode.
Thus, it leads to an inconsistent state where *Notification.permission* and *navigator.permissions.query* report
contradictory values.

{% highlight javascript %}
navigator.permissions.query({name:'notifications'}).then(function(permissionStatus) {
    if(Notification.permission === 'denied' && permissionStatus.state === 'prompt') {
        console.log('This is Chrome headless')	
    } else {
        console.log('This is not Chrome headless')
    }
});
{% endhighlight %}

Finally, I present two other methods that were already present in the previous post.

## Plugins (Old)
*navigator.plugins* returns an array of plugins present in the browser.
Typically, on Chrome we find default plugins, such as Chrome PDF viewer or Google Native Client.
On the opposite, in headless mode, the array returned contains no plugin.

{% highlight javascript %}
if(navigator.plugins.length === 0) {
    console.log("It may be Chrome headless");
}
{% endhighlight %}

## Languages (Old)
In Chrome two Javascript attributes enable to obtain languages used by the user: *navigator.language* and *navigator.languages*.
The first one is the language of the browser UI, while the second one is an array of string
representing the user's preferred languages.
However, in headless mode, navigator.languages returns an empty string.

{% highlight javascript %}
if(navigator.languages === "") {
    console.log("Chrome headless detected");
}
{% endhighlight %}

**PhD opportunity:** if you are interested in doing a PhD on browser fingerprinting and/or privacy, feel free to contact me by email.