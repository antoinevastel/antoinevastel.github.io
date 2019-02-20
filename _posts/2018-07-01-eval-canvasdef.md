---
layout: post
title: Evaluating the privacy implications of a canvas fingerprinting countermeasure
categories: [tracking]
tags: [tracking, browser fingerprinting]
description: Because of their side effects, browser fingerprinting countermeasures may have a negative impact on users privacy. In this post we look more in details at Canvas Defender, a canvas fingerprinting countermeasure.
published: true
---

With other coworkers from the University of Lille, INRIA and Stonybrook university, we recently published a
paper that evaluates the privacy implications of using fingerprinting countermeasures in particular regarding the quantity
of information they may indirectly leak by revealing their presence.
The paper has been accepted at Usenix Security 18, and a free version is available on <a href="https://hal.inria.fr/hal-01820197">HAL</a>.

One of the countermeasure we study in this paper is <a href="https://multiloginapp.com/canvasdefender-browser-extension/">Canvas Defender</a>,
a browser extension for Chrome and Firefox that spoofs canvas fingerprints.
In this post, we show more in details how it is possible to bypass the canvas protection of Canvas Defender.
The goal is to inform users on the privacy implications engendered by the usage of a countermeasure such as
Canvas Defender.
Indeed, while on their website they claim in different posts
(<a href="https://multiloginapp.com/everything-need-know-canvas-fingerprinting/">Everything You Need to Know About Canvas Fingerprinting</a> and
<a href="https://multiloginapp.com/how-canvas-fingerprint-blockers-make-you-easily-trackable/">How Canvas Fingerprint Blockers Make You Easily Trackable</a>)
to have a more effective solution than simple canvas blockers, we show that it still has some flaws.

## Detecting Canvas Defender
As several canvas countermeasures, Canvas Defender works by overriding functions related to canvas fingerprinting, such as *toDataURL* or *getImageData*.
Thus, the most simple solution to detect Canvas Defender is to look at the string representation of the *toDataURL* function.

```javascript
HTMLCanvasElement.prototype.toDataURL.toString();
```
While normally it returns a string containing *'native code'*, since it is overriden by Canvas Defender, it leaks the code used to override *toDataURL*:
```javascript
'function () {
    var width = this.width;
    var height = this.height;
    var context = this.getContext("2d");
    var imageData = context.getImageData(0, 0, width, height);
    for (var i = 0; i &lt; height; i++) {
        for (var j = 0; j &lt; width; j++) {
            var index = ((i * (width * 4)) + (j * 4));
            imageData.data[index + 0] = imageData.data[index + 0] + r;
            imageData.data[index + 1] = imageData.data[index + 1] + g;
            imageData.data[index + 2] = imageData.data[index + 2] + b;
            imageData.data[index + 3] = imageData.data[index + 3] + a;
        }
    }
    context.putImageData(imageData, 0, 0);
    showNotification();
    return old.apply(this, arguments);
}'
```

Nevertheless, we go further, since the goal of this post is to show how Canvas Defender can be rendered inefficient, or even harmful by making its users more trackable.

## Extracting the noise vector

In this part, we show another technique to detect the presence of canvas defender.
This technique relies on the MutationObserver API and also enables to extract the noise vector generated by Canvas Defender.
This noise vector is randomly generated. It is applied to each pixel of the canvas to change its value, and thus escape fingerprinting.
The vector is constituted of 4 components corresponding to the **r,g,b,a** components of a pixel.
For example, if the noise vector is equal to [5, -10, 7, 6], each pixel in the picture would have a new value equal to [(r+5)%255, (g-10)%255, (b+7)%255, (c+6)%255] (not exactly true because of alpha premultiplying).

The technique we present hereafter relies on the fact that browser extensions content scripts do not execute in the same execution context than the web page for security purposes.
Thus, to execute the script that overrides the canvas functions in the same context as the web page, Canvas Defender injects a script element in the DOM.
The script contains the code to override *toDataURL*, *getImageData*.
Once the script has been executed it auto deletes itself.

```javascript
const observer = new MutationObserver((mutations) =&gt; {
    mutations.forEach((mutation) =&gt; {
        var beginScript = "try{(function overrideDefaultMethods(r, g, b, a,";
        if (mutation.addedNodes.length === 1 &&
        mutation.addedNodes[0].text !== undefined && mutation.addedNodes[0].text.indexOf(beginScript) &gt; -1) {
            const noise = mutation
            .addedNodes[0]
            .text
            .match(/\d{1,2},\d{1,2},\d{1,2},\d{1,2}/)[0]
            .split(",");
            console.log(noise);
        }
    });
});

const config = {childList: true, subtree: true};
observer.observe(document.documentElement, config);
```

The snippet of code above uses the MutationObserver API to detect when the script injected by Canvas Defender is added to the DOM.
Once the script is detected, it can extract the noise vector.

## Getting the original canvas value

Until now, we have shown that it is possible to detect the presence of Canvas Defender and to extract the noise vector applied to each pixel of a canvas.
In this part, we go further by recovering the original canvas value.

Different strategies may come in mind to recover the original canvas, i.e. the value of the canvas without the extension.
First, since we have extracted the noise vector, we could simply subtract the noise to all pixels, which ideally would give us the original value of the pixel.
Nevertheless, because of alpha premultiplying (more information in this <a href="https://stackoverflow.com/questions/23497925/how-can-i-stop-the-alpha-premultiplication-with-canvas-imagedata/23501676#23501676">Stackoverflow post</a>), we wouldn't obtain the original value.
A second approach would be to execute the canvas before the DOM is loaded, thus the script of Canvas Defender wouldn't be executed since it needs the DOM to be ready to be injected.
Nevertheless, executing canvas before the DOM is loaded may not correctly render the emoji contains in most canvas.

The solution we adopt relies on cloning the *toDataURL* function before it gets overridden by Canvas Defender.

To do so we execute the following code:
```javascript
const getOriginalFunction = Function.prototype.call.bind(
    Function.prototype.bind,
    Function.prototype.call
);
const oldToDataURL = getOriginalFunction(HTMLCanvasElement.prototype.toDataURL);
```

Thus, if we use the original *toDataURL* function, i.e. the function not overridden by Canvas Defender, we obtain the canvas below:

<img src="/assets/media/bee55706-c403-41ac-8a64-e291f21b18db.png">

On the contrary, if we use the *toDataURL* function overridden by Canvas Defender, we obtain the following canvas:

<img src="/assets/media/9631d370-84d3-435e-b206-55eea31cd64e.png">

The difference is caused by the fact that in this case, Canvas Defender adds a noise vector of [28, 30, 6, 28].

## Conclusion
In this post, we showed that contrary to what's claimed in their article, Canvas Defender can easily be detected.
We showed that detecting if a user has Canvas Defender installed can be checked by looking at the string
representation of *toDataURL*.
It can also be detected using the MutationObserver API.
The advantage of this approach is that it enables to extract the noise vector used by Canvas Defender.
Depending on the settings chosen by the user in the extension, this noise vector may remain the same until
the user deliberately changes it.
Finally, we showed how to recover the original canvas value, even in the presence of Canvas Defender.

In term of privacy implications, since few users use Canvas Defender
-- around 20k according to the download statistics -- it means that simply being detected with the extension
makes you more unique.
Moreover, fingerprinters or other kinds of tracking script could potentially extract and use the noise vector
against the user to make tracking easier.
Thus, while Canvas Defender's initial goal is to increase user privacy, it is important to keep in mind its side effects could also be used against their users to track them more easily.