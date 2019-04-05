# node-simple-google-openid
This is a simple library providing two Express.js middlewares for using Google
as the authenticator of your application's users.

All authentication workflows are done in the client's browser;
to authenticate with a server, the browser sends a
[JSON Web Token](https://tools.ietf.org/html/rfc7519) to your server's API.

In the server, this package will add `req.user` structured like a
[Passport User Profile](http://passportjs.org/docs/profile).

This package makes use of
[Google Auth Library](https://github.com/google/google-auth-library-nodejs).

### Status

- works for me, does what I need
- let me know if it doesn't work for you or if you'd like any new functionality


# Installation

```bash
npm install simple-google-openid
```

# Usage

## Express middleware for authentication

First, this package provides an Express.js _middleware_ that will take an
ID token from the URL query (parameter `id_token`) or from a bearer token
(HTTP header `Authorization: Bearer TOKEN`).


To add the middleware to your app, you need to give it your CLIENT_ID
(see [Create a Google Developers Console project and client
ID](https://developers.google.com/identity/sign-in/web/devconsole-project)).
A full working example is included below.

```javascript
const GoogleAuth = require('simple-google-openid');

…

app.use(GoogleAuth(CLIENT_ID));
```

If an ID token is found and successfully parsed, the middleware will add
`req.user` like [Passport User Profile](http://passportjs.org/docs/profile).

## How to require authentication

To require authentication for a part of your app (e.g. `/api/*`),
you can use the `guardMiddleware`; this will ensure that the app returns
401 Unauthorized on requests without an authentication token.

```javascript
app.use('/api', GoogleAuth.guardMiddleware());
```

**This package does not provide any authorization – `guardMiddleware` lets in
any signed-in Google user. Your app needs to provide authorization logic.**

## Verifying tokens

If you get ID tokens outside of the `Authorization` header (e.g. as part of WebSocket messages), you can verify them and get the user information using the `verifyToken()` function that returns a Promise.

Using await/async:

```javascript
const auth = GoogleAuth(CLIENT_ID);

…

const token = ...; // get token from somewhere
const user = await auth.verifyToken(token);
if (!user) ...; // token was not valid (e.g. expired)
```

Using `.then()`:

```javascript
const auth = GoogleAuth(CLIENT_ID);

…

const token = ...; // get token from somewhere
auth.verifyToken(token)
  .then((user) => {
    if (!user) ...; // token was not valid (e.g. expired)
  });
```


## Minimal skeleton of an authenticated web page

Here's what we need to do in a web page to get the user authenticated.
This follows a guide from Google: [Integrating Google Sign-In into your
web app](https://developers.google.com/identity/sign-in/web/sign-in).
A full working example is included further down on this page.

```html
<!doctype html>
<title>TITLE</title>

<!-- this loads google libraries -->
<script src="https://apis.google.com/js/platform.js" async defer></script>
<meta name="google-signin-client_id" content="CLIENT_ID">

<!-- this puts a sign-in button, and a sign-out link, in the page -->
<div class="g-signin2" data-onsuccess="onSignIn"></div>
<p><a href="#" onclick="signOut();">Sign out</a></p>

<!-- this shows how the page can use the information of the authenticated user -->
<script>
function onSignIn(googleUser) {
  // do something with the user profile
}

async function signOut() {
  await gapi.auth2.getAuthInstance().signOut();
  // update your page to show the user's logged out, or redirect elsewhere
}

// example that uses a server API and passes it a bearer token
async function callServer() {
  const id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  const fetchOptions = {
    credentials: 'same-origin',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + id_token },
  };
  const response = await fetch(API_ENDPOINT_URL, fetchOptions);
  if (!response.ok) {
    // handle the error
    return;
  }
  // handle the response
}

// see the complete example below for an extra function that refreshes the token when the computer wakes up from a sleep
</script>
```


# Example

Here's a full working example. First, the server that implements an API that
needs to securely know users' email addresses; second, the client side.

## Server-side

A full working server (`server.js`) follows:

```javascript
const express = require('express');
const app = express();

const GoogleAuth = require('simple-google-openid');

// you can put your client ID here
app.use(GoogleAuth(process.env.GOOGLE_CLIENT_ID));

// return 'Not authorized' if we don't have a user
app.use('/api', GoogleAuth.guardMiddleware());

app.get('/api/hello', (req, res) => {
  res.send('Hello ' + (req.user.displayName || 'user without a name') + '!');

  console.log('successful authenticated request by ' + req.user.emails[0].value);
});

// this will serve the HTML file shown below
app.use(express.static('static'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
```

Save this file as `server.js` and run it with your client ID like this:

```bash
npm init -y
npm install express simple-google-openid
GOOGLE_CLIENT_ID='XXXX...' node server.js
```

## Client-side – the web page in a browser

Now let's make a Web page (`static/index.html`) that authenticates with Google
and uses the API above. Save this file in `static/index.html`,
start the server above, and go to
[http://localhost:8080/](http://localhost:8080/).

This follows a guide from Google: [Integrating Google Sign-In into your web
app](https://developers.google.com/identity/sign-in/web/sign-in).

Don't forget to replace `CLIENT_ID` (on line 4) with your own client ID.

```html
<!doctype html>
<title>Simple Google Auth test</title>
<script src="https://apis.google.com/js/platform.js" async defer></script>
<meta name="google-signin-client_id" content="CLIENT_ID">


<h1>Simple Google Auth test <span id="greeting"></span></h1>

<p>Press the button below to sign in:</p>
<div class="g-signin2" data-onsuccess="onSignIn" data-theme="dark"></div>
<p><a href="#" onclick="signOut();">Sign out</a></p>

<p>Below is the response from the server API: <button onclick="callServer()">refresh</button>
<pre id="server-response" style="border: 1px dashed black; min-width: 10em; min-height: 1em; padding: .5em;"></pre>

<script>
function onSignIn(googleUser) {
  const profile = googleUser.getBasicProfile();
  const el = document.getElementById('greeting');
  el.textContent = '– Hello ' + profile.getName() + '!';

  callServer();
}
async function signOut() {
  await gapi.auth2.getAuthInstance().signOut();
  console.log('User signed out.');
  const el = document.getElementById('greeting');
  el.textContent = 'Bye!';
}

async function callServer() {
  const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  const el = document.getElementById('server-response');
  el.textContent = 'loading…';

  const fetchOptions = {
    credentials: 'same-origin',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token },
  };
  const response = await fetch('/api/hello', fetchOptions);
  if (!response.ok) {
    // handle the error
    el.textContent = "Server error:\n" + response.status;
    return;
  }

  // handle the response
  const data = await response.text();
  console.log('setting text content: ' + data);
  el.textContent = data;
}

// react to computer sleeps, get a new token; gapi doesn't do this reliably
// adapted from http://stackoverflow.com/questions/4079115/can-any-desktop-browsers-detect-when-the-computer-resumes-from-sleep/4080174#4080174
(function () {
  const CHECK_DELAY = 2000;
  let lastTime = Date.now();

  setInterval(() => {
    const currentTime = Date.now();
    if (currentTime > (lastTime + CHECK_DELAY*2)) {  // ignore small delays
      gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
    }
    lastTime = currentTime;
  }, CHECK_DELAY);
}());
</script>
```

# Logging

To enable logging into console output, set the environment variable DEBUG
to a non-empty string.

# TODO

 * tokens might be retrieved from POSTed form data as well, maybe
 * use https://www.npmjs.com/package/express-bearer-token
 * tests

# Author

Jacek Kopecky

# License

This project is licensed under the MIT license. See the [LICENSE](LICENSE)
file for more info.
