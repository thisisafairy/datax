var app = angular.module('msgconfig',['ui.bootstrap']);
app.controller('msgConfigController', function ($scope,$uibModal,$http) {
    $scope.email_user = '';
    $scope.sms_user = '';
    $scope.select_email_user = '';
    $scope.select_sms_user = '';
    //回显数据
        $scope.mail = [];
        $scope.sms = [];
        $scope.template = [];
        $scope.wx = [];
        $scope.sys = [];
        $scope.totalItems = 0;
    $scope.currentPage = 1;
     $scope.pageChanged = function () {
        $scope.getdata($scope.currentPage);
    };

    $scope.getdata = function(page){
         var reqUrl='/api/dash/get_msg_conf?page='+page;
         reqUrl=encodeURI(reqUrl);
         $http.get(reqUrl).then(function (resp) {
             $scope.templateconfs = resp.data['templateconfs']
             $scope.totalItems = resp.data.total;

         })


    }
    $scope.getdata(1);
    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 500);


    //加载模块数据
    $scope.loadmodel = function(type){
        id ='0'

        var reqUrl='/api/dash/echo_msg_conf?id='+id+"&type="+type;
        reqUrl = encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            if (type=='email'){
                $scope.mail=resp.data;
            } else if (type=='sms'){
                $scope.sms=resp.data;
            }else if (type=='emailtemplate') {
                $scope.template=resp.data;
            }else if (type=='wx'){
                $scope.wx=resp.data;
            }else if (type=='sys'){
                $scope.sys=resp.data;
                // 数据处理
             if ($scope.sys.msg == 0 || $scope.sys.msg== undefined){
                 $scope.sys.msg = false
             } else {
                  $scope.sys.msg = true
             }
             if ($scope.sys.sms == 0 || $scope.sys.sms == undefined){
                 $scope.sys.sms = false
             } else {
                  $scope.sys.sms = true
             }
             if ($scope.sys.email == 0 || $scope.sys.email == undefined){
                 $scope.sys.email = false
             } else {
                  $scope.sys.email = true
             }
             if ($scope.sys.wechat == 0 || $scope.sys.wechat == undefined){
                 $scope.sys.wechat = false
             } else {
                  $scope.sys.wechat = true
             }
             $scope.select_email_user = $scope.sys.email_user;
             $scope.select_sms_user = $scope.sys.sms_user;
            }


        })

    }
    $scope.loadmodel('email')
    //编辑
    $scope.edit = function(id,type){
        if(type=='emailtemplate'){
            var modalInstance = $uibModal.open({
                templateUrl: '../frontend/system/importdata/emailtemplate.html',
                controller: 'emalicontroller',
                backdrop: "static",
                controllerAs: 'vm',
                resolve:{
                     id: function () {
                        return id;

                    },
                    type:function () {
                         return 'emailtemplate'

                    }

                }
            });

        }


    }
    //删除
    $scope.del = function(id,type){
        var reqUrl = '/api/dash/del_msg_template?id='+id+"&type="+type;
        reqUrl = encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            $scope.getdata($scope.currentPage)
        })

    }

    //打开email模板配置模态框
    $scope.openemailtemplate = function(){
        var id =0;
        var modalInstance = $uibModal.open({
            templateUrl: '../frontend/system/importdata/emailtemplate.html',
            controller: 'emalicontroller',
            backdrop: "static",
            controllerAs: 'vm',
             resolve:{
                id:function () {
                    return id;
                },
                 type:function () {
                    return 'emailtemplate'

                    }

             }
        });
    }


    //打开选取用户模态框
    $scope.select_user = function (send_type) {
    var modalInstance = $uibModal.open({
      templateUrl: '../frontend/system/importdata/select_user_page.html',
      controller: 'userSelectController',
      backdrop: "static",
      controllerAs: 'vm',
      resolve: {
        user_list: function () {
          return $scope.userlist;
        },
        user_select: function () {
          if (send_type == 'mail_email') {
            return $scope.select_email_user;
          } else {
            return $scope.select_sms_user;
          }
        }
      }
    });
    modalInstance.result.then(function (data) {
      if (send_type == 'mail_email') {
        $scope.select_email_user = data.select_users;
      } else {
        $scope.select_sms_user = data.select_users;
      }
    }, function () {});
  }
  //加载选取用户模态框的数据
  $http.get('/api/getAllUser/').then(function (data) {
      $scope.userlist = data.data.users;
      $scope.step = 'step2';
    })

  $scope.ok = function () {
        $scope.checkesys();
        if ($scope.select_email_user == undefined){
            $scope.sys['email_user'] =''
        } else {
            $scope.sys['email_user'] = $scope.select_email_user
        }
        if ($scope.select_sms_user == undefined){
            $scope.sys['sms_user'] = ''
        } else {
            $scope.sys['sms_user'] = $scope.select_sms_user
        }
        if ($scope.sys['emailtemplate'] == undefined){
            $scope.sys['emailtemplate'] =''
        }
        if ($scope.sys['smstemplate'] == undefined){
            $scope.sys['smstemplate'] =''
        }
        if ($scope.sys['wechattemplate'] == undefined){
            $scope.sys['wechattemplate'] =''
        }
        $scope.wx=[];
        $scope.mail=[];
        $scope.sms=[];
        $http({
          url: '/api/dash/save_msg_config',
          method: 'POST',
          headers: {
            'X-CSRFToken': getCookie('csrftoken')
          },
          data: {
            sys:  $scope.sys,
            email:  $scope.mail,
            sms: $scope.sms,
            wx:  $scope.wx,
            template: []  ,
          }
        }).success(function (rs) {
            alert('保存成功')
            window.location.href='/dashboard/msgconfig'

        })
  }
  //验证表单
  $scope.checkesys = function () {
        if ($scope.sys.msg == undefined){
             $scope.sys['msg'] = false;
        }
        if ($scope.sys.sms == undefined){
             $scope.sys['sms'] = false;
        }
        if ($scope.sys.email == undefined){
            $scope.sys['email'] = false;
        }
        if ($scope.sys.wechat == undefined){
            $scope.sys['wechat'] = false;
        }

  }

  $scope.save = function (type) {
        // 解决为空后台报错的问题
        if ($scope.mail == undefined){
            $scope.mail=[]
        }
        if ($scope.sms == undefined){
            $scope.sms=[]
        }
        if ($scope.template == undefined){
            $scope.template=[]
        }
        //判断消息类型
        if (type =='emailtempalte'){
            $scope.template.msgtype=0
        }

        if ($scope.wx == undefined){
            $scope.wx=[];
        }
        $http({
          url: '/api/dash/save_msg_config?id='+id,
          method: 'POST',
          headers: {
            'X-CSRFToken': getCookie('csrftoken')
          },
          data: {
            email:  $scope.mail,
            sms: $scope.sms,
            sys: $scope.sys,
            wx: $scope.wx,
            template :$scope.template,

          }
        }).success(function (rs) {
            alert('保存成功')
            if (type =='emailtemplate'){
                window.location.href='/dashboard/msgtemplateconfig'
            }else {
                window.location.href='/dashboard/msgconfig'
            }


        })
  }





});
app.controller('emalicontroller', function ($scope, $http,$uibModalInstance,id,type) {
    //加载所有模板
    if (type == 'email' || type == 'sms' ||type =='wx'){
        $scope.templateconfs = [];
        $scope.getdata = function(){
         var reqUrl='/api/dash/get_msg_conf';
         reqUrl=encodeURI(reqUrl);
         $http.get(reqUrl).then(function (resp) {

             $scope.templateconfs = resp.data['templateconfs']

         })


        }
        $scope.getdata();

    }

    //回显数据

    if (id != 0){
        $scope.mail = [];
        $scope.sms = [];
        $scope.template = [];
        $scope.wx = [];
        var reqUrl='/api/dash/echo_msg_conf?id='+id+"&type="+type;
        reqUrl = encodeURI(reqUrl);
        $http.get(reqUrl).then(function (resp) {
            if (type=='email'){
                $scope.mail=resp.data;
            } else if (type=='sms'){
                $scope.sms=resp.data;
            }else if (type=='emailtemplate') {
                $scope.template=resp.data;
            }else if (type=='wx'){
                $scope.wx=resp.data;
            }


        })
    }

    //验证表单
    $scope.checkemail = function(){
       temp = $scope.mail
        $scope.promiss=true;
        if (temp.mailaddress=="" || $.trim(temp.mailaddress)==""){
            $scope.promiss=false;

        }
        if (temp.mailpassword=="" || $.trim(temp.mailpassword)==""){
            $scope.promiss=false;

        }
        if (temp.smptaddress=="" || $.trim(temp.smptaddress)==""){
            $scope.promiss=false;

        }
        if (temp.smptport=="" || $.trim(temp.smptport)==""){
            $scope.promiss=false;

        }
        if ($scope.promiss==false){
            alert('请完善表单')
            return false
        }else {
            return true
        }
    }
    $scope.checksms = function(){
        temp = $scope.sms
        $scope.promiss=true;
        if(temp.sppid=="" || $.trim(temp.sppid)==""){
            $scope.promiss=false;
        }
        if(temp.appkey=="" || $.trim(temp.appkey)==""){
            $scope.promiss=false;
        }
        if(temp.templateid=="" || $.trim(temp.templateid)==""){
            $scope.promiss=false;
        }
        if(temp.template=="" || $.trim(temp.template)==""){
            $scope.promiss=false;
        }
        if ($scope.promiss==false){
            alert('请完善表单')
            return false
        }else {
            return true
        }

    }


     $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }

    $scope.ok = function (type) {
        if (type=="email") {
            var ispass = $scope.checkemail()

        }else if (type=='sms'){
            var ispass = $scope.checksms()
        }
        //验证表单

        if (ispass==false){
            return
        }
        // 解决为空后台报错的问题
        if ($scope.mail == undefined){
            $scope.mail=[]
        }
        if ($scope.sms == undefined){
            $scope.sms=[]
        }
        if ($scope.template == undefined){
            $scope.template=[]
        }
        //判断消息类型
        if (type =='emailtempalte'){
            $scope.template.msgtype=0
        }

        if ($scope.wx == undefined){
            $scope.wx=[];
        }
        $http({
          url: '/api/dash/save_msg_config?id='+id,
          method: 'POST',
          headers: {
            'X-CSRFToken': getCookie('csrftoken')
          },
          data: {
            email:  $scope.mail,
            sms: $scope.sms,
            sys: [],
            wx: $scope.wx,
            template :$scope.template,

          }
        }).success(function (rs) {
            alert('保存成功')
            if (type =='emailtemplate'){
                window.location.href='/dashboard/msgtemplateconfig'
            }else {
                window.location.href='/dashboard/msgconfig'
            }


        })
  }


});

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

