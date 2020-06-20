'use strict';

angular.module('vlui')
  .directive('ecChannel', ['Drop', function (Drop) {
    return {
      templateUrl: 'components/ecchannel/ecchannel.html',
      restrict: 'E',
      replace: true,
      scope: {
        modal: '=',
        field: '=',
        canDrag: '<',
        channelTitle: '<',
        removeAction: '&',
        canDrop: '<',
        dropType: '<',
        moreDrag: '<'

      },
      link: function (scope, element /*, attrs*/) {
        scope.FieldDropped = function () {
          scope.field = angular.copy(scope.thismodal);
        };

        // scope.maxDropped = function(){
        //   scope.field.maxField = angular.copy(scope.maxField);
        // };
        if (element.find('.type-caret').length > 0 && element.find('.echart-type').length > 0) {
          var typePopup = new Drop({
            content: element.find('.echart-type')[0],
            target: element.find('.type-caret')[0],
            position: 'top left',
            openOn: 'click'
          });
          if (scope.dropType == 'type' && scope.field && scope.field.color) {
            scope.mix_color = angular.copy(scope.field.color);
            typePopup.on('open', function () {
              $(".drop-content .color-input").colorpicker({ align: 'right' }).on('changeColor', function () {
                scope.mix_color = $(this).val();
              });
            });
          }
          if (scope.dropType == 'mappoint' && scope.field && scope.field.color) {
            scope.point_color = angular.copy(scope.field.color);
            scope.point_top_color = angular.copy(scope.field.top_color);
            typePopup.on('open', function () {
              $(".drop-content .point-color-input").colorpicker({ align: 'right' }).on('changeColor', function () {
                if($(this).attr('rel') == 'normal'){
                  scope.point_color = $(this).val();
                }
                if($(this).attr('rel') == 'top'){
                  scope.point_top_color = $(this).val();
                }
              });
            });
          }
        }

        scope.setMixColor = function () {
          scope.field.color = angular.copy(scope.mix_color);
          typePopup.open();
        };

        scope.setPointColor = function (type) {
          if(type == 'normal'){
            scope.field.color = angular.copy(scope.point_color);
          }
          if(type == 'top'){
            scope.field.top_color = angular.copy(scope.point_top_color);
          }
          typePopup.open();
        };

        scope.$watch('field.truetype', function (n) {
          if (!scope.field || !scope.field.truetype || !scope.field.type) {
            return;
          }
          if (n === 'area') {
            scope.field.type = 'line';
            scope.field.isarea = '1';
          }
          else {
            scope.field.type = n;
          }
          if (n !== 'bar') {
            scope.field.label.normal.position = 'top';
          }
        });

        scope.$on('$destroy', function () {
          if (typePopup && typePopup.destroy) {
            typePopup.destroy();
          }
        });
      }
    };
  }]);