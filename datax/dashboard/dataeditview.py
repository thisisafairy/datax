from django.db import transaction
from django.shortcuts import render, render_to_response
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import json, os, time
from datetime import datetime
import xlrd
import xlsxwriter
from api import utils as sqlutils
import psutil
import time
from connect.models import olap,source
from connect import odbcsqltool
from dashboard.models import datatable
from common.constantcode import LoggerCode,DBTypeCode
import logging

logger = logging.getLogger(LoggerCode.DJANGOINFO.value)


# 获取grid数据
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def getTableData(request):
    result = {}
    try:
        params = request.data['params']
        defaultVersion = " AND version = (SELECT MAX(version) FROM " + params['tableName'] + ") OR extra_processing = 'y' "
        queryVesion = defaultVersion
        baseSql = 'SELECT {0} FROM ' + params['tableName'] + ' WHERE 1 = 1 ' + queryVesion
        resultSql = baseSql.format('*', '') + ' LIMIT ' + str(params['pageSize']) + ' OFFSET ' + str((int(params['curPage']) - 1) * int(params['pageSize']))
        countSql = baseSql.format('count(*)', '')
        # 获取分页数据
        query_result = sqlutils.getResultBySql(resultSql,sqlutils.DATAXEXTENSION_DB_CHAR)
        # 获取总条数
        query_count = sqlutils.getResultBySql(countSql,sqlutils.DATAXEXTENSION_DB_CHAR)[0][0]
        # 获取对应表的列信息
        # tableStructure = sqlutils.getTableStructure(params['tableName'],sqlutils.DATAXEXTENSION_DB_CHAR)
        tableStructure = []
        try:
            tableStructure = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getTableStructure(params['tableName'])
        except Exception as error:
            logger.error('---error---file:dataeditview.py;method:getTableData;line:41;error=', error)
            print('---error---file:dataeditview.py;method:getTableData;error=', error)

        dataList = []
        for row in query_result:
            rowInfo = {}
            count = 0
            for col in tableStructure:
                rowInfo[col['column_name']] = row[count]
                count = count + 1
            dataList.append(rowInfo)
        result['tableStructure'] = tableStructure
        result['dataList'] = dataList
        result['total'] = query_count
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        result['msg'] = e.args
        print('file:dataeditview; method:getTableData')
        print(e)
    return Response(result)


# excel导出
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def excelExport(request):
    result = {}
    filePath = './frontend/upload/temp_files/'
    if not os.path.exists(filePath):
        os.makedirs(filePath)
    try:
        params = request.data['params']
        # 取数据
        sql = " SELECT * FROM " + params['tableName'] +\
              " WHERE  version = (SELECT MAX(version) FROM " + params['tableName'] + ")  OR extra_processing = 'y'"
        query_result = sqlutils.getResultBySql(sql,sqlutils.DATAXEXTENSION_DB_CHAR)

        # 生成excel
        fileName = str(round(time.time() * 1000)) + '.xlsx'
        workbook = xlsxwriter.Workbook(filePath + fileName)
        worksheet = workbook.add_worksheet()

        columnInfo = params['columns']
        extraCols = params['extraCols']
        titleColNum = 0
        # 写入列头
        for col in columnInfo:
            worksheet.write(0, titleColNum, col['title'])
            titleColNum += 1
        # 额外数据表头
        # worksheet.write(0, titleColNum, '新增时间')
        # titleColNum += 1
        # worksheet.write(0, titleColNum, '版本')
        # titleColNum += 1
        # worksheet.write(0, titleColNum, '额外导入数据')
        # titleColNum += 1
        for col2 in extraCols:
            worksheet.write(0, titleColNum, col2['title'])
            titleColNum += 1
        # 写入数据
        dataRowNum = 1
        for row in query_result:
            count = 0
            for col3 in columnInfo:
                val = row[count]
                # 格式化时间
                if str(type(val)) == "<class 'datetime.datetime'>":
                    val = val.strftime('%Y-%m-%d %H:%M:%S')
                worksheet.write(dataRowNum, count, val)
                count = count + 1
            # 新增时间
            # addtime = row[count]
            # if str(type(addtime)) == "<class 'datetime.datetime'>":
            #         addtime = addtime.now().strftime('%Y-%m-%d %H:%M:%S')
            # worksheet.write(dataRowNum, count, addtime)
            count = count + 1
            # 版本
            # worksheet.write(dataRowNum, count, row[count])
            count = count + 1
            # 额外导入数据
            # worksheet.write(dataRowNum, count, row[count])
            count = count + 1
            for col4 in extraCols:
                val2 = row[count]
                # 格式化时间
                if str(type(val2)) == "<class 'datetime.datetime'>":
                    val2 = val2.strftime('%Y-%m-%d %H:%M:%S')
                worksheet.write(dataRowNum, count-3, val2)
                count = count + 1
            dataRowNum += 1
        workbook.close()
        result['filePath'] = filePath + fileName
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        result['msg'] = e.args
        print('file:dataeditview; method:excelExport')
        print(e)
    return Response(result)


# tabledata excel导出
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def tableDataExcelExport(request):      #场景预览里表格excle数据格式下载，传入表格的column中文名和olapid，以下对下载表格的顺序也做了处理
    result = {}
    filePath = './frontend/upload/temp_files/'
    if not os.path.exists(filePath):
        os.makedirs(filePath)
    try:
        params=json.loads(request.POST['params'])#所有参数
        olapid = params['olapid']
        olapObj=olap.objects.get(id=olapid)#获取olap的各项信息
        tablename=olapObj.table
        directconn=olapObj.directconn
        sourceid=olapObj.sourceid

        getolapcolsql="SELECT \"column\",\"title\" from connect_olapcolumn where olapid='"+olapid+"'"
        colNm=[]#表字段名
        columnName=[]#表字段中文名，用于和传入的表格名字做匹配，如果匹配不上就掠过这个字段
        inputcol=params['columns']#传入的表字段中文名，由于顺序和select*的不同，所以需要从新查询数据库获取表的字段名和字段中文名
        olapcoldt=sqlutils.getResultBySql(getolapcolsql)
        #保证sql查询除的clumn和ajax传入的columsName一致，这里只是字段，数据不会太多，可以两层循环
        for iptcol in inputcol:
            for col in olapcoldt:
                if col[1] ==iptcol:
                    colNm.append('"'+col[0]+'"')  # 表字段名，用于sql查询
                    columnName.append(col[1])  # 表字段中文名，用于excel的表头
                    break #跳出当前for循环
        # 取数据
        query_result=[]
        if directconn == 't':#如果是直连，则用souce里的sql获取
            sourceObj=source.objects.get(id=sourceid)
            sourceSqlStr=sourceObj.sql
            sql=" SELECT "+','.join(colNm)+" FROM (" + sourceSqlStr+") m sample 2000"
            print('tableDataExcelExport exeSql=', sql)
            query_result=odbcsqltool.getDataBysql(conn=None,exesql=sql,databaseid=sourceObj.databaseid)
        else:
            sql = " SELECT "+','.join(colNm)+" FROM " + tablename +\
                  " WHERE  version = (SELECT MAX(version) FROM " + tablename + ")  OR extra_processing = 'y'"
            print('tableDataExcelExport exeSql=',sql)
            query_result = sqlutils.getResultBySql(sql,sqlutils.DATAXEXTENSION_DB_CHAR)
            if len(query_result)>2000:#取前2000行数据
                query_result=query_result[:2000]

                # 生成excel
        fileName = str(round(time.time() * 1000)) + '.xlsx'
        workbook = xlsxwriter.Workbook(filePath + fileName)
        worksheet = workbook.add_worksheet()

        # columnName = request.data['columns']
        #查找场景预览里表格看的到的列头，这个列头可能是表格组件重新对表格列头进行编辑以后的
        theads=params['theads']
        tableHeadNm=[]
        for colNm in columnName:
            for theadObj in theads:
                if colNm == theadObj['field']:
                    tableHeadNm.append(theadObj['title'])
                    break
        #查找列头结束
        titleColNum = 0
        # 写入列头
        for col in tableHeadNm:
            worksheet.write(0, titleColNum, col)
            titleColNum += 1
        # 写入数据
        dataRowNum = 1
        for row in query_result:
            count = 0
            for col3 in columnName:
                val = row[count]
                # 格式化时间
                if str(type(val)) == "<class 'datetime.datetime'>":
                    val = val.now().strftime('%Y-%m-%d %H:%M:%S')
                worksheet.write(dataRowNum, count, val)
                count = count + 1
            dataRowNum += 1

        workbook.close()
        result['filePath'] = filePath + fileName
        # result['fileName'] = fileName
        result['code'] = 1
    except Exception as e:
        raise e
        result['code'] = 0
        result['msg'] = e.args
        print('file:dataeditview; method:excelExport')
        print(e)
    return Response(result)


# excel模板导出
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def excelExportTemplate(request):
    result = {}
    filePath = './frontend/upload/temp_files/'
    if not os.path.exists(filePath):
        os.makedirs(filePath)
    try:
        params = request.data['params']

        # 生成excel
        fileName = str(round(time.time() * 1000)) + '.xlsx'
        workbook = xlsxwriter.Workbook(filePath + fileName)
        worksheet = workbook.add_worksheet()

        columnInfo = params['columns']
        extraCols = params['extraCols']
        titleColNum = 0
        # 写入列头
        for col in columnInfo:
            worksheet.write(0, titleColNum, col['title'])
            titleColNum += 1
        for col2 in extraCols:
            worksheet.write(0, titleColNum, col2['title'])
            titleColNum += 1
        workbook.close()
        result['filePath'] = filePath + fileName
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        result['msg'] = e.args
        print('file:dataeditview; method:excelExportTemplate')
        print(e)
    return Response(result)


# excel导入
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
@transaction.atomic
def excelImport(request):
    result = {}
    session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    try:
        f = request.FILES['filename']
        tableName = request.POST['tableName']
        columns = json.loads(request.POST['columns'])
        extraCols = json.loads(request.POST['extraCols'])
        coverUpload = request.POST['coverUpload']
        if coverUpload == 'true':
            session.executeUpdateSql("delete from " + tableName + " where version = 0 and extra_processing = 'y'")
        # 读excel
        wb = xlrd.open_workbook(file_contents=f.read())
        table = wb.sheets()[0]
        row = table.nrows
        for i in range(1, row):
            # 上传的excel中不包括数据增加时间,版本,是否额外导入字段
            # olap生成的表中字段排列为基础数据，增加时间,版本,是否额外导入字段，额外动态生成字段
            colCount = 0
            col = table.row_values(i)
            sql = "INSERT INTO " + tableName + " VALUES ("
            for val in col:
                try:
                    sql = sql + "'" + str(int(val)) + "', "
                except Exception as e1:
                    sql = sql + "'" + str(val) + "', "
                colCount = colCount + 1
                if colCount == len(columns):
                    break
            sql = sql + " now(), '0', 'y'"
            colCount2 = 0
            for val2 in col:
                colCount2 = colCount2 + 1
                if colCount2 > colCount:
                    try:
                        sql = sql + ", '" + str(int(val2)) + "'"
                    except Exception as e2:
                        sql = sql + ", '" + str(val2) + "'"
                else:
                    continue
            sql = sql + ")"
            # print(sql)
            # 插入一行
            session.executeUpdateSql(sql)
        result['code'] = 1
        session.closeConnect()
    except Exception as e:
        session.rollBack()
        logger.error('---error---file:dataeditview.py;method:excelImport;error=%s' % e)
        result['code'] = 0
        result['msg'] = e.args
    return Response(result)


# olap数据增删改处理
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def olapDataUpdate(request):
    result = {}
    session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    try:
        columns = request.data['columns']
        tableName = request.data['tableName']
        # tableStructure = sqlutils.getTableStructure(tableName,sqlutils.DATAXEXTENSION_DB_CHAR)
        tableStructure = []
        try:
            tableStructure = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getTableStructure(tableName)
        except Exception as error:
            logger.error('---error---file:dataeditview.py;method:olapDataUpdate;line:340;error=', error)
            print('---error---file:dataeditview.py;method:olapDataUpdate;error=', error)

        operationType = request.data['operationType']
        # 批量删除
        if operationType == 'delete':
            rows = request.data['rows']
            for row in rows:
                sql = "DELETE FROM " + tableName + " WHERE 1 = 1 "
                for col in tableStructure:
                    val = checkParam(str(row[col['column_name']]),col['data_type'])[:-2]  #截取最后的逗号
                    if col['column_name'] == 'extra_processing':
                        if val == 'n' or val == 'N' or val is None:
                            val = '-'
                    if val.strip() == 'NULL':
                        sql = sql + " AND " + col['column_name'] + " is " + val
                    else:
                        sql = sql + " AND " + col['column_name'] + "=" + val

                print('olapDataUpdate delete sql=',sql)
                session.executeUpdateSql(sql)
        # 新增
        elif operationType == 'add':
            dataObj = request.data['row']
            sql = "INSERT INTO " + tableName + " VALUES ("
            # print('dataObj=',dataObj)
            for col in columns:
                currColType = getColumnTypeByTableStruct(col['fullname'],tableStructure)
                val = checkParam(str(dataObj[col['fullname']]),currColType)
                sql = sql + val
            sql = sql + " now(), '0', 'y') "
            print('olapDataUpdate add sql=', sql)
            session.executeUpdateSql(sql)
        # 编辑
        elif operationType == 'update':
            dataObj = request.data['row']
            oldRow = request.data['oldRow']
            sql = "UPDATE " + tableName + " SET "
            for colInfo in columns:
                currColType = getColumnTypeByTableStruct(colInfo['fullname'], tableStructure)
                tempV = checkParam(str(dataObj[colInfo['fullname']]),currColType)
                sql = sql + " " + colInfo['fullname'] + "=" + tempV
            sql = sql[:-2] + " WHERE "
            for colInfo in columns:#where条件语句拼接，把空值换成is null的形式查询，否则查不出来
                currColType = getColumnTypeByTableStruct(colInfo['fullname'], tableStructure)
                tempV = checkParam(str(oldRow[colInfo['fullname']]), currColType)[:-2]
                if tempV.strip() == 'NULL':
                    sql = sql + " " + colInfo['fullname'] + " is " + tempV + ' AND '
                else:
                    sql = sql + " " + colInfo['fullname'] + "=" + tempV + ' AND '
            sql = sql + " version = '0' AND extra_processing = 'y' "
            print('olapDataUpdate update sql=', sql)
            session.executeUpdateSql(sql)
        result['code'] = 1
        session.closeConnect()
    except Exception as e:
        session.rollBack()
        logger.error('---error---file:dataeditview.py;method:olapDataUpdate;error=%s' % e)
        result['code'] = 0
        result['msg'] = e.args
        print('file:dataeditview; method:olapDataUpdate')
        print(e)
    return Response(result)

#通过columnName从tableStructure获取column的字段类型
def getColumnTypeByTableStruct(columnName,tableStructure):
    for tableStruct in tableStructure :
        if columnName == tableStruct['column_name'] :
            return tableStruct['data_type']
    return ''
#通过columnType返回val的值，如果是空且是数值类型，就返回NULL
def checkParam(val,currColType) :
    try:
        if not val or not val.strip():  # 判断如果数值为空的时候就拼接Null而不是''
            if currColType.find('int') > -1 or currColType.find('decimal') > -1 or currColType.find('numeric') > -1 or \
                    currColType.find('double') > -1 or currColType.find('serial') > -1:
                return " NULL, "
            elif currColType.find('date') > -1 or currColType.find('time') > -1:
                return " NULL, "
            else:
                return "'" + val + "', "
        elif val.lower().find('none') > -1 or val.lower().find('null') > -1 or val.lower().find('nan') > -1:
            return " NULL, "
        else:
            return "'" + val + "', "
    except Exception as error:
        print('--error--dataeditview.py;method:checkParam;error=',error.args)
        return "'" + val + "', "

####数据导入的下载导入模板文件
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def downloadTemplateFile(request):
    rs={}
    ftype=request.GET['tpfiletype']
    filePath='/frontend/upload/user_default/TempFile'
    if ftype=='excel':
        filesuffix='.xlsx'
        rs['code']=1
    elif ftype=='txt':
        filesuffix = '.txt'
        rs['code'] = 1
    elif ftype=='csv':
        filesuffix = '.csv'
        rs['code'] = 1
    elif ftype=='json':
        filesuffix = '.json'
        rs['code'] = 1
    elif ftype=='xml':
        filesuffix = '.xml'
        rs['code'] = 1
    else:
        rs['code']=0

    rs['dtfiletype']=filesuffix#页面要用一下这个值
    rs['filePath']=filePath+filesuffix
    return Response(rs)

# 使用psutil获得系统性能数据
def get_server_info():
    cpu = psutil.cpu_percent(interval=1)  # CPU使用率
    memory = float(psutil.virtual_memory().used) / float(psutil.virtual_memory().total) * 100.0  # 内存使用率
    # 处理个别服务器没有磁盘值得问题
    if (psutil.disk_io_counters(perdisk=False) == 'NoneType'):
        psutil.disk_io_counters(perdisk=False).read_bytes = 0
    last_disk = (psutil.disk_io_counters(perdisk=False).read_bytes + psutil.disk_io_counters(
        perdisk=False).write_bytes) / 1024.0 / 1024.0  # 直到当前服务器硬盘已经读取和写入的bytes总和
    last_network = (psutil.net_io_counters().bytes_sent + psutil.net_io_counters().bytes_recv) / 1024.0 / 1024.0  # 直到当前服务器网络已经上传和下载的bytes总和
    time.sleep(1)
    disk_read = psutil.disk_io_counters(perdisk=False).read_bytes / 1024.0 / 1024.0  # 直到当前服务器硬盘已经读取的MB
    disk_write = psutil.disk_io_counters(perdisk=False).write_bytes / 1024.0 / 1024.0  # 直到当前服务器硬盘已经写入的MB
    network_recv = psutil.net_io_counters().bytes_recv / 1024.0 / 1024.0  # 直到当前服务器网络已经上传的MB
    network_sent = psutil.net_io_counters().bytes_sent / 1024.0 / 1024.0  # 直到当前服务器网络已经下载的MB
    disk = disk_read + disk_write - last_disk   # 得到这一秒服务器硬盘读取和写入的总和 单位MB
    network = network_sent + network_recv - last_network  # 得到这一秒服务器网络上传和下载的总和 单位MB
    server_info = {'cpu': cpu,
                   'memory': memory,
                   'network': network,
                   'network_recv': network_recv,
                   'network_sent': network_sent,
                   'disk': disk,
                   'disk_read': disk_read,
                   'disk_write': disk_write,
                   }
    return server_info
