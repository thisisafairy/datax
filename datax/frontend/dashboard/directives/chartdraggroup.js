/**
 * Created by Administrator on 2017/8/2.
 */
(function () {
  'use strict';
  angular.module('appdesignboard').directive('chartGroup', function () {
    return {
      templateUrl: '/frontend/dashboard/directives/chartdraggroup.html',
      restrict: 'AE',
      replace: true,
      scope: {
        kinds: '=',// two-way binding.
        test:'@data'
      },
      link: function (scope, element, attr) {
                console.log('init', scope.test)

                attr.$observe('data', function (val) {
                    console.log(val)
                })
            },
      controller: function () {
      }
    };
  });
}());
