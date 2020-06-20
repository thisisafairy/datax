from django.conf.urls import url

from extra_module import views
from extra_module import router

urlpatterns = [
    # pages
    url(r'^testpage$', router.testpage),

    # methods
    url(r'^testGet', views.testGetMethod),
    url(r'^saveChangedData', views.saveChangedData),
    url(r'^saveorder', views.saveorder),
    url(r'^deleteorder', views.deleteorder),
    url(r'^saveFinanceOrder', views.saveFinanceOrder),
    url(r'^deleteFinanceOrder', views.deleteFinanceOrder),

    # 订单数据采集测试
    url(r'^datainput$', views.datainput, name='datainput'),
    url(r'^orderlist', views.getorderlist),
    url(r'^getcustomer', views.getcustomer),

    url(r'^geteditdata', views.geteditdata),
    url(r'^updatedata', views.updatedata),
    url(r'^exportorderexcel',views.exportorderexcel),       # 订单excel导出

    # 财务数据采集
    url(r'^financeinput$', views.financeinput, name='datainput'),
    url(r'^financelist', views.getfinancelist),

    #坏账上传
    url(r'^uploadBadDebt', views.uploadBadDebt),
    #产能大局
    url(r'^fullreport', views.fullreport),
    url(r'^getfullreportlist', views.fullreportlist),
    url(r'^savefullreport', views.savefullreport),
    url(r'^deletefullreport', views.deletefullreport),

    # 待处理库存汇报
    url(r'^stockpreport', views.stockpreport),
    url(r'^getstockpreportlist', views.stockpreportlist),
    url(r'^savestockpreport', views.savestockpreport),
    url(r'^deletestockpreport', views.deletestockpreport),

    # 出货预测
    url(r'^planreport', views.planreport),
    url(r'^getplanreportlist', views.stockpreportlist),
    url(r'^saveplanreport', views.savestockpreport)


]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()