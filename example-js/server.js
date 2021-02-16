const express = require('express');

const app = express();

// const GoogleAuth = require('simple-google-openid');
const GoogleAuth = require('./..');

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
