'use strict';

define(['angular/map/googlemap', 'angular/tags/app'], function(googlemap, tags) {
  var app = angular.module('map', ['tags']);

  app.directive('map', ['tagsModuleIsReady', 'getTagDescriptorByKey', 'addListener', 'areMatching',
                        '$http', '$timeout', function(tagsModuleIsReady, getTagDescriptorByKey,
                                                      addListener, areMatching, $http, $timeout) {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/map.html'),
      scope: {
        filtersId: '@', // filter panel's id
      },
      controller: ['$scope', function($scope) {
        $scope.id = 'map-' + uid();
      }],
      controllerAs: 'map',
      link: function(scope, elm, attrs, ctrl) {
        $timeout(function () { // after browser rendering
          var googleMap = new googlemap.Map(scope.id);

          var addMarkersToMap = function(resolve, reject) {
            console.log('Loading markers...');
            $http.get(googlemap.markerDescriptors).success(function(data) {
              console.log('Markers found.');

              var deregisterWatch = scope.$watch(tagsModuleIsReady, function(ready) {
                if (ready) {
                  deregisterWatch();

                  for (var i = 0; i < data.length; ++i) {
                    googleMap.addMarker(new googlemap.Marker(data[i], getTagDescriptorByKey,
                                                             googleMap.gPlaces, scope.filtersId));
                  }

                  var showHideMarkers = function() {
                    googleMap.showHideMarkers(areMatching);
                  }
                  addListener(showHideMarkers);
                  showHideMarkers();
                  googleMap.dbg_check_markers_are_visible();

                  console.log('Markers added to ' + scope.id + '.');
                  resolve();
                }
              });
            });
          };

          var waitForMapReady = function(resolve, reject) {
            googleMap.addListener(function() {
              resolve();
            });
          }

          var callListeners = function() {
            for (var i in listeners) {
              listeners[i](scope.id);
            }
          }

          Promise.all([new Promise(addMarkersToMap),
                       new Promise(waitForMapReady)]).then(callListeners);

          dbg.click_each_visible_marker = function() {
            googleMap.dbg_click_each_visible_marker();
          };
          dbg.remove_all_markers = function() {
            googleMap.clearMarkers();
          };
          dbg.disable_decluttering = function() {
            googleMap.dbg_declutteringEngine.stop();
          };
        });
      },
    };
  }]);

  // Adds a listener on module readiness.
  // Listeners will get a map ID as argument.
  var addListener = function(listener) {
    listeners.push(listener);
  };

  var uid = function() {
    var length = 12;
    return (Array(length + 1).join("0")
            + Math.random().toString(36).substr(2, length)).slice(-length);
  }

  // Listeners on module readiness.
  var listeners = [];

  var dbg = {};
  return {
    addListener: addListener,
    dbg: dbg,
  };
});
