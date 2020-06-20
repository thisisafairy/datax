from account.models import *

from django.http import HttpResponse
from django.conf import settings
from rest_framework import generics,filters,permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from account.models import sys_userextension
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import authenticate
import os
from PIL import Image, ImageDraw, ImageFont
from connect.models import systemmessage, maillogs
from api import utils

import json
from django.shortcuts import render
from common import tools
from common.head import LIMIT
from common.constantcode import DBTypeCode,LoggerCode

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getAccount(request):
    userid = request.GET['id']
    user = sys_userextension.objects.get(id=userid)
    result = {}
    dist = {}
    dist['id'] = str(userid)
    dist['username'] = user.username
    dist['nickname'] = user.first_name
    if not dist['nickname']:
        dist['nickname']=dist['username']
    dist['email'] = user.email
    dist['mobile'] = str(user.mobile) if user.mobile != None else ''
    result['user'] = dist
    resultObj = tools.successMes()
    resultObj['user'] = dist
    return Response(resultObj)
    # return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def uploadpicture(request):
    f = request.FILES['filename']
    filename = f.name
    id = request.user.id
    path = './frontend/upload/user_'+str(id)+'/'
    if os.path.exists(path):
        a = 1
    else:
        os.makedirs(path)
    try:
        distpath = path+filename
        if os.path.exists(distpath) and os.path.isfile(distpath):
            os.remove(distpath)
        with open(path+filename, 'wb+') as destination:
            for chunk in f.chunks():
                destination.write(chunk)
    except Exception as e:
        a = e.args
    # sys_userextension.objects.filter(id=id).update(picture=filename)
    return Response({'code': 1, "path": distpath, "filename": filename})


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def updatepicture(request):
    filename = request.data['filename']
    id = request.user.id
    sys_userextension.objects.filter(id=id).update(picture=filename)
    return Response({'code': 1})

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def info(request):
    # 获取未读消息数量
    # 如果为新用户消息数量为0
    where = 'username=' + "'" + request.user.username + "'"
    fetchall = utils.SqlUtils().getArrResultWrapper('select unread_mess_mun from connect_systemmessage where ' + where,
                                               logger,'accountview.py', 'info')
    if fetchall:
        numof = fetchall[0][0]
    else:
        numof = 0
    # 获取未读消息
    id = request.user.id
    row = sys_userextension.objects.get(id=id)
    dist = {}
    dist['num'] = numof
    dist['username'] = row.username
    dist['nickname'] = row.first_name
    if not dist['nickname']:
        dist['nickname'] = row.username
    if row.picture == '' or row.picture == None:
        dist['picture'] = '../frontend/upload/user_default/default.png'
    else:
        dist['picture'] = '../frontend/upload/user_'+str(id)+'/'+row.picture
    return Response(dist)


def getmsginfo(request):
    # 获取未读消息数量
    # 如果为新用户消息数量为0
    where = 'username=' + "'" + request.user.username + "'"
    # fetchall = utils.getResultBySql('select count(*) from connect_systemmessage where ' + where)
    fetchall = utils.SqlUtils().getArrResultWrapper('select count(*) from connect_systemmessage where ' + where,
                                                    logger,'accountview.py', 'getmsginfo')

    numof = fetchall[0]
    # if int(str(numof)[1]) > 0:
    #     sysobj = systemmessage.objects.get(username=request.user.username)
    #     num = sysobj.unread_mess_mun
    if int(str(numof)[1]) > 0:
        where = 'mail_to=' + "'" + request.user.email + "'" + "and is_read = '0' "
        # fetchall = utils.getResultBySql('select count(*) from connect_maillogs where ' + where)
        fetchall = utils.SqlUtils().getArrResultWrapper('select count(*) from connect_maillogs where ' + where,
                                                        logger,'accountview.py', 'getmsginfo')
        numof = fetchall[0]
        obj = systemmessage.objects.get(username=request.user.username)
        obj.unread_mess_mun = int(str(numof)[1])
        num = int(str(numof)[1])
        obj.save()
    else:
        num = 0
    # 获取未读消息
    mailobj = maillogs.objects.filter(mail_to=request.user.email, is_read=0).order_by('-create_date')
    objs = []
    for obj in mailobj:
        dt = {}
        dt['id'] = obj.id
        dt['mail_title'] = obj.mail_title
        objs.append(dt)
    id = request.user.id
    row = sys_userextension.objects.get(id=id)
    dist = {}
    dist['username'] = row.username
    dist['objs'] = objs
    dist['num'] = num
    return Response(dist)



@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def savepass(request):
    data = request.data['form']
    userrow = sys_userextension.objects.get(id=request.user.id)
    oldpass = data['oldpass']
    newpass = data['newpass']
    confirmpass = data['confirmpass']
    user = authenticate(username=userrow.username, password=oldpass)
    result = {}
    if user is None:
        result['code'] = 0
        result['msg'] = '原始密码错误'
    else:
        if newpass != confirmpass:
            result['code'] = 1
            result['msg'] = '新密码与确认密码不一样'
        else:
            try:
                userrow.set_password(newpass)
                userrow.save()
                result['code'] = 2
                result['msg'] = '保存成功'
            except Exception as e:
                result['code'] = 3
                result['msg'] = e.args
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def checkusername(request):
    username = ''
    if 'name' in request.data.get("data"):
        username = request.data.get("data")["name"]
    id = request.data.get("data")['id']
    resultObj = tools.successMes()
    try:
        # 筛选数据库中的username 判断是否存在
        userrow = sys_userextension.objects.filter(username=username)
        if userrow:
            if id != userrow[0].id:
                resultObj['code'] = '0'
                resultObj['msg'] = '用户名重复'
            else:
                resultObj['code'] = '1'
        else:
            resultObj["code"] = "1"
    except Exception as e:
        resultObj = tools.errorMes(e)
        resultObj["code"] = '1'
        pass
    return Response(resultObj)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def deleteuser(request):
    result = {}
    result['code'] = 1
    resultObj = tools.successMes()
    resultObj['code'] = 1
    if 'id' in request.data:
        userid = request.data['id']
    else:
        userid = 0
    session = utils.SqlUtils()
    try:
        #如果要删除用户，则需要删除用户关联的菜单、机构、角色
        user_menus.objects.filter(user_id=userid).delete()
        org_user_group.objects.filter(userid=userid).delete()
        sys_userextension.objects.get(id=userid).delete()
        # sql语句最后执行 否则Django的orm删除会出现问题
        session.executeUpdateSql('delete from account_sys_userextension_groups where sys_userextension_id=%s' % userid)
        session.closeConnect()
        resultObj['msg'] = '删除成功'
    except Exception as e:
        print(e)
        session.rollBack()
        resultObj = tools.errorMes(e)
        resultObj['code'] = 0
        resultObj['msg'] = e.args
        pass
    return Response(resultObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getUserTag(request):
    resultObj = tools.successMes()
    try:
        tags = user_tag.objects.all()
        result = []
        for row in tags:
            result.append({"name":row.name,"id":row.id})
        resultObj['data'] = result
    except Exception as e:
        resultObj = tools.errorMes(e)
    return Response(resultObj)
    # return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveUserTag(request):
    if 'id' in request.data:
        postid = request.data['id']
        config = request.data['config']
        try:
            user = sys_userextension.objects.get(id=postid)
            user.tagfield = config
            user.save()
            resultObj = tools.successMes()
            resultObj["code"] = '1'
            # result['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e)
            resultObj['code'] = '0'
            resultObj['msg'] = e.args
    else:
        resultObj = tools.successMes()
        resultObj['code'] = 0
        resultObj['msg'] = '没有可操作的会员'
    return Response(resultObj)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def echo1(request):
    # 获取未读消息数量
    # 如果为新用户消息数量为0
    where = 'username=' + "'" + request.user.username + "'"
    # fetchall = utils.getResultBySql('select count(*) from connect_systemmessage where ' + where)
    try:
        fetchall = utils.SqlUtils().getArrResultWrapper('select unread_mess_mun from connect_systemmessage where ' + where,
                                                    logger,'accountview.py', 'echo1')
    except Exception as e:
        print('eeeeeee',e)
    if fetchall:
        numof = fetchall[0][0]
    else:
        numof = 0
    # if int(str(numof)[1]) > 0:
    #     sysobj = systemmessage.objects.get(username=request.user.username)
    #     num = sysobj.unread_mess_mun
    # if int(str(numof)[1]) > 0:
    #     where = 'mail_to=' + "'" + request.user.email + "'" + "and is_read = '0' "
    #     # fetchall = utils.getResultBySql('select count(*) from connect_maillogs where ' + where)
    #     fetchall = utils.SqlUtils().getArrResultWrapper('select count(*) from connect_maillogs where ' + where,
    #                                                     logger,'accountview.py', 'echo1')
    #     numof = str(fetchall[0][0])
    #     obj = systemmessage.objects.get(username=request.user.username)
    #     obj.unread_mess_mun = numof
    #     num = numof
    #     obj.save()
    # else:
    #     num = 0
    # 获取未读消息
    # mailobj = maillogs.objects.filter(mail_to=request.user.email, is_read=0)
    # objs = []
    # for obj in mailobj:
    #     dt = {}
    #     dt['id'] = obj.id
    #     dt['mail_title'] = obj.mail_title
    #     objs.append(dt)
    id = request.user.id
    row = sys_userextension.objects.get(id=id)
    dist = {}
    dist['username'] = row.username
    #dist['objs'] = objs
    dist['num'] = numof
    #return HttpResponse(json.dumps(dist), content_type="application/json")
    return Response(dist)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def userInfo(request):
    results = tools.successMes()
    try:
        usersss = request.user
        userId = request.user.id
        isSuperuser = request.user.is_superuser
        loginRole = ''
        if isSuperuser:
            menuSql = ' SELECT name, key FROM dashboard_menu order by parent_key desc,orderby asc'
            portalmenuSql = ' SELECT name, key FROM dashboard_portalmenu order by parent_key desc,orderby asc'
            rolesInfo = [{
                'name': '超级管理员'
            }]
            loginRole = 'admin'
        else:
            menuSql = '''
                SELECT name, key FROM dashboard_menu WHERE "id" IN 
                ( SELECT menu_id FROM account_group_menus WHERE group_id IN (
                SELECT group_id FROM account_sys_userextension_groups WHERE sys_userextension_id = ''' + str(userId) + '''
                )) order by parent_key desc,orderby asc;
            '''
            portalmenuSql = '''
                SELECT name, key FROM dashboard_portalmenu WHERE "id" IN 
                ( SELECT menu_id FROM account_group_menus WHERE group_id IN (
                SELECT group_id FROM account_sys_userextension_groups WHERE sys_userextension_id = ''' + str(userId) + '''
                )) order by parent_key desc,orderby asc;
            '''
            roleSql = '''
                SELECT "name" FROM auth_group WHERE "id" IN 
                (SELECT group_id FROM account_sys_userextension_groups WHERE sys_userextension_id = ''' + str(userId) + ''')
            '''
            # roles = utils.getResultBySql(roleSql)
            roles = utils.SqlUtils().getArrResultWrapper(roleSql,logger,'accountview.py', 'userInfo')
            rolesInfo = []
            for role in roles:
                rolesInfo.append({
                    'name': role[0]
                })
        # menus = utils.getResultBySql(menuSql)
        # portalmenus = utils.getResultBySql(portalmenuSql)
        menus = []
        portalmenus = []
        executeSession = utils.SqlUtils()
        try:
            menus = executeSession.getArrResult(menuSql)
            portalmenus = executeSession.getArrResult(portalmenuSql)
        except Exception as error:
            executeSession.rollBack()
            logger.error('---error---file:accountview.py;method:userInfo;error:%s' % error)
        executeSession.closeConnect()

        backstageMenu = []
        for menu in menus:
            backstageMenu.append({
                'key': menu[1],
                'name': menu[0]
            })
        frontMenu = []
        for menu in portalmenus:
            frontMenu.append({
                'key': menu[1],
                'name': menu[0]
            })
        userInfo = {
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'username': request.user.username,
            'email': request.user.email,
            'rolesInfo': rolesInfo,
            'role': loginRole,
            'backstageMenu': backstageMenu,
            'frontMenu': frontMenu
        }
        results['userInfo'] = userInfo
    except Exception as e:
        print('file:accountview; method:userInfo')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)

# @api_view(http_method_names=['GET'])
# @permission_classes((permissions.AllowAny,))
# def getAllTreeByParent(request):
#     returnObj = tools.successMes()
#     try:
#         treeStruct={}
#         if 'id' in request.GET:
#             parentid = request.GET['id']
#             if parentid=='0' or parentid=='root':#如果父id为0或者root就抓取所有
#                 treeData=organization.objects.all()
#                 # getTreeData(treeData,treeStruct)
#             else:
#                 currTree=organization.objects.get(id=parentid)
#                 treeData = currTree.get_family()
#             treeJsonData = serializers.serialize('json', treeData)
#             returnObj['data']=treeJsonData
#         else:
#             returnObj = tools.errorMes('传入id为空！')
#     except Exception as err:
#         returnObj = tools.errorMes(err.args)
#
#     print('returnObj=',returnObj)
#     return Response(returnObj)
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getAllTreeByParent(request):
    returnObj = tools.successMes()
    try:
        treeStruct={}
        if 'parentid' in request.GET:
            parentid = request.GET['parentid']
            if parentid=='0' or parentid=='root':#如果父id为0或者root就抓取所有
                # treeData=organization.objects.all()
                treeRootDataNone=organization.objects.filter(parentid=None)
                treeRootDataZero=organization.objects.filter(parentid=0)

                treeStruct['id'] = '0'
                treeStruct['orgName'] = '各机构'
                treeStruct['parentId'] = '0'
                treeStruct['numOfPeople'] = ''
                treeStruct['code'] = ''
                treeStruct['isLeaf'] = 'f'
                treeStruct['isOrg'] = 't'
                treeStruct['children']=[]
                for tmpO in treeRootDataNone:
                    treeStruct['children'].append(getTreeHtmlByDataSet(tmpO))
                for tmpO in treeRootDataZero:
                    treeStruct['children'].append(getTreeHtmlByDataSet(tmpO))

                for g in getGroupByOrgId('0'):
                    groupObj={'id':g['gid'],'orgName':g['gname'],'parentId':0,
                              'numOfPeople':'','code':'','isLeaf':'t','isOrg':'f'}
                    treeStruct['children'].append(groupObj)

                if len(treeStruct['children'])==0:
                    treeStruct['isLeaf'] = 't'
            else:
                currTree=organization.objects.get(id=parentid)
                treeStruct = getTreeHtmlByDataSet(currTree)

            returnObj['data']=treeStruct
        else:
            returnObj = tools.errorMes('传入id为空！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

def getTreeHtmlByDataSet(treeData):
    treeStruct={}
    treeStruct['id']=treeData.id
    treeStruct['orgName']=treeData.org_name
    treeStruct['parentId']=treeData.parentid if treeData.parentid else 0
    treeStruct['numOfPeople'] = treeData.num_of_people if treeData.num_of_people else ''
    treeStruct['code'] = treeData.code
    treeStruct['isLeaf'] = 't'
    treeStruct['isOrg'] = 't'
    treeStruct['children'] = []
    # childs=treeData.get_children()
    childs=organization.objects.filter(parentid=treeData.id)
    if childs:
        treeStruct['isLeaf'] = 'f'
        for cd in childs:
            treeStruct['children'].append(getTreeHtmlByDataSet(cd))
        for g in getGroupByOrgId(treeData.id):
            groupObj = {'id': g['gid'], 'orgName': g['gname'], 'parentId': treeData.id,
                        'numOfPeople': '', 'code': '', 'isLeaf': 't', 'isOrg': 'f'}
            treeStruct['children'].append(groupObj)
    return treeStruct

def getGroupByOrgId(orgId):
    if str(orgId):
        executeSql="""select ag.id,ag.name from (select DISTINCT groupid from account_org_user_group 
                            WHERE orgid="""+str(orgId)+""" and groupid is not NULL)aoug 
                            left join auth_group ag on aoug.groupid=ag.id where ag.id is not null"""
        # groups = utils.getResultBySql(executeSql)
        groups = utils.SqlUtils().getArrResultWrapper(executeSql,logger,'accountview.py', 'getGroupByOrgId')

        groupsList=[]
        for g in groups:
            groupsList.append({
                'gid': g[0],
                'gname': g[1]
            })
        return groupsList
    else:
        return []

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def addChildren(request):
    parentid=request.data['parentid']
    orgName=request.data['orgName']
    abbrNm=request.data['abbrNm']
    returnObj = tools.successMes()
    try:
        if parentid=='0' or parentid == 'root':
            createObj=organization.objects.get_or_create(org_name=orgName,org_abbreviation_name=abbrNm)
            createObj.full_path_id=createObj.id
            createObj.save()
        else:
            parentObjs=organization.objects.get(id=parentid)
            if parentObjs:
                createdObj=organization.objects.get_or_create(org_name=orgName,org_abbreviation_name=abbrNm,parentid=parentObjs.id)
                createdObj.full_path_id =parentObjs.full_path_id+','+ createdObj.id
                createdObj.save()
            else:
                returnObj = tools.errorMes('父节点不存在！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getUsersByOrgId(request):
    returnObj = tools.successMes()
    try:
        id=request.GET['id']
        idType=request.GET['type']

        page = request.GET['page']
        offset = (int(page) - 1) * LIMIT

        executeSql=''
        executeCountSql=''
        userList=[]
        if idType=='group' and id:#如果是组
            if id and type(id)==type('stringtypecharacter'):
                id=int(id)
            id=id-1000000
            executeSql="""SELECT asu.id,asu.username,asu.first_name,asu.email from (SELECT sys_userextension_id from account_sys_userextension_groups where group_id="""+str(id)+""" and sys_userextension_id is not null) sug 
                            LEFT JOIN account_sys_userextension asu on sug.sys_userextension_id=asu.id LIMIT """+str(LIMIT) +""" offset """+str(offset)
            executeCountSql = """SELECT count(1) from (SELECT sys_userextension_id from account_sys_userextension_groups where group_id=""" + str(id) + """ and sys_userextension_id is not null) sug 
                                        LEFT JOIN account_sys_userextension asu on sug.sys_userextension_id=asu.id"""
        elif idType=='org' and id:#如果是机构
            executeSql = """SELECT asu.id,asu.username,asu.first_name,asu.email from (select DISTINCT userid from account_org_user_group where orgid=""" + id + """ and userid is not null) oug 
                                        LEFT JOIN account_sys_userextension asu on oug.userid=asu.id LIMIT """+str(LIMIT) +""" offset """+str(offset)
            executeCountSql = """SELECT count(1) from (select DISTINCT userid from account_org_user_group where orgid=""" + id + """ and userid is not null) oug 
                                                    LEFT JOIN account_sys_userextension asu on oug.userid=asu.id"""
        if executeSql:
            # print('getUsersByOrgId executeSql=',executeSql)
            # print('getUsersByOrgId executeCountSql=',executeCountSql)
            # users = utils.getResultBySql(executeSql)
            # allRowCnt = utils.getResultBySql(executeCountSql)
            users = []
            allRowCnt = []
            executeSession = utils.SqlUtils()
            try:
                users = executeSession.getArrResult(executeSql)
                allRowCnt = executeSession.getArrResult(executeCountSql)
            except Exception as error:
                executeSession.rollBack()
                logger.error('---error---file:accountview.py;method:getUsersByOrgId;error:%s' % error)
            executeSession.closeConnect()

            for u in users:
                userList.append({
                    'uid':u[0],
                    'username':u[1],
                    'nickname':u[2],
                    'email':u[3],
                })
            returnObj['data']=userList
            returnObj['total']=allRowCnt
        else:
            returnObj = tools.errorMes('查询出错！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getMenuByOrgId(request):
    returnObj = tools.successMes()
    try:
        id=request.GET['id']
        idType=request.GET['type']

        page = request.GET['page']
        offset = (int(page) - 1) * LIMIT

        executeSql=''
        executeCountSql=''
        menuList=[]
        if idType=='org' and id:#如果是机构
            executeSql = """SELECT dm. ID,dm.name,dm.url,dm.key FROM(SELECT	menuid FROM	account_org_menu WHERE orgid = """ + id + """ AND orgid IS NOT NULL) aom 
                                                                                LEFT JOIN dashboard_menu dm ON dm.id = aom.menuid LIMIT """ + str(LIMIT) + """ OFFSET """ + str(offset)
            executeCountSql = """SELECT count(1) FROM(SELECT menuid FROM account_org_menu WHERE orgid = """ + id + """ AND orgid IS NOT NULL) aom 
                                                                                LEFT JOIN dashboard_menu dm ON dm.id = aom.menuid """
        elif idType=='group' and id:#如果是组
            if type(id)==type('stringtypecharacter'):
                id=int(id)
            id=id-1000000
            executeSql = """SELECT dm.ID,dm.NAME,dm.url,dm.KEY FROM(SELECT menu_id FROM account_group_menus WHERE group_id = """+str(id)+""" AND group_id IS NOT NULL) agm 
                                                                                LEFT JOIN dashboard_menu dm ON dm.ID = agm.menu_id LIMIT """+str(LIMIT) +""" OFFSET """+str(offset)

            executeCountSql = """SELECT count(1) FROM(SELECT menu_id FROM account_group_menus WHERE group_id = """+str(id)+""" AND group_id IS NOT NULL) agm 
                                                                                LEFT JOIN dashboard_menu dm ON dm.ID = agm.menu_id """
        if executeSql:
            # print('getMenuByOrgId executeSql=',executeSql)
            # print('getMenuByOrgId executeCountSql=',executeCountSql)
            # menus = utils.getResultBySql(executeSql)
            # allRowCnt = utils.getResultBySql(executeCountSql)
            menus = []
            allRowCnt = []
            executeSession = utils.SqlUtils()
            try:
                menus = executeSession.getArrResult(executeSql)
                allRowCnt = executeSession.getArrResult(executeCountSql)
            except Exception as error:
                executeSession.rollBack()
                logger.error('---error---file:accountview.py;method:getMenuByOrgId;error:%s' % error)
            executeSession.closeConnect()

            for m in menus:
                menuList.append({
                    'mid':m[0],
                    'menuname':m[1],
                    'menuurl':m[2],
                    'menucode':m[3],
                })
            returnObj['data']=menuList
            returnObj['total']=allRowCnt
        else:
            returnObj = tools.errorMes('查询出错！')
    except Exception as err:
        # raise err
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOrgByOrgId(request):
    returnObj = tools.successMes()
    try:
        if 'orgid' in request.GET:
            orgid = request.GET['orgid']
            orgObj=organization.objects.get(id=orgid)
            orgDict={}
            if orgObj:
                orgDict['id']=orgObj.id
                orgDict['org_name']=orgObj.org_name
                orgDict['org_abbreviation_name']=orgObj.org_abbreviation_name
                orgDict['num_of_people']=orgObj.num_of_people
                orgDict['code']=orgObj.code
                orgDict['parentid']=orgObj.parentid
                orgDict['status']=orgObj.status

                returnObj['data']=orgDict
            else:
                returnObj = tools.errorMes('该组织机构不存在！')
        else:
            returnObj = tools.errorMes('id为空！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getAllOrg(request):
    returnObj = tools.successMes()
    try:
        orgObjs=organization.objects.all()
        returnObj['data']=[]
        for org in orgObjs:
            orgDict = {}
            orgDict['id'] = org.id
            orgDict['org_name'] = org.org_name
            orgDict['org_abbreviation_name'] = org.org_abbreviation_name
            orgDict['num_of_people'] = org.num_of_people
            orgDict['code'] = org.code
            orgDict['parentid'] = org.parentid
            orgDict['status'] = org.status
            returnObj['data'].append(orgDict)
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def updateOrg(request):
    returnObj = tools.successMes()
    try:
        if 'allJsonObj' in request.data:
            orgObj=request.data['allJsonObj']
            if type(orgObj)==type('charactertype'):
                orgObj=json.loads(orgObj)
            # print('orgObj=',orgObj)
            style=orgObj['style']#是编辑还是新增
            if style=='add':
                parentId=''
                parentFullPathId=''
                if orgObj['id']==0 or orgObj['id']=='0':
                    parentId=0
                    parentFullPathId=''
                else:
                    parentOrg=organization.objects.get(id=orgObj['id'])
                    parentId=orgObj['id']
                    parentFullPathId=parentOrg.full_path_id+','

                currOrg=organization.objects.create(org_name=orgObj['org_name'],org_abbreviation_name=orgObj['org_abbreviation_name'],
                                            num_of_people=orgObj['num_of_people'],code=orgObj['code'],
                                            parentid=parentId,status=orgObj['status'])
                currOrg.full_path_id=parentFullPathId+str(currOrg.id)
                currOrg.save()
            elif style=='edit':
                org=organization.objects.get(id=orgObj['id'])
                org.org_name=orgObj['org_name']
                org.org_abbreviation_name=orgObj['org_abbreviation_name']
                org.num_of_people=orgObj['num_of_people']
                org.code=orgObj['code']
                org.status=orgObj['status']
                org.save()
            else:
                returnObj = tools.errorMes('执行类型错误！')
        else:
            returnObj = tools.errorMes('传入参数错误！')
    except Exception as err:
        # raise err
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def deleteById(request):#根据角色或者机构id删除
    returnObj = tools.successMes()
    try:
        oid=tp=parentid=''
        if 'oid' not in request.GET or 'type' not in request.GET or 'parentid' not in request.GET:
            returnObj = tools.errorMes('传入参数错误！')
        oid = request.GET['oid']
        tp = request.GET['type']
        parentid = request.GET['parentid']#用于查找

        if oid and tp=='org':#删除org和account_org_user_group里的数据
            orgChildObj=organization.objects.filter(parentid=oid)
            if orgChildObj:
                returnObj = tools.errorMes('当前节点有子菜单，不可删除！')
            else:
                ougObj = org_user_group.objects.filter(orgid=oid)
                if ougObj:
                    returnObj = tools.errorMes('当前节点有角色或用户，不可删除！')
                else:
                    organization.objects.get(id=oid).delete()

        elif oid and tp=='group':#删除account_org_user_group里的数据
            if type(oid)==type('stringcharacterstr'):
                oid=int(oid)
            oid=oid-1000000 #前台避免groupid和orgid重复
            ougObj=org_user_group.objects.filter(orgid=parentid,groupid=oid)#如果传入的是group，就删除group的数据
            if ougObj:
                ougObj.delete()#删除group和机构的关联关系
            else:
                returnObj = tools.errorMes('数据不存在！')
        else:
            returnObj = tools.errorMes('父节点异常！')

    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getSelOptUsersByOrgId(request):
    returnObj = tools.successMes()
    try:
        id = request.GET['orgId']
        # type = request.GET['type']

        optionUserList=[]
        selectedUserList=[]
        optExecuteSql = ''
        selExecuteSql = ''

        if id:
            optExecuteSql = """SELECT asu.id,asu.username from (select DISTINCT ID from account_sys_userextension WHERE id is NOT NULL 
                                                                EXCEPT 
                                                                select DISTINCT userid from account_org_user_group where orgid=""" + id + """ and userid is not null) oug 
                                                    LEFT JOIN account_sys_userextension asu on oug.id=asu.id"""

            selExecuteSql="""SELECT asu.id,asu.username from (select DISTINCT userid from account_org_user_group where orgid=""" + id + """ and userid is not null) oug 
                                        LEFT JOIN account_sys_userextension asu on oug.userid=asu.id"""

            # optusers = utils.getResultBySql(optExecuteSql)
            # selusers = utils.getResultBySql(selExecuteSql)
            optusers = []
            selusers = []
            executeSession = utils.SqlUtils()
            try:
                optusers = executeSession.getArrResult(optExecuteSql)
                selusers = executeSession.getArrResult(selExecuteSql)
            except Exception as error:
                executeSession.rollBack()
                logger.error('---error---file:accountview.py;method:getSelOptUsersByOrgId;error:%s' % error)
            executeSession.closeConnect()

            for u in optusers:
                optionUserList.append({
                    'uid': u[0],
                    'username': u[1]
                })
            for u in selusers:
                selectedUserList.append({
                    'uid': u[0],
                    'username': u[1]
                })
            returnObj['data']={
                'optionUserList':optionUserList,
                'selectedUserList':selectedUserList
            }
        else:
            returnObj = tools.errorMes('id为空！')
        # if type=='group' and id:#如果是组
        #     executeSql="""SELECT asu.id,asu.username,asu.first_name,asu.email from (SELECT sys_userextension_id from account_sys_userextension_groups where group_id="""+id+""" and userid is not null) sug
        #                     LEFT JOIN account_sys_userextension asu on sug.sys_userextension_id=asu.id"""
        # elif type=='org' and id:#如果是机构
        #     executeSql = """SELECT asu.id,asu.username,asu.first_name,asu.email from (select DISTINCT userid from account_org_user_group where orgid=""" + id + """ and userid is not null) oug
        #                                 LEFT JOIN account_sys_userextension asu on oug.userid=asu.id"""
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def addUserByOrgId(request):
    returnObj = tools.successMes()
    try:
        if 'orgId' in request.data and 'addUids' in request.data and 'removeUids' in request.data:
            orgId=request.data['orgId']
            addUids=request.data['addUids']
            addUids=addUids.split(',') if addUids else []
            removeUids=request.data['removeUids']
            removeUids=removeUids.split(',') if removeUids else []
            for uid in addUids:
                org_user_group.objects.create(orgid=orgId,userid=uid)
            if removeUids:
                org_user_group.objects.filter(orgid=orgId,userid__in=removeUids).delete()
        else:
            returnObj = tools.errorMes('传入参数错误！')
    except Exception as err:
        # raise err
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getSelOptGroupsByOrgId(request):
    returnObj = tools.successMes()
    try:
        id = request.GET['orgId']
        optionGroupList=[]
        selectedGroupList=[]
        optExecuteSql = ''
        selExecuteSql = ''
        if id:
            optExecuteSql = """SELECT ag.ID,ag.name FROM(SELECT DISTINCT ID FROM auth_group WHERE ID IS NOT NULL 
                                                        EXCEPT 
                                                        SELECT DISTINCT groupid FROM account_org_user_group WHERE orgid = """ + id + """ AND groupid IS NOT NULL) oug 
                                                        LEFT JOIN auth_group ag ON oug.ID = ag.ID"""

            selExecuteSql="""SELECT ag.ID,	ag.name FROM(SELECT DISTINCT groupid FROM account_org_user_group WHERE orgid = """ + id + """ AND groupid IS NOT NULL) oug 
                                                            LEFT JOIN auth_group ag ON oug.groupid = ag.ID"""

            # optGroups = utils.getResultBySql(optExecuteSql)
            # selGroups = utils.getResultBySql(selExecuteSql)
            optGroups = []
            selGroups = []
            executeSession = utils.SqlUtils()
            try:
                optGroups = executeSession.getArrResult(optExecuteSql)
                selGroups = executeSession.getArrResult(selExecuteSql)
            except Exception as error:
                executeSession.rollBack()
                logger.error('---error---file:accountview.py;method:getSelOptGroupsByOrgId;error:%s' % error)
            executeSession.closeConnect()

            for g in optGroups:
                optionGroupList.append({
                    'gid': g[0],
                    'groupname': g[1]
                })
            for g in selGroups:
                selectedGroupList.append({
                    'gid': g[0],
                    'groupname': g[1]
                })
            returnObj['data']={
                'optionGroupList':optionGroupList,
                'selectedGroupList':selectedGroupList
            }
        else:
            returnObj = tools.errorMes('id为空！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def addGroupByOrgId(request):
    returnObj = tools.successMes()
    try:
        if 'orgId' in request.data and 'addGids' in request.data and 'removeGids' in request.data:
            orgId=request.data['orgId']
            addGids=request.data['addGids']
            addGids=addGids.split(',') if addGids else []
            removeGids=request.data['removeGids']
            removeGids=removeGids.split(',') if removeGids else []
            for gid in addGids:
                org_user_group.objects.create(orgid=orgId,groupid=gid)
            if removeGids:
                org_user_group.objects.filter(orgid=orgId,groupid__in=removeGids).delete()
        else:
            returnObj = tools.errorMes('传入参数错误！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getSelOptMenusByOrgId(request):
    returnObj = tools.successMes()
    try:
        id = request.GET['orgId']
        # type = request.GET['type']
        optionMenuList=[]
        selectedMenuList=[]
        optExecuteSql = ''
        selExecuteSql = ''

        if id:
            optExecuteSql = """SELECT dm.id,dm.name,dm.parent_key,dm2.name as parentname FROM(SELECT DISTINCT ID FROM dashboard_menu WHERE ID IS NOT NULL and parent_key IS NOT NULL and parent_key !=''
                                                                                                    EXCEPT 
                                                                                                    SELECT DISTINCT menuid FROM account_org_menu WHERE orgid = """ + id + """ AND menuid IS NOT NULL) aom 
                                                                                                    LEFT JOIN dashboard_menu dm ON dm.ID = aom.ID 
                                                                                                    LEFT JOIN dashboard_menu dm2 ON dm2.key = dm.parent_key"""
            print('optExecuteSql=',optExecuteSql)
            selExecuteSql="""SELECT dm.id,dm.name,dm.parent_key,dm2.name as parentname FROM(SELECT DISTINCT menuid FROM account_org_menu WHERE orgid = """ + id + """ AND menuid IS NOT NULL) aom 
                                                                                                    LEFT JOIN dashboard_menu dm ON dm.ID = aom.menuid 
                                                                                                    LEFT JOIN dashboard_menu dm2 ON dm2.key = dm.parent_key"""
            # optmenus = utils.getResultBySql(optExecuteSql)
            # selmenus = utils.getResultBySql(selExecuteSql)
            optmenus = []
            selmenus = []
            executeSession = utils.SqlUtils()
            try:
                optmenus = executeSession.getArrResult(optExecuteSql)
                selmenus = executeSession.getArrResult(selExecuteSql)
            except Exception as error:
                executeSession.rollBack()
                logger.error('---error---file:accountview.py;method:getSelOptMenusByOrgId;error:%s' % error)
            executeSession.closeConnect()

            for m in optmenus:
                optionMenuList.append({
                    'menuid': m[0],
                    'menuname': m[1],
                    'parentkey': m[2],
                    'parentname': m[3]
                })
            for m in selmenus:
                selectedMenuList.append({
                    'menuid': m[0],
                    'menuname': m[1],
                    'parentkey': m[2],
                    'parentname': m[3]
                })
            returnObj['data']={
                'optionMenuList':optionMenuList,
                'selectedMenuList':selectedMenuList
            }
        else:
            returnObj = tools.errorMes('id为空！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def addMenuByOrgId(request):
    returnObj = tools.successMes()
    try:
        if 'orgId' in request.data and 'addMids' in request.data and 'removeMids' in request.data:
            orgId=request.data['orgId']
            addMids=request.data['addMids']
            addMids=addMids.split(',') if addMids else []
            removeMids=request.data['removeMids']
            removeMids=removeMids.split(',') if removeMids else []
            for mid in addMids:
                org_menu.objects.create(orgid=orgId,menuid=mid)
            if removeMids:
                org_menu.objects.filter(orgid=orgId,menuid__in=removeMids).delete()
        else:
            returnObj = tools.errorMes('传入参数错误！')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)