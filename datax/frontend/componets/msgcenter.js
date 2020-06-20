var app = angular.module('msgI', ['ui.bootstrap']);
app.controller('msgInfoController', function ($scope, $http,$location) {
    //回显数据
     $scope.msgInfos=[];
    $scope.totalItems = 0;
    $scope.currentPage = 1;
     $scope.pageChanged = function () {
        $scope.getData($scope.currentPage);
    };
    id =  GetRequest()['id']
    mark = GetRequest()['mark']
    $scope.getData=function () {
        var reqUrl='/api/dash/get_message_info?id='+id+"&mark="+mark;

        reqUrl=encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            $scope.msgInfos = resp.data

        });
    };
     $scope.getData();
});
//
// function GetRequest() {
//    var url = location.search; //获取url中"?"符后的字串
//    if (url.indexOf("?") != -1) {    //判断是否有参数
//       var str = url.substr(1); //从第一个字符开始 因为第0个是?号 获取所有除问号的所有符串
//       strs = str.split("=");   //用等号进行分隔 （因为知道只有一个参数 所以直接用等号进分隔 如果有多个参数 要用&号分隔 再用等号进行分隔）
//       return strs[1];          //直接弹出第一个参数 （如果有多个参数 还要进行循环的）
//    }
// }

function GetRequest() {
        var url = location.search; //获取url中"?"符后的字串
        var theRequest = {};
    if (url.indexOf("?") != -1) {
        var str = url.substring(url.indexOf("?")+1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}