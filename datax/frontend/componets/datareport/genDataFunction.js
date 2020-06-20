//根据json生成表格及数据

//判断传入的jsonObject是否含有row和cell，也就是判断其是否为空
function hasRowAndCell(obj) {
    if (obj['maxRow'] >= 0 && obj['maxCol'] >= 0) {
        return true;
    } else {
        return false;
    }
}

//判断当前cell是否存在于mergeCells，即判断当前cell是否有合并单元格
function getObjFromMergeCells(mergeCells, rowIdx, colIdx) {
    if (typeof(mergeCells) == 'string') {
        mergeCells = JSON.parse(mergeCells);
    }
    var isInMergeCells = null;
    mergeCells.map(function (item, idx) {
        if (item['row'] == rowIdx && item['col'] == colIdx) {//如果当前cell是合并单元格
            isInMergeCells = item;
        }
    });
    return isInMergeCells;
}

//通过角标获取metaObj
function getMetaObjByIdx(jsonObj, rowIdx, colIdx) {
    if (jsonObj && jsonObj['coors']) {
        for (ix in jsonObj['coors']) {
            if (jsonObj['coors'][ix]['coors'] == (rowIdx + '-' + colIdx)) {//通过角标查找metaObj并返回
                return jsonObj['coors'][ix];
            }
        }
    } else {
        return null;
    }
    return null;//如果没找到就返回空
}

//转换字符串，将连写的单词分开并添加中划线，例如backgroundColor转为background-color，尽可能少的使用变量，这个是在递归的循环里
function transFormWords(keyStr) {
    if (keyStr && keyStr.trim() != '') {
        try {
            if (keyStr.match(/[A-Z]/g) && keyStr.match(/[A-Z]/g).length > 0) {
                keyStr.match(/[A-Z]/g).map(function (item) {
                    keyStr = keyStr.replace(keyStr[keyStr.indexOf(item)], '-' + keyStr[keyStr.indexOf(item)].toLowerCase())
                })
            }
        } catch (e) {
            console.log('--transFormWords error!=', e);
        }
    }
    return keyStr;
}

//从cellObj里获取style样式，使用的ng-style方便使用样式名称verticalAlign、fontSize等
function getStyleFromCellObj(cellObj) {
    var styles = [];
    if (cellObj && JSON.stringify(cellObj) != "{}") {
        if (cellObj['colwidth'] && cellObj['height']) {
            // styles['width'] = cellObj['colwidth'] + 'px;';
            // styles['height'] = cellObj['height'] + 'px;';
            styles.push("width:" + cellObj['colwidth'] + 'px');
            styles.push("height:" + cellObj['height'] + 'px');
        }
        if (cellObj['style']) {
            for (var key in cellObj['style']) {
                if (!isNaN(cellObj['style'][key])) {//如果是字符串就不加px
                    // styles[transFormWords(key)] = cellObj['style'][key] + 'px;';
                    styles.push(transFormWords(key) + ':' + cellObj['style'][key] + 'px');
                } else {
                    // styles[transFormWords(key)] = cellObj['style'][key] + ';';
                    styles.push(transFormWords(key) + ':' + cellObj['style'][key]);
                }
            }
        }
    }
    styles = styles.join(';');
    // console.log('---styles=',styles);
    return {
        template: '<div class="ag-cell-label-container" style="' + styles + '" role="presentation">' +
            '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
            '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
            '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order" ></span>' +
            '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon" ></span>' +
            '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon" ></span>' +
            '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon" ></span>' +
            '    <span ref="eText" class="ag-header-cell-text" role="columnheader"></span>' +
            '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
            '  </div>' +
            '</div>'
    }
}

//从cell的obj里获取treeNode并返回
function getTreeNodeFromJsonCell(cellObj, metaObj) {
    if (!cellObj) return {};//判空
    var treeNode = {};
    if (cellObj['editType'] && cellObj['editType']['name']) {//从editType里获取名字
        treeNode['headerName'] = cellObj['editType']['name'];
    } else {
        //获取headName，需要去掉前面的"="号
        treeNode['headerName'] = cellObj['value'].startsWith('=') ? cellObj['value'].substring(1, cellObj['value'].length) : cellObj['value'];
    }
    //如果不是父节点则需要其他信息，例如字段信息
    if (metaObj && JSON.stringify(metaObj) != "{}" && metaObj['meta'] &&
        metaObj['meta']['cellDataSource'] && metaObj['meta']['cellDataSource']['col']) {
        treeNode['field'] = metaObj['meta']['cellDataSource']['col'];
        treeNode['editable'] = true;
        treeNode['filter'] = true;//可以过滤
        treeNode['sortable'] = true;//排序
        treeNode['width'] = 150;//宽度


        if (treeNode['field'].indexOf('year') != -1) {
            // treeNode['cellRenderer'] = 'yearCellRender';
            treeNode['cellEditor'] = 'agSelectCellEditor';//最好不用使用agSelectCellEditor，因为下拉列表可能有大量数据
            treeNode['cellEditorParams'] = {
                values: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
                cellRenderer: 'yearCellRender',
            };
            treeNode['clearButton'] = true;
            treeNode['filter'] = 'agDateColumnFilter';//可以过滤日期
            treeNode['filterParams'] = {//日期过滤，需要两个参数
                comparator: function (filterLocalDateAtMidnight, cellValue) {
                    var dateAsString = cellValue;
                    if (dateAsString == null) return -1;
                    var dateParts = dateAsString.split("/");
                    var cellDate = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]));
                    if (filterLocalDateAtMidnight.getTime() == cellDate.getTime()) {
                        return 0
                    }
                    if (cellDate < filterLocalDateAtMidnight) {
                        return -1;
                    }
                    if (cellDate > filterLocalDateAtMidnight) {
                        return 1;
                    }
                },
                browserDatePicker: true
            }
            treeNode['pinned'] = 'left';
        }
        if (treeNode['field'].indexOf('d') != -1) {
            treeNode['cellEditor'] = 'datePicker';
        }
        if (treeNode['field'].indexOf('licence') != -1) {
            treeNode['cellEditor'] = 'agLargeTextCellEditor';//大型输入框
        }
        if (treeNode['field'].indexOf('assessment_requirement') != -1) {
            treeNode['filter'] = 'agNumberColumnFilter';//数字过滤
        }



        // treeNode['cellEditorSelector'] = function (param){
        //     console.log('--param=',param);
        // };//编辑框输入时回调函数，可以做成下拉列表

    } else {
        treeNode['field'] = '';
    }
    if (!metaObj || metaObj == {} || treeNode['field'] == '') {
        delete treeNode['field'];
        treeNode['children'] = [];
        return treeNode;//如果是父节点，父节点不需要有其他字典信息
    }
    // treeNode['pinned'] = 'left';//固定某些列,这些列不可以滚动

    // treeNode['headerComponentParams'] = getStyleFromCellObj(cellObj);//暂时不要样式,样式已经能正常使用但还需要微调
    return treeNode;
}

//当前cell如果是合并cell，则需要知道其子cell的循环角标，这里不能是0,1,2...这样，因为子cell也可能是合并cell，必须找到角标的跳
function getChildCellJump(mergeCells, currMergeCell, rowIdx, colIdx) {
    if (!currMergeCell || currMergeCell == {}) return [];
    var childJumpIdx = [0];//需要对第0号角标执行方法
    var currMergCellCnt = parseInt(currMergeCell['colspan']);
    if (mergeCells && mergeCells.length > 0 && currMergeCell && JSON.stringify(currMergeCell) != "{}") {//如果不为空就进来
        for (var ix = colIdx; ix < (colIdx + currMergCellCnt);) {
            var childMergeCellObj = getObjFromMergeCells(mergeCells, rowIdx, ix);
            if (childMergeCellObj && childMergeCellObj['colspan']) {//如果有mergecell，将mergecell所merge的colspan个数加到循环遍历中去往前跳
                ix += childMergeCellObj['colspan'];
                childJumpIdx.push(parseInt(childMergeCellObj['colspan']));
            } else {
                ix += 1;
                if (ix < (colIdx + currMergCellCnt)) {//这句必须要，因为for循环判断在后
                    childJumpIdx.push(1);
                }
            }
        }
    }
    return childJumpIdx;
}

//通过jsonObj来生成表格的表头，这里需要用到递归（因为有无限个表头的可能）
//需要先判断第一行第一个cell的子节点chid1，再判断child1的子节点child1-1，\
// 再判断child1-1的子节点child1-1-1，一直持续下去
function generalColumnDefsByJsonObj(jsonObj, rowIdx, colIdx) {
    if (!jsonObj['maxRow'] || jsonObj['maxRow'] < rowIdx || !jsonObj['maxCol'] || jsonObj['maxCol'] < colIdx) {
        return [];//如果遍历的节点为空，返回空数组
    }
    //获取当前metaObj
    var metaObj = getMetaObjByIdx(jsonObj, rowIdx, colIdx);
    var currNode = getTreeNodeFromJsonCell(jsonObj['row'][rowIdx]['col'][colIdx], metaObj);
    // console.log('----currNode=',currNode);
    var currMergeCellInfo = getObjFromMergeCells(jsonObj['mergeCells'], rowIdx, colIdx);
    //执行递归检索子合并单元格
    if (jsonObj['maxRow'] >= rowIdx + 1) {
        if (currMergeCellInfo) {
            var childCellJump = getChildCellJump(jsonObj['mergeCells'], currMergeCellInfo, rowIdx + 1, colIdx);
            // console.log('childCellJump=',childCellJump);
            var childCelllCurrJumpIdx = colIdx;
            for (ix in childCellJump) {//对其子节点进行跳动循环
                childCelllCurrJumpIdx += childCellJump[ix];
                currNode['children'].push(generalColumnDefsByJsonObj(jsonObj, rowIdx + 1, childCelllCurrJumpIdx));
            }
        } else {
            currNode['children'].push(generalColumnDefsByJsonObj(jsonObj, rowIdx + 1, colIdx));
        }
    }
    return currNode;
}

//查找第一行，获取for循环的跳动间隔
function getFirstRowJump(jsonObj) {
    var firstRowJump = [0];
    var maxCol = parseInt(jsonObj['maxCol']);
    for (var ix = 0; ix <= maxCol;) {
        var mergeCellObj = getObjFromMergeCells(jsonObj['mergeCells'], 0, ix);
        if (mergeCellObj && mergeCellObj['colspan']) {//如果有mergecell，将mergecell所merge的colspan个数加到循环遍历中去往前跳
            ix += mergeCellObj['colspan'];
            firstRowJump.push(parseInt(mergeCellObj['colspan']));//保存跳动间隔
        } else {
            ix += 1;
            if (ix <= maxCol) {//这一步必须要，因为for判断在后
                firstRowJump.push(1);
            }
        }
    }
    return firstRowJump;
}

//从传入的jsonObj里生成表格需要的json，
function genTableFromJsonObject(jsonObj) {
    if (typeof(jsonObj) == 'string') {
        jsonObj = JSON.parse(jsonObj);
    }
    var tableHeadJson = [];
    if (hasRowAndCell(jsonObj)) {
        var firstRowJumpSplit = getFirstRowJump(jsonObj);
        var jumpIdx = 0;
        for (ix in firstRowJumpSplit) {
            jumpIdx = jumpIdx + firstRowJumpSplit[ix];
            if (ix == firstRowJumpSplit.length - 1 && firstRowJumpSplit[ix] > 1) break;//这是最后一个，如果最后一个cell是合并项，则不进行最后一次循环（合并项都是循环第一个cell）
            tableHeadJson.push(generalColumnDefsByJsonObj(jsonObj, 0, jumpIdx));
        }
    } else {
        console.log('alert!!!the jsonObj is empty or error!');
    }
    return tableHeadJson;
}