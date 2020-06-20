from sqlalchemy import create_engine, inspect, Table, MetaData, types, \
    func, select, extract, Column
from sqlalchemy import *
import common.protocol as Protocol
from connect.models import *
from common.utils import Utils
from common.columntype import COLUMN_TYPE
from common.head import DEFAULT_DB_INFO,DATAXEXTENSION_DB_INFO
from random import randint
from common.globalvariable import QUOTA_FOR_DBSQL
import pandas as pd
import numpy as np
import json

#定义的常量，不能更改其值，只可以做对比使用
DEFAULT_DB_TYPEVALUE = 'default'
DATAXEXTENSION_DB_TYPEVALUE = 'dataxExtensionDB'

def stRestore(data):
    st = PysqlAgent().restore(data)
    return st

def stRestoreLocal(dataxDBType='default'):
    if dataxDBType and dataxDBType == DATAXEXTENSION_DB_TYPEVALUE:
        st = PysqlAgent().restore(DATAXEXTENSION_DB_INFO)
    else:
        st = PysqlAgent().restore(DEFAULT_DB_INFO)
    return st

def stRestoreById(id):
    database = Database.objects.get(id=id)
    data = {}
    data['ip'] = database.ip
    data['db'] = database.database
    data['user'] = database.user_name
    data['pwd'] = database.password
    data['kind'] = database.database_type
    data['id'] = id
    st = stRestore(data)
    return st


def stRestoreBySourceId(id):
    sourcerow = source.objects.get(id=id)
    databaseid = sourcerow.databaseid
    st = stRestoreById(databaseid)
    return st


# 拆分时间类型为年月字段
def splitDateCol(kind, formulaType, colName):
    if kind == 'mysql' or kind == 'mssql':
        if formulaType == 'get_year':
            colName = ''' YEAR(''' + colName + ''') '''
        elif formulaType == 'get_month':
            colName = ''' MONTH(''' + colName + ''') '''
        elif formulaType == 'get_day':
            colName = ''' DAY(''' + colName + ''') '''
    elif kind == 'pgsql':
        if formulaType == 'get_year':
            colName = ''' EXTRACT(YEAR FROM ''' + colName + ''') '''
        elif formulaType == 'get_month':
            colName = ''' EXTRACT(MONTH FROM ''' + colName + ''') '''
        elif formulaType == 'get_day':
            colName = ''' EXTRACT(DAY FROM ''' + colName + ''') '''
    elif kind == 'oracle':
        if formulaType == 'get_year':
            colName = ''' EXTRACT(YEAR FROM "''' + colName + '''") '''
        elif formulaType == 'get_month':
            colName = ''' EXTRACT(MONTH FROM "''' + colName + '''") '''
        elif formulaType == 'get_day':
            colName = ''' EXTRACT(DAY FROM "''' + colName + '''") '''
    return colName


class PysqlAgent():#使用这个查询会有连接冲突的可能，
    cnt = ''
    engine = None
    conn = None
    insp = None
    kind = None

    def __init__(self, kwargs=None):
        if kwargs:
            self.connDb(**kwargs)
        self.sql_relation = SqlRelation()

    def active(self):
        """
        激活对象
        """
        if not (self.engine and self.conn and self.insp):
            self.engine = create_engine(self.cnt, echo=True)
            self.conn = self.engine.connect()
            self.insp = inspect(self.engine)
        return self

    def restore(self, data):#使用这个查询会有连接冲突的可能，
        self.connDb(data['kind'], data['ip'],
                    data['db'], data['user'], data['pwd'])
        if 'id' in data:
            self.id = data['id']
        else:
            self.id = 'local'
        return self

    def connDb(self, kind, ip, db, user, pwd):
        """
        连接数据库
        """
        if not kind:
            return False, u'database kind missing'
        if not db:
            return False, u'database name missing'

        ip = ip if ip else u'127.0.0.1'

        cnt = u'{kind}://{user}:{pwd}@{host}/{db}'.format( \
            kind=self.kindtype(kind), user=user, pwd=pwd, host=ip, \
            db=db \
            )
        if kind == 'mysql':
            cnt = cnt + u'?charset=utf8'
        self.cnt = cnt
        self.active()
        self.kind = kind
        # if kind == 'mysql':
        #     self.execute('set character_set_database=utf8')
        return True, u''

    def listTables(self):
        """
        列出数据库中所有表的名字
        """
        tables = self.insp.get_table_names()
        return tables

    def kindtype(self, kind):
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

    # def execute(self, sql_obj):
    #     return self.conn.execute(sql_obj)

    def getDatabase(self, dist):
        if dist['has_derict_sql']:
            sql = dist['sql']
        else:
            sql = "select " + dist['column'] + " from " + dist['table']
        lists = self.execute(sql)
        result = []
        for list in lists:
            result.append(list[dist['column']])
        return result

    def testPing(self):
        if self.listTables():
            return True
        else:
            return False

    def createTable(self, name, *cols):
        """
        新建数据表
        """
        metadata = MetaData()
        # print('name=',name)
        # print('*cols=',*cols)
        # print('cols=',cols)
        t = Table(name, metadata, *cols)
        metadata.create_all(self.engine)
        self.sql_relation.registerNewTable(name, t)
        return t
    def getMetaTable(self, name, *cols):
        metadata = MetaData()
        t = Table(name, metadata, *cols)
        return t

    def createColumn(self,name,type):
        return SqlObjReader().defColumn(name,type)

    def dropTable(self, name):
        """
        删除数据表
        """
        self.conn.drop_table(name)
        pass

    def execute(self, sql_obj):
        """
        执行sql对象
        """
        return self.conn.execute(sql_obj)


    def getType(self, type,dbtype):
        alltpye = COLUMN_TYPE[dbtype]
        if type in alltpye['INT']:
            return 'number'
        elif type in alltpye['BIGINT']:
            return 'number'
        elif type in alltpye['FLOAT']:
            return 'number'
        elif type in alltpye['VARCHAR']:
            return 'string'
        elif type in alltpye['TEXT']:
            return 'string'
        elif type in alltpye['DATE']:
            return 'date'
        elif type in alltpye['DATETIME']:
            return 'date'

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
            top = int(limit) + int(offset)
            return """ SELECT """ + '*' + """ FROM (SELECT rownum r,A.* FROM ( """+sql+""" ) A WHERE rownum <= """+str(top)+""") B WHERE r > """+str(offset)+"""  """
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
                select row_number()over(order by tempcolumn)""" + pagenationAddedColumn + """,*
                from (select top """ + str(top) + """ tempcolumn=0,* from ( """ + sql + """ ) a )t
                )tt
                where TEMPROWNUMBER>""" + str(offset) + """;
            """
        elif self.kind == 'oracle':
            top = int(limit) + int(offset)
            pagenationAddedColumn = 'r'
            pagenationSql = """ SELECT """ + '*' + """ FROM (SELECT rownum """ + pagenationAddedColumn + """,A.* FROM ( """+sql+""" ) A WHERE rownum <= """+str(top)+""") B WHERE r > """+str(offset)+"""  """

        #用pandas处理pagenationSql查询的结果集，处理掉因分页多出来的字段，返回结果集给调用方
        querySet = self.getData(pagenationSql)
        df = pd.DataFrame(querySet)#用pandas去掉分页产生的一列，用pandas转成字典格式
        if pagenationAddedColumn:
            df = df.drop(pagenationAddedColumn,axis=1)
        if isArrTp:
            dictSet = np.array(df).tolist()
        else:
            dictSet = df.to_dict(orient='records')
        return dictSet

    def serverPagination(self, limit, offset, sql):
        if self.kind == 'mysql':
            return sql['sql']+' '+ sql['order'] + ' limit ' + str(offset) + ', ' + str(limit)
        elif self.kind == 'pgsql':
            return sql['sql']+' '+ sql['order'] + ' limit ' + str(limit) + ' offset ' + str(offset)
        elif self.kind == 'mssql':
            top = int(limit) + int(offset)
            return """
                SELECT * FROM ( SELECT *, row = row_number () OVER (""" + sql['order'] + """)
                FROM  ("""+sql['sql']+""") a ) AS rowTable
                WHERE rowTable.row BETWEEN """+str(offset)+""" and """ + str(top) + """
            """
        elif self.kind == 'oracle':
            # 分页处需要明确select出来的字段不能包含分页产生的rownumber字段，所以需要得到getSqlColumnName
            # getSqlColumnName = """SELECT * FROM (SELECT rownum r,A.* FROM ( """ + sql['sql']+"""  """+ sql['order'] + """ ) A WHERE rownum <= """ + str(1) + """ ) B WHERE r > """ + str(0) + """ """
            # tb = self.execute(getSqlColumnName)
            # allSqlColumn = "*"
            # if tb._metadata.keys:
            #     keys = tb._metadata.keys[1:]
            #     keys = [x.lower() for x in keys]
            #     allSqlColumn = ','.join(keys)  # 去掉前面的那个r
            # print('allSqlColumn=', allSqlColumn)
            top = int(limit) + int(offset)
            #分页处需要明确select出来的字段不能包含分页产生的rownumber字段
            return """SELECT """ + '*' + """ FROM (SELECT rownum r,A.* FROM ( """ + sql['sql']+"""  """+ sql['order'] + """ ) A WHERE rownum <= """ + str(top) + """ ) B WHERE r > """ + str(offset) + """ """
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
                SELECT * FROM ( SELECT *, row = row_number () OVER (""" + sql['order'] + """) """ + pagenationAddedColumn + """
                FROM  ("""+sql['sql']+""") a ) AS rowTable
                WHERE rowTable.row BETWEEN """+str(offset)+""" and """ + str(top) + """
            """
        elif self.kind == 'oracle':
            top = int(limit) + int(offset)
            pagenationAddedColumn = 'TEMPROWNUMBER'
            #分页处需要明确select出来的字段不能包含分页产生的rownumber字段
            pagenationSql = """SELECT * FROM (SELECT rownum """ + pagenationAddedColumn + """,A.* FROM ( """ + sql['sql']+"""  """+ sql['order'] + """ ) A WHERE rownum <= """ + str(top) + """ ) B WHERE r > """ + str(offset) + """ """

        # 用pandas处理pagenationSql查询的结果集，处理掉因分页多出来的字段，返回结果集给调用方
        querySet = self.getData(pagenationSql)
        df = pd.DataFrame(querySet)  # 用pandas去掉分页产生的一列，用pandas转成字典格式
        if pagenationAddedColumn:
            df = df.drop(pagenationAddedColumn, axis=1)
        if isArrTp:
            dictSet = np.array(df).tolist()
        else:
            dictSet = df.to_dict(orient='records')
        return dictSet

    def getTotal(self, sql):
        sql = "select count(*) as total from (" + sql + ") a"
        tb = self.execute(sql)
        b = tb.fetchall()
        tbs = []
        for u in b:
            tbs.append(dict(zip(u.keys(), u.values())))
        return tbs[0]

    def getData(self, sql):
        tb = self.execute(sql)
        b = tb.fetchall()
        tbs = []
        for u in b:
            tbs.append(dict(zip(u.keys(), u.values())))
        return tbs

    def getDictDataBySessionConn(self, sql):
        tb = self.execute(sql)
        b = tb.fetchall()
        tbs = []
        for u in b:
            tbs.append(dict(zip(u.keys(), u.values())))
        return tbs

    def getKeyData(self, sql):
        tb = self.execute(sql)
        b = tb.fetchall()
        tbs = []
        keys = {}
        result = {}
        for u in b:
            tbs.append(u.values())
            keys = u.keys()
        result['list'] = tbs
        result['keys'] = keys
        return result

    #需要根据datajson来生成sql，注意拼接用户选择的字段，注意字典列的添加，注意自定义计算字段的添加。可以打印拼接的sql再考虑如何拼接
    def sqlBuild(self, data, sourcecolumns=None):
        mainTable = ''#保存主表
        relationSql = ''#保存除主表外的其他关联关系（主要是left join on）
        column = ''#所有select的字段
        mainTbSubquery = ' ' #主表的subquery
        for idx, item in enumerate(data):
            if idx == 0:
                mainTbSubquery,mainTable,column = self.columnBuildFromAll(item)
            else:
                sql = ''
                relation = item['relation']['relationtype']
                if relation and relation.lower().strip() != 'none':
                    tbSubquery, tableName, currColumn = self.columnBuildFromAll(item)
                    column = column + ',' + currColumn
                    tbSubquery = '(' + tbSubquery + ')' if tbSubquery and tbSubquery.strip() else ''#判断tbSubquery是否拼接成功，并外接括号
                    sql = relation + ' ' + tbSubquery + ' ' + tableName + ' on ' #拼接关联关系（注意子查询创建的表）
                    for relationrow in item['relation']['relationdetail']:
                        sql += ' ' + tableName + '.' + relationrow['mycolumn'] + relationrow['relationfunction'] +\
                               relationrow['target'] + '.' + relationrow['targetcolumn'] + ' and '
                    sql = sql[:-4] if sql.endswith('and ') else sql#注意去掉最后的and
                    relationSql = relationSql + ' ' + sql

        if sourcecolumns:#对sourcecolumns重新处理
            # 使用传入的dataJson里用户选择的字段来过滤sourcecolumns得到最终的字段
            sourcecolumns = self.getSourceColumnBySeleCol(sourcecolumns,data)#这里的data是dataJson
        # 拼接字典,在拼接字典的时候不能使用自定义sql
        try:
            if sourcecolumns:
                dictCols = self.getDictObjsFromSourceColumns(sourcecolumns)
                if dictCols:
                    dictColumns, dictRelationSql = self.renewTheTableStructure(dictCols)
                    column += dictColumns if column.rstrip().endswith(',') else (',' + dictColumns)# 字典字段添加进入columns
                    relationSql += dictRelationSql  # 把diction的关联加到relation里面
        except Exception as getDictSqlError:
            print('--error--getDictSqlError file:sqltool.py;method:sqlBuild;error=',getDictSqlError)

        if column == '' or column.strip() == '':
            column = '*'
        mainTbSubquery = '(' + mainTbSubquery + ')' if mainTbSubquery and mainTbSubquery.strip() else ''#需要判空,并外接括号
        mainsql = 'select ' + column + ' from ' + mainTbSubquery + ' ' + mainTable + ' ' + relationSql
        # print('----mainsql=',mainsql)

        if sourcecolumns:#这里的sourcecolumns应该是被用户选择的ifshow过滤后的值
            sourceExpression = []
            sourceFieldCols=[]#用于对比columnFelds
            for sourcecolumn in sourcecolumns :
                if '__' not in sourcecolumn['formatcolumn'] :
                    #如果是有字典配置的新增字段，则需要把原始字段作为as使用
                    if 'datadict' in sourcecolumn and sourcecolumn['datadict'] and sourcecolumn['datadict']['table'] and \
                            sourcecolumn['formatcolumn'] == '' :
                        format_column = sourcecolumn['field']
                    else :
                        format_column = sourcecolumn['formatcolumn']
                else:
                    format_column = sourcecolumn['formatcolumn']
                format_column = QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] + format_column + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA']
                formulas = sourcecolumn['formula']
                # 针对不同数据库做年月日处理
                if formulas == 'get_year' or formulas == 'get_month' or formulas == 'get_day':
                    format_column = splitDateCol(self.kind, formulas, format_column)
                # sourceExpression = sourceExpression + ', ' + format_column + ' as ' + sourcecolumn['field']
                sourceExpression.append(format_column + ' as ' + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] + sourcecolumn['field'] + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'])
                sourceFieldCols.append(QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] + sourcecolumn['field'].strip() + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'])
            # sourceExpression = sourceExpression.strip(',')
            # 修改的时候需要将column中新添加的字段加入sourceExpression里
            try:
                if column != '*' :
                    columnFelds = column.split(',')  # 注意as的大小写
                    columnFelds = [x.split(' as ')[1].strip() for x in columnFelds if x]
                    # 将生成的columnFelds多余部分添加到sourceExpression
                    if (len(columnFelds) != len(sourceFieldCols)):
                        sourceExpression.extend([x + ' as ' + x for x in set(columnFelds) - set(sourceFieldCols)])#集合的减法
                else :
                    sourceExpression = ['*'] #如果column等于*，那sourceExpression就只有一个元素为*，以便后续sql的拼接
            except Exception as err:
                print('general columnFelds error!!!,file:sqltool.py;method:sqlBuild;line:334;args=%s' % err.args)
                raise err
            # 添加结束
            mainsql = "select " + (','.join(sourceExpression)) + ' from  ( ' + mainsql + ' ) a '
        return mainsql

    #从sourcecolumns, dataJson里面选择需要的数据，sourcecolumns是根据id获取所有值，但需要用dataJson里用户选择的字段进行过滤
    def getSourceColumnBySeleCol(self, sourcecolumns, dataJson):
        # 从数据库里获取的sourcecolumns需要过滤，页面选择了某些字段也可能会去掉某些字段，sourcecolumns必须使用datajson中的ifshow来过滤后再使用
        selecteCols = []
        for itemObj in dataJson:  # 从所有的datajson中选择，
            if 'tbColumns' in itemObj and itemObj['tbColumns']:
                for item in itemObj['tbColumns']:  # 选择所有ifshow==1的选项
                    if item['ifshow'] == '1' and 'checked' in item and item['checked'] == '1':
                        selecteCols.append(item)
        if selecteCols:
            sourcecolumns = self.filterSourceColumnBySeleCol(sourcecolumns, selecteCols)
        return sourcecolumns

    # 过滤两个列表总的数据srcCols从数据库查询出来的数据，seleCols页面用户选择的字段
    def filterSourceColumnBySeleCol(self, srcCols, seleCols):
        newSrcCols = []
        for srcCol in srcCols :
            for seleCol in seleCols :
                if srcCol['field'].split("__")[0] == seleCol['table'] and \
                        srcCol['field'].split("__")[1] == seleCol['Field']:
                    newSrcCols.append(srcCol)
                    break;
        return newSrcCols

    #从sourcecolumns查找出字典类型的数据,如果有datadict属性且属性值不为空，则表示是字典字段
    def getDictObjsFromSourceColumns(self,sourcecolumns):
        dictObjs = []
        for srcCol in sourcecolumns :
            if 'datadict' in srcCol and srcCol['datadict']:
                dictObjs.append(srcCol)
        return dictObjs
    #如果有配置字典的字段，则重新建table结构
    def renewTheTableStructure(self,dictCols):
        relationSql = ''
        currColumn = ''
        for dictCol in dictCols :#对添加了字典的字段进行处理，需要把字典表关联到当前表上，并在columns添加字段
            if 'datadict' in dictCol and dictCol['datadict']:
                #先拼凑字典表的过滤，再将拼凑的字符串leftjoin到主表中
                dictTable = dictCol['datadict']['table']
                childSearchAsTable = dictTable + str(randint(1,100)) #防止使用同一张字典表两次
                if not dictTable or not dictTable.strip() :#如果表不存在或配置错误就跳过
                    continue
                dictTableAdditioin = ' select * from ' + dictTable + ' where 1=1 '
                if 'filter' in dictCol['datadict'] and dictCol['datadict']['filter'] :#添加过滤条件
                    for filterObj in dictCol['datadict']['filter'] :
                        dictTableAdditioin += ' and ' if not filterObj['link'] else filterObj['link'] + ' ' + filterObj['col'] + ' ' +filterObj['opera'] + ' \'' +filterObj['val'] + '\' '
                # print('--renewTheTableStructure-dictTableAdditioin=',dictTableAdditioin)
                relationSql += ' left join (' + dictTableAdditioin + ') as ' + childSearchAsTable #left join 字典表
                #拼凑left join 的on 关联条件
                relationMainTable = dictCol['datadict']['oldfield'].split('__')[0]
                relationMainCol = dictCol['datadict']['oldfield'].split('__')[1]
                relationSql += ' on ' + childSearchAsTable + '.' + dictCol['datadict']['keycol'] + ' = ' + \
                               relationMainTable + '.' + relationMainCol

                #拼接完成以后还要拼接一列字典查出来的value值追加到column里面
                currColumn += childSearchAsTable + '.' + dictCol['datadict']['valuecol'] + ' as ' + dictCol['field'] + ','
        currColumn = currColumn[:-1] if currColumn.endswith(',') else currColumn
        return currColumn,relationSql

    #从formulacolumn里获取字段
    def getTableAndColumn(self,tableName,formulaColumn):
        return tableName,formulaColumn.split(tableName+'__')[1]

    #和函数sqlbuild很相似
    def getRelation(self, data, sourceid=None):
        mainTable = ''
        relationSql = ''
        for idx, item in enumerate(data):
            if idx == 0:
                mainTbSubquery, mainTable, column = self.columnBuildFromAll(item)
            else:
                sql = ''
                relation = item['relation']['relationtype']
                if relation and relation.lower().strip() != 'none':
                    tbSubquery, tableName, currColumn = self.columnBuildFromAll(item)
                    column = column + ',' + currColumn
                    tbSubquery = '(' + tbSubquery + ')' if tbSubquery and tbSubquery.strip() else ''  # 判断tbSubquery是否拼接成功，并外接括号
                    sql = relation + ' ' + tbSubquery + ' ' + tableName + ' on '  # 拼接关联关系（注意子查询创建的表）
                    for relationrow in item['relation']['relationdetail']:
                        sql += ' ' + tableName + '.' + relationrow['mycolumn'] + relationrow['relationfunction'] + \
                               relationrow['target'] + '.' + relationrow['targetcolumn'] + ' and '
                    sql = sql[:-4] if sql.endswith('and ') else sql  # 注意去掉最后的and
                    relationSql = relationSql + ' ' + sql

        #拼接上字典的关联关系表，A left join b on a.bid=b.id left join c on b.cid = c.id
        dictAddedColumn = ''#字典拼接的列
        try:
            if sourceid :
                sourceObjs = sourcedetail.objects.filter(sourceid=sourceid)
                dictCols = []
                for srcObj in sourceObjs :
                    srcDict = {}#只需要存储datadict和field就行了，renewTheTableStructure里只需要使用这两项
                    srcDict['field'] = srcObj.table + '__' + srcObj.column
                    if srcObj.options :
                        optionsObj = srcObj.options
                        if type(optionsObj) == type('stringstringstring') :
                            optionsObj = json.loads(optionsObj.replace("'","\""))
                        if 'datadict' in optionsObj and optionsObj['datadict']:
                            srcDict['datadict'] = optionsObj['datadict']
                            dictCols.append(srcDict)#只有满足要求的srcDict才能append进入dictCols
                # print('---getRelation dictCols=', dictCols)
                if dictCols:
                    dictAddedColumn, dictRelationSql = self.renewTheTableStructure(dictCols)
                    # if column.rstrip().endswith(','):
                    #     column += dictColumns  # 添加进入columns
                    # else:
                    #     column += ',' + dictColumns  # 添加进入columns
                    relationSql += dictRelationSql  # 把diction的关联加到relation里面
                    dictAddedColumn = ',' + dictAddedColumn if dictAddedColumn else '' #如果有字典字段，前面就添加逗号并拼接进入最后的返回sql里
        except Exception as getDictSqlError:
            print('--error--getDictSqlError file:sqltool.py;method:sqlBuild;error=',getDictSqlError)

        mainTbSubquery = '(' + mainTbSubquery + ') ' if mainTbSubquery and mainTbSubquery.strip() else ''  # 需要判空,并外接括号
        return dictAddedColumn + ' from ' + mainTbSubquery + mainTable + ' ' + relationSql


    # def columnBuildFromAll(self,item):
    #     designSqlSplitCh = 'userdefinedsql'
    #     mainTable = item['item']
    #     splitCh = mainTable.split(designSqlSplitCh)#检查是否是自定义sql生成的第一张表
    #     tempTbNm=''
    #     groupbyStr = ''
    #     if len(splitCh) > 1:
    #         tempTbNm = 'userdefinedsql' + splitCh[1]
    #         mainTable = '(' + item['sql'] + ') ' + tempTbNm+' '
    #         columnsStr = self.getColumnBySql(item['sql'])
    #         column = ','.join([tempTbNm + '.' + x + ' as ' + tempTbNm + '__' + x for x in columnsStr if x not in ['TEMPROWNUMBER','tempcolumn']])
    #     else:
    #         column,groupbyStr = self.columnBuild(mainTable,item['tbColumns'])#这里的tbColumns来源于用户勾选的字段和设置的groupby、sum
    #
    #     return tempTbNm,mainTable,column,groupbyStr

    #根据item生成column、tableRealName以及子查询table（tableSubQeurySql）
    # def columnBuildFromAll(self, item):
    #     mainTableName = item['item']#主表名，也就是子查询的别名，关联时使用以及select时使用
    #     tableSubQeurySql = ' '
    #     splitCh = mainTableName.split("userdefinedsql")  # 检查是否是自定义sql生成的第一张表
    #     if len(splitCh) > 1:#拼接自定义sql的表名（子查询）
    #         tableSubQeurySql = item['sql']#用户写的sql就作为子查询
    #         columnsStr = self.getColumnBySql(item['sql'])
    #         column = ','.join([mainTableName + '.' + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] + x + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] +
    #                            ' as ' + QUOTA_FOR_DBSQL[self.kind]['AS_QUOTA'] + mainTableName + '__' + x + QUOTA_FOR_DBSQL[self.kind]['AS_QUOTA']
    #                            for x in columnsStr if x not in ['TEMPROWNUMBER', 'tempcolumn']])#这里的字段加了双引号，为了适应oracle的大小写字段名
    #     else:
    #         tbColumns = item['tbColumns'] if 'tbColumns' in item else {}
    #         column, tableSubQeurySql = self.columnAndSubQueryBuild(mainTableName, tbColumns)  # 这里的tbColumns来源于用户勾选的字段和设置的groupby、sum
    #     return tableSubQeurySql, mainTableName, column

    def columnBuildFromAll(self, item):
        mainTableName = item['item']  # 主表名，也就是子查询的别名，关联时使用以及select时使用
        tableSubQeurySql = ' '
        splitCh = mainTableName.split("userdefinedsql")  # 检查是否是自定义sql生成的第一张表
        if len(splitCh) > 1:  # 拼接自定义sql的表名（子查询）
            tableSubQeurySql = item['sql']  # 用户写的sql就作为子查询
            columnsStr = self.getColumnBySql(item['sql'])
            column = ''
            for columns in columnsStr:
                for col in columns:
                    if col != 'TEMPROWNUMBER' and col != 'tempcolumn':
                        column += mainTableName + '."' + col + '" as ' + mainTableName + '__' + col + ","
            column = column[:-1]
            print('columnaaaaa', column)
            # column = ','.join([mainTableName + '."' + x + '" as ' + mainTableName + '__' + x for x in columnsStr if
            #                    x not in ['TEMPROWNUMBER', 'tempcolumn']])  # 这里的字段加了双引号，为了适应oracle的大小写字段名
        else:
            tbColumns = item['tbColumns'] if 'tbColumns' in item else {}
            column, tableSubQeurySql = self.columnAndSubQueryBuild(mainTableName,
                                                                   tbColumns)  # 这里的tbColumns来源于用户勾选的字段和设置的groupby、sum
        return tableSubQeurySql, mainTableName, column

    def columnAndSubQueryBuild(self, mainTableName, tbColumns):#这个函数只有一个地方使用
        tbColFilterColumn = []#经过tbColumns过滤过的column,面对情况：用户在编辑当前元数据的时候把字段减少了或增加了然而页面上显示的时候字段还是以前的，没有更具用户的修改做出变化
        if tbColumns:#通过用户选择的字段来过滤column里的对象
            for colObj in tbColumns:
                if colObj['ifshow'] == '1' and 'checked' in colObj and colObj['checked'] == '1':#过滤掉ifshow为0的列,由于默认需要全部字段不选，故也需要过滤,自定义sql不会执行这些代码
                    tbColFilterColumn.append(colObj)
        subQuerySql = ' '#根据用户选择的字段拼接成子查询的table
        buildedColumns = []
        if tbColFilterColumn :
            subQuerySqlOtherColumns = []
            subQuerySqlGroupByColumns = []
            for columnObj in tbColFilterColumn:
                columnFormatName = mainTableName + "__" + columnObj['Field']
                if self.kind == 'oracle':
                    if len(columnFormatName) > 30:
                        columnFormatName = columnFormatName[0:30]
                if columnObj['operator'] != 'group by':#这里的column需要根据用户选择的groupby还是sum，来进行拼接
                    # tableAndColumn = columnObj['operator'] + '(' + mainTableName + '.' + columnObj['Field'] + ')'  #在关联表的那一层的select里不需要进行sum等函数计算，只需查询出来即可
                    subQuerySqlOtherColumns.append(columnObj['operator'] + '(' + columnObj['Field'] + ') as ' + columnObj['Field'])#非groupby的字段需要拼接到subQuerySql的select里
                else:
                    # tableAndColumn = mainTableName + '.' + columnObj['Field']
                    subQuerySqlOtherColumns.append(columnObj['Field'])#groupby的字段需要加入select里
                    subQuerySqlGroupByColumns.append(columnObj['Field'])#记录groupby的字段用于拼接subQuerySql的from table后面
                tableAndColumn = mainTableName + '.' + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] + columnObj['Field'] + \
                                 QUOTA_FOR_DBSQL[self.kind][
                                     'COL_QUOTA']  # 在关联表的那一层的select里不需要进行sum等函数计算，只需查询出来即可,这里字段加了双引号，为了适应oracle的大小写字段
                buildedColumns.append(
                    tableAndColumn + ' as ' + QUOTA_FOR_DBSQL[self.kind]['AS_QUOTA'] + columnFormatName +
                    QUOTA_FOR_DBSQL[self.kind]['AS_QUOTA'])
            if subQuerySqlOtherColumns:
                subQuerySql = ' select ' + ','.join(subQuerySqlOtherColumns) + ' from ' + mainTableName + (' group by ' + ','.join(subQuerySqlGroupByColumns)) if subQuerySqlGroupByColumns else ' '
        else :#确保旧版本的代码也能顺利运行
            columns = self.getColumnByTable(mainTableName)
            columnSql = Utils().databaseColumn(self.kind, mainTableName)
            for colObj in columns :
                columnField = colObj[columnSql['column']]
                columnFormatName = mainTableName + "__" + columnField #作为sql语句as后面的列名
                if self.kind == 'oracle':
                    if len(columnFormatName) > 30:
                        columnFormatName = columnFormatName[0:30]
                tableAndColumn = mainTableName + '.' + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] + columnField + QUOTA_FOR_DBSQL[self.kind]['COL_QUOTA'] #这里字段加了双引号，为了适应oracle的大小写字段
                buildedColumns.append(tableAndColumn + ' as ' + QUOTA_FOR_DBSQL[self.kind]['AS_QUOTA'] + columnFormatName + QUOTA_FOR_DBSQL[self.kind]['AS_QUOTA'])
        return ','.join(buildedColumns), subQuerySql


    # def columnBuild(self, table, tbColumns):#这个函数只有一个地方使用
    #     column = self.getColumnByTable(table)
    #     columnSql = Utils().databaseColumn(self.kind, table)
    #
    #     tbColFilterColumn = []#经过tbColumns过滤过的column,面对情况：用户在编辑当前元数据的时候把字段减少了或增加了然而页面上显示的时候字段还是以前的，没有更具用户的修改做出变化
    #     if tbColumns:#通过用户选择的字段来过滤column里的对象
    #         for colObj in tbColumns:
    #             if colObj['ifshow'] == '1':
    #                 for col in column:
    #                     if colObj['Field'] == col[columnSql['column']]:
    #                         col['operator'] = colObj['operator']#将operator这个属性值复制到col里，在后续的遍历中操作
    #                         tbColFilterColumn.append(col)
    #                         break;
    #
    #     result = ''
    #     groupbyStr = ''
    #     if tbColFilterColumn :
    #         for row in tbColFilterColumn:
    #             columnfield = row[columnSql['column']]
    #
    #             columnname = table + "__" + columnfield
    #             if self.kind == 'oracle':
    #                 if len(columnname) > 30:
    #                     columnname = columnname[0:30]
    #             if row['operator'] == 'group by':
    #                 groupbyStr += table + '.' + columnfield + ','
    #                 tableAndColumn = table + '.' + columnfield
    #             else:
    #                 if row['operator']:
    #                     tableAndColumn = row['operator'] + '(' + table + '.' + columnfield + ')'
    #                 else:
    #                     tableAndColumn = table + '.' + columnfield
    #             result = result + ',' + tableAndColumn + ' as ' + columnname
    #         result = result.strip(',')
    #         groupbyStr = groupbyStr.strip(',')
    #     else :#确保以前的代码也能顺利运行
    #         for row in column :
    #             columnfield = row[columnSql['column']]
    #
    #             columnname = table + "__" + columnfield
    #             if self.kind == 'oracle':
    #                 if len(columnname) > 30:
    #                     columnname = columnname[0:30]
    #             tableAndColumn = table + '.' + columnfield
    #             tablecolumnstr = ''
    #             if self.id != 'local':
    #                 tablecolumnstr = tableAndColumn
    #                 # try:
    #                 #     columndists = globaldist.objects.get(tablename=table, columnname=columnfield, databaseid=self.id)
    #                 #     dists = columndists.dist
    #                 #     dists = json.loads(dists.replace("'", "\""))
    #                 #     tablecolumnstr = """case """
    #                 #     if len(dists) >0 :
    #                 #         for dist in dists:
    #                 #             a = dist['key']
    #                 #             b = dist['value']
    #                 #             tablecolumnstr = tablecolumnstr + " when " + tableAndColumn+"= '"+a+"' then '"+ b + "'  "
    #                 #         tablecolumnstr = tablecolumnstr + " else  " + tableAndColumn + " end "
    #                 #     else:
    #                 #         tablecolumnstr = tableAndColumn
    #                 # except:
    #                 #     tablecolumnstr = tableAndColumn
    #                 #     pass
    #             else:
    #                 tablecolumnstr = tableAndColumn
    #             result = result + ',' + tablecolumnstr + ' as ' + columnname
    #         result = result.strip(',')
    #     return result,groupbyStr


    def getColumnBySql(self, sql):
        return self.getDataFromServerPaginationNoOrder(1, 0, sql)


    def getColumnByTable(self, table):
        table = table
        columnSql = Utils().databaseColumn(self.kind, table)
        result = self.execute(columnSql['sql'])
        b = result.fetchall()
        tbs = []
        for u in b:
            tbs.append(dict(zip(u.keys(), u.values())))
        a = tbs
        return tbs

    def buildTableStruct(self, data):
        try:
            fromolapadd = data['fromOlapAdd'] if 'fromOlapAdd' in data else ''
            if fromolapadd:
                rs = Database.objects.get_or_create(ip=data['ip'], database=data['db'], user_name=data['user'],
                                                    password=data['pwd'], database_type=data['kind'],
                                                    fromolapadd=fromolapadd)
            else:
                rs = Database.objects.get_or_create(ip=data['ip'], database=data['db'], user_name=data['user'],
                                                    password=data['pwd'], database_type=data['kind'])

            Columns.objects.filter(database_id=rs[0].pk).delete()
            Tables.objects.filter(database_id=rs[0].pk).delete()
            databasesetting = Utils().databaseColumn(data['kind'], '', data['db'])
            tables = []
            if "tablesql" in databasesetting:
                tablelists = self.execute(databasesetting['tablesql'])
                for tablerow in tablelists:
                    tables.append(Tables(database_id=rs[0].pk, tables=tablerow[databasesetting['columnTableField']]))
            else:
                tablelists = self.listTables()
                for table in tablelists:
                    tables.append(Tables(database_id=rs[0].pk, tables=table))

            Tables.objects.bulk_create(tables)
            databaseStruct = self.execute(databasesetting['columnDatabase'])
            columns = []
            if 'name' in databasesetting:
                name = databasesetting['name']
            else:
                name = databasesetting['columnField']
            for column in databaseStruct:
                if column[name] is None or column[name] == '':
                    columns.append(Columns(database_id=rs[0].pk, tables=column[databasesetting['columnTableField']],
                                           name=column[databasesetting['columnField']],
                                           columns=column[databasesetting['columnField']],
                                           type=column[databasesetting['columnFieldType']]))
                else:
                    columns.append(Columns(database_id=rs[0].pk, tables=column[databasesetting['columnTableField']],
                                           name=column[name], columns=column[databasesetting['columnField']],
                                           type=column[databasesetting['columnFieldType']]))
            Columns.objects.bulk_create(columns)
        except Exception as e:
            return False
        return rs[0].pk


        # def getColumnDetail(self, table, col, id):
        #     rows = Columns.objects.filter(tables=table, columns=col, database_id=id)
        #     row = rows[0]
        #     name = row.name
        #     type = row.type
        #     result = {}
        #     result['type'] = type
        #     if name is None or name == '':
        #         result['name'] = col
        #     else:
        #         result['name'] = name
        #     return result


class SqlRelation():
    rf = {}

    def cvtSelect(self, selects):
        '''
        转换sql语句中select后字段part
        '''
        sel_list = []
        for factor in selects:
            table = self.getTableObj(factor)
            _t, c_str, kind, cmd = factor.extract()
            if not table.c.has_key(c_str):
                msg = u'can''t recongnize column name of {0}'.format(c_str)
                raise Exception(msg)

            sel_obj = table.c.get(c_str)

            if 2 == int(kind):
                sel_obj = self.cvtTimeColumn(sel_obj, cmd)
            elif 0 == int(kind) and u'rgl' != cmd:
                f = self.cvtFunc(cmd)
                sel_obj = f(sel_obj)

            sel_list.append(sel_obj)

        return sel_list

    def cvtGroup(self, groups):
        '''
        转换sql语句中group by后字段part
        '''
        group_list = []
        for factor in groups:
            table = self.getTableObj(factor)
            c_str, kind_str, cmd_str = map(lambda x: factor.getProperty(x), \
                                           [Protocol.Attr, Protocol.Kind, Protocol.Cmd])
            if not table.c.has_key(c_str):
                raise Exception(u'can''t recongnize column name of {0}' \
                                .format(c_str))

            col_obj = table.c.get(c_str)

            if 2 == kind_str:
                # 如果是时间列，那么需要额外处理
                grp_obj = self.cvtTimeColumn(col_obj, cmd_str)
            else:
                grp_obj = col_obj

            group_list.append(grp_obj)

        if 0 < len(group_list):
            return tuple(group_list)
        else:
            return None

    def cvtOrderByPart(self):
        '''
        转换sql语句中order by后字段part
        '''
        pass

    def cvtJoin(self, joins):
        join_style = joins[u'style']

        # 连接至少需要2个表
        if len(joins[u'data']) < 2:
            return None

        for idx, j_unit in enumerate(joins[u'data']):
            t_str, c_str = j_unit.get(u'table'), j_unit.get(u'column')
            table = self.getTableObj(t_str)
            column = getattr(table.c, c_str)

            if 0 == idx:
                my_join = table
                prev_column = getattr(table.c, c_str)
            else:
                my_join = my_join.join(table, prev_column == column)

        return my_join

    def cvtTimeColumn(self, col_obj, time_str):
        if 'year' == time_str:
            tc = extract('year', col_obj)
        elif 'month' == time_str:
            tc = extract('month', col_obj)
        elif 'day' == time_str:
            tc = extract('day', col_obj)
        elif 'hour' == time_str:
            tc = extract('hour', col_obj)
        elif 'raw' == time_str:
            tc = col_obj
        elif 'max' == time_str or 'min' == time_str:
            f = self.cvtFunc(time_str)
            tc = f(col_obj)
        else:
            raise Exception('unknown time type')

        return tc

    def cvtFunc(self, func_str):
        if u'sum' == func_str:
            f = func.sum
        elif u'count' == func_str:
            f = func.count
        elif u'avg' == func_str:
            f = func.avg
        elif u'max' == func_str:
            f = func.max
        elif u'min' == func_str:
            f = func.min
        else:
            return False

        return f

    def getColumnObj(self, factor):
        """
        根据数据表名和列名获取列对象
        """
        table = self.getTableObj(factor)

        '''
        if not table:
            return None
        '''

        c_str = factor.getProperty(Protocol.Attr)

        if not table.c.has_key(c_str):
            msg = u'can''t recongnize column name of {0}'.format(c_str)
            raise Exception(msg)

        column = table.c.get(c_str)
        return column

    def getTableObj(self, factor):
        t_str = factor.extract()[0]

        '''
        if t_str not in self.rf.keys():
            self.reflectTables([t_str])
        '''

        return self.rf.get(t_str)

    def registerNewTable(self, name, table):
        """
        增加新表后，登记记录
        """
        # table_helper = new TableHelper()
        # setattr(table, 'helper', table_helper)
        self.rf[name] = table


class SqlObjReader():
    @classmethod
    def cvtType(cls, type):
        if "int" == type:
            return Integer
        elif "big_int" == type:
            return BigInteger
        elif "float" == type:
            return Float
        elif "str" == type:
            return TEXT()
        elif "small_char" == type:
            return TEXT()
        elif "mid_char" == type:
            return TEXT()
        elif "big_char" == type:
            return TEXT()
        elif "blob_char" == type:
            return TEXT()
        elif "huge_char" == type:
            return TEXT()
        elif "date" == type:
            return Date()
        elif "datetime" == type:
            return DateTime()

    @classmethod
    def defColumn(cls, name, type, **kwargs):
        """
        定义数据表的列
        """
        st_type = cls().cvtType(type)
        col = Column(name, st_type)
        return col

    @classmethod
    def isDateTime(cls, obj):
        type = obj.type
        if isinstance(type, types.DateTime):
            return True
        return False




        # @classmethod
        # def createOlapTable(cls, name, cols):
        #     metadata = MetaData()
        #     t = Table(name, metadata, *cols)
        #     metadata.create_all(self.engine)
        #     self.sql_relation.registerNewTable(name, t)
        #     return t

