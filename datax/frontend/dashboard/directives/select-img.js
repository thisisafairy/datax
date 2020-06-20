app.directive('userImgs', function () {
    return {
        restrict: 'E',
        templateUrl: '/frontend/dashboard/directives/select-img.html',
        replace: true,
        scope: {
            imgs: '=', //存放图片的文件夹
            imgModel: '=',//选中事件
            refreshMethod: '&'//选中事件
        },
        link: function (scope, element, attrs, controller) {

        },
        controller: function ($scope, $http, $element, $timeout) {
            $scope.imgSelect = function (imgPath) {
                $scope.imgModel = imgPath;
                $scope.refreshMethod();
            };

            $scope.delImg = function (index) {
                $http.get(encodeURI('/api/dash/delUserImg?imgPath=' + $scope.imgs[index])).then(function (rs) {
                    if (rs.data.status == 'success') {
                        $scope.imgs.splice(index, 1);
                    }
                });
            };
        }
    };
});