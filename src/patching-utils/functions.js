function patchFunction (obj, fnNames, zone) {
  fnNames.forEach(function (name) {
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

module.exports = patchFunction
