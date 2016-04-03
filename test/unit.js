'use strict';

requirejs.config({
  baseUrl: '/base',
});

describe('tagFilters', function() {
  var $controller;
  beforeEach(function(done) {
    requirejs(['angular/tags/app'], function(tags) {
      angular.mock.module('tags');
      angular.mock.inject(function(_$controller_) {
        $controller = _$controller_;
      });
      done();
    });
  });

  it('should get its tags from the JSON file', function() {
    var $http = {
      url: undefined,
      get: function get(url) {
        this.url = url;
        return this;
      },
      success: function success(callback) {
        callback({});
      },
    };
    var $scope = {};

    var controller = $controller('tagsCtrl', {
      $http: $http,
      $scope: $scope
    });

    expect($http.url).toContain('angular/tags/tags.json');
  });
});
