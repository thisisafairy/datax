from django.conf.urls import url

from dashboard import views, indexviews, dataeditview, testview

urlpatterns = [
    url(r'^index$', views.index),
    #数据导入start
    url(r'^dataIndex$', views.dataIndex),
    url(r'^dataInsert$', views.dataInsert, name='datainsert'),
    url(r'^chartdesign$', views.widgetpage, name='chartdesign'),
    url(r'^singleindex$', views.singleindex, name='singleindex'),
    url(r'^chartview', views.chartview, name='chartview'),
    url(r'^chartsave', views.chartsave, name='chartsave'),
    url(r'^chartlist', views.chartlist, name='chartlist'),
    url(r'^boarddesign$', views.boarddesign, name='boarddesign'),
    url(r'^newboarddesign$', views.newboarddesign),
    url(r'^scenelist', views.scenelist, name='scenelist'),
    url(r'^themelist', views.themelist, name='themelist'),
    url(r'^configPage/(?P<type>\w+)$', views.configPage, name='configPage'),
    url(r'^relationModle$', views.relationModle),
    url(r'^columnsModle$', views.columnsModle),
    url(r'^selectColumnsModel$', views.selectColumnsModel),
    url(r'^columnsEditModle$', views.columnsEditModle),
    url(r'^saveconfig$', views.saveconfig),
    url(r'^tablestructure$', views.tablestructure),
    url(r'^renameModel$', views.renameModel),
    url(r'^datatables$', views.datatables),
    url(r'^datatableslist$', views.datatableslist),
    url(r'^datatablesedit$', views.datatablesedit),
    url(r'^reportdesign$', views.reportdesign),
    url(r'^savedatatable$', views.savedatatable),
    url(r'^previewDataTable$', views.previewDataTable),
    url(r'^downloadTemplateFile$', dataeditview.downloadTemplateFile),
    url(r'^createDTType$', views.createDTType),  # 添加数据类型type
    url(r'^selfDesignSqlPage$', views.selfDesignSqlPage),  # 自定义sql
    url(r'^previewSqlDataPage$', views.previewSqlDataPage),  # 自定义sql
    url(r'^addscenebackgroud$', views.addscenebackgroud),#打开配置场景背景样式的页面
    url(r'^newaddscenebackgroud$', views.newaddscenebackgroud),#打开配置场景背景样式的页面
    #数据字典
    url(r'^dataDictionFromDataSource$', views.dataDictionFromDataSource),#打开配置场景背景样式的页面
    #savedatatable
    #数据导入 end
    #元数据管理 start
    url(r'^sourcelist$', views.sourcelist),
    #元数据管理 end
    #上传数据管理 start
    url(r'^uploadFileManage', views.uploadFileManage),
    url(r'^uploadFileList$', views.uploadFileList),
    url(r'^uploadFileEdit$', views.uploadFileEdit, name='uploadFileEdit'),
    #上传数据管理 end
    #OLAP 分析 start
    url(r'^olapanalysis$', views.olap),
    url(r'^olaplist$', views.olaplist),
    url(r'^olapadd$', views.olapadd),
    url(r'^olapProgress/(?P<page>\d+)$', views.olapProgress),
    url(r'^olapdispatch$', views.olapdispatch),
    url(r'^olapdispatchlist$', views.olapdispatchlist),
    url(r'^olapdispatchadd$', views.olapdispatchadd),
    url(r'^odbcolapedit$', views.odbcolapedit),
    url(r'^kpi$', views.kpiview),
    url(r'^kpilist$', views.kpilist),
    url(r'^kpiadd$', views.kpiadd),
    #OLAP 分析 end
    url(r'^widgetadd$', views.widgetpage, name='widgetadd'),
    url(r'^userlist$', views.userlist, name='userlist'),
    url(r'^useradd(/(?P<pid>\d{1,}))?$', views.useradd, name='useradd'),
    url(r'^module$', views.module, name='module'),
    url(r'^portalsetting$', views.portalSetting, name='portalsetting'),
    url(r'^editProtalTreeNode$',
        views.editProtalTreeNode,
        name='editprotaltree'),
    url(r'^editModule$', views.editModule, name='module'),
    url(r'^charttype', views.charttype, name='charttype'),
    url(r'^edittype', views.edittype),
    url(r'^datapermtag', views.datapermtag,name='datapermtag'),
    url(r'^utagadd$', views.datapermtagaddpage),
    url(r'^chartsbgconfig$', views.chartsbgconfig,name='chartsbgconfig'),
    url(r'^addchartsbgconfig$', views.addchartsbgconfig),
    url(r'^exportdataconfig$', views.exportdataconfig,name='exportdataconfig'),#数据包配置管理导出
    url(r'^importdataconfig$', views.importdataconfig,name='importdataconfig'),#数据包配置管理导入
    url(r'^importlicenseconfig$', views.importlicenseconfig, name='importlicenseconfig'),  #license文件导入
    url(r'^olapAddSourceDBConfigPage$', views.olapAddSourceDBConfigPage, name='olapAddSourceDBConfigPage'),  #olap新增数据，数据字段值来源配置，新增链接
    #数据填报
    url(r'^toDataReportPage$', views.toDataReportPage, name='toDataReportPage'),  #olap新增数据，数据字段值来源配置，新增链接
    #dashboard展示配置
    url(r'^scenesconfig$', views.scenesconfig, name='scenesconfig'),
    #访问记录
    url(r'^sceneslog$', views.sceneslog, name='sceneslog'),

    # olap扩展
    url(r'olapext', views.olapext),
    # 业务规则
    url(r'^monitordata', views.monitordata),
    url(r'^monitoradd', views.monitoradd),
    url(r'^monitorlist', views.monitorlist),
    url(r'^monitortype', views.monitortype),
    url(r'^monitordetail', views.monitordetail),

    # 单指标组件
    url(r'^singleIndexMonitorEdit',
        indexviews.singleIndexMonitorEdit),  # 单指标业务规则配置页面
    url(r'^processSingleIndex',
        indexviews.processSingleIndex),  # 根据表名，列名查询出要显示的指标
    url(r'^openSavePage', indexviews.openSavePage),  # 单指标业务规则配置页面
    url(r'^saveSingleIndex', indexviews.saveSingleIndex),  # 单指标业务规则配置页面

    # 首页配置
    url(r'^getIndexConfig$', indexviews.getIndexConfig),
    url(r'^indexconfig$', views.indexConfig, name='indexconfig'),
    url(r'^saveIndexConfig', indexviews.saveIndexConfig),

    # olap数据管理
    url(r'^dataedit$', views.dataedit),
    url(r'^getTableData', dataeditview.getTableData),
    url(r'^olapTableExcelExport', dataeditview.excelExport),
    url(r'^olapTableExcelTemplateExport', dataeditview.excelExportTemplate),
    url(r'^olapTableExcelImport', dataeditview.excelImport),
    url(r'^olapTableDataUpdate', dataeditview.olapDataUpdate),

    # olap调度监控
    url(r'^showDispatch', views.showDispatch),

    #预览theme的表格数据excle下载
    url(r'^tableDataExcelExport$', dataeditview.tableDataExcelExport),

    #系统菜单
    # 系统性能监测
    url(r'^server$', views.server, name='server'),  # 服务器负载查看
    url(r'^server_info_api$', views.server_info_api, name='server_info_api'),
    url(r'^organization$', views.organizationpage, name='organization'),#组织机构
    url(r'^addChildOrg$', views.addChildOrg, name='addChildOrg'),#组织机构
    url(r'^uservisitlog$', views.uservisitlog, name='uservisitlog'),#组织机构
    url(r'^datadictionary$', views.datadictionary, name='datadictionary'),#数据字典

    # 消息中心
    url(r'^msgcenter$', views.msgcenter, name='msgcenter'),
    url(r'msgcenters$', views.msgcenters, name='msgcenters'),
    url(r'^msgconfig$', views.msgconfig, name='msgconfig'),
    url(r'^msgtemplateconfig$', views.msgtemplateconfig, name='msgtemplateconfig'),

    #新版场景设计
    url(r'^newSceneList$', views.newSceneList),

    # 刷新缓存
    url(r'^clearcache$',views.clearcache),
    # 测试页面
    url(r'^testpage$', views.testpage),
    url(r'^test1Method$', testview.test1Method),
    url(r'^testPyODBC$', testview.testPyODBC),

    # 登录页面配置
    url(r'^loginpageconfig$',views.loginpageconfig, name='loginpageconfig')
]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
