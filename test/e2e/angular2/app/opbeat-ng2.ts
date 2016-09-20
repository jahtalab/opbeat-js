import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
// import {ServiceFactory} from '../../../src/common/serviceFactory'

var ServiceFactory = require('../../../src/common/serviceFactory.js')
var ServiceContainer = require('../../../src/common/serviceContainer.js')
var patchCommon = require('../../../src/common/patchCommon.js')
// import {ServiceFactory} from '../../../../src/angular2/opbeat-angular2.js'
// import {ServiceFactory} from '../../../../src/angular2/opbeat-angular2.js'

// import {ServiceFactory} from 'opbeat-js/src/angular2'
// var ServiceFactory = require('opbeat-js/src/angular2')


declare var Zone;
var sf = new ServiceFactory()
var serviceContainer = new ServiceContainer(sf)
serviceContainer.initialize()
patchCommon(serviceContainer)

var transactionService = serviceContainer.services.transactionService
var configService = serviceContainer.services.configService
configService.setConfig({
  logLevel: 'trace',
  orgId: '7f9fa667d0a349dd8377bc740bcfc33e',
  appId: '0a8757798e',
  performance: {
    enable: true,
    enableStackFrames: true
  }
})



var origFork = Zone.current.fork
var opbeatZone = serviceContainer.services.zoneService.zone
// Zone.current.fork = function () {
//   return opbeatZone.fork.apply(this, arguments)
// }
export function bootstrap(fn) {
  return opbeatZone.run(fn)
  // return fn.apply(this, arguments)
}

@Injectable()
export class Opbeat {
  constructor(private router: Router) {
    var tr
    router.events.subscribe(function (event) {
      console.log('Router event', event)
      if (event instanceof NavigationStart) {
        console.log('Router event.url', event.url)
        tr = transactionService.startTransaction(event.url, 'transaction')
      }
      else if (event instanceof NavigationEnd || event instanceof NavigationError) {
        tr.detectFinish()
      }
    })
  }
}