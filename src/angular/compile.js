var patchUtils = require('../patchUtils')

module.exports = function ($provide, zoneService) {
  // Template Compile Instrumentation
  $provide.decorator('$compile', ['$delegate', '$injector', function ($delegate, $injector) {
    var nameParts = []
    var options = {
      type: 'template.$compile',
      prefix: '$compile'
    }

    nameParts.push(options.prefix)
    nameParts.push('compile')

    options.traceName = nameParts.join('.')
    options.traceType = options.type

    function compile () {
      var zone = zoneService.createTraceZone(options)
      return zone.run($delegate, this, arguments)
    }

    patchUtils._copyProperties($delegate, compile)

    return compile
  }])
}
