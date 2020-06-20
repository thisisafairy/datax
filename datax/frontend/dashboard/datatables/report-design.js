
var hot;
var defaultOptions = {
    'elementId': 'reportSheet',
    'tableWidth': '100%',
    'tableHeight': '100%',
    'cellWidth': 100,
    'cellHeight': 25,
    'language': 'zh-CN',
    'minCols': 50,
    'minRows': 50,
}

var dragPositionHeightFix = 20
var dragging;
var hoverCell = {} // hover时的单元格，拖拽用
var selectedCell; // 当前选中的单元格
var tempStyle; // 格式化单元格样式的临时变量
var tempTableData; // 临时变量


var app = angular.module('reportDesignApp',['ngDraggable', 'colorpicker.module', 'groupSelect', 'multiSelect', 'selectList', 'dataxPanelDrag', 'dataxReport']);
(function() {
    'use strict';

    function reportDesign ($rootScope, $scope, $http, $window, $timeout){
        var vm = $scope
        var hotUtils = new HotUtils()
        // 是否正在初始化数据
        vm.initTableComplete = true
        // 是否正在渲染工具栏按钮
        vm.renderingToolarBtn = false
        vm.tableData = {
            mergeCells: [],
            colWidths: [],
            rowHeights: [],
            rowCategory: {},
            overlapping: [],
            permission: {'row': [], 'col': []}, // 权限 {'num': 0, }
            pinned: {'top': '', 'bottom': '', 'left': '', 'right': ''}, // 锁定行列 {'num': 0, }
            coors: [], // 每个单元格信息 [{'coors':'1-3', 'meta': {}}{'coors':'2-3', 'meta': {}}] 
            toolbar: 'top',
            page: 10,
            pageorder: 1,
            maxRow: 0,
            maxCol: 0,
            olapIds: [],
            skinType: 0, //皮肤
            uuid: '', //报表编号
            reportStyle: 'D', //报表类型
            reportDescription: '', //报表名称
            reportVersion: '1.0', //报表版本
            reportMemo: '', //简介
            mainUuid: '', //主版本
            key: '',
            name: '',
            kind: ''
        }

        defaultOptions.tableHeight = angular.element($window).height() - 120
        defaultOptions.tableWidth = angular.element($window).width() - 220
        $rootScope.toolbarStatus = {
            'olap': true,
            'panel': 'start'
        }

        vm.cellsRange = [] // 选中的单元格坐标 [开始行, 开始列, 结束行, 结束列]
        vm.btnModels = {
            'fontFamily': 'Arial',
            'fontSize': 14
        }

        vm.olapDataCell = []
        
        vm.editTypes = cellEditType

        vm.bgColor = 'rgba(255, 255, 255, 1)'
        vm.fontColor = 'rgba(0, 0, 0, 1)'
        
        vm.fontFamily = fontFamilys

        vm.fontSize = fontSizes

        vm.switchToolBtn = function (btnType) {
            if (btnType == 'olap') {
                $rootScope.toolbarStatus.olap = !$rootScope.toolbarStatus.olap
                $rootScope.fixTableSize()
            }
        }

        // region 获取各类枚举值
        // #region
        $scope.enumKinds = []
        $http.get('/api/type/getTypeList').then(function (rs) {
            $scope.enumKinds = rs.data
        })

        $scope.usertag=[];
        $http.get('/api/account/getUserTag').then(function (rs) {
            $scope.usertag = rs.data.data;
        });

        $http.get('/api/type/getEmuTypes?type=static&emuName=REPORT_FUNCTION_CODE').then(function (rs) {
            vm.functionList = rs.data.data
        })

        $http.get('/api/dash/getOlaplists').then(function(rs){
            vm.sourceList = rs.data
        })
        $http.get('/api/type/getDictParents').then(function(rs){
            vm.dictsList = rs.data.data
        })

        vm.rowArr = []
        for (var _i = 1; _i < 21; _i++) {
            vm.rowArr.push({'id': _i, 'name': '第' + _i + '行'})
        }

        vm.colLeftArr = []
        for (var _i = 1; _i < 27; _i++) {
            vm.colLeftArr.push({'id': _i, 'name': '第' + _i + '列'})
        }

        vm.colRightArr = []
        for (var _i = 1; _i < 27; _i++) {
            vm.colRightArr.push({'id': _i, 'name': '倒数第' + _i + '列'})
        }
        
        // #endregion 

        vm.dataSourceIds = ''

        // 编辑的时候初始化
        vm.mainKey = getQueryString('id')
        vm.initReportConfig = function () {
            if (isNotNull(vm.mainKey)) {
                vm.initTableComplete = false
                $http.get('/api/dash/getReportConfig?id=' + vm.mainKey).then(function(rs){
                    vm.tableData = angular.copy(rs.data.data.jsonconfig)
                    var _maxCountCols = hot.Methods.countCols()
                    var _maxCountRows = hot.Methods.countRows()
                    vm.tableData.key = vm.mainKey
                    vm.tableData.mergeCells.forEach(function (value) {
                        hot.Methods.merge(value.row, value.col
                            , value.row + (value.rowspan - 1), value.col + (value.colspan - 1))
                    })
                    for (var _i = 0; _i <= vm.tableData.maxRow; _i++) {
                        for (var _j = 0; _j <= vm.tableData.maxCol; _j++) {
                            var _currentCell = vm.tableData.row[_i].col[_j]
                            if (isNotNull(_currentCell['value'])) {
                                hot.Methods.setDataAtCell(_i, _j, _currentCell['value'])
                            }
                        }
                    }
                    //最大列
                    
                    hotUtils.renderingSelectCell(hot, vm, vm.tableData)
                    vm.initTableComplete = true
                })
            }
        }

        vm.dataSourceChange = function () {
            vm.loadDataSourceCols()
        }

        vm.loadOlapRowsById = function (id, modelName) {
            if (id.length > 1) {
                $http({
                    method: 'POST',
                    url: '/api/dash/getOlapColumnsByOlapIds',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    data: {
                        ids: id.replace(/\s+/g,'')
                    }
                }).then(function (rs) {
                    if (rs.data.status == 'success') {
                        eval(modelName + ' = rs.data.data')
                    }
                });
            }
        }

        vm.olaps = []
        var leftCardScrollbar
        vm.loadDataSourceCols = function () {
            if (vm.dataSourceIds.length > 1) {
                var _id = vm.dataSourceIds
                vm.loadOlapRowsById(_id, 'vm.olaps')
                if (!leftCardScrollbar) {
                    leftCardScrollbar = new PerfectScrollbar('.left-card', {
                        'suppressScrollX': true
                    })
                }
            }
        }

        vm.selectValue = ''

        vm.selectValueChange = function () {
            console.log('selectValueChange : vm.selectValue', vm.selectValue)
        }

        // region 全局配置
        // #region

        vm.openGlobalPanel = function () {
            messageBox.openModal('global-panel', 'none')
        }

        vm.closeGlobalPanel = function () {
            messageBox.closeModal('global-panel')
        }

        // 增加权限
        vm.addPermission = function (type) {
            if (type === 'row') {
                vm.tableData.permission.row.splice(0, 0, {
                    'num': 1, 'tag': ''
                })
            } else if (type === 'col') {
                vm.tableData.permission.col.splice(0, 0, {
                    'num': 1, 'tag': ''
                })
            }
        }

        // 删除权限
        vm.deletePermission = function (type, index) {
            if (type === 'row') {
                vm.tableData.pinned.row.splice(index, 1)
            } else if (type === 'col') {
                vm.tableData.pinned.col.splice(index, 1)
            }
        }

        // #endregion

        // region 高级设置
        // #region

        vm.cellEditOptions = {}

        vm.configSwitchGroup = ',function,group,cellType,'
        vm.configSwitch = 'function'

        vm.openFunctionEditPanel = function () {
            var _cells = hot.Methods.getSelected()
            if (!_cells) {
                messageBox.alert('请先选定单元格区域！')
                return;
            }
            vm.configSwitchGroup = ',function,group,cellType,'
            var _range = _cells[0]
            var _metaData = hotUtils.getCellMeta(vm, _range[0], _range[1])
            var _value = hot.Methods.getDataAtCell(_range[0], _range[1])
            if (_metaData.cellDataKind == 'olap') {
                console.log('openFunctionEditPanel, _metaData', _metaData)
                vm.loadOlapRowsById(_metaData.cellDataSource.olapid, 'vm.groupSelectOlap')
                vm.cellEditOptions = angular.copy(_metaData.editType)
                vm.summaryGroup = angular.copy(_metaData.summaryGroup)
                vm.configSwitch = 'group'
                vm.configSwitchGroup = ',group,cellType,'
            } else {
                vm.configSwitch = 'function'
                vm.configSwitchGroup = ',function,'
            }
            messageBox.openModal('function-content', 'none')
        }

        vm.closeFunctionEditPanel = function (type) {
            messageBox.closeModal('function-content')
            if (type === 'save') {
                var _cells = hot.Methods.getSelected()
                if (_cells) {
                    var _range = _cells[0]
                    var _metaData = hotUtils.getCellMeta(vm, _range[0], _range[1])
                    if (isNotNull(vm.functionText)) {
                        hot.Methods.setDataAtCell(_range[0], _range[1], vm.functionText)
                        _metaData.cellDataKind = 'formula'
                        _metaData.formula = vm.functionText
                        hotUtils.disabledEditing(hot.getHot(), vm)
                    }
                    if (_metaData.cellDataKind == 'olap') {
                        _metaData.editType = angular.copy(vm.cellEditOptions)
                        _metaData.summaryGroup = angular.copy(vm.summaryGroup)
                        vm.summaryGroup = {
                            'group': false, 
                            'type': 'none',
                            'parentRow': ''
                        }
                    }
                    inArray(vm.tableData.coors, {'coors': _range[0] + '-' + _range[1], 'meta': _metaData}, 'coors', true)
                }
            }
        }

        vm.changeGroupParent = function () {
            if (isNotNull(vm.summaryGroup.parentRow)) {
                var _tempArr = vm.tableData.coors.filter(function (value) {
                    return value['coors'] == vm.summaryGroup.parentRow
                })
                if (_tempArr.length == 1) {
                    vm.summaryGroup.parentObj = _tempArr[0].meta.cellDataSource
                } else {
                    console.log('在vm.tableData.coors搜索到' + _tempArr.length + '对应坐标')
                    console.log('坐标:', vm.summaryGroup.parentRow)
                    console.log('vm.tableData.coors:', vm.tableData.coors)
                }
                
            } else {
                vm.summaryGroup.parentObj = {}
            }
        }

        vm.functionList = []
        vm.functions = []
        vm.functionType = {}
        vm.selectFunction = {}
        vm.selectDescription = ''
        vm.functionText = ''

        // 修改函数类型
        vm.changeFunctionType = function () {
            if (vm.functionType['child']) {
                vm.functions = vm.functionType['child']
            }
        }

        // 修改函数
        vm.changeFunction = function () {
            if (vm.selectFunction['code']) {
                vm.selectDescription = vm.selectFunction['des']
            }
        }

        // 向函数编辑区域添加函数
        vm.changeFunctionArea = function () {
            if (vm.selectFunction['code']) {
                vm.selectDescription = vm.selectFunction['des']
                vm.functionText = vm.functionText + vm.selectFunction['code'] + '()'
            }
        }

        //分组汇总

        vm.summaryMethod = summaryMethod

        vm.groupSelectOlap = [{'cols':[]}]
        vm.summaryGroup = {'group': false}
        
        // #endregion 

        vm.getTableData = function () {
            var _maxSize = hotUtils.getMaxRowAndCol(hot, vm.tableData.mergeCells)
            vm.tableData.maxRow = _maxSize.maxRow
            vm.tableData.maxCol = _maxSize.maxCol
            vm.reportConfig = []
            var row = {}
            row.col = []
            vm.tableData.row = [];
            for (var _i = 0; _i <= vm.tableData.maxRow; _i++) {
                var row = {}
                row.col = []
                for (var _j = 0; _j <= vm.tableData.maxCol; _j++) {
                    var _cellMate = hotUtils.getCellMeta(vm, _i, _j)
                    var _style = _cellMate.style || {}
                    var _cell = {}
                    _cell.value = hot.Methods.getDataAtCell(_i, _j) || ''
                    hotUtils.getCellSpace(_i, _j, _style, vm.tableData.mergeCells)
                    _cell.style = _style
                    _cell.width = hot.Methods.getColWidth(_j)
                    _cell.colwidth = hotUtils.getTdWidth(hot, _i, _j, vm.tableData.mergeCells)
                    _cell.height = hot.Methods.getRowHeight(_i)
                    if (isNotNull(_cellMate.cellDataKind)) {
                        _cell.cellDataKind = _cellMate.cellDataKind
                    }
                    if (isNotNull(_cellMate.cellDataSource)) {
                        _cell.cellDataSource = _cellMate.cellDataSource
                    }
                    if (isNotNull(_cellMate.formula)) {
                        _cell.formula = _cellMate.formula
                    }
                    if (isNotNull(_cellMate.summaryGroup)) {
                        _cell.summaryGroup = _cellMate.summaryGroup
                    }
                    if (isNotNull(_cellMate.editType)) {
                        _cell.editType = _cellMate.editType
                    }
                    row.col.push(_cell)
                    vm.tableData.colWidths[_j] = hot.Methods.getColWidth(_j)
                    vm.tableData.rowHeights[_i] = hot.Methods.getRowHeight(_i)
                }
                var firstCellMate = hot.Methods.getCellMeta(_i, 0)
                vm.tableData.row.push(row)
            }
            console.log('getTableData结束, getTableData为', vm.tableData)
        }

        vm.previewReport = function () {
            vm.getTableData()
            vm.tableConfig = angular.copy(vm.tableData)
            if ($('.mask-content').hasClass('mack-transparent-0')) {
                $('.mask-content').removeClass('mack-transparent-0')
            }
            $('.mask-content').show()
            $('.report-preview').css('top', '1%')
        }

        vm.hidePreviewReport = function () {
            // dataxLoding.hideLoading('cooooo')
            $('.mask-content').hide()
            $('.report-preview').css('top', '-110%')
        }

        vm.reportName = ""
        vm.openSavePanel = function () {
            $('.mask-content').show()
            $('.save-content').css('top', '10%')
        }

        vm.closeSavePanel = function () {
            $('.mask-content').hide()
            $('.save-content').css('top', '-700px')
        }

        vm.saveReportConfig = function () {
            // messageBox('保存成功！')
            // alertBox({'title': '标题', 'message': '消息'})
            vm.getTableData()
            vm.config = angular.copy(vm.tableData)
            $http({
                method: 'post',
                url: "/api/dash/saveReportConfig",
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: {
                    reportConfig: vm.config
                }
            }).then(function (rs) {
                vm.closeSavePanel()
                if (rs.data.status == 'success') {
                    
                }
            }) 
        }

        // region 拖拽
        // #region

        vm.onDragComplete = function (data, evt) {
            console.log('drag success, data:', data)
        }

        vm.onDropComplete = function(data, evt){
            // console.log('drop success, data:', data);
        }
        vm.onDragMove = function(data, evt){
            dragging = true
            // console.log('drop onDragMove, data:', data);
        }
        vm.onDragStart = function(data, evt){
            hoverCell = {}
        }
        vm.onDragStop = function(data, evt){
            if (dragging && hoverCell && hoverCell != {} && Object.keys(hoverCell).length > 0) {
                //tableData[hoverCell['row']][hoverCell['col']] = data['name']
                hot.Methods.setDataAtCell(hoverCell.row, hoverCell.col, '=' + data['name'])
                var _cellMeta = hotUtils.getCellMeta(vm, hoverCell.row, hoverCell.col)
                _cellMeta.cellDataKind =  'olap'
                _cellMeta.cellDataSource =  data
                _cellMeta.summaryGroup = {
                    'group': false, 
                    'type': 'none',
                    'parentRow': ''
                }
                _cellMeta.editType = {
                    'name': data['name'],
                    'type': 'text',
                    'sourceType': '',
                    'source': '',
                    'config': {}
                }
                inArray(vm.tableData.coors, {'coors': hoverCell.row + '-' + hoverCell.col, 'meta': _cellMeta}, 'coors', true) 
                hotUtils.disabledEditing(hot.getHot(), vm)
                inArray(vm.olapDataCell, 
                    {'coors': hoverCell.row + '-' + hoverCell.col, 
                        'name': (hoverCell.row + 1) + '行-' + translateExcelColName((hoverCell.col + 1), 'reset') + '列'
                    }, 'coors', true)
            }
            dragging = false
        }

        /* #endregion  */ 

        /* #region 功能面板方法 */ 
        //region 功能面板方法

        vm.copyCell = function(type, ex1) {
            hotUtils.copyCell(hot, type, ex1)
        }

        vm.pasteCell = function(e) {
            alert('由于安全限制, 当前浏览器不支持粘贴功能, 请使用键盘ctrl+v')
        }

        //设置字体、边框、背景色
        vm.setFont = function (type, ex1) {
            hotUtils.setCellFont(hot, vm, type, ex1)
        }

        // 设置边框线
        vm.setCellBorder = function (type, operation) {
            hotUtils.setCellBorder(hot, vm, type, operation)
        }

        // 设置单元格对齐方式
        vm.setCellAlignment = function (type, ex1) {
            hotUtils.setCellAlignment(hot, vm, type, ex1)
        }

        // 设置单元格数字格式化方式
        vm.setCellNumberFormat = function (type, ex1) {
            hotUtils.setCellNumberFormat(hot, vm, type, ex1)
        }

        // 单元格背景色
        $scope.$watch('bgColor', function (newValue) {
            if (!vm.renderingToolarBtn && hot) {
                hotUtils.setCellFont(hot, vm, 'bgColor', newValue)
            }
        })

        // 单元格数据颜色
        $scope.$watch('fontColor', function (newValue) {
            if (!vm.renderingToolarBtn && hot) {
                hotUtils.setCellFont(hot, vm, 'fontColor', newValue)
            }
        })

        // #endregion

        // region 插件相关方法
        // #region

        // 选择一个或多个单元格之后触发

        vm.afterInit = function () {
            
        }

        vm.afterSelection = function (row, col, row2, col2, ps, sll) {
            vm.cellsRange = []
            vm.cellsRange.push(row)
            vm.cellsRange.push(col)
            vm.cellsRange.push(row2)
            vm.cellsRange.push(col2)
            $('.report-btn').removeClass('report-btn-hover')
            if ((col - col2) || (row - row2)) {
                hotUtils.renderingSelectCell(hot, vm, vm.tableData)
            } else {
                hotUtils.renderingSelectCell(hot, vm, vm.tableData, row, col)
            }
        }

        // 新增行之后触发
        vm.afterCreateRow = function (index, amount, source) {
            
        }

        // 新增列之后触发
        vm.afterCreateCol = function (index, amount, source) {
            
        }

        // 删除行之后触发
        vm.afterRemoveRow = function (index, amount) {
            
        }
        
        // 删除列之后触发
        vm.afterRemoveCol = function (index, amount) {

        }
        
        // 鼠标移入, 移出单元格触发
        vm.afterOnCellMouseHover = function (event, coords, td, operation) {
            if (operation == 'in') {
                if (dragging) {
                    $(td).addClass('drag-cover');
                    hoverCell = coords
                }
            } else {
                $(td).removeClass('drag-cover');
            hoverCell = {}
            }

        }

        // 单元格改变后触发
        vm.afterChange = function (changes, source) {
            if (source == "edit") {
                hot.Methods.setCellMeta(changes[0][0], changes[0][1], "value", changes[0][3])
            } else if (source == "CopyPaste.paste") {
    
            }
        }
        
        // 合并, 拆分单元格后触发
        vm.mergeCells = function (cellRange, mergeParent, auto, operation) {
            if (vm.initTableComplete && operation == 'merge') {
                var _cells = vm.tableData.mergeCells
                _cells.push(mergeParent)
            } else if (vm.initTableComplete && operation == 'unmerge') {
                var _cells = vm.tableData.mergeCells
                if (_cells.length > 0) {
                    var _mergeRowIndex = -1
                    for (var _i = 0; _i < _cells.length; _i++) {
                        if (cellRange.from.row <= _cells[_i].row 
                            && cellRange.from.col <= _cells[_i].col
                            && cellRange.to.row >= _cells[_i].row + (_cells[_i].rowspan - 1)
                            && cellRange.to.col >= _cells[_i].col + (_cells[_i].colspan - 1)) {
                                _mergeRowIndex = _i
                                break
                            }
                    }
                    if (_mergeRowIndex >= 0) {
                        _cells.splice(_mergeRowIndex, 1)
                    }
                }
            }
            // hotUtils.renderingSelectCell(hot, vm, vm.tableData)
        }

        // 完成单元格渲染之前
        vm.beforeRenderer = function (td, row, column, prop, value, cellProperties) {
            
        }

        // 完成单元格渲染之后
        vm.afterRenderer = function (td, row, column, prop, value, cellProperties) {
            // console.log('afterRenderer')
            if (vm.initTableComplete) {
                var _metaDataArr = vm.tableData.coors.filter(function (val) {
                    return val['coors'] == row + '-' + column
                })
                if (_metaDataArr[0]) {
                    hotUtils.renderingSelectCell(hot, vm, vm.tableData, row, column)
                }
            }

        }
        
        // 键盘监听事件
        vm.afterDocumentKeyDown = function (event) {
            // ctrl + z
            if (event.keyCode == 90 && event.ctrlKey) {
               
            // delete    
            } else if(event.keyCode == 46){
                hotUtils.deleteCell(hot, vm)
            }
        }

        //调整列宽后触发
        vm.afterColumnResize = function (currentColumn, newSize, isDoubleClick) {
            var _resizeCol = {'col': currentColumn, 'size': newSize}
            var _isResize = inArray(vm.tableData.colWidths, _resizeCol, 'col', true)
            if (!_isResize) {
                vm.tableData.colWidths.push(_resizeCol)
            }
            // hotUtils.renderingSelectCell(hot, vm, vm.tableData)
        }

        //调整行高后触发
        vm.afterRowResize = function (currentRow, newSize, isDoubleClick) {
            var _resizeRow = {'row': currentRow, 'size': newSize}
            var _isResize = inArray(vm.tableData.rowHeights, _resizeRow, 'row', true)
            if (!_isResize) {
                vm.tableData.colWidths.push(_resizeRow)
            }
            // hotUtils.renderingSelectCell(hot, vm, vm.tableData)
        }

        //
        vm.afterUpdateSettings = function (newSettings) {
            console.log('更新设置')
            vm.initTableComplete = false
            vm.tableData.mergeCells.forEach(function (value) {
                hot.Methods.merge(value.row, value.col
                    , value.row + (value.rowspan - 1), value.col + (value.colspan - 1))
            })
            vm.initTableComplete = true
            // hotUtils.renderingSelectCell(hot, vm, vm.tableData)
        }

        vm.afterBeginEditing = function (row, column) {
            console.log('编辑')
        }

        //单击
        vm.afterOnCellClick = function (event, coords, td) {

        }

        // 双击
        vm.afterOnCellDbClick = function (event, coords, td) {
            console.log('坐标', coords)
            var _metaData = hotUtils.getCellMeta(vm, coords['row'], coords['col'])
            if (_metaData.cellDataKind == 'olap') {
                vm.openFunctionEditPanel()
            }
        }

        // 调整单元格对齐方式
        vm.setAlignment = function (position) {

        }

        // 添加函数
        vm.addFunction = function () {

        }

        // 添加系统参数
        vm.addSysParameters = function () {

        }

        // 给单元格添加超链接
        vm.addLink = function () {

        }

        // 移出单元格超链接
        vm.removeLink = function () {

        }

        // #endregion 插件相关方法 

        $timeout(function () {
            $('.save-content').show()
            $('.function-content').show()
            $('.global-panel').show()
            hot = new Hot($('div[ng-controller="reportDesignController"]').scope(), defaultOptions)
            hot.init()
            vm.initReportConfig()
        })

        /* #region 重置table大小 */ 
        //region 重置table大小 start

        $rootScope.fixTableSize = function () {
            if (hot) {
                var h = 0
                if ($rootScope.toolbarStatus.panel == 'close') {
                    h = angular.element($window).height() - 35
                } else {
                    h = angular.element($window).height() - 120
                }
                var w = 0
                if ($rootScope.toolbarStatus.olap) {
                    $('.left-block').animate({right: '0px'}, 200);
                } else {
                    w = angular.element($window).width()
                    $('.left-block').animate({right: '-220px'}, 200);
                }
                $timeout(function () {
                    hot.Methods.updateSettings({
                        height: h,
                        width: angular.element($window).width()
                    });
                })
            }
        }
        /* #endregion 重置table大小  end */

    }

    // reportDesign.$inject = ['$rootScope', '$scope', '$http', '$window', '$timeout'];
    app.controller('reportDesignController', reportDesign);

    app.directive('resize', function ($window, $rootScope) {
        return function (scope) {
            var w = angular.element($window);
            scope.getWindowDimensions = function () {
                return { 'h': w.height(), 'w': w.width() };
            };
            scope.$watch(scope.getWindowDimensions, function (newValue) {
                scope.windowHeight = newValue.h;
                scope.windowWidth = newValue.w;

                scope.style = function () {
                    return {
                        'height': newValue.h + 'px'
                    };
                };
                $rootScope.fixTableSize()
            }, true);
            w.bind('resize', function () {
                scope.$apply();
            });
        };
    });

})();
