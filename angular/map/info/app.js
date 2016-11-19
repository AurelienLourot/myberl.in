'use strict';

define(['angular/tags/app'], function(tags) {
  var app = angular.module('info', ['tags']);

  // Service for adding markers to the list of known markers.
  app.factory('addMarkersToList', ['$timeout', function($timeout) {
    // markers: dict of googlemap.Marker.
    return function(markers) {
      state.pendingMarkers = $.extend(state.pendingMarkers, markers);
      state.isMarkerListComplete = false;
      processPendingMarkers();

      // We defer for ng-repeat performance reasons:
      function processPendingMarkers() {
        $timeout(function() {
          var firstMarker = Object.keys(state.pendingMarkers)[0];
          if (firstMarker) {
            state.markers[firstMarker] = state.pendingMarkers[firstMarker];
            delete state.pendingMarkers[firstMarker];
            processPendingMarkers();
          } else {
            state.isMarkerListComplete = true;
          }
        });
      }
    };
  }]);

  // Service for setting the current marker to display.
  app.factory('setCurrentMarker', function() {
    // marker: instance of googlemap.Marker.
    return function(marker) {
      if (!state.currentMarker || state.currentMarker.id != marker.id) {
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
      return state.currentMarker
        && state.currentMarker.getOpenness() == 'OPEN_NOW' && 'open' || 'closed';
    };

    controller.getHumanReadableOpenness = function getHumanReadableOpenness() {
      var openness = state.currentMarker && state.currentMarker.getOpenness() || '';
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
      var website = state.currentMarker && state.currentMarker.getWebsite() || '';
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
        console.error("Marker '" + state.currentMarker.getTitle() + "' has an undeclared tag '"
                      + tagKey + "'.");
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
      marker.panTo();
      eval($scope.onMarkerClick);
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
      scope: {
        onMarkerClick: '@', // e.g. 'javascript: myFunction();'
      },
      controller: 'listCtrl',
      controllerAs: 'list',
    };
  });

  // Module state and scopes.
  var state = {
    markers: {},
    pendingMarkers: {}, // to be added to `markers` deferred
  };
  var scopes = [];
});
