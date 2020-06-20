'use strict';

angular.module('vlui')
  .directive('shelves', function () {

    return {
      templateUrl: 'components/shelves/shelves.html',
      restrict: 'E',
      scope: {
        spec: '=',
        preview: '<',
        supportAny: '<',
        supportAutoMark: '<',
        filterManager: '=',
        chron: '<',
        ecconfig:'='
      },
      replace: true,
      link: function () {
        return function () {

        };
      },
      controller: function ($scope, $timeout, ANY, Config, Dataset, Logger, Pills) {

        $scope.ANY = ANY;
        $scope.anyChannelIds = [];
        $scope.Dataset = Dataset;
        $scope.freshModel = true;
        $scope.titleShow = true;
        $scope.themeShow = true;
        $scope.propShow = true;
        $scope.legendShow = true;
        $scope.optionShow = true;
        $scope.filterShow = true;
        $scope.min = 0;
        $scope.max = 100;
        // $scope.marks = ['point', 'tick', 'bar', 'line', 'area', 'text'];
        $scope.marks = ['pie', 'gauge', 'bmap','mixed','scatter','radar','single', 'funnel','candlestick','wordCloud','treemap','graph','dbar','tree','sankey'];//,'sunburst'
        $scope.echartthemelist = [{ v: 'infographic', t: '样式一' }, { v: 'macarons', t: '样式二' }, { v: 'shine', t: '样式三' }, { v: 'dark', t: '样式四' }, { v: 'roma', t: '样式五' }];
      
        $scope.marksicon = {
          "pie": {
            icon: 'fa-pie-chart',
            title: '饼状图'
          },
          "gauge": {
            icon: 'fa-tachometer',
            title: '仪表盘'
          },
          "bmap": {
            icon: 'fa-map-o',
            title: '地图'
          },

          "mixed":{
            icon:'fa-line-chart',
            title:'混合'
          },
          "scatter":{
            icon:'fa-braille',
            title:'散点'
          },
          "radar":{
            icon:'fa-connectdevelop',
            title:'雷达图'
          },
          "single":{
            icon:'fa-long-arrow-up',
            title:'单指标'
          },
          "funnel":{
            icon:'fa-align-center',
            title:'漏斗图'
          },
          "candlestick":{
            icon:'fa-line-chart',
            title:'K线图'
          },
          "wordCloud":{
            icon:'fa-building',
            title:'词云图'
          },
          "treemap":{
            icon:'fa-th-large',
            title:'矩阵图'
          },
          "graph":{
            icon:'fa-share-alt',
            title:'力学关系图'
          },
          "dbar":{
            icon:'fa-bar-chart',
            title:'多维柱'
          },
          "tree":{
            icon:'fa-tree',
            title:'树形图'
          },
          "sankey":{
            icon:'fa-barcode',
            title:'桑基图'
          }/*,
          "sunburst":{
            icon:'fa-dot-circle-o',
            title:'旭日图'
          }*/
        };
        $scope.ifechart = false;
        $scope.tab = 'tab1';
        $scope.echartShape = ['pie', 'gauge', 'bmap','mixed','scatter','radar','single','funnel','candlestick','worldcloud','treemap','graph','sunburst','sankey'];

        // $scope.marksicon[ANY] = {
        //   icon: 'fa-bullseye',
        //   title: '自动'
        // };
        $scope.showmarktype = false;
        $scope.changetype = function (mark) {
          $scope.spec.mark = mark;
          $scope.markdetail = $scope.marksicon[mark];
          $scope.showmarktype = false;
        };

        $scope.hasOption = function(type){
          return ['pie','mixed','single'].indexOf(type) > -1;
        };
        $scope.spec.mark = 'pie';
        $scope.markdetail = $scope.marksicon['pie'];
        $scope.marksWithAny = $scope.marks;

        $scope.markChange = function () {
          Logger.logInteraction(Logger.actions.MARK_CHANGE, $scope.spec.mark);
        };

      
        $scope.setTab = function(tab){
          $scope.tab = tab;
        };
        $scope.clear = function () {
          Logger.logInteraction(Logger.actions.SPEC_CLEAN, $scope.spec);
          Pills.reset();
        };

        $scope.$watch('ecconfig.title',function(val){
          if($scope.ecconfig && $scope.ecconfig.title){
            $scope.normalTitle = angular.copy(val.text );
            $scope.normalSubTitle = angular.copy(val.subtext);
            $scope.normalTitlePosition = angular.copy(val.left);
            $scope.titletextcolor = angular.copy(val.textStyle.color);
            $scope.subtitletextcolor = angular.copy(val.subtextStyle.color);
          }
        },true);

        $scope.$watch('ecconfig.option',function(val){
          if($scope.ecconfig && $scope.ecconfig.option && $scope.ecconfig.data.type === 'single'){
            $scope.border_color = val.thermometer.bordercolor;
            $scope.bar_color = val.thermometer.barcolor;
            $scope.point_color = val.thermometer.pointcolor;
            $scope.title_color = val.thermometer.titlecolor;
            $scope.value_color = val.card.valuecolor;
            $scope.fill_color = val.card.fillcolor;
            $scope.stroke_color = val.card.strokecolor;
          }
        },true);
        $scope.$watch('spec.mark', function (mark) {
          $scope.markdetail = $scope.marksicon[mark];
          if ($scope.echartShape.indexOf(mark) >= 0) {
            $scope.ifechart = true;
          }
          else {
            $scope.ifechart = false;
          }
        });
        $timeout(function () {
          $(".color-input-title").colorpicker({
            colorSelectors: {
                '#000000': '#000000',
                '#ffffff': '#ffffff',
                '#FF0000': '#FF0000',
                '#777777': '#777777',
                '#337ab7': '#337ab7',
                '#5cb85c': '#5cb85c',
                '#5bc0de': '#5bc0de',
                '#f0ad4e': '#f0ad4e',
                '#d9534f': '#d9534f',
                '#FFFF00':'#FFFF00',
                '#EE00EE':'#EE00EE',
                '#ADFF2F':'#ADFF2F'
            }
        }).on('changeColor', function () {
            if ($(this).attr('rel') === 'bt') {
              $scope.titletextcolor = $(this).val();
            }
            if ($(this).attr('rel') === 'sbt') {
              $scope.subtitletextcolor = $(this).val();
            }
        }); });
        
        $scope.$watch('ecconfig.type',function(type){
          if(type){
              $timeout(function () {
                $(".color-input-single").colorpicker({
            colorSelectors: {
                '#000000': '#000000',
                '#ffffff': '#ffffff',
                '#FF0000': '#FF0000',
                '#777777': '#777777',
                '#337ab7': '#337ab7',
                '#5cb85c': '#5cb85c',
                '#5bc0de': '#5bc0de',
                '#f0ad4e': '#f0ad4e',
                '#d9534f': '#d9534f',
                '#FFFF00':'#FFFF00',
                '#EE00EE':'#EE00EE',
                '#ADFF2F':'#ADFF2F'
            }
        }).on('changeColor', function () {
                  if ($(this).attr('rel') === 'border') {
                    $scope.border_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'point') {
                    $scope.point_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'bar') {
                    $scope.bar_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'title') {
                    $scope.title_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'fill') {
                    $scope.fill_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'stroke') {
                    $scope.stroke_color = $(this).val();
                  }
                  if ($(this).attr('rel') === 'value') {
                    $scope.value_color = $(this).val();
                  }
                  
                });
              });
          }
        });
        $scope.setNormalTitle = function (title_type) {
          if ($scope.freshModel) {
            if (title_type === 'title') {
              $scope.ecconfig.title.text = angular.copy($scope.normalTitle);
            }
            else {
              $scope.ecconfig.title.subtext = angular.copy($scope.normalSubTitle);
            }
          }
        };
        $scope.setTop = function () {
          if ($scope.freshModel) {
            if ($scope.ecconfig.mapdata.order_modal !== '0') {
              $scope.ecconfig.mapdata.top_num = angular.copy($scope.top_num);
            }
          }
        };
        $scope.setColor = function (type) {
          if (type === 'border') {
            $scope.ecconfig.option.thermometer.bordercolor = angular.copy($scope.border_color);
          }
          if(type === 'point'){
            $scope.ecconfig.option.thermometer.pointcolor = angular.copy($scope.point_color);
          }
          
          if(type === 'bar'){
            $scope.ecconfig.option.thermometer.barcolor = angular.copy($scope.bar_color);
          }

          if(type === "title"){
            $scope.ecconfig.option.thermometer.titlecolor = angular.copy($scope.title_color);
            $scope.ecconfig.option.card.titlecolor = angular.copy($scope.title_color);
          }
          if(type === 'fill'){
            $scope.ecconfig.option.card.fillcolor = angular.copy($scope.fill_color);
          }
          if(type === 'stroke'){
            $scope.ecconfig.option.card.strokecolor = angular.copy($scope.stroke_color);
          }
          if(type === 'value'){
            $scope.ecconfig.option.card.valuecolor = angular.copy($scope.value_color);
          }
          if(type === 'bt'){
            $scope.ecconfig.title.textStyle.color = angular.copy($scope.titletextcolor);
          }

          if(type === 'sbt'){
            $scope.ecconfig.title.subtextStyle.color = angular.copy($scope.subtitletextcolor);
          }
        };
        $scope.setOrder = function () {
          if ($scope.freshModel) {
            $scope.ecconfig.mapdata.order_modal = angular.copy($scope.order_modal);
          }
        };
        $scope.setTitlePosition = function () {
          if ($scope.freshModel) {
            $scope.ecconfig.mapdata.map_title_left = angular.copy($scope.map_title_left);
          }
        };

        $scope.setNormalTitlePosition = function () {
          if ($scope.freshModel) {
            $scope.ecconfig.title.left = angular.copy($scope.normalTitlePosition);
          }
        };
        //mixed 
        $scope.mixedyFieldDrop = function(){
          $scope.ymodel.rename = $scope.ymodel.field;
          $scope.ymodel.type = 'bar';
          $scope.ymodel.truetype = 'bar';
          $scope.ymodel.isarea = '0';
          $scope.ymodel.smooth = false;//曲线为折线
          $scope.ymodel.showmax = false;//显示最大值气泡
          $scope.ymodel.showmin = false;//显示最小值气泡
          $scope.ymodel.showline = false;//均值线
          $scope.ymodel.basebar = false;//基础叠加柱
          $scope.ymodel.shadowbar = false;//作为阴影柱
          $scope.ymodel.newy = false;//独立Y轴
          $scope.ymodel.inversey = false;//Y轴反置
          $scope.ymodel.shownewy = $scope.ecconfig.field.y.length>0;//独立Y轴
          $scope.ymodel.autoColor = 'true';
          $scope.ymodel.color = "#333";
          $scope.ymodel.alertscount = 0;//警戒线条数
          $scope.ymodel.label = {
            normal:{
              show:'true',
              position:'top',
              rotate:'0'
            }
          };
          $scope.ecconfig.field.y.push(angular.copy($scope.ymodel));
        };
//k线图
        $scope.kyFieldDrop = function(){
          $scope.ymodel.rename = $scope.ymodel.field;
          $scope.ymodel.type = 'line';
          $scope.ymodel.truetype = 'line';
          $scope.ymodel.isarea = '0';
          $scope.ymodel.smooth = true;//曲线为折线
          $scope.ymodel.label = {
            normal:{
              show:'true',
              position:'top',
              rotate:'0'
            }
          };
          $scope.ecconfig.field.y.push(angular.copy($scope.ymodel));
        };

        $scope.pointFieldDrop  = function(){
          $scope.pointModel.color = "#333";
          $scope.pointModel.iftop = 'false';
          $scope.pointModel.order = 'asc';
          $scope.pointModel.order_num = '5';
          $scope.pointModel.top_color = 'blue';
          $scope.ecconfig.point.push({
            x:angular.copy($scope.pointModel),
            y:{},
            lon:{},
            lat:{}
          });
        };
        $scope.hasLegend = function(mark){
          if(['mixed','pie','funnel','scatter','radar'].indexOf(mark) >= 0){
            return true;
          }
          else{
            return false;
          }
        };
        $scope.piexFieldDrop = function(){
          $scope.piexmodel.label = {
            show:'true',
            position:'outside',
            showpercent:'true'
          };
          $scope.ecconfig.field.x.push(angular.copy($scope.piexmodel));
        };

        $scope.gaugeYFieldDrop = function(){
          $scope.gaugeY.name = "";
          $scope.gaugeY.showPercent = "false";
          $scope.gaugeY.decimals = 0;
          $scope.gaugeY.autoMax = "false";
          $scope.gaugeY.maxField = {};
          $scope.gaugeY.autoSplit = "false";//动态分段
          $scope.gaugeY.splitField = [];//动态分段
          $scope.gaugeY.splitcolor = "#f09426";//表盘颜色
          $scope.gaugeY.fullwidth = "80";//填充宽度
          $scope.gaugeY.max = "100";
          $scope.gaugeY.range = "0.2,0.8";
          $scope.gaugeY.style = {
            itemStyle: {//指针
                normal: {
                    shadowBlur: 15,
                     shadowColor: 'rgba(40, 40, 40, 0.5)'
                }
            },
            axisLine:{
              lineStyle:{
                width: 10
              }
            },
            axisTick:{
              length: '15',        // 属性length控制线长
              lineStyle: {       // 属性lineStyle控制线条样式
                  color: 'auto'
              }
            },
            splitLine:{
              length: '20',         // 属性length控制线长
              lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                  color: 'auto'
              }
            },
            detail:{
              fontSize:'12'
            },
            title:{
              fontSize:'20'
            }
          };
          $scope.ecconfig.field.y.push(angular.copy($scope.gaugeY));
        };

        $scope.singleFieldDrop = function(){
          $scope.singleModel.label = angular.copy($scope.singleModel.field);
          $scope.singleModel.unit = "";
          $scope.singleModel.plusicon = "false";
          $scope.singleModel._titleFontsize = 12;//不要用字符型,控件是int型绑定,会导致类型转换,$watch会刷新两次组件
          $scope.singleModel._valueFontsize = 12;
          $scope.singleModel._titleColor = '#000000';
          $scope.singleModel._valueColor = '#000000';
          $scope.ecconfig.field.y.push(angular.copy($scope.singleModel));
        };

        $scope.filterFieldDrop = function(){
          $scope.ecconfig.field.filters = $scope.ecconfig.field.filters||[];
          //$scope.filtermodal.rule ="==";
          //$scope.filtermodal.value ="";
          $scope.filtermodal.rules = []//[{id:1,parentid:0,relate:'and',rule:'',value:''},{id:2,parentid:1,name:$scope.filtermodal.field,relate:'and',rule:'==',value:'11'},{id:3,parentid:1,relate:'or',rule:'',value:''},
                   //{id:4,parentid:3,name:$scope.filtermodal.field,relate:'and',rule:'==',value:'221'},
                  //{id:5,parentid:3,name:$scope.filtermodal.field,relate:'and',rule:'==',value:'222'}];
          $scope.ecconfig.filter.filters.push(angular.copy($scope.filtermodal));
        };

        $scope.removeMix = function(field,num) {
          if (Array.isArray($scope.ecconfig.field[field])) { 
            $scope.ecconfig.field[field].splice(num,1);
          }
          else{
            $scope.ecconfig.field[field] = {};
          }
        };

        $scope.removeFilter = function (field,num){
          if(num!=undefined)
            $scope.ecconfig.filter[field].splice(num,1);
          else
            $scope.ecconfig.filter[field].field = {};
        };
        $scope.removePoint = function(field,num){
          if(field == 'x'){
              var a = confirm('是否删除这个标记');
            if(a){
              $scope.ecconfig.point.splice(num,1);
            }
          }
          else {
            $scope.ecconfig.point[num][field] = {};
          }
        };

        $scope.removeArea = function(field){
          $scope.ecconfig.area[field] = {};
        };
        // var specWatcher = $scope.$watch('spec', function (spec) {
        //   // populate anyChannelIds so we show all or them
        //   if ($scope.supportAny) {
        //     $scope.anyChannelIds = util.keys(spec.encoding).reduce(function (anyChannelIds, channelId) {
        //       if (Pills.isAnyChannel(channelId)) {
        //         anyChannelIds.push(channelId);
        //       }
        //       return anyChannelIds;
        //     }, []);
        //   }
        //   // Only call Pills.update, which will trigger Spec.spec to update if it's not a preview.
        //   if (!$scope.preview) {
        //     var Spec = Pills.update(spec);
        //     var logData = null;
        //     if (Spec) {
        //       if (Spec.charts) {
        //         logData = { specific: false, numCharts: Spec.charts.length };
        //       } else if (Spec.chart) {
        //         logData = { specific: true };
        //       } else {
        //         logData = { specific: false, numCharts: 0 };
        //       }
        //     }
        //     Logger.logInteraction(Logger.actions.SPEC_CHANGE, spec, logData);
        //   }
        // }, true); //, true /* watch equality rather than reference */);


        $scope.$on('$destroy', function () {
          // Clean up watcher
          specWatcher();
        });
      }
    };
  });
