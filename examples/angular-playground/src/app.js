var app = angular.module('app', ['ngRoute', 'ngOpbeat'])

app.config(function ($routeProvider) {
  var routeConfig = {
    controller: 'MainCtrl',
    template: '<div ng-bind="test"></div>'
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

app.controller('MainCtrl', function mainCtrl ($scope, $http) {
  $scope.test = 'passed'
  $http.get('src/response.json').then(function () {
    $scope.done = 'done'
  })
})
