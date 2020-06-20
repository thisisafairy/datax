from django.conf.urls import url, include
from api.sourceapi import sourceview, coltorowview
urlpatterns = [
    url(r'^getSource$', sourceview.getSources),  # 获取所有数据源
    url(r'^testPing$', sourceview.testPing),  # 测试链接
    url(r'^saveSource$', sourceview.saveSource),  # 保存链接
    url(r'^getSourceConfig/(?P<pk>\w+)$',sourceview.getSourceConfig),
    url(r'^systemList', sourceview.systemList),  # 获取系统数据库列表
    url(r'^getTables/(?P<pk>\w+)$', sourceview.getTables),  # 获取链接目标的数据库
    url(r'^refreshTablesBySrc/(?P<pk>\w+)$', sourceview.refreshTablesBySrc),  # 获取链接目标的数据库

    url(r'^uploadfile$', sourceview.uploadfile),  # 上传文件
    url(r'^coverFile$', sourceview.coverFile),  # 上传文件

    url(r'^sourceColumn', sourceview.sourceColumn),  # 获取数据
    url(r'^sourceSqlColumn', sourceview.sourceSqlColumn),  # 获取数据
    url(r'^sourceData', sourceview.sourceData),  # 数据显示
    url(r'^sourceSqlData', sourceview.sourceSqlData),  # 数据显示
 
    url(r'^getColumnByTable/(?P<table>\w+)$', sourceview.getColumnByTable),  # 获取表字段
    url(r'^buildSql$', sourceview.buildSql),  # 获取配置生成的sql
    url(r'^saveConfig$', sourceview.saveConfig),  # 保存

    url(r'^getSourceList$', sourceview.getSourceList),  # 元数据列表
    url(r'^getChartTypes', sourceview.getChartTypes),  # 元数据列表
    url(r'^getSourceDetail/(?P<id>\w+)$',sourceview.getSourceDetail),
    url(r'^sourceDelete$', sourceview.sourceDelete),  # 元数据删除
    url(r'^changeView$', sourceview.changeView),
    url(r'^changeThView$', sourceview.changeThView),
    url(r'^deleteTable$', sourceview.deleteTable),#删除用户指定的数据导入的表

    url(r'^sqlStrExecute$', sourceview.sqlStrExecute),#执行sqlStr返回数据


    url(r'^columndist$', sourceview.columndist),
    url(r'^savedist$', sourceview.savedist),

    # 行列转换
    url(r'^colToRow', coltorowview.colToRow),
    url(r'^getSourceColyId', coltorowview.getSourceColyId),
    url(r'^conversionData', coltorowview.conversionData),
    url(r'^saveConversionData', coltorowview.saveConversionData),

    # excel,xml等文档形式数据接入
    url(r'^getUpFileList$', sourceview.getUpFileList),  # 查询所有的使用上传方式接入的数据结构
    url(r'^delUpFile$', sourceview.delUpFile),  # 删除使用上传方式接入的数据
    url(r'^getUpFileDatas$', sourceview.getUpFileDatas), # 查询使用上传方式接入的文件的具体数据
    url(r'^uploadDataUpdate$', sourceview.uploadDataUpdate),

    #数据字典
    url(r'^getTableAndColumnNamesByConnInfo$', sourceview.getTableAndColumnNamesByConnInfo),
    url(r'^getDataByConnInfo$', sourceview.getDataByConnInfo),

]