
angular.module('groupSelect', [])
    .directive('groupSelect', function() {
        return {
            templateUrl: '/frontend/componets/groupselect/group-select.html?v=1.02',
            restrict: 'E',
            scope: {
                items: '=',
                groupField: '=', // 分组字段， 必须
                displayField: '=', // 显示在下拉中的字段， 必须
                valueField: '=?valueField', // 需要返回的字段，无此属性则返回行对象
                multiple: '=?multiple', // 多选
                value: '=', //用于接收返回值的ngModel
                filter: '=?filter',
                componentStyle: '=?componentStyle',
                valueChange: '&'
            },
            link: function(scope, element /*, attrs*/ ) {},
            controller: function($scope, $element, $http, $timeout) {
                $scope.componentUuid = generateUuid(8, 16)
                $scope.contentClass = 'group-select-' + $scope.componentUuid
                $scope.valueClass = 'group-select-value-' + $scope.componentUuid
                $scope.panelClass = 'group-select-panel-' + $scope.componentUuid
                $scope.iconClass = 'group-select-icon-' + $scope.componentUuid
                $scope.returnObj = true
                if ($scope['valueField'] && $scope['valueField'].length > 0) {
                    $scope.returnObj = false
                }
                if (!$scope.componentStyle || $scope.componentStyle.length === 0) {
                    $scope.componentStyle = 'select-bootstrap'
                } else {
                    $scope.componentStyle = 'select-' + $scope.componentStyle
                }
                //过滤器形式强制单选
                if ($scope.filter) {
                    $scope.multiple = false
                    $element.find('.group-select-value').attr('placeholder','请输入...')
                } else {
                    $element.find('.group-select-value').attr('readonly','readonly')
                }
                $scope.selectValue = ''
                $scope.itemsObj = {}
                $scope.initComponent = function () {
                    $scope.list = []
                    $scope.tempList.forEach(function(_value, _index, _arr) {
                        var _tempKeys = '_,_' + Object.keys($scope.itemsObj).join("_,_") + '_,_'
                        if (_tempKeys.indexOf('_,_' + _value[$scope['groupField']] + '_,_') < 0) {
                            $scope.itemsObj[_value[$scope['groupField']]] = []
                        }
                        _value['checked'] = false;
                        $scope.itemsObj[_value[$scope['groupField']]].push(_value)
                    })
                    var objKeys = Object.keys($scope.itemsObj)
                    if (objKeys.length > 0) {
                        objKeys.forEach(function(_value, _index, _arr) {
                            $scope.list.push({
                                'name': _value,
                                'hide': false,
                                'child': $scope.itemsObj[_value]
                            })
                        })
                    }
                }

                $scope.initSelectValue = function () {
                    if ($scope.value) {
                        for (var _i = 0; _i < $scope.tempList.length; _i++) {
                            if ($scope.tempList[_i][$scope.valueField] === $scope.value) {
                                $scope.selectValue = $scope.tempList[_i][$scope.displayField]
                            }
                        }
                    }
                }

                $scope.changeFilterValue = function() {
                    $scope.list.forEach(function (value) {
                        var _tempCount = 0
                        value.child.forEach(function (child) {
                            if ((child.name + '').indexOf($scope.selectValue + '') > -1 || $scope.selectValue == '') {
                                _tempCount = 1
                                child['hide'] = false
                            } else {
                                child['hide'] = true
                            }
                        })
                        if (_tempCount === 0) {
                            value['hide'] = true
                        } else {
                            value['hide'] = false
                        }
                    })
                }

                $scope.openSelectPanel = function () {
                    $scope.closePanel()
                    $('.' + $scope.iconClass).removeClass('fa-angle-down').addClass('fa-angle-up')
                    $('.' + $scope.contentClass).addClass('input-focus')
                    $('.' + $scope.panelClass).addClass('panel-show')
                }

                $scope.getSelect = function (row) {
                    if ($scope.multiple) {
                        if ($scope.returnObj) {
                            $scope.value = []
                        } else {
                            $scope.value = ''
                        }
                        row['checked'] = !row['checked']
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
                            $scope.onValueChange();
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
                        $scope.onValueChange();
                        $scope.closePanel()
                    })
                }

                $scope.closePanel = function () {
                    $('.' + $scope.panelClass).removeClass('panel-show')
                    $('.' + $scope.contentClass).removeClass('input-focus')
                    $('.' + $scope.iconClass).removeClass('fa-angle-up').addClass('fa-angle-down')
                }

                $scope.clearChecked = function () {
                    $scope.list.forEach(function (_value) {
                        _value.child.forEach(function (_row) {
                            _row['checked'] = false
                        })
                    })
                }

                $(document).bind("click",function(e){
                    var target = $(e.target);
                    if(target.closest('.' + $scope.contentClass).length === 0){
                        $scope.closePanel()
                    }
                });

                $scope.$watch('items', function () {
                    if ($scope.items && $scope.items.length >= 0) {
                        $scope.tempList = angular.copy($scope.items)
                        $scope.initSelectValue()
                        $scope.initComponent()
                    }
                }, true)

                $scope.$watch('value', function () {
                    if ($scope.items && $scope.items.length >= 0
                        && isNotNull($scope.value) && isNotNull($scope.valueField)
                        && isNull($scope.selectValue)) {
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
                    }
                })

                $scope.$watch('list', function () {
                    //多选
                    if ($scope.multiple && $scope.list) {
                        var _tempArr = []
                        var _tempObjArr = []
                        var _tempValueArr = []
                        $scope.list.forEach(function (_value) {
                            _value.child.forEach(function (_row) {
                                if (_row['checked']) {
                                    _tempObjArr.push(_row)
                                    if ($scope.valueField) {
                                        _tempValueArr.push(_row[$scope.valueField])
                                    }
                                    _tempArr.push(_row[$scope.displayField])
                                }
                            })
                        })
                        $scope.selectValue = _tempArr.join(', ')
                        if ($scope.returnObj) {
                            $scope.value = angular.copy(_tempObjArr)
                        } else {
                            $scope.value = _tempValueArr.join(', ')
                        }
                        $timeout(function() {
                            $scope.onValueChange();
                        })
                    }
                }, true)

                $scope.onValueChange = function () {
                    if($scope.valueChange && typeof $scope.valueChange == 'function') {
                        $scope.valueChange();
                    }
                }
            }
        };
    });