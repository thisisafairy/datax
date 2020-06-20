(function () {
    "use strict";
    var app = angular.module('scenesConfigApp', ['dataxUtils', 'dataxUI']);
    /**
     * 
     * @author sola
     * @created 2019/06/04 11:59:43
     */
    app.controller('scenesConfigController', function ($scope, dxHttp, $timeout, $compile, $http) {
        var vm = $scope
        vm.mbTheme = [
            {'code': 'simple', 'name': '精简'},
            {'code': 'traditional', 'name': '传统'}
        ]
        vm.scenesConfig = {
            'theme': ''
        }
    })
})()
