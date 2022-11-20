---
layout: post
title: "Using Python3-nmap to fingerprint and cluster proxies"
categories: [Bot]
tags: [Python, Proxies, Nmap]
description: How to leverage the Python3-nmap library to fingerprint proxies and group proxy IPs using their fingerprint. As an example, we use the list of open ports as a simple fingerprint.
---

A proxy is a program that enables users to change their IP address by routing traffic through someone else’s infrastructure.
Proxies are often used by attackers to distribute their attack and make it look like requests are coming from lot of different devices.

## Categories of proxies
There exists different kinds of proxies:
- **Data-center:** the proxy IP located in data-centers like AWS, Google, OVH. They tend to have a low latency due to their location in data-centers with good connectivity.
- **Residential:** the IP belongs to an ISP, e.g. Comcast, Verizon, AT&T. The proxy is located on a real-user device. Thus, the latency tends to be higher than data-center proxies.
- **ISP:** ISP proxies combine the best of data-center and residential proxies. The IP address of ISP proxies are registered under the name of well known ISPs like AT&T, but are located in data centers. Thus, these proxies combine a good IP reputation with a low latency connection.

## How do proxy providers obtain proxies?

To obtain **data-center proxies**, proxy providers need to have physical or virtual machines in the cloud or in data-centers, and run a proxy agent like <a href="http://www.squid-cache.org/">Squid proxy</a>.

ISP proxies are similar to data center proxies, but proxy providers have to acquire IP blocks to ISPs beforehand.
This way, it looks like traffic comes from an ISP IP address instead of a data-center IP.
In both case, everything is clean and legal. All machines and IP addresses belong to the proxy provider.

When it comes to residential proxies, the situation may become a litle bit more shady.
As I already discussed in this <a href="https://datadome.co/bot-management-protection/how-proxy-providers-get-residential-proxies/">DataDome blog post</a>, proxy providers obtained residential proxies using different.
While some approaches are legal, while not being necessarly moral, others rely on malware and are clearly illegal.

### Legal methods:
- **Mobile and software SDKs:** some proxy providers offer an SDK to be included in desktop software or mobile applications. These SDKs enable developers to monetize their applications instead of/in addition to ads. While this approach is legal as most SDKs tend to explicitly ask for user permission, a few people probably realize what it implies.
- **Browser extensions:** proxy providers also contact some owners of popular browser extensions so that they include their proxy code in the extension.

### Illegal methods:

- **Malware:** <a href="https://www-users.cse.umn.edu/~fengqian/paper/rpaas_sp19.pdf">Researchers</a> actively fingerprinted proxies to determine the type of devices on which proxies were running.
Their analysis showed that some proxies of the proxy network they were using were linked to webcams and IoT devices probably part of a botnet (as it's not possible to explicitly give consent on these kinds of devices to install an SDK).

Thus, I was curious to see if we could cluster proxies using ports open as a sort of cheap fingerprint.
I had no particular expectations in mind, maybe see if some clusters of open ports would be linked:
- to data-center or residential proxies;
- bots conducting aggressive vulnerability scanning, since it could indicate compromised machines;

## Scanning 10K proxies to detect open ports

I use the <a href="https://raw.githubusercontent.com/antoinevastel/avastel-bot-ips-lists/master/avastel-ips-7d.txt">Avastel all infected IPs 7d blocklist</a> to get a list of IPs recently identified as proxies.
I randomly select a sample of 10,000 proxy IPs.

Then, I leverage the <a href="https://pypi.org/project/python3-nmap/">Python3 Nmap library</a> to programmatically scan these proxy IPs.

To speed up the scanning process I did two things:
1. I leverage the <a href="https://docs.python.org/3/library/concurrent.futures.html">ThreadPoolExecutor class</a> to scan multiple IP addresses in parallel.
2. I scan the top 50 ports using the `--top-ports` in Nmap. This flag can be used through the `scan_top_ports` method in the python3-nmap library.

To decrease the chance of having our scan detected and blocked, I also use the `Pn` Nmap flag.

**Disclaimer:** We may still miss open ports even using these options.
However, it's still a good estimate for my informal blog post study.

The code below shows the program used for scanning.
Results are saved to a JSON file for a later study.

```python
import nmap3
import json
import random
from concurrent.futures import ThreadPoolExecutor, as_completed


def read_ips_list(file_path='', max_ips=100):
    ips = []
    with open(file_path, 'r') as f:
        for line in f.readlines():
            ips.append(line.split(';')[0])

    return random.sample(ips, max_ips)


def save_scan_results(file_path, ip_to_open_ports):
    with open(file_path, 'w+') as f:
        f.write(json.dumps(ip_to_open_ports))


def get_top_ports_open_ip(ip_address, num_ports=50):
    nmap = nmap3.Nmap()
    results = nmap.scan_top_ports(ip_address, default=num_ports, args='Pn')
    ip_address_res_nmap = list(results.keys())[0]
    try:
        open_ports = [port for port in results[ip_address_res_nmap]['ports'] if port['state'] != 'closed' and port['state'] != 'filtered']
        return ip_address, open_ports
    except KeyError:
        return ip_address, []


def main():
    # The list is https://raw.githubusercontent.com/antoinevastel/avastel-bot-ips-lists/master/avastel-ips-7d.txt
    # Version of Nov 1st 2022
    ip_addresses = read_ips_list('./ip-list.txt', 10000)
    ip_address_to_open_ports = dict()

    futures = []
    with ThreadPoolExecutor(max_workers=40) as executor:
        for idx, ip_address in enumerate(ip_addresses):
            future = executor.submit(get_top_ports_open_ip, ip_address)
            futures.append(future)

    tasks_completed = 0
    for future in as_completed(futures):
        tasks_completed += 1
        ip_address, open_ports = future.result()
        ip_address_to_open_ports[ip_address] = open_ports

    save_scan_results('./parallel-results-scan.json', ip_address_to_open_ports)

if __name__ == "__main__":
    main()
```

## Analyzing the proxy IPs scan results

For each IP address scanned, the saved JSON file contains information about the list of ports open:

```python
[
    {
        "protocol": "tcp",
        "portid": "80",
        "state": "open",
        "reason": "syn-ack",
        "reason_ttl": "0",
        "service": {
            "name": "http",
            "method": "table",
            "conf": "3"
        },
        "cpe": [],
        "scripts": []
    },
    {
        "protocol": "tcp",
        "portid": "443",
        "state": "open",
        "reason": "syn-ack",
        "reason_ttl": "0",
        "service": {
            "name": "https",
            "method": "table",
            "conf": "3"
        },
        "cpe": [],
        "scripts": []
    }
]
```

Thus, we can write a simple program that obtains, for each combination of open ports, the list of IP addresses that have this exact combination of ports open:
```json
{
    "5060,443,1723,80,587,8080": [
        {
            "ip_address": "90.151.104.2",
            "autonomous_system": "Rostelecom"
        }
    ],
    "443,80,993,8080": [
        {
            "ip_address": "106.111.50.202",
            "autonomous_system": "Chinanet"
        }
    ],

    ...

    "5060,993,465,443,80,8080": [
        {
            "ip_address": "45.141.178.7",
            "autonomous_system": "AS-BLAZINGSEO"
        },
        {
            "ip_address": "122.117.6.228",
            "autonomous_system": "Data Communication Business Group"
        }
    ],
    "5060,993,995,465,443,8080": [
        {
            "ip_address": "110.77.149.50",
            "autonomous_system": "CAT TELECOM Public Company Ltd,CAT"
        }
    ],
    "5060,53,22,80,443,1723,21,8080": [
        {
            "ip_address": "218.24.16.198",
            "autonomous_system": "CHINA UNICOM China169 Backbone"
        }
    ],
    "5060,993,995,465,443,80,587,8080": [
        {
            "ip_address": "177.37.179.250",
            "autonomous_system": "BRISANET SERVICOS DE TELECOMUNICACOES LTDA"
        }
    ],
    "587,5060,443,8080": [
        {
            "ip_address": "202.88.37.56",
            "autonomous_system": "HENGTONG-IDC-LLC"
        },
        {
            "ip_address": "104.165.108.114",
            "autonomous_system": "EGIHOSTING"
        }
    ]
}
```

While we see that some combinations of open ports are only present on a single/few IP proxies, e.g. 587,5060,443,8080 or 5060,993,995,465,443,80,587,8080, others are way more present, e.g. 80, and 443,80.
The most common combination of open ports is 8080,5060,443,80, present 3785 times among the 10,000 scanned IPs.

The top 10 combinations of ports are listed below:
```
ports open;count
443,5060,80,8080;3785
no_ports_open_detected;2584
443,5060,8080;508
5060,80,8080;496
443,5060,80;490
443,80,8080;434
5060,80;189
443,5060;189
5060,8080;164
80,8080;126
```

I checked if some of these clusters could be linked to specific proxy sources I use to build my list (honeypot, data-center proxies, residential proxies, free proxies).
The two most frequent combination of open ports, '443,5060,80,8080' and '443,5060,8080', are mostly linked to data-center proxy providers I use to gather proxy IPs, as well as  IP addresses that conducted vulnerability scaning on some of my honeypots).
We don't see a significant volume of clean residential IPs with this combination of open ports.

On the contrary, proxies with ports "5060,80" open seems mostly linked to IPs conducting vulnerability scanning and free proxies scraped online.
This finding could indicate the presence of proxies acquired maliciously through the use of malware.


## Conclusion and next steps

In this blog post, we showed how to:
- create a simple Python program to automatically scan ports open on proxy IPs;
- use the combination of open ports as a cheap fingerprint to cluster similar proxy IPs together.

We could go further, for example by making HTTP(s) requests to IPs that have ports often linked to HTTP(s) open such as 80, 443, or 8080.
We could also ask nmap to extract more information like the OS and its version.
These values could be used as additional bits of information to enrich the proxy fingerprint.

Instead of doing the scan yourself, you can also use services/APIs such as Shodan as they tend to provide these kinds of information as shown on these screenshot below for IP = 221.120.210.67:

<img src="/assets/media/shodan-ip-scan.png">

However, <a href="https://account.shodan.io/billing">it has a cost</a> (in case you want to do it for a side project!).
