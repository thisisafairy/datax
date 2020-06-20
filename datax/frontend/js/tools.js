/**
 * Created by jnp on 2017/8/1  for javascript func tool
 */

function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
    var context = "";
    if (r != null)
        context = r[2];
    reg = null;
    r = null;
    return context == null || context == "" || context == "undefined" ? "" : context;
}

//转换低版本postar设计器的config到vegalite的高版本进行显示
function ConvertVL1toVL2(vlconfig) {
    if (vlconfig.transform && vlconfig.transform.filter) //转最新版本的filter
    {
        vlconfig.transformv2 = [];
        if (!vlconfig.transform[0]) {
            try {
                vlconfig.transform.filter.map(function(fitobj) {
                    vlconfig.transformv2.push({ "filter": fitobj });
                })
                vlconfig.transform = vlconfig.transformv2;
            } catch (e) {}
        }
    } else
        vlconfig.transform = [];
    return vlconfig;
}


//扩展spec的默认设置以用于显示
function ExtendDefaultConfig(vlconfig) {
    window.vlconfig = vlconfig;
    if (!IsHaveProp("vlconfig.encoding.x.axis.labelAngle"))
        vlconfig = $.extend(true, vlconfig, { "encoding": { "x": { "axis": { "labelAngle": 45 } } } }); //字体倾斜
    if (!IsHaveProp("vlconfig.config.axis.labelLimit"))
        vlconfig = $.extend(true, vlconfig, { "config": { "axis": { "labelLimit": 50 } } }); //文字长度处理
    if (!IsHaveProp("vlconfig.config.axis.labelFontSize"))
        vlconfig = $.extend(true, vlconfig, { "config": { "axis": { "labelFontSize": 8 } } }); //文字大小处理
    window.vlconfig = null;
    return vlconfig;
}

function IsHaveProp(str) {
    try {
        if (eval(str)) return true;
        else return false;
    } catch (e) {
        return false;
    }
}

function createjscssfile(filename, filetype) {
    if (filetype == "js") {
        var fileref = document.createElement('script')
        fileref.setAttribute("type", "text/javascript")
        fileref.setAttribute("src", filename)
    } else if (filetype == "css") {
        var fileref = document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }
    return fileref
}

function replacejscssfile(oldfilename, newfilename, filetype) {
    var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none"
    var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none"
    var allsuspects = document.getElementsByTagName(targetelement)
    for (var i = allsuspects.length; i >= 0; i--) {
        if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(oldfilename) != -1) {
            var newelement = createjscssfile(newfilename, filetype)
            allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i])
        }
    }
}


function formatNumber(num){//千分位格式化
     return (num || 0).toString().replace(/\d+/, function (n) {
        var len = n.length;
        if (len % 3 === 0) {
            return n.replace(/(\d{3})/g, ',$1').slice(1);
        } else {
            return n.slice(0, len % 3) + n.slice(len % 3).replace(/(\d{3})/g, ',$1');
        }
    });
}