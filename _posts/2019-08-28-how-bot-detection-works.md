---
layout: post
title: Bot detection 101
categories: [JavaScript]
tags: [Javascript, crawler]
description: Find a good description
---

In this post we present the basics of bot detection.
We start by introducing what's a bot as well as the different families of bots.
Then, we describe the main techniques used to detect bots.
Finally, we discuss the resilience of the different bot families against the different detection techniques.

This blog post is relatively long (~ XXX words). Thus, here is the structure of the blog post so that you can directly jump to the part that interests you:
1. What's a bot and the different families of bots (TODO add link)
2. Bot detection techniques (TODO add link)
3. Resilience of bots against different detection techniques (TODO add link)


## What is a bot ?

A bot is a program that automates tasks on the internet.
The main reason to use bots instead of doing these tasks manually is mostly to achieve greater throughput all while decreasing the cost.
Bots are used for several applications ranging from website automated testing, to less ethical tasks,
such as <a href="https://www.owasp.org/index.php/OAT-003_Ad_Fraud">ad-fraud</a> or
<a href="https://www.owasp.org/index.php/Credential_stuffing">credential stuffing</a>.
Another common use-case for bots is crawling, a task that consists in automatically gathering website content (often without their consent).

In this blog post we focus on crawlers, i.e. bots used to automatically gather content.
Nevertheless, most of the concepts can also be applied to bots used for other purposes such as credential stuffing.

## Families of bots

There exists different families of bots that are more or less adapted depending on the task to automate
(gathering content at scale, credential stuffing) and the website they target (single page app, static content).
In this section, we go through the main kinds of bots and discuss their pros and cons.

### Simple HTTP request libraries (bots 1)
The most simple bots use HTTP request libraries such as the <a href="https://docs.python.org/3/library/urllib.html">urllib</a> in Python or
the <a href="https://nodejs.org/api/http.html">http</a> request module in NodeJS.
While this kind of bots requires few CPU and RAM resources, it fails to loads pages with dynamic content, such as single page app (SPA), because it
can't execute JavaScript code.
Although it can't execute JavaScript, a popular solution to crawl SPA with this kind of bots is to directly make GET or POST requests to the APIs
responsible for loading the dynamic content on the page.
Moreover, these bots tend to rely on external libraries such as <a href="https://www.crummy.com/software/BeautifulSoup/">Beautiful Soup</a>
and <a href="https://cheerio.js.org/">Cheerio</a> to efficiently parse HTML.

### Real browser (Chrome, Firefox) instrumented with Selenium/Puppeteer (bots 2)

<a href="https://www.seleniumhq.org/">Selenium</a> and
<a href="https://pptr.dev/">Puppeteer</a> are browser automation libraries.
They enable to automate tasks in a browser, such as loading a page, moving
the mouse or typing text using only code.
While Puppeteer is only available in NodeJS, Selenium developed
several drivers available for the main programming languages.

Contrary to the first category of bots based on HTTP request libraries,
this kind of bots can execute JavaScript code because it is based on a browser.
Nevertheless, enabling JavaScript code execution comes at a high cost:
it requires more CPU and RAM resources.
Indeed, while bots 1 mostly use bandwidth, this family of bots also
requires the same CPU and memory resources as a normal browser.
Thus, scaling to 100s of pages can become a problem on small machines.
Moreover, you can't use it directly on servers that have no display server.
To address this problem, crawlers often leverage <a href="https://en.wikipedia.org/wiki/Xvfb">XVFB</a> (X virtual framebuffer), an X display server.

### Headless browsers (bots 3)

Headless browsers are browsers that can be used without a graphical interface.
Contrary to the previous family of bots (bots 2), it does not
require to use XVFB for display.
One of the first popular headless browsers
was <a href="https://phantomjs.org/">PhantomJS</a>.
Contrary to bots 2, PhantomJS required significantly less CPU and RAM
resources, all while being able to execute JavaScript.

In 2017, Google released Chrome headless, the headless version
of Google Chrome, which lead to PhantomJS to stop being maintained.
Chrome headless has almost all of the features present in Google Chrome
and is actively maintained.
It can be instrumented using the low-level Chrome Devtools Protocol (CDP).
Nevertheless, because writing all the tasks using CDP can be too cumbersome,
several libraries, such as Puppeteer have been developed for its automation.

Chrome headless supports most of the features of a normal Chrome browser.
Thus, the general experience is the same as what a human user on his browser
would experience.
Moreover, because it can be easily instrumented with Puppeteer, it
has become the go-to solution for a wide range of applications
ranging from automated tests to credential stuffing and crawling.
Concerning the CPU and RAM overhead, Chrome headless sits between
bots 1 based on HTTP-request libraries and bots 2 based on normal
instrumented browsers.

In the next section, we present the main techniques to detect bots.
Then, we look back to the different kinds of bots presented
in this section and explain their resilience against the different
detection techniques.

## Detection techniques

We can distinguish two main families of detection techniques:
1. Behavioral-based detection
2. Fingerprinting-based detection

The remainder of this section describes the main techniques used
in behavioral and fingerprinting bot detection.

### Behavioral-based detection

Techniques from this family leverages the user's behavior
to detect whether it is a human or a bot.
The main idea behind this approach is that humans and bots don't
behave the same.
Indeed, intuitively, we can imagine than bots tend to be faster
than humans, or may not move their mouse when they navigate to
different pages.
The fact that humans and bots don't behave the same is a strong hypothesis.
While it may be the case for naive bots, it is also possible to
develop bots that exhibit a human behavior.

Nevertheless, even though smart bots can still mimic human behavior,
forcing them to change their behavior will make them less rentable.
Indeed, appearing more human will often lead to performing task more slowly.
Thus, when a website adopts this kind approach,
it indirectly force bots to lower their rentability if they don't
want to get detected.

Besides navigation speed, behavioral-based approaches apply
heuristics or machine learning techniques on features extracted
from the user's interactions.
**HTTP features:**
Some of these features can be extracted from the HTTP requests, such as:
- The number of pages seen;
- The order of the pages seen (is there a pattern in the way pages are seen ?, e.g. url.com/test?item=1 ... item=N)
- The average time between two pages visited;
- The kinds of resources loaded (some bots tends to block resources such as CSS or ads because they are not useful for their task
and requires bandwidth)
- The total number of requests.

Using features extracted from HTTP requests, it is possible to
create higher order features.
For example, in their <a href="https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/jacob">PUBCRAWL paper</a>, Jacob et al. proposed to
model the number of pages seen by a user as a time series.
Then, they apply time-series decomposition techniques to obtain a
trend, a seasonality and a noise components.
These components can then be used in heuristics and machine learning models as features.

**Client-side features:**
A second source of behavioral features come from the mouse and
keyboard events.
These events can be collected in the browser using JavaScript.
For example, the following events can be collected:
- Mouse movement;
- Mouse button pressed;
- Scroll;
- Key pressed, as well as the time between two keys pressed.


As Jacob et al. explained in their paper, the main drawback of
behavioral-based detection approaches is that they tend to require
significant amount of data before they can accurately classify
whether a user is a human or a bot.
Indeed, while not using the mouse on a single is not suspicious,
it may become suspicious if the mouse is never used after having browsed
more than 10 pages.
Thus, while on the long run it may be effective in detecting bots,
it will fail at detecting them quickly, which can
be a problem against large-scale distributed crawlers that run on
multiple machines.
Moreover, several approaches can be used to mimic human behavior.
For example, using Generative Adversarial Network (GAN) or
Markov Chains, we can generate realistic human-like mouse movements.
More simply, we can record real human interactions to replay them
later, which would render behavioral-based detection
unefective.


While the approaches presented in this section are quite generic,
we can also add features related to a specific use case.
For example, in the case of a dating application, it could be possible
to leverage the content of the messages sent (in a privacy friendly
way, using homomorphic encryption for example).
We could create a feature indicating if the first message contains a
link, which is often used by bots to redirects users outside of the
application.
In the case of a social network, we could use features related to
the number friend requests sent or the number of messages exchanged.

Besides the fact that behavioral-based approaches require time before
they can accurately classify a user, another drawback is that most of
them rely on the notion of **session**.
Indeed, in order to analyze the behavior of a user, they need to
aggregate his activity over a unit of time such as the last 10 minutes,
or a session.
A session can be defined as the period of time corresponding to the
visit of a user.
A website may consider a session has ended after no activity from the user
during *N* minutes.
Changing this threshold may impact the quality of the detection.
Moreover, a session is often linked to an IP address or an IP address
in addition to a user agent to avoid grouping
multiple devices behind the same IP address.
Thus, if bots leverage proxies to frequently modify their IP address,
they can start a new, clean session, helping them to avoid behavioral-based
detection approaches.


### Fingerprinting-based detection

A second family of detection approaches leverages fingerprinting.
Fingerprinting consist in collecting a set of attributes related to
a device in order to characterize it.
What is called a fingerprint is simply the combination of all the
attributes collected.
Fingerprinting can be used for several purposes:
1. Tracking, as a mechanism to regenerate cookies (<a href="https://hal.inria.fr/hal-01652021">I talk about this topic in one of the papers I published during my PhD</a>);
2. Security, both to enhance authentication and to detect bots.

When fingerprinting is used for tracking, e.g. to regenerate deleted cookies, one generally tries to obtain a fingerprint as unique as possible to uniquely identify a device.
On the contrary, when fingerprinting is used in security, fingerprint attributes aim to obtain information about the nature of device and the browser, such
as the OS and the browser version.
Since in a security context we assume that attackers are likely to lie on their fingerprint by spoofing attributes,
security fingerprinting scripts tend to collect multiple attributes to correlate if their values are consistent, or if some of them have been spoofed.
I talk more about the topic of fingerprint consistency in this <a href="https://antoinevastel.com/tracking/2018/07/01/eval-canvasdef.html">blog post</a> and
this <a href="https://hal.inria.fr/hal-01820197">other paper published during my PhD.</a>

Fingerprints can be collected at different layers:
- Network (TCP and TLS fingerprinting)
- Application (browser fingerprinting)


**Passive TCP fingerprinting** consists in collecting features
extracted from the IPv4 and IPV6 headers, as well as TCP headers
to identify the nature of the software
sending the requests, as well as the platform it is running on.
It can be used to detect the presence of proxies or to detect when a
browser is running in a virtual machine.
Indeed, in the case a browser is running behind a proxy or in a virtual
machine, there can be inconsistencies between the TCP fingerprint
and the OS/browser claimed in the user agent.

**TLS fingerprinting** leverages the set of TLS ciphersuites supported
by a client to uncover its nature.
Like all forms of fingerprinting, both TCP and TLS fingerprints can
be forged (TODO cite tcp forge paper and akamai tls paper).

While TCP and TLS fingerprinting can help to understand the
environment in which the browser is running (the OS and its
version, as well as whether it is a VM), it is less effective to
precisely determine the nature of the browser.
Indeed, the TCP stack does not necessarily varies between different
browser versions.
Moreover, whether it is Chrome/Firefox headless,
there is no differences in the TCP stack between the headless
version and their non-headless counterpart.

**Browser fingerprinting** leverages JavaScript and HTTP headers
sent by the browser.
While browser fingerprinting is often known for unwanted tracking (TODO cite),
it is also widely used to detect bots.

To detect bots, the idea is to collect information about the device, OS and browser.
Then, the fingerprint is sent back to a server that will apply heuristics to detect if the fingerprint belongs to known bot or if
it has been modified to try to hide the presence of a crawler.
It's rare to apply detection rules directly in the browser since bot developers could easily get their hand on the fingerprinting
script and then look at it to understand why they are detected.
That's also the reason why these scripts tend to be more or less obfuscated.

Similarly to the hasLiedFunction in fingerprintJS2, other tests aim to detect lie at the OS level.
While lying at the OS level may seem unecessary risks in the case of bots because, one might seem we just need to lie
on the browser, it may be done in the case of ad-fraud for example.
Let's say someone wants to generate fake traffic to artificially increase number of ads view, a common practice in
the advertising industry (cite link), the fraudster may generate a diversity of fingerprints in order to make it looks
like the traffic does not originate from a single user.

A large set of tests aim at detecting the presence of attributes added by automation framework.
For example:
- window.__phantom ...
- continue

Other tests analyze if native function have been overridden.
If we consider the case of PhantomJS, it didn't implement the bind function.
Thus, the absence of the bind function was used by companies as a way to detect PhantomJS based bots.
To bypass the detection, bot developers started to implement a homemade bind function.
Nevertheless, when it is not done properly, one can easily that a native function has been overridden by looking
at its toString.
Indeed, by default, the toString method of a native function returns an output like below:
```javascript
Show output of toString
```

Nevertheless, when a native function has been overridden, it returns the code of the new function.
Besides the bind function, similar tests are done on other functions known to be overridden by bot developers.


Inconsistent feature behavior.
Finally, a wide set of tests specifically aim to detect if the browser is Chrome headless.
Because it is the go-to solution when it comes to crawling or other forms of bot that require to interact with websites,
a majority of commercial bot detection fingerprinting scripts have tests that aim at specifically detecting if a browser
is Chrome headless.
Multiple commercial scripts used tests that I already presented on this blog.
The idea of these tests is that although I said previously that Chrome headless almost has all of the features of
a real Chrome, it does not mean they behave exactly in the same way.
Thus, these tests aim at detecting if features behave as they should behave in a normal Chrome, or if they behave
as in Chrome headless.
One of the examples taken from my blog post was the inconsistent behavior of the permission API.
```javascript
TODO add example
```


Other tests i don't talk about so that they are not too easily used by bad guys ;)

Red pills can be seen as techniques to fingerprint the system.
The name red pill comes from the movie Matrix where Neo has to choose between the blue and the red pill.
The idea of red pills is to detect if a program, in our case a browser, is running in a virtual machine.
Viruses also leverages red pills to detect if they are being run in a sandbox.

In our case, we are interested in red pills capable of running in the browser.
The reason red pills are interesting in the case of bot and crawler detection is because it requires significant
resources to conduct crawling at scale.
One of the easiest technique to obtain such infrastructure is generally to use VMs from cloud providers such as
AWS and Azure.
Moreover, because the majority of users generally don't use browsers in VM to browse the web, it is relatively safe
to assume that detecting browsers running in VM is a strong signal of a non-human user.




## Other detection techniques
These are techniques I don't really have a category for.
IP reputation databases can be used.
Previous activity associated to an IP can be used as a feature in addition to the previous approches.

CAPTCHA
I think we all know what CAPTCHAs are.
We have all faced several moments where we get asked to select fire hydrants or bikes on the pictures.
The original idea behind CAPTCHAs was to leverage challenges difficult to solve by computers and easy to solve by human
so that they can be used to distinguish humans from bots.
Originally, it started mostly with text recognition.
Nowadays, it has shifted towards image recognition free work for google.
Nevertheless, with recent advance in image and also audio recognition with deep learning, several researchers
have proposed approaches to automatically solve CAPTCHAs.
Moreover, several crowdsoursing service such as uncaptcha and xxx propose to automatically solve captchas for you (for money of course).



To conclude this part on the different bot detection techniques, there is no silver bullet.
Behavioral and fingerprinting detection operate at different layers and rely on different features.
Browser fingerprinting is fast at taking a decision contrary to behavioral based approaches.
After a fingerprint is collected, one can already take classify a user as human or bot.
Collecting more fingerprint does not provide more information and does not help make the classification more accurate,
contrary to behavioral-based approaches that tend to get better over time.
In the case the decision is based on HTTP headers or TCP/TLS fingerprints, one can even block a bot
before it has already loaded a page.
Thus, this helps a lot against large-scale distributed crawlers.

CAPTCHAs require user interaction, which is not always possible nor wishable depending on the use case.


## Ease of detection

Now that we have seen both the different kinds of bots and crawlers, as well as the different detection techniques,
we can explore the pros and cons of the different kinds of bots when it comes to avoiding detection.
By default, all crawlers have the same behavior, which means they are all equal in face of the behavioral detection approaches.
Thus, making requests at a non-human speed will always make you vulnerable to behavioral-based detection.
Similarly, never using the mouse to open links may become suspicious over time.


Simple HTTP library-based bots.
While they require mostly bandwidth and few CPU + ram, they can't execute JS, making them easily detectable.
By default, they also don't manage cookies, which is often used for detection.
Nevertheless, it is always possible to manage them manually.
Good for crawling websites with no protection and that don't require JS.
From a fingerprinting point of view, they often have a different TCP stack, and the suites of TLS ciphers they support is different (TODO verify claim).
Because they don't execute JS, they don't have a browser fingerprint, besides the HTTP headers they send.

Real browsers instrumented with Puppeteer/Selenium + XVFB:
Because these browsers are the same as the ones used by humans, they have no fingerprinting difference, besides the navigator.webdriver attribute added by some automation libraries.
Thus, fingerprinting does not help to detect this kind of crawlers, except if they are running behind a proxy or on a virtual machine.
In this case TCP fingerprinting and red pills may detect their presence.
Therefore, the biggest flaws of this kind of bots is the behavioral detection (but no more than other bots).

PhantomJS.
I talked about phantomJS earlier in this post.
While it is interesting from an history point of view, phantomjs based bots are really easy to detect from of a fingerprinting point of view.
Even few years ago, there were already known differences as shown in this blog post.
Last year, I also published some tests that can be used to detect PhantomJS.
More generally, because PhantomJS is not maintained anymore, it doesn't support modern browser features, which is highly discriminative and make these kinds of bots easily detectable.

Chrome headless and Firefox headless instrumented with Puppeteer or Selenium.
These browsers look almost the same as their non-headless counterpart.
As I showed on previous blog posts, they can be detected using some fingerprinting techniques.
For example, you can detect the presence of the **navigator.webdriver** attribute.
Chrome headless also manages permissions for notifications in an inconsistent manner, which can be used for detection.
Nevertheless, except if the bot is running behind a proxy or a VM, TCP and TLS based fingerprinting won't help because they are the same as normal browsers.

Because it can easily execute JS, similarly to normal browser, it is possible to mimic human users behavior by simulating mouse movements, adding jitter when typing on the keyboard, as illustrated by this framework:
https://github.com/das-th-koeln/HOSIT

The table below summarize how each of the different family of crawlers behaves against the different detection approaches:

TODO make a table

## What happens when you get detected

Several approaches can be used once a user is suspected to be a bot.
Some websites will show you a captcha, giving the user a chance to prove he's human.
While this approach enables to decrease the false positive rate, it also gives a chance to crawler to leverage crowdsourcing captcha service to continue to crawl after they have solved the CAPTCHA.
Nevertheless, most detection systems don't take the captcha fully as a proof of not being a bot.
WHile it enables the bot to continue crawling a little bit after it has solved it, its previous history is surely taken into account.

Simply block the user using a custom page or an error 403.
Thus, the bot can't keep on crawling.
This approach is riskier in term of false positives but makes it more difficult for crawlers.
In order to block the crawler from doing other requests, one generally keep track of its IP address alone or the IP with the user agent.
Another solution is to block the crawler based on its fingerprint.
Nevertheless, this approach requires to have fingerprints different between bots and human browsers, which is not necessarly east to achieve.
If it's not the case, the website runs the risks to block legitimate users that have fingerprints similar to the one used by the bot.

Another solution is to lie.
The idea is to pretend the bot has not been detected.
During this time the website can feed the bot fake data to analyze its behavior or even to pollute its data.
Once again, there is a risk in case the bot was actually a human user.

## Conclusion

Several kinds of bots, ranging from simple HTTP-library based bots that can't execute JS to advanced headless browsers.
Constantly evolving, new detection techniques, bot tries to bypass by lying on their fingerprints.

