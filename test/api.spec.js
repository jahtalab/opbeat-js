var API = require('../src/lib/api')
var polyfill = require('../src/polyfill')

describe('api', function () {
  var opbeat
  var api
  // todo: should test security propblems with running every command possible.
  // todo: security problem of executing string commands
  beforeEach(function () {
    opbeat = jasmine.createSpyObj('opbeat', ['command'])
    api = new API(opbeat, [])
  })

  it('should initialize api with queued commands and execute immediately', function () {
    // todo(refactor) this is a bad practice, shouldn't take actions while constructing, should refactor to a separate method
    var api = new API(opbeat, [['command', 'firstParam', 'secondParam']])  // eslint-disable-line no-unused-vars
    expect(opbeat.command).toHaveBeenCalledWith('firstParam', 'secondParam')
  })

  xit('should throw exception if command does not exist or is not a function', function () {
    var opbeat = { 'justString': 'justString', command: function () { } }
    var api = new API(opbeat, [])

    var commandFn = polyfill.functionBind.apply(api.push, [api, 'command', 'firstParam', 'secondParam'])
    expect(commandFn).not.toThrow()

    var nonexistentFn = polyfill.functionBind.apply(api.push, [api, 'nonexistent'])
    expect(nonexistentFn).toThrowError('Command does not exists')

    var stringFn = polyfill.functionBind.apply(api.push, [api, 'justString'])
    expect(stringFn).toThrowError('Command does not exists')
  })

  it('should execute "command" with correct parameters', function () {
    api.push('command', 'firstParam', 'secondParam')
    expect(opbeat.command).toHaveBeenCalledWith('firstParam', 'secondParam')
  })
})
