from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from connect.models import Database,olap as olapmodel
from account.models import sys_userextension
from account.form import userForm
from django.contrib.auth import logout,login,authenticate,get_user
from django.http import HttpResponseRedirect
import json, time, re
from common.encrypt import AESCipher
from common import globalvariable as glv
# from django.contrib.auth.backends import RemoteUserBackend as u
from account.models import sys_userextension as u
from dashboard.models import scenes, externalaccessflag,uservisitlog,usercollection
from api.utils import SqlUtils
from urllib import parse
from common import tools
import datetime
import logging
from common.constantcode import DBTypeCode,LoggerCode

logger = logging.getLogger(LoggerCode.DJANGOINFO.value)

def updateVisitLog(userId, accessSource, targetType, targetId):
    try:
        currVisitObjs = uservisitlog.objects.filter(userid=userId, targetid=targetId, targettype=targetType, accesssource=accessSource)
        if currVisitObjs:
            currVisitObj = currVisitObjs[0]
            currVisitObj.visitcount = currVisitObj.visitcount + 1
            currVisitObj.modifytime = datetime.datetime.now()
            currVisitObj.accesssource = accessSource
            currVisitObj.save()
        else:
            uservisitlog.objects.create(userid=userId, targetid=targetId, targettype=targetType, visitcount=1,
                                        modifytime=datetime.datetime.now(), accesssource=accessSource)
    except Exception as error:
        raise error

@api_view(http_method_names=['GET'])
def updateUserVisitLog(request):
    resultObj = tools.successMes()
    try:
        targetId = request.GET['id']
        currLoginUser = request.user
        userAgent = request.META.get('HTTP_USER_AGENT', None)
        clientName, clientType = getBrowserType(userAgent)
        updateVisitLog(currLoginUser.id, clientName, 'scenes', targetId)
    except Exception as error:
        logger.error('---error---file:bi.view.py;method:updateUserVisitLog;error=%s' % error)
        resultObj = tools.errorMes(error)
    return Response(resultObj)

# Create your views here.
def index(request, type, pk):
    userAgent = request.META.get('HTTP_USER_AGENT', None)
    currLoginUser = request.user #当前登录账户
    # print('userAgent:', userAgent)
    if type is not None and type == 'scene':
        sceneVersion = getSceneVersion(pk)
        if sceneVersion == 2:
            urlArgs = ''
            getslistItems = request.GET.items()
            for k, v in getslistItems:
                k = parse.unquote(k)
                v = parse.unquote(v)
                urlArgs = urlArgs + k + '=' + v + '&'
            if len(urlArgs) > 1:
                urlArgs = urlArgs[:-1]
            #将用户的访问记录保存到数据库
            clientName, clientType = getBrowserType(userAgent)
            updateVisitLog(currLoginUser.id, clientType, 'scenes', pk)

            return render(request, "newdashboard/index.html", {"nowversion": str(glv.nowversion),
                                                               "pk": pk,
                                                                "viewType": "show",
                                                               "urlArgs": urlArgs})
    return render(request, 'bi/index.html',
                  {'pk': pk,
                   'type': type})


def remoteview(request, dataxtoken):
    print(dataxtoken)
    # dataxtoken = dataxtoken.replace('_equal_', '=').replace('_add_', '+').replace('_bias_', '/')
    # aes = AESCipher(glv.ENCRYPT_KEY)
    # tokenStr = aes.decrypt(dataxtoken.encode("utf8"))
    # paramArr = tokenStr.split("___") 
    # # 地址只能访问一次
    # obj = externalaccessflag.objects.filter(token=paramArr[-1])
    # if obj:
    #     return render(request, "no_permission.html")
    # externalaccessflag.objects.create(token=paramArr[-1])
    # userName = paramArr[1]
    # # 验证用户
    # row = sys_userextension.objects.filter(username=str(userName))
    # if row is None or len(row) == 0:
    #     return render(request, "no_permission.html")
    #  
    pk = ''
    if 'scenesId' in request.GET:
        pk = str(request.GET['scenesId'])
    if dataxtoken !='':
        user = u.objects.get(username=dataxtoken)
    else:
        user = u.objects.get(username='admin')
    #if 'scenesId' in request.GET:
    #    pk = str(request.GET['scenesId'])
    #user = u.objects.get(username='admin')
    login(request, user)
    glv.IS_REMOTE_LOGIN = True
    # pk = paramArr[3]
    # type = paramArr[2]
    # return render(request, 'bi/index.html',
    #               {'pk': pk,
    #                'type': type})
    userAgent = request.META.get('HTTP_USER_AGENT', None)
    clientName, clientType = getBrowserType(userAgent)
    if clientType == 'phone':
        return render(request, "newdashboard/dashboard_mb.html", {"nowversion": str(glv.nowversion),
                                                           "pk": pk,
                                                           "urlArgs":'',
                                                           "viewType": "show"})
    else:
        return render(request, "newdashboard/index.html", {"nowversion": str(glv.nowversion),
                                                           "pk": pk,
                                                           "urlArgs":'',
                                                           "viewType": "show"})

def homepage(request):
    currentuser = get_user(request)
    if currentuser.pk is None:
        return HttpResponseRedirect("/account/homepage/login")
    pk = ''
    if 'scenesId' in request.GET:
        pk = str(request.GET['scenesId'])
    userAgent = request.META.get('HTTP_USER_AGENT', None)
    clientName, clientType = getBrowserType(userAgent)
    if clientType == 'phone':
        return render(request, "newdashboard/dashboard_mb.html", {"nowversion": str(glv.nowversion),
                                                           "pk": pk,
                                                           "urlArgs":'',
                                                           "viewType": "show"})
    else:
        # return render(request, 'bi/homepage/index.html',{"nowversion":str(glv.nowversion)})
        return render(request, 'system/indexconfig/portal.html', {'nowversion':str(glv.nowversion), 'portalTitle': '智慧运营分析平台'})


def shareTheme(request):
    return render(request, 'bi/theme-share.html')


def getSceneVersion(sceneId):
    sceneObj = scenes.objects.get(id=sceneId)
    if sceneObj.sceneversion is None or sceneObj.sceneversion < 2:
        return 1
    elif 2 < sceneObj.sceneversion < 3:
        return 2
    else:
        return 1

def getBrowserType(userAgent):
    m = re.search(r'.(Android|webOS|iPhone|iPod|iPad|Windows Phone|SymbianOS|BlackBerry).', str(userAgent))
    if m:
        return m.group(1),'phone'
    # elif re.search(r'.iPad.', str(userAgent)):
    #     return 'ipad'
    else:
        return str(userAgent), 'pc'


def mobileAppLogin(request):
    pass


#获取用户订阅的数据
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getUsercollectData(request):
    """
    获取用户收藏
    """
    resultObj = tools.successMes()
    user = get_user(request)
    session = SqlUtils()
    try:
        collectDataPage = int(request.GET['collectDataPage']) if 'collectDataPage' in request.GET else 1
        collectDataPageSize = int(request.GET['collectDataPageSize']) if 'collectDataPageSize' in request.GET else 5
        querySql = """select ds."id", ds."name",ds."keywords",ds."basicconfig" from dashboard_usercollection du 
                        left join dashboard_scenes ds on du.collect_id = ds.id """
        countSql = """ select count(1) from dashboard_usercollection du """
        whereStr = "where du.user_id = '" + str(user.id) + "' and du.collect_type = 'scenes'"
        orderByStr = " order by du.modify_time"
        pageSqlStr = " limit " + str(collectDataPageSize) + " offset " + str((collectDataPage - 1) * collectDataPageSize)
        countSet = session.getArrResult(countSql + whereStr)#总数
        if len(countSet) == 0:
            resultObj['total'] = 0
        else:
            resultObj['total'] = countSet[0][0]
        querySet = session.getArrResult(querySql + whereStr + orderByStr + pageSqlStr)#where条件和分页
        resultList = []
        for qSet in querySet:
            tempObj = {}
            tempObj['id'] = qSet[0]
            tempObj['name'] = qSet[1]
            #获取缩略图的路径
            thumbnailPath = ''
            basicConfig = qSet[3]
            if basicConfig:
                if type(basicConfig) == type("stringstring"):
                    basicConfig = json.loads(basicConfig)
                thumbnailPath = basicConfig['imgUrl'] if 'imgUrl' in basicConfig else ''
                thumbnailPath = thumbnailPath[1:] if thumbnailPath.startswith('.') else thumbnailPath
            tempObj['thumbnailpath'] = thumbnailPath
            tempObj['ifShowThumbnail'] = '0'
            resultList.append(tempObj)
        resultObj['data'] = resultList
    except Exception as error:
        session.closeConnect()
        logger.error('---error---file:bi.views.py;method:getUsercollectData;error=%s' % error)
        resultObj = tools.errorMes(error)
    return Response(resultObj)

#获取用户订阅记录
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getUserVisitLogData(request):
    resultObj = tools.successMes()
    user = get_user(request)
    session = SqlUtils()
    try:
        visitLogDataType = request.GET['type'] if 'type' in request.GET else 'time'
        visitLogDataPage = int(request.GET['visitLogDataPage']) if 'visitLogDataPage' in request.GET else 1
        visitLogDataPageSize = int(request.GET['visitLogDataPageSize']) if 'visitLogDataPageSize' in request.GET else 5
        querySql = """
        SELECT
            ds."id",
            ds."name",
            ds."keywords",
            du."visitcount"
        FROM
            (
                SELECT
                    t1.userid,
                    t1.targetid,
                    t1.targettype,
                    SUM ("visitcount") AS visitcount,
                    MAX ("modifytime") AS modifytime
                FROM
                    dashboard_uservisitlog t1
                GROUP BY
                    t1.userid,
                    t1.targetid,
                    t1.targettype
            ) du
        LEFT JOIN dashboard_scenes ds ON du.targetid = ds.ID """
        countSql = """ select count(1) from dashboard_uservisitlog du """
        whereStr = " where du.userid = '" + str(user.id) + "' and du.targettype = 'scenes' "
        if visitLogDataType == 'time':
            orderByStr = " order by du.modifytime desc "
        else:
            orderByStr = " order by du.visitcount desc "
        pageSqlStr = " limit " + str(visitLogDataPageSize) + " offset " + str(
            (visitLogDataPage - 1) * visitLogDataPageSize)
        querySql = querySql + whereStr + orderByStr + pageSqlStr
        countSql = countSql + whereStr + ' GROUP BY du.userid, du.targetid, du.targettype '
        countSet = session.getArrResult(countSql)  # 总数
        if len(countSet) == 0:
            resultObj['total'] = 0
        else:
            resultObj['total'] = countSet[0][0]
        querySet = session.getArrResult(querySql)  # where条件和分页
        session.closeConnect()
        resultList = []
        for qSet in querySet:
            tempObj = {}
            tempObj['id'] = qSet[0]
            tempObj['title'] = qSet[1]
            tempObj['text'] = qSet[2]
            tempObj['count'] = qSet[3]
            resultList.append(tempObj)
        resultObj['data'] = resultList
    except Exception as error:
        session.closeConnect()
        logger.error('---error---file:bi.views.py;method:getUserVisitLogData;error=%s' % error)
        resultObj = tools.errorMes(error)
    return Response(resultObj)