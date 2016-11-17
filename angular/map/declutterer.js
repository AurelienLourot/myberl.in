'use strict';

var Declutterer = (function() {
  // Creates a declutterer, i.e. an engine working in the background on avoiding that marker labels
  // cover each other.
  // map: instance of google.maps.Map.
  // projectionFactory: creates a Projection, an object able to convert GPS coordinates to/from
  //                    pixel coordinates.
  // markers: associative array of Marker's.
  // currentPositionMarker: marker showing the user's position.
  // $interval: angular $interval service.
  // deviceIsSlowCallback: called when device is detected to be slow.
  function Declutterer(map, projectionFactory, markers, currentPositionMarker, $interval,
                       deviceIsSlowCallback) {

    // Stops the engine.
    this.stop = function stop() {
      $interval.cancel(tickIntervalPromise);
    };

    // Called periodically. Must have a short execution time.
    function tick() {
      var beginMs = nowMs();
      var timeSinceLastTickMs = endLastTickMs ? beginMs - endLastTickMs : 0;
      // If the elapsed time since the last tick is very long, it's more likely that the tab was
      // inactive rather than having a slow device:
      if (timeSinceLastTickMs > 2 * periodMs && timeSinceLastTickMs < 3 * slowPeriodMs) {
        handleSlowDevice();
      }

      doTick();

      if (nowMs() - beginMs > periodMs) {
        handleSlowDevice();
      }
      endLastTickMs = nowMs();
    }

    function handleSlowDevice() {
      // Slow down if possible:
      if (periodMs < slowPeriodMs) {
        periodMs = slowPeriodMs;
        $interval.cancel(tickIntervalPromise);
        tickIntervalPromise = $interval(tick, periodMs);
      }

      deviceIsSlowCallback();
    };

    // Actual implementation of tick().
    function doTick() {
      var beginMs = nowMs();

      var projection = projectionFactory.getProjection && projectionFactory.getProjection();
      if (!projection) {
        return; // initialization isn't done yet
      }

      // Calculates the pixel coordinates of each marker and count the amount of visible labels.
      var numVisibleLabels = 0;
      var currentZoomLevel = map.getZoom();
      for (var id in markers) {
        var marker = markers[id];
        numVisibleLabels += marker.isLabelVisible() ? 1 : 0;
        // Optimization: if we zoomed out a lot, keep all labels hidden by making them out of
        //               screen.
        if (currentZoomLevel >= 12 && marker.isVisible()) {
          marker.positionPoint = projection.fromLatLngToContainerPixel(marker.getPosition());
        } else {
          marker.positionPoint = {
            x: -999,
            y: -999,
          };
        }
      }
      var currentPositionMarkerPosition = currentPositionMarker.getPosition();
      currentPositionMarker.positionPoint = currentPositionMarkerPosition ?
        projection.fromLatLngToContainerPixel(currentPositionMarkerPosition) : {
          x: -999,
          y: -999,
        };

      // Logic for dynamic tolerance adaption.
      var viewportBounds = map.getBounds();
      var viewportTopRight = projection.fromLatLngToContainerPixel(viewportBounds.getNorthEast());
      var viewportBottomLeft = projection.fromLatLngToContainerPixel(viewportBounds.getSouthWest());
      var viewportSize = viewportTopRight.x * viewportBottomLeft.y; // px
      var maxNumLabels = maxNumLabelsPerPx * viewportSize; // hard limit
      var minNumLabels = minNumLabelsPerPx * viewportSize; // soft limit
      function showLabelOrAdaptTolerance(marker) {
        if (!marker.isLabelVisible()) {
          if (numVisibleLabels < maxNumLabels) {
            marker.setLabelVisible(true);
            ++numVisibleLabels;
          } else {
            // Too many labels, increase tolerance:
            tolerance += defaultTolerance;
          }
        }
      };
      function hideLabelAndAdaptTolerance(marker) {
        if (marker.isLabelVisible()) {
          marker.setLabelVisible(false);
          --numVisibleLabels;
          if (numVisibleLabels < minNumLabels) {
            // Not enough labels, decrease tolerance if possible:
            tolerance = Math.max(defaultTolerance, tolerance - defaultTolerance);
          }
        }
      };

      // Ensures we do a minimum amount of markers, even on a slow system. Ensures as well that we
      // don't do more than the amount of markers.
      var markerIDs = Object.keys(markers); //FIXME: Object.keys() not implemented in IE8?
      var totalNumMarkers = markerIDs.length;
      var minNumMarkers = Math.min(minStepNumMarkers, totalNumMarkers);
      outer:
      for (var i = 0; i < totalNumMarkers; ++i, ++indexNextMarkerToDeclutter) {
        indexNextMarkerToDeclutter %= totalNumMarkers;

        if (i >= minStepNumMarkers && nowMs() - beginMs >= maxStepDurationMs) {
          break;
        }

        var markerBeingEvaluated = markers[markerIDs[indexNextMarkerToDeclutter]];
        if (!isMarkerVisibleOnViewport(markerBeingEvaluated, viewportBounds)) {
          if (markerBeingEvaluated.isVisible()) {
            hideLabelAndAdaptTolerance(markerBeingEvaluated);
          }
          continue;
        }

        // FIXME: playing with zIndex on labels and markers won't help: labels stay above the
        //        current position. So we solve this here by decluttering.
        var dX = currentPositionMarker.positionPoint.x - markerBeingEvaluated.positionPoint.x;
        var dY = currentPositionMarker.positionPoint.y - markerBeingEvaluated.positionPoint.y;
        var currentPositionTolerance = Math.max(tolerance, currentPositionMinTolerance);
        if (Math.abs(dX) < currentPositionTolerance &&
            Math.abs(dY) < currentPositionTolerance) {
          hideLabelAndAdaptTolerance(markerBeingEvaluated);
          continue;
        }

        for (var id in markers) {
          var markerNotToHide = markers[id];
          if (markerBeingEvaluated === markerNotToHide ||
              !isMarkerVisibleOnViewport(markerNotToHide, viewportBounds) ||
              !markerNotToHide.isLabelVisible()) {
            continue;
          }

          var dX = markerNotToHide.positionPoint.x - markerBeingEvaluated.positionPoint.x;
          var dY = markerNotToHide.positionPoint.y - markerBeingEvaluated.positionPoint.y;
          if (Math.abs(dX) < tolerance &&
              Math.abs(dY) < tolerance) {
            hideLabelAndAdaptTolerance(markerBeingEvaluated);
            continue outer;
          }
        }

        showLabelOrAdaptTolerance(markerBeingEvaluated);
      }
    };

    function isMarkerVisibleOnViewport(marker, viewportBounds) {
      return marker.isVisible() && marker.positionPoint.x >= 0 &&
        viewportBounds.contains(marker.getPosition());
    };

    // Private members:
    var periodMs = normalPeriodMs;
    var tickIntervalPromise = $interval(tick, periodMs);
    var indexNextMarkerToDeclutter = 0;
    var endLastTickMs = 0;
    var tolerance = defaultTolerance; // ~ minimum distance between markers for showing their labels

  };

  // Returns the current time in milliseconds since the epoch.
  function nowMs() {
    return (new Date).getTime();
  };

  // Private constants:
  var normalPeriodMs = 2000;
  var slowPeriodMs = 2 * normalPeriodMs;
  var maxStepDurationMs = 50;
  var minStepNumMarkers = 10;
  var defaultTolerance = 20; // px
  var currentPositionMinTolerance = 40; // px
  var maxNumLabelsPerPx = 100 / (1000 * 570); // hard limit
  var minNumLabelsPerPx = maxNumLabelsPerPx / 2; // soft limit

  return Declutterer;
})();

define({
  Declutterer: Declutterer,
});
