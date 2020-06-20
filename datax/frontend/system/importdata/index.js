var app = angular.module('importconfig', ['ui.bootstrap']);
app.controller('importconfigController', function ($scope, $http) {
    //回显数据
    $scope.impFileList=[];
    $scope.searchkey='';
    $scope.getData=function () {
        var reqUrl='/api/dash/getImportAllData';
        if($scope.searchkey){
            reqUrl+='?searchkey=';
        }
        reqUrl=encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            if(resp.data.code=='1'){
                $scope.impFileList=resp.data.data;
            }else{
                $scope.msg=resp.msg;
            }
        });
    };
    $scope.getData();

    $scope.usableBtn=false;
    $scope.msg='';
    $scope.validfile=function (f) {
        $scope.usableBtn=false;//每次校验文件都禁用button
        $scope.msg='';
        if(f.files[0]){
            var uploadFilePath=f.files[0].name;
            var fileNeed=uploadFilePath.substring(uploadFilePath.lastIndexOf('.')+1);
            if(fileNeed && fileNeed=='json'){
                $scope.usableBtn=true;
            }else{
                $scope.msg='上传文件类型错误！请重新上传!';
            }
        }
        else{
            $scope.msg='请选择上传文件！';
        }
    };

    //导入（文件校验通过后）
    $scope.uploadPkFile=function () {
        uploadfile=document.getElementById('importDataFile').files[0];
        if(uploadfile==''||uploadfile==undefined){
            return;
        }
        if(!$scope.usableBtn)return;
        $http({
            method:'POST',
            url:'/api/dash/uploadPkgConf',
            data:{
                filename:uploadfile
            },
            headers: {
                'Content-Type': undefined,
                'X-CSRFToken': getCookie('csrftoken')
            },
            transformRequest: function (data) {
                var formData = new FormData();
                angular.forEach(data, function (value, key) {
                    formData.append(key, value);
                });
                return formData;
            }
        }).success(function (resp) {
            console.log('resp====',resp);
            if(resp.code=='1'){
                $scope.getData();
                //显示logs给用户
                rsDt=resp;
                logsshow='';
                themelogs='';
                if(rsDt['themelogs']!=undefined){
                    themelogs=rsDt['themelogs'].join()
                }
                logsshow+='导入主题为：'+themelogs+'\n';
                scenelogs='';
                if(rsDt['scenelogs']!=undefined){
                    scenelogs=rsDt['scenelogs'].join()
                }
                logsshow+='导入场景为：'+scenelogs+'\n';
                chartlogs='';
                if(rsDt['chartlogs']!=undefined){
                    chartlogs=rsDt['chartlogs'].join()
                }
                logsshow+='导入图表组件为：'+chartlogs+'\n';
                datatablelogs='';
                if(rsDt['datatablelogs']!=undefined){
                    datatablelogs=rsDt['datatablelogs'].join()
                }
                logsshow+='导入表格组件为：'+datatablelogs+'\n';
                olaptablelogs='';
                if(rsDt['olaptablelogs']!=undefined){
                    olaptablelogsobj=rsDt['olaptablelogs'];
                    olaptablelogsobj.forEach(function (value) {
                        if(value['tablename']!=undefined){
                            olaptablelogs+='表名：'+value['tablename'];
                        }
                        if(value['realDtCount']!=undefined){
                            olaptablelogs+=' 数据条数：'+value['realDtCount'];
                        }
                        olaptablelogs+='\n';
                    })
                }
                logsshow+='导入表格为：'+olaptablelogs+'\n';
                $('#logsshow').val(logsshow);
            }else{
                alert(resp.data.msg);
            }
        }).error(function (data) {
            console.log('data=',data);
        })
    }
    //点击下载按钮
    $scope.downLoadFile=function (impFile) {
        var filePath = '/'+impFile.fileUrl;//需要添加/来相对根目录下载
        fileSuff=filePath.substring(filePath.lastIndexOf('.'));//得到值为.json
        if(impFile=='' || fileSuff=='')return;
        var triggerDownload = $("<a>").attr("href", filePath).attr("download",
            "配置包-" + dateFtt("yyyy年MM月dd日hh时mm分", new Date())+fileSuff).appendTo("body");
        triggerDownload[0].click();
        triggerDownload.remove();
    }
    $scope.delete=function (impFile) {
        delCheck=confirm('确定要删除'+impFile.fileName+'?');
        if(delCheck){
            $http.get('/api/dash/delUploadConf?id='+impFile.id).then(function (resp) {
                if(resp.data.code=='1'){
                    $scope.getData();
                }else{
                    alert(resp.data.msg);
                }
            })
        }
    }


});
/**************************************时间格式化处理************************************/
function dateFtt(fmt, date) { //author: meizz
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
