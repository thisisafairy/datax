var app = angular.module('dispatchapp',['ui.bootstrap','ui.router','ui.router.state.events']);
app.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/list');
    $stateProvider.state('list', {
            url: '/list',
            templateUrl: '/dashboard/olapdispatchlist',
            controller: 'listController'
        })
    .state('add', {
        url: '/add/:id',
        templateUrl: '/dashboard/olapdispatchadd',
        controller: 'addController'
    });
});


app.controller('listController',  function($scope,$http){
    // $scope.lists = [];
    // $http.get('/api/olap/getDispatch').then(function(rs){
    //     $scope.lists = rs.data.lists;
    //     // console.log(rs.data.lists);
    // });
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function(){
      $scope.getdata($scope.currentPage);
    }
    $scope.getdata = function(page){
      var key = $scope.searchkey;
      var url = '/api/olap/getDispatch?page='+page;
      if(key != ''){
        url = encodeURI(url+"&search="+key);//中文转码，防止ie查询不到
      }
      $http.get(url).then(function (response) {
        $scope.lists = response.data.rows;
        $scope.totalItems = response.data.total;
      });
    }
    $scope.getdata(1);
    $scope.search = _.debounce(function(){
      $scope.getdata($scope.currentPage);
    },1000);
    $scope.removeRow=function(list){
        var isdelete=confirm("是否删除"+list['name']+"?");
        console.log(list['id']);
        if(isdelete){
            $http({
                method:'POST',
                url:'/api/olap/removeDispatch',
                headers:{'X-CSRFToken': getCookie('csrftoken')},
                data:{
                    id:list['id']
                }
            }).success(function(rs){
                if(rs.code=='1'){
                    $scope.getdata(1)
                }else{
                    alert("删除失败！"+rs.msg);
                }
            })
        }
    }
});

app.controller('addController',  function($log,$scope,$http,$state,$stateParams){
    $scope.dispatch = {};
    $scope.dispatch.desc = '';
    
    if($stateParams.id == ''){
        $scope.dispatch = {}
        $scope.dispatch.id = '';
    }
    else{
        $http.get('/api/olap/getDispatchRow/'+$stateParams.id).then(function(rs){
            $scope.dispatch = rs.data.row;
            $scope.dispatch.once.date = new Date(Date.parse($scope.dispatch.once.date));
        });
    }
    $scope.format = 'yyyy/MM/dd';
    $scope.altInputFormats = ['M!/d!/yyyy'];
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
    function disabled(data) {
        var date = data.date,mode = data.mode;
        console.log(data);
        return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
    }
    $scope.open1 = function() {
        $scope.popup1.opened = true;
    };

    $scope.save = function(){
        console.log($scope.dispatch);
        // return false;
        $http({
          method:'POST',
          url: '/api/olap/saveDispatch',
          headers: {'X-CSRFToken': getCookie('csrftoken')},
          data: {
            data:$scope.dispatch
          }}).success(function(rs){ 
              if(rs.code == 1){
                $state.go('list')
              }
          });
    }
    $scope.back = function(){
        $state.go('list');
    }
    $scope.$watch('dispatch.time', function(newValue, oldValue, scope) {
        $scope.dispatch.shorttime = moment(newValue).format("HH:mm");
        // console.log($scope.dispatch.shorttime);
    });
    $scope.dispatch.time = new Date();
    $scope.$watch('dispatch.once.date', function(newValue, oldValue, scope) {
        $scope.dispatch.onceshortdate = moment(newValue).format("Y-M-D");
    });
    // $scope.$watch('dispatch.once.date', function(newValue, oldValue, scope) {
    //     $scope.dispatch.onceshortdate = moment(newValue).format("Y-M-D");
    // });

});