'use strict';

define(['angular/map/declutterer', 'angular/map/device'], function(declutterer, device) {
  var Map = (function() {
    // Creates a google map with no marker (yet).
    // elemId: already existing element id where to draw the google map.
    // $timeout: angular $timeout service.
    // $interval: angular $interval service.
    function Map(elemId, $timeout, $interval) {

      // Adds a marker to the map. Will be hidden by default.
      // marker: instance of Marker.
      this.addMarker = function addMarker(marker) {
        while (marker.id in markers) {
          console.log('"' + marker.id + '" already exists.');
          var distance = markers[marker.id].distanceFrom(marker.getPosition());
          console.log('Distance between them: ' + Math.floor(distance) + 'm');

          if (distance < 100) {
            console.error('Duplicate marker, skipping.');
            return;
          }
          marker.id += '_';
          console.log('Renaming into "' + marker.id + '".');
        }
        markers[marker.id] = marker;
      };

      // Apply the provided patches to the markers.
      this.applyPatches = function applyPatches(patches) {
        patches(markers);
      };

      this.getMarkers = function getMarkers() {
        return markers;
      };

      // Removes all markers.
      this.clearMarkers = function clearMarkers() {
        for (var id in markers) {
          markers[id].setVisibleOnMap(null);
        }
        markers = {};
      };

      // Shows or hides the map's markers, depending whether they are matching the current filters
      // or not.
      // areMatching: function that takes a list of tag keys and returns true if the provided tags
      //              match the current filters.
      this.showHideMarkers = function showHideMarkers(areMatching) {
        for (var id in markers) {
          var marker = markers[id];
          marker.setVisibleOnMap(areMatching(marker.tagKeys) ? map : null);
        }
      };

      // Adds a listener on instance readiness.
      // Listeners will get `elemId` as argument.
      this.addListener = function addListener(listener) {
        listeners.push(listener);
      };

      this.dbg_click_each_visible_marker = function dbg_click_each_visible_marker() {
        var nextDelay = 5000; // ms
        for (var id in markers) {
          if (!markers[id].isVisible()) {
            continue;
          }

          (function(idCopy) {
            $timeout(function() {
              markers[idCopy].dbg_clickListener();
            }, nextDelay);
          })(id);

          nextDelay += 2800;
        }
      };

      // Private members:
      var that = this;
      console.log('Creating Google Map...');
      var map = google && new google.maps.Map(document.getElementById(elemId), {
        center: berlinTvTower,
        zoom: defaultZoomLevel,
        mapTypeControl: false,
        streetViewControl: false,
      });
      map && map.addListener('tilesloaded', (function() {
        var firstTime = true;
        return function() {
          if (firstTime) {
            console.log(elemId + ' ready.');
            for (var i in listeners) {
              listeners[i](elemId);
            }
          }
          firstTime = false;
        };
      })());

      var projectionFactory = google ? new google.maps.OverlayView() : {};
      projectionFactory.draw = function draw(){};
      projectionFactory.setMap && projectionFactory.setMap(map);

      var currentPositionMarker = GeolocationMarker && new GeolocationMarker(map, { // marker_opts
        zIndex: 600, // above other markers
      }, { // circle_opts
        fillOpacity: 0.0,
      });

      var listeners = []; // listeners on map readiness.
      var markers = {};
      var declutteringEngine
        = new declutterer.Declutterer(map, projectionFactory, markers, currentPositionMarker,
                                      $interval);

      // Public members:
      this.gPlaces = google && new google.maps.places.PlacesService(map);
      this.dbg_declutteringEngine = declutteringEngine;
    };

    // Private constants:
    var berlinTvTower = {
      lat: 52.520815,
      lng: 13.409419,
    };
    var defaultZoomLevel = 12;

    return Map;
  })();

  var Marker = (function() {
    // Creates a map marker.
    // descriptor: descriptor for this marker, following markerDescriptors' layout.
    // gPlaces: instance of google.maps.places.PlacesService .
    // getTagDescriptorByKey: a function taking a tag key as argument and returning the
    //                        corresponding tag descriptor.
    // onMarkerClick: listener to be called when clicking on a marker. Takes an instance of Marker
    //                as argument.
    function Marker(descriptor, getTagDescriptorByKey, gPlaces, onMarkerClick) {

      // Shows or hides the marker.
      // map: instance of google.maps.Map or null.
      this.setVisibleOnMap = function setVisibleOnMap(map) {
        var justCreated = false;
        if (!googleMarker && map) {
          googleMarker = createGoogleMarker();
          justCreated = true;
        }
        if (googleMarker && googleMarker.map != map) {
          googleMarker.setMap(map);
        }
        if (justCreated) {
          // Hide label by default on new markers. The declutterer will make it visible eventually.
          this.setLabelVisible(false);
        }
        if (!map) {
          // Let it be garbage collected:
          googleMarker = null;
        }
      };

      this.isVisible = function isVisible() {
        return !!googleMarker && !!googleMarker.map;
      };

      // Shows or hides the marker label.
      // visibility: boolean.
      this.setLabelVisible = function setLabelVisible(visibility) {
        if (this.isVisible()) {
          // set() triggers a refresh, while just setting the property doesn't, see
          // MarkerWithLabel's implementation.
          if (device.isSlow()) {
            // Prevents opacity transition and uses less memory when visibility is false:
            googleMarker.set('labelVisible', visibility);
          }
          googleMarker.set('labelStyle', {
            opacity: visibility ? 1 : 0,
            'pointer-events': visibility ? 'auto' : 'none',
          });
        } else {
          console.error("setLabelVisible(" + visibility + "): marker '" + descriptor.title +
                        "' isn't visible, ignored.");
        }
      };

      this.isLabelVisible = function isLabelVisible() {
        return this.isVisible() && googleMarker.labelVisible &&
          googleMarker.get('labelStyle').opacity >= 0.5;
      };

      this.getPosition = function getPosition() {
        if (this.isVisible()) {
          return googleMarker.getPosition();
        }
        return {
          lat: function() {
            return descriptor.position.lat;
          },
          lng: function() {
            return descriptor.position.lng;
          },
        };
      };

      this.panTo = function panTo() {
        if (!this.isVisible()) {
          console.error("panTo(): marker '" + descriptor.title + "' isn't visible, ignored.");
          return;
        }
        googleMarker.map.setZoom(panZoomLevel);
        googleMarker.map.panTo(this.getPosition());
      };

      // Returns the distance in meters between this marker and the provided position.
      this.distanceFrom = function distanceFrom(otherPosition) {
        // See https://en.wikipedia.org/wiki/Haversine_formula

        var earthRadius = 6371000;

        var lat1 = this.getPosition().lat() * Math.PI / 180;
        var lng1 = this.getPosition().lng() * Math.PI / 180;
        var lat2 = otherPosition.lat() * Math.PI / 180;
        var lng2 = otherPosition.lng() * Math.PI / 180;

        var sinMeanLat = Math.sin((lat2 - lat1) / 2);
        var sinMeanLng = Math.sin((lng2 - lng1) / 2);

        var result = 2 * earthRadius * Math.asin(Math.sqrt(
          sinMeanLat * sinMeanLat + Math.cos(lng1) * Math.cos(lng2) * sinMeanLng * sinMeanLng));
        return result;
      };

      this.getTitle = function getTitle() {
        return descriptor.title;
      };

      this.getComment = function getComment() {
        return descriptor.comment;
      };

      this.setComment = function setComment(comment) {
        descriptor.comment = comment;
      };

      this.getOpenness = function getOpenness() {
        return externalInfo.openness || '';
      };

      this.getOpeningHours = function getOpeningHours() {
        return externalInfo.openingHours || [];
      };

      this.getAddress = function getAddress() {
        return externalInfo.address || '';
      };

      this.getWebsite = function getWebsite() {
        if (!descriptor.ignore_errors && descriptor.website && externalInfo.website
            && descriptor.website != externalInfo.website) {
          console.error('[ext] ' + descriptor.title + ' has conflicting websites.');
        }
        return descriptor.website || externalInfo.website || '';
      };

      this.getGMapsUrl = function getGMapsUrl() {
        return externalInfo.gMapsUrl || '';
      };

      // Private methods

      // MarkerWithLabel factory.
      function createGoogleMarker() {
        var gMarkerOpts = {};
        gMarkerOpts.position = descriptor.position;
        gMarkerOpts.labelContent = descriptor.title;
        gMarkerOpts.labelAnchor = new google.maps.Point(-5,  // 5px to the right
                                                        -5); // 5px to the bottom
        gMarkerOpts.labelClass = 'map-label';
        gMarkerOpts.icon = googleIcon(that.tagKeys, getTagDescriptorByKey);

        var result = new MarkerWithLabel(gMarkerOpts);
        result.addListener('click', clickListener);
        return result;
      };

      // Private members:
      var that = this;
      var googleMarker = null;
      var externalInfo = {}; // from Google
      var clickListener = function clickListener() {
        fetchExternalInfo();
        onMarkerClick(that);

        // Populates externalInfo.
        function fetchExternalInfo() {
          gPlaces.nearbySearch({
            location: descriptor.position,
            radius: tolerance,
            keyword: descriptor.title,
          }, function(results, status) {
            var googlePlaceId;
            if (status != google.maps.places.PlacesServiceStatus.OK || !results.length) {
              if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                console.error("[ext] API rate limit hit.");
              }
              if (!descriptor.place_id) {
                if (!descriptor.ignore_errors) {
                  console.error('[ext] Place "' + descriptor.title + '" not found.');
                }
              } else {
                // Gotten from
                // https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder :
                googlePlaceId = descriptor.place_id; // fallback to hard-coded place ID if not found
              }
            } else {
              if (results.length > 1 && !descriptor.place_id) {
                for (var i in results) {
                  var result = results[i];
                  console.log('[ext] ' + result.name + ': ' + result.place_id);
                }
                console.error('[ext] Place "' + descriptor.title + '" found ' + results.length
                              + ' times. See above.');
              }
              if (descriptor.place_id) {
                if (!descriptor.ignore_errors && descriptor.place_id != results[0].place_id) {
                  console.error('[ext] Place "' + descriptor.title + '" has id '
                                + results[0].place_id + '("' + results[0].name + '").');
                }
                googlePlaceId = descriptor.place_id;
              } else {
                googlePlaceId = results[0].place_id;
              }

              var location = results[0].geometry.location;
              checkDistance(results[0].geometry.location);
            }

            if (googlePlaceId) {
              console.log('[ext] ' + descriptor.title + ' has id ' + googlePlaceId);
              gPlaces.getDetails({
                placeId: googlePlaceId,
              }, storeGPlaceDetails);
            } else {
              var log = (descriptor.ignore_errors ? console.log : console.error);
              log('[ext] ' + descriptor.title + ' has no id.');
            }

            function storeGPlaceDetails(gPlace, status) {
              if (status != google.maps.places.PlacesServiceStatus.OK || !gPlace) {
                if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                  console.error('[ext] API rate limit hit.');
                  return;
                }
                var log = (descriptor.ignore_errors ? console.log : console.error);
                log('[ext] Place "' + descriptor.title + '"\'s details not found.');
                return;
              }

              checkDistance(gPlace.geometry.location);

              externalInfo.openness =
                (gPlace.permanently_closed
                 ? 'PERMANENTLY_CLOSED'
                 : (gPlace.opening_hours
                    ? (gPlace.opening_hours.open_now
                       ? 'OPEN_NOW'
                       : 'CLOSED_NOW')
                    : ''));
              externalInfo.openingHours = gPlace.opening_hours && gPlace.opening_hours.weekday_text;
              if (!~externalInfo.openness.indexOf('NOW') && externalInfo.openingHours) {
                console.error(descriptor.title + ' has opening hours but no openness.');
              }

              externalInfo.website = gPlace.website;
              externalInfo.address = gPlace.formatted_address;
              externalInfo.gMapsUrl = gPlace.url;

              console.log('[ext] ' + descriptor.title + "'s external info retrieved from "
                          + gPlace.name + '.');
            };

            function checkDistance(receivedPosition) {
              var distance = that.distanceFrom(receivedPosition);
              if (distance > tolerance) {
                console.error('[ext] Place "' + descriptor.title + '" is ' + distance
                              + 'm away, at (' + receivedPosition.lat() + ', '
                              + receivedPosition.lng() + ').');
              }
            }
          });
        }
      };

      // Public members:
      this.id = descriptor.title.toLowerCase()
        .replace(/[áàâãå]/g, 'a')
        .replace(/[äæ]/g, 'ae')
        .replace(/ç/g, 'c')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'e')
        .replace(/ñ/g, 'n')
        .replace(/[óòôõ]/g, 'o')
        .replace(/[öœ]/g, 'oe')
        .replace(/ß/g, 'ss')
        .replace(/[úùû]/g, 'u')
        .replace(/ü/g, 'ue')
        .replace(/[ýỳŷÿ]/g, 'y')
        .replace(/\W/g, '');
      this.tagKeys = descriptor.tags;
      this.dbg_clickListener = clickListener;
    };

    // Returns the best possible icon object to be inserted in the google marker options, based on
    // its provided tags and an heuristic.
    // getTagDescriptorByKey: a function taking a tag key as argument and returning the
    //                        corresponding tag descriptor.
    function googleIcon(tagKeys, getTagDescriptorByKey) {
      // The idea of this heuristic is that the first tag describes the marker better than the
      // last one.

      // Iterate from the least to the most important tag:
      var url = null;
      var color = 'gray';
      for (var key = tagKeys.length - 1; key >= 0; --key) {
        var tagKey = tagKeys[key];
        var descriptor = getTagDescriptorByKey(tagKey);
        if (!descriptor) {
          console.error("Marker has an undeclared tag '" + tagKey + "'.");
          continue;
        }

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
      return {
        url: url + '_' + color + '.png',
        anchor: new google.maps.Point(7, 7), // px
      };
    };

    // Private constants:
    var tolerance = 80; // meters
    var panZoomLevel = 15;

    return Marker;
  })();

  return {
    Map: Map,
    Marker: Marker,

    // File containing all the marker descriptors:
    markerDescriptors: requirejs.toUrl('angular/map/markers.json'),

    externalGoogleMyMaps: [
      {
        name: "Franzi's lake map",
        id: '1S_guQBQudaPzIgRybK3VIPYwRL0',
        tags: ['lake', 'outdoor', 'franzi', 'great'],
      },
      {
        name: "Franzi's Berl.in map",
        id: '1RklTwBGE0Ke7c_-n-ONFAP-5kV0',
        tags: ['franzi', 'great'],
      },
      {
        name: "Romu's map",
        id: '1NXPVu6MaJ7ASWCmSOe27oXPF5rc',
        tags: ['romu', 'great'],
      },
    ],
  };
});
