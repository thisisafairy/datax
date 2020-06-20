from django.shortcuts import render
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from connect.models import source, sourcedetail
import json
import pandas as pd


from common import tools
from connect.sqltool import stRestore, PysqlAgent, stRestoreById, stRestoreLocal,DATAXEXTENSION_DB_TYPEVALUE
from connect.lib.data import formateRemote
from api import utils


def colToRow(request):
    return render(request, 'datainsert/table/colToRow.html')


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getSourceColyId(request):
    sourceid = request.query_params['id']
    results = tools.successMes()
    try:
        sourceObj = source.objects.get(id = sourceid)
        lists = sourcedetail.objects.filter(sourceid = sourceid)
        options = {}
        if sourceObj.options is not None and sourceObj.options != '':
            optionsStr = sourceObj.options.replace("'", "\"")
            options = json.loads(optionsStr)
        results['data']['conversionOptions'] = ''
        if options is not None and options != {}:
            conversionId = options['rowToColConfig']['conversionId']
            conversionObj = source.objects.get(id = conversionId)
            conversionOptionsStr = conversionObj.options.replace("'", "\"")
            conversionOptions = json.loads(conversionOptionsStr)
            results['data']['conversionOptions'] = conversionOptions

        results['data']['source'] = utils.model_to_dict_wrapper(sourceObj)
        results['data']['sourceDetail'] = utils.model_list_to_dict_wrapper(lists)
        results['data']['options'] = options
    except Exception as e:
        print('Exception Class: coltorowview.py; Exception Method: getSourceColyId:')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)


# 拖拽后获取数据
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def conversionData(request):
    datajson = request.data['datajson']
    databaseid = request.data['pk']
    sourcecolumns = request.data['sourcecolumn']
    dimList = request.data['dimList']
    columnList = request.data['columnList']
    dataList = request.data['dataList']
    results = tools.successMes()
    try:
        import re
        if databaseid == 'excel':
            st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)
        else:
            st = stRestoreById(databaseid)
        sql = st.sqlBuild(datajson, sourcecolumns)
        rows = st.getData(sql)
        #四则运算和正则的渲染列
        rows = formateRemote(rows,sourcecolumns)
        # 取表名
        mainTable = ''
        i = 0
        for item in datajson:
            if i == 0:
                mainTable = item['item']
        dfRecords, columns = colsToRows(rows, dimList, columnList, dataList, 20, mainTable)
        results['mainTable'] = mainTable
        results['rows'] = dfRecords
        results['cols'] = columns
        pass
    except Exception as e:
        print('file:coltorowview;method:conversionData')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)


# 保存行转列配置
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def saveConversionData(request):

    results = tools.successMes()
    try:
        dimList = request.data['dimList']
        columnList = request.data['columnList']
        dataList = request.data['dataList']
        options = request.data['options']
        sourceObj = request.data['source']
        columns = request.data['columns']
        mainTable = request.data['mainTable']
        sourceName = sourceObj['title'] + '行转列'
        if 'sourceName' in request.data:
            sourceName = request.data['sourceName']
        # 是否有转换过的历史记录
        saveType = 'add'
        if 'rowToColConfig' in options:
            saveType = 'update'
        # 构建source配置
        sourceOptions = {'rowToColConfig': {
            'originId': sourceObj['id'],
            'originName': sourceName,
            'originTable': mainTable,
            'dimList': dimList,
            'columnList': columnList,
            'dataList': dataList
        }}
        if saveType == 'add':
            row = source.objects.create(databaseid=sourceObj['databaseid'], custom=0, sql=sourceObj['sql'], desc='conversionrowtocol',
                                        config=sourceObj['config'], title=sourceName, enabled='y', options=json.dumps(sourceOptions))
            row.save()
        elif saveType == 'update':
            row = source.objects.get(id=options['rowToColConfig']['conversionId'])
            row.title = sourceName
            row.desc = 'conversionrowtocol'
            row.config = sourceObj['config']
            row.enabled = 'y'
            row.options = json.dumps(sourceOptions)
            row.save()
        # 删除历史列配置数据
        sourcedetail.objects.filter(sourceid=row.id).delete()

        # 新增列配置
        for column in columns:
            tableIndex = mainTable + '__'
            field = column['field']
            if tableIndex in field:
                field = field.replace(tableIndex, '')
            colRow = sourcedetail.objects.create(
                sourceid=row.id,
                column=field,
                table=mainTable,
                title=column['title'],
                type=column['type'],
                iscustom='0',
                formatcolumn=column['formatcolumn'],
                ifshow=column['ifshow'],
                distconfig=column['distconfig'],
                column_formula=''
            )
            colRow.save()

        # 在源source中加入配置
        originRow = source.objects.get(id=sourceObj['id'])
        originSourceOptions = {'rowToColConfig': {
            'conversionId': row.id
        }}
        originRow.options = originSourceOptions
        originRow.save()

        pass
    except Exception as e:
        print('file:coltorowview;method:conversionData')
        print(e)
        raise
        return Response(tools.errorMes(e.args))
    return Response(results)


def colsToRows(list, dimList, columnList, dataList, rowCount, mainTable):
    # dimList = [{'field': 'name', 'title': '姓名'}, {'field': 'class', 'title': '班级'}]
    # columnList = [{'field': 'subject', 'title': '学科'}]
    # dataList = [{'field': 'score', 'title': '成绩'}]
    df1 = pd.DataFrame(list)

    dimCols = []
    conversionCols = []
    conversionCols.append(columnList[0]['field'])
    conversionCols.append(dataList[0]['field'])

    # 将要转换成列头的列中的中文替换成英文
    dfColGrouped = df1.groupby(columnList[0]['field'])
    groupCount = 1
    columns = []

    for dim in dimList:
        column = {'field': dim['field'], 'title': dim['title']}
        columns.append(column)
        dimCols.append(dim['field'])

    for name, group in dfColGrouped:
        column = {'field': mainTable + '__column_' + str(groupCount), 'title': name}
        df1.loc[df1[columnList[0]['field']] == name, columnList[0]['field']] = mainTable + '__column_' + str(groupCount)
        columns.append(column)
        groupCount += 1

    df1Group = df1.groupby(dimCols)

    count = 1
    df0 = pd.DataFrame()

    for groupedCol, group in df1Group:
        name = groupedCol
        df2 = group[conversionCols]
        df2.set_index(columnList[0]['field'], inplace=True)
        df3 = df2.T.reset_index(drop=True)
        dimCount = 0
        if len(dimCols) == 1:
            df3[dimCols[0]] = name
        else:
            for dim in dimCols:
                df3[dim] = name[dimCount]
                dimCount = dimCount + 1
        if count == 1:
            df0 = df3
        else:
            df0 = df0.append(df3, ignore_index=True)
        count = count + 1
        pass

    for col in columns:
        dfCol = df0[col['field']]
        try:
            pd.to_datetime(dfCol)
            col['type'] = 'date'
        except:
            try:
                pd.to_numeric(dfCol)
                col['type'] = 'float'
            except:
                col['type'] = 'varchar'
        # colType = dfCol.dtype
        # if 'int' in str(colType) or 'float' in str(colType):
        #     # 重新判断列类型
        #     col['type'] = 'float'
        # elif 'date' in str(colType) or 'time' in str(colType):
        #     col['type'] = 'date'
        # else:
        #     col['type'] = 'varchar'

        col['ifshow'] = '1'
        col['isedit'] = '0'
        col['formula'] = ''
        col['formatcolumn'] = col['field']
        col['distconfig'] = []
        pass
    df0 = df0.fillna(value='')
    # pd转dict
    if rowCount is not None:
        dfRecords = df0.head(rowCount).to_dict(orient='records')
    else:
        dfRecords = df0.to_dict(orient='records')
    return dfRecords, columns
