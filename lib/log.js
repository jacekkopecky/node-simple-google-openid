// just a simple logging library
// set DEBUG to a non-empty string to see logging

'use strict';

const metadata = require('../package.json');

let log;

if (process.env.DEBUG) {
  log = (...args) => {
    console.log(`${metadata.name}:`, ...args);
  };
} else {
  log = () => {};
}

log(`starting v${metadata.version} at ${new Date()}`);

module.exports = log;
