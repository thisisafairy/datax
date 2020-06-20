
var app =  angular.module('grouplist', ['ui.bootstrap','angular-bootstrap-select', 'angular-bootstrap-select.extra']);
app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});
app.controller("roleManagerListCtrl",function ($scope, $http, $uibModal) {
    //查找合同类型,用于增加搜索的精确度
    $scope.dtypes=[];
    $http.get('/api/getChartsTypelists').then(function (resp) {
        $scope.dtypes=resp.data.types;
    })

    //分页参数
    $scope.currentPageNum=10;
    $scope.totalItems={};
    //每页显示条数(默认10条)
    $scope.count="7";
    $scope.page = 1;
    $scope.param = {};
    $scope.data = {}; // 参数
    $scope.data.param = $scope.param;
    $scope.pagination = {};
    $scope.pagination.data = [];

    $scope.queryList = function(page) {
        dtypes=$scope.data.param.dtype;//get传参把list转成str存储到data.dtype方便后台接收数据
        strdtypes='';
        if(dtypes){
            for(var i=0;i<dtypes.length;i++){
                if(dtypes[i]){
                    strdtypes+='\''+dtypes[i]+'\','     //由于dtype是32为字符串主键，sql查询用in的时候需要加上单引号
                }
            }
        }
        strdtypes=strdtypes.substring(0,strdtypes.length-1);
        $scope.data.dtype=strdtypes;

        $scope.data.startIndex = (page - 1) * $scope.count;//分页起始位置
        $scope.data.count = $scope.count;//分页条数
        $scope.data.orderBy = "id ASC";//排序
        // console.log('data=',$scope.data);
        $.ajax({
            url : '/api/getcharts/?format=json',
            type:'GET',
            data : $scope.data
        }).then(function(data) {
            $scope.pagination.data = (data.datas);
            $scope.pagination.data.map(function(item){
                if(typeof item.echartconfig === 'string' && item.echartconfig.length>10){
                    var configJson = JSON.parse(item.echartconfig);
                    item['ectype'] = configJson['data']['type']   ;                 
                }
                else{
                    item['ectype'] = 'vega';
                }
                
            });
            $scope.totalItems= data.totalcount;
            $scope.$apply(function() {
                $scope.time = new Date();
            });
        });
    };
    $scope.queryList($scope.page);
    $scope.selChange=function () {
        $scope.queryList($scope.page);
    }
    $scope.editInfo = function (item) {
        window.location.href="/dashboard/chartdesign?id="+item.id;
     };
     $scope.removeRow = function (item) {
         if(!confirm('您确认要删除吗?'))
            {return;}
         $.ajax({
            url : '/api/delcharts/',
            type:'get',
            data : {id:item.id}
        }).then(function() {
            $scope.queryList($scope.page);
        });
     };
     $scope.personSet = function (item) {
         var modalInstance = $uibModal.open({
                 templateUrl: 'myModalSetP.html',
                 controller: 'ModalInstanceCtrl',
                 backdrop: "static",
                 controllerAs: 'vm',
                 size:'lg',
                 openedClass :'chart-model',
                 resolve: {
                     itemC: function () {
                         return item;
                     }
                 }
             });
             modalInstance.opened.then(function() {// 模态窗口打开之后执行的函数
                // console.log('modal is opened');
             });
             modalInstance.result.then(function () {
                //$scope.queryList($scope.page);
             }, function () {
             });
     };
     $scope.permissionSet = function (item) {
         alert("授权功能暂时关闭！");
        //  $.ajax({
        //     url : '/api/getgroupuser/',
        //     type:'get',
        //     data : {id:item.id}
        // }).then(function(data) {
        //     data["id"] = item.id;
        //     data["name"] = item.name;
        //     data["allowusers"] = item.allowusers;
        //      var modalInstance = $uibModal.open({
        //          templateUrl: 'myModalSetPermission.html',
        //          controller: 'ModalInstanceCtrlSetPermission',
        //          backdrop: "static",
        //          controllerAs: 'vm',
        //          resolve: {
        //              itemC: function () {
        //                  return data;
        //              }
        //          }
        //      });
        //      modalInstance.result.then(function () {
        //         $scope.queryList($scope.page);
        //      }, function () {
        //      });
        // });
     };


     $scope.add = function () {
         window.location.href = "/dashboard/chartdesign";
     };

     $scope.chartSet = function (item) {
         var modalInstance = $uibModal.open({
             templateUrl: 'myModaltest.html',
             controller: 'ModalInstancechart',
             backdrop: "static",
             size:'super-lgs',
             controllerAs: 'vm',
             resolve: {
                 itemC: function () {
                     return item;
                 }
             }
         });
         modalInstance.result.then(function () {
         }, function () {
         });
     }

});

app.controller('ModalInstancechart', function ($scope,$timeout, $uibModalInstance, itemC) {
    $scope.ok = function () {
        //手动刷新获取最新配置
        document.getElementById("configiframe").contentWindow.document.getElementById("refreshbutton").click();
        var configjson = document.getElementById("configiframe").contentWindow.document.getElementById("ecconfigjson").value;
        alert(configjson);
        $uibModalInstance.dismiss('cancel');
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
//$uibModalInstance是模态窗口的实例
app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, $timeout, itemC) {
    $scope.charttype = itemC.charttype;
    $scope.ectype = itemC.ectype;

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    //if(vlconfig.mark=="tick") delete vlconfig.transform;
    //var vgSpec = vl.compile(vlSpec).spec;
    /*vg.util.extend(vlconfig, {"width":400,"height":300});
    vg.util.extend(vlconfig.selection, {"view": {"type": "interval", "bind": "scales"}});
    vg.util.extend(vlconfig.encoding.x,{"axis":{"labelAngle":45, "labelMaxLength":6}});
    var embedSpec = {
        mode: "vega-lite",
        actions: false,
      };
    vega.embed("#vis", embedSpec,function(error, result) {});*/
    var ecconfig  = JSON.parse(itemC.echartconfig);

    $timeout(function(){
        ecconfig.width = '700';
        ecconfig.height = '500';
        buildEchart(ecconfig,$("#ecvis"));
    });
});

app.controller('ModalInstanceCtrlSetPermission', function ($scope,$timeout, $uibModalInstance, itemC) {
    $scope.name = itemC.name||'';//组名
    $scope.users = JSON.parse(itemC.allowusers)||[];//所有已选
    $scope.allusers = itemC.allusers||[];//所有待选
    $scope.selusers = '';//待选区选中的
    $scope.seledusers = '';//已选区选中的
    $scope.ok = function () {
        for (var i = 0; i < $scope.users.length; i++) {
            delete $scope.users[i].$$hashKey;
        }
        $.ajax({
            url : '/api/dash/setchartusers/',
            type:'post',
            data : {id:itemC.id,allowusers:JSON.stringify($scope.users)}
        }).then(function() {
            $uibModalInstance.close();
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.add = function () {
        for (var i = 0; i < $scope.selusers.length; i++) {
            var added = false;
            for (var j = 0; j < $scope.users.length; j++) {
                if ($scope.selusers[i].id === $scope.users[j].id) {
                    added = true;
                    break;
                }
            }
            if (added){
                continue;
            } 
            $scope.users.push($scope.selusers[i]);
        }
    };
    $scope.remove = function () {
        var newsels=[];
        for (var i = 0; i < $scope.users.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledusers.length; j++) {
                if ($scope.seledusers[j].id === $scope.users[i].id) {
                    have = true;
                    break;
                }
            }
            if (have) 
            {
                continue;
            }
            newsels.push($scope.users[i]);
        }
        $scope.users = newsels;
    };
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })

});
