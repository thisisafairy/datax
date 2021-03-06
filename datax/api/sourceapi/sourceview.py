from django.contrib.auth import get_user, get_permission_codename
from django.forms import model_to_dict

from connect.models import *
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from api import utils
from rest_framework import generics, filters, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import json, os
import time
from xml.etree import ElementTree
from connect.sqltool import stRestore, PysqlAgent, stRestoreById, stRestoreLocal,DATAXEXTENSION_DB_TYPEVALUE
from connect.file import Text, Excel, XmlRead, JsonRead
from common.utils import Utils
from common.head import LIMIT
from common import tools
from common.constantcode import ConstantCode as CODE,LoggerCode,DBTypeCode
from connect.lib.data import formateRemote
import xlrd
from api import utils as sqlutils
import pyodbc
from connect import odbcsqltool
from common.head import DATAXEXTENSION_DB_INFO as dataxExtDB
import csv
from xlrd import xldate_as_tuple
from common.head import DEFAULT_DB_INFO,DATAXEXTENSION_DB_INFO
from django.core.exceptions import ObjectDoesNotExist
from connect.olap import OlapClass
import re

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getSources(request):
    database = Database.objects.filter(fromolapadd__isnull=True) | Database.objects.filter(fromolapadd='')
    result = []
    from datax import settings
    database_info = settings.DATABASES
    local_url = database_info['default']['HOST'] + ':' + database_info['default']['PORT']
    lacal_db = database_info['default']['NAME']
    for row in database:
        dist = {}
        dist['id'] = row.id
        dist['database_type'] = row.database_type
        dist['database'] = row.database
        result.append(dist)
    objs = Database.objects.filter(database=DATAXEXTENSION_DB_INFO['db'])
    databaseid='_None'
    for obj in objs:
        if obj.ip == DATAXEXTENSION_DB_INFO['ip'] and obj.database == DATAXEXTENSION_DB_INFO['db'] and \
                obj.database_type == DATAXEXTENSION_DB_INFO['kind']:
            databaseid = obj.id
    result.append({'id': 'excel' + databaseid, 'database_type': '???????????????', 'database': 'excel'})
    return Response(result)


@api_view(http_method_names=['POST'])
def testPing(request):
    result = {}
    result['code'] = 0
    try:
        #?????????dsn??????
        # if 'dsnname' in request.POST and 'dsnstatus' in request.POST and request.POST['dsnstatus']=='t':
        #     dsnname=request.POST['dsnname']
        #     password=request.POST['password']
        #     try:
        #         dsnConUrl='DSN='+dsnname+';PWD='+password
        #         print('dsnConUrl=',dsnConUrl)
        #         cnxn = pyodbc.connect(dsnConUrl)
        #         result['code']=1
        #         result['msg']='ODBC????????????'
        #     except Exception as e:
        #         result['msg']=e.args[0]
        #     return Response(result)
        #ip???odbc??????
        data = {}
        data['kind'] = request.POST['type']
        if data['kind']=='odbc':
            data['ip'] = request.POST['ip']
        else:
            data['ip'] = request.POST['ip'] + ":" + request.POST['port']
        # if data['kind'] != 'odbc':
        #     data['db'] = request.POST['database']
        data['db'] = request.POST['database'] if 'database' in request.POST else ''
        data['user'] = request.POST['user_name']
        data['pwd'] = request.POST['password']

        ##?????????odbc???????????????odbc???????????????
        if data['kind']=='odbc':
            try:
                odbcConUrl = 'DRIVER={' + request.POST['odbcdriver'] + '};'
                odbcConUrl = odbcConUrl + 'SERVER=' + data['ip'] + ';'
                if data['db']:
                    odbcConUrl = odbcConUrl + 'DATABASE=' + data['db'] + ';'
                odbcConUrl = odbcConUrl + 'UID=' + data['user'] + ';'
                odbcConUrl = odbcConUrl + 'PWD=' + data['pwd'] + ';'
                print('odbcConUrl=',odbcConUrl)
                pyodbc.connect(odbcConUrl)
                result['code']=1
                result['msg']='ODBC????????????'
            except Exception as e:
                result['msg'] = 'ODBC????????????,??????????????????????????????'
            return Response(result)
        ##????????????????????????
        try:
            st = stRestore(data)
            result['code'] = 1
            result['msg'] = '?????????????????????'
        except Exception as e:
            # raise e
            result['msg'] = '?????????????????????,??????????????????????????????'
    except Exception as e:
        result['msg'] = e.args[0]
    return Response(result)


@api_view(http_method_names=['POST'])
def saveSource(request):
    returnObj = tools.successMes()
    try:
        data = {}
        pk = request.POST['id'] if 'id' in request.POST else ''
        data['kind'] = request.POST['type']
        data['fromOlapAdd'] = request.POST['fromOlapAdd'] if 'fromOlapAdd' in request.POST else ''  #????????????olap?????????????????????
        if data['kind']=='odbc':
            data['ip'] = request.POST['ip']
            data['db'] = request.POST['database'] if 'database' in request.POST else ''
            data['odbcdriver']=request.POST['odbcdriver']
        else:
            data['ip'] = request.POST['ip'] + ":" + request.POST['port']
            data['db'] = request.POST['database']

        data['user'] = request.POST['user_name']
        data['pwd'] = request.POST['password']
        #odbc?????????getODBCCon odbcConUrl=
        if data['kind']=='odbc':
            try:
                odbcDriver = ''
                if data['odbcdriver']:
                    odbcDriver = data['odbcdriver']
                else:
                    raise Exception('odbcDriver?????????')

                conn = odbcsqltool.getODBCCon(odbcDriver, data['ip'],data['db'], data['user'], data['pwd'])  # ?????????????????????????????????
                if not conn:
                    raise Exception('odbc???????????????')
                else:
                    conn.close()
                odbcDBType = odbcsqltool.odbcGetDBTypeFromDrive(odbcDriver)
                if not odbcDBType:
                    raise Exception('??????????????????????????????')

                if pk != '' and len(pk) > 0:
                    Database.objects.filter(id=pk).delete()

                Database.objects.get_or_create(ip=data['ip'],database=data['db'],user_name=data['user'], password=data['pwd']
                                               , database_type='odbc', odbcdriver=odbcDriver, odbcstatus=odbcDBType)
                returnObj['data']='???????????????????????????!'
            except Exception as e:
                print('file:sourceview;method:saveSource')
                returnObj = tools.errorMes('?????????????????????????????????????????????????????????')
        else:
            #??????????????????????????????
            try:
                st = stRestore(data)
                if pk != '' and  len(str(pk)) > 0:
                    Database.objects.filter(id=pk).delete
                    Columns.objects.filter(database_id=pk).delete()
                    Tables.objects.filter(database_id=pk).delete()
                rs = st.buildTableStruct(data)
                if rs:
                    returnObj['data'] = '???????????????????????????!'
                    returnObj['id'] = rs
                    returnObj['database'] = data['db']
                else:
                    returnObj = tools.errorMes('???????????????????????????????????????')
            except Exception as e:
                print('file:sourceview;method:saveSource')
                returnObj = tools.errorMes('?????????????????????????????????????????????????????????')
    except Exception as err:
        returnObj = tools.errorMes(err.args)
    return Response(returnObj)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def systemList(request):
    data = {}
    postdata = request.data['data']
    data['ip'] = postdata['ip'] + ":" + postdata['port']
    data['user'] = postdata['user_name']
    data['pwd'] = postdata['password']
    data['kind'] = postdata['type']
    systeminfo = Utils().getSystemInfo(data['kind'])
    data['db'] = systeminfo['database']
    result = {}
    result['code'] = 0
    try:
        st = stRestore(data)
        rs = st.getDatabase(systeminfo)
        result['code'] = '1'
        result['msg'] = '???????????????????????????'
        result['list'] = rs
    except Exception as e:
        result['msg'] = e.args[0]
    return Response(result)

#??????pk??????tables???columns???????????????????????????????????????????????????????????????
def getTablesByPk(pk,result):
    tablelist = []
    columnlist = []
    if pk.startswith('excel'):
        sql = """select a."columns",a."name",a."type",a.tables,a.ifshow from connect_columns a
                        where a.database_id = '""" + pk[5:] + """' and a.ifshow = '1'"""
        print('sql=', sql)
        # columns = utils.getResultBySql(sql)
        columns = utils.SqlUtils().getArrResultWrapper(sql,logger,'sourceview.py', 'getTablesByPk')

        for column in columns:
            dist = {}
            dist['Field'] = column[0]
            dist['name'] = column[1]
            dist['type'] = column[2]
            dist['table'] = column[3]
            dist['ifshow'] = column[4]
            columnlist.append(dist)

        tables = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE).listTables()
        tables.sort()
        tableObjs = []
        for table in tables:
            try:
                if table.startswith('excel'):
                    objs = Tables.objects.filter(tables=table).order_by('-createtime')
                    if objs.exists():
                        tableObjs.append((table, objs))  # ?????????????????????tuple???????????????????????????
                    else:
                        dist = {}
                        dist['table'] = table
                        dist['tablename'] = table
                        dist['ifshow'] = "1"
                        tablelist.append(dist)
            except Exception as e:
                print('file:sourceview.py;method:getTables')
                print(e)
                pass
        try:
            if tableObjs:
                tableObjs.sort(key=lambda x: x[1][0].createtime if x[1][0].createtime else datetime.date(1970, 1,1))  # ????????????excel????????????????????????
        except Exception as err:
            print('file:sourceview.py;method:getTables---??????????????????????????????')
            print(err)
        try:
            for table, objs in tableObjs:
                for obj in objs:
                    dist = {}
                    dist['table'] = table
                    if obj.name is not None:
                        dist['tablename'] = obj.name
                    else:
                        dist['tablename'] = table
                    dist['ifshow'] = "1"
                    tablelist.insert(0, dist)
        except Exception as err:
            print('file:sourceview.py;method:getTables')
            print(err)
            pass
        result['table'] = tablelist
        result['column'] = columnlist
    elif len(pk) > 0:
        try:
            sql = """select a."columns",a."name",a."type",a.tables,a.ifshow from connect_columns a
                        where a.database_id = '""" + pk + """' and a.ifshow = '1'"""
            # columns = utils.getResultBySql(sql)
            columns = utils.SqlUtils().getArrResultWrapper(sql,logger, 'sourceview.py', 'getTablesByPk')
            for column in columns:
                dist = {}
                dist['Field'] = column[0]
                dist['name'] = column[1]
                dist['type'] = column[2]
                dist['table'] = column[3]
                dist['ifshow'] = column[4]
                columnlist.append(dist)

            tables = Tables.objects.filter(database_id=pk).order_by('tables')
            for table in tables:
                tabledist = {}
                tabledist['table'] = table.tables
                if table.name is None or table.name == '':
                    tabledist['tablename'] = table.tables
                else:
                    tabledist['tablename'] = table.name
                tabledist['ifshow'] = table.ifshow
                tabledist['isedit'] = '0'
                # tabledist['column'] = list(filter(lambda s: table.tables == s['table'] , columnlist))
                tablelist.append(tabledist)
            result['table'] = tablelist
            result['column'] = columnlist
        except Exception as e:
            result['msg'] = e.args[0]
            print('---error---file:sourceview.py;method:getTables')
            print(e)
    else:
        print('-----don\'t know what should to do!!!----')
    return result

@api_view(http_method_names=['GET'])
def getTables(request, pk=0):
    result = tools.successMes()
    result['code'] = 0
    try:
        result=getTablesByPk(pk,result)
    except Exception as e:
        print('file:sourceview.py;method:getTables')
        print(e)
    return Response(result)


@api_view(http_method_names=['GET'])
def refreshTablesBySrc(request, pk=0):
    resultObj = tools.successMes()
    try:
        if pk and pk!=0 and len(pk)>0:
            connInfo={}
            dbInfoObj=Database.objects.get(id=pk)
            connInfo['id']=pk
            connInfo['kind']=dbInfoObj.database_type
            connInfo['ip']=dbInfoObj.ip
            connInfo['db']=dbInfoObj.database
            connInfo['user']=dbInfoObj.user_name
            connInfo['pwd']=dbInfoObj.password

            if dbInfoObj.database_type != 'odbc':
                targetst = stRestore(connInfo)
                #??????pk?????????DataSource???tables?????????columns???tables???????????????
                rs = targetst.buildTableStruct(connInfo)#?????????????????????
                if rs:
                    #???????????????tables???column
                    resultObj=getTablesByPk(pk, resultObj)
                else:
                    resultObj = tools.errorMes('???????????????????????????????????????')
        else:
            resultObj = tools.errorMes('?????????????????????')
    except Exception as err:
        resultObj = tools.errorMes(err.args)
    return Response(resultObj)

#????????????,????????????,??????isGetTableName????????????
#???isGetTableName==1??????????????????
#???isGetTableName==2?????????tableName??????????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def getTableAndColumnNamesByConnInfo(request):
    returnObj = tools.successMes()
    try:
        postData = request.data['data'];
        connObj = {}
        connObj['type'],connObj['ip'],connObj['port'] = postData['type'],postData['ip'],postData['port']
        connObj['username'],connObj['password'],connObj['db'] = postData['user_name'],postData['password'],postData['database']
        isGetTableName = postData['isGetTableName'] if 'isGetTableName' in postData else ''#1???gettabel???2:getColumnByTable
        currSeleTableName = postData['tableName'] if 'tableName' in postData else ''
        print('-----isGetTableName=',isGetTableName)
        print('-----currSeleTableName=',currSeleTableName)
        print('-----connObj=',connObj)

        session = sqlutils.SqlUtils(dbType='custom',connInfo=connObj)
        #????????????
        getTablesSqlObj = Utils().databaseColumn(connObj['type'], currSeleTableName, connObj['db'])
        tableNames = []
        currSeleTBColumns = []
        if isGetTableName and isGetTableName == '1':
            if "getAllTableSql" in getTablesSqlObj:
                tablelists = session.getDictResult(getTablesSqlObj['getAllTableSql'])
                for tablerow in tablelists:
                    tableNames.append(tablerow[getTablesSqlObj['columnTableField']])
            else:
                raise Exception('??????????????????????????????????????????')
        elif isGetTableName and isGetTableName == '2' and currSeleTableName:
            columnQuerySets = session.getDictResult(getTablesSqlObj['getTableColumnSql'])
            if 'name' in getTablesSqlObj:
                feildNm = getTablesSqlObj['name']
            else:
                feildNm = getTablesSqlObj['columnField']
            for colObj in columnQuerySets:
                if colObj[feildNm] is None or colObj[feildNm] == '':
                    currSeleTBColumns.append({'name':colObj[getTablesSqlObj['columnField']],'feild':colObj[getTablesSqlObj['columnField']]})
                else:
                    currSeleTBColumns.append({'name':colObj[feildNm],'feild':colObj[getTablesSqlObj['columnField']]})
        returnObj['tableNames'] = tableNames
        returnObj['currSeleTBColumns'] = currSeleTBColumns
    except Exception as e:
        returnObj = tools.errorMes(e)
    return Response(returnObj)

#????????????,??????isGetTableName????????????
#???isGetTableName==1??????????????????
#???isGetTableName==2?????????tableName??????????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def getDataByConnInfo(request):
    returnObj = tools.successMes()
    try:
        postData = request.data['data'];
        print('------postDataa=',postData)
        whereOptions = postData['whereOptions']
        connObj = {}
        connObj['type'],connObj['ip'],connObj['port'] = postData['type'],postData['ip'],postData['port']
        connObj['username'],connObj['password'],connObj['db'] = postData['user_name'],postData['password'],postData['database']
        limitPage = postData['pagelimit'] if 'pagelimit' in postData else 100

        session = sqlutils.SqlUtils(dbType='custom',connInfo=connObj)
        #??????sql??????
        queryDictSql = 'select ' + postData['currSeleTbColumn'] + ' as dictDt from ' + postData['tablename'] + ' where 1=1 '
        if type(whereOptions) == type('stringstringstring'):
            whereOptions = json.loads(whereOptions)
        whereSql = ''
        for whereObj in whereOptions:
            if whereObj['column'] and whereObj['column'].strip() and \
                    whereObj['operator'] and whereObj['operator'].strip() and \
                    whereObj['optvalue'] and whereObj['optvalue'].strip() :
                whereSql += ' and ' + whereObj['column'] + ' ' + whereObj['operator'] + ' \'' + whereObj['optvalue'] +'\' '
        queryDictSql += whereSql
        queryDictSql += ' group by ' + postData['currSeleTbColumn']#groupby
        # queryDictSql = session.serverPaginationNoOrder(limitPage, 0, queryDictSql)
        # print('=-----queryDictSql=',queryDictSql)
        # querySet = session.getDictResult(queryDictSql)
        returnObj['dictData'] = session.getDataFromServerPaginationNoOrder(limitPage, 0, queryDictSql)
    except Exception as e:
        returnObj = tools.errorMes(e)
    return Response(returnObj)


@api_view(http_method_names=['POST'])
# @permission_classes((permissions.AllowAny, ))
def uploadfile(request):
    f = request.FILES['filename']
    # ?????????????????????
    if 'file_show_name' in request.POST:
        file_extra_name = request.POST['file_show_name']
        if file_extra_name != 'undefined' and file_extra_name != '':
            f.name = file_extra_name
    #excel???????????????
    excel_nullchrepl = []
    if 'excel_nullchrepl' in request.POST:
        excel_nullchreplstr = request.POST['excel_nullchrepl']
        if excel_nullchreplstr and excel_nullchreplstr.strip():
            excel_nullchrepl=[ x for x in excel_nullchreplstr.split(',') if x]#??????????????????????????????
    file_table_name = ''
    st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)
    return_mess = -1
    rs={'code':0}
    try:
        file_type = request.POST['type']
        file_name = file_type + "_" + str(int(time.time()))
        file_table_name = file_name
        if file_type == 'excel':
            sheets = ['Sheet1', 'Sheet2']
            return_mess, file_table_name = Excel(f, file_name,excel_nullchrepl).reflectToTables(st)
        elif file_type == 'txt':
            file_symbol_type = request.POST['symbol_type']
            if file_symbol_type == 'tab':
                symbol = '\t'
            elif file_symbol_type == 'comma':
                symbol = ','
            elif file_symbol_type == 'comma_c':
                symbol = '???'
            elif file_symbol_type == 'blank1':
                symbol = ' '
            elif file_symbol_type == 'blank2':
                symbol = '  '
            file_class = Text(st, f, file_name, file_type)
            file_class.setSpliter(symbol)
            return_mess = file_class.reflectToTable()
        elif file_type == 'csv':
            file_class = Text(st, f, file_name, file_type)
            file_class.setSpliter(',')
            return_mess = file_class.reflectToTable()
        elif file_type == 'json' or file_type == 'xml':
            json_str = ''
            line = f.readline()
            while line:
                try:
                    line_str = str(line, encoding="utf-8")
                except Exception as e:
                    try:
                        line_str = str(line, encoding="gbk")
                    except Exception as e:
                        return Response({'succ': False, 'return_mess': CODE.ENCODING_EXCEPTION.value})
                json_str = json_str + line_str
                line = f.readline()
            if json_str != '':
                if json_str.startswith(u'\ufeff'):
                    json_str = json_str.encode('utf8')[3:].decode('utf8')
                json_str = json_str.replace('\n', '')
                json_str = json_str.replace('\t', '')
                json_str = json_str.replace('\r', '')
                #  json_str =  '[{"id":"1","price":"71.72"},{"id":"2","price":"233"}]'
                if file_type == 'json':
                    json_read = JsonRead(st, f, json_str)
                    return_mess = json_read.get_json_data()
                if file_type == 'xml':
                    xml_read = XmlRead(st, f, json_str)
                    return_mess = xml_read.get_xml_data()
        rs['code']=1
    except Exception as e:
        rs['msg']=e.args
        print('===error===file:sourceview.py,method:uploadfile,line:320',e.args)
    if return_mess != -1 and str(type(return_mess)).index('enum') > -1 :
        rs['return_code']=return_mess.value
        rs['file_table_name']=file_table_name
        return Response(rs)

    rs['return_code'] = return_mess
    rs['file_table_name'] = file_table_name
    return Response(rs)

@api_view(http_method_names=['POST'])
def coverFile(request):
    f = request.FILES['filename']
    # ?????????????????????
    tableName = request.POST['tableName']
    return_mess = -1
    upload_type=request.POST['upload_type']#????????????????????????????????????
    # excel???????????????
    excel_nullchrepl = []
    if 'excel_nullchrepl' in request.POST:
        excel_nullchreplstr = request.POST['excel_nullchrepl']
        if excel_nullchreplstr and excel_nullchreplstr.strip() and excel_nullchreplstr != 'undefined':
            excel_nullchrepl = [x for x in excel_nullchreplstr.split(',') if x]  # ??????????????????????????????

    session = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    try:
        tablePref=tableName.split('_')[0]
        # #???????????????????????????????????????????????????????????????
        # fname=f.name
        # fileSuff=fname[fname.rfind('.')+1:]if fname.rfind('.')>0 else ''
        # if fileSuff != tablePref:
        #     print('----file type error---')
        #     raise Exception('??????????????????')
        if tablePref=='csv':
            if upload_type == 'true':  # upload_type true???????????????false????????????
                session.executeUpdateSql("delete from " + tableName)
            spliter=','
            #?????????????????????????????????????????????
            f.seek(0)
            f.readline()

            line = f.readline()
            while line:
                try:
                    line_data = [w.strip() for w in str(line, encoding="utf-8").split(spliter)]
                except Exception as e:
                    line_data = [w.strip() for w in str(line, encoding="gbk").split(spliter)]
                sql = "INSERT INTO " + tableName + " VALUES ("
                for val in line_data:
                    try:
                        if val is None or len(str(val).replace(' ','')) == 0 or val in excel_nullchrepl:
                            sql = sql + " NULL, "
                        else:
                            sql = sql + "'" + str(int(val)).replace('\'','\'\'') + "', "
                    except Exception as e1:
                        sql = sql + "'" + str(val).replace('\'','\'\'') + "', "
                sql = sql[:-2]
                sql = sql + ")"
                session.executeUpdateSql(sql)
                line = f.readline()
        elif tablePref=='excel':
            # ????????????????????????
            if upload_type == 'true':  # upload_type true???????????????false????????????
                session.executeUpdateSql("delete from " + tableName)
            # ???excel
            wb = xlrd.open_workbook(file_contents=f.read())
            table = wb.sheets()[0]
            if table.nrows <= 1:  # ??????excel???????????????????????????
                for tb in wb.sheets():
                    if tb.nrows > 1:
                        table = tb
                        break;
            row = table.nrows
            presql = "INSERT INTO " + tableName + " VALUES "
            #???????????????keyorder????????????????????????
            keyOrderQuerySet = session.getArrResult('select max(keyorder) from ' + tableName)
            currKeyOrder = keyOrderQuerySet[0][0] if keyOrderQuerySet and keyOrderQuerySet[0][0] else 0
            sqlValues = []
            for i in range(1, row):
                sql = "( " + "'" + str(UUIDTools.uuid1_hex()) + "', "
                col = table.row_values(i)
                for val in col:
                    try:
                        if val is None or len(str(val).replace(' ', '')) == 0 or val in excel_nullchrepl:
                            sql = sql + " NULL, "
                        else:
                            if tools.isVaildDate(val):  # ?????????????????????
                                try:
                                    date = xldate_as_tuple(val, 0)
                                    v = (datetime(*date)).strftime('%Y-%m-%d %H:%M:%S')
                                    sql = sql + "'" + v + "', "
                                except Exception as e:
                                    transDate = tools.isVaildDate(val)
                                    if transDate:
                                        sql = sql + "'" + transDate + "', "
                                    else:
                                        sql = sql + "NULL, "
                                        print('==data formate exception==file:sourceview.py,method:convertFile,line:416',e.args)
                            else:
                                sql = sql + "'" + str(val).replace("'", "\'\'") + "', "
                    except Exception as e1:
                        raise e1
                        sql = sql + "'" + str(val) + "', "
                sql += str(int(currKeyOrder) + i) + ", "#??????excel???????????????
                sqlValues.append(sql[:-2] + ")")

                if i % 5000 == 0:
                    print('%s sql[-2:]=%s' % (i, ','.join(sqlValues[-2:])))

            presql = presql + ','.join(sqlValues)
            try:
                session.executeUpdateSql(presql)
            except Exception as err:
                print('==error==file:sourceview.py,method:coverFile,line:412')
                raise err
        else:
            print('===??????????????????????????????')

        session.closeConnect()#????????????
    except Exception as e:
        session.rollBack()
        msg = e.args
        print(msg)
        return Response({'return_code': 0, 'file_table_name': tableName})

    return Response({'return_code': 1, 'file_table_name': tableName})

#????????????dist???title???????????????rs?????????
#?????????????????????????????????????????????????????????????????????option1,option2...??????????????????????????????option?????????????????????????????????
#??????????????????????????????????????????????????????2?????????????????????????????????????????????
def currDistTitleIsInRsTitles(distObj,rs,by):
    if by=='title':
        cmp=re.compile(r'\d{1,2}$')
        distObjSplitCol=distObj['title']
        distObjSplitColEndStr=''.join(cmp.findall(distObjSplitCol))
        distObjSplitCol=distObjSplitCol[:len(distObjSplitCol)-len(distObjSplitColEndStr)]
        for obj in rs:
            compareRsTitle=obj['title']
            endStr=''.join(cmp.findall(compareRsTitle))
            if compareRsTitle==distObjSplitCol or compareRsTitle[:len(compareRsTitle)-len(endStr)]==distObjSplitCol:
                return True,distObjSplitColEndStr,distObjSplitCol
    return False,'xxxxx','xxxxx'

# ???????????????????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def sourceColumn(request):
    datajson = request.data['datajson']
    if type(datajson)==type('stringcharacter'):
        datajson=json.loads(datajson)

    sourceid = request.data['id']
    result = {'code':'0'}
    rs = []
    try:
        databaseid = request.data['pk']['id']
    except:
        databaseid = request.data['pk']
    if databaseid.startswith('excel'):
        databaseid = databaseid[5:]
    try:
        st = stRestoreById(databaseid)
        #?????????datajson???sourcecolumns???????????????sql???????????????sourcecolumns????????????????????????sql
        sourcecolumns = ''
        if len(str(sourceid)) :
            sourcecolumns = getSourceColumnsById(sourceid)
        # print('----datajson=',datajson)
        # print('----sourcecolumns=',sourcecolumns)
        sql = st.sqlBuild(datajson, sourcecolumns)
        # print('----sourceColumn----sqlbuild sql=',sql)
        # column = st.getColumnBySql(sql)#?????????????????????????????????
        session = utils.SqlUtils(DBTypeCode.CUSTOM_DB.value, databaseid)
        column = session.getColumnBySql(sql)
        session.closeConnect()

        # ????????????????????????
        if sourceid != '':#???????????????
            columnlist = sourcedetail.objects.filter(sourceid=sourceid).order_by('id')
            savedColumnList=[]  #?????????????????????
            savedColumnNames=[]
            neweastColumnList=[]    #?????????????????????????????????????????????
            for colObj in columnlist:#???????????????columnlist????????????column = st.getColumnBySql(sql)
                if colObj.column_formula:#???????????????????????????????????????
                    #??????????????????????????????????????????datajson?????????column???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
                    isAddCol = False
                    for col in column:
                        try :
                            if colObj.table == col.split('__')[0]:
                                isAddCol = True
                        except Exception as err :
                            pass
                    if isAddCol :
                        savedColumnList.append(colObj)
                        savedColumnNames.append(colObj.table+'__'+colObj.column)
                    continue
                for col in column :#??????sourcedetail????????????datajson?????????sql?????????????????????column
                    try:
                        if colObj.table == col.split('__')[0] and colObj.column == col.split('__')[1]:
                            savedColumnList.append(colObj)
                            savedColumnNames.append(col)
                    except Exception as err:
                        print('----error---sourceview.py sourceColumn compare column error----')
            for col in column:#????????????????????????
                if col not in savedColumnNames:
                    neweastColumnList.append(col)

            repeatTitleDict={}#???????????????title????????????

            for columnrow in savedColumnList:
                dist = {}
                if columnrow.iscustom == '1':#??????????????????????????????????????????????????????????????????????????????????????????????????????
                    dist['field'] = columnrow.column
                else:
                    dist['field'] = columnrow.table+"__"+columnrow.column
                dist['ifshow'] = columnrow.ifshow
                dist['type'] = columnrow.type
                dist['isedit'] = '0'
                dist['title'] = columnrow.title
                dist['formatcolumn'] = columnrow.formatcolumn
                dist['formula'] = columnrow.column_formula
                if columnrow.distconfig is None or columnrow.distconfig == '':
                    dist['distconfig'] = []
                else:
                    dist['distconfig'] = json.loads(columnrow.distconfig.replace("'", "\""))
                #????????????
                if columnrow.options is None or columnrow.options =='':
                    dist['datadict']={}
                else:
                    options=json.loads(columnrow.options.replace('\'','"'))
                    if 'datadict' in columnrow.options:
                        dist['datadict'] = options['datadict']
                    else:
                        dist['datadict'] = {}
                try:
                    checkrs,splitNum,repeatColNm=currDistTitleIsInRsTitles(dist,rs,'title')#??????title???????????????title????????????????????????????????????title1???title2...
                    if checkrs:
                        if splitNum:#???????????????????????????????????????option2???????????????????????????option????????????????????????????????????
                            repeatTitleDict[repeatColNm] = int(splitNum)
                        else:
                            if dist['title'] not in repeatTitleDict:
                                repeatTitleDict[dist['title']]=1
                            else:
                                repeatTitleDict[dist['title']] +=1
                        if not splitNum:
                            dist['title']=dist['title']+str(repeatTitleDict[dist['title']])
                except Exception as err1:
                    print('--currDistTitleIsInRsTitlesf--error=',err1.args)
                rs.append(dist)

            for value in neweastColumnList:#???????????????????????????rs???
                dist = {}
                if databaseid != 'excel':
                    try:
                        # ifcan = value.index('__')
                        valueArr = value.split('__')
                        if re.compile(r'userdefinedsql\d*').match(valueArr[0]):  # ????????????????????????sql
                            dist['field'] = value
                            dist['ifshow'] = '1'
                            dist['type'] = 'varchar'
                            dist['formula'] = None
                            dist['isedit'] = '0'
                            dist['title'] = valueArr[1]
                        else:
                            c = Columns.objects.get(
                                database_id__iexact=databaseid,
                                tables__iexact=valueArr[0],
                                columns__iexact=valueArr[1])
                            dist['field'] = value
                            dist['ifshow'] = c.ifshow
                            dist['type'] = c.type
                            dist['formula'] = c.column_formula
                            dist['isedit'] = '0'
                            if c.name is not None and c.name != '':
                                dist['title'] = c.name
                            else:
                                dist['title'] = value
                        dist['distconfig'] = []
                        dist['formatcolumn'] = value
                    except Exception as e:
                        a = e.args
                        pass
                else:
                    dist['field'] = value
                    dist['title'] = value
                    dist['type'] = 'varchar'
                    dist['ifshow'] = '1'
                    dist['isedit'] = '0'
                if 'field' in dist:
                    try:
                        checkrs, splitNum, repeatColNm = currDistTitleIsInRsTitles(dist, rs,'title')  # ??????title???????????????title????????????????????????????????????title1???title2...
                        if checkrs:
                            if dist['title'] not in repeatTitleDict:
                                repeatTitleDict[dist['title']] = 1
                            else:
                                repeatTitleDict[dist['title']] += 1
                            if not splitNum:
                                dist['title'] = dist['title'] + str(repeatTitleDict[dist['title']])
                    except Exception as err2:
                        print('--currDistTitleIsInRsTitles--err2=',err2.args)
                    rs.append(dist)
        # ????????????????????????
        else:
            repeatTitleDict = {}  # ???????????????title????????????
            # print('--column=',column)
            for value in column:
                dist = {}
                if databaseid != 'excel':
                    try:
                        # ifcan = value.index('__')
                        valueArr = value.split('__')
                        if re.compile(r'userdefinedsql\d*').match(valueArr[0]):#????????????????????????sql
                            dist['field'] = value
                            dist['ifshow'] = '1'
                            dist['type'] = 'varchar'
                            dist['formula'] = None
                            dist['isedit'] = '0'
                            dist['title'] = valueArr[1]
                        else:
                            c = Columns.objects.get(
                                database_id__iexact=databaseid,
                                tables__iexact=valueArr[0],
                                columns__iexact=valueArr[1])
                            dist['field'] = value
                            dist['ifshow'] = c.ifshow
                            dist['type'] = c.type
                            dist['formula'] = c.column_formula
                            dist['isedit'] = '0'
                            if c.name is not None and c.name != '':
                                dist['title'] = c.name
                            else:
                                dist['title'] = value
                        dist['distconfig'] = []
                        dist['formatcolumn'] = value
                    except Exception as e :
                        raise e
                        a = e.args
                        pass
                else:
                    dist['field'] = value
                    dist['title'] = value
                    dist['type'] = 'varchar'
                    dist['ifshow'] = '1'
                    dist['isedit'] = '0'
                if 'field' in dist:
                    try:
                        checkrs, splitNum, repeatColNm = currDistTitleIsInRsTitles(dist, rs,'title')  # ??????title???????????????title????????????????????????????????????title1???title2...
                        if checkrs:
                            if dist['title'] not in repeatTitleDict:
                                repeatTitleDict[dist['title']] = 1
                            else:
                                repeatTitleDict[dist['title']] += 1
                            if not splitNum:
                                dist['title'] = dist['title'] + str(repeatTitleDict[dist['title']])
                    except Exception as err3:
                        print('--currDistTitleIsInRsTitles--err3=',err3.args)
                    rs.append(dist)
            if not column:#?????????st.getColumnBySql(sql)??????????????????????????????????????????????????????column
                result['msg'] = '???????????????????????????????????????????????????????????????'
                return Response(result)
    except Exception as e:
        result['msg'] = e.args
        return Response(result)
    result['code'] = '1'
    result['lists'] = rs
    print('result-----------',result)
    return Response(result)

#??????sourcecolumns??????sourceid
def getSourceColumnsById(sourceId) :
    try:
        sourceColumns = sourcedetail.objects.filter(sourceid=sourceId)
        sourceColumnObjs = []
        for sourceColumn in sourceColumns :
            srcColDict = {}
            # srcColDict['distconfig'] = sourceColumn.distconfig
            srcColDict['field'] = sourceColumn.table + '__' + sourceColumn.column
            srcColDict['title'] = sourceColumn.title
            srcColDict['ifshow'] = sourceColumn.ifshow
            srcColDict['formula'] = sourceColumn.column_formula
            srcColDict['iscustom'] = sourceColumn.iscustom
            srcColDict['isedit'] = "0"
            srcColDict['formatcolumn'] = sourceColumn.formatcolumn
            srcColDict['type'] = sourceColumn.type
            options = sourceColumn.options
            if 'datadict' in options :
                if type(options) == type('stringchartext') :
                    options = json.loads(options.replace("'","\""))
                srcColDict['datadict'] = options['datadict']
            else:
                srcColDict['datadict'] = {}
            sourceColumnObjs.append(srcColDict)
        return sourceColumnObjs
    except Exception as error:
        print('--getSourceColumnsById error,errorMessage=',error)
    return None


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def sourceSqlColumn(request):
    #????????????
    databaseid = request.data['pk']
    sql = request.data['sql']
    # sourceid=''
    if 'sourceid' in request.data:
        sourceid=request.data['sourceid']
    #?????????????????????
    result = {}
    result['code'] = '0'
    try:
        # sourceid = ''
        # if sourceid and len(sourceid) > 0:#????????????????????????sourcedetail????????????
        #     sourcedetailobjs=sourcedetail.objects.filter(sourceid=sourceid)
        #     rs=[]
        #     for obj in sourcedetailobjs:
        #         dist = {}
        #         if obj.column != 'temprownumber' and obj.column != 'tempcolumn':
        #             if obj.iscustom == '1':#??????????????????????????????????????????????????????????????????????????????????????????????????????
        #                 dist['field'] = obj.column
        #             else:
        #                 dist['field'] = obj.table + '__' + obj.column
        #             dist['title'] = obj.title
        #             dist['type'] = 'varchar'
        #             dist['ifshow'] = '1'
        #             dist['isedit'] = '0'
        #             rs.append(dist)
        #     result['code'] = '1'
        #     result['lists'] = rs
        #     return Response(result)
        # else:
        #     database = Database.objects.get(id=databaseid)
        #     dbtype = database.database_type
        #     dbConnType = database.odbcstatus
        #     st = ''
        #     conn = ''
        #     if databaseid == 'excel':
        #         st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)
        #     elif dbtype and dbtype == 'odbc':
        #         conn = odbcsqltool.odbcStRestoreById(databaseid)
        #         column = odbcsqltool.getColumnBySql(conn, sql, dbConnType)
        #     else:
        #         st = stRestoreById(databaseid)
        #         column = st.getColumnBySql(sql)
            # print('st.getColumnBySql=',column)
        database = Database.objects.get(id=databaseid)
        dbtype = database.database_type
        dbConnType = database.odbcstatus
        st = ''
        conn = ''
        if databaseid == 'excel':
            st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)
        elif dbtype and dbtype == 'odbc':
            conn = odbcsqltool.odbcStRestoreById(databaseid)
            column = odbcsqltool.getColumnBySql(conn, sql, dbConnType)
        else:
            st = stRestoreById(databaseid)
            column = st.getColumnBySql(sql)
        rs = []
        for value in column:
            dist = {}
            if value != 'temprownumber' and value != 'tempcolumn':
                dist['field'] = value
                dist['title'] = value
                dist['type'] = 'varchar'
                dist['ifshow'] = '1'
                dist['isedit'] = '0'
                dist['formula'] = None
                dist['distconfig'] = []
                dist['formatcolumn'] = value
                rs.append(dist)
        result['lists'] = rs
        result['code'] = '1'
    except Exception as e:
        result['msg'] = e.args
    # print('result=',result)
    return Response(result)

# ?????????????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def sourceData(request):
    datajson = request.data['datajson']
    limit = request.data['limit']
    offset = request.data['offset']
    sourcecolumns = request.data['sourcecolumn']
    try:
        databaseid = request.data['pk']['id']
    except:
        databaseid = request.data['pk']
    if databaseid.startswith('excel'):
        databaseid = databaseid[5:]
    try:
        st = stRestoreById(databaseid)
        result = {}
        sql = st.sqlBuild(datajson, sourcecolumns)
        # pagination = st.serverPaginationNoOrder(limit, offset, sql)
        #         # # print(' sourceData exeSql=',pagination)
        #         # rows = st.getData(pagination)
        rows = st.getDataFromServerPaginationNoOrder(limit, offset, sql)
        querySession = utils.SqlUtils(DBTypeCode.CUSTOM_DB.value, databaseid)
        rows = querySession.getDataFromServerPaginationNoOrder(limit, offset, sql)
        querySession.closeConnect()

        #?????????????????????????????????
        rows = formateRemote(rows,sourcecolumns)
        result['rows'] = rows
        total = st.getTotal(sql)
        result['total'] = total['total']
    except Exception as e:
        print('file:sourceview;method:sourceData')
        print(e)
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def sourceSqlData(request):
    sql = request.data['sql']
    limit = request.data['limit']
    offset = request.data['offset']
    databaseid = request.data['pk']
    dbtype=''
    if databaseid == 'excel':
        st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)
    else:
        database = Database.objects.get(id=databaseid)
        dbtype=database.database_type
        if dbtype=='odbc':
            conn = odbcsqltool.odbcStRestoreById(databaseid)
        else:
            st = stRestoreById(databaseid)
    result = {}
    # if dbtype=='odbc':
    #     pagination = odbcsqltool.paginationNoOrder(sql, limit, offset, database.odbcstatus)
    # else:
    #     pagination = st.serverPaginationNoOrder(limit, offset, sql)

    try:
        # if dbtype=='odbc':
        #     # print('pagination----',pagination)
        #     result['rows'] = odbcsqltool.getDictData(conn,pagination)
        #     total = odbcsqltool.getTotalCount(conn,sql)
        #     result['total'] = total
        # else:
        #     result['rows'] = st.getData(pagination)
        #     total = st.getTotal(sql)
        #     result['total'] = total['total']
        result['rows'] = st.getDataFromServerPaginationNoOrder(limit, offset, sql)
        # print("result=",result)
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getColumnByTable(request, table):
    id = request.GET['pk']
    if id == 'excel':
        st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)
    else:
        st = stRestoreById(id)
    result = st.getColumnByTable(table)
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def buildSql(request):
    datajson = request.data['datajson']
    databaseid = request.data['pk']
    if databaseid == 'excel':
        st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)
    else:
        st = stRestoreById(databaseid)
    result = {}
    result['sql'] = st.sqlBuild(datajson)
    return Response(result)


# ???????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def saveConfig(request):
    datajson = request.data['datajson']
    print('---datajson=',datajson)
    try:
        databaseid = request.data['pk']['id']
    except:
        databaseid = request.data['pk']
    if databaseid.startswith('excel'):
        databaseid = databaseid[5:]
    advance = request.data['advance']
    columns = request.data['column']
    print("----columns=",columns)
    try:
        receive_user = request.data['username']
    except:
        receive_user = 'admin'


    title = request.data['info']['title']
    desc = request.data['info']['desc']
    pk = request.data['info']['id']
    datatype = request.data['info']['datatype']#?????????????????????????????????
    conntype = request.data['info']['conntype']#???????????????????????????????????????

    database = Database.objects.get(id=databaseid)
    dbtype = database.database_type
    #????????????,?????????odbc????????????stRestoreById?????????
    if dbtype=='odbc':
        conn=odbcsqltool.odbcStRestoreById(databaseid)
        conntype='0'#?????????odbc????????????????????????????????????0
    else:
        st = stRestoreById(databaseid)

    updateSts=''    # ???????????????????????????
    if advance:
        custom = "1"
        sql = request.data['sql']
    else:
        custom = "0"
        sql = st.sqlBuild(datajson,columns)
        print('---sql=',sql)
        # ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
        try:
            tempSourceObj = source.objects.get(id=pk)
        except ObjectDoesNotExist as e:
            tempSourceObj = None
        if (not tempSourceObj or not tempSourceObj.conntype) and conntype == '0':#????????????src
            updateSts = 'new'
        elif (not tempSourceObj or not tempSourceObj.conntype) and conntype == '1':#??????????????????src
            updateSts = ''
        elif tempSourceObj.conntype=='0' and conntype == '0':#?????????src???????????????src
            updateSts = 'new'
        elif tempSourceObj.conntype=='1' and conntype == '0':#??????????????????????????????src
            updateSts='t2s'     #t2s????????????to??????
        elif tempSourceObj.conntype=='0' and conntype == '1':   #s2t????????????to????????????,??????????????????????????????????????????
            updateSts = 's2t'
        elif tempSourceObj.conntype == '1' and conntype == '1':  # ??????????????????
            updateSts = 't2t'


    # print('*****colums****')
    # print(columns)
    # myStrSql='select '
    # for tpvalue in columns:
    #     if tpvalue['field'] !=tpvalue['title']:
    #         myStrSql+=tpvalue['field']+' as \''+tpvalue['title']+'\''
    #     else:
    #         myStrSql+=tpvalue['field']
    #
    result = {}
    result['code'] = 0
    try:
        if pk == '':
            rs = source.objects.get_or_create(
                databaseid=databaseid,
                title=title,
                config=json.dumps(datajson),
                desc=desc,
                custom=custom,
                enabled='y',
                sql=sql,
                datatype=datatype,
                conntype=conntype,
                receive_user=receive_user)
            id = rs[0].pk
        else:
            rs = source.objects.get(id=pk)
            rs.databaseid = databaseid
            rs.title = title
            rs.config = json.dumps(datajson)
            rs.desc = desc
            rs.custom = custom
            rs.enabled = 'y'
            rs.sql = sql
            rs.datatype = datatype
            rs.conntype = conntype
            rs.receive_user = receive_user
            rs.save()
            id = pk
            sourcedetail.objects.filter(sourceid=id).delete()
        sourcedetails = []
        for value in columns:
            if advance:
                column = value['field']
                table = value['title']
            else:
                valueArr = value['field'].split('__')
                column = valueArr[1]
                table = valueArr[0]
            type = value['type']    #??????????????????????????????
            if not type or type.lower().find('character')>=0:
                type = 'varchar'
            elif type.lower().find('numeric')>=0:
                type = 'decimal'
            elif type.lower().find('double') >= 0:
                type = 'double'
            elif type.lower().find('timestamp without time zone') >= 0:
                type = 'timestamp'
            elif type.lower().find('timestamp with time zone') >= 0:
                type = 'timestampz'



            # ?????????????????????????????????????????????
            if 'formula' in value and (value['formula'] == 'get_year' or value['formula'] == 'get_month' or value['formula'] == 'get_day'):
                type = 'int'
            # ???columns??????????????????sql?????????????????????
            dictData = []
            datadict = {}
            if 'datadict' in value:
                datadict = value['datadict']
                dicttable = datadict['table'] if 'table' in datadict else ''
                keycol = datadict['keycol'] if 'keycol' in datadict else ''
                valuecol = datadict['valuecol'] if 'valuecol' in datadict else ''

                where = ' where 1=1 and '  # ???filter??????????????????????????????
                try:
                    if 'filter' in datadict:
                        filter = datadict['filter']
                        for ft in filter:
                            field = ft['col']
                            opera = ft['opera']
                            val = ft['val']
                            link = ft['link']
                            if opera in ['=','>','<','>=','<=','!=','in','like'] and field and val and link:
                                if opera == 'like':
                                    where = where + ' ' + field + ' ' + opera + ' \'%' + val + '%\' ' + link + ' '
                                else:
                                    where = where + ' ' + field + ' ' + opera + ' \'' + val + '\' ' + link + ' '
                    if keycol and valuecol and dicttable:
                        dataDictSql = 'select ' + keycol + ' as "key", ' + valuecol + ' as "value" from ' + dicttable + ' ' + where[:-4]
                        print('dataDictSql=', dataDictSql)
                        dictData = st.getData(dataDictSql)
                        #dictData???distconfig????????????
                        distinguishDD=[]
                        for ix,dt in enumerate(dictData):
                            for dst in value['distconfig']:
                                if dt['key'] == dst['key']:#??????dictData?????????distconfig?????????
                                    distinguishDD.append(ix)
                        for index,ix in enumerate(distinguishDD):
                            if dictData:
                                dictData.pop(ix - index)
                            else:
                                print('--erro--dictData empty--pop ix=',ix)
                        #??????????????????????????????????????????????????????distconfig??????????????????????????????????????????
                    else:
                        print('-------empty--datadict-------file:sourceview.py;method:saveconfig-----this can happen')
                except Exception as e:
                    print('file:sourceview.py;method:saveconfig')
                    print(e)
                    raise e
            # ??????????????????
            sourcedetails.append(
                sourcedetail(
                    sourceid=id,
                    table=table,
                    column=column,
                    iscustom=custom,
                    title=value['title'],
                    ifshow=value['ifshow'],
                    column_formula=value['formula'] if 'formula' in value else None,
                    formatcolumn=value['formatcolumn'] if 'formatcolumn' in value else None,
                    distconfig=value['distconfig'] + dictData if 'distconfig' in value else dictData,
                    type=type,
                    options={'datadict': datadict}))
        sourcedetail.objects.bulk_create(sourcedetails)
        #?????????odbc??????????????????olap???olapcolumn???
        dictObj={}
        dictObj['sourceid']=id
        dictObj['name']=title
        dictObj['datatype']=datatype#????????????????????????
        dictObj['desc']=desc
        dictObj['receive_user'] = receive_user  # ?????????
        if dbtype=='odbc':  #?????????odbc????????????????????????????????????????????????????????????
            odbcSrcSaveToOlap(dictObj)
        else:
            dictObj['updateSts'] = updateSts
            dictObj['conntype'] = conntype
            saveBySourceStatus(dictObj)  # ???updateSts????????????

        result['code'] = 1
        result['id'] = id
        result['msg'] = '????????????'
    except Exception as e:
        raise e
        print(e)
        result['msg'] = e.args
    return Response(result)

#???????????????odbc????????????????????????olap??????
def odbcSrcSaveToOlap(dictObj):
    #??????sourcedetail??????columns
    olapcols=[]
    sourceDetailRow=sourcedetail.objects.filter(sourceid=dictObj['sourceid'])
    for detailo in sourceDetailRow:
        colDict={}
        colDict['title']=detailo.title
        colDict['order'] = 'asc'
        colDict['olaptitle'] = ''
        colDict['fullname'] = detailo.column
        colDict['function'] = 'group'
        colDict['table'] = ''  # ??????table??????????????????????????????
        colDict['isedit'] = '0'
        colDict['col'] = detailo.column
        if detailo.column_formula:
            colDict['colformula'] = detailo.column_formula
            colDict['srctablecol'] = detailo.column  # ????????????col????????????????????????????????????????????????
            if '__' in detailo.formatcolumn:
                try:
                    colDict['srctablecol'] = detailo.formatcolumn.split('__')[1]
                except Exception as error:
                    print('--error---detailo.formatcolumn.split error!',error.args)
                    colDict['srctablecol'] = detailo.column
        olapcols.append(colDict)
    #?????????olap???
    olapObj=olap.objects.filter(sourceid=dictObj['sourceid'],name=dictObj['name'])
    olapid=''
    if olapObj and olapObj[0]:
        olapO=olapObj[0]
        olapid=olapO.id
        olapO.desc=dictObj['desc']
        olapO.charttype=dictObj['datatype']
        olapO.columns=olapcols
        olapO.save()
    else:
        rs=olap.objects.get_or_create(sourceid=dictObj['sourceid'],name=dictObj['name'],charttype=dictObj['datatype']
                               ,desc=dictObj['desc'],columns=olapcols,filters=[],table=None,status='1'
                               ,expand={},ifexpand='false',olaptype='olap',enabled='y',tag_config=[]
                               ,directconn='t')
        olapid=rs[0].pk

    olapcolumn.objects.filter(olapid=olapid).delete()#???????????????olap?????????column???????????????,olapclumn????????????id?????????,????????????oalpid?????????
    olapextcols.objects.filter(olapid=olapid).delete()  # ???????????????olapextcols
    #?????????olapcolumn???
    olapColumnTb = []
    for detailo in sourceDetailRow:#??????olapcolumn
        olapColumnTb.append(olapcolumn(olapid=olapid,column=detailo.column,title=detailo.title,options=generateOlapColOptionObj(detailo)))
    olapcolumn.objects.bulk_create(olapColumnTb)

def generateOlapColOptionObj(detailo):
    optionsObj = None
    if detailo.column_formula:  # ???source????????????????????????????????????olapcolumn???
        optionsObj = {}
        optionsObj['newadded'] = 't'
        optionsObj['colformula'] = detailo.column_formula
        try:
            optionsObj['srctablecol'] = detailo.formatcolumn.split('__')[1]
        except Exception as err:
            print('--error---detailo.formatcolumn.split error!', err.args)
            optionsObj['srctablecol'] = detailo.column  # ?????????????????????????????????????????????
    return optionsObj

#????????????sourcedetailObj???option?????????????????????????????????????????????????????????
def isDictColumn(optionObj):
    try:
        if optionObj:
            if type(optionObj) == type('stringstringstring'):
                optionObj = json.loads(optionObj.replace("'","\""))
            if 'datadict' in optionObj and optionObj['datadict'] and optionObj['datadict']['table']:
                return True
    except Exception as error:
        print('--sourceview.py judge current sourcedetial options column error;error=',error)
    return False

def saveBySourceStatus(dictObj):#????????????get_or_create???????????????????????????????????????????????????????????????
    olapid = ''
    olapcols = []
    sourceDetailRow = sourcedetail.objects.filter(sourceid=dictObj['sourceid'])
    for detailo in sourceDetailRow:
        colDict = {}
        colDict['title'] = detailo.title
        colDict['order'] = 'asc'
        colDict['olaptitle'] = ''
        colDict['fullname'] = detailo.column
        colDict['function'] = 'group'
        colDict['table'] = detailo.table  # ??????table??????????????????????????????
        colDict['isedit'] = '0'
        colDict['col'] = detailo.column
        if detailo.column_formula:
            colDict['colformula'] = detailo.column_formula
            colDict['srctablecol'] = detailo.column #????????????col????????????????????????????????????????????????
            if '__' in detailo.formatcolumn:
                try:
                    colDict['srctablecol']=detailo.formatcolumn.split('__')[1]
                except Exception as error:
                    print('--error---detailo.formatcolumn.split error!',error.args)
                    colDict['srctablecol'] = detailo.column

        olapcols.append(colDict)

    print('olapcols=',olapcols)

    if 'updateSts' in dictObj.keys() and dictObj['updateSts'] == 'new':#????????????src??????????????????src???????????????src
        # ?????????olap???
        olapObj = olap.objects.filter(sourceid=dictObj['sourceid']).order_by('-create_date')#???????????????
        if olapObj and olapObj[0]:  # ??????????????????????????????olap????????????????????????????????????
            olapO = olapObj[0]
            olapid = olapO.id
            olapO.desc = dictObj['desc']
            olapO.charttype = dictObj['datatype']
            olapO.columns = olapcols    #????????????????????????source??????????????????????????????olap???column?????????
            olapO.directconn = 'mt'
            olapO.save()
        else:
            rs = olap.objects.get_or_create(sourceid=dictObj['sourceid'], name=dictObj['name'],
                                            charttype=dictObj['datatype'], desc=dictObj['desc'],
                                            columns=olapcols, filters=[], table=None,status='1'
                                            ,expand={}, ifexpand='false', olaptype='olap', enabled='y',
                                            tag_config=[],directconn='mt')#olap???directconn??????????????????????????????
            olapid = rs[0].pk

        #????????????olapid???????????????
        olapcolumn.objects.filter(olapid=olapid).delete()  # ???????????????olap?????????column???????????????,olapclumn????????????id?????????,????????????oalpid?????????
        olapextcols.objects.filter(olapid=olapid).delete()  # ???????????????olapextcols
        olapColumnTb = []
        for detailo in sourceDetailRow:  # ??????olapcolumn
            saveToOlapColumnColName = detailo.formatcolumn
            if detailo.column_formula and detailo.column_formula.strip():
                if detailo.column == detailo.table:
                    saveToOlapColumnColName = detailo.column
                else:
                    saveToOlapColumnColName = detailo.table + '__' + detailo.column
            elif isDictColumn(detailo.options):#???????????????????????????
                saveToOlapColumnColName = detailo.table + '__' + detailo.column

            olapColumnTb.append(olapcolumn(olapid=olapid, column=saveToOlapColumnColName, title=detailo.title,options=generateOlapColOptionObj(detailo)))
        olapcolumn.objects.bulk_create(olapColumnTb)

    if 'updateSts' in dictObj.keys() and dictObj['updateSts'] == 's2t':  #?????????????????????????????????,????????????olap???????????????olap???
        tableName='sjtqolap_'+str(time.time()).split('.')[0]   #olap??????
        rs = olap.objects.get_or_create(sourceid=dictObj['sourceid'], name=dictObj['name'],
                                        charttype=dictObj['datatype'], desc=dictObj['desc'],
                                        columns=olapcols, filters=[], table=tableName,status='1'
                                        , expand={}, ifexpand='false', olaptype='olap', enabled='y',
                                        tag_config=[], directconn='')
        olapid = rs[0].pk

        # olapcolumn.objects.filter(olapid=olapid).delete()  # ???????????????olap?????????column???????????????,olapclumn????????????id?????????,????????????oalpid?????????
        # olapextcols.objects.filter(olapid=olapid).delete()  # ???????????????olapextcols
        # ?????????olapcolumn???
        olapColumnTb = []
        for detailo in sourceDetailRow:  # ??????olapcolumn
            saveToOlapColumnColName = detailo.formatcolumn
            if detailo.column_formula and detailo.column_formula.strip():
                if detailo.column == detailo.table:
                    saveToOlapColumnColName = detailo.column
                else:
                    saveToOlapColumnColName = detailo.table + '__' + detailo.column
            elif isDictColumn(detailo.options):#???????????????????????????
                saveToOlapColumnColName = detailo.table + '__' + detailo.column
            olapColumnTb.append(olapcolumn(olapid=olapid, column=saveToOlapColumnColName, title=detailo.title,options=generateOlapColOptionObj(detailo)))
        olapcolumn.objects.bulk_create(olapColumnTb)
        #??????sql????????????olap???
        oc = OlapClass().initClass(olapcols, [], dictObj['sourceid'], tableName)
        oc.saveOlap()
        print('auto create olap table='+tableName+' success!')

    if 'updateSts' in dictObj.keys() and dictObj['updateSts'] == 't2s':#????????????????????????,?????????olap??????
        #??????olap??????????????????olap???
        rs = olap.objects.get_or_create(sourceid=dictObj['sourceid'], name=dictObj['name'],
                                        charttype=dictObj['datatype'], desc=dictObj['desc'],
                                        columns=olapcols, filters=[], table=None, status='1'
                                        , expand={}, ifexpand='false', olaptype='olap', enabled='y',
                                        tag_config=[], directconn='mt')#olap???directconn??????????????????????????????
        olapid = rs[0].pk
        # ?????????olapcolumn???
        olapColumnTb = []
        for detailo in sourceDetailRow:  # ??????olapcolumn
            saveToOlapColumnColName = detailo.formatcolumn
            if detailo.column_formula and detailo.column_formula.strip():
                if detailo.column == detailo.table:
                    saveToOlapColumnColName = detailo.column
                else:
                    saveToOlapColumnColName = detailo.table + '__' + detailo.column
            elif isDictColumn(detailo.options):#???????????????????????????
                saveToOlapColumnColName = detailo.table + '__' + detailo.column
            olapColumnTb.append(olapcolumn(olapid=olapid, column=saveToOlapColumnColName, title=detailo.title,options=generateOlapColOptionObj(detailo)))
        olapcolumn.objects.bulk_create(olapColumnTb)

    #???????????????????????????????????????olap??????????????????t2t???????????????????????????????????????????????????title
    if 'updateSts' in dictObj.keys() and dictObj['updateSts'] == 't2t':#???????????????????????????olap??????
        #??????olap??????????????????olap???
        olapObj = olap.objects.filter(sourceid=dictObj['sourceid']).order_by('-create_date')  # ???????????????
        if olapObj and olapObj[0]:  # ??????????????????????????????olap????????????????????????????????????
            olapO = olapObj[0]
            olapid = olapO.id
            olapO.name = dictObj['name']
            olapO.desc = dictObj['desc']
            olapO.charttype = dictObj['datatype']
            olapO.columns = updateCurrOlapCol(olapO.columns,olapcols)
            olapO.directconn = ''
            olapO.save()
        # ?????????olapcolumn???
        olapColumnTb = []
        if olapid :
            for detailo in sourceDetailRow :  # ??????olapcolumn
                saveToOlapColumnColName = detailo.formatcolumn
                if detailo.column_formula and detailo.column_formula.strip():
                    if detailo.column == detailo.table:
                        saveToOlapColumnColName = detailo.column
                    else:
                        saveToOlapColumnColName = detailo.table + '__' + detailo.column
                elif isDictColumn(detailo.options):  # ???????????????????????????
                    saveToOlapColumnColName = detailo.table + '__' + detailo.column
                olapColumnTb.append(olapcolumn(olapid=olapid, column=saveToOlapColumnColName, title=detailo.title,options=generateOlapColOptionObj(detailo)))
            olapcolumn.objects.bulk_create(olapColumnTb)


def updateCurrOlapCol(currOlapCol,olapcols):#??????olap???????????????olapcolumn?????????
    currNewOlapCol=[]
    try:
        if currOlapCol:
            for currCol in currOlapCol:
                for olapCol in olapcols:
                    if currCol['fullname']==olapCol['fullname'] and currCol['table']==olapCol['table'] and currCol['col']==olapCol['col']:
                        currNewOlapCol.append(olapCol)
        else:
            currNewOlapCol = olapcols
    except Exception as error:
        print('--error--sourceview.py updateCurrOlapCol error:',error.args)
        currNewOlapCol=currOlapCol
    return currNewOlapCol



# ?????????????????????
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getSourceList(request):
    olapsource = request.GET['olapsource'] if 'olapsource' in request.GET else ''    #????????????????????????????????????source
    where = " where cns.desc <> 'conversionrowtocol' and cns.enabled = 'y' "
    if olapsource :
        where += "  and cns.conntype = '1' "
    if 'search' in request.GET:
        searchkey=request.GET['search']
        # print(searchkey)
        where = where + """ AND cns.title like '%""" + searchkey + """%' """
    if 'page' in request.GET:
        offset = (int(request.GET['page'])-1) * LIMIT
        select_source_sql = """select cns.id, 
cns.title,cns.custom,cns.desc,cns.datatype,dhtp.type_name,cns.conntype,cd.database,receive_user,cns.create_date from 
connect_source cns left join dashboard_charttype dhtp on cns.datatype=dhtp.id left join connect_database cd on 
cd.id=cns.databaseid """+ where +"""   order by cns.create_date desc LIMIT """ \
                            + str(LIMIT) + ' offset ' + str(offset)
        # fetchall = utils.getResultBySql(select_source_sql)
        fetchall = utils.SqlUtils().getArrResultWrapper(select_source_sql, logger,'sourceview.py', 'getSourceList')
    else:
        select_source_sql = """select cns.id, 
cns.title,cns.custom,cns.desc,cns.datatype,dhtp.type_name,cns.conntype,cd.database,receive_user,cns.create_date from 
connect_source cns left join dashboard_charttype dhtp on cns.datatype=dhtp.id left join connect_database cd on 
cd.id=cns.databaseid """+ where +"""  order by cns.create_date desc"""
        # fetchall = utils.getResultBySql(select_source_sql)
        fetchall = utils.SqlUtils().getArrResultWrapper(select_source_sql, logger,'sourceview.py', 'getSourceList')

    # allcnt = utils.getResultBySql('select count(*) from connect_source cns ' + where)[0][0]
    allcntQuerySet = utils.SqlUtils().getArrResultWrapper('select count(*) from connect_source cns ' + where,
                                                          logger,'sourceview.py', 'getSourceList')
    allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups = []
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics['title'] = obj[1]
        dics['custom'] = obj[2]
        dics['desc'] = obj[3]
        dics['datatype'] = obj[4]
        dics['datatypename'] = obj[5]
        dics['conntype'] = obj[6]
        dics['srcdatabase'] = obj[7]
        dics['createuser'] = obj[8]
        dics['createtime'] = obj[9]
        groups.append(dics)
    return Response({'total': allcnt, 'rows': groups})

# ??????????????????
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getChartTypes(request):
    where = " where status=1 "
    # fetchall = utils.getResultBySql(
    #     """select ct.id, ct.type_name AS name from dashboard_charttype ct where ct.status='1'  order by ct.create_time desc"""
    # )
    fetchall = utils.SqlUtils().getArrResultWrapper("""select ct.id, ct.type_name AS name from dashboard_charttype ct where ct.status='1'  order by ct.create_time desc""",
                                                          logger,'sourceview.py', 'getChartTypes')
    charttypes = []
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics['name'] = obj[1]
        charttypes.append(dics)
    return Response({'charttypes': charttypes})

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def sourceDelete(request):
    result = {}
    try:
        if 'source_id' in request.data:
            source_id = request.data['source_id']
            # row = source.objects.get(id=int(source_id))
            row = source.objects.get(id=source_id)
            row.enabled = 'n'
            row.save()
            #??????????????????olap???olapcolumn?????????,??????????????????olap?????????olap???enable???n?????????????????????
            try:
                olapObjs = olap.objects.filter(sourceid=source_id)
                for olapObj in olapObjs :
                    olapObj.enabled = 'n'
                    olapObj.save()
            except Exception as delOlapErrors:
                print('---error---not so important--sourceview.py;method:sourceDelete;line:1384;erros:',delOlapErrors.args)

    except Exception as e:
        print('file:sourceview;method:sourceDelete')
        print(e)
    result['code'] = 1
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def changeView(request):
    result = {}
    result['code'] = 0
    id = request.data['pk']
    changelog = request.data['data']
    try:
        with transaction.atomic():
            for change in changelog:
                Tables.objects.filter(
                    database_id=id, tables=change['table']).update(
                    name=change['tablename'], ifshow=change['ifshow'])
            result['code'] = 1
    except Exception as e:
        result['msg'] = e.args
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def changeThView(request):
    result = {}
    result['code'] = 0
    id = request.data['pk']
    changelog = request.data['data']
    try:
        with transaction.atomic():
            for change in changelog:
                ifshow = change['ifshow']
                field = change['field']
                fieldArr = field.split('__')
                table = fieldArr[0]
                column = fieldArr[1]
                row = Columns.objects.filter(
                    database_id=id, tables__iexact=table, columns__iexact=column)
                if row.__len__() > 0:
                    name = row[0].name
                    if name is None or name == '':
                        row.update(name=change['title'],ifshow = ifshow)
            result['code'] = 1
    except Exception as e:
        result['msg'] = e.args
    return Response(result)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def deleteTable(request):
    tableName=request.GET['tableName']
    result = {'code':0}
    try:
        deleteAvailable=['excel','txt','csv','json','xml']  #?????????????????????????????????
        if tableName:
            dbExtendSession = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            dbSystemSession = utils.SqlUtils()
            for delAva in deleteAvailable:
                if tableName.startswith(delAva):
                    print('drop table name=', tableName)
                    delSql='drop table '+tableName
                    msgStr='???????????????'
                    try:
                        dbExtendSession.executeUpdateSql(delSql)
                    except Exception as e1:
                        msgStr=msgStr+'???????????????'

                    #??????connect_tables???connect_columns????????????????????????
                    #??????tableName:excel_sheet3_1524564513
                    #??????????????????????????????connect_tables???connect_columns??????????????????????????????????????????
                    delDataFromConntablsSql='delete from connect_tables where tables=\''+tableName+'\''
                    delDataFromConncolSql='delete from connect_columns where tables=\''+tableName+'\''
                    try:
                        dbSystemSession.executeUpdateSql(delDataFromConntablsSql)
                        print('delete data from connect_tables success')
                    except Exception as e1:
                        msgStr = msgStr + '????????????????????????'
                    try:
                        dbSystemSession.executeUpdateSql(delDataFromConncolSql)
                        print('delete data from connect_columns success')
                    except Exception as e1:
                        msgStr = msgStr + '???????????????????????????'
                    result['msg'] = msgStr
                    result['code']=1
                    break;
            else:
                result['msg'] = '??????????????????????????????????????????'
            dbExtendSession.closeConnect()
            dbSystemSession.closeConnect()

        else:
            result['msg'] = '?????????????????????'
    except Exception as e:
        print(e.args)
        result['msg']=e.args
    return Response(result)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getSourceDetail(request, id):
    row = source.objects.get(id=id)
    result = {}
    result['id'] = row.id
    result['title'] = row.title
    result['desc'] = row.desc
    result['databaseid'] = row.databaseid
    if type(row.config) == type('stringstring'):
        # configStr = row.config.replace('"','@@')#????????????json??????????????????????????????,?????????js?????????
        result['config'] = json.loads(row.config)
    else:
        result['config'] = row.config
    result['custom'] = row.custom
    result['sql'] = row.sql
    result['datatype'] = row.datatype
    result['conntype'] = row.conntype
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getSourceConfig(request, pk):
    result=tools.successMes()
    try:
        databaserow = Database.objects.get(id=pk)
        dist = {}
        dist['id'] = pk
        if databaserow.odbcstatus:
            dist['ip'] = databaserow.ip
            dist['port'] = ''
            dist['dsnstatus'] = 'f'
            dist['odbcdriver'] = databaserow.odbcdriver
        else:
            longip = databaserow.ip
            longipary = longip.split(':')
            dist['ip'] = longipary[0]
            dist['port'] = longipary[1]
        dist['user_name'] = databaserow.user_name
        dist['password'] = databaserow.password
        dist['database'] = databaserow.database
        dist['type'] = databaserow.database_type

        data = {}
        data['ip'] = databaserow.ip
        data['user'] = databaserow.user_name
        data['pwd'] = databaserow.password
        data['kind'] = databaserow.database_type
        if data['kind'] == 'oracle':
            rs = []
        elif data['kind'] == 'odbc':
            rs = []
        else:
            systeminfo = Utils().getSystemInfo(databaserow.database_type)
            data['db'] = systeminfo['database']
            st = stRestore(data)
            rs = st.getDatabase(systeminfo)
        result['config'] = dist
        result['lists'] = rs
    except Exception as e:
        print('file:sourceview;method:getSourceConfig')
        print(e)
        result['config'] = {}
        result['lists'] = []
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def columndist(request):
    sourceid = ''
    databaseid = ''
    if 'sourceid' in request.data:
        sourceid = request.data['sourceid']
    if 'databaseid' in request.data:
        databaseid = request.data['databaseid']
    columnconfig = request.data['column']
    field = columnconfig['field']
    if field.find('__')>=0:
        fieldary = field.split('__')
        table = fieldary[0]
        column = fieldary[1]
    else:
        table = ''
        column = field

    distlist = []
    if sourceid == '':
        sourceid = '0'
    try:
        distrow = globaldist.objects.get(databaseid=str(databaseid), tablename=table,
                                         columnname=column, sourceid=int(sourceid))
        distlist = json.loads(distrow.dist.replace("'", "\""))
    except:
        try:
            distrow = globaldist.objects.get(databaseid=str(databaseid), tablename=table,
                                             columnname=column, disttype='global')
            distlist = json.loads(distrow.dist.replace("'", "\""))
        except:
            pass
        pass
    return Response(distlist)


# ?????????????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def savedist(request):
    result = {}
    sourceid = ''
    databaseid = ''
    if 'sourceid' in request.data:
        sourceid = request.data['sourceid']
    if 'databaseid' in request.data:
        databaseid = request.data['databaseid']
    else:
        result['code'] = '0'
        result['msg'] = '??????????????????'
        return Response(result)
    columnconfig = request.data['column']
    field = columnconfig['field']
    if field.find('__') >= 0:
        fieldary = field.split('__')
        table = fieldary[0]
        column = fieldary[1]
    else:
        table = ''
        column = field
    distlist = request.data['distlist']
    try:
        #?????????
        if 'add' in request.data:
            operation_type = request.data['operation_type']
        else:
            if sourceid == '':
                sourceid = '0'
            globaldist.objects.filter(databaseid=str(databaseid), sourceid=str(sourceid), tablename=table, columnname=column, disttype='global').delete()
            row = globaldist.objects.get_or_create(databaseid=str(databaseid), sourceid=str(sourceid), tablename=table, columnname=column, disttype='global', dist=distlist)
            result['code'] = '1'
            result['id'] = row[0].pk
            row_id = row[0].pk
        # ???????????????????????????
        up_row = globaldist.objects.get(id=str(row_id))
        if 'formula' in columnconfig:
            up_row.column_formula = columnconfig['formula']
            up_row.save()
        if 'formatcolumn' in columnconfig:
            up_row.formatcolumn = columnconfig['formatcolumn']
            up_row.save()
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
    return Response(result)


# ????????????????????????????????????????????????
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny, ))
def getUpFileList(request):
    results = tools.successMes()
    try:
        sql = '''
        SELECT {0} FROM connect_tables
        WHERE "database_id" IN (
        		SELECT "id" FROM connect_database
        		WHERE "ip" = '{1}:{2}'
        		AND "database" = '{3}'
        		AND "database_type" = 'pgsql' ) 
        AND "ifshow" = '1' 
        '''
        # dbInfo = db['default']
        # dbInfo = db['dataxExtensionDB']  # ????????????????????????????????????datax_extension
        host = dataxExtDB['ip'].split(':')[0]
        port = dataxExtDB['ip'].split(':')[1]
        dbname = dataxExtDB['db']
        listSql = (sql + " order by createtime desc").format('*', host, port, dbname)
        countSql = sql.format('count(*)', host, port, dbname)
        # ??????????????????
        where = " "
        if 'search' in request.GET:
            searchkey = request.GET['search']
            where = where + """ AND "name" like '%""" + searchkey + """%' """
            listSql = listSql + where

        # ??????????????????
        if 'page' in request.GET:
            offset = (int(request.GET['page']) - 1) * LIMIT
            listSql = listSql + ' LIMIT ' + str(LIMIT) + ' offset ' + str(offset)


        rows = []
        total = 0
        session = utils.SqlUtils()
        try:
            rows = session.getDictResult(listSql)
            totalQuerySet = session.getArrResult(countSql)
            total = totalQuerySet[0][0] if totalQuerySet else 0
        except Exception as err:
            logger.info('---error---file:sourceview.py;method:getUpFileList;error=%s' % err)
            raise err
        finally:
            session.closeConnect()

        results['rows'] = rows
        results['total'] = total
        pass
    except Exception as e:
        print('file:sourceview;method:getUpFileList')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)


# ???????????????????????????????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def delUpFile(request):
    results = tools.successMes()
    try:
        source_id = request.data['source_id']
        row = Tables.objects.get(id=source_id)
        row.ifshow = '0'
        row.save()
    except Exception as e:
        print('file:sourceview;method:delUpFile')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)


# ?????????????????????&&????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def getUpFileDatas(request):

    results = tools.successMes()
    try:
        source_id = request.data['sourceId']
        tableObj = Tables.objects.get(id=source_id)
        # ??????sourceid???????????????
        results['tableObj'] = model_to_dict(tableObj)
        # ???????????????
        rows = Columns.objects.filter(database_id=tableObj.database_id, tables=tableObj.tables)
        dicts = utils.model_list_to_dict_wrapper(rows)
        results['tableCols'] = dicts
        #???????????????
        sql = 'SELECT {0} FROM ' + str(tableObj.tables) + ' WHERE 1 = 1 '
        listSql = sql.format('*')
        countSql = sql.format('count(*)')
        # ??????????????????
        where = " "
        if 'search' in request.data:
            searchkey = request.data['search']
            where = where + """ AND "name" like '%""" + searchkey + """%' """
            listSql = listSql + where
            countSql = countSql + where
        listSql = listSql + ' ORDER BY column1 DESC'
        # ??????????????????
        if 'page' in request.data:
            if 'limit' in request.data:
                limit = request.data['limit']
            else:
                limit = LIMIT
            offset = (int(request.data['page']) - 1) * limit
            listSql = listSql + ' LIMIT ' + str(limit) + ' offset ' + str(offset)

        rows = []
        total = 0
        session = utils.SqlUtils()
        try:
            rows = session.getDictResult(listSql)
            totalQuerySet = session.getArrResult(countSql)
            total = totalQuerySet[0][0] if totalQuerySet else 0
        except Exception as err:
            logger.info('---error---file:sourceview.py;method:getUpFileDatas;error=%s' % err)
            raise err
        finally:
            session.closeConnect()

        results['rows'] = rows
        results['total'] = total
    except Exception as e:
        print('file:sourceview;method:getUpFileDatas')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)


# ????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def uploadDataUpdate(request):
    results = tools.successMes()
    session = utils.SqlUtils()
    try:
        operationType = request.data['operationType']
        tableCols = request.data['tableCols']
        tableObj = request.data['tableObj']
        rows = request.data['rows']

        if operationType == 'add':
            sql = "INSERT INTO {0} ({1}) VALUES ({2})"
            colSql = ''
            valSql = ''
            for tableCol in tableCols:
                colSql = colSql + '"' + tableCol['columns'] + '", '
                if tableCol['columns'] == 'column1':
                    valSql = valSql + "'" + UUIDTools.uuid1_hex() + "', "
                    continue
                if tableCol['columns'] not in rows:
                    valSql = valSql + "Null, "
                else:
                    valSql = valSql + "'" + rows[tableCol['columns']] + "', "
            colSql = colSql[:-2]
            valSql = valSql[:-2]
            sql = sql.format(tableObj['tables'], colSql, valSql)
            print(sql)
            session.executeUpdateSql(sql)
        elif operationType == 'delete':
            for row in rows:
                sql = "DELETE FROM " + tableObj['tables'] + " WHERE column1 = '" + row['column1'] + "'"
                session.executeUpdateSql(sql)
        elif operationType == 'edit':
            for row in rows:
                sql = "UPDATE " + tableObj['tables'] + " SET {0} WHERE column1 = '" + row['column1'] + "'"
                colSql = ''
                colCount = 0
                for tableCol in tableCols:
                    if colCount == 0:
                        colCount = colCount + 1
                        continue

                    colSql = colSql + '"' + tableCol['columns'] + '" = '
                    val = row[tableCol['columns']]
                    if val is not None:
                        colSql = colSql + "'" + str(val) + "', "
                    else:
                        colSql = colSql + " Null, "
                    colCount = colCount + 1
                colSql = colSql[:-2]
                sql = sql.format(colSql)
                print(sql)
                session.executeUpdateSql(sql)
        session.closeConnect()#????????????????????????
    except Exception as e:
        session.rollBack()
        print('file:sourceview;method:uploadDataUpdate')
        print(e)
        return Response(tools.errorMes(e.args))

    return Response(results)


#??????sqlStr????????????
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def sqlStrExecute(request):
    results = tools.successMes()
    try:
        databaseid = request.data['databaseid']
        sqlStr = request.data['sqlStr']
        pageCount=1000
        if 'pageCount' in request.data:
            pageCount=request.data['pageCount']

        databaseObj=Database.objects.get(id=databaseid)
        dbtype=databaseObj.database_type

        if dbtype and dbtype=='odbc':
            conn=odbcsqltool.odbcStRestoreById(databaseid)
            # pageSql=odbcsqltool.paginationNoOrder(sqlStr,pageCount,0,databaseObj.odbcstatus)#odbcstatus????????????????????????
            # dictData=odbcsqltool.getDictData(conn,pageSql)
            dictData = []
            print('---------error odbc---------')
        else:
            # st=stRestoreById(databaseid)
            # pageSql=st.serverPaginationNoOrder(pageCount,0,sqlStr)
            # dictData=st.getData(pageSql)
            session = utils.SqlUtils(DBTypeCode.CUSTOM_DB.value, databaseid)
            dictData = session.getDataFromServerPaginationNoOrder(pageCount,0,sqlStr)
            session.closeConnect()


        if dictData:
            results['columnName']=dictData[0].keys()
            results['data'] =dictData
        else:
            results['columnName'] = []
            results['data'] = []
    except Exception as e:
        print('file:sourceview;method:sqlStrExcute;line:1460')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)

