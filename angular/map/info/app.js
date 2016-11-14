'use strict';

define(['angular/tags/app'], function(tags) {
  var app = angular.module('info', ['tags']);

  // Service for setting the list of known markers.
  app.factory('setMarkers', function() {
    // markers: dict of googlemap.Marker.
    return function(markers) {
      state.markers = markers;

      // This service can be called outside of an angular turn, e.g. from a promise, so we need to
      // let angular refresh the view:
      for (var i = 0; i < scopes.length; ++i) {
        var scope = scopes[i];
        scope.$apply(scope.state.markers = state.markers);
      }
    };
  });

  // Service for setting the current marker to display.
  app.factory('setCurrentMarker', function() {
    // marker: marker ID as string (key of state.markers).
    return function(marker) {
      if (marker != state.currentMarker) {
        state.currentMarker = marker;
        state.showAllTags = false;

        // This service can be called outside of an angular turn, e.g. from a Google Maps marker
        // click listener, so we need to let angular refresh the view:
        for (var i = 0; i < scopes.length; ++i) {
          var scope = scopes[i];
          scope.$apply(scope.state.currentMarker = state.currentMarker);
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
      return state.markers && state.currentMarker
        && state.markers[state.currentMarker].getOpenness() == 'OPEN_NOW' && 'open' || 'closed';
    };

    controller.getHumanReadableOpenness = function getHumanReadableOpenness() {
      var openness = state.markers && state.currentMarker
        && state.markers[state.currentMarker].getOpenness() || '';
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

    controller.getWebsiteIcon = function getWebsiteIcon() {
      var website = state.markers && state.currentMarker
        && state.markers[state.currentMarker].getWebsite() || '';
      return ~website.indexOf('facebook') ? 'facebook-square'
           : ~website.indexOf('foursquare') ? 'foursquare'
           : ~website.indexOf('plus.google') ? 'google-plus'
           : ~website.indexOf('instagram') ? 'instagram'
           : ~website.indexOf('tripadvisor') ? 'tripadvisor'
           : ~website.indexOf('twitter') ? 'twitter'
           : ~website.indexOf('yelp') ? 'yelp'
           : 'globe';
    }

    controller.isTagVisible = function isTagVisible(tagKey) {
      if (state.showAllTags) {
        return true;
      }

      var tagDescriptor = getTagDescriptorByKey(tagKey);
      if (!tagDescriptor) {
        console.error("Marker '" + state.markers[state.currentMarker].getTitle()
                      + "' has an undeclared tag '" + tagKey + "'.");
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

  app.controller('listCtrl', ['$scope', function($scope) {
    $scope.state = state;
    scopes.push($scope);

    var controller = this;

    controller.getAmount = function getAmount() {
      return state.markers ? Object.keys(state.markers).length : 0;
    };

    controller.onMarkerClick = function onMarkerClick(marker) {
    };
  }]);

  app.directive('markerAmount', function() {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/info/marker-amount.html'),
      controller: 'listCtrl',
      controllerAs: 'list',
    };
  });

  app.directive('markerList', function() {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/info/marker-list.html'),
      controller: 'listCtrl',
      controllerAs: 'list',
    };
  });

  // Module state and scopes.
  var state = {};
  var scopes = [];
});
