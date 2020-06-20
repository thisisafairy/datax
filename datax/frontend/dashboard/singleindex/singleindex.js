var app = angular.module('singleIndex', ['ui.bootstrap', 'colorpicker.module']);

app.directive('singleIndexChart', function () {
    var html_str = '<div ng-style="single_handle_obj.title_style">{{ select_column.column_title | title_handle_type:single_handle_obj }}</div>';
    html_str += '<div ng-if="single_handle_obj.index_show_type==\'text\'">' +
        '{{ select_column.result_data | handle_type:single_handle_obj }}';
    html_str += '</div>';
    html_str += '<div ng-if="single_handle_obj.index_show_type==\'progress-bar\'">' +
        '<section width="100%" class="bar-container"><div class="progress" ng-style="single_handle_obj.progress_bar.container_style">' +
        '<span style="width: {{single_handle_obj.progress_bar.data}};"><span>{{single_handle_obj.progress_bar.data}}</span></span></div></section>';
    html_str += '<div style="text-align:right">233</div></div>';
    return {
        restrict: 'E',
        template: html_str
    };
});

app.controller('singleIndexController', function ($scope, $http, $uibModal, $timeout) {
    $scope.dataSources = DataSources;
    $scope.chart_obj = {id:-1};
    $scope.olap_id = '';
    $scope.select_column = {
        olap_id: $scope.dataSources[0].id,
        olap_url: $scope.dataSources[0].url,
        table_name: '',
        column_name: '',
        column_title: '',
        column_handle_type: 'SUM',
        result_data: ''
    };
    $scope.single_index_handle_methods = single_index_handle_methods;

    $scope.single_handle_obj = single_handle_obj;
    $scope.columns = [];
    $scope.column_title = '';

    //加载数据表的列
    $scope.dataSourceChange = function () {
        $http.get('/api/dash/getOlapColumnInfo/' + $scope.olap_id).then(function (rs) {
            $scope.columns = rs.data.data;
            $scope.select_column = {
                olap_id: $scope.olap_id,
                olap_url: "/api/dash/getOlapData/3",
                table_name: '',
                column_name: '',
                column_title: '',
                column_handle_type: 'SUM',
                result_data: ''
            };
            $scope.single_handle_obj = angular.copy(single_handle_obj);
        });
    };

    //默认加载第一个olap
    if ($scope.dataSources.length > 0) {
        $scope.olap_id = $scope.dataSources[0].id;
        $scope.dataSourceChange($scope.dataSources[0].id);
    }

    //从数据库查询指标,切换列事件
    $scope.process_data = function (table_name, column_name, column_title) {
        if (table_name != '' && table_name != undefined) {
            $scope.select_column.table_name = table_name;
        }
        if (column_name != '' && column_name != undefined) {
            $scope.select_column.column_name = column_name;
        }
        data = {
            olap_id:$scope.olap_id,
            table_name: $scope.select_column.table_name,
            column_name: $scope.select_column.column_name,
            column_handle_type: $scope.select_column.column_handle_type
        }
        $http({
            url: '/dashboard/processSingleIndex',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: data
        }).success(function (rs) {
            if (rs.code == '1') {
                if (column_title != '' && column_title != undefined) {
                    $scope.select_column.column_title = column_title;
                }
                $scope.select_column.result_data = rs.data;
            } else {
                $scope.select_column.column_title = '';
                $scope.select_column.result_data = '';
            }
        });
    }

    //返回组件列表
    $scope.backlist = function () {
        location.href = "/dashboard/chartlist";
    };

    $scope.aimDataChange = function () {
        var changeflag = true;
        if ($scope.single_handle_obj.aim_data.data) {
            if ($scope.single_handle_obj.aim_data.data >= $scope.select_column.result_data) {
                var progress_bar_data = mul(div($scope.select_column.result_data, $scope.single_handle_obj.aim_data.data), 100);
                if (progress_bar_data) {
                    progress_bar_data = progress_bar_data.toFixed(2) + "%";
                    $scope.single_handle_obj.progress_bar.data = progress_bar_data;
                    $scope.single_handle_obj.progress_bar.data_style["width"] = progress_bar_data;
                    changeflag = false;
                }
            }
        }
        if (changeflag) {
            $scope.single_handle_obj.progress_bar.data = "0%";
            $scope.single_handle_obj.progress_bar.data_style["width"] = "0%";
        }
    }

    //给输入的数字加上PX
    $scope.vailFontSizeAttr = function () {
        $scope.single_handle_obj.title_style['font-size'] = addPx($scope.single_handle_obj.title_style['font-size']);
        $scope.single_handle_obj.text.style['font-size'] = addPx($scope.single_handle_obj.text.style['font-size']);
    }

    //打开业务规则编辑页面
    $scope.openMonitorEdit = function () {
        //业务规则配置弹窗
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/singleIndexMonitorEdit',
            controller: 'monitorController',
            size: 'lg',
            resolve: {
                monitors: function () {
                    return $scope.single_handle_obj.monitors;
                }
            }
        });
        //弹窗回调函数
        modalInstance.result.then(function (data) {
            if (data.status == 'save') {
                $scope.single_handle_obj.monitors = data.data;
            }
        }, function () {});
    }

    //保存
    $scope.save = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/openSavePage',
            controller: 'saveInstance',
            size: 'lg',
            resolve: {
                select_column: function () {
                    return $scope.select_column;
                },
                single_handle_obj: function () {
                    return $scope.single_handle_obj;
                },
                chart_obj: function () {
                    return $scope.chart_obj;
                }
            }
        });
        modalInstance.result.then(function (data) {
            if (data.status == 'saveOk') {
                $scope.chart_obj = data.data;
            }
        }, function () {
        });
    }

    $timeout(function () {});

});

app.controller('monitorController', function ($scope, $http, $uibModalInstance, $timeout, monitors) {
    $scope.monitors = angular.copy(monitors);

    //新增一行
    $scope.addRow = function () {
        $scope.monitors.rows.push({
            //大于等于{min} 且小于等于{max}时,文本显示{color}
            min: '',
            max: '',
            color: ''
        })
    }

    //删除一行
    $scope.deleteRow = function (key) {
        if (key == '0' && $scope.monitors.rows.length == 1) {
            $scope.monitors.rows = [{
                min: '',
                max: '',
                color: ''
            }];
        } else {
            $scope.monitors.rows.splice(key, 1);
        }
    }

    //确定
    $scope.ok = function () {
        $uibModalInstance.close({
            status: 'save',
            data: $scope.monitors
        });
    }

    //取消
    $scope.cancel = function () {
        $uibModalInstance.close({
            status: 'cancel'
        });
    }

})

//保存单指标
app.controller('saveInstance', function ($scope, $http, $uibModalInstance, select_column, single_handle_obj, chart_obj) {
    $http.get("/api/type/getTypeList").then(function(rs){
        $scope.kinds = rs.data;
    });

    if (chart_obj.id != -1) {
        $scope.chartObj = angular.copy(chart_obj);
    } else {
        $scope.chartObj = {
            name:'',
            charttype: 'singleindex',
            kind:'',
            refreshspeed:'',
            keywords:'',
            remark:'',
            createname:'',
            createtime:'',
        }
    }

    var json_data = {
        data: {url:select_column.olap_url,formatType: 'json'},
        select_column: select_column,
        single_handle_obj: single_handle_obj
    }

    $scope.chartObj['jsonconfig'] = JSON.stringify(json_data);
    
    $scope.save = function () {
        $http({
            url: '/dashboard/saveSingleIndex',
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: $scope.chartObj
        }).success(function (rs) {
            $scope.chartObj['id'] = rs.data_key;
            if (rs.code == '1') {
                if(!confirm("保存成功!继续编辑请点击'确定',转到组件列表页点击'取消' "))
                {
                    window.location.href="/dashboard/chartlist";
                }
                else{
                    $uibModalInstance.close({
                        status: 'saveOk',
                        data: $scope.chartObj
                    });
                }
            } else {
                alert('保存失败!')
            }
        });
    }

    $scope.cancel = function () {
        $uibModalInstance.close({
            status: 'cancel'
        });
    }
})

app.filter('handle_type', function () {
    return function (text, handle_obj) {
        var return_show_data = handle_data(text, handle_obj);
        return return_show_data;
    }
});

app.filter('title_handle_type', function () {
    return function (text, handle_obj) {
        var return_show_data = handle_data_title(text, handle_obj);
        return return_show_data;
    }
});