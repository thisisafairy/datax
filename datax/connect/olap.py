from common.globalvariable import QUOTA_FOR_DBSQL
from connect.sqltool import *
from common.columntype import COLUMN_TYPE
import json
import pandas as pd
from api import utils
from django.db.models import Q
from connect import odbcsqltool
from common.constantcode import DBTypeCode


def startOlapById(id):
    row = olap.objects.get(id=id)
    columnsjson = row.columns
    filtersjson = row.filters
    table = row.table
    columns = json.loads(columnsjson.replace("'", "\""))
    filters = json.loads(filtersjson.replace("'", "\""))
    st = OlapClass().initClass(columns, filters, row.sourceid, table)
    return st


def CheckIsOnlyYear(pyear):  ##工具类，判断传入的值是否是数据类型为2018或'2018'格式
    if str(type(pyear)) == "<class 'int'>":
        if 1970 < pyear < 2999:
            return True
        else:
            return False
    elif str(type(pyear)) == "<class 'str'>":
        if len(pyear) == 4 and 1970 < int(pyear) < 2999:
            return True
        else:
            return False
    elif str(type(pyear)) == "<class 'float'>":
        if 1970 < pyear < 2999:
            return True
        else:
            return False
    return False


class OlapClass():
    table = None
    tablename = ''
    values = []
    columns = []
    filters = []
    sourceid = ''
    sourcetype = ''
    st = None
    remotest = None

    def initClass(self, columns, filters, id, table, expand={}, ifexpand='false'):
        self.columns = columns
        self.filters = filters
        self.sourceid = id
        sourcerow = source.objects.get(id=id)
        self.sourcerow = sourcerow
        self.sourcetype = self.getDatabaseType()#数据库类型
        self.tablename = table
        self.st = stRestoreLocal(DATAXEXTENSION_DB_TYPEVALUE)#olap的表和数据都在datax_extension库里
        self.expand = expand
        self.ifexpand = ifexpand
        return self

    def getMainSql(self):
        row = source.objects.get(id=self.sourceid)
        config = row.config
        config = json.loads(config.replace("'", "\""))
        sql = self.st.getRelation(config, self.sourceid)
        return sql

    def getDatabaseType(self):
        sourcerow = source.objects.get(id=self.sourceid)
        database = Database.objects.get(id=sourcerow.databaseid)
        databasetype = database.database_type
        return databasetype

    def buildSql(self):
        grouplist = []
        selectlist = []
        orderlist = []
        titlelist = []
        titlenamelist = []
        selectlist.append('sum(0) as rownumber')
        orderlist.append('rownumber asc')
        # 找出有年月日处理的列
        dateRows = sourcedetail.objects.filter(
            Q(column_formula='get_year') | Q(column_formula='get_month') | Q(column_formula='get_day'),
            sourceid=self.sourcerow.id)
        for c in self.columns:
            col = c['col']
            table = c['table']
            s = ''
            sourcedetailrow = sourcedetail.objects.get(sourceid=self.sourcerow.id, table=table, column=col)
            #从sourcedetail里判断，如果是字典的字段就不加入selectlist等里面，字典的字段在self.getMainSql()的getRelation进行了拼接
            if self.isDictColumn(sourcedetailrow.options) :
                #不拼接进selectedlist里面，但需要拼接进grouplist里面，不然会因为在select里面而不存在groupby里面引起报错
                function = c['function']
                if function == 'group' :
                    grouplist.append(s)
                continue

            formatcolumn = sourcedetailrow.formatcolumn
            # s = formatcolumn.replace('__', '.') if formatcolumn is not None else ''
            if '__' in formatcolumn:
                s = formatcolumn.split('__')[0] + '.' + QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA'] + formatcolumn.split('__')[1] + QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA']
            if self.sourcerow.custom == "0":
                m = table + '__' + col
            else:
                m = col
            s = splitDateCol(self.sourcetype, sourcedetailrow.column_formula, s)
            l = '1'
            oldm = m
            while m in titlelist:
                m = oldm + l
                l = int(l) + 1
            titlelist.append(m)
            # if 'olaptitle' in c and c['olaptitle'] != '':
            #     titlenamelist.append(c['olaptitle'])
            # else:
            #     titlenamelist.append('')
            if 'title' in c and c['title'] != '':
                titlenamelist.append(c['title'])
            else:
                titlenamelist.append('')
            function = c['function']
            order = c['order']
            if s == '':
                s = m
            if function == 'group':
                grouplist.append(s)
                selectlist.append(s + ' as ' + QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA'] + m + QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA'])
            else:
                selectlist.append(function + '(' + s + ') as ' + QUOTA_FOR_DBSQL[self.sourcetype]['AS_QUOTA'] + m + QUOTA_FOR_DBSQL[self.sourcetype]['AS_QUOTA'])
            if order != '':
                orderlist.append(QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA'] + m + QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA'] + ' ' + order)
        if len(self.filters) > 0:
            where = ' and '
        else:
            where = ''
        wherelength = 0
        for f in self.filters:
            groups = f['group']
            i = 0
            str = ''
            for group in groups:
                col = group['col']
                dateRowFlag = False
                sourceRow = ''
                columnFormula = ''
                # 匹配有年月日处理的类
                for dateRow in dateRows:
                    if dateRow.column == col:
                        dateRowFlag = True
                        sourceRow = dateRow.formatcolumn
                        columnFormula = dateRow.column_formula
                        break
                table = group['table']
                # 影响where条件的字段暂时注释掉带1的之前版本
                # 如果是新增字段，对新增字段进行特殊处理，用columnformula或者formatcolumn来作为where条件限制
                #1if re.findall(r'column\d+', col):
                    # 查找数据库，
                    #1sourcedetailrow = sourcedetail.objects.get(sourceid=self.sourcerow.id, table=table, column=col)
                    # findOperator=re.findall('[\+\-\*/]',sourcedetailrow.formatcolumn)
                    # if sourcedetailrow.column_formula and not findOperator:#只是正则表达式的新增字段
                    #     s=sourcedetailrow.column_formula
                    # else:#只是字段的加减乘除,如果同时有正则和加减则只是用加减
                    #     s=formatcolumn.replace('__', '.') if formatcolumn is not None else ''
                    #1s = formatcolumn.replace('__', '.') if formatcolumn is not None else ''
                # 特殊处理结束
                #1elif self.sourcerow.custom == "0":
                    #4s = table + '.' + col
                #1 else:
                #1     s = col
                s = table + '.' + QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA'] + col + QUOTA_FOR_DBSQL[self.sourcetype]['COL_QUOTA']
                if dateRowFlag:
                    s = splitDateCol(self.sourcetype, columnFormula, sourceRow.replace('__', '.'))
                if group['model'] == '!=' and group['value'] == '':
                    m = ' is not null '
                else:
                    if group['model'] == 'like' or group['model'] == 'not like':
                        m = group['model'] + " '%%" + group['value'] + "%%' "
                    elif group['model'] == 'left like':
                        m = " like '" + group['value'] + "%%' "
                    elif group['model'] == 'right like':
                        m = " like '%%" + group['value'] + "' "
                    else:
                        m = group['model'] + " '" + group['value'] + "' "
                str = str + s + ' ' + m
                if i < len(groups) - 1:
                    str = str + ' ' + group['linkas'] + ' '
                i = i + 1
            str = '(' + str + ')'
            if wherelength < len(self.filters) - 1:
                where = where + str + ' ' + group['linkas'] + ' '
            else:
                where = where + str
            wherelength = wherelength + 1
        if self.sourcerow.custom == "0":
            sql = self.getMainSql()#重新拼接sql
        else:
            sql = " from  (" + self.sourcerow.sql + ")  a "
        if len(orderlist) == 0:
            orderstr = ''
        else:
            orderstr = '  order by ' + ','.join(orderlist)
        if len(grouplist) == 0:
            groupstr = ''
        else:
            groupstr = ' group by  ' + ','.join(grouplist)
        sql = ' select ' + ','.join(selectlist) + sql + '  where 1=1  ' + where + groupstr #+orderstr
        result = {}
        result['sql'] = sql
        result['order'] = orderstr
        result['title'] = titlelist
        result['titlename'] = titlenamelist
        return result

    #根据当前sourcedetailObj的option字段判断次字段是否是字典关联出来的数据
    def isDictColumn(self,optionObj):
        try:
            if optionObj:
                if type(optionObj) == type('stringstringstring'):
                    optionObj = json.loads(optionObj.replace("'","\""))
                if 'datadict' in optionObj and optionObj['datadict'] and optionObj['datadict']['table']:
                    return True
        except Exception as error:
            print('--judge current sourcedetial options column error;error=',error)
        return False

    # 在task跑完以后运行，只针对新增字段，新增字段需要在task跑完以后重新运行sql,入参两个，第一个newversion，第二个deleteversion
    def afterTaskExcSql(self, columns, filters, olaptable):
        selectlist = []
        grouplist = []
        orderlist = []
        tbCols = []
        newFeildSts = False
        for c in columns:
            if 'newfiledstatus' in c and (c['newfiledstatus'] == 1 or c['newfiledstatus'] == '1'):  # 查看column里是否有新增字段，如果有就执行二次运行sql，如果没有就不执行
                print("c['newfiledstatus'],fullname=", c['fullname'])
                newFeildSts = True

            col = c['fullname']
            tbCols.append(col)  # 保存columns已有字段，用于区别同比环比等字段
            table = olaptable
            if c['function'] == 'group':
                grouplist.append('"' + col + '"')
                selectlist.append('"' + col + '"')
            else:
                selectlist.append(c['function'] + '("' + col + '") as "' + c['fullname'] + '"')
            if c['order']:
                orderlist.append('"' + c['fullname'] + '" ' + c['order'])
        selectlist.append(' now() as "add_time" ')
        selectlist.append(' {0} as "version" ')
        selectlist.append(" 'n' as \"extra_processing\" ")  # extra_processing设置默认值为n
        selectlist.append(" keyorder as \"keyorder\" ")
        # 获取同比环比等字段-代码块
        # tablestru = utils.getCreateTableStructure(olaptable, utils.DATAXEXTENSION_DB_CHAR)
        tablestru = utils.SqlUtils(dbType=DBTypeCode.EXTENSION_DB.value).getCreateTableStructure(olaptable)
        tbAllCols = []
        for tbstru in tablestru:  # 获取表所有字段，
            if tbstru['columnName'] not in ['add_time', 'version', 'extra_processing','keyorder']:
                tbAllCols.append(tbstru['columnName'])

        # 同比环比字段
        otherCol = [colobj for colobj in tbAllCols if colobj not in tbCols]
        # print('otherCol=',otherCol)
        for addmorecol in otherCol:  # 把同比环比字段用sum聚合，在select中使用
            selectlist.append(' sum("' + addmorecol + '")')
        # 拼接filter
        if len(filters) > 0:
            where = ' and '
        else:
            where = ''
        wherelength = 0
        for f in filters:
            groups = f['group']
            i = 0
            str = ''
            for group in groups:
                col = group['table'] + '__' + group['col']  # olap表的columnname
                if 'newfiledstatus' in group and group['newfiledstatus'] == 1:  # 如果是新增字段
                    if group['model'] == '!=' and group['value'] == '':
                        m = ' is not null '
                    else:
                        if group['model'] == 'like':
                            m = group['model'] + " '%%" + group['value'] + "%%' "
                        elif group['model'] == 'left like':
                            m = " like '" + group['value'] + "%%' "
                        elif group['model'] == 'right like':
                            m = " like '%%" + group['value'] + "' "
                        else:
                            m = group['model'] + " '" + group['value'] + "' "
                    str = str + '"' + col + '" ' + m
                    if i < len(groups) - 1:
                        str = str + ' ' + group['linkas'] + ' '
                i = i + 1
            if not str:  # 如果没有需要初始化为1=1
                str = ' 1=1 '
            str = '(' + str + ')'
            if wherelength < len(filters) - 1:
                where = where + str + ' and '
            else:
                where = where + str
            wherelength = wherelength + 1
        where += ' and "version"={1} '
        if len(orderlist) == 0:
            orderstr = ''
        else:
            orderstr = '  order by ' + ','.join(orderlist)
        if len(grouplist) == 0:
            groupstr = ''
        else:
            groupstr = ' group by  ' + ','.join(grouplist)
        sql = ' select ' + ','.join(
            selectlist) + ' from ' + olaptable + '  where 1=1  ' + where + groupstr  # + orderstr#暂时不要orderby字段
        return (sql, newFeildSts)

    def getType(self, type, alltpye):
        if type in alltpye['INT']:
            return Integer
        elif type in alltpye['BIGINT']:
            return BigInteger
        elif type in alltpye['FLOAT']:
            return Float
        elif type in alltpye['VARCHAR']:
            return VARCHAR()
        elif type in alltpye['TEXT']:
            return TEXT()
        elif type in alltpye['DATE']:
            return Date()
        elif type in alltpye['DATETIME']:
            return DateTime()
        elif type in alltpye['TIMESTAMP']:#timestamp
            return DateTime()

    def defOlapColumn(self):
        columnlist = []
        titlelist = []
        i = 1
        for c in self.columns:
            title = ''
            col = c['col']
            table = c['table']
            row = sourcedetail.objects.get(sourceid=self.sourceid, column__iexact=col, table__iexact=table)
            type = row.type
            if row.distconfig is None or row.distconfig == '[]':
                st_type = self.getType(type, COLUMN_TYPE[self.sourcetype])
            else:
                # st_type = VARCHAR(225)
                st_type = TEXT()
            if self.sourcerow.custom == "0":
                title = table + '__' + col
            else:
                title = col
            l = '1'
            oldtitle = title
            while title in titlelist:
                title = oldtitle + l
                l = int(l) + 1
            a = Column(title, st_type)
            titlelist.append(title)
            columnlist.append(a)
        columnlist = self.generalColumn(columnlist)
        if self.ifexpand == 'true':
            columnlist = self.expandColumn(columnlist)
        return columnlist

    def generalColumn(self, columns=[]):
        columns.append(Column('add_time', DateTime()))
        columns.append(Column('version', Integer))
        columns.append(Column('extra_processing', VARCHAR(2)))
        columns.append(Column('keyorder', Integer))
        return columns

    def expandColumn(self, columns=[]):
        i = 1
        value = self.expand['value']
        if isinstance(value, list):
            for row in value:
                columns.append(Column('tb' + str(i), Float))
                columns.append(Column('hb' + str(i), Float))
                # columns.append(Column('bl' + str(i), Float))
                # columns.append(Column('total' + str(i), Float))
                # columns.append(Column('quniandangyueleiji' + str(i), Float))
                # columns.append(Column('quota' + str(i), Float))
                columns.append(Column('tongbishuzhi' + str(i), Float))
                columns.append(Column('huanbishuzhi' + str(i), Float))
                i = i + 1
        return columns

    def saveOlap(self):
        columnlist = self.defOlapColumn()
        self.table = self.st.createTable(self.tablename, *tuple(columnlist))
        pass
        # try:
        #     self.insertValue()
        # except Exception as e:
        #     pass
        return True

    def getValue(self):
        sql = self.buildSql()
        # remotest = stRestoreBySourceId(self.sourceid)
        # results = remotest.getKeyData(sql['sql']+sql['order'])

        sourcerow = source.objects.get(id=self.sourceid)
        databaseid = sourcerow.databaseid
        session = utils.SqlUtils(DBTypeCode.CUSTOM_DB.value,dbId=databaseid)
        results = session.getDataAndKey(sql['sql']+sql['order'])
        session.closeConnect()

        return results

    def startInsert(self):
        columnlist = self.defOlapColumn()
        self.table = self.st.getMetaTable(self.tablename, *tuple(columnlist))
        return self.table

    def insertValue(self, ins):
        self.st.conn.execute(ins)

    def droptable(self, name):
        self.st.execute('drop table if EXISTS ' + name)

    def getValueTotal(self):
        sql = self.buildSql()
        remotest = stRestoreBySourceId(self.sourceid)
        total = remotest.getTotal(sql['sql'])
        return total['total']

    def saveDetail(self, id):
        sql = self.buildSql()
        titles = sql['title']
        titlenames = sql['titlename']
        i = 0
        for title in titles:
            a = titles[i]
            b = titlenames[i]
            olapcolumn.objects.get_or_create(olapid=id, column=a, title=b)
            i = i + 1
        if self.ifexpand == 'true':
            value = self.expand['value']
            if isinstance(value, list):
                s = 1
                for row in value:
                    rowtitle = titlenames[int(row)]
                    if rowtitle == '':
                        rowtitle = titles[int(row)]
                    olapcolumn.objects.get_or_create(olapid=id, column='tb' + str(s), title=rowtitle + '同比增长率')
                    olapcolumn.objects.get_or_create(olapid=id, column='hb' + str(s), title=rowtitle + '环比增长率')
                    # olapcolumn.objects.get_or_create(olapid=id, column='bl' + str(s), title=rowtitle + '比例')
                    # olapcolumn.objects.get_or_create(olapid=id, column='total' + str(s), title=rowtitle + '年累计')
                    # olapcolumn.objects.get_or_create(olapid=id, column='quniandangyueleiji' + str(s),
                    #                                  title=rowtitle + '去年当月累计')
                    # olapcolumn.objects.get_or_create(olapid=id, column='quota' + str(s), title=rowtitle + '预期指标')
                    olapcolumn.objects.get_or_create(olapid=id, column='tongbishuzhi' + str(s),
                                                     title=rowtitle + '同比数值')  # tongbishuzhi,去年当月
                    olapcolumn.objects.get_or_create(olapid=id, column='huanbishuzhi' + str(s), title=rowtitle + '环比数值')
                    s = s + 1

    def resolveDate(self, str):
        ary = str.split('-')
        return {
            "tb_month": ary[0],
            "tb_year": ary[1],
            "hb_month": ary[2],
            "hb_year": ary[3]
        }

    def collectDate(self, months, years):
        if months == 1:
            tagHbMonth = 12
            tagHbyear = years - 1
        else:
            tagHbMonth = months - 1
            tagHbyear = years
        return str(months) + '-' + str(years - 1) + '-' + str(tagHbMonth) + '-' + str(tagHbyear)

    def hbmonth(self, months):
        if months == 1 or months == '1':
            return 12
        else:
            return months - 1

    def hbyear(self, months, years):
        if months == 1 or months == '1':
            return years - 1
        else:
            return years

    def collectDate(self, months, years):

        if months == 1:
            tagHbMonth = 12
            tagHbyear = years - 1
        else:
            tagHbMonth = months - 1
            tagHbyear = years

        return str(months) + '-' + str(years - 1) + '-' + str(tagHbMonth) + '-' + str(tagHbyear)

    def yeartotal(self, x, valueField, year, column):
        sd = self.df[self.df[year] == x[year]]

        # 由于在刚进入doExpand的时候就进行了日期转换拼接，这里不再需要转换日期了
        # sd=None;#定义变量
        # onlyyear=x[year]
        # if str(type(x[year]))=="<class 'datetime.datetime'>":    #值的数据类似于2018-01-01 12:12:12.123456这种
        #     # sd = self.df[self.df[year].year == onlyyear]
        #     sd=self.df[pd.to_datetime(self.df[year]).dt.year == x[year].year]
        # elif CheckIsOnlyYear(x[year]):    #值的数据类似于2018这种
        #     sd = self.df[self.df[year] == x[year]]
        # else:
        #     return 0       #如果日期格式不正确就返回0

        for row in column:
            sd = sd[sd[row] == x[row]]

        sum = sd[valueField].sum()
        return sum

    def suanbl(self, x, valueField, i):
        if x[valueField] is None:
            return 0
        if x['year_totle' + str(i)] == 0 or x['year_totle' + str(i)] == '0':
            return 0
        else:
            # ss = x[valueField] / x['year_totle' + str(i)]
            ss = x['year_totle' + str(i)] / x['quota' + str(i)]
            return float('%.2f' % ss)

    # def suanhb(self, x, valueField, i, month, year, column):
    #     if x[valueField] is None:
    #         return 0
    #     date_collect = self.resolveDate(x['date_collect'])
    #     if 'nan' in date_collect.values():
    #         return 0
    #     # 算月份
    #     sd = self.df[self.df[month] == int(float(date_collect['hb_month']))]
    #     # 算年份
    #     if sd.empty:
    #         return 0
    #     sd = sd[sd[year] == int(float(date_collect['hb_year']))]
    #
    #     if sd.empty:
    #         return 0
    #     # 算其他字段
    #     for row in column:
    #         sd = sd[sd[row] == x[row]]
    #     if sd.empty:
    #         return 0
    #     hbsum = sd[valueField].sum()
    #     if hbsum == 0:
    #         return 0
    #     tb = (x[valueField] - hbsum) / hbsum
    #     return float('%.2f' % tb)
    def suanhb(self, x, valueField, i, month, year, column):
        if x[valueField] is None:
            return 0
        date_collect = self.resolveDate(x['date_collect'])
        if 'nan' in date_collect.values():
            return 0
        # 算年份
        # sd = self.df[self.df[month] == int(float(date_collect['hb_month']))]
        sd = self.df[self.df[year] == int(float(date_collect['hb_year']))]
        # 算月份
        if sd.empty:
            return 0
        # sd = sd[sd[year] == int(float(date_collect['hb_year']))]
        sd = sd[sd[month] == int(float(date_collect['hb_month']))]

        if sd.empty:
            return 0
        # 算其他字段
        for row in column:
            sd = sd[sd[row] == x[row]]
        if sd.empty:
            return 0
        hbsum = sd[valueField].sum()
        if hbsum == 0:
            return 0
        hb = (x[valueField] - hbsum) / hbsum
        return hbsum,float('%.2f' % hb)

    # def suantb(self, x, valueField, i, month, year, column):
    #     if x[valueField] is None:
    #         return 0
    #     # if x['PR_Contract__DeptName'] == '设计一所' and x[month] == 1 and x[year] == 2018:
    #     #     a = 1
    #     date_collect = self.resolveDate(x['date_collect'])
    #     if 'nan' in date_collect.values():
    #         return 0
    #     # 算月份
    #     sd = self.df[self.df[month] == int(float(date_collect['tb_month']))]
    #     # 算年份
    #     if sd.empty:
    #         return 0
    #     sd = sd[sd[year] == int(float(date_collect['tb_year']))]
    #
    #     if sd.empty:
    #         return 0
    #     # 算其他字段
    #     for row in column:
    #         sd = sd[sd[row] == x[row]]
    #     if sd.empty:
    #         return 0
    #     lastyearsum = sd[valueField].sum()
    #     if lastyearsum == 0:
    #         return 0
    #     tb = (x[valueField] - lastyearsum) / lastyearsum
    #     return float('%.2f' % tb)
    def suantbhb(self, x, valueField, i, month, year, column):    #返回当前值的同比数值和同比比率，两个值一起返回不用再重复计算，提高效率
        if x[valueField] is None:
            return 0,0,0,0

        date_collect = self.resolveDate(x['date_collect'])
        if 'nan' in date_collect.values():
            return 0,0,0,0
        # 算月份
        sdtb = self.df[self.df[month] == int(float(date_collect['tb_month']))]
        sdhb = self.df[self.df[month] == int(float(date_collect['hb_month']))]

        tb_v=0  #同比数值
        tb_r=0  #同比比率
        hb_v = 0  # 环比数值
        hb_r = 0  # 环比比率
        if not sdtb.empty:
            sdtb = sdtb[sdtb[year] == int(float(date_collect['tb_year']))]
            for row in column:#计算其他非年月字段，找到和当前数据相同(除了年月不同外)的唯一一条
                sdtb = sdtb[sdtb[row] == x[row]]
            if not sdtb.empty:
                tb_v = sdtb[valueField].sum()
                if tb_v !=0:
                    tb_r = (x[valueField] - tb_v) / tb_v
                    tb_r=float('%.2f' % tb_r)

        if not sdhb.empty:
            sdhb = sdhb[sdhb[year] == int(float(date_collect['hb_year']))]
            for row in column:#计算其他非年月字段，找到和当前数据相同(除了年月不同外)的唯一一条
                sdhb = sdhb[sdhb[row] == x[row]]
            if not sdhb.empty:
                hb_v = sdhb[valueField].sum()
                if hb_v != 0:
                    hb_r = (x[valueField] - hb_v) / hb_v
                    hb_r=float('%.2f' % hb_r)
        return tb_v,tb_r,hb_v,hb_r


    def suantotal(self, x, valueField, i, month, year, column):
        if x[valueField] is None:
            return 0
        # 算年份
        sd = self.df[self.df[year] == x[year]]
        if sd.empty:
            return 0
        # 算月份
        sd = sd[sd[month] <= x[month]]

        if sd.empty:
            return 0
        # 算其他字段
        for row in column:
            sd = sd[sd[row] == x[row]]
        if sd.empty:
            return 0
        # 求和
        lastyearsum = sd[valueField].sum()

        return float('%.2f' % lastyearsum)

    # 算去年累计
    def suanquniandangyueleiji(self, x, valueField, i, month, year, column):
        if x[valueField] is None:
            return 0
        # 算年份，上一年就减一，月份还是从一月到当前月
        date_collect = self.resolveDate(x['date_collect'])
        if 'nan' in date_collect.values():
            return 0
        sd = self.df[self.df[year] == float(date_collect['tb_year'])]  ##需要取上一年的年份
        if sd.empty:
            return 0
        # 算月份
        sd = sd[sd[month] <= x[month]]
        if sd.empty:
            return 0

        # for row in column:
        #     sd = sd[sd[row] == x[row]]
        # if sd.empty:
        #     return 0

        # 求和,去年当月累计
        premthyrtotal = sd[valueField].sum()

        return float('%.2f' % premthyrtotal)

    # 算去年当月的值，根据传入的年和月取去年当月的值
    def suantongbishuzhi(self, x, valueField, i, month, year, column):
        if x[valueField] is None:
            return 0
        # 取每一条数据的date_collect字段的值，这是一个值为类似04-17-03-18的数据
        date_collect = self.resolveDate(x['date_collect'])
        if 'nan' in date_collect.values():
            return 0
        print('==self.df[year]==',self.df[year].tail())
        print('==self.df[year].dtype==',self.df[year].dtype)
        print("====int(float(date_collect['tb_year']))=====",int(float(date_collect['tb_year'])))

        sd = self.df[self.df[year] == int(float(date_collect['tb_year']))]  ##需要取上一年
        if sd.empty:  # 如果当前值的上一年在df里不存在，则返回0，
            return 0

        print('==sd[month]==', sd[month].tail())
        print('==sd[month].dtype==', sd[month].dtype)
        print("====int(float(date_collect['tb_month']))=====",int(float(date_collect['tb_month'])))
        sd = sd[sd[month] == int(float(date_collect['tb_month']))]  ##对结果再过滤，取所有当前月

        ##对所有当前月的值求和
        premthyrvalue = sd[valueField].sum()

        return premthyrvalue

    # 算前一个月的值，根据传入的年和月取去年当月的值
    def suanhuanbishuzhi(self, x, valueField, i, month, year, column):
        if x[valueField] is None:
            return 0
        # 取每一条数据的date_collect字段的值，这是一个值为类似04-17-03-18的数据
        date_collect = self.resolveDate(x['date_collect'])
        if 'nan' in date_collect.values():
            return 0

        sd = self.df[self.df[year] == int(float(date_collect['hb_year']))]  ##需要取当年
        if sd.empty:  # 如果当前值的当年在df里不存在，则返回0，
            return 0
        sd = sd[sd[month] == int(float(date_collect['hb_month']))]  ##对结果再过滤，取所有前一个月

        ##对所有前一个月的值求和
        premthyrvalue = sd[valueField].sum()

        return premthyrvalue

    # 根据年来修改quotavlaue，如果没有匹配上年，就返回以前的值(可能是1也可能是更新过的值)
    def quotaGeneral(self, x, valueField, year, quotacolumn, qyear, qvalue):
        if x[valueField] is None:
            return 1

        if x[year] == int(qyear):
            return qvalue
            # x[quotacolumn] = qvalue
        return x[quotacolumn]

    # 根据时间字段取相应的值，例如从2018-01-01 12:12:12获取年份2018或月份01,如果没有匹配上则返回0
    def timeColumnFormat(self, x, columnname, type):
        if not x[columnname]:
            return 0
        if type == 'year':
            return x[columnname].year
        elif type == 'month':
            return x[columnname].month
        else:
            return 0


    # 补全一年中缺失的月
    # year: 年份的列名
    # month: 月份的列名
    # cols: 列名集合
    # calcCols: 需要计算同环比相关数值的列
    def fixMissMonth(self, year, month, cols, calcCols):
        arr = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        # 按年分组
        grouped = self.df.groupby(year)

        # 总条数
        total = self.df.shape[0]

        # 遍历每个年里面的所有数据
        for groupedYear, group in grouped:
            # 当前年终缺失的月份
            missMonths = []
            # 当前年中拥有的月份
            monthArr = []
            # 取出所有的月份
            for mo in group[month]:
                monthArr.append(str(mo))
            # 取出缺失的月
            for mo2 in arr:
                if mo2 not in monthArr and mo2 is not None:
                    missMonths.append(int(mo2))
            # 补全缺失的月的数据
            for missMonth in missMonths:
                total = total + 1
                obj = {year: int(groupedYear), month: missMonth}
                # 需要计算同环比相关数值的列的值设置为0
                for calcCol in calcCols:
                    obj[calcCol] = 0
                # 补上年和月,数值类型为0,其它设为none,进入pandas后none会变为nan
                for col in cols:
                    colType = self.df[col].dtype
                    if col != year and col != month and col not in calcCols:
                        if colType == 'float64':
                            obj[col] = 0.0
                        elif colType == 'int64':
                            obj[col] = 0
                        else:
                            obj[col] = None
                self.df.loc[total] = obj


    # 只有年份，没有月份的特殊情况下计算同比
    # year: 年份的列名
    # cols: 列名集合
    # calcCols: 需要计算同环比相关数值的列
    def calcYearTB(self, year, cols, calcCols):
        #按年分组
        grouped = self.df.groupby(year)
        # 各年份及列汇总
        yearColSums = []
        # 按年分组
        for groupedYear, group in grouped:
            yearColSum = {}
            yearColSum[year] = groupedYear
            count = 1
            # 根据要计算的指标数量增加对应的列
            for calcCol in calcCols:
                # 年总和
                sumValue = ((group[[calcCol]].sum()).values)[0]
                if sumValue == 'nan' or sumValue == 'None' or sumValue is None:
                    sumValue = 0
                yearColSum[calcCol] = sumValue
                yearColSum['tb' + str(count)] = 0
                yearColSum['tongbishuzhi' + str(count)] = 0
                count = count + 1
            yearColSums.append(yearColSum)
        self.yearTB(year, yearColSums, calcCols)


    def yearTB(self, year, yearColSums, calcCols):
        # 算出各个计算字段的年同环比
        for yearColObj in yearColSums:
            for yearColObj2 in yearColSums:
                if yearColObj[year] == (yearColObj2[year] + 1):
                    count = 1
                    for calcCol in calcCols:
                        if yearColObj2[calcCol] == 0:
                            yearColObj['tb' + str(count)] = yearColObj[calcCol]
                        else:
                            yearColObj['tb' + str(count)] = (yearColObj[calcCol] - yearColObj2[calcCol])/yearColObj2[calcCol]
                        yearColObj['tongbishuzhi' + str(count)] = yearColObj2[calcCol]
                        count = count + 1
        dicts = self.df.to_dict(orient='records')
        for row in dicts:
            for yearObj in yearColSums:
                if row[year] == yearObj[year]:
                    count = 1
                    for calcCol in calcCols:
                        row['tb' + str(count)] = yearObj['tb' + str(count)]
                        row['tongbishuzhi' + str(count)] = yearObj['tongbishuzhi' + str(count)]
                for calcCol in calcCols:
                    if calcCol in list(yearObj.keys()):
                        yearObj.pop(calcCol)
        df = pd.DataFrame(yearColSums)
        self.df = pd.merge(self.df, df, on=year, how='left')

        ##doExpand目前只需要计算同比数值，环比数值，其他的都被注释，update by lc 20180806
    def doExpand(self, list):
        print('====================doExpand function===============================',datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        self.df = pd.DataFrame(list['list'], columns=list['keys'])
        onlyCalcYear = False
        if self.ifexpand == 'false':
            return self.df.to_dict(orient='records')
        if self.expand['month'] == '':
            if 'year' in self.expand and self.expand['year'] != '' and len(self.expand['value']) != 0:
                onlyCalcYear = True
            else:
                return self.df.to_dict(orient='records')
        if self.expand['year'] == '':
            return self.df.to_dict(orient='records')
        if len(self.expand['value']) == 0:
            return self.df.to_dict(orient='records')

        # value = [elm['fullname'] for elm in self.columns if elm['function'] != 'group']
        value = []
        for v in self.expand['value']:  ##修改从expand里取脚标
            if isinstance(v, str):
                v = int(v)
            value.append(self.columns[v]['fullname'])

        origyear = self.columns[int(self.expand['year'])]['fullname']

        ##如果用户传入的year和month是一个时间字段，需要多拼接两个字段来保存year和month
        inputYearDataType = self.df[origyear].dtype

        year = ''
        month = ''
        if inputYearDataType == 'float64' or inputYearDataType == 'int64':  # 年字段数据格式为2018或2018.0
            year = origyear
        else:  # 年字段数据格式为2018-01-01 12:12:12.123456,需要把当前传入的日期字段转成对应的2018格式并追加到df中
            year = 'myCalculateYear'
            self.df[year] = self.df.apply(lambda x: self.timeColumnFormat(x, origyear, 'year'), axis=1)
        print('========get year=============',datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        # 只有年份，没有月份的特殊情况
        if onlyCalcYear:
            self.calcYearTB(year, list['keys'], value)
            return self.df.to_dict(orient='records')
        origmonth = self.columns[int(self.expand['month'])]['fullname']
        inputMonthDataType = self.df[origmonth].dtype
        if inputMonthDataType == 'float64' or inputMonthDataType == 'int64':  # 和月份一样
            month = origmonth
        else:
            month = 'myCalculateMonth'
            self.df[month] = self.df.apply(lambda x: self.timeColumnFormat(x, origmonth, 'month'), axis=1)
        print('========get year=============',datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        # 补全没有的月的数据

        self.fixMissMonth(year, month, list['keys'], value)
        print('========fixMissMonth=============', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

        # get the quota data
        # quota = self.expand['quota']
        # for q in quota:  ##把quota的column转换成fullname
        #     clm = q['column']
        #     if clm != "":
        #         if isinstance(clm, str):
        #             clm = int(clm)
        #         q['column'] = self.columns[clm]['fullname']

        # print("****quota*****")
        # print(quota)
        # for tp in quota:
        #     print(tp['year'])
        #     print(tp['quotavalue'])
        #     print(tp['column'])
        # print("*******end quota******")
        # print(self.df)

        column = [elm['fullname'] for elm in self.columns if
                  elm['fullname'] != month and elm['function'] == 'group' and elm['fullname'] != year]

        self.df['date_collect'] = self.df.apply(lambda x: self.collectDate(x[month], x[year]), axis=1)
        print('========collectDate=============', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        print('===column===',column)
        i = 1
        for valuerow in value:
            # insert quota
            qyear = '0'
            qvalue = '1'  # 算比例的时候qvalue要作被除数，必须为1
            ##防止没有遍历quota而报错的情况，没有遍历quota就把所有的置1
            # 如果没有quota就把所有的quota置为1
            # self.df['quota' + str(i)] = self.df[year].apply(
            #     lambda x: 1)
            # for q in quota:
            #     if valuerow == q['column']:  # 根据用户输入查找对应的值,考虑同一指标不同年份的预期quota，所以需要遍历quota
            #         qyear = q['year']
            #         qvalue = q['quotavalue']
            #         self.df['quota' + str(i)] = self.df.apply(  # 过滤年，给年对应的指标值
            #             lambda x: self.quotaGeneral(x, valuerow, year, 'quota' + str(i), qyear, qvalue),
            #             axis=1)  # 如果有值就修改，没有就用原来的值

            # self.df['year_totle' + str(i)] = self.df.apply(lambda x: self.yeartotal(x, valuerow, year, column), axis=1)
            # self.df['bl' + str(i)] = self.df.apply(lambda x: self.suanbl(x, valuerow, i), axis=1)
            # self.df['tb' + str(i)] = self.df.apply(lambda x: self.suantb(x, valuerow, i, month, year, column), axis=1)
            # self.df['hb' + str(i)] = self.df.apply(lambda x: self.suanhb(x, valuerow, i, month, year, column), axis=1)
            # self.df['total' + str(i)] = self.df.apply(lambda x: self.suantotal(x, valuerow, i, month, year, column),axis=1)
            ##month of  the previous year total
            # self.df['quniandangyueleiji' + str(i)] = self.df.apply(
            #     lambda x: self.suanquniandangyueleiji(x, valuerow, i, month, year, column), axis=1)
            # 去年当月值，这个字段只是根据年份和月份去取去年当月的值并作为自己当前的值
            # self.df['tongbishuzhi' + str(i)] = self.df.apply(
            #     lambda x: self.suantongbishuzhi(x, valuerow, i, month, year, column), axis=1)

            # self.df['tongbishuzhi' + str(i),'tb' + str(i)] = self.df.apply(
            #     lambda x: self.suantb(x, valuerow, i, month, year, column), axis=1)
            # print('========suantongbishuzhi=============', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

            # 环比数值，年份相同，月份为上一个月
            # self.df['huanbishuzhi' + str(i)] = self.df.apply(
            #     lambda x: self.suanhuanbishuzhi(x, valuerow, i, month, year, column), axis=1)
            # self.df['huanbishuzhi' + str(i),'hb' + str(i)] = self.df.apply(
            #     lambda x: self.suanhb(x, valuerow, i, month, year, column), axis=1)
            # print('========suanhuanbishuzhi=============', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            print('==%s======start suantbhb=============%s' %(i, datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
            # newColsDf['tongbishuzhi' + str(i), 'tb' + str(i),'huanbishuzhi' + str(i), 'hb' + str(i)] = self.df.apply(
            #     lambda x: self.suantbhb(x, valuerow, i, month, year, column), axis=1)
            newColsDf=[]
            for index,row in self.df.iterrows():
                newColsDf.append(self.suantbhb(row, valuerow, i, month, year, column))
            newColsDf=pd.DataFrame(newColsDf,columns=['tongbishuzhi' + str(i), 'tb' + str(i),'huanbishuzhi' + str(i), 'hb' + str(i)])
            print('==newColsDf[-5:]==',newColsDf[-5:])
            self.df=pd.concat([self.df,newColsDf])
            print('==%s======end suantbhb=============%s' %(i, datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
            print('===df.columns===',self.df.columns)

            i = i + 1

        return self.df.to_dict(orient='records')

    #如果拼凑数就返回插入数据的sql，否则返回''，在调用函数的地方需要判断是否为空再执行插入
    def doExpandRsSQL(self,tablename,columnslists,listsObj,version, sourceid, isColConversion):
        print('====================doExpand function===============================',datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        self.df = pd.DataFrame(listsObj['list'], columns=listsObj['keys'])
        onlyCalcYear = False
        if self.ifexpand == 'false':
            return 0,self.df.to_dict(orient='records')
        if self.expand['month'] == '':
            if 'year' in self.expand and self.expand['year'] != '' and len(self.expand['value']) != 0:
                onlyCalcYear = True
            else:
                return 0,self.df.to_dict(orient='records')
        if self.expand['year'] == '':
            return 0,self.df.to_dict(orient='records')
        if len(self.expand['value']) == 0:
            return 0,self.df.to_dict(orient='records')

        value = []
        for v in self.expand['value']:  ##从expand里取脚标
            if isinstance(v, str):
                v = int(v)
            value.append(self.columns[v]['fullname'])

        origyear = self.columns[int(self.expand['year'])]['fullname']

        ##如果用户传入的year和month是一个时间字段，需要多拼接两个字段来保存year和month
        inputYearDataType = self.df[origyear].dtype

        year = ''
        month = ''
        if inputYearDataType == 'float64' or inputYearDataType == 'int64':  # 年字段数据格式为2018或2018.0
            year = origyear
        else:  # 年字段数据格式为2018-01-01 12:12:12.123456,需要把当前传入的日期字段转成对应的2018格式并追加到df中
            year = 'myCalculateYear'
            self.df[year] = self.df.apply(lambda x: self.timeColumnFormat(x, origyear, 'year'), axis=1)
        # 只有年份，没有月份的特殊情况
        if onlyCalcYear:
            # self.calcYearTB(year, list['keys'], value)
            return 0,self.df.to_dict(orient='records')

        origmonth = self.columns[int(self.expand['month'])]['fullname']
        inputMonthDataType = self.df[origmonth].dtype
        if inputMonthDataType == 'float64' or inputMonthDataType == 'int64':  # 和月份一样
            month = origmonth
        else:
            month = 'myCalculateMonth'
            self.df[month] = self.df.apply(lambda x: self.timeColumnFormat(x, origmonth, 'month'), axis=1)
        # 补全没有的月的数据
        # self.fixMissMonth(year, month, listsObj['keys'], value)

        #查找哪些是维度字段(去除year，month)，在df里对其进行groupby，
        dimensionCols = [elm['fullname'] for elm in self.columns if
                  elm['fullname'] != month and elm['function'] == 'group' and elm['fullname'] != year]
        #空值填充，如果是字符字段填充#，如果是数值字段填充0，不填充空值会导致groupby数据会减少
        for dimCol in dimensionCols:
            self.df[dimCol]=self.df[dimCol].fillna('Null')  #这会导致dtype改变，如果数值类型的列填充了Null，dtype就变为dtype('O')

        self.df['add_time']=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')     #将这几列固定数据加入pandas
        self.df['version']=version
        self.df['extra_processing']='n'
        self.df['keyorder'] = range(len(self.df))#自增值用于排序，一下有groupby，但即便是groupby后的值还是有序号的（序号可能不连续）

        groupedDF=self.df.groupby(dimensionCols)    #按维度字段分组
        columnsName = self.df.columns.values.tolist()   #字段名，作为sql插入的字段名
        popNames=['rownumber','myCalculateYear','myCalculateMonth']
        columnsName = [colName for colName in columnsName if colName not in popNames]   #不需要的字段需要去除

        allInsertValues = []
        print('=====3cols added. start iter df======', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        nullDict={'Null':1,'None':1,'Nan':1,'':1}#对dataframe里遍历的每个独立值做空值检测，dict比list的in要快很多

        for name,grouped in groupedDF:      #对分组字段遍历，在每个块内遍历
            for groupIndex in grouped.index.values:#对块内的每行遍历
                singleValue=[]
                for colNM in columnsName:#不参与计算的字段
                    everyValue=grouped.loc[groupIndex, colNM]
                    if everyValue in nullDict:
                        singleValue.append('Null')
                    else:
                        singleValue.append(everyValue)  #将一行数据保存进singleValue
                #计算同比环比字段，上面把基础字段加入完成以后，后面追加四列tb,tbshuzhi,hb,hbshuzhi
                currRowYear = grouped.loc[groupIndex, year]
                currRowMonth = grouped.loc[groupIndex, month]
                for valueCol in value:
                    #算同比
                    groupSubYear = grouped[grouped[year] == (currRowYear - 1)]  # 同比是年份不同月份相同
                    groupSubYear = groupSubYear[groupSubYear[month] == currRowMonth]
                    currTbFeildV=groupSubYear[valueCol].mean()
                    if currTbFeildV and currTbFeildV != 0 and str(currTbFeildV) != 'nan':#同比
                        singleValue.append((grouped.loc[groupIndex, valueCol]-currTbFeildV)/currTbFeildV)
                        singleValue.append(currTbFeildV)  # 同比数值
                    else:
                        singleValue.append(0)
                        singleValue.append(0)  # 同比数值

                    #算环比
                    groupSubMonth = grouped[grouped[year] == currRowYear]
                    groupSubMonth = groupSubMonth[groupSubMonth[month] == (currRowMonth - 1)]  # 环比是月份不同年份相同
                    currHbFeildV = groupSubMonth[valueCol].mean()
                    if currHbFeildV and currHbFeildV != 0 and str(currHbFeildV) != 'nan':#环比
                        singleValue.append((grouped.loc[groupIndex, valueCol]-currHbFeildV)/currHbFeildV)
                        singleValue.append(currHbFeildV)  # 环比数值
                    else:
                        singleValue.append(0)
                        singleValue.append(0)  # 环比数值

                allInsertValues.append(str(tuple(singleValue)).replace("'Null'",'Null'))#需要将字符串里的"1,2,'Null'"替换成"1,2,Null"做插入才能正确
                if len(allInsertValues) % 3000 == 0 :
                    print('=====excute %s rows===time:%s' % (len(allInsertValues),datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')))

        print('=====ended iter df,allcount=%s time=%s' % (len(allInsertValues),datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')))

        fullSql='insert into '+tablename+' ('
        #拼接columnname
        for idx,valueCol in enumerate(value):
            columnsName=columnsName+['tb'+str(idx+1),'tongbishuzhi'+str(idx+1),'hb'+str(idx+1),'huanbishuzhi'+str(idx+1)]
        fullSql=fullSql+','.join(columnsName)+') values '
        #拼接插入的values
        fullSql=fullSql+','.join(allInsertValues)

        if not allInsertValues:
            return 0,self.df.to_dict(orient='records')
        else:
            return len(allInsertValues),fullSql



class kpiTransform():
    def kpiConfigToOlap(self, config):
        config['columns'] = []
        indicator = config['indicators']
        indicator['kpitype'] = 'indicator'
        dist = {}
        dist['col'] = indicator['column']
        dist['title'] = indicator['title']
        if 'indicatorname' in config:
            dist['olaptitle'] = config['indicatorname']
        else:
            dist['olaptitle'] = ''
        dist['table'] = indicator['table']
        dist['order'] = ''
        dist['function'] = config['statistic']
        dist['kpitype'] = 'indicator'
        dist['fullname'] = indicator['fullname']
        config['columns'].append(dist)
        selectedlists = config['selectedlists']
        for row in selectedlists:
            dist = {}
            dist['col'] = row['column']
            dist['title'] = row['title']
            dist['table'] = row['table']
            dist['order'] = ''
            dist['olaptitle'] = ''
            dist['function'] = 'group'
            dist['kpitype'] = 'dimension'
            dist['fullname'] = row['fullname']
            config['columns'].append(dist)

        return config


class olapFilter():

    def buildFilter(self, k, v, strlist, connTp=None):
        paramAry = k.split('(_)')
        column = self.columnToReal(paramAry[0], strlist)
        if column != '':
            whereFilter=paramAry[1]
            multParam=["'"+val+"'" for val in v.split(',') if val.strip()]
            if v.find(',')>=0 and multParam:#如果参数有逗号分隔就当作in(x1,x2,x3)来处理，否则就按原始办法来处理
                whereFilter='in'
            if not multParam:
                return ''
            return self.typeToStr(whereFilter, column, v, connTp)
        else:
            return ''

    """
    2018年7月20日14:49:34 增加过滤条件的原英文列名匹配
    """
    def columnToReal(self, column, strlist):
        b = ''
        for s in strlist:
            if s['name'] == column or s['col'] == column:
                b = s['col']
                break
        return b

    def typeToStr(self, type, column, val1, connTp=None):
        dist = {}
        if type == 'equal':
            dist['str'] = u"""  \"""" + column + """\" = '%s' """
            # return u"""  \""""+column + """\" = \'""" + val1 + """\' """
        elif type == 'like':
            dist['str'] = u"""  \"""" + column + """\" like %s """
            val1 = """%%""" + val1 + """%%"""
        elif type == 'b':
            dist['str'] = u"""  \"""" + column + """\" > %s """
        elif type == 's':
            dist['str'] = u"""  \"""" + column + """\" < %s """
        elif type == 'b_equal':
            dist['str'] = u"""  \"""" + column + """\" >= %s """
        elif type == 's_equal':
            dist['str'] = u"""  \"""" + column + """\" <= %s """
        elif type == 'in':
            # val1 = val1.replace('，', ',')
            val1=['\''+ v +'\'' for v in val1.split(',') if v.strip()]# vall叫做val第一个即val+1(数字一)
            if connTp and connTp in odbcsqltool._dbConnTypes:#直连模式，如果日期为date需要前缀加入date字符
                val1=odbcsqltool.paramWrapper(val1)
            val1=','.join(val1)
            dist['str'] = u"""  \"""" + column + """\" in ( """+ val1 +""" ) """
            val1=' True '
        dist['value'] = val1
        return dist