var XHRPatch = require('./XHRPatch')
var patchUtils = require('./patchUtils')

function PatchService (transactionService, logger) {
  this.transactionService = transactionService
  this.patchXHR()
}

PatchService.prototype.patchXHR = function () {
  var xhrNextId = 0
  var transactionService = this.transactionService

  var xhrPatch = new XHRPatch({
    onScheduleTask: function (task) {
      var url = task.target[patchUtils.opbeatSymbol('url')]
      var method = task.target[patchUtils.opbeatSymbol('method')]

      var signature = 'Http ' + method + ' ' + url
      task.trace = transactionService.startTrace(signature, 'ext.$http')

      task.xhrId = 'http' + xhrNextId
      xhrNextId++
      transactionService.addTask(task.xhrId)
    },
    onCancelTask: function (task) {
      if (task.trace) {
        task.trace.end()
      }
      transactionService.removeTask(task.xhrId)
    },
    onInvokeTask: function (task) {
      if (task.trace) {
        task.trace.end()
      }
      transactionService.removeTask(task.xhrId)
    }
  })

  xhrPatch.applyPatch()
}

module.exports = PatchService
