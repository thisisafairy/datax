'use strict';

angular.module('vlui')
  .directive('ecChannel', ['Drop','$timeout', function (Drop,$timeout) {
    return {
      templateUrl: 'components/ecchannel/ecchannel.html',
      restrict: 'E',
      replace: true,
      scope: {
        modal: '=',
        field: '=',
        canDrag: '<',
        channelTitle: '<',
        removeAction: '&',
        canDrop: '<',
        dropType: '<',
        moreDrag: '<'

      },
      link: function (scope, element /*, attrs*/) {
        var colors =  {
                '#000000': '#000000',
                '#ffffff': '#ffffff',
                '#FF0000': '#FF0000',
                '#777777': '#777777',
                '#337ab7': '#337ab7',
                '#5cb85c': '#5cb85c',
                '#5bc0de': '#5bc0de',
                '#f0ad4e': '#f0ad4e',
                '#d9534f': '#d9534f',
                '#FFFF00':'#FFFF00',
                '#EE00EE':'#EE00EE',
                '#ADFF2F':'#ADFF2F'
         };
        scope.FieldDropped = function () {

          if (scope.dropType == 'filter'){
            var date= new Date();
            scope.thismodal.ifAuto = '1';
            if(scope.channelTitle == '月份'){
              scope.thismodal.value = date.getMonth();
            }
            else{
              scope.thismodal.value = date.getFullYear();
            }
          }
          if(scope.dropType == "dbar")
          {
              scope.thismodal.showavgline = false;
              scope.thismodal.avglinevalue = null;
          }
          scope.thismodal.calcrules = '';
          scope.field = angular.copy(scope.thismodal);
        };
        //仪表盘分段配置项
        scope.SplitDropped = function () {
            //想要获取到newmodel  这个退拽对象不能使用ng-if 影响初始化,必须用ng-show
           scope.field.splitField = scope.field.splitField||[];
           scope.newmodel.color="#d5d931";
           scope.newmodel.giveLength=false;
           scope.newmodel.length=0;
          scope.field.splitField.push(angular.copy(scope.newmodel));
        };
        scope.removeSplit = function(field,num) {
          if (Array.isArray(scope.field.splitField)) {
            scope.field.splitField.splice(num,1);
          }
          else{
            scope.field.splitField = [];
          }
        };
        scope.showSplitPop = function(index){
          if (element.find('.echart-type'+index).length > 0) {
              var typePopup = new Drop({
                  content: element.find('.echart-type'+index)[0],
                  target: element.find('.type-caret'+index)[0],
                  position: 'top left',
                  openOn: 'click'
              });
          typePopup.on('open', function () {
              $(".split-color"+index).colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                scope.field.splitField[index].color = $(this).val();
              });
            });
          scope.splitPopup = typePopup;
          typePopup.open();
          }
        };
        scope.setSplitColor = function (type,index) {
          if (type == 'split') {
            scope.field.splitField[index].color= angular.copy(scope.field.splitField[index].color);
            console.log(scope.field.splitField);
          }
          scope.splitPopup.open();
        };
        //仪表盘分段配置结束

        if (element.find('.type-caret').length > 0 && element.find('.echart-type').length > 0) {
          var typePopup = new Drop({
            content: element.find('.echart-type')[0],
            target: element.find('.type-caret')[0],
            position: 'top left',
            openOn: 'click'
          });
          var calPopup = new Drop({//计算字段的事件
            content: element.find('.count-type')[0],
            target: element.find('.count-caret')[0],
            position: 'top left',
            openOn: 'click'
          });
          if (scope.dropType == 'type' && scope.field && scope.field.color) {
            scope.mix_color = angular.copy(scope.field.color);
            typePopup.on('open', function () {
              $(".drop-content .color-input").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                scope.mix_color = $(this).val();
              });
              $(".alertcolor").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {//警示线颜色
                  scope.field.alertsConfigs[parseInt($(this).attr('idx'))].color = $(this).val();
              });
              $(".color-label").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {//警示线颜色
                  scope.field.label.normal.color = $(this).val();
              });
            });
          }
          if (scope.dropType == 'mappoint' && scope.field && scope.field.color) {
            scope.point_color = angular.copy(scope.field.color);
            scope.point_top_color = angular.copy(scope.field.top_color);
            typePopup.on('open', function () {
              $(".drop-content .point-color-input").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                if($(this).attr('rel') == 'normal'){
                  scope.point_color = $(this).val();
                }
                if($(this).attr('rel') == 'top'){
                  scope.point_top_color = $(this).val();
                }
              });
            });
          }

          if (scope.dropType == 'single' && scope.field && scope.field._titleColor ){
            scope.single_title_color = angular.copy(scope.field._titleColor);
            scope.single_value_color = angular.copy(scope.field._valueColor);
            typePopup.on('open', function () {
              $(".drop-content .single-color").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                if ($(this).attr('rel') == 'single_title') {
                  scope.single_title_color = $(this).val();
                }
                if ($(this).attr('rel') == 'single_value') {
                  scope.single_value_color = $(this).val();
                }
              });
            });
          }
          if (scope.dropType == 'style' && scope.field) {
            typePopup.on('open', function () {
              $(".split-color-input").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                if($(this).attr('rel') == 'normal'){
                  scope.field.splitcolor = $(this).val();
                }
                if($(this).attr('rel') == 'pointer'){
                  scope.field.style.itemStyle.normal.color = $(this).val();
                }
              });
            });
          }

        }

        scope.alertBlur = function () {
            scope.field.alertsConfigs = scope.field.alertsConfigs ||[];
            var oldlen = scope.field.alertsConfigs.length;
            if(scope.field.alertscount>oldlen)
            {
              for(var i=0;i<scope.field.alertscount-oldlen;i++)
              {
                scope.field.alertsConfigs.push({value:0,color:'red',name:'警示线'+(i+1)});
              }
            }
            else(scope.field.alertscount<oldlen)
            {
              scope.field.alertsConfigs.splice(scope.field.alertscount,oldlen-scope.field.alertscount);
            }
            $timeout(function(){
              $(".alertcolor").colorpicker({ align: 'right',colorSelectors: colors }).on('changeColor', function () {
                  scope.field.alertsConfigs[$(this).attr('idx')].color = $(this).val();
              });
            },1000);//延时初始化颜色控件
        }

        scope.groupcountBlur = function () {//自定义分组
            scope.field.groupConfigs = scope.field.groupConfigs ||[];
            var oldlen = scope.field.groupConfigs.length;
            if(scope.field.selfgroupcount>oldlen)
            {
              var t=1;
              for(var i=0;i<scope.field.selfgroupcount-oldlen;i++)
              {
                scope.field.groupConfigs.push({valuestart:t,valueend:(t+1),name:'分组'+(i+1)});
                t=t+2;
              }
            }
            else(scope.field.selfgroupcount<oldlen)
            {
              scope.field.groupConfigs.splice(scope.field.selfgroupcount,oldlen-scope.field.selfgroupcount);
            }
        }

        scope.setLineColor = function (index) {
          scope.field.alertsConfigs[index].color = angular.copy($(this).val());
          typePopup.open();
        };

        scope.setMixColor = function () {
          scope.field.color = angular.copy(scope.mix_color);
          typePopup.open();
        };

        scope.setPointColor = function (type,index) {
          if(type == 'normal'){
            scope.field.color = angular.copy(scope.point_color);
          }
          if(type == 'top'){
            scope.field.top_color = angular.copy(scope.point_top_color);
          }
          if(type == 'single_title'){
            scope.field._titleColor = angular.copy(scope.single_title_color);
          }
          if (type == 'single_value') {
            scope.field._valueColor = angular.copy(scope.single_value_color);
          }
          typePopup.open();
        };

        scope.getAllCols = function(){
            //获取主scope选择的相关字段
            var mainscope = $('div[ng-controller="MainCtrl"]').scope();
            var fields = mainscope.Dataset.schema.fieldSchemas;
            return fields;
        };

        scope.$watch('field.truetype', function (n) {
          if (!scope.field || !scope.field.truetype || !scope.field.type) {
            return;
          }
          if (n === 'area') {
            scope.field.type = 'line';
            scope.field.isarea = '1';
          }
          else if(n === 'linestep')
          {
            scope.field.type = 'line';
          }
          else {
            scope.field.type = n;
          }
          if (n !== 'bar') {
            scope.field.label.normal.position = 'top';
          }
        });

        scope.$on('$destroy', function () {
          if (typePopup && typePopup.destroy) {
            typePopup.destroy();
          }
        });

        scope.addAnd = function (data) {
            if(!data)
            {
                if(scope.field.rules[0]&&scope.field.rules[0].relate=="and")
                {
                    scope.field.rules.push({id:scope.genID(20),parentid:scope.field.rules[0].id,name:scope.field.field,relate:'and',rule:'==',value:''});
                }
                else
                {
                    var newid =scope.genID(20);
                    scope.field.rules.push({id:newid,parentid:"0",name:'',relate:'and',rule:'',value:''});
                    scope.field.rules.push({id:scope.genID(20),parentid:newid,name:scope.field.field,relate:'and',rule:'==',value:''});
                }
            }
            else
            {
                var parent = scope.field.rules.find(function (x) {
                    return x.id===data.parentid
                });
                if(parent.relate=="and")
                {
                    scope.field.rules.push({id:scope.genID(20),parentid:parent.id,name:scope.field.field,relate:'and',rule:'==',value:''});
                }
                else {
                    var newid =scope.genID(20);
                    scope.field.rules.push({id:newid,parentid:parent.id,name:'',relate:'and',rule:'',value:''});
                    scope.field.rules.push({id:scope.genID(20),parentid:newid,name:scope.field.field,relate:'and',rule:'==',value:''});
                    scope.field.rules.find(function (x) {
                        return x.id===data.id
                    }).parentid = newid;
                }
            }
            $timeout(function(){
                typePopup.open();
            });
        };
        scope.addOr = function (data) {
            if(!data)return;
            var parent = scope.field.rules.find(function (x) {
                return x.id===data.parentid
            });
            if(parent.relate=="or")
            {
                scope.field.rules.push({id:scope.genID(20),parentid:parent.id,name:scope.field.field,relate:'or',rule:'==',value:''});
            }
            else {
                var newid =scope.genID(20);
                scope.field.rules.push({id:newid,parentid:parent.id,name:'',relate:'or',rule:'',value:''});
                scope.field.rules.push({id:scope.genID(20),parentid:newid,name:scope.field.field,relate:'or',rule:'==',value:''});
                scope.field.rules.find(function (x) {
                    return x.id===data.id
                }).parentid = newid;
            }
            $timeout(function(){
                typePopup.open();
            });
        };
        scope.removeFilter = function(data){
            var brothers = [];
            var brothersOnly = [];//只是表达式的平级兄弟
            var childs = [];
            var parent = {};
            scope.field.rules.map(function(objct){
                if(objct.parentid === data.parentid&&arguments[0].id!=data.id)
                {
                    if(arguments[0].rule!="")
                    {
                        brothers.push(objct.id);
                    }
                    else
                    {
                        brothersOnly.push(objct.id);
                    }
                }
                if(objct.parentid === data.id)
                    childs.push(objct.id);
                if(objct.id===data.parentid)
                    parent = objct;
            });
            if(brothers.length==0)
            {
                if(brothersOnly.length!=0)//只剩下同级条件,条件前置,删除父条件
                {
                    if(parent.id)
                    {
                        scope.field.rules.del(function(delobj){ return delobj.id===parent.id});
                    }
                    brothersOnly.map(function(value){
                        scope.field.rules.map(function(objs){
                            if(value===objs.id) {
                                objs.parentid = parent.parentid || "0";
                            }
                        });
                    })
                }
                else if(parent.rule=="")//如果没有同级而且父级只有rule.同时产出父级
                {
                    scope.field.rules.del(function(delobj){ return delobj.id===parent.id});
                }
                scope.field.rules.del(function(delobj){ return delobj.id===data.id});
            }
            else
            {
                scope.field.rules.del(function(delobj){ return delobj.id===data.id});
            }
            if(scope.field.rules.length==1&&scope.field.rules[0].parentid=="0")
                scope.field.rules.pop();
            $timeout(function(){
                typePopup.open();
            });
        }
        scope.curentFilter = null;
        scope.filterRowClick = function (ev,rule,parentRule) {
            if(scope.curentFilter)
                scope.curentFilter.css("background-color","");
            $(ev.currentTarget).parent().css("background-color","lightgray");
            scope.curentFilter = $(ev.currentTarget).parent();
        };
        scope.genID = function(length){
            return Number(Math.random().toString().substr(3,length) + Date.now()).toString(36);
        };
        scope.getChilds = function(id){
            var objs=[];
            scope.field.rules.map(function (obj) {
                if(obj.parentid === id)
                    objs.push(obj);
            });
            return objs||[];
        };



        //计算公式
        scope.dropComplete = function(idx,data,evt){
            angular.element(".calc_div_fields").addClass("scroll-y");
            scope.addFieldCalc(arguments[1].helper[0].innerText);
        }
        scope.calcheck = "合法";
        scope.addFieldCalc = function(field,isset)
        {
            scope.field.calcrules = !scope.field.calcrules?"":scope.field.calcrules;
            if(isset)
                scope.field.calcrules = field;
            else
                scope.field.calcrules += ' '+field;
            if (calcCheck(scope.field.calcrules)) {
                scope.calcheck = "合法";
            }else{
               scope.calcheck = "不合法";
            }
        }
        scope.dragstop = function (data,evt) {
            angular.element(".calc_div_fields").addClass("scroll-y");
        };
        scope.dragstart = function (data,evt) {
            angular.element(".calc_div_fields").removeClass("scroll-y");//拖拽滚动条的bug修正
        };
        scope.deleteWords = function(evt){
            var el = evt.currentTarget;
            if(evt.keyCode==8) {
                delWholeWord(el, angular.element(el).val(), getCursortPosition(el));
                scope.addFieldCalc(angular.element(el).val(),true);
            }
        }
        var getCursortPosition = function (ctrl) {
            var CaretPos = 0;
            // IE Support
            if (document.selection) {
                ctrl.focus();
                var Sel = document.selection.createRange();
                Sel.moveStart('character', -ctrl.value.length);
                CaretPos = Sel.text.length;
            }
                // Firefox support
            else if (ctrl.selectionStart || +ctrl.selectionStart === 0)
            { CaretPos = ctrl.selectionStart; }
            return (CaretPos);
        };

        var selectSomeText = function (element, begin, end) {
            if (element.setSelectionRange) {
                element.setSelectionRange(begin, end);
            }
            else if (element.createTextRange) {
                var range = element.createTextRange();
                range.moveStart("character", begin);
                range.moveEnd("character", end);
                range.select();
            }
        };

        var delWholeWord = function (text, field, pos) {
            var startIndex = pos;
            if (field.charAt(pos - 1) !== ' ') {
                for (var i = pos - 2; i >= 0; i--) {
                    if (field.charAt(i) === ' ' || i === 0) {
                        startIndex = i;
                        break;
                    }
                }
                selectSomeText(text, startIndex, pos)
            }

        };

        function calcCheck(string){
            // 剔除空白符
            string = string.replace(/\s/g, '');
            // 错误情况，空字符串
            if("" === string){
                return false;
            }
            // 错误情况，运算符连续
            if( /[\+\-\*\/]{2,}/.test(string) ){
                return false;
            }
            // 空括号
            if(/\(\)/.test(string)){
                return false;
            }
            // 错误情况，加减乘除结尾
            if( /[\+\-\*\/]$/.test(string) ){
                return false;
            }
            // 错误情况，括号不配对
            var stack = [];
            for(var i = 0, item; i < string.length; i++){
                item = string.charAt(i);
                if('(' === item){
                    stack.push('(');
                }else if(')' === item){
                    if(stack.length > 0){
                        stack.pop();
                    }else{
                        return false;
                    }
                }
            }
            if(0 !== stack.length){
                return false;
            }
            // 错误情况，(后面是运算符
            if(/\([\+\-\*\/]/.test(string)){
                return false;
            }
            // 错误情况，)前面是运算符
            if(/[\+\-\*\/]\)/.test(string)){
                return false;
            }
            // 错误情况，(前面不是运算符
            if(/[^\+\-\*\/]\(/.test(string)){
                return false;
            }
            // 错误情况，)后面不是运算符
            if(/\)[^\+\-\*\/]/.test(string)){
                return false;
            }

            return true;
        }

      }
    };
  }]);

    Array.prototype.del = function (filter) {
        var index = null;
        if (typeof filter == 'function') {
            for (var i = 0; i < this.length; i++) {
                if (filter(this[i], i)) index = i;
            }
        }
        if(index!==null)
            this.splice(index, 1)
    };