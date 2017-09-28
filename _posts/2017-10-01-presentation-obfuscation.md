---
layout: post
title: Obfuscation
categories: [Obfuscation]
tags: [Obfuscation]
description: Presentation of obfuscation.
published: false
---

This post is a general presentation about obfuscation and has been inspired by two sources:
- [A taxonomy of obfuscation transformations](http://www.dsi.unive.it/~avp/collberg97taxonomy.pdf)
- A [presentation](https://fr.slideshare.net/auditmark/owasp-eu-tour-2013-lisbon-pedro-fortuna-protecting-java-script-source-code-using-obfuscation) of Pedro Fortuna, founder of [JSCrambler](https://jscrambler.com/)

It is split in 4 parts and tackle the following points:
1. What is obfuscation?
2. Why use obfuscation?
3. How to evaluate obfuscation?
4. What are the main transformations?

I wrote this post because I regularly have to look at obfuscated JS code and wanted to know more about the different obfuscation strategies.
The second reason is that I am also interested in protecting sensitive JS code executed in the browser, and obfuscation is often considered as one of the best the solution for this kind of problems.
Thus, even though this article is about obfuscation in general, some cases will be more related to Javascript in particular.

# What is obfuscation?

Obfuscation is the process of transforming a program code into a form that's more difficult to understand or change.

It must not be mistaken with minification which is simply the fact to decrease the size of the file.
Although visually it makes the file unreadable, it's extremly easy to give it a normal look and then to understand or modify the code at ease.

Obfuscated code is still valid, but simply more difficult to understand by a human.

More formally, obfuscation can be defined as the process of transforming a program P in a program P' such as P and P' have the same observable behavior.
In particular, if the original program P doesn't terminate or terminate with an error, then its obfuscated version P' may or may not terminate.
However, in case of an original program P that terminates, it's obfuscated version P' must returns the same value as P.

The notion of observable behavior is important.
Indeed, strictly speaking, P and P' won't have the same exact behavior since as we will see in next part, some obfuscation techniques consist in changing the execution flow of the program by reordering variables or functions for example.
Thus, this notion of observable means that P and P' may have different behavior, but they should not be perceived by the user.

# Why use obfuscation?

The goal of using obfuscation is to protect code.
Usually it is because you are distributing your code, for example in case of Javascript you send it to client that request a page, but you don't necessarly want to expose your business logic contained in it.

By obfuscating your program, you make it harder for someone to understand its behavior.
Moreover,  in case where someone would simply steal the code and use it on its website, it would make it more difficult to maintain and add new feature to the code.

Although using encryption may seem to be a better solution, it is of no interest if the code is being decrypted on the client machine since there is still a moment where he'll be able to see the unencrypted version.

However, an other solution to protect the code is to move the critical logic that needs to be protected to the serverside.
By providing an API that makes remote calls to the server containing the critical logic, the client has no longer access to the code.
This solutions adds overhead both for the client since it is dependent of network conditions, and also for the company that provides the API since with this solution it needs to provides reliable servers, whereas with obfuscation code is executed on the client device.

An other use of obfuscation is to hide malwares.

# Evaluate obfuscation
This part presents how we can characterize the efficiency of obfuscation as well as its impact on the program that has been obfuscated.
The Evaluation is split in three components that respectively answer to the following questions:
* How much obscurity has been added to the program? (human)
* How difficult is it to automatize the deobfuscation process? (machine)
* How much computational overhead is being added by the obfuscation

## Potency
It is the metrics that aims at measuring how the obfuscation process makes it more difficult for a human to understand the obfuscated program.

In order to  measure if a new obfuscated programm P' is less readable than the original program P, we use metrics from software engineering.
These metrics reflect the quality, readability and maintainability of a program.
Traditionnaly, the goal is to optimize these metrics so that a program become easier to maintain and read.
In case of obfuscation, the goal is to worsen these metrics in the opposite direction so that the programm becomes more obscure.

For example, when usually one would try to minimize the program size or variable dependencies, in case of obfuscation the goal is to maximize them.

In next part potency is measured on a three point scale (low, medium, high).

## Resilience
"How well are automatic or manual deobfuscation attacks resisted?"

In contrary to potency which tries to add complexity for a human, resilience measures how well an obfuscated programm can resist to a deabfuscator (machine).
It can be seen as the time required for a deobfuscator to reduce the potency of the obfuscated program, i.e the time needed to make it more readable by a human.

scale (weak, strong)
One way if information is totally removed from P' so that P cannot be reconstructed.

## overhead/cost
"How much overhead is added to the application?"
Overhead both on the size of the file.
Also overhead concerning the time needed for the program to execute.

Thus, the global quality of an obfuscator can be seen as a function of the potency (confuse a human), resilience (confuse a deobfuscator), and the overhead introduced (execution time and size of the files).

scale (free, cheap, costly, dear)

# Main transformations

To obfuscate a program, an obfuscator applies different kinds of transformation on the original program.
We present these transformations in three categories depending on their target:

## Layout
Transformation that change the visual representation of the program.
They are one way since once the transformation is made, the previous state can't be recovered.
Simple transformations such as renaming variables or functions.
, removing comments.
By doing this it removes semantics contained in the name of the variables, or indications presents in the comments.
It is one way since it is impossible to guess original names or commments.

Also changing the code formatting.
Generally removing spaces and lines.
Reason why minification is often mistaken with obfuscation.
However, low potency since formatting doesn't bring a lot of information.


## Control transformations
Controls transformations aims at obsuring the control flow of the application.
These transformations are separated in three categories presented hereafter.

### Aggregation transformations
Aggregation transformations which either consist in separating computations that are logically together, or merge code that are not. This is based in the idea that code that has been aggregated in a function or a class by a programmer must probably be linked. By separating it into different functions or classes it makes it more difficult to understand. On the opposite, merging code together makes it look like it has a sementic link. (List associated transformations in the table?)

### Ordering transformations
Ordering transformations which randomize the order of instruction execution. 
It relies on the idea that spatial locality in the code, i.e functions or statements close in the code, plays an important role in making the code more understandeable. (List associated transformations in the table?)

### Computation transformations
Computation transformations which insert dead or redundant code or make algorithmic changes. Their goal is to hide the real control flow by polluting it with irrelevant statements. (List associated transformations in the table?)

In contrary to transformations that target the visual representation of the program, this set of transformations may have an impact on the execution time of the program (overhead metric).(List associated transformations in the table?)

(Talk about opac construct ?)

## Data

Transformations that target the data structures in a program.
They are classified in three categories.

### Storage and encoding transformations

Use a non "natural" way  and encoding to store a data.
For example replacing boolean variables by two variables and a mapping that are used to reconstruct the original value.
If a variable v = false, we can represent it with the tuple (false, false, AND) or (false, true, AND) or (true, false, AND) where AND is the && operator).
Thus we can reconstruct the original value.
Besides boolean variables this can be generalized to other type of variables

An other technique often used on string is to not use them directly, but instead convert the string into a program that produces the string.

Talk about the fact that it is important to consider transformations together.
One transformation alone may not have enough power, but when combined with an other has a huge impact in term of resilience.

### Aggregation transformations

It aims at aggregating data structure to hide their original representation.
For example, it may operate on arrays by restructuring them.
An array can be split into multiple sub arrays.
Multiple arrays can be merge into one.
Finally a one dimensional array can be folded into a higher dimensional array, or the opposite, called flattening, where we decrease the dimension of an array.

For example, by representing a 2D grid using a 1D array, it makes it harder to understand the purpose of the variable.

Besides arrays, these transformations may also focus on inheritance relations.
For example, it may increase the level of inheritance, or on the opposite it can decrease it by mergin subclasses.

### Ordering transformations

Randomizing the order of declarations in the source code.
In particular order of methods and instances variables of a classe, as well as parameter in functions.
It is also possible to randomize the order in which elements are stored in a data by providing a function that given an index i, maps it to its original position in the array.

Techniques with good impact on potency:
changing variable or function names to non meaningful ones,
removing comments
removing whitespaces
adding deadcode

Table below extracted from paper XXX, provides an overview of the different obfucating transformations, their targets as well as their category.
Some transformations have not been presented but their name is rather explicit on their purpose.
For more details you can refer to the article XX.

<style type="text/css">
.tg  {border-collapse:collapse;border-spacing:0;}
.tg td{font-family:Arial, sans-serif;font-size:14px;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;}
.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;}
.tg .tg-3smg{background-color:#ce6301;vertical-align:top}
.tg .tg-e3zv{font-weight:bold}
.tg .tg-hgcj{font-weight:bold;text-align:center}
.tg .tg-amwm{font-weight:bold;text-align:center;vertical-align:top}
.tg .tg-9hbo{font-weight:bold;vertical-align:top}
.tg .tg-w0yn{background-color:#3166ff;color:#333333}
.tg .tg-yw4l{vertical-align:top}
.tg .tg-h1ue{background-color:#3166ff;vertical-align:top}
.tg .tg-0zek{background-color:#ce6301;color:#000000;vertical-align:top}
.tg .tg-y0xi{background-color:#32cb00;vertical-align:top}
@media screen and (max-width: 767px) {.tg {width: auto !important;}.tg col {width: auto !important;}.tg-wrap {overflow-x: auto;-webkit-overflow-scrolling: touch;}}</style>
<div class="tg-wrap"><table class="tg">
  <tr>
    <th class="tg-hgcj" colspan="3">Obuscation</th>
    <th class="tg-amwm" colspan="3">Quality</th>
  </tr>
  <tr>
    <td class="tg-e3zv">Target</td>
    <td class="tg-e3zv">Operation</td>
    <td class="tg-9hbo">Transformation</td>
    <td class="tg-9hbo">Potency</td>
    <td class="tg-9hbo">Resilience</td>
    <td class="tg-9hbo">Cost</td>
  </tr>
  <tr>
    <td class="tg-w0yn" rowspan="3">Layout</td>
    <td class="tg-031e"></td>
    <td class="tg-yw4l">Scramble identifiers</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-031e"></td>
    <td class="tg-yw4l">Change Formatting</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-031e"></td>
    <td class="tg-yw4l">Remove Comments</td>
    <td class="tg-yw4l">high</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-h1ue" rowspan="17">Control</td>
    <td class="tg-yw4l" rowspan="7">Computations</td>
    <td class="tg-yw4l">Insert dead code</td>
    <td class="tg-yw4l" colspan="3" rowspan="4">Depends on the quality of the opaque predicate and <br>the nesting depth at which the construct is inserted.</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Extend loop condition</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Reducible to non reducible</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Add redundant operands</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Remove programming idioms</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">strong</td>
    <td class="tg-yw4l">+</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Table interpretation</td>
    <td class="tg-yw4l">high</td>
    <td class="tg-yw4l">strong</td>
    <td class="tg-yw4l">costly</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Parallelize code</td>
    <td class="tg-yw4l">high</td>
    <td class="tg-yw4l">strong</td>
    <td class="tg-yw4l">costly</td>
  </tr>
  <tr>
    <td class="tg-0zek" rowspan="7">Aggregation</td>
    <td class="tg-yw4l">Inline method</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Outline statements</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">strong</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Interleave methods</td>
    <td class="tg-yw4l" colspan="3" rowspan="2">Depends on the quality of the opaque predicate</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Clone methods</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Block loop</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Unroll loop</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">cheap</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Loop fission</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-y0xi" rowspan="3">Ordering</td>
    <td class="tg-yw4l">Reorder statements</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Reorder loops</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Reorder expressions</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-h1ue" rowspan="15">Data</td>
    <td class="tg-yw4l" rowspan="5">Storage and encoding</td>
    <td class="tg-yw4l">Change encoding</td>
    <td class="tg-yw4l" colspan="3">Depends on the complexity of the encoding function</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Promote scalar to object</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">strong</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Change variable lifetime</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">strong</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Split variable</td>
    <td class="tg-yw4l" colspan="3">Depends on the number of variables into which the<br>original variable is split</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Convert static to procedural data</td>
    <td class="tg-yw4l" colspan="3">Depends on the complexity of the generated function</td>
  </tr>
  <tr>
    <td class="tg-3smg" rowspan="8">Aggregation</td>
    <td class="tg-yw4l">Merge scalar variables</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Factor class</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">+</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Insert bogus class</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">+</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Refactor class</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">+</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Split array</td>
    <td class="tg-yw4l">+</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Merge arrays</td>
    <td class="tg-yw4l">+</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Fold array</td>
    <td class="tg-yw4l">+</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">cheap</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Flatten array</td>
    <td class="tg-yw4l">+</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-y0xi" rowspan="2">Ordering</td>
    <td class="tg-yw4l">Reorder methods and instance variables</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Reorder arrays</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
</table></div>

# Few tools

Gives for different languages
Obfuscators:

Deobfuscators: JSNice
