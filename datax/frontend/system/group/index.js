
var app =  angular.module('grouplist', ['ui.bootstrap', 'ngMaterial', 'commonHeader']);
app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});
app.controller("roleManagerListCtrl",function ($scope, $http, $uibModal,$mdDialog ) {
    //分页参数
    $scope.currentPageNum=10;
    $scope.totalItems={};
    //每页显示条数(默认10条)
    $scope.count="7";
    $scope.page = 1;
    $scope.param = {};
    $scope.data = {}; // 参数
    $scope.data.param = $scope.param;
    $scope.pagination = {};
    $scope.pagination.data = [];
    // 系统管理角色组管理
    $scope.queryList = function(page) {
        $scope.data.startIndex = (page - 1) * $scope.count;//分页起始位置
        $scope.data.count = $scope.count;//分页条数
        $scope.data.orderBy = "id ASC";//排序
        $http.get('/api/getgroup/?format=json',{
            params:{
                startIndex:$scope.data.startIndex,
                count:$scope.data.count,
                param:$scope.data.param,
            }
        }).then(function (rs) {
            if (rs.data.status=='success'){
                $scope.pagination.data = (rs.data.data);
                $scope.totalItems= rs.data.totalcount;
                $scope.time = new Date();
            }else{
                mdWarningAlert($mdDialog, null, 'roleManagerListCtrl', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'roleManagerListCtrl', error)});
    };
    // 获取所有组
    $scope.queryList($scope.page);
    $scope.add = function (size) {
         var modalInstance = $uibModal.open({
             templateUrl: 'myModalContent.html',
             controller: 'ModalInstanceCtrl',
             backdrop: "static",
             controllerAs: 'vm',
             size: size,
             resolve: {
                 itemC: function () {
                     return null;
                 }
             }
         });
         modalInstance.result.then(function (selectedItem) {
            $scope.queryList($scope.page);
         }, function () {
         });
     };
    $scope.editInfo = function (item) {
         var modalInstance = $uibModal.open({
             templateUrl: 'myModalContent.html',
             controller: 'ModalInstanceCtrl',
             backdrop: "static",
             controllerAs: 'vm',
             resolve: {
                 itemC: function () {
                     return item;
                 }
             }
         });
         modalInstance.result.then(function (selectedItem) {
            $scope.queryList($scope.page);
         }, function () {
         });
     };
    // 删除组
     $scope.removeRow = function (item) {
         if(!confirm('您确认要删除吗?'))return;
         $http.get('/api/delgroup/',{
             params:{
                 id:item.id
             }
         }).then(function (rs) {
             if (rs.data.status == 'success'){
                 $scope.queryList($scope.page);
             }else {
                 alert(rs.data.data)
             }
         }, function (error) {mdErrorAlert($mdDialog, null, 'roleManagerListCtrl', error)});
     };
     // 相关人员
     $scope.personSet = function (item) {

         $http.get('/api/getgroupuser/',{
             params:{
                 id:item.id
             }
         }).then(function (rs) {
             if (rs.data.status == 'success') {
                 rs.data["id"] = item.id;
                 rs.data["name"] = item.name;
                 // 弹窗内数据
                 var modalInstance = $uibModal.open({
                     templateUrl: 'myModalSetP.html',
                     controller: 'ModalInstanceCtrlSet',
                     backdrop: "static",
                     controllerAs: 'vm',
                     resolve: {
                         itemC: function () {
                             return rs.data;
                         }
                     }
                 });
                 modalInstance.result.then(function (selectedItem) {
                    //$scope.queryList($scope.page);
                 }, function () {
                 });
             }else {
                 mdWarningAlert($mdDialog, null, 'myModalSetP.html', rs.data.data)
             }
         }, function (error) {mdErrorAlert($mdDialog, null, 'myModalSetP.html', error)});
     };
     //保存以前的组权限设置菜单,2018-3-22 update by lc
     /*$scope.permissionSet = function (item) {
         $.ajax({
            url : '/api/getgrouppermission/',
            type:'get',
            data : {id:item.id}
        }).then(function(data) {
            data["id"] = item.id;
            data["name"] = item.name;
             var modalInstance = $uibModal.open({
                 templateUrl: 'myModalSetPermission.html',
                 controller: 'ModalInstanceCtrlSetPermission',
                 backdrop: "static",
                 controllerAs: 'vm',
                 resolve: {
                     itemC: function () {
                         return data;
                     }
                 }
             });
             modalInstance.result.then(function (selectedItem) {
                //$scope.queryList($scope.page);
             }, function () {
             });
        })
     };*/
     //修改为共用同一函数，传入参数item，permissname
     $scope.permissionSet = function (item,permissname) {
         if(permissname!='grouppermiss'){
             if(permissname!='portalmpermiss'){
                 alert("您请的请求不太明确！");
                 return;
             }
         }
         // 后台管理菜单权限
         $http.get('/api/getgrouppermission/',{
             params:{
                 id:item.id,
                 permissname:permissname
             }
         }).then(function (rs) {
             if (rs.data.status == 'success'){
                rs.data["id"] = item.id;
                rs.data["name"] = item.name;
                rs.data["type"] = permissname;
                var modalInstance = $uibModal.open({
                 templateUrl: 'myModalSetPermission.html',
                 controller: 'ModalInstanceCtrlSetPermission',
                 backdrop: "static",
                 controllerAs: 'vm',
                 resolve: {
                     itemC: function () {
                         return rs.data;
                     }
                 }
                });
                modalInstance.result.then(function (selectedItem) {
                //$scope.queryList($scope.page);
                }, function () {
                });
             }else {
                 mdWarningAlert($mdDialog, null, 'myModalSetPermission.html', rs.data.data)
             }
         }, function (error) {mdErrorAlert($mdDialog, null, 'myModalSetPermission.html', error)});

     };


});
//$uibModalInstance是模态窗口的实例
app.controller('ModalInstanceCtrl', function ($scope,$timeout, $uibModalInstance,$http,$mdDialog, itemC) {
    $scope.group = itemC||{};
    $scope.ok = function () {
        // 系统管理-角色/组管理 新增和编辑
        $http.post('/api/setgroup/',{
            id:$("#id").val(),    //$scope.group
            name:$("#name").val()
        }).then(function (rs) {
            if (rs.data.status == 'success'){
                $uibModalInstance.close();
            }else {
                mdWarningAlert($mdDialog, null, 'myModalContent', rs.data.data)
            }
        }, function onError(error) {mdErrorAlert($mdDialog, null, 'myModalContent', error)});
    };

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

app.controller('ModalInstanceCtrlSet', function ($scope,$timeout,$mdDialog, $uibModalInstance,$http, itemC) {
    $scope.name = itemC.name||'';//组名
    $scope.users = itemC.users||[];//所有已选
    $scope.allusers = itemC.allusers||[];//所有待选
    $scope.selusers = '';//待选区选中的
    $scope.seledusers = '';//已选区选中的
    $scope.ok = function () {
        var userids = '';
        for (var i = 0; i < $scope.users.length; i++) {
            userids+=$scope.users[i].id+',';
        }
        $http.post('/api/setgroupuser/',{
            userids:userids,
            groupid:itemC.id
        }).then(function (rs) {
            if (rs.data.status == 'success'){
                $uibModalInstance.close();
            }else{
                mdWarningAlert($mdDialog, null, 'userform', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'userform', error)});
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.add = function () {
        for (var i = 0; i < $scope.selusers.length; i++) {
            var added = false;
            for (var j = 0; j < $scope.users.length; j++) {
                if ($scope.selusers[i].id == $scope.users[j].id) {
                    added = true;
                    break;
                }
            }
            if (added) continue;
            $scope.users.push($scope.selusers[i]);
        }
    };
    $scope.remove = function () {
        var newsels=[];
        for (var i = 0; i < $scope.users.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledusers.length; j++) {
                if ($scope.seledusers[j].id == $scope.users[i].id) {
                    have = true;
                    break;
                }
            }
            if (have) continue;
            newsels.push($scope.users[i]);
        }
        $scope.users = newsels;
    };
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});

app.controller('ModalInstanceCtrlSetPermission', function ($scope,$timeout,$http,$mdDialog, $uibModalInstance, itemC) {
    $scope.name = itemC.name||'';//组名
    $scope.users = itemC.menus||[];//所有已选
    $scope.allusers = itemC.allmenus||[];//所有待选
    $scope.selusers = '';//待选区选中的
    $scope.seledusers = '';//已选区选中的
    $scope.ok = function () {
        var userids = '';
        for (var i = 0; i < $scope.users.length; i++) {
            userids+=$scope.users[i].id+',';
        }
        $('.btn-ok').attr("disabled","true");

        $http.post('/api/setgrouppermission/',{
            menuIds:userids,
            groupId:itemC.id,
            type: itemC.type
        }).then(function (rs) {
            if (rs.data.status == 'success'){
                $uibModalInstance.close();
            }else {
                mdWarningAlert($mdDialog, null, 'userform', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'userform', error)})
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.add = function () {
        for (var i = 0; i < $scope.selusers.length; i++) {
            var added = false;
            for (var j = 0; j < $scope.users.length; j++) {
                if ($scope.selusers[i].id == $scope.users[j].id) {
                    added = true;
                    break;
                }
            }
            if (added) continue;
            $scope.users.push($scope.selusers[i]);
        }
    };
    $scope.remove = function () {
        var newsels=[];
        for (var i = 0; i < $scope.users.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledusers.length; j++) {
                if ($scope.seledusers[j].id == $scope.users[i].id) {
                    have = true;
                    break;
                }
            }
            if (have) continue;
            newsels.push($scope.users[i]);
        }
        $scope.users = newsels;
    };
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});
