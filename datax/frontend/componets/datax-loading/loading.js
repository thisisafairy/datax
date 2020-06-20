var dataxLoding = new Object()
dataxLoding.showLoading = function (className, showMask, lodingObj) {
    var _jqObj = $('.' + className)
    if (lodingObj) {
        _jqObj = lodingObj
    }
    if (!_jqObj.hasClass('datax-loading-mask')) {
        var _maksClass = 'datax-loading-mask'
        var _containerWidth = _jqObj.width()
        var _containerHeight = _jqObj.height()
        if (showMask) {
            _maksClass = _maksClass + ' datax-loading-mask-show'
        }
        var _loadingTop = 0
        if (_containerHeight > 50) {
            _loadingTop = (_containerHeight - 50)/2
        } else {
            _loadingTop = 10
        }
        
        var _maskSize = 'width:' + _containerWidth + 'px;height:' + _containerHeight + 'px;'
        var _loadingHtml = '<div style="'+_maskSize+'" class="' + _maksClass + '"><div style="margin-top:' + _loadingTop + 'px" class="datax-loading">'
                        +''
                        +'</div></div>'
        _jqObj.append(_loadingHtml);
    }
}

dataxLoding.hideLoading = function (className, lodingObj) {
    if (className) {
        $('.' + className).find('.datax-loading-mask').remove()
    } else {
        $('.datax-loading-mask').remove()
    }
}