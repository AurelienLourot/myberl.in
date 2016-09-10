var page = require('webpage').create();
page.open('https://myberl.in', function(status) {
  phantom.exit(status == 'success' ? 0 : 1);
});
