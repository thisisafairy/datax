app.directive('multiSelect', function () {
    return {
        restrict: 'E',
        templateUrl: '/frontend/dashboard/directives/multi-select.html',
        replace: true,
        scope: {
            data: '=', //数据集
            idField: '=',//需要当做值的字段
            textField: '=',//需要显示的字段
            groupField: '=',//分组依据的字段
            countField: '=',//数据集中每个值出现的次数
            selectDatas: '=',//选中的值列表
            modelChange: '&'//change事件
        },
        link: function (scope, element, attrs, controller) {

        },
        controller: function ($scope, $http, $element, $timeout) {
            $scope.options = [];
            $scope.items = [];
            $scope.filterText = '';
            $scope.$watch('data', function () {
                $scope.items = [];
                $scope.data.forEach(function (value, key, arr) {
                    var obj = {
                        'id': value[$scope.idField],
                        'name': value[$scope.textField],
                        'show': true,
                        'checked': false
                    };
                    if ($scope.countField && $scope.countField.length > 0) {
                        obj['count'] = value[$scope.countField];
                    } else {
                        obj['count'] = -1;
                    }
                    $scope.items.push(obj);
                });
            }, true);

            $scope.filterChange = function () {
                $scope.items.forEach(function (item) {
                    if ($scope.filterText == '' || item['name'].indexOf($scope.filterText) > -1) {
                        item['show'] = true;
                    } else {
                        item['show'] = false;
                        item['checked'] = false;
                    }
                });
                $scope.productReturnValue();
            };

            $scope.selectChange = function (item) {
                item['checked'] = !item['checked'];
                $scope.productReturnValue();
            }

            $scope.productReturnValue = function () {
                var tempData = [];
                $scope.items.forEach(function (value) {
                    if (value['checked']) {
                        tempData.push({
                            'value': value['id'],
                            'text': value['name']
                        });
                    }
                });
                $scope.selectDatas = angular.copy(tempData);
                $timeout(function () {
                    $scope.modelChange();
                });
            };

            $scope.deleteChecked = function (index, item) {
                $scope.items.forEach(function (value) {
                    if (item['text'] == value['name']) {
                        value['checked'] = false;
                    }
                });
                $scope.productReturnValue();
            };

            $scope.showDropDown = function () {
                $(".select-drop-down").show();
            };

            $scope.$watch('selectDatas', function () {
                var totalWidth = $($element).find('.selected-data').width();
            }, true);

            $timeout(function () {
                $(document).bind("click",function(e){
                    var target = $(e.target);
                    if(target.closest(".multiple-select-panel").length == 0){
                        $(".select-drop-down").hide();
                    }　
                })
            });

        }
    };
});
app.filter('fixBrackets', function () {
    return function(val){
        if (val && parseInt(val) >= 0) {
            return '(' + val + ')'
        }
		return '';
	}
});