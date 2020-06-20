(function () {
    "use strict";
    /**
     * angular echart 混合模式 的图表 directive 生成方法
     * @param {*}  
     * @param {*} util  依赖方法
     */
    function getMixedLinkFunction($http, util) {
        return function (scope, element) {
            var ndWrapper = element.find('div')[0], chart;
            ndWrapper.style.width = '100%';
            ndWrapper.style.height = "100%";
            function getOption() {
                var data = util.formatData(scope.config);

                var options = {
                    title: util.getTitle(scope.config),
                    tooltip: util.getTooltip(scope.config),
                    grid: util.getGrid(scope.config),
                    legend: util.getLegend(scope.config),
                    calculable: true,
                    dataZoom: util.getDataZoom(scope.config, data),
                    series: util.getSeries(scope.config, data),
                };
                if (scope.config.transpose === '1') {
                    options.xAxis = util.getYAxis(scope.config);
                    options.yAxis = util.getXAxis(scope.config, data);
                    options.dataZoom[0].yAxisIndex = [0];
                }
                else {
                    options.xAxis = util.getXAxis(scope.config, data);
                    options.yAxis = util.getYAxis(scope.config);
                    options.dataZoom[0].xAxisIndex = [0];
                }
                return options;
            }
            function setOption() {
                if (!scope.config || scope.config.field.y.length <= 0 || !scope.config.field.x.field) {
                    return;
                }
                chart = echarts.init(ndWrapper);
                var option = getOption();
                if (option.series.length > 0) {
                    chart.setOption(option);
                }
            }
            scope.$watch('config', function (value) {
                if (value) {
                    ndWrapper.innerHTML = '';
                    ndWrapper.removeAttribute('stype');
                    ndWrapper.removeAttribute('_echarts_instance_');
                    setOption();
                }
            }, true);
        };
    }
    /**
     * 注册 directive
     */
    var app = angular.module('angular-mixed', ['angular-mixed.util']);
    app.directive('mixedChart', ['$http', 'mixedutil', function ($http, mixedutil) {
        return {
            restrict: 'EA',
            template: '<div class="mixed-content"></div>',
            scope: {
                config: '='
            },
            link: getMixedLinkFunction($http, mixedutil)
        };
    }]);
    /**
     * 依赖方法注入
     */
    angular.module('angular-mixed.util', []).factory('mixedutil', function () {

        var xData = function () {
            var data = [];
            for (var i = 1; i < 13; i++) {
                data.push(i + "月份");
            }
            return data;
        }();

        function formatData(config) {
            if (!config.data) {
                return [];
            }
            var s = dl.groupby(config.field.x.field).execute(config.data);
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
            if (!config.field || !config.field.x || !config.field.x.field) {
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
    });
}());