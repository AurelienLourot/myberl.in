setTimeout(function() {
  console.error('FAILED: timeout.');
  phantom.exit(1);
}, 10000);

var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
  console.log('INFO: ' + msg);

  if (msg.indexOf('[ready]') > -1) {
    console.log('SUCCESS');
    phantom.exit(0);
  }
};

page.open('https://myberl.in', function(status) {
  if (status != 'success') {
    console.error('FAILED: unreachable?');
    phantom.exit(2);
  }
});
