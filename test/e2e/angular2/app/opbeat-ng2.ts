import { Router, NavigationStart } from '@angular/router';
import { Injectable } from '@angular/core';
import {ServiceFactory} from '../../../src/common/serviceFactory'
// var ServiceFactory = require('../../../src/common/serviceFactory.js')

@Injectable()
export class Opbeat {
  constructor(private router: Router) {
    console.log(ServiceFactory)

    router.events.subscribe(function (event) {
      if (event instanceof NavigationStart)
        console.log('Router event.url', event.url)
    })
  }
}