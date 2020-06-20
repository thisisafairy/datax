var app = angular.module('indexconfig', ['ui.bootstrap', 'ui.grid', 'ui.grid.treeView', 'ngDragDrop', 'sup.treebox']);

app.controller('indexconfigController', ['$scope', '$http', '$uibModal', '$interval', '$window', 'uiGridTreeViewConstants', function ($scope, $http, $uibModal, $interval, uiGridTreeViewConstants) {

  $scope.titleEdit = false;
  $scope.title = '';
  $scope.initHeight = initHeight;
  $scope.titleStyle = titleStyle;

  $scope.colsStyle = colsStyle;

  $scope.colTitleStyles = colTitleStyles;
  $scope.penultimateStepStyle = standardColStyle;
  $scope.positionColStyle = positionColStyle;

  $scope.colHover = function (colIndex, hover) {
      if (hover) {
          $scope.colsStyle[colIndex]['height'] = colHoverHeight;
      } else {
          $scope.colsStyle[colIndex]['height'] = colHeight;
      }
  };

  $scope.moduleConfigKey = -1;
  // 初始化列信息
  $scope.cols = cols;

   // 获取列配置和菜单列表
  $http.get('/dashboard/getIndexConfig?id=' + $scope.moduleConfigKey).then(function(response){
    $scope.menus = response.data.menus;
    if (response.data.moduleConfigs) {
        $scope.cols = JSON.parse(response.data.moduleConfigs);
    }
    if (response.data.moduleConfigKey) {
        $scope.moduleConfigKey = response.data.moduleConfigKey;
    }
    if (response.data.indexTitle) {
        $scope.title = response.data.indexTitle;
    } else {
        $scope.title = defaultTitle;
    }
  });

  // 可配置的列表个数
  $scope.colLength = $scope.cols.length;

  // 模块的默认图标
  $scope.defaultIcon = defaultIcon;

  //最后一列的图片
  $scope.showDevices = showDevices;

  // 移除模块
  $scope.removeModule = function (colIndex, moduleRow) {
      $scope.cols[colIndex].modules.splice(moduleRow, 1);
  };

  // 编辑模块
  $scope.editModule = function (moduleConfig, colIndex, moduleRow) {
    var modalInstance = $uibModal.open({
      templateUrl: 'editModule.html',
      controller: 'moduleController',
      backdrop: "static",
      controllerAs: 'vm',
      resolve: {
        cols: function () {
          return $scope.cols;
        },
        menus: function () {
          return $scope.menus;
        },
        moduleConfig: function () {
          if (moduleConfig == '') {
            // 模块的默认配置参数
            var emptyModule = {moduleKey:'', moduleName: '', moduleUrl: '', moduleDesc: '', colIndex: '',
                moduleIcon: $scope.defaultIcon, modulePicDesc: '', moduleSort:$scope.cols.length + 1};
            return emptyModule;
          }
          return moduleConfig;
        }
      }
    });
    modalInstance.result.then(function (data) {
        if (data.moduleConfig) {
            data.moduleConfig.colIndex = Number(data.moduleConfig.colIndex);
            if (colIndex > -1 && moduleRow > -1) {
                // 修改模块
                $scope.cols[colIndex].modules.splice(moduleRow, 1);
            }
            $scope.cols[data.moduleConfig.colIndex - 1].modules.push(data.moduleConfig);
            // 模块排序
            $scope.cols[data.moduleConfig.colIndex].modules.sort(function (x, y) {
                return x.moduleSort - y.moduleSort
            });
            console.log($scope.cols);
        }
    }, function () {});
  };

  // 保存
  $scope.saveIndexConfig = function () {
    $http({
      url: '/dashboard/saveIndexConfig',
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken')
      },
      data: {
        cols: $scope.cols,
        id: $scope.moduleConfigKey,
        title: $scope.title
      }
    }).success(function (rs) {
      if (rs.code == '1') {
        $scope.moduleConfigKey = rs.moduleConfigKey;
        alert('保存成功！');
      }
    });
  }

}]);


app.directive('resize', function ($window) {
  return function (scope, element) {
      var w = angular.element($window);
      scope.getWindowDimensions = function () {
          return { 'h': w.height(), 'w': w.width() };
      };
      scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
          scope.windowHeight = newValue.h;
          scope.windowWidth = newValue.w;
          var height = (newValue.h/1040) * 573;
          var marginTop = (newValue.h/1040) * 112;
          var marginBottom = (newValue.h/1040) * 74;
          angular.element('.page-title').css({
              'margin-top':marginTop,
              'margin-bottom':marginBottom
          });
          angular.element('.cols-content').height(height);
          angular.element('.col-datas').height(height-50);
          angular.element('.last-step').height(height);
          angular.element('.penultimate-step').height(height);
          angular.element('.penultimate-step').css({'line-height':(height)+'px'});
          angular.element('.col-arrow').height(height);
          angular.element('.col-arrow').css({'line-height':(height)+'px'});
          
      }, true);
      w.bind('resize', function () {
          scope.$apply();
      });
  }
});


app.controller('moduleController', function ($scope, $http, $uibModalInstance,$timeout, cols, menus, moduleConfig) {
  $scope.menus = menus;
  $scope.moduleKey = {};
  $scope.moduleConfig = angular.copy(moduleConfig);
  if ($scope.moduleConfig.colIndex) {
      $scope.moduleConfig.colIndex = moduleConfig.colIndex + '';
      // 初始化模块选择框
      $scope.moduleKey['id'] = $scope.moduleConfig.moduleKey;
  } else {
      $scope.moduleConfig.colIndex = '1';
      $scope.moduleConfig.moduleSort = cols[0].modules.length + 1;
  }

  // 配置和列数量一样的列选择下拉框
  $scope.colSize = [1,2,3,4];
 

  // 变更列的时候更新对应的序号
  $scope.changeCol = function () {
    $scope.moduleConfig.moduleSort = cols[Number($scope.moduleConfig.colIndex) - 1].modules.length + 1;
  };

  // 监听模块选择框的值
  $scope.$watch('moduleKey',function(){
    if ($scope.moduleKey != undefined && $scope.moduleKey != null && $scope.moduleKey != {}) {
        if ($scope.moduleKey.id != undefined) {
            $scope.moduleConfig.moduleKey = $scope.moduleKey.id;
            $scope.moduleConfig.moduleName = $scope.moduleKey.value;
            $scope.moduleConfig.moduleUrl = $scope.moduleKey.url;
        }
    }
  });

  $scope.uploadModuleIcon = function (btId) {
        var formData = new FormData();
        formData.append("filename", document.getElementById(btId).files[0]);
        $.ajax({
            url: '/api/dash/uploadbgpicture',
            type: 'post',
            processData: false,
            contentType: false,
            data: formData
        }).then(function (data) {
            if (data.code == "1") {
                if (btId == 'moduleIconUpload') {
                    $scope.moduleConfig.moduleIcon = data.path + data.filename;
                    $('#moduleIcon').focus();
                } else if (btId == 'modulePicDescUpload') {
                    $scope.moduleConfig.modulePicDesc = data.path + data.filename;
                    $('#modulePicDesc').focus();
                }
                alert('上传成功!');
            }
        });
  };

  // 保存模块
  $scope.ok = function () {
      // 模块名称必填
      if ($scope.moduleKey == undefined || $scope.moduleKey == null || $scope.moduleKey == {}) {
          alert('请选择模块!');
          return;
      }
      if ($scope.moduleKey.id == undefined || $scope.moduleKey.id == null || $scope.moduleKey.id == {}) {
          alert('请选择模块!');
          return;
      }
      var moduleConfig = $scope.moduleConfig;
      $uibModalInstance.close({moduleConfig:moduleConfig});
  };

  // 取消编辑模块并关闭编辑框
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

app.filter('isNull', function() { //可以注入依赖
    return function(text) {
        if (text == undefined || text == null || text == '') {
          return true;
        }
        return false;
    };
});

  /*
  $scope.controls = [{
    name: '列', value:'col'
  }, {
    name: '图片', value: 'pic'
  }, {
    name: '文字', value: 'text'
  }];

  $scope.contents = [];

  $scope.list2 = [
    { 'title': 'KnockoutJS', 'drag': true },
    { 'title': 'EmberJS', 'drag': true },
    { 'title': 'BackboneJS', 'drag': true },
    { 'title': 'AngularJS', 'drag': true }
  ];

  $scope.startCallback = function(event, ui, control) {
    console.log('开始拖动: ' + control.name);
    $scope.draggedItem = control;
  };

  $scope.stopCallback = function(event, ui) {
    console.log('停止拖动');
  };

  $scope.dragCallback = function(event, ui) {
    console.log('正在拖动');
  };

  $scope.dropCallback = function(event, ui) {
    console.log('hey, you dumped me :-(' , $scope.draggedItem.name);
  };

  $scope.overCallback = function(event, ui) {
    console.log('Look, I`m over you');
  };

  $scope.outCallback = function(event, ui) {
    console.log('I`m not, hehe');
  };
  */