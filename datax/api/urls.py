from django.conf.urls import url, include
from rest_framework import routers
from api import views
from api.mainapi import menuview, portalmenuview
from api.sourceapi import sourceview
from api.accountapi import accountview
from api.olapapi import olapview
from api.dashboardapi import dashboardviews
router = routers.DefaultRouter()
# router.register(r'users', views.UserViewSet)
# router.register(r'groups', views.GroupViewSet)
# router.register(r'userextension', views.UserExtensionViewSet)

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^getgroup/$', views.getgrouplist),  #获取组信息
    url(r'^setgroup/$', views.setgroup),  #设置组信息
    url(r'^delgroup/$', views.delgroup),  #删除组信息
    url(r'^getgroupmodel/$', views.getgroupmodel),  #获取组信息from model
    url(r'^getgroupuser/$', views.getgroupuser),  #获取组用户信息
    url(r'^setgroupuser/$', views.setgroupuser),  #设置组用户信息
    url(r'^setgrouppermission/$', views.setgrouppermission),  #设置组权限信息
    url(r'^getgrouppermission/$', views.getgrouppermission),  #获取组权限信息
    url(r'^setuserpermission/$', views.setuserpermission),  #设置用户权限信息
    url(r'^getuserpermission/$', views.getuserpermission),  #获取用户权限信息
    url(r'^getAllUser/$', views.getAllUser),  #获取所有用户信息
    url(r'^userextension/$', views.UserExtensionList),  #用户数据接口
    url(r'^api-auth/',
        include('rest_framework.urls', namespace='rest_framework')),
    url(r'^getMenu$', menuview.getAuthMenu),  # 模块初始化数据接口
    url(r'^getMenutree', menuview.getMenuTree),  # 模块树结构数据接口
    url(r'^getMenuDetail$', menuview.getMenuDetail),  # 模块详情接口
    url(r'^saveMenu$', menuview.saveMenu),  #模块保存接口

    url(r'^getProtalMenutree', portalmenuview.getProtalMenuTree),  # 获取所有门户菜单信息
    url(r'^getPortalMenuDetail$', portalmenuview.getPortalMenuDetail),  # 模块详情接口
    url(r'^savePortalMenu$', portalmenuview.savePortalMenu),  # 门户菜单保存接口
    url(r'^getPortalTree', portalmenuview.getPortalTree),  # 获取门户菜单树
    url(r'^setMenuusers', portalmenuview.setMenuusers),  # 获取门户菜单树
    url(r'^setMenuGroups', portalmenuview.setMenuGroups),  #


    #数据管理
    url(r'^source/', include('api.sourceapi.sourceurl')),
    #OLAP
    url(r'^olap/', include('api.olapapi.olapurl')),
    url(r'^dash/', include('api.dashboardapi.dashurl')),
    #dashboard接口
    url(r'^account/', include('api.accountapi.accounturl')),
    url(r'^accountview$', accountview.getAccount),
    url(r'^setcharts/$', dashboardviews.setcharts),  #设置图表信息
    url(r'^getcharts/$', dashboardviews.getcharts),  #获取图表信息
    url(r'^getChartsTypelists$', dashboardviews.getChartsTypelists),  #获取图表信息
    url(r'^getAllChartsbgConf$', dashboardviews.getAllChartsbgConf),  #获图表背景配置信息
    url(r'^getAllcharts/$', dashboardviews.getAllcharts),  #获取图表信息
    url(r'^getchartsper/$', dashboardviews.getchartsper),  #获取有权限的图表信息
    url(r'^delcharts/$', dashboardviews.delcharts),  #删除图表信息
    url(r'^getchart/(?P<pk>\w+)$$', dashboardviews.getchartRow),  #根据索引获取
    url(r'^setscenes/$', dashboardviews.setscenes),  #设置场景信息
    url(r'^getscenes/$', dashboardviews.getsenes),  #获取场景信息
    url(r'^getThemeTypelists$', dashboardviews.getThemeTypelists),  #获取场景类型信息
    url(r'^getscene/(?P<pk>\w+)$$', dashboardviews.getsenceRow),  #根据索引获取
    url(r'^delscene/$', dashboardviews.delscenes),  #删除场景信息
    #业务类型
    url(r'^type/', include('api.tpyeapi.typeurls')),
    url(r'^test/', include('api.test.testurl')),
]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
