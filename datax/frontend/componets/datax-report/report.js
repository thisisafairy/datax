angular.module('dataxReport', [])
    .directive('dataxReport', function() {
        return {
            templateUrl: '/frontend/componets/datax-report/report.html?v=1.01',
            restrict: 'E',
            scope: {
                reportConfig: '=?reportConfig'
            },
            link: function(scope, element /*, attrs*/ ) {},
            controller: function($scope, $element, $http, $timeout) {
                var vm = $scope
                vm.config = ''
                $scope.componentUuid = generateUuid(8, 16)
                vm.tableStyle = {
                    'width': '0px',
                    'height': '0px'
                }
                vm.initTable = function () {
                    vm.tableData = []
                    $http({
                        method: 'post',
                        url: "/api/dash/parseReportConfig",
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        data: {
                            config: vm.config
                        }
                    }).then(function (rs) {
                        if (rs.data.status == 'success') {
                            console.log('rs.data', rs.data)
                            vm.config.row = rs.data.data
                            var _colWidths = 0
                            vm.config.colWidths.forEach(element => {
                                _colWidths += element
                            });
                            var _rowHeights = 0
                            vm.config.rowHeights.forEach(element => {
                                _rowHeights += element
                            });
                            vm.tableStyle.width = _colWidths + 'px'
                            vm.tableStyle.height = _rowHeights + 'px'
                            // 遍历行
                            vm.total = 0
                            for (var _i = 0; _i <= vm.config.maxRow; _i++) {
                                var _cols = []
                                var _dataRow  = {'maxRow': 0}
                                // 判断该行中是否有动态数据，如果有，判断该用最大多少行来容纳数据
                                for (var _k = 0; _k <= vm.config.maxCol; _k++) {
                                    var _col = vm.config.row[_i].col[_k]
                                    if (_col.list && _col.list.length > 0) {
                                        if (_dataRow['maxRow'] <= _col.list.length) {
                                            _dataRow['maxRow'] = _col.list.length
                                        }
                                    }
                                }
                                var _dataArr = new Array()
                                // 如果有动态数据，生成应该插入的二维数组
                                if (_dataRow.maxRow > 0) {
                                    for ( var _m = 0; _m < _dataRow['maxRow']; _m++) {
                                        _dataArr[_m] = {'col': new Array()}
                                        for ( var _n = 0; _n <= vm.config.maxCol; _n++) {
                                            _dataArr[_m].col[_n] = {'rowspan': 1, 'colspan': 1, 'value': '', 'style': {}}
                                        }
                                    }
                                }
                                // 遍历行中的单元格
                                for (var _j = 0; _j <= vm.config.maxCol; _j++) {
                                    var _col = vm.config.row[_i].col[_j]
                                    _col.style.height = _col.height
                                    _col.style.width = _col.width
                                    _col.rowspan = _col.style.rowspan || 1
                                    _col.colspan = _col.style.colspan || 1
                                    _col.textContentStyle = {'width': _col.width * _col.colspan}
                                    if (_dataRow.maxRow === 0) {
                                        _cols.push(_col)
                                    } else {
                                        if (_col.list && _col.list.length > 0) {
                                            // var _tempColName = _col['cellDataSource']['col']
                                            for (var _l = 0; _l < _col.list.length; _l++) {
                                                // _col['value'] = _col.list[_l][_tempColName]
                                                _col['value'] = _col.list[_l]
                                                _dataArr[_l].col[_j] = angular.copy(_col)
                                            }
                                        } else {
                                            _dataArr[0].col[_j] = angular.copy(_col)
                                        }
                                    }
                                }
                                if (_dataRow.maxRow === 0) {
                                    vm.total += 1
                                    vm.tableData.push({'col': _cols})
                                } else {
                                    vm.total += _dataArr.length
                                    _dataArr.forEach(function (row) {
                                        vm.tableData.push({'col': row.col})
                                    })
                                }
                            }
                            console.log('vm.tableData', vm.tableData)
                        }
                    }) 
                    
                }
                vm.$watch('reportConfig', function () {
                    if (isNotNull(vm.reportConfig)) {
                        vm.config = vm.reportConfig
                        vm.initTable()
                    }
                })
            }
        };
    });