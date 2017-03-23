'use strict';

define(['angular/map/app', 'angular/tags/app', 'angular/status/app'], function(map, tags, status) {
  console.log("Initializing AngularJS module 'app'.");

  map.addListener(function() {
    console.log('Map module ready.');

    console.log('Angular app ready.');
    for (var i in listeners) {
      listeners[i]();
    }
  });

  var app = angular.module('app', ['map', 'tags', 'status']);

  app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }]);

  app.filter('rawHtml', ['$sce', function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    }
  }]);

  // See https://docs.angularjs.org/api/ng/service/$exceptionHandler :
  app.factory('$exceptionHandler', function() {
    return function(exception, cause) {
      console.error(exception.stack ? exception.stack : exception);
    };
  });

  // Adds a listener on module readiness.
  var addListener = function(listener) {
    listeners.push(listener);
  };

  var listeners = [];

  return {
    addListener: addListener,
    status: status,
    dbg: map.dbg,
  };
});
