var app = angular.module('dashboard', ['dataxUtils', 'dataxUI']);

app.controller('dashboardController', function ($rootScope, $scope, $timeout, $http) {

    $scope.scenes = [];
    $rootScope.itemStyle = {
        'width': '300px'
    };
    $scope.tags = [];
    $scope.selected = {
        'tags': []
    }
    $scope.curPage = 1;
    $scope.pageSize = 20;
    $scope.loadCount = 0;
    $scope.total = 0;
    $scope.filterConfig = {
        'name': '',
        'kind': '',
        'tags': []
    };

    $scope.slides = [];

    // region 获取场景数据

    $scope.searchScenes = function () {
        $scope.scenes = [];
        $scope.curPage = 1;
        $scope.loadCount = 0;
        $scope.getScenes();
    };

    $scope.getScenes = function () {
        $scope.filterConfig['tags'] = $scope.selected.tags;
        $http({
            method: 'POST',
            url: '/api/dash/getSceneList',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: {
                page: $scope.curPage,
                limit: $scope.pageSize,
                filterConfig: $scope.filterConfig
            }
        }).then(function (rs) {
            if (rs.data.status == "success") {
                $scope.pageSize = 10;
                $scope.curPage = $scope.curPage + 1;
                $scope.total = rs.total;
                $scope.loadCount = $scope.loadCount + rs.data.rows.length;
                rs.data.rows.forEach(function (value, index, array) {
                    if (value['basicconfig'] && value['basicconfig'] && value['basicconfig']['imgUrl']) {
                        if (value['basicconfig']['imgUrl'].indexOf('.') == 0) {
                            value['imgUrl'] = value['basicconfig']['imgUrl'].substr(1, value['basicconfig']['imgUrl'].length);
                            $scope.slides.push({
                                image: value['imgUrl'],
                                text: value['name'],
                                id: value['id']
                            });
                        } else {
                            value['imgUrl'] = value['basicconfig']['imgUrl'];
                        }
                    } else {
                        value['imgUrl'] = '';
                    }
                    if (value['keywords'] && value['keywords'].length > 0) {
                        value['tags'] = (value['keywords'].replace(/，/ig, ',')).split(',');
                    } else {
                        value['tags'] = [];
                    }
                    $scope.scenes.push(value);
                });
            }
        });
    };

    $scope.searchScenes();

    $scope.previewScene = function (item) {
        if (item && item.id) {
            window.open('/bi/index/scene/' + item.id)
        }
    }

    // endregion

    $scope.removeRow = function (item) {
        if (!confirm('您确认要删除吗?')) {
            return;
        }
        $.ajax({
            url: '/api/delscene/',
            type: 'get',
            data: {
                id: item.id
            }
        }).then(function () {
            for (var i = 0; i < $scope.scenes.length; i++) {
                if ($scope.scenes[i].id == item.id) {
                    $scope.scenes.splice(i, 1);
                    $scope.$apply();
                    break;
                }
            }
            if ($scope.scenes.length < 1) {
                $scope.pageSize = 20;
                $scope.searchScenes();
            }
        });
    };

    /* #region  获取标签过滤器数据 */
    $http.get('/api/dash/statisticalTags?table=dashboard_scenes&col=keywords').then(function (rs) {
        $scope.tags = rs.data.tags;
    });
    /* #endregion */

    /* #region 名称过滤 */
    $scope.changeName = function () {
        var tempTag = $scope.filterConfig['name'];
        $timeout(function () {
            if (tempTag == $scope.filterConfig['name']) {
                $scope.pageSize = 20;
                $scope.searchScenes();
            }
        }, 1000);
    };
    /* #endregion */

    // 标签过滤
    $scope.tagsChange = function () {
        $scope.pageSize = 20;
        $scope.searchScenes();
    };

    $scope.updateScenes = function (scenes) {
        window.location = '/dashboard/newboarddesign?scenesId=' + scenes['id'];
    };

    $scope.loadMore = function () {
        if ($scope.loadCount < $scope.total) {
            $scope.getScenes();
        }
    }

});

app.directive('whenScrolled', function () {
    return function (scope, elm, attr) {
        // 内层DIV的滚动加载
        var raw = elm[0];
        elm.bind('scroll', function () {
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attr.whenScrolled);
            };
        });
    };
});

app.directive('resize', function ($rootScope, $window) {
    return function (scope) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'h': w.height(),
                'w': w.width()
            };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            scope.style = function () {
                return {
                    'height': (newValue.h - 50) + 'px'
                };
            };
            var rowWidth = $('.card-content').width();
            var itemCount = parseInt(rowWidth / 320);
            $rootScope.itemStyle['width'] = (parseInt(rowWidth / itemCount) - 25) + 'px';
        }, true);
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});

app.filter('dateFtt', function () { //可以注入依赖
    return function (text) {
        if (text && text.length > 0) {
            return dateFtt("yyyy-MM-dd", new Date(text));
        } else {
            return text;
        }
    }
});