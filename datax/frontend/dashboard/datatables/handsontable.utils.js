var HotUtils = function () {

    /* #region 复制 */
    //region 复制
    var copyCell = function (currentHot, type) {
        var _currentCell = currentHot.Methods.getSelected()
        if (_currentCell && _currentCell[0].length === 4) {
            currentHot.Methods.selectCell(_currentCell[0], _currentCell[1], _currentCell[2], _currentCell[3])
            if (type === 'copy') {
                document.execCommand('copy')
            } else if (type === 'cut') {
                document.execCommand('cut')
            }
        } else {
            alert('请选中单元格！')
        }
    }
    /* #endregion */

    /* #region 设置字体、边框、背景色 */
    //region 设置字体、边框、背景色
    var setCellFont = function (currentHot, vm, type, ex1) {
        var _cells = currentHot.Methods.getSelected()
        if (_cells) {
            var _range = _cells[0];
            for (var i = _range[0]; i <= _range[2]; i++) {
                for (var j = _range[1]; j <= _range[3]; j++) {
                    var _metaData = getCellMeta(vm, i, j)
                    
                    var _cellDom = currentHot.Methods.getCell(i, j)
                    // 字体
                    if (type === 'family') {
                        _metaData.style['fontFamily'] = vm.btnModels.fontFamily
                        $(_cellDom).css('font-family', vm.btnModels.fontFamily + ', sans-serif')
                    // 字号
                    } else if(type === 'size') {
                        _metaData.style['fontSize'] = vm.btnModels.fontSize
                        $(_cellDom ).css('font-size', vm.btnModels.fontSize)
                    // 字号+1
                    } else if (type === 'addSize') {
                        _metaData.style['fontSize'] = Number(_metaData.style['fontSize']) + 1
                        $(_cellDom ).css('font-size', Number(_metaData.style['fontSize']) + 1)
                    // 字号-1
                    } else if (type === 'subSize') {
                        if (Number(_metaData.style['fontSize']) && Number(_metaData.style['fontSize']) > 0) {
                            _metaData.style['fontSize'] = Number(_metaData.style['fontSize']) - 1
                            $(_cellDom ).css('font-size', Number(_metaData.style['fontSize']) - 1)
                        }
                    // 加粗
                    } else if (type === 'bold') {
                        if (isNotNull(_metaData.style['fontWeight'])) {
                            delete _metaData.style['fontWeight']
                            $(_cellDom ).css('font-weight', '')
                        } else {
                            _metaData.style['fontWeight'] = 'bold'
                            $(_cellDom ).css('font-weight', 'bold')
                        }
                    // 斜体
                    } else if (type === 'italic') {
                        if (_metaData.style['fontStyle']) {
                            delete _metaData.style['fontStyle']
                            $(_cellDom ).css('font-style', '')
                        } else {
                            _metaData.style['fontStyle'] = 'italic'
                            $(_cellDom ).css('font-style', 'italic')
                        }
                    // 文字划线
                    } else if (type === 'textDecoration') {
                        if (ex1 === 'unset') {
                            delete _metaData.style['textDecoration']
                        } else {
                            _metaData.style['textDecoration'] = ex1
                            $(_cellDom ).css('text-decoration', ex1)
                        }
                    // 背景色    
                    } else if (type === 'bgColor') {
                        _metaData.style['backgroundColor'] = ex1
                        // $(_cellDom ).css('background-color', ex1)
                        var _tempCell = hot.Methods.getCell(i, j)
                        _tempCell.style.backgroundColor = ex1
                    // 文字颜色    
                    } else if (type === 'fontColor') {
                        _metaData.style['color'] = ex1
                        $(_cellDom ).css('color', ex1)
                        
                    }
                    renderingToolBtn(_metaData.style, vm)
                    inArray(vm.tableData.coors, {'coors': i + '-' + j, 'meta': _metaData}, 'coors', true)
                }
            }
        }
    }
    /* #endregion */

    /* #region 设置边框线 */
    //region 设置边框线
    var setCellBorder = function (currentHot, vm, type, operation) {
        var _cells = currentHot.Methods.getSelected()
        if (_cells) {
            var _range = _cells[0]
            for (var i = _range[0]; i <= _range[2]; i++) {
                for (var j = _range[1]; j <= _range[3]; j++) {
                    var _metaData = getCellMeta(vm, i, j)
                    var _cellDom = currentHot.Methods.getCell(i, j)
                    if (operation === 'clean') {
                        clearCellBorder(_cellDom, _metaData.style)
                    }
                    switch (type) {
                        case 'borderLeft':
                            if (j === _range[1]) {
                                _metaData.style["borderLeft"] = "1px solid rgba(0, 0, 0, 1)"
                                $(_cellDom).css("border-left", "1px solid rgba(0, 0, 0, 1)")
                            }
                            break;
                        case 'borderRight':
                            if (j === _range[3]) {
                                _metaData.style["borderRight"] = "1px solid rgba(0, 0, 0, 1)"
                                $(_cellDom).css("border-right", "1px solid rgba(0, 0, 0, 1)")
                            }
                            break;
                        case 'borderTop':
                            if (i === _range[0]) {
                                _metaData.style["borderTop"] = "1px solid rgba(0, 0, 0, 1)"
                                $(_cellDom).css("border-top", "1px solid rgba(0, 0, 0, 1)")
                            }
                            break;
                        case 'borderBottom':
                            if (i === _range[2]) {
                                _metaData.style["borderBottom"] = "1px solid rgba(0, 0, 0, 1)"
                                $(_cellDom).css("border-bottom", "1px solid rgba(0, 0, 0, 1)")
                            }
                            break;
                        case 'borderOut':
                            clearCellBorder('borderLeft');
                            clearCellBorder('borderRight');
                            clearCellBorder('borderTop');
                            clearCellBorder('borderBottom');
                            break;
                        case 'borderAll':
                            _metaData.style["borderAll"] = "1px solid rgba(0, 0, 0, 1)"
                            if (j === _range[1]) {
                                $(_cellDom).css("border-left", "1px solid rgba(0, 0, 0, 1)")
                            }
                            if (i === _range[0]) {
                                $(_cellDom).css("border-top", "1px solid rgba(0, 0, 0, 1)")
                            }
                            $(_cellDom).css("border-right", "1px solid rgba(0, 0, 0, 1)")
                            $(_cellDom).css("border-bottom", "1px solid rgba(0, 0, 0, 1)")

                            break;
                        default:
                            break;
                    }
                    renderingToolBtn(_metaData.style, vm)
                    inArray(vm.tableData.coors, {'coors': i + '-' + j, 'meta': _metaData}, 'coors', true)
                }
            }
        }
    }
    /* #endregion */

    /* #region 设置单元格对齐方式 */
    //region 设置单元格对齐方式
    var setCellAlignment = function (currentHot, vm, type, ex1) {
        var _cells = currentHot.Methods.getSelected()
        if (_cells) {
            var _range = _cells[0]
            var i = _range[0] 
            var j = _range[1]
            var _firstMetaData = getCellMeta(vm, i, j)
            var _firstCellDom = currentHot.Methods.getCell(i, j)
            // 合并居中
            if (type === 'merge') {
                currentHot.Methods.unMerge(_range[0], _range[1], _range[2], _range[3])
                currentHot.Methods.merge(_range[0], _range[1], _range[2], _range[3])
                if (ex1 === 'center') {
                    $(_firstCellDom).css('text-align', 'center')
                    $(_firstCellDom).css('vertical-align', 'middle')
                    _firstMetaData.style['merge'] = 'merge'
                    _firstMetaData.style['textAlign'] = 'center'
                    _firstMetaData.style['verticalAlign'] = 'middle'
                    renderingToolBtn(_firstMetaData.style, vm)
                    inArray(vm.tableData.coors, {'coors': i + '-' + j, 'meta': _firstMetaData}, 'coors', true)
                }
            // 跨越合并
            } else if (type === 'crossMerge') {
                currentHot.Methods.unMerge(_range[0], _range[1], _range[2], _range[3])
                for (var i = _range[0]; i <= _range[2]; i++) {
                    currentHot.Methods.merge(i, _range[1], i, _range[3])
                }
                _firstMetaData.style['merge'] = 'crossMerge'
                renderingToolBtn(_firstMetaData.style, vm)
                inArray(vm.tableData.coors, {'coors': i + '-' + j, 'meta': _firstMetaData}, 'coors', true)
                
            // 取消合并
            }  else if (type === 'unMerge') {
                currentHot.Methods.unMerge(_range[0], _range[1], _range[2], _range[3])
                delete _firstMetaData.style['merge']
                renderingToolBtn(_firstMetaData.style, vm)
                inArray(vm.tableData.coors, {'coors': i + '-' + j, 'meta': _firstMetaData}, 'coors', true)
            } else if (type === 'horizontal' || type === 'vertical' || type === 'wrap'){
                for (var i = _range[0]; i <= _range[2]; i++) {
                    for (var j = _range[1]; j <= _range[3]; j++) {
                        var _metaData = getCellMeta(vm, i, j)
                        var _cellDom = currentHot.Methods.getCell(i, j)
                        // 选择水平对齐方式
                        if (type === 'horizontal') {
                            $(_cellDom).css('text-align', ex1)
                            _metaData.style['textAlign'] = ex1
                        // 选择垂直对齐方式
                        } else if (type === 'vertical') {
                            $(_cellDom).css('vertical-align', ex1)
                            _metaData.style['verticalAlign'] = ex1
                        // 自动换行
                        } else if (type === 'wrap') {
                            if (_metaData.style['whiteSpace'] && _metaData.style['whiteSpace'] === 'normal'
                                && _metaData.style['wordBreak'] && _metaData.style['wordBreak'] === 'break-all') {
                                delete _metaData.style['whiteSpace']
                                delete _metaData.style['wordBreak']
                                $(_cellDom).css('white-space', '')
                                $(_cellDom).css('word-break', '')
                            } else {
                                _metaData.style['whiteSpace'] = 'normal'
                                _metaData.style['wordBreak'] = 'break-all'
                                $(_cellDom).css('white_space', 'normal')
                                $(_cellDom).css('word-break', 'break-all')
                            }
                        }
                        renderingToolBtn(_metaData.style, vm)
                        inArray(vm.tableData.coors, {'coors': i + '-' + j, 'meta': _metaData}, 'coors', true)
                    }
                }
            }
        }
    }
    /* #endregion */

    /* #region 设置单元格数字格式化方式 */
    //region 设置单元格数字格式化方式
    var setCellNumberFormat = function (currentHot, vm, type, ex1) {
        var _cells = currentHot.Methods.getSelected()
        if (_cells) {
            var _range = _cells[0]
            for (var i = _range[0]; i <= _range[2]; i++) {
                for (var j = _range[1]; j <= _range[3]; j++) {
                    var _metaData = getCellMeta(vm, i, j)
                    var _tempCellData = currentHot.Methods.getDataAtCell(i, j)
                    _tempCellData = _tempCellData.replace(/,/g, '').replace(/\$/g, '').replace(/¥/g, '').replace(/€/g, '')
                    if ((_tempCellData+'').indexOf('%') > -1) {
                        _tempCellData = ((_tempCellData+'').replace(/%/g, ''))/100
                    }
                    switch (type) {
                        case 'normal':
                            delete _metaData.style['currency']
                            delete _metaData.style['percentage']
                            delete _metaData.style['financial']
                            break;
                        case 'currency':
                            if (isNumber(_tempCellData)) {
                                _tempCellData = ex1 + _tempCellData
                                _metaData.style['currency'] = ex1
                            }
                            break;
                        case 'percentage':
                            try {
                                _tempCellData = (_tempCellData * 100) + '%'
                                _metaData.style['percentage'] = true
                            } catch (e) {
                                console.log(e)
                            }
                            break;
                        case 'financial':
                            try {
                                _tempCellData = financeFormat(_tempCellData)
                                _metaData.style['financial'] = true
                            } catch (e) {
                                console.log(e)
                            }
                            break;
                        case 'pointModify':
                            break;
                    }
                    renderingToolBtn(_metaData.style, vm)
                    inArray(vm.tableData.coors, {'coors': i + '-' + j, 'meta': _metaData}, 'coors', true)
                }
            }
        }
    }
    /* #endregion */

    /* #region 清除单元格框线 */
    //region 清除单元格框线
    var clearCellBorder = function (cellDom, style) {
        if (cellDom && style) {
            delete style["borderTop"]
            delete style["borderBottom"]
            delete style["borderLeft"]
            delete style["borderRight"]
            delete style["borderAll"]
            delete style["borderOut"]
            $(cellDom).css({
                "border-top": "",
                "border-bottom": "",
                "border-left": "",
                "border-right": "",
            })
        }
    }
    /* #endregion */

    /* #region 工具方法 */

    // 判断是否为数字
    var isNumber = function (num) {
        if (num) {
            num = (num + '').replace(/%/g, '').replace(/,/g, '').replace(/\$/g, '').replace(/¥/g, '').replace(/€/g, '')
            if (num <= 0 || num > 0) {
                return true
            }
        }
        return false
    }

    function getMergeCells (tableConfig) {
        var mergeCells = [];
        var cells = tableConfig.mergeCells;
        if (cells) {
            for (var i = 0; i < cells.length; i++) {
                if (cells[i].row >= 0 && cells[i].col >= 0 && (cells[i].colspan > 1 || cells[i].rowspan > 1)) {
                    mergeCells.push(cells[i]);
                }
            }
        }
        return mergeCells;
    }

    /**
     * 根据merge信息设置每个单元格的rowspan和colspan，或者隐藏单元格
     * @param {*} rowIndex 
     * @param {*} colIndex 
     * @param {*} styleObj 
     * @param {*} mergeCells 
     */
    var getCellSpace = function (rowIndex, colIndex, styleObj, mergeCells) {
        mergeCells.forEach(function (_value) {
            if (_value.row === rowIndex && _value.col === colIndex) {
                styleObj['rowspan'] = _value.rowspan
                styleObj['colspan'] = _value.colspan
            } else if (_value.row === rowIndex && _value.colspan > 1
                        && colIndex < _value.col + _value.colspan
                        && colIndex >= _value.col) {
                styleObj['display'] = 'none'
            } else if (_value.col === colIndex && _value.rowspan > 1
                        && rowIndex < _value.row + _value.rowspan
                        && rowIndex >= _value.row) {
                styleObj['display'] = 'none'
            } else if (_value.row < rowIndex && _value.colspan > 1
                        && _value.col < colIndex && _value.rowspan > 1
                        && colIndex < _value.col + _value.colspan
                        && rowIndex < _value.row + _value.rowspan) {
                styleObj['display'] = 'none'
            }
        })
    }

    var getTdWidth = function (currentHot, rowIndex, colIndex, mergeCells) {
        var _width = 0
        var _tempNode
        mergeCells.forEach(function (value) {
            if (value.row == rowIndex && value.col == colIndex) {
                _tempNode = value
            }
        });
        if (_tempNode) {
            for (var i = 0; i < _tempNode.colspan; i++) {
                _width += currentHot.Methods.getColWidth(colIndex + i)
            }
        } else {
            _width = currentHot.Methods.getColWidth(colIndex)
        }
        return _width
    }

    // 删除单元格的配置信息
    var deleteCell = function (currentHot, scope) {
        var _cells = currentHot.Methods.getSelected()
        if (_cells) {
            var _range = _cells[0]
            for (var _i = _range[0]; _i <= _range[2]; _i++) {
                for (var _j = _range[1]; _j <= _range[3]; _j++) {
                    delFromArr(scope.tableData.coors, 'coors', (_i + '-' + _j))
                    delFromArr(scope.olapDataCell, 'coors', (_i + '-' + _j))
                }
            }
        }
    }

    // 获取有数据的最大行和列
    function getMaxRowAndCol (currentHot, mergeCells) {
        var _maxRow = 0
        var _maxCol = 0
        var _data = currentHot.Methods.getSourceData(0, 0, currentHot.Methods.countRows() - 1, currentHot.Methods.countCols() - 1)
        for (var _i = 0; _i < _data.length; _i++) {
            for (var _j = 0; _j < _data[_i].length; _j++) {
                if (_data[_i][_j]) {
                    _maxRow = _i > _maxRow ? _i : _maxRow
                    _maxCol = _j > _maxCol ? _j : _maxCol
                }
            }
        }
        if (isNotNull(mergeCells)) {
            for (var _i = 0; _i < mergeCells.length; _i++) {
                var _range = mergeCells[_i]
                var row = _range.row + _range.rowspan - 1
                var col = _range.col + _range.colspan - 1
                _maxRow = _maxRow > row ? _maxRow : row
                _maxCol = _maxCol > col ? _maxCol : col
            }
        }
        return {'maxRow': _maxRow, 'maxCol': _maxCol}
    }

    /**
     * 
     * @param {*} currentHot 表格对象
     * @param {*} renderingToolBtns 是否要渲染工具栏
     * @param {*} scope angularJs的controller对象
     * @param {*} fixRowIndex 只针对固定行遍历
     * @param {*} fixColIndex 只针对固定列遍历
     */
    function renderingSelectCell (currentHot, scope, currentTableData, fixRowIndex, fixColIndex) {
        var _tableSize = getMaxRowAndCol (currentHot, currentTableData.mergeCells)
        if (_tableSize) {
            var _range = [0, 0, _tableSize.maxRow, _tableSize.maxCol];
            if (isNotNull(fixRowIndex)) {
                _range[0] = fixRowIndex
                _range[2] = fixRowIndex
            }
            if (isNotNull(fixRowIndex)) {
                _range[1] = fixColIndex
                _range[3] = fixColIndex
            }
            var _selectCells = currentHot.Methods.getSelected() || []
            for (var i = _range[0]; i <= _range[2]; i++) {
                for (var j = _range[1]; j <= _range[3]; j++) {
                    var _metaData = getCellMeta(scope, i, j)
                    var _style = _metaData.style
                    if (_style) {
                        var _cellDom = currentHot.Methods.getCell(i, j)
                        if (_selectCells[0] && i === _selectCells[0][0] && j === _selectCells[0][1]) {
                            renderingToolBtn(_style, scope)
                        }
                        // 字体
                        if (isNotNull(_style['fontFamily'])) {
                            $(_cellDom).css('font-family', _style['fontFamily'] + ', sans-serif')
                        }
                        // 字号
                        if (isNotNull(_style['fontSize'])) {
                            $(_cellDom).css('font-size', _style['fontSize'])
                        }
                        // 加粗
                        if (isNotNull(_style['fontWeight'])) {
                            $(_cellDom).css('font-weight', _style['fontWeight'])
                        }
                        // 斜体
                        if (isNotNull(_style['fontStyle'])) {
                            $(_cellDom).css('font-style', _style['fontStyle'])
                        }
                        // 下划线
                        if (isNotNull(_style['textDecoration'])) {
                            $(_cellDom).css('text-decoration', _style['textDecoration'])
                        }
                        // 背景色
                        if (isNotNull(_style['backgroundColor'])) {
                            $(_cellDom).css('background-color', _style['backgroundColor'])
                        }
                        // 字体
                        if (isNotNull(_style['color'])) {
                            $(_cellDom).css('color', _style['color'])
                        }
                        // 边框
                        if (isNotNull(_style['borderLeft'])) {
                            $(_cellDom).css('border-left', _style['borderLeft'])
                        }
                        if (isNotNull(_style['borderRight'])) {
                            $(_cellDom).css('border-right', _style['borderRight'])
                        }
                        if (isNotNull(_style['borderTop'])) {
                            $(_cellDom).css('border-top', _style['borderTop'])
                        }
                        if (isNotNull(_style['borderBottom'])) {
                            $(_cellDom).css('border-bottom', _style['borderBottom'])
                        }
                        if (isNotNull(_style['borderAll'])) {
                            if (j === _range[1]) {
                                $(_cellDom).css("border-left", "1px solid rgba(0, 0, 0, 1)")
                            }
                            if (i === _range[0]) {
                                $(_cellDom).css("border-top", "1px solid rgba(0, 0, 0, 1)")
                            }
                            $(_cellDom).css("border-right", "1px solid rgba(0, 0, 0, 1)")
                            $(_cellDom).css("border-bottom", "1px solid rgba(0, 0, 0, 1)")
                        }
                        // 合并单元格
                        // 对齐方式
                        if (isNotNull(_style['textAlign'])) {
                            $(_cellDom).css('text-align', _style['textAlign'])
                        }
                        if (isNotNull(_style['verticalAlign'])) {
                            $(_cellDom).css('vertical-align', _style['verticalAlign'])
                        }
                        // 自动换行
                        if (isNotNull(_style['whiteSpace']) && isNotNull(_style['wordBreak'])) {
                            $(_cellDom).css('white_space', 'normal')
                            $(_cellDom).css('word-break', 'break-all')
                        }
                        // 数字格式化
                        if (isNotNull(_style['currency']) || isNotNull(_style['currency']) || isNotNull(_style['currency'])) {
                            var _tempCellData = currentHot.Methods.getDataAtCell(i, j)
                            _tempCellData = _tempCellData.replace(/,/g, '').replace(/\$/g, '').replace(/¥/g, '').replace(/€/g, '')
                            if ((_tempCellData+'').indexOf('%') > -1) {
                                _tempCellData = ((_tempCellData+'').replace(/%/g, ''))/100
                            }
                            if (isNotNull(_style['currency'])) {
                                _tempCellData = _style['currency'] + _style['currency']
                            }
                            if (isNotNull(_style['percentage'])) {
                                try {
                                    _tempCellData = (_tempCellData * 100) + '%'
                                } catch (e) {
                                    console.log(e)
                                }
                            }
                            if (isNotNull(_style['financial'])) {
                                try {
                                    _tempCellData = financeFormat(_tempCellData)
                                } catch (e) {
                                    console.log(e)
                                }
                            }
                            currentHot.Methods.setDataAtCell(i, j, _tempCellData)
                        }
                    } else {
                        if (i === _range[0] && j === _range[1]) {
                            $('.report-btn-hover').removeClass('report-btn-hover')
                        }
                    }
                }
            }
        }
    }


    /**
     * 渲染工具栏图标背景色
     * @param {*} styleObj 
     * @param {*} scope 
     */
    function renderingToolBtn (styleObj, scope) {
        if (isNotNull(styleObj)) {
            // 字体
            if (isNotNull(styleObj['fontFamily'])) {
                if (scope && scope.btnModels) {
                    scope.btnModels.fontFamily = styleObj['fontFamily']
                }
            }
            // 字号
            if (isNotNull(styleObj['fontSize'])) {
                var isRenderingFontSize = fontSizes.some(function (value) {
                    return value == styleObj['fontSize']
                })
                if (scope && scope.btnModels && isRenderingFontSize) {
                    scope.btnModels.fontSize = styleObj['fontSize']
                }
            }
            // 加粗
            if (isNotNull(styleObj['fontWeight'])) {
                $('.btn-font-bold').addClass('report-btn-hover')
            } else {
                $('.btn-font-bold').removeClass('report-btn-hover')
            }
            // 斜体
            if (isNotNull(styleObj['fontStyle'])) {
                $('.btn-font-italic').addClass('report-btn-hover')
            } else {
                $('.btn-font-italic').removeClass('report-btn-hover')
            }
            // 下划线
            if (isNotNull(styleObj['textDecoration'])) {
                $('.btn-font-underline').addClass('report-btn-hover')
            } else {
                $('.btn-font-underline').removeClass('report-btn-hover')
            }
            // 背景色
            if (isNotNull(styleObj['backgroundColor'])) {
                $('.btn-background-color').addClass('report-btn-hover')
            } else {
                $('.btn-background-color').removeClass('report-btn-hover')
            }
            // 字体色
            if (isNotNull(styleObj['color'])) {
                $('.btn-font-color').addClass('report-btn-hover')
            } else {
                $('.btn-font-color').removeClass('report-btn-hover')
            }
            // 边框
            if (isNotNull(styleObj['borderLeft']) || isNotNull(styleObj['borderRight'])
                || isNotNull(styleObj['borderTop']) || isNotNull(styleObj['borderBottom'])
                || isNotNull(styleObj['borderAll'])) {
                $('.btn-cell-border').addClass('report-btn-hover')
            } else {
                $('.btn-cell-border').removeClass('report-btn-hover')
            }
            // 合并单元格
            if (isNotNull(styleObj['merge'])) {
                $('.btn-merge-cells').addClass('report-btn-hover')
            } else {
                $('.btn-merge-cells').removeClass('report-btn-hover')
            }
            // 对齐方式
            if (isNotNull(styleObj['textAlign']) || isNotNull(styleObj['verticalAlign'])) {
                switch (styleObj['textAlign']) {
                    case 'left':
                        $('.btn-horizontally-left').addClass('report-btn-hover')
                        break;
                    case 'center':
                        $('.btn-horizontally-center').addClass('report-btn-hover')
                        break;
                    case 'right':
                        $('.btn-horizontally-down').addClass('report-btn-hover')
                        break;
                    default:
                        break;
                }
                switch (styleObj['verticalAlign']) {
                    case 'top':
                        $('.btn-vertical-up').addClass('report-btn-hover')
                        break;
                    case 'middle':
                        $('.btn-vertical-center').addClass('report-btn-hover')
                        break;
                    case 'bottom':
                        $('.btn-vertical-down').addClass('report-btn-hover')
                        break;
                    default:
                        break;
                }
            }
            // 自动换行
            if (isNotNull(styleObj['whiteSpace']) && isNotNull(styleObj['wordBreak'])) {
                $('.btn-cell-warp').addClass('report-btn-hover')
            } else {
                $('.btn-cell-warp').removeClass('report-btn-hover')
            }
            // 数字格式化
            if (isNotNull(styleObj['currency'])) {
                $('.btn-currency-symbol').addClass('report-btn-hover')
            } else {
                $('.btn-currency-symbol').removeClass('report-btn-hover')
            }
            if (isNotNull(styleObj['percentage'])) {
                $('.btn-percentage').addClass('report-btn-hover')
            } else {
                $('.btn-percentage').removeClass('report-btn-hover')
            }
            if (isNotNull(styleObj['financial'])) {
                $('.btn-financial-count').addClass('report-btn-hover')
            } else {
                $('.btn-financial-count').removeClass('report-btn-hover')
            }
        }    
    }

    /**
     * 禁用单元格
     * @param {*} currentHot 
     * @param {*} vm 
     */
    var disabledEditing = function (currentHot, vm) {
        if (currentHot) {
            currentHot.updateSettings({
                cells: function (row, col, prop) {
                    var _meta = getCellMeta(vm, row, col)
                    var cellProperties = {}
                    if (isNotNull(_meta.cellDataKind)) {
                        cellProperties.editor = false
                    } else {
                        cellProperties.editor = 'text'
                    }

                    return cellProperties
                }
            })  
        }
              
    }

    /**
     * 取到单元格的配置信息
     * @param {*} scope 
     * @param {*} row 
     * @param {*} col 
     */
    var getCellMeta = function (scope, row, col) {
        var _metaDataArr = scope.tableData.coors.filter(function (val) {
            return val['coors'] == row + '-' + col
        })
        var _metaData = _metaDataArr[0] || {'meta':{}}
        var _style = _metaData.meta.style || {}
        if (!_style['fontFamily']) {
            _style['fontFamily'] = 'Arial'
        }
        if (!_style['fontSize']) {
            _style['fontSize'] = 14
        }
        _metaData.meta.style = _style
        return _metaData.meta
    }

    /* #endregion */

    return {
        setCellFont: setCellFont,
        setCellBorder: setCellBorder,
        setCellAlignment: setCellAlignment,
        copyCell: copyCell,
        setCellNumberFormat: setCellNumberFormat,
        getMergeCells: getMergeCells,
        getCellSpace: getCellSpace,
        getTdWidth: getTdWidth,
        getMaxRowAndCol: getMaxRowAndCol,
        renderingSelectCell: renderingSelectCell,
        renderingToolBtn: renderingToolBtn,
        deleteCell: deleteCell,
        disabledEditing: disabledEditing,
        getCellMeta: getCellMeta
    }

}
