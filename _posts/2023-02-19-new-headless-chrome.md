---
layout: post
title: New headless Chrome has been released and has a near-perfect browser fingerprint
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: This post presents the new headless Chrome version and shows the main browser fingerprint differences that exist compare to the old headless Chrome.
---
The new headless Chrome has been released in November 2022.
For the moment, it hasn't become the standard headless mode.
It's still hidden behind a `--headless=new` flag.
However, it will soon become the standard headless mode, and this is going to change a lot of things when it comes to bot detection, particularly detection based on browser fingerprint.

<a href="https://bugs.chromium.org/p/chromium/issues/detail?id=1380881">New headless mode version announcement</a>
<img src="/assets/media/chromium-sc-headless-new0.png">


<br>
<a href="https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/headless/headless_mode_util.cc;l=32;drc=a8addd2e8cfba6253a8ce03f1a0ab1cf4f45d5ae;bpv=0;bpt=1">headless_mode_util.cc</a>
<img src="/assets/media/chromium-sc-headless-new.png">


## How is it going to impact bot detection?

**TL;DR:** The new headless Chrome browser fingerprint is way more realistic than the first/old version of headless Chrome.
Depending on the sophistication of your detection engine, it's going to make it easier for bot developers to bypass detection, particularly detection based on browser fingerprinting signals.

As written in Chromium's code, `The new headless mode
// is Chrome browser running without any visible UI.`
Thus, a lot of subtle differences that used to exist between the old headless Chrome and a genuine headful Chrome don't exist anymore.

<a href="https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/headless/headless_mode_util.h">headless_mode_util.h</a>
<img src="/assets/media/chromium-sc-headless-new2.png">

<br>
The new headless mode significantly impacts the browser fingerprint.
Thus, If you were relying on techniques the absence of plugins with `navigator.plugins.length = 0` as I presented <a href="https://antoinevastel.com/bot%20detection/2018/01/17/detect-chrome-headless-v2.html">in my previous blog posts</a> ~6 years ago or the absence of `window.chrome` object, you won't be able to detect the new version of headless Chrome anymore.

Let's code two simple bots to observe the changes in browser fingerprints:
1. one with the old headless version;
2. one with the new headless version.

I use the following code that leverages the old headless Chrome with puppeteer and visit <a href="https://antoinevastel.com/bots">https://antoinevastel.com</a> to collect the browser fingerprint of the bot.
The fingerprint is collected using the <a href="https://github.com/antoinevastel/fp-collect">fp-collect library</a>.
Note that due to my position at <a href="https://datadome.co/">DataDome</a>, this library hasn't been updated with new signals in the last 3 years.
However, we'll see that even using relatively old signals, we already see significant differences in the fingerprint.
Note that I remove the canvas value only for readability purposes.

```javascript
// old-headless.js
const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('collectfp')) {
            const payloadFp = JSON.parse(interceptedRequest.postData());
            delete payloadFp['canvas'];
            console.log(payloadFp);
        }
        
        interceptedRequest.continue();
    });


    await page.goto('https://antoinevastel.com/bots');
    browser.close();
}

(async () => {
    await run();
})();

```

We dump the value of the old fingerprint in `old-fingerprint.json`:

```javascript
{
  plugins: [],
  mimeTypes: [],
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/111.0.5555.0 Safari/537.36',
  byteLength: 'unknown',
  gamut: [ true, false, false, true ],
  anyPointer: 'fine',
  anyHover: 'hover',
  appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/111.0.5555.0 Safari/537.36',
  appName: 'Netscape',
  appCodeName: 'Mozilla',
  onLine: true,
  cookieEnabled: true,
  doNotTrack: false,
  hardwareConcurrency: 4,
  platform: 'MacIntel',
  oscpu: 'unknown',
  timezone: -60,
  historyLength: 2,
  computedStyleBody: 'accent-coloralign-contentalign...-webkit-writing-mode',
  languages: [ 'en-US' ],
  language: 'en-US',
  indexedDB: true,
  openDatabase: true,
  screen: {
    wInnerHeight: 600,
    wOuterHeight: 0,
    wOuterWidth: 0,
    wInnerWidth: 800,
    wScreenX: 0,
    wPageXOffset: 0,
    wPageYOffset: 0,
    cWidth: 800,
    cHeight: 865,
    sWidth: 1280,
    sHeight: 800,
    sAvailWidth: 1280,
    sAvailHeight: 800,
    sColorDepth: 30,
    sPixelDepth: 30,
    wDevicePixelRatio: 1
  },
  touchScreen: [ 0, false, false ],
  videoCard: [
    'Google Inc. (Google)',
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)'
  ],
  multimediaDevices: { speakers: 1, micros: 1, webcams: 1 },
  productSub: '20030107',
  product: 'Gecko',
  navigatorPrototype: [
    'vendorSub~~~function get vendorSub() { [native code] }',
    '...'
    'valueOf~~~',
    '__proto__~~~',
    'toLocaleString~~~'
  ],
  etsl: 33,
  screenDesc: 'function get width() { [native code] }',
  phantomJS: [ false, false, false ],
  nightmareJS: false,
  selenium: [
    false, false, false,
    false, false, false,
    false, false, false,
    false, false, false,
    false, false, false,
    false, false
  ],
  webDriver: true,
  webDriverValue: true,
  fmget: false,
  domAutomation: false,
  errorsGenerated: [
    'azeaze is not defined',
    null,
    null,
    null,
    null,
    null,
    null,
    "Failed to construct 'WebSocket': The URL 'itsgonnafail' is invalid."
  ],
  resOverflow: {
    depth: 10434,
    errorMessage: 'Maximum call stack size exceeded',
    errorName: 'RangeError',
    errorStacklength: 744
  },
  accelerometerUsed: false,
  audio: {
    nt_vc_output: {
      'ac-baseLatency': 0.005804988662131519,
      'ac-outputLatency': 0,
      '...'
      'an-channelCountMode': 'max',
      'an-channelInterpretation': 'speakers'
    },
    pxi_output: 124.04347657808103
  },
  screenMediaQuery: true,
  hasChrome: false,
  detailChrome: 'unknown',
  permissions: { state: 'prompt', permission: 'denied' },
  iframeChrome: 'undefined',
  debugTool: false,
  battery: true,
  deviceMemory: 8,
  tpCanvas: { '0': 0, '1': 0, '2': 0, '3': 0 },
  sequentum: false,
  audioCodecs: {
    ogg: 'probably',
    mp3: 'probably',
    wav: 'probably',
    m4a: '',
    aac: ''
  },
  videoCodecs: {
    ogg: 'probably',
    h264: '',
    webm: 'probably',
    mpeg4v: '',
    mpeg4a: '',
    theora: ''
  },
  redPill: 0,
  redPill2: null,
  redPill3: '40,40,40,40,60,60,40,40,20,40,20,20,40,2460,',
  uuid: 'f4f3c47d-5d09-5678-2736-3709dc1c5ca8',
  url: 'https://antoinevastel.com/bots'
}

```

We do the same thing with the new headless Chrome:
```javascript
// new-headless.js

const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch({
        headless: 'new'
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        if (interceptedRequest.url().endsWith('collectfp')) {
            const payloadFp = JSON.parse(interceptedRequest.postData());
            delete payloadFp['canvas'];
            console.log(payloadFp);
        }
        
        interceptedRequest.continue();
    });


    await page.goto('https://antoinevastel.com/bots');
    browser.close();
}

(async () => {
    await run();
})();

```

We store the fingerprint in `new-fingerprint.json`.
```javascript
{
  plugins: [
    'PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'Chrome PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'Chromium PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'Microsoft Edge PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'WebKit built-in PDF::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format'
  ],
  mimeTypes: [
    'Portable Document Format~~application/pdf~~pdf',
    'Portable Document Format~~text/pdf~~pdf'
  ],
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  byteLength: 'unknown',
  gamut: [ true, false, false, true ],
  anyPointer: 'fine',
  anyHover: 'hover',
  appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  appName: 'Netscape',
  appCodeName: 'Mozilla',
  onLine: true,
  cookieEnabled: true,
  doNotTrack: false,
  hardwareConcurrency: 4,
  platform: 'MacIntel',
  oscpu: 'unknown',
  timezone: -60,
  historyLength: 2,
  computedStyleBody: 'accent-coloralign-contentalign-itemsalign-...-webkit-user-modify-webkit-writing-mode',
  languages: [ 'en-GB', 'en-US', 'en' ],
  language: 'en-GB',
  indexedDB: true,
  openDatabase: true,
  screen: {
    wInnerHeight: 600,
    wOuterHeight: 1371,
    wOuterWidth: 1200,
    wInnerWidth: 800,
    wScreenX: 1302,
    wPageXOffset: 0,
    wPageYOffset: 0,
    cWidth: 800,
    cHeight: 886,
    sWidth: 2560,
    sHeight: 1440,
    sAvailWidth: 2560,
    sAvailHeight: 1440,
    sColorDepth: 24,
    sPixelDepth: 24,
    wDevicePixelRatio: 1
  },
  touchScreen: [ 0, false, false ],
  videoCard: [
    'Google Inc. (Intel Inc.)',
    'ANGLE (Intel Inc., Intel(R) Iris(TM) Plus Graphics 640, OpenGL 4.1)'
  ],
  multimediaDevices: { speakers: 1, micros: 1, webcams: 1 },
  productSub: '20030107',
  product: 'Gecko',
  navigatorPrototype: [
    'vendorSub~~~function get vendorSub() { [native code] }',
    'productSub~~~function get productSub() { [native code] }',
    'vendor~~~function get vendor() { [native code] }',
    'maxTouchPoints~~~function get maxTouchPoints() { [native code] }',
    '...',
    '__proto__~~~',
    'toLocaleString~~~'
  ],
  etsl: 33,
  screenDesc: 'function get width() { [native code] }',
  phantomJS: [ false, false, false ],
  nightmareJS: false,
  selenium: [
    false, false, false,
    false, false, false,
    false, false, false,
    false, false, false,
    false, false, false,
    false, false
  ],
  webDriver: true,
  webDriverValue: true,
  fmget: false,
  domAutomation: false,
  errorsGenerated: [
    'azeaze is not defined',
    null,
    null,
    null,
    null,
    null,
    null,
    "Failed to construct 'WebSocket': The URL 'itsgonnafail' is invalid."
  ],
  resOverflow: {
    depth: 10434,
    errorMessage: 'Maximum call stack size exceeded',
    errorName: 'RangeError',
    errorStacklength: 744
  },
  accelerometerUsed: false,
  audio: {
    nt_vc_output: {
      'ac-baseLatency': 0.005804988662131519,
      'ac-outputLatency': 0,
      'ac-sinkId': '',
      '...'
      'an-channelCountMode': 'max',
      'an-channelInterpretation': 'speakers'
    },
    pxi_output: 124.04347657808103
  },
  screenMediaQuery: true,
  hasChrome: true,
  detailChrome: { properties: 'unknown', connect: 55, sendMessage: 59 },
  permissions: { state: 'prompt', permission: 'default' },
  iframeChrome: 'object',
  debugTool: false,
  battery: true,
  deviceMemory: 8,
  tpCanvas: { '0': 0, '1': 0, '2': 0, '3': 0 },
  sequentum: false,
  audioCodecs: {
    ogg: 'probably',
    mp3: 'probably',
    wav: 'probably',
    m4a: '',
    aac: ''
  },
  videoCodecs: {
    ogg: 'probably',
    h264: '',
    webm: 'probably',
    mpeg4v: '',
    mpeg4a: '',
    theora: ''
  },
  redPill: 0,
  redPill2: null,
  redPill3: '40,40,40,20,40,40,20,20,20,20,20,20,20,120,',
  uuid: '40d642c8-fa51-e16b-82c7-c7db771531e7',
  url: 'https://antoinevastel.com/bots'
}

```

Then, we can make a simple diffs of the two fingerprints using `diff new-fingerprint.json old-fingerprint.json > diff-fingerprints.diff`

We obtain the following diff:
```javascript
2,13c2,4
<   plugins: [
<     'PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
<     'Chrome PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
<     'Chromium PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
<     'Microsoft Edge PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
<     'WebKit built-in PDF::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format'
<   ],
<   mimeTypes: [
<     'Portable Document Format~~application/pdf~~pdf',
<     'Portable Document Format~~text/pdf~~pdf'
<   ],
<   userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
---
>   plugins: [],
>   mimeTypes: [],
>   userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/111.0.5555.0 Safari/537.36',
18c9
<   appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
---
>   appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/111.0.5555.0 Safari/537.36',
30,31c21,22
<   languages: [ 'en-GB', 'en-US', 'en' ],
<   language: 'en-GB',
---
>   languages: [ 'en-US' ],
>   language: 'en-US',
36,37c27,28
<     wOuterHeight: 1371,
<     wOuterWidth: 1200,
---
>     wOuterHeight: 0,
>     wOuterWidth: 0,
39c30
<     wScreenX: 1302,
---
>     wScreenX: 0,
43,49c34,40
<     cHeight: 886,
<     sWidth: 2560,
<     sHeight: 1440,
<     sAvailWidth: 2560,
<     sAvailHeight: 1440,
<     sColorDepth: 24,
<     sPixelDepth: 24,
---
>     cHeight: 865,
>     sWidth: 1280,
>     sHeight: 800,
>     sAvailWidth: 1280,
>     sAvailHeight: 800,
>     sColorDepth: 30,
>     sPixelDepth: 30,
54,55c45,46
<     'Google Inc. (Intel Inc.)',
<     'ANGLE (Intel Inc., Intel(R) Iris(TM) Plus Graphics 640, OpenGL 4.1)'
---
>     'Google Inc. (Google)',
>     'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)'
198,201c189,192
<   hasChrome: true,
<   detailChrome: { properties: 'unknown', connect: 55, sendMessage: 59 },
<   permissions: { state: 'prompt', permission: 'default' },
<   iframeChrome: 'object',
---
>   hasChrome: false,
>   detailChrome: 'unknown',
>   permissions: { state: 'prompt', permission: 'denied' },
>   iframeChrome: 'undefined',
224,225c215,216
<   redPill3: '40,40,40,20,40,40,20,20,20,20,20,20,20,120,',
<   uuid: '40d642c8-fa51-e16b-82c7-c7db771531e7',
---
>   redPill3: '40,40,40,40,60,60,40,40,20,40,20,20,40,2460,',
>   uuid: 'f4f3c47d-5d09-5678-2736-3709dc1c5ca8',
```

## Exploring browser fingerprint differences

As you can see, there are a lot of differences between the old and the new headless Chrome fingerprints.
While some of them are caused by randomness, e.g. the `redPill` values, others are stable differences that persist over time.

The first difference we notice is the `user-agent`.
By default, old headless Chrome indicated its presence in the user agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/111.0.5555.0 Safari/537.36`.
The new headless Chrome pretends to be a genuine headful browser and removed the `HeadlessChrome` substring from its user-agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36`.

Similarly, when it comes to plugins, the old headless Chrome used to return no plugins with `navigator.plugins`, which is a technique that used to be exploited for detection when Headless Chrome got released 6 years ago, <a href="https://antoinevastel.com/bot%20detection/2017/08/05/detect-chrome-headless.html">cf this blog post.</a>
The new headless Chrome returns the same plugins as a headful Chrome, and that's the same for the mimeTypes obtained with `navigator.mimeTypes`:
```javascript
[
    'PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'Chrome PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'Chromium PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'Microsoft Edge PDF Viewer::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format',
    'WebKit built-in PDF::Portable Document Format::internal-pdf-viewer::__application/pdf~pdf~Portable Document Format,text/pdf~pdf~Portable Document Format'
  ],
  mimeTypes: [
    'Portable Document Format~~application/pdf~~pdf',
    'Portable Document Format~~text/pdf~~pdf'
  ]
```

Because of that, it means that attackers need to apply fewer changes to their fingerprints, which decreases their chances of making a mistake when overriding missing/inconsistent native attributes and functions.
For example, as I explained in a recent <a href="https://datadome.co/bot-management-protection/detecting-headless-chrome-puppeteer-extra-plugin-stealth/">DataDome blog post about Puppeteer extra stealth</a>, we used to detect that `navigator.plugins` had been forged because the way it was overridden differed from a native `PluginArray` object.
Now that headless Chrome has a more realistic fingerprint, bot developers won't need to apply as many JavaScript patches to their headless chrome bots, which will likely decrease their chance of introducing inconsistencies and getting caught.

The new headless Chrome also has a `window.chrome` object.
Thus, similarly to `navigator.plugins`, it means that attackers won't need to forge the `window.chrome` object anymore, which decreases their chances of introducing inconsistent changes in their fingerprint.

Among the other noticeable changes, we notice that information about the GPU looks more human in the latest headless Chrome version.
While in the past, headless Chrome indicated that it leveraged SwiftShader, with WebGL renderer values that looked like `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`, now, it returns similar values as a genuine Chrome browser:
```javascript
videoCard: [
    'Google Inc. (Intel Inc.)',
    'ANGLE (Intel Inc., Intel(R) Iris(TM) Plus Graphics 640, OpenGL 4.1)'
  ]
```

Of course, the new headless browser fingerprint still exhibits obvious bot attributes like `navigator.webdriver = true`.
However, these attributes can easily be hidden using flags such as `–disable-blink-features=AutomationControlled` as discussed <a href="https://datadome.co/threat-research/detecting-selenium-chrome/">in this blog post.</a>
So you better not rely only on these signals for your detection.
It may help you to catch the less sophisticated bots, but attackers are already aware of these fields and know how to hide them.

## Does it mean it has become impossible to detect the new Headless Chrome?

No, the new headless Chrome can still be detected using JS browser fingerprinting techniques.
It can be still detected independently of its instrumentation framework such as:
- Selenium
- Puppeteer
- Playwright

However, the task has become more challenging than it used to be.
As you can imagine, given my position at DataDome (a bot detection company), I'm not going to share any new detection signals as I used to do.
Moreover keep in mind that when it comes to bot detection, browser fingerprinting is not the only signal.
It's important to leverage other signals such as:
- Behavior (client-side and server-side)
- Different kinds of reputations (IP, sessions, user)
- Proxy detection, in particular, residential proxy detection
- Contextual information: time of the day, country, etc
- TLS fingerprinting.
