---
layout: post
title: "Creating a simple ExpressJS middleware to detect bots"
categories: [Bots]
tags: [Javascript, ExpressJS]
description: In this blog post, we show how to create a simple ExpressJS middleware to detect bots.
---

This blog post demonstrates how you can create a simple ExpressJS middleware to detect and block bad bots.
The purpose of this blog post is not to go into the details of bot detection, but rather to illustrate how you can integrate a simple bot detection mechanism in your ExpressJS application using middleware.
If you came here for more advanced details about detection, you can read previous articles I've published on this blog (<a href="{% post_url 2020-02-09-detecting-web-bots %}">how to detect web bots</a>, <a href="{% post_url 2018-01-17-detect-chrome-headless-v2 %}">detecting headless chrome</a>).

## What are middlewares

If you are familiar with Express, you have probably already defined routes to handle requests.
To define a route, you use the following syntax:
```javascript
app.METHOD(PATH, HANDLER)
```

The handler is a function that takes 2 parameters, a request and a response objects.
```javascript
app.get('/', function (req, res) {
  res.send('Hello World!')
})
```

By default, the request object contain information about the incoming requests, such as the HTTP headers.

However, what if, you want to apply a function on each incoming request, e.g. verify if the user is logged in, or to modify each response, e.g. to add a custom header?
It would be cumbersome to modify all your routes to apply the same function.
That's where middleware come into play.

Middleware enable you to define a function capable of modifying the request and the response object for all requests or for a subset of requests that match a specific pattern.

Defining middleware in Express is straightforward.
Express middleware are functions that take 3 parameters as input:
1. a request object;
2. a response object;
3. a next function.

```javascript
function myMiddleware(req, res, next) {
    // do whatever you want
    // e.g. modify the request object to enrich it
    req.mynewfield = 'added by myMiddleware';

    // or modify the response to add a custom header
    res.setHeader("X-New-Header", "addedByMyMiddleware");

    // Finally, don't forget to call the next function to pass
    // the request to the next middleware or the route callback
    next();
}
```

Similarly to when you declare routes, the request object contains information about the incoming request, while the response object contains information about the response your server will send.
The next parameter is a function responsible for calling the next middleware, or if you don't have middleware, the route responsible for handling the request.

With this approach, you can easily chain multiple middleware.
For example, you may have a first middleware that verifies if the user is not a bot, then a second that verifies if the user is logged in.
Thus, when a request arrives to your route handler, you'll know if the request originates from a human or a bot user, and if this user is logged-in.

To use a middleware in your express application, you simply need to tell your app to use it:
```javascript
app.use(myMiddleware);
```

## Creating our ExpressJS project

Now that you know the basics about middleware, we create a simple ExpressJS project that we use to illustrate how to create a bot detection middleware.

We start by creating a directory to host our Express project.
```shell
mkdir bot_middleware_app
cd bot_middleware_app
```

Then, we initialize the Node project and install Express.
```shell
npm init -y
npm install express

```

Finally, we create a simple Express application in a file called **app.js**:
```javascript
// app.js

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`))
```

To launch the Express app, run ```node app.js``` from a terminal. 
It will create an Express server that listens to the port 3000. 
To verify the server is working properly, visit <a href="http://localhost:3000/">http://localhost:3000/</a> from your browser.
You should see a page displaying "Hello World!".

## Creating the bot detection middleware

We start by creating a new directory to host the code of our middleware.
```shell
mkdir middleware
```

In this directory, we create the JavaScript file that will contain the code of our bot detection middleware.
For the moment, we create a really basic middleware just to ensure things are working properly before we go further.

```javascript
// middleware/isBot.js
module.exports = function isBot(req, res, next) {
    console.log('isBot middleware called!');
    // transmits the requests to the next middleware
    next();
}
```

We modify **app.js** to tell Express to use our bot detection middleware.
```javascript
// app.js
const express = require('express')

// Import the bot detection middleware
const isBot = require('./middleware/isBot')

const app = express()
const port = 3000

// Tell express app to use our bot detection middleware
app.use(isBot);

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Server listening at http://localhost:${port}`))
```

To verify if the Express app is using the middleware, restart the application and visit the home page.
In your express app's logs, you should see **'isBot middleware called!'**.
If it's not the case, verify that your app uses the middleware (with the **app.use** statement) or that you have restarted your Express app.

## Adding a simple bot detection logic to our middleware
Now that we have verified that our midleware is called, we modify it to add some simple bot detection logic based on the user agent.
As I've already explained in other posts (<a href="{% post_url 2020-02-09-detecting-web-bots %}">how to detect web bots</a>, <a href="{% post_url 2018-01-17-detect-chrome-headless-v2 %}">detecting headless chrome</a>), it's not a robust detection method since bots frequently lie on this field to bypass detection.
However, it's a good and simple example to showcase our bot detection middleware.

```javascript
// middleware/isBot.js

// Map bot name to regular expression used to detect them based
// on their user-agent
const knownBotsToPattern = new Map([
    ['Headless Chrome', /HeadlessChrome/],
    ['Wget', /[wW]get/],
    ['Python urllib', /Python\-urllib/],
    ['PHP crawl', /phpcrawl/],
    ['PhantomJS', /PhantomJS/]
]);

// Detect if an incoming request belongs to a bot using its user agent
function isKnownBotUserAgent(userAgent) {
    for (const [knownBot, pattern] of knownBotsToPattern.entries()) {
        if (userAgent.match(pattern)) {
            return {
                isBot: true,
                // In case the request comes from a bot,
                // we also returns the name of the bot
                nameBot: knownBot
            }
        }
    }

    return {
        isBot: false
    }
}

module.exports = function isBot(req, res, next) {
    // We enrich the incoming request object (req)
    // with information regarding bot detection
    req.botInfo = isKnownBotUserAgent(req.header('User-Agent'));
    next();
}
```

For the moment, our middleware simply enriches the request object, it doesn't take any decision like blocking.

We modify our only route ("/") to show that it can access information computed in our middleware.

```javascript
// app.js

// ...

// We modify the / route to log information regarding bot detection
app.get('/', (req, res) => {
    console.log('In /route')
    console.log(req.botInfo);
    
    res.send('Hello World!')
})
```

Restart your Express app and visit the home page. 
In the logs, you should see that your request does not originate from a bot:
```javascript
In /route
{ isBot: false }
```

To ensure our middleware can also detect bots, we use Curl to make a request with a user agent pretending to come from Headless Chrome.
The -H option enables to specify HTTP headers, here, the user agent.

```shell
curl 'http://localhost:3000/' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36' 
```

In the Express app's logs, we see that the request has been properly detected as coming from a Headless Chrome bot.
```javascript
In /route
{ isBot: true, nameBot: 'Headless Chrome' }
```

You may argue that you don't need middleware to achieve this result.
You could use the **isKnownBotUserAgent** function directly in the callback function of the **/** route.
However, using middleware helps to better separate our bot detection logic from the rest of the code.
Moreover, our middleware provides an easy mechanism to easily access bot information in every route.

To show that bot detection information are available in all routes, we create a new **/login** route.
```javascript
app.get('/login', (req, res) => {
    console.log('In /login')
    console.log(req.botInfo);

    res.send("On login page!")
})
```

You can test this new route by visiting <a href="http://localhost:3000/login">http://localhost:3000/login</a>

After your visit, you should see that your request on **/login** has also been analyzed by our bot detection middleware.
```javascript
In /login
{ isBot: false }
```

Since bot detection information is available in all routes, we can modify our routes handlers depending on the page it serves.
Let's say we don't care about bots on our home page but we want to exclude them from our login page. Then, we can modify our login route to block the request if it originates from a bot:

```javascript
app.get('/login', (req, res) => {
    console.log('In /login')
    console.log(req.botInfo);

    if (req.botInfo.isBot) {
        res.status(403);
        res.send("You are a bot, you can't access the login page!");
    } else {
        res.status(200);
        res.send("You seem human, you can access the login page!");
    }  
})
```

If you access the **/login** page from your browser, your request will be allowed.
The page displays the following message: You seem human, you can access the login page!
However, if you do a request pretending to be Headless Chrome using Curl, you will get an error 403, and the content page content will be different.
```shell
curl 'http://localhost:3000/login' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36'

# It returns the following page:
# You are a bot, you can't access the login page!
```

Please note that in a real-world application, what matters most to secure a login endpoint is not the GET route but the POST route instead.
Indeed, the GET route is only responsible for showing the login page.
However, the login request that contains the username and the password will be sent as a POST request (you should not send it as a GET request since login parameters will appear in the URL, which is insecure).
However, bots don't need to access the login page (through the GET route) to do login attempts.
They can simply forge login attempts with POST requests.
In the following example, we show how you can make a POST request that contains 2 parameters:
1. A username equal to "john"
2. A password equal to "bestpassword"
```shell
curl -d "username=john&param2=bestpassword" \
-X POST http://localhost:3000/login \
-H 'User-Agent: Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36'
```

For the moment, it will fail since you don't have an associated route in your Express application.
To test it, we create a new route that handles POST requests on **/login**.
```javascript
app.post('/login', (req, res) => {
    console.log('In /login (POST)')
    res.send("Login attempt successful");
})
```

If you run the curl command, you should see that your bot was able to make a successful login attempt.
To avoid bots being able to forge login requests, we also modify the POST **/login** route to block bots.

After this modification, if we do a POST request with a headless Chrome user agent, your POST request will be blocked.
```shell
curl -d "username=john&param2=bestpassword" \
-X POST http://localhost:3000/login \
-H 'User-Agent: Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.0 Safari/537.36'

# it returns the following content
# You are a bot, stop trying to login!
```

In this blog post, we've shown how to create a simple Express middleware to detect and block bots.
Although the detection logic is simple -- it only relies on the user agent -- you could extend it to leverage other features such as the presence/absence of other HTTP headers.
Similarly, you could also implement rate limiting, i.e. limit the number of requests per IP or session using middleware.