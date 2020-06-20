agGrid.initialiseAgGridWithAngular1(angular);

var app = angular.module('mainApp', ['ui.bootstrap', 'agGrid','tableDataReport']);
(function() {
    'use strict';

    function mainController ($rootScope, $scope, $http, $window, $timeout) {
        var vm = $scope;
        $scope.changedData = [];
        $scope.tableStructId = "0f8648122ea611e9a507acd1b8a40b22";

        // get method
        vm.testGet = function () {
            console.log('----$scope.changedData=',$scope.changedData);

            $http.get('/ex/testGetMethod').then(function (rs) {
                console.log('get方法返回格式：', rs)
                if (rs.data.status == 'success') {
                    messageBox.alert('get方法测试成功,已经console.log打印数据')
                }
            })
        }

        // post method
        vm.saveTheChangedData = function () {
            console.log('--saveTheChangedData--$scope.changedData=',$scope.changedData);

            $http({
                method: 'post',
                url: "/ex/saveChangedData",
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    changeddata:$scope.changedData,
                    tableid:$scope.tableStructId,
                }
            }).success(function (rs) {
                console.log('post方法返回格式：', rs)
                if (rs.status == 'success') {
                    messageBox.alert('成功更新 ' + rs.updatedCount + ' 条数据！');
                }else{
                    messageBox.alertBox({'msg':rs.data});
                }
            }) 
        }

    }

    app.controller('mainController', mainController);

    app.directive('resize', function ($window, $rootScope) {
        return function (scope) {
            var w = angular.element($window);
            scope.getWindowDimensions = function () {
                return { 'h': w.height() - 40, 'w': w.width() };
            };
            scope.$watch(scope.getWindowDimensions, function (newValue) {
                scope.windowHeight = newValue.h;
                scope.windowWidth = newValue.w;

                scope.style = function () {
                    return {
                        'height': newValue.h + 'px'
                    };
                };

            }, true);
            w.bind('resize', function () {
                scope.$apply();
            });
        };
    });

})()