var app = angular.module('dataEdit', ['ui.bootstrap', 'ui.grid', 'ui.grid.selection', 'ui.grid.resizeColumns', 'ui.grid.autoResize', 'ui.grid.exporter', 'ui.grid.pagination']);

app.controller('dataEditController', function ($scope, $http, $uibModal, $interval, $window, i18nService, uiGridSelectionService) {
    // olap关联的表名
    $scope.tableName = '';
    $scope.selOlapId = '';
    // 国际化
    i18nService.setCurrentLang("zh-cn");

    // 获取olap列表
    $http.get('/api/dash/getOlaplists?directconnisnull=yes').then(function (rs) {
        $scope.olaplist = rs.data;
        // console.log($scope.olaplist);
    });

    // grid配置参数
    $scope.gridOptions = {
        data: '',
        columnDefs: [],
        enableSorting: true, //是否排序
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

    // 获取grid的数据
    $scope.getData = function (curPage, pageSize) {
        var params = {
            curPage: curPage,
            pageSize: pageSize,
            columns: $scope.columns,
            tableName: $scope.tableName
        };
        $http({
            url: '/dashboard/getTableData',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                params: params
            }
        }).success(function (rs) {
            if (rs.code == '1') {
                // for(i=0;i<rs.dataList.length;i++){//对返回数据里所有时间格式化
                //     for(key in rs.dataList[i]){
                //         if(isNaN(rs.dataList[i][key])&&!isNaN(Date.parse(rs.dataList[i][key]))){
                //             rs.dataList[i][key]=dateFtt("yyyy年MM月dd日hh时mm分",new Date(rs.dataList[i][key]));
                //         }
                //     }
                // }
                // console.log('datalist=',rs.dataList);
                $scope.gridOptions.data = rs.dataList;
                $scope.gridOptions.totalItems = rs.total;
                $scope.gridOptions.paginationCurrentPage = curPage;
                $scope.tableStructure = rs.tableStructure;
            }
        });
    }

    // 获取olap表结构
    $scope.showTable = function (row, rowKey) {
        row = $scope.olapDataSet;
        $scope.currentTable = row.name;
        $scope.selOlapId = row['id'];
        $http.get('/api/dash/getOlapAllColumnInfo/' + row['id']).then(function (rs) {
            $scope.columns = rs.data.data;
            $scope.tableName = rs.data.tableName;
            $scope.olapList = rs.data.olapList;
            $scope.extraCols = [];
            for (var i in $scope.olapList) {
                var flag = true;
                for (var j in $scope.columns) {
                    if ($scope.olapList[i].name == $scope.columns[j].fullname) {
                        flag = false;
                    }
                }
                if (flag) {
                    var col = {
                        col: '',
                        fullname: $scope.olapList[i].name,
                        function: 'sum',
                        isedit: '0',
                        olaptitle: '',
                        order: '',
                        table: '',
                        title: $scope.olapList[i].title
                    }
                    $scope.extraCols.push(col);
                }
            }
            $scope.tableDisplayName = row['name'];
            $scope.gridOptions.columnDefs = [];
            for (var key in $scope.columns) {
                var column = {
                    field: $scope.columns[key].fullname,
                    displayName: $scope.columns[key].title,
                    suppressRemoveSort: false,
                    minWidth: 150, width: 200
                };
                $scope.gridOptions.columnDefs.push(column);
            }
            for (var key2 in $scope.extraCols) {
                var column2 = {
                    field: $scope.extraCols[key2].fullname,
                    displayName: $scope.extraCols[key2].title,
                    suppressRemoveSort: false,
                    minWidth: 150, width: 200
                };
                $scope.gridOptions.columnDefs.push(column2);
            }
            $scope.gridOptions.columnDefs.push({
                field: 'add_time',
                displayName: '调度时间',
                visible: false,
                minWidth: 150, width: 200
            });
            $scope.gridOptions.columnDefs.push({
                field: 'version',
                displayName: '版本',
                visible: false,
                minWidth: 150, width: 200
            });
            $scope.gridOptions.columnDefs.push({
                field: 'extra_processing',
                displayName: '额外导入数据',
                cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope">{{row.entity.extra_processing=="y"?"是":"否"}}</div>',
                suppressRemoveSort: false,
                minWidth: 150, width: 200
            });
            // console.log($scope.columns);
            // console.log($scope.tableName);

            // 初始化grid控件
            $scope.getData(1, $scope.gridOptions.paginationPageSize);
        });
        $scope.allDBInfo = {};
        $http.get('/api/dash/getDBInfo?type=db').then(function (rs) {//获取所有数据库的信息
            if (rs.data.status == 'success') {
                $scope.allDBInfo = rs.data.data;
                $scope.allDBInfo.push({'dbname': 'dataxExtension', 'dbid': 'dataxextension'});//多加一个olap的默认库
            } else {
                alert(rs.data);
            }
        })
        $scope.columnConfig = {};//获取columnconfig用于编辑columconfig的回显和用于新增使用
        $http.get('/api/dash/getColumnConfigByOlapid?olapid=' + $scope.selOlapId + '&getAll=no').then(function (rs) {
            // console.log('$scope.columnConfig=', $scope.columnConfig);
            if (rs.data.status == 'success') {
                $scope.columnConfig = rs.data.data;
            }
        })
    };

    // 行编辑
    $scope.editRow = function () {
        var rows = $scope.gridApi.selection.getSelectedRows();
    };

    // excel导出
    $scope.excelExport = function () {
        var params = {
            columns: $scope.columns,
            extraCols: $scope.extraCols,
            tableName: $scope.tableName,
        };
        $http({
            url: '/dashboard/olapTableExcelExport',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                params: params
            }
        }).success(function (rs) {
            if (rs.code == '1') {
                var filePath = rs.filePath.substr(1);
                var triggerDownload = $("<a>").attr("href", filePath).attr("download",
                    $scope.tableDisplayName + "-" +
                    dateFtt("yyyy年MM月dd日hh时mm分", new Date()) + ".xlsx").appendTo("body");
                triggerDownload[0].click();
                triggerDownload.remove();
            }
        });
    };

    // excel模板导出
    $scope.olapTableExcelTemplateExport = function () {
        var params = {
            columns: $scope.columns,
            extraCols: $scope.extraCols,
            tableName: $scope.tableName,
        };
        $http({
            url: '/dashboard/olapTableExcelTemplateExport',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                params: params
            }
        }).success(function (rs) {
            if (rs.code == '1') {
                var filePath = rs.filePath.substr(1);
                var triggerDownload = $("<a>").attr("href", filePath).attr("download",
                    $scope.tableDisplayName + "excel导入模板.xlsx").appendTo("body");
                triggerDownload[0].click();
                triggerDownload.remove();
            }
        });
    };

    // excel导入
    $scope.excelImport = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'excelImport.html',
            controller: 'excelImportController',
            backdrop: "static",
            controllerAs: 'vm',
            resolve: {
                columns: function () {
                    return $scope.columns;
                },
                extraCols: function () {
                    return $scope.extraCols;
                },
                tableName: function () {
                    return $scope.tableName;
                }
            }
        });
        modalInstance.result.then(function (rs) {
            if (rs == 'success') {
                $scope.getData(1, $scope.gridOptions.paginationPageSize);
            }
        });
    };

    // 新增数据的配置项
    $scope.configSourceImport = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'configSourceImport.html',
            controller: 'configSourceImportController',
            backdrop: "static",
            controllerAs: 'vm',
            resolve: {
                olapId: function () {
                    return $scope.selOlapId;
                },
                columns: function () {
                    return $scope.columns;
                },
                extraCols: function () {
                    return $scope.extraCols;
                },
                tableName: function () {
                    return $scope.tableName;
                },
                allDBInfo: function () {
                    return $scope.allDBInfo;
                },
                columnConfig: function () {
                    return '';
                }
            }
        });
        modalInstance.result.then(function (rs) {
            if (rs['status'] == 'success') {
                // $scope.getData(1, $scope.gridOptions.paginationPageSize);
                $scope.columnConfig = rs['columnConfig'];
            }
        });
    };

    // 编辑
    $scope.dataEdit = function (operationType) {
        var rows = $scope.gridApi.selection.getSelectedRows();
        if (operationType == 'delete') {
            if (rows.length == 1 && rows[0].extra_processing != 'y' && rows[0].extra_processing != '') {
                alert('所选数据为非额外导入数据,这些数据将不会处理');
                $scope.getData(1, $scope.gridOptions.paginationPageSize);
                return;
            }
            // console.log(typeof(rows));
            if (rows && rows.length > 0) {
                for (i = 0; i < rows.length; i++) {
                    if (rows[i].extra_processing != 'y') {
                        alert('所选数据中包含非额外导入数据,这些数据将不会处理');
                        break;
                    }
                }
                $http({
                    url: '/dashboard/olapTableDataUpdate',
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    data: {
                        rows: rows,
                        columns: $scope.columns,
                        tableName: $scope.tableName,
                        operationType: operationType
                    }
                }).success(function (rs) {
                    if (rs.code == '1') {
                        $scope.getData(1, $scope.gridOptions.paginationPageSize);
                        alert('删除成功!');
                    }
                });
            } else {
                alert('请选择数据!');
            }
        } else if (operationType == 'add' || operationType == 'update') {
            if (operationType == 'update' && (rows == null || rows.length != 1)) {
                alert('请选择一行数据!');
                return;
            }
            if (operationType == 'update' && rows[0].extra_processing != 'y') {
                alert('请选择额外导入数据进行编辑操作!');
                return;
            }
            if (!$scope.selOlapId || $scope.selOlapId == '') {
                alert('请选择olap!');
                return;
            }
            var modalInstance = $uibModal.open({
                templateUrl: 'dataEdit.html',
                controller: 'editController',
                backdrop: "static",
                controllerAs: 'vm',
                resolve: {
                    columns: function () {
                        return $scope.columns;
                    },
                    tableName: function () {
                        return $scope.tableName;
                    },
                    rows: function () {
                        return rows;
                    },
                    tableStructure: function () {
                        return $scope.tableStructure;
                    },
                    operationType: function () {
                        return operationType;
                    },
                    olapId: function () {
                        return $scope.selOlapId;
                    },
                    columnConfig: function () {
                        return $scope.columnConfig;
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
});

app.controller('editController', function ($scope, $http, $uibModalInstance, $timeout, columns, tableName, rows, tableStructure, operationType, olapId, columnConfig) {
    $scope.columns = columns;
    $scope.tableName = tableName;
    $scope.row = rows[0];
    $scope.tableStructure = tableStructure;
    $scope.operationType = operationType;
    $scope.olapId = olapId;
    $scope.columnConfig = columnConfig;//用户配置的column信息，保存到connect_olapcolumn表的option字段
    $scope.dataObj = {};    //保存用户输入的数据，持久化到数据库
    $scope.addstatus = true;//把更新/新增状态传入directived输入框控件，以便区别配置的时候设置的输入值是否需要自动填满
    if (operationType != 'add') {
        $scope.addstatus = false;
    }

    for (var key in $scope.columns) {
        if (operationType == 'add') {
            $scope.dataObj[$scope.columns[key].fullname] = '';
        } else if (operationType == 'update') {
            $scope.dataObj[$scope.columns[key].fullname] = $scope.row[$scope.columns[key].fullname]
        }
    }
    $scope.columnTyps = {};//把类型放到一个字典里，在alter-input里需要使用，需要把字段类型传递进去
    for (let i = 0; i < $scope.tableStructure.length; i++) {
        $scope.columnTyps[$scope.tableStructure[i].column_name] = $scope.tableStructure[i].data_type;
    }
    $scope.saveData = function (params) {
        $http({
            url: '/dashboard/olapTableDataUpdate',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                row: $scope.dataObj,
                oldRow: $scope.row,
                columns: $scope.columns,
                tableName: $scope.tableName,
                operationType: operationType
            }
        }).success(function (rs) {
            if (rs.code == '1') {
                $uibModalInstance.close('success');
                alert('保存成功!');
            }
        });
    }

    // 取消编辑模块并关闭编辑框
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

// excel导入
app.controller('excelImportController', function ($scope, $http, $uibModalInstance, columns, extraCols, tableName) {
    $scope.coverUpload = false;
    $scope.columns = columns;
    $scope.extraCols = extraCols;
    // console.log($scope.columns);
    // console.log($scope.extraCols);
    $scope.uploadExcel = function (importType) {
        var r = confirm("确定导入吗？");
        if (r == true) {
            $http({
                method: 'POST',
                url: '/dashboard/olapTableExcelImport',
                headers: {
                    'Content-Type': undefined,
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    filename: document.getElementById('fileupload').files[0],
                    importType: importType,
                    tableName: tableName,
                    columns: JSON.stringify($scope.columns),
                    extraCols: JSON.stringify($scope.extraCols),
                    coverUpload: $scope.coverUpload
                },
                transformRequest: function (data) {
                    var formData = new FormData();
                    angular.forEach(data, function (value, key) {
                        formData.append(key, value);
                    });
                    return formData;
                }
            }).success(function (rs) {
                if (rs.code == '0') {
                    alert("文件解码失败，请将文件转为utf-8编码格式之后再进行上传！");
                } else {
                    alert('导入成功!')
                    $uibModalInstance.close('success');
                }
            });
        }
    }

    // 取消编辑模块并关闭编辑框
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

});

//数据源配置接入
//首先查询数据库供用户选择，用户根据用户选择的数据库动态查询该库下的表，根据表动态选择表下的字段
//数据以字典的方式保存，方便获取、遍历和节约内存,
app.controller('configSourceImportController', function ($scope, $http, $uibModal, $uibModalInstance, $timeout, olapId, columns, allDBInfo) {
    $scope.columns = columns;
    $scope.allDBInfo = allDBInfo;
    $scope.columnConfig = {};//用户配置的column信息，保存到connect_olapcolumn表的option字段
    $scope.allTableInfo = {};
    $scope.allColumnInfo = {};
    $scope.maintenMethod = [{name:'输入框',value:'0'},
                            {name:'下拉框',value:'1'},
                            {name:'日期选择',value:'2'}];

    // console.log('configSourceImportController olapId=', olapId);
    // console.log('configSourceImportController columns=', columns);
    // console.log('configSourceImportController allDBInfo=', allDBInfo);


    //更新数据库信息
    $scope.updateDB = function () {
        $http.get('/api/dash/getDBInfo?type=db').then(function (rs) {//获取所有数据库的信息
            if (rs.data.status == 'success') {
                $scope.allDBInfo = rs.data.data;
                $scope.allDBInfo.push({'dbname': 'dataxExtension', 'dbid': 'dataxextension'});//多加一个olap的默认库
            } else {
                alert(rs.data);
            }
        });
    }
    //初始化为所有的原库原表原字段
    $http.get('/api/dash/getColumnConfigByOlapid?olapid=' + olapId + '&getAll=yes').then(function (rs) {
        if (rs.data.status == 'success') {
            $scope.allTableInfo = rs.data.echoAllTableInfo;
            $scope.allColumnInfo = rs.data.echoAllColumnInfo;
            $scope.columnConfig = rs.data.data;
        } else {
            alert(rs.data.data);
        }
    })
    //设置默认为该字段从自身获取元数据
    $scope.setDefaultTable = function (columnName, toAll) {//在初始化的时候需要设置为dataxextension还需要初始化表，在切换复选框时也还需要自动设置表
        if (columnName) {
            $scope.getDataByType(columnName, 'tables', $scope.columnConfig[columnName].dbid);
            if (toAll) {
                $timeout(function () {//在赋值成功后，如果是toall就全部赋值
                    for (let key in $scope.columnConfig) {
                        if ($scope.columnConfig[key].useOlap == 1) {
                            $scope.allTableInfo[key] = angular.copy($scope.allTableInfo[columnName]);
                            $scope.columnConfig[key].tableid = olapId;//回显表
                        }
                    }
                }, 1000);
            }
        }
    }

    $scope.toSeleTable = function (columnName) {
        $scope.getDataByType(columnName, 'tables', $scope.columnConfig[columnName].dbid);
        $scope.columnConfig[columnName].colid = '';//每次切换数据库的时候都需要将table和col重置
    };
    $scope.toSelColumn = function (columnName) {
        $scope.getDataByType(columnName, 'columns', $scope.columnConfig[columnName].dbid, $scope.columnConfig[columnName].tableid);
    };

    //添加数据源用于olap字段值来源的配置，打开新窗口，调用和数据接入配置里的后台python函数一致
    $scope.addSource = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/olapAddSourceDBConfigPage',
            controller: 'addSourceController',
            resolve: {}
        });
        modalInstance.result.then(function (rs) {
            if (rs['status'] == 'success') {
                $scope.updateDB();
            }
        });
    };


    //如果使用本地olap，则从olap和olapcolumn表取表和字段信息，本地库则统一使用datax_extension
    $scope.switchOlapOrDb = function (columnName) {
        $scope.columnConfig[columnName].useConstantValue = 0;
        $scope.columnConfig[columnName].constantValue = '';
        if ($scope.columnConfig[columnName].useOlap == 1) {
            $scope.columnConfig[columnName].dbid = 'dataxextension';
            $scope.setDefaultTable(columnName);
        } else {
            $scope.columnConfig[columnName].dbid = '';
        }
        $scope.columnConfig[columnName].tableid = '';
        $scope.columnConfig[columnName].colid = '';
    }

    //切换 数据库选择/固定值输入
    $scope.switchConstantValueOrDb = function (columnName) {
        if ($scope.columnConfig[columnName].useConstantValue == 1) {
            $scope.columnConfig[columnName].useOlap = 0;
            $scope.columnConfig[columnName].dbid = '';
        } else {
            $scope.columnConfig[columnName].useOlap = 1;
            $scope.columnConfig[columnName].dbid = 'dataxextension';
        }
        $scope.columnConfig[columnName].tableid = '';
        $scope.columnConfig[columnName].colid = '';
    }

    $scope.getDataByType = function (columnName, type, dbid, tableid) {
        let reqUrl = '/api/dash/getDBInfo?type=' + type;
        if (type == 'tables') {
            if (dbid) {
                reqUrl += '&dbid=' + dbid;
            } else {
                alert('请先选择数据库！');
                return;
            }
        } else if (type == 'columns') {
            if (dbid && tableid) {
                reqUrl += '&dbid=' + dbid + '&tableid=' + tableid;
            } else {
                alert('请先选择数据库和表！');
                return;
            }
        } else {
            alert('不知道请求什么样的数据！');
            return;
        }
        reqUrl = encodeURI(reqUrl);
        $http.get(reqUrl).then(function (rs) {
            // console.log('rss--', rs);
            if (rs.data.status == 'success') {
                if (type == 'tables') {
                    $scope.allTableInfo[columnName] = rs.data.data;
                } else if (type == 'columns') {
                    $scope.allColumnInfo[columnName] = rs.data.data;
                }
            } else {
                alert(rs.data);
            }
        })
    }

    $scope.ok = function () {
        $http({
            url: '/api/dash/saveConfigColByOlapDataEdit',
            method: 'POST',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                olapId: olapId,
                columnConfig: JSON.stringify($scope.columnConfig)
            }
        }).success(function (rs) {
            if (rs.status == 'success') {
                // alert('更新成功！更新了 ' + rs.data + ' 条数据！');
                alert('更新成功！');
                $uibModalInstance.close({'status': 'success', 'columnConfig': $scope.columnConfig});
            } else {
                alert(rs.data)
            }
        })
    }

    $scope.cancel = function () {
        $uibModalInstance.close({'status': 'cancel'});
    }
});

app.controller('addSourceController', function ($scope, $http, $uibModalInstance, $timeout) {
    $scope.dialogTitle = '新建连接';//弹出框名称
    $scope.configObj = {};//输入的配置数据
    //定义数据库类型
    $scope.dbTypes = [{'name': 'MySql', 'value': 'mysql'}, {'name': 'SQL Server', 'value': 'mssql'},
        {'name': 'Oracle', 'value': 'oracle'}, {'name': 'PostGresql', 'value': 'pgsql'}];

    $scope.testingsts = false;//测试状态：正在测试，测试链接
    $scope.istest = true;//回显测试结果提示
    $scope.testsuccess = false;//测试结果
    //动态给弹出框设置title
    $scope.$watch('configObj.type',function () {
        for(let i = 0;i < $scope.dbTypes.length;i++){
            if ($scope.dbTypes[i]['value'] == $scope.configObj.type){
                $scope.dialogTitle = '新建' + $scope.dbTypes[i]['name'] + '连接';//弹出框名称
                break;
            }
        }
    });


    $scope.test = function () {
        if ($scope.configObj.type != 'odbc') {
            if (!$scope.configObj.database || $scope.configObj.database.trim() == '') {
                alert('请选择数据库名！');
                return;
            }
        }
        $scope.testingsts = true;
        $.ajax({
            url: '/api/source/testPing',
            type: 'POST',
            data: $scope.configObj,
        }).done(function (rs) {
            $scope.testingsts = false;
            $scope.istest = false;
            $scope.msg = rs.msg;
            if (rs.code == '1') {
                $scope.testsuccess = true;
            } else {//view运行出错
                $scope.testsuccess = false;
                $scope.testingsts = false;
            }
            $scope.$apply(function () {
                $scope.time = new Date();
            });
        });
        $scope.getDatabase('yes','yes');//编辑的时候需要显示数据库
    };
    //根据填写的信息获取数据库的表
    $scope.getDatabase = _.debounce(function (hideMsg,clearDBList) {
        if (!hideMsg) {
            $scope.istest = true;//每次切换数据库的时候都需要去掉显示的msg
        }
        if (!$scope.configObj.ip || !$scope.configObj.port || !$scope.configObj.user_name ||
            !$scope.configObj.password || $scope.configObj.ip == '' || $scope.configObj.port == '' ||
            $scope.configObj.user_name == '' || $scope.configObj.password == '') {
            return false;
        }
        //当执行getDatabase时，由于后台查询连接需要较长时间返回信息，故这里先让页面上选择不到数据库，等正确返回后赋值即可选择
        if (!clearDBList){
            $scope.lists = [];
        }
        $http({
            method: 'POST',
            url: '/api/source/systemList',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                data: $scope.configObj,
            }
        }).success(function (rs) {
            if (rs.code == "1") {
                $scope.lists = rs.list;
            }
        });
    }, 500);
    //保存配置信息
    $scope.ok = function () {
        showLoading();
        $scope.configObj['fromOlapAdd'] = 'y';
        $.ajax({
            url: '/api/source/saveSource',
            type: 'POST',
            data: $scope.configObj,
        }).done(function (rs) {
            hideLoading();
            if (rs.status == 'success') {
                $scope.msg = rs.msg;
                $scope.testsuccess = true;
                $uibModalInstance.close({'status':'success'});
            } else {
                $scope.msg = rs.data;
                $scope.testsuccess = false;
                alert(rs.data);
            }
        });
    };
    $scope.cancel = function () {
        $uibModalInstance.close({'status':'failure'});
    }
});