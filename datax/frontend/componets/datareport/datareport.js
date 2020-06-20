angular.module('tableDataReport', ['ui.bootstrap'])
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
                            console.log('---columnHeadDefs=', columnHeadDefs);
                            $scope.gridOptions = {//定义表格结构及数据
                                columnDefs: columnHeadDefs,
                                rowData: rsObj.rowData,
                                onCellValueChanged: cellChangedFun,
                                // onCellEditingStarted: onCellEditingStartedFun,
                                // editType: 'fullRow',//编辑全行
                                components: {//组件函数，某一列点击编辑秘制函数
                                    // numericCellEditor: getNumericCellEditor()
                                    'rederFun': rederFun,
                                    'yearCellRender': yearCellRender,
                                    'datePicker': getDatePicker(),
                                },
                                // defaultColDef: {
                                //     editable: true,
                                //     resizable: true
                                // },
                                // onGridReady: function (params) {//这会导致没有很想滚动条，但所有的column都是经过重新计算的
                                //     params.api.sizeColumnsToFit();
                                // },
                            };
                            //这种方式创建表格控件
                            var gridDiv = document.querySelector('#tableDiv');
                            new agGrid.Grid(gridDiv, $scope.gridOptions);

                            gridDiv.style.width = '90%';
                            gridDiv.style.height = '500px';
                            $scope.gridOptions.api.doLayout();

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

                ///////////////////////////////cell edit render function////////////////////////////////////
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

                //year cell edit
                function yearCellRender() {
                }

                yearCellRender.prototype.init = function (params) {
                    this.eGui = document.createElement('span');
                    var img = params.value % 2 ? 'no.png' : 'ie.png';
                    this.eGui.innerHTML = '<img src="https://flags.fmcdn.net/data/flags/mini/' + img + '"/>' + params.value;
                }
                yearCellRender.prototype.getGui = function () {
                    return this.eGui;
                }


                $scope.wattingSelect = [{"name":"beijing","age":22},{"name":"shanghai","age":24}];
                $scope.selectedTags = [];
                //日期输入框对日期进行选择控件
                function getDatePicker() {
                    function Datepicker() {
                    }
                    Datepicker.prototype.init = function (params) {
                        // 日期选择控件
                        // this.eInput = document.createElement('input');
                        // this.eInput.value = params.value;
                        // $(this.eInput).datepicker({
                        //     dateFormat : 'dd/mm/yy'
                        // });

                        // $(this.eInput).attr('type','text');
                        // $(this.eInput).attr('uib-datepicker-popup','yyyy-mm-dd');
                        // $(this.eInput).attr('is-open','true');
                        // $(this.eInput).attr('alt-input-formats',"['M!/d!/yyyy']");
                        // $(this.eInput).attr('datepicker-options',"{\n" +
                        //     "                            formatYear: 'yy',\n" +
                        //     "                            maxDate: new Date(2020, 5, 22),\n" +
                        //     "                            minDate: new Date(),\n" +
                        //     "                            startingDay: 1\n" +
                        //     "                        }");
                        // $(this.eInput).attr('close-text','Close');
                        // console.log('this.eInput=',this.eInput);

                        //自定义select下拉框
                        var selectDom = document.createElement('select');
                        selectDom.add(new Option('yyyyes','1'));
                        selectDom.add(new Option('nnnnnnn','2'));
                        console.log('selectDom=',selectDom);
                        this.eInput = selectDom;
                        this.eInput.value = params.value;

                        //使用封装的下拉框
                        // var selectDom = $compile("<multi-select data=\"wattingSelect\" " +
                        //     "id-field=\"'age'\" text-field=\"'name'\" count-field=\"'num'\"></multi-select>")($scope);
                        // console.log('selectDom=',selectDom);



                    };
                    Datepicker.prototype.getGui = function () {
                        return this.eInput;
                    };
                    Datepicker.prototype.afterGuiAttached = function () {
                        this.eInput.focus();
                        // this.eInput.select();
                    };
                    Datepicker.prototype.getValue = function () {
                        return this.eInput.value;
                    };
                    Datepicker.prototype.destroy = function () {
                    };
                    Datepicker.prototype.isPopup = function () {
                        return false;
                    };
                    return Datepicker;
                }


            }
        }
    });
