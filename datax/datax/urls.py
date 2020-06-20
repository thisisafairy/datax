"""datax URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from django.conf import settings
from django.views.static import serve
from rest_framework.schemas import get_schema_view
from django.views.generic.base import RedirectView
from rest_framework_swagger.renderers import SwaggerUIRenderer, OpenAPIRenderer
schema_view = get_schema_view(title='Users API', renderer_classes=[OpenAPIRenderer, SwaggerUIRenderer])
urlpatterns = [
    # url(r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
    # url(r'^frontend/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    url(r'^docs/', schema_view, name="docs"),
    url(r'^favicon\.ico$', RedirectView.as_view(url='/frontend/image/ico/favicon.ico')),
	url(r'^admin/', admin.site.urls),
    url(r'^$', RedirectView.as_view(url='/dashboard/index')),
    url(r'^account/', include('account.urls')),
    url(r'^dashboard/', include('dashboard.urls')),
    url(r'^bi/', include('bi.urls')),
    url(r'^api/', include('api.urls')),
    url(r'^ex/', include('extra_module.urls')),
    url(r'^cost/',include('extra_module.cost_module.urls'))
]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
