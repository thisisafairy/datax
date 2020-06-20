'use strict';

/**
 * @ngdoc directive
 * @name vega-lite-ui.directive:visListItem
 * @description
 * # visListItem
 */
angular.module('vlui')
  .directive('vlPlotGroup', function () {
    return {
      templateUrl: 'components/vlplotgroup/vlplotgroup.html',
      restrict: 'E',
      replace: true,
      controller: function() {
        // this.getDropTarget = function() {
        //   return $element.find('.fa-wrench')[0];
        // };
      },
      scope: {
        
      },
      link: function postLink() {
       
      }
    };
  });
