
var app = angular.module('userlist', ['ui.bootstrap', 'ngMaterial', 'commonHeader']);
app.controller('userListController', function ($scope, $http, $uibModal,$mdDialog) {
    "use strict";
    $scope.open = function () {
        var id = "0";
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: './useradd',
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
            templateUrl: './useradd',
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
    //获取所有数据权限标签
    $http.get('/api/account/getUserTag').then(function (rs) {
        if (rs.data.status == 'success'){
            $scope.usertag = rs.data.data;
        }else {
                mdWarningAlert($mdDialog, null, 'userListController', rs.data.data)
        }
    }, function (error) {mdErrorAlert($mdDialog, null, 'userListController', error)});
    $scope.delete = function (user) {
        var a = confirm("是否删除用户:'" + user.username + "'?\n这将删除用户关联的菜单、机构和角色！");
        if (a) {

            $http.post('/api/account/deleteuser',{
               id: user.id
            }).then(function (rs) {
                if(rs.data.status == 'success'){
                    if (rs.code == '1') {
                        $scope.getdata(1);
                    }else {
                        alert(rs.data.msg);
                        $scope.getdata(1);
                        }
                }else {
                    mdWarningAlert($mdDialog, null, 'userListController', rs.data.data)
                }
            }, function onError(error) {mdErrorAlert($mdDialog, null, 'userListController', error)});

        } else {
            return false;
        }
    };

    $scope.dataAuth = function (id, config) {
        var modalInstance = $uibModal.open({
            templateUrl: 'myModalSetDataPermission.html',
            controller: 'CtrlSetDataPermission',
            backdrop: "static",
            controllerAs: 'vm',
            resolve: {
                id: function () {
                    return id;
                },
                config: function () {
                    return config;
                },
                tags:function(){
                    return $scope.usertag;
                }
            }
        });
        modalInstance.result.then(function () {
            //$scope.queryList($scope.page);
            $scope.getdata(1);
        }, function () {
        });
    };

    $scope.auth = function (ev,id, name) {
        
        $http({
            url: '/api/getuserpermission/',
            method:"GET",
            params: { id: id }
        }).then(function (rs) {
            if (rs.data.status == 'success') {
                var data =rs.data;
                data["id"] = id;
            data["name"] = name;
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
            modalInstance.result.then(function () {
                //$scope.queryList($scope.page);
                }, function () {
            });
            }else {
                mdWarningAlert($mdDialog, ev, 'userListController', data.data.data)
            }
        },function (error) {mdErrorAlert($mdDialog, ev, 'userListController', error)});

    };
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function () {
        $scope.getdata($scope.currentPage);
    };
    $scope.getdata = function (page) {
        var key = $scope.searchkey;
        var url = '/api/userextension/?page=' + page;
        if (key != '') {
            url = encodeURI(url + "&search=" + key);//中文转码
        }
        $http.get(url).then(function (response) {
            if(response.data.status == 'success'){
                $scope.lists = response.data.rows;
                $scope.totalItems = response.data.total;
            }else{
                mdWarningAlert($mdDialog, null, 'userListController', rs.data.data)
            }
        },function onError(error) {mdErrorAlert($mdDialog, null, 'userListController', error)});
    };
    $scope.getdata(1);
    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 500);
});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $http,$timeout, $uibModalInstance,$mdDialog, id) {
    $scope.errorflag = false;
    $scope.checking = false;
    if (id != "0") {
        $http.get('/api/accountview?id=' + id).then(function (response) {
            if (response.data.status == 'success'){
                $scope.user = response.data.user;
                $scope.modeltitle = '用户编辑';
            }else {
                mdWarningAlert($mdDialog, null, 'userListController', rs.data.data)
            }
        },function (error) {mdErrorAlert($mdDialog, null, 'userListController', error)});
    }
    else {
        $scope.modeltitle = '用户新增';
    }
    $scope.ok = function () {
        //如果是修改状态，输入了密码就使用输入的密码否则不修改密码
        //如果是新增状态，输入了密码就使用输入的密码否则是用默认密码
        var data = $("#addForm").serialize();

        $http.post("/account/singup",{
            id:$(" input[ name='id' ] ").val(),
            username:$(" input[ name='username' ] ").val(),
            nickname:$(" input[ name='nickname' ] ").val(),
            password:$(" input[ name='password' ] ").val(),
            email:$(" input[ name='email' ] ").val(),
            mobile:$(" input[ name='mobile' ] ").val(),
        }).then(function (rs) {
            if (rs.data.status == "success"){
                if (rs.data.code == '1'){
                $uibModalInstance.close();
                }else {
                    alert(rs.data.msg);
                    $scope.errorflag = true;
                }
            } else {
                mdWarningAlert($mdDialog, null, 'add', rs.data.data)
            }
        }, function onError(error) {mdErrorAlert($mdDialog, null, 'add', error)});

    };
    $scope.checkusername = function () {
        $scope.checking = true;
        $scope.errorflag = false;
        $scope.tablevalidatemsg = '';
        $scope.checkfun();
    };
    $scope.checkfun = _.debounce(function (ev) {
        $http.post('/api/account/checkusername',{
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                name: $scope.user.username,
                id: id
            }
        }).then(function (rs) {
            if (rs.data.status=='success'){
                $scope.checking = false;
                if (rs.data.code != '1') {
                $scope.usermsg = rs.data.msg;
                $scope.errorflag = true;
            }
            }else{
                mdWarningAlert($mdDialog, ev, 'add', rs.data.data)
            }
        }, function onError(error) {mdErrorAlert($mdDialog, ev, 'add', error)});





    }, 1000);

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
//用户管理界面  数据权限弹框

app.controller('CtrlSetDataPermission', function ($scope, $http, $timeout,$uibModalInstance,$mdDialog, id, config,tags) {
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $scope.add = function(){
        $scope.config.push({
            tagid:"",
            fun:"",
            value:""
        });
    };

    console.log(id);
    $scope.id = id;
    $scope.config = angular.copy(config);
    $scope.tags = angular.copy(tags);

    $scope.delete = function(num){
        $scope.config.splice(num,1);
    };

    $scope.ok = function(){

        $http.post('/api/account/saveUserTag',{
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                config: $scope.config,
                id: id
            }
        }).then(function (rs) {
            // console.log(rs.data)
            if (rs.data.status == 'success'){
                $uibModalInstance.close();
            }else{
                mdWarningAlert($mdDialog, null, 'userListController', rs.data.data)
            }
        }, function onError(error) {mdErrorAlert($mdDialog, null, 'userListController', error)});
    };
    $timeout(function () {
        if(config.length ==0){//用户新增初始化一条空数据，必须放到这里才能起作用，弹出的controller是异步
            $scope.config.push({
                tagid:"",
                fun:"",
                value:""
            });
        }
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});

//用户权限
app.controller('ModalInstanceCtrlSetPermission', function ($scope,$http, $timeout,$uibModalInstance,$mdDialog, itemC) {
    $scope.name = itemC.name || '';//用户名
    $scope.users = itemC.menus || [];//所有已选
    $scope.allusers = itemC.allmenus || [];//所有待选
    $scope.selusers = '';//待选区选中的
    $scope.seledusers = '';//已选区选中的
    $scope.ok = function () {
        var menuids = '';
        for (var i = 0; i < $scope.users.length; i++) {
            menuids += $scope.users[i].id + ',';
        }
        $http.post('/api/setuserpermission/',{
            menuids: menuids,
            userid: itemC.id
        }).then(function (rs) {
            if (rs.data.status == 'success') {
                console.log(rs);
            $uibModalInstance.close();
            } else {
                mdWarningAlert($mdDialog, null, 'myModalSetPermission.html', rs.data.data)
            }
        }, function onError(error) {mdErrorAlert($mdDialog, null, 'myModalSetPermission.html', error)});

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
            if (added) { continue; }
            $scope.users.push($scope.selusers[i]);
        }
    };
    $scope.remove = function () {
        var newsels = [];
        for (var i = 0; i < $scope.users.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledusers.length; j++) {
                if ($scope.seledusers[j].id == $scope.users[i].id) {
                    have = true;
                    break;
                }
            }
            if (have) { continue; }
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


