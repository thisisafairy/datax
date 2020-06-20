angular.module('dataxPanelDrag', [])
    .directive('dataxPanelDrag', function() {
        return {
            // templateUrl: '/frontend/componets/multi-select/multi-select.html?v=1.02',
            restrict: 'A',
            scope: {},
            link: function(scope, element /*, attrs*/ ) {},
            controller: function($scope, $element, $http, $timeout) {
                var jqPanelObj = $($element)
                var panelDom = $($element)[0]
                var panelTitleDom = $($element).find('.drag-title')[0]
                $scope.transitionFlag = false
                $scope.marginFlag = false
                panelTitleDom.onmousedown = function(ev){
                    var yyy = panelDom.offsetLeft + 'px'
                    if (jqPanelObj.hasClass('top-transition')) {
                        jqPanelObj.removeClass('top-transition')
                        $scope.transitionFlag = true
                    }

                    if (jqPanelObj.hasClass('floating-layer-margin')) {
                        jqPanelObj.removeClass('floating-layer-margin')
                        jqPanelObj.css('left', yyy)
                        $scope.marginFlag = true
                    }

                    var oevent = ev || event;

                    var distanceX = oevent.clientX - panelDom.offsetLeft;
                    var distanceY = oevent.clientY - panelDom.offsetTop;
                    document.onmousemove = function(ev){
                        var _oevent = ev || event;
                        panelDom.style.left = _oevent.clientX - distanceX + 'px';
                        panelDom.style.top = _oevent.clientY - distanceY + 'px';
                    };
                    document.onmouseup = function(){
            　　　　　 　document.onmousemove = null;
            　　　　　 　document.onmouseup = null;
                        if ($scope.transitionFlag) {
                            jqPanelObj.addClass('top-transition')
                        }
                        document.onmouseup = null;
                　　};
                };
            }
        }
    })