'use strict';

define(['angular/map/googlemap', 'angular/map/connector-mymaps', 'angular/map/info/app',
        'angular/tags/app', 'angular/status/app'],
       function(googlemap, mymaps, info, tags, status) {
  var app = angular.module('map', ['info', 'tags', 'status']);

  app.directive(
    'map', ['tagsModuleIsReady', 'getTagDescriptorByKey', 'addListener', 'areMatching',
            'setMarkers', 'setCurrentMarker', 'setStatus', '$http', '$timeout', '$interval',
            function(tagsModuleIsReady, getTagDescriptorByKey, addListener, areMatching,
                     setMarkers, setCurrentMarker, setStatus, $http, $timeout, $interval) {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/map/map.html'),
      scope: {
        onMarkerClick: '@', // e.g. 'javascript: myFunction();'
      },
      controller: ['$scope', function($scope) {
        $scope.id = 'map-' + uid();
      }],
      controllerAs: 'map',
      link: function(scope, elm, attrs, ctrl) {
        $timeout(function () { // after browser rendering
          var googleMap = new googlemap.Map(scope.id, setStatus, $timeout, $interval);

          var addJsonMarkersToMap = new Promise(function getJsonMarkers(resolve, reject) {
            console.log('Loading markers...');
            $http.get(googlemap.markerDescriptors).success(function(descriptors) {
              console.log(descriptors.length + ' JSON markers found.');
              resolve(descriptors);
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
          }).then(function addJsonMarkersToMapAndListenToFilterChanges(descriptors) {
            addMarkersToMap(descriptors);
            setMarkers(googleMap.getMarkers());
            addListener(showHideMarkers);
          });

          var addMyMapsMarkersToMap = function() {
            var myMapsDescriptors = [];
            var getters = [];
            for (var i = 0; i < googlemap.externalGoogleMyMaps.length; ++i) {
              var myMap = googlemap.externalGoogleMyMaps[i];
              (function(myMapCopy) {
                getters.push(new Promise(function(resolve, reject) {
                  new mymaps.Connector(myMapCopy.id, myMapCopy.tags, $http, function(descriptors) {
                    console.log(descriptors.length + ' MyMaps markers found in '
                                + myMapCopy.name + '.');
                    myMapsDescriptors = myMapsDescriptors.concat(descriptors);
                    resolve();
                  });
                }));
              })(myMap);
            }
            return Promise.all(getters).then(function() {
              addMarkersToMap(myMapsDescriptors);
              console.log('[extReady] External maps loaded.');
            });
          };

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

          Promise.all([addJsonMarkersToMap, waitForMapReady]).then(callListeners)
            .then(addMyMapsMarkersToMap);

          function addMarkersToMap(descriptors) {
            for (var i = 0; i < descriptors.length; ++i) {
              googleMap.addMarker(new googlemap.Marker(
                descriptors[i], getTagDescriptorByKey, googleMap.gPlaces, onMarkerClick));
            }
            showHideMarkers();
            console.log(descriptors.length + ' markers added to ' + scope.id + '.');

            // marker: instance of googlemap.Marker.
            function onMarkerClick(marker) {
              setCurrentMarker(marker.id);
              eval(scope.onMarkerClick);
            }
          }

          function showHideMarkers() {
            googleMap.showHideMarkers(areMatching);
          }

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
