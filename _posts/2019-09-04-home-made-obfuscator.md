---
layout: post
title: A simple homemade JavaScript obfuscator
categories: [JavaScript]
tags: [Javascript, fingerprinting, obfuscation, deobfuscation]
description: Example of a simple homemade JavaScript obfuscator applied on a security fingerprinting script.
---

In this post, I present how you can create your own simple JavaScript obfuscator.
To illustrate our example, we will apply our obfuscator on a simple fingerprinting script.
In the remaining of this post, we consider we are working in a directory with the following structure:
```javascript
myObfuscator/
    dist/
    src/
    test/
```

The **src/** directory will contain the source of the JavaScript files we write, while the **dist/** directory will contain
transpiled or obfuscated versions of these files.
Finally, the **test/** directory will contain files used to test if our code still works after obfuscation.

In this blog post, I try to provide a complete working example.
Nevertheless, if you're just interested in the obfuscation part, you can skip the next section.

## Fingerprinting script

To better understand the obfuscation transformations, we use a short browser fingerprinting script as an example on this blog post.
No knowledge of browser fingerprinting is required to understand the remainder of this post.
Nevertheless, I provide a brief explanation of what's browser fingerprinting.
Browser fingerprinting is a technique that collects a set of attributes related to the user device and browser.
To collect these attributes, we can leverage the HTTP headers sent by the browser as well as JavaScript APIs.
In this post, we'll only focus on the JavaScript part of fingerprinting.
Browser fingerprinting can be used both for tracking as a way to regenerate cookies or for security,
as a mechanism to detect bots and crawlers, as well as to enhance authentication.
In the case fingerprinting is used in a security context, companies often tend to obfuscate the content of their script
so that attackers can't too easily understand the different attributes collected.
Indeed, since JavaScript is executed in the browser, it needs to be sent to the user's machine to be executed.
Thus, attackers can look at the content of the script, hence the need for obfuscation.
Nevertheless, one should be careful when using obfuscation since it is not perfect; with enough time and effort, attackers can often understand
what's going on in your script.


We use a simple fingerprinting script with few attributes so that it is easier to understand.
In the **src/** directory, we create a file called **SimpleFingerprintCollector.js**.

```javascript
class SimpleFingerprintCollector {
    constructor() {
        this.tests = [];
        this.fingerprint = {}
    }

    registerTest(name, test) {
        this.tests.push({
            name: name,
            fn: test
        });
    }

    async collect() {
        const testsPromises = [];

        for (let test of this.tests) {
            if (test.fn.constructor.name === 'AsyncFunction') {
                testsPromises.push(new Promise(async(resolve) => {
                    testsPromises.push(test.fn().then((resTest) => {
                        this.fingerprint[test.name] = resTest;
                    }, (err) => {
                        this.fingerprint[test.name] = err;
                    }))
                }));
            } else {
                try {
                    this.fingerprint[test.name] = test.fn();
                } catch (err) {
                    this.fingerprint[test.name] = err;
                }
            }
        }

        await Promise.all(testsPromises);
        return this.fingerprint;
    }
}

const fingerprintCollector = new SimpleFingerprintCollector();
```

It contains a class with 3 methods.
You can add a fingerprinting test using **fingerprintCollector.registerTest**, and collect a fingerprint
using **fingerprintCollector.collect**.

Then in the **src/** directory we create a sub-directory called **fingerprint/**.
In **src/fingerprint/** we'll place all of our fingerprinting tests.
While it is not necessary to split the fingerprinting tests from the **SimpleFingerprintCollector** class,
I use it as an example to illustrate how to use Gulp to concatenate files.

In the **src/fingerprint/** we add some fingerprinting tests such as a canvas fingerprinting:
```javascript
// src/fingerprint/canvas.js
fingerprintCollector.registerTest('canvas', () => {
    let res = {};
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    canvas.style.display = "inline";
    const context = canvas.getContext("2d");

    try {
        context.rect(0, 0, 10, 10);
        context.rect(2, 2, 6, 6);
        res.canvasWinding = context.isPointInPath(5, 5, "evenodd");
    } catch (e) {
        res.canvasWinding = 'unknown';
    }

    try {
        context.textBaseline = "alphabetic";
        context.fillStyle = "#f60";
        context.fillRect(125, 1, 62, 20);
        context.fillStyle = "#069";
        context.font = "11pt no-real-font-123";
        context.fillText("Cwm fjordbank glyphs vext quiz, 😃", 2, 15);
        context.fillStyle = "rgba(102, 204, 0, 0.2)";
        context.font = "18pt Arial";
        context.fillText("Cwm fjordbank glyphs vext quiz, 😃", 4, 45);

        context.globalCompositeOperation = "multiply";
        context.fillStyle = "rgb(255,0,255)";
        context.beginPath();
        context.arc(50, 50, 50, 0, 2 * Math.PI, !0);
        context.closePath();
        context.fill();
        context.fillStyle = "rgb(0,255,255)";
        context.beginPath();
        context.arc(100, 50, 50, 0, 2 * Math.PI, !0);
        context.closePath();
        context.fill();
        context.fillStyle = "rgb(255,255,0)";
        context.beginPath();
        context.arc(75, 100, 50, 0, 2 * Math.PI, !0);
        context.closePath();
        context.fill();
        context.fillStyle = "rgb(255,0,255)";
        context.arc(75, 75, 75, 0, 2 * Math.PI, !0);
        context.arc(75, 75, 25, 0, 2 * Math.PI, !0);
        context.fill("evenodd");
        res.image = canvas.toDataURL();

    } catch (e) {
        res.image = 'unknown';
    }

    return res;
});
```

We add a simple test to collect the platform:
```javascript
// src/fingerprint/platform.js


fingerprintCollector.registerTest('platform', () => {
    if (navigator.platform) {
        return navigator.platform
    }

    return 'unknown';
});
```

We also add other fingerprinting tests.
You can find the <a href="https://github.com/antoinevastel/simpleJSObfuscator">complete code on Github.</a>

## Building the non-obfuscated fingerprinting script

Then, we use Gulp to first build a non-obfuscated version of the fingerprinting script.
To use Gulp, we create a file called **gulpfile.js** at the root of the **myObfuscator** directory.
For the moment we define a single task in the gulpfile.
Nevertheless, by the end of this post we'll have more tasks to handle obfuscation and minification.
```javascript
// gulpfile.js
const {series, src, dest } = require('gulp');
const concat = require('gulp-concat');

function concatScripts() {
    return src(['src/simpleFingerprintCollector.js', 'src/fingerprint/*.js'])
        .pipe(concat('simpleFingerprintCollector.js'))
        .pipe(dest('./dist/'));
}

exports.concat = concatScripts;
```

From the root of the repository, you can build the non-fingerprinting version
of the fingerprinting script by calling **gulp concat** in your terminal.
It generates a file called **simpleFingerprintCollector.js** in the **dist/** directory that the code
of the **SimpleFingerprintCollector** class along with the fingerprinting tests.
```javascript
// dist/simpleFingerprintCollector.js

class SimpleFingerprintCollector {
    ...
}

const fingerprintCollector = new SimpleFingerprintCollector();

fingerprintCollector.registerTest('adblock', () => {
    ...
    return result;
});

fingerprintCollector.registerTest('canvas', () => {
    ...
    return result;
});

// Other tests ...

fingerprintCollector.registerTest('screenResolution', () => {
    ...
    return result;
});
```

## Obfuscating the fingerprinting script

Now that we have a fingerprinting script, we'll create a program to obfuscate it.
There exists several obfuscation techniques, more or less complex, and more or less effective.
You can read more about this topic in this <a href="{% post_url 2017-12-06-presentation-obfuscation %}">other blog post</a> where I present the main obfuscation techniques.
In this post, I'll use a simple obfuscation technique that consists in replacing static strings and numbers,
as well as access to object properties and methods by a function call to make it less readable.
If you want a similar but production-ready solution to do this you can either use <a href="https://obfuscator.io/">obfuscator.io</a>
or the associated npm package.
The obfuscation technique I'll present in this post is quite similar to the **String Array** option of their obfuscator.

The way I implement the obfuscation is clearly not optimal.
Moreover I'm not consistent across the code.
The idea is to show different ways to manipulate the code and the AST.
I used shift libraries but it is possible to use others such as <a href="https://esprima.org/">Esprima</a>.

We create the **src/obfuscator.js** file that will contain the code of our obfuscation program.
In this file, we'll add several code transformations to make the fingerprinting script less readable.
For example, we want to transform object property assignements to make them less readable.
We also replace static strings and numbers by a function call.
```javascript
context.textBaseline = "alphabetic";
// would become
context[f(index, arr)] = f(indexOther, arr);
```

In general, we also want to modify static access to object members (methods and attributes) to make them dynamic using a function call:
```javascript
errorMessage = e.message;
// would become
errorMessage = e[f(index, arr)];
```

To do this, we first import the different libraries we'll use for obfuscation.
```javascript
const { RefactorSession } = require('shift-refactor');
const { parseScript } = require('shift-parser');
const Shift = require('shift-ast');
const fs = require('fs');
```

To obfuscate the fingerprinting script we will manipulate its AST (Abstract Syntax Tree), a tree representation of the code.
If you want to visualize ASTs using a nice UI, you can use <a href="https://astexplorer.net/">AST Explorer</a>.

Then, we create a function called **obfuscateFPScript** that takes as input the path of the input file to obfuscate and the path of the obfuscated output file.
In this function, we start by gathering the different strings, numbers and object properties to obfuscate.
```javascript
function obfuscateFPScript(src, dest) {
    // we read the content of the fingerprinting script (not obfuscated)
    const fileContents = fs.readFileSync(src, 'utf8');

    // We use the shift-ast library to parse the script and build an ast
    const tree = parseScript(fileContents);

    // We initialize a refactor session that we use to query nodes in the ast for example
    const refactor = new RefactorSession(tree);

    // The 5 statements below extract the different strings, numbers and object properties
    // that we want to obfuscate
    // refactor.query enables to query specific nodes from the AST using a syntax similar to CSS
    // Thus, for example refactor.query('LiteralStringExpression') will return all the LiteralStringExpression
    // in the program.
    const stringsProgram = Array.from(new Set(refactor.query('LiteralStringExpression').map(v => v.value)));
    const numbersProgram = Array.from(new Set(refactor.query('LiteralNumericExpression').map(v => v.value)));
    const bindingProperties = Array.from(new Set(refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]').map(v => v.binding.property)));
    const expStatementStr = Array.from(new Set(refactor.query('ExpressionStatement[expression.expression.type="StaticMemberExpression"]').map(exp => exp.expression.expression.property)));
    const staticMemberStr = Array.from(new Set(refactor.query('StaticMemberExpression').map(v => v.property)));

    const staticLiterals = stringsProgram.concat(numbersProgram, bindingProperties, expStatementStr, staticMemberStr);
    // staticLiterals contains the different attributes we want to obfuscate
    [ 'AsyncFunction',
      'adblock',
      'div',
      '&nbsp;',
      'adsbox',
      'canvas',
      'rgb(255,255,0)',
      'timezone',
      0,
      400,
      200,
      10,
      ...
      'screenX',
      'pageXOffset',
      'pageYOffset',
      'clientWidth']

    const staticLiteralToIndex = new Map(staticLiterals.map((lit, idx) => [lit, idx]));
}
```

Then, we modify the AST of our script to insert the **staticLiterals** array at the top of it.
Instead of storing the raw values of the elements of the array, we encode them using base64.
```javascript
refactor.query('Script')[0].statements.unshift(new Shift.VariableDeclarationStatement({
        declaration: new Shift.VariableDeclaration({
            kind: 'const',
            declarators: [new Shift.VariableDeclarator({
                binding: new Shift.BindingIdentifier({
                    name: 'members'
                }),
                init: new Shift.ArrayExpression({
                    elements: staticLiterals.map((lit) => {
                        if (typeof lit === 'string') {
                            return new Shift.LiteralStringExpression({
                                value: new Buffer.from(lit).toString('base64')
                            })
                        } else if (typeof lit === 'number') {
                            return new Shift.LiteralNumericExpression({
                                value: lit
                            })
                        }

                    })
                })
            })]
        })
    }));
```

We also insert a function called **indexToLiteral** in the AST of the script.
Its goal is, given an index and an array, to return the element present at the index.
Since we encoded the strings in our array using base64, we use the **atob** function to obtain the original string.
While this does not really improve the resilience of the obfuscation, I show it as an example
so that you can implement more complex transformations on your own.
```javascript
const indexToStr = `
    function indexToLiteral(index, arr) {
        if (typeof arr[index] ==='string') return atob(arr[index]);
            return arr[index];
    }`;

    // Instead of creating the function using the Shift class as we
    // did for the previous snippet of code, here we define the function in a string
    // then we parse it to obtain its AST that we can append to the AST of the fingerprinting script
    const indexToStrAst = parseScript(indexToStr).statements[0];
    refactor.query('Script')[0].statements.unshift(indexToStrAst);
```

Finally, we apply the different code transformations:
```javascript
// Short function to help us build call expressions more easily
function buildIndexToLitCallExpression(index) {
        return new Shift.CallExpression({
            callee: new Shift.IdentifierExpression({
                name: 'indexToLiteral'
            }),
            arguments: [
                new Shift.LiteralNumericExpression({
                    value: index
                }),
                new Shift.IdentifierExpression({
                    name: 'members'
                })

            ]
        })
    }



// Transform static string and number used in function arguments
refactor.query('CallExpression')
        .forEach(callExpression => {
            callExpression.arguments.forEach((argument, idx) => {
                if (argument.type === 'LiteralStringExpression' || argument.type === 'LiteralNumericExpression') {
                    callExpression.arguments[idx] = buildIndexToLitCallExpression(staticLiteralToIndex.get(argument.value))
                }
            });
        });

    // Assignments of the form myobj.prop = val; => myobj[func(idx, arr)] = val;
    refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]')
        .forEach(assignmentExpression => {
            assignmentExpression.binding = new Shift.ComputedMemberAssignmentTarget({
                object:  assignmentExpression.binding.object,
                expression: buildIndexToLitCallExpression(staticLiteralToIndex.get(assignmentExpression.binding.property))
            });
        });

    // Static strings and numbers used in expression statements
    refactor.query(':matches(ExpressionStatement[expression.expression.type="LiteralStringExpression"], ' +
        'ExpressionStatement[expression.expression.type="LiteralNumericExpression"])')
        .forEach((exp) => {
            exp.expression.expression = buildIndexToLitCallExpression(staticLiteralToIndex.get(exp.expression.expression.value))
        });

    // Static strings and numbers used in variable declaration statements
    refactor.query('VariableDeclarationStatement')
        .forEach((exp) => {
            exp.declaration.declarators.forEach((declarator) => {
                if (declarator.init.type === 'LiteralNumericExpression' || declarator.init.type === 'LiteralStringExpression') {
                    declarator.init = buildIndexToLitCallExpression(staticLiteralToIndex.get(declarator.init.value))
                }
            })
        });

    // Make access to object properties and methods dynamic
    refactor.query('StaticMemberExpression')
        .forEach((exp) => {
            exp.type = 'ComputedMemberExpression';
            exp.expression = buildIndexToLitCallExpression(staticLiteralToIndex.get(exp.property));
            delete exp.property;
        });

    // We generate the code associated with the modified AST and save it
    fs.writeFileSync(dest, refactor.print(), 'utf8');
```

## Adding our obfuscation script to Gulp

To fully automate the process of obfuscating our fingerprinting script, we create a new task in **gulpfile.js**.
```javascript
// gulpfile.js

const obfuscator = require('./src/obfuscator.js');

function obfuscateFPScript(done) {
    obfuscator.obfuscate('./dist/simpleFingerprintCollector.js', './dist/obfuscated.js');
    done();
}

exports.obfuscate = obfuscateFPScript;
```

Thus, to obfuscate the script, we can now use **gulp obfuscate**, which generates a file called **obfuscated.js** in the **dist/** directory.

## Changing variable names

At that stage, our obfuscated script still contains some variables with meaningful names.
Instead of renaming variables myself, I show how we can use **gulp-terser** to rename the names of variables and thus
decrease the available knowledge available to the attacker.


```javascript
const terser = require('gulp-terser');
const rename = require('gulp-rename');

// We create a new task called compress
function compress () {
    // It takes as input the obfuscated fingerprinting script
    return src('dist/obfuscated.js')
        .pipe(terser({
            compress: {
                booleans: false,
                drop_console: true,
                evaluate: false,
                keep_classnames: false
            },
            mangle: {
                toplevel: true,
                reserved: ['fingerprintCollector', 'collect'] // we don't rename the variable called fingerprintCollector
                // since it needs to be accessed by other scripts that need to know its name
            },
            keep_fnames: false,
            output: {
                beautify: false,
                preamble: '/* You superb copyright here */' // You can also add a nice message or copyright to the top
                // of your script
            }
        }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(dest('dist/')) // It generates a new file **dist/obfuscated.min.js**
}

exports.compress = compress;

// We define a new gulp task called build
// This task calls sequentially the 3 tasks we defined in this blog post
exports.build = series(concatScripts, obfuscateFPScript, compress);
```

Now that our **gulpfile.js** file is complete, we can use **gulp build** to directly
build the non-obfuscated fingerprinting script, obfuscate it, and rename the variables.

## Testing our obfuscated code

When building your own obfuscator or when you apply transformation to your code, you may generate code that looks valid but
that's not working as expected.
Thus, it is important to have tests to automatically verify if the code transformed still works as the original one.
To test our code, we use the Chai and Puppeteer libraries.
Puppeteer enables to easily automate browser so that we can test if our obfuscated runs properly in a browser.

In the **test/** directory, we first create an simple HTML file that includes our obfuscated script.
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<script src='../dist/obfuscated.min.js'></script>
</body>
</html>
```

Then, we create a test file called **test.js**.
It includes the different unit tests that verify if our codes run as expected.
In our example, I only create 3 simple tests to demonstrate how it works.
```javascript
const {expect} = require('chai');
const puppeteer = require('puppeteer');
const path = require('path');

describe('Fingerprinting on Chrome Headless', function () {
    let browser, page;
    let fingerprint;

    before(async function () {
        // Code executed before the tests are executed

        // we create an instance of puppeteer
        // it enables to control a headless instance of Chrome headless
        browser = await puppeteer.launch();
        page = await browser.newPage();

        // We load the HTML page we defined in the same directory
        await page.goto('file://' + path.resolve(__dirname, 'test.html'), {
            waitUntil: 'load'
        });

        // We execute code in the context of the HTML page to obtain the value of the fingerprint
        fingerprint = await page.evaluate(async () => {
            try {
                const fingerprint = await fingerprintCollector.collect();
                return fingerprint;
            } catch (e) {
                return e.message;
            }
        });
    });

    after(async function () {
        // Once all tests have been executed we close the page and the browser instance
        await page.close();
        await browser.close();
    });

    // We created 3 unit tests
    it('resOverflow should be an object', () => {
        expect(typeof fingerprint.resOverflow).to.equal('object');
    });

    it('screen should have 16 properties', () => {
        const isScreenValid = fingerprint.screenResolution !== undefined && Object.keys(fingerprint.screenResolution ).length === 16;
        expect(isScreenValid).to.be.true;
    });

    it('adblock should be false', () => {
        expect(fingerprint.adblock).to.be.false;
    });

});
```

Thus, we now have an obfuscated fingerprinting script that should work properly on recent browsers.
You can find the <a href="https://github.com/antoinevastel/simpleJSObfuscator">complete code on Github.</a>
The snippet below shows the output we obtain for the function responsible to collect the canvas fingerprint.

```javascript
let e = {};
    const Z = document[t(69, c)](t(5, c));
    Z[t(101, c)] = t(27, c), Z[t(102, c)] = t(28, c), Z[t(75, c)][t(50, c)] = t(6, c);
    const n = Z[t(76, c)](t(7, c));
    try {
        n[t(77, c)](t(26, c), t(26, c), t(29, c), t(29, c)), n[t(77, c)](t(30, c), t(30, c), t(31, c), t(31, c)), e[t(51, c)] = n[t(78, c)](t(32, c), t(32, c), t(8, c))
    } catch (Z) {
        e[t(51, c)] = t(9, c)
    }
    try {
        n[t(52, c)] = t(10, c), n[t(53, c)] = t(11, c), n[t(79, c)](t(33, c), t(34, c), t(35, c), t(36, c)), n[t(53, c)] = t(12, c), n[t(54, c)] = t(13, c), n[t(80, c)](t(14, c), t(30, c), t(37, c)), n[t(53, c)] = t(15, c), n[t(54, c)] = t(16, c), n[t(80, c)](t(14, c), t(38, c), t(39, c)), n[t(55, c)] = t(17, c), n[t(53, c)] = t(18, c), n[t(81, c)](), n[t(82, c)](t(40, c), t(40, c), t(40, c), t(26, c), 2 * Math[t(83, c)], !0), n[t(84, c)](), n[t(85, c)](), n[t(53, c)] = t(19, c), n[t(81, c)](), n[t(82, c)](t(41, c), t(40, c), t(40, c), t(26, c), 2 * Math[t(83, c)], !0), n[t(84, c)](), n[t(85, c)](), n[t(53, c)] = t(20, c), n[t(81, c)](), n[t(82, c)](t(42, c), t(41, c), t(40, c), t(26, c), 2 * Math[t(83, c)], !0), n[t(84, c)](), n[t(85, c)](), n[t(53, c)] = t(18, c), n[t(82, c)](t(42, c), t(42, c), t(42, c), t(26, c), 2 * Math[t(83, c)], !0), n[t(82, c)](t(42, c), t(42, c), t(43, c), t(26, c), 2 * Math[t(83, c)], !0), n[t(85, c)](t(8, c)), e[t(56, c)] = Z[t(86, c)]()
    } catch (Z) {
        e[t(56, c)] = t(9, c)
    }
    return e
```

Even though it seems completely unreadable, this kind of obfuscation can be easily reverse engineered.
To learn more about this topic you can watch <a href="https://www.youtube.com/channel/UCJbZGfomrHtwpdjrARoMVaA/videos">Jarrod Overson's Youtube channel.</a>
