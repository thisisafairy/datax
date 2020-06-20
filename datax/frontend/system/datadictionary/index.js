var app = angular.module('datadictionary', ['ui.bootstrap','ui.tree']);

app.controller("datadictionaryCtrl", function ($scope, $http, $timeout, $uibModal) {
    $scope.currSelectNode = {};//每一个选中回显的数据
    $scope.currSelectNodeBakData = {};//保存当前node的历史数据，以便用户点击取消编辑
    $scope.addedNodes = [];//新增的所有节点，点击保存后全部传入后台
    $scope.updatedNodes = [];//编辑过的所有节点

    $scope.addOrUpdateText = '编辑';

    //获取树形结构json,也许需要做成一次获取两级的功能
    $scope.getTreeData = function(){
        $http.get('/api/dash/show_data_dictionary').then(function (rs) {
            // console.log('----getTreeData-rs=',rs);
            $scope.data = rs.data.data;
            $timeout(function () {
                $scope.collapsedAll();
            });
            // if (rs.data.status == 'success') {
            //     // $scope.data = rs.data.data;
            // } else {
            //     alert(rs.data);
            // }
        });

    };
    $scope.getTreeData();

    //保存编辑和新增的node到数据库
    $scope.save = function () {
        // console.log('----data=', $scope.data);
        // console.log('----addedNodes=', $scope.addedNodes);
        // console.log('----updatedNodes=', $scope.updatedNodes);
        $http({
            method: 'POST',
            url: '/api/dash/save_data_dictionary',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                updatedNodes: $scope.updatedNodes,
                addedNodes: $scope.addedNodes
            }
        }).success(function (rs) {
            console.log('---save-rs=', rs);
            if (rs.data.status == 'success') {
                $scope.getTreeData();

                $scope.addedNodes = [];//重置
                $scope.updatedNodes = [];//重置
                $scope.currSelectNodeBakData = {};//重置
            } else {
                alert(rs.data);
            }
        })
    };
    //保存到updatedNodes还是addedNodes，保存依赖code，如果是重复就覆盖
    $scope.cashSaveNode = function(theNode, type){
        if (theNode && JSON.stringify(theNode) != '{}' && !theNode['id']) type = 'add';
        if (type == 'update' && theNode && JSON.stringify(theNode) != '{}') {
            inArray($scope.updatedNodes,theNode,'code',true);
        } else if (type == 'add' && theNode && JSON.stringify(theNode) != '{}') {
            inArray($scope.addedNodes,theNode,'code',true);
        }
    };
    //编辑的回显
    $scope.editNode = function (scope) {
        $scope.addOrUpdateText = '编辑';
        $scope.currSelectNodeBakData = angular.copy(scope.$modelValue);//保存历史node以便用户返回操作

        //回显结果以便编辑,这里必须使用引用复制，
        $scope.currSelectNode = scope.$modelValue;//回显结果以便编辑
        $scope.currSelectNode['updateStatus'] = 1;//允许编辑
    };
    //监听编辑,保存到cash数组里，点击保存将数据传递到后台
    $scope.$watch('currSelectNode',function (node) {
        if (node && node != {} &&JSON.stringify(node) != '{}') {
            $scope.cashSaveNode(node,'update');//每次编辑都需要把当前节点保存到相应的数组中
        }
    },true);

    $scope.newSubNode = function (scope) {
        scope.expand();
        var nodeData = scope.$modelValue;
        var currNewNode = {
            id: '',//这里给空id在watch的调用函数里会根据id来判断是update还是add
            parent_id: nodeData.code,
            dictionary_name: 'newNode',
            code: generateUuid(8,16),
            order_num: 10,
            status: '1',
            description: '',
            nodes: []
        };
        $scope.currSelectNode = currNewNode;//回显
        nodeData.nodes.splice(0,0,currNewNode);
    };

    $scope.addToRootNode = function () {
        var currNewNode = {
            id: '',//这里给空id在watch的调用函数里会根据id来判断是update还是add
            parent_id: '',
            dictionary_name: 'newRootNode',
            code: generateUuid(8,16),
            order_num: 10,
            status: '1',
            description: '',
            nodes: []
        };
        $scope.currSelectNode = currNewNode;//回显
        $scope.data.splice(0,0,currNewNode);
    };
    //监听数组是否为空
    $scope.$watch('data',function (itemObj) {
        if(!$scope.data || $scope.data.length == 0){//保留最后一项,不能完全删除
            $scope.data = [];
            $scope.data.push({
                id: '',//临时id，后台不会使用，主要用于编辑的判断
                parent_id: '',
                dictionary_name: 'newRootNode',
                code: generateUuid(8,16),
                order_num: 10,
                status: '1',
                description: '',
                nodes: []
            })
        }
    },true);

    //删除节点,如果是子节点就直接删除，如果是父节点就给出提示
    $scope.removeNodeByMyself = function (scope) {
        $scope.currSelectNode = {};//置空
        $scope.currSelectNodeBakData = {};//置空
        //删除可能是删除刚新增在临时变量里的数据
        var deleteFromTempVariable = null;
        $scope.addedNodes.map(function (item, idx) {
            if (item.code == scope.$modelValue.code) {
                deleteFromTempVariable = idx;
            }
        });
        if (deleteFromTempVariable && deleteFromTempVariable >= 0) {
            $scope.addedNodes.splice(deleteFromTempVariable, 1);
            return;
        }

        var alertMessage = '是否删除' + scope.$modelValue['dictionary_name'] + '?';
        if (scope.$modelValue && scope.$modelValue.nodes && scope.$modelValue.nodes.length > 0) {
            alertMessage = scope.$modelValue['dictionary_name'] + '下有字节点，确定要删除吗？';
        }
        if (confirm(alertMessage)) {
            $http({
                method: 'POST',
                url: '/api/dash/delete_data_dictionary',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    deleteNode: scope.$modelValue
                }
            }).success(function (rs) {
                console.log('----rs=', rs);
                if (rs.code == 0) {
                    scope.remove();
                } else {
                    alert(rs.data);
                }
            })
        }
    };
    //不允许空白输入
    $scope.autoFit = function(type){
        if ($scope.currSelectNode && type){
            if($scope.currSelectNode.dictionary_name == '' || $scope.currSelectNode.dictionary_name.trim() == ''){
                $scope.currSelectNode.dictionary_name = 'newNode';
            }else if($scope.currSelectNode.order_num == '' || !$scope.currSelectNode.order_num){
                $scope.currSelectNode.order_num = 10;
            }
        }
    };
    //从数据源接入
    $scope.addFromDataSource = function(scope){
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/dataDictionFromDataSource',
            controller: 'dataDictionFromDataSourceController',
            controllerAs: 'vm',
            size: 'lg',
            backdrop: false,
            resolve: {
                parentNode:function() {
                    return scope.$modelValue;
                }
            }
        });
        modalInstance.result.then(function (rs) {
            console.log('-----rss=',rs);
            if(rs.status == 'success'){
                //将这些数据去重复存入新增的addedNodes，如果查询出来的数据已经存在于其子节点下，那就不要覆盖或新增了
                rs.dictData.map(function (item,idx) {
                    var theNewNodeIsInParentChild = false;//当前查询的结果值是否存在于父节点的一级子节点中
                    scope.$modelValue.nodes.map(function (child,ix) {
                        if (item.dictDt = child.dictionary_name){
                            theNewNodeIsInParentChild = true;
                        }
                    });
                    if (!theNewNodeIsInParentChild){//把
                        var tempObj = {
                            id: '',//临时id，后台不会使用，主要用于编辑的判断
                            parent_id: scope.$modelValue.id,
                            dictionary_name: item.dictDt,
                            code: generateUuid(8,16),
                            order_num: 10,
                            status: '1',
                            description: '',
                            nodes: []
                        };
                        $scope.addedNodes.push(tempObj);
                        // scope.$modelValue.nodes.push(tempObj);
                        scope.$modelValue.nodes.splice(0,0,tempObj);
                    }
                });
            };
        });
    };


    //展开或闭合单个节点
    $scope.toggle = function (scope) {
        scope.toggle();
    };

    $scope.collapsedAll = function () {
        $scope.$broadcast('angular-ui-tree:collapse-all');
    };


});

app.controller('dataDictionFromDataSourceController',function ($scope, $http, $uibModalInstance, parentNode) {
    $scope.configObj = {"database":"","tablename":"","currSeleTbColumn":""};//输入的配置数据
    //如果你要添加数据库，请注意添加查询表及column的语句
    $scope.dbTypes = [{'name': 'MySql', 'value': 'mysql'}, {'name': 'SQL Server', 'value': 'mssql'},
        {'name': 'Oracle', 'value': 'oracle'}, {'name': 'PostGresql', 'value': 'pgsql'}];
    $scope.whereOptions = [];//筛选条件

    //获取数据库,根据填写的信息获取数据库的表
    $scope.getDatabase = _.debounce(function () {
        $scope.lists = [];//先清空以前的历史数据
        $scope.tableNames = [];
        $scope.currTbColumns = [];

        if ($scope.configObj.ip && $scope.configObj.port && $scope.configObj.user_name && $scope.configObj.password && $scope.configObj.ip != '' && $scope.configObj.port != '' && $scope.configObj.user_name != '' && $scope.configObj.password != '') {
            $http({
                method: 'POST',
                url: '/api/source/systemList',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    data: $scope.configObj,
                }
            }).success(function (rs) {
                console.log('====rs',rs);
                if (rs.code == "1") {
                    $scope.lists = rs.list;
                }
            });
        } else {
            return false;
        }
        $scope.checkDBConfigInfo();//禁用/启用获取数据按钮
    }, 500);
    //根据链接信息获取表名
    $scope.getTableAndColumnNamesByConnInfo = function (isGetTableName) {
        if (isGetTableName && isGetTableName == '1'){//清空数据
            $scope.tableNames = [];
        }else if(isGetTableName && isGetTableName == '2'){
            $scope.currTbColumns = [];
        }
        if ($scope.configObj.ip && $scope.configObj.port && $scope.configObj.user_name &&
            $scope.configObj.password && $scope.configObj.database && $scope.configObj.ip != '' &&
            $scope.configObj.port != '' && $scope.configObj.user_name != '' &&
            $scope.configObj.password != '' && $scope.configObj.database != '') {
            var configObj = angular.copy($scope.configObj);
            configObj['isGetTableName'] = isGetTableName;
            if(isGetTableName == '2'){
                configObj['tableName'] = $scope.configObj.tablename;
                if (!configObj['tableName'] || configObj['tableName'] == ''){
                    return ;
                }
            }
            $http({
                method: 'POST',
                url: '/api/source/getTableAndColumnNamesByConnInfo',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    data: configObj
                }
            }).success(function (rs) {
                console.log('===getTableAndColumnNamesByConnInfo=rs',rs);
                if (rs.status == "success") {
                    if (isGetTableName && isGetTableName == '1'){
                        $scope.tableNames = rs.tableNames;
                    }else if(isGetTableName && isGetTableName == '2'){
                        $scope.currTbColumns = rs.currSeleTBColumns;
                    }
                }else{
                    alert(rs.data);
                }
            });
        } else {
            alert('请确认连接信息是否填写完整！')
        }
        $scope.checkDBConfigInfo();//禁用/启用获取数据按钮
    }

    //筛选条件部分,操作whereOptions
    //新增一个where条件
    $scope.addNewWhere = function () {
        $scope.whereOptions.push({
            column:'',
            operator:'',
            optvalue:'',
        });
    };
    //删除一个where条件
    $scope.removeWhereItem = function (index) {
        $scope.whereOptions.splice(index,1);
        // if ($scope.whereOptions.length <= 0){
        //     $scope.whereOptions.push({
        //         column:'',
        //         operator:'',
        //         optvalue:'',
        //     });
        // }
    };
    $scope.columnChange = function(){
        $scope.checkDBConfigInfo();
    };
    //检查数据库填写信息是否完整
    $scope.getDataDisableBut = 0;//是否可以点击获取数据的按钮
    $scope.checkDBConfigInfo = function(){
        var tempCnt = {'total':0,'empty':0,'valued':0};
        for(var key in $scope.configObj){
            tempCnt['total'] += 1;
            if (!$scope.configObj[key] || $scope.configObj[key] == '' || $scope.configObj[key].trim() == ''){
                tempCnt['empty'] += 1;
            }else{
                tempCnt['valued'] += 1;
            }
        }
        if (tempCnt['total'] > 0 && tempCnt['empty'] == 0 && tempCnt['valued'] == tempCnt['total']){//如果所有的信息都填写了
            $scope.getDataDisableBut = 0;//是否可以点击获取数据的按钮
        }else{
            $scope.getDataDisableBut = 1;//是否可以点击获取数据的按钮
        }
        if ($scope.configObj == {}) {
            $scope.getDataDisableBut = 1;//是否可以点击获取数据的按钮
        }
        $scope.dictData = [];//每次check的时候都把查询的出来的数据清空
    };
    $scope.checkDBConfigInfo();

    //根据所填信息获取数据
    $scope.getDataByConnInfoSql = function () {
        $scope.dictData = [];//先清空
        var configObj = angular.copy($scope.configObj);
        configObj['whereOptions'] = angular.copy($scope.whereOptions);
        $http({
            method: 'POST',
            url: '/api/source/getDataByConnInfo',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                data: configObj
            }
        }).success(function (rs) {
            console.log('---getDataByConnInfoSql----rs=',rs);
            if (rs.status == "success") {
                $scope.dictData = rs.dictData;
            }else{
                alert(rs.data);
            }
        });
    }
    //保存
    $scope.yesyesyes = function () {
        if ($scope.dictData){
            console.log('---$scope.dictData=',$scope.dictData);
            $uibModalInstance.close({'status':'success','dictData':$scope.dictData});
        }
    };
    //取消按钮
    $scope.nonono = function () {
        $uibModalInstance.close({'status':'cancel'});
    };


});
