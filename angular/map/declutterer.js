'use strict';

var Declutterer = (function() {
  // Creates a declutterer, i.e. an engine working in the background on avoiding that marker labels
  // cover each other.
  // map: instance of google.maps.Map.
  // projectionFactory: creates a Projection, an object able to convert GPS coordinates to/from
  //                    pixel coordinates.
  // markers: array of Marker's.
  // setStatus: function for setting the application status.
  function Declutterer(map, projectionFactory, markers, setStatus) {

    // Stops the engine.
    this.stop = function stop() {
      clearInterval(doIntervalId);
    };

    // Called periodically. Must have a short execution time.
    function tick() {
      var beginMs = nowMs();
      if (endLastTickMs && beginMs - endLastTickMs > 2 * periodMs) {
        declareDeviceAsSlow();
      }

      doTick();

      endLastTickMs = nowMs();
      if (endLastTickMs - beginMs > periodMs) {
        declareDeviceAsSlow();
      }
    }

    function declareDeviceAsSlow() {
      setStatus('warning', 'Device too slow');
    }

    // Actual implementation of tick().
    function doTick() {
      var beginMs = nowMs();

      var projection = projectionFactory.getProjection();
      if (!projection) {
        return; // initialization isn't done yet
      }

      // Calculates the pixel coordinates of each marker.
      var currentZoomLevel = map.getZoom();
      for (var i = 0; i < markers.length; ++i) {
        var marker = markers[i];
        // Optimization: if we zoomed out a lot, keep all labels hidden by making them out of
        //               screen.
        if (currentZoomLevel >= 12 && marker.isVisible()) {
          marker.positionPoint = projection.fromLatLngToContainerPixel(marker.getPosition());
        } else {
          marker.positionPoint = {
            x: -1,
            y: -1,
          };
        }
      }

      // Ensures we do a minimum amount of markers, even on a slow system. Ensures as well that we
      // don't do more than the amount of markers.
      var minNumMarkers = Math.min(minStepNumMarkers, markers.length);
      outer:
      for (var i = 0; i < markers.length; ++i, ++indexNextMarkerToDeclutter) {
        indexNextMarkerToDeclutter %= markers.length;

        if (i >= minStepNumMarkers && nowMs() - beginMs >= maxStepDurationMs) {
          break;
        }

        var markerBeingEvaluated = markers[indexNextMarkerToDeclutter];
        if (!isMarkerVisibleOnScreen(markerBeingEvaluated)) {
          if (markerBeingEvaluated.isVisible()) {
            markerBeingEvaluated.setLabelVisible(false);
          }
          continue;
        }

        for (var j = 0; j < markers.length; ++j) {
          var markerNotToHide = markers[j];
          if (markerBeingEvaluated === markerNotToHide ||
              !isMarkerVisibleOnScreen(markerNotToHide) ||
              !markerNotToHide.isLabelVisible()) {
            continue;
          }

          var dX = markerNotToHide.positionPoint.x - markerBeingEvaluated.positionPoint.x;
          var dY = markerNotToHide.positionPoint.y - markerBeingEvaluated.positionPoint.y;
          if (Math.abs(dX) < tolerance &&
              Math.abs(dY) < tolerance) {
            markerBeingEvaluated.setLabelVisible(false);
            continue outer;
          }
        }

        markerBeingEvaluated.setLabelVisible(true);
      }
    };

    function isMarkerVisibleOnScreen(marker) {
      return marker.isVisible() && marker.positionPoint.x >= 0 &&
        map.getBounds().contains(marker.getPosition());
    };

    // Private members:
    var doIntervalId = setInterval(tick, periodMs);
    var indexNextMarkerToDeclutter = 0;
    var endLastTickMs = 0;

  };

  // Returns the current time in milliseconds since the epoch.
  function nowMs() {
    return (new Date).getTime();
  };

  // Private constants:
  var periodMs = 2000;
  var maxStepDurationMs = 50;
  var minStepNumMarkers = 10;
  var tolerance = 20; // px

  return Declutterer;
})();

define({
  Declutterer: Declutterer,
});
