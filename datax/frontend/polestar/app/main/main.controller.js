function dateFtt(fmt, date) { //
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
(function () {
    "use strict";
    angular.module("polestar")
        .controller("MainCtrl", function ($scope, $http, $document, $timeout, Spec, Dataset, Config, consts, Logger, Modals, FilterManager, $uibModal) {
            $scope.ismodal = GetQueryString("ismodal");
            $scope.Spec = Spec;
            $scope.echartMark = chartTypeArrs;
            $scope.Dataset = Dataset;
            $scope.Config = Config;
            $scope.Logger = Logger;
            $scope.FilterManager = FilterManager;
            $scope.consts = consts;
            $scope.showDevPanel = true;
            $scope.embedded = !!consts.embeddedData;
            $scope.chartextension = 'echarts';
            $scope.kinds = [];
            $http.get("/api/type/getTypeList").then(function (rs) {
                $scope.kinds = rs.data;
            });
            $http.get('/api/account/info').then(function (response) {
                $scope.username = response.data.username;
                $scope.nickname = response.data.nickname;//显示昵称而不是账户名

		    });
            var date = new Date()

            $scope.initEchartfn = function (type) {
                var width = angular.element('.vis-pane').width();
                var height = angular.element('.vis-pane').height();
                if (!$scope.Dataset.currentDataset) {return {};}
                var url = $scope.Dataset.currentDataset.url;
                $scope.data = $scope.Dataset.data;
                var rs = initChartConfig(type, url, width, height);
                return rs;
            };
            $scope.ecconfig = {};
            $scope.ecconfigjson = "";
            $scope.once = '0';
            $scope.refreshconfig = function () {
                $scope.ecconfigjson = JSON.stringify($scope.ecconfig);
            }
            $scope.$watch("Spec.spec.mark", function (mark) {
                if (mark === '__ANY__') {
                    $scope.Spec.spec.mark = 'pie';
                    return;
                }
                if ($scope.isechart(mark)) {
                    if (consts.echartconfig) {
                        if (consts.echartconfig.data.type !== mark) {
                            $scope.ecconfig = $scope.initEchartfn(mark);
                            return;
                        } else {
                            $scope.ecconfig = consts.echartconfig;
                            $scope.data = $scope.Dataset.data;
                            $scope.once = '1';
                        }
                    } else {
                        $scope.ecconfig = $scope.initEchartfn(mark);
                    }
                    //设置图表大小为.vis-pane的面板大小，但编辑的时候初始化面板大小不是占满全部canvas,
                    // 所以还是使用$scope.ecconfig的width和height以统一新建和编辑的图表大小
                    var width = angular.element('.vis-pane').width();
                    var height = angular.element('.vis-pane').height();
                    $scope.ecconfig.width = width;
                    $scope.ecconfig.height = height;
                }
            });
            $scope.$watch('Dataset.data', function (data) {
                $scope.data = data;
            }, true);

            if ($scope.embedded) {
                // use provided data and we will hide the dataset selector
                Dataset.dataset = {
                    values: consts.embeddedData,
                    name: "embedded"
                };
            }
            $scope.isechart = function (mark) {
                return $scope.echartMark.indexOf(mark) >= 0;
            };

            $scope.loadData = function () {
                if ($scope.Dataset.data.length == 0) {
                    $scope.Dataset.loading = true;
                    Dataset.update(Dataset.dataset).then(function () {
                        Config.updateDataset(Dataset.dataset);
                        if ($scope.Dataset.data.length == 0) {
                            $scope.Dataset.onData = true;
                        }
                        else {
                            $scope.Dataset.onData = false;
                        }
                        $scope.Dataset.loading = false;
                    });
                }
            };
            if (consts.initialDataset) {
                Dataset.dataset = consts.initialDataset;
                Dataset.update(Dataset.dataset).then(function () {
                    Config.updateDataset(Dataset.dataset);
                    if (consts.initialSpec) {
                        $scope.Spec.spec.mark = consts.initialSpec;
                    }
                });
            }
            else {
                $scope.Dataset.currentDataset = angular.copy($scope.Dataset.dataset);
                // 没有olap的时候此处会报错
                if ($scope.Dataset.dataset) {
                    $scope.Dataset.nowName = angular.copy($scope.Dataset.dataset.name);
                }
                $scope.Dataset.data = [];
            }
            // initialize undo after we have a dataset
            $timeout(function () {
                $(".sss").hide();
            });
            $scope.showjson = false;
            $scope.getconfig = function (size) {
                var imgpath = "";
                html2canvas($(".vis-pane"), {
                    onrendered: function (canvas) {
                        imgpath = canvas.toDataURL();
                        var modalInstance = $uibModal.open({
                            templateUrl: "myModalContent.html",
                            controller: "ModalInstanceCtrl",
                            backdrop: "static",
                            controllerAs: "vm",
                            size: size,
                            resolve: {
                                itemC: function () {
                                    return {
                                        id: GetQueryString("id"),name: CurrentName||$scope.ecconfig.title.text,kind: CurrentKind,remark: remark,keywords: keywords,refreshspeed: refreshspeed,
                                        createtime: date,createname: $scope.username,jsonconfig: $scope.Spec.spec.mark,
                                        //  $scope.chartextension=='vega'?JSON.stringify(Spec.chart.vlSpec):JSON.stringify($scope.echartconfig),
                                        filterstring: JSON.stringify($scope.FilterManager.filterIndex), datasetstring: JSON.stringify($scope.Dataset.currentDataset),
                                        charttype: $scope.chartextension, imgpath: imgpath, echartconfig: JSON.stringify($scope.ecconfig)
                                    };},
                                kinds:function () {return $scope.kinds}}});
                        modalInstance.result.then(function () {
                        }, function () {});}});};
            $scope.backlist = function () {
                location.href = "/dashboard/chartlist";
            };
            //打开搜索
            $timeout(function () {
                var typePopup = new Drop({
                      content: $('.dataset-search-container')[0],
                      target: $('.dataset-search')[0],
                      position: 'bottom left',
                      openOn: 'click'
                  });
            },300);
            $scope.SearchText = "";
            $scope.SearchChange = function(e){//字段过多时查询功能
                //var keycode = window.event?e.keyCode:e.which;
                $scope.SearchText  = e.currentTarget.value;
                var fields = Dataset.schema.fieldSchemas;
                for(var i = 0;i<fields.length;i++)
                {
                    fields[i].hidden = $scope.SearchText!=""&&fields[i].field.toString().toLowerCase().indexOf($scope.SearchText.toString().toLowerCase())<0?'true':'false';
                }
            }
        });

    //$uibModalInstance是模态窗口的实例
    angular.module("polestar").controller("ModalInstanceCtrl", function ($scope, $http, $uibModalInstance, $timeout, itemC, kinds) {
        // if (Number(itemC.kind) > 0) {
        //     itemC.kind = Number(itemC.kind);
        // }
        $scope.kinds = kinds;
        $scope.group = itemC || {};
        if($scope.group.createtime !=undefined && $scope.group.createtime!=''){
            $scope.group.createtime=dateFtt("yyyy年MM月dd日hh时mm分",new Date($scope.group.createtime));
        }
        if (!$scope.kinds || $scope.kinds.length == 0) {
            console.log('kind is empty.$scope.kinds=',$scope.kinds);
            $http.get("/api/type/getTypeList").then(function (rs) {
                $scope.kinds = rs.data;
            });
        }
        $scope.ok = function () {
            $http({
                method: 'POST',
                url: '/api/setcharts/',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                data: $scope.group
            }).success(function (rs) {
                // debugger
                if (rs.status == 'failure') {
                    alert('保存失败！');
                } else {
                    alert('保存成功');
                    if (rs.data.id) {
                        if (!Number($scope.group.id) > 0) {window.location.href = "/dashboard/chartdesign?id=" + rs.data.id;}
                    }
                }
                $uibModalInstance.close()
            });
            /*
            $.ajax({
                url: "/api/setcharts/",
                type: "post",
                data: $("#dataform").serialize()
            }).then(function (rs) {
                if (!confirm("保存成功!继续编辑请点击'确定',转到组件列表页点击'取消' ")) {
                    window.location.href = "/dashboard/chartlist";
                } else {
                    if (rs.id) {
                        if (!Number($scope.group.id) > 0) {window.location.href = "/dashboard/chartdesign?id=" + rs.id;}
                    }
                    $uibModalInstance.close();
                }});
                */
            };
        $scope.cancel = function () {
            $uibModalInstance.dismiss("cancel");
        };
        //根据olapid自动选择类型
        try{
            var tempDataSetObj = JSON.parse(itemC['datasetstring']);
            $timeout(function () {//必须要等到kinds初始化完成以后再对$scope.group.kind赋值
                $http.get("/api/olap/getOlapObjById?id=" + tempDataSetObj.id).then(function (rs) {
                    if (rs.data.status == 'success') {
                        $scope.group.kind = rs.data.data['charttype'];
                    }
                });
            });
        }catch (e) {
            console.log('paseJSONstr datasetstring error:',e);
        }

        $timeout(function () {
            $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
            });
        })
    });

})();