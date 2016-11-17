'use strict';

// Extends console.log() and console.error():
console.log_orig = console.log;
console.log = function(str) {
  console.log_orig(now() + ' ' + str);
};
console.error_orig = console.error;
console.error = function(str) {
  console.error_orig(now() + ' ' + str);

  // Fail on error when testing or send error to Sentry in prod:
  if (typeof fail != "undefined") { // fail() is provided by jasmine when testing
    fail(str);
  } else {
    Raven && Raven.captureException(new Error(str));
  }
};

// Sends unhandled promise rejections to Sentry (see
// https://github.com/getsentry/raven-js/issues/424 ):
window.onunhandledrejection = function(event) {
  console.error(event);
};
