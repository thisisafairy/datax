from django.conf.urls import url, include
from api.accountapi import accountview
urlpatterns = [
    url(r'^uploadpicture$', accountview.uploadpicture),
    url(r'^updatepicture$', accountview.updatepicture),
    url(r'^info$', accountview.info),
    url(r'^savepass$', accountview.savepass),
    url(r'^checkusername$', accountview.checkusername),
    url(r'^deleteuser$', accountview.deleteuser),
    url(r'^getUserTag$', accountview.getUserTag),
    url(r'^saveUserTag$', accountview.saveUserTag),
    url(r'echo1$', accountview.echo1),
    url(r'^getmsginfo$', accountview.getmsginfo),
    url(r'^userInfo$', accountview.userInfo),
    #组织机构
    url(r'^getAllTreeByParent$', accountview.getAllTreeByParent),
    url(r'^addChildren$', accountview.addChildren),
    url(r'^getUsersByOrgId$', accountview.getUsersByOrgId),
    url(r'^getMenuByOrgId$', accountview.getMenuByOrgId),
    url(r'^getOrgByOrgId$', accountview.getOrgByOrgId),
    url(r'^getAllOrg$', accountview.getAllOrg),
    url(r'^updateOrg$', accountview.updateOrg),
    url(r'^deleteById$', accountview.deleteById),
    url(r'^getSelOptUsersByOrgId$', accountview.getSelOptUsersByOrgId),
    url(r'^addUserByOrgId$', accountview.addUserByOrgId),
    url(r'^getSelOptGroupsByOrgId$', accountview.getSelOptGroupsByOrgId),
    url(r'^addGroupByOrgId$', accountview.addGroupByOrgId),
    url(r'^getSelOptMenusByOrgId$', accountview.getSelOptMenusByOrgId),
    url(r'^addMenuByOrgId$', accountview.addMenuByOrgId),
    #数据字典



]