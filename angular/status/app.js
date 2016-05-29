'use strict';

define(function() {
  var app = angular.module('status', []);

  app.controller('statusCtrl', function($scope) {
    $scope.state = state;
    scopes.push($scope);
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
    // Update state...
    state.color = color;
    state.text = text;
    state.cleared = false;

    // ... and let angular see it:
    for (var i = 0; i < scopes.length; ++i) {
      var scope = scopes[i];
      scope.$apply(scope.state.cleared = false);
    }
  };

  // Clears the current status if it has the provided color and text.
  var clear = function(color, text) {
    if (color == state.color && text == state.text) {
      // Update state...
      state.cleared = true;

      // ... and let angular see it:
      for (var i = 0; i < scopes.length; ++i) {
        var scope = scopes[i];
        scope.$apply(scope.state.cleared = true);
      }
    }
  };

  // Module state and scopes.
  var state = {
    cleared: true,
    color: 'success',
    text: '',
  };
  var scopes = [];

  return {
    set: set,
    clear: clear,
  };
});
