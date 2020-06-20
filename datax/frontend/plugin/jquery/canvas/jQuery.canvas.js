/*
涂鸦工具
依赖于:html5 canvas,jQuery,font-awesome
需要Internet Explorer 9+, Firefox, Opera, Chrome 以及 Safari 
作者:徐东强 2017-07-20 xdq025@sina.com

2017-07-20 修复第二个涂鸦会不显示工具栏的错误,修复画布涂鸦位置偏移,实现change事件
2017-10-27 支持resize,注意，单独改变height、width不会自动缩放已经涂鸦的内容
2017-11-10 修复，文本工具不会记录历史记录，导致撤销会多撤销一步的BUG
*/


function initPicShare(terminalType) {


(function () {
    String.prototype.format = function (args) {
        /// <summary>格式化字符串</summary>
        var result = this;
        if (arguments.length > 0) {
            if (arguments.length == 1 && typeof (args) == "object") {
                for (var key in args) {
                    if (args[key] != undefined) {
                        var reg = new RegExp("({" + key + "})", "g");
                        result = result.replace(reg, args[key]);
                    }
                }
            }
            else {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] != undefined) {
                        //var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题，谢谢何以笙箫的指出
                        var reg = new RegExp("({)" + i + "(})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
        }
        return result;
    };

    String.format = function (text, args) {
        /// <summary>格式化字符串</summary>
        var myStr = Array.prototype.splice.call(arguments, 0, 1);
        return myStr.toString().format.apply(arguments);
    };

})();

(function ($) {
    var myCanvas = function (options) {
        /// <summary>我的画布</summary>
        var method = Array.prototype.shift.call(arguments)
            , options = Array.prototype.shift.call(arguments)

        var ret = null;
        this.each(function () {
            var $t = $(this), flagFourceRun = false;
            if (method === true) {
                flagFourceRun = true;
            }
            else if (typeof (method) == "object"
                || method === undefined
                || method == "render") {
                options = method;
                method = "render";
                var domData = $t.data();
                var opt = $.extend(true, {}, $.fn.myCanvas.defaults);
                opt = $.extend(opt, domData, options);
                $t.data("options", opt);
            }
            else if (method == "isLoaded") {
                ret = $t.data("options") != null;
                return;
            };
            var _options = $t.data("options");
            if (flagFourceRun) {
                _options = $.extend(true, {}, $.fn.myCanvas.defaults);
                method = "render";
                $t.data("options", _options);
                var tw = $t.width()
                    , pw = $t.parent().width()
                    , th = $t.height()
                    , ph = $t.parent().height()
                    , height = th
                    , width = tw;
                if (th == 0 || tw == 0) {
                    height = ph;
                    width = pw;
                };
                var height = Math.max(200, height);
                var width = Math.max(200, width);
                var _style = $t.attr("style");
                if (_style == null || _style == undefined)
                    _style = "";
                var arr = _style.split(";");
                var obj = {};
                for (var i = 0; i < arr.length; i++) {
                    var kv = arr[i];
                    var arr1 = kv.split(":");
                    var k = arr1[0];
                    var v = arr1[1];
                    k = k.trim();
                    if (!k) continue;
                    obj[k] = v;
                };
                obj["width"] = width.toString() + "px";
                obj["height"] = height.toString() + "px";
                var _style1 = "";
                for (var k in obj) {
                    var v = obj[k];
                    if (typeof (k) == "string") {
                        _style1 = _style1 + k + ":" + v + ";";
                    }
                }
                $t.attr("style", _style1);
            }
            else {
                if (!_options ||
               (!_options.hasInited && $t.is("img")
                    && ($t.height() == 0 || $t.width() == 0))) {
                    //用于延迟加载的情况
                    function onLoad() {
                        var $t = $(this);
                        var _options = $t.data("options");
                        if (!_options || !_options.$container) {
                            //1.请确认this是否是初始化myCanvas时的元素；
                            $t.myCanvas(true);
                            _options = $(this).data("options");
                        }
                        var caller = _options[method];
                        ret = caller.call(_options, options);
                        return;
                    }
                    $t.one("load", onLoad)
                        .one("change", onLoad);
                    return;
                };
            }

            _options.$container = $t;
            var caller = _options[method];
            if (caller == null)
                throw "无法找到" + method;

            if ($.isFunction(caller))
                ret = caller.call(_options, options);
            else
                ret = caller;
        });

        return (ret === undefined || ret === null) ? this : ret;
    };

    myCanvas.defaults = {
        data: {}
        , tools: ["pencil", "text", "colors", "width", "eraser", "undo", "redo", "clear"]
        , "render": function (opt) {
            var t = this;
            if (t.$wrapper) {
                t.destory();
            }
            var size = {
                "width": t.$container.width()
                , "height": t.$container.height()
            };
            if (size.width == 0 || size.height == 0)
                throw "无法获取初始化元素的尺寸，请确认图片资源是否正确，或是否可以提前设置大小";

            t.$wrapper = $("<div/>")
                .addClass("canvas-container")
                .css(size);
            t.$canvas = $("<canvas/>")
                .addClass("my-canvas")
                .css(size)
                .attr(size);
            t.$tools = $("<div/>")
                .addClass("canvas-tools");

            t.$container.before(t.$wrapper);
            t.$wrapper.append(t.$container);
            t.$container
                .after(t.$tools)
                .after(t.$canvas);
            t.$canvas.data("model", t);
            if (terminalType && terminalType == 'phone') {
                $(".my-canvas").addClass("my-canvas-mobile");
                $(".canvas-tools").addClass("canvas-tools-mobile");
            }
            for (var i = 0; i < t.tools.length; i++) {
                var tl = t.tools[i];
                var tool = Tools[tl];
                if (tool == null) {
                    tool = tl;
                    if (tool == null) {
                        console.log("尚未实现工具:" + tl);
                        continue;
                    }
                };
                var $tool = $("<span/>")
                .attr({
                    title: myCanvas.lang[tool.title]
                });
                $tool.addClass(tool.icon).addClass(tl);
                $tool.click(tool.exec);
                t.tools[i] = tool;
                tool.$ele = $tool;
                t.$tools.append($tool);
                if (tool.init)
                    tool.init($tool, t);
            }
            Tools.initScroll.call(t);
            if (t.tools.length)
                t.tools[0].$ele.click();
            if (t.$container.attr("readonly")) {
                t.readonly(true);
            }
            t.hasInited = true;
            return t;
        }
        , "getData": function () {
            /// <summary>获取DataUrl</summary>
            return this.getCanvas().canvas.toDataURL("image/png");
        }
        , "setData": function (buffer) {
            var img = new Image();
            var t = this;
            img.onload = function () {
                //保存Size
                var cvs = t.getCanvas(), canvas = cvs.canvas;
                cvs.save();
                //var rateh = img.height / canvas.height
                //    , ratew = img.width / canvas.width;
                cvs.drawImage(img, 0, 0, canvas.width, canvas.height);
                Tools.saveHistroy(t, 1);
                //还原Size
                cvs.restore();
            }
            img.src = buffer;
            return this;
        }
        , "readonly": function (flag) {
            var t = this;
            if (flag === undefined) {
                return t._readonly;
            }
            t._readonly = !!flag;
            if (t._readonly) {
                t.$tools.hide();
                t._currentTool = null;
            }
            return t;
        }
        , "getCanvas": function () {
            /// <summary>获取画布</summary>
            //2017-08-22不再使用缓存
            return this.$canvas.get(0).getContext("2d");
        }
        , "dispose": function () {
            var t = this;
            t.$container.insertBefore(t.$wrapper);
            t.$wrapper.remove();
            delete t;
        }
        , "destory": function () {
            this.dispose.apply(this, arguments);
        }
        , "height": function (px) {
            var t = this;
            if (px) {
                px = parseInt(px);
                t.$canvas.height(px).attr("height", px);
                t.$container.height(px);
                t.$wrapper.height(px);
                return t;
            }
            return t.$container.height();
        }
        , "width": function (px) {
            var t = this;
            if (px) {
                px = parseInt(px);
                t.$canvas.width(px).attr("width", px);
                t.$container.width(px);
                t.$wrapper.width(px);
                return t;
            }
            return t.$container.height();
        }
        , "size": function (size) {
            var data = this.getData();
            this.height(size.height);
            this.width(size.width);
            this.setData(data);
        }
        , $container: null//原元素
        , $wrapper: null//包裹，在最外层
        , $canvas: null//画布
        , $tools: null//工具
        , _readonly: false
        , _currentTool: null
        , _isMouseDownInCanvas: false
        , _currentColor: "#f00"//画笔颜色
        , _currentPenWidth: 3//画笔宽度
        , _currentPos: { left: 0, top: 0 }
        , _canvasHistory: []//绘画记录
        , _canvasHistoryPoint: -1//历史记录指针
        , _currentCanvasTextStyle: {}
        , _currentText: null//当前文本输入框
        , _currentPageScroll: { x: 0, y: 0 } //页面滚动量
        , __canvas: null
        , _pencilLoc: { x: 0, y: 0 }//画笔相对画布坐标
        , _textLoc: { x: 0, y: 0 }//文本相对画布坐标   
    };

    myCanvas.lang = {
        Tool_Text: "文本工具"
        , Tool_Pencil: "画笔工具"
        , Tool_Eraser: "橡皮檫"
        , Tool_Undo: "撤销"
        , Tool_Redo: "重做"
        , Tool_Clear: "清除"
        , Tool_Colors: "颜色"
        , Tool_Width: "画笔粗细"
        , Font_Bold: "加粗"
        , Font_Italic: "斜体"
        , Font_FangSong: "仿宋"
        , Font_Kaiti: "楷体"
        , Font_YaHei: "微软雅黑"
        , Tool_Del: "删除"
        , Tip_Del: "[#确认是否删除本张背景图片#]?"
    };

    var Tools = {
        active: function () {
            var $t = $(this);
            $t.parent().find(".actived").removeClass("actived");
            $t.addClass("actived");
        }
        , showEvent: function (e) {
            if (top.IsDebug) {
                var text = [];
                text.push("type:" + e.type);
                var pos = Tools.getLocation(null, e);
                text.push("x:" + pos.x);
                text.push("x:" + pos.y);
                parent.$("#statusBar").html(text.join(","));
            }
        }
        , _initScroll: function ($p, val) {
            val.x = 0; val.y = 0;
            var good = ["auto", "scroll"]
            while ($p.length && $p[0] != document) {
                var x = $p.css("overflow-x")
                    , y = $p.css("overflow-y");
                if (good.indexOf(x) >= 0 || good.indexOf(y) >= 0) {
                    if ($p.is("html")) {
                        val.x += $("body").scrollLeft();
                        val.y += $("body").scrollTop();
                    }
                    else {
                        val.x += $p.scrollLeft();
                        val.y += $p.scrollTop();
                    }
                }
                $p = $p.parent();
            };
        }
        , _OnScroll: function (e) {
            //由事件调用
            $(this).find(".my-canvas")
            .each(function () {
                var $t = $(this), model = $t.data("model");
                if (!model)
                    return;
                Tools._initScroll($t, model._currentPageScroll);
            })
        }
        , initScroll: function () {
            /// <summary>初始化页面滚动量</summary>
            //var t = this;
            //$(document).off("scroll", Tools._OnScroll)
            //.on("scroll", Tools._OnScroll);
            //Tools._initScroll(t.$canvas, t._currentPageScroll);
        }
        , getLocation: function (model, e) {
            /// <summary>获取鼠标在画布的坐标</summary>
            //bug:当页面出现滚动条，并滚动时，画笔会上移向下滚动量；向左移动向右滚动量
            if (e.offsetX == undefined) {
                var off = $(e.target).offset();
                if (e.originalEvent.targetTouches[0] == undefined) {
                    return { x: 0, y: 0 };
                };
                return {
                    x: e.originalEvent.targetTouches[0].pageX - off.left
                    , y: e.originalEvent.targetTouches[0].pageY - off.top
                }
            }
            return {
                x: e.offsetX
                , y: e.offsetY
            };
        }
        , saveHistroy: function (model, addon) {
            /// <summary>保存历史记录</summary>
            /// <param name="model" type="Object">画布对象</param>
            /// <param name="addon" type="int">历史记录步进，通常传入1</param>
            var cvs = model.getCanvas();
            var canvas = cvs.canvas;
            if (canvas.width == 0 || canvas.height == 0) {
                if (Tools.saveHistroy._Tick == undefined)
                    Tools.saveHistroy._Tick = 0;
                if (Tools.saveHistroy._Tick > 3000) {
                    return console.log("无法加载画布尺寸！");
                }
                return setTimeout(function () {
                    Tools.saveHistroy._Tick++;
                    Tools.saveHistroy(model, addon);
                }, 10);
            };
            var dd = cvs.getImageData(0, 0, canvas.width, canvas.height);
            if (addon === null) {
                addon = -model._canvasHistoryPoint;
            }
            model._canvasHistoryPoint = model._canvasHistoryPoint + addon;
            model._canvasHistory[model._canvasHistoryPoint] = dd;
            if (model._canvasHistoryPoint > 0) {
                model.$container
                    .data("value", model.$container.myCanvas("getData"))
                    .trigger("change");
            }
            else {
                model.$container.data("value", null);
            }
            model.$container.change();
        }
        , pencil: {
            title: "Tool_Pencil"
            , icon: "fa fa-pencil"
            , exec: function (e) {
                Tools.active.call(this);
                var $t = $(this),
                    model = $t.parentsUntil(".canvas-container")
                        .last().parent().find(".my-canvas")
                        .data("model");
                model._currentTool = "pen";
                function onMouseDown(e) {
                    Tools.showEvent.apply(this, arguments);
                    var $t = $(this), model = $t.data("model");
                    if (model._currentTool == "pen") {
                        model._isMouseDownInCanvas = true;
                        var cvs = model.getCanvas();
                        model._pencilLoc = { x: cvs.canvas.offsetLeft, y: cvs.canvas.offsetTop };
                        var pos = Tools.getLocation(model, e, model._pencilLoc);
                        cvs.beginPath();
                        cvs.moveTo(pos.x, pos.y);
                        cvs.strokeStyle = model._currentColor;
                        cvs.shadowColor = model._currentColor;
                        cvs.lineWidth = model._currentPenWidth;

                        e.preventDefault();
                        return false;
                    }
                }
                function onMouseMove(e) {
                    Tools.showEvent.apply(this, arguments);
                    var $t = $(this), model = $t.data("model"), canvas = model.$canvas[0];
                    var cvs = model.getCanvas();
                    if (model._currentTool == "pen" && model._isMouseDownInCanvas) {
                        var loc = Tools.getLocation(model, e, model._pencilLoc);
                        cvs.lineTo(loc.x, loc.y);
                        cvs.stroke();
                        //console.log("pencil line {0}".format(JSON.stringify(loc)));
                    }
                }
                function onMouseUp() {
                    Tools.showEvent.apply(this, arguments);
                    var $t = $(this), model = $t.data("model");
                    if (model._currentTool == "pen" && model._isMouseDownInCanvas) {
                        var cvs = model.getCanvas();
                        cvs.closePath();
                        Tools.saveHistroy(model, 1);
                        //console.log("pencil up");
                    }
                    model._isMouseDownInCanvas = false;
                }
                model.$canvas
                    .unbind("mousedown")
                    .unbind("mouseup")
                    .unbind("mousemove")
                    .unbind("touchstart")
                    .unbind("touchend")
                    .unbind("touchmove")
                    .bind("mousedown", onMouseDown)
                    .bind("mouseup", onMouseUp)
                    .bind("mousemove", onMouseMove)
                    .bind("touchstart", onMouseDown)
                    .bind("touchend", onMouseUp)
                    .bind("touchmove", onMouseMove)
                ;

                e.preventDefault();
                return false;
            }
        }
        , text: {
            title: "Tool_Text"
            , icon: "fa fa-font"
            , exec: function (e) {
                Tools.active.call(this);
                var $t = $(this),
                    model = $t.parentsUntil(".canvas-container")
                        .last().parent().find(".my-canvas")
                        .data("model");
                model._currentTool = "text";
                function onMouseClick(e) {
                    var $t = $(this), model = $t.data("model");
                    if (model._currentTool == "text") {
                        if (e.fromElement == null || e.fromElement === e.toElement) {
                            if (model._currentText == null) {
                                var $t = $(this),
                                model = $t.data("model");
                                var $text = $("<div/>")
                                .addClass("canvas-text");
                                model.$wrapper.append($text);
                                model._currentText = $text;
                                model._textLoc = Tools.getLocation(model, e, model._textLoc);
                                console.log(JSON.stringify(model._textLoc));
                                var template = '<div>\
<input type="checkbox" value="bold" id="font-weight"/>\
<label for="font-weight">{0}</label>\
<input type="checkbox" value="italic" id="font-style"/>\
<label for="font-style">{1}</label>\
<select id="font-size">\
<option>9px</option><option >12px</option><option selected=selected>15px</option><option>21px</option><option>30px</option><option>50px</option>\
</select>\
<select id="font-family">\
<option value="FangSong">{2}</option><option value="KaiTi">{3}</option><option value="Microsoft YaHei">{4}</option><option value="Arial">Arial</option>\
</select>\
</div>';
                                template = template.format(myCanvas.lang.Font_Bold, myCanvas.lang.Font_Italic, myCanvas.lang.Font_FangSong, myCanvas.lang.Font_Kaiti, myCanvas.lang.Font_YaHei)
                                var $tools = $(template).addClass("canvas-text-tools");
                                var $input = $("<input type='text'/>")
                                    .addClass("form-control")
                                .addClass("canvas-text-input");
                                $text
                                    .append($tools)
                                    .append($input)
                                $text.css({
                                    top: e.offsetY
                                    , left: e.offsetX
                                });
                                $tools.find("input,select")
                                    .change(function () {
                                        var $t = $(this)
                                            , id = $t.attr("id")
                                            , val = null
                                            , $input = $t.parent().parent().find(".canvas-text-input")
                                        ;
                                        if ($t.is("input")) {
                                            if ($t.prop("checked")) {
                                                val = $t.val();
                                            }
                                            else {
                                                val = "normal";
                                            }
                                        }
                                        else {
                                            val = $t.find(":selected");
                                            if (val.attr("value")) {
                                                val = val.attr("value");
                                            }
                                            else {
                                                val = val.text().trim();
                                            }
                                        }
                                        model._currentCanvasTextStyle[id] = val;
                                        $input.css(id, val);
                                    }).change();
                                e.preventDefault();
                                return false;
                            }
                            else {
                                var txt = model._currentText.find(".canvas-text-input").val();
                                var cvs = model.getCanvas();
                                cvs.font = "{0} normal {1} {2} {3}"
                                    .format(
                                        model._currentCanvasTextStyle["font-style"]
            , model._currentCanvasTextStyle["font-weight"]
            , model._currentCanvasTextStyle["font-size"]
            , model._currentCanvasTextStyle["font-family"]
                                    );
                                cvs.fillStyle = model._currentColor;
                                cvs.fillText(txt, model._textLoc.x, model._textLoc.y);
                                model._currentText.remove();
                                model._currentText = null;
                            }
                            Tools.saveHistroy(model,1);
                        }
                        else {
                        }
                    }
                    else {
                        if (model._currentText) {
                            model._currentText.remove();
                            model._currentText = null;
                        }
                    }
                }
                model.$canvas
                    .unbind("click")
                    .bind("click", onMouseClick);

                e.preventDefault();
                return false;
            }
        }
        , eraser: {
            title: "Tool_Eraser"
            , icon: "fa fa-eraser"
            , exec: function () {
                Tools.active.call(this);
                var $t = $(this),
                    model = $t.parentsUntil(".canvas-container")
                        .last().parent().find(".my-canvas")
                        .data("model");
                model._currentTool = "eraser";
                function onMouseDown(e) {
                    var $t = $(this),
                     model = $t.data("model");
                    if (model._currentTool == "eraser") {
                        model._isMouseDownInCanvas = true;
                        var pos = Tools.getLocation(model, e, { x: 0, y: 0 });
                        var cvs = model.getCanvas();
                        var half = model._currentPenWidth / 2;
                        half = Math.ceil(half);
                        cvs.clearRect(pos.x - half, pos.y - half, 2 * half, 2 * half);
                        e.preventDefault();
                        return false;
                    }
                }

                function onMouseMove(e) {
                    var $t = $(this),
                     model = $t.data("model");
                    if (model._currentTool == "eraser" && model._isMouseDownInCanvas) {
                        var pos = Tools.getLocation(model, e, { x: 0, y: 0 });
                        var cvs = model.getCanvas();
                        var width = model._currentPenWidth * 4;//粗一点！
                        var half = width / 2;
                        cvs.clearRect(pos.x - half, pos.y - half, width, width);
                    }
                }


                function onMouseUp(e) {
                    var $t = $(this),
                     model = $t.data("model");
                    if (model._currentTool == "eraser" && model._isMouseDownInCanvas) {
                        Tools.saveHistroy(model, 1);
                    }
                    model._isMouseDownInCanvas = false;
                }

                model.$canvas
                    .unbind("mousedown")
                    .unbind("mouseup")
                    .unbind("mousemove")
                    .unbind("touchstart")
                    .unbind("touchend")
                    .unbind("touchmove")
                    .bind("mousedown", onMouseDown)
                    .bind("mouseup", onMouseUp)
                    .bind("mousemove", onMouseMove)
                    .bind("touchstart", onMouseDown)
                    .bind("touchend", onMouseUp)
                    .bind("touchmove", onMouseMove)
                ;
            }
        }
        , undo: {
            title: "Tool_Undo"
            , icon: "fa fa-undo"
            , exec: function (e) {
                var $t = $(this)
                    , model = $t.parentsUntil(".canvas-container")
                        .last().parent().find(".my-canvas")
                        .data("model");
                var canvas = model.$canvas[0];
                var cvs = model.getCanvas();
                if (model._canvasHistoryPoint > 0)
                    model._canvasHistoryPoint--;
                var img = model._canvasHistory[model._canvasHistoryPoint];
                if (img)
                    cvs.putImageData(img, 0, 0);
                e.preventDefault();
                return false;
            }
            , init: function ($ele, model) {
                model._canvasHistoryPoint = -1;
                Tools.saveHistroy(model, 1);
            }
        }
        , redo: {
            title: "Tool_Redo"
            , icon: "fa fa-repeat"
            , exec: function (e) {
                var $t = $(this)
                    , model = $t.parentsUntil(".canvas-container")
                        .last().parent().find(".my-canvas")
                        .data("model");
                var canvas = model.$canvas[0];
                var cvs = model.getCanvas();
                if (model._canvasHistoryPoint + 1 < model._canvasHistory.length)
                    model._canvasHistoryPoint++;
                var img = model._canvasHistory[model._canvasHistoryPoint];
                if (img)
                    cvs.putImageData(img, 0, 0);
                e.preventDefault();
                return false;
            }
        }
        , clear: {
            title: "Tool_Clear"
            , icon: "fa fa-remove"
            , exec: function (e) {
                var $t = $(this)
                    , model = $t.parentsUntil(".canvas-container")
                        .last().parent().find(".my-canvas")
                        .data("model");
                var canvas = model.$canvas[0];
                var cvs = model.getCanvas();
                cvs.clearRect(0, 0, canvas.width, canvas.height);
                var dd = cvs.getImageData(0, 0, cvs.canvas.width, cvs.canvas.height);
                Tools.saveHistroy(model, 1);
                e.preventDefault();
                return false;
            }
        }
        , colors: {
            title: "Tool_Colors"
            , icon: "fa fa-spinner"
            , options: ["#000", "#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff", "#fff"]
            , exec: function (e) {
                var $t = $(this)
                , $menu = $t.data("menu")
                , colors = Tools.colors.options;
                if ($menu == null) {
                    $menu = $("<ul>")
                    .addClass("canvas-tools-menu")
                    .addClass("canvas-tools-colors")
                    for (var i = 0; i < colors.length; i++) {
                        var c = colors[i];
                        var $li = $("<li/>");
                        $li.addClass("fa fa-circle")
                        .css({
                            "color": c
                        })
                        .attr("data-color", c)
                        .data("control", this)
                        .click(function () {
                            var $t = $(this)
                            , model = $t.parentsUntil(".canvas-container")
                            .last().parent().find(".my-canvas")
                            .data("model");
                            model._currentColor = $t.data("color");
                            var ctr = $t.data("control")
                            $(ctr).css("color", model._currentColor);
                            $t.parent().hide();
                        });
                        $menu.append($li);
                    }
                    $t.parent().append($menu);
                }
                var pos = $t.position();
                $menu.css({
                    left: pos.left
                    , top: pos.top + $t.outerHeight(true)
                }).show();

                e.preventDefault();
                return false;
            }
            , init: function ($ele, model) {
                $ele.css("color", model._currentColor);
            }
        }
        , width: {
            title: "Tool_Width"
            , options: ["1px", "2px", "4px", "8px", "16px", "32px", "64px"]
            , icon: "fa fa-circle"
            , exec: function (e) {
                var $t = $(this)
               , $menu = $t.data("menu")
               , widths = Tools.width.options;
                if ($menu == null) {
                    $menu = $("<ul>")
                    .addClass("canvas-tools-menu")
                    .addClass("canvas-tools-width")
                    for (var i = 0; i < widths.length; i++) {
                        var w = widths[i], wi = parseInt(w);
                        var height = Math.max(21, wi).toString() + "px";
                        var $icon = $("<i>")
                            .addClass("fl")
                        .css({
                            width: w
                            , height: w
                            , border: "1px solid rgba(255, 255, 255,0)"
                            , "border-radius": w
                            , "background-color": "#000"
                            , "margin-top": wi > 12 ? "auto" : ((12 - wi).toString() + "px")
                        });
                        var $lable = $("<a/>")
                        .addClass("fr")
                        .html(w);
                        var $li = $("<li/>");
                        $li.append($icon).append($lable)
                        .css({
                            "line-height": height
                            , "height": height
                        })
                        $li
                        .click(function () {
                            var $t = $(this)
                            , model = $t.parentsUntil(".canvas-container")
                            .last().parent().find(".my-canvas")
                            .data("model");
                            model._currentPenWidth = parseInt($t.text());
                            $t.parent().hide();
                        });
                        $menu.append($li);
                    }
                    $t.parent().append($menu);
                }
                $menu.css({
                    left: 0
                    , top: $t.outerHeight(true)
                }).show();
                e.preventDefault();
                return false;
            }
        }
        , del: {
            title: "Tool_Del"
            , icon: "fa fa-remove"
            , exec: function (e) {
                var $t = $(this)
                    , $container = $t.parentsUntil(".canvas-container")
                       .last().parent()
                    , $that = $container.find(".my-canvas")
                    , model = $that.data("model");
                var rs=model.$container.triggerHandler("beforedelete");
                if (rs !== false) {
                    if (rs === "beforedelete")
                    {
                        model.$container.on("confirmdelete", function () {
                            model.$container
                                .off("confirmdelete")
                            .off("canceldelete");
                            model.$container.trigger("delete");
                            $container.remove();
                        }).on("canceldelete", function () {
                            model.$container
                                .off("confirmdelete")
                            .off("canceldelete");
                        });
                    } else {
                        model.$container.trigger("delete");
                        $container.remove();
                    }
                };
                Tools.saveHistroy(model, 1);
                e.preventDefault();
                return false;
            }
        }
    };

    myCanvas.Tools = Tools;


    $.fn.myCanvas = myCanvas;

    $(function () {

        var $t = $(".myCanvas");
        $t.myCanvas();
    });

})(jQuery);
}