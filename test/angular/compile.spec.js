var compilePatch = require('../../src/angular/compile')

var InstrumentationMock = require('../utils/instrumentation_mock')
var TransactionStoreMock = require('../utils/transaction_store_mock')

var instrumentation = new InstrumentationMock()

var transactionStore = new TransactionStoreMock(instrumentation)

var config = {
  config: {isInstalled: true},
  init: function () { this.setConfig({isInstalled: true}) },
  '@runtimeGlobal': true
}
var Config = require('../../src/lib/config')
Object.setPrototypeOf(config, Config)

config.init()
var mainTr = instrumentation.startTransaction('/', 'transaction', { config: config })
transactionStore.setTransaction(mainTr)

var TransactionService = require('../../src/transaction/transaction_service')
var ZoneService = require('../../src/zone/zone_service')

var transactionService = new TransactionService(transactionStore, undefined, undefined)
var zoneService = new ZoneService(transactionService)

var angular = window.angular

describe('angular.compile', function () {
  it('should work', function (done) {
    var app = angular.module('compilePatchModule', ['ng'])

    app.config(function ($provide) {
      compilePatch($provide, zoneService)
    })
    var injector = angular.injector(['compilePatchModule'])

    injector.invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
      var element = $compile('<div ng-bind="a"></div>')($rootScope)
      expect(element.text()).toEqual('')
      $rootScope.a = 'hamid'
      $rootScope.$digest()
      expect(element.hasClass('ng-binding')).toEqual(true)
      expect(element.text()).toEqual('hamid')
    }])

    mainTr.end()
    setTimeout(function () {
      var traces = instrumentation._queue[0].traces.map(function (t) { return t.signature })
      expect(traces).toContain('$compile.compile')
      done()
    }, 100)
  })
})
