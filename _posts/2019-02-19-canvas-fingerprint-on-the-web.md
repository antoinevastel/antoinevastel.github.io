---
layout: post
title: Canvas fingerprinting on the web
categories: [Browser Fingerprinting]
tags: [Browser Fingerprinting]
description: This post presents a crawl of the top Alexa 500K to study the use and the diversity of the canvas fingerprints on the web.
---

Canvas fingerprinting is a technique brought to light by Mowery et al {% cite mowery2012pixel lerner2016internet %} in their paper entitled "Pixel Perfect : Fingerprinting Canvas in HTML5".
It relies on the canvas API to generate images whose rendering is different depending on the OS,
browser and the device of the user, making it suitable for tracking on the web.
Different studies have looked at its adoption among popular websites {% cite acar2014web %}.
In particular, Englehardt et al. {% cite englehardt2016online %} showed that, in 2016, canvas fingerprinting was used by 1.6% of the sites in the top Alexa 1M.

## How are canvas crafted?

The instructions used to generate a canvas fingerprint need to be carefully chosen depending on the desired goal.
In the case of tracking and fraud detection, the goal is to obtain a canvas as unique and stable as possible in order to distinguish the maximum number of users.
In a paper I published with other researchers {% cite vastel2018fp %}, we showed that canvas fingerprints such as the one collected by the popular
<a href="https://github.com/Valve/fingerprintjs2">FingerprintJS2 library</a> tend to remain stable for more than **290 days** for the majority of the browsers.

In the case canvas is used for crawler detection, one does not necessarily want a unique canvas.
Indeed, in their Picasso paper, Bursztein et al. {% cite bursztein2016picasso %} craft canvas fingerprint so that they are the same depending on the kind of device.
Their goal is not to obtain a unique canvas but canvas that are the same for a given device model.
Using this kind of canvas fingerprints, they are able to detect users that lie about their identity by modifying their user agent, as well as emulated devices.

## Use of canvas fingerprinting on the web
We crawl the top Alexa 500K to study how the use of canvas fingerprinting has evolved since Englehardt's study {% cite englehardt2016online %} conducted in 2016.
The methodology is the following: for each website of the top Alexa 500K, we visit the home page and wait for the **DOMContentLoaded** event to be triggered.
Then, the crawler waits for 15 seconds and records the access to functions used for canvas fingerprinting such as **fillText** that enables to write text to a canvas, or **toDataURL**
 that enables to obtain the value of a canvas.
Whenever a canvas related function is called, we store in a database the name of the function called, its arguments as well as the URL of the script that called the function.

After the 500K websites have been crawled, we analyze the database to obtain a list of scripts doing canvas fingerprinting.
In order not to classify all use of the canvas API as canvas fingerprinting, we consider only scripts that called the **fillText** function with a string constituted of at least 7 characters.
In total, we identify **3,825 sites (0.77%)** among the top Alexa 500K that use canvas fingerprinting on their home page.
This number is less than the result of Englehardt et al. that found that 1.6% of the websites in the top 1M used canvas fingerprinting.
This seems to indicate a decrease in the use of canvas fingerprinting.
Nevertheless, further crawls should be conducted since we only crawled the home page of the 500K websites and fingerprinting may be used on critical pages such as login pages that we didn't crawl.

## Diversity of canvas fingerprints

In total we encountered **69** different canvas present on **3,825** distinct websites.
The bar chart below presents the distribution of the number of websites canvas are present.
We observe that **24.6% of the canvas (17 canvas)** are only present on a single website.
On the other hand, only **5.8%of the canvas (4 canvas)** are present on more than 500 websites.
The 2 most used canvas are respectively present on **1,241** and **900** websites.
Thus, while we encountered 69 different canvas, the majority of the websites use the same canvas fingerprint.

<img src="/assets/media/distribution_presence_canvas.svg">

We now present the main canvas fingerprints encountered during our crawl.
We order them from the most popular to the less popular.
You can download an archive containing all the canvas: <a href="/assets/media/images_canvas/canvas_top_500k.tar.gz">archive</a>.

<style>
  td {
    min-width: 22em;
    padding-bottom: 1.6em;
  }

  th {
    font-size: 1.6em;
    padding-bottom: 1.5em;
  }
</style>

<table class="tg">
  <tr>
    <th>Number of websites where the canvas is present</th>
    <th>Canvas</th>
  </tr>
<tr><td>1241</td><td><img src="/assets/media/images_canvas/1241_canvas_2.png"></td><td></td></tr>
<tr><td>900</td><td><img src="/assets/media/images_canvas/900_canvas_0.png"></td><td></td></tr>
<tr><td>556</td><td><img src="/assets/media/images_canvas/556_canvas_25.png"></td><td></td></tr>
<tr><td>556</td><td><img src="/assets/media/images_canvas/556_canvas_26.png"></td><td></td></tr>
<tr><td>182</td><td><img src="/assets/media/images_canvas/182_canvas_3.png"></td><td></td></tr>
<tr><td>174</td><td><img src="/assets/media/images_canvas/174_canvas_11.png"></td><td></td></tr>
<tr><td>125</td><td><img src="/assets/media/images_canvas/125_canvas_14.png"></td><td></td></tr>
<tr><td>87</td><td><img src="/assets/media/images_canvas/87_canvas_31.png"></td><td></td></tr>
<tr><td>77</td><td><img src="/assets/media/images_canvas/77_canvas_7.png"></td><td></td></tr>
<tr><td>57</td><td><img src="/assets/media/images_canvas/57_canvas_5.png"></td><td></td></tr>
<tr><td>56</td><td><img src="/assets/media/images_canvas/56_canvas_6.png"></td><td></td></tr>
<tr><td>55</td><td><img src="/assets/media/images_canvas/55_canvas_32.png"></td><td></td></tr>
<tr><td>46</td><td><img src="/assets/media/images_canvas/46_canvas_24.png"></td><td></td></tr>
<tr><td>33</td><td><img src="/assets/media/images_canvas/33_canvas_44.png"></td><td></td></tr>
<tr><td>30</td><td><img src="/assets/media/images_canvas/30_canvas_37.png"></td><td></td></tr>
<tr><td>24</td><td><img src="/assets/media/images_canvas/24_canvas_35.png"></td><td></td></tr>
<tr><td>24</td><td><img src="/assets/media/images_canvas/24_canvas_36.png"></td><td></td></tr>
<tr><td>24</td><td><img src="/assets/media/images_canvas/24_canvas_38.png"></td><td></td></tr>
<tr><td>19</td><td><img src="/assets/media/images_canvas/19_canvas_28.png"></td><td></td></tr>
<tr><td>17</td><td><img src="/assets/media/images_canvas/17_canvas_39.png"></td><td></td></tr>
<tr><td>14</td><td><img src="/assets/media/images_canvas/14_canvas_50.png"></td><td></td></tr>
<tr><td>12</td><td><img src="/assets/media/images_canvas/12_canvas_15.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_10.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_17.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_18.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_19.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_20.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_21.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_22.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_23.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_45.png"></td><td></td></tr>
<tr><td>9</td><td><img src="/assets/media/images_canvas/9_canvas_47.png"></td><td></td></tr>
<tr><td>8</td><td><img src="/assets/media/images_canvas/8_canvas_34.png"></td><td></td></tr>
<tr><td>8</td><td><img src="/assets/media/images_canvas/8_canvas_54.png"></td><td></td></tr>
<tr><td>7</td><td><img src="/assets/media/images_canvas/7_canvas_41.png"></td><td></td></tr>
<tr><td>6</td><td><img src="/assets/media/images_canvas/6_canvas_29.png"></td><td></td></tr>
<tr><td>5</td><td><img src="/assets/media/images_canvas/5_canvas_27.png"></td><td></td></tr>
<tr><td>5</td><td><img src="/assets/media/images_canvas/5_canvas_30.png"></td><td></td></tr>
<tr><td>5</td><td><img src="/assets/media/images_canvas/5_canvas_49.png"></td><td></td></tr>
<tr><td>4</td><td><img src="/assets/media/images_canvas/4_canvas_12.png"></td><td></td></tr>
<tr><td>3</td><td><img src="/assets/media/images_canvas/3_canvas_16.png"></td><td></td></tr>
<tr><td>3</td><td><img src="/assets/media/images_canvas/3_canvas_40.png"></td><td></td></tr>
<tr><td>3</td><td><img src="/assets/media/images_canvas/3_canvas_53.png"></td><td></td></tr>
<tr><td>3</td><td><img src="/assets/media/images_canvas/3_canvas_61.png"></td><td></td></tr>
<tr><td>3</td><td><img src="/assets/media/images_canvas/3_canvas_62.png"></td><td></td></tr>
<tr><td>3</td><td><img src="/assets/media/images_canvas/3_canvas_9.png"></td><td></td></tr>
<tr><td>2</td><td><img src="/assets/media/images_canvas/2_canvas_1.png"></td><td></td></tr>
<tr><td>2</td><td><img src="/assets/media/images_canvas/2_canvas_4.png"></td><td></td></tr>
<tr><td>2</td><td><img src="/assets/media/images_canvas/2_canvas_51.png"></td><td></td></tr>
<tr><td>2</td><td><img src="/assets/media/images_canvas/2_canvas_55.png"></td><td></td></tr>
<tr><td>2</td><td><img src="/assets/media/images_canvas/2_canvas_56.png"></td><td></td></tr>
<tr><td>2</td><td><img src="/assets/media/images_canvas/2_canvas_58.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_13.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_33.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_42.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_43.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_46.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_48.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_52.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_57.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_59.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_60.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_63.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_64.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_65.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_66.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_67.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_68.png"></td><td></td></tr>
<tr><td>1</td><td><img src="/assets/media/images_canvas/1_canvas_8.png"></td><td></td></tr>
</table>


## References
{% bibliography --cited %}
