require.config({
    baseUrl: "/frontend",
    paths: {
        "jquery": "node_modules/admin-lte/plugins/jQuery/jquery-2.2.3.min",
        "jquery-tool":'js/jquery.tool',
        "angular": "node_modules/angular/angular.min",
        "bootstrap": "node_modules/admin-lte/bootstrap/js/bootstrap.min",
        "adminlte": "node_modules/admin-lte/dist/js/adminlte",
        "angular-ui-router": "node_modules/angular-ui-router/release/angular-ui-router.min",
        "angular-ui-router-stateEvents": "node_modules/angular-ui-router/release/stateEvents.min",
        "ui-bootstrap": "node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls",
        "data-table": "plugin/bootstrap-table/bootstrap-table.min",
        "lodash": "node_modules/lodash/lodash.min",
    },
    shim: {
        jquery: {
            exports: '$'
        },
        "jquery-tool":{
            deps: ["jquery"]
        },
        "bootstrap": {
            deps: ["jquery"]
        },
        "adminlte": {
            deps: ["jquery", "bootstrap"]
        },
        angular: {
            exports: 'angular'
        },
        "angular-ui-router": {
            deps: ["angular"]
        },
        "angular-ui-router-stateEvents": {
            deps: ["angular", "angular-ui-router"]
        },
        "data-table": {
            deps: ["jquery"]
        },
        "ui-bootstrap": {
            deps: ["angular"]
        }
    }
});

require(['jquery', 'bootstrap', 'adminlte'], function ($) {
        $('body').layout();
        function resizeloading() {
            var widowheight = $(document).height();
            var windowwidth = $(document).width();
            var silderwidth = 0;
            if ($('body').hasClass('sidebar-collapse')) {
                silderwidth = 40;
            }
            else {
                silderwidth = 200;
            }
            var height = (widowheight / 2 - 100) + 'px';
            var width = (windowwidth / 2 - 50) + 'px'
            $(".loading-progress").css({
                'left': width,
                'top': height
            });
        }
        $(window).resize(function () {
            resizeloading();
        });
        resizeloading();

     
        var theme = localStorage.getItem('theme');
        if (typeof theme == 'string') {
            var classStr = $('body').attr('class').replace(/skin-\w+/, '');
            // debugger;
            $('body').attr('class', classStr);
            if (theme == 'clean' || theme == 'theme1' || theme == 'modern') {
                $('body').addClass('skin-' + theme);
            }
            else {
                $('body').addClass('skin-glass');
            }
        }
        else {
            $('body').addClass('skin-glass');
        }
    });

require([
    'angular',
    'jquery-tool',
    'angular-ui-router',
    'angular-ui-router-stateEvents',
    'ui-bootstrap',
    'data-table',
    'lodash'
], function (angular) {
    angular.module('silderApp', [])
        .config(['$interpolateProvider', function ($interpolateProvider) {
            $interpolateProvider.startSymbol('[:');
            $interpolateProvider.endSymbol(':]');
        }])
        .controller('silderController', ['$scope', '$http', function ($scope, $http) {
            if (window.location.pathname === '/dashboard/index') {
                $(".sidebar-menu").find('li:eq(0)').addClass('active');
            }
            var url = window.location.pathname + window.location.hash;
            url = url.replace(/\#/g, "%23");
            $http.get('/api/getMenu?pathname=' + url).then(function (response) {
                $scope.menulist = response.data;
            });
        }]);
    angular.bootstrap(document.getElementById('silderApp'), ['silderApp']);
    angular.module('sidebarapp', [])
        .controller('sidebarController', function ($scope, $http, $timeout) {
            $scope.class = "";
            $scope.passstart = false;
            $scope.picstart = false;
            $scope.getimg = false;
            $scope.imgpath = '#';
            $scope.filename = "";
            $scope.inputtpye = 'password';
            $scope.passform = {
                oldpass: "",
                newpass: "",
                confirmpass: ""
            };
            $scope.theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'glass';
            $scope.changepassword = function () {
                $scope.showmore();
                $scope.picstart = false;
                $scope.passstart = true;
            };
            $scope.changepicture = function () {
                $scope.showmore();
                $scope.passstart = false;
                $scope.picstart = true;
            };
            $scope.showpass = true;
            $scope.inputtype = function (s) {
                if (s === 'text') {
                    $scope.showpass = false;
                }
                else {
                    $scope.showpass = true;
                }
                $scope.inputtpye = s;
            };
            $scope.savepass = function () {
                console.log($scope.passform);
                $http({
                    method: 'POST',
                    url: '/api/account/savepass',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    data: {
                        form: $scope.passform
                    }
                }).success(function (rs) {
                    $scope.msg = rs.msg;
                    if (rs.code == 0) {
                        $('#oldpass').focus();
                    }
                    if (rs.code == 1) {
                        $('#confirmpass').focus();
                    }
                    if (rs.code == 2) {
                        $timeout(function () {
                            window.location.href = '/account/logout';
                        }, 2000);
                    }
                });
            };
            $scope.showmore = function () {
                if (!$("#control-left").hasClass('control-more')) {
                    $("#control-left").addClass('control-more');
                }
                if (!$(".control-sidebar-bg").hasClass('control-bg-bigger')) {
                    $(".control-sidebar-bg").addClass('control-bg-bigger');
                }
            };
            $scope.upload = function () {
                $http({
                    method: 'POST',
                    url: '/api/account/uploadpicture',
                    headers: { 'Content-Type': undefined, 'X-CSRFToken': getCookie('csrftoken') },
                    data: {
                        filename: document.getElementById('picture').files[0]
                    },
                    transformRequest: function (data, headersGetter) {
                        var formData = new FormData();
                        angular.forEach(data, function (value, key) {
                            formData.append(key, value);
                        });
                        return formData;
                    }
                }).success(function (rs) {
                    if (rs.code == 1) {
                        $scope.getimg = true;
                        rs.path = '.' + rs.path;
                        $scope.imgpath = rs.path;
                        $scope.filename = rs.filename;
                    }
                });
            };
            $scope.updatepicture = function () {
                $http({
                    method: 'POST',
                    url: '/api/account/updatepicture',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    data: {
                        filename: $scope.filename
                    }
                }).success(function (rs) {
                    if (rs.code == 1) {
                        $(".userimg").attr('src', $scope.imgpath);
                        $("#control-left").removeClass('control-more');
                        $(".control-sidebar-bg").removeClass('control-bg-bigger');
                    }
                });
            };

            $scope.themechange = function () {
                var classStr = $('body').attr('class').replace(/skin-\w+/,'');
                $('body').attr('class', classStr);
                $('body').addClass('skin-' + $scope.theme);
                localStorage.setItem('theme', $scope.theme);
            };

        });

    angular.bootstrap(document.getElementById('sidebarapp'), ['sidebarapp']);


    angular.module('headapp', [])
        .controller('headController', ['$scope', '$http', function ($scope, $http) {
            $scope.picture = '#';
            $scope.username = '';
            $http.get('/api/account/info').then(function (response) {
                $scope.username = response.data.username;
                $scope.picture = response.data.picture;
            });
        }]);

    angular.bootstrap(document.getElementById('headapp'), ['headapp']);


    var isMenuOpen = localStorage.getItem('isOpen');
    if (typeof isMenuOpen === 'string' && isMenuOpen === 'true') {
        $('body').removeClass('sidebar-collapse');
    }
});
