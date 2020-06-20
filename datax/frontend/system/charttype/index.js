
var app =  angular.module('typeapp', ['ui.bootstrap','ui.grid', 'ui.grid.treeView', 'ngMaterial', 'commonHeader']);

app.controller('typeController', function ($scope, $http,$uibModal,$mdDialog, $interval, uiGridTreeViewConstants ) {
  getData();
  $scope.gridOptions = {
    enableSorting: false,
    enableFiltering: false,
    enableColumnMenus: false,
    enableHorizontalScrollbar: 0,//隐藏y轴滚动条
    // enableVerticalScrollbar: 0,//隐藏x轴滚动条
    showTreeExpandNoChildren: true,
    columnDefs: [
      { name:'id', visible: false },
      { field: 'type_name',name:'名称', width: '30%' },
      { field: 'status',name:'状态', width: '20%',cellTemplate:'<span ng-if="row.entity.status == 1" style="padding:5px;line-height:30px;">启用</span> <span ng-if="row.entity.status == 0" style="padding:5px;line-height:30px;">不启用</span>' },
      { name:'编辑',
          field:'id',
          width: '50%',
          cellTemplate:'<button class="btn btn-primary editable-table-button btn-xs btn-edit"\
                                                    ng-click="grid.appScope.cumulative(row.entity.id,0,\'\')">编辑</button>\
                        <button class="btn btn-primary editable-table-button btn-xs btn-buttons" style="height: 24px;margin-top: 3px;" ng-click="grid.appScope.delete(row.entity.id)">删除</button>'

      }
    ]
  };
 // <button ng-if="!row.entity.parent_id>0" class="btn btn-primary editable-table-button btn-xs btn-edit"\
 //                                                    ng-click="grid.appScope.cumulative(0,row.entity.id,row.entity.type_name)">增加二级</button>\
 $scope.delete = function(id){
    var s =  confirm('删除该类型，则会一并删除其子类型，是否删除');
    if(s){
        $http.post('/api/type/deleteType',{
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            pk:id
        }).then(function (rs) {
            if (rs.data.status == 'success'){
                getData();
            }else{
                mdWarningAlert($mdDialog, null, 'typeapp', rs.data.data)
            }
        }, function (error) {mdErrorAlert($mdDialog, null, 'typeapp', error)})
    }
 };
 $scope.cumulative = function(id,parent_id,parent_name){
  var modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        templateUrl: './edittype',
        controller: 'modelTypeController',
        resolve: {
                 id: function () {
                     return id;
                 },
                 parent_id:function(){
                     return parent_id;
                 },
                 parent_name:function(){
                     return parent_name;
                 }
          }
      });
    modalInstance.result.then(function () {
      getData();
    }, function () {
    });
 }


  function getData(){
     $http.get('/api/type/getTypeTree').then(function (rs) {
         if (rs.data.status == 'success'){
             $scope.gridOptions.data = rs.data.data;
         }else{
             mdWarningAlert($mdDialog, null, 'typeapp', rs.data.data)
         }
     }, function (error) {mdErrorAlert($mdDialog, null, 'typeapp', error)});
  }
});


app.controller('modelTypeController', function ($scope, $http,$timeout,$mdDialog, $uibModalInstance,id, parent_id,parent_name) {
  $scope.type = {}
  if(id === 0&&parent_id===0){
    $scope.type.id = 0;
    $scope.type.parent_id = 0;
    $scope.type.parent_name = '无';
    $scope.type.level = 1;
    $scope.type.orderby = 1;
    $scope.type.status = '1';
  }
  if(id === 0 && parent_id !== 0){
    $scope.type.id = 0;
    $scope.type.parent_id = parent_id;
    $scope.type.parent_name = parent_name;
    $scope.type.level = 2;
    $scope.type.orderby = 1;
    $scope.type.status = '1';
  }
  if(id !== 0){
    $scope.type.id = id;
    //编辑中的数据
    $http.get('/api/type/getTypeDetail/'+id).then(function(res){
        let rs = res.data;
        if (res.data.status == 'success'){
            $scope.type.type_name = rs.data.type_name;
            $scope.type.parent_id = rs.data.parent_id;
            $scope.type.parent_name = rs.data.parent_name;
            $scope.type.level = rs.data.level;
            $scope.type.orderby = rs.data.orderby;
            $scope.type.status = rs.data.status;
        }else {
            mdWarningAlert($mdDialog, null, 'editType', res.data.data)
        }
    }, function onError(error) {mdErrorAlert($mdDialog, null, 'editType', error)});
  }

  $scope.ok = function () {
      $http.post('/api/type/savetype',$scope.type).then(function (rs) {
          if (rs.data.status == 'success'){
              $uibModalInstance.close();
          }else {
              mdWarningAlert($mdDialog, null, 'editType', rs.data.data)
          }
      }, function onError(error) {mdErrorAlert($mdDialog, null, 'editType', error)});

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