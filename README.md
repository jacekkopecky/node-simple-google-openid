# node-simple-google-openid
This is a simple library for using Google as the authenticator of your application's users. All authentication workflows are done in the client's browser; and a [JSON Web Token](https://tools.ietf.org/html/rfc7519) is sent to your server's API.

It makes use of [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken).


# Install

```
npm install simple-google-openid
```

# Usage

The library provides an Express middleware that will take an ID token from the URL query (parameter `id_token`) or from a bearer token (HTTP header `Authorization: Bearer TOKEN`).

A full working example is included below.

To add the middleware to your app, you need to give it your CLIENT_ID (see how to [Create a Google Developers Console project and client ID](https://developers.google.com/identity/sign-in/web/devconsole-project)).

```
var googleauth = require('simple-google-openid');

…

app.use(googleauth(CLIENT_ID));
```

If an ID token is found and successfully parsed, the middleware will add `req.user` like [Passport](http://passportjs.org/docs/profile).


# Example

A full working server (`server.js`) follows:

```
var express = require('express');
var app = express();

var googleauth = require('simple-google-openid');

// you can put your client ID here
app.use(googleauth(process.env.GOOGLE_CLIENT_ID));

app.get('/api/protected', function (req, res) {
  // return 'Not authorized' if we don't have a user
  if (!req.user) return res.sendStatus(401);

  if (req.user.displayName) {
    res.send('Hello ' + req.user.displayName + '!');
  } else {
    res.send('Hello stranger!');
  }

  console.log('successful authorized request by ' + req.user.emails[0].value);
});

// this will serve the HTML file shown below
app.use(express.static('static'));

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});
```

Save this file as `server.js` and run it with your client ID like this:

```
npm install express simple-google-openid
GOOGLE_CLIENT_ID='XXXX...' node server.js
```

Now let's make a Web page (`static/index.html`) that authenticates with Google and uses the protected API above. Save this file in `static/index.html` so then you can just start the server above go to [http://localhost:8080/](http://localhost:8080/).

This follows a guide from Google: [Integrating Google Sign-In into your web app](https://developers.google.com/identity/sign-in/web/sign-in).

Don't forget to replace `CLIENT_ID` (on line 4) with your own client ID.

```
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
  var profile = googleUser.getBasicProfile();
  var el = document.getElementById('greeting');
  el.textContent = '– Hello ' + profile.getName() + '!';

  callServer();
}
function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    var el = document.getElementById('greeting');
    el.textContent = 'Bye!';
  });
}

function callServer() {
  var id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;

  var el = document.getElementById('server-response');
  el.textContent = 'loading…';

  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/protected');
  xhr.setRequestHeader("Authorization", "Bearer " + id_token);
  xhr.onload = processServerResponse;
  xhr.onerror = serverError;
  xhr.send();

  function processServerResponse() {
    if (xhr.status >= 400) return serverError();

    var el = document.getElementById('server-response');
    console.log('setting text content: ' + xhr.responseText);
    el.textContent = xhr.responseText;
  }

  function serverError() {
    var el = document.getElementById('server-response');
    el.textContent = "Server error:\n" + xhr.responseText;
  }
}
</script>
```

# TODO

 * tokens might be retrieved from POSTed form data as well, maybe
 * check that we get Google certificates before (or as soon as) they start using a new one

# Author

Jacek Kopecky

# License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
