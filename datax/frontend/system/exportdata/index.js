var app = angular.module('exportconfig', ['ui.bootstrap']);
app.controller('exportconfigController', function ($scope, $http) {
    $("[data-toggle='popover']").popover();//提醒事项按钮
    $scope.olapExpNum=100;//导出数据条数默认100条

    $scope.themelist=[];
    $scope.scenelist=[];
    $scope.chartlist=[];
    $http.get('/api/dash/getExportAllData').then(function (resp) {//获取所有数据，显示列表
        alldata=JSON.parse(resp.data);
        $scope.themelist=alldata.themelist;
        $scope.scenelist=alldata.scenelist;
        $scope.chartlist=alldata.chartlist;
        // console.log('alldata=',alldata);
    });
    // $scope.themeSelAll=false;
    $scope.$watch("themelist",function(newValue,oldValue, scope) {
        // themecount=0;
        $scope.themelist.forEach(function(value, key, arr){
            scenesconfigs = JSON.parse(value.scenesconfig);
            scenesconfigs.forEach(function (scenesconfig, scenesconfigIndex, scenesconfigArr) {
                $scope.scenelist.forEach(function (scene, sceneIndex, sceneArr) {
                    if (scenesconfig.id == scene.id) {
                        if(value.check) {
                            scene.check = true;
                        } else {
                            scene.check = false;
                        }
                        return;
                    }
                })
            });
            // if(value.check){
            //     themecount+=1;
            // }
            // if(themecount>=$scope.themelist.length){
            //     $scope.themeSelAll=true;
            // }else{
            //     $scope.themeSelAll=false;
            // }
        });
    }, true);

    $scope.$watch("scenelist",function (newVal, oldVal, scope) {
        $scope.scenelist.forEach(function (scene,sceneindex,sceneArr) {

            allchartid=scene.chartsid;
            allchartid.forEach(function(chartid,chartidIndex,chartidArr){
                $scope.chartlist.forEach(function (value, index, array) {
                    if(chartid==value.id || chartid+"_t"==value.id){//添加_t是为了区分id来源table而不是chart，这个区分在python的resolveHtml函数里有同样的添加标记
                        if(scene.check){
                            // console.log('value.check',value.check);
                            value.check=true;
                        }else{
                            value.check=false;
                        }
                        return;
                    }
                })
            });

        })
    }, true);


    $scope.themeselectdall=false;
    $scope.sceneselectdall=false;
    $scope.chartselectdall=false;
    $scope.selectAll=function (typedt) {//全选和取消全选
        if(typedt=='theme'){
            if($scope.themeselectdall){
                $("input[name='themesel']").each(function () {
                    this.checked=false;
                })
                $scope.themeselectdall=!$scope.themeselectdall;
            }else{
                $("input[name='themesel']").each(function () {
                    this.checked=true;
                })
                $scope.themeselectdall=!$scope.themeselectdall;
            }
        }
        if(typedt=='scene'){
            if($scope.sceneselectdall){
                $("input[name='scenesel']").each(function () {
                    this.checked=false;
                })
                $scope.sceneselectdall=!$scope.sceneselectdall;
            }else{
                $("input[name='scenesel']").each(function () {
                    this.checked=true;
                })
                $scope.sceneselectdall=!$scope.sceneselectdall;
            }
        }
        if(typedt=='chart'){
            if($scope.chartselectdall){
                $("input[name='chartsel']").each(function () {
                    this.checked=false;
                })
                $scope.chartselectdall=!$scope.chartselectdall;
            }else{
                $("input[name='chartsel']").each(function () {
                    this.checked=true;
                })
                $scope.chartselectdall=!$scope.chartselectdall;
            }
        }
    }
    // $scope.selectCheckBox=function (selid,typedt,elem){
    //     //级联选择
    //     if(typedt=='themesel'){
    //         isck=$(elem).is('checked');
    //         console.log('isck=',isck);
    //         for(var i=0;i<$scope.themelist.length;i++){
    //             if($scope.themelist[i].id==selid){//查找到传入的id，获取sceneconfig
    //                 sceneconfig=$scope.themelist[i].scenesconfig;//根据sceneconfig选择scene对应的checkbox
    //                 if(typeof(sceneconfig)!='object'){
    //                     sceneconfig=JSON.parse(sceneconfig);
    //                 }
    //                 for(var j=0;j<sceneconfig.length;j++){
    //                     sceneidfrtheme=sceneconfig[j].id;
    //                     $("input[name='scenesel']").each(function () {
    //                         if(this.value==sceneidfrtheme){
    //                             this.checked=true;
    //                             return;
    //                         }
    //                     })
    //                 }
    //                 break;
    //             }
    //         }
    //     }else if(typedt=='scenesel'){
    //         $scope.scenelist
    //     }
    //     //全选按钮
    //     selectallbox(typedt);//一定要全选按钮的name等于当前选项的name加上'all'，不然解析会出错
    // };

    // $scope.selectCheckBox();

    $scope.themesearchkey = '';
    $scope.scenesearchkey = '';
    $scope.chartsearchkey = '';

    //获取所有数据
    $scope.getdata = function (type) {//不适用分页，用户使用滚动条
        var url = '/api/dash/searchExpByType?type='+type;//type在python代码里有使用
        if(type=='theme'){
            url+='&search='+$scope.themesearchkey;
        }else if(type=='scene'){
            url+='&search='+$scope.scenesearchkey;
        }else if(type=='chart'){
            url+='&search='+$scope.chartsearchkey;
        }
        url = encodeURI(url);
        $http.get(url).then(function (response) {
            if(type=='theme'){
                $scope.themelist=response.data;
            }else if(type=='scene'){
                $scope.scenelist=response.data;
            }else if(type=='chart'){
                $scope.chartlist=response.data;
            }
        });
    };
    // $scope.getdata(1);
    $scope.search = _.debounce(function (type) {
        //搜索直接使用查询出来的list，在js里使用indexof并把匹配的重新排序
        $scope.getdata(type);
    }, 500);
    //导出
    $("#exportDataBtn").click(function () {
        if($scope.olapExpNum<=0){
            alert('导出olap数量必须大于0！');
        }
        themeparam=[];
        sceneparam=[];
        chartparam=[];
        $scope.themelist.forEach(function (value, index, array) {
            if(value.check){
                themeparam.push(value);
            }
        });
        $scope.scenelist.forEach(function (value, index, array) {
            if(value.check){
                sceneparam.push(value);
            }
        });
        $scope.chartlist.forEach(function (value, index, array) {
            if(value.check){
                chartparam.push(value);
            }
        });

        $http({
            method:'POST',
            url:'/api/dash/exportPackage',
            headers:{'X-CSRFToken': getCookie('csrftoken')},
            data:{
                themels:themeparam,
                scenels:sceneparam,
                chartls:chartparam,
                olapnum:$scope.olapExpNum
            }
        }).success(function (res) {
            if(res.code=='1'){
                var filePath = res.filepath;
                var triggerDownload = $("<a>").attr("href", filePath).attr("download",
                    "主题场景组件打包导出_"+res.filename).appendTo("body");
                triggerDownload[0].click();
                triggerDownload.remove();
                //把导出记录信息输出到textarea
                $('#logsshow').val('');
                expRecoreds=JSON.parse(res.outputconsole);
                logsStrShow='';
                //显示theme
                logsStrShow+='导出主题：'+(expRecoreds['exportThemeNames']).join('，');//使用中文逗号看得清楚一些
                logsStrShow+='\n';
                //显示scene
                logsStrShow+='导出场景：'+(expRecoreds['exportSceneNames']).join('，');
                logsStrShow+='\n';
                //显示chart
                logsStrShow+='导出图表组件：'+(expRecoreds['exportChartNames']).join('，');
                logsStrShow+='\n';
                //显示datatable组件
                logsStrShow+='导出表格组件：'+(expRecoreds['exportTableChartNames']).join('，');
                logsStrShow+='\n';
                //显示olap表
                logsStrShow+='导出数据库的表(即olap)：\n';
                expRecoreds['exportTablesInfo'].forEach(function (value,index,array) {
                    logsStrShow+="表名："+value['tablename']+"，数据量："+value['tabledatarealnum']+'条。\n';
                });
                $('#logsshow').val(logsStrShow);
            }else{
                alert(res.msg);
            }
        })
    })
});


function selectallbox(typedt) {//特定情况下选中全选按钮
    chartselallcount=$("input[name='"+typedt+"']").length;
    selcount=$("input[name='"+typedt+"']:checked").length;
    if(chartselallcount==selcount) {
        $("input[name='" + typedt + "all']").prop("checked", true);
    }else{
        $("input[name='" + typedt + "all']").prop("checked", false);
    }
}

