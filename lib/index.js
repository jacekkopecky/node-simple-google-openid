/*
 * gets JWT id_token from query, verifies it against google certificates
 * sets req.user to the payload of the token
 * this module does nothing if req.user is already set
 *
 * verifies that the token isn't expired, that the issuer is google,
 * and also verifies the audience is the given client_ID
 */

'use strict';

const GoogleAuth = require('google-auth-library');
const profile = require('./profile');
const log = require('./log');

const auth = new GoogleAuth.OAuth2Client();

module.exports = (clientId) => {
  if (!clientId) {
    throw new Error('CLIENT ID is required: checking JWT without a CLIENT ID is insecure!');
  }

  const verifyToken = async (idToken) => {
    try {
      const verifyOptions = {
        idToken,
        audience: clientId,
      };
      const login = await auth.verifyIdToken(verifyOptions);
      const payload = login.getPayload();
      log('payload', JSON.stringify(payload, null, 2));
      return profile.parse(payload);
    } catch (e) {
      log('error verifying token', e);
      return null;
    }
  };

  const middleware = async function SimpleGoogleOpenIDMiddleware(req, res, next) {
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
      req.user = await verifyToken(token);
    }
    next();
  };

  middleware.guardMiddleware = guardMiddleware;
  middleware.verifyToken = verifyToken;
  return middleware;
};

/*
 * middleware that requires req.user to exist, otherwise returns
 * 401 Unauthorized
 * WWW-Authenticate: Bearer realm="example"
 */
module.exports.guardMiddleware = guardMiddleware;
function guardMiddleware(options) {
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
}
