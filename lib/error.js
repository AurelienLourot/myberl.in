'use strict';

// Logs an error in production. Fails while testing.
var error = function(arg) {
  console.error(arg);
  if (typeof fail != "undefined") { // fail() is provided by jasmine when testing
    fail(arg);
  }
}
