
var app = angular.module('themeslist', ['ngAnimate', 'ngSanitize', 'angular-sortable-view', 'ui.bootstrap']);//
app.config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});
app.controller("ManageCtrl", function ($scope, $http, $uibModal, $sce, $timeout) {
    //分页参数
    $scope.CurrentTheme = {};
    $scope.slides = [];
    $scope.currentPageNum = 10;
    $scope.totalItems = {};
    //每页显示条数(默认10条)
    $scope.count = "10000";
    $scope.page = 1;
    $scope.param = {};
    $scope.data = {}; // 参数
    $scope.data.param = $scope.param;
    $scope.pagination = {};
    $scope.pagination.data = [];
    $scope.queryList = function (page) {
        $scope.data.startIndex = (page - 1) * $scope.count;//分页起始位置
        $scope.data.count = $scope.count;//分页条数
        $scope.data.orderBy = "id ASC";//排序
        $.ajax({
            url: '/api/dash/getthemes/?format=json',
            type: 'get',
            data: $scope.data
        }).then(function (data) {
            for (var i = 0; i < data.datas.length; i++) {
                data.datas[i].scenesconfig = JSON.parse(data.datas[i].scenesconfig);
            }
            $scope.allthemes = (data.datas);
            $scope.$apply(function () {
                $scope.time = new Date();
            });
        });
    };
    $scope.previewtheme = '';
    $scope.itemclick = function (evt, theme, rowkey) {
        $scope.CurrentTheme = theme;
        if (theme.themeconfig) {
            var tempThemeConfig = JSON.parse(theme.themeconfig)
            if (tempThemeConfig) {
                $scope.myInterval = tempThemeConfig.interval;
                $scope.noWrapSlides = tempThemeConfig.wrapSlides;
            }
        }
        $scope.previewtheme = '/bi/index/theme/' + theme.id;
        document.getElementById('mainframe').setAttribute('src', $scope.previewtheme);
        $timeout(function () {
            mainframe.window.closeBtnGroup(false);
            if (theme.themeconfig != undefined && theme.themeconfig != null && theme.themeconfig != '') {
                var themeConfigtemp = JSON.parse(theme.themeconfig);
                if (!themeConfigtemp.wrapSlides) {
                    mainframe.window.changeInterval2(themeConfigtemp.wrapSlides, themeConfigtemp.interval*1000);
                }
            }
        },5000);
        /*
        $(".scenario-name").hide();
        $(".fa-folder-open-o").addClass("fa-folder-o");
        $(".fa-folder-open-o").removeClass("fa-folder-open-o");
        $(evt.currentTarget).find(".fa-folder-o").addClass("fa-folder-open-o");
        $(evt.currentTarget).next().show();//slideDown();
        $scope.slides = [];
        var scenesconfig = $scope.CurrentTheme.scenesconfig;
        for (var i = 0; i < scenesconfig.length; i++) {
            for (var j = 0; j < $scope.allusers.length; j++) {
                if (scenesconfig[i].id == $scope.allusers[j].id) {
                    $scope.allusers[j].index = $scope.slides.length;
                    $scope.slides.push($scope.allusers[j]);
                    break;
                }
            }
        }
        */
    };
    $scope.queryList($scope.page);
    $scope.cannotSort = false;
    $.ajax({
        url: '/api/getscenes/?format=json',
        type: 'get',
        data: $scope.data
    }).then(function (data) {
        $scope.allusers = data.datas;
        $scope.$apply(function () {
            $scope.time = new Date();
        });
    });

    $scope.reorder = function (data, theme, item, partFrom, partTo, indexFrom, indexTo) {
        for (var i = 0; i < data.length; i++) {
            data[i].sortindex = i;
        }
        $.ajax({
            url: '/api/dash/settheme/',
            type: 'post',
            data: { id: theme.id, code: theme.code, name: theme.name, remark: theme.remark, scenesconfig: JSON.stringify(theme.scenesconfig) }
        }).then(function () {
        });
    };

    $scope.editInfo = function (item) {
        window.location.href = "/dashboard/boarddesign?id=" + item.id;
    };
    $scope.myInterval = 50;
    $scope.noWrapSlides = false;
    $scope.personSet = function (item) {
        item = item || {};
        var modalInstance = $uibModal.open({
            templateUrl: 'myModalSetP.html',
            controller: 'ModalInstanceCtrl',
            controllerAs: 'vm',
            size: 'md',
            resolve: {
                itemC: function () {
                    return item;
                },
                allusers: function () {
                    return $scope.allusers;
                },
                myInterval: function () {
                    return 50;
                },
                noWrapSlides: function () {
                    return false;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.queryList($scope.page);
        }, function () {
        });
    };
    $scope.addSingle = function (event, id) {
        event.preventDefault();
        event.cancelBubble = true;
        var item = {};
        for (var j = 0; j < $scope.allthemes.length; j++) {
            if (id == $scope.allthemes[j].id) {
                item = $scope.allthemes[j];
            }
        }
        var modalInstance = $uibModal.open({
            templateUrl: 'myModalSetP.html',
            controller: 'ModalInstanceCtrl',
            controllerAs: 'vm',
            size: 'md',
            resolve: {
                itemC: function () {
                    return item;
                },
                allusers: function () {
                    return $scope.allusers;
                },
                myInterval: function () {
                    return $scope.myInterval;
                },
                noWrapSlides: function () {
                    return $scope.noWrapSlides;
                }
            }
        });
        modalInstance.result.then(function () {
            $scope.queryList($scope.page);
        }, function () {
        });
    };

    $scope.active = 0;
    $scope.htmlSnippet = function (htmstring) {
        return $sce.trustAsHtml(htmstring + " <script>window.setTimeout(window.InitChartViews,1000);</script>");
    };

    $scope.changeInterval = function () {
        if (Number($scope.myInterval) > 0) {
            mainframe.window.changeInterval2($scope.noWrapSlides, $scope.myInterval*1000);
            var themeconfig = {interval: $scope.myInterval, wrapSlides: $scope.noWrapSlides}
            for (var key in $scope.allthemes) {
                if ($scope.allthemes[key].id == $scope.CurrentTheme.id) {
                    $scope.allthemes[key].themeconfig = JSON.stringify(themeconfig);
                }
            }
            $.ajax({
                url: '/api/dash/settheme/',
                type: 'post',
                data: { id: $scope.CurrentTheme.id, themeconfig: JSON.stringify(themeconfig), name: '', updateType: 'updateInterval' }
            }).then(function () {
                
            });
        }
    }
    // $scope.$watch('active', function(active,pre,scope) {
    //     if(active==0)return;
    //     if(renderedIndex[active])return;
    //     renderedIndex.push(active);
    //     var element = scope.slides[active].htmlcleanconfig;
    //     var chartdivs = $(element).find("div.vega-embed");
    //     chartdivs.each(function(){
    //         RenderChart($("#"+this.id)[0]);
    //     });
    // });

});

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, itemC, allusers, myInterval, noWrapSlides) {
    $scope.group = itemC;
    $scope.users = itemC.scenesconfig || [];//itemC.menus||[];//所有已选
    $scope.allusers = allusers || [];//所有待选
    $scope.selusers = '';//待选区选中的
    $scope.seledusers = '';//已选区选中的
    function checkform() {
        if($scope.group.name==''|| $scope.group.name==undefined){
            alert("请填写主题名称");
            return false;
        }
        if($scope.group.code==''|| $scope.group.code==undefined){
            alert("请填写主题编号");
            return false;
        }
        return true;
    }
    $scope.ok = function () {

        var scenes = [];
        for (var i = 0; i < $scope.users.length; i++) {
            scenes.push({ "id": $scope.users[i].id, "name": $scope.users[i].name, "sortindex": i });
        }
        if(!checkform())return; //校验表单空值
        if(scenes.length==0){
            alert("请选择场景！");
            return;
        }

        var themeconfig = {interval: myInterval, wrapSlides: noWrapSlides}
        $.ajax({
            url: '/api/dash/settheme/',
            type: 'post',
            data: { id: $("#id").val(), code: $("#code").val(), name: $("#name").val(), remark: $("#remark").val(), scenesconfig: JSON.stringify(scenes), themeconfig: JSON.stringify(themeconfig) }
        }).then(function () {
            $uibModalInstance.close();
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.delete = function () {
        if (!confirm('您确认要删除吗?')) { return; }
        $.ajax({
            url: '/api/dash/deltheme/',
            type: 'get',
            data: { id: $("#id").val() }
        }).then(function () {
            $uibModalInstance.close();
        });
    };
    $scope.add = function () {
        for (var i = 0; i < $scope.selusers.length; i++) {
            var added = false;
            for (var j = 0; j < $scope.users.length; j++) {
                if ($scope.selusers[i].id == $scope.users[j].id) {
                    added = true;
                    break;
                }
            }
            if (added) { continue; }
            $scope.users.push($scope.selusers[i]);
        }
    };
    $scope.remove = function () {
        var newsels = [];
        for (var i = 0; i < $scope.users.length; i++) {
            var have = false;
            for (var j = 0; j < $scope.seledusers.length; j++) {
                if ($scope.seledusers[j].id == $scope.users[i].id) {
                    have = true;
                    break;
                }
            }
            if (have) 
            {continue;}
            newsels.push($scope.users[i]);
        }
        $scope.users = newsels;
    };


});


(function () {
    var renderedIndex = [];
    window.InitChartViews = function () {
        if (renderedIndex[0] != null) 
        {return;}
        renderedIndex.push(0);
        var chartdivs = $(document.body).find("div.vega-embed");
        RenderCharts(chartdivs);
        $(document).find(".filter-module").each(function () {
            var type = $(this).attr('data-filter-type');
            initFilterPlugins(type, $(this));
        });
    };

    function initFilterPlugins(filter_type, module_div) {
        if (filter_type == 'daterange') {
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
    }

    function columnFormat(column, method) {
        return column + "(_)" + method;
    }

    $('.right-center').on('change', '.filter-module', _.debounce(function () {
        var allFilter = $('.right-center').find('.filter-module');
        var paramArry = [];
        allFilter.each(function () {
            var value = $(this).val();
            var filter_type = $(this).attr('data-filter-type');
            var filter_method = $(this).attr('data-method');
            var column = $(this).attr('data-column');
            if (value != '') {
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

            }
        });
        if (allFilter.length > 0) {
            var allChart = $(".right-center").find('.chart-content');
            allChart.each(function () {
                var s = $(this).data('type');
                var id = '';
                var url = '';
                var jsonconfig;
                switch (s) {
                    case 'table':
                        jsonconfig = JSON.parse($(this).closest(".chart-content").siblings('.tdatatag').text());
                        url = jsonconfig.url;
                        paramArry.map(function (item) {
                            url = changeUrl(url, item.key, item.value);
                        });
                        jsonconfig.url = url;
                        id = $(this).find('.table-embed').attr('id');
                        DrawSingleTable(id, jsonconfig);
                        break;
                    case 'echarts':
                        jsonconfig = JSON.parse($(this).closest(".chart-content").siblings('.ecdatatag').text());
                        url = jsonconfig.data.url;
                        paramArry.map(function (item) {
                            url = changeUrl(url, item.key, item.value);
                        });
                        jsonconfig.data.url = url;
                        id = $(this).find('.echart-embed').attr('id');
                        DrawSingleEchart(id, jsonconfig);
                        // debugger;
                        break;
                    default:
                        break;
                }
            });
        }
    }, 1000));
    function changeUrl(url, column, value) {
        if (column == '') {
            return url;
        }
        if (url.indexOf('?') >= 0) {
            var urlArray = url.split('?');
            var urlParam = urlArray[1];
            var urlParamArray = urlParam.split('&');
            var ifHasColumn = false;
            urlParamArray.map(function (index, key) {
                var keyVal = index.split('=');
                if (keyVal[0] == column) {
                    ifHasColumn = true;
                    keyVal[1] = value;
                    urlParamArray[key] = keyVal.join('=');
                }
            });
            if (ifHasColumn) {
                url = urlArray[0] + '?' + urlParamArray.join('&');
            }
            else {
                url = url + '&' + column + '=' + value;
            }
        }
        else {
            url = url + '?' + column + '=' + value;
        }
        return url;
    }

    function RenderCharts(chartdivs) {
        chartdivs.each(function () {
            RenderChart(this);
        });
    }
    function RenderChart(obj) {
        try {
            // var totalwidth = $(".theme-right")[0].clientWidth;
            var chardiv = obj;
            var parentdiv = $(chardiv).closest('.chart-content');
            var type = $(parentdiv).data('type');
            var datatag, ecconfig;
            if (type == 'echarts') {
                chardiv = $(obj).siblings("div.echart-embed");
                var id = chardiv.attr('id');
                datatag = $(obj).closest('.chart-content').siblings("span.ecdatatag") || $(obj).next();
                ecconfig = JSON.parse(datatag.text());
                DrawSingleEchart(id, ecconfig);
            }
            else if (type == 'table') {
                chardiv = $(obj).siblings("div.table-embed");
                datatag = $(obj).closest('.chart-content').siblings("span.tdatatag") || $(obj).next();
                ecconfig = JSON.parse(datatag.text());
                $(chardiv).myTableFuc(ecconfig);
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    function DrawSingleEchart(chartid, ecconfig) {
        var element = $("#" + chartid);
        buildEchart(ecconfig, element);
    }

    function DrawSingleTable(chartid, ecconfig) {
        $("#" + chartid).myTableFuc(ecconfig);
    }

})();
