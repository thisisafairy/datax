var currency_symbols = [{
        id: '',
        name: '请选择'
    },
    {
        id: '￥',
        name: '人民币'
    },
    {
        id: '$',
        name: '美元'
    },
    {
        id: '€',
        name: '欧元'
    },
    {
        id: '£',
        name: '英镑'
    },
    {
        id: '￥',
        name: '日元'
    }
];

var single_index_handle_methods = {
    //展示类型
    index_chart_types: [{
            id: 'text',
            name: '指标卡'
        },
        {
            id: 'thermometers',
            name: '温度计'
        },
        {
            id: 'progress-bar',
            name: '进度条'
        }
    ],
    //数据处理方式
    column_handle_types: [{
            id: 'SUM',
            name: '求和'
        },
        {
            id: 'AVG',
            name: '平均数'
        },
        {
            id: 'MAX',
            name: '最大值'
        },
        {
            id: 'MIN',
            name: '最小值'
        }
    ],
    //数据展示方式
    data_show_methods: [{
            id: 'defult',
            name: '默认'
        },
        {
            id: 'percent',
            name: '百分比'
        },
        {
            id: 'finance',
            name: '财务计数'
        }
    ],
    //单位转换
    unit_trans: {
        symbol: [{
                id: '',
                name: '无'
            },
            {
                id: 'x',
                name: 'x'
            },
            {
                id: '÷',
                name: '÷'
            }
        ],
        num: ''
    },
    //小数点保留位数
    point_nums: [{
            id: '',
            name: '保持原样'
        },
        {
            id: '0',
            name: '不保留小数'
        },
        {
            id: '1',
            name: '保留一位'
        },
        {
            id: '2',
            name: '保留二位'
        },
        {
            id: '3',
            name: '保留三位'
        },
        {
            id: '4',
            name: '保留四位'
        },
        {
            id: '5',
            name: '保留五位'
        },
        {
            id: '6',
            name: '保留六位'
        },
    ],
    title_positions: [{
            id: 'top',
            name: '上方'
        },
        {
            id: 'bottom',
            name: '下方'
        }
    ],
    currency_symbols: currency_symbols
};

var single_handle_obj = {
    index_show_type: 'text', //类型：文本、温度计、进度条
    data_show_method: 'defult', //数据展示方式：百分比，财务
    title_position: 'top', //标题位置
    title_style: { //标题样式
        "font-size": "16px",
        "color": "#000000",
        'text-align': 'center'
    },
    aim_data: { //进度条、温度计的总值
        data: ''
    },
    currency_symbol: '',
    point_num: '',
    unit_trans: { //单位转换 亿->万
        symbol: '', //x或÷
        num: '' //
    },
    unit: '',
    text: {
        style: {
            'font-size': '16px',
            'color': '#000000',
            'text-align': 'center'
        }
    },
    progress_bar: {
        data: '0%',
        container_style: {
            "width": "300px",
            "background": "#ebebeb"
        },
        data_style: {
            "width": "0%",
            "background": "#cccccc"
        }
    },
    thermometers: {

    },
    monitors: { //业务规则
        rows: [{
            //大于等于{min} 且小于等于{max}时,文本显示{color}
            min: '',
            max: '',
            color: ''
        }]
    }
}

function format_to_finance(num) {
    return num && num
        .toString()
        .replace(/(^|\s)\d+/g, (m) => m.replace(/(?=(?!\b)(\d{3})+$)/g, ','))
}

//文本类型展示时的数据处理
function handle_data(text, handle_obj) {
    var return_show_data = text;
    if (!isNaN(return_show_data)) {
        //
        if (handle_obj.unit_trans.symbol != '' && handle_obj.unit_trans.symbol != undefined &&
            handle_obj.unit_trans.num != '' && handle_obj.unit_trans.num != undefined) {
            if (handle_obj.unit_trans.symbol == 'x') {
                return_show_data = mul(return_show_data, handle_obj.unit_trans.num);
            } else if (handle_obj.unit_trans.symbol == '÷') {
                return_show_data = div(return_show_data, handle_obj.unit_trans.num);
            }
        }
        if (handle_obj.point_num != '') {
            return_show_data = return_show_data.toFixed(handle_obj.point_num);
        }
        var data_show_method = handle_obj.data_show_method;
        if (data_show_method == "percent") {
            return_show_data = mul(return_show_data, 100) + "%";
        }
        if (data_show_method == "finance") {
            return_show_data = format_to_finance(return_show_data);
        }
        if (handle_obj.currency_symbol) {
            return_show_data = handle_obj.currency_symbol + ' ' + return_show_data;
        }
    }
    return return_show_data;
}

function handle_text_chart(text, handle_obj) {
    
}

function handle_data_title(text, handle_obj) {
    var return_show_data = text;
    if (return_show_data) {
        if (handle_obj.unit) {
            return_show_data = return_show_data + " (单位:" + handle_obj.unit + ")";
        }
    }
    return return_show_data;
}

function addPx(font_size) {
    if (font_size != '' && font_size != undefined && font_size != null) {
        font_size = font_size.replace(/px/, '');
        font_size = font_size.replace(/p/, '');
        font_size = font_size.replace(/x/, '');
        font_size += 'px';
    }
    return font_size;
}

function add(a, b) {
    var c, d, e;
    try {
        c = a.toString().split(".")[1].length;
    } catch (f) {
        c = 0;
    }
    try {
        d = b.toString().split(".")[1].length;
    } catch (f) {
        d = 0;
    }
    return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
}

function sub(a, b) {
    var c, d, e;
    try {
        c = a.toString().split(".")[1].length;
    } catch (f) {
        c = 0;
    }
    try {
        d = b.toString().split(".")[1].length;
    } catch (f) {
        d = 0;
    }
    return e = Math.pow(10, Math.max(c, d)), (mul(a, e) - mul(b, e)) / e;
}

function mul(a, b) {
    var c = 0,
        d = a.toString(),
        e = b.toString();
    try {
        c += d.split(".")[1].length;
    } catch (f) {}
    try {
        c += e.split(".")[1].length;
    } catch (f) {}
    return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c);
}

function div(a, b) {
    var c, d, e = 0,
        f = 0;
    try {
        e = a.toString().split(".")[1].length;
    } catch (g) {}
    try {
        f = b.toString().split(".")[1].length;
    } catch (g) {}
    return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), mul(c / d, Math.pow(10, f - e));
}