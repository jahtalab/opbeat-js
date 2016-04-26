var Zone = require('./zone')

function ZoneService (transactionService) {
  this.transactionService = transactionService
  this.zone = new Zone(null, {

  })
}

ZoneService.prototype.getRootZone = function (spec) {
  return new Zone(spec)
}

ZoneService.prototype.createTraceZone = function createTraceZone (options) {
  var zone = new Zone()
  var self = this
  zone.beforeTask = function () {
    var transaction = self.transactionService.getCurrentTransaction()
    if (transaction) {
      var trace = transaction.startTrace(options.traceName, options.traceType, options)
      zone.trace = trace
    }
  }

  zone.afterTask = function () {
    if (zone.trace) {
      zone.trace.end()
    }
  }
  return zone
}

module.exports = ZoneService
