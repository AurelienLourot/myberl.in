'use strict';

define({
  patch: patch,
});

// Patches the provided dictionary of instances of googlemap.Marker.
function patch(markers) {
  setComment('ilritrovo', 'Italian');

  function setComment(id, comment) {
    try {
      markers[id].setComment(comment);
    } catch(e) {
      console.error('Error patching ' + id + "'s comment: " + e);
    }
  }
}
