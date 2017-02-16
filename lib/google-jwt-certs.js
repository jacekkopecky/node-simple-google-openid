/* loads, and reloads every day, the oauth2 certificates from Google APIs
 * adapted from https://github.com/auth0/connect-google-jwt/blob/master/index.js
 */

/* jshint esversion: 6, node: true */


'use strict';

const request = require('request');
const log = require('./log');

let certificates = {};

let nextReloadTime = 0;
function reloadCertificates() {
  if (nextReloadTime > Date.now()) return;

  // Google said the certificates can change daily
  // but my measurement shows a key can be used 11h after first noticed
  // so reloading every hour
  // todo: reload on demand (at most once a minute) when faced with a token
  //   that isn't expired and uses an unknown key
  nextReloadTime = Date.now() + 60 * 60 * 1000;
  log('reloading certificates at ' + new Date());
  request.get({
    url: 'https://www.googleapis.com/oauth2/v1/certs',
    json: true,
  }, (err, resp, certs) => {
    certificates = {};
    log('reloaded certificates');
    if (err) {
      console.error(`error reloading google certificates at ${new Date()}`);
      console.error(err);
      nextReloadTime = 0; // reload on the next check; see setInterval below
      return;
    }
    Object.keys(certs).forEach((kid) => {
      log('added certificate for ' + kid);
      certificates[kid] = { key: certs[kid] };
    });
  });
}

reloadCertificates();

// every five minutes check if it's already been a day since last reload
// because when developing, if the computer sleeps, interval timers may pause
setInterval(reloadCertificates, 5 * 60 * 1000);

module.exports = {
  /* for a given key ID (kid),
   * returns { key: string, alg: string }
   * or undefined if the key is not currently known.
   * the key is targeted at use with jsonwebtoken
   */
  getKey: (kid) => certificates[kid],
};
