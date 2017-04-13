---
layout: post
title: History stealing using timing attack
categories: [Security, Privacy]
tags: [Javascript, Security, Privacy]
description: Presentation of a side channel attack that leverages time to deduce if a user has visited a link or not. 
---

<style type="text/css">
#test-area {
    	position:fixed;
	top: 0; left: 0;
	right: 0; bottom: 0;
-webkit-transform: translate3d(0, 0, 0);
-webkit-backface-visibility: hidden;
-webkit-transform: translateZ(0);
-webkit-perspective: 1000;
	z-index: -1;
	filter: blur(15px) blur(15px) ;
	-webkit-filter: blur(15px) blur(15px) ;
	pointer-events: none;
}

#test-area a:visited{
	color:red;
}

#test-area a:visited, #links a:visited {
  	color: red;
}
#links > li::before {
	  font-family: monospace;
	  margin-right: 5px;
	  content: "[ ]";
}
#links > li.visited::before {
  	content: "[v]";
}
.details {
	  font-size: 80%;
	  color: gray;
}
</style>


You wouldn't like any website to be capable of guessing previous websites you visited. 
By knowing that you visited a competitor website, or that you visited certain webpages they could try to make use of this information to use it against you, or at least, in a way that could influence your behavior for example to sell you a product.
But it's to late, it's already possible for them to do it.

Most used browsers such as Chrome, Firefox, Safari do not offer any Javascript API to request browsing history.
Therefore, it is not possible to simply ask for it.
It is necessary to use a trick to obtain the list of websites visited.

We first start by presenting the most known bug that was used to obtain someone's history.
Even though it has been fixed, it enables to understand how simple CSS properties may result in huge privacy leaks.

## Stealing history, the old way

The first major bug was revealed around 2002.
It made use of the fact that depending on whether or not you have visited a url, then the link pointing to this url can be displayed differently by using CSS properties.
The image below illustrates our point: the visited link is purple whereas the link that hasn't been visited is blue.

<img src="/assets/media/links_visited.png"/>

To do this you just need to use the **a:visited** CSS selector, and apply a different style, for example the size or the color of the link.
Then you enumerated the links you wanted to test, and for each of them, you requested the size or the color of the link using Javascript.
If the link had the size or the color you set for visited links, then you could guess that the user had visited the current url.
Otherwise, you knew he didn't visit it.

This solution was not perfect since you didn't get directly the urls visited, but you instead had to enumerate them.
It has been fixed by allowing only a subset of properties on visited links.
Now, it is only possible to change color related properties on visited links as explained in <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Privacy_and_the_:visited_selector">this article</a>.

Moreover, whenever a script tries to access to the color of a link by using Javascript, it always returns the color associated with unvisited links.
Thus, it is not possible for an attacker to distinguish between visited and unvisited urls.

Allowing only to change color properties might seem a bit too restrictive. 
For example, they could have let the possibility to change the size of visited links and when someone would request for this property, then simply return the default size associated to unvisited links.
However, changing size of an element induces side effects such as moving other elements situated around this link.
By using these side effects it wouldn't have been much more difficult to detect whether or not a link had been visited. 

## Stealing history, the (not so) new way

The technique we are going to present in this part has been reported by Paul Stone to Chrome and Firefox in 2013(links for <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=884270">Firefox</a> and for <a href="https://bugs.chromium.org/p/chromium/issues/detail?id=252165">Chrome</a>).
However, since then nothing has been really made to fix these issues and it is still possible to use it to obtain someone's history.

In the previous chapter we saw that by using the difference of color or size between visited and unvisited links, we could infer whether or not a user had been on a given website.
Even though this bug has been fixed, it is still possible to enumerate history by using an other side channel: time.

The main idea is to find a function that takes different amount of time when applied on visited and unvisited links.
The function used in our case is a CSS property that enables to apply blur on an element, here a link.

The protocol is the following:

1. We place a large number of links pointing to an unvisited URL.
2. Using CSS we apply the **text-shadow** property on these links. The value of blur must not be too small, we'll explain the reason later.
3. Then we set the urls of the links defined in step 1, to the url we want to test.
4. By using **requestAnimationFrame** we measure how long the frames take to draw. If the new url has been visited, then the browser will have to redraw all of the links to apply the a:visited color style. On modern computers and browsers this operation is quite fast. That is the reason why we set many links, and we apply the text-shadow property with a significant value of blur. Thus, if a redraw is needed, then it will take more time, and we will be able to detect it. In the case where the new url hasn't been visited, no redraw occurs.

For our test to be effective we need a baseline time series that corresponds to the amount of time needed when no redraw event occurs.
To do so, we make all of our links point to a randomly generated url that we know has never been visited before.
Then, we make all the links point to a new randomly generated url that has also not been visited, and we measure the time needed for the next frames to be drawn.
Thus, we obtain our baseline time series that we will use for further comparisons.
Then, for all the links we want to test, we apply the protocol explained previously and we compare the two times series using the median.
If we see a non significant difference, then we consider that the link has been visited.

In this process, we need to fix the value of several parameters such as the number of links, their length, the blur in pixels (text-shadow property).
Optimizations are possible to find parameter values that makes the process faster.
We can adjust these parameters because we always have a url the user has visited: the current webpage he is seeing.
Thus, we can use it as the ground truth during our optimization process.

It is important to keep in mind that in contrary to the previous technique presented at the begining of the article, errors can occur since it relies on time needed for a function to be executed.
The time may be influenced by external factors such as the fact that the browser is loading other pages that execute Javascript.

## Countermeasures that work ... or not ?

In the previous I said that even though this bug was reported in 2013, no fixed had been made since then.
This is not exactly true. 
No useful fixes have been made.

The attack we described makes use of time to infer information.
It belongs to a kind of attacks called timing attacks.

One of the countermeasures implemented in the browsers was to degrade the accuracy of Javascrip timers.
They now have an accuracy of at most **5µs** (<a href="https://developer.mozilla.org/en-US/docs/Web/API/Resource_Timing_API">more details here</a>).
This lack of accuracy had for goal to mitigate the effectiveness of the previous attack since it would be more difficult to distinguish between the two events (redraw and no redraw).

However, Schwarz and al. showed that this countermeasure was a quick-fix that gives a false sense of security since it doesn't really protect the users.
Indeed, using several mechanisms available in the browsers, it is still possible to obtain good time measurement, even better than the one provided by the javascript APIs.

The following example presents the code provided in their article *"Fantastic Timers and Where to Find Them: High-Resolution Microarchitectural Attacks in JavaScript"*.
It makes use of SharedArrayBuffer and webWorkers to build a homemade clock.

{% highlight javascript %}
// Timing measurement example

var buffer = new SharedArrayBuffer(16);
var counter = new Worker("counter.js");
counter.postMessage([buffer], [buffer]);
var arr = new Uint32Array(buffer);

...

timestamp = arr[0];
{% endhighlight %}

{% highlight javascript %}
// counter.js

self.onmessage = function(event){
	var [buffer] = event.data;
	var arr = new Uint32Array(buffer);
	while(1){
		arr[0]++;
	}
}
{% endhighlight %}

The principle is the following: the first snippet of code creates a SharedArray and sends a message to the webworker counter.js that is being executed in an other thread.
When counter.js receives the message it starts incrementing continuously a counter contained in the sharedArrayBuffer, without checking for any events on the event queue.
Thus, the main thread simply has to read directly the value of this counter from the shared buffer, and can use it as a high resolution timestamp.
According to them, the resolution of this technique is close to the resolution of the native timestamp counter.

However, in our case we didn't need such a precision to run our attack but it shows that solving side channel attacks is not as simple as it might seem.

An effective way to solve this issue in Firefox is to go in the **about:config** panel and then change the value of **layout.css.visited_links_enabled** to **false**.

## Demo

Below you can see the results of the attack run on your browser (no data is shared, it's only in local).
Normally, the results should have appeared below.
If it is not the case, wait a little bit.
Otherwise, you can relaunch it by clicking on the button.
Since it is a timing attack, it might by sensible to external factors, one of the most important is the fact that you scroll while a test is being run (particularly for Chrome since there seems to be a problem with position:fixed).

<button id="launch-test">Launch attack</button>
<div id="wait-area"></div>
<div id="test-area"></div>
<ul id="links"></ul>


<script src='/assets/js/stealhist.js' type="text/javascript"></script>
