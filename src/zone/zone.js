function Zone (parentZone, data) {
  var zone = (arguments.length) ? Object.create(parentZone) : this

  zone.parent = parentZone || null

  Object.keys(data || {}).forEach(function (property) {
    var _property = property.substr(1)

    // augment the new zone with a hook decorates the parent's hook
    if (property[0] === '$') {
      zone[_property] = data[property](parentZone[_property] || function () {})

    // augment the new zone with a hook that runs after the parent's hook
    } else if (property[0] === '+') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          var result = parentZone[_property].apply(this, arguments)
          data[property].apply(this, arguments)
          return result
        }
      } else {
        zone[_property] = data[property]
      }

    // augment the new zone with a hook that runs before the parent's hook
    } else if (property[0] === '-') {
      if (parentZone[_property]) {
        zone[_property] = function () {
          data[property].apply(this, arguments)
          return parentZone[_property].apply(this, arguments)
        }
      } else {
        zone[_property] = data[property]
      }

    // set the new zone's hook (replacing the parent zone's)
    } else {
      zone[property] =
        (typeof data[property] === 'object')
          ? JSON.parse(JSON.stringify(data[property]))
          : data[property]
    }
  })

  return zone
}
Zone.prototype.bind = function bind (fn) {
  if (typeof fn !== 'function') {
    throw new Error('Expecting function got: ' + fn)
  }
  var zone = this
  return function zoneBoundFn () {
    return zone.run(fn, this, arguments)
  }
}

Zone.prototype.run = function run (fn, applyTo, applyWith) {
  applyWith = applyWith || []

  try {
    this.beforeTask()
    return fn.apply(applyTo, applyWith)
  } catch (e) {
    if (this.onError) {
      this.onError(e)
    } else {
      throw e
    }
  } finally {
    this.afterTask()
  }
}

Zone.prototype.fork = function (locals) {
  return new Zone(this, locals)
}

Zone.prototype.beforeTask = function () {}
Zone.prototype.afterTask = function () {}
Zone.prototype.onError = null

module.exports = Zone
