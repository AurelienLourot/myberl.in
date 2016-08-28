'use strict';

window.now = function now() {
  function pad(str, width) {
    return ('0'.repeat(width) + str).slice(-width);
  }
  var now = new Date;
  return now.getHours() + ':' + pad(now.getMinutes(), 2) + ':' + pad(now.getSeconds(), 2) + '.'
    + pad(now.getMilliseconds(), 3);
}
