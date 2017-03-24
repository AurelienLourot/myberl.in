'use strict';

var Connector = (function() {
  // Creates a connector to Google My Maps, i.e. an object that will parse a map's KML and deliver
  // an object following markerDescriptors' layout.
  // tags: tags to be given to this map's markers.
  // $http: angular $http service.
  // successCallback: takes the resulting object as argument.
  function Connector(mapId, tags, $http, successCallback) {

    // See http://stackoverflow.com/questions/29603652/google-maps-api-google-maps-engine-my-maps :
    var url = 'https://crossorigin.me/https://www.google.com/maps/d/kml?mid=' + mapId
      + '&forcekml=1';

    var backupUrl = '/snapshots/maps/thirdparty/' + mapId + '.kml';

    $http.get(url, {timeout: 5000}).then(success, errorOnCorsProxy);

    function success(response) {
      var result = [];

      try {
        var folders = asArray((new X2JS).xml_str2json(response.data).kml.Document.Folder);
        var markers = [];
        for (var i = 0; i < folders.length; ++i) {
          var folder = folders[i];
          var folderMarkers = asArray(folder.Placemark);
          markers = markers.concat(folderMarkers);
        }

        for (var i = 0; i < markers.length; ++i) {
          var receivedMarker = markers[i];
          var receivedCoordinates = /(.*),(.*),(.*)/.exec(receivedMarker.Point.coordinates);

          var convertedTags = tags.prepend ? tags.tags.slice() : [];
          console.log(convertedTags);
          if (receivedMarker.description) {
            // On IE11, descriptions containing `- ` are of type Array, thus the need to join():
            var description = typeof receivedMarker.description === 'string' ?
              receivedMarker.description : receivedMarker.description.__cdata.join('');
            var receivedWords = description.replace('<br>', ' ').split(' ');
            for (var j = 0; j < receivedWords.length; ++j) {
              var word = receivedWords[j];
              if (word.startsWith('#')) {
                var tag = word.slice(1);
                if ($.inArray(tag, convertedTags) < 0) { // if not already in the set of tags
                  convertedTags.push(tag);
                }
              }
            }
          }
          if (!tags.prepend) {
            Array.prototype.push.apply(convertedTags, tags.tags);
          }

          var convertedMarker = {
            // On IE11, titles containing `- ` are of type Object, thus the need to cast:
            title: '' + receivedMarker.name,
            position: {
              lat: parseFloat(receivedCoordinates[2]),
              lng: parseFloat(receivedCoordinates[1]),
            },
            tags: convertedTags,
          };
          result.push(convertedMarker);
        }
      } catch (e) {
        console.error(e.message);
      } finally {
        successCallback(result);
      }
    }

    function errorOnCorsProxy(response) {
      console.error('Could not load ' + url + ' . Falling back to ' + backupUrl);
      $http.get(backupUrl).then(success, errorOnBackup);
    }

    function errorOnBackup(response) {
      console.error('Could not load ' + backupUrl);
      successCallback([]);
    }

  };

  //FIXME: Hack for JSON, which doesn't support arrays of less than two elements :( Use another XML
  //       parser?
  function asArray(thing) {
    var res = thing;
    if (typeof res == "undefined") {
      res = [];
    } else if (!$.isArray(res)) {
      res = [res,];
    }
    return res;
  }

  return Connector;
})();

define({
  Connector: Connector,
});
