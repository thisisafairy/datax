// 屏幕可用高度
var initHeight = window.innerHeight - 40;
// 列高
var colHeight = "546px";
if (window.innerWidth < 1367) {
    colHeight = "390px";
}
// 列屏幕顶部距离
var colMarginTop = (initHeight * 0.2) + "px";
// hover列高
var colHoverHeight = "576px";
if (window.innerWidth < 1367) {
    colHoverHeight = "412px";
}
window.onresize = function(){
    if (window.innerWidth < 1367) {
        colHeight = "390px";
    } else {
        colHeight = "546px";
    }
    if (window.innerWidth < 1367) {
        colHoverHeight = "412px";
    } else {
        colHoverHeight = "576px";
    }
}
// hover列屏幕顶部距离
var colHoverMarginTop = ((initHeight * 0.2) - 14) + "px";
// 列头颜色
var colTitleColors = ["#528be1","#f67739","#feb023","#7375f2"];
// 默认标题
var defaultTitle = '欢迎使用数据眼! 让数据分析更简单';
// 模块的默认图标
var defaultIcon = '/frontend/image/ico/module_icon.jpg';
// 最后一列图片
var showDevices = [
      '/frontend/image/ico/phone.png',
      '/frontend/image/ico/pad.png',
      '/frontend/image/ico/pc.png',
      '/frontend/image/ico/tv.png'
  ];

var titleStyle = {
      "color": "#333333",
      "position": "absolute",
      "top": initHeight * 0.1
};

var standardColStyle = {
    "height": colHeight
}
var positionColStyle = {
    "height": colHeight
}

var colsStyle = [{
      "height": colHeight
  },{
      "height": colHeight
  },{
      "height": colHeight
  },{
      "height": colHeight
  }];

var colTitleStyles = [{
      "background-color": colTitleColors[0]
  }, {
      "background-color": colTitleColors[1]
  }, {
      "background-color": colTitleColors[2]
  }, {
      "background-color": colTitleColors[3]
  }];
///页面显示的在数据库dashboard_moduleconfigs表的model_configs字段里
var cols = [{title: '系统管理', titleBg:colTitleColors[0], modules:[]},
            {title: '数据管理', titleBg:colTitleColors[1], modules:[]},
            {title: '数据分析', titleBg:colTitleColors[2], modules:[]},
            {title: '数据可视化', titleBg:colTitleColors[3], modules:[]}];
