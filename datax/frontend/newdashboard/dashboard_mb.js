let departmentname = ''
let parentDepartmentname = ''
let username = ''
if (dd) {
    dd.ready(function() {
        if (dd.version) {
            // dd.ready参数为回调函数，在环境准备就绪时触发，jsapi的调用需要保证在该回调函数触发后调用，否则无效。
            dd.runtime.permission.requestAuthCode({
                corpId: "ding94b96bee194dda1335c2f4657eb6378f",
                // corpId: "ding355eccb63f7d306835c2f4657eb6378f",
                onSuccess: function(result) {
                    $.ajax({
                        url:'/cost/getdinguserinfo?code='+result.code,
                        type: 'GET',
                        async:false,
                        success:function(result){
                            departmentname = result[0].departmentname
                            parentDepartmentname = result[0].parentDepartmentname
                            username = result[0].username

                        }
                    })
                    
                    dd.device.base.getPhoneInfo({
                        onSuccess : function(data) {
                            /*
                            {
                                screenWidth: 1080, // 手机屏幕宽度
                                screenHeight: 1920, // 手机屏幕高度
                                brand:'Mi'， // 手机品牌
                                model:'Note4', // 手机型号
                                version:'7.0'. // 版本
                                netInfo:'wifi' , // 网络类型 wifi／4g／3g 
                                operatorType :'xx' // 运营商信息
                            }
                            */
                        },
                        onFail : function(err) {}
                    });
                    if (dd.ios) {
                        dd.biz.navigation.setLeft({
                            control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                            text: '返回',//控制显示文本，空字符串表示显示默认文本
                            onSuccess : function(result) {
                                if (mbMenuType == 'lite') {
                                    $('.lite-mb-portal').animate({
                                        left: "0"
                                    }, 200, function () { })
                                }                 
                            },
                            onFail : function(err) {}
                        });
                    }
                    if (dd.android) {
                        document.addEventListener('backbutton', function(e) {
                            e.preventDefault();
                            if (mbMenuType == 'lite') {
                                $('.lite-mb-portal').animate({
                                    left: "0"
                                }, 200, function () { })
                            }
                        }, false);                        
                    }
                    dd.biz.navigation.setRight({
                        show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                        control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                        text: '分享',//控制显示文本，空字符串表示显示默认文本
                        onSuccess : function(result) {
                            dd.biz.util.share({
                                type: 0,//分享类型，0:全部组件 默认；1:只能分享到钉钉；2:不能分享，只有刷新按钮
                                url: shareUrl,
                                title: shareName,
                                onSuccess : function() {
                                    //onSuccess将在调起分享组件成功之后回调
                                    /**/
                                },
                                onFail : function(err) {}
                            })
                        },
                        onFail : function(err) {}
                    });
                },
                onFail : function(err) {}
        
            });            
        }
        
    });

}

var dropOptionElement;
var chartLabelElement;
var tableColResizeElement;
var btGroupStatus = true;
// 获取url中的所有参数 (包括scenesId)
var urlParameters = getAllUrlParameter();

//当前登录用户信息
// var currentUserInfo = getUserInfo();
var dataXLoginUserInfo = {};

axios({
    method: 'get',
    url: '/api/account/userInfo'
}).then(function(rs) {
    dataXLoginUserInfo = rs.data.userInfo;
})

if (viewType == 'show') {
    if (terminalType == 'phone' && mbMenuType == 'full') {
        getByEle(document.querySelector('#scenesLayout')).css('margin-top', '40px');
    } else {
        getByEle(document.querySelector('#scenesLayout')).css('margin-top', '0px');
    }
}
document.getElementById("mbDashBoardApp").setAttribute("ng-app","dashboardApp");
document.getElementById("mbDashBoardApp").setAttribute("ng-controller","dashboardController");

var app = angular.module('dashboardApp', ['gridster', 'dashboard', 'ngAnimate', 'ngMaterial', 'ngMessages', 'dataxUtils', 'dataxUI', 'dashboardInterface']);

app.controller('dashboardController', function ($scope, $element, $timeout, $rootScope, $window, $compile, $http, $sce, dxHttp, dom, $mdDialog, afterComponentDataLoad) {
    $rootScope.scenesContentWidth = $window.innerWidth;
    $scope.mbMenuType = mbMenuType
    $scope.param = {};
    $scope.data = {}; // 参数
    $scope.data.param = $scope.param;
    $scope.linkStatus = false;
    $scope.deviceType = terminalType;
    $scope.rowHeight = 50
    $scope.mbLiteTheme = {
        'code': 'glass','name': '毛玻璃',
        'bg': {'backgroundImage': 'url("/frontend/image/homepage/glass.bg.jpg")','backgroundSize': 'cover','backgroundRepeat': 'no-repeat','color': 'rgba(255, 255, 255, 1)'},
        'banner': {'backgroundColor': 'rgba(0, 0, 0, 0.4)','height': '50px','text': {'color': 'rgba(255, 255, 255, 0.8)','fontSize': '18px','lineHeight': '50px','textAlign': 'center','fontWeight': 'bold','letterSpacing': '7px',},'searchBox': {'theme': 'glass','border': '1px solid rgba(222, 222, 222, 0.3)','borderRadius': '4px','background': 'rgba(255, 255, 255 ,0)','color': 'rgba(255, 255, 255, 0.3)'},'icon': {'color': 'rgba(255, 255, 255, 0.3)'}},
        'menu': {'collapse': {'backgroundColor': 'rgba(0, 0, 0, 0.3)','color': 'rgba(255, 255, 255, 1)','fontSize': '12px'},'expand': {'backgroundColor': 'rgba(30, 44, 61, 1)','color': 'rgba(255, 255, 255, 1)','hover': 'glass','fontSize': '14px','textAlign': 'left','title': {'backgroundColor': 'rgba(16, 32, 49, 1)','fontSize': '12px'}}},
        'quickAccess': {'backgroundColor': 'rgba(0, 0, 0, 0.3)','title': {'backgroundColor': 'rgba(0, 0, 0, 0.2)','fontSize': '16px','color': 'rgba(254, 254, 255, 1)'},'content': {'backgroundColor': 'rgba(0, 0, 0, 0)','color': 'rgba(255, 255, 255, 1)','fontSize': '14px'}},
        'list': {'backgroundColor': 'rgba(0, 0, 0, 0.2)','title': {'backgroundColor': 'rgba(0, 0, 0, 0.2)','fontSize': '16px','color': 'rgba(254, 254, 255, 1)','more': {'fontSize': '14px','color': 'rgba(255, 255, 255, 0.5)'}},'item': {'borderBottom': '1px solid rgba(232, 232, 232, 0.16)','title': {'fontSize': '14px','color': 'rgba(254, 254, 255, 1)'},'text': {'fontSize': '14px','color': 'rgba(255, 255, 255, 0.6)',}}},
        'expansion': {'theme': 'glass','backgroundColor': 'rgba(0, 0, 0, 0.3)'}
    }
    // 编辑界面or展示界面
    $scope.viewType = viewType;
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
            'commentsStyle': {'total':{'backgroundColor':'rgba(255, 255, 255, 1)'},'commentsSection':{'borderBottomColor':'rgba(210, 210, 210, 1)'},'name':{'color':'rgba(210, 179, 44, 1)'},'time':{'color':'rgba(153, 153, 153, 1)'},'text':{'color':'rgba(0, 0, 0, 1)','backgroundColor':'rgba(255, 255, 255, 1)','borderBottomColor':'rgba(210, 210, 210, 1)'},'editBtn':{'color':'rgba(210, 179, 44, 1)'},'replayBtn':{'color':'rgba(210, 179, 44, 1)'},'link':{'color':'rgba(67, 161, 248, 1)'},'more':{'color':'rgba(153, 153, 153, 1)','borderBottomColor':'rgba(210, 210, 210, 1)','height':'25px','cursor':'pointer'}}
        }
    };
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
        getByClass('mb-loding').remove()
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
            if (rs.data.status == 'success') {
                $scope.reloadingDashboard = 'doing';
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

    // region 过滤器配置
    /* #region   */

    $scope.filterObj = {};
    $scope.showFilterPanel = false;

    $scope.getFilterDatas = function (currentIndex) {
        var getFilterDatasUrl = "/api/dash/getFilterDatas"
        a = 0
        if ($scope.configitems[currentIndex].data.customCode &&
            $scope.configitems[currentIndex].data.customCode.customFilterData && 
            $scope.configitems[currentIndex].data.customCode.customFilterUrl && 
            $scope.configitems[currentIndex].data.customCode.customFilterUrl.length > 1) {
                getFilterDatasUrl = $scope.configitems[currentIndex].data.customCode.customFilterUrl
                a = 1
            }
        if (a==0){
            getFilterDatasUrl = "/api/dash/getFilterDatas?parentDepartmentname="+parentDepartmentname+"&departmentname="+departmentname+"&username="+username
        }
        try {
            dxHttp.postData(getFilterDatasUrl, {
                olapCols: $scope.configitems[currentIndex].data.configs.olapCols
            }, $mdDialog).then(function (rs) {
                if (rs.data.status == 'success') {
                    $scope.configitems[currentIndex]['data']['filterDatas'] = rs.data.data
                }
            })
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


    //region 场景布局插件相关配置
    $scope.configitems = [];
    $scope.contentWidth = $window.innerWidth - 56
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
    $scope.tmpcmp = false;

    //endregion

    //region 单个组件样式配置

    $scope.scenesItemStyle = {};

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

    $scope.selectedConfigScene = '';
    //根据选择的ConfigScene，赋值给$scope.sceneObj对应的属性,这里需要注意返回对象的某些属性是json字符串，需要转为对象才能使用

    $scope.isUseBgImg = function () {
        if (!$scope.useBgImg) {
            $scope.sceneObj.options.globalStyle['backgroundImage'] = '';
        } else {
            $scope.sceneObj.options.globalStyle['backgroundSize'] = 'cover';
            $scope.sceneObj.options.globalStyle['backgroundRepeat'] = 'no-repeat';
        }
    };
    $scope.isUseChartsBgImg = function () {
        if (!$scope.useChartsBgImg) {
            $scope.sceneObj.options.chartStyle['backgroundImage'] = '';
        } else {
            $scope.sceneObj.options.chartStyle['backgroundSize'] = 'cover';
            $scope.sceneObj.options.chartStyle['backgroundRepeat'] = 'no-repeat';
        }
    };
    $scope.currCharsBgPicChange = function () {
        if (!$scope.useChartsBgImg) {
            $scope.scenesItemStyle['backgroundImage'] = '';
        } else {
            $scope.scenesItemStyle['backgroundSize'] = 'cover';
            $scope.scenesItemStyle['backgroundRepeat'] = 'no-repeat';
        }
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
                item['data']['jsonconfig']['data']['url'] = item.data.originUrl;
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
        var backdrop = document.querySelector('.datax-overlay-backdrop')
        if (backdrop) {
            backdrop.click()
        }
        $timeout(function () {
            if (type == 'menu') {
                currentSceneId = row.sceneId
            } else if (type == 'connect') {
                currentSceneId = row.collect_id
            }
            shareUrl = addArgToUrl(shareUrl, 'scenesId', currentSceneId)
            // getByClass('m-collection').css('m-collection')
            $('.m-collection').css('m-collection')
            initItemConnection(currentSceneId, 'scene', 'm-collection')
            $scope.reloadingDashboard = 'doing';
            $scope.initDashboard(currentSceneId)
        })
    }

    $scope.generateLiteMbMenu = function () {
        var liteMenuHtml = '<div class="lite-mb-container" \
                style="top: 55px; left: 8px; transform-origin: left top; z-index: 100001;">\
                <ul class="lite-mb-content" role="menu">\
                    <li class="lite-mb-menu-item" role="menuitem" ng-repeat="liteMenu in liteMenuList">\
                        <span ng-click="openMbPage(liteMenu, \'menu\')">{{ liteMenu.name }}</span>\
                    </li>\
                </ul>\
            </div>'
        var liteMenuEle = $compile(angular.element(liteMenuHtml))($scope)
        dom.openOverlayBackdrop({}, [liteMenuEle])
        angular.element(document.body).append(liteMenuEle) 
        
        $timeout(function () {
            getByClass('lite-mb-content').addClass('lite-mb-content-size')
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
        if (terminalType == 'phone') {
            if (isNotNull(currentSceneId)) {
                return
            }
            angular.element(document.querySelector(".lite-mb-menu")).addClass('element-show');
            if ($scope.mbMenuType == 'lite') {
                document.getElementsByClassName("lite-mb-portal")[0].classList.add("element-show")
                document.getElementById("liteMbMenu").addEventListener("touchstart", dragStart);
                document.getElementById("liteMbMenu").addEventListener("touchmove", dragMove);
                document.getElementById("liteMbMenu").addEventListener("touchend", dragEnd);
            }
            var url = window.location.pathname + window.location.hash;
            url = url.replace(/\#/g, "%23");
            $http.get('/api/getMenu?pathname=' + url + '&showtype=showtheme').then(function (response) {
                $scope.menuList = response.data;
                getByClass('mb-loding').remove()
                $scope.liteMenuList = []
                if ($scope.mbMenuType == 'lite') {
                    $scope.menuList.forEach(function (value) {

                        if (value.child && value.child.length > 0) {
                            value.child.forEach(function (childValue, childIndex) {
                                childValue.iconClass = 'menu-item-icon-' + (childIndex % 10)
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
                $scope.generateLiteMbMenu()
                // originatorEv = ev
                // var menuObj = $('.lite-mb-menu-container').parent()
                // if (menuObj.hasClass('md-active')) {
                //     $mdMenu.close()
                // } else {
                //     $mdMenu.open(ev)
                // }
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
angular.bootstrap(document.getElementById("mbDashBoardApp"), ["dashboardApp"]);