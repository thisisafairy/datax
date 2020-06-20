/*
    api 参考 https://handsontable.com/docs
* */
var Hot = function(scope, defaultOptions) {
	var hot;
	var init = function() {
		var showtable = document.getElementById(defaultOptions.elementId);
		hot = new Handsontable(showtable, {
			width : defaultOptions.tableWidth,
			height : defaultOptions.tableHeight,
			allowEmpty : true,
			colWidths : defaultOptions.cellWidth,
			rowHeights : defaultOptions.cellHeight,
			rowHeaders : true,
			colHeaders : true,
			allowInsertColumn : true,
			allowInsertRow : true,
			contextMenu : true,
			copyPaste : true,
			manualRowResize : true,
			manualColumnResize : true,
			language : defaultOptions.language,
			defaultColumnWidth: 100,
			minCols : defaultOptions.minCols,
			minRows : defaultOptions.minRows,
			outsideClickDeselects : false,
			manualColumnMove : true,
			mergeCells : true,
			customBorders : false,
			comments : false,
			selectionMode : 'range', // 'single', 'range' or 'multiple'
			contextMenu : {
				callback : function(key, options) {
					try {
						contextMenuCallback(key, options);
					} catch (e) {
						console.log(e);
						console.error('contextMenuCallback函数不存在');
					}
				},
				items : {
					'hot' : {
						name : '其它配置',
						submenu : {
							items : [
							    {
									key : 'hot:addFunction',
									name : '插入函数'
								},
                                {
									key : 'hot:addSysParameters',
									name : '插入系统参数'
								},
								{
									key : 'hot:link',
									name : '配置超链接'
								},
								{
									key : 'hot:removeLink',
									name : '取消超链接'
								},
								{
									key : 'hot:addImage',
									name : '插入图片'
								},
							]
						}
					},
					hsep3 : '---------',
					row_above : {},
					row_below : {},
					hsep1 : '---------',
					col_left : {},
					col_right : {},
					hsep2 : '---------',
					remove_row : {},
					remove_col : {},
					//					hsep3: '---------',
					//					undo: {},
					//					redo: {},
					hsep4 : '---------',
					//make_read_only: {},
					//hsep5: '---------',
					alignment : {},
					hsep6 : '---------',
					copy : {},
					cut : {},
					//					hsep7: '---------',
					//					borders: {},
					hsep8 : '---------',
					mergeCells : {},
					hsep9 : '---------',
					// copyStyle : {
					// 	name : '复制单元格样式'
					// },
					// pasteStyle : {
					// 	name : '粘贴单元格样式'
					// }
				}
			}
		});
        initEvent();
	};
	//初始化绑定事件
	var initEvent = function() {

        //表格初始化结束后事件
        Handsontable.hooks.add('afterInit', afterInit, hot);
        
		//选中后事件
		Handsontable.hooks.add('afterSelection', afterSelection, hot);

		//新增删除行或者列事件
		Handsontable.hooks.add('afterCreateRow', afterCreateRow, hot);
		Handsontable.hooks.add('afterCreateCol', afterCreateCol, hot);
		Handsontable.hooks.add('afterRemoveRow', afterRemoveRow, hot);
		Handsontable.hooks.add('afterRemoveCol', afterRemoveCol, hot);

		//鼠标移入移出表格事件
		Handsontable.hooks.add('afterOnCellMouseOver', afterOnCellMouseOver, hot);
		Handsontable.hooks.add('afterOnCellMouseOut', afterOnCellMouseOut, hot);

		//单元格改变事件
		Handsontable.hooks.add('afterChange', afterChange, hot);

		//单元格合并
		Handsontable.hooks.add('afterMergeCells', afterMergeCells, hot);
		Handsontable.hooks.add('afterUnmergeCells', afterUnmergeCells, hot);

		//渲染表格
		// Handsontable.hooks.add('beforeRenderer', beforeRenderer, hot);
		Handsontable.hooks.add('afterRenderer', afterRenderer, hot);

		//键盘按下
		Handsontable.hooks.add('afterDocumentKeyDown', afterDocumentKeyDown, hot);

        //调整列高,行宽数值
		Handsontable.hooks.add('afterColumnResize', afterColumnResize, hot);
        Handsontable.hooks.add('afterRowResize', afterRowResize, hot);

        // 修改设置
        Handsontable.hooks.add('afterUpdateSettings', afterUpdateSettings, hot);

        // 编辑之前
        Handsontable.hooks.add('afterBeginEditing', afterBeginEditing, hot);
        Handsontable.hooks.add('afterUpdateSettings', afterUpdateSettings, hot);

        // 鼠标点击
        Handsontable.hooks.add('afterOnCellMouseDown', afterOnCellMouseDown, hot);

    };
    
    var afterInit = function() {
        scope.afterInit()
    }

	var afterSelection = function(row, column, row2, column2, preventScrolling, selectionLayerLevel) {
		scope.afterSelection(row, column, row2, column2, preventScrolling, selectionLayerLevel)
	    //console.log('afterSelection', r, c, r2, c2, preventScrolling, selectionLayerLevel);
	};
	var afterCreateRow = function(index, amount, source) {
		scope.afterCreateRow(index, amount, source)
		//console.log('afterCreateRow', index, amount, source);
	};
	var afterCreateCol = function(index, amount, source) {
		scope.afterCreateCol(index, amount, source)
		//console.log('afterCreateCol', index, amount, source);
	};
	var afterRemoveRow = function(index, amount) {
		scope.afterRemoveRow(index, amount)
	    //console.log('afterRemoveRow', index, amount);
	};
	var afterRemoveCol = function(index, amount) {
		scope.afterRemoveCol(index, amount)
	    //console.log('afterRemoveCol', index, amount);
	};
	var afterOnCellMouseOver = function(event, coords, td) {
	    scope.afterOnCellMouseHover(event, coords, td, 'in')
	    //console.log('afterOnCellMouseHover', event, coords, td);
	};
	var afterOnCellMouseOut = function(event, coords, td) {
        scope.afterOnCellMouseHover(event, coords, td, 'out')
	    //console.log('afterOnCellMouseHover', event, coords, td);
	};
	var afterChange = function(changes, source) {
	    scope.afterChange(changes, source)
	    //console.log('afterChangeFunction', changes, source);
	};
	var afterMergeCells = function(cellRange, mergeParent, auto) {
		scope.mergeCells(cellRange, mergeParent, auto, 'merge')
	};
	var afterUnmergeCells = function(cellRange, auto) {
		scope.mergeCells(cellRange, null, auto, 'unmerge')
		//console.log('afterUnmergeCells', cellRange, auto);
	};
	var beforeRenderer = function(td, row, column, prop, value, cellProperties) {
		// scope.beforeRenderer(td, row, column, prop, value, cellProperties)
		//console.log('beforeRenderer', td, row, column, prop, value, cellProperties);
	};
	var afterRenderer = function(td, row, column, prop, value, cellProperties) {
		scope.afterRenderer(td, row, column, prop, value, cellProperties)
		//console.log('afterRenderer', td, row, column, prop, value, cellProperties);
	};
	var afterDocumentKeyDown = function(event) {
	    scope.afterDocumentKeyDown(event)
		//console.log('afterDocumentKeyDown', event);
	};

	var afterColumnResize = function(currentColumn, newSize, isDoubleClick) {
		scope.afterColumnResize(currentColumn, newSize, isDoubleClick)
	    //console.log('afterColumnResize', currentColumn, newSize, isDoubleClick);
	};

	var afterRowResize = function(currentRow, newSize, isDoubleClick) {
		scope.afterRowResize(currentRow, newSize, isDoubleClick)
	    //console.log('afterRowResize', currentRow, newSize, isDoubleClick);
    };

    var afterUpdateSettings = function (newSettings) {
        scope.afterUpdateSettings(newSettings)
    }

    var afterBeginEditing = function (row, column) {
        scope.afterBeginEditing(row, column)
    }

    var afterOnCellMouseDown = function (event, coords, td) {
        var _now = new Date().getTime()
        if(!(td.lastClick && _now - td.lastClick < 200)) {
            td.lastClick = _now
            scope.afterOnCellClick(event, coords, td)
            return
        }
        scope.afterOnCellDbClick(event, coords, td)
    }

	//主动调用事件
	var render = function() {
		return hot.render();
	};
	var getSelected = function() {
		return hot.getSelected();
	};
	var getSelectedLast = function() {
		return hot.getSelectedLast();
	};
	var getSelectedRange = function() {
		return hot.getSelectedRange();
	};
	var getSelectedRangeLast = function() {
		return hot.getSelectedRangeLast();
	};
	var countCols = function() {
		return hot.countCols();
	};
	var countRows = function() {
		return hot.countRows();
	};
	var countEmptyCols = function(ending) {
		return hot.countEmptyCols(ending);
	};
	var countEmptyRows = function(ending) {
		return hot.countEmptyRows(ending);
	};
	var countRenderedCols = function() {
		return hot.countRenderedCols();
	};
	var countRenderedRows = function() {
		return hot.countRenderedCols();
	};
	var countSourceCols = function() {
		return hot.countSourceCols();
	};
	var countSourceRows = function() {
		return hot.countSourceRows();
	};
	var deselectCell = function() {
		return hot.deselectCell();
	};
	var emptySelectedCells = function() {
		return hot.emptySelectedCells();
	};
	var getActiveEditor = function() {
		return hot.getActiveEditor();
	};
	var getCell = function(row, col, topmost) {
		return hot.getCell(row, col, topmost);
	};
	var getCellEditor = function(row, col) {
		return hot.getCellEditor(row, col);
	};
	var getCellMeta = function(row, col) {
		return hot.getCellMeta(row, col);
	};
	var getCellMetaAtRow = function(row) {
		return hot.getCellMetaAtRow(row);
	};
	var getColWidth = function(col) {
		return hot.getColWidth(col);
	};
	var getRowHeight = function(row) {
		return hot.getRowHeight(row);
	};
	var getData = function(r, c, r2, c2) {
		return hot.getData(r, c, r2, c2);
	};
	var getDataAtCell = function(row, col) {
		return hot.getDataAtCell(row, col);
	};
	var getDataAtCol = function(col) {
		return hot.getDataAtCol(col);
	};
	var getDataAtProp = function(prop) {
		return hot.getDataAtProp(prop);
	};
	var getDataAtRow = function(row) {
		return hot.getDataAtRow(row);
	};

	var getDataAtRowProp = function(row, prop) {
		return hot.getDataAtRowProp(row, prop);
	};
	var getSourceData = function(r, c, r2, c2) {
		return hot.getSourceData(r, c, r2, c2);
	};
	var getSourceDataArray = function(r, c, r2, c2) {
		return hot.getSourceDataArray(r, c, r2, c2);
	};

	var getSourceDataAtCell = function(r, c) {
		return hot.getSourceDataAtCell(r, c);
	};
	var getSourceDataAtCol = function(c) {
		return hot.getSourceDataAtCol(c);
	};
	var getSourceDataAtRow = function(row) {
		return hot.getSourceDataAtRow(row);
	};
	var getValue = function() {
		return hot.getValue();
	};
	var isEmptyCol = function(col) {
		return hot.isEmptyCol(col);
	};
	var isEmptyRow = function(row) {
		return hot.isEmptyRow(row);
	};
	var removeCellMeta = function(row, col, key) {
		return hot.removeCellMeta(row, col, key);
	};
	var selectAll = function() {
		return hot.selectAll();
	};
	var selectCell = function(row, column, endRow, endColumn, scrollToCell, changeListener) {
		return hot.selectCell(row, column, endRow, endColumn, scrollToCell, changeListener);
	};
	var selectCellByProp = function(row, prop, endRow, endProp, scrollToCell, changeListener) {
		return hot.selectCellByProp(row, prop, endRow, endProp, scrollToCell, changeListener);
	};
	var selectColumns = function(startColumn, endColumn) {
		return hot.selectColumns(startColumn, endColumn);
	};
	var selectRows = function(startRow, endRow) {
		return hot.selectRows(startRow, endRow);
	};
	var setCellMeta = function(row, col, key, val) {
		return hot.setCellMeta(row, col, key, val);
	};
	var setCellMetaObject = function(row, col, prop) {
		return hot.setCellMetaObject(row, col, prop);
	};
	var setDataAtCell = function(row, col, value, source) {
		return hot.setDataAtCell(row, col, value, source);
	};
	var setDataAtRowProp = function(row, prop, value, source) {
		return hot.setDataAtRowProp(row, prop, value, source);
	};

	var loadData = function(data) {
		return hot.loadData(data);
	};
	var getPlugin = function(pluginName) {
		return hot.getPlugin(pluginName);
	};
	var getInstance = function() {
		return hot.getInstance();
	};

	var disablePlugin = function() {
		var mcr = getPlugin('ManualColumnResize');
		var mrr = getPlugin('ManualRowResize');
		mcr.disablePlugin();
		mrr.disablePlugin();
	};
	var enablePlugin = function() {
		var mcr = getPlugin('ManualColumnResize');
		var mrr = getPlugin('ManualRowResize');
		mcr.enablePlugin();
		mrr.enablePlugin();
	};
	var updatePlugin = function() {
		var mcr = getPlugin('ManualColumnResize');
		var mrr = getPlugin('ManualRowResize');
		mcr.updatePlugin();
		mrr.updatePlugin();
	};

	var merge = function(startRow, startColumn, endRow, endColumn) {
		var mergeObj = getPlugin('MergeCells');
		mergeObj.merge(startRow, startColumn, endRow, endColumn);
		//mergeObj.updatePlugin();
	};
	var unMerge = function(startRow, startColumn, endRow, endColumn) {
		var mergeObj = getPlugin('MergeCells');
		mergeObj.unmerge(startRow, startColumn, endRow, endColumn);
		//mergeObj.updatePlugin();
	};
	var mergeSelection = function(cellRange) {
		var mergeObj = getPlugin('MergeCells');
		mergeObj.mergeSelection(cellRange);
	};
	var unMergeSelection = function() {
		var mergeObj = getPlugin('MergeCells');
		mergeObj.unmergeSelection();
	};
	var updateSettings = function(options) {
		return hot.updateSettings(options);
	};

	var getSettings = function() {
		return hot.getSettings();
	};
	var alert = function(action, index, amount, source, keepEmptyRows) {
		hot.alter(action, index, amount, source, keepEmptyRows);
	};


	function contextMenuCallback (key, options) {
        switch (key) {
            case 'alignment:left':
                scope.setAlignment('left');
                break;
            case 'alignment:center':
                scope.setAlignment('center');
                break;
            case 'alignment:right':
                scope.setAlignment('right');
                break;
            case 'alignment:top':
                scope.setAlignment('top');
                break;
            case 'alignment:middle':
                scope.setAlignment('middle');
                break;
            case 'alignment:bottom':
                scope.setAlignment('bottom');
                break;
            case 'hot:addFunction':
                scope.addFunction();
                break;
            case 'hot:addSysParameters':
                scope.addSysParameters();
                break;
            case 'hot:link':
                scope.addLink();
                break;
            case 'hot:removeLink':
                scope.removeLink();
                break;
            case 'copyStyle':
                scope.copyStyle();
                break;
            case 'pasteStyle':
                scope.pasteStyle();
                break;
            default:
                break;
        }
    }

	return {
		init : init,
		getHot : function() {
			return hot;
		},
		Methods : {
			countEmptyRows : countEmptyRows,
			countEmptyCols : countEmptyCols,
			countSourceCols : countSourceCols,
			countSourceRows : countSourceRows,
			countCols : countCols,
			countRows : countRows,
			getSelected : getSelected,
			getData : getData,
			getValue : getValue,
			getCellMeta : getCellMeta,
			getSourceDataAtCell : getSourceDataAtCell,
			getSourceData : getSourceData,
			getCell : getCell,
			getSelectedRange : getSelectedRange,
			getSelectedRangeLast : getSelectedRangeLast,
			getDataAtCell : getDataAtCell,
			setDataAtCell : setDataAtCell,
			setCellMeta : setCellMeta,
			setCellMetaObject : setCellMetaObject,
			loadData : loadData,
			render : render,
			updateSettings : updateSettings,
			getSettings : getSettings,
			merge : merge,
			unMerge : unMerge,
			mergeSelection : mergeSelection,
			unMergeSelection : unMergeSelection,
			getInstance : getInstance,
			alert : alert, //新增删除行列操作
			getColWidth : getColWidth,
			getRowHeight : getRowHeight,
			disablePlugin : disablePlugin,
			enablePlugin : enablePlugin,
			updatePlugin : updatePlugin,
			getCellMetaAtRow : getCellMetaAtRow,
			deselectCell : deselectCell,
			selectCell : selectCell,
			getPlugin : getPlugin
		}
	}
};