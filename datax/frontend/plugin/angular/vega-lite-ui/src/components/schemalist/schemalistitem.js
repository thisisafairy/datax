'use strict';

/**
 * @ngdoc directive
 * @name polestar.directive:schemaListItem
 * @description
 * # schemaListItem
 */
angular.module('vlui')
  .directive('schemaListItem', function (Dataset, Drop, Logger, Pills, cql, consts) {
    return {
      templateUrl: 'components/schemalist/schemalistitem.html',
      restrict: 'E',
      replace: false,
      scope: {
        fieldDef: '=', // Two-way
        showAdd: '<',
        filterManager: '='
      },
      link: function postLink(scope, element) {
        scope.Dataset = Dataset;
        scope.consts = consts;
        scope.countFieldDef = Pills.countFieldDef;

        scope.isAnyField = false;
        scope.droppedFieldDef = null;
        scope.fieldInfoPopupContent = element.find('.schema-menu')[0];

        scope.isEnumSpec = cql.enumSpec.isEnumSpec;

        scope.fieldAdd = function (fieldDef) {
          Pills.add(fieldDef);
        };

        scope.toggleFilter = function () {
          if (!scope.filterManager) return;
          scope.filterManager.toggle(scope.fieldDef.field);
        };

        scope.fieldDragStart = function () {
          var fieldDef = scope.fieldDef;

          scope.pill = {
            field: fieldDef.field,
            title: fieldDef.title,
            type: fieldDef.type,
            aggregate: fieldDef.aggregate
          };
          Pills.dragStart(scope.pill, null);
        };

        scope.fieldDragStop = Pills.dragStop;

        scope.fieldDropped = function () {
          Pills.addWildcardField(scope.fieldDef, scope.droppedFieldDef);
          Logger.logInteraction(Logger.actions.ADD_WILDCARD_FIELD, scope.fieldDef, {
            addedField: scope.droppedFieldDef
          });
          scope.droppedFieldDef = null;
        };

        scope.removeWildcardField = function (index) {
          var field = scope.fieldDef.field;
          Logger.logInteraction(Logger.actions.REMOVE_WILDCARD_FIELD, scope.fieldDef, {
            removedField: field.enum[index] === '*' ? 'COUNT' : field.enum[index]
          });
          Pills.removeWildcardField(scope.fieldDef, index);
        };

        scope.removeWildcard = function () {
          Logger.logInteraction(Logger.actions.REMOVE_WILDCARD, scope.fieldDef);
          Pills.removeWildcard(scope.fieldDef);
        };

        // TODO(https://github.com/vega/vega-lite-ui/issues/187):
        // consider if we can use validator / cql instead
        var thisType = {
          "Type": {
            "QUANTITATIVE": "quantitative",
            "quantitative": "QUANTITATIVE",
            "ORDINAL": "ordinal",
            "ordinal": "ORDINAL",
            "TEMPORAL": "temporal",
            "temporal": "TEMPORAL",
            "NOMINAL": "nominal",
            "nominal": "NOMINAL"
          },
          "QUANTITATIVE": "quantitative",
          "ORDINAL": "ordinal",
          "TEMPORAL": "temporal",
          "NOMINAL": "nominal",
          "SHORT_TYPE": {
            "quantitative": "Q",
            "temporal": "T",
            "nominal": "N",
            "ordinal": "O"
          },
          "TYPE_FROM_SHORT_TYPE": {
            "Q": "quantitative",
            "T": "temporal",
            "O": "ordinal",
            "N": "nominal"
          }
        };
        var allowedCasting = {
          integer: [thisType.QUANTITATIVE, thisType.ORDINAL, thisType.NOMINAL],
          number: [thisType.QUANTITATIVE, thisType.ORDINAL, thisType.NOMINAL],
          date: [thisType.TEMPORAL],
          string: [thisType.NOMINAL],
          boolean: [thisType.NOMINAL],
          all: [thisType.QUANTITATIVE, thisType.TEMPORAL, thisType.ORDINAL, thisType.NOMINAL]
        };

        var unwatchFieldDef = scope.$watch('fieldDef', function (fieldDef) {
          if (cql.enumSpec.isEnumSpec(fieldDef.field)) {
            scope.allowedTypes = allowedCasting.all;
          } else {
            scope.allowedTypes = allowedCasting[fieldDef.primitiveType];
          }

          scope.isAnyField = cql.enumSpec.isEnumSpec(fieldDef.field);
        });

        scope.fieldTitle = function (field) {
          if (cql.enumSpec.isEnumSpec(field)) {
            return (field.enum || ['Wildcard'])
              .map(function (field) {
                return field === '*' ? 'COUNT' : field;
              }).join(',');
          }
          return field;
        };

        scope.$on('$destroy', function () {
          scope.fieldAdd = null;
          scope.fieldDragStop = null;
          scope.isEnumSpec = null;

          unwatchFieldDef();
        });
      }
    };
  });
