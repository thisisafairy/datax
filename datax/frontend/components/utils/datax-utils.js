(function () {
    "use strict";
    angular.module('dataxUtils', [])
        /* #region  通用访问后端api的方法 */
        .service('dxHttp', function ($http, $q) {
            this.getData = function (url) {
                var getData = $q.defer();
                $http.get(url).then(function (response) {
                    if (response.data.status && response.data.status == 'failure') {
                        dxAlert('错误:' + response.data.data, 'error')
                    }
                    getData.resolve(response);
                }, function (error) {
                    dxAlert('服务器内部错误，请联系管理员！', 'error')
                    getData.reject(error);
                })
                return getData.promise;
            }

            this.postData = function (url, parameter) {
                var postData = $q.defer();
                $http.post(url, parameter, {
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Content-Type': 'application/json'
                    }
                }).then(function (response) {
                    if (response.data.status && response.data.status == 'failure') {
                        dxAlert('错误:' + response.data.data, 'error')
                    }
                    postData.resolve(response);
                }, function (error) {
                    dxAlert('服务器内部错误，请联系管理员！', 'error')
                    postData.reject(error);
                })
                return postData.promise;
            }
        })
        /* #endregion */
        /* #region  类型验证函数 */
        .factory('reg', function () {
            return {
                isNumber: function (val) {
                    var reg = /^\d*$/;
                    return reg.test(val);
                }
            }
        })
        /* #endregion */
        /* #region 日历计算 */
        .factory('dxCalendar', function () {
            return {
                yearsOfDecade: function (year) {
                    var startYear = Number((year + '').substring(0, 3) + 0) - 1
                    var yearOfDecade = _.times(4, _.stubArray)
                    var yearCount = 0
                    yearOfDecade.forEach(function (value) {
                        for (var i = 0; i < 3; i++) {
                            var _value = {
                                "year": startYear + yearCount
                            }
                            if (yearCount == 0) {
                                _value["last"] = true
                            }
                            if (yearCount == 11) {
                                _value["next"] = true
                            }
                            value.push(_value)
                            yearCount += 1
                        }
                    })
                    return yearOfDecade
                },
                daysOfMonth: function (dateObj) {
                    var vm = {}
                    vm.calendarArr = []
                    for (var i = 0; i < 6; i++) {
                        vm.calendarArr.push(_.times(7, _.stubArray))
                    }
                    vm.currentMonth = moment(dateObj)
                    vm.lastMonth = moment(dateObj).subtract(1, 'month')
                    vm.nextMonth = moment(dateObj).subtract(-1, 'month')
                    //获取当月多少天
                    vm.daysInMonth = vm.currentMonth.daysInMonth()
                    //获取当月第一天是星期几
                    vm.weekOfMonthFirstDay = vm.currentMonth.date(1).isoWeekday()
                    //获取上月多少天
                    vm.daysInLastMonth = vm.lastMonth.daysInMonth()
                    vm.lastMonthIndex = 0
                    vm.startIndedx = 1
                    vm.nextMonthIndex = 1
                    vm.calendarArr.forEach(function (week, weekIndex) {
                        week.forEach(function (day, dayIndex) {
                            if (vm.lastMonthIndex < (vm.weekOfMonthFirstDay - 1)) {
                                day.push({
                                    "week": dayIndex + 1,
                                    "day": (vm.daysInLastMonth - (vm.weekOfMonthFirstDay - dayIndex - 2)),
                                    "month": (vm.lastMonth.month() + 1),
                                    "year": vm.lastMonth.year(),
                                    "isLastmonth": true
                                })
                                vm.lastMonthIndex += 1
                            } else {
                                if (vm.startIndedx <= vm.daysInMonth) {
                                    day.push({
                                        "week": dayIndex + 1,
                                        "day": vm.startIndedx,
                                        "month": (vm.currentMonth.month() + 1),
                                        "year": vm.currentMonth.year()
                                    })
                                } else {
                                    day.push({
                                        "week": dayIndex + 1,
                                        "day": vm.nextMonthIndex,
                                        "month": (vm.nextMonth.month() + 1),
                                        "year": vm.nextMonth.year(),
                                        "isNextmonth": true
                                    })
                                    vm.nextMonthIndex += 1
                                }
                                vm.startIndedx += 1
                            }
                        })
                    })
                    return vm.calendarArr
                }
            }
        })
        /* #endregion */
        .factory('dom', function () {
            return {
                /* #region  计算html元素的位置和高宽 */
                offset: function (ele) {
                    var box = {
                            top: 0,
                            left: 0
                        },
                        doc = ele && ele.ownerDocument;
                    if (!doc)
                        return;
                    if (typeof ele.getBoundingClientRect !== "undefined") {
                        box = ele.getBoundingClientRect();
                    }
                    return {
                        top: box.top + (window.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop) - (doc.documentElement.clientTop || 0),
                        left: box.left + (window.pageXOffset || doc.documentElement.scrollLeft || doc.body.scrollLeft) - (doc.documentElement.clientLeft || 0),
                        offsetWidth: ele.offsetWidth || box.right - box.left,
                        offsetHeight: ele.offsetHeight || box.bottom - box.top,
                    }
                },
                /* #endregion */
                /* #region  计算 */
                calcPosition: function (ele, container, placement) {
                    var _eleOffset = this.offset(ele),
                        _containerOffset = this.offset(container);
                    console.log(_eleOffset.top, _containerOffset.top);
                    return {
                        "left": (_eleOffset.left - _containerOffset.left) + 'px',
                        "top": (_eleOffset.top - _containerOffset.top + _eleOffset.offsetHeight) + 'px'
                    }
                },
                /* #endregion */
                /* #region  弹出组件的背景遮罩 */
                openOverlayBackdrop: function (param, removeObjs) {
                    var overlayBackdrop = document.createElement("div")
                    overlayBackdrop.className = 'datax-overlay-backdrop'
                    document.body.appendChild(overlayBackdrop)
                    overlayBackdrop.addEventListener('click', function () {
                        document.body.removeChild(overlayBackdrop)
                        removeObjs.forEach(function (item) {
                            item.remove()
                        })
                    })
                }
                /* #endregion */
            }
        })
        /* #region  格式化html文本的过滤器 */
        .filter('formatText', function () {
            return function (text, type) {
                try {
                    if (type && type == 'finance' && angular.isNumber(text) && (text > 100 || text < -100)) {
                        return financeFormat(text)
                    } else if (type && type == 'date' && isNotNull(text)) {
                        if (typeof text == 'string') {
                            return moment(new Date(text)).format('YYYY-MM-DD')
                        } else {
                            return moment(text).format('YYYY-MM-DD')
                        }
                    } else if (type && type == 'datetime' && isNotNull(text)) {
                        if (typeof text == 'string') {
                            return moment(new Date(text)).format('YYYY-MM-DD HH:mm')
                        } else {
                            return moment(text).format('YYYY-MM-DD HH:mm')
                        }
                    } else {
                        return text
                    }
                } catch (err) {
                    return text
                }
            }
        })
    /* #endregion */
})()