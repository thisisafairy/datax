var app = angular.module('licenseLogs', ['ui.bootstrap']);
app.controller('licenseLogsController', function ($scope, $http) {
    //回显数据
     $scope.impFileList=[];
    $scope.totalItems = 0;
    $scope.currentPage = 1;
     $scope.pageChanged = function () {
        $scope.getData($scope.currentPage);
    };
    $scope.getData=function (page) {
        var reqUrl='/api/dash/get_imp_licence_logs?page='+page;
        reqUrl=encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            $scope.impFileList=resp.data.rows;
            $scope.totalItems = resp.data.total;


        });
    };
    $scope.getData(1);

    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 500);

    $scope.usableBtn=false;
    $scope.msg='';
    var state = false  //检测是否为xml
    $scope.validfile=function (f) {
        $scope.usableBtn=false;//每次校验文件都禁用button
        if(f.files[0]){
            var uploadFilePath=f.files[0].name;
            var fileNeed=uploadFilePath.substring(uploadFilePath.lastIndexOf('.')+1);
            if(fileNeed && fileNeed=='xml'){
                $scope.usableBtn=true;
                state = true
            }else{
                $scope.msg='上传文件类型错误！请重新上传!';
                return
            }
        }
        else{
            $scope.msg='请选择上传文件！';
        }
    };

    //导入（文件校验通过后）
    $scope.uploadPkFile=function () {
        uploadfile=document.getElementById('importDataFile').files[0];
        if((uploadfile==''||uploadfile==undefined) || state == false){
            return;
        }
        $http({
            method:'POST',
            url:'/api/dash/upload_file_conf',
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

        })
         $scope.msg='license文件替换成功！';
          setTimeout(function(){
            location.reload();
        },2000);

    }

});
