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

          var addMarkersToMap = function(resolve, reject) {
            console.log('Loading markers...');
            $http.get(googlemap.markerDescriptors).success(function(data) {
              console.log(data.length + ' JSON markers found.');
              new mymaps.Connector(googlemap.lakeMap.id, googlemap.lakeMap.tags, $http,
                                   function(myMapsData) {
                console.log(myMapsData.length + ' MyMaps markers found.');

                data = data.concat(myMapsData);

                var deregisterWatch = scope.$watch(tagsModuleIsReady, function(ready) {
                  if (ready) {
                    deregisterWatch();

                    for (var i = 0; i < data.length; ++i) {
                      googleMap.addMarker(new googlemap.Marker(data[i], getTagDescriptorByKey,
                                                               googleMap.gPlaces, scope.onTagClick));
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
