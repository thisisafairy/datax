
var app =  angular.module('modulelist', ['ui.bootstrap','ui.grid', 'ui.grid.treeView', 'ngMaterial', 'commonHeader']);

app.controller('moduleController', function ($scope, $http,$uibModal,$mdDialog, $interval, uiGridTreeViewConstants ) {
  getData($mdDialog);
  $scope.gridOptions = {
    enableSorting: true,
    enableFiltering: false,
    showTreeExpandNoChildren: true,
    columnDefs: [
      { name:'id', visible: false },
      { name: 'name', width: '30%' },
      { name: 'url', width: '20%' },
      { name: 'key', width: '20%' },
      {name:'edit',field:'id',width: '30%',cellTemplate:'<button class="btn btn-primary editable-table-button btn-xs btn-edit"\
                                                    ng-click="grid.appScope.cumulative(grid, row)">编辑</button>'}
    ]
  };
 
 $scope.cumulative = function(grid,row){
  var id = row.entity.id;
  var modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: './editModule',
        controller: 'modelModuleController',
        controllerAs: '$ctrl',
        resolve: {
                 id: function () {
                     return id;
                 }
          }
      });
    modalInstance.result.then(function () {
      getData($mdDialog);
    }, function () {
    });
 }

    // 模块管理list
  function getData(md){
     $http.get('/api/getMenutree').then(function (rs) {
         if (rs.data.status == 'success'){
             $scope.gridOptions.data = rs.data.data;
         }else{
             mdWarningAlert(md, null, 'modulelist', rs.data.data);
         }
     }, function (error) {mdErrorAlert(md, null, 'modulelist', error)});
  }
});


app.controller('modelModuleController', function ($scope,$timeout, $http,$mdDialog, $uibModalInstance,id) {
    // 模块管理 编辑
  $http.get('/api/getMenuDetail?id='+id).then(function(rs){
      if (rs.data.status == 'success'){
          $scope.module = rs.data.data;
      }else {
          mdWarningAlert($mdDialog, null, 'editModule', rs.data.data)
      }
  }, function (error) {mdErrorAlert($mdDialog, null, 'editModule', error)});

  $scope.ok = function () {
    // 保存编辑
    $http.post('/api/saveMenu', $scope.module).then(function (rs) {
        if (rs.data.status == 'success'){
            $uibModalInstance.close();
        }else{
            mdWarningAlert($mdDialog, null, 'editModule', rs.data.data)
        }
    }, function (error) {mdErrorAlert($mdDialog, null, 'editModule', error)});


  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});