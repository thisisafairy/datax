/**
 * echart 的 map,仪表盘,饼图的 生成 方法
 * @param {*} 图表类型 
 * @param {*} 配置信息 
 * @param {*} 渲染图表的div元素 （jquery 对象） 
 * @param {*} 渲染的数据 
 */
function getLinkFunction(type, config, element, data) {
    "use strict";
    var util = echartutil();
    var scope = {
        config: {},
        data: {},
        chart: null
    };
    // config = config || {};
    // var attrs = element.attributes;
    scope.config = config || {};
    scope.data = data || {};
    var ndWrapper = element[0], width, height, chart;
    var chartEvent = {};
    function getSizes(config) {
        width = config.width || ndWrapper.clientWidth || 0;
        height = config.height || 0;
        if (height === 0 || width === 0) {
            if ($(ndWrapper).width() > 0) {
                ndWrapper.style.width = $(ndWrapper).width() + 'px';
                ndWrapper.style.height = $(ndWrapper).width() / 2 + 'px';
            }
            else {
                ndWrapper.style.width = '600px';
                ndWrapper.style.height = '500px';
            }
        }
        else {
            ndWrapper.style.width = width + 'px';
            ndWrapper.style.height = height + 'px';
        }
        // ndWrapper.style.width = width + 'px';
        // ndWrapper.style.height = height + 'px';
    }
    function getOptions(data, config, type) {

        // merge default config
        config = angular.extend({
            showXAxis: true,
            showYAxis: true,
            showLegend: true
        }, config);
        var xAxis = angular.extend({
            orient: 'top',
            axisLine: { show: false }
        }, angular.isObject(config.xAxis) ? config.xAxis : {});
        var yAxis = angular.extend({
            type: 'value',
            orient: 'right',
            scale: false,
            axisLine: { show: false },
            axisLabel: {
                formatter: function (v) {
                    return util.formatKMBT(v);
                }
            }
        }, angular.isObject(config.yAxis) ? config.yAxis : {});
        // basic config
        var options = {
            title: util.getTitle(data, config, type),
            tooltip: util.getTooltip(data, config, type),
            legend: util.getLegend(data, config, type),
            toolbox: angular.extend({ show: false }, angular.isObject(config.toolbox) ? config.toolbox : {}),
            xAxis: util.isHeatmapChart(type) ? config.xAxis : [angular.extend(xAxis, util.getAxisTicks(data, config, type))],
            yAxis: util.isHeatmapChart(type) ? config.yAxis : [yAxis],
            graphic: config.graphic && (angular.isObject(config.graphic) || angular.isArray(config.graphic)) ? config.graphic : [],
            series: util.getSeries(data, config, type),
            visualMap: config.visualMap ? config.visualMap : null
        };
        if (!config.showXAxis) {
            angular.forEach(options.xAxis, function (axis) {
                axis.axisLine = { show: false };
                axis.axisLabel = { show: false };
                axis.axisTick = { show: false };
            });
        }
        if (!config.showYAxis) {
            angular.forEach(options.yAxis, function (axis) {
                axis.axisLine = { show: false };
                axis.axisLabel = { show: false };
                axis.axisTick = { show: false };
            });
        }
        if (!config.showLegend || type === 'gauge') {
            delete options.legend;
        }
        if (!util.isAxisChart(type) && !util.isHeatmapChart(type)) {
            delete options.xAxis;
            delete options.yAxis;
        }
        if (config.dataZoom) {
            options.dataZoom = angular.extend({
                show: true,
                realtime: true
            }, config.dataZoom);
        }
        if (config.dataRange) {
            options.dataRange = angular.extend({}, config.dataRange);
        }
        if (config.polar) {
            options.polar = config.polar;
        }
        if (config.grid) {
            options.grid = config.grid;
        }
        return options;
    }

    function getOption(config) {
        if (!config.data) {
            return;
        }
        var data = mapEchart(config.data);
        var map_obj = util.getMapData(config, data);
        var option = util.getConfig(config, map_obj);
        if (map_obj.top_num < map_obj.map_data.length && map_obj.map_data.length > 0) {
            option.legend = {
                orient: 'vertical',
                y: 'bottom',
                x: 'right',
                data: [map_obj.show_all_data_text],
                textStyle: {
                    color: map_obj.show_all_data_text_color
                }
            };
            option.series.push({
                name: map_obj.show_all_data_text,
                type: 'scatter',
                coordinateSystem: 'bmap',
                data: convertData(map_obj.map_data),
                symbolSize: function () {
                    return (10) * map_obj.general_point_size;
                },
                label: {
                    normal: {
                        formatter: function (d) {
                            return d.data.name + ':' + d.data.count;
                        },
                        position: 'right',
                        show: false
                    },
                    emphasis: {
                        show: true
                    }
                },
                tooltip: {
                    formatter: function (d) {
                        return d.data.name + ':' + d.data.count;
                    }
                },
                itemStyle: {
                    normal: {
                        color: map_obj.area_solor
                    }
                }
            });

        }
        if (map_obj.map_data.length > 0 && map_obj.order_modal !== '1') {
            var topData = [];
            if (map_obj.order_modal === '1') {
                topData = convertData(map_obj.map_data.sort(function (a, b) {
                    return b.value - a.value;
                }).slice(0, map_obj.top_num));
            }
            else {
                topData = convertData(map_obj.map_data.sort(function (a, b) {
                    return a.value - b.value;
                }).slice(0, map_obj.top_num));
            }
            option.series.push({
                name: 'Top show ' + map_obj.top_num,
                type: 'effectScatter',
                coordinateSystem: 'bmap',
                data: topData,
                symbolSize: function () {
                    return (30) * map_obj.top_point_size;
                },
                showEffectOn: 'render',
                rippleEffect: {
                    brushType: 'stroke'
                },
                hoverAnimation: true,
                label: {
                    normal: {
                        formatter: function (d) {
                            return d.data.name + ':' + d.data.count;
                        },
                        position: 'right',
                        show: true
                    }
                },
                tooltip: {
                    formatter: function (d) {
                        return d.data.name + ':' + d.data.count;
                    }
                },
                itemStyle: {
                    normal: {
                        color: map_obj.top_area_solor,
                        shadowBlur: 10,
                        shadowColor: '#333'
                    }
                },
            });
        }
        return option;
    }

    var isAjaxInProgress = false;
    var textStyle = {
        color: 'red',
        fontSize: 36,
        fontWeight: 900,
        fontFamily: 'Microsoft Yahei, Arial'
    };

    function convertData(data) {
        var res = [];
        for (var i = 0; i < data.length; i++) {
            //坐标数组
            var geoCoord = util.getCoordMap(data[i].name);
            if (geoCoord) {
                res.push({
                    name: data[i].name,
                    value: geoCoord.concat(data[i].value),
                    count: data[i].value
                });
            }
        }
        return res;
    }
    function setOptions() {
        if (!scope.data || !scope.config) {
            return;
        }
        var options;
        // debugger;
        if (type === 'map') {
            if ($(ndWrapper).width() > 320) {
                ndWrapper.style.width = $(ndWrapper).width() + 'px';
                ndWrapper.style.height = $(ndWrapper).width() / 2 + 'px';
            }
            if (scope.config.width && scope.config.width > 0) {
                ndWrapper.style.width = scope.config.width + 'px';
            }
            if (scope.config.height && scope.config.height > 0) {
                ndWrapper.style.height = scope.config.height + 'px';
            }
            chart = echarts.init(ndWrapper);
            var chartOption = getOption(scope.config);
            if (chartOption.series.length) {
                chart.setOption(chartOption);
                chart.resize();
            }
            // scope.chartoption = chart.getOption();
            return chart;

        }
        else {
            getSizes(scope.config);
            chart = echarts.init(ndWrapper, scope.config.theme || 'shine');
            if (scope.config.event) {
                if (!Array.isArray(scope.config.event)) {
                    scope.config.event = [scope.config.event];
                }
                if (Array.isArray(scope.config.event)) {
                    scope.config.event.forEach(function (ele) {
                        if (!chartEvent[ele.type]) {
                            chartEvent[ele.type] = true;
                            chart.on(ele.type, function (param) {
                                ele.fn(param);
                            });
                        }
                    });
                }
            }
            // string type for data param is assumed to ajax datarequests
            if (angular.isString(scope.data)) {
                if (isAjaxInProgress) {
                    return;
                }

            } else {
                options = getOptions(scope.data, scope.config, type);
                // debugger;
                if (scope.config.forceClear) {
                    chart.clear();
                }
                if (options.series.length) {
                    chart.setOption(options);
                    chart.resize();
                } else {
                    chart.showLoading({
                        text: scope.config.errorMsg || '\u6CA1\u6709\u6570\u636E',
                        textStyle: textStyle
                    });
                }
            }
            return chart;
        }


    }
    // update when charts config changes
    return setOptions();
}
/**
 * getLinkFunction 依赖方法 
 */
function echartutil() {

    function isPieChart(type) {
        return ['pie', 'donut'].indexOf(type) > -1;
    }
    function isMapChart(type) {
        return ['map'].indexOf(type) > -1;
    }
    function isAxisChart(type) {
        return ['line', 'bar', 'area'].indexOf(type) > -1;
    }
    function isHeatmapChart(type) {
        return ['heatmap'].indexOf(type) > -1;
    }
    /**
    * get x axis ticks from the 1st serie
    */
    function getAxisTicks(data, config, type) {
        var ticks = [];
        if (data[0]) {
            angular.forEach(data[0].datapoints, function (datapoint) {
                ticks.push(datapoint.x);
            });
        }
        return {
            type: 'category',
            boundaryGap: type === 'bar',
            data: ticks
        };
    }
    /**
    * get series config
    *
    * @param {Array} data serie data
    * @param {Object} config options
    * @param {String} chart type
    */
    function getSeries(data, config, type) {
        var series = [];
        angular.forEach(data, function (serie) {
            // datapoints for line, area, bar chart
            var datapoints = [];
            angular.forEach(serie.datapoints, function (datapoint) {
                datapoints.push(datapoint.y);
            });
            var conf = {
                type: type || 'line',
                name: serie.name,
                data: datapoints
            };
            // area chart is actually line chart with special itemStyle
            if (type === 'area') {
                conf.type = 'line';
                conf.itemStyle = { normal: { areaStyle: { type: 'default' } } };
            }
            // gauge chart need many special config
            if (type === 'gauge') {
                conf = angular.extend(conf, {
                    splitNumber: 10,
                    // 分割段数，默认为5
                    axisLine: {
                        // 坐标轴线
                        lineStyle: {
                            // 属性lineStyle控制线条样式
                            color: [[0.2, '#228b22'], [0.8, '#48b'], [1, '#ff4500']],
                            width: 8
                        }
                    },
                    axisTick: {
                        // 坐标轴小标记
                        splitNumber: 10,
                        // 每份split细分多少段
                        length: 12,
                        // 属性length控制线长
                        lineStyle: {
                            // 属性lineStyle控制线条样式
                            color: 'auto'
                        }
                    },
                    axisLabel: {
                        // 坐标轴文本标签，详见axis.axisLabel
                        textStyle: {
                            // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                            color: 'auto'
                        }
                    },
                    splitLine: {
                        // 分隔线
                        show: true,
                        // 默认显示，属性show控制显示与否
                        length: 30,
                        // 属性length控制线长
                        lineStyle: {
                            // 属性lineStyle（详见lineStyle）控制线条样式
                            color: 'auto'
                        }
                    },
                    pointer: { width: 5 },
                    title: {
                        show: true,
                        offsetCenter: [0, '-40%'],
                        // x, y，单位px
                        textStyle: {
                            // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                            fontWeight: 'bolder'
                        }
                    },
                    detail: {
                        formatter: '{value}%',
                        textStyle: {
                            // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                            color: 'auto',
                            fontWeight: 'bolder'
                        }
                    }
                }, config.gauge || {});
            }
            // datapoints for pie chart and gauges are different
            if (!isAxisChart(type)) {
                conf.data = [];
                angular.forEach(serie.datapoints, function (datapoint) {
                    conf.data.push({
                        value: datapoint.y,
                        name: datapoint.x
                    });
                });
            }
            if (isPieChart(type)) {
                // donut charts are actually pie charts
                conf.type = 'pie';
                // pie chart need special radius, center config
                conf.center = config.center || ['40%', '50%'];
                conf.radius = config.radius || '60%';
                // donut chart require special itemStyle
                if (type === 'donut') {
                    conf.radius = config.radius || ['50%', '70%'];
                    conf = angular.extend(conf, {
                        itemStyle: {
                            normal: {
                                label: { show: false },
                                labelLine: { show: false }
                            },
                            emphasis: {
                                label: {
                                    show: true,
                                    position: 'center',
                                    textStyle: {
                                        fontSize: '50',
                                        fontWeight: 'bold'
                                    }
                                }
                            }
                        }
                    }, config.donut || {});
                } else if (type === 'pie') {
                    conf = angular.extend(conf, {
                        itemStyle: {
                            normal: {
                                label: {
                                    position: 'inner',
                                    formatter: function (item) {
                                        return (+item.percent).toFixed() + '%';
                                    }
                                },
                                labelLine: { show: false }
                            },
                            emphasis: {
                                label: {
                                    show: true,
                                    formatter: '{b}\n{d}%'
                                }
                            }
                        }
                    }, config.pie || {});
                }
            }
            if (isMapChart(type)) {
                conf.type = 'map';
                conf = angular.extend(conf, serie, config.map || {});
            }
            // if stack set to true
            if (config.stack) {
                conf.stack = 'total';
            }
            if (type === 'radar') {
                conf.data = serie.data;
            }
            if (isHeatmapChart(type)) {
                conf.type = 'heatmap';
                conf.name = serie.name;
                conf.data = serie.data;
                conf = angular.extend(conf, {
                    label: { normal: { show: true } },
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }, config.heatmap || {});
            }
            series.push(conf);
        });
        return series;
    }
    /**
    * get legends from data series
    */
    function getLegend(data, config, type) {
        var legend = { data: [] };
        if (isPieChart(type)) {
            if (data[0]) {
                angular.forEach(data[0].datapoints, function (datapoint) {
                    legend.data.push(datapoint.x);
                });
            }
            legend.orient = 'verticle';
            legend.x = 'right';
            legend.y = 'center';
        } else if (type === 'map') {
            legend = {};
        } else {
            angular.forEach(data, function (serie) {
                legend.data.push(serie.name);
            });
            legend.orient = 'horizontal';
        }
        return angular.extend(legend, config.legend || {});
    }
    /**
    * get tooltip config
    */
    function getTooltip(data, config, type) {
        var tooltip = {};
        switch (type) {
            case 'line':
            case 'area':
                tooltip.trigger = 'axis';
                break;
            case 'pie':
            case 'donut':
            case 'bar':
            case 'map':
            case 'gauge':
                tooltip.trigger = 'item';
                break;
        }
        if (type === 'pie') {
            tooltip.formatter = '{a} <br/>{b}: {c} ({d}%)';
        }
        if (type === 'map') {
            tooltip.formatter = '{b}';
        }
        return angular.extend(tooltip, angular.isObject(config.tooltip) ? config.tooltip : {});
    }
    function getTitle(data, config, type) {
        if (angular.isObject(config.title)) {
            return config.title;
        }
        return isPieChart(type) ? null : {
            text: config.title,
            subtext: config.subtitle || '',
            x: 50
        };
    }
    function formatKMBT(y, formatter) {
        if (!formatter) {
            formatter = function (v) {
                return Math.round(v * 100) / 100;
            };
        }
        y = Math.abs(y);
        if (y >= 1000000000000) {
            return formatter(y / 1000000000000) + 'T';
        } else if (y >= 1000000000) {
            return formatter(y / 1000000000) + 'B';
        } else if (y >= 1000000) {
            return formatter(y / 1000000) + 'M';
        } else if (y >= 1000) {
            return formatter(y / 1000) + 'K';
        } else if (y < 1 && y > 0) {
            return formatter(y);
        } else if (y === 0) {
            return '';
        } else {
            return formatter(y);
        }
    }
    var bmap_params = {
        center: [104.114129, 37.550339],
        zoom: 5,
        roam: true,
        mapStyle: {
            styleJson: [
                {
                    "featureType": "background",
                    "elementType": "all",
                    "stylers": {
                        "color": "#34536300"
                    }
                }
            ]
        }
    };
    //将只有城市的数组转成地图所需的数据格式.
    function cityNameArrToMapData(map_data, city_name_arr) {
        if (city_name_arr) {
            var temp_city_value_arr = [];
            //只有城市 == 每个城市的数值为1
            for (var key in city_name_arr) {
                temp_city_value_arr.push(1);
            }
            cityNameWithValueToMapData(map_data, city_name_arr, temp_city_value_arr);
        }
    }

    //将城市名称和数值的数组转成地图所需的数据格式.
    function cityNameWithValueToMapData(map_data, city_name_arr, city_value_arr) {
        if (city_name_arr) {
            if (city_name_arr.length === city_value_arr.length) {
                for (var key in city_name_arr) {
                    pushMapData(map_data, city_name_arr[key], city_value_arr[key]);
                }
            }
        }
    }
    //地图所需数据格式增加数据
    //data_name:需要增加的城市(省份)
    //data_value:需要增加的值
    function pushMapData(map_data, data_name, data_value) {
        var city_name_exist = false;
        if (map_data) {
            for (var key in map_data) {
                if (data_value > 0) {
                    if (map_data[key].name === data_name) {
                        map_data[key].value = map_data[key].value + data_value;
                        city_name_exist = true;
                        break;
                    }
                }
            }
            if (!city_name_exist && data_name !== '' && data_name !== undefined && data_name !== null && data_value > 0) {
                var map_obj = {};
                map_obj['name'] = data_name;
                map_obj['value'] = data_value;
                map_data.push(map_obj);
            }
        }
    }

    //根据城市名称获取坐标数组
    function getCoordMap(city_name) {
        var coor = [];
        if (city_name) {
            if (city_name.length > 0) {
                for (var key in coordinate) {
                    //省，直辖市
                    if (coordinate[key].name === city_name || coordinate[key].name === city_name.replace(/省/, "")) {
                        coor.push(coordinate[key].log);
                        coor.push(coordinate[key].lat);
                        break;
                    } else {
                        //城市
                        for (var childrenKey in coordinate[key].children) {
                            if (coordinate[key].children[childrenKey].name === city_name || coordinate[key].children[childrenKey].name === city_name.replace(/市/, "")) {
                                coor.push(coordinate[key].children[childrenKey].log);
                                coor.push(coordinate[key].children[childrenKey].lat);
                                break;
                            }
                        }
                    }
                }
            }
        }
        // if (coor.length === 0) {
        //     // console.log('城市:' + city_name + '的坐标查不到');
        // }
        return coor;
    }

    function getConfig(config, map_obj) {
        var option = {
            backgroundColor: map_obj.map_background_color,
            title: {
                text: map_obj.map_title,
                subtext: map_obj.map_sub_title,
                sublink: map_obj.map_sub_title_link,
                left: map_obj.map_title_left,
                textStyle: {
                    color: map_obj.map_title_color
                }
            },
            tooltip: {
                trigger: 'item'
            },
            legend: {},
            bmap: map_obj.bmap_data,
            series: []
        };
        return angular.extend(option, config.option || {});
    }

    function getMapData(config, data) {
        var map_obj = {
            map_title: '',//标题
            map_title_left: 'center',//标题位置
            map_title_color: '#ffffff',//标题颜色
            map_sub_title: '',//二级标题
            map_sub_title_link: '',//二级标题链接
            show_all_data_text: '',//右下显示全部按钮文字
            show_all_data_text_color: '#ffffff',//右下显示全部按钮文字颜色
            map_background_color: '#404a59',//背景色
            map_data: data,//绘制地图所需数据
            bmap_data: bmap_params,//绘制地图需要的bmap参数
            order_modal: '1',
            top_num: 999999,//需要重点显示多少个,默认全部显示
            top_point_size: 1,//TOP N城市(地区)标记的圆点的缩放倍数
            top_area_solor: 'blue',//TOP N城市(地区)标记的颜色
            general_point_size: 1,//城市(地区)标记的圆点的缩放倍数
            area_solor: 'red',//城市(地区)名称的颜色
            map_type_change: false//增加地图类型转换功能 透视图、卫星图，街道图。。。
        };
        return angular.extend(map_obj, config.mapdata || {});
    }
    return {
        isPieChart: isPieChart,
        isAxisChart: isAxisChart,
        isHeatmapChart: isHeatmapChart,
        getAxisTicks: getAxisTicks,
        getSeries: getSeries,
        getLegend: getLegend,
        getTooltip: getTooltip,
        getTitle: getTitle,
        formatKMBT: formatKMBT,
        getCoordMap: getCoordMap,
        pushMapData: pushMapData,
        cityNameWithValueToMapData: cityNameWithValueToMapData,
        cityNameArrToMapData: cityNameArrToMapData,
        getConfig: getConfig,
        getMapData: getMapData
    };
}

/**
 * echart 混合类型的生成方法 ，可用作单图例的生成方法
 * @param {*} 配置信息 
 * @param {*} 渲染图表的div元素 （jquery 对象） 
 */
function getMixedLinkFunction(config, element) {
    var ndWrapper = element[0], chart;
    var util = mixedUntil();
    function getOption() {
        var data = util.formatData(config);
        var options = {
            title: util.getTitle(config),
            tooltip: util.getTooltip(config),
            grid: util.getGrid(config),
            legend: util.getLegend(config),
            calculable: true,
            dataZoom: util.getDataZoom(config, data),
            series: util.getSeries(config, data),
        };
        if (config.transpose === '1') {
            options.xAxis = util.getYAxis(config);
            options.yAxis = util.getXAxis(config, data);
            options.dataZoom[0].yAxisIndex = [0];
        }
        else {
            options.xAxis = util.getXAxis(config, data);
            options.yAxis = util.getYAxis(config);
            options.dataZoom[0].xAxisIndex = [0];
        }


        return options;
    }
    function setOption() {
        if (!config || config.field.y.length <= 0 || !config.field.x.field) {
            return;
        }
        if ($(ndWrapper).width() > 320) {
            ndWrapper.style.width = $(ndWrapper).width() + 'px';
            ndWrapper.style.height = $(ndWrapper).width() / 2 + 'px';
        }

        if (config.width && config.width > 0) {
            ndWrapper.style.width = config.width + 'px';
        }
        if (config.height && config.height > 0) {
            ndWrapper.style.height = config.height + 'px';
        }
        chart = echarts.init(ndWrapper);
        var option = getOption();
        if (option.series.length > 0) {
            chart.setOption(option);
        }
    }
    setOption();
}
/**
 * 混合类型图表的依赖方法
 */
function mixedUntil() {
    function formatData(config) {
        if (!config.data) {
            return [];
        }
        var dataSource, dataset;
        if (config.data.url) {
            dataSource = dl.load({ url: config.data.url });
            dataset = dl.read(dataSource, { type: 'json' });
        }
        else {
            dataset = config.data;
        }
        var s = dl.groupby(config.field.x.field).execute(dataset);
        return s;
    }

    function numAdd(num1, num2) {
        var baseNum, baseNum1, baseNum2;
        try {
            baseNum1 = num1.toString().split(".")[1].length;
        } catch (e) {
            baseNum1 = 0;
        }
        try {
            baseNum2 = num2.toString().split(".")[1].length;
        } catch (e) {
            baseNum2 = 0;
        }
        baseNum = Math.pow(10, Math.max(baseNum1, baseNum2) + 1);
        return (num1 * baseNum + num2 * baseNum) / baseNum;
    }

    function countField(data, column) {
        var result = [];
        var summ = function (ary) {
            var xxx = 0;
            ary.map(function (me) {
                xxx = numAdd(xxx, me[column]);
            });
            return xxx;
        };
        data.map(function (a) {
            var b = summ(a.values);
            result.push(b.toFixed(2));
        });
        return result;

    }
    function getSeries(config, data) {
        if (!config.field || !config.field.y) {
            return {};
        }
        var itemStyleArry = ['rgba(255,144,128,1)', 'rgba(0,191,183,1)', 'rgba(252,230,48,1)'];
        var singleSeries, dataset;
        var allSeries = [];
        for (var i = 0; i < config.field.y.length; i++) {
            dataset = countField(data, config.field.y[i].field);
            singleSeries = {
                "name": config.field.y[i].field,
                "type": config.field.y[i].type,
                "stack": "总量",
                "barMaxWidth": 35,
                "barGap": "10%",
                "itemStyle": {
                    "normal": {
                        "color": itemStyleArry[i]
                    }
                },
                "data": dataset,
            };
            if (config.ifmerge !== '1') {
                delete singleSeries.stack;
            }
            if (config.field.y[i].isarea === '1') {
                singleSeries.areaStyle = { normal: {} };
            }
            allSeries.push(singleSeries);
        }
        return allSeries;

    }

    function getTitle(config) {
        var title = {
            "text": "123",
            "subtext": "123",
            x: "4%",

            textStyle: {
                color: '#fff',
                fontSize: '22'
            },
            subtextStyle: {
                color: '#90979c',
                fontSize: '16',

            },
        };
        return angular.extend(title, config.title || {});

    }

    function getTooltip(config) {
        var tooltip = {
            "trigger": "axis",
            "axisPointer": {
                "type": "shadow",
                textStyle: {
                    color: "#fff"
                }

            },
        };
        return angular.extend(tooltip, config.tooltip || {});
    }

    function getGrid(config) {
        var grid = {
            "borderWidth": 0,
            "top": 110,
            "left": 100,
            "bottom": 95,
            textStyle: {
                color: "#fff"
            }
        };
        return angular.extend(grid, config.grid || {});
    }

    function getLegend(config) {
        if (!config.field || !config.field.y) {
            return;
        }
        var legendData = [];
        for (var s = 0; s < config.field.y.length; s++) {
            legendData.push(config.field.y[s].field);
        }
        var legend = {
            x: '4%',
            top: '11%',
            textStyle: {
                color: '#90979c',
            },
            "data": legendData
        };
        return legend;
    }

    function getXAxis(config, data) {
        if (!config.field || !config.field.x.field) {
            return {};
        }
        var xisdata = data.map(function (index) {
            return index[config.field.x.field];
        });

        var xAxis = [{
            "type": "category",
            "data": xisdata,
        }];
        return xAxis;
    }

    function getYAxis(config) {
        var yAxis = [{
            "type": "value"
        }];
        return yAxis;
    }
    function getDataZoom(config, data) {
        if (data.length < 6) {
            return [];
        }
        var dataZoom = [{
            "show": true,
            textStyle: {
                color: "#fff"
            },
            borderColor: "#90979c"
        }];
        return dataZoom;
    }
    return {
        getSeries: getSeries,
        getTitle: getTitle,
        getDataZoom: getDataZoom,
        getGrid: getGrid,
        getLegend: getLegend,
        getTooltip: getTooltip,
        getXAxis: getXAxis,
        getYAxis: getYAxis,
        formatData: formatData
    };
}
/**
 * dack 主题的注入方法
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'echarts'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('echarts'));
    } else {
        // Browser globals
        factory({}, root.echarts);
    }
}(this, function (exports, echarts) {
    var log = function (msg) {
        if (typeof console !== 'undefined') {
            if (console && console.error) {
                console.error(msg);
            }
        }
    };
    if (!echarts) {
        log('ECharts is not Loaded');
        return;
    }
    var contrastColor = '#eee';
    var axisCommon = function () {
        return {
            axisLine: {
                lineStyle: {
                    color: contrastColor
                }
            },
            axisTick: {
                lineStyle: {
                    color: contrastColor
                }
            },
            axisLabel: {
                textStyle: {
                    color: contrastColor
                }
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#aaa'
                }
            },
            splitArea: {
                areaStyle: {
                    color: contrastColor
                }
            }
        };
    };

    var colorPalette = ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7e53', '#eedd78', '#73a373', '#73b9bc', '#7289ab', '#91ca8c', '#f49f42'];
    var theme = {
        color: colorPalette,
        backgroundColor: '#333',
        tooltip: {
            axisPointer: {
                lineStyle: {
                    color: contrastColor
                },
                crossStyle: {
                    color: contrastColor
                }
            }
        },
        legend: {
            textStyle: {
                color: contrastColor
            }
        },
        textStyle: {
            color: contrastColor
        },
        title: {
            textStyle: {
                color: contrastColor
            }
        },
        toolbox: {
            iconStyle: {
                normal: {
                    borderColor: contrastColor
                }
            }
        },
        dataZoom: {
            textStyle: {
                color: contrastColor
            }
        },
        visualMap: {
            textStyle: {
                color: contrastColor
            }
        },
        timeline: {
            lineStyle: {
                color: contrastColor
            },
            itemStyle: {
                normal: {
                    color: colorPalette[1]
                }
            },
            label: {
                normal: {
                    textStyle: {
                        color: contrastColor
                    }
                }
            },
            controlStyle: {
                normal: {
                    color: contrastColor,
                    borderColor: contrastColor
                }
            }
        },
        timeAxis: axisCommon(),
        logAxis: axisCommon(),
        valueAxis: axisCommon(),
        categoryAxis: axisCommon(),

        line: {
            symbol: 'circle'
        },
        graph: {
            color: colorPalette
        },
        gauge: {
            title: {
                textStyle: {
                    color: contrastColor
                }
            }
        },
        candlestick: {
            itemStyle: {
                normal: {
                    color: '#FD1050',
                    color0: '#0CF49B',
                    borderColor: '#FD1050',
                    borderColor0: '#0CF49B'
                }
            }
        }
    };
    theme.categoryAxis.splitLine.show = false;
    echarts.registerTheme('dark', theme);
}));

/**
 * infographic 主题的注入方法
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'echarts'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('echarts'));
    } else {
        // Browser globals
        factory({}, root.echarts);
    }
}(this, function (exports, echarts) {
    var log = function (msg) {
        if (typeof console !== 'undefined') {
            if (console && console.error) {
                console.error(msg);
            }
        }
    };
    if (!echarts) {
        log('ECharts is not Loaded');
        return;
    }

    var colorPalette = [
        '#C1232B', '#27727B', '#FCCE10', '#E87C25', '#B5C334',
        '#FE8463', '#9BCA63', '#FAD860', '#F3A43B', '#60C0DD',
        '#D7504B', '#C6E579', '#F4E001', '#F0805A', '#26C0C0'
    ];

    var theme = {

        color: colorPalette,

        title: {
            textStyle: {
                fontWeight: 'normal',
                color: '#27727B'
            }
        },

        visualMap: {
            color: ['#C1232B', '#FCCE10']
        },

        toolbox: {
            iconStyle: {
                normal: {
                    borderColor: colorPalette[0]
                }
            }
        },

        tooltip: {
            backgroundColor: 'rgba(50,50,50,0.5)',
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: '#27727B',
                    type: 'dashed'
                },
                crossStyle: {
                    color: '#27727B'
                },
                shadowStyle: {
                    color: 'rgba(200,200,200,0.3)'
                }
            }
        },

        dataZoom: {
            dataBackgroundColor: 'rgba(181,195,52,0.3)',
            fillerColor: 'rgba(181,195,52,0.2)',
            handleColor: '#27727B'
        },

        categoryAxis: {
            axisLine: {
                lineStyle: {
                    color: '#27727B'
                }
            },
            splitLine: {
                show: false
            }
        },

        valueAxis: {
            axisLine: {
                show: false
            },
            splitArea: {
                show: false
            },
            splitLine: {
                lineStyle: {
                    color: ['#ccc'],
                    type: 'dashed'
                }
            }
        },

        timeline: {
            lineStyle: {
                color: '#27727B'
            },
            controlStyle: {
                normal: {
                    color: '#27727B',
                    borderColor: '#27727B'
                }
            },
            symbol: 'emptyCircle',
            symbolSize: 3
        },

        line: {
            itemStyle: {
                normal: {
                    borderWidth: 2,
                    borderColor: '#fff',
                    lineStyle: {
                        width: 3
                    }
                },
                emphasis: {
                    borderWidth: 0
                }
            },
            symbol: 'circle',
            symbolSize: 3.5
        },

        candlestick: {
            itemStyle: {
                normal: {
                    color: '#C1232B',
                    color0: '#B5C334',
                    lineStyle: {
                        width: 1,
                        color: '#C1232B',
                        color0: '#B5C334'
                    }
                }
            }
        },

        graph: {
            color: colorPalette
        },

        map: {
            label: {
                normal: {
                    textStyle: {
                        color: '#C1232B'
                    }
                },
                emphasis: {
                    textStyle: {
                        color: 'rgb(100,0,0)'
                    }
                }
            },
            itemStyle: {
                normal: {
                    areaColor: '#ddd',
                    borderColor: '#eee'
                },
                emphasis: {
                    areaColor: '#fe994e'
                }
            }
        },

        gauge: {
            axisLine: {
                lineStyle: {
                    color: [[0.2, '#B5C334'], [0.8, '#27727B'], [1, '#C1232B']]
                }
            },
            axisTick: {
                splitNumber: 2,
                length: 5,
                lineStyle: {
                    color: '#fff'
                }
            },
            axisLabel: {
                textStyle: {
                    color: '#fff'
                }
            },
            splitLine: {
                length: '5%',
                lineStyle: {
                    color: '#fff'
                }
            },
            title: {
                offsetCenter: [0, -20]
            }
        }
    };

    echarts.registerTheme('infographic', theme);
}));
/**
 * macarons 主题的注入方法 
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'echarts'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('echarts'));
    } else {
        // Browser globals
        factory({}, root.echarts);
    }
}(this, function (exports, echarts) {
    var log = function (msg) {
        if (typeof console !== 'undefined') {
            if (console && console.error) {
                console.error(msg);
            }
        }
    };
    if (!echarts) {
        log('ECharts is not Loaded');
        return;
    }

    var colorPalette = [
        '#2ec7c9', '#b6a2de', '#5ab1ef', '#ffb980', '#d87a80',
        '#8d98b3', '#e5cf0d', '#97b552', '#95706d', '#dc69aa',
        '#07a2a4', '#9a7fd1', '#588dd5', '#f5994e', '#c05050',
        '#59678c', '#c9ab00', '#7eb00a', '#6f5553', '#c14089'
    ];


    var theme = {
        color: colorPalette,

        title: {
            textStyle: {
                fontWeight: 'normal',
                color: '#008acd'
            }
        },

        visualMap: {
            itemWidth: 15,
            color: ['#5ab1ef', '#e0ffff']
        },

        toolbox: {
            iconStyle: {
                normal: {
                    borderColor: colorPalette[0]
                }
            }
        },

        tooltip: {
            backgroundColor: 'rgba(50,50,50,0.5)',
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: '#008acd'
                },
                crossStyle: {
                    color: '#008acd'
                },
                shadowStyle: {
                    color: 'rgba(200,200,200,0.2)'
                }
            }
        },

        dataZoom: {
            dataBackgroundColor: '#efefff',
            fillerColor: 'rgba(182,162,222,0.2)',
            handleColor: '#008acd'
        },

        grid: {
            borderColor: '#eee'
        },

        categoryAxis: {
            axisLine: {
                lineStyle: {
                    color: '#008acd'
                }
            },
            splitLine: {
                lineStyle: {
                    color: ['#eee']
                }
            }
        },

        valueAxis: {
            axisLine: {
                lineStyle: {
                    color: '#008acd'
                }
            },
            splitArea: {
                show: true,
                areaStyle: {
                    color: ['rgba(250,250,250,0.1)', 'rgba(200,200,200,0.1)']
                }
            },
            splitLine: {
                lineStyle: {
                    color: ['#eee']
                }
            }
        },

        timeline: {
            lineStyle: {
                color: '#008acd'
            },
            controlStyle: {
                normal: { color: '#008acd' },
                emphasis: { color: '#008acd' }
            },
            symbol: 'emptyCircle',
            symbolSize: 3
        },

        line: {
            smooth: true,
            symbol: 'emptyCircle',
            symbolSize: 3
        },

        candlestick: {
            itemStyle: {
                normal: {
                    color: '#d87a80',
                    color0: '#2ec7c9',
                    lineStyle: {
                        color: '#d87a80',
                        color0: '#2ec7c9'
                    }
                }
            }
        },

        scatter: {
            symbol: 'circle',
            symbolSize: 4
        },

        map: {
            label: {
                normal: {
                    textStyle: {
                        color: '#d87a80'
                    }
                }
            },
            itemStyle: {
                normal: {
                    borderColor: '#eee',
                    areaColor: '#ddd'
                },
                emphasis: {
                    areaColor: '#fe994e'
                }
            }
        },

        graph: {
            color: colorPalette
        },

        gauge: {
            axisLine: {
                lineStyle: {
                    color: [[0.2, '#2ec7c9'], [0.8, '#5ab1ef'], [1, '#d87a80']],
                    width: 10
                }
            },
            axisTick: {
                splitNumber: 10,
                length: 15,
                lineStyle: {
                    color: 'auto'
                }
            },
            splitLine: {
                length: 22,
                lineStyle: {
                    color: 'auto'
                }
            },
            pointer: {
                width: 5
            }
        }
    };

    echarts.registerTheme('macarons', theme);
}));

/**
 * roma 主题的注入方法
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'echarts'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('echarts'));
    } else {
        // Browser globals
        factory({}, root.echarts);
    }
}(this, function (exports, echarts) {
    var log = function (msg) {
        if (typeof console !== 'undefined') {
            if (console && console.error) {
                console.error(msg);
            }
        }
    };
    if (!echarts) {
        log('ECharts is not Loaded');
        return;
    }

    var colorPalette = ['#E01F54', '#001852', '#f5e8c8', '#b8d2c7', '#c6b38e',
        '#a4d8c2', '#f3d999', '#d3758f', '#dcc392', '#2e4783',
        '#82b6e9', '#ff6347', '#a092f1', '#0a915d', '#eaf889',
        '#6699FF', '#ff6666', '#3cb371', '#d5b158', '#38b6b6'
    ];

    var theme = {
        color: colorPalette,

        visualMap: {
            color: ['#e01f54', '#e7dbc3'],
            textStyle: {
                color: '#333'
            }
        },

        candlestick: {
            itemStyle: {
                normal: {
                    color: '#e01f54',
                    color0: '#001852',
                    lineStyle: {
                        width: 1,
                        color: '#f5e8c8',
                        color0: '#b8d2c7'
                    }
                }
            }
        },

        graph: {
            color: colorPalette
        },

        gauge: {
            axisLine: {
                lineStyle: {
                    color: [[0.2, '#E01F54'], [0.8, '#b8d2c7'], [1, '#001852']],
                    width: 8
                }
            }
        }
    };

    echarts.registerTheme('roma', theme);
}));

/**
 * shine 主题的注入方法
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'echarts'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('echarts'));
    } else {
        // Browser globals
        factory({}, root.echarts);
    }
}(this, function (exports, echarts) {
    var log = function (msg) {
        if (typeof console !== 'undefined') {
            if (console && console.error) {
                console.error(msg);
            }
        }
    };
    if (!echarts) {
        log('ECharts is not Loaded');
        return;
    }

    var colorPalette = [
        '#c12e34', '#e6b600', '#0098d9', '#2b821d',
        '#005eaa', '#339ca8', '#cda819', '#32a487'
    ];

    var theme = {

        color: colorPalette,

        title: {
            textStyle: {
                fontWeight: 'normal'
            }
        },

        visualMap: {
            color: ['#1790cf', '#a2d4e6']
        },

        toolbox: {
            iconStyle: {
                normal: {
                    borderColor: '#06467c'
                }
            }
        },

        tooltip: {
            backgroundColor: 'rgba(0,0,0,0.6)'
        },

        dataZoom: {
            dataBackgroundColor: '#dedede',
            fillerColor: 'rgba(154,217,247,0.2)',
            handleColor: '#005eaa'
        },

        timeline: {
            lineStyle: {
                color: '#005eaa'
            },
            controlStyle: {
                normal: {
                    color: '#005eaa',
                    borderColor: '#005eaa'
                }
            }
        },

        candlestick: {
            itemStyle: {
                normal: {
                    color: '#c12e34',
                    color0: '#2b821d',
                    lineStyle: {
                        width: 1,
                        color: '#c12e34',
                        color0: '#2b821d'
                    }
                }
            }
        },

        graph: {
            color: colorPalette
        },

        map: {
            label: {
                normal: {
                    textStyle: {
                        color: '#c12e34'
                    }
                },
                emphasis: {
                    textStyle: {
                        color: '#c12e34'
                    }
                }
            },
            itemStyle: {
                normal: {
                    borderColor: '#eee',
                    areaColor: '#ddd'
                },
                emphasis: {
                    areaColor: '#e6b600'
                }
            }
        },

        gauge: {
            axisLine: {
                show: true,
                lineStyle: {
                    color: [[0.2, '#2b821d'], [0.8, '#005eaa'], [1, '#c12e34']],
                    width: 5
                }
            },
            axisTick: {
                splitNumber: 10,
                length: 8,
                lineStyle: {
                    color: 'auto'
                }
            },
            axisLabel: {
                textStyle: {
                    color: 'auto'
                }
            },
            splitLine: {
                length: 12,
                lineStyle: {
                    color: 'auto'
                }
            },
            pointer: {
                length: '90%',
                width: 3,
                color: 'auto'
            },
            title: {
                textStyle: {
                    color: '#333'
                }
            },
            detail: {
                textStyle: {
                    color: 'auto'
                }
            }
        }
    };
    echarts.registerTheme('shine', theme);
}));
