/* #region  固定变量 */
var zero = 0
var nullStr = ''
var nullObj = {}
var nullArr = []

var fontSizes = [
    9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 32, 36, 42, 50
]

var fontFamilys = [{
        'value': 'Arial',
        'name': '等线'
    },
    {
        'value': '"Helvetica Neue", Helvetica',
        'name': 'Mac默认'
    },
    {
        'value': 'SimHei',
        'name': '黑体'
    },
    {
        'value': 'SimSun',
        'name': '宋体'
    },
    {
        'value': 'FangSong',
        'name': '仿宋'
    },
    {
        'value': 'NSimSun',
        'name': '新宋体'
    },
    {
        'value': 'Microsoft YaHei',
        'name': '微软雅黑'
    },
    {
        'value': 'Microsoft JhengHei',
        'name': '微软正黑体'
    },
    {
        'value': 'KaiTi',
        'name': '楷体'
    },
    {
        'value': 'MingLiU',
        'name': '细明体'
    },
    {
        'value': 'STHeiti Light',
        'name': '华文细黑'
    },
    {
        'value': 'STHeiti',
        'name': '华文黑体'
    },
    {
        'value': 'STKaiti',
        'name': '华文楷体'
    },
    {
        'value': 'STSong',
        'name': '华文宋体'
    },
    {
        'value': 'STFangsong',
        'name': '华文仿宋'
    },
]

var cellEditType = [{
        'value': 'text',
        'name': '输入框'
    },
    {
        'value': 'select',
        'name': '下拉框'
    },
    {
        'value': 'date',
        'name': '日期选择框'
    }
]

var summaryMethod = [{
        'code': 'none',
        'name': '无'
    },
    {
        'code': 'sum',
        'name': '加总'
    },
    {
        'code': 'avg',
        'name': '平均'
    },
    {
        'code': 'max',
        'name': '最大'
    },
    {
        'code': 'min',
        'name': '最小'
    }
]

var portalStyle = {
    'default': [{
        'code': 'glass',
        'name': '毛玻璃',
        'bg': {
            'backgroundImage': 'url("/frontend/image/homepage/glass.bg.jpg")',
            'backgroundSize': 'cover',
            'backgroundRepeat': 'no-repeat',
            'color': 'rgba(255, 255, 255, 1)'
        },
        'banner': {
            'backgroundColor': 'rgba(0, 0, 0, 0.4)',
            'height': '50px',
            'text': {
                'color': 'rgba(255, 255, 255, 0.8)',
                'fontSize': '18px',
                'lineHeight': '50px',
                'textAlign': 'center',
                'fontWeight': 'bold',
                'letterSpacing': '7px',
            },
            'searchBox': {
                'theme': 'glass',
                'border': '1px solid rgba(222, 222, 222, 0.3)',
                'borderRadius': '4px',
                'background': 'rgba(255, 255, 255 ,0)',
                'color': 'rgba(255, 255, 255, 0.3)'
            },
            'icon': {
                'color': 'rgba(255, 255, 255, 0.3)'
            }
        },
        'menu': {
            'collapse': {
                'backgroundColor': 'rgba(0, 0, 0, 0.3)',
                'color': 'rgba(255, 255, 255, 1)',
                'fontSize': '12px'
            },
            'expand': {
                'backgroundColor': 'rgba(30, 44, 61, 1)',
                'color': 'rgba(255, 255, 255, 1)',
                'hover': 'glass',
                'fontSize': '14px',
                'textAlign': 'left',
                'title': {
                    'backgroundColor': 'rgba(16, 32, 49, 1)',
                    'fontSize': '12px'
                }
            }
        },
        'quickAccess': {
            'backgroundColor': 'rgba(0, 0, 0, 0.3)',
            'title': {
                'backgroundColor': 'rgba(0, 0, 0, 0.2)',
                'fontSize': '16px',
                'color': 'rgba(254, 254, 255, 1)'
            },
            'content': {
                'backgroundColor': 'rgba(0, 0, 0, 0)',
                'color': 'rgba(255, 255, 255, 1)',
                'fontSize': '14px'
            }
        },
        'list': {
            'backgroundColor': 'rgba(0, 0, 0, 0.2)',
            'title': {
                'backgroundColor': 'rgba(0, 0, 0, 0.2)',
                'fontSize': '16px',
                'color': 'rgba(254, 254, 255, 1)',
                'more': {
                    'fontSize': '14px',
                    'color': 'rgba(255, 255, 255, 0.5)'
                }
            },
            'item': {
                'borderBottom': '1px solid rgba(232, 232, 232, 0.16)',
                'title': {
                    'fontSize': '14px',
                    'color': 'rgba(254, 254, 255, 1)'
                },
                'text': {
                    'fontSize': '14px',
                    'color': 'rgba(255, 255, 255, 0.6)',
                }
            }
        },
        'expansion': {
            'theme': 'glass',
            'backgroundColor': 'rgba(0, 0, 0, 0.3)'
        }
    }]
}

var separationClassArr = [{
    'value': 'separation-28',
    'name': '28分'
}, {
    'value': 'separation-37',
    'name': '37分'
}, {
    'value': 'separation-46',
    'name': '46分'
}, {
    'value': 'separation-55',
    'name': '等分'
}, {
    'value': 'separation-64',
    'name': '64分'
}, {
    'value': 'separation-73',
    'name': '73分'
}, {
    'value': 'separation-82',
    'name': '82分'
}]

var weekTitle = [{
        "short": "一",
        "full": "周一"
    }, {
        "short": "二",
        "full": "周二"
    },
    {
        "short": "三",
        "full": "周三"
    }, {
        "short": "四",
        "full": "周四"
    },
    {
        "short": "五",
        "full": "周五"
    }, {
        "short": "六",
        "full": "周六"
    },
    {
        "short": "日",
        "full": "周日"
    }
]

var undefinedComponent = '未命名组件'
/* #endregion */

/* #region  angular获取dom的方法 */
function getByClass(eleClass) {
    return angular.element(document.querySelector("." + eleClass))
}

function getById(eleId) {
    return angular.element(document.querySelector("#" + eleId))
}

function getByEle(ele) {
    return angular.element(ele)
}
/* #endregion */

/* #region 空和非空判断 空字符串也会判断成空  */
// 是否不为空
function isNotNull(val) {
    if (val != undefined && val != null && val != 'null') {
        if (typeof val == 'string' && val.trim().length > 0) {
            return true
        } else if (typeof val != 'string') {
            return true
        }
    }
    return false
}

// 是否为空
function isNull(val) {
    if (isNotNull(val)) {
        return false
    } else {
        return true
    }
}
/* #endregion */

/* #region  传入对象为空则返回''、0、{}、[] */
function nullToStr(val) {
    if (isNull(val)) {
        return nullStr
    } else {
        return val
    }
}

function nullToNum(val) {
    if (isNaN(val) || isNull(val)) {
        return zero
    } else {
        return val
    }
}

function nullToObj(val) {
    if (isNull(val)) {
        return nullObj
    } else {
        return val
    }
}

function nullToArr(val) {
    if (isNull(val)) {
        return nullArr
    } else {
        return val
    }
}
/* #endregion */

function sleep(numberMillis) {
    var now = new Date()
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date()
        if (now.getTime() > exitTime)
            return
    }
}

//dateFtt("yyyy年MM月dd日hh时mm分",new Date(rs.dataList[i][key]))
/**************************************时间格式化处理************************************/
function dateFtt(fmt, date) { //author: meizz
    if (!fmt) {
        fmt = 'yyyy-MM-dd hh:mm:ss';
    }
    if (!date) {
        date = new Date();
    }
    if (typeof date == 'string') {
        date = new Date(date)
    }
    var o = {
        "M+": date.getMonth()+1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function getDateValues(filterType, defaultFilterName, val) {
    var currentDate = new Date();
    var currentDateStr = dateFtt('yyyy-MM-dd', currentDate);
    var currentDay = currentDate.getDate();
    var currentMonth = currentDate.getMonth()+1;
    alert(currentMonth)
    var currentYear = currentDate.getFullYear();
    if (defaultFilterName == undefined || defaultFilterName == null ||
        defaultFilterName == '' || defaultFilterName == []) {
        return (typeof val == 'string') ? '' : [];
    }
    switch (defaultFilterName) {
        case 'currentDay':
            if (filterType == 'select') {
                val = [{
                    'id': currentDay,
                    'name': currentDay,
                    'checked': true,
                    'show': true
                }];
            } else if (filterType == 'text') {
                val = currentDay + '';
            } else if (filterType == 'date') {
                val = [currentDateStr, currentDateStr];
            } else {
                val = (typeof val == 'string') ? '' : [];
            }
            break;
        case 'currentMonth':
            if (filterType == 'select') {
                val = [{
                    'id': currentMonth,
                    'name': currentMonth,
                    'checked': true,
                    'show': true
                }];
            } else if (filterType == 'text') {
                val = currentMonth + '';
            } else if (filterType == 'date') {
                val = [dateFtt('yyyy-MM', currentDate) + '-01', dateFtt('yyyy-MM', currentDate) + '-' + getMonthDays(currentMonth, currentYear)];
            } else {
                val = (typeof val == 'string') ? '' : [];
            }
            break;
        case 'currentYear':
            if (filterType == 'select') {
                val = [{
                    'id': currentYear,
                    'name': currentYear,
                    'checked': true,
                    'show': true
                }];
            } else if (filterType == 'text') {
                val = currentYear + '';
            } else if (filterType == 'date') {
                val = [currentYear + '-01-01', currentYear + '-12-31'];
            } else {
                val = (typeof val == 'string') ? '' : [];
            }
            break;
        case 'backWeek':
            var d = new Date();
            d.setDate(d.getDate() - 7);
            return [dateFtt('yyyy-MM-dd', d), currentDateStr];
            break;
        case 'backMonth':
            var d = new Date();
            d.setDate(d.getDate() - 30);
            return [dateFtt('yyyy-MM-dd', d), currentDateStr];
            break;
        case 'currentQuarter':
            if (currentMonth <= 3) {
                val = [currentYear + '-01-01', currentYear + '-03-31'];
            } else if (currentMonth > 3 && currentMonth <= 6) {
                val = [currentYear + '-04-01', currentYear + '-6-30'];
            } else if (currentMonth > 6 && currentMonth <= 9) {
                val = [currentYear + '-07-01', currentYear + '-9-30'];
            } else if (currentMonth > 9 && currentMonth <= 12) {
                val = [currentYear + '-10-01', currentYear + '-12-31'];
            } else {
                val = (typeof val == 'string') ? '' : [];
            }
            break;
    }
    return val;
}

//获得某月的天数
function getMonthDays(myMonth, myYear) {
    var days = 0;
    switch (myMonth) {
        case 1:
            days = 31;
            break;
        case 2:
            if (((myYear % 4) == 0) && ((myYear % 100) != 0) || ((myYear % 400) == 0)) {
                days = 29;
            } else {
                days = 28;
            }
            break;
        case 3:
            days = 31;
            break;
        case 4:
            days = 30;
            break;
        case 5:
            days = 31;
            break;
        case 6:
            days = 30;
            break;
        case 7:
            days = 31;
            break;
        case 8:
            days = 31;
            break;
        case 9:
            days = 30;
            break;
        case 10:
            days = 31;
            break;
        case 11:
            days = 30;
            break;
        case 12:
            days = 31;
            break;
    }
    return days;
}

function changeUrlArg(url, arg, val) {
    var pattern = arg + '=([^&]*)';
    var replaceText = arg + '=' + val;
    return url.match(pattern) ? url.replace(eval('/(' + arg + '=)([^&]*)/gi'), replaceText) : (url.match('[\?]') ? url + '&' + replaceText : url + '?' + replaceText);
}

function cycleDelUrlArg(url, arg) {
    var count = (url.split(arg)).length;
    if (count > 1) {
        for (var i = 0; i < count; i++) {
            url = delUrlArg(url, arg);
        }
    }
    if (url.charAt(url.length - 1) == '?') {
        url = url.substr(0, url.length - 1);
    }
    return url;
}

function addArgToUrl(originUrl, argName, argValue) {
    var url = originUrl;
    url = cycleDelUrlArg(url, argName);
    if (url.indexOf('?') > 0) {
        url = url + '&' + argName + '=' + argValue;
    } else {
        url = url + '?' + argName + '=' + argValue;
    }
    return url
}

function delUrlArg(url, arg) {
    // 如果不包括此参数
    if (url.indexOf(arg) == -1)
        return url;

    var arr_url = url.split('?');

    var base = arr_url[0];

    var arr_param = arr_url[1].split('&');

    var index = -1;

    for (i = 0; i < arr_param.length; i++) {

        var paired = arr_param[i].split('=');

        if (paired[0] == arg) {

            index = i;
            break;
        }
    }

    if (index == -1) {
        return url;
    } else {
        arr_param.splice(index, 1);
        return base + "?" + arr_param.join('&');
    }
}

// 从当前url中获取名为name的参数的值
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
    var context = "";
    if (r != null) {
        context = r[2];
    }
    reg = null;
    r = null;
    return context == null || context == "" || context == "undefined" ? "" : context;
}

// 获取所有url中的参数
function getAllUrlParameter() {
    var url = location.search;
    var parameters = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        var strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            parameters[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
        }
    }
    return parameters;
}

function removeEmpty(obj) {
    Object.keys(obj).forEach(function (key) {
        (obj[key] && typeof obj[key] === 'object') && removeEmpty(obj[key]) ||
            (obj[key] === undefined || obj[key] === null || obj[key] === '') && delete obj[key]
    });
    return obj;
};

// 生成uuid
// example:
// 8 character ID (base=2)
//uuid(8, 2) // "01001010"
// 8 character ID (base=10)
//uuid(8, 10) // "47473046"
// 8 character ID (base=16)
//uuid(8, 16) // "098F4D35"
function generateUuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [],
        i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data. At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}

function strToUnicode(text) {
    if (text && typeof text == 'string' && text.length > 0) {
        if (text.length == 1) {
            return '\\u' + text.charCodeAt(0).toString(16);
        } else {
            var tempArr = text.split('');
            var returnStr = '';
            tempArr.forEach(function (value) {
                returnStr = returnStr + '\\u' + value.charCodeAt(0).toString(16);
            })
            return returnStr;
        }
    } else {
        return text;
    }
}

// 判断对象是否在对象数组里面
function inArray(arr, obj, keyName, isReplace) {
    var _isInArray = false
    if (arr.length > 0) {
        if (isReplace) {
            for (var _i = 0; _i < arr.length; _i++) {
                if (arr[_i][keyName] == obj[keyName]) {
                    _isInArray = true
                    arr[_i] = obj
                }
            }
            if (!_isInArray) {
                arr.push(obj)
            }
        } else {
            _isInArray = arr.some(function (value) {
                return obj[keyName] == value[keyName]
            })
        }
    } else {
        if (isReplace) {
            arr.push(obj)
        }
    }
    return _isInArray
}

function delFromArr(arr, keyName, keyValue) {
    for (var _i = 0; _i < arr.length; _i++) {
        if (arr[_i][keyName] + '' == keyValue + '') {
            arr.splice(_i, 1)
            break
        }
    }
}

// 将数字格式化成财务计数格式
function financeFormat(num) {
    num = parseFloat((num + '').replace(/[^\d\.-]/g, '')) + ''
    var l = num.split('.')[0].split('').reverse(),
        r = num.split('.')[1]
    var t = ''
    for (var i = 0; i < l.length; i++) {
        t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? ',' : '')
    }
    var _returnVal = t.split('').reverse().join('')
    if (r) {
        _returnVal = _returnVal + '.' + r
    }
    return _returnVal
}

//将excel中的A，B等列名和数字进行互相转换，下标从0开始，A <--> 1, B <--> 2
/**
 * type: translate 将A转换成1，reset：将1转换成A
 */
function translateExcelColName(str, type) {
    if (type) {
        if (type == 'translate') {
            var _tempArr = (str + '').split('')
            var _tempStr = ''
            _tempArr.forEach(function (val) {
                _tempStr += val.charCodeAt(0) - 64
            })
            return _tempStr
        } else if (type == 'reset') {
            var overage = str % 26
            var times = parseInt(str / 26)
            var _tempStr = ''
            // 一位
            if (times < 1) {
                _tempStr += String.fromCharCode((str - -64))
                // 二位
            } else if (times > 0 && times <= 26) {
                if (overage > 0) {
                    _tempStr += String.fromCharCode((times - -64)) + String.fromCharCode((overage - -64))
                } else {
                    for (var _i = 1; _i < times; _i++) {
                        _tempStr += String.fromCharCode((times - -63))
                    }
                    _tempStr += 'Z'
                }
            }
            return _tempStr
        }
    }
}

function mdWarningAlert(md, ev, id, msg) {
    if (ev) {
        md.show(
            md.alert()
            .parent(angular.element(document.querySelector('#' + id)))
            .clickOutsideToClose(true)
            .textContent('错误:' + msg)
            .ok('确定')
            .targetEvent(ev)
        )
    } else {
        md.show(
            md.alert()
            .parent(angular.element(document.querySelector('#' + id)))
            .clickOutsideToClose(true)
            .textContent('错误:' + msg)
            .ok('确定')
        )
    }

}

function mdErrorAlert(md, ev, id, serverErrorMsg) {
    if (ev) {
        md.show(
            md.alert()
            .parent(angular.element(document.querySelector('#' + id)))
            .clickOutsideToClose(true)
            .textContent('服务器内部错误，请联系管理员！')
            .ok('确定')
            .targetEvent(ev)
        )
    } else {
        md.show(
            md.alert()
            .parent(angular.element(document.querySelector('#' + id)))
            .clickOutsideToClose(true)
            .textContent('服务器内部错误，请联系管理员！')
            .ok('确定')
        )
    }
    console.log(serverErrorMsg)
}

function getBrowserInfo() {
    var Sys = {};
    var ua = navigator.userAgent.toLowerCase();
    var re = /(msie|rv:11|firefox|chrome|opera|version).*?([\d.]+)/;
    var m = ua.match(re);
    Sys.browser = m[1].replace(/version/, "safari").replace(/msie/, "ie").replace(/rv:11/, "ie");
    Sys.ver = m[2] ? m[2] : 'unknow';
    return Sys;
}

/**
 * 普通数组去重
 * sourceArr: 
 * input: [1,1,1,1,1,2,2,2,5,6,7,8,'q','q','q','a','v','v','q',true, false, true, true]
 * output: [1, 2, 5, 6, 7, 8, "q", "a", "v", true, false]
 */
function unique(sourceArr) {
    var obj = {};
    return sourceArr.filter(function (item) {
        return obj.hasOwnProperty(typeof item + item) ? false : (obj[typeof item + item] = true)
    })
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = (cookies[i]).trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
axios.defaults.headers.get['X-CSRFToken'] = getCookie('csrftoken')
axios.defaults.headers.post['X-CSRFToken'] = getCookie('csrftoken')

angular.module('commonHeader', []).config(function ($httpProvider) {
    $httpProvider.defaults.headers.post = {
        'X-CSRFToken': getCookie('csrftoken'),
        'Content-Type': 'application/json'
    }
})

/**是否为安卓设备 */
function isAndroid() {
    return (navigator.userAgent).indexOf('Android') > -1 || (navigator.userAgent).indexOf('Adr') > -1
}

/**是否为ios设备 */
function isiOS() {
    return !!(navigator.userAgent).match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
}

/**是否为ios设备 */
function isMobileDevice() {
    return !!(/Android|webOS|iPhone|iPod|Windows Phone|iPad|SymbianOS|BlackBerry/i.test(navigator.userAgent))
}

function clearChecked(arr) {
    arr.forEach(function (_value) {
        if (_value.children) {
            _value.children.forEach(function (__value) {
                __value['checked'] = false
            })
        } else {
            _value['checked'] = false
        }
    })
}

/**
 * 删除字符串的最后多少位
 * @author sola
 * @created 2019/04/16 13:32:40
 */
function subStrEnd(str, num) {
    if (!num) {
        num = 1
    }
    if (isNotNull(str) && str.length > num) {
        return str.substring(0, str.length - num)
    } else {
        return str
    }
}

/**
 * 判断样式是否存在
 * @author sola
 * @created 2019/06/06 14:21:41
 */
function hasClass(ele, cls) {
    if (typeof (ele.length) !== 'undefined' && ele.length) {
        ele = ele[0];
    }
    return ele.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"));
}

/**
 * 为指定的dom元素添加样式
 * @author sola
 * @created 2019/06/06 14:21:57
 */
function addClass(ele, cls) {
    if (!this.hasClass(ele, cls)) ele.className += " " + cls;
}

/**
 * 删除指定dom元素的样式
 * @author sola
 * @created 2019/06/06 14:22:03
 */
function removeClass(ele, cls) {
    if (hasClass(ele, cls)) {
        var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
        ele.className = ele.className.replace(reg, " ");
    }
}

/**
 * 如果存在(不存在)，就删除(添加)一个样式
 * @author sola
 * @created 2019/06/06 14:22:11
 */
function toggleClass(ele, cls) {
    if (hasClass(ele, cls)) {
        removeClass(ele, cls);
    } else {
        addClass(ele, cls);
    }
}

/**
 * 遍历该元素及该元素祖先元素, 判断是否有传入的选择器
 * @author sola
 * @created 2019/06/10 14:26:29
 */
function closestElm(el, selector) {
    if (typeof (el.length) !== 'undefined' && el.length) {
        el = el[0];
    }

    var matchesFn;

    // find vendor prefix
    ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
        if (typeof document.body[fn] === 'function') {
            matchesFn = fn;
            return true;
        }
        return false;
    });

    // traverse parents
    var parent;
    while (el !== null) {
        parent = el.parentElement;
        if (parent !== null && parent[matchesFn](selector)) {
            return parent;
        }
        el = parent;
    }

    return null;
}

/**
 * 获取当前浏览器的宽高
 * cWidth  可见区域宽
 * cHeight  可见区域高
 * sWidth  可见区域宽 + 有滚动条时看不见的宽
 * sHeight  可见区域高 + 有滚动条时看不见的高
 * sLeft  滚动条离浏览器左边的距离
 * sTop  滚动条离浏览器顶部的距离
 * @author sola
 * @created 2019/06/10 21:03:35
 */
function browserAvailableAreaSize() {
    var areaSize = {}
    if (document.compatMode == "BackCompat") {
        areaSize['cWidth'] = document.body.clientWidth;
        areaSize['cHeight'] = document.body.clientHeight;
        areaSize['sWidth'] = document.body.scrollWidth;
        areaSize['sHeight'] = document.body.scrollHeight;
        areaSize['sLeft'] = document.body.scrollLeft;
        areaSize['sTop'] = document.body.scrollTop;
    } else { //document.compatMode == \"CSS1Compat\"
        areaSize['cWidth'] = document.documentElement.clientWidth;
        areaSize['cHeight'] = document.documentElement.clientHeight;
        areaSize['sWidth'] = document.documentElement.scrollWidth;
        areaSize['sHeight'] = document.documentElement.scrollHeight;
        areaSize['sLeft'] = document.documentElement.scrollLeft == 0 ? document.body.scrollLeft : document.documentElement.scrollLeft;
        areaSize['sTop'] = document.documentElement.scrollTop == 0 ? document.body.scrollTop : document.documentElement.scrollTop;
    }
    return areaSize
}

function browserUsableWidth() {
    var fullWidth = browserAvailableAreaSize().cWidth
    var sidebarWidth = 195
    if (document.body.classList.value.indexOf('datax-sidebar-mini') > -1) {
        sidebarWidth = 50
    }
    return (fullWidth-sidebarWidth)
}

/* #region alert 弹窗 */
function dxAlert(text, alertType) {
    iconType = 'info'
    switch (alertType) {
        case 'success':
            iconType = 'check'
            break;
        case 'error':
            iconType = 'close'
            break;
        case 'warning':
            iconType = 'exclamation'
            break;
        default:
            break;
    }
    var maskOverlay = document.querySelector('.datax-mask-overlay-container')
    if (maskOverlay) {
        maskOverlay.style.top = 0
        maskOverlay.style.opacity = 1
        var alertOverlay = document.querySelector('.datax-modal-alert-wrap')
        alertOverlay.style.top = '100px'
        var alertHtml = '<i class="icon dx-font dx-' + iconType + '-circle"></i><span>' + text + '</span>'
        alertOverlay.querySelector('.datax-modal-alert-body').innerHTML = alertHtml
    }
    
}

function hideDxAlert() {
    var maskOverlay = document.querySelector('.datax-mask-overlay-container')
    maskOverlay.style.top = '-100%'
    maskOverlay.style.opacity = 0
    var alertOverlay = document.querySelector('.datax-modal-alert-wrap')
    alertOverlay.style.top = '-100%'
}
/* #endregion */


function fixTableWidth(rows, containerWidth) {
    var colInfoRow = (rows[rows.length-1]).rows
    var sourceWidth = 0
    colInfoRow.forEach(function(value) {
        sourceWidth += (value.width)
    })
    var unitFixedWidth = ((containerWidth - sourceWidth)/(colInfoRow.length)).toFixed(2)
    rows.forEach(function(_row, _rowIndex) {
        var unitRow = _row.rows || _row
        unitRow.forEach(function(_col, _colIndex) {
            var _rowspan = _col['rowspan'] ? _col['rowspan'] : 1
            _col['width'] = Number(_col['width']) + (unitFixedWidth * _rowspan)
        })
    })
}