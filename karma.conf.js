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
      {pattern: 'thirdparty/timerlog-0.1.4/dist/index.es5.js', included: false},
      {pattern: 'main.js', included: false},
      'thirdparty/polyfills.js',
      'lib/time.js',
      'lib/console.js',
      'thirdparty/jquery-1.12.4.min.js',
      'thirdparty/semantic-ui-2.1.8/semantic.min.js',
      'https://maps.googleapis.com/maps/api/js?key=AIzaSyDgo1hF6M7dGD75NQgfNXGvT422ri9ieyU&libraries=places',
      'thirdparty/markerwithlabel.js',
      'thirdparty/geolocation-marker.js',
      'thirdparty/x2js-1.2.0/xml2json.min.js',
      'thirdparty/angularjs-1.4.4/angular.min.js',
      'thirdparty/angularjs-1.4.4/angular-animate.min.js',
      'thirdparty/require.js',
      'thirdparty/animated-modal-1.0/animatedModal.min.js',
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
