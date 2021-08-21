---
layout: post
title: Analysis fingerprints
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: This post presents a new technique that enables to distinguish a vanilla Chrome browser from a Chrome browser running in headless mode.
---

I posted a post about a new simple technique to easily distinguish Chrome browsers from Chrome headless browsers.
It got popular on Hacker news so I had the chance to collect some fingerprints.
The test does not require any JavaScript fingerprint, but I think it would still be interesting to share some statistics.

## What are inconsistencies?

People lie about their fingerprint not to be detected.
Headless browsers also have subtle differences that can be used to detect them as presented in these posts.

## Attributes collected

TODO list of some of the attributes collected

## Dataset

TODO general numbers

8457 fingerprints with JS activated.

Graph number of browsers: TODO add graph

Graph diversity OS (I have grouped fedora and Ubuntu under Linux): TODO add graph

Some of the most popular canvas

## Some inconsistencies

Not all inconsistencies mean headless browsers.
Some may arise because users have a user-agent spoofer or use a fingerprinting countermeasure.


list of fonts? num fonts?

Here is the code of the analysis


