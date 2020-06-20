from __future__ import absolute_import

from celery import shared_task
from celery import task

from api.utils import *
from common.constantcode import DBTypeCode,LoggerCode
from common import head
from connect import taskkit as kit
from connect.lib.data import *
from connect.olap import *
from api.sourceapi import coltorowview

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)


@shared_task
def dispatching(olapid):
    row = olap.objects.get(id=olapid)
    olap.objects.filter(id=olapid).update(execute_status='running')
    sourceid = row.sourceid
    olap_name = row.name
    tablename=row.table
    olap_type = row.olaptype
    if row.options:
        opt = json.loads(row.options)#options字段
    else:
        opt={}
    columns= json.loads(row.columns.replace("'", "\""))
    filters= json.loads(row.filters.replace("'", "\""))
    expand=''
    if row.ifexpand=='true':
        expand = json.loads(row.expand.replace("'", "\""))
    table = row.table
    logrow = dispatchlog.objects.get_or_create(olapid=olapid,olapname=olap_name,tablename=table,totalcount=0,nowcount=0,errorcount=0,starttime=datetime.datetime.now(),status='starting')
    logid = logrow[0].pk
    # 判断是否为行列转换过的olap
    isColConversion = False
    conversionSourceObj = source.objects.get(id=sourceid)
    if conversionSourceObj.options:
        conversionOptions = json.loads(conversionSourceObj.options.replace("'", "\""))
        if 'originId' in conversionOptions['rowToColConfig']:
            isColConversion = True
    if not isColConversion:
        oc = OlapClass().initClass(columns, filters, sourceid, table, expand,
                                   row.ifexpand)
    dispatchLogs = []
    dispatchOptions = {'historyRecords': []}
    currStatus = '获取源数据开始'
    dispatchlog.objects.filter(id=logid).update(currstatus=currStatus, status='running', starttime=datetime.datetime.now())
    dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
    total = 0
    try:
        if not isColConversion:
            #获取数据条数
            total = oc.getValueTotal()
            #end
            #获取数据
            thistable = oc.startInsert()
            listsObj = oc.getValue()
            #end
        else:
            originId = conversionOptions['rowToColConfig']['originId']
            originTable = conversionOptions['rowToColConfig']['originTable']
            originSource = source.objects.get(id=originId)
            originSourceDetails = sourcedetail.objects.filter(sourceid=originId)
            originSourceColumns = utils.model_list_to_dict_wrapper(originSourceDetails)
            for originSourceColumn in originSourceColumns:
                originSourceColumn['formula'] = originSourceColumn['column_formula']
                originSourceColumn['field'] = originSourceColumn['formatcolumn']

            st = stRestoreById(originSource.databaseid)
            sql = st.sqlBuild([{'item': originTable}], originSourceColumns)
            rows = st.getData(sql)
            # 四则运算和正则的渲染列
            rows = formateRemote(rows, originSourceColumns)
            lists, conversionColumns = coltorowview.colsToRows(rows, conversionOptions['rowToColConfig']['dimList'], conversionOptions['rowToColConfig']['columnList'], conversionOptions['rowToColConfig']['dataList'], None, originTable)
        currStatus = '获取源数据结束,获取到数据' + str(total) + '条'
        dispatchlog.objects.filter(id=logid).update(totalcount=total, currstatus=currStatus)
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
    except Exception as e:
        olap.objects.filter(id=olapid).update(execute_status='running')
        currStatus = '获取源数据异常, 原因:' + str(e.args)
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
        raise Exception("获取源数据异常!", str(e.args))
    finally:
        updateLogOptions(logid, dispatchOptions, dispatchLogs, currStatus)

    #版本号
    maxVarsion = "select max(version) as version from " + table
    # rs = getResultBySql(maxVarsion,DATAXEXTENSION_DB_CHAR)
    rs = SqlUtils(dbType=DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(maxVarsion,logger, 'tasks.py','dispatching')

    if not rs[0][0] or rs[0][0] == None or rs[0][0] == 'Null':
        version = 1
    else:
        version = int(rs[0][0]) + 1

    if not isColConversion:
        columnslists = thistable.columns

    rowcount=0
    sql=''
    onlyPandasCalc=False    #标志是否是pandas执行返回sql还是因为ifexpand为false时返回dataframe的to_dict
    #同比环比字段
    try:
        currStatus = '时间相关数据处理开始:'
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
        if not isColConversion:
            # lists = oc.doExpand(listsObj)
            rowcount,sql=oc.doExpandRsSQL(tablename,columnslists,listsObj,version, sourceid, isColConversion)
            if rowcount>0:
                onlyPandasCalc=True
            else:
                lists=sql   #否则doExpandRsSQL返回的sql的值是pandas的to_dict

        currStatus = '时间相关数据处理结束:'
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
    except Exception as e:
        olap.objects.filter(id=olapid).update(execute_status='running')
        currStatus = '时间相关数据处理异常, 原因:' + str(e.args)
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
        raise Exception("时间相关数据处理异常!", str(e.args))
    finally:
        updateLogOptions(logid, dispatchOptions, dispatchLogs, currStatus)
    #end


    inss = []
    # 拼接用于插入数据的sql
    # rowcount: 即将插入多少条数据
    try:
        if not onlyPandasCalc:
            currStatus = '开始拼接数据录入sql'
            dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
            if not isColConversion:
                sql, rowcount = kit.generateInsertSql(inss, tablename, columnslists, lists, thistable, version, sourceid, isColConversion)
            else:
                columns.append({
                    'fullname': 'add_time'
                })
                columns.append({
                    'fullname': 'version'
                })
                columns.append({
                    'fullname': 'extra_processing'
                })
                columns.append({
                    'fullname': 'keyorder'
                })
                sql, rowcount = kit.generateInsertSql(inss, tablename, columns, lists, None, version, sourceid, isColConversion)
            currStatus = '数据录入sql拼接结束'
            dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
        else:
            currStatus = '数据从pandas里录入成功！'
            dispatchLogs.append('节点:' + currStatus)
    except Exception as e:
        olap.objects.filter(id=olapid).update(execute_status='running')
        currStatus = '数据录入sql拼接异常, 原因:' + str(e.args)
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
        raise Exception("数据录入sql拼接异常!", str(e.args))
    finally:
        updateLogOptions(logid, dispatchOptions, dispatchLogs, currStatus)

    # dbUrl = 'postgresql://' + head.DEFAULT_DB_INFO['user'] + ':' + head.DEFAULT_DB_INFO['pwd'] + '@' + head.DEFAULT_DB_INFO['ip'] + '/' + head.DEFAULT_DB_INFO['db']
    dbUrl = 'postgresql://' + head.DATAXEXTENSION_DB_INFO['user'] + ':' + head.DATAXEXTENSION_DB_INFO['pwd'] + '@' + head.DATAXEXTENSION_DB_INFO['ip'] + '/' + head.DATAXEXTENSION_DB_INFO['db']
    engine = create_engine(dbUrl, echo=False)
    DBSession = sessionmaker(bind=engine)
    session = DBSession()
    #for insertSql in inss:
    try:
        #session.execute(insertSql)
        currStatus = '开始录入数据'
        dispatchlog.objects.filter(id=logid).update(currstatus=currStatus)
        if rowcount >= 0 :#如果拼接的sql的values为空，就不执行sql
            session.execute('delete from ' + tablename)#先删除表中数据再插入，每次跑数只跑当前版本的
            session.execute(sql)
            session.commit()
        session.close()
        #count = count + 1
        #if count == LOG_COUNT or rowcount == totalcount:
        dispatchlog.objects.filter(id=logid).update(nowcount=rowcount)
        currStatus = '录入数据结束，录入' + str(rowcount) + '条数据'
        #    count = 0
    except Exception as e:
        olap.objects.filter(id=olapid).update(execute_status='running')
        session.close()
        currStatus = '录入数据异常, 原因:' + str(e.args)
        dispatchlog.objects.filter(id=logid).update(currstatus=currStatus, status='done')
        raise Exception("录入数据异常!", str(e.args) + 'sql[:1000]:' + sql[:1000])
    finally:
        updateLogOptions(logid, dispatchOptions, dispatchLogs, currStatus)

    if 'hasNewCols' in opt and opt['hasNewCols']=='y' and ('afterOlapTaskExcSql' in opt):
        session = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        try:
            currStatus = 'olap特殊字段过滤开始'
            dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
            #根据sourceid取connect_sourcedetail里的字段，获取关系，对当前插入olap表的数据进行再过滤
            updateVersionToHigh='update '+table+' set "version"=(select max("version") from '+table+')+1 where "version"='+str(version)#先把max(version)修改再删除该version数据
            # print('updateVersionToHigh=', updateVersionToHigh)
            session.executeUpdateSql(updateVersionToHigh)

            afterOlapTaskExcSql=opt['afterOlapTaskExcSql']#两个参数第一个newversion，第二个deleteversion
            afterOlapTaskExcSql="insert into "+table+" "+afterOlapTaskExcSql.format(version,version+1)#拼接插入语句
            # print('afterOlapTaskExcSql=', afterOlapTaskExcSql)
            session.executeUpdateSql(afterOlapTaskExcSql)

            deleteOldVersionData="delete from "+table+" where \"version\"="+str(version+1)#删除旧的version数据
            # print("delete old version data sql=", deleteOldVersionData)
            session.executeUpdateSql(deleteOldVersionData)
            currStatus = 'olap特殊字段过滤结束'
            dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
            session.closeConnect()
        except Exception as e:
            olap.objects.filter(id=olapid).update(execute_status='running')
            session.rollBack()
            currStatus = 'olap特殊字段过滤异常, 原因:' + str(e.args)
            dispatchlog.objects.filter(id=logid).update(currstatus=currStatus, status='done')
            raise Exception("olap特殊字段过滤异常!", str(e.args))
        finally:
            updateLogOptions(logid, dispatchOptions, dispatchLogs, currStatus)

    # olap扩展
    try:
        currStatus = 'olap扩展字段处理开始'
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
        kit.addOlapExtCol(olapid, table)
        currStatus = 'olap扩展字段处理结束'
        dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
    except Exception as e:
        olap.objects.filter(id=olapid).update(execute_status='running')
        currStatus = 'olap扩展字段处理异常, 原因:' + str(e.args)
        dispatchlog.objects.filter(id=logid).update(currstatus=currStatus, status='done')
        raise Exception("olap扩展字段处理异常!", str(e.args))
    finally:
        updateLogOptions(logid, dispatchOptions, dispatchLogs, currStatus)
    # kit.exceteRules(olapid, olap_name, olap_type, table, version)
    olap.objects.filter(id=olapid).update(execute_status='done')
    currStatus = '调度成功！'
    dispatchLogs.append('节点:' + currStatus + '; 时间:' + kit.getCurrTime())
    dispatchOptions['historyRecords'] = dispatchLogs
    dispatchlog.objects.filter(id=logid).update(currstatus=currStatus, status='done', endtime=datetime.datetime.now(), options=json.dumps(dispatchOptions))
    return olapid

@task
def fixedtime_task():
    kit.removeUploadTmpFile()#删除temp_files及其下所有文件
    kit.updateTableVersion()#删除olap的version<(maxversion-2)的数据



def updateLogOptions(logid, dispatchOptions, dispatchLogs, currStatus):
    dispatchOptions['historyRecords'] = dispatchLogs
    dispatchlog.objects.filter(id=logid).update(currstatus=currStatus, status='done',
                                                options=json.dumps(dispatchOptions))



# 最终生成的sql示例
# 直接关联
# UPDATE contract_amount_dept_20180418
# SET ext_col_num_1 = (
# 	SELECT
# 		SUM (
# 			datax_contract__contract_amount
# 		)
# 	FROM
# 		contract_info_20180417
# 	WHERE
# 		contract_info_20180417.datax_contract__dept_name = contract_amount_dept_20180418.datax_contract__dept_name 
# AND contract_info_20180417.datax_contract__year = contract_amount_dept_20180418.datax_contract__year
# AND contract_info_20180417.datax_contract__month = contract_amount_dept_20180418.datax_contract__month
# )
# WHERE	"version" = (SELECT MAX ("version")FROM contract_amount_dept_20180418)

# 计算关联
# UPDATE
#     contract_amount_dept_20180418
# SET
#     ext_col_num_3 = (
#         SELECT
#             ttt1.cc1
#         FROM
#             (
#                 SELECT
#                     (tt1.c1 + tt2.c1 + tt3.c1) cc1,
#                     tt1.c2,
#                     tt1.c3,
#                     tt1.c4
#                 FROM
#                     (
#                         SELECT
#                             SUM (datax_contract__contract_amount) c1,
#                             datax_contract__dept_name c2,
#                             datax_contract__year c3,
#                             datax_contract__month c4
#                         FROM
#                             contract_amount_dept_20180418
#                         WHERE
#                             "version" = (
#                                 SELECT
#                                     MAX ("version")
#                                 FROM
#                                     contract_amount_dept_20180418
#                             )
#                         GROUP BY
#                             datax_contract__dept_name,
#                             datax_contract__year,
#                             datax_contract__month
#                     ) tt1,
#                     (
#                         SELECT
#                             SUM (datax_contract__contract_amount) c1,
#                             datax_contract__dept_name c2,
#                             datax_contract__year c3,
#                             datax_contract__month c4
#                         FROM
#                             contract_info_20180417
#                         WHERE
#                             "version" = (
#                                 SELECT
#                                     MAX ("version")
#                                 FROM
#                                     contract_info_20180417
#                             )
#                         GROUP BY
#                             datax_contract__dept_name,
#                             datax_contract__year,
#                             datax_contract__month
#                     ) tt2,
#                     (
#                         SELECT
#                             SUM (datax_contract__purecontract_amount) c1,
#                             datax_contract__dept_name c2,
#                             datax_contract__year c3,
#                             datax_contract__month c4
#                         FROM
#                             contract_info_20180417
#                         WHERE
#                             "version" = (
#                                 SELECT
#                                     MAX ("version")
#                                 FROM
#                                     contract_info_20180417
#                             )
#                         GROUP BY
#                             datax_contract__dept_name,
#                             datax_contract__year,
#                             datax_contract__month
#                     ) tt3
#                 WHERE
#                     1 = 1
#                     AND tt1.c2 = tt2.c2
#                     AND tt1.c3 = tt2.c3
#                     AND tt1.c4 = tt2.c4
#                     AND tt1.c2 = tt3.c2
#                     AND tt1.c3 = tt3.c3
#                     AND tt1.c4 = tt3.c4
#             ) ttt1
#         WHERE
#             1 = 1
#             AND contract_amount_dept_20180418.datax_contract__dept_name = ttt1.c2
#             AND contract_amount_dept_20180418.datax_contract__year = ttt1.c3
#             AND contract_amount_dept_20180418.datax_contract__month = ttt1.c4
#     )
# WHERE
#     "version" = (
#         SELECT
#             MAX ("version")
#         FROM
#             contract_amount_dept_20180418
#     );


# 最终生成sql的格式
# SELECT
# 	COUNT (t1.*)
# FROM
# 	(
# 		SELECT
# 			*
# 		FROM
# 			pay_20180409
# 		WHERE
# 			VERSION = 1
# 		AND (
# 			datax_pay__year = 2017
# 			AND datax_pay__month = 4
# 		)
# 	) t1
# LEFT JOIN contract_20180408 ON t1.datax_pay__year = contract_20180408.datax_contract__year
# AND t1.datax_pay__month = contract_20180408.datax_contract__month
# LEFT JOIN revenue_info_20180408 ON t1.datax_pay__year = revenue_info_20180408.datax_revenue__year
# AND t1.datax_pay__month = revenue_info_20180408.datax_revenue__month
# WHERE
# 	t1.datax_pay__pay_amount = contract_20180408.datax_contract__contract_amount
# AND t1.datax_pay__pay_amount = revenue_info_20180408.datax_revenue__revenue_amount    