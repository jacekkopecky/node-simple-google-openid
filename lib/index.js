/*
 * gets JWT id_token from query, verifies it against google certificates
 * sets req.user to the payload of the token
 * this module does nothing if req.user is already set
 *
 * verifies that the token isn't expired, that the issuer is google,
 * and also verifies the audience is the given client_ID
 */

'use strict';

const profile = require('./profile');
const log = require('./log');
const GoogleAuth = require('google-auth-library');

const auth = new (new GoogleAuth()).OAuth2();

module.exports = (clientId) => {
  if (!clientId) {
    throw new Error('CLIENT ID is required: checking JWT without a CLIENT ID is insecure!');
  }

  return function SimpleGoogleOpenIDMiddleware(req, res, next) {
    if (req.user) {
      next();
      return;
    }

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
      auth.verifyIdToken(
        token,
        clientId,
        (e, login) => {
          if (!e) {
            const payload = login.getPayload();
            req.user = profile.parse(payload);
          } else {
            log('error verifying token', e);
          }
          next();
        },
      );
    } else {
      next();
    }
  };
};

/*
 * middleware that requires req.user to exist, otherwise returns
 * 401 Unauthorized
 * WWW-Authenticate: Bearer realm="example"
 */
module.exports.guardMiddleware = (options) => {
  options = options || {};

  const realm = options.realm || 'jwt';
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
