var app = angular.module('index', ['ui.bootstrap']);

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
            angular.element('.title-panel').css({
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
    };
  });

app.controller('indexController', function ($scope, $http, $timeout) {

  $scope.title = '';
  $scope.initHeight = initHeight;
  $scope.titleStyle = titleStyle;

  $scope.colsStyle = colsStyle;

  $scope.colTitleStyles = colTitleStyles;
  $scope.standardColStyle = standardColStyle;
  $scope.positionColStyle = positionColStyle;

  $scope.colHover = function (colIndex, hover) {
      if (hover) {
          $scope.colsStyle[colIndex]['height'] = colHoverHeight;
          $scope.colsStyle[colIndex]['margin-top'] = colHoverMarginTop;
      } else {
          $scope.colsStyle[colIndex]['height'] = colHeight;
          $scope.colsStyle[colIndex]['margin-top'] = colMarginTop;
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
  
  $scope.openModulePage = function (url) {
      window.location.href = url;
  };
});
