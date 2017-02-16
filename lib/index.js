/*
 * gets JWT id_token from query, verifies it against google certificates
 * sets req.user to the payload of the token
 * this module does nothing if req.user is already set
 *
 * verifies that the token isn't expired, that the issuer is google,
 * and also verifies the audience is the given client_ID
 *
 * todo: get id_token also from posted form?
 */

/* jshint esversion: 6, node: true */

'use strict';

const jwt = require('jsonwebtoken');
const gcerts = require('./google-jwt-certs');
const profile = require('./profile');
const log = require('./log');

module.exports = (clientId) => {
  const jwtOptions = {
    issuer: 'accounts.google.com',
    audience: clientId,
  };

  return function jwtMiddleware(req, res, next) {
    if (req.user) return next();

    let token;

    // adapted from https://github.com/auth0/express-jwt/blob/4861bbb9d906f8fbd8c494fe2dbc4fda0d7865c6/lib/index.js#L62-70
    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2) {
        const scheme = parts[0];
        const credentials = parts[1];

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
        const decoded = jwt.decode(token, { complete: true });
        if (decoded) {
          const verified = jwt.verify(token, gcerts.getKey(decoded.header.kid).key, jwtOptions);
          req.user = profile.parse(verified);
        }
      } catch (e) {
        log('error verifying token', e);
      }
    }

    return next();
  };
};

/*
 * middleware that requires req.user to exist, otherwise returns
 * 401 Unauthorized
 * WWW-Authenticate: Bearer realm="example"
 */
module.exports.guardMiddleware = (options) => {
  options = options || {};

  const realm = options.realm;
  if (realm.indexOf('"') >= 0) {
    throw new Error('authentication realm must not contain a double quote!');
  }

  return function (req, res, next) {
    if (!req.user) {
      if (realm) res.set('WWW-Authenticate', `Bearer realm="${realm}"`);
      res.sendStatus(401);
    } else {
      next();
    }
  };
};
