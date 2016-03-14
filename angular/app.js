'use strict';

define(['angular/map/app', 'angular/tags/app'], function(){
  var app = angular.module('berlin', ['map', 'tags']);

  app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }]);
});
