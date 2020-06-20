// config 过滤器对象
// configitems 场景中的组件+过滤器集合
// dateFilter 过滤器的值
/* #region  执行过滤 */
function startFilter(config, configitems, filterData) {
    // 筛选出需要过滤的图表
    var chartids = '';
    if (config.data && config.data.configs && config.data.configs.charts &&
        config.data.configs.charts.length > 0) {
        config.data.configs.charts.forEach(function (item) {
            chartids = ',' + chartids + item.data.id;
        });
    }
    if (chartids.length > 1) {
        configitems.forEach(function (item, index) {
            // 筛选出过滤器中配置的图表
            if ((item.data.datatype == 'chart' || item.data.datatype == 'table') && chartids.indexOf(item.data.id) > 0) {
                var componentType = item.data.datatype;
                // 获取该图表关联的olapid
                var olapid = '';
                if (componentType == 'chart') {
                    var datasetObj = JSON.parse(item.data.datasetstring);
                    olapid = datasetObj['id'];
                } else if (componentType == 'table') {
                    olapid = item.data.jsonconfig.olapid;
                }

                // 筛选过滤器中配置的olap
                if (config.data.configs.olapCols && config.data.configs.olapCols.length > 0) {
                    for (var i = 0; i < config.data.configs.olapCols.length; i++) {
                        var olapCol = config.data.configs.olapCols[i];
                        if (olapCol.id == olapid) {
                            var url = '';
                            var tempUrl = '';
                            if (componentType == 'chart') {
                                var echartConfigObj = JSON.parse(item.data.echartconfig);
                                url = echartConfigObj.data.url;
                                tempUrl = echartConfigObj.data.url;
                            } else if (componentType == 'table') {
                                var tableConfig = angular.copy(item.data.jsonconfig);
                                url = tableConfig.data.url;
                                tempUrl = tableConfig.data.url;
                            }
                            var connectionSymbol = '&';
                            if (config.data.dropType == 'select') {
                                var filterName = olapCol.selected + '(_)in';
                                url = cycleDelUrlArg(url, filterName);
                                if (url.indexOf('?') == -1) {
                                    connectionSymbol = '?'
                                }
                                if (filterData && filterData.length > 0) {
                                    url = url + connectionSymbol + filterName + '=' + filterData;
                                }
                            } else if (config.data.dropType == 'date') {
                                var filterName1 = olapCol.selected + '(_)b_equal';
                                var filterName2 = olapCol.selected + '(_)s_equal';
                                url = cycleDelUrlArg(url, filterName1);
                                url = cycleDelUrlArg(url, filterName2);
                                if (url.indexOf('?') == -1) {
                                    connectionSymbol = '?'
                                }
                                if (filterData.startDate && filterData.endDate) {
                                    var tempStartDate = dateFtt('yyyy-MM-dd', filterData.startDate) + ' 00:00:00';
                                    var tempEndDate = dateFtt('yyyy-MM-dd', filterData.endDate) + ' 23:59:59';
                                    url = url + connectionSymbol + filterName1 + '=' + tempStartDate + '&' + filterName2 + '=' + tempEndDate;
                                }
                            } else if (config.data.dropType == 'text') {
                                var filterName = olapCol.selected;
                                var filterWay = filterData.filterWay;
                                var filterWays = ['(_)equal', '(_)like', '(_)b', '(_)s', '(_)b_equal', '(_)s_equal', '(_)in']
                                filterWays.forEach(function (val) {
                                    url = cycleDelUrlArg(url, filterName + val);
                                });
                                if (url.indexOf('?') == -1) {
                                    connectionSymbol = '?'
                                }
                                if (filterData.data && filterData.data.length > 0) {
                                    url = url + connectionSymbol + filterName + '(_)' + filterWay + '=' + filterData.data;
                                }
                            }
                            if (tempUrl != url || tempUrl + '?' != url) {
                                if (componentType == 'chart') {
                                    echartConfigObj.data.url = url;
                                    item.data.echartconfig = JSON.stringify(echartConfigObj);
                                    item['data']['refreshCount'] = item['data']['refreshCount'] + 1;
                                } else if (componentType == 'table') {
                                    if (typeof item['data']['refreshCount'] == 'number') {
                                        item['data']['refreshCount'] = item['data']['refreshCount'] + 1;
                                    }
                                    item.data.jsonconfig.data.url = url;
                                }
                            }
                            break;
                        }
                    }
                }
            }
        });
    }
}
/* #endregion */

/* #region  在将后台取出的json传到dashboard之前的一些处理 */
/**
 * 1、根据过滤器的默认值修改组件的url
 */
function updateConfigItemsBeforeInitDashboard(_tempConfigItems) {
    _tempConfigItems.forEach(function (value) {
        var itemType = value.data.dropType ? value.data.dropType : value.data.datatype;
        /** */
        if (!value.data.itemConfigs) {
            value.data.itemConfigs = {}
        } else {
            if (value.data.itemConfigs.customUrlSwitch && value.data.itemConfigs.customUrl && value.data.itemConfigs.customUrl.length > 1) {
                if (',table,'.indexOf(itemType) > 0) {
                    value.data.jsonconfig.data.url = value.data.itemConfigs.customUrl
                    value.data.originUrl = value.data.itemConfigs.customUrl
                }
            }
        }
        if (',table,'.indexOf(itemType) > 0) {
            var tempColumninfos = value.data.jsonconfig.theads[value.data.jsonconfig.theads.length-1].rows
            value.data.jsonconfig.theads[value.data.jsonconfig.theads.length-1].rows = tempColumninfos.filter(function(value) {
                if (isNull(value.hidecondition)) {
                    return true;
                } else {
                    if (eval(value.hidecondition)) {
                        return false;
                    } else {
                        return true;
                    }
                }
            })
        }
        /** 将过滤条件中配置的默认值设置进各个图表或table组件 */
        if (', select, text, date'.indexOf(itemType) > 0 
            && (isNotNull(value.data.defaultVal) 
            || isNotNull(value.data.defaultValText))) {
                var tempFilterText = ''
                if (isNotNull(value.data.defaultVal)) {
                    tempFilterText = value.data.defaultVal
                } else {
                    tempFilterText = value.data.defaultValText
                }
            var _filterData = ''
            if (itemType == 'text') {
                _filterData = {
                    'filterWay': value.data.textFilterWay || 'equal',
                    'data': isNotNull(value.data.defaultVal)?value.data.defaultVal:value.data.defaultValText
                }
            } else if (itemType == 'select') {
                if (isNotNull(value.data.defaultVal)) {
                    value.data.defaultVal.forEach(function (_element) {
                        _filterData = _filterData + '' + _element.id + ',';
                    });
                    if (_filterData.length > 1) {
                        _filterData = _filterData.substring(0, _filterData.length - 1);
                        value.data.val = _filterData
                    } else {
                        _filterData = '';
                    }
                }
                
                if (isNotNull(value.data.defaultValText)) {
                    _filterData = value.data.defaultValText
                }
            } else if (itemType == 'date') {
                _filterData = {
                    'startDate': value.data.defaultVal[0],
                    'endDate': value.data.defaultVal[1]
                }
            }
            startFilter(value, _tempConfigItems, _filterData)
        }
    })
}

/* #endregion */

function loadExJsAndCss(config) {
    if (config.loadExJs && isNotNull(config.exJs)) {
        var jss = config.exJs.split(',')
        jss.forEach(function(_jsUrl) {
            var domScript = document.createElement('script');
            domScript.src = _jsUrl;
            document.body.appendChild(domScript);
        })
    }
}

// 获取URL中的参数 并放入组件的URL中
// item:当前组件对象
// itemType:table or chart
function setUrlParametersToComponent(item, itemType) {
    if (urlArgs.length > 1) {
        if (itemType == 'table') {
            var url = item.data.jsonconfig.data.url;
            if (url.split('?').length == 2) {
                url = url + '&'
            } else {
                url = url + '?'
            }
            item['data']['jsonconfig']['data']['url'] = url + urlArgs;
            //url = addArgToUrl(url, value, urlParameters[value]);

        } else if (itemType == 'chart') {
            var echartsconfig = JSON.parse(item.data.echartconfig);
            var url = echartsconfig.data.url;
            if (url.split('?').length == 2) {
                url = url + '&'
            } else {
                url = url + '?'
            }
            // url = addArgToUrl(url, value, urlParameters[value]);
            echartsconfig['data']['url'] = url + urlArgs;
            item.data.echartconfig = JSON.stringify(echartsconfig);
        }
    }
    // (Object.keys(urlParameters)).forEach(function (value, index, array) {
    //     console.log('setUrlParametersToComponent')
    //     console.log(urlParameters)
    //     console.log(value)
    //     if (value != 'scenesId') {
    //         if (value.indexOf('(_)equal') == -1) {
    //             value = value + '(_)equal'
    //         }
    //         if (itemType == 'table') {
    //             var url = item.data.jsonconfig.data.url;
    //             url = addArgToUrl(url, value, urlParameters[value]);
    //             item['data']['jsonconfig']['data']['url'] = url;
    //         } else if (itemType == 'chart') {
    //             var echartsconfig = JSON.parse(item.data.echartconfig);
    //             var url = echartsconfig.data.url;
    //             url = addArgToUrl(url, value, urlParameters[value]);
    //             echartsconfig['data']['url'] = url;
    //             item.data.echartconfig = JSON.stringify(echartsconfig);
    //         }
    //     }
    // })
}

// 拼接场景中所有组件+对应olap信息数组
function spliceChartsOlapInfo(_chartType, _chartObj, _olaps, _colsObjs) {
    var __chartOlapInfo = (_chartType == 'chart') ? JSON.parse(_chartObj.data.datasetstring) : {
        'id': _chartObj.data.jsonconfig.olapid
    }
    var __obj = {
        'chart': {
            'id': _chartObj.data.id,
            'name': _chartObj.data.name,
            'kind': _chartObj.data.kind,
            'datatype': _chartObj.data.datatype,
            'charttype': _chartObj.data.echarts,
            'check': false,
            'olapInfo': __chartOlapInfo,
        },
        'olap': {
            'info': {},
            'col': {}
        }
    }
    for (var i = 0; i < _olaps.length; i++) {
        if (_olaps[i].id == __chartOlapInfo.id) {
            __obj['olap']['info'] = _olaps[i];
            break;
        }
    }
    for (var i = 0; i < _colsObjs.length; i++) {
        if (_colsObjs[i].id == __chartOlapInfo.id) {
            __obj['olap']['col'] = _colsObjs[i];
            break;
        }
    }
    return __obj;
}

function findItemById(id, items) {
    var index = -1;
    for (var i = 0; i < items.length; i++) {
        if (items[i].data.id == id) {
            index = i;
            break;
        }
    }
    return index;
}

// 清除当前组件的联动状态
function releaseSingleLink(currentItem, allItems) {
    var _myChart = echarts.getInstanceByDom(document.getElementById(currentItem.id));
    _myChart.setOption(_myChart.getOption());
    // 清除联动标记
    currentItem.link = 'linkEnd';
    currentItem.events.relationInfo.forEach(function (item) {
        for (var i = 0; i < allItems.length; i++) {
            if (allItems[i].data.id && (allItems[i].data.id == item.chart)) {
                var _flag = false;
                if (allItems[i].data.datatype == 'table') {
                    allItems[i].data.jsonconfig.data.url = cycleDelUrlArg(allItems[i].data.jsonconfig.data.url, item.olapCol + '(_)equal');
                    _flag = true;
                } else if (allItems[i].data.datatype == 'chart') {
                    var _echartconfigObj = JSON.parse(allItems[i].data.echartconfig);
                    _echartconfigObj.data.url = cycleDelUrlArg(_echartconfigObj.data.url, item.olapCol + '(_)equal');
                    allItems[i].data.echartconfig = JSON.stringify(_echartconfigObj);
                    _flag = true;
                }
                if (_flag) {
                    allItems[i].data.refreshCount += 1;
                    break;
                }
            }
        }
    });
}

// 更新图表组件的字体颜色
function updateChartFontColor(chartType, chartOption, fontColor) {
    if (chartType === 'echarts') {
        if (chartOption.title) {
            if (chartOption.title.textStyle) {
                chartOption.title.textStyle['color'] = fontColor;
            } else if (chartOption.title[0] && chartOption.title[0].textStyle) {
                chartOption.title[0].textStyle['color'] = fontColor;
            } else {
                chartOption.title.textStyle = {
                    'color': fontColor
                }
            }

            if (chartOption.title.subtextStyle) {
                chartOption.title.subtextStyle['color'] = fontColor;
            } else if (chartOption.title[0] && chartOption.title[0].subtextStyle) {
                chartOption.title[0].subtextStyle['color'] = fontColor;
            } else {
                chartOption.title.subtextStyle = {
                    'color': fontColor
                }
            }

        }
        if (chartOption.legend) {
            if (chartOption.legend.textStyle) {
                chartOption.legend.textStyle['color'] = fontColor;
            } else if (chartOption.legend[0] && chartOption.legend[0].textStyle) {
                chartOption.legend[0].textStyle['color'] = fontColor;
            } else {
                chartOption.legend.textStyle = {
                    'color': fontColor
                }
            }
        }
        if (chartOption.axisLabel) {
            chartOption['axisLabel']['color'] = fontColor;
        } else {
            chartOption['axisLabel'] = {
                'color': fontColor
            }
        }
    } else if (chartType === 'single') {
        chartOption.field.y.forEach(function (item) {
            if (',red,green'.indexOf(item._valueColor) === -1) {
                item._valueColor = fontColor
            }
            if (',red,green'.indexOf(item._titleColor) === -1) {
                item._titleColor = fontColor
            }
        })

    }
}

var wangE, editor

function initTextEditor() {
    wangE = window.wangEditor
    editor = new wangE('#textEditorContent')
    editor.customConfig.menus = [
        'head', // 标题
        'bold', // 粗体
        'fontSize', // 字号
        'fontName', // 字体
        'italic', // 斜体
        'underline', // 下划线
        'strikeThrough', // 删除线
        'foreColor', // 文字颜色
        'backColor', // 背景颜色
        'link', // 插入链接
        'list', // 列表
        'justify', // 对齐方式
        'quote', // 引用
        'image', // 插入图片
        'table', // 表格
        'video', // 插入视频
        'code', // 插入代码
        'undo', // 撤销
        'redo' // 重复
    ]

    editor.customConfig.uploadImgHooks = {
        before: function (xhr, editor, files) {
            // 图片上传之前触发
            // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象，files 是选择的图片文件
            xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            // console.log(xhr)
            // console.log(editor)
            // console.log(files)
            // 如果返回的结果是 {prevent: true, msg: 'xxxx'} 则表示用户放弃上传
            // return {
            //     prevent: true,
            //     msg: '放弃上传'
            // }
        },
        success: function (xhr, editor, result) {
            // 图片上传并返回结果，图片插入成功之后触发
            // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象，result 是服务器端返回的结果
        },
        fail: function (xhr, editor, result) {
            // console.log(result)
            // 图片上传并返回结果，但图片插入错误时触发
            // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象，result 是服务器端返回的结果
        },
        error: function (xhr, editor) {
            // console.log(xhr)
            // 图片上传出错时触发
            // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象
        },
        timeout: function (xhr, editor) {
            // console.log(xhr)
            // 图片上传超时时触发
            // xhr 是 XMLHttpRequst 对象，editor 是编辑器对象
        },

        // 如果服务器端返回的不是 {errno:0, data: [...]} 这种格式，可使用该配置
        // （但是，服务器端返回的必须是一个 JSON 格式字符串！！！否则会报错）
        customInsert: function (insertImg, result, editor) {
            // console.log(result)
            // 图片上传并返回结果，自定义插入图片的事件（而不是编辑器自动插入图片！！！）
            // insertImg 是插入图片的函数，editor 是编辑器对象，result 是服务器端返回的结果

            // 举例：假如上传图片成功后，服务器端返回的是 {url:'....'} 这种格式，即可这样插入图片：
            result.data.forEach(function (item) {
                var url = item.url
                insertImg(url);
            })


            // result 必须是一个 JSON 格式字符串！！！否则报错
        }
    }
    editor.customConfig.uploadImgServer = '/api/dash/uploadMultiplePic'
    // 或者 var editor = new E( document.getElementById('editor') )
    editor.create()
}

//复制图表数据并删除前端缓存,替换URL位原始的URL
function copyChartItem(item) {
    var echartconfig = JSON.parse(item['data']['echartconfig']);
    echartconfig['data']['url'] = item['data']['originUrl'];
    var tempObj = {
        'col': item['col'],
        'row': item['row'],
        'sizeX': item['sizeX'],
        'sizeY': item['sizeY'],
        'freelayout': item['freelayout'],
        'left': item['left'],
        'top': item['top'],
        'screenWidth': item['screenWidth'],
        'data': {
            'mbConfig': item['data']['mbConfig'],
            'allowusers': nullToStr(item['data']['allowusers']),
            'charttype': nullToStr(item['data']['charttype']),
            'check': nullToStr(item['data']['check']),
            'createname': nullToStr(item['data']['createname']),
            'createtime': nullToStr(item['data']['createtime']),
            'datasetstring': nullToStr(item['data']['datasetstring']),
            'datatype': nullToStr(item['data']['datatype']),
            'echartconfig': JSON.stringify(echartconfig),
            'filterstring': nullToStr(item['data']['filterstring']),
            'id': nullToStr(item['data']['id']),
            'imgpath': nullToStr(item['data']['imgpath']),
            'jsonconfig': nullToStr(item['data']['jsonconfig']),
            'keywords': nullToStr(item['data']['keywords']),
            'kind': nullToStr(item['data']['kind']),
            'lists': [],
            'name': nullToStr(item['data']['name']),
            'refreshspeed': nullToNum(item['data']['refreshspeed']),
            'remark': nullToStr(item['data']['remark']),
            'originUrl': nullToStr(item['data']['originUrl']),
            'labelText': nullToStr(item['data']['labelText']),
            'styleConfig': item.data.styleConfig,
            'chartHeight': nullToStr(item['data']['chartHeight']),
            'chartWidth': nullToStr(item['data']['chartWidth']),
            'itemConfigs': item['data']['itemConfigs'],
            'refreshCount': 0,
            'events': item.data.events,
            'link': '',
            'commentsConfig': item.data.commentsConfig
        }
    };
    return tempObj;
};

//复制图表数据并删除前端缓存
function copyFilterItem(item) {
    var tempObj = {
        'col': item['col'],
        'row': item['row'],
        'sizeX': item['sizeX'],
        'sizeY': item['sizeY'],
        'freelayout': item['freelayout'],
        'left': item['left'],
        'top': item['top'],
        'screenWidth': item['screenWidth'],
        'data': {
            'id': item.data.id,
            'mbConfig': item['data']['mbConfig'],
            'configs': item['data']['configs'],
            'defaultVal': item['data']['defaultVal'],
            'defaultValName': nullToStr(item['data']['defaultValName']),
            'defaultValText': nullToStr(item['data']['defaultValText']),
            'dropType': nullToStr(item['data']['dropType']),
            'textFilterWay': nullToStr(item['data']['textFilterWay']),
            'filterDatas': [],
            'filterName': nullToStr(item['data']['filterName']),
            'multipleSelect': item['data']['multipleSelect'] ? item['data']['multipleSelect'] : true,
            'sizeX': nullToStr(item['data']['sizeX']),
            'sizeY': nullToStr(item['data']['sizeY']),
            'val': (typeof item['data']['val'] == 'string') ? '' : [],
            'multipleSelect': item['data']['multipleSelect'] ? item['data']['multipleSelect'] : false,
            'refreshCount': 0,
            'itemConfigs': item['data']['itemConfigs'],
            'styleConfig': item.data.styleConfig,
            'commentsConfig': item.data.commentsConfig,
            'customCode': item.data.customCode ? item.data.customCode : {
                enabled: false,
                beforeValueChangeCode: '',
                afterValueChangeCode: ''
            },
        }
    };
    return tempObj;
};

function quickSave(obj, objType, saveType, updateType) {
    var isSave = false;
    var tempObj = {}
    if (saveType == 'singleItem') {
        if (objType == 'echarts') {
            tempObj = copyChartItem(obj);
        } else if (objType == 'table') {
            tempObj = angular.copy(obj)
            tempObj['data']['jsonconfig']['data']['url'] = obj.data.originUrl;
        } else {
            return;
        }
        isSave = true;
    }
    if (isSave) {
        var sceneId = '';
        if (currentSceneId.length > 0) {
            sceneId = currentSceneId;
        }
        axios({
            url: '/api/dash/quickSave',
            method: 'post',
            data: {
                'sceneId': sceneId,
                'objStr': JSON.stringify(tempObj),
                'saveType': saveType
            }
        }).then(function (rs) {
            if (rs.status == 'success') {
                if (updateType == 'comments') {
                    // console.log(rs);
                    //obj.data.commentsConfig.comments = rs.data.data.commentsConfig.comments;
                }
            } else {
                alert('保存失败!');
            }
        });
    }
}

function barragerConfig(item) {
    var commentsLength = item.data.commentsConfig.comments.length
    var chartId = item.data.id
    if (item.data.commentsConfig.barrage && commentsLength > 0) {
        if (item.data.commentsConfig.barragerCount >= commentsLength) {
            item.data.commentsConfig.barragerCount = 0
        }
        var texts = item.data.commentsConfig.comments[item.data.commentsConfig.barragerCount].text
        $('#' + chartId).barrager({
            img: '', //图片
            info: texts, //文字
            href: '', //链接
            close: false, //显示关闭按钮
            speed: 6, //延迟,单位秒,默认6
            //bottom: 70, //距离底部高度,单位px,默认随机
            color: '#fff', //颜色,默认白色
            old_ie_color: '#000000', //ie低版兼容色,不能与网页背景相同,默认黑色
        });
        item.data.commentsConfig.barragerCount += 1;
        setTimeout(function () {
            barragerConfig(item);
        }, 2000)
    }
}

// 判断该主题、场景是否已经被收藏及修改对应标签样式
function initItemConnection(id, type, domClass) {
    axios({
        method: 'post',
        url: "/api/dash/getUserCollection",
        data: {
            'collectType': type
        }
    }).then(function (rs) {
        if (rs.status == 'success') {
            var _collections = rs.collections
            for (var _i = 0; _i < _collections.length; _i++) {
                if (_collections[_i].collect_id == id) {
                    $('.' + domClass).removeClass('fa-star-o')
                    $('.' + domClass).addClass('fa-star')
                    break
                }
            }
        }
    })
}

var tableColResizeElementStr = "<div class=\"table-col-resize-content\" style=\"_style_\">" +
    "<div class=\"table-col-resize-wrapper\">" +
    "<md-slider-container ng-repeat=\"fixWidth in config.data.jsonconfig.fixColWidths track by $index\">" +
    "<md-slider min=\"-155\" max=\"255\" ng-model=\"fixWidth\" ng-change=\"fixColWidth(fixWidth, $index)\" class=\"md-warn\">" +
    "</md-slider>" +
    "</md-slider-container>" +
    "</div>" +
    "</div>"

var dropOptionHtmlStr = "<div class=\"drop-option\" style=\"_style_\">" +
    "<div class=\"option-row\" ng-click=\"linkagePanel()\" ng-if=\"config.data.datatype && config.data.datatype == 'chart'\"><div class=\"component-link-option\"></div><div>联动配置</div></div>" +
    "<div class=\"option-row\" ng-click=\"filterPanel()\" ng-if=\"dropType=='select' || dropType=='date' || dropType=='text'\"><div class=\"component-base-option\"></div><div>基础配置</div></div>" +
    "<div class=\"option-row\" ng-click=\"showStyleConfig()\"><div class=\"component-style-option\"></div><div>功能配置</div></div>" +
    "<div class=\"option-row\" ng-click=\"openTextEditor()\" ng-if=\"dropType=='labelBox'\"><div class=\"component-text-option\"></div><div>组件配置</div></div>" +
    "<div class=\"option-row\" ng-click=\"updateComponent()\" ng-if=\"config.data.datatype && config.data.datatype == 'chart'\"><div class=\"component-base-option\"></div><div>编辑组件</div></div>" +
    "<div class=\"option-row\" ng-click=\"resizeCol($event)\" ng-if=\"config.data.datatype && config.data.datatype == 'table'\"><div class=\"component-base-option\"></div><div>自定列宽</div></div>" +
    "<div class=\"option-row\" ng-click=\"removeComponent()\"><div class=\"component-remove-option\"></div><div>移除组件</div></div>" +
    "<div class=\"option-row\" ng-click=\"config.freelayout=config.freelayout===1?0:1;closeDropOption()\"><i style=\"font-size:10px\" class=\"fa fa-circle-o\" ng-if=\"config.freelayout!==1\"></i><i style=\"font-size:10px\" class=\"fa fa-check-circle-o\" ng-if=\"config.freelayout===1\"></i>&nbsp;<div>自由布局</div></div></div>";

var chartLabelHtmlStr = "<div class=\"chart-label-text\" style=\"_style_\" ng-style=\"config.data.commentsConfig.style.total\">" +
    "    <div class=\"show-area\" id=\"{{ config.data.id }}Comments\">" +
    "        <div class=\"reply-texts\" ng-style=\"config.data.commentsConfig.style.commentsSection\"" +
    "          ng-repeat=\"comment in config.data.commentsConfig.comments\" ng-if=\"comment.show\">" +
    "            <div class=\"comments-area-header\">" +
    "                <div class=\"header-name\" ng-style=\"config.data.commentsConfig.style.name\">{{ comment.user }}</div>" +
    "                <div class=\"header-time\" ng-style=\"config.data.commentsConfig.style.time\">{{ comment.date | calcTime }}</div>" +
    "            </div>" +
    "            <div class=\"comments-area-content\">" +
    "                <input type=\"text\" ng-if=\"comment.status == 'inEdit'\" ng-model=\"comment.text\" ng-keypress=\"postReplayByKey($event, 'update', comment)\">" +
    "                <div class=\"comments-text\" title=\"{{ comment.text }}\" ng-if=\"comment.status == 'edit'\" ng-style=\"config.data.commentsConfig.style.text\" ng-dblclick=\"comment.status = 'inEdit'\">{{ comment.text }}</div>" +
    "                <i class=\"fa fa-edit comments-btn\" ng-if=\"loginUserName == comment.user && loginUserName != 'AnonymousUsers'\" " +
    "                ng-style=\"config.data.commentsConfig.style.editBtn\" ng-class=\"{'hover-show':true}\" ng-click=\"comment.status = 'inEdit'\"></i>" +
    "                <i class=\"fa fa-trash-o comments-btn\" ng-if=\"loginUserName == comment.user && loginUserName != 'AnonymousUsers'\" " +
    "                ng-style=\"config.data.commentsConfig.style.editBtn\" ng-class=\"{'hover-show':true}\" ng-click=\"comment.status = 'delete';updateCommentsFromServer();\"></i>" +
    "            </div>" +
    "        </div>" +
    "        <div class=\"reply-texts\" ng-if=\"!isExpandComments && config.data.commentsConfig.comments.length > 3\" ng-click=\"expandComments()\" ng-style=\"config.data.commentsConfig.style.more\">" +
    "            显示更多评论..." +
    "        </div>" +
    "    </div>" +
    "    <div class=\"reply-area\" ng-style=\"config.data.commentsConfig.style.replayBtn\">" +
    "        <div class=\"reply-show-edit\" ng-click=\"startChartReply()\">" +
    "            &nbsp;<i class=\"fa fa-edit\"></i>&nbsp;评论" +
    "        </div>" +
    "        开启评论弹幕&nbsp;<input type=\"checkbox\" style=\"width: 20px;\" ng-model=\"config.data.commentsConfig.barrage\" ng-change=\"openBarrage()\"/>" +
    "        <div class=\"reply-edit-area\">" +
    "            <input type=\"text\" placeholder=\"可回车键发送\" ng-model=\"replayText\" ng-style=\"config.data.commentsConfig.style.text\"ng-keypress=\"postReplayByKey($event, 'new', '')\">" +
    "            <div ng-click=\"postReplay()\" >发送</div>" +
    "        </div>" +
    "    </div>" +
    "</div>"
1
var selectComponentHtml = '\
<div class="filter-label-container separation-left" style="display: inline-block;"><label class="searchlable filter-label">{{config.data.filterName}}</label></div>\
        <md-input-container class="select-mian-panel separation-right" ng-show="!config.data.multipleSelect" style="display: inline-block; position: relative; margin: 0;">\
            <label></label>\
            <md-select aria-label="-" ng-model="singleSelectVal" ng-change="changeSelect(singleSelectVal)" md-on-close="clearSearchTerm()" data-md-container-class="selectdemoSelectHeader">\
                <md-select-header class="demo-select-header">\
                    <input ng-model="searchTerm" type="search" placeholder="请输入查询关键字" class="demo-header-searchbox md-text">\
                </md-select-header>\
                <md-optgroup label="config.data.filterDatas">\
                    <md-option ng-value="">重置</md-option>\
                    <md-option ng-value="row.id" ng-repeat="row in config.data.filterDatas | filter:searchTerm">{{row.name}}</md-option>\
                </md-optgroup>\
            </md-select>\
        </md-input-container>\
        <md-input-container class="select-mian-panel separation-right" ng-show="config.data.multipleSelect" style="display: inline-block; position: relative; margin: 0;">\
            <label></label>\
            <md-select aria-label="-" ng-model="multiSelectVal" ng-change="changeSelect(multiSelectVal)" \
            md-on-close="clearSearchTerm()" data-md-container-class="selectdemoSelectHeader" multiple="true">\
                <md-select-header class="demo-select-header">\
                    <button class="datax-btn datax-btn-default" ng-click="multiSelectVal=selectArr;selectAll()">全选</button>\
                    <button style="margin: 0 5px 0 5px;" class="datax-btn datax-btn-default" ng-click="multiSelectVal=[];selectAll()">重置</button>\
                    <input ng-model="searchTerm" type="search" placeholder="请输入查询关键字" class="demo-header-searchbox md-text">\
                </md-select-header>\
                <md-optgroup label="selectArr">\
                    <md-option ng-value="row" ng-repeat="row in selectArr | filter:searchTerm">{{row}}</md-option>\
                </md-optgroup>\
            </md-select>\
        </md-input-container>\
'

var textComponentHtml = '\
<div class="filter-label-container separation-left" style="display: inline-block;"><label class="searchlable filter-label">{{config.data.filterName}}</label></div>\
<div class="separation-right" style="display: inline-block;">\
    <input class="input-transparent" type="text" style="width:100%;" ng-model="textFilter.data" ng-change="textFilterChange()">\
</div>\
'

    /*!
     * perfect-scrollbar v1.3.0
     * (c) 2017 Hyunje Jun
     * @license MIT
     */
    ! function (t, e) {
        "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : t.PerfectScrollbar = e()
    }(this, function () {
        "use strict";

        function t(t) {
            return getComputedStyle(t)
        }

        function e(t, e) {
            for (var i in e) {
                var r = e[i];
                "number" == typeof r && (r += "px"), t.style[i] = r
            }
            return t
        }

        function i(t) {
            var e = document.createElement("div");
            return e.className = t, e
        }

        function r(t, e) {
            if (!v) throw new Error("No element matching method supported");
            return v.call(t, e)
        }

        function l(t) {
            t.remove ? t.remove() : t.parentNode && t.parentNode.removeChild(t)
        }

        function n(t, e) {
            return Array.prototype.filter.call(t.children, function (t) {
                return r(t, e)
            })
        }

        function o(t, e) {
            var i = t.element.classList,
                r = m.state.scrolling(e);
            i.contains(r) ? clearTimeout(Y[e]) : i.add(r)
        }

        function s(t, e) {
            Y[e] = setTimeout(function () {
                return t.isAlive && t.element.classList.remove(m.state.scrolling(e))
            }, t.settings.scrollingThreshold)
        }

        function a(t, e) {
            o(t, e), s(t, e)
        }

        function c(t) {
            if ("function" == typeof window.CustomEvent) return new CustomEvent(t);
            var e = document.createEvent("CustomEvent");
            return e.initCustomEvent(t, !1, !1, void 0), e
        }

        function h(t, e, i, r, l) {
            var n = i[0],
                o = i[1],
                s = i[2],
                h = i[3],
                u = i[4],
                d = i[5];
            void 0 === r && (r = !0), void 0 === l && (l = !1);
            var f = t.element;
            t.reach[h] = null, f[s] < 1 && (t.reach[h] = "start"), f[s] > t[n] - t[o] - 1 && (t.reach[h] = "end"), e && (f.dispatchEvent(c("ps-scroll-" + h)), e < 0 ? f.dispatchEvent(c("ps-scroll-" + u)) : e > 0 && f.dispatchEvent(c("ps-scroll-" + d)), r && a(t, h)), t.reach[h] && (e || l) && f.dispatchEvent(c("ps-" + h + "-reach-" + t.reach[h]))
        }

        function u(t) {
            return parseInt(t, 10) || 0
        }

        function d(t) {
            return r(t, "input,[contenteditable]") || r(t, "select,[contenteditable]") || r(t, "textarea,[contenteditable]") || r(t, "button,[contenteditable]")
        }

        function f(e) {
            var i = t(e);
            return u(i.width) + u(i.paddingLeft) + u(i.paddingRight) + u(i.borderLeftWidth) + u(i.borderRightWidth)
        }

        function p(t, e) {
            return t.settings.minScrollbarLength && (e = Math.max(e, t.settings.minScrollbarLength)), t.settings.maxScrollbarLength && (e = Math.min(e, t.settings.maxScrollbarLength)), e
        }

        function b(t, i) {
            var r = {
                width: i.railXWidth
            };
            i.isRtl ? r.left = i.negativeScrollAdjustment + t.scrollLeft + i.containerWidth - i.contentWidth : r.left = t.scrollLeft, i.isScrollbarXUsingBottom ? r.bottom = i.scrollbarXBottom - t.scrollTop : r.top = i.scrollbarXTop + t.scrollTop, e(i.scrollbarXRail, r);
            var l = {
                top: t.scrollTop,
                height: i.railYHeight
            };
            i.isScrollbarYUsingRight ? i.isRtl ? l.right = i.contentWidth - (i.negativeScrollAdjustment + t.scrollLeft) - i.scrollbarYRight - i.scrollbarYOuterWidth : l.right = i.scrollbarYRight - t.scrollLeft : i.isRtl ? l.left = i.negativeScrollAdjustment + t.scrollLeft + 2 * i.containerWidth - i.contentWidth - i.scrollbarYLeft - i.scrollbarYOuterWidth : l.left = i.scrollbarYLeft + t.scrollLeft, e(i.scrollbarYRail, l), e(i.scrollbarX, {
                left: i.scrollbarXLeft,
                width: i.scrollbarXWidth - i.railBorderXWidth
            }), e(i.scrollbarY, {
                top: i.scrollbarYTop,
                height: i.scrollbarYHeight - i.railBorderYWidth
            })
        }

        function g(t, e) {
            function i(e) {
                p[d] = b + v * (e[a] - g), o(t, f), T(t), e.stopPropagation(), e.preventDefault()
            }

            function r() {
                s(t, f), t.event.unbind(t.ownerDocument, "mousemove", i)
            }
            var l = e[0],
                n = e[1],
                a = e[2],
                c = e[3],
                h = e[4],
                u = e[5],
                d = e[6],
                f = e[7],
                p = t.element,
                b = null,
                g = null,
                v = null;
            t.event.bind(t[h], "mousedown", function (e) {
                b = p[d], g = e[a], v = (t[n] - t[l]) / (t[c] - t[u]), t.event.bind(t.ownerDocument, "mousemove", i), t.event.once(t.ownerDocument, "mouseup", r), e.stopPropagation(), e.preventDefault()
            })
        }
        var v = "undefined" != typeof Element && (Element.prototype.matches || Element.prototype.webkitMatchesSelector || Element.prototype.msMatchesSelector),
            m = {
                main: "ps",
                element: {
                    thumb: function (t) {
                        return "ps__thumb-" + t
                    },
                    rail: function (t) {
                        return "ps__rail-" + t
                    },
                    consuming: "ps__child--consume"
                },
                state: {
                    focus: "ps--focus",
                    active: function (t) {
                        return "ps--active-" + t
                    },
                    scrolling: function (t) {
                        return "ps--scrolling-" + t
                    }
                }
            },
            Y = {
                x: null,
                y: null
            },
            X = function (t) {
                this.element = t, this.handlers = {}
            },
            w = {
                isEmpty: {
                    configurable: !0
                }
            };
        X.prototype.bind = function (t, e) {
            void 0 === this.handlers[t] && (this.handlers[t] = []), this.handlers[t].push(e), this.element.addEventListener(t, e, !1)
        }, X.prototype.unbind = function (t, e) {
            var i = this;
            this.handlers[t] = this.handlers[t].filter(function (r) {
                return !(!e || r === e) || (i.element.removeEventListener(t, r, !1), !1)
            })
        }, X.prototype.unbindAll = function () {
            var t = this;
            for (var e in t.handlers) t.unbind(e)
        }, w.isEmpty.get = function () {
            var t = this;
            return Object.keys(this.handlers).every(function (e) {
                return 0 === t.handlers[e].length
            })
        }, Object.defineProperties(X.prototype, w);
        var y = function () {
            this.eventElements = []
        };
        y.prototype.eventElement = function (t) {
            var e = this.eventElements.filter(function (e) {
                return e.element === t
            })[0];
            return e || (e = new X(t), this.eventElements.push(e)), e
        }, y.prototype.bind = function (t, e, i) {
            this.eventElement(t).bind(e, i)
        }, y.prototype.unbind = function (t, e, i) {
            var r = this.eventElement(t);
            r.unbind(e, i), r.isEmpty && this.eventElements.splice(this.eventElements.indexOf(r), 1)
        }, y.prototype.unbindAll = function () {
            this.eventElements.forEach(function (t) {
                return t.unbindAll()
            }), this.eventElements = []
        }, y.prototype.once = function (t, e, i) {
            var r = this.eventElement(t),
                l = function (t) {
                    r.unbind(e, l), i(t)
                };
            r.bind(e, l)
        };
        var W = function (t, e, i, r, l) {
                void 0 === r && (r = !0), void 0 === l && (l = !1);
                var n;
                if ("top" === e) n = ["contentHeight", "containerHeight", "scrollTop", "y", "up", "down"];
                else {
                    if ("left" !== e) throw new Error("A proper axis should be provided");
                    n = ["contentWidth", "containerWidth", "scrollLeft", "x", "left", "right"]
                }
                h(t, i, n, r, l)
            },
            L = {
                isWebKit: "undefined" != typeof document && "WebkitAppearance" in document.documentElement.style,
                supportsTouch: "undefined" != typeof window && ("ontouchstart" in window || window.DocumentTouch && document instanceof window.DocumentTouch),
                supportsIePointer: "undefined" != typeof navigator && navigator.msMaxTouchPoints,
                isChrome: "undefined" != typeof navigator && /Chrome/i.test(navigator && navigator.userAgent)
            },
            T = function (t) {
                var e = t.element;
                t.containerWidth = e.clientWidth, t.containerHeight = e.clientHeight, t.contentWidth = e.scrollWidth, t.contentHeight = e.scrollHeight, e.contains(t.scrollbarXRail) || (n(e, m.element.rail("x")).forEach(function (t) {
                    return l(t)
                }), e.appendChild(t.scrollbarXRail)), e.contains(t.scrollbarYRail) || (n(e, m.element.rail("y")).forEach(function (t) {
                    return l(t)
                }), e.appendChild(t.scrollbarYRail)), !t.settings.suppressScrollX && t.containerWidth + t.settings.scrollXMarginOffset < t.contentWidth ? (t.scrollbarXActive = !0, t.railXWidth = t.containerWidth - t.railXMarginWidth, t.railXRatio = t.containerWidth / t.railXWidth, t.scrollbarXWidth = p(t, u(t.railXWidth * t.containerWidth / t.contentWidth)), t.scrollbarXLeft = u((t.negativeScrollAdjustment + e.scrollLeft) * (t.railXWidth - t.scrollbarXWidth) / (t.contentWidth - t.containerWidth))) : t.scrollbarXActive = !1, !t.settings.suppressScrollY && t.containerHeight + t.settings.scrollYMarginOffset < t.contentHeight ? (t.scrollbarYActive = !0, t.railYHeight = t.containerHeight - t.railYMarginHeight, t.railYRatio = t.containerHeight / t.railYHeight, t.scrollbarYHeight = p(t, u(t.railYHeight * t.containerHeight / t.contentHeight)), t.scrollbarYTop = u(e.scrollTop * (t.railYHeight - t.scrollbarYHeight) / (t.contentHeight - t.containerHeight))) : t.scrollbarYActive = !1, t.scrollbarXLeft >= t.railXWidth - t.scrollbarXWidth && (t.scrollbarXLeft = t.railXWidth - t.scrollbarXWidth), t.scrollbarYTop >= t.railYHeight - t.scrollbarYHeight && (t.scrollbarYTop = t.railYHeight - t.scrollbarYHeight), b(e, t), t.scrollbarXActive ? e.classList.add(m.state.active("x")) : (e.classList.remove(m.state.active("x")), t.scrollbarXWidth = 0, t.scrollbarXLeft = 0, e.scrollLeft = 0), t.scrollbarYActive ? e.classList.add(m.state.active("y")) : (e.classList.remove(m.state.active("y")), t.scrollbarYHeight = 0, t.scrollbarYTop = 0, e.scrollTop = 0)
            },
            R = {
                "click-rail": function (t) {
                    t.event.bind(t.scrollbarY, "mousedown", function (t) {
                        return t.stopPropagation()
                    }), t.event.bind(t.scrollbarYRail, "mousedown", function (e) {
                        var i = e.pageY - window.pageYOffset - t.scrollbarYRail.getBoundingClientRect().top > t.scrollbarYTop ? 1 : -1;
                        t.element.scrollTop += i * t.containerHeight, T(t), e.stopPropagation()
                    }), t.event.bind(t.scrollbarX, "mousedown", function (t) {
                        return t.stopPropagation()
                    }), t.event.bind(t.scrollbarXRail, "mousedown", function (e) {
                        var i = e.pageX - window.pageXOffset - t.scrollbarXRail.getBoundingClientRect().left > t.scrollbarXLeft ? 1 : -1;
                        t.element.scrollLeft += i * t.containerWidth, T(t), e.stopPropagation()
                    })
                },
                "drag-thumb": function (t) {
                    g(t, ["containerWidth", "contentWidth", "pageX", "railXWidth", "scrollbarX", "scrollbarXWidth", "scrollLeft", "x"]), g(t, ["containerHeight", "contentHeight", "pageY", "railYHeight", "scrollbarY", "scrollbarYHeight", "scrollTop", "y"])
                },
                keyboard: function (t) {
                    function e(e, r) {
                        var l = i.scrollTop;
                        if (0 === e) {
                            if (!t.scrollbarYActive) return !1;
                            if (0 === l && r > 0 || l >= t.contentHeight - t.containerHeight && r < 0) return !t.settings.wheelPropagation
                        }
                        var n = i.scrollLeft;
                        if (0 === r) {
                            if (!t.scrollbarXActive) return !1;
                            if (0 === n && e < 0 || n >= t.contentWidth - t.containerWidth && e > 0) return !t.settings.wheelPropagation
                        }
                        return !0
                    }
                    var i = t.element,
                        l = function () {
                            return r(i, ":hover")
                        },
                        n = function () {
                            return r(t.scrollbarX, ":focus") || r(t.scrollbarY, ":focus")
                        };
                    t.event.bind(t.ownerDocument, "keydown", function (r) {
                        if (!(r.isDefaultPrevented && r.isDefaultPrevented() || r.defaultPrevented) && (l() || n())) {
                            var o = document.activeElement ? document.activeElement : t.ownerDocument.activeElement;
                            if (o) {
                                if ("IFRAME" === o.tagName) o = o.contentDocument.activeElement;
                                else
                                    for (; o.shadowRoot;) o = o.shadowRoot.activeElement;
                                if (d(o)) return
                            }
                            var s = 0,
                                a = 0;
                            switch (r.which) {
                                case 37:
                                    s = r.metaKey ? -t.contentWidth : r.altKey ? -t.containerWidth : -30;
                                    break;
                                case 38:
                                    a = r.metaKey ? t.contentHeight : r.altKey ? t.containerHeight : 30;
                                    break;
                                case 39:
                                    s = r.metaKey ? t.contentWidth : r.altKey ? t.containerWidth : 30;
                                    break;
                                case 40:
                                    a = r.metaKey ? -t.contentHeight : r.altKey ? -t.containerHeight : -30;
                                    break;
                                case 32:
                                    a = r.shiftKey ? t.containerHeight : -t.containerHeight;
                                    break;
                                case 33:
                                    a = t.containerHeight;
                                    break;
                                case 34:
                                    a = -t.containerHeight;
                                    break;
                                case 36:
                                    a = t.contentHeight;
                                    break;
                                case 35:
                                    a = -t.contentHeight;
                                    break;
                                default:
                                    return
                            }
                            t.settings.suppressScrollX && 0 !== s || t.settings.suppressScrollY && 0 !== a || (i.scrollTop -= a, i.scrollLeft += s, T(t), e(s, a) && r.preventDefault())
                        }
                    })
                },
                wheel: function (e) {
                    function i(t, i) {
                        var r = 0 === o.scrollTop,
                            l = o.scrollTop + o.offsetHeight === o.scrollHeight,
                            n = 0 === o.scrollLeft,
                            s = o.scrollLeft + o.offsetWidth === o.offsetWidth;
                        return !(Math.abs(i) > Math.abs(t) ? r || l : n || s) || !e.settings.wheelPropagation
                    }

                    function r(t) {
                        var e = t.deltaX,
                            i = -1 * t.deltaY;
                        return void 0 !== e && void 0 !== i || (e = -1 * t.wheelDeltaX / 6, i = t.wheelDeltaY / 6), t.deltaMode && 1 === t.deltaMode && (e *= 10, i *= 10), e !== e && i !== i && (e = 0, i = t.wheelDelta), t.shiftKey ? [-i, -e] : [e, i]
                    }

                    function l(e, i, r) {
                        if (!L.isWebKit && o.querySelector("select:focus")) return !0;
                        if (!o.contains(e)) return !1;
                        for (var l = e; l && l !== o;) {
                            if (l.classList.contains(m.element.consuming)) return !0;
                            var n = t(l);
                            if ([n.overflow, n.overflowX, n.overflowY].join("").match(/(scroll|auto)/)) {
                                var s = l.scrollHeight - l.clientHeight;
                                if (s > 0 && !(0 === l.scrollTop && r > 0 || l.scrollTop === s && r < 0)) return !0;
                                var a = l.scrollLeft - l.clientWidth;
                                if (a > 0 && !(0 === l.scrollLeft && i < 0 || l.scrollLeft === a && i > 0)) return !0
                            }
                            l = l.parentNode
                        }
                        return !1
                    }

                    function n(t) {
                        var n = r(t),
                            s = n[0],
                            a = n[1];
                        if (!l(t.target, s, a)) {
                            var c = !1;
                            e.settings.useBothWheelAxes ? e.scrollbarYActive && !e.scrollbarXActive ? (a ? o.scrollTop -= a * e.settings.wheelSpeed : o.scrollTop += s * e.settings.wheelSpeed, c = !0) : e.scrollbarXActive && !e.scrollbarYActive && (s ? o.scrollLeft += s * e.settings.wheelSpeed : o.scrollLeft -= a * e.settings.wheelSpeed, c = !0) : (o.scrollTop -= a * e.settings.wheelSpeed, o.scrollLeft += s * e.settings.wheelSpeed), T(e), (c = c || i(s, a)) && !t.ctrlKey && (t.stopPropagation(), t.preventDefault())
                        }
                    }
                    var o = e.element;
                    void 0 !== window.onwheel ? e.event.bind(o, "wheel", n) : void 0 !== window.onmousewheel && e.event.bind(o, "mousewheel", n)
                },
                touch: function (e) {
                    function i(t, i) {
                        var r = h.scrollTop,
                            l = h.scrollLeft,
                            n = Math.abs(t),
                            o = Math.abs(i);
                        if (o > n) {
                            if (i < 0 && r === e.contentHeight - e.containerHeight || i > 0 && 0 === r) return 0 === window.scrollY && i > 0 && L.isChrome
                        } else if (n > o && (t < 0 && l === e.contentWidth - e.containerWidth || t > 0 && 0 === l)) return !0;
                        return !0
                    }

                    function r(t, i) {
                        h.scrollTop -= i, h.scrollLeft -= t, T(e)
                    }

                    function l(t) {
                        return t.targetTouches ? t.targetTouches[0] : t
                    }

                    function n(t) {
                        return !(t.pointerType && "pen" === t.pointerType && 0 === t.buttons || (!t.targetTouches || 1 !== t.targetTouches.length) && (!t.pointerType || "mouse" === t.pointerType || t.pointerType === t.MSPOINTER_TYPE_MOUSE))
                    }

                    function o(t) {
                        if (n(t)) {
                            var e = l(t);
                            u.pageX = e.pageX, u.pageY = e.pageY, d = (new Date).getTime(), null !== p && clearInterval(p)
                        }
                    }

                    function s(e, i, r) {
                        if (!h.contains(e)) return !1;
                        for (var l = e; l && l !== h;) {
                            if (l.classList.contains(m.element.consuming)) return !0;
                            var n = t(l);
                            if ([n.overflow, n.overflowX, n.overflowY].join("").match(/(scroll|auto)/)) {
                                var o = l.scrollHeight - l.clientHeight;
                                if (o > 0 && !(0 === l.scrollTop && r > 0 || l.scrollTop === o && r < 0)) return !0;
                                var s = l.scrollLeft - l.clientWidth;
                                if (s > 0 && !(0 === l.scrollLeft && i < 0 || l.scrollLeft === s && i > 0)) return !0
                            }
                            l = l.parentNode
                        }
                        return !1
                    }

                    function a(t) {
                        if (n(t)) {
                            var e = l(t),
                                o = {
                                    pageX: e.pageX,
                                    pageY: e.pageY
                                },
                                a = o.pageX - u.pageX,
                                c = o.pageY - u.pageY;
                            if (s(t.target, a, c)) return;
                            r(a, c), u = o;
                            var h = (new Date).getTime(),
                                p = h - d;
                            p > 0 && (f.x = a / p, f.y = c / p, d = h), i(a, c) && t.preventDefault()
                        }
                    }

                    function c() {
                        e.settings.swipeEasing && (clearInterval(p), p = setInterval(function () {
                            e.isInitialized ? clearInterval(p) : f.x || f.y ? Math.abs(f.x) < .01 && Math.abs(f.y) < .01 ? clearInterval(p) : (r(30 * f.x, 30 * f.y), f.x *= .8, f.y *= .8) : clearInterval(p)
                        }, 10))
                    }
                    if (L.supportsTouch || L.supportsIePointer) {
                        var h = e.element,
                            u = {},
                            d = 0,
                            f = {},
                            p = null;
                        L.supportsTouch ? (e.event.bind(h, "touchstart", o), e.event.bind(h, "touchmove", a), e.event.bind(h, "touchend", c)) : L.supportsIePointer && (window.PointerEvent ? (e.event.bind(h, "pointerdown", o), e.event.bind(h, "pointermove", a), e.event.bind(h, "pointerup", c)) : window.MSPointerEvent && (e.event.bind(h, "MSPointerDown", o), e.event.bind(h, "MSPointerMove", a), e.event.bind(h, "MSPointerUp", c)))
                    }
                }
            },
            H = function (r, l) {
                var n = this;
                if (void 0 === l && (l = {}), "string" == typeof r && (r = document.querySelector(r)), !r || !r.nodeName) throw new Error("no element is specified to initialize PerfectScrollbar");
                this.element = r, r.classList.add(m.main), this.settings = {
                    handlers: ["click-rail", "drag-thumb", "keyboard", "wheel", "touch"],
                    maxScrollbarLength: null,
                    minScrollbarLength: null,
                    scrollingThreshold: 1e3,
                    scrollXMarginOffset: 0,
                    scrollYMarginOffset: 0,
                    suppressScrollX: !1,
                    suppressScrollY: !1,
                    swipeEasing: !0,
                    useBothWheelAxes: !1,
                    wheelPropagation: !1,
                    wheelSpeed: 1
                };
                for (var o in l) n.settings[o] = l[o];
                this.containerWidth = null, this.containerHeight = null, this.contentWidth = null, this.contentHeight = null;
                var s = function () {
                        return r.classList.add(m.state.focus)
                    },
                    a = function () {
                        return r.classList.remove(m.state.focus)
                    };
                this.isRtl = "rtl" === t(r).direction, this.isNegativeScroll = function () {
                    var t = r.scrollLeft,
                        e = null;
                    return r.scrollLeft = -1, e = r.scrollLeft < 0, r.scrollLeft = t, e
                }(), this.negativeScrollAdjustment = this.isNegativeScroll ? r.scrollWidth - r.clientWidth : 0, this.event = new y, this.ownerDocument = r.ownerDocument || document, this.scrollbarXRail = i(m.element.rail("x")), r.appendChild(this.scrollbarXRail), this.scrollbarX = i(m.element.thumb("x")), this.scrollbarXRail.appendChild(this.scrollbarX), this.scrollbarX.setAttribute("tabindex", 0), this.event.bind(this.scrollbarX, "focus", s), this.event.bind(this.scrollbarX, "blur", a), this.scrollbarXActive = null, this.scrollbarXWidth = null, this.scrollbarXLeft = null;
                var c = t(this.scrollbarXRail);
                this.scrollbarXBottom = parseInt(c.bottom, 10), isNaN(this.scrollbarXBottom) ? (this.isScrollbarXUsingBottom = !1, this.scrollbarXTop = u(c.top)) : this.isScrollbarXUsingBottom = !0, this.railBorderXWidth = u(c.borderLeftWidth) + u(c.borderRightWidth), e(this.scrollbarXRail, {
                    display: "block"
                }), this.railXMarginWidth = u(c.marginLeft) + u(c.marginRight), e(this.scrollbarXRail, {
                    display: ""
                }), this.railXWidth = null, this.railXRatio = null, this.scrollbarYRail = i(m.element.rail("y")), r.appendChild(this.scrollbarYRail), this.scrollbarY = i(m.element.thumb("y")), this.scrollbarYRail.appendChild(this.scrollbarY), this.scrollbarY.setAttribute("tabindex", 0), this.event.bind(this.scrollbarY, "focus", s), this.event.bind(this.scrollbarY, "blur", a), this.scrollbarYActive = null, this.scrollbarYHeight = null, this.scrollbarYTop = null;
                var h = t(this.scrollbarYRail);
                this.scrollbarYRight = parseInt(h.right, 10), isNaN(this.scrollbarYRight) ? (this.isScrollbarYUsingRight = !1, this.scrollbarYLeft = u(h.left)) : this.isScrollbarYUsingRight = !0, this.scrollbarYOuterWidth = this.isRtl ? f(this.scrollbarY) : null, this.railBorderYWidth = u(h.borderTopWidth) + u(h.borderBottomWidth), e(this.scrollbarYRail, {
                    display: "block"
                }), this.railYMarginHeight = u(h.marginTop) + u(h.marginBottom), e(this.scrollbarYRail, {
                    display: ""
                }), this.railYHeight = null, this.railYRatio = null, this.reach = {
                    x: r.scrollLeft <= 0 ? "start" : r.scrollLeft >= this.contentWidth - this.containerWidth ? "end" : null,
                    y: r.scrollTop <= 0 ? "start" : r.scrollTop >= this.contentHeight - this.containerHeight ? "end" : null
                }, this.isAlive = !0, this.settings.handlers.forEach(function (t) {
                    return R[t](n)
                }), this.lastScrollTop = r.scrollTop, this.lastScrollLeft = r.scrollLeft, this.event.bind(this.element, "scroll", function (t) {
                    return n.onScroll(t)
                }), T(this)
            };
        return H.prototype.update = function () {
            this.isAlive && (this.negativeScrollAdjustment = this.isNegativeScroll ? this.element.scrollWidth - this.element.clientWidth : 0, e(this.scrollbarXRail, {
                display: "block"
            }), e(this.scrollbarYRail, {
                display: "block"
            }), this.railXMarginWidth = u(t(this.scrollbarXRail).marginLeft) + u(t(this.scrollbarXRail).marginRight), this.railYMarginHeight = u(t(this.scrollbarYRail).marginTop) + u(t(this.scrollbarYRail).marginBottom), e(this.scrollbarXRail, {
                display: "none"
            }), e(this.scrollbarYRail, {
                display: "none"
            }), T(this), W(this, "top", 0, !1, !0), W(this, "left", 0, !1, !0), e(this.scrollbarXRail, {
                display: ""
            }), e(this.scrollbarYRail, {
                display: ""
            }))
        }, H.prototype.onScroll = function (t) {
            this.isAlive && (T(this), W(this, "top", this.element.scrollTop - this.lastScrollTop), W(this, "left", this.element.scrollLeft - this.lastScrollLeft), this.lastScrollTop = this.element.scrollTop, this.lastScrollLeft = this.element.scrollLeft)
        }, H.prototype.destroy = function () {
            this.isAlive && (this.event.unbindAll(), l(this.scrollbarX), l(this.scrollbarY), l(this.scrollbarXRail), l(this.scrollbarYRail), this.removePsClasses(), this.element = null, this.scrollbarX = null, this.scrollbarY = null, this.scrollbarXRail = null, this.scrollbarYRail = null, this.isAlive = !1)
        }, H.prototype.removePsClasses = function () {
            this.element.className = this.element.className.split(" ").filter(function (t) {
                return !t.match(/^ps([-_].+|)$/)
            }).join(" ")
        }, H
    });