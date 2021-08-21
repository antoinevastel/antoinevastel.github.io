---
layout: post
title: "A free API to get recent malicious IPs"
categories: [Bot]
tags: [API]
description: Short presentation of an API I made to get a list of malicious IPs.
---

I decided to provide a free API to get a list of recent malicious IPs.
Feel free to use it in any of your projects.
IPs are collected through several sources/techniques.
I'll try to add more of them in the future.

**False positives:** I try to keep a low false-positive rate by using heuristics for which I have great certainty the IP is malicious.
However, keep in mind that some of these IPs may be also shared by legitimate human users.

The API is available at <a href="https://antoinevastel.com/bots/ips">https://antoinevastel.com/bots/ips</a>.

You can call it using Curl or any HTTP request library you want:
```python
curl https://antoinevastel.com/bots/ips
```

## Data returned by the API

An API call returns JSON content representing an array of objects linked to malicious IPs.
It returns at most 5000 IPs.
If there are more malicious IPs, it returns the latest malicious IPs detected.
Each object of the JSON array has the following properties:
- **ip**: malicious IP address
- **time**: timestamp in ms when the IP was flagged as malicious
- **autonomousSystemOrganization**: name of the IP autonomous system (enriched using Maxmind)
- **autonomousSystemNumber**: autonomous system number linked to the IP (enriched using Maxmind)
- **country**: country of the IP address (enriched using Maxmind)


There may be duplicates if the same IP was flagged multiple times.
Note that data are updated every 5 min, so no need to make too many API calls.

**DISCLAIMER**:
The IPs returned by this API are NOT obtained from any pages of my website. 
You CAN continue to use your bots on the following links, it will NEVER be used to enrich this API (if you don't trust me, you can test):
- https://antoinevastel.com/bots
- https://antoinevastel.com/bots/datadome
- https://arh.antoinevastel.com/bots/areyouheadless
