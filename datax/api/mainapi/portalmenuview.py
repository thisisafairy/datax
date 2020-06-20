from django.db.models import Q
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes

from common import tools
from dashboard.models import portalmenu
from rest_framework.response import Response
from api import utils
from dashboard.models import permission_detail
from django.contrib.auth import get_user
from account.models import group_menus
import random,string
from common.constantcode import DBTypeCode,LoggerCode
import json

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)

# 获取所有门户菜单数据
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getProtalMenuTree(request):
    resultObj = tools.successMes()
    try:
        fetchall = portalmenu.objects.filter(Q(parent_key__isnull=True)|Q(parent_key='')).order_by('orderby')
        resultObj["data"] = []
        for row in fetchall:
            dist = makeDist(row)
            dist['$$treeLevel'] = 0
            resultObj['data'].append(dist)
            key = row.key
            child = portalmenu.objects.filter(parent_key=key)
            for childrow in child:
                childdist = makeDist(childrow)
                resultObj['data'].append(childdist)
    except Exception as e:
        resultObj = tools.errorMes(e.args)
    return Response(resultObj)


def makeDist(row,pathname=''):
    dist = {}
    dist['id'] = row.id
    dist['name'] = row.name
    dist['key'] = row.key
    dist['url'] = row.url
    dist['parent_key'] = row.parent_key
    dist['orderby'] = row.orderby
    dist['permission_name'] = row.permission_name
    dist['allowusers'] = row.allowusers
    dist['icon'] = row.icon
    try:
        if row.url != '/':
            pathname.index(row.url)
            dist['is_active'] = True
        else:
            dist['is_active'] = False
    except:
        dist['is_active'] = False
        pass
    # if pathname == row.url:
    #     dist['is_active'] = True
    # else:
    #     dist['is_active'] = False
    return dist


# 保存门户菜单数据
@api_view(http_method_names=['POST'])
def savePortalMenu(request):
    id = request.data.get('id')
    name = request.data.get('name')
    url = request.data.get('url')
    parent_key = request.data.get('parent_key')
    orderby = request.data.get('orderby')
    icon = request.data.get('icon')
    desc = request.data.get('desc')
    resultObj = tools.successMes()
    # 编辑
    if id and len(id)>0:
        row = portalmenu.objects.get(id=id)
        row.name = name
        row.url = url
        if parent_key:
            row.parent_key = parent_key
        if orderby:
            row.orderby = orderby
        if icon:
            row.icon = icon
        if desc:
            row.options = {}
            row.options['desc'] = desc
        try:
            row.save()
        except Exception as e:
            resultObj = tools.errorMes(e.args)
    # 新增
    else:
        options = {}
        if desc:
            options['desc'] = desc
        if not orderby:
            orderby = 0
        try:
            portalmenu.objects.get_or_create(key=''.join(random.sample(string.ascii_letters + string.digits, 15)),
                                             name=name, url=url
                                             , parent_key=parent_key, icon=icon, orderby=orderby,
                                             options=json.dumps(options))
        except Exception as e:
            resultObj = tools.errorMes(e.args)
    return Response(resultObj)


# 获取单个菜单信息
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getPortalMenuDetail(request):
    resultObj = tools.successMes()
    try:
        oper_type = request.GET['oper_type']
        id = request.GET['id']
        # 有门户id 获取门户
        if len(id) > 5:
            menudetail = portalmenu.objects.get(id=id)
            # 删除
            if oper_type == 'delete':
                rows = portalmenu.objects.filter(parent_key=menudetail.key)
                if rows.count():
                    rows.delete()
                menudetail.delete()
            # 编辑
            if oper_type == 'update':
                resultObj['data']['name'] = menudetail.name
                resultObj['data']['id'] = menudetail.id
                resultObj['data']['url'] = menudetail.url
                resultObj['data']['icon'] = menudetail.icon
                resultObj['data']['orderby'] = menudetail.orderby
                resultObj['data']['options'] = menudetail.options
                if menudetail.parent_key:
                    resultObj['data']['parent_key'] = menudetail.parent_key
            # 新增
            if oper_type == 'add':
                resultObj['data']['parent_key'] = menudetail.key
    except Exception as e:
        resultObj = tools.errorMes(e.args)
    return Response(resultObj)


# 获取门户菜单
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getPortalTree(request):
    result = []
    user = get_user(request)
    user_id = user.id
    permissionlists = permission_detail.objects.filter(user_id=user_id, permission_type='portal')
    allid = []
    for row in permissionlists:
        allid.append(row.target_id)

    permissionstr = ','.join(allid)


    try:
        parents = []
        # if len(allid) > 0:
        # sql = "SELECT * FROM dashboard_portalmenu WHERE id in ("+ permissionstr +") and  parent_key IS NULL OR parent_key = ''  ORDER BY orderby"
        # rows = utils.my_sql_query(sql )
        rows = portalmenu.objects.filter(id__in=allid,parent_key='')
        for row in rows:
            menu = makeDist(row)
            menu = getChild(menu,allid)
            parents.append(menu)
        result = parents
    except Exception as e:
        print('file:portalmenuview;method:getPortalTree')
        print(e)

    return Response(result)


# 获取子节点
def getChild(menu, id=[]):
    parent_key = menu['key']
    chirdrens = portalmenu.objects.filter(parent_key = parent_key,id__in=id)
    menu['chirdrens'] = []
    if len(chirdrens) > 0:
        menu['hasChild'] = '1'
        for chirdren in chirdrens:
            menu['chirdrens'].append(makeDist(chirdren))
    else:
        menu['hasChild'] = '0'
    return menu



@api_view(http_method_names=['POST'])
def setMenuusers(request):
    id = request.data['id']  # 编辑对应id，如果新添加的则id=0 version = request.POST.get('no')
    allowusers = request.data['allowusers']
    try:
        permission_detail.objects.filter(target_id=id,permission_type='portal').delete()
    except:
        pass

    for row in allowusers:
        try:
            permission_detail.objects.get_or_create(user_id=row['id'], target_id=id, permission_type='portal')
        except:
            pass
    # portalmenu.objects.filter(id=id).update(allowusers=allowusers)
    return Response({
        "status": "ok"
    })

@api_view(http_method_names=['POST'])
def setMenuGroups(request):
    id = request.data['id']  # 编辑对应id，如果新添加的则id=0 version = request.POST.get('no')
    allgroupid = request.data['allgroupid']
    resultObj = tools.successMes()
    ##首先根据传入的menu_id删除所有，然后在根据传入的数据值进行插入
    session = utils.SqlUtils()
    try:
        sql = '''DELETE FROM "public"."account_group_menus" WHERE "menu_id" = '{}' '''.format(id)
        session.executeUpdateSql(sql)

        for gid in allgroupid.split(','):    #添加
            if gid:
                sql = '''INSERT INTO "public"."account_group_menus"("group_id", "menu_id", "orderby") VALUES ({}, '{}', 0) RETURNING *'''.format(gid,id)
                session.executeUpdateSql(sql)

        session.closeConnect()
    except Exception as error:
        session.rollBack()
        logger.error('---error---file:portalmenuview.py;method:setMenuGroups;error=%s' % error)
        session.closeConnect()
        resultObj = tools.errorMes(error.args)
    return Response(resultObj)