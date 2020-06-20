
function getOlapNameById (olapList, olapId) {
    var olapName = '';
    for (var key in olapList) {
        if (olapList[key].id + '' == olapId + '') {
            olapName = olapList[key].name;
            break;
        }
    }
    return olapName;
}

function getOlapColNameById (colList, colId) {
    var colName = '';
    for (var key in colList) {
        if (colList[key].column == colId) {
            var colName = colList[key].title;
            break;
        }
    }
    return colName;
}

//过滤掉后台取出来的olap列中的
function filterCol(colsObj) {
    var olapColumns = colsObj.olapColumns;
    var olapExtCols = colsObj.olapExtCols;
    var defaultCols = [];
    for (var key in olapColumns) {
        var flag = true;
        for (key2 in olapExtCols) {
            if (olapExtCols[key2].title == olapColumns[key].column) {
                var flag = false;
            }
        }
        if (flag) {
            defaultCols.push(olapColumns[key]);
        }
    }
    colsObj.olapColumns = defaultCols;
    return colsObj;
}

var app = angular.module('olapExt', ['ui.bootstrap']);

app.controller('olapExtController', function ($scope, $timeout, $http, $uibModal, $interval, $window, $document, $sce) {
    $scope.moduleInfo = $sce.trustAsHtml('<span style="color: red">1、原olap修改后请回到此模块选择对应的olap进行重新保存一次</span>'
        + '<br><span style="color: red">2、增加计算字段时请保证所有选择的olap的都具有同样的关联维度</span>'
        + '<br><span style="color: red">3、增加计算字段时请不要把基础数值放在第一个</span>');
    $scope.olapList = [{id:'0', name:'', olaptype:''}];
    $scope.mainOlapId = '0';
    $scope.mianOlapName = '';
    $scope.mainOlapInfos = {};
    $scope.extCols = [];
    $scope.defaultExtCol = {
        colType: 'default',
        olapId: '', //关联的olap的id
        olapTable: '', //关联的olap的名称
        olapName: '', //关联的olap的名称
        olapCol: '', //关联的olap的列
        olapColName: '', //关联的olap的列的别名
        olapCols: {}, //关联的olap的所有的列
        joinCol: [{'mainCol': '', 'joinCol':'', 'colOper':'', 'colCalc': ''}], //关联字段
        colTitle: '', //增加的列的列名
        colName: '' //增加的列的列别名
    }

    $scope.extCalcCols = [];
    $scope.calcExtCol = {
        colType: 'calc',
        calcFormula:'',
        displayCalcFormula:'',
        colTitle: '',
        colName: '',
        mainCol: '',
        cols: [{
            calcType:'+',
            lBrackets:'',
            rBrackets:'',
            olapId: '',
            olapTable: '',
            olapName: '',
            col: '',
            cols: [],
            colName: '',
            joinCol: [{'mainCol': '', 'joinCol':'', 'colOper':'', 'colCalc': ''}] //关联字段
        }]
    };

    //新增列
    $scope.addExtCol = function(type) {
        if (type == 'default') {
            var colObj = angular.copy($scope.defaultExtCol);
            $scope.extCols.push(colObj);
        } else if (type == 'calc') {
            
        }
    }

    //删除列
    $scope.deleteCol = function(cols, index, type) {
        cols.splice(index, 1);
        if (cols.length == 0) {
            $scope.addExtCol(type);
        }
    }
    $scope.isPreview = false;
    $scope.saveExtCol = function(){
        showLoading();
        $http({
            url: '/api/dash/saveExtCol',
            method: 'POST',
            headers: {
              'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                mainOlapId: $scope.mainOlapId,
                mainOlapTable: $scope.mainOlapTable,
                extCols: $scope.extCols,
                extCalcCols: $scope.extCalcCols
            }
          }).success(function (rs) {
              hideLoading();
              if (rs.status == 'success') {
                    alert('保存成功！');
                } else {
                    alert('保存失败！');
              }
          });
    }
    $scope.previewExpOlap=function () {
        $scope.isPreview=true;
        $scope.getPreviewData(1);
    }
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.getPreviewData=function (page) {
        $http({
            method:'POST',
            url:'/api/olap/previewExtOlap',
            headers:{'X-CSRFToken': getCookie('csrftoken')},
            data:{
                id:$scope.mainOlapId,
                page:page?page:$scope.currentPage
            }
        }).success(function (rs) {
            if(rs.code==1){
                $scope.previewcolumns=rs.columns;
                $scope.previewlists=rs.alldata;
                $scope.rowtitle=rs.rowtitle;
                $scope.totalItems=rs.total;
            }else{
                alert('获取数据为空！');
            }
        })
    }
    $scope.pageChanged = function (currpage) {
        $scope.getPreviewData(currpage);
    };
    $scope.closePreview = function () {
        $scope.isPreview = false;
    };

    // 获取olap列表
    $http.get('/api/dash/getOlaplists?directconnisnull=yes').then(function (rs) {
        $scope.olapList = rs.data;
        if ($scope.olapList.length > 0) {
            // $scope.mainOlapId = $scope.olapList[0].id;
            // $scope.changeMainOlap();
        }
    });

    //根据olapId获取olap列
    $scope.getOlapCols = function(olapId) {
        $http.get('/api/dash/getOlapExtCol?id=' + olapId).then(function (rs) {
            $scope.mainOlapInfos = $scope.filterCol(rs.data.data);
            $scope.mainOlapTable = rs.data.data.olapObj.table;
            $scope.olapExtCols = $scope.mainOlapInfos.olapExtCols;
            $scope.extCols = [];
            $scope.extCalcCols = [];
            if ($scope.olapExtCols && $scope.olapExtCols.length > 0) {
                for (var key in $scope.olapExtCols) {
                    if ($scope.olapExtCols[key].coltype == 'default') {
                        $scope.extCols.push(JSON.parse($scope.olapExtCols[key].configs));
                    }
                    if ($scope.olapExtCols[key].coltype == 'calc') {
                        $scope.extCalcCols.push(JSON.parse($scope.olapExtCols[key].configs));
                    }
                }
            }
        });
    }

    //过滤掉后台取出来的olap列中的
    $scope.filterCol = function(colsObj) {
        var olapColumns = colsObj.olapColumns;
        var olapExtCols = colsObj.olapExtCols;
        var defaultCols = [];
        for (var key in olapColumns) {
            var flag = true;
            for (key2 in olapExtCols) {
                if (olapExtCols[key2].title == olapColumns[key].column) {
                    var flag = false;
                }
            }
            if (flag) {
                defaultCols.push(olapColumns[key]);
            }
        }
        colsObj.olapColumns = defaultCols;
        return colsObj;
    }

    //
    $scope.changeExtOlap = function(extCol) {
        extCol.olapCol = '';
        extCol.olapColName = '';
        extCol.olapName = getOlapNameById($scope.olapList, extCol.olapId);
        $http.get('/api/dash/getOlapExtCol?id=' + extCol.olapId).then(function (rs) {
            extCol.olapCols = $scope.filterCol(rs.data.data);
            extCol.olapTable = rs.data.data.olapObj.table;
        });
        $scope.closeSelect();
    }

    //
    $scope.changeExtOlapCol = function(extCol) {
        extCol.olapColName = getOlapColNameById(extCol.olapCols.olapColumns, extCol.olapCol);
        $scope.closeSelect();
    }

    //修改主olap
    $scope.changeMainOlap = function() {
        if ($scope.mainOlapId && $scope.mainOlapId.length > 0) {
            $scope.mianOlapName = getOlapNameById($scope.olapList, $scope.mainOlapId);
            $scope.getOlapCols($scope.mainOlapId);
            $scope.closeSelect();
        }
    }

    $scope.openSelectBox = function($event) {
        $($event.target).next().addClass('olap-select');
    }

    //选择olap中的列与关联字段
    $scope.selectCol = function(extCol) {
        if (extCol.olapId == null || extCol.olapId.length == 0) {
            alert('请先选择olap！');
        } else {
            var modalInstance = $uibModal.open({
                templateUrl: 'select_col.html',
                controller: 'selectColController',
                backdrop: "static",
                controllerAs: 'vm',
                resolve: {
                    extColObj: function () {
                        return extCol;
                    },
                    mainOlapInfos: function() {
                        return $scope.mainOlapInfos;
                    }
                }
            });
            modalInstance.result.then(function (data) {
                
            }, function () {});            
        }
        $timeout(function () {
            $(".modal-content").draggable({
                    cursor: "move",
                    handle: '.modal-header'
            });
        })
    }

    $scope.closeSelect = function() {
        $('.select-obj').removeClass('olap-select');
    }


    $scope.addCalcCol = function(obj) {
        var modalInstance = $uibModal.open({
            templateUrl: 'calc_col.html',
            controller: 'calcColController',
            backdrop: "static",
            controllerAs: 'vm',
            size: 'lg',
            resolve: {
                extColObj: function () {
                    if(obj == '') {
                        var calColObj = angular.copy($scope.calcExtCol);
                        return calColObj;
                    } else {
                        return obj;
                    }
                    
                },
                olapList: function () {
                    return $scope.olapList;
                },
                mainOlapInfos: function() {
                    return $scope.mainOlapInfos;
                }
            }
        });
        modalInstance.result.then(function (data) {
            if (obj == '' && data.type == 'update') {
                $scope.extCalcCols.push(data.data);
            }
        }, function () {});
    }

    // $document.on('click', function(e){
    // });

});

// 
app.controller('calcColController', function($scope, $timeout, $uibModalInstance, $uibModal, $http, extColObj, olapList, mainOlapInfos) {
    $scope.olapList = olapList;
    $scope.extColObj = extColObj;
    $scope.mainOlapInfos = mainOlapInfos;

    $scope.addCalcCol = function(operation) {
        if (operation == 'base') {
            $scope.extColObj.cols.push({
                calcType:'+',
                lBrackets:'',
                rBrackets:'',
                olapId: '-1',
                olapTable: '',
                olapName: '',
                col: '',
                cols: [],
                colName: '',
                joinCol: [{'mainCol': '', 'joinCol':'', 'colOper':'', 'colCalc': ''}]
            });
        } else {
            $scope.extColObj.cols.push({
                calcType:'+',
                lBrackets:'',
                rBrackets:'',
                olapId: '',
                olapTable: '',
                olapName: '',
                col: '',
                cols: [],
                colName: '',
                joinCol: [{'mainCol': '', 'joinCol':'', 'colOper':'', 'colCalc': ''}]
            });
        }
    }

    $scope.delCalcCol = function(index) {
        $scope.extColObj.cols.splice(index, 1);
        if ($scope.extColObj.cols.length == 0) {
            $scope.addCalcCol();
        }
    }

    $scope.changeOlap = function(col) {
        $http.get('/api/dash/getOlapExtCol?id=' + col.olapId).then(function (rs) {
            var colObj = filterCol(rs.data.data);
            col.cols = colObj.olapColumns;
            col.olapTable = rs.data.data.olapObj.table;
            col.olapName = rs.data.data.olapObj.name;
        });
    }

    $scope.changeCol = function(col) {
        col.colName = getOlapColNameById(col.cols, col.col);
    }

    $scope.addJoinCol = function(col) {
        col.joinCol.push({'mainCol': '', 'joinCol':''});
    }

    $scope.delJoinCol = function(col, index) {
        col.joinCol.splice(index, 1);
        if (col.joinCol.length == 0) {
            $scope.addJoinCol(col);
        }
        
    }

    $scope.changeBaseVal = function (row) {
        row.colName = row.col;
    }

    //增加、删除括号
    $scope.operationBrackets = function (row, operation, position, bracket) {
        row[position] = nullToStr(row[position]);
        if (operation == 'add') {
            row[position] = row[position] + bracket
        } else if (operation == 'sub') {
            if (row[position].length > 0) {
                row[position] = row[position].substr(0, row[position].length - 1);
            }
        }
    }

    //拼接计算公式
    $scope.generateCalcFormula = function () {
        $scope.extColObj.displayCalcFormula = '';
        $scope.extColObj.calcFormula = '';
        if ($scope.extColObj.cols.length > 1) {
            var num = 2;
            $scope.extColObj.cols.forEach(function(value, key, arr){
                if (isNotNull(value['col']) && isNotNull(value['colName']) && isNotNull(value['calcType'])) {
                    $scope.extColObj.displayCalcFormula = $scope.extColObj.displayCalcFormula 
                        + nullToStr(value['lBrackets']) + value['colName']+ nullToStr(value['rBrackets']) + value['calcType'];
                    //基础数值
                    if (value.olapId == '-1' || value.olapId == -1) {
                        $scope.extColObj.calcFormula = $scope.extColObj.calcFormula 
                            + nullToStr(value['lBrackets']) + value['col'] + nullToStr(value['rBrackets']) + value['calcType'];
                    } else {
                        $scope.extColObj.calcFormula = $scope.extColObj.calcFormula 
                            + nullToStr(value['lBrackets']) + 'tt' + num + '.c1' + nullToStr(value['rBrackets']) + value['calcType'];
                    }
                }
                num = num + 1;
            });
            if ($scope.extColObj.displayCalcFormula.length > 1) {
                $scope.extColObj.displayCalcFormula = $scope.extColObj.displayCalcFormula.substr(0, $scope.extColObj.displayCalcFormula.length - 1);
            }
            if ($scope.extColObj.calcFormula.length > 1) {
                $scope.extColObj.calcFormula = $scope.extColObj.calcFormula.substr(0, $scope.extColObj.calcFormula.length - 1);
            }
        }
    }

    $scope.$watch("extColObj.cols",function(newValue,oldValue, scope) {
        $scope.generateCalcFormula();
    }, true);

    $scope.ok = function () {
        $uibModalInstance.close({data:$scope.extColObj, type: 'update'});
    };

    $scope.cancel = function () {
        $uibModalInstance.close({data:$scope.extColObj, type: 'cancel'});
    };
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});

// 新增直接关联的其他olap中的列
app.controller('selectColController', function($scope, $timeout, $uibModalInstance, $uibModal, $interval, extColObj, mainOlapInfos) {
    $scope.extColObj = extColObj;
    $scope.mainOlapInfos = mainOlapInfos;

    $scope.addJoinRow = function(extCol) {
        $scope.extColObj.joinCol.push({'mainCol': '', 'joinCol':''});
    }

    $scope.delJoinRow = function(index) {
        $scope.extColObj.joinCol.splice(index, 1);
        if ($scope.extColObj.joinCol.length == 0) {
            $scope.extColObj.joinCol.push({'mainCol': '', 'joinCol':''});
        }
    }

    $scope.colChange = function() {
        $scope.extColObj.olapColName = getOlapColNameById($scope.extColObj.olapCols.olapColumns, $scope.extColObj.olapCol);
    }

    $scope.ok = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.reset = function () {
        $scope.extColObj.joinCol = [];
        $scope.extColObj.joinCol.push({'mainCol': '', 'joinCol':''});
        $scope.extColObj.olapCol = '';
        $scope.extColObj.olapColName = '';
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