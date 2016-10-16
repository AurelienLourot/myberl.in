'use strict';

var timerlog;
window.module = {};
requirejs(['thirdparty/timerlog-0.1.4/dist/index.es5'], function() {
  timerlog = module.exports;
  module = undefined;

  timerlog({
    id: 'init',
    start_timer: true,
    message: 'Initialization done.',
  });
  localStorage['timerlog'] = 1; // enables console logging
});

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
    Raven.captureException(new Error(str));
  }
};

// Sends unhandled promise rejections to Sentry (see
// https://github.com/getsentry/raven-js/issues/424 ):
window.onunhandledrejection = function(event) {
  console.error(event);
};

console.log('Initializing app...');

// Constants:
var statusLabelColor = 'success';
var statusLabelContent = '<i class="fa fa-spinner fa-spin fa-2x"></i>';

// Adds a listener on module readiness.
var addListener = function(listener) {
  listeners.push(listener);
};

var listeners = [];

var requireAngularApp = function(resolve, reject) {
  requirejs(['angular/app'], function(berlin) {
    console.log('Angular app imported.');

    // Replaces 'ng-app="berlin"', see
    // http://www.sitepoint.com/using-requirejs-angularjs-applications/ :
    angular.bootstrap(document, ['berlin']);

    berlin.status.set(statusLabelColor, statusLabelContent);

    window.dbg = berlin.dbg;
    resolve(berlin);
  });
};

var waitForAngularAppReady = function(berlinApp) {
  return new Promise(function(resolve, reject) {
    berlinApp.addListener(function() {
      resolve(berlinApp);
    });
  });
};

var initBars = function(resolve, reject) {
  $(document).ready(function() {
    // Collapse navbar when clicking everywhere but on the filters:
    $('body').on('click', null, null, function(e) {
      if ($(e.target).closest('.filter-control').length == 0) {
        $('#navbar').collapse('hide');
      }
    });

    // Collapse sidebar when clicking everywhere but on the markers:
    //FIXME: panning the map triggers 'click'
    $('body').on('click', null, null, function(e) {
      if ($(e.target).closest('.gmnoprint').length == 0) {
        $('.ui.sidebar').sidebar('hide')
      }
    });

    $('.ui.sidebar')
      .sidebar('setting', 'dimPage', false)
      .sidebar('setting', 'closable', false);

    console.log('Bars ready.');
    resolve();
  });
};

var initModals = function(resolve, reject) {
  $(document).ready(function() {
    $('.modal-page').removeClass('hidden');
    var modals = ['help', 'dbg_secret'];
    for (var i = 0; i < modals.length; ++i) {
      var modal = modals[i];
      $('.' + modal + '_open').animatedModal({
        modalTarget: modal,
        animatedIn: 'fadeIn',
        animatedOut: 'fadeOut',
        animationDuration: '.2s',
        color: '#f66', //FIXME: same as .brand-my
      });
    }
    console.log('Modals ready.');
    resolve();
  });
};

var clearStatusLabel = function(input) {
  var berlinApp = input[0];
  berlinApp.status.clear(statusLabelColor, statusLabelContent);
};

var callListeners = function() {
  timerlog({
    id: 'init',
    end_timer: true,
  });
  console.log('[ready] App ready.');

  for (var i in listeners) {
    listeners[i]();
  }
};

var loadAngularApp = (new Promise(requireAngularApp)).then(waitForAngularAppReady);
Promise.all([loadAngularApp, new Promise(initBars), new Promise(initModals)])
  .then(clearStatusLabel)
  .then(callListeners)
  .catch(function(e) {
    console.error(e.stack ? e.stack : e);
  });

define({
  addListener: addListener,
});
