'use strict';

// Returns the current time as string.
window.now = function now() {
  function pad(str, width) {
    return ('0'.repeat(width) + str).slice(-width);
  }
  var now = new Date;
  return now.getHours() + ':' + pad(now.getMinutes(), 2) + ':' + pad(now.getSeconds(), 2) + '.'
    + pad(now.getMilliseconds(), 3);
};

// Returns the current time in milliseconds since the epoch.
window.nowMs = function nowMs() {
  return (new Date).getTime();
};
