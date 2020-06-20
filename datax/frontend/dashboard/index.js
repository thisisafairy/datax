(function () {

    var app = angular.module('appdesignboard', ['ui.bootstrap']);

    app.controller("designcontroller", function ($scope, $http, $timeout) {
        $http.get('/api/type/getTypeList').then(function (rs) {
            $scope.enumkinds = rs.data;
        });
        $scope.param = {};
        $scope.data = {}; // 参数
        $scope.data.param = $scope.param;
        $scope.group = {};
        $scope.basicconfigobj = {};

        $scope.queryList = function (page) {
            $scope.data.startIndex = (page - 1) * $scope.count; //分页起始位置
            $scope.data.count = $scope.count; //分页条数
            $scope.data.orderBy = "id ASC"; //排序
            $.ajax({
                url: '/api/getAllcharts/?format=json',
                type: 'get',
                data: $scope.data
            }).then(function (data) {
                $scope.kinds = mapData(data.datas);
                $scope.$apply(function () {
                    $scope.time = new Date();
                });
                $timeout(function () {
                    InitUI();
                }, 100);
                // window.setTimeout("InitUI()", 100);
            });
        };
        //查找所有主题
        $scope.globalthemelist=[];
        $http.get('/api/getAllChartsbgConf').then(function (rs) {
            $scope.globalthemelist=rs.data.data;
            // console.log(rs.data.data);
        })
        $scope.queryList($scope.page);
        if (GetQueryString("id") != "") {
            $.ajax({
                url: '/api/dash/getScene/' + GetQueryString("id"),
                type: 'get'
            }).then(function (data) {

                $scope.group = data;
                if (data.basicconfig && data.basicconfig != "") { $scope.basicconfigobj = JSON.parse(data.basicconfig) || {}; }
                // console.log("basicconfig:",$scope.basicconfigobj);
                if (!$scope.basicconfigobj.globaltheme) { $scope.basicconfigobj.globaltheme = "/frontend/css/dashthemes/default/default.css"; }
                oldtheme = $scope.basicconfigobj.globaltheme;
                // console.log("globalbgpicurl:",$scope.basicconfigobj.globalbgpicurl);
                // console.log("globalbgcolor:",$scope.basicconfigobj.globalbgcolor);
                BindThemeAndBackGroundByModelValue();    //同一控件，初始化的时候ng-model里有值，但$("#XXX").val()取值为空,
                // console.log("vvvvglobalbgpicurl:",$("#globalbgpicurl").val());
                // console.log("wwwwwwwwglobalbgcolor:",$("#globalbgcolor").val());
                $("#id").val(GetQueryString("id"));
                if (data.htmlrawstring) {
                    $(".demo").html(data.htmlrawstring);
                    InitChartViews();
                }
            });
        }
        if(!$scope.basicconfigobj.globaltheme){     //新建报表时给初始值，避免初始化时多产生一个undefined的option
            $scope.basicconfigobj.globaltheme = "/frontend/css/dashthemes/default/default.css";
        }
        function BindThemeAndBackGroundByModelValue() {
            if (oldtheme != "/frontend/css/dashthemes/default/default.css") { replacejscssfile("/frontend/css/dashthemes/default/default.css", oldtheme, "css"); }
            else if ($scope.basicconfigobj.globalbgpicurl != "") {
                $(".demo").css("background", "url(" + $scope.basicconfigobj.globalbgpicurl + ") 100% top no-repeat");
                $(".demo").css("background-size", "100% 100%");
            } else if (oldtheme == "/frontend/css/dashthemes/default/default.css" && $scope.basicconfigobj.globalbgpicurl == "" && $scope.basicconfigobj.globalbgcolor != "") {
                $(".demo").parent().css("background-color", $scope.basicconfigobj.globalbgcolor);
            }
        }

        $scope.relationConfig = [];


        $scope.oldRelationid = [];
        var backshowrelation=true;
        $scope.relationModal = function () {
            var chart = new relation();
            $scope.sourceChartList = angular.copy(chart.getSourceChart());
            $scope.allChart = angular.copy(chart.getChart());
            if(backshowrelation){
                //查找每个chart的click跳转到其他chart事件的关联
                //获取echarts的text，获取event并回显
                var rltchartdivs = $(document.body).find("div.demo").find("div.echart-embed");
                rltchartdivs.each(function () {
                    var tempRtConf={};
                    var rltparentdiv = $(this).closest('.chart-content');
                    var rlttype = rltparentdiv[0].getAttribute('data-type');
                    if (rlttype == 'echarts') {
                        rltdatatag = $(rltparentdiv).closest('.view').find("span.ecdatatag");
                        rltvlconfig = JSON.parse(rltdatatag.text());
                        //获取event的值显示到数据关联里
                        // console.log('chart=',vlconfig);
                        if(rltvlconfig.event&&rltvlconfig.event.eventtype !=undefined && rltvlconfig.event.eventtype =='relation'){
                            tempRtConf['source']=rltvlconfig.event.source;
                            tempRtConf['target']=rltvlconfig.event.target;
                            $scope.relationConfig.push(tempRtConf);
                        }
                    }
                    else if (rlttype == 'table') {
                        rltdatatag = $(rltparentdiv).closest('.view').find("span.tdatatag");
                        rltvlconfig = JSON.parse(rltdatatag.text());
                        //获取event显示到数据关联里
                        // console.log('table=',vlconfig);
                        if(rltvlconfig.event && rltvlconfig.event.eventtype !=undefined && rltvlconfig.event.eventtype =='relation'){
                            tempRtConf['source']=rltvlconfig.event.source;
                            tempRtConf['target']=rltvlconfig.event.target;
                            $scope.relationConfig.push(tempRtConf);
                        }
                    }
                });
                //查找结束
                if($scope.relationConfig.length==0){
                    $scope.relationConfig = [{
                        source: {
                            id: '',
                            field: ''
                        },
                        target: []
                    }];
                }
                // console.log('relationConfig=',$scope.relationConfig);
                //$scope.relationConfig回显赋值结束
                backshowrelation=false;
            }

            if ($scope.relationConfig.length > 0) {
                var idAry = [];

                $scope.relationConfig.map(function (row) {
                    idAry.push(row.source.id);
                });
                var nowchart = $scope.sourceChartList.filter(function (rowChart) {
                    return idAry.indexOf(rowChart.id) > -1;
                });
                if (nowchart.length == 0) {
                    $scope.relationConfig = [{
                        source: {
                            id: '',
                            field: ''
                        },
                        target: []
                    }];
                }
            }
            $timeout(function () {
                $("#relationModal").modal();
                $("#relationModal").draggable({
                    cursor: "move",
                    handle: '.modal-header'
                });
            });
        };

        $scope.mapField = function (i) {
            // var chart = new relation();
            var id = $scope.relationConfig[i].source.id;
            var json = getChartJson(id);
            $scope.relationConfig[i].source.field = getChartField(json);
        };
        $scope.addTarget = function (index) {
            $scope.relationConfig[index].target.push({
                id: ''
            });
        };
        $scope.addSource = function(){
            $scope.relationConfig.push({
                source: {
                    id: '',
                    field: ''
                },
                target: []
            });
        };
        $scope.delTarget = function (index,num) {
            $scope.relationConfig[index].target.splice(num, 1);
            if($scope.relationConfig[index].target.length==0){//如果target为[]就删除relationConfig[index]
                oldRelaObj=$scope.relationConfig.splice(index,1);
                //删除了relationConfig后需要删除对应写入echarts代码里的event，否则删除不会成功，（另外一种不删除只留第一句代码，结果是数据关联弹出框的源图表删除不了，功能一样但展示出结果让人误解没有删除）
                oldRelaObj=oldRelaObj[0];
                old_config = getChartJson(oldRelaObj.source.id);
                old_config.event = {};
                old_config.hasEvent = '0';
                DrawSingleEchart(oldRelaObj.source.id, old_config, 'only');
                setConfig(oldRelaObj.source.id, old_config);
            }
            if($scope.relationConfig.length==0){//如果relationConfig为空，就添加一个空白
                $scope.relationConfig.push({
                    source: {
                        id: '',
                        field: ''
                    },
                    target: []
                });
            }
        };
        $scope.saveRelation = function () {
            var config, old_config,id;
            if ($scope.relationConfig.length ==  0) {
                return false;
            }
            console.log($scope.relationConfig);
            //下面的语句运行比较耗时，点击保存后需要等待3到5秒
            //将设置的数据关联写入到echarts代码
            $scope.relationConfig.map(function (relationRow, i){
                id = relationRow.source.id;
                if (id !== '') {
                    config = getChartJson(id);
                    config.hasEvent = '1';
                    config.event = angular.copy(relationRow);
                    config.event.eventtype = 'relation';
                    DrawSingleEchart(id, config, 'only');
                    setConfig(id, config);
                }
                if ($scope.oldRelationid[i] && $scope.oldRelationid[i] != id) {
                    old_config = getChartJson($scope.oldRelationid[i]);
                    old_config.event = {};
                    old_config.hasEvent = '0';
                    DrawSingleEchart($scope.oldRelationid[i], old_config, 'only');
                    setConfig($scope.oldRelationid[i], old_config);
                }
                $scope.oldRelationid[i] = id;
            });
        };

        $scope.setConfig = function () {

        };
        $scope.range = [];
        var i = 0;
        while (i < 21) {
            $scope.range.push(2000 + i);
            i++;
        }
        /**
         * angular 变量
         */
        $scope.supportEventType = ['bmap', 'pie', 'funnel', 'mixed'];
        /**
         * 变量
         */
        var layouthistory;
        // var currentDocument = null;
        var timerSave = 1000;
        var stopsave = 0;
        var startdrag = 0;
        // var demoHtml = $(".demo").html();
        var currenteditor = null;
        var currentcolumneditor = null;
        var currentcharteditor = null;
        var currentcharteditorSpan = null;
        var chartColumn = [];
        var chartColumnConf = [];//将值保存到chartColumnConf里用于目标列下拉获取列的所有值，显示再下拉选项中
        var oldtheme = "";
        var contenthandle = null;
        var startColWidth = "";
        $scope.chartsbg=new Array();//字典，用于存储每个图表的背景颜色和透明度
        $scope.sourceChartList = [];
        /**
         * 函数
         */
        // $timeout(function(){
        //     new PerfectScrollbar('.scroll-y', {
        //         suppressScrollX: true
        //     });
        // });
        function mapData(arr) {
            var map = {},
                dest = [];
            for (var i = 0; i < arr.length; i++) {
                var ai = arr[i];
                if (!map[ai.kind]) {
                    dest.push({
                        kind: ai.kind,
                        data: [ai]
                    });
                    map[ai.kind] = ai;
                } else {
                    for (var j = 0; j < dest.length; j++) {
                        var dj = dest[j];
                        if (dj.kind == ai.kind) {
                            dj.data.push(ai);
                            break;
                        }
                    }
                }
            }
            return dest;
        }

        function GetQueryString(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var r = window.location.search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
            var context = "";
            if (r != null) { context = r[2]; }
            reg = null;
            r = null;
            return context == null || context == "" || context == "undefined" ? "" : context;
        }

        function createjscssfile(filename, filetype) {
            var fileref;
            if (filetype == "js") {
                fileref = document.createElement('script');
                fileref.setAttribute("type", "text/javascript");
                fileref.setAttribute("src", filename);
            } else if (filetype == "css") {
                fileref = document.createElement("link");
                fileref.setAttribute("rel", "stylesheet");
                fileref.setAttribute("type", "text/css");
                fileref.setAttribute("href", filename);
            }
            return fileref;
        }

        function replacejscssfile(oldfilename, newfilename, filetype) {
            var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none";
            var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none";
            var allsuspects = document.getElementsByTagName(targetelement);
            // console.log('oldfilename=',oldfilename);
            for (var i = allsuspects.length; i >= 0; i--) {
                if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(oldfilename) != -1) {
                    var newelement = createjscssfile(newfilename, filetype);
                    // console.log('newelement=',newelement);
                    // console.log('allsuspects[i]=',allsuspects[i]);
                    allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
                    break;
                }
            }
        }
        /**
         * 判断浏览器是否支持 localStorage
         */
        function supportstorage() {
            if (typeof window.localStorage == 'object') {
                return true;
            }
            else { return false; }
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
        /**
         * 自动保存 配置步骤
         */
        function saveLayout() {
            var data = layouthistory;
            if (!data) {
                data = {};
                data.count = 0;
                data.list = [];
            }
            if (data.list.length > data.count) {
                for (var i = data.count; i < data.list.length; i++) {
                    data.list[i] = null;
                }
            }
            data.list[data.count] = window.demoHtml;
            data.count++;
            if (supportstorage()) {
                localStorage.setItem("layoutdata", JSON.stringify(data));
            }
            layouthistory = data;
        }
        /**
         * 撤销
         */
        function undoLayout() {
            var data = layouthistory;
            //console.log(data);
            if (data) {
                if (data.count < 2) { return false; }
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
        /**
         * 还原
         */
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

        /**
         * 给拖拽进框架里的 选项卡和轮播图 取一个唯一的id，并初始化
         */
        function handleJsIds() {
            handleCarouselIds();
            handleTabsIds();
        }

        function handleCarouselIds() {
            var e = $(".demo").find("#myCarousel");
            var t = randomNumber();
            var n = "carousel-" + t;
            e.attr("id", n);
            e.find(".carousel-indicators li").each(function (e, t) {
                $(t).attr("data-target", "#" + n);
            });
            e.find(".left").attr("href", "#" + n);
            e.find(".right").attr("href", "#" + n);
        }

        function handleTabsIds() {
            var e = $(".demo").find("#myTabs");
            var t = randomNumber();
            var n = "tabs-" + t;
            e.attr("id", n);
            e.find(".tab-pane").each(function (e, t) {
                var n = $(t).attr("id");
                var r = "panel-" + randomNumber();
                $(t).attr("id", r);
                $(t).parent().parent().find("a[href='#" + n + "']").attr("href", "#" + r);
            });
        }

        /**
         * 随机数
         */
        function randomNumber() {
            return randomFromInterval(1, 1e6);
        }

        function randomFromInterval(e, t) {
            return Math.floor(Math.random() * (t - e + 1) + e);
        }

        /**
         * 布局组件，自定义 比例长度
         */
        function gridSystemGenerator() {
            $(".lyrow .preview input").bind("keyup", function () {
                var e = 0;
                var t = "";
                var n = $(this).val().split(" ", 12);
                $.each(n, function (n, r) {
                    e = e + parseInt(r);
                    t += '<div class="column cell-box col-md-' + r + '"></div>';
                });
                if (e == 12) {
                    $(this).parent().next().children().html(t);
                    // $(this).parent().prev().show();
                } else {
                    $(this).parent().prev().hide();
                }
            });
        }

        function configurationElm() {
            $(".demo").delegate(".configuration > a", "click", function (e) {
                e.preventDefault();
                var t = $(this).parent().next().next().children();
                $(this).toggleClass("active");
                t.toggleClass($(this).attr("rel"));
            });
            $(".demo").delegate(".configuration .dropdown-menu a", "click", function (e) {
                e.preventDefault();
                var t = $(this).parent().parent();
                var n = t.parent().parent().next().next().children();
                t.find("li").removeClass("active");
                $(this).parent().addClass("active");
                var r = "";
                t.find("a").each(function () {
                    r += $(this).attr("rel") + " ";
                });
                t.parent().removeClass("open");
                n.removeClass(r);
                n.addClass($(this).attr("rel"));
            });
        }
        /**
         * 删除组件
         */
        function removeElm() {
            $(".demo").delegate(".remove", "click", function (e) {
                e.preventDefault();
                var delayTime=0;
                //如果被删除的是filter就根据现有filter重绘图表
                var deleteFilterObj=$(this).parent().find('.filter-module');
                if(deleteFilterObj && deleteFilterObj.val() !='' && deleteFilterObj.val() != 'pleaseSelectMyDataIn' && deleteFilterObj.val() != 'null' && deleteFilterObj.val() != null){
                    deleteFilterObj.val('').trigger('change');
                    delayTime=500;//如果删除有值的过滤器，则需要重新绘制图表，需要延迟删除才能实现效果
                }
                //再删除控件的时候检测filter组件的parent是否有
                // filterFrameStyle，有机删除类filterFrameStyle
                var thisFrameObj=$(this).parent();//找到框子改
                if(thisFrameObj.children('.box-element').length==1){//当框子里只剩一个的时候就去掉样式，后面的代码会把最后这一个删除掉
                    thisFrameObj.removeClass('filterFrameStyle');//如果是过滤器就去掉过滤器的样式
                    // thisFrameObj.removeClass('staticFrameStyle');//如果是静态文本就去掉静态文本的样式
                    thisFrameObj.removeClass('alertFrameStyle');//如果是alert提示文本就去掉alert提示文本的样式
                    // thisFrameObj.css('cssText','');
                    thisFrameObj.removeAttr('style');
                }
                //删除样式完毕
                clearAddtionText($(this).parent());
                clearChartColumn($(this).parent());
                clearFilter();

                setTimeout(function () {
                    thisFrameObj.remove();//为响应trigger事件，需要延迟删除
                    if ($(".demo .lyrow").length <= 0) {
                        clearDemo();
                    }
                },delayTime);
            });
        }
        /**
         * 清空容器
         */
        function clearDemo() {
            $(".demo").empty();
            layouthistory = null;
            if (supportstorage()) {
                localStorage.removeItem("layoutdata");
            }
        }

        /**
         * 预览等无法编辑容器的模式的时候 去掉拖拽的按钮
         */
        function removeMenuClasses() {
            $("#menu-layoutit li button").removeClass("active");
        }

        function changeStructure(e, t) {
            $("#download-layout ." + e).removeClass(e).addClass(t);
        }

        /**
         *  删除标签
         * @param {string} 需要删除的标签
         */
        function cleanHtml(e) {
            $(e).parent().append($(e).children().html());
        }

        /**
         * 保存布局时，删除最后展示时候不需要的元素  例如 删除按钮 ，保存按钮等
         */
        function downloadLayoutSrc() {
            $("#download-layout").children().html($(".demo").html());
            var t = $("#download-layout").children();
            t.find(".preview, .configuration, .drag, .remove").remove();
            t.find(".lyrow").addClass("removeClean");
            t.find(".box-element").addClass("removeClean");
            t.find(".lyrow .lyrow .lyrow .lyrow .lyrow .removeClean").each(function () {
                cleanHtml(this);
            });
            t.find(".lyrow .lyrow .lyrow .lyrow .removeClean").each(function () {
                cleanHtml(this);
            });
            t.find(".lyrow .lyrow .lyrow .removeClean").each(function () {
                cleanHtml(this);
            });
            t.find(".lyrow .lyrow .removeClean").each(function () {
                cleanHtml(this);
            });
            t.find(".lyrow .removeClean").each(function () {
                cleanHtml(this);
            });
            t.find(".removeClean").each(function () {
                cleanHtml(this);
            });
            //对于表格组件在分页栏里表头显示宽高异常状况处理,
            //处理办法：当保存的时候将表格组件的tab页显示为active（这样就不会有显示问题），这里只是暂时处理成这样，还不够完善，
            tabPane=[];
            tabPane=t.find(".tabbable:last").find(".box-element").parent().parent('.tab-pane');
            if(tabPane && tabPane.length>0){
                panCount=0;
                tabPane.each(function () {//分析每一个tabpane
                    tabPaneO=this;
                    tabPandId=tabPaneO.id;
                    if((/^(panel-)\d{3,}/).test(tabPandId)){//正则表达式判断是否有正确id，如果有就是分页栏
                        tabPaneJqyObj=tabPane.eq(panCount);//获取jquery对象,直接使用tabPaneO会出错，DOM结构没有hasclass方法
                        if(!tabPaneJqyObj.hasClass('active') && tabPaneJqyObj.find('table')){//如果没有选中表格组件这个分页面就代码来选择
                            if(tabPaneJqyObj.prev().hasClass('active')){
                                tabPaneJqyObj.prev().removeClass('active')
                            }
                            tabPaneJqyObj.addClass('active');
                            //修改分页选择按钮处的active
                            ultag=tabPaneJqyObj.parent().prev();
                            ultag.find('li').removeClass('active');
                            ultag.find('li').eq(panCount).addClass('active');
                        }
                    }
                    panCount+=1;
                })
            }
            //处理结束
            //***对tab进行特殊处理
            tabboxdiv=t.find(".tabbable:last").find(".box-element");
            if(typeof(tabboxdiv)!="undefined"){//选择view
                // console.log('tabboxdiv.length=',tabboxdiv.length);
                tabboxdiv.each(function () {    //把每个view里的html转存为box-element的兄弟节点(view是box-element的孩子节点)
                    cleanHtml(this);
                });
                tabboxdiv.find(".view").removeClass(".view");//移除view类，在下一步removeClean会删除多余的html，保留的html和直接拉一个图表到布局设置框里一样
            }
            //***处理完毕

            t.find(".removeClean").remove();
            $("#download-layout .column").removeClass("ui-sortable");
            $("#download-layout .row-fluid").children().removeClass("column");
            if ($("#download-layout .container").length > 0) {
                changeStructure("row-fluid", "row");
            }
            $("#download-layout").find('img').remove();
            $("#download-layout").find(".dt-bootstrap").remove();
            var formatSrc = $.htmlClean($("#download-layout").html(), {
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
                    ['data-width'],
                    ['data-height'],
                    ['data-filter-type'],
                    ['data-default'],
                    ['data-method'],
                    ['data-start'],
                    ['data-end'],
                    ["onclick"]
                ]
            });
            $("#download-layout").html(formatSrc);
            $("#downloadModal textarea").empty();
            $("#downloadModal textarea").val(formatSrc);
            $("#htmlrawstring").val(window.demoHtml);

            $timeout(function () {
                $("#downloadModal").draggable({
                    cursor: "move",
                    handle: '.modal-header'
                });
            })
        }
        /**
         * 初始化 容器内的拖拽排序
         */
        function initContainer() {
            $(".demo, .demo .column").sortable({
                connectWith: ".column",
                opacity: 0.35,
                handle: ".drag",
                start: function () {
                    if (!startdrag) { stopsave++; }
                    startdrag = 1;
                },
                stop: function () {
                    if (stopsave > 0) { stopsave--; }
                    startdrag = 0;
                }
            });
            $("#elmBase").sortable({
                connectWith: ".boxes",
                opacity: 0.35,
                handle: ".drag",
                start: function () {
                    if (!startdrag) { stopsave++; }
                    startdrag = 1;
                },
                stop: function () {
                    if (stopsave > 0) { stopsave--; }
                    startdrag = 0;
                }
            });
            configurationElm();
        }
        function InitUI() {
            $(".sidebar-nav .lyrow").draggable({
                connectToSortable: ".demo",
                helper: "clone",
                handle: ".drag",
                start: function () {
                    $(".sidebar-nav").removeClass("scroll-y");
                    if (!startdrag) { stopsave++; }
                    startdrag = 1;
                },
                drag: function (e, t) {
                    t.helper.width(400);
                },
                stop: function () {
                    $(".demo .column").sortable({
                        opacity: 0.35,
                        connectWith: ".column",
                        start: function () {
                            if (!startdrag) { stopsave++; }
                            startdrag = 1;
                        },
                        stop: function () {
                            if (stopsave > 0) { stopsave--; }
                            startdrag = 0;
                        }
                    });
                    if (stopsave > 0) { stopsave--; }
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
                start: function (e, t) {
                    var t_type = t.helper.closest('.accordion-group').data('key');
                    t.helper.attr('data-module-type', t_type);
                    $(".sidebar-nav").removeClass("scroll-y");
                    if (!startdrag) { stopsave++; }
                    startdrag = 1;
                    DrawDragChartView(e, t);
                    if (t_type == 'filter') {
                        var id = randomNumber();
                        t.helper.find('.filter-module').attr('oldid', t.helper.find('.filter-module').attr('id'));
                        t.helper.find('.filter-module').attr('id', id);
                    }
                    $(".ui-draggable-dragging").find('.view').css({
                        'top': '35px',
                        left: '0',
                        display:'block'
                    });
                },
                drag: function (e, t) {
                    t.helper.width(400);
                },
                stop: function (e, t) {
                    handleJsIds();
                    if (stopsave > 0) { stopsave--; }
                    startdrag = 0;
                    var moduleType = t.helper.attr('data-module-type');
                    if (moduleType == 'chart') {
                        DrawDropChartView(e, t); //动态绘图
                    }
                    $(".sidebar-nav").addClass("scroll-y");
                    $(".demo .column").sortable({ //jnpadd 追加初始化tab内的容器
                        opacity: 0.35,
                        connectWith: ".column",
                        start: function (event, ui) {
                            if (!startdrag) { stopsave++; }
                            startdrag = 1;
                            startColWidth = ui.item.find('.view').width();
                        },
                        stop: function (event, ui) {
                            if (stopsave > 0) { stopsave--; }
                            startdrag = 0;
                            if (ui.item.find('.view').width() == startColWidth) {
                                return;
                            }
                            var id, config;
                            var canvas = ui.item.find('canvas');
                            if (canvas.length == '1') {
                                id = ui.item.find('.echart-embed').attr('id');
                                config = ui.item.find('.ecdatatag').text();
                                DrawSingleEchart(id, JSON.parse(config), 'only');
                                return;
                            }
                            var table = ui.item.find('table');
                            if (table.length >= '1') {
                                id = ui.item.find('.table-embed').attr('id');
                                config = ui.item.find('.tdatatag').text();
                                DrawSingleTable(id, JSON.parse(config), 'only');
                                return;
                            }
                        }
                    });
                    resetEditModal(); //jnp add 追加编辑事件
                    resetModalChart();
                    if (moduleType == 'filter') {
                        DrawDropFilterView(e, t);
                    }
                    if (moduleType == 'static') {
                        DrawDropStaticView();
                    }
                    //在这里对filter和文本/导航里面的组件拖拽进设计面板进行了背景样式添加和删除
                    //对filter的调整：当filter拖进设计面板的时候DrawDropFilterView对其进行调整
                    //对文本/导航的调整：当文本/导航拖进设计面板的时候resetEditModal对其进行调整，但文本/导航的组件需要点击编辑按钮才能附加样式
                    //当删除filter和文本/导航里面的组件时，去除样式，去除样式在removeElm中对filter和文本/导航添加的样式进行了去除
                }
            });

            $("#savecontent").click(function (e) {
                e.preventDefault();
                currenteditor.html(contenthandle.getData());
            });
            $("#savecontentcol").click(function (e) {
                e.preventDefault();
                $(currentcolumneditor).css("width", parseInt($("#colheight").val()) + "px");
                $(currentcolumneditor).children(".column").css("width", $("#colheight").val() + "px");
                //currenteditor.html(contenthandle.getData());
            });

            // $("#savecontentglobal").click(function (e) {
            //     e.preventDefault();
            //     savebg();
            // })
            // function savebg(){
            //     //保存以前先将当前选中的主题的定义chartsbg样式赋值给savechartsbgdefaultconf（以供后面获取），这是防止用户刷新后直接点击保存，这种情况会导致chartsbg保存为空
            //     oldtheme = $('#globaltheme option:selected').val();
            //     //这里把所有图表遍历出来，存入相同的样式，显示在图表上，保存要在点击了保存按钮
            //     //获取当前theme的样式(配置好的)
            //     // newthemefname=getfilename(oldtheme);
            //     // $('#savechartsbgdefaultconf').addClass(newthemefname+'chartsbg');
            //     $('#savechartsbgdefaultconf').addClass('chartsbg');
            //
            //     //$("body").addClass("devpreview");
            //     $(".demo").parent().css("width", parseInt($("#globalwidth").val()) + "px");
            //     $(".demo").parent().css("background-color", $("#globalbgcolor").val());
            //     BackGroundSet($("#globalbgcolor").val() == "");
            //     BackGroundSet($("#globalbgpicurl").val() == "");
            //     var configarr = $("#basicconfigform").serializeArray();
            //     var indexed_array = {};
            //     $.map(configarr, function (n) {
            //         indexed_array[n['name']] = n['value'];
            //     });
            //
            //     $("#basicconfig").val(JSON.stringify(indexed_array));
            //     //currenteditor.html(contenthandle.getData());
            //
            //     // 保存到$scope.basicconfigobj.echarts里
            //     //先保存到$scope.chartsbgs字典里，然后再保存到$scope.basicconfigobj.echarts
            //     //获取场景里一份样式并保存,遍历所有图表的名字，为每一个图表都暂存一份
            //     chtstyle=getchartsdivstyle();
            //
            //
            //     mychartdivs = $(document.body).find("div.demo").find("div.echart-embed");
            //     ctname='';
            //     mychartdivs.each(function () {
            //         parentdiv = $(this).closest('.chart-content');
            //         var type=parentdiv[0].getAttribute('data-type');
            //         if(type=='echarts'){
            //             ctname=$(parentdiv).closest('.view').find("span.ecdatatag").attr('id');
            //         }else if(type=='table'){
            //             ctname=$(parentdiv).closest('.view').find("span.tdatatag").attr('id');
            //         }
            //         // console.log('ctname:',ctname);
            //         $scope.chartsbg[ctname]=chtstyle;
            //     });
            //
            //     chartsbgsdict={};
            //     if($scope.basicconfigobj.chartsbgs !=undefined){  //遍历以前的数据，后面的for循环覆盖以前的数据，如果没有重复key则不覆盖
            //         if(typeof($scope.basicconfigobj.chartsbgs)=='object')
            //             chartsbgsdict=$scope.basicconfigobj.chartsbgs;
            //         else if(typeof($scope.basicconfigobj.chartsbgs)=='string')
            //             chartsbgsdict=JSON.parse($scope.basicconfigobj.chartsbgs);
            //
            //     }
            //     // console.log('chartsbgsdict,all:',chartsbgsdict);
            //     for(key in $scope.chartsbg){
            //         chartsbgsdict[key]=$scope.chartsbg[key];
            //     }
            //     $scope.basicconfigobj.chartsbgs=chartsbgsdict;
            // };
            $("#uploadbgpic").click(function (e) {
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
                }).then(function (data) {
                    if (data.code == "1") {
                        $("#globalbgpicurl").val("http://" + window.location.host + data.path + data.filename);
                        $(".demo").css("background", "url(" + $("#globalbgpicurl").val() + ") 100% top no-repeat");
                        $(".demo").css("background-size", "100% 100%");
                    }
                    BackGroundSet($("#globalbgpicurl").val() == "");
                });
            });

            // function BackGroundSet(flag) {
            //     if (!flag) {
            //         $(".demo").find(".row-fluid").css("background", "none");
            //         // $(".demo").find(".column").css("background", "none");
            //         // $(".demo").find(".box").css("background", "none");
            //     } else {
            //         if ($("#globalbgcolor").val() != "") { return; }
            //         $(".demo").find(".row-fluid").css("background", "");
            //         // $(".demo").find(".column").css("background", "");
            //         // $(".demo").find(".box").css("background", "");
            //     }
            // }

            $("#removecontentcol").click(function (e) {
                e.preventDefault();
                $(currentcolumneditor).css("height", "auto");
                $(currentcolumneditor).children(".column").css("height", "auto");
            });
            $("#downloadbtn").click(function (e) {
                e.preventDefault();
                downloadLayoutSrc();
            });
            $("#edit").click(function () {
                if ($("body").hasClass('devpreview') || $("body").hasClass('sourcepreview')) {
                    $("body").removeClass("devpreview sourcepreview");
                    $("body").addClass("edit");
                    removeMenuClasses();
                    $(this).addClass("active");
                    InitChartViews();
                }
                return false;
            });
            $("#clear").click(function (e) {
                e.preventDefault();
                clearDemo();
            });
            $("#devpreview").click(function () {
                $("body").removeClass("edit sourcepreview");
                $("body").addClass("devpreview");
                removeMenuClasses();
                $(this).addClass("active");
                InitChartViews();
                return false;
            });
            $("#sourcepreview").click(function () {
                $("body").removeClass("edit");
                $("body").addClass("devpreview sourcepreview");
                removeMenuClasses();
                $(this).addClass("active");
                InitChartViews();
                return false;
            });
            $("#fluidPage").click(function (e) {
                e.preventDefault();
                changeStructure("container", "container-fluid");
                $("#fixedPage").removeClass("active");
                $(this).addClass("active");
                downloadLayoutSrc();
            });
            $("#fixedPage").click(function (e) {
                e.preventDefault();
                changeStructure("container-fluid", "container");
                $("#fluidPage").removeClass("active");
                $(this).addClass("active");
                downloadLayoutSrc();
            });
            $(".nav-header").click(function () {
                $(".sidebar-nav .boxes, .sidebar-nav .rows").hide();
                $(this).next().slideDown();
            });
            $('#undo').click(function () {
                stopsave++;
                if (undoLayout()) { initContainer(); }
                stopsave--;
            });
            $('#redo').click(function () {
                stopsave++;
                if (redoLayout()) { initContainer(); }
                stopsave--;
            });
            removeElm();
            gridSystemGenerator();
            setInterval(function () {
                handleSaveLayout();
            }, timerSave);

            initContainer();
            resetEditModal();
            resetColumnModal();
            resetModalChart();

            $("#editorModalChart,#editorFilter,#editorModal").draggable({
                cursor: "move",
                handle: '.modal-header'
            });
            //颜色选择器初始化
            $('#chartscheme').colorpicker();
            $("#chartscheme").colorpicker().on('changeColor', function () {
                currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
                ReDrawCurrentChart();
            });
            $('#chartbgcolor').colorpicker();
            $('#chartbgcolor').colorpicker().on('changeColor', function () {
                currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
                ReDrawCurrentChart();
            });
            $('#colbgcolor').colorpicker();
            $('#globalbgcolor').colorpicker();
            $('#globalbgcolor').colorpicker().on('changeColor', function () {
                $(".demo").parent().css("background-color", $("#globalbgcolor").val());
                BackGroundSet($("#globalbgcolor").val() == "");
            });

            //单个图表设置背景颜色
            $('#chtbgcolor').colorpicker();
            $('#chtbgcolor').colorpicker().on('changeColor', function () {
                // var currchtdiv= $(currentcharteditorSpan).closest('.box-element');//显示图表的div
                // var currchtmaindiv=currchtdiv.parent();//显示图表的外层div
                // chtbgname=currentcharteditorSpan.id;
                //
                // $scope.chartsbg[chtbgname]={exp:'background-color:'+$("#chtbgcolor").val()+'!important',
                //                                 inner:'background:rgba(0,0,0,0)!important',
                //                                 bgcolor:$("#chtbgcolor").val(),
                //                                 opty:$('#chartopacity').val()}
                //
                //
                // currchtdiv.css('cssText','background:rgba(0,0,0,0)!important');//去掉echarts在编辑模式下的颜色显示
                // currchtmaindiv.css('cssText','background-color:'+$("#chtbgcolor").val()+'!important');
                generalstyle(currentcharteditorSpan);
            });
            $('#chartopacity').on('change', function () {
                // //调节rgba的opacity需要把背景颜色一起设置
                // var scolorvalue=$("#chtbgcolor").val();
                // var rgbalpha=$('#chartopacity').val();
                // //获取输入的值，对颜色值转rgb，设置传入的alpha透明度；如果透明度为空就显示所选颜色
                // var cssTextValue='';
                // if(scolorvalue!='' && scolorvalue!=undefined &&rgbalpha!='' &&rgbalpha!=undefined){
                //     cssTextValue='background-color:rgba('+hexToR(scolorvalue)+','+hexToG(scolorvalue)+','+hexToB(scolorvalue)+','+rgbalpha+')!important';
                // }else{
                //     cssTextValue='background-color:'+$("#chtbgcolor").val()+'!important';
                // }
                // $(currentcharteditorSpan).closest('.box-element').parent().css('cssText',cssTextValue);
                // chtbgname=currentcharteditorSpan.id;
                //
                //
                // $scope.chartsbg[chtbgname]={exp:cssTextValue,
                //                                 inner:'background:rgba(0,0,0,0)!important',
                //                                 bgcolor:$("#chtbgcolor").val(),
                //                                 opty:$('#chartopacity').val()}
                generalstyle(currentcharteditorSpan);
            });
            //设置边框样式
            $('#bordercolor').colorpicker();
            $('#bordercolor').colorpicker().on('changeColor', function () {
            });
            $('#bordercolor').on('changeColor', function () {
                generalstyle(currentcharteditorSpan);
            });
            $('#borderwidth').on('change', function () {
                generalstyle(currentcharteditorSpan);
            });

            //边框样式设置完成
        }
        function generalstyle(currentcharteditorSpan){
            // $(currentcharteditorSpan).closest('.box-element').css('cssText','background:rgba(0,0,0,0)!important');//图表显示区域内存div要透明
            var currchtdiv= $(currentcharteditorSpan).closest('.box-element');//显示图表的div
            //获取其他输入框的值显示到样式里
            stylestr='';
            if($('#showborder').val()=='y'){
                stylestr+='border-width:'+$('#borderwidth').val()+"px;"
                            +'border-style:'+$('#borderstyle').val()+";"
                            +'border-color:'+$('#bordercolor').val()+";"
            }

            var scolorvalue=$("#chtbgcolor").val();
            var rgbalpha=$('#chartopacity').val();
            if(scolorvalue!='' && scolorvalue!=undefined &&rgbalpha!='' &&rgbalpha!=undefined){
                stylestr+='background-color:rgba('+hexToR(scolorvalue)+','+hexToG(scolorvalue)+','+hexToB(scolorvalue)+','+rgbalpha+')!important;';
            }else if(scolorvalue!='' && scolorvalue!=undefined){
                stylestr+='background-color:'+$("#chtbgcolor").val()+'!important;';
            }else{
                stylestr+='background:transparent !important;';//如果用户没有选择背景颜色就设置为透明
            }
            // console.log('stylestr',stylestr);
            currchtdiv.css('cssText',stylestr);
        }
        $scope.showbdstyle=function (v) {
            showbd=v.value;
            if(showbd=='y'){
                $("#showbgw,#showbdstyle").show();
            }else{
                $("#showbgw,#showbdstyle").hide();
            }
            generalstyle(currentcharteditorSpan);
        }
        //边框线条样式的改变
        $scope.selectbdstyle=function () {
            generalstyle(currentcharteditorSpan);
        }
        /*16进制颜色值转rgb*/
        function hexToR(h) {
            return parseInt((cutHex(h)).substring(0, 2), 16)
        }
        function hexToG(h) {
            return parseInt((cutHex(h)).substring(2, 4), 16)
        }
        function hexToB(h) {
            return parseInt((cutHex(h)).substring(4, 6), 16)
        }
        function cutHex(h) {
            return h.charAt(0) == "#" ? h.substring(1, 7) : h
        }
        /*rgb转16进制*/
        function rgbstrToHex(rgbstr) {
            rgbstr=rgbstr.substring(rgbstr.indexOf('(')+1,rgbstr.lastIndexOf(')'));
            rgbv=rgbstr.split(',');
            return rgbToHex(Number(rgbv[0]),Number(rgbv[1]),Number(rgbv[2]));
        }
        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        function resetColumnModal() {
            $("[data-target='#editorColumnModal']").off("click").on("click", function (e) {
                e.preventDefault();
                currentcolumneditor = $(this).parent().parent().find('.view').children()[0];
            });
        }
        //点击选择url功能
        $scope.scenes=[];
        $.ajax({
            url: '/api/getscenes/?format=json',
            type: 'get',
            data: {}
        }).then(function (data) {
            // $scope.scenes = data.datas;
            //scene不显示自己
            id=GetQueryString("id");
            scenealldatas=[];
            if(data.datas.length>0)
                for(i=0;i<data.datas.length;i++){
                    if(data.datas[i].id !=id){
                        scenealldatas.push(data.datas[i]);
                    }
                }
            $scope.scenes = scenealldatas;
        });

        function resetModalChart() {
            $("[data-target='#editorModalChart']").off("click").on("click", function (e) {
                e.preventDefault();
                $("#clickUrl").val('');
                $("[form-type='vega']").hide();
                $("[form-type='echarts']").hide();
                $("[form-type='table']").hide();
                $('#chartconfigform').find("input").val('').removeAttr('checked').removeAttr('checked');
                currentcharteditorSpan = $(this).parent().parent().find('.ecdatatag')[0];
                var type = $(currentcharteditorSpan).closest('.box-element').find('.chart-content').data('type');
                var hasBorderd = $(currentcharteditorSpan).closest('.box-element').parent().hasClass('border-line') ? 'y' : 'n';
                $("#showborder").val(hasBorderd);
                //***对图表的弹出框赋值
                //basicconfig.chartsbgs循环遍历匹配currentcharteditorSpan.attr('id'),匹配上了就赋值(拆解)
                chartsbgs=$scope.basicconfigobj.chartsbgs;
                if(chartsbgs==undefined){
                    chartsbgs={};
                }
                // console.log('resetmodel,chartsbgs:',chartsbgs);
                chartname ='';
                if(type!='echarts'){
                    chartname = $(this).parent().parent().find('.tdatatag')[0].id;
                }else{
                    chartname=currentcharteditorSpan.id;
                }
                //对图表的样式进行编辑。对每一个图表进行编辑的时候需要回显数值
                if(chartsbgs.hasOwnProperty(chartname)){
                    chartstyleobj=chartsbgs[chartname];
                    $('#borderwidth').val(chartstyleobj.borderwidth);
                    $('#borderstyle').val(chartstyleobj.borderstyle);
                    $('#bordercolor').val(chartstyleobj.bordercolor);
                    $('#chtbgcolor').val(chartstyleobj.chtbgcolor);
                    $('#chartopacity').val(chartstyleobj.chartopacity);
                    $("#showborder").val(chartstyleobj.showborder);
                }else{
                    $('#borderwidth').val('');
                    $('#borderstyle').val('none');
                    $('#bordercolor').val('');
                    $('#chtbgcolor').val('');
                    $('#chartopacity').val('');
                    $('#showborder').val('n');
                }

                if($('#showborder').val()=='y'){
                    $("#showbgw,#showbdstyle").show();
                }else{
                    $("#showbgw,#showbdstyle").hide();
                }
                //***赋值完毕
                //关联场景使用鼠标移动自动选择
                $scope.selscenes=[];
                $scope.changeScene = function () {
                    if ($scope.selscenes != '' && $scope.selscenes != undefined) {
                      sceneurl = '/bi/index/scene/' + $scope.selscenes[$scope.selscenes.length - 1].id;
                      $("#clickUrl").val(sceneurl);
                    }
                }
                //关联场景修改结束
                $("#clickParam").empty();//避免重复加载option，加载前需要清空

                if (type == 'echarts') {
                    $("[form-type='echarts']").show();
                    currentcharteditorSpan = $(this).parent().parent().find('.ecdatatag')[0];
                    currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
                    if (currentcharteditor.height) { $("#echartheight").val(currentcharteditor.height); }
                    // if (currentcharteditor.width) { $("#echartwidth").val(currentcharteditor.width); }
                    BindProp("echarttitle", "currentcharteditor.title.text");
                    BindProp("echartsubtitle", "currentcharteditor.title.subtext");

                    if (currentcharteditor.data.type == 'bmap'){
                        if (currentcharteditor.event && currentcharteditor.event.eventtype == 'redirect') {
                            $("#clickredirect").val('1');
                        }
                        else {
                            $("#clickredirect").val('0');
                        }
                        if (currentcharteditor.event && currentcharteditor.event.url) {
                            $("#clickUrl").val(currentcharteditor.event.url);
                        }
                        if (currentcharteditor.area.x){
                            $("#clickParam").append("<option value='" + currentcharteditor.area.x.field + "'>" + currentcharteditor.area.x.field + "</option>");
                        }
                        for (var i = 0; i < currentcharteditor.point.length; i++) {
                            if (currentcharteditor.area.x && currentcharteditor.point[i].x.field == currentcharteditor.area.x.field) {
                                continue;
                            }
                            $("#clickParam").append("<option value='" + currentcharteditor.point[i].x.field + "'>" + currentcharteditor.point[i].x.field + "</option>");
                        }

                    }

                    if (currentcharteditor.data.type != 'bmap' && typeof currentcharteditor.field.x == 'object') {
                        if (currentcharteditor.event && currentcharteditor.event.eventtype == 'redirect') {
                            $("#clickredirect").val('1');
                        }
                        else {
                            $("#clickredirect").val('0');
                        }

                        if (currentcharteditor.event && currentcharteditor.event.url) {
                            $("#clickUrl").val(currentcharteditor.event.url);
                        }
                        if (!isNaN(currentcharteditor.field.x.length)){
                            for (var i = 0; i < currentcharteditor.field.x.length;i++){
                                $("#clickParam").append("<option value='" + currentcharteditor.field.x[i].field + "'>" + currentcharteditor.field.x[i].field +"</option>");
                            }
                        }
                        else{
                            $("#clickParam").append("<option value='" + currentcharteditor.field.x.field + "'>" + currentcharteditor.field.x.field + "</option>");
                        }
                        if (currentcharteditor.event && currentcharteditor.event.column){
                            $("#clickParam").val(currentcharteditor.event.column);
                        }
                    }
                    // BindProp("echartlegend", "currentcharteditor.legend.show");
                }
                else {
                    $("[form-type='table']").show();
                    currentcharteditorSpan = $(this).parent().parent().find('.tdatatag')[0];
                    currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
                    if (currentcharteditor.config.sScrollY) { $("#tableScrollY").val(currentcharteditor.config.sScrollY.replace('px', '')); }
                    if (currentcharteditor.config.pageLength) { $("#pagelength").val(currentcharteditor.config.pageLength); }
                    BindProp("leftFiexColumn", "currentcharteditor.config.fixedColumns.leftColumns");
                    BindProp("rightFiexColumn", "currentcharteditor.config.fixedColumns.rightColumns");
                    if (currentcharteditor.pagin && currentcharteditor.pagin == '1'){
                        $("#pagin").attr('checked',true);
                    }
                    else{
                        $("#pagin").attr('checked', false);
                    }
                }
            });
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
            try { eval("delete " + value); } catch (e) { }
        }
        function ReDrawCurrentChart() {
            currentcharteditor = JSON.parse(currentcharteditorSpan.innerHTML);
            var datatag = $(currentcharteditorSpan);
            var type = $(currentcharteditorSpan).closest('.box-element').find('.chart-content').data('type');
            var chardiv;
            if (type == 'echarts') {
                chardiv = datatag.parent().find("div.echart-embed");
                if (!chardiv[0]) { return; }

                DrawSingleEchart($(chardiv).attr("id"), currentcharteditor);
            }
            else if (type == 'table') {
                chardiv = datatag.parent().find("div.table-embed");
                $(chardiv).html('');
                DrawSingleTable($(chardiv).attr("id"), currentcharteditor);
            }
        }
        function resetEditModal() {
            $("[data-target='#editorModal']").click(function (e) {
                e.preventDefault();
                currenteditor = $(this).parent().parent().find('.view');
                var eText = currenteditor.html();
                contenthandle.setData(eText);
                //lc add 当拖拽控件到场景中，就给当前框添加一个css类，css类在导入的css文件里定义，以此实现样式的可调整
                thisFrame=$(this).parent().parent();
                // alertButSta=$(this).children('button').attr('data-dismiss');
                alertButSta=$(this).parent().parent().find('.view').find('button').eq(0).attr('data-dismiss');
                // currenteditor.wrap("<div></div>");
                // currenteditor.addClass("staticFrameStyle");
                if(alertButSta=='alert'){//对alert提示框特殊处理
                    if(!thisFrame.hasClass('alertFrameStyle')){
                        thisFrame.addClass('alertFrameStyle');
                    }
                }
                // else if(!thisFrame.hasClass('staticFrameStyle')){
                //     thisFrame.addClass('staticFrameStyle');
                // }
            });
        }
        //动态绘制拖动的图表 jnp
        function DrawDragChartView(e, t) {
            var charttype = t.helper.find('.chart-content').data('type');
            var box = t.helper;
            var tag, chardiv;
            var newid = randomNumber();
            if (charttype == 'echarts') {
                chardiv = t.helper.find('div.echart-embed');
                tag = t.helper.find("span.ecdatatag");
            }
            if (charttype == 'table') {
                chardiv = t.helper.find('div.table-embed');
                tag = t.helper.find("span.tdatatag");
            }
            if (tag && tag.length > 0) {
                t.helper.width(300);
                t.helper.find("div.view").width(300);
                t.helper.find("div.view").height(200);
                $(chardiv).attr("oldid", chardiv.attr("id"));
                $(chardiv).attr("id", "chartview_" + newid);
                $(box).attr("oldid", box.attr("id"));
                $(box).attr("id", 'box_' + charttype + '_' + newid);
            }
        }


        function DrawDropChartView(e, t) {
            var charttype = t.helper.find('.chart-content').data('type');
            var tag, chardiv;

            savebg();
            setTimeout(function () {
                chtstyle=getchartsdivstyle();   //必须要再addclass后面执行，不然图表获取的颜色为空
                // console.log('chtstyle:',chtstyle);
                //遍历所有图表给每个图表添加上相同的此项样式
                mychartdivs = $(document.body).find("div.demo").find("div.echart-embed");
                mychartdivs.each(function () {
                    parentdiv = $(this).closest('.chart-content');
                    $(parentdiv).closest('.view').closest('.box').css('cssText',chtstyle.exp);
                });
            },80);
            if (charttype == 'echarts') {
                chardiv = t.helper.find('div.echart-embed');
                tag = t.helper.find("span.ecdatatag");
            }
            if (charttype == 'table') {
                chardiv = t.helper.find('div.table-embed');
                tag = t.helper.find("span.tdatatag");
            }
            if (!chardiv || chardiv.length == 0) {
                return;
            }
            else {
                chardiv = $(".demo").find("#" + chardiv.attr("oldid"));
                chardiv.parent().removeAttr("style");
                chardiv.parent().find(".view").attr("style", "");
            }
            var newid = randomNumber();
            var vlconfig, width, height;
            if (tag && tag.length > 0) {
                vlconfig = JSON.parse(tag.text());
                $(chardiv).attr("id", "chartview_" + newid);
                if (!chardiv[0]) { return; }
                $("#chartview_" + newid).closest('.view').removeAttr('style');
                $("#chartview_" + newid).closest('.view').find('img').hide();
                if (charttype == 'echarts') {
                    width = $("#chartview_" + newid).width();
                    height = Math.round(width * 9 / 16);
                    vlconfig.height = height;
                    $("#chartview_" + newid).closest('.chart-content ').siblings('.ecdatatag').text(JSON.stringify(vlconfig));
                    DrawSingleEchart("chartview_" + newid, vlconfig);
                }
                else if (charttype == 'table') {
                    width = $("#chartview_" + newid).closest('.view')[0].clientWidth;
                    vlconfig.config.sScrollX = width + 'px';
                    vlconfig.config.scrollX = width + 'px';
                    DrawSingleTable("chartview_" + newid, vlconfig);
                }
            }
        }

        function DrawDropStaticView(){
            var stac=$(".static");
            stac.closest(".box-element").addClass("staticFrameStyle");
            if($("#elmBase .box-element").hasClass("staticFrameStyle")){
                $("#elmBase .box-element").removeClass("staticFrameStyle");
            }
        }
        function DrawDropFilterView(e, t) {
            var module_div = t.helper.find('.filter-module');
            var filter_type = module_div.attr('data-filter-type');
            module_div = $(".demo").find("#" + module_div.attr("oldid"));
            if (module_div.length > 0) {
                var id = randomNumber();
                module_div.attr('id', 'filter_module_' + id);
                module_div.parent().wrapInner("<div></div>");
                setFilterModal(module_div, filter_type);
                $("#editorFilter").modal();
                initFilterPlugins(filter_type, module_div);
            }
            //lc add 当拖拽控件到场景中，就给当前框添加一个css类，css类在导入的css文件里定义，以此实现样式的可调整
            hadFrStyle=module_div.closest('.box-element').hasClass('module_div.closest(\'.box-element\')filterFrameStyle');
            if(!hadFrStyle){
                module_div.closest('.box-element').addClass('filterFrameStyle');
                module_div.closest('.box-element').css('display','inline-block');
            }
        }

        function initFilterPlugins(filter_type, module_div) {
            if (filter_type == 'daterange') {
                module_div.daterangepicker(
                    {
                        ranges: {
                            '今天': [moment(), moment()],
                            '昨天': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                            '七天前': [moment().subtract(6, 'days'), moment()],
                            '最近30天': [moment().subtract(29, 'days'), moment()],
                            '这个月': [moment().startOf('month'), moment().endOf('month')],
                            '上个月': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                            '上一年': [moment().subtract(365, 'days').endOf('month').subtract(-1, 'days'), moment().endOf('month')]
                        },
                        startDate: moment().subtract(29, 'days'),
                        endDate: moment(),
                        locale: {
                            applyLabel: '确认',
                            cancelLabel: '取消',
                            customRangeLabel: '自定义'
                        }
                    },
                    function (start, end) {
                        module_div.val(start.format('YYYY/MM/DD') + '-' + end.format('YYYY/MM/DD'));
                        module_div.attr('data-start', start.format('YYYY-MM-DD HH:mm:ss'));
                        module_div.attr('data-end', end.format('YYYY-MM-DD HH:mm:ss'));
                    }
                );
            }
        }

        function setFilterModal(module_div, filter_type) {
            $("#editorFilter").find(".form-group[data-filter-type!=all]").hide();
            $("#editorFilter").find(".form-group[data-filter-type=" + filter_type + "]").show();
            $("#editorFilter").find(".form-group[data-filter-add=selectadd]").hide();
            var filter_add = module_div.attr('data-filter-add');
            $("#editorFilter").find(".form-group[data-filter-add=" + filter_add + "]").show();
            $("#filter_module_id").val(module_div.attr('id'));
            $("#module-height").val(module_div.attr('data-height'));
            $("#module-width").val(module_div.attr('data-width'));
            $("#filter-label-text").val(module_div.siblings('.filter-title').text());
            $("#filter-method").val(module_div.attr('data-method'));
            // $("#filterDeault").val(module_div.attr('data-default'));
            $("#filterDeault").val(getDate(module_div.attr('data-default')));
            $("#filterselectvalues").val(module_div.attr('data-options'));
            var columnlists = getSourceColumn();
            var columSelect = $("#filter-column-select");
            columSelect.empty().append('<option value="">选择场景中存在的图标所包含列</option>');
            columnlists.map(function (index) {
                columSelect.append('<option value="' + index + '">' + index + '</option>');
            });
            columSelect.val(module_div.attr('data-column'));
        }
         $("#savecontentglobal").click(function (e) {
                e.preventDefault();
                savebg();
            })
            function savebg(){
                //保存以前先将当前选中的主题的定义chartsbg样式赋值给savechartsbgdefaultconf（以供后面获取），这是防止用户刷新后直接点击保存，这种情况会导致chartsbg保存为空
                oldtheme = $('#globaltheme option:selected').val();
                //这里把所有图表遍历出来，存入相同的样式，显示在图表上，保存要在点击了保存按钮
                //获取当前theme的样式(配置好的)
                // newthemefname=getfilename(oldtheme);
                // $('#savechartsbgdefaultconf').addClass(newthemefname+'chartsbg');
                $('#savechartsbgdefaultconf').addClass('chartsbg');

                //$("body").addClass("devpreview");
                $(".demo").parent().css("width", parseInt($("#globalwidth").val()) + "px");
                $(".demo").parent().css("background-color", $("#globalbgcolor").val());
                BackGroundSet($("#globalbgcolor").val() == "");
                BackGroundSet($("#globalbgpicurl").val() == "");
                var configarr = $("#basicconfigform").serializeArray();
                var indexed_array = {};
                $.map(configarr, function (n) {
                    indexed_array[n['name']] = n['value'];
                });

                $("#basicconfig").val(JSON.stringify(indexed_array));
                //currenteditor.html(contenthandle.getData());

                // 保存到$scope.basicconfigobj.echarts里
                //先保存到$scope.chartsbgs字典里，然后再保存到$scope.basicconfigobj.echarts
                //获取场景里一份样式并保存,遍历所有图表的名字，为每一个图表都暂存一份
                chtstyle=getchartsdivstyle();


                mychartdivs = $(document.body).find("div.demo").find("div.echart-embed");
                ctname='';
                mychartdivs.each(function () {
                    parentdiv = $(this).closest('.chart-content');
                    var type=parentdiv[0].getAttribute('data-type');
                    if(type=='echarts'){
                        ctname=$(parentdiv).closest('.view').find("span.ecdatatag").attr('id');
                    }else if(type=='table'){
                        ctname=$(parentdiv).closest('.view').find("span.tdatatag").attr('id');
                    }
                    // console.log('ctname:',ctname);
                    $scope.chartsbg[ctname]=chtstyle;
                });

                chartsbgsdict={};
                if($scope.basicconfigobj.chartsbgs !=undefined){  //遍历以前的数据，后面的for循环覆盖以前的数据，如果没有重复key则不覆盖
                    if(typeof($scope.basicconfigobj.chartsbgs)=='object')
                        chartsbgsdict=$scope.basicconfigobj.chartsbgs;
                    else if(typeof($scope.basicconfigobj.chartsbgs)=='string')
                        chartsbgsdict=JSON.parse($scope.basicconfigobj.chartsbgs);

                }
                // console.log('chartsbgsdict,all:',chartsbgsdict);
                for(key in $scope.chartsbg){
                    chartsbgsdict[key]=$scope.chartsbg[key];
                }
                $scope.basicconfigobj.chartsbgs=chartsbgsdict;
            };
          function BackGroundSet(flag) {
                if (!flag) {
                    $(".demo").find(".row-fluid").css("background", "none");
                    // $(".demo").find(".column").css("background", "none");
                    // $(".demo").find(".box").css("background", "none");
                } else {
                    if ($("#globalbgcolor").val() != "") { return; }
                    $(".demo").find(".row-fluid").css("background", "");
                    // $(".demo").find(".column").css("background", "");
                    // $(".demo").find(".box").css("background", "");
                }
            }
        //
        $scope.filterSelect=function() {
            var columSelectValue = $("#filter-column-select").val();
            // columSelectValue
            chartid='';
            chartColumn.forEach(function (item) {//根据select的值获取其对应图表的id
                if($.inArray(columSelectValue, item['keys'])!=-1){
                    chartid=item['id'];
                }
            });
            if(chartid!=''){//根据id获取其对应的请求url
                reqUrl='';
                olapId='';
                chartColumnConf.forEach(function (item) {//根据select的值获取其对应图表的id
                    if(item['id']==chartid){
                        if(item['type']=='echart'){
                            olapReqUrl=item['config'].data.url;
                            olapId=olapReqUrl.substring(olapReqUrl.lastIndexOf('/')+1);
                        }else if(item['type']=='table'){
                            olapId=item['config'].olapid;
                        }
                    }
                });
                reqUrl='/api/dash/getColGroupValue';
                $.ajax({
                    url:reqUrl,
                    type:'post',
                    data:{
                        olapid:olapId,
                        columnName:columSelectValue
                    }
                }).success(function (data) {
                    $("#filterselectvalues").val((data.data).join(''));
                });

            }
        }

        Array.prototype.unique2 = function () {
            this.sort(); //先排序
            var res = [this[0]];
            for (var i = 1; i < this.length; i++) {
                if (this[i] != res[res.length - 1]) {
                    res.push(this[i]);
                }
            }
            return res;
        };

        function getSourceColumn() {
            var result = [];
            chartColumn.map(function (item) {
                item.keys.map(function (index) {
                    result.push(index);
                });
            });
            if (result.length > 0) {
                return result.unique2();
            }
            else {
                return result;
            }
        }

        function addSourceColumn(id, type, config, fn) {
            var keys;
            var url = config.data.url;
            if (type == 'echart') {
                $.ajax({
                    url: url,
                    method: 'get'
                }).done(function (rs) {
                    doColumn(rs);
                });
            }
            else {
                $.ajax({
                    url: '/api/dash/loadTableData',
                    type: 'post',
                    data: {
                        column: JSON.stringify(config.columns),
                        olapid: config.olapid,
                        limit: config.length,
                        merge: config.merge,
                        mergeCols:JSON.stringify(config.mergeCols),
                        page: 1
                    }
                }).success(function (data) {
                    if(data.status=='success'){
                        doColumn(data.data,data.total);
                    }else if(data.status=='failure'){
                        alert(data.data);
                    }
                });
            }

            function doColumn(rs, total) {
                if (rs.length > 0) {
                    keys = dl.keys(rs[0]);
                    fn(rs, total);
                    chartColumn.push({
                        id: id,
                        keys: keys
                    });
                }
                else {
                    removeSourceColumn(id);
                }
            }
            //将值保存到chartColumnConf里用于目标列下拉获取列的所有值，显示再下拉选项中
            chartColumnConf.push({
                id:id,
                type:type,
                config:config
            });

        }

        function removeSourceColumn(id) {
            chartColumn = chartColumn.filter(function (item) {
                return item['id'] != id;
            });
            //移除chartColumnConf里的值
            chartColumnConf=chartColumnConf.filter(function (item) {
                return item['id']!=id;
            })
        }

        function clearChartColumn(div) {
            var chart = div.find('.chart-content');
            chart.each(function () {
                var s = $(this).data('type');
                var id = '';
                switch (s) {
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

        function clearFilter() {
            var filters = $("div.demo").find(".filter-module");
            var arrayColumn = getSourceColumn();
            filters.each(function (key, item) {
                if (arrayColumn.indexOf($(item).attr('data-column')) < 0) {
                    $(item).attr('data-column', '');
                }
            });
        }

        function InitChartViews() {
            var datatag, vlconfig;
            var chartdivs = $(document.body).find("div.demo").find("div.echart-embed");
            chartdivs.each(function () {
                var chardiv = this;
                var parentdiv = $(chardiv).closest('.chart-content');
                var type = parentdiv[0].getAttribute('data-type');
                if (type == 'echarts') {
                    chardiv = $(parentdiv).find('div.echart-embed');
                    datatag = $(parentdiv).closest('.view').find("span.ecdatatag");
                    vlconfig = JSON.parse(datatag.text());
                    DrawSingleEchart($(chardiv).attr("id"), vlconfig);
                }
                else if (type == 'table') {
                    chardiv = $(parentdiv).find('div.table-embed');
                    datatag = $(parentdiv).closest('.view').find("span.tdatatag");
                    vlconfig = JSON.parse(datatag.text());
                    DrawSingleTable($(chardiv).attr("id"), vlconfig);
                }

            });
            $("#demoSave").find(".filter-module").each(function () {
                var type = $(this).attr('data-filter-type');
                initFilterPlugins(type, $(this));
            });
            BindThemeAndBackGround();
            resetEditModal(); //jnp add 追加编辑事件
            resetModalChart();
        }
        $(document).on("change","#globaltheme", function () {
            // oldthemefname=getfilename(oldtheme);
            if($('#savechartsbgdefaultconf').hasClass('chartsbg')){
                $('#savechartsbgdefaultconf').removeClass('chartsbg')
            }
            replacejscssfile(oldtheme, $('#globaltheme option:selected').val(), "css");
            oldtheme = $('#globaltheme option:selected').val();
            //这里把所有图表遍历出来，存入相同的样式，显示在图表上，保存要在点击了保存按钮
            //获取当前theme的样式(配置好的)
            // newthemefname=getfilename(oldtheme);
            // if($('#savechartsbgdefaultconf').hasClass(oldthemefname+'chartsbg'))
            //     $('#savechartsbgdefaultconf').removeClass(oldthemefname+'chartsbg');
            // $('#savechartsbgdefaultconf').addClass(newthemefname+'chartsbg');

            $('#savechartsbgdefaultconf').addClass('chartsbg');//必须要再removeclass后
            //异步问题，值得注意
            setTimeout(function () {
                chtstyle=getchartsdivstyle();   //必须要再addclass后面执行，不然图表获取的颜色为空
                // console.log('chtstyle:',chtstyle);
                //遍历所有图表给每个图表添加上相同的此项样式
                mychartdivs = $(document.body).find("div.demo").find("div.echart-embed");
                mychartdivs.each(function () {
                    parentdiv = $(this).closest('.chart-content');
                    $(parentdiv).closest('.view').closest('.box').css('cssText',chtstyle.exp);
                });
            },80);
        });
        function getchartsdivstyle() {
            chartdivobj={};

            chartdivobj['showborder']=$('#showborder').val();
            chartdivobj['borderwidth']=$('#savechartsbgdefaultconf').css('border-width');
            //如果borderwidth获取的值里有px就去掉px
            if(chartdivobj['borderwidth'].indexOf('px')!=-1)chartdivobj['borderwidth']=chartdivobj['borderwidth'].substring(0,chartdivobj['borderwidth'].indexOf('px'));
            chartdivobj['borderstyle']=$('#savechartsbgdefaultconf').css('border-style');
            chartdivobj['bordercolor']=$('#savechartsbgdefaultconf').css('border-color');
            if(chartdivobj['bordercolor'].indexOf('rgb')!=-1){//如果是rgb的形式，就转换为16进制，以便于回显
                chartdivobj['bordercolor']=rgbstrToHex(chartdivobj['bordercolor']);
            }
            chtstyle='';
            chtstyle='border-width:'+chartdivobj.borderwidth+'px;';
            chtstyle+='border-style:'+chartdivobj.borderstyle+';';
            chtstyle+='border-color:'+chartdivobj.bordercolor+';';

            clr=$('#savechartsbgdefaultconf').css('background-color');
            opty=$('#savechartsbgdefaultconf').css('opacity');

            //赋值给chartdivobj以便于回显
            chartdivobj['chtbgcolor']=clr;
            if(chartdivobj['chtbgcolor'].indexOf('rgb')!=-1){//如果是rgb的形式，就转换为16进制，以便于回显
                chartdivobj['chtbgcolor']=rgbstrToHex(chartdivobj['chtbgcolor']);
            }
            chartdivobj['chartopacity']=opty;
            if(clr!='' && clr!=undefined && opty!='' && opty!=undefined){
                if(clr.indexOf('rgb')!=-1){//如果clr是rgb()形式的
                    // console.log(clr.substring(0,clr.length-1)+','+opty+")");
                    chtstyle+='background-color:'+clr.substring(0,clr.length-1)+','+opty+')!important;';
                }else{
                    chtstyle+='background-color:rgba('+hexToR(clr)+','+hexToG(clr)+','+hexToB(opty)+','+opty+')!important;';
                }
            }else if(clr!='' && clr!=undefined){
                chtstyle+='background-color:'+clr+'!important;';
            }else{
                chtstyle+='background:transparent !important;';//如果用户没有选择背景颜色就设置为透明
            }

            chartdivobj['exp']=chtstyle;

            return chartdivobj;
        }
        function getfilename(dirname){
            //获取css文件名
            cssfname=dirname.substring(dirname.lastIndexOf("/")+1);
            cssfname=cssfname.substring(0,cssfname.lastIndexOf("."));
            return cssfname;
        }
        function changeConfigUrl(config, paramArry) {
            var url = config.data.url;
            paramArry.map(function (item) {
                url = changeUrl(url, item.key, item.value);
            });
            config.data.url = url;
            return config;
        }

        function columnFormat(column, method) {
            return column + "(_)" + method;
        }

        //初始化主题绑定
        //未设置主题时,设置绑定背景色
        function BindThemeAndBackGround() {
            if (oldtheme != "/frontend/css/dashthemes/default/default.css") { replacejscssfile("/frontend/css/dashthemes/default/default.css", oldtheme, "css"); }
            else if ($("#globalbgpicurl").val() != "") {
                $(".demo").css("background", "url(" + $("#globalbgpicurl").val() + ") 100% top no-repeat");
                $(".demo").css("background-size", "100% 100%");
            } else if (oldtheme == "/frontend/css/dashthemes/default/default.css" && $("#globalbgpicurl").val() == "" && $("#globalbgcolor").val() != "") {
                $(".demo").parent().css("background-color", $("#globalbgcolor").val());
            }
        }
        //在编辑状态下如果删除了已有的图表，则需要删除scene标option字段中对应的数据,会删除option字段里所有的id数据
        function clearAddtionText(div) {
            var chart = div.find('.chart-content');
            chart.each(function () {
                var targId = $(this).find('.vega-embed').attr('id');
                if(targId && targId!='')targId=targId.match(/[a-f0-9]{32}/)[0];
                var themeId=GetQueryString("id");
                if(themeId && themeId!='' && targId && targId!=''){
                    $.ajax({
                        url: '/api/dash/saveAdditionText/',
                        type: 'POST',
                        data: {sceneId:themeId,targId:targId,type:'charts',text:'',hideStatus:'yes'}//targetid为chartid或者tableid
                    }).then(function (rs) {
                        if(rs.code==0){
                            alert(rs.msg);
                        }else{
                            console.log('update scene option succeed');
                        }
                    })
                }
            });
        }
        //在预览里也有这个函数
        function getAlertInfo(chartid,ecconfig,chartType){
            var element = $("#" + chartid);
            //渲染图表以后接着获取警告信息，信息来与业务规则的配置，excuteRule函数
            try{
                if (!ecconfig.data || !ecconfig.data.url) {
                    console.log('----ecconfig.data is null----')
                    return false;
                }
                var olapId='';
                if(chartType=='chart'){
                    var olapUrl=ecconfig.data.url;
                    olapId=olapUrl.match(/[a-f0-9]{32}/)[0];
                }else{
                    olapId=ecconfig.olapid;
                }
                var boxElementTag = $(element[0]).closest(".box-element");
                var viewDivTag=boxElementTag.find('.addChartTagStyle').children('div .view');
                $.ajax({
                    url: '/api/dash/getBussRuleMsg',
                    type: 'GET',
                    data: {olapId:olapId}
                }).then(function (rs) {
                    viewDivTag.html('');
                    if(rs.code == 1){
                        if(rs.bussRuleMsg && rs.bussRuleMsg.length>0){//rs.bussRuleMsg是一个包含四项属性的对象数组
                            var allAlertInfo=$('<div>').addClass('allAlertInfo');
                            for(i=0;i<rs.bussRuleMsg.length;i++){
                                msgObj=rs.bussRuleMsg[i];
                                var showMsgTag=$('<div>');
                                showMsgTag.addClass('replaceAlertInfo');
                                // showMsgTag.css('display','none');

                                var warnignName=$('<span>');
                                warnignName.addClass('warnignNameClass');
                                warnignName.css('color',msgObj.color);
                                warnignName.text(msgObj.warningName);

                                var tagA=$('<a>');
                                tagA.attr('target','_Blank');
                                tagA.attr('href',msgObj.monitorid);
                                tagA.text('查看详情');

                                var adviceTg=$('<span>');
                                adviceTg.addClass('myadviceTagStyle');
                                adviceTg.text(msgObj.advice);

                                $(showMsgTag).append(warnignName).append(tagA).append($('<br>')).append(adviceTg);
                                allAlertInfo.append(showMsgTag);
                            }
                            $(viewDivTag).append(allAlertInfo);
                        }else{
                            viewDivTag.html($('<span>').addClass('addtiontext').text('添加标注文本！'));
                        }
                    }else{
                        viewDivTag.html($('<span>').addClass('addtiontext').text('请添加标注文本！'));
                        console.log('----getBussRuleMsg return error value-----');
                    }
                });
            }catch(erro){
                throw erro;
                console.log('=====error=====;file:dashboard/index.js;method:DrawSingleEchart;line:1879')
            }
            //获取警告信息完成
        }
        function DrawSingleEchart(chartid, ecconfig, drawType) {
            var element = $("#" + chartid);
            if (drawType != 'only') {
                addSourceColumn(chartid, 'echart', ecconfig, function (data) {
                    buildEchart(ecconfig, element, data);
                });
            }
            else {
                buildEchart(ecconfig, element);
            }
            getAlertInfo(chartid,ecconfig,'chart');//获取警告信息
            additionTagShowAndHide();//添加图表标注文本的按钮的隐藏和显示功能
        }

        function DrawSingleTable(chartid, ecconfig, drawType) {
            if (drawType != 'only') {
                addSourceColumn(chartid, 'table', ecconfig, function (data,total) {
                    $("#" + chartid).myTableFuc(ecconfig, data, total);
                });
            }
            else {
                $("#" + chartid).myTableFuc(ecconfig);
            }
            getAlertInfo(chartid,ecconfig,'table');//获取警告信息
            additionTagShowAndHide();//添加图表标注文本的按钮的隐藏和显示功能
        }



        /**
         * 初始化 数据关联
         */
        function relation() {
            this.allChart = getAllChart();
        }

        relation.prototype.getChart = function () {
            return this.allChart;
        };
        relation.prototype.getSourceChart = function () {
            return this.allChart.filter(function (row) {
                var json = getChartJson(row.id);
                var flag = false;
                if (row.type === 'echarts' && $scope.supportEventType.indexOf(json.data.type) >= 0) {
                    flag = true;
                }
                return flag;
            });
        };





        function getTitle(id) {
            return $("#" + id).closest('.view').siblings('.chart-title').text();
        }

        function getAllChart() {
            var result = [], id, type;
            $(".demo").find('.chart-content').each(function () {
                type = $(this).attr('data-type');
                if (type == 'echarts') {
                    id = $(this).find('.echart-embed').attr('id');
                }
                else {
                    id = $(this).find('.table-embed').attr('id');
                }
                result.push({
                    id: id,
                    title: getTitle(id),
                    type: type
                });
            });
            return result;
        }

        /**
         * jQuery
         */
        $(function () {
            $(window).resize(function () {
                $("#containerBody").css("height", $(window).height() - 92);
                $(".demo").css("min-height", 2160); //$(window).height() - 150)
            });
            $("#containerBody").css("height", $(window).height() - 92);
            /**
             * 保存图表设置项
             */
            $("#savecontentchart").click(function (e) {
                e.preventDefault();
                var type = $(currentcharteditorSpan).closest('.box-element').find('.chart-content').data('type');
                var hasborder = $("#showborder").val();
                var maindiv = $(currentcharteditorSpan).closest('.box-element').parent();
                if (hasborder == 'y') {
                    if (!maindiv.hasClass('border-line')) {
                        // maindiv.addClass('border-line');//不需要外部的黑色线条边框，20180426
                    }
                }
                else {
                    maindiv.removeClass('border-line');
                }
                if (type == 'echarts') {
                    if ($("#echartheight").val() != "") { currentcharteditor.height = $("#echartheight").val(); }
                    else if (currentcharteditor.height) { delete currentcharteditor.height; }
                    // if ($("#echartwidth").val() != "") { currentcharteditor.width = $("#echartwidth").val(); }
                    // else if (currentcharteditor.width) { delete currentcharteditor.width; }
                    if ($("#echarttitle").val() != "") { $.extend(true, currentcharteditor, { "title": { "text": $("#echarttitle").val() } }); }
                    else { DeleteProp("currentcharteditor.title.text"); }
                    if ($("#echartsubtitle").val() != "") { $.extend(true, currentcharteditor, { "title": { "subtext": $("#echartsubtitle").val() } }); }
                    else { DeleteProp("currentcharteditor.title.subtext"); }

                    if ($("#clickredirect").val() == '1' && $("#clickUrl").val() != '' && $("#clickParam").val() != ''){
                        currentcharteditor.event = {
                            eventtype:'redirect',
                            url: $("#clickUrl").val(),
                            column: $("#clickParam").val()
                        };
                    }

                    // $.extend(true, currentcharteditor, { "legend": { "show": $("#echartlegend").val() } });
                    currentcharteditorSpan.innerHTML = JSON.stringify(currentcharteditor);
                }
                else if (type == 'table') {
                    if ($("#tableScrollY").val() != "") { currentcharteditor.config.sScrollY = $("#tableScrollY").val() + 'px'; }
                    if ($("#pagelength").val() != "") { currentcharteditor.config.pageLength = $("#pagelength").val(); }
                    var leftFixed = 0;
                    var rightFixed = 0;
                    if ($("#leftFiexColumn").val() != "") { leftFixed = $("#leftFiexColumn").val(); }
                    if ($("#rightFiexColumn").val() != "") { rightFixed = $("#rightFiexColumn").val(); }
                    currentcharteditor.config.fixedColumns = {
                        leftColumns: leftFixed,
                        rightColumns: rightFixed
                    };

                    if ($("#pagin").is(":checked") == true){
                        currentcharteditor.pagin = '1';
                    }
                    else{
                        currentcharteditor.pagin = '0';
                    }
                    currentcharteditorSpan.innerHTML = JSON.stringify(currentcharteditor);
                }
                ReDrawCurrentChart();
                //把设置的配置项保存到$scope.chartsbg
                chartnm=currentcharteditorSpan.id;
                shbd=$("#showborder").val();
                bdw='';
                bdsty='';
                bdcol='';
                if(shbd=='y'){
                    bdw=$('#borderwidth').val();
                    bdsty=$('#borderstyle').val();
                    bdcol=$('#bordercolor').val();
                }
                stylestr='border-width:'+bdw+"px;"
                            +'border-style:'+bdsty+";"
                            +'border-color:'+bdcol+";"

                scolorvalue=$("#chtbgcolor").val();
                rgbalpha=$('#chartopacity').val();
                if(scolorvalue!='' && scolorvalue!=undefined &&rgbalpha!='' &&rgbalpha!=undefined){
                    stylestr+='background-color:rgba('+hexToR(scolorvalue)+','+hexToG(scolorvalue)+','+hexToB(scolorvalue)+','+rgbalpha+')!important;';
                }else{
                    stylestr+='background-color:'+$("#chtbgcolor").val()+'!important;';
                }
                $scope.chartsbg[chartnm]={
                    exp:stylestr,
                    showborder:shbd,
                    borderwidth:bdw,
                    borderstyle:bdsty,
                    bordercolor:bdcol,
                    chtbgcolor:scolorvalue,
                    chartopacity:rgbalpha
                }
                // console.log('chartsbg',$scope.chartsbg);

                chartsbgsdict={};
                if($scope.basicconfigobj.chartsbgs !=undefined){  //遍历以前的数据，后面的for循环覆盖以前的数据，如果没有重复key则不覆盖
                    if(typeof($scope.basicconfigobj.chartsbgs)=='object')
                        chartsbgsdict=$scope.basicconfigobj.chartsbgs;
                    else if(typeof($scope.basicconfigobj.chartsbgs)=='string')
                        chartsbgsdict=JSON.parse($scope.basicconfigobj.chartsbgs);

                }
                // console.log('chartsbgsdict,all:',chartsbgsdict);
                for(key in $scope.chartsbg){
                    chartsbgsdict[key]=$scope.chartsbg[key];
                }
                $scope.basicconfigobj.chartsbgs=chartsbgsdict;
                //添加到$scope.chartsbg完成
            });
            /**
             * 保存过滤器的设置
             */
            $("#saveConfigFilter").click(function () {
                var filter_module_id = $("#filter_module_id").val();
                $("#" + filter_module_id).css('height', $("#module-height").val()).attr('data-height', $("#module-height").val());
                $("#" + filter_module_id).css('width', $("#module-width").val()).attr('data-width', $("#module-width").val());
                $("#" + filter_module_id).siblings('.filter-title').text($("#filter-label-text").val());
                $("#" + filter_module_id).attr('data-column', $("#filter-column-select").val());
                $("#" + filter_module_id).attr('data-method', $("#filter-method").val());
                $("#" + filter_module_id).attr('data-default', $("#filterDeault").val());
                //下拉框值
                filterInputType=$("#" + filter_module_id).attr('type');
                if(filterInputType != 'input'){
                    $("#" + filter_module_id).attr('data-options', $("#filterselectvalues").val());
                    if($("#filterselectvalues").val()!=""&&$("#filterselectvalues").val().split("\r\n").length>0)
                    {
                        $("#" + filter_module_id).empty();
                        $("#" + filter_module_id).append("<option value='pleaseSelectMyDataIn'>--请选择数据--</option>");//这里的值pleaseSelectMyDataIn会被过滤为空
                        $.each($("#filterselectvalues").val().split("\n"), function (n, r) {
                            // debugger;
                            $("#" + filter_module_id).append("<option value='"+this+"'>"+this+"</option>");
                        });
                    }
                    if ($("#" + filter_module_id).attr('data-filter-type') == 'select'){
                        $("#" + filter_module_id).val($("#filterDeault").val());
                        // $("#" + filter_module_id).trigger('change');//不要每次拖入过滤器都刷新整个区域的图表
                    }
                }
            });
            /**
             * 打开过滤器设置 modal
             */
            $("#demoSave").on('click', "[data-target='#editorFilter']", function () {
                var filter_module = $(this).closest('span').siblings('.view').find('.filter-module');
                var filter_type = filter_module.attr('data-filter-type');
                setFilterModal(filter_module, filter_type);
            });


            /**
             * 页面加载后,需重新绘制已保存的图形
             */
            $('#demoSave').on('change', '.filter-module', _.debounce(function () {
                var allFilter = $('#demoSave').find('.filter-module');
                var paramArry = [];
                allFilter.each(function () {
                    var value = $(this).val();
                    var filter_type = $(this).attr('data-filter-type');
                    var filter_method = $(this).attr('data-method');
                    var column = $(this).attr('data-column');
                    if (value && value != '') {
                        if (filter_type == 'text') {
                            paramArry.push({
                                key: columnFormat(column, filter_method),
                                value: value
                            });
                        }
                        else if (filter_type == 'daterange') {
                            filter_method = 'range';
                            var startTime = $(this).attr('data-start');
                            var endTime = $(this).attr('data-end');
                            paramArry.push({
                                key: columnFormat(column, 'b_equal'),
                                value: startTime
                            });
                            paramArry.push({
                                key: columnFormat(column, 's_equal'),
                                value: endTime
                            });
                        }
                        else if (filter_type == 'select') {
                            value = value == 'pleaseSelectMyDataIn'?'':value;//空值转换
                            paramArry.push({
                                key: columnFormat(column, filter_method),
                                value: value
                            });
                        }
                    }
                });
                if (allFilter.length > 0) {
                    var allChart = $("#demoSave").find('.chart-content');
                    var jsonconfig, s, id, url;
                    allChart.each(function () {
                        s = $(this).data('type');
                        id = '';
                        url = '';
                        switch (s) {
                            case 'table':
                                jsonconfig = JSON.parse($(this).closest('.view').find('.tdatatag').text());
                                jsonconfig.data.url = '/api/dash/loadTableData';
                                jsonconfig = changeConfigUrl(jsonconfig, paramArry);
                                id = $(this).find('.table-embed').attr('id');
                                DrawSingleTable(id, jsonconfig, 'only');
                                break;
                            case 'echarts':
                                jsonconfig = JSON.parse($(this).closest('.view').find('.ecdatatag').text());
                                jsonconfig = changeConfigUrl(jsonconfig, paramArry);
                                id = $(this).find('.echart-embed').attr('id');
                                DrawSingleEchart(id, jsonconfig, 'only');
                                break;
                            default:
                                break;
                        }
                    });
                }
            }, 500));
            /**
             * 保存场景
             */
            $("#btnSave").click(function () {
                //校验类别是否为空，如果不选择类别，数据库保存?undefined:undefined?，导致查询出错
                kindvalue=$scope.group.kind;
                if(!kindvalue || typeof(kindvalue)=='undefined' || kindvalue.indexOf('undefined')>0){
                    alert('请选择类别！');
                    return;
                }
                //把图表的背景颜色存入basicconfig
                // var chartsbgsdict={};
                // if($scope.basicconfigobj.chartsbgs !=undefined)  //遍历以前的数据，后面的for循环覆盖以前的数据，如果没有重复key则不覆盖
                //     chartsbgsdict=$scope.basicconfigobj.chartsbgs;
                // // console.log(chartsbgsdict);
                // for(key in $scope.chartsbg){
                //     // console.log(key,$scope.chartsbg[key]);
                //     chartsbgsdict[key]=$scope.chartsbg[key];
                // }
                //当用户在全局设置里没有点击保存按钮，这里给一个默认值，不然在重新编辑的时候选择主题不能显示背景图片
                //当用户在全局设置里点击了保存按钮，bc的值就不为空就不执行下面的语句
                if($scope.basicconfigobj.chartsbgs==undefined)//防止用户没有编辑图表背景样式
                    $scope.basicconfigobj.chartsbgs={};
                // console.log('savebtn,chts:',$scope.basicconfigobj.chartsbgs);
                bc=$("#basicconfig").val();
                if(!bc || bc=="" || bc.replace(/^\s+|\s+$/gm,'')==""){
                    defaultv="{\"globaltheme\":\"/frontend/css/dashthemes/default/default.css\",\"globalwidth\":\"\",\"globalbgcolor\":\"\",\"globalbgpicurl\":\"\",\"chartsbgs\":"+JSON.stringify($scope.basicconfigobj.chartsbgs)+"}";
                    console.log('defaultv:',defaultv);
                    $("#basicconfig").val(defaultv);
                }
                else{
                    var indexed_array = {};//遍历basicconfig的值，把每个chart的背景色存入
                    var bfjson=JSON.parse(bc);

                    for(key in bfjson){
                        indexed_array[key] = bfjson[key];
                    }
                    indexed_array['chartsbgs']=$scope.basicconfigobj.chartsbgs;
                    // console.log('JSON.stringify(indexed_array):',JSON.stringify(indexed_array));
                    $("#basicconfig").val(JSON.stringify(indexed_array));
                }
                // console.log('btnsave,id,basicconfig:',$("#basicconfig").val());
                // console.log('$("#dataform").serialize() ',$("#dataform").serialize() );
                //保存charts配置项结束
                $.ajax({
                    url: '/api/setscenes/',
                    type: 'post',
                    data: $("#dataform").serialize() //$scope.group
                }).then(function (rs) {
                    if (!confirm("保存成功!继续编辑请点击'确定',转到场景列表页点击'取消' ")) {
                        window.location.href = "/dashboard/scenelist";
                    } else { 
                        if (rs.id) {
                            window.location.href = "/dashboard/boarddesign?id="+rs.id;
                        }
                        $('#downloadModal').modal('hide'); 
                    }
                });
            });


            // $("#menutoggle").click(function () {
            //     $('.nav-collapse').css("height", $('.nav-collapse').css("height") != "0px" ? "0px" : "auto");
            // });
            CKEDITOR.disableAutoInline = true;
            contenthandle = CKEDITOR.replace('contenteditor', {
                language: 'zh-cn',
                contentsCss: ['../frontend/css/bootstrap-combined.min.css'],
                allowedContent: true
            });
            // $(document).on('mouseover', ".chart-title", function (e) {
            //     var x = e.clientX;
            //     var y = e.clientY;
            //     $(".float-view").css({
            //         'display':'block',
            //         'top':y + 'px',
            //         'left':x + 'px'
            //     });
            //     console.log(e);
            // });
            // $(document).on('mouseleave', ".chart-title", function (e) {
            //     console.log(e);
            // });
            $(document).on('mouseover', ".chart-title", function () {
                $(this).next().show();
                // $(".sidebar-nav").removeClass('scroll-y');
            });
            $(document).on('mouseleave', ".chart-title", function () {
                $(this).next().hide();
                // $(".sidebar-nav").addClass('scroll-y');
            });
        });
    });
    //$uibModalInstance是模态窗口的实例
    $("#golbaltheme").click(function () {
        $("#editorGlobal").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
    function getDate(type) {
        var currDate=new Date();
        if(type=='year'){
            return currDate.getFullYear();
        }else if(type=='month'){
            return currDate.getMonth()+1;
        }
        return type;
    }
}());