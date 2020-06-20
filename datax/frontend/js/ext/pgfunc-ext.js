/*
* pgfunc对ext的扩展
*/

Ext.BLANK_IMAGE_URL = '/frontend/js/ext/s.gif';
Ext.FlashComponent.EXPRESS_INSTALL_URL = '/frontend/css/Ext/expressinstall.swf';
Ext.chart.Chart.CHART_URL = '/frontend/css/Ext/charts.swf';


Ext.namespace('Ext.ux.data');
Ext.namespace('Ext.ux.grid');
Ext.namespace('Ext.ux.form');

var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

    // public method for decoding
    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

//------------------------Aim ExtJs GridPanel扩展 开始------------------------//

function ExtGridExportExcel(gridPanel, config) {
    if ($.isArray(gridPanel) && gridPanel.length >= 1) {
        $.each(gridPanel, function() {
            ExtGridExportExcel(this, config);
        });
    } else {
        if (gridPanel) {
            var tmpStore = gridPanel.getStore();
            var tmpExportContent = '';
            //以下处理分页grid数据导出的问题，从服务器中获取所有数据，需要考虑性能
            var tmpParam = Ext.ux.constructor(tmpStore.lastOptions); //此处克隆了原网格数据源的参数信息
            //此处作者原先为Ext.ux.clone(tmpStore.lastOptions)方法，但不好使
            if (tmpParam && tmpParam.params) {
                delete (tmpParam.params[tmpStore.paramNames.start]); //删除分页参数
                delete (tmpParam.params[tmpStore.paramNames.limit]);
            }

            var tmpAllStore = new Ext.data.GroupingStore({//重新定义一个数据源
                proxy: tmpStore.proxy,
                reader: tmpStore.reader
            });

            if (config.reloaddata == true) {
                if (!tmpParam.params) {
                    tmpParam = { params: { start: 0, limit: tmpStore.totalLength} };
                }
                tmpAllStore.load(tmpParam); //获取所有数据

                tmpAllStore.on('load', function(store) {
                    config.store = store;
                    ExtExportGridDataToExcel(gridPanel, config);
                });
            } else {
                ExtExportGridDataToExcel(gridPanel, config);
            }
        }
    }
};

function ExtExportGridDataToExcel(gridPanel, config) {
    // tmpExportContent = gridPanel.getExcelXml(false, config); //此方法用到了一中的扩展
    ExtExportDataToExcel(gridPanel, config);
}

// 导出数据到Excel
function ExtExportDataToExcel(cmp, config) {
    tmpExportContent = ExtGetExcelXml(cmp, config);

    if (Ext.isIE || Ext.isSafari || Ext.isSafari2 || Ext.isSafari3) {   //在这几种浏览器中才需要，IE8测试不能直接下载了
        if (!Ext.fly('frmDummy')) {
            var frm = document.createElement('form');
            frm.id = 'frmDummy';
            frm.name = id;
            frm.className = 'x-hidden';
            document.body.appendChild(frm);
        }

        var encodedContent = $.htmlEncode(tmpExportContent);
        var fileName = (config.maintitle || config.title || "export") + "_" + new Date().toLocaleString() + ".xls";

        Ext.Ajax.request({
            url: (config.url || '/CommonPages/Data/DataExport.aspx'), //将生成的xml发送到服务器端
            method: 'POST',
            form: Ext.fly('frmDummy'),
            callback: function(o, s, r) {
                // alert(r.responseText);
            },
            isUpload: true,
            params: { ExportContent: encodedContent, ExportFile: fileName, FileType: "Excel" }
        });
    } else {
        document.location = 'data:application/vnd.ms-excel;base64,' + Base64.encode(tmpExportContent);
    }
}

function ExtGetExcelXml(cmp, config) {
    if ($.isArray(cmp) && cmp.length == 1) {
        cmp = cmp[0];
    }

    var includeHidden = config["includeHidden"] || false;

    if ($.isArray(cmp) && cmp.length > 1) {
        var maintitle = maintitle || '主标题';
        var titles = config.titles || [];

        if (titles.length < cmp.length) {
            for (var i = titles.length; i < cmp.length; i++) {
                titles[i] = '标题' + (i + 1);
            }
        }

        var xml = '<xml version="1.0" encoding="utf-8">' +
            '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:o="urn:schemas-microsoft-com:office:office">' +
            '<o:DocumentProperties><o:Title>' + maintitle + '</o:Title></o:DocumentProperties>';

        config['title'] = titles[0];
        var tcmp = cmp[0];
        var tsheet = tcmp.createWorksheet(includeHidden, config);

        xml += '<ss:ExcelWorkbook>' +
                '<ss:WindowHeight>' + tsheet.height + '</ss:WindowHeight>' +
                '<ss:WindowWidth>' + tsheet.width + '</ss:WindowWidth>' +
                '<ss:ProtectStructure>False</ss:ProtectStructure>' +
                '<ss:ProtectWindows>False</ss:ProtectWindows>' +
            '</ss:ExcelWorkbook>' +
            tcmp.getExcelStyleXml() +
            tsheet.xml;

        for (var i = 1; i < cmp.length; i++) {
            config['title'] = titles[i];
            tcmp = cmp[i];
            tsheet = tcmp.createWorksheet(includeHidden, config);
            xml += tsheet.xml;
        }

        config['title'] = titles[0];    // 设回第一个标题,为生成文件名用

        xml += '</ss:Workbook>';
        return xml;
    } else if (typeof (cmp) == "object") {
        return cmp.getExcelXml(includeHidden, config);
    }
}

// 打开Grid编辑窗口
function ExtOpenGridWin(grid, params) {
    var params = params || {};
    var url = params.url, op = params.op, optype = params.optype, style = params.style, recs = params.recs;
    var onEditing = params.onEditing;
    var onEdited = params.onEdited || params.onEditFinish, uncheckSelected = params.uncheckSelected;

    if (typeof (grid) == "string") {
        grid = Ext.getCmp(grid);
    }

    op = op || "r";
    style = style || DEFAULT_EDIT_WIN_STYLE;

    var sels = recs || grid.getSelectionModel().getSelections();
    var sel;
    if (sels.length > 0) sel = sels[0];

    var params = [];
    params.push("op=" + op);
    params.push("optype=" + optype);

    if (op !== "c") {
        if (sel) {
            if (url.indexOf("id=") < 0) {
                params.push("id=" + sel.id);
            }

            if (optype == 'c') {
                params.push('frmdata=' + escape($.getJsonString(sel.data)));
            }
        } else {
            if (!uncheckSelected && url.indexOf("id=") < 0) {
                AimDlg.show('请选择需要操作的行。', '提示', 'alert');
                return;
            }
        }
    }

    if (typeof (onEditing) == "function") {
        evtrtn = onEditing.call(this, { op: op, record: sel });
        if (evtrtn === false) {
            return;
        }
    }

    url = jQuery.combineQueryUrl(url, params)

    // 防止打开后切换页面
    var task = new Ext.util.DelayedTask(function() {
        win = OpenWin(url, "_blank", style);

        $.execOnWinReady(win, function() {
            win.RefreshClose = function(args) {
                var evtrtn = true;
                args = $.extend((args || {}), { op: op, record: sel });
                if (win && win.AimFrm) {
                    args.data = $.cloneObj(win.AimFrm.getJson() || {});
                }

                args.grid = grid;

                if (typeof (onEdited) == "function") {
                    evtrtn = onEdited.call(win, args);
                }

                if (evtrtn != false) {
                    if (win.pgOperationType != 'c') {
                        grid.store.reload();
                    }

                    win.close();
                }
            }
        });

        return win;
    });

    task.delay(50);
}

// 打开Grid编辑窗口
function ExtOpenGridEditWin(grid, url, op, style, recs, onEditFinish, uncheckSelected) {
    ExtOpenGridWin(grid, { url: url, op: op, style: style, recs: recs, onEditFinish: onEditFinish, uncheckSelected: uncheckSelected });
}

// 对recs进行批量处理
function ExtBatchOperate(action, recs, params, url, onOperated) {
    if (!url) url = null;

    params = params || {};

    if (!params["IdList"]) {
        idList = [];

        if (recs != null) {
            jQuery.each(recs, function() {
                idList.push(this.id);
            })
        }

        params["IdList"] = idList;
    }

    jQuery.ajaxExec(action, params, onOperated);
}

// 网格文件渲染
function ExtGridFileRender(val, p, rec) {
    if (!val || typeof (val) != 'string') {
        return '';
    }

    var FileLinkBlock = "<a href='javascript:void(0)' style='margin:5px;' title='{filename}' "
            + " onclick=OpenWin('" + DOWNLOAD_PAGE_URL + "?Id={fileid}','_blank','width=1,height=1')>{filename}</a>";

    rtn = "";
    var tvals = val.trimEnd(",").split(",");

    $.each(tvals, function() {
        var fid = this.substring(0, this.indexOf("_"));
        var fname = this.substring(val.indexOf("_") + 1);

        rtn += FileLinkBlock.replace(/{fileid}/g, fid).replace(/{filename}/g, fname) + ",";
    });

    rtn = rtn.trimEnd(",");

    return rtn;
}

function ExtGridNumberRender(val, p, rec) {
    return Ext.util.Format.number.call(this, val, '0,000.00');
}

function ExtGridDateOnlyRender(val, p, rec) {
    if (!val) return "";
    if (typeof val == 'string')
            return val.split(" ")[0];
        else if (typeof val == 'object')
            return (val.getFullYear() + "/" + (val.getMonth()+1) + "/" + val.getDate().toString());;
}

//------------------------Aim ExtJs GridPanel扩展 结束------------------------//


//------------------------Aim ExtJs数据组件扩展 开始------------------------//

Ext.override(Ext.data.Store, {
    addField: function(field, replacestorefiled) {
        if (typeof field == 'string') {
            field = { name: field };
        }
        if (replacestorefiled != false) {
            this.recordType.prototype.fields.replace(field);
        }
        if (typeof field.defaultValue != 'undefined') {
            this.each(function(r) {
                if (typeof r.data[field.name] == 'undefined') {
                    r.data[field.name] = field.defaultValue;
                }
            });
        }
    },
    removeField: function(name) {
        this.recordType.prototype.fields.removeKey(name);
        this.each(function(r) {
            delete r.data[name];
        });
    },

    getModifiedDataStringArr: function(recs) {
        // 获取经过修改的数据字符串数组
        var dt = [];
        recs = recs || this.getModifiedRecords();

        $.each(recs, function() {
            dt.push($.getJsonString(this.data));
        });

        return dt;
    }
});

Ext.override(Ext.grid.ColumnModel, {
    addColumn: function(column, colIndex) {
        if (typeof column == 'string') {
            column = { header: column, dataIndex: column };
        }
        var config = this.config;
        this.config = [];
        if (typeof colIndex == 'number') {
            config.splice(colIndex, column);
        } else {
            colIndex = config.push(column);
        }
        this.setConfig(config);
        return colIndex;
    },
    removeColumn: function(colIndex) {
        var config = this.config;
        this.config = [config[colIndex]];
        config.remove(colIndex);
        this.setConfig(config);
    }
});

Ext.override(Ext.grid.GridPanel, {
    addColumn: function(field, column, colIndex, replacestorefiled) {
        if (!column) {
            if (field.dataIndex) {
                column = field;
                field = field.dataIndex;
            } else {
                column = field.name || field;
            }
        }
        this.store.addField(field, replacestorefiled);
        this.colModel.addColumn(column, colIndex);
    },

    removeColumn: function(name, colIndex) {
        this.store.removeField(name);
        if (typeof colIndex != 'number') {
            colIndex = this.colModel.findColumnIndex(name);
        }
        if (colIndex >= 0) {
            this.colModel.removeColumn(colIndex);
        }
    }
});

// 重新加载Store
function AimReloadStore(store, prototype, args) {
    if (!args) {
        prototype.superclass.reload.call(store, {});
    } else {
        var params = args;

        if (args.params) {
            params = args;
        } else if (args.data) {
            params = { params: args };
        } else {
            params = { params: { data: args} };
        }

        prototype.superclass.reload.call(store, params);
    }
}

Ext.ux.data.AimStore = Ext.extend(Ext.data.Store, {
    constructor: function(config) {
        Ext.ux.data.AimStore.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

reload: function(args) {
    AimReloadStore(this, Ext.data.Store, args);
}
});

Ext.reg('aimstore', Ext.ux.data.AimStore);


Ext.ux.data.AimArrayStore = Ext.extend(Ext.data.ArrayStore, {
    constructor: function(config) {
        Ext.ux.data.AimArrayStore.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

reload: function(args) {
    AimReloadStore(this, Ext.data.ArrayStore, args);
}
});

Ext.reg('aimarraystore', Ext.ux.data.AimArrayStore);


Ext.ux.data.AimJsonStore = Ext.extend(Ext.ux.data.AimStore, {
    isclient: false,
    constructor: function(config) {
        config["root"] = config["root"] || "records";
        config["idProperty"] = config["idProperty"] || "Id";
        config["remoteSort"] = !(config["remoteSort"] == false);
        config["autoDestroy"] = !(config["autoDestroy"] == false);
        config["reader"] = config["reader"] || new Ext.ux.data.AimJsonReader(config);

        this.isclient = (config["isclient"] == true);   // 默认false

        if (!config["proxy"]) {
            if (config["isclient"] == true) {
                config["remoteSort"] = false;
                config["proxy"] = new Ext.ux.data.AimClientProxy(config);
            } else {
                config["proxy"] = new Ext.ux.data.AimRemotingProxy(config);
            }
        }

        Ext.ux.data.AimJsonStore.superclass.constructor.call(this, Ext.apply(config, {
            totalProperty: "total",
            autoLoad: true
        }));
    },

    reload: function(args) {
        AimReloadStore(this, Ext.ux.data.AimStore, args);
    }
});

Ext.reg('aimjsonstore', Ext.ux.data.AimStore, Ext.ux.data.AimJsonStore);


Ext.ux.data.AimGroupingStore = Ext.extend(Ext.data.GroupingStore, {
    constructor: function(config) {
        config["root"] = config["root"] || "records";
        config["remoteSort"] = !(config["remoteSort"] == false);

        config["reader"] = config["reader"] || new Ext.ux.data.AimJsonReader(config);
        config["proxy"] = config["proxy"] || new Ext.ux.data.AimRemotingProxy(config);

        Ext.ux.data.AimJsonStore.superclass.constructor.call(this, Ext.apply(config, {
            totalProperty: "total",
            autoLoad: true
        }));
    },

    reload: function(args) {
        AimReloadStore(this, Ext.data.GroupingStore, args);
    }
});

Ext.reg('aimgroupingstore', Ext.ux.data.AimGroupingStore);

Ext.ux.data.AimEnumStore = Ext.extend(Ext.ux.data.AimArrayStore, {
    constructor: function(config) {
        if (config.enumdata) {
            switch (config.enumtype) {
                case 'simple':
                default:
                    config.fields = config.fields || ['value', 'text'];
                    var tdata = [];
                    for (var key in config.enumdata) {
                        tdata[tdata.length] = [key, config.enumdata[key]];
                    }
                    config.data = tdata;
                    break;
            }
        }

        Ext.ux.data.AimEnumStore.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

reload: function(args) {
    AimReloadStore(this, Ext.ux.data.AimArrayStore, args);
}
});

Ext.reg('aimenumstore', Ext.ux.data.AimEnumStore);


Ext.ux.data.AimClientProxy = function(config) {
    this.data = null;
    this.dsname = null;

    this.addEvents('aimbeforeload', 'aimload');
    if (config) {
        if (config.aimbeforeload) { this.addListener('aimbeforeload', config.aimbeforeload); }
        if (config.aimload) { this.addListener('aimload', config.aimload); }
        if (config.listeners) {
            for (var key in config.listeners) {
                this.addListener(key, config.listeners[key]);
            }
        }

        this.data = config.data || this.data;
    }

    Ext.apply(this, config);
    Ext.ux.data.AimClientProxy.superclass.constructor.call(this);
}

Ext.extend(Ext.ux.data.AimClientProxy, Ext.data.DataProxy, {
    start: 0,
    limit: 0,
    loadmask: null,

    load: function(params, reader, callback, scope, arg) {
        params = params || {};
        params.data = params.data || {};

        if (this.fireEvent("beforeload", this, params) != false & this.fireEvent("aimbeforeload", this, params) != false) {
            this.loadmask = new Ext.LoadMask(Ext.getBody(), { msg: "加载中..." });
            this.loadmask.show();

            var resp = { status: "success", data: {}, options: {} };

            var args = [];
            var proxy = this;
            params = params || {};

            resp.options.data = params["data"] || {};

            if (params.start !== undefined && params.limit !== undefined) {
                resp.options.start = params.start;
                resp.options.limit = params.limit;
            }

            if (params.sort !== undefined && params.dir !== undefined) {
                resp.options.sort = params.sort;
                resp.options.dir = params.dir;
            }

            resp.data[proxy.dsname] = proxy.data.records || proxy.data;

            proxy.loadResponse(resp, reader, callback, scope, arg);

            if (proxy.loadmask) { proxy.loadmask.hide(); }

        } else {
            callback.call(scope || this, null, arg, false);
        }
    },

    loadResponse: function(response, reader, callback, scope, arg) {
        var result;
        try {
            result = reader.read(response);
            if (response && response.data) {
                var recCount = 0;

                if (response.data.SearchCriterion) {
                    recCount = response.data.SearchCriterion["RecordCount"];
                }

                if (!recCount || recCount < 0) {
                    result.totalRecords = result.records.length;
                } else {
                    result.totalRecords = recCount;
                }
            }
        } catch (e) {
            this.fireEvent("loadexception", this, response, e);
            callback.call(scope, response, arg, false);
            return;
        }

        this.fireEvent("load", this, response, arg);
        this.fireEvent("aimload", this, response, result, arg, scope);
        callback.call(scope, result, arg, true);
    }
});

Ext.ux.data.AimRemotingProxy = function(config) {
    if (!Aim || !Aim.Data || !Aim.Data.RemoteModel) {
        throw "请先加载Aim.Data.RemoteModel"
    }

    this.addEvents('aimbeforeload', 'aimload');
    if (config) {
        if (config.aimbeforeload) { this.addListener('aimbeforeload', config.aimbeforeload); }
        if (config.aimload) { this.addListener('aimload', config.aimload); }
        if (config.listeners) {
            for (var key in config.listeners) {
                this.addListener(key, config.listeners[key]);
            }
        }
    }

    Ext.apply(this, config);
    Ext.ux.data.AimRemotingProxy.superclass.constructor.call(this);
};

Ext.reg('aimremotingproxy', Ext.ux.data.AimRemotingProxy);

Ext.extend(Ext.ux.data.AimRemotingProxy, Ext.data.DataProxy, {
    start: 0,
    limit: 0,
    loadmask: null,

    load: function(params, reader, callback, scope, arg) {
        params = params || {};
        params.data = params.data || {};

        if (this.fireEvent("beforeload", this, params) != false & this.fireEvent("aimbeforeload", this, params) != false) {
            this.loadmask = new Ext.LoadMask(Ext.getBody(), { msg: "加载中..." });
            this.loadmask.show();
            var args = [];
            var proxy = this;
            params = params || {};
            params["data"] = params["data"] || {};

            for (var key in params) {
                if (typeof (params[key]) == "string" || typeof (params[key]) == "number") {
                    params["data"][key] = params[key];
                }
            }

            params["qrycrit"] = params["qrycrit"] || AimSearchCrit || {};

            if (params.schtype == "field" && params.schdom) {
                params.schcrit = getSchCriterion(params.schdom);

                if (params.start == undefined) {
                    params.start = 1;
                    AimSearchCrit["CurrentPageIndex"] = 1;
                }
            }

            if (params.schcrit !== undefined) {
                params["qrycrit"]["Searches"] = params["qrycrit"]["Searches"] || {};

                params["qrycrit"]["Searches"]["Searches"] = params.schcrit["ccrit"] || [];
                params["qrycrit"]["Searches"]["FTSearches"] = params.schcrit["ftcrit"] || [];
                params["qrycrit"]["Searches"]["JuncSearches"] = params.schcrit["jcrit"] || [];
            }

            if (params.start !== undefined && params.limit !== undefined) {
                params["qrycrit"]["CurrentPageIndex"] = parseInt(params.start / params.limit) + 1;
                params["qrycrit"]["PageSize"] = params.limit;
                this.start = params.start;
                this.limit = params.limit;
            }

            if (params.dir !== undefined && params.sort !== undefined) {
                var orders = params["qrycrit"]["Orders"] || [];
                params["qrycrit"]["Orders"] = [{ "PropertyName": params.sort, "Ascending": (params.dir == "ASC")}];
            }

            var loader = new Aim.Data.RemoteModel(params);

            loader.onDataLoaded.subscribe(function(response) {
                proxy.loadResponse(response, reader, callback, scope, arg);
                if (proxy.loadmask) { proxy.loadmask.hide(); }
            });

            loader.onError.subscribe(function(opts) { if (proxy.loadmask) { proxy.loadmask.hide(); } });

            loader.onProcessException.subscribe(function(response) {
                if (proxy.loadmask) { proxy.loadmask.hide(); }

                if (proxy.fireEvent("loadexception", this, response, null)) {
                    AimDlg.show(response.data["__EXCEPTION"]["Content"], "异常", "alert");
                    callback.call(scope, response, arg, false);
                }
                return;
            });

            loader.ensureData();
        } else {
            callback.call(scope || this, null, arg, false);
        }
    },

    loadResponse: function(response, reader, callback, scope, arg) {
        var result;
        try {
            result = reader.read(response);
            if (response && response.data && response.data.SearchCriterion) {
                var recCount = response.data.SearchCriterion["RecordCount"];
                if (!recCount || recCount < 0) {
                    result.totalRecords = result.records.length;
                } else {
                    result.totalRecords = recCount;
                }
            }
        } catch (e) {
            this.fireEvent("loadexception", this, response, e);
            callback.call(scope, response, arg, false);
            return;
        }

        this.fireEvent("load", this, response, arg);
        this.fireEvent("aimload", this, response, result, arg, scope);
        callback.call(scope, result, arg, true);
    }
});

Ext.ux.data.AimJsonReader = function(meta, recordType) {
    meta = meta || {};

    this.aimbeforeread = $.isFunction(meta.aimbeforeread) ? meta.aimbeforeread : null;
    this.aimread = $.isFunction(meta.aimread) ? meta.aimread : null;

    Ext.apply(meta, { successProperty: 'success' });
    Ext.ux.data.AimJsonReader.superclass.constructor.call(this, meta, recordType);
};

Ext.extend(Ext.ux.data.AimJsonReader, Ext.data.JsonReader, {
    read: function(resp) {
        if (this.aimbeforeread) { this.aimbeforeread.call(this, this, resp) };
        if (resp.status !== "success") {
            throw {
                message: 'AimJsonReader.read: Exception raised on server.'
            };
        }

        var reader = this;
        var data = {};
        if (resp && resp.data && resp.options && reader.meta.dsname) {
            if (reader.meta.root) {
                data[reader.meta.root] = resp.data[reader.meta.dsname] || [];
            } else {
                data = resp.data[reader.meta.dsname] || [];
            }
        }

        if (this.aimread) { this.aimread.call(this, this, resp, data) };
        return this.readRecords(data);
    }
});

Ext.reg('aimjsonreader', Ext.ux.data.AimJsonReader);

//------------------------Aim ExtJs数据组件扩展 结束------------------------//

//------------------------Aim ExtJs 字段 开始------------------------//

Ext.ux.AimField = Ext.extend(Ext.form.Field, {
    constructor: function(config) {
        config = config || {};
        Ext.ux.AimField.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimfield', Ext.ux.AimField);

//------------------------Aim ExtJs 字段 结束------------------------//

//------------------------Aim ExtJs 面板 开始------------------------//

Ext.ux.AimPanel = Ext.extend(Ext.Panel, {
    constructor: function(config) {
        config = config || {};
        Ext.ux.AimPanel.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimpanel', Ext.ux.AimPanel);

//------------------------Aim ExtJs 面板 结束------------------------//

//------------------------Aim ExtJs TabPanel 开始------------------------//

Ext.ux.AimTabPanel = Ext.extend(Ext.TabPanel, {
    tabWidth: 150,

    constructor: function(config) {
        config = config || {};
        config.border = (config.border == true);
        config.activeTab = (config.activeTab || 0);

        if (config.tabPosition == 'left' || config.tabPosition == 'right') {
            config.cls = config.cls || '';
            config.cls = 'verticalTabs ' + config.cls;
            if (config.textAlign && config.textAlign == 'right') {
                config.cls = 'alignRight ' + config.cls;
            }

            config.cls = (config.tabPosition == 'left' ? 'leftTabs ' : 'rightTabs ') + config.cls;

            this.intendedTabPosition = config.tabPosition;
            this.verticalTabs = true;
            config.tabPosition = 'top';
        }
        this.tabWidth = config.tabWidth || this.tabWidth;

        this.addEvents('click');

        Ext.ux.AimTabPanel.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

initEvents: function() {
    Ext.ux.AimTabPanel.superclass.initEvents.call(this);

    this.mon(this.strip, 'mousedown', function() { this.fireEvent("click", this) }, this);
},

afterRender: function() {
    Ext.ux.AimTabPanel.superclass.afterRender.call(this);
    if (this.verticalTabs) {
        this.header.setWidth(this.tabWidth);
        this.header.setHeight(this.height || this.container.getHeight());
    }
},

/**
* Adjust header and footer size.
* @param {Number} w width of the container
* @return {Number} the body will be resized to this width
*/
adjustBodyWidth: function(w) {
    if (this.verticalTabs) {
        if (Ext.isIE6) {
            //I got the value "3" through trial and error; it seems to be related with the x-panel-header border; if the border
            //is set to "none", then this substraction is not necessary - but it does not seem related to the border width, margin or padding of any
            //of the panels so I dont know how to calculate it; please let me know if you have any idea what's going on here
            this.bwrap.setWidth(w - 3);
        }
        return w;
    }
    else {
        return Ext.ux.AimTabPanel.superclass.adjustBodyWidth.call(this, w);
    }
},

/**
* Get the new body height and adjust the height of the tab strip if it is vertical.
* @param h {Number}
*/
adjustBodyHeight: function(h) {
    if (this.verticalTabs) {
        this.header.setHeight(h + (this.tbar ? this.tbar.getHeight() : 0));
    }
    return Ext.ux.AimTabPanel.superclass.adjustBodyHeight.call(this, h);
},

/**
* If the tab strip is vertical, we need to substract the "header" width.
* @return {Number} The frame width
*/
getFrameWidth: function() {
    return Ext.ux.AimTabPanel.superclass.getFrameWidth.call(this) + this.verticalTabs ? this.tabWidth : 0;
},

/**
* If the tab strip is vertical, we don't need to substract it's height
* @return {Number} The frame height
*/
getFrameHeight: function() {
    return Ext.ux.AimTabPanel.superclass.getFrameHeight.call(this) - (this.verticalTabs ? this.header.getHeight() : 0);
}
});

Ext.reg('aimtabpanel', Ext.ux.AimTabPanel);

//------------------------Aim ExtJs TabPanel 结束------------------------//

//------------------------Aim ExtJs ViewPort 开始------------------------//

Ext.ux.AimViewport = Ext.extend(Ext.Viewport, {
    constructor: function(config) {
        config = config || {};
        config.border = (config.border == true);
        config.layout = config.layout || 'border';

        Ext.ux.AimViewport.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimviewport', Ext.ux.AimViewport);

//------------------------Aim ExtJs ViewPort 结束------------------------//

//------------------------Aim ExtJs ViewPort 开始------------------------//

Ext.ux.AimDataView = Ext.extend(Ext.DataView, {
    constructor: function(config) {
        config = config || {};

        Ext.ux.AimDataView.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimdataview', Ext.ux.AimDataView);

//------------------------Aim ExtJs ViewPort 结束------------------------//

//------------------------Aim ExtJs GridPanel 开始------------------------//

function AimGetGridFirstSelection(grid) {
    if (grid && grid.getSelectionModel && grid.getSelectionModel().getSelections) {
        var recs = grid.getSelectionModel().getSelections();
        if (!recs || recs.length <= 0) {
            return null;
        } else {
            return recs[0];
        }
    }
}

Ext.ux.grid.AimGridPanel = Ext.extend(Ext.grid.GridPanel, {
    constructor: function(config) {
        var grid = this;
        config = config || {};
        config.frame = (config.frame == true);
        config.stripeRows = !(config.stripeRows == false);
        config.stateful = !(config.stateful == false);
        config.singleSelect = (config.singleSelect == true);
        config.checkOnly = (config.checkOnly == true);
        //增加配置锁定列
        if (config.lockable && config.lockable == true) {
            $.includeCss("/App_Themes/ext/ux/css/LockingGridView.css");
            config.colModel = new Ext.ux.grid.LockingColumnModel(config.columns);
            config.view = new Ext.ux.grid.LockingGridView({ lockText: '锁定列', unlockText: '解除锁定' });
            delete config.columns;
        }
        config.sm = config.sm || new Ext.ux.grid.AimCheckboxSelectionModel({ singleSelect: config.singleSelect, checkOnly: config.checkOnly });

        if (config.columns && $.isArray(config.columns)) {
            $.each(config.columns, function() {
                if (this.enumdata) {
                    this.renderer = this.renderer || function(val, p, rec) {
                        return this.enumdata[val];
                    }
                } else if (this.linkparams) {
                    var lnkparams = this.linkparams;
                    this.renderer = this.renderer || function(val, p, rec) {
                        var gidstr = "\"" + grid.getId() + "\"";
                        var urlstr = lnkparams["url"] ? ("\"" + lnkparams["url"] + "\"") : "null";
                        var opstr = lnkparams["op"] ? ("\"" + lnkparams["op"] + "\"") : "null";
                        var optypestr = lnkparams["optype"] ? ("\"" + lnkparams["optype"] + "\"") : "null";
                        var stylestr = lnkparams["style"] ? ("\"" + lnkparams["style"] + "\"") : "null";

                        var LinkBlock = "<a class='aim-ui-link' onclick='ExtOpenGridWin({gid}, {url: {url}, op:{op}, style:{style}, optype: {optype}})'>" + val + "</a>";
                        var rtn = LinkBlock.replace(/{gid}/g, gidstr).replace(/{url}/g, urlstr).replace(/{op}/g, opstr).replace(/{optype}/g, optypestr).replace(/{style}/g, stylestr);

                        return rtn;
                    }
                } else if (this.renderparams) {
                    var renderparams = this.renderparams;
                    this.renderer = this.renderer || function(value, parameter, record) {
                        var templ = renderparams["template"] || "{value}";

                        // 替换模版
                        var rtn = templ.replace(/{([\w\.]+?)}/g, function($0) {
                            var str = ($0 || '').toString();
                            str = str.trimStart('{').trimEnd('}');

                            return record.get(str) || eval(str);
                        });
                        return rtn;
                    }
                }
            })
        }

        Ext.ux.grid.AimGridPanel.superclass.constructor.call(this, Ext.apply(config, {
    }));
}, getFirstSelection: function() {
    return AimGetGridFirstSelection(this);
}
});

Ext.reg('aimgridpanel', Ext.ux.grid.AimGridPanel);

//------------------------Aim ExtJs GridPanel 结束------------------------//

//------------------------Aim ExtJs 编辑面板 开始------------------------//

Ext.ux.grid.AimEditorGridPanel = Ext.extend(Ext.grid.EditorGridPanel, {
    constructor: function(config) {
        var grid = this;
        config = config || {};
        config.stripeRows = !(config.stripeRows == false);
        config.frame = (config.frame == true);
        config.forceLayout = !(config.forceLayout == false);
        config.clicksToEdit = config.clicksToEdit || 1;
        //增加配置锁定列
        if (config.lockable && config.lockable == true) {
            //$.includeCss("/App_Themes/ext/ux/css/LockingGridView.css");
            config.colModel = new Ext.ux.grid.LockingColumnModel(config.columns);
            config.view = new Ext.ux.grid.LockingGridView({ lockText: '锁定列', unlockText: '解除锁定' });
            delete config.columns;
        }
        config.sm = config.sm || new Ext.grid.CheckboxSelectionModel();

        if (config.columns && $.isArray(config.columns)) {
            $.each(config.columns, function() {
                if (this.enumdata) {
                    this.renderer = this.renderer || function(val, p, rec) {
                        return this.enumdata[val];
                    }
                } else if (this.linkparams) {
                    var lnkparams = this.linkparams;
                    this.renderer = this.renderer || function(val, p, rec) {
                        var gidstr = "\"" + grid.getId() + "\"";
                        var urlstr = lnkparams["url"] ? ("\"" + lnkparams["url"] + "\"") : "null";
                        var opstr = lnkparams["op"] ? ("\"" + lnkparams["op"] + "\"") : "null";
                        var optypestr = lnkparams["optype"] ? ("\"" + lnkparams["optype"] + "\"") : "null";
                        var stylestr = lnkparams["style"] ? ("\"" + lnkparams["style"] + "\"") : "null";

                        var LinkBlock = "<a class='aim-ui-link' onclick='ExtOpenGridWin({gid}, {url: {url}, op:{op}, style:{style}, optype: {optype}})'>" + val + "</a>";
                        var rtn = LinkBlock.replace(/{gid}/g, gidstr).replace(/{url}/g, urlstr).replace(/{op}/g, opstr).replace(/{optype}/g, optypestr).replace(/{style}/g, stylestr);

                        return rtn;
                    }
                } else if (this.renderparams) {
                    var renderparams = this.renderparams;
                    this.renderer = this.renderer || function(value, parameter, record) {
                        var templ = renderparams["template"] || "{value}";

                        // 替换模版
                        var rtn = templ.replace(/{([\w\.]+?)}/g, function($0) {
                            var str = ($0 || '').toString();
                            str = str.trimStart('{').trimEnd('}');

                            return record.get(str) || eval(str);
                        });
                        return rtn;
                    }
                }
            })
        }

        Ext.ux.grid.AimEditorGridPanel.superclass.constructor.call(this, Ext.apply(config, {
    }));
}, getFirstSelection: function() {
    return AimGetGridFirstSelection(this);
}
});

Ext.reg('aimeditorgridpanel', Ext.ux.grid.AimEditorGridPanel);

//------------------------Aim ExtJs 编辑面板 结束------------------------//

//------------------------Aim ExtJs 编辑面板 开始------------------------//

Ext.ux.grid.AimCheckboxSelectionModel = Ext.extend(Ext.grid.CheckboxSelectionModel, {
    constructor: function(config) {
        config = config || {};
        config.checkOnly = (config.checkOnly == true);
        config.singleSelect = (config.singleSelect == true);

        Ext.ux.grid.AimCheckboxSelectionModel.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

//------------------------Aim ExtJs 编辑面板 结束------------------------//


//------------------------Aim ExtJs Grid RowNumberer扩展 开始------------------------//

Ext.ux.grid.AimRowNumberer = Ext.extend(Object, {
    header: "",
    width: 23,
    sortable: false,

    constructor: function(config) {
        Ext.apply(this, config);
        if (this.rowspan) {
            this.renderer = this.renderer.createDelegate(this);
        }
    },

    // private
    fixed: true,
    hideable: false,
    menuDisabled: true,
    dataIndex: '',
    id: 'numberer',
    rowspan: undefined,
    start: null,
    limit: 0,

    // private
    renderer: function(v, p, record, rowIndex) {
        if (this.rowspan) {
            p.cellAttr = 'rowspan="' + this.rowspan + '"';
        }

        if (record && record.store && record.store.proxy) {
            this.start = record.store.proxy.start;
            this.limit = record.store.proxy.limit;
        }

        if (!isNaN(this.start) && this.start >= 0) {
            return this.start + rowIndex + 1;
        } else {
            return rowIndex + 1;
        }
    }
});

//------------------------Aim ExtJs Grid RowNumberer扩展 结束------------------------//

//------------------------Aim ExtJs 工具栏 开始------------------------//

Ext.ux.AimToolbar = Ext.extend(Ext.Toolbar, {
    constructor: function(config) {
        Ext.ux.AimToolbar.superclass.constructor.call(this, Ext.apply(config, {
    }));

    this.setReadOnly(pgOperation === 'r');
}, setReadOnly: function(flag) {
    flag = !(flag == false); // 默认为true
    var editable = !flag;

    this.items.each(function() {
        if (this.iconCls && ("aim-icon-add,aim-icon-edit,aim-icon-delete").indexOf(this.iconCls) >= 0 || this.aimexecutable == true) {
            if (this.setVisible) {
                this.setVisible(editable);
            } else if (this.setDisabled) {
                this.setDisabled(editable);
            }
        }
    });
}
});

Ext.reg('aimtoolbar', Ext.ux.AimToolbar);

//------------------------Aim ExtJs 工具栏 结束------------------------//

//------------------------Aim ExtJs 分页控件 开始------------------------//

Ext.ux.AimPagingToolbar = Ext.extend(Ext.PagingToolbar, {
    constructor: function(config) {
        config = config || {};
        var schcrit = AimSearchCrit || {};
        config.pageSize = config.pageSize || schcrit["PageSize"] || 20;
        config.displayInfo = !(config.displayInfo == false);
        config.displayMsg = config.displayMsg || '当前条目 {0} - {1}, 总条目 {2}';
        config.emptyMsg = config.emptyMsg || '无条目显示';

        citems = ['-', { text: '页面大小：', xtype: 'tbtext' }, new Ext.ux.AimPagingField(Ext.apply({ pgbar: this }, config))];

        $.merge(citems, config.items || []);
        config.items = citems;

        Ext.ux.AimPagingToolbar.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimpagingtoolbar', Ext.ux.AimPagingToolbar);

//------------------------Aim ExtJs 分页控件 结束------------------------//

//------------------------Aim ExtJs 分页字段域 开始------------------------//

Ext.ux.AimPagingField = Ext.extend(Ext.form.NumberField, {
    constructor: function(config) {
        config = config || {};
        config.width = config.width || 30;
        config.minValue = config.minValue || 1;
        config.maxValue = config.maxValue || 1000;
        schcirt = config.schcirt || null;

        config.value = config.pageSize || 20;

        if (config.keyup) {
            this.keyup = config.keyup;
            delete (config.keyup);
        }

        config.enableKeyEvents = !(config.enableKeyEvents == false);

        Ext.ux.AimPagingField.superclass.constructor.call(this, Ext.apply(config, {
    }));

    this.on("keyup", function(field, e) {
        if (e.keyCode == "13") {
            // 回车
            var currPageSize = field.getValue();
            if (currPageSize > this.maxValue || currPageSize < this.minValue) {
                return;
            }

            if (this.pgbar) {
                if (this.schcirt) {
                    this.schcirt['PageSize'] = currPageSize;
                }
                this.pgbar.pageSize = currPageSize;
                this.pgbar.store.reload({ params: { start: 0, limit: this.pgbar.pageSize} });
            }
        }

        if (typeof (this.keyup) == "function") {
            this.keyup(this, e);
        }
    })
},

pgbar: null,
keyup: null,
schcirt: null
});

Ext.reg('aimpagingfield', Ext.ux.AimPagingField);

//------------------------Aim ExtJs 分页字段域 结束------------------------//


//------------------------Aim ExtJs 查询栏 开始------------------------//

// 查询扩展
Ext.ux.AimDoSearch = function(item) {
    var v;

    if (item.getValue) {
        v = item.getValue();
    } else if (item.getRawValue) {
        v = item.getRawValue();
    }

    if (!item.aimhandler) {
        var schcrit = AimSearchCrit || {};
        var pgSize = schcrit["PageSize"] || 20;
        var store = item.schstore || item.store;

        if (item.schopts) {
            store = store || item.schopts.store;
        }

        if (store) {
            store.baseParams["schtype"] = "field";
            store.baseParams["schdom"] = item.el.dom;

            if (store.proxy) {
                pgSize = store.proxy.limit || pgSize;
            }

            store.reload({ params: { start: 0, limit: pgSize} });
        }
    } else {
        item.aimhandler.call(item, v);
    }

    item.hasSearch = true;
}

// 查询Panel
Ext.ux.AimSchPanel = Ext.extend(Ext.Panel, {
    constructor: function(config) {
        var panel = this;

        config = config || {};
        config.border = false;
        config.labelWidth = config.labelWidth || 60;
        config.collapsed = !(config.collapsed == false);
        config.unstyled = !(config.unstyled == false);

        if (config.padding !== 0) {
            config.padding = (config.padding || 5);
        }

        // 自动layout
        if (!config.layout) {
            config.layout = 'column';

            var colcount = config.columns || 3;
            var autoitems = [];

            if (config.items && $.isArray(config.items)) {
                // 预处理
                $.each(config.items, function() {
                    this.flex = this.flex || 1;
                    this.unstyled = !(this.unstyled == false);
                    if (this.flex > colcount) {
                        this.flex = colcount;
                    }
                    this.aimhandler = this.aimhandler || config.aimhandler;

                    if (this.schopts) {
                        this.schstore = this.schopts.schstore || config.store || this.schopts.store;    // 查询store
                        this.schopts.aimgrp = this.schopts.aimgrp || config.aimgrp || "defgrp"; // 查询组

                        this.xtype = this.xtype || "field";
                        this.align = this.align || 'left';
                        this.anchor = this.anchor || '90%';
                    }
                });

                var tautoitem;

                for (var i = 0, pi = 0; i < config.items.length; i++) {
                    var titem = config.items[i];

                    // var tfitem = { layout: 'form', unstyled: true, items: [titem] };
                    // tfitem.bodyStyle = 'margin-left:15px;';
                    var tfitem;
                    if (titem.schopts) {
                        tfitem = { layout: 'form', unstyled: true, flex: titem.flex, items: [titem] };
                    } else {
                        tfitem = titem;
                    }

                    tfitem.labelWidth = titem.labelWidth || config.labelWidth;

                    var tflexcount = 0;
                    if (tautoitem) {
                        tflexcount = panel.calcAutoItemTotalFlex(tautoitem);
                    }

                    if (i == 0 || (tflexcount + tfitem.flex) > pi) {
                        tautoitem = { layout: 'column', defaults: { margins: '0 0 0 0' }, listeners: { afterlayout: function(f) {
                            f.el.dom.firstChild.firstChild.style.border = "1 solid transparent"
                        } }, items: [] };

                        autoitems.push(tautoitem);

                        pi = colcount;
                    }

                    tautoitem.items.push(tfitem);
                }

                $.each(autoitems, function() {
                    tautoitem = this;
                    var tflexcount = panel.calcAutoItemTotalFlex(tautoitem);

                    if (tautoitem) {
                        if (tflexcount < colcount) {
                            tautoitem.items.push({ unstyled: true, flex: (colcount - tflexcount) });    // 添加panel以维持对齐状态
                        }
                    }
                })
            }

            config.items = autoitems;
        } else {
            config.layout = config.layout || 'column';
        }

        Ext.ux.AimSchPanel.superclass.constructor.call(this, Ext.apply(config, {
    }));

    this.initSchItem(this);
},

// 计算一个自动生成的HBox Item flex和
calcAutoItemTotalFlex: function(autoitem) {
    var tflexcount = 0;
    $.each(autoitem.items, function() {
        tflexcount += (this.flex || 1);
    });

    return tflexcount;
},

initSchItem: function(item) {
    if (item.schopts) {
        item.on('specialkey', function(f, e) {
            if (e.getKey() == e.ENTER) {
                Ext.ux.AimDoSearch(item);
            }
        }, item);

        item.on('afterrender', function(f, e) {
            if (item.el && item.el.dom) {
                $(item.el.dom).attr('qryopts', item.schopts.qryopts);
                if (item.schopts.aimgrp) { $(item.el.dom).attr('aimgrp', item.schopts.aimgrp); }
            };
        }, item);
    } else {
        if (item.items) {
            var p = this;
            if ($.isArray(item.items)) {
                $.each(item.items, function() {
                    p.initSchItem(this);
                })
            } else if (item.items.items) {
                if ($.isArray(item.items.items)) {
                    var p = this;
                    $.each(item.items.items, function() {
                        p.initSchItem(this);
                    })
                }
            }
        }
    }
}
});

Ext.reg('aimschpanel', Ext.ux.AimSchPanel);

//------------------------Aim ExtJs 查询栏 结束------------------------//


//------------------------Aim ExtJs查询控件 开始------------------------//

// TwinTriggerFiled查询控件
Ext.app.AimSearchField = Ext.extend(Ext.form.TwinTriggerField, {

    validationEvent: false,
    validateOnBlur: false,
    trigger1Class: 'x-form-clear-trigger',
    trigger2Class: 'x-form-search-trigger',
    hideTrigger1: true,
    width: 100,
    hasSearch: false,
    paramName: 'query',
    qryopts: '{}',
    aimgrp: '',
    aimhandler: null,
    schbutton: false,
    store: null,
    id: 'defaultFullSearch',

    constructor: function(config) {
        config.width = config.width || this.width;

        Ext.app.AimSearchField.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

initComponent: function() {
    Ext.app.AimSearchField.superclass.initComponent.call(this);
    this.on('specialkey', function(f, e) {
        if (e.getKey() == e.ENTER) {
            this.onTrigger2Click();
        }
    }, this);

    this.on('afterrender', function(f, e) {
        var field = this;

        if (field.el && field.el.dom) {
            $(field.el.dom).attr('qryopts', field.qryopts);
            if (field.aimgrp) { $(field.el.dom).attr('aimgrp', field.aimgrp); }
        };

        if (field.schbutton == true) {
            field.triggers[1].show();
        } else {
            field.triggers[1].hide();
        }
    }, this);
},

onTrigger1Click: function() {
    if (this.hasSearch) {
        this.el.dom.value = '';

        if (!this.aimhandler) {
            var o = { start: 0 };
            this.store.baseParams = this.store.baseParams || {};
            this.store.baseParams[this.paramName] = '';
            this.store.reload({ params: o });
        } else {
            this.aimhandler.call(this);
        }

        this.triggers[0].hide();
        this.hasSearch = false;
    }
},

onTrigger2Click: function() {
    if (!this.aimhandler) {
        Ext.ux.AimDoSearch(this);
    } else {
        this.aimhandler.call(this, this.el.dom.value);
    }

    if (this.hasSearch == true) {
        // this.triggers[0].show();
    }
}
});

Ext.reg('aimtsearchfield', Ext.app.AimSearchField);

//------------------------Aim ExtJs查询控件 结束------------------------//

//------------------------Aim ExtJs Popup控件 开始------------------------//

Ext.ux.form.AimPopup = Ext.extend(Ext.form.TriggerField, {
    triggerClass: 'x-form-search-trigger',
    popUrl: null,
    popParam: null,
    popStyle: null,
    popModel: "form",
    popAfter: null,

    constructor: function(config) {
        config.editable = config.editable == true;
        popUrl = config.popUrl;
        popParam = config.popParam;
        popStyle = config.popStyle;
        popModel = config.popModel || "form";
        popAfter = config.popAfter;

        popUrl = $.combineQueryUrl(popUrl, { "PopParam": popParam });
        if (popModel == "window") {
            popUrl = $.combineQueryUrl(popUrl, { "PopAfter": popAfter });
        }

        Ext.ux.form.AimPopup.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

onTriggerClick: function() {
    if (this.popModel.toLowerCase() == "window")
        OpenWin(this.popUrl, "_blank", CenterWin(this.popStyle));
    else {
        var rtnval = window.showModalDialog(this.popUrl, window, this.popStyle || "");
        if (typeof (this.popAfter) == "function") {
            this.popAfter.call(this, rtnval);
        } else if (typeof (this.popAfter) == "string" && this.popAfter != "") {
            eval(this.popAfter + "(rtns)");
        }
    }
}
});

Ext.reg('aimpopup', Ext.ux.form.AimPopup);

//------------------------Aim ExtJs Popup控件 结束------------------------//

//------------------------Aim ExtJs 用户选择控件 结束------------------------//
Ext.ux.AimUserSelector = Ext.extend(Ext.ux.form.AimPopup, {
    constructor: function(config) {
        config.popUrl = "/CommonPages/Select/UsrSelect/MUsrSelect.aspx?rtntype=array";
        config.seltype = config.seltype || "single";
        config.popUrl += "&seltype=" + config.seltype;
        config.popStyle = config.popStyle
        config.popAfter = config.popAfter || function(rtn) {
            if (rtn && rtn.data) {
                this.setValue(rtn.data.Name || "");
            }
            if (rtn && rtn.data.length > 0) {
                var names = "";
                $.each(rtn.data, function() {
                    names += this.Name + ",";
                });
                if (names.length > 0) names = names.substring(0, names.length - 1);
                this.setValue(names);
            }
        }

        Ext.ux.AimUserSelector.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimuserselector', Ext.ux.AimUserSelector);

Ext.ux.AimDeptSelector = Ext.extend(Ext.ux.form.AimPopup, {
    constructor: function(config) {
        config.popUrl = "/CommonPages/Select/GrpSelect/MGrpSelect.aspx?rtntype=array&cid=2";
        config.seltype = config.seltype || "single";
        config.popUrl += "&seltype=" + config.seltype;

        config.popAfter = config.popAfter || function(rtn) {
            if (rtn && rtn.data) {
                this.setValue(rtn.data.Name || "");
            }
        }

        Ext.ux.AimDeptSelector.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});
Ext.reg('aimdeptselector', Ext.ux.AimDeptSelector);

//------------------------Aim ExtJs 用户选择控件 结束------------------------//

//------------------------Aim ExtJs Combox控件 开始------------------------//

Ext.ux.form.AimComboBox = Ext.extend(Ext.form.ComboBox, {
    constructor: function(config) {
        config.editable = config.editable == true;  // 默认false
        config.displayField = config.displayField || 'text';
        config.valueField = config.valueField || 'value';
        config.triggerAction = config.triggerAction || 'all';
        config.selectOnFocus = !(config.selectOnFocus == false);  // 默认true
        config.blankText = config.blankText || '请选择...';
        config.mode = (config.mode || 'local');  // 默认true
        //config.emptyText = (config.emptyText || '请选择...');  // 默认true
        config.value = config.value || '';

        config.required = config.required == true;  // 默认 false
        if (!config.required && config.enumdata) {
            var tenumdata = { '': config.blankText };
            for (var key in config.enumdata) {
                tenumdata[key] = config.enumdata[key];
            }
            config.enumdata = tenumdata;
        }

        if (!config.store && config.enumdata) {
            config.store = new Ext.ux.data.AimEnumStore({ enumtype: config.enumtype, enumdata: config.enumdata });
        }

        Ext.ux.form.AimComboBox.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimcombo', Ext.ux.form.AimComboBox);

//------------------------Aim ExtJs Combox控件 结束------------------------//

//------------------------Aim ExtJs 表单扩展 开始------------------------//

Ext.ux.form.AimFormPanel = Ext.extend(Ext.form.FormPanel, {
    constructor: function(config) {
        var panel = this;

        config = config || {};
        config.frame = !(config.frame == false);
        config.url = config.url || '#';
        config.labelWidth = config.labelWidth || 60;
        config.defaultType = config.defaultType || 'textfield';
        config.bodyStyle = config.bodyStyle || 'padding: 5px 5px 0';

        if (config.padding !== 0) {
            config.padding = (config.padding || 5);
        }

        // 自动layout
        if (config.autolayout) {
            var colcount = config.colcount || 2;
            var autoitems = [];
            // config.defaults = Ext.extend(config.defaults, {});
            if (config.items && $.isArray(config.items)) {
                // 预处理
                $.each(config.items, function() {
                    if (this.flex != 0) {
                        this.flex = this.flex || 1;
                        if (this.flex > colcount) {
                            this.flex = colcount;
                        }
                    }

                    this.xtype = this.xtype || "field";
                    this.align = this.align || 'left';
                    this.anchor = this.anchor || '100%';
                });

                var tautoitem;

                for (var i = 0, pi = 0; i < config.items.length; i++) {
                    var titem = config.items[i];
                    var tfitem = { layout: 'form', flex: titem.flex, hidden: (titem.hidden || false), items: [titem] };
                    if (tfitem.hidden) { tfitem.flex = 0; }

                    tfitem.columnWidth = Math.floor(titem.flex * 100 / colcount) / 100;
                    tfitem.labelWidth = titem.labelWidth || config.labelWidth;
                    tfitem.bodyStyle = titem.bodyStyle || config.bodyStyle;

                    var tflexcount = 0;
                    if (tautoitem) {
                        tflexcount = panel.calcAutoItemTotalFlex(tautoitem);
                    }

                    if (i == 0 || (tflexcount + tfitem.flex) > pi) {
                        tautoitem = { layout: 'column', xtype: 'panel', items: [] };
                        autoitems.push(tautoitem);
                        pi = colcount;
                    }

                    tautoitem.items.push(tfitem);
                }
            }

            config.items = autoitems;
        }

        Ext.ux.form.AimFormPanel.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

// 计算一个自动生成的HBox Item flex和
calcAutoItemTotalFlex: function(autoitem) {
    var tflexcount = 0;
    $.each(autoitem.items, function() {
        tflexcount += this.flex;
    });

    return tflexcount;
},

setReadOnly: function(state) {
    $.each(this.items.items, function() {
        if (this.setReadOnly) {
            this.setReadOnly(true);
        }
    });
},

setReadOnly: function(state) {
    state = !(state == false);
    $.each(this.items.items, function() {
        if (this.setReadOnly) {
            this.setReadOnly(state);
        }
    });
},

setDisabled: function(state) {
    state = !(state == false);
    $.each(this.items.items, function() {
        if (this.setDisabled) {
            this.setDisabled(state);
        }
    });
}

});

Ext.reg('aimformpanel', Ext.ux.form.AimFormPanel);


var regint = /^[0-9]+$/;

Ext.apply(Ext.form.VTypes, {
    daterange: function(val, field) {
        var date = field.parseDate(val);

        if (!date) {
            return false;
        }
        if (field.startDateField && (!this.dateRangeMax || (date.getTime() != this.dateRangeMax.getTime()))) {
            var start = Ext.getCmp(field.startDateField);
            start.setMaxValue(date);
            start.validate();
            this.dateRangeMax = date;
        }
        else if (field.endDateField && (!this.dateRangeMin || (date.getTime() != this.dateRangeMin.getTime()))) {
            var end = Ext.getCmp(field.endDateField);
            end.setMinValue(date);
            end.validate();
            this.dateRangeMin = date;
        }
        /*
        * Always return true since we're only using this vtype to set the
        * min/max allowed values (these are tested for after the vtype test)
        */
        return true;
    },

    password: function(val, field) {
        if (field.initialPassField) {
            var pwd = Ext.getCmp(field.initialPassField);
            return (val == pwd.getValue());
        }
        return true;
    },

    passwordText: '密码不匹配'
});

Ext.ux.form.AimFieldSet = Ext.extend(Ext.form.FieldSet, {
    constructor: function(config) {
        var panel = this;

        config = config || {};
        config.labelWidth = config.labelWidth || 60;
        config.defaultType = config.defaultType || 'textfield';
        config.bodyStyle = config.bodyStyle || 'padding: 5px 5px 0';

        if (config.padding !== 0) {
            config.padding = (config.padding || 5);
        }

        // 自动layout
        if (config.autolayout) {
            var colcount = config.colcount || 2;
            var autoitems = [];
            // config.defaults = Ext.extend(config.defaults, {});
            if (config.items && $.isArray(config.items)) {
                // 预处理
                $.each(config.items, function() {
                    if (this.flex != 0) {
                        this.flex = this.flex || 1;
                        if (this.flex > colcount) {
                            this.flex = colcount;
                        }
                    }

                    this.xtype = this.xtype || "field";
                    this.align = this.align || 'left';
                    this.anchor = this.anchor || '100%';
                });

                var tautoitem;

                for (var i = 0, pi = 0; i < config.items.length; i++) {
                    var titem = config.items[i];
                    var tfitem = { layout: 'form', flex: titem.flex, hidden: (titem.hidden || false), items: [titem] };
                    if (tfitem.hidden) { tfitem.flex = 0; }

                    tfitem.columnWidth = Math.floor(titem.flex * 100 / colcount) / 100;
                    tfitem.labelWidth = titem.labelWidth || config.labelWidth;
                    tfitem.bodyStyle = titem.bodyStyle || config.bodyStyle;

                    var tflexcount = 0;
                    if (tautoitem) {
                        tflexcount = panel.calcAutoItemTotalFlex(tautoitem);
                    }

                    if (i == 0 || (tflexcount + tfitem.flex) > pi) {
                        tautoitem = { layout: 'column', xtype: 'panel', items: [] };
                        autoitems.push(tautoitem);
                        pi = colcount;
                    }

                    tautoitem.items.push(tfitem);
                }
            }

            config.items = autoitems;
        }

        Ext.ux.form.AimFieldSet.superclass.constructor.call(this, Ext.apply(config, {
    }));
},

// 计算一个自动生成的HBox Item flex和
calcAutoItemTotalFlex: function(autoitem) {
    var tflexcount = 0;
    $.each(autoitem.items, function() {
        tflexcount += this.flex;
    });

    return tflexcount;
}
});

Ext.reg('aimfieldset', Ext.ux.form.AimFieldSet);


Ext.ux.form.AimCheckBox = Ext.extend(Ext.form.Checkbox, {
    emptyValue: false,

    constructor: function(config) {
        config.inputValue = config.inputValue || "true";
        config.emptyValue = config.emptyValue || "false";

        Ext.ux.form.AimCheckBox.superclass.constructor.call(this, Ext.apply(config, {
    }));
}
});

Ext.reg('aimcheckbox', Ext.ux.form.AimCheckBox);


if ('function' !== typeof RegExp.escape) {
    RegExp.escape = function(s) {
        if ('string' !== typeof s) {
            return s;
        }
        // Note: if pasting from forum, precede ]/\ with backslash manually
        return s.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    }; // eo function escape
}

Ext.ux.form.MultiComboBox = Ext.extend(Ext.form.ComboBox, {
    // {{{
    // configuration options
    /**
    * @cfg {String} checkField Name of field used to store checked state.
    * It is automatically added to existing fields.
    * (defaults to "checked" - change it only if it collides with your normal field)
    */
    checkField: 'checked'

    /**
    * @cfg {String} separator Separator to use between values and texts (defaults to "," (comma))
    */
    , separator: ','

    /**
    * @cfg {String/Array} tpl Template for items.
    * Change it only if you know what you are doing.
    */
    // }}}
    // {{{
	, constructor: function(config) {
	    config = config || {};
	    config.listeners = config.listeners || {};
	    Ext.applyIf(config.listeners, {
	        scope: this
			, beforequery: this.onBeforeQuery
			, blur: this.onRealBlur
	    });
	    Ext.ux.form.MultiComboBox.superclass.constructor.call(this, config);
	} // eo function constructor
    // }}}
    // {{{
    , initComponent: function() {

        // template with checkbox
        if (!this.tpl) {
            this.tpl =
				 '<tpl for=".">'
				+ '<div class="x-combo-list-item">'
				+ '<img src="' + Ext.BLANK_IMAGE_URL + '" '
				+ 'class="ux-lovcombo-icon ux-lovcombo-icon-'
				+ '{[values.' + this.checkField + '?"checked":"unchecked"' + ']}">'
				+ '<div class="ux-lovcombo-item-text">{' + (this.displayField || 'text') + ':htmlEncode}</div>'
				+ '</div>'
				+ '</tpl>'
			;
        }

        // call parent
        Ext.ux.form.MultiComboBox.superclass.initComponent.apply(this, arguments);

        // remove selection from input field
        this.onLoad = this.onLoad.createSequence(function() {
            if (this.el) {
                var v = this.el.dom.value;
                this.el.dom.value = '';
                this.el.dom.value = v;
            }
        });

    } // eo function initComponent
    // }}}
    // {{{
    /**
    * Disables default tab key bahavior
    * @private
    */
	, initEvents: function() {
	    Ext.ux.form.MultiComboBox.superclass.initEvents.apply(this, arguments);

	    // disable default tab handling - does no good
	    this.keyNav.tab = false;

	} // eo function initEvents
    // }}}
    // {{{
    /**
    * Clears value
    */
	, clearValue: function() {
	    this.value = '';
	    this.setRawValue(this.value);
	    this.store.clearFilter();
	    this.store.each(function(r) {
	        r.set(this.checkField, false);
	    }, this);
	    if (this.hiddenField) {
	        this.hiddenField.value = '';
	    }
	    this.applyEmptyText();
	} // eo function clearValue
    // }}}
    // {{{
    /**
    * @return {String} separator (plus space) separated list of selected displayFields
    * @private
    */
	, getCheckedDisplay: function() {
	    var re = new RegExp(this.separator, "g");
	    return this.getCheckedValue(this.displayField).replace(re, this.separator + ' ');
	} // eo function getCheckedDisplay
    // }}}
    // {{{
    /**
    * @return {String} separator separated list of selected valueFields
    * @private
    */
	, getCheckedValue: function(field) {
	    field = field || this.valueField;
	    var c = [];

	    // store may be filtered so get all records
	    var snapshot = this.store.snapshot || this.store.data;

	    snapshot.each(function(r) {
	        if (r.get(this.checkField)) {
	            c.push(r.get(field));
	        }
	    }, this);

	    return c.join(this.separator);
	} // eo function getCheckedValue
    // }}}
    // {{{
    /**
    * beforequery event handler - handles multiple selections
    * @param {Object} qe query event
    * @private
    */
	, onBeforeQuery: function(qe) {
	    qe.query = qe.query.replace(new RegExp(RegExp.escape(this.getCheckedDisplay()) + '[ ' + this.separator + ']*'), '');
	} // eo function onBeforeQuery
    // }}}
    // {{{
    /**
    * blur event handler - runs only when real blur event is fired
    * @private
    */
	, onRealBlur: function() {
	    this.list.hide();
	    var rv = this.getRawValue();
	    var rva = rv.split(new RegExp(RegExp.escape(this.separator) + ' *'));
	    var va = [];
	    var snapshot = this.store.snapshot || this.store.data;

	    // iterate through raw values and records and check/uncheck items
	    Ext.each(rva, function(v) {
	        snapshot.each(function(r) {
	            if (v === r.get(this.displayField)) {
	                va.push(r.get(this.valueField));
	            }
	        }, this);
	    }, this);
	    this.setValue(va.join(this.separator));
	    this.store.clearFilter();
	} // eo function onRealBlur
    // }}}
    // {{{
    /**
    * Combo's onSelect override
    * @private
    * @param {Ext.data.Record} record record that has been selected in the list
    * @param {Number} index index of selected (clicked) record
    */
	, onSelect: function(record, index) {
	    if (this.fireEvent('beforeselect', this, record, index) !== false) {

	        // toggle checked field
	        record.set(this.checkField, !record.get(this.checkField));

	        // display full list
	        if (this.store.isFiltered()) {
	            this.doQuery(this.allQuery);
	        }

	        // set (update) value and fire event
	        this.setValue(this.getCheckedValue());
	        this.fireEvent('select', this, record, index);
	    }
	} // eo function onSelect
    // }}}
    // {{{
    /**
    * Sets the value of the LovCombo. The passed value can by a falsie (null, false, empty string), in
    * which case the combo value is cleared or separator separated string of values, e.g. '3,5,6'.
    * @param {Mixed} v value
    */
	, setValue: function(v) {
	    if (v) {
	        v = '' + v;
	        if (this.valueField) {
	            this.store.clearFilter();
	            this.store.each(function(r) {
	                var checked = !(!v.match(
						 '(^|' + this.separator + ')' + RegExp.escape(r.get(this.valueField))
						+ '(' + this.separator + '|$)'))
					;

	                r.set(this.checkField, checked);
	            }, this);
	            this.value = this.getCheckedValue();
	            this.setRawValue(this.getCheckedDisplay());
	            if (this.hiddenField) {
	                this.hiddenField.value = this.value;
	            }
	        }
	        else {
	            this.value = v;
	            this.setRawValue(v);
	            if (this.hiddenField) {
	                this.hiddenField.value = v;
	            }
	        }
	        if (this.el) {
	            this.el.removeClass(this.emptyClass);
	        }
	    }
	    else {
	        this.clearValue();
	    }
	} // eo function setValue
    // }}}
    // {{{
    /**
    * Selects all items
    */
	, selectAll: function() {
	    this.store.each(function(record) {
	        // toggle checked field
	        record.set(this.checkField, true);
	    }, this);

	    //display full list
	    this.doQuery(this.allQuery);
	    this.setValue(this.getCheckedValue());
	} // eo full selectAll
    // }}}
    // {{{
    /**
    * Deselects all items. Synonym for clearValue
    */
    , deselectAll: function() {
        this.clearValue();
    } // eo full deselectAll
    // }}}

}); // eo extend

Ext.override(Ext.ux.form.MultiComboBox, {
    beforeBlur: Ext.emptyFn
});
Ext.reg('multicombo', Ext.ux.form.MultiComboBox);

Ext.ux.form.SuperBoxSelect = function(config) {
    Ext.ux.form.SuperBoxSelect.superclass.constructor.call(this, config);
    this.addEvents(
    /**
    * Fires before an item is added to the component via user interaction. Return false from the callback function to prevent the item from being added.
    * @event beforeadditem
    * @memberOf Ext.ux.form.SuperBoxSelect
    * @param {SuperBoxSelect} this
    * @param {Mixed} value The value of the item to be added
    * @param {Record} rec The record being added
    * @param {Mixed} filtered Any filtered query data (if using queryFilterRe)
    */
        'beforeadditem',

    /**
    * Fires after a new item is added to the component.
    * @event additem
    * @memberOf Ext.ux.form.SuperBoxSelect
    * @param {SuperBoxSelect} this
    * @param {Mixed} value The value of the item which was added
    * @param {Record} record The store record which was added
    */
        'additem',

    /**
    * Fires when the allowAddNewData config is set to true, and a user attempts to add an item that is not in the data store.
    * @event newitem
    * @memberOf Ext.ux.form.SuperBoxSelect
    * @param {SuperBoxSelect} this
    * @param {Mixed} value The new item's value
    * @param {Mixed} filtered Any filtered query data (if using queryFilterRe)
    */
        'newitem',

    /**
    * Fires when an item's remove button is clicked. Return false from the callback function to prevent the item from being removed.
    * @event beforeremoveitem
    * @memberOf Ext.ux.form.SuperBoxSelect
    * @param {SuperBoxSelect} this
    * @param {Mixed} value The value of the item to be removed
    */
        'beforeremoveitem',

    /**
    * Fires after an item has been removed.
    * @event removeitem
    * @memberOf Ext.ux.form.SuperBoxSelect
    * @param {SuperBoxSelect} this
    * @param {Mixed} value The value of the item which was removed
    * @param {Record} record The store record which was removed
    */
        'removeitem',
    /**
    * Fires after the component values have been cleared.
    * @event clear
    * @memberOf Ext.ux.form.SuperBoxSelect
    * @param {SuperBoxSelect} this
    */
        'clear'
    );

};
/**
* @private hide from doc gen
*/
Ext.ux.form.SuperBoxSelect = Ext.extend(Ext.ux.form.SuperBoxSelect, Ext.form.ComboBox, {
    /**
    * @cfg {Boolean} addNewDataOnBlur Allows adding new items when the user tabs from the input element.
    */
    addNewDataOnBlur: false,
    /**
    * @cfg {Boolean} allowAddNewData When set to true, allows items to be added (via the setValueEx and addItem methods) that do not already exist in the data store. Defaults to false.
    */
    allowAddNewData: false,
    /**
    * @cfg {Boolean} allowQueryAll When set to false, prevents the trigger arrow from rendering, and the DOWN key from triggering a query all. Defaults to true.
    */
    allowQueryAll: true,
    /**
    * @cfg {Boolean} backspaceDeletesLastItem When set to false, the BACKSPACE key will focus the last selected item. When set to true, the last item will be immediately deleted. Defaults to true.
    */
    backspaceDeletesLastItem: true,
    /**
    * @cfg {String} classField The underlying data field that will be used to supply an additional class to each item.
    */
    classField: null,

    /**
    * @cfg {String} clearBtnCls An additional class to add to the in-field clear button.
    */
    clearBtnCls: '',
    /**
    * @cfg {Boolean} clearLastQueryOnEscape When set to true, the escape key will clear the lastQuery, enabling the previous query to be repeated.
    */
    clearLastQueryOnEscape: false,
    /**
    * @cfg {Boolean} clearOnEscape When set to true, the escape key will clear the input text when the component is not expanded.
    */
    clearOnEscape: false,

    /**
    * @cfg {String/XTemplate} displayFieldTpl A template for rendering the displayField in each selected item. Defaults to null.
    */
    displayFieldTpl: null,

    /**
    * @cfg {String} extraItemCls An additional css class to apply to each item.
    */
    extraItemCls: '',

    /**
    * @cfg {String/Object/Function} extraItemStyle Additional css style(s) to apply to each item. Should be a valid argument to Ext.Element.applyStyles.
    */
    extraItemStyle: '',

    /**
    * @cfg {String} expandBtnCls An additional class to add to the in-field expand button.
    */
    expandBtnCls: '',

    /**
    * @cfg {Boolean} fixFocusOnTabSelect When set to true, the component will not lose focus when a list item is selected with the TAB key. Defaults to true.
    */
    fixFocusOnTabSelect: true,
    /**
    * @cfg {Boolean} forceFormValue When set to true, the component will always return a value to the parent form getValues method, and when the parent form is submitted manually. Defaults to false, meaning the component will only be included in the parent form submission (or getValues) if at least 1 item has been selected.
    */
    forceFormValue: true,
    /**
    * @cfg {Boolean} forceSameValueQuery When set to true, the component will always query the server even when the last query was the same. Defaults to false.
    */
    forceSameValueQuery: false,
    /**
    * @cfg {Number} itemDelimiterKey A key code which terminates keying in of individual items, and adds the current
    * item to the list. Defaults to the ENTER key.
    */
    itemDelimiterKey: Ext.EventObject.ENTER,
    /**
    * @cfg {Boolean} navigateItemsWithTab When set to true the tab key will navigate between selected items. Defaults to true.
    */
    navigateItemsWithTab: true,
    /**
    * @cfg {Boolean} pinList When set to true and the list is opened via the arrow button, the select list will be pinned to allow for multiple selections. Defaults to true.
    */
    pinList: true,

    /**
    * @cfg {Boolean} preventDuplicates When set to true unique item values will be enforced. Defaults to true.
    */
    preventDuplicates: true,
    /**
    * @cfg {String|Regex} queryFilterRe Used to filter input values before querying the server, specifically useful when allowAddNewData is true as the filtered portion of the query will be passed to the newItem callback.
    */
    queryFilterRe: '',
    /**
    * @cfg {String} queryValuesDelimiter Used to delimit multiple values queried from the server when mode is remote.
    */
    queryValuesDelimiter: '|',

    /**
    * @cfg {String} queryValuesIndicator A request variable that is sent to the server (as true) to indicate that we are querying values rather than display data (as used in autocomplete) when mode is remote.
    */
    queryValuesIndicator: 'valuesqry',

    /**
    * @cfg {Boolean} removeValuesFromStore When set to true, selected records will be removed from the store. Defaults to true.
    */
    removeValuesFromStore: true,

    /**
    * @cfg {String} renderFieldBtns When set to true, will render in-field buttons for clearing the component, and displaying the list for selection. Defaults to true.
    */
    renderFieldBtns: true,

    /**
    * @cfg {Boolean} stackItems When set to true, the items will be stacked 1 per line. Defaults to false which displays the items inline.
    */
    stackItems: false,

    /**
    * @cfg {String} styleField The underlying data field that will be used to supply additional css styles to each item.
    */
    styleField: null,

    /**
    * @cfg {Boolean} supressClearValueRemoveEvents When true, the removeitem event will not be fired for each item when the clearValue method is called, or when the clear button is used. Defaults to false.
    */
    supressClearValueRemoveEvents: false,

    /**
    * @cfg {String/Boolean} validationEvent The event that should initiate field validation. Set to false to disable automatic validation (defaults to 'blur').
    */
    validationEvent: 'blur',

    /**
    * @cfg {String} valueDelimiter The delimiter to use when joining and splitting value arrays and strings.
    */
    valueDelimiter: ',',
    initComponent: function() {
        Ext.apply(this, {
            items: new Ext.util.MixedCollection(false),
            usedRecords: new Ext.util.MixedCollection(false),
            addedRecords: [],
            remoteLookup: [],
            hideTrigger: true,
            grow: false,
            resizable: false,
            multiSelectMode: false,
            preRenderValue: null,
            filteredQueryData: ''

        });
        if (this.queryFilterRe) {
            if (Ext.isString(this.queryFilterRe)) {
                this.queryFilterRe = new RegExp(this.queryFilterRe);
            }
        }
        if (this.transform) {
            this.doTransform();
        }
        if (this.forceFormValue) {
            this.items.on({
                add: this.manageNameAttribute,
                remove: this.manageNameAttribute,
                clear: this.manageNameAttribute,
                scope: this
            });
        }

        Ext.ux.form.SuperBoxSelect.superclass.initComponent.call(this);
        if (this.mode === 'remote' && this.store) {
            this.store.on('load', this.onStoreLoad, this);
        }
    }
    , minListWidth: 200// 展示多列  jnp
    , initList: function() {
        if ((!this.tpl)) {  // 展示多列 jnp
            var tplString = "";
            var cls = 'x-combo-list';
            this.tpl = new Ext.XTemplate(
                '<table><tpl for="."><tr class="' + cls + '-item" height="20px" >',
                    '<td width=45px>{Name}</td>',
                    '<td width=45px>{WorkNo}</td>',
                    '<td width=100px>{DeptName}</td>',
                '</tr></tpl></table>'
            );
        }
        Ext.ux.form.MultiComboBox.superclass.initList.call(this);
    },
    onRender: function(ct, position) {
        var h = this.hiddenName;
        this.hiddenName = null;
        Ext.ux.form.SuperBoxSelect.superclass.onRender.call(this, ct, position);
        this.hiddenName = h;
        this.manageNameAttribute();

        var extraClass = (this.stackItems === true) ? 'x-superboxselect-stacked' : '';
        if (this.renderFieldBtns) {
            extraClass += ' x-superboxselect-display-btns';
        }
        this.el.removeClass('x-form-text').addClass('x-superboxselect-input-field');

        this.wrapEl = this.el.wrap({
            tag: 'ul'
        });

        this.outerWrapEl = this.wrapEl.wrap({
            tag: 'div',
            cls: 'x-form-text x-superboxselect ' + extraClass
        });

        this.inputEl = this.el.wrap({
            tag: 'li',
            cls: 'x-superboxselect-input'
        });

        if (this.renderFieldBtns) {
            this.setupFieldButtons().manageClearBtn();
        }

        this.setupFormInterception();
    },
    doTransform: function() {
        var s = Ext.getDom(this.transform), transformValues = [];
        if (!this.store) {
            this.mode = 'local';
            var d = [], opts = s.options;
            for (var i = 0, len = opts.length; i < len; i++) {
                var o = opts[i], oe = Ext.get(o),
                        value = oe.getAttributeNS(null, 'value') || '',
                        cls = oe.getAttributeNS(null, 'className') || '',
                        style = oe.getAttributeNS(null, 'style') || '';
                if (o.selected) {
                    transformValues.push(value);
                }
                d.push([value, o.text, cls, typeof (style) === "string" ? style : style.cssText]);
            }
            this.store = new Ext.data.SimpleStore({
                'id': 0,
                fields: ['value', 'text', 'cls', 'style'],
                data: d
            });
            Ext.apply(this, {
                valueField: 'value',
                displayField: 'text',
                classField: 'cls',
                styleField: 'style'
            });
        }

        if (transformValues.length) {
            this.value = transformValues.join(',');
        }
    },
    setupFieldButtons: function() {
        this.buttonWrap = this.outerWrapEl.createChild({
            cls: 'x-superboxselect-btns'
        });

        this.buttonClear = this.buttonWrap.createChild({
            tag: 'div',
            cls: 'x-superboxselect-btn-clear ' + this.clearBtnCls
        });

        if (this.allowQueryAll) {
            this.buttonExpand = this.buttonWrap.createChild({
                tag: 'div',
                cls: 'x-superboxselect-btn-expand ' + this.expandBtnCls
            });
        }

        this.initButtonEvents();

        return this;
    },
    initButtonEvents: function() {
        this.buttonClear.addClassOnOver('x-superboxselect-btn-over').on('click', function(e) {
            e.stopEvent();
            if (this.disabled) {
                return;
            }
            this.clearValue();
            this.el.focus();
        }, this);

        if (this.allowQueryAll) {
            this.buttonExpand.addClassOnOver('x-superboxselect-btn-over').on('click', function(e) {
                e.stopEvent();
                if (this.disabled) {
                    return;
                }
                if (this.isExpanded()) {
                    this.multiSelectMode = false;
                } else if (this.pinList) {
                    this.multiSelectMode = true;
                }
                this.onTriggerClick();
            }, this);
        }
    },
    removeButtonEvents: function() {
        this.buttonClear.removeAllListeners();
        if (this.allowQueryAll) {
            this.buttonExpand.removeAllListeners();
        }
        return this;
    },
    clearCurrentFocus: function() {
        if (this.currentFocus) {
            this.currentFocus.onLnkBlur();
            this.currentFocus = null;
        }
        return this;
    },
    initEvents: function() {
        var el = this.el;
        el.on({
            click: this.onClick,
            focus: this.clearCurrentFocus,
            blur: this.onBlur,
            keydown: this.onKeyDownHandler,
            keyup: this.onKeyUpBuffered,
            scope: this
        });

        this.on({
            collapse: this.onCollapse,
            expand: this.clearCurrentFocus,
            scope: this
        });

        this.wrapEl.on('click', this.onWrapClick, this);
        this.outerWrapEl.on('click', this.onWrapClick, this);

        this.inputEl.focus = function() {
            el.focus();
        };

        Ext.ux.form.SuperBoxSelect.superclass.initEvents.call(this);

        Ext.apply(this.keyNav, {
            tab: function(e) {
                if (this.fixFocusOnTabSelect && this.isExpanded()) {
                    e.stopEvent();
                    el.blur();
                    this.onViewClick(false);
                    this.focus(false, 10);
                    return true;
                }

                this.onViewClick(false);
                if (el.dom.value !== '') {
                    this.setRawValue('');
                }

                return true;
            },

            down: function(e) {
                if (!this.isExpanded() && !this.currentFocus) {
                    if (this.allowQueryAll) {
                        this.onTriggerClick();
                    }
                } else {
                    this.inKeyMode = true;
                    this.selectNext();
                }
            },

            enter: function() { }
        });
    },

    onClick: function() {
        this.clearCurrentFocus();
        this.collapse();
        this.autoSize();
    },

    beforeBlur: function() {
        if (this.allowAddNewData && this.addNewDataOnBlur) {
            var v = this.el.dom.value;
            if (v !== '') {
                this.fireNewItemEvent(v);
            }
        }
        Ext.form.ComboBox.superclass.beforeBlur.call(this);
    },

    onFocus: function() {
        this.outerWrapEl.addClass(this.focusClass);

        Ext.ux.form.SuperBoxSelect.superclass.onFocus.call(this);
    },

    onBlur: function() {
        this.outerWrapEl.removeClass(this.focusClass);

        this.clearCurrentFocus();

        if (this.el.dom.value !== '') {
            this.applyEmptyText();
            this.autoSize();
        }

        Ext.ux.form.SuperBoxSelect.superclass.onBlur.call(this);
    },

    onCollapse: function() {
        this.view.clearSelections();
        this.multiSelectMode = false;
    },

    onWrapClick: function(e) {
        e.stopEvent();
        this.collapse();
        this.el.focus();
        this.clearCurrentFocus();
    },
    markInvalid: function(msg) {
        var elp, t;

        if (!this.rendered || this.preventMark) {
            return;
        }
        this.outerWrapEl.addClass(this.invalidClass);
        msg = msg || this.invalidText;

        switch (this.msgTarget) {
            case 'qtip':
                Ext.apply(this.el.dom, {
                    qtip: msg,
                    qclass: 'x-form-invalid-tip'
                });
                Ext.apply(this.wrapEl.dom, {
                    qtip: msg,
                    qclass: 'x-form-invalid-tip'
                });
                if (Ext.QuickTips) { // fix for floating editors interacting with DND
                    Ext.QuickTips.enable();
                }
                break;
            case 'title':
                this.el.dom.title = msg;
                this.wrapEl.dom.title = msg;
                this.outerWrapEl.dom.title = msg;
                break;
            case 'under':
                if (!this.errorEl) {
                    elp = this.getErrorCt();
                    if (!elp) { // field has no container el
                        this.el.dom.title = msg;
                        break;
                    }
                    this.errorEl = elp.createChild({ cls: 'x-form-invalid-msg' });
                    this.errorEl.setWidth(elp.getWidth(true) - 20);
                }
                this.errorEl.update(msg);
                Ext.form.Field.msgFx[this.msgFx].show(this.errorEl, this);
                break;
            case 'side':
                if (!this.errorIcon) {
                    elp = this.getErrorCt();
                    if (!elp) { // field has no container el
                        this.el.dom.title = msg;
                        break;
                    }
                    this.errorIcon = elp.createChild({ cls: 'x-form-invalid-icon' });
                }
                this.alignErrorIcon();
                Ext.apply(this.errorIcon.dom, {
                    qtip: msg,
                    qclass: 'x-form-invalid-tip'
                });
                this.errorIcon.show();
                this.on('resize', this.alignErrorIcon, this);
                break;
            default:
                t = Ext.getDom(this.msgTarget);
                t.innerHTML = msg;
                t.style.display = this.msgDisplay;
                break;
        }
        this.fireEvent('invalid', this, msg);
    },
    clearInvalid: function() {
        if (!this.rendered || this.preventMark) { // not rendered
            return;
        }
        this.outerWrapEl.removeClass(this.invalidClass);
        switch (this.msgTarget) {
            case 'qtip':
                this.el.dom.qtip = '';
                this.wrapEl.dom.qtip = '';
                break;
            case 'title':
                this.el.dom.title = '';
                this.wrapEl.dom.title = '';
                this.outerWrapEl.dom.title = '';
                break;
            case 'under':
                if (this.errorEl) {
                    Ext.form.Field.msgFx[this.msgFx].hide(this.errorEl, this);
                }
                break;
            case 'side':
                if (this.errorIcon) {
                    this.errorIcon.dom.qtip = '';
                    this.errorIcon.hide();
                    this.un('resize', this.alignErrorIcon, this);
                }
                break;
            default:
                var t = Ext.getDom(this.msgTarget);
                t.innerHTML = '';
                t.style.display = 'none';
                break;
        }
        this.fireEvent('valid', this);
    },
    alignErrorIcon: function() {
        if (this.wrap) {
            this.errorIcon.alignTo(this.wrap, 'tl-tr', [Ext.isIE ? 5 : 2, 3]);
        }
    },
    expand: function() {
        if (this.isExpanded() || !this.hasFocus) {
            return;
        }
        if (this.bufferSize) {
            this.doResize(this.bufferSize);
            delete this.bufferSize;
        }
        this.list.alignTo(this.outerWrapEl, this.listAlign).show();
        this.innerList.setOverflow('auto'); // necessary for FF 2.0/Mac
        this.mon(Ext.getDoc(), {
            scope: this,
            mousewheel: this.collapseIf,
            mousedown: this.collapseIf
        });
        this.fireEvent('expand', this);
    },
    restrictHeight: function() {
        var inner = this.innerList.dom,
            st = inner.scrollTop,
            list = this.list;

        inner.style.height = '';

        var pad = list.getFrameWidth('tb') + (this.resizable ? this.handleHeight : 0) + this.assetHeight,
            h = Math.max(inner.clientHeight, inner.offsetHeight, inner.scrollHeight),
            ha = this.getPosition()[1] - Ext.getBody().getScroll().top,
            hb = Ext.lib.Dom.getViewHeight() - ha - this.getSize().height,
            space = Math.max(ha, hb, this.minHeight || 0) - list.shadowOffset - pad - 5;

        h = Math.min(h, space, this.maxHeight);
        this.innerList.setHeight(h);

        list.beginUpdate();
        list.setHeight(h + pad);
        list.alignTo(this.outerWrapEl, this.listAlign);
        list.endUpdate();

        if (this.multiSelectMode) {
            inner.scrollTop = st;
        }
    },
    validateValue: function(val) {
        if (this.items.getCount() === 0) {
            if (this.allowBlank) {
                this.clearInvalid();
                return true;
            } else {
                this.markInvalid(this.blankText);
                return false;
            }
        }
        this.clearInvalid();
        return true;
    },
    manageNameAttribute: function() {
        if (this.items.getCount() === 0 && this.forceFormValue) {
            this.el.dom.setAttribute('name', this.hiddenName || this.name);
        } else {
            this.el.dom.removeAttribute('name');
        }
    },
    setupFormInterception: function() {
        var form;
        this.findParentBy(function(p) {
            if (p.getForm) {
                form = p.getForm();
            }
        });
        if (form) {
            var formGet = form.getValues;
            form.getValues = function(asString) {
                this.el.dom.disabled = true;
                var oldVal = this.el.dom.value;
                this.setRawValue('');
                var vals = formGet.call(form);
                this.el.dom.disabled = false;
                this.setRawValue(oldVal);
                if (this.forceFormValue && this.items.getCount() === 0) {
                    vals[this.name] = '';
                }
                return asString ? Ext.urlEncode(vals) : vals;
            } .createDelegate(this);
        }
    },
    onResize: function(w, h, rw, rh) {
        var reduce = Ext.isIE6 ? 4 : Ext.isIE7 ? 1 : Ext.isIE8 ? 1 : 0;
        if (this.wrapEl) {
            this._width = w;
            this.outerWrapEl.setWidth(w - reduce);
            if (this.renderFieldBtns) {
                reduce += (this.buttonWrap.getWidth() + 20);
                this.wrapEl.setWidth(w - reduce);
            }
        }
        Ext.ux.form.SuperBoxSelect.superclass.onResize.call(this, w, h, rw, rh);
        this.autoSize();
    },
    onEnable: function() {
        Ext.ux.form.SuperBoxSelect.superclass.onEnable.call(this);
        this.items.each(function(item) {
            item.enable();
        });
        if (this.renderFieldBtns) {
            this.initButtonEvents();
        }
    },
    onDisable: function() {
        Ext.ux.form.SuperBoxSelect.superclass.onDisable.call(this);
        this.items.each(function(item) {
            item.disable();
        });
        if (this.renderFieldBtns) {
            this.removeButtonEvents();
        }
    },
    /**
    * Clears all values from the component.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name clearValue
    * @param {Boolean} supressRemoveEvent [Optional] When true, the 'removeitem' event will not fire for each item that is removed.
    */
    clearValue: function(supressRemoveEvent) {
        Ext.ux.form.SuperBoxSelect.superclass.clearValue.call(this);
        this.preventMultipleRemoveEvents = supressRemoveEvent || this.supressClearValueRemoveEvents || false;
        this.removeAllItems();
        this.preventMultipleRemoveEvents = false;
        this.fireEvent('clear', this);
        return this;
    },
    fireNewItemEvent: function(val) {
        this.view.clearSelections();
        this.collapse();
        this.setRawValue('');
        if (this.queryFilterRe) {
            val = val.replace(this.queryFilterRe, '');
            if (!val) {
                return;
            }
        }
        this.fireEvent('newitem', this, val, this.filteredQueryData);
    },
    onKeyUp: function(e) {
        if (this.editable !== false && (!e.isSpecialKey() || e.getKey() === e.BACKSPACE) && this.itemDelimiterKey.indexOf !== e.getKey() && (!e.hasModifier() || e.shiftKey)) {
            this.lastKey = e.getKey();
            this.dqTask.delay(this.queryDelay);
        }
    },
    onKeyDownHandler: function(e, t) {
        var toDestroy, nextFocus, idx;

        if (e.getKey() === e.ESC) {
            if (!this.isExpanded()) {
                if (this.el.dom.value != '' && (this.clearOnEscape || this.clearLastQueryOnEscape)) {
                    if (this.clearOnEscape) {
                        this.el.dom.value = '';
                    }
                    if (this.clearLastQueryOnEscape) {
                        this.lastQuery = '';
                    }
                    e.stopEvent();
                }
            }
        }
        if ((e.getKey() === e.DELETE || e.getKey() === e.SPACE) && this.currentFocus) {
            e.stopEvent();
            toDestroy = this.currentFocus;
            this.on('expand', function() { this.collapse(); }, this, { single: true });
            idx = this.items.indexOfKey(this.currentFocus.key);
            this.clearCurrentFocus();

            if (idx < (this.items.getCount() - 1)) {
                nextFocus = this.items.itemAt(idx + 1);
            }

            toDestroy.preDestroy(true);
            if (nextFocus) {
                (function() {
                    nextFocus.onLnkFocus();
                    this.currentFocus = nextFocus;
                }).defer(200, this);
            }

            return true;
        }

        var val = this.el.dom.value, it, ctrl = e.ctrlKey;

        if (this.itemDelimiterKey === e.getKey()) {
            e.stopEvent();
            if (val !== "") {
                if (ctrl || !this.isExpanded()) {  //ctrl+enter for new items
                    this.fireNewItemEvent(val);
                } else {
                    this.onViewClick();
                    //removed from 3.0.1
                    if (this.unsetDelayCheck) {
                        this.delayedCheck = true;
                        this.unsetDelayCheck.defer(10, this);
                    }
                }
            } else {
                if (!this.isExpanded()) {
                    return;
                }
                this.onViewClick();
                //removed from 3.0.1
                if (this.unsetDelayCheck) {
                    this.delayedCheck = true;
                    this.unsetDelayCheck.defer(10, this);
                }
            }
            return true;
        }

        if (val !== '') {
            this.autoSize();
            return;
        }

        //select first item
        if (e.getKey() === e.HOME) {
            e.stopEvent();
            if (this.items.getCount() > 0) {
                this.collapse();
                it = this.items.get(0);
                it.el.focus();

            }
            return true;
        }
        //backspace remove
        if (e.getKey() === e.BACKSPACE) {
            e.stopEvent();
            if (this.currentFocus) {
                toDestroy = this.currentFocus;
                this.on('expand', function() {
                    this.collapse();
                }, this, { single: true });

                idx = this.items.indexOfKey(toDestroy.key);

                this.clearCurrentFocus();
                if (idx < (this.items.getCount() - 1)) {
                    nextFocus = this.items.itemAt(idx + 1);
                }

                toDestroy.preDestroy(true);

                if (nextFocus) {
                    (function() {
                        nextFocus.onLnkFocus();
                        this.currentFocus = nextFocus;
                    }).defer(200, this);
                }

                return;
            } else {
                it = this.items.get(this.items.getCount() - 1);
                if (it) {
                    if (this.backspaceDeletesLastItem) {
                        this.on('expand', function() { this.collapse(); }, this, { single: true });
                        it.preDestroy(true);
                    } else {
                        if (this.navigateItemsWithTab) {
                            it.onElClick();
                        } else {
                            this.on('expand', function() {
                                this.collapse();
                                this.currentFocus = it;
                                this.currentFocus.onLnkFocus.defer(20, this.currentFocus);
                            }, this, { single: true });
                        }
                    }
                }
                return true;
            }
        }

        if (!e.isNavKeyPress()) {
            this.multiSelectMode = false;
            this.clearCurrentFocus();
            return;
        }
        //arrow nav
        if (e.getKey() === e.LEFT || (e.getKey() === e.UP && !this.isExpanded())) {
            e.stopEvent();
            this.collapse();
            //get last item
            it = this.items.get(this.items.getCount() - 1);
            if (this.navigateItemsWithTab) {
                //focus last el
                if (it) {
                    it.focus();
                }
            } else {
                //focus prev item
                if (this.currentFocus) {
                    idx = this.items.indexOfKey(this.currentFocus.key);
                    this.clearCurrentFocus();

                    if (idx !== 0) {
                        this.currentFocus = this.items.itemAt(idx - 1);
                        this.currentFocus.onLnkFocus();
                    }
                } else {
                    this.currentFocus = it;
                    if (it) {
                        it.onLnkFocus();
                    }
                }
            }
            return true;
        }
        if (e.getKey() === e.DOWN) {
            if (this.currentFocus) {
                this.collapse();
                e.stopEvent();
                idx = this.items.indexOfKey(this.currentFocus.key);
                if (idx == (this.items.getCount() - 1)) {
                    this.clearCurrentFocus.defer(10, this);
                } else {
                    this.clearCurrentFocus();
                    this.currentFocus = this.items.itemAt(idx + 1);
                    if (this.currentFocus) {
                        this.currentFocus.onLnkFocus();
                    }
                }
                return true;
            }
        }
        if (e.getKey() === e.RIGHT) {
            this.collapse();
            it = this.items.itemAt(0);
            if (this.navigateItemsWithTab) {
                //focus first el
                if (it) {
                    it.focus();
                }
            } else {
                if (this.currentFocus) {
                    idx = this.items.indexOfKey(this.currentFocus.key);
                    this.clearCurrentFocus();
                    if (idx < (this.items.getCount() - 1)) {
                        this.currentFocus = this.items.itemAt(idx + 1);
                        if (this.currentFocus) {
                            this.currentFocus.onLnkFocus();
                        }
                    }
                } else {
                    this.currentFocus = it;
                    if (it) {
                        it.onLnkFocus();
                    }
                }
            }
        }
    },
    onKeyUpBuffered: function(e) {
        if (!e.isNavKeyPress()) {
            this.autoSize();
        }
    },
    reset: function() {
        this.killItems();
        Ext.ux.form.SuperBoxSelect.superclass.reset.call(this);
        this.addedRecords = [];
        this.autoSize().setRawValue('');
    },
    applyEmptyText: function() {
        this.setRawValue('');
        if (this.items.getCount() > 0) {
            this.el.removeClass(this.emptyClass);
            this.setRawValue('');
            return this;
        }
        if (this.rendered && this.emptyText && this.getRawValue().length < 1) {
            this.setRawValue(this.emptyText);
            this.el.addClass(this.emptyClass);
        }
        return this;
    },
    /**
    * @private
    *
    * Use clearValue instead
    */
    removeAllItems: function() {
        this.items.each(function(item) {
            item.preDestroy(true);
        }, this);
        this.manageClearBtn();
        return this;
    },
    killItems: function() {
        this.items.each(function(item) {
            item.kill();
        }, this);
        this.resetStore();
        this.items.clear();
        this.manageClearBtn();
        return this;
    },
    resetStore: function() {
        this.store.clearFilter();
        if (!this.removeValuesFromStore) {
            return this;
        }
        this.usedRecords.each(function(rec) {
            this.store.add(rec);
        }, this);
        this.usedRecords.clear();
        if (!this.store.remoteSort) {
            this.store.sort(this.displayField, 'ASC');
        }

        return this;
    },
    sortStore: function() {
        var ss = this.store.getSortState();
        if (ss && ss.field) {
            this.store.sort(ss.field, ss.direction);
        }
        return this;
    },
    getCaption: function(dataObject) {
        if (typeof this.displayFieldTpl === 'string') {
            this.displayFieldTpl = new Ext.XTemplate(this.displayFieldTpl);
        }
        var caption, recordData = dataObject instanceof Ext.data.Record ? dataObject.data : dataObject;

        if (this.displayFieldTpl) {
            caption = this.displayFieldTpl.apply(recordData);
        } else if (this.displayField) {
            caption = recordData[this.displayField];
        }

        return caption;
    },
    addRecord: function(record) {
        var display = record.data[this.displayField],
            caption = this.getCaption(record),
            val = record.data[this.valueField],
            cls = this.classField ? record.data[this.classField] : '',
            style = this.styleField ? record.data[this.styleField] : '';

        if (this.removeValuesFromStore) {
            this.usedRecords.add(val, record);
            this.store.remove(record);
        }

        this.addItemBox(val, display, caption, cls, style);
        this.fireEvent('additem', this, val, record);
    },
    createRecord: function(recordData) {
        if (!this.recordConstructor) {
            var recordFields = [
                { name: this.valueField },
                { name: this.displayField }
            ];
            if (this.classField) {
                recordFields.push({ name: this.classField });
            }
            if (this.styleField) {
                recordFields.push({ name: this.styleField });
            }
            this.recordConstructor = Ext.data.Record.create(recordFields);
        }
        return new this.recordConstructor(recordData);
    },
    /**
    * Adds an array of items to the SuperBoxSelect component if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name addItem
    * @param {Array} newItemObjects An Array of object literals containing the property names and values for an item. The property names must match those specified in {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField}
    */
    addItems: function(newItemObjects) {
        if (Ext.isArray(newItemObjects)) {
            Ext.each(newItemObjects, function(item) {
                this.addItem(item);
            }, this);
        } else {
            this.addItem(newItemObjects);
        }
    },
    /**
    * Adds a new non-existing item to the SuperBoxSelect component if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
    * This method should be used in place of addItem from within the newitem event handler.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name addNewItem
    * @param {Object} newItemObject An object literal containing the property names and values for an item. The property names must match those specified in {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField}
    */
    addNewItem: function(newItemObject) {
        this.addItem(newItemObject, true);
    },
    /**
    * Adds an item to the SuperBoxSelect component if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name addItem
    * @param {Object} newItemObject An object literal containing the property names and values for an item. The property names must match those specified in {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField}
    */
    addItem: function(newItemObject, /*hidden param*/forcedAdd) {

        var val = newItemObject[this.valueField];

        if (this.disabled) {
            return false;
        }
        if (this.preventDuplicates && this.hasValue(val)) {
            return;
        }

        //use existing record if found
        var record = this.findRecord(this.valueField, val);
        if (record) {
            this.addRecord(record);
            return;
        } else if (!this.allowAddNewData) { // else it's a new item
            return;
        }

        if (this.mode === 'remote') {
            this.remoteLookup.push(newItemObject);
            this.doQuery(val, false, false, forcedAdd);
            return;
        }

        var rec = this.createRecord(newItemObject);
        this.store.add(rec);
        this.addRecord(rec);

        return true;
    },
    addItemBox: function(itemVal, itemDisplay, itemCaption, itemClass, itemStyle) {
        var hConfig, parseStyle = function(s) {
            var ret = '';
            switch (typeof s) {
                case 'function':
                    ret = s.call();
                    break;
                case 'object':
                    for (var p in s) {
                        ret += p + ':' + s[p] + ';';
                    }
                    break;
                case 'string':
                    ret = s + ';';
            }
            return ret;
        }, itemKey = Ext.id(null, 'sbx-item'), box = new Ext.ux.form.SuperBoxSelectItem({
            owner: this,
            disabled: this.disabled,
            renderTo: this.wrapEl,
            cls: this.extraItemCls + ' ' + itemClass,
            style: parseStyle(this.extraItemStyle) + ' ' + itemStyle,
            caption: itemCaption,
            display: itemDisplay,
            value: itemVal,
            key: itemKey,
            listeners: {
                'remove': function(item) {
                    if (this.fireEvent('beforeremoveitem', this, item.value) === false) {
                        return false;
                    }
                    this.items.removeKey(item.key);
                    if (this.removeValuesFromStore) {
                        if (this.usedRecords.containsKey(item.value)) {
                            this.store.add(this.usedRecords.get(item.value));
                            this.usedRecords.removeKey(item.value);
                            this.sortStore();
                            if (this.view) {
                                this.view.render();
                            }
                        }
                    }
                    if (!this.preventMultipleRemoveEvents) {
                        this.fireEvent.defer(250, this, ['removeitem', this, item.value, this.findInStore(item.value)]);
                    }
                },
                destroy: function() {
                    this.collapse();
                    this.autoSize().manageClearBtn().validateValue();
                },
                scope: this
            }
        });
        box.render();

        hConfig = {
            tag: 'input',
            type: 'hidden',
            value: itemVal,
            name: (this.hiddenName || this.name)
        };

        if (this.disabled) {
            Ext.apply(hConfig, {
                disabled: 'disabled'
            })
        }
        box.hidden = this.el.insertSibling(hConfig, 'before');

        this.items.add(itemKey, box);
        this.applyEmptyText().autoSize().manageClearBtn().validateValue();
    },
    manageClearBtn: function() {
        if (!this.renderFieldBtns || !this.rendered) {
            return this;
        }
        var cls = 'x-superboxselect-btn-hide';
        if (this.items.getCount() === 0) {
            this.buttonClear.addClass(cls);
        } else {
            this.buttonClear.removeClass(cls);
        }
        return this;
    },
    findInStore: function(val) {
        var index = this.store.find(this.valueField, val);
        if (index > -1) {
            return this.store.getAt(index);
        }
        return false;
    },
    /**
    * Returns an array of records associated with the selected items.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name getSelectedRecords
    * @return {Array} An array of records associated with the selected items.
    */
    getSelectedRecords: function() {
        var ret = [];
        if (this.removeValuesFromStore) {
            ret = this.usedRecords.getRange();
        } else {
            var vals = [];
            this.items.each(function(item) {
                vals.push(item.value);
            });
            Ext.each(vals, function(val) {
                ret.push(this.findInStore(val));
            }, this);
        }
        return ret;
    },
    /**
    * Returns an item which contains the passed HTML Element.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name findSelectedItem
    * @param {HTMLElement} el The LI HTMLElement of a selected item in the list
    */
    findSelectedItem: function(el) {
        var ret;
        this.items.each(function(item) {
            if (item.el.dom === el) {
                ret = item;
                return false;
            }
        });
        return ret;
    },
    /**
    * Returns a record associated with the item which contains the passed HTML Element.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name findSelectedRecord
    * @param {HTMLElement} el The LI HTMLElement of a selected item in the list
    */
    findSelectedRecord: function(el) {
        var ret, item = this.findSelectedItem(el);
        if (item) {
            ret = this.findSelectedRecordByValue(item.value)
        }

        return ret;
    },
    /**
    * Returns a selected record associated with the passed value.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name findSelectedRecordByValue
    * @param {Mixed} val The value to lookup
    * @return {Record} The matching Record.
    */
    findSelectedRecordByValue: function(val) {
        var ret;
        if (this.removeValuesFromStore) {
            this.usedRecords.each(function(rec) {
                if (rec.get(this.valueField) == val) {
                    ret = rec;
                    return false;
                }
            }, this);
        } else {
            ret = this.findInStore(val);
        }
        return ret;
    },
    /**
    * Returns a String value containing a concatenated list of item values. The list is concatenated with the {@link #Ext.ux.form.SuperBoxSelect-valueDelimiter}.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name getValue
    * @return {String} a String value containing a concatenated list of item values.
    */
    getValue: function() {
        var ret = [];
        this.items.each(function(item) {
            ret.push(item.value);
        });
        return ret.join(this.valueDelimiter);
    },
    /**
    * Returns the count of the selected items.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name getCount
    * @return {Number} the number of selected items.
    */
    getCount: function() {
        return this.items.getCount();
    },
    /**
    * Returns an Array of item objects containing the {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField}, {@link #Ext.ux.form.SuperBoxSelect-classField} and {@link #Ext.ux.form.SuperBoxSelect-styleField} properties.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name getValueEx
    * @return {Array} an array of item objects.
    */
    getValueEx: function() {
        var ret = [];
        this.items.each(function(item) {
            var newItem = {};
            newItem[this.valueField] = item.value;
            newItem[this.displayField] = item.display;
            if (this.classField) {
                newItem[this.classField] = item.cls || '';
            }
            if (this.styleField) {
                newItem[this.styleField] = item.style || '';
            }
            ret.push(newItem);
        }, this);
        return ret;
    },
    // private
    initValue: function() {
        if (Ext.isObject(this.value) || Ext.isArray(this.value)) {
            this.setValueEx(this.value);
            this.originalValue = this.getValue();
        } else {
            Ext.ux.form.SuperBoxSelect.superclass.initValue.call(this);
        }
        if (this.mode === 'remote') {
            this.setOriginal = true;
        }
    },
    /**
    * Adds an existing value to the SuperBoxSelect component.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name setValue
    * @param {String|Array} value An array of item values, or a String value containing a delimited list of item values. (The list should be delimited with the {@link #Ext.ux.form.SuperBoxSelect-valueDelimiter)
    */
    addValue: function(value) {

        if (Ext.isEmpty(value)) {
            return;
        }

        var values = value;
        if (!Ext.isArray(value)) {
            value = '' + value;
            values = value.split(this.valueDelimiter);
        }

        Ext.each(values, function(val) {
            var record = this.findRecord(this.valueField, val);
            if (record) {
                this.addRecord(record);
            } else if (this.mode === 'remote') {
                this.remoteLookup.push(val);
            }
        }, this);

        if (this.mode === 'remote') {
            var q = this.remoteLookup.join(this.queryValuesDelimiter);
            this.doQuery(q, false, true); //3rd param to specify a values query
        }
    },
    /**
    * Sets the value of the SuperBoxSelect component.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name setValue
    * @param {String|Array} value An array of item values, or a String value containing a delimited list of item values. (The list should be delimited with the {@link #Ext.ux.form.SuperBoxSelect-valueDelimiter)
    */
    setValue: function(value) {
        if (!this.rendered) {
            this.value = value;
            return;
        }
        this.removeAllItems().resetStore();
        this.remoteLookup = [];
        this.addValue(value);

    },
    /**
    * Sets the value of the SuperBoxSelect component, adding new items that don't exist in the data store if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name setValue
    * @param {Array} data An Array of item objects containing the {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField} properties.
    */
    setValueEx: function(data) {
        if (!this.rendered) {
            this.value = data;
            return;
        }
        this.removeAllItems().resetStore();

        if (!Ext.isArray(data)) {
            data = [data];
        }
        this.remoteLookup = [];

        if (this.allowAddNewData && this.mode === 'remote') { // no need to query
            Ext.each(data, function(d) {
                var r = this.findRecord(this.valueField, d[this.valueField]) || this.createRecord(d);
                this.addRecord(r);
            }, this);
            return;
        }

        Ext.each(data, function(item) {
            this.addItem(item);
        }, this);
    },
    /**
    * Returns true if the SuperBoxSelect component has a selected item with a value matching the 'val' parameter.
    * @methodOf Ext.ux.form.SuperBoxSelect
    * @name hasValue
    * @param {Mixed} val The value to test.
    * @return {Boolean} true if the component has the selected value, false otherwise.
    */
    hasValue: function(val) {
        var has = false;
        this.items.each(function(item) {
            if (item.value == val) {
                has = true;
                return false;
            }
        }, this);
        return has;
    },
    onSelect: function(record, index) {
        if (this.fireEvent('beforeselect', this, record, index) !== false) {
            var val = record.data[this.valueField];

            if (this.preventDuplicates && this.hasValue(val)) {
                return;
            }

            this.setRawValue('');
            this.lastSelectionText = '';

            if (this.fireEvent('beforeadditem', this, val, record, this.filteredQueryData) !== false) {
                this.addRecord(record);
            }
            if (this.store.getCount() === 0 || !this.multiSelectMode) {
                this.collapse();
            } else {
                this.restrictHeight();
            }
        }
    },
    onDestroy: function() {
        this.items.purgeListeners();
        this.killItems();
        if (this.allowQueryAll) {
            Ext.destroy(this.buttonExpand);
        }
        if (this.renderFieldBtns) {
            Ext.destroy(
                this.buttonClear,
                this.buttonWrap
            );
        }

        Ext.destroy(
            this.inputEl,
            this.wrapEl,
            this.outerWrapEl
        );

        Ext.ux.form.SuperBoxSelect.superclass.onDestroy.call(this);
    },
    autoSize: function() {
        if (!this.rendered) {
            return this;
        }
        if (!this.metrics) {
            this.metrics = Ext.util.TextMetrics.createInstance(this.el);
        }
        var el = this.el,
            v = el.dom.value,
            d = document.createElement('div');

        if (v === "" && this.emptyText && this.items.getCount() < 1) {
            v = this.emptyText;
        }
        d.appendChild(document.createTextNode(v));
        v = d.innerHTML;
        d = null;
        v += "&#160;";
        var w = Math.max(this.metrics.getWidth(v) + 24, 24);
        if (typeof this._width != 'undefined') {
            w = Math.min(this._width, w);
        }
        this.el.setWidth(w);

        if (Ext.isIE) {
            this.el.dom.style.top = '0';
        }
        this.fireEvent('autosize', this, w);
        return this;
    },
    shouldQuery: function(q) {
        if (this.lastQuery) {
            var m = q.match("^" + this.lastQuery);
            if (!m || this.store.getCount()) {
                return true;
            } else {
                return (m[0] !== this.lastQuery);
            }
        }
        return true;
    },
    doQuery: function(q, forceAll, valuesQuery, forcedAdd) {
        q = Ext.isEmpty(q) ? '' : q;
        if (this.queryFilterRe) {
            this.filteredQueryData = '';
            var m = q.match(this.queryFilterRe);
            if (m && m.length) {
                this.filteredQueryData = m[0];
            }
            q = q.replace(this.queryFilterRe, '');
            if (!q && m) {
                return;
            }
        }
        var qe = {
            query: q,
            forceAll: forceAll,
            combo: this,
            cancel: false
        };
        if (this.fireEvent('beforequery', qe) === false || qe.cancel) {
            return false;
        }
        q = qe.query;
        forceAll = qe.forceAll;
        if (forceAll === true || (q.length >= this.minChars) || valuesQuery && !Ext.isEmpty(q)) {
            if (forcedAdd || this.forceSameValueQuery || this.shouldQuery(q)) {
                this.lastQuery = q;
                if (this.mode == 'local') {
                    this.selectedIndex = -1;
                    if (forceAll) {
                        this.store.clearFilter();
                    } else {
                        this.store.filter(this.displayField, q);
                    }
                    this.onLoad();
                } else {

                    this.store.baseParams[this.queryParam] = q;
                    this.store.baseParams[this.queryValuesIndicator] = valuesQuery;
                    this.store.load({
                        params: this.getParams(q)
                    });
                    if (!forcedAdd) {
                        this.expand();
                    }
                }
            } else {
                this.selectedIndex = -1;
                this.onLoad();
            }
        }
    },
    onStoreLoad: function(store, records, options) {
        //accomodating for bug in Ext 3.0.0 where options.params are empty
        var q = options.params[this.queryParam] || store.baseParams[this.queryParam] || "",
            isValuesQuery = options.params[this.queryValuesIndicator] || store.baseParams[this.queryValuesIndicator];

        if (this.removeValuesFromStore) {
            this.store.each(function(record) {
                if (this.usedRecords.containsKey(record.get(this.valueField))) {
                    this.store.remove(record);
                }
            }, this);
        }
        //queried values
        if (isValuesQuery) {

            var params = q.split(this.queryValuesDelimiter);
            Ext.each(params, function(p) {
                this.remoteLookup.remove(p);
                var rec = this.findRecord(this.valueField, p);
                if (rec) {
                    this.addRecord(rec);
                }
            }, this);

            if (this.setOriginal) {
                this.setOriginal = false;
                this.originalValue = this.getValue();
            }
        }

        //queried display (autocomplete) & addItem
        if (q !== '' && this.allowAddNewData) {
            Ext.each(this.remoteLookup, function(r) {
                if (typeof r === "object" && r[this.valueField] === q) {
                    this.remoteLookup.remove(r);
                    if (records.length && records[0].get(this.valueField) === q) {
                        this.addRecord(records[0]);
                        return;
                    }
                    var rec = this.createRecord(r);
                    this.store.add(rec);
                    this.addRecord(rec);
                    this.addedRecords.push(rec); //keep track of records added to store
                    (function() {
                        if (this.isExpanded()) {
                            this.collapse();
                        }
                    }).defer(10, this);
                    return;
                }
            }, this);
        }

        var toAdd = [];
        if (q === '') {
            Ext.each(this.addedRecords, function(rec) {
                if (this.preventDuplicates && this.usedRecords.containsKey(rec.get(this.valueField))) {
                    return;
                }
                toAdd.push(rec);

            }, this);

        } else {
            var re = new RegExp(Ext.escapeRe(q) + '.*', 'i');
            Ext.each(this.addedRecords, function(rec) {
                if (this.preventDuplicates && this.usedRecords.containsKey(rec.get(this.valueField))) {
                    return;
                }
                if (re.test(rec.get(this.displayField))) {
                    toAdd.push(rec);
                }
            }, this);
        }
        this.store.add(toAdd);
        this.sortStore();

        if (this.store.getCount() === 0 && this.isExpanded()) {
            this.collapse();
        }

    }
});
Ext.reg('superboxselect', Ext.ux.form.SuperBoxSelect);
/*
* @private
*/
Ext.ux.form.SuperBoxSelectItem = function(config) {
    Ext.apply(this, config);
    Ext.ux.form.SuperBoxSelectItem.superclass.constructor.call(this);
};
/*
* @private
*/
Ext.ux.form.SuperBoxSelectItem = Ext.extend(Ext.ux.form.SuperBoxSelectItem, Ext.Component, {
    initComponent: function() {
        Ext.ux.form.SuperBoxSelectItem.superclass.initComponent.call(this);
    },
    onElClick: function(e) {
        var o = this.owner;
        o.clearCurrentFocus().collapse();
        if (o.navigateItemsWithTab) {
            this.focus();
        } else {
            o.el.dom.focus();
            var that = this;
            (function() {
                this.onLnkFocus();
                o.currentFocus = this;
            }).defer(10, this);
        }
    },

    onLnkClick: function(e) {
        if (e) {
            e.stopEvent();
        }
        this.preDestroy();
        if (!this.owner.navigateItemsWithTab) {
            this.owner.el.focus();
        }
    },
    onLnkFocus: function() {
        this.el.addClass("x-superboxselect-item-focus");
        this.owner.outerWrapEl.addClass("x-form-focus");
    },

    onLnkBlur: function() {
        this.el.removeClass("x-superboxselect-item-focus");
        this.owner.outerWrapEl.removeClass("x-form-focus");
    },

    enableElListeners: function() {
        this.el.on('click', this.onElClick, this, { stopEvent: true });

        this.el.addClassOnOver('x-superboxselect-item x-superboxselect-item-hover');
    },

    enableLnkListeners: function() {
        this.lnk.on({
            click: this.onLnkClick,
            focus: this.onLnkFocus,
            blur: this.onLnkBlur,
            scope: this
        });
    },

    enableAllListeners: function() {
        this.enableElListeners();
        this.enableLnkListeners();
    },
    disableAllListeners: function() {
        this.el.removeAllListeners();
        this.lnk.un('click', this.onLnkClick, this);
        this.lnk.un('focus', this.onLnkFocus, this);
        this.lnk.un('blur', this.onLnkBlur, this);
    },
    onRender: function(ct, position) {

        Ext.ux.form.SuperBoxSelectItem.superclass.onRender.call(this, ct, position);

        var el = this.el;
        if (el) {
            el.remove();
        }

        this.el = el = ct.createChild({ tag: 'li' }, ct.last());
        el.addClass('x-superboxselect-item');

        var btnEl = this.owner.navigateItemsWithTab ? (Ext.isSafari ? 'button' : 'a') : 'span';
        var itemKey = this.key;

        Ext.apply(el, {
            focus: function() {
                var c = this.down(btnEl + '.x-superboxselect-item-close');
                if (c) {
                    c.focus();
                }
            },
            preDestroy: function() {
                this.preDestroy();
            } .createDelegate(this)
        });

        this.enableElListeners();

        el.update(this.caption);

        var cfg = {
            tag: btnEl,
            'class': 'x-superboxselect-item-close',
            tabIndex: this.owner.navigateItemsWithTab ? '0' : '-1'
        };
        if (btnEl === 'a') {
            cfg.href = '#';
        }
        this.lnk = el.createChild(cfg);


        if (!this.disabled) {
            this.enableLnkListeners();
        } else {
            this.disableAllListeners();
        }

        this.on({
            disable: this.disableAllListeners,
            enable: this.enableAllListeners,
            scope: this
        });

        this.setupKeyMap();
    },
    setupKeyMap: function() {
        this.keyMap = new Ext.KeyMap(this.lnk, [
            {
                key: [
                    Ext.EventObject.BACKSPACE,
                    Ext.EventObject.DELETE,
                    Ext.EventObject.SPACE
                ],
                fn: this.preDestroy,
                scope: this
            }, {
                key: [
                    Ext.EventObject.RIGHT,
                    Ext.EventObject.DOWN
                ],
                fn: function() {
                    this.moveFocus('right');
                },
                scope: this
            },
            {
                key: [Ext.EventObject.LEFT, Ext.EventObject.UP],
                fn: function() {
                    this.moveFocus('left');
                },
                scope: this
            },
            {
                key: [Ext.EventObject.HOME],
                fn: function() {
                    var l = this.owner.items.get(0).el.focus();
                    if (l) {
                        l.el.focus();
                    }
                },
                scope: this
            },
            {
                key: [Ext.EventObject.END],
                fn: function() {
                    this.owner.el.focus();
                },
                scope: this
            },
            {
                key: Ext.EventObject.ENTER,
                fn: function() {
                }
            }
        ]);
        this.keyMap.stopEvent = true;
    },
    moveFocus: function(dir) {
        var el = this.el[dir == 'left' ? 'prev' : 'next']() || this.owner.el;
        el.focus.defer(100, el);
    },

    preDestroy: function(supressEffect) {
        if (this.fireEvent('remove', this) === false) {
            return;
        }
        var actionDestroy = function() {
            if (this.owner.navigateItemsWithTab) {
                this.moveFocus('right');
            }
            this.hidden.remove();
            this.hidden = null;
            this.destroy();
        };

        if (supressEffect) {
            actionDestroy.call(this);
        } else {
            this.el.hide({
                duration: 0.2,
                callback: actionDestroy,
                scope: this
            });
        }
        return this;
    },
    kill: function() {
        this.hidden.remove();
        this.hidden = null;
        this.purgeListeners();
        this.destroy();
    },
    onDisable: function() {
        if (this.hidden) {
            this.hidden.dom.setAttribute('disabled', 'disabled');
        }
        this.keyMap.disable();
        Ext.ux.form.SuperBoxSelectItem.superclass.onDisable.call(this);
    },
    onEnable: function() {
        if (this.hidden) {
            this.hidden.dom.removeAttribute('disabled');
        }
        this.keyMap.enable();
        Ext.ux.form.SuperBoxSelectItem.superclass.onEnable.call(this);
    },
    onDestroy: function() {
        Ext.destroy(
            this.lnk,
            this.el
        );
        Ext.ux.form.SuperBoxSelectItem.superclass.onDestroy.call(this);
    }
});

//------------------------Aim ExtJs user控件 开始------------------------//
var userselstore = new Ext.data.JsonStore({
    id: 'UserID',
    root: 'rows',
    fields: [{ name: 'UserID' }, { name: 'Name' }, { name: 'LoginName' }, { name: 'WorkNo' }, { name: 'Status'}, { name: 'DeptId'}, { name: 'DeptName'}],
    url: '/commonpages/data/userdata.aspx',
    baseParams: { cmd: 'GETUSERS' }
});
Ext.ux.form.AimUser = Ext.extend(Ext.ux.form.SuperBoxSelect, {
    store: userselstore,
    popUrl: null,
    bodyStyle: 'title:expression(this.innerText)',
    popParam: null,
    popStyle: null,
    popModel: "form",
    popAfter: null,
    seltype: null,
    allowAddNewData: true,
    addNewDataOnBlur: true,
    clearBtnCls: 'aimuser-btn-clear',
    expandBtnCls: 'aimuser-btn-expand',
    minChars: 1,
    anchor: '100%',
    mode: 'remote',
    displayField: 'Name',
    displayFieldTpl: '{Name}',
    valueField: 'UserID',
    queryDelay: 30,
    triggerAction: 'all',
    resizable: false,
    extParams: null,
    constructor: function(config) {
        this.popUrl = "/CommonPages/Select/UsrSelect/MUsrSelect.aspx?rtntype=array";
        this.seltype = config.seltype || "single";
        this.popUrl += "&seltype=" + this.seltype;
        this.popParam = config.popParam;
        this.popStyle = config.popStyle || "dialogWidth:750px; dialogHeight:550px; scroll:yes; center:yes; status:no; resizable:yes;";
        this.popModel = config.popModel || "form";
        this.popAfter = config.popAfter;
        this.popUrl = $.combineQueryUrl(this.popUrl, { "PopParam": this.popParam });
        if (this.popModel == "window") {
            this.popUrl = $.combineQueryUrl(this.popUrl, { "PopAfter": this.popAfter });
        }
        this.extParams = config.extParams;
        if (this.extParams && this.extParams.length > 0) {
            for (var i = 0; i < this.extParams.split(";").length; i++) {
                if (this.extParams.split(";")[i] && this.extParams.split(";")[i].length > 0) {
                    this.store.baseParams[this.extParams.split(";")[i].split(":")[0]] = this.extParams.split(";")[i].split(":")[1];
                }
            }
        }
        Ext.ux.form.AimUser.superclass.constructor.call(this, Ext.apply(config, {}));
        this.on("beforeadditem", function(bs, v) {
            if (bs.seltype == "single") {
                bs.reset();
                bs.addItem(v);
            }
            else {
                bs.addItem(v);
            }
        });
        this.on("additem", function(bs, v) {
            if (typeof (this.popAfter) == "function") {
                if (bs.seltype == "single")
                    this.popAfter.call(this, { data: this.getValueEx()[0] }, false);
                else
                    this.popAfter.call(this, { data: this.getValueEx() }, true);
            }
        });
    },
    onTriggerClick: function() {
        if (this.popModel.toLowerCase() == "window")
            OpenWin(this.popUrl, "_blank", CenterWin(this.popStyle));
        else {
            var rtnval = window.showModalDialog(this.popUrl, window, this.popStyle || "");
            if (typeof (this.popAfter) == "function") {
                //this.popAfter.call(this, rtnval);屏蔽掉,后面setValueEx,addItem会自动调用该方法
            } else if (typeof (this.popAfter) == "string" && this.popAfter != "") {
                eval(this.popAfter + "(rtns)");
            }
            if (rtnval && rtnval.data) {//默认更新控件上的值
                if (this.seltype == "single") {
                    try {
                        this.setValueEx([{ UserID: rtnval.data.UserID || rtnval.data[0].UserID, Name: rtnval.data.Name || rtnval.data[0].Name}]);
                    } catch (e) { }
                }
                else {
                    for (var i = 0; i < rtnval.data.length; i++) {
                        this.addItem({ UserID: rtnval.data[i].UserID, Name: rtnval.data[i].Name });
                    }
                }
            }
        }
    }
});

Ext.reg('aimuser', Ext.ux.form.AimUser);



Ext.form.FileUpload = Ext.extend(Ext.form.Field, {
    width: 200,
    height: 60,
    readOnly: false,
    disabled: false,
    mode: 'multi',
    IsLog: false,
    Filter: "",
    MaximumUpload: "",
    MaxNumberToUpload: "",
    AllowThumbnail: false,
    DoCheck: null,
    UploadPage: "/CommonPages/File/Upload.aspx",
    DownloadPage: "/CommonPages/File/DownLoad.aspx",
    eleSpan: null,
    fileLinkSpan: null,
    fileBtnSpan: null,
    BtnFileAddID: null,
    BtnFileClrID: null,
    BtnFileDelID: null,
    BtnFileOpnID: null,
    FileLinkSpanID: null,
    FileInputFieldID: null,
    FileBtnSpanID: null,
    UploadStyle: "dialogHeight:405px; dialogWidth:465px; help:0; resizable:0; status:0;scroll=0;",
    SingleFileBlock: null,
    FileBlock: null,
    SingleStructure: null,
    MultiStructure: null,
    constructor: function(config) {
        readOnly = config.readOnly || false;
        disabled = config.disabled || false;
        width = config.width || 200;
        height = config.height || 60;
        mode = config.mode || 'multi';
        IsLog = config.IsLog || "";
        Filter = config.Filter || "";
        DoCheck = config.DoCheck;
        BtnFileAddID = "btnFileAdd_" + config.id;
        BtnFileClrID = "btnFileClr_" + config.id;
        BtnFileDelID = "btnFileDel_" + config.id;
        BtnFileOpnID = "btnFileOpn_" + config.id;
        FileLinkSpanID = "spanFileLink_" + config.id;
        FileInputFieldID = "spanFileInput_" + config.id;
        FileBtnSpanID = "spanFileBtn_" + config.id;
        SingleFileBlock = "<div class='aim-ctrl-file-link' linkfile='{filefullname}' style='float:left; width:100%; border:0px;'><a href='javascript:void(0)' style='margin:5px;' title='{filename}' onclick=OpenWin('" + this.DownloadPage + "?Id={fileid}','_blank','width=1,height=1')>{filename}</a></div>";
        FileBlock = "<div class='aim-ctrl-file-link' linkfile='{filefullname}' style='float:left; width:120; height: 20; margin:2px; border:0px;'> <input type='checkbox'style='border:0px' /><a href='javascript:void(0)' style='margin:5px;' title='{filename}' onclick=OpenWin('" + this.DownloadPage + "?Id={fileid}','_blank','width=1,height=1')>{filename}</a></div>";
        SingleStructure = "<table style='border:0px; width:100%; font-size:12px;'><tr><td style='width:*; vertical-align:top; border-color:#8FAACF; padding:2px;' class='aim-ctrl-file'><span id='" + this.FileInputFieldID + "' style='width:100%' /></td><td style='width:100px; border:0px; padding:0px;' align='center'><span id='" + this.FileBtnSpanID + "' class='aim-ctrl-file-button-span'><a id='" + this.BtnFileAddID + "' class='aim-ctrl-file-button'>上传</a><a id='" + this.BtnFileClrID + "' class='aim-ctrl-file-button'>清空</a></span></td></tr></table>";
        MultiStructure = "<table style='border:0px; width:100%; font-size:12px;'><tr><td style='width:*; vertical-align:top; border-color:#8FAACF' class='aim-ctrl-file'><span id='" + this.FileLinkSpanID + "' style='width:100%;'></span></td><td style='width:50px; border:0px;' align='center'><span id='" + this.FileBtnSpanID + "' class='aim-ctrl-file-button-span'><a id='" + this.BtnFileAddID + "' class='aim-ctrl-file-button'>上传</a><br><br><a id='" + this.BtnFileDelID + "' class='aim-ctrl-file-button'>删除</a><br><br><a id='" + this.BtnFileClrID + "' class='aim-ctrl-file-button'>清空</a></span></td></tr></table>";
        Ext.form.FileUpload.superclass.constructor.call(this, Ext.apply(config, {
    }));
},
onRender: function(ct, position) {
    Ext.form.FileUpload.superclass.onRender.call(this, ct, position);
    this.BtnFileAddID = "btnFileAdd_" + this.id;
    this.BtnFileClrID = "btnFileClr_" + this.id;
    this.BtnFileDelID = "btnFileDel_" + this.id;
    this.BtnFileOpnID = "btnFileOpn_" + this.id;
    this.FileLinkSpanID = "spanFileLink_" + this.id;
    this.FileInputFieldID = "spanFileInput_" + this.id;
    this.FileBtnSpanID = "spanFileBtn_" + this.id;
    this.SingleFileBlock = "<div class='aim-ctrl-file-link' linkfile='{filefullname}' style='float:left; width:100%; border:0px;'><a href='javascript:void(0)' style='margin:5px;' title='{filename}' onclick=OpenWin('" + this.DownloadPage + "?Id={fileid}','_blank','width=1,height=1')>{filename}</a></div>";
    this.FileBlock = "<div class='aim-ctrl-file-link' linkfile='{filefullname}' style='float:left; width:120; height: 20; margin:2px; border:0px;'> <input type='checkbox'style='border:0px' /><a href='javascript:void(0)' style='margin:5px;' title='{filename}' onclick=OpenWin('" + this.DownloadPage + "?Id={fileid}','_blank','width=1,height=1')>{filename}</a></div>";
    this.SingleStructure = "<table style='border:0px; width:100%; font-size:12px;'><tr><td style='width:*; vertical-align:top; border-color:#8FAACF; padding:2px;' class='aim-ctrl-file'><span id='" + this.FileInputFieldID + "' style='width:100%' /></td><td style='width:100px; border:0px; padding:0px;' align='center'><span id='" + this.FileBtnSpanID + "' class='aim-ctrl-file-button-span'><a id='" + this.BtnFileAddID + "' class='aim-ctrl-file-button'>上传</a><a id='" + this.BtnFileClrID + "' class='aim-ctrl-file-button'>清空</a></span></td></tr></table>";
    this.MultiStructure = "<table style='border:0px; width:100%; font-size:12px;'><tr><td style='width:*; vertical-align:top; border-color:#8FAACF' class='aim-ctrl-file'><span id='" + this.FileLinkSpanID + "' style='width:100%;'></span></td><td style='width:50px; border:0px;' align='center'><span id='" + this.FileBtnSpanID + "' class='aim-ctrl-file-button-span'><a id='" + this.BtnFileAddID + "' class='aim-ctrl-file-button'>上传</a><br><br><a id='" + this.BtnFileDelID + "' class='aim-ctrl-file-button'>删除</a><br><br><a id='" + this.BtnFileClrID + "' class='aim-ctrl-file-button'>清空</a></span></td></tr></table>";
    this.eleSpan = this.el.wrap({ cls: 'x-form-field-wrap', style: 'border:1px solid gray' });
    this.eleSpan.setStyle("width", this.width);
    this.eleSpan.setStyle("height", this.height);
    /*if (!this.eleSpan.getStyle("height") || this.eleSpan.getStyle("height") == "auto") {
    if (this.mode != "single") {
    this.eleSpan.setStyle("height", 100);
    }
    this.eleSpan.setStyle("width", this.width);
    }*/
    //this.el = this.eleSpan.createChild({ tag: 'input', type: 'text', style: 'display:none', id: this.id || Ext.id() });
    this.el.setStyle("display", "none");
    var structure;
    if (this.mode == "single") {
        structure = this.eleSpan.createChild({ style: 'float:left;border:0px;height:100% ;width:100%; font-size:12px;' });
        var span = structure.createChild({ id: this.FileInputFieldID, style: 'width:100%' });
        span = span.createChild({ id: this.FileBtnSpanID, cls: 'aim-ctrl-file-button-span' });
        span.createChild({ tag: 'button', text: '上传', id: this.BtnFileAddID });
        span.createChild({ tag: 'button', text: '清空', id: this.BtnFileClrID });
    } else {
        var span = this.eleSpan.createChild({ id: this.FileLinkSpanID, style: 'float;left; vertical-align:top;', cls: 'aim-ctrl-file' })
        span.setStyle("float", "left");
        span.setStyle("height", parseInt(this.eleSpan.getStyle("height"), 10) - 2);
        span.setStyle("width", parseInt(this.eleSpan.getStyle("width"), 10) - 30);
        span = this.eleSpan.createChild({ style: 'float;left', id: this.FileBtnSpanID, cls: 'aim-ctrl-file-button-span' })
        //span.createChild({ tag: 'button', value: '上传', id: this.BtnFileAddID, cls: 'x-btn-icon', iconCls: 'icon-add' });
        new Ext.Button({ iconCls: 'aim-icon-add', renderTo: span, id: this.BtnFileAddID, tooltip: '上传' });
        span.createChild({ tag: 'br' }); //span.createChild({ tag: 'br' });
        new Ext.Button({ iconCls: 'aim-icon-delete', renderTo: span, id: this.BtnFileDelID, tooltip: '删除选中' });
        //span.createChild({ tag: 'button', value: '删除', id: this.BtnFileDelID, iconCls: 'icon-delete' });
        span.createChild({ tag: 'br' }); //span.createChild({ tag: 'br' });
        new Ext.Button({ iconCls: 'aim-icon-cancel', renderTo: span, id: this.BtnFileClrID, tooltip: '清空' });
        //span.createChild({ tag: 'button', value: '清空', id: this.BtnFileClrID, iconCls: 'icon-clear' });
    }

    this.fileLinkSpan = Ext.get(this.FileLinkSpanID);
    //this.fileLinkSpan.setStyle("height", parseInt(this.eleSpan.getStyle("height"),10) + 20);
    this.fileLinkSpan.setStyle("overflow-y", "auto");
    this.fileInputField = Ext.get(this.FileInputFieldID);
    this.fileBtnSpan = Ext.get(this.FileBtnSpanID);
    this.btnFileAdd = Ext.get(this.BtnFileAddID);
    this.btnFileDel = Ext.get(this.BtnFileDelID);
    this.btnFileClr = Ext.get(this.BtnFileClrID);

    this.btnFileAdd.on("click", function() {
        var uploadurl = this.getUploadUrl();
        var rtn = window.showModalDialog(uploadurl, window, this.UploadStyle);
        if (rtn) {
            if (this.mode == "single") {
                this.el.setValue(rtn);
            } else {
                //                this.el.setValue(this.el.getValue() + rtn);
                this.el.dom.value = (this.el.getValue() + rtn);
            }

            this.refreshFileView();
        }
    }, this);

    this.btnFileDel.on("click", function() {
        var Ctrl = this;
        $.each($("#" + Ctrl.fileLinkSpan.dom.id).find("input[type='checkbox']"), function() {
            if (this.checked) {
                var ffname = $(this.parentNode).attr("linkfile");
                Ctrl.removeFile(ffname);
            }
        });
    }, this);

    this.btnFileClr.on("click", function() {
        this.setValue('');
        this.clearFileView();
    }, this);

    /*this.btnFileOpn.on("click", function() {
    if (this.el.getValue()) {
    var tflid = this.el.getValue().substring(0, this.el.getValue().indexOf("_"));
    OpenWin(DownloadPage + '?Id=' + tflid, '_blank', 'width=1,height=1');
    }
    });*/

    this.el.on("change", function() {
        this.refreshFileView();
    }, this);
    this.refreshFileView();
    if (this.readOnly) {
        this.setReadOnly(this.readOnly);
    } else if (this.disabled) {
        this.setDisabled(this.disabled);
    }
},
refreshFileView: function() {
    var ctrl = this;
    this.clearFileView();
    var fileval = this.el.getValue();
    if (!fileval) return;
    if (this.mode == "single") {
        fileval = fileval.trimEnd(',');
        var tflname = fileval.substring(fileval.indexOf("_") + 1);
        var tflid = fileval.substring(0, fileval.indexOf("_"));
        var linkFile = $(ctrl.SingleFileBlock.replace(/{filefullname}/g, fileval).replace(/{filename}/g, tflname).replace(/{fileid}/g, tflid));
        this.fileInputField.el.dom.outHTML = linkFile;
    } else {
        var fileVals = fileval.split(",");
        $.each(fileVals, function() {
            if (this != "") {
                var tflname = this.substring(this.indexOf("_") + 1).replace(/%2B/g, ' ');
                var tflid = this.substring(0, this.indexOf("_"));
                var linkFile = $(ctrl.FileBlock.replace(/{filefullname}/g, this).replace(/{filename}/g, tflname).replace(/{fileid}/g, tflid));
                if (this.readOnly || this.disabled) {
                    linkFile.find("input").css("display", "none");
                }
                if (mode == "single") {
                    linkFile.css("display", "none");
                }
                ctrl.fileLinkSpan.appendChild(linkFile[0]);
            }
        }
            );
    }
},
removeFile: function(filefullname) {
    var fstr = filefullname + ","
    var val = this.el.getValue().replace(fstr, "");
    $("#" + this.fileLinkSpan.dom.id).find("[linkfile=" + filefullname + "]").remove();
    this.setValue(val);
},
clearFileView: function() {
    if (this.mode == "single") {
        this.fileInputField.dom.innerHTML = "";
    } else {
        this.fileLinkSpan.dom.innerHTML = "";
        //this.fileLinkSpan.find(".aim-ctrl-file-link").remove();
    }
},
getValue: function() {
    return this.el.getValue();
},
setValue: function(val) {
    if (val != null && val != "null") {
        this.el.dom.value = val;
        this.refreshFileView();
    }
},
setReadOnly: function(bool) {
    this.readOnly = bool;
    if (bool) {
        this.eleSpan.find("input").attr("readonly", true);
        this.fileBtnSpan.css("visibility", "hidden");
    } else {
        this.eleSpan.find("input").attr("readonly", false);
        this.fileBtnSpan.css("visibility", "visible");
    }
},
setDisabled: function(bool) {
    if (bool) {
        $("#" + this.eleSpan.dom.id).find("input").attr("disabled", true);
        this.fileBtnSpan.setStyle("visibility", "hidden");
    } else {
        $("#" + this.eleSpan.dom.id).find("input").attr("disabled", false);
        this.fileBtnSpan.setStyle("visibility", "visible");
    }
},
getUploadUrl: function() {
    var qrystr = "&IsLog=" + this.IsLog + "&Filter=" + escape(this.Filter)
            + "&MaximumUpload=" + this.MaximumUpload + "&MaxNumberToUpload=" + this.MaxNumberToUpload
            + "&AllowThumbnail=" + this.AllowThumbnail;

    if (mode == "single") {
        qrystr += "&IsSingle=true";
    }

    if (this.DoCheck) {
        qrystr += "&DoCheck=" + this.DoCheck;
    }

    var uploadurl = this.UploadPage + "?" + qrystr;
    return uploadurl;
},
getRawValue: function() {
    return this.getValue();
},
setRawValue: function(value) {
    this.setValue(value);
}
});
Ext.reg('fileupload', Ext.form.FileUpload);
//------------------------Aim ExtJs user控件 结束------------------------//
//------------------------Aim ExtJs 表单扩展 结束------------------------//


//------------------------Aim ExtJs 拖动扩展 开始------------------------//



//------------------------Aim ExtJs 拖动扩展 结束------------------------//

