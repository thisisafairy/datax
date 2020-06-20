'use strict';

angular.module('vlui')
  .directive('channelShelf', ['ANY', 'Dataset', 'Pills', '_', 'Drop', 'Logger', 'vl', 'cql', 'Schema', 'consts', function(ANY, Dataset, Pills, _, Drop, Logger, vl, cql, Schema, consts) {
    return {
      templateUrl: 'components/channelshelf/channelshelf.html',
      restrict: 'E',
      replace: true,
      scope: {
      },
      link: function() {
      }
    };
  }]);