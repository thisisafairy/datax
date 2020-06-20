function addDialogDragAble($timeout) {
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
};

var app = angular.module('orglist', ['ui.bootstrap','angular-popups', 'ngMaterial', 'commonHeader']);
app.controller('orgListController', function ($scope,$compile, $http, $uibModal,$mdDialog) {
    // function renderTreeHtml(itemObj) {
    //     let htmlStr=new Array();
    //     if(itemObj.isLeaf=='t' || itemObj.isOrg=='f'){
    //         let type=itemObj.isOrg=='t'?'org':'group';
    //         htmlStr.push('<li>' +
    //             '<a href="#" class="col-md-7" ng-click="getUserAndMenuByOrgId('+itemObj.id+',\''+type+'\',$event)" ng-contextmenu="popup={open: $event,itemId:'+itemObj.id+',tp:\''+type+'\',name:\''+itemObj.orgName+'\',parentid:'+itemObj.parentId+'}" currData="{\'itemId\':'+itemObj.id+',\'tp\':\''+type+'\',\'name\':\''+itemObj.orgName+'\',\'parentid\':'+itemObj.parentId+'}">'+itemObj.orgName+'</a>' +
    //             '<div class="col-md-3"><span>'+itemObj.numOfPeople+'</span></div>' +
    //             '<div class="col-md-2"><span>'+itemObj.code+'</span></div>' +
    //             '</li>');
    //     }else{
    //         htmlStr.push('<li>' +
    //             '<a href="#" class="col-md-7" ng-click="getUserAndMenuByOrgId('+itemObj.id+',\'org\',$event)" ng-contextmenu="popup={open: $event,itemId:'+itemObj.id+',tp:\'org\',name:\''+itemObj.orgName+'\',parentid:'+itemObj.parentId+'}" currData="{\'itemId\':'+itemObj.id+',\'tp\':\'org\',\'name\':\''+itemObj.orgName+'\',\'parentid\':'+itemObj.parentId+'}">'+itemObj.orgName+'</a>' +
    //             '<div class="col-md-3"><span>'+itemObj.numOfPeople+'</span></div>' +
    //             '<div class="col-md-2"><span>'+itemObj.code+'</span></div>' +
    //             '</li>');
    //         htmlStr.push('<ul>');
    //         for(let i=0;i<itemObj.children.length;i++){
    //             htmlStr.push(renderTreeHtml(itemObj.children[i]));
    //         }
    //         htmlStr.push('</ul>');
    //     }
    //     return htmlStr.join('');
    // }
    function renderTreeHtml(itemObj) {
        let htmlStr=new Array();
        if(itemObj.isLeaf=='t' || itemObj.isOrg=='f'){
            let type='org';
            let currId=parseInt(itemObj.id);
            if(itemObj.isOrg=='f'){
                type='group';
                currId+=1000000;//加一个数值，避免id重复,在查询的时候需要减去这个值
            }
            htmlStr.push(
                '<tr class="treegrid-'+currId+' treegrid-parent-'+itemObj.parentId+'">'+
                    '<td ng-click="getUserAndMenuByOrgId('+currId+',\''+type+'\',$event)" ng-contextmenu="popup={open: $event,itemId:'+currId+',tp:\''+type+'\',name:\''+itemObj.orgName+'\',parentid:'+itemObj.parentId+'}" currData="{\'itemId\':'+currId+',\'tp\':\''+type+'\',\'name\':\''+itemObj.orgName+'\',\'parentid\':'+itemObj.parentId+'}" title="'+itemObj.orgName+'">'+itemObj.orgName+'</td>' +
                    '<td title="'+itemObj.numOfPeople+'"><div class="hideLongCh">'+itemObj.numOfPeople+'</div></td>'+
                    '<td title="'+itemObj.code+'"><div class="hideLongCh">'+itemObj.code+'</div></td>'+
                '</tr>'
            );
        }else{
            if(itemObj.id!=0 && itemObj.id!='0'){
                htmlStr.push(
                    '<tr class="treegrid-'+itemObj.id+' treegrid-parent-'+itemObj.parentId+'">'+
                        '<td ng-click="getUserAndMenuByOrgId('+itemObj.id+',\'org\',$event)" ng-contextmenu="popup={open: $event,itemId:'+itemObj.id+',tp:\'org\',name:\''+itemObj.orgName+'\',parentid:'+itemObj.parentId+'}" currData="{\'itemId\':'+itemObj.id+',\'tp\':\'org\',\'name\':\''+itemObj.orgName+'\',\'parentid\':'+itemObj.parentId+'}" title="'+itemObj.orgName+'">'+itemObj.orgName+'</td>' +
                        '<td title="'+itemObj.numOfPeople+'"><div class="hideLongCh">'+itemObj.numOfPeople+'</div></td>'+
                        '<td title="'+itemObj.code+'"><div class="hideLongCh">'+itemObj.code+'</div></td>'+
                    '</tr>'
                );
            }else{
                htmlStr.push(
                    '<tr class="treegrid-'+itemObj.id+'">'+
                        '<td ng-click="getUserAndMenuByOrgId('+itemObj.id+',\'org\',$event)" ng-contextmenu="popup={open: $event,itemId:'+itemObj.id+',tp:\'org\',name:\''+itemObj.orgName+'\',parentid:'+itemObj.parentId+'}" currData="{\'itemId\':'+itemObj.id+',\'tp\':\'org\',\'name\':\''+itemObj.orgName+'\',\'parentid\':'+itemObj.parentId+'}">'+itemObj.orgName+'</td>' +
                        '<td>&nbsp;'+itemObj.numOfPeople+'</td>'+
                        '<td>&nbsp;'+itemObj.code+'</td>'+
                    '</tr>'
                );
            }
            for(let i=0;i<itemObj.children.length;i++){
                htmlStr.push(renderTreeHtml(itemObj.children[i]));
            }
        }
        return htmlStr.join('');
    }

    function renderOrgTree2() {
        $scope.userList=new Array();//每次重新绘制树的时候
        $scope.totalItems = 0;
        //获取所有机构
        $http.get('/api/account/getAllTreeByParent?parentid=0').then(function (rs) {
            if(rs.data.status=='success'){
                $scope.allTreeOrg=rs.data.data;

                let treeHtml='<thead><tr id="tree-head-1">\n' +
                                '<th><div>机构名称</div></th><th><div>核定人数</div></th><th><div>编码</div></th>\n' +
                            '</tr></thead>'+
                            '<tbody class="tableBlock">';
                treeHtml+=renderTreeHtml(rs.data.data);
                treeHtml+='</tbody>';
                treeHtml=$compile(treeHtml)($scope);//angular函数需要compile

                // $("#orgTree").html('');
                // $("#orgTree").append(treeHtml);
                // $(".orgTreeMenu").SimpleTree({});
                $("#myanothertree").html('');
                $('#myanothertree').append(treeHtml);

                $('#myanothertree').treegrid({
                    'initialState': 'collapsed',
                    'saveState': true,
                });
                $("#orgTree").mLoading('destroy');//清除遮罩层

                if($('#myanothertree tbody tr:eq(0)').treegrid('isExpanded')){
                    $scope.expandBtnText='全部收缩';
                }

                //给叶子节点的机构和角色分别添加不同的图标
                let allexpander=$('.treegrid-expander');
                for(let k=0;k<allexpander.length;k++){
                    if(!$(allexpander[k]).hasClass('treegrid-expander-expanded')){
                        let currData=$(allexpander[k]).parent().attr('currdata');
                        let currTp=currData['tp'];
                        if(typeof(currData)=="string"){
                            currTp=JSON.parse(currData.replace(/\'/g,'"'))['tp'];
                        }
                        if(currTp=='group'){
                            $(allexpander[k]).addClass('groupExpander');
                        }else{
                            $(allexpander[k]).addClass('orgExpander');
                        }
                    }
                }
            }else{
                $scope.allTreeOrg={};
                mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
            }
        },function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
    }
    $("#orgTree").mLoading();
    renderOrgTree2();//渲染树结构
    /**
     * 点击添加子节点
     * */
    $scope.currOrgId='';
    $scope.currType='';
    $scope.currOrgName='';

    $scope.userList=[];
    $scope.menuList=[];
    //通过orgid或groupid获取所有用户信息
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.pageChanged=function(){
        $http.get('/api/account/getUsersByOrgId?id='+$scope.currOrgId+'&type='+$scope.currType+'&page='+$scope.currentPage).then(function (rs) {
            if (rs.data.status == 'success'){
                $scope.userList=rs.data.data;
                $scope.totalItems = rs.data.total;
            }else {
                mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
    };
    $scope.totalMenuItems = 0;
    $scope.currentMenuPage = 1;
    $scope.menuPageChanged=function(){
        $http.get('/api/account/getMenuByOrgId?id='+$scope.currOrgId+'&type='+$scope.currType+'&page='+$scope.currentMenuPage).then(function (rs) {
            if (rs.data.status == 'success'){
                $scope.menuList=rs.data.data;
                $scope.totalMenuItems = rs.data.total;
            }else {
                mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
    };

    $scope.getUserAndMenuByOrgId=function(itemId,type,ev) {
        $('#myanothertree tbody tr').removeClass('selectTr');
        $(ev.currentTarget).closest('tr').addClass('selectTr');
        $scope.currOrgId=itemId;
        $scope.currType=type;
        let contextParam=$(ev.currentTarget).attr('currData');//必须要json格式
        // console.log('contextParam=',contextParam);

        contextParam=JSON.parse(contextParam.replace(/'/g,'"'));
        $scope.currOrgName=contextParam['name'];
        // console.log('$scope.currOrgName=',$scope.currOrgName);

        itemId=itemId.toString();
        //获取当前id下所有人员信息
        if(!itemId || itemId.trim()=='' || !type || type.trim()==''){
            console.log('itemId=',itemId);
            console.log('type=',type);

            alert('传入id或type错误！');
            return;
        }
        $http.get('/api/account/getUsersByOrgId?id='+itemId+'&type='+type+'&page='+$scope.currentPage).then(function (rs) {
            if (rs.data.status == 'success'){
                $scope.userList=rs.data.data;
                $scope.totalItems = rs.data.total;
            }else {
                mdWarningAlert($mdDialog, ev, 'orglist', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, ev, 'orglist', error)});

        $http.get('/api/account/getMenuByOrgId?id='+itemId+'&type='+type+'&page='+$scope.currentPage).then(function (rs) {
            if (rs.data.status == 'success'){
                $scope.menuList=rs.data.data;
                $scope.totalMenuItems = rs.data.total;
            }else {
                mdWarningAlert($mdDialog, ev, 'orglist', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, ev, 'orglist', error)});

    };
    $scope.expandBtnText='全部展开';
    $scope.expandOrgTree=function(){
        if($scope.expandBtnText=='全部展开'){
            $('#myanothertree').treegrid('expandAll');
            $scope.expandBtnText='全部收缩';
        }else{
            $('#myanothertree').treegrid('collapseAll');
            $scope.expandBtnText='全部展开';
        }
    };
    /**
     * 右键菜单的函数
     * */
    $scope.addChildOrg=function (id,tp,style) {
        if(id!=undefined && tp=='org'){
            var modalInstance = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'addOrg.html',
                controller: 'addChildOrg',
                controllerAs: 'vm',
                backdrop: false,
                resolve: {
                    id: function () {
                        return id;
                    },
                    tp:function () {
                        return tp;
                    },
                    style:function () {
                        return style;
                    }
                }
            });
            modalInstance.result.then(function (rs) {
                if(rs=='success'){
                    renderOrgTree2();
                }
            });

        }else if(id && tp=='group'){
            if(confirm('编辑角色请转到角色/组管理菜单！')){
                $('body').append('<a href="" id="gotogroupmenu" target="_blank"></a>');
                $('#gotogroupmenu').attr('href', '/account/grouplist');
                $('#gotogroupmenu').get(0).click();
            }
        }else{
            alert("父节点异常！")
        }
    };

    $scope.addGroup=function (id,tp,orgName) {
        if(id && tp=='org'){
            let modalInstance = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'addGroup.html',
                controller: 'addGroupController',
                controllerAs: 'vm',
                backdrop: false,
                resolve: {
                    orgId: function () {
                        return id;
                    },
                    orgName:function () {
                        return orgName;
                    }
                }
            });
            modalInstance.result.then(function (rs) {
                if(rs.status=='success'){
                    renderOrgTree2();
                }
            });
        }else if(id && tp=='group'){
            alert("不可对角色新增子角色！")
        }else{
            alert("父节点异常！")
        }
    };
    $scope.delOrg=function (oid,name,tp,parentid) {
        if(oid){
            if(confirm('确定要删除'+name+'?')){
                $http.get('/api/account/deleteById?oid='+oid+'&type='+tp+'&parentid='+parentid).then(function (rs) {
                    if(rs.data.status=='success'){
                        alert('删除节点'+name+'成功！');
                        renderOrgTree2();
                    }else{
                        mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
                    }
                }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
            }
        }else{
            alert('父节点异常！');
        }
    };
    //给机构添加用户
    $scope.addUserToOrg=function () {
        if($scope.currOrgId && $scope.currType){
            if($scope.currType=='org'){
                let modalInstance = $uibModal.open({
                    animation: true,
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: 'addUserToOrg.html',
                    controller: 'addUserToOrgController',
                    controllerAs: 'vm',
                    backdrop: false,
                    resolve: {
                        orgId: function () {
                            return $scope.currOrgId
                        },
                        type:function () {
                            return $scope.currType
                        },
                        orgName:function () {
                            return $scope.currOrgName
                        }
                    }
                });
                modalInstance.result.then(function (rs) {
                    if(rs.status=='success'){
                        $http.get('/api/account/getUsersByOrgId?id='+rs.data+'&type=org'+'&page='+$scope.currentPage).then(function (rs) {
                            if (rs.data.status == 'success'){
                                $scope.userList=rs.data.data;
                                $scope.totalItems = rs.data.total;
                            }else {
                                mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
                            }
                        }, function (error) {mdErrorAlert($mdDialog, ev, 'orglist', error)});
                    }else {
                        mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
                    }
                }, function (error) {mdErrorAlert($mdDialog, ev, 'orglist', error)});
            }else if($scope.currType=='group'){
                if(confirm('角色添加用户请转到角色/组管理菜单！')){
                    $('body').append('<a href="" id="gotogroupmenu" target="_blank"></a>');
                    $('#gotogroupmenu').attr('href', '/account/grouplist');
                    $('#gotogroupmenu').get(0).click();
                }
            }else{
                alert('机构类型不明确！');
            }
        }else{
            alert('当前机构id或机构类型不明确！');
        }
    }
    //给机构添加菜单
    $scope.addMenuToOrg=function () {
        if($scope.currOrgId && $scope.currType){
            if($scope.currType=='org'){
                let modalInstance = $uibModal.open({
                    animation: true,
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: 'addMenuToOrg.html',
                    controller: 'addMenuToOrgController',
                    controllerAs: 'vm',
                    backdrop: false,
                    resolve: {
                        orgId: function () {
                            return $scope.currOrgId
                        },
                        type:function () {
                            return $scope.currType
                        },
                        orgName:function () {
                            return $scope.currOrgName
                        }
                    }
                });
                modalInstance.result.then(function (rs) {
                    if(rs.status=='success'){
                        $http.get('/api/account/getMenuByOrgId?id='+rs.data+'&type=org'+'&page='+$scope.currentPage).then(function (rst) {
                            $scope.menuList=rst.data.data;
                            $scope.totalMenuItems = rs.data.total;
                        });
                    }
                });
            }else if($scope.currType=='group'){
                if(confirm('角色添加菜单请转到角色/组管理菜单！')){
                    $('body').append('<a href="" id="gotogroupmenu" target="_blank"></a>');
                    $('#gotogroupmenu').attr('href', '/account/grouplist');
                    $('#gotogroupmenu').get(0).click();
                }
            }else{
                alert('机构类型不明确！');
            }
        }else{
            alert('当前机构id或机构类型不明确！');
        }
    }
});

/*
*右键菜单
*/
app.directive('ngContextmenu', ['$parse', function($parse) {
    return {
        restrict: 'A',
        compile: function($element, attr) {
            var fn = $parse(attr.ngContextmenu, null, true);
            return function(scope, element) {
                element.on('contextmenu', function(event) {
                    var callback = function() {
                        fn(scope, {
                            $event: event
                        });
                    };
                    scope.$apply(callback);
                    event.preventDefault()
                });
            };
        }
    };
}]);


app.controller('addChildOrg',function ($scope, $http,$timeout, $uibModalInstance,id,tp,style) {
    $scope.title = style=='add'?'新增组织机构':'编辑组织机构';
    $scope.org={'style':style,'status':'1','id':id};
    if(style=='edit'){
        $http.get('/api/account/getOrgByOrgId?orgid='+id).then(function (rs) {
            if(rs.data.status=='success'){
                $scope.org=rs.data.data;
                $scope.org['style']=style;
            }else{
                mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
    }

    // $scope.allOrg=[];
    // $http.get('/api/account/getAllOrg').then(function (rs) {
    //     if(rs.data.status=='success'){
    //         $scope.allOrg=rs.data.data;
    //     }else{
    //         alert(rs.data.data);
    //     }
    // });

    $scope.ok=function(){
        $http({
            method: 'POST',
            url: '/api/account/updateOrg',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                allJsonObj:JSON.stringify($scope.org)
            }
        }).success(function (rs) {
            if(rs.status=='success'){
                $uibModalInstance.close('success');
            }else{
                mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
    };
    $scope.cancel=function () {
        $uibModalInstance.dismiss('cancel')
    };
    addDialogDragAble($timeout);
});


app.controller('addGroupController',function ($scope, $http,$timeout, $uibModalInstance,orgId,orgName) {
    $scope.orgObj={};
    $scope.orgObj['orgId']=orgId;
    $scope.orgObj['orgName']=orgName;

    $scope.allOptionGroups=[];//所有待选
    $scope.allSelectedGroups=[];//所已选
    $scope.oldSelectedGroupIds=[];
    $http.get('/api/account/getSelOptGroupsByOrgId?orgId='+orgId).then(function (rs) {
        console.log('getSelOptGroupsByOrgId rs=',rs);
        if(rs.data.status=='success'){
            $scope.allOptionGroups=rs.data.data.optionGroupList;
            $scope.allSelectedGroups=rs.data.data.selectedGroupList;
            $scope.allSelectedGroups.map(function (itemObj) {
                $scope.oldSelectedGroupIds.push(itemObj.gid);
            })
        }else{
            mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
        }
    }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});

    $scope.selgroups = '';//待选区选中的
    $scope.seledgroups = '';//已选区选中的
    $scope.ok = function () {
        console.log('$scope.oldSelectedGroupIds=',$scope.oldSelectedGroupIds);

        let newGids = new Array();
        $scope.allSelectedGroups.map(function (itemObj) {
            newGids.push(itemObj.gid);
        });
        //前端查找哪些id为新增哪些id为删除，后台直接执行就可以
        let addGids=new Array();
        addGids=newGids.filter(function (v) {
            return $scope.oldSelectedGroupIds.indexOf(v)==-1;
        });
        let removeGids=new Array();
        removeGids=$scope.oldSelectedGroupIds.filter(function (v) {
            return newGids.indexOf(v)==-1;
        });

        if(addGids.length>0 || removeGids.length>0){
            $http({
                method: 'POST',
                url: '/api/account/addGroupByOrgId',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                data: { orgId: orgId, addGids:addGids.join(','),removeGids:removeGids.join(',')}
            }).success(function (rs) {
                if(rs.status=='success'){
                    $uibModalInstance.close({'status':'success','data':orgId});
                }else{
                    mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
                }
            }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
        }else{
            $uibModalInstance.dismiss({'status':'cancel'});
        }

    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss({'status':'cancel'});
    };

    $scope.add = function () {
        for (var i = 0; i < $scope.selgroups.length; i++) {
            var added = false;
            for (var j = 0; j < $scope.allSelectedGroups.length; j++) {
                if ($scope.selgroups[i].gid == $scope.allSelectedGroups[j].gid) {
                    added = true;
                    break;
                }
            }
            if (added) { continue; }
            $scope.allSelectedGroups.push($scope.selgroups[i]);
            //过滤opt里的对象
            for(let m=0;m<$scope.allOptionGroups.length;m++){
                if($scope.allOptionGroups[m].gid==$scope.selgroups[i].gid){
                    $scope.allOptionGroups.splice(m,1);
                    m-=1;
                }
            }
        }
    };
    $scope.remove = function () {
        var newsels = [];
        for (var i = 0; i < $scope.allSelectedGroups.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledgroups.length; j++) {
                if ($scope.seledgroups[j].gid == $scope.allSelectedGroups[i].gid) {
                    have = true;
                    //网opt里添加对象
                    $scope.allOptionGroups.push($scope.allSelectedGroups[i]);//如果if对比判断出现多次那就有问题，这里只有一次
                    break;
                }
            }
            if (have) { continue; }
            newsels.push($scope.allSelectedGroups[i]);
        }
        $scope.allSelectedGroups = newsels;
    };
    addDialogDragAble($timeout);
});

app.controller('addUserToOrgController',function ($scope,$mdDialog, $http,$timeout, $uibModalInstance,orgId,type,orgName) {
    $scope.orgObj={};
    $scope.orgObj['orgId']=orgId;
    $scope.orgObj['type']=type;
    $scope.orgObj['orgName']=orgName;

    $scope.allOptionUsers=[];//所有待选user
    $scope.allSelectedUsers=[];//所已选user
    $scope.oldSelectedUserIds=[];
    $http.get('/api/account/getSelOptUsersByOrgId?orgId='+orgId).then(function (rs) {
        if(rs.data.status=='success'){
            $scope.allOptionUsers=rs.data.data.optionUserList;
            $scope.allSelectedUsers=rs.data.data.selectedUserList;
            $scope.allSelectedUsers.map(function (itemObj) {
                $scope.oldSelectedUserIds.push(itemObj.uid);
            })
        }else{
            mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
        }
    }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});

    $scope.selusers = '';//待选区选中的
    $scope.seledusers = '';//已选区选中的
    $scope.ok = function () {
        let newUids = new Array();
        $scope.allSelectedUsers.map(function (itemObj) {
            newUids.push(itemObj.uid);
        });
        //前端查找哪些id为新增哪些id为删除，后台直接执行就可以
        let addUids=new Array();
        addUids=newUids.filter(function (v) {
            return $scope.oldSelectedUserIds.indexOf(v)==-1;
        });
        let removeUids=new Array();
        removeUids=$scope.oldSelectedUserIds.filter(function (v) {
            return newUids.indexOf(v)==-1;
        });

        if(addUids.length>0 || removeUids.length>0){
            $http({
                method: 'POST',
                url: '/api/account/addUserByOrgId',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                data: { orgId: orgId, addUids:addUids.join(','),removeUids:removeUids.join(',')}
            }).success(function (rs) {
                if(rs.status=='success'){
                    $uibModalInstance.close({'status':'success','data':orgId});
                }else{
                    mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
                }
            }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
        }else{
            $uibModalInstance.dismiss({'status':'cancel'});
        }

    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss({'status':'cancel'});
    };

    $scope.add = function () {
        for (var i = 0; i < $scope.selusers.length; i++) {
            var added = false;
            for (var j = 0; j < $scope.allSelectedUsers.length; j++) {
                if ($scope.selusers[i].uid == $scope.allSelectedUsers[j].uid) {
                    added = true;
                    break;
                }
            }
            if (added) { continue; }
            $scope.allSelectedUsers.push($scope.selusers[i]);
            //过滤opt里的对象
            for(let m=0;m<$scope.allOptionUsers.length;m++){
                if($scope.allOptionUsers[m].uid==$scope.selusers[i].uid){
                    $scope.allOptionUsers.splice(m,1);
                    m-=1;
                }
            }
        }
    };
    $scope.remove = function () {
        var newsels = [];
        for (var i = 0; i < $scope.allSelectedUsers.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledusers.length; j++) {
                if ($scope.seledusers[j].uid == $scope.allSelectedUsers[i].uid) {
                    have = true;
                    //网opt里添加对象
                    $scope.allOptionUsers.push($scope.allSelectedUsers[i]);//如果if对比判断出现多次那就有问题，这里只有一次
                    break;
                }
            }
            if (have) { continue; }
            newsels.push($scope.allSelectedUsers[i]);
        }
        $scope.allSelectedUsers = newsels;
    };

    addDialogDragAble($timeout);
});

app.controller('addMenuToOrgController',function ($scope,$mdDialog, $http,$timeout, $uibModalInstance,orgId,type,orgName) {
    $scope.orgObj={};
    $scope.orgObj['orgId']=orgId;
    $scope.orgObj['type']=type;
    $scope.orgObj['orgName']=orgName;

    $scope.allOptionMenus=[];//所有待选menu
    $scope.allSelectedMenus=[];//所已选menu
    $scope.oldSelectedMenuIds=[];
    $http.get('/api/account/getSelOptMenusByOrgId?orgId='+orgId).then(function (rs) {
        if(rs.data.status=='success'){
            $scope.allOptionMenus=rs.data.data.optionMenuList;
            $scope.allSelectedMenus=rs.data.data.selectedMenuList;
            $scope.allSelectedMenus.map(function (itemObj) {
                $scope.oldSelectedMenuIds.push(itemObj.menuid);
            })
        }else{
            mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
        }
    }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});

    $scope.selmenus = '';//待选区选中的
    $scope.seledmenus = '';//已选区选中的
    $scope.ok = function () {
        let newMids = new Array();
        $scope.allSelectedMenus.map(function (itemObj) {
            newMids.push(itemObj.menuid);
        });
        //前端查找哪些id为新增哪些id为删除，后台直接执行就可以
        let addMids=new Array();
        addMids=newMids.filter(function (v) {
            return $scope.oldSelectedMenuIds.indexOf(v)==-1;
        });
        let removeMids=new Array();
        removeMids=$scope.oldSelectedMenuIds.filter(function (v) {
            return newMids.indexOf(v)==-1;
        });

        if(addMids.length>0 || removeMids.length>0){
            $http({
                method: 'POST',
                url: '/api/account/addMenuByOrgId',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                data: { orgId: orgId, addMids:addMids.join(','),removeMids:removeMids.join(',')}
            }).success(function (rs) {
                if(rs.status=='success'){
                    $uibModalInstance.close({'status':'success','data':orgId});
                }else{
                    mdWarningAlert($mdDialog, null, 'orglist', rs.data.data)
                }
            }, function (error) {mdErrorAlert($mdDialog, null, 'orglist', error)});
        }else{
            $uibModalInstance.dismiss({'status':'cancel'});
        }
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss({'status':'cancel'});
    };

    $scope.add = function () {
        for (var i = 0; i < $scope.selmenus.length; i++) {
            var added = false;
            for (var j = 0; j < $scope.allSelectedMenus.length; j++) {
                if ($scope.selmenus[i].menuid == $scope.allSelectedMenus[j].menuid) {
                    added = true;
                    break;
                }
            }
            if (added) { continue; }
            $scope.allSelectedMenus.push($scope.selmenus[i]);
            //过滤opt里的对象
            for(let m=0;m<$scope.allOptionMenus.length;m++){
                if($scope.allOptionMenus[m].menuid==$scope.selmenus[i].menuid){
                    $scope.allOptionMenus.splice(m,1);
                    m-=1;
                }
            }
        }
    };
    $scope.remove = function () {
        var newsels = [];
        for (var i = 0; i < $scope.allSelectedMenus.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledmenus.length; j++) {
                if ($scope.seledmenus[j].menuid == $scope.allSelectedMenus[i].menuid) {
                    have = true;
                    //网opt里添加对象
                    $scope.allOptionMenus.push($scope.allSelectedMenus[i]);//如果if对比判断出现多次那就有问题，这里只有一次
                    break;
                }
            }
            if (have) { continue; }
            newsels.push($scope.allSelectedMenus[i]);
        }
        $scope.allSelectedMenus = newsels;
    };

    addDialogDragAble($timeout);
});
