'use strict';

define(['angular/map/googlemap', 'angular/tags/app'], function(googlemap, tags) {
  var app = angular.module('map', ['tags']);

  app.directive('map', ['tagsModuleIsReady', 'getTagDescriptorByKey', 'addListener', 'areMatching',
                        '$http', '$timeout', function(tagsModuleIsReady, getTagDescriptorByKey,
                                                      addListener, areMatching, $http, $timeout) {
    return {
      restrict: 'E',
      templateUrl: 'angular/map/map.html',
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

          $http.get(googlemap.markerDescriptors).success(function(data) {
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
              }
            });
          });

          dbg.click_each_marker = function() {
            googleMap.dbg_click_each_marker();
          };
          dbg.remove_all_markers = function() {
            googleMap.clearMarkers();
          };
          dbg.disable_decluttering = function() {
            googleMap.dbg_no_declutter = true;
          };
        });
      },
    };
  }]);

  var uid = function() {
    var length = 12;
    return (Array(length + 1).join("0")
            + Math.random().toString(36).substr(2, length)).slice(-length);
  }

  var dbg = {};
  return {
    dbg: dbg,
  };
});
