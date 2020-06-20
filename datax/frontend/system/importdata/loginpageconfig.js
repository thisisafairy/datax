var app = angular.module('loginpage', ['ui.bootstrap']);
app.controller('loginpageController', function ($scope, $http,$uibModal) {
    //回显数据
     $scope.loginobjs=[];
    // $scope.totalItems = 0;
    // $scope.currentPage = 1;
    //  $scope.pageChanged = function () {
    //     $scope.getData($scope.currentPage);
    // };
    $scope.getData=function (page) {
        var reqUrl='/api/dash/get_login_page_info';
        reqUrl=encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            $scope.loginobjs=resp.data;
            //$scope.totalItems = resp.data.total;


        });
    };
    $scope.getData(1);
    $scope.setloginpage = function(id,type){
        var reqUrl='/api/dash/set_login_page?id='+id+'&type='+type;
        reqUrl=encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            alert('设置成功')


        })

    }

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
            if(fileNeed && fileNeed=='zip'){
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
            url:'/api/dash/upload_uncompress_zipfile',
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
         $scope.msg='成功！';
        setTimeout(function(){
                location.reload();
            },2000);

    }

// 下载文件

     $scope.downloadfile = function() {
         $http({
             method: 'GET',
             url: "/api/dash/download_file",
             responseType: "arraybuffer"
         }).success(function (data) {
               var blob = new Blob([data], {type: "application/zip"});
               var objectUrl = URL.createObjectURL(blob);
               window.open(objectUrl);
         });

     }






});
app.controller('homecontroller',  function ($scope, $http, $uibModalInstance) {
     $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }


})