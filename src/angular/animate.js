var utils = require('../instrumentation/utils')
module.exports = function ($provide, traceBuffer) {
  // $provide.decorator('$animate', ['$delegate', function ($delegate) {
  //   var _enter = $delegate.enter
  //   $delegate.enter = function () {
  //     console.log('animation started')

  //     var result = _enter.apply(this, arguments)
  //     function animationEnded () {
  //       console.log('animation ended')
  //     }
  //     result.then(animationEnded, animationEnded)
  //     return result
  //   }
  //   return $delegate
  // }])

  $provide.decorator('$animate', ['$delegate', '$injector', function ($delegate, $injector) {
    return utils.instrumentModule($delegate, $injector, {
      type: '$animate',
      prefix: '$animate',
      instrumentConstructor: false,
      traceBuffer: traceBuffer,
      signatureFormatter: function (key, args) {
        var text = ['$animate']
        text.push(key)
        // if (args.length) {
        //   if (args[0] !== null && typeof args[0] === 'object') {
        //     if (!args[0].method) {
        //       args[0].method = 'get'
        //     }
        //     text = ['$http', args[0].method.toUpperCase(), args[0].url]
        //   } else if (typeof args[0] === 'string') {
        //     text = ['$http', args[0]]
        //   }
        // }
        return text.join(' ')
      }
    })
  }])
}
