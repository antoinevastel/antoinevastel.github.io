---
layout: post
title: The Intriguing Sneaker Bot industry
categories: [JavaScript]
tags: [Javascript, crawler, bots, sneakers]
description: This posts sheds light on the industry around limited-edition sneakers reselling.
---


I recently discovered there is a whole industry around reselling limited edition sneakers.
Websites, such as <a href="https://stockx.com/">stockX</a>, are totally dedicated to help people sell such items.
According to prices on StockX, it can be a good investment since some of them can be resold for more
than 10x their original retail price.
The possibility to earn some "easy" money has made it competitive to get these limited-edition sneakers at retail price.
Thus, some people have started to use bots.
In reaction, popular websites such as Footlocker, Adidas and Nike started to use anti-bot detection systems in order
to sell their sneakers only to humans.

Thus, a whole industry dedicated to helping people buy sneakers online at retail price has developed:
1. The central element of this industry are sneaker bots, i.e. software whose goal is to automate task on the web, specialized to automate the process of buying sneakers.
Their price ranges from less than $100 for life, to more than $300 for 6 months.
Moreover, since licenses for these bots are also often limited, there is also a business around reselling such bot licenses, often
at a much higher price.
I was not able to buy one of these bots (and also didn't want to spend money on it) but by looking at tutorials
and videos on Youtube, we can see that these bots enable to automate or semi-automate the process of buying
limited-edition sneakers online.
Some of these bots have really nice and complex UI made with Electron and Angular while others are simple browser extensions.
I listed some of the most popular bots below associated with their retail price (when available):
- <a href="https://www.aiobot.com/product/aio-bot/">https://www.aiobot.com/product/aio-bot/</a>: $325;
- <a href="https://cybersole.io/">https://cybersole.io/</a>: £300 + £100 every 6 months;
- <a href="https://ghostaio.com/">https://ghostaio.com/</a>: $300 for the first 6 months + $150 every 6 months;
- <a href="https://hypebots.org/bot/eve-aio">https://hypebots.org/bot/eve-aio</a>: $350, ~$700-1,000 on resale;
- <a href="https://www.aiox.com/">https://www.aiox.com/</a>: a browser extension, $49.99;
- <a href="https://kodai.io/">https://kodai.io/</a>: $175/2 months + $35/month;
- <a href="https://novabot.io/">https://novabot.io/</a>: $180 first 6 months + $45 Quarterly Renewal;
- <a href="https://www.prismaio.com">https://www.prismaio.com</a> : unknown price;
- <a href="https://soleaio.com/">https://soleaio.com/</a>: unknown price.

2. In order for these bots not to get detected and banned, websites that sell bots also sell proxies or
get paid to advertise residential proxies from other companies.
Most of the proxy vendors claim to have special proxies that maximize the chance of buying sneakers.
While it is unclear what it means, the reality is certainly that most of these companies either use proxies
located in data-centers instead of the residential IP proxies they claim to sell,
or they just use Luminati residential IP proxy network,
as showed in this <a href="https://xianghang.me/publication/resi_sp/">recent study by Xianghang Mi et al.</a>

3. Finally, bot vendors also monetize their knowledge through **cook groups**.
These groups are mostly on Discord and require to pay monthly fees to get in.
According to their web pages, they claim to help bot users to know the release date of limited-edition items and
advise them on the right kind of tools/techniques/proxies to use to maximize their chance of getting sneakers.

A common point between all of these bots is that they claim to be able to handle bot detection systems.
That's the part I'm the most interested in for this blog post.
Concerning bot detection, most of these bots seem to integrate automatic CAPTCHA solvers using crowdsourcing
services such as <a href="https://2captcha.com/">2Captcha</a>.
Nevertheless, that's probably not the only technique they use to escape detection.

I tried to discover what technology these bots were based on, but because of access to the code, it was difficult.
Some bots are running as browser extensions.
Others seem to be able to run in multiple modes.
In one of the videos found on Youtube, the developer of a popular bot presents several modes.
While some of the modes had no effect visually, the last one, which according to him maximized the chance of getting sneakers,
clearly launched an automated non-headless Chrome browser.
It makes sense that using non-headless automated browsers decrease the chance of being detected because such bots have
the same fingerprints as normal browsers, besides simple attributes such as **navigator.webdriver**.
Concerning the two modes that had no visual effects, they could be either based on headless browsers such as Chrome headless or PhantomJS,
as well as HTTP request libraries such as **urllib**.
My intuition would be that modern bots are based on Chrome headless due to the simplicity and its similarity
with normal Chrome browsers, making it, therefore, more difficult to detect compared to an unmaintained headless browser such as PhantomJS.
Nevertheless, job offers on <a href="https://www.aiobot.com/careers/">the AIOBOT website</a> mention
older technologies such as PhantomJS, Casper and SlimerJS, but never mention Chrome headless and Puppeteer.


Then, I decided to look at the detection techniques used by popular websites selling limited-edition sneakers.
I looked at some of the websites supported by AIOBOT and found that most of them
use some sort of anti-bot fingerprinting scripts:
- Nike, Footlocker, and Footpatrol use the same script. I was not able to infer the name of the company because the script is delivered as a first party.
Moreover, the code does not contain any obvious prefix that could be linked to a company;
- Adidas and Finish Line rely on Akamai Bot Manager;
- JDSports and snearksnstuff use adyen;
- Yeezysupply uses Shopify, which has some form of fingerprinting bot detection in one of its script;
- Ssense uses Clearsale;
- Oki-ni uses perimeterX.

Most of these websites also propose to pay using Paypal, which also has it's own fingerprinting script, as shown by the beautify
canvas they generate:

<img src="/assets/media/sneakers/paypal_canvas.png">

I looked at some of the bot detection scripts to understand if they were doing special things.
In this post, I focus on one of these scripts
To stay away from intellectual property issues, I've decided not to provide more information
on the websites where you can find the script and I don't provide any link to the original script.


## Analysis of the bot detection fingerprinting script

The script seems to have been obfuscated using <a href="https://obfuscator.io/">obfuscator.io</a>, an open-source JavaScript obfuscator
using the "String array" option but no array rotation or control flow flattening, making it easier to deobfuscate.

You can identify this kind of obfuscation by looking for a huge array containing strings the have been escaped.
In this case, there is the following array (I renamed all the variables in my examples):
```javascript
var longArray = ["\x63\x6c\x69\x65\x6e\x74\x58", "\x3d\x3d", "\x6b\x65\x79\x43\x6f\x64\x65", ... , "\x65\x6e\x47\x65\x74\x4c\x6f\x63", "\x6e\x61\x76\x69\x67\x61\x74\x6f\x72", "\x6d\x6e\x5f\x6c\x63"];
```

While this looks frightening at first, executing this line in a browser directly returns the unescaped version of the strings.

```javascript
var longArray = ["clientX", "==", "keyCode", "onclick", ..., "createElement", "cdma", "altFonts", "return/*@cc_on!@*/!1", "which", "pluginInfo", "enGetLoc", "navigator", "mn_lc"];

```

The whole detection script contains a lot of references to this array.
For example, one of the function called **set_cookie** has the following form:
```javascript
set_cookie: function(a, t) {
    void 0 !== document[longArray[652]] && (document[longArray[652]] = a + longArray[218] + t + longArray[462])
},
```

I use the amazing < a href="https://github.com/jsoverson/shift-refactor">shift-refactor library</a> to automatically replace all the references to **longArray**
by their non-encoded string value.
Thus, in the case of the **set_cookie** function, we obtain the following, more readable function:
```javascript
set_cookie: function (a, t) {
  void 0 !== document["cookie"] && (document["cookie"] = a + "=" + t + "; path=/; expires=Fri, 01 Feb 2025 08:00:00 GMT;");
}
```

Using **refactor.convertComputedToStatic**, we can make it even more readable:
```javascript
set_cookie: function (a, t) {
  void 0 !== document.cookie && (document.cookie = a + "=" + t + "; path=/; expires=Fri, 01 Feb 2025 08:00:00 GMT;");
}
```

Similarly, we can apply the same technique to the whole script to obtain a more readable script.


### Canvas fingerprinting

The script collects a canvas fingerprint, a technique whom I've talked in previous blog posts (<a href="{% post_url 2019-02-19-canvas-fingerprint-on-the-web %}"> canvas fingerprinting on the web</a>).

Once manually cleaned the canvas looks like the following:
```javascript
const canvas = document.createElement("canvas");
canvas.width = 280;
canvas.height = 60;
canvas.style.display = "none"
const context = canvas.getContext("2d");
context.fillStyle = "rgb(102, 204, 0)";
context.fillRect(100, 5, 80, 50);
context.fillStyle = "#f60";
context.font = "16pt Arial";
context.fillText("<@nv45. F1n63r,Pr1n71n6!", 10, 40);
context.strokeStyle = "rgb(120, 186, 176)";
context.arc(80, 10, 20, 0, Math.PI, !1);
context.stroke();
const canvasValue = canvas.toDataURL();
```

When run on Chrome on MacOS we obtain:
<img src="/assets/media/sneakers/anon_canvas1_footlocker.png">

A second canvas consists of writing a randomly generated number to a 16x16 px canvas.
```javascript
const anotherCanvas = document.createElement("canvas");
anotherCanvas.width = 16;
anotherCanvas.height = 16;
const anotherContext = anotherCanvas.getContext("2d");
anotherContext.font = "6pt Arial";
const randomValue = Math.floor(1e3 * Math.random()).toString();
anotherContext.fillText(randomValue, 1, 12);
const secondCanvasValue = anotherCanvas.toDataURL();
```

In my case, I was lucky to obtain number 79:
<img src="/assets/media/sneakers/anon_canvas2_footlocker.png">

The script collects a hash of each canvas.

### JavaScript font enumeration

The script also uses JS-based font enumeration to infer the presence of fonts without using
the Flash plugin.

```javascript
const serif = ["serif", "sans-serif", "monospace"];
const offsetWidths = [0, 0, 0];
const offsetHeights = [0, 0, 0];
const spanElt = document.createElement("span");
spanElt.innerHTML = "abcdefhijklmnopqrstuvxyz1234567890;+-.";
spanElt.style.fontSize = "90px";

for (let idx = 0; idx < serif.length; idx++) {
    spanElt.style.fontFamily = serif[idx];
    document.body.appendChild(spanElt);
    offsetWidths[idx] = spanElt.offsetWidth;
    offsetHeights[idx] = spanElt.offsetHeight;
    document.body.removeChild(spanElt);
}

let fontsToTest = ["Geneva", "Lobster", "New York", "Century", "Century Gothic", "Monaco", "Lato", "Fantasque Sans Mono", ...,  "Source Sans Pro", "Damascus", "Microsoft Sans Serif"];
const fontsFound = [];
for (let idx = 0; idx < fontsToTest.length; idx++) {
    let foundFont = false;
    for (let innerIdx = 0; innerIdx < serif.length; innerIdx++) {
        spanElt.style.fontFamily = fontsToTest[idx] + "," + serif[innerIdx];
        document.body.appendChild(spanElt);
        if (spanElt.offsetWidth !== offsetWidths[innerIdx] || spanElt.offsetHeight !== offsetHeights[innerIdx]) {
            foundFont = true;
        }
        document.body.removeChild(spanElt);
        if (foundFont) {
            fontsFound.push(fontsToTest[idx]);
            break;
        }
    }

}
console.log(fontsFound);
// ["Geneva", "Monaco", "Futura", ..., "Damascus", "Microsoft Sans Serif"]
```

### Bot-specific attributes

Similarly to most of the fingerprinting scripts used in bot detection, the script test
the presence of object properties and variables commonly added by frameworks and software used to
create bots.

It tests the presence of several webdriver attributes:
```javascript
window.$cdc_asdjflasutopfhvcZLmcfl_ || document.$cdc_asdjflasutopfhvcZLmcfl_;
window.document.documentElement.getAttribute("webdriver");
navigator.webdriver && navigator.webdriver;
window.document.documentElement.getAttribute("selenium");
window._phantom;
window.Buffer;
```

The script runs other fingerprinting techniques, such as monitoring the acceleration and rotation of mobile devices, as well as a red pill.
Nevertheless, I won't go into more details in this blog post.

### Behavior monitoring

Besides fingerprinting, the script also collects information about the user's behavior.
In particular, it collects a wide range of mouse and keyboard related events.
```javascript
document.addEventListener ? (document.addEventListener("touchmove", f, !0),
document.addEventListener("touchstart", f, !0),
document.addEventListener("touchend", f, !0),
document.addEventListener("touchcancel", f, !0),
document.addEventListener("mousemove", f, !0),
document.addEventListener("click", f, !0),
document.addEventListener("mousedown", f, !0),
document.addEventListener("mouseup", f, !0),
document.addEventListener("pointerdown", f, !0),
document.addEventListener("pointerup", f, !0),
document.addEventListener("keydown", f, !0),
document.addEventListener("keyup", f, !0),
document.addEventListener("keypress", f, !0)) : document.attachEvent && (document.attachEvent("touchmove", f),
document.attachEvent("touchstart", f),
document.attachEvent("touchend", f),
document.attachEvent("touchcancel", f),
document.attachEvent("onmousemove", f),
document.attachEvent("onclick", f),
document.attachEvent("onmousedown", f),
document.attachEvent("onmouseup", f),
document.attachEvent("onpointerdown", f),
document.attachEvent("onpointerup", f),
document.attachEvent("onkeydown", f),
document.attachEvent("onkeyup", f),
document.attachEvent("onkeypress", f)),
```

Nevertheless, it must be quite difficult to use behavior as a feature to distinguish humans and bots in this kind of
context because even humans seem to behave like bots and keep on clicking to refresh pages until new sneakers finally appear.

