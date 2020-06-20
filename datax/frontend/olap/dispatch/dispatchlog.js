
var app = angular.module('monitor', ['ui.bootstrap']);

app.controller('monitorController', function ($scope, $timeout, $http, $uibModal, $interval, $window, $document, $sce) {

    $scope.dispatchLogs = [];

    $scope.curPage = 1;
    $scope.pageSize = 20;
    $scope.loadCount = 0;
    $scope.total = 0;
    $scope.search = '';

    $scope.getDispatchData = function (initType) {
        var status = null;
        if ((initType && initType == 'all') || ($scope.successDataStatus && $scope.errorDataStatus)){
            status = 'all';
        }else if ($scope.successDataStatus) {
            status = 'success';
        }else if ($scope.errorDataStatus) {
            status = 'error';
        }else{//如果两个都不勾选那就显示为空
            dispatchLogs = [];
            return;
        }
        var key = $scope.searchkey;
        $http({
            method: 'POST',
            url: '/api/olap/getDispatchLogs',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                page: $scope.curPage,
                limit: $scope.pageSize,
                search: $scope.search,
                status:status
            }
        }).success(function (rs) {
            if (rs.status == "success") {
                $scope.curPage = $scope.curPage + 1;
                $scope.total = rs.total;
                $scope.loadCount = $scope.loadCount + rs.rows.length;
                rs.rows.forEach(function (value, index, array) {
                    if (value.options) {
                        var rowOptions = JSON.parse(value.options);
                        value['historyRecords'] = rowOptions.historyRecords.reverse();
                    } else {
                        value['historyRecords'] = []
                    }
                    $scope.dispatchLogs.push(value);
                });
            }
        });
    };
    $scope.getDispatchData('all');

    $scope.searchLogs = function () {
        $scope.curPage = 1;
        $scope.loadCount = 0;
        $scope.dispatchLogs = [];
        $scope.getDispatchData();
    };

    $scope.loadMore = function () {
        if ($scope.loadCount < $scope.total) {
            $scope.getDispatchData();
        }
    }

});

app.directive('whenScrolled', function() {  
    return function(scope, elm, attr) {  
        // 内层DIV的滚动加载  
        var raw = elm[0];  
        elm.bind('scroll', function() { 
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) { 
                scope.$apply(attr.whenScrolled);  
            };  
        });  
    };  
});

app.directive('resize', function ($window) {
    return function (scope) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return { 'h': w.height(), 'w': w.width() };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            scope.style = function () {
                return {
                    'height': (newValue.h - 50) + 'px'
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});

app.filter('dateFtt', function() { //可以注入依赖
    return function(text) {
        return dateFtt("yyyy-MM-dd hh:mm:ss", new Date(text));
    }
});