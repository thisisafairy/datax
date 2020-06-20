var app = angular.module('filemanage', ['ui.bootstrap', 'ngDragDrop', 'ui.router', 'ui.codemirror', 'ui.grid', 'ui.grid.selection', 'ui.grid.resizeColumns', 'ui.grid.autoResize', 'ui.grid.exporter', 'ui.grid.pagination', 'ui.grid.edit']);

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/list');
    $stateProvider.state('list', {
        url: '/list',
        templateUrl: '/dashboard/uploadFileList',
        controller: 'listController'
    })
        .state('edit', {
            url: '/edit/:id',
            templateUrl: '/dashboard/uploadFileEdit',
            controller: 'editController'

        });
});

app.controller('fileManageController', function () {

});

//列表页controller
app.controller('listController', function ($http, $scope, $uibModal) {
    $scope.sourcelists = []
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function(){
        $scope.getdata($scope.currentPage);
    };
    // 查询
    $scope.getdata = function(page){
        var key = $scope.searchkey;
        var url = '/api/source/getUpFileList?page='+page;
        if(key != ''){
            url = encodeURI(url+"&search="+key);//中文转码
        }
        $http.get(url).then(function (response) {
            if (response.data.status == "success") {
                $scope.sourcelists = response.data.rows;
                $scope.totalItems = response.data.total;
            } else {
                alert('查询失败!');
            }
        });
    };
    $scope.getdata(1);

    // 删除
    $scope.delete_source = function(source_id){
        if(confirm('确定要删除该条数据？')==true){
            $http({
                method: 'POST',
                url: '/api/source/delUpFile',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                data: {
                    source_id: source_id,
                }
            }).success(function (rs) {
                if (rs.status == "success") {
                    $scope.getdata(1);
                }
            });
        }
    };
    //上传excel数据数据
    $scope.uploadExistFile = function (tableName,sourceID) {
        if (!tableName || tableName == '') {
            console.log('startConfig fun\'s param tableName=', tableName);
            return;
        }
        var filetype = tableName.split('_')[0];
        if(!filetype){
            alert('不知道文件类型');
            return;
        }

        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/configPage/' + filetype,
            controller: 'fileReuploadController',
            resolve: {
                tableName: function () {
                    return tableName;
                },
                sourceId: function () {
                    return sourceID;
                },
                fileType: function () {
                    return filetype;
                }
            }
        });
        modalInstance.result.then(function (rs) {
            if(rs.status == 'success'){//上传成功则重新刷新数据
                $scope.getdata(1);
                alert('上传成功！')
            }
        }, function () {
        });
    };

});

// 编辑界面
app.controller('editController', ['$scope','$rootScope', '$http', '$uibModal', '$window', '$interval', '$stateParams', '$q', function ($scope, $rootScope, $http, $uibModal, $window, $interval, $stateParams) {
    $scope.sourceId = $stateParams.id;

    $scope.tableObj = {};
    $scope.tableCols = [];
    $scope.dataLists = [];
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';

    // grid配置参数
    $scope.gridOptions = {
        data: '',
        columnDefs: [],
        enableSorting: false, //是否排序
        useExternalSorting: false, //是否使用自定义排序规则
        enableGridMenu: true, //是否显示grid 菜单
        showGridFooter: false, //是否显示grid footer
        enableHorizontalScrollbar: 1, //grid水平滚动条是否显示, 0-不显示  1-显示
        enableVerticalScrollbar: 0, //grid垂直滚动条是否显示, 0-不显示  1-显示

        //-------- 分页属性 ----------------
        enablePagination: true, //是否分页，默认为true
        enablePaginationControls: true, //使用默认的底部分页
        paginationPageSizes: [10, 15, 20, 50, 100], //每页显示个数可选项
        paginationCurrentPage: 1, //当前页码
        paginationPageSize: 10, //每页显示个数
        //paginationTemplate:"<div></div>", //自定义底部分页代码
        totalItems: 0, // 总数量
        useExternalPagination: true, //是否使用分页按钮

        //----------- 选中 ----------------------
        enableFooterTotalSelected: false, // 是否显示选中的总数，默认为true, 如果显示，showGridFooter 必须为true
        enableFullRowSelection: false, //是否点击行任意位置后选中,默认为false,当为true时，checkbox可以显示但是不可选中
        enableRowHeaderSelection: true, //是否显示选中checkbox框 ,默认为true
        enableRowSelection: true, // 行选择是否可用，默认为true;
        enableSelectAll: true, // 选择所有checkbox是否可用，默认为true;
        modifierKeysToMultiSelect: false, //默认false,为true时只能 按ctrl或shift键进行多选, multiSelect 必须为true;
        multiSelect: true, // 是否可以选择多个,默认为true;
        noUnselect: false, //默认false,选中后是否可以取消选中
        // selectionRowHeaderWidth:30 ,//默认30 ，设置选择列的宽度；

        //---------------api---------------------
        onRegisterApi: function (gridApi) {
            $scope.gridApi = gridApi;
            //分页按钮事件
            gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                if ($scope.getData) {
                    $scope.getData(newPage, pageSize);
                }
            });
            //行选中事件
            $scope.gridApi.selection.on.rowSelectionChanged($scope, function (row, event) {
                if (row) {
                    // console.log(row);
                }
            });
        }

    };

    // 查询
    $scope.getData = function(curPage, pageSize){
        var key = $scope.searchkey;
        $http({
            method: 'POST',
            url: '/api/source/getUpFileDatas',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                sourceId: $scope.sourceId,
                page: curPage,
                limit: pageSize
            }
        }).success(function (rs) {
            console.log(rs);
            if (rs.status == "success") {
                $scope.tableObj = rs.tableObj;
                $scope.tableCols = rs.tableCols;
                $scope.gridOptions.data = rs.rows;
                $scope.gridOptions.totalItems = rs.total;
                $scope.gridOptions.columnDefs = [];
                $scope.tableCols.forEach(function (value, index, array) {
                    var visible = true;
                    var enableCellEdit = true;
                    if (index == 0) {
                        visible = false;
                        enableCellEdit = false
                    }
                    // 判断是否时间类型
                    if (value['type'].indexOf('date') > -1 || value['type'].indexOf('time') > -1) {

                    }

                    $scope.gridOptions.columnDefs.push({
                        field: value.columns,
                        displayName: value.name,
                        visible: visible,
                        enableCellEdit: enableCellEdit,
                        minWidth: 150, width: 200
                    });
                })
            }
        });
    };

    $scope.getData(1, $scope.gridOptions.paginationPageSize);

    $scope.dataEdit = function (operationType) {
        var rows = [];
        if (operationType == 'delete') {
                rows = $scope.gridApi.selection.getSelectedRows();
            if (rows && rows.length > 0) {

            } else {
                alert('请选择数据!');
                return;
            }
        } else {
            rows = $scope.gridOptions.data;
        }
        if (operationType == 'delete' || operationType == 'edit') {
            $http({
                url: '/api/source/uploadDataUpdate',
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    rows: rows,
                    tableCols: $scope.tableCols,
                    tableObj: $scope.tableObj,
                    operationType: operationType
                }
            }).success(function (rs) {
                if (rs.status == 'success') {
                    $scope.getData(1, $scope.gridOptions.paginationPageSize);
                    alert('修改成功!');
                }
            });
        } else if (operationType == 'add') {
            var modalInstance = $uibModal.open({
                templateUrl: 'dataEdit.html',
                controller: 'editFormController',
                backdrop: "static",
                controllerAs: 'vm',
                resolve: {
                    tableCols: function () {
                        return $scope.tableCols;
                    },
                    tableObj: function () {
                        return $scope.tableObj;
                    }
                }
            });
            modalInstance.result.then(function (rs) {
                // console.log(rs);
                if (rs == 'success') {
                    $scope.getData(1, $scope.gridOptions.paginationPageSize);
                }
            });
        }
    };

}]);

app.controller('editFormController', function ($scope, $http, $uibModalInstance, $timeout, tableCols, tableObj) {
    $scope.tableCols = tableCols;
    $scope.tableObj = tableObj;
    $scope.dataObj = {};
    $scope.popup2 = {
        opened: false
    };

    $scope.dateOptions = {
        formatYear: 'yyyy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };

    $scope.open2 = function() {
        $scope.popup2.opened = true;
    };

    $scope.saveData = function (params) {
        $http({
            url: '/api/source/uploadDataUpdate',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                rows: $scope.dataObj,
                tableObj: $scope.tableObj,
                tableCols: $scope.tableCols,
                operationType: 'add'
            }
        }).success(function (rs) {
            if (rs.status == 'success') {
                alert('保存成功!');
                $uibModalInstance.close('success');
            }
        });
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

app.filter('nameToType', function () {
    return function (input) {
        var arr = input.split('_');
        return arr[0];
    }
});


/* 数据源编辑控制器 ，使用数据接入的文件接入的页面，因此需要使用一些特别的参数,go or not to go,it's up to you!*/
app.controller('fileReuploadController', function ($scope, $http, $uibModalInstance, tableName, sourceId, fileType) {
    $scope.configlist = {};
    //以下两个变量对页面上的错误提示进行隐藏
    $scope.istest = true;
    $scope.testsuccess = false;

    $scope.configlist.id = '';
    /* 重新上传之前上传的文件 */
    $scope.operaTionType = 'updateFileTable';
    $scope.configlist.type = tableName;
    if(tableName.indexOf('_') > 0){//显示类型
        $scope.configlist.type = tableName.split('_')[0];
    }else if(/^[a-zA-Z]+/.test(tableName)){//如果是xml123456、json123456、csv123456等表名，需要进行拆分
        $scope.configlist.type = tableName.match(/^[a-zA-Z]+/)[0];
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss({'status':'cancel'});
    };

    $scope.coverFile = function () {
        $("body").mLoading();//遮罩层，用户导入数据后台处理的时候显示
        $scope.uploadFileStatus = true;
        $http({
            method: 'POST',
            url: '/api/source/coverFile',
            headers: {'Content-Type': undefined, 'X-CSRFToken': getCookie('csrftoken')},
            data: {
                filename: document.getElementById('fileupload').files[0],
                tableName: tableName,
                upload_type: $scope.configlist.upload_type,//覆盖上传还是增量上传
                excel_nullchrepl: $scope.configlist.excel_nullchrepl
            },
            transformRequest: function (data) {
                var formData = new FormData();
                angular.forEach(data, function (value, key) {
                    formData.append(key, value);
                });
                return formData;
            }
        }).success(function (rs) {
            $("body").mLoading('destroy');//遮罩层，用户导入数据后台处理的时候显示
            $scope.uploadFileStatus = false;
            if (rs.return_mess == '0') {
                alert("上传失败");
            } else {
                $uibModalInstance.close({'status':'success'});
            }
        });
    }
    $scope.permupload = false;
    $scope.validfile = function (f) {
        var upfilepath = f.files[0].name;
        var fileneed = upfilepath.substring(upfilepath.lastIndexOf(".") + 1);
        if (!fileneed) {
            $scope.permupload = false;
        } else if (fileType == 'txt' && fileneed != 'txt') {
            $scope.permupload = false;
        } else if (fileType == 'csv' && fileneed != 'csv') {
            $scope.permupload = false;
        } else if (fileType == 'excel') {
            if (fileneed == 'xls' || fileneed == 'xlsx') {
                $scope.permupload = true;
            } else {
                $scope.permupload = false;
            }
        } else {
            $scope.permupload = true;
        }

        if (!$scope.permupload) {
            clearFUTagValue();
            alert("请确认上传文件类型是否正确");
        }
    }
    $scope.downTemp = function () {//下载模板文件
        if (!fileType) {
            alert('文件类型错误！');
            return;
        }
        $http.get('/dashboard/downloadTemplateFile?tpfiletype=' + fileType).then(function (rs) {
            if (rs.data.code == 1) {
                var filePath = rs.data.filePath;
                var triggerDownload = $("<a>").attr("href", filePath).attr("download", 'TempFile' + rs.data.dtfiletype).appendTo("body");
                triggerDownload[0].click();
                triggerDownload.remove();
            }
        });
    }

    function clearFUTagValue() {
        document.getElementById('fileupload').value = '';
    }

    $scope.uploadFileStatus = false;
    $scope.upload = function () {
        //验证文件类型
        var uploadFile = document.getElementById('fileupload').files[0];
        uploadFileSName = uploadFile.name.toLowerCase();
        excel_nullchreplstr = '';
        if (fileType == 'excel') {
            excel_nullchreplstr = $scope.configlist.excel_nullchrepl;
            if (uploadFileSName.indexOf('.xlsx') == -1 && uploadFileSName.indexOf('.xls') == -1) {
                alert('请上传规范的excel文件！');
                clearFUTagValue();
                return;
            }
        } else if (fileType == 'txt') {
            if (uploadFileSName.indexOf('.txt') == -1) {
                alert('请上传规范的txt文件！');
                clearFUTagValue();
                return;
            }
        } else if (fileType == 'csv') {
            if (uploadFileSName.indexOf('.csv') == -1) {
                alert('请上传规范的csv文件！');
                clearFUTagValue();
                return;
            }
        } else if (fileType == 'json') {
            if (uploadFileSName.indexOf('.json') == -1) {
                alert('请上传规范的json文件！');
                clearFUTagValue();
                return;
            }
        } else if (fileType == 'xml') {
            if (uploadFileSName.indexOf('.xml') == -1) {
                alert('请上传规范的xml文件！');
                clearFUTagValue();
                return;
            }
        }
        $("body").mLoading();//遮罩层，用户导入数据后台处理的时候显示
        $scope.uploadFileStatus = true;
        $http({
            method: 'POST',
            url: '/api/source/uploadfile',
            headers: {'Content-Type': undefined, 'X-CSRFToken': getCookie('csrftoken')},
            data: {
                filename: uploadFile,
                problemType: '3',
                type: fileType,
                file_show_name: $scope.configlist.file_show_name,
                symbol_type: $scope.configlist.symbol_type,
                excel_nullchrepl: excel_nullchreplstr
            },
            transformRequest: function (data) {
                var formData = new FormData();
                angular.forEach(data, function (value, key) {
                    formData.append(key, value);
                });
                return formData;
            }
        }).success(function (rs) {
            $("body").mLoading('destroy'); //遮罩层，用户导入数据后台处理的时候显示
            $scope.uploadFileStatus = false;//alert时异步的，一般会先alert再按钮变成可点击
            if (rs.return_mess == 'encoding error') {
                alert("文件解析失败，请上传规范的文件！");
            } else if (Number(rs.return_mess) > 1) {
                alert('上传失败！');
            } else if (rs.code != 1) {
                alert('上传失败！' + rs.msg);
            } else {
                $uibModalInstance.close({'status':'success'});
            }
        }).error(function () {
            //如果发生错误也需要隐藏遮罩层
            $("body").mLoading('destroy');//遮罩层，用户导入数据后台处理的时候显示
            alert('上传失败！');
        });
    };

    addDragToDialog();
});
function addDragToDialog() {
    $(".modal-content").draggable({///添加拖拽效果
        cursor: "move",
        handle: '.modal-header'
    });
}