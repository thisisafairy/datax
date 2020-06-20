# -*- coding:utf-8 -*-
from django.conf.urls import url

from extra_module.cost_module import views
from extra_module.cost_module import router

urlpatterns = [
    # 营运指标管理
    url(r'^operationalIndicatorInput$', views.operationalIndicatorInput),   # 输入页面
    url(r'^operationalIndicatorList$', views.operationalIndicatorList),     # 加载列表
    url(r'^saveOperationalIndicator$', views.saveOperationalIndicator),     # 保存 更新
    url(r'^delOperationalIndicator$', views.delOperationalIndicator),       # 删除
    url(r'^saveTaxrate$', views.saveTaxrate),                               # 保存税率
    # 人工费
    url(r'^laborFeeInput$', views.laborFeeInput),
    url(r'^laborFeeList$', views.laborFeeList),
    url(r'^saveLaborFee$', views.saveLaborFee),
    url(r'^delLaborFee$', views.delLaborFee),
    # 电池BOM
    url(r'^batteryBOMInput$', views.batteryBOMInput),
    url(r'^batteryBOMList$', views.batteryBOMList),
    url(r'^deleteBatteryBOM$',views.deleteBatteryBOM),
    url(r'^saveBatteryBOM$',views.saveBatteryBOM),
    url(r'^uploadbatteryBOM$',views.uploadbatteryBOM),
    # 组件BOM
    url(r'^componentBOMInput$',views.componentBOMInput),
    url(r'^componentBOMList$',views.componentBOMList),
    url(r'^savecomponentBOM$',views.savecomponentBOM),
    url(r'^deletecomponentBOM$',views.deletecomponentBOM),
    url(r'^uploadModuleBOM$', views.uploadModuleBOM),
    url(r'^getProductSize$', views.getProductSize),
    # 采购电池
    url(r'^outsourcingBatteryInput$',views.outsourcingBatteryInput),
    url(r'^outsourcingBatteryList$',views.outsourcingBatteryList),
    url(r'^savesourcingBattery$',views.savesourcingBattery),
    url(r'^deletesourcingBattery$',views.deletesourcingBattery),
    # 成本版本管理
    url(r'^costVersionInput$', views.costVersionInput),
    url(r'^costVersion$', views.costVersion),
    url(r'^costVersionList$', views.costVersionList),
    url(r'^saveCostVersion$', views.saveCostVersion),
    url(r'^deleteCostVersion$', views.deleteCostVersion),
    # 重新生成表数据
    url(r'^regenerateData$',views.regenerateData),
    # 下拉框联动
    url(r'^getLinkageData$',views.getLinkageData),
    #获取钉钉登陆人信息（oa）
    url(r'^getdinguserinfo$',views.getdinguserinfo),
]
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()



