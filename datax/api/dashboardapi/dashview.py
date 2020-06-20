# encoding: utf-8
from rest_framework import permissions
from django.contrib.auth import get_user
from account.models import sys_userextension
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from connect.models import *
from dashboard.models import *
from connect.olap import  olapFilter
import json
from urllib import parse
from django.forms.models import model_to_dict
from common import tools
from common.constantcode import DBTypeCode,LoggerCode
from api import utils as sqlutils
from connect import odbcsqltool,sqltool
from dashboard import pd_tools
import pandas as pd
import math
import time
from api import utils
from dashboard.dash_utils import ReportUtils
import logging
import re
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)




@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlaplists(request):
    filterSJTQ = request.GET['directconnisnull'] if 'directconnisnull' in request.GET else ''    #过滤数据提取的数
    if filterSJTQ :
        olaps = olap.objects.filter(enabled='y',directconn__isnull=True).order_by('-modify_date')
    else :
        olaps = olap.objects.filter(enabled='y').order_by('-modify_date')

    charttypes = charttype.objects.filter()
    lists = []
    for olaprow in olaps:
        dist = {}
        dist['name'] = olaprow.name
        dist['description'] = olaprow.desc
        dist['url'] = '/api/dash/getOlapData/' + str(olaprow.id)
        dist['totalurl'] = '/api/dash/loadTableData'
        dist['id'] = str(olaprow.id)
        dist['group'] = olaprow.businesstype
        dist['olaptypeid'] = olaprow.charttype
        dist['olaptype'] = getChartTypeName(charttypes, olaprow.charttype)
        lists.append(dist)
    return Response(lists)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def getOlapColumnsByOlapIds(request):
    results = tools.successMes()
    try:
        results['data'] = []
        ids = request.data['ids']
        if len(str(ids)) > 0:
            idArr = []
            if str(ids).find(',') > -1:
                idArr = str(ids).split(',')
            else:
                idArr.append(ids)
            for id in idArr:
                olaprow = olap.objects.get(id=id)
                olapcolumns = olapcolumn.objects.filter(olapid=id)
                colList = []
                for oc in olapcolumns:
                    field = oc.column
                    dist = {}
                    dist['col'] = field
                    dist['name'] = field
                    dist['olapid'] = olaprow.id
                    dist['olapname'] = olaprow.name
                    if oc.title != '':
                        dist['name'] = oc.title
                    colList.append(dist)
                if len(colList) > 0:
                    results['data'].append({
                        'id': olaprow.id,
                        'name': olaprow.name,
                        'kind': olaprow.charttype,
                        'cols': colList
                    })
    except Exception as e:
        # print('file:dashview; method:getOlapColumnsByOlapIds')
        print(e)
        return Response(tools.errorMes(e.args))

    return Response(results)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlapExtCol(request):
    results = tools.successMes()
    try:
        olapId = request.GET['id']
        olapObj = olap.objects.get(id=str(olapId))
        olapColumns = olapcolumn.objects.filter(olapid=str(olapId))
        olapExtCols = olapextcols.objects.filter(olapid=str(olapId))
        results['data']['olapObj'] = model_to_dict(olapObj);
        results['data']['olapColumns'] = [];
        for olapColumn in olapColumns:
            results['data']['olapColumns'].append(model_to_dict(olapColumn))
        results['data']['olapExtCols'] = []
        for olapExtCol in olapExtCols:
            results['data']['olapExtCols'].append(model_to_dict(olapExtCol))
    except Exception as e:
        # print('Exception Class: dashview.py; Exception Method: getOlapExtCol:')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)

def getChartTypeName(charttypes, typeid):
    typename = ''
    for charttype in charttypes:
        if charttype.id == typeid:
            typename = charttype.type_name
            break
    return typename;


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveExtCol(request):
    results = tools.successMes()
    try:
        mainOlapId = request.data['mainOlapId']
        mainOlapTable = request.data['mainOlapTable']
        extCols = request.data['extCols']
        extCalcCols = request.data['extCalcCols']
        # 删除olapcolumn表和olap表中对应的列,和olapextcols表中的对应字段
        olapcolumn.objects.filter(olapid=str(mainOlapId), column__contains="ext_col_num_").delete()
        olapextcols.objects.filter(olapid=str(mainOlapId)).delete()
        try:
            tableCols = sqlutils.SqlUtils(DBTypeCode.SYSTEM_DB.value).getTableStructure(mainOlapTable)
        except Exception as error:
            logger.error('---error---file:dashview.py;method:saveExtCol;line:151;error=', error)
            print('---error---file:dashview.py;method:saveExtCol;error=', error)

        executeSqlSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        try:
            for col in tableCols:
                if 'ext_col_num_' in col['column_name']:
                    executeSqlSession.executeUpdateSql('alter table ' + mainOlapTable + ' drop column ' + col['column_name'] + '', None,
                                       sqlutils.DATAXEXTENSION_DB_CHAR)
            # 保存
            extColCnt = 1

            for extCol in extCols:
                extCol['title'] = 'ext_col_num_'+str(extColCnt)
                olapextcols.objects.get_or_create(olapid=str(mainOlapId), title=extCol['title'], name=str(extCol['colName']),
                    coltype='default', configs=json.dumps(extCol))
                sql = 'ALTER TABLE ' + mainOlapTable + ' ADD ' + extCol['title'] + ' '+('varchar(500)' if not extCol['fieldType'] else extCol['fieldType'])
                executeSqlSession.executeUpdateSql(sql)
                olapcolumn.objects.get_or_create(olapid=str(mainOlapId), column=extCol['title'], title=str(extCol['colName']))
                extColCnt = extColCnt + 1

            for extCol in extCalcCols:
                extCol['title'] = 'ext_col_num_'+str(extColCnt)
                olapextcols.objects.get_or_create(olapid=str(mainOlapId), title=extCol['title'], name=str(extCol['colName']),
                    coltype='calc', configs=json.dumps(extCol))
                sql = 'ALTER TABLE ' + mainOlapTable + ' ADD ' + extCol['title'] + ' '+('varchar(500)' if not extCol['fieldType'] else extCol['fieldType'])
                executeSqlSession.executeUpdateSql(sql)
                olapcolumn.objects.get_or_create(olapid=str(mainOlapId), column=extCol['title'], title=str(extCol['colName']))
                extColCnt = extColCnt + 1
            executeSqlSession.closeConnect()  # 手动commit然后关闭连接，如果抛出异常就回滚
        except Exception as error:
            executeSqlSession.rollBack()
            logger.log('---error---file:dashview.py;method:saveExtCol;error=%s' % error)

        # tasks.addOlapExtCol(str(mainOlapId), str(mainOlapTable))
    except Exception as e:
        # print('Exception Class: dashview.py; Exception Method: saveExtCol:')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def showExtCols(request):
    results = tools.successMes()
    try:
        mainOlapId = request.data['mainOlapId']
        rows = olapextcols.objects.filter(olapid=str(mainOlapId))
        results['rows'] = []
        for row in rows:
            colObj = json.loads(row.configs)
            obj = {}
            if row.coltype == 'default':
                obj['name'] = colObj['colName']
                obj['sourceCol'] = colObj['olapColName']
                obj['sourceOlap'] = colObj['olapName']
            elif row.coltype == 'calc':
                obj['name'] = colObj['colName']
                obj['sourceCol'] = colObj['displayCalcFormula']
                obj['sourceOlap'] = ''
                for col in colObj['cols']:
                    if 'olapName' in col:
                        obj['sourceOlap'] = obj['sourceOlap'] + col['olapName'] + ','
                if len(obj['sourceOlap']) > 1:
                    obj['sourceOlap'] = obj['sourceOlap'][:-1]
            results['rows'].append(obj)
    except Exception as e:
        # print('Exception Class: dashview.py;  Method: showExtCols:')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)




def get_time_format(time_type, column, database_type):
    """
    getOlapDataShow子方法 根据传递的时间类型、字段名称和数据库类型返回需要的时间格式 。
    用于日期取值功能： 只取每种数据库的年月日，按年月日汇总后 其他的计算由pands完成
    """
    dimcols = []                                                                           # 存储所返回的结果
    if database_type == 'mssql':  # 适用于sql server数据库
        if time_type == 'quate':  # 季度
            dimcols.append('(month(' + column + ')+2)/3')
        elif time_type == '>':  # 年月日
            dimcols.append(column)
        elif time_type == '>=':  # 年月
            dimcols.append('convert(varchar(7),' + column + ', 121)')
        elif time_type == '<':  # 年季度
            dimcols.append('cast (year(' + column + ')as varchar)' + " + '年' + "
                           + 'cast((month(' + column + ')+2)/3 as varchar)' + " + '季度'")
        else:
            dimcols.append('Datepart(' + time_type + "," + column + ')')  # 年、月、日
    elif database_type == 'mysql':
        if time_type == 'year':
            dimcols.append("year(" + column + ")")
        elif time_type == 'month':
            dimcols.append("month(" + column + ")")
        elif time_type == 'day':
            dimcols.append("day(" + column + ")")
        elif time_type == 'quate':
            dimcols.append('floor((month(' + column + ')+2)/3)')  # 得到的季度值 去除小数位
        elif time_type == '>':
            dimcols.append('date(' + column + ")")
        elif time_type == '>=':
            dimcols.append('left(' + column + ",7)")
        elif time_type == '<':
            dimcols.append("CONCAT(YEAR(" + column + "), '年', floor((month(" + column + ") + 2) / 3), '季度')")
    else:  # 适用于pg库和oracle库
        if time_type == 'year':  # 年
            dimcols.append("to_char(" + '"' + column + '"' + ",'yyyy')")
        elif time_type == 'month':
            dimcols.append("to_char(" + '"' + column + '"' + ",'mm')")
        elif time_type == 'day':
            dimcols.append("to_char(" + '"' + column + '"' + ",'dd')")
        elif time_type == 'quate':
            if database_type == 'oracle':
                dimcols.append("cast(((cast(to_char(" + '"' + column + '"' + ",'mm') as int ) + 2 ) /3)as int)")
            else:
                dimcols.append("(cast(to_char(" + '"' + column + '"' + ",'mm') as int ) + 2 ) /3")
        elif time_type == '>':
            dimcols.append("date(" + column + ")")
        elif time_type == '>=':
            dimcols.append("to_char(" + '"' + column + '"' + ",'yyyy-mm')")
        elif time_type == '<':
            if database_type == 'oracle':
                dimcols.append("to_char(" + '"' + column + '"' + ",'yyyy') || ' ' "
                                                                 "|| cast(((cast(to_char(" + column + ",'mm') as int ) + 2 ) /3)as int) || 'quarter'")
            else:
                dimcols.append("to_char(" + '"' + column + '"' + ",'yyyy') || '年' "
                                                                 "|| (cast(to_char(" + column + ",'mm') as int ) + 2 ) /3 || '季度'")
    return dimcols




def singleIndexRank(kpiColsDict,dimcols,groupcols,olapobj,additionalFilters):
    queryConditions = []  # sql过滤条件（页面传入的过滤条件）
    rsDataFilter = []  # 结果集过滤条件，对statsKPIByDIM返回的结果进行过滤并最终返回给页面
    # ## 用户tag 过滤 end
    # 对结果进行过滤的rsDataFilter
    qryConditions = []
    rsDtFilters = []
    strlist = []#从olapcolumn获取strlist
    #拼接参数
    kpicols=[]#从kpiColsDict获取kpicols
    for kpiDict in kpiColsDict:
        if 'column' in kpiDict:
            kpicols.append(kpiDict['column'])
    #从olapcolumn里获取strlist
    olapcolumns=olapcolumn.objects.filter(olapid=olapobj.id)
    for column in olapcolumns:
        field = column.column
        dist = {}
        if field.find('__') >= 0 and olapobj.directconn != 't':
            arr = field.split('__')
            tablename = arr[0]
            col = arr[1]
            dist['col'] = field
            try:
                sourcedetailrow = sourcedetail.objects.get(sourceid=olapobj.sourceid,
                                                           column=col,table=tablename)
                dist['name'] = sourcedetailrow.title
            except Exception as e:
                dist['name'] = field
                pass
        else:
            dist['col'] = field
            dist['name'] = field
        if column.title != '':
            dist['name'] = column.title
        strlist.append(dist)
    #拼接参数结束
    for filterObj in additionalFilters:
        filterDictObj = {}
        # 如果传入的filtercolumn是中文则需要转换成英文
        filterDictObj['name'] = filterObj['colName']
        filterDictObj['operate'] = filterObj['rule']
        filterDictObj['value'] = filterObj['value']
        filterDictObj['connect'] = 'and'
        if filterDictObj['name'] not in dimcols:  # 如果过滤字段不在维度字段中就执行sql过滤
            qryConditions.append(filterDictObj)
        else:  # 如果过滤字段在维度字段中就对结果集进行过滤
            rsDtFilters.append(filterDictObj)

    queryConditions.append({'conditions': qryConditions})  # sql过滤条件（页面传入的过滤条件）
    rsDataFilter.append({'conditions': rsDtFilters})  # 结果集过滤条件，对statsKPIByDIM返回的结果进行过滤并最终返回给页面
    # print("queryConditions",queryConditions)
    # print("rsDataFilter",rsDataFilter)
    #####如果请求是需要返回排名######
    # if dimcols and olaprow.directconn not in direConnStatus:
    rsData = []
    if dimcols:
        try:
            # print('-------dimcols+groupcols--------', dimcols + groupcols)
            # print('-------kpicols--------', kpicols)
            # print('-------groupcols--------', groupcols)
            # print('-------olapobj.table--------', olapobj.table)
            # print('-------olapobj--------', olapobj)
            # print('-------queryConditions--------', queryConditions)
            groupeddata = pd_tools.statsKPIByDIM(dims=(dimcols + groupcols), kpis=kpicols, groups=groupcols,
                                                 olapObj=olapobj, conditions=queryConditions, rankNum=10)

        except Exception as e:
            groupeddata = []
            # print('=====*****======')
            # print(e.args)
            raise e
        # 从结果中解析成特定数据格式
        # if的数据格式：[{'groups:[
        #   {rankNum:1,其他属性,orderData[{rankNum:1,feild:value,feild:value}]}
        # ]}]
        # else的数据格式：
        # [{其他属性,orderData[{rankNum:1,feild:value,feild:value}]}]

        if groupcols:
            for groupedDt in groupeddata:
                rankNum = 1
                groupedObjDict = {'groups': []}
                for groupObj in groupedDt['groups']:
                    rankOfObj = 1
                    dictDt = {'rankNum': rankNum, 'sum': groupObj['sum'], 'mean': groupObj['mean'], 'orderData': []}
                    if 'top' in groupObj:
                        for tmpObj in groupObj['top']:
                            # 如果用户有数据标签限制
                            if not pd_tools.userTagCheckData(tmpObj, rsDataFilter):
                                rankOfObj = rankOfObj + 1
                                continue
                            tempDict = {'rankNumInn': rankOfObj}
                            for index, gcolstr in enumerate(dimcols):
                                tempDict['gcol' + str(index)] = tmpObj[gcolstr]
                            for index, kpicolstr in enumerate(kpicols):
                                tempDict['kpicol' + str(index)] = tmpObj[kpicolstr]
                            for index, groupcolstr in enumerate(groupcols):
                                tempDict['groupcol' + str(index)] = tmpObj[groupcolstr]
                            dictDt['orderData'].append(tempDict)
                            rankOfObj = rankOfObj + 1
                    rankNum = rankNum + 1
                    groupedObjDict['groups'].append(dictDt)
                rsData.append(groupedObjDict)
        else:  # 没有分组的排序
            for groupedDt in groupeddata:
                dictDt = {'sum': groupedDt['sum'], 'mean': groupedDt['mean'], 'orderData': []}
                if 'top' in groupedDt:
                    rankNum = 1
                    for tmpObj in groupedDt['top']:
                        if not pd_tools.userTagCheckData(tmpObj, rsDataFilter):  # 对结果集进行过滤
                            rankNum = rankNum + 1
                            continue
                        orderObjDict = {'rankNum': rankNum}
                        for index, gcolstr in enumerate(dimcols):
                            orderObjDict['gcol' + str(index)] = tmpObj[gcolstr]
                        for index, kpicolstr in enumerate(kpicols):
                            orderObjDict['kpicol' + str(index)] = tmpObj[kpicolstr]
                        dictDt['orderData'].append(orderObjDict)
                        rankNum = rankNum + 1
                rsData.append(dictDt)

        # print('singleIndexRank cleand data=', rsData)
        return rsData
    ###返回排名结束#####



def get_where_Splicing(rule, column, column_type,conn_type):
    where_temp = ''
    if rule['rule'] == 'like' or rule['rule'] == 'notlike':
        if rule['rule'] == 'notlike':
            rule['rule'] = 'not like'
        if conn_type == 'mt' or conn_type == 't':
            where_temp = "cast( " + column['table'] + "__" + column['fullname'] + " as " + column_type + ") " + rule['rule'] + " '%%" + rule['value'] + "%%' "
        else:
            where_temp = "cast( " + column['fullname'] + " as " + column_type + ") " + rule['rule'] + " '%%" + rule['value'] + "%%' "
    elif rule['rule'] == 'in' or rule['rule'] == 'notin':
        if rule['rule'] == 'notin':
            rule['rule'] = 'not in'
        if conn_type == 'mt' or conn_type == 't':
            where_temp = column['table'] + "__" + column['fullname'] + ' ' + rule['rule'] + " (" + rule['value'] + ") "
        else:
            where_temp = column['fullname'] + ' ' + rule['rule'] + " (" + rule['value'] + ") "
    elif rule['rule'] == 'null' or rule['rule'] == 'notnull':
        if rule['rule'] == 'notnull':
            rule['rule'] = 'not null'
        if conn_type == 'mt' or conn_type == 't':
            where_temp = column['table'] + "__" + column['fullname'] + ' is ' + rule['rule']
        else:
            where_temp = column['fullname'] + ' is ' + rule['rule']
    elif rule['rule'] == 's=' or rule['rule'] == 'note=':
        if conn_type == 'mt' or conn_type == 't':
            where_temp = "cast( " + column['table'] + "__" + column['fullname'] + " as " + column_type + ") " + " like '" + rule['value'] + "%%' "
        else:
            where_temp = "cast( " + column['fullname'] + " as " + column_type + ") " + " like '" + rule['value'] + "%%' "
    elif rule['rule'] == 'e=' or rule['rule'] == 'nots=':
        if conn_type == 'mt' or conn_type == 't':
            where_temp = "cast( " + column['table'] + "__" + column['fullname'] + " as " + column_type + ") " + " like '%%" + rule['value'] + "' "
        else:
            where_temp = "cast( " + column['fullname'] + " as " + column_type + ") " + " like '%%" + rule['value'] + "' "
    else:
        if rule['rule'] == '==':
            rule['rule'] = '='
        if conn_type == 'mt' or conn_type == 't':
            where_temp = column['table'] + "__" + column['fullname'] + ' ' + rule['rule'] + " '" + rule['value'] + "' "
        else:
            where_temp = column['fullname'] + ' ' + rule['rule'] + " '" + rule['value'] + "' "
    return where_temp


def is_number(num):
    pattern = re.compile(r'^[-+]?[-0-9]\d*\.\d*|[-+]?\.?[0-9]\d*$')
    result = pattern.match(num)
    if result:
        return True
    else:
        return False



@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def getOlapDataShow(request, id, chartid=''):
    start = time.time()
    user = get_user(request)
    if user.pk is None:
        result = {
            'msg': '未登录'
        }
        return Response(result)
    user_id = user.id
    # 获取组件元素
    dimcols = []  # 维度
    kpicols = []  # 度量
    dimension_group = ''                                    # 混合图中使用的维度分组
    olapobj = olap.objects.get(id=id)                       # 获取当前的olap
    sourceid = olapobj.sourceid                             # 获取当前的sourceid
    usetable = olapobj.table                                # 获取当前使用的表
    sourceObj = source.objects.get(id=sourceid)
    databaseid = sourceObj.databaseid  # 为了后面查询sql语句使用
    databaseobj = Database.objects.get(id=databaseid)
    database_type = databaseobj.database_type  # 获取odbc连接的数据库类型，例如mysql、sqlserver、db2等
    str_dimcol_count = ''
    str_kpicol = ''
    str_dimcol_pd = []
    str_kpicol_pd = []
    str_dimcol_sql = ''
    str_kpicol_sql = ''
    str_groupby_sql = ''
    fellall = ''
    sigleGroupField = ''             #单指标组内排名
    dimension_grouping = []
    # 如果数据库类型为obbc就用  odbcstatus 作为 database_type
    if database_type == 'odbc':
        database_type = databaseobj.odbcstatus
    aggregation_function = ['sum', 'max', 'min', 'mean']  # 聚合函数
    yp_mp = ['yp', 'mp', 'yppercent', 'mppercent']  # 同环比。同比、环比、同比百分比、环比百分比

    if request.data:
        # 获取从页面实时配置的参数，用于组件设计
        echartconf = request.data['config']
        jsonconfig = json.loads(echartconf)['data']['type']
    else:
        # 获取数据库存入的配置参数，用于组件显示
        chartobj = charts.objects.get(id=chartid)                   # 获取chart对象
        echartconf = chartobj.echartconfig                          # 获取chart配置
        jsonconfig = chartobj.jsonconfig                            # 获取chart类型
    if type(echartconf) == type('stringtype'):                      # 处理json
        echartconf = json.loads(echartconf)
    # print('echartconfaaa',echartconf)
    if jsonconfig == 'bmap':                                        # 对地图类型特殊处理
        x = []
        y = []
        if 'area' in echartconf and echartconf['area']['x'] != {}:
            x.append(echartconf['area']['x'])
            y.append(echartconf['area']['y'])
        else:
            x.append(echartconf['point'][0]['x'])
            y.append(echartconf['point'][0]['y'])
            # 获取经度纬度
            x.append(echartconf['point'][0]['lon'])
            x.append(echartconf['point'][0]['lat'])
    elif jsonconfig == 'single' or jsonconfig == 'gauge':           # 对单指标类型特殊处理
        x = {}
        if 'x' in echartconf['field']:
            x = echartconf['field']['x']
        y = echartconf['field']['y']
        for field in y:
            if 'groupField' in field:
                sigleGroupField = field['groupField']['field']
            columns = eval(olapobj.columns)
            if sigleGroupField != '':
                for column in columns:
                    if sigleGroupField == column['title']:
                        dt = {}  # 拼凑成{field：xxx，group：yyy}形式
                        dt['group'] = column['table'] + '__' + column['col']
                        dt['note'] = sigleGroupField
                        dimension_grouping.append(dt)


    elif jsonconfig == 'radar':                                     # 对雷达图进行特殊处理
        x = []
        x.append(echartconf['field']['x'])
        x.append(echartconf['field']['legend'])
        y = echartconf['field']['y']
    else:
        if jsonconfig == 'mixed':
            if 'groupField' in echartconf['field']['x']:
                dimension_group = echartconf['field']['x']['groupField']['field']
        x = echartconf['field']['x']
        y = echartconf['field']['y']

    if x:
        if type(x) == type({}):                                     # 单个维度字段处理
            columns = eval(olapobj.columns)
            dt = {}
            for column in columns:
                if x['field'] == column['title']:
                    if olapobj.directconn == 'mt':
                        dt['column'] = column['table'] + "__" + column['fullname']
                    else:
                        dt['column'] = '"' + column['fullname'] + '"'
                    dt['note'] = column['title']
                    if 'vtype' in x:
                        dt['vtype'] = x['vtype']
                    if 'type' in x:
                        dt['type'] = x['type']
            dimcols.append(dt)
        else:                                                   # 多个维度字段处理
            for temp in x:
                if temp:
                    columns = eval(olapobj.columns)
                    dt = {}
                    for column in columns:
                        if temp['field'] == column['title']:
                            if olapobj.directconn == 'mt':
                                dt['column'] = column['table'] + "__" + column['fullname']
                            else:
                                dt['column'] = '"' + column['fullname'] + '"'
                            dt['note'] = column['title']
                            if 'vtype' in temp:
                                dt['vtype'] = temp['vtype']
                            if 'type' in temp:
                                dt['type'] = temp['type']
                    dimcols.append(dt)
    if y:
        if type(y) == type({}):                                 # 单度量字段处理
            if y['field'] != '条目总数':
                dt = {}
                columns = eval(olapobj.columns)
                calculation_formula = ''
                if 'calcrules' in y and y['calcrules'] != '':
                    calcrules = y['calcrules']
                    temp = ''
                    text = y['calcrules']
                    is_start_left = 0

                    try:
                        if text.strip().startswith('('):
                            calculation_formula = '('
                            text = text.strip()[1:]
                            is_start_left = 1
                        operator = re.findall("\+|\-|\*|\/|\(|\)",text)
                        calculated_field = re.split("\+|\-|\*|\/|\(|\)",text)
                        bracketed_marker = 0                    # 是否存在括号
                        calculated_fields = []

                        for v in  calculated_field:
                            if v != '' and v != ' ':
                                calculated_fields.append(v)
                        for i,v in enumerate(calculated_fields):
                            is_num = 0
                            for column in columns:
                                if v.strip() == column['title'] or is_number(v.strip()):
                                    if is_number(v.strip()):
                                        calculation_formula = calculation_formula + v.strip()
                                        is_num = 1
                                    elif v.strip() == '(':
                                        calculation_formula = calculation_formula + v.strip()

                                    else:
                                        if olapobj.directconn == 'mt':                  # 实时
                                            calculation_formula = calculation_formula + ' ' + column['table'] + "__" + column['fullname'] + ' '
                                        else:                                           # olap及其他
                                            calculation_formula = calculation_formula + '"' + column['fullname'] + '"'
                                    if i <= len(operator)-1:
                                        if i + 1 <= len(operator) - 1:
                                            if operator[i+1] == '(' or operator[i+1] == ')':
                                                if i + bracketed_marker < len(operator):
                                                    calculation_formula = calculation_formula + operator[i + bracketed_marker]
                                                #bracketed_marker += 1
                                                if i+bracketed_marker + 1 < len(operator):
                                                    if is_start_left == 1 or operator[i+bracketed_marker + 1] == ')':
                                                        # if bracketed_marker>0 and is_start_left == 1:
                                                        #     bracketed_marker -= 1
                                                        #calculation_formula = calculation_formula + operator[i + bracketed_marker]
                                                        is_start_left = 0
                                                        break
                                        if bracketed_marker > 0 and i + bracketed_marker <= len(operator) -1:
                                            calculation_formula = calculation_formula + operator[i + bracketed_marker]
                                            if operator[i + bracketed_marker] == ')' and i + bracketed_marker < len(operator) - 1:
                                                calculation_formula = calculation_formula + operator[i + bracketed_marker + 1]
                                                bracketed_marker += 1
                                        elif i + bracketed_marker <= len(operator) -1:
                                            calculation_formula = calculation_formula + operator[i + bracketed_marker]
                                            if operator[i] == ')' and i < len(operator)-1:
                                                calculation_formula = calculation_formula + operator[i + 1]
                                                bracketed_marker += 1
                                                if i+2< len(operator):
                                                    if operator[i+2] == '(':
                                                        calculation_formula = calculation_formula + operator[i + 2]
                                                        bracketed_marker += 1
                                    if is_num == 1:
                                        is_num == 0
                                        break
                        dt['column'] = calculation_formula
                        dt['note'] = y['field']
                    except Exception as err:
                        err1 = err
                    # for calcrule in calcrules.split(' '):
                    #     for column in columns:
                    #         if calcrule == column['title']:
                    #             temp = temp + '"' + column['fullname'] + '"'
                    #         elif calcrule in ['+','-','*','/','(',')']:
                    #             temp = temp + calcrule
                    #             break
                    # dt['column'] = temp
                    # dt['note'] = y['field']
                else:
                    for column in columns:
                        if y['field'] == column['title']:
                            if olapobj.directconn == 'mt':
                                dt['column'] =column['table'] + "__" + column['fullname']
                            else:
                                dt['column'] = '"' + column['fullname'] + '"'
                            dt['note'] = y['field']
                if 'aggregatevalue' in y:
                    dt['aggregatevalue'] = y['aggregatevalue']
                if 'aggregate' in y:                            # 统计方式
                    dt['aggregate'] = y['aggregate']
                kpicols.append(dt)
            else:
                str_dimcol_count = ' count(*) as "条目总数",'
        else:                                                   # 多个度量字段处理
            for field in y:
                if field['field'] != '条目总数':
                    dt1 = {}
                    columns = eval(olapobj.columns)
                    maxField = ''
                    if 'maxField' in field:
                        if 'field' in field['maxField']:
                            maxField = field['maxField']['field']
                            dt2 = {}
                            for column in columns:
                                if maxField == column['title']:
                                    if olapobj.directconn == 'mt':
                                        dt2['column'] = column['table'] + "__" + column['fullname']
                                    else:
                                        dt2['column'] = '"' + column['fullname'] + '"'
                                    dt2['note'] = maxField
                            kpicols.append(dt2)
                    # if jsonconfig == 'single':
                    #     if 'groupField' in field:
                    #         sigleGroupField = field['groupField']['field']
                    #         dt = {}
                    #         for column in columns:
                    #             if sigleGroupField == column['title']:
                    #                 if olapobj.directconn == 'mt':
                    #                     dt['column'] = column['table'] + "__" + column['fullname']
                    #                 else:
                    #                     dt['column'] = '"' + column['fullname'] + '"'
                    #                 dt['note'] = sigleGroupField
                    #         dimcols.append(dt)
                    if 'calcrules' in field and field['calcrules'] != '':
                        calcrules = field['calcrules']
                        temp = ''
                        text = field['calcrules']
                        is_start_left = 0
                        calculation_formula = ''

                        try:
                            if text.strip().startswith('('):
                                calculation_formula = '('
                                text = text.strip()[1:]
                                is_start_left = 1
                            operator = re.findall("\+|\-|\*|\/|\(|\)", text)
                            calculated_field = re.split("\+|\-|\*|\/|\(|\)", text)
                            bracketed_marker = 0  # 是否存在括号
                            calculated_fields = []

                            for v in calculated_field:
                                if v != '' and v != ' ':
                                    calculated_fields.append(v)
                            for i, v in enumerate(calculated_fields):
                                is_num = 0
                                for column in columns:
                                    if v.strip() == column['title'] or is_number(v.strip()):
                                        if is_number(v.strip()):
                                            calculation_formula = calculation_formula + v.strip()
                                            is_num = 1
                                        elif v.strip() == '(':
                                            calculation_formula = calculation_formula + v.strip()

                                        else:
                                            if olapobj.directconn == 'mt':  # 实时
                                                calculation_formula = calculation_formula + ' ' + column['table'] + "__" + column['fullname'] + ' '
                                            else:  # olap及其他
                                                calculation_formula = calculation_formula + '"' + column['fullname'] + '"'
                                        if i <= len(operator) - 1:
                                            if i + 1 <= len(operator) - 1:
                                                if operator[i + 1] == '(' or operator[i + 1] == ')':
                                                    if i + bracketed_marker < len(operator):
                                                        calculation_formula = calculation_formula + operator[
                                                            i + bracketed_marker]
                                                    # bracketed_marker += 1
                                                    if i + bracketed_marker + 1 < len(operator):
                                                        if is_start_left == 1 or operator[
                                                            i + bracketed_marker + 1] == ')':
                                                            # if bracketed_marker>0 and is_start_left == 1:
                                                            #     bracketed_marker -= 1
                                                            # calculation_formula = calculation_formula + operator[i + bracketed_marker]
                                                            is_start_left = 0
                                                            break
                                            if bracketed_marker > 0 and i + bracketed_marker <= len(operator) - 1:
                                                calculation_formula = calculation_formula + operator[
                                                    i + bracketed_marker]
                                                if operator[i + bracketed_marker] == ')' and i + bracketed_marker < len(
                                                        operator) - 1:
                                                    calculation_formula = calculation_formula + operator[
                                                        i + bracketed_marker + 1]
                                                    bracketed_marker += 1
                                            elif i + bracketed_marker <= len(operator) - 1:
                                                calculation_formula = calculation_formula + operator[
                                                    i + bracketed_marker]
                                                if operator[i] == ')' and i < len(operator) - 1:
                                                    calculation_formula = calculation_formula + operator[i + 1]
                                                    bracketed_marker += 1
                                                    if i + 2 < len(operator):
                                                        if operator[i + 2] == '(':
                                                            calculation_formula = calculation_formula + operator[i + 2]
                                                            bracketed_marker += 1
                                        if is_num == 1:
                                            is_num == 0
                                            break
                            dt1['column'] = calculation_formula
                            dt1['note'] = field['field']
                        except Exception as err:
                            err1 = err


                    else:
                        for column in columns:
                            if field['field'] == column['title']:
                                if olapobj.directconn == 'mt':
                                    dt1['column'] = column['table'] + "__" + column['fullname']
                                else:
                                    dt1['column'] = '"' + column['fullname'] + '"'
                                dt1['note'] = field['field']
                    if 'aggregatevalue' in field:
                        dt1['aggregatevalue'] = field['aggregatevalue']
                    if 'aggregate' in field:
                        dt1['aggregate'] = field['aggregate']
                    kpicols.append(dt1)
                else:
                    str_dimcol_count = ' count(*) as "条目总数",'
        ## 用户tag 过滤
        olapTagConfigStr = olapobj.tag_config
        userRow = sys_userextension.objects.get(id=user_id)
        userTagConfigStr = userRow.tagfield

        # 数据权限扩展
        tmpwhere = []
        if olapTagConfigStr is not None and userTagConfigStr is not None:
            # olapTagConfig = strToJson(olapTagConfigStr)
            # userTagConfig = strToJson(userTagConfigStr)
            olapTagConfig = json.loads(olapTagConfigStr.replace("'", "\""))
            userTagConfig = json.loads(userTagConfigStr.replace("'", "\""))
            for configRow in olapTagConfig:
                tagid = configRow['tagid']
                tagcolumn = configRow['columns']
                # 添加排名的condition查询
                conditionObjs = []

                for userTagRow in userTagConfig:
                    if str(tagid) == str(userTagRow['tagid']):
                        tmpwhere.append('"' + tagcolumn + '" ' + userTagRow['fun'] + "'" + userTagRow['value'] + "'")

    # 从请求里解析参数
    where = ''
    is_yp_mp = 0                # 是否使用同比环比
    is_year = 0                 # 判断条件过滤中是否有年份过滤值
    getslistItems = request.GET.items()
    for kpicol in kpicols:
        if 'aggregate' in kpicol:
            if kpicol['aggregate'] in yp_mp:  # 同比数值
                is_yp_mp = 1
    if jsonconfig == 'single'and is_yp_mp ==1:
        dt = {}
        if olapobj.id == 'c0297992f93a11e896e668f7289a3973':
            dt['column'] = '"' + 'userdefinedsql0__year' + '"'
            dt['note'] = '年份'
        else:
            if olapobj.directconn == 'mt':
                dt['column'] = 'MM_DeptSetGoal__Year'
                dt['note'] = '年份'
            else:
                dt['column'] = '"' + 'userdefinedsql0__YEAR' + '"'
                dt['note'] = '年份'
        dimcols.append(dt)
    for k, v in getslistItems:
        k = parse.unquote(k)
        v = parse.unquote(v)
        # 取到并处理匹配方式
        logger.info('---parameter---k= %s' % k)

        matching = k.split(')')[1]
        if matching == 'equal' or matching == 'in':
            matching = 'in'
        elif matching == 'b':
            matching = '>'
        elif matching == 's':
            matching = '<'
        elif matching == 'b_equal':
            matching = '>='
        elif matching == 's_equal':
            matching = '<='
        else:
            matching = matching
        if v:
            columns = eval(olapobj.columns)
            if olapobj.directconn == 't':
                k = k[:-8]
                where = where + k + "=" + "'" + v + "'" + " and "
            else:
                k = k.split('(')[0]
                if k.find('__') != -1:
                    use_column = k
                else:
                    use_column = ''
                    for column in columns:
                        if k == column['title']:
                            use_column = column['fullname']
                try:
                    if int(v) >= 1900 and int(v) <= 2030:
                        is_year = v
                except:
                    is_year = 0

                if is_yp_mp == 0 or is_year == 0 :
                    if matching == 'like':  # 对like特殊处理
                        if database_type == 'oracle':
                            where = where + use_column + ' ' + matching + "'%%" + v + "%%'" + " and "
                        else:
                            where = where + '"' + use_column + '"' + ' ' + matching + "'%%" + v + "%%'" + " and "
                    else:
                        if database_type == 'oracle':
                            where = where + ' ' + use_column + ' ' + matching + "('" + v + "')" + " and "
                        else:
                            v_str = ""
                            for v_temp in v.split(','):
                                v_str += "'" + v_temp + "',"
                            where = where + use_column + ' ' + matching + "(" + v_str[:-1] + ")" + " and "
                            #where = where  + use_column  + ' ' + matching + "('" + v + "')" + " and "
                else:
                    pass


    # 遍历条件列表
    wheres = []
    where_temp = ''
    for condition in echartconf['filter']['filters']:
        if where_temp != '':
            wheres.append(where_temp)
        if database_type == 'mysql':
            column_type = 'char'
        else:
            column_type = 'varchar'
        if 'rules' in condition:
            columns = eval(olapobj.columns)
            use_id = []
            where_temp = ''                                                   # 重置
            for rule in reversed(condition['rules']):                         # 倒叙循环从内到外
                if rule['id'] not in use_id:
                    if rule['name'] != '':
                        Connect_relationship = ''                                 # 连接关系
                        for column in columns:
                            if rule['name'] == column['title']:
                                temp = get_where_Splicing(rule, column, column_type,olapobj.directconn)
                                where_temp = where_temp + temp
                                Connect_relationship = rule['relate']
                                break
                        current_id = rule['id']
                        current_parentid = rule['parentid']
                        for rule in reversed(condition['rules']):
                            if rule['id'] not in use_id:
                                sigle = 0
                                if current_parentid != rule['id'] and current_parentid != rule['parentid']:
                                    sigle = 1
                                    break
                                use_id.append(rule['id'])
                                if current_id != rule['id']:
                                    if rule['name'] != '':
                                        for column in columns:
                                            if rule['name'] == column['title']:
                                                temp = get_where_Splicing(rule, column, column_type,olapobj.directconn)
                                                where_temp = where_temp +  Connect_relationship + ' ' + temp + ' '
                                                Connect_relationship = ''
                                                Connect_relationship = rule['relate']
                                    if current_parentid == rule['parentid']:
                                        break
                        where_temp = '(' + where_temp + ')'
                        # if sigle == 1:
                        #     where_temp = where_temp + ' ' + rule['relate'] + ' '
                    else:
                        if rule['parentid'] != '0':
                            where_temp = where_temp + ' ' + rule['relate'] + ' '
                        use_id.append(rule['id'])
    for temp in wheres:
        if where != '':
            where = where + ' and ' + temp
        else:
            where = where + temp + ' and '
    if wheres:
        pass
    else:
        if where != '' and where_temp != '':
            where = where + where_temp
        else:
            where = where + where_temp







                # if rule['parentid'] == 0:
                #     main_id = rule['id']
                # if main_id  == rule['parentid']:
                #     if rule['name'] != '':
                #         for column in columns:
                #             if rule['name'] == column['title']:
                #                 where = where + column['fullname'] + rule['rule'] + rule['value'] + rule['relate']
                #     else:
                #         where = '(' + where + ')'



                # if main_condition == rule['name']:                          # 该条件为主条件
                #     for column in columns:
                #         if rule['name'] == column['title']:
                #             where = where + column['fullname'] + rule['rule'] + rule['value'] + rule['relate'] + '('
                # elif rule['name'] != '':
                #     for column in columns:
                #         if rule['name'] == column['title']:
                #             where = where + column['fullname'] + rule['rule'] + rule['value']

        # obj = olapcolumn.objects.get(olapid=id, title=condition['field'])
        # where_column = obj.column
        # if 'vtype' in condition:                    # 如果vtype存在condition中，说明拖入的字段为日期字段，进行日期转化
        #     where_column = get_time_format(condition['vtype'],obj.column,database_type)[0]
        #
        # condition['colName'] = where_column
        # if condition['rule'] == '==':  # 等于
        #     condition['rule'] = '='
        #     where = where + where_column + " " + condition['rule'] + " '" + condition['value'] + "'" + " and "
        # elif condition['rule'] == 'like' or condition['rule'] == 'notlike':  # 存在和不存在
        #     if condition['rule'] == 'notlike':
        #         condition['rule'] = ' not like'
        #     where = where + "cast( " + where_column + " as " + column_type + ") " + condition['rule'] + "'%%" \
        #             + condition['value'] + "%%'" + " and "
        # elif condition['rule'] == 's=':  # 以什么开始
        #     where = where + "cast( " + where_column + " as " + column_type + ") like  '" \
        #             + condition['value'] + "%%'" + " and "
        # elif condition['rule'] == 'e=':  # 以什么结束
        #     where = where + "cast( " + where_column + " as " + column_type + ") like '%%" \
        #             + condition['value'] + "'" + " and "
        # else:
        #     where = where + where_column + " " + condition['rule'] + " " + "'" + condition['value'] + "'" + " and "
    # 拼接基本sql，进行基本分组和过滤数据
    for dimcol in dimcols:
        str_dimcol_pd.append(dimcol['note'])
        if 'vtype' in dimcol:
            column = get_time_format('>', dimcol['column'], database_type)
            str_dimcol_sql = str_dimcol_sql + column[0] + ' as ' + '"' + dimcol['note'] + '"' + ','
            str_groupby_sql = str_groupby_sql + column[0] + ','
        else:
            str_dimcol_sql = str_dimcol_sql + dimcol['column'] + ' as ' + '"' + dimcol['note'] + '"' + ','
            str_groupby_sql = str_groupby_sql + dimcol['column'] + ','

    if dimension_group != '':  # 选择维度分组
        columns = eval(olapobj.columns)
        dt = {}
        for column in columns:
            if dimension_group == column['title']:
                if olapobj.directconn == 'mt':
                    dt['column'] = column['table'] + "__" + column['fullname']
                else:
                    dt['column'] = '"' + column['fullname'] + '"'
                dt['note'] = column['title']
                str_dimcol_sql = dt['column'] + ' as ' + '"' + dt['note'] + '"' + ',' + str_dimcol_sql
                str_groupby_sql = dt['column'] + ',' + str_groupby_sql

    if str_groupby_sql != '':
        str_groupby_sql = ' group by ' + str_groupby_sql[:-1]
    if olapobj.directconn == 'mt':
        if database_type == 'mysql':
            datatype = 'BINARY'
        else:
            datatype = 'decimal'
    else:
        datatype = 'float'
    for kpicol in kpicols:
        if 'aggregate' in kpicol:
            if kpicol['aggregate'] in aggregation_function or kpicol['aggregate'] in yp_mp:
                if jsonconfig == 'mixed' and dimension_group == '':
                    kpicol['note'] = kpicol['note'] + '___' + kpicol['aggregate']               # 解决相同指标不同计算方式的需求
                else:                                                                           # 饼状图始终只有一个度量
                    kpicol['note'] = kpicol['note']
                if kpicol['aggregate'] in yp_mp:
                    str_kpicol_pd.append(kpicol['note'])
            str_kpicol = str_kpicol + kpicol['column'] + ' as ' + '"' + kpicol['note'] + '"' + ','
            str_kpicol_pd.append(kpicol['note'])
            if kpicol['aggregate'] == 'mean':
                str_kpicol_sql = str_kpicol_sql + 'avg( cast(' + kpicol['column'] + ' as ' + datatype + ' ))' + '"' + kpicol['note'] + '"' + ','
            elif kpicol['aggregate'] == 'min':
                str_kpicol_sql = str_kpicol_sql + 'min( cast(' + kpicol['column'] + ' as ' + datatype + '))' + '"' + kpicol['note'] + '"' + ','
            elif kpicol['aggregate'] == 'max':
                str_kpicol_sql = str_kpicol_sql + 'max( cast(' + kpicol['column'] + ' as ' + datatype + '))' + '"' + kpicol['note'] + '"' + ','
            elif kpicol['aggregate'] == 'grouprank' and jsonconfig == 'single':
                str_kpicol_sql = str_kpicol_sql + kpicol['column'] + ' as ' + '"' + kpicol['note'] + '"' + ','
            else:
                str_kpicol_sql = str_kpicol_sql + 'sum( cast(' + kpicol['column'] + ' as ' + datatype + '))' + '"' + kpicol['note'] + '"' + ','
        else:
            str_kpicol = str_kpicol + kpicol['column'] + ' as ' + '"' + kpicol['note'] + '"' + ','
            str_kpicol_sql = str_kpicol_sql + 'sum( cast(' + kpicol['column'] + ' as ' + datatype + '))' + '"' + kpicol['note'] + '"' + ','
    for temp in dimension_grouping:
        str_dimcol_sql = str_dimcol_sql + ' ' + temp['group'] + ' as ' + temp['note'] + ', '
    if str_kpicol_sql == '':
        str_dimcol_sql = str_dimcol_sql + str_dimcol_count[:-1]
    else:
        str_dimcol_sql = str_dimcol_sql + str_dimcol_count

    if olapobj.directconn == 'mt' or olapobj.directconn == 't':
        # # 实时、直连将生成的sql作为子查询。
        # 对where条件进行处理
        if where.endswith('and '):
            where = ' where 1=1 ' + (' and ' + where[:-4]) if where[:-4] else ''
        if where.find('where') == -1:
            where = ' where 1=1 ' + (' and ' + where) if where else ''

        if str_kpicol != '' or str_dimcol_count != '':
            sql = 'select ' + str_dimcol_sql + str_kpicol_sql[:-1] + ' from ' + '(' + sourceObj.sql + ')a ' + where + str_groupby_sql
            sourcerow = source.objects.get(id=sourceObj.id)
            # session = sqlutils.SqlUtils(DBTypeCode.CUSTOM_DB.value,sourcerow.databaseid)
            # fellall = session.getDictResult(sql)
            executeSession = utils.SqlUtils(DBTypeCode.CUSTOM_DB.value,sourcerow.databaseid)
            try:
                fellall = executeSession.getDictResult(sql)
                executeSession.closeConnect()
            except Exception as error:
                executeSession.rollBack()  # 如果是执行update的sql就需要rollback
                logger.error('---error---file:dashview.py;method:getolapdatashow;error:%s' % error)


    else:
        # olap形式
        if str_kpicol != '' or str_dimcol_count != '':
            start1 = time.time()
            max_version = "select max(version) as version from " + usetable
            # rs = sqlutils.getResultBySql(max_version, sqlutils.DATAXEXTENSION_DB_CHAR)
            rs = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(max_version,
                                                                                      logger,
                                                                                      'dashview.py',
                                                                                      'getOlapDataShow')

            if rs[0][0] == None:
                version = 1
            else:
                version = rs[0][0]
            if where == '':
                where = ' where ' + ' version = ' + str(version)
            else:
                if where.find('where') == -1:
                    where = ' where ' +  where + ' version = ' + str(version)
                else:
                    where =  where + ' version = ' + str(version)
            tempwhere = ""

            for temp in tmpwhere:
                where = where + ' and ' + temp
            sql = 'select ' + str_dimcol_sql + str_kpicol_sql[:-1] + ' from ' + usetable + ' ' + where + ' ' + str_groupby_sql

            session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            try:
                fellall = session.getDictResult(sql)
            except:
                print('------------------------------------')
                pass
            finally:
                session.closeConnect()

            end1 = time.time()
    # 创建并将数据放入DataFrame
    max_year = ''
    if fellall:
        df = pd.DataFrame(fellall)
        yp_mp_df = pd.DataFrame()
        yp_mp_df_temp = pd.DataFrame()
        agg_aggregation = {}                            # 存储统计方式主要用于聚合方法
        agg_aggregation_yp_mp = {}                       # 用于同比环比
        sort_values = []                                # 存储排序
        grouprank = []                                  # 组内排名
        topn = ''                                       # 前多少名
        lastn = ''                                      # 后多少名
        topnp = ''                                      # 前n%名
        lastnp = ''                                     # 后n%名
        vtype = ''                                      # 日期维度所选择的日期格式
        # 对维度进行统一处理
        for dimcol in dimcols:
            if 'vtype' in dimcol:
                vtype = dimcol['vtype']
        # 对度量进行统一处理
        for kpicol in kpicols:
            df[kpicol['note']] = df[kpicol['note']].apply(pd.to_numeric, errors='ignore')
            if 'aggregate' not in kpicol:               # 默认为sum
                kpicol['aggregate'] = 'sum'
            if kpicol['aggregate'] == 'avg':            # 对平均进行转换
                kpicol['aggregate'] = 'mean'
            sort_values.append(kpicol['note'])          # 全部进行排序
            if kpicol['aggregate'] in yp_mp:                        # 只用于同比环比
                agg_aggregation_yp_mp[kpicol['note']] = 'sum'
            if kpicol['aggregate'] in aggregation_function:         # 只用于聚合方法
                agg_aggregation[kpicol['note']] = kpicol['aggregate']
            else:                                                   # 其它方法统一先分组
                agg_aggregation[kpicol['note']] = 'sum'
                if kpicol['aggregate'] == 'rank':
                    pass
                # if kpicol['aggregate'] == 'grouprank':
                #     grouprank.append(kpicol['note'])
                if kpicol['aggregate'] == 'topn':                   # 前n名
                    if 'aggregatevalue' in kpicol:
                        topn = kpicol['aggregatevalue']
                if kpicol['aggregate'] == 'lastn':                  # 后n名
                    if 'aggregatevalue' in kpicol:
                        lastn = kpicol['aggregatevalue']
                if kpicol['aggregate'] == 'topnp':                  #前n%名
                    if 'aggregatevalue' in kpicol:
                        topnp = kpicol['aggregatevalue']
                if kpicol['aggregate'] == 'lastnp':                  #后n%名
                    if 'aggregatevalue' in kpicol:
                        lastnp = kpicol['aggregatevalue']

        for kpicol in kpicols:
            if kpicol['aggregate'] in yp_mp:                      # 同比数值
                for dimcol in str_dimcol_pd:
                    if jsonconfig == 'single':
                        pass
                    else:
                        df[dimcol] = pd.to_datetime(df[dimcol])
                    if df[dimcol].dtype == 'datetime64[ns]' or jsonconfig == 'single':
                        if jsonconfig == 'single':
                            df['year'] = df[dimcol]
                            df['year'] = df['year'].apply(pd.to_numeric, errors='ignore')
                        else:
                            df['year'] = df[dimcol].dt.year           # 得到年
                            df['month'] = df[dimcol].dt.month           # 得到月
                        # 优先获取过滤条件中的年份信息，如果没有过滤条件，则直接选择df中年份最大的日期，也就是最接近当前的日期
                        if 'field' in echartconf['filter']['year']['field']:
                            max_year = int(echartconf['filter']['year']['field']['value'])
                        elif is_year !=0:
                            max_year = int(is_year)
                        else:
                            max_year = df['year'].max()  # 获取最大的年份
                        if jsonconfig == 'single':
                            df_that_year = df[df['year'] == max_year]  # 当前年的数据
                            df_that_year = df_that_year.groupby(['year']).agg(agg_aggregation_yp_mp).reset_index()
                            df_last_year = df[df['year'] == (int(max_year) - 1)]  # 去年的数据
                            df_last_year = df_last_year.groupby(['year']).agg(agg_aggregation_yp_mp).reset_index()
                            yp_mp_df_temp = pd.merge(df_that_year, df_last_year, how='left', on='year')
                            yp_mp_df[kpicol['note'] + '_x'] = df_that_year[kpicol['note']]
                            yp_mp_df[kpicol['note'] + '_y'] = df_last_year[kpicol['note']]
                            yp_mp_df[kpicol['note']] = ((yp_mp_df[kpicol['note'] + '_x'] - yp_mp_df[kpicol['note'] + '_y']) / yp_mp_df[kpicol['note'] + '_y']) * 100
                        else:
                            df_that_year = df[df['year'] == max_year]             # 当前年的数据
                            df_that_year = df_that_year.groupby(['month']).agg(agg_aggregation_yp_mp).reset_index()
                            df_last_year = df[df['year'] == (max_year-1)]           # 去年的数据
                            df_last_year = df_last_year.groupby(['month']).agg(agg_aggregation_yp_mp).reset_index()
                            yp_mp_df_temp = pd.merge(df_that_year, df_last_year, how='left', on='month')
                            if kpicol['aggregate'] == 'yp':                 # 同比数值
                                yp_mp_df[kpicol['note']] = yp_mp_df_temp[kpicol['note']+'_y']
                            if kpicol['aggregate'] == 'yppercent':          # 同比百分比
                                yp_mp_df[kpicol['note']] = ((yp_mp_df_temp[kpicol['note']+'_x'] - yp_mp_df_temp[kpicol['note']+'_y'])/yp_mp_df_temp[kpicol['note']+'_y'])*100
                            if kpicol['aggregate'] == 'mp' or kpicol['aggregate'] == 'mppercent':
                                df_that_year[kpicol['note']+'_y'] = df_that_year[kpicol['note']].shift()
                                if kpicol['aggregate'] == 'mp':             # 环比数值
                                    yp_mp_df[kpicol['note']] = df_that_year[kpicol['note']+'_y']
                                if kpicol['aggregate'] == 'mppercent':      # 环比百分比
                                    yp_mp_df[kpicol['note']] = ((df_that_year[kpicol['note']] - df_that_year[kpicol['note'] + '_y'])/df_that_year[kpicol['note'] + '_y'])*100
                            yp_mp_df_temp =yp_mp_df_temp.rename(columns={'month':dimcol})



        # 添加页面中过滤条件中的年份和月份
        if 'field' in echartconf['filter']['year']['field']:
            columns = eval(olapobj.columns)
            for column in columns:
                if echartconf['filter']['year']['field']['field'] == column['title']:
                    try:
                        if df[column['title']].dtype != 'datetime64[ns]':
                            df[column['title']] = pd.to_datetime(df[column['title']],errors='ignore')
                        df = df[df[column['title']].dt.year == int(echartconf['filter']['year']['field']['value'])]
                    except:
                        pass
                        #Group("element").send({'text': '年份过滤无效，此处仅针对维度为日期且相同字段的过滤方式，如需对年份进行过滤请使用最下方综合过滤'})

        if 'field' in echartconf['filter']['month']['field']:
            columns = eval(olapobj.columns)
            for column in columns:
                if echartconf['filter']['month']['field']['field'] == column['title']:
                    try:
                        if df[column['title']].dtype != 'datetime64[ns]':
                            df[column['title']] = pd.to_datetime(df[column['title']],errors='ignore')
                        df = df[df[column['title']].dt.month == int(echartconf['filter']['month']['field']['value'])]
                    except:
                        pass
                       #Group("element").send({'text': '月份过滤无效，此处仅针对维度为日期且相同字段的过滤方式，如需对年份进行过滤请使用最下方综合过滤'})
        if df.empty:
            pass
            #Group("element").send({'text': '没有数据，请检查数据关联以及过滤区域是否正确'})
        else:
            pass
        if yp_mp_df_temp.empty:
            pass
        elif jsonconfig == 'single':
            pass
        else:
            yp_mp_df[str_dimcol_pd] = yp_mp_df_temp[str_dimcol_pd]
        if yp_mp_df.empty:
            pass
        elif jsonconfig == 'single':
            pass
        else:
            yp_mp_df = yp_mp_df[str_dimcol_pd + str_kpicol_pd]

        if dimension_grouping:                           # 组内排序
            if jsonconfig == 'single':
                df['group_sort'] = df[str_kpicol_pd].groupby(df[dimension_grouping[0]['note']]).rank(ascending=0, method='dense')
                df[str_kpicol_pd] = df['group_sort']    # 转化为排名
            else:
                df[grouprank] = df.groupby(str_dimcol_pd).rank(ascending=0, method='dense')
        # 日期格式处理
        for dimcol in dimcols:
            if 'vtype' in dimcol:
                if df[dimcol['note']].dtype != 'datetime64[ns]':
                    df[dimcol['note']] = pd.to_datetime(df[dimcol['note']],errors='ignore')
                if dimcol['vtype'] == 'year':  # 年
                    df[dimcol['note']] = df[dimcol['note']].dt.year
                elif dimcol['vtype'] == 'month':  # 月
                    df[dimcol['note']] = df[dimcol['note']].dt.month
                elif dimcol['vtype'] == 'day':  # 日
                    df[dimcol['note']] = df[dimcol['note']].dt.day
                elif dimcol['vtype'] == 'quate':  # 季度
                    df[dimcol['note']] = df[dimcol['note']].dt.quarter
                elif dimcol['vtype'] == '>':  # 年月日
                    df[dimcol['note']] = df[dimcol['note']].dt.strftime('%Y-%m-%d')
                elif dimcol['vtype'] == '>=':  # 年月
                    df[dimcol['note']] = df[dimcol['note']].dt.strftime('%Y-%m')
                elif dimcol['vtype'] == '<':  # 年季度
                    df[dimcol['note']] = df[dimcol['note']].dt.year.astype(str) + '年' + df[dimcol['note']].dt.quarter.astype(str) + '季度'
            if 'type' in dimcol:
                if dimcol['type'] == 'temporal' and vtype == '':
                    if df[dimcol['note']].dtype != 'datetime64[ns]':
                        df[dimcol['note']] = pd.to_datetime(df[dimcol['note']], errors='ignore')
                    df[dimcol['note']] = df[dimcol['note']].dt.month
        if max_year != '':
            df = df[df['year'] == int(max_year)]

        if str_dimcol_pd:
            if dimension_group != '':  # 选择维度分组此处不再进行汇总和分组
                pass
            else:
                df = df.groupby(str_dimcol_pd).sum().reset_index()
        else:
            pass
        if yp_mp_df.empty:
            pass
        else:
            df = df.groupby(str_dimcol_pd).sum().reset_index()
            if jsonconfig == 'single':
                df = yp_mp_df
            else:
                df = pd.merge(df, yp_mp_df, on=str_dimcol_pd, how='right', suffixes=('_x', ''))

        if topn != '':                        # 前n名
            df = df.head(int(topn))
        elif lastn != '':                       # 后n名
            df = df.tail(int(lastn))
        elif topnp != '':                                                   # 前n%名
            topnp = math.ceil(float(len(df) * (int(topnp)/100)))            # 向上取整
            if topnp == 0:
                topnp = 1
            df = df.head(topnp)
        elif lastnp != '':                                                   # 后n%名
            lastnp = math.ceil(float(len(df) * (int(lastnp) / 100)))         # 向上取整
            if lastnp == 0:
                lastnp = 1
            df = df.tail(lastnp)

        df = df.reset_index()
        df = df.to_json(orient='table', force_ascii=False)
        df = json.loads(df)['data']
        end = time.time()
        logger.info('---time_all=%s ' % (end - start))


        return Response(df)
    else:
        return Response({})
        if kpicols:
            pass
            #Group("element").send({'text': '没有数据，请检查数据关联以及过滤区域是否正确'})




#以前的getOlapData是为了处理各种计算结果，现在不需要，只需要返回前50条数据即可
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def getOlapData(request, id):
    user = get_user(request)
    if user.pk is  None:
        result = {
            'msg':'未登录'
        }
        return Response(result)

    try:
        resultData=[]
        olapObj = olap.objects.get(id=id)
        olapColumnObjs = olapcolumn.objects.filter(olapid=id)
        sourceObj = source.objects.get(id=olapObj.sourceid)
        databaseObj = Database.objects.get(id=sourceObj.databaseid)

        # 分为直连(t)、实时(mt)、数据提取(null)
        if not olapObj.directconn or olapObj.directconn == 'mt':#实时和数据提取模式
            #拖拽表生成的元数据其select字段都是表名加上字段名，由于返回数据是中文title为key的键值对，
            # 所以需要查询olapcolumn和其对应的中文title以做成key：value形式方便使用
            columnTitleKeyValue = {}#column的键值对，key为column值为中文的title
            for olapColumnObj in olapColumnObjs:
                columnTitleKeyValue[olapColumnObj.column] = olapColumnObj.title

            if not olapObj.directconn :#数据提取模式，直接从olap结构里拼接sql
                session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)  # 建立连接以备后续使用
                maxVarsionSql = "select max(version) as version from " + olapObj.table
                # rs = sqlutils.getResultBySql(maxVarsionSql, sqlutils.DATAXEXTENSION_DB_CHAR)
                rs = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(maxVarsionSql,
                                                                                          logger,
                                                                                          'dashview.py',
                                                                                          'getOlapData')

                version = rs[0][0] if rs else 1
                #拼接sql
                columns = json.loads(olapObj.columns.replace("'", "\""))
                selectColStrs = []
                groupColStrs = []
                # orderColStrs = []
                for colDictObj in columns:
                    if colDictObj['function'] == 'group':
                        selectColStrs.append('"' + colDictObj['fullname'] + '"')
                        groupColStrs.append('"' + colDictObj['fullname'] + '"')
                    elif colDictObj['function'] == 'sum':
                        # 需要判断该字段是否是数值类型，否则需要cast转换
                        correctType = checkColumnIsCorrectType(olapObj.sourceid, olapObj.table, colDictObj['col'],
                                                               'number')
                        if correctType:
                            selectColStrs.append(
                                ' sum( "' + colDictObj['fullname'] + '") as "' + colDictObj['fullname'] + '"')
                        else:
                            selectColStrs.append(
                                ' sum( cast("' + colDictObj['fullname'] + '" as numeric )) as "' + colDictObj[
                                    'fullname'] + '"')
                    # if colDictObj['order'] and colDictObj['order'] not in ['None','null']:
                    #     orderColStrs.append(colDictObj['fullname'] + ' ' + colDictObj['order'])
                executeSql = """ select """ + ','.join(selectColStrs) + """ from """ + olapObj.table + \
                             """ where (version = """ + str(version) + """  or  extra_processing = 'y' ) """ + \
                             """ group by """ + ','.join(groupColStrs)  # + """ order by """ + ','.join(orderColStrs)
            else :#实时模式
                sourceObj = source.objects.get(id=olapObj.sourceid)
                session = sqlutils.SqlUtils(DBTypeCode.CUSTOM_DB.value, sourceObj.databaseid)
                executeSql = sourceObj.sql

            #拼接sql翻页，限制前50条数据
            resultDt = session.getDataFromServerPaginationNoOrder(50, 0, executeSql)
            session.closeConnect()

            for rsObj in resultDt:
                dist = {}
                for key in columnTitleKeyValue:
                    distKey = columnTitleKeyValue[key]#oracle暂时做特殊处理
                    dist[distKey] = rsObj[key]#赋值操作
                resultData.append(dist)
        elif olapObj.directconn == 't':#直连模式
            print('----direct connect already disabled！！----直连模式已经被去掉了------')
            # currDatabaseObj = Database.objects.get(id=sourceObj.databaseid)
            # pagedSql = odbcsqltool.paginationNoOrder(sourceObj.sql, 50, 0, currDatabaseObj.odbcstatus)
            # logger.info('---directconnect pagedSql=%s' % pagedSql)
            # resultData = odbcsqltool.getDictData(conn=None, sql=pagedSql, databaseid=currDatabaseObj.id)

    except Exception as error:
        # print('--error-----file:dashview.py;method:getOlapData;line:1752;erros:',error.args)
        logger.error('--error-----file:dashview.py;method:getOlapData;erros:%s' % error)
        resultData = []
    # print('resultData=',resultData)
    logger.info('---resultData=%s' % resultData)
    return Response(resultData)



#检验colun的类型是否和预期类型(传入targetType)一致
#传入三个参数，sourceId, tableName, columnName, targetType,其中targetType in ['number','string','date']
def checkColumnIsCorrectType(sourceId, tableName, columnName, targetType):
    if not sourceId or not tableName or not columnName or not targetType:
        return False
    if targetType in ['number','string','date'] :
        try :
            currSourceObjs = sourcedetail.objects.filter(sourceid=sourceId,table=tableName,column=columnName)
            if currSourceObjs :
                currSourceObj = currSourceObjs[0]
                databaseObj = Database.objects.get(id=sourceId)
                columnType = sqltool.PysqlAgent().getType(currSourceObj.type,databaseObj.database_type)
                if targetType == columnType :#如果用户传入的targetType in ['number','string','date']并和columnType相等
                    return True
                else:
                    return False
            else :
                return False
        except Exception as getSourceByIdError:
            logger.error('--error-----file:dashview.py;method:checkColumnIsCorrectType;erros:%s' % getSourceByIdError)
            return False
    return False



@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlapColumnInfo(request, id=''):
    result = {}
    try:
        olaprow = olap.objects.get(id=id)
        # 原始字段
        columns = json.loads(olaprow.columns.replace("'", "\""))
        # 获取附加字段
        olapcols = olapcolumn.objects.filter(olapid=id)
        if len(olapcols) > len(columns):
            for i in range(len(columns), len(olapcols)):
                col = {
                        'function': 'sum',
                        'col': olapcols[i].column,
                        'isedit': '0',
                        'table': columns[0]['table'],
                        'olaptitle': '',
                        'title': olapcols[i].title,
                        'order': '',
                        'fullname': olapcols[i].column
                    }
                columns.append(col)
        result['tableName'] = olaprow.table
        result['data'] = columns
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        result['msg'] = e.args
        logger.error('--error---file:dashview.py;method:getOlapColumnInfo;erros:%s' % e)
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlapAllColumnInfo(request, id):
    result = {}
    try:
        olaprow = olap.objects.get(id=id)
        columns = json.loads(olaprow.columns.replace("'", "\""))
        olapRowTable = olapcolumn.objects.filter(olapid=id)
        olapList = []
        for olapcol in olapRowTable:
            olapColObj = {}
            olapColObj['name'] = olapcol.column
            olapColObj['title'] = olapcol.title
            olapList.append(olapColObj)
        result['tableName'] = olaprow.table
        result['data'] = columns
        result['olapList'] = olapList
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        result['msg'] = e.args
        logger.error('--error---file:dashview.py;method:getOlapAllColumnInfo;erros:%s' % e)
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlapDataByTotal(request, id):
    olaprow = olap.objects.get(id=id)
    olapcolumns = olapcolumn.objects.filter(olapid=id)
    # table = olaprow.table
    # sourceid = olaprow.sourceid
    # sourcest = stRestoreBySourceId(sourceid)
    # kindtype  =  sourcest.kind
    # st = stRestoreLocal()
    # strlist = getTableColumn(olapcolumns, st, sourceid , kindtype)
    strlist = []
    for oc in olapcolumns:
        field = oc.column
        dist = {}
        dist['col'] = field
        dist['name'] = field
        if oc.title != '':
            dist['name'] = oc.title
        strlist.append(dist)
    logger.info('---strlist= %s ' % strlist)

    result = {}
    result['data'] = strlist
    return Response(result)

def getTableColumn(olapcolumns, st, sourceid, kindtype=None):
    strlist = []
    for column in olapcolumns:
        field = column.column
        dist = {}
        if field.find('__') >= 0:
            arr = field.split('__')
            tablename = arr[0]
            col = arr[1]
            dist['col'] = field
            try:
                sourcedetailrow = sourcedetail.objects.get(sourceid=sourceid, column=col, table=tablename)
                dist['name'] = sourcedetailrow.title

                if kindtype != None:
                    if sourcedetailrow.distconfig is  not None and sourcedetailrow.distconfig != '[]':
                        dist['type'] = 'string'
                    else:
                        dist['type'] = st.getType(sourcedetailrow.type, kindtype)
                else:
                    dist['type'] = 'string'
            except:
                dist['name'] = field
                dist['type'] = 'string'
                pass
        else:
            dist['col'] = field
            dist['name'] = field
        if column.title != '':
            dist['name'] = column.title
        strlist.append(dist)
    return strlist

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getTableData(request,id):
    """back the function_body of loadTableData()"""
    # if 'column' in request.data:
    #     column = request.data['column']
    #     if isinstance(column, str):
    #         column = json.loads(column)
    #     olapid = request.data['olapid']
    #     if 'limit' in request.data:
    #         limit = request.data['limit']
    #     else:
    #         limit = 1000
    #     if 'page' in request.data:
    #         page = request.data['page']
    #     else:
    #         page = 1
    #     merge = request.data['merge']
    # else:
    #     column = request.POST.get('column')
    #     if isinstance(column, str):
    #         column = json.loads(column)
    #     olapid = request.POST.get('olapid')
    #     limit = request.POST.get('limit')
    #     merge = request.POST.get('merge')
    #     page = request.POST.get('page')
    # olaprow = olap.objects.get(id=olapid)
    # olapcolumns = olapcolumn.objects.filter(olapid=olapid)
    # table = olaprow.table
    #
    # st = stRestoreLocal()
    # sourceid = olaprow.sourceid
    # sourcest = stRestoreBySourceId(sourceid)
    # kindtype  =  sourcest.kind
    # strlist = getTableColumn(olapcolumns, st, sourceid, kindtype)
    # columnStr = ""
    # groupstr = ""
    # # olapfeild=json.loads(olaprow.columns.replace("'", "\""))
    # for index in strlist:
    #     for columnindex in column:
    #         if columnindex == index['name']:
    #             # if merge == 'true' and 'type' in index:
    #             #     # if index['type'] == 'number':
    #             #     #     columnStr = columnStr + ', sum("' + index['col'] + '") as ' + index['col']
    #             #     # else:
    #             #     #     columnStr = columnStr + ', "' + index['col'] + '"'
    #             #     #     groupstr = groupstr + ', "' + index['col'] + '"'
    #             #
    #             #     feildfunc=''
    #             #     for fd in olapfeild:
    #             #         if fd['fullname']==index['col']:
    #             #             feildfunc=fd['function']
    #             #     if feildfunc != '' and feildfunc != 'group':
    #             #         columnStr = columnStr + ', '+feildfunc+'("' + index['col'] + '") as ' + index['col']
    #             #     else:
    #             #         columnStr = columnStr + ', "' + index['col'] + '"'
    #             #         groupstr = groupstr + ', "' + index['col'] + '"'
    #             # else:
    #             #     columnStr = columnStr + ', "' + index['col'] + '"'
    #             columnStr = columnStr + ', "' + index['col'] + '"'  #olap已经group和sum过了，表格预览里不需要在进行function
    #
    # columnStr = columnStr.strip(',')
    # groupstr = groupstr.strip(',')
    # maxVarsion = "select max(version) as version from " + table
    # rs = st.getData(maxVarsion)
    # if rs[0]['version'] == None:
    #     version = 1
    # else:
    #     version = rs[0]['version']
    # paramAry = []
    # paramAry.append(version)
    # whereStr = ''
    # getslistItems = request.GET.items()
    # for k, v in getslistItems:
    #     k = parse.unquote(k)
    #     itemStr = olapFilter().buildFilter(k, v, strlist)
    #     if itemStr != '':
    #         whereStr = whereStr + """ and """ + itemStr['str']
    #         paramAry.append(itemStr['value'])
    # totalsql = stitchStr(columnStr, table, whereStr, groupstr, merge)
    # sql = st.serverPaginationNoOrder(limit,(int(page) - 1) * int(limit),totalsql)
    # # print("loadtabledata,sql=%s"%sql)
    # totalsql = "select count(*) as total from (" + totalsql + ") a"
    # totalrs = st.conn.execute(totalsql, *tuple(paramAry)).fetchall()
    # total = totalrs[0]['total']
    # results = st.conn.execute(sql, *tuple(pa
    # ramAry))
    # b = results.fetchall()
    # tbs = []
    # for u in b:
    #     tbs.append(dict(zip(u.keys(), u.values())))
    # lists = tbs
    # rs = []
    # for row in lists:
    #     dist={}
    #     for a in strlist:
    #         if a['name'] in column:
    #             try:
    #                 dist[a['name']] = row[a['col']]
    #             except:
    #                 dist[a['name']] = row[a['col'].lower()]
    #     rs.append(dist)
    # result = {}
    # result['data'] = rs
    # result['total'] = total
    # return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def loadTableData(request):
    """getTableData had backuped the oldest version (20180605)"""
    user = get_user(request)
    if user.pk is None:
        result = {
            'msg': '未登录'
        }
        return Response(result)
    user_id = user.id
    resultsObj = tools.successMes()
    try:
        if 'column' in request.data:
            column = request.data['column']
            if isinstance(column, str):
                column = json.loads(column)
            olapid = request.data['olapid']
            if 'limit' in request.data:
                limit = request.data['limit']
            else:
                limit = 1000
            if 'page' in request.data:
                page = request.data['page']
            else:
                page = 1
            merge = request.data['merge']
            if 'mergeCols' in request.data:
                mergeCols = request.data['mergeCols']
                if isinstance(mergeCols, str):
                    mergeCols = json.loads(mergeCols)
            else:
                mergeCols = {}
        else:
            column = request.POST.get('column')
            if isinstance(column, str):
                column = json.loads(column)
            olapid = request.POST.get('olapid')
            limit = request.POST.get('limit')
            merge = request.POST.get('merge')
            page = request.POST.get('page')
            mergeCols = request.POST.get('mergeCols')
            if isinstance(mergeCols, str):
                mergeCols = json.loads(mergeCols)

        olaprow = olap.objects.get(id=olapid)
        olapcolumns = olapcolumn.objects.filter(olapid=olapid)
        table = olaprow.table
        sourceid = olaprow.sourceid
        # ##mergecols如果为空则从表dashboard_datatable中加载
        # if not mergeCols:
        #     datatable.objects.get()
        strlist = []
        for oc in olapcolumns:
            field = oc.column
            dist = {}
            dist['col'] = field
            dist['name'] = field
            if oc.title != '':
                dist['name'] = oc.title
            strlist.append(dist)
        columnStr = ""
        groupstr = ""
        columnStrFullName = []  # 用于保存columnfullname
        for columnindex in column:
            for index in strlist:
                if columnindex == index['name']:
                    columnStrFullName.append(index['col'])
                    # if merge and merge=='true' and ('mergeSumCol' in mergeCols) and (columnindex in mergeCols['mergeSumCol']):
                    if merge and merge == 'true' and ('mergeSumCol' in mergeCols) and (
                            tools.existValue(mergeCols['mergeSumCol'], columnindex, 'feild', 't') > 0):
                        columnStr = columnStr + ', sum("' + index['col'] + '") as "' + index['col'] + '" '
                    # elif merge and merge=='true' and ('mergeGroupCol' in mergeCols) and (columnindex in mergeCols['mergeGroupCol']):
                    elif merge and merge == 'true' and ('mergeGroupCol' in mergeCols) and (
                            tools.existValue(mergeCols['mergeGroupCol'], columnindex, 'feild', 't') > 0):
                        columnStr = columnStr + ', "' + index['col'] + '"'
                        groupstr = groupstr + ', "' + index['col'] + '"'
                    else:
                        columnStr = columnStr + ', "' + index['col'] + '"'

        columnStr = columnStr.strip(',')
        groupstr = groupstr.strip(',')

        paramAry = []
        if olaprow.directconn != 't' and olaprow.directconn != 'mt':
            maxVarsion = "select max(version) as version from " + table
            # rs = sqlutils.getResultBySql(maxVarsion, sqlutils.DATAXEXTENSION_DB_CHAR)
            rs = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(maxVarsion,
                                                                                      logger,
                                                                                      'dashview.py',
                                                                                      'loadTableData')

            if rs[0][0] == None:
                version = 1
            else:
                version = rs[0][0]
            paramAry.append(version)

        sourceObj = source.objects.get(id=sourceid)
        databaseobj = Database.objects.get(id=sourceObj.databaseid)
        connectType = databaseobj.odbcstatus  # 获取odbc连接的数据库类型，例如mysql、sqlserver、db2等
        whereStr = ""
        getslistItems = request.GET.items()
        for k, v in getslistItems:
            k = parse.unquote(k)
            v = parse.unquote(v)
            try:
                if v.replace("'", ''):
                    pass
            except:
                v = "'" + v + "'"
            itemStr = olapFilter().buildFilter(k, v, strlist, connTp=connectType)
            if itemStr != '' and itemStr['value']:
                whereStr = whereStr + ' and ' + itemStr['str']
                if itemStr['value'].strip() != 'True':  # 如果value值被拼接到itemStr['str']中，就不需要加入paramArray中
                    paramAry.append("'" + itemStr['value'] + "'")
        ## 用户tag 过滤
        olapTagConfigStr = olaprow.tag_config
        userRow = sys_userextension.objects.get(id=user_id)
        userTagConfigStr = userRow.tagfield
        # 数据权限扩展
        tmpwhere = []
        if olapTagConfigStr is not None and userTagConfigStr is not None:
            # olapTagConfig = strToJson(olapTagConfigStr)
            # userTagConfig = strToJson(userTagConfigStr)
            olapTagConfig = json.loads(olapTagConfigStr.replace("'", "\""))
            userTagConfig = json.loads(userTagConfigStr.replace("'", "\""))
            for configRow in olapTagConfig:
                tagid = configRow['tagid']
                tagcolumn = configRow['columns']
                # 添加排名的condition查询
                conditionObjs = []

                for userTagRow in userTagConfig:
                    if str(tagid) == str(userTagRow['tagid']):
                        tmpwhere.append(
                            '"' + tagcolumn + '" ' + userTagRow['fun'] + "'" + userTagRow['value'] + "'")

        if olaprow.directconn == 't':  # 如果是直连就执行odbc的查询,20190220暂时不使用
            inputSql = sourceObj.sql
            paramArrys = odbcsqltool.paramWrapper(paramAry, connectType)
            selSql = stitchStr(columnStr.replace('"', ''), '(' + inputSql + ') a', whereStr, groupstr, merge,
                               't') % tuple(paramArrys)  # 拼接sql并把sql中的%s替换为参数
            # pageSql = odbcsqltool.paginationNoOrder(selSql, limit, (int(page) - 1) * int(limit), databaseobj.odbcstatus)

            pageSql = ''
            logger.info('---table data selSql=%s' % selSql)
            # rs=odbcsqltool.getDictData(conn=None,sql=pageSql,databaseid=sourceObj.databaseid)
            # 需要注意这里的chinesTitle顺序和pageSql的字段顺序必须一致，（在保存的时候是按顺序来的，所以这里不用处理）
            rsdatas = odbcsqltool.getDataBysql(conn=None, exesql=pageSql, databaseid=sourceObj.databaseid)
            rs = []
            for dt in rsdatas:
                # dt=[dto.strip() for dto in dt]
                rs.append(dict(zip(column, dt)))
            total = odbcsqltool.getTotalCount(conn=None, sql=selSql, databaseid=sourceObj.databaseid)
            resultsObj['data'] = rs
            resultsObj['total'] = total
            return Response(resultsObj)

        elif olaprow.directconn == 'mt':
            inputSql = sourceObj.sql
            paramArrys = odbcsqltool.paramWrapper(paramAry, connectType)
            selSql = stitchStr(columnStr.replace('"', ''), '(' + inputSql + ') a', whereStr, groupstr, merge,
                               't') % tuple(paramArrys)  # 拼接sql并把sql中的%s替换为参数

            logger.info('---getolapdata1 sql=%s' % selSql)

            resultDt = []
            total = 0
            session = sqlutils.SqlUtils(DBTypeCode.CUSTOM_DB.value, sourceObj.databaseid)
            try:
                resultDt = session.getDictResult(selSql)
                countSql = "select count(*) as total from (" + selSql + ") a"
                total = session.getDictResult(countSql)[0]
            except Exception as error:
                logger.error('---error---file:dashview.py;method:loadTableData;error=%s' % error)
            finally:
                session.closeConnect()

            # print('columnlist=',columnlist)
            # print('strlist=',strlist)
            rs = []

            for row in resultDt:
                dist = {}
                for a in strlist:
                    if a['name'] in column:
                        try:
                            if a['col'] in row:
                                dist[a['name']] = row[a['col']]
                            elif a['col'].lower() in row:
                                dist[a['name']] = row[a['col'].lower()]
                            else:
                                dist[a['name']] = row[a['col'].upper()]
                        except:
                            dist[a['name']] = row[a['col'].lower()]
                rs.append(dist)

            resultsObj['data'] = rs
            resultsObj['total'] = total
            return Response(resultsObj)

        else:
            for temp in tmpwhere:
                whereStr = whereStr + ' and ' + temp
            if whereStr.endswith('and '):
                whereStr = whereStr[:-4]
            logger.info('---wherestr=%s' % whereStr)
            totalsql = stitchStr(columnStr, table, whereStr, groupstr, merge)
            sql = totalsql + ' limit ' + str(limit) + ' offset ' + str((int(page) - 1) * int(limit))
            logger.info('---sql=%s' % sql)
            totalsql = "select count(*) as total from (" + totalsql + ") a"

            # totalrs = sqlutils.getResultBySql(totalsql % tuple(paramAry), sqlutils.DATAXEXTENSION_DB_CHAR)
            totalrs = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(totalsql % tuple(paramAry),
                                                                                           logger, 'dashview.py',
                                                                                           'loadTableData')

            total = totalrs[0][0] if totalrs else 0
            logger.info('---table data tuple(paramArray)=%s' % tuple(paramAry))

            # results = sqlutils.getResultBySql(sql % tuple(paramAry), sqlutils.DATAXEXTENSION_DB_CHAR)
            results = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(sql % tuple(paramAry),
                                                                                           logger, 'dashview.py',
                                                                                           'loadTableData')

            columnlist = [x.strip() for x in columnStrFullName]

            tbs = []
            for u in results:
                tbs.append(dict(zip(columnlist, u)))
            rs = []
            for row in tbs:
                dist = {}
                for a in strlist:
                    if a['name'] in column:
                        try:
                            dist[a['name']] = row[a['col']]
                        except:
                            dist[a['name']] = row[a['col'].lower()]
                rs.append(dist)
        resultsObj['data'] = rs
        resultsObj['total'] = total

        logger.info('---olap result=%s' % resultsObj)
        return Response(resultsObj)
    except Exception as err:
        raise err
        # resultsObj = tools.errorMes(err.args)

    return Response(resultsObj)

def stitchStr(columnStr, table, whereStr, groupstr, merge,directConn=None):
    sql = ""
    if merge == 'true':
        if whereStr == '':
            if directConn and directConn=='t':
                sql='select '+columnStr+" from " + table + ((' group by ' + groupstr) if groupstr.strip() else ' ')
            else:
                sql = "select " + columnStr + " from " + table + " where version = %s  or  extra_processing = 'y' "+((' group by ' + groupstr) if groupstr.strip() else ' ')
        else:
            if directConn and directConn=='t':
                sql='select  '+columnStr+" from " + table + ' where 1=1 ' + whereStr +((' group by ' + groupstr) if groupstr.strip() else ' ')
            else:
                sql = "select " + columnStr + " from " + table + " where ( version = %s  or  extra_processing = 'y' ) " + whereStr + ((' group by ' + groupstr) if groupstr.strip() else ' ' )
    else:
        if whereStr == '':
            if directConn and directConn=='t':
                sql='select '+columnStr+" from " + table + ' limit 200 '
            else:
                sql = "select " + columnStr + " from " + table + " where version = %s  or  extra_processing = 'y' " + ' limit 200 '
        else:
            if directConn and directConn=='t':
                sql='select  '+columnStr+" from " + table +' where 1=1 ' + whereStr + ' limit 200 '
            else:
                sql = "select " + columnStr + " from " + table + " where  ( version = %s  or  extra_processing = 'y' ) " + whereStr + ' limit 200 '
    return sql
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getColumnMap(request,id):
    strlist = []
    try:
        olaprow = olap.objects.get(id=id)
        table = olaprow.table
        sourceid = olaprow.sourceid
        session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        columns = session.getColumnByTable(table)
        for column in columns:
            field = column['field']
            arr = field.split('__')
            tablename = arr[0]
            col = arr[1]
            sourcedetailrow = sourcedetail.objects.get(sourceid=sourceid, column=col, table=tablename)
            name = sourcedetailrow.title
            strlist.append({
                'col': field,
                'name': name,
            })
    except Exception as error:
        logger.error('---error---file:dashview.py;method:getColumnMap;error=%s' % error)
    return Response(strlist)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getCustomList(request):
    lists = source.objects.filter(custom="1")
    customlists = []
    for row in lists:
        dist = {}
        dist['name'] = row.title
        dist['description'] = row.desc
        dist['url'] = '/api/dash/getCustomData/' + str(row.id)
        dist['id'] = str(row.id)
        dist['group'] = 'customize'
        customlists.append(dist)
    return Response(customlists)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getCustomData(request, id):
    sourcerow = source.objects.get(id=id)
    lists = []
    session = sqlutils.SqlUtils(DBTypeCode.CUSTOM_DB.value,id)
    try:
        lists = session.getDictResult(sourcerow.sql)
    except Exception as error:
        logger.error('---error---file:dashview.py;method:getCustomData;error=%s' % error)
    finally:
        session.closeConnect()
    return Response(lists)

#为场景设计下拉框添加自动加载值的功能，接收参数olapid和columnName
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def getColGroupValue(request):
    olapid=request.data['olapid']
    columnName=request.data['columnName']

    olapObj=olap.objects.get(id=olapid)
    olapCols=json.loads(olapObj.columns.replace("'","\""))
    selColName=''
    for colo in olapCols:
        if columnName in [colo['title'],colo['col'],colo['fullname']]:
            selColName=colo['fullname']

    columnValues=[]
    if olapObj.directconn=='t':
        sourceObj=source.objects.get(id=olapObj.sourceid)
        exeSql='select '+selColName+' from ('+sourceObj.sql+') a group by '+selColName+' order by '+selColName
        logger.info('---execute sql=%s' % exeSql)
        columnValues=odbcsqltool.getDataBysql(conn=None,exesql=exeSql,databaseid=sourceObj.databaseid)
    else:
        tableName=olapObj.table
        if selColName:
            querySql='select "'+selColName+'" from '+tableName+' where "version"=(select max("version") from '\
                     +tableName+') group by '+selColName+' order by '+selColName
            logger.info('---querySql=%s' % querySql)
            # columnValues = sqlutils.getResultBySql(querySql, sqlutils.DATAXEXTENSION_DB_CHAR)
            columnValues = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(querySql,logger,'dashview.py','getColGroupValue')
    groupColValue=[]
    for v in columnValues:
        groupColValue.append(str(str(v[0]).strip() if v[0] else v[0])+'\n')

    if len(groupColValue)>0:#最后一个的空格去掉，js页面去掉做起来比较麻烦
        groupColValue[-1]=groupColValue[-1].replace('\n','')

    return Response({"data":groupColValue})


def strToJson(str):
    return json.loads(str.replace("'", "\""))



#获取数据库、表、字段
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getDBInfo(request):
    resultObj = tools.successMes()
    try:
        databaseId = request.GET['dbid'] if 'dbid' in request.GET else ''
        tableid = request.GET['tableid'] if 'tableid' in request.GET else ''
        getDataType = request.GET['type'] if 'type' in request.GET else ''

        dbInfo = []#获取dbinfo
        if getDataType == 'db' :
            if databaseId:
                allDatabase = Database.objects.filter(id=databaseId)
            else :
                allDatabase = Database.objects.all()
            for dbObj in allDatabase :
                dbinfo = {}
                dbinfo['dbname'] = dbObj.database
                dbinfo['dbid'] = dbObj.id
                dbInfo.append(dbinfo)
        elif getDataType == 'tables' :
            dbInfo = getTableConfig(databaseId)
        elif getDataType == 'columns' :
            dbInfo = getColumnInfo(databaseId,tableid)

        resultObj['data'] = dbInfo
    except Exception as e:
        resultObj = tools.errorMes(e.args)
        print('---error---file:dashview;method:getDBInfo')
        logger.error('---error---file:dashview;method:getDBInfo;error:%s' % e)
    return Response(resultObj)

#获取表信息，把方法独立出来复用
def getTableConfig(databaseId):
    dbInfo = []
    if databaseId and databaseId != 'dataxextension':  # 如果是olap就从olap表取表信息
        tablesByDBId = Tables.objects.filter(database_id=databaseId)
        for tableObj in tablesByDBId:
            tableDict = {}
            tableDict['tableid'] = tableObj.id
            tableDict['tablename'] = tableObj.tables
            tableDict['tablenickname'] = tableObj.name if tableObj.name else tableObj.tables
            dbInfo.append(tableDict)
    else:
        allOlap = olap.objects.filter(directconn__isnull=True) | olap.objects.filter(directconn='')
        for olapObj in allOlap:
            olapDict = {}
            olapDict['tableid'] = olapObj.id
            olapDict['tablename'] = olapObj.table
            olapDict['tablenickname'] = olapObj.name
            dbInfo.append(olapDict)
    return dbInfo
#获取字段信息，把方法独立出来复用
def getColumnInfo(databaseId, tableid):
    dbInfo = []
    if databaseId and databaseId != 'dataxextension' and tableid:
        currTableObj = Tables.objects.get(id=tableid)
        allColumn = Columns.objects.filter(database_id=databaseId, tables=currTableObj.tables)
        for colObj in allColumn:
            columnInfo = {}
            columnInfo['colid'] = colObj.id
            columnInfo['columnname'] = colObj.columns
            columnInfo['columnickname'] = colObj.name
            columnInfo['type'] = colObj.type
            dbInfo.append(columnInfo)
    else:
        allColumn = olapcolumn.objects.filter(olapid=tableid)
        for colObj in allColumn:
            columnInfo = {}
            columnInfo['colid'] = colObj.id
            columnInfo['columnname'] = colObj.column
            columnInfo['columnickname'] = colObj.title
            columnInfo['type'] = ''
            dbInfo.append(columnInfo)
    return dbInfo
#通过olapid获取columnconfig
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getColumnConfigByOlapid(request):
    resultObj = tools.successMes()
    try:
        olapid = request.GET['olapid'] if 'olapid' in request.GET else ''
        getAll = request.GET['getAll'] if 'getAll' in request.GET else ''    #是否获取table和column的值
        columnConfig = {}
        echoAllTableInfo = {}
        echoAllColumnInfo = {}
        if olapid :
            allColumn = olapcolumn.objects.filter(olapid=olapid)
            for colObj in allColumn :
                if not colObj.options or colObj.options == '':
                    columnConfig[colObj.column] = {}
                    columnConfig[colObj.column]['useOlap'] = 1;
                    columnConfig[colObj.column]['useConstantValue'] = 0;
                    columnConfig[colObj.column]['dbid'] = 'dataxextension';
                    columnConfig[colObj.column]['tableid'] = olapid;
                    columnConfig[colObj.column]['colid'] = colObj.id;
                else:
                    colOptions = colObj.options
                    if type(colOptions) == type('stringcharactertype') :
                        colOptions = json.loads(colOptions.replace("'","\""))
                    columnConfig[colObj.column] = colOptions['columnConfig']
            if getAll == 'yes' :
                tempTable = {} #暂存器，避免多次不必要的查询
                tempColumn = {}
                for key,value in columnConfig.items():#配置回显的table，column数据
                    if value['dbid'] not in tempTable :
                        tempTable[value['dbid']] = getTableConfig(value['dbid'])
                        echoAllTableInfo[key] = tempTable[value['dbid']]
                    else :
                        echoAllTableInfo[key] = tempTable[value['dbid']]

                    if value['dbid']+value['tableid'] not in tempColumn :
                        tempColumn[value['dbid']+value['tableid']] = getColumnInfo(value['dbid'],value['tableid'])
                        echoAllColumnInfo[key] = tempColumn[value['dbid']+value['tableid']]
                    else :
                        echoAllColumnInfo[key] = tempColumn[value['dbid']+value['tableid']]

        resultObj['data'] = columnConfig
        resultObj['echoAllTableInfo'] = echoAllTableInfo
        resultObj['echoAllColumnInfo'] = echoAllColumnInfo
    except Exception as error:
        resultObj = tools.errorMes(error.args)
    return Response(resultObj)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveConfigColByOlapDataEdit(request):
    """save column configed by olapDataEdit"""
    resultsObj = tools.successMes()
    try:
        olapId = request.data['olapId'] if 'olapId' in request.data else ''
        columnConfig = request.data['columnConfig'] if 'columnConfig' in request.data else {}
        if type(columnConfig) == type('stringcharacter') :#js传进来的是json字符串，这里需要转对象
            columnConfig = json.loads(columnConfig)
        if not olapId or not columnConfig :
            resultsObj = tools.errorMes('数据异常！')
        else :
            updateCount = 0
            for key, value in columnConfig.items() :
                tempOlapColObj = olapcolumn.objects.get(olapid=olapId,column=key)
                if tempOlapColObj.options :
                    if type(tempOlapColObj.options) != type({}):
                        tempOlapColObj.options = json.loads(tempOlapColObj.options.replace("'","\""))
                    tempOlapColObj.options["columnConfig"] = value
                else :
                    tempOlapColObj.options = {"columnConfig":value}
                tempOlapColObj.save()
                updateCount += 1
            resultsObj['data'] = updateCount
    except Exception as errors:
        resultsObj = tools.errorMes(errors.args)
    return Response(resultsObj)

#根据用户输入的值，调用配置项查询，给出提示值
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def getGroupDataByRefrence(request):
    """save column configed by olapDataEdit"""
    resultsObj = tools.successMes()
    try:
        # olapId = request.data['olapId'] if 'olapId' in request.data else ''
        feildType = request.data['feildType'] if 'feildType' in request.data else ''
        refrence = request.data['refrence'] if 'refrence' in request.data else {}
        inputValue = request.data['inputValue'] if 'inputValue' in request.data else ''

        if type(refrence) == type('stringcharactertype') :
            refrence = json.loads(refrence)

        if feildType in ['number','date']:
            exeSql = 'select %s from %s where %s >= %s group by %s '
        else:
            exeSql = 'select %s from %s where %s like %s group by %s '
        exeSqlParam = []
        rsData = [] #返回结果集
        currColumnStr = '';#暂存当前查询columnname
        session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)#创建查询session
        if refrence['useOlap'] == 1 :#如果是使用olap就从olap里取数据
            olapObj = olap.objects.get(id=refrence['tableid'])
            olapColumnObj = olapcolumn.objects.get(id=refrence['colid'])
            currColumnStr = olapColumnObj.column#暂存
            exeSqlParam.append(olapColumnObj.column)#字段位置1
            exeSqlParam.append(olapObj.table)#表名
            exeSqlParam.append(olapColumnObj.column)#字段位置2
            if feildType == 'int' or feildType == 'double':
                exeSqlParam.append("" + str(inputValue) + "")#参数
            elif feildType == 'date':
                exeSqlParam.append("'" + str(inputValue) + "'")  # 参数
            else:
                exeSqlParam.append("'%%" + inputValue + "%%'")#参数
            exeSqlParam.append(olapColumnObj.column)#字段位置3
        else:
            columnObj = Columns.objects.get(id=refrence['colid'])
            tableObj = Tables.objects.get(id=refrence['tableid'])
            currColumnStr = columnObj.columns  # 暂存
            exeSqlParam.append(columnObj.columns)  #字段位置1
            exeSqlParam.append(tableObj.tables)  #表名
            exeSqlParam.append(columnObj.columns)  #字段位置2
            #以下为给定参数的判断
            if feildType == 'int' or feildType == 'double':
                exeSqlParam.append("" + str(inputValue) + "")#参数
            elif feildType == 'date':
                exeSqlParam.append("'" + str(inputValue) + "'")  # 参数
            else:
                #这里做参数传递时还需要考虑到一个问题：当前olap字段是字符串的year，配置的目标字段却是int类型，所以这里需要转换一下
                if columnObj.type.find('int') or columnObj.type.find('number') or columnObj.type.find('float')\
                        or columnObj.type.find('double') or columnObj.type.find('decimal'):
                    exeSql = 'select %s from %s where %s >= %s group by %s '
                    exeSqlParam.append("" + str(inputValue) + "")  # 参数
                elif columnObj.type.find('date') or columnObj.type.find('time'):
                    exeSql = 'select %s from %s where %s >= %s group by %s '
                    exeSqlParam.append("'" + str(inputValue) + "'")  # 参数
                else:
                    exeSqlParam.append("'%%" + inputValue + "%%'")  # 参数


            exeSqlParam.append(columnObj.columns)  #字段位置3
            session = sqlutils.SqlUtils(DBTypeCode.CUSTOM_DB.value,refrence['dbid'])
        #以下是为了避免查询的目标库里字段名为大写的情况，如果字段名为大写，则sql里select的目标字段必须加上引号才能正确
        #替换添加引号应该从exeSqlParam列表里替换而不是从pagedExeSql执行replace
        try:
            fllExeSql = exeSql % tuple(exeSqlParam)
            # pagedExeSql = session.serverPaginationNoOrder(50, 0, fllExeSql)
            # logger.info('---getGroupDataByRefrence pagedExeSql=%s' % pagedExeSql)
            # executeResult = session.getArrResult(pagedExeSql)
            executeResult = session.getDataFromServerPaginationNoOrder(50, 0, fllExeSql,True)
        except Exception as excuteError:
            logger.error('---error---file:dashview.py;method:getGroupDataByRefrence;error=%s' % excuteError)
            exeSqlParam = ['"' + param + '"' if param == currColumnStr else param for param in exeSqlParam]
            fllExeSql = exeSql % tuple(exeSqlParam)
            # pagedExeSql = session.serverPaginationNoOrder(50, 0, fllExeSql)
            # logger.error('---otherwihsegetGroupDataByRefrence pagedExeSql=%s' % pagedExeSql)
            # executeResult = session.getArrResult(pagedExeSql)
            executeResult = session.getDataFromServerPaginationNoOrder(50, 0, fllExeSql, True)
        session.closeConnect()

        for row in executeResult :
            rsData.append(row[0])
        resultsObj['data'] = rsData
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:dashview.py;method:getGroupDataByRefrence;error=%s' % error)
    return Response(resultsObj)


# region 报表设计器

# 根据ID取报表配置
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getReportConfig(request):
    resultsObj = tools.successMes()
    try:
        mainKey = request.GET['id']
        tableObj = datatable.objects.get(id=mainKey)
        tableDict = sqlutils.model_to_dict_wrapper(tableObj)
        tableDict['jsonconfig'] = json.loads(tableDict['jsonconfig'])
        resultsObj['data'] = tableDict
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:dashview.py;method:getReportConfig;error=%s' % error)
    return Response(resultsObj)


# 保存报表配置
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveReportConfig(request):
    resultsObj = tools.successMes()
    try:
        currentuser = get_user(request)
        reportConfig = request.data['reportConfig']
        if len(reportConfig['key']) == 32:
            tableObj = datatable.objects.get(id=reportConfig['key'])
            tableObj.jsonconfig = json.dumps(reportConfig)
            tableObj.save()
        else:
            datatable.objects.create(name=reportConfig['name'], kind=reportConfig['kind'], jsonconfig=json.dumps(reportConfig), refreshspeed=1, createname=currentuser.username, version=2.01)
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:dashview.py;method:saveReportConfig;error=%s' % error)
    return Response(resultsObj)


# 绘制报表
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def parseReportConfig(request):
    import random
    resultsObj = tools.successMes()
    try:
        reportConfig = request.data['config']
        datas = reportConfig['row']
        session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        isGroup = False
        dataGroupConfigs = []
        for rowNum, row in enumerate(datas):
            for colNum, col in enumerate(row['col']):
                if 'cellDataSource' in col:
                    olapObj = olap.objects.get(id=col['cellDataSource']['olapid'])
                    tableName = olapObj.table
                    if 'summaryGroup' in col and col['summaryGroup']['group']:
                        isGroup = True
                        dataGroupConfigs.append({
                            'olapId': olapObj.id,
                            'tableName': tableName,
                            'rowNum': rowNum,
                            'colNum': colNum,
                            'col': col['cellDataSource']['col'],
                            'parent': col['summaryGroup']['parentRow'],
                            'type': col['summaryGroup']['type']
                        })
                        col['list'] = []
                        if not col['summaryGroup']['parentRow'] or col['summaryGroup']['parentRow'] == '':
                            sql = 'SELECT DISTINCT ' + col['cellDataSource']['col'] + ' FROM ' + tableName + ' where ' + col['cellDataSource']['col'] + ' is not null'
                            tempList = session.getDictResult(sql)
                            for val in tempList:
                                col['list'].append(val[col['cellDataSource']['col']])
                        else:
                            pass
                    else:
                        sql = 'SELECT ' + col['cellDataSource']['col'] + ' FROM ' + tableName + ' where ' + col['cellDataSource']['col'] + ' is not null' + ' order by keyorder LIMIT 10 OFFSET 13'
                        tempList = session.getDictResult(sql)
                        col['list'] = []
                        for val in tempList:
                            col['list'].append(val[col['cellDataSource']['col']])
        # 分组报表计算 目前适用于单个olap
        if isGroup:
            groupSql = 'SELECT {0} FROM {1} t1 WHERE {2} GROUP BY {3} ORDER BY {4}'
            sqlCol = ''
            sqlTableName = ''
            sqlWhere = ''
            sqlGroupBy = ''
            sqlOrderBy = ''
            groupHead = ''
            for i, group in enumerate(dataGroupConfigs):
                if group['parent'] == '':
                    groupHead = group['col']
                sqlTableName = group['tableName']
                if ',sum,avg,max,min,'.find(group['type']) > 0:
                    sqlCol += ' , SUM(t1.' + group['col'] + ') AS ' + group['col']
                else:
                    sqlCol += ' , t1.' + group['col']
                    sqlWhere += ' AND t1.' + group['col'] + ' IS NOT NULL'
                    sqlGroupBy += ' , t1.' + group['col']
                    sqlOrderBy += ' , t1.' + group['col']
            if len(sqlCol) > 5:
                sqlCol = sqlCol[2:len(sqlCol)]
            if len(sqlWhere) > 5:
                sqlWhere = sqlWhere[4:len(sqlWhere)]
            if len(sqlGroupBy) > 5:
                sqlGroupBy = sqlGroupBy[2:len(sqlGroupBy)]
            if len(sqlOrderBy) > 5:
                sqlOrderBy = sqlOrderBy[2:len(sqlOrderBy)]
            groupSql = groupSql.format(sqlCol, sqlTableName, sqlWhere, sqlGroupBy, sqlOrderBy)
            # print(groupSql)
            # 先计算结果条数,过大的话不对外输出
            countGroupSql = 'SELECT COUNT(1) AS num FROM (' + groupSql + ') t'
            groupCount = session.getDictResult(countGroupSql)
            groupCountNum = groupCount[0]['num']
            # print(groupCountNum)
            groupDatas = session.getDictResult(groupSql)
            # print('groupHead:'+groupHead)
            df = pd.DataFrame(groupDatas)
            dfGroup = df.groupby([groupHead])
            for name, group in dfGroup:
                print(name)
                rowPart = group.to_dict(orient='records')
                print(rowPart)
                for rowNum, row in enumerate(rowPart):
                    pass
        # 公式
        for row in datas:
            for col in row['col']:
                if 'formula' in col:
                    # formulaStr = 'SUM(AVERAGE(a5, b5, MAX(c2)), a1, b3, 12) + A2 + (a3+(c5+d1)/2)*4'
                    formulaStr = col['formula']
                    reportUtils = ReportUtils(formulaStr, datas)
                    formulaStr = reportUtils.parseFormula()
                    if str(type(formulaStr)).find('list') > -1:
                        col['list'] = formulaStr
                    elif str(type(formulaStr)).find('str') > -1:
                        col['value'] = eval(formulaStr)
        resultsObj['isGroup'] = isGroup
        resultsObj['data'] = datas
        session.closeConnect()
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:dashview.py;method:parseReportConfig;error=%s' % error)
        if session:
            session.rollBack()
    return Response(resultsObj)
# endregion  