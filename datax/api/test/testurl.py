from django.conf.urls import url, include
from api.test import testviews
urlpatterns = [
    url(r'^testindex', testviews.test),
    #测试logger打印足够多的日志下是否能够重新生成文件
    url(r'^testprintlogger$', testviews.testprintlogger),
    #用于表中插入数据
    url(r'^updateSomeTablesData$', testviews.updateSomeTablesData),

    #获取datax里所有表名、字段名、字段类型
    url(r'^createDBDocument$', testviews.createDBDocument),

    # 测试的示例方法
    url(r'^testGetMethod$', testviews.testGetMethod),
    url(r'^testPostMethod$', testviews.testPostMethod),
]