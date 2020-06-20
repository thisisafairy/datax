import pyodbc
from connect.models import *
from common import tools
from datax.settings import DATABASES as db

_dbConnTypes=['teradata','mysql','sqlserver','postgre','oracle','db2','sybase'] #odbc预定义可以连接的类型

def odbcStRestoreById(databaseid):
    database = Database.objects.get(id=databaseid)
    data = {}
    data['driver'] = database.odbcdriver
    data['ip'] = database.ip
    data['db'] = database.database
    data['user'] = database.user_name
    data['pwd'] = database.password
    st = getODBCCon(data['driver'],data['ip'],data['db'],data['user'],data['pwd'])
    return st
# def getLocalConn():
#     localDB=db['default']
#     pgDriver=''
#     return getODBCCon(pgDriver,localDB['HOST'],localDB['USER'],localDB['PASSWORD'])
#

def getODBCCon(odbcDriver,server,database,uid,pwd):
    server=server.split(':')[0] if ':' in server else server
    odbcConUrl = 'DRIVER={' + odbcDriver + '};'
    odbcConUrl = odbcConUrl + 'SERVER=' + server + ';'
    odbcConUrl = (odbcConUrl + 'DATABASE=' + database + ';') if database else odbcConUrl
    odbcConUrl = odbcConUrl + 'UID=' + uid + ';'
    odbcConUrl = odbcConUrl + 'PWD=' + pwd + ';'
    cnxn=None
    try:
        print('getODBCCon odbcConUrl=',odbcConUrl)
        cnxn = pyodbc.connect(odbcConUrl)
    except Exception as e:
        print('=====connect error=====')
        print(e.args)
    return cnxn

def paginationNoOrder(sql,limit,offset,dbtype):
    parentSelectS=' select * from ('
    parentSelectE=' ) chuan '
    limitSql=sql
    if dbtype=='teradata':#效率低
        # limitSql = parentSelectS + limitSql + parentSelectE + ' sameple '+str(count)
        top = int(limit) + int(offset)
        limitSql = parentSelectS + limitSql + parentSelectE + " QUALIFY sum(1) over (rows unbounded preceding) between (" + str(offset) + ") and (" + str(top) + ")";
    elif dbtype in ['mysql','postgre']:#验证
        limitSql = parentSelectS + limitSql + parentSelectE + ' limit ' + str(limit) + ' offset ' + str(offset)
    elif dbtype == 'sqlserver':#未写入
        pass
        # limitSql = 'select top ' + str(count) + ' * from (' + limitSql + parentSelectE
        sqlStrArr=[]    #以下是一个子查询，目标sql被包在最里层
        sqlStrArr.append(parentSelectS)
        sqlStrArr.append(' SELECT row_number () OVER (ORDER BY tempcolumn) temprownumber ,* FROM (')
        sqlStrArr.append(' SELECT TOP '+str(limit)+' tempcolumn = 0 ,* FROM(')
        sqlStrArr.append(limitSql)
        sqlStrArr.append(') t1')
        sqlStrArr.append(') t2')
        sqlStrArr.append(parentSelectE)
        sqlStrArr.append(' WHERE temprownumber > 0 ')
        limitSql=' '.join(sqlStrArr)#以上所有拼接出一个可以分页的sql
    elif dbtype == 'oracle':#未验证
        limitSql = parentSelectS + ' select t.*,ROWNUM RN from ('+ limitSql+') t ' + parentSelectE + ' where RN BETWEEN '+ str(offset) + ' AND ' + str(offset+limit)

    elif dbtype == 'db2':#未验证
        limitSql = parentSelectS + ' select ROW_NUMBER() OVER() AS ROWNUM , chuan1.* from (' \
                   + limitSql + ') chuan1 ' + parentSelectE + ' where chuan.ROWNUM  BETWEEN ' + str(offset) + ' AND ' + str(offset+limit)
    elif dbtype == 'sybase':#未写入
        # limitSql = 'select top ' + str(count) + ' * from (' + limitSql + parentSelectE
        pass

    return limitSql

def serverPaginationNoOrder(limit, offset, sql):
    top=int(limit)+int(offset)
    sql = sql + " QUALIFY sum(1) over (rows unbounded preceding) between (" + str(offset) + ") and (" + str(top) + ")";
    return sql

def getDataBysql(conn,exesql,databaseid=''):
    if not conn and databaseid != '':
        conn=odbcStRestoreById(databaseid)
    if exesql and exesql.strip() :
        resultData = conn.cursor().execute(exesql).fetchall()
    else :
        print('--warning!!!--executeSql is null!!!-----file:odbcsqltool.py;method:getDataBysql;')
        resultData = []
    return resultData

def getColumnBySql(conn,sql,dbtype):
    exesql=paginationNoOrder(sql,1,0,dbtype)
    mycursor=conn.cursor()
    mycursor.execute(exesql)
    cols=[tp[0] for tp in mycursor.description]
    # print('cols=',cols)
    return cols

def getDictData(conn,sql,databaseid='',chinesetitle=None):
    try:
        if not conn and databaseid and databaseid != '':
            conn = odbcStRestoreById(databaseid)
        dbcursor = conn.cursor()
        dbcursor.execute(sql)
        if chinesetitle and len(chinesetitle) > 0:
            cols = chinesetitle
        else:
            cols = [tp[0] for tp in dbcursor.description]
        datas = dbcursor.fetchall()
        results = []
        for dt in datas:
            # dtcleaned=[dto.strip() for dto in dt]
            results.append(dict(zip(cols, dt)))
        return results
    except Exception as err:
        raise err
        print('=====error=====file:odbcsqltools.py;method:getDictData;line:92;error message=',err.args)
        return []

def getTotalCount(conn,sql,databaseid=''):
    if not conn and databaseid != '':
        conn=odbcStRestoreById(databaseid)
    if not conn and not databaseid:
        raise RuntimeError('odbc连接异常！')
    exesql='select count(1) from ('+sql+') a'
    totalcount=conn.execute(exesql).fetchone()
    return totalcount[0]

def odbcGetDBTypeFromDrive(driverStr):#通过数据库驱动查找数据库类型，参数：数据库驱动字符串，返回：数据库类型或''
    rs=''
    if driverStr and type(driverStr) == type('helloworld'):
        driverStr=driverStr.replace(' ','').lower()
        for dbstr in _dbConnTypes:
            if driverStr.find(dbstr) != -1:
                rs=dbstr
                break;
    return rs

def paramWrapper(paramArr,connType):#根据数据库类型，对参数进行包装，例如Teradata的日期需要加上date '2018-08-12'而mysql不需要
    if connType not in _dbConnTypes:
        return paramArr
    wrapperedParam=[]
    for paramObj in paramArr:
        temporaryV=paramObj #判断日期不能使用加了引号的值
        paramObj="'"+paramObj+"'"
        try:
            if connType == 'teradata':
                if tools.isVaildDate(temporaryV):  # teradata日期格式作入参需要特殊处理
                    wrapperedParam.append(' date ' + paramObj)
                else:
                    wrapperedParam.append(paramObj)
            elif connType == 'mysql':
                wrapperedParam.append(paramObj)
            elif connType == 'sqlserver':
                wrapperedParam.append(paramObj)
            elif connType == 'postgre':
                wrapperedParam.append(paramObj)
            elif connType == 'oracle':
                if tools.isVaildDate(temporaryV):  # teradata日期格式作入参需要特殊处理
                    wrapperedParam.append(' to_date(' + paramObj + ',yyyy-mm-dd hh24:mi:ss)')
                else:
                    wrapperedParam.append(paramObj)
            elif connType == 'db2':
                wrapperedParam.append(paramObj)
            elif connType == 'sybase':
                wrapperedParam.append(paramObj)
        except Exception as e:
            wrapperedParam.append(paramObj)#如果抛出异常就不错wrapper
            print('----error----file:odbcsqltool.py;method:paramWrapper;line:138')
            print('----error msg:',e.args)

    if wrapperedParam:
        return wrapperedParam
    else:
        return paramArr




