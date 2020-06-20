var chartTypeArrs = ["pie", "gauge", "map", "bmap", "mixed", "scatter", "radar", "single", "funnel","candlestick","wordCloud","treemap","graph","sunburst","dbar",'tree'];

function initChartConfig(type, url, width, height) {
    var rs;
    switch (type) {
        case 'pie':
            rs = {
                width: width,
                height: height,
                radius_range: 0,
                radius_interval: 25,
                start_radius: 45,
                radius_split:0,
                label: {
                    normal: {
                        show: 'true',
                        position: 'outside'
                    }
                },
                data: {
                    type: 'pie',
                    url: url
                },
                field: {
                    x: [],
                    y: {}
                },
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b}: {c} ({d}%)"
                },
                legend: {
                    show: '1',
                    type: 'plain',
                    orient: 'horizontal',
                    position: 'downright'
                }
            };
            break;
        case 'funnel':
            rs = {
                width: width,
                height: height,
                data: {
                    type: 'funnel',
                    url: url
                },
                field: {
                    x: [{}],
                    y: {}
                },
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b}: {c} ({d}%)"
                },
                legend: {
                    show: '1',
                    type: 'plain',
                    orient: 'horizontal',
                    position: 'downright'
                }
            };
            break;
        case "mixed":
            rs = {
                data: {
                    type: 'mixed',
                    url: url
                },
                grid: {
                    bottom: '80',
                    containLabel: true
                },
                width: width,
                height: height,
                ifmerge: '2',
                transpose: '2',
                barradius:0,
                field: {
                    x: {},
                    y: []
                },
                legend: {
                    show: '1',
                    type: 'plain',
                    orient: 'horizontal',
                    position: 'downright'
                }

            };
            break;
        case 'bmap':
            rs = {
                width: width,
                height: height,
                "mapdata": {
                    "map_theme": 'dark',
                    "ifBmap": '2',
                    "ifarea": "2",
                    "order_modal": "1",
                    "top_num": 7,
                    "show_all_data_text_color": "#ffffff",
                    "top_point_size": 1,
                    "top_area_solor": "blue",
                    "general_point_size": 1,
                    "area_solor": "red"
                },
                "option": {},
                "data": {
                    "url": url,
                    "type": "bmap"
                },
                "area": {
                    "x": {},
                    "y": {},
                },
                "point": []
            };
            break;
        case 'gauge':
            rs = {
                width: width,
                height: height,
                "data": {
                    "url": url,
                    "type": "gauge"
                },
                "field": {
                    "y": []
                },
                ifmerge: '2',
                name: ''
            };
            break;
        case 'scatter':
            rs = {
                width: width,
                height: height,
                grid: {
                    left: '10%',
                    right: '30%',
                    top: '12%',
                    bottom: '15%',
                    containLabel: true
                },
                field: {
                    x: {},
                    y: [{}, {}]
                },
                data: {
                    url: url,
                    type: 'scatter'
                },
                legend: {
                    show: '1',
                    type: 'plain',
                    orient: 'vertical',
                    position: 'downright'
                }
            };
            break;
        case "radar":
            rs = {
                width: width,
                height: height,
                field: {
                    x: {},
                    y: {},
                    legend: {}
                },
                data: {
                    url: url,
                    type: 'radar'
                },
                legend: {
                    show: '1',
                    type: 'plain',
                    orient: 'vertical',
                    position: 'downright'
                }

            };
            break;
        case "single":
            rs = {
                width: width,
                height: height,
                field: {
                    y: []
                },
                data: {
                    url: url,
                    type: 'single'
                },
                type: 'card',
                option: {
                    fixed: 2,
                    card: {
                        width: 200,
                        height: 100,
                        titlecolor: '#999',
                        valuecolor: '#999',
                        fillcolor: "#fff",
                        strokecolor: "#999",

                    },
                    thermometer: {
                        isMaxAuto: "1",
                        max: 0,
                        flip: '2',
                        pointcolor: "#fd4d49",
                        bordercolor: "#fd4d49",
                        barcolor: "#fd4d49",
                        titlecolor: "#000"
                    }

                }
            };
            break;
        case "candlestick":
            rs = {
                data: {
                    type: 'candlestick',
                    url: url
                },
                grid: {
                    bottom: '80',
                    containLabel: true
                },
                width: width,
                height: height,
                transpose: '2',
                field: {
                    x: {},
                    y: []
                },
                legend: {
                    show: '1',
                    type: 'plain',
                    orient: 'vertical',
                    position: 'downright'
                }

            };
            break;
        case "wordCloud":
            rs = {
                data: {
                    type: 'wordCloud',
                    url: url
                },
                width: width,
                height: height,
                drawOutOfBound: false,
                sizeRange:[ 16, 90 ],
                left: 'center',
                top: 'center',
                shape: 'circle',
                field: {
                    x: [],
                    y: {}
                },
                legend: {
                    show: '0'
                }

            };
            break;
        case "treemap":
            rs = {
                data: {
                    type: 'treemap',
                    url: url
                },
                width: width,
                height: height,
                field: {
                    x: [],
                    y: {}
                },
                legend: {
                    show: '0'
                }

            };
            break;
        case "graph":
            rs = {
                data: {
                    type: 'graph',
                    url: url
                },
                width: width,
                height: height,
                field: {
                    x: [],
                    y: {}
                },
                legend: {
                    show: '0'
                }

            };
            break;
        case "sunburst":
            rs = {
                data: {
                    type: 'sunburst',
                    url: url
                },
                width: width,
                height: height,
                field: {
                    x: [],
                    y: {}
                },
                legend: {
                    show: '0'
                }

            };
            break;

        case 'dbar':
            rs = {
                width: width,
                height: height,
                grid: {
                    containLabel: true
                },
                field: {
                    x: {},
                    y: [{}, {}]
                },
                data: {
                    url: url,
                    type: 'dbar'
                },
                legend: {
                    show: '0'
                }
            };
            break;
        case 'thermometer':
            rs = {
                width: width,
                height: height,
                "data": {
                    "url": url,
                    "type": "thermometer"
                },
                "field": {
                    "y": []
                },
                name: ''
            };
        case 'tree':
            rs = {
                width: width,
                height: height,
                field: {
                    x: {},
                    y: {}
                },
                data: {
                    url: url,
                    type: 'tree'
                },
                legend: {
                    show: '0'
                }
            };
            break;
    }
    rs.title = {
        text: '请输入主标题',
        subtext: '请输入副标题',
        position: 'upcenter',
        textStyle: {
            color: '#000000',
            fontSize:18
        },
        subtextStyle: {
            color: '#000000',
            fontSize: 12
        },
    };
    rs.filter = {
        canfilter:'1',
        year:{
            field:{},
            value:'auto'
        },
        month:{
            field:{},
            value:'auto'
        },
        filters:[]
    };
    rs.theme = 'soft';//全局默认主题
    return rs;
}