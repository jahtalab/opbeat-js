var patchUtils = require('./patchUtils')

var opbeatSymbol = patchUtils.opbeatSymbol

var XHR_TASK = opbeatSymbol('xhrTask')
var urlSympbol = opbeatSymbol('url')
var methodSymbol = opbeatSymbol('method')
var isAsyncSymbol = opbeatSymbol('isAsync')

function XHRPatch (spec) {
  this.onScheduleTask = spec.onScheduleTask
  this.onCancelTask = spec.onCancelTask
  this.onInvokeTask = spec.onInvokeTask
}

XHRPatch.prototype.applyPatch = function () {
  var xhrPatch = this
  patchUtils.patchMethod(window.XMLHttpRequest.prototype, 'send', function (delegate) {
    return function (self, args) {
      var task = {
        source: 'XMLHttpRequest.send',
        target: self
      }
      self[XHR_TASK] = task
      self.addEventListener('readystatechange', function () {
        if (self.readyState === window.XMLHttpRequest.DONE) {
          if (!task.aborted) {
            xhrPatch.onInvokeTask(task)
          }
        }
      })
      xhrPatch.onScheduleTask(task)
      delegate.apply(self, args)
    }
  })

  patchUtils.patchMethod(window.XMLHttpRequest.prototype, 'abort', function (delegate) {
    return function (self, args) {
      var task = self[XHR_TASK]
      task.aborted = true
      xhrPatch.onCancelTask(task)
      delegate.apply(self, args)
    }
  })

  patchUtils.patchMethod(window.XMLHttpRequest.prototype, 'open', function (delegate) {
    return function (self, args) {
      self[methodSymbol] = args[0]
      self[urlSympbol] = args[1]
      self[isAsyncSymbol] = args[2]
      delegate.apply(self, args)
    }
  })

  this.patchEventTargetMethods(window.XMLHttpRequest.prototype)
}

// / event listeners patch

var ADD_EVENT_LISTENER = 'addEventListener'
var REMOVE_EVENT_LISTENER = 'removeEventListener'

XHRPatch.prototype.patchEventTargetMethods = function patchEventTargetMethods (obj) {
  var xhrPatch = this
  var _global = window

  if (obj && obj.addEventListener) {
    patchUtils.patchMethod(obj, ADD_EVENT_LISTENER, function () {
      // return function (self, args) {
      //   console.log('addEventListener ', self, args)
      // }
      return zoneAwareAddEventListener
    })
    patchUtils.patchMethod(obj, REMOVE_EVENT_LISTENER, function () {
      // return function (self, args) {
      //   console.log('removeEventListener ', self, args)
      // }
      return zoneAwareRemoveEventListener
    })
    return true
  } else {
    return false
  }

  function zoneAwareAddEventListener (self, args) {
    var eventName = args[0]
    var handler = args[1]
    var useCapturing = args[2] || false
    // - Inside a Web Worker, `this` is undefined, the context is `global`
    // - When `addEventListener` is called on the global context in strict mode, `this` is undefined
    // see https://github.com/angular/zone.js/issues/190
    var target = self || _global
    var delegate = null
    if (typeof handler === 'function') {
      delegate = handler
    } else if (handler && handler.handleEvent) {
      delegate = function (event) { return handler.handleEvent(event) }
    }
    var validZoneHandler = false
    try {
      // In cross site contexts (such as WebDriver frameworks like Selenium),
      // accessing the handler object here will cause an exception to be thrown which
      // will fail tests prematurely.
      validZoneHandler = handler && handler.toString() === '[object FunctionWrapper]'
    } catch (e) {
      // Returning nothing here is fine, because objects in a cross-site context are unusable
      return
    }
    // Ignore special listeners of IE11 & Edge dev tools, see https://github.com/angular/zone.js/issues/150
    if (!delegate || validZoneHandler) {
      return target[SYMBOL_ADD_EVENT_LISTENER](eventName, handler, useCapturing)
    }
    var eventTask = findExistingRegisteredTask(target, handler, eventName, useCapturing, false)
    if (eventTask) {
      // we already registered, so this will have noop.
      return target[SYMBOL_ADD_EVENT_LISTENER](eventName, eventTask.invoke, useCapturing)
    }
    // var zone = Zone.current
    var source = target.constructor['name'] + '.addEventListener:' + eventName
    // var data = {
    //   target: target,
    //   eventName: eventName,
    //   name: eventName,
    //   useCapturing: useCapturing,
    //   handler: handler
    // }

    var task = {
      source: source,
      target: target,
      eventName: eventName,
      name: eventName,
      useCapturing: useCapturing,
      handler: handler,
      callback: delegate,
      invoke: function () {
        console.log('task.invoke', this, args)
        task.callback.apply(this, args)
        xhrPatch.onScheduleTask(task)
      }
    }
    scheduleEventListener(task)
  // zone.scheduleEventTask(source, delegate, data, scheduleEventListener, cancelEventListener)
  }

  function zoneAwareRemoveEventListener (self, args) {
    var eventName = args[0]
    var handler = args[1]
    var useCapturing = args[2] || false
    // - Inside a Web Worker, `this` is undefined, the context is `global`
    // - When `addEventListener` is called on the global context in strict mode, `this` is undefined
    // see https://github.com/angular/zone.js/issues/190
    var target = self || _global
    var eventTask = findExistingRegisteredTask(target, handler, eventName, useCapturing, true)
    if (eventTask) {
      // eventTask.zone.cancelTask(eventTask)
      cancelEventListener(eventTask)
    } else {
      target[SYMBOL_REMOVE_EVENT_LISTENER](eventName, handler, useCapturing)
    }
  }
}

var EVENT_TASKS = opbeatSymbol('eventTasks')
var SYMBOL_ADD_EVENT_LISTENER = opbeatSymbol(ADD_EVENT_LISTENER)
var SYMBOL_REMOVE_EVENT_LISTENER = opbeatSymbol(REMOVE_EVENT_LISTENER)

function findExistingRegisteredTask (target, handler, name, capture, remove) {
  var eventTasks = target[EVENT_TASKS]
  if (eventTasks) {
    for (var i = 0; i < eventTasks.length; i++) {
      var eventTask = eventTasks[i]
      var data = eventTask
      if (data.handler === handler && data.useCapturing === capture && data.eventName === name) {
        if (remove) {
          eventTasks.splice(i, 1)
        }
        return eventTask
      }
    }
  }
  return null
}

function attachRegisteredEvent (target, eventTask) {
  var eventTasks = target[EVENT_TASKS]
  if (!eventTasks) {
    eventTasks = target[EVENT_TASKS] = []
  }
  eventTasks.push(eventTask)
}

function scheduleEventListener (eventTask) {
  var meta = eventTask
  attachRegisteredEvent(meta.target, eventTask)
  return meta.target[SYMBOL_ADD_EVENT_LISTENER](meta.eventName, eventTask.invoke, meta.useCapturing)
}
function cancelEventListener (eventTask) {
  var meta = eventTask
  findExistingRegisteredTask(meta.target, eventTask.invoke, meta.eventName, meta.useCapturing, true)
  meta.target[SYMBOL_REMOVE_EVENT_LISTENER](meta.eventName, eventTask.invoke, meta.useCapturing)
}

// var patch = new XHRPatch({
//   onScheduleTask: createLogFn('onScheduleTask'),
//   onCancelTask: createLogFn('onCancelTask'),
//   onInvokeTask: createLogFn('onInvokeTask')
// })

// patch.applyPatch()
// function createLogFn (name) {
//   return function (task) {
//     console.log(name + ' ' + task.source + ' ' + task.target[methodSymbol] + ' ' + task.target[urlSympbol] + ' isAsync: ' + task.target[isAsyncSymbol])
//   }
// }

module.exports = XHRPatch
