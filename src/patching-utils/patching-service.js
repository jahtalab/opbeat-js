function ZoneService () {}
ZoneService.prototype.getCurrentZone = function () {}

function noop () {}
function Zone () {
  this.beforeTask = noop
  this.afterTask = noop
}

Zone.prototype.fork = function () {}
Zone.prototype.run = function () {}

function PatchingService (zoneService) {
  function patchFunction (obj, fnNames) {
    fnNames.forEach(function (name) {
      var zone = zoneService.getCurrentZone()
      var delegate = obj[name]
      obj[name] = function () {
        if (typeof zone.beforeTask === 'function') {
          zone.beforeTask.apply(zone, [zone])
        }
        var result = delegate.apply(obj, arguments)
        if (typeof zone.afterTask === 'function') {
          zone.afterTask.apply(zone, [zone])
        }
        return result
      }
    })
  }
}

module.exports = PatchingService
