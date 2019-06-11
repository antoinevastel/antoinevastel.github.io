---
layout: post
title: How to monitor the execution of JavaScript code with Puppeteer and Chrome headless
categories: [JavaScript]
tags: [Javascript, browser fingerprinting, crawler]
description: This post presents how to leverage Puppeteer with Chrome headless to monitor the execution of JavaScript code on any website.
---

During the course of my research, I had to detect websites and scripts doing browser fingerprinting or using specific JavaScript functions.
Classifying whether or not a script is doing browser fingerprinting typically requires to know the sequences of attributes it accesses,
the functions called and their arguments.
For example, if we consider the case of canvas fingerprinting whom I talk about in
this other <a href="{% post_url 2019-02-19-canvas-fingerprint-on-the-web %}"> blog post</a>, while simply using the
canvas API does not mean the website is necessarily doing fingerprinting, some sequences of
functions called with certain parameters can indicate the use of fingerprinting.

## Static vs Dynamic Analysis
In order to learn about the object properties accessed by a script and the functions it uses, there exist two main approaches:
1. **Static analysis**, *i.e.* analyzing the code without executing it. Nevertheless, static analysis presents
some limits when the code studied is heavily obfuscated, which is often the case in my research on trackers and bot detection scripts.
2. **Dynamic analysis.** Instead of studying the code without executing it, one observes its behavior at runtime.
While this approach may not be as exhaustive since the execution flow of the program may depend on several factors, it still provides
good insights on the behavior of the code.

In this post, I present some code I use in my projects and research to detect when a function, a method or a property of an object
is accessed,  and which script accessed it.
While I mostly use it for my research related to browser fingerprinting, it can be applied and adapted to other use cases that require
to obtain information about the behavior of a script at runtime.

My approach leverages JavaScript and can be applied using a browser extension or a headless browser, such as Chrome and Firefox headless.
Another solution is to monitor the execution of the code at a lower level by modifying the browser C++'s code.
Nevertheless, while directly modifying the browser C++'s code provides better performances, it requires more development time.

The next paragraphs present the main functions along with a description to understand their role.
A complete working example is available [on Github](https://github.com/antoinevastel/blog-post-monitor-js).

## Obtaining the Name of the Current Script

First, we create a function that returns the name of the script calling it.

```javascript
function getCallerFile() {
    let originalFunc = Error.prepareStackTrace;

    let callerfile;
    try {
        const err = new Error();
        let currentfile;

        Error.prepareStackTrace = function (err, stack) {
            return stack;
        };

        currentfile = err.stack.shift().getFileName();
        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if (currentfile !== callerfile) break;
        }
    } catch (e) {}

    Error.prepareStackTrace = originalFunc;

    return callerfile;
}
```



## Overriding Native Functions
We create a function that overrides the behavior of the native functions and methods we want to monitor.
Thus, when such functions are called, we intercept the call and store the name of the script calling it,
as well as the arguments of the function/method and the value returned by the function.
For each script embedded in a page, we store its execution trace in an array saved in the
**navigator.monitorFingerprinting** property.


```javascript
function overrideFunction(item) {
    item.obj[item.propName] = (function (orig) {
        return function () {
            let args = arguments;
            const callerFile = getCallerFile(); // We get the name of the script calling the function
            let value;
            if (typeof window.navigator.monitorFingerprinting[callerFile] === 'undefined') {
                window.navigator.monitorFingerprinting[callerFile] = [];
            } else {
                value = orig.apply(this, args); // We call the function and store the value retuned
                let valueToStore = value;
                // If the value returned is an array or an object,
                // we use JSON.stringify to obtain a representation of the value
                if (value instanceof Array) {
                    valueToStore = JSON.stringify(value);
                }
                else if (typeof value === 'object') {
                    valueToStore = JSON.stringify(value);
                }

                window.navigator.monitorFingerprinting[callerFile][window.navigator.monitorFingerprinting[callerFile].length] = {
                    name: item.propName,
                    args: Array.from(args).map(arg => arg.toString()).join(','),
                    value: valueToStore
                }
            }

            return value;
        };

    }(item.obj[item.propName]));
}

// Example to override functions related to WebGL

const webGLMethods = ['getParameter', 'getSupportedExtensions', 'getContextAttributes',
            'getShaderPrecisionFormat', 'getExtension', 'readPixels', 'getUniformLocation',
            'getAttribLocation', 'clearColor', 'enable', 'depthFunc', 'clear', 'createBuffer',
            'bindBuffer', 'bufferData', 'createProgram', 'createShader', 'shaderSource',
            'compileShader', 'attachShader', 'linkProgram', 'useProgram', 'drawArrays'];
webGLMethods.forEach((method) => {
    overrideFunction({
        propName: method,
        obj: window.WebGLRenderingContext.prototype
    });
});

// Example to override other functions, not necessarly related to fingerprinting
const otherFunctionsToOverride = [
    {
        propName: 'getTimezoneOffset',
        obj: Date.prototype
    },
    {
        propName: 'getComputedTextLength',
        obj: SVGTextContentElement.prototype
    },
    {
        propName: 'createElement',
        obj: document
    },
    {
        propName: 'getElementById',
        obj: document
    }
];
```

## Overriding Getters

In the case of fingerprinting, knowing that object properties have been accessed also matter.
To detect when a property is accessed, we override the getter of each of the attributes we want to monitor.
Thus, similarly to the **overrideFunction** above, whenever the value of an attribute is read,
its getter will get the name of the script that accesses it using the **getCallerFile** function and stores it along with
the value of the attribute in the **navigator.monitorFingerprinting** property.

```javascript
// Contain the list of object properties to monitor
const attributesToMonitor = {
    navigator: [
        'platform',
        'userAgent',
        'platform',
        // ...
        'appCodeName',
        'cookieEnabled'
    ],
    screen: [
        'width',
        'height',
        // ...
        'pixelDepth'
    ],
    window: [
        'ActiveXObject',
        'webdriver',
        'domAutomation',
        // ...
        'outerWidth',
        'innerWidth',
        'innerHeight',
        'devicePixelRatio',
        'localStorage',
        'indexedDB',
        'sessionStorage'
    ]
};

// Override the getters of the properties present in attributesToMonitor

const originalValues = {};

function saveAccessGetter(prop, subProp) {
    let value;
    const callerFile = getCallerFile();
    if (window.navigator.monitorFingerprinting[callerFile] === undefined) {
        window.navigator.monitorFingerprinting[callerFile] = [];
    } else {
        value = originalValues[subProp];
        let valueToStore = value;
        if (typeof value === 'object') {
            valueToStore = JSON.stringify(value);
        }

        window.navigator.monitorFingerprinting[callerFile][window.navigator.monitorFingerprinting[callerFile].length] = {
            name: `${prop}.${subProp}`,
            value: valueToStore
        };
    }

    return value;
}

window.navigator.monitorFingerprinting = {};
const originalValues = {};

for (let prop of Object.keys(attributesToMonitor)) {
    for (let subProp of attributesToMonitor[prop]) {
        if(prop !== 'window') {
            originalValues[subProp] = window[prop][subProp];
            window[prop].__defineGetter__(subProp, () => {
                return saveAccessGetter(prop, subProp);
            });
        } else {
            originalValues[subProp] = window[subProp];
            window.__defineGetter__(subProp, () => {
                return saveAccessGetter(prop, subProp);
            });
        }

    }
}
```

All the code related to code monitoring is stored in a file called **monitorExecution.js** that has the following structure:
```javascript
const fingerprintingDetection = (function () {

    const detectFingerprinting = function () {
        function getCallerFile() {}
        function overrideFunction(item) {}
        // code to override getters
    }
    return detectFingerprinting
})();

module.exports = {
    detectFingerprinting: fingerprintingDetection,
};

```

## Example

In order to test the code presented above, we create a short program
that leverages Puppeteer with Chrome headless to automatically visit a website and monitor the execution of the code.
The program visits [a page on my own website](https://antoinevastel.com/bots) that contains a fingerprinting script.
As we can observe in the comments, one of the scripts on the page generates a canvas fingerprint and then gets its value using
the **toDataURL** function.

```javascript
const puppeteer = require('puppeteer');
const detectFingerprinting = require('./monitorExecution').detectFingerprinting;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(detectFingerprinting);

    await page.goto('https://antoinevastel.com/bots');

    const evalResult = await page.evaluate(() => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(navigator.monitorFingerprinting);
            }, 200);
        });
    });

    console.log(evalResult);
    // prints the execution trace of the fingerprinting script present on the page
    // The comment below show the portion of the execution trace associated
    // with the cration of the canvas fingerprint
    /*
     { name: 'createElement', args: 'canvas', value: '{}' },
     { name: 'isPointInPath', args: '5,5,evenodd', value: false },
     { name: 'fillRect', args: '125,1,62,20' },
     { name: 'fillText',
       args: 'Cwm fjordbank glyphs vext quiz, 😃,2,15' },
     { name: 'fillText',
       args: 'Cwm fjordbank glyphs vext quiz, 😃,4,45' },
     { name: 'beginPath', args: '' },
     { name: 'beginPath', args: '' },
     { name: 'arc', args: '50,50,50,0,6.283185307179586,true' },
     { name: 'closePath', args: '' },
     { name: 'fill', args: '' },
     { name: 'beginPath', args: '' },
     { name: 'beginPath', args: '' },
     { name: 'arc', args: '100,50,50,0,6.283185307179586,true' },
     { name: 'closePath', args: '' },
     { name: 'fill', args: '' },
     { name: 'beginPath', args: '' },
     { name: 'beginPath', args: '' },
     { name: 'arc', args: '75,100,50,0,6.283185307179586,true' },
     { name: 'closePath', args: '' },
     { name: 'fill', args: '' },
     { name: 'arc', args: '75,75,75,0,6.283185307179586,true' },
     { name: 'arc', args: '75,75,25,0,6.283185307179586,true' },
     { name: 'fill', args: 'evenodd' },
     { name: 'toDataURL',
       args: '',
       value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADICAYAAADG ...'
     }
    */

    await browser.close();
})();
```

A complete working example is available [on Github](https://github.com/antoinevastel/blog-post-monitor-js).
While this approach can easily be deployed using Puppeteer and Chrome headless or a browser extension, it may add significant
overhead to the code executed depending on the functions monitored.
Moreover, scripts may be able to detect that you are monitoring their execution and modify their execution flow, which may
influence the analysis conducted.
