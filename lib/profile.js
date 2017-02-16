/**
 * ParsesGoogle JWT into a Passport (Portable Contacts) user profile.
 * Adapted from jardhanson/passport-facebook at https://github.com/jaredhanson/passport-facebook/blob/a29255771d4ab7b07e64a30ca05a665345fd5e00/lib/profile.js
 *
 * @param {object} json
 * @return {object}
 * @access public
 */
exports.parse = function (json) {
  const profile = {};
  profile.displayName = json.name;
  profile.name = { familyName: json.family_name,
                   givenName: json.given_name };

  if (json.email) {
    profile.emails = [{ value: json.email, verified: json.email_verified }];
  }

  if (json.picture) {
    profile.photos = [{ value: json.picture }];
  }

  profile.id = json.sub;
  profile.provider = json.iss;

  return profile;
};
