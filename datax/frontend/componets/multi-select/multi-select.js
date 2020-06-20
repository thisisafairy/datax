angular.module('multiSelect', [])
    .directive('multiSelect', function() {
        return {
            templateUrl: '/frontend/componets/multi-select/multi-select.html?v=1.02',
            restrict: 'E',
            scope: {
                items: '=',
                displayField: '=', // 显示的字段
                valueField: '=?valueField', // 值字段，非必须，为空则返回选中的行对象
                multiple: '=?multiple', // 是否多选 true 或者 false
                value: '=',
                filter: '=?filter',
                componentStyle: '=?componentStyle',
                valueChange: '&'
            },
            link: function(scope, element /*, attrs*/ ) {},
            controller: function($scope, $element, $http, $timeout) {
                $scope.selectValue = ''
                $scope.componentUuid = generateUuid(8, 16)
                $scope.contentClass = 'multi-select-' + $scope.componentUuid
                $scope.valueClass = 'multi-select-value-' + $scope.componentUuid
                $scope.panelClass = 'multi-select-panel-' + $scope.componentUuid
                $scope.iconClass = 'multi-select-icon-' + $scope.componentUuid
                if (!$scope.valueChange || typeof $scope.valueChange != 'function') {
                    $scope.valueChange = function () {
                        
                    }
                }

                // 是否多选
                if (!$scope.multiple) {
                    $scope.multiple = false
                }

                //过滤器形式强制单选
                if ($scope.filter) {
                    $scope.multiple = false
                    $element.find('.multi-select-value').attr('placeholder','请输入...')
                } else {
                    $element.find('.multi-select-value').attr('readonly','readonly')
                }

                if (!$scope.componentStyle || $scope.componentStyle.length === 0) {
                    $scope.componentStyle = 'select-bootstrap'
                } else {
                    $scope.componentStyle = 'select-' + $scope.componentStyle
                }

                $scope.changeFilterValue = function () {
                    if ($scope.filter) {
                        $scope.list.forEach(function (item) {
                            if ((item[$scope.displayField]+'').indexOf($scope.selectValue+'') > -1) {
                                item['hide'] = false
                            } else {
                                item['hide'] = true
                            }
                        })
                    }
                }

                //
                $scope.initSelectValue = function () {
                    if ($scope.value) {
                        for (var _i = 0; _i < $scope.items.length; _i++) {
                            if ($scope.items[_i][$scope.valueField] === $scope.value) {
                                $scope.selectValue = $scope.items[_i][$scope.displayField]
                            }
                        }
                    }
                }
                $scope.initSelectValue()

                // 返回值或行对象
                $scope.returnObj = true
                if ($scope.valueField && $scope.valueField.length > 0) {
                    $scope.returnObj = false
                }

                $scope.getSelect = function (row) {
                    if ($scope.multiple) {
                        if ($scope.returnObj) {
                            $scope.value = []
                        } else {
                            $scope.value = ''
                        }
                        row['checked'] = !row['checked']
                        $timeout(function() {
                            $scope.valueChange();
                        })
                    } else {
                        $scope.clearChecked()
                        row['checked'] = true
                        $scope.selectValue = row[$scope.displayField]
                        if ($scope.returnObj) {
                            $scope.value = row
                        } else {
                            $scope.value = row[$scope['valueField']]
                        }
                        $timeout(function() {
                            $scope.valueChange();
                            $scope.closePanel()
                        })
                    }
                }

                $scope.deleteSelect = function () {
                    $scope.selectValue = ''
                    if ($scope.returnObj) {
                        if ($scope.multiple) {
                            $scope.value = []
                        } else {
                            $scope.value = {}
                        }
                    } else {
                        $scope.value = ''
                    }
                    $scope.clearChecked()
                    $timeout(function() {
                        $scope.valueChange();
                        $scope.closePanel()
                    })
                }

                $scope.clearChecked = function () {
                    $scope.list.forEach(function (_value) {
                        _value['checked'] = false
                    })
                }

                $scope.openSelectPanel = function () {
                    $scope.closePanel()
                    $('.' + $scope.iconClass).removeClass('fa-angle-down').addClass('fa-angle-up')
                    $('.' + $scope.contentClass).addClass('input-focus')
                    $('.' + $scope.panelClass).addClass('panel-show')

                }

                $scope.closePanel = function () {
                    $('.' + $scope.panelClass).removeClass('panel-show')
                    $('.' + $scope.contentClass).removeClass('input-focus')
                    $('.' + $scope.iconClass).removeClass('fa-angle-up').addClass('fa-angle-down')
                }

                $(document).bind("click",function(e){
                    var target = $(e.target);
                    if(target.closest('.' + $scope.contentClass).length === 0){
                        $scope.closePanel()
                    }
                });           

                $scope.$watch('items', function () {
                    if ($scope.items && $scope.items.length >= 0) {
                        $scope.list = angular.copy($scope.items)
                    }
                }, true)

                $scope.$watch('value', function () {
                    if ($scope.items && $scope.items.length >= 0
                        && isNotNull($scope.value) && isNotNull($scope.valueField)
                        && ($scope.selectValue != $scope.value)) {
                        $scope.list = angular.copy($scope.items)
                        if ($scope.multiple) {
                            var _tempValArr = $scope.value.split(',')
                            var _tempArr = []
                            $scope.list.forEach(function (val) {
                                for (var _i = 0; _i < _tempValArr.length; _i++) {
                                    if ((val[$scope.valueField] + '') == (_tempValArr[_i] + '')) {
                                        val['checked'] = true
                                        break
                                    }
                                }
                            })
                            $scope.selectValue = _tempArr.join(', ')
                        } else {
                            $scope.items.forEach(function(val) {
                                if (val[$scope.valueField] == $scope.value) {
                                    $scope.selectValue = val[$scope.displayField]
                                }
                            })
                        }
                    } else if (isNull($scope.value)) {
                        $scope.selectValue = ''
                    }
                })

                $scope.$watch('list', function () {
                    //多选
                    if ($scope.multiple) {
                        var _tempArr = []
                        var _tempObjArr = []
                        $scope.list.forEach(function (_value) {
                            if (_value['checked']) {
                                _tempObjArr.push(_value)
                                _tempArr.push(_value[$scope.displayField])
                            }
                        })
                        $scope.selectValue = _tempArr.join(', ')
                    }
                }, true)
            }
        }
    })