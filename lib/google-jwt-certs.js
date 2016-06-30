/* loads, and reloads every day, the oauth2 certificates from Google APIs
 * adapted from https://github.com/auth0/connect-google-jwt/blob/master/index.js
 */

/* jshint esversion: 6, node: true */


'use strict';

const request = require('request');

let certificates = {};

function reload_certificates () {
  // console.log('reloading certificates');
  request.get({
    url: 'https://www.googleapis.com/oauth2/v1/certs',
    json: true,
  }, (err, resp, certs) => {
    certificates = {};
    // console.info('reloaded certificates');
    if (err) {
      // console.error('error reloading google certificates');
      return;
    }
    Object.keys(certs).forEach((kid) => {
      // console.log('added certificate for ' + key.kid);
      certificates[kid] = { key: certs[kid] };
    });
  });
}

reload_certificates();
setTimeout(reload_certificates, 24 * 60 * 60 * 1000); // since Google said that can change daily

module.exports = {
  /* for a given key ID (kid),
   * returns { key: string, alg: string }
   * or undefined if the key is not currently known.
   * the key is targeted at use with jsonwebtoken
   */
  getKey: (kid) => certificates[kid],
};
