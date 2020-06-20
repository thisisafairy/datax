
$.ajaxSetup({
	//data: {csrfmiddlewaretoken: '{{ csrf_token }}' },jnpedit屏蔽 会影响api post提交
	beforeSend: function (xhr) {
		xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));//jnp add post需要
	}
});
function getCookie(name) {
	var cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = jQuery.trim(cookies[i]);
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

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

function showLoading() {
	$(".loading-content").removeClass('hide');
}
function hideLoading() {
	$(".loading-content").addClass('hide');
}

(function () {

	var theme = localStorage.getItem('theme');
	if (typeof theme == 'string') {
		var classStr = $('body').attr('class').replace(/skin-\w+/, '');
		// debugger;
		$('body').attr('class', classStr);
		if (theme == 'clean' || theme == 'theme1' || theme == 'modern') {
			$('body').addClass('skin-' + theme);
		}
		else {
			$('body').addClass('skin-clean');
		}

	}
	else {
		$('body').addClass('skin-clean');
	}
})()

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
		$scope.theme = localStorage.getItem('theme') ? localStorage.getItem('theme') : 'clean';
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
		$scope.savebutdisable=true;
		$scope.upload = function () {
			if(typeof FileReader != 'undefined'){
			   var file = document.getElementById("picture").files[0];
				 if((file.type).indexOf("image/")==-1){
				 	alert("请上传图片（格式BMP、JPG、JPEG、PNG、GIF等）!");
				 	return;
				 }
			}else{
			   	var fileName=document.getElementById("picture").value;
			    var suffixIndex=fileName.lastIndexOf(".");
			    var suffix=fileName.substring(suffixIndex+1).toUpperCase();
			    if(suffix!="BMP"&&suffix!="JPG"&&suffix!="JPEG"&&suffix!="PNG"&&suffix!="GIF"){
			   		alert("请上传图片（格式BMP、JPG、JPEG、PNG、GIF等）!");
			   		return;
			   	}
			}
			$scope.savebutdisable=false;
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
	.controller('headController', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
		$scope.picture = '#';
		$scope.username = '';
		$scope.nickname = '';
		$scope.mailtitle = '';
		$scope.num = '';
		$http.get('/api/account/info').then(function (response) {
			$scope.username = response.data.username;
			$scope.nickname = response.data.nickname;//显示昵称而不是账户名
			$scope.picture = response.data.picture;
			// $scope.objs = response.data.objs;
			$scope.num = response.data.num;
		});
		$rootScope.collapse = true;
		$rootScope.data = {
			current: "1"
		};
		$rootScope.actions =
			{
				setCurrent: function (param) {
					$rootScope.data.current = param;

                }
			}
		$scope.stop=function(){
    		event.stopPropagation();
		};
		$scope.navstyle = function () {
			//sidebar-collapse
			var bodyClass = $("body").attr('class');
			if (bodyClass.indexOf('sidebar-collapse') >= 0) {
				$rootScope.collapse = false;
			}
			else {
				$rootScope.collapse = true;
			}
		};


	}]);

angular.bootstrap(document.getElementById('headapp'), ['headapp']);


var isMenuOpen = localStorage.getItem('isOpen');
if (typeof isMenuOpen === 'string' && isMenuOpen === 'true') {
	$('body').removeClass('sidebar-collapse');
}

