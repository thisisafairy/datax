import json
import logging

from django.contrib.auth import get_user
from django.db.models import Q
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from api import utils
from common import globalvariable as glbv
from common import tools
from common.constantcode import DBTypeCode, LoggerCode
from dashboard.models import *


logger = logging.getLogger(LoggerCode.DJANGOINFO.value)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getTypeList(request):
    fetchall = charttype.objects.filter(Q(parent_id__isnull=True)|Q(parent_id=0)).order_by('orderby')
    result = []
    for row in fetchall:
        if row.status == '1':
            dist = {}
            dist['name'] = row.type_name
            dist['code'] = row.id
            result.append(dist)
    return Response(result)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getTypeTree(request):
    try:
        fetchall = charttype.objects.filter(Q(parent_id__isnull=True)|Q(parent_id=0)).order_by('orderby')
        # print('fetchall=',fetchall)
        resultObj = tools.successMes()
        resultObj['data'] = []
        for row in fetchall:
            dist = makeDist(row)
            dist['$$treeLevel'] = 0
            resultObj['data'].append(dist)
            id = row.id
            child = charttype.objects.filter(parent_id=id)
            for childrow in child:
                childdist = makeDist(childrow)
                resultObj['data'].append(childdist)
    except Exception as e:
        resultObj = tools.errorMes(e.args)
    return Response(resultObj)

def makeDist(row,pathname=''):
    dist = {}
    dist['id'] = row.id
    dist['type_name'] = row.type_name
    dist['parent_id'] = row.parent_id
    dist['status'] = row.status
    return dist

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getTypeDetail(request,pk):
    resultObj = tools.successMes()
    try:
        typedetail = charttype.objects.get(id=pk)
        dist={}
        dist['type_name'] = typedetail.type_name
        dist['id'] = typedetail.id
        dist['parent_id'] = typedetail.parent_id
        if typedetail.parent_id == '0':
            dist['parent_name'] = '无'
        else:
            parent = charttype.objects.get(id=typedetail.parent_id)
            dist['parent_name'] = parent.type_name
        dist['status'] = typedetail.status
        dist['level'] = typedetail.level
        dist['orderby'] = typedetail.orderby
        resultObj['data'] = dist
    except Exception as e:
        resultObj = tools.errorMes(e.args)
    print(resultObj)
    return Response(resultObj)

@api_view(http_method_names=['POST'])
def savetype(request):
    user = get_user(request)
    id = request.data.get('id')
    type_name = request.data.get('type_name')
    parent_id = request.data.get('parent_id')
    orderby = request.data.get('orderby')
    status = request.data.get('status')
    level = request.data.get('level')
    resultObj = tools.successMes()
    # 新增
    if not id or id == '0':
        try:
            charttype.objects.get_or_create(type_name=type_name, create_user=user.id,
                                            parent_id=parent_id, orderby=orderby,
                                            status=status, level=level)
        except Exception as e:
            resultObj = tools.errorMes(e.args)

    # 编辑
    else:
        import datetime
        try:
            p = charttype.objects.get(id=id)
            p.type_name = type_name
            p.parent_id = parent_id
            p.status = status
            p.motify_time = datetime.datetime.now()
            p.orderby = orderby
            p.save()
        except Exception as e:
            resultObj = tools.errorMes(e.args)
    return Response(resultObj)

@api_view(http_method_names=['POST'])
def deleteType(request):
    resultObj = tools.successMes()
    try:
        id = request.data['pk']
        charttype.objects.filter(id=id).delete()
    except Exception as e:
        resultObj = tools.errorMes(e.args)
    return Response(resultObj)


@api_view(http_method_names=['GET'])
def getEmuTypes(request):
    resultsObj = tools.successMes()
    try:
        emuType = request.GET['type']
        if emuType == 'static':
            resultsObj['data'] = eval('glbv.' + request.GET['emuName'])
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:typeviews.py;method:getEmuTypes;error=%s' % error)
    return Response(resultsObj)


@api_view(http_method_names=['GET'])
def getDictParents(request):
    resultsObj = tools.successMes()
    try:
        sql = '''
            SELECT * FROM dashboard_data_dictionary WHERE "code" IN 
            (SELECT DISTINCT "parent_id" FROM dashboard_data_dictionary WHERE "parent_id" IS NOT NULL AND "parent_id" <> '0') 
            AND "status" = '1' 
        '''
        resultData = utils.SqlUtils().getArrResultWrapper(sql)
        resultsObj['data'] = resultData
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:typeviews.py;method:getEmuTypes;error=%s' % error)
    return Response(resultsObj)
