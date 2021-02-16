// just a simple logging library
// set DEBUG to a non-empty string to see logging

'use strict';

import * as metadata from '../package.json';

let log: (...args: unknown[]) => void;

if (process.env.DEBUG) {
  log = (...args: unknown[]): void => {
    console.log(`${metadata.name}:`, ...args);
  };
} else {
  log = ():void => undefined;
}

log(`starting v${metadata.version} at ${Date()}`);

export default log;
