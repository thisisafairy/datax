/**
 * 在浏览器大小或菜单栏宽度改变时刷新datax-wrapper-content样式
 * @author sola
 * @created 2019/05/14 17:32:59
 */
function resizeContentWrapper() {
    var cWidth = 0
    var cHeight = 0
    if (document.compatMode == "BackCompat") {
        cWidth = document.body.clientWidth;
        cHeight = document.body.clientHeight;
    } else { //document.compatMode == \"CSS1Compat\"
        cWidth = document.documentElement.clientWidth;
        cHeight = document.documentElement.clientHeight;
    }
    // 查看是否配置过侧边菜单, 如果没有, 则默认设置为mini模式
    var sidebarWidth = 195
    var sidebarType = window.localStorage['sidebarType']
    if (!sidebarType) {
        sidebarType = 'mini'
        window.localStorage['sidebarType'] = sidebarType
    }
    if (sidebarType == 'mini') {
        sidebarWidth = 50
    }
    // 设置content-wrapper大小
    var contentWrapper = document.querySelector('.datax-wrapper-content')
    contentWrapper.style.minHeight = (cHeight - 40) + 'px'
    contentWrapper.style.marginLeft = sidebarWidth + 'px'
    document.querySelector('.datax-sidebar').style.minHeight = (cHeight - 40) + 'px'
}

resizeContentWrapper()

window.onresize = function () {
    resizeContentWrapper()
}

/**
 * 菜单栏controller
 * @author sola
 * @created 2019/05/14 17:10:34
 */
var sidebarApp = angular.module('dataxSidebarApp', ['dataxUtils', 'dataxUI']);

sidebarApp.controller('dataxSidebarController', function ($scope, $compile, $http, $timeout, dom) {
    
    $scope.menuList = []
    var url = window.location.pathname + window.location.hash;
    url = url.replace(/\#/g, "%23");
    $http.get('/api/getMenu?pathname=' + url).then(function (response) {
        $scope.menuList = response.data;
        $scope.menuList.forEach(function (value, index) {
            value.is_active = false
            value.child.forEach(function (subValue) {
                subValue.is_active = false
                if (subValue.url == (window.location.pathname + window.location.hash)) {
                    subValue.is_active = true
                }
                if (subValue.url.indexOf(window.location.pathname) > -1) {
                    value.is_active = true
                }
            })
        })
    });

    $scope.subMenu = []

    $scope.showSubMenu = function (menu, ev) {
        $scope.subMenuObj = menu
        var subMenuEle = $compile(angular.element('<div class="datax-menu-children-wrapper" ng-mouseleave="closeMenu()">\
            <ul>\
                <li><i class="fa {{ subMenuObj.icon }}" style="position: absolute; left: 15px; top: 12px;"></i>{{ subMenuObj.name }}</li>\
                <li ng-repeat="item in subMenu" ng-click="toPage(item)" ng-class="{\'datax-menu-menu-active\':item.is_active}">\
                    。&nbsp;{{ item.name }}\
                </li>\
            </ul>\
        </div>'))($scope)
        if (menu.child && menu.child.length > 0) {
            getByClass('datax-menu-children-wrapper').remove()
            $scope.subMenu = menu.child
            getByEle(document.body).append(subMenuEle)
            subMenuEle[0].style['top'] = dom.offset(ev.target).top + 'px';
            subMenuEle[0].style['left'] = '50px';
            subMenuEle[0].style['opacity'] = 1;
        }
    }

    $scope.expandMenu = function (menu, ev) {
        $scope.menuList.forEach(function (value, index) {
            if (value.key == menu.key) {
                menu.is_active = !menu.is_active
            } else {
                value.is_active = false
            }
        })
    }

    $scope.closeMenu = function () {
        getByClass('datax-menu-children-wrapper').remove()
    }

    $scope.toPage = function (item) {
        if (item.url) {
            window.location.href = item.url
        }
    }
    $scope.ihomepage = function () {
        window.location.href = '/dashboard/index'
    }
})

if (!getById('dataxSidebar').scope()) {
    angular.bootstrap(document.getElementById("dataxSidebar"), ["dataxSidebarApp"]);
}

/**
 * header controller
 * @author sola
 * @created 2019/05/14 17:11:04
 */
var headerApp = angular.module('dataxHeaderApp', ['dataxUtils', 'dataxUI']);

headerApp.controller('dataxHeaderController', function ($scope, $rootScope, $element, $timeout, $window, $compile, $http, dom) {
    $scope.initSidebarType = function () {
        $scope.sidebarType = window.localStorage['sidebarType']
        if (!$scope.sidebarType) {
            $scope.sidebarType = 'mini'
            window.localStorage['sidebarType'] = $scope.sidebarType
        }
    }

    $scope.initSidebarWidth = function () {
        $scope.initSidebarType()
        getByClass('datax-body').removeClass('datax-sidebar-mini')
        if ($scope.sidebarType == 'mini') {
            getByClass('datax-body').addClass('datax-sidebar-mini')
        }
    }
    $scope.initSidebarWidth()

    $scope.switchMenu = function () {
        $scope.initSidebarType()
        getByClass('datax-body').removeClass('datax-sidebar-mini')
        if ($scope.sidebarType == 'mini') {
            window.localStorage['sidebarType'] = 'full'
        } else {
            getByClass('datax-body').addClass('datax-sidebar-mini')
            window.localStorage['sidebarType'] = 'mini'
        }
        resizeContentWrapper()
    }

})

if (!getById('dataxHeader').scope()) {
    angular.bootstrap(document.getElementById("dataxHeader"), ["dataxHeaderApp"]);
}