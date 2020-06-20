from djcelery.models import PeriodicTask, CrontabSchedule, IntervalSchedule
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from api import utils as sqlutils
from common import tools
from common.head import INT_TYPE, LIMIT
from connect.lib.data import *
from connect.olap import OlapClass, kpiTransform
from connect.tasks import dispatching
import datetime, json
from api import utils as sqlutils
from dashboard.models import charttype
import pytz
from connect.lib.data import *
from connect.models import olapcolumn
from api import utils
from api.dashboardapi import dashboardviews
from connect.models import maillogs, systemmessage
from dashboard.models import emailconf,smsconf,syserrorconf,rulelogs,wechatconf,datatable
from connect.models import olap, monitor, monitorDetail
from api.mail_utils import *
from account.models import sys_userextension
import itchat
import datetime, os, platform,time

from common.constantcode import DBTypeCode,LoggerCode

import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)





""" once 代表执行一次(onece)，loop代表循环执行"""

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getColumnBySource(request):
    id = request.GET['id']
    result = {}
    try:
        sql = """select * from connect_sourcedetail a
                        where a.sourceid = '""" + id + """' and  ifshow = '1'
                        """
        sourcerow = source.objects.get(id=id)
        custom = sourcerow.custom
        database = Database.objects.get(id=sourcerow.databaseid)
        databasetype = database.database_type

        session = utils.SqlUtils()
        columns = session.getDictResult(sql)
        for column in columns:  # 将查出来的字典数据再更改后返回给页面
            if column['type'] in INT_TYPE:
                column['ifnum'] = 1
            else:
                column['ifnum'] = 0
            s = Utils.getColumnType(column['type'], COLUMN_TYPE[databasetype])
            column['filtertype'] = s
            if custom == '0':
                column['fullname'] = column['table'] + '__' + column['column']
            else:
                column['fullname'] = column['column']
        result['column'] = columns
    except Exception as error:
        logger.error('---error---file:olapview.py;method:getColumnBySource;error=%s' % error)
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def removeDispatch(request):
    id=request.data['id']
    result={}
    try:
        if id :
            d=dispatch.objects.get(id=id)
            # print(d)
            if d:
                d.delete()
                result['code'] = 1
            else:
                result['code'] = 0
                result['msg']="id不存在"
        else:
            result['code']=0
            result['msg']="id为空！"
    except Exception as e:
        result['code'] = 0
        result['msg'] = e.args
    return Response(result)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getDispatch(request):
    where = ''
    if 'search' in request.GET:
        where = where + """ where  name like '%"""+ request.GET['search'] + """%' """
    if 'page' in request.GET:
        offset = (int(request.GET['page'])-1) * LIMIT
        # dispatchs = sqlutils.getResultBySql(
        #     """select id, "name","desc",quency from connect_dispatch """+ where +"""   order by create_date desc LIMIT """
        #     + str(LIMIT) + ' offset ' + str(offset))
        dispatchs = sqlutils.SqlUtils().getArrResultWrapper("""select id, "name","desc",quency from connect_dispatch """+ where +"""   order by create_date desc LIMIT """
            + str(LIMIT) + ' offset ' + str(offset),logger,'olapview.py','getDispatch')

    else:
        # dispatchs = sqlutils.getResultBySql(
        #     """select id, "name","desc",quency from connect_dispatch  order by create_date desc"""
        # )
        dispatchs = sqlutils.SqlUtils().getArrResultWrapper(
            """select id, "name","desc",quency from connect_dispatch  order by create_date desc""", logger,'olapview.py', 'getDispatch')

    # allcnt = sqlutils.getResultBySql('select count(*) from connect_dispatch '+where)[0][0]
    allcntQuerySet = utils.SqlUtils().getArrResultWrapper('select count(*) from connect_dispatch '+where, logger,'olapview.py', 'getDispatch')
    allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups= []
    for dispatchrow in dispatchs:
        dist = {}
        dist['name'] = dispatchrow[1]
        dist['desc'] = dispatchrow[2]
        dist['id'] = str(dispatchrow[0])
        dist['quency'] = '单次执行' if dispatchrow[3] == 'once' else '循环执行'
        groups.append(dist)
    return Response({'total': allcnt, 'rows': groups})
    # dispatchs = dispatch.objects.all()
    # lists = []
    # for row in dispatchs:
    #     dist = {}
    #     dist['id'] = row.id
    #     dist['name'] = row.name
    #     dist['desc'] = row.desc
    #     dist['quency'] = '单次执行' if row.quency == 'onec' else '循环执行'
    #     lists.append(dist)
    # result = {}
    # result['lists'] = lists
    # return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getDispatchRow(request, pk):
    row = dispatch.objects.get(id=pk)
    dist = {}
    dist['name'] = row.name
    dist['desc'] = row.desc
    dist['id'] = row.id
    dist['quency'] = row.quency
    dist['once'] = {}
    if row.quency == 'once':
        dist['once']['date'] = row.date
    dist['loop'] = {}
    dist['loop']['frequency'] = row.loopmodel
    dist['time'] = row.time
    # dist['loop']['date'] = row.loopdetai
    if row.loopmodel == 'year':
        date = row.loopdetai.split('-')
        dist['loop']['month'] = date[0]
        dist['loop']['day'] = date[1]
    if row.loopmodel == 'week':
        dist['loop']['date'] = row.loopdetai.split(',')
    if row.loopmodel == 'month':
        dist['loop']['date'] = row.loopdetai
    if row.loopmodel == 'intervals':
        ary = row.loopdetai.split('-')
        dist['loop']['intervalsdetail'] = ary[0]
        dist['loop']['intervals'] = ary[1]
    result = {}
    result['row'] = dist
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveDispatch(request):
    data = request.data['data']
    result = {}
    result['code'] = '0'
    if 'desc' in data:
        desc = data['desc']
    else:
        desc = ''
    if data['id'] == '':
        row = dispatch(
            name=data['name'],
            desc=desc,
            quency=data['quency'],
            time=data['time'],
            shorttime=data['shorttime'])
    else:
        row = dispatch.objects.get(id=data['id'])
        row.name = data['name']
        row.desc = data['desc']
        row.quency = data['quency']
        row.time = data['time']
        row.shorttime = data['shorttime']

    if data['quency'] == 'once':
        row.date = data['once']['date']
        row.shortdate = data['onceshortdate']
    else:
        month_of_year = '*'
        day_of_week = '*'
        day_of_month = '*'
        time = data['shorttime']
        timeary = time.split(':')
        hour = int(timeary[0])
        minute = int(timeary[1])
        row.loopmodel = data['loop']['frequency']
        if data['loop']['frequency'] == 'day':
            row.loopdetai = data['time']
        if data['loop']['frequency'] == 'week':
            row.loopdetai = ','.join(data['loop']['date'])
            day_of_week = row.loopdetai
        if data['loop']['frequency'] == 'month':
            row.loopdetai = data['loop']['date']
            day_of_month = row.loopdetai
        if data['loop']['frequency'] == 'year':
            row.loopdetai = data['loop']['month'] + '-' + data['loop']['day']
            day_of_month = data['loop']['day']
            month_of_year = data['loop']['month']

        if data['loop']['frequency'] == 'intervals':
            row.loopdetai = data['loop']['intervalsdetail'] + '-' + data['loop']['intervals']
            row.crontabType = 'intervals'
            cron = IntervalSchedule.objects.get_or_create(every=int(data['loop']['intervalsdetail']), period=data['loop']['intervals'])
        else:
            row.crontabType = 'crontab'
            cron = CrontabSchedule.objects.get_or_create(minute=minute, hour=hour, month_of_year=month_of_year,
                                                     day_of_week=day_of_week, day_of_month=day_of_month)
        row.crontabid = cron[0].pk
    try:
        row.save()
        result['code'] = '1'
    except Exception as e:
        result['msg'] = e.args
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveOlap(request):
    data = request.data['data']
    sourceid = data['sourcekey']
    name = data['name']
    charttype=data['charttype']
    desc = data['desc']
    table = data['table'].lower()
    columns = data['column']
    filters = data['filters']
    dispatchid = data['dispatch']
    tag_config = data['tag_config']
    tag_real = []
    for tagRow in tag_config:
        if tagRow['tagid'] != '' and  tagRow['columns'] != '':
            tag_real.append(tagRow)
    # dispatchconfig = data['dispatchconfig']
    pk = data['id']
    result = {}
    result['code'] = '0'

    expand = data['expand']
    ifexpand = data['ifexpand']
    if ifexpand == 'true':
        if expand['year'] == '' or len(expand['value']) == 0:
            result['code'] = '0'
            result['msg'] = '请填写增加同比环比的必要信息'
            return Response(result)

    try:
        oc = OlapClass().initClass(columns, filters, sourceid, table,expand,ifexpand)
        # 保存sql到connect_olap表的options
        (afterTaskExcSql,newFeildSts)= oc.afterTaskExcSql(columns, filters, table)
        if pk == 0 or pk == '0' or pk == '':#新增的option字段为空
            optionsField={}
        else:#修改需要保存原来option字段的所有值
            srcOptions=olap.objects.get(id=pk).options
            srcOptions=srcOptions if srcOptions else '{}'
            optionsField = json.loads(srcOptions)
        if newFeildSts:#如果有新增字段，把sql加入afterOlapTaskExcSql，如果没有则不保存sql也不运行
            print('afterTaskExcSql=',afterTaskExcSql)
            optionsField['afterOlapTaskExcSql']=afterTaskExcSql
            optionsField['hasNewCols']='y'
        else:
            optionsField['hasNewCols'] = 'n'

        if pk == 0 or pk == '0' or pk == '':
            try:
                row = olap.objects.get_or_create(
                    sourceid=sourceid,
                    name=name,
                    charttype=charttype,
                    desc=desc,
                    columns=columns,
                    filters=filters,
                    dispatchid=dispatchid,
                    expand=expand,
                    ifexpand=ifexpand,
                    enabled='y',
                    tag_config=tag_real,
                    table=table,
                    options=json.dumps(optionsField))
            except Exception as e:
                a = e.args
            pk = row[0].pk
        else:
            row = olap.objects.get(id=pk)
            oldtable = row.table
            row.sourceid = sourceid
            row.name = name
            row.charttype=charttype
            row.desc = desc
            row.enabled = 'y'
            row.columns = columns
            row.filters = filters
            row.dispatchid = dispatchid
            row.ifexpand = ifexpand
            row.expand = expand
            row.tag_config = tag_real
            # row.dispatchconfig = dispatchconfig
            row.table = table
            row.options=json.dumps(optionsField)
            row.save()
            oc.droptable(oldtable)
            olapcolumn.objects.filter(olapid=pk).delete()
        oc.saveDetail(pk)
        try:
            s = oc.saveOlap()
        except Exception as errorSaveOlap:  #当保存olap表异常的时候就删除olapcolumn和olap表里存储的结构，返回错误信息
            olapcolumn.objects.filter(olapid=pk).delete()
            olap.objects.filter(id=pk).delete()
            print('--error--file:olapvieew.py;method:saveolap;errormsg:', errorSaveOlap.args)
            result['code'] = '0'
            result['msg'] = errorSaveOlap.args
            return Response(result)

        # kwarg = {}
        kwarg = '{"olapid":"'+str(pk)+'"}'
        if dispatchid and dispatchid != 0 and dispatchid != '0':
            dispatchrow = dispatch.objects.get(id=dispatchid)
            if dispatchrow.crontabid != 0:
                crontabid = dispatchrow.crontabid
                if dispatchrow.crontabType == 'crontab':
                    # n = PeriodicTask.objects.create(name='insert'+str(pk), task='connect.tasks.dispatching', args=[], kwargs=kwarg, enabled=1,
                    #                             date_changed=datetime.datetime, total_run_count=0, description='',
                    #                             crontab_id=crontabid)

                    # 根据name修改PeriodicTask
                    try:
                        pt = PeriodicTask.objects.get(name='insert' + str(pk))
                    except:
                        pt = None;
                    if pt:
                        tarpdt = PeriodicTask.objects.filter(name='insert'+str(pk)).update(
                            task='connect.tasks.dispatching', args=[],
                            kwargs=kwarg, enabled=1, date_changed=datetime.datetime.now(),
                            total_run_count=0, description='',
                            crontab_id=crontabid)
                    else:
                        n = PeriodicTask.objects.create(name='insert' + str(pk), task='connect.tasks.dispatching',
                                                        args=[], kwargs=kwarg, enabled=1,
                                                        date_changed=datetime.datetime, total_run_count=0,
                                                        description='',
                                                        crontab_id=crontabid)
                else:
                    # n = PeriodicTask.objects.create(name='insert' + str(pk), task='connect.tasks.dispatching', args=[],
                    #                                 kwargs=kwarg, enabled=1,
                    #                                 date_changed=datetime.datetime, total_run_count=0, description='',
                    #                                 interval_id=crontabid)
                    # 根据name修改PeriodicTask
                    try:
                        pt = PeriodicTask.objects.get(name='insert' + str(pk))
                    except:
                        pt = None;
                    if pt:
                        tarpdt = PeriodicTask.objects.filter(name='insert' + str(pk)).update(
                            task='connect.tasks.dispatching', args=[],
                            kwargs=kwarg, enabled=1, date_changed=datetime.datetime.now(),
                            total_run_count=0, description='',
                            crontab_id=crontabid)
                    else:
                        n = PeriodicTask.objects.create(name='insert' + str(pk), task='connect.tasks.dispatching', args=[],
                                                        kwargs=kwarg, enabled=1,
                                                        date_changed=datetime.datetime, total_run_count=0, description='',
                                                        interval_id=crontabid)
                # m = PeriodicTasks.objects.all()
                # if len(m) == 0:
                #     l = PeriodicTasks.objects.create(ident='1', last_update=datetime.datetime)
                # else:
                #     PeriodicTasks.objects.all().update(last_update=datetime.datetime)
        dispatching.delay(pk)#不管是否配置了调度，每次保存成功后都需要执行olap调度
        # 更新olapcolmn如果title为空，则用column赋值给title
        orow = olapcolumn.objects.filter(olapid=pk,title__in=['',None])

        for o in orow:
            o.title = o.column
            o.save()

        result['code'] = '1'
        result['id'] = pk
    except Exception as e:
        print('--error--file:olapvieew.py;method:saveolap;errormsg:',e.args)
        result['code'] = '0'
        result['msg'] = e.args
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def olapDelete(request):
    result = {}
    try:
        if 'olap_data_id' in request.data:
            olap_data_id = request.data['olap_data_id']
            row = olap.objects.get(id=str(olap_data_id))
            row.enabled = 'n'
            row.save()
            ##删除 会禁用调度
            name = 'insert' + str(olap_data_id)
            task = PeriodicTask.objects.filter(name=name)
            # if len(task) > 0:
            #     task.enabled = False
            #     task.save()
            if len(task) > 0:
                task.update(enabled=False)
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        print('file:olapview;method:olapDelete')
        print(e)
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def setOlapStatus(request):
    result = {}
    try:
        if 'olap_data_id' in request.data and 'status' in request.data:
            olap_data_id = request.data['olap_data_id']
            status = request.data['status']
            row = olap.objects.get(id=str(olap_data_id))
            #禁用需要设置 任务池状态
            if status == '1':
                row.status = '0'
                tasksName = 'insert'+str(olap_data_id)
                task = PeriodicTask.objects.filter(name=tasksName).update(enabled=False)
            else:
                row.status = '1'
                tasksName = 'insert'+str(olap_data_id)
                task = PeriodicTask.objects.filter(name=tasksName).update(enabled=False)
            row.save()
        result['code'] = 1
    except Exception as e:
        result['code'] = 0
        print('file:olapview;method:setOlapStatus')
        print(e)
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def startOlapNow(request):
    result = {}
    try:
        if 'olap_data_id' in request.data:
            olap_data_id = request.data['olap_data_id']
            dispatching.delay(olap_data_id)
        result['code'] = 1

        # 业务规则信息同步到olap option中用来场景加载显示，只显示触发的业务规则
        request1 = rulelogs.objects.filter(olap_id=olap_data_id)
        bussRuleMsgs = []
        # 对rulelogs中的monitordetail_id进行去重来控制循环的次数避免重复录入
        monitordetail_ids = []
        for obj in request1:
            monitordetail_ids.append(obj.monitordetail_id)
        monitordetail_ids = set(monitordetail_ids)

        for obj2 in monitordetail_ids:
            request2 = monitorDetail.objects.filter(id=obj2)
            if request2:
                bussRuleMsg = {}
                bussRuleMsg['color'] = request2[0].color
                bussRuleMsg['warningName'] = request2[0].tagname
                bussRuleMsg['advice'] = request2[0].advice_content
                bussRuleMsg['monitorid'] = ""
                bussRuleMsgs.append(bussRuleMsg)
        if request1:
            msg = maillogs.objects.filter(rule_id=request1[0].monitor_id)
        else:
            msg=[]
        objs = olap.objects.get(id=olap_data_id)
        options = objs.options
        if not options:
            options = {}
        if type(options) == type('stringtype'):
            options = json.loads(options)
        options["bussRuleMsg"] = bussRuleMsgs
        if msg:
            for obj in options["bussRuleMsg"]:
                obj['monitorid'] = 'http://' + request.META['HTTP_HOST'] + '/dashboard/msgcenter?id=' + msg[
                    0].id + '&mark=1'
        objs.options = json.dumps(options)
        objs.save()
        # queryobj = sqlutils.getResultBySql('select count(*) from ' + objs.table,sqlutils.DATAXEXTENSION_DB_CHAR)
        queryobjQuerySet = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper('select count(*) from ' + objs.table,
                                                              logger,'olapview.py', 'startOlapNow')
        queryobj = queryobjQuerySet[0][0] if queryobjQuerySet else 0

        # 执行完olap如果表里面没有数据，表示olap执行失败，发送系统报错消息，根据消息配置来发送对应的模块
        #暂时关闭
        mail_to = ''
        queryobj = 1
        if queryobj == 0:
            mail_title = '系统运行错误'
            mail_content = 'olap执行失败'
            obj = syserrorconf.objects.filter(is_use=1)
            if obj:
                # 发送邮件(判断是否启用该功能)
                if obj[0].is_email == 1:
                    tmp = emailconf.objects.filter(status=1)
                    if tmp:
                            mail_to = ''
                            mail_to_user = obj[0].candidate_email
                            for user in mail_to_user.split(','):
                                user = sys_userextension.objects.get(username=user[1:-1])
                                mail_to = mail_to + ',' + user.email
                            sendTextMail(mail_title, mail_content, mail_to[1:], 2)
                # 发送短信(判断是否配置以及启用该功能)
                # if obj[0].is_sms == 1:
                #     tmp = smsconf.objects.filter(status=1)
                #     if tmp:
                #         sendsms()
                # 发送微信
                if obj[0].is_wechat == 1:
                    tmp = wechatconf.objects.filter()
                    if tmp:
                        send_move()
    except Exception as e:
        # 系统报错执行olap出错，发送消息。
        result['code'] = 0
        print('file:olapview;method:startOlapNow')
        print(e)
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def previewOlap(request):
    data = request.data['data']
    sourceid = data['sourcekey']
    page = request.data['page']
    offset = (page - 1) * LIMIT
    columns = data['column']
    filters = data['filters']
    table = data['table']

    print('columns=',columns)
    print('filters=',filters)
    result = {}
    # 判断是否为行转列的元数据
    hasConversion = False
    sourceObj = source.objects.get(id=sourceid)
    sourceOptionsStr = sourceObj.options
    if sourceOptionsStr is not None and sourceOptionsStr != '':
        hasConversion = True
        sourceOptions = json.loads(sourceOptionsStr.replace("'", "\""))['rowToColConfig']
        originId = sourceOptions['originId']
        originName = sourceOptions['originName']
        originTable = sourceOptions['originTable']
        dimList = sourceOptions['dimList']
        columnList = sourceOptions['columnList']
        dataList = sourceOptions['dataList']
        try:
            originDetails = sourcedetail.objects.filter(sourceid=originId)
            originCols = sqlutils.model_list_to_dict_wrapper(originDetails)
            for originCol in originCols:
                originCol['col'] = originCol['column']
                originCol['fullname'] = originCol['table'] + '__' + originCol['column']
                originCol['function'] = 'group'
                originCol['isedit'] = '0'
                originCol['newfiledstatus'] = 0
                originCol['olaptitle'] = ''
                originCol['order'] = 'asc'
            oc = OlapClass().initClass(originCols, [], originId, originTable)
            sql = oc.buildSql()
            result['code'] = 1
            st = stRestoreBySourceId(originId)
            lists = st.getData(sql['sql'])
            # 开始行列转换
            from api.sourceapi import coltorowview as colToRow
            dfRecords, columns = colToRow.colsToRows(lists, dimList, columnList, dataList, 10, originTable)
            result['lists'] = dfRecords
            result['columns'] = columns
        except Exception as e:
            print(e)
            raise
            pass
    if not hasConversion:
        oc = OlapClass().initClass(columns, filters, sourceid, table)
        sql = oc.buildSql()

        result['code'] = 0
        try:
            st = stRestoreBySourceId(sourceid)
            newsql = st.serverPagination(LIMIT, offset, sql)
            lists = st.getData(newsql)
            result['code'] = 1
            sourcerow = source.objects.get(id=sourceid)
            if sourcerow.custom == 0:
                sourcecolumns = getSourceColumn(sourceid)
                result['lists'] = formateRemote(lists, sourcecolumns)
            else:
                result['lists'] = lists
            result['total'] = st.getTotal(sql['sql'])
        except Exception as e:
            result['msg'] = e.args
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def previewExtOlap(request):   #由于column和title的顺序相同，所以显示顺序相同
    id=request.data['id']
    page=request.data['page']
    offset=(page-1)*LIMIT

    olaprow = olap.objects.get(id=id)
    olapcolumns = olapcolumn.objects.filter(olapid=id)

    rowtitle=[]
    selectcolumns=[]
    for col in olapcolumns:
        selectcolumns.append('"'+col.column+'"')
        rowtitle.append(col.title)
    result={}
    try:
        sql = 'select ' + (','.join(selectcolumns)) + ' from ' + olaprow.table + ' LIMIT ' + str(LIMIT) + ' offset ' + str(offset)

        # dispatchs = sqlutils.getResultBySql(sql,sqlutils.DATAXEXTENSION_DB_CHAR)
        # data_cnt = sqlutils.getResultBySql("SELECT COUNT(*) FROM " +olaprow.table,sqlutils.DATAXEXTENSION_DB_CHAR)[0][0]
        dispatchs = []
        data_cnt = []
        executeSession = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        try:
            dispatchs = executeSession.getArrResult(sql)
            data_cnt = executeSession.getArrResult("SELECT COUNT(*) FROM " +olaprow.table)
        except Exception as error:
            executeSession.rollBack()
            logger.error('---error---file:accountview.py;method:getUsersByOrgId;error:%s' % error)
        executeSession.closeConnect()

        alldata=[]
        for dispatchrow in dispatchs:
            rowdata = {}
            i=0
            for col in selectcolumns:
                rowdata[col]=dispatchrow[i]
                i+=1
            alldata.append(rowdata)

        result['columns'] = selectcolumns
        result['alldata'] = alldata
        result['total']=data_cnt
        result['rowtitle']=rowtitle
        result['code']=1
    except Exception as e:
        result['code']=0
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def olapdetail(request, pk):
    row = olap.objects.get(id=pk)
    dist = {}
    dist['sourceid'] = row.sourceid
    dist['name'] = row.name
    ##charttype
    dist['charttype']=row.charttype
    dist['desc'] = row.desc
    dist['columns'] = json.loads(row.columns.replace("'", "\""))
    dist['filters'] = json.loads(row.filters.replace("'", "\""))
    try:
        dist['dispatchconfig'] = json.loads(row.dispatchconfig.replace("'", "\""))
    except Exception as e:
        a = e.args
        pass
    dist['table'] = row.table
    dist['status'] = row.status
    dist['dispatchid'] = row.dispatchid
    dist['businesstype'] = row.businesstype
    dist['ifexpand'] = row.ifexpand
    try:
        dist['expand'] = json.loads(row.expand.replace("'", "\"")) if row.expand is not None or row.expand != '' else {}
        dist['tag_config'] = json.loads(row.tag_config.replace("'", "\"")) if row.tag_config is not None else []
    except Exception as e:
        dist['expand'] = {}
        dist['tag_config'] = []
        pass
    return Response(dist)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlaplists(request):
    where = """where co.olaptype = 'olap' and co.enabled = 'y'  """
    if 'search' in request.GET:
        where = where + """ and co.name like '%"""+ request.GET['search'] + """%' """
    if 'types' in request.GET:
        where=where+""" and co.charttype in ("""+request.GET['types']+""") """
    if 'page' in request.GET:
        offset = (int(request.GET['page'])-1) * LIMIT
        # olaps = sqlutils.my_sql_query(
        #     """select id, "name","desc",businesstype,status from connect_olap """+ where +"""   order by create_date desc LIMIT """
        #     + str(LIMIT) + ' offset ' + str(offset))
        querySqlStr = """select co.id, co.name,co.desc,co.businesstype,co.status,dc.type_name,co.options,co.directconn,co.sourceid,co.charttype,co.tag_config,co.execute_status from connect_olap co left join dashboard_charttype dc on co.charttype=dc.id """ + where + """   order by co.create_date desc LIMIT """\
                      + str(LIMIT) + ' offset ' + str(offset)
        # olaps = sqlutils.getResultBySql(querySqlStr)
        olaps = utils.SqlUtils().getArrResultWrapper(querySqlStr,logger,'olapview.py', 'getOlaplists')


    else:
        # olaps = sqlutils.my_sql_query(
        #     """select id, "name","desc",businesstype,status from connect_olap WHERE  enabled = 'y' order by create_date desc"""
        # )
        querySqlStr = """select co.id, co.name,co.desc,co.businesstype,co.status,dc.type_name,co.options,co.directconn,co.sourceid,co.charttype,co.tag_config,co.execute_status from connect_olap co left join dashboard_charttype dc on co.charttype=dc.id  WHERE  co.enabled = 'y' order by co.create_date desc"""
        # olaps = sqlutils.getResultBySql(querySqlStr)
        olaps = utils.SqlUtils().getArrResultWrapper(querySqlStr, logger,'olapview.py', 'getOlaplists')

    # allcnt = sqlutils.getResultBySql('select count(*) from connect_olap co '+where)[0][0]
    allcntQuerySet = utils.SqlUtils().getArrResultWrapper('select count(*) from connect_olap co '+where,
                                                          logger,'olapview.py', 'getOlaplists')
    allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups= []
    for olaprow in olaps:
        dist = {}
        dist['id'] = str(olaprow[0])
        dist['name'] = olaprow[1]
        dist['description'] = olaprow[2]
        dist['group'] = olaprow[3]
        dist['status'] = olaprow[4]
        dist['charttype'] = olaprow[5]
        if olaprow[6]:#获取isImportData的值
            try:
                optionsData = json.loads(olaprow[6])
                dist['isImportData'] = optionsData['isImportData'] if 'isImportData' in optionsData else False
            except Exception as e:
                dist['isImportData'] = False
        else:
            dist['isImportData']=False
        dist['directconn']=olaprow[7]
        dist['sourceid']=olaprow[8]
        dist['charttypeid']=olaprow[9]
        dist['tag_config']=olaprow[10]
        dist['executestatus']=olaprow[11]
        groups.append(dist)
    return Response({'total': allcnt, 'rows': groups})

#通过olapid获取olap,如有其它需要可以添加返回值
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlapObjById(request):
    resultObj = tools.successMes()
    try :
        olapId = request.GET['id'] #如果没有id传入就抛出异常到页面
        olapObj = olap.objects.get(id=olapId)
        tempOlapObj = {}
        tempOlapObj['id'] = olapObj.id
        tempOlapObj['sourceid'] = olapObj.sourceid
        tempOlapObj['name'] = olapObj.name
        tempOlapObj['charttype'] = olapObj.charttype
        resultObj['data'] = tempOlapObj
    except Exception as error :
        resultObj = tools.errorMes(error.args)
        print('--getOlapObjById error-file:olapview.py;method:getOlapObjById;line:751;error=',error)
    return Response(resultObj)

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getOlapTypelists(request):
    exesql="""select co.charttype,dc.type_name from connect_olap co left join dashboard_charttype dc on co.charttype=dc.id WHERE  co.enabled = 'y' GROUP BY co.charttype,dc.type_name"""
    # olaptypes=sqlutils.getResultBySql(exesql)
    olaptypes = utils.SqlUtils().getArrResultWrapper(exesql,logger,'olapview.py', 'getOlapTypelists')
    types=[]
    for tp in olaptypes:
        if tp[0]:#kpi的数据没有charttype
            type={}
            type['id']=tp[0]
            type['name']=tp[1]
            types.append(type)
    return Response({'types':types})

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def previewKpi(request):
    data = request.data['data']
    sourceid = data['sourcekey']
    kpiclass = kpiTransform()
    config = kpiclass.kpiConfigToOlap(data)
    page = request.data['page']
    offset = (page - 1) * LIMIT
    columns = config['columns']
    filters = config['filters']
    table = config['table'].lower()
    oc = OlapClass().initClass(columns, filters, sourceid, table)
    sql = oc.buildSql()
    result = {}
    result['code'] = 0
    try:
        st = stRestoreBySourceId(sourceid)
        newsql = st.serverPagination(LIMIT, offset, sql)
        lists = st.getData(newsql)
        result['code'] = 1
        sourcecolumns = getSourceColumn(sourceid)
        result['lists'] = formateRemote(lists, sourcecolumns)
        result['total'] = st.getTotal(sql['sql'])
        result['column'] = columns
    except Exception as e:
        result['msg'] = e.args
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveKpi(request):
    data = request.data['data']
    kpiclass = kpiTransform()
    data = kpiclass.kpiConfigToOlap(data)
    sourceid = data['sourcekey']
    name = data['name']
    desc = data['desc']
    table = data['table']
    columns = data['columns']
    filters = data['filters']
    dispatchid = data['dispatch']
    pk = data['id']
    result = {}
    result['code'] = '0'
    try:
        oc = OlapClass().initClass(columns, filters, sourceid, table)
        if pk == 0 or pk == '0' or pk == '':
            row = olap.objects.get_or_create(
                sourceid=sourceid,
                name=name,
                desc=desc,
                columns=columns,
                filters=filters,
                enabled='y',
                dispatchid=dispatchid,
                table=table,
                ifexpand=False,
                expand=json.dumps({'value': '', 'year': '', 'month': '', 'quota': [{'year': '', 'column': '', 'quotavalue': ''}]}),#必须要给默认值，不然回报错
                olaptype='kpi')
            pk = row[0].pk
        else:
            row = olap.objects.get(id=pk)
            oldtable = row.table
            row.sourceid = sourceid
            row.name = name
            row.desc = desc
            row.columns = columns
            row.filters = filters
            row.enabled='y'
            row.dispatchid = dispatchid
            row.table = table
            row.save()
            oc.droptable(oldtable)
        oc.saveDetail(pk)
        s = oc.saveOlap()
        kwarg = '{"olapid":'+str(pk)+'}'
        if dispatchid != 0 and dispatchid != '0':
            dispatchrow = dispatch.objects.get(id=dispatchid)
            if dispatchrow.crontabid != 0:
                crontabid = dispatchrow.crontabid
                # n = PeriodicTask.objects.create(name='insert'+str(pk), task='connect.tasks.dispatching', args=[], kwargs=kwarg, enabled=1,
                #                                 date_changed=datetime.datetime, total_run_count=0, description='',
                #                                 crontab_id=crontabid)

                # 根据name修改PeriodicTask
                try:
                    pt=PeriodicTask.objects.get(name='insert'+str(pk))
                except:
                    pt=None;
                if pt:
                    tarpdt = PeriodicTask.objects.filter(name='insert' + str(pk)).update(task='connect.tasks.dispatching', args=[],
                                                            kwargs=kwarg, enabled=1,date_changed=datetime.datetime.now(),
                                                            total_run_count=0, description='',
                                                            crontab_id=crontabid)
                    # tarpdt.update(name='insert' + str(pk))
                    # tarpdt.update(task='connect.tasks.dispatching')
                    # tarpdt.update(args=[])
                    # tarpdt.update(kwargs=kwarg)
                    # tarpdt.update(enabled=1)
                    # tarpdt.update(total_run_count=0)
                    # tarpdt.update(description='')
                    # tarpdt.update(crontab_id=crontabid)
                    # tarpdt.update(date_changed=datetime.datetime.now())
                else:
                    n = PeriodicTask.objects.create(name='insert'+str(pk), task='connect.tasks.dispatching', args=[], kwargs=kwarg, enabled=1,
                                                    date_changed=datetime.datetime, total_run_count=0, description='',
                                                    crontab_id=crontabid)
            else:
                dispatching.delay(pk)
        else:
            dispatching.delay(pk)

        result['code'] = '1'
    except Exception as e:
        raise e
        result['msg'] = e.args
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getKpilists(request):
    where = """where olaptype = 'kpi' and enabled='y' """
    if 'search' in request.GET:
        where = where + """ and name like '%""" + request.GET['search'] + """%' """
    if 'page' in request.GET:
        offset = (int(request.GET['page']) - 1) * LIMIT
        querySqlStr = """select id, "name","desc","status",businesstype from connect_olap """ + where + """   order by create_date desc LIMIT """\
            + str(LIMIT) + ' offset ' + str(offset)
        # olaps = sqlutils.getResultBySql(querySqlStr)
        # olaps = utils.SqlUtils().getArrResultWrapper(querySqlStr, logger,'olapview.py', 'getKpilists')

    else:
        querySqlStr = """select id, "name","desc","status",businesstype from connect_olap  order by create_date desc"""
        # olaps = sqlutils.getResultBySql(querySqlStr)
        # olaps = utils.SqlUtils().getArrResultWrapper(querySqlStr, logger,'olapview.py', 'getKpilists')

    # allcnt = sqlutils.getResultBySql('select count(*) from connect_olap ' + where)[0][0]
    olaps = []
    executeSession = utils.SqlUtils()
    try:
        allcntQuerySet = executeSession.getArrResult('select count(*) from connect_olap ' + where)
        olaps = executeSession.getArrResult(querySqlStr)
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:olapview.py;method:getKpilists;error:%s' % error)
    executeSession.closeConnect()
    allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups = []
    for olaprow in olaps:
        dist = {}
        dist['name'] = olaprow[1]
        dist['description'] = olaprow[2]
        dist['status'] = olaprow[3]
        dist['id'] = str(olaprow[0])
        dist['group'] = olaprow[4]
        groups.append(dist)
    return Response({'total': allcnt, 'rows': groups})


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def kpidetail(request, pk):
    row = olap.objects.get(id=pk)
    dist = {}
    dist['sourceid'] = row.sourceid
    dist['name'] = row.name
    dist['desc'] = row.desc
    dist['columns'] = json.loads(row.columns.replace("'", "\""))
    dist['indicators'] = {}
    dist['selectedlists'] = []
    for columnrow in dist['columns']:
        if columnrow['kpitype'] == 'indicator':
            dist['indicators'] = columnrow
        else:
            dist['selectedlists'].append(columnrow)
    dist['filters'] = json.loads(row.filters.replace("'", "\""))
    dist['table'] = row.table
    dist['status'] = row.status
    dist['dispatchid'] = row.dispatchid
    dist['businesstype'] = row.businesstype
    return Response(dist)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def validatetable(request):
    name = request.data['name']
    id = ''
    if 'id' in request.data:
        id = request.data['id']
    result = {}
    if id != '':
        row = olap.objects.get(id=id)
        if row.table == name:
            try:
                row = dispatchlog.objects.get(olapid=id, tablename=name, status='running')
                result['code'] = '0'
                result['msg'] = '此表数据正在进行更新，请稍后再试'
                return Response(result)
            except Exception as error:
                result['code'] = '1'
                return Response(result)
    try:
        session = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        lists = session.getArrResult('select * from '+name+' limit 1 offset 1')

        result['code'] = '0'
        result['msg'] = '表名已经存在'
    except:
        print('the table of this name:'+name+' does\'nt  exist')
        result['code'] = '1'
    return Response(result)


# 查询业务规则
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getMonitorList(request):
    result = {}
    try:
        where = " where enabled = 'y' "
        if 'search' in request.GET:
            where = where + " and title like '%" +  request.GET['search'] + "%'"
        sql = """SELECT id,warning_name,proposal_content,modify_date FROM connect_monitor """ + "ORDER BY create_date desc """
        if 'page' in request.GET:
            offset = (int(request.GET['page']) - 1) * LIMIT
            sql = sql + """ LIMIT """ + str(LIMIT) + """ offset """ + str(offset)
        # monitor_cnt = sqlutils.getResultBySql("SELECT COUNT(*) FROM connect_monitor" + where)[0][0]
        # query_result = sqlutils.getResultBySql(sql)
        query_result = []
        executeSession = utils.SqlUtils()
        try:
            monitor_cntQuerySet = executeSession.getArrResult("SELECT COUNT(*) FROM connect_monitor" + where)
            query_result = executeSession.getArrResult(sql)
        except Exception as error:
            print('erroraaaaa',error)
            executeSession.rollBack()
            logger.error('---error---file:olapview.py;method:getMonitorList;error:%s' % error)
        executeSession.closeConnect()
        monitor_cnt = monitor_cntQuerySet[0][0] if monitor_cntQuerySet else 0

        monitor_list = []
        for monitor_row in query_result:
            dist = {}
            dist['id'] = monitor_row[0]
            dist['title'] = monitor_row[1]
            dist['desc'] = monitor_row[2]
            if monitor_row[3]:
                dist['modify_date'] = monitor_row[3].strftime("%Y-%m-%d %H:%M:%S")
            else:
                dist['modify_date'] = monitor_row[3]

            monitor_list.append(dist)
        result['code'] = '1'
        result['total'] = monitor_cnt
        result['rows'] = monitor_list
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
    return Response(result)


# 保存业务规则分类
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveMonitorType(request):
    title = request.data['title']
    desc = request.data['desc']
    result = {}
    try:
        row = monitortype.objects.get_or_create(title=title, desc=desc)
        result['code'] = '1'
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
    return Response(result)

# 编辑业务规则
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def editmonitor(request):
    id = ''
    if 'id' in request.query_params:
        id = request.GET['id']
    result = {}
    if id != '':
        obj = monitor.objects.get(id=id)
        monitordetail = {}
        monitorconfig = {}
        monitordetail['warning_name'] = obj.warning_name
        monitordetail['proposal_content'] = obj.proposal_content
        monitordetail['warning_type'] = obj.warning_type
        monitordetail['warning_color'] = obj.warning_color
        monitordetail['addressee'] = obj.addressee
        waring_calculation_info = json.loads(obj.waring_calculation_info.replace("'",'"'))
        monitorconfig['group_column_left'] = waring_calculation_info['group_column_left']
        result['monitordetail'] = monitordetail
        result['monitorconfig'] = monitorconfig
    result['code'] = 0
    return Response(result)

# 查询单个业务规则
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getMonitor(request, pk):
    result = {}
    try:
        monitor_id = pk
        monitor_result = monitor.objects.get(id=str(monitor_id))
        monitor_data = {}
        monitor_data['id'] = monitor_result.id
        monitor_data['olapid'] = monitor_result.olapid
        monitor_data['title'] = monitor_result.title
        monitor_data['subtitle'] = monitor_result.subtitle
        monitor_data['monitortype'] = monitor_result.monitortype
        monitor_data['receive_user'] = monitor_result.receive_user
        monitor_data['cc_user'] = monitor_result.cc_user
        monitor_data['desc'] = monitor_result.desc
        result['monitor'] = monitor_data
        monitor_datail_results = monitorDetail.objects.filter(monitorid=str(monitor_id))
        monitor_datail_datas = []
        for monitor_datail_row in monitor_datail_results:
            monitor_datail = {}
            monitor_datail['tagname'] = monitor_datail_row.tagname
            monitor_datail['condition'] = monitor_datail_row.condition
            monitor_datail['color'] = monitor_datail_row.color
            monitor_datail['msg_type'] = monitor_datail_row.msg_type
            monitor_datail['advice_content'] = monitor_datail_row.advice_content
            monitor_datail['issend'] = monitor_datail_row.issend
            monitor_datail['condition_str'] = monitor_datail_row.condition_str
            monitor_datail['show_condition_str'] = monitor_datail_row.show_condition_str
            monitor_datail['use_tables'] = monitor_datail_row.use_tables
            monitor_datail_datas.append(monitor_datail)
        result['monitor_details'] = monitor_datail_datas
        result['code'] = 1
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
        print('file:olapview;method:getMonitor')
        print(e)
    return Response(result)
# 保存业务规则
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveMonitor(request):
    result = {}
    config = request.data['configs']                # 计算信息
    details = request.data['details']               # 基础信息
    id = 'cab2f8380e6c11e9a599ace0100cc367'

    try:
        # 保存业务规则信息
        monitor.objects.create(warning_name=details['warning_name'],proposal_content=details['proposal_content'],
                               warning_type=details['warning_type'],warning_color=details['warning_color'],addressee=details['addressee'],
                               waring_calculation_info=config,contrast_mode=config['contrast_mode'])
    except Exception as e:
        result['code'] = '0'
        result['msg'] = e.args
        print('file:olapview;method:saveMonitor')
        print(e)
    # 调用触发业务规则提醒，检测业务规则是否成立参数1为标志位，不发送系统信息
    try:
        dashboardviews.execute_rules(request, id)
    except Exception as e:
        print('eeeeeeeeeee',e)
        result['code'] = '0'
        result['msg'] = '请检查业务规则是否配置正确'
    return Response(result)


# 删除业务规则
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def monitorDelete(request):
    result = {}
    try:
        if 'monitor_id' in request.data:
            monitor_id = request.data['monitor_id']
            row = monitor.objects.get(id=str(monitor_id))
            row.enabled = 'n'
            row.save()
    except Exception as e:
        print('file:olapview;method:sourceDelete')
        print(e)
    result['code'] = 1
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getMonitorType(request):
    lists = monitortype.objects.all()
    alldatas = []
    for row in lists:
        dist = {}
        dist['title'] = row.title
        dist['id'] = row.id
        alldatas.append(dist)
    return Response(alldatas)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny, ))
def editOdbcOlap(request):
    result={}
    try:
        olapid=request.data['id']
        olapObj = olap.objects.get(id=olapid)
        olapname=request.data['olapname']
        description=request.data['desc'] if 'desc' in request.data else ''
        # sourceid=request.data['sourceid'] if 'sourceid' in request.data else olapObj.sourceid
        dtypeid=request.data['dtypeid'] if 'dtypeid' in request.data else olapObj.dtypeid
        tag_config=request.data['tag_config'] if 'tag_config' in request.data else []
        olapObj.name=olapname
        olapObj.desc=description
        # olapObj.sourceid=sourceid
        olapObj.charttype=dtypeid
        olapObj.tag_config=tag_config
        olapObj.save()
        result['code'] = 1
    except Exception as e:
        raise e
        result['code']=0
        result['msg']=e.args
    return Response(result)


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def getDispatchLogs(request):
    results = tools.successMes()
    try:
        #获取表数据
        sql = 'SELECT {0} FROM connect_dispatchlog WHERE 1 = 1 '
        listSql = sql.format('*')
        countSql = sql.format('count(*)')
        # 拼接查询条件
        where = " "
        if 'search' in request.data:
            searchkey = request.data['search']
            where = where + """ AND "olapname" like '%""" + searchkey + """%' """
            listSql = listSql + where
            countSql = countSql + where
        if 'status' in request.data:
            status = request.data['status']
            if status == 'success':
                where = where + """ and "currstatus"  = '调度成功！' """
            elif status == 'error':
                where = where + """ and "currstatus"  != '调度成功！' """
            listSql = listSql + where
            countSql = countSql + where


        listSql = listSql + ' ORDER BY "modify_date" DESC'
        # 拼接分页条件
        if 'page' in request.data:
            if 'limit' in request.data:
                limit = request.data['limit']
            else:
                limit = LIMIT
            offset = (int(request.data['page']) - 1) * limit
            listSql = listSql + ' LIMIT ' + str(limit) + ' offset ' + str(offset)

        rows = []
        executeSession = utils.SqlUtils()
        try:
            totalForQuerySet = executeSession.getArrResult(countSql)
            rows = executeSession.getDictResult(listSql)
        except Exception as error:
            executeSession.rollBack()
            logger.error('---error---file:olapview.py;method:getDispatchLogs;error:%s' % error)
        executeSession.closeConnect()
        total = totalForQuerySet[0][0] if totalForQuerySet else 0

        results['rows'] = rows
        results['total'] = total
        pass
    except Exception as e:
        print('file:sourceview;method:getDispatchLogs')
        print(e)
        return Response(tools.errorMes(e.args))
    return Response(results)
#
# @api_view(http_method_names=['GET'])
# @permission_classes((permissions.AllowAny,))
# def getTableStructById(request):
#     resultObj = tools.successMes()
#     try:
#         tableId = request.GET['tableId'] if 'tableId' in request.GET else ''
#         if not tableId:
#             raise Exception('tableId为空！')
#         queryDataTableSet = datatable.objects.get(id=tableId)
#
#         dataTableObj = {}#返回值
#         dataTableObj['name'] = queryDataTableSet.name
#         dataTableObj['kind'] = queryDataTableSet.kind
#         dataTableObj['jsonconfig'] = queryDataTableSet.jsonconfig
#         dataTableObj['remark'] = queryDataTableSet.remark
#         dataTableObj['createname'] = queryDataTableSet.createname
#         resultObj['data'] = dataTableObj
#     except Exception as error:
#         resultObj = tools.errorMes(error)
#     return Response(resultObj)

#从jsonConfig中获取需要的信息以字典的形式返回
def getDictDataFromJsonConfig(jsonConfig):
    if type(jsonConfig) == type('stringstringstring'):
        jsonConfig = json.loads(jsonConfig)
    rsDict = {}
    # rsDict['olapId'] = jsonConfig['key']
    rsDict['feildList'] = []#保存所有表的字段
    rsDict['feildDetailedList'] = []#保存表字段的详细信息（包括olapid和name等）
    if jsonConfig['coors']:
        for metaObj in jsonConfig['coors']:
            if metaObj['meta'] and 'cellDataSource' in metaObj['meta'] and metaObj['meta']['cellDataSource']:
                rsDict['feildList'].append(metaObj['meta']['cellDataSource']['col'])
                rsDict['feildDetailedList'].append(metaObj['meta']['cellDataSource'])
                rsDict['olapId'] = metaObj['meta']['cellDataSource']['olapid']#获取olapid
    return rsDict
#拼接limitSql
def generalLimitSql(limitSearchObjList,fieldPrefix):
    limitSql = []
    for limitObj in limitSearchObjList:
        limitSql.append(' and ' + fieldPrefix + limitObj['key'].lstrip() + limitObj['operator'] + "'" + limitObj['value'] + "'")
    if limitSql:
        return ' where 1=1 ' + ' '.join(limitSql)
    else:
        return ''

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def getTableDataByOlapId(request):
    resultObj = tools.successMes()
    try:
        tableId = request.data['tableId']
        pageCount = request.data['pageCount']
        pageTotalRow = request.data['pageTotalRow']
        limitSearch = request.data['limitSearch']

        #get dataTable by id
        dataTableObj = datatable.objects.get(id=tableId)
        dataTableDictObj = {}  # 返回值
        dataTableDictObj['name'] = dataTableObj.name
        dataTableDictObj['kind'] = dataTableObj.kind
        dataTableDictObj['jsonconfig'] = dataTableObj.jsonconfig
        dataTableDictObj['remark'] = dataTableObj.remark
        dataTableDictObj['createname'] = dataTableObj.createname
        resultObj['dataTableStruct'] = dataTableDictObj

        #从datatable的jsonconfig里获取的字典信息
        dictDataFromJsonConfig = getDictDataFromJsonConfig(dataTableObj.jsonconfig)
        # print('----dictDataFromJsonConfig=',dictDataFromJsonConfig)
        #根据olap来获取数据（分数据提取和实时）
        olapObjByOlapId = olap.objects.get(id=dictDataFromJsonConfig['olapId'])

        querySet = []#查询的sql，数据提取就从olap中buildsql，实时就从DataSource里获取
        if olapObjByOlapId.directconn == 'mt':#实时
            sourceObj = source.objects.get(id=olapObjByOlapId.sourceid)
            session = sqlutils.SqlUtils(DBTypeCode.CUSTOM_DB.value,sourceObj.databaseid)
            if dictDataFromJsonConfig['feildList']:
                queryFieldList = ['tb.' + x.lstrip() for x in dictDataFromJsonConfig['feildList']]
                querySql = 'select ' + ','.join(queryFieldList) + ' from (' + sourceObj.sql + ') tb ' + generalLimitSql(limitSearch,'tb.')
                skipPageCount = (pageCount - 1) if (pageCount - 1) > 0 else 0
                # querySql = session.serverPaginationNoOrder(pageTotalRow, skipPageCount * pageTotalRow, querySql)
                print('--querySql=',querySql)
                # querySet = session.getDictResult(querySql)#获取字典结果
                querySet = session.getDataFromServerPaginationNoOrder(pageTotalRow, skipPageCount * pageTotalRow, querySql)
        else:#数据提取
            # columns = json.loads(olapObjByOlapId.columns.replace("'", "\""))
            # filters = json.loads(olapObjByOlapId.filters.replace("'", "\""))
            # oc = OlapClass().initClass(columns, filters, olapObjByOlapId.sourceid, olapObjByOlapId.table,
            #                            olapObjByOlapId.expand,olapObjByOlapId.ifexpand)
            # querySqlDict = oc.buildSql()
            if dictDataFromJsonConfig['feildList']:
                dictDataFromJsonConfig['feildList'].extend(['keyorder','version'])
                querySql = 'select ' + ','.join(dictDataFromJsonConfig['feildList']) + ' from ' + olapObjByOlapId.table + ' ' + generalLimitSql(limitSearch,'')
                session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
                # querySql = session.serverPaginationNoOrder(pageTotalRow, (pageCount - 1) * pageTotalRow, querySql)
                print('-olap-querySql=', querySql)
                # querySet = session.getDictResult(querySql)  # 获取字典结果
                querySet = session.getDataFromServerPaginationNoOrder(pageTotalRow, (pageCount - 1) * pageTotalRow, querySql)
        # print('---querySet=', querySet)
        try:
            session.closeConnect()#关闭session
        except Exception as Err:
            print('------session close error-------')
        resultObj['rowData'] = querySet
    except Exception as error:
        resultObj['rowData'] = []#如果查询数据出错，则置为空
        resultObj = tools.errorMes(error)
    return Response(resultObj)
