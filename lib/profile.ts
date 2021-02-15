// Parses Google JWT into a Passport User Profile.
// Adapted from jardhanson/passport-facebook at https://github.com/jaredhanson/passport-facebook/blob/a29255771d4ab7b07e64a30ca05a665345fd5e00/lib/profile.js

import { TokenPayload } from 'google-auth-library';
import { Profile } from 'passport'; // eslint-disable-line import/no-extraneous-dependencies

export function parse(json: TokenPayload): Profile {
  const profile: Profile = {
    provider: json.iss,
    id: json.sub,
    displayName: json.name || 'unknown',
  };

  profile.name = {
    familyName: json.family_name || '',
    givenName: json.given_name || '',
  };

  if (json.email) {
    profile.emails = [{ value: json.email }];
  }

  if (json.picture) {
    profile.photos = [{ value: json.picture }];
  }


  return profile;
}
