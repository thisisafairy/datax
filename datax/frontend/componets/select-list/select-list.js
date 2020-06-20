angular.module('selectList', [])
    .directive('selectList', function() {
        return {
            templateUrl: '/frontend/componets/select-list/select-list.html?v=1.01',
            restrict: 'E',
            scope: {
                items: '=',
                displayField: '=', // 显示的字段
                valueField: '=?valueField', // 值字段，非必须，为空则返回选中的行对象
                multiple: '=?multiple', // 是否多选 true 或者 false
                value: '=',
                filter: '=?filter',
                titleName: '=?titleName',
                showSelectCount: '=?showSelectCount',
                componentStyle: '=?componentStyle',
                valueChange: '&',
                dbClickFunction: '&'
            },
            link: function(scope, element /*, attrs*/ ) {},
            controller: function($scope, $element, $http, $timeout) {
                var vm = $scope
                vm.selectValue = ''
                vm.componentUuid = generateUuid(8, 16)
                vm.contentClass = 'select-list-' + vm.componentUuid
                vm.valueClass = 'select-list-value-' + vm.componentUuid
                vm.panelClass = 'select-list-panel-' + vm.componentUuid
                if (!vm.valueChange || typeof vm.valueChange != 'function') {
                    vm.valueChange = function () {

                    }
                }

                if (!vm.dbClickFunction || typeof vm.dbClickFunction != 'function') {
                    vm.dbClickFunction = function () {

                    }
                }

                if (vm.multiple || vm.titleName || vm.showSelectCount) {
                    $($element).find('.select-list-full-content').css('padding-top', '34px')
                } else {
                    $($element).find('.select-list-header').hide()
                }

                if (vm.filter) {
                    $($element).find('.select-list-full-content').css('select-list-body', '40px')
                }

                if (!vm.componentStyle || vm.componentStyle.length === 0) {
                    vm.componentStyle = 'select-bootstrap'
                } else {
                    vm.componentStyle = 'select-' + vm.componentStyle
                }

                vm.selectItem = function (row, type) {
                    if (vm.multiple) {

                    } else {
                        vm.clearChecked()
                        row['checked'] = true
                        if (vm.valueField) {
                            vm.value = row[vm.valueField]
                        } else {
                            vm.value = row
                        }
                    }
                    $timeout(function() {
                        if (type === 'db') {
                            $scope.dbClickFunction();
                        } else {
                            $scope.valueChange();
                        }
                    })
                }

                vm.clearChecked = function () {
                    vm.list.forEach(function (value, index) {
                        value['checked'] = false
                    })
                }

                vm.list = []

                vm.$watch('items', function () {
                    if (vm.items && vm.items.length >= 0) {
                        vm.list = angular.copy(vm.items)
                        vm.clearChecked()
                    }
                }, true)
            }
        }
    })