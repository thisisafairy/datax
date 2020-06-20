
Ext.ns('Ext.ux.grid');

Ext.ux.grid.GridSummary = function(config) {
    Ext.apply(this, config);
};

Ext.extend(Ext.ux.grid.GridSummary, Ext.util.Observable, {
    init: function(grid) {
        this.grid = grid;
        this.cm = grid.getColumnModel();
        this.view = grid.getView();
        var v = this.view;
        debugger;
        v.onLayout = this.onLayout; // override GridView's onLayout() method

        v.afterMethod('render', this.refreshSummary, this);
        v.afterMethod('refresh', this.refreshSummary, this);
        v.afterMethod('setSumValue', this.test, this);
        v.afterMethod('syncScroll', this.syncSummaryScroll, this);
        v.afterMethod('onColumnWidthUpdated', this.doWidth, this);
        v.afterMethod('onAllColumnWidthsUpdated', this.doAllWidths, this);
        v.afterMethod('onColumnHiddenUpdated', this.doHidden, this);
        v.afterMethod('onUpdate', this.refreshSummary, this);
        v.afterMethod('onRemove', this.refreshSummary, this);

        // update summary row on store's add / remove / clear events
        grid.store.on('add', this.refreshSummary, this);
        grid.store.on('remove', this.refreshSummary, this);
        grid.store.on('clear', this.refreshSummary, this);

        if (!this.rowTpl) {
            this.rowTpl = new Ext.Template(
        '<div class="x-grid3-summary-row x-grid3-gridsummary-row-offset">',
          '<table class="x-grid3-summary-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
            '<tbody><tr>{cells}</tr></tbody>',
          '</table>',
        '</div>'
      );
            this.rowTpl.disableFormats = true;
        }
        this.rowTpl.compile();

        if (!this.cellTpl) {
            this.cellTpl = new Ext.Template(
        '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} {css}" style="{style}">',
          '<div class="x-grid3-cell-inner x-grid3-col-{id}" unselectable="on">{value}</div>',
        "</td>"
      );
            this.cellTpl.disableFormats = true;
        }
        this.cellTpl.compile();
    },

    calculate: function(rs, cs) {
        var data = {}, r, c, cfg = this.cm.config, cf;
        for (var i = 0, len = cs.length; i < len; i++) {
            c = cs[i];
            cf = cfg[i];
            data[c.name] = 0;
            for (var j = 0, jlen = rs.length; j < jlen; j++) {
                r = rs[j];
                if (cf && cf.summaryType) {
                    data[c.name] = Ext.ux.grid.GridSummary.Calculations[cf.summaryType](data[c.name] || 0, r, c.name, data);
                }
            }
        }

        return data;
    },

    onLayout: function(vw, vh) {
        if ('number' != Ext.type(vh)) { // prevent onLayout from choking when height:'auto'
            return;
        }
        // note: this method is scoped to the GridView
        if (!this.grid.getGridEl().hasClass('x-grid-hide-gridsummary')) {
            // readjust gridview's height only if grid summary row is visible
            this.scroller.setHeight(vh - this.summary.getHeight());
        }
    },

    syncSummaryScroll: function() {
        var mb = this.view.scroller.dom;
        this.view.summaryWrap.dom.scrollLeft = mb.scrollLeft;
        this.view.summaryWrap.dom.scrollLeft = mb.scrollLeft; // second time for IE (1/2 time first fails, other browsers ignore)
    },

    doWidth: function(col, w, tw) {
        var s = this.view.summary.dom;
        s.firstChild.style.width = tw;
        s.firstChild.rows[0].childNodes[col].style.width = w;
    },

    doAllWidths: function(ws, tw) {
        var s = this.view.summary.dom, wlen = ws.length;
        s.firstChild.style.width = tw;
        cells = s.firstChild.rows[0].childNodes;
        for (var j = 0; j < wlen; j++) {
            cells[j].style.width = ws[j];
        }
    },

    doHidden: function(col, hidden, tw) {
        var s = this.view.summary.dom;
        var display = hidden ? 'none' : '';
        s.firstChild.style.width = tw;
        s.firstChild.rows[0].childNodes[col].style.display = display;
    },
    putSumInfo: null,
    setSumValue: function(jsonV) {
        var cs = this.view.getColumnData();
        var buf = [], c, p = {}, last = cs.length - 1;

        for (var i = 0, len = cs.length; i < len; i++) {
            c = cs[i];
            p.id = c.id;
            p.style = c.style;
            p.css = i == 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
            if (jsonV && jsonV[c.name]) {
                p.value = jsonV[c.name];
            } else {
                p.value = '';
            }
            if (p.value == undefined || p.value === "") p.value = " ";
            buf[buf.length] = this.cellTpl.apply(p);
        }

        if (!this.view.summaryWrap) {
            this.view.summaryWrap = Ext.DomHelper.insertAfter(this.view.scroller, {
                tag: 'div',
                cls: 'x-grid3-gridsummary-row-inner'
            }, true);
        } else {
            this.view.summary.remove();
        }
        this.putSumInfo = this.rowTpl.apply({
            tstyle: 'width:' + this.view.getTotalWidth() + ';',
            cells: buf.join('')
        });
        this.view.summary = this.view.summaryWrap.insertHtml('afterbegin', this.putSumInfo, true);
    },
    refreshSumValue: function() {
        if (!this.view.summaryWrap) {
            this.view.summaryWrap = Ext.DomHelper.insertAfter(this.view.scroller, {
                tag: 'div',
                cls: 'x-grid3-gridsummary-row-inner'
            }, true);
        } else {
            this.view.summary.remove();
        }
        this.view.summary = this.view.summaryWrap.insertHtml('afterbegin', this.putSumInfo, true);
    },
    renderSummary: function(o, cs) {
        cs = cs || this.view.getColumnData();
        var cfg = this.cm.config;
        var buf = [], c, p = {}, cf, last = cs.length - 1;

        for (var i = 0, len = cs.length; i < len; i++) {
            c = cs[i];
            cf = cfg[i];
            p.id = c.id;
            p.style = c.style;
            p.css = i == 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
            if (cf.summaryType || cf.summaryRenderer) {
                p.value = (cf.summaryRenderer || c.renderer)(o.data[c.name], p, o);
            } else {
                p.value = '';
            }
            if (p.value == undefined || p.value === "") p.value = "&#160;";
            buf[buf.length] = this.cellTpl.apply(p);
        }

        return this.rowTpl.apply({
            tstyle: 'width:' + this.view.getTotalWidth() + ';',
            cells: buf.join('')
        });
    },

    refreshSummary: function() {
        if (this.putSumInfo) {
            //alert(this.putSumInfo);
            this.refreshSumValue(this.putSumInfo);
            return;
        }
        var g = this.grid, ds = g.store;
        var cs = this.view.getColumnData();
        var rs = ds.getRange();
        var data = this.calculate(rs, cs);
        var buf = this.renderSummary({ data: data }, cs);

        if (!this.view.summaryWrap) {
            this.view.summaryWrap = Ext.DomHelper.insertAfter(this.view.scroller, {
                tag: 'div',
                cls: 'x-grid3-gridsummary-row-inner'
            }, true);
        } else {
            this.view.summary.remove();
        }
        this.view.summary = this.view.summaryWrap.insertHtml('afterbegin', buf, true);
    },

    toggleSummary: function(visible) { // true to display summary row
        var el = this.grid.getGridEl();
        if (el) {
            if (visible === undefined) {
                visible = el.hasClass('x-grid-hide-gridsummary');
            }
            el[visible ? 'removeClass' : 'addClass']('x-grid-hide-gridsummary');

            this.view.layout(); // readjust gridview height
        }
    },

    getSummaryNode: function() {
        return this.view.summary
    }
});

Ext.ux.grid.GridSummary.Calculations = {
    'sum': function(v, record, field) {
        return v + Ext.num(record.data[field], 0);
    },

    'count': function(v, record, field, data) {
        return data[field + 'count'] ? ++data[field + 'count'] : (data[field + 'count'] = 1);
    },

    'max': function(v, record, field, data) {
        var v = record.data[field];
        var max = data[field + 'max'] === undefined ? (data[field + 'max'] = v) : data[field + 'max'];
        return v > max ? (data[field + 'max'] = v) : max;
    },

    'min': function(v, record, field, data) {
        var v = record.data[field];
        var min = data[field + 'min'] === undefined ? (data[field + 'min'] = v) : data[field + 'min'];
        return v < min ? (data[field + 'min'] = v) : min;
    },

    'average': function(v, record, field, data) {
        var c = data[field + 'count'] ? ++data[field + 'count'] : (data[field + 'count'] = 1);
        var t = (data[field + 'total'] = ((data[field + 'total'] || 0) + (record.data[field] || 0)));
        return t === 0 ? 0 : Math.round(t / c);
    }
}


/**
* @class Ext.grid.RadioboxSelectionModel
* @extends Ext.grid.RowSelectionModel
* A custom selection model that renders a column of checkboxes that can be toggled to select or deselect rows.
* @constructor
* @param {Object} config The configuration options
*/
Ext.grid.SingleSelectionModel = Ext.extend(Ext.grid.RowSelectionModel, {
    //header: '<div class="x-grid3-hd-radio">&#160;</div>',
    header: null,
    singleSelect: true,
    width: 20,
    sortable: false,
    menuDisabled: true,
    fixed: true,
    dataIndex: '',
    id: 'checker',

    // private
    initEvents: function() {
        Ext.grid.SingleSelectionModel.superclass.initEvents.call(this);
        this.grid.on('render', function() {
            var view = this.grid.getView();
            view.mainBody.on('mousedown', this.onMouseDown, this);
        }, this);
    },

    // private
    onMouseDown: function(e, t) {
        if (e.button === 0 && t.className == 'x-grid3-row-radio') { // Only fire if left-click
            e.stopEvent();
            var row = e.getTarget('.x-grid3-row');
            if (row) {
                var index = row.rowIndex;
                if (this.isSelected(index)) {
                    this.deselectRow(index);
                } else {
                    this.selectRow(index, true);
                }
            }
        }
    },

    // private
    renderer: function(v, p, record) {
        return '<div class="x-grid3-row-radio">&#160;</div>';
    }
});


Ext.grid.MultiSelectionModel = Ext.extend(Ext.grid.CheckboxSelectionModel, {
    singleSelect: false,
    width: 20,
    sortable: false,
    menuDisabled: true,
    fixed: true,
    dataIndex: '',
    id: 'checker',

    // private
    handleMouseDown: function(e, t) {
        if (e.button !== 0 || this.isLocked()) {
            return;
        }
        var view = this.grid.getView();
        if (e.shiftKey && !this.singleSelect && this.last !== false) {
            var last = this.last;
            this.selectRange(last, rowIndex, e.ctrlKey);
            this.last = last; // reset the last   
            view.focusRow(rowIndex);
        } else {
            var isSelected = this.isSelected(rowIndex);
            if (isSelected) {
                this.deselectRow(rowIndex);
            } else if (!isSelected || this.getCount() > 1) {
                this.selectRow(rowIndex, true);
                view.focusRow(rowIndex);
            }
        }
    }
});

/// <reference path='../../../common/vswd-ext.js' />

//
EXT_EXCEL_STYLE_XML = '<ss:Styles>' +
                '<ss:Style ss:ID="Default">' +
                    '<ss:Alignment ss:Vertical="Top" ss:WrapText="1" />' +
                    '<ss:Font ss:FontName="arial" ss:Size="10" />' +
                    '<ss:Borders>' +
                        '<ss:Border ss:Color="#e4e4e4" ss:Weight="1" ss:LineStyle="Continuous" ss:Position="Top" />' +
                        '<ss:Border ss:Color="#e4e4e4" ss:Weight="1" ss:LineStyle="Continuous" ss:Position="Bottom" />' +
                        '<ss:Border ss:Color="#e4e4e4" ss:Weight="1" ss:LineStyle="Continuous" ss:Position="Left" />' +
                        '<ss:Border ss:Color="#e4e4e4" ss:Weight="1" ss:LineStyle="Continuous" ss:Position="Right" />' +
                    '</ss:Borders>' +
                    '<ss:Interior />' +
                    '<ss:NumberFormat />' +
                    '<ss:Protection />' +
                '</ss:Style>' +
                '<ss:Style ss:ID="title">' +
                    '<ss:Borders />' +
                    '<ss:Font />' +
                    '<ss:Alignment ss:WrapText="1" ss:Vertical="Center" ss:Horizontal="Center" />' +
                    '<ss:NumberFormat ss:Format="@" />' +
                '</ss:Style>' +
                '<ss:Style ss:ID="headercell">' +
                    '<ss:Font ss:Bold="1" ss:Size="10" />' +
                    '<ss:Alignment ss:WrapText="1" ss:Horizontal="Center" />' +
                    '<ss:Interior ss:Pattern="Solid" ss:Color="#A3C9F1" />' +
                '</ss:Style>' +
                '<ss:Style ss:ID="even">' +
                    '<ss:Interior ss:Pattern="Solid" ss:Color="#CCFFFF" />' +
                '</ss:Style>' +
                '<ss:Style ss:Parent="even" ss:ID="evendate">' +
//                    '<ss:NumberFormat ss:Format="[ENG][$-409]dd\-mmm\-yyyy;@" />' +
                    '<ss:NumberFormat ss:Format="yyyy\-m\-d;@" />' +
                '</ss:Style>' +
                '<ss:Style ss:Parent="even" ss:ID="evenint">' +
                    '<ss:NumberFormat ss:Format="0" />' +
                '</ss:Style>' +
                '<ss:Style ss:Parent="even" ss:ID="evenfloat">' +
                    '<ss:NumberFormat ss:Format="0.00" />' +
                '</ss:Style>' +
                '<ss:Style ss:ID="odd">' +
                    '<ss:Interior ss:Pattern="Solid" ss:Color="#CCCCFF" />' +
                '</ss:Style>' +
                '<ss:Style ss:Parent="odd" ss:ID="odddate">' +
                    '<ss:NumberFormat ss:Format="[ENG][$-409]dd\-mmm\-yyyy;@" />' +
                '</ss:Style>' +
                '<ss:Style ss:Parent="odd" ss:ID="oddint">' +
                    '<ss:NumberFormat ss:Format="0" />' +
                '</ss:Style>' +
                '<ss:Style ss:Parent="odd" ss:ID="oddfloat">' +
                    '<ss:NumberFormat ss:Format="0.00" />' +
                '</ss:Style>' +
            '</ss:Styles>';


/*
* allows for downloading of grid data (store) directly into excel
* Method: extracts data of gridPanel store, uses columnModel to construct XML excel document,
* converts to Base64, then loads everything into a data URL link.
*
* @author        Animal        <extjs support team>
*
*/

Ext.override(Ext.data.Store, {
    getExcelXml: function(includeHidden, config) {
        var worksheet = this.createWorksheet(includeHidden, config);
        var totalWidth = this.getTotalWidth();
        var innertitle = '';

        if (config && config.title) {
            innertitle = config.title;
        }

        return '<xml version="1.0" encoding="utf-8">' +
            '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:o="urn:schemas-microsoft-com:office:office">' +
            '<o:DocumentProperties><o:Title>' + innertitle + '</o:Title></o:DocumentProperties>' +
            '<ss:ExcelWorkbook>' +
                '<ss:WindowHeight>' + worksheet.height + '</ss:WindowHeight>' +
                '<ss:WindowWidth>' + worksheet.width + '</ss:WindowWidth>' +
                '<ss:ProtectStructure>False</ss:ProtectStructure>' +
                '<ss:ProtectWindows>False</ss:ProtectWindows>' +
            '</ss:ExcelWorkbook>' +
            this.getExcelStyleXml() + worksheet.xml +
            '</ss:Workbook>';
    },

    getTotalWidth: function(includeHidden) {
        return;
    },

    getExcelStyleXml: function() {
        return EXT_EXCEL_STYLE_XML;
    },

    createWorksheet: function(includeHidden, config) {
        var DefaultColumnWidth = 100;
        var postfix = this.batchKey.replace(/-/g, '_');
        var WorksheetName = "";
        var PrintTitlesName = "PrintTitles_" + postfix;

        // Calculate cell data types and extra class names which affect formatting
        var cellType = [];
        var cellTypeClass = [];
        // var cm = this.getColumnModel();
        var totalWidthInPixels = 0;
        var colXml = '';
        var headerXml = '';
        var visibleColumnCountReduction = 0;
        var innertitle = '';
        var innerstore = null;

        if (config && config.title) {
            innertitle = config.title;
        }

        if (!innertitle || innertitle == '') {
            innertitle = '';
        }

        WorksheetName = innertitle;
        var flds = this.recordType.prototype.fields || [];

        for (var i = 0; i < flds.length; i++) {
            var fld = flds.get(i);
            if (!fld) continue;

            if (includeHidden || !fld.hidden) {
                var w = fld.width || DefaultColumnWidth;
                totalWidthInPixels += w;

                if (fld.header === "") {
                    cellType.push("None");
                    cellTypeClass.push("");
                    ++visibleColumnCountReduction;
                }
                else {
                    colXml += '<ss:Column ss:AutoFitWidth="1" ss:Width="' + w + '" />';
                    headerXml += '<ss:Cell ss:StyleID="headercell">' +
                        '<ss:Data ss:Type="String">' + (fld.header || fld.name) + '</ss:Data>' +
                        '<ss:NamedCell ss:Name="' + PrintTitlesName + '" /></ss:Cell>';

                    switch (fld.type) {
                        case "int":
                            cellType.push("Number");
                            cellTypeClass.push("int");
                            break;
                        case "float":
                            cellType.push("Number");
                            cellTypeClass.push("float");
                            break;
                        case "bool":
                        case "boolean":
                            cellType.push("String");
                            cellTypeClass.push("");
                            break;
                        case "date":
                            cellType.push("DateTime");
                            cellTypeClass.push("date");
                            break;
                        default:
                            cellType.push("String");
                            cellTypeClass.push("");
                            break;
                    }
                }
            }
        }
        var visibleColumnCount = cellType.length - visibleColumnCountReduction;

        var result = {
            height: 9000,
            width: Math.floor(totalWidthInPixels * 30) + 50
        };

        // Generate worksheet header details.
        var t = '<ss:Worksheet ss:Name="' + WorksheetName + '">' +
            '<ss:Names>' +
                '<ss:NamedRange ss:Name="' + PrintTitlesName + '" ss:RefersTo="=\'' + WorksheetName + '\'!R1:R2" />' +
            '</ss:Names>' +
            '<ss:Table x:FullRows="1" x:FullColumns="1"' +
                ' ss:ExpandedColumnCount="' + (visibleColumnCount) +
                '" ss:ExpandedRowCount="' + (this.getCount() + 2) + '">' +
                colXml +
                '<ss:Row ss:Height="38">' +
                    '<ss:Cell ss:StyleID="title" ss:MergeAcross="' + (visibleColumnCount - 1) + '">' +
                      '<ss:Data xmlns:html="http://www.w3.org/TR/REC-html40" ss:Type="String">' +
                        '<html:B>' + innertitle + '</html:B></ss:Data><ss:NamedCell ss:Name="' + PrintTitlesName + '" />' +
                    '</ss:Cell>' +
                '</ss:Row>' +
                '<ss:Row ss:AutoFitHeight="1">' +
                headerXml +
                '</ss:Row>';

        // Generate the data rows from the data in the Store
        for (var i = 0, it = this.data.items, l = it.length; i < l; i++) {
            t += '<ss:Row>';
            var cellClass = (i & 1) ? 'odd' : 'even';
            r = it[i].data;
            var k = 0;
            for (var j = 0; j < flds.length; j++) {
                var fld = flds.get(j);

                if (includeHidden || !fld.hidden) {
                    var v = r[fld.name];
                    if (typeof fld.renderer == 'function' && cellType[k] != 'DateTime') {
                        var m = {};
                        v = fld.renderer(v, m, it[i], i, j, this);
                        var re = /<[^>]+>/g;
                        if (v) {
                            v = v.toString().replace(re, '');
                        } else {
                            v = '';
                        }
                    }
                    if (cellType[k] !== "None") {

                        if (!v) {
                            t += '<ss:Cell ss:StyleID="' + cellClass + '"></ss:Cell>';
                        } else {
                            t += '<ss:Cell ss:StyleID="' + cellClass + cellTypeClass[k] + '"><ss:Data ss:Type="' + cellType[k] + '">';
                            if (cellType[k] == 'DateTime') {
                                t += v.format('Y-m-d\\TH:i:s.000'); // no space betwen  i: s
                            } else {
                                v = EncodeValue(v);

                                t += v;
                            }
                            t += '</ss:Data></ss:Cell>';
                        }
                    }
                    k++;
                }
            }
            t += '</ss:Row>';
        }

        result.xml = t + '</ss:Table>' +
            '<x:WorksheetOptions>' +
                '<x:PageSetup>' +
                    '<x:Layout x:CenterHorizontal="1" x:Orientation="Landscape" />' +
                    '<x:Footer x:Data="Page &amp;P of &amp;N" x:Margin="0.5" />' +
                    '<x:PageMargins x:Top="0.5" x:Right="0.5" x:Left="0.5" x:Bottom="0.8" />' +
                '</x:PageSetup>' +
                '<x:FitToPage />' +
                '<x:Print>' +
                    '<x:PrintErrors>Blank</x:PrintErrors>' +
                    '<x:FitWidth>1</x:FitWidth>' +
                    '<x:FitHeight>32767</x:FitHeight>' +
                    '<x:ValidPrinterInfo />' +
                    '<x:VerticalResolution>600</x:VerticalResolution>' +
                '</x:Print>' +
                '<x:Selected />' +
                '<x:DoNotDisplayGridlines />' +
                '<x:ProtectObjects>False</x:ProtectObjects>' +
                '<x:ProtectScenarios>False</x:ProtectScenarios>' +
            '</x:WorksheetOptions>' +
        '</ss:Worksheet>';

        //Add function to encode value,2009-4-21
        function EncodeValue(v) {
            var re = /[\r|\n]/g; //Handler enter key
            v = v.toString().replace(re, '&#10;');

            return v;
        };

        return result;
    }
});


/*
* allows for downloading of grid data (store) directly into excel
* Method: extracts data of gridPanel store, uses columnModel to construct XML excel document,
* converts to Base64, then loads everything into a data URL link.
*
* @author        Animal        <extjs support team>
*
*/

Ext.override(Ext.grid.GridPanel, {
    getExcelXml: function(includeHidden, config) {
        var worksheet = this.createWorksheet(includeHidden, config);
        var totalWidth = this.getColumnModel().getTotalWidth(includeHidden);
        var innertitle = '';

        if (config && config.title) {
            innertitle = config.title;
        } else {
            innertitle = this.title;
        }

        return '<xml version="1.0" encoding="utf-8">' +
            '<ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:o="urn:schemas-microsoft-com:office:office">' +
            '<o:DocumentProperties><o:Title>' + innertitle + '</o:Title></o:DocumentProperties>' +
            '<ss:ExcelWorkbook>' +
                '<ss:WindowHeight>' + worksheet.height + '</ss:WindowHeight>' +
                '<ss:WindowWidth>' + worksheet.width + '</ss:WindowWidth>' +
                '<ss:ProtectStructure>False</ss:ProtectStructure>' +
                '<ss:ProtectWindows>False</ss:ProtectWindows>' +
            '</ss:ExcelWorkbook>' +
            this.getExcelStyleXml() + worksheet.xml +
            '</ss:Workbook>';
    },

    getExcelStyleXml: function() {
        return EXT_EXCEL_STYLE_XML;
    },

    createWorksheet: function(includeHidden, config) {
        var postfix = this.id.replace(/-/g, '_');
        var WorksheetName = "";
        var PrintTitlesName = "PrintTitles_" + postfix;

        // Calculate cell data types and extra class names which affect formatting
        var cellType = [];
        var cellTypeClass = [];
        var cm = this.getColumnModel();
        var totalWidthInPixels = 0;
        var colXml = '';
        var headerXml = '';
        var visibleColumnCountReduction = 0;
        var innertitle = '';
        var innerstore = null;

        if (config && config.title) {
            innertitle = config.title;
        } else {
            innertitle = this.title;
        }

        if (!innertitle || innertitle == '') {
            innertitle = '';
        }

        WorksheetName = innertitle;

        if (config && config.store) {
            innerstore = config.store;
        } else {
            innerstore = this.store;
        }
        for (var i = 0; i < cm.getColumnCount(); i++) {
            if (includeHidden || !cm.isHidden(i)) {
                var w = cm.getColumnWidth(i)
                totalWidthInPixels += w;
                if ((cm.getColumnHeader(i) === "") || (cm.getColumnId(i) === "checker") || ((cm.getColumnId(i) === "actions") && (cm.getColumnHeader(i) === "Actions"))) {
                    cellType.push("None");
                    cellTypeClass.push("");
                    ++visibleColumnCountReduction;
                }
                else {
                    colXml += '<ss:Column ss:AutoFitWidth="1" ss:Width="' + w + '" />';
                    headerXml += '<ss:Cell ss:StyleID="headercell">' +
                        '<ss:Data ss:Type="String">' + cm.getColumnHeader(i).replace(/<\/?.+?>/g, "") + '</ss:Data>' +
                        '<ss:NamedCell ss:Name="' + PrintTitlesName + '" /></ss:Cell>';
                    var fld = innerstore.recordType.prototype.fields.get(cm.getDataIndex(i));

                    if (!fld) continue;

                    switch (fld.type) {
                        case "int":
                            cellType.push("Number");
                            cellTypeClass.push("int");
                            break;
                        case "float":
                            cellType.push("Number");
                            cellTypeClass.push("float");
                            break;
                        case "bool":
                        case "boolean":
                            cellType.push("String");
                            cellTypeClass.push("");
                            break;
                        case "date":
                            cellType.push("DateTime");
                            cellTypeClass.push("date");
                            break;
                        default:
                            cellType.push("String");
                            cellTypeClass.push("");
                            break;
                    }
                }
            }
        }
        var visibleColumnCount = cellType.length - visibleColumnCountReduction;

        var result = {
            height: 9000,
            width: Math.floor(totalWidthInPixels * 30) + 50
        };

        // Generate worksheet header details.
        var t = '<ss:Worksheet ss:Name="' + WorksheetName + '">' +
            '<ss:Names>' +
                '<ss:NamedRange ss:Name="' + PrintTitlesName + '" ss:RefersTo="=\'' + WorksheetName + '\'!R1:R2" />' +
            '</ss:Names>' +
            '<ss:Table x:FullRows="1" x:FullColumns="1"' +
                ' ss:ExpandedColumnCount="' + (visibleColumnCount) +
                '" ss:ExpandedRowCount="' + (innerstore.getCount() + 2) + '">' +
                colXml +
                '<ss:Row ss:Height="38">' +
                    '<ss:Cell ss:StyleID="title" ss:MergeAcross="' + (visibleColumnCount - 1) + '">' +
                      '<ss:Data xmlns:html="http://www.w3.org/TR/REC-html40" ss:Type="String">' +
                        '<html:B>' + innertitle + '</html:B></ss:Data><ss:NamedCell ss:Name="' + PrintTitlesName + '" />' +
                    '</ss:Cell>' +
                '</ss:Row>' +
                '<ss:Row ss:AutoFitHeight="1">' +
                headerXml +
                '</ss:Row>';

        // Generate the data rows from the data in the Store
        for (var i = 0, it = innerstore.data.items, l = it.length; i < l; i++) {
            t += '<ss:Row>';
            var cellClass = (i & 1) ? 'odd' : 'even';
            r = it[i].data;
            var k = 0;
            for (var j = 0; j < cm.getColumnCount(); j++) {
                if (includeHidden || !cm.isHidden(j)) {
                    var v = r[cm.getDataIndex(j)];
                    if (typeof cm.config[j].renderer == 'function' && cellType[k] != 'DateTime') {
                        var m = {};
                        v = cm.config[j].renderer(v, m, it[i], i, j, innerstore);
                        var re = /<[^>]+>/g;
                        if (v) {
                            v = v.toString().replace(re, '');
                        } else {
                            v = '';
                        }
                    }
                    if (cellType[k] !== "None") {

                        if (!v) {
                            t += '<ss:Cell ss:StyleID="' + cellClass + '"></ss:Cell>';
                        } else {
                            t += '<ss:Cell ss:StyleID="' + cellClass + cellTypeClass[k] + '"><ss:Data ss:Type="' + cellType[k] + '">';
                            if (cellType[k] == 'DateTime') {
                                t += v.format('Y-m-d\\TH:i:s.000'); // no space betwen  i: s
                            } else {
                                v = EncodeValue(v);

                                t += v;
                            }
                            t += '</ss:Data></ss:Cell>';
                        }
                    }
                    k++;
                }
            }
            t += '</ss:Row>';
        }

        result.xml = t + '</ss:Table>' +
            '<x:WorksheetOptions>' +
                '<x:PageSetup>' +
                    '<x:Layout x:CenterHorizontal="1" x:Orientation="Landscape" />' +
                    '<x:Footer x:Data="Page &amp;P of &amp;N" x:Margin="0.5" />' +
                    '<x:PageMargins x:Top="0.5" x:Right="0.5" x:Left="0.5" x:Bottom="0.8" />' +
                '</x:PageSetup>' +
                '<x:FitToPage />' +
                '<x:Print>' +
                    '<x:PrintErrors>Blank</x:PrintErrors>' +
                    '<x:FitWidth>1</x:FitWidth>' +
                    '<x:FitHeight>32767</x:FitHeight>' +
                    '<x:ValidPrinterInfo />' +
                    '<x:VerticalResolution>600</x:VerticalResolution>' +
                '</x:Print>' +
                '<x:Selected />' +
                '<x:DoNotDisplayGridlines />' +
                '<x:ProtectObjects>False</x:ProtectObjects>' +
                '<x:ProtectScenarios>False</x:ProtectScenarios>' +
            '</x:WorksheetOptions>' +
        '</ss:Worksheet>';

        //Add function to encode value,2009-4-21
        function EncodeValue(v) {
            var re = /[\r|\n]/g; //Handler enter key
            v = v.toString().replace(re, '&#10;');

            return v;
        };

        return result;
    }
});