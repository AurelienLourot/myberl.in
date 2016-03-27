'use strict';

define(['angular/map/app', 'angular/tags/app'], function(map, tags){
  map.addListener(function() {
    console.log('Map module ready.');

    console.log('Angular app ready.');
    for (var i in listeners) {
      listeners[i]();
    }
  });

  var app = angular.module('berlin', ['map', 'tags']);

  app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }]);

  // Adds a listener on module readiness.
  var addListener = function(listener) {
    listeners.push(listener);
  };

  var listeners = [];

  return {
    addListener: addListener,
    dbg: map.dbg,
  };
});
