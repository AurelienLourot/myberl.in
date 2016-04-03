'use strict';

requirejs.config({
  baseUrl: '/base',
});

describe('app', function() {
  beforeEach(function() {
    var fixture
      = '           \
<style>             \
.map {              \
  height: 300px;    \
  width: 300px;     \
}                   \
</style>            \
<div id="fixture"><map filters_id="filters"></map><tag-filters></tag-filters></div>';
    document.body.insertAdjacentHTML('afterbegin', fixture);
  });

  it('should get ready', function(done) {
    requirejs(['main'], function(main) {
      main.addListener(function() {
        done();
      });
    });
  });

  afterEach(function() {
    document.body.removeChild(document.getElementById('fixture'));
  });
});
