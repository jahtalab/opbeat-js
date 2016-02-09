// var utils = require('../utils')
var patchFn = require('../../patching-utils/functions')

module.exports = function ($provide, traceBuffer, spec) {
  // todo this instrumentation fails if ngResource doesn't exist, or referenced after opbeat module
  // todo should check if performance monitoring is enabled on caller function
  // todo this is not good place to check if opbeat is installed
  // todo make resource instrumentation testable

  // var self = this
  // var logger = spec.logger
  // var config = spec.config

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

      var zone = {
        traceName: name,
        traceType: options.type,
        traceBuffer: options.traceBuffer,
        options: options,
        beforeTask: instrumentMethodBefore,
        afterTask: instrumentMethodAfter
      }

      patchFn(result, ['get'], zone)
      return result
    }
    return opbeatInstrumentInstanceWrapperFunction
  }])
}

// function getFunctionName (fn) {
//   if (typeof fn === 'function' && typeof fn.name === 'string') {
//     return fn.name
//   }
// }

// function getArrayArguments (argsObj) {
//   var args = new Array(argsObj.length)
//   for (var i = 0, l = argsObj.length; i < l; i++) {
//     args[i] = argsObj[i]
//   }
//   return args
// }

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
