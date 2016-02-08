var utils = require('../utils')

module.exports = function ($provide, traceBuffer, spec) {
  try {
    // todo this instrumentation fails if ngResource doesn't exist, or referenced after opbeat module
    // todo should check if performance monitoring is enabled on caller function
    // todo this is not good place to check if opbeat is installed
    // todo make resource instrumentation testable

    var self = this
    var logger = spec.logger
    var config = spec.config

    // if (!config.get('isInstalled')) {
    //   logger.log('opbeat.instrumentation.instrumentModule.not.installed')
    //   return $delegate
    // }

    // if (!config.get('performance.enable')) {
    //   logger.log('- %c opbeat.instrumentation.instrumentModule.disabled', 'color: #3360A3')
    //   return $delegate
    // }

    // ngResource instrumentation
    
    

    
    
    $provide.decorator('$resource', ['$delegate', '$injector', function ($delegate, $injector) {
      var options = {
        traceBuffer: traceBuffer,
        prefix: '$resource',
        type: 'ext.$resource',
        signatureFormatter: function (key, args) {
          var url = (typeof args[0] === 'string') ? args[0] : options.wrapper.args[0]
          return ['$resource', key.toUpperCase(), url].join(' ')
        }
      }
      
      var nameParts = []
      nameParts.push(options.prefix)
      nameParts.push(options.type)
      
      var name = nameParts.join('.')
        
      var opbeatInstrumentInstanceWrapperFunction = function () {
        var args = Array.prototype.slice.call(arguments)
        var result = $delegate.apply(this, args)
        options.wrapper = {
          args: args
        }

        self.instrumentObject(result, $injector, options)
        
        var zone = {
          traceName: name,
          traceType: traceType,
          traceBuffer: options.traceBuffer,
          options: options,
          fn: fn,
          fnName: fnName,
          beforeTask:function(){
            console.log('beforeTask')
          },
          afterTask:function(){
            console.log('afterTask')
          }
        }
        var patchFn = require('../../patching-utils/functions')
        patchFn(result,['get'],zone)
        return result
      }
      return opbeatInstrumentInstanceWrapperFunction
    }])
  } catch (e) {}
}

function getFunctionName (fn) {
  if (typeof fn === 'function' && typeof fn.name === 'string') {
    return fn.name
}

function wrapMethod (_opbeatOriginalFunction, _opbeatBefore, _opbeatAfter, _opbeatContext) {
  var context = {
    _opbeatOriginalFunction: _opbeatOriginalFunction,
    _opbeatBefore: _opbeatBefore,
    _opbeatAfter: _opbeatAfter,
    _opbeatContext: _opbeatContext
  }

  return wrapFn(context)
}

function getArrayArguments (argsObj) {
  var args = new Array(argsObj.length)
  for (var i = 0, l = argsObj.length; i < l; i++) {
    args[i] = argsObj[i]
  }
  return args
}

function instrumentMethodBefore (context) {
  // Optimized copy of arguments (V8 https://github.com/GoogleChrome/devtools-docs/issues/53#issuecomment-51941358)
  var args = new Array(arguments.length)
  for (var i = 0, l = arguments.length; i < l; i++) {
    args[i] = arguments[i]
  }

  args = args.slice(1)

  var name = context.traceName
  var transactionStore = context.transactionStore

  var transaction = transactionStore.getRecentByUrl(window.location.href)
  if (!transaction && context.traceBuffer && !context.traceBuffer.isLocked()) {
    transaction = context.traceBuffer
  }

  if (context.options.signatureFormatter) {
    name = context.options.signatureFormatter.apply(this, [context.fnName, args, context.options])
  }

  if (transaction) {
    var trace = transaction.startTrace(name, context.traceType, context.options)
    context.trace = trace
  } else {
    logger.log('%c instrumentMethodBefore.error.transaction.missing', 'background-color: #ffff00', context)
  }

  return {
    args: args
  }
}

function instrumentMethodAfter (context) {
  if (context.trace) {
    context.trace.end()
  }
}

function wrapFn (ctx) {
  var _opbeatOriginalFunction = ctx['_opbeatOriginalFunction']
  var _opbeatBefore = ctx['_opbeatBefore']
  var _opbeatAfter = ctx['_opbeatAfter']
  var _opbeatContext = ctx['_opbeatContext']

  function opbeatFunctionWrapper () {
    var args = new Array(arguments.length)
    for (var i = 0, l = arguments.length; i < l; i++) {
      args[i] = arguments[i]
    }
    var zone = Object.create(_opbeatContext) // new zone for every call
    // Before callback
    if (typeof _opbeatBefore === 'function') {
      var beforeData = _opbeatBefore.apply(this, [zone].concat(args))
      if (beforeData.args) {
        args = beforeData.args
      }
    }
    // Execute original function
    var result = _opbeatOriginalFunction.apply(this, args)
    // After callback
    if (typeof _opbeatAfter === 'function') {
      // After + Promise handling
      if (result && typeof result.then === 'function') {
        result.finally(function () {
          _opbeatAfter.apply(this, [zone].concat(args))
        }.bind(this))
      } else {
        _opbeatAfter.apply(this, [zone].concat(args))
      }
    }
    return result
  }

  if (typeof _opbeatOriginalFunction.$inject === 'undefined') {
    opbeatFunctionWrapper.$inject = getAnnotation(_opbeatOriginalFunction)
  } else {
    opbeatFunctionWrapper.$inject = _opbeatOriginalFunction.$inject
  }
  return opbeatFunctionWrapper
}

// source: angular.js injector

var ARROW_ARG = /^([^\(]+?)=>/
var FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m
var FN_ARG_SPLIT = /,/
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg

function extractArgs (fn) {
  var fnText = fn.toString().replace(STRIP_COMMENTS, '')
  var args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS)
  return args
}

function getAnnotation (fn) {
  var $inject
  var argDecl

  if (typeof fn === 'function') {
    if (!($inject = fn.$inject)) {
      $inject = []
      if (fn.length) {
        argDecl = extractArgs(fn)
        argDecl[1].split(FN_ARG_SPLIT).forEach(function (arg) {
          arg.replace(FN_ARG, function (all, underscore, name) {
            $inject.push(name)
          })
        })
      }
    }
  } else {
    //    throw  'Argument is not a function'
  }
  return $inject
}
