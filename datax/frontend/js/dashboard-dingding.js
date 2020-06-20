if (dd) {
    dd.ready(function() {
        if (dd.version) {
            // dd.ready参数为回调函数，在环境准备就绪时触发，jsapi的调用需要保证在该回调函数触发后调用，否则无效。
            dd.runtime.permission.requestAuthCode({
                // corpId: "ding94b96bee194dda1335c2f4657eb6378f",
                corpId: "ding355eccb63f7d306835c2f4657eb6378f",
                onSuccess: function(result) {
                    dd.device.base.getPhoneInfo({
                        onSuccess : function(data) {
                            /*
                            {
                                screenWidth: 1080, // 手机屏幕宽度
                                screenHeight: 1920, // 手机屏幕高度
                                brand:'Mi'， // 手机品牌
                                model:'Note4', // 手机型号
                                version:'7.0'. // 版本
                                netInfo:'wifi' , // 网络类型 wifi／4g／3g 
                                operatorType :'xx' // 运营商信息
                            }
                            */
                        },
                        onFail : function(err) {}
                    });
                    if (dd.ios) {
                        dd.biz.navigation.setLeft({
                            control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                            text: '返回',//控制显示文本，空字符串表示显示默认文本
                            onSuccess : function(result) {
                                if (mbMenuType == 'lite') {
                                    $('.lite-mb-portal').animate({
                                        left: "0"
                                    }, 200, function () { })
                                }                 
                            },
                            onFail : function(err) {}
                        });
                    }
                    if (dd.android) {
                        document.addEventListener('backbutton', function(e) {
                            e.preventDefault();
                            if (mbMenuType == 'lite') {
                                $('.lite-mb-portal').animate({
                                    left: "0"
                                }, 200, function () { })
                            }
                        }, false);                        
                    }
                    dd.biz.navigation.setRight({
                        show: true,//控制按钮显示， true 显示， false 隐藏， 默认true
                        control: true,//是否控制点击事件，true 控制，false 不控制， 默认false
                        text: '分享',//控制显示文本，空字符串表示显示默认文本
                        onSuccess : function(result) {
                            dd.biz.util.share({
                                type: 0,//分享类型，0:全部组件 默认；1:只能分享到钉钉；2:不能分享，只有刷新按钮
                                url: shareUrl,
                                title: shareName,
                                onSuccess : function() {
                                    //onSuccess将在调起分享组件成功之后回调
                                    /**/
                                },
                                onFail : function(err) {}
                            })
                        },
                        onFail : function(err) {}
                    });
                },
                onFail : function(err) {}
        
            });            
        }
        
    });

}
