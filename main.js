'use strict';

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

var initJQueryPopupOverlays = function(resolve, reject) {
  $(document).ready(function() {
    var popups = [$('#credits'), $('#dbg_secret')];
    for (var i = 0; i < popups.length; ++i) {
      var popup = popups[i];
      popup.popup();
      popup.removeClass('hidden');
    }

    console.log('jQuery popup overlays ready.');
    resolve();
  });
};

var clearStatusLabel = function(input) {
  var berlinApp = input[0];
  berlinApp.status.clear(statusLabelColor, statusLabelContent);
};

var callListeners = function() {
  console.log('App ready.');
  for (var i in listeners) {
    listeners[i]();
  }
};

var loadAngularApp = (new Promise(requireAngularApp)).then(waitForAngularAppReady);
Promise.all([loadAngularApp, new Promise(initJQueryPopupOverlays)]).then(clearStatusLabel)
  .then(callListeners);

define({
  addListener: addListener,
});
