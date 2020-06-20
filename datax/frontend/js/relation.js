//操作 sessionStorage 来控制 图表的过滤条件
function setSession(str, obj) {
    if(typeof obj == 'object'){
        sessionStorage.setItem(str, JSON.stringify(obj));
    }
    
    if (typeof obj == 'string' || typeof obj == 'number' ) {
        sessionStorage.setItem(str, obj);
    }
}

function getSeeion(str) {
    try {
        return JSON.parse(sessionStorage.getItem(str));
    } catch (error) {
        return sessionStorage.getItem(str);
    }
}

function changeUrl(url, column, value) {
    if (column === '') {
        return url;
    }
    if (url.indexOf('?') >= 0) {
        var urlArray = url.split('?');
        var urlParam = urlArray[1];
        var urlParamArray = urlParam.split('&');
        var ifHasColumn = false;
        urlParamArray.map(function (index, key) {
            var keyVal = index.split('=');
            if (keyVal[0] === column) {
                ifHasColumn = true;
                keyVal[1] = value;
                urlParamArray[key] = keyVal.join('=');
            }
        });
        if (ifHasColumn) {
            url = urlArray[0] + '?' + urlParamArray.join('&');
        }
        else {

            url = url + '&' + encodeHZ(column) + '=' + encodeHZ(value);
        }
    }
    else {
        url = url + '?' + encodeHZ(column) + '=' + encodeHZ(value);
    }
    return url;
}

function encodeHZ(str){
    var patrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi; 
    if (patrn.test(str)) {
        str = encodeURI(str);
    }

    return str;
}

function doRelation(ar1, ar2) {

    var field = ar2.source.field;
    var fieldAry = field.split('/');
    var n = ar1[fieldAry[0]];
    if (typeof n == 'undefined') {
        return false;
    }
    var i = 1;
    while (typeof n == 'object') {
        n = n[fieldAry[i]];
        i++;
    }
    var key = getField(ar1, ar2);
    var clickform = {
        key: key,
        value: n
    };

    ar2.target.map(function (index) {
        var json = getChartJson(index.id);
        var type = getChartType(index.id);
        var paramArry = getSeeion('paramArry');
        var active = getSeeion('active');
        var url = json.data.url;
        try{//这里参数paramArry在场景设计下为空
            paramArry[active].map(function (item) {
                url = changeUrl(url, item.key, item.value);
            });
        }catch(err){
            console.log('#场景设计里没有这个参数，这里获取会出错，场景预览里对这个参数进行了生成和传递#');
            console.log('****error***=',err);
        }
        if(url.indexOf('?') >= 0){
            json.data.url = url + '&' + clickform.key + '(_)equal=' + clickform.value;
        }
        else{
            json.data.url = url + '?' + clickform.key + '(_)equal=' + clickform.value;
        }
        console.log('json====',json);
        if (type == 'echarts') {
            buildEchart(json, $("#" + index.id));
        }
        else if (type === 'table') {
            $("#" + index.id).myTableFuc(json);
        }

    });
}

function getChartJson(id) {
    var config;
    var type = $("#" + id).closest('.chart-content').attr('data-type');
    if (type === 'echarts') {
        config = $("#" + id).closest(".chart-content").siblings('.ecdatatag:eq(0)').text();
    }
    else {
        config = $("#" + id).closest(".chart-content").siblings('.tdatatag:eq(0)').text();
    }
    try {
        config = JSON.parse(config);
    } catch (error) {
        config = {};
    }
    return config;
}


function setConfig(id, config) {
    var type = $("#" + id).closest('.chart-content').attr('data-type');
    if (type === 'echarts') {
        $("#" + id).closest(".chart-content").siblings('.ecdatatag ').text(JSON.stringify(config));
    }
    else {
        $("#" + id).closest(".chart-content").siblings('.tdatatag ').text(JSON.stringify(config));
    }

}

function getChartType(id) {
    var type = $("#" + id).closest('.chart-content').attr('data-type');

    return type;
}

function getChartField(json) {
    var type = json.data.type;
    var field;
    switch (type) {
        case 'bmap':
            field = 'data/name';
            break;
        case 'pie':
            field = 'data/name';
            break;
        case 'funnel':
            field = 'data/name';
            break;
        case 'mixed':
            field = 'name';
            break;
    }

    return field;
}

function getField(clickjson, sourceconfig) {
    var id = sourceconfig.source.id;
    var config = getChartJson(id);
    var type = config.data.type;
    var field;
    switch (type) {
        case 'bmap':
            field = config['area']['x']['field'];
            break;
        case 'pie':
            field = clickjson.seriesName;
            break;
        case 'funnel':
            field = clickjson.seriesName;
            break;
        case 'mixed':
            field = config['field']['x']['field']
            break;
    }

    return field;
}


function doRedirect(ar1, ar2) {
    console.log(ar1, ar2);
}