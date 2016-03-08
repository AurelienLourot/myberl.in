'use strict';

(function(){
  var app = angular.module('berlin', ['map', 'tags']);

  app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }]);
})();
