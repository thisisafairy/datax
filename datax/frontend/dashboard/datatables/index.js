var app = angular.module('datatablesapp',['ui.bootstrap','ui.router','ui.router.state.events','ngDraggable','groupSelect','multiSelect']);
app.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/list');
    $stateProvider.state('list', {
            url: '/list',
            templateUrl: '/dashboard/datatableslist',
            controller: 'listController'
        })
    .state('add', {
        url: '/add/:id',
        templateUrl: '/dashboard/datatablesedit',
        controller: 'addController'
    }).state('design', {
        url: '/design/:id',
        templateUrl: '/dashboard/reportdesign',
        controller: 'designController'
    });
});


app.controller('listController',  function($scope,$http,$uibModal){
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.searchkey = '';
    $scope.pageChanged = function(){
      $scope.getdata($scope.currentPage);
    };
    $scope.getdata = function(page){
      var key = $scope.searchkey;
      var url = '/api/dash/getDataTable?page='+page;
      if(key != ''){
        url = encodeURI(url+"&search="+key);//中文转码
      }
      $http.get(url).then(function (response) {
        $scope.lists = response.data.rows;
        $scope.totalItems = response.data.total;
      });
    };
    $scope.getdata(1);
    $scope.search = _.debounce(function(){
      $scope.getdata($scope.currentPage);
    },500);
    $scope.removeRow = function(id){
        var isdelete = confirm('是否删除？');
        if(isdelete){
            $http({
                method: 'POST',
                url: '/api/dash/deleteDataTable',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                data: {
                  id:id
                }
            }).success(function(rs){
                if(rs.code == '1'){
                    $scope.getdata(1);
                }
            });
        }
    };
    $scope.preview = function(json){
        var modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: '/dashboard/previewDataTable',
            controller: 'previewController',
            backdrop: false,
            size:'lg',
            resolve: {
                json:function(){
                    return json;
                }
            }
          });
          modalInstance.result.then(function () {

          });
    };
});

app.controller('previewController',function($scope,$http,$uibModalInstance,json){
    $scope.option = JSON.parse(json);

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
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
    return chineseStr.length*14+englishStr.length*10;
}

app.controller('addController',  function($log,$scope,$http,$uibModal,$state,$element,$stateParams,$window,$timeout,$compile){
    $scope.outdivhtml = $element.find("#outdiv").html();
    $scope.loadding = false;
    var totle = $window.innerWidth;
    var silder = $("#silderApp").width();
    
    $scope.option = {  
        "columns": [],
        "data":{
            "url":""
        },
        "theads":[{
            rows:[]
        }],
        "olapid":'',
        "length":100,
        "merge":'true',
        mergeCols:{
            mergeSumCol:[],
            mergeGroupCol:[]
        },
        pagin: '1',
        "config":{
            lengthChange: '',
            searching:'',
            autoWidth: '',
            paging: '',
            bInfo:'',
            scrollX:totle- silder- 250 + 'px',
            scrollY: '500px'
        },
        tableTitle:''
    }; 
    $scope.datatable = null;
    $scope.editTheadAry = [{
        rows:[]
    }];
    $scope.saveconfig = {
        id:'',
        name:'',
        kind:'',
        remark:''
    };

 
    $http.get('/api/dash/getOlaplists').then(function(rs){
        $scope.olaplist = rs.data;
        if($stateParams.id != ''){
            showLoading();
            $http.get('/api/dash/getDataTableRow/'+$stateParams.id).then(function(rs){
                var config = rs.data.json ;
                var olapid = config['olapid'];
                $scope.saveconfig.name = rs.data.name;
                $scope.saveconfig.id = $stateParams.id;
                $scope.saveconfig.remark = rs.data.remark;
                $scope.saveconfig.kind = rs.data.kind;
                $scope.olaplist.map(function(index){
                    if(index['id'] == config['olapid']){
                        $scope.selectolap = index;
                        $scope.getData(function(){
                            $scope.selectColumns.map(function(index,e){
                                if(config['columns'].indexOf(index['title'])>=0){
                                   $scope.selectColumns[e]['isSelected'] = true;
                                }
                           });
                            $scope.option = {
                                "columns": config.columns,
                                "data":{
                                    "url": config.data.url
                                },
                                "olapid":olapid,
                                "theads":config.theads,
                                "length":config.length?config.length:100,
                                "merge":config.merge?config.merge:'false',
                                "mergeCols":config.mergeCols,
                                "pagin":config.pagin=='1'?config.pagin:'0',
                                "config":config.config,
                                "tableTitle":config.tableTitle
                            };
                            $scope.editTheadAry = angular.copy(config.theads);
                            $scope.loadData();
                            
                        });
                    }
                });
            });
        }
    });
    $scope.getData = function(fn){
        
        var url = '/api/dash/getOlapDataByTotal/'+$scope.selectolap['id'];
        $scope.option.columns = [];
        $scope.option.theads = [{
            rows: []
        }];
        $scope.selectColumns = [];
        $scope.loadding = true;
        $http.get(url).then(function(rs){
            $scope.tabledata = [];
            $scope.columns = rs.data.data;
            $scope.selectColumns =  [];
            $scope.columns.map(function(index){
                $scope.selectColumns.push({
                    "title":index.name,
                    "isSelected":false,
                    "type":index.type
                });
            });
            $scope.types = [];
            if(typeof fn == 'function'){
               fn();
               
            }
            else{
                $scope.option.data.url = $scope.selectolap['totalurl'];
                $scope.option.olapid = $scope.selectolap['id'];
            }
            $scope.loadding = false;
            
            
        });
        $scope.rebuildTable();
    };
    $scope.rebuildTable = function(m){
        try{
            $scope.datatable.fnDestroy();
        }
        catch(e){
            // console.log(e);
        }
        /*jshint multistr: true */
        // var tpl = $compile('<table id="demodiv" style="word-break:break-all; word-wrap:break-all;"    class="table table-striped table-bordered" >\
        //                 </table>');
        // var tpl = $compile(`<table id="demodiv" class="table table-striped table-bordered">
        //     <thead>
        //     <tr ng-repeat="(theadkeys,theadrows) in option.theads track by theadkeys">
        //         <th ng-repeat="(theadkey,theadrow) in theadrows.rows track by theadkey" rowspan="{{ theadrow.rowspan }}" colspan="{{ theadrow.colspan }}">{{ theadrow.title }}</th>
        //     </tr>
        //             </thead>
        //     <tbody>
        //         <tr ng-repeat="(dataskey,datarow) in tabledata track by dataskey">
        //             <td ng-repeat="(columnkey,columnrow) in option.columns track by columnkey">{{ datarow[columnrow] }}</td>
        //         </tr>
        //     </tbody>
        //         </table>`);
        //根据title文本长度计算cell宽度
        $scope.lastTitleLen=[];
        if($scope.option.theads && $scope.option.theads[0] && $scope.option.theads[0].rows){
            $scope.option.theads[0].rows.forEach(function (value) {
                var textLen=getCssLenByText(value.title);
                if(textLen){
                    textLen='width:'+textLen+'px';
                }else{
                    textLen='width:'+100+'px';
                }
                $scope.lastTitleLen.push(textLen);
            })
        }
        //宽度计算完成option.tableTitle
        var tpl = $compile('<table id="demodiv" class="table table-striped table-bordered">'+
            '<caption class="theTableCaptionStyle">{{option.tableTitle}}</caption>'+
            '<thead>'+
            '<tr ng-repeat="(theadkeys,theadrows) in option.theads track by theadkeys">'+
            '    <th ng-repeat="(theadkey,theadrow) in theadrows.rows track by theadkey" rowspan="{{ theadrow.rowspan }}" colspan="{{ theadrow.colspan }}"><span style="{{lastTitleLen[theadkey]}};display: inline-block;">{{ theadrow.title }}</span></th>'+
            '</tr>'+
            '        </thead>'+
            '<tbody>'+
            '    <tr ng-repeat="(dataskey,datarow) in tabledata track by dataskey">'+
            '       <td ng-repeat="(columnkey,columnrow) in option.columns track by columnkey" title="{{ datarow[columnrow] }}">{{ datarow[columnrow] }}</td>'+
            '    </tr>'+
            '</tbody>'+
            '    </table>');
        var s = tpl($scope);
        $element.find("#outdiv").html('');
        $element.find("#outdiv").append(s);
        
        if(m == 'build'){
            // $("#demodiv").bootstrapTable({
            //     columns: $scope.option.theads[0].rows,
            //     data: $scope.tabledata,
            //     height: $(window).height() - 90
            // });
            // hideLoading();
            $timeout(function(){
                if($scope.option.data.url != '' && $scope.option.columns.length > 0){
                    try{
                        $scope.datatable.fnDestroy();
                    }
                    catch(e){
                        // console.log(e);
                    }
                    if ( $.fn.dataTable.isDataTable( '#demodiv' ) ) {
                       console.log('datable未清空');
                    }
                    else {
                        $scope.datatable = $element.find('#demodiv').dataTable($scope.option.config);
                    }
                    
                }
                hideLoading();
            });
        }
        $timeout(function(){
            hideLoading();});
      
    };
    $scope.toData = function(str){
        if(str.isSelected == true || $scope.isEdit == '1'){
            return false;
        }

        if($scope.tabledata.length >0 ){
            $scope.tabledata = [];
            $scope.rebuildTable();
        }
        str.isSelected = true;
        $scope.option.columns.push(str.title);
        $scope.option.theads[$scope.option.theads.length - 1].rows.push({
            "title": str.title, "field": str.title,
        "rowspan":1,
        "colspan":1,"isedit":'0',"iscombine":'0'});
        $scope.editTheadAry[$scope.editTheadAry.length - 1].rows.push({
            "title": str.title, "field": str.title,"rowspan":1,
        "colspan":1,"isedit":'0',"iscombine":'0'});
        // console.log('$scope.option=',$scope.option);
        $scope.rebuildTable();
    };

    $scope.cancelColumn = function(str,$event){
        $event.stopPropagation();
        
        if(str.isSelected == false || $scope.isEdit == '1'){
            return false;
        }
        if($scope.tabledata.length >0 ){
            $scope.tabledata = [];
            $scope.rebuildTable();
        }
        str.isSelected = false;
        if($scope.option.theads.length>1){
            var theadconfirm = confirm('撤销字段会清空自定义表头，是否继续');
            if(theadconfirm){
                $scope.option.theads = [
                    {
                        rows:$scope.option.theads[$scope.option.theads.length - 1].rows
                    }
                ];
                $scope.editTheadAry = [
                    {
                        rows:$scope.editTheadAry[$scope.editTheadAry.length - 1].rows
                    }
                ];
            }
            else{
                return false;
            }
        }
        $scope.option.columns = $scope.option.columns.filter(function(index){
            return index != str.title;
        });
        $scope.option.theads[$scope.option.theads.length - 1].rows = $scope.option.theads[$scope.option.theads.length - 1].rows.filter(function(index){
            return index.title != str.title;
        });
        $scope.editTheadAry[$scope.editTheadAry.length - 1].rows = $scope.editTheadAry[$scope.editTheadAry.length - 1].rows.filter(function(index){
            return index.title != str.title;
        });
        // $scope.rebuildTable();
    };
  
    $scope.showEditBtn='1'
    $scope.isEdit = '0';
    $scope.btnText = '编辑表头';
    $scope.editThead = function(){
        $scope.btnText = $scope.isEdit == '0'?'退出编辑':'编辑表头';
        $scope.isEdit = $scope.isEdit == '0'?'1':'0';
        $scope.showDragBtn = $scope.showDragBtn == '0'?'1':'0';//反转拖动表头排序状态

    };
    $scope.showDragBtn='1';
    $scope.isDragHead='0';
    $scope.dragBtnText ='拖动表头排序';
    var isLoadedData=false;
    $scope.dragThead=function () {      //为了确保按钮点击顺序，需要用showDragBtn，showEditBtn确保按钮状态
    $scope.isEdit = $scope.isEdit == '3'?'0':'3';//先隐藏其他功能的表头
    $scope.dragBtnText = $scope.isDragHead == '0'?'退出拖动表头':'拖动表头排序';
    $scope.isDragHead=$scope.isDragHead=='1'?'0':'1';//反转拖拽表头的状态
    $scope.showEditBtn = $scope.showEditBtn == '0'?'1':'0';//反转编辑表头的状态

        // if(isLoadedData && $scope.isDragHead=='0'){
        //     $scope.loadData();//如果已经加载了数据，更新表头排序后需要再次加载数据
        // }
    }
    //添加表格标题
    $scope.addTableTitle=function () {
        var modelInstance=$uibModal.open({
            templateUrl:'addTableTitle.html',
            controller:'addTableTitleController',
            backdrop:'static',
            controllerAs:'vm',
            resolve:{
                tableTitle:function () {
                    return $scope.option.tableTitle;
                }
            }
        });
        modelInstance.result.then(function (data) {
            if(data.type=='update'){
                $scope.option.tableTitle=data.data;
            }
        },function () {})
    }
    //修改表头,当用户新建了olap后不用因为表格组件的一个小问题而重新修改olap
    //弹出框的方式修改表头
    $scope.updateTBHead=function(){
        theadsCnt=$scope.option.theads.length;
        var modelInstance=$uibModal.open({
            templateUrl:'updateTBHead.html',
            controller:'updateTBHeadController',
            backdrop:'static',
            controllerAs:'vm',
            resolve:{
                tableHead:function () {
                    return angular.copy($scope.option.theads[theadsCnt-1]);
                }
            }
        });
        modelInstance.result.then(function (data) {
            if(data.type=='save'){
                $scope.option.theads[theadsCnt-1]=data.data;
                $scope.rebuildTable();
            }
        })

    }

    $scope.onDropComplete=function (index, obj, evt) {
        // console.log($scope.option.theads);
        //两列交换的方式
        // var otherObj=$scope.option.theads[0].rows[index];
        // var otherIndex=$scope.option.theads[0].rows.indexOf(obj);
        // $scope.option.theads[0].rows[index]=obj;
        // $scope.option.theads[0].rows[otherIndex]=otherObj;//交换列

        //插入当前拖动的列后，后面的列都往前或往后移动的方式
        var tlen=$scope.option.theads.length-1;//只拖动表头，不拖动新增的表title
        if(tlen<0){
            alert('thead 为空！');
            return;
        }
        var otherIndex=$scope.option.theads[tlen].rows.indexOf(obj);
        if(otherIndex>index){//把后面的元素拖到前面
            var otherObj=$scope.option.theads[tlen].rows[index];
            for(i=index;i<otherIndex;i++){//从index到otherindex的元素都向后移动
                var otherObjNext=$scope.option.theads[tlen].rows[i+1];
                $scope.option.theads[tlen].rows[i+1]=otherObj;
                otherObj=otherObjNext;
            }
            $scope.option.theads[tlen].rows[index]=obj;
        }else{//把前面的元素拖到后面
            var otherObj=$scope.option.theads[tlen].rows[index-1];//这里从index-1开始循环赋值，产生的现象是当前元素在拖动的红线处插入
            for(i=index-1;i>otherIndex;i--){//从otherindex到index的元素都向前移动
                var otherObjPre=$scope.option.theads[tlen].rows[i-1];
                $scope.option.theads[tlen].rows[i-1]=otherObj;
                otherObj=otherObjPre;
            }
            $scope.option.theads[tlen].rows[index-1]=obj;
        }
        $scope.option.columns=[];
        //每次更新thead后需要更新column已便于获取后台数据
        for(i=0;i<$scope.option.theads[tlen].rows.length;i++){
            $scope.option.columns.push($scope.option.theads[tlen].rows[i].field);
        }
        $scope.editTheadAry=angular.copy($scope.option.theads);
        $scope.rebuildTable();
    }
   
    $scope.addThead = function(){
        var length = $scope.editTheadAry[$scope.editTheadAry.length - 1].rows.length;
        var newRow = [];
        for(var i = 0; i < length;i++){
            newRow.push({"title":'',
            "rowspan":1,
            "colspan":1,
            "isedit":'0',"iscombine":'0'});
        }
        $scope.editTheadAry.unshift({rows:newRow});
    };
    $scope.combineAry = [];
    $scope.combining = false;
    $scope.cancombine = true;
    $scope.editText = function(rownum,thnum){
        $scope.cancelCombine();
        if(rownum !=$scope.editTheadAry.length - 1 &&  !$scope.deleting){
            $scope.editTheadAry[rownum].rows[thnum].isedit ='1';
        }
    };
    $scope.cancelEdit = function(rownum,thnum){
        $scope.editTheadAry[rownum].rows[thnum].isedit ='0';
        $scope.cancelCombine();
    };
    $scope.combine = function(rownum,thnum){
        if(rownum ==$scope.editTheadAry.length - 1 || $scope.editTheadAry[rownum].rows[thnum].isedit =='1' || $scope.deleting){
            return false;
        }
        $scope.combining = true;
        $scope.combineAry.map(function(index){
            if(index[0] != rownum){
                $scope.cancombine = false;
            }
        });
        if(!$scope.cancombine){
            $scope.cancelCombine();
            $scope.cancombine = true;
        }
        else{
            if($scope.editTheadAry[rownum].rows[thnum].iscombine == '0'){
                $scope.combineAry.push([rownum,thnum]);
                $scope.editTheadAry[rownum].rows[thnum].iscombine ='1';
            }
            else{
                $scope.combineAry =  $scope.combineAry.filter(function(index){
                    return index[1] != thnum;
                });
                $scope.editTheadAry[rownum].rows[thnum].iscombine = '0';
            }
        }
    };
    $scope.doCombine = function(){
        var doSort = $scope.combineAry.sort(function(a,b){
            return a[1]>b[1];
        });
        var ifCoherent = true;
        var s = 0;
        while(s < doSort.length && typeof doSort[s+1] != 'undefined'){
            if((Number(doSort[s+1][1]) - Number(doSort[s][1])) > 1){
                ifCoherent = false;
            }
            s++;
        }
        if(!ifCoherent){
            alert('合并项不连贯，无法合并');
            return false;
        }
        var doconfirm =  confirm('合并之后 表头文字会显示第一个单元格内容，是否继续？');
        if(doconfirm){
            var firstItem = doSort[0];
            var itemLength = doSort.length;
            var colspan = 0;
             doSort.map(function(a){
                colspan = colspan + $scope.editTheadAry[a[0]].rows[a[1]].colspan;
            });
            $scope.editTheadAry[firstItem[0]].rows[firstItem[1]].colspan = colspan;
            var s2 = 1;
            while(s2<itemLength){
                $scope.editTheadAry[firstItem[0]].rows.splice(firstItem[1]+1,1);
                $scope.combineAry.splice(s2,1);
                s2++;
            }
            $scope.cancelCombine();
        }
        else{
            return false;
        }
    };
    $scope.cancelCombine = function(){
        $scope.combineAry.map(function(index){
            if(typeof $scope.editTheadAry[index[0]].rows[index[1]] != 'undefined'){
                $scope.editTheadAry[index[0]].rows[index[1]].iscombine ='0';
            }
        });
        $scope.combineAry = [];
        $scope.combining = false;
    };
    $scope.deleting = false;
    $scope.deleteThead = function(){
        $scope.cancelCombine();
        $scope.deleting = true;
    };
    $scope.cancelDelete = function(){
        $scope.deleting = false;   
    };

    $scope.deleteItem = function(rnum){
        if(!$scope.deleting || rnum == $scope.editTheadAry.length - 1){
            return false;
        }
        var a = confirm('是否删除此行?');
        if(a){
            $scope.editTheadAry.splice(rnum,1);
        }
        else{
            return false;
        }
    };
    $scope.saveThead = function(){
        $scope.showDragBtn = $scope.showDragBtn == '0'?'1':'0';//反转拖动表头排序状态
        $scope.isEdit = '0';
        $scope.btnText = '编辑表头';
        $scope.deleting = false;
        $scope.combineAry = [];
        if($scope.editTheadAry.length == $scope.option.theads.length && $scope.editTheadAry.length == 1){
            $scope.combineAry = [];
        }
        else{
            $scope.option.theads = angular.copy($scope.editTheadAry);
        }
        // $scope.option.theads = $scope.editTheadAry;
        $scope.option.config.sScrollY = $window.innerHeight - 200 - $scope.option.theads.length*40 + 'px';
        // $scope.rebuildTable();
        if($scope.tabledata.length >0 ){
            $scope.tabledata = [];
            $scope.rebuildTable();
        }
    };
    $scope.cancelThead = function(){
        $scope.showDragBtn = $scope.showDragBtn == '0'?'1':'0'; //反转拖动表头排序状态
        $scope.isEdit = '0';
        $scope.btnText = '编辑表头';
        $scope.deleting = false;
        $scope.editTheadAry = angular.copy($scope.option.theads);
    };
    $scope.loadData = function(){
        isLoadedData=true;
        showLoading();
        if(!$scope.option.columns || $scope.option.columns.length == 0){
            hideLoading();
            return false;
        }
        $http({
            method: 'POST',
            url: '/api/dash/loadTableData',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
            data: {
              column:$scope.option.columns,
              olapid:$scope.selectolap.id,
              limit:$scope.option.length,
              merge:$scope.option.merge,
              mergeCols:$scope.option.mergeCols
            }
        }).success(function(rs){
            if(rs.status=='success'){
                $scope.tabledata = rs.data;
                $scope.rebuildTable('build');//方法里会执行hideLoading();
            }else if(rs.status=='failure'){
                alert(rs.data);
                hideLoading();
            }
        });
    };

    $scope.save = function(){
        $("body").mLoading();//遮罩层
        html2canvas($("#outdiv"), {
            onrendered: function (canvas) {
                var imgpath = canvas.toDataURL();
                $http.get('/api/type/getTypeList').then(function(rs){
                    $scope.enumkinds = rs.data;
                    var modalInstance = $uibModal.open({
                        animation: true,
                        ariaLabelledBy: 'modal-title',
                        ariaDescribedBy: 'modal-body',
                        templateUrl: '/dashboard/savedatatable',
                        controller: 'saveController',
                        backdrop: false,
                        resolve: {
                            kind:function(){
                                return $scope.enumkinds;
                            },
                            json:function(){
                                return $scope.option;
                            },
                            saveconfig:function(){
                                return $scope.saveconfig;
                            },
                            imgpath:function(){
                                return imgpath;
                            }
                        }
                      });
                      modalInstance.result.then(function () {
                          $("body").mLoading('destroy');//清除遮罩层
                      });
                      $("body").mLoading('destroy');//清除遮罩层
                });
            }
        });
        
       
    };
    //检测merge点击事件
    $scope.selMergeColFun=function () {
        if($scope.option.merge!='' && $scope.option.merge=='true'){//如果选中，弹出模态框
            //由于表头可以更改，merge选择的时候也需要用字典{key:value}的形式来显示
            colObj=[];
            theadLen=$scope.option.theads.length;
            $scope.option.theads[theadLen-1].rows.forEach(function (value, index, array) {
                tempObj={};
                tempObj['title']=value['title'];
                tempObj['feild']=value['field'];
                colObj.push(tempObj);
            },[]);

            var mgCol=$scope.option.mergeCols;
            var modalInstance=$uibModal.open({
                templateUrl:'mergeColSel.html',
                controller:'mergeColSelController',
                backdrop:'static',
                controllerAs:'vm',
                size:'lg',
                resolve:{
                    allTableCols:function () {
                        var allTableColName=colObj;
                        var emptySumCol=false;
                        var emptyGroupCol=false;
                        //if判断客户可能没有选择是否聚合按钮
                        if(mgCol && String(typeof(mgCol))!='undefined'){
                            mgSumCol=$scope.option.mergeCols.mergeSumCol;
                            if(mgSumCol && String(typeof(mgSumCol))!='undefiend'){
                                allTableColName=allTableColName.filter(function (index) {
                                    return objIsExist(mgSumCol,index,'feild')<0;
                                });
                            }else{
                                emptySumCol=true;
                            }
                        }else{
                            emptySumCol=true;
                        }
                        if(mgCol && String(typeof(mgCol))!='undefined'){
                            mgGroupCol=$scope.option.mergeCols.mergeGroupCol;
                            if(mgGroupCol && String(typeof(mgGroupCol))!='undefined'){
                                allTableColName=allTableColName.filter(function (index) {
                                    return objIsExist(mgGroupCol,index,'feild')<0;
                                });
                            }else{
                                emptyGroupCol=true;
                            }
                        }else{
                            emptyGroupCol=true;
                        }
                        if(emptySumCol && emptyGroupCol){
                            return colObj
                        }else{
                            return allTableColName;
                        }
                    },
                    mergeSumCols:function () {
                        if(mgCol && String(typeof(mgCol))!='undefined'){
                            mgSumCol=$scope.option.mergeCols.mergeSumCol;
                            if(mgSumCol && String(typeof(mgSumCol))!='undefiend'){
                                return mgSumCol;
                            }else{
                                return [];
                            }
                        }else{
                            return [];
                        }
                    },
                    mergeGroupCols:function () {
                        if(mgCol && String(typeof(mgCol))!='undefined'){
                            mgGroupCol=$scope.option.mergeCols.mergeGroupCol;
                            if(mgGroupCol && String(typeof(mgGroupCol))!='undefiend'){
                                return mgGroupCol;
                            }else{
                                return [];
                            }
                        }else{
                            return [];
                        }
                    }
                }
            });
            modalInstance.result.then(function (data) {
                //把值存入jsonconfig，如果为空关闭merge按钮
                if(data=='cancel'){
                    $scope.option.merge='false';
                    $scope.option.mergeCols={};
                }else{
                    $scope.option.mergeCols=data;
                }
            },function(){});
        }
    }

});
//某个obj是否存在于另一个list[obj]中,存在返回1，不存在返回-1
function objIsExist(listObj,obj,key) {
    existSta=-1;
    try{
        listObj.forEach(function(val){
            if(val[key]==obj[key]){
                existSta=1;
            }
        });
    }catch(err){
        return -1;
    }
    return existSta
}

app.controller('designController',  function($log,$scope,$http,$uibModal,$state,$element,$stateParams,$window,$timeout,$compile){
    
    $http.get('/api/dash/getOlaplists').then(function(rs){
        $scope.sourceList = rs.data
        console.log('$scope.sourceList', $scope.sourceList)
    })

    $scope.options = {
        'groupField': 'olaptype',
        'displayField': 'name'
    }
    $scope.dataSource = {}
    
    $scope.dataSourceChange = function () {
        if ($scope.dataSource != null && $scope.dataSource != {}) {
            $scope.loadDataRows()
        }
    }

    $scope.sourceCols = []
    $scope.loadDataRows = function () {
        if ($scope.dataSource['id']) {
            var url = '/api/dash/getOlapDataByTotal/' + $scope.dataSource['id']
            $http.get(url).then(function(rs){
                $scope.sourceCols = rs.data.data
                console.log($scope.sourceCols)
            })
        }
    }

    $scope.selectValue = ''

    $scope.selectValueChange = function () {
        console.log('selectValueChange : $scope.selectValue', $scope.selectValue)
    }

});

app.controller('mergeColSelController', function ($scope, $http, $uibModalInstance,$timeout, allTableCols,mergeSumCols,mergeGroupCols) {
    $scope.allTableCols=allTableCols;
    $scope.mergeGroupCols=mergeGroupCols;
    $scope.mergeSumCols=mergeSumCols;

    $scope.ok=function () {
        // console.log('allTableCols=',allTableCols);
        if($scope.allTableCols.length==0 || $scope.allTableCols==''){
            $uibModalInstance.close({mergeGroupCol:$scope.mergeGroupCols,mergeSumCol:$scope.mergeSumCols});
        }else{
            alert('请对所有字段进行分组或sum计算！');
        }
    };
    $scope.add=function (type) {
      if(type=='group'){
          for(var i=0;i<$scope.allTableCol.length;i++){
              $scope.mergeGroupCols.push($scope.allTableCol[i]);
          }
          $scope.allTableCols=$scope.allTableCols.filter(function (index) {
              return objIsExist($scope.mergeGroupCols,index,'feild')<0;
          })
      }else if(type=='sum'){
          for(var i=0;i<$scope.allTableCol.length;i++){
              $scope.mergeSumCols.push($scope.allTableCol[i]);
          }
          $scope.allTableCols=$scope.allTableCols.filter(function (index) {
              return objIsExist($scope.mergeSumCols,index,'feild')<0;
          })
      }
    };
    $scope.remove=function (type) {
      if(type=='group'){
          for(var i=0;i<$scope.mergeGroupCol.length;i++){
              $scope.allTableCols.push($scope.mergeGroupCol[i]);
          }
          $scope.mergeGroupCols=$scope.mergeGroupCols.filter(function (index) {
              return objIsExist($scope.mergeGroupCol,index,'feild')<0;
          })
      }else if(type=='sum'){
          for(var i=0;i<$scope.mergeSumCol.length;i++){
              $scope.allTableCols.push($scope.mergeSumCol[i]);
          }
          $scope.mergeSumCols=$scope.mergeSumCols.filter(function (index) {
              return objIsExist($scope.mergeSumCol,index,'feild')<0;
          })
      }
    };
    $scope.cancel=function () {
        $uibModalInstance.close('cancel');
    }
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});
app.controller('saveController', function ($scope, $http, $uibModalInstance,$timeout, kind, json ,saveconfig,imgpath) {
    $scope.kinds = kind;
    $scope.config = {
        id:saveconfig.id,
        kind:saveconfig.kind,
        title:saveconfig.name,
        desc:saveconfig.remark,
        json:json,
        imgpath:imgpath
    };
    $scope.ok = function () {
        $("body").mLoading();//遮罩层
        $http({
          method: 'POST',
          url: '/api/dash/savedatatable',
          headers: { 'X-CSRFToken': getCookie('csrftoken') },
          data: {
            config:$scope.config
          }
        }).success(function (rs) {
          if (rs.code == 1) {
            $uibModalInstance.close();
          }
          else {
            alert('保存失败');
          }
        });
      };
      $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});

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
                    'height': (newValue.h - 40) + 'px'
                };
            };
            scope.tableStyle = function(){
                return {
                    'height': (newValue.h - 40 - 60) + 'px'
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});
app.controller('addTableTitleController',function ($scope, $timeout,$uibModalInstance,tableTitle) {
    $scope.tableTitle=tableTitle;
    $scope.saveTableTitle=function () {
        $uibModalInstance.close({data:$scope.tableTitle,type:'update'});
    }
    $scope.cancel=function () {
        $uibModalInstance.close({data:$scope.tableTitle,type:'cancel'});
    }
    //添加拖拽效果
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});
app.controller('updateTBHeadController',function ($scope, $timeout,$uibModalInstance,tableHead) {
    $scope.tableHead=tableHead;
    $scope.cancel=function () {
        $uibModalInstance.close({data:'',type:'cancel'});
    };
    //将编辑的tableHead返回
    $scope.ok=function () {
        $uibModalInstance.close({data:$scope.tableHead,type:'save'});
    };
    //添加拖拽效果
    $timeout(function () {
        $(".modal-content").draggable({
                cursor: "move",
                handle: '.modal-header'
        });
    })
});
