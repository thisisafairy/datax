var app = angular.module('msgInfos', ['ui.bootstrap']);
app.controller('msgInfosController', function ($scope, $http,$location) {
    //回显数据
     $scope.ordinaryMsg=[];
     $scope.warningMsg=[];
     $scope.errorMsg=[];
    $scope.msg_number = 0;
    $scope.msg_number_warning = 0;
    $scope.msg_number_error =0;
    $scope.currentPage = 1;
    $scope.currentPageWaring = 1;
    $scope.currentPageError = 1;
     $scope.pageChanged = function (msgType) {
         $scope.currentPageWaring = 1;
         $scope.currentPageError = 1;
         $scope.getData($scope.currentPage,'ordinary');

    };
    $scope.pageChangedError = function (msgType) {
        $scope.currentPage = 1;
        $scope.currentPageWaring = 1;
        $scope.getData($scope.currentPageError,'error');
    };
    $scope.pageChangedWaring = function (msgType) {
        $scope.currentPage = 1;
        $scope.currentPageError = 1;
        $scope.getData($scope.currentPageWaring,'waring');
    };
    $scope.msgDel = function(id){
        var reqUrl='/api/dash/msg_delete?id='+id;
        reqUrl = encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            $scope.getData(1,'ordinary');

        })

    }
    id = GetRequest()
    $scope.getData=function (page,msgType) {
        var reqUrl='/api/dash/get_all_msg_info?page='+page+'&msgType='+msgType;
        reqUrl=encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            $scope.ordinaryMsg = resp.data.ordinary_msg;
            $scope.warningMsg = resp.data.warning_msg;
            $scope.errorMsg = resp.data.error_msg;
            $scope.msg_number = resp.data.msg_number;
            $scope.msg_number_warning = resp.data.msg_number_warning;
            $scope.msg_number_error = resp.data.msg_number_error

        });
    };
    $scope.getData(1,'ordinary')

    // $scope.search = _.debounce(function () {
    //     $scope.getdata($scope.currentPage,'ordinary');
    //     $scope.getdata($scope.currentPageWaring,'warning');
    //     $scope.getdata($scope.currentPageError,'error');
    // }, 500);

    $scope.setRead=function (num) {
        var reqUrl='/api/dash/set_read?num='+num;
        reqUrl=encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            location.reload();

        });

    }
    // $scope.exceteRules=function () {
    //     var reqUrl='/api/dash/exceteRules'
    //     reqUrl=encodeURI(reqUrl);
    //     $http.get(reqUrl).then(function (resp) {
    //
    //     });
    //
    // }

});

function GetRequest() {
   var url = location.search; //获取url中"?"符后的字串
   if (url.indexOf("?") != -1) {    //判断是否有参数
      var str = url.substr(1); //从第一个字符开始 因为第0个是?号 获取所有除问号的所有符串
      strs = str.split("=");   //用等号进行分隔 （因为知道只有一个参数 所以直接用等号进分隔 如果有多个参数 要用&号分隔 再用等号进行分隔）
      return strs[1];          //直接弹出第一个参数 （如果有多个参数 还要进行循环的）
   }
}
