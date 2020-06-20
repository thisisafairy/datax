(function () {
    'use strict';
    /**
     *  angular echarts map 的 directive  的 link 方法
     * @param {*}  
     * @param {*} 依赖方法
     */
    function getLinkFunction($http, util) {
        return function (scope, element) {
            scope.config = scope.config || {};
            var ndWrapper = element.find('div.map-content')[0], width, height, chart;
            // var width = scope.config.width || parseInt(attrs.width) || parentWidth || 320;
            // var height = scope.config.height || parseInt(attrs.height) || parentHeight || 240;
            ndWrapper.style.width = width + 'px';
            ndWrapper.style.height = height + 'px';
            // var chartEvent = {};
            //生成每个点对象
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

            function getOption(config, data) {
                if (!config.data) {
                    return;
                }
                var map_data = mapEchart(config.data, data);
                var map_obj = util.getMapData(config, map_data);
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
                if (map_obj.map_data.length > 0 && map_obj.order_modal !== '0') {
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
            function setOption() {
                if (!scope.config || !scope.config.data.url) {
                    return;
                }
                chart = echarts.init(ndWrapper);
                var chartOption = getOption(scope.config, scope.data);
                if (chartOption.series.length) {

                    chart.setOption(chartOption);
                    chart.resize();
                }

                chart.resize();
                scope.chartoption = chart.getOption();
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
     * 注入 directive
     */
    var app = angular.module('echarts-map', ['echarts-map.util']);
    app.directive('bmapChart', ['$http', 'maputil', function ($http, util) {
        return {
            restrict: 'EA',
            template: '<div class="map-content"></div>',
            scope: {
                config: '=',
                data: '='
            },
            link: getLinkFunction($http, util)
        };
    }]);
    /**
     * 注入 依赖方法
     */
    angular.module('echarts-map.util', []).factory('maputil', function () {
        //默认bmap参数
        var bmap_params = {
            center: [104.114129, 37.550339],
            zoom: 5,
            roam: true,
            mapStyle: {
                styleJson: [
                    {
                        "featureType": "background",
                        "elementType": "geometry",
                        "stylers": {
                            "color": "#121d2fff"
                        }
                    },
                    {
                        "featureType": "road",
                        "elementType": "all",
                        "stylers": {
                            "color": "#12efffff"
                        }
                    },
                    {
                        "featureType": "administrative",
                        "elementType": "geometry",
                        "stylers": {
                            "color": "#12efffff"
                        }
                    },
                    {
                        "featureType": "city",
                        "elementType": "labels",
                        "stylers": {
                            "visibility": "off"
                        }
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels",
                        "stylers": {
                            "visibility": "off"
                        }
                    },
                    {
                        "featureType": "road",
                        "elementType": "all",
                        "stylers": {
                            "visibility": "off"
                        }
                    },
                    {
                        "featureType": "city",
                        "elementType": "all",
                        "stylers": {
                            "visibility": "off"
                        }
                    },
                    {
                        "featureType": "district",
                        "elementType": "all",
                        "stylers": {
                            "visibility": "off"
                        }
                    },
                    {
                        "featureType": "town",
                        "elementType": "all",
                        "stylers": {
                            "visibility": "off"
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
                backgroundColor: map_obj.map_background_color,
                title: {
                    text: map_obj.map_title,
                    subtext: map_obj.map_sub_title,
                    sublink: map_obj.map_sub_title_link,
                    left: map_obj.map_title_left,
                    textStyle: {
                        color: map_obj.map_title_color
                    },
                    subtextStyle: {
                        color: map_obj.map_sub_title_color
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
                map_sub_title_color: "#ffffff",
                map_sub_title_link: '',//二级标题链接
                show_all_data_text: '',//右下显示全部按钮文字
                show_all_data_text_color: '#ffffff',//右下显示全部按钮文字颜色
                map_background_color: '#404a59',//背景色
                map_data: data,//绘制地图所需数据
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

        return {
            getCoordMap: getCoordMap,
            pushMapData: pushMapData,
            cityNameWithValueToMapData: cityNameWithValueToMapData,
            cityNameArrToMapData: cityNameArrToMapData,
            getConfig: getConfig,
            getMapData: getMapData
        };
    });
})();