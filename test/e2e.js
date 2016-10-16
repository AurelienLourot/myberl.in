'use strict';

requirejs.config({
  baseUrl: '/base',
});

describe('app', function() {
  var originalTimeout;

  beforeEach(function() {
    var fixture
      = '           \
<style>             \
.map {              \
  height: 300px;    \
  width: 300px;     \
}                   \
</style>            \
<div id="fixture"><map on-marker-click=""></map><tag-filters></tag-filters></div>';
    document.body.insertAdjacentHTML('afterbegin', fixture);

    // On Firefox 45.0 the app gets easily ready within 5 seconds but on Travis CI they use Firefox
    // 31.0 which is slower:
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  it('should get ready', function(done) {
    requirejs(['main'], function(main) {
      main.addListener(function() {
        done();
      });
    });
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

    //FIXME: we should remove <style> as well:
    document.body.removeChild(document.getElementById('fixture'));
  });
});
