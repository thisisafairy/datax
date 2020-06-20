initTextEditor();
var dropOptionElement;
var chartLabelElement;
var tableColResizeElement;
var btGroupStatus = true;
if (terminalType == 'pc') {
    $('#downBar').addClass('downBar-hover');
} else {
    $('#downBar').removeClass('downBar-hover');
    $('#downBar').hide();
    $('.down-bar-switch').hide();
}

function closeBtnGroup(status) {
    if (terminalType == 'pc') {
        btGroupStatus = status;
        if (btGroupStatus) {
            $('#downBar').addClass('downBar-hover');
        } else {
            $('#downBar').removeClass('downBar-hover');
        }
    }
}
// 获取url中的所有参数 (包括scenesId)
var urlParameters = getAllUrlParameter();
//当前登录用户信息
// var currentUserInfo = getUserInfo();
var dataXLoginUserInfo = {};
$.ajax({
    url: '/api/account/userInfo',
    type: 'GET'
}).then(function (rs) {
    if (rs.data.status == 'success') {
        dataXLoginUserInfo = rs.data.userInfo;
        // console.log('loginUser:', dataXLoginUserInfo);
    }
});

if (viewType == 'edit') {
    $('.dashboard-toolbar').show();
    $('#scenesLayout').css('margin-top', '40px');
    $('#downBar').removeClass('downBar-hover');
}
if (viewType == 'show') {
    $('.dashboard-toolbar').hide();
    $('.left-block').hide();
    if (terminalType == 'phone' && mbMenuType == 'full') {
        $('#scenesLayout').css('margin-top', '40px');
    } else {
        $('#scenesLayout').css('margin-top', '0px');
    }
}

var app = angular.module('dashboardApp', ['gridster', 'ui.bootstrap', 'dashboard', 'ngDraggable', 'dataxPanelDrag', '720kb.datepicker', 'ui-rangeSlider', 'colorpicker.module', 'ngAnimate', 'multiSelect', 'ui.sortable', 'ngMaterial', 'ngMessages', 'dataxUI', 'dashboardInterface']);


///为了监听文件input标签的on-change事件
app.directive('customOnChange', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeHandler = scope.$eval(attrs.customOnChange);
            element.on('change', onChangeHandler);
            element.on('$destroy', function () {
                element.off();
            });
        }
    };
});

app.controller('dashboardController', function ($scope, $element, $timeout, $rootScope, $window, $http, $uibModal, $sce, afterComponentDataLoad) {
    $rootScope.scenesContentWidth = $window.innerWidth;
    $scope.mbMenuType = mbMenuType
    $scope.param = {};
    $scope.data = {}; // 参数
    $scope.data.param = $scope.param;
    $scope.linkStatus = false;
    $scope.deviceType = terminalType;
    $scope.rowHeight = 50
    $scope.mbLiteTheme = portalStyle.default[0]
    // 编辑界面or展示界面
    $scope.viewType = viewType;
    $scope.tempVal = {
        'useBgImg': false,
        'useChartsBgImg': false
    }
    // region 默认样式
    /* #region   */
    $scope.sceneObj = {
        'id': '',
        'name': '',
        'remark': '',
        'keywords': '',
        'basicconfig': {
            'customConfig': {}
        },
        'options': {
            'globalStyle': {
                'color': 'rgba(51, 51, 51, 1)',
                'backgroundColor': 'rgba(227, 230, 235, 1)',
                'backgroundSize': 'cover',
                'backgroundRepeat': 'no-repeat'
            },
            'toolBarStyle': {
                'default': true,
                'blue': false,
                'black': false
            },
            'filterStyle': {
                'backgroundColor': 'rgba(255,255,255,1)',
                'borderDisplay': false,
                'borderRadius': '0px',
                'separationClass': 'separation-46'
            },
            'chartStyle': {
                'backgroundColor': 'rgba(255,255,255,1)',
                'borderDisplay': false,
                'borderRadius': '0px',
            },
            'syncFontColor': true,
            'commentsStyle': commentsStyle.lightStyle
        }
    };
    /* #endregion */
    // endregion

    // region 部分枚举数值
    /* #region   */

    $scope.separationClassArr = separationClassArr

    $scope.enumKinds = [];
    $http.get('/api/type/getTypeList').then(function (rs) {
        $scope.enumKinds = rs.data;
    });

    $scope.borderStyles = [{
            'value': 'solid',
            'name': '实线'
        },
        {
            'value': 'dashed',
            'name': '虚线'
        },
        {
            'value': 'dotted',
            'name': '点'
        },
        {
            'value': 'double',
            'name': '双线'
        }
    ]

    $scope.imgStyles = [{
            'value': 'cover',
            'name': '按图片原长宽比拉伸并铺满背景'
        },
        {
            'value': '100% 100%',
            'name': '直接拉伸铺满背景(图片长宽比会改变)'
        }
    ]
    /* #endregion */
    // endregion

    $scope.showCharts = false;

    //放入布局中的组件关联的olap集合
    $scope.olapIds = [];

    $scope.olaps = [];

    // region 编辑时加载数据
    /* #region   */

    // 获取用户收藏的场景
    $scope.connectScene = []
    $scope.getConnectScene = function () {
        $http({
            method: 'post',
            url: "/api/dash/getUserCollection",
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                collectType: 'scenes'
            }
        }).then(function (rs) {
            if (rs.data.status == 'success') {
                $scope.connectScene = rs.data.collections.filter(function (row) {
                    if (row.sceneversion >= 2) {
                        return true
                    }
                })
            }
        })
    }
    $scope.getConnectScene();

    $scope.initDashboard = function (sceneId) {
        if (terminalType == 'phone') {
            $http.get('/bi/updateUserVisitLog?id=' + sceneId).then(function (rs) {});
        }
        $http({
            method: 'post',
            url: "/api/dash/getNewScene",
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                sceneId: sceneId
            }
        }).then(function (rs) {
            // dataxLoding.hideLoading('content-wrapper')
            if (rs.data.status == 'success') {
                $scope.sceneObj['id'] = sceneId
                shareName = rs.data.sceneObj.name
                var _tempConfigItems = JSON.parse(rs.data.sceneObj.items)
                $scope.sceneObj.basicconfig = JSON.parse(rs.data.sceneObj.basicconfig)
                loadExJsAndCss($scope.sceneObj.basicconfig.customConfig)
                if ($scope.sceneObj.basicconfig.customConfig.fullscreen && $scope.viewType == 'show') {
                    $scope.adapteFullScreen(_tempConfigItems)
                }
                /** 在将后台取出的json传到dashboard之前的一些处理 */
                updateConfigItemsBeforeInitDashboard(_tempConfigItems)
                $scope.configitems = _tempConfigItems;
                $scope.sceneObj['name'] = rs.data.sceneObj.name;
                $scope.sceneObj['kind'] = rs.data.sceneObj.kind;
                $scope.sceneObj['remark'] = rs.data.sceneObj.remark;
                $scope.sceneObj['keywords'] = rs.data.sceneObj.keywords;
                if (rs.data.sceneObj.options && rs.data.sceneObj.options.length > 2) {
                    $scope.sceneObj['options'] = JSON.parse(rs.data.sceneObj.options);
                }

                $scope.configitems.forEach(function (value, eachIndex) {
                    if (!value.data['mbConfig']) {
                        value.data['mbConfig'] = {
                            'sort': 0
                        }
                    }
                    value['data']['refreshCount'] = 0;
                    var itemType = value.data.dropType ? value.data.dropType : value.data.datatype;
                    if (itemType == 'chart') {
                        var datasetObj = JSON.parse(value['data']['datasetstring'])
                        $scope.olapIds.push(datasetObj['id']);
                    } else if (itemType == 'table') {
                        $scope.olapIds.push(value['data']['jsonconfig']['olapid']);
                        // 下拉选框中的值
                    } else if (itemType == 'select') {
                        $scope.getFilterDatas(eachIndex);
                    } else if (itemType == 'labelBox') {
                        if (!value.data.componentType) {
                            value.data.componentType = 'text';
                        }
                    }
                    setUrlParametersToComponent(value, itemType);
                    if (!value.data.commentsConfig) {
                        value.data.commentsConfig = {
                            'style': lightCommentsStyle,
                            'comments': []
                        };
                    }

                    value.data.refreshCount += 1;
                });
                $timeout(function () {
                    $scope.initCustomConfig();
                    $scope.executeCustomConfig();
                    $scope.reloadingDashboard = 'complete';
                    $scope.fixContentWidth();
                });
            } else {
                alert('获取olap字段失败!');
            }
        });
    }

    $scope.reloadingDashboard = 'doing';
    //从url中获取ID
    if (getQueryString('scenesId') && getQueryString('scenesId').length > 0) {
        currentSceneId = getQueryString('scenesId');
    }
    //从后台重定向中获取的ID
    if (currentSceneId.length > 1) {
        $scope.sceneObj['id'] = currentSceneId;
        $scope.tempCurrentSceneId = currentSceneId;
    }
    if ($scope.tempCurrentSceneId && $scope.tempCurrentSceneId.length > 1) {
        $scope.initDashboard($scope.tempCurrentSceneId);
        initItemConnection($scope.tempCurrentSceneId, 'scene', 'pc-collection')
    } else {
        if (terminalType != 'phone') {
            $scope.reloadingDashboard = 'complete';
        }
    }

    $scope.afterDataLoad = function(ev) {
        $timeout(function() {
            if (ev.type == 'table') {
                afterComponentDataLoad.afterTableDataLoad($scope.configitems, ev.data)
            } else if (ev.type == 'chart') {
                afterComponentDataLoad.afterChartDataLoad($scope.configitems, ev.data)
            }
        }, 1000)
        
        
    }

    /* #endregion */
    //endregion

    $scope.adapteFullScreen = function (_configitems) {
        maxHeight = 0
        _configitems.forEach(function (value) {
            if (maxHeight < (value.sizeY + value.row)) {
                maxHeight = value.sizeY + value.row
            }
        })
        var cWidth = 0
        var cHeight = 0
        if (document.compatMode == "BackCompat") {
            cWidth = document.body.clientWidth;
            cHeight = document.body.clientHeight
        } else { //document.compatMode == \"CSS1Compat\"
            cWidth = document.documentElement.clientWidth
            cHeight = document.documentElement.clientHeight
        }
        parseHeight = ((cHeight - 10) / maxHeight).toFixed(0)
        $scope.gridsterOpts.rowHeight = parseHeight
        $scope.rowHeight = parseHeight
    }

    // region 新增、编辑组件
    /* #region   */
    $scope.currentChartObj = {};
    $scope.updateComponent = function (item) {
        $scope.currentChartObj = item;
        var modalInstance = $uibModal.open({
            templateUrl: 'myModaltest.html',
            controller: 'ModalInstancechart',
            backdrop: "static",
            size: 'super-lgs',
            controllerAs: 'vm',
            resolve: {
                itemC: function () {
                    return {};
                },
                chartId: function () {
                    return item.data.id;
                }
            }
        });
        modalInstance.result.then(function (_data) {
            if (_data && _data != 'cancel') {
                if (item.data.styleConfig && item.data.styleConfig.color &&
                    item.data.styleConfig.color.length > 1) {
                    updateChartFontColor('echarts', _data, item.data.styleConfig.color)
                }
                item.data.echartconfig = JSON.stringify(_data);
                item.data.refreshCount += 1;
            }
        }, function () {

        });
    };

    $scope.chartSet = function () {
        $scope.showCharts = !$scope.showCharts;
        $('.left-block').hide();
        var modalInstance = $uibModal.open({
            templateUrl: 'myModaltest.html',
            controller: 'ModalInstancechart',
            backdrop: "static",
            size: 'super-lgs',
            controllerAs: 'vm',
            resolve: {
                itemC: function () {
                    return {};
                },
                chartId: function () {
                    return '';
                }
            }
        });
        modalInstance.result.then(function (_data) {
            if (_data && _data != 'cancel') {
                var tempUrlArr = _data.data.url.split('/');
                // 取到新增的组件的olap信息
                $http.get('/api/olap/olapdetail/' + tempUrlArr[tempUrlArr.length - 1]).then(function (rs) {
                    $scope.tempChartObj = {
                        'olapId': tempUrlArr[tempUrlArr.length - 1],
                        'olapInfo': rs.data,
                        'name': _data.title.text,
                        'kind': rs.data.charttype,
                        'data': _data
                    };
                    $('.chart-save-panel').css('top', '10%');
                });
            }
        }, function () {

        });
    };

    $scope.initNewChart = function (saveType) {
        var datasetObj = {
            'description': $scope.tempChartObj.olapInfo.desc,
            'group': '',
            'name': $scope.tempChartObj.olapInfo.name,
            'url': $scope.tempChartObj.data.data.url,
            'id': $scope.tempChartObj.olapId
        }
        var chartObj = {
            'charttype': 'echarts',
            'createname': '',
            'createtime': '',
            'datasetstring': JSON.stringify(datasetObj),
            'echartconfig': JSON.stringify($scope.tempChartObj.data),
            'filterstring': '{}',
            'id': '',
            'imgpath': '',
            'jsonconfig': $scope.tempChartObj.data.data.type,
            'keywords': '',
            'kind': $scope.tempChartObj.kind,
            'name': $scope.tempChartObj.name,
            'refreshspeed': 60,
            'remark': ''
        }
        if (saveType == 'save') {
            $http({
                method: 'POST',
                url: '/api/setcharts/',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: chartObj
            }).then(function (rs) {
                if (rs.data.status == 'success') {
                    chartObj['id'] = rs.data.id;
                    chartObj['datatype'] = 'chart';
                    var _enumKind = $scope.enumKinds.filter(function (value) {
                        return value['code'] == chartObj['kind']
                    })
                    if (_enumKind && _enumKind.length == 1) {
                        chartObj['kind'] = _enumKind[0]['name']
                    }
                    $scope.dropComplete();
                    $scope.dragstart(chartObj);
                }
                $('.chart-save-panel').css('top', '-700px');
            });
        }
    };
    /* #endregion */
    // endregion

    // region 获取场景列表 用于链接跳转等功能
    $scope.scenes = [];
    $scope.getSceneList = function () {
        $http({
            method: 'post',
            url: '/api/dash/getSceneList',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {}
        }).then(function (rs) {
            if (rs.data.status == "success") {
                $scope.scenes = rs.data.rows;
            }
        });
    };
    $scope.getSceneList();

    // endregion

    // region 过滤器配置
    /* #region   */

    // 鼠标移上图表时对应olap高亮
    $scope.showChartOlap = function (chart) {
        if (chart.data.datasetstring) {
            var chartConfigObj = JSON.parse(chart.data.datasetstring);
            $('.olap-' + chartConfigObj.id).css('background-color', 'red');
        } else if (chart.data.jsonconfig && chart.data.jsonconfig.olapid) {
            $('.olap-' + chart.data.jsonconfig.olapid).css('background-color', 'red');
        }
    };

    // 鼠标移上图表时对应olap高亮
    $scope.hideChartOlap = function (chart) {
        if (chart.data.datasetstring) {
            var chartConfigObj = JSON.parse(chart.data.datasetstring);
            $('.olap-' + chartConfigObj.id).css('background-color', 'white');
        } else if (chart.data.jsonconfig && chart.data.jsonconfig.olapid) {
            $('.olap-' + chart.data.jsonconfig.olapid).css('background-color', 'white');
        }
    };

    $scope.filterObj = {};
    $scope.showFilterPanel = false;
    // 打开过滤器配置弹窗
    $scope.openFilterPanel = function (item) {
        var index = findItemById(item.data.id, $scope.configitems);
        // 取当前场景中所有图表涉及到的olap的所有字段
        if ($scope.olapIds.length > 0) {
            $http({
                method: 'post',
                url: "/api/dash/getOlapTableCols",
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    olapIds: $scope.olapIds
                }
            }).then(function (rs) {
                if (rs.data.status == 'success') {
                    $scope.currentFilterObj = {};
                    $scope.currentFilterIndex = -1;
                    $scope.currentFilterIndex = index;
                    if (!item.customCode) {
                        item.customCode = {
                            enabled: false,
                            beforeValueChangeCode: '',
                            afterValueChangeCode: '',
                        }
                    }
                    $scope.currentFilterObj = angular.copy(item);
                    
                    $scope.showFilterPanel = true;
                    $timeout(function () {
                        $('.filter-panel').show();
                    }, 500);
                    $scope.filterObj['olaps'] = rs.data.olaps;
                    $scope.filterObj['colsObjs'] = rs.data.colsObjs;
                    // console.log($scope.filterObj);
                    // console.log($scope.configitems);

                    // 如果之前已经配置过
                    if (item['data']['configs']) {
                        // console.log('item:', item);
                        var charts = item['data']['configs']['charts'];
                        $scope.configitems.forEach(function (tempItem) {
                            if (tempItem['data']['datatype'] &&
                                (tempItem['data']['datatype'] == 'chart' || tempItem['data']['datatype'] == 'table')) {
                                charts.forEach(function (chart) {
                                    if (chart['data']['id'] == tempItem['data']['id']) {
                                        tempItem['data']['check'] = true;
                                    }
                                });
                            }
                        });
                        var olapCols = item['data']['configs']['olapCols'];
                        $scope.filterObj['colsObjs'].forEach(function (tempCol) {
                            olapCols.forEach(function (olapCol) {
                                if (tempCol['id'] == olapCol['id']) {
                                    tempCol['selected'] = olapCol['selected'];
                                }
                            });
                        });
                    }

                } else {
                    alert('获取olap字段失败!');
                }
            });
        } else {
            alert('请先放入组件!');
        }
    };

    // 关闭过滤器弹窗
    $scope.closeFilterPanel = function () {
        $scope.clearFilterTemp();
    }

    // 保存过滤器配置
    $scope.saveFilterPanel = function () {
        // console.log('$scope.filterObj=',$scope.filterObj);
        // console.log('$scope.configitems',$scope.configitems);
        $scope.currentFilterObj['data']['configs'] = {
            'charts': [],
            'olapCols': []
        };
        $scope.currentFilterObj['data']['configs']['olapCols'] = $scope.filterObj['colsObjs'].filter(function (ele, index, array) {
            if (ele.selected && ele.selected.length > 0) {
                return true;
            }
            return false;
        });
        $scope.currentFilterObj['data']['configs']['charts'] = []
        $scope.configitems.forEach(function (ele, index, array) {
            if (ele.data.check) {
                var obj = {
                    'data': {
                        'id': ele.data['id'],
                        'name': ele.data['name'],
                        'kind': ele.data['kind'],
                        'datatype': ele.data['datatype'],
                        'charttype': ele.data['charttype'],
                        'datasetstring': ele.data['datasetstring']
                    }
                }
                $scope.currentFilterObj['data']['configs']['charts'].push(obj);
                ele.data.check = false;
            }
        });

        // 配置默认值
        var filterType = $scope.currentFilterObj.data.dropType;
        var defaultVal = getDateValues(filterType, $scope.currentFilterObj.data.defaultValName, $scope.currentFilterObj.data.defaultVal);
        $scope.currentFilterObj.data.defaultVal = defaultVal;

        $scope.configitems[$scope.currentFilterIndex] = angular.copy($scope.currentFilterObj);

        // 过滤器类型为下拉框时获取过滤器数据
        if ($scope.currentFilterObj['data']['dropType'] == 'select') {
            var currentIndex = $scope.currentFilterIndex;
            $scope.getFilterDatas(currentIndex);
        }

        // console.log($scope.configitems[$scope.currentFilterIndex]);
        $scope.clearFilterTemp();
    }

    $scope.getFilterDatas = function (currentIndex) {
        var getFilterDatasUrl = "/api/dash/getFilterDatas"
        if ($scope.configitems[currentIndex].data.customCode &&
            $scope.configitems[currentIndex].data.customCode.customFilterData && 
            $scope.configitems[currentIndex].data.customCode.customFilterUrl && 
            $scope.configitems[currentIndex].data.customCode.customFilterUrl.length > 1) {
                getFilterDatasUrl = $scope.configitems[currentIndex].data.customCode.customFilterUrl
            }
        try {
            $http({
                method: 'post',
                url: getFilterDatasUrl,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    olapCols: $scope.configitems[currentIndex].data.configs.olapCols
                }
            }).then(function (rs) {
                if (rs.data.status == 'success') {
                    //console.log(rs);
                    $scope.configitems[currentIndex]['data']['filterDatas'] = rs.data.data
                }
            });
        } catch (e) {
            console.log(e)
        }
    };

    // 过滤器配置完成后重置配置时产生的临时数据
    $scope.clearFilterTemp = function () {
        $scope.showFilterPanel = false;
        $scope.currentFilterIndex = -1;
        $scope.filterObj = {};
        $scope.configitems.forEach(function (value) {
            if (value['data']['datatype'] && value['data']['datatype'] == 'chart') {
                value['data']['check'] = false;
            }
        });
    };

    $scope.filterDefaultValues = [{
        'name': '当天',
        'value': 'currentDay',
        'type': 'select, date, text'
    }, {
        'name': '当月',
        'value': 'currentMonth',
        'type': 'select, date, text'
    }, {
        'name': '当年',
        'value': 'currentYear',
        'type': 'select, date, text'
    }, {
        'name': '最近7天',
        'value': 'backWeek',
        'type': 'date'
    }, {
        'name': '最近30天',
        'value': 'backMonth',
        'type': 'date'
    }, {
        'name': '当前季度',
        'value': 'currentQuarter',
        'type': 'date'
    }, ]

    /* #endregion */
    // endregion

    // region 初始化组件列表
    // 遍历组件
    function mapData(arr) {
        var map = {},
            dest = [];
        for (var i = 0; i < arr.length; i++) {
            var ai = arr[i];
            if (!map[ai.kind]) {
                dest.push({
                    kind: ai.kind,
                    data: [ai]
                });
                map[ai.kind] = ai;
            } else {
                for (var j = 0; j < dest.length; j++) {
                    var dj = dest[j];
                    if (dj.kind == ai.kind) {
                        dj.data.push(ai);
                        break;
                    }
                }
            }
        }
        return dest;
    }

    // 获取所有组件
    $scope.filterChartsVal = ''
    $scope.queryList = function (page) {
        $scope.data.startIndex = (page - 1) * 10 //分页起始位置
        $scope.data.count = $scope.count; //分页条数
        $scope.data.orderBy = "id ASC"; //排序
        $.ajax({
            url: '/api/getAllcharts/?format=json',
            type: 'get',
            data: $scope.data
        }).then(function (data) {
            $scope.kinds = mapData(data.datas);
            $scope.kindsClone = angular.copy($scope.kinds)
            $scope.$apply(function () {
                $scope.time = new Date();
            });
            // window.setTimeout("InitUI()", 100);
        });
    };
    $scope.queryList(1);

    $scope.filterCharts = function () {
        if ($scope.filterChartsVal.length > 0) {
            $scope.kinds.forEach(function (value, index) {
                var _tempCount = 0
                value.data.forEach(function (_value, _index) {
                    if (_value.name.indexOf(($scope.filterChartsVal + '')) === -1) {
                        _value['hideInChartList'] = true
                        _tempCount += 1
                    } else {
                        _value['hideInChartList'] = false
                    }
                })
                if (_tempCount === value.data.length) {
                    value['hideInChartList'] = true
                } else {
                    value['hideInChartList'] = false
                }
            })
        } else {
            $scope.kinds = angular.copy($scope.kindsClone)
        }
    }

    $scope.showChartsList = function () {
        $scope.showCharts = !$scope.showCharts;
        $('.left-block').show();
        $timeout(function () {
            if ($scope.showCharts) {
                $('.left-block').css('height', (document.documentElement.clientHeight - 100) + 'px')
            } else {
                $('.left-block').css('height', '0px');
            }
        });
    }

    // endregion

    //region 场景布局插件相关配置
    $scope.configitems = [];
    $scope.contentWidth = $window.innerWidth - 56
    // if ($('#silderApp')) {
    //     $scope.contentWidth = $window.innerWidth - $('#silderApp').width() - 6;
    // }
    $scope.startResizeWidth = 0;
    $scope.startResizeHeight = 0;
    // 拖拽布局插件配置
    $scope.gridsterOpts = {
        margins: [6, 6],
        columns: 96, // the width of the grid, in columns
        minRows: 3,
        maxRows: 100,
        floating: true,
        pushing: true ? $scope.viewType == 'edit' : $scope.viewType == 'show',
        outerMargin: false,
        mobileBreakPoint: 600,
        mobileModeEnabled: true,
        saveGridItemCalculatedHeightInMobile: true,
        sparse: true,
        swapping: true ? $scope.viewType == 'edit' : $scope.viewType == 'show',
        colWidth: 'auto',
        rowHeight: 50,
        draggable: {
            enabled: true ? $scope.viewType == 'edit' : $scope.viewType == 'show',
            start: function (event, $element, widget) {}, // optional callback fired when resize is started,
            drag: function (event, $element, widget) {}, // optional callback fired when item is resized,
            stop: function (event, $element, widget) {
                $scope.fixContentWidth();
            } // optional callback fired when item is finished resizing
        },
        resizable: {
            enabled: true ? $scope.viewType == 'edit' : $scope.viewType == 'show',
            handles: ['n', 'e', '', 'w', 'ne', 'se', 'sw', 'nw'],
            start: function (event, $element, widget) {

                $scope.startx = widget.sizeX;
                $scope.starty = widget.sizeY;
            }, // optional callback fired when drag is started,
            resize: function (event, $element, widget) {}, // optional callback fired when item is moved,
            stop: function (event, $element, widget) {
                var stopx = widget.sizeX;
                var stopy = widget.sizeY;
                // console.log($scope.startResizeWidth, stopWidth);
                // console.log($scope.startResizeHeight, stopHeight);
                if (!angular.equals($scope.startx, stopx) || !angular.equals($scope.starty, stopy)) {
                    if (widget.data.datatype && widget.data.datatype == 'chart') {
                        var config = JSON.parse(widget.data.echartconfig);
                        config.width = stopx * ($rootScope.scenesContentWidth / 96).toFixed(2) - 10;
                        config.height = stopy * 50 - 10;
                        var data = widget.data.lists;
                        widget.data.chartHeight = config.height;
                        widget.data.chartWidth = config.width;
                        //buildEchart(config, $element.find('.chart-content'), data);
                        $element.find('.chart-content')[0].style.width = "100%";
                        $element.find('.chart-content')[0].style.height = "100%";
                        echarts.getInstanceByDom($element.find('.chart-content')[0]).resize();
                    } else if (widget.data.datatype && widget.data.datatype == 'table') {
                        widget['data']['refreshCount'] = widget['data']['refreshCount'] + 1;
                    }
                }
                if (typeof widget['data']['refreshCount'] == 'number') {
                    //widget['data']['refreshCount'] = widget['data']['refreshCount'] + 1;
                }
                $scope.fixContentWidth();
            } // optional callback fired when item is finished dragging
        }

    };
    $scope.dropComplete = function (idx, data, evt) {
        $scope.tmpcmp = null;
        $scope.fixContentWidth();
        if ($scope.addedInScene) {
            alert('注意！组件' + $scope.duplicatedComponentName + '已存在，不能重复拖入!');
        }
    }
    $scope.tmpcmp = false;
    $scope.dragstop = function (data, evt) {
        if (!$scope.tmpcmp)
            $scope.tmpcmp = false;
        else {
            $scope.configitems.pop();
            $scope.tmpcmp = false;
        }
    };

    $scope.dragmove = function (data, evt) {
        // console.log(evt);
        $scope.configitems[$scope.configitems.length - 1].col = Math.round((evt.tx - 250) / $scope.contentWidth * 96);
        $scope.configitems[$scope.configitems.length - 1].row = Math.round((evt.ty - 40) / 50) + 2;
    };


    $scope.dragstart = function (data, evt) {
        // console.log('dragstart');
        // console.log(data);
        $scope.showCharts = false;
        $('.left-block').css('height', '0px');
        data['labelText'] = '此处可输入图表注释';
        data['mbConfig'] = {
            'sort': 0
        } // 移动端显示相关配置
        data['commentsConfig'] = {
            'style': $scope.sceneObj.options.commentsStyle,
            'comments': [],
            'barrage': false
        };
        data['itemConfigs'] = {}
        data['refreshCount'] = 0;
        $scope.addedInScene = false; //是否能添加进入场景，判断当前拖入的组件是否已经存在，存在即不加入
        if (data.dropType == 'text' || data.dropType == 'select' || data.dropType == 'date' ||
            data.dropType == 'labelBox') {
            data['id'] = generateUuid(32, 16);
            data['filterName'] = '过滤器';
            //data['removeComponent'] = 'show';
            if (data.dropType == 'select' || data.dropType == 'date') {
                data['defaultVal'] = [];
                data['defaultValName'] = '';
                data['val'] = [];
                data['multipleSelect'] = true;
                data.styleConfig = angular.copy($scope.sceneObj.options.filterStyle);
            }
            if (data.dropType == 'text') {
                data['defaultVal'] = '';
                data['defaultValName'] = '';
                data['val'] = '';
                data['textFilterWay'] = 'equal'
                data.styleConfig = angular.copy($scope.sceneObj.options.filterStyle);
            }
            if (data.dropType == 'labelBox') {
                data['textContent'] = $sce.trustAsHtml('<p>sample text</p>');
                data['componentType'] = 'text';
                data.styleConfig = angular.copy($scope.sceneObj.options.chartStyle);
            }
            data.styleConfig.separationClass = 'separation-37'
            $scope.configitems.push({
                sizeX: data.sizeX,
                sizeY: data.sizeY,
                row: 0,
                col: 1,
                data: data
            });
        } else {
            var originUrl = '';
            data.styleConfig = angular.copy($scope.sceneObj.options.chartStyle);
            //判断该组件是否已经存在于场景中，如果存在就不准拖入
            for (var i = 0; i < $scope.configitems.length; i++) {
                if ($scope.configitems[i]['data']['id'] == data['id']) {
                    // alert('注意！不能重复拖入组件' + data['name'] + '!');
                    $scope.addedInScene = true;
                    $scope.duplicatedComponentName = data['name']; //在$scope.dropComplete会alert出重复名称
                }
            }
            if (!$scope.addedInScene) { //如果当前拖入组件不存在于场景中，就添加进入场景，否则什么也不做
                if (data.charttype && data.charttype == 'table') {
                    data.tableStyle = {};
                    originUrl = data.jsonconfig.data.url;
                    data['showPage'] = true;
                    $scope.configitems.push({
                        sizeX: 32,
                        sizeY: 8,
                        row: 0,
                        col: 1,
                        data: data
                    });
                } else {
                    originUrl = (JSON.parse(data.echartconfig)).data.url;
                    data['events'] = {};
                    data['link'] = '';
                    $scope.configitems.push({
                        sizeX: 32,
                        sizeY: 5,
                        row: 0,
                        col: 0,
                        data: data
                    });
                }
                $scope.configitems[$scope.configitems.length - 1]['data']['originUrl'] = originUrl;
            }
        }
        $scope.configitems[$scope.configitems.length - 1]['data']['refreshCount'] = 1;

        if (data && !$scope.addedInScene) {
            if (data.datasetstring) {
                var obj = JSON.parse(data.datasetstring);
                $scope.olapIds.push(obj['id']);
            } else if (data.jsonconfig && data.jsonconfig.olapid) {
                $scope.olapIds.push(data.jsonconfig.olapid);
            }
        }
        $scope.tmpcmp = true;
        // console.log('dragstart over:');
        // console.log($scope.configitems[$scope.configitems.length - 1]);
    };

    // 删除布局中的组件
    $scope.del = function (item) {
        // 图表和table
        if ($scope.configitems.data && $scope.configitems.data.datasetstring) {
            var obj = JSON.parse(ary.data.datasetstring);
            var index = $scope.olapIds.indexOf(obj['id']);
            if (index > -1) {
                $scope.olapIds.splice(index, 1);
            }
            // 过滤器
        } else {
            //$scope.configitems[num]['data']['removeComponent'] = 'remove';
        }
        var num = findItemById(item.data.id, $scope.configitems);
        $scope.configitems.splice(num, 1);
    };

    //endregion

    //region 单个组件样式配置

    $scope.scenesItemStyle = {};
    $scope.scenesItemConfigs = {};

    $scope.currentItemIndex = -1;
    $scope.currentItemType = '';
    $scope.watchItemStyleConfig = false;
    $scope.tempVariables = {
        'synchronizeComponentStyle': {
            'chart': true,
            'table': true,
            'filter': false,
            'text': false
        }
    }
    $scope.openScenesStyleConfigPanel = function (item) {
        $scope.currentItemType = item.data.dropType ? item.data.dropType : item.data.datatype;
        // $scope.tempVariables.synchronizeComponentStyle = {'chart': true, 'table': true, 'filter': false, 'text': false}
        $scope.currentItemIndex = findItemById(item.data.id, $scope.configitems);
        if (!item.data.itemConfigs) {
            item.data.itemConfigs = {}
        }
        $scope.scenesItemConfigs = angular.copy(item.data.itemConfigs);
        if (item.data.styleConfig) {
            $scope.scenesItemStyle = angular.copy(item.data.styleConfig);
        } else {
            var filterTypeStr = ', text, select, date';
            if (filterTypeStr.indexOf($scope.currentItemType) > 0) {
                $scope.scenesItemStyle = angular.copy($scope.sceneObj.options.filterStyle);
            }
            var chartTypeStr = ', chart, table, labelBox';
            if (chartTypeStr.indexOf($scope.currentItemType) > 0) {
                $scope.scenesItemStyle = angular.copy($scope.sceneObj.options.chartStyle);
            }
        }
        $('.scenes-item-config').css('top', '10%');
        $scope.watchItemStyleConfig = true;
    };

    $scope.synchronizeComponentStyle = function () {
        if (Object.keys($scope.scenesItemStyle).length > 0) {
            $scope.configitems.forEach(function (value, index, array) {
                var _tempType = value.data.dropType ? value.data.dropType : value.data.datatype;
                var _tempFlag = false
                if ($scope.tempVariables.synchronizeComponentStyle.chart) {
                    if (_tempType === 'chart') {
                        _tempFlag = true
                    }
                }
                if ($scope.tempVariables.synchronizeComponentStyle.table) {
                    if (_tempType === 'table') {
                        _tempFlag = true
                    }
                }
                if ($scope.tempVariables.synchronizeComponentStyle.filter) {
                    if (', text, select, date'.indexOf(_tempType) > 0) {
                        _tempFlag = true
                    }
                }
                if ($scope.tempVariables.synchronizeComponentStyle.text) {
                    if (_tempType === 'labelBox') {
                        _tempFlag = true
                    }
                }
                if (_tempFlag) {
                    value.data.styleConfig = angular.copy($scope.scenesItemStyle)
                }
            })
        }
    }

    $scope.closeScenesStyleConfigPanel = function () {
        $scope.configitems[$scope.currentItemIndex].data.itemConfigs = angular.copy($scope.scenesItemConfigs);
        $scope.watchItemStyleConfig = false;
        $scope.scenesItemStyle = {};
        $scope.scenesItemConfigs = {}
        $('.scenes-item-config').css('top', '-700px');
    };

    $scope.$watch('scenesItemStyle', function (newVal) {
        if ($scope.watchItemStyleConfig) {
            // 边框样式设置
            if (!$scope.scenesItemStyle.borderDisplay) {
                delete $scope.scenesItemStyle.borderWidth;
                delete $scope.scenesItemStyle.borderStyle;
                delete $scope.scenesItemStyle.borderColor;
            }
            if (!$scope.scenesItemStyle.currCharsBgPicSts) { //组件背景图片设置
                delete $scope.scenesItemStyle.backgroundSize;
                delete $scope.scenesItemStyle.backgroundRepeat;
                delete $scope.scenesItemStyle.backgroundImage;
            }
            if ($scope.scenesItemStyle.backgroundImage && $scope.scenesItemStyle.backgroundImage.length > 0 && $scope.scenesItemStyle.backgroundImage.indexOf('url(') == -1) {
                $scope.scenesItemStyle.backgroundImage = 'url(' + $scope.scenesItemStyle.backgroundImage + ')';
            }
            $scope.configitems[$scope.currentItemIndex]['data']['styleConfig'] = angular.copy($scope.scenesItemStyle);
        }
    }, true);

    $scope.fixPx = function (modelName, modelval, eleId) {
        var tempVal = modelval.replace(/[^0-9]/ig, "") + 'px';
        if (tempVal != modelval) {
            eval("$scope." + modelName + "='" + tempVal + "'");
        }
        //console.log($scope['scenesItemStyle']);
        //eval("$scope."+modelName+"='23px'");
        //eval('console.log($scope.'+modelName+')');
        $timeout(function () {
            var oField = document.getElementById(eleId);
            oField.setSelectionRange(tempVal.length - 2, tempVal.length - 2);
        });
    }

    //endregion 单个组件配置  end

    //region 全局配置

    // 全局配置
    $scope.scenesGlobalConfig = function () {
        var _jqGlobalConfig = $('.global-config')
        _jqGlobalConfig.css('top', '10%').css('left', '0').css('right', '0');
        if (!_jqGlobalConfig.hasClass('floating-layer-margin')) {
            _jqGlobalConfig.addClass('floating-layer-margin')
        }
    };

    //获取配置的场景样式
    $http.get("/api/dash/getChartsbgConfigList?status=0").then(function (response) {
        $scope.configedSceneStyleObjs = response.data.rows;

        $timeout(function () {
            if ($scope.sceneObj.options.configedSecenId) { //根据查询的值回显
                var configedSecenId = angular.copy($scope.sceneObj.options.configedSecenId);
                var configedSceneStyleObjs = angular.copy($scope.configedSceneStyleObjs);
                for (var i = 0; i < configedSceneStyleObjs.length; i++) {
                    if (typeof (configedSceneStyleObjs[i]) == "string") { //转json对象
                        configedSceneStyleObjs[i] = JSON.parse(configedSceneStyleObjs[i]);
                    }
                    if (configedSceneStyleObjs[i].id == configedSecenId) {
                        $("#selectedConfigScene").find('option').eq(i + 1).attr('selected', true); ///由于angular会自动添加一个空的option，这里必须加一
                        break;
                    }
                }
            }
        })
    });
    $scope.customScenes = {
        'selectedConfigScene': ''
    }
    //根据选择的ConfigScene，赋值给$scope.sceneObj对应的属性,这里需要注意返回对象的某些属性是json字符串，需要转为对象才能使用
    $scope.configSceneStyleApply = function () {
        console.log('$scope.selectedConfigScene', $scope.customScenes.selectedConfigScene)
        var selectedConfigSceneObj = $("#selectedConfigScene").val();

        if (typeof (selectedConfigSceneObj) == "string") { //转json对象
            selectedConfigSceneObj = JSON.parse(selectedConfigSceneObj);
        }

        if (typeof (selectedConfigSceneObj.options) == "string") { //转json对象
            selectedConfigSceneObj.options = JSON.parse(selectedConfigSceneObj.options);
        }
        if (typeof (selectedConfigSceneObj.basicconfig) == "string") { //转json对象
            selectedConfigSceneObj.basicconfig = JSON.parse(selectedConfigSceneObj.basicconfig);
        }
        if (selectedConfigSceneObj) {
            if (typeof (selectedConfigSceneObj.options) == "string") {
                $scope.sceneObj.options = JSON.parse(selectedConfigSceneObj.options);
            } else {
                $scope.sceneObj.options = selectedConfigSceneObj.options;
            }
            if (typeof (selectedConfigSceneObj.basicconfig) == "string") {
                $scope.sceneObj.basicconfig = JSON.parse(selectedConfigSceneObj.basicconfig);
            } else {
                $scope.sceneObj.basicconfig = selectedConfigSceneObj.basicconfig;
            }
            $scope.gridsterOpts.margins[0] = selectedConfigSceneObj.options.componentMargin['marginLeft']; //边距
            $scope.gridsterOpts.margins[1] = selectedConfigSceneObj.options.componentMargin['marginTop'];
        }
        $scope.sceneObj.options.configedSecenId = selectedConfigSceneObj.id; //将用户选择的已配置背景样式的id保存起来以便回显
    }

    $scope.changeScenesPicture = function (event) {
        if (event.target.files[0]) {
            var formData = new FormData();
            formData.append("filename", document.getElementById('scenesBgImg').files[0]);
            $.ajax({
                url: '/api/dash/uploadbgpicture',
                type: 'post',
                processData: false,
                contentType: false,
                data: formData
            }).then(function (data) {
                if (data.code == "1") {
                    var imgPath = data.path + data.filename;
                    $scope.sceneObj.options.globalStyle.backgroundImage = imgPath;
                    $scope.getUserImgs();
                } else {
                    alert('上传失败');
                }
            });
        }
    }
    // var fileInput = $element.find('#scenesBgImg');
    // fileInput.bind("change", function (changeEvent) {
    //     if (document.getElementById('scenesBgImg').files[0]) {
    //         var formData = new FormData();
    //         formData.append("filename", document.getElementById('scenesBgImg').files[0]);
    //         $.ajax({
    //             url: '/api/dash/uploadbgpicture',
    //             type: 'post',
    //             processData: false,
    //             contentType: false,
    //             data: formData
    //         }).then(function (data) { 
    //             if (data.code == "1") {
    //                 var imgPath = data.path + data.filename;
    //                 $scope.sceneObj.options.globalStyle.backgroundImage = imgPath;
    //                 $scope.getUserImgs();
    //             } else {
    //                 alert('上传失败');
    //             }
    //         });
    //     }
    // });
    //修改组件的背景图片
    $scope.changeChartsPicture = function (event) {
        if (event.target.files[0]) {
            var formChartsData = new FormData();
            formChartsData.append("filename", event.target.files[0]);
            $.ajax({
                url: '/api/dash/uploadchartsbgpicture',
                type: 'post',
                processData: false,
                contentType: false,
                data: formChartsData
            }).then(function (data) {
                if (data.code == "1") {
                    var imgPath = data.path + data.filename;
                    $scope.sceneObj.options.chartStyle.backgroundImage = imgPath;
                    $scope.getUserChartsImgs();
                } else {
                    alert('上传失败');
                }
            });
        }
    }
    //修改组件的背景图片
    $scope.changeCurrChartsPicture = function (event) {
        if (event.target.files[0]) {
            var formChartsData = new FormData();
            formChartsData.append("filename", event.target.files[0]);
            $.ajax({
                url: '/api/dash/uploadchartsbgpicture',
                type: 'post',
                processData: false,
                contentType: false,
                data: formChartsData
            }).then(function (data) {
                if (data.code == "1") {
                    var imgPath = data.path + data.filename;
                    $scope.scenesItemStyle.backgroundImage = imgPath;
                    $scope.getUserChartsImgs();
                } else {
                    alert('上传失败');
                }
            });
        }
    }

    $scope.isUseBgImg = function () {
        if (!$scope.tempVal.useBgImg) {
            $scope.sceneObj.options.globalStyle['backgroundImage'] = '';
        } else {
            $scope.sceneObj.options.globalStyle['backgroundSize'] = 'cover';
            $scope.sceneObj.options.globalStyle['backgroundRepeat'] = 'no-repeat';
        }
    };
    $scope.isUseChartsBgImg = function () {
        if (!$scope.tempVal.useChartsBgImg) {
            $scope.sceneObj.options.chartStyle['backgroundImage'] = '';
        } else {
            $scope.sceneObj.options.chartStyle['backgroundSize'] = 'cover';
            $scope.sceneObj.options.chartStyle['backgroundRepeat'] = 'no-repeat';
        }
    };
    $scope.currCharsBgPicChange = function () {
        if (!$scope.tempVal.useChartsBgImg) {
            $scope.scenesItemStyle['backgroundImage'] = '';
        } else {
            $scope.scenesItemStyle['backgroundSize'] = 'cover';
            $scope.scenesItemStyle['backgroundRepeat'] = 'no-repeat';
        }
    };

    $scope.setPreStyle = function (preType) {
        $scope.sceneObj.options.syncFontColor = false;
        if (preType == 'white') {
            $scope.sceneObj.options['toolBarStyle'] = angular.copy(totalStyle.white.toolBarStyle);
            $scope.sceneObj.options['filterStyle'] = angular.copy(totalStyle.white.filterStyle);
            $scope.sceneObj.options['chartStyle'] = angular.copy(totalStyle.white.chartStyle);
            $scope.sceneObj.options['globalStyle'] = angular.copy(totalStyle.white.globalStyle);
            $scope.useBgImg = false;
            $scope.sceneObj.options.commentsStyle = commentsStyle.lightStyle;
        } else if (preType == 'black') {
            $scope.sceneObj.options['toolBarStyle'] = angular.copy(totalStyle.black.toolBarStyle);
            $scope.sceneObj.options['filterStyle'] = angular.copy(totalStyle.black.filterStyle);
            $scope.sceneObj.options['chartStyle'] = angular.copy(totalStyle.black.chartStyle);
            $scope.sceneObj.options['globalStyle'] = angular.copy(totalStyle.black.globalStyle);
            $scope.useBgImg = false;
            $scope.sceneObj.options.commentsStyle = commentsStyle.darkStyle;
        } else if (preType == 'blue') {
            $scope.sceneObj.options['toolBarStyle'] = angular.copy(totalStyle.default03.toolBarStyle);
            $scope.sceneObj.options['filterStyle'] = angular.copy(totalStyle.default03.filterStyle);
            $scope.sceneObj.options['chartStyle'] = angular.copy(totalStyle.default03.chartStyle);
            $scope.sceneObj.options['globalStyle'] = angular.copy(totalStyle.default03.globalStyle);
            $scope.useBgImg = true;
            $scope.sceneObj.options.commentsStyle = commentsStyle.darkStyle;
        } else if (preType == 'theme04') {
            $scope.sceneObj.options['toolBarStyle'] = angular.copy(totalStyle.default04.toolBarStyle);
            $scope.sceneObj.options['filterStyle'] = angular.copy(totalStyle.default04.filterStyle);
            $scope.sceneObj.options['chartStyle'] = angular.copy(totalStyle.default04.chartStyle);
            $scope.sceneObj.options['globalStyle'] = angular.copy(totalStyle.default04.globalStyle);
            $scope.useBgImg = true;
            $scope.sceneObj.options.commentsStyle = commentsStyle.darkStyle;
        } else if (preType == 'theme05') {
            $scope.sceneObj.options['toolBarStyle'] = angular.copy(totalStyle.default05.toolBarStyle);
            $scope.sceneObj.options['filterStyle'] = angular.copy(totalStyle.default05.filterStyle);
            $scope.sceneObj.options['chartStyle'] = angular.copy(totalStyle.default05.chartStyle);
            $scope.sceneObj.options['globalStyle'] = angular.copy(totalStyle.default05.globalStyle);
            $scope.useBgImg = true;
            $scope.sceneObj.options.commentsStyle = commentsStyle.darkStyle;
        } else if (preType == 'theme06') {
            $scope.sceneObj.options['toolBarStyle'] = angular.copy(totalStyle.default06.toolBarStyle);
            $scope.sceneObj.options['filterStyle'] = angular.copy(totalStyle.default06.filterStyle);
            $scope.sceneObj.options['chartStyle'] = angular.copy(totalStyle.default06.chartStyle);
            $scope.sceneObj.options['globalStyle'] = angular.copy(totalStyle.default06.globalStyle);
            $scope.useBgImg = true;
            $scope.sceneObj.options.commentsStyle = commentsStyle.darkStyle;
        }
        $timeout(function () {
            $scope.sceneObj.options.syncFontColor = true;
        });
        $("#selectedConfigScene").val(''); //当切换为预制样式时需要取消已配置样式的选择项
    };

    $scope.$watch('sceneObj.options.filterStyle', function (newVal) {
        if (newVal.backgroundImage && newVal.backgroundImage.length > 0 && newVal.backgroundImage.indexOf('url(') == -1) {
            newVal.backgroundImage = 'url(' + newVal.backgroundImage + ')'
        }
        if ($scope.stopMultipleLoad()) {
            var typeStr = ', text, select, date';
            $scope.configitems.forEach(function (value) {
                var currentType = value.data.dropType ? value.data.dropType : value.data.datatype;
                if (typeStr.indexOf(currentType) > 0) {
                    value.data['styleConfig'] = angular.copy(newVal);
                    if (isNull(value.data.styleConfig.separationClass)) {
                        value.data.styleConfig['separationClass'] = 'separation-46'
                    }
                }
            });
        }
    }, true);

    $scope.$watch('sceneObj.options.chartStyle', function (newVal) {
        if (newVal.backgroundImage && newVal.backgroundImage.length > 0 && newVal.backgroundImage.indexOf('url(') == -1) {
            newVal.backgroundImage = 'url(' + newVal.backgroundImage + ')'
        }
        if ($scope.stopMultipleLoad()) {
            var typeStr = ', chart, table, labelBox, ';
            $scope.configitems.forEach(function (value) {
                var currentType = value.data.dropType ? value.data.dropType : value.data.datatype;
                if (typeStr.indexOf(currentType) > 0) {
                    value.data['styleConfig'] = angular.copy(newVal);
                }
            });
        }
    }, true);

    $scope.$watch('sceneObj.options.globalStyle', function () {
        var globalStyle = angular.copy($scope.sceneObj.options.globalStyle);
        if (globalStyle.backgroundImage && globalStyle.backgroundImage.length > 0) {
            globalStyle.backgroundImage = 'url(' + globalStyle.backgroundImage + ')'
        }
        removeEmpty(globalStyle);
        // 将背景设置到 main-app-content，该方法目前废弃，目前将背景设置到带滚动条的class为content-wrapper标签中
        // $scope.dashboardStyle = function () {
        //     return removeEmpty(globalStyle);
        // }
        var _jqContentWrapper = $('.content-wrapper')
        if (globalStyle.color) {
            $('.main-app-content').css('color', globalStyle.color)
        } else {
            $('.main-app-content').css('color', 'rgba(51, 51, 51, 1)')
        }
        if (globalStyle.backgroundColor) {
            _jqContentWrapper.css('background-image', '')
            _jqContentWrapper.css('background-color', globalStyle.backgroundColor)
        } else {
            if (!globalStyle.backgroundImage) {
                _jqContentWrapper.css('background-image', '')
                _jqContentWrapper.css('background-color', 'rgba(227, 230, 235, 1)')
            }
        }
        if (isNotNull(globalStyle.backgroundImage)) {
            _jqContentWrapper.css('background-color', '')
            _jqContentWrapper.css('background-image', globalStyle.backgroundImage)
            _jqContentWrapper.css('background-size', globalStyle.backgroundSize)
            _jqContentWrapper.css('background-repeat', globalStyle.backgroundRepeat)
        }
        if ($scope.stopMultipleLoad()) {
            if (globalStyle.color && globalStyle.color.length > 1) {
                if ($scope.sceneObj.options.syncFontColor) {
                    var currColor = globalStyle.color;
                    $timeout(function () {
                        if (currColor == $scope.sceneObj.options.globalStyle.color) {
                            $scope.configitems.forEach(function (value) {
                                if (value.data.datatype && value.data.datatype == 'chart') {
                                    value.data.styleConfig['color'] = globalStyle.color;
                                }
                            });
                        }
                    }, 1000);

                }
            }
        }
    }, true);

    $scope.$watch('sceneObj.options.syncFontColor', function (newval) {
        if ($scope.stopMultipleLoad()) {
            if (newval) {
                var globalStyle = angular.copy($scope.sceneObj.options.globalStyle);
                if (globalStyle.color && globalStyle.color.length > 1) {
                    $scope.configitems.forEach(function (value) {
                        if (value.data.datatype && value.data.datatype == 'chart') {
                            value.data.styleConfig['color'] = globalStyle.color;
                        }
                    });
                }
            }
        }
    });

    //配置自定义js脚本
    $scope.updateCustomCode = function (msg) {
        var _tempObj = $scope.sceneObj.basicconfig.customConfig.customCode;
        if (msg == 'addMethod') {
            var _tempArr = _tempObj.code.split('function');
            _tempObj.code += 'function f' + _tempArr.length + '() {\n}\n';
        } else if (msg == 'userInfo') {
            _tempObj.code += 'var currentUserInfo = getUserInfo();\n';
        } else if (msg == 'refresh') {
            _tempObj.code = '';
        }
    };

    //执行自定义js脚本
    $scope.executeCustomConfig = function () {
        if ($scope.sceneObj.basicconfig.customConfig.customCode &&
            isNotNull($scope.sceneObj.basicconfig.customConfig.customCode.code)) {
            eval($scope.sceneObj.basicconfig.customConfig.customCode.code);
        }
    };

    $scope.switchCommentsPanel = function () {
        $scope.configitems.forEach(function (val) {
            val.data.commentsConfig.showComments = $scope.sceneObj.basicconfig.customConfig.showComments
        })
    }

    // 初始化高级配置json格式
    $scope.initCustomConfig = function () {
        if (Object.keys(nullToObj($scope.sceneObj.basicconfig.customConfig)).length == 0) {
            $scope.sceneObj.basicconfig['customConfig'] = {
                'customCode': {
                    'code': ''
                },
                'autoSave': {
                    'active': false,
                    'interval': 60
                },
                'fullscreen': false,
                'showComments': false
            }
        }
    };
    $scope.initCustomConfig();

    if ($scope.viewType == 'edit') {
        $scope.$watch('sceneObj.basicconfig.customConfig.autoSave.active', function (newVal) {
            if ($scope.sceneObj.basicconfig.customConfig.autoSave.active) {
                if (isNull(getQueryString('scenesId'))) {
                    $scope.popInformations('warning');
                } else {

                }
            } else {

            }
        });
    }

    // 右上告警、提示弹窗
    // success,error,wait,warning,note
    // clear: toaster.clear();
    $scope.popInformations = function (popType, msg, dwellTime) {
        var _defaultDwellTime = 2000;
        if (popType == 'success') {
            toaster.pop('success', "", '自动保存成功', _defaultDwellTime);
        } else if (popType == 'error') {
            toaster.pop('error', "", '自动保存失败', _defaultDwellTime);
        } else if (popType == 'warning') {
            toaster.pop('warning', "", '请先手动保存一次后再使用自动保存', 5000);
        } else {
            if (popType && msg) {
                toaster.pop(popType, "", msg, dwellTime ? dwellTime : _defaultDwellTime);
            }
        }

    };

    // 打开样式配置导出弹窗
    $scope.exportStyle = function () {
        $http({
            method: 'POST',
            url: '/api/dash/exportStyleFromScenesConfig',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                gridsterMargins: $scope.gridsterOpts.margins,
                scenesObj: $scope.sceneObj
            }
        }).then(function (rs) {
            if (rs.data.status == 'success') {
                var filePath = rs.data.downLoadZipFilePath;
                var downLoadFileName = '数据眼场景设计样式包_' + rs.data.timeStampSuff + '.zip';
                var triggerDownload = $("<a>").attr("href", filePath).attr("download", downLoadFileName).appendTo("body");
                triggerDownload[0].click();
                triggerDownload.remove();
            } else {
                console.log(rs.data)
            }
        }).catch(function onError(response) {
            console.log(response)
        })
    }

    //关闭全局配置弹窗
    $scope.closeGlobalConfigPanel = function () {
        $('.global-config').css('top', '-700px');
    };

    //endregion 全局配置 end

    // region 文本编辑器

    function updateTextEdit() {
        $scope.currentTextEditorObj.data.textContent = $sce.trustAsHtml(editor.txt.html());
        $scope.$apply();
    }

    var textTimeInterval;
    $scope.currentTextEditorObj = {
        'data': {
            'componentType': 'text',
            'links': []
        }
    }
    $scope.showTextEditor = function (item) {
        $scope.currentTextEditorObj = item
        if (!$scope.currentTextEditorObj.data.links) {
            $scope.currentTextEditorObj.data.links = [{
                'id': generateUuid(32, 16),
                'name': '',
                'url': ''
            }]
        }
        // console.log('$scope.currentTextEditorObj', $scope.currentTextEditorObj)
        $('.text-editor-content').css('top', '10%');
        editor.txt.clear()
        editor.txt.html(item.data.textContent)
        textTimeInterval = window.setInterval(updateTextEdit, 1000)
        $scope.changeTextEditor($scope.currentTextEditorObj.data.componentType)
    };

    $scope.closeTextEditor = function () {
        window.clearInterval(textTimeInterval);
        $scope.currentTextEditorObj.data.textContent = $sce.trustAsHtml(editor.txt.html());
        $('.text-editor-content').css('top', '-700px');
    };

    $scope.changeTextEditor = function (editorType) {
        if (editorType == 'text') {
            $('#textEditorContent').show()
            $('.img-editor-content').hide()
            $('.webPage-editor-content').hide()
            $scope.currentTextEditorObj.data.componentType = 'text'
        } else if (editorType == 'img') {
            $('#textEditorContent').hide()
            $('.img-editor-content').show()
            $('.webPage-editor-content').hide()
            $scope.currentTextEditorObj.data.componentType = 'img'
        } else if (editorType == 'webPage') {
            $('#textEditorContent').hide()
            $('.img-editor-content').hide()
            $('.webPage-editor-content').show()
            $scope.currentTextEditorObj.data.componentType = 'webPage'
        }
    }

    $scope.showLinkPage = function () {
        $scope.currentTextEditorObj.data.links.forEach(function (item) {
            if (item.url && item.url.length > 3) {
                $('#' + item.id).attr('src', item.url);
            }
        })
    }

    //endregion

    $scope.changeItemIndex = function (item) {
        // if (terminalType != 'phone' && terminalType != 'ipad') {
        if (viewType == 'edit') {
            var tempItemObjIndex = findItemById(item.data.id, $scope.configitems);
            if ($scope.configitems.length > 0) {
                [$scope.configitems[tempItemObjIndex], $scope.configitems[$scope.configitems.length - 1]] = [$scope.configitems[$scope.configitems.length - 1], $scope.configitems[tempItemObjIndex]];
            }
        }
    }

    // 场景收藏
    $scope.collectionScene = function () {
        var _collectType = 'scenes'
        var _collectId = currentSceneId
        var _operation = ''
        var collectionJqObj = ''
        if (terminalType == 'pc') {
            collectionJqObj = $('.pc-collection')
        } else {
            collectionJqObj = $('.m-collection')
        }
        if (collectionJqObj.hasClass('fa-star-o')) {
            _operation = 'connect'
            collectionJqObj.removeClass('fa-star-o')
            collectionJqObj.addClass('fa-star')
        } else {
            _operation = 'unConnect'
            collectionJqObj.removeClass('fa-star')
            collectionJqObj.addClass('fa-star-o')
        }

        $http({
            method: 'POST',
            url: '/api/dash/saveUserCollection',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                collectType: _collectType,
                collectId: _collectId,
                operation: _operation
            }
        }).then(function (rs) {
            console.log(rs)
        });
    }

    // region 场景保存

    //保存时修改场景类型
    $scope.kindName = '';
    $scope.changeType = function () {
        if ($scope.sceneObj.kind == '') {
            $scope.kindName = '';
        } else {
            $scope.enumKinds.forEach(function (value) {
                if (value['code'] == $scope.sceneObj.kind) {
                    $scope.kindName = value['name'];
                    if ($scope.sceneObj.keywords.length == 0) {
                        $scope.sceneObj.keywords = value['name'];
                    }
                }
            });
        }
    };

    // 将场景类型和各个组件的类型作为标签
    $scope.smartMatch = function () {
        var keywords = $scope.kindName == '' ? '' : $scope.kindName + ',';
        $scope.configitems.forEach(function (value, index, array) {
            if (value.data.kind && value.data.kind.length > 0) {
                if (keywords.indexOf(value.data.kind) == -1) {
                    keywords = keywords + value.data.kind + ',';
                }
            }
        });
        $scope.sceneObj.keywords = keywords.substr(0, keywords.length - 1);
    };

    // 场景保存
    $scope.showSavePanel = false;
    $scope.saveScene = function () {
        if ($scope.sceneObj['id'] == '') {
            $scope.smartMatch()
        }

        $('.left-block').hide();
        var themeObj = document.getElementById('scenesLayout');
        $scope.previewImgData = ''
        html2canvas($('#scenesLayout'), {
            allowTaint: false,
            width: themeObj.scrollWidth, //获取dom 宽度
            height: themeObj.scrollHeight, //获取dom 高度
            onrendered: function (canvas) {
                // 【重要】默认转化的格式为png,也可设置为其他格式
                var imgType = 'image/jpeg';
                $scope.previewImgData = canvas.toDataURL();
                // var triggerDownload = $("<a>").attr("href", url).attr("download", "主题" + new Date().getTime() + ".png").appendTo("body");
                // triggerDownload[0].click();
                // triggerDownload.remove();
            }
        });

        $scope.showSavePanel = true;

        $timeout(function () {
            $('.save-panel').show();
        }, 500);
    };

    // 关闭保存弹窗
    $scope.closeSavePanel = function () {
        $scope.showSavePanel = false;
    };

    $scope.waitDrawPic = function () {
        var now = new Date();
        var exitTime = now.getTime() + 5000;
        while (true) {
            if ($scope.previewImgData.length > 0)
                break;
            now = new Date();
            if (now.getTime() > exitTime)
                console.log('预览图生成失败!')
            break;
        }
    }

    // 保存场景设计
    $scope.save = function (previewImgData) {
        // 删除页面上已有的过滤器使用记录， 删除图表从后台抓取的临时数据
        $('#saveScenesBtn').attr("disabled", true);
        var items = [];
        $scope.configitems.forEach(function (item) {
            var itemType = item.data.dropType ? item.data.dropType : item.data.datatype;
            if (itemType == 'chart') {
                var tempObj = copyChartItem(item);
                items.push(tempObj);
                // 清除过滤条件
            } else if (itemType == 'select' || itemType == 'date' ||
                itemType == 'text') {
                var tempObj = copyFilterItem(item);
                items.push(tempObj);
            } else if (itemType == 'table') {
                if (item.data.itemConfigs && item.data.itemConfigs.customUrl && item.data.itemConfigs.customUrl.length > 0) {
                    item['data']['jsonconfig']['data']['url'] = item.data.itemConfigs.customUrl;
                } else {
                    item['data']['jsonconfig']['data']['url'] = item.data.originUrl;
                }
                items.push(item);
            } else {
                items.push(item);
            }
        });
        if (!$scope.previewImgData) {
            $scope.waitDrawPic();
        }
        $scope.sceneObj['items'] = items;
        $http({
            method: 'post',
            url: "/api/dash/saveSceneConfig",
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                'sceneObj': $scope.sceneObj,
                'previewImgData': $scope.previewImgData
            }
        }).then(function (rs) {
            $('#saveScenesBtn').attr("disabled", false);
            if (rs.data.status == 'success') {
                var r = confirm("保存成功！是否返回列表页 返回请按确定，继续编辑请按取消")
                if (r) {
                    window.location = '/dashboard/newSceneList';
                } else {
                    if ($scope.sceneObj['id'] == '') {
                        window.location = '/dashboard/newboarddesign?scenesId=' + rs.data.sceneObj.id;
                    } else {
                        $scope.showSavePanel = false;
                    }
                }
            }
        }).catch(function (rs) {
            alert('服务器错误，请联系管理员!');
            $('#saveScenesBtn').attr("disabled", false);
        });

    };

    // endregion 场景保存 end

    // region 获取用户上传的图片
    $scope.imgs = [];
    $scope.getUserImgs = function () {
        $http.get('/api/dash/getUserImgs').then(function (rs) {
            if (rs.data.status == 'success') {
                $scope.imgs = [];
                rs.data.imgs.forEach(function (value) {
                    if (value.substr(0, 1) == '.') {
                        value = value.substr(1, value.length - 1);
                    }
                    value = value.replace(/\\/g, "/")
                    $scope.imgs.push(value);
                });
            }
        });
    };
    $scope.getUserImgs();
    // endregion
    // region 获取用户上传的组件背景图片
    $scope.charsimgs = [];
    $scope.getUserChartsImgs = function () {
        $http.get('/api/dash/getUserChartsImgs').then(function (rs) {
            if (rs.data.status == 'success') {
                $scope.charsimgs = [];
                rs.data.imgs.forEach(function (value) {
                    if (value.substr(0, 1) == '.') {
                        value = value.substr(1, value.length - 1);
                    }
                    value = value.replace(/\\/g, "/")
                    $scope.charsimgs.push(value);
                });
            }
        });
    };
    $scope.getUserChartsImgs();

    // region 刷新样式
    // 刷新场景布局区域的高度
    $scope.fixContentWidth = function () {
        if (terminalType != 'phone' && '5' == '6') {
            $timeout(function () {
                $rootScope.fixContentStyle()
            }, 500);
        }
    };

    // 调整浏览器宽度时更新组件默认宽度
    $scope.$watch(function () {
        return $window.innerWidth;
    }, function (newval) {
        $scope.gridsterOpts.colWidth = ((newval) / 96).toFixed(2);
    });
    // endregion

    // region 联动/跳转设置
    $scope.openLinkagePanel = function (_itemconfig) {
        var echartconfig = JSON.parse(_itemconfig.data.echartconfig);
        var chartOlapInfo = JSON.parse(_itemconfig.data.datasetstring);
        $scope.tempItemObjIndex = findItemById(_itemconfig.data.id, $scope.configitems);

        $scope.linkageChartFields = [];
        if (echartconfig.data.type == 'bmap') {
            $scope.linkageChartFields.push(echartconfig.area.x)
        } else {
            if (Array.isArray(echartconfig.field.x)) {
                $scope.linkageChartFields = echartconfig.field.x;
            } else {
                $scope.linkageChartFields.push(echartconfig.field.x)
            }
        }
        if (!$scope.linkageChartFields[0]) {
            alert('当前组件不支持联动配置！')
            return
        }

        if (_itemconfig.data.events && (Object.keys(_itemconfig.data.events)).length > 0) {
            $scope.currentLinkageObj = angular.copy(_itemconfig.data.events);
        } else {
            $scope.currentLinkageObj = {
                'type': 'relation',
                'isComponentArg': true,
                'isCustomArg': true,
                'redirectUrl': '',
                'componentUrlArg': $scope.linkageChartFields[0].field,
                'relationField': $scope.linkageChartFields[0].field
            };
        }
        if ($scope.olapIds.length > 0) {
            $http({
                method: 'post',
                url: "/api/dash/getOlapTableCols",
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    olapIds: $scope.olapIds
                }
            }).then(function (rs) {
                if (rs.data.status == 'success') {
                    $scope.olaps = [];
                    $scope.configitems.forEach(function (__val, __i, __arr) {
                        var __type = __val.data.dropType ? __val.data.dropType : __val.data.datatype;
                        // 遍历除了自身之外的所有图表,table组件
                        if (',chart,table'.indexOf(__type) > 0 && __val.data.id != _itemconfig.data.id) {
                            var __obj = spliceChartsOlapInfo(__type, __val, rs.data.olaps, rs.data.colsObjs, $scope.currentLinkageObj);
                            $scope.olaps.push(__obj);
                        }
                        // 编辑时载入历史数据
                        if ($scope.currentLinkageObj.type == 'relation' && isNotNull($scope.currentLinkageObj.relationInfo)) {
                            $scope.currentLinkageObj.relationInfo.forEach(function (__val) {
                                for (var i = 0; i < $scope.olaps.length; i++) {
                                    if ($scope.olaps[i].chart.id == __val.chart) {
                                        $scope.olaps[i].chart.check = true;
                                        $scope.olaps[i].olap.col.selected = __val.olapCol;
                                        break;
                                    }
                                }
                            });
                        }
                    });
                } else {
                    alert('获取olap字段失败!');
                }
            });
        } else {
            alert('请先放入组件!');
        }
        $('.linkage-config').css('top', '10%');
    };

    $scope.changeScene = function () {
        $scope.currentLinkageObj.linkUrl = '/bi/index/scene/' + $scope.currentLinkageObj.redirectUrl[0];
    };

    $scope.linkageChartChange = function (item) {
        if (!item.chart.check) {
            item.olap.col.selected = '';
        } else {
            if (isNotNull($scope.currentLinkageObj.relationField)) {
                for (var i = 0; i < item.olap.col.cols.length; i++) {
                    if ($scope.currentLinkageObj.relationField == item.olap.col.cols[i].title) {
                        item.olap.col.selected = item.olap.col.cols[i].column;
                        break;
                    }
                }
            }
        }

    };

    $scope.closeLinkagePanel = function (saveType) {
        if (saveType == 'save') {
            var __close = false;
            // 保存时的必填验证
            if ($scope.currentLinkageObj.type == 'relation') {
                $scope.currentLinkageObj['relationInfo'] = [];
                $scope.olaps.forEach(function (__val) {
                    if (__val.chart.check && (__val.olap.col.selected).length > 0) {
                        $scope.currentLinkageObj.relationInfo.push({
                            'chart': __val.chart.id,
                            'olapCol': __val.olap.col.selected
                        });
                        __close = true;
                    }
                });
            } else if ($scope.currentLinkageObj.type == 'redirect') {
                __close = true;
            }
            if (__close) {
                $scope.configitems[$scope.tempItemObjIndex].data.events = angular.copy($scope.currentLinkageObj);
                $scope.configitems[$scope.tempItemObjIndex].data.refreshCount += 1;
                $('.linkage-config').css('top', '-700px');
            }
        } else {
            $('.linkage-config').css('top', '-700px');
        }
    };

    // endregion

    $scope.returnDashList = function () {
        window.location = 'newSceneList';
    };

    // 确保在此方法只在新增界面和编辑(查看)界面的数据读取完成之后才会执行
    $scope.stopMultipleLoad = function () {
        if (($scope.sceneObj['id'].length > 1 && $scope.reloadingDashboard == 'complete') ||
            $scope.sceneObj['id'].length == 0) {
            return true;
        } else {
            return false;
        }
    };

    $scope.closefullScreenContent = function () {
        echarts.getInstanceByDom(document.getElementById('fullShowChart')).dispose();
        $('.full-screen-content').hide();
    }

    $scope.mbMenu = false;
    $scope.footerType = 'menu';
    $scope.showMBMenu = function () {
        if ($scope.mbMenu) {
            $(".m-body").animate({
                top: "-100%"
            }, 300);
            $(".m-footer").animate({
                bottom: "-60px"
            }, 300);
            // $('.m-share').show()
            $('.m-collection').show()
            document.documentElement.style.height = ''
            document.documentElement.style.overflow = ''
            document.body.style.height = ''
            document.body.style.overflow = ''
        } else {
            $(".m-body").animate({
                top: "40px"
            }, 300);
            $(".m-footer").animate({
                bottom: "0px"
            }, 300);
            // $('.m-share').hide()
            $('.m-collection').hide()
            document.documentElement.style.height = '100%'
            document.documentElement.style.overflow = 'hidden'
            document.body.style.height = '100%'
            document.body.style.overflow = 'hidden'
        }
        $scope.mbMenu = !$scope.mbMenu
    }

    $scope.switchMbBodyContent = function (btnType) {
        $scope.footerType = btnType
    }

    $scope.closeMbLitePortal = function () {
        $('.lite-mb-portal').animate({
            left: "-100%"
        }, 200, function () {
            // dataxLoding.showLoading('content-wrapper')
        })
    }

    $scope.openMbPage = function (row, type) {
        if ($scope.mbMenuType == 'full') {
            $scope.showMBMenu()
        }
        $timeout(function () {
            if (type == 'menu') {
                currentSceneId = row.sceneId
            } else if (type == 'connect') {
                currentSceneId = row.collect_id
            }
            shareUrl = addArgToUrl(shareUrl, 'scenesId', currentSceneId)
            
            $('.m-collection').css('m-collection')
            initItemConnection(currentSceneId, 'scene', 'm-collection')
            $scope.reloadingDashboard = 'doing';
            $scope.initDashboard(currentSceneId)
        })
    }

    var isdrag = true;
    var tempX, x, tempY, y;

    function dragStart(e) {
        isdrag = true;
        tempX = parseInt($("#liteMbMenu").css("left") + 0);
        tempY = parseInt($("#liteMbMenu").css("top") + 0);
        x = e.touches[0].pageX;
        y = e.touches[0].pageY;
    }

    function dragMove(e) {
        if (isdrag) {
            var curX = tempX + e.touches[0].pageX - x;
            var curY = tempY + e.touches[0].pageY - y;
            //边界判断
            curX = curX < 0 ? 0 : curX;
            curY = curY < 0 ? 0 : curY;
            curX = curX < document.documentElement.clientWidth - 80 ? curX : document.documentElement.clientWidth - 80;
            curY = curY < document.documentElement.clientHeight - 80 ? curY : document.documentElement.clientHeight - 80;
            $("#liteMbMenu").css({
                "left": curX,
                "top": curY
            });
            //禁止浏览器默认事件
            e.preventDefault();
        }
    }

    function dragEnd() {
        isdrag = false;
    }
    // region 页面加载完后的jQuery处理
    /* #region   */
    $timeout(function () {
        if (terminalType != 'pc') {

        } else {
            if (viewType == 'edit') {
                $('.linkage-config').show()
                $('.global-config').show()
                $('.scenes-item-config').show()
                $('.chart-save-panel').show()
                $('.custom-config').show()
                $('.comments-section-content').show()
                $('.style-pack-export').show()
            }
            var _pageScrollbar = new PerfectScrollbar('.content-wrapper', {
                'suppressScrollX': true
            })
        }
        if (terminalType == 'phone') {
            // function hengshuping(){  
            //     if(window.orientation==180 || window.orientation==0) {  

            //     }  
            //     if(window.orientation==90 || window.orientation==-90) {  

            //     }  
            // }  
            // window.addEventListener("onorientationchange" in window ? "orientationchange" : "resize", hengshuping, false)
            // $('.m-share').show()
            // $('.lite-mb-menu').show()
            if (isNotNull(currentSceneId)) {
                return
            }
            angular.element(document.querySelector(".lite-mb-menu")).addClass('element-show');
            if ($scope.mbMenuType == 'lite') {
                $('.lite-mb-portal').show()
                document.getElementById("liteMbMenu").addEventListener("touchstart", dragStart);
                document.getElementById("liteMbMenu").addEventListener("touchmove", dragMove);
                document.getElementById("liteMbMenu").addEventListener("touchend", dragEnd);
            }
            var url = window.location.pathname + window.location.hash;
            url = url.replace(/\#/g, "%23");
            $http.get('/api/getMenu?pathname=' + url + '&showtype=showtheme').then(function (response) {
                $scope.menuList = response.data;
                $scope.liteMenuList = []
                if ($scope.mbMenuType == 'lite') {
                    $scope.menuList.forEach(function (value) {

                        if (value.child && value.child.length > 0) {
                            value.child.forEach(function (childValue, childIndex) {
                                if (isNull(childValue.icon)) {
                                    childValue.icon = '/frontend/image/ico/dash-menu-icon-' + (childIndex % 10) + '.png'
                                }
                                if (isNotNull(childValue.options)) {
                                    var valueOptions = eval('(' + childValue.options + ')')
                                    if (isNotNull(valueOptions.desc)) {
                                        childValue.desc = valueOptions.desc
                                    }
                                }
                                if (childValue.url && childValue.url.length > 1 && childValue.mobileVersion) {
                                    $scope.liteMenuList.push(childValue)
                                }
                            })
                        }
                    })
                    // console.log('$scope.liteMenuList', $scope.liteMenuList)
                }
                // console.log('menus:', $scope.menuList);
                //遍历所有菜单，默认加载有url的第一个
                // console.log('$scope.menuList', $scope.menuList)
                if ($scope.menuList && $scope.menuList.length > 0 && $scope.mbMenuType != 'lite') {
                    for (var i in $scope.menuList) {
                        if ($scope.menuList[i].url && $scope.menuList[i].url.length > 1 && $scope.menuList[i].mobileVersion) {
                            $scope.initDashboard($scope.menuList[i].sceneId);
                            currentSceneId = $scope.menuList[i].sceneId
                            initItemConnection(currentSceneId, 'scene', 'm-collection')
                            break;
                        } else {
                            if ($scope.menuList[i].child && $scope.menuList[i].child.length > 0 && $scope.menuList[i].mobileVersion) {
                                for (var j in $scope.menuList[i].child) {
                                    if ($scope.menuList[i].child[j].url && $scope.menuList[i].child[j].url.length > 1 && $scope.menuList[i].mobileVersion) {
                                        $scope.initDashboard($scope.menuList[i].sceneId);
                                        currentSceneId = $scope.menuList[i].sceneId
                                        initItemConnection(currentSceneId, 'scene', 'm-collection')
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        //进入移动端使用模式
        if (viewType == 'show' && terminalType == 'phone') {

            var originatorEv;
            $scope.openMenu = function ($mdMenu, ev) {
                originatorEv = ev
                var menuObj = $('.lite-mb-menu-container').parent()
                if (menuObj.hasClass('md-active')) {
                    $mdMenu.close()
                } else {
                    $mdMenu.open(ev)
                }
            };
            if ($scope.mbMenuType == 'full') {
                $('.m-header').show()
                $('.m-body').show()
                $('.m-footer').show()
                var el = document.getElementById('mbExtraDiv');
                el.addEventListener("touchstart", handleStartForClose, false);
                el.addEventListener("touchend", handleEndForClose, false);
                var el2 = document.getElementById('mbHeaderDiv');
                el2.addEventListener("touchstart", handleStartForOpen, false);
                el2.addEventListener("touchend", handleEndForOpen, false);
            }

        }
        $(document).bind("click", function (e) {
            var target = $(e.target);
            if (target.closest(".drop-option").length == 0 && target.closest(".fa-item-config-btn").length == 0) {
                if (dropOptionElement) {
                    dropOptionElement.remove()
                    dropOptionElement = null
                }
            }
            if (target.closest(".table-col-resize-content").length == 0 && target.closest(".drop-option").length == 0) {
                if (tableColResizeElement) {
                    tableColResizeElement.remove()
                    tableColResizeElement = null
                }
            }
            if (target.closest(".chart-label-text").length == 0 &&
                target.closest('.chart-label').length == 0 &&
                target.closest('.comments-btn').length == 0 &&
                target.closest('.reply-texts').length == 0) {
                if (chartLabelElement) {
                    chartLabelElement.remove()
                    chartLabelElement = null
                }
            }
            if (target.closest(".reply-area").length == 0) {
                $($element).find('.reply-show-edit').show();
                $($element).find('.reply-edit-area').hide();
            }
        })
        /* #endregion */
    });

    var startY, startX, endY, endX

    function handleStartForClose(e) {
        startY = e.touches[0].pageY;
        startX = e.touches[0].pageX;
    }

    function handleEndForClose(e) {
        endY = e.changedTouches[0].pageY;
        endX = e.changedTouches[0].pageX;
        if (startY - endY > 100 && endY > 50 && startY > 50) {
            $scope.showMBMenu()
        }
        var _halfScreenWidth = ($window.innerWidth / 2).toFixed(2);
        var _menuType = ''
        //右滑
        if ((endX - startX) > 100) {
            _menuType = switchMbDashboardMenu($scope.footerType, 'right')
        }
        //左滑
        if ((startX - endX) > 100) {
            _menuType = switchMbDashboardMenu($scope.footerType, 'left')
        }
        if (_menuType.length > 1) {
            $scope.footerType = _menuType
            $scope.$apply()
        }
    }

    function switchMbDashboardMenu(status, direction) {
        var returnMess = ''
        if (status == 'menu') {
            returnMess = direction == 'left' ? 'collection' : 'setting'
        } else if (status == 'collection') {
            returnMess = direction == 'left' ? 'message' : 'menu'
        } else if (status == 'message') {
            returnMess = direction == 'left' ? 'setting' : 'collection'
        } else if (status == 'setting') {
            returnMess = direction == 'left' ? 'menu' : 'message'
        }
        return returnMess
    }

    var startY2, endY2

    function handleStartForOpen(e) {
        startY2 = e.touches[0].pageY;
    }

    function handleEndForOpen(e) {
        endY2 = e.changedTouches[0].pageY;
        if (endY2 - startY2 > 100 && startY2 <= 40 && !$scope.mbMenu) {
            $scope.showMBMenu()
        }
    }
    // endregion

    // region 场景导出
    $scope.downTheme = function (fileType) {
        var themeObj = document.getElementById("mainDashboardController");
        var _tempWidth = themeObj.scrollWidth
        var _tempHeight = themeObj.scrollHeight
        var _cId = '#mainDashboardController'
        html2canvas($('' + _cId), {
            width: _tempWidth, //获取dom 宽度
            height: _tempHeight, //获取dom 高度
            onrendered: function (canvas) {
                // 【重要】默认转化的格式为png,也可设置为其他格式
                var imgType = 'image/jpeg';
                var url = canvas.toDataURL();
                var modalClass;
                if (terminalType == 'phone') {
                    modalClass = 'share-window-m'
                } else {
                    modalClass = 'share-window'
                }
                if (fileType == 'share') {
                    var modalInstance = $uibModal.open({
                        animation: true,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        templateUrl: '/bi/share',
                        controller: 'shareController',
                        controllerAs: '$ctrl',
                        size: 'lg',
                        openedClass: modalClass,
                        resolve: {
                            imgUrl: function () {
                                return url;
                            }
                        }
                    });
                    modalInstance.result.then(function () {

                    }, function () {});
                } else if (fileType) {
                    $http({
                        method: 'POST',
                        url: '/api/dash/exportTheme',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        data: {
                            picUrl: url,
                            picWidth: themeObj.scrollWidth,
                            picHeight: themeObj.scrollHeight,
                            backgroundColor: 'noNeed',
                            fileType: fileType
                        }
                    }).then(function (rs) {
                        var filePath = rs.data.filePath.substr(1);
                        var fileName = rs.data.fileName;
                        if ($scope.sceneObj['name'] && $scope.sceneObj['name'].length > 0) {
                            fileName = $scope.sceneObj['name'] + '---' + fileName
                        }
                        var triggerDownload = $("<a>").attr("href", filePath).attr("download", fileName).appendTo("body");
                        triggerDownload[0].click();
                        triggerDownload.remove();
                    });
                }
            }
        });
    };

    $rootScope.fixContentStyle = function (newClientSize) {
        //获取网页客户区的宽高
        var cWidth = 0
        var cHeight = 0
        if (document.compatMode == "BackCompat") {
            cWidth = document.body.clientWidth;
            cHeight = document.body.clientHeight;
            sWidth = document.body.scrollWidth;
            sHeight = document.body.scrollHeight;
            sLeft = document.body.scrollLeft;
            sTop = document.body.scrollTop;
        } else { //document.compatMode == \"CSS1Compat\"
            cWidth = document.documentElement.clientWidth;
            cHeight = document.documentElement.clientHeight;
            sWidth = document.documentElement.scrollWidth;
            sHeight = document.documentElement.scrollHeight;
            sLeft = document.documentElement.scrollLeft == 0 ? document.body.scrollLeft : document.documentElement.scrollLeft;
            sTop = document.documentElement.scrollTop == 0 ? document.body.scrollTop : document.documentElement.scrollTop;
        }
        $('.content-wrapper').css('height', cHeight + 'px')
        $('.content-wrapper').css('width', cWidth + 'px')
        // $scope.containerStyle = function () {
        //     return {
        //         'height': cHeight + 'px',
        //         'width': cWidth + 'px'
        //     }
        // }
        if (terminalType == 'phone') {
            $('#scenesLayout').css('height', 'auto !important')
            $scope.style = function () {
                return {
                    'height': 'auto !important'
                };
            };
        } else {
            if (!newClientSize) {
                newClientSize = {
                    // 'h': angular.element($window).innerHeight(), 
                    // 'w': angular.element($window).innerWidth() 
                    'h': cHeight,
                    'w': cWidth
                }
            }
            var scenesLayoutHeight = document.getElementById('scenesLayout').scrollHeight
            // 编辑页面工具栏
            if (viewType == 'edit') {
                scenesLayoutHeight = scenesLayoutHeight + 40
            }
            if (scenesLayoutHeight >= newClientSize.h) {
                $scope.style = function () {
                    return {
                        'height': scenesLayoutHeight + 'px'
                    };
                };
            } else {
                $scope.style = function () {
                    return {
                        'height': newClientSize.h + 'px'
                    };
                };
            }
        }

    }

});

app.config(function ($mdDateLocaleProvider) {
    $mdDateLocaleProvider.formatDate = function (date) {
        return date ? dateFtt('yyyy-MM-dd', date) : '';
    }
})

app.filter('componentName', function () {
    return function (item) {
        if (item.data.name) {
            return item.data.name
        } else if (item.data.filterName) {
            return item.data.filterName
        } else {
            return undefinedComponent
        }
    }
})

app.filter('nullToStr', function () {
    return function (item) {
        if (isNull(item)) {
            return ' '
        } else {
            return item
        }
    }
})

app.filter('calcTime', function () { //可以注入依赖
    return function (text) {
        // 两个时间相差秒数
        var diffVal = (new Date().getTime() - new Date(text).getTime()) / 1000;
        if (diffVal <= 60 * 10) {
            return '刚刚'
        } else if (diffVal > 60 * 10 && diffVal <= 60 * 30) {
            return '十分钟前'
        } else if (diffVal > 60 * 30 && diffVal <= 60 * 60) {
            return '半小时前'
        } else if (diffVal > 60 * 60 && diffVal <= 60 * 60 * 5) {
            return '一小时前'
        } else if (diffVal > 60 * 60 * 5 && diffVal <= 60 * 60 * 10) {
            return '五小时前'
        } else if (diffVal > 60 * 60 * 10 && diffVal <= 60 * 60 * 24) {
            return '十小时前'
        } else if (diffVal > 60 * 60 * 24 && diffVal <= 60 * 60 * 24 * 7) {
            return '一天前'
        } else if (diffVal > 60 * 60 * 24 * 7 && diffVal <= 60 * 60 * 24 * 14) {
            return '一周前'
        } else {
            return dateFtt('yyyy-MM-dd', new Date(text))
        }
    }
});

app.directive('resize', function ($window, $rootScope) {
    return function (scope) {
        var w = angular.element($window);

        scope.getWindowDimensions = function () {
            return {
                'h': w.innerHeight(),
                'w': w.innerWidth()
            };
        };

        scope.$watch(scope.getWindowDimensions, function (newValue) {
            $rootScope.scenesContentWidth = newValue.w;
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            $rootScope.fixContentStyle(newValue)
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});

// region 新增、编辑组件 控制器

app.controller('ModalInstancechart', function ($scope, $timeout, $uibModalInstance, itemC, chartId) {
    if (chartId.length > 1) {
        $scope.chartConfigUrl = '/dashboard/chartdesign?ismodal=t&id=' + chartId;
    } else {
        $scope.chartConfigUrl = '/dashboard/chartdesign?ismodal=t';
    }
    $scope.ok = function () {
        //手动刷新获取最新配置
        document.getElementById("configiframe").contentWindow.document.getElementById("refreshbutton").click();
        var configjson = JSON.parse(document.getElementById("configiframe").contentWindow.document.getElementById("ecconfigjson").value);
        $uibModalInstance.close(configjson);
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

//endregion


app.controller('shareController', function ($scope, $http, $uibModalInstance, $timeout, imgUrl) {
    $scope.terminalType = terminalType
    $scope.userlist = [];
    $scope.ccUserlist = [];
    $scope.users = []
    $scope.themePic = imgUrl;
    $timeout(function () {
        initPicShare(terminalType)
        if (terminalType == 'phone') {
            //$('.wechart-btn').show()
        }
    }, 500);

    $http.get('/api/getAllUser/').then(function (data) {
        data.data.users.forEach(function (_item, _arr, _index) {
            _item['checked'] = false
            $scope.userlist.push(_item)
        });
        $scope.ccUserlist = angular.copy($scope.userlist)
    });

    $scope.selectAllUser = false;
    $scope.selectAllCCUser = false;
    $scope.selectAll = function (_type) {
        if (_type == 'recipient') {
            $scope.userlist.forEach(function (value) {
                if ($scope.selectAllUser) {
                    value['checked'] = true
                } else {
                    value['checked'] = false
                }
            })
        } else if (_type == 'cc') {
            $scope.ccUserlist.forEach(function (value) {
                if ($scope.selectAllCCUser) {
                    value['checked'] = true
                } else {
                    value['checked'] = false
                }
            })
        }
    }

    $scope.sendCharts = function () {
        $scope.tempUserArr = $scope.userlist.filter(function (value) {
            if (value.checked) {
                return true
            }
        });
        $scope.tempCCUserArr = $scope.ccUserlist.filter(function (value) {
            if (value.checked) {
                return true
            }
        });;
        console.log('收件人', $scope.tempUserArr)
        console.log('抄送人', $scope.tempCCUserArr)
        if ($scope.tempUserArr.length > 0) {
            var shareCanvas = document.getElementById('shareCanvas');
            html2canvas($('#shareCanvas'), {
                width: shareCanvas.scrollWidth, //获取dom 宽度
                height: shareCanvas.scrollHeight, //获取dom 高度
                onrendered: function (canvas) {
                    var picUrl = canvas.toDataURL();
                    $http({
                        method: 'POST',
                        url: '/api/dash/shareTheme',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken')
                        },
                        data: {
                            shareType: 'email',
                            picUrl: picUrl,
                            picWidth: shareCanvas.scrollWidth,
                            picHeight: shareCanvas.scrollHeight,
                            users: $scope.tempUserArr
                        }
                    }).then(function (rs) {
                        if (rs.data.status == 'y') {
                            socket = new WebSocket("ws://" + window.location.host + "/chat/");
                            socket.onmessage = function (e) {
                                alert(e.data);
                            }
                            socket.onopen = function () {
                                socket.send("发送成功");
                            }
                            if (socket.readyState == WebSocket.OPEN) socket.onopen();
                        } else {
                            socket = new WebSocket("ws://" + window.location.host + "/chat/");
                            socket.onmessage = function (e) {
                                alert(e.data);
                            }
                            socket.onopen = function () {
                                socket.send("仅内部服务器成功");
                            }
                        }
                    });
                }
            })
        }
    };

    $scope.sendMailPanel = function () {
        if ($('.user-select-content').hasClass('panel-show')) {
            $('.user-select-content').removeClass('panel-show')
        } else {
            $('.user-select-content').addClass('panel-show')
        }
    }

    $(document).bind("click", function (e) {
        var target = $(e.target);
        if (target.closest(".select-person-btn").length == 0 && target.closest(".user-select-content").length == 0) {
            $('.user-select-content').removeClass('panel-show')
        }
    })

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});