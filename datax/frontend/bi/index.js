
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var btGroupStatus = true;
function closeBtnGroup(status) {
    btGroupStatus = status;
}
var IInterval = 60000;
function changeInterval2(noWrapSlides, myInterval) {
    if (noWrapSlides) {
        IInterval = 50000000;
    } else {
        IInterval = myInterval;
    }
}

setSession('paramArry',[]);
setSession('active',0);
var app = angular.module('biApp', ['ngAnimate', 'ngSanitize', 'angular-sortable-view', 'ui.bootstrap']);//


app.directive('resize', function ($window) {
    return function (scope) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return { 'h': w.height(), 'w': w.width() };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            scope.style = function () {
                return {
                    'height': (newValue.h - 20) + 'px'
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});


app.controller('biController', function ($scope, $http, $timeout, $sce, $uibModal) {
    $scope.downBar = false;
    $scope.interval = 20000;
    $scope.downTheme = function (fileType) {
        var themeObj = document.getElementById("canvas");
        var backgroundColor = themeObj.getAttribute('background-color');
        if (backgroundColor == null || backgroundColor == 'null') {
            backgroundColor = '#fff';
        }

        html2canvas($('#canvas'), {
            width: themeObj.scrollWidth, //获取dom 宽度
            height: themeObj.scrollHeight, //获取dom 高度
            onrendered: function (canvas) {
                // 【重要】默认转化的格式为png,也可设置为其他格式
                var imgType = 'image/jpeg';
                var url = canvas.toDataURL();
                if (fileType == 'share') {
                    var modalInstance = $uibModal.open({
                        animation: true,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        templateUrl: '/bi/share',
                        controller: 'shareController',
                        controllerAs: '$ctrl',
                        size: 'lg',
                        openedClass: 'share-window',
                        resolve: {
                            imgUrl: function () {
                                return url;
                            }
                        }
                    });
                    modalInstance.result.then(function () {

                    }, function () {
                    });
                } else if (fileType == 'pic') {
                    var triggerDownload = $("<a>").attr("href", url).attr("download", "主题" + new Date().getTime() + ".png").appendTo("body");
                    triggerDownload[0].click();
                    triggerDownload.remove();
                } else if (fileType) {
                    $http({
                        method: 'POST',
                        url: '/api/dash/exportTheme',
                        headers: { 'X-CSRFToken': getCookie('csrftoken') },
                        data: {
                            picUrl: url,
                            picWidth: themeObj.scrollWidth,
                            picHeight: themeObj.scrollHeight,
                            backgroundColor: backgroundColor,
                            fileType: fileType
                        }
                    }).success(function (rs) {
                        var filePath = rs.filePath.substr(1);
                        var fileName = rs.fileName;
                        var triggerDownload = $("<a>").attr("href", filePath).attr("download", "主题" + fileName).appendTo("body");
                        triggerDownload[0].click();
                        triggerDownload.remove();
                    });
                }
            }
        });
    };

    $scope.$watch('downBar', function () {
        if (!btGroupStatus) {
            $scope.downBar = false;
        }

    });


    $scope.showIconDown = function (fileType, fileName) {
        if (fileName == 'share') {
            $("#downIconTip").html("标注并分享");
        } else {
            $("#downIconTip").html("导出为" + fileName);
        }
        var tipTop = $("." + fileType).offset().top + $("." + fileType).height() + 15;
        var tipLeft = $("." + fileType).offset().left + $("." + fileType).width();
        $("#downIconTip").css("top", tipTop);
        $("#downIconTip").css("left", tipLeft);
        $("." + fileType).addClass('faHover');
    };

    $scope.showIconCancel = function (fileType) {
        $("#downIconTip").html("");
        $("." + fileType).removeClass('faHover');
    };
    
    $scope.paramArry = getSeeion('paramArry');
    $scope.active = getSeeion('active');
    $scope.filterInit = false;
    $scope.chartIdLsit = [];
    $scope.chartDataList = [];
    $scope.bgConfigs = [];
    $("body").mLoading();//遮罩层

    $http.get('/api/dash/getThemeDetail/' + themeid + '/' + type).then(function (response) {
        if (response.data.code === '1') {
            $scope.scenelists = response.data.lists;

            if (response.data.themeconfig != undefined && response.data.themeconfig != null && response.data.themeconfig != '') {
                $scope.themeConfig = JSON.parse(response.data.themeconfig);
                // console.log(response.data.themeconfig);
                if (!$scope.themeConfig.wrapSlides) {
                    $scope.interval = $scope.themeConfig.interval * 1000;
                    IInterval = $scope.themeConfig.interval * 1000;
                }
            }
            //如果是scene类型，就把配置的scene显示出来
            if (type == 'scene' && response.data.basicconfig != '') {

                basicconfig = JSON.parse(response.data.basicconfig);
                $scope.bgConfigs.push({id:0, basicconfig:basicconfig});
                //var sceneObj = $('.demo');
                //updateBasicConfig(basicconfig, sceneObj);
            }
            $scope.scenelists.map(function (index, i) {
                // index.formatHtml = $sce.trustAsHtml(index.html);
                index.formatHtml = $sce.trustAsHtml(index.html);
                //设置背景图
                if (index.basicconfig != '' && index.basicconfig != null) {
                    basicconfig = JSON.parse(index.basicconfig);
                    $scope.bgConfigs.push({id:i, basicconfig:basicconfig});
                } else {
                    $scope.bgConfigs.push({id:i, basicconfig:{}});
                }

            });
            document.title = response.data.name;
            buildParam($scope.scenelists.length);
            $timeout(function(){
                if ($(document).find('.filter-module').length > 0) {
                    $(document).find(".filter-module").each(function () {
                        var type = $(this).attr('data-filter-type');
                        initFilterPlugins(type, $(this));
                    });
                }
                doFilter();
                 var child=$(".filter-title").parent();
                 var filter = $("<div class='filterFrameStyle'></div>");
                 child.wrapInner(filter);
                 backShowAddtionText(response.data.options);
            });
            
        }
        else {
            $scope.isfail = true;
            document.title = '未找到图表';
            $("body").mLoading('destroy');//清除遮罩层
        }
    });

    $scope.htmlSnippet = function (html) {
        return $sce.trustAsHtml(html);
    };

    function backShowAddtionText(options){//根据数据库信息回显
        if(options && options['addtionCommonText']!=undefined){
            mychartdivs = $(document.body).find("div.demo").find("div.echart-embed");
            mychartdivs.each(function () {
                parentDiv=$(this).closest('.chart-content');
                addtTextDiv=parentDiv.parent().parent().children('.addChartTagStyle').children('.view')[0];
                if(addtTextDiv){
                    var targId=parentDiv.find('.vega-embed').attr('id');//这里是图表的id
                    targId=targId.match(/[a-f0-9]{32}/)[0];
                    options['addtionCommonText'].map(function (item) {
                        if(item['id']==targId){
                            $(addtTextDiv).html(item['html']);
                            getAlertInfo(addtTextDiv,parentDiv);//对回显的数据进行修改(只修改alertMsg的文本，其他文本不动)
                            if(item['hideStatus']=='show'){//判断用户保存图表状态
                                parentDiv.parent().parent('.cell-box').attr('hoverUnBind','yes');//添加一个属性来区分是否需要绑定hover事件
                                parentDiv.parent().parent('.cell-box').unbind('mouseenter').unbind('mouseleave');//移除mouse的hover事件
                                $(addtTextDiv).summernote(smoptions);
                                //还需要隐藏addtTextDiv的父层级,在423行处
                            }
                        }
                    })
                }
            });

        }
    }

        
    function updateBasicConfig(basicconfig, sceneObj) {
        globaltheme = basicconfig.globaltheme;
        globalbgpicurl = basicconfig.globalbgpicurl;
        globalbgcolor = basicconfig.globalbgcolor;
        //初始化主题绑定
        //未设置主题时,设置绑定背景色
        defaulttheme = "/frontend/css/dashthemes/default/default.css";
        if (globaltheme != defaulttheme) {
            replacejscssfile(defaulttheme, globaltheme, "css");
        }
        if (globalbgpicurl != "") {
            sceneObj.css("background", "url(" + globalbgpicurl + ") no-repeat");
            sceneObj.css("background-size", "100% 100%");
            //url(http://127.0.0.1:8000/frontend/upload/user_1/201804101909572(4).jpg) 100% center / 100% 100% no-repeat
        } else if (globaltheme == defaulttheme && globalbgpicurl == "" && globalbgcolor != "") {
            sceneObj.parent().css("background-color", globalbgcolor);
        }
    }

    //在场景设计里也有一个这个函数
    function getAlertInfo(viewTag,parentDiv){
        //渲染图表以后接着获取警告信息，信息来与业务规则的配置，excuteRule函数
        //从parentDiv里获取olapid
        var olapId='';
        var type = $(parentDiv).attr('data-type');
        if (type === 'echarts') {
            datatag = $(parentDiv).nextAll("span.ecdatatag");
            ecconfig = JSON.parse(datatag.eq(0).text());
            var olapUrl=ecconfig.data.url;
            olapId=olapUrl.match(/[a-f0-9]{32}/)[0];
        }else if (type === 'table') {
            datatag = $(this).nextAll("span.tdatatag");
            ecconfig = JSON.parse(datatag.eq(0).text());
            olapId=ecconfig.olapid;
        }
        //从parentDiv里获取olapid完成
        try{
            if (!olapId || olapId =='' || !viewTag) {
                console.log('----ecconfig.data is null----');
                return false;
            }
            $.ajax({
                url: '/api/dash/getBussRuleMsg',
                type: 'GET',
                async:false,
                data: {olapId:olapId}
            }).then(function (rs) {
                var viewDivTag=$(viewTag);
                var allAlertInfo=viewDivTag.find('.allAlertInfo');
                if(!allAlertInfo[0]){
                    allAlertInfo=$('<div>').addClass('allAlertInfo');
                }
                if(rs.code == 1){
                    allAlertInfo.html('');//清空alertinfo里的文本，根据返回信息重新生成alert信息展示
                    if(rs.bussRuleMsg && rs.bussRuleMsg.length>0){//rs.bussRuleMsg是一个包含四项属性的对象数组
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
                        $(viewDivTag).prepend(allAlertInfo);
                    }
                }
                if(! viewDivTag.find("span[class='addtiontext']")[0]){//提示用户添加标注文本
                    $(viewDivTag).append($('<span>').addClass('addtiontext').text('请添加标注文本！'));
                }
            });
        }catch(error){
            console.log('error=',error);
            console.log('=====error=====;file:dashboard/index.js;method:DrawSingleEchart;line:1879')
        }
        //获取警告信息完成
    }



    function InitChartViews() {
        var staticstyle = $(".cell-box .view");
            staticstyle.addClass("staticFrameStyle");
        var activeindex = angular.copy($scope.active);
        var chartsbgs=[];
        if($scope.bgConfigs[0] && $scope.bgConfigs[0].basicconfig){//防止table等没有添加basicconfig造成js报错
            // console.log('-r1',$scope.bgConfigs[0].basicconfig);
            chartsbgs=typeof($scope.bgConfigs[0].basicconfig.chartsbgs)=='undefined'?[]:$scope.bgConfigs[0].basicconfig.chartsbgs;
        }
        // console.log('-r2',$scope.bgConfigs[0].basicconfig);

        var chartdivs = $(".carousel-inner .item:eq(" + activeindex + ")").find(".chart-content");
        chartdivs.each(function () {
            try {
                var type = $(this).attr('data-type');
                var chardiv, datatag, ecconfig, id, data;
                if (type === 'echarts') {
                    chardiv = $(this).find("div.echart-embed");
                    datatag = $(this).nextAll("span.ecdatatag");
                    ecconfig = JSON.parse(datatag.eq(0).text());
                    url = ecconfig.data.url;
                    $scope.paramArry[activeindex].map(function (item) {
                        url = changeUrl(url, item.key, item.value);
                    });
                    ecconfig.data.url = url;
                    id = chardiv.attr('id');
                    if ($scope.chartIdLsit.indexOf(id) >= 0) {
                        if ($scope.chartDataList[id]['url'] != url) {
                            data = DrawSingleEchart(id, ecconfig);
                            $scope.chartDataList[id] = {
                                url: ecconfig.data.url,
                                data: data
                            };
                        }
                        else {
                            DrawSingleEchart(id, ecconfig, $scope.chartDataList[id]['data']);
                        }
                    }
                    else {
                        $scope.chartIdLsit.push(id);
                        data = DrawSingleEchart(id, ecconfig);
                        $scope.chartDataList[id] = {
                            url: ecconfig.data.url,
                            data: data
                        };
                    }
                    // var data = DrawSingleEchart(id, ecconfig);
                }
                else if (type === 'table') {
                    chardiv = $(this).find("div.table-embed");
                    datatag = $(this).nextAll("span.tdatatag");
                    ecconfig = JSON.parse(datatag.eq(0).text());

                    url = ecconfig.data.url;
                    $scope.paramArry[activeindex].map(function (item) {
                        url = changeUrl(url, item.key, item.value);
                    });
                    ecconfig.data.url = url;
                    id = $(chardiv).attr('id');
                    if ($scope.chartIdLsit.indexOf(id) >= 0) {
                        if ($scope.chartDataList[id]['url'] != url) {
                            DrawSingleTable(id, ecconfig);
                        }
                        else {
                            DrawSingleTable(id, ecconfig, $scope.chartDataList[id]['data']);
                        }
                    }
                    else {
                        $scope.chartIdLsit.push(id);
                        DrawSingleTable(id, ecconfig);
                        // data = $(chardiv).myTableFuc(ecconfig);
                    }
                }
                //开始设置图表背景颜色，循环每一个图表，得到图表名并在chartsbgs查找匹配的项，查找到后赋值背景颜色
                for(key in chartsbgs){
                    if((datatag.eq(0).attr('id'))==key){
                        //再全局设置边框圆角后，需要把它分别应用到每个图表
                        chartsbgstyle=chartsbgs[key].exp+'border-radius:'+$scope.bgConfigs[0].basicconfig.roundvalue+'px;';
                        $(this).css('cssText',chartsbgstyle);
                        $(this).parent().siblings('div .addChartTagStyle').css('cssText',chartsbgstyle);//图表右下角按钮添加相同的样式
                        break;
                    }
                }
                //将所有图表的底部文本标注都收缩起来
                $(this).parent().siblings('div .addChartTagStyle').find('.view').each(function () {
                    var btnDiv=$(this).siblings("div[class='addChartTagBtnDiv']");
                    var emParentTag=btnDiv.find("button[name='addChartTagBtn']")[0];
                    if(emParentTag){
                        $(emParentTag).children('em').removeClass('glyphicon-heart').addClass('glyphicon-list');//修改为初始图标
                    }
                    $(this).css('cssText','display:none');
                    //展开有标志位的文本编辑框
                    if($(this).parent().parent('.cell-box').attr('hoverUnBind')){
                        $(this).parent().css('cssText','display: block;');
                        $(emParentTag).children('em').removeClass('glyphicon-list').addClass('glyphicon-heart');
                    }
                });
            }
            catch (e) {
                // console.log(e);
            }
        });
        $(".scene-content").each(function(index) {
            if ($(this).hasClass('active')) {
                if ($scope.bgConfigs.length > 0) {
                    for (var key in $scope.bgConfigs) {
                        if ($scope.bgConfigs[key].id == index) {
                            //console.log('$scope.bgConfigs[key].id',$scope.bgConfigs[key].id)
                            //console.log('$scope.bgConfigs',$scope.bgConfigs)
                            //console.log('index',index)
                            updateBasicConfig($scope.bgConfigs[key].basicconfig, $(this).find('.demo'))
                            break;
                        }
                    }
                }
            }
        });
        $("body").mLoading('destroy');//清除遮罩层
        //页面加载完成后给每个图表添加鼠标事件
        additionTagShowAndHide();
    }
    function initFilterPlugins(filter_type, module_div) {
        if (module_div.attr('data-height') != '') {
            module_div.css('height', module_div.attr('data-height'));
        }
        if (module_div.attr('data-width') != '') {
            module_div.css('width', module_div.attr('data-width'));
        }

        if (filter_type === 'daterange') {
            module_div.attr('data-start', moment().subtract(29, 'days').format('YYYY-MM-DD HH:mm:ss'));
            module_div.attr('data-end', moment().format('YYYY-MM-DD HH:mm:ss'));
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
        else if (filter_type == 'select') {
            var default_value = module_div.attr('data-default');
            if (default_value) {
                module_div.val(default_value);
            }
        }

    }

    function columnFormat(column, method) {
        return column + "(_)" + method;
    }



    function DrawSingleEchart(chartid, ecconfig, data) {
        var element = $("#" + chartid);
        return buildEchart(ecconfig, element, data);
    }

    function DrawSingleTable(chartid, ecconfig, sourcedata) {
        if (typeof sourcedata == 'object') {
            $("#" + chartid).myTableFuc(ecconfig, sourcedata);
        }
        else {
            $.ajax({
                url: ecconfig.data.url,
                type: 'post',
                data: {
                    column: JSON.stringify(ecconfig.columns),
                    olapid: ecconfig.olapid,
                    limit: ecconfig.length,
                    merge: ecconfig.merge,
                    mergeCols:JSON.stringify(ecconfig.mergeCols),
                    page:1
                }
            }).success(function (rs) {
                $("#" + chartid).myTableFuc(ecconfig, rs.data,rs.total);
                $scope.chartDataList[chartid] = {
                    url: ecconfig.data.url,
                    data: rs.data
                };
                // $scope.chartDataList[chartid] = rs.data;
            });
        }
    }

    function buildParam(num) {
        for (var i = 0; i < num; i++) {
            var url = location.href;
            urlAry = url.split('?');
            $scope.paramArry.push([]);
            if (urlAry[1]) {
                param = urlAry[1].split('&');
                if (param.length > 0) {
                    param.map(function (row) {
                        var rowAry = row.split('=');
                        addParam(columnFormat(rowAry[0], 'equal'), rowAry[1], i);
                    });
                }
            }
        }

    }

    function addParam(key, value, i) {
        var flag = false;
        $scope.paramArry[i].map(function (row) {
            if (row.key == key) {
                flag = true;
                row.value = value;
            }
        });

        if (!flag) {
            $scope.paramArry[i].push({
                key: key,
                value: value
            });
        }
        InitChartViews();
    }

    function doFilter() {
        var allFilter = $('#canvas').find('.filter-module');
        var i = angular.copy($scope.active);
        allFilter.each(function () {
            var value = $(this).val();
            var filter_type = $(this).attr('data-filter-type');
            var filter_method = $(this).attr('data-method');
            var column = $(this).attr('data-column');
            if (value !== '') {
                if (filter_type === 'text') {
                    $scope.paramArry[i].push({
                        key: columnFormat(column, filter_method),
                        value: value
                    });
                    InitChartViews();//暂时这样解决
                }
                else if (filter_type === 'daterange') {
                    filter_method = 'range';
                    var startTime = $(this).attr('data-start');
                    var endTime = $(this).attr('data-end');
                    addParam(columnFormat(column, 'b_equal'), startTime, i);
                    addParam(columnFormat(column, 's_equal'), endTime, i);

                }
                else if (filter_type == 'select') {
                    value = value == 'pleaseSelectMyDataIn'?'':value;//空值转换
                    addParam(columnFormat(column, filter_method), value, i);
                }
            }else{
                //如果选择的value为空，则从$scope.paramArry中移除对应参数并刷新图表
                keyparam=columnFormat(column, filter_method);
                indexOfKey=-1;
                $scope.paramArry[i].map(function(val,index,arr){
                    if(val.key==keyparam){
                        indexOfKey=index;
                    }
                });
                if(indexOfKey!=-1){
                    $scope.paramArry[i].splice(indexOfKey,1);
                    InitChartViews();
                }
            }
        });
    }

    $('#canvas').on('change', 'input.filter-module', _.debounce(function () {
        $("body").mLoading();//遮罩层
        doFilter();
    }, 1000));

    $('#canvas').on('change', 'select.filter-module', function () {
        $("body").mLoading();//遮罩层
        doFilter();
    });
    $scope.ifInit = false;
    //这里watch很慢，直接在addParam函数里调用InitChartViews方法最正确，update time 20180701
    $scope.$watch('paramArry',function(val){
        setSession('paramArry',val);
    },true);

    $scope.$watch(function(){
        return getSeeion('paramArry');
    }, function () {
        $timeout(function () {
            InitChartViews();
        }, 1000);
    }, true);

    $scope.$watch('active', function (val) {
        if ($scope.scenelists && $scope.scenelists.length > 1){
            $timeout(function () {
                InitChartViews();
                
            }, 1000);
            setSession('active', val);
        }
    });

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
        for (var i = allsuspects.length; i >= 0; i--) {
            if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(oldfilename) != -1) {
                var newelement = createjscssfile(newfilename, filetype);
                allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
            }
        }
    }
});

app.controller('shareController', function ($scope, $http, $uibModalInstance, $timeout, imgUrl) {
    $scope.userlist = [];
    $scope.users = []
    $scope.themePic = imgUrl;
    $timeout(function () {
        initPicShare();
    }, 500);

    $http.get('/api/getAllUser/').then(function (data) {
        $scope.userlist = data.data.users;
    });

    $scope.sendCharts = function () {
        $scope.tempUserArr = [];
        for (var key in $scope.userlist) {
            if ($scope.users[key]) {
                $scope.tempUserArr.push($scope.userlist[key]);
            }
        }
        if ($scope.tempUserArr.length > 0) {
            var shareCanvas = document.getElementById('shareCanvas');
            html2canvas($('#shareCanvas'), {
                width: shareCanvas.scrollWidth, //获取dom 宽度
                height: shareCanvas.scrollHeight, //获取dom 高度
                onrendered: function (canvas) {
                    var picUrl = canvas.toDataURL();
                    $http({
                        method: 'POST',
                        url: '/api/dash/shareTheme',
                        headers: { 'X-CSRFToken': getCookie('csrftoken') },
                        data: {
                            shareType: 'email',
                            picUrl: picUrl,
                            picWidth: shareCanvas.scrollWidth,
                            picHeight: shareCanvas.scrollHeight,
                            users: $scope.tempUserArr
                        }
                    }).success(function (rs) {
                        if (rs.status == 'y') {
                           socket = new WebSocket("ws://" + window.location.host + "/chat/");
                            socket.onmessage = function(e) {
                                alert(e.data);
                           }
                            socket.onopen = function() {
                                socket.send("发送成功");
                        }
                        if (socket.readyState == WebSocket.OPEN) socket.onopen();
                        } else {
                             socket = new WebSocket("ws://" + window.location.host + "/chat/");
                            socket.onmessage = function(e) {
                                alert(e.data);
                           }
                            socket.onopen = function() {
                                socket.send("未配置邮件信息或信息不正确，仅内部服务器发送成功");
                        }
                        }
                    });
                }
            })
        }
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

