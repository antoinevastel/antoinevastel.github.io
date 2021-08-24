---
layout: post
title: "New feature to malicious IPs API: check an IP"
categories: [Bot]
tags: [API]
description:  Presentation of the new feature added to the malicious IPs API.
---

As promised in the previous blog post, I added new data sources to find more malicious IPs.
I also added a new endpoint to the malicious IPs API: <a href="https://antoinevastel.com/bots/ip/157.100.36.194">https://antoinevastel.com/bots/ip/ip-you-want-to-check</a>

To make an API call on this endpoint, simply call /bots/ips/ip-you-want-to-check where you should replace **ip-you-want-to-check** with the IP address you want to check.

You can call it using Curl or any HTTP request library you want:
```python
curl https://antoinevastel.com/bots/ip/157.100.36.194
```

## Data returned by the API

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
- `events`: an array that contains a list of timestamps where the IP was flagged as malicious. In case the IP is not present in our database, it is an empty array


**DISCLAIMER**: Please try to be responsible when making API calls, rate limit your requests.
