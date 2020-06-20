var app = angular.module('visitloglist', ['ui.bootstrap']);
app.controller('visitLogListController', function ($scope, $http, $uibModal) {
    "use strict";
    //获取所有数据权限标签


    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function () {
        $scope.getdata($scope.currentPage);
    };
    $scope.getdata = function (page) {
        var key = $scope.searchkey;
        var url = '/api/dash/getUserVisitLogList?page=' + page;
        if (key != '') {
            url = encodeURI(url + "&search=" + key);//中文转码
        }
        $http.get(url).then(function (response) {
            console.log('---response=',response);
            if (response.data.status == 'success') {
                $scope.lists = response.data.data;
                $scope.totalItems = response.data.totalCount;
            } else {
                alert(rs.data);
            }
        });
    };
    $scope.getdata(1);
    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 500);

    $scope.delete = function (visitLog) {
        var permission = confirm("是否删除目标:'" + visitLog.targetname + "'的记录?");
        if (permission) {
            $http.get('/api/dash/deleteUserVisitLogById?id=' + visitLog.id).then(function (response) {
                if (response.data.status == 'success') {
                    $scope.getdata(1);
                } else {
                    alert(rs.data);
                }
            });
        }else {
            return false;
        }
    };
});
