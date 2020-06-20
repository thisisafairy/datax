//点击button弹出超文本编辑器
smoptions={
    height:100,
    tabsize: 2,
    focus: true,
    lang:'zh-CN',
    popover:{
        link: [
          ['link', ['unlink']]
        ],
    },
    toolbar: [
        ['style', ['bold', 'italic', 'underline', 'clear']],
        ['font', ['strikethrough']],
        ['fontsize', ['fontsize']],
        ['color', ['color']],
        // ['para', ['ul', 'ol', 'paragraph']],
        ['height', ['height']],
        ['mybutton', ['saveBtn']]
    ],
    buttons: {
        saveBtn: saveToDBPre
    }
};
function saveToDBPre(context){
    var ui = $.summernote.ui;
    var button = ui.button({
        contents: '<i class="fa fa-save"/> 保存',
        tooltip: '保存',
        click: function () {
            var viewTag=$(this).parent().parent().parent().siblings('.view');
            saveToDB(viewTag,'show','alertRsMsg');
        }
    });
    return button.render();   // return button as jquery object
}
// function hideSave(context){
//     var ui = $.summernote.ui;
//     var button = ui.button({
//         contents: '<i class="fa fa-save"/> 保存收起',
//         tooltip: '收起并保存',
//         click: function () {
//             var viewTag=$(this).parent().parent().parent().siblings('.view');
//             saveToDB(viewTag,'hide');
//         }
//     });
//     return button.render();   // return button as jquery object
// }

function saveToDB(that,hideSts,alertMsgSts,updateFoledSts) {//0:保存不收起，1：保存收起,updateFoledSts代表只修改状态
    var saveData=$(that).summernote('code');
    var chartdiv=$(that).closest('.cell-box').find('.chart-content');
    var targId=chartdiv.find('.vega-embed').attr('id');
    targId=targId.match(/[a-f0-9]{32}/)[0];
    var type=$(chartdiv).attr('data-type');
    var saveStatus=true;
    if(!targId || targId==''){
        alert('id为空');
        saveStatus=false;
    }else if(!type || type ==''){
        alert('type为空');
        saveStatus=false;
    }else if(!saveData || saveData ==''){
        alert('编辑的文本为空');
    }
    if(!updateFoledSts || updateFoledSts=='')updateFoledSts='no';
    // console.log('themeid=',themeid);
    // console.log('targId=',targId);
    // console.log('type=',type);
    // console.log('saveData=',saveData);
    var returnRS='failed';
    if(saveStatus){
        $.ajax({
            url: '/api/dash/saveAdditionText/',
            type: 'POST',
            data: {sceneId:themeid,targId:targId,type:type,text:saveData,hideStatus:hideSts,updateFoledSts:updateFoledSts}//targetid为chartid或者tableid,themid是请求url里的
        }).then(function (rs) {
            additionTagShowAndHide();//保存后需要让重新添加hover事件
            if(rs.code==0){
                alert(rs.msg);
            }else{
                if(hideSts=='show'){
                    $(that).parent().parent('.cell-box').attr('hoverUnBind','yes');//添加一个属性来区分是否需要绑定hover事件
                    $(that).parent().parent('.cell-box').unbind('mouseenter').unbind('mouseleave');
                }
                if(alertMsgSts && alertMsgSts != ''){
                    alert('保存成功！');
                }
            }
        })
    }
}
//在场景设计和预览里调用此方法，应对场景设计、场景预览里点击button后分为展开状态和关闭状态
function showInputDialog(that) {
    var ancestorDiv=$(that).parent().parent();
    var theViewDiv=ancestorDiv.find('.view');
    var iicon=$(that).children('em');

    var addChartTagEditStatus=$(that).attr('addChartTagEditStatus');//这个属性在场景设计下会保留，在保存的时候没有配置到过滤属性列表里，所以会被过滤，在场景预览里为空
    if(iicon.hasClass('glyphicon-list')){
        iicon.removeClass('glyphicon-list').addClass('glyphicon-heart');
        if(addChartTagEditStatus && addChartTagEditStatus !=''){
            theViewDiv.show();
            $(that).closest('.cell-box').unbind('mouseenter').unbind('mouseleave');//必须使用cell-box
            $(that).closest('.cell-box').attr('hoverUnBind','yes');//如果点击的是自己就移除标志，使得自己可以注册hover事件
        }else{//场景设计里面点击按钮打开超文本设计
            theViewDiv.hide();
            $(ancestorDiv).find('.summernote').summernote(smoptions);//加载view里的内容是点击之后，点击之前html文档已经加载完毕
            // $('.demo .row-fluid .cell-box').unbind('mouseenter').unbind('mouseleave');
            $(that).closest('.cell-box').unbind('mouseenter').unbind('mouseleave');
            saveToDB(theViewDiv,'show','','yes');//必须放到summernote初始化以后
        }
    }else{
        iicon.removeClass('glyphicon-heart').addClass('glyphicon-list');
        if(addChartTagEditStatus && addChartTagEditStatus !=''){
            theViewDiv.hide();
            $(that).closest('.cell-box').removeAttr('hoverUnBind');//如果点击的是自己就移除标志，使得自己可以注册hover事件
            additionTagShowAndHide();
            console.log('no.....');
        }else{
            saveToDB(theViewDiv,'hide','','yes');//必须放到summernote的destroy以前
            $(ancestorDiv).parent().removeAttr('hoverUnBind');//如果点击的是自己就移除标志，使得自己可以注册hover事件
            $(ancestorDiv).find('.summernote').summernote('destroy');
            theViewDiv.hide();
            additionTagShowAndHide()
        }
    }
}
//标注文本的显示和隐藏，当鼠标指在图表所在的view里就显示，否者就隐藏，通过一个标志位hoverUnBind来识别对应的图表是否展开和关闭
function additionTagShowAndHide(){
    $('.demo .row-fluid .cell-box').each(function (index,elem) {
        if($(elem).attr('hoverUnBind') && $(elem).attr('hoverUnBind')=='yes'){
            //如果是有标志位，就不绑定hover
        }else {
            $(elem).hover(function () {
                var chartAddtTextTag = $(this).find('.addChartTagStyle');
                if (chartAddtTextTag) {//如果进出的是view div就执行显示隐藏操作,不做此判断会点不到按钮
                    $(this).find('.addChartTagStyle').show();
                }
            }, function () {
                var chartAddtTextTag = $(this).find('.addChartTagStyle');
                if (chartAddtTextTag) {//如果进出的是view div就执行显示隐藏操作,不做此判断会点不到按钮
                    $(this).find('.addChartTagStyle').hide();
                }
            })
        }

    });

    // $('.demo .row-fluid .cell-box').hover(function () {
    //     var chartAddtTextTag=$(this).find('.addChartTagStyle');
    //     if(chartAddtTextTag){//如果进出的是view div就执行显示隐藏操作,不做此判断会点不到按钮
    //         $(this).find('.addChartTagStyle').show();
    //     }
    // },function () {
    //     var chartAddtTextTag=$(this).find('.addChartTagStyle');
    //     if(chartAddtTextTag){//如果进出的是view div就执行显示隐藏操作,不做此判断会点不到按钮
    //         $(this).find('.addChartTagStyle').hide();
    //     }
    // })
    //删除图表上面的title,由于在列表里有这个属性，拖拽到场景设计里以后就不需要了，故删除，而且本函数在拖拽进入场景设计都会执行一次，所以可以在这里使用
    $('#demoSave .cell-box .box-element').removeAttr('title');
}