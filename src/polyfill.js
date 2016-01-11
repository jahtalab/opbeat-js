/*eslint-disable */

// For now this is only used for testing purposes. for production, side effects should be evaluated.
// Note that this file doesn't fill anything this is merely the implementation of polyfills 

module.exports = {
  // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
  functionBind: function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () { },
      fBound = function () {
        return fToBind.apply(this instanceof fNOP
          ? this
          : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    if (this.prototype) {
      // native functions don't have a prototype
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  }
};

// if (!Function.prototype.bind) {
//   Function.prototype.bind = module.exports.functionBind;
// }