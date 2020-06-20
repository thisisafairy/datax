/**
 * Created by Administrator on 2017/8/2.
 */
angular.module('appdesignboard')
  .directive('chartDrag', function () {
    return {
      templateUrl: '/frontend/dashboard/directives/chartdrag.html',
      restrict: 'E',
      replace: true,
      scope: {
        data: '='// This one is really two-way binding.
      },
      link: function postLink() {
       
      },
      controller:function(){

      }
    };
  });
