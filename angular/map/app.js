'use strict';

define(['angular/map/googlemap', 'angular/map/connector-mymaps', 'angular/tags/app',
        'angular/status/app'], function(googlemap, mymaps, tags, status) {
  var app = angular.module('map', ['tags', 'status']);

  app.directive('map', ['tagsModuleIsReady', 'getTagDescriptorByKey', 'addListener', 'areMatching',
                        'setStatus', '$http', '$timeout',
                        function(tagsModuleIsReady, getTagDescriptorByKey, addListener, areMatching,
                                 setStatus, $http, $timeout) {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/map.html'),
      scope: {
        onTagClick: '@', // e.g. 'javascript: myFunction();'
      },
      controller: ['$scope', function($scope) {
        $scope.id = 'map-' + uid();
      }],
      controllerAs: 'map',
      link: function(scope, elm, attrs, ctrl) {
        $timeout(function () { // after browser rendering
          var googleMap = new googlemap.Map(scope.id, setStatus);

          var addMarkersToMap = new Promise(function addJsonMarkers(resolve, reject) {
            console.log('Loading markers...');
            $http.get(googlemap.markerDescriptors).success(function(descriptors) {
              console.log(descriptors.length + ' JSON markers found.');
              resolve(descriptors);
            });
          }).then(function addMyMapsMarkers(descriptors) {
            var getters = [];
            for (var i = 0; i < googlemap.externalGoogleMyMaps.length; ++i) {
              var myMap = googlemap.externalGoogleMyMaps[i];
              (function(myMapCopy) {
                getters.push(new Promise(function(resolve, reject) {
                  new mymaps.Connector(myMapCopy.id, myMapCopy.tags, $http,
                                       function(myMapsDescriptors) {
                    console.log(myMapsDescriptors.length + ' MyMaps markers found in '
                                + myMapCopy.name + '.');
                    descriptors = descriptors.concat(myMapsDescriptors);
                    resolve();
                  });
                }));
              })(myMap);
            }
            return Promise.all(getters).then(function() {
              return descriptors;
            });
          }).then(function waitForTagsModuleReady(descriptors) {
            return new Promise(function(resolve, reject) {
              if (tagsModuleIsReady()) {
                resolve(descriptors);
              } else {
                var deregisterWatch = scope.$watch(tagsModuleIsReady, function(ready) {
                  if (ready) {
                    deregisterWatch();
                    resolve(descriptors);
                  }
                });
              }
            });
          }).then(function doAddMarkersToMap(descriptors) {
            return new Promise(function(resolve, reject) {
              for (var i = 0; i < descriptors.length; ++i) {
                googleMap.addMarker(new googlemap.Marker(
                  descriptors[i], getTagDescriptorByKey, googleMap.gPlaces, scope.onTagClick));
              }

              var showHideMarkers = function() {
                googleMap.showHideMarkers(areMatching);
              }
              addListener(showHideMarkers);
              showHideMarkers();

              console.log('Markers added to ' + scope.id + '.');
              resolve();
            });
          });

          var waitForMapReady = new Promise(function(resolve, reject) {
            googleMap.addListener(function() {
              resolve();
            });
          });

          var callListeners = function() {
            for (var i in listeners) {
              listeners[i](scope.id);
            }
          }

          Promise.all([addMarkersToMap, waitForMapReady]).then(callListeners);

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
