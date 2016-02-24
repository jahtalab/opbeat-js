var appPatch = angular.module('appPatch', [])

// making a trace that makes it possible to manage trasactions and when render has ended and/or other phases of application
// var applicationService
// var transactionService
// var actionService

var zoneConfig = {
  count: 0,
  onZoneCreated: function () {
    console.log('onZoneCreated')
  },
  beforeTask: function () {
    var sig = zone.signature
    console.log('beforeTask ' + (typeof sig === 'undefined' ? '' : sig))
    console.log(++this.count)
  },
  afterTask: function () {
    var sig = zone.signature
    console.log('afterTask ' + (typeof sig === 'undefined' ? '' : sig))
    console.log(--this.count)
  },
  onError: function () {
    console.log('onError')
  },
  enqueueTask: function () {
    console.log('enqueueTask')
  },
  dequeueTask: function () {
    console.log('dequeueTask')
  },
  '-setTimeout': function () {
    console.log('setTimeout')
  },
  '-setInterval': function () {
    console.log('setInterval')
  },
  // alert: function () {
  //   console.log('alert')
  // },
  // prompt: function () {
  //   console.log('prompt')
  // },
  '-requestAnimationFrame': function () {
    console.log('requestAnimationFrame')
  },
  '-webkitRequestAnimationFrame': function () {
    console.log('webkitRequestAnimationFrame')
  },
  '-mozRequestAnimationFrame': function () {
    console.log('mozRequestAnimationFrame')
  }
}

appPatch.config(['$provide', function ($provide) {
  $provide.decorator('$controller', ['$delegate', function ($delegate) {
    return $delegate
  }])

  $provide.decorator('$rootScope', ['$delegate', function ($delegate) {
    return $delegate
  }])

  $provide.decorator('ngRepeatDirective', ['$delegate', function ($delegate) {
    var z = zone.fork()
    z.signature = 'ngRepeat'
    var ngRepeat = $delegate[0]
    var _compile = ngRepeat.compile
    ngRepeat.compile = function () {
      var result = _compile.apply(this, arguments)
      return z.bind(result)
    }
    // z.bind(ngRepeat.compile)
    return $delegate
  }])
  $provide.decorator('$animate', ['$delegate', function ($delegate) {
    var _enter = $delegate.enter
    $delegate.enter = function (elements) {
      // var event = animationEvent
      // elements[0].addEventListener(event, animationEnded)
      console.log('animation started')
      var result = _enter.apply(this, arguments)
      // [arguments[0], arguments[1], animationEnded, arguments[3]]
      function animationEnded () {
        // elements[0].removeEventListener(event, animationEnded)
        console.log('animation ended')
      }
      result.then(animationEnded, animationEnded)
      return result
    }
    return $delegate
  }])

  $provide.decorator('$q', ['$delegate', function ($delegate) {
    var _defer = $delegate.defer
    $delegate.defer = function () {
      var result = _defer.apply(this, arguments)
      return result
    }
    return $delegate
  }])

  $provide.decorator('$http', ['$delegate', '$injector', function ($delegate, $injector) {
    function bindPromiseFn (delegate) {
      return function () {
        return _patchThenable(delegate.apply(this, arguments))
      }
    }

    var _get = $delegate.get
    $delegate['get'] = function () {
      var z = zone.fork()
      z.signature = '$http.get.' + arguments[0]

      function zoneFn () {
        var result = _get.apply(this, arguments)
        _patchThenable(result)
        var fn = function () {}
        result.then(fn, fn)
        return result
      }

      return z.run(zoneFn, this, arguments)

    // return z.run(bindPromiseFn(_get), this, arguments)
    }
    // z.bind(bindPromiseFn($delegate['get']))
    // $delegate.get = function get () {
    //   var z = zone.fork(zoneConfig)
    //   z.signature = '$http.get.' + arguments[0]
    //   var result = z.run(_get, this, arguments)

    //   result.then = z.bind(result.then)
    //   // var self = this
    //   // var args = arguments
    //   // z.run(function () {
    //   //   result = _get.apply(self, args)
    //   //   return result
    //   // })
    //   return result
    // // return result
    // }
    return $delegate
  }])
}])
var appZone = zone.fork(zoneConfig)
appZone.signature = 'app'
angular.bootstrap = appZone.bind(angular.bootstrap)

function _patchThenable (thenable) {
  var then = thenable.then
  thenable.then = function () {
    var args = bindArguments(arguments)
    var nextThenable = then.apply(thenable, args)
    return _patchThenable(nextThenable)
  }

  var ocatch = thenable.catch
  thenable.catch = function () {
    var args = bindArguments(arguments)
    var nextThenable = ocatch.apply(thenable, args)
    return _patchThenable(nextThenable)
  }

  return thenable
}

var global = window
function bindArguments (args) {
  for (var i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'function') {
      args[i] = zone.bind(args[i])
    }
  }
  return args
}
