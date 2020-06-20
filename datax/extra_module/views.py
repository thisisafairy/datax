# encoding: utf-8
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from urllib import parse
from common import tools
from common.constantcode import DBTypeCode,LoggerCode
from dashboard.models import datatable
from connect.models import olap
import xlwt,json
from api import utils as sqlutils
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
import xlrd
from xlrd import xldate_as_tuple
from common.tools import UUIDTools
import time
import datetime
import pandas as pd
import pymysql
from sqlalchemy import create_engine
import logging
import uuid
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def testGetMethod(request):
    resultsObj = tools.successMes()
    try:
        resultsObj['data'] = 'hello datax'
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:customize_extension->views.py;method:test1;error=%s' % error)
    return Response(resultsObj)


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

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveChangedData(request):
    resultsObj = tools.successMes()
    try:
        changeData = request.data['changeddata']
        tableId = request.data['tableid']
        dataTableObj = datatable.objects.get(id=tableId)
        dictObjFromConfig = getDictDataFromJsonConfig(dataTableObj.jsonconfig)
        updatedCount = 0
        olapObj = olap.objects.get(id=dictObjFromConfig['olapId'])
        if olapObj.directconn != 'mt':#本地olap才执行这个方法
            fieldList = dictObjFromConfig['feildList']
            session = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
            for dt in changeData:
                rowValueList = []
                whereSqlStr = ' keyorder = ' + str(dt['keyorder'])
                for field in fieldList:
                    rowValueList.append(field + ' = \'' + str(dt[field]) + '\'')
                if rowValueList and whereSqlStr:
                    updateSql = 'update ' + olapObj.table + ' set ' + ','.join(rowValueList) + ' where ' + whereSqlStr
                    session.executeUpdateSql(updateSql)
                    updatedCount += 1
            session.closeConnect()
        resultsObj['updatedCount'] = updatedCount
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:customize_extension->views.py;method:test1;error=%s' % error)
    return Response(resultsObj)

#销售订单录入
@login_required
def datainput(request):
    return render_to_response("extra_module/indexOrder.html")

# 销售订单保存更新
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveorder(request):
    datas = []
    datas = json.loads(request.data['datas'])     #所有新增或更新数据
    #executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    executeSession = sqlutils.SqlUtils()
    current_mon = time.gmtime().tm_mon
    current_year = time.gmtime().tm_year
    for data in datas:
        if 'id' in data:
            for key in data:
                if data[key] == None:
                    data[key] = ''
            # 更新基本数据数据
            try:
                sql = "update input_basic_orders set saleschannel='" + data["saleschannel"] + "',customer='" + data["customer"] +\
                        "',customertype='" + data["customertype"] + "',owner='" + data["owner"] + "',team='" + data["team"] + "',salesop='" + data["salesop"] +\
                        "',quotation='" + data["quotation"] + "',contract='" + str(data["contract"]) + "',line='" + str(data["line"]) +\
                        "',projectdes='" + data["projectdes"] + "',paymentterm='" + data["paymentterm"] +\
                        "',unitprice ='" + str(data["unitprice"]) + "',moneytype='" + data["moneytype"] + "',pn='" + str(data["pn"]) +\
                        "',power='" + data["power"] + "',product='" + data["product"] + "',forv='" + data["forv"] +\
                        "',importance='" + data["importance"] + "',hg='" + str(data["hg"]) + "',royg='" + data["royg"] +\
                        "',delayremark='" + data["delayremark"] + "',remark='" + data["remark"] + "',year='" + str(data["year"]) +\
                        "',modifyname='" + data["modifyname"] +\
                        "',modifytime='" + data["modifytime"] + "',orderstate='" + data["orderstate"] + "',lastyearsum='" + str(data['lastyearsum']) + "'" + " where id='" + str(data["id"]) + "'"
                executeSession.excuteSqlByBulkParams(sql)
                i = 1
                # 更新12行数据
                while i <= 12:
                    if data['outmonth' + str(i)] == '':
                        data['outmonth' + str(i)] = 0
                    if data['capacitym' + str(i)] == '':
                        data['capacitym' + str(i)] = 0
                    sql = "update input_forecast_orders set out='" + str(data['out' + str(i)]) + "',outmonth='" \
                          + str(data['outmonth' + str(i)]) + "',capacity='" + str(data['capacitym' + str(i)]) + \
                          "' where prediction_mon = '" + str(i) + "' and order_id='" + str(data['id']) + "'" + " and year=" + str(data['year'])
                    i = i + 1
                    print('sqlaaa',sql)
                    executeSession.excuteSqlByBulkParams(sql)
            except Exception as e:
                err = e
        else:
            # 新增数据（基本数据）
            try:
                sql = "insert into input_basic_orders(saleschannel,customer,customertype,owner,team,salesop,quotation," \
                      "contract,line,projectdes,paymentterm,unitprice,pn,power,product,importance,hg,royg," \
                      "delayremark,remark,createtime,year,month,lastyearsum)values('" + data["saleschannel"] + "','" + data["customer"] + "','" + \
                      data["customertype"] + "','" + data["owner"] + "','" + data["team"] \
                      + "','" + data["salesop"] + "','" + data["quotation"] + "','" + data["contract"] \
                      + "','" + data["line"] + "','" + data["projectdes"] + "','" + data["paymentterm"] + "','" + str(data["unitprice"]) \
                      + "','" + data["pn"] + "','" + data["power"] + "','" + data["product"] \
                      + "','" + data["importance"] + "','" + data["hg"] + "','" + data["royg"] \
                      + "','" + data["delayremark"] + "','" + data["remark"] + "','" + data['createtime'] + "','" \
                      + str(data['year']) + "','" + str(data['month']) + "','" + str(data['lastyearsum']) + "')"
                executeSession.excuteSqlByBulkParams(sql)
                # 获取刚插入的订单id
                result = executeSession.getArrResult('select max(id) from input_basic_orders')
                if result:
                    order_id = result[0][0]
                else:
                    order_id = 0
                i = 1
                # 分12行数据存储
                while i <= 12:
                    # 大于6位下一个月份的预测数据
                    current_mon_use = 0
                    if i > 6:
                        # 如果当前月份为12月，下一月为下一年的一月份
                        if current_mon == 12:
                            current_mon = 1
                        else:
                            current_mon_use = current_mon + 1
                    else:
                        current_mon_use = current_mon
                    sql1 = "insert into input_forecast_orders(year,month,out,week,capacity,order_id,prediction_mon,outmonth)values('" + str(data['year']) + "','" + str(current_mon_use) + "','" + str(data['out'+str(i)]) + "','" + str(i) \
                           + "','" + str(data['capacitym'+str(i)]) + "','" + str(order_id) + "','" + str(i) + "','" + str(data['outmonth'+str(i)]) +"')"
                    i = i+1
                    executeSession.excuteSqlByBulkParams(sql1)
            except Exception as err:
                errs = err
                print('errs',errs)

        #executeSession.closeConnect()

    result = {}
    result['code'] = 0
    return Response(result)


# 销售订单删除
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def deleteorder(request):
    datas = []
    ids = request.data['datas']
    executeSession = sqlutils.SqlUtils()
    try:
        # 删除主表
        sql = "delete from input_basic_orders where id in (" + ids[:-1] + ")"
        executeSession.executeUpdateSql(sql)
        # 删除子表
        sql = "delete from  input_forecast_orders where order_id in (" + ids[:-1] + ")"
        executeSession.executeUpdateSql(sql)
        executeSession.closeConnect()
    except Exception as e:
        err=e
    result = {}
    result['code'] = 1
    return Response(result)

@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def getorderlist(request):
    starttime = datetime.datetime.now()
    #temp_function()
    where = ''
    if request.POST['hg'] != '':
        where_hg = ''
        for hg in request.POST['hg']:
            if hg != ',':
                where_hg = where_hg + "'" + hg + "'"
            else:
                where_hg = where_hg + hg

        where = " where hg in(" + where_hg + ")"

    if request.POST['product'] != '':
        if where != '':
            where = where + " and product= '" + request.POST['product'] + "'"
        else:
            where = " where product= '" + request.POST['product'] + "'"
    if request.POST['owner'] != '':
        if where !='':
            where = where + " and owner= '" + request.POST['owner'] + "'"
        else:
            where = " where owner= '" + request.POST['owner'] + "'"

    if 'search' in request.GET:
        if where != '':
            where = where + """  and username like '%""" + request.GET['search'] + """%' """
        else:
            where = """  where username like '%""" + request.GET['search'] + """%' """
    if 'page' in request.GET:
        page = request.GET['page']
        offset = (int(request.GET['page']) - 1) * 4000 #先不分页取4000条
    fetchall = []
    executeSession = sqlutils.SqlUtils()
    try:
        #allcntQuerySet = executeSession.getArrResult('select count(*) from input_basic_orders '+where)
        sql = "select id,saleschannel,customer,customertype,owner,ownerid,team,salesop,salesopid,quotation,contract,line," \
              "projectdes,paymentterm,unitprice,moneytype,pn,power,product,forv,importance,hg,royg,delayremark,remark," \
              "year,month,createid,createname,createtime,modifyid,modifyname,modifytime,orderstate,unitcode,lastyearsum " \
              " from input_basic_orders " + where + '  order by createtime asc LIMIT ' + str(4000) + ' offset ' + str(offset)
        #sql = 'select * from input_basic_orders ' + where + '  order by createtime asc LIMIT ' + str(4000) + ' offset ' + str(offset)
        fetchall = executeSession.getArrResult(sql)
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:dashboardviews.py;method:get_imp_licence_logs;error:%s' % error)
    #allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    # 接入库存表
    # 创建连接
    # try:
    #     conn = pymysql.connect(host="localhost", user='root', passwd='123456', db='mysql', charset="utf8")
    #     sql_query = "select CODE,VFREE1,NONHANDNUM,NONHANDASTNUM from V_ZJKC"
    #     df = pd.read_sql(sql_query,conn)
    # except Exception as e:
    #     err = e
    # # 写入pg数据库
    # try:
    #     engine = create_engine('postgresql://quweilong:123456@localhost:5432/datax')
    #     df.to_sql('V_ZJKC',engine,index=False,if_exists='replace')
    # except Exception as e:
    #     err = e
    try:
        sql = 'select  "CODE","VFREE1","NONHANDNUM","NONHANDASTNUM" from "V_ZJKC"'
        kc_fetchall = executeSession.getArrResult(sql)
    except Exception as e:
        err = e
    groups = []
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics["saleschannel"] = obj[1]
        dics["customer"] = obj[2]
        dics["customertype"] = obj[3]
        dics["owner"] = obj[4]
        dics["ownerid"] = obj[5]
        dics["team"] = obj[6]
        dics["salesop"] = obj[7]
        dics["salesopid"] = obj[8]
        dics["quotation"] = obj[9]
        dics["contract"] = obj[10]
        dics["line"] = obj[11]
        dics["projectdes"] = obj[12]
        dics["paymentterm"] = obj[13]
        dics["unitprice"] = obj[14]
        dics["moneytype"] = obj[15]
        dics["pn"] = obj[16]
        dics["power"] = obj[17]
        dics["product"] = obj[18]
        dics["forv"] = obj[19]
        dics["importance"] = obj[20]
        dics["hg"] = obj[21]
        dics["royg"] = obj[22]
        dics["delayremark"] = obj[23]
        dics["remark"] = obj[24]
        dics["year"] = obj[25]
        dics["month"] = obj[26]
        dics["createid"] = obj[27]
        dics["createname"] = obj[28]
        dics["createtime"] = obj[29]
        dics["modifyid"] = obj[30]
        dics["modifyname"] = obj[31]
        dics["modifytime"] = obj[32]
        dics["orderstate"] = obj[33]
        dics["unitcode"] = obj[34]
        dics["lastyearsum"] = obj[35]
        # 找出对应库存
        for kc_obj in kc_fetchall:
            if obj[16] == kc_obj[0] and obj[17] == kc_obj[1]:
                dics['inventory'] = kc_obj[2]
                break
        # 找出对应子表中预测的值
        # 预测月份数据,大于当前月份的数据为预测月份数据
        current_mon = time.gmtime().tm_mon
        current_year = time.gmtime().tm_year
        sql = 'select year,month,out,outmonth,capacity,week,order_id,prediction_mon from input_forecast_orders where order_id= ' + str(obj[0]) + ' and year = ' + str(obj[25])
        results = executeSession.getArrResult(sql)
        for obj_first in results:
            # 显示当月及次月数据
            dics['out'+str(obj_first[5])] = obj_first[2]
            # 显示次月之后预测月数据
            dics['outmonth' + str(obj_first[5])] = obj_first[3]
            # 显示产能预测月数据
            dics['capacitym'+str(obj_first[7])] = obj_first[4]
        # 显示过去月份汇总信息
        i = 1
        while i < current_mon:
            sum_out = 0
            try:
                sql = 'select out from input_forecast_orders where order_id= ' + str(
                    obj[0]) + ' and year = ' + str(current_year) + ' and month = ' + str(i)
                results_second = executeSession.getArrResult(sql)
                for obj_second in results_second:
                    if obj_second[0] != None:
                        sum_out += obj_second[0]
                dics['outmonth' + str(i)] = sum_out
                i += 1
            except Exception as e:
                err = e
        groups.append(dics)
    endtime = datetime.datetime.now()
    print(endtime - starttime)
    return Response({'rows': groups})

@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def exportorderexcel(request):
    where = ''
    if request.GET['hg'] != '':
        where_hg = ''
        for hg in request.POST['hg']:
            if hg != ',':
                where_hg = where_hg + "'" + hg + "'"
            else:
                where_hg = where_hg + hg

        where = " where hg in(" + where_hg + ")"

    if request.GET['product'] != '':
        if where != '':
            where = where + " and product= '" + request.POST['product'] + "'"
        else:
            where = " where product= '" + request.POST['product'] + "'"
    if request.GET['owner'] != '':
        if where !='':
            where = where + " and owner= '" + request.POST['owner'] + "'"
        else:
            where = " where owner= '" + request.POST['owner'] + "'"

    if 'search' in request.GET:
        if where != '':
            where = where + """  and username like '%""" + request.GET['search'] + """%' """
        else:
            where = """  where username like '%""" + request.GET['search'] + """%' """
    fetchall = []
    executeSession = sqlutils.SqlUtils()
    try:
        sql = "select id,saleschannel,customer,customertype,owner,ownerid,team,salesop,salesopid,quotation,contract,line," \
              "projectdes,paymentterm,unitprice,moneytype,pn,power,product,forv,importance,hg,royg,delayremark,remark," \
              "year,month,createid,createname,createtime,modifyid,modifyname,modifytime,orderstate,unitcode,lastyearsum " \
              " from input_basic_orders " + where + '  order by createtime asc '
        fetchall = executeSession.getArrResult(sql)
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:dashboardviews.py;method:get_imp_licence_logs;error:%s' % error)
    groups = []
    for obj in fetchall:
        dics = {}
        dics["Sales Channel"] = obj[1]
        dics["Customer"] = obj[2]
        dics["Customer Type"] = obj[3]
        dics["Sales Company"] = obj[9]
        dics["Sales Business Team"] = obj[6]
        dics["Account Manager Owner"] = obj[4]
        dics["Sales Operation"] = obj[7]
        dics["contract#"] = obj[10]
        dics["line of Business"] = obj[11]
        dics["Project Description"] = obj[12]
        dics["Payment Term"] = obj[13]
        dics["UnitPrice"] = obj[14]
        dics["P/N"] = obj[16]
        dics["power"] = obj[17]
        dics["product"] = obj[18]
        dics["For V"] = str(obj[16]) + str(obj[17])
        dics["重要紧急 Open So HG3+HG4"] = obj[20]
        dics["HG"] = obj[21]
        dics["R/O/Y/G"] = obj[22]
        dics["丢单(HG0)或推迟原因"] = obj[23]
        dics["Remarks/Next Steps"] = obj[24]
        dics["orderstate"] = obj[33]
        dics["lastyearsum"] = obj[35]
        # 找出对应子表中预测的值
        # 预测月份数据,大于当前月份的数据为预测月份数据
        current_mon = time.gmtime().tm_mon
        current_year = time.gmtime().tm_year
        sql = 'select year,month,out,outmonth,capacity,week,order_id,prediction_mon from input_forecast_orders where order_id= ' + str(obj[0]) + ' and year = ' + str(obj[25])
        results = executeSession.getArrResult(sql)
        i = 1

        while i < current_mon:
            sum_out = 0
            try:
                sql = 'select out from input_forecast_orders where order_id= ' + str(
                    obj[0]) + ' and year = ' + str(current_year) + ' and month = ' + str(i)
                results_second = executeSession.getArrResult(sql)
                for obj_second in results_second:
                    if obj_second[0] != None:
                        sum_out += obj_second[0]
                dics[str(i)+'月份'] = sum_out
                i += 1
            except Exception as e:
                err = e
        for obj_first in results:
            # if obj_first[2] != None:
            #     sum_out_all += int(obj_first[2])
            # 显示当月及次月数据
            if int(obj_first[5]) < 6:
                dics[str(current_mon)+'月第'+str(obj_first[5])+'周'] = obj_first[2]
            elif int(obj_first[5]) > 6:
                dics[str(current_mon+1) + '月第' + str(int(obj_first[5])-6) + '周'] = obj_first[2]
        try:
            for obj_first in results:
                # 显示次月之后预测月数据
                if int(obj_first[5]) > (current_mon+1):
                    dics[str(obj_first[5]+'月份')] = obj_first[3]
        except Exception as err:
            e=err
        sum_out_all = 0  # 出货汇总
        for obj_1 in results:
            if obj_1[2] != None:
                sum_out_all += obj_1[2]
            dics['汇总'] = sum_out_all

        for obj_first in results:
            # 显示产能预测月数据
            dics[str(obj_first[7])+'月产能'] = obj_first[4]
        sql = 'select distinct year,capacity,prediction_mon from input_forecast_orders where order_id= ' + str(
            obj[0]) + ' and year = ' + str(obj[25])
        results = executeSession.getArrResult(sql)
        sum_capacity_all = 0  # 产能汇总
        for obj in results:
            if obj[1] != None:
                sum_capacity_all += obj[1]
            dics['产能汇总'] = sum_capacity_all
        groups.append(dics)
    # excel导出
    jsonfile = groups
    workbook = xlwt.Workbook()
    sheet1 = workbook.add_sheet('Sales Channel')
    ll = list(jsonfile[0].keys())
    for i in range(0,len(ll)):
        sheet1.write(0,i,ll[i])
    for j in range(0, len(jsonfile)):
        m = 0
        ls = list(jsonfile[j].values())
        for k in ls:
            sheet1.write(j + 1, m, k)
            m += 1
    current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    workbook.save(r'/Users/quweilong/dingdan' + current_time + '.xls')
    return Response({'rows': groups})


#财务数据录入
@login_required
def financeinput(request):
    return render_to_response("extra_module/indexfinance.html")


@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def getfinancelist(request):
    where = ''
    if request.POST['mtype'] != '':
        where = " where artype='" + request.POST['mtype'] + "'"
    if request.POST['btype'] != '':
        if where != "":
            where = where + " and businesstype='" + request.POST['btype'] + "'"
        else:
            where = " where  businesstype='" + request.POST['btype'] + "'"
    if request.POST['customer'] != '':
        if where != "":
            where = where + " and customers='" + request.POST['customer'] + "'"
    if 'search' in request.POST:
        if where == '':
            where = """  where username like '%""" + request.GET['search'] + """%' """
        else:
            where = where + """  and username like '%""" + request.GET['search'] + """%' """
    if 'page' in request.GET:
        page = request.GET['page']
        offset = (int(request.GET['page']) - 1) * 4000 #先不分页取4000条
    fetchall = []
    executeSession = sqlutils.SqlUtils()
    try:
        #allcntQuerySet = executeSession.getArrResult('select count(*) from input_finance '+where)
        fetchall = executeSession.getArrResult(
            'select id,saler,customertype,customers,allar,sixmonth,oneyear,twoyears,threeyears,fouryears,'
            ' otheryears,badmoney,projectname,arstate,businesstype,artype,saleteam,dutymen,csdutymen,'
            ' premoney,incomedate,paytype,dutytype,remarks,year,month,armoney,version,createid,createname,createtime,'
            ' modifyid,modifyname,modifytime from input_finance ' +
            where + '  order by createtime asc LIMIT ' + str(4000) + ' offset ' + str(offset))
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:extra_module/views.py;method:getfinancelist;error:%s' % error)
    executeSession.closeConnect()
    #allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups = []
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics["saler"] = obj[1]
        dics["customertype"] = obj[2]
        dics["customers"] = obj[3]
        dics["allar"] = obj[4]
        dics["sixmonth"] = obj[5]
        dics["oneyear"] = obj[6]
        dics["twoyears"] = obj[7]
        dics["threeyears"] = obj[8]
        dics["fouryears"] = obj[9]
        dics["otheryears"] = obj[10]
        dics["badmoney"] = obj[11]
        dics["projectname"] = obj[12]
        dics["arstate"] = obj[13]
        dics["businesstype"] = obj[14]
        dics["artype"] = obj[15]
        dics["saleteam"] = obj[16]
        dics["dutymen"] = obj[17]
        dics["csdutymen"] = obj[18]
        dics["premoney"] = obj[19]
        dics["incomedate"] = obj[20]
        dics["paytype"] = obj[21]
        dics["dutytype"] = obj[22]
        dics["remarks"] = obj[23]
        dics["year"] = obj[24]
        dics["month"] = obj[25]
        dics["armoney"] = obj[26]
        dics["version"] = obj[27]
        dics["createid"] = obj[28]
        dics["createname"] = obj[29]
        dics["createtime"] = obj[30]
        dics["modifyid"] = obj[31]
        dics["modifyname"] = obj[32]
        dics["modifytime"] = obj[33]
        # 找出对应子表中预测的值
        current_mon = time.gmtime().tm_mon
        current_year = time.gmtime().tm_year
        sql = "select year,month,week,armoney,armoneymon,finance_id,prediction_mon from input_forecast_finance where finance_id= '" + str(obj[0]) + "'" + " and year = " + str(current_year)
        results = executeSession.getArrResult(sql)
        try:
            for obj_first in results:
                # 显示当月及次月数据
                dics['armoney' + str(obj_first[2])] = obj_first[3]
                # 显示次月之后预测月数据
                dics['armoneymonth' + str(obj_first[6])] = obj_first[4]
            # 显示过去月份汇总信息
            i = 1
            while i < current_mon:
                sum_armoney = 0
                try:
                    sql = "select armoney from input_forecast_finance where finance_id='"  + str(
                        obj[0]) + "' and year = " + str(current_year) + ' and month = ' + str(i)
                    results_second = executeSession.getArrResult(sql)
                    for obj_second in results_second:
                        if obj_second[0] != None:
                            sum_armoney += obj_second[0]
                    dics['armoneymonth' + str(i)] = sum_armoney
                    i += 1
                except Exception as e:
                    err = e
        except Exception as e:
            err= e

        groups.append(dics)
    executeSession.closeConnect
    return Response({'rows': groups})


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def saveFinanceOrder(request):
    datas = []
    datas = json.loads(request.data['datas'])  # 所有新增或更新数据
    # executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    executeSession = sqlutils.SqlUtils()
    current_mon = time.gmtime().tm_mon
    current_year = time.gmtime().tm_year
    for data in datas:
        if 'id' in data:
            for key in data:
                if data[key] == None:
                    data[key] = ''
            # 更新基本数据
            try:
                sql = "update input_finance set saler='" + data['saler'] + "',customertype='" + data['customertype'] + "',customers='"\
                      + data['customers'] + "',allar='" + str(data['allar']) + "',sixmonth='" +str(data['sixmonth']) + "',oneyear='"\
                      + str(data['oneyear']) + "',twoyears='" + str(data['twoyears']) + "',threeyears='" + str(data['threeyears'])\
                      + "',fouryears='" + str(data['fouryears']) + "',otheryears='" + str(data['otheryears']) + "',badmoney='"\
                      + str(data['badmoney']) + "',projectname='" + data['projectname'] + "',arstate='" + data['arstate'] + "',artype='" + data['artype']\
                      + "',saleteam='" + data['saleteam'] + "',dutymen='" + data['dutymen'] + "',csdutymen='" + data['csdutymen'] + "',businesstype='" + data['businesstype']\
                      + "',premoney='" + str(data['premoney']) + "',incomedate='" + data['incomedate'] + "',paytype='" + data['paytype']\
                      + "',dutytype='" + data['dutytype'] + "',remarks='" + data['remarks'] + "',year='" + str(data['year'])\
                      + "',month='" + str(data['month']) + "',createtime='" + data['createtime'] + "' where id='" + str(data['id']) + "'"
                executeSession.excuteSqlByBulkParams(sql)
                # 更新预测数据
                i = 1
                # 更新12行数据
                while i <= 12:
                    sql = "update input_forecast_finance set armoney='" + str(data['armoney'+str(i)]) + "',armoneymon='" + str(data['armoneymonth'+str(i)]) + "' where "  \
                          + "finance_id='" + str(data['id']) + "'" + " and year=" + str(data['year']) + " and prediction_mon='" + str(i) + "'"
                    i = i + 1
                    executeSession.excuteSqlByBulkParams(sql)
            except Exception as e:
                err = e
        else:
            try:
                # 新增基本数据
                sql = "insert into input_finance(saler,customertype,customers,allar,sixmonth,oneyear,twoyears,threeyears,fouryears," \
                      "otheryears,badmoney,projectname,arstate,saleteam,dutymen,csdutymen,premoney,incomedate,paytype,dutytype,remarks," \
                      "year,month,createtime)values('" + data['saler'] + "','" + data['customertype'] + "','" + data['customers']\
                      + "','" + str(data['allar']) + "','" + str(data['sixmonth']) + "','" + str(data['oneyear']) + "','" + str(data['twoyears'])\
                      + "','" + str(data['threeyears']) + "','" + str(data['fouryears']) + "','" + str(data['otheryears']) + "','" + str(data['badmoney'])\
                      + "','" + data['projectname'] + "','" + data['arstate'] + "','" + data['saleteam'] + "','" + data['dutymen']\
                      + "','" + data['csdutymen'] + "','" + str(data['premoney']) + "','" + data['incomedate'] + "','" + data['paytype'] \
                      + "','" + data['dutytype'] + "','" + data['remarks'] + "','" + str(data['year']) + "','" \
                      + str(data['month']) + "','" + data['createtime'] + "')"
                executeSession.executeUpdateSql(sql)
                # 获取刚插入的订单id
                result = executeSession.getArrResult('select max(id) from input_finance')
                if result:
                    finance_id = result[0][0]
                else:
                    finance_id = 0

                i = 1
                # 分12行数据存储
                while i <= 12:
                    # 大于6位下一个月份的预测数据
                    current_mon_use = 0
                    if i > 6:
                        # 如果当前月份为12月，下一月为下一年的一月份
                        if current_mon == 12:
                            current_mon = 1
                        else:
                            current_mon_use = current_mon + 1
                    else:
                        current_mon_use = current_mon
                    sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                          + str(finance_id) + "','" + str(current_year) + "','" + str(current_mon_use) + "','" + str(
                        i) + "','" + str(data['armoney'+str(i)]) + "','" + str(data['armoneymonth'+str(i)]) + "','" + str(i) + "')"
                    i = i + 1
                    executeSession.excuteSqlByBulkParams(sql)
            except Exception as e:
                err = e
    result = {}
    result['code'] = 1
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def deleteFinanceOrder(request):
    datas = []
    ids = request.data['datas']
    executeSession = sqlutils.SqlUtils()
    try:
        # 删除主表
        sql = "delete from input_finance where id in (" + ids[:-1] + ")"
        executeSession.executeUpdateSql(sql)
        # 删除子表
        sql = "delete from  input_forecast_finance where finance_id in (" + ids[:-1] + ")"
        executeSession.executeUpdateSql(sql)
        executeSession.closeConnect()
    except Exception as e:
        err=e
    result = {}
    result['code'] = 1
    return Response(result)

@api_view(http_method_names=['POST','GET'])
@permission_classes((permissions.AllowAny,))
def getcustomer(request):
    result = {}
    result['code'] = 1
    return Response(result)


# 坏账excel导入
@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def uploadBadDebt(request):
    resultsObj = tools.successMes()
    try:
        f = request.FILES['filename']
        session = sqlutils.SqlUtils()
        try:
            # 获取已有的客户列表
            customers = session.getDictResult('SELECT "id", "customers" FROM input_finance')
            # 获取工作簿
            workBook = xlrd.open_workbook(file_contents=f.read())
            sheetNames = workBook.sheet_names()
            # 当前年份和月份
            current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            current_mon = time.gmtime().tm_mon
            current_year = time.gmtime().tm_year
            # 遍历sheet
            for sheetName in sheetNames:
                workSheet = workBook.sheet_by_name(sheetName)
                if workSheet.nrows <= 1:
                    continue
                rowCount = workSheet.nrows
                # 遍历行，从第一行开始
                insertSqlList = []
                for i in range(1, rowCount):
                    row = workSheet.row_values(i)
                    # 第一版excel结构
                    # 销售主体 客户名称 XX年XX月AR余额 "计提3%6个月以下" "计提5%6个月-1年" "计提10%1-2年" "计提30%2-3年" "计提50%3-4年" "计提50%4年以上" 计提坏账准备金额
                    customerName = row[1]
                    # 判断客户是否存在
                    if customerName:
                        isExist = False
                        for customer in customers:
                            rowObj = [
                                {'key': 'saler', 'value': str(row[0])},
                                {'key': 'customers', 'value': str(row[1])},
                                {'key': 'allar', 'value': str(row[2]) if row[2] else '0'},
                                {'key': 'sixmonth', 'value': str(row[3]) if row[3] else '0'},
                                {'key': 'oneyear', 'value': str(row[4]) if row[4] else '0'},
                                {'key': 'twoyears', 'value': str(row[5]) if row[5] else '0'},
                                {'key': 'threeyears', 'value': str(row[6]) if row[6] else '0'},
                                {'key': 'fouryears', 'value': str(row[7]) if row[7] else '0'},
                                {'key': 'otheryears', 'value': str(row[8]) if row[8] else '0'},
                                {'key': 'badmoney', 'value': str(row[9]) if row[9] else '0'},
                            ]
                            if customer['customers'] == customerName:
                                updateSql = " UPDATE input_finance SET {0} WHERE \"id\" = '" + customer['id'] + "' "
                                sqlParams = ''
                                for obj in rowObj:
                                    sqlParams += ' "' + obj['key'] + '" = \'' + obj['value'] + '\', '
                                sqlParams = sqlParams[:len(sqlParams) - 2]
                                updateSql = updateSql.format(sqlParams)
                                session.executeUpdateSql(updateSql)
                                isExist = True
                        if not isExist:
                            sqlParams = ''
                            rowObj = [
                                {'key': 'saler', 'value': str(row[0])},
                                {'key': 'customers', 'value': str(row[1])},
                                {'key': 'allar', 'value': str(row[2]) if row[2] else '0'},
                                {'key': 'sixmonth', 'value': str(row[3]) if row[3] else '0'},
                                {'key': 'oneyear', 'value': str(row[4]) if row[4] else '0'},
                                {'key': 'twoyears', 'value': str(row[5]) if row[5] else '0'},
                                {'key': 'threeyears', 'value': str(row[6]) if row[6] else '0'},
                                {'key': 'fouryears', 'value': str(row[7]) if row[7] else '0'},
                                {'key': 'otheryears', 'value': str(row[8]) if row[8] else '0'},
                                {'key': 'badmoney', 'value': str(row[9]) if row[9] else '0'},
                            ]
                            for obj in rowObj:
                                sqlParams += '\'' + obj['value'] + '\', '
                            insertSqlList.append(sqlParams)
                for insert in insertSqlList:
                    insertSql = 'INSERT INTO input_finance (saler, customers, allar, sixmonth, oneyear, twoyears, threeyears, fouryears, otheryears, badmoney,year,month,premoney,incomedate,createtime)values(' + insert + str(current_year) + ',' + str(current_mon) + ",0,'" + str(current_time) + "','" + current_time + "')"
                    session.executeUpdateSql(insertSql)

                    # 获取刚插入的订单id
                    result = session.getArrResult('select max(id) from input_finance')
                    if result:
                        finance_id = result[0][0]
                    else:
                        finance_id = 0
                    # 新增预测数据
                    i = 1
                    # 新增12条数据
                    while i <= 12:
                        sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,prediction_mon)values('" \
                              + str(finance_id) + "','" + str(current_year) + "','" + str(current_mon) + "','" + str() + "','" + str(0) \
                              + "','" + str(i) + "')"
                        session.executeUpdateSql(sql)
                        i = i + 1
                session.closeConnect()
        except Exception as e:
            session.closeConnect()
            raise e
    except Exception as error:
        resultsObj = tools.errorMes(error.args)
        logger.error('---error---file:customize_extension->views.py;method:uploadBadDebt;error=%s' % error)
    return Response(resultsObj)


@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def geteditdata(request):
    executeSession = sqlutils.SqlUtils()
    year = request.GET['year']
    month = request.GET['month']
    id = request.GET['id']
    iscapacity = request.GET['iscapacity']
    weeks = request.GET['weeks']
    dist = {}
    if iscapacity == '0' or iscapacity == '1':
        if iscapacity == '0':
            sql ="select out from input_forecast_orders where order_id = " + id + "and year = " + year + " and month = " + month + " order by week"
            fetchall = executeSession.getArrResult(sql)
            for i, v in enumerate(fetchall):
                if v[0] != 0:
                    dist['out' + str(i + 1)] = v[0]
    else:
        sql = "select armoney from input_forecast_finance where finance_id= '" + id + "' and year = " + year + " and month = " + month + "and armoney !=0 order by week"
        fetchall = executeSession.getArrResult(sql)
        for i,v in enumerate(fetchall):
            if v[0] != 0:
                dist['armoney'+str(i+1)] = v[0]
    return Response({'data':dist})

@api_view(http_method_names=['POST','GET'])
@permission_classes((permissions.AllowAny,))
def updatedata(request):
    year = request.GET['year']
    month = request.GET['month']
    id = request.GET['id']
    iscapacity = request.GET['iscapacity']
    weeks = request.GET['weeks']
    executeSession = sqlutils.SqlUtils()
    datas = json.loads(request.GET['datas'])

    for data in datas:
        # 查询数据库中历史月份数据是否存在
        if iscapacity == '2':
            # 财务
            if datas[data] == '':
                datas[data] = 0
            sql = "select armoney from input_forecast_finance where finance_id= '" + id + "' and year = " + year + " and month = " + month + " and week='" + str(data[7:]) + "'"
            fetall = executeSession.getArrResult(sql)
            if fetall:
                # 如果存在则更新
                sql = "update input_forecast_finance set armoney='" + str(datas[data]) + "' where year='" + year + "' and month='" + month + "' and week='" + str(data[7:]) + "' and finance_id='" + id + "'"
                executeSession.excuteSqlByBulkParams(sql)
            else:
                # 执行插入
                sql = "insert into input_forecast_finance (year,month,armoney,week,finance_id,prediction_mon)values('" + str(
                    year) + "','" + str(month) + "','" + str(datas[data]) + "','" + str(data[7:]) + "','" + id + "','" + str(month) + "')"
                executeSession.excuteSqlByBulkParams(sql)

        else:
            # 订单
            if datas[data] == '':
                datas[data] = 0
            sql = "select out from input_forecast_orders where order_id= '" + id + "' and year = " + year + " and month = " + month + " and week='" + str(data[3:]) + "'"
            fetall = executeSession.getArrResult(sql)
            if fetall:
                # 如果存在则更新
                sql = "update input_forecast_orders set out='" + str(datas[data]) + "' where year='" + year + "' and month='" + month + "' and week='" + str(data[3:]) + "' and order_id='" + id + "'"
                executeSession.excuteSqlByBulkParams(sql)
            else:
                # 执行插入
                sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                    year) + "','" + str(month) + "','" + str(datas[data]) + "','" + str(data[3:]) + "','" + id + "','" + str(month) + "')"
                executeSession.excuteSqlByBulkParams(sql)
    return Response({"status":'success'})

def temp_function():
    # 临时导入晋能excel历史数据
    executeSession = sqlutils.SqlUtils()
    sql = "select * from excel_sheet1_1551854938"
    fetall = executeSession.getArrResult(sql)
    i = 1
    for data in fetall:
        try:
            sql = "insert into input_basic_orders(saleschannel,customer,owner,team,salesop,quotation," \
                          "contract,line,projectdes,paymentterm,unitprice,pn,power,product,importance,hg,royg," \
                          "delayremark,remark,year)values('" + data[1] + "','" + data[2] + "','" + \
                          data[5] + "','" + data[4]+ "','" + data[6] + "','" + data[3] \
                          + "','" + data[7] + "','" + data[8] + "','" + data[9] \
                          + "','" + data[10] + "','" + data[11] + "','" + str(data[12]) + "','" + str(data[13]) \
                          + "','" + data[14] + "','" + data[16] + "','" + str(data[17]) \
                          + "','" + data[18] + "','" + data[19] + "','" + data[20] + "','" + str(2019) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            # 获取刚插入的订单id
            result = executeSession.getArrResult('select max(id) from input_basic_orders')
            if result:
                order_id = result[0][0]
            else:
                order_id = 0
            # 插入预测数据
            # 一月数据
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[23]) + "','" + str(1) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[24]) + "','" + str(2) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[25]) + "','" + str(3) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[26]) + "','" + str(4) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[27]) + "','" + str(5) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            # 二月数据
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[28]) + "','" + str(1) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[29]) + "','" + str(2) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[30]) + "','" + str(3) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[31]) + "','" + str(4) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[32]) + "','" + str(5) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            #三月和次月
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[33]) + "','" + str(1) \
                    + "','" + str(order_id) + "','" + str(1) + "','" + str(0) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[34]) + "','" + str(2) \
                  + "','" + str(order_id) + "','" + str(2) + "','" + str(0) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[35]) + "','" + str(3) \
                  + "','" + str(order_id) + "','" + str(3) + "','" + str(0) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[36]) + "','" + str(4) \
                  + "','" + str(order_id) + "','" + str(4) + "','" + str(0) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[37]) + "','" + str(5) \
                  + "','" + str(order_id) + "','" + str(5) + "','" + str(data[39]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(0) + "','" + str(6) \
                  + "','" + str(order_id) + "','" + str(6) + "','" + str(data[40]) + "')"
            executeSession.excuteSqlByBulkParams(sql)


            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(7) \
                  + "','" + str(order_id) + "','" + str(7) + "','" + str(data[41]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(8) \
                  + "','" + str(order_id) + "','" + str(8) + "','" + str(data[42]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(9) \
                  + "','" + str(order_id) + "','" + str(9) + "','" + str(data[43]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(10) \
                  + "','" + str(order_id) + "','" + str(10) + "','" + str(data[44]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(11) \
                  + "','" + str(order_id) + "','" + str(11) + "','" + str(data[45]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(12) \
                  + "','" + str(order_id) + "','" + str(12) + "','" + str(data[46]) + "')"
            executeSession.excuteSqlByBulkParams(sql)

        except Exception as e:
            err = e



#大局数据录入
@login_required
def fullreport(request):
    return render_to_response("extra_module/fullreport.html")

@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def fullreportlist(request):
    where = '  '
    fetchall = []
    executeSession = sqlutils.SqlUtils()
    try:
        #allcntQuerySet = executeSession.getArrResult('select count(*) from input_finance '+where)
        fetchall = executeSession.getArrResult(
            'select * from ex_fullreport ' + where + '  order by createtime asc  ' )
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:extra_module/views.py;method:fullreportlist;error:%s' % error)
    executeSession.closeConnect()
    #allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups = []
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics["type"] = obj[1]
        dics["name"] = obj[2]
        dics["year"] = obj[3]
        dics["month1"] = obj[4]
        dics["month2"] = obj[5]
        dics["month3"] = obj[6]
        dics["month4"] = obj[7]
        dics["month5"] = obj[8]
        dics["month6"] = obj[9]
        dics["month7"] = obj[10]
        dics["month8"] = obj[11]
        dics["month9"] = obj[12]
        dics["month10"] = obj[13]
        dics["month11"] = obj[14]
        dics["month12"] = obj[15]
        dics["createid"] = obj[16]
        dics["createname"] = obj[17]
        dics["createtime"] = obj[18]
        dics["sortindex"] = obj[19]
        dics["modifyid"] = obj[20]
        dics["modifyname"] = obj[21]
        dics["modifytime"] = obj[22]

        groups.append(dics)
    executeSession.closeConnect
    return Response({'rows': groups})

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def savefullreport(request):
    datas = []
    datas = json.loads(request.data['datas'])  # 所有新增或更新数据
    # executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    executeSession = sqlutils.SqlUtils()
    current_mon = time.gmtime().tm_mon
    current_year = time.gmtime().tm_year
    for data in datas:
        dt = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if 'id' in data:
            for key in data:
                if data[key] == None:
                    data[key] = ''
            # 更新基本数据
            try:
                sql = "update ex_fullreport set type='" + str(data['type']) + "',name='" + str(data['name']) + "',month1='"\
                      + str(data['month1']) + "',month2='" + str(data['month2']) + "',month3='" +str(data['month3']) + "',month4='"\
                      + str(data['month4']) + "',month5='" + str(data['month5']) + "',month6='" + str(data['month6'])\
                      + "',month7='" + str(data['month7']) + "',month8='" + str(data['month8']) + "',month9='"\
                      + str(data['month9']) + "',month10='" + str(data['month10']) +  "',month11='" + str(data['month11'])\
                      + "',month12='" + str(data['month12']) + "',modifytime='" + dt + "' where id='" + str(data['id']) + "'"
                executeSession.excuteSqlByBulkParams(sql)
            except Exception as e:
                err = e
        else:
            try:
                # 新增基本数据
                sql = "insert into ex_fullreport(id,type,name,year,month1,month2,month3,month4,month5,month6," \
                      "month7,month8,month9,month10,month11,month12," \
                      "createtime)values('" + str(uuid.uuid1().hex) + "','" + str(data['type']) + "','" + str(data['name'])\
                      + "','" + str(data['year']) + "','" + str(data['month1']) + "','" + str(data['month2']) + "','" + str(data['month3'])\
                      + "','" + str(data['month4']) + "','" + str(data['month5']) + "','" + str(data['month6']) + "','" + str(data['month7'])\
                      + "','" + str(data['month8']) + "','" + str(data['month9']) + "','" + str(data['month10']) + "','" + str(data['month11'])\
                      + "','" + str(data['month12']) + "','" +  dt + "')"
                executeSession.excuteSqlByBulkParams(sql)

            except Exception as e:
                err = e
    result = {}
    result['code'] = 1
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def deletefullreport(request):
    datas = []
    ids = request.data['datas']
    executeSession = sqlutils.SqlUtils()
    try:
        # 删除主表
        sql = "delete from ex_fullreport where id in (" + ids[:-1] + ")"
        executeSession.executeUpdateSql(sql)
        executeSession.closeConnect()
    except Exception as e:
        err=e
    result = {}
    result['code'] = 1
    return Response(result)

@api_view(http_method_names=['POST','GET'])
@permission_classes((permissions.AllowAny,))
def getcustomer(request):
    result = {}
    result['code'] = 1
    return Response(result)

#待处理库存汇报
@login_required
def stockpreport(request):
    return render_to_response("extra_module/stockPreport.html")

@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def stockpreportlist(request):
    where = '  '
    fetchall = []
    executeSession = sqlutils.SqlUtils()
    try:
        #allcntQuerySet = executeSession.getArrResult('select count(*) from input_finance '+where)
        fetchall = executeSession.getArrResult(
            'select * from ex_stockpreport ' + where + '  order by createtime asc  ' )
    except Exception as error:
        executeSession.rollBack()
        logger.error('---error---file:extra_module/views.py;method:fullreportlist;error:%s' % error)
    executeSession.closeConnect()
    #allcnt = allcntQuerySet[0][0] if allcntQuerySet else 0

    groups = []
    for obj in fetchall:
        dics = {}
        dics['id'] = obj[0]
        dics["type"] = obj[1]
        dics["power"] = obj[2]
        dics["remark"] = obj[3]
        dics["year"] = obj[4]
        dics["month"] = obj[5]
        dics["createid"] = obj[6]
        dics["createname"] = obj[7]
        dics["createtime"] = obj[8]
        dics["sortindex"] = obj[9]
        dics["modifyid"] = obj[10]
        dics["modifyname"] = obj[11]
        dics["modifytime"] = obj[12]
        dics["stock"] = obj[13]

        groups.append(dics)
    executeSession.closeConnect
    return Response({'rows': groups})

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def savestockpreport(request):
    datas = []
    datas = json.loads(request.data['datas'])  # 所有新增或更新数据
    # executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    executeSession = sqlutils.SqlUtils()
    current_mon = time.gmtime().tm_mon
    current_year = time.gmtime().tm_year
    for data in datas:
        dt = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if 'id' in data:
            for key in data:
                if data[key] == None:
                    data[key] = ''
            # 更新基本数据
            try:
                sql = "update ex_stockpreport set type='" + str(data['type']) + "',stock='" + str(data['stock']) + "',power='" + str(data['power']) + "',remark='"\
                      + str(data['remark']) +  "',modifytime='" + dt + "' where id='" + str(data['id']) + "'"
                executeSession.excuteSqlByBulkParams(sql)
            except Exception as e:
                err = e
        else:
            try:
                # 新增基本数据
                sql = "insert into ex_stockpreport(id,type,power,stock,year,month,remark," \
                      "createtime)values('" + str(uuid.uuid1().hex) + "','" + str(data['type']) + "','" + str(data['power']) \
                      + "','" + str(data['stock']) + "','" + str(data['year']) + "','" + str(current_mon) + "','" + str(data['remark']) + "','" +  dt + "')"
                executeSession.excuteSqlByBulkParams(sql)

            except Exception as e:
                err = e
    result = {}
    result['code'] = 1
    return Response(result)

@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def deletestockpreport(request):
    datas = []
    ids = request.data['datas']
    executeSession = sqlutils.SqlUtils()
    try:
        # 删除主表
        sql = "delete from ex_stockpreport where id in (" + ids[:-1] + ")"
        executeSession.executeUpdateSql(sql)
        executeSession.closeConnect()
    except Exception as e:
        err=e
    result = {}
    result['code'] = 1
    return Response(result)

#出货预测
@login_required
def planreport(request):
    return render_to_response("extra_module/indexplan.html")


def temp_function():
    # 临时导入晋能订单excel历史数据
    executeSession = sqlutils.SqlUtils()
    sql = "select * from excel_sheet1_1552456864"
    fetall = executeSession.getArrResult(sql)
    i = 1
    for data in fetall:
        try:
            sql = "insert into input_basic_orders(saleschannel,customer,owner,team,salesop,quotation," \
                          "contract,line,projectdes,paymentterm,unitprice,pn,power,product,importance,hg,royg," \
                          "delayremark,remark,year)values('" + data[1] + "','" + data[2] + "','" + \
                          data[5] + "','" + data[4]+ "','" + data[6] + "','" + data[3] \
                          + "','" + data[7] + "','" + data[8] + "','" + data[9] \
                          + "','" + data[10] + "','" + data[11] + "','" + str(data[12]) + "','" + str(data[13]) \
                          + "','" + data[14] + "','" + data[16] + "','" + str(data[17]) \
                          + "','" + data[18] + "','" + data[19] + "','" + data[20] + "','" + str(2019) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            # 获取刚插入的订单id
            result = executeSession.getArrResult('select max(id) from input_basic_orders')
            if result:
                order_id = result[0][0]
            else:
                order_id = 0


            # if data[2] == 'ADANI GLOBAL PTE LTD':
            #     print('data[39]=',data[39])
            #     print('data[40]=', data[40])
            #     print('data[41]=', data[41])

            # 插入预测数据
            # 一月数据
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[23]) + "','" + str(1) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[24]) + "','" + str(2) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[25]) + "','" + str(3) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[26]) + "','" + str(4) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(1) + "','" + str(data[27]) + "','" + str(5) + "','" + str(order_id) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            # 二月数据
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[28]) + "','" + str(1) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[29]) + "','" + str(2) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[30]) + "','" + str(3) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[31]) + "','" + str(4) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders (year,month,out,week,order_id,prediction_mon)values('" + str(
                2019) + "','" + str(2) + "','" + str(data[32]) + "','" + str(5) + "','" + str(order_id) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)

            # 插入产能，对比forv
            sql = "select column2,column3,column4,column5,column6,column7 from excel_sheet1_1552459095"
            fetall2 = executeSession.getArrResult(sql)
            i3 = 0
            i4 = 0
            i5 = 0
            i6 = 0
            i7 = 0
            for temp1 in fetall2:
                if temp1[0] == data[15]:
                    i3 = temp1[1]
                    i4 = temp1[2]
                    i5 = temp1[3]
                    i6 = temp1[4]
                    i7 = temp1[5]
            if i3 == None:
                i3 = 0
            if i4 == None:
                i4 = 0
            if i5 == None:
                i5 = 0
            if i6 == None:
                i6 = 0
            if i7 == None:
                i7 = 0
            #三月和次月
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[33]) + "','" + str(1) \
                    + "','" + str(order_id) + "','" + str(1) + "','" + str(0) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[34]) + "','" + str(2) \
                  + "','" + str(order_id) + "','" + str(2) + "','" + str(0) + "')"
            executeSession.excuteSqlByBulkParams(sql)

            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth,capacity)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[35]) + "','" + str(3) \
                  + "','" + str(order_id) + "','" + str(3) + "','" + str(0) + "','" + str(i3) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth,capacity)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[36]) + "','" + str(4) \
                  + "','" + str(order_id) + "','" + str(4) + "','" + str(0) + "','" + str(i4) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth,capacity)values('" + str(
                2019) + "','" + str(3) + "','" + str(data[37]) + "','" + str(5) \
                  + "','" + str(order_id) + "','" + str(5) + "','" + str(data[39]) + "','" + str(i5) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth,capacity)values('" + str(
                2019) + "','" + str(3) + "','" + str(0) + "','" + str(6) \
                  + "','" + str(order_id) + "','" + str(6) + "','" + str(data[40]) + "','" + str(i6) + "')"
            executeSession.excuteSqlByBulkParams(sql)


            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth,capacity)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(7) \
                  + "','" + str(order_id) + "','" + str(7) + "','" + str(data[41]) + "','" + str(i7) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(8) \
                  + "','" + str(order_id) + "','" + str(8) + "','" + str(data[42]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(9) \
                  + "','" + str(order_id) + "','" + str(9) + "','" + str(data[43]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(10) \
                  + "','" + str(order_id) + "','" + str(10) + "','" + str(data[44]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(11) \
                  + "','" + str(order_id) + "','" + str(11) + "','" + str(data[45]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_orders(year,month,out,week,order_id,prediction_mon,outmonth)values('" + str(
                2019) + "','" + str(4) + "','" + str(0) + "','" + str(12) \
                  + "','" + str(order_id) + "','" + str(12) + "','" + str(data[46]) + "')"
            executeSession.excuteSqlByBulkParams(sql)

        except Exception as e:
            err = e
            print('errr',err)

def temp_function2():
    # 临时导入晋能财务excel历史数据
    executeSession = sqlutils.SqlUtils()
    sql = "select * from excel_sheet1_1552634297"
    fetall = executeSession.getArrResult(sql)
    current_mon = time.gmtime().tm_mon
    current_year = time.gmtime().tm_year

    for data in fetall:
        # 新增基本数据
        try:
            sql = "insert into input_finance (saler,customers,allar,sixmonth,oneyear,twoyears,threeyears,fouryears," \
                  "otheryears,badmoney,projectname,arstate,businesstype,artype,saleteam,dutymen,csdutymen,premoney,incomedate," \
                  "paytype,dutytype,remarks)values('" + str(data[1]) + "','" + str(data[2]) + "','" + str(data[3])+ "','" + str(data[4])\
                  + "','" + str(data[5])+ "','" + str(data[6])+ "','" + str(int(data[7]))+ "','" + str(int(data[8]))+ "','" + str(int(data[9]))\
                  + "','" + str(data[10])+ "','" + str(data[11])+ "','" + str(data[12])+ "','" + str(data[13])+ "','" + str(data[14])\
                  + "','" + str(data[15])+ "','" + str(data[16])+ "','" + str(data[17])+ "','" + str(data[18])+ "','" + str(data[19])\
                  + "','" + str(data[20]) + "','" + str(data[21]) + "','" + str(data[22]) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            # 获取刚插入的订单id
            result = executeSession.getArrResult('select max(id) from input_finance')
            if result:
                finance_id = result[0][0]
            else:
                finance_id = 0
            # 一月
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(1) + "','" + str(1) + "','" + str(data[23]) + "','" + str(0) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(1) + "','" + str(2) + "','" + str(
                data[24]) + "','" + str(0) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(1) + "','" + str(3) + "','" + str(
                data[25]) + "','" + str(0) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(1) + "','" + str(4) + "','" + str(
                data[26]) + "','" + str(0) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(1) + "','" + str(5) + "','" + str(
                data[27]) + "','" + str(0) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)

            # 二月
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(2) + "','" + str(1) + "','" + str(
                data[29]) + "','" + str(0) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(2) + "','" + str(2) + "','" + str(
                data[30]) + "','" + str(0) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(2) + "','" + str(3) + "','" + str(
                data[31]) + "','" + str(0) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(2) + "','" + str(4) + "','" + str(
                data[32]) + "','" + str(0) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(2) + "','" + str(5) + "','" + str(
                data[33]) + "','" + str(0) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)

            # 当月和次月
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(3) + "','" + str(1) + "','" + str(
                data[35]) + "','" + str(0) + "','" + str(1) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(3) + "','" + str(2) + "','" + str(
                data[36]) + "','" + str(0) + "','" + str(2) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(3) + "','" + str(3) + "','" + str(
                data[37]) + "','" + str(0) + "','" + str(3) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(3) + "','" + str(4) + "','" + str(
                data[38]) + "','" + str(0) + "','" + str(4) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(3) + "','" + str(5) + "','" + str(
                data[39]) + "','" + str(data[42]) + "','" + str(5) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(3) + "','" + str(6) + "','" + str(
                0) + "','" + str(data[43]) + "','" + str(6) + "')"
            executeSession.excuteSqlByBulkParams(sql)

            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(4) + "','" + str(7) + "','" + str(
                0) + "','" + str(data[44]) + "','" + str(7) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(4) + "','" + str(8) + "','" + str(
                0) + "','" + str(data[45]) + "','" + str(8) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(4) + "','" + str(9) + "','" + str(
                0) + "','" + str(data[46]) + "','" + str(9) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(4) + "','" + str(10) + "','" + str(
                0) + "','" + str(data[47]) + "','" + str(10) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(4) + "','" + str(11) + "','" + str(
                0) + "','" + str(data[48]) + "','" + str(11) + "')"
            executeSession.excuteSqlByBulkParams(sql)
            sql = "insert into input_forecast_finance(finance_id,year,month,week,armoney,armoneymon,prediction_mon)values('" \
                  + str(finance_id) + "','" + str(current_year) + "','" + str(4) + "','" + str(12) + "','" + str(
                0) + "','" + str(data[49]) + "','" + str(12) + "')"
            executeSession.excuteSqlByBulkParams(sql)

        except Exception as e:
            err = e
            print('err2',err)