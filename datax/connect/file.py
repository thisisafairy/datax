
# -*- coding: utf-8 -*-
from datetime import datetime
import xlrd
from xlrd import xldate_as_tuple
import json, os, re
import time
from connect.sqltool import SqlObjReader
from common.head import REGEX_FOR_NUMBER, REGEX_FOR_DATE
from common.constantcode import ConstantCode as CODE
from common.tools import UUIDTools,isVaildDate
import pdb
from api import utils as sqlUtil
from connect.sqltool import stRestoreLocal
from common.constantcode import DBTypeCode,LoggerCode

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)

# 第1行是列头信息，第2行开始才是数据
DATA_LINE_START_IN_FILE = 1

# 判断列类型的阀值
COLUMN_TYPE_THRESHOLD = 0.8


def judgeColumnTypes(cols_data):
    cols_types = []
    for each_col_data in cols_data:
        each_col_type = judgeGroupType(each_col_data)
        cols_types.append(each_col_type)

    return cols_types


def getDataTypes(data_list):
    types = []
    for data in data_list:
        type = judgeVarType(data)
        types.append(type)

    return types


def judgeVarType(var):
    # 检查是否是时间
    if re.match(REGEX_FOR_DATE, var):
        return 'datatime'
    # 检查是否是数值类型
    elif re.match(REGEX_FOR_NUMBER, var):
        return 'float'
    else:
        return 'str'


def judgeGroupType(data_list):
    total_num = len(data_list)
    date_num, float_num, str_count = 0, 0, 0

    for data in data_list:
        pdb.set_trace()
        # 检查是否是时间
        if re.match(REGEX_FOR_DATE, data):
            date_num += 1
        # 检查是否是数值类型
        elif re.match(REGEX_FOR_NUMBER, data):
            float_num += 1
        else:
            str_count += 1

    # 阀值为80%
        # if time_count / total_num > COLUMN_TYPE_THRESHOLD:
            #     type = 'datetime'
            # elif int_count / total_num > COLUMN_TYPE_THRESHOLD:
            #     type = 'float'
            # else:
            #     type = 'str'

    if str_count > 0:
        return 'str'
    if float_num > 0 and date_num == 0:
        return 'float'
    elif float_num == 0 and date_num > 0:
        return 'date'
    else:
        return 'str'

    return type


class BaseFile():
    def __init__(self, st, name):
        self.TEST_ROWS_NUM = 50
        self.st = st
        self.name = name

    def ensureColumnType(self, one_column_types_list):
        """
        判断float/int，以及date类型是否有超过阀值
        如果没有，则为str类型
        """
        str_num = one_column_types_list.count('str') + one_column_types_list.count(1)
        float_num = one_column_types_list.count('float') + one_column_types_list.count(2)
        date_num = one_column_types_list.count('date') + one_column_types_list.count(3)
        all_num = len(one_column_types_list)

        #if date_num / total_num > COLUMN_TYPE_THRESHOLD:
        #    type = 'datetime'
        #elif float_num / total_num > COLUMN_TYPE_THRESHOLD:
        #    type = 'float'
        #else:
        #    type = 'str'

        if str_num > 0:
            return 'str'
        if float_num > 0 and date_num == 0:
            return 'float'
        elif float_num == 0 and date_num > 0:
            return 'date'
        else:
            return 'str'

    def cvtTypesToStTypes(self, column_heads, column_types):
        # 根据用户指定的类型
        st_col_list = []
        for col, type in zip(column_heads, column_types):
            st_col = SqlObjReader().defColumn(col, type)
            st_col_list.append(st_col)
        return st_col_list

    def readColumnHead(self):
        pass

    def judgeColumnType(self):
        pass

    def reflectToTable(self):
        pass

    def copyContentsToTable(self):
        pass

    def readDataForJudgeColumnType(self):
        pass

    def getTable(self):
        return self.table

    def getType(self):
        return self.type

    def getSt(self):
        return self.st

    #  拼接json、xml文件的insert sql
    def splice_insert_sql(self, original_sql, values, idx):
        value_sql = ' VALUES ('
        for x in values:
            value_sql = value_sql + "'" + x + "',"
        value_sql += "'" + str(idx) + "',"#自增的字段值
        value_sql = value_sql[0:len(value_sql) - 1] + ")"
        sql = original_sql + value_sql
        return sql

    # real_column_heads:实际显示的列名
    # column_heads:表的列名
    # file_real_name:文件名
    # file_name:文件数据存储的表名
    def updateFileStructure(self, st, real_column_heads, column_heads, file_real_name, file_name, column_types):
        try:
            from common import head
            database_info = {}
            database_info['HOST'] = head.DATAXEXTENSION_DB_INFO['ip'].split(':')[0]
            database_info['PORT'] = head.DATAXEXTENSION_DB_INFO['ip'].split(':')[1]
            database_info['NAME'] = head.DATAXEXTENSION_DB_INFO['db']
            database_info['USER'] = head.DATAXEXTENSION_DB_INFO['user']
            database_info['PASSWORD'] = head.DATAXEXTENSION_DB_INFO['pwd']
            # 是否存在对应类型的连接
            type_select_sql = "select * from connect_database WHERE database_type = 'pgsql' and ip = '"+\
                              database_info['HOST'] + ":" + database_info['PORT'] + "' and database = '" + \
                              database_info['NAME'] + "'"
            type_total = st.getData(type_select_sql)
            # 没有则创建一个
            if len(type_total) == 0:
                type_insert_sql = "INSERT INTO connect_database (id,ip, user_name, password, database, database_type) VALUES ('" + \
                                  UUIDTools.uuid1_hex() +"','"+\
                                  database_info['HOST'] + ":" + database_info['PORT'] + "', '" + \
                                  database_info['USER'] + "', '" + database_info['PASSWORD'] + "', '" + database_info['NAME'] + "', 'pgsql')"
                st.execute(type_insert_sql)
                type_total = st.getData(type_select_sql)
            type_id = type_total[0]['id']
            # 将表实际名称和显示名称和存至connect_tables表
            table_insert_sql = "INSERT INTO connect_tables (id,database_id, tables, name, ifshow,createtime) VALUES (" + \
                "'"+UUIDTools.uuid1_hex()+"','"+str(type_id) + "', '" + file_name + "', '" + file_real_name + "', 1,now())"
            st.execute(table_insert_sql)
            # 将列名映射存至connect_columns表
            count = 0
            for val in real_column_heads:
                if len(column_types) > 0:
                    col_type = column_types[count]
                    if col_type == 'str':
                        col_type = 'varchar'
                else:
                    col_type = 'varchar'
                insert_column_sql = "INSERT INTO connect_columns (id,database_id, tables, columns, type, name, ifshow) VALUES (" + \
                    "'" + UUIDTools.uuid1_hex() + "','" +str(type_id) + "', '" + file_name + "', '" + column_heads[count] + "', '" \
                    + col_type + "', '" + str(val) + "', 1)"
                st.execute(insert_column_sql)
                count = count + 1
            return CODE.SUCCESS
        except Exception as e:
            raise e
            # return e

class Text(BaseFile):
    def __init__(self, st, f, name, file_type):
        self.f = f
        self.file_type = file_type
        BaseFile.__init__(self, st, name)

    def reflectToTable(self):
        real_column_heads = self.readColumnHead()
        if real_column_heads == 'encoding error':
            return 'encoding error'
        real_column_heads.append('排序字段') #最后一个是排序字段，在readColumnHead里添加
        column_heads = []
        column_count = 0
        for x in real_column_heads:
            column_count = column_count + 1
            if column_count == len(real_column_heads):#最后一个是排序字段，添加到字段头里
                column_heads.append('keyorder')
            else:
                column_heads.append('column' + str(column_count))

        test_cols_data = self.readDataForJudgeColumnType()
        # column_types    = judgeColumnTypes(test_cols_data)

        column_types = []
        for col_data in test_cols_data:
            types = getDataTypes(col_data)
            column_type = self.ensureColumnType(types)
            column_types.append(column_type)
        column_types.append('float')#最后一个是排序字段，添加到类型里,只有float是数值类型

        if len(column_heads) != len(column_types):
            raise Exception('xxxxxxxxxxxxx')

        try:
            st_col_list = self.cvtTypesToStTypes(column_heads, column_types)
            self.table = self.st.createTable(self.name, *tuple(st_col_list))
            self.copyContentsToTable()
            file_real_name = (self.f.name).replace("txt", "").replace("csv", "")
            systemSt = stRestoreLocal()  # 更新结构的时候需要使用系统库datax
            return_mess = self.updateFileStructure(systemSt, real_column_heads, column_heads, file_real_name, self.name,
                                                   column_types)
            # print(return_mess)
        except Exception as error:
            # 上传发生异常后，删除表，删除connect_tables,connect_columns里的数据
            #删除创建的表
            systemSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.SYSTEM_DB.value)
            extensionSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            try:
                dropTableSql = 'drop table IF EXISTS ' + self.name  # 删表需要用业务数据库的链接
                delDataFromConntablsSql = 'delete from connect_tables where tables=\'' + self.name + '\''
                delDataFromConncolSql = 'delete from connect_columns where tables=\'' + self.name + '\''
                try:
                    #删表需要用业务数据库的链接
                    extensionSqlUtilClass.executeUpdateSql(dropTableSql)
                    print(dropTableSql + ' success')
                except Exception as e:
                    print('--%s table dose not exists' % self.name)
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConntablsSql)
                    print(delDataFromConntablsSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConncolSql)
                    print(delDataFromConncolSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
            except Exception as error:
                logger.error('---error---file:file.py;method:reflectToTable;error=%s' % error)
            finally:
                systemSqlUtilClass.closeConnect()
                extensionSqlUtilClass.closeConnect()

            if str(error).index('codec can\'t decode byte') > 0:
                return CODE.DECODING_EXCEPTION
            else:
                raise error

        return CODE.SUCCESS



    def readColumnHead(self):
        pos = self.f.tell()
        self.f.seek(0)
        column_heads = []
        line = self.f.readline()
        try:
            file_line = str(line, encoding="utf-8")
        except Exception as e1:
            try:
                file_line = str(line, encoding="gbk")
            except Exception as e2:
                return 'encoding error'
        for w in file_line.split(self.spliter):
            column_heads.append(w.strip())
        # column_heads.append('keyorder')#增加排序字段
        self.f.seek(pos)
        return column_heads

    def copyContentsToTable(self):
        """
        把文件中数据拷贝进入数据表
        """
        # 越过第一行列信息
        self.f.seek(0)
        self.f.readline()

        line = self.f.readline()
        keyOrder = 1
        while line:
            try:
                # line_data = [w.strip().replace('\'','\'\'') for w in str(line, encoding="utf-8").split(self.spliter)]
                line_data = [w.strip() for w in str(line, encoding="utf-8").split(self.spliter)]
            except Exception as e:
                line_data = [w.strip() for w in str(line, encoding="gbk").split(self.spliter)]
            line_data.append(keyOrder)#增加排序的自增值
            keyOrder += 1 #自增字段keyOrder的值，用于排序

            ins = self.table.insert().values(tuple(line_data))
            try:
                self.st.conn.execute(ins)
            except Exception as e:
                pass
            finally:
                line = self.f.readline()

    def readDataForJudgeColumnType(self):
        column_heads = self.readColumnHead()
        column_length = len(column_heads)

        i, test_rows_data = DATA_LINE_START_IN_FILE, []
        while (i < self.TEST_ROWS_NUM):
            line = self.f.readline()
            try:
                test_one_row_data = [w.strip() for w in str(line, encoding="utf-8").split(self.spliter)]
            except Exception as e:
                test_one_row_data = [w.strip() for w in str(line, encoding="gbk").split(self.spliter)]
            if len(test_one_row_data) < column_length:
                break
            test_rows_data.append(test_one_row_data)
            i += 1

        test_cols_data = [[row[i] for row in test_rows_data] \
                          for i in range(column_length)]

        return test_cols_data

    def getSpliter(self):
        return self.spliter

    def setSpliter(self, spliter):
        self.spliter = spliter
        return


class Sheet(BaseFile):
    def __init__(self, st, name, worksheet,excel_nullchrepl):
        self.worksheet = worksheet
        self.excel_nullchrepl=excel_nullchrepl
        BaseFile.__init__(self, st, name)

    def readColumnHead(self):
        # 默认第一行是列头信息
        column_heads = self.worksheet.row_values(0)
        return column_heads

    def readDataForJudgeColumnType(self):
        col_num = self.worksheet.ncols
        columns_data = []
        for i in range(0, col_num):
            one_column_cells = self.worksheet.col_slice( \
                i, start_rowx=DATA_LINE_START_IN_FILE, end_rowx=self.TEST_ROWS_NUM \
                )
            one_column_data = self.cvtCellsToValuesTuple(one_column_cells)
            columns_data.append(one_column_data)

        return columns_data

    # 计算excel每一列类型
    # 方式:
    # 每一列读取50(数量可配置)行,使用正则表达式匹配是否全部为数字或时间类型
    def readColumnTypes(self):
        col_num = self.worksheet.ncols
        column_types = []
        for i in range(col_num):
            one_column_types = self.getColsTypes(i, DATA_LINE_START_IN_FILE, self.TEST_ROWS_NUM)
            # one_column_types = self.worksheet.col_types( \
            #     i, start_rowx=DATA_LINE_START_IN_FILE, end_rowx=self.TEST_ROWS_NUM \
            #     )
            column_type = self.ensureColumnType(one_column_types)
            column_types.append(column_type)

        return column_types

    # str,float,date
    def getColsTypes(self, colCount, startRow, endRow):
        rows = self.worksheet.nrows
        types = []
        limitRow=rows if rows<endRow else endRow
        for i in range(startRow, limitRow):
            val = self.worksheet.row_values(i)[colCount]
            #判断是否是日期
            if self.worksheet.cell(i,colCount).ctype == 3:
                # date = xldate_as_tuple(self.worksheet.cell(colCount, i).value, 0)
                # val = datetime.datetime(*date)
                types.append('date')
            else:
                # 根据字符串数据判断类型
                if val is not None and len(str(val).replace(' ', '')) > 0:
                    try:
                        if re.match(REGEX_FOR_NUMBER, str(val)):
                            types.append('float')
                        # elif re.match(REGEX_FOR_DATE, str(val)):
                        elif isVaildDate(str(val)):
                            types.append('date')
                        else:
                            types.append('str')
                    except:
                        types.append('str')
                else:
                    types.append('null')
        return types

    def copyContentsToTable(self):
        row_num = self.worksheet.nrows
        col_num = self.worksheet.ncols
        col_num = col_num + 2
        # 拼sql
        sql = ' INSERT INTO ' + self.name + ' ( '
        for colCount in range(1, col_num):
            sql = sql + '"column' + str(colCount) + '", '
        sql += '"keyorder", '#拼接sql的时候需要拼接keyorder字段,for循环range里不需要对col_num-1
        sql = sql[:-2] + ' ) VALUES '
        allInsertValues=[]
        for i in range(DATA_LINE_START_IN_FILE, row_num):
            rowCells = self.worksheet.row(i)
            insertSql = "('" + str(UUIDTools.uuid1_hex()) + "', "
            for cell in rowCells:
                if cell.value is None or len(str(cell.value).replace(' ', '')) == 0 or cell.value in self.excel_nullchrepl:
                    insertSql = insertSql + "NULL, "
                else:
                    if cell.ctype == 3 or isVaildDate(cell.value):#对日期校验处理
                        try:
                            date = xldate_as_tuple(cell.value, 0)
                            val = (datetime(*date)).strftime('%Y-%m-%d %H:%M:%S')
                            insertSql = insertSql + "'" + val + "', "
                        except Exception as e:
                            transDate=isVaildDate(cell.value)
                            if transDate:
                                insertSql = insertSql + "'" + transDate + "', "
                            else:
                                insertSql = insertSql + "NULL, "
                                print(e)
                    else:
                        insertSql = insertSql + "'" + str(cell.value).replace("'","''") + "', "
            insertSql += str(i) + ", "#自增字段

            insertSql = insertSql[:-2] + ')'
            allInsertValues.append(insertSql)
            if i % 5000 == 0:
                print('%s sql[-2:]=%s' % (i, ','.join(allInsertValues[-2:])))
        session = sqlUtil.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        try:
            if allInsertValues:
                presql = sql + ','.join(allInsertValues)
                session.executeUpdateSql(presql)
            session.closeConnect()
        except Exception as e:
            session.rollBack()
            raise e
        finally:
            session.closeConnect()

            # row_values = self.cvtCellsToValuesTuple(row_cells)

            # ins = self.table.insert().values(tuple(row_values))
            # try:
            #     self.st.conn.execute(ins)
            # except Exception as e:
            #     pass


    # def cvtCellsToValuesTuple(self, cells):
    #     data_list = []
    #     for cell in cells:
    #         # 时间格式，需要转换
    #         if 3 == cell.ctype:
    #             try:
    #                 datetime_str = datetime( \
    #                     *xlrd.xldate_as_tuple(cell.value, self.datemode) \
    #                     ).strftime('%Y-%m-%d %H:%M:%S')
    #             except ValueError as e:
    #                 pass
    #             else:
    #                 data_list.append(datetime_str)
    #         else:
    #             if cell.value == '':
    #                 data_list.append(None)
    #             else:
    #                 data_list.append(cell.value)
    #
    #     return data_list

    def reflectToTable(self):
        # 读取excel列头
        real_column_heads = self.readColumnHead()
        # 读取excel每列类型
        column_types = self.readColumnTypes()
        # 添加虚拟主键
        real_column_heads.insert(0, '虚拟标识列')
        column_types.insert(0, 'mid_char')
        ##excel上传导入添加一个排序列(末尾)
        real_column_heads.append('排序字段')
        column_types.append('int')

        column_heads = []
        column_count = 0
        for idx,x in enumerate(real_column_heads):
            column_count = column_count + 1
            if len(real_column_heads) == column_count:#最后一个字段为keyorder
                column_heads.append('keyorder')
            else:
                column_heads.append('column' + str(column_count))
            if real_column_heads[idx] and type(real_column_heads[idx])==type('stringtype'):
                real_column_heads[idx]=real_column_heads[idx].replace('%','')#防止%在sql语句中引起错误，其他字符不会
        """
        test_cols_data  = self.readDataForJudgeColumnType()
        column_types    = judgeColumnTypes(test_cols_data)
        """

        st_col_list = self.cvtTypesToStTypes(column_heads, column_types)
        self.table = self.st.createTable(self.name, *tuple(st_col_list))
        self.copyContentsToTable()
        return real_column_heads, column_heads, column_types

    def getSheet(self):
        return self.worksheet

    def setDatemode(self, datemode):
        self.datemode = datemode


class Excel(BaseFile):
    def __init__(self, f, name,excel_nullchrepl):
        self.name = name
        self.f = f
        self.workbook = xlrd.open_workbook(file_contents=f.read())
        self.sheetnames = self.workbook.sheet_names()
        self.sheet_list = []
        self.excel_nullchrepl=excel_nullchrepl

    def reflectToTables(self, st):
        count = 1
        file_name=''
        try:
            for sheet_name in self.sheetnames:

                worksheet = self.workbook.sheet_by_name(sheet_name)
                if worksheet.nrows <= 0:#如果sheet内没有数据就略过
                    continue
                file_name = u'excel_sheet' + str(count) + "_" + str(int(time.time()))
                sheet_obj = Sheet(st, file_name, worksheet,self.excel_nullchrepl)
                sheet_obj.setDatemode(self.workbook.datemode)
                print('---start reflecttotable---')
                # 将上传的excel导入数据库
                real_column_heads, column_heads, column_types = sheet_obj.reflectToTable()
                file_real_name = self.f.name.replace("xlsx", "").replace("xls", "") + "_" + sheet_name
                # 在系统配置表中记录上传文件所在的表及表结构
                systemSt = stRestoreLocal()
                return_mess = self.updateFileStructure(systemSt, real_column_heads, column_heads, file_real_name, file_name, column_types)
                self.sheet_list.append(sheet_obj)
                count = count + 1
        except Exception as error:
            #上传发生异常后，删除表，删除connect_tables,connect_columns里的数据
            systemSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.SYSTEM_DB.value)
            extensionSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            try:
                dropTableSql = 'drop table IF EXISTS ' + file_name  # 删表需要用业务数据库的链接
                delDataFromConntablsSql = 'delete from connect_tables where tables=\'' + file_name + '\''
                delDataFromConncolSql = 'delete from connect_columns where tables=\'' + file_name + '\''
                try:
                    # 删表需要用业务数据库的链接
                    extensionSqlUtilClass.executeUpdateSql(dropTableSql)
                    print(dropTableSql + ' success')
                except Exception as e:
                    print('--%s table dose not exists' % file_name)
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConntablsSql)
                    print(delDataFromConntablsSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConncolSql)
                    print(delDataFromConncolSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
            except Exception as error:
                logger.error('---error---file:file.py;method:reflectToTable;error=%s' % error)
            finally:
                systemSqlUtilClass.closeConnect()
                extensionSqlUtilClass.closeConnect()

            print('---upload error----',error.args)
            if str(error).index('codec can\'t decode byte') > 0:
                return CODE.DECODING_EXCEPTION
            else:
                raise error

        return CODE.SUCCESS, file_name
    def getSheetList(self):
        return self.sheet_list

    def getName(self):
        return self.name


class XmlRead(BaseFile):
    def __init__(self, st, f,  json_str):
        self.st = st
        self.f = f
        self.node_str = json_str
        self.max_level = 1

    # node_str:上传的xml文件中读取到的所有内容
    def get_xml_data(self):
        from xml.etree import ElementTree
        try:
            root_node = ElementTree.fromstring(self.node_str)
        except Exception as e:
            return CODE.FORMAT_EXCEPTION
        level = 1
        result_list = []
        self.walk_data(root_node, level, result_list)
        if self.max_level > 3:
            return CODE.TOO_MANY_LEVELS
        # tag_list:节点名称集合(保存进数据库时用于当做列名)
        tag_list = set()

        for arr in result_list:
            if arr[0] == self.max_level - 1:
                tag_list.add('row_title')
            if arr[0] == self.max_level:
                tag_list.add(arr[1])
        #  print(tag_list)
        #  列类型，默认全部varchar
        column_types = []
        for m in tag_list:
            column_types.append('big_char')
        column_types.append('big_char')#排序字段
        tag_list.add('keyorder')#排序字段
        tag_list = list(tag_list)

        #  建表
        st_col_list = self.cvtTypesToStTypes(tag_list, column_types)
        # 该文件内容存放的表名
        file_name = 'xml' + str(int(time.time()))
        try:
            self.st.createTable(file_name, *tuple(st_col_list))
            column_types = []
            systemSt = stRestoreLocal()  # 更新结构的时候需要使用系统库datax
            return_mess = self.updateFileStructure(systemSt, tag_list, tag_list, self.f.name.replace('.xml', ''),
                                                   file_name, column_types)
            start_num = 0
            #  需要insert的参数集合
            value_list = []
            count = 1

            # 插入数据
            for idx,arr in enumerate(result_list):
                #  遇见一次倒数第二层的节点，视为完成一行
                if arr[0] == self.max_level - 1:
                    if start_num == 0:
                        start_num = start_num + 1
                    else:
                        row_insert_sql += 'keyorder,'  # 排序字段
                        row_insert_sql = row_insert_sql[0:len(row_insert_sql) - 1] + ")"
                        sql = self.splice_insert_sql(row_insert_sql, value_list, idx + 1)
                        self.st.execute(sql)
                        #  print(value_list)
                    row_insert_sql = "INSERT INTO " + file_name + " ("
                    value_list = []
                    if arr[2]:
                        row_insert_sql = row_insert_sql + "row_title,"
                        if str(type(arr[2])).index('dict') > -1:
                            value_list.append(list((arr[2]).values())[0])
                        else:
                            value_list.append(str(arr[2]))
                if arr[0] == self.max_level:
                    row_insert_sql = row_insert_sql + arr[1] + ","
                    value_list.append(arr[3])
                #  循环结束时插入最后一行
                if count == len(result_list):
                    row_insert_sql += 'keyorder,'#排序字段
                    row_insert_sql = row_insert_sql[0:len(row_insert_sql) - 1] + ")"
                    sql = self.splice_insert_sql(row_insert_sql, value_list,idx + 1)
                    self.st.execute(sql)
                    #  print(value_list)
                count = count + 1
        except Exception as error:
            # 上传发生异常后，删除表，删除connect_tables,connect_columns里的数据
            systemSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.SYSTEM_DB.value)
            extensionSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            try:
                dropTableSql = 'drop table IF EXISTS ' + file_name  # 删表需要用业务数据库的链接
                delDataFromConntablsSql = 'delete from connect_tables where tables=\'' + file_name + '\''
                delDataFromConncolSql = 'delete from connect_columns where tables=\'' + file_name + '\''
                try:
                    # 删表需要用业务数据库的链接
                    extensionSqlUtilClass.executeUpdateSql(dropTableSql)
                    print(dropTableSql + ' success')
                except Exception as e:
                    print('--%s table dose not exists' % file_name)
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConntablsSql)
                    print(delDataFromConntablsSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConncolSql)
                    print(delDataFromConncolSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
            except Exception as error:
                logger.error('---error---file:file.py;method:reflectToTable;error=%s' % error)
            finally:
                systemSqlUtilClass.closeConnect()
                extensionSqlUtilClass.closeConnect()


            print('---upload error----', error.args)
            if str(error).index('codec can\'t decode byte') > 0:
                return CODE.DECODING_EXCEPTION
            else:
                raise error

        return CODE.SUCCESS

    #  root_node:xml对象
    #  level:xml对象的层级，一个倒数第二层的节点为一行，最底层的节点为行数据
    #  max_level:最大层级
    #  result_list:xml中的数据集合
    #  result_list[0]:第几层  result_list[1]:节点名称  result_list[2]:节点属性  result_list[3]:节点内容
    def walk_data(self, root_node, level, result_list):
        if level > self.max_level:
            self.max_level = level
        temp_list = [level, root_node.tag, root_node.attrib, root_node.text]
        result_list.append(temp_list)

        # 遍历每个子节点
        children_node = root_node.getchildren()
        if len(children_node) == 0:
            return
        for child in children_node:
            self.walk_data(child, level + 1, result_list)
        return


class JsonRead(BaseFile):
    def __init__(self, st, f,  json_str):
        self.st = st
        self.f = f
        self.json_str = json_str
        self.max_level = 1

    def get_json_data(self):
        try:
            json_list = json.loads(self.json_str)
        except Exception as e:
            return CODE.FORMAT_EXCEPTION
        # 读取的json内容不是数组形式则报错
        if str(type(json_list)).index('list') == -1:
            return CODE.NOT_LIST

        # 取出所有的key
        # 列名
        column_heads = []
        # 列类型
        column_type = []
        for row in json_list:
            for key in list(row.keys()):
                if key not in column_heads:
                    column_heads.append(key)
                    column_type.append('big_char')
        column_heads.append('keyorder')
        column_type.append('int')

        # 表名
        file_name = 'json' + str(int(time.time()))
        # 建表
        try:
            st_col_list = self.cvtTypesToStTypes(column_heads, column_type)
            self.st.createTable(file_name, *tuple(st_col_list))
            # 将表名、列名、列类型存入相关系统表
            column_types = []
            systemSt = stRestoreLocal()  # 更新结构的时候需要使用系统库datax
            return_mess = self.updateFileStructure(systemSt, column_heads, column_heads,
                                                   self.f.name.replace('.json', ''), file_name, column_types)

            insert_sql = "INSERT INTO " + file_name + " ("

            if not json_list[0]:#如果没有数据就返回
                return CODE.SUCCESS
            columnNameList = []
            for row in json_list[0].keys():#生成columnName
                columnNameList.append(row)#不能直接columnNameList=json_list[0].keys()，类型不一样
            columnNameList.append('keyorder')#排序字段
            insert_sql += ','.join(columnNameList) + ') values '#拼接字段名

            # 插入数据
            valueList = []
            sql = ''
            for idx,row in enumerate(json_list):
                # sql = self.create_insert_sql(list(row.keys()), list(row.values()), file_name,idx)
                tempRowValueList = []
                for val in row.values():
                    tempRowValueList.append("'" + str(val).replace("'","''") + "'")
                tempRowValueList.append(str(idx + 1))#排序字段
                valueList.append('(' + ','.join(tempRowValueList) + ')')
            insert_sql += ','.join(valueList)

            self.st.execute(insert_sql)
        except Exception as error:
            # 上传发生异常后，删除表，删除connect_tables,connect_columns里的数据
            systemSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.SYSTEM_DB.value)
            extensionSqlUtilClass = sqlUtil.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            try:
                dropTableSql = 'drop table IF EXISTS ' + file_name  # 删表需要用业务数据库的链接
                delDataFromConntablsSql = 'delete from connect_tables where tables=\'' + file_name + '\''
                delDataFromConncolSql = 'delete from connect_columns where tables=\'' + file_name + '\''
                try:
                    # 删表需要用业务数据库的链接
                    extensionSqlUtilClass.executeUpdateSql(dropTableSql)
                    print(dropTableSql + ' success')
                except Exception as e:
                    print('--%s table dose not exists' % file_name)
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConntablsSql)
                    print(delDataFromConntablsSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
                try:
                    systemSqlUtilClass.executeUpdateSql(delDataFromConncolSql)
                    print(delDataFromConncolSql + ' success')
                except Exception as e:
                    logger.error('---error---file:file.py;method:reflectToTable;error=%s' % e)
            except Exception as error:
                logger.error('---error---file:file.py;method:reflectToTable;error=%s' % error)
            finally:
                systemSqlUtilClass.closeConnect()
                extensionSqlUtilClass.closeConnect()

            print('---upload error----', error.args)
            if str(error).index('codec can\'t decode byte') > 0:
                return CODE.DECODING_EXCEPTION
            else:
                raise error

        return CODE.SUCCESS

    def create_insert_sql(self, keys, values, table_name, idx):
        insert_sql = "INSERT INTO " + table_name + " ("
        values_sql = "("
        count = 0
        for key in keys:
            insert_sql = insert_sql + key + ","
            values_sql = values_sql + "'" + str(values[count]).replace("'","''") + "',"
            count = count + 1
        values_sql += str(idx) + ','#排序字段，由于每一条数据都用一个insertsql，这里从外部传入
        insert_sql = insert_sql[0:len(insert_sql) - 1] + ")"
        values_sql = values_sql[0:len(values_sql) - 1] + ")"
        insert_sql = insert_sql + " VALUES " + values_sql
        print(insert_sql)
        return insert_sql
