from django.contrib.auth.models import User, Group
from account.models import sys_userextension
from api.mainapi.menuview import usermenu_cache
from common.globalvariable import menu_cache
from dashboard.models import  *
from rest_framework import generics,filters
from api.serializers import UserExtensionSerializer
import django_filters
from django_filters.rest_framework import DjangoFilterBackend,OrderingFilter
from django.shortcuts import render,render_to_response#自定义sql查询开始
from django.template import RequestContext
from rest_framework import request
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.core import serializers
import json
from api import utils#自定义sql查询结束
from common.head import INT_TYPE, LIMIT
from common import tools
from common.constantcode import DBTypeCode,LoggerCode

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)

#
# class UserViewSet(viewsets.ModelViewSet):
#     """
#     API endpoint that allows users to be viewed or edited.
#     """
#     queryset = User.objects.all().order_by('-date_joined')
#     serializer_class = UserSerializer
#
#
# class GroupViewSet(viewsets.ModelViewSet):
#     """
#     API endpoint that allows groups to be viewed or edited.
#     """
#     queryset = Group.objects.all()
#     serializer_class = GroupSerializer

class UserFilter(filters.FilterSet):
    usernamefield = django_filters.CharFilter(name="username", lookup_expr='contains')
    emailfield = django_filters.CharFilter(name="email", lookup_expr='contains')

    class Meta:
        model = sys_userextension
        fields = ['usernamefield', 'emailfield']


class UserExtensionListView(generics.ListAPIView):
    queryset = sys_userextension.objects.all()
    serializer_class =UserExtensionSerializer
    filter_backends = (filters.OrderingFilter, filters.DjangoFilterBackend)
    filter_class = UserFilter
    ordering_fields = ('username','id')
    ordering = ('id','username')


# 获取全部用户信息
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getAllUser(request):
    result = {}
    try:
        user_list = sys_userextension.objects.filter(is_active='t')
        users = []
        for user_row in user_list:
            user = {}
            user['id'] = user_row.id
            user['username'] = user_row.username
            user['email'] = user_row.email
            user['mobile'] = user_row.mobile
            users.append(user)
        result['users'] = users
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        result['msg'] = e.args
        print('file:api.views;method:getAllUser')
        print(e)
    return Response(result)


@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def UserExtensionList(request):
    where = ''
    if 'search' in request.GET:
        where = where + """  where username like '%"""+ request.GET['search'] + """%' """
    if 'page' in request.GET:
        page = request.GET['page']
        offset = (int(request.GET['page']) - 1) * LIMIT
    # allcnt = utils.getResultBySql('select count(*) from account_sys_userextension '+where)[0][0]
    # fetchall = utils.getResultBySql(
    #     'select id,username,first_name,email,tagfield from account_sys_userextension ' +
    #     where + '  order by date_joined desc LIMIT ' + str(LIMIT) + ' offset ' +
    #     str(offset))
    fetchall = []
    executeSession = utils.SqlUtils()
    try:
        allcntQuerySet = executeSession.getArrResult('select count(*) from account_sys_userextension '+where)
        fetchall = executeSession.getArrResult(
            'select id,username,first_name,email,tagfield from account_sys_userextension ' +
            where + '  order by date_joined desc LIMIT ' + str(LIMIT) + ' offset ' + str(offset))
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:dashboardviews.py;method:get_imp_licence_logs;error:%s' % error)
    executeSession.closeConnect()
    allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups = []
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics['username'] = obj[1]
        dics['nickname'] = obj[2]   #将first_name作为nickname
        if not dics['nickname']:
            dics['nickname']=dics['username']
        dics['email'] = obj[3]
        dics['tagfield'] = json.loads(obj[4].replace("'", "\""))  if obj[4] is not None else []
        groups.append(dics)
    resultObj = tools.successMes()
    resultObj["rows"] = groups
    resultObj["total"] = allcnt
    return Response(resultObj)
    # return Response({'total': allcnt, 'rows': groups})

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getgrouplist(request):
    start = request.GET.get("startIndex","0") #&startIndex=0&count=10&orderBy=a.id+ASC 控件分页信息
    pagesize = request.GET.get("count","5")
    name = request.GET.get("param[name]")
    where = " where 1=1 "
    if name:
        where+=" and name like '%"+name+"%'"
    # allcnt = utils.getResultBySql('select count(*) from auth_group'+where)[0][0]
    # fetchall = utils.getResultBySql('select id,name from auth_group '+where+' order by id desc LIMIT '+pagesize+' offset '+start)
    fetchall = []
    executeSession = utils.SqlUtils()
    try:
        allcntQuerySet = executeSession.getArrResult('select count(*) from auth_group'+where)
        fetchall = executeSession.getArrResult('select id,name from auth_group '+where+' order by id desc LIMIT '+pagesize+' offset '+start)
    except Exception as error:
        executeSession.rollBack()
        resultObj = tools.errorMes(error.args)
        logger.error('---error---file:dashboardviews.py;method:get_imp_licence_logs;error:%s' % error)
        executeSession.closeConnect()
        return Response(resultObj)
    executeSession.closeConnect()
    allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0
    groups=[]
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics['name'] = obj[1]
        groups.append(dics)
    resultObj = tools.successMes()
    resultObj['data'] = groups
    resultObj['totalcount'] = allcnt
    return Response(resultObj)
    # return Response({'totalcount':allcnt,'datas':groups})


@api_view(http_method_names=['GET'])
def getgroupmodel(request):
    return Response(serializers.serialize("json", Group.objects.all()))


@api_view(http_method_names=['POST'])
def setgroup(request):
    # 清除缓存
    usermenu_cache(cleardata=True)
    id = request.data.get('id')  # 编辑对应id，如果新添加的则id=0 version = request.POST.get('no')
    name = request.data.get('name')
    resultObj = tools.successMes()
    session = utils.SqlUtils()
    try:
        # 没有name不执行sql
        if not name:
            resultObj = tools.errorMes('请输入角色/组名称(name)')
            return Response(resultObj)
        # 有id编辑
        if id:
            sql = '''UPDATE "public"."auth_group" SET "name" = '{}' WHERE "id" = {}'''.format(name, id)
            session.executeUpdateSql(sql)
        # 没有id添加
        else:
            sql = '''INSERT INTO "public"."auth_group"("name") VALUES ('{}') RETURNING *'''.format(name)
            session.executeUpdateSql(sql)
        session.closeConnect()
    except Exception as error:
        session.rollBack()
        resultObj = tools.errorMes(error.args)
        logger.error('---error---file:views.py;method:setgroup;error=%s' % error)
    return Response(resultObj)

@api_view(http_method_names=['GET'])
def delgroup(request):
    returnObj = tools.successMes()
    executeSession = utils.SqlUtils()
    try:
        groupid=request.GET.get('id')
        if not groupid:
            resultObj = tools.errorMes('没有该分组！')
            return Response(resultObj)
        forbiddenDelMsg=[]
        # 查询该role下是否分配了用户
        groupHasUserSql="""select count(1) from account_sys_userextension_groups where group_id="""+str(groupid)
        # groupHasUserCount=utils.getResultBySql(groupHasUserSql)[0][0]
        groupHasUserCount = executeSession.getArrResult(groupHasUserSql)
        if groupHasUserCount and groupHasUserCount[0][0] > 0:
            forbiddenDelMsg.append('有用户')
        #查询后台菜单是否使用了该role   #查询门户菜单是否使用了该role   #前后台菜单使用的同一个关联表account_group_menus
        groupHasDashMenuSql = """select count(1) from account_group_menus where group_id=""" + str(groupid)
        # groupHasDashMenuCount = utils.getResultBySql(groupHasDashMenuSql)[0][0]
        groupHasDashMenuCount = executeSession.getArrResult(groupHasDashMenuSql)
        if groupHasDashMenuCount and groupHasDashMenuCount[0][0] > 0:
            forbiddenDelMsg.append('有前台或后台菜单')
        # 查询组织机构里是否使用了该role
        groupHasOrgSql = """select count(1) from account_org_user_group where groupid=""" + str(groupid)
        # groupHasOrgCount = utils.getResultBySql(groupHasOrgSql)[0][0]
        groupHasOrgCount = executeSession.getArrResult(groupHasOrgSql)
        if groupHasOrgCount and groupHasOrgCount[0][0] > 0:
            forbiddenDelMsg.append('存在于组织机构中')
        if len(forbiddenDelMsg)>0:
            return Response(tools.errorMes("当前角色/组还"+'、'.join(forbiddenDelMsg)+"，不能够删除！"))
        else:
            Group.objects.get(id=groupid).delete()
    except Exception as err:
        logger.error('---error---file:views.py;method:delgroup;error:%s' % err)
        returnObj = tools.errorMes(err.args)
    executeSession.closeConnect()
    return Response(returnObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getgroupuser(request):
    groupid = request.GET.get("id","0") #&startIndex=0&count=10&orderBy=a.id+ASC 控件分页信息
    # fetchalluser = utils.getResultBySql('select id,username from account_sys_userextension ')
    # fetchall = utils.getResultBySql("select g.name,u.username,u.id as userid from auth_group g,account_sys_userextension_groups s,account_sys_userextension u where g.id=s.group_id and s.sys_userextension_id=u.id and g.id='"+groupid+"'")
    executeSession = utils.SqlUtils()
    try:
        fetchalluser = executeSession.getArrResult('select id,username from account_sys_userextension ')
        fetchall = executeSession.getArrResult("select g.name,u.username,u.id as userid from auth_group g,account_sys_userextension_groups s,account_sys_userextension u where g.id=s.group_id and s.sys_userextension_id=u.id and g.id='"+groupid+"'")
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:dashboardviews.py;method:get_imp_licence_logs;error:%s' % error)
        resultObj = tools.errorMes(error.args)
        return Response(resultObj)
    executeSession.closeConnect()

    groups=[]
    for obj in fetchall:
        dics = {}
        dics['groupname'] = obj[0]
        dics['username'] = obj[1]
        dics['id'] = obj[2]
        groups.append(dics)
    userall=[]
    for obj in fetchalluser:
        dics = {}
        dics['id'] = obj[0]
        dics['username'] = obj[1]
        userall.append(dics)
    resultObj = tools.successMes()
    resultObj['users'] = groups
    resultObj['allusers'] = userall
    return Response(resultObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getgroupmodel(request):
    menuid = request.GET.get("id","0")
    resultObj = tools.successMes()
    executeSession = utils.SqlUtils()
    try:
        fetchalluser = executeSession.getArrResult('select id,name from auth_group ')
        fetchall = executeSession.getArrResult("select m.group_id,g.name,m.menu_id from account_group_menus m LEFT JOIN auth_group g on m.group_id=g.id where m.menu_id='"+menuid+"'")
    except Exception as error:
        executeSession.rollBack()
        executeSession.closeConnect()
        logger.error('---error---file:views.py;method:getgroupmodel;error:%s' % error)
        resultObj = tools.errorMes(error.args)
        return Response(resultObj)
    executeSession.closeConnect()

    groups=[]
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics['username'] = obj[1]
        groups.append(dics)
    userall=[]
    for obj in fetchalluser:
        dics = {}
        dics['id'] = obj[0]
        dics['username'] = obj[1]
        userall.append(dics)
    resultObj['users'] = groups
    resultObj['allusers'] = userall
    return Response(resultObj)

@api_view(http_method_names=['POST'])
def setgroupuser(request):
    # 清除缓存
    usermenu_cache(cleardata=True)
    id = request.data.get('groupid')  # 编辑对应id，如果新添加的则id=0 version = request.POST.get('no')
    userids = request.data.get('userids')
    resultObj = tools.successMes()
    session = utils.SqlUtils()
    try:
        session.executeUpdateSql('delete from account_sys_userextension_groups where group_id=%s' % id)
        for userid in userids.split(','):
            if userid:  # 添加
                sql = 'insert into account_sys_userextension_groups(sys_userextension_id,group_id) values(%s,%s)' % (userid,id)
                session.executeUpdateSql(sql)
        session.closeConnect()
    except Exception as error:
        session.rollBack()
        logger.error('---error---file:views.py;method:setgroupuser;error=%s' % error)
        resultObj = tools.errorMes(error.args)
    return Response(resultObj)

##修改为两个按钮都可以调用的方法，update by lichuan 2018-3-22
# @api_view(http_method_names=['GET'])
# @permission_classes((permissions.AllowAny,))
# def getgrouppermission(request):
#     groupid = request.GET.get("id","0");#&startIndex=0&count=10&orderBy=a.id+ASC 控件分页信息
#     fetchallmenu= utils.my_sql_query('select m.id,m.name,m.parent_key,m.key,p.orderby,p.name parentname from dashboard_menu m,dashboard_menu p where m.parent_key=p.key and m.parent_key is not NULL')
#     fetchall = utils.my_sql_query("select u.name,g.name groupname,u.id as menuid from auth_group g,account_group_menus s,dashboard_menu u where g.id=s.group_id and s.menu_id=u.id and g.id='"+groupid+"'")
#     allmenu=[]
#     for obj in fetchallmenu:
#         dics = {}
#         dics['id'] = obj[0]
#         dics['name'] = obj[1]
#         dics['parent_key'] = obj[2]
#         dics['key'] = obj[3]
#         dics['orderby'] = obj[4]
#         dics['parentname'] = obj[5]
#         allmenu.append(dics)
#     menus=[]
#     for obj in fetchall:
#         dics = {}
#         dics['name'] = obj[0]
#         dics['groupname'] = obj[1]
#         dics['id'] = obj[2]
#         menus.append(dics)
#     return Response({'menus':menus,'allmenus':allmenu})

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getgrouppermission(request):
    groupid = request.GET.get("id","0") #&startIndex=0&count=10&orderBy=a.id+ASC 控件分页信息
    permissname=request.GET.get('permissname')
    if permissname=='grouppermiss':
        # fetchallmenu = utils.getResultBySql(
        #     'select m.id,m.name,m.parent_key,m.key,p.orderby,p.name parentname from dashboard_menu m,dashboard_menu p where m.parent_key=p.key and m.parent_key is not NULL')
        # fetchall = utils.getResultBySql(
        #     "select u.name,g.name groupname,u.id as menuid from auth_group g,account_group_menus s,dashboard_menu u where g.id=s.group_id and s.menu_id=u.id and g.id='" + groupid + "'")
        fetchallmenu = []
        fetchall = []
        executeSession = utils.SqlUtils()
        try:
            fetchallmenu = executeSession.getArrResult('select m.id,m.name,m.parent_key,m.key,p.orderby,p.name parentname from dashboard_menu m,dashboard_menu p where m.parent_key=p.key and m.parent_key is not NULL')
            fetchall = executeSession.getArrResult("select u.name,g.name groupname,u.id as menuid from auth_group g,account_group_menus s,dashboard_menu u where g.id=s.group_id and s.menu_id=u.id and g.id='" + groupid + "'")
        except Exception as error:
            executeSession.rollBack()
            logger.error('---error---file:views.py;method:getgrouppermission;error:%s' % error)
            resultObj = tools.errorMes(error.args)
            executeSession.closeConnect()
            return Response(resultObj)
        executeSession.closeConnect()
    elif permissname=='portalmpermiss':
        # fetchallmenu = utils.getResultBySql(
        #     'select m.id,m.name,m.parent_key,m.key,p.orderby,p.name parentname from dashboard_portalmenu m,dashboard_portalmenu p where m.parent_key=p.key and m.parent_key is not NULL')
        # fetchall = utils.getResultBySql(
        #     "select p.name,g.name groupname,p.id as menuid from auth_group g,account_group_menus s,dashboard_portalmenu p where g.id=s.group_id and s.menu_id=p.id and g.id='" + groupid + "'")
        fetchallmenu = []
        fetchall = []
        executeSession = utils.SqlUtils()
        try:
            fetchallmenu = executeSession.getArrResult('select m.id,m.name,m.parent_key,m.key,p.orderby,p.name parentname from dashboard_portalmenu m,dashboard_portalmenu p where m.parent_key=p.key and m.parent_key is not NULL')
            fetchall = executeSession.getArrResult("select p.name,g.name groupname,p.id as menuid from auth_group g,account_group_menus s,dashboard_portalmenu p where g.id=s.group_id and s.menu_id=p.id and g.id='" + groupid + "'")
        except Exception as error:
            executeSession.rollBack()
            logger.error('---error---file:views.py;method:getgrouppermission;error:%s' % error)
            resultObj = tools.errorMes(error.args)
            executeSession.closeConnect()
            return Response(resultObj)
        executeSession.closeConnect()
    else:
        resultObj = tools.successMes()
        resultObj['menus'] = []
        resultObj['allmenus'] = []
        return Response(resultObj)

    allmenu=[]
    for obj in fetchallmenu:
        dics = {}
        dics['id'] = obj[0]
        dics['name'] = obj[1]
        dics['parent_key'] = obj[2]
        dics['key'] = obj[3]
        dics['orderby'] = obj[4]
        dics['parentname'] = obj[5]
        allmenu.append(dics)
    menus=[]
    for obj in fetchall:
        dics = {}
        dics['name'] = obj[0]
        dics['groupname'] = obj[1]
        dics['id'] = obj[2]
        menus.append(dics)
    resultObj = tools.successMes()
    resultObj['menus'] = menus
    resultObj['allmenus'] = allmenu
    return Response(resultObj)


@api_view(http_method_names=['POST'])
def setgrouppermission(request):
    # 清除菜单缓存数据
    usermenu_cache(cleardata=True)
    results = tools.successMes()
    session = utils.SqlUtils()
    try:
        groupId = request.data.get('groupId')
        menuIds = request.data.get('menuIds')
        menuType = request.data.get('type')
        # 后台菜单权限
        baseSql = '(SELECT ID FROM '
        if menuType == 'grouppermiss':
            baseSql = baseSql + 'dashboard_menu)'
        # 前台菜单权限
        elif menuType == 'portalmpermiss':
            baseSql = baseSql + 'dashboard_portalmenu)'

        # session.executeUpdateSql('DELETE FROM account_group_menus where group_id = ' + groupId + ' AND menu_id IN ' + baseSql)
        session.executeUpdateSql('DELETE FROM account_group_menus where group_id = {} AND menu_id IN {}'.format(groupId,baseSql))
        for menuId in menuIds.split(','):
            if menuId:  # 添加
                sql = 'insert into account_group_menus(menu_id, group_id, orderby) values(\'%s\', %s, %s)' % (menuId, groupId, 0)
                session.executeUpdateSql(sql)
        session.closeConnect()
    except Exception as e:
        session.rollBack()
        print('file:api.views; method:setgrouppermission')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getuserpermission(request):
    groupid = request.GET.get("id","0") #&startIndex=0&count=10&orderBy=a.id+ASC 控件分页信息
    # fetchallmenu= utils.getResultBySql('select m.id,m.name,m.parent_key,m.key,p.orderby,p.name parentname from dashboard_menu m,dashboard_menu p where m.parent_key=p.key and m.parent_key is not NULL')
    # fetchall = utils.getResultBySql("select u.name,g.username,u.id as menuid from account_sys_userextension g,account_user_menus s,dashboard_menu u where g.id=s.user_id and s.menu_id=u.id and g.id='"+groupid+"'")
    fetchallmenu = []
    fetchall = []
    executeSession = utils.SqlUtils()
    try:
        fetchallmenu = executeSession.getArrResult(
            'select m.id,m.name,m.parent_key,m.key,p.orderby,p.name parentname from dashboard_menu m,dashboard_menu p where m.parent_key=p.key and m.parent_key is not NULL')
        fetchall = executeSession.getArrResult(
            "select u.name,g.username,u.id as menuid from account_sys_userextension g,account_user_menus s,dashboard_menu u where g.id=s.user_id and s.menu_id=u.id and g.id='"+groupid+"'")
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:views.py;method:getuserpermission;error:%s' % error)
    executeSession.closeConnect()

    allmenu=[]
    for obj in fetchallmenu:
        dics = {}
        dics['id'] = obj[0]
        dics['name'] = obj[1]
        dics['parent_key'] = obj[2]
        dics['key'] = obj[3]
        dics['orderby'] = obj[4]
        dics['parentname'] = obj[5]
        allmenu.append(dics)
    menus=[]
    for obj in fetchall:
        dics = {}
        dics['name'] = obj[0]
        dics['username'] = obj[1]
        dics['id'] = obj[2]
        menus.append(dics)
    resultObj = tools.successMes()
    resultObj['menus'] = menus
    resultObj['allmenus'] = allmenu
    return Response(resultObj)
    # return Response({'menus':menus,'allmenus':allmenu})


@api_view(http_method_names=['POST'])
def setuserpermission(request):
    id = request.data.get('userid')
    menuids = request.data.get('menuids')
    session = utils.SqlUtils()
    try:
        session.executeUpdateSql('delete from account_user_menus where user_id=%s' % id)
        for menuid in menuids.split(','):
            if menuid:  # 添加
                sql = 'insert into account_user_menus(menu_id,user_id,orderby) values(%s,%s,%s)' % (menuid, id, 0)
                session.executeUpdateSql(sql)
        session.closeConnect()
        resultObj = tools.successMes()
    except Exception as error:
        session.rollBack()
        logger.error('---error---file:views.py;method:setuserpermission;error=%s' % error)
        resultObj = tools.errorMes(error)
    return Response(resultObj)
