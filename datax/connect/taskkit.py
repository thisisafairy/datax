from __future__ import absolute_import
from dashboard.models import rulelogs
from api.utils import *
from api.mail_utils import *
from connect.lib.data import *
import sys
import os
import shutil
import time
import re

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)


def getCurrTime():
    return str(time.strftime("%Y-%m-%d %H:%M:%S"))


# 已注释的inss为 orm方式插入,目前弃用，现改为sql方式插入,注意columnslists参数是django查出来的，打印出来是字符串数组实际上每个元素都是对象
def generateInsertSql(inss,tablename, columnslists, lists, thistable, version, sourceid, isColConversion):
    rowcount = 0
    sql = ''
    try:
        nullValueAvailable=['False','None','Null','']    #空值不需要在其两端加单引号
        sourcerow = source.objects.get(id=sourceid)
        sourcecolumns = []
        if sourcerow.custom == 0 or sourcerow.custom == '0':
            sourcecolumns = getSourceColumn(sourceid)
        # 拼接插入数据的sql
        sql = sql + 'insert into ' + tablename + ' ('
        # 拼接列名
        for colName in columnslists:
            if not isColConversion:
                sql = sql + QUOTA_FOR_DBSQL['pgsql']['COL_QUOTA'] + colName.name + QUOTA_FOR_DBSQL['pgsql']['COL_QUOTA'] + ','
            else:
                sql = sql + QUOTA_FOR_DBSQL['pgsql']['COL_QUOTA'] + colName['fullname'] + QUOTA_FOR_DBSQL['pgsql']['COL_QUOTA'] + ','
        sql = sql[:-1] + ') VALUES '
        allSqlValueList=[]
        for row in lists:
            rowcount = rowcount + 1
            # dist = {}
            if sourcerow.custom == 0 or sourcerow.custom == '0':
                row = formateRemoteByRow(row, sourcecolumns)
            rowKeyLs=list(row.keys())
            sqlVal = '('
            for b in columnslists:
                if not isColConversion:
                    colName = b.name
                else:
                    colName = b['fullname']
                if colName == 'add_time':
                    sqlVal = sqlVal + 'now(),'
                    # dist['add_time'] = datetime.datetime.now()
                elif colName == 'version':
                    sqlVal = sqlVal + str(version) + ','
                    # dist['version'] = version
                elif colName == 'extra_processing':
                    sqlVal = sqlVal + "'n',"
                elif colName == 'keyorder':
                    sqlVal = sqlVal + str(rowcount) + ","
                else:
                    valstr = str(row[colName])  # 如果是年，月等字段值，要把2018.0转换成2018
                    if colName not in rowKeyLs or valstr in nullValueAvailable:
                        sqlVal = sqlVal + "Null,"
                    else:
                        try:
                            if valstr.endswith('.0'):
                                sqlVal = sqlVal + "'" + valstr[0:-2] + "',"
                            else:
                                sqlVal = sqlVal + "'" + valstr.replace('\'','\'\'') + "',"
                        except:
                            sqlVal = sqlVal + "'" + valstr.replace('\'','\'\'') + "',"
            sqlVal = sqlVal[:-1]
            sqlVal = sqlVal + ')'
            allSqlValueList.append(sqlVal)

            if rowcount%5000==0:#每5000条打印一次
                print('%s sqlvalues[-1]=%s'%(rowcount,allSqlValueList[-1:]))

        sql=sql+','.join(allSqlValueList)
    except Exception as e:
        # print('insert sql splice error...')
        # print('last 2 rows=',allSqlValueList[-2:])
        raise Exception(e.args)
    return sql, rowcount

def removeUploadTmpFile():
    '''remove upload temp file '''
    programpath = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    uploadtmpdir=os.path.join(programpath,'frontend','upload','temp_files')
    if os.path.exists(uploadtmpdir):   #删除temp_files及其下所有文件，并创建temp_files文件夹
        shutil.rmtree(uploadtmpdir)
    time.sleep(1)  # 等待文件删除完毕，注意调度此函数的间隔时间一定要大于此函数的运行时间
    if not os.path.exists(uploadtmpdir):
        os.mkdir(uploadtmpdir)
    ###删除文件夹完成

def updateTableVersion():
    tablessql='SELECT "table" FROM connect_olap' # WHERE "enabled"=\'y\'
    # tables = getResultBySql(tablessql)
    tables = SqlUtils(dbType=DBTypeCode.SYSTEM_DB.value).getArrResultWrapper(tablessql,logger, 'tasks.py', 'updateTableVersion')
    if len(tables)>0:
        for table in tables:
            if not re.search(r'^[a-z]',table[0]):#如果表名不是以小写字母开头的就过滤掉
                continue
            #删除version<(maxversion-2)的数据
            session = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            try:
                # maxVersion = getResultBySql('select max("version") as v from ' + table[0], DATAXEXTENSION_DB_CHAR)[0]
                maxVersion = SqlUtils(dbType=DBTypeCode.SYSTEM_DB.value).getArrResultWrapper('select max("version") as v from ' + table[0],
                                                                                             logger,'tasks.py','updateTableVersion')

                if maxVersion:
                    deleteoldver = 'delete from ' + table[0] + ' where "version"!=0 and "version" < ' + str(int(maxVersion[0]) - 2)
                    session.executeUpdateSql(deleteoldver)  # 可能version <-2，但不影响(不删除)最终结果
                    session.closeConnect()
                else:
                    print('maxversion is none')
            except Exception as e:
                session.rollBack()
                print(e)
                continue

def execute_rules(olapid, olap_name, olap_type, table, version):
    try:
        # 取到所有的业务规则
        rules = monitor.objects.filter(olapid=olapid)
        for rule in rules:

            indicate_flag = 0
            mail_content = r'''
                            <style> 
                            .table-mail table{border-right:1px solid #000000;border-bottom:1px solid #000000} 
                            .table-mail table td{border-left:1px solid #000000;border-top:1px solid #000000;padding-left:3px} 
                            </style> ''' \
                        + '''您好:</br>这是来自XX系统的自动提醒邮件</br><div class="table-mail"><table><tr><td>''' + olap_type \
                        + '''名称</td><td>业务规则</td><td>触发条件</td><td>触发条数</td><td>触发时间</td></tr>'''

            # 取到业务规则下的触发方式
            rule_details = monitorDetail.objects.filter(monitorid=rule.id)
            if len(rule_details) == 0:
                return ''
            for rule_detail in rule_details:
                if rule_detail.issend == 'y':
                    sql_str = ''
                    currConditionStr = rule_detail.condition
                    currConditionStr = currConditionStr.replace("'", "\"")
                    currConditionStr = currConditionStr.replace("True", "\"y\"")
                    currConditionStr = currConditionStr.replace("False", "\"n\"")
                    currConditionStr = currConditionStr.replace("None", "\"\"")
                    ruleList = json.loads(currConditionStr)
                    sql_str = spliceSql(rule_detail, ruleList, table, version)
                    # 查询出符合触发方式的数据条数
                    print('sql====',sql_str)
                    # cnt = getResultBySql(sql_str, DATAXEXTENSION_DB_CHAR)[0][0]
                    cntQuery = SqlUtils(dbType=DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(sql_str,logger, 'tasks.py', 'execute_rules')
                    cnt = cntQuery[0][0]

                    if int(cnt) > 0:
                        # 拼接需要记录的数据并存入数据库
                        # olapid, olap名称, olap类型, 规则id, 规则名称, 触发条件id，触发条件名称，颜色，sql，条数，版本，当前时间
                        data_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        json_obj = {}
                        json_obj['olap_id'] = olapid
                        json_obj['olap_name'] = olap_name
                        json_obj['olap_type'] = olap_type
                        json_obj['monitor_id'] = rule.id
                        json_obj['monitor_name'] = rule.title
                        json_obj['monitor_detail_id'] = rule_detail.id
                        json_obj['monitor_detail_name'] = rule_detail.tagname
                        json_obj['monitor_detail_color'] = rule_detail.color
                        json_obj['select_sql'] = sql_str.replace('SELECT count(*) FROM', 'SELECT * FROM')
                        json_obj['cnt'] = cnt
                        json_obj['version'] = version
                        json_obj['date_str'] = data_str
                        rulelogs.objects.create(olap_id=olapid, monitor_id=rule.id,monitordetail_id=rule_detail.id
                                                , describe=json.dumps(json_obj), indicate_cnt=int(cnt))
                        mail_content = mail_content + r'<tr><td>' + olap_name + '</td><td>' + rule.title + '</td><td>' \
                                                    + rule_detail.tagname + '</td>' \
                                                    + '<td>' + str(cnt) + '</td><td>' + data_str + '</td></tr>'
                        indicate_flag = 1
            indicate_flag = 0
            if indicate_flag == 1:
                mail_content = mail_content + r'</table></div></br>可进入xxx模块查看</br>'
                mail_title = 'xx系统业务规则触发提醒邮件'
                # 取到收件人
                mail_to = ''
                if rule.receive_user is not null and rule.receive_user != '':
                    send_user_str = rule.receive_user
                    select_sql = 'SELECT email FROM account_sys_userextension WHERE username IN (' + send_user_str + ')'
                    # emails = getResultBySql(select_sql)
                    emails = SqlUtils().getArrResultWrapper(select_sql,logger,'tasks.py','execute_rules')
                    if len(emails) > 0:
                        temp_email = []
                        for mail_row in emails:
                            temp_email.append(mail_row[0])
                        mail_to = ','.join(temp_email)
                # 取到抄送人
                acc = ''
                if rule.cc_user is not null and rule.cc_user != '':
                    cc_user_str = rule.cc_user
                    select_sql = 'SELECT email FROM account_sys_userextension WHERE username IN (' + cc_user_str + ')'
                    # emails = getResultBySql(select_sql)
                    emails = SqlUtils().getArrResultWrapper(select_sql, logger,'tasks.py', 'execute_rules')
                    if len(emails) > 0:
                        temp_email = []
                        for mail_row in emails:
                            temp_email.append(mail_row[0])
                            acc = ','.join(temp_email)
                if mail_to != '':
                    sendTextMail(mail_title, mail_content, mail_to, acc)
    except Exception as e:
        print(e)
        print(sys.exc_info())

def addOlapExtCol(olapid, table):
    baseParam = ''' WHERE "version" = (SELECT MAX ("version") FROM ''' + table + ''') AND "extra_processing" = 'n' '''
    # 获取olapext配置
    olapExts = olapextcols.objects.filter(olapid=olapid)
    print('add ' + str(len(olapExts)) + ' col')

    for olapExt in olapExts:
        session = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        try:
            # 直接关联的字段
            if olapExt.coltype == 'default':
                print('default col:')
                colObj = json.loads(olapExt.configs)
                if 'olapId' not in colObj and str(colObj['olapId']) == '':
                    continue
                sql = 'UPDATE ' + table + ' t1 SET "' + colObj['title'] + '" = t2."c1" FROM ('
                # t2Sql = 'SELECT SUM("' + colObj['olapCol'] + '") c1, '###去掉sum
                t2Sql = 'SELECT "' + colObj['olapCol'] + '" c1, '
                joinCols = ' '
                for joinRow in colObj['joinCol']:
                    joinCols = joinCols + '"' + joinRow['joinCol'] + '", '
                joinCols = joinCols[:-2] + ' '
                t2Sql = t2Sql + joinCols + ''' FROM {0} WHERE "version" = 
                    (SELECT MAX("version") FROM {0}) 
                    AND "extra_processing" = 'n' '''#去掉groupby
                t2Sql = t2Sql.format(colObj['olapTable'])
                sql = sql + t2Sql + ') t2 WHERE '
                for joinRow in colObj['joinCol']:
                    tempJoinCol = 't2."' + joinRow['joinCol'] + '" '
                    if 'colOper' in joinRow and 'colCalc' in joinRow:
                        if joinRow['colOper'] != '' and joinRow['colCalc'] != '':
                            tempJoinCol = tempJoinCol + str(joinRow['colOper']) + str(joinRow['colCalc'])
                    print('tempJoinCol:', tempJoinCol)
                    sql = sql + ' t1."' + joinRow['mainCol'] + '" = ' + tempJoinCol + ' AND '
                sql = sql[:-4]
                sql = sql + ''' AND t1."version" = (SELECT MAX ("version") FROM ''' + table + ''') AND t1."extra_processing" = 'n' '''
                print(sql)
                session.executeUpdateSql(sql)
                cleanNullSql = ' UPDATE ' + table + ' SET "' + colObj['title'] + '" = 0 WHERE "' + colObj[
                    'title'] + '" IS NULL AND "version" = (SELECT MAX ("version") FROM ' + table + ') '
                session.executeUpdateSql(cleanNullSql)
            elif olapExt.coltype == 'calc':
                print('calc col:')
                colObj = json.loads(olapExt.configs)
                if 'calcFormula' not in colObj:
                    continue
                # 取出关联条件
                mainJoinStr = ''
                tJoinStr = ''
                ttJoinStr = ''
                endWhere = ''
                penultimateWhere = ''
                colCnt = 2
                for joinObj in colObj['cols'][0]['joinCol']:
                    mainJoinStr = mainJoinStr + '"' + joinObj['mainCol'] + '",'
                    tJoinStr = tJoinStr + '"' + joinObj['mainCol'] + '" c' + str(colCnt) + ','
                    ttJoinStr = ttJoinStr + 'tt1.c' + str(colCnt) + ','
                    endWhere = endWhere + ' AND ' + table + '."' + joinObj['mainCol'] + '" = ttt1.c' + str(colCnt)
                    colCnt2 = 2
                    colCnt = colCnt + 1
                ttJoinStr = ttJoinStr[:-1]
                tCnt = 2
                tSql1 = ' SELECT ttt1.cc1 FROM ( SELECT COALESCE(' + colObj['calcFormula']
                penultimateWheres = []
                for obj in colObj['cols']:
                    if str(obj['olapId']) != '-1' and str(obj['olapId']) != '':
                        penultimateWhere = ' ON '
                        tCnt2 = 2
                        for joinR in obj['joinCol']:
                            tempJoinCol = str(tCnt2)
                            if 'colOper' in joinR and 'colCalc' in joinR:
                                if joinR['colOper'] != '' and joinR['colCalc'] != '':
                                    tempJoinCol = tempJoinCol + str(joinR['colOper']) + str(joinR['colCalc'])
                            penultimateWhere = penultimateWhere + ' tt1.c' + str(tCnt2) + ' = tt' + str(
                                tCnt) + '.c' + tempJoinCol + '  AND '
                            tCnt2 = tCnt2 + 1
                        tCnt = tCnt + 1
                        penultimateWheres.append(penultimateWhere)
                tSql1 = tSql1 + ', 0) cc1, ' + ttJoinStr + ' FROM '
                mainJoinStr = mainJoinStr[:-1]
                tJoinStr = tJoinStr[:-1]
                tt1Sql = ' ( SELECT ' + tJoinStr + ' FROM ' + table + baseParam
                tt1Sql = tt1Sql + ' GROUP BY ' + mainJoinStr + ') tt1 LEFT JOIN '
                cnt = 2
                keyNum = 0
                for joinCol in colObj['cols']:
                    if str(joinCol['olapId']) != '-1' and str(joinCol['olapId']) != '':
                        if str(joinCol['olapId']) == '-1':
                            continue
                        joinStr = ''
                        tjoinCnt = 2
                        tempjoinStr = ''
                        for joinRow in joinCol['joinCol']:
                            joinStr = joinStr + '"' + joinRow['joinCol'] + '",'
                            tempjoinStr = tempjoinStr + '"' + joinRow['joinCol'] + '" c' + str(tjoinCnt) + ','
                            tjoinCnt = tjoinCnt + 1
                        joinStr = joinStr[:-1]
                        tempjoinStr = tempjoinStr[:-1]
                        #下面这一句也去掉了sum
                        tt1Sql = tt1Sql + ' (SELECT "' + joinCol['col'] + '" c1, ' + tempjoinStr + ' FROM ' + \
                                 joinCol['olapTable']
                        #下面这一句去掉了groupby
                        tt1Sql = tt1Sql + ''' WHERE "extra_processing" = 'y' OR "version" = ( SELECT MAX ("version") FROM ''' + \
                                 joinCol['olapTable'] + ''') ''' + ''') tt''' + str(cnt) + ''' '''
                        penultimateWhere = penultimateWheres[keyNum]
                        penultimateWhere = penultimateWhere[:-4]
                        tt1Sql = tt1Sql + penultimateWhere
                        tt1Sql = tt1Sql + '   LEFT JOIN '
                        cnt = cnt + 1
                        keyNum = keyNum + 1
                tt1Sql = tt1Sql[:-11]
                coreSql = tSql1 + tt1Sql + ' ) ttt1 WHERE 1 = 1 ' + endWhere
                sql = r'''
                    UPDATE ''' + table + ''' SET "''' + colObj['title'] + '''" = ( ''' + coreSql + '''
                    ) WHERE "extra_processing" = 'y' OR  "version" = ( SELECT MAX ("version") FROM ''' + table + ''')
                '''
                print(sql)
                session.executeUpdateSql(sql)
            session.closeConnect()
        except Exception as ex:
            session.rollBack()
            print('Exceptions:', ex)
            print(olapExt)


def spliceSql(rule_detail, conditions, tableName, version):
    sql = ''
    try:
        # 检查判断依据里是否有其他olap
        isExtraOlapCol = False
        # 以其他表中字段为依据进行判断的字段
        exrtaOlapCols = []
        # 在页面维护值得字段
        normalCols = []
        for condition in conditions:
            if 'eqCol' in condition and condition['eqCol'] == 'y':
                isExtraOlapCol = True
                exrtaOlapCols.append(condition)
            else:
                normalCols.append(condition)
        # 不需要join其他表里的字段
        if isExtraOlapCol == False:
            sql = "SELECT count(*) FROM " + tableName + " WHERE version = " + str(version) + " AND (" + rule_detail.condition_str + ")"
            return sql;
        # 需要join其他表里的字段
        else:
            whereStr = " WHERE "
            sql = "SELECT COUNT(*) FROM (SELECT * FROM " + tableName + " WHERE version = " + str(version) + " "
            if len(normalCols) > 0:
                sql = sql + " AND ("
            else:
                sql = sql + ") t1"
            for normalCol in normalCols:
                sql = sql + " " + normalCol['column'] + " " + normalCol['function'] + " " + normalCol['value'] + " " + normalCol['link'] + " "
            if len(normalCols) > 0:
                sql = sql[:-4] + " )) t1"
            for exrtaOlapCol in exrtaOlapCols:
                sql = sql + " LEFT JOIN " + exrtaOlapCol['eqOlapTable'] + " ON "
                joinRows = exrtaOlapCol['joinRow']
                for joinRow in joinRows:
                    sql = sql + " t1." + joinRow['col'] + " = " + exrtaOlapCol['eqOlapTable'] + "." + joinRow['aimCol'] + " AND "
                if len(exrtaOlapCol['joinRow']) > 0:
                    sql = sql[:-4]
                whereStr = whereStr + " t1." + exrtaOlapCol['column'] + " = " + exrtaOlapCol['eqOlapTable'] + "." + exrtaOlapCol['eqOlapCol'][0]['fullname'] + " AND "
            sql = sql + whereStr
            sql = sql[:-4]
    except Exception as e:
        print(e)
    return sql;