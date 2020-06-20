(function () {
    var shadowblurwidth = 0;
    function getLinkFunction($http, util) {
        return function (scope, element) {
            scope.config = scope.config || {};
            var mainCanvas = element.find('div')[0], width, height, chart;
            function getSizes(config) {
                width = config.width || 320;
                height = config.height || 240;
                mainCanvas.style.width = width + 'px';
                mainCanvas.style.height = height + 'px';
                $(mainCanvas).css('position','relative');
            }
            function convertData(data,config,pointrow,rawdata) {
                var res = [];
                for (var i = 0; i < data.length; i++) {
                    if(pointrow.lon&&pointrow.lon.field&&pointrow.lat&&pointrow.lat.field)//配置里包含经纬度
                    {
                        res.push({
                            name: data[i].name,
                            field:pointrow.y.field,
                            value: [data[i].lon,data[i].lat,data[i].value],
                            count: data[i].value
                        });
                    }
                    else
                    {
                        //坐标数组
                        var geoCoord = util.getCoordMap(data[i].name);
                        if (geoCoord) {
                            if (geoCoord.concat(data[i].value).length == '3') {
                                var thisdata = geoCoord.concat(data[i].value);

                                res.push({
                                    name: data[i].name,
                                    field:pointrow.y.field,
                                    value: thisdata,
                                    count: data[i].value
                                });
                            }
                        }
                    }
                }
            
                return res;
            }
            function getOptions(data, config, type) {

                // merge default config
                var options;
                if (type !== 'bmap' && type !== 'single') {
                    config = angular.extend({
                        showXAxis: true,
                        showYAxis: true,
                        showLegend: true
                    }, config);
                    /*if(util.isAxisChart(config.data.type))//柱图曲线单指标时,topN的data提前过滤//转后台处理
                    {
                        if(config.field.y&&config.field.y.length==1)
                        {
                            var topType = config.field.y[0].aggregate;
                            var topNum = config.field.y[0].aggregatevalue;
                            if(topType=="topn"||topType=="lastn")
                            {
                                if(topNum!=null&&topNum!=""&&!isNaN(topNum))
                                {
                                    data = dl.groupby(config.field.x.field).execute(data);
                                    var field = config.field.y[0].field;
                                    data = data.map(function (index) {
                                        var a = {};
                                        a[config.field.x.field] = index[config.field.x.field];
                                        a[config.field.y[0].field] = util.summaryNumber(index.values,field,'sum');
                                        return a;
                                    });
                                    data = data.sort(function (a, b) {
                                        return topType=="topn"?(Number(b[field]) - Number(a[field])):(Number(a[field]) - Number(b[field]));
                                    }).slice(0, topNum);
                                }
                            }
                        }
                    }*/

                    if(util.isPieChart(config.data.type)&&config.field.x[0]&&config.field.x[0].selfgroupcount>0||(config.field.x&&config.field.x.selfgroupcount>0)) //维度按值划分 兼容柱图和饼图
                    {
                        var xfield = config.field.x[0]||config.field.x;
                        var newdata = [];
                        data.map(function(idata,index){
                            var tag = false;
                            for(var i=0;i<xfield.groupConfigs.length;i++)
                            {
                                if(angular.isNumber(parseFloat(xfield.groupConfigs[i]["valuestart"]))&&angular.isNumber(parseFloat(xfield.groupConfigs[i]["valueend"])))
                                {
                                    if(Number(xfield.groupConfigs[i]["valuestart"])<=Number(data[index][xfield.field])&&Number(data[index][xfield.field])<=Number(xfield.groupConfigs[i]["valueend"]))
                                    {
                                        var obj = {};
                                        obj[xfield.field]=xfield.groupConfigs[i]["name"];
                                        if(config.field.y[0]&&config.field.y[0].field)
                                        {
                                            config.field.y.map(function(yfield){
                                            obj[yfield.field] = data[index][yfield.field];
                                            });
                                        }
                                        else
                                            obj[config.field.y.field] = data[index][config.field.y.field];
                                        newdata.push(obj);
                                        tag = true;
                                        break;
                                    }
                                }
                            }
                            if(!tag)
                                newdata.push(idata);
                        });
                        data = newdata;
                    }

                    var xAxis = util.getXAxis(config, data);
                    var yAxis = util.getYAxis(config);
                    // basic config


                    options = {
                        title: util.getTitle(config),
                        tooltip: util.getTooltip(config),
                        legend: angular.extend(util.getLegend(data, config), config.legend || {}),
                        xAxis: xAxis,
                        yAxis: yAxis,
                        series: util.getSeries(data, config),
                        visualMap: config.visualMap ? config.visualMap : null
                        // dataZoom: util.isAxisChart(config.data.type) ? util.getDataZoom(config, data) : null
                    };
                    options.legend.show = config.legend && config.legend.show == '2' ? false : true;
                     if(config.legend&&config.legend.fontSize&&config.legend.fontSize!=""&&options.legend["textStyle"])
                        options.legend["textStyle"] = angular.extend(options.legend["textStyle"],{fontSize:config.legend.fontSize});
                    if(config.data.type=="candlestick")//K线图
                    {
                        options.tooltip = {
                            trigger: 'axis',
                            axisPointer: {
                                animation: false,
                                type: 'cross',
                                lineStyle: {
                                    color: '#376df4',
                                    width: 2,
                                    opacity: 1
                                }
                            }
                        }
                    }
                    if (util.isAxisChart(config.data.type)) {
                        if (config.transpose === '1') {
                            options.xAxis = yAxis;
                            options.yAxis = xAxis;
                            // if (options.dataZoom.length > 0 && options.dataZoom[0]) {
                            //     options.dataZoom[0].yAxisIndex = [0];
                            // }
                        }
                        else {
                            //options.xAxis = util.getXAxis(config, data);上面已赋值,无需再赋值
                            //options.yAxis = util.getYAxis(config);
                            // if (options.dataZoom.length > 0 && options.dataZoom[0]) {
                            //     options.dataZoom[0].xAxisIndex = [0];
                            // }
                        }
                        if(config.data.type=="dbar")//堆积柱
                        {
                            options.xAxis = {
                                splitLine: {
                                    show: false
                                },
                                axisLabel: {
                                    show: false
                                }
                            };
                            options.yAxis = {
                                splitLine: {
                                    show: false
                                }
                            }
                            delete options.legend;
                        }
                        if (config.roominout === '1'||config.data.type=="candlestick") {//x轴数据过多时,增加缩放功能)//K线图配置项
                            options.dataZoom =[
                                {
                                    show: true,
                                    start: 94,
                                    end: 100
                                },
                                {
                                    type: 'inside',
                                    start: 94,
                                    end: 100
                                }
                            ];
                        }
                        else {
                            delete options.dataZoom
                        }
                    }
                    if (!config.showXAxis) {
                        angular.forEach(options.xAxis, function (axis) {
                            axis.axisLine = { show: false };
                            axis.axisLabel = { show: false };
                            axis.axisTick = { show: false };
                        });
                    }
                    if (config.showaxis==='1') {
                        angular.forEach(options.xAxis, function (axis) {
                            axis.axisLine = { show: false };
                            axis.axisTick = { show: false };
                        });
                    }
                    if (!config.showYAxis||config.showaxis==='1') {
                        angular.forEach(options.yAxis, function (axis) {
                            axis.axisLine = { show: false };
                            axis.axisLabel = { show: false };
                            axis.axisTick = { show: false };
                        });
                    }
                    if(config.showaxissplitline==='1')
                        angular.forEach(options.yAxis, function (axis) {
                            axis.splitLine = { show: false };
                        });
                    if (!config.showLegend || type === 'gauge') {
                        delete options.legend;
                    }
                    if (!util.isAxisChart(type) && type !== 'scatter') {
                        delete options.xAxis;
                        delete options.yAxis;
                        // delete options.dataZoom;
                    }
                    if (config.grid) {
                        delete options.grid;
                        // options.grid = config.grid;
                        // if (config.transpose === '1') {
                        //     delete options.grid;
                        // }
                    }
                    if (type === 'scatter') {
                        options.visualMap = util.getVisualMap(data, config);
                    }

                    if (type === 'radar') {
                        delete options.xAxis;
                        delete options.yAxis;
                        delete options.visualMap;
                        // delete options.dataZoom;
                        options.radar = {
                            name: {
                                textStyle: {
                                    color: '#fff',
                                    backgroundColor: '#999',
                                    borderRadius: 3,
                                    padding: [3, 5]
                                }
                            },
                            indicator: util.getIndicator(data, config)
                        };

                    }
                    if(type ==="sunburst"){
                        delete options.legend;
                    }
                }
               
                else if (util.isMapChart(type)) {
                    if (!config.data) {
                        return;
                    }
                    // var map_data = util.mapEchart(config, data);
                    var map_obj = util.getMapData(config);
                    options = util.getConfig(config, map_obj);
                    options.series = [];
                    if (data.length > 0) {
                        if (config.mapdata.ifBmap == '2' && config.area.x.field && config.area.y.field) {
                            var allAreaData = util.mapEchart(config.area, data);
                            var allArea = ["北京", "天津", "上海", "重庆", "河北", "河南","Henan", "云南", "辽宁", "黑龙江", "湖南", "安徽", "山东", "新疆", "江苏", "浙江", "江西", "湖北", "广西", "甘肃", "山西", "内蒙古", "陕西", "吉林", "福建", "贵州", "广东", "青海", "西藏", "四川", "宁夏", "海南", "台湾", "香港", "澳门"];
                            var araeData = allAreaData.filter(function (row) {
                                return allArea.indexOf(row.name) >= 0;
                            });
                            options.series.push(
                                {
                                    type: 'scatter',
                                    coordinateSystem: 'geo',
                                    data: []
                                });
                            options.series.push({
                                name: '',
                                type: 'map',
                                geoIndex: 0,
                                tooltip: {
                                    show: true
                                },
                                data: araeData,
                                itemStyle:{
                                    normal: {
                                        shadowBlur: shadowblurwidth,
                                        shadowColor: 'rgba(40, 40, 40, 0.5)'
                                    }
                                }
                            });
                            var maxAry = araeData.sort(function (a, b) {
                                return b.value - a.value;
                            });
                            options.visualMap = {
                                min: 0,
                                max: maxAry[0]['value'],
                                text: ['High', 'Low'],
                                seriesIndex: [1],
                                inRange: {
                                    color: config.mapdata.map_theme === 'dark' ? ["#a8e0ef", "#5e93ff"] : ["#b1d46c", "#3ebbb7"]
                                },
                                calculable: false
                            };
                        }
                        var map_data;
                        config.point.map(function (pointrow,idx) {
                            map_data = util.mapEchart(pointrow, data);
                            map_data = util.getTopNData(pointrow.y.aggregate,pointrow.y.aggregatevalue,map_data,"value");
                            var convered_data = convertData(map_data,config,pointrow,data);
                            options.series.push({
                                name: map_obj.show_all_data_text,
                                type: 'scatter',
                                coordinateSystem: config.mapdata.ifBmap === '1' ? 'bmap' : 'geo',
                                data: convered_data,
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
                                       //tooltip全部显示其他指标
                                            var res = d.data.name+"<br/>";
                                            var datas = options.series;
                                            datas.map(function(val){
                                                for (var i = 0; i < val.data.length; i++) {
                                                  if(d.data.name == val.data[i].name){
                                                      if(val.data[i].field)
                                                        res += val.data[i].field + '：'+val.data[i].count+"<br/>";
                                                      break;
                                                  }
                                                }
                                            });
                                           return res;
                                           //return d.data.name + ':' + d.data.count;
                                    }
                                },
                                itemStyle: {
                                    normal: {
                                        color: pointrow.x.color
                                    }
                                }
                            });

                            if (pointrow.x.iftop == 'true' && angular.isNumber(parseInt(pointrow.x.order_num)) && pointrow.x.order_num > 0) {
                                var newdata;
                                if (pointrow.x.order == 'asc') {
                                    newdata = convered_data.sort(function (a, b) {
                                        return b.count - a.count;
                                    });
                                }
                                else {
                                    newdata = convered_data.sort(function (a, b) {
                                        return a.count - b.count;
                                    });
                                }
                                options.series.push({
                                    name: 'Top show',
                                    type: 'effectScatter',
                                    coordinateSystem: config.mapdata.ifBmap === '1' ? 'bmap' : 'geo',
                                    data: newdata.slice(0, pointrow.x.order_num),
                                    symbolSize: function (val) {
                                        return val[2] / 30;//(30) * map_obj.top_point_size;
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
                                            color: pointrow.x.top_color,
                                            shadowBlur: 10,
                                            shadowColor: '#05C3F9'
                                        }
                                    },
                                });
                            }
                        });

                        if (config.mapdata.ifBmap === '1') {
                            delete options.geo;
                        }

                        if (config.mapdata.ifBmap === '2') {
                            delete options.bmap;
                        }
                    }

                }
                return options;
            }

            function setOption() {
                if (!scope.config || !scope.config.data || !scope.data) {
                    return;
                }
                if (!util.isMapChart(scope.config.data.type)) {
                    if (!scope.config.field) {
                        return;
                    }
                }
                else {
                    if (!scope.config || !scope.data || (scope.config.point.length == 0 && !scope.config.area.x.field)) {
                        return;
                    }
                }
                // var template = '<div class="loading" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.3);z-index:2">loading</div>';
                // $(mainCanvas).append(template);
                getSizes(scope.config);

                // debugger;
                var chartData = util.filterData(scope.data, scope.config);//修改成配置修改后获取
                //如果是单指标排名就封装请求url，否则不进行处理
                // if (scope.config.field.x && scope.config.field.y[0].aggregate == "rank"){//单指标排名
                //     var gcolumn = scope.config.field.x;
                //     var tcolumn = scope.config.field.group;
                //     var url = scope.config.data.url.indexOf("?")>0?scope.config.data.url:(scope.config.data.url+"?");
                //     url += "gcol="+gcolumn.field+"&kpicol="+row.field;
                //     if(tcolumn)
                //         url+="&tcol="+tcolumn.field;
                //     var filters = SinglefilterJSON(scope.config);
                //     if(filters.length>0)
                //         url += "&filters="+JSON.stringify(filters);
                //     if (config.data.url.indexOf("getOlapDataShow") != -1){//替换url
                //         url = config.data.url
                //     }else{
                //         url = config.data.url.replace('getOlapData','getOlapDataShow')
                //     }
                //
                // }
                //单指标排名封装url结束

                if (scope.config.data.url.indexOf("getOlapDataShow") != -1){
                    url = scope.config.data.url
                }else{
                    url = scope.config.data.url.replace('getOlapData','getOlapDataShow')
                }
                if(scope.config.data.type !== 'single'){
                        util.initTheme();
                        chart = echarts.init(mainCanvas, scope.config.theme);
                        chart.showLoading({text:'',effect : 'spin'});
                }
                 $http({
                    method: 'POST',
                    url: encodeURI(url),
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    data: {'config':JSON.stringify(scope.config)}
                }).then(function (rs) {
                    chartData = rs.data;
                    if (scope.config.data.type === 'single') {
                        $(mainCanvas).empty();
                        $(mainCanvas).append('<div class="canvas" ></div>');
                        util.getGraphic(chartData, scope.config,mainCanvas);
                    }
                    else{
                        // delete  scope.config.title.textStyle.fontSize;
                        // delete  scope.config.title.subtextStyle.fontSize;
                        var option = getOptions(chartData, scope.config, scope.config.data.type);
                        if(option.yAxis&&option.yAxis[0]&&option.yAxis[0].axisLabel)
                            option.yAxis[0].axisLabel.formatter = function (value) {
                                    var reg = new RegExp("^\\d+(.\\d+)?$");
                                    if(reg.test(Math.abs(value))){//是数值
                                        var ucount = scope.config.field.y[0].unitcount||0;
                                        if(scope.config.field&&scope.config.field.y&&scope.config.field.y[0]&&scope.config.field.y[0].yunit&&scope.config.field.y[0].yunit!='')//指定了单位
                                        {
                                            //兼容部分安卓浏览器千分位return parseFloat(parseFloat(value).toFixed(ucount)).toLocaleString() + scope.config.field.y[0].yunit;
                                            return formatNumber(parseFloat(value).toFixed(ucount)) + scope.config.field.y[0].yunit;
                                        }
                                        var numUnite='';
                                        //value = parseFloat(value).toLocaleString();//千分位
                                        value = formatNumber(value);
                                        return value+numUnite;
                                    }else{//是文本,采用倾斜方案
                                        if (scope.config.roatetext!=="1"&&value.length > 7) {
                                            return value.substring(0, 7) + "...";
                                        }
                                        else {
                                            return value;
                                        }
                                    }
                                }

                        if (option.series&&option.series.length > 0||(scope.config.data.type==="sunburst"&&option.series.data)) {
                            if(scope.config.axisin&&scope.config.axisin==="1")
                                option.grid = {containLabel :true};//Y轴文字太长时间会越界
                            if (scope.config.data.type !== 'bmap'){
                                if(scope.config.field.x&&scope.config.field.x.isgroup==="true")//分组叠加柱,汇总值显示动态更新
                                {
                                    chart.on("legendselectchanged", function (obj) {
                                        var b = obj.selected, d = [];
                                        for (var key in b) {
                                            if (b[key]) {
                                                for (var i = 0, l = option.series.length; i < l; i++) {
                                                    var changename = option.series[i]["name"];
                                                    if (changename == key) {
                                                        d.push(i);//得到状态是true的legend对应的series的下标
                                                    }
                                                }
                                            }
                                        }
                                        var fun1 = function (params) {
                                            var data3 = 0;
                                            for (var i = 0, l = d.length; i < l; i++) {
                                                for (var j = 0, h = option.series.length; j < h; j++) {
                                                    if (d[i] == j) {
                                                        data3 += option.series[j].data[params.dataIndex] //重新计算总和
                                                    }
                                                }
                                            }
                                            return parseFloat(data3).toFixed(scope.config.field.y[0].unitcount||0);
                                        }
                                        for (var sh = 0;sh < option.series.length; sh++) {
                                            if (option.series[sh].label)
                                                option.series[sh]["label"]["normal"]["show"] = false;
                                        }
                                        var showed = d[d.length-1];
                                        if(option.series[showed].label) {
                                            option.series[showed]["label"]["normal"]["show"] = true;
                                            option.series[showed]["label"]["normal"]["formatter"] = fun1;
                                        }else {
                                            option.series[showed].label = {normal:{show:true,position:'top',formatter:fun1}};
                                        }

                                        chart.setOption(option);
                                    })
                                }

                            }

                            console.log(option);
                            //分组叠加柱,或总值显示动态更新end
                            chart.setOption(option);
                            chart.hideLoading();
                        }

                    }
                    if (scope.data.length > 0){
                    //jnp add 此处会导致重复加载
                        //dataWatch();
                    }
                }).catch(function(rs){chart.hideLoading()});
                // $(mainCanvas).find('.loading').remove();
            }
            scope.$watch('config', function (value,oldvalue) {
                if (value && typeof value === 'object') {
                    mainCanvas.innerHTML = '';
                    mainCanvas.removeAttribute('stype');
                    mainCanvas.removeAttribute('_echarts_instance_');
                    setOption();
                }
            }, true);

           var dataWatch =  scope.$watch('data', function (value) {
                if (value && typeof value === 'object') {
                    mainCanvas.innerHTML = '';
                    mainCanvas.removeAttribute('stype');
                    mainCanvas.removeAttribute('_echarts_instance_');
                    setOption();
                }
            }, true);
        };
    }

    var app = angular.module('angular-echart', ['angular-echart.util']);

    app.directive('eChart', ['$http', 'echartutil', function ($http, echartutil) {
        return {
            restrict: 'EA',
            template: '<div class="echart-content"></div>',
            scope: {
                config: '=',
                data: '='
            },
            link: getLinkFunction($http, echartutil)
        };
    }]);

    angular.module('angular-echart.util', []).factory('echartutil', function () {
        function isPieChart(type) {
            return ['pie', 'funnel','wordCloud','treemap','graph','sunburst','tree'].indexOf(type) > -1;
        }
        function isMapChart(type) {
            return ['map', 'bmap'].indexOf(type) > -1;
        }
        function isAxisChart(type) {
            return ['line', 'bar', 'dbar', 'area', 'mixed','candlestick'].indexOf(type) > -1;
        }

        function getXAxis(config, data) {
            if (!config.field || !config.field.x || !config.field.x.field || !data || typeof data !== 'object') {
                return {};
            }
            var xAxis;
            var rotate = config.roatetext==="1"?{interval:0,rotate:20}:{};//轴文字倾斜显示
            if(config.field.x&&config.field.x.xlabelsize&&config.field.x.xlabelsize!="")
                rotate['textStyle']={fontSize:config.field.x.xlabelsize};
            if (config.data.type === 'scatter') {
                if (config.field.y.length > 0) {
                    xAxis = {
                        axisLabel: rotate,
                        "type": "value",
                        "name": config.field.y[0].field
                    };
                }
            }
            else {
                var s = dl.groupby(config.field.x.field).execute(data);
                var xisdata = s.map(function (index) {
                    return index[config.field.x.field];
                });
                xAxis = [{
                    axisLabel: rotate,
                    "type": "category",
                    "data": xisdata
                }];
            }
            return xAxis;
        }

        function getYAxis(config) {
            var yvalue = "value";//默认y轴value
            var rotate = config.roatetext==="1"?{show:config.showaxis!=="1",interval:0,rotate:20}:{show:config.showaxis!=="1"};//轴文字倾斜显示
            if(config.field.x&&config.field.x.xlabelsize&&config.field.x.xlabelsize!="")
                rotate['textStyle']={fontSize:config.field.x.ylabelsize};
            if(config.beauty&&config.beauty==="1")
                yvalue = "log";//美化差值太大,太高太矮显示的问题
            var yAxis;
            if (config.data.type === 'scatter') {
                if (config.field.y.length > 1) {
                    yAxis = {
                        axisLabel: rotate,
                        "type": "value",
                        "name": config.field.y[1].field
                    };
                }
                else {
                    yAxis = {
                        axisLabel:rotate,
                        "type": "value"
                    };
                }
            }
            else {
                yAxis = [{
                    axisLabel: rotate,
                    "type": yvalue
                }];
                if(config.data.type=="candlestick")//K线图
                {
                    yAxis = {
                        axisLabel:rotate,
                        scale: true,
                        axisLine: { lineStyle: { color: '#8392A5' } },
                        splitLine: { show: false }
                    };
                }
            }
            //混合图形多y轴
            if(config&&config.field.y&&config.field.y.map)
                config.field.y.map(function (index,i) {
                    if(i>0&&index.shownewy===true&&index.newy===true)
                    {
                        yAxis.push({
                        axisLabel: rotate,
                            "type": yvalue,
                            splitLine: {
                                show: false
                            },
                            inverse: index.inversey===true?true:false
                        });
                    }
                });
            return yAxis;
        }

        function getTitle(config) {
            var title = {
                textStyle: {
                    color: '#fff',
                    fontSize: '22'
                },
                subtextStyle: {
                    color: '#90979c',
                    fontSize: '16',
                },
            };
            title = angular.extend(title, getPosition(config.title.position, 'title'));
            title = angular.extend(title, config.title || {});
            delete title.position;
            return title;
        }
        function getTooltip(config) {
            var tooltip = {};
            var type = config.data.type;
            switch (type) {
                case 'line':
                case 'area':
                    tooltip.trigger = 'axis';
                    break;
                case 'pie':
                case 'bar':
                case 'bmap':
                case 'gauge':
                    tooltip.trigger = 'item';
                    break;
            }
            if (type === 'pie') {
                tooltip.formatter = '{a} <br/>{b}: {c} ({d}%)';
            }
            if (type === 'bmap' || type === 'map') {
                tooltip.formatter = '{b}';
            }

            if (type === 'scatter') {
                tooltip = {
                    padding: 10,
                    backgroundColor: '#222',
                    borderColor: '#777',
                    borderWidth: 1,
                    formatter: function (obj) {
                        var value = obj.value;
                        var str = "";
                        for (var j = 0; j < config.field.y.length; j++) {
                            str = str + " " + config.field.y[j].field + ':' + value[j] + '<br>';
                        }

                        if (config.field.size && config.field.size.field) {
                            str = str + " " + config.field.size.field + ':' + value[config.field.y.length] + '<br>';
                        }
                        return '<div style="border-bottom: 1px solid rgba(255,255,255,.3); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                            + config.field.x.field + ':' + obj.seriesName
                            + '</div>'
                            + str;
                    }
                };
            }
            return angular.extend(tooltip, angular.isObject(config.tooltip) ? config.tooltip : {});
        }
        function numAdd(num1, num2) {
            if (!checkNumber(num1) || !checkNumber(num2)) {
                return 0;
            }
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
        function countField(data, column,agg) {
            var result = [];
           
            data.map(function (a) {
                var b = summaryNumber(a.values,column,agg);
                result.push(b.toFixed(1));
            });
            /*排名转到后台
            if(agg==="rank")//排名
            {
                result = dl.rank(result,function (val) {
                    return -parseInt(val);//排名按照倒序
                });
            }*/

            return result;

        }
        //逐个叠加汇总,主要用于叠加柱
        function countFieldSum(data, column,agg) {
            var result = [];
            var all=0;
            data.map(function (a) {
                var b = summaryNumber(a.values,column,agg);
                result.push(all.toFixed(1));
                all+=b;
            });
            /*排名转到后台
            if(agg==="rank")//排名
            {
                result = dl.rank(result,function (val) {
                    return -parseInt(val);//排名按照倒序
                });
            }*/
            return result;

        }
         //逐个累计汇总,主要用于逐月累计柱
        function countFieldSumAll(data, column,agg) {
            var result = [];
            var all=0;
            data.map(function (a) {
                var b = summaryNumber(a.values,column,agg);
                all+=b;
                result.push(all.toFixed(1));
            });
            if(agg==="rank")//排名
            {
                result = dl.rank(result,function (val) {
                    return -parseInt(val);//排名按照倒序
                });
            }
            return result;

        }
        function getLegend(data, config) {
            if (!config.field || !config.field.y) {
                return;
            }

            var legend = {
                type: 'scroll',
                data: []
            };
            var type = config.data.type;
            if (isAxisChart(type)) {
                if(config.field.x.isgroup==="true"&&config.field.x.groupField&&config.field.x.groupField.field)//柱图有分组时,显示分组图例
                {
                    var groupfield = config.field.x.groupField.field;
                    var gs = dl.groupby(groupfield).execute(data);
                    angular.forEach(gs, function (serie) {
                        legend.data.push(serie[groupfield]);
                    });
                }
                else
                {
                    for (var s = 0; s < config.field.y.length; s++) {
		     	var name = config.field.y[s].rename || config.field.y[s].field;//增加同比字段后台同名问题的处理
                    	//if(config.field.y[s].aggregate=='yp'||config.field.y[s].aggregate=='yppercent'||config.field.y[s].aggregate=='mp'||config.field.y[s].aggregate=='mppercent'||config.field.y[s].aggregate=='sum'||config.field.y[s].aggregate=='max'||config.field.y[s].aggregate=='min'||config.field.y[s].aggregate=='mean')
                        //	name +="___"+config.field.y[s].aggregate;
                        legend.data.push(name);
                    }
                }
            }
            else if (isPieChart(type)) {
                for (var j = 0; j < config.field.x.length; j++) {
                    if (config.field.x[j].field) {
                        var dataset = dl.groupby(config.field.x[j].field).execute(data);
                        dataset.map(function (index) {
                            legend.data.push(index[config.field.x[j].field]);
                        });
                    }
                }
            }
            else if (type === 'scatter') {
                var sd = dl.groupby(config.field.x.field).execute(data);
                legend.data = sd.map(function (index) {
                    return index[config.field.x.field];
                });
            }
            else if (type === 'radar') {
                var l_data = dl.groupby(config.field.legend.field).execute(data);
                legend.data = l_data.map(function (index) {
                    return index[config.field.legend.field];
                });
            }

            legend = angular.extend(legend, getPosition(config.legend && config.legend.position ? config.legend.position : 'upcenter', 'legend'));
            if(config.legend&&config.legend.fontSize&&config.legend.fontSize!="")
            {
                legend["itemWidth"] = config.legend.fontSize;
                legend["itemHeight"] = config.legend.fontSize;
            }
            // legend.show = config.legend&&config.legend.show == '0'?false:true;   
            return legend;
        }

        function getDataZoom(config, data) {
            if (typeof data !== 'object' || data.length < 6) {
                return [];
            }
            var dataZoom = [{
                "show": true,
                textStyle: {
                    color: "#fff"
                },
                borderColor: "#90979c",
                bottom: '40'
            }];
            return dataZoom;
        }

        function getSeries(data, config) {
            if (!config.data.type) {
                return [];
            }
            var type = config.data.type;
            var dataset, series, range_start, range_end, rs = [];
            if (isPieChart(type)) {
                if(type=="tree")
                {

                    rs.push({
                        type: 'tree',
                        data: [data],
                        top: '7%',
                        left: '7%',
                        bottom: '1%',
                        right: '20%',
                        symbolSize: 7,
                        label: {
                            normal: {
                                position: 'left',
                                verticalAlign: 'middle',
                                align: 'right'
                            }
                        },
                        leaves: {
                            label: {
                                normal: {
                                    position: 'right',
                                    verticalAlign: 'middle',
                                    align: 'left'
                                }
                            }
                        },
                        expandAndCollapse: true,
                        animationDuration: 550,
                        animationDurationUpdate: 750
                    });
                    return rs;
                }
                for (var j = 0; j < config.field.x.length; j++) {
                    if (!config.field.x[j].field) {
                        continue;
                    }
                    range_start = (config.radius_range + config.radius_interval) * j + config.start_radius;
                    range_end = range_start + config.radius_interval;
                    // console.log(j+'>',range_start,range_end);
                    var formatter = "";//config.field.x[j].label && config.field.x[j].label.showpercent == 'true' ? "{b}  {c}/{d}%" : "{b} ({c})";
                    //if(config.legend.show == '1')
                    //{
                    if(config.field.x[j].label&&config.field.x[j].label.showDimeno=='true')formatter += '{b}\n';
                    if(config.field.x[j].label&&config.field.x[j].label.showsums=='true')formatter += '{c}';
                    if(config.field.x[j].label&&config.field.x[j].label.showpercent == 'true' )formatter+=config.field.x[j].label.showsums=='true'?"/{d}%":"{d}%";
                    //}
                    series = {
                        name: config.field.x[j].field,
                        type: type,
                        avoidLabelOverlap: true,
                        selectedMode: 'single',
                        radius: [range_start + '%', range_end + '%'],
                        label: {
                            normal: {
                                show: config.field.x[j].label && config.field.x[j].label.show == 'false' ||formatter===""? false : true,
                                position: config.field.x[j].label && config.field.x[j].label.position ? config.field.x[j].label.position : 'outside',
                                formatter: formatter
                            }
                        },
                        data: [],
                        itemStyle:{
                            normal: {
                                shadowBlur: shadowblurwidth,
                                shadowColor: 'rgba(40, 40, 40, 0.5)'
                            }
                        },
                        labelLine:{
                            normal:{
                                length:1
                            }
                        }
                    };
                    if(type=="funnel")//漏斗图显示百分比
                    {
                        series.label = {
                            normal: {
                                position: 'inside',     // 标签的位置:'left'漏斗图的左侧）、'right'(右侧)、'inside'(内部) [ default: 'outside' ]
                                formatter: '{b} {c} {d}%',      // 标签文本
                                textStyle: {
                                    color: '#000'
                                }
                            }
                        }
                    }
                    if(type=="wordCloud")//词云图
                    {
                        series.textStyle  = {
                            normal : {
                                color : function() {
                                    return 'rgb('
                                            + [ Math.round(Math.random() * 160),
                                                    Math.round(Math.random() * 160),
                                                    Math.round(Math.random() * 160) ]
                                                    .join(',') + ')';
                                }
                            },
                            emphasis : {
                                shadowBlur : 15,
                                shadowColor : '#333'
                            }
                        }
                        series.sizeRange = config.sizeRange;
                        series.shape = config.shape;
                    }
                    if(type=="treemap")//矩阵图
                    {
                        series.label = {
                            normal: {
                                show: 'true',
                                position: 'inside'
                            }
                        };
                    }

                    dataset = dl.groupby(config.field.x[j].field).execute(data);
                    var rowdata;
                    var max = 0;
                    var totalall = summaryNumber(data,config.field.y.field,config.field.y.aggregate);
                    dataset.map(function (index) {
                        rowdata = {};
                        var summry = summaryNumber(index.values, config.field.y.field,config.field.y.aggregate);
                        rowdata['value'] = summry.toFixed(0);
                        rowdata['name'] = index[config.field.x[j].field];
                        if(type=="graph")
                        {
                            rowdata['draggable'] = true;
                            if(parseFloat(summry.toFixed(0))>max)max = parseFloat(summry.toFixed(0))
                        }
                        series.data.push(rowdata);
                        //增加饼图断裂
                        if(config.radius_split>0)
                        {
                            series.data.push({
                                value: Math.round(totalall*parseInt(config.radius_split)/100),
                                name: '',
                                itemStyle: {
                                    normal: {
                                        label: {
                                            show: false
                                        },
                                        labelLine: {
                                            show: false
                                        },
                                        color: 'rgba(0, 0, 0, 0)',
                                        borderColor: 'rgba(0, 0, 0, 0)',
                                        borderWidth: 0
                                    }
                                }
                            });
                        }
                    });
                    if(config.field.x[j].label && config.field.x[j].label.showrose == 'true' )//玫瑰图显示
                    {
                        series.roseType = 'radius';
                        if(config.field.x[j].label.showrosend==='true')
                        {
                            series.roseType = 'area';
                            series.data = series.data.sort(function (a, b) {
                                    return Number(a['value']) - Number(b['value']);
                                });
                        }
                    }
                    if(type=="graph")//关系图,要计算每个节点大小,放在数据后面处理
                    {
                        series.layout = 'force';
                        series.force = {
                            repulsion:100,
                            edgeLength:10
                        };
                        series.symbolSize = function (val) {
                                        return (val / max)*80<25?25:(val / max)*80;//控制最大节点和最小节点
                                    };
                        series.itemStyle = {
                            normal: {
                                shadowBlur: 10,
                                color: function () {
                                    return 'rgb('
                                        + [Math.round(Math.random() * 300),
                                            Math.round(Math.random() * 300),
                                            Math.round(Math.random() * 300)]
                                            .join(',') + ')';
                                }
                            }
                        }
                        if(config.field.relate&&config.field.relate.field)//关联字段
                        {
                            var links=[];
                            dataset.map(function (index) {
                                index.values.map(function(idv){
                                    if(idv[config.field.relate.field]!=null&&idv[config.field.relate.field]!="")
                                    {
                                        links.push({source:index[config.field.x[j]],target:idv[config.field.relate.field]});
                                    }
                                });
                            });
                            series.links = links;
                        }
                        series.roam = true;
                    }

                    var topType = config.field.y.aggregate;
                    var topNum = config.field.y.aggregatevalue;
                    if(topType=="topn"||topType=="lastn")//topN处理过滤
                    {
                        if(topNum!=null&&topNum!=""&&!isNaN(topNum))
                        {
                            series.data = series.data.sort(function (a, b) {
                                return topType=="topn"?(Number(b['value']) - Number(a['value'])):(Number(a['value']) - Number(b['value']));
                            }).slice(0, type=="wordCloud"?(Number(topNum)+1):Number(topNum));
                        }
                    }

                    if(type=="sunburst")//旭日图
                    {
                        series.radius = [0, '90%'];
                        if(config.field.relate&&config.field.relate.field)//关联字段
                        {
                            var relatefield = config.field.relate.field;
                            var array = [];//转children结构
                            var convertChildren = function (treeNodes) {
                                if (!treeNodes || !treeNodes.length) return;
                                var parent,i = 0,obj = {};
                                while(i < treeNodes.length ){
                                    node = treeNodes[i++];
                                    obj[node.id] = node;
                                    if(node.parentId&&node.parentId!=""){
                                        parent = obj[node.parentId];
                                        if(parent.children){
                                            //node["parIndex"] = parent.parIndex +"."+ (parent.children.length + 1);
                                            //node.cell[0] = node["parIndex"];
                                            parent.children.push(node);
                                        }else{
                                            //node["parIndex"] = parent.parIndex +"."+ 1;
                                            //node.cell[0] = node["parIndex"];
                                            parent.children = [node];
                                        }
                                    }else{
                                        //node["parIndex"] = 1;
                                        array.push(node);
                                    }
                                }

                                return array;
                            };
                            series.data = convertChildren(series.data);
                        }
                        return series;
                    }

                    rs.push(series);
                }
            }
            else if (isAxisChart(type)) {
                if(type==="dbar")//块状柱图特殊处理
                {
                    if(config.field.y.length>1&&!config.field.y[0].field||!config.field.y[1].field)return;
                    function renderItem(params, api) {
                        var yValue = api.value(2);
                        var start = api.coord([api.value(0), yValue]);
                        var size = api.size([api.value(1) - api.value(0), yValue]);
                        var style = api.style();
                        return {
                            type: 'rect',
                            shape: {
                                x: start[0],
                                y: yValue<0?start[1]-size[1]:start[1],
                                width: size[0],
                                height: size[1]
                            },
                            style: style
                        };
                    }
                    var colorList = getColor(config.theme).color;
                    var s = dl.groupby(config.field.x.field).execute(data);
                    var y2all = countField(s, config.field.y[1].field,config.field.y[1].aggregate);
                    var sum = eval(y2all.join("+"));
                    var avgy =  ~~(sum/y2all.length*100)/100;
                    if(s.length>colorList.length)//颜色数组放大
                    {
                        for(var i=0;i<Math.ceil(s.length/colorList.length);i++)
                            colorList = colorList.concat(colorList);
                    }
                    var tmp = 0;
                    data = s.map(function(item, index){
                        var  y1= summaryNumber(item.values, config.field.y[0].field,config.field.y[0].aggregate);
                        var y2 = summaryNumber(item.values, config.field.y[1].field,config.field.y[1].aggregate);
                        tmp+=y1;
                        return {
                            value: [tmp-y1, tmp, y2,item[config.field.x.field]],
                            itemStyle: {
                                normal: {
                                    color: colorList[index]
                                }
                            }
                        };
                    });
                    var ser = {
                        type: 'custom',
                        renderItem: renderItem,
                        label: {
                            normal: {
                                show: true,
                                position: 'top',
                                formatter: function(params) {
                                    return params.value[3]+"\n"+(params.value[1]-params.value[0]);
                                }
                            }
                        },
                        dimensions: [config.field.y[0].field,config.field.y[0].field, config.field.y[0].field,config.field.y[1].field],
                        encode: {
                            x: [0, 1],
                            y: 2,
                            itemName: 3
                        },
                        data: data
                    };
                    if(config.field.y[1].showavgline&&isRealNum(config.field.y[1].avglinevalue))
                        avgy = config.field.y[1].avglinevalue;
                    ser.markLine={data : [{
                                    name: 'average',
                                    yAxis: avgy,
                                    label:{show:true,position:'right'},
                                    lineStyle:{type:'dotted',color:'red'}
                                }]};
                    rs.push(ser);
                    return rs;
                }
                var s = dl.groupby(config.field.x.field).execute(data);
                var dataset;
                for (var i = 0; i < config.field.y.length; i++) {
                    var name = config.field.y[i].rename || config.field.y[i].field;//增加同比字段后台同名问题的处理
                    if(config.field.y[i].aggregate=='yp'||config.field.y[i].aggregate=='yppercent'||config.field.y[i].aggregate=='mp'||config.field.y[i].aggregate=='mppercent'||config.field.y[i].aggregate=='sum'||config.field.y[i].aggregate=='max'||config.field.y[i].aggregate=='min'||config.field.y[i].aggregate=='mean')
                    {

                        //name +="___"+config.field.y[i].aggregate;
                        dataset = countField(s, config.field.y[i].field+"___"+config.field.y[i].aggregate,config.field.y[i].aggregate);
                    }
                    else
                        dataset = countField(s, config.field.y[i].field,config.field.y[i].aggregate);

                    series = {
                        "name": name,//config.field.y[i].rename || config.field.y[i].field,
                        "type": config.field.y[i].type,
                        "stack": "总量",
                        //"barMaxWidth": 35,
                        "barGap": "10%",
                        "data": dataset,
                        itemStyle:{
                            normal: {
                                shadowBlur: shadowblurwidth,
                                shadowColor: 'rgba(40, 40, 40, 0.5)',
                                barBorderRadius:config.barradius?config.barradius:0
                            },
                            emphasis: {
                               shadowBlur: 35,
                               shadowOffsetX: 0,
                               shadowColor: 'white'
                            }
                        }
                    };
                    if(config.field.y[i].maxwidth&&!isNaN(config.field.y[i].maxwidth))//限制最大宽度
                    {
                        series["barMaxWidth"] = config.field.y[i].maxwidth;
                    }
                    if(config.field.y[i].diffcolors&&config.field.y[i].diffcolors===true)//多彩柱
                    {
                        var colorList = getColor(config.theme).color;
                        series.itemStyle.normal.color = function (params){
                            if(params.dataIndex>colorList.length)//颜色数组放大
                            {
                                for(var i=0;i<Math.ceil(params.dataIndex/colorList.length);i++)
                                    colorList = colorList.concat(colorList);
                            }
                            return colorList[params.dataIndex];
                        }
                    }
                    //增加柱的分组,叠加分组显示
                    if(config.field.x.isgroup==="true"&&config.field.x.groupField.field)
                    {
                        var groupfield = config.field.x.groupField.field;
                        var gs = dl.groupby(groupfield).execute(data);
                        for(var k=0;k<gs.length;k++)
                        {
                            var gschild = dl.groupby(config.field.x.field).execute(gs[k].values);
                            var groupdata = [];
                            for(var kk=0;kk<s.length;kk++)
                            {
                                var sums=0;
                                gschild.map(function (dat,index) {
                                    if(gschild[index][config.field.x.field]&&gschild[index][config.field.x.field]==s[kk][config.field.x.field])
                                    {
                                        sums = summaryNumber(gschild[index].values,config.field.y[i].field,config.field.y[i].aggregate);
                                    }
                                });
                                 groupdata.push(sums);
                            }
                            series = {
                                "name":gs[k][groupfield],
                                "type": config.field.y[i].type,
                                "stack": "总量"+i,
                                "barGap": "10%",
                                "data": groupdata,
                                itemStyle:{
                                    normal: {
                                        shadowBlur: shadowblurwidth,
                                        shadowColor: 'rgba(40, 40, 40, 0.5)',
                                        barBorderRadius:config.barradius?config.barradius:0
                                    },
                                    emphasis: {
                                       shadowBlur: 35,
                                       shadowOffsetX: 0,
                                       shadowColor: 'white'
                                    }
                                }
                            };
                            if(config.field.y[i].maxwidth&&!isNaN(config.field.y[i].maxwidth))
                            {
                                series["barMaxWidth"] = config.field.y[i].maxwidth;//限制最大宽度
                            }
                            rs.push(series);
                        }
                        //return rs;
                    }
                    if(config.field.y[i].truetype=="bar"&&config.field.y[i].basebar)//叠加阶梯基础柱
                    {
                        var news = angular.copy(series);
                        news.data = countFieldSum(s,config.field.y[i].field,config.field.y[i].aggregate);
                        news.itemStyle={
                            normal: {
                                barBorderColor: 'rgba(0,0,0,0)',
                                color: 'rgba(0,0,0,0)',
                                barBorderRadius:config.barradius?config.barradius:0
                            },
                            emphasis: {
                                barBorderColor: 'rgba(0,0,0,0)',
                                color: 'rgba(0,0,0,0)'
                            }
                        };
                        rs.push(news);
                    }
                    else if(config.field.y[i].basebar)//增加线型区域的叠加显示
                    {
                            series.data = countFieldSum(s,config.field.y[i].field,config.field.y[i].aggregate);
                    }
                    if(config.field.y[i].sumbar)//叠加阶梯基础柱
                    {
                        series.data = countFieldSumAll(s,config.field.y[i].field,config.field.y[i].aggregate);
                    }
                    if(config.field.y[i].truetype!="bar")
                    {
                           series.smooth = config.field.y[i].smooth||false;//曲线线型平滑
                    }
                    if(config.field.y[i].showmax||config.field.y[i].showmin)//最大值气泡
                    {
                        series.markPoint ={
                            data : []
                        };
                        if(config.field.y[i].showmax)
                            series.markPoint.data.push({type : 'max', name: '最大值'});
                        if(config.field.y[i].showmin)
                            series.markPoint.data.push({type : 'min', name: '最小值'});
                    }
                    if(config.field.y[i].showline)//均值线
                    {
                        series.markLine ={
                            data : [{type : 'average', name: '平均值'}]
                        };
                    }
                    if(config.field.y[i].alertscount>0)//警戒线
                    {
                        if(!series.markLine)
                            series.markLine ={data:[]};
                        if(series.markLine&&series.markLine.data)
                        {
                            if(config.field.y[i].alertsConfigs)
                            config.field.y[i].alertsConfigs.map(function(data,index){
                                series.markLine.data.push({
                                    name: data.name,
                                    yAxis: data.value,
                                    itemStyle:{
                                        normal:{
                                            lineStyle:{type:'dotted',color:data.color}
                                        },label:{show:true,position:'left'}
                                    },
                                    lineStyle:{type:'dotted',color:data.color},//兼容4.0 样式外移
                                    label:{show:true,position:'left'}
                                });
                            });
                        }
                    }
                    if(config.field.y[i].truetype=="bar"&&config.field.y[i].shadowbar)//背景柱
                    {
                        series.itemStyle = {
                            normal: {color: 'rgba(0,0,0,0.305)'}
                        };
                        series.barWidth = '56%';
                        series.barGap = '-130%';
                        if(config.field.y[i].shadowbarfront===true)
                        {
                            series.barWidth = '28%';
                            series.barGap = '-82%';
                        }
                        series.animation = false;
                    }
                    if(config.field.y[i].truetype=="bar"&&config.field.y[i].shadowline)//背景红线
                    {
                        series.type = "scatter";
                        series.symbol = "rect";
                        series.silent = true;
                        series.itemStyle = {
                                normal:{
                                    color:'#f30b07'
                                }
                            };
                        series.symbolSize = [20,5];
                        series.z = 20;
                        series.symbolOffset = [0,2];
                        rs.push(series);
                    }
                    series.label = {
                        normal: {
                            show: true, position: 'top'
                        }
                    };
                    if (config.field.y[i].label) {
                        series.label.normal.show = config.field.y[i].label.normal.show === 'true' ? true : false;
                        series.label.normal.position = config.field.y[i].label.normal.position;
                        series.label.normal.rotate = config.field.y[i].label.normal.rotate;
                        if(config.field.y[i].type=="bar"&&config.field.y[i].label&&config.field.y[i].label.offset&&config.field.y[i].label.offset!="")
                        {
                            try{
                                series.label.normal.offset = [parseInt(config.field.y[i].label.offset),-parseInt(config.field.y[i].label.offset)]
                            }catch(e){}
                        }
                        if(config.field.y[i].label.normal.color&&config.field.y[i].label.normal.color!=="")
                            series.label.normal.color = config.field.y[i].label.normal.color;
                         //柱上文本过长
                        var tmpI = i;
                        series.label.normal.formatter = function (value) {
                            value = value.value;
                            var ucount = config.field.y[tmpI].unitcount||0;
                            if(config.field.y[tmpI]&&config.field.y[tmpI].ylabelunit!=null&&config.field.y[tmpI].ylabelunit=='true'&&config.field.y[tmpI].yunit)//指定了单位
                            {
                                //return parseFloat(value).toFixed(ucount).toLocaleString() + config.field.y[tmpI].yunit;
                                return formatNumber(parseFloat(value).toFixed(ucount)) + config.field.y[tmpI].yunit;
                            }
                            var reg = new RegExp("^\\d+(.\\d+)?$");
                            if(reg.test(Math.abs(value))){//是数值
                                var numUnite='';
                                value=parseFloat(value).toFixed(ucount);
                                value = formatNumber(value);//parseFloat(value).toLocaleString();//千分位
                                return value+numUnite;
                            }else{
                                    return value;
                            }
                        }
                        //叠加柱处理叠加后标签汇总值的问题修正
                        if(config.field.y[i].truetype=="bar"&&config.field.x.isgroup==="true")//需要矫正多每个度量单独计算汇总
                        {
                            rs[rs.length-1]["label"]["normal"]["formatter"] = function (params) {
                                var data3 =0;
                                var i=(params.seriesIndex+1);
                                var t = rs.length/config.field.y.length;
                                var s = i-t;
                                for(var kt=s;kt<i;kt++){
                                    data3 += parseFloat(rs[kt].data[params.dataIndex]);
                                }
                                return data3.toFixed(config.field.y[i/t-1].unitcount||0);
                            }
                        }
                    }
                    //  config.field.y[i].label?config.field.y[i].label:{
                    //         normal:{
                    //             show:true,position:'top'
                    //         }
                    //     };
                    if(config.field.x.isgroup==="true")//背景柱重叠的情况,第一个不删允许叠加
                    {
                        //if(i!=0)
                        //    delete series.stack;
                    }
                    else if (config.ifmerge !== '1'&&!config.field.y[i].basebar) {//阶梯柱需要合并
                        delete series.stack;
                    }
                    if (config.field.y[i].isarea === '1'&&config.field.y[i].truetype==="area") {
                        series.areaStyle = { normal: {} };
                    }
                    if (config.field.y[i].truetype==="linestep") {
                        series.step = 'middle';
                    }

                    if (config.field.y[i].autoColor == 'false') {
                        series.itemStyle = {
                            normal: {
                                color: config.field.y[i].color
                            }
                        };
                    }
                    //混合图形多Y轴坐标
                    if(i>0&&config.field.y[i].shownewy===true&&config.field.y[i].newy===true)
                    {
                        series.yAxisIndex = 1;//只允许一个右Y轴
                    }
                    if(config.field.x.isgroup!=="true")//如果x轴增加了分组,低一次则前面已经增加了多个series,不需要再增加;
                        rs.push(series);
                }
                if(config.field.start&&config.field.start.field)//K线图配置项
                {
                    var kdata = [];
                    data.map(function (a) {
                        try{
                            kdata.push([a[config.field.start.field],a[config.field.end.field],a[config.field.max.field],a[config.field.min.field]]);
                        }catch(err){
                            console.log('----error-----angular.echarts.js;line:968;method:data.map(funtion(a){})-this can be happned-',err.message);
                        }
                    });
                   rs.push({
                        type: 'candlestick',
                        name: 'K线',
                        "stack": "总量",
                        data: kdata,
                        itemStyle: {
                            normal: {
                                color: '#FD1050',
                                color0: '#0CF49B',
                                borderColor: '#FD1050',
                                borderColor0: '#0CF49B'
                            }
                        }
                    });
                }
            }
            else if (type === 'gauge') {
                var sizeAry = ['80%', '65%', '50%', '50%'];
                var positionAry = [[
                    ['50%', '50%']
                ], [
                    ['75%', '55%'], ['25%', '55%']
                ], [
                    ['50%', '35%'], ['25%', '75%'], ['75%', '75%']
                ], [
                    ['25%', '35%'], ['75%', '35%'], ['25%', '80%'], ['75%', '80%']
                ]];
                var length = config.field.y.length;
                var summry, rowNum = 0, maxNum;
                var needExtend = ['axisTick','splitLine','detail','title','itemStyle'];
                var mergeMax = 0;
                config.field.y.map(function (index,i) {
                    var decimals = index.decimals||0;
                    summry = summaryNumber(data, index.field,index.aggregate);

                    summry = summry.toFixed(decimals);
                    if (index.autoMax == 'true') {
                        if (index.maxField && index.maxField.field) {
                            maxNum = summaryNumber(data, index.maxField.field,index.maxField.aggregate);
                        }
                        else {
                            maxNum = 100;
                        }
                    }
                    else {
                        maxNum = Number(index.max);
                    }
                    if (config.ifmerge == '1' && i == 0){
                        mergeMax = maxNum;
                    }
                    var name,offset;
                    if (config.ifmerge == '1' && i != 0) {
                        name= '';
                        maxNum = mergeMax;
                    }
                    else{
                        name = index.name ? index.name : '';
                    }

                    offset = i * 10 + 40 + '%';
                    var offsetTitle = i * 10 + 70 + '%';
                    //var range = index.range;
                    //var rangeAry = range.split(',');
                    var rangeArray = [];
                    var _colors = getColor(config.theme);
                    if(index.splitField&&index.splitField.length>0)//分段
                    {
                        for(var i=0;i<index.splitField.length;i++)
                        {
                            if(index.splitField[i].giveLength==true)
                            {
                                rangeArray.push([Number(index.splitField[i].length/50).toFixed(1),index.splitField[i].color]);
                            }
                            else
                            {
                                var rangeall= summaryNumber(data, index.splitField[i].field,index.splitField[i].aggregate);
                                rangeArray.push([Number(rangeall/summry).toFixed(1),index.splitField[i].color]);
                            }
                        }
                    }
                    else
                    {
                        rangeArray = [
                            [
                              Number(Number(summry) / Number(maxNum)).toFixed(2), new echarts.graphic.LinearGradient(
                              0, 0, 1, 0, [{offset: 0,color: _colors.linecolor[0]},{offset: 1,color: _colors.linecolor[1]}
                            ])],
                            [1, _colors.linecolor[2]]
                          ];
                            /*if (_colors && _colors.linecolor && _colors.linecolor.length > 2) {
                                rangeArray.push([0.2, _colors.linecolor[0]]);
                                rangeArray.push([0.8, _colors.linecolor[1]]);
                                rangeArray.push([1, _colors.linecolor[2]]);
                            } else {
                                rangeArray.push([1, index.splitcolor || color.linecolor[2]]);
                            }
                            if (config && config.field && config.field.y && config.field.y.length > 0) {
                                if (config.field.y[0].style && config.field.y[0].style.itemStyle
                                    && config.field.y[0].style.itemStyle.normal
                                    && config.field.y[0].style.itemStyle.normal.shadowBlur
                                    && config.field.y[0].style.itemStyle.normal.shadowBlur > 0) {
                                    config.field.y[0].style.itemStyle.normal.shadowBlur
                                }
                            }*/
                    }
                    series = {
                        type: 'gauge',
                        name: index.field,
                        data: [{ value: summry, name: name}],
                        splitNumber: 10,
                        pointer: { width: 5 },
                        detail: {
                            offsetCenter: [0, offset],
                            formatter:  '{value}'//index.name ? index.name : index.field + '   {value}'
                        },
                        min: '0',
                        max: maxNum.toFixed(decimals),
                        axisLine:{
                            lineStyle:{
                                shadowBlur: shadowblurwidth,
                                shadowColor: 'rgba(40, 40, 40, 0.5)',
                                color: rangeArray
                                //color: [[rangeAry[0], color.linecolor[0]], [rangeAry[1], color.linecolor[1]], [1, color.linecolor[2]]]
                            }
                        }
                    };
                    if(index.showPercent == 'true'){
                        series.data.value = ((Number(summry) / Number(maxNum))* 100).toFixed(decimals) ;
                        //series.max = 100;
                        series.detail.formatter = parseFloat(Number(summry).toFixed(decimals)).toLocaleString()  +"\n"+((Number(summry) / Number(Number(summaryNumber(data, index.maxField.field,index.maxField.aggregate)||maxNum)))* 100).toFixed(decimals) +"%";
                    }
                    if(config.ifmerge == '2'){
                        series = angular.extend(series, { radius: index.fullwidth+"%"||sizeAry[length - 1], center: positionAry[length - 1][rowNum] });
                        delete series['detail']['offsetCenter'];
                    }
                    needExtend.map(function(row){
                        if(series[row]){
                            angular.extend(series[row], index.style[row]);
                        }
                        else{
                            series[row] = index.style[row];
                        }
                    });
                    if(index.style['title']["verticalAlign"]=="bottom")
                    {
                        series['title']["offsetCenter"] = [0, offsetTitle];
                    }
                    else
                    {
                        delete  series['title']["offsetCenter"];
                    }
                    if(index.hidesplits=='true'||index.simplemode=='true')//显示刻度
                    {
                        series['axisTick']['show'] = false;
                        series['splitLine']['show'] = false;
                    }
                    else
                    {
                        series['axisTick']['show'] = true;
                        series['splitLine']['show'] = true;
                    }
                    if(index.simplemode=='true')//极简模式
                    {
                        series['pointer']['show'] = false;
                        series.axisLine.lineStyle = {
                          color: [
                            [
                              Number(Number(summry) / Number(maxNum)).toFixed(2), new echarts.graphic.LinearGradient(
                              0, 0, 1, 0, [{
                              offset: 0,
                              color: _colors.linecolor[0]//'#ae3df6'
                            },
                              {
                                offset: 1,
                                color: _colors.linecolor[1]//'#53bef9'
                              }
                            ]
                              )
                            ],
                            [
                              1, _colors.linecolor[2]//'#222e7d'
                            ]
                          ]
                        }
                    }
                    else
                    {
                        series['pointer']['show'] = true;
                    }
                    series['axisLine']['lineStyle']['width'] = index.style['axisLine']['lineStyle']['width'];//表盘粗细
                    // series = angular.extend(series, index.style || {});

                    series.axisLabel = {//大刻度上的文字
                        formatter: function (value) {
                            return value.toFixed(decimals);
                        },
                        show:index.hidesplits!=='true'
                    };
                    rs.push(series);
                    rowNum++;
                });
            }
            else if (type === 'scatter') {
                var sd = dl.groupby(config.field.x.field).execute(data);
                rs = sd.map(function (index) {
                    var sdata = [], idata;
                    for (var j = 0; j < index.values.length; j++) {
                        idata = [];
                        for (var i = 0; i < config.field.y.length; i++) {
                            idata.push(index.values[j][config.field.y[i].field]);
                        }
                        if (config.field.size && config.field.size) {
                            idata.push(index.values[j][config.field.size.field]);
                        }
                        sdata.push(idata);
                    }
                    return {
                        name: index[config.field.x.field],
                        type: 'scatter',
                        data: sdata,
                        itemStyle: {
                            normal: {
                                opacity: 0.8,
                                shadowBlur: shadowblurwidth,
                                shadowOffsetX: 0,
                                shadowOffsetY: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    };
                });
            }

            else if (type === 'radar') {
                if (!config.field.legend || !config.field.legend.field) {
                    return [];
                }
                if (!config.field.x || !config.field.x.field) {
                    return [];
                }
                if (!config.field.y || !config.field.y.field) {
                    return [];
                }
                series = {
                    name: 'series',
                    type: 'radar',
                    // areaStyle: {normal: {}},
                    data: [],
                        itemStyle:{
                            normal: {
                                shadowBlur: shadowblurwidth,
                                shadowColor: 'rgba(40, 40, 40, 0.5)'
                            }
                        }
                };
                var indicator = getIndicator(data, config);
                var l_data = dl.groupby(config.field.legend.field).execute(data);
                var result = {};
                var seriesData = l_data.map(function (index) {
                    var s_data = dl.groupby(config.field.x.field).execute(index.values);
                    result = {};
                    s_data.map(function (row) {
                        var summry = summaryNumber(row.values, config.field.y.field,config.field.y.aggregate);

                        result[row[config.field.x.field]] = summry;

                    });
                    var sD = indicator.map(function (indicatorRow) {
                        if (result[indicatorRow['name']]) {
                            return result[indicatorRow['name']];
                        }
                        else {
                            return 0;
                        }
                    });
                    return {
                        value: sD,
                        name: index[config.field.legend.field]
                    };
                });
                series.data = seriesData;
                rs.push(series);
            }
            return rs;
        }

        function getIndicator(data, config) {
            var f_data = dl.groupby(config.field.x.field).execute(data);
            var name;
            var rs = f_data.map(function (index) {
                name = index[config.field.x.field];
                var summry = summaryNumber(index.values,config.field.y.field,config.field.y.aggregate);
                return {
                    name: name,
                    max: summry
                };
            });
            return rs;
        }

        function getVisualMap(data, config) {
            if (!config.field.size || !config.field.size.field) {
                return null;
            }
            var visualMap = [
                {
                    left: 'right',
                    top: '10%',
                    dimension: config.field.y.length,
                    itemWidth: 30,
                    itemHeight: 120,
                    calculable: true,
                    precision: 0.1,
                    text: ['圆形大小：' + config.field.size.field],
                    textGap: 30,
                    inRange: {
                        symbolSize: [10, 70]
                    },
                    outOfRange: {
                        symbolSize: [10, 70],
                        color: ['rgba(255,255,255,.2)']
                    },
                    controller: {
                        inRange: {
                            color: ['#c23531']
                        },
                        outOfRange: {
                            color: ['#444']
                        }
                    }
                }];
            return visualMap;
        }

        function checkNumber(theObj) {
          var reg = /^\-?[0-9]+.?[0-9]*$/;//jnp fixed plus
          if (reg.test(theObj)) {
            return true;
          }
          return false;
        }

        function summaryNumber(data,field,aggregate){
            var max=null;var min=null;
            var summry = _.reduce(data, function (total, n) {
                if (checkNumber(n[field])) {
                    if(max==null)max=Number(n[field]);
                    if(min==null)min=Number(n[field]);
                    if(Number(n[field])>max)
                        max = Number(n[field]);
                    if(min>Number(n[field]))
                        min = Number(n[field]);
                    return total + Number(n[field]);
                }else {
                    return total + 0;
                }

            }, 0);
            // console.log("max:"+max+"  min:"+min+" all:"+summry);
            switch(aggregate)
            {
                case "count_sum"://取记录总数
                    return data[0]['条目总数'];
                    break;
                case "mean":
                    return data.length==0?0:summry/data.length;
                    break;
                case "max":
                    return max;
                    break;
                case "min":
                    return min;
                    break;
                case "sum":
                default:
                    return summry;
                    break;
            }
        }

        function getTopNData(topType,topNum,rawData,field){//只显示前几名
            if(topType=="topn"||topType=="lastn")
            {
                if(topNum!=null&&topNum!=""&&!isNaN(topNum))
                {
                    rawData = rawData.sort(function (a, b) {
                        return topType=="topn"?(Number(b[field]) - Number(a[field])):(Number(a[field]) - Number(b[field]));
                    }).slice(0, topNum)
                }
            }
            return rawData;
        }

        function getGraphic(rsdata, config, panel) {
            if (!rsdata || !config.type || !config.field.y || config.field.y.length == 0) {
                return {};
            }
            $(panel).css('position','relative');
            var summry,i=1;
            var scale1 = [['0.67','0.86'],['0.67','0.4'],['0.34','0.4'],['0.34','0.4']];
            var canvaspanel = $(panel).find('.canvas');
            var width = canvaspanel.width();
            var height = canvaspanel.height();
            // $(canvaspanel).append('<div class="main-title">' + config.title.text + '</div>');

            if(config.type != 'card'){
                var html = "<div class='card-table' > <div class='card-cell'>  </div> </div>";
                $(canvaspanel).append(html);
            }
            config.field.y.map(function(row){
                try{
                    summry = summaryNumber(rsdata,row.field,row.aggregate);
                    console.log('--summry=',summry)
                }catch(err){
                    console.log('---error!!---',err);
                    summry=0;
                }
                if(config.field.x&&config.field.y[0].aggregate=="rank")//单指标排名
                {
                    var gcolumn = config.field.x;
                    var url = '';
                    if (config.data.url.indexOf("getOlapDataShow") != -1){//替换url
                        url = config.data.url
                    }else{
                        url = config.data.url.replace('getOlapData','getOlapDataShow')
                    }
                    var data;
                    $.ajax({
                        method: 'POST',
                        url: encodeURI(url),
                        headers: { 'X-CSRFToken': getCookie('csrftoken') },
                        data: {'config':JSON.stringify(config)},
                        async:false
                    }).then(function (rs) {
                        data=rs.data;
                    });
                    if(gcolumn)
                    {
                        if(data[0]&&data[0].groups&&data[0].groups[0]&&data[0].groups[0].orderData)
                        {
                            summry = summaryNumber(data[0].groups[0].orderData,'rankNumInn','min');
                        }
                        else if(data[0]&&data[0].orderData)
                            summry = summaryNumber(data[0].orderData,'rankNum','min');
                    }
                    else
                        summry = summaryNumber(data,row.field);
                }
                summry=null?0:summry;
                if (angular.isNumber(parseInt(config.option.fixed))) {
                    summry = summry.toFixed(config.option.fixed);
                }
                else{
                    summry = summry.toFixed(1);
                }
                if (config.option.thousands&&config.option.thousands===true) {
                    summry = formatNumber(summry);
                }
                buildHtml(i,config.type);
                if(config.type == 'card'){
                    buildCardCss(i,row,summry);
                }else{
                    buildListCss(i,row,summry);
                }
                i++;
            });
            
            function buildHtml(index,type){
                if(type == 'card'){
                    var html = "<div class='card-table card-"+ index +"'> <div class='card-cell'> <div class='card-title'></div> <div class='card-price'></div> </div> </div>";
                    $(canvaspanel).append(html);
                }
                else{
                    var html = "<div class='card-"+ index +" card-title'>  </div>";
                    $(canvaspanel).find('.card-cell').append(html);
                }
                
            }

            function buildCardCss(index,row,summry){
                var length = config.field.y.length;
                var scale = scale1[length-1];
                var flag1 = 0 , flag2 = 1 ,flag3 = 0, flag4= 0;
                if(length > 1){
                    flag4 = 1;
                }
                if(length > 2){
                    flag3 = 1;
                }
                if(index > 2){
                    flag1 = 1;
                }
                if(index%2 == 1){
                    flag2 = 0;
                }
                var left = (width - width*scale1[0][1] ) / 2 + flag2*(width*scale[1] + 10) + flag3 * 10;
                var top = (height - height*scale1[0][0] ) / 2 +  flag1*(height*scale[0] + 10 ) - flag3 * 10;
                canvaspanel.find('.card-'+index).css({
                    width:width*scale[1]+'px',
                    height:height*scale[0]+'px',
                    background:config.option.card.fillcolor,
                    border:'1px solid '+config.option.card.strokecolor,
                    position:'absolute',
                    top:top + 'px',
                    left:left + 'px',
                    "text-align":'center',
                    
                    // "line-height":height*scale[0]+'px'
                });
                canvaspanel.find('.card-' + index).find('.card-title').css({ 'font-size':row._titleFontsize,'color': row._titleColor,'width':width*scale[1]+'px'}).text(row.label);
                if(row.plusicon&&row.plusicon==="true")
                {
                    var icon = "right";var color="";
                    if(summry>0)
                    {
                        icon="up";color="red";
                    }
                    else if(summry<0)
                    {
                        icon="down";color="green";
                    }
                    canvaspanel.find('.card-' + index).find('.card-price').css({ 'font-size':row._valueFontsize,'color': row._valueColor,'width':width*scale[1]+'px'}).html(" <span class='glyphicon glyphicon-arrow-"+icon+"' style='color:"+color+"'></span> "+summry + row.unit);
                }
                else
                    canvaspanel.find('.card-' + index).find('.card-price').css({ 'font-size':row._valueFontsize,'color': row._valueColor,'width':width*scale[1]+'px'}).text(summry + row.unit);
            }

            function buildListCss(index, row, summry) {
                canvaspanel.find('.card-' + index).css({ 'color': row._titleColor, 'font-size': row._titleFontsize + 'px' }).html('<div class="lst_title" style="float:left">'+row.label +': </div>'+ '<div class="lst_val"></div>');
                if(row.plusicon&&row.plusicon==="true")
                {
                    var icon = "right";var color="";
                    if(summry>0)
                    {
                        icon="up";color="red";
                    }
                    else if(summry<0)
                    {
                        icon="down";color="green";
                    }
                    canvaspanel.find('.card-' + index).find('div.lst_val').css({ 'color': row._valueColor,'font-size':row._valueFontsize + 'px'}).html(" <span class='glyphicon glyphicon-arrow-"+icon+"' style='color:"+color+"'></span> "+summry + row.unit);
                    if(row.aimfloat=="right")
                        canvaspanel.find('.card-' + index).find('div.lst_val').css({'float':"right"});
                }
                else
                {
                    canvaspanel.find('.card-' + index).find('div.lst_val').css({ 'color': row._valueColor, 'font-size': row._valueFontsize + 'px'}).text(summry + row.unit);
                }
                if(row.aimfloat=="right")
                        canvaspanel.find('.card-' + index).find('div.lst_val').css({'float':"right"});
            }
        }

        function getPosition(key, type) {
            switch (key) {
                case 'upleft':
                    return {
                        left: 5,
                    };
                case 'upcenter':
                    return type == 'title' ? { left: 'center' } : {};
                case 'upright':
                    return {
                    right: 5
                    };
                case 'downleft':
                    return {
                        bottom: 0,
                        left: 5
                    };
                case 'downcenter':
                    return type == 'title' ? { left: 'center', bottom: 0 } : { bottom: 0 };
                case 'downright': {
                    return {
                        bottom: 0,
                    right: 5
                    };
                }
                default:
                    return {};
            }
        }

        var bmap_params = {
            center: [104.114129, 37.550339],
            zoom: 5,
            roam: true,
            mapStyle: {
                styleJson: [
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
                    var map_obj = {
                        "name": data_name,
                        "value": data_value
                    };
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
                title: {
                    text: config.title.text,
                    subtext: config.title.subtext,
                    sublink: map_obj.map_sub_title_link,
                    textStyle: {
                        color: config.title.textStyle.color
                    },
                    subtextStyle: {
                        color: config.title.subtextStyle.color
                    }
                },
                tooltip: {
                    trigger: 'item'
                },
                legend: {},
                bmap: map_obj.bmap_data,
                series: []
            };


            if (config.mapdata.map_theme == 'light') {
                option.geo = {
                    "map": config.mapbag||"china",
                    "roam": true, //"move",
                    "label": {
                        "normal": {
                            "show": true,
                            "textStyle": {
                                "color": "rgba(0,0,0,0.6)"
                            }
                        }
                    },
                    "itemStyle": {
                        "normal": {
 			            "borderColor": "green",
                        areaColor:"lightgray",
                        shadowBlur: shadowblurwidth,
                        shadowColor: 'rgba(40, 40, 40, 0.5)'
                        },
                        "emphasis": {
                            "areaColor": null,
                            "shadowOffsetX": 0,
                            "shadowOffsetY": 0,
                            "shadowBlur": shadowblurwidth,
                            "borderWidth": 0,
                            "shadowColor": "rgba(0, 0, 0, 0.5)"
                        }
                    }
                };
            }
            else {
                option.geo = {
                    "map": config.mapbag||"china",
                    "roam": true,//"move",
                    "label": {
                        "normal": {
                            "show": true,
                            "textStyle": {
                                "color": "rgba(0,0,0,0.6)"
                            }
                        }
                    },
                    "itemStyle": {
                        "normal": {
				        "borderColor": "green",
                        areaColor:"lightgray",
                        shadowBlur: shadowblurwidth,
                        shadowColor: 'rgba(40, 40, 40, 0.5)'
                        },
                        "emphasis": {
                            "areaColor": '#1c65f9',
                            "shadowOffsetX": 0,
                            "shadowOffsetY": 0,
                            "shadowBlur": shadowblurwidth,
                            "borderWidth": 0,
                            "shadowColor": "rgba(0, 0, 0, 0.5)"
                        }
                    }
                };
            }
            option.title = angular.extend(option.title, getPosition(config.title.position, 'title'));
            return angular.extend(option, config.option || {});
        }

        function getMapData(config) {
            var map_obj = {
                map_sub_title_link: '',//二级标题链接
                show_all_data_text: '',//右下显示全部按钮文字
                show_all_data_text_color: '#ffffff',//右下显示全部按钮文字颜色
                map_background_color: '#404a59',//背景色
                bmap_data: bmap_params,//绘制地图需要的bmap参数
                top_num: 999999,//需要重点显示多少个,默认全部显示
                top_point_size: 1,//TOP N城市(地区)标记的圆点的缩放倍数
                top_area_solor: 'blue',//TOP N城市(地区)标记的颜色
                general_point_size: 1,//城市(地区)标记的圆点的缩放倍数
                area_solor: 'red',//城市(地区)名称的颜色
                map_type_change: false//增加地图类型转换功能 透视图、卫星图，街道图。。。
            };
            return angular.extend(map_obj, config.mapdata || {});
        }
        function mapEchart(config, data) {
            if (!config) {
                return false;
            }

            var s = dl.groupby(config.x.field).execute(data);
            var ssss = [];
            /*var summ = function (ary) {
                var xxx = 0;
                ary.map(function (me) {
                    if (config.y.field === '') {
                        xxx = numAdd(xxx, 0);
                    }
                    else {
                        xxx = numAdd(xxx, me[config.y.field]);
                    }
                });
                return xxx;
            };*/
            s.map(function (a) {
                var b = summaryNumber(a.values,config.y.field,config.y.aggregate);//summ(a.values);
                if (b > 0) {
                    ssss.push({
                        name: a[config.x.field],
                        lon:config.lon&&config.lon.field?a.values[0][config.lon.field]:'',
                        lat:config.lat&&config.lat.field?a.values[0][config.lat.field]:'',
                        value: b.toFixed(1)
                    });
                }
            });
            return ssss;
        }

        function filterData(data,config){
		 if (!config.filter){
            return data; 
        }
        return data;   //后台处理过滤条件
            if (config.filter && config.filter.canfilter == '1'){
                var date = new Date();
                var year,month,yearField,monthField;

                if(config.filter.year.field.field){
                    yearField = config.filter.year.field.field;
                    if (config.filter.year.field.ifAuto == '1'){
                        year = date.getFullYear();
                    }
                    else{
                        year = config.filter.year.field.value;
                    }
                }
                if (config.filter.month.field.field) {
                    monthField = config.filter.month.field.field;
                    if (config.filter.month.field.ifAuto == 'auto') {
                        month = date.getMonth() + 1;
                    }
                    else {
                        month = config.filter.month.field.value;
                    }
                }

                data = data.filter(function(row){
                    var isYear = true;
                    var ismonth = true;
                    if (yearField){
                        isYear = row[yearField] == year;
                    }
                    if(monthField){
                        ismonth = row[monthField] == month;
                    }
                    return isYear && ismonth;
                });

            }
            if(config.filter.filters)
            {
                for(var i=0;i<config.filter.filters.length;i++)
                {
                    if(!config.filter.filters[i].value||config.filter.filters[i].value=="")continue;
                    var rule = config.filter.filters[i].rule;
                    switch(rule)
                    {
                        case "like":
                            data = data.filter(function(row){
                                return row[config.filter.filters[i].field].indexOf(config.filter.filters[i].value)>=0;
                            });
                            break;
                        case "notlike":
                            data = data.filter(function(row){
                                return row[config.filter.filters[i].field].indexOf(config.filter.filters[i].value)<0;
                            });
                            break;
                        case "s=":
                            data = data.filter(function(row){
                                return row[config.filter.filters[i].field].indexOf(config.filter.filters[i].value)==0;
                            });
                            break;
                        case "e=":
                            data = data.filter(function(row){
                                var d=row[config.filter.filters[i].field].length-config.filter.filters[i].value.length;
                                return (d>=0&&row[config.filter.filters[i].field].lastIndexOf(config.filter.filters[i].value)==d);
                            });
                            break;
                        default:
                            if(rule.indexOf(">")<0&&rule.indexOf("<")<0)
                            {
                                data = data.filter(function(row){
                                    return eval("'"+row[config.filter.filters[i].field]+"'"+rule+"'"+config.filter.filters[i].value+"'");
                                });
                            }
                            else
                            {
                                data = data.filter(function(row){
                                    if(isRealNum(row[config.filter.filters[i].field]))
                                        return  eval(row[config.filter.filters[i].field]+rule+config.filter.filters[i].value);
                                    else
                                        return false;
                                });
                            }
                            break;

                    }
                }
            }

            return data;
        }

        function SinglefilterJSON(config){
            var params=[];
            if (config.filter && config.filter.canfilter == '1'){
                var date = new Date();
                var year,month,yearField,monthField;

                if(config.filter.year.field.field){
                    yearField = config.filter.year.field.field;
                    if (config.filter.year.field.ifAuto == '1'){
                        year = date.getFullYear();
                    }
                    else{
                        year = config.filter.year.field.value;
                    }
                    params.push({"Column":yearField,"Rule":"=","Value":year});
                }
                if (config.filter.month.field.field) {
                    monthField = config.filter.month.field.field;
                    if (config.filter.month.field.ifAuto == 'auto') {
                        month = date.getMonth() + 1;
                    }
                    else {
                        month = config.filter.month.field.value;
                    }
                    params.push({"Column":monthField,"Rule":"=","Value":month});
                }
            }
            if(config.filter.filters)
            {
                for(var i=0;i<config.filter.filters.length;i++)
                {
                    if(!config.filter.filters[i].value||config.filter.filters[i].value=="")continue;
                    var rule = config.filter.filters[i].rule;
                    params.push({"Column":config.filter.filters[i].field,"Rule":rule,"Value":config.filter.filters[i].value});
                }
            }

            return params;
        }

        function isRealNum(val){
            // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除
            if(val === "" || val ==null){
                return false;
            }
            if(!isNaN(val)){
                return true;
            }else{
                return false;
            }
        }

        function initTheme() {
            var theme;
            var colorPaletteList = [{ key: 'def',   title: '默认',   color: ['rgb(255,191,83)','rgb(4,177,194)','rgb(240,116,116)','rgb(197,87,132)','rgb(154,95,179)','rgb(207,98,215)','rgb(94,120,234)','rgb(81,179,240)','rgb(105,212,220)','rgb(73,183,136)','rgb(156,204,102)','rgb(255,219,3)'],   linecolor: ['rgb(255,191,83)','rgb(4,177,194)','rgb(240,116,116)']  },
                { key: 'rabow',   title: '彩虹',   color: ['rgb(250,232,0)','rgb(0,192,57)','rgb(4,130,220)','rgb(255,38,55)','rgb(255,119,5)','rgb(156,94,195)','rgb(0,204,223)','rgb83,127,224)','rgb(187,77,133)','rgb(244,105,199)','rgb(253,196,80)','rgb(171,236,120)'],   linecolor: ['rgb(250,232,0)','rgb(0,192,57)','rgb(4,130,220)']  },
                { key: 'warm',   title: '温暖',   color: ['rgb(178,86,87)','rgb(225,129,105)','rgb(241,193,95)','rgb(244,171,152)','rgb(200,45,49)','rgb(250,112,109)','rgb(247,165,83)','rgb(155,117,94)','rgb(191,163,149)','rgb(141,154,144)','rgb(76,159,149)','rgb(88,125,133)'],   linecolor: ['rgb(178,86,87)','rgb(225,129,105)','rgb(241,193,95)']  },
                { key: 'lsoft',   title: '轻柔',   color: ['rgb(0,206,178)','rgb(224,229,173)','rgb(225,129,105)','rgb(121,183,134)','rgb(158,214,201)','rgb(243,170,151)','rgb(191,163,149)','rgb(155,117,94)','rgb(241,193,95)','rgb(87,175,127)','rgb(164,221,153)','rgb(242,142,44)'],   linecolor: ['rgb(0,206,178)','rgb(224,229,173)','rgb(225,129,105)']  },
                { key: 'xc',   title: '炫彩',   color: ['rgb(0,197,220)','rgb(88,103,195)','rgb(255,82,94)','rgb(255,169,204)','rgb(255,170,0)','rgb(255,218,3)','rgb(156,204,102)','rgb(54,195,152)','rgb(0,167,175)','rgb(34,129,188)','rgb(118,106,239)','rgb(197,118,211)'],   linecolor: ['rgb(0,197,220)','rgb(88,103,195)','rgb(255,82,94)']  },
                { key: 'blue',   title: '蓝色',   color: ['rgb(25,160,218)','rgb(101,187,230)','rgb(178,218,243)','rgb(51,142,222)','rgb(90,153,230)','rgb(155,191,242)','rgb(66,120,229)','rgb(104,142,237)','rgb(150,173,242)','rgb(67,86,230)','rgb(103,114,240)','rgb(160,163,250)'],   linecolor: ['rgb(25,160,218)','rgb(178,218,243)','rgb(67,86,230)']  },
                { key: 'red',   title: '红色',   color: ['rgb(218,25,92)','rgb(230,101,142)','rgb(243,178,195)','rgb(222,51,82)','rgb(230,90,104)','rgb(242,155,161)','rgb(229,69,66)','rgb(237,112,104)','rgb(242,159,150)','rgb(230,105,67)','rgb(240,140,103)','rgb(250,180,160)'],   linecolor: ['rgb(218,25,92)','rgb(230,90,104)','rgb(230,105,67)']  },
                { key: 'green',   title: '绿色',   color: ['rgb(85,184,58)','rgb(138,207,123)','rgb(195,231,189)','rgb(86,192,80)','rgb(114,205,117)','rgb(170,227,174)','rgb(94,200,110)','rgb(127,214,144)','rgb(126,226,180)','rgb(95,201,134)','rgb(127,216,163)','rgb(175,234,201)'],   linecolor: ['rgb(85,184,58)','rgb(195,231,189)','rgb(127,216,163)']  },
                { key: 'daynt',   title: '晚霞',   color: ['rgb(50,57,135)','rgb(57,85,185)','rgb(95,101,211)','rgb(113,79,173)','rgb(183,99,177)','rgb(233,115,147)','rgb(40,46,108)','rgb(46,68,148)','rgb(76,94,169)','rgb(90,63,138)','rgb(146,79,142)','rgb(186,92,118)'],   linecolor: ['rgb(50,57,135)','rgb(113,79,173)','rgb(233,115,147)']  },
                { key: 'sotc',   title: '柔彩',   color: ['rgb(211,101,52)','rgb(239,144,62)','rgb(245,190,126)','rgb(191,163,149)','rgb(141,154,144)','rgb(76,159,149)','rgb(85,145,145)','rgb(88,125,133)','rgb(70,97,114)','rgb(134,133,138)','rgb(123,111,121)','rgb(182,139,133)'],   linecolor: ['rgb(211,101,52)','rgb(191,163,149)','rgb(76,159,149)']  },
                { key: 'soft',   title: '柔和',   color: ['rgb(91,155,213)','rgb(237,125,49)','rgb(112,173,71)','rgb(255,192,0)','rgb(68,114,196)','rgb(145,208,36)','rgb(178,53,230)','rgb(2,174,117)','rgb(91,155,213)','rgb(237,125,49)','rgb(112,173,71)','rgb(255,192,0)'],   linecolor: ['rgb(91,155,213)','rgb(237,125,49)','rgb(112,173,71)']  },
                { key: 'busi',   title: '商务',   color: ['rgb(25,79,151)','rgb(85,85,85)','rgb(189,107,8)','rgb(0,104,107)','rgb(200,45,49)','rgb(98,91,161)','rgb(137,137,137)','rgb(156,152,0)','rgb(0,127,84)','rgb(161,149,197)','rgb(16,54,103)','rgb(241,146,114)'],   linecolor: ['rgb(189,107,8)','rgb(0,104,107)','rgb(200,45,49)']  },
                { key: 'told',   title: '怀旧',   color: ['rgb(59,98,145)', 'rgb(148,60,57)', 'rgb(119,144,67)','rgb(98,76,124)','rgb(59,139,161)','rgb(191,115,52)','rgb(63,104,153)','rgb(156,64,61)','rgb(125,152,71)','rgb(103,80,131)','rgb(51,112,129)','rgb(201,121,55)'],   linecolor: ['rgb(59,98,145)','rgb(148,60,57)','rgb(119,144,67)']  },
                { key: 'feture',   title: '未来',   color: ['rgb(58,232,239)','rgb(258,208,249)','rgb(120,253,132)','rgb(6,142,234)','rgb(1,189,190)','rgb(3,115,161)','rgb(248,106,140)','rgb(214,,61,101)','rgb(244,171,152)','rgb(255,205,64)','rgb(242,142,43)','rgb(5,166,187)'],   linecolor: ['rgb(258,208,249)','rgb(120,253,132)','rgb(248,106,140)']  },
                { key: 'ged',   title: '格调',   color: ['rgb(62,173,255)','rgb(125,132,255)','rgb(225,134,247)','rgb(250,80,132)','rgb(249,208,35)','rgb(242,144,28)','rgb(157,94,196)','rgb(116,154,247)','rgb(100,67,239)','rgb(18,75,216)','rgb(51,134,255)','rgb(18,196,149)'],   linecolor: ['rgb(62,173,255)','rgb(225,134,247)','rgb(242,144,28)']  },
                { key: 'huol',   title: '活力',   color: ['rgb(114,103,230)','rgb(190,85,242)','rgb(63,178,126)','rgb(249,82,132)','rgb(248,209,38)','rgb(218,121,242)','rgb(156,1204,102)','rgb(248,141,72)','rgb(104,212,129)','rgb(81,130,228)','rgb(86,81,184)','rgb(136,84,212)'],   linecolor: ['rgb(114,103,230)','rgb(190,85,242)','rgb(63,178,126)']  },
                { key: 'rockq',   title: '石青',   color: ['rgb(74,114,201)','rgb(66,163,183)','rgb(161,203,128)','rgb(114,158,144)','rgb(66,148,184)','rgb(138,160,211)','rgb(95,113,198)','rgb(163,204,247)','rgb(71,156,226)','rgb(96,135,191)','rgb(61,138,111)','rgb(118,181,95)'],   linecolor: ['rgb(74,114,201)','rgb(66,163,183)','rgb(161,203,128)']  },
                { key: 'modern',   title: '现代',   color: ['rgb(79,223,255)','rgb(66,160,247)','rgb(90,110,255)','rgb(38,224,165)','rgb(0,178,218)','rgb(40,113,211)','rgb(255,207,72)','rgb(255,163,167)','rgb(137,244,194)','rgb(120,213,108)','rgb(56,151,90)','rgb(139,120,250)'],   linecolor: [ 'rgb(66,160,247)','rgb(90,110,255)','rgb(38,224,165)']  },
                {
                key: 'greenGarden',
                title: '绿色花园',
                color: ['#719939', '#8bb74b', '#2bb580', '#0d9d79', '#008161'],
                linecolor: ['#8bb74b', '#008161', '#f89647']
            }, {
                key: 'vitality',
                title: '活力四射',
                color: ['#f89647', '#b1d46c', '#3ebbb7', '#01578a', '#fbbf13'],
                linecolor: ['#b1d46c', '#3ebbb7', '#f89647']
            }, {
                key: 'roman',
                title: '紫丁香',
                color: ['#6a7fff', '#a8e0ef', '#00c7da', '#076aec', '#98baff'],
                linecolor: ['#a8e0ef', '#00c7da', '#f89647']
            }, {
                key: 'purple',
                title: '紫罗兰',
                color: ['#b8e5fe', '#53c0fd', '#98baff', '#5e93ff', '#495af2'],
                linecolor: ['#b8e5fe', '#5e93ff', '#f89647']
            }, {
                key: 'air',
                title: '清新空气',
                color: ['#b1d46c', '#3ebbb7', '#255178', '#e98f39', '#d63030'],
                linecolor: ['#3ebbb7', '#255178', '#d63030']
            }, {
                key: 'MT',
                title: 'MT标准色',
                color: ['#004696', '#3399FF', '#60B612', '#E69400', '#97CBFF','#B1F177','#FFEBC7','#A5A5A5','#56A410','#278BFF','#734A00','#00234B','#6FB2FF'],
                linecolor: ['#3399FF', '#003D9D', '#56A410']
            }];
            colorPaletteList.map(function (index) {
                theme = {
                    color: index.color,
                    gauge: {
                        axisLine: {
                            lineStyle: {
                                color: [['0.2', index.linecolor[0]], ['0.8', index.linecolor[1]], ['1', index.linecolor[2]]]
                            }
                        }
                    }
                };
                echarts.registerTheme(index.key, theme);

            });
        }

        function getColor(key) {
            var colorPaletteList = [{ key: 'def',   title: '默认',   color: ['rgb(255,191,83)','rgb(4,177,194)','rgb(240,116,116)','rgb(197,87,132)','rgb(154,95,179)','rgb(207,98,215)','rgb(94,120,234)','rgb(81,179,240)','rgb(105,212,220)','rgb(73,183,136)','rgb(156,204,102)','rgb(255,219,3)'],   linecolor: ['rgb(255,191,83)','rgb(4,177,194)','rgb(240,116,116)']  },
                { key: 'rabow',   title: '彩虹',   color: ['rgb(250,232,0)','rgb(0,192,57)','rgb(4,130,220)','rgb(255,38,55)','rgb(255,119,5)','rgb(156,94,195)','rgb(0,204,223)','rgb83,127,224)','rgb(187,77,133)','rgb(244,105,199)','rgb(253,196,80)','rgb(171,236,120)'],   linecolor: ['rgb(250,232,0)','rgb(0,192,57)','rgb(4,130,220)']  },
                { key: 'warm',   title: '温暖',   color: ['rgb(178,86,87)','rgb(225,129,105)','rgb(241,193,95)','rgb(244,171,152)','rgb(200,45,49)','rgb(250,112,109)','rgb(247,165,83)','rgb(155,117,94)','rgb(191,163,149)','rgb(141,154,144)','rgb(76,159,149)','rgb(88,125,133)'],   linecolor: ['rgb(178,86,87)','rgb(225,129,105)','rgb(241,193,95)']  },
                { key: 'lsoft',   title: '轻柔',   color: ['rgb(0,206,178)','rgb(224,229,173)','rgb(225,129,105)','rgb(121,183,134)','rgb(158,214,201)','rgb(243,170,151)','rgb(191,163,149)','rgb(155,117,94)','rgb(241,193,95)','rgb(87,175,127)','rgb(164,221,153)','rgb(242,142,44)'],   linecolor: ['rgb(0,206,178)','rgb(224,229,173)','rgb(225,129,105)']  },
                { key: 'xc',   title: '炫彩',   color: ['rgb(0,197,220)','rgb(88,103,195)','rgb(255,82,94)','rgb(255,169,204)','rgb(255,170,0)','rgb(255,218,3)','rgb(156,204,102)','rgb(54,195,152)','rgb(0,167,175)','rgb(34,129,188)','rgb(118,106,239)','rgb(197,118,211)'],   linecolor: ['rgb(0,197,220)','rgb(88,103,195)','rgb(255,82,94)']  },
                { key: 'blue',   title: '蓝色',   color: ['rgb(25,160,218)','rgb(101,187,230)','rgb(178,218,243)','rgb(51,142,222)','rgb(90,153,230)','rgb(155,191,242)','rgb(66,120,229)','rgb(104,142,237)','rgb(150,173,242)','rgb(67,86,230)','rgb(103,114,240)','rgb(160,163,250)'],   linecolor: ['rgb(25,160,218)','rgb(178,218,243)','rgb(67,86,230)']  },
                { key: 'red',   title: '红色',   color: ['rgb(218,25,92)','rgb(230,101,142)','rgb(243,178,195)','rgb(222,51,82)','rgb(230,90,104)','rgb(242,155,161)','rgb(229,69,66)','rgb(237,112,104)','rgb(242,159,150)','rgb(230,105,67)','rgb(240,140,103)','rgb(250,180,160)'],   linecolor: ['rgb(218,25,92)','rgb(230,90,104)','rgb(230,105,67)']  },
                { key: 'green',   title: '绿色',   color: ['rgb(85,184,58)','rgb(138,207,123)','rgb(195,231,189)','rgb(86,192,80)','rgb(114,205,117)','rgb(170,227,174)','rgb(94,200,110)','rgb(127,214,144)','rgb(126,226,180)','rgb(95,201,134)','rgb(127,216,163)','rgb(175,234,201)'],   linecolor: ['rgb(85,184,58)','rgb(195,231,189)','rgb(127,216,163)']  },
                { key: 'daynt',   title: '晚霞',   color: ['rgb(50,57,135)','rgb(57,85,185)','rgb(95,101,211)','rgb(113,79,173)','rgb(183,99,177)','rgb(233,115,147)','rgb(40,46,108)','rgb(46,68,148)','rgb(76,94,169)','rgb(90,63,138)','rgb(146,79,142)','rgb(186,92,118)'],   linecolor: ['rgb(50,57,135)','rgb(113,79,173)','rgb(233,115,147)']  },
                { key: 'sotc',   title: '柔彩',   color: ['rgb(211,101,52)','rgb(239,144,62)','rgb(245,190,126)','rgb(191,163,149)','rgb(141,154,144)','rgb(76,159,149)','rgb(85,145,145)','rgb(88,125,133)','rgb(70,97,114)','rgb(134,133,138)','rgb(123,111,121)','rgb(182,139,133)'],   linecolor: ['rgb(211,101,52)','rgb(191,163,149)','rgb(76,159,149)']  },
                { key: 'soft',   title: '柔和',   color: ['rgb(91,155,213)','rgb(237,125,49)','rgb(112,173,71)','rgb(255,192,0)','rgb(68,114,196)','rgb(145,208,36)','rgb(178,53,230)','rgb(2,174,117)','rgb(91,155,213)','rgb(237,125,49)','rgb(112,173,71)','rgb(255,192,0)'],   linecolor: ['rgb(91,155,213)','rgb(237,125,49)','rgb(112,173,71)']  },
                { key: 'busi',   title: '商务',   color: ['rgb(25,79,151)','rgb(85,85,85)','rgb(189,107,8)','rgb(0,104,107)','rgb(200,45,49)','rgb(98,91,161)','rgb(137,137,137)','rgb(156,152,0)','rgb(0,127,84)','rgb(161,149,197)','rgb(16,54,103)','rgb(241,146,114)'],   linecolor: ['rgb(189,107,8)','rgb(0,104,107)','rgb(200,45,49)']  },
                { key: 'told',   title: '怀旧',   color: ['rgb(59,98,145)', 'rgb(148,60,57)', 'rgb(119,144,67)','rgb(98,76,124)','rgb(59,139,161)','rgb(191,115,52)','rgb(63,104,153)','rgb(156,64,61)','rgb(125,152,71)','rgb(103,80,131)','rgb(51,112,129)','rgb(201,121,55)'],   linecolor: ['rgb(59,98,145)','rgb(148,60,57)','rgb(119,144,67)']  },
                { key: 'feture',   title: '未来',   color: ['rgb(58,232,239)','rgb(258,208,249)','rgb(120,253,132)','rgb(6,142,234)','rgb(1,189,190)','rgb(3,115,161)','rgb(248,106,140)','rgb(214,,61,101)','rgb(244,171,152)','rgb(255,205,64)','rgb(242,142,43)','rgb(5,166,187)'],   linecolor: ['rgb(258,208,249)','rgb(120,253,132)','rgb(248,106,140)']  },
                { key: 'ged',   title: '格调',   color: ['rgb(62,173,255)','rgb(125,132,255)','rgb(225,134,247)','rgb(250,80,132)','rgb(249,208,35)','rgb(242,144,28)','rgb(157,94,196)','rgb(116,154,247)','rgb(100,67,239)','rgb(18,75,216)','rgb(51,134,255)','rgb(18,196,149)'],   linecolor: ['rgb(62,173,255)','rgb(225,134,247)','rgb(242,144,28)']  },
                { key: 'huol',   title: '活力',   color: ['rgb(114,103,230)','rgb(190,85,242)','rgb(63,178,126)','rgb(249,82,132)','rgb(248,209,38)','rgb(218,121,242)','rgb(156,1204,102)','rgb(248,141,72)','rgb(104,212,129)','rgb(81,130,228)','rgb(86,81,184)','rgb(136,84,212)'],   linecolor: ['rgb(114,103,230)','rgb(190,85,242)','rgb(63,178,126)']  },
                { key: 'rockq',   title: '石青',   color: ['rgb(74,114,201)','rgb(66,163,183)','rgb(161,203,128)','rgb(114,158,144)','rgb(66,148,184)','rgb(138,160,211)','rgb(95,113,198)','rgb(163,204,247)','rgb(71,156,226)','rgb(96,135,191)','rgb(61,138,111)','rgb(118,181,95)'],   linecolor: ['rgb(74,114,201)','rgb(66,163,183)','rgb(161,203,128)']  },
                { key: 'modern',   title: '现代',   color: ['rgb(79,223,255)','rgb(66,160,247)','rgb(90,110,255)','rgb(38,224,165)','rgb(0,178,218)','rgb(40,113,211)','rgb(255,207,72)','rgb(255,163,167)','rgb(137,244,194)','rgb(120,213,108)','rgb(56,151,90)','rgb(139,120,250)'],   linecolor: [ 'rgb(66,160,247)','rgb(90,110,255)','rgb(38,224,165)']  },
                {
                    key: 'greenGarden',
                    title: '绿色花园',
                    color: ['#719939', '#8bb74b', '#2bb580', '#0d9d79', '#008161'],
                    linecolor: ['#8bb74b', '#008161', '#f89647']
                }, {
                    key: 'vitality',
                    title: '活力四射',
                    color: ['#f89647', '#b1d46c', '#3ebbb7', '#01578a', '#fbbf13'],
                    linecolor: ['#b1d46c', '#3ebbb7', '#f89647']
                }, {
                    key: 'roman',
                    title: '紫丁香',
                    color: ['#6a7fff', '#a8e0ef', '#00c7da', '#076aec', '#98baff'],
                    linecolor: ['#a8e0ef', '#00c7da', '#f89647']
                }, {
                    key: 'purple',
                    title: '紫罗兰',
                    color: ['#b8e5fe', '#53c0fd', '#98baff', '#5e93ff', '#495af2'],
                    linecolor: ['#b8e5fe', '#5e93ff', '#f89647']
                }, {
                    key: 'air',
                    title: '清新空气',
                    color: ['#b1d46c', '#3ebbb7', '#255178', '#e98f39', '#d63030'],
                    linecolor: ['#3ebbb7', '#255178', '#d63030']
                }, {
                    key: 'MT',
                    title: 'MT标准色',
                    color: ['#004696', '#3399FF', '#60B612', '#E69400', '#97CBFF','#B1F177','#FFEBC7','#A5A5A5','#56A410','#278BFF','#734A00','#00234B','#6FB2FF'],
                    linecolor: ['#3399FF', '#003D9D', '#56A410']
                }];
            var rs = colorPaletteList.filter(function(index){
                return index.key == key;
            });

            return rs[0];
        }
        return {
            isPieChart: isPieChart,
            isAxisChart: isAxisChart,
            isMapChart: isMapChart,
            getYAxis: getYAxis,
            getXAxis: getXAxis,
            getSeries: getSeries,
            getLegend: getLegend,
            getTooltip: getTooltip,
            getTitle: getTitle,
            getDataZoom: getDataZoom,
            getCoordMap: getCoordMap,
            pushMapData: pushMapData,
            cityNameWithValueToMapData: cityNameWithValueToMapData,
            cityNameArrToMapData: cityNameArrToMapData,
            getConfig: getConfig,
            getMapData: getMapData,
            mapEchart: mapEchart,
            getVisualMap: getVisualMap,
            getIndicator: getIndicator,
            getGraphic: getGraphic,
            initTheme: initTheme,
            filterData: filterData,
            getColor: getColor,
            getTopNData:getTopNData,
            summaryNumber:summaryNumber
        };
    });

}());
