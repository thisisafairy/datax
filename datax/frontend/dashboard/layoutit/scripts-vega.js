(function(){


function supportstorage() {
    if (typeof window.localStorage == 'object')
        return true;
    else
        return false;
}

function handleSaveLayout() {
    var e = $(".demo").html();
    if (!stopsave && e != window.demoHtml) {
        stopsave++;
        window.demoHtml = e;
        saveLayout();
        stopsave--;
    }
}

var layouthistory;

function saveLayout() {
    var data = layouthistory;
    if (!data) {
        data = {};
        data.count = 0;
        data.list = [];
    }
    if (data.list.length > data.count) {
        for (i = data.count; i < data.list.length; i++)
            data.list[i] = null;
    }
    data.list[data.count] = window.demoHtml;
    data.count++;
    if (supportstorage()) {
        localStorage.setItem("layoutdata", JSON.stringify(data));
    }
    layouthistory = data;
}


function undoLayout() {
    var data = layouthistory;
    //console.log(data);
    if (data) {
        if (data.count < 2) return false;
        window.demoHtml = data.list[data.count - 2];
        data.count--;
        $('.demo').html(window.demoHtml);
        if (supportstorage()) {
            localStorage.setItem("layoutdata", JSON.stringify(data));
        }
        return true;
    }
    return false;

}

function redoLayout() {
    var data = layouthistory;
    if (data) {
        if (data.list[data.count]) {
            window.demoHtml = data.list[data.count];
            data.count++;
            $('.demo').html(window.demoHtml);
            if (supportstorage()) {
                localStorage.setItem("layoutdata", JSON.stringify(data));
            }
            return true;
        }
    }
    return false;

}

function handleJsIds() {
    handleCarouselIds();
    handleTabsIds()
}

function handleCarouselIds() {
    var e = $(".demo").find("#myCarousel");
    var t = randomNumber();
    var n = "carousel-" + t;
    e.attr("id", n);
    e.find(".carousel-indicators li").each(function(e, t) {
        $(t).attr("data-target", "#" + n)
    });
    e.find(".left").attr("href", "#" + n);
    e.find(".right").attr("href", "#" + n)
}

function handleTabsIds() {
    var e = $(".demo").find("#myTabs");
    var t = randomNumber();
    var n = "tabs-" + t;
    e.attr("id", n);
    e.find(".tab-pane").each(function(e, t) {
        var n = $(t).attr("id");
        var r = "panel-" + randomNumber();
        $(t).attr("id", r);
        $(t).parent().parent().find("a[href='#" + n + "']").attr("href", "#" + r)
    })
}

function randomNumber() {
    return randomFromInterval(1, 1e6)
}

function randomFromInterval(e, t) {
    return Math.floor(Math.random() * (t - e + 1) + e)
}

function gridSystemGenerator() {
    $(".lyrow .preview input").bind("keyup", function() {
        var e = 0;
        var t = "";
        var n = $(this).val().split(" ", 12);
        $.each(n, function(n, r) {
            e = e + parseInt(r);
            t += '<div class="span' + r + ' column col-md-' + r + '"></div>'
        });
        if (e == 12) {
            $(this).parent().next().children().html(t);
            $(this).parent().prev().show()
        } else {
            $(this).parent().prev().hide()
        }
    })
}

function configurationElm(e, t) {
    $(".demo").delegate(".configuration > a", "click", function(e) {
        e.preventDefault();
        var t = $(this).parent().next().next().children();
        $(this).toggleClass("active");
        t.toggleClass($(this).attr("rel"))
    });
    $(".demo").delegate(".configuration .dropdown-menu a", "click", function(e) {
        e.preventDefault();
        var t = $(this).parent().parent();
        var n = t.parent().parent().next().next().children();
        t.find("li").removeClass("active");
        $(this).parent().addClass("active");
        var r = "";
        t.find("a").each(function() {
            r += $(this).attr("rel") + " "
        });
        t.parent().removeClass("open");
        n.removeClass(r);
        n.addClass($(this).attr("rel"))
    })
}

function removeElm() {
    $(".demo").delegate(".remove", "click", function(e) {
        e.preventDefault();
        clearChartColumn($(this).parent());
        clearFilter();
        $(this).parent().remove();
        if (!$(".demo .lyrow").length > 0) {
            clearDemo()
        }
    })
}

function clearDemo() {
    $(".demo").empty();
    layouthistory = null;
    if (supportstorage())
        localStorage.removeItem("layoutdata");
}

function removeMenuClasses() {
    $("#menu-layoutit li button").removeClass("active")
}

function changeStructure(e, t) {
    $("#download-layout ." + e).removeClass(e).addClass(t)
}

function cleanHtml(e) {
    $(e).parent().append($(e).children().html())
}

function downloadLayoutSrc() {
    var e = "";
    $("#download-layout").children().html($(".demo").html());
    var t = $("#download-layout").children();
    t.find(".preview, .configuration, .drag, .remove").remove();
    t.find(".lyrow").addClass("removeClean");
    t.find(".box-element").addClass("removeClean");
    t.find(".lyrow .lyrow .lyrow .lyrow .lyrow .removeClean").each(function() {
        cleanHtml(this)
    });
    t.find(".lyrow .lyrow .lyrow .lyrow .removeClean").each(function() {
        cleanHtml(this)
    });
    t.find(".lyrow .lyrow .lyrow .removeClean").each(function() {
        cleanHtml(this)
    });
    t.find(".lyrow .lyrow .removeClean").each(function() {
        cleanHtml(this)
    });
    t.find(".lyrow .removeClean").each(function() {
        cleanHtml(this)
    });
    t.find(".removeClean").each(function() {
        cleanHtml(this)
    });
    t.find(".removeClean").remove();
    $("#download-layout .column").removeClass("ui-sortable");
    $("#download-layout .row-fluid").removeClass("clearfix").children().removeClass("column");
    if ($("#download-layout .container").length > 0) {
        changeStructure("row-fluid", "row")
    }
    $("#download-layout").find('img').remove();
    $("#download-layout").find(".dt-bootstrap").remove();
    formatSrc = $.htmlClean($("#download-layout").html(), {
        format: true,
        allowedAttributes: [
            ["id"],
            ["class"],
            ["onchange"],
            ["data-toggle"],
            ["data-target"],
            ["data-parent"],
            ["role"],
            ["data-dismiss"],
            ["aria-labelledby"],
            ["aria-hidden"],
            ["data-slide-to"],
            ["data-slide"],
            ["data-type"],
            ['data-column'],
            ['data-filter-type'],
            ['data-start'],
            ['data-end']
        ]
    });
    $("#download-layout").html(formatSrc);
    $("#downloadModal textarea").empty();
    $("#downloadModal textarea").val(formatSrc)
    $("#htmlrawstring").val(window.demoHtml);
}

var currentDocument = null;
var timerSave = 1000;
var stopsave = 0;
var startdrag = 0;
var demoHtml = $(".demo").html();
var currenteditor = null;
$(window).resize(function() {
    $("#containerBody").css("height", $(window).height() - 100);
    $(".demo").css("min-height", 2160); //$(window).height() - 150)
});
$("#containerBody").css("height", $(window).height() - 100);

function restoreData() {
    if (supportstorage()) {
        layouthistory = JSON.parse(localStorage.getItem("layoutdata"));
        if (!layouthistory) return false;
        window.demoHtml = layouthistory.list[layouthistory.count - 1];
        if (window.demoHtml) $(".demo").html(window.demoHtml);
    }
}

function initContainer() {
    $(".demo, .demo .column").sortable({
        connectWith: ".column",
        opacity: .35,
        handle: ".drag",
        start: function(e, t) {
            if (!startdrag) stopsave++;
            startdrag = 1;
        },
        stop: function(e, t) {
            if (stopsave > 0) stopsave--;
            startdrag = 0;
        }
    });
    $("#elmBase").sortable({
        connectWith: ".boxes",
        opacity: .35,
        handle: ".drag",
        start: function(e, t) {
            if (!startdrag) stopsave++;
            startdrag = 1;
        },
        stop: function(e, t) {
            if (stopsave > 0) stopsave--;
            startdrag = 0;
        }
    });
    configurationElm();
}

//初始化
window.InitUI = function() {
    $(".sidebar-nav .lyrow").draggable({
        connectToSortable: ".demo",
        helper: "clone",
        handle: ".drag",
        start: function(e, t) {
            $(".sidebar-nav").removeClass("scroll-y");
            if (!startdrag) stopsave++;
            startdrag = 1;
        },
        drag: function(e, t) {
            t.helper.width(400)
        },
        stop: function(e, t) {
            $(".demo .column").sortable({
                opacity: .35,
                connectWith: ".column",
                start: function(e, t) {
                    if (!startdrag) stopsave++;
                    startdrag = 1;
                },
                stop: function(e, t) {
                    if (stopsave > 0) stopsave--;
                    startdrag = 0;
                }
            });
            if (stopsave > 0) stopsave--;
            startdrag = 0;
            $(".sidebar-nav").addClass("scroll-y");
            resetColumnModal(); //jnp edit
        }
    });
    //控件
    $(".sidebar-nav .box").draggable({
        connectToSortable: ".column",
        helper: "clone",
        handle: ".drag",
        start: function(e, t) {
            var t_type = t.helper.closest('.accordion-group').data('key');
            t.helper.attr('data-module-type',t_type);
            $(".sidebar-nav").removeClass("scroll-y");
            if (!startdrag) stopsave++;
            startdrag = 1;
            DrawDragChartView(e, t);
            if(t_type == 'filter'){
                var id = randomNumber();
                t.helper.find('.filter-module').attr('oldid',t.helper.find('.filter-module').attr('id'));
                t.helper.find('.filter-module').attr('id',id);
            }
        },
        drag: function(e, t) {
            t.helper.width(400)
        },
        stop: function(e, t) {
            handleJsIds();
            if (stopsave > 0) stopsave--;
            startdrag = 0;
            var moduleType = t.helper.attr('data-module-type');
            if(moduleType == 'chart'){
                DrawDropChartView(e, t); //动态绘图
            }
            $(".sidebar-nav").addClass("scroll-y");
            $(".demo .column").sortable({ //jnpadd 追加初始化tab内的容器
                opacity: .35,
                connectWith: ".column",
                start: function(e, t) {
                    if (!startdrag) stopsave++;
                    startdrag = 1;
                },
                stop: function(e, t) {
                    if (stopsave > 0) stopsave--;
                    startdrag = 0;
                }
            });
            resetEditModal(); //jnp add 追加编辑事件
            resetModalChart();
            
            if(moduleType == 'filter'){
                DrawDropFilterView(e,t);
            }
        }
    });
    $("#savecontent").click(function(e) {
        e.preventDefault();
        currenteditor.html(contenthandle.getData());
    });
    $("#savecontentcol").click(function(e) {
        e.preventDefault();
        $(currentcolumneditor).css("width", parseInt($("#colheight").val()) + "px");
        $(currentcolumneditor).children(".column").css("width", $("#colheight").val() + "px");
        //currenteditor.html(contenthandle.getData());
    });

    $("#savecontentglobal").click(function(e) {
        e.preventDefault();
        //$("body").addClass("devpreview");
        $(".demo").parent().css("width", parseInt($("#globalwidth").val()) + "px");
        $(".demo").parent().css("background-color", $("#globalbgcolor").val());
        BackGroundSet($("#globalbgcolor").val() == "");
        BackGroundSet($("#globalbgpicurl").val() == "");
        var configarr = $("#basicconfigform").serializeArray();
        var indexed_array = {};
        $.map(configarr, function(n, i) {
            indexed_array[n['name']] = n['value'];
        });
        $("#basicconfig").val(JSON.stringify(indexed_array));
        //currenteditor.html(contenthandle.getData());
    });
    $("#uploadbgpic").click(function(e) {
        e.preventDefault();
        if ($("#globalbgpic").val() == "") {
            alert("请选选择图片后再上传!");
            return;
        }
        var formData = new FormData();
        formData.append("filename", document.getElementById('globalbgpic').files[0]);
        $.ajax({
            url: '/api/dash/uploadbgpicture',
            type: 'post',
            processData: false,
            contentType: false,
            data: formData
        }).then(function(data) {
            if (data.code == "1") {
                $("#globalbgpicurl").val("http://" + window.location.host + data.path + data.filename);
                $(".demo").css("background", "url(" + $("#globalbgpicurl").val() + ") 100% top no-repeat");
                $(".demo").css("background-size", "100% 100%");
            }
            BackGroundSet($("#globalbgpicurl").val() == "")
        })
    });

    function BackGroundSet(flag) {
        if (!flag) {
            $(".demo").find(".row-fluid").css("background", "none");
            $(".demo").find(".column").css("background", "none");
            $(".demo").find(".box").css("background", "none");
        } else {
            if ($("#globalbgcolor").val() != "") return;
            $(".demo").find(".row-fluid").css("background", "");
            $(".demo").find(".column").css("background", "");
            $(".demo").find(".box").css("background", "");
        }
    }

    $("#removecontentcol").click(function(e) {
        e.preventDefault();
        $(currentcolumneditor).css("height", "auto");
        $(currentcolumneditor).children(".column").css("height", "auto");
    });
    $("#downloadbtn").click(function(e) {
        e.preventDefault();
        downloadLayoutSrc();
    });

    $("#edit").click(function() {
        $("body").removeClass("devpreview sourcepreview");
        $("body").addClass("edit");
        removeMenuClasses();
        $(this).addClass("active");
        window.InitChartViews();
        return false
    });
    $("#clear").click(function(e) {
        e.preventDefault();
        clearDemo()
    });
    $("#devpreview").click(function() {
        $("body").removeClass("edit sourcepreview");
        $("body").addClass("devpreview");
        removeMenuClasses();
        $(this).addClass("active");
        window.InitChartViews();
        return false
    });
    $("#sourcepreview").click(function() {
        $("body").removeClass("edit");
        $("body").addClass("devpreview sourcepreview");
        removeMenuClasses();
        $(this).addClass("active");
        window.InitChartViews();
        return false
    });
    $("#fluidPage").click(function(e) {
        e.preventDefault();
        changeStructure("container", "container-fluid");
        $("#fixedPage").removeClass("active");
        $(this).addClass("active");
        downloadLayoutSrc()
    });
    $("#fixedPage").click(function(e) {
        e.preventDefault();
        changeStructure("container-fluid", "container");
        $("#fluidPage").removeClass("active");
        $(this).addClass("active");
        downloadLayoutSrc()
    });
    $(".nav-header").click(function() {
        $(".sidebar-nav .boxes, .sidebar-nav .rows").hide();
        $(this).next().slideDown()
    });
    $('#undo').click(function() {
        stopsave++;
        if (undoLayout()) initContainer();
        stopsave--;
    });
    $('#redo').click(function() {
        stopsave++;
        if (redoLayout()) initContainer();
        stopsave--;
    });
    removeElm();
    gridSystemGenerator();
    setInterval(function() {
        handleSaveLayout()
    }, timerSave)

    initContainer();
    resetEditModal();
    resetColumnModal();
    resetModalChart();

    $("#editorModalChart").draggable({
        cursor: "move",
        handle: '.modal-header'
    });
    //颜色选择器初始化
    $('#chartscheme').colorpicker();
    $("#chartscheme").colorpicker().on('changeColor', function() {
        currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
        ReDrawCurrentChart();
    });
    $('#chartbgcolor').colorpicker();
    $('#chartbgcolor').colorpicker().on('changeColor', function(ev) {
        currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
        ReDrawCurrentChart();
    });
    $('#colbgcolor').colorpicker();
    $('#globalbgcolor').colorpicker();
    $('#globalbgcolor').colorpicker().on('changeColor', function(ev) {
        $(".demo").parent().css("background-color", $("#globalbgcolor").val());
        BackGroundSet($("#globalbgcolor").val() == "");
    });
}

var currentcolumneditor = null;

function resetColumnModal() {
    $("[data-target='#editorColumnModal']").off("click").on("click", function(e) {
        e.preventDefault();
        currentcolumneditor = $(this).parent().parent().find('.view').children()[0];
    });
}


var currentcharteditor = null;
var currentcharteditorSpan = null;

function resetModalChart() {
    $("[data-target='#editorModalChart']").off("click").on("click", function(e) {
        e.preventDefault();
        $("[form-type='vega']").hide();
        $("[form-type='echarts']").hide();
        $("[form-type='table']").hide();
        $('#chartconfigform').find("input").val('').removeAttr('checked').removeAttr('checked');
        currentcharteditorSpan = $(this).parent().parent().find('.datatag')[0];
        currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
        var type = $(currentcharteditorSpan).closest('.box-element').find('.chart-content').data('type');
        if (type == 'vega') {
            $("[form-type='vega']").show();
            if (currentcharteditor.height) $("#chartheight").val(currentcharteditor.height);
            if (currentcharteditor.width) $("#chartwidth").val(currentcharteditor.width);
            BindProp("chartlabelangle", "currentcharteditor.encoding.x.axis.labelAngle");
            BindProp("chartlabellength", "currentcharteditor.config.axis.labelLimit");
            BindProp("chartlabelx", "currentcharteditor.encoding.x.axis.title");
            BindProp("chartlabely", "currentcharteditor.encoding.y.axis.title");
            BindProp("chartlabeltitle", "currentcharteditor.title");
            if (IsHaveProp("currentcharteditor.selection.view.bind")) $("#allowzoom")[0].checked = true;
            else $("#allowzoom").removeAttr("checked");
            BindProp("chartscheme", "currentcharteditor.encoding.color.value");
            BindProp("chartbgcolor", "currentcharteditor.background");
        } else if(type == 'echarts') {
            $("[form-type='echarts']").show();
            currentcharteditorSpan = $(this).parent().parent().find('.ecdatatag')[0];
            currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
            if (currentcharteditor.height) $("#chartheight").val(currentcharteditor.height);
            if (currentcharteditor.width) $("#chartwidth").val(currentcharteditor.width);
            BindProp("echarttitle", "currentcharteditor.title.text");
            BindProp("echartsubtitle", "currentcharteditor.title.subtext");
            BindProp("echartlegend", "currentcharteditor.legend.show");
        }
        else{
            $("[form-type='table']").show();
            currentcharteditorSpan = $(this).parent().parent().find('.tdatatag')[0];
            currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
            if(currentcharteditor.config.sScrollY) $("#tableScrollY").val(currentcharteditor.config.sScrollY.replace('px',''));
            if(currentcharteditor.config.pageLength) $("#pagelength").val(currentcharteditor.config.pageLength);
            BindProp("leftFiexColumn", "currentcharteditor.config.fixedColumns.leftColumns");
            BindProp("rightFiexColumn", "currentcharteditor.config.fixedColumns.rightColumns");
        }

    });
}

function IsHaveProp(str) {
    try {
        if (eval(str)) return true;
        else return false;
    } catch (e) {
        return false;
    }
}

function BindProp(obj, value) {
    try {
        $("#" + obj).val(eval(value));
        return true;
    } catch (e) {
        return false;
    }
}

function DeleteProp(value) {
    try { eval("delete " + value); } catch (e) {}

}
//保存图形设置
$("#savecontentchart").click(function(e) {
    e.preventDefault();
    var type = $(currentcharteditorSpan).closest('.box-element').find('.chart-content').data('type');
    if (type == 'vega') {
        if ($("#chartheight").val() != "") currentcharteditor.height = $("#chartheight").val();
        else if (currentcharteditor.height) delete currentcharteditor.height;
        if ($("#chartwidth").val() != "") currentcharteditor.width = $("#chartwidth").val();
        else if (currentcharteditor.width) delete currentcharteditor.width;
        if ($("#chartlabelangle").val() != "") $.extend(true, currentcharteditor, { "encoding": { "x": { "axis": { "labelAngle": $("#chartlabelangle").val() } } } });
        else DeleteProp("currentcharteditor.encoding.x.axis.labelAngle")
        if ($("#chartlabellength").val() != "") $.extend(true, currentcharteditor, { "config": { "axis": { "labelLimit": $("#chartlabellength").val() } } });
        else DeleteProp("currentcharteditor.config.axis.labelLimit")
        if ($("#chartlabelx").val() != "") $.extend(true, currentcharteditor, { "encoding": { "x": { "axis": { "title": $("#chartlabelx").val() } } } });
        else DeleteProp("currentcharteditor.encoding.x.axis.title")
        if ($("#chartlabely").val() != "") $.extend(true, currentcharteditor, { "encoding": { "y": { "axis": { "title": $("#chartlabely").val() } } } });
        else DeleteProp("currentcharteditor.encoding.y.axis.title")
        if ($("#chartlabeltitle").val() != "") $.extend(true, currentcharteditor, { "title": $("#chartlabeltitle").val() });
        else DeleteProp("currentcharteditor.title")
        if ($("#allowzoom").is(':checked')) $.extend(true, currentcharteditor, { "selection": { "view": { "type": "interval", "bind": "scales" } } });
        else DeleteProp("currentcharteditor.selection.view");
        if ($("#chartscheme").val() != "") $.extend(true, currentcharteditor, { "encoding": { "color": { "value": $("#chartscheme").val() } } });
        else DeleteProp("currentcharteditor.encoding.color.value");
        if ($("#chartbgcolor").val() != "") $.extend(true, currentcharteditor, { "background": $("#chartbgcolor").val() });
        else DeleteProp("currentcharteditor.background");
        currentcharteditorSpan.innerHTML = JSON.stringify(currentcharteditor);
    } else if(type == 'echarts'){
        if ($("#echartheight").val() != "") currentcharteditor.height = $("#echartheight").val();
        else if (currentcharteditor.height) delete currentcharteditor.height;
        if ($("#echartwidth").val() != "") currentcharteditor.width = $("#echartwidth").val();
        else if (currentcharteditor.width) delete currentcharteditor.width;
        if ($("#echarttitle").val() != "") $.extend(true, currentcharteditor, { "config": { "title": { "text": $("#echarttitle").val() } } });
        else DeleteProp("currentcharteditor.title.text")
        if ($("#echartsubtitle").val() != "") $.extend(true, currentcharteditor, { "config": { "title": { "subtext": $("#echartsubtitle").val() } } });
        else DeleteProp("currentcharteditor.title.subtext")
        $.extend(true, currentcharteditor, { "config": { "legend": { "show": $("#echartlegend").val() } } });
        currentcharteditorSpan.innerHTML = JSON.stringify(currentcharteditor);
    }
    else if(type=='table'){
        if($("#tableScrollY").val() != "") currentcharteditor.config.sScrollY = $("#tableScrollY").val()+'px';
        if($("#pagelength").val() != "") currentcharteditor.config.pageLength = $("#pagelength").val();
        var leftFixed = 0;
        var rightFixed = 0;
        if($("#leftFiexColumn").val() != "") 
            leftFixed = $("#leftFiexColumn").val();
        if($("#rightFiexColumn").val() != "") 
            rightFixed = $("#rightFiexColumn").val();
        currentcharteditor.config.fixedColumns = {
            leftColumns:leftFixed,
            rightColumns:rightFixed
        }
        currentcharteditorSpan.innerHTML = JSON.stringify(currentcharteditor);
    }
    ReDrawCurrentChart();

});

function ReDrawCurrentChart() {
    currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
    var datatag = $(currentcharteditorSpan);
    var type = $(currentcharteditorSpan).closest('.box-element').find('.chart-content').data('type');
    if (type == 'vega') {
        var chardiv = datatag.parent().find("div.vega-embed");
        if (!chardiv[0]) return;
        var diffWidth = 0;
        //if(currentcharteditor.encoding.row||currentcharteditor.encoding.column||currentcharteditor.encoding.color||currentcharteditor.encoding.size)//有标签的
        //	diffWidth = 130;
        if ($("#chartheight").val() == "") $.extend(true, currentcharteditor, { "height": 260 });
        if ($("#chartwidth").val() == "") $.extend(true, currentcharteditor, { "width": chardiv[0].clientWidth - diffWidth });
        //颜色定义
        $.extend(true, currentcharteditor, { "encoding": { "color": { "value": $("#chartscheme").val() } } }); //颜色定义
        $.extend(true, currentcharteditor, { "background": $("#chartbgcolor").val() });
        DrawSingleVega($(chardiv).attr("id"), currentcharteditor);
    } else if(type == 'echarts') {
        var chardiv = datatag.parent().find("div.echart-embed");
        if (!chardiv[0]) return;

        DrawSingleEchart($(chardiv).attr("id"), currentcharteditor);
    }
    else if(type == 'table'){
        var chardiv = datatag.parent().find("div.table-embed");
        $(chardiv).html('');
        DrawSingleTable($(chardiv).attr("id"), currentcharteditor);
     }


}


function resetEditModal() {
    $("[data-target='#editorModal']").click(function(e) {
        e.preventDefault();
        currenteditor = $(this).parent().parent().find('.view');
        var eText = currenteditor.html();
        contenthandle.setData(eText);
    });
}

//动态绘制拖动的图表 jnp

function DrawDragChartView(e, t) {
    var type = t.helper.find('.chart-content');

    var charttype = type.data('type');
    var tag = t.helper.find("span.datatag");
    var chardiv = t.helper.find("div.vega-embed")
    var newid = randomNumber();
    if (charttype == 'echarts') {
        chardiv = t.helper.find('div.echart-embed');
    }
    if (charttype == 'table') {
        chardiv = t.helper.find('div.table-embed');
    }
    if (tag && tag.length > 0) {
        t.helper.width(300);
        t.helper.find("div.view").width(300);
        t.helper.find("div.view").height(200);
        $(chardiv).attr("oldid", chardiv.attr("id"));
        $(chardiv).attr("id", "chartview_" + newid);
    }
}

function DrawDropChartView(e, t) {

    var type = t.helper.find('.chart-content');
    var title = t.helper.find("div.preview").html();
    var charttype = type.data('type');
    var tag = t.helper.find("span.datatag");
    var chardiv = t.helper.find("div.vega-embed")
    if (charttype == 'echarts') {
        chardiv = t.helper.find('div.echart-embed');
        tag = t.helper.find('span.ecdatatag');
    }
    if(charttype == 'table'){
        chardiv = t.helper.find('div.table-embed');
        tag = t.helper.find('span.tdatatag');
    }
    if (!chardiv || chardiv.length == 0)
        return;
    else {
        chardiv = $(".demo").find("#" + chardiv.attr("oldid"));
    }
    // chardiv = $(".demo").find("#"+chardiv.attr("oldid"));
    var newid = randomNumber();
    if (tag && tag.length > 0) {
        if (charttype == 'vega') {
            chardiv.parent().removeAttr("style");
            chardiv.parent().find(".view").attr("style", "");
            var vlconfig = JSON.parse(tag.text());
            $.extend(true, vlconfig, { "title": title }); //自动增加标题
            $(chardiv).attr("id", "chartview_" + newid);
            // $("#chartview_" + newid).next().attr("id", "chartdata_" + newid);
            // $("#chartview_" + newid).parent().next().html(JSON.stringify(vlconfig)); //保存标题信息
            if (!chardiv[0]) return;
            $("#chartview_" + newid).closest('.view').removeAttr('style');
            $("#chartview_" + newid).closest('.view').find('img').hide();
            DrawSingleVega("chartview_" + newid, vlconfig);
        } else if(charttype == 'echarts') {
            chardiv.parent().removeAttr("style");
            chardiv.parent().find(".view").attr("style", "");
            var vlconfig = JSON.parse(tag.text());
            $.extend(true, vlconfig, { "title": title });
            $(chardiv).attr("id", "chartview_" + newid);
            // $("#chartview_" + newid).next().attr("id", "chartdata_" + newid);
            // $("#chartview_"+newid).next().html(JSON.stringify(ecconfig));//保存标题信息
            if (!chardiv[0]) return;
            $("#chartview_" + newid).closest('.view').removeAttr('style');
            $("#chartview_" + newid).closest('.view').find('img').hide();

            var width  = $("#chartview_" + newid).width();
            var height = width*9/16;
            vlconfig.width = width;
            vlconfig.height = height;
            // debugger;
            $("#chartview_" + newid).closest('.chart-content ').siblings('.ecdatatag').text(JSON.stringify(vlconfig));
            DrawSingleEchart("chartview_" + newid, vlconfig);
        }
        else if(charttype == 'table'){
            chardiv.parent().removeAttr("style");
            chardiv.parent().find(".view").attr("style", "");
            var vlconfig = JSON.parse(tag.text());
            $(chardiv).attr("id", "chartview_" + newid);
            if (!chardiv[0]) return;
            $("#chartview_" + newid).closest('.view').removeAttr('style');
            $("#chartview_" + newid).closest('.view').find('img').hide();
            var width = $("#chartview_" + newid).closest('.view')[0].clientWidth;
            vlconfig.config.sScrollX = width+'px';
            vlconfig.config.scrollX = width+'px';

            DrawSingleTable("chartview_" + newid, vlconfig);
        }

    }
}

function DrawDropFilterView(e,t){
    var module_div = t.helper.find('.filter-module');
    var filter_type = module_div.attr('data-filter-type');
    module_div = $(".demo").find("#" + module_div.attr("oldid"));
    if(module_div.length>0){
        var id = randomNumber();
        module_div.attr('id','filter_module_'+id);
        setFilterModal(module_div,filter_type);
        $("#editorFilter").modal();
        initFilterPlugins(filter_type, module_div);
    }
}

function initFilterPlugins(filter_type,module_div){
    if(filter_type == 'daterange'){
        module_div.daterangepicker(
            {
              ranges: {
                '今天': [moment(), moment()],
                '昨天': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                '七天前': [moment().subtract(6, 'days'), moment()],
                '最近30天': [moment().subtract(29, 'days'), moment()],
                '这个月': [moment().startOf('month'), moment().endOf('month')],
                '上个月': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
              },
              startDate: moment().subtract(29, 'days'),
              endDate: moment(),
              locale:{
                applyLabel:'确认',
                cancelLabel:'取消',
                customRangeLabel:'自定义'
              }
            },
            function (start, end) {
                module_div.val(start.format('YYYY/MM/DD') + '-' + end.format('YYYY/MM/DD'));
                module_div.attr('data-start',start.format('YYYY-MM-DD HH:mm:ss'));
                module_div.attr('data-end',end.format('YYYY-MM-DD HH:mm:ss'));
            }
        );
    }
}

function setFilterModal(module_div,filter_type){
    $("#editorFilter").find(".form-group[data-filter-type!=all]").hide();
    $("#editorFilter").find(".form-group[data-filter-type="+filter_type+"]").show();
    $("#filter_module_id").val(module_div.attr('id'));
    $("#module-height").val(module_div.css('height').replace('px',''));
    $("#filter-label-text").val(module_div.siblings('.filter-title').text());
    $("#filter-method").val(module_div.attr('data-method'));
    var columnlists = getSourceColumn();
    var columSelect = $("#filter-column-select");
    columSelect.empty().append('<option value="">选择场景中存在的图标所包含列</option>');
    columnlists.map(function(index){
        columSelect.append('<option value="'+index+'">'+index+'</option>');
    });
    columSelect.val(module_div.attr('data-column'));
}

$("#saveConfigFilter").click(function(){
    var filter_module_id  = $("#filter_module_id").val();
    $("#"+filter_module_id).css('height',$("#module-height").val());
    $("#"+filter_module_id).siblings('.filter-title').text($("#filter-label-text").val());
    $("#"+filter_module_id).attr('data-column',$("#filter-column-select").val());
    $("#"+filter_module_id).attr('data-method',$("#filter-method").val());
});

$("#demoSave").on('click',"[data-target='#editorFilter']",function(e){
    var filter_module = $(this).closest('span').siblings('.view').find('.filter-module');
    var filter_type = filter_module.attr('data-filter-type');
    setFilterModal(filter_module,filter_type);
});

function getSceneColumn(){
    var allChart = $("#demoSave").find('.chart-content');
    var url = new Array();
    allChart.each(function(e){
        var s = $(this).data('type');
        switch(s){
            case 'vega':
                var jsonconfig = JSON.parse($(this).closest('.view').find('.datatag').text());
                url.push(jsonconfig.data.url);
                break;
            case 'table':
                var jsonconfig = JSON.parse($(this).closest('.view').find('.tdatatag').text());
                url.push(jsonconfig.url);
                break;
            case 'echarts':
                var jsonconfig = JSON.parse($(this).closest('.view').find('.ecdatatag').text());
                url.push(jsonconfig.data.url);
                break;
            default:
                break;
        }
    });
    getSourceColumn();

}
function fetchAllData(url){
    var column = new Array();
    
}

var chartColumn = new Array();

Array.prototype.unique2 = function(){
    this.sort(); //先排序
    var res = [this[0]];
    for(var i = 1; i < this.length; i++){
     if(this[i] !== res[res.length - 1]){
      res.push(this[i]);
     }
    }
    return res;
}

function getSourceColumn(){
    var result = []
    chartColumn.map(function(item){
        item.keys.map(function(index){
            result.push(index);
        });
    });
    if(result.length>0){
        return result.unique2();
    }
    else{
        return result;
    }
}

function addSourceColumn(id,url){
    $.ajax({
        url:url,
        method:'get'
    }).done(function(rs){
        if(rs.length>0||rs.data.length>0){
            if(typeof rs.data != 'undefined'){
                var keys = dl.keys(rs.data[0]);
            }
            else{
                var keys = dl.keys(rs[0]);
            }
            chartColumn.push({
                id:id,
                keys:keys
            });
        }
        else{
            removeSourceColumn(id);
        }
    });
   
}



function removeSourceColumn(id){
    chartColumn = chartColumn.filter(function(item){
        return item['id'] != id;
    });
}

function clearChartColumn(div){
    var chart = div.find('.chart-content');
    chart.each(function(e){
        var s = $(this).data('type');
        var id = '';
        switch(s){
            case 'vega':
                id = $(this).find('.vega-embed').attr('id');
                break;
            case 'table':
                id = $(this).find('.table-embed').attr('id');
                break;
            case 'echarts':
                id = $(this).find('.echart-embed').attr('id');
                break;
            default:
                break;
        }
        removeSourceColumn(id);
    });
}

function clearFilter(){
    var filters = $("div.demo").find(".filter-module");
    var arrayColumn = getSourceColumn();
    filters.each(function(key,item){
        if(arrayColumn.indexOf($(item).attr('data-column')) < 0){
            $(item).attr('data-column','');
        }
    });
}
var oldtheme = "";
//页面加载后,需重新绘制已保存的图形
window.InitChartViews = function() {
    var chartdivs = $(document.body).find("div.demo").find("div.vega-embed");
    chartdivs.each(function() {
        var chardiv = this;
        var parentdiv = chardiv.closest('.chart-content');
        var type = parentdiv.getAttribute('data-type');
        if (type == 'vega') {
            var datatag = $(chardiv).closest('.view').find("span.datatag");
            var vlconfig = JSON.parse(datatag.text());
            DrawSingleVega($(chardiv).attr("id"), vlconfig);
        } else if (type == 'echarts'){
            chardiv = $(parentdiv).find('div.echart-embed');
            var datatag = $(parentdiv).closest('.view').find("span.ecdatatag");
            var vlconfig = JSON.parse(datatag.text());
            DrawSingleEchart($(chardiv).attr("id"), vlconfig);
        }
        else if(type == 'table'){
            chardiv = $(parentdiv).find('div.table-embed');
            var datatag = $(parentdiv).closest('.view').find("span.tdatatag");
            var vlconfig = JSON.parse(datatag.text());
            DrawSingleTable($(chardiv).attr("id"), vlconfig);
        }

    });
    $("#demoSave").find(".filter-module").each(function(){
        var type =  $(this).attr('data-filter-type');
        initFilterPlugins(type,$(this));
    });
    $("#globaltheme").off("change").on("change", function() {
        replacejscssfile(oldtheme, $('#globaltheme option:selected').val(), "css");
        oldtheme = $('#globaltheme option:selected').val();
    });
    BindThemeAndBackGround();
}

$('#demoSave').on('change','.filter-module',_.debounce(function(){
    var allFilter = $('#demoSave').find('.filter-module');
    var that = this;
    var paramArry = new Array();
    allFilter.each(function(){
        var value = $(this).val();
        var filter_type = $(this).attr('data-filter-type');
        var filter_method = $(this).attr('data-method');
        var column = $(this).attr('data-column');
        if(value != ''){
            if(filter_type == 'text'){
                paramArry.push({
                    key:columnFormat(column,filter_method),
                    value:value
                });
            }
            else if(filter_type == 'daterange'){
                filter_method = 'range';
                var startTime = $(this).attr('data-start');
                var endTime = $(this).attr('data-end');
                paramArry.push({
                    key:columnFormat(column,'b_equal'),
                    value:startTime
                });
                paramArry.push({
                    key:columnFormat(column,'s_equal'),
                    value:endTime
                });
            }
            
        }
    });
    if(allFilter.length>0){
        var allChart = $("#demoSave").find('.chart-content');
        allChart.each(function(e){
            var s = $(this).data('type');
            var id = '';
            var url = '';
            switch(s){
                case 'vega':
                    var jsonconfig = JSON.parse($(this).closest('.view').find('.datatag').text());
                    url = jsonconfig.data.url;
                    paramArry.map(function(item){
                        url = changeUrl(url,item.key,item.value);
                    });
                    jsonconfig.data.url = url;
                    // $(this).closest('.view').find('.datatag').text(JSON.stringify(jsonconfig))
                    id = $(this).find('.vega-embed').attr('id');
                    DrawSingleVega(id,jsonconfig,'only');
                    break;
                case 'table':
                    var jsonconfig = JSON.parse($(this).closest('.view').find('.tdatatag').text());
                    url = jsonconfig.url;
                    paramArry.map(function(item){
                        url = changeUrl(url,item.key,item.value);
                    });
                    jsonconfig.url = url;
                    // $(this).closest('.view').find('.tdatatag').text(JSON.stringify(jsonconfig))
                    id = $(this).find('.table-embed').attr('id');
                    DrawSingleTable(id,jsonconfig,'only');
                    break;
                case 'echarts':
                    var jsonconfig = JSON.parse($(this).closest('.view').find('.ecdatatag').text());
                    url = jsonconfig.data.url;
                    paramArry.map(function(item){
                        url = changeUrl(url,item.key,item.value);
                    });
                    jsonconfig.data.url = url;
                    // $(this).closest('.view').find('.ecdatatag').text(JSON.stringify(jsonconfig))
                    id = $(this).find('.echart-embed').attr('id');
                    DrawSingleEchart(id,jsonconfig,'only');
                    break;
                default:
                    break;
            }
        });
    }
},500));

function columnFormat(column,method){
    return column+"(_)"+method
}

function changeUrl(url,column,value){
    if(column == ''){
        return url;
    }
    if(url.indexOf('?') >=0){
        var urlArray = url.split('?');
        var urlParam = urlArray[1];
        var urlParamArray = urlParam.split('&');
        var ifHasColumn = false;
        urlParamArray.map(function(index,key){
            var keyVal = index.split('=');
            if(keyVal[0] == column){
                ifHasColumn = true;
                keyVal[1] = value;
                urlParamArray[key] = keyVal.join('=')
            }
        });
        if(ifHasColumn){
            url = urlArray[0]+'?' + urlParamArray.join('&');
        }
        else{
            url = url + '&'+column+'='+value;
        }
    }
    else{
        url = url + '?'+column+'='+value;
    }
    return url;
}

//初始化主题绑定
//未设置主题时,设置绑定背景色
function BindThemeAndBackGround() {
    if (oldtheme != "/frontend/css/dashthemes/default/default.css")
        replacejscssfile("/frontend/css/dashthemes/default/default.css", oldtheme, "css");
    else if ($("#globalbgpicurl").val() != "") {
        $(".demo").css("background", "url(" + $("#globalbgpicurl").val() + ") 100% top no-repeat");
        $(".demo").css("background-size", "100% 100%");
    } else if (oldtheme == "/frontend/css/dashthemes/default/default.css" && $("#globalbgpicurl").val() == "" && $("#globalbgcolor").val() != "") {
        $(".demo").parent().css("background-color", $("#globalbgcolor").val());
    }
}


function DrawSingleVega(chartid, vlconfig, drawType) {
    var diffWidth = 70;
    if (vlconfig.encoding.row || vlconfig.encoding.column || vlconfig.encoding.color || vlconfig.encoding.size) //有标签的
        diffWidth = 130;
    var width = vlconfig.width ? vlconfig.width : $("#" + chartid)[0].clientWidth; //-diffWidth;
    var height = vlconfig.height ? vlconfig.height : 260;


    ConvertVL1toVL2(vlconfig);
    ExtendDefaultConfig(vlconfig);
    $.extend(true, vlconfig, { "width": width - 5, "height": height });
    $.extend(true, vlconfig, { "autosize": { "type": "fit" } });

    
    var embedSpec = {
        mode: "vega-lite",
        spec: vlconfig,
        actions: false
    };
    vegaEmbed("#" + chartid, vlconfig, embedSpec).then(function(obj) {
        vegaTooltip.vegaLite(obj.view, obj.spec, { delay: 200, showAllFields: true });
        var url = vlconfig.data.url;
        if(drawType != 'only'){
            addSourceColumn(chartid,url);
        }
    });
}



function DrawSingleEchart(chartid, ecconfig, drawType) {
    var element = $("#" + chartid);
    var type  = ecconfig.data.type;
   
    if(drawType != 'only'){
        addSourceColumn(chartid,ecconfig.data.url);
    }
   
    buildEchart(ecconfig,element);
}

function DrawSingleTable(chartid, ecconfig, drawType){
    if(drawType != 'only'){
        addSourceColumn(chartid,ecconfig.url);
    }
    $("#" + chartid).myTableFuc(ecconfig);
}

$("#btnSave").click(function() {
    $.ajax({
        url: '/api/setscenes/',
        type: 'post',
        data: $("#dataform").serialize() //$scope.group
    }).then(function(data) {
        if (!confirm("保存成功!继续编辑请点击'确定',转到场景列表页点击'取消' ")) {
            window.location.href = "/dashboard/scenelist";
        } else
            $('#downloadModal').modal('hide');
    })

});

var contenthandle = null;
$(document).ready(function() {
    $("#menutoggle").click(function() {
        //$('.nav-collapse').collapse('toggle');
        $('.nav-collapse').css("height", $('.nav-collapse').css("height") != "0px" ? "0px" : "auto");
    });
    CKEDITOR.disableAutoInline = true;
    contenthandle = CKEDITOR.replace('contenteditor', {
        language: 'zh-cn',
        contentsCss: ['../frontend/css/bootstrap-combined.min.css'],
        allowedContent: true
    });

    $(document).on('mouseover',".chart-title",function(){
        $(this).next().show();
    });
    $(document).on('mouseleave',".chart-title",function(){
        $(this).next().hide();
    });

    window.valChange = function(e){
       console.log(e);
    }

})

})();