/** 测试 */
var kingwolfofsky = {
    /**
     * 获取输入光标在页面中的坐标
     * @param        {HTMLElement}   输入框元素
     * @return       {Object}        返回left和top,bottom
     */
    getInputPositon: function (elem) {
        if (document.selection) {   //IE Support
            elem.focus();
            var Sel = document.selection.createRange();
            return {
                left: Sel.boundingLeft,
                top: Sel.boundingTop,
                bottom: Sel.boundingTop + Sel.boundingHeight
            };
        } else {
            // var that = this;
            var cloneDiv = '{$clone_div}', cloneLeft = '{$cloneLeft}', cloneFocus = '{$cloneFocus}';
            var none = '<span style="white-space:pre-wrap;"> </span>';
            var div = elem[cloneDiv] || document.createElement('div'),
                focus = elem[cloneFocus] || document.createElement('span');
            var text = elem[cloneLeft] || document.createElement('span');
            // var offset = that._offset(elem),
            var index = this._getFocus(elem), focusOffset = {left: 0, top: 0};

            if (!elem[cloneDiv]) {
                elem[cloneDiv] = div, elem[cloneFocus] = focus;
                elem[cloneLeft] = text;
                div.appendChild(text);
                div.appendChild(focus);
                document.body.appendChild(div);
                focus.innerHTML = '|';
                focus.style.cssText = 'display:inline-block;width:0px;overflow:hidden;z-index:-100;word-wrap:break-word;word-break:break-all;';
                div.className = this._cloneStyle(elem);
                div.style.cssText = 'visibility:hidden;display:inline-block;position:absolute;z-index:-100;word-wrap:break-word;word-break:break-all;overflow:hidden;';
            }
            div.style.left = this._offset(elem).left + "px";
            div.style.top = this._offset(elem).top + "px";
            var strTmp = elem.value.substring(0, index).replace(/</g, '<').replace(/>/g, '>').replace(/\n/g, '<br/>').replace(/\s/g, none);
            text.innerHTML = strTmp;

            focus.style.display = 'inline-block';
            try {
                focusOffset = this._offset(focus);
            } catch (e) {
            }
            focus.style.display = 'none';
            return {
                left: focusOffset.left,
                top: focusOffset.top,
                bottom: focusOffset.bottom
            };
        }
    },

    // 克隆元素样式并返回类
    _cloneStyle: function (elem, cache) {
        if (!cache && elem['${cloneName}']) {
            return elem['${cloneName}'];
        }
        var className, name, rstyle = /^(number|string)$/;
        var rname = /^(content|outline|outlineWidth)$/; //Opera: content; IE8:outline && outlineWidth
        var cssText = [], sStyle = elem.style;

        for (name in sStyle) {
            if (!rname.test(name)) {
                val = this._getStyle(elem, name);
                if (val !== '' && rstyle.test(typeof val)) { // Firefox 4
                    name = name.replace(/([A-Z])/g, "-$1").toLowerCase();
                    cssText.push(name);
                    cssText.push(':');
                    cssText.push(val);
                    cssText.push(';');
                }
            }
        }
        cssText = cssText.join('');
        elem['${cloneName}'] = className = 'clone' + (new Date()).getTime();
        this._addHeadStyle('.' + className + '{' + cssText + '}');
        return className;
    },

    // 向页头插入样式
    _addHeadStyle: function (content) {
        var style = this._style[document];
        if (!style) {
            style = this._style[document] = document.createElement('style');
            document.getElementsByTagName('head')[0].appendChild(style);
        }
        style.styleSheet && (style.styleSheet.cssText += content) || style.appendChild(document.createTextNode(content));
    },
    _style: {},

    // 获取最终样式
    _getStyle: 'getComputedStyle' in window ? function (elem, name) {
        return getComputedStyle(elem, null)[name];
    } : function (elem, name) {
        return elem.currentStyle[name];
    },

    // 获取光标在文本框的位置
    _getFocus: function (elem) {
        var index = 0;
        if (document.selection) {// IE Support
            elem.focus();
            var Sel = document.selection.createRange();
            if (elem.nodeName === 'TEXTAREA') {//textarea
                var Sel2 = Sel.duplicate();
                Sel2.moveToElementText(elem);
                index = -1;
                while (Sel2.inRange(Sel)) {
                    Sel2.moveStart('character');
                    index++;
                }
            }
            else if (elem.nodeName === 'INPUT') {// input
                Sel.moveStart('character', -elem.value.length);
                index = Sel.text.length;
            }
        }
        else if (elem.selectionStart || elem.selectionStart == '0') { // Firefox support
            index = elem.selectionStart;
        }
        return (index);
    },

    // 获取元素在页面中位置
    _offset: function (elem) {
        var box = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body,
            docElem = doc.documentElement;
        var clientTop = docElem.clientTop || body.clientTop || 0,
            clientLeft = docElem.clientLeft || body.clientLeft || 0;
        var top = box.top + (self.pageYOffset || docElem.scrollTop) - clientTop,
            left = box.left + (self.pageXOffset || docElem.scrollLeft) - clientLeft;
        return {
            left: left,
            top: top,
            right: left + box.width,
            bottom: top + box.height
        };
    }
};


/** 测试 */

function refreshPage() {
    window.location.reload();
}

var app = angular.module('datainsert', ['ui.bootstrap', 'ngDragDrop', 'ui.router', 'ui.codemirror']);

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/list');
    $stateProvider.state('list', {
        url: '/list',
        templateUrl: '/dashboard/sourcelist',
        controller: 'listController'
    })
        .state('add', {
            url: '/add/:id',
            templateUrl: '/dashboard/dataInsert',
            controller: 'addController'

        });
});

app.controller('listController', function ($http, $scope, $uibModal) {
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function () {
        $scope.getdata($scope.currentPage);
    };
    $scope.getdata = function (page) {
        var key = $scope.searchkey;
        var url = '/api/source/getSourceList?page=' + page;
        if (key != '') {
            url = encodeURI(url + "&search=" + key);//中文转码
        }
        $http.get(url).then(function (response) {
            $scope.sourcelists = response.data.rows;
            $scope.totalItems = response.data.total;
        });
    };
    $scope.getdata(1);

    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 500);

    $scope.delete_source = function (sourceObj) {
        if (confirm('确定要删除' + sourceObj['title'] + '？这将会删除依赖此元数据的所有olap！') == true) {
            $http({
                method: 'POST',
                url: '/api/source/sourceDelete',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    source_id: sourceObj['id'],
                }
            }).success(function (rs) {
                if (rs.code == 1) {
                    $scope.getdata(1);
                }
            });
        }
    };

    $scope.rowAndColConversion = function (source_id) {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/api/source/colToRow',
            controller: 'ConversionController',
            controllerAs: '$ctrl',
            size: 'lg',
            openedClass: 'conversion-window',
            resolve: {
                sourceId: function () {
                    return source_id;
                }
            }
        });
        modalInstance.result.then(function () {

        }, function () {
        });
    };

    // $timeout(function () {//添加拖拽效果
    //     addDragToDialog();
    // });
    addDragToDialog();
});

function addDragToDialog() {
    $(".modal-content").draggable({///添加拖拽效果
        cursor: "move",
        handle: '.modal-header'
    });
}

app.controller('ConversionController', function ($scope, $q, $http, $uibModalInstance, $timeout, sourceId) {

    $scope.source = {};
    $scope.sourceDetail = [];
    $scope.conversionOptions = {};
    $scope.originTable = {};
    $scope.originTable.columns = [];
    $scope.originTable.data = [];
    $scope.originPage = 1;

    $scope.conversionTable = {};
    $scope.conversionTable.columns = [];
    $scope.conversionTable.data = [];

    $scope.dimList = [];
    $scope.columnList = [];
    $scope.dataList = [];

    $scope.sourceName = '';
    $scope.mainTable = '';
    $scope.disableSave = true;

    var url = '/api/source/getSourceColyId?id=' + sourceId
    $http.get(url).then(function (response) {
        var results = response.data;
        if (results.status == "failure") {
            alert('加载列信息失败!');
        } else {
            // 加载源表
            $scope.originOptions = results.data.options;
            $scope.sourceDetail = results.data.sourceDetail;
            $scope.assemblyTableCols($scope.sourceDetail);
            $scope.source = results.data.source;
            $scope.conversionOptions = results.data.options;
            $scope.getOriginTable(1);
            if (results.data.conversionOptions != '') {
                var rowToColConfig = results.data.conversionOptions.rowToColConfig;
                $scope.dimList = rowToColConfig.dimList;
                $scope.columnList = rowToColConfig.columnList;
                $scope.dataList = rowToColConfig.dataList;
                $scope.sourceName = rowToColConfig.originName;
                $scope.conversionStart();
            }
        }

    });

    $scope.saveData = function () {
        if ($scope.sourceName == null || $scope.sourceName.trim().length == 0) {
            alert('请输入别名');
            return;
        }
        if (!$scope.disableSave) {
            $http({
                method: 'post',
                url: "/api/source/saveConversionData",
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    dimList: $scope.dimList,
                    columnList: $scope.columnList,
                    dataList: $scope.dataList,
                    options: $scope.originOptions,
                    source: $scope.source,
                    columns: $scope.conversionTable.columns,
                    sourceName: $scope.sourceName,
                    mainTable: $scope.mainTable
                }
            }).success(function (rs) {
                // console.log(rs);
                if (rs.status == 'success') {
                    alert('保存成功');
                }
            });
        } else {
            alert('请拖入正确的数据之后在保存');
        }
    };

    //获取源数据
    $scope.getOriginTable = function (page) {
        $http({
            method: 'post',
            url: "/api/source/sourceData",
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                datajson: eval("(" + $scope.source.config + ")"),
                pk: $scope.source.databaseid,
                sourcecolumn: $scope.originTable.columns,
                limit: 10,
                offset: (page - 1) * 10,
                order: ''
            }
        }).success(function (rs) {
            // console.log(rs);
            $scope.originTable.data = rs.rows;
            $scope.originTotal = rs.total;
        });
    };

    // 拖拽回调函数
    $scope.dropCallback = function (ev, act, lists, listType) {

        var validLimit = false;
        var validDuplicate = false;
        // 转换成列头和数据的列只能有一个
        if (listType == 2 || listType == 3) {
            if (lists.length > 1) {
                alert('只能放入一个');
                lists.splice(1, 1);
                validLimit = true;
            }
        }
        if (!validLimit) {
            //验证重复
            validDuplicate = $scope.validDuplicate(lists[lists.length - 1]);
            if (validDuplicate) {
                alert('每一列只能使用一次');
                lists.splice(lists.length - 1, 1);
            }
        }

        if (!validDuplicate && !validLimit) {
            $scope.conversionStart();
        }
    };

    // 开始转换
    $scope.conversionStart = function () {
        if ($scope.dimList.length > 0 && $scope.columnList.length > 0 && $scope.dataList.length > 0) {
            console.log('开始行转列');
            $scope.conversionTable.columns = [];
            $scope.conversionTable.data = [];
            var arr = []
            $scope.dimList.forEach(function (item, index) {
                arr.push(item);
            });
            $scope.columnList.forEach(function (item, index) {
                arr.push(item);
            });
            $scope.dataList.forEach(function (item, index) {
                arr.push(item);
            });
            $http({
                method: 'post',
                url: "/api/source/conversionData",
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    datajson: eval("(" + $scope.source.config + ")"),
                    pk: $scope.source.databaseid,
                    sourcecolumn: arr,
                    dimList: $scope.dimList,
                    columnList: $scope.columnList,
                    dataList: $scope.dataList
                }
            }).success(function (rs) {
                // console.log(rs);
                if (rs.status == 'success') {
                    $scope.conversionTable.data = rs.rows;
                    $scope.conversionTable.columns = rs.cols;
                    $scope.mainTable = rs.mainTable;
                    $scope.disableSave = false;
                } else {
                    $scope.disableSave = true;
                    alert('转换失败');
                }
            });
        }
    }

    // 验证重复
    $scope.validDuplicate = function (col) {
        var dimList = $scope.dimList.filter(function (item) {
            return item.field == col.field;
        });
        var columnList = $scope.columnList.filter(function (item) {
            return item.field == col.field;
        });
        var dataList = $scope.dataList.filter(function (item) {
            return item.field == col.field;
        });
        if (dimList.length + columnList.length + dataList.length > 1) {
            return true;
        } else {
            return false;
        }
    };

    // 删除拖拽的数据
    $scope.removeItem = function (key, item, list, limit) {
        list.splice(key, 1);
        $scope.conversionStart();
    };

    // 关闭当前页面
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    // 元数据table翻页
    $scope.originPageChanged = function () {
        $scope.getOriginTable($scope.originPage);
    };

    $scope.assemblyTableCols = function (sourceDetail) {
        sourceDetail.forEach(function (item, index) {
            var obj = {};
            if (item['datadict'] && JSON.parse(item['datadict'])) {
                obj['datadict'] = JSON.parse(item['datadict']);
            } else {
                obj['datadict'] = {};
            }
            obj['distconfig'] = JSON.parse(item['distconfig']);
            obj['field'] = item['table'] + '__' + item['column'];
            obj['formatcolumn'] = item['formatcolumn'];
            obj['formula'] = item['column_formula'];
            obj['ifshow'] = item['ifshow'];
            obj['isedit'] = '0';
            obj['title'] = item['title'];
            obj['type'] = item['type'];
            $scope.originTable.columns.push(obj);
        });
    };

});


/*
*右键菜单
*/
app.directive('ngRightClick', function ($parse) {
    return function (scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function (event) {
            scope.$apply(function () {
                event.preventDefault();
                var clientX = event.clientX;
                var clientY = event.clientY - 115;
                $(".contextmenu").css({
                    top: clientY,
                    left: clientX
                });
                fn(scope, {$event: event});
            });
        });
    };
});

app.factory('HttpInterceptor', ['$q', '$rootScope', '$timeout', HttpInterceptor]);

function HttpInterceptor($q, $rootScope, $timeout) {
    return {
        request: function (config) {
            $rootScope.ajaxing = true;
            $rootScope.ajaxerror = false;
            $rootScope.ajaxdone = false;
            return config;
        },
        requestError: function (err) {
            $rootScope.ajaxing = false;
            $rootScope.ajaxerror = true;
            return $q.reject(err);
        },
        response: function (res) {
            $rootScope.ajaxing = false;
            $rootScope.ajaxdone = true;
            $timeout(function () {
                $rootScope.ajaxdone = false;
            }, 4000);
            return res;
        },
        responseError: function (err) {
            // if (-1 === err.status) {
            //   // 远程服务器无响应
            // } else if (500 === err.status) {
            //   // 处理各类自定义错误
            // } else if (501 === err.status) {
            //   // ...
            // }
            return $q.reject(err);
        }
    };
}

app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(HttpInterceptor);
}]);

/*
*主控制器
*/
app.controller('addController', ['$scope', '$rootScope', '$http', '$location', '$uibModal', '$window', '$interval', '$stateParams', '$compile', '$timeout', '$q', function ($scope, $rootScope, $http, $location, $uibModal, $window, $interval, $stateParams, $compile, $timeout) {
    /*
  *初始化参数
  */
    $rootScope.ajaxing = false;
    $rootScope.ajaxdone = false;
    $rootScope.ajaxerror = false;
    $scope.sqlerror = false;
    $scope.selectFileList = 'n';
    $scope.columndistlist = [];
    $scope.get_data = function (fn) {
        $http.get('/api/source/getSource').then(function (response) {
            $scope.sources = response.data;
            $scope.lists = [];
            $scope.datagrid.columns = [];
            $scope.datagrid.lists = [];
            $scope.selectedSource = '0';
            if (typeof fn == 'function') {
                fn();
            }
        });
    };

    $scope.editorOptions = {
        lineWrapping: true,
        lineNumbers: true,
        mode: 'text/x-mssql'
    };

    $scope.changeLenght = 0;
    $scope.changethLength = 0;
    $scope.show_menu = false;
    $scope.show_th_menu = false;
    $scope.onsearch = false;
    $scope.advance = false;
    $scope.changeHistory = {
        changlist: [],
        changethlist: []
    };
    $scope.showedit = false;
    $scope.fulltable = [];
    $scope.draged = [];
    $scope.dataJson = [];
    $scope.datagrid = {};
    $scope.config = {
        title: "",
        desc: "",
        id: "",
        datatype: '',
        conntype: '1',
    };
    $scope.editing = false;
    $scope.datagrid.columns = [];
    $scope.datagrid.lists = [];
    $scope.saving = false;
    $scope.editShow = true;
    $scope.oldConnType = '';


    if ($stateParams.id == '') {
        $scope.get_data();
    }
    else {
        showLoading();
        /*在编辑元数据状态下不允许高级模式、普通模式切换*/
        $scope.editShow = false;

        $scope.get_data(function () {
            $http.get('/api/source/getSourceDetail/' + $stateParams.id).then(function (response) {
                rs = response.data;
                // for(var i = 0;i < rs.config.length;i++) {
                //     if (rs.config[i].sql && rs.config[i].sql.indexOf('@@') > 0) {//为了解决json中有双引号才做此操作,不做此操作会报错
                //         rs.config[i].sql = rs.config[i].sql.replace(/@@/g,'"');
                //     }
                // }
                $scope.selectedSource = rs.databaseid.toString();
                $scope.dataJson = rs.config;
                $scope.customsql = rs.sql;

                $scope.getTable(function () {
                    rs.config.map(function (items) {
                        $scope.dataJson.push(items);
                        //判断如果是自定义sql的拖拽项也需要加入$scope中，页面才能初始化
                        if (items.item && /userdefinedsql\d/.test(items.item)){
                            $scope.draged.push({
                                'ifshow': '1',
                                'tablename': items.item.replace('userdefinedsql','自定义sql'),
                                'table': items.item,
                                'isedit': '0',
                                'sqlDesign': '1',
                                'sql': items.sql
                            });
                        }else{
                            for (var i = 0;i < $scope.lists.length;i++){
                                if(items.item == $scope.lists[i].table){
                                    $scope.draged.push(angular.copy($scope.lists[i]));
                                    break;
                                }
                            }
                        }
                    });
                    if (rs.custom == '1') {
                        $scope.advance = true;
                        $scope.excuce();
                        hideLoading();
                    }else {
                        $scope.getGridColumn();
                        hideLoading();
                    }

                });

                $scope.config.title = rs.title;
                $scope.config.desc = rs.desc;
                $scope.config.datatype = rs.datatype;
                $scope.config.conntype = rs.conntype;
                $scope.config.id = $stateParams.id;

                //保留原始conntype
                $scope.oldConnType = rs.conntype;
            });
        });
    }


    /*当修改时，从数据提取修改为实时需要给出提醒*/
    $scope.$watch('config.conntype', function () {
        if ($stateParams.id && $stateParams.id != '') {
            if ($scope.config.conntype && $scope.config.conntype == '0' && $scope.oldConnType == '1') {
                alert('从数据提取改为实时请谨慎操作！');
            }
        }
    });

    $interval(function () {
        var length = $scope.changeHistory.changethlist.length;
        if (length > $scope.changethLength) {
            requireChange = $scope.changeHistory.changethlist.slice($scope.changethLength);
            $http({
                method: 'POST',
                url: '/api/source/changeThView',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    data: requireChange,
                    pk: $scope.selectedSource
                }
            }).success(function (rs) {
                if (rs.code == 1) {
                    $scope.changethLength = length;
                }
            });
        }
    }, 20000);
    $interval(function () {
        var length = $scope.changeHistory.changlist.length;
        if (length > $scope.changeLenght) {
            requireChange = $scope.changeHistory.changlist.slice($scope.changeLenght);
            $http({
                method: 'POST',
                url: '/api/source/changeView',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    data: requireChange,
                    pk: $scope.selectedSource
                }
            }).success(function (rs) {
                if (rs.code == 1) {
                    $scope.changeLenght = length;
                }
            });
        }
    }, 20000);
    /*
 }
 }
 *显示隐藏 新建数据源的选择
 */
    $scope.showContent = function (e) {
        e.stopPropagation();
        $("#connect-panel").toggleClass('hide');
        $(".more-btn-group").addClass('hide');
        $scope.onsearch = false;
    };
    $scope.showMoreBtn = function (e) {
        e.stopPropagation();
        $(".more-btn-group").toggleClass('hide');
        $("#connect-panel").addClass('hide');
        $scope.onsearch = false;
    };
    //显示元数据修改的panel
    $scope.sourceDBConnPanelShow = function (e) {
        e.stopPropagation();
        $(".sourceDBConnInfo").toggleClass('hide');
        $("#connect-panel").addClass('hide');
        $scope.onsearch = false;
    };

    /*
  *开始新建数据源
  */
    $scope.startConfig = function (type, opentype) {
        if (!type || type == '') {
            console.log('startConfig fun\'s param type=', type);
            return;
        }
        var s = type;
        if (opentype === 'updateFileTable') {
            type = type.split('_')[0];
        }
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/configPage/' + type,
            controller: 'configController',
            resolve: {
                connecttype: function () {
                    return s;
                },
                id: function () {
                    return $scope.selectedSource;
                },
                opentype: function () {
                    return opentype;
                }
            }
        });
        modalInstance.result.then(function () {
            hideLoading();
            $scope.get_data();
            $("#connect-panel").addClass('hide');
        }, function () {
        });
    };
    $scope.showall = function () {
        $scope.lists = [];
        $scope.fulltable.map(function (index) {
            if (index.ifshow == '0') {
                $scope.changeHistory.changlist.push(index);
            }
            index.ifshow = '1';
            $scope.lists.push(index);
        });
    };

    $scope.saveChange = function () {
        var length = $scope.changeHistory.changlist.length;
        if (length > $scope.changeLenght) {
            requireChange = $scope.changeHistory.changlist.slice($scope.changeLenght);
            $http({
                method: 'POST',
                url: '/api/source/changeView',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    data: requireChange,
                    pk: $scope.selectedSource
                }
            }).success(function (rs) {
                if (rs.code == 1) {
                    $scope.changeLenght = length;
                }
            });
        }
    };
    $scope.advancemodel = function (boolvalue) {
        $(".more-btn-group").toggleClass('hide');
        $scope.draged = [];
        $scope.dataJson = [];
        $scope.datagrid.columns = [];
        $scope.datagrid.lists = [];
        $scope.advance = boolvalue;
    };

    $scope.toSql = function (table) {
        if ($scope.advance) {
            $scope.customsql = $scope.customsql + table.tablename;
        }
    };
    $scope.renameAll = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/renameModel',
            controller: 'renameController',
            size: 'lg',
            backdrop: false,
            resolve: {
                list: function () {
                    return $scope.fulltable;
                },
                pk: function () {
                    //对excel进行特殊处理
                    var fdStart = $scope.selectedSource.indexOf("excel");
                    if (fdStart == 0) {
                        $scope.selectedSource = $scope.selectedSource.substring(5, $scope.selectedSource.length - 1);
                    }
                    return $scope.selectedSource;
                }
            }
        });
        modalInstance.result.then(function (rs) {
            if (rs == 'save') {
                $scope.getTable();
                $scope.changeHistory.changlist = [];
            }
        });
    };

    /*
  *表的右键菜单
  */
    $scope.rightclick = function (s, key) {
        $scope.show_th_menu = false;
        $scope.contextmenu_item = s;
        $scope.contextmenu_key = key;
        $scope.show_menu = true;
    };
    /*
  *隐藏表
  */
    $scope.hide_table = function () {
        $scope.pageLists[$scope.contextmenu_key].ifshow = "0";
        $scope.changeHistory.changlist.push($scope.pageLists[$scope.contextmenu_key]);
    };
    /*
  *重命名表
  */
    $scope.rename_table = function () {
        $scope.pageLists[$scope.contextmenu_key].isedit = "1";

    };
    /*
  *查看表结构
  */
    $scope.table_structure = function () {
        var table = $scope.pageLists[$scope.contextmenu_key]['table'];
        var columns = $scope.columns.filter(function (index) {
            return index.table == table;
        });
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/tablestructure',
            controller: 'structureController',
            backdrop: false,
            resolve: {
                columns: function () {
                    return columns;
                }
            }
        });
        modalInstance.result.then(function () {

        });
    };

    $scope.splitDateCol = function () {
        var new_column = {};
        var suffix = "";
        var old_colum = $scope.contextmenu_th_item.field;
        if (/([^__]+)$/.test(old_colum)) {
            suffix = RegExp.$1;
        }
        new_column['field'] = old_colum.replace(suffix, 'column') + ($scope.datagrid.columns.length + 1);
        new_column['formatcolumn'] = $scope.contextmenu_th_item.field;
        new_column['ifshow'] = '1';
        new_column['isedit'] = '0';
        new_column['title'] = $scope.contextmenu_th_item.title + '年';
        new_column['type'] = 'float';
        new_column['formula'] = 'get_year';
        new_column['iscustom'] = '1';
        new_column['distconfig'] = [];
        new_column['datadict'] = {};
        $scope.datagrid.columns.push(new_column);
        var new_column2 = angular.copy(new_column);
        new_column2['field'] = old_colum.replace(suffix, 'column') + ($scope.datagrid.columns.length + 1);
        new_column2['title'] = $scope.contextmenu_th_item.title + '月';
        new_column2['formula'] = 'get_month';
        $scope.datagrid.columns.push(new_column2);
        var new_column3 = angular.copy(new_column);
        new_column3['field'] = old_colum.replace(suffix, 'column') + ($scope.datagrid.columns.length + 1);
        new_column3['title'] = $scope.contextmenu_th_item.title + '日';
        new_column3['formula'] = 'get_day';
        $scope.datagrid.columns.push(new_column3);
        // $scope.getGridData(1);
        $scope.getRowData();
    };

    /** 数据列表表头右键事件 */
    $scope.thrightclick = function (val, key) {
        $scope.show_menu = false;
        if ($scope.advance) {
            return false;
        }
        if ($scope.contextmenu_th_key > 0) {
            $scope.datagrid.columns[$scope.contextmenu_th_key].isedit = "0";
        }
        $scope.contextmenu_th_item = val;
        $scope.contextmenu_th_edit_item = val;
        $scope.contextmenu_th_key = key;
        $scope.show_th_menu = true;
        $scope.isDateCol = false;
        // console.log(val);
        if (val.type.indexOf('date') > -1) {
            $scope.isDateCol = true;
        }

    };

    $scope.eidtth = function (val, key) {
        $scope.show_menu = false;
        $scope.show_th_menu = false;
        if ($scope.contextmenu_th_key > 0) {
            $scope.datagrid.columns[$scope.contextmenu_th_key].isedit = "0";
        }
        if ($scope.advance) {
            return false;
        }
        $scope.contextmenu_th_item = val;
        $scope.contextmenu_th_edit_item = val;
        $scope.contextmenu_th_key = key;
        $scope.datagrid.columns[$scope.contextmenu_th_key].isedit = "1";
    };

    $scope.hide_th = function () {
        $scope.datagrid.columns[$scope.contextmenu_th_key].ifshow = "0";
        $scope.changeHistory.changethlist.push($scope.datagrid.columns[$scope.contextmenu_th_key]);
    };
    /*
  *重命名表
  */
    $scope.rename_th = function () {
        $scope.editing = true;
        $scope.datagrid.columns[$scope.contextmenu_th_key].isedit = "1";
    };
    /*
  *页面点击隐藏右键菜单
  */
    $scope.focusedit = function () {
        $scope.editing = true;
    };
    angular.element($window).bind('click', function (event) {
        if ($scope.show_menu) {
            $scope.$apply(function () {
                event.preventDefault();
                $scope.show_menu = false;
            });
        }
        if ($scope.show_th_menu) {
            $scope.$apply(function () {
                event.preventDefault();
                $scope.show_th_menu = false;
            });
        }
        if ($scope.contextmenu_th_key >= 0 && !$scope.editing) {
            $scope.$apply(function () {
                $scope.datagrid.columns[$scope.contextmenu_th_key].isedit = "0";
            });
        }
        else {
            $scope.editing = false;
        }
        $(".extendmenu").each(function () {
            if (!$(this).hasClass('hide')) {
                $(this).addClass('hide');
            }
        });
        // $timeout(function () {//添加拖拽效果
        //     addDragToDialog();
        // });
    });


    $scope.onblurname = function (key) {
        $scope.pageLists[key].isedit = "0";
        $scope.changeHistory.changlist.push($scope.pageLists[$scope.contextmenu_key]);
        $scope.editing = false;
    };
    $scope.onblurth = function (key) {
        $scope.datagrid.columns[key].isedit = "0";
        $scope.changeHistory.changethlist.push($scope.datagrid.columns[key]);
    };

    function odbcInitAdvanceMode(func) {//当选择的是odbc的时候需要自动打开高级模式，否则自动打开普通模式
        let currDBType = '';
        $scope.sources.forEach(function (elem, index, arr) {
            if (elem.id == $scope.selectedSource) {
                currDBType = elem.database_type;
            }
        }, []);
        if (currDBType == 'odbc') {
            $scope.advancemodel(true);
        } else {
            $scope.advancemodel(false);
        }
        if (typeof func == 'function') {
            func();
        }
    }

    /*
  *选择数据源，查询所包含的表
  */
    $scope.selDBType = '';
    $scope.getTable = function (fn) {
        if ($scope.selectedSource == '0') {
            return false;
        }
        $scope.sources.forEach(function (elem, index, arr) {
            if (elem.id == $scope.selectedSource) {
                $scope.selDBType = elem.database_type;
            }
        }, []);

        //每次切换数据源需要清空关联关系和datagrid.columns
        $('#sourceselect').change(function () {
            clearJoinIconAndLine();
            $scope.datagrid.columns = [];
            //当选择的是odbc的时候需要自动打开高级模式，否则自动打开普通模式
            odbcInitAdvanceMode();
        });

        //初始化执行odbcInitAdvanceMode需要对more-btn-group进行toggleClass，因为调用的advancemodel里有一次toggleClass，对后续情况产生影响
        odbcInitAdvanceMode(function () {
            $(".more-btn-group").toggleClass('hide');
        });
        // if($scope.selectedSource == 'new'){
        //   $scope.selectedSource = '0';
        //   $scope.showContent();
        //   return false;
        // }

        $scope.draged = [];
        $scope.dataJson = [];
        // $scope.datagrid.columns = [];
        $scope.datagrid.lists = [];
        $scope.fulltable = [];
        $scope.searched = "";
        $scope.onsearch = false;
        $scope.selectFileList = 'n';
        if ($scope.selectedSource.id != undefined) {
            $http.get('/api/source/getTables/' + $scope.selectedSource.id).then(function (response) {
                var data = response.data;
                if (data.code == "0") {
                    $scope.lists = data.table;
                    $scope.columns = data.column;
                    $scope.fulltable = data.table;
                    if (typeof fn == 'function') {
                        fn();
                    }
                    // $scope.page = 1;
                    $scope.pagenationTable();
                }
            });
        } else {
            $http.get('/api/source/getTables/' + $scope.selectedSource).then(function (response) {
                var data = response.data;
                if (data.code == "0") {
                    $scope.lists = data.table;
                    $scope.columns = data.column;
                    $scope.fulltable = data.table;
                    if (typeof fn == 'function') {
                        fn();
                    }
                    $scope.page = 1;
                    $scope.pagenationTable();
                }
            });
        }
        for (var key7 in $scope.sources) {
            if ($scope.sources[key7].id == $scope.selectedSource) {
                if ($scope.sources[key7].database == '已导入数据') {
                    $scope.selectFileList = 'y';
                }
                break;
            }
        }
    };
    //刷新当前sourceid下的所有表，解决问题：建立好连接以后用户再在目标连接里新增了表，新增表不显示在当前可选列表
    $scope.refreshTablesBySrc = function () {
        let currDBType = '';
        $scope.sources.forEach(function (elem, index, arr) {
            if (elem.id == $scope.selectedSource) {
                currDBType = elem.database_type;
            }
        }, []);
        if (currDBType == 'odbc') {
            alert('直连不能刷新连接下的表！');
            return;
        }

        let selectedSourceId = '';
        if ($scope.selectedSource.id != undefined) {
            selectedSourceId = $scope.selectedSource.id;
        } else {
            selectedSourceId = $scope.selectedSource
        }
        if (String(selectedSourceId)) {
            $http.get('/api/source/refreshTablesBySrc/' + String(selectedSourceId)).then(function (response) {
                let data = response.data;
                if (data.status == "success") {
                    $scope.lists = data.table;
                    $scope.columns = data.column;
                    $scope.fulltable = data.table;
                    $scope.page = 1;
                    $scope.pagenationTable();
                }
            });
        }
    };

    $scope.uploadExistFile = function (tableName) {
        $scope.startConfig(tableName, 'updateFileTable');
    };

    $scope.delete_table = function (tableObj) {
        if (confirm('确定删除表：' + tableObj.tablename + '?')) {
            $.ajax({
                url: '/api/source/deleteTable',
                type: 'GET',
                data: {tableName: tableObj.table},
            }).done(function (rs) {
                if (rs.code == '1') {
                    //删除成功,刷新表数据
                    $scope.getTable();
                }
                alert(rs.msg);
            });
        }
    }
    /**
     * 分页
     */
    $scope.cntPage = 5;
    $scope.fundationNum = 2;//基础数值，用于$scope.selectPage函数，当数值轮转的时候需要使用它来保证显示多少个页码出来
    $scope.getShowTableDivHeight = function () {
        return $(".datainsert").height();
    };
    // $scope.$watch($scope.getShowTableDivHeight,function (vOfh) {#监听窗口大小并改变分页显示页码数
    //     if(vOfh<730){
    //         $scope.cntPage=4;
    //         $scope.fundationNum=1;
    //     }
    //     else{
    //         $scope.cntPage=5;
    //         $scope.fundationNum=2;
    //     }
    //     $scope.pagenationTable();
    // });
    //分页总数
    $scope.pagenationTable = function () {
        $scope.pageSize = 20;//每页显示条数
        if (!($scope.lists instanceof Array)) {
            $scope.pages = 1
        }
        else {
            $scope.pages = Math.ceil($scope.lists.length / $scope.pageSize); //分页数
        }
        $scope.newPages = $scope.pages > $scope.cntPage ? $scope.cntPage : $scope.pages;
        $scope.pageList = [];
        $scope.selPage = 1;
        //设置表格数据源(分页)
        $scope.setData = function () {
            if (!($scope.lists instanceof Array)) {
                $scope.items = []
            }
            else {
                $scope.items = $scope.lists.slice(($scope.pageSize * ($scope.selPage - 1)), ($scope.selPage * $scope.pageSize));//通过当前页数筛选出表格当前显示数据
            }
        };
        if (!($scope.lists instanceof Array)) {
            $scope.items = []
        }
        else {
            $scope.items = $scope.lists.slice(0, $scope.pageSize);
        }
        //分页要repeat的数组
        for (var i = 0; i < $scope.newPages; i++) {
            $scope.pageList.push(i + 1);
        }
    };
//打印当前选中页索引
    $scope.selectPage = function (page) {
        //不能小于1大于最大
        if (page < 1 || page > $scope.pages) return;
        //最多显示分页数5
        if (page > $scope.fundationNum) {
            //因为只显示5个页数，大于2页开始分页转换
            var newpageList = [];
            for (var i = (page - ($scope.fundationNum + 1)); i < ((page + $scope.fundationNum) > $scope.pages ? $scope.pages : (page + $scope.fundationNum)); i++) {
                newpageList.push(i + 1);
            }
            $scope.pageList = newpageList;
        }
        $scope.selPage = page;
        $scope.setData();
        $scope.isActivePage(page);
        // console.log("选择的页：" + page);
    };

//设置当前选中页样式
    $scope.isActivePage = function (page) {
        return $scope.selPage == page;
    };
//上一页
    $scope.Previous = function () {
        $scope.selectPage($scope.selPage - 1);
    };
//下一页
    $scope.Next = function () {
        $scope.selectPage($scope.selPage + 1);
    };
    //分页结束
    /*
  *表搜索
  */
    $scope.dosearch = _.debounce(function (s) {
        $scope.page = 1;
        var data = $scope.fulltable.filter(function (index) {
            return index.tablename.indexOf(s.toUpperCase()) >= 0 || index.table.indexOf(s.toUpperCase()) >= 0 || index.tablename.indexOf(s) >= 0 || index.table.indexOf(s) >= 0;
        });
        $scope.lists = data;
        $scope.pagenationTable();
        $scope.$apply(function () {
            $scope.time = new Date();
        });
    }, 500);


    /*自定义sql做关联表*/
    $scope.selfDesignSql = function () {
        //自定义sql，弹出框写sql，自定义的sql可以查看数据，（暂时不可以添加参数），当点击确定时需要检验sql的正确性，并对异常处理告知用户
        let sqlStr = 'select * from someTable';
        if ($scope.selectedSource && $scope.selectedSource != '') {
            let modalInstance = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: '/dashboard/selfDesignSqlPage',
                controller: 'selfDesignSqlController',
                backdrop: false,
                resolve: {
                    databaseid: function () {
                        return $scope.selectedSource;
                    },
                    sqlStr: function () {
                        return sqlStr;
                    },
                    sourceid: function () {
                        // return $stateParams.id;
                        return '';
                    }
                },
            });
            modalInstance.result.then(function (rs) {
                if (rs.status == 'success') {
                    console.log('将获得的sql用于创建表格标签，rs=', rs);
                    //这里需要返回的数据关联到第一张表，或者这个sql作为第一张表
                    //需要将这个sql封装为对象插入到$scope.draged里面，datajson需要插入，页面需要显示，保存到数据库并可以回显
                    let currSfDsignSqlCnt = 0;
                    $scope.dataJson.map(function (itemObj) {//找到当前自定义sql的角标
                        if (itemObj.item && (itemObj.item.split('sql')[0].localeCompare('自定义') == 0 || itemObj.item.indexOf('userdefinedsql') >= 0)) {
                            currSfDsignSqlCnt += 1;
                        }
                    });
                    //以下使用的userDefinedSql在sqltool.py中也有对应的处理，如需修改需要兼顾,draged由于是json字符串所以可以添加其他字段
                    $scope.draged.push({
                        'ifshow': '1',
                        'tablename': '自定义sql' + currSfDsignSqlCnt,
                        'table': 'userdefinedsql' + currSfDsignSqlCnt,
                        'isedit': '0',
                        'sqlDesign': '1',
                        'sql': rs.sql
                    });


                    rs.columns.map(function (item) {//当删除当前表时需要移除这些字段
                        $scope.columns.push({
                            'Field': item.field,
                            'name': item.title,
                            'table': ('userdefinedsql' + currSfDsignSqlCnt),
                            'type': item.type
                        });
                    });

                    if ($scope.draged.length > 1) {//当前自定义sql是子表
                        let mainTableName = $scope.draged[0].table;
                        let relationObj = autoRelation(mainTableName, 'userdefinedsql' + currSfDsignSqlCnt);
                        relationObj['sql'] = rs.sql;
                        // console.log('autoRelation=',relationObj);
                        $scope.dataJson.push(relationObj);
                    } else {
                        $scope.dataJson.push({'item': 'userdefinedsql' + currSfDsignSqlCnt, 'sql': rs.sql});
                    }
                    $(".drag-content").removeClass('hide');
                    $scope.genMapByDataJson();
                    $scope.getGridColumn();
                }
            });
        } else {
            alert('请选择数据库！');
        }
    };

    /*第一次拖拽进入和编辑由于传入的参数不一致所以分成两个方法*/
    $scope.editSql = function (item) {
        if ($scope.selectedSource && $scope.selectedSource != '') {
            let modalInstance = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: '/dashboard/selfDesignSqlPage',
                controller: 'selfDesignSqlController',
                backdrop: false,
                resolve: {
                    databaseid: function () {
                        return $scope.selectedSource;
                    },
                    sqlStr: function () {
                        return item.sql;
                    },
                    sourceid: function () {
                        // return $stateParams.id;
                        return '';
                    }
                },
            });
            modalInstance.result.then(function (rs) {
                if (rs.status == 'success') {
                    //这里需要返回的数据关联到第一张表，或者这个sql作为第一张表
                    //需要将这个sql封装为对象插入到$scope.draged里面，datajson需要插入，页面需要显示，保存到数据库并可以回显

                    //以下使用的userDefinedSql在sqltool.py中也有对应的处理，如需修改需要兼顾,draged由于是json字符串所以可以添加其他字段
                    let currTbNm = item.table;
                    for (let i = 0; i < $scope.draged.length; i++) {
                        if ($scope.draged[i].table == currTbNm) {
                            $scope.draged[i].sql = rs.sql;
                        }
                    }
                    //更新$scope.columns中的字段
                    $scope.columns = $scope.columns.filter(function (itemObj) {//先删除以前的字段，再新增
                        return itemObj.table != currTbNm;
                    });
                    rs.columns.map(function (itemO) {//当删除当前表时需要移除这些字段
                        $scope.columns.push({
                            'Field': itemO.field,
                            'name': itemO.title,
                            'table': currTbNm,
                            'type': itemO.type
                        });
                    });
                    if ($scope.draged.length > 1) {
                        //找到原始关联的target主表
                        let idx, oldDJObj = '';
                        $scope.dataJson.map(function (itemObj, ix) {
                            if (itemObj.item == currTbNm) {
                                idx = ix;
                                oldDJObj = itemObj;
                            }
                        });
                        let mainTableName = $scope.draged[0].table;
                        if (oldDJObj && oldDJObj != {}) {
                            mainTableName = oldDJObj.relation.relationdetail[0].target;
                        }
                        //重新自动关联
                        let relationObj = autoRelation(mainTableName, currTbNm);
                        relationObj['sql'] = rs.sql;
                        $scope.dataJson[idx] = relationObj;//更新保存关联结果
                    } else {
                        $scope.dataJson.map(function (itemObj, ix) {//只有一个拖拽sql的编辑情况
                            if (itemObj.item == currTbNm) {
                                $scope.dataJson[ix]['sql'] = rs.sql;
                            }
                        })
                    }
                    $scope.genMapByDataJson();
                    $scope.getGridColumn();
                }
            });
        } else {
            alert('请选择数据库！');
        }
    }
    /*
  *获取数据源
  */


    /*
  *拖拽回调函数
  */
//jquery获取path和relation添加到组件之间
    $scope.allJoinIcon = {
        'left join': '/frontend/image/dataInsertJoin/leftJoin.png',
        'right join': '/frontend/image/dataInsertJoin/rightJoin.png',
        'inner join': '/frontend/image/dataInsertJoin/innerJoin.png',
        'outer join': '/frontend/image/dataInsertJoin/outerJoin.png',
        'None': '/frontend/image/dataInsertJoin/None.png',
    };
    $scope.pathDdata = {};//存放所有画线的坐标(多个起点和终点)
    $scope.userDefinedSqlDemo = 'userDefinedSqlDemo';//自定义sql标志，当拖入的是自定义sql的tag，就执行自定义sql的方法
    $scope.dropCallback = function () {
        if ($scope.draged[$scope.draged.length - 1] == 'userDefinedSqlDemo') {//拖入自定义sql
            $scope.draged.pop();
            $scope.selfDesignSql();
            return;
        }
        //svg画关联关系图
        $("body").mLoading();//遮罩层
        $timeout(function () {
            if ($scope.draged.length > 1) {
                let currTableObj = $scope.draged[$scope.draged.length - 1];//当前拖入的tag
                for (let dgcnt = 0; dgcnt < $scope.draged.length - 1; dgcnt++) {//拖入重复表处理
                    if (currTableObj.table == $scope.draged[dgcnt].table) {
                        $scope.draged.pop();
                        alert('表名相同！');
                        $("body").mLoading('destroy');//清除遮罩层
                        return;
                    }
                }
                let allDragedTableTag = $('.dropFieldClass').find('.drag-content-table');//所有拖拽表生成的div
                let mainTableTag = allDragedTableTag[0];//主表的div
                let currTableTag = allDragedTableTag[allDragedTableTag.length - 1];//当前拖拽进入的表生成的div
                // console.log('currTableTag=',currTableTag);

                //生成关联关系，将关联关系保存到$scope.dataJson
                let mainTableName = $scope.draged[0].table;
                let currTableName = currTableObj['table'];
                let relationObj = autoRelation(mainTableName, currTableName);
                // console.log('autoRelation=',relationObj);
                $scope.dataJson.push(relationObj);

            } else {
                let relationObj = {};
                relationObj['item'] = $scope.draged[0].table;
                $scope.dataJson.push(relationObj);
            }
            $scope.genMapByDataJson();

            $scope.getGridColumn();
            $("body").mLoading('destroy');//清除遮罩层
        });
        $(".drag-content").removeClass('hide');
    };
// $scope.$watch('dataJson',function (item) {
//     if(!$scope.advance){
//         $scope.genMapByDataJson();
//     }
// },true);
    $scope.genMapByDataJson = function () {
        clearJoinIconAndLine();
        let relationTree = getTreeStructFromDataJson($scope.dataJson);
        $scope.maxMarginTop = 0;
        genRelatMap(relationTree);
        // $scope.tableRelat={};//表之间的父子关系
        // $scope.dataJson.map(function (itemObj,idx) {
        //     if(itemObj.hasOwnProperty('relation')){
        //         genRelatMap(itemObj,idx);
        //     }
        // });
    };
    $scope.refreshUpdateTb = {'status': false, 'tableNms': new Array()};//标志位，标志是否是刷新的情况(只针对自定义sql)，如果是刷新就把表名记录下来并在sourceColumn的结果里把$scope.dategride.columns的自定义sql的字段放入$scope.column
    $scope.$on('ngRepeatFinished', function () {//dom加载完成后执行,用directive创建指令
        if ($scope.draged.length < $scope.dataJson.length) {
            $scope.dataJson.map(function (itemObj, idx) {
                let i = 0;
                for (; i < $scope.draged.length; i++) {
                    if (itemObj.item == $scope.draged[i].table) break;
                }
                if (i >= $scope.draged.length) {//该datajson中的对象没有在draged中
                    //执行插入,自定义的sql需要放到draged中才能回显正确
                    let tbNm = itemObj.item;
                    if (tbNm && tbNm != '') {
                        tbNm = tbNm.replace('userdefinedsql', '自定义sql');
                    }
                    $scope.draged.splice(idx, 0, {
                        'ifshow': '1',
                        'tablename': tbNm,
                        'table': itemObj.item,
                        'isedit': '0',
                        'sqlDesign': '1',
                        'sql': itemObj.sql
                    });
                    $scope.refreshUpdateTb.status = true;
                    $scope.refreshUpdateTb.tableNms.push(itemObj.item);
                }
            })
        }
        $scope.draged.map(function (item) {//需要将draged中的表名存入refreshUpdateTb（注意去重复），以便后续使用(选择自定义sql的字段)
            if (item.table && /^userdefinedsql\d/.test(item.table)){//如果是自定义sql
                var existsInRefreshUpdateTb = false;
                $scope.refreshUpdateTb.tableNms.map(function (itemObj) {
                    if (item.table == itemObj){
                        existsInRefreshUpdateTb = true;
                    }
                })
                if (!existsInRefreshUpdateTb) {//如果不存在就添加进入
                    $scope.refreshUpdateTb.tableNms.push(item.table)
                    $scope.refreshUpdateTb.status = true;
                }
            }
        });

        if (!$scope.advance) {
            $scope.genMapByDataJson();
        }
    });

//从datajson中获取树结构
    function getTreeStructFromDataJson(dataJson) {
        let treeStruct = {};
        let relat2Relat = [];//保存两个tag关系
        dataJson.map(function (itemObj, idx) {//从json里获取信息组成对象，以供后续操作
            if (itemObj.hasOwnProperty('relation')) {
                let joinIcon = '';
                if (!itemObj.relation.hasOwnProperty('joinIcon')) {//兼容以前版本
                    joinIcon = allJoinIcon[itemObj.relation.relationtype];
                } else {
                    joinIcon = itemObj.relation.joinIcon;
                }
                ;
                relat2Relat.push({
                    'currTb': itemObj.item,
                    'mainTb': itemObj.relation.relationdetail[0].target,
                    'djIdx': idx,
                    'joinIcon': joinIcon
                });
                // let relatMainTb=[];//防止relationdetail的重复表
                // itemObj.relation.relationdetail.map(function (itemitemObj) {
                //     if(relatMainTb.indexOf(itemitemObj.target)==-1 && itemitemObj.target!=''){
                //         relat2Relat.push({'currTb':itemObj.item,'mainTb':itemitemObj.target,'djIdx':idx});
                //         relatMainTb.push(itemitemObj.target);
                //     }
                // });
            } else {
                treeStruct['tbName'] = itemObj.item;
                treeStruct['parentTbName'] = '';
                treeStruct['level'] = 0;
                treeStruct['rowCnt'] = 0;
                treeStruct['djIdx'] = idx;
                treeStruct['children'] = new Array();
                treeStruct['joinIcon'] = '';
            }
        });
        // console.log('relat2Relat=',relat2Relat);
        let tempDataJson = angular.copy($scope.dataJson);//创建树形结构时需要重新调整$scope.dataJson里元素的顺序，因为在python里生成sql的时候需要与页面看到的结构一致才不会出错
        //创建树形结构
        let added = 0;
        let treeNode = {};
        let isadded = '';
        while (relat2Relat.length > added) {
            treeNode = {
                'tbName': relat2Relat[added].currTb,
                'parentTbName': relat2Relat[added].mainTb,
                'children': [],
                'djIdx': relat2Relat[added].djIdx,
                'level': 0,
                'rowCnt': 0,
                'joinIcon': relat2Relat[added].joinIcon
            };
            // $scope.currTreeStruct=treeStruct;//保存当前结构,用于计算当前结构的叶子节点
            isadded = addObjToTreeStruct(treeStruct, treeNode);
            if (!isadded || isadded != 'added') {//如果当前relat2Relat[i]没有存放到树形结构中则把当前object放到最后遍历，因遍历当前obj而其父节点还未生成
                relat2Relat.push(relat2Relat[added]);
                let idx, djObj;
                tempDataJson.map(function (itemObj, ix) {
                    if (itemObj.item == relat2Relat[added].currTb) {
                        idx = ix;
                        djObj = itemObj;
                    }
                })
                if (djObj && idx) {
                    tempDataJson.splice(idx, 1);
                    tempDataJson.push(djObj);
                }
            }
            added += 1;
            if (added > 10000) {//如果出现无限循环情况
                alert('关联关系错误！请重新建立！');
                tempDataJson = [];//一旦报错就不对$scope.dataJson做修改，后面有if判断
                return treeStruct;
            }
        }
        if (tempDataJson.length == $scope.dataJson.length) {
            $scope.dataJson = tempDataJson;
        }

        return treeStruct;
    }

    function addObjToTreeStruct(treeStruct, itemObj) {//传引用，直接存放
        if (treeStruct.tbName == itemObj.parentTbName) {
            itemObj.level = treeStruct.level + 1;
            itemObj.rowCnt = 0;
            treeStruct.children.push(itemObj);
            return 'added';
        } else {
            for (let i = 0; i < treeStruct.children.length; i++) {
                if (addObjToTreeStruct(treeStruct.children[i], itemObj) == 'added') {
                    return 'added';
                }
            }
        }
    };

    function findMaxChildCnt(treeStruct) {//根据传入的obj查找obj前面的所有子tab最多有多少个
        let maxChildCnt = [];
        findMaxChildCntByLevel(treeStruct, maxChildCnt);
        let maxLevelChilds = 0;
        maxChildCnt.map(function (itemObj) {//计算最末端有多少个表格宽度
            if (itemObj.childCnt == 0 && itemObj.level > 0) {
                maxLevelChilds += 1;
            }
        });
        return maxLevelChilds;
    }

    function findMaxChildCntByLevel(treeStruct, maxChildCnt) {
        maxChildCnt.push({'level': treeStruct.level, 'childCnt': treeStruct.children.length});
        for (let i = 0; i < treeStruct.children.length; i++) {
            findMaxChildCntByLevel(treeStruct.children[i], maxChildCnt);
        }
    }

    function genRelatMap(relationTree) {
        if (JSON.stringify(relationTree) == '{}') return;
        if (relationTree.parentTbName != "" && relationTree.level != 0) {//不绘制根节点
            drawCurrObj(relationTree);
        }
        for (let i = 0; i < relationTree.children.length; i++) {
            if (i > 0) $scope.maxMarginTop += 1;
            genRelatMap(relationTree.children[i]);
        }
        ;
    }

    function drawCurrObj(currTreeObj) {
        let mainTbName = currTreeObj.parentTbName;
        let currTbName = currTreeObj.tbName;//当前表名

        let mainTbTag = $('.drag-content-table[tablerealname=' + mainTbName + ']');
        let currTbTag = $('.drag-content-table[tablerealname=' + currTbName + ']');
        // console.log('currTbTag=',currTbTag);
        // if(currTbTag.length>1){//重复表处理
        //     let currTbs=[];//所有当前表
        //     $scope.tableRelat[mainTbName].map(function (itemObj) {
        //         if(itemObj.split('__')[0]==currTbName){
        //             currTbs.push(currTbName);
        //         }
        //     });
        //     let indx=currTbs.length%currTbTag.length;
        //     currTbTag=currTbTag[indx];
        // }

        // console.log('currTbTag=',currTbTag);
        // console.log('-rr=',$scope.tableRelat[mainTbName].length-1);

        let genRelation = createRelationIcon(mainTbTag, currTbTag, currTreeObj);//创建关联关系图标

        //画线,需要找到当前拖入的field
        let zline = 0;
        let dt = getDdata($(mainTbTag), genRelation, $(currTbTag), zline);
        // console.log('general path d=',dt);

        let pathDdataK = currTbName + '_' + currTreeObj.level + '_' + currTreeObj.djIdx;
        $scope.pathDdata[pathDdataK] = dt;//保存为对象方便查找
        $('#path').attr('d', concateAllPathDData());

        // let mainTbTagPos=getElCoordinate(mainTbTag);
        //如果拖入的表格太多了，需要调整svgDiv的大小
        let currTbPos = getElCoordinate($(currTbTag));
        resizeSVGDiv(currTbPos);
    }


    function clearJoinIconAndLine() {
        $('.relationsStyles').html('');
        $('#path').attr('d', '');
        $scope.pathDdata = {};
        $('.drag-content-table').css('cssText', '')
    }

    /**
     * 关联关系计算用到的函数
     */
    //自动关联，根据传入的表名查找表字段，表字段相似的进行关联并返回

    function autoRelation(mainTableName, currTableName, genRelation) {
        let relationObj = {};
        relationObj['item'] = currTableName;
        let relation = {};
        relation['relationtype'] = 'left join';//默认初始化为left join,建立对应的数据格式
        relation['joinIcon'] = $scope.allJoinIcon['left join'];

        let relationDetail = {};
        relationDetail['target'] = mainTableName;
        relationDetail['mycolumn'] = '';//主表的字段
        relationDetail['targetcolumn'] = '';//目标表的字段
        relationDetail['relationfunction'] = '=';
        relation['relationdetail'] = new Array();
        relation['relationdetail'].push(relationDetail);
        relationObj['relation'] = relation;

        let mainTbCols = [], currTbCols = [];
        mainTbCols = getTableColsFromAll(mainTableName);
        currTbCols = getTableColsFromAll(currTableName);
        //获取关联字段
        let mainTbColsList = [], currTbColsList = [];
        mainTbCols.map(function (singleObj) {
            mainTbColsList.push(singleObj['Field']);
        });
        currTbCols.map(function (item) {
            currTbColsList.push(item['Field']);
        });
        let joinFieldObj = get2JoinField(mainTbColsList, currTbColsList);
        relationDetail['mycolumn'] = joinFieldObj['currCol'];
        relationDetail['targetcolumn'] = joinFieldObj['mainCol'];
        if (!relationDetail['mycolumn'] || !relationDetail['targetcolumn']) {//如果没有关联上就显示关联失败图标
            relation['relationtype'] = 'None';//默认初始化为left join,建立对应的数据格式
            relation['joinIcon'] = $scope.allJoinIcon['None'];
            relationDetail['relationfunction'] = '';
        }
        return relationObj;
    }

    function get2JoinField(mainTbCols, currTbCols) {//从两列字段中查找关联字段,mainTbCols为主表的所有字段，currTbCols为当前表的所有字段
        let joinedField = {};
        joinedField['mainCol'] = '';
        joinedField['currCol'] = '';
        if (mainTbCols && currTbCols) {//自动查找有id的字段进行关联
            for (let i = 0; i < mainTbCols.length; i++) {
                for (let j = 0; j < currTbCols.length; j++) {
                    if (mainTbCols[i] == currTbCols[j] && mainTbCols[i].toLowerCase().indexOf('id') != -1) {
                        joinedField['mainCol'] = mainTbCols[i];
                        joinedField['currCol'] = currTbCols[j];
                        return joinedField;
                    }
                    // let similar=strSimilarity2Percent(mainTbCols[i],currTbCols[j]);
                    // if(similar>0.9 && mainTbCols[i].toLowerCase().indexOf('id')!=-1){//有id字段的相似度大于90%的字段也自动关联
                    //     joinedField['targetCol']=mainTbCols[i];
                    //     joinedField['currCol']=currTbCols[j];
                    //     return joinedField;
                    // }
                }
            }
        }
        return joinedField;
    }

    function resizeSVGDiv(currTbPos) {
        if ((currTbPos.top + currTbPos.height) > $('.dropFieldClass').height()) {
            $('.dropFieldClass').height(currTbPos.top + currTbPos.height);
            $('#svgTag').css('height', currTbPos.top + currTbPos.height);
        }
        if ((currTbPos.left + currTbPos.width) > $('.dropFieldClass').width()) {
            $('.dropFieldClass').width(currTbPos.left + currTbPos.width);
            $('#svgTag').css('width', currTbPos.left + currTbPos.width);
        }
    }

//比较两个字符串相似程度，返回0.2556
    function strSimilarity2Number(s, t) {
        var n = s.length, m = t.length, d = [];
        var i, j, s_i, t_j, cost;
        if (n == 0) return m;
        if (m == 0) return n;
        for (i = 0; i <= n; i++) {
            d[i] = [];
            d[i][0] = i;
        }
        for (j = 0; j <= m; j++) {
            d[0][j] = j;
        }
        for (i = 1; i <= n; i++) {
            s_i = s.charAt(i - 1);
            for (j = 1; j <= m; j++) {
                t_j = t.charAt(j - 1);
                if (s_i == t_j) {
                    cost = 0;
                } else {
                    cost = 1;
                }
                d[i][j] = Minimum(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            }
        }
        return d[n][m];
    }

//两个字符串的相似程度，并返回相似度百分比
    function strSimilarity2Percent(s, t) {
        if (!s || !t) return 0;
        var l = s.length > t.length ? s.length : t.length;
        var d = strSimilarity2Number(s, t);
        return (1 - d / l).toFixed(4);
    }

    function Minimum(a, b, c) {
        return a < b ? (a < c ? a : c) : (b < c ? b : c);
    }

    /**
     * 画线需要用到的函数
     */
    function createRelationIcon(mainTableTag, currTableTag, currTreeObj) {//根据传入的行列创建关联,创建第i行第j列个关联
        //把关联关系存放到relation标签中
        let mainTable = $(mainTableTag).attr('tableRealName');
        let currTable = $(currTableTag).attr('tableRealName');
        let relationsStyles = $('.relationsStyles');
        let mainTbPos = getElCoordinate(mainTableTag);
        // let currTbSvNm=currTable+'__'+(angular.copy($scope.tableRelat[mainTable].length)-1);//必须减一
        // let currTbIdxInTableRelat=$scope.tableRelat[mainTable].indexOf(currTbSvNm);
        // console.log('currTbSvNm=',currTbSvNm);
        // console.log('currTbIdxInTableRelat=',currTbIdxInTableRelat);

        // if(currTbIdxInTableRelat==-1)currTbIdxInTableRelat=0;
        let currTbCssText = 'position:absolute;';
        currTbCssText += 'margin-left:' + (mainTbPos.left + mainTbPos.width + 30 + 40 + 30) + 'px;';//调整currentTbTag的位置
        currTbCssText += 'margin-top:' + (10 + 60 * $scope.maxMarginTop) + 'px;';
        $(currTableTag).css('cssText', currTbCssText);
        // console.log('currTbCssText==',currTbCssText);
        // console.log('currTableTag==',currTableTag);

        let relationDiv = '<div class="singleRelation" ng-click="openRelation($event)" style="margin-left:' + (30 + mainTbPos.left + mainTbPos.width) + 'px;margin-top:' + (10 + 60 * $scope.maxMarginTop) + 'px;position: absolute;" mainTable="' + mainTable + '" currTable="' + currTable + '" relaIdx="' + currTreeObj.djIdx + '">'
            + '    <div>'
            + '        <img src="' + currTreeObj.joinIcon + '" height="30" width="42">'
            + '    </div>'
            + '</div>';
        let relationDivComp = $compile(relationDiv)($scope);
        $(relationsStyles).append(relationDivComp);
        return relationDivComp;
    }

    function concateAllPathDData() {
        let dDataList = [];
        if ($scope.pathDdata) {
            for (item in $scope.pathDdata) {
                dDataList.push($scope.pathDdata[item]);
            }
        }
        return dDataList.join(' ');
    }

    function getDdata(mainTableTag, genRelation, currTableTag, zline) {
        //获取相对坐标
        let pos0 = getElCoordinate(mainTableTag);
        let relationship = getElCoordinate(genRelation);
        let pos1 = getElCoordinate(currTableTag);

        //画线点起始结束坐标点
        let startS = getPos(pos0, relationship).start;
        let endS = getPos(pos0, relationship).end;
        let startE = getPos(relationship, pos1).start;
        let endE = getPos(relationship, pos1).end;

        let i = 0;
        zline = 0;
        let dt = 'M' + (startS.x + 300 * (i)) + ',' + startS.y;
        if (zline > 0) {//画出的线是直线（z转折线）而不是斜线
            dt += ' L' + ((startS.x + 300 * (i - 1)) + 15) + ',' + startS.y;
            dt += ' L' + ((startS.x + 300 * (i - 1)) + 15) + ',' + (startS.y + 50 * zline);
        }
        dt += ' L' + (endS.x + 2) + ',' + endS.y;
        dt += ' M' + startE.x + ',' + startE.y;
        dt += ' L' + (endE.x + 300 * i) + ',' + endE.y;
        return dt;
    }

    //获取两个元素的起终点坐标
    function getPos(pos1, pos2) {
        let x1, y1, x2, y2;
        x1 = pos1.left + pos1.width;
        y1 = pos1.top + pos1.height / 2;
        x2 = pos2.left;
        y2 = pos2.top + pos2.height / 2;
        return {
            start: {x: x1, y: y1},
            end: {x: x2, y: y2}
        }
    }

    //获取元素左上角相对于某一元素的的位置
    function getElCoordinate(dom) {
        let t, l, w, h;
        if (dom[0] && dom[0] != '') {
            t = dom[0].offsetTop;
            l = dom[0].offsetLeft;
            w = dom[0].offsetWidth;
            h = dom[0].offsetHeight;
        } else {
            t = dom.offsetTop;
            l = dom.offsetLeft;
            w = dom.offsetWidth;
            h = dom.offsetHeight;
        }
        return {
            top: t,
            left: l,
            width: w,
            height: h
        };
    }

    /*
  *删除选中表
  */
    $scope.removeitem = function (ev, table) {
        var item = table.table;
        var removeAry = [];
        $scope.dataJson = $scope.dataJson.filter(function (index) {
            var rs = true;
            if (index.item == item) {
                removeAry.push(index.item);
                rs = false;
            }
            else {
                if (index.hasOwnProperty('relation')) {
                    for (var m = 0; m < index.relation.relationdetail.length; m++) {
                        if (index.relation.relationdetail[m].target == item) {
                            removeAry.push(index.item);
                            rs = false;
                        }
                    }
                }
            }
            return rs;
        });

        $scope.draged = $scope.draged.filter(function (index) {
            return removeAry.indexOf(index.table) < 0;
        });
        // 解决按esc键后删不掉表的问题
        if ($scope.draged.length != $scope.dataJson.length) {
            for (i = 0; i < $scope.draged.length; i++) {
                if ($scope.draged[i].table == item) {
                    $scope.draged.splice(i, 1);
                }
            }
        }
        if (item.indexOf('userdefinedsql') > -1) {
            $scope.columns = $scope.columns.filter(function (itemObj) {//删除时候如果是自定义sql的需要把其字段移除
                return itemObj.table != item;
            })
        }


        if ($scope.draged.length == 0) {
            $scope.datagrid.columns = [];
            $scope.datagrid.data = [];
        } else {
            $scope.getGridColumn();
        }
        //重绘关联关系图
        $timeout(function () {//需要延迟执行，以避免和draged冲突
            $scope.genMapByDataJson();
        });
    };
    /*
  *编辑关联关系
  */
    $scope.edititem = function (item) {
        $scope.openRelation(item);
    };

    $scope.editsource = function (e) {
        if (e) {
            if ($scope.selectedSource == '0' || $scope.selectedSource == 'excel') {
                return false;
            }
        }
        $scope.showedit = e;
    };
    $scope.editdatasource = function () {

    };

    //根据datagrid.column获取TableHeadWidth
    function generalTableHeadWidth(datagrideColumn){
        let tempColTableDict = {};
        //记录所有表的个数
        datagrideColumn.map(function (value, idx) {
            if (value.formatcolumn && value.formatcolumn.indexOf('__') == -1) {//直连或者写sql的模式的column不会拼接有tablename
                if (!tempColTableDict.hasOwnProperty(value.field)) {//这里用columnname来作为key，在求column长度时可用
                    tempColTableDict[value.field] = 1;
                } else {
                    tempColTableDict[value.field] += 1;
                }
            } else if (value.formatcolumn) {
                let tableName = value.formatcolumn.split('__')[0];//找tableName
                if (!tempColTableDict.hasOwnProperty(tableName)) {
                    tempColTableDict[tableName] = 1;
                } else {
                    tempColTableDict[tableName] += 1;
                }
            } else if (!value.formatcolumn){//适用于高级模式
                if (!tempColTableDict.hasOwnProperty(value.field)) {//这里用columnname来作为key，在求column长度时可用
                    tempColTableDict[value.field] = 1;
                } else {
                    tempColTableDict[value.field] += 1;
                }
            }
        })
        let sumTableBoxWidth = 0;
        for (let k in tempColTableDict) {
            sumTableBoxWidth += tempColTableDict[k] * (k.length * 10 > 200 ? k.length * 10 : 200);//求key的字符串长度乘以个数（多少加一点宽度），但最少为200px
        }
        return sumTableBoxWidth;
    }
    /*
  *获取当前关联关系生成的数据报表 列
  */
    $scope.getGridColumn = function () {
        $http({
            method: 'POST',
            url: '/api/source/sourceColumn',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                datajson: $scope.dataJson,
                pk: $scope.selectedSource,
                id: $scope.config.id,
                conntype: $scope.config.conntype
            }
        }).success(function (response) {
            if (response.code == '1') {
                rs = response.lists;
                if ($scope.datagrid.columns.length > 0) {
                    var oldRs = $scope.datagrid.columns;
                    rs.map(function (value, key) {
                        oldRs.map(function (old_value) {
                            if (value.field == old_value.field) {
                                rs[key] = old_value;
                            }
                        });
                    });
                    $scope.datagrid.columns = rs;
                }
                else {
                    $scope.datagrid.columns = rs;
                }
                let sumTableBoxWidth = generalTableHeadWidth($scope.datagrid.columns);
                if (sumTableBoxWidth > 0) {
                    $scope.tableBoxWidth = {'min-width': sumTableBoxWidth + 'px'};
                } else {
                    $scope.tableBoxWidth = {'min-width': '2000px'};
                }
                ///求表格展示的表格宽度，完成

                // $scope.getGridData(1);
                $scope.getRowData();
                // console.log('$scope.refreshUpdateTb==',$scope.refreshUpdateTb);
                if ($scope.refreshUpdateTb && $scope.refreshUpdateTb.status) {//必须只执行一次
                    let userDesignTbCols = [];
                    $scope.refreshUpdateTb.tableNms.map(function (item) {//把$scope.datagrid.columns里的自定义sql翻译为对象添加到$scope.columns中
                        $scope.datagrid.columns.map(function (itemObj) {
                            if (item == itemObj.field.split('__')[0]) {
                                $scope.columns.push({
                                    'Field': itemObj.field.split('__')[1],
                                    'name': itemObj.title,
                                    'table': itemObj.field.split('__')[0],
                                    'type': itemObj.type
                                });
                            }
                        })
                    });
                    $scope.refreshUpdateTb.status = false;
                }
            } else {
                alert(response.msg);
            }
        });
    };

    //根据表名获取表字段，查询出来的所有表字段里获取，不用每次查询数据库，提高效率
    function getTableColsFromAll(tableName, listTb) {
        if (!tableName || tableName.length == 0) {
            return [];
        }
        let tbColumns = [];
        if (listTb && listTb.trim() != '' && listTb == 'y') {
            tbColumns = $scope.columns.filter(function (index) {
                let sel = false;
                tableName.map(function (item) {
                    if (item == index.table) sel = true;
                });
                return sel;
            });
        } else {
            tbColumns = $scope.columns.filter(function (index) {
                return index.table == tableName;
            });
        }
        return tbColumns;
    }

    /*
  *获取当前关联关系生成的数据报表 数据
  */
    $scope.pageChanged = function () {
        if ($scope.advance) {
            $scope.getDataBySql($scope.currentPage);
        } else {
            // $scope.getGridData($scope.currentPage);
            $scope.getRowData();
        }
    };
    $scope.getGridData = function (page) {
        $http({
            method: 'post',
            url: "/api/source/sourceData",
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                datajson: $scope.dataJson,
                pk: $scope.selectedSource,
                sourcecolumn: $scope.datagrid.columns,
                limit: 10,
                offset: (page - 1) * 10,
                order: ''
            }
        }).success(function (rs) {
            $scope.datagrid.data = rs.rows;
            $scope.totalItems = rs.total;
        });
    };
    $scope.getRowData = function () {
        if ($scope.advance) {
            $scope.getDataBySql(1);
        } else {
            rowCnt = $("#showRowCnt").val();
            if (!rowCnt || !(rowCnt >= 0) || isNaN(String(rowCnt))) {
                return;
            }
            rowCnt = Math.round(rowCnt);
            $http({
                method: 'post',
                url: "/api/source/sourceData",
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    datajson: $scope.dataJson,
                    pk: $scope.selectedSource,
                    sourcecolumn: $scope.datagrid.columns,
                    limit: rowCnt,
                    offset: 0,
                    order: ''
                }
            }).success(function (rs) {
                $scope.datagrid.data = rs.rows;
                $scope.totalItems = rs.total;
            });
        }
    };
    $scope.customsql = '';
    $scope.excuce = function () {
        if ($scope.customsql != '') {
            $http({
                method: 'POST',
                url: '/api/source/sourceSqlColumn',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    sql: $scope.customsql,
                    pk: $scope.selectedSource,
                    sourceid: $stateParams.id
                }
            }).success(function (response) {
                if (response.code == '1') {
                    $scope.sqlerror = false;
                    rs = response.lists;
                    $scope.datagrid.columns = rs;
                    //设置显示数据的宽度
                    let sumTableBoxWidth = generalTableHeadWidth($scope.datagrid.columns);
                    if (sumTableBoxWidth > 0) {
                        $scope.tableBoxWidth = {'min-width': sumTableBoxWidth + 'px'};
                    } else {
                        $scope.tableBoxWidth = {'min-width': '2000px'};
                    }
                    //宽度设置完成
                    $scope.getDataBySql(1);
                }
                else {
                    $scope.sqlerror = true;
                    $scope.sqlerrormsg = response.msg[0];
                }
            });
        }
    };
    $scope.closeerror = function () {
        $scope.sqlerror = false;
    };
    $scope.getDataBySql = function (page) {
        // $http({
        //   method: 'post',
        //   url: "/api/source/sourceSqlData",
        //   headers: { 'X-CSRFToken': getCookie('csrftoken') },
        //   data: {
        //     sql: $scope.customsql,
        //     pk: $scope.selectedSource,
        //     limit: 10,
        //     offset: (page - 1) * 10,
        //     order: ''
        //   }
        // }).success(function (rs) {
        //   $scope.datagrid.data = rs.rows;
        //   $scope.totalItems = rs.total;
        // });
        rowCnt = $("#showRowCnt").val();
        if (!rowCnt || !(rowCnt >= 0) || isNaN(String(rowCnt))) {
            return;
        }
        rowCnt = Math.round(rowCnt);
        $http({
            method: 'post',
            url: "/api/source/sourceSqlData",
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                sql: $scope.customsql,
                pk: $scope.selectedSource,
                limit: rowCnt,
                offset: 0,
                order: ''
            }
        }).success(function (rs) {
            $scope.datagrid.data = rs.rows;
            $scope.totalItems = rs.total;
        });
    };

    $scope.getsql = function () {
        $scope.customsql = this.customsql;
    };
    /*
  *新建关联关系
  */
    // $scope.openRelation = function (id) {
    //   var data = $scope.draged;
    //   var datajson = $scope.dataJson;
    //   var modalInstance = $uibModal.open({
    //     animation: true,
    //     ariaLabelledBy: 'modal-title',
    //     ariaDescribedBy: 'modal-body',
    //     templateUrl: '/dashboard/relationModle',
    //     controller: 'relationController',
    //     backdrop: false,
    //     resolve: {
    //       data: function () {
    //         return data;
    //       },
    //       datajson: function () {
    //         return datajson;
    //       },
    //       id: function () {
    //         return id;
    //       },
    //       pk: function () {
    //         return $scope.selectedSource;
    //       },
    //       column: function () {
    //         return $scope.columns;
    //       }
    //     }
    //   });
    //   modalInstance.result.then(function (s) {
    //     if (s.type == 'ok') {
    //       if (id == 0) {
    //         $scope.dataJson[$scope.draged.length - 1] = s.data;
    //       }
    //       else {
    //         $scope.dataJson[id] = s.data;
    //       }
    //     }
    //     else {
    //       if (id == 0) {
    //         $scope.draged.pop();
    //         // $scope.dataJson.pop();
    //       }
    //     }
    //     $scope.getGridColumn();
    //   });
    // };
    $scope.openRelation = function (domObj) {
        let thisObj = $(domObj.currentTarget);
        let mainTb = thisObj.attr('mainTable');
        let currTb = thisObj.attr('currTable');
        let relaIdx = thisObj.attr('relaIdx');
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/relationModle',
            controller: 'relationController',
            backdrop: false,
            openedClass: 'margin-top:250px;left:100px;',
            resolve: {
                mainTbName: function () {
                    return mainTb;
                },
                currTbName: function () {
                    return currTb
                },
                allTbCols: function () {
                    let dragedTbs = [];
                    $scope.draged.map(function (item) {
                        dragedTbs.push(item.table);
                    });
                    return getTableColsFromAll(dragedTbs, 'y');//拖入面板的所有表的字段
                },
                currRelation: function () {
                    return angular.copy($scope.dataJson[relaIdx]);
                },
                allJoinIcon: function () {
                    let allJoinIcn = angular.copy($scope.allJoinIcon);
                    delete allJoinIcn['None'];
                    return allJoinIcn;
                },
                openway: function () {
                    return 1;
                },
                pk: function () {
                    return $scope.selectedSource;
                }
            }
        });
        modalInstance.result.then(function (s) {
            if (s.type == 'ok') {
                $scope.dataJson[relaIdx] = s.data;
                console.log('$scope.dataJson=', $scope.dataJson);
                // $scope.dataJson.splice(relaIdx,1);//凡是修改后的关联关系都放到最后
                // $scope.dataJson.push(s.data);
                //
                // let currTbChildren=angular.copy($scope.tableRelat[currTb]);//当前表的孩子表都重新放到最后面
                //   console.log('xxxxxxxxxx=====currTbChildren=',currTbChildren);
                // let currTbChildsIdx=[];
                // if(currTbChildren){
                //     currTbChildren.map(function (itemObj,ix) {
                //         $scope.dataJson.map(function (relatObj,idx) {
                //             if((relatObj.item+'__'+ix)==itemObj){
                //                 currTbChildsIdx.push({'idx':idx,'relatObj':relatObj});
                //             }
                //         })
                //     });
                // }
                // console.log('xxxxxxxxxxxxxx======currTbChildsIdx=',currTbChildsIdx);
                // currTbChildsIdx.map(function (itemObj) {
                //     $scope.dataJson.splice(itemObj.idx,1);
                //     $scope.dataJson.push(itemObj.relatObj);
                // });
                // console.log('xxxxxxxxxx=====$scope.dataJson=',$scope.dataJson);

                $scope.genMapByDataJson();
                $scope.getGridColumn();
            }
        });
    };
    /*
  *保存当前配置
  */
    $scope.save = function () {
        if (!$scope.advance && $scope.dataJson.length == 0) {
            return false;
        }
        if ($scope.advance && $scope.customsql == '') {
            return false;
        }
        //检查是否有非法的表头(title中含有.、$、@等符号)，根据用户选择来判断是否替换特殊字符
        let illegalTitleCount = 0;
        $scope.datagrid.columns.map(function (colObj) {
            if (colObj.title && (colObj.title.indexOf('.') != -1 || colObj.title.indexOf('$') != -1 || colObj.title.indexOf('@') != -1
                || colObj.title.indexOf('&') != -1)) {
                illegalTitleCount += 1;
            }
            if (!colObj.title || colObj.title.trim() == '') illegalTitleCount += 10000//如果有中文title为空
        });
        if (illegalTitleCount > 0) {
            if (illegalTitleCount >= 10000) {
                alert('存在空的列名，请编辑列名！');
                return false;
            }
            // alert('有非法的中文标头' + illegalTitleCount + '个！（中文表头含有 .、$、@、&等符号）');
            if (confirm('有非法的中文标头' + illegalTitleCount + '个！（中文表头含有 .、$、@、&等符号）\n 是否需要用双下划线替换掉这些符号？')) {
                $scope.datagrid.columns.map(function (colObj, index) {
                    if (colObj.title.indexOf('.') != -1) {
                        $scope.datagrid.columns[index].title = $scope.datagrid.columns[index].title.replace(/\./, '__');
                    } else if (colObj.title.indexOf('$') != -1) {
                        $scope.datagrid.columns[index].title = $scope.datagrid.columns[index].title.replace(/\$/, '__');
                    } else if (colObj.title.indexOf('@') != -1) {
                        $scope.datagrid.columns[index].title = $scope.datagrid.columns[index].title.replace(/\@/, '__');
                    } else if (colObj.title.indexOf('&') != -1) {
                        $scope.datagrid.columns[index].title = $scope.datagrid.columns[index].title.replace(/\&/, '__');
                    }
                })
            } else {
                return false;
            }
        }
        //中文title判断结束

        // if($scope.advance){//执行保存可以不查询数据，如果用户配置了列名，查询数据则覆盖了列名
        //   $scope.excuce();
        // }
        var datajson = $scope.dataJson;
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/saveconfig',
            controller: 'saveController',
            backdrop: false,
            resolve: {
                datajson: function () {
                    return datajson;
                },
                pk: function () {
                    return $scope.selectedSource;
                },
                columns: function () {
                    return $scope.datagrid.columns;
                },
                config: function () {
                    return $scope.config;
                },
                sql: function () {
                    return $scope.customsql;
                },
                advance: function () {
                    return $scope.advance;
                }
            }
        });
        modalInstance.result.then(function (redirectUrl) {
            hideLoading();
            if (redirectUrl && redirectUrl['redirUrl'] && redirectUrl['redirUrl'] != 'continueEdit') {
                window.location.href = redirectUrl['redirUrl'];
            }
        });
    };
    $scope.setColumn = function () {
        // if($scope.advance){
        //     alert('请使用sql的as语句给列起别名!');
        //     return;
        // }
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/columnsModle',
            controller: 'columnsController',
            backdrop: false,
            resolve: {
                columns: function () {
                    return $scope.datagrid.columns;
                }
            }
        });
        modalInstance.result.then(function (s) {
            $scope.datagrid.columns = s;
        });
    };

    $scope.editcolumn = function (opertation_type) {
        $scope.olditem = angular.copy($scope.contextmenu_th_item);
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/columnsEditModle',
            controller: 'columnsEditController',
            openedClass: 'modal-open wh-700 edit_column',
            backdrop: false,
            resolve: {
                column: function () {
                    return $scope.olditem;
                },
                sourceid: function () {
                    return $stateParams.id;
                },
                databaseid: function () {
                    return $scope.selectedSource;
                },
                columns: function () {
                    // return angular.copy($scope.datagrid.columns);//直接传这个，会在点击弹出框保存后引用方式修改值，导致此contrller也修改
                    return $scope.datagrid.columns;//直接传这个，会在点击弹出框保存后引用方式修改值，导致此contrller也修改
                },
                operation_type: function () {
                    return opertation_type;
                }
            }
        });
        modalInstance.result.then(function (s) {
            //对用户点添加的字典字段修改为varchar类型，默认是olditem的类型，有可能是float或int类型
            for(let i = 0;i < $scope.datagrid.columns.length; i++){
                if ($scope.datagrid.columns[i]['datadict'] && $scope.datagrid.columns[i]['datadict']['table']) {
                    $scope.datagrid.columns[i]['type'] = 'varchar';
                }
            }

            if (s['status'] != 'cancel') {
                // $scope.olditem =  $scope.contextmenu_th_item;
                // $scope.datagrid.columns[$scope.contextmenu_th_key] = angular.copy($scope.olditem);
                // $scope.getGridData(1);
                $scope.getRowData();
            }
        });
    };
    $scope.isstrethc = false;
    $scope.strethobj = {
        x: 0,
        y: 0
    };
}]).directive('renderFinish', function ($timeout) {      //renderFinish自定义指令/*主控制器监听dom加载完成事件*/
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    };
});

app.controller('dataController', function () {

});

/*自定义sql页面*/
app.controller('selfDesignSqlController', function ($scope, $http, $uibModalInstance, $uibModal, $timeout, databaseid, sqlStr, sourceid) {
    if (sqlStr) {
        $scope.sqlStr = sqlStr;
    } else {
        $scope.sqlStr = '';
    }
    $scope.ok = function () {
        if ($scope.sqlStr != '' && databaseid != '') {
            $http({
                method: 'POST',
                url: '/api/source/sourceSqlColumn',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    sql: $scope.sqlStr,
                    pk: databaseid,
                    sourceid: sourceid     //这里如果是编辑就有sourceid如果是新增则为''
                }
            }).success(function (rs) {
                // console.log('----rs----',rs);
                if (rs.code == '1') {
                    $uibModalInstance.close({'status': 'success', 'sql': angular.copy($scope.sqlStr), 'columns': rs.lists});
                } else {
                    alert(rs.data)
                }
            })
        }
    };
    $scope.previewSqlData = function () {
        if ($scope.sqlStr != '' && databaseid != '') {
            //执行sql并弹出框显示执行结果
            $http({
                method: 'POST',
                url: '/api/source/sqlStrExecute',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    databaseid: databaseid,
                    sqlStr: $scope.sqlStr,
                    pageCount: 1000
                }
            }).success(function (rs) {
                if (rs.status == 'success') {
                    $scope.buildTableDataShow(rs.columnName, rs.data);
                } else {
                    alert(rs.data)
                }
            })
        }
    }
    $scope.buildTableDataShow = function (columnName, data) {
        $("body").mLoading();
        let modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/previewSqlDataPage',
            controller: 'previewSqlDataController',
            backdrop: false,
            resolve: {
                columnName: function () {
                    return columnName;
                },
                data: function () {
                    return data;
                }
            },
        });
        modalInstance.result.then(function (rs) {
        });
    }
    $scope.cancel = function () {
        $uibModalInstance.close('cancel');
    };
    // $timeout(function () {//添加拖拽效果
    //   addDragToDialog();
    // });
    addDragToDialog();
});

//通过targetText返回css长度，中文14px，英文10px
function getCssLenByText(targetText) {
    var reg = /[\u4e00-\u9fa5]/g;
    var chineseStr = "";
    var englishStr = "";
    if (targetText != null && targetText != "") {
        chineseStr = targetText.match(reg);
        chineseStr = chineseStr ? chineseStr.join("") : "";
        englishStr = targetText.replace(reg, "");
    }
    return chineseStr.length * 14 + englishStr.length * 10;
}

/*预览sql结果集页面*/
app.controller('previewSqlDataController', function ($scope, $http, $uibModalInstance, $timeout, columnName, data) {
    $scope.columnName = columnName;
    $scope.data = data;
    $scope.lastTitleLen = [];

    if (columnName) {
        if (typeof(columnName) == typeof('hereisstring')) {
            columnName = JSON.parse(columnName);
        }
        columnName.forEach(function (value) {
            var textLen = getCssLenByText(value.title);
            if (textLen) {
                textLen = 'min-width:' + textLen + 'px';
            } else {
                textLen = 'min-width:' + 100 + 'px';
            }
            $scope.lastTitleLen.push(textLen);
        })
    }

    $scope.cancel = function () {
        $uibModalInstance.close('cancel');
    };
    $timeout(function () {
        $(".modal-content").draggable({
            cursor: "move",
            handle: '.modal-header'
        });
        $(".modal-content").width(800);
    });
    $("body").mLoading('destroy');//清除遮罩层
});


/** 列编辑窗口控制器 */
app.controller('columnsEditController', function ($scope, $http, $uibModalInstance, $timeout, column, sourceid, databaseid, columns, operation_type) {
    if ('add' == operation_type) {
        var new_column = {};
        var suffix = "";
        var old_colum = column.field;
        if (/([^__]+)$/.test(old_colum)) {
            suffix = RegExp.$1;
        }
        new_column['field'] = old_colum.replace(suffix, 'column') + (columns.length + 1);
        new_column['formatcolumn'] = '';
        new_column['ifshow'] = '1';
        new_column['isedit'] = '0';
        new_column['title'] = new_column['field'];//默认情况下title为字段名
        new_column['type'] = 'float';
        new_column['formula'] = '';
        new_column['iscustom'] = '1';
        new_column['distconfig'] = [];
        new_column['datadict'] = {};
        new_column['datadict']['filter'] = [];
        new_column['datadict']['oldfield'] = old_colum;//需要记录原始字段，因为field属性已经被替换成了xxx_column

        $scope.column = new_column;
    } else {
        $scope.column = column;
    }
    if (typeof($scope.column.datadict) == 'undefined') {
        $scope.column.datadict = {};
    }
    if (typeof($scope.column.datadict.filter) == 'undefined') {
        $scope.column.datadict.filter = [];
    }
    $scope.operation_type = operation_type;
    $scope.columns = columns;
    $scope.column_list = [];

    $scope.distlist = [];
    $scope.disttype = 'local';
    $scope.tips = '0';

    $scope.addDist = function () {
        $scope.column.distconfig.push({
            key: '',
            value: ''
        });
    };
    $scope.addDDtFilter = function () {
        $scope.column.datadict.filter.push({
            'col': '',
            'opera': '',
            'val': '',
            'link': 'and'
        })
    };
    $scope.delfilter = function (key) {
        $scope.column.datadict.filter.splice(key, 1);
    };
    // $scope.showtips = function(){
    //   $scope.tips = '1';
    // }
    // $scope.hidetips = function(){
    //   $scope.tips = '0';
    // }
    //保存列编辑信息
    var result = {};
    $scope.ok = function () {
        if ('add' == operation_type) {
            $scope.columns.push($scope.column);
        }
        result['status'] = 'success';
        $uibModalInstance.close(result);
    };
    $scope.changedisttype = function (type) {
        $scope.disttype = type;
    };
    $scope.cancel = function () {
        result['status'] = 'cancel';
        $uibModalInstance.close(result);
    };
    $scope.delRow = function (key) {
        $scope.column.distconfig.splice(key, 1);
    };
    $scope.set_column = function (val) {
        if (val.indexOf('cancelTempDiv') > -1) {
            $scope.column.formatcolumn = $scope.column.formatcolumn.substr(0, $scope.column.formatcolumn.length - 1);
        } else {
            $scope.column.formatcolumn = $scope.column.formatcolumn + val;
        }
        var s = document.getElementById('formula_list');
        s.style.display = 'none';
    };
    $scope.set_formula = function (formula_str) {
        if (formula_str != null && formula_str != undefined) {
            $scope.column.formula = formula_str;
        }
    };
    $scope.show_column = function (val, oper_type) {
        var symbol_list = '+,-,*,/', s;
        $scope.column_list = [];
        if ((symbol_list.indexOf(val.substr(val.length - 1, 1)) > -1 || (val == '' && oper_type == 'mouse')) && val.indexOf('cancelTempDiv') == -1) {
            var cancelTempDiv = {
                title: '取消选择',
                formatcolumn: 'cancelTempDiv',
                field: 'cancelTempDiv'
            }
            $scope.column_list.push(cancelTempDiv);
            for (var key in $scope.columns) {
                $scope.column_list.push($scope.columns[key]);
            }
            var elem = document.getElementById("format_column");
            var p = kingwolfofsky.getInputPositon(elem);
            s = document.getElementById('formula_list');
            var open_win = $('.edit_column').find('.modal-content');
            s.style.top = p.bottom - open_win.offset().top + 'px';
            s.style.left = p.left - open_win.offset().left + 'px';
            s.style.display = 'inherit';
        } else {
            s = document.getElementById('formula_list');
            s.style.display = 'none';
            /*取出最后一个符号后面的字符
      var suffix="";
      if(/([^\+\-\*\/]+)$/.test(val)){
          suffix=RegExp.$1;
      }

      for (var key in $scope.columns) {
        if ($scope.columns[key].field.indexOf(suffix) > -1) {
          $scope.column_list.push($scope.columns[key])
        }
      }
      */
        }
    };
    //接入其他表以创建数据字典
    $http.get('/api/source/getTables/' + databaseid).then(function (response) {
        var data = response.data;
        if (data.code == "0") {
            $scope.tablelist = data.table;
            $scope.tablecolumns = data.column;
            $timeout(function () {
                $scope.getColumnByTable();
            });
        }
    });
    $scope.getColumnByTable = function () {
        $scope.selectingColmns = [];
        if ($scope.column.datadict.table && $scope.column.datadict.table != '' && $scope.tablecolumns && $scope.tablecolumns.length > 0) {
            $scope.tablecolumns.map(function (val) {
                if (val.table == $scope.column.datadict.table) {//取table对象里的table值做比较
                    $scope.selectingColmns.push(val.Field);
                }
            });
        }
    };
});

app.controller('columnsController', function ($scope, $http, $uibModalInstance, columns) {
    let columnSelectedCount = 0;
    columns.map(function (val, index) {
        if (val.ifshow == "1") {
            columns[index].checked = true;
            columnSelectedCount += 1;
        } else {
            columns[index].checked = false;
        }
    });
    //全选和取消全选
    $scope.selectAll = false;
    if (columnSelectedCount == columns.length) $scope.selectAll = true;
    $scope.doSelectAll = function () {
        console.log('$scope.selectAll=', $scope.selectAll)
        if ($scope.selectAll) {
            columns.map(function (val, index) {
                $scope.columns[index].checked = true;
                $scope.columns[index].ifshow = 1;
            })
        } else {
            columns.map(function (val, index) {
                $scope.columns[index].checked = false;
                $scope.columns[index].ifshow = 0;
            })
        }
    }
    $scope.columns = angular.copy(columns);
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    function autoSelectAllButton() {//检测当选完了所有的字段，全选按钮自动选上
        let currSelectedCount = 0;
        $scope.columns.map(function (value, index) {
            if (value.checked) {
                currSelectedCount += 1;
            }
        })
        if (currSelectedCount == $scope.columns.length) {
            $scope.selectAll = true;
        } else {
            $scope.selectAll = false;
        }
    }

    $scope.fn = function (a, b, checkBoxClick) {
        if (!checkBoxClick) {//if clicked the label
            $scope.columns[a].checked = !$scope.columns[a].checked;
            b = angular.copy($scope.columns[a].checked);
        }
        if (b) {
            $scope.columns[a].ifshow = "1";
            autoSelectAllButton()
        }
        else {
            $scope.columns[a].ifshow = "0";
            autoSelectAllButton()
        }

    };
    $scope.ok = function () {
        columns = angular.copy($scope.columns);
        $uibModalInstance.close($scope.columns);
    };
});


app.controller('saveController', function ($scope, $http, $uibModal, $stateParams, $uibModalInstance, $timeout, datajson, pk, columns, config, sql, advance) {
    //数据类型
    $scope.allDBType = [];
    $http.get('/api/account/info').then(function (response) {
                $scope.config.username = response.data.username;
                $scope.config.nickname = response.data.nickname;//显示昵称而不是账户名

		    });

    function getAllDBType() {//获取所有数据类型
        $http.get('/api/source/getChartTypes').then(function (response) {
            $scope.allDBType = response.data.charttypes;
        });
    };
    getAllDBType();//获取所有类型

    $scope.config = angular.copy(config);
    //
    $scope.clickDisRights = true;//设置按钮可点击事件
    $scope.$watch('config.title + config.datatype', function () {
        if ($scope.config.conntype && $scope.config.title && $scope.config.title.trim() &&
            $scope.config.datatype && $scope.config.datatype.trim()) {
            $scope.clickDisRights = false;
        } else {
            $scope.clickDisRights = true;
        }
    }, true);

    $scope.ok = function (exetype) {
        if ($scope.clickDisRights || !$scope.config.title || $scope.config.title == '' || !$scope.config.title.trim()) {//检查空格
            alert("名称和类型为必填项！");
            return;
        }
        showLoading();
        $http({
            method: 'POST',
            url: '/api/source/saveConfig',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                datajson: datajson,
                pk: pk,
                info: $scope.config,
                column: columns,
                advance: advance,
                sql: sql,
                username: $scope.config.username
            }
        }).success(function (rs) {
            if (rs.code == 1) {
                configid = rs.id;

                // if($stateParams && $stateParams.id && $stateParams.id!=''){
                //     refreshPage();
                // }else{
                //     window.location.href='/dashboard/dataIndex#/add/'+rs.id+'?currtime='+Date.parse(new Date());
                // }
                let redirectUrl = '';
                if (exetype == 'edit') {
                    redirectUrl = 'continueEdit';
                } else if (exetype == 'add') {
                    redirectUrl = '/dashboard/dataIndex#/add/';
                } else if (exetype == 'list') {
                    redirectUrl = '/dashboard/dataIndex#/list';
                } else if (exetype == 'next') {
                    if ($scope.config.conntype == '1' || $scope.config.conntype == 1) {
                        redirectUrl = '/dashboard/olapanalysis';
                    } else {
                        redirectUrl = '/dashboard/chartdesign';
                    }
                } else {
                    alert('执行操作步骤不明确！');
                }
                $uibModalInstance.close({redirUrl: redirectUrl});
            }
            else {
                alert('保存失败');
            }
        });
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    // $timeout(function () {//添加拖拽效果
    //     addDragToDialog();
    // });

    $scope.changeTpCallBackFun = function () {
        if ($scope.config.datatype == 'new') {
            createType();
        }
    };

    function createType() {
        $scope.config.datatype = '';
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/createDTType',
            controller: 'createTypeController',
            backdrop: false,
            resolve: {
                allDBType: function () {
                    return $scope.allDBType;
                }
            }
        });
        modalInstance.result.then(function (rs) {
            if (rs.type == 'save') {
                $scope.config.datatype = rs.data.id;
                getAllDBType();//获取所有类型
            }
        });
    }
});

app.controller('createTypeController', function ($scope, $uibModalInstance, $timeout, allDBType) {
    $scope.type = {};
    $scope.type.id = 0;
    $scope.type.parent_id = 0;
    $scope.type.parent_name = '';
    $scope.type.level = 1;
    $scope.type.orderby = 1;
    $scope.type.status = '1';
    $scope.parentNames = allDBType;

    $scope.ok = function () {
        var data = $("#editType").serialize();
        $.ajax({
            url: '/api/type/savetype',
            type: 'POST',
            data: data
        }).then(function (rs) {
            if (rs.status == '1') {
                $uibModalInstance.close({'type': 'save', 'data': rs.data});
            }
            else {
                alert(rs.msg);
            }
        });
    }
    $scope.cancel = function () {
        $uibModalInstance.close({'type': 'cancel', 'data': ''})
    }
    // $timeout(function () {
    //     addDragToDialog();
    // });
});

app.controller('renameController', function ($scope, $http, $uibModalInstance, list, pk) {
    $scope.oldlist = list;
    $scope.list = list;
    $scope.ok = function () {
        $http({
            method: 'POST',
            url: '/api/source/changeView',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                data: $scope.list,
                pk: pk
            }
        }).success(function (rs) {
            if (rs.code == 1) {
                $uibModalInstance.close('save');
            }
        });
    };
    $scope.cancel = function () {
        $scope.list = $scope.oldlist;
        $uibModalInstance.close('cancel');
    };
    // $timeout(function () {//添加拖拽效果
    //     addDragToDialog();
    // });
    addDragToDialog();
});
app.controller('relationController', function ($scope, $http, $uibModalInstance, mainTbName, currTbName, allTbCols, currRelation, allJoinIcon, openway, pk) {
    $scope.joinChText = {
        'left join': '左关联',
        'right join': '右关联',
        'inner join': '内联',
        'outer join': '外联',
    };
    $scope.allJoinIcon = allJoinIcon;
    $scope.currTableName = currTbName;
    $scope.relationObj = currRelation;

    //获取所有可选的关联字段让用户选择，需要去除当前表的字段
    $scope.allcolumnlist = new Array();//将allTbCols的数据赋值给$scope.allcolumnlist
    if (mainTbName != currTbName) {
        //去掉当前表的所有字段
        allTbCols.map(function (itemObj) {
            if (itemObj.table != currTbName) {
                $scope.allcolumnlist.push({
                    'table': itemObj.table,
                    'field': itemObj.Field,
                    'identity': itemObj.table + '___' + itemObj.Field
                });
            }
        });
    } else {
        allTbCols.map(function (itemObj) {
            $scope.allcolumnlist.push({
                'table': itemObj.table,
                'field': itemObj.Field,
                'identity': itemObj.table + '___' + itemObj.Field
            });
        });
    }
    $scope.targetColumnObj = []//回显主表字段
    if (currRelation.hasOwnProperty('relation') && currRelation.relation.hasOwnProperty('relationdetail')) {
        if (currRelation.relation.relationdetail.length > 0) {
            currRelation.relation.relationdetail.map(function (itemObj) {
                $scope.targetColumnObj.push({
                    'table': itemObj.target,
                    'field': itemObj.targetcolumn,
                    'identity': itemObj.target + '___' + itemObj.targetcolumn
                });
            })
        } else {
            $scope.targetColumnObj.push({'table': '', 'field': '', 'identity': ''});
        }
    }

    $scope.currTbCols = allTbCols.filter(function (itemObj) {
        return itemObj.table == currTbName;
    });

    $scope.changeJoin = function (ev, param) {
        $('.iconSelfDesignStyle img').css('background', 'none');
        $(ev.currentTarget).children('img').css('background', 'skyblue');
        $scope.relationObj.relation['relationtype'] = param;
        $scope.relationObj.relation['joinIcon'] = allJoinIcon[param];
    };
    $scope.addRelation = function () {//新增一个关联字段
        $scope.relationObj.relation.relationdetail.push({
            "target": "",
            "mycolumn": "",
            "targetcolumn": "",
            "relationfunction": ""
        });
    };

    /*删除*/
    $scope.deleteRelationDetail = function (key) {
        // console.log("deleteRelationDetail key=",key);
        $scope.relationObj.relation.relationdetail.splice(key, 1);
        if ($scope.relationObj.relation.relationdetail.length <= 0) {
            $scope.relationObj.relation.relationdetail.push({
                "target": "",
                "mycolumn": "",
                "targetcolumn": "",
                "relationfunction": ""
            });
        }
        $scope.targetColumnObj.splice(key, 1);
        if ($scope.targetColumnObj.length <= 0) {
            $scope.targetColumnObj.push({'table': '', 'field': '', 'identity': ''})
        }
    };
    //监听$scope.relationObj对象的各项值
    $scope.legalSave = false;
    $scope.$watch('relationObj', function (itemObj) {
        if (itemObj.relation.relationtype && itemObj.relation.relationtype != '') {
            if (itemObj.relation.relationdetail.length > 0) {
                let legalStatus = true;
                itemObj.relation.relationdetail.map(function (itemO, indexO) {
                    if (itemO.mycolumn == '' || $scope.targetColumnObj[indexO].feild == '' || itemO.relationfunction == '') {
                        legalStatus = false;
                    }
                });
                if (legalStatus) $scope.legalSave = true;
                else $scope.legalSave = false;
            }
        }
    }, true);
    $scope.ok = function () {
        //需要重新把值传回给relationObj
        if ($scope.relationObj.hasOwnProperty('relation') && $scope.relationObj.relation.hasOwnProperty('relationdetail')) {
            if ($scope.relationObj.relation.relationdetail.length > 0) {
                $scope.targetColumnObj.map(function (itemObj, idx) {
                    $scope.relationObj.relation.relationdetail[idx].target = itemObj.table;
                    $scope.relationObj.relation.relationdetail[idx].targetcolumn = itemObj.field;
                })
            }
        }
        $uibModalInstance.close({type: 'ok', data: $scope.relationObj});
    };
    $scope.cancel = function () {
        $uibModalInstance.close({type: 'cancel', data: $scope.relationObj});
    };
    // $timeout(function () {//添加拖拽效果
    //     addDragToDialog();
    // });
    addDragToDialog();
});

/* 数据源编辑控制器 */
app.controller('configController', function ($scope, $http, $uibModalInstance, connecttype, id, opentype) {
    $scope.configlist = {};
    $scope.configlist.type = connecttype;
    $scope.dialogTitle = connecttype.toUpperCase() + '连接';
    $scope.istest = true;
    $scope.testsuccess = false;
    $scope.configlist.id = '';
    /* 重新上传之前上传的文件 */
    $scope.operaTionType = opentype;
    if (opentype === 'updateFileTable') {
        /**connecttype:上传文件数据存放的表名 */

        // console.log(connecttype);
        // console.log(id);
        /**id:database的id */
    }
    if (opentype === 'edit') {
        $http.get('/api/source/getSourceConfig/' + id).then(function (response) {
            // $scope.lists = response.data.lists;
            $scope.configlist = response.data.config;
        });
    }

    $scope.symbol_type_change = function () {
        $scope.configlist.symbol_input_type = !$scope.configlist.symbol_input_type;
        if ($scope.configlist.symbol_input_type) {
            $scope.configlist.symbol_type = 'tab';
        } else {
            $scope.configlist.symbol_type = '';
        }
    };

    $scope.ok = function () {
        showLoading();
        $.ajax({
            url: '/api/source/saveSource',
            type: 'POST',
            data: $scope.configlist,
        }).done(function (rs) {
            hideLoading();
            if (rs.status == 'success') {
                $scope.msg = rs.msg;
                $scope.testsuccess = true;
                $uibModalInstance.close();
            } else {
                $scope.msg = rs.data;
                $scope.testsuccess = false;
                alert(rs.data);
            }
            $scope.$apply(function () {
                $scope.time = new Date();
            });
        });
    };

    $scope.testingsts = false;
    $scope.test = function () {
        if ($scope.configlist.type != 'odbc') {
            if (!$scope.configlist.database || $scope.configlist.database.trim() == '') {
                alert('请选择数据库名！');
                return;
            }
        }
        $scope.testingsts = true;
        $.ajax({
            url: '/api/source/testPing',
            type: 'POST',
            data: $scope.configlist,
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
        $scope.getDatabase();//编辑的时候需要显示数据库
    };
    $scope.getDatabase = _.debounce(function () {
        if ($scope.type == 'oracle') {
            return false;
        }
        if ($scope.configlist.ip && $scope.configlist.port && $scope.configlist.user_name && $scope.configlist.password && $scope.configlist.ip != '' && $scope.configlist.port != '' && $scope.configlist.user_name != '' && $scope.configlist.password != '') {
            $http({
                method: 'POST',
                url: '/api/source/systemList',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    data: $scope.configlist,
                }
            }).success(function (rs) {
                if (rs.code == "1") {
                    $scope.lists = rs.list;
                    if ($scope.configlist.database != '') {
                        $scope.configlist.database = $scope.configlist.database + "a";
                        $scope.configlist.database = $scope.configlist.database.substr(0, $scope.configlist.database.length - 1);
                    }
                }
            });
        }
        else {
            return false;
        }
    }, 500);
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
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
                tableName: connecttype,
                upload_type: $scope.configlist.upload_type,
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
                $uibModalInstance.close();
                if (!alert('上传成功')) {
                    refreshPage()
                }
                ;//点击alert，刷新页面
            }
        });
    }
    $scope.permupload = false;
    $scope.validfile = function (f) {
        // var upfilepath=f.value;
        var upfilepath = f.files[0].name;
        var fileneed = upfilepath.substring(upfilepath.lastIndexOf(".") + 1);
        // console.log($scope.configlist.type);
        // console.log(fileneed);
        if (!fileneed) {
            $scope.permupload = false;
        } else if ($scope.configlist.type == 'txt' && fileneed != 'txt') {
            $scope.permupload = false;
        } else if ($scope.configlist.type == 'csv' && fileneed != 'csv') {
            $scope.permupload = false;
        } else if ($scope.configlist.type == 'excel') {
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
        tmpfiletyle = $scope.configlist.type;
        if (!tmpfiletyle) {
            alert('文件类型错误！');
            return;
        }
        $http.get('/dashboard/downloadTemplateFile?tpfiletype=' + tmpfiletyle).then(function (rs) {
            if (rs.data.code == 1) {
                var filePath = rs.data.filePath;
                var triggerDownload = $("<a>").attr("href", filePath).attr("download", 'TempFile.' + rs.data.dtfiletype).appendTo("body");
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
        if ($scope.configlist.type == 'excel') {
            excel_nullchreplstr = $scope.configlist.excel_nullchrepl;
            if (uploadFileSName.indexOf('.xlsx') == -1 && uploadFileSName.indexOf('.xls') == -1) {
                alert('请上传规范的excel文件！');
                clearFUTagValue();
                return;
            }
        } else if ($scope.configlist.type == 'txt') {
            if (uploadFileSName.indexOf('.txt') == -1) {
                alert('请上传规范的txt文件！');
                clearFUTagValue();
                return;
            }
        } else if ($scope.configlist.type == 'csv') {
            if (uploadFileSName.indexOf('.csv') == -1) {
                alert('请上传规范的csv文件！');
                clearFUTagValue();
                return;
            }
        } else if ($scope.configlist.type == 'json') {
            if (uploadFileSName.indexOf('.json') == -1) {
                alert('请上传规范的json文件！');
                clearFUTagValue();
                return;
            }
        } else if ($scope.configlist.type == 'xml') {
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
                type: $scope.configlist.type,
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
                $uibModalInstance.close();
                if (!alert('上传成功')) {
                    refreshPage()
                }
                ;//点击alert，刷新页面
            }
        }).error(function () {
            //如果发生错误也需要隐藏遮罩层
            $("body").mLoading('destroy');//遮罩层，用户导入数据后台处理的时候显示
            alert('上传失败！');
        });
    };
    // $timeout(function () {//添加拖拽效果
    //     addDragToDialog();
    // });
    addDragToDialog();
});

app.controller('structureController', function ($scope, $http, $timeout, $uibModalInstance, columns) {
    $scope.cancel = function () {
        $uibModalInstance.close();
    };
    $timeout(function () {
        $("#structure").bootstrapTable({
            columns: [{
                field: 'Field',
                title: '字段'
            }, {
                field: 'name',
                title: '显示名称'
            }, {
                field: 'type',
                title: '类型'
            }],
            data: columns
        });
    });
    // $timeout(function () {//添加拖拽效果
    //     addDragToDialog();
    // });
    addDragToDialog();
});

app.directive('resize', function ($window) {
    return function (scope) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {'h': w.height(), 'w': w.width()};
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

app.directive('tableheight', function ($window) {
    return function (scope) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {'h': w.height(), 'w': w.width()};
        };
        scope.$watch(scope.getWindowDimensions, function () {

            var a = angular.element(document.getElementById('content-bottom'));
            scope.nstyle = function () {
                // return {
                //     'height': (a.height() - 40) + 'px'
                // };
                return {
                    'height': (a.height() - 26) + 'px',
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});
$(function () {
    var isstrethc = false;
    var th = null;
    var spanText = null;
    var tableCellBox = null;//需要修改tableCellBox的宽度
    var tableDataTds = null;//需要修改tableDataTd的宽度
    var strethcobj = {
        x: 0
    };
    $(document).on('mousedown', '.thline', function (e) {
        isstrethc = true;
        th = $(this).closest('th');
        let thIndex = $(th).attr('index');
        tableCellBox = $(this).closest('.sti-tbl-container');
        tableDataTds = $(tableCellBox).find('.tableShowData').find('tr').find('td').eq(thIndex);//需要设置所有td的宽度和th的宽度一致
        spanText = $(th).children('.tableTitleStyle');
        strethcobj = {
            x: e.clientX
        };
    });
    $(document).on('mousemove', function (e) {
        if (isstrethc) {
            if (th) spanText.css('width', '0px');//需要重新调整spanText的宽度，否则会出现spanText在拖动之前处于最后一次拖拽的长度
            x = e.clientX - strethcobj.x;
            var width = th.css('width').replace('px', '');
            let tableCellBoxWidth = 0;
            if (tableCellBox) {
                tableCellBoxWidth = tableCellBox.css('width').replace('px', '');
            }
            let currWidth = Number(width) + Number(x);
            if (currWidth > 200) {//如果小于200就设置为200
                //拖动的时候修改tablebox的宽度再修改拖拽的th的宽度
                if (tableCellBoxWidth > 0) {
                    tableCellBox.css('width', (Number(tableCellBoxWidth) + Number(x)) + 'px');
                }
                th.css('width', currWidth + 'px');
                tableDataTds.css('width', currWidth + 'px');//修改了表头宽度也需要修改表格数据的宽度
                if (th) {
                    spanText.css('width', currWidth + 'px')
                }
                ;
            } else {
                th.css('width', '200px');
                tableDataTds.css('width', '200px');//修改了表头宽度也需要修改表格数据的宽度
                if (th) {
                    spanText.css('width', '200px')
                }
                ;
            }
            strethcobj = {
                x: e.clientX
            };
        }
    });

    $(document).mouseup(function () {
        isstrethc = false;
    });

});