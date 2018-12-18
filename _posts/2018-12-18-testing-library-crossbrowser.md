---
layout: post
title: Testing Fp-Collect using CrossBrowserTesting
categories: [testing]
tags: [testing, fingerprinting]
description: This post presents how we use CrossBrowserTesting with Selenium in order to test the Fp-Collect fingerprinting library on different operating systems and browsers.
published: true
---

In this post we present a small program where we use
<a href="https://crossbrowsertesting.com/">CrossBrowserTesting</a> to
test <a href="https://github.com/antoinevastel/fp-collect">Fp-Collect</a>,
the fingerprinting library used to collect fingerprints
that can be analyzed by <a href="https://github.com/antoinevastel/fpscanner">Fp-Scanner</a>,
a bot detection library.

<a href="https://crossbrowsertesting.com/">CrossBrowserTesting</a> is a
service that enables to test your website from
a large number of device and browser configurations.
You can either run the tests manually by interacting with the remote
devices with your mouse through CrossBrowserTesting website
or you can use their API with Selenium or any other testing framework to
automate your tests.

Since browser fingerprinting heavily relies on APIs available only on
certain browsers and devices, it is frequent to encounter bugs.
While we currently test the code of Fp-Collect using <a href="https://github.com/antoinevastel/fp-collect/blob/master/test/test.js">Chrome headless and
Puppeteer</a>, it is unfortunately not always enough to catch all the bugs that
may occur on exotic devices and browsers.
Thus, in this post, we present a simple example where we use
 CrossBrowserTesting to test Fp-Collect using different device configurations.

# Testing strategy

We use a simple testing strategy; the idea is to visit the following page <a href="https://antoinevastel.com/bots/fpstructured">https://antoinevastel.com/bots/fpstructured</a>
to verify if the fingerprint of the automated browser is properly collected.

If you want to run the following tests you will need a CrossBrowserTesting account.

First, we start by importing the Selenium web driver.

```javascript
const webdriver = require("selenium-webdriver");
```

Then, we create a function that reads a <a href="/assets/data/browsers.json">JSON file</a> provided by CrossBrowserTesting
in order to generate different OS and browser configurations that we
use for our tests.
While we generate only around 30 different configurations,
it is possible to generate more configurations by combining different browsers
with different OS.

```javascript
function getDevicesCaps() {
    const dataDevices = Array.from(require('./browsers.json'));
    // For the moment we extract only 1 configuration per element of the array
    return dataDevices.map((info) => {
        const result = {};
        Object.keys(info.caps).forEach((property) => {
            result[property] = info.caps[property];
        });

        Object.keys(info.browsers[0].caps).forEach((property) => {
            result[property] = info.browsers[0].caps[property];
        });

        Object.keys(info.resolutions[0].caps).forEach((property) => {
            result[property] = info.resolutions[0].caps[property];
        });

        return result;
    });
}
```

Then, we define a function whose goal is to verify the content of the
div with the **"fp"** id.
In the case where its content is an empty string, we add the device
configuration to the list of configurations that bug.

```javascript
const failedCaps = [];

async function getResult(driver, cap) {
    const fp = await driver.findElement(webdriver.By.id('fp')).getText();
    if (typeof fp === "undefined" || fp === "") {
        failedCaps.push(cap);
    }
    return true;
}
```

Then, we can launch our tests for each of the configuration we have generated.
While here we launch the tests sequentially, CrossBrowserTesting provides a
way to run multiple tests in parallel.
```javascript
(async () => {
    const cbtHub = "http://hub.crossbrowsertesting.com:80/wd/hub";
    const devicesCaps = getDevicesCaps(); // generate the list of configurations

    for (let deviceCap of devicesCaps) {
        deviceCap.username = username; // replace username by your username
        deviceCap.password = authkey; // replace authkey by your authentication key

        const driver = new webdriver.Builder()
            .usingServer(cbtHub)
            .withCapabilities(deviceCap)
            .build();

        try {
            // Loads the page with the fingerprinting script
            await driver.get('https://antoinevastel.com/bots/fpstructured');

            // Verify if the value of the fingerprint is properly collected
            await driver.wait(getResult(driver, deviceCap), 3000);
        } catch (e) {
            console.log(e.stack);
        } finally {
            await driver.quit();
        }
    }

    console.log('List of configurations that failed:');
    console.log(failedCaps);
})();

```

While the testing strategy is quite naive, it still helped to catch an error that occurred in the promise returned by
the **navigator.mediaDevices.enumerateDevices** function.

One of the next steps would be to improve the testing strategy
in order to not only verify that the fingerprint collect does not crash but
also to verify more in details the values returned depending
on the configuration.