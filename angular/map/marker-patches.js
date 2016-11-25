'use strict';

define({
  patch: patch,
});

// Patches the provided dictionary of instances of googlemap.Marker.
function patch(markers) {
  ignoreErrors('bernsteinsee');
  setPlaceId('betahaus', 'ChIJqQFHjS1OqEcR8d99mafShxY');
  setComment('ilritrovo', 'Italian');
  setPlaceId('ploetzensee', 'ChIJY57G5GZRqEcRnKNEpnBZIK8');
  ignoreErrors('rahmersee');

  function setComment(id, comment) {
    try {
      markers[id].setComment(comment);
    } catch(e) {
      console.error('Error patching ' + id + "'s comment: " + e);
    }
  }

  function setPlaceId(id, placeId) {
    try {
      markers[id].setPlaceId(placeId);
    } catch(e) {
      console.error('Error patching ' + id + "'s place ID: " + e);
    }
  }

  function ignoreErrors(id) {
    try {
      markers[id].ignoreErrors();
    } catch(e) {
      console.error('Error patching ' + id + "'s ignore_errors.");
    }
  }
}
