/**
 * Created by Administrator on 2017/7/18 0018.
 */

var app = angular.module('olapapp', ['ui.bootstrap', 'ui.router', 'ui.router.state.events', 'ngDragDrop', 'ui.bootstrap.datetimepicker', 'angular-bootstrap-select', 'angular-bootstrap-select.extra', 'ui.sortable']);
app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/list');
    $stateProvider.state('list', {
        url: '/list',
        templateUrl: '/dashboard/olaplist',
        controller: 'listController'
    })
        .state('add', {
            url: '/add/:id',
            templateUrl: '/dashboard/olapadd',
            controller: 'addController'

        });
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
            return $q.reject(err);
        }
    };
}

app.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(HttpInterceptor);
}]);


app.controller('dispatchCtrl', function () {


});

app.filter('toCn', function () {
    return function (text) {
        return text == '1' ? '启用' : '禁用';
    };
});
app.filter('btnText', function () {
    return function (text) {
        return text == '0' ? '开启调度' : '停止调度';
    };
});
app.filter('statusToChinese', function () {
    return function (text) {
        if (text == 'prepare') {
            return '正在排队';
        } else if (text == 'running') {
            return '正在执行';
        } else if (text == 'done') {
            return '成功';
        } else if (text == 'error') {
            return '失败';
        } else {
            return '未知状态！';
        }
    };
});

app.controller('listController', function ($http, $scope, $uibModal) {
    //查找合同类型
    $scope.dtypes = [];
    $scope.dtype = '';
    $http.get('/api/olap/getOlapTypelists').then(function (resp) {
        $scope.dtypes = resp.data.types;
    })

    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function () {
        $scope.getdata($scope.currentPage);
    };
    $scope.getdata = function (page) {
        var key = $scope.searchkey;
        var url = '/api/olap/getOlaplists?page=' + page;
        if (key != '') {
            url = url + "&search=" + key;//中文转码，防止ie中文查询不到
        }
        if ($scope.dtype && $scope.dtype != '' && $scope.dtype.length > 0) {
            strdtypes = '';
            for (var i = 0; i < $scope.dtype.length; i++) {
                if ($scope.dtype[i]) {
                    strdtypes += '\'' + $scope.dtype[i] + '\','   //由于dtype是32为字符串主键，sql查询用in的时候需要加上单引号
                }
            }
            strdtypes = strdtypes.substring(0, strdtypes.length - 1);
            url += "&types=" + strdtypes;
        }
        url = encodeURI(url);
        // console.log('url=',url);

        $http.get(url).then(function (response) {
            // console.log('response.data.rows=',response.data.rows);
            $scope.lists = response.data.rows;
            $scope.totalItems = response.data.total;
        });
    };
    $scope.getdata(1);
    $scope.selChange = function () {
        $scope.getdata(1);
    }
    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 200);

    $scope.removeRow = function (olap_data) {
        var olap_data_id = olap_data.id;
        var a = confirm('是否删除\'' + olap_data.name + '\'');
        if (a) {
            $http({
                method: 'POST',
                url: '/api/olap/olapDelete',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    olap_data_id: olap_data_id
                }
            }).success(function (rs) {
                if (rs.code == 1) {
                    $scope.getdata(1);
                }
            });
        }
    };

    //操作
    $scope.setStatus = function (obj) {
        $http({
            method: 'POST',
            url: '/api/olap/setOlapStatus',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                olap_data_id: obj.id,
                status: obj.status
            }
        }).success(function (rs) {
            if (rs.code == 1) {
                $scope.getdata(1);
            }
        });
    };

    $scope.startNow = function (obj) {
        $http({
            method: 'POST',
            url: '/api/olap/startOlapNow',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                olap_data_id: obj.id
            }
        }).success(function (rs) {
            if (rs.code == 1) {
                alert("正在执行请等待数据处理！")
                $scope.getdata(1);
            }
        });
    };
    //编辑odbc导入的olap
    $scope.editodbcolap = function (obj) {
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/odbcolapedit',
            controller: 'odbcOlapEditController',
            controllerAs: '$ctrl',
            resolve: {
                objvalue: function () {
                    return obj;
                }
            }
        });
        modalInstance.result.then(function (data) {
            if (data == 'success') {
                $scope.getdata(1);
            }
        }, function () {
        })
    }


});


app.controller('odbcOlapEditController', function ($scope, $timeout, $http, $uibModalInstance, objvalue) {
    $scope.odbcolap = {
        id: objvalue.id,
        olapname: objvalue.name,
        desc: objvalue.description,
        sourceid: objvalue.sourceid,
        dtypeid: objvalue.charttypeid,
        tag_config: function () {
            if (typeof(objvalue.tag_config) == 'object') {
                return objvalue.tag_config;
            } else if (typeof(objvalue.tag_config) == 'string') {
                return JSON.parse(objvalue.tag_config.replace(/\'/g, '"'));
            } else {
                return [];
            }
        }()
    };
    $scope.modeltitle = '编辑olap';
    $scope.dtypes = [];//显示所有类型
    $http.get('/api/olap/getOlapTypelists').then(function (resp) {
        $scope.dtypes = resp.data.types;
    });
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $scope.checkconfname = function () {
        console.log('***checkconfname***');
    };
    //数据权限
    $scope.addTag = function () {
        $scope.odbcolap.tag_config.push({
            "tagid": "",
            "columns": ""
        });
    };
    $scope.deleteTag = function (index) {
        $scope.odbcolap.tag_config.splice(index, 1);
    };
    $scope.usertag = [];
    $http.get('/api/account/getUserTag').then(function (rs) {
        $scope.usertag = rs.data.data;
    });
    $scope.columns = [];
    $http.get('/api/olap/getColumnBySource?id=' + objvalue.sourceid).then(function (rs) {
        var columns = rs.data.column;
        $scope.columns = columns.sort(function (a, b) {
            return a.ifnum - b.ifnum;
        });
    });

    //保存
    $scope.ok = function () {
        console.log('$scope.odbcolap=', $scope.odbcolap);
        $http({
            method: 'POST',
            url: '/api/olap/editOdbcOlap',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: $scope.odbcolap
        }).success(function (rs) {
            if (rs.code == '1') {
                $uibModalInstance.close('success');
            } else {
                alert(rs.msg);
            }
        })
    }

});
// $(function(){
//     var mousedown =false;
//     var y = 0;
//     $(".resize-line").mousedown(function(e) {
//         mousedown = true;
//         y = e.clientY;
//     });
//     $(document).mouseup(function(e){
//         mousedown = false;
//         y=0;
//     });
//     $(document).mousemove(function(e){
//         if(mousedown){
//             var movey = y-e.clientY;
//             var downheight = $(".olap-bottom").height();
//             if((downheight+movey) <200){
//                 return false;
//             }
//             $(".olap-bottom").css({
//                 height:downheight+movey
//             });
//             var centerheight = $(".onla-top").height();

//             $(".onla-top").css({
//                 height:centerheight-movey
//             });
//             y = e.clientY;
//         }
//     });
// })
app.directive('resizing', function () {
    return {
        link: function (scope, element) {
            element.on('mousedown', function (e) {
                var disY = e.clientY;
                $(document).on('mousemove', function (ev) {
                    var a = disY - ev.clientY;
                    var bottom = $(".olap-bottom").height();
                    var top = $(".olap-top").height();

                    if (a < 0) {
                        top = top + Math.abs(a);
                        bottom = bottom + Math.abs(a);
                    }
                    else {
                        top = top - a;
                        bottom = bottom + a;
                    }

                    if (top < 200) {
                        return false;
                    }
                    if (bottom < 200) {
                        return false;
                    }
                    $(".olap-bottom").css({
                        height: bottom
                    });
                    $(".olap-top").css({
                        height: top
                    });
                    disY = ev.clientY;
                });
                $(document).on('mouseup', function () {
                    $(document).off();
                });

            });
        }
    };
});
app.controller('addController', function ($log, $rootScope, $scope, $timeout, $http, $state, $stateParams, $uibModal, $sce) {
    $scope.moduleInfo = $sce.trustAsHtml('1、数据接入中编辑或新增的字段目前无法当做过滤条件<br>2、修改带扩展字段的olap后，需要到olap扩展模块重新保存一次<br>3、筛选条件的字段如果是元数据介入后的新增字段，则自动添加到基础字段里');
    $rootScope.ajaxing = false;
    $rootScope.ajaxerror = false;
    $rootScope.ajaxdone = false;
    $scope.endDateOnSetTime = function (a, k, b) {
        var s = moment(a).format("Y-M-D HH:mm:ss");
        $scope.form.filters[k].group[b].value = s;
    };
    //日期控件初始化
    $scope.format = 'yyyy-MM-dd';
    $scope.altInputFormats = ['M!-d!-yyyy'];
    $scope.popup1 = {
        opened: false
    };
    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    $scope.hstep = 1;
    $scope.mstep = 30;
    $scope.openDatePicker = function () {
        $scope.popup1.opened = true;
    };
    //日期控件初始化结束
    $scope.oladtable = '';
    $scope.showedit = false;
    $scope.validating = false;
    $scope.form = {
        config: {
            functionlist: [
                {
                    key: 'max',
                    value: '最大值'
                },
                {
                    key: 'min',
                    value: '最小值'
                },
                {
                    key: 'sum',
                    value: '求和'
                },
                {
                    key: 'group',
                    value: '分组'
                },
                {
                    key: 'avg',
                    value: '平均值'
                }
            ],
            filterlist: [
                {
                    key: '>=',
                    value: '大于等于',
                    num: true,
                    str: false,
                    date: true
                },
                {
                    key: '>',
                    value: '大于',
                    num: true,
                    str: false,
                    date: true
                },
                {
                    key: '<=',
                    value: '小于等于',
                    num: true,
                    str: false,
                    date: true
                },
                {
                    key: '<',
                    value: '小于',
                    num: true,
                    str: false,
                    date: true
                },
                {
                    key: '=',
                    value: '等于',
                    num: true,
                    str: true,
                    date: true
                },
                {
                    key: '!=',
                    value: '不等于',
                    num: true,
                    str: true,
                    date: true
                },
                {
                    key: 'left like',
                    value: '左包含',
                    num: true,
                    str: true,
                    date: false
                },
                {
                    key: 'right like',
                    value: '右包含',
                    num: true,
                    str: true,
                    date: false
                },
                {
                    key: 'like',
                    value: '包含',
                    num: true,
                    str: true,
                    date: false
                },
                {
                    key: 'not like',
                    value: '不包含',
                    num: true,
                    str: true,
                    data: false
                },
                {
                    key: 'in',
                    value: '在...之中',
                    num: true,
                    str: true,
                    date: false
                }
            ],
            orderlist: [
                {
                    key: 'asc',
                    value: '顺序'
                }, {
                    key: 'desc',
                    value: '倒序'
                }
            ],
            columns: [],
            fullcolumn: []
        },
        id: "",
        sourcekey: '0',
        name: '',
        desc: '',
        table: '',
        column: [],
        filters: [],
        dispatch: '0',
        ifexpand: 'false',
        expand: {
            month: '',
            year: '',
            value: [],
            quota: []
        },
        tag_config: []
    };
    $scope.usertag = [];
    $scope.hstep = 1;
    $scope.mstep = 30;
    $scope.hascolumn = false;
    $scope.active_li = "step1";
    $scope.expandstatus = false;
    $scope.changestep = function (li) {
        $scope.active_li = li;
        if (li.indexOf('step') >= 0) {
            let currLabCount = li.split('step')[1];
            let currLiTag = $('#contentresize ul li')[currLabCount - 1];
            if (currLiTag) {
                $("#tagArrow").css('left', (currLiTag.offsetLeft + currLiTag.offsetWidth / 2 - 15) + 'px');
            }
        }
    };
    $scope.currentPage = 1;
    // $scope.changestep =function(li){
    //     $scope.active_li = li ;
    // };
    $scope.isPreview = false;
    $scope.preview = function () {
        //console.log($scope.form.expand.value);
        $scope.isPreview = !$scope.isPreview;
        if ($scope.isPreview == true) {

            $scope.getPreviewData(1);
        }
    };
    $scope.closePreview = function () {
        $scope.isPreview = false;
    };
    $scope.editsource = function (e) {
        if (e) {
            if ($scope.form.sourcekey == '0') {
                return false;
            }
        }
        $scope.showedit = e;
    };
    $scope.editdatasource = function () {

    };

    $scope.goedit = function () {
        window.location.href = "/dashboard/dataIndex#/add/" + $scope.form.sourcekey;
    };

    $scope.addTag = function () {
        $scope.form.tag_config.push({
            "tagid": "",
            "columns": ""
        });
    };

    $scope.deleteTag = function (index) {
        $scope.form.tag_config.splice(index, 1);
    };

    $scope.getPreviewData = function (page) {
        $http({
            method: 'POST',
            url: '/api/olap/previewOlap',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                data: $scope.form,
                page: page ? page : $scope.currentPage
            }
        }).success(function (rs) {
            if (rs.code == 1) {
                $scope.previewlists = rs.lists;
                $scope.totalItems = rs.total.total;
            }
        });
    };
    $scope.pageChanged = function () {
        $scope.getPreviewData();
    };
    $scope.pageChanged = function (s) {
        $scope.getPreviewData(s);
    };
    /*获取所有合同类型的数据来显示在下拉列表里*/
    $scope.getAllChartType = function () {
        $http.get('/api/source/getChartTypes').then(function (response) {
            $scope.charttypes = response.data.charttypes;
        });
    };

    $scope.extCols = [];
    $scope.showExtLabel = false;
    $scope.expandExtCols = false;
    if (angular.isNumber(parseInt($stateParams.id)) && $stateParams.id != '0' && $stateParams.id != '') {
        $http({
            method: 'POST',
            url: '/api/dash/showExtCols',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                mainOlapId: $stateParams.id
            }
        }).success(function (rs) {
            if (rs.status == 'success' && rs.rows.length > 0) {
                $scope.showExtLabel = true;
                $scope.extCols = rs.rows;
            }
            console.log(rs)
        });
    }

    $scope.getAllChartType();
    $http.get('/api/source/getSourceList?olapsource=yes').then(function (response) {
        $scope.sourcelist = response.data.rows;
        if (angular.isNumber(parseInt($stateParams.id)) && $stateParams.id != '0' && $stateParams.id != '') {
            showLoading();

            $http.get('/api/olap/olapdetail/' + $stateParams.id).then(function (response) {
                $scope.form.sourcekey = response.data.sourceid.toString();

                $scope.form.name = response.data.name;
                $scope.form.charttype = response.data.charttype + '';
                $scope.form.desc = response.data.desc;
                $http.get('/api/olap/getDispatch').then(function (rs) {
                    $scope.dispatchlists = rs.data.rows;
                    $scope.form.dispatch = response.data.dispatchid ? response.data.dispatchid : '';
                    // $scope.form.dispatchconfig = response.data.dispatchconfig;
                    $scope.getColumn();
                    $scope.form.column = response.data.columns;
                    $scope.hascolumn = true;
                    $scope.form.filters = response.data.filters;
                    $timeout(function () {
                        $scope.form.ifexpand = response.data.ifexpand;
                        $scope.form.expand = response.data.expand;
                        $scope.form.tag_config = response.data.tag_config;
                    });
                    hideLoading();
                });
                $scope.form.table = response.data.table;
                $scope.oladtable = response.data.table;
                $scope.form.id = $stateParams.id;
            });
        }
        else {
            $http.get('/api/olap/getDispatch').then(function (rs) {
                $scope.dispatchlists = rs.data.rows;
            });
        }
    });
    $scope.loadding = false;
    $scope.getColumn = function (fn) {
        $scope.form.config.columns = [];
        $scope.form.column = [];
        $scope.form.filters = [];
        $scope.loadding = true;
        $http.get('/api/account/getUserTag').then(function (rs) {
            $scope.usertag = rs.data.data;
        });
        $http.get('/api/olap/getColumnBySource?id=' + $scope.form.sourcekey).then(function (rs) {
            //如果是新增就根据选择的数据源来自动生成表名
            if ($stateParams == undefined || $stateParams.id == undefined || $stateParams.id == '') {
                $scope.sourcelist.forEach(function (itemObj) {
                    if (itemObj.id == $scope.form.sourcekey) {
                        $scope.form.table = itemObj.srcdatabase + '__' + new Date().getTime();
                        $scope.validatetable();
                        //根据用户选择的数据源自动勾选类型
                        $scope.form.charttype = itemObj.datatype;
                    }
                });
            }


            var columns = rs.data.column;
            $scope.form.config.columns = columns.sort(function (a, b) {
                return a.ifnum - b.ifnum;
            });
            $scope.form.config.fullcolumn = $scope.form.config.columns;
            $scope.loadding = false;
            if (typeof fn == 'function') {
                fn();
            }
        });
    };
    //获取生成quota的指标
    //生成年份，年份为当前年往前推3年
    $scope.form.quotayears = getQuotaYears(3);
    //显示column，和value一样的显示和使用，在olap计算也和value值一样使用
    //新增一行
    $scope.addQuotaRow = function () {
        $scope.form.expand.quota.push({
            year: '',
            column: '',
            quotavalue: ''
        })
    }
    $scope.delQuotaRow = function (key) {
        if (key == 0 && $scope.form.expand.quota.length == 1) {
            $scope.form.expand.quota = [{
                year: '',
                column: '',
                quotavalue: ''
            }]
        } else {
            $scope.form.expand.quota.splice(key, 1);
        }
    }
    //保存到数据库时需要格式化quota


    $scope.dosearch = _.debounce(function (s) {
        var data = $scope.form.config.fullcolumn.filter(function (index) {
            return index.title.indexOf(s) >= 0 || index.fullname.indexOf(s) >= 0;
        });
        $scope.form.config.columns = data;
        $scope.$apply(function () {
            $scope.time = new Date();
        });
    }, 500);
    /*add the chart select*/
    $scope.charttypeselector = function () {
        if ($scope.form.charttype == '') return;
        if ($scope.form.charttype == 'new') {
            $scope.form.charttype = '';
            $scope.addChartType();
            return;
        }
    }
    $scope.addChartType = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'addChartType.html',
            controller: 'modelTypeController',
            backdrop: "static",
            controllerAs: 'vm',
            resolve: {
                columns: function () {
                    return '';
                }
            }
        });
        modalInstance.result.then(function () {
            /*刷新当前数据*/
            $scope.getAllChartType();
        }, function () {
        });
    }

    $scope.toData = function (row) {
        console.log('row=', row);
        if ($scope.active_li == "step1") {
            //判断是否新增有两种，1.判断column_formula是否有值，2.判断formatcolumn里是否有运算字符
            isAddCol = 0;
            //1.判断column_formula是否有值
            colformulatest = row.column_formula;
            if (colformulatest && colformulatest.trim() != '') isAddCol = 1;
            //过滤特殊字段，这里过滤column_formula里有get_year，get_month，get_day都当作非新增
            fltFormulaList = ['get_year', 'get_month', 'get_day'];
            fltFormulaList.forEach(function (value, index, array) {
                if (value == colformulatest) {
                    isAddCol = 0;
                }
            });
            //2.判断formatcolumn里是否有运算字符
            formatcoltest = row.formatcolumn;
            reg = /[\+\-\*/]/;
            if (formatcoltest != '' && reg.test(formatcoltest)) isAddCol = 1;

            //查看字段里是否已有
            var existed = false;
            $scope.form.column.forEach(function (value, index, array) {
                if (value.col == row.column && value.fullname == row.fullname) {//当前字段已经存在于基础字段中(select字段)
                    existed = true;
                }
            });
            if (!existed) {
                //获取datadict
                var currSrcOptions = row.options;
                var currDataDict = {};
                if (typeof(currSrcOptions) == 'string') {
                    currSrcOptions = JSON.parse(currSrcOptions.replace(/'/g, '"'));
                }
                if ('datadict' in currSrcOptions) {
                    currDataDict = currSrcOptions['datadict'];
                }
                ////获取datadict结束

                $scope.form.column.push({
                    col: row.column,
                    title: row.title,
                    table: row.table,
                    olaptitle: '',
                    order: '',
                    isedit: '0',
                    function: 'group',
                    fullname: row.fullname,
                    newfiledstatus: isAddCol,
                    datadict: currDataDict
                });
                $scope.hascolumn = true;
            }
        }
    };

    $scope.edittitle = function (s) {
        $scope.form.column[s].isedit = '1';
    };

    $scope.edited = function (s) {
        $scope.form.column[s].isedit = '0';
    };


    $scope.deletecolumn = function (key) {
        deleCol = $scope.form.column[key];
        $scope.form.column.splice(key, 1);
        if ($scope.form.column.length == 0) {
            $scope.hascolumn = false;
        }
        //当删除了当前基础字段，也需要删除筛选字段里的
        delfilterkey = new Set();//集合避免2，2这样的情况出现
        $scope.form.filters.forEach(function (value, index, array) {
            console.log('value=', value['group']);
            for (i = 0; i < value['group'].length; i++) {
                if (value['group'][i].col == deleCol.col) {
                    delfilterkey.add(index);
                }
            }
        });
        tempcount = 0;
        delfilterkey.forEach(function (value) {
            $scope.form.filters.splice(value - tempcount, 1);//经典代码，喜欢我不？集合用得好不？逻辑用得遛不？
            tempcount += 1;
        });
    };

    $scope.moveUp = function (key) {//当前对象上移
        if (key <= 0) return;
        let previous = angular.copy($scope.form.column[key - 1]);
        $scope.form.column[key - 1] = $scope.form.column[key];
        $scope.form.column[key] = previous;
        // let movedPosition=$(".olapColumnStyle")[key - 1];
    }
    $scope.moveDown = function (key) {//当前对象下移
        if (key >= $scope.form.column.length - 1) return;
        let next = angular.copy($scope.form.column[key + 1]);
        $scope.form.column[key + 1] = $scope.form.column[key];
        $scope.form.column[key] = next;
        // let movedPosition=$(".olapColumnStyle")[key + 1];
    }
    //拖拽排序
    $scope.arrayColumnOnDrop = function (columnkey, data, event) {
        console.log('columnkey=', columnkey)
        console.log('data=', data)
        console.log('event=', event)
    }
    $scope.arrayColumnOnDrag = function (event, handleObj) {
        console.log('arrayColumnOnDrag event=', event)
        console.log('arrayColumnOnDrag handleObj=', handleObj)

        if (event.target && $(event.target).attr('index-attr') >= 0) {
            let targetObj = event.target;
            console.log('targetObj=', targetObj);
        }
    }
    //拖拽排序options
    $scope.sortableOptions = {
        handle: '> .glyphicon-move',
        // 完成拖拽动作
        stop: function (e, ui) {
            // console.log(' success $scope.form.column= ',angular.copy($scope.form.column));
        }
    }

    $scope.deleteGroup = function (groupkey, itemkey) {
        $scope.form.filters[groupkey].group.splice(itemkey, 1);
        if ($scope.form.filters[groupkey].group.length == 0) {
            $scope.form.filters.splice(groupkey, 1);
        }
    };
    $scope.resultlist = [];
    $scope.dropCallback = function () {

        var item = $scope.resultlist[$scope.resultlist.length - 1];

        //判断拖入的字段是否是新增字段，如果是则加入到基础字段里
        //判断是否新增有两种，1.判断column_formula是否有值，2.判断formatcolumn里是否有运算字符
        isAddCol = false;
        //1.判断column_formula是否有值
        colformulatest = item.column_formula
        if (colformulatest && colformulatest.trim() != '') isAddCol = true;
        //过滤特殊字段，这里过滤column_formula里有get_year，get_month，get_day都当作非新增
        fltFormulaList = ['get_year', 'get_month', 'get_day'];
        fltFormulaList.forEach(function (value, index, array) {
            if (value == colformulatest) {
                isAddCol = false;
            }
        });
        //2.判断formatcolumn里是否有运算字符
        formatcoltest = item.formatcolumn;
        reg = /[\+\-\*/]/;
        if (formatcoltest != '' && reg.test(formatcoltest)) isAddCol = true;


        //如果是新增字段也加入filter的状态里
        $scope.form.filters.push({
            group: [
                {
                    col: item.column,
                    table: item.table,
                    title: item.title,
                    model: '=',
                    value: '',
                    linkas: 'and',
                    filtertype: item.filtertype,
                    newfiledstatus: isAddCol == true ? 1 : 0
                }
            ]
        });
        //如果是则加入到基础字段里
        if (isAddCol) {
            //查看字段里是否已有
            $scope.form.column.forEach(function (value, index, array) {
                if (value.col == item.column) {//当前字段已经存在于基础字段中(select字段)
                    isAddCol = false;
                }
            });
            if (isAddCol) {//如果没有这一步会给python代码带来错误
                sumStatusStr = 'int,float,double,integer,int4,float8';//如果item字段类型为数值类型，则自动设置为求和
                funcStr = 'group';
                if (sumStatusStr.indexOf(item.type)) funcStr = 'sum';
                $scope.form.column.push({
                    col: item.column,
                    title: item.title,
                    table: item.table,
                    olaptitle: '',
                    order: '',
                    isedit: '0',
                    function: funcStr,
                    fullname: item.fullname,
                    newfiledstatus: 1
                });
                alert('请重新确认基础字段各项信息！');
            }
        }

    };
    $scope.dropInGroup = function (e, ui, s) {
        var item = $scope.resultlist[$scope.resultlist.length - 1];
        /////////////start///////////////
        //判断拖入的字段是否是新增字段，如果是则加入到基础字段里
        //判断是否新增有两种，1.判断column_formula是否有值，2.判断formatcolumn里是否有运算字符
        isAddCol = false;
        //1.判断column_formula是否有值
        colformulatest = item.column_formula
        if (colformulatest && colformulatest.trim() != '') isAddCol = true;
        //过滤特殊字段，这里过滤column_formula里有get_year，get_month，get_day都当作非新增
        fltFormulaList = ['get_year', 'get_month', 'get_day'];
        fltFormulaList.forEach(function (value, index, array) {
            if (value == colformulatest) {
                isAddCol = false;
            }
        });
        //2.判断formatcolumn里是否有运算字符
        formatcoltest = item.formatcolumn;
        reg = /[\+\-\*/]/;
        if (formatcoltest != '' && reg.test(formatcoltest)) isAddCol = true;
        ////////////end////////////////
        $scope.form.filters[s].group.push({
            col: item.column,
            table: item.table,
            title: item.title,
            model: '=',
            value: '',
            linkas: 'and',
            filtertype: item.filtertype,
            newfiledstatus: isAddCol == true ? 1 : 0
        });
        //////////start//////////////////
        //如果是则加入到基础字段里
        if (isAddCol) {
            //查看字段里是否已有
            $scope.form.column.forEach(function (value, index, array) {
                if (value.col == item.column) {//当前字段已经存在于基础字段中(select字段)
                    isAddCol = false;
                }
            });
            if (isAddCol) {//如果没有这一步会给python代码带来错误
                sumStatusStr = 'int,float,double,integer,int4,float8';//如果item字段类型为数值类型，则自动设置为求和
                funcStr = 'group';
                if (sumStatusStr.indexOf(item.type)) funcStr = 'sum';
                $scope.form.column.push({
                    col: item.column,
                    title: item.title,
                    table: item.table,
                    olaptitle: '',
                    order: '',
                    isedit: '0',
                    function: funcStr,
                    fullname: item.fullname,
                    newfiledstatus: 1
                });
                alert('请重新确认基础字段各项信息！');
            }
        }
        ///////////end/////////////////
    };
    $scope.dispathchange = function () {
        $http.get('/api/olap/getDispatchRow/' + $scope.form.dispatch).then(function (rs) {
            $scope.dispatchdetail = rs.data.row;
        });
    };
    $scope.tablevalidatemsg = "表名仅支持小写字母数字和下划线";
    $scope.tableisvalidate = true;
    $scope.validatetable = function () {
        $scope.validating = true;
        var myrex = new RegExp("^[a-zA-Z][a-zA-Z0-9_]*$");//以字母开头，仅支持字母、数字、下划线
        // console.log(myrex.test($scope.form.table))
        if (!myrex.test($scope.form.table)) {
            alert("表名以字母开头且仅支持小写字母、数字和下划线");
            $scope.form.table = '';
            $scope.tableisvalidate = true;
            $scope.validating = false;
            return;
        }
        if ($scope.form.table && $scope.form.table != $scope.oladtable && $scope.form.table != '') {
            $scope.tablevalidatemsg = "表名仅支持小写字母数字和下划线";
            $scope.form.table = $scope.form.table.toLowerCase();
            $scope.tableisvalidate = true;
            $scope.validate();
        }
        else {
            $scope.tablevalidatemsg = "表名仅支持小写字母数字和下划线";
            $scope.validating = false;
            $scope.tableisvalidate = true;
        }
    };
    $scope.validate = _.debounce(function () {
        if ($scope.form.table && $scope.form.table == '') {//如果表名为空就不检验
            return;
        }
        $http({
            method: 'POST',
            url: '/api/olap/validatetable',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                name: $scope.form.table,
                id: $scope.form.id
            }
        }).success(function (rs) {
            $scope.validating = false;
            if (rs.code != '1') {
                $scope.tablevalidatemsg = rs.msg;
                $scope.tableisvalidate = false;
            }
        });
    }, 1000);
    $scope.save = function () {
        if ($scope.form.sourcekey && $scope.form.sourcekey.length > 0) {
            if ($("#form-tablename").hasClass('error-input')) {
                $("#form-tablename").focus();
                return false;
            }
            showLoading();
            $http({
                method: 'POST',
                url: '/api/olap/saveOlap',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    data: $scope.form
                }
            }).then(function successCallback(rs) {
                hideLoading();
                if (rs.data.code == 1 || rs.data.code == "1") {
                    //layer.alert('保存成功！');
                    window.location.href = '/dashboard/olapanalysis#/add/' + rs.data.id + '?time=' + new Date().getTime();
                } else {
                    if (rs.data.msg) {
                        alert(rs.data.msg);
                    } else {
                        alert('失败');
                    }
                }
            }, function errorCallback(rs) {
                hideLoading();
                alert('保存失败');
            });
        }
        else {
            return false;
        }
    };

    $scope.addDispatch = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'addDispatch.html',
            controller: 'addDispatchController',
            backdrop: "static",
            controllerAs: 'vm',
            resolve: {
                columns: function () {
                    return '';
                }
            }
        });
        modalInstance.result.then(function (rs) {
            if (rs == 'success') {
                $http.get('/api/olap/getDispatch').then(function (rs) {
                    $scope.dispatchlists = rs.data.rows;
                });
            }
        });
    };

    $scope.$watch(function () {
        return $scope.form.column.length;
    }, function () {
        $scope.form.expand = {
            month: '',
            year: '',
            value: '',
            quota: [{
                year: '',
                column: '',
                quotavalue: ''
            }]
        };
    });

});

app.controller('addDispatchController', function ($log, $rootScope, $scope, $http, $state, $timeout, $stateParams, $uibModalInstance) {

    $scope.dispatch = {};
    $scope.dispatch.desc = '';

    $scope.dispatch = {};
    $scope.dispatch.id = '';
    $scope.format = 'yyyy/MM/dd';
    $scope.altInputFormats = ['M!/d!/yyyy'];
    $scope.popup1 = {
        opened: false
    };
    $scope.dateOptions = {
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };
    $scope.hstep = 1;
    $scope.mstep = 30;
    // function disabled(data) {
    //     var date = data.date,mode = data.mode;
    //     console.log(data);
    //     return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
    // }
    $scope.open1 = function () {
        $scope.popup1.opened = true;
    };

    $scope.save = function () {
        // return false;
        $http({
            method: 'POST',
            url: '/api/olap/saveDispatch',
            headers: {'X-CSRFToken': getCookie('csrftoken')},
            data: {
                data: $scope.dispatch
            }
        }).success(function (rs) {
            if (rs.code == 1) {
                alert('保存成功!');
                $uibModalInstance.close('success');
            }
        });
    };
    $scope.$watch('dispatch.time', function (newValue) {
        $scope.dispatch.shorttime = moment(newValue).format("HH:mm");
        // console.log($scope.dispatch.shorttime);
    });
    $scope.dispatch.time = new Date();
    $scope.$watch('dispatch.once.date', function (newValue) {
        $scope.dispatch.onceshortdate = moment(newValue).format("Y-M-D");
    });

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
                    'height': (newValue.h - 40) + 'px'
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});

app.directive('contentresize', function ($window) {
    return function (scope) {
        var w = angular.element($window);
        var hh = document.getElementById('contentresize').offsetHeight;
        //console.log(hh);
        scope.getWindowDimensions = function () {
            return {'h': w.height(), 'w': w.width(), 'hh': hh};
        };
        scope.$watch(scope.getWindowDimensions, function (newValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;

            scope.contentstyle = function () {
                return {
                    'height': (newValue.h - 141) + 'px'
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});
app.controller('modelTypeController', function ($scope, $timeout, $http, $uibModalInstance) {
    $scope.type = {};
    $scope.type.id = 0;
    $scope.type.parent_id = 0;
    $scope.type.parent_name = '';
    $scope.type.level = 1;
    $scope.type.orderby = 1;
    $scope.type.status = '1';
    // if(id === 0&&parent_id===0){
    //   $scope.type.id = 0;
    //   $scope.type.parent_id = 0;
    //   $scope.type.parent_name = '无';
    //   $scope.type.level = 1;
    //   $scope.type.orderby = 1;
    //   $scope.type.status = '1';
    // }
    // if(id === 0 && parent_id !== 0){
    //   $scope.type.id = 0;
    //   $scope.type.parent_id = parent_id;
    //   $scope.type.parent_name = parent_name;
    //   $scope.type.level = 2;
    //   $scope.type.orderby = 1;
    //   $scope.type.status = '1';
    // }
    // if(id !== 0){
    //   $scope.type.id = id;
    //   $http.get('/api/type/getTypeDetail/'+id).then(function(rs){
    //       $scope.type.type_name = rs.data.type_name;
    //       $scope.type.parent_id = rs.data.parent_id;
    //       $scope.type.parent_name = rs.data.parent_name;
    //       $scope.type.level = rs.data.level;
    //       $scope.type.orderby = rs.data.orderby;
    //       $scope.type.status = rs.data.status;
    //   });
    // }
    $scope.ok = function () {
        var data = $("#editType").serialize();
        $.ajax({
            url: '/api/type/savetype',
            type: 'POST',
            data: data
        }).then(function (rs) {
            //console.log(rs);
            // rs = JSON.parse(rs);
            if (rs.status == '1') {
                $uibModalInstance.close();
            }
            else {
                alert(rs.msg);
            }
        });
    };
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

//add 20180330
function getQuotaYears(count) {
    var date = new Date();
    var year = date.getFullYear();
    var years = new Array();
    for (i = 0; i < count; i++) {
        years[i] = year - i;
    }
    return years;
}

Array.prototype.in_array = function (e) {
    for (i = 0; i < this.length; i++) {
        if (this[i] == e)
            return true;
    }
    return false;
}