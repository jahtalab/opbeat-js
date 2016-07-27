describe('angular', function () {
  var Config = require('../../src/lib/config')
  var TransactionService = require('../../src/transaction/transaction_service')
  var ngOpbeat = require('../../src/angular/ngOpbeat')
  var ZoneServiceMock = require('../transaction/zone_service_mock.js')
  var ServiceFactory = require('../../src/common/serviceFactory')

  var config

  var zoneServiceMock
  var logger
  var angular = window.angular
  beforeEach(function () {
    var serviceFactory = new ServiceFactory()
    config = Object.create(Config)
    config.init()
    serviceFactory.services['ConfigService'] = config
    serviceFactory.services['Logger'] = logger = Object.create(serviceFactory.getLogger())
    spyOn(logger, 'debug')

    zoneServiceMock = new ZoneServiceMock()

    var trService = new TransactionService(zoneServiceMock, logger, {})
    spyOn(trService, 'startTrace')
    var ServiceContainer = require('../../src/angular/serviceContainer')
    new ServiceContainer(serviceFactory).services
    ngOpbeat(trService, logger, config)
  })

  it('would work', function () {
    angular.module('patchModule', ['ui.router', 'ngOpbeat'])
    window.opbeatApi.subscribeToTransactions(function (tr) {
      console.log(tr)
    })
    var injector = window.angular.bootstrap('<div></div>', ['patchModule'])
  })
})
