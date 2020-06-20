(function () {
    "use strict";
    angular.module('dataxUI', ['dataxUtils'])
        /* #region 图标 icon 使用参考 frontend\plugin\datax-font\demo_index.html */
        .directive('dxIcon', function () {
            return {
                restrict: 'A',
                replace: true,
                scope: {
                    type: '@'
                },
                template: '<i ng-class="iconCls"></i>',
                link: function (scope) {
                    scope.iconCls = {}
                    scope.iconCls['icon'] = true
                    scope.iconCls['dx-font'] = true
                    scope.iconCls['dx-' + scope.type] = true
                }
            }
        })
        /* #endregion */
        /* #region 布局 grid */
        .directive('dxRow', ['dom', function (dom) {
            return {
                restrict: 'AE',
                replace: true,
                scope: {
                    gutter: '@'
                },
                transclude: true,
                template: '<div ng-class="rowCls" ng-style="rowStyle" ng-transclude></div>',
                controller: function ($scope, $element) {

                },
                link: function (scope, element, attrs, ctrl) {
                    attrs.$observe('gutter', function (newVal) {
                        ctrl.gutter = parseInt(scope.gutter || 0)
                        if (angular.isNumber(ctrl.gutter)) {
                            ctrl.gutter = parseInt(scope.gutter || 0)
                            if (ctrl.gutter == 0) {
                                scope.rowStyle = {};
                            } else {
                                scope.rowStyle = {
                                    'marginLeft': (ctrl.gutter / 2) + 'px',
                                    'marginRight': (ctrl.gutter / 2) + 'px'
                                };
                            }
                        }
                    });
                    scope.updateCls = function () {
                        scope.rowCls = {};
                        scope.rowCls['dx-row'] = true
                    }
                    scope.updateCls()
                }
            }
        }])
        .directive('dxCol', ['dom', function (dom) {
            return {
                restrict: 'AE',
                replace: true,
                require: '^^dxRow',
                scope: {
                    span: '@',
                    offsetXs: '@',
                    offsetSm: '@',
                    offsetMd: '@',
                    offsetLg: '@',
                    offsetXl: '@',
                    offsetXll: '@',
                    xs: '@',
                    sm: '@',
                    md: '@',
                    lg: '@',
                    xl: '@',
                    xxl: '@',
                    empty: '@',
                },
                transclude: true,
                template: '<div ng-class="colCls" ng-style="colStyle" ng-transclude></div>',
                controller: function ($scope, $element) {

                },
                link: function (scope, element, attrs, ctrl) {
                    var vm = scope
                    scope.rowCtrl = ctrl
                    scope.prefixCls = 'dx-col'
                    scope.$watch('rowCtrl.gutter', function (newVal) {
                        if (newVal == 0) {
                            scope.colStyle = {};
                        } else {
                            scope.colStyle = {
                                'paddingLeft': (ctrl.gutter / 2) + 'px',
                                'paddingRight': (ctrl.gutter / 2) + 'px'
                            }
                        }

                    })

                    scope.validateAttr = function (value) {
                        if (value != undefined && value != null && parseInt(value) != NaN) {
                            return true
                        } else {
                            return false
                        }
                    }
                    if (!scope.validateAttr(vm.xs)) {
                        vm.xs = 24
                    }
                    if (!scope.validateAttr(vm.sm)) {
                        vm.sm = 6
                    }
                    scope.updateCls = function () {
                        scope.colCls = {}
                        scope.colCls[scope.prefixCls] = true
                        scope.colCls[scope.prefixCls + '-span-' + vm.span] = scope.validateAttr(vm.span)
                        scope.colCls[scope.prefixCls + '-xs-offset-' + vm.offsetXs] = scope.validateAttr(vm.offsetXs)
                        scope.colCls[scope.prefixCls + '-sm-offset-' + vm.offsetSm] = scope.validateAttr(vm.offsetSm)
                        scope.colCls[scope.prefixCls + '-md-offset-' + vm.offsetMd] = scope.validateAttr(vm.offsetMd)
                        scope.colCls[scope.prefixCls + '-lg-offset-' + vm.offsetLg] = scope.validateAttr(vm.offsetLg)
                        scope.colCls[scope.prefixCls + '-xl-offset-' + vm.offsetXl] = scope.validateAttr(vm.offsetXl)
                        scope.colCls[scope.prefixCls + '-xll-offset-' + vm.offsetXll] = scope.validateAttr(vm.offsetXll)
                        scope.colCls[scope.prefixCls + '-xs-' + vm.xs] = scope.validateAttr(vm.xs)
                        scope.colCls[scope.prefixCls + '-sm-' + vm.sm] = scope.validateAttr(vm.sm)
                        scope.colCls[scope.prefixCls + '-md-' + vm.md] = scope.validateAttr(vm.md)
                        scope.colCls[scope.prefixCls + '-lg-' + vm.lg] = scope.validateAttr(vm.lg)
                        scope.colCls[scope.prefixCls + '-xl-' + vm.xl] = scope.validateAttr(vm.xl)
                        scope.colCls[scope.prefixCls + '-xxl-' + vm.xxl] = scope.validateAttr(vm.xxl)
                        scope.colCls[scope.prefixCls + '-empty'] = scope.empty
                    }
                    scope.updateCls()
                }
            }
        }])
        /* #endregion */
        /* #region 单选框 radio */
        .directive('dxRadio', function () {
            return {
                restrict: 'AE',
                replace: true,
                transclude: true,
                scope: {
                    // checked:"=",
                    defaultchecked: '@',
                    value: '@'
                },
                template: '<label class="datax-radio-wrapper">\
                    <span class="datax-radio {{radioClass}}">\
                        <input type="radio" value="{{value}}" class="datax-radio-input" ng-model="$parent.$parent.dxModel" >\
						<span class="datax-radio-inner"></span>\
					</span>\
					<span ng-transclude></span>\
				 </label>',
                link: function (scope, element, attrs) {
                    scope.$watch('$parent.$parent.dxModel', function (newVal) {
                        if (newVal == scope.value) {
                            scope.radioClass = "datax-radio-checked";
                        } else {
                            scope.radioClass = "";
                        }
                    })
                }
            }
        })
        .directive('dxRadioGroup', function () {
            return {
                restrict: 'AE',
                replace: true,
                transclude: true,
                scope: {
                    defaultvalue: "@",
                    dxModel: '=?',
                    dxChange: '&'
                },
                template: '<div class="datax-radio-group" ng-transclude></div>',
                link: function (scope) {
                    if (scope.defaultvalue) {
                        scope.dxModel = scope.defaultvalue;
                    }
                }

            }
        })
        /* #endregion */
        /* #region 按钮 button */
        .constant('btnSize', {
            small: 'sm',
            large: 'lg'
        })
        .directive('dxButton', ['$timeout', 'btnSize', function ($timeout, btnSize) {
            return {
                restrict: 'AE',
                transclude: true,
                replace: true,
                scope: {
                    type: "@",
                    click: "&",
                    htmltype: "@",
                    disabled: "@",
                    icon: '@',
                    shape: '@',
                    size: '@',
                    loading: '@',
                    ghost: '=',
                    style: '@'
                },
                template: '<button ng-click="clickBtn()" style="{{ style }}" ng-class="btnCls" type="{{htmltype}}">\
					<i ng-class="iconCls" ng-if="!loading && icon"></i>\
					<span ng-transclude ng-if="shape==\'circle\'?false:true"></span>\
				</button>',
                link: function (scope, element, attrs) {
                    var prefixCls = 'datax-btn';
                    scope.iconCls = 'icon dx-font dx-' + scope.icon;
                    scope.elAttr = attrs;
                    scope.clickBtn = function () {
                        if (scope.click) {
                            scope.click()
                        }
                    }

                    scope.$watchCollection('elAttr', function (newVal, oldVal) {
                        updateCls();
                    });

                    function updateCls() {
                        scope.btnCls = {};
                        scope.btnCls[prefixCls] = true;
                        scope.btnCls[prefixCls + '-' + scope.type] = scope.type;
                        scope.btnCls[prefixCls + '-' + btnSize[scope.size]] = scope.size;
                        scope.btnCls[prefixCls + '-' + scope.shape] = scope.shape;
                        scope.btnCls[prefixCls + '-background-ghost'] = scope.ghost;
                    }
                }
            }
        }])
        .directive('dxButtonGroup', ['btnSize', function (btnSize) {
            return {
                restrict: 'AE',
                replace: true,
                transclude: true,
                scope: {
                    size: "@"
                },
                template: '<div ng-class="btnGroupCls" ng-transclude></div>',
                link: function (scope, element, attrs) {
                    var prefixCls = 'datax-btn-group';
                    scope.$watch('size', function () {
                        updateCls();
                    })

                    function updateCls() {
                        scope.btnGroupCls = {};
                        scope.btnGroupCls[prefixCls] = true;
                        scope.btnGroupCls[prefixCls + '-' + btnSize[scope.size]] = scope.size;
                    }
                }
            }
        }])
        /* #endregion */
        /* #region 多选框 checkbox */
        .directive('dxCheckbox', ['$document', function ($document) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    checked: '=?',
                    disabled: '=?disabled',
                    dxChange: '&',
                },
                template: '<label class="datax-checkbox-wrapper">\
                                <span class="datax-checkbox {{checkClass}} {{disabledClass}}">\
                                    <input type="checkbox" ng-model="checked" class="datax-checkbox-input" ng-disabled="disabled">\
                                    <span class="datax-checkbox-inner"></span>\
                                </span>\
                                <span ng-transclude></span>\
                            </label>',
                link: function (scope, element) {
                    scope.$watch('checked', function (newVal) {
                        if (scope.dxChange) {
                            scope.dxChange()
                        }
                        if (newVal) {
                            scope.checkClass = 'datax-checkbox-checked';
                        } else {
                            scope.checkClass = '';
                        }
                    })
                    scope.$watch('disabled', function (newVal) {
                        if (newVal) {
                            scope.disabledClass = 'datax-checkbox-disabled'
                            scope.disabled = true
                        } else {
                            scope.disabledClass = ''
                            scope.disabled = false
                        }
                    })
                }
            }
        }])
        /* #endregion */
        /* #region 选择器 select */
        .directive('dxSelect', ['dom', function (dom) {
            return {
                restrict: 'E',
                scope: {
                    items: '=?items',
                    dxValue: '=?dxValue',
                    dxLabel: '=?dxLabel',
                    dxModel: '=dxModel',
                    dxGroup: '=?dxGroup',
                    remote: '=?remote',
                    multiple: '=?multiple',
                    dxPlaceholder: '=?dxPlaceholder',
                    dxChange: '&',
                    dxClass: '=?dxClass', //自定义的class
                    dxStyle: '=?dxStyle', //自定义的style
                    theme: '=?theme', //选择预置的主题色
                },
                template: '<div class="datax-select datax-select-enabled datax-select-allow-clear {{ className }}"> \
                                <div class="datax-select-selection datax-select-selection--single" hidefocus="true" tabindex="0"> \
                                    <div class="datax-select-selection__rendered" ng-click="openDropdown()">\
                                        <div class="datax-select-selection__placeholder" ng-show="dxPlaceholder && selectLabel.length==0">{{ dxPlaceholder }}</div>\
                                        <div class="datax-select-selection-selected-value">{{ selectLabel }}</div>\
                                    </div>\
                                    <div class="datax-select-selection__clear" ng-click="delSelect()">\
                                    <i dx-icon class="datax-select-close-icon" type="close-circle"></i></div>\
                                    <div class="datax-select-arrow"><i class="icon dx-font dx-down datax-select-arrow-icon"></i></div>\
                                </div>\
                            </div>',
                controller: function ($scope, $element, $compile, $timeout) {
                    /** 如果model未定义的话，进行初始化 */
                    if (isNull($scope.dxModel)) {
                        if ($scope.multiple) {
                            if ($scope.dxModel == undefined || $scope.dxModel == null || $scope.dxModel == '' || Object.keys($scope.dxModel).length == 0) {
                                $scope.dxModel = []
                            } else {
                                console.log('warning ! in multiple select, dx-model must be array type')
                                return
                            }
                        } else {
                            $scope.dxModel = ''
                        }
                    }
                    var vm = $scope
                    vm.groupSelect = false
                    vm.list = []
                    vm.selectLabel = ''
                    var dropdownDom = null
                    /** 打开选择框 */
                    vm.openDropdown = function () {
                        dropdownDom = $compile(angular.element('\
                        <div class="cdk-overlay-pane">\
                            <div class="datax-select-dropdown" style="opacity: 1; transform: scaleY(1); transform-origin: 0% 0%;">\
                                <div class="ng-tns-c0-36" style="overflow: auto;transform: translateZ(0px);">\
                                    <ul ng-show="!dxGroup" class="datax-select-dropdown-menu \
                                        datax-select-dropdown-menu-root datax-select-dropdown-menu-vertical">\
                                        <li class="datax-select-dropdown-menu-item" ng-repeat="item in list" \
                                            ng-class="{\'datax-select-dropdown-menu-item-active\':item[\'checked\']}" \
                                            ng-click="checkItem($event, item)">{{ item.label }} \
                                            <i ng-show="multiple && item[\'checked\']" class="icon dx-font dx-check datax-select-selected-icon"></i></li>\
                                    </ul>\
                                    <ul ng-show="dxGroup" class="datax-select-dropdown-menu \
                                        datax-select-dropdown-menu-root datax-select-dropdown-menu-vertical">\
                                        <li class="datax-select-dropdown-menu-item-group" ng-repeat="item in list" > \
                                            <div class="datax-select-dropdown-menu-item-group-title">{{ item.group }}</div>\
                                            <ul class="datax-select-dropdown-menu-item-group-list">\
                                                <li ng-repeat="child in item.children" ng-click="checkItem($event, child)"\
                                                    class="datax-select-dropdown-menu-item"\
                                                    ng-class="{\'datax-select-dropdown-menu-item-active\':child[\'checked\']}">\
                                                    {{ child.label }}\
                                                    <i ng-show="multiple && child[\'checked\']" dx-icon class="datax-select-selected-icon" type="check"></i>\
                                                </li>\
                                            </ul>\
                                            </li>\
                                    </ul>\
                                </div>\
                            </div>\
                        </div>'))($scope)
                        dom.openOverlayBackdrop({}, [dropdownDom])
                        var selectInputOffset = dom.offset($element[0].querySelector('.datax-select'))
                        dropdownDom[0].style['top'] = (selectInputOffset.top + selectInputOffset.offsetHeight) + 'px'
                        dropdownDom[0].style['left'] = selectInputOffset.left + 'px'
                        dropdownDom[0].style['width'] = selectInputOffset.offsetWidth + 'px'
                        dropdownDom[0].style['maxHeight'] = '200px'
                        getByEle(document.body).append(dropdownDom)
                        getByClass('datax-select-dropdown').css('position', 'relative').css('width', '100%').css('margin-top', '4px').css('margin-bottom', '4px').css('top', '0').css('left', '0')
                        $element[0].querySelector('.datax-select-selection').focus()
                        $timeout(function () {
                            vm.disabledWatchModel = false
                        })
                    }
                    /** 清除选择框 */
                    vm.delSelect = function () {
                        vm.selectLabel = ''
                        clearChecked(vm.list)
                        $timeout(function () {
                            if ($scope.dxChange) {
                                $scope.dxChange()
                            }
                        })
                    }

                    /** 选中回调函数 */
                    vm.checkItem = function (ev, item) {
                        vm.disabledWatchModel = true
                        if (item['checked']) {
                            if (vm.multiple) {
                                item['checked'] = false
                            }
                        } else {
                            if (!vm.multiple) {
                                clearChecked(vm.list)
                            }
                            item['checked'] = true
                        }
                        vm.setModel(item)
                    }

                    /** 设值 */
                    vm.setModel = function (item) {
                        if (!vm.multiple) {
                            vm.removeDropdownDom()
                            vm.dxModel = item['value']
                            vm.selectLabel = item['label']
                        } else {
                            vm.dxModel = []
                            vm.selectLabel = ''
                            vm.list.forEach(function (value) {
                                if (value.children) {
                                    value.children.forEach(function (_value) {
                                        if (_value['checked']) {
                                            vm.dxModel.push(_value['value'])
                                            vm.selectLabel += _value['label'] + ','
                                        }
                                    })
                                } else {
                                    if (value['checked']) {
                                        vm.dxModel.push(value['value'])
                                        vm.selectLabel += value['label'] + ','
                                    }

                                }
                            })
                            vm.selectLabel = subStrEnd(vm.selectLabel)
                            $element[0].querySelector('.datax-select-selection').focus()
                        }
                        $timeout(function () {
                            if ($scope.dxChange) {
                                $scope.dxChange()
                            }
                            vm.disabledWatchModel = false
                        })
                    }

                    /** 移除下拉框和遮罩 */
                    vm.removeDropdownDom = function () {
                        if (dropdownDom) {
                            dropdownDom.remove()
                        }
                        var backdropObj = document.body.querySelector('.datax-overlay-backdrop')
                        if (backdropObj) {
                            backdropObj.remove()
                        }
                    }

                    /** 初始化下拉选中的各个对象 */
                    vm.initSelectObj = function (value, index) {
                        var tempValue = {}
                        if (typeof (value) == 'object') {
                            if (!vm.dxLabel) {
                                console.log('if items is object array, attribute \'dx-label\' must be require')
                            } else {
                                tempValue['label'] = value[vm.dxLabel]
                            }
                            if (vm.dxValue) {
                                tempValue['value'] = value[vm.dxValue]
                            } else {
                                tempValue['value'] = value
                            }
                        } else {
                            tempValue['value'] = value
                            tempValue['label'] = value
                        }
                        tempValue['uniqueKey'] = index
                        tempValue['checked'] = false
                        tempValue['disabled'] = false
                        tempValue['hide'] = false
                        return tempValue
                    }

                    /** 初始化dxModel或从外部更新dxModel时同步更新选中状态和显示的值 */
                    vm.updateLabelByModel = function () {
                        if (isNotNull(vm.dxModel)) {
                            vm.selectLabel = ''
                            vm.list.forEach(function (value) {
                                if (vm.dxGroup && value.children) {
                                    value.children.forEach(function (_value) {
                                        if (vm.multiple) {
                                            vm.dxModel.forEach(function (__value) {
                                                if ((__value + '') == (_value['value'] + '')) {
                                                    _value['checked'] = true
                                                    vm.selectLabel += _value['label'] + ','
                                                }
                                            })
                                        } else {
                                            if ((vm.dxModel + '') == (_value['value'] + '')) {
                                                _value['checked'] = true
                                                vm.selectLabel += _value['label']
                                            }
                                        }
                                    })
                                } else {
                                    if (vm.multiple) {
                                        vm.dxModel.forEach(function (_value) {
                                            if ((_value + '') == (value['value'] + '')) {
                                                value['checked'] = true
                                                vm.selectLabel += value['label'] + ','
                                            }
                                        })
                                    } else {
                                        if ((vm.dxModel + '') == (value['value'] + '')) {
                                            value['checked'] = true
                                            vm.selectLabel += value['label']
                                        }
                                    }
                                }
                            })
                            if (vm.multiple) {
                                vm.selectLabel = subStrEnd(vm.selectLabel)
                            }
                        }
                    }

                    // 更新输入框中的值
                    $scope.$watch('dxModel', function (newval) {
                        if (isNotNull(newval) && !vm.disabledWatchModel) {
                            vm.updateLabelByModel()
                        }
                    }, true)

                    /** 更新下拉选项区域对象 */
                    $scope.$watch('items', function (newval) {
                        if (isNotNull(newval) && !$scope.remote) {
                            vm.disabledWatchModel = true
                            if (vm.dxGroup) {
                                vm.list = []
                                var _tempIndex = 0
                                var tempArr = _.groupBy(vm.items, vm.dxGroup)
                                _.forEach(tempArr, function (value, key) {
                                    var childArr = value.map(function (_value, _index) {
                                        return vm.initSelectObj(_value, ((_tempIndex * 10000) + _index))
                                    })
                                    vm.list.push({
                                        "group": key,
                                        "children": childArr
                                    })
                                    _tempIndex += 1
                                })
                            } else {
                                vm.list = newval.map(function (value, index) {
                                    return vm.initSelectObj(value, index)
                                })
                            }
                            vm.updateLabelByModel()
                            $timeout(function () {
                                vm.disabledWatchModel = false
                            })
                        }
                    })

                }
            }
        }])
        /* #endregion */
        /* #region 穿梭框 transfer */
        .directive('dxTransfer', function () {
            return {
                template: '<div class="datax-transfer transfer-full-content {{ componentStyle }}" ng-class="contentClass">\
                <div class="datax-transfer-content">\
                    <div class="datax-transfer-left datax-transfer-list">\
                        <div class="datax-transfer-list-header">\
                            <dx-checkbox checked="checkAllLeft">{{list.length}} 项</dx-checkbox>\
                            <span class="datax-transfer-list-header-title">\
                                {{ sourceTitle }}\
                            </span>\
                        </div>\
                        <div class="datax-transfer-list-body">\
                            <ul class="datax-transfer-list-content">\
                                <li class="datax-transfer-list-content-item" ng-repeat="item in list">\
                                    <dx-checkbox checked="item.checked" change="selectChange()" disabled="item.disabled">{{item[dxLabel]}}</dx-checkbox>\
                                </li>\
                            </ul>\
                        </div>\
                    </div>\
                    <div class="datax-transfer-operation">\
                        <button dx-button type="primary" icon="left" size="small" disabled role="\'left\'" click="toLeft();"></button>\
                        <button dx-button type="primary" icon="right" size="small" disabled role="\'right\'" click="toRight();"></button>\
                    </div>\
                    <div class="datax-transfer-right datax-transfer-list">\
                        <div class="datax-transfer-list-header">\
                            <dx-checkbox checked="checkAllRight">{{resultList.length}} 项</dx-checkbox>\
                            <span class="datax-transfer-list-header-title">\
                                {{ targetTitle }}\
                            </span>\
                        </div>\
                        <div class="datax-transfer-list-body">\
                            <ul class="datax-transfer-list-content">\
                                <li class="datax-transfer-list-content-item" ng-repeat="item in resultList">\
                                    <dx-checkbox checked="item.checked" change="selectChange()" disabled="item.disabled">{{item[dxLabel]}}</dx-checkbox>\
                                </li>\
                            </ul>\
                        </div>\
                    </div>\
                </div>\
            </div>',
                restrict: 'E',
                scope: {
                    items: '=',
                    result: '=',
                    change: '&',
                    titles: '=?titles',
                    dxLabel: '=?dxLabel', // 显示的字段
                    filter: '=?filter',
                    componentStyle: '=?componentStyle'
                },
                controller: function ($scope, $element) {
                    $scope.componentUuid = generateUuid(8, 16)
                    $scope.contentClass = 'transfer-' + $scope.componentUuid
                    $scope.sourceTitle = ''
                    $scope.targetTitle = ''
                    $scope.list = []
                    $scope.resultList = []
                    if (isNotNull($scope.titles) && $scope.titles.length == 2) {
                        $scope.sourceTitle = $scope.titles[0]
                        $scope.targetTitle = $scope.titles[1]
                    }
                    if (!$scope.change) {
                        $scope.change = function (ev) {

                        }
                    }
                    var vm = $scope
                    var rBtnOper = getByEle($element[0]).find('button')[1]
                    var lBtnOper = getByEle($element[0]).find('button')[0]
                    if (!$scope.componentStyle || $scope.componentStyle.length === 0) {
                        $scope.componentStyle = 'transfer-bootstrap'
                    } else {
                        $scope.componentStyle = 'transfer-' + $scope.componentStyle
                    }

                    $scope.$watch('checkAllLeft', function (newval) {
                        $scope.list.forEach(function (value) {
                            if (newval) {
                                value['checked'] = true
                            } else {
                                value['checked'] = false
                            }
                        })
                    })

                    $scope.$watch('checkAllRight', function (newval) {
                        $scope.resultList.forEach(function (value) {
                            if (newval) {
                                value['checked'] = true
                            } else {
                                value['checked'] = false
                            }
                        })
                    })

                    $scope.toLeft = function () {
                        $scope.resultList.forEach(function (value) {
                            if (value['checked'] && !value['disabled']) {
                                var val = angular.copy(value)
                                val['checked'] = false
                                value['delete'] = true
                                $scope.list.unshift(val)
                            }
                        })
                        $scope.resultList = $scope.resultList.filter(function (value) {
                            return !value['delete']
                        })
                        $scope.change({
                            ev: {
                                'form': 'right',
                                'to': 'left',
                                'left': $scope.list,
                                'right': $scope.resultList
                            }
                        })
                    }

                    $scope.toRight = function () {
                        $scope.list.forEach(function (value) {
                            if (value['checked'] && !value['disabled']) {
                                var val = angular.copy(value)
                                val['checked'] = false
                                value['delete'] = true
                                $scope.resultList.unshift(val)
                            }
                        })
                        $scope.list = $scope.list.filter(function (value) {
                            return !value['delete']
                        })
                        $scope.change({
                            ev: {
                                'form': 'left',
                                'to': 'right',
                                'left': $scope.list,
                                'right': $scope.resultList
                            }
                        })
                    }

                    $scope.$watch('items', function (newval) {
                        if (newval && newval.length > 0) {
                            $scope.list = newval.map(function (value, index) {
                                var tempValue = value
                                tempValue['checked'] = false
                                tempValue['disabled'] = false
                                // if (index < 3) {
                                //     tempValue['disabled'] = true
                                // }
                                return tempValue
                            })
                        }
                    })

                    $scope.$watch('result', function (newval) {
                        if (newval && newval.length > 0) {
                            $scope.resultList = newval.map(function (value, index) {
                                var tempValue = value
                                tempValue['checked'] = false
                                tempValue['disabled'] = false
                                // if (index < 3) {
                                //     tempValue['disabled'] = true
                                // }
                                return tempValue
                            })
                        }
                    })

                    $scope.$watch('list', function () {
                        var checkedArr = $scope.list.filter(function (item) {
                            return item.checked
                        })
                        if (checkedArr && checkedArr.length > 0) {
                            rBtnOper.disabled = ""
                        } else {
                            rBtnOper.disabled = true
                        }
                    }, true)

                    $scope.$watch('resultList', function () {
                        var checkedArr = $scope.resultList.filter(function (item) {
                            return item.checked
                        })
                        if (checkedArr && checkedArr.length > 0) {
                            lBtnOper.disabled = ""
                        } else {
                            lBtnOper.disabled = true
                        }
                    }, true)

                }
            }
        })
        /* #endregion */
        /* #region 提示 tooltip */
        .directive('dxTooltip', ['dom', '$compile', '$document', function (dom, $compile, $document) {
            return {
                restrict: 'A',
                scope: {
                    tooltipText: '@',
                    tooltipTrigger: '=?tooltipTrigger',
                    disableTooltip: '=?disableTooltip'
                },
                link: function (scope, element, attrs) {
                    var tooltipObj;
                    var tooltipObjLeft = 0
                    var tooltipObjTop = 0
                    scope.$watch('tooltipText', function (newval) {
                        var tooltipHtml = '<div class="datax-tooltip">' +
                            '<div class="datax-tooltip-arrow"></div>' +
                            '<div class="datax-tooltip-inner">' + nullToStr(scope.tooltipText) + '</div>' +
                            '</div>'
                        tooltipObj = $compile(tooltipHtml)(scope)
                        if (!scope.disableTooltip) {
                            if (scope.tooltipTrigger === "click") {
                                element.on('click', showTooltip);
                            } else {
                                element.on('mouseenter', showTooltip)
                                element.on('mouseleave', hideTooltip)
                            }
                        }
                    })

                    function showTooltip() {
                        if (scope.isOpen) {
                            hideTooltip()
                            return
                        }
                        scope.offset = dom.offset(element[0])
                        angular.element(document.body).append(tooltipObj)
                        scope.tooltipOffset = dom.offset(tooltipObj[0])
                        tooltipObjLeft = scope.offset.left - ((scope.tooltipOffset.offsetWidth / 2).toFixed(2) - (scope.offset.offsetWidth / 2).toFixed(2))
                        tooltipObjTop = scope.offset.top - scope.tooltipOffset.offsetHeight
                        tooltipObj[0].style.left = tooltipObjLeft + 'px'
                        tooltipObj[0].style.top = tooltipObjTop + 'px'
                        scope.$digest()
                        if (scope.tooltipTrigger === "click") {
                            $document.on('click', blindTooltipClick)
                        }
                        scope.isOpen = true
                    }

                    function hideTooltip() {
                        if (tooltipObj) {
                            tooltipObj.remove()
                            scope.isOpen = false
                            if (scope.tooltipTrigger === "click") {
                                $document.off('click', blindTooltipClick)
                            }
                        }
                    }

                    function blindTooltipClick(e) {
                        if (!(e.pageX > scope.offset.left && e.pageX < (scope.offset.left + scope.offset.offsetWidth) &&
                                e.pageY > scope.offset.top && e.pageY < (scope.offset.top + scope.offset.offsetHeight)) &&
                            !(e.pageX > tooltipObjLeft &&
                                e.pageX < (tooltipObjLeft + Number(scope.tooltipOffset.offsetWidth)) &&
                                e.pageY > tooltipObjTop &&
                                e.pageY < (tooltipObjTop + Number(scope.tooltipOffset.offsetHeight)))) {
                            hideTooltip()
                        }
                    }

                }
            }
        }])
        /* #endregion */
        /* #region 日期选择框 datepicker */
        .directive('dxDateRangePanel', ['dxCalendar', function (dxCalendar) {
            return {
                restrict: 'AE',
                replace: 'true',
                scope: {
                    panelType: '=?panelType',
                    panelYear: '=?panelYear',
                    panelMonth: '=?panelMonth',
                    dxChange: '&'
                },
                template: '<div>\
                <div class="datax-calendar-month-panel" ng-show="panelType==\'year\'">\
                    <div>\
                        <diV class="datax-calendar-month-panel-header">\
                            <a role="button" class="datax-calendar-month-panel-prev-year-btn" ng-click="changePanelDate(\'year\', \'sub\')" title="上一年"></a>\
                            <a role="button" class="datax-calendar-month-panel-year-select" title="选择年份" ng-click="panelType=\'decade\'">\
                                <span class="datax-calendar-month-panel-year-select-content">{{ selectYear }}</span>\
                                <span class="datax-calendar-month-panel-year-select-arrow">x</span>\
                            </a>\
                            <a role="button" class="datax-calendar-month-panel-next-year-btn" ng-click="changePanelDate(\'year\', \'add\')" title="下一年"></a>\
                        </diV>\
                        <div class="datax-calendar-month-panel-body">\
                            <table cellspacing="0" role="grid" class="datax-calendar-month-panel-table">\
                                <tbody class="datax-calendar-month-panel-tbody">\
                                    <tr role="row" ng-repeat="item in monthOfYear">\
                                        <td role="gridcell" ng-repeat="mon in item" \
                                            ng-class="{\'datax-calendar-month-panel-selected-cell\':mon==panelMonth}"\
                                            class="datax-calendar-month-panel-cell" title="{{mon}}月">\
                                            <a class="datax-calendar-month-panel-month" ng-click="changeMonth(mon)">{{mon}}月</a>\
                                        </td>\
                                    </tr>\
                                </tbody>\
                            </table>\
                        </div>\
                    </div>\
                </div>\
                <div class="datax-calendar-year-panel" ng-show="panelType==\'decade\'">\
                    <div>\
                        <div class="datax-calendar-year-panel-header">\
                            <a role="button" class="datax-calendar-year-panel-prev-decade-btn" ng-click="changePanelDate(\'decade\', \'sub\')" title="上一年代"></a>\
                            <a role="button" class="datax-calendar-year-panel-decade-select">\
                                <span class="datax-calendar-year-panel-decade-select-content"> {{yearOfDecade[0][1].year}}-{{yearOfDecade[3][2].year}} </span>\
                                <span class="datax-calendar-year-panel-decade-select-arrow">x</span>\
                            </a>\
                            <a role="button" class="datax-calendar-year-panel-next-decade-btn" ng-click="changePanelDate(\'decade\', \'add\')" title="下一年代"></a>\
                        </div>\
                        <div class="datax-calendar-year-panel-body">\
                            <table cellspacing="0" role="grid" class="datax-calendar-year-panel-table">\
                                <tbody class="datax-calendar-year-panel-tbody">\
                                    <tr role="row" class="" ng-repeat="item in yearOfDecade">\
                                        <td role="gridcell" class="datax-calendar-year-panel-cell" ng-repeat="year in item"\
                                        title="{{ year.year }}" ng-class="{\'datax-calendar-year-panel-last-decade-cell\':year.last,\
                                            \'datax-calendar-year-panel-next-decade-cell\':year.next,\'datax-calendar-year-panel-selected-cell\':year.year==panelYear}">\
                                            <a class="datax-calendar-year-panel-year" ng-click="changeYear(year.year)">{{ year.year }}</a>\
                                        </td>\
                                    </tr>\
                                </tbody>\
                            </table>\
                        </div>\
                    </div>\
                </div>\
            </div>',
                controller: function ($scope, $element) {
                    var vm = $scope
                    if (!vm.panelType) {
                        vm.panelType = 'month'
                    }
                    vm.monthOfYear = [
                        [1, 2, 3],
                        [4, 5, 6],
                        [7, 8, 9],
                        [10, 11, 12]
                    ]
                    vm.yearOfDecade = dxCalendar.yearsOfDecade(vm.panelYear)
                    vm.selectYear = vm.panelYear
                    var tempPanelYear = vm.panelYear
                    vm.changePanelDate = function (type, operation) {
                        if (type == 'year') {
                            if (operation == 'add') {
                                vm.selectYear += 1
                            } else if (operation == 'sub') {
                                vm.selectYear -= 1
                            }
                        } else if (type == 'decade') {
                            if (operation == 'add') {
                                vm.selectYear += 10
                            } else if (operation == 'sub') {
                                vm.selectYear -= 10
                            }
                            vm.yearOfDecade = dxCalendar.yearsOfDecade(vm.selectYear)
                        }
                    }
                    vm.changeYear = function (year) {
                        vm.panelType = 'year'
                        vm.selectYear = year
                    }
                    vm.changeMonth = function (mon) {
                        vm.panelType = 'month'
                        vm.dxChange({
                            ev: {
                                'year': vm.selectYear,
                                'month': mon
                            }
                        })
                    }
                }
            }
        }])
        .directive('dxDateRangePopup', ['dxCalendar', function (dxCalendar) {
            return {
                restrict: 'AE',
                replace: 'true',
                scope: {
                    value: '=?value',
                    selectedDate: '&'
                },
                template: '<div class="datax-calendar-picker-container datax-calendar-picker-container-placement-bottomLeft">\
                            <div class="datax-calendar">\
                                <div class="datax-calendar-panel">\
                                    <div class="datax-calendar-input-wrap">\
                                        <div class="datax-calendar-date-input-wrap">\
                                            <input class="datax-calendar-input" ng-model="tempDateStr" placeholder="请选择日期">\
                                        </div>\
                                    </div>\
                                    <div class="datax-calendar-date-panel">\
                                        <div class="datax-calendar-header">\
                                            <div style="position: relative;">\
                                                <a role="button" class="datax-calendar-prev-year-btn" ng-click="changeDate(\'lastYear\')" title="上一年"></a>\
                                                <a role="button" class="datax-calendar-prev-month-btn" ng-click="changeDate(\'lastMonth\')" title="上个月"></a>\
                                                <span class="datax-calendar-ym-select">\
                                                    <a role="button" class="datax-calendar-year-select" ng-click="panelType=\'decade\'" title="选择年份"> {{ panelYear }}年\
                                                    </a>\
                                                    <a role="button" class="datax-calendar-month-select" ng-click="panelType=\'year\'" title="选择月份"> {{ panelMonth }}月 </a>\
                                                </span>\
                                                <a role="button" class="datax-calendar-next-month-btn" ng-click="changeDate(\'nextMonth\')" title="下个月"></a>\
                                                <a role="button" class="datax-calendar-next-year-btn" ng-click="changeDate(\'nextYear\')" title="下一年"></a>\
                                            </div>\
                                            <dx-date-range-panel panel-type="panelType" panel-year="panelYear" panel-month="panelMonth" dx-change="selectYearOrMonth(ev)"></dx-date-range-panel>\
                                        </div>\
                                        <div class="datax-calendar-body">\
                                            <table cellspacing="0" role="grid" class="datax-calendar-table">\
                                                <thead>\
                                                    <tr role="row">\
                                                        <th role="columnheader" ng-repeat="week in weekTitle" title="{{ week.full }}"\
                                                            class="datax-calendar-column-header"><span\
                                                                class="datax-calendar-column-header-inner">{{ week.short }}</span></th>\
                                                    </tr>\
                                                </thead>\
                                                <tbody class="datax-calendar-tbody">\
                                                    <tr role="row" ng-repeat="week in days">\
                                                        <td role="gridcell" class="datax-calendar-cell" ng-repeat="day in week" \
                                                        ng-class="{ \'datax-calendar-last-month-cell\':day[0][\'isLastmonth\'],\
                                                        \'datax-calendar-next-month-btn-day\':day[0][\'isNextmonth\'],\
                                                         \'datax-calendar-today\': (day[0].day == now.day && day[0].month == now.month && day[0].year == now.year),\
                                                         \'datax-calendar-selected-day\': (day[0].day == selectDate.day && day[0].month == selectDate.month && day[0].year == selectDate.year)}" >\
                                                            <div class="datax-calendar-date" ng-click="selectDay(day[0])" aria-selected="false" aria-disabled="false">{{ day[0].day }}</div>\
                                                        </td>\
                                                    </tr>\
                                                </tbody>\
                                            </table>\
                                        </div>\
                                        <div class="datax-calendar-footer">\
                                            <span class="datax-calendar-footer-btn">\
                                                <a role="button" class="datax-calendar-today-btn" ng-click="today()">今天</a>\
                                            </span>\
                                        </div>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>',
                controller: function ($scope, $element) {
                    var vm = $scope
                    if (isNull(vm.value)) {
                        vm.value = new Date()
                    } else {
                        try {
                            vm.value = new Date(vm.value)
                        } catch (e) {
                            console.log('format date error, format is:', vm.value)
                            vm.value = new Date()
                        }
                        vm.tempDateStr = moment(vm.value).format('YYYY-MM-DD')
                    }
                    vm.selectMoment = moment(vm.value)
                    vm.nowMoment = moment(new Date())
                    vm.panelYear = vm.selectMoment.year()
                    vm.panelMonth = (vm.selectMoment.month() + 1)
                    vm.weekTitle = weekTitle
                    vm.now = {
                        "day": vm.nowMoment.date(),
                        "month": (vm.nowMoment.month() + 1),
                        "year": vm.nowMoment.year()
                    }
                    vm.selectDate = {
                        "day": vm.selectMoment.date(),
                        "month": (vm.selectMoment.month() + 1),
                        "year": vm.selectMoment.year()
                    }
                    vm.days = dxCalendar.daysOfMonth(vm.value)
                    vm.selectDay = moment(vm.value)
                    vm.selectMonth = vm.selectDay.month() + 1
                    vm.panelType = 'month'
                    vm.tempDate = moment(vm.value)
                    vm.changeDate = function (type) {
                        if (type == 'lastYear') {
                            vm.tempDate = vm.tempDate.subtract(1, 'year')
                        } else if (type == 'lastMonth') {
                            vm.tempDate = vm.tempDate.subtract(1, 'month')
                        } else if (type == 'nextYear') {
                            vm.tempDate = vm.tempDate.add(1, 'year')
                        } else if (type == 'nextMonth') {
                            vm.tempDate = vm.tempDate.add(1, 'month')
                        }
                        vm.panelYear = vm.tempDate.year()
                        vm.panelMonth = (vm.tempDate.month() + 1)
                        vm.days = dxCalendar.daysOfMonth(vm.tempDate.toDate())
                        vm.tempDateStr = vm.tempDate.format('YYYY-MM-DD')
                    }

                    vm.selectYearOrMonth = function (ev) {
                        vm.tempDate = moment(new Date(ev.year + '-' + ev.month + '-1'))
                        vm.changeDate('')
                    }

                    vm.today = function () {
                        vm.tempDate = moment(new Date())
                        vm.changeDate('')
                        vm.selectedDate({
                            ev: {
                                "day": {
                                    "year": vm.tempDate.year(),
                                    "month": (vm.tempDate.month() + 1),
                                    "day": vm.tempDate.date(),
                                }
                            }
                        })
                    }
                    vm.selectDay = function (day) {
                        vm.selectedDate({
                            ev: {
                                "day": day
                            }
                        })
                    }
                }
            }
        }])
        .directive('dxDatePicker', ['dom', 'dxCalendar', function (dom, dxCalendar) {
            return {
                restrict: 'AE',
                replace: 'true',
                scope: {
                    dxModel: '=?dxModel',
                    dxPlaceholder: '=?dxPlaceholder'
                },
                template: '<div class="datax-datepicker-wrapper">\
                        <span class="datax-calendar-picker" ng-click="openPopup()">\
                            <input readonly="" class="datax-calendar-picker-input datax-input" ng-model="dateStr" placeholder="{{dxPlaceholder}}">\
                            <i dx-icon type="close-circle" class="datax-calendar-picker-clear"></i>\
                            <i dx-icon type="calendar" class="datax-calendar-picker-icon"></i>\
                        </span>\
                    </div>',
                controller: function ($scope, $element, $compile, $timeout) {
                    var vm = $scope
                    if (!vm.dxPlaceholder) {
                        vm.dxPlaceholder = '请选择日期'
                    }
                    vm.forbidWatch = false
                    vm.dateStr = ''
                    var dropdownDom = null
                    vm.openPopup = function () {
                        dropdownDom = $compile(angular.element('\<div class="cdk-overlay-pane"><dx-date-range-popup value="days" selected-date="selectDate(ev)"></dx-date-range-popup></div>'))($scope)
                        dom.openOverlayBackdrop({}, [dropdownDom])
                        var mainEleOffset = dom.offset($element[0].querySelector('.datax-calendar-picker'))
                        dropdownDom[0].style['top'] = mainEleOffset.top + 'px'
                        dropdownDom[0].style['left'] = mainEleOffset.left + 'px'
                        getByEle(document.body).append(dropdownDom)
                    }

                    vm.selectDate = function (ev) {
                        vm.forbidWatch = true
                        vm.closeDropPanel()
                        vm.dxModel = new Date(ev.day.year + '-' + ev.day.month + '-' + ev.day.day)
                        vm.days = new Date(ev.day.year + '-' + ev.day.month + '-' + ev.day.day)
                        vm.dateStr = moment(vm.dxModel).format('YYYY-MM-DD')
                        $timeout(function () {
                            vm.forbidWatch = false
                        })
                    }

                    vm.closeDropPanel = function () {
                        dropdownDom.remove()
                        dropdownDom = null
                        var backdropObj = document.body.querySelector('.datax-overlay-backdrop')
                        if (backdropObj) {
                            backdropObj.remove()
                        }
                    }

                    $scope.$watch('dxModel', function (newval) {
                        if (!vm.forbidWatch) {
                            if (isNotNull(newval)) {
                                vm.days = new Date(newval)
                                vm.dateStr = moment(vm.days).format('YYYY-MM-DD')
                            } else {
                                vm.days = null
                            }
                        }
                    })

                },
                link: function (scope, element, attrs) {}
            }
        }])
        /* #endregion */
        /* #region 表格单元格组件 table-cell-edit  */
        .directive('dxCellEdit', ['dom', function (dom) {
            return {
                restrict: 'AE',
                replace: true,
                scope: {
                    tableData: '=',
                    rowIndex: '=',
                    colIndex: '=',
                    colName: '=',
                    dxStyle: '=',
                    editable: '=?editable',
                    afterValueChange: '&',
                },
                template: "<div class=\"edit-id-{{uid}}\">\
                    <div dx-tooltip tooltip-text=\"{{ tableData[rowIndex][colName] | formatText:dxStyle['format'] }}\" tooltip-trigger=\"triggerType\" disable-tooltip=\"disableTooltip\" ng-show=\"!editId\"\
                        ng-style=\"dxStyle\" ng-click=\"startEdit()\" class=\"datax-table-cell datax-table-cell-text text-not-wrap edit-id-{{uid}}\">\
                        {{ tableData[rowIndex][colName] | formatText:dxStyle['format'] }}\
                    </div>\
                    <div ng-style=\"dxStyle\" class=\"datax-table-cell-input-wrapper edit-id-{{uid}} \" ng-show=\"editId\"\>\
                        <input type=\"text\" ng-model=\"tableData[rowIndex][colName]\" class=\"datax-table-cell-input edit-id-{{uid}}\">\
                    </div>\
                </div>",
                controller: function ($scope, $document, $element, $timeout) {
                    var vm = $scope
                    if (!$scope.afterValueChange) {
                        $scope.afterValueChange = function () {

                        }
                    }
                    $scope.editId = null
                    if (isMobileDevice()) {
                        vm.triggerType = 'click'
                    } else {
                        vm.triggerType = 'hover'
                    }
                    if (vm.editable) {
                        if (isMobileDevice()) {
                            vm.disableTooltip = true
                        } else {
                            vm.disableTooltip = false
                        }
                        vm.uid = generateUuid(8, 16)
                    } else {
                        vm.uid = 0
                        vm.disableTooltip = false
                    }
                    if (vm.dxStyle.disableTooltip) {
                        vm.disableTooltip = true
                    }
                    // {{ cellValve | formatText:col['format'] }}
                    vm.initComponentValues = function () {
                        vm.cellObj = vm.tableData[vm.rowIndex]
                        vm.cellValve = vm.cellObj[vm.colName]
                        vm.tempValue = vm.cellValve + ''
                    }
                    vm.initComponentValues()

                    vm.startEdit = function () {
                        if (vm.editable) {
                            vm.initComponentValues()
                            $scope.editId = vm.cellValve + ''
                            $document.on('click', endEdit)
                            $element[0].querySelector('.datax-table-cell-input').style['display'] = 'block'
                            $timeout(function () {
                                $element[0].querySelector('.datax-table-cell-input').style['display'] = 'block'
                                $element[0].querySelector('.datax-table-cell-input').focus()
                            }, 100)
                        }
                    }

                    function endEdit(e) {
                        var clickEleClass = e.target.className
                        if (clickEleClass.indexOf("edit-id-" + vm.uid) >= 0) {} else {
                            if (vm.tempValue != vm.tableData[vm.rowIndex][vm.colName]) {
                                $scope.afterValueChange()
                            }
                            $document.off('click', endEdit)
                            $scope.editId = null
                            $scope.$apply()
                        }
                    }
                }
            }
        }])
        /* #endregion */
        /* #region 表格 table */
        .directive('dxTable', function () {
            return {
                templateUrl: '/frontend/components/datax-ui/table.html',
                restrict: 'E',
                scope: {
                    columns: '=', //表头相关信息, 二维数组 格式:[{row:[{},{}]},{row:[{},{}]}]
                    data: '=', // 显示的数据
                    total: '@', // 总数
                    showPage: '@', // 是否需要分页
                    height: '=', // 表格容器的高
                    rowHeight: '=?rowHeight', // 表格行高
                    showPager: '=?showPager', //是否分页
                    fullFix: '=?fullFix', //横向铺满
                    tableStyle: '=?tableStyle', //指定各个地方的样式
                    componentTheme: '=?componentTheme', //主题
                    customConfig: '=?customConfig',
                    refreshStyle: '&'
                },
                controller: function ($scope, $element, $http, $timeout) {
                    var vm = $scope
                    vm.isAndroid = (navigator.userAgent).indexOf('Android') > -1 || (navigator.userAgent).indexOf('Adr') > -1; //android终端
                    vm.isiOS = !!(navigator.userAgent).match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
                    vm.componentUuid = generateUuid(8, 16)
                    // 每页多少条
                    vm.limit = vm.data.length
                    vm.heads = []
                    vm.scrollHeight = 0
                    vm.unitHeight = 35
                    vm.columnsStyle = []

                    if (isNotNull(vm.componentTheme)) {

                    }
                    vm.customCode = ''
                    if (vm.customConfig && vm.customConfig.editable) {
                        if (isNotNull(vm.customConfig.customAfterchangeCode)) {
                            vm.customCode = vm.customConfig.customAfterchangeCode
                        }
                        vm.editable = true
                    } else {
                        vm.editable = false
                    }
                    vm.afterCellEdit = function () {
                        eval(vm.customCode)
                    }
                    if (isNull(vm.tableStyle)) {
                        vm.tableStyle = {
                            'wrapper': {},
                            'scroll': {
                                'header': {
                                    'paddingBottom': '0px',
                                    'table': {},
                                    'row': {},
                                    'td': {},
                                    'cell': {}
                                },
                                'body': {
                                    'maxHeight': vm.scrollHeight,
                                    'table': {},
                                    'row': {},
                                    'td': {},
                                    'cell': {}
                                }
                            },
                            'fixedLeft': {
                                'header': {
                                    'table': {},
                                    'row': {},
                                    'cell': {}
                                },
                                'bodyOuter': {},
                                'bodyInner': {
                                    'max-height': vm.scrollHeight,
                                    'table': {},
                                    'row': {},
                                    'cell': {}
                                }
                            },
                        }
                    }
                    if (vm.fullFix) {
                        vm.tableStyle.scroll.body.overflowX = 'hidden'
                    }

                    vm.fixHeight = function () {
                        if (vm.heads && vm.heads.length < 1) {
                            vm.scrollHeight = vm.height - vm.unitHeight
                        } else {
                            vm.scrollHeight = vm.height - (vm.unitHeight * vm.heads.length)
                        }
                        vm.tableStyle.scroll.body.maxHeight = vm.scrollHeight + 'px'
                        vm.tableStyle.fixedLeft.bodyInner.maxHeight = vm.scrollHeight + 'px'
                    }
                    vm.fixRowHeight = function () {
                        if (isNotNull(vm.rowHeight) && vm.rowHeight > 10) {
                            vm.unitHeight = vm.rowHeight
                        } else {
                            vm.unitHeight = 35
                        }
                    }

                    vm.$watch('height', function (newval) {
                        if (newval && newval > 0) {
                            vm.fixRowHeight()
                            vm.fixHeight()
                        }
                    })

                    vm.$watch('columns', function (newval) {
                        if (isNotNull(newval) && newval.length > 0) {
                            vm.fixRowHeight()
                            vm.fixHeight()
                            vm.fixedLeft = 0
                            vm.fixedLeftWidth = 0
                            vm.fixedRight = 0
                            vm.fixedRightWidth = 0
                            vm.heads = []
                            vm.rowInfo = []
                            newval.forEach(function (item, index) {
                                vm.heads.push({
                                    rows: []
                                })
                                var tempRow = item.rows ? item.rows : item
                                tempRow.forEach(function (col, i) {
                                    var itemWidth = col['width'] ? col['width'] : 100
                                    var itemColspan = col['colspan'] ? col['colspan'] : '1'
                                    itemWidth = itemWidth * itemColspan
                                    if (index == (newval.length - 1)) {
                                        if (isNotNull(col['fixed'])) {
                                            vm.fixedLeft += 1
                                            vm.fixedLeftWidth += itemWidth
                                        }
                                    }
                                    var rowObj = {
                                        'rowspan': col['rowspan'] ? col['rowspan'] : '1',
                                        'colspan': itemColspan,
                                        'title': col['title'] ? col['title'] : '',
                                        'field': col['field'] ? col['field'] : '',
                                        'width': itemWidth + 'px',
                                        'height': vm.unitHeight + 'px',
                                        'lineHeight': vm.unitHeight + 'px',
                                        'isedit': col['isedit'] ? col['isedit'] : '0',
                                        'format': col['format'] ? col['format'] : '',
                                        'disableTooltip': col['disableTooltip'] ? col['disableTooltip'] : false,
                                    }
                                    vm.heads[index].rows.push(rowObj)
                                    if (index == (newval.length - 1)) {
                                        vm.rowInfo.push(rowObj)
                                    }
                                })
                            })
                            vm.tableStyle.scroll.header.marginLeft = vm.fixedLeftWidth + 'px'
                            vm.tableStyle.scroll.body.marginLeft = vm.fixedLeftWidth + 'px'
                        }
                    }, true)
                    var scrollObj = $element[0].querySelector('.datax-table-body')
                    var leftObj = $element[0].querySelector('.datax-table-body-inner')
                    var topObj = $element[0].querySelector('.datax-table-scroll-header')
                    var currentTab = 0
                    scrollObj.addEventListener('scroll', function () {
                        if (currentTab == 1) {
                            leftObj.scrollTop = scrollObj.scrollTop;
                            topObj.scrollLeft = scrollObj.scrollLeft;
                        }
                    })
                    leftObj.addEventListener('scroll', function () {
                        if (currentTab == 2) {
                            scrollObj.scrollTop = leftObj.scrollTop;
                        }
                    })
                    topObj.addEventListener('scroll', function () {
                        if (currentTab == 3) {
                            scrollObj.scrollLeft = topObj.scrollLeft
                        }
                    })
                    scrollObj.addEventListener('mouseover', function () {
                        currentTab = 1
                    })
                    leftObj.addEventListener('mouseover', function () {
                        currentTab = 2
                    })
                    topObj.addEventListener('mouseover', function () {
                        currentTab = 3
                    })
                    scrollObj.addEventListener('touchmove', function () {
                        currentTab = 1
                    })
                    leftObj.addEventListener('touchmove', function () {
                        currentTab = 2
                    })
                    topObj.addEventListener('touchmove', function () {
                        currentTab = 3
                    })

                }
            }
        })

        /* #endregion */
        /* #region 标签页 tabs */
        .directive('dxTabs', function () {
            return {
                restrict: 'A',
                link: function (scope, element) {
                    getByEle(element[0]).addClass('datax-tabs').addClass('datax-tabs-top').addClass('datax-tabs-card')
                }
            }
        })
        .directive('dxTabBody', function () {
            return {
                restrict: 'A',
                link: function (scope, element) {
                    getByEle(element[0]).addClass('datax-tabs-content').addClass('datax-tabs-top-content')
                    var tabChildren = getByEle(element[0]).children()
                    for (var i = 0; i < tabChildren.length; i++) {
                        var ChildEle = getByEle(tabChildren[i])
                        ChildEle.addClass('datax-tabs-tabpane')
                        if (i < 1) {
                            ChildEle.addClass('datax-tabs-tabpane-active')
                        } else {
                            ChildEle.addClass('datax-tabs-tabpane-inactive')
                        }
                    }
                }
            }
        })
        .directive('dxTabHeader', ['$document', function ($document) {
            return {
                restrict: 'A',
                replace: true,
                scope: {
                    titles: '=',
                    dxLabel: '=?dxLabel',
                    dxChange: '&'
                },
                template: '<div class="datax-tabs-bar datax-tabs-card-bar datax-tabs-top-bar datax-tabs-default-bar">\
            <div class="datax-tabs-nav-container">\
                <span class="datax-tabs-tab-prev"></span>\
                <span class="datax-tabs-tab-next"></span>\
                <div class="datax-tabs-nav-wrap">\
                    <div class="datax-tabs-nav-scroll">\
                        <div class="datax-tabs-nav" style="transform: translate3d(0px, 0px, 0px);">\
                            <div>\
                                <div role="tab" class="datax-tabs-tab" ng-repeat="item in tabs"\
                                ng-click="checkTab(item)" ng-class="{\'datax-tabs-tab-active\':item[\'show\']}">\
                                {{ item.label }}</div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>',
                controller: function ($scope, $element) {
                    var vm = $scope
                    if (!vm.dxChange) {
                        vm.dxChange = function (ev) {

                        }
                    }
                    vm.tabs = []

                    vm.checkTab = function (item) {
                        vm.tabs.forEach(function (value) {
                            if ((value['index'] + '') == (item['index'] + '')) {
                                value['show'] = true
                            } else {
                                value['show'] = false
                            }
                        })
                        // 获取tab contents
                        var bodyEles = getByEle($element[0].parentElement.querySelector('.datax-tabs-content')).children()
                        for (var i = 0; i < bodyEles.length; i++) {
                            var ChildEle = getByEle(bodyEles[i])
                            ChildEle.removeClass('datax-tabs-tabpane-active').removeClass('datax-tabs-tabpane-inactive')
                            if ((i + '') == (item['index'] + '')) {
                                ChildEle.addClass('datax-tabs-tabpane-active')
                            } else {
                                ChildEle.addClass('datax-tabs-tabpane-inactive')
                            }
                        }
                        vm.dxChange({
                            "tabIndex": item['index'],
                            "tabLabel": item['label']
                        })
                    }


                    vm.$watch('titles', function (newval) {
                        if (isNotNull(newval) && newval.length > 0) {
                            vm.tabs = []
                            newval.forEach(function (value, index) {
                                var tabLabel = ''
                                tabLabel = value
                                if (vm.dxLabel) {
                                    tabLabel = value[vm.dxLabel]
                                }
                                vm.tabs.push({
                                    "label": tabLabel,
                                    'index': index,
                                    'show': false
                                })
                            })
                            vm.tabs[0]['show'] = true
                        }
                    })
                }
            }
        }])
        /* #endregion */
})()