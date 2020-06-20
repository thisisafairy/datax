var messageBox = new Object()

messageBox.alertBox = function (option) {
    var _title = option.title || '标题'
    var _message = option.msg || '内容'
    var _btnGroup = '<a class="btn btn-primary" onclick="alertBoxClose()">确定</a>'
    if (!option.customBtn) {
        if (option.callback) {
            _btnGroup = '<a class="btn btn-default">确定</a><a class="btn btn-primary" onclick="alertBoxClose()" style="margin-left: 20px;">取消</a>'
        }
    }
    // var _callback = option.callback
    var _boxHtml = '<div class="box-mask datax-alert-box-mask">'
                    + '<div class="datax-alert-box alert-box-small box-shadow-min">'
                    + '<div class="datax-alert-box-head">'
                    + '<span class="datax-alert-box-head-title">'
                    + _title
                    + '</span>'
                    + '<span class="datax-alert-box-head-close" onclick="alertBoxClose()">x</span>'
                    + '</div>'
                    + '<div class="datax-alert-box-body">'
                    + '<span>'
                    + _message
                    + '</span>'
                    + '</div>'
                    + '<div class="datax-alert-box-foot">'
                    + _btnGroup
                    + '</div>'
                    + '</div>'
                    + '</div>'
    $('body').append(_boxHtml)
    var _alert = setTimeout(function () { 
        $('.datax-alert-box').css('top', '10%')
    }, 100)
}

function alertBoxClose() {
    $('.datax-alert-box').css('top', '-170px')
    setTimeout(function () { 
        $('.datax-alert-box-mask').remove()
    }, 300)
}

/**
 * type: ('success','info','warning','danger')
 */
messageBox.alert = function (message, type, theme) {
    if (!type) {
        type = 'success'
    }
    $('.datax-message-box').remove()
    var _boxHtml = '<div class="datax-message-box general-transition">'
                    + '<div class="datax-message-box-text message-' + type + '">'
                    + message
                    + '</div>'
                    + '</div>'
    $('body').append(_boxHtml)
    setTimeout(function () { 
        $('.datax-message-box').css('top', '20px')
    }, 100)
    setTimeout(function () { 
        $('.datax-message-box').css('top', '-50px')
    }, 1500)
    setTimeout(function () { 
        $('.datax-message-box').remove()
    }, 1800)
}

/**
 * maskTransparent: 遮罩背景透明度 'none': 背景透明（默认）, 'half': 半透明, 'full': 看不见背景
 * 
 */
messageBox.openModal = function (elementClass, maskTransparent) {
    if (!maskTransparent) {
        maskTransparent = 'none'
    }
    var jqObj = $('.' + elementClass)
    jqObj.addClass('floating-layer-margin')
    jqObj.css('left', '0px')
    jqObj.animate({'top': '10%'}, 300)
    if ($('.box-mask')) {
        $('.bax-mask').removeClass('transparent-none').removeClass('transparent-half').removeClass('transparent-full')
        $('.bax-mask').addClass('transparent-' + maskTransparent)
        $('.box-mask').show()
    }
}

messageBox.closeModal = function (elementClass) {
    var _hideTop = 700
    var jqObj = $('.' + elementClass)
    if (jqObj.height()) {
        _hideTop = jqObj.height() + 50
    }
    jqObj.animate({'top': (_hideTop * -1) + 'px'}, 300, null, function () {
        jqObj.removeClass('floating-layer-margin')
    })
    if ($('.box-mask')) {
        $('.box-mask').hide()
    }
}