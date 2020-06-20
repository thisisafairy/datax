from django.conf.urls import url, include
from api.olapapi import olapview
urlpatterns = [
    url(r'^getColumnBySource$', olapview.getColumnBySource),
    url(r'^getDispatch$', olapview.getDispatch),
    url(r'^removeDispatch$',olapview.removeDispatch),
    url(r'^getDispatchRow/(?P<pk>\w+)$',olapview.getDispatchRow),
    url(r'^saveDispatch$', olapview.saveDispatch),
    url(r'^previewOlap$',olapview.previewOlap),
    url(r'^previewExtOlap',olapview.previewExtOlap),
    url(r'^previewKpi$',olapview.previewKpi),
    url(r'^saveOlap$', olapview.saveOlap),
    url(r'^saveKpi$', olapview.saveKpi),
    url(r'^olapDelete$', olapview.olapDelete),  # olap删除
    url(r'^setOlapStatus$',olapview.setOlapStatus),
    url(r'^startOlapNow',olapview.startOlapNow),
    #savekpi
    url(r'^olapdetail/(?P<pk>\w+)$', olapview.olapdetail),
    url(r'^kpidetail/(?P<pk>\w+)$', olapview.kpidetail), 
    url(r'^getOlaplists$',olapview.getOlaplists), 
    url(r'^getOlapObjById$',olapview.getOlapObjById), #获取单个olap对象通过id
    url(r'^getOlapTypelists$',olapview.getOlapTypelists),
    url(r'^getKpilists$',olapview.getKpilists),

    url(r'^validatetable$',olapview.validatetable),
    url(r'^editmonitor$',olapview.editmonitor),     # 编辑业务规则
    url(r'^getMonitorList$',olapview.getMonitorList),
    url(r'^saveMonitorType', olapview.saveMonitorType),
    url(r'^saveMonitor', olapview.saveMonitor),
    url(r'^monitorDelete$', olapview.monitorDelete),  # 元数据删除
    url(r'^getMonitorType', olapview.getMonitorType),
    url(r'^getMonitor/(?P<pk>\w+)$', olapview.getMonitor),
    url(r'^editOdbcOlap$', olapview.editOdbcOlap),#edit odbc olap
    #表格组件
    # url(r'^getTableStructById$', olapview.getTableStructById),#edit odbc olap
    url(r'^getTableDataByOlapId$', olapview.getTableDataByOlapId),#edit odbc olap



    url(r'^getDispatchLogs$', olapview.getDispatchLogs),

]