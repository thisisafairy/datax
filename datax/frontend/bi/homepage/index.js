var app = angular.module('homepageapp', ['ui.bootstrap']);//

var transitionTopStyle = {
    "transition": "top 1.5s",
    "-moz-transition": "top 1.5s", /* Firefox 4 */
    "-webkit-transition": "top 1.5s", /* Safari and Chrome */
    "-o-transition": "top 1.5s" /* Opera */    
}

var transitionTopStyle_5 = {
    "transition": "top 0.5s",
    "-moz-transition": "top 0.5s", /* Firefox 4 */
    "-webkit-transition": "top 0.5s", /* Safari and Chrome */
    "-o-transition": "top 0.5s" /* Opera */    
}

var transitionTopStyle_1 = {
    "transition": "top 1s",
    "-moz-transition": "top 1s", /* Firefox 4 */
    "-webkit-transition": "top 1s", /* Safari and Chrome */
    "-o-transition": "top 1s" /* Opera */    
}

var chartsFrameId;
if (terminalType == 'phone') {
    chartsFrameId = 'mainMbChartFrame'
} else {
    chartsFrameId = 'mainChartFrame'
}

function startLoding() {

}

app.controller('homepagectrl', function ($scope, $http, $document, $timeout) {
    $scope.terminalType = terminalType

    $scope.clicked = false;
    $scope.headerStatus = true;
    $scope.headerStyle = {};
    $scope.toggleStyle = {};
    $scope.navListStyle = {};
    $scope.navBtnStyle = {};
    $scope.navBtnGroup = {};
    angular.copy(transitionTopStyle, $scope.headerStyle);
    $scope.themeStyle = {};
    angular.copy(transitionTopStyle_1, $scope.themeStyle);
    angular.copy(transitionTopStyle_1, $scope.toggleStyle);
    angular.copy(transitionTopStyle_5, $scope.navListStyle);
    angular.copy(transitionTopStyle_1, $scope.navBtnStyle);
    angular.copy(transitionTopStyle_1, $scope.navBtnGroup);
    $scope.openList = function (e) {
        if (e) {
            e.stopPropagation();
        }
        $scope.clicked = !$scope.clicked;
        if ($scope.clicked) {
            $scope.switchNavList = $timeout(function() {
                if ($scope.clicked) {
                    $scope.navListStyle.zIndex = "110";
                } else {
                    $scope.navListStyle.zIndex = "1";
                }
            }, 1400);
        } else {
            $scope.navListStyle.zIndex = "1";
        }
        $scope.navListStyle.top = $scope.clicked? "45px": "-445px";
        //$scope.navListStyle.border = $scope.clicked? "1px solid #333": "none";
        $scope.num = '';
    };
    
    $scope.child_style = {
        top: 0
    };
    $scope.num = '';
    $scope.footactive = false;
    $scope.open = function (num, e, row) {
        e.stopPropagation();
        if(row.hasChild == '1'){
            $scope.num = num;
        }
        else{
            $scope.toPage(row);
        }
    };

    $scope.toPage = function(row){
        $scope.switchNavList = $timeout(function() {
            $scope.foldMenu();
        }, 500);
        document.getElementById(chartsFrameId).setAttribute('src', row.url);
    };

    $scope.menuList = [];
    
    $scope.foldMenu = function() {
        if ($scope.clicked) {
            $scope.clicked = false;
            $scope.navListStyle.zIndex = "1";
            $scope.navListStyle.top = "-445px";
            $scope.$apply();
        }
    }

    $document.on('click', function(){
        $scope.foldMenu();
    });
    document.getElementById('mainChartFrame').contentDocument.onclick = function () {
        $scope.foldMenu();
    };

/*
    $http.get('/api/getPortalTree').then(function (response) {
        $scope.menuList = response.data;
    });
    */
    var url = window.location.pathname + window.location.hash;
    url = url.replace(/\#/g, "%23");
    $http.get('/api/getMenu?pathname=' + url + '&showtype=showtheme').then(function (response) {
        $scope.menuList = response.data;
        //遍历所有菜单，默认加载有url的第一个
        if ($scope.menuList && $scope.menuList.length > 0) {
            for (var i in $scope.menuList) {
                if ($scope.menuList[i].url && $scope.menuList[i].url.length > 1) {
                    document.getElementById(chartsFrameId).setAttribute('src', $scope.menuList[i].url);
                    break;
                } else {
                    if ($scope.menuList[i].child && $scope.menuList[i].child.length > 0) {
                        for (var j in $scope.menuList[i].child) {
                            if ($scope.menuList[i].child[j].url && $scope.menuList[i].child[j].url.length > 1) {
                                document.getElementById(chartsFrameId).setAttribute('src', $scope.menuList[i].child[j].url);
                                break;
                            }
                        }
                    }
                }
            }
        }
    });

    $scope.showChildMenu = function(index, row, menuList) {
        $scope.child_style.top = index * 28 + 'px';
    }

    $scope.switchHeader = function(e) {
        $scope.headerStatus = !$scope.headerStatus;
        $scope.headerStyle.top = $scope.headerStatus? "0px": "-70px";
        $scope.navBtnStyle.top = $scope.headerStatus? "4px": "-39px";
        $scope.toggleStyle.top = $scope.headerStatus? "20px": "-36px";
        $scope.themeStyle.top = $scope.headerStatus? "40px": "0px";
        $scope.navBtnGroup.top = $scope.headerStatus? "0px": "-40px";
        $scope.themeStyle.height = $scope.headerStatus? "calc(100% - 40px)": "100%";
        if (!$scope.headerStatus) {
            mainIframe.window.closeBtnGroup(false);
            $scope.clicked = true;
            $scope.openList();
        } else {
            mainIframe.window.closeBtnGroup(true);
        }
    }

    $scope.switchMenu = function(menuStatus) {
        if (menuStatus == 'hide') {
            $scope.clicked = true;
        } else {
            $scope.clicked = false;
        }
        $scope.hide = $timeout(function() {
            if ($scope.clicked) {
                $scope.openList();
            }
        }, 2000);
    }

    $scope.mbMenu = false;
    $scope.footerType = 'menu';
    $scope.showMBMenu = function () {
        if (!$scope.mbMenu) {
            $(".m-body").animate({top:"40px"}, 300);
            $(".m-footer").animate({bottom:"0px"}, 300);
        } else {
            $(".m-body").animate({top:"-100%"}, 300);
            $(".m-footer").animate({bottom:"-60px"}, 300);
        }
        $scope.mbMenu = !$scope.mbMenu
        $scope.$apply()
    }

    $scope.openMbPage = function (item) {
        $(".m-body").animate({top:"-100%"}, 300);
        $(".m-footer").animate({bottom:"-60px"}, 300);
        $timeout(function () {
            $scope.mbMenu = !$scope.mbMenu
            document.getElementById(chartsFrameId).setAttribute('src', item.url);
        }, 300)
    }

    $scope.switchMbBodyContent = function (btnType) {
        $scope.footerType = btnType
    }

    $timeout(function () {
        if (terminalType == 'pc' || terminalType == 'ipad') {
            $('#pcHomePage').show()
        }
        if (terminalType == 'phone') {
            $('#phoneHomePage').show()
            var el = document.getElementById('mbExtraDiv');
            el.addEventListener("touchstart", handleStartForClose, false);
            el.addEventListener("touchend", handleEndForClose, false);
            var el2 = document.getElementById('mbHeaderDiv');
            el2.addEventListener("touchstart", handleStartForOpen, false);
            el2.addEventListener("touchend", handleEndForOpen, false);
        }
    })

    var startY, endY
    function handleStartForClose(e) {
        startY = e.touches[0].pageY;
    }

    function handleEndForClose(e) {
        endY = e.changedTouches[0].pageY;
        if (startY - endY > 100 && endY > 50 && startY > 50) {
            $scope.showMBMenu()
        }
    }

    var startY2, endY2
    function handleStartForOpen(e) {
        startY2 = e.touches[0].pageY;
    }

    function handleEndForOpen(e) {
        endY2 = e.changedTouches[0].pageY;
        if (endY2 - startY2 > 100 && startY2 <= 40 && !$scope.mbMenu) {
            $scope.showMBMenu()
        }
    }

});

app.directive('resize', function ($window) {
    return function (scope) {
        var w = angular.element($window);
        scope.$watch(function () {
            return w.height();
        }, function (newValue) {
            scope.style = function () {
                return {
                    'height': (newValue) + 'px'
                };
            };
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});