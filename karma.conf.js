// Karma configuration
// Generated on Mon Mar 14 2016 21:45:07 GMT+0100 (CET)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      {pattern: 'angular/**/*.js', included: false},
      {pattern: 'angular/**/*.html', included: false},
      {pattern: 'angular/**/*.json', included: false},
      {pattern: 'assets/pics/thirdparty/*.png', included: false},
      {pattern: 'main.js', included: false},
      'https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js',
      'http://oss.maxcdn.com/semantic-ui/2.1.8/semantic.min.js',
      'lib/error.js',
      'thirdparty/require.js',
      'thirdparty/jquery-popup-overlay-1.7.11/jquery.popupoverlay.js',
      'https://maps.googleapis.com/maps/api/js?signed_in=true&key=AIzaSyDgo1hF6M7dGD75NQgfNXGvT422ri9ieyU&libraries=places',
      'http://google-maps-utility-library-v3.googlecode.com/svn/tags/markerwithlabel/1.1.10/src/markerwithlabel.js',
      'thirdparty/angularjs-1.4.4/angular.min.js',
      'http://ajax.googleapis.com/ajax/libs/angularjs/1.4.4/angular-mocks.js',

      // The order matters, as mocked angular modules can't be unmocked afterwards. Thus when a test
      // mocks an angular module, all later tests are affected.
      'test/e2e.js',
      'test/unit.js',
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
