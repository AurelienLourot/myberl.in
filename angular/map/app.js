'use strict';

(function() {
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
          var googleMap = new GoogleMap(scope.id);

          $http.get(GoogleMap.markerDescriptors).success(function(data) {
            var deregisterWatch = scope.$watch(tagsModuleIsReady, function(ready) {
              if (ready) {
                deregisterWatch();

                for (var i = 0; i < data.length; ++i) {
                  googleMap.addMarker(new GoogleMap.Marker(data[i], getTagDescriptorByKey,
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

          dbg_click_each_marker = function() {
            googleMap.dbg_click_each_marker();
          };
          dbg_remove_all_markers = function() {
            googleMap.clearMarkers();
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

  var GoogleMap = (function() {
    // Creates a google map with no marker (yet).
    // elemId: already existing element id where to draw the google map.
    var GoogleMap = function(elemId) {

      // Adds a marker to the map. Will be hidden by default.
      // marker: instance of Marker.
      this.addMarker = function(marker) {
        markers.push(marker);
      };

      // Removes all markers.
      this.clearMarkers = function() {
        while (markers.length) {
          markers.pop().setVisibleOnMap(null);
        }
      }

      // Shows or hides the map's markers, depending whether they are matching the current filters
      // or not. Triggers label decluttering as a side effect.
      // areMatching: function that takes a list of tag keys and returns true if the provided tags
      //              match the current filters.
      this.showHideMarkers = function(areMatching) {
        for (var i = 0; i < markers.length; ++i) {
          var marker = markers[i];
          marker.setVisibleOnMap(areMatching(marker.tagKeys) ? map : null);
        }
        declutter();
      };

      this.dbg_click_each_marker = function() {
        var startIndex = 0;
        for (var i = startIndex; i < markers.length; ++i) {
          (function(index) {
            var marker = markers[index];
            setTimeout(function() {
              marker.dbg_listener();
            }, 5000 + (index - startIndex) * 2500);
          })(i);
        }
      };

      this.dbg_check_markers_are_visible = function() {
        for (var i = 0; i < markers.length; ++i) {
          if (markers[i].isVisible()) {
            return;
          }
        }
        console.error('No marker visible.');
      };

      // Shows/Hides marker labels.
      var declutter = function() {
        if (dbg_no_declutter) {
          return;
        }

        var projection = projectionFactory.getProjection();
        if (!projection) {
          return; // initialization isn't done yet
        }

        for (var i = 0; i < markers.length; ++i) {
          var marker = markers[i];
          marker.declutterDone = false;
          marker.positionPoint = projection.fromLatLngToContainerPixel(marker.getPosition());
        }

        var tolerance = 20; // px

        // Note that by iterating in that direction, latest markers have more chance to get a
        // visible label:
        outer:
        for (var i = 0; i < markers.length; ++i) {
          var markerBeingEvaluated = markers[i];

          for (var j = 0; j < markers.length; ++j) {
            var markerNotToHide = markers[j];
            if (markerBeingEvaluated === markerNotToHide ||
                !markerBeingEvaluated.isVisible() ||
                !markerNotToHide.isVisible() ||
                markerNotToHide.declutterDone && !markerNotToHide.isLabelVisible()) {
              continue;
            }

            var dX = markerNotToHide.positionPoint.x - markerBeingEvaluated.positionPoint.x;
            var dY = markerNotToHide.positionPoint.y - markerBeingEvaluated.positionPoint.y;
            if (Math.abs(dX) < tolerance &&
                Math.abs(dY) < tolerance) {
              markerBeingEvaluated.setLabelVisible(false);
              markerBeingEvaluated.declutterDone = true;
              continue outer;
            }
          }

          markerBeingEvaluated.setLabelVisible(true);
          markerBeingEvaluated.declutterDone = true;
        }
      };

      // Private members:
      var map = new google.maps.Map(document.getElementById(elemId), {
        center: berlinTvTower,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });
      map.addListener('zoom_changed', declutter);

      var projectionFactory = new google.maps.OverlayView();
      projectionFactory.draw = function(){};
      projectionFactory.onAdd = declutter;
      projectionFactory.setMap(map);

      var markers = [];

      // Public members:
      this.gPlaces = new google.maps.places.PlacesService(map);
    };

    var berlinTvTower = {
      lat: 52.520815,
      lng: 13.409419,
    };

    return GoogleMap;
  })();

  GoogleMap.Marker = (function() {
    // Creates a map marker.
    // descriptor: descriptor for this marker, following markerDescriptors' layout.
    // gPlaces: instance of google.maps.places.PlacesService .
    // getTagDescriptorByKey: a function taking a tag key as argument and returning the
    //                        corresponding tag descriptor.
    // filtersId: filter panel's id.
    var Marker = function(descriptor, getTagDescriptorByKey, gPlaces, filtersId) {

      // Shows or hides the marker.
      // map: instance of google.maps.Map or null.
      this.setVisibleOnMap = function(map) {
        if (!map) { // hiding
          // Looks like info windows of hidden markers can't get closed, so we don't take the risk:
          closeAnyOpenInfoWindow();
        }

        if (googleMarker.map != map) {
          googleMarker.setMap(map);
        }
      }

      this.isVisible = function() {
        return !!googleMarker.map;
      };

      // Shows or hides the marker label.
      // visibility: boolean.
      this.setLabelVisible = function(visibility) {
        // set() triggers a refresh, while just setting the property doesn't, see MarkerWithLabel's
        // implementation:
        googleMarker.set('labelVisible', visibility);
      }

      // Note that even if returns true, label can still be invisible in reality in case the marker
      // itself isn't visible.
      this.isLabelVisible = function() {
        return googleMarker.labelVisible;
      }

      this.getPosition = function() {
        return googleMarker.getPosition();
      }

      // Public members:
      this.tagKeys = descriptor.tags;
      this.dbg_listener;
      this.dbg_descriptor = descriptor;

      // Private methods:
      var addInfoWindow = function() {

        var IGNORE_ERRORS = "ignore";

        var openInfoWindow = function(gPlace, status) {
          closeAnyOpenInfoWindow();

          var infoContent = '<div><span class="infowindow-title">' + descriptor.title + '</span>';
          if (descriptor.comment) {
            infoContent += '<span class="infowindow-comment"> // ' + descriptor.comment + '</span>';
          }
          infoContent += '</div>';

          if (status != google.maps.places.PlacesServiceStatus.OK || !gPlace) {
            if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              console.error("API rate limit hit.");
            } else if (status != IGNORE_ERRORS) {
              console.error('Place "' + descriptor.title + '"\'s details not found.');
            }
          } else {
            var location = gPlace.geometry.location;
            checkDistance({
              lat: location.lat(),
              lng: location.lng(),
            });

            if (gPlace.permanently_closed) {
              infoContent += '<div class="infowindow-closed">Permanently closed.</div>';
            } else if (gPlace.opening_hours) {
              if (gPlace.opening_hours.open_now) {
                infoContent += '<div class="infowindow-open">Open now.</div>';
              } else {
                infoContent += '<div class="infowindow-closed">Closed now.</div>';
              }
            }
            if (gPlace.website) {
              infoContent += '<a class="infowindow-website" target="_blank" href="'
                + gPlace.website + '">' + gPlace.website + '</a>';
            }
            if (gPlace.formatted_address) {
              infoContent += '<div class="infowindow-address">' + gPlace.formatted_address
                + '</div>';
            }
          }

          for (var i = 0; i < that.tagKeys.length; ++i) {
            infoContent += '<a class="infowindow-tag" href="javascript: $(\'#' + filtersId
              + '\').popup(\'show\');">#' + that.tagKeys[i] + '</a> ';
          }

          var infoWindow = new google.maps.InfoWindow({
            content: infoContent,
          });
          infoWindow.open(googleMarker.map, googleMarker);
          currentlyOpenInfoWindow = infoWindow;
        }

        var listener = that.dbg_listener = function() {
          gPlaces.nearbySearch({
            location: descriptor.position,
            radius: tolerance,
            keyword: descriptor.title,
          }, function(results, status) {
            var googlePlaceId;
            if (status != google.maps.places.PlacesServiceStatus.OK || !results.length) {
              if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                console.error("API rate limit hit.");
              }
              if (!descriptor.place_id) {
                if (!descriptor.ignore_errors) {
                  console.error('Place "' + descriptor.title + '" not found.');
                }
              } else {
                // Gotten from
                // https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder :
                googlePlaceId = descriptor.place_id; // fallback to hard-coded place ID if not found
              }
            } else {
              if (results.length > 1 && !descriptor.place_id) {
                console.error('Place "' + descriptor.title + '" found ' + results.length
                              + ' times:');
                for (var i in results) {
                  console.log(results[i]);
                }
              }
              if (descriptor.place_id) {
                if (!descriptor.ignore_errors && descriptor.place_id != results[0].place_id) {
                  console.error('Place "' + descriptor.title + '" has id ' + results[0].place_id);
                }
                googlePlaceId = descriptor.place_id;
              } else {
                googlePlaceId = results[0].place_id;
              }

              var location = results[0].geometry.location;
              checkDistance({
                lat: location.lat(),
                lng: location.lng(),
              });
            }

            if (googlePlaceId) {
              // console.log(descriptor.title + ' has id ' + googlePlaceId);
              gPlaces.getDetails({
                placeId: googlePlaceId,
              }, openInfoWindow);
            } else {
              openInfoWindow(null, descriptor.ignore_errors ? IGNORE_ERRORS : null);
            }
          });
        };
        googleMarker.addListener('click', listener);

        var checkDistance = function(receivedPosition) {
          var distance = distanceFrom(receivedPosition);
          if (distance > tolerance) {
            console.error('Place "' + descriptor.title + '" is ' + distance + 'm away, at ('
                          + receivedPosition.lat + ', ' + receivedPosition.lng + ').');
          }
        }
      };

      // Returns the distance in meters between this marker and the provided position.
      var distanceFrom = function(position) {
        // See https://en.wikipedia.org/wiki/Haversine_formula

        var earthRadius = 6371000;

        var lat1 = descriptor.position.lat * Math.PI / 180;
        var lng1 = descriptor.position.lng * Math.PI / 180;
        var lat2 = position.lat * Math.PI / 180;
        var lng2 = position.lng * Math.PI / 180;

        var sinMeanLat = Math.sin((lat2 - lat1) / 2);
        var sinMeanLng = Math.sin((lng2 - lng1) / 2);

        var result = 2 * earthRadius * Math.asin(Math.sqrt(
          sinMeanLat * sinMeanLat + Math.cos(lng1) * Math.cos(lng2) * sinMeanLng * sinMeanLng));
        return result;
      }

      // Private members:
      var that = this;
      var googleMarker = (function() {
        var gMarkerOpts = {};
        gMarkerOpts.position = descriptor.position;
        gMarkerOpts.labelContent = descriptor.title;
        gMarkerOpts.labelAnchor = new google.maps.Point(-8,  // 8px to the right
                                                        -8); // 8px to the bottom
        gMarkerOpts.labelClass = 'map-label';
        gMarkerOpts.icon = googleIcon(that.tagKeys, getTagDescriptorByKey);
        return new MarkerWithLabel(gMarkerOpts);
      })();

      addInfoWindow();
    };

    // Returns the best possible icon object to be inserted in the google marker options, based on
    // its provided tags and an heuristic.
    // getTagDescriptorByKey: a function taking a tag key as argument and returning the
    //                        corresponding tag descriptor.
    var googleIcon = function(tagKeys, getTagDescriptorByKey) {
      // The idea of this heuristic is that the first tag describes the marker better than the
      // last one.

      // Iterate from the least to the most important tag:
      var url = null;
      var color = null;
      for (var key = tagKeys.length - 1; key >= 0; --key) {
        var descriptor = getTagDescriptorByKey(tagKeys[key]);
        // If the descriptor has an icon, overtake it:
        if (descriptor.icon) {
          url = descriptor.icon;
        }
        // If the descriptor has a color, overtake it:
        if (descriptor.color) {
          color = descriptor.color;
        }
      }

      if (!url) {
        return null;
      }
      var result = {
        url: url,
        anchor: new google.maps.Point(10, 10),
      };
      if (color) {
        result.url += '&filter=ff' + color;
      }
      return result;
    };

    var closeAnyOpenInfoWindow = function() {
      if (currentlyOpenInfoWindow) {
        currentlyOpenInfoWindow.close();
        currentlyOpenInfoWindow = null;
      }
    }

    // Private static members:
    var tolerance = 80; // meters
    var currentlyOpenInfoWindow;

    return Marker;
  })();

  // File containing all the marker descriptors:
  GoogleMap.markerDescriptors = 'angular/map/markers.json';
})();

var dbg_click_each_marker;
var dbg_remove_all_markers;
var dbg_no_declutter = false;
