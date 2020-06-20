var app = angular.module('menulist', ['ui.bootstrap', 'ui.grid', 'ui.grid.treeView', 'ngMaterial', 'commonHeader']);

///为了监听文件input标签的on-change事件
app.directive('customOnChange', function() {
  return {
      restrict: 'A',
      link: function (scope, element, attrs) {
          var onChangeHandler = scope.$eval(attrs.customOnChange);
          element.on('change', onChangeHandler);
          element.on('$destroy', function() {
              element.off();
          });
      }
  };
});

app.controller('menuController',  function ($scope, $http, $uibModal,$mdDialog, $interval, uiGridTreeViewConstants) {
  getData();
  $scope.gridOptions = {
    enableSorting: true,
    enableFiltering: false,
    enableHorizontalScrollbar: 1, //是否滚动条，1是，0否
    showTreeExpandNoChildren: true,
    columnDefs: [{
        name: 'id',
        visible: false
      },
      {
        name: 'name',
        width: '30%',
        displayName: '名称',
        minWidth: 300
      },
      {
        name: 'url',
        width: '20%',
        displayName: '链接',
        minWidth: 200
      },
      {
        name: 'key',
        width: '18%',
        displayName: '代码',
        minWidth: 180
      },
      {
        name: '操作',
        field: 'id',
        width: '30%',
        minWidth: 300,
        cellTemplate: '<button ng-if="!row.entity.parent_key" class="btn btn-primary editable-table-button btn-xs btn-edit"\
                      ng-click="grid.appScope.cumulative(grid, row, \'add\')">新增子菜单</button>\
                      <button class="btn btn-primary editable-table-button btn-xs btn-edit" \
                      ng-click="grid.appScope.cumulative(grid, row, \'update\')">编辑</button>\
                      <button class="btn btn-primary editable-table-button btn-xs btn-edit" \
                      ng-click="grid.appScope.deleteRow(grid, row, \'delete\')">删除</button> \
                      <button class="btn btn-info btn-edit btn-xs" ng-click="grid.appScope.permissionSet(grid,row, \'set\')">授权</button> '
      }
    ]
  };

  //获取所有门户菜单数据
  function getData() {
    $http.get('/api/getProtalMenutree').then(function (rs) {
      if (rs.data.status == 'success'){
        $scope.gridOptions.data = rs.data.data;
      }else {
        mdWarningAlert($mdDialog, null, 'menulist', rs.data.data)
      }
    }, function (error) {mdErrorAlert($mdDialog, null, 'menulist', error)});
  }

  $scope.deleteRow = function (grid, row, oper_type) {
    if (confirm('确定删除吗？')){
        if ("delete" == oper_type) {
        $http.get('/api/getPortalMenuDetail?id=' + row.entity.id + '&parent_key=-1&oper_type=delete').then(function (rs) {
          if (rs.data.status == 'success'){
            getData()
          }else {
            mdWarningAlert($mdDialog, null, 'menulist', rs.data.data)
          }
        }, function (error) {mdErrorAlert($mdDialog, null, 'menulist', error)});
      }
    }
  };
  $scope.scenes = [];
  $.ajax({
    url: '/api/getscenes/?format=json',
    type: 'get',
    data: {
      'count': 90000000
    }
  }).then(function (data) {
    $scope.scenes = data.datas;
  });

  $scope.themes = [];
  $.ajax({
    url: '/api/dash/getthemes/?format=json',
    type: 'get',
    data: {
      'count': 90000000
    }
  }).then(function (data) {
    $scope.themes = data.datas;
  });
  $scope.cumulative = function (grid, row, oper_type) {
    var id = -1
    var parent_key = -1
    if (row) {
      id = row.entity.id;
      // if (row.entity.parent_key) {
      //   parent_key = row.entity.parent_key
      // }
      if (row.entity.key) { //如果是新增子菜单，那么新增的子菜单应该显示当前菜单为parent
        parent_key = row.entity.key;
      }
    }
    var modalInstance = $uibModal.open({
      animation: true,
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      templateUrl: './editProtalTreeNode',
      controller: 'editNodeController',
      controllerAs: '$ctrl',
      resolve: {
        id: function () {
          return id;
        },
        parent_key: function () {
          return parent_key;
        },
        oper_type: function () {
          return oper_type;
        },
        scenes: function () {
          return $scope.scenes;
        },
        themes: function () {
          return $scope.themes;
        }
      }
    });
    modalInstance.result.then(function () {
      getData();
    }, function () {});
  };

  $scope.permissionSet = function (grid, row) {

    $http.get('/api/getgroupmodel/',{
      params:{
        id: row.entity.id
      }
    }).then(function (rs) {
      if (rs.data.status == 'success'){
        let data = rs.data;
        data["id"] = row.entity.id;
        data["name"] = row.entity.name;
        data["allowusers"] = row.entity.allowusers;
        var modalInstance = $uibModal.open({
          templateUrl: 'myModalSetPermission.html',
          controller: 'ModalInstanceCtrlSetPermission',
          backdrop: "static",
          controllerAs: 'vm',
          resolve: {
            itemC: function () {
              return data;
            }
          }
        });
        modalInstance.result.then(function () {
          getData();
        }, function () {});
      }else {
        mdWarningAlert($mdDialog, null, 'userform', rs.data.data)
      }
    }, function onError(error) {mdErrorAlert($mdDialog, null, 'userform', error)});

  };

});

app.controller('ModalInstanceCtrlSetPermission', function ($scope, $http, $mdDialog,$uibModalInstance, itemC) {
  $scope.name = itemC.name || ''; //组名
  // $scope.users = JSON.parse(itemC.allowusers)||[];//所有已选
  $scope.users = itemC.users || []; //所有已选
  $scope.allusers = itemC.allusers || []; //所有待选
  $scope.selusers = ''; //待选区选中的
  $scope.seledusers = ''; //已选区选中的
  $scope.ok = function () {
    groupids = '';
    for (var i = 0; i < $scope.users.length; i++) {
      groupids += $scope.users[i].id + ',';
    }
    // var userstr = JSON.stringify($scope.users);
    $http({
      url: '/api/setMenuGroups/',
      method: 'post',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      data: {
        id: itemC.id,
        allgroupid: groupids
      }
    }).then(function (rs) {
      if (rs.data.status == 'success'){
        $uibModalInstance.close();
      }else {
        mdWarningAlert($mdDialog, null, 'userform', rs.data.data)
      }
    }, function onError(error) {mdErrorAlert($mdDialog, null, 'userform', error)});
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.add = function () {
    for (var i = 0; i < $scope.selusers.length; i++) {
      var added = false;
      for (var j = 0; j < $scope.users.length; j++) {
        if ($scope.selusers[i].id === $scope.users[j].id) {
          added = true;
          break;
        }
      }
      if (added) {
        continue;
      }
      $scope.users.push($scope.selusers[i]);
    }
  };
  $scope.remove = function () {
    var newsels = [];
    for (var i = 0; i < $scope.users.length; i++) {
      var have = false;
      for (var j = 0; j < $scope.seledusers.length; j++) {
        if ($scope.seledusers[j].id === $scope.users[i].id) {
          have = true;
          break;
        }
      }
      if (have) {
        continue;
      }
      newsels.push($scope.users[i]);
    }
    $scope.users = newsels;
  };


});

app.controller('editNodeController', function ($scope, $http, $timeout, $uibModalInstance,$mdDialog , id, parent_key, oper_type, scenes, themes) {
  $scope.scenes = scenes;
  $scope.selscenes = [];
  $scope.themes = themes;
  $scope.selthemes = [];
  $scope.preParentMenu = [{
    "name": "上帝节点",
    "key": ""
  }];
  $scope.menuOptions = {}
  // 新增目录 新增子菜单 编辑 删除
  $http.get('/api/getPortalMenuDetail?id=' + id + '&parent_key=' + parent_key + '&oper_type=' + oper_type).then(function (rs) {
     if (rs.data.status == 'success'){
       $scope.module = rs.data.data;
        if (isNotNull($scope.module.options)) {
        $scope.menuOptions = eval('(' + $scope.module.options + ')');
          if (isNotNull($scope.menuOptions.desc)) {
            $scope.module.desc = $scope.menuOptions.desc
          }
        }
     }else {
       mdWarningAlert($mdDialog, null, 'editNode', rs.data.data)
     }
  }, function (error) {mdErrorAlert($mdDialog, null, 'editNode', error)});
  //在父节点填选处显示所有菜单，
  $http.get('/api/getProtalMenutree').then(function (rs) {
    if (rs.data.status == 'success'){
      rsdata = rs.data;
      angular.forEach(rsdata,function (value) {
        if (value.parent_key == '' || value.parent_key == null || value.parent_key.length == 0) {
          $scope.preParentMenu.push(value);
        }
      });
    }else {
      mdWarningAlert($mdDialog, null, 'editNode', rs.data.data)
    }
  }, function onError(error) {mdErrorAlert($mdDialog, null, 'editNode', error)});

  $scope.iconUpload = function (event) {
    if (event.target.files[0]) {
      var formData = new FormData();
      formData.append("filename", document.getElementById('menuIcon').files[0]);
      formData.append("fileuptype", 'menuicon');
      $.ajax({
          url: '/api/dash/saveUploadFile',
          type: 'post',
          processData: false,
          contentType: false,
          data: formData
      }).then(function (res) { 
          if (res.status == 'success') {
            $scope.module.icon = res.data.filePath
            $scope.$apply()
          }
      });
  }
  }

  $scope.ok = function () {
    $http.post('/api/savePortalMenu',$scope.module).then(function (rs) {
      if (rs.data.status == 'success'){
        $uibModalInstance.close();
      }else {
        mdWarningAlert($mdDialog, null, 'editNode', rs.data.data)
      }
    }, function onError(error) {mdErrorAlert($mdDialog, null, 'editNode', error)})

  };

  $scope.changeScene = function () {
    if ($scope.selscenes.length > 0) {
      $scope.module.url = '/bi/index/scene/' + $scope.selscenes[$scope.selscenes.length - 1].id;
      $scope.selthemes = [];
    }
  }

  $scope.changeTheme = function () {
    if ($scope.selthemes.length > 0) {
      $scope.module.url = '/bi/index/theme/' + $scope.selthemes[$scope.selthemes.length - 1].id;
      $scope.selscenes = [];
    }
  }

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