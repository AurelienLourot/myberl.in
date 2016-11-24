'use strict';

define(function() {
  var app = angular.module('tags', ['ngAnimate']);

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

  // Service for knowing whether a tag is selected or not.
  app.factory('isSelected', function() {
    return function(tagKey) {
      checkModuleIsReady();
      return app.tagFilters.states[tagKey].selected;
    };
  });

  // Service for selecting a tag.
  app.factory('select', function() {
    return function(tagKey) {
      checkModuleIsReady();
      app.tagFilters.states[tagKey].selected = true;
      app.tagFilters.callListeners();
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

  app.controller('tagsCtrl', function($http, $scope) {
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

      // Add group utility function:
      for (var i = 0; i < data.length; ++i) {
        var group = data[i];

        // Returns the tag keys belonging to this group:
        group.getChildren = function() {
          var result = [];
          for (var j = 0; j < this.length; ++j) {
            result.push(this[j].name);
          }
          return result;
        }
      }

      controller.groups = data;

      if (!app.tagFilters) {
        app.tagFilters = new TagFilters(data);
        console.log('Tags module ready.');
      }
      $scope.filters = app.tagFilters;
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
              console.error('No checkboxes found.');
            }
            checkboxes.checkbox({
              onChange: function() {
                // Workaround for https://github.com/Semantic-Org/Semantic-UI/issues/1202 :
                var inputElm = $(this);
                var inputElmName = inputElm.attr('name');
                scope.$apply(scope.filters.states[inputElmName].selected = inputElm.is(':checked'));
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
      console.error("tags module isn't ready.");
    }
  }

  var TagFilters = (function() {
    // tagDescriptors: tag descriptors organized in groups, as in tags.json.
    var TagFilters = function(tagDescriptors) {

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
            if ($.inArray(key, tagKeys) >= 0 && this.states[key].selected) {
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

      // Returns true if each tag of the provided set is currently hidden in the filter view.
      this.areAllHidden = function(tagKeys) {
        for (var i = 0; i < tagKeys.length; ++i) {
          var tagKey = tagKeys[i];
          if (this.states[tagKey].visible) {
            return false;
          }
        }
        return true;
      }

      // Returns true if some tags are currently hidden in the filter view.
      this.areSomeHidden = function() {
        for (var i in this.states) {
          if (this.states.hasOwnProperty(i)) {
            if (!this.states[i].visible) {
              return true;
            }
          }
        }
        return false;
      }

      this.makeAllVisible = function() {
        for (var i in this.states) {
          if (this.states.hasOwnProperty(i)) {
            this.states[i].visible = true;
          }
        }
      }

      this.addListener = function(listener) {
        listeners.push(listener);
      }

      this.callListeners = function() {
        for (var i in listeners) {
          listeners[i]();
        }
      }

      this.numberOfKeys = 0;

      // Public members:
      this.states = {};

      // Private members:
      var descriptors = tagDescriptors;
      var listeners = [];

      // Initialize states:
      for (var i = 0; i < descriptors.length; ++i) {
        var group = descriptors[i];
        for (var j = 0; j < group.length; ++j) {
          var tag = group[j];
          this.states[tag.name] = {
            selected: tag.initialState,
            visible: !tag.advanced, // hide advanced tags by default
          };
          ++this.numberOfKeys;
        }
      }
    };

    return TagFilters;
  })();

  var dbg_checkboxChanged = (function() {
    // Secret dialog will pop up after the following sequence is clicked:
    var seq = ['bar', 'café', 'club', 'restaurant', 'brunch',
               'bar', 'café', 'club', 'restaurant', 'brunch'];
    var lastClicked = -1;

    return function(checkboxName) {
      if (checkboxName == seq[lastClicked + 1]) {
        ++lastClicked;
      } else {
        lastClicked = -1;
      }
      if (lastClicked == seq.length - 1) {
        lastClicked = -1;
        $('.dbg_secret_open').click();
      }
    };
  })();
});
