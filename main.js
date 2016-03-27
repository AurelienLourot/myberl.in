'use strict';

var requireAngularApp = function(resolve, reject) {
  requirejs(['angular/app'], function(berlin) {
    // Replaces 'ng-app="berlin"', see
    // http://www.sitepoint.com/using-requirejs-angularjs-applications/ :
    angular.bootstrap(document, ['berlin']);

    window.dbg = berlin.dbg;
    resolve(berlin);
  });
};

var waitForAngularAppReady = function(berlinApp) {
  return new Promise(function(resolve, reject) {
    berlinApp.addListener(function() {
      resolve();
    });
  });
};

var initJQueryPopupOverlays = function(resolve, reject) {
  $(document).ready(function() {
    var popups = [$('#filters'), $('#dbg_secret')];
    for (var i = 0; i < popups.length; ++i) {
      var popup = popups[i];
      popup.popup();
      popup.removeClass('hidden');
    }

    console.log('jQuery popup overlays ready.');
    resolve();
  });
};

var hideLoadingLabel = function() {
  $('.loading').hide();
  console.log('App ready.');
};

var loadAngularApp = (new Promise(requireAngularApp)).then(waitForAngularAppReady);
Promise.all([loadAngularApp, new Promise(initJQueryPopupOverlays)]).then(hideLoadingLabel);
