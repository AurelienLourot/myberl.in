'use strict';

requirejs(['angular/app'], function(berlin) {
  // Replaces 'ng-app="berlin"', see
  // http://www.sitepoint.com/using-requirejs-angularjs-applications/ :
  angular.bootstrap(document, ['berlin']);
});

requirejs(['angular/map/app'], function(map) {
  window.dbg = map.dbg;
});

// jQuery Popup Overlay:
$(document).ready(function() {
  var popups = [$('#filters'), $('#dbg_secret')];
  for (var i = 0; i < popups.length; ++i) {
    var popup = popups[i];
    popup.popup();
    popup.removeClass('hidden');
  }
});
