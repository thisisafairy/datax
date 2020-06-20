var app = angular.module('kpiapp', ['ui.bootstrap', 'ui.router', 'ui.router.state.events', 'ngDragDrop', 'ui.bootstrap.datetimepicker']);
app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/list');
    $stateProvider.state('list', {
        url: '/list',
        templateUrl: '/dashboard/kpilist',
        controller: 'listController'
    })
        .state('add', {
            url: '/add/:id',
            templateUrl: '/dashboard/kpiadd',
            controller: 'addController'
        })
});
app.factory('HttpInterceptor', ['$q','$rootScope','$timeout', HttpInterceptor]);
function HttpInterceptor($q,$rootScope,$timeout) {
  return {
    request: function (config) {
      // console.log($rootScope);
      $rootScope.ajaxing = true;
      $rootScope.ajaxerror = false;
      $rootScope.ajaxdone = false;
      return config;
    },
    requestError: function (err) {
      // console.log(err);
      $rootScope.ajaxing = false;
      $rootScope.ajaxerror = true;
      return $q.reject(err);
    },
    response: function (res) {
      $rootScope.ajaxing = false;
      $rootScope.ajaxdone = true;
      $timeout(function(){
        $rootScope.ajaxdone = false;
      },4000)
      return res;
    },
    responseError: function (err) {
      // console.log(err);
      if (-1 === err.status) {
        // 远程服务器无响应
      } else if (500 === err.status) {
        // 处理各类自定义错误
      } else if (501 === err.status) {
        // ...
      }
      return $q.reject(err);
    }
  };
}
app.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push(HttpInterceptor);
}]);

app.filter('toCn',function(){
    return function(text) {
        return text == '1'?'启用':'禁用';
    };
});
app.filter('btnText',function(){
    return function(text) {
        return text == '0'?'开启调度':'停止调度';
    };
});
app.controller('listController', function ($http, $scope) {

    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function(){
        $scope.getdata($scope.currentPage);
    }
    $scope.getdata = function(page){
        var key = $scope.searchkey;
        var url = '/api/olap/getKpilists?page='+page;
        if(key != ''){
        url = url+"&search="+key;
        }
        $http.get(url).then(function (response) {
        $scope.lists = response.data.rows;
        $scope.totalItems = response.data.total;
        });
    }
    $scope.getdata(1);
    $scope.search = _.debounce(function(){
        $scope.getdata($scope.currentPage);
    },500);
    $scope.removeRow = function(olap_data){
      var olap_data_id = olap_data.id;
      var a = confirm('是否删除\''+olap_data.name+'\'');
      if(a){
          $http({
            method: 'POST',
            url: '/api/olap/olapDelete',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
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
    $scope.setStatus = function(obj){
        $http({
            method: 'POST',
            url: '/api/olap/setOlapStatus',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
              olap_data_id: obj.id,
              status:obj.status
            }
          }).success(function(rs){
            if (rs.code == 1) {
              $scope.getdata(1);
            }
          });
    };
    $scope.startNow = function(obj){
        // console.log(obj.id);
        $http({
            method: 'POST',
            url: '/api/olap/startOlapNow',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
              olap_data_id: obj.id
            }
          }).success(function(rs){
            if (rs.code == 1) {
                alert("正在执行请等待数据处理！")
              $scope.getdata(1);
            }
          });
    };
});

app.controller('addController', function ($log, $rootScope, $scope, $http, $state, $stateParams, $timeout) {
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
    $scope.openDatePicker = function() {
        $scope.popup1.opened = true;
    };
    //日期控件初始化结束
    $rootScope.ajaxing = false;
    $rootScope.ajaxerror = false;
    $rootScope.ajaxdone = false;
    $scope.form = {
        id: '',
        sourcekey:'0',
        config: {
            columns: [],
            fullcolumns:[],
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
                    key: 'in',
                    value: '在...之中',
                    num: true,
                    str: true,
                    date: false
                }
            ]
        },
        column: [],
        filters: [],
        desc: '',
        name: '',
        table: '',
        dispatch: 0
    }
    $scope.httpstatus = 'info';
    $scope.showmsg = '';
    $scope.msg = '';
    $scope.currentPage = 1;
    $scope.showedit = false;
    $scope.resultlist = [];
    $scope.active_li = 'step1';
    $scope.isPreview = false;
    $scope.form.selectedlists = [];
    $scope.form.toselectlists = [];
    $scope.hasdimension = false;
    $scope.tablevalidatemsg = "表名仅支持小写字母"
    $scope.tableisvalidate = true;
    $scope.hascolumn = false;
    $scope.changestep = function (step) {
        $scope.active_li = step;
    }
    $http.get('/api/source/getSourceList').then(function (response) {
        $scope.sourcelist = response.data.rows;
        if (angular.isNumber(parseInt($stateParams.id)) && $stateParams.id != '0' && $stateParams.id != '') {
            $http.get('/api/olap/kpidetail/' + $stateParams.id).then(function (response) {
                $scope.hasdimension = true;
                $scope.form.sourcekey = response.data.sourceid.toString();
                // $scope.form.selectedlists = response.data.selectedlists;
                $scope.getColumn(function () {
                    $scope.form.statistic = response.data.indicators.function;
                    $scope.form.config.columns.map(function (index) {
                        if (response.data.indicators.fullname == index.fullname) {
                            $scope.form.indicators = index;
                            $scope.form.indicatorname = response.data.indicators.olaptitle;
                        }

                    });
                    $scope.form.config.columns.map(function (index) {
                        for (var s = 0; s < response.data.selectedlists.length; s++) {
                            if (index.fullname == response.data.selectedlists[s].fullname) {
                                $scope.form.selectedlists.push(index);
                            }
                        }
                    });
                    $scope.form.toselectlists = $scope.form.toselectlists.filter(function (index) {
                        return $scope.form.selectedlists.indexOf(index) < 0;
                    });
                });
                // $scope.form.column = response.data.columns;
                $scope.form.filters = response.data.filters;
                $scope.form.name = response.data.name;
                $scope.form.desc = response.data.desc;
                $http.get('/api/olap/getDispatch').then(function (rs) {
                    // $scope.dispatchlists = rs.data.lists;
                    $scope.dispatchlists = rs.data.rows;
                    $scope.form.dispatch = response.data.dispatchid ? response.data.dispatchid : '';
                });
                $scope.form.table = response.data.table;
                $scope.oladtable = response.data.table;
                $scope.form.id = $stateParams.id;
            });
        }
        else {
            $http.get('/api/olap/getDispatch').then(function (rs) {
                // $scope.dispatchlists = rs.data.lists;
                $scope.dispatchlists = rs.data.rows;
            });
        }
    });
    $scope.loadding = false;
    // $scope.$watch('form.indicators', function (newValue, oldValue) {
    //     console.log(newValue, oldValue);
    // });
    $scope.checktextarea=function(){
        var textarea=$scope.form.desc;
        //中文字数统计
        str = (textarea.replace(/\w/g,"")).length;//统计中文，如有需要
        //非汉字的个数
        abcnum = textarea.length-str;
        total = str+abcnum;
        if(total > 50){
            alert("您输入的字数超限！");
            $scope.form.desc=textarea.substr(0,51);
        }
    }
    $scope.getColumn = function (fn) {
        $scope.form.config.columns = [];
        $scope.form.column = [];
        $scope.form.filters = [];
        $scope.loadding = true;
        $http.get('/api/olap/getColumnBySource?id=' + $scope.form.sourcekey).then(function (rs) {
            var columns = rs.data.column;
            $scope.form.config.columns = columns.sort(function (a, b) {
                return a.ifnum - b.ifnum;
            });
            $scope.loadding = false;
            $scope.form.config.fullcolumn = $scope.form.config.columns;
            $scope.form.toselectlists = $scope.form.config.columns;
            $scope.form.selectedlists=[];//当切换column的时候需要更新selectedlists，保证selectedlists里保存的是当前source的column
            if (typeof fn == 'function') {
                fn();
            }
        });
    }

    $scope.removeRow = function () {
        // $scope.form.toselectlists.concat($scope.selectedcolumn);
        $scope.selectedcolumn.forEach(function (element) {
            $scope.form.toselectlists.push(element);
        });
        $scope.form.selectedlists = $scope.form.selectedlists.filter(function (index) {
            return $scope.selectedcolumn.indexOf(index) < 0;
        });
        if ($scope.form.selectedlists.length > 0) {
            $scope.hasdimension = true;
        }
        else {
            $scope.hasdimension = false;
        }
    }

    $scope.editsource = function(e){
        if(e){
          if($scope.form.sourcekey == '0' ){
            return false;
          }
        }
        $scope.showedit = e;
      }
      $scope.editdatasource = function(){
    
    }
    $scope.dosearch = _.debounce(function (s) {
        // console.log($scope.form.config.fullcolumn);
        var data = $scope.form.config.fullcolumn.filter(function (index) {
          return index.title.indexOf(s) >= 0 || index.fullname.indexOf(s) >= 0;
        });
        $scope.form.config.columns = data;
        $scope.$apply(function () {
          $scope.time = new Date();
        });
      }, 500);
    $scope.validatetable = function(){
        $scope.validating = true;
        if($scope.form.table == ''||typeof $scope.form.table == 'undefined'){
            $scope.validating = false;
            return false;
        }
        if($scope.form.table != $scope.oladtable){
            $scope.tablevalidatemsg = "表名仅支持小写字母"
            $scope.form.table = $scope.form.table.toLowerCase();
            $scope.tableisvalidate = true;
            $scope.validate()
        }
        else{
            $scope.tablevalidatemsg = "表名仅支持小写字母"
            $scope.validating = false;
            $scope.tableisvalidate = true;
        }
    }
    $scope.validate = _.debounce(function(){
        $http({
            method: 'POST',
            url: '/api/olap/validatetable',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                name: $scope.form.table,
                id : $scope.form.id
            }
        }).success(function(rs){
            $scope.validating = false;
            if(rs.code != '1'){
                $scope.tablevalidatemsg = rs.msg
                $scope.tableisvalidate = false;
            }
        });
    },1000);
    $scope.goedit = function(){
        window.location.href="/dashboard/dataIndex#/add/"+$scope.form.sourcekey;
    }
    $scope.add = function () {
        // console.log($scope.selectingcolumn);
        for (var i = 0; i < $scope.selectingcolumn.length; i++) {
            $scope.form.selectedlists.push($scope.selectingcolumn[i]);
        }
        $scope.form.toselectlists = $scope.form.toselectlists.filter(function (index) {
            return $scope.selectingcolumn.indexOf(index) < 0;
        });
        if ($scope.form.selectedlists.length > 0) {
            $scope.hasdimension = true;
        }
        else {
            $scope.hasdimension = false;
        }

    }
    $scope.deleteGroup = function (groupkey, itemkey) {
        $scope.form.filters[groupkey].group.splice(itemkey, 1);
        if ($scope.form.filters[groupkey].group.length == 0) {
            $scope.form.filters.splice(groupkey, 1);
        }
    };
    $scope.dropCallback = function () {
        var item = $scope.resultlist[$scope.resultlist.length - 1];
        // console.log(item);
        $scope.form.filters.push({
            group: [
                {
                    col: item.column,
                    table: item.table,
                    title: item.title,
                    model: '=',
                    value: '',
                    linkas: 'and',
                    filtertype: item.filtertype
                }
            ]
        });
    }
    $scope.dropInGroup = function (e, ui, s) {
        var item = $scope.resultlist[$scope.resultlist.length - 1];
        $scope.form.filters[s].group.push({
            col: item.column,
            table: item.table,
            title: item.title,
            model: '=',
            value: '',
            linkas: 'and',
            filtertype: item.filtertype
        });
    }

    $scope.preview = function () {
        $scope.isPreview = !$scope.isPreview;
        // console.log($scope.myForm.$invalid,$scope.hasdimension);
        if ($scope.isPreview == true) {
            $scope.getPreviewData(1);
        }
    }
    $scope.pageChanged = function(s){
        $scope.getPreviewData(s);
    }
    $scope.getPreviewData = function (page) {
        $http({
            method: 'POST',
            url: '/api/olap/previewKpi',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                data: $scope.form,
                page: page
            }
        }).success(function (rs) {
            if (rs.code == 1) {
                $scope.previewlists = rs.lists;
                $scope.totalItems = rs.total.total;
                $scope.form.column = rs.column;
            }
        });
    }



    $scope.closePreview = function () {
        $scope.isPreview = false;
    }

    $scope.save = function () {
        showLoading();
        $http({
            method: 'POST',
            url: '/api/olap/saveKpi',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                data: $scope.form
            }
        }).success(function (rs) {
            if (rs.code == "1") {
                hideLoading();
                $scope.httpstatus = 'success';
                $scope.showmsg = 'active';
                $scope.msg = '保存成功';
                $timeout(function () {
                    $scope.httpstatus = '';
                    $scope.showmsg = '';
                    $scope.msg = '';
                }, 2000);
            }else{
                alert(rs.msg);
            }
        });
    }

});

app.directive('resize', function ($window) {
    return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return { 'h': w.height(), 'w': w.width() };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
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
    }
});

app.directive('contentresize', function ($window) {
    return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {'h': w.height(), 'w': w.width()};
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            // console.log(newValue)
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            scope.contentstyle = function () {
                return {
                    'height': (newValue.h - 130) + 'px'
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    }
});