from django.conf.urls import url

from api.dashboardapi import dashboardviews
from api.dashboardapi import dashview


urlpatterns = [
    url(r'^getOlaplists$',dashview.getOlaplists),
    #getOlapDataByTotal\
    url(r'^getCustomList$',dashview.getCustomList),
    url(r'^getCustomData/(?P<id>\w+)$', dashview.getCustomData),
    url(r'^getOlapData/(?P<id>\w+)$', dashview.getOlapData),
    url(r'^getOlapDataShow/(?P<id>\w+)$', dashview.getOlapDataShow),  # 用来展示图表数据
    url(r'^getOlapDataShow/(?P<id>\w+)/(?P<chartid>\w+)$', dashview.getOlapDataShow),  # 用来展示图表数据
    url(r'^getOlapDataByTotal/(?P<id>\w+)$', dashview.getOlapDataByTotal),
    url(r'^getOlapColumnsByOlapIds$', dashview.getOlapColumnsByOlapIds),
    url(r'^loadTableData$', dashview.loadTableData),
    url(r'^getOlapColumnInfo$',dashview.getOlapColumnInfo),
    url(r'^getOlapColumnInfo/(?P<id>\w+)$', dashview.getOlapColumnInfo),
    url(r'^getOlapAllColumnInfo/(?P<id>\w+)$', dashview.getOlapAllColumnInfo),
    # url(r'^getAllDBInfo$', dashview.getAllDBInfo),#获取数据库所有库、表、字段
    url(r'^getDBInfo$', dashview.getDBInfo),#获取数据库所有库、表、字段
    url(r'^getColumnConfigByOlapid$', dashview.getColumnConfigByOlapid),#获取数据库所有库、表、字段
    url(r'^saveConfigColByOlapDataEdit$', dashview.saveConfigColByOlapDataEdit),#保存配置项
    url(r'^getGroupDataByRefrence$', dashview.getGroupDataByRefrence),#根据配置项获取grouped的数据
    url(r'^getColumnMap/(?P<id>\w+)$', dashview.getColumnMap),
    url(r'^getColGroupValue$', dashview.getColGroupValue),
    url(r'^getScene/(?P<id>\w+)$', dashboardviews.getsenceRow),
    url(r'^settheme/$', dashboardviews.setthemes),  #设置主题信息
    url(r'^getthemes/$', dashboardviews.getthemes),  #获取主题信息
    url(r'^deltheme/$', dashboardviews.delthemes),  #删除主题信息
    url(r'^getThemeDetail/(?P<pk>\w+)/(?P<type>\w+)$', dashboardviews.getThemeDetail),
    url(r'^setchartusers/$', dashboardviews.setchartusers),  #设置主题信息
    url(r'^savedatatable$', dashboardviews.savedatatable),
    url(r'^getDataTable$', dashboardviews.getDataTable),
    url(r'^getDataTableRow/(?P<pk>\w+)$', dashboardviews.getDataTableRow),
    url(r'^deleteDataTable$',dashboardviews.deleteDataTable),
    url(r'^uploadbgpicture$',dashboardviews.uploadbgpicture),
    url(r'^saveUploadFile$',dashboardviews.saveUploadFile),
    url(r'^uploadchartsbgpicture$',dashboardviews.uploadchartsbgpicture),
    url(r'^uploadMultiplePic$',dashboardviews.uploadMultiplePic),
    url(r'^exportTheme$',dashboardviews.exportTheme),
    url(r'^shareTheme$',dashboardviews.shareTheme),
    url(r'^getDataPerTag/$',dashboardviews.getDataPerTag),
    url(r'^datapermtagview$', dashboardviews.datapermtagview),
    url(r'^scenebgconfigview$', dashboardviews.scenebgconfigview),#系统管理的图表背景配置
    url(r'^getChartsbgConfigList$', dashboardviews.getChartsbgConfigList),#查list
    url(r'^deletechartsbgconfig$', dashboardviews.deletechartsbgconfig),#删
    url(r'^savescenebackgroundconfig$', dashboardviews.savescenebackgroundconfig),#存
    url(r'^forbiddenchartsbgconfig$', dashboardviews.forbiddenchartsbgconfig),#是否禁用
    url(r'^checkchartsbgconfname$', dashboardviews.checkchartsbgconfname),#校验
    url(r'^exportBGConfig$', dashboardviews.exportBGConfig),#导出场景配置
    url(r'^uploadCoonfigFile$', dashboardviews.uploadCoonfigFile),  # 导入场景配置
    url(r'^datapermtagadd$', dashboardviews.datapermtagadd),
    url(r'^checktagname$', dashboardviews.checktagname),
    url(r'^deletedatapermtag$', dashboardviews.deletedatapermtag),
    url(r'^getExportAllData$', dashboardviews.getExportAllData),#配置包导出数据展示
    url(r'^searchExpByType$', dashboardviews.searchExpByType),#配置包导出数据查询
    url(r'^exportPackage$', dashboardviews.exportPackage),#配置包导出
    url(r'^getImportAllData$', dashboardviews.getImportAllData),#配置包导入，查询所有数据
    url(r'^uploadPkgConf$', dashboardviews.uploadPkgConf),#配置包导入，查询所有数据
    url(r'^delUploadConf$', dashboardviews.delUploadConf),#配置包删除
    url(r'^upload_file_conf$', dashboardviews.upload_file_conf),  # 文件导入
    url(r'^get_imp_licence_logs$', dashboardviews.get_imp_licence_logs),  # 获得license日志
    url(r'^get_message_info$', dashboardviews.get_message_info),  #获取邮件消息内容
    url(r'^get_all_msg_info$', dashboardviews.get_all_msg_info),  #获取全部邮件消息
    url(r'^get_Unread_msg_info$', dashboardviews.get_Unread_msg_info),  # 获取未读邮件消息

    url(r'^set_read$', dashboardviews.set_read),  # 消息全部设为已读
    url(r'^execute_rules/$', dashboardviews.execute_rules),  # 业务规则触发
    url(r'^execute_rules$', dashboardviews.execute_rules),  # 业务规则触发
    url(r'^msg_delete$', dashboardviews.msg_delete),  # 系统消息删除
    url(r'^saveAdditionText/$', dashboardviews.saveAdditionText),#保存场景预览里用户输入的标注信息
    url(r'^getBussRuleMsg$', dashboardviews.getBussRuleMsg),#查询olap下的业务规则配置运行的返回信息
    url(r'^save_msg_config$', dashboardviews.save_msg_config),  # 保存消息配置信息
    url(r'^get_msg_conf$', dashboardviews.get_msg_conf),  # 显示所有配置信息
    url(r'^echo_msg_conf$', dashboardviews.echo_msg_conf),  # 回显消息配置信息
    url(r'^del_msg_template$', dashboardviews.del_msg_template),  # 删除消息配置信息
    url(r'^get_login_page_info$', dashboardviews.get_login_page_info),  # 获取登录页信息

    url(r'^set_login_page$', dashboardviews.set_login_page),  # 设置登录页面
    url(r'^upload_uncompress_zipfile$', dashboardviews.upload_uncompress_zipfile),  # zip包上传与解压
    url(r'^download_file$', dashboardviews.download_file),  #下载文件

    #用户访问统计
    url(r'^getUserVisitLogList$', dashboardviews.getUserVisitLogList),  #用户访问场景记录
    url(r'^deleteUserVisitLogById$', dashboardviews.deleteUserVisitLogById),  #删除用户访问场景记录by id
    url(r'^getScenesLogList$', dashboardviews.getScenesLogList),  



    url(r'^getOlapExtCol$', dashview.getOlapExtCol),
    url(r'^saveExtCol$', dashview.saveExtCol),
    url(r'^showExtCols$', dashview.showExtCols),

    #新版场景设计
    url(r'^getSceneList$', dashboardviews.getSceneList),
    url(r'^saveSceneConfig$', dashboardviews.saveSceneConfig),
    url(r'^getNewScene$', dashboardviews.getNewScene),
    url(r'^getOlapTableCols$', dashboardviews.getOlapTableCols),
    url(r'^getFilterDatas$', dashboardviews.getFilterDatas),
    url(r'^quickSave$', dashboardviews.quickSave),
    url(r'^saveUserCollection$', dashboardviews.saveUserCollection),
    url(r'^getUserCollection$', dashboardviews.getUserCollection),
    url(r'^exportStyleFromScenesConfig$', dashboardviews.exportStyleFromScenesConfig),

    #新版表格设计
    url(r'^getReportConfig$', dashview.getReportConfig),
    url(r'^saveReportConfig$', dashview.saveReportConfig),
    url(r'^parseReportConfig$', dashview.parseReportConfig),


    url(r'^statisticalTags$', dashboardviews.statisticalTags),
    url(r'^getUserImgs$', dashboardviews.getUserImgs),
    url(r'^getUserChartsImgs$', dashboardviews.getUserChartsImgs),
    url(r'^delUserImg$', dashboardviews.delUserImg),

    # 数据字典
    url(r'^save_data_dictionary$', dashboardviews.save_data_dictionary),
    url(r'^delete_data_dictionary$', dashboardviews.delete_data_dictionary),
    url(r'^show_data_dictionary$', dashboardviews.show_data_dictionary),
    url(r'^two_level_dictionary$', dashboardviews.two_level_dictionary),

]