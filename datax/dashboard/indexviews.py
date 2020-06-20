from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import json
from django.db.models import Q
from dashboard.models import *
from connect.models import olap
from api import utils as sqlutils
from dashboard.models import menu


@login_required
def singleIndexMonitorEdit(request):
    return render(request, "dashboard/singleindex/singleindexmonitoredit.html")


@login_required
def openSavePage(request):
    return render(request, "dashboard/singleindex/saveSingleIndex.html")


# 根据表名，列名查询出要显示的指标
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def processSingleIndex(request):
    result = {}
    olap_id = request.data['olap_id']
    table_name = request.data['table_name']
    column_name = request.data['column_name']
    column_handle_type = request.data['column_handle_type']
    olapRow = olap.objects.get(id=olap_id)
    table = olapRow.table
    try:
        maxVarsion = "select max(version) as version from " + table
        rs = sqlutils.getResultBySql(maxVarsion,sqlutils.DATAXEXTENSION_DB_CHAR)
        version = 1
        if rs[0][0] == None:
            version = 1
        else:
            version = int(rs[0][0])
        sql = "SELECT " + column_handle_type + "(\""+table_name + "__" + column_name + "\") FROM " + table+ " where version =  '" + str(version) + "' "
        result_data = sqlutils.getResultBySql(sql,sqlutils.DATAXEXTENSION_DB_CHAR)
        result['data'] = result_data[0][0]
        result['code'] = '1'
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
        print('file:singleindexviews;method:processSingleIndex')
        print(e)

    return Response(result)


# 保存单指标
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveSingleIndex(request):
    result = {}
    chartObj = request.data
    try:
        # 新增
        if 'id' not in chartObj:
            row = charts.objects.create(name=chartObj['name'], kind=chartObj['kind'], jsonconfig=chartObj['jsonconfig']
                                        , remark=chartObj['remark']
                                        , charttype=chartObj['charttype'], keywords=chartObj['keywords'], refreshspeed=chartObj['refreshspeed'])
        else:
            row = charts.objects.get(id=int(chartObj['id']))
            row.name = chartObj['name']
            row.kind = chartObj['kind']
            row.jsonconfig = chartObj['jsonconfig']
            row.remark = chartObj['remark']
            row.charttype = chartObj['charttype']
            row.keywords = chartObj['keywords']
            row.refreshspeed = chartObj['refreshspeed']
            row.save()
        result['data_key'] = row.id
        result['code'] = '1'
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
        print('file:singleindexviews;method:saveSingleIndex')
        print(e)

    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getIndexConfig(request):
    id = int(request.query_params['id'])
    result = {}
    try:
        fetchall = menu.objects.order_by('orderby')
        menus = []
        for row in fetchall:
            menuObj = {}
            menuObj['id'] = row.key
            menuObj['value'] = row.name
            menuObj['url'] = row.url
            if row.parent_key:
                menuObj['parent'] = row.parent_key
            menus.append(menuObj)
        result['menus'] = menus

        if id > -1:
            moduleConfigs = moduleconfigs.objects.get(id=int(id))
        else:
            moduleConfigs = moduleconfigs.objects.get()
        result['moduleConfigKey'] = moduleConfigs.id
        result['moduleConfigs'] = moduleConfigs.module_configs
        result['indexTitle'] = moduleConfigs.index_title

        result['code'] = '1'
    except Exception as e:
        result['code'] = '0'
        result['indexTitle'] = '欢迎使用数据眼! 让数据分析更简单'
        result['msg'] = e.args
        print('file:indexviews;method:getIndexConfig')
        print(e)

    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveIndexConfig(request):
    result = {}
    try:
        cols = json.dumps(request.data['cols'])
        id = request.data['id']
        title = request.data['title']
        if id == -1:
            row = moduleconfigs.objects.create(index_title=title ,module_configs=cols)
        else:
            row = moduleconfigs.objects.get(id=id)
            row.index_title = title;
            row.module_configs = cols;
            row.save()
        result['moduleConfigKey'] = row.id
        result['code'] = '1'
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
        print('file:indexviews;method:saveIndexConfig')
        print(e)

    return Response(result)