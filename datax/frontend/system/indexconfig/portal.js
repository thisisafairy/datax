

var app = angular.module('portalApp',['ui.bootstrap', 'ngDraggable', 'groupSelect', 'multiSelect']);


(function() {
    'use strict';

    function portalDesign($rootScope, $scope, $http, $window, $timeout) {
        var vm = $scope
        $rootScope.screenWidth = $window.innerWidth
        vm.theme = portalStyle.default[0]
        vm.collections = [
            // {'name': '收藏的功能'}, {'name': '收藏的功能'}, {'name': '收藏的功能'},
            // {'name': '收藏的功能'}, {'name': '收藏的功能'}, {'name': '收藏的功能'},
            // {'name': '收藏的功能'}, {'name': '收藏的功能'}, {'name': '收藏的功能'},
        ]

        vm.posts = [
            // {'title': '系统公告1', 'text': '什么都没有啊'},
            // {'title': '系统公告2', 'text': '什么都没有啊 什么都没有啊'},
            // {'title': '系统公告3', 'text': '什么都没有啊 什么都没有啊 什么都没有啊'},
            // {'title': '系统公告4', 'text': '什么都没有啊 什么都没有啊 什么都没有啊 什么都没有啊'},
            // {'title': '系统公告5', 'text': '什么都没有啊 什么都没有啊 什么都没有啊 什么都没有啊 什么都没有啊'},
        ]


        vm.selectSceneUrl=''

        var url = window.location.pathname + window.location.hash;
        url = url.replace(/\#/g, "%23");
        vm.searchArr = []
        vm.menus = []
        $http.get('/api/getMenu?pathname=' + url + '&showtype=showtheme').then(function (response) {
            vm.menus = response.data.filter(function (value, index) {
                if (value.child && value.child.length > 0) {
                    value.child.forEach(function (item) {
                        item['group'] = value.name
                        item['hide'] = false
                        item['checked'] = false
                        vm.searchArr.push(item)
                    })
                    return true
                }
            })
            $rootScope.initPortalMenu()
        });
        
        vm.portalMenu = []
        $rootScope.initPortalMenu = function () {
            if ($rootScope.screenWidth > 20 && vm.menus && vm.menus.length > 0) {
                vm.menuListCount = (($rootScope.screenWidth - 20) / 320).toFixed(0)
                if (vm.menuListCount < 1) {
                    vm.menuListCount = 1
                } else if (vm.menuListCount > 6 ) {
                    vm.menuListCount = 6
                }
                vm.portalMenu = []
                for (var i = 0; i < vm.menuListCount; i++) {
                    vm.portalMenu.push({
                        'style': {'width': ((($rootScope.screenWidth - 20) / vm.menuListCount).toFixed(0) - 5) + 'px'},
                        'data': []
                    })
                }
                // vm.portalMenu.forEach(function (value, index) {
                //     value['style']['width'] = ($rootScope.screenWidth % vm.menuListCount) + 'px'
                //     value['count'] = index
                //     value['data'] = []
                // })
                var _tempCount = 0
                vm.menus.forEach(function (value, index) {
                    if (_tempCount < vm.menuListCount) {
                        vm.portalMenu[_tempCount]['data'].push(value)
                        _tempCount = _tempCount + 1
                    } else {
                        _tempCount = 0
                    }
                })
                console.log(vm.portalMenu)
            }
        }

        //显示thumbnail
        $scope.showThumbnail = function (currItem) {
            currItem.ifShowThumbnail = '1';
        };

        //删除thumbnail
        $scope.deleteThumbnail = function (currItem) {
            currItem.ifShowThumbnail = '0';
        };

        //获取用户收藏的信息
        var collectDataPage = 1;
        var collectDataPageSize = 5;
        $http.get('/bi/getUsercollectData?collectDataPage=' + collectDataPage + '&collectDataPageSize=' + collectDataPageSize).then(function (response) {
            if (response.data.status == "success") {
                vm.collections = response.data.data;
                vm.total = response.data.total;
            } else {
                alert(response.data);
            }
        });

        //获取用户访问的信息
        var visitLogDataPage = 1;
        var visitLogDataPageSize = 5;
        $http.get('/bi/getUserVisitLogData?type=time&visitLogDataPage=' + visitLogDataPage + '&visitLogDataPageSize=' + visitLogDataPageSize).then(function (response) {
            if (response.data.status == "success") {
                vm.posts = response.data.data;
                var total = response.data.total;
            } else {
                alert(response.data);
            }
        });

        //获取用户访问的信息
        var visitLogDataCountPage = 1;
        var visitLogDataCountPageSize = 5;
        $http.get('/bi/getUserVisitLogData?type=count&visitLogDataPage=' + visitLogDataCountPage + '&visitLogDataPageSize=' + visitLogDataCountPageSize).then(function (response) {
            if (response.data.status == "success") {
                vm.scenesVisitCounts = response.data.data;
                var total = response.data.total;
            } else {
                alert(response.data);
            }
        });
        vm.switchPageContent = function (type) {
            if (type == 'menu') {
                $('.portal-content').animate({'left': '-100%'}, 300, function () {
                    // $('.portal-content').css('left', '100%')
                })
                // document.querySelector('.menu-content').style.width = '100%'
                $('.menu-content').animate({'left': '0'}, 300)
                $('.switch-menu').hide()
                $('.switch-content').show()
            } else if (type == 'content') {
                // document.querySelector('.menu-content').style.width = '0'
                $('.menu-content').animate({'left': '100%'}, 300)
                $('.portal-content').animate({'left': '0'}, 300)
                $('.switch-menu').show()
                $('.switch-content').hide()
            }
        }

        vm.switchMenu = function () {
            // 展开菜单
            var _menuDiv = $('.portal-menu')
            if (_menuDiv.hasClass('menu-collapse')) {
                _menuDiv.removeClass('menu-collapse').addClass('menu-expand')
                $('.menu-container').animate({'left': 0}, 100)

            // 关闭菜单
            } else {
                _menuDiv.removeClass('menu-expand').addClass('menu-collapse')
                $('.menu-container').animate({'left': -400}, 100)
            }
        }

        vm.subList = []

        vm.expandSubMenu = function ($event, item) {
            var _ele = $($event.target)
            var _subEle = $('.menu-sub-list-container')
            var _eleTop = _ele.offset().top
            if (item.child && item.child.length > 0) {
                vm.subList = item.child
            }
            _subEle.css('top', _eleTop-62)
            _subEle.show()
        }

        vm.collapseSubMenu = function ($event, speed, str) {
            // $('.menu-sub-list-container').css('top', ($('.menu-sub-list-container').height() * -1) - 80)
        }

        vm.openUrl = function (item) {
            var _url = ''
            if (item) {
                _url = '/bi/index/scene/' + item.id
            } else {
                _url = vm.selectSceneUrl
            }
            var _item = {
                'url': _url
            }
            vm.toPage(_item)
        }
        
        vm.toPage = function (item) {
            window.open(item.url)
        }
        
        $timeout(function () {
            $('.menu-content').show()
            $('#portalCalender').fullCalendar({

            })
            var _portalScrollbar = new PerfectScrollbar('.portal-content');
        })

    }

    app.controller('portalController', portalDesign);

    app.directive('resize', function ($window, $rootScope) {
        return function (scope) {
            var w = angular.element($window)
            scope.getWindowDimensions = function () {
                return { 'h': w.height(), 'w': w.width() }
            };
            scope.$watch(scope.getWindowDimensions, function (newValue) {
                scope.windowHeight = newValue.h
                scope.windowWidth = newValue.w
                $rootScope.screenWidth = newValue.w
                $rootScope.initPortalMenu()
                var width = newValue.w
                if (width < 1366) {
                    width = 1366
                    scope.style = function () {
                        return {
                            'height': newValue.h + 'px',
                            'width': '1366px'
                        };
                    };
                    scope.contentStyle = function () {
                        
                    }
                } else {
                    scope.style = function () {
                        return {
                            'height': newValue.h + 'px'
                        };
                    };
                }

            }, true);
            w.bind('resize', function () {
                scope.$apply();
            });
        };
    });

    $(document).bind("click",function(e){
        var target = $(e.target);
        if(target.closest(".portal-menu").length === 0){
            $('.menu-sub-list-container').hide()
            $('.portal-menu').removeClass('menu-expand').addClass('menu-collapse')
            $('.menu-container').animate({'left': -400}, 100)
        }　
    })

})();