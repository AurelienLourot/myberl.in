'use strict';

define({
  patch: patch,
});

// Patches the provided dictionary of instances of googlemap.Marker.
function patch(markers) {
  setPlaceId('betahaus', 'ChIJqQFHjS1OqEcR8d99mafShxY');

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

  function setWebsite(id, website) {
    try {
      markers[id].setWebsite(website);
    } catch(e) {
      console.error('Error patching ' + id + "'s website: " + e);
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
