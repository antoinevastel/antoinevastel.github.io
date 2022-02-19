---
layout: post
title: "NodeJS: how to route HTTPS requests through an HTTP proxy without any external dependencies"
categories: [NodeJS]
tags: [NodeJS, Proxies]
description: Short NodeJS example that showcases how you can make HTTPS requests routed through HTTP proxies without using any external dependencies.
---

## Why I try to rely less on external dependencies
These last years there has been an increasing number of supply chain attacks, particularly in the NodeJS ecosystem, cf <a href="https://www.mandiant.com/resources/supply-chain-node-js">Supply Chain Compromises Through Node.js Packages</a>, <a href="https://hackaday.com/2021/10/22/supply-chain-attack-npm-library-used-by-facebook-and-others-was-compromised/">NPM library used by Facebook and others was compromised</a> where attackers compromise heavily popular NodeJS packages hosted on NPM to compromise other packages/devices.
The compromise can occur using different techniques, such as merging a malicious commit that appear benign or stealing the maintainer's NPM account by conducting a credential stuffing/brute-force attack on his account and then modifying the package code.
Since most NPM packages rely on a lot of dependencies (<a href="https://blog.appsignal.com/2020/04/09/ride-down-the-javascript-dependency-hell.html">Ride Down Into JavaScript Dependency Hell</a>), compromising one heavily used package can result in thousands of compromised packages.
For this reason (and also for the sake of learning lower-level details of NodeJS) I try to rely less on external NPM packages for my side projects (I didn't appreciate having to fix one of my projects at 1 am because of <a href="https://portswigger.net/daily-swig/popular-npm-package-ua-parser-js-poisoned-with-cryptomining-password-stealing-malware">ua-parser-js being compromised</a>).


## Making HTTPs requests through proxy in NodeJS without any non-native dependencies

One of the tasks I commonly do is making HTTPS requests through an HTTP proxy.
Until recently, I heavily relied on external dependencies such as Axios, node-fetch, or requests.
When I decided to try to do it without any non-native dependencies I was surprised by how difficult it was for something that (I think) should be straightforward.
When I searched for help on StackOverflow/Github, most of the response were basically: "Use this 3rd party library" (e.g. <a href="https://stackoverflow.com/a/21281075">https://stackoverflow.com/a/21281075</a>)
After being bored of testing the different code snippets to check if they were working with HTTPS URLs (which was not always the case) as well as with the latest NodeJS version (at that time 17.5.0), I decided to publish a solution (to save myself, and maybe others, sometime in the future).
It is inspired by the following responses/comments I found online:
- <a href="https://github.com/nodejs/node-v0.x-archive/issues/2474#issuecomment-3481078">https://github.com/nodejs/node-v0.x-archive/issues/2474#issuecomment-3481078</a>
- <a href="https://stackoverflow.com/a/41027319">https://stackoverflow.com/a/41027319</a>
- <a href="https://stackoverflow.com/a/49611762">https://stackoverflow.com/a/49611762</a>

<br>
```javascript
// You should have a variable conf that contains information about your proxies:
// {
//     "proxy_username": 'username',
//     "proxy_password": 'password',
//     "proxy_host": 'proxyhost.com',
//     "proxy_port": 8888
// }

// The only 2 dependencies we use are http and https but both are native to NodeJS
var http = require("http");
var https = require('https');

async function getURL(url, headers) {
    return new Promise((resolve, reject) => {
        const urlParsed = new URL(url);
        headers = headers || {};
        headers['Proxy-Authorization'] = 'Basic ' + Buffer.from(conf.proxy_username + ':' + conf.proxy_password).toString('base64');
        http.request({
            host: conf.proxy_host,
            port: conf.proxy_port,
            method: 'CONNECT',
            path: `${urlParsed.hostname}:443`,
            headers
        }).on('connect', (res, socket) => {
            // To avoid leaking the header since it could enable someone to detect you!
            delete headers['Proxy-Authorization']
            if (res.statusCode === 200) {
                const agent = new https.Agent({ socket });
                var req = https.get({
                    host: urlParsed.hostname,
                    path: urlParsed.pathname,
                    agent,
                    headers: headers
                }, (response) => {
                    const chunks = [];
                    response.on('data', (chunk) => {
                        chunks.push(chunk);
                    });
                    response.on('end', () => {
                        resolve({
                            body: Buffer.concat(chunks).toString(),
                            headers: response.headers,
                            status: response.statusCode
                        })
                    });

                    response.on("error", (err) => {
                        reject(err);
                    })

                    response.setTimeout(15000, () => {
                        reject('Timeout')
                    })
                });

                req.on('error', (err) => {
                    reject(err.message);
                })
            } else {
                reject('Could not connect to proxy!')
            }

        }).on('error', (err) => {
            reject(err.message);
        }).end();
    })

}
```

The code snippet below shows how we can call the `getURL` function that makes an HTTPS request routed through a proxy.
It also shows how you can supply your own HTTP headers:

```javascript
(async() => {
    const headers = {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "referrer": "https://www.google.com/",
        "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"98\", \"Google Chrome\";v=\"98\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4858.102 Safari/537.36"
    }

    const res = await getURL('https://ipapi.co/json', headers);
    console.log(res.body);


})();

```

In my case, I obtained the following response where we see that the request is from Brazil, which proves that the request was properly routed through the HTTP proxy (I have a French IP otherwise):

```javascript
{
    "ip": "177.85.130.114",
    "version": "IPv4",
    "city": "Arapiraca",
    "region": "Alagoas",
    "region_code": "AL",
    "country": "BR",
    "country_name": "Brazil",
    "country_code": "BR",
    "country_code_iso3": "BRA",
    "country_capital": "Brasilia",
    "country_tld": ".br",
    "continent_code": "SA",
    "in_eu": false,
    "postal": "57300",
    "latitude": -9.7438,
    "longitude": -36.5931,
    "timezone": "America/Maceio",
    "utc_offset": "-0300",
    "country_calling_code": "+55",
    "currency": "BRL",
    "currency_name": "Real",
    "languages": "pt-BR,es,en,fr",
    "country_area": 8511965.0,
    "country_population": 209469333,
    "asn": "AS262608",
    "org": "Vapt Solucoes Tecnologicas Ltda"
}
```

Feel free to contact me by email/on Twitter if you have a better solution that you would like to share!
