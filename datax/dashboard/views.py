from django.http import StreamingHttpResponse
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string

from api.mainapi.menuview import usermenu_cache
from connect.models import Database,olap as olapmodel
from account.models import sys_userextension,user_tag
from account.form import userForm
from dashboard.models import *
from django.core import serializers
import json
import time
from .dataeditview import get_server_info
from django.http import HttpResponse
from django.contrib.admin.views.decorators import staff_member_required
from common import globalvariable as glbv

def stream_response_generator(htmlname):

    yield render_to_string(htmlname, {"title":"BigPipe Test Page"})
    for x in range(0,10):

        time.sleep(1)
    yield "</body></html>\n"


# Create your views here.
@login_required
def index(request):
    # return StreamingHttpResponse(stream_response_generator('index.html'))
    return render(request, "index.html")

@login_required
def clearcache(request):
    usermenu_cache(cleardata=True)
    return render(request, "index.html")

@login_required
def dataIndex(request):
    return render(request, "datainsert/index.html", {"nowversion": glbv.nowversion})

@login_required
def dataInsert(request):
    return render(request, "datainsert/add.html")

@login_required
def uploadFileManage(request):
    return render(request, "datainsert/uploadfile/index.html", {"nowversion": glbv.nowversion})

@login_required
def uploadFileList(request):
    return render(request, "datainsert/uploadfile/list.html")

@login_required
def uploadFileEdit(request):
    return render(request, "datainsert/uploadfile/edit.html")

@login_required
def configPage(request, type='mysql'):
    if type == 'excel' or type == 'txt' or type == 'csv' or type == 'json' or type == 'xml' :
        return render_to_response("datainsert/type/file.html")
    else:
        return render_to_response("datainsert/type/general.html")


@login_required
def relationModle(request):
    return render_to_response('datainsert/config/relation.html')


@login_required
def renameModel(reqquest):
    return render_to_response('datainsert/config/rename.html')

@login_required
def columnsModle(request):
    return render_to_response('datainsert/config/columnsconfig.html')

@login_required
def selectColumnsModel(request):
    return render_to_response('datainsert/config/selectColumnsModel.html')

@login_required
def columnsEditModle(request):
    return render_to_response('datainsert/config/columnedit.html')

@login_required
def saveconfig(request):
    return render_to_response('datainsert/config/save.html')

@login_required
def createDTType(request):
    return render_to_response('datainsert/config/createDTType.html')

@login_required
def selfDesignSqlPage(request):
    return render_to_response('datainsert/selfdesignsql/selfDesignSqlPage.html')

@login_required
def previewSqlDataPage(request):
    return render_to_response('datainsert/selfdesignsql/previewSqlDataPage.html')

@login_required
def addscenebackgroud(request):
    return render_to_response("system/chartsbgconfig/addscenebackgroud.html")

@login_required
def newaddscenebackgroud(request):
    return render_to_response("system/chartsbgconfig/newaddscenebackgroud.html")

@login_required
def dataDictionFromDataSource(request):
    return render_to_response("system/datadictionary/datafromsource/addDataByDBConfigPage.html")

@login_required
def tablestructure(request):
    return render_to_response('datainsert/config/tablestructure.html')

@login_required
def sourcelist(request):
    return render_to_response('datainsert/sourcelist/index.html')


@login_required
def olap(request):
    return render_to_response('olap/index.html', {"nowversion": glbv.nowversion})

@login_required
def dataedit(request):
    return render_to_response('olap/dataedit/index.html',{"nowversion": glbv.nowversion})


@login_required
def olaplist(request):
    return render_to_response('olap/list.html')


@login_required
def olapadd(request):
    return render_to_response('olap/add.html')


@login_required
def olapProgress(request, page):
    switcher = {
        "1": 'information.html',
        "2": 'filter.html',
        "3": 'dispatch.html',
    }
    return render_to_response('olap/progress/' + switcher.get(
        page, 'information.html'))


@login_required
def olapdispatch(request):
    return render_to_response('olap/dispatch/index.html',{"nowversion": glbv.nowversion})


@login_required
def olapdispatchlist(request):
    return render_to_response('olap/dispatch/list.html')


@login_required
def olapdispatchadd(request):
    return render_to_response('olap/dispatch/add.html')

@login_required
def kpiview(request):
    return render_to_response('olap/kpi/index.html',{"nowversion": glbv.nowversion})
@login_required
def kpilist(request):
    return render_to_response('olap/kpi/list.html')
@login_required
def kpiadd(request):
    return render_to_response('olap/kpi/add.html')


@login_required
def olapext(request):
    return render_to_response('olap/olapext/olapext.html', {"nowversion": glbv.nowversion})


@login_required
def widgetpage(request):
    olaps = olapmodel.objects.filter(enabled='y').order_by('-create_date')

    lists = []
    for olaprow in olaps:
        dist = {}
        dist['name'] = olaprow.name
        dist['description'] = olaprow.desc
        dist['url'] = '/api/dash/getOlapData/' + str(olaprow.id)
        dist['id'] = str(olaprow.id)
        if olaprow.businesstype:
            dist['group'] = olaprow.businesstype
        else:
            dist['group'] = ''
        lists.append(dist)
    basepage = "base.html"
    if request.GET.get("ismodal") =="t":
        basepage = "base_lite.html"
    if request.GET.get('id'):
        row=charts.objects.get(id=request.GET.get('id'))
        return render(request,"polestar/index.html", {"basepage":basepage,"echartconfig":row.echartconfig,"charttype":row.charttype,"name":row.name,"kind":row.kind,"jsonconfig": row.jsonconfig,"dataconfig": row.datasetstring,"filterconfig": row.filterstring,"dataolap":lists,
                                                      "remark":row.remark,"keywords":row.keywords,"refreshspeed":row.refreshspeed,"createname":row.createname,"createtime":row.createtime,"nowversion": glbv.nowversion})
    else:
        return render(request, "polestar/index.html", {"basepage":basepage,"echartconfig":"''","charttype":"vega","jsonconfig": "pie","dataconfig":"''","filterconfig":"''","dataolap":lists,"nowversion": glbv.nowversion,
        "name":"", "kind":"", "remark":"", "keywords":"", "refreshspeed":"", "createtime":"", "createname":""})

@login_required
def singleindex(request):
    olaps = olapmodel.objects.all()
    lists = []
    for olaprow in olaps:
        dist = {}
        dist['name'] = olaprow.name
        dist['description'] = olaprow.desc
        dist['url'] = '/api/dash/getOlapData/' + str(olaprow.id)
        dist['id'] = str(olaprow.id)
        if olaprow.businesstype:
            dist['group'] = olaprow.businesstype
        else:
            dist['group'] = ''
        lists.append(dist)
    if request.GET.get('id'):
        row=charts.objects.get(id=request.GET.get('id'))
        return render(request,"dashboard/singleindex/singleindex.html", {"echartconfig":row.echartconfig,"charttype":row.charttype,"name":row.name,"kind":row.kind,"jsonconfig": row.jsonconfig,"dataconfig": row.datasetstring,"filterconfig": row.filterstring,"dataolap":lists,
                                                      "remark":row.remark,"keywords":row.keywords,"refreshspeed":row.refreshspeed,"createname":row.createname,"createtime":row.createtime})
    else:
        return render(request, "dashboard/singleindex/singleindex.html", {"echartconfig":"''","charttype":"vega","jsonconfig": "''","dataconfig":"''","filterconfig":"''","dataolap":lists})



@login_required
def boarddesign(request):
    return render(request, "dashboard/index.html",{"nowversion": glbv.nowversion})

@login_required
def newboarddesign(request):
    return render(request, "newdashboard/index.html", {"nowversion":  glbv.nowversion,
                                                       "viewType": "edit",
                                                       "urlArgs":"",
                                                       "pk":""})


@login_required
def chartview(request):
    return render(request, "polestar/demo.html")


@login_required
def chartsave(request):
    return render(request, "dashboard/chartsaveform.html")


@login_required
def chartlist(request):
    return render(request, "dashboard/chart/index.html",{"nowversion": glbv.nowversion})


def scenelist(request):
    return render(request, "dashboard/scene/index.html",{"nowversion": glbv.nowversion})


def themelist(request):
    return render(request,"dashboard/theme/index.html",{"nowversion": glbv.nowversion})

@login_required
def userlist(request):
    return render(request, "system/userlist/index.html",{"nowversion": glbv.nowversion})

@login_required
def monitordata(request):
    return render(request, "olap/monitordata/index.html",{"newversion": glbv.nowversion})

@login_required
def monitorlist(request):
    return render_to_response('olap/monitordata/list.html')


@login_required
def monitoradd(request):
    return render_to_response('olap/monitordata/add.html')

@login_required
def monitortype(request):
    return render_to_response('olap/monitordata/monitortype.html')

@login_required
def monitordetail(request):
    return render_to_response('olap/monitordata/monitordetail.html')

@login_required
def testpage(request):
    return render_to_response('system/test/test-page.html', {"nowversion": glbv.nowversion})

def useradd(request, pid=0):

    if pid:
        user = sys_userextension.objects.get(id=pid)
        userData = {
            "id": user.id,
            "username": user.username,
            "password": "",
            "email": user.email,
            "mobile": user.mobile
        }
        form = userForm(userData)
        title = '编辑'
    else:
        form = userForm()
        title = '新增'
    return render_to_response("system/userlist/add.html",
                              {"form": form,
                               'title': title})


@login_required
def module(request):
    return render(request, "system/module/index.html",{"nowversion": glbv.nowversion})


@login_required
def portalSetting(request):
    return render(request, "system/portalmenu/index.html",{"nowversion": glbv.nowversion})


@login_required
def indexConfig(request):
    return render(request, "system/indexconfig/index.html",{"nowversion": glbv.nowversion})


@login_required
def editProtalTreeNode(request):
    return render_to_response("system/portalmenu/edit.html")

@login_required
def editModule(request):
    return render_to_response("system/module/edit.html")

@login_required
def charttype(request):
    return render_to_response('system/charttype/index.html',{"nowversion": glbv.nowversion})

@login_required
def edittype(request):
    return render_to_response('system/charttype/edit.html')

@login_required
def datatables(request):
    return render_to_response('dashboard/datatables/index.html',{"nowversion": glbv.nowversion})

@login_required
def datatableslist(request):
    return render_to_response('dashboard/datatables/list.html')

@login_required
def datatablesedit(request):
    return render_to_response('dashboard/datatables/add.html')

@login_required
def reportdesign(request):
    return render_to_response('dashboard/datatables/design.html', {"nowversion": glbv.nowversion}) 

@login_required
def savedatatable(request):
    return render_to_response('dashboard/datatables/save.html')

@login_required
def previewDataTable(request):
    return render_to_response('dashboard/datatables/previews.html')

@login_required
def datapermtag(request):
    return render_to_response('system/datatag/index.html', {"nowversion": glbv.nowversion})

@login_required
def datapermtagaddpage(request):
    return render_to_response("system/datatag/add.html")

@login_required
def chartsbgconfig(request):
    return render_to_response("system/chartsbgconfig/index.html",{"nowversion": glbv.nowversion})

@login_required
def addchartsbgconfig(request):
    return render_to_response("system/chartsbgconfig/add.html")

@login_required
def exportdataconfig(request):
    return render_to_response("system/exportdata/index.html",{"nowversion": glbv.nowversion})

@login_required
def importdataconfig(request):
    return render_to_response("system/importdata/index.html",{"nowversion": glbv.nowversion})

@login_required
def odbcolapedit(request):
    return render_to_response("olap/odbcolapedit.html")

@login_required
def importlicenseconfig(request):
    return render_to_response("system/importdata/implicense.html")

@login_required
def olapAddSourceDBConfigPage(request):
    return render_to_response("olap/dataedit/olapAddSourceDBConfigPage.html")

@login_required
def toDataReportPage(request):
    return render_to_response("extra_module/index.html",context={'nowversion': glbv.nowversion})

@login_required
def scenesconfig(request):
    return render_to_response("newdashboard/scenesconfig.html",{'nowversion': glbv.nowversion})

@login_required
def sceneslog(request):
    return render_to_response("system/uservisitlog/sceneslog.html",{'nowversion': glbv.nowversion})

@login_required
def organizationpage(request):
    return render(request, 'system/organization/index.html',context={'nowversion': glbv.nowversion})

@login_required
def addChildOrg(request):
    return render(request, 'system/organization/dependentfiles/addChildOrg.html')

@login_required
def uservisitlog(request):
    return render(request, 'system/uservisitlog/index.html')

@login_required
def datadictionary(request):
    return render(request, 'system/datadictionary/index.html',context={'nowversion': glbv.nowversion})

def server_info_api(request):
    try:
        server_info = get_server_info()
    except Exception as e:
        raise e
    else:
        return HttpResponse(json.dumps(server_info))
@login_required
def server(request):
    try:
        context = {
            'title': u'服务器监控',
            'nowversion': glbv.nowversion
        }
    except Exception as e:
        print(e)
    else:
        return render(request, 'dashboard/datatables/server.html', context)


@login_required
def showDispatch(request):
    return render_to_response("olap/dispatch/log.html", {"nowversion": glbv.nowversion})

# 消息中心
@login_required
def msgcenter(request):
     return render_to_response("componets/msgcenter.html")

def msgcenters(request):
    return render_to_response("componets/msgcenters.html")

def newSceneList(request):
    return render_to_response("newdashboard/list.html", {"nowversion": glbv.nowversion})

@login_required
def msgconfig(request):
    return render_to_response("system/importdata/msgconfig.html")

@login_required
def msgtemplateconfig(request):
    return render_to_response("system/importdata/msgtemplateconfig.html")

#登录页配置
@login_required
def loginpageconfig(request):
    return render_to_response("system/importdata/loginpageconfig.html")