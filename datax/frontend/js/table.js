(function () {
    //定义Beautifier的构造函数
    var TableChart = function (ele, opt, sourcedata, total) {
        this.$element = ele,
            this.$id = ele.attr('id'),
            this.soucedata = sourcedata,
            this.total = total,
            this.defaults = {

            },
            this.options = $.extend({}, this.defaults, opt);
    };
    TableChart.prototype = {
        createTable: function (type) {
            var that = this;
            var height = this.$element.height();
            if(height > 200){
                this.$element.css('height', height);
            }
            this.$element.empty();
            var table = $("<table>");
            if(that.options.tableTitle!=undefined && that.options.tableTitle!=''){
                table.append('<caption style="font-size: 16px;">'+that.options.tableTitle+'</caption>');//添加表格标题显示
            }
            //table的excle数据下载
            var tabledataexceldownload_column=[];
            var tabledataexceldownload_olapid='';
            var tabledataexceldownload_theads=[];

            that.options.columns.map(function (column) {
                tabledataexceldownload_column.push(column);
            });
            // tabledataexceldownload_olapid='\''+that.options.olapid+'\'';
            theadlist=that.options.theads;
            theadlist[theadlist.length-1].rows.map(function (theadObj) {
                tabledataexceldownload_theads.push({"title":theadObj['title'],"field":theadObj['field']});
            });
            // theadJsonStr=JSON.stringify(tabledataexceldownload_theads);
            // console.log('theadJsonStr=',theadJsonStr);
            tabledataexceldownloadparam={};
            tabledataexceldownloadparam['olapid']=that.options.olapid;
            tabledataexceldownloadparam['theads']=tabledataexceldownload_theads;
            tabledataexceldownloadparam['columns']=tabledataexceldownload_column;
            // tabledataexceldownload_tablename=that.name;

            // var downloadTbDataStr='<i id="tbDataDownload'+that.$id+'" class="fa fa-file-excel-o" style="display: none;position: fixed;font-size: 1.5em;" title="下载excle数据" onclick="downloadTbData('+tabledataexceldownload_olapid+','+tabledataexceldownload_column+')"></i>';
            // var downloadTbDataStr='<i id="tbDataDownload'+that.$id+'" class="fa fa-file-excel-o" style="display: none;position: absolute;font-size: 1.5em;right: 0px;" title="下载excle数据" onclick="downloadTbData('+tabledataexceldownload_olapid+','+theadJsonStr+','+tabledataexceldownload_column+')"></i>';
            var downloadTbDataStr='<i id="tbDataDownload'+that.$id+'" class="fa fa-file-excel-o" style="display: none;position: absolute;font-size: 1.5em;right: 0px;" title="下载excle数据" onclick="downloadTbData('+JSON.stringify(tabledataexceldownloadparam).replace(/\"/g,'\'')+')"></i>';
            table.append(downloadTbDataStr)
            table.mouseover(function () {$("#tbDataDownload"+that.$id).show();})
            table.mouseleave(function () {$("#tbDataDownload"+that.$id).hide();})

            table.addClass('table table-bordered');
            var thead = $("<thead>");
            var cellCssLens=[];
            var theadLen=this.options.theads.length;
            this.options.theads.map(function (index,idx) {
                var tr = $("<tr>");
                index.rows.map(function (ele) {
                    var th = $("<th>");
                    if((theadLen-1)==idx){
                        var thDiv=$("<div>");
                        thDiv.text(ele.title);
                        thDiv.attr('rowspan', ele.rowspan);
                        thDiv.attr('colspan', ele.colspan);
                        thDiv.attr('align', 'center');
                        var lengthCss='width:'+getCssLenByText(ele.title)+'px !important;';
                        thDiv.css('cssText',lengthCss);
                        cellCssLens.push(lengthCss);//保存到数组中，在数据td里使用
                        thDiv.appendTo(th);
                    }else{
                        th.text(ele.title);
                        th.attr('rowspan', ele.rowspan);
                        th.attr('colspan', ele.colspan);
                        th.attr('align', 'center');
                    }
                    th.appendTo(tr);
                });
                tr.appendTo(thead);
            });
            var tbody = $("<tbody>");
            var currentpage = getSeeion(this.$id + '_currentpage');
            if (!currentpage) {
                setSession(this.$id + '_currentpage', 1);
                currentpage = 1;
            }
            this.getData(function (data, total) {
                data.map(function (index) {
                    var tr = $("<tr>");
                    that.options.columns.map(function (column,idx) {
                        var td = $("<td>");
                        var tdDiv=$("<div>");
                        tdDiv.css('cssText',cellCssLens[idx]+'white-space:nowrap;overflow:hidden;text-overflow: ellipsis;');
                        tdDiv.text(index[column]);
                        tdDiv.appendTo(td);
                        td.attr('title',index[column]);
                        td.css('cssText',cellCssLens[idx]);//td的width和th的一致
                        td.appendTo(tr);
                    });
                    tr.appendTo(tbody);
                });
                thead.appendTo(table);
                tbody.appendTo(table);
                $(that.$element).append(table);
                that.options.config.bAutoWidth = false;
                $(that.$element).find(table).dataTable(that.options.config);
                if (that.options.pagin && that.options.pagin == '1'){
                    that.createPageNation(total);
                }
            }, currentpage, type);

        },
        createPageNation: function (total) {
            var that = this;
            var currentPage = getSeeion(that.$id + '_currentpage');
            var pageid = this.$id + '_pagination';
            var ul = $('<div id="' + pageid +'"></div>');
            that.$element.append(ul);
            $("#"+pageid).whjPaging({
                css: 'css-4',
                totalPage: total,
                showPageNum: 4,
                previousPage: '<',
                nextPage: '>',
                isShowFL: false,
                isShowPageSizeOpt: false,
                isShowSkip: false,
                isShowRefresh: false,
                isShowTotalPage: false,
                isResetPage: false,
                callBack: function (currPage, pageSize) {
                    if (currPage != currentPage){
                        that.sourcedata = null;
                        setSession(that.$id + '_currentpage', currPage);
                        that.createTable('new');
                    }
                }
            });
            $("#" + pageid).whjPaging("setPage", currentPage, total);
            that.$element.find('.dataTables_scrollHead thead tr th:eq(0)').trigger('click');
            // that.$element.find('.dataTables_scrollHeadInner').prepend('<h2>表格标题789789</h2>');//添加表格标题
        },
        getData: function (fn, page, type) {
            if (typeof this.soucedata == 'object' && type != 'new') {
                fn(this.soucedata, this.total);
            }
            else {
                $.ajax({
                    url: encodeURI(this.options.data.url),
                    type: 'post',
                    data: {
                        column: JSON.stringify(this.options.columns),
                        olapid: this.options.olapid,
                        limit: this.options.length,
                        merge: this.options.merge,
                        mergeCols: JSON.stringify(this.options.mergeCols),
                        page: page
                    }
                }).success(function (data) {
                    fn(data.data, data.total);
                });
            }
        }
    };
    $.fn.myTableFuc = function (options, sourcedata, total) {
        var tablechart;
        if (typeof sourcedata == 'object') {
            tablechart = new TableChart(this, options, sourcedata, total);
        }
        else {
            tablechart = new TableChart(this, options);
        }

        return tablechart.createTable(1);
    };
})();
/**************************************时间格式化处理************************************/
function dateFtt(fmt, date) { //author: meizz
    var o = {
        "M+": date.getMonth() + 1, //月份
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
//表格数据导出，参数为表格名字['合同名称', '合同编号', '部门']和olapid数据格式olapid=18
//表格从olap里去除数据，这里根据columns和olapid导出excel
function downloadTbData() {
    paramobj=arguments[0];
    if(typeof(paramobj)=='string'){
        paramobj=JSON.parse(paramobj.replace(/\'/g,'"'));
    }
    $.ajax({
        url: '/dashboard/tableDataExcelExport',
        method: 'POST',
        data: {"params":JSON.stringify(paramobj)},
        async:false,
        success:function (rs) {
            if (rs.code == '1') {
                var filePath = rs.filePath.substr(1);
                var triggerDownload = $("<a>").attr("href", filePath).attr("download",
                    "表格数据-" +
                    dateFtt("yyyy年MM月dd日hh时mm分", new Date())).appendTo("body");
                triggerDownload[0].click();
                triggerDownload.remove();
            }
        }
    })
}
//通过targetText返回css长度，中文14px，英文10px
function getCssLenByText(targetText){
    var reg=/[\u4e00-\u9fa5]/g;
    var chineseStr="";
    var englishStr="";
    if(targetText!=null && targetText!=""){
        chineseStr=targetText.match(reg);
        chineseStr=chineseStr?chineseStr.join(""):"";
        englishStr=targetText.replace(reg, "");
    }
    var allLen=chineseStr.length*14+englishStr.length*10;
    if(allLen<80){
        return 80;
    }else{
        return allLen;
    }
}