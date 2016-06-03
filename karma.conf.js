module.exports = function (config) {
  var customLaunchers = {
    'SL_CHROME': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '46'
    },
    'SL_FIREFOX': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '42'
    },
    'SL_SAFARI9': {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.11',
      version: '9.0'
    },
    'SL_IE11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 8.1',
      version: '11'
    },
    'SL_IE10': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 2012',
      version: '10'
    },
    'SL_EDGE': {
      base: 'SauceLabs',
      browserName: 'microsoftedge',
      platform: 'Windows 10',
      version: '20.10240'
    },
    'SL_ANDROID4.4': {
      base: 'SauceLabs',
      browserName: 'android',
      platform: 'Linux',
      version: '4.4'
    },
    'SL_IOS9': {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '9.1'
    }
  }
  var cfg = {
    files: [
      'test/utils/polyfill.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-resource/angular-resource.js',
      'node_modules/zone.js/dist/zone.js',
      'test/**/*.spec.js',
      { pattern: 'test/exceptions/data/*.js', included: false, watched: false }
    ],
    frameworks: ['browserify', 'jasmine'],
    preprocessors: {
      'test/**/*.spec.js': ['browserify']
    },
    plugins: [
      'karma-sauce-launcher',
      'karma-failed-reporter',
      'karma-jasmine',
      'karma-spec-reporter',
      'karma-browserify'
    ],
    browserNoActivityTimeout: 60000,
    customLaunchers: customLaunchers,
    browsers: [], // Chrome, Firefox, PhantomJS2
    captureTimeout: 120000, // on saucelabs it takes some time to capture browser
    reporters: ['spec', 'failed'],
    browserify: {
      debug: true,
      configure: function (bundle) {
        var proxyquire = require('proxyquireify')
        bundle
          .plugin(proxyquire.plugin)
      }
    },
    sauceLabs: {
      testName: 'OpbeatJS',
      startConnect: false,
      recordVideo: false,
      recordScreenshots: true,
      options: {
        'selenium-version': '2.48.2',
        'command-timeout': 600,
        'idle-timeout': 600,
        'max-duration': 5400
      }
    }
  }
  var isTravis = process.env.TRAVIS
  var isSauce = process.env.MODE && process.env.MODE.startsWith('saucelabs')
  var buildId
  var version = require('./package').version

  console.log('MODE: ' + process.env.MODE)

  if (isTravis) {
    buildId = 'OpbeatJS@' + version + ' - TRAVIS #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')'
    cfg.sauceLabs.tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER
    // 'karma-chrome-launcher',
    cfg.plugins.push('karma-firefox-launcher')
    cfg.browsers.push('Firefox')
  } else {
    buildId = 'OpbeatJS@' + version
    cfg.plugins.push('karma-chrome-launcher')
    cfg.browsers.push('Chrome')
  // cfg.plugins.push('karma-phantomjs2-launcher')
  // cfg.browsers.push('PhantomJS2')
  }

  if (isSauce) {
    cfg.concurrency = 3
    cfg.sauceLabs.build = buildId
    cfg.reporters = ['dots', 'saucelabs']
    cfg.browsers = Object.keys(customLaunchers)
    cfg.transports = ['polling']
  }

  config.set(cfg)
}
