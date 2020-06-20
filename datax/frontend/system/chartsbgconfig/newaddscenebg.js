var app = angular.module('chartsbgconfiglist', ['ui.bootstrap','colorpicker.module','dataxPanelDrag']);
app.controller('chartsbgconfigController', function ($scope, $http, $uibModal) {

    //场景样式的json
    $scope.sceneConfigObj = {
        'id': '',
        'confname': '',//保存到数据库的名称
        'remark': '',//备注
        'status': '',//是否禁用
        'basicconfig': {
            'customConfig': {}
        },
        'options': {
            'componentMargin':{
                'marginLeft':0,
                'marginTop':0,
            },
            'globalStyle': {
                'color': 'rgba(51, 51, 51, 1)',
                'backgroundColor': 'rgba(255,255,255, 1)',
                'backgroundSize': 'cover',
                'backgroundRepeat': 'no-repeat',
            },
            'toolBarStyle': {
                'default': true,
                'blue': false,
                'black': false
            },
            'filterStyle': {
                'color':'rgba(51, 51, 51, 1)',
                'backgroundColor': 'rgba(255,255,255,1)',
                'borderDisplay': false,
                'borderRadius': '0px',
                'backgroundSize': 'cover',
                'backgroundRepeat': 'no-repeat',
            },
            'chartStyle': {
                'backgroundColor': 'rgba(255,255,255,1)',
                'borderDisplay': false,
                'borderRadius': '0px',
                'backgroundSize': 'cover',
                'backgroundRepeat': 'no-repeat',
            },
            'syncFontColor': true,
            'commentsStyle': commentsStyle.lightStyle
        }
    };
    //初始化待选的一些数据，初始化组件边框样式
    $scope.borderStyles = [
        {'value': 'solid', 'name': '实线'},
        {'value': 'dashed', 'name': '虚线'},
        {'value': 'dotted', 'name': '点线'},
        {'value': 'double', 'name': '双线'}
    ]

    var id = window.location.search.split("=")[1];

    $http.get('/api/dash/scenebgconfigview?id=' + id).then(function (response) {
            if (response.data.status == 'success') {
                $scope.sceneConfigObj = response.data.data;
                if (typeof($scope.sceneConfigObj.basicconfig) == "string"){
                    $scope.sceneConfigObj.basicconfig = JSON.parse($scope.sceneConfigObj.basicconfig.replace(/\'/g,'"'));
                }
                if (typeof($scope.sceneConfigObj.options) == "string"){
                    $scope.sceneConfigObj.options = JSON.parse($scope.sceneConfigObj.options.replace(/\'/g,'"'));
                }
                $scope.reloadingDashboard = 'complete';
            } else {
                alert(response.data);
            }
        });
    if (id != "0" && String(id).length > 0) {//回显标题和数据
        $scope.modeltitle = '编辑图表背景配置';
    }else {
        $scope.modeltitle = '新增图表背景配置';
    }

    $scope.sceneConfigObj.id = id;
    $scope.submit = function () {
        $.ajax({
            url: '/api/dash/savescenebackgroundconfig',
            type: 'POST',
            data: {
                'id': $scope.sceneConfigObj.id,
                'confname': $scope.sceneConfigObj.confname,//保存到数据库的名称
                'remark': $scope.sceneConfigObj.remark,//备注
                'status': $scope.sceneConfigObj.status,//是否禁用
                'basicconfig': JSON.stringify($scope.sceneConfigObj.basicconfig),
                'options': JSON.stringify($scope.sceneConfigObj.options)
            }
        }).then(function (rs) {
            if (rs.status == 'success') {
                alert("保存成功！！");
                $scope.winclose()
            } else {
                alert(rs.data);
            }
        });
    };

    $scope.$watch('sceneConfigObj.options.filterStyle', function (newVal) {
        var filterStyle = angular.copy($scope.sceneConfigObj.options.filterStyle);
        if (filterStyle.backgroundImage && filterStyle.backgroundImage.length > 0) {
            filterStyle.backgroundImage = 'url(' + filterStyle.backgroundImage + ')'
        }
        $scope.filterStyle = function () {
            return removeEmpty(filterStyle);
        }
    }, true);

    $scope.$watch('sceneConfigObj.options.chartStyle', function (newVal) {
        var chartStyle = angular.copy($scope.sceneConfigObj.options.chartStyle);
        if (chartStyle.backgroundImage && chartStyle.backgroundImage.length > 0) {
            chartStyle.backgroundImage = 'url(' + chartStyle.backgroundImage + ')'
        }
        $scope.charStyle = function () {
            return removeEmpty(chartStyle);
        }
        $scope.stopMultipleLoad()
        // if ($scope.stopMultipleLoad()){
        //     $scope.charStyle = function () {
        //         return removeEmpty(chartStyle);
        //     }
        // }
    }, true);

    $scope.$watch('sceneConfigObj.options.componentMargin', function (newVal) {
        var componentMargin = angular.copy($scope.sceneConfigObj.options.componentMargin);
        componentMargin.marginRight = componentMargin.marginLeft;
        componentMargin.marginBottom = componentMargin.marginTop;
        // console.log('componentMargin componentMargin=',componentMargin);
        $scope.allComponentMarginBorder = function () {
            return removeEmpty(componentMargin);
        }
    }, true);


    // 全局字体颜色改变过滤器文字颜色
    $scope.$watch('sceneConfigObj.options.globalStyle.color',function () {
        var globalStylecolor = angular.copy($scope.sceneConfigObj.options.globalStyle.color);
        $scope.filterTxtcolor = function(){
            $scope.sceneConfigObj.options.filterStyle.color = globalStylecolor
        };

    },true);


    $scope.$watch('sceneConfigObj.options.globalStyle', function () {
        var globalStyle = angular.copy($scope.sceneConfigObj.options.globalStyle);
        if (globalStyle.backgroundImage && globalStyle.backgroundImage.length > 0) {
            globalStyle.backgroundImage = 'url(' + globalStyle.backgroundImage + ')'
        }
        $scope.sceneBkStyle = function () {
            return removeEmpty(globalStyle);
        };
        if ($scope.stopMultipleLoad()){
            if (globalStyle.color && globalStyle.color.length > 1) {
                if ($scope.sceneConfigObj.options.syncFontColor) {
                    fontColorDict = {'color' : globalStyle.color};
                } else {
                    fontColorDict = {};
                }
                changeGlobalFontColor(fontColorDict);
            }
        }

    }, true);

    //修改全局字体样式的时候需要修改charts里的颜色，我这里需要修改options的textstyle和legend.textStyle
    //以达到修改全局文字的颜色的效果，在新场景设置里则使用的angular来动态复制color以达到此效果
    function changeGlobalFontColor(fontColorDict){
        // optionOne.color = fontColorDict

        optionOne.textStyle = fontColorDict;
        optionOne.xAxis.axisLabel.textStyle = fontColorDict;
        // optionOne.legend.textStyle = fontColorDict;
        optionOne.title.textStyle = fontColorDict;
        //
        optionTwo.textStyle = fontColorDict;
        // optionTwo.legend.textStyle = fontColorDict;
        optionTwo.title.textStyle = fontColorDict;
        initEcharts('refresh');
    }

    $scope.$watch('sceneConfigObj.options.syncFontColor', function (newval) {
        var globalStyle = angular.copy($scope.sceneConfigObj.options.globalStyle);
        if ($scope.stopMultipleLoad()){
            if (globalStyle.color && globalStyle.color.length > 1) {
                if ($scope.sceneConfigObj.options.syncFontColor) {
                    fontColorDict = {'color' : globalStyle.color};
                } else {
                    fontColorDict = {};
                }
                changeGlobalFontColor(fontColorDict);
            }
        }
    });

    //配置自定义js脚本
    $scope.updateCustomCode = function (msg) {
        var _tempObj = $scope.sceneConfigObj.basicconfig.customConfig.customCode;
        if (msg == 'addMethod') {
            var _tempArr = _tempObj.code.split('function');
            _tempObj.code += 'function f' + _tempArr.length + '() {\n}\n';
        } else if (msg == 'userInfo') {
            _tempObj.code += 'var currentUserInfo = getUserInfo();\n';
        } else if (msg == 'refresh') {
            _tempObj.code = '';
        }
    };

    //执行自定义js脚本
    $scope.executeCustomConfig = function () {
        if ($scope.sceneConfigObj.basicconfig.customConfig.customCode &&
                isNotNull($scope.sceneConfigObj.basicconfig.customConfig.customCode.code)) {
            eval($scope.sceneConfigObj.basicconfig.customConfig.customCode.code);
        }
    };

    // 初始化高级配置json格式
    $scope.initCustomConfig = function () {
        if (Object.keys(nullToObj($scope.sceneConfigObj.basicconfig.customConfig)).length == 0) {
            $scope.sceneConfigObj.basicconfig['customConfig'] = {
                'customCode': {
                    'code': ''
                },
                'autoSave': {
                    'active': false,
                    'interval': 60
                }
            }
        }
    };
    $scope.initCustomConfig();

    // 确保在此方法只在新增界面和编辑(查看)界面的数据读取完成之后才会执行
    $scope.stopMultipleLoad = function () {
        if (($scope.sceneConfigObj['id'].length > 1 && $scope.reloadingDashboard == 'complete') ||
            $scope.sceneConfigObj['id'].length == 0) {
            return true;
        } else {
            return false;
        }
    };

    $scope.changePicture = function (event) {
        if (event.target.files[0]) {
            var formData = new FormData();
            formData.append("filename", event.target.files[0]);
            $.ajax({
                url: '/api/dash/uploadbgpicture',
                type: 'post',
                processData: false,
                contentType: false,
                data: formData
            }).then(function (data) {
                if (data.code == "1") {
                    var imgPath = data.path + data.filename;
                    $scope.sceneConfigObj.options.globalStyle.backgroundImage = imgPath;
                    $scope.getUserImgs();
                } else {
                    alert('上传失败');
                }
            });
        }
    }
    //修改组件的背景图片
    $scope.changeChartsPicture = function (event) {
        if (event.target.files[0]) {
            var formData = new FormData();
            formData.append("filename", event.target.files[0]);
            $.ajax({
                url: '/api/dash/uploadchartsbgpicture',
                type: 'post',
                processData: false,
                contentType: false,
                data: formData
            }).then(function (data) {
                if (data.code == "1") {
                    var imgPath = data.path + data.filename;
                    $scope.sceneConfigObj.options.chartStyle.backgroundImage = imgPath;
                    $scope.getUserChartsImgs();
                } else {
                    alert('上传失败');
                }
            });
        }
    }
    //修改过滤器的背景图片,和组件上传的方法changeChartsPicture一致，只不过在返回结果中使用了$scope.sceneConfigObj.options.filterStyle.backgroundImage = imgPath;
    $scope.changeFiltersPicture = function (event) {
        if (event.target.files[0]) {
            var formData = new FormData();
            formData.append("filename", event.target.files[0]);
            $.ajax({
                url: '/api/dash/uploadchartsbgpicture',
                type: 'post',
                processData: false,
                contentType: false,
                data: formData
            }).then(function (data) {
                if (data.code == "1") {
                    var imgPath = data.path + data.filename;
                    $scope.sceneConfigObj.options.filterStyle.backgroundImage = imgPath;
                    // $scope.getUserFiltersImgs();
                    $scope.getUserChartsImgs();
                } else {
                    alert('上传失败');
                }
            });
        }
    }
    // region 获取用户上传的图片
    $scope.imgs = [];
    $scope.getUserImgs = function () {
        $http.get('/api/dash/getUserImgs').then(function (rs) {
            if (rs.data.status == 'success') {
                $scope.imgs = [];
                rs.data.imgs.forEach(function (value) {
                    if (value.substr(0, 1) == '.') {
                         value = value.substr(1, value.length-1);
                    }
                    $scope.imgs.push(value);
                });
            }
        });
    };
    $scope.getUserImgs();
    // region 获取用户上传的组件背景图片
    $scope.charsimgs = [];
    $scope.getUserChartsImgs = function () {
        $http.get('/api/dash/getUserChartsImgs').then(function (rs) {
            if (rs.data.status == 'success') {
                $scope.charsimgs = [];
                rs.data.imgs.forEach(function (value) {
                    if (value.substr(0, 1) == '.') {
                         value = value.substr(1, value.length-1);
                    }
                    $scope.charsimgs.push(value);
                });
            }
        });
    };
    $scope.getUserChartsImgs();

    $scope.isUseBgImg1 = function () {
        if (!$scope.useBgImg) {
            $scope.sceneConfigObj.options.globalStyle['backgroundImage'] = '';
        } else {
            $scope.sceneConfigObj.options.globalStyle['backgroundSize'] = 'cover';
            $scope.sceneConfigObj.options.globalStyle['backgroundRepeat'] = 'no-repeat';
        }
    };
    $scope.isUseChartsBgImg = function () {
        if (!$scope.useChartsBgImg) {
            $scope.sceneConfigObj.options.chartStyle['backgroundImage'] = '';
        } else {
            $scope.sceneConfigObj.options.chartStyle['backgroundSize'] = 'cover';
            $scope.sceneConfigObj.options.chartStyle['backgroundRepeat'] = 'no-repeat';
        }
    };
    $scope.isUseFiltersBgImg = function () {
        if (!$scope.sceneConfigObj.options.filterStyle.currCharsBgPicSts) {
            $scope.sceneConfigObj.options.filterStyle['backgroundImage'] = '';
        } else {
            $scope.sceneConfigObj.options.filterStyle['backgroundSize'] = 'cover';
            $scope.sceneConfigObj.options.filterStyle['backgroundRepeat'] = 'no-repeat';
        }
    };
    //是否使用边框
    $scope.isUseCompBorder = function () {
        if ($scope.sceneConfigObj.options.chartStyle.borderDisplay) {
            //如果$scope.sceneConfigObj.options.chartStyle['xxxxx']有值就回显，没有值就复制初始值
            $scope.sceneConfigObj.options.chartStyle['borderStyle'] = $scope.sceneConfigObj.options.chartStyle['borderStyle']?$scope.sceneConfigObj.options.chartStyle['borderStyle']:'dotted';
            $scope.sceneConfigObj.options.chartStyle['borderWidth'] = $scope.sceneConfigObj.options.chartStyle['borderWidth']?$scope.sceneConfigObj.options.chartStyle['borderWidth']:'0px';
            $scope.sceneConfigObj.options.chartStyle['borderColor'] = $scope.sceneConfigObj.options.chartStyle['borderColor']?$scope.sceneConfigObj.options.chartStyle['borderColor']:'rgba(255,255,255,1)';
        } else {
            delete $scope.sceneConfigObj.options.chartStyle['borderStyle'];
            delete $scope.sceneConfigObj.options.chartStyle['borderWidth'];
            delete $scope.sceneConfigObj.options.chartStyle['borderColor'];
        }
    };

    //是否使用边框
    $scope.isUseFilterBorder = function () {
        if ($scope.sceneConfigObj.options.filterStyle.borderDisplay) {
            //如果$scope.sceneConfigObj.options.filterStyle['xxxxx']有值就回显，没有值就复制初始值
            $scope.sceneConfigObj.options.filterStyle['borderStyle'] = $scope.sceneConfigObj.options.filterStyle['borderStyle']?$scope.sceneConfigObj.options.filterStyle['borderStyle']:'dotted';
            $scope.sceneConfigObj.options.filterStyle['borderWidth'] = $scope.sceneConfigObj.options.filterStyle['borderWidth']?$scope.sceneConfigObj.options.filterStyle['borderWidth']:'0px';
            $scope.sceneConfigObj.options.filterStyle['borderColor'] = $scope.sceneConfigObj.options.filterStyle['borderColor']?$scope.sceneConfigObj.options.filterStyle['borderColor']:'rgba(255,255,255,1)';
        } else {
            delete $scope.sceneConfigObj.options.filterStyle['borderStyle'];
            delete $scope.sceneConfigObj.options.filterStyle['borderWidth'];
            delete $scope.sceneConfigObj.options.filterStyle['borderColor'];
        }
    };
    //对宽度这样的输入框需要格式化，只能输入数值并自动格式化为px
    $scope.fixPx = function (modelName, modelval, eleId) {
        var tempVal = modelval.replace(/[^0-9]/ig,"") + 'px';
        if (tempVal != modelval) {
            eval("$scope."+modelName+"='"+tempVal+"'");
        }
        $timeout(function () {
            var oField=document.getElementById(eleId);
            oField.setSelectionRange(tempVal.length-2, tempVal.length-2);
        });
    }


    $scope.removeDialog = function () {//保存成功后需要移除当前弹出框并返回数据到上一层以刷新list页面
        $uibModalInstance.close({'status':'success'});
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    // 保存配置 -----
    $scope.errorflag = false;
    $scope.checking = false;
    $scope.confnamemsg = id=='0'?"*名称必填":"";
    $scope.checkconfname = function () {
        $scope.checking = true;
        $scope.errorflag = false;
        $scope.checkfun();
    };
    $scope.checkfun = _.debounce(function () {
        if(!id || !$scope.sceneConfigObj || typeof($scope.sceneConfigObj.confname)=='undefined'){
            $scope.confnamemsg='*名称必填';
            return;
        }//防止用户输入后再清空
        $scope.confnamemsg='';
        $http({
            method: 'POST',
            url: '/api/dash/checkchartsbgconfname',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
                name: $scope.sceneConfigObj.confname,
                id: id
            }
        }).then(function (res) {
            let rs = res.data;
            $scope.checking = false;
            if (rs.code != '1') {
                $scope.msg = rs.msg;
                $scope.confnamemsg=rs.msg;
                $scope.errorflag = true;
            }else{
                // $scope.confnamemsg='名称校验出错！';
            }
        });
    }, 200);

    // 关闭窗口
    $scope.winclose = function(){
        window.close();
    };
    $scope.open = function (id) {//新增或编辑场景背景样式
        var modalInstance = $uibModal.open({
            templateUrl: '/dashboard/addscenebackgroud',
            controller: 'addSceneStyleController',
            backdrop: "static",
            size:'super-lgs',
            controllerAs: 'vm',
            resolve: {
                id: function () {
                    return id;
                }
            }
        });
        modalInstance.result.then(function (rs) {
            if (rs.status == 'success'){
                $scope.getdata(1);
            }
        }, function () {
        });
    };

    //配置文件上传导入
    $scope.uploadConfigFile = function () {
        var uploadConfigFileID = document.getElementById('uploadConfigFileID').files[0];
        $http({
            method: 'POST',
            url: '/api/dash/uploadCoonfigFile',
            headers: {'Content-Type': undefined, 'X-CSRFToken': getCookie('csrftoken')},
            data: {
                filename: uploadConfigFileID
            },transformRequest: function (data, headersGetter) {
                var formData = new FormData();
                angular.forEach(data, function (value, key) {
                    formData.append(key, value);
                });
                return formData;
            }
        }).success(function (rs) {
            if (rs.status == 'success') {
                alert(rs.data);
                $scope.getdata(1);
            } else {
                alert(rs.data);
            }
        });
    };

    $scope.forbidden=function (id) {
        if(id){
            $http.get('/api/dash/forbiddenchartsbgconfig?id='+id).then(function (rs) {
                if (rs.data.code == '0') {
                    $scope.getdata(1);
                }
                else {
                    alert(rs.msg);
                }
            })
        }
    }

    //导出为文件，根据id查询数据库并将数据导出为文件，必定会对应导入操作
    $scope.exportBGConfig =function (id) {
        $http.get('/api/dash/exportBGConfig?id='+id).then(function (rs) {
            if (rs.data.status == 'success') {
                var filePath = rs.data.downLoadZipFilePath;
                var downLoadFileName = 'sceneBGConfig_' + rs.data.timeStampSuff + '.zip';
                var triggerDownload = $("<a>").attr("href", filePath).attr("download", downLoadFileName).appendTo("body");
                triggerDownload[0].click();
                triggerDownload.remove();
            } else {
                alert(rs.msg);
            }
        })
    }

    $scope.delete = function (value) {
        var a = confirm("是否删除:'" + value.confname + "'?");
        if (a) {
            $http.get('/api/dash/deletechartsbgconfig?id='+value.id).then(function (rs) {
                if (rs.data.code == '0') {
                    if(rs.data.deleteMsg){//回显删除信息
                        alert(rs.data.deleteMsg);
                    }
                    $scope.getdata(1);
                }
                else {
                    alert(rs.msg);
                }
            })
        }
        else {
            return false;
        }
    };

    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function () {
        $scope.getdata($scope.currentPage);
    };
    //获取所有数据标签
    $scope.getdata = function (page) {
        var key = $scope.searchkey;
        var url = '/api/dash/getChartsbgConfigList?page=' + page;
        if (key != '') {
            url = encodeURI(url + "&search=" + key);//中文转码
        }
        $http.get(url).then(function (response) {
            $scope.lists = response.data.rows;
            $scope.totalItems = response.data.total;
        });
    };
    $scope.getdata(1);
    $scope.search = _.debounce(function () {
        $scope.getdata($scope.currentPage);
    }, 500);
});
///为了监听文件input标签的on-change事件
app.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeHandler = scope.$eval(attrs.customOnChange);
      element.on('change', onChangeHandler);
      element.on('$destroy', function() {
        element.off();
      });

    }
  };
});
//弹出配置框
// app.controller('addSceneStyleController', function ($scope, $timeout, $http,$uibModal, $uibModalInstance, id) {
//     $timeout(function () {
//         $('.global-config').show();//打开弹出框（初始化打开但不显示）
//     });
//     //场景样式的json
//     $scope.sceneConfigObj = {
//         'id': '',
//         'confname': '',//保存到数据库的名称
//         'remark': '',//备注
//         'status': '',//是否禁用
//         'basicconfig': {
//             'customConfig': {}
//         },
//         'options': {
//             'componentMargin':{
//                 'marginLeft':0,
//                 'marginTop':0,
//             },
//             'globalStyle': {
//                 'color': 'rgba(51, 51, 51, 1)',
//                 'backgroundColor': 'rgba(255,255,255, 1)',
//                 'backgroundSize': 'cover',
//                 'backgroundRepeat': 'no-repeat',
//             },
//             'toolBarStyle': {
//                 'default': true,
//                 'blue': false,
//                 'black': false
//             },
//             'filterStyle': {
//                 // 'color':'rgba(51, 51, 51, 1)',
//                 'backgroundColor': 'rgba(255,255,255,1)',
//                 'borderDisplay': false,
//                 'borderRadius': '0px',
//                 'backgroundSize': 'cover',
//                 'backgroundRepeat': 'no-repeat',
//             },
//             'chartStyle': {
//                 'backgroundColor': 'rgba(255,255,255,1)',
//                 'borderDisplay': false,
//                 'borderRadius': '0px',
//                 'backgroundSize': 'cover',
//                 'backgroundRepeat': 'no-repeat',
//             },
//             'syncFontColor': true,
//             'commentsStyle': commentsStyle.lightStyle
//         }
//     };
//     //初始化待选的一些数据，初始化组件边框样式
//     $scope.borderStyles = [
//         {'value': 'solid', 'name': '实线'},
//         {'value': 'dashed', 'name': '虚线'},
//         {'value': 'dotted', 'name': '点线'},
//         {'value': 'double', 'name': '双线'}
//     ]
//
//     if (id != "0" && String(id).length > 0) {//回显标题和数据
//         $http.get('/api/dash/scenebgconfigview?id=' + id).then(function (response) {
//             if (response.data.status == 'success') {
//                 $scope.sceneConfigObj = response.data.data;
//                 if (typeof($scope.sceneConfigObj.basicconfig) == "string"){
//                     $scope.sceneConfigObj.basicconfig = JSON.parse($scope.sceneConfigObj.basicconfig.replace(/\'/g,'"'));
//                 }
//                 if (typeof($scope.sceneConfigObj.options) == "string"){
//                     $scope.sceneConfigObj.options = JSON.parse($scope.sceneConfigObj.options.replace(/\'/g,'"'));
//                 }
//                 $scope.reloadingDashboard = 'complete';
//             } else {
//                 alert(response.data);
//             }
//         });
//         $scope.modeltitle = '编辑图表背景配置';
//     }else {
//         $scope.modeltitle = '新增图表背景配置';
//     }
//
//     //显示全局配置弹出框
//     $scope.globalConfig = function () {
//         $('.global-config').css('top', '5%');
//     }
//     //关闭全局配置弹窗
//     $scope.closeGlobalConfigPanel = function () {
//         $('.global-config').css('top', '-700px');
//     };
//
//     $scope.$watch('sceneConfigObj.options.filterStyle', function (newVal) {
//         var filterStyle = angular.copy($scope.sceneConfigObj.options.filterStyle);
//         if (filterStyle.backgroundImage && filterStyle.backgroundImage.length > 0) {
//             filterStyle.backgroundImage = 'url(' + filterStyle.backgroundImage + ')'
//         }
//         $scope.filterStyle = function () {
//             return removeEmpty(filterStyle);
//         }
//     }, true);
//
//     $scope.$watch('sceneConfigObj.options.chartStyle', function (newVal) {
//         var chartStyle = angular.copy($scope.sceneConfigObj.options.chartStyle);
//         if (chartStyle.backgroundImage && chartStyle.backgroundImage.length > 0) {
//             chartStyle.backgroundImage = 'url(' + chartStyle.backgroundImage + ')'
//         }
//         if ($scope.stopMultipleLoad()){
//             $scope.charStyle = function () {
//                 return removeEmpty(chartStyle);
//             }
//         }
//     }, true);
//
//     $scope.$watch('sceneConfigObj.options.componentMargin', function (newVal) {
//         var componentMargin = angular.copy($scope.sceneConfigObj.options.componentMargin);
//         componentMargin.marginRight = componentMargin.marginLeft;
//         componentMargin.marginBottom = componentMargin.marginTop;
//         // console.log('componentMargin componentMargin=',componentMargin);
//         $scope.allComponentMarginBorder = function () {
//             return removeEmpty(componentMargin);
//         }
//     }, true);
//
//
//
//     $scope.$watch('sceneConfigObj.options.globalStyle', function () {
//         var globalStyle = angular.copy($scope.sceneConfigObj.options.globalStyle);
//         if (globalStyle.backgroundImage && globalStyle.backgroundImage.length > 0) {
//             globalStyle.backgroundImage = 'url(' + globalStyle.backgroundImage + ')'
//         }
//         $scope.sceneBkStyle = function () {
//             return removeEmpty(globalStyle);
//         }
//         if ($scope.stopMultipleLoad()){
//             if (globalStyle.color && globalStyle.color.length > 1) {
//                 if ($scope.sceneConfigObj.options.syncFontColor) {
//                     fontColorDict = {'color' : globalStyle.color};
//                 } else {
//                     fontColorDict = {};
//                 }
//                 changeGlobalFontColor(fontColorDict);
//             }
//         }
//
//     }, true);
//
//     //修改全局字体样式的时候需要修改charts里的颜色，我这里需要修改options的textstyle和legend.textStyle
//     //以达到修改全局文字的颜色的效果，在新场景设置里则使用的angular来动态复制color以达到此效果
//     function changeGlobalFontColor(fontColorDict){
//         stackedHistogramOption.textStyle = fontColorDict;
//         stackedHistogramOption.legend.textStyle = fontColorDict;
//         stackedHistogramOption.title.textStyle = fontColorDict;
//
//         pieOption.textStyle = fontColorDict;
//         pieOption.legend.textStyle = fontColorDict;
//         pieOption.title.textStyle = fontColorDict;
//
//         scatterOption.textStyle = fontColorDict;
//         scatterOption.legend.textStyle = fontColorDict;
//         scatterOption.title.textStyle = fontColorDict;
//         chartsInstance('refresh');
//     }
//
//     $scope.$watch('sceneConfigObj.options.syncFontColor', function (newval) {
//         var globalStyle = angular.copy($scope.sceneConfigObj.options.globalStyle);
//         if ($scope.stopMultipleLoad()){
//             if (globalStyle.color && globalStyle.color.length > 1) {
//                 if ($scope.sceneConfigObj.options.syncFontColor) {
//                     fontColorDict = {'color' : globalStyle.color};
//                 } else {
//                     fontColorDict = {};
//                 }
//                 changeGlobalFontColor(fontColorDict);
//             }
//         }
//     });
//
//     //配置自定义js脚本
//     $scope.updateCustomCode = function (msg) {
//         var _tempObj = $scope.sceneConfigObj.basicconfig.customConfig.customCode;
//         if (msg == 'addMethod') {
//             var _tempArr = _tempObj.code.split('function');
//             _tempObj.code += 'function f' + _tempArr.length + '() {\n}\n';
//         } else if (msg == 'userInfo') {
//             _tempObj.code += 'var currentUserInfo = getUserInfo();\n';
//         } else if (msg == 'refresh') {
//             _tempObj.code = '';
//         }
//     };
//
//     //执行自定义js脚本
//     $scope.executeCustomConfig = function () {
//         if ($scope.sceneConfigObj.basicconfig.customConfig.customCode &&
//                 isNotNull($scope.sceneConfigObj.basicconfig.customConfig.customCode.code)) {
//             eval($scope.sceneConfigObj.basicconfig.customConfig.customCode.code);
//         }
//     };
//
//     // 初始化高级配置json格式
//     $scope.initCustomConfig = function () {
//         if (Object.keys(nullToObj($scope.sceneConfigObj.basicconfig.customConfig)).length == 0) {
//             $scope.sceneConfigObj.basicconfig['customConfig'] = {
//                 'customCode': {
//                     'code': ''
//                 },
//                 'autoSave': {
//                     'active': false,
//                     'interval': 60
//                 }
//             }
//         }
//     };
//     $scope.initCustomConfig();
//
//     // 确保在此方法只在新增界面和编辑(查看)界面的数据读取完成之后才会执行
//     $scope.stopMultipleLoad = function () {
//         if (($scope.sceneConfigObj['id'].length > 1 && $scope.reloadingDashboard == 'complete') ||
//             $scope.sceneConfigObj['id'].length == 0) {
//             return true;
//         } else {
//             return false;
//         }
//     };
//
//     $scope.changePicture = function (event) {
//         if (event.target.files[0]) {
//             var formData = new FormData();
//             formData.append("filename", event.target.files[0]);
//             $.ajax({
//                 url: '/api/dash/uploadbgpicture',
//                 type: 'post',
//                 processData: false,
//                 contentType: false,
//                 data: formData
//             }).then(function (data) {
//                 if (data.code == "1") {
//                     var imgPath = data.path + data.filename;
//                     $scope.sceneConfigObj.options.globalStyle.backgroundImage = imgPath;
//                     $scope.getUserImgs();
//                 } else {
//                     alert('上传失败');
//                 }
//             });
//         }
//     }
//     //修改组件的背景图片
//     $scope.changeChartsPicture = function (event) {
//         if (event.target.files[0]) {
//             var formData = new FormData();
//             formData.append("filename", event.target.files[0]);
//             $.ajax({
//                 url: '/api/dash/uploadchartsbgpicture',
//                 type: 'post',
//                 processData: false,
//                 contentType: false,
//                 data: formData
//             }).then(function (data) {
//                 if (data.code == "1") {
//                     var imgPath = data.path + data.filename;
//                     $scope.sceneConfigObj.options.chartStyle.backgroundImage = imgPath;
//                     $scope.getUserChartsImgs();
//                 } else {
//                     alert('上传失败');
//                 }
//             });
//         }
//     }
//     //修改过滤器的背景图片,和组件上传的方法changeChartsPicture一致，只不过在返回结果中使用了$scope.sceneConfigObj.options.filterStyle.backgroundImage = imgPath;
//     $scope.changeFiltersPicture = function (event) {
//         if (event.target.files[0]) {
//             var formData = new FormData();
//             formData.append("filename", event.target.files[0]);
//             $.ajax({
//                 url: '/api/dash/uploadchartsbgpicture',
//                 type: 'post',
//                 processData: false,
//                 contentType: false,
//                 data: formData
//             }).then(function (data) {
//                 if (data.code == "1") {
//                     var imgPath = data.path + data.filename;
//                     $scope.sceneConfigObj.options.filterStyle.backgroundImage = imgPath;
//                     // $scope.getUserFiltersImgs();
//                     $scope.getUserChartsImgs();
//                 } else {
//                     alert('上传失败');
//                 }
//             });
//         }
//     }
//     // region 获取用户上传的图片
//     $scope.imgs = [];
//     $scope.getUserImgs = function () {
//         $http.get('/api/dash/getUserImgs').then(function (rs) {
//             if (rs.data.status == 'success') {
//                 $scope.imgs = [];
//                 rs.data.imgs.forEach(function (value) {
//                     if (value.substr(0, 1) == '.') {
//                          value = value.substr(1, value.length-1);
//                     }
//                     $scope.imgs.push(value);
//                 });
//             }
//         });
//     };
//     $scope.getUserImgs();
//     // region 获取用户上传的组件背景图片
//     $scope.charsimgs = [];
//     $scope.getUserChartsImgs = function () {
//         $http.get('/api/dash/getUserChartsImgs').then(function (rs) {
//             if (rs.data.status == 'success') {
//                 $scope.charsimgs = [];
//                 rs.data.imgs.forEach(function (value) {
//                     if (value.substr(0, 1) == '.') {
//                          value = value.substr(1, value.length-1);
//                     }
//                     $scope.charsimgs.push(value);
//                 });
//             }
//         });
//     };
//     $scope.getUserChartsImgs();
//
//     $scope.isUseBgImg = function () {
//         if (!$scope.useBgImg) {
//             $scope.sceneConfigObj.options.globalStyle['backgroundImage'] = '';
//         } else {
//             $scope.sceneConfigObj.options.globalStyle['backgroundSize'] = 'cover';
//             $scope.sceneConfigObj.options.globalStyle['backgroundRepeat'] = 'no-repeat';
//         }
//     };
//     $scope.isUseChartsBgImg = function () {
//         if (!$scope.useChartsBgImg) {
//             $scope.sceneConfigObj.options.chartStyle['backgroundImage'] = '';
//         } else {
//             $scope.sceneConfigObj.options.chartStyle['backgroundSize'] = 'cover';
//             $scope.sceneConfigObj.options.chartStyle['backgroundRepeat'] = 'no-repeat';
//         }
//     };
//     $scope.isUseFiltersBgImg = function () {
//         if (!$scope.sceneConfigObj.options.filterStyle.currCharsBgPicSts) {
//             $scope.sceneConfigObj.options.filterStyle['backgroundImage'] = '';
//         } else {
//             $scope.sceneConfigObj.options.filterStyle['backgroundSize'] = 'cover';
//             $scope.sceneConfigObj.options.filterStyle['backgroundRepeat'] = 'no-repeat';
//         }
//     };
//     //是否使用边框
//     $scope.isUseCompBorder = function () {
//         if ($scope.sceneConfigObj.options.chartStyle.borderDisplay) {
//             //如果$scope.sceneConfigObj.options.chartStyle['xxxxx']有值就回显，没有值就复制初始值
//             $scope.sceneConfigObj.options.chartStyle['borderStyle'] = $scope.sceneConfigObj.options.chartStyle['borderStyle']?$scope.sceneConfigObj.options.chartStyle['borderStyle']:'dotted';
//             $scope.sceneConfigObj.options.chartStyle['borderWidth'] = $scope.sceneConfigObj.options.chartStyle['borderWidth']?$scope.sceneConfigObj.options.chartStyle['borderWidth']:'0px';
//             $scope.sceneConfigObj.options.chartStyle['borderColor'] = $scope.sceneConfigObj.options.chartStyle['borderColor']?$scope.sceneConfigObj.options.chartStyle['borderColor']:'rgba(255,255,255,1)';
//         } else {
//             delete $scope.sceneConfigObj.options.chartStyle['borderStyle'];
//             delete $scope.sceneConfigObj.options.chartStyle['borderWidth'];
//             delete $scope.sceneConfigObj.options.chartStyle['borderColor'];
//         }
//     };
//
//     //是否使用边框
//     $scope.isUseFilterBorder = function () {
//         if ($scope.sceneConfigObj.options.filterStyle.borderDisplay) {
//             //如果$scope.sceneConfigObj.options.filterStyle['xxxxx']有值就回显，没有值就复制初始值
//             $scope.sceneConfigObj.options.filterStyle['borderStyle'] = $scope.sceneConfigObj.options.filterStyle['borderStyle']?$scope.sceneConfigObj.options.filterStyle['borderStyle']:'dotted';
//             $scope.sceneConfigObj.options.filterStyle['borderWidth'] = $scope.sceneConfigObj.options.filterStyle['borderWidth']?$scope.sceneConfigObj.options.filterStyle['borderWidth']:'0px';
//             $scope.sceneConfigObj.options.filterStyle['borderColor'] = $scope.sceneConfigObj.options.filterStyle['borderColor']?$scope.sceneConfigObj.options.filterStyle['borderColor']:'rgba(255,255,255,1)';
//         } else {
//             delete $scope.sceneConfigObj.options.filterStyle['borderStyle'];
//             delete $scope.sceneConfigObj.options.filterStyle['borderWidth'];
//             delete $scope.sceneConfigObj.options.filterStyle['borderColor'];
//         }
//     };
//     //对宽度这样的输入框需要格式化，只能输入数值并自动格式化为px
//     $scope.fixPx = function (modelName, modelval, eleId) {
//         var tempVal = modelval.replace(/[^0-9]/ig,"") + 'px';
//         if (tempVal != modelval) {
//             eval("$scope."+modelName+"='"+tempVal+"'");
//         }
//         $timeout(function () {
//             var oField=document.getElementById(eleId);
//             oField.setSelectionRange(tempVal.length-2, tempVal.length-2);
//         });
//     }
//
//     //配置好页面后点击保存按钮（弹出框）转到保存信息页面
//     $scope.ok = function () {
//         var modalInstance = $uibModal.open({
//             animation: true,
//             ariaLabelledBy: 'modal-title',
//             ariaDescribedBy: 'modal-body',
//             templateUrl: '/dashboard/addchartsbgconfig',
//             controller: 'saveConfigController',
//             controllerAs: '$ctrl',
//             resolve: {
//                 id: function () {
//                     return id;
//                 },
//                 sceneConfigObj:function () {
//                     return angular.copy($scope.sceneConfigObj);
//                 }
//             }
//         });
//         modalInstance.result.then(function (rs) {
//             if (rs.status == 'success') {
//                 $scope.removeDialog()
//             }
//         });
//     }
//     $scope.removeDialog = function () {//保存成功后需要移除当前弹出框并返回数据到上一层以刷新list页面
//         $uibModalInstance.close({'status':'success'});
//     };
//     $scope.cancel = function () {
//         $uibModalInstance.dismiss('cancel');
//     };
// });

