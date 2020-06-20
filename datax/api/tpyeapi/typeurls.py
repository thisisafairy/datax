from django.conf.urls import url, include
from api.tpyeapi import typeviews
urlpatterns = [
    url(r'^getTypeTree$', typeviews.getTypeTree),  # 模块树结构数据接口
    url(r'^getTypeList$', typeviews.getTypeList),  # 模块树结构数据接口
    url(r'^getTypeDetail/(?P<pk>\w+)$', typeviews.getTypeDetail),  # 模块详情接口
    url(r'^savetype$', typeviews.savetype),  # 模块保存接口
    url(r'^deleteType', typeviews.deleteType),  # 模块保存接口

    url(r'^getEmuTypes', typeviews.getEmuTypes),  # 模块保存接口
    url(r'^getDictParents', typeviews.getDictParents),  # 获取所有有子节点的动态枚举值
]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
