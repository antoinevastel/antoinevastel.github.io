---
layout: post
title: Detecting Selenium and other automated browsers using events
categories: [Bot detection]
tags: [Browser Fingerprinting]
description: This post presents how we can use differences in the way events are processed to detect automated browsers.
---

I had the idea after watching the excellent presentation of Jake Archibald about the JavaScript event loop: https://www.youtube.com/watch?v=cCOL7MC4Pl0&feature=youtu.be
In this presentation he explains some differences in the way events are processed when they come from a user or if they are emitted by some code.

In one of his slides he asks the audience what would be the results of the following code when a user click on the button that has the two event listeners:
```javascript
button.addEventListener('click', () => {
  Promise.resolve().then(() => console.log('Microtask 1'));
  console.log('Listener 1');
})

button.addEventListener('click', () => {
  Promise.resolve().then(() => console.log('Microtask 2'));
  console.log('Listener 2');
})
```
It would have the following output:

```
Listener 1
Microtask 1
Listener 2
Microtask2
```
The reason Listener 2 is not right after Listener 1 is because ...
Then he asks the same question but in the case where the event is triggered using some code:
```javascript
button.click();
```

Then, the output is different since the Javascript stack is not empty…
We obtain the following output:


TODO: how does Selenium injects code to execute?


We have a trusted event that behaves as an untrusted event !

Usually you can distinguish events that are the results of human interaction and events that are emitted by the code by looking at the isTrusted property in the events.
Nevertheless, crawling frameworks tend to override the isTrusted property so that it is set to true when the automated browser simulates human interactions.

```html
<!DOCTYPE html>
<html lang="en">
<body>

<p id="res" style="height:10px"><p>

<script>
  const res = document.getElementById('res');
  const calls = [];

  document.addEventListener('click', (e) => {
    Promise.resolve().then(() => {
      calls.push('Microtask 1');
    });
    calls.push(`Listener 1: ${e.isTrusted}`);
  });

  document.addEventListener('click', (e) => {
    Promise.resolve().then(() => {
      calls.push('Microtask 2');
    });
    calls.push(`Listener 2: ${e.isTrusted}`);
    calls.push(e.isTrusted);
  });


  document.addEventListener('click', (e) => {
    setTimeout(() => {
      res.innerText = calls.join(', ');
    }, 10)
  });

</script>

</body>
</html>

```
