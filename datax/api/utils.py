from itertools import chain
from collections import Iterable
from common.utils import Utils
from common.head import DATAXEXTENSION_DB_INFO as dataxExtDB,DEFAULT_DB_INFO as defaultDB
import psycopg2
import pandas as pd
import numpy as np

from connect.models import *
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


#定义的常量，不能更改其值，只可以做对比使用
DEFAULT_DB_CHAR = 'default'
DATAXEXTENSION_DB_CHAR = 'dataxExtensionDB'


# def my_sql_query(sql):
#     from django.db import connection, transaction
#     cursor = connection.cursor()
#
#     # 数据检索操作,不需要提交
#     cursor.execute(sql)
#     row = cursor.fetchall()
#
#     return row


# def my_sql_query_params(sql,params):
#     from django.db import connection, transaction
#     cursor = connection.cursor()
#
#     # 数据检索操作,不需要提交
#     cursor.execute(sql, params)
#     row = cursor.fetchall()
#
#     return row

# def my_sql_execute(sql,params):
#     from django.db import connection, transaction
#     cursor = connection.cursor()
#
#     # 数据检索操作,不需要提交
#     cursor.execute(sql, params)
#     #transaction.commit_unless_managed()
#     return ''


# def my_sql_executemany(sql,params):
#     from django.db import connection, transaction
#     cursor = connection.cursor()
#
#     # 数据检索操作,不需要提交
#     effCount=cursor.executemany(sql, params)
#     return effCount

def getTableStructure(tableName, dataxDBType='default'):
    tableStructure = []
    if tableName:
        sql = """SELECT table_schema, table_name, column_name, data_type, column_default, is_nullable
                        FROM information_schema.columns WHERE table_name = '""" + tableName + """'"""
        result = getResultBySql(sql,dataxDBType)
        for row in result:
            structure = {}
            structure['table_schema'] = row[0]
            structure['table_name'] = row[1]
            structure['column_name'] = row[2]
            structure['data_type'] = row[3]
            structure['column_default'] = row[4]
            structure['is_nullable'] = row[5]
            tableStructure.append(structure)
    return tableStructure

def getCreateTableStructure(tableName, dataxDBType='default'):
    tableStructure = []
    if tableName:
        sql = """SELECT table_schema,TABLE_NAME,COLUMN_NAME,udt_name,character_maximum_length,datetime_precision,column_default,is_nullable 
                        FROM information_schema.columns WHERE table_name = '""" + tableName + """'"""
        result = getResultBySql(sql, dataxDBType)
        for row in result:
            structure = {}
            structure['tableSchema'] = row[0]
            structure['tableName'] = row[1]
            structure['columnName'] = row[2]
            structure['udtName'] = row[3]#udtName
            structure['chrMaxLen'] = row[4] #character_maximum_length
            structure['dttPrecision'] = row[5]#datetime_precision
            structure['colDefault'] = row[6]#column_default
            structure['isNullable'] = row[7]#is_nullable
            tableStructure.append(structure)
    return tableStructure

#根据表名和表结构创建表，表结构必须来源于getCreateTableStructure
def createTableFromStruct(tableName,tableStruct, dataxDBType='default'):
    rslogs={}
    deleteTableSql = 'DROP TABLE IF EXISTS "public"."+tanme+";'
    notnullstr=' NOT NULL '
    defaultstr=' "default" '
    collatestr=' COLLATE '
    tbFields=[]
    createTableSql = 'CREATE TABLE "public"."'+tableName+'"('
    for structo in tableStruct:
        tbFields.append(structo['columnName'])
        createTableSql+='"'+structo['columnName']+'" '  #fieldname
        fieldTp=structo['udtName']
        if fieldTp=='varchar':
            fieldTp=fieldTp+'('+str(structo['chrMaxLen'])+') '
        elif fieldTp=='timestamp':
            fieldTp = fieldTp + '(' + str(structo['dttPrecision']) + ') '
        createTableSql+=fieldTp         #filedtype
        if structo['udtName'] in ['varchar','text']:#后续的collate,defualt,not null等字符
            createTableSql+=collatestr+defaultstr
        if structo['isNullable']=='NO' or (structo['isNullable']).lower()=='no':
            createTableSql+=notnullstr

        createTableSql += ','#每个字段后面需要','分割

    createTableSql=createTableSql[:len(createTableSql)-1]+')WITH (OIDS=FALSE);'#去掉最后的','再加上with语句块
    # print('createTableSql=',createTableSql)
    session = SqlUtils()
    try:
        if createTableSql.count(',') > 0:  # 如果拼接的sql有字段
            excuteSql(deleteTableSql, None, dataxDBType)  # 如果有原表就删除，然后新增
            excuteSql(createTableSql, None, dataxDBType)  # 新增表结构
            rslogs['code'] = 1
            rslogs['msg'] = '建表成功！'
            rslogs['tbFields']=tbFields
        else:
            rslogs['code'] = 0
            rslogs['msg'] = '没有解析除表字段！'
    except Exception as e:
        rslogs['code']=0
        rslogs['msg']='建表过程发生异常！'

    return rslogs
#根据表名和表的数据插入到指定表中,tableData是字典
def insertIntoTable(tableName,tableFields,tableData, dataxDBType='default'):
    rs={}
    #根据tableFields的顺序，把tableData的数据转成[(),(),()....]等形式
    tbDataList=[]
    for tbDataObj in tableData:
        rowDt=[]
        for dt in tableFields:#匹配数据
            rowDt.append(tbDataObj[dt])
        tbDataList.append(tuple(rowDt))
    if not tbDataList:
        rs['code']=0
        rs['msg']='没有数据需要插入！'
    #拼接sql
    insertSql='insert into '+tableName+'('+','.join(tableFields)+') values('+','.join(['%s' for x in range(len(tableFields))])+')'
    # print('insert previw Sql=',insertSql)
    try:
        excuteSqlByBulkParams(insertSql, tbDataList, dataxDBType)
        rs['code']=1
        rs['msg']='表格数据插入成功！'
    except Exception as e:
        rs['code']=0
        rs['msg']=e.args[0]
        raise e
    return rs

def getListFromOlapTable(tableName, dataxDBType='default'):
    tableStructure = getTableStructure(tableName, dataxDBType)

    sql = 'SELECT * FROM ' + tableName + ' WHERE "version" = (SELECT MAX("version") FROM ' + tableName + \
          ') OR extra_processing = \'y\''
    columns = []
    for structure in tableStructure:
        columns.append(structure['column_name'])
    queryResult = getResultBySql(sql,dataxDBType)
    dataList = queryResultToDicts(queryResult, columns)
    return dataList



# cur = conn.cursor()
# cur.execute(sql)
# conn.commit()
# conn.close()
def getNativeConn(dataxDBType=DEFAULT_DB_CHAR):
    if dataxDBType and dataxDBType == DATAXEXTENSION_DB_CHAR :
        dbInfo = dataxExtDB
    else:
        dbInfo = defaultDB
    host = dbInfo['ip'].split(':')[0]
    port = dbInfo['ip'].split(':')[1]
    dbName = dbInfo['db']
    user = dbInfo['user']
    pwd = dbInfo['pwd']
    conn = psycopg2.connect(dbname=dbName, user=user,password=pwd, host=host, port=port)
    return conn


# 返回datatable格式数据,默认使用系统数据库，如有需要可以使用业务数据库
def getResultBySql(sql,dataxDBType='default'):
    conn = getNativeConn(dataxDBType)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    # 提交事务
    conn.commit()
    # 关闭连接
    conn.close()
    return rows


# 返回标准dict格式数据
def getDictBySql(sql, tableName, dataxDBType='default'):
    rows = getResultBySql(sql, dataxDBType)
    tableStructure = getTableStructure(tableName, dataxDBType)
    columns = []
    for structure in tableStructure:
        columns.append(structure['column_name'])
    dataList = queryResultToDicts(rows, columns)
    return dataList


# 执行增删改sql
def excuteSql(sql,paremeter,dataxDBType='default'):
    conn = getNativeConn(dataxDBType)
    cur = conn.cursor()
    cur.execute(sql,paremeter)
    # 提交事务
    conn.commit()
    # 关闭连接
    conn.close()


# 执行增删改sql
def excuteSqlByBulkParams(sql,paremeters,dataxDBType='default'):
    conn = getNativeConn(dataxDBType)
    cur = conn.cursor()
    effCount = cur.executemany(sql,paremeters)
    # 提交事务
    conn.commit()
    # 关闭连接
    conn.close()
    return effCount


################################################################################################3
# sql查询结果集转换为dict
def queryResultToDicts(queryResult, cols):
    dataList = []
    for row in queryResult:
        rowInfo = {}
        count = 0
        for col in cols:
            rowInfo[col] = row[count]
            count = count + 1
        dataList.append(rowInfo)
    return dataList
#将model转换成dict，入参为model，返回值为字典
def model_to_dict_wrapper(instance):
    opts = instance._meta
    data = {}
    for f in chain(opts.concrete_fields, opts.private_fields, opts.many_to_many):
        data[f.name] = f.value_from_object(instance)
    return data

#将多个model转成dict
def model_list_to_dict_wrapper(instancelist):
    results=[]
    if isinstance(instancelist,Iterable):
        for obj in instancelist:
            results.append(model_to_dict_wrapper(obj))
    return results


class SqlUtils:
    def connect(self):
        engine = create_engine(self.dbUrl, echo=False,pool_size=30, pool_recycle=5, pool_timeout=30, max_overflow=0)
        DBSession = sessionmaker(bind=engine)
        self.session = DBSession()

    def getArrResult(self, sql, autoClose=False):
        queryList = self.session.execute(sql)
        res = queryList.fetchall()
        if autoClose:
            self.closeConnect()
        return res

    # 包装getArrResult
    def getArrResultWrapper(self, querySql,logger=None, pyFileName='', methodName=''):
        rsData = []
        try:
            rsData = self.getArrResult(querySql)
        except Exception as error:
            if logger:
                logger.error('---error---file:%s;method:%s;error=%s' % (pyFileName, methodName, error))
            raise error
        finally:
            self.closeConnect()
        return rsData

    def getDictResult(self, sql):
        list = self.session.execute(sql)
        cols = list.cursor.description#对于oracle，sql里是有小写的字段，但这一步就将所有的字段转大写了，
        columnNames = []
        for col in cols:
            try:
                # columnNames.append(col.name)#因数据库不同而导致查询的col可能是对象也可能是数组，所以需要捕捉异常处理
                colName = col.name
            except Exception as error:
                # columnNames.append(col[0])
                colName = col[0]
            columnNames.append(colName)

        columnNames = tuple(columnNames)#需要转tuple
        res = list.fetchall()
        resArr = []
        for row in res:
            resArr.append(dict(zip(columnNames,row)))
        return resArr

    def getTotal(self, sql):
        sql = "select count(*) as total from (" + sql + ") a"
        tb = self.session.execute(sql)
        b = tb.fetchall()
        tbs = []
        for u in b:
            tbs.append(dict(zip(u.keys(), u.values())))
        return tbs[0]

    def executeUpdateSql(self, sql):#执行插入或修改语句，需要回滚，多次执行后需要调用closeConnect手动关闭连接
        try :
            self.session.execute(sql)#不关闭异常，可能多次调用执行sql，最后让用户执行commit和连接的关闭
        except Exception as error:
            raise error    #需要将异常抛出到调用的函数，让其进行处理

    # 增删改 SQL操作 type增删改  table对应的表  id操作的id  **kwargs传入 字段=值 例:name='张三'
    def executeSql(self,type,table,id,**kwargs):
        state = ''
        try:
            if type == "insert":
                field = ''
                fieldvalue = ''
                for i,j in kwargs.items():
                    field += ''' "{}",'''.format(i)
                    fieldvalue += ''' '{}','''.format(j)
                sql = r'''INSERT INTO {}({}"id") VALUES ({}'{}')'''.format(table,field,fieldvalue,id)
                # print(sql)
            elif type == "update":
                field = ''
                for i,j in kwargs.items():
                    field += '''"{}" = '{}','''.format(i,j)
                sql = r'''UPDATE {0} SET {1} WHERE "id" = '{2}' '''.format(table,field[:-1],id)
            elif type == "delete":
                sql = r'''DELETE FROM {0} WHERE "id" = {1}'''.format(table,id)
            else:
                raise Exception('type类型错误')
            self.excuteSqlByBulkParams(sql)
        except Exception as e:
            state = e
        finally:
            self.closeConnect()
        return state



    # 执行增删改sql
    def excuteSqlByBulkParams(self, sql, paremeters=None, logger=None):
        try:
            effCount = self.session.execute(sql, paremeters)
        except Exception as error:
            self.rollBack()
            if logger:
                logger.error('---error---file:utils.py;method:excuteSqlByBulkParams;error=%s' % error.args)
            raise error
        finally:
            self.closeConnect()#只执行一次就关闭连接
        return effCount


    def closeConnect(self):
        self.session.commit()
        self.session.close()

    def rollBack(self):
        self.session.rollback()
        self.session.close()

    def kindtype(self, kind):#参考sqltool里的类型转换，database表里存储的dbtype要经过转换才能拼接到dburl里
        rs = ""
        if kind == 'mysql':
            rs = "mysql+pymysql"
        if kind == 'mssql':
            rs = 'mssql+pymssql'
        if kind == 'pgsql':
            rs = 'postgresql'
        if kind == 'oracle':
            rs = 'oracle+cx_oracle'
        return rs

    def __init__(self, dbType='default', dbId='', connInfo={}):
        if dbType == 'default':
            self.kind = 'pgsql'
            self.dbUrl = 'postgresql://' + defaultDB['user'] + ':' + defaultDB['pwd'] + '@' + defaultDB['ip'] + '/' + defaultDB['db']
            # self.dbUrl = 'postgresql://sola:a@123456B@pgm-bp1kyk50ab84p141eo.pg.rds.aliyuncs.com:3432/sola_test'
        elif dbType == 'extension':
            self.kind = 'pgsql'
            self.dbUrl = 'postgresql://' + dataxExtDB['user'] + ':' + dataxExtDB['pwd'] + '@' + dataxExtDB['ip'] + '/' + dataxExtDB['db']
            # self.dbUrl = 'postgresql://sola:a@123456B@pgm-bp1kyk50ab84p141eo.pg.rds.aliyuncs.com:3432/sola_test'
        elif dbType == 'custom' and dbId:
            database = Database.objects.get(id=dbId)
            data = {}
            data['ip'] = database.ip
            data['db'] = database.database
            data['user'] = database.user_name
            data['pwd'] = database.password
            data['kind'] = database.database_type
            data['id'] = id
            self.dbUrl = self.kindtype(data['kind']) +'://' + data['user'] + ':' + data['pwd'] + '@' + data['ip'] + '/' + data['db']
            self.kind = data['kind']
            self.databaseId = dbId#如果是通过这种方式建立的需要让类具有dbId
            if self.kind == 'mysql' :
                self.dbUrl += '?charset=utf8'
            # elif self.kind == 'mssql' :
            #     self.dbUrl += '?charset=utf8'#需要再添加应的参数
            # elif self.kind == 'oracle' :
            #     self.dbUrl += '?charset=utf8'#需要再添加应的参数

            # self.dbUrl = 'postgresql://sola:a@123456B@pgm-bp1kyk50ab84p141eo.pg.rds.aliyuncs.com:3432/sola_test'
        elif dbType == 'custom' and connInfo:
            data = {}
            data['ip'] = connInfo['ip']
            data['db'] = connInfo['db']
            data['user'] = connInfo['username']
            data['pwd'] = connInfo['password']
            data['kind'] = connInfo['type']
            self.dbUrl = self.kindtype(data['kind']) +'://' + data['user'] + ':' + data['pwd'] + '@' + data['ip'] + '/' + data['db']
            self.kind = data['kind']
            if self.kind == 'mysql' :
                self.dbUrl += '?charset=utf8'
        elif not dbType:
            print('----error----缺少类型,dbType=%s' % dbType)
            raise Exception('缺少类型,dbType=%s' % dbType)
        elif not dbId:
            print('----error----databaseid为空,dbId=%s' % dbId)
            raise Exception('databaseid为空,dbId=%s' % dbId)
        else:
            print('----error----注意，这个错误比较严重！')
            raise Exception('注意，这个错误比较严重！')
        self.connect()

    def getColumnByTable(self, table):
        columnSql = Utils().databaseColumn(self.kind, table)
        dataLists = self.getDictResult(columnSql['sql'])
        return dataLists

    def getColumnBySql(self, sql):
        sql = self.serverPaginationNoOrder(1, 0, sql)#只需得到columnName，这里需要使用serverPaginationNoOrder，在后续的循环中删除了多余的rownumber字段
        list = self.session.execute(sql)
        cols = list.cursor.description
        columnNames = []
        for col in cols:
            try:
                colName = col.name
            except Exception as error:
                colName = col[0]
            if self.kind in ['oracle','mssql'] and (colName in ['tempcolumn','TEMPROWNUMBER'] or colName.upper() == 'TEMPROWNUMBER'):#处理oracle特殊
                continue#略过因翻页产生的字段temprownumber
            columnNames.append(colName)
        return columnNames

    # 获取sql的value和column，两者都是list类型
    def getDataAndKey(self, sql):
        querySet = self.session.execute(sql)
        resutl = {}
        keys = querySet.cursor.description
        keys = [k[0] for k in keys]
        values = querySet.fetchall()
        # print("===keys=",keys)
        # print("===values=",values)
        resutl['keys'] = list(keys)
        resutl['list'] = list(values)
        return resutl

    #不排序的翻页
    def serverPaginationNoOrder(self, limit, offset, sql):
        if self.kind == 'mysql':
            return sql + ' limit ' + str(offset) + ', ' + str(limit)
        elif self.kind == 'pgsql':
            return sql + ' limit ' + str(limit) + ' offset ' + str(offset)
        elif self.kind == 'mssql':
            top = int(limit) + int(offset)
            return """
                select *
                from (
                select row_number()over(order by tempcolumn)TEMPROWNUMBER,*
                from (select top """ + str(top) + """ tempcolumn=0,* from ( """ + sql + """ ) a )t
                )tt
                where TEMPROWNUMBER>""" + str(offset) + """;
            """
        elif self.kind == 'oracle':
            # getSqlColumnName = """ SELECT * FROM (SELECT rownum r,A.* FROM ( """ + sql + """ ) A WHERE rownum <= """ + \
            #                    str(1) + """) B WHERE r > """ + str(0) + """  """
            # # tb = self.execute(getSqlColumnName)
            # list = self.session.execute(getSqlColumnName)
            # cols = list.cursor.description
            # columnNames = []
            # for col in cols:
            #     try:
            #         colName = col.name# 因数据库不同而导致查询的col可能是对象也可能是数组，所以需要捕捉异常处理
            #     except Exception as error:
            #         # columnNames.append(col[0])
            #         colName = col[0]
            #     if self.kind == 'oracle':
            #         colName = colName.lower()
            #     columnNames.append(colName)
            # allSqlColumn = "*"
            # if columnNames:
            #     allSqlColumn = ','.join(columnNames[1:])  # 去掉前面的那个r
            # print('allSqlColumn=', allSqlColumn)

            top = int(limit) + int(offset)
            return """ SELECT """ + '*' + """ FROM (SELECT rownum TEMPROWNUMBER,A.* FROM ( """ + sql + """ ) A WHERE rownum <= """ + str(top) + """) B WHERE TEMPROWNUMBER > """ + str(offset) + """  """
        else:
            return sql

    def getDataFromServerPaginationNoOrder(self, limit, offset, sql, isArrTp=False):#isArrTp判断是否是返回数组类型的是数据
        pagenationSql = sql
        pagenationAddedColumn = ''
        if self.kind == 'mysql':
            pagenationSql = sql + ' limit ' + str(offset) + ', ' + str(limit)
        elif self.kind == 'pgsql':
            pagenationSql = sql + ' limit ' + str(limit) + ' offset ' + str(offset)
        elif self.kind == 'mssql':
            top = int(limit) + int(offset)
            pagenationAddedColumn = 'TEMPROWNUMBER'
            pagenationSql = """
                select *
                from (
                select row_number()over(order by tempcolumn) """ + pagenationAddedColumn + """,*
                from (select top """ + str(top) + """ tempcolumn=0,* from ( """ + sql + """ ) a )t
                )tt
                where """ + pagenationAddedColumn + """>""" + str(offset) + """;
            """
        elif self.kind == 'oracle':
            top = int(limit) + int(offset)
            pagenationAddedColumn = 'TEMPROWNUMBER'
            pagenationSql = """ SELECT """ + '*' + """ FROM (SELECT rownum """ + pagenationAddedColumn + """,A.* FROM ( """ + sql + """ ) A WHERE rownum <= """ + str(top) + """) B WHERE """ + pagenationAddedColumn + """ > """ + str(offset) + """  """
        # 用pandas处理pagenationSql查询的结果集，处理掉因分页多出来的字段，返回结果集给调用方
        querySet = self.getDictResult(pagenationSql)
        df = pd.DataFrame(querySet)  # 用pandas去掉分页产生的一列，用pandas转成字典格式
        if pagenationAddedColumn:
            df = df.drop(pagenationAddedColumn, axis=1)
        if isArrTp:
            dictSet = np.array(df).tolist()
        else:
            dictSet = df.to_dict(orient='records')
        return dictSet

    #翻页有排序
    def serverPagination(self, limit, offset, sql):
        if self.kind == 'mysql':
            return sql['sql']+' '+ sql['order'] + ' limit ' + str(offset) + ', ' + str(limit)
        elif self.kind == 'pgsql':
            return sql['sql']+' '+ sql['order'] + ' limit ' + str(limit) + ' offset ' + str(offset)
        elif self.kind == 'mssql':
            top = int(limit) + int(offset)
            return """
                SELECT * FROM ( SELECT *, TEMPROWNUMBER = row_number () OVER ("""+ sql['order'] +""")
                FROM  ("""+sql['sql']+""") a ) AS rowTable
                WHERE rowTable.TEMPROWNUMBER BETWEEN """+str(offset)+""" and """+str(top)+"""
            """
        elif self.kind == 'oracle':
            # 分页处需要明确select出来的字段不能包含分页产生的rownumber字段，所以需要得到getSqlColumnName
            # getSqlColumnName = """SELECT * FROM (SELECT rownum r,A.* FROM ( """ + sql['sql'] + """  """ + sql[
            #     'order'] + """ ) A WHERE rownum <= """ + str(1) + """ ) B WHERE r > """ + str(0) + """ """
            # list = self.session.execute(getSqlColumnName)
            # cols = list.cursor.description
            # columnNames = []
            # for col in cols:
            #     try:
            #         colName = col.name
            #         # columnNames.append(col.name)  # 因数据库不同而导致查询的col可能是对象也可能是数组，所以需要捕捉异常处理
            #     except Exception as error:
            #         # columnNames.append(col[0])
            #         colName = col[0]
            #     if self.kind == 'oracle':
            #         colName = colName.lower()
            #     columnNames.append(colName)
            # allSqlColumn = "*"
            # if columnNames:
            #     allSqlColumn = ','.join(columnNames[1:])  # 去掉前面的那个r
            # print('allSqlColumn=', allSqlColumn)
            top = int(limit) + int(offset)
            return """SELECT """ + '*' + """ FROM (SELECT rownum TEMPROWNUMBER,A.* FROM ( """ + sql['sql'] + """  """+ sql['order'] + """ ) A WHERE rownum <= """ + str(top) + """ ) B WHERE TEMPROWNUMBER > """ + str(offset) + """ """
        else:
            return sql

    def getDictDataFromServerPagination(self, limit, offset, sql, isArrTp=False):#isArrTp判断是否是返回数组类型的是数据
        pagenationSql = sql['sql']
        pagenationAddedColumn = ''
        if self.kind == 'mysql':
            pagenationSql = sql['sql']+' '+ sql['order'] + ' limit ' + str(offset) + ', ' + str(limit)
        elif self.kind == 'pgsql':
            pagenationSql = sql['sql']+' '+ sql['order'] + ' limit ' + str(limit) + ' offset ' + str(offset)
        elif self.kind == 'mssql':
            top = int(limit) + int(offset)
            pagenationAddedColumn = 'TEMPROWNUMBER'
            pagenationSql = """
                SELECT * FROM ( SELECT *, row_number () OVER ("""+ sql['order'] +""") """ + pagenationAddedColumn + """
                FROM  ("""+sql['sql']+""") a ) AS rowTable
                WHERE rowTable.""" + pagenationAddedColumn + """ BETWEEN """+str(offset)+""" and """+str(top)+"""
            """
        elif self.kind == 'oracle':
            top = int(limit) + int(offset)
            pagenationAddedColumn = 'TEMPROWNUMBER'
            pagenationSql = """SELECT """ + '*' + """ FROM (SELECT rownum """ + pagenationAddedColumn + """,A.* FROM ( """ + sql['sql'] + """  """+ sql['order'] + """ ) A WHERE rownum <= """ + str(top) + """ ) B WHERE """ + pagenationAddedColumn + """ > """ + str(offset) + """ """
        # 用pandas处理pagenationSql查询的结果集，处理掉因分页多出来的字段，返回结果集给调用方
        querySet = self.getDictResult(pagenationSql)
        df = pd.DataFrame(querySet)  # 用pandas去掉分页产生的一列，用pandas转成字典格式
        if pagenationAddedColumn:
            df = df.drop(pagenationAddedColumn, axis=1)
        if isArrTp:
            dictSet = np.array(df).tolist()
        else:
            dictSet = df.to_dict(orient='records')
        return dictSet

    def getTableStructure(self, tableName):
        tableStructure = []
        if tableName:
            sql = """SELECT table_schema, table_name, column_name, data_type, column_default, is_nullable
                            FROM information_schema.columns WHERE table_name = '""" + tableName + """'"""
            result = self.getArrResult(sql,True)
            for row in result:
                structure = {}
                structure['table_schema'] = row[0]
                structure['table_name'] = row[1]
                structure['column_name'] = row[2]
                structure['data_type'] = row[3]
                structure['column_default'] = row[4]
                structure['is_nullable'] = row[5]
                tableStructure.append(structure)
        return tableStructure

    def getCreateTableStructure(self, tableName):
        tableStructure = []
        if tableName:
            sql = """SELECT table_schema,TABLE_NAME,COLUMN_NAME,udt_name,character_maximum_length,datetime_precision,column_default,is_nullable 
                            FROM information_schema.columns WHERE table_name = '""" + tableName + """'"""
            result = self.getArrResult(sql,True)
            for row in result:
                structure = {}
                structure['tableSchema'] = row[0]
                structure['tableName'] = row[1]
                structure['columnName'] = row[2]
                structure['udtName'] = row[3]  # udtName
                structure['chrMaxLen'] = row[4]  # character_maximum_length
                structure['dttPrecision'] = row[5]  # datetime_precision
                structure['colDefault'] = row[6]  # column_default
                structure['isNullable'] = row[7]  # is_nullable
                tableStructure.append(structure)
        return tableStructure

    def getListFromOlapTable(self, tableName,logger):
        if logger:
            logger.info('---this method:getListFromOlapTable only used for dataxExtensionDB---')
        tableStructure = self.getTableStructure(tableName)
        sql = 'SELECT * FROM ' + tableName + ' WHERE "version" = (SELECT MAX("version") FROM ' + tableName + \
              ') OR extra_processing = \'y\''
        columns = []
        for structure in tableStructure:
            columns.append(structure['column_name'])
        queryResult = self.getArrResult(sql)
        dataList = queryResultToDicts(queryResult, columns)
        return dataList


    # 根据表名和表结构创建表，表结构必须来源于getCreateTableStructure
    def createTableFromStruct(self, tableName, tableStruct):
        rslogs = {}
        deleteTableSql = 'DROP TABLE IF EXISTS "public"."+tanme+";'
        notnullstr = ' NOT NULL '
        defaultstr = ' "default" '
        collatestr = ' COLLATE '
        tbFields = []
        createTableSql = 'CREATE TABLE "public"."' + tableName + '"('
        for structo in tableStruct:
            tbFields.append(structo['columnName'])
            createTableSql += '"' + structo['columnName'] + '" '  # fieldname
            fieldTp = structo['udtName']
            if fieldTp == 'varchar':
                fieldTp = fieldTp + '(' + str(structo['chrMaxLen']) + ') '
            elif fieldTp == 'timestamp':
                fieldTp = fieldTp + '(' + str(structo['dttPrecision']) + ') '
            createTableSql += fieldTp  # filedtype
            if structo['udtName'] in ['varchar', 'text']:  # 后续的collate,defualt,not null等字符
                createTableSql += collatestr + defaultstr
            if structo['isNullable'] == 'NO' or (structo['isNullable']).lower() == 'no':
                createTableSql += notnullstr

            createTableSql += ','  # 每个字段后面需要','分割

        createTableSql = createTableSql[:len(createTableSql) - 1] + ')WITH (OIDS=FALSE);'  # 去掉最后的','再加上with语句块
        # print('createTableSql=',createTableSql)
        try:
            if createTableSql.count(',') > 0:  # 如果拼接的sql有字段
                self.executeUpdateSql(deleteTableSql)# 如果有原表就删除，然后新增////如果执行异常这里已经关闭了链接
                self.executeUpdateSql(createTableSql)# 新增表结构
                self.closeConnect()#提交修改，如果执行不成功就返回
                rslogs['code'] = 1
                rslogs['msg'] = '建表成功！'
                rslogs['tbFields'] = tbFields
            else:
                rslogs['code'] = 0
                rslogs['msg'] = '没有解析除表字段！'
        except Exception as e:
            self.rollBack()
            rslogs['code'] = 0
            rslogs['msg'] = '建表过程发生异常！'

        return rslogs

    # 根据表名和表的数据插入到指定表中,tableData是字典
    def insertIntoTable(self, tableName, tableFields, tableData, logger):
        rs = {}
        # 根据tableFields的顺序，把tableData的数据转成[(),(),()....]等形式
        tbDataList = []
        for tbDataObj in tableData:
            rowDt = []
            for dt in tableFields:  # 匹配数据
                rowDt.append(tbDataObj[dt])
            tbDataList.append(tuple(rowDt))
        if not tbDataList:
            rs['code'] = 0
            rs['msg'] = '没有数据需要插入！'
        # 拼接sql
        insertSql = 'insert into ' + tableName + '(' + ','.join(tableFields) + ') values(' + ','.join(
            ['%s' for x in range(len(tableFields))]) + ')'
        # print('insert previw Sql=',insertSql)
        try:
            self.excuteSqlByBulkParams(insertSql, tbDataList, logger)
            rs['code'] = 1
            rs['msg'] = '表格数据插入成功！'
        except Exception as e:
            rs['code'] = 0
            rs['msg'] = e.args[0]
            if logger:
                logger.error('---error---file:utils.py;method:insertIntoTable;error=%s' % e)
            raise e
        return rs

