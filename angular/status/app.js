'use strict';

define(function() {
  var app = angular.module('status', []);

  // Service for setting the current status.
  app.factory('setStatus', function() {
    // clr: if true, status will be cleared instead of being set.
    return function(color, text, clr) {
      if (!clr) {
        set(color, text);
      } else {
        clear(color, text);
      }
    };
  });

  app.controller('statusCtrl', function($scope) {
    $scope.state = state;
  });

  app.directive('statusLabel', function() {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/status/status-label.html'),
      controller: 'statusCtrl',
    };
  });

  // Sets the current status.
  var set = function(color, text) {
    state.color = color;
    state.text = text;
    state.cleared = false;
  };

  // Clears the current status if it has the provided color and text.
  var clear = function(color, text) {
    if (color == state.color && text == state.text) {
      state.cleared = true;
    }
  };

  // Module state.
  var state = {
    cleared: true,
    color: 'success',
    text: '',
  };

  return {
    set: set,
    clear: clear,
  };
});
