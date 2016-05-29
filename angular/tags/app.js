'use strict';

define(function() {
  var app = angular.module('tags', []);

  app.factory('tagsModuleIsReady', function() {
    return function() {
      return !!app.tagFilters;
    };
  });

  // Service for knowing whether a marker with the provided set of tags is to be displayed or not,
  // based on the current checkbox states.
  app.factory('areMatching', function() {
    return function(tagKeys) {
      checkModuleIsReady();
      return app.tagFilters.areMatching(tagKeys);
    };
  });

  // Service for getting a tag descriptor by key.
  app.factory('getTagDescriptorByKey', function() {
    return function(key) {
      checkModuleIsReady();
      return app.tagFilters.getDescriptorByKey(key);
    };
  });

  // Service for adding a listener on filter changes.
  app.factory('addListener', function() {
    return function(listener) {
      checkModuleIsReady();
      app.tagFilters.addListener(listener);
    };
  });

  app.filter('rawHtml', ['$sce', function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    }
  }]);

  app.controller('tagsCtrl', function($http, $scope) {
    $scope.states = {};

    var controller = this;
    controller.groups = [];
    var tagDescriptors = requirejs.toUrl('angular/tags/tags.json');
    $http.get(tagDescriptors).success(function(data) {
      // Fix icon paths:
      for (var i = 0; i < data.length; ++i) {
        for (var j = 0; j < data[i].length; ++j) {
          data[i][j].desc = data[i][j].desc.replace(/(.*src=')(.*)('.*)/,
                                                    function(match, group1, group2, group3) {
            return group1 + requirejs.toUrl(group2) + group3;
          });
          if (data[i][j].icon) {
            data[i][j].icon = requirejs.toUrl(data[i][j].icon);
          }
        }
      }

      controller.groups = data;
      if (!app.tagFilters) {
        app.tagFilters = new TagFilters(data, $scope.states);
      }
    });
  });

  app.directive('tagFilters', ['$timeout', function($timeout) {
    return {
      restrict: 'E',
      templateUrl: requirejs.toUrl('angular/tags/tag-filters.html'),
      controller: 'tagsCtrl',
      controllerAs: 'tags',
      link: function(scope, elm, attrs, ctrl) {
        var deregisterWatch = scope.$watch(function allCheckboxesAreInDom() {
          return app.tagFilters
            ? app.tagFilters.numberOfKeys == elm.find('.checkbox').length : false;
        }, function(allCheckboxesAreInDom) {
          if (allCheckboxesAreInDom) {
            deregisterWatch();

            // Note that without 'onChange', a Semantic UI checkbox can't be toggled.
            var checkboxes = elm.find('.checkbox');
            if (!checkboxes.length) {
              error('No checkboxes found.');
            }
            checkboxes.checkbox({
              onChange: function() {
                // Workaround for https://github.com/Semantic-Org/Semantic-UI/issues/1202 :
                var inputElm = $(this);
                var inputElmName = inputElm.attr('name');
                scope.$apply(scope.states[inputElmName] = inputElm.is(':checked'));
                dbg_checkboxChanged(inputElmName);

                $timeout(function () { // necessary on Safari and Android's browser, so Angular
                                       // first updates the model
                  app.tagFilters.callListeners();
                });
              },
            });
          }
        });
      },
    };
  }]);

  var checkModuleIsReady = function() {
    if (!app.tagFilters) {
      error("tags module isn't ready.");
    }
  }

  var TagFilters = (function() {
    // tagDescriptors: tag descriptors organized in groups, as in tagDescriptors.
    // states: empty object. A boolean property for each tag will be created, serving as 2-way bound
    //         model.
    var TagFilters = function(tagDescriptors, states) {

      // Returns true if the provided set of tags matches the current filters.
      this.areMatching = function(tagKeys) {
        // There is a match if at least one selected tag of each group is in the provided keys. In
        // other words, criteria within the same group are linked with an OR, whereas groups are
        // linked with an AND.

        for (var i = 0; i < descriptors.length; ++i) {
          var group = descriptors[i];
          var oneSelectedTagFoundInProvidedSet = false;
          for (var j = 0; j < group.length; ++j) {
            var key = group[j].name;
            if ($.inArray(key, tagKeys) >= 0 && currentStates[key]) {
              oneSelectedTagFoundInProvidedSet = true;
              break;
            }
          }
          if (!oneSelectedTagFoundInProvidedSet) {
            return false;
          }
        }
        return true;
      };

      this.getDescriptorByKey = function(key) {
        for (var i = 0; i < descriptors.length; ++i) {
          var group = descriptors[i];
          for (var j = 0; j < group.length; ++j) {
            var descriptor = group[j];
            if (descriptor.name == key) {
              return descriptor;
            }
          }
        }
      };

      this.addListener = function(listener) {
        listeners.push(listener);
      }

      this.callListeners = function() {
        for (var i in listeners) {
          listeners[i]();
        }
      }

      this.numberOfKeys = 0;

      // Private members:
      var descriptors = tagDescriptors;
      var listeners = [];
      var currentStates = states;

      // Initialize states:
      for (var i = 0; i < descriptors.length; ++i) {
        var group = descriptors[i];
        for (var j = 0; j < group.length; ++j) {
          var tag = group[j];
          states[tag.name] = tag.initialState;
          ++this.numberOfKeys;
        }
      }
    };

    return TagFilters;
  })();

  var dbg_checkboxChanged = (function() {
    // Secret dialog will pop up after the following sequence is clicked:
    var seq = ['bar', 'cafe', 'club', 'restaurant', 'brunch',
               'bar', 'cafe', 'club', 'restaurant', 'brunch'];
    var lastClicked = -1;

    return function(checkboxName) {
      if (checkboxName == seq[lastClicked + 1]) {
        ++lastClicked;
      } else {
        lastClicked = -1;
      }
      if (lastClicked == seq.length - 1) {
        lastClicked = -1;
        $('#filters').popup('hide');
        $('#dbg_secret').popup('show');
      }
    };
  })();
});
