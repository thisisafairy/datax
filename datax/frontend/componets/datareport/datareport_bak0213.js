angular.module('tableDataReport', [])
    .directive('tableDataReport', function () {
        return {
            templateUrl: '/frontend/componets/datareport/datareport.html?v=1.02',
            restrict: 'E',
            scope: {
                tableid: '=',
                limitSearch: '=',
                changedData: '=',
                valueChange: '&'
            },
            link: function (scope, element /*, attrs*/) {
                // var genTableStru = document.createElement('script');//自定义js函数
                // genTableStru.scr = 'components/datareport/genDataFunction.js';
                // element.append(genTableStru);
            },
            controller: function ($scope, $element, $http, $compile) {
                console.log('----$scope.tableid=', $scope.tableid);
                if ($scope.tableid) {
                    console.log('----$scope.limitsearch=', $scope.limitsearch);
                    $http({
                        method: 'POST',
                        url: '/api/olap/getTableDataByOlapId',
                        headers: {'X-CSRFToken': getCookie('csrftoken')},
                        data: {
                            tableId: $scope.tableid,
                            pageCount: 1,
                            pageTotalRow: 100,
                            limitSearch: $scope.limitSearch//存储对象如{key:字段名,operator:大于,value:值}
                        }
                    }).success(function (rsObj) {
                        // console.log('----rsObj=', rsObj);
                        if (rsObj.status == 'success') {
                            var columnHeadDefs = genTableFromJsonObject(rsObj.dataTableStruct['jsonconfig']);
                            console.log('---columnHeadDefs=',columnHeadDefs)
                            $scope.gridOptions = {//定义表格结构及数据
                                columnDefs: columnHeadDefs,
                                rowData: rsObj.rowData,
                                onCellValueChanged: cellChangedFun,
                                // onCellEditingStarted: onCellEditingStartedFun,
                                // editType: 'fullRow',//编辑全行
                                components: {//组件函数，某一列点击编辑秘制函数
                                    // numericCellEditor: getNumericCellEditor()
                                    'rederFun':rederFun
                                },
                                // defaultColDef: {
                                //     editable: true,
                                //     resizable: true
                                // },
                                // onGridReady: function (params) {
                                //     params.api.sizeColumnsToFit();
                                // },
                            };
                            var tableDiv = $compile('<div ag-grid="gridOptions" style="height: 500px; width: 1000px;" class="ag-theme-balham"></div>')($scope);
                            $element.find("#tableDiv").html('');
                            $element.find("#tableDiv").html(tableDiv);
                        } else {
                            alert(rsObj.data);
                        }
                    })
                }
                //检测哪些数据被修改了，并返回给valueChange
                if (!$scope.valueChange || typeof $scope.valueChange != 'function') {
                    $scope.valueChange = function () {

                    }
                }

                //监听数据修改的row，保存到双向绑定值changedData里，在调用控件的地方对changedData进行处理
                function cellChangedFun(param) {
                    if (!$scope.changedData) {
                        $scope.changedData = [];
                    }
                    var indexOfCurr = -1;//当前obj是否存在于$scope.changedData中
                    $scope.changedData.map(function (itemObj, idx) {
                        if (itemObj.keyorder == param.data.keyorder) {//根据keyorder来辨别是否是唯一
                            indexOfCurr = idx;
                        }
                    });
                    if (indexOfCurr > -1) {
                        $scope.changedData.splice(indexOfCurr, 1, param.data);//替换
                    } else {
                        $scope.changedData.push(param.data)
                    }
                }

                //原理同cellEditor附函数一样
                function onCellEditingStartedFun(param) {
                    if (param.colDef.field == 'hb_wasteair_control__year') {
                        console.log('--onCellEditingStartedFun---param=', param);
                        return {
                            component: 'agRichSelectCellEditor',
                            params: {values: ['Male', 'Female']}
                        }
                    }
                }

                //test render function
                function rederFun() {
                }

                rederFun.prototype.init = function (params) {
                    this.eGui = document.createElement('span');
                    var img = params.value === 'Male' ? 'male.png' : 'female.png';
                    this.eGui.innerHTML = '<img src="../images/' + img + '"/>' + params.value;
                };

                rederFun.prototype.getGui = function () {
                    return this.eGui;
                };

            }
        }
    });
