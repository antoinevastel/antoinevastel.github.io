---
layout: post
title: Improving our homemade JavaScript obfuscator
categories: [JavaScript]
tags: [Javascript, fingerprinting, obfuscation, deobfuscation]
description: In this blog post, we add new code transformations to the JavaScript obfuscator we created in a previous blog post.
---

In a previous <a href="{% post_url 2019-09-04-home-made-obfuscator %}">blog post</a>, we created
a simple JavaScript obfuscator and applied it to a fingerprinting script that could be
used for bot detection or to enhance authentication.
In this blog post, we extend it to add new code transformations that aim to make the code even less
readable.

Once again, the obfuscator we present is not production-ready and only serves for educational purposes.
If you are looking for a better JavaScript obfuscator, you can have a look <a href="https://obfuscator.io/">obfuscator.io (open source)</a>
or  <a href="https://jscrambler.com/">JSCrambler</a>.

Before I present the new code transformations, I briefly review the transformations we created in the previous blog post.

## Summary of the current obfuscation transformations

Our obfuscator replaces static access to object members (methods and attributes) to make them
dynamic using a function call:
```javascript
errorMessage = e.message;
// would become
errorMessage = e[f(index, arr)];
```

It also replaces static strings and numbers by a function call.
```javascript
context.textBaseline = "alphabetic";
// would become
context[f(index, arr)] = f(indexOther, arr);
```

To do this, we store all the static strings, numbers as well as the static object members accessed
in the code in a single array.
```javascript
// staticLiterals contains the different attributes we want to obfuscate
    [ 'AsyncFunction',
      'adblock',
      200,
      10,
      ...
      'pageYOffset',
      'clientWidth']
```
To make it less readable, we encode the strings contained in the **staticLiterals** array using base64.
Then, when we want to access an element of the array in our code, we use a function,
**f** in the previous examples, that maps an index to the the right element
in the array.

## New obfuscation transformations
Now that we have reminded the code transformations used in the first version of our obfuscator,
we present the new ones, that, hopefully, will make the obfuscated code more difficult to understand.

### Splitting string literals and static member expressions

In the first version of the obfuscator, string literals and static member expressions were
stored in an array after they had been encoded using base64.
Thus, **toDataURL** is stored as **dG9EYXRhVVJM** (``` atob('dG9EYXRhVVJM') =  'toDataURL' ```).
In this new version, instead of storing the base64 encoded version of **toDataURL**, we split it in
multiple substrings.
Thus, depending on the number of splits we apply, we may store the following substrings: **'t'**, **'dat'**,
**'aU'** and **'RL'**.
Then, in an array, we store each of these substrings encoded using base64.

We use the code below to get all the literals to obfuscate and split them into multiple substrings.
```javascript
const staticLiterals = stringsProgram.concat(numbersProgram, bindingProperties, expStatementStr, staticMemberStr);
// At that stage the code is similar with the previous version
// staticLiteral contains all the strings/numbers we want to obfuscate


// Given a string to split and a maximum number of splits,
// it returns an array containing multiple substrings randomly split
function splitStringLiteral(lit, maxNumSplits) {
    maxNumSplits = Math.min(maxNumSplits, lit.length);
    const numSplits = Math.max(1, Math.floor(maxNumSplits*Math.random()));
    const splits = new Set();
    while (splits.size < numSplits) {
        splits.add(Math.max(1, Math.floor(lit.length * Math.random())));
    }

    const orderedSplits = Array.from(splits);
    orderedSplits.sort((a, b) => a-b);
    const literalChunks = orderedSplits.map((v, idx) => {
        if(idx === 0) {
            return lit.substring(0, v);
        } else if (idx < orderedSplits.length -1 ) {
            return lit.substring(orderedSplits[idx-1], v);
        } else {
            return lit.substring(orderedSplits[idx-1]);
        }
    });

    if (numSplits === 1) {
        literalChunks.push(lit.substring(orderedSplits[0]))
    }
    return literalChunks;
}

const subLiterals = new Set(); // To save space, we keep each substring only once
// We build a map that associates a literal, e.g. 'toDataURL'
// to all its substrings, e.g. ['t', 'oDataU', 'RL']
const staticLiteralToChunks = new Map(staticLiterals.map(lit => {
    let subLit;
    if (typeof lit === 'string') {
        subLit = splitStringLiteral(lit, transformationsConfig.maxSplits);
    } else {
        subLit = [lit]
    }

    subLit.forEach(v => subLiterals.add(v));
    return [lit, subLit]; // we don't split numbers for the moment
}));

// We create an an array containing all the substrings
const subLitArr = Array.from(subLiterals);
const subLiteralToIndex = new Map(subLitArr.map((v, idx) => [v, idx]));
const staticLiteralToIndexChunks = new Map();
// We create a map that associates a literal to the indexes of all its
// its substrings in the subLitArr array
staticLiteralToChunks.forEach((v, k) => {
    const indexChunks = v.map(subLit => subLiteralToIndex.get(subLit));
    staticLiteralToIndexChunks.set(k, indexChunks);
});
```

Thus, a property access such as ``` myobj.property = 'myval'``` would have the following
form depending on the number of splits:
``` myobj[f(index1, arr) + ... + f(indexN, arr)] = f(indexX, arr) + ... + f(indexZ, arr);```

### Changing the base64 alphabet

Our second new transformation aims to change the alphabet used to encode
the literals (numbers and strings).
In the previous version, we used base64 with the default alphabet:
```javascript
// Code of the first version of the obfuscator to encode 'lit' in base64
new Buffer.from(lit).toString('base64')

// By default it uses the following alphabet
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
```

Instead of using the default alphabet, we generate an alphabet, which is
a random permutation of the default alphabet.
Thus, instead of using ``` new Buffer.from(lit).toString('base64') ``` to encode
the literals, we use the base64 function below, that, contrary to the previous one,
can take an alphabet as a parameter (**keyStr**).
```javascript
function encode64(input, keyStr) {
    if (!String(input).length) return false;
    var output = "";
    ...
    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        ...
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
            keyStr.charAt(enc3) + keyStr.charAt(enc4);
    } while (i < input.length);

    return output;
}
```

Then, we encode the array of substrings we built in the previous step and add it to the
AST of our script.
```javascript
refactor.query('Script')[0].statements.unshift(new Shift.VariableDeclarationStatement({
    declaration: new Shift.VariableDeclaration({
        kind: 'const',
        declarators: [new Shift.VariableDeclarator({
            binding: new Shift.BindingIdentifier({
                name: 'members'
            }),
            init: new Shift.ArrayExpression({
                elements: subLitArr.map((lit) => {
                    if (typeof lit === 'string') {
                        return new Shift.LiteralStringExpression({
                            value: encode64(lit, alphabet)
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

Since we use a non-standard alphabet to encode the literals in our array,
we need to store the alphabet in the script for the decoding phase.
Thus, we generate a variable with a random name that contains the alphabet used
 for encoding and add it to the script.
```javascript
// We generate the random variable name
const alphabetPropertyName = generateRandomString(6);

// We generate a random b64 alphabet
const alphabet = shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
    .split(''))
    .join('');

// We add the variable to the script
const alphabetElement = parseScript(`window['${alphabetPropertyName}'] = '${alphabet}'`).statements[0];
refactor.query('Script')[0].statements.unshift(alphabetElement);
```
Since we don't want this variable to be obfuscated, we execute this code after our obfuscation process.


In the previous version we used the native **atob** function to decode a string that
had been obfuscated in base64.
Nevertheless, **atob** cannot take an alphabet as parameter.
Thus, we add our own function to decode a base64 encoded string using a specific alphabet.

```javascript
const decodeBody = `function decode64(input, keyStr) {
       ...
       // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
       input = input.replace(/[^A-Za-z0-9\\+\\/\\=]/g, "");
       do {
          enc1 = keyStr.indexOf(input.charAt(i++));
          enc2 = keyStr.indexOf(input.charAt(i++));
          enc3 = keyStr.indexOf(input.charAt(i++));
          enc4 = keyStr.indexOf(input.charAt(i++));
          ...
       } while (i < input.length);
       return output;
    }`;

// We add the function to the script
const decodeBodyAst = parseScript(decodeBody).statements[0];
refactor.query('Script')[0].statements.unshift(decodeBodyAst);
```
Switching from base64 with a standard alphabet, to base64 with a random alphabet does not provide
strong security guarantees.
Nevertheless, it may help against inexperienced users.
If they look at the array containing all the literals and try to deobfuscate it
using **atob**, it won't work since the alphabet used for encoding won't be the default one.

### Add ternary statements
The third and last transformation we add rely on ternary statements to make the code less readable.
In the previous version, we replaced all literals and static members in the same way.
```javascript
myobj.property = 'myval'
// becomes
myobj[f(index, arr)] = f(otherIndex, arr);
```

The first transformation of this blog post made it slightly more complex:
```javascript
myobj.property = 'myval'
// becomes
myobj[f(index1, arr) + f(index2, arr) + ... + f(indexN, arr)] = f(indexX, arr) + ... + f(indexZ, arr);
```

Nevertheless, whenever we transform a literal or a static member expression, we apply
the same technique.
Thus, to make the reverse engineering task more challenging, we want to diversify the way we transform our code.
In this new version, I propose to use ternary statements, *i.e.* statements that have the following form:
```javascript
mycondition ? expressionWhenTrue : expressionWhenFalse;
```

With our new transformation,```myobj.property = 'myval'``` could be transformed to
```javascript
myobj[f(index1, arr) + (alwaysTrue() ? f(index2, arr) : 'randomValue' )+ ... + f(indexN, arr)] = (alwaysFalse ? f(randomIndex, arr) : f(indexX, arr)) + ... + f(indexZ, arr);
```

As we can observe in the previous example, we also diversify the ternary statements.
Some of the statements use functions that always evaluate to ```true``` while others
use functions that always evaluate to ```false```.
For the moment I use simple handcrafted functions but I guess it should be possible
to automatically generate more complex functions.
We also diversify the expressions used in the consequent/alternate statements (the expressions evaluated
either when the test is true or false).
The statement is either a call to the function used to obtain an
element in the array (function **f** in our examples), or a random string.

The following code snippet summarizes the different ternary statements our obfuscator can generate.
```javascript
// In this case, the expression will always evaluate to f(index, arr)
alwaysTrueFunction() ? f(index, arr) : 'aRandomValueNeverUsedButThatLooksLegit';
// In this case, the expression will always evaluate to f(index, arr)
alwaysTrueFunction() ? f(index, arr) : f(index2, arr);


// We do similar a technique with functions that always evaluate to false
// In this case, the expression will always evaluate to f(index, arr)
alwaysFalseFunction() ? 'aRandomValueNeverUsedButThatLooksLegit' : f(index, arr);
// In this case, the expression will always evaluate to (index, arr)
alwaysTrueFunction() ? f(index2, arr) : f(index, arr);

```

Since these code transformations have an impact on the execution time of the code,
we can parametrize their frequency.
```javascript
const transformationsConfig = {
    frequency: {
        'encoding': 0.7, // simple replace obj.prop by obj[f(idx, arr) + ... + f(idxN, arr)]
        'ternary':  0.3 // replace a literal by one of the ternary statements
        // presented earlier, e.g. alwaysTrue() ? f(idx, arr) : f(fakeIndex, arr)
    },
    maxSplits: 4 // Maximum number of splits when spliting literals
};
```

To generate ternary statements, we insert the always true and always false functions in
our script.
These functions are stored separately in another file.
```javascript
// functionAlwaysTrue.js

// Example of functions that always evaluate to true
const alwaysTrueFunctionsToBody = new Map([
    ['awl', `
          function awl() {
            if (this[[] + {}]) return true;
            this[[] + {}]= true;
            const res = navigator.userAgent.length > 3 * Math.random();
            this[[] + {}] = false;
            return res;
          }
        `],
    ['dodsjsdlo', `
          function dodsjsdlo() {
            if (this[{}+{}+[]]) return true;
            this[{}+{}+[]]= true;
            const res = typeof navigator.webdriver !== 'undefined' && navigator.webdriver === 'sdfjcn' ? false : !(Math.random() < ([] + {}));
            this[{}+{}+[]] = false;
            return res;
          }
        `],

]);

exports.functions = alwaysTrueFunctionsToBody;

// In obfuscator.js
const alwaysTrueFunctionsToBody = require('./functionsAlwaysTrue.js').functions;
const alwaysFalseFunctionsToBody = require('./functionsAlwaysFalse.js').functions;

const alwaysTrueFunctions = Array.from(alwaysTrueFunctionsToBody.keys());
function selectRandomFunction(alwaysTrueFunctions) {
    return alwaysTrueFunctions[Math.floor(alwaysTrueFunctions.length * Math.random())];
}

alwaysTrueFunctionsToBody.forEach((fBody) => {
    const alwaysTrueFuncAst = parseScript(fBody).statements[0];
    refactor.query('Script')[0].statements.unshift(alwaysTrueFuncAst);
});

const alwaysFalseFunctions = Array.from(alwaysFalseFunctionsToBody.keys());

alwaysFalseFunctionsToBody.forEach((fBody) => {
    const alwaysFalseFuncAst = parseScript(fBody).statements[0];
    refactor.query('Script')[0].statements.unshift(alwaysFalseFuncAst);
});
```

Then, we create a function called **buildIndexToLitCallExpression**.
Its purpose is similar to the function with the same name in the previous version.
We only modify its implementation to support the new code transformations we discussed in this
section.

```javascript
function buildIndexToLitCallExpression(indexes, transformationsConfig) {
    const tree = parseScript(
        indexes.map(idx => {
            const rd = Math.random();
            if (rd < transformationsConfig.frequency.encoding) {
                return `indexToLiteral(${idx}, members)`
            } else if (rd >= transformationsConfig.frequency.encoding) { // Only 2 families of transformations for the moment
                const numSubTransfo = 4;
                const interval = (transformationsConfig.frequency.ternary) / numSubTransfo;

                if (rd <= transformationsConfig.frequency.encoding + interval) {
                    return `(${selectRandomFalseFunction(alwaysFalseFunctions)}() ? '${generateRandomString(Math.max(3, Math.floor(8*Math.random())))}' : indexToLiteral(${idx}, members))`;
                } else if (rd < transformationsConfig.frequency.encoding + 2 * interval) {
                    return `(${selectRandomFalseFunction(alwaysFalseFunctions)}() ? indexToLiteral(${Math.floor(subLitArr.length * Math.random())}, members) : indexToLiteral(${idx}, members))`;
                } else if (rd < transformationsConfig.frequency.encoding + 3 * interval) {
                    return `(${selectRandomTrueFunction(alwaysTrueFunctions)}() ? indexToLiteral(${idx}, members) : '${generateRandomString(Math.max(3, Math.floor(8*Math.random())))}')`;
                } else if (rd <= transformationsConfig.frequency.encoding + 4 * interval) {
                    return `(${selectRandomTrueFunction(alwaysTrueFunctions)}() ? indexToLiteral(${idx}, members) : indexToLiteral(${Math.floor(subLitArr.length * Math.random())}, members))`;
                }
            }
        })
        .join(' +')
    );

    return tree.statements[0].expression;
}
```

Finally we obfuscate the code by applying the different code transformations according to their frequency:
```javascript
refactor.query('CallExpression')
        .forEach(callExpression => {
            callExpression.arguments.forEach((argument, idx) => {
                if (argument.type === 'LiteralStringExpression' || argument.type === 'LiteralNumericExpression') {
                    callExpression.arguments[idx] = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(argument.value), transformationsConfig)
                }
            });
        });

    // Assignments of the form myobj.prop = val; => myobj[func(idx, arr)] = val;
    refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]')
        .forEach(assignmentExpression => {
            assignmentExpression.binding = new Shift.ComputedMemberAssignmentTarget({
                object:  assignmentExpression.binding.object,
                expression: buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(assignmentExpression.binding.property), transformationsConfig)
            });
        });

    refactor.query(':matches(ExpressionStatement[expression.expression.type="LiteralStringExpression"], ' +
        'ExpressionStatement[expression.expression.type="LiteralNumericExpression"])')
        .forEach((exp) => {
            exp.expression.expression = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(exp.expression.expression.value), transformationsConfig)
        });


    refactor.query('VariableDeclarationStatement')
        .forEach((exp) => {
            exp.declaration.declarators.forEach((declarator) => {
                if (declarator.init.type === 'LiteralNumericExpression' || declarator.init.type === 'LiteralStringExpression') {
                    declarator.init = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(declarator.init.value), transformationsConfig)
                }
            })
        });

    refactor.query('StaticMemberExpression')
        .forEach((exp) => {
            exp.type = 'ComputedMemberExpression';
            exp.expression = buildIndexToLitCallExpression(staticLiteralToIndexChunks.get(exp.property), transformationsConfig);
            delete exp.property;
        });
```

You can find the <a href="https://github.com/antoinevastel/simpleJSObfuscator">complete code on Github</a>.
To distinguish the first and the second version of the obfuscator, I created a file **src/obfuscator_vs2.js**.
I also added a Gulp task named **build2** in **gulpfile.js**.
Thus, we can use **gulp build2** to build the non-obfuscated fingerprinting script, obfuscate
it with the new code transformations, and rename the variables.

For comparison with the <a href="{% post_url 2019-09-04-home-made-obfuscator %}">first version of the obfuscator</a>,
the snippet below shows how the canvas fingerprinting function has been obfuscated using the new
transformations.
In this example, we use ```maxSplits = 4``` and a ternary frequency of 0.3.

```javascript
let e = {};
const a = document[(s() ? W(128, t) : "QCk") + W(129, t) + (n() ? "ulfLUjj" : W(130, t))]((s() ? W(17, t) : W(62, t)) + W(18, t));
a[(r() ? W(188, t) : W(112, t)) + (r() ? "jCA" : W(104, t)) + W(180, t)] = W(63, t),
a[W(3, t) + W(181, t) + W(168, t)] = W(64, t),
a[(r() ? "TNOV" : W(140, t)) + W(22, t)][W(11, t) + W(92, t) + (n() ? "Jaep" : W(93, t))] = W(19, t) + W(20, t);
const c = a[W(141, t) + W(142, t)](W(21, t) + W(11, t));
try {
    c[W(36, t) + W(143, t)](i() ? W(62, t) : W(52, t), W(62, t), W(65, t), W(65, t)),
    c[W(36, t) + W(143, t)](W(66, t), W(66, t), s() ? W(67, t) : W(110, t), W(67, t)),
    e[(i() ? W(94, t) : W(33, t)) + (i() ? W(95, t) : W(76, t))] = c[W(144, t) + W(145, t)](s() ? W(68, t) : "dnJmFh", W(68, t), (s() ? W(22, t) : "myj") + W(23, t) + (n() ? "DkQJKow" : W(24, t)))
} catch (r) {
    e[W(94, t) + W(95, t)] = W(25, t) + (n() ? "iyL" : W(26, t))
}
try {
    c[W(80, t) + W(96, t)] = W(27, t) + W(17, t),
    c[(i() ? W(97, t) : W(109, t)) + W(98, t)] = (s() ? W(28, t) : W(83, t)) + W(29, t),
    c[W(99, t) + W(104, t) + (n() ? W(184, t) : W(146, t))](i() ? W(69, t) : "KCW", n() ? "egqpV" : W(70, t), W(71, t), W(72, t)),
    c[W(97, t) + W(98, t)] = W(30, t) + (s() ? W(31, t) : W(120, t)),
    c[(i() ? W(99, t) : W(73, t)) + W(100, t) + W(101, t)] = (i() ? W(32, t) : "fcB") + (s() ? W(33, t) : W(158, t)),
    c[W(147, t) + (i() ? W(148, t) : "rJF")]((r() ? "Yjq" : W(34, t)) + W(35, t), r() ? "GoJ" : W(66, t), W(73, t)),
    c[W(97, t) + (r() ? "VCdugib" : W(98, t))] = W(36, t) + (i() ? W(37, t) : "qBe") + W(38, t),
    c[W(99, t) + W(100, t) + W(101, t)] = W(39, t) + W(40, t),
    c[(r() ? "Ekh" : W(147, t)) + W(148, t)]((r() ? "iLBJAUl" : W(34, t)) + (i() ? W(35, t) : W(5, t)), W(74, t), W(75, t)),
    c[W(102, t) + W(103, t)] = (r() ? W(134, t) : W(41, t)) + W(42, t) + W(43, t),
    c[(i() ? W(97, t) : "kQx") + W(98, t)] = W(44, t) + W(45, t),
    c[W(133, t) + W(149, t)](),
    c[W(9, t) + W(150, t)](W(76, t), W(76, t), W(76, t), i() ? W(62, t) : W(18, t), 2 * Math[W(151, t) + W(152, t)], !0),
    c[W(153, t) + W(154, t)](),
    c[(r() ? "JUD" : W(97, t)) + W(155, t)](),
    c[(i() ? W(97, t) : W(177, t)) + (i() ? W(98, t) : "wQHnrgL")] = W(36, t) + (s() ? W(46, t) : W(143, t)),
    c[(i() ? W(133, t) : W(71, t)) + W(149, t)](),
    c[(r() ? W(128, t) : W(9, t)) + W(150, t)](W(77, t), W(76, t), W(76, t), W(62, t), 2 * Math[W(151, t) + W(152, t)], !0),
    c[W(153, t) + W(154, t)](),
    c[W(97, t) + W(155, t)](),
    c[W(97, t) + W(98, t)] = (r() ? "rec" : W(47, t)) + W(48, t),
    c[W(133, t) + W(149, t)](),
    c[W(9, t) + W(150, t)](i() ? W(78, t) : "ulY", W(77, t), W(76, t), W(62, t), 2 * Math[(r() ? "kgj" : W(151, t)) + W(152, t)], !0),
    c[W(153, t) + (n() ? "aIZ" : W(154, t))](),
    c[W(97, t) + (i() ? W(155, t) : W(34, t))](),
    c[W(97, t) + W(98, t)] = W(44, t) + W(45, t),
    c[W(9, t) + (s() ? W(150, t) : W(69, t))](W(78, t), W(78, t), W(78, t), W(62, t), 2 * Math[W(151, t) + W(152, t)], !0),
    c[W(9, t) + W(150, t)](W(78, t), W(78, t), i() ? W(79, t) : W(141, t), W(62, t), 2 * Math[W(151, t) + W(152, t)], !0),
    c[(r() ? "RPAVnk" : W(97, t)) + W(155, t)](W(22, t) + (s() ? W(23, t) : W(78, t)) + W(24, t)),
    e[(i() ? W(104, t) : "dKtI") + W(105, t) + (s() ? W(106, t) : "KOVMzzy")] = a[W(156, t) + (i() ? W(157, t) : "ScW")]()
} catch (r) {
    e[W(104, t) + W(105, t) + W(106, t)] = W(25, t) + W(26, t)
}
return e
```

As we can observe, our new transformations significantly increase the size of the obfuscated code.
More generally, since obfuscation modifies the code, it can impact its performance.
Thus, in a next blog post, we will study the overhead of our obfuscation transformations.