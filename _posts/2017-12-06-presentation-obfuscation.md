---
layout: post
title: What is obfuscation?
categories: [obfuscation]
tags: [Obfuscation]
description: This post gives a high overview on what is obfuscation, in particular it presents the main transformations used to obfuscate a program.
published: true
---

This post is a general presentation about obfuscation.
It is mostly a summary of:
- [A taxonomy of obfuscation transformations](http://www.dsi.unive.it/~avp/collberg97taxonomy.pdf)
- [A presentation](https://fr.slideshare.net/auditmark/owasp-eu-tour-2013-lisbon-pedro-fortuna-protecting-java-script-source-code-using-obfuscation) from Pedro Fortuna, founder of [JSCrambler](https://jscrambler.com/)

It addresses the following points:
1. What is obfuscation?
2. Why use obfuscation?
3. How to evaluate obfuscation?
4. What are the main transformations?

I wrote this post because I regularly have to look at obfuscated JS code and wanted to know more about the different obfuscation strategies.
The second reason is that I am also interested in protecting sensitive JS code executed in the browser, and as we'll see in this post, obfuscation is often considered as a good candidate for these kinds of problems.
Thus, even though this article is about obfuscation in general, some parts may be more related to Javascript obfuscation in particular.

# What is obfuscation?

Obfuscation is the process of transforming a program code into a form that's more difficult to understand or change.
It must not be mistaken with minification which is simply the fact to decrease the size of a file.
Although minification makes the file unreadable, it's extremly easy to give it a normal look, and then to understand or modify the code at ease.

More formally, obfuscation can be defined as the process of transforming a program **P** into a program **P'** such as **P** and **P'** have the same observable behavior.
In particular, if the original program **P** doesn't terminate or terminate with an error, then its obfuscated version **P'** may or may not terminate.
However, in case of an original program **P** that terminates, it's obfuscated version **P'** must returns the same value as **P**.

The notion of observable behavior is important.
Indeed, strictly speaking, **P** and **P'** won't have the same exact behavior since as we will see in the next part, some obfuscation techniques consist in changing the execution flow of the program by reordering variables or functions for example.
This notion of observable behavior means that **P** and **P'** may have different behaviors, but these differences should not be perceived by the end user.

# Why use obfuscation?

Obfuscation is mostly used to protect code.
Usually it is because you are distributing your code, for example in case of Javascript you send it to browsers that request a web page, but you don't necessarily want to expose your business logic contained in it.
By obfuscating your program, you make it harder for someone to understand its behavior.
Moreover,  in case where someone would simply steal the code to use it on its website, it would make it more difficult to maintain and add new features.

Although encryption may seem more effective than obfuscation, it is of no interest if the code is decrypted on the client's machine since there will still be a moment where the client will be able to see the unencrypted version of the code.
An other solution to protect the code is to move the critical logic that needs to be protected to the server side.
By providing an API that makes remote calls to the server containing the critical logic, the client has no longer access to the code.
This solutions adds overhead both for the client since it is dependent on network conditions, and also for the company that provides the API since it needs to provides reliable servers.

# Evaluate obfuscation
This part summarizes how to characterize the efficiency of obfuscation, as well as its impact on the program that has been obfuscated.
The evaluation process is split in three components that respectively answer to the following questions:
* How much obscurity has been added to the program? (human)
* How difficult is it to automatize the deobfuscation process? (machine)
* How much computational overhead is being added by the obfuscation

## Potency
Potency  aims at measuring how the obfuscation process makes it more difficult for a human to understand the obfuscated program.
In order to  measure if a new obfuscated programm **P'** is less readable than the original program **P**, we use metrics from software engineering.
These metrics reflect the quality, readability and maintainability of a program.
Traditionally, the goal is to optimize these metrics so that a program becomes easier to maintain and read.
In case of obfuscation, the goal is to worsen these metrics so that the program becomes more obscure.
For example, when usually one would try to minimize the program's size or variable dependencies, in case of obfuscation the goal is to maximize them.

## Resilience
Resilience aims at measuring how well an obfuscated program can resist to a deobfuscator.
In contrary to potency which measures the complexity for a human, resilience measures the complexity added for a machine.
It can be seen as the time required for a deobfuscator to reduce the potency of the obfuscated program, _i.e._ the time needed to make it more readable by a human.

## Cost
Finally, the cost measures the overhead added by the obfuscation to the application.
The overhead may be both in term of size of the file and in term of execution time.
Indeed, in case of Javascript where files must be sent through the internet to browsers when they request a page, it might be a problem if the obfuscated program becomes too big.


Thus, the global quality of an obfuscation can be seen as a function of the potency (confusing a human), resilience (confusing a deobfuscator), and the overhead it introduces (execution time and size of the files).

# Main transformations
In order to obfuscate a program, an obfuscator applies different kinds of transformations on the original program.
We present these transformations in three categories depending on the targets they are applied on.

## Layout
Layout transformations change the visual representation of the program.
They are one way since once the transformation has been made, the previous state can't be recovered.
This category contains simple transformations such as renaming variables, functions, or removing comments.
By doing this kind of transformation, it removes the semantic contained in the name of variables, or the indications present in the comments.
It also contains operations such as changing the code formatting, which generally consist in removing spaces and lines.

We give an example on a simple program: 
{% highlight javascript %}
// Compute the sum of 2 numbers
function sum(number1, number2) {
	return number1 + number2
}
{% endhighlight %}

The original program could be transformed in this new program below:
{% highlight javascript %}
function sUSNO0(qsqzu_Pmj, azsd_hFZh){return qsqzu_Pmj+azsd_hFZh;}
{% endhighlight %}


## Control transformations
Control transformations aims at obsuring the control flow of the application.
These transformations are separated in three subcategories presented hereafter.

### Aggregation transformations
Aggregation transformations separate computations that are logically together, or merge code that are not. 
It is based on the idea that code that has been aggregated in a function or a class by a programmer must probably be linked. 
By separating it into different functions or classes, it makes it more difficult to understand.
On the opposite, merging unrelated blocks of code together makes it look like they have a semantic link.

### Ordering transformations
Ordering transformations randomize the order of instruction execution. 
It relies on the idea that spatial locality in the code, _i.e._ functions or statements close in the code, plays an important role in making the code more understandeable.

### Computation transformations
Computation transformations insert dead, redundant code, or make algorithmic changes. 
Their goal is to hide the real control flow by polluting it with irrelevant statements.
In contrary to transformations that target the visual representation of the program, this set of transformations may have an impact on the execution time of the program (cost metric).

The example below presents how we could transform the previous sum function by adding dead code and altering the control flow, without changing the value it returns.
{% highlight javascript %}
function sum(number1, number2) {
	var a = 42;
	var z ;
	var res;
	if(number1 < 753) {
		z = 890;
		res = number1 + z;
	} else {
		z = 56 + a;
		res = number1 + z;
	}
	return res+number2 - z;
}
{% endhighlight %}

## Data
Besides the visual representation of a program, transformations can also be applied to data structures.
These transformations are classified in three categories:

### Storage and encoding transformations
This strategy relies on using a non "natural" way to encode or store data.
For example, we can replace a boolean variable by two variables and a mapping function used to reconstruct the original value.
If a variable **v = false**, we can represent it with the tuple (**false, false, AND)**, **(false, true, AND)**, or **(true, false, AND)** where **AND** is the logical AND operator.
By using this tuple of 3 elements, we can compute the final value.
Besides boolean variables, this technique can be generalized to other type of variables.

The example below illustrates how we can split a boolean variable into a tuple of 3 elements:
{% highlight javascript %}
function evalBool(v1, v2) {
	return v1 && v2;
}

// originalValue = false;
// Instead of directly storing false, we store it as (v1: true, v2: false)
var encodedValue = {
    v1: true,
    v2: false
};

// Instead of storing directly the value in a boolean, we split it in 2 values and a function
if(evalBool(encodedValue.v1, encodedValue.v2)) {
	// do things
}
{% endhighlight %}

An other technique often used on strings is to not use the raw string directly, but instead convert the string into a program that produces the string.

### Aggregation transformations
Aggregation transformation aim at aggregating data structures to hide their original representation.
For example, it may operate on arrays by restructuring them.
An array can be split into multiple sub arrays, multiple arrays can be merged into one.
A one dimensional array can be folded into a higher dimensional array, or the opposite, called flattening, which is the process of decreasing the dimension of an array.
For example, by representing a 2D grid using a 1D array, it makes it more difficult to understand the purpose of the variable.

Besides arrays, these transformations may also focus on inheritance relationships.
It may increase the level of inheritance, or on the opposite decrease it by merging subclasses.

The example below presents how to flatten a 2D array to a 1D array:
{% highlight javascript %}

function getNewIndex(i, j) {
	return i + (i+1)*j;
}

var grid1D = new Array(m*n);

for(var i = 0; i < m; i++) {
	for(var j = 0; j < n; j++) {
		grid1D[getNewIndex(i, j)] = grid2D[i, j];
	}
}
{% endhighlight %}

### Ordering transformations
Ordering transformations randomize the order of declarations in the source code.
In particular, the order of methods and instances variables of a class, as well as parameters in functions.
It is also possible to randomize the order in which elements are stored in a data by providing a function that given an index **i**, maps it back to its original position in the array.


# Summary
The table below, extracted from ["A taxonomy of obfuscation transformations"](http://www.dsi.unive.it/~avp/collberg97taxonomy.pdf), provides an overview of the different obfuscating transformations as well as their impact on the potency, the resilience and the cost.
A **+** indicates that the value of the metric depends on the context.

<style type="text/css">
.tg  {border-collapse:collapse;border-spacing:0;}
.tg td{font-family:Arial, sans-serif;font-size:14px;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;}
.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;}
.tg .tg-e3zv{font-weight:bold}
.tg .tg-hgcj{font-weight:bold;text-align:center}
.tg .tg-amwm{font-weight:bold;text-align:center;vertical-align:top}
.tg .tg-9hbo{font-weight:bold;vertical-align:top}
.tg .tg-yw4l{vertical-align:top}

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
    <td class="tg-w0yn" rowspan="3" style="vertical-align:middle">Layout</td>
    <td class="tg-yw4l" rowspan="3" style="vertical-align:middle"></td>
    <td class="tg-yw4l">Scramble identifiers</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Change Formatting</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Remove Comments</td>
    <td class="tg-yw4l">high</td>
    <td class="tg-yw4l">one way</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-h1ue" rowspan="17" style="vertical-align:middle">Control</td>
    <td class="tg-yw4l" rowspan="7">Computations</td>
    <td class="tg-yw4l">Insert dead code</td>
    <td class="tg-yw4l" colspan="3" rowspan="4" style="vertical-align:middle">Depends on the quality of the opaque predicate and <br>the nesting depth at which the construct is inserted.</td>
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
    <td class="tg-yw4l"><b>+</b></td>
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
    <td class="tg-0zek" rowspan="7" style="vertical-align:middle">Aggregation</td>
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
    <td class="tg-yw4l" colspan="3" rowspan="2" style="vertical-align:middle">Depends on the quality of the opaque predicate.</td>
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
    <td class="tg-y0xi" rowspan="3" style="vertical-align:middle">Ordering</td>
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
    <td class="tg-h1ue" rowspan="15" style="vertical-align:middle">Data</td>
    <td class="tg-yw4l" rowspan="5" style="vertical-align:middle">Storage and encoding</td>
    <td class="tg-yw4l">Change encoding</td>
    <td class="tg-yw4l" colspan="3" style="vertical-align:middle">Depends on the complexity of the encoding function.</td>
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
    <td class="tg-yw4l" colspan="3">Depends on the number of variables the<br>original variable is split into.</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Convert static to procedural data</td>
    <td class="tg-yw4l" colspan="3">Depends on the complexity of the generated function.</td>
  </tr>
  <tr>
    <td class="tg-3smg" rowspan="8" style="vertical-align:middle">Aggregation</td>
    <td class="tg-yw4l">Merge scalar variables</td>
    <td class="tg-yw4l">low</td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Factor class</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l"><b>+</b></td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Insert bogus class</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l"><b>+</b></td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Refactor class</td>
    <td class="tg-yw4l">medium</td>
    <td class="tg-yw4l"><b>+</b></td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Split array</td>
    <td class="tg-yw4l"><b>+</b></td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Merge arrays</td>
    <td class="tg-yw4l"><b>+</b></td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Fold array</td>
    <td class="tg-yw4l"><b>+</b></td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">cheap</td>
  </tr>
  <tr>
    <td class="tg-yw4l">Flatten array</td>
    <td class="tg-yw4l"><b>+</b></td>
    <td class="tg-yw4l">weak</td>
    <td class="tg-yw4l">free</td>
  </tr>
  <tr>
    <td class="tg-y0xi" rowspan="2" style="vertical-align:middle">Ordering</td>
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

<br>
Some of the transformations present in the table have not been presented in this post, but their name is rather explicit about their purpose.
This post also didn't tackle the complexity of creating efficient opaque predicates capable of resisting to deobfuscators.
These different points may be treated in future posts on obfuscation.
Meanwhile, you can refer to this [article](http://www.dsi.unive.it/~avp/collberg97taxonomy.pdf) for more details.
