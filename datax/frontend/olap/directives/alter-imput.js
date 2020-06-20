app.directive('alterInput', function () {
    return {
        restrict: 'E',
        templateUrl: '/frontend/olap/directives/alter-input.html',
        replace: true,
        scope: {
            column: '=', //字段名
            coltype: '=', //字段类型
            olapid: '=',//olap的id
            refrence: '=',//当前输入框的配置
            inputValue:'=',//双向绑定数值
            addstatus:'='//打开窗口是新增还是编辑
            // refreshMethod: '&'//选中事件
        },
        link: function (scope, element, attrs, controller) {
        },
        controller: function ($scope, $http, $element, $timeout) {
            $scope.tipsDatas = [];//用户输入后去后台查询相似值并下拉选择的数据

            // console.log('direct $scope.column=',$scope.column);
            // console.log('direct $scope.coltype=',$scope.coltype);
            // console.log('direct $scope.olapid=',$scope.olapid);
            // console.log('direct $scope.addstatus=',$scope.addstatus);
            // console.log('direct $scope.refrence=',$scope.refrence);

            //根据feild类型初始化输入框
            let currFeildType = '';
            $scope.isDateFeild = false;
            let currInputIdStr = "#dirInputValue_" + $scope.column;
            if ($scope.coltype && ($scope.coltype.indexOf('date') != -1 || $scope.coltype.indexOf('time') != -1)) {
                $scope.isDateFeild = true;
                currFeildType = 'date';//记住feild的类型，查询时要使用

                $scope.format = 'yyyy-MM-dd';
                $scope.altInputFormats = ['M!-d!-yyyy'];
                $scope.popup1 = {
                    opened: false
                };
                $scope.dateOptions = {
                    formatYear: 'yy',
                    maxDate: new Date(2025, 5, 22),
                    minDate: new Date(),
                    startingDay: 1
                };
                $scope.hstep = 1;
                $scope.mstep = 30;
                $scope.open1 = function() {
                    $scope.popup1.opened = true;
                };
                $timeout(function () {//给日期控件赋值
                    $("#dirInputValue_"+$scope.column).val($scope.inputValue).datepicker('setDate',$scope.inputValue);
                },200);
            }else if ($scope.coltype && $scope.coltype.indexOf('int') != -1) {
                if(!isNaN(parseInt($scope.inputValue))) {
                    $scope.inputValue = parseInt($scope.inputValue);
                }
                $scope.feildType = 'number';
                currFeildType = 'int' ;
            }else if ($scope.coltype && ($scope.coltype.indexOf('float') != -1 || $scope.coltype.indexOf('double') != -1 ||
                        $scope.coltype.indexOf('decimal') != -1 )) {
                if(!isNaN(parseFloat($scope.inputValue))) {
                    $scope.inputValue = parseFloat($scope.inputValue);
                }
                $scope.feildType = 'number';
                currFeildType = 'double';
            }else{
                $scope.feildType = 'text';
                currFeildType = 'varchar';
            }

            //初始化当前输入框的初始值
            if ($scope.addstatus && $scope.refrence.useConstantValue == 1) {
                $scope.inputValue = $scope.refrence.constantValue;
                if(currFeildType == 'int') {
                    if(!isNaN(parseInt($scope.inputValue))) {
                        $scope.inputValue = parseInt($scope.inputValue);
                    }
                }else if(currFeildType == 'double') {
                    if(!isNaN(parseFloat($scope.inputValue))) {
                        $scope.inputValue = parseFloat($scope.inputValue);
                    }
                }
            }else{
                $scope.inputValue = $scope.inputValue ? $scope.inputValue:'';
            }
            // console.log('directive $scope.inputValue=',$scope.inputValue);
            // console.log('directive typeof $scope.inputValue=',typeof($scope.inputValue));
            //根据用户输入的数据，拿着refrence去后台查找数据
            $scope.showSeleData = _.debounce(function () {
                let inputValue = $scope.inputValue;
                //如果是日期数据值，判断日期值是否合法，不合法就不进行查询
                if ($scope.coltype && ($scope.coltype.indexOf('date') != -1 || $scope.coltype.indexOf('time') != -1)) {
                    try{
                        if (String(new Date(inputValue)).indexOf('Invalid') > -1) {
                            return;
                        }else{
                            inputValue = new Date(inputValue);
                        }
                    }catch (error) {
                        console.log('error=',error);
                        inputValue = '';
                    }
                }
                //判断空值
                if (!inputValue || inputValue.toString().trim() == ''){
                    return;
                }
                //如果当前字段配置的是固定数值，就不进行查询
                if ($scope.refrence.useConstantValue && $scope.refrence.useConstantValue == 1) {
                    return ;
                }
                // console.log('directive $scope.inputValue=',$scope.inputValue);
                $http({
                    url:'/api/dash/getGroupDataByRefrence',
                    method:'POST',
                    headers:{'X-CSRFToken': getCookie('csrftoken')},
                    data:{
                        olapId:$scope.olapid,
                        feildType:currFeildType,
                        refrence:$scope.refrence,
                        inputValue:inputValue
                    }
                }).success(function (rs) {
                    // console.log('rs==',rs)
                    if (rs.status == 'success'){
                        if (rs.data.length > 0){
                            $scope.tipsDatas = rs.data;
                        }else{
                            $scope.tipsDatas = [];
                        }
                    }
                })
            },500)
        }
    };
});