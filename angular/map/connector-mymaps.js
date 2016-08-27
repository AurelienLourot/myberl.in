'use strict';

var Connector = (function() {
  // Creates a connector to Google My Maps, i.e. an object that will parse a map's KML and deliver
  // an object following markerDescriptors' layout.
  // tags: tags to be given to this map's markers.
  // $http: angular $http service.
  // successCallback: takes the resulting object as argument.
  function Connector(mapId, tags, $http, successCallback) {

    // See http://stackoverflow.com/questions/29603652/google-maps-api-google-maps-engine-my-maps :
    $http.get('https://crossorigin.me/https://www.google.com/maps/d/kml?mid=' + mapId + '&forcekml=1')
      .then(function success(response) {

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

            var convertedTags = tags.slice();
            if (receivedMarker.description) {
              var receivedWords = receivedMarker.description.replace('<br>', ' ').split(' ');
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

            var convertedMarker = {
              title: receivedMarker.name,
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

      }, function error(response) {

        successCallback([]);

      });

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
