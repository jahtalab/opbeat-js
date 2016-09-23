var Transaction = require('./transaction')
var utils = require('../lib/utils')
var Subscription = require('../common/subscription')

function TransactionService (zoneService, logger, config, opbeatBackend) {
  this._config = config
  if (typeof config === 'undefined') {
    logger.debug('TransactionService: config is not provided')
  }
  this._queue = []
  this._logger = logger
  this._opbeatBackend = opbeatBackend
  this._zoneService = zoneService

  this.transactions = []
  this.nextId = 1

  this.taskMap = {}

  this._queue = []

  this._subscription = new Subscription()

  var transactionService = this

  function onBeforeInvokeTask (task) {
    if (task.source === 'XMLHttpRequest.send' && task.trace && !task.trace.ended) {
      task.trace.end()
    }
  }
  zoneService.spec.onBeforeInvokeTask = onBeforeInvokeTask

  function onScheduleTask (task) {
    if (task.source === 'XMLHttpRequest.send') {
      var method = task['XHR']['method'] || ''
      var url = task['XHR']['url'] || ''
      var trName = method + ' ' + url

      if (method === '' && url === '') {
        trName = 'HttpRequest'
      }

      var trace = transactionService.startTrace(trName, 'ext.HttpRequest', {'enableStackFrames': false})
      task.trace = trace
    }
    transactionService.addTask(task.taskId)
  }
  zoneService.spec.onScheduleTask = onScheduleTask

  function onInvokeTask (task) {
    transactionService.removeTask(task.taskId)
    transactionService.detectFinish()
  }
  zoneService.spec.onInvokeTask = onInvokeTask

  function onCancelTask (task) {
    transactionService.removeTask(task.taskId)
    transactionService.detectFinish()
  }
  zoneService.spec.onCancelTask = onCancelTask
}

TransactionService.prototype.getTransaction = function (id) {
  return this.transactions[id]
}

TransactionService.prototype.createTransaction = function (name, type, options) {
  var tr = new Transaction(name, type, options)
  this._zoneService.set('transaction', tr)
  if (this._config.get('performance.checkBrowserResponsiveness')) {
    this.startCounter(tr)
  }
  return tr
}

TransactionService.prototype.startCounter = function (transaction) {
  transaction.browserResponsivenessCounter = 0
  var interval = this._config.get('performance.browserResponsivenessInterval')
  if (typeof interval === 'undefined') {
    this._logger.debug('browserResponsivenessInterval is undefined!')
    return
  }
  this._zoneService.runOuter(function () {
    var id = setInterval(function () {
      if (transaction.ended) {
        window.clearInterval(id)
      } else {
        transaction.browserResponsivenessCounter++
      }
    }, interval)
  })
}

TransactionService.prototype.getCurrentTransaction = function () {
  var tr = this._zoneService.get('transaction')
  if (!utils.isUndefined(tr) && !tr.ended) {
    return tr
  }
}

TransactionService.prototype.startTransaction = function (name, type) {
  var self = this

  var perfOptions = this._config.get('performance')
  if (!perfOptions.enable) {
    return
  }

  if (type === 'interaction' && !perfOptions.captureInteractions) {
    return
  }

  var tr = this._zoneService.get('transaction')
  if (!this.getCurrentTransaction()) {
    tr = this.createTransaction(name, type, perfOptions)
  } else {
    tr.name = name
    tr.type = type
    tr._options = perfOptions
  }

  if (this.transactions.indexOf(tr) === -1) {
    this._logger.debug('TransactionService.startTransaction', tr)
    var p = tr.donePromise
    p.then(function (t) {
      self._logger.debug('TransactionService transaction finished', tr)
      self.add(tr)
      self._subscription.applyAll(self, [tr])

      var index = self.transactions.indexOf(tr)
      if (index !== -1) {
        self.transactions.splice(index, 1)
      }
    })
    this.transactions.push(tr)
  }

  return tr
}

TransactionService.prototype.startTrace = function (signature, type, options) {
  var perfOptions = this._config.get('performance')
  if (!perfOptions.enable) {
    return
  }

  var trans = this.getCurrentTransaction()

  if (trans) {
    this._logger.debug('TransactionService.startTrace', signature, type)
  } else {
    trans = this.createTransaction('ZoneTransaction', 'transaction', perfOptions)
    this._logger.debug('TransactionService.startTrace - ZoneTransaction', signature, type)
  }

  var trace = trans.startTrace(signature, type, options)
  // var zone = this._zoneService.getCurrentZone()
  // trace._zone = 'Zone(' + zone.$id + ') ' // parent(' + zone.parent.$id + ') '
  return trace
}

// !!DEPRECATED!!
TransactionService.prototype.isLocked = function () {
  return false
}

TransactionService.prototype.add = function (transaction) {
  var perfOptions = this._config.get('performance')
  if (!perfOptions.enable) {
    return
  }

  this._queue.push(transaction)
  this._logger.debug('TransactionService.add', transaction)
}

TransactionService.prototype.getTransactions = function () {
  return this._queue
}

TransactionService.prototype.clearTransactions = function () {
  this._queue = []
}

TransactionService.prototype.subscribe = function (fn) {
  return this._subscription.subscribe(fn)
}

TransactionService.prototype.addTask = function (taskId) {
  var tr = this._zoneService.get('transaction')
  if (!utils.isUndefined(tr) && !tr.ended) {
    tr.addTask(taskId)
    this._logger.debug('TransactionService.addTask', taskId)
  }
}
TransactionService.prototype.removeTask = function (taskId) {
  var tr = this._zoneService.get('transaction')
  if (!utils.isUndefined(tr) && !tr.ended) {
    tr.removeTask(taskId)
    this._logger.debug('TransactionService.removeTask', taskId)
  }
}

TransactionService.prototype.detectFinish = function () {
  var tr = this._zoneService.get('transaction')
  if (!utils.isUndefined(tr) && !tr.ended) {
    tr.detectFinish()
    this._logger.debug('TransactionService.detectFinish')
  }
}

TransactionService.prototype.scheduleTransactionSend = function () {
  var logger = this._logger
  var opbeatBackend = this._opbeatBackend
  var self = this

  setInterval(function () {
    var transactions = self.getTransactions()
    if (transactions.length === 0) {
      return
    }
    logger.debug('Sending Transactions to opbeat.', transactions.length)
    // todo: if transactions are already being sent, should check
    opbeatBackend.sendTransactions(transactions)
    self.clearTransactions()
  }, 5000)
}

module.exports = TransactionService
