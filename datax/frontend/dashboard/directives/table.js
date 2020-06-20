var app;
app.directive('myTable', function () {
  return {  
      restrict: 'E',  
      templateUrl: '/frontend/dashboard/directives/table.html',
      replace: true,
      scope: {  
        options: "=" 
      },
      link: function (scope, element, attrs, controller) {  

      },  
      controller:function($scope,$http,$element,$timeout){
        $scope.option = {
            "columns": [],
            "url": $scope.options.data.url,
            "theads":$scope.options.theads,
            "config":$scope.options.config,
            "pagin":$scope.options.pagin,
        }; 
        // $http({
        //         method: 'POST',
        //         url: $scope.options.data.url,
        //         headers: {
        //           'X-CSRFToken': getCookie('csrftoken')
        //         },
        //         data: {
        //             olapid: $scope.options.olapid,
        //             limit: $scope.options.length,
        //             merge: $scope.options.merge,
        //             column: $scope.options.columns
        //         }
        //       }).success(function (rs) {
        //         $scope.tabledata = rs.data;
        //         $scope.option.columns = $scope.options.columns;
        //    });
        // console.log($scope.option);
        // console.log($scope.option.pagin == '1');
        $scope.everypgtotal=1;//排除没有给每页显示条数的情况，这里的$scope.options.length来源于创建时候的“显示条数”
        if($scope.options.length !='' && $scope.options.length!=0 && typeof($scope.options.length) !='undefined')
            $scope.everypgtotal=$scope.options.length;

        $scope.totalItems = 0;
        $scope.currentPage = 1;
        $scope.pageChanged = function(currentPage){
          // console.log(currentPage);
          $scope.getdata(currentPage);
        };

        $scope.getdata = function(page){
            $http({
                method: 'POST',
                url: $scope.options.data.url,
                headers: {
                  'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    olapid: $scope.options.olapid,
                    limit: $scope.options.length,
                    merge: $scope.options.merge,
                    column: $scope.options.columns,
                    page:page,
                    limit:$scope.options.length
                }
              }).success(function (rs) {
                $scope.tabledata = rs.data;
                $scope.option.columns = $scope.options.columns;
                console.log('-d',rs.total/$scope.everypgtotal);
                $scope.totalItems = rs.total/$scope.everypgtotal;
              });
         };
        $scope.getdata(1);

        $scope.drawStatus = {
            "thead":false,
            "data":false
        }
        $scope.$watch('option.columns',function(data){
            $timeout(function(){
                if($scope.drawStatus['thead']&&$scope.drawStatus['data']){
                    if($scope.option.url != '' && $scope.option.columns.length > 0){
                        $scope.option.config.scrollX = '1';
                        $scope.option.config.sScrollY = 'atuo';
                        $scope.datatable = $element.find('table').dataTable($scope.option.config);
                    }
                }
            });
        },true);
 
        $scope.repeatDone = function(id){
            $scope.drawStatus[id] = true;
        }
      }  
  };  
});

app.directive('repeatFinish', function ($timeout) {
    return {
      restrict: 'A',
     
      link: function (scope, element, attr) {
        if(scope.$last == true){
            scope.$eval( attr.repeatFinish );
        }
        // scope.$watch('thead',function(data){
        //     if(scope.$last == true){
        //         scope.$eval( attr.repeatFinish );
        //     }
        // },true);
      }
    };
  });