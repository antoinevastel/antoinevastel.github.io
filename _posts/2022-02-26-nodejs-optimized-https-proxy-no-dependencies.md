---
layout: post
title: "NodeJS: how to route HTTPS requests through an HTTP proxy without any external dependencies (optimized version)"
categories: [NodeJS]
tags: [NodeJS, Proxies]
description: Short but optimized NodeJS example that showcases how you can make HTTPS requests routed through HTTP proxies without using any external dependencies.
---
**Update**: I recently created <a href="https://deviceandbrowserinfo.com/info_device">a new website around the bot detection and fingerprinting topics.</a> You can see your browser fingerprint and different fingerprinting-related signals like your IP address, your canvas fingerprint, your HTTP headers, etc. Some information is accessible both through a webpage and through APIs.

<br>
<br>


In <a href="{% post_url 2022-02-19-nodejs-https-proxy-no-dependencies %}">a previous blog post</a> I showed how to make HTTPs requests through HTTP proxies in NodeJS using no external dependencies.
It's part of a series of articles where I present how to do frequent NodeJS/JavaScript tasks using no/less external dependencies.

However, if you run the code of the previous blog post on more than > 10 URLs, you may notice that it takes a lot of time to make only a few HTTPS requests.
The main reason is that for each HTTPS request you make, the `getURL` function establishes a new connection with the proxy, which is highly inefficient.

We use the program below to measure the time it takes to make 50 HTTPS requests through an HTTP proxy:

```javascript
(async () => {
    const urls = new Array(50).fill('https://api.ipify.org/?format=json');

    for (const [i, url] of urls.entries()) {
        console.log(`${i + 1}/${urls.length}`);
        try {
            const res = await getURL(url);
            console.log(res.body);
        } catch (e) {
            console.log(e)
        }
    }
})();
```

In total, it takes ~4 min 48s to make the 50 HTTPS requests (5.8 s/request):
```shell
time node non-optimized.js
1/50
138.121.240.87
...
50/50
115.93.182.68

node non-optimized.js  0.70s user 0.09s system 0% cpu 4:48.24 total
```

## Optimizing code to make HTTPs requests through HTTP proxies

This section presents how we can improve the code of the `getURL` function to make it faster.
The goal is to stop establishing a connection with the HTTP proxy at each request since that's what heavily slows down our code.

We define a class called `HttpsWithProxyClient` since we have to store information between different HTTPS requests:
- `proxyAgent`: an <a href="https://nodejs.org/api/https.html#class-httpsagent">https.Agent</a> instance to maintain the connection with the proxy.
- `lastRequestHostname`: to store the last host on which we made an HTTPS request. Indeed, if we make an HTTPs request to a different host, we have to reset the connection with the proxy.

```javascript
var http = require("http");
var https = require('https');

class HttpsWithProxyClient {
    constructor(proxyConf) {
        this.proxyConf = proxyConf;
        this.proxyAgent = null;
        this.lastRequestHostname = null;
    }

    // Async private method, used only internally by HttpsWithProxyClient
    // Handle the connection with the HTTP proxy
    // In case the connection is successful, it returns a new http.Agent with keepAlive activated
    async _connectToProxy(url) {
        return new Promise((resolve, reject) => {
            const headers = {
                'Proxy-Authorization': 'Basic ' + Buffer.from(this.proxyConf.proxy_username + ':' + this.proxyConf.proxy_password).toString('base64')
            }

            const urlParsed = new URL(url);
            http.request({ // establishing a tunnel
                host: this.proxyConf.proxy_host,
                port: this.proxyConf.proxy_port,
                method: 'CONNECT',
                path: `${urlParsed.hostname}:443`,
                headers
            }).on('connect', (res, socket) => {
                if (res.statusCode === 200) {
                    resolve(new https.Agent({ socket: socket, keepAlive: true }));
                } else {
                    reject('Could not connect to proxy!')
                }

            }).on('error', (err) => {
                reject(err.message);
            }).on('timeout', (err) => {
                reject(err.message);
            }).end();
        });
    }

    // Public asynchronous method used to make an HTTPs get request on a given URL through an HTTP proxy
    async getURL(url, headers) {
        return new Promise(async (resolve, reject) => {
            const urlParsed = new URL(url);
            headers = headers || {};
            
            // If there's no current valid connection established with the proxy
            // or if the host linked to the URL requested is different from the previous request
            // -> recreate a connection with the proxy
            if (!this.proxyAgent || this.lastRequestHostname !== urlParsed.hostname) {
                try {
                    this.proxyAgent = await this._connectToProxy(url);
                    this.lastRequestHostname = urlParsed.hostname;
                } catch (e) {
                    return reject(e);
                }
                
            }

            const req = https.get({
                host: urlParsed.hostname,
                path: urlParsed.pathname,
                agent: this.proxyAgent,
                headers: headers,
            }, (response) => {
                const chunks = [];
                response.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                response.on('end', () => {
                    resolve({
                        body:Buffer.concat(chunks).toString(),
                        headers: response.headers,
                        status: response.statusCode
                    })
                });

                response.on("error", (err) => {
                    reject(err);
                })

                response.setTimeout(25000, () => {
                    reject('timeout')
                })
            });

            req.on('error', (err) => {
                this.proxyAgent = null;
                reject(err.message);
            })
        })
    }
}
```

We leverage the `HttpsWithProxyClient` class we just created to measure the performance improvement compare to the naive implementation of `getURL` defined in <a href="{% post_url 2022-02-19-nodejs-https-proxy-no-dependencies %}">the previous blog post</a>:

```javascript
(async () => {
    const conf = {
        "proxy_username": 'xxxxx',
        "proxy_password": 'xxxxxx',
        "proxy_host": 'xxxxx.com',
        "proxy_port": 8000
    }

    // Side effect is even if you have a rotating proxy, the IP will be stable
    const httpsClient = new HttpsWithProxyClient(conf);
    const urls = new Array(50).fill('https://api.ipify.org/?format=json');

    for (const [i, url] of urls.entries()) {
        console.log(`${i + 1}/${urls.length}`);
        try {
            const res = await httpsClient.getURL(url);
            console.log(res.body);
        } catch (e) {
            console.log(e)
        }
    }
})();
```

```shell
time node optimized.js 
1/50
115.163.214.177
...
50/50
194.15.57.236

node optimized.js  0.26s user 0.13s system 0% cpu 57.807 total
```

The new optimized version takes **57s** to make 50 requests, against **4 min 48 s** for the non-optimized version.
Execution time has been divided by **~5**!

However, there is **one significant fonctional difference between the 2 programs:** since we persist the connection with the proxy, the IP address will remain the same as long as the connection persists, EVEN IF you use an auto-rotating proxy.
If you want the best of both worlds, you could modify the `HttpsWithProxyClient` class so that it resets the proxy connection every `N` request to obtain a new IP address.
