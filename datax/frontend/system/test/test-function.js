(function () {
    "use strict";
    
    var app = angular.module('testPage', ['ui.bootstrap', 'ngMaterial', 'dataxUtils', 'dataxUI']);

    app.controller('testPageController', function ($scope, dxHttp, $mdDialog, $timeout, $http, $uibModal, $interval, $window, $document) {
        $scope.title = '标题'
        $scope.vegetables = [{
            'name': 'Corn'
        }, {
            'name': 'Onions'
        }, {
            'name': 'Kale'
        }, {
            'name': 'Arugula'
        }, {
            'name': 'Peas'
        }, {
            'name': 'Zucchini'
        }];
        $scope.searchTerm;
        $scope.clearSearchTerm = function () {
            $scope.searchTerm = '';
        };

        $scope.changeSelect = function (value) {
            console.log(value)
            console.log('$scope.selectedVegetables', $scope.selectedVegetables)
            console.log('$scope.selectedVegetables2', $scope.selectedVegetables2)
        }

        $scope.test1Method = function () {
            console.log('test1Method')
            $scope.selectedVegetables = 'Corn'
        }
        $scope.dxSelectValue = [0, 5]
        $scope.users = [1,2,4,5,7,8,9,'sad','asd']
        $scope.isCheck = false
        $scope.checkList = [{
            'name': 'zhangsan',
            'code': '0',
            'dept': '人事'
        }, {
            'name': 'zhangsan1',
            'code': '1',
            'dept': '人事'
        }, {
            'name': 'zhangsan2',
            'code': '2',
            'dept': '财务'
        }, {
            'name': 'zhangsan3',
            'code': '3',
            'dept': '人事'
        }, {
            'name': 'zhangsan4',
            'code': '4',
            'dept': '财务'
        }, {
            'name': 'zhangsan5',
            'code': '5',
            'dept': '秘书'
        }, {
            'name': 'zhangsan6',
            'code': '6',
            'dept': '销售'
        }, {
            'name': 'zhangsan7',
            'code': '7',
            'dept': '销售'
        }, {
            'name': 'zhangsan8',
            'code': '8',
            'dept': '销售'
        }, {
            'name': 'zhangsan9',
            'code': '9',
            'dept': '销售'
        }, ]
        console.log(_.groupBy($scope.checkList, 'dept'))
        $scope.radioModel = 2333
        $scope.checkResultList = angular.copy($scope.checkList)
        $scope.test2Method = function () {
            console.log('$scope.selectedVegetables', $scope.selectedVegetables)
        }
        
        $scope.changeTransfer = function(obj) {
            console.log('changeTransfer', obj)
        }

        // region 测试方法
        
        $scope.columns = [{
                title: 'Full Name',
                width: 100,
                dataIndex: 'name',
                key: 'name',
                fixed: 'left',
            },
            {
                title: 'Age',
                width: 100,
                dataIndex: 'age',
                key: 'age',
                fixed: 'left',
            },
            {
                title: 'Column 1',
                dataIndex: 'address',
                key: '1',
                width: 150,
            },
            {
                title: 'Column 2',
                dataIndex: 'address',
                key: '2',
                width: 150,
            },
            {
                title: 'Column 3',
                dataIndex: 'address',
                key: '3',
                width: 150,
            },
            {
                title: 'Column 4',
                dataIndex: 'address',
                key: '4',
                width: 150,
            },
            {
                title: 'Column 5',
                dataIndex: 'address',
                key: '5',
                width: 150,
            },
            {
                title: 'Column 6',
                dataIndex: 'address',
                key: '6',
                width: 150,
            },
            {
                title: 'Column 7',
                dataIndex: 'address',
                key: '7',
                width: 150,
            },
            {
                title: 'Column 8',
                dataIndex: 'address',
                key: '8'
            }
        ];

        $scope.data = [];
        for (let i = 0; i < 100; i++) {
            $scope.data.push({
                name: `Edrward ${i}`,
                age: 32,
                address: `London Park no. ${i}`,
                address: `London Park no. ${i}`,
                address: `London Park no. ${i}`,
                address: `London Park no. ${i}`,
                address: `London Park no. ${i}`,
                address: `London Park no. ${i}`,
                address: `London Park no. ${i}`,
                address: `London Park no. ${i}`,
            });
        }

        /* #region   */
        $scope.testGetMethod = function (ev) {
            dxHttp.getData("/api/test/testGetMethod?parameter1=canshu1", $mdDialog).then(function (rs) {
                if (rs.data.status == 'success') {
                    console.log(rs.data.data)
                }
            })
        }

        $scope.testPostMethod = function (ev) {
            dxHttp.postData("/api/test/testPostMethod", {
                parameter1: 'canshu1',
                parameter2: 'canshu2'
            }, $mdDialog).then(function (rs) {
                if (rs.data.status == 'success') {
                    console.log(rs.data.data)
                }
            })
        }

        $scope.showDialog = function () {
            $mdDialog.show({
                contentElement: '#myDialog',
                clickOutsideToClose: true
            });
        }

        /* #endregion */
        // #endregion 

        $timeout(function () {
            // new PerfectScrollbar('.app-main-content', {
            //     'suppressScrollX': true
            // })
        })

    })


})()