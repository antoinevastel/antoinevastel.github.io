---
layout: post
title: New techniques to detect Chrome headless
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: This post present techniques that enables to distinguish a vanilla Chrome browser from a Chrome browser running in headless mode. It updates information presented in the post of August.
---

In August I wrote a <a href="{% post_url 2017-08-05-detect-chrome-headless %}"> post</a> on techniques to detect Chrome headless.
Since then I received messages saying that some of them were not working anymore.
After doing some tests on my computer, it happens that the techniques that used WebGL, feature detection as well 
as the size of the image used by Chrome when an image fails to load can't be used anymore to detect Chrome headless.

Thus, in this post I'll present techniques (new and from the previous post) that can be used to detect Chrome headless.

# New techniques for detection

In this part I'll present both techniques that still work as well as new techniques for detecting Chrome headless.

## User agent
We start with a naive technique already present in the previous post: the user agent.
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

## Screen resolution (New)
It is possible to obtain the screen resolution by accessing to *screen.width* and *screen.height*.
Similarly *screen.availWidth* and *screen.availHeight* returns respectively the amount of horizontal or vertical space available to the window,
i.e. the width minus elements such as the Windows taskbar.

In headless mode, we found no differences between *screen.width* and *screen.availWidth*, and *screen.height* and *screen.availHeight*.
Even when the *window-size* parameter was passed to Chrome headless, both attributes were identical.
Even though this rules may not always apply, it may give a hint about the presence of Chrome headless.

{% highlight javascript %}
if(screen.width === screen.availWidth && screen.height === screen.availHeight) {
    console.log("It may be Chrome headless");
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

## Permissions (New)

It's currently not possible to handle permissions in headless mode.
Thus, according to comments in the source code, 'In headless mode we just pretent the user "closes" any permission prompt,
without accepting or denying.'
Thus, it is possible to check for different for different permissions and see if their status is *prompt*.
If it is the case, then it is possible to measure the time to accept or refuse the permission when it is prompted.
We show an example with only the geolocation API.

{% highlight javascript %}
// isChrome is true if the browser is Chrome, Chromium but not Opera
// Opera manages permissions differently (disabled location by default) http://help.opera.com/FreeBSD/11.10/en/geolocation.html
if (isChrome) {
    var start = performance.now();
    navigator.permissions.query({name:'geolocation'}).then(function(permissionStatus) {
      console.log('geolocation permission state is ', permissionStatus.state);
      if (permissionStatus.state === 'prompt') {
        var TIME_THRESHOLD = 150; //µs
        var start = performance.now();  
        navigator.permissions.query({name:'geolocation'}).then(function(permissionStatus) {
            console.log(permissionStatus)
          if (performance.now() - start < TIME_THRESHOLD) {
            console.log("Chrome headless detected");
          } else {
            console.log('This is not Chrome headless')
          }
        });
      } else {
        console.log('This is not Chrome headless')
      }
      console.log(performance.now() - start);
    });
}
{% endhighlight %}

<script>
var start = performance.now();
    navigator.permissions.query({name:'geolocation'}).then(function(permissionStatus) {
      console.log('geolocation permission state is ', permissionStatus.state);
      if (permissionStatus.state === 'prompt') {
        var TIME_THRESHOLD = 150; //µs
        var start = performance.now();  
        navigator.permissions.query({name:'geolocation'}).then(function(permissionStatus) {
            console.log(permissionStatus)
          if (performance.now() - start < TIME_THRESHOLD) {
            console.log("Chrome headless detected");
          } else {
            console.log('This is not Chrome headless')
          }
        });
      } else {
        console.log('This is not Chrome headless')
      }
      console.log(performance.now() - start);
    });

</script>

The drawback of this method is that it will prompt the geolocation permission to normal users.

Finally, I present two other methods that were already present in the previous post.

## Plugins
*navigator.plugins* returns an array of plugins present in the browser.
Typically, on Chrome we find default plugins, such as Chrome PDF viewer or Google Native Client.
On the opposite, in headless mode, the array returned contains no plugin.

{% highlight javascript %}
if(navigator.plugins.length == 0) {
    console.log("It may be Chrome headless");
}
{% endhighlight %}

## Languages
In Chrome two Javascript attributes enable to obtain languages used by the user: *navigator.language* and *navigator.languages*.
The first one is the language of the browser UI, while the second one is an array of string
representing the user's preferred languages.
However, in headless mode, navigator.languages returns an empty string.

{% highlight javascript %}
if(navigator.languages == "") {
    console.log("Chrome headless detected");
}
{% endhighlight %}