'use strict';

angular.module('vlui')
  .directive('vlPlotGroupList', function () {
    return {
      templateUrl: 'components/vlplotgrouplist/vlplotgrouplist.html',
      restrict: 'E',
      replace: true,
      scope: {
      
      },
      link: function postLink(/*scope ,element, attrs*/) {
      }
    };
  });
