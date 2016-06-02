'use strict';

define(['angular/map/app', 'angular/tags/app', 'angular/status/app'], function(map, tags, status) {
  map.addListener(function() {
    console.log('Map module ready.');

    console.log('Angular app ready.');
    for (var i in listeners) {
      listeners[i]();
    }
  });

  var app = angular.module('berlin', ['map', 'tags', 'status']);

  app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }]);

  app.filter('rawHtml', ['$sce', function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    }
  }]);

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
