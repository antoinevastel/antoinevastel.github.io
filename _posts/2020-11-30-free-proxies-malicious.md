---
layout: post
title: "Analyzing Free proxies"
categories: [Fraud]
tags: [Proxies]
description: In this blog post, we analyze free proxies crawled on the web to detect malicious proxies that inject ads or alter the content of the page.
---


Intro: proxies?
kind of proxies: dc vs residential
How free proxies are obtained?

Collect a list of free proxies by crawling the web.
I made my own crawler, but you can easily use already existing projects like https://github.com/constverum/ProxyBroker.

We store the IP of the proxy, the protocol in a local DB.
We also enrich the data with information from Maxmind such as the autonomous system and the country.


Some stats: top ASes/countries for proxies
Say something that although we see a lot of data center proxies, we also see some residential IPs
// Probably dedup data by IP for more accuracy, otherwise we count multiple time since there are multiple proxy providers.


Request a page with HTTP on purpose to make it easier for proxies to modify the content.

Spoof headers and UA to appear human.
