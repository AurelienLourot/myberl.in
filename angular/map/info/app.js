'use strict';

define(['angular/tags/app'], function(tags) {
  var app = angular.module('info', ['tags']);

  // Service for setting the current marker to display.
  app.factory('setCurrentMarker', function() {
    // m: instance of googlemap.Marker.
    return function(m) {
      if (m != state.marker) {
        state.marker = m;
        state.showAllTags = false;

        // This service can be called outside of an angular turn, e.g. from a Google Maps marker
        // click listener, so we need to let angular refresh the view:
        for (var i = 0; i < scopes.length; ++i) {
          var scope = scopes[i];
          scope.$apply(scope.state.marker = state.marker);
        }
      }
    };
  });

  app.controller('infoCtrl', ['$scope', 'getTagDescriptorByKey', function($scope,
                                                                          getTagDescriptorByKey) {
    $scope.state = state;
    scopes.push($scope);

    var controller = this;

    controller.getOpennessClass = function getOpennessClass() {
      return state.marker && state.marker.getOpenness() == 'OPEN_NOW' && 'open' || 'closed';
    };

    controller.getHumanReadableOpenness = function getHumanReadableOpenness() {
      var openness = state.marker && state.marker.getOpenness() || '';
      switch (openness) {
        case 'PERMANENTLY_CLOSED':
          return 'Permanently closed';
        case 'CLOSED_NOW':
          return 'Closed now';
        case 'OPEN_NOW':
          return 'Open now';
      }
      return openness;
    };

    controller.isTagVisible = function isTagVisible(tagKey) {
      if (state.showAllTags) {
        return true;
      }

      var tagDescriptor = getTagDescriptorByKey(tagKey);
      if (!tagDescriptor) {
        console.error("Marker '" + state.marker.getTitle() + "' has an undeclared tag '" + tagKey
                      + "'.");
        return false;
      }
      return tagDescriptor.descriptive;
    };

    controller.onTagClick = function onTagClick() {
      eval($scope.onTagClick);
    };
  }]);

  app.directive('markerInfo', function() {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/info/marker-info.html'),
      scope: {
        onTagClick: '@', // e.g. 'javascript: myFunction();'
      },
      controller: 'infoCtrl',
      controllerAs: 'info',
    };
  });

  // Module state and scopes.
  var state = {};
  var scopes = [];
});
