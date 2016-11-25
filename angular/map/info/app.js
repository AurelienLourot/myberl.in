'use strict';

define(['angular/tags/app', 'angular/map/device'], function(tags, device) {
  var app = angular.module('info', ['tags']);

  device.addListener(handleSlowDevice);

  // Service for adding markers to the list of known markers.
  app.factory('addMarkersToList', ['$timeout', function($timeout) {
    // markers: dict of googlemap.Marker.
    return function(markers) {
      // For time measurement:
      var numCalls = 0;
      var totalProcessingTimeMs = 0;
      var lastCallTimeMs = null;

      state.pendingMarkers = $.extend(state.pendingMarkers, markers);
      state.isMarkerListComplete = false;
      processPendingMarkers();

      // We defer for ng-repeat performance reasons:
      function processPendingMarkers() {
        measurePerformance();
        if (device.isSlow()) {
          return;
        }

        $timeout(function() {
          var firstMarker = Object.keys(state.pendingMarkers)[0];
          if (firstMarker) {
            state.markers[firstMarker] = state.pendingMarkers[firstMarker];
            delete state.pendingMarkers[firstMarker];
            processPendingMarkers();
          } else {
            if (numCalls) {
              var meanProcessingTimeMs = totalProcessingTimeMs / numCalls;
              console.log("Marker list's mean processing time: " + meanProcessingTimeMs + 'ms.');
            }
            state.isMarkerListComplete = true;
          }
        });

        function measurePerformance() {
          var now = nowMs();
          if (lastCallTimeMs) {
            ++numCalls;
            totalProcessingTimeMs += now - lastCallTimeMs;
          }
          lastCallTimeMs = now;
          if (numCalls > 30) { // enough data to analyse performance
            var meanProcessingTimeMs = totalProcessingTimeMs / numCalls;
            if (meanProcessingTimeMs > 300) {
              console.log('Device is slow. It needs ' + meanProcessingTimeMs + 'ms to add a marker'
                          + ' to the list.');
              device.setSlow();
            }
          }
        }
      }
    };
  }]);

  // Service for setting the current marker to display.
  app.factory('setCurrentMarker', function() {
    // marker: instance of googlemap.Marker.
    return function(marker) {
      if (!state.currentMarker || state.currentMarker.id != marker.id) {
        state.currentMarker = marker;
        state.markersShowingAllTags = [];

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

    controller.getOpeningHours = function getOpeningHours() {
      return state.currentMarker && state.currentMarker.getOpeningHours();
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

    controller.showsAllTags = function showsAllTags() {
      return !!state.currentMarker
        && !!~state.markersShowingAllTags.indexOf(state.currentMarker.id);
    };

    controller.isTagVisible = function isTagVisible(tagKey) {
      if (controller.showsAllTags()) {
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
      link: function(scope, elm, attrs, ctrl) {
        $('.ui.accordion.info-control').accordion();
      },
    };
  });

  app.controller('listCtrl', ['$scope', function($scope) {
    var controller = this;
    listCtrl(controller, $scope);
  }]);

  app.directive('markerAmount', function() {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/info/marker-amount.html'),
      controller: 'listCtrl',
      controllerAs: 'list',
    };
  });

  app.directive('markerList', ['isSelected', 'select', function(isSelected, select) {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/info/marker-list.html'),
      scope: {
        onMarkerClick: '@', // e.g. 'javascript: myFunction();'
      },
      controller: ['$scope', function($scope) {
        var controller = this;
        listCtrl(controller, $scope);
        $scope.isSelected = isSelected;
        $scope.select = select;
        $scope.tagCssClass = tagCssClass;

        function tagCssClass(tagKey) {
          return isSelected(tagKey) ? '' : 'btn-marker-list-tag-unselected';
        }
      }],
      controllerAs: 'list',
    };
  }]);

  // Module state and scopes.
  var state = {
    markers: {},
    pendingMarkers: {}, // to be added to `markers` deferred
    markersShowingAllTags : [], // marker IDs for which we want to show all tags
  };
  var scopes = [];

  function listCtrl(controller, $scope) {
    $scope.state = state;
    scopes.push($scope);

    controller.getAmount = function getAmount() {
      return state.markers ? Object.keys(state.markers).length : 0;
    };

    controller.onMarkerClick = function onMarkerClick(marker) {
      marker.panTo();
      eval($scope.onMarkerClick);
    };

    controller.showsAllTags = function showsAllTags(marker) {
      return !!~state.markersShowingAllTags.indexOf(marker.id);
    };
  }

  function handleSlowDevice() {
    state.markers = {};
    state.pendingMarkers = {};
  }
});
