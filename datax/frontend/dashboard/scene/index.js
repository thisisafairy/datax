
var app =  angular.module('grouplist', ['ui.bootstrap','angular-bootstrap-select', 'angular-bootstrap-select.extra']);
app.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});
app.controller("roleManagerListCtrl",function ($scope) {
    //查找合同类型,用于增加搜索的精确度
    $scope.dtypes=[];
    $.ajax({
        url : '/api/getThemeTypelists',
        type:'get'
    }).then(function(resp) {
        $scope.dtypes=resp.types;
    });
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
                    strdtypes+='\''+dtypes[i]+'\','     //因为dtypes是32字符串主键，后台查询in的时候需要加上单引号
                }
            }
        }
        strdtypes=strdtypes.substring(0,strdtypes.length-1);
        $scope.data.dtype=strdtypes;

        $scope.data.startIndex = (page - 1) * $scope.count;//分页起始位置
        $scope.data.count = $scope.count;//分页条数
        $scope.data.orderBy = "id ASC";//排序
        $scope.data.version = '1';
        $.ajax({
            url : '/api/getscenes/?format=json',
            type:'get',
            data : $scope.data
        }).then(function(data) {
            $scope.pagination.data = (data.datas);
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
        window.location.href="/dashboard/boarddesign?id="+item.id;
     };
     $scope.removeRow = function (item) {
         if(!confirm('您确认要删除吗?')){
             return;
         }
         $.ajax({
            url : '/api/delscene/',
            type:'get',
            data : {id:item.id}
        }).then(function() {
            $scope.queryList($scope.page);
        });
     };
     $scope.personSet = function (item) {
         window.open('/bi/index/scene/'+item.id,'_blank');
     };
     $scope.add = function () {
         window.location.href = "/dashboard/boarddesign";
     };
});
//$uibModalInstance是模态窗口的实例
