/*
 * gets JWT id_token from query, verifies it against google certificates
 * sets req.user to the payload of the token
 * this module does nothing if req.user is already set
 *
 * verifies that the token isn't expired, that the issuer is google, and also verifies the audience is the given client_ID
 *
 * todo: get id_token also from posted form?
 */

/* jshint esversion: 6, node: true */

'use strict';

var jwt = require('jsonwebtoken');
var gcerts = require('./google-jwt-certs');
var profile = require('./profile');

module.exports = function (client_id) {
  var jwtOptions = {
    issuer: 'accounts.google.com',
    audience: client_id
  };

  return function jwt_middleware(req, res, next) {
    if (req.user) return next();

    var token;

    // adapted from https://github.com/auth0/express-jwt/blob/4861bbb9d906f8fbd8c494fe2dbc4fda0d7865c6/lib/index.js#L62-70
    if (req.headers && req.headers.authorization) {
      var parts = req.headers.authorization.split(' ');
      if (parts.length == 2) {
        var scheme = parts[0];
        var credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          token = credentials;
        }
      }
    }

    if (!token && req.query.id_token) {
      token = req.query.id_token;
    }

    if (token) {
      try {
        const decodedToken = jwt.decode(token, {complete: true} );
        if (decodedToken) {
          const verifiedToken = jwt.verify(token, gcerts.getKey(decodedToken.header.kid).key, jwtOptions);
          req.user = profile.parse(verifiedToken);
        }
      } catch (e) {
        // console.log('error verifying token');
        // console.log(e);
      }
    }

    return next();
  };
};
