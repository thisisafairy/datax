'use strict';

angular.module('vlui')
  .directive('vlPlot', function() {
   

    return {
      templateUrl: 'components/vlplot/vlplot.html',
      restrict: 'E',
      scope: {
       
      },
      replace: true,
      link: function() {
      }
    };
  });
