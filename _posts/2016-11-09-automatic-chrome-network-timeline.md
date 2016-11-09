---
layout: post
title: Automatic Chrome network timeline
categories: [Network performance]
tags: [Network, Selenium, Python, PerfCascade]
description: This article presents how to automatically generate a network timeline such as the one in Chrome dev tools. 
---
<link rel="stylesheet" href="/assets/css/perf-cascade.css">
In this article we present how to automatically generate a network timeline such as the one in Chrome dev tools. 

# Capture the network traffic
The first step of our mission will be to capture the network traffic. In order to do that, we are going to use Selenium and BrowserMob Proxy, as well as PerfCascade.

Selenium will be used with <a href="https://sites.google.com/a/chromium.org/chromedriver/getting-started">Chromedriver</a> to control Chrome and create web traffic. On the other side, we will use <a href="https://bmp.lightbody.net/">BrowserMob Proxy</a> to capture the HTTP traffic and export it to a .har file.

In order to instrument these libraries we'll use Python. However, keep in mind that you could also do this with other languages having a wrapper for Selenium and BrowserMob Proxy such as Java.

## Python code

{% highlight python %}
from browsermobproxy import Server
from selenium import webdriver

server = Server("/path/to/browsermob-proxy")

server.start()
proxy = server.create_proxy()
proxy.new_har()

chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--proxy-server={0}".format(proxy.proxy))
driver = webdriver.Chrome(
    executable_path="/path/to/chromedriver",
    chrome_options=chrome_options)
driver.get("http://antoinevastel.github.io/")

with open('./output.har', 'w') as f:
    f.write(str(proxy.har))

driver.quit()
server.stop()
{% endhighlight %}


## Visualisation of HAR file
Once this code has been run, we obtain a file formatted according to the HTTP Archive format (har format). It is based on JSON, and enables to standardize the representation of HTTP transactions. 

Several websites such as <a href="https://toolbox.googleapps.com/apps/har_analyzer/">G Suite toolbox</a> or <a href="http://stiehl.io/tools/HARVisualizer/">Stiel.io</a> enable to easily visualise har files.

In our case we are going to use the PerfCascade Javascript library. Thus, if we want we can fully automate the process of collection and visualisation of the HTTP traffic.

We just need to add this CSS file at the beginning of our page, and the 2 Javascript files at the end.
{% highlight html %}
<link rel="stylesheet" href="perf-cascade-gh-page.css">
<script src="./perf-cascade.min.js"></script>
<script src="./demo-page.js"></script>
{% endhighlight %}

The demo-page.js file initializes the options and generates the timeline graphic. In your case you need to replace data with your har's file content. You also need to have a div with an "output" id in your HTML file.
{% highlight javascript %}
(function (perfCascade) {
  /** holder DOM element to render PerfCascade into */
  var outputHolder = document.getElementById("output");

  var perfCascadeOptions = {
    rowHeight: 23, //default: 23
    showAlignmentHelpers: true, //default: true
    showIndicatorIcons: true, //default: true
    leftColumnWith: 25, //default: 25
  };

  /** renders the har (passing in the har.log node) */
  function renderPerfCascadeChart(harLogData) {
    var perfCascadeSvg = perfCascade.fromHar(harLogData, perfCascadeOptions);
    outputHolder.appendChild(perfCascadeSvg);
  }
  /*
  	TODO : replace data with your har file content
  */

  renderPerfCascadeChart(data);

})(window.perfCascade);
{% endhighlight %}

### Result
You can see the generated timeline below. It is possible to interact with the graphic and get more data by clicking on the different lines. 

For further explanations about PerfCascade you can check the repository on <a href="https://github.com/micmro/PerfCascade">Github</a>.

<section class="main-content">
    <div id="output"></div>
</section>

<script src="/assets/js/perf-cascade.min.js"></script>
<script src="/assets/js/demo-page.js"></script>