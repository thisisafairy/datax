/**
 * Created by Administrator on 9/19/2017.
 */
var hot;
var defaultOptions = {
    'elementId': 'exampleSheet',
    'tableWidth': '100%',
    'tableHeight': '100%',
    'cellWidth': 100,
    'cellHeight': 25,
    'language': 'zh-CN',
    'minCols': 50,
    'minRows': 50,
}
var dragPositionHeightFix = 20
var dragging;
var hoverCell = {} // hover时的单元格，拖拽用
var selectedCell; // 当前选中的单元格
var tempStyle; // 格式化单元格样式的临时变量
var tempTableData; // 临时变量
var app = angular.module('monitorapp', ['ui.bootstrap', 'ui.router', 'ui.router.state.events', 'ngDragDrop','groupSelect']);
app.config(function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/list');
  $stateProvider.state('list', {
      url: '/list',
      templateUrl: '/dashboard/monitorlist',
      controller: 'listController'
    })
    .state('add', {
      url: '/add/:id',
      templateUrl: '/dashboard/monitoradd',
      controller: 'addController'

    })
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
      }, 4000)
      return res;
    },
    responseError: function (err) {
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

app.controller('listController', function ($http, $scope, $uibModal) {
  $scope.totalItems = 0;
  $scope.currentPage = 1;
  $scope.searchkey = '';
  $scope.monitordetail = '';
  $scope.pageChanged = function () {
    $scope.getdata($scope.currentPage);
  }
   $scope.dragstart = function(item) {
            $scope.clientInfo = item;
        }
  $scope.getdata = function (page) {
    var key = $scope.searchkey;
    var url = '/api/olap/getMonitorList?page=' + page;
    if (key != '') {
      url = encodeURI(url + "&search=" + key);//中文转码，防止ie中文查询不到
    }
    $http.get(url).then(function (response) {
      $scope.monitorlists = response.data.rows;
      $scope.totalItems = response.data.total;
    });
  }
  $scope.getdata(1);

  $scope.search = _.debounce(function () {
    $scope.getdata($scope.currentPage);
  }, 1000);
  //编辑业务规则
  $scope.editmonitor = function (id) {
      $http.get('/api/olap/editmonitor?id=' + id ).then(function (rs) {
      $scope.monitordetail = rs.data.monitordetail;
    });
  }




  $scope.delete_monitor = function (monitor_id) {
    $http({
      method: 'POST',
      url: '/api/olap/monitorDelete',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      data: {
        monitor_id: monitor_id
      }
    }).success(function (rs) {
      if (rs.code == 1) {
        $scope.getdata(1);
      }
    });
  }


});


app.controller('addController', function ($log, $rootScope, $scope, $uibModal, $http, $state, $stateParams,$location) {
    var url = $location.url().split('/')


    var vm = $scope
    vm.sourceList = []
    vm.olaps = []
    vm.dataSourceIds = 'b69128a80a4f11e9a47568f7289a3973'
    vm.selectValue = ''


     //业务规则标题详情
    vm.monitordetail = {
        warning_name: '',           //预警名称
        warning_color: '',          //预警颜色
        addressee:'',               //收件人
        warning_type:'',            //预警类型
        proposal_content: '',       //建议内容
    };
      //业务规则配置详情
    monitorconfig = {
        group_column_left : [],               //分组字段
       calculation_column_left : [],         //计算字段
       filter_condition_left : [],           //过滤条件
       group_column_right : [],
       calculation_column_right : [],
       filter_condition_right : [],
       quick:'',                             //快捷计算
       contrast_mode: '',                    //对比方式
       ordinary_value: '',         //普通值
       is_tarfet: '',              //是否为指标
    }
    //编辑业务规则
    $scope.editmonitor = function (id) {
      $http.get('/api/olap/editmonitor?id=' + id ).then(function (rs) {
          vm.monitordetail = rs.data.monitordetail
          monitorconfig.group_column_left = '商品名称'
          console.log(monitorconfig.group_column_left);

      });
    }
    $scope.editmonitor(url[url.length-1])
    $http.get('/api/dash/getOlaplists').then(function(rs){
        vm.sourceList = rs.data
    })

    //加载olap字段名称
    vm.loadDataRows = function () {
        if (vm.dataSourceIds.length > 1) {

            $http({
            method: 'POST',
            url: '/api/dash/getOlapColumnsByOlapIds',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                ids: vm.dataSourceIds.replace(/\s+/g,'')
            }
        }).success(function (rs) {
            if (rs.status == 'success') {
                vm.olaps = rs.data
            }
        });
        }
    }

    vm.loadDataSourceCols = function () {
        vm.loadDataRows()
    }


    vm.selectValueChange = function () {
    }

    vm.saveReport = function () {
        var data = hot.getSourceData(0, 0, hot.countRows() - 1, hot.countCols() - 1);
    }

    //  拖拽结束
    vm.dragover = function(event) {
        event.preventDefault();
    }
    //拖拽开始
    vm.dragstart = function(item) {
        if (item.hasOwnProperty('name') == true){
            vm.clientInfo = item
            vm.clientname = item.name;
        }
        else{
            vm.clientInfo = '';
            vm.clientname = item ;
        }
    }
    vm.drop = function(event) {
       if (event.target.id == 'group_left'){
           if (vm.clientInfo == ''){
               monitorconfig.group_column_left.push(vm.clientname)
           }else {
               monitorconfig.group_column_left.push(vm.clientInfo)
           }

       }
       if (event.target.id == 'group_right'){
           if (vm.clientInfo == ''){
               monitorconfig.group_column_right.push(vm.clientname)
           }else {
               monitorconfig.group_column_right.push(vm.clientInfo)
           }

       }

       if (event.target.id == 'Calculation_left'){
           if (vm.clientInfo == ''){
               monitorconfig.calculation_column_left.push(vm.clientname)
           }else {
               monitorconfig.calculation_column_left.push(vm.clientInfo)
           }
       }
       if (event.target.id == 'Calculation_right'){
           if (vm.clientInfo == ''){
               monitorconfig.calculation_column_right.push(vm.clientname)
           }else {
               monitorconfig.calculation_column_right.push(vm.clientInfo)
           }
       }

        event.target.value =vm.clientname
        $(event.target).append("<li class='field-item2'>"+ event.target.value +"</li>")
    }
    // 对比方式
    vm.contrast = function ($event) {
        monitorconfig.contrast_mode = event.target.value

    }
    //快捷计算
    vm.quick = function ($event) {
       monitorconfig.quick = event.target.value

    }
    vm.ordinary = function ($event) {
        monitorconfig.ordinary_value = event.target.value
    }

    //检测退格键
     vm.keybordSearch= function(event) {
         var keycode = event.keyCode;
         if (keycode == 8) {
             var div = document.getElementById(event.currentTarget.id);
             div.removeChild(div.childNodes[div.childNodes.length-1])
             if (event.target.id == 'group_left'){
                 monitorconfig.group_column_left.pop()
             }
             if (event.target.id == 'group_right'){
                 monitorconfig.group_column_right.pop()
             }
             if (event.target.id == 'Calculation_left'){
                 monitorconfig.calculation_column_left.pop()
             }
             if (event.target.id == 'Calculation_right'){
                 monitorconfig.calculation_column_right.pop()
             }
         }
     }
  $scope.olaplist = [];
  $http.get('/api/dash/getOlaplists').then(function (rs) {
    $scope.olaplist = rs.data;
  });
  var monitor_id = $stateParams.id;

  $scope.monitor = {
    operation: 'add',
    id: '',
    olapid: '',
    monitortype: '',
    title: '',
    subtitle: '',
    receive_user:'',
    cc_user:'',
    desc: ''
  }



  $scope.ok = function () {
      $scope.saveMonitor()

  }

  //保存业务规则
  $scope.saveMonitor = function () {
    $http({
      url: '/api/olap/saveMonitor',
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      data: {
        configs: monitorconfig,
        details: $scope.monitordetail,
      }
    }).success(function (rs) {
      if (rs.code == '1') {
        alert('保存成功！');
        window.location.href = "/dashboard/monitordata";
      }
    });
  }

  //业务规则列表
  $scope.monitordetailrows = []
  $scope.getMOnitorType = function () {
    $http.get('/api/olap/getMonitorType').then(function (rs) {
      $scope.monitortypes = rs.data;
    });
  }
  $scope.getMOnitorType()
  $scope.getOlap = function () {
    $http.get('/api/dash/getOlaplists').then(function (rs) {
      $scope.olaplist = rs.data;
    });
  }


  //$scope.tabledata = [] 修改代码，暂时弃用
  $scope.columns = []
  //$scope.types = [] 修改代码，暂时弃用
  $scope.setStep = function (step) {
    if (step == 'step2') {
      $scope.step = 'loading';
      $scope.currentolap = {};
      $scope.olaplist.map(function (index) {
        if (index.id == $scope.monitor.olapid) {
          $scope.currentolap = angular.copy(index);
        }
      });
      var url = $scope.currentolap['totalurl'];
      $http.get('/api/dash/getOlapColumnInfo').then(function (rs) {
        //$scope.tabledata = rs.data.data;
        $scope.columns = rs.data.data;
        //$scope.types = dl.type.all(rs.data.data);
        $http.get('/api/getAllUser/').then(function (data) {
          $scope.userlist = data.data.users;
          $scope.step = 'step2';
        })

      });
    } else {
      $scope.step = step;
    }
  }
  $scope.setStep('step2')

  $scope.addMonitortype = function () {
    var modalInstance = $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: '/dashboard/monitortype',
      controller: 'typeController',
      resolve: {}
    });
    modalInstance.result.then(function () {
      $scope.monitor.monitortype = '';
      $scope.getMOnitorType();
    }, function () {});
  }

  //新增业务规则触发条件
  // $scope.add = function () {
  //   $scope.openDetail('');
  // }
  //   $scope.changeOlap = function (olap, rowval) {
  //   $http.get('/api/dash/getOlapColumnInfo/' + olap).then(function (rs) {
  //
  //     $scope.olapCols = rs.data.data;
  //     rowval.eqOlapTable =  rs.data.tableName;
  //   });
  // }


  //编辑业务规则触发条件
  $scope.update_monitor_detail = function (row, rowkey) {
    var conditions = row.condition;
    if (typeof (conditions) == "string") {
      conditions = conditions.replace(/True/g, 'true');
      conditions = conditions.replace(/False/g, 'false');
      conditions = conditions.replace(/None/g, '\'\'');
      conditions = eval('(' + conditions + ')');
    }
    row.condition = conditions;
    $scope.monitordetail = angular.copy(row);
    $scope.openDetail(rowkey);
  }



  $scope.select_user = function (send_type) {
    var modalInstance = $uibModal.open({
      templateUrl: 'select_user_page.html',
      controller: 'userSelectController',
      backdrop: "static",
      controllerAs: 'vm',
      resolve: {
        user_list: function () {
          return $scope.userlist;
        },
        user_select: function () {
          if (send_type == 'mail_to') {
            return $scope.monitordetail.addressee;
          } else {
            return $scope.monitordetail.addressee;
          }
        }
      }
    });
    modalInstance.result.then(function (data) {
      if (send_type == 'mail_to') {
        $scope.monitordetail.addressee = data.select_users;
      } else {
        $scope.monitor.cc_user = data.select_users;
      }
    }, function () {});
  }

});

//拖动控制器
var convertFirstUpperCase = function(str) {
        return str.replace(/(\w)/, function(s) {
            return s.toUpperCase();
        });
    };
    rubyDragEventDirectives = {};
    angular.forEach("dragstart drag dragenter dragover drop dragleave dragend".split(' '), function(eventName) {
        var rubyEventName = 'ruby' + convertFirstUpperCase(eventName);
        rubyDragEventDirectives[rubyEventName] = ['$parse', function($parse) {

            //$parse 语句解析器
            return {
                restrict: 'A',
                compile: function(ele, attr) {
                    var fn = $parse(attr[rubyEventName]);
                    return function rubyEventHandler(scope, ele) {
                        ele[0].addEventListener(eventName, function(event) {
                            if (eventName == 'dragover' || eventName == 'drop') {
                                event.preventDefault();
                            }
                            var callback = function() {
                                fn(scope, { event: event });
                            };
                            callback();
                        });
                    }
                }
            }
        }]
    });
    app.directive(rubyDragEventDirectives);


//选择邮件收件人和抄送人
app.controller('userSelectController', function ($scope, $uibModalInstance, user_list, user_select) {
  user_select = user_select.replace(/'/g,'');
  if (user_select.length > 0) {
    user_select = user_select.split(",");
  } else {
    user_select = [];
  }

  var selected_arr = []
  for (var key in user_select) {
    var selected_obj = {}
    selected_obj['username'] = user_select[key]
    selected_arr.push(selected_obj)
  }
  $scope.users = selected_arr||[];//所有已选
  $scope.allusers = user_list||[];//所有待选
  $scope.selusers = '';//待选区选中的
  $scope.seledusers = '';//已选区选中的
  $scope.ok = function () {
      var users = '';
      for (var i = 0; i < $scope.users.length; i++) {
        users+= "'" + $scope.users[i].username + "',";
      }
      if (users.length > 1) {
        users = users.substring(0,users.length-1)
      }
      $uibModalInstance.close({select_users:users});
  };

  $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
  };

  $scope.add = function () {
      for (var i = 0; i < $scope.selusers.length; i++) {
          var added = false;
          for (var j = 0; j < $scope.users.length; j++) {
              if ($scope.selusers[i].username == $scope.users[j].username) {
                  added = true;
                  break;
              }
          }
          if (added) continue;
          $scope.users.push($scope.selusers[i]);
      }
  };
  $scope.remove = function () {
      var newsels=[];
      for (var i = 0; i < $scope.users.length; i++) {
          var have = false;
          for (var j = 0; j < $scope.seledusers.length; j++) {
              if ($scope.seledusers[j].username == $scope.users[i].username) {
                  have = true;
                  break;
              }
          }
          if (have) continue;
          newsels.push($scope.users[i]);
      }
      $scope.users = newsels;
  };

});

app.controller('detailController', function ($scope, $http, $uibModalInstance, $timeout, id, columns, types, monitordetail, olaplist) {
  $scope.olaplist = olaplist;
  $scope.olapCols = [];
  $scope.olapTable = '';
  $scope.detailrows = angular.copy(monitordetail);
  $scope.columnlist = columns;
  $scope.selectCol = [];
  $scope.eqColName1 = '';
  $scope.emptyRow = {
    column: '',
    columnname:'',
    function: '=',
    value: "",
    link: 'and',
    eqCol: false,
    eqOlap: '',
    eqOlapTable: '',
    eqOlapCol: '',
    eqColName: '',
    joinRow: [{col1:'', aimCol1:'',col2:'', aimCol2:''}],
  };
  //新增的时候重置
  if ((id + '').length == 0) {
    $scope.detailrows.tagname = '';
    $scope.detailrows.color = '';
    $scope.detailrows.issend = '';
    $scope.detailrows.msg_type ='';
    $scope.detailrows.advice_content = '';
    $scope.detailrows.condition_str = '';
    $scope.detailrows.show_condition_str = '';
    $scope.detailrows.prototype_condition_str = '';
    $scope.detailrows.condition = [];
    $scope.options = {
            'groupField': 'olaptype',
            'displayField': 'name',
            'valueField': 'id',
            'multiple': true
        }
    $scope.detailrows.condition.push(angular.copy($scope.emptyRow));
  }
  $scope.setcolumname=function (rowval) {//设置当前column的中文名，以便点击保存后在列表中显示
      rowval.columnname='';
      for(i=0;i<$scope.columnlist.length;i++){
          if($scope.columnlist[i].fullname==rowval.column){
              rowval.columnname=$scope.columnlist[i].title;
          }
      }
  }
  $scope.addRow = function () {
    $scope.detailrows.condition.push(angular.copy($scope.emptyRow));
  }
  $scope.deleteRow = function (key) {
    if (key == '0' && $scope.detailrows.condition.length == 1) {
      $scope.detailrows.condition = [];
      $scope.detailrows.condition.push(angular.copy($scope.emptyRow));
    } else {
      $scope.detailrows.condition.splice(key, 1);
    }
  }
  $scope.checksubval=function(){//校验提交表单的值
    $scope.promiss=false;
    if($scope.detailrows.tagname!="" && $scope.detailrows.tagname.trim()!=""){//校验标签名
      // $scope.promiss=true;
      if($scope.detailrows.issend !=""){//校验是否发送邮箱
          $scope.promiss=true;
      }

    }


    for (var key in $scope.detailrows.condition) {//校验新增规则
          var tempRow = $scope.detailrows.condition[key];
          if(tempRow.eqCol1){//如果是指标则校验eqcolname，否则校验value
              if(tempRow.eqColName1 =="" || tempRow.eqColName1.trim() ==""){//校验生成
                $scope.promiss=false;
              }
          }else{
              if(tempRow.value1 ==undefined || tempRow.value1.trim() ==""){//校验生成
                $scope.promiss=false;
              }
          }
           if(tempRow.eqCol2){//如果是指标则校验eqcolname，否则校验value
              if(tempRow.eqColName2 =="" || tempRow.eqColName2.trim() ==""){//校验生成
                $scope.promiss=false;
              }
          }else{
              if(tempRow.value2 ==undefined || tempRow.value2.trim() ==""){//校验生成
                $scope.promiss=false;
              }
          }
    }
    if(!$scope.promiss){
        alert("请完善表单数据");
        return false;
    }
    return true;
  }
  $scope.ok = function () {
      var ispass=$scope.checksubval();
      if(!ispass)return;//表单校验不通过就停留再当前页面
    $scope.detailrows.color = $('#color').val();
    //需要过滤用户直接点保存的情况
    $uibModalInstance.close({
      status: 'save',
      data: $scope.detailrows,
      id: id
    });
  }
  $scope.cancel = function () {
    $uibModalInstance.close({
      status: 'cancel'
    });
  }

  // $scope.changeOlap = function (olap, rowval) {
  //   $http.get('/api/dash/getOlapColumnInfo/' + olap).then(function (rs) {
  //
  //     $scope.olapCols = rs.data.data;
  //     rowval.eqOlapTable =  rs.data.tableName;
  //   });
  // }



  $scope.changeOlapCol = function (olapCol, rowval, num, selectArea,type) {
      var content = Trim(olapCol[0].title, 'g')
      if (num == 1 && (selectArea == 'ordinary_one' || selectArea == undefined)) {
          if (olapCol.length > 1) {
              rowval.eqOlapCol = [];
              rowval.eqOlapCol.push(olapCol[0]);
              alert('请选择一列');
          } else {
              if (rowval.eqColName1 == undefined) {
                  if (rowval.eqOlapTable != undefined ) {
                      rowval.eqColName1 = content + " ";
                      rowval.prototypeeqColName1 = rowval.eqOlapTable + "." + olapCol[0].fullname + " ";
                  }

              } else {
                  if (rowval.eqOlapTable != undefined) {
                      if (type == 1) {
                          rowval.eqColName1 = truncate(rowval.eqColName1)
                          rowval.prototypeeqColName1 = truncate(rowval.prototypeeqColName1)
                      } else if(type==undefined) {
                          rowval.eqColName1 = rowval.eqColName1 + " " + content + " ";
                          rowval.prototypeeqColName1 = rowval.prototypeeqColName1 + " " + rowval.eqOlapTable + "." + olapCol[0].fullname + " ";

                      }

                  }
              }

          }

      } else if (num == 1 && selectArea == 'ordinary_two') {
          if (olapCol.length > 1) {
              rowval.eqOlapCol = [];
              rowval.eqOlapCol.push(olapCol[0]);
              alert('请选择一列');
          } else {
              if (rowval.ordinary_where1 == undefined) {
                  if (rowval.eqOlapTable != undefined && type == undefined) {
                      rowval.ordinary_where1 = content;
                      rowval.prototypeeqColName1_where = rowval.eqOlapTable + "." + olapCol[0].fullname;
                  }

              } else {

                  if (rowval.eqOlapTable != undefined && type == undefined) {
                      rowval.ordinary_where1 = rowval.ordinary_where1 + " " + content;
                      rowval.prototypeeqColName1_where = rowval.prototypeeqColName1_where + " " + rowval.eqOlapTable + "." + olapCol[0].fullname;
                  }
              }
              if (type == 2) {
                  rowval.ordinary_where1 = "";
                  rowval.prototypeeqColName1_where = "";
              }


          }

      } else if (num == 1 && selectArea == 'senior_one') {
          if (rowval.senior_where1 == undefined) {
              if (rowval.eqOlapTable != undefined && type == undefined) {
                  rowval.senior_where1 = content;
                  rowval.prototypeeqColName1 = rowval.eqOlapTable + "." + olapCol[0].fullname;
              }

          } else {

              if (rowval.eqOlapTable != undefined && type == undefined) {
                  rowval.senior_where1 = rowval.senior_where1 + " " + content;
                  rowval.prototypeeqColName1 = rowval.prototypeeqColName1 + " " + rowval.eqOlapTable + "." + olapCol[0].fullname;
              }
          }


      } else if (num == 1 && selectArea == 'senior_two') {
          if (rowval.senior_group1 == undefined) {
              if (rowval.eqOlapTable != undefined && type == undefined) {
                  rowval.senior_group1 = content;
                  rowval.prototypeeqColName1 = rowval.eqOlapTable + "." + olapCol[0].fullname;
              }

          } else {

              if (rowval.eqOlapTable != undefined && type == undefined) {
                  rowval.senior_group1 = rowval.senior_group1 + " " + content;
                  rowval.prototypeeqColName1 = rowval.prototypeeqColName1 + " " + rowval.eqOlapTable + "." + olapCol[0].fullname;
              }
          }

      } else if (num == 2 && (selectArea == 'ordinary_one' || selectArea == undefined)) {
          if (olapCol.length > 1) {
              rowval.eqOlapCol = [];
              rowval.eqOlapCol.push(olapCol[0]);
              alert('请选择一列');
          } else {
              if (rowval.eqColName2 == undefined) {
                  if (rowval.eqOlapTable != undefined && type == undefined) {
                      rowval.eqColName2 = content + " ";
                      rowval.prototypeeqColName2 = rowval.eqOlapTable + "." + olapCol[0].fullname + " ";
                  }

              } else {
                  if (rowval.eqOlapTable != undefined) {
                      if (type == 1) {
                          rowval.eqColName2 = truncate(rowval.eqColName2)
                          rowval.prototypeeqColName2 = truncate(rowval.prototypeeqColName2)
                      } else if(type == undefined) {
                          rowval.eqColName2 = rowval.eqColName2 + " " + content + " ";
                          rowval.prototypeeqColName2 = rowval.prototypeeqColName2 + " " + rowval.eqOlapTable + "." + olapCol[0].fullname + " ";
                      }

                  }
              }

          }

      } else if (num == 2 && selectArea == 'ordinary_two') {
          if (olapCol.length > 1) {
              rowval.eqOlapCol = [];
              rowval.eqOlapCol.push(olapCol[0]);
              alert('请选择一列');
          } else {
              if (rowval.ordinary_where2 == undefined) {
                  if (rowval.eqOlapTable != undefined && type == undefined) {
                      rowval.ordinary_where2 = content;
                      rowval.prototypeeqColName2_where = rowval.eqOlapTable + "." + olapCol[0].fullname;
                  }

              } else {

                  if (rowval.eqOlapTable != undefined && type == undefined) {
                      rowval.ordinary_where2 = rowval.ordinary_where2 + " " + content;
                      rowval.prototypeeqColName2_where = rowval.prototypeeqColName2_where + " " + rowval.eqOlapTable + "." + olapCol[0].fullname;
                  }
              }
              if (type == 2) {
                  rowval.ordinary_where2 = "";
                  rowval.prototypeeqColName2_where = "";
              }
          }

      }
  }

  $scope.choose = function(rowval,e,num,selectArea){
    if(num==1 && (selectArea== 'ordinary_one' || selectArea== undefined)){
      if(rowval.eqColName1 == undefined){
        rowval.eqColName1 =e.target.innerText;
        rowval.prototypeeqColName1 = e.target.innerText;

      }else {
        var end = rowval.eqColName1.charAt(rowval.eqColName1.length-1)
        if(end == '+' || end == '-' || end == '*' || end == '/' || end == '(' || end == ')' ){
          rowval.eqColName1 =rowval.eqColName1 + " " + e.target.innerText  ;
          rowval.prototypeeqColName1 = rowval.prototypeeqColName1 + " " + e.target.innerText ;

        }else{
          rowval.eqColName1 =rowval.eqColName1 + e.target.innerText ;
          rowval.prototypeeqColName1 = rowval.prototypeeqColName1 + e.target.innerText;
        }

      }

    }else if (num==1 && selectArea== 'ordinary_two'){
       if(rowval.ordinary_where1 == undefined){
        rowval.ordinary_where1 =e.target.innerText;
        rowval.prototypeeqColName1_where = e.target.innerText;
      }else {
        rowval.ordinary_where1 =rowval.ordinary_where1 + e.target.innerText;
        rowval.prototypeeqColName1_where = rowval.prototypeeqColName1_where + e.target.innerText;
      }


    }else if (num==1 && selectArea =='senior_one'){
        if(rowval.senior_where1 == undefined){
          rowval.senior_where1 =e.target.innerText;
          rowval.prototypeeqColName1 = e.target.innerText;
      }else {
        rowval.senior_where1 =rowval.senior_where1 + e.target.innerText;
        rowval.prototypeeqColName1 = rowval.prototypeeqColName1 + e.target.innerText;
      }

    }else if(num==2 && (selectArea== 'ordinary_one' || selectArea== undefined)){
      if(rowval.eqColName2 == undefined){
        rowval.eqColName2 =e.target.innerText;
        rowval.prototypeeqColName2 = e.target.innerText;

      }else {
        var end = rowval.eqColName2.charAt(rowval.eqColName2.length-1)
        if(end == '+' || end == '-' || end == '*' || end == '/' || end == '(' || end == ')' ){
          rowval.eqColName2 =rowval.eqColName2 + " " + e.target.innerText  ;
          rowval.prototypeeqColName2 = rowval.prototypeeqColName2 + " " + e.target.innerText ;

        }else{
          rowval.eqColName2 =rowval.eqColName2 + e.target.innerText ;
          rowval.prototypeeqColName2 = rowval.prototypeeqColName2 + e.target.innerText;
        }

      }
    }else if (num==2 && selectArea== 'ordinary_two'){
       if(rowval.ordinary_where2 == undefined){
        rowval.ordinary_where2 =e.target.innerText;
        rowval.prototypeeqColName2_where = e.target.innerText;
      }else {
        rowval.ordinary_where2 =rowval.ordinary_where2 + e.target.innerText;
        rowval.prototypeeqColName2_where = rowval.prototypeeqColName2_where + e.target.innerText;
      }


    }


  }


  $scope.addJoinRow = function (rowval) {
    rowval.joinRow.push({col1:'', aimCol1:''});
  }

  $scope.delJoinRow = function (rowval, index) {
    rowval.joinRow.splice(index, 1);
    if (rowval.joinRow.length == 0) {
      $scope.addJoinRow(rowval);
    }
  }

  // $timeout(function () {
  //   initColorInput();
  // });



});
//去除字符串空格
function Trim(str,is_global)
  {
   var result;
   result = str.replace(/(^\s+)|(\s+$)/g,"");
   if(is_global.toLowerCase()=="g")
   {
    result = result.replace(/\s/g,"");
    }
   return result;
}
//删除内容(最后一个元素)
function truncate(arr) {
  arr = arr.trim().split(" ");
  var content =''
  for(var i=0;i<arr.length-1;i++){
        content = content + " " + arr[i];
    }
    return content;
}

// function initColorInput() {
//   //$('#color').colorpicker();
//   $(".modal-content").draggable({//添加拖拽功能
//       cursor: "move",
//       handle: '.modal-header'
//   });
// }




app.controller('typeController', function ($scope,$timeout, $http, $uibModalInstance) {
  $scope.ok = function () {
    $http({
      url: '/api/olap/saveMonitorType',
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      data: {
        title: $scope.title,
        desc: $scope.desc
      }
    }).success(function (rs) {
      if (rs.code == '1') {
        $uibModalInstance.close();
      }
    })
  }
  $scope.cancel = function () {
    $uibModalInstance.close();
  }
  $timeout(function () {
    adddragable();
  });
});
function adddragable() {
    $(".modal-content").draggable({
        cursor: "move",
        handle: '.modal-header'
    });
}