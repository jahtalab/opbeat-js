var app = angular.module('app', ['ngRoute', 'ngOpbeat'])

app.config(function ($routeProvider) {
  var routeConfig = {
    controller: 'MainCtrl',
    templateUrl: 'src/main_ctrl.html'
  }

  $routeProvider
    .when('/', routeConfig)
    .otherwise({
      redirectTo: '/'
    })
})

app.config(function ($opbeatProvider) {
  $opbeatProvider.config({
    debug: true,
    orgId: '7f9fa667d0a349dd8377bc740bcfc33e',
    appId: '0a8757798e',
    performance: {
      enable: true
    }
  })
})

app.controller('MainCtrl', function mainCtrl($scope, $http) {
  $scope.test = 'passed'
  // function testFn() { }
  // $scope.testFn = testFn
  // $scope.$watch(testFn, function (newVal, oldVal) {
  //   testFn()
  // })

  $http.get('src/response.json').then(function () {
    $scope.done = 'done'
  })
})


app.directive('customDirective', function () {
  return {
    template: '<div ng-bind="test"></div>',
    link: function link(scope, element, attrs, controller, transcludeFn) {
      scope.test = 'customDirective'
    }
  }
})


function startApp() {
  angular.bootstrap(document, ['app'])
}

var appZone = zone.fork({
  onZoneCreated: function () {

  },
  beforeTask: function () {

  },
  afterTask: function () {

  },
  onError: function () {

  },
  enqueueTask: function () {

  },
  dequeueTask: function () {

  },
  setTimeout: function () {

  },
  setInterval: function () {

  },
  alert: function () {

  },
  prompt: function () {

  }
})

appZone.run(startApp)
