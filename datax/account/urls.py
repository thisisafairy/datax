from django.conf.urls import url
from account import views

urlpatterns = [
    url(r'^homepage/login$', views.homePageLogin, name='homePageLogin'),
    url(r'^homepage/logout$', views.homePageLogout, name='homePageLogout'),
    url(r'^login$', views.dologin, name='login'),
    url(r'^logout$', views.login_out, name='logout'),
    url(r'^singup$', views.singup, name='singup'),
    url(r'^grouplist$', views.grouplist, name='grouplist'),
    url(r'^test$', views.test, name='test'),
]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
