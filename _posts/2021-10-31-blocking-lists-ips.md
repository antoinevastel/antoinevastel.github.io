---
layout: post
title: "Bot IPs blocklists"
categories: [Bot]
tags: [API]
description: Presentation of the bot IPs blocklists, 4 blocklists that can be used to easily block malicious bot traffic (mostly data center IPs).
---


It's been ~2 months since I started to gather data related to malicious bot IPs.
With the current version of the bot IPs API, it's possible to <a href="{% post_url 2021-09-26-bots-ips-api-doc %}">obtain information about recent bot IPs or to test a particular IP address.</a>
However, it may not be the best format if you want to **quickly** and **safely** block malicious traffic in production.

To make it easier for people looking for a simple solution to block malicious traffic, I've decided to publish 4 IP blocklists linked to bad bots.
Because of the way they're built (more details after) and the fact these lists aim to block traffic solely based on their IP address, these lists are only constituted of data center IPs.
Indeed, it's not advised to block residential IPs solely based on the fact they've been used by bots/as a proxy recently since they are often shared with legitimate human users.

For conciseness, I publish IPs to block as /24 IP ranges (256 IPs).
For the moment, the lists don't contain individual IPs to block.
Nevertheless, you can build your own list using data from the bot IPs API.

## 4 (+1) bot IP addresses blocklists:
I've built 5 blocking lists derived from the same data:
- <a href="https://antoinevastel.com/data/avastel-block-ultra-safe.txt">Avastel block ultra safe</a>: contains /24 data center IP ranges that I consider ultra safe to block in production.
- <a href="https://antoinevastel.com/data/avastel-block-safe.txt">Avastel block safe</a>: contains /24 data center IP ranges that I consider safe to block in production.
- <a href="https://antoinevastel.com/data/avastel-block-moderate.txt">Avastel block moderate</a>: contains /24 data center IP ranges that I consider moderately safe to block in production.
- <a href="https://antoinevastel.com/data/avastel-block-aggressive.txt">Avastel block aggressive</a>: contains /24 data center IP ranges that I consider a bit risky to block in production.
- **New**: <a href="https://antoinevastel.com/data/avastel-ips-7d.txt">Avastel all infected IPs last 7 days </a>: contains all IP addresses that have been used by bots/proxies in the last 7 days.


## How are these lists built?

The description applies to all list except **"Avastel all infected IPs last 7 days"** since this list is constituted of all bots/proxies IPs of the last 7 days.

The other lists are built daily using the last month of data collected by the malicious bot IPs API.
For the moment, the strategy is simple:
1. Group all IPv4 addresses by their first 3 bytes.
2. Count the number of IPv4 addresses in each group, i.e. number of IPs per /24 range.
3. For each /24 IP range, if a significant fraction of the 256 IPs is flagged as malicious by the bot IPs API, then flag the whole /24 range as malicious.

The minimum fraction of bad bot IPs in a /24 IP range (**step 3**) influences the generated list. 
The lower the fraction of bad bot IPs, the greater the number of IP ranges to block. 
However, decreasing this number also increases the chance of wrongly flagging a whole /24 IP range.

Current bad bot fraction for the different lists:
- <a href="https://antoinevastel.com/data/avastel-block-ultra-safe.txt">Avastel block ultra safe</a>: **> 83%** of known bad bot IPs.
- <a href="https://antoinevastel.com/data/avastel-block-safe.txt">Avastel block safe</a>: **> 73%** of known bad bot IPs.
- <a href="https://antoinevastel.com/data/avastel-block-moderate.txt">Avastel block moderate</a>: **> 63%** of known bad bot IPs.
- <a href="https://antoinevastel.com/data/avastel-block-aggressive.txt">Avastel block aggressive</a>: **> 50%** of known bad bot IPs.

Even for the most aggressive list, I consider these values to be safe since they're computed on data center IPs only, but I'll let you make yourself an opinion on real-world traffic.
