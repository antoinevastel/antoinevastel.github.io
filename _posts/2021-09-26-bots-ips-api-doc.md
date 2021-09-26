---
layout: post
title: "Bots IPs API: documentation"
categories: [Bot]
tags: [API]
description: Documentation of the bots IPs API as well as explanation about the data returned by the API.
---


## API overview

I provide a free API to get information about IP addresses used by bots.
Feel free to use it in any of your projects.

**False positives:** I try to keep a low false-positive rate by using heuristics for which I have great certainty the IP has been used by a bot.
Except for Tor exit nodes, **I DON'T** crawl any malicious IP list. 
All the IPs flagged as bots are obtained through several techniques that enables me to be sure about the fact they were/are used by bots (proxies, honeypots).
However, keep in mind that some of these IPs may be also shared by legitimate human users.

## API routes

For the moment, the API has 2 routes:
1. Get 5k recent bots IPs: GET <a href="https://antoinevastel.com/bots/ips">https://antoinevastel.com/bots/ips</a>;
2. Check an IP address: GET <a href="https://antoinevastel.com/bots/ip/157.100.36.194">https://antoinevastel.com/bots/ip/ip-you-want-to-check</a> (replace ip-you-want-to-check with the IP address you want to check).

### /bots/ips

An API call returns JSON content representing an array of objects linked to malicious IPs.
It returns at most 5000 IPs.
If there are more malicious IPs, it returns the latest malicious IPs detected.
Each object of the JSON array has the following properties:
- `ip`: malicious IP address
- `time`: date representing when the IP was flagged as malicious
- `autonomousSystemOrganization`: name of the IP autonomous system (enriched using Maxmind)
- `autonomousSystemNumber`: autonomous system number linked to the IP (enriched using Maxmind)
- `country`: country of the IP address (enriched using Maxmind)


There may be duplicates if the same IP was flagged multiple times.

### /bots/ip/ip-you-want-to-check

For a given IP, an API call returns JSON content representing information about the IP requested.

```python
{
  "matched": true,
  "ip": "91.202.133.37",
  "autonomousSystemOrganization": "SpaceNet LLC",
  "autonomousSystemNumber": 44686,
  "country": "UA",
  "events": [
    1629553470430
  ]
}
```

In case the IP address is present in the database, the `matched` field is set to `true`.
Otherwise, it's set to `false`.
In all cases (even when the IP is not present in our database), we always return information about the IP:
- `ip`: value of the requested IP,
- `autonomousSystemOrganization`: name of the IP autonomous system (enriched using Maxmind)
- `autonomousSystemNumber`: autonomous system number linked to the IP (enriched using Maxmind)
- `country`: country of the IP address (enriched using Maxmind)
- `events`: an array that contains a list of dates where the IP was flagged as malicious. In case the IP is not present in our database, it is an empty array
