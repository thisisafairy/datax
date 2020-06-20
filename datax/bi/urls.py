from django.conf.urls import url

from bi import views

urlpatterns = [
    url(r'^index/(?P<type>\w+)/(?P<pk>\w+)$', views.index),
    url(r'^homepage$',views.homepage),
    url(r'^share$',views.shareTheme),
    url(r'^mobileAppLogin$',views.mobileAppLogin),
    url(r'^remoteview/(?P<dataxtoken>\w+)$', views.remoteview),

    #获取用户订阅、访问的信息
    url(r'^getUsercollectData$',views.getUsercollectData),
    url(r'^getUserVisitLogData$',views.getUserVisitLogData),

    #更新用户访问记录
    url(r'^updateUserVisitLog$', views.updateUserVisitLog),

]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
