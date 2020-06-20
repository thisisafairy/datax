
var app = angular.module('datapermtaglist', ['ui.bootstrap', 'ngMaterial', 'commonHeader']);
app.controller('datapermtagController', function ($scope, $http, $uibModal,$mdDialog) {
    $scope.open = function () {
        var id = "0";
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/utagadd',
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl',
            resolve: {
                id: function () {
                    return id;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.getdata(1);
        }, function () {
        });
    };
    $scope.edit = function (id) {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/utagadd',
            controller: 'ModalInstanceCtrl',
            controllerAs: '$ctrl',
            resolve: {
                id: function () {
                    return id;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.getdata(1);
        }, function () {
        });
    };
    // 数据标签删除
    $scope.delete = function (value) {
        var a = confirm("是否删除:'" + value.tagname + "'?");
        if (a) {
            $http.post('/api/dash/deletedatapermtag',{
                'id': value.id
            }).then(function (rs) {
                if (rs.data.status == 'success'){
                    $scope.getdata(1);
                }else {
                    mdWarningAlert($mdDialog, null, 'datapermtaglist', rs.data.data)
                }
            }, function (error) {mdErrorAlert($mdDialog, null, 'datapermtaglist', error)});
        }
        else {
            return false;
        }
    };


    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function () {
        $scope.getdata($scope.currentPage);
    };
    //获取所有数据标签
    $scope.getdata = function (page) {
        var key = $scope.searchkey;
        var url = '/api/dash/getDataPerTag/?page=' + page;
        if (key != '') {
            url = url + "&search=" + key;
        }
        $http.get(url).then(function (rs) {
            if (rs.data.status == 'success'){
                $scope.lists = rs.data.rows;
                $scope.totalItems = rs.data.total;
            }else {
                mdWarningAlert($mdDialog, null, 'datapermtaglist', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'datapermtaglist', error)});
    };
    $scope.getdata(1);
    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 500);
});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope,$timeout,$mdDialog, $http, $uibModalInstance, id) {
    $scope.errorflag = false;
    $scope.checking = false;
    if (id != "0") {
        $http.get('/api/dash/datapermtagview?id=' + id).then(function (response) {
            $scope.datatag = response.data.data;
        });
        $scope.modeltitle = '编辑数据标签';
    }
    else {
        $scope.modeltitle = '新增数据标签';
    }

    $scope.ok = function () {
        // var dt = $("#addForm").serialize();
        dt={"id":$scope.datatag.id,
            "tagname":$scope.datatag.tagname,
            "tagremark":$scope.datatag.tagremark
        };
        // 新增数据标签
        $http.post('/api/dash/datapermtagadd',dt).then(function (rs) {
            if (rs.data.status == 'success'){
                if (rs.data.code == '1') {
                    $uibModalInstance.close();
                }else {
                    $scope.errorflag = true;
                }
            }else {
                mdWarningAlert($mdDialog, null, 'addForm', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'addForm', error)})
    };

    $scope.checktagname = function () {
        $scope.checking = true;
        $scope.errorflag = false;
        $scope.tablevalidatemsg = '';
        $scope.checkfun();
    };
    $scope.checkfun = _.debounce(function () {
        // 标签是否重复
        $http({
            method: 'POST',
            url: '/api/dash/checktagname',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                name: $scope.datatag.tagname,
                id: id
            }
        }).then(function (rs) {
            if (rs.data.status == 'success'){
                $scope.checking = false;
                if (rs.data.code == '0'){
                    $scope.datatagmsg = rs.data.msg;
                    $scope.errorflag = true;
                }
            }else {
                mdWarningAlert($mdDialog, null, 'addForm', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'addForm', error)})
    }, 200);
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});



