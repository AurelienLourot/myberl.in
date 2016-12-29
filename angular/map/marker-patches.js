'use strict';

define({
  patch: patch,
});

// Patches the provided dictionary of instances of googlemap.Marker.
function patch(markers) {
  ignoreErrors('bernsteinsee');
  setPlaceId('betahaus', 'ChIJqQFHjS1OqEcR8d99mafShxY');
  setPlaceId('brlo', 'ChIJoWMZoR1OqEcR_ZCD-qZZGkA');
  setPlaceId('hausschwarzenberg', 'ChIJjZik3-BRqEcRYJNhq-6aGVU');
  setComment('ilritrovo', 'Italian');
  setPlaceId('lipopette', 'ChIJ54YiTpdPqEcR_3MWglIIzLc');
  setWebsite('lipopette', 'https://www.facebook.com/lipopetteberlin/');
  setPlaceId('nymphensee', 'ChIJGS3gbYD7qEcRePUdNIcYvYE');
  setPlaceId('ploetzensee', 'ChIJY57G5GZRqEcRnKNEpnBZIK8');
  setPlaceId('ponterosa', 'ChIJqTH0OztQqEcRLgWCiboku0M');
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
