(function () {
    "use strict";
    var app = angular.module('scenesLogApp', ['dataxUtils', 'dataxUI']);
    /**
     * 场景访问记录
     * @author sola
     * @created 2019/06/04 12:00:29
     */
    app.controller('scenesLogController', function ($scope, $window, dxHttp) {
        var vm = $scope

        vm.tableInfo = {
            searchField: {
                'first_name': '',
                'scenes_name': '',
                'keywords': '',
                'modifytimestart': '',
                'modifytimeend': '',
            }
        }
        vm.tableData = []
        vm.tableHeight = 500
        vm.fullFix = true
        vm.getScenesLogs = function() {
            var params = Object.keys(vm.tableInfo.searchField).map(function (key) {
                if (isNotNull(vm.tableInfo.searchField[key])) {
                    if (key == 'modifytimestart' || key == 'modifytimeend') {
                        return encodeURIComponent(key) + "=" + encodeURIComponent(dateFtt('yyyy-MM-dd', vm.tableInfo.searchField[key]));
                    } else {
                        return encodeURIComponent(key) + "=" + encodeURIComponent(vm.tableInfo.searchField[key]);
                    }
                } else {
                    return ''
                }
            }).filter(function(value) {
                return value.length > 0
            })
            if (params.length > 0) {
                params = "?"+params.join('&')
            } else {
                params = ''
            }
            dxHttp.getData("/api/dash/getScenesLogList"+params).then(function (rs) {
                if (rs.data.status == 'success') {
                    vm.tableData = rs.data.data.list
                }
            })
        }
        vm.getScenesLogs()
        vm.tableInfo.tableStyle = {
            'wrapper': {
                borderCollapse: 'collapse'
            },
            'scroll': {
                'header': {
                    'paddingBottom': '0px',
                    'table': {borderCollapse: 'collapse'},
                    'row': {
                        borderBottom: '1px solid rgb(244, 244, 244)',
                        backgroundColor: 'rgb(250, 250, 250)'
                    },
                    'td': {},
                    'cell': {}
                },
                'body': {
                    'maxHeight': 0,
                    'table': {borderCollapse: 'collapse'},
                    'row': {
                        borderBottom: '1px solid rgb(244, 244, 244)'
                    },
                    'td': {},
                    'cell': {}
                }
            },
            'fixedLeft': {
                'header': {
                    'table': {borderCollapse: 'collapse'},
                    'row': {
                        borderBottom: '1px solid rgb(244, 244, 244)',
                        backgroundColor: 'rgb(250, 250, 250)'
                    },
                    'td': {},
                    'cell': {}
                },
                'bodyOuter': {},
                'bodyInner': {
                    'max-height': 0,
                    'table': {borderCollapse: 'collapse'},
                    'row': {
                        borderBottom: '1px solid rgb(244, 244, 244)'
                    },
                    'cell': {}
                }
            },
        }
        vm.tableInfo.tableColumn = [{
            rows: [{
                    title: '用户名',
                    field: 'first_name',
                    width: 100,
                    disableTooltip: true
                },
                {
                    title: '场景名',
                    field: 'scenes_name',
                    width: 100
                },
                {
                    title: '场景标签',
                    field: 'keywords',
                    width: 200,
                    disableTooltip: true
                },
                {
                    title: '访问次数',
                    field: 'visitcount',
                    width: 100,
                    disableTooltip: true
                },
                {
                    title: '最后访问时间',
                    field: 'modifytime',
                    width: 300,
                    format: 'datetime',
                    disableTooltip: true
                },
            ]
        }]
        var tableWidth = browserUsableWidth() - 50
        fixTableWidth(vm.tableInfo.tableColumn, tableWidth)
        var w = angular.element($window);
        w.on('resize', function() {
            var tableWidth = browserUsableWidth() - 50
            fixTableWidth(vm.tableInfo.tableColumn, tableWidth)
            $scope.$apply()
        })
    })
})()