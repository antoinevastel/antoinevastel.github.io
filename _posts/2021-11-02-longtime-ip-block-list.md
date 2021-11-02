---
layout: post
title: "Yet another bot IPs blocklist: longtime bot IPs"
categories: [Bot]
tags: [API]
description: Presentation of a new bot IPs blocklist. This list contains IPs (and IP ranges) that have been flagged as bots for a long time.
---

I recently published <a href="{% post_url 2021-10-31-blocking-lists-ips %}">4 blocklists</a> that essentially focus on data center IP ranges.

However, more and more attackers operate from residential IPs.
That's why I've decided to publish another blocking list that focuses on IP addresses that have been used by bots for a long period.
Because of the way this list is built, it contains both data center IP ranges, as well as residential IPs.

The list is available at the following URL: <a href="https://antoinevastel.com/data/avastel-longtime-bot-ips.txt">https://antoinevastel.com/data/avastel-longtime-bot-ips.txt</a>

## How is the list built?

The **long time infected IPs blocklist** is built daily using the last 10 weeks of data collected by the malicious bot IPs API.
For each IP address, we leverage the following information:
1. Number of events where an IP address was used by a bot;
2. Timespan between the first and last bot detection events.

IPs are included in the list if they meet the following criteria:
- Timespan (duration between first and last bot detection event) is > 15 days;
- Ratio between number of events/time span is **> 0.2**. This second criterion helps to ensure that we have enough events to take a significant decision. It avoids overestimating the lifetime of an IP address.


## False-positive disclaimer

Even though residential IPs present in this list have been used by bots for > 15 days, they may still be shared with legitimate humans.
To lower the false-positive risk, you should adjust the blocking decision based on other criteria than the IP address.