# encoding: utf-8
import decimal
import xlrd
import numpy as np
from dashboard.models import scenes
import pandas as pd
from sqlalchemy import create_engine
from threading import Timer


from api import utils as sqlutils
from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from api.mail_utils import *
from common import tools
from common.tools import UUIDTools
import logging
import urllib.parse  
import urllib.request
import json
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)
# 去除科学计数法
pd.set_option('float_format', lambda x: '%.8f' % x)

# 生成Excel路径
excel_base_path = globalvariable.PRJ_PATH+'/frontend/upload/temp_files/'
# 前台下载路径
download_url = r'''/frontend/upload/temp_files/'''


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        super(DecimalEncoder, self).default(o)

# 删除记录 封装
def deleteRecord(table,ids):
    executeSession = sqlutils.SqlUtils(dbType="extension")
    resultObj = tools.successMes()
    try:
        for id in ids.split(','):
            if id:
                type = 'delete'
                executeSession.executeSql(type,table,id)
        resultObj['code'] = '1'
    except Exception as e:
        resultObj = tools.errorMes(e.args)
        resultObj['code'] = '0'
    return resultObj
# -----------------计算公式---------------



# 电池硅片成本公式
def batguiCost(guicost,singlew,batteryinstockgood,inbad,now_rate):
    guicost = decimal.Decimal(guicost)
    singlew = decimal.Decimal(singlew)
    batteryinstockgood = decimal.Decimal(batteryinstockgood)
    inbad = decimal.Decimal(inbad)
    now_rate = decimal.Decimal(now_rate)
    # (硅片价格/运营指标电池单片瓦数 /（运营指标电池入库良率-硅片来料不良）)/(1+税率)
    return (guicost/singlew /(batteryinstockgood-inbad))/(1+now_rate)

# 电池非硅成本公式
def batnonguiCost(battery_sum_bom,singlew,batteryinstockgood,inbad,now_rate):
    battery_sum_bom = decimal.Decimal(battery_sum_bom)
    singlew = decimal.Decimal(singlew)
    batteryinstockgood = decimal.Decimal(batteryinstockgood)
    inbad = decimal.Decimal(inbad)
    now_rate = decimal.Decimal(now_rate)
    # （sum（电池BOM预估金额）/运营指标电池单片瓦数 /(运营指标电池入库良率-硅片来料不良)
    return battery_sum_bom / singlew / (batteryinstockgood - inbad)

# 电池每瓦成本公式
def batsinglewCost(gui_cost,battery_nongui_cost,prebatterywage):
    gui_cost = decimal.Decimal(gui_cost)
    battery_nongui_cost = decimal.Decimal(battery_nongui_cost)
    prebatterywage = decimal.Decimal(prebatterywage)
    # 电池硅片成本+非硅+人工制费
    return gui_cost + battery_nongui_cost + prebatterywage

# 组件非硅成本公式
def comnonguiCost(glassPrice,now_rate,materialestimated,component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate):
    glassPrice = decimal.Decimal(glassPrice)
    now_rate = decimal.Decimal(now_rate)
    materialestimated = decimal.Decimal(materialestimated)
    component_sum_bom = decimal.Decimal(component_sum_bom)
    componentinstockgood = decimal.Decimal(componentinstockgood)
    avgrate = decimal.Decimal(avgrate)
    batteryare = decimal.Decimal(batteryare)
    tabletsize = decimal.Decimal(tabletsize)
    CTM = decimal.Decimal(CTM)
    wrate = decimal.Decimal(wrate)
    # (玻璃价格/ 1.13 + 材料组合+ sum组件预估金额(不含玻璃+材料组合) )/运营指标组件入库良率/(运营指标平均投档效率*电池面积系数*版型*运营指标CTM*（1-运营指标组件标称功率差）)
    return (glassPrice/ (1 + now_rate) + materialestimated+ component_sum_bom )/componentinstockgood/(avgrate*batteryare*tabletsize*CTM*(1-wrate))

# 新产品组件非硅成本公式  特定双面单晶
def newComnonguiCost(component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate):
    component_sum_bom = decimal.Decimal(component_sum_bom)
    componentinstockgood = decimal.Decimal(componentinstockgood)
    avgrate = decimal.Decimal(avgrate)
    batteryare = decimal.Decimal(batteryare)
    tabletsize = decimal.Decimal(tabletsize)
    CTM = decimal.Decimal(CTM)
    wrate = decimal.Decimal(wrate)
    # sum组件预估金额 /运营指标组件入库良率/(运营指标平均投档效率*电池面积系数*版型*运营指标CTM*(1-运营指标组件标称功率差))
    return component_sum_bom/componentinstockgood/(avgrate*batteryare*tabletsize*CTM*(1-wrate))



# 电池成本公式
def combatCost(singlew_cost,batteryare,avgrate,tabletsize,piesrate,componentinstockgood,CTM,wrate):
    try:
        tabletsize = decimal.Decimal(tabletsize)
        CTM = decimal.Decimal(CTM)
        # （电池每瓦成本*电池面积系数*运营指标平均投档效率* 运营指标组件版型*（1+运营指标组件碎片率））/运营指标组件入库良率/（运营指标组件平均投档效率*面积系数*组件版型*CTM*（1-运营指标组件标称功率差））
        a = (singlew_cost*batteryare*avgrate* tabletsize*(1+piesrate))/componentinstockgood/(avgrate*batteryare*tabletsize*CTM*(1-wrate))
    except Exception as e:
        print('decimal.Decimal()',e)
    else:
        return a

# 组件每瓦成本公式
def comsinglewCost(component_nongui_cost,battery_const,permodulewage):
    component_nongui_cost = decimal.Decimal(component_nongui_cost)
    battery_const = decimal.Decimal(battery_const)
    permodulewage = decimal.Decimal(permodulewage)
    # 组件每瓦成本(未税):非硅成本+电池成本+人工制费
    return component_nongui_cost + battery_const + permodulewage

# 手机前端每瓦售价计算公式
def eachWprice(price,partscost):
    # 电池毛利率  = (售价-电池每瓦含税)/售价
    # 组件毛利率 = (售价-组件每瓦含税)/售价
    price = decimal.Decimal(price)
    partscost = decimal.Decimal(partscost)
    return ((price-partscost)/price)*decimal.Decimal(100)

# pc前端预估金额 含损耗用量 含税价格 供货比例 变动

def pcestimatedamount(badbom,rateprice,percent):
    # 预估金额 =(含损耗用量*含税价格*供货比例)/1.13
    try:
        money = (badbom*rateprice*percent)/1.13
    except:
        try:
            money = (float(badbom)*float(rateprice)*float(percent))/1.13
        except:
            money = 0
    return money

# 手机端外购页面
def out_price(buybatteryprice,piesrate,CTM,componentinstockgood,now_rate):
    buybatteryprice = decimal.Decimal(buybatteryprice)
    CTM = decimal.Decimal(CTM)
    # 采购成本 = 外购电池/税*(1+组件碎片率)/CTM/组件入库良率
    procurement_cost = buybatteryprice / (1 + now_rate) * (1 + piesrate) / CTM / componentinstockgood
    return procurement_cost


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

#  营运指标管理录入
@login_required
def operationalIndicatorInput(request):
    return render_to_response("extra_module/cost_module/operationalIndicator.html")

# 保存当前税率 saveTaxrate
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def saveTaxrate(request):
    resultObj = tools.successMes()
    if request.method == 'POST':
        createid = request.user.id
        createname = request.user.username
        createtime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        id = UUIDTools.uuid1_hex()
        try:
            taxrate = int(request.POST.get('taxrate'))
            executeSession = sqlutils.SqlUtils(dbType="extension")
            type = 'insert'
            table = '"public"."cost_taxrate"'
            executeSession.executeSql(type,table,id,taxrate=taxrate,createid=createid,createname=createname,createtime=createtime)
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
        return Response(resultObj)


#  营运指标管理列表
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def operationalIndicatorList(request):
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    sql = " select id,productsize,tabletsize,guicost,convertrate,singlew,inbad,instockgood,avgrate,ctm,wrate,piesrate,zinstockgood,aimw,batteryarea from cost_aim"
    fetchall = executeSession.getArrResult(sql,autoClose=True)
    datas = []
    for data in fetchall:
        dics = {}
        dics['id'] = data[0]
        dics['productsize'] = data[1]
        dics['tabletsize'] = data[2]
        dics['guicost'] = data[3]
        dics['convertrate'] = data[4]
        dics['singlew'] = data[5]
        dics['inbad'] = data[6]
        dics['instockgood'] = data[7]
        dics['avgrate'] = data[8]
        dics['ctm'] = data[9]
        dics['wrate'] = data[10]
        dics['piesrate'] = data[11]
        dics['zinstockgood'] = data[12]
        dics['aimw'] = data[13]
        dics['batteryarea'] = data[14]
        datas.append(dics)
    executeSession.closeConnect()
    sql = '''SELECT * FROM "public"."cost_taxrate" ORDER BY createtime DESC LIMIT 1'''
    try:
        rate = executeSession.getArrResult(sql,autoClose=True)
        now_rate = rate[0][1]
    except Exception as e:
        now_rate = 13
    return Response({'rows': datas,'rate':now_rate})

# 保存营运指标
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def saveOperationalIndicator(request):
    datas = []
    datas = json.loads(request.data['datas'])  # 所有新增或更新数据
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    result = {}
    resultObj = tools.successMes()
    current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    username = request.user.username
    userid = request.user.id

    try:
        for data in datas:
            if 'id' in data:
                type = 'update'
                table = '"public"."cost_aim"'
                executeSession.executeSql(type, table, id=data.get('id'), productsize=data['productsize'],tabletsize=data['tabletsize'],
                                          guicost=data['guicost'],convertrate=data['convertrate'],singlew=data['singlew'],inbad=data['inbad'],
                                          instockgood=data['instockgood'],avgrate=data['avgrate'],ctm=data['ctm'],wrate=data['wrate'],
                                          piesrate=data['piesrate'],zinstockgood=data['zinstockgood'],aimw=data['aimw'],modifyid=userid,
                                          modifyname=username,modifytime=current_time,batteryarea=data['batteryarea'])
            else:
                id = UUIDTools.uuid1_hex()
                type = 'insert'
                table = '"public"."cost_aim"'
                executeSession.executeSql(type, table, id=id, productsize=data['productsize'],
                                          tabletsize=data['tabletsize'],guicost=data['guicost'], convertrate=data['convertrate'],
                                          singlew=data['singlew'], inbad=data['inbad'],instockgood=data['instockgood'],
                                          avgrate=data['avgrate'], ctm=data['ctm'],wrate=data['wrate'],piesrate=data['piesrate'],
                                          zinstockgood=data['zinstockgood'],aimw=data['aimw'],createid=userid,createname=username,
                                          createtime=current_time,batteryarea=data['batteryarea'])


    except Exception as e:
        resultObj = tools.errorMes(e.args)
        resultObj['code'] = "0"
    executeSession.closeConnect()
    resultObj['code'] = "1"
    return Response(resultObj)

# 删除运营指标
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def delOperationalIndicator(request):
    ids = request.data['datas']
    executeSession = sqlutils.SqlUtils(dbType="extension")
    resultObj = tools.successMes()
    # 删除营运指标的同时删除趋势图里的对应数据
    try:
        for id in ids.split(','):
            if id:
                selectsql = '''select productsize,tabletsize from cost_aim where id = {}  '''.format(id)
                trend = executeSession.getArrResult(selectsql, autoClose=True)[0]
                delsql = '''DELETE FROM cost_trend WHERE productsize = '{}' and tabletsize = '{}' '''.format(trend[0],trend[1])
                executeSession.excuteSqlByBulkParams(delsql)
                delaimsql = '''DELETE FROM cost_aim WHERE id = {}  '''.format(id)
                executeSession.excuteSqlByBulkParams(delaimsql)
        resultObj['code'] = '1'
    except:
        resultObj['code'] = '0'
    finally:
        executeSession.closeConnect()
    return Response(resultObj)

#  人工费录入
@login_required
def laborFeeInput(request):
    return render_to_response("extra_module/cost_module/laborFee.html")

#  人工费列表
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def laborFeeList(request):
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    resultObj = tools.successMes()
    try:
        sql = r'''SELECT id,costtype, productsize,capacityuse,batterywage,modulewage FROM cost_person  order by productsize,capacityuse desc'''
        allList = executeSession.getArrResult(sql,autoClose=True)
        resultObj['rows'] = allList
        resultObj['code'] = '1'
    except Exception as e:
        resultObj = tools.errorMes(e.args)
        resultObj['code'] = '0'
        resultObj['msg'] = e.args
        resultObj['rows'] = [{}]
    return Response(resultObj)

#  保存人工费信息
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def saveLaborFee(request):
    datas = []
    datas = json.loads(request.data['datas'])  # 所有新增或更新数据
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    result = {}
    resultObj = tools.successMes()
    current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    username = request.user.username
    userid = request.user.id

    try:
        for data in datas:
            if 'id' in data:
                type = 'update'
                table = '"public"."cost_person"'
                executeSession.executeSql(type, table, id=data.get('id'),costtype=data['costtype'],productsize=data['productsize'],
                                          capacityuse=data['capacityuse'],batterywage=data['batterywage'],modulewage=data['modulewage'],modifyid=userid,
                                          modifyname=username,modifytime=current_time)
            else:
                id = UUIDTools.uuid1_hex()
                type = 'insert'
                table = '"public"."cost_person"'
                executeSession.executeSql(type, table, id=id, costtype=data['costtype'],productsize=data['productsize'],
                                          capacityuse=data['capacityuse'], batterywage=data['batterywage'],
                                          modulewage=data['modulewage'],
                                          createid=userid,createname=username,createtime=current_time)


    except Exception as e:
        resultObj = tools.errorMes(e.args)
        resultObj['code'] = "0"
    executeSession.closeConnect()
    resultObj['code'] = "1"
    return Response(resultObj)

# 删除人工费
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def delLaborFee(request):
    ids = request.data['datas']
    table = '"public"."cost_person"'
    resultObj = deleteRecord(table,ids)
    return Response(resultObj)



#  电池BOM录入
@login_required
def batteryBOMInput(request):
    return render_to_response("extra_module/cost_module/batteryBOM.html")

#  电池BOM列表
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def batteryBOMList(request):
    resultObj = tools.successMes()
    productsize = request.POST.get("productsize")
    # 此参数用作导出数据
    export = request.POST.get('export')
    if productsize:
        executeSession = sqlutils.SqlUtils(dbType="extension")
        try:
            sql = r'''SELECT * FROM "public"."cost_bom" where productsize='{}' '''.format(productsize)
            allList = executeSession.getArrResult(sql,autoClose=True)
            # sum(预估金额)
            sumestimatedamountsql = r'''SELECT sum(estimatedamount) FROM "public"."cost_bom" where productsize='{}' '''.format(productsize)
            sumestimatedamount = executeSession.getArrResult(sumestimatedamountsql,autoClose=True)[0][0]
            resultObj['sumestimatedamount'] = sumestimatedamount
            resultObj['rows'] = allList
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
            resultObj['msg'] = e.args
            resultObj['rows'] = [{}]
        # 导出信号
        if export == 'export':
            try:
                # 文件名及文件路径
                filename = '电池BOM{}.xlsx'.format(time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime()))
                thispath = os.path.join(excel_base_path, filename)
                rowsdata = pd.DataFrame(resultObj.get('rows'))
                if rowsdata.empty:
                    pass
                else:
                    # df1 = rowsdata[[20,2,3,6,4,8,5,7,9,10,11,12,13]]
                    rowsdata = rowsdata.fillna(0)
                    leftdf = rowsdata[[20,2,3,6,4,8,5]]
                    rightdf = rowsdata[[7,9,10,11,12,13]].astype('float')
                    alldf = pd.concat([leftdf, rightdf], axis=1)
                    alldf.columns = ['产品尺寸', '数据类型', '分类', '物料名称', '物料编码', '规格型号', '单位', 'BOM', '损耗%', '含损耗用量',
                                   '含税价格', '供货比例', '预估金额']

                    alldf.to_excel(thispath, index=False)
                    # 前台文件下载路径
                    url = download_url + filename
                    resultObj['url'] = url
            except:
                resultObj['code'] = '0'
        return Response(resultObj)
    else:
        return Response({'rows':[],'code':'0','msg':'not productsize'})

#  电池bom保存
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def saveBatteryBOM(request):
    resultObj = tools.successMes()
    if request.method == "POST":
        datas = json.loads(request.POST.get("datas"))
        executeSession = sqlutils.SqlUtils(dbType="extension")
        user_id = request.user.id
        user_name = request.user.username
        try:
            table = '"public"."cost_bom"'
            for data in datas:
                productsize = data.get("productsize")
                datatype = data.get("datatype")
                name = data.get("name")
                materialtype = data.get("materialtype")
                code = data.get("code")
                spec = data.get("spec")
                unit = data.get("unit")
                bom = data.get("bom")
                badcost = data.get("badcost")
                badbom = data.get("badbom")
                rateprice = data.get("rateprice")
                percent = data.get("percent")
                estimatedamount = pcestimatedamount(badbom,rateprice,percent)
                if 'id' in data:
                    type = 'update'
                    id = data.get("id")
                    executeSession.executeSql(type,table,id,productsize=productsize,datatype = datatype,name = name,materialtype = materialtype,code = code,spec = spec,
                                              unit=unit,bom=bom,badcost=badcost,badbom=badbom,rateprice=rateprice,percent=percent,estimatedamount=estimatedamount,
                                              modifytime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),modifyid = user_id,modifyname = user_name)
                else:
                    type = 'insert'
                    id = UUIDTools.uuid1_hex()
                    executeSession.executeSql(type,table,id,productsize=productsize,datatype = datatype,name = name,materialtype = materialtype,code = code,spec = spec,
                                              unit=unit,bom=bom,badcost=badcost,badbom=badbom,rateprice=rateprice,percent=percent,estimatedamount=estimatedamount,
                                              createtime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),createid = user_id,createname = user_name)
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
        return Response(resultObj)


# 删除电池bom记录
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def deleteBatteryBOM(request):
    if request.method == "POST":
        ids = request.POST.get("datas")
        table = '"public"."cost_bom"'
        resultObj = deleteRecord(table,ids)
        return Response(resultObj)


# 电池bom excel导入
@api_view(http_method_names=['POST','GET'])
@permission_classes((permissions.AllowAny,))
def uploadbatteryBOM(request):
    productsize = request.POST.get('productsize')
    if productsize:
        try:
            f = request.FILES['filename']
            table = '"public"."cost_bom"'
            resultsObj = uploadBOM(f, table, productsize)
        except Exception as error:
            resultsObj = tools.errorMes(error.args)
        return Response(resultsObj)
    else:
        return Response({})



def uploadBOM(filename,table,productsize,*args):
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    resultsObj = tools.successMes()

    try:
        # 获取工作簿
        workBook = xlrd.open_workbook(file_contents=filename.read())
        sheetNames = workBook.sheet_names()
        # 当前年份和月份
        current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        # 遍历sheet
        for sheetName in sheetNames:
            workSheet = workBook.sheet_by_name(sheetName)
            if workSheet.nrows <= 1:
                continue
            rowCount = workSheet.nrows
            # 遍历行，从第一行开始
            type = 'insert'
            for i in range(1, rowCount):
                id = UUIDTools.uuid1_hex()
                rows = workSheet.row_values(i)
                # 组件BOM
                if args:
                    for ind in range(8, 14):
                        rowsnum = rows[ind]
                        try:
                            rows[ind] = '{:.8f}'.format(float(rowsnum))
                        except:
                            rows[ind] = 0

                    # 预估金额 =(含损耗用量*含税价格*供货比例)/1.13
                    estimatedamountmoney = pcestimatedamount(rows[10], rows[11], rows[12])
                    executeSession.executeSql(type, table, id,productsize=productsize,tablesize=int(args[0]),datatype=rows[2],materialtype=rows[3],code=rows[5],name=rows[4],
                                              spec=rows[6],unit=rows[7],bom=rows[8],badcost=rows[9],badbom=rows[10],
                                              rateprice=rows[11],percent=rows[12],estimatedamount=estimatedamountmoney,createtime=current_time)
                # 电池BOM
                else:
                    for ind in range(7, 13):
                        rowsnum = rows[ind]
                        try:
                            rows[ind] = '{:.8f}'.format(float(rowsnum))
                        except:
                            rows[ind] = 0
                    estimatedamountmoney = pcestimatedamount(rows[9], rows[10], rows[11])
                    executeSession.executeSql(type, table, id, productsize=productsize,
                                              datatype=rows[1], materialtype=rows[2], code=rows[3], name=rows[4],
                                              spec=rows[5], unit=rows[6], bom=rows[7], badcost=rows[8], badbom=rows[9],
                                              rateprice=rows[10], percent=rows[11], estimatedamount=estimatedamountmoney,
                                              createtime=current_time)

    except Exception as error:
        resultsObj = tools.errorMes(error.args)
    return resultsObj




#  组件BOM录入
@login_required
def componentBOMInput(request):
    return render_to_response("extra_module/cost_module/componentBOM.html")

#  组件BOM列表
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def componentBOMList(request):
    resultObj = tools.successMes()
    productsize = request.POST.get('productsize')
    module = request.POST.get('module')
    # 此参数用作导出数据
    export = request.POST.get('export')
    if productsize and module :
        executeSession = sqlutils.SqlUtils(dbType="extension")
        try:
            sql = r'''SELECT * FROM "public"."cost_bomz" where productsize = '{}' and tablesize = '{}' '''.format(productsize,module)
            allList = executeSession.getArrResult(sql,autoClose=True)
            # sum(预估金额)
            sumestimatedamountsql = r'''SELECT sum(estimatedamount) FROM "public"."cost_bomz" where productsize = '{}' and tablesize = '{}' '''.format(productsize,module)
            sumestimatedamount = executeSession.getArrResult(sumestimatedamountsql,autoClose=True)[0][0]
            resultObj['sumestimatedamount'] = sumestimatedamount
            resultObj['rows'] = allList
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
            resultObj['msg'] = e.args
            resultObj['rows'] = [{}]
        # 导出信号
        if export == 'export':
            try:
                # 文件名及文件路径
                filename = '组件BOM{}.xlsx'.format(time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime()))
                thispath = os.path.join(excel_base_path, filename)
                rowsdata = pd.DataFrame(resultObj.get('rows'))
                if rowsdata.empty:
                    pass
                else:
                    # df1 = rowsdata[[20, 21, 2, 3, 4, 6, 8, 5, 7, 9, 10, 11, 12, 13]]
                    rowsdata = rowsdata.fillna(0)
                    leftdf = rowsdata[[20, 21, 2, 3, 4, 6, 8, 5]]
                    rightdf = rowsdata[[7, 9, 10, 11, 12, 13]].astype('float')
                    alldf = pd.concat([leftdf, rightdf], axis=1)
                    alldf.columns = ['产品尺寸', '版型', '数据类型', '分类', '物料名称', '物料编码', '规格型号', '单位', 'BOM', '损耗%', '含损耗用量',
                                   '含税价格', '供货比例', '预估金额']

                    alldf.to_excel(thispath,index=False)
                    # 前台文件下载路径
                    url = download_url + filename
                    resultObj['url'] = url
            except:
                resultObj['code'] = '0'

    return Response(resultObj)

# 组件bom保存
@api_view(http_method_names=['GET','POST'])
# @permission_classes((permissions.AllowAny,))
def savecomponentBOM(request):
    resultObj = tools.successMes()
    if request.method == "POST":
        datas = json.loads(request.POST.get("datas"))
        executeSession = sqlutils.SqlUtils(dbType="extension")
        user_id = request.user.id
        user_name = request.user.username
        try:
            table = '"public"."cost_bomz"'
            for data in datas:
                productsize = data.get("productsize")
                tablesize = data.get("tablesize")
                datatype = data.get("datatype")
                name = data.get("name")
                materialtype = data.get("materialtype")
                code = data.get("code")
                spec = data.get("spec")
                unit = data.get("unit")
                bom = data.get("bom")
                badcost = data.get("badcost")
                badbom = data.get("badbom")
                rateprice = data.get("rateprice")
                percent = data.get("percent")
                estimatedamount = pcestimatedamount(badbom,rateprice,percent)
                if 'id' in data:
                    type = 'update'
                    id = data.get("id")
                    executeSession.executeSql(type,table,id,productsize=productsize,tablesize=tablesize,datatype = datatype,name = name,materialtype = materialtype,code = code,spec = spec,
                                              unit=unit,bom=bom,badcost=badcost,badbom=badbom,rateprice=rateprice,percent=percent,estimatedamount=estimatedamount,
                                              modifytime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),modifyid = user_id,modifyname = user_name)
                else:
                    type = 'insert'
                    id = UUIDTools.uuid1_hex()
                    executeSession.executeSql(type,table,id,productsize=productsize,tablesize=tablesize,datatype = datatype,name = name,materialtype = materialtype,code = code,spec = spec,
                                              unit=unit,bom=bom,badcost=badcost,badbom=badbom,rateprice=rateprice,percent=percent,estimatedamount=estimatedamount,
                                              createtime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),createid = user_id,createname = user_name)
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
        return Response(resultObj)
# 删除组件bom记录
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def deletecomponentBOM(request):
    if request.method == "POST":
        ids = request.POST.get("datas")
        table = '"public"."cost_bomz"'
        resultObj = deleteRecord(table,ids)
        return Response(resultObj)

# 组件bom excel导入
@api_view(http_method_names=['POST','GET'])
@permission_classes((permissions.AllowAny,))
def uploadModuleBOM(request):
    productsize = request.POST.get('productsize')
    module = request.POST.get('module')
    if productsize and module:
        try:
            f = request.FILES['filename']
            table = '"public"."cost_bomz"'
            resultsObj = uploadBOM(f,table,productsize,module)
        except Exception as error:
            resultsObj = tools.errorMes(error.args)
        return Response(resultsObj)
    else:
        return Response({})

#  ------采购电池录入------
@login_required
def outsourcingBatteryInput(request):
    return render_to_response("extra_module/cost_module/outsourcingBattery.html")
#  采购电池列表
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def outsourcingBatteryList(request):
    resultObj = tools.successMes()
    executeSession = sqlutils.SqlUtils(dbType="extension")
    try:
        sql = r'''SELECT * FROM "public"."cost_purchase"'''
        allList = executeSession.getArrResult(sql,autoClose=True)
        resultObj['rows'] = allList
        resultObj['code'] = '1'
    except Exception as e:
        resultObj = tools.errorMes(e.args)
        resultObj['code'] = '0'
        resultObj['msg'] = e.args
        resultObj['rows'] = [{}]
    return Response(resultObj)
# 外购电池成本 保存
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def savesourcingBattery(request):
    resultObj = tools.successMes()
    if request.method == "POST":
        user_id = request.user.id
        user_name = request.user.username
        datas = json.loads(request.POST.get("datas"))
        executeSession = sqlutils.SqlUtils(dbType="extension")
        try:
            table = '"public"."cost_purchase"'
            for data in datas:
                productsize = data.get("productsize")
                price = data.get('price')
                if 'id' in data:
                    type = 'update'
                    id = data.get("id")
                    executeSession.executeSql(type,table,id,price = price,productsize = productsize,modifytime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),modifyid = user_id,modifyname = user_name)
                else:
                    type = 'insert'
                    id = UUIDTools.uuid1_hex()
                    executeSession.executeSql(type,table,id,price = price,productsize = productsize,createtime = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),createid = user_id,createname = user_name)
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
        return Response(resultObj)
# 删除外购电池记录
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def deletesourcingBattery(request):
    if request.method == "POST":
        ids = request.POST.get("datas")
        table = '"public"."cost_purchase"'
        resultObj = deleteRecord(table,ids)
        return Response(resultObj)

#  -----成本版本管理录入-----

@login_required
def costVersion(request):
    return render_to_response("extra_module/cost_module/costVersion.html")

@login_required
def costVersionInput(request):
    return render_to_response("extra_module/cost_module/costVersionInfo.html")
#  成本版本管理列表
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def costVersionList(request):
    resultObj = tools.successMes()
    if request.method == "GET":
        executeSession = sqlutils.SqlUtils(dbType="extension")
        try:
            sql = r'''SELECT a.id,a.productsize,a.tabletsize,a.battery,a.component,a.guicost ,a.batterygui,a.batterynongui,a.componentnongui,a.batterysinglew,b.versionsaver , b.versionsavetime , c.batterywage as batteryperwage ,c.modulewage as componentperwage FROM cost_trend a ,cost_version b ,cost_person c where a.createtime = b.versionsavetime and a.productsize = c.productsize and a.capacityuse = c.capacityuse and a.capacityuse = 100 ORDER BY a.createtime desc'''
            allList = executeSession.getArrResult(sql,autoClose=True)
            versionsql = r''' select * from cost_version  order by versionsavetime desc'''
            versionallList = executeSession.getArrResult(versionsql, autoClose=True)
            resultObj['rows'] = allList
            resultObj['rowsversion'] = versionallList
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
            resultObj['msg'] = e.args
            resultObj['rows'] = [{}]
        return Response(resultObj)


# 成本版本管理添加保存
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def saveCostVersion(request):
    resultObj = tools.successMes()
    executeSession = sqlutils.SqlUtils(dbType="extension")
    if request.method == "POST":
        createid = request.user.id
        createname = request.user.username
        createtime = datetime.datetime.now().strftime('%Y-%m-%d')
        # 保存之前先删除掉当天记录
        deletesql = r'''DELETE FROM "public"."cost_trend" WHERE createtime='{}' '''.format(createtime)
        executeSession.excuteSqlByBulkParams(deletesql)
        deleteversql = r'''DELETE FROM "public"."cost_version" WHERE versionsavetime='{}' '''.format(createtime)
        executeSession.excuteSqlByBulkParams(deleteversql)
        # 营运指标
        aimsql = r'''select * from "public"."cost_aim"'''
        aimall = executeSession.getArrResult(aimsql,autoClose=True)
        # *电池区分单多晶
        batbomsql = r'''SELECT productsize,SUM(estimatedamount) FROM "public"."cost_bom" GROUP BY productsize'''
        battery_bom = executeSession.getArrResult(batbomsql,autoClose=True)
        # 默认第一条材料方案的预估金额
        materialsql = r'''select spec,productsize,tablesize,estimatedamount  from "public"."cost_bomz"  where estimatedamount in (
                        select   max(estimatedamount) estimatedamount from (
                        SELECT  DISTINCT spec,productsize,tablesize,estimatedamount  FROM "public"."cost_bomz" WHERE datatype = '材料组合') a
                        group by productsize,tablesize)'''
        materialestimateddamount = executeSession.getArrResult(materialsql,autoClose=True)

        # *组件区分60 72  默认 sum(预估价格)   计算需要加上玻璃
        combomsql = r'''SELECT  productsize,tablesize,sum(estimatedamount) FROM "public"."cost_bomz" WHERE datatype = '默认'  GROUP BY productsize,tablesize'''
        component_bom = executeSession.getArrResult(combomsql,autoClose=True)
        # 玻璃对应尺寸的价格
        bolisql = r'''select distinct productsize,tablesize,rateprice from cost_bomz  where datatype = '玻璃' '''
        bolicosts = executeSession.getArrResult(bolisql,autoClose=True)
        # 当前税率
        try:
            ratesql = r'''SELECT * FROM "public"."cost_taxrate" ORDER BY createtime DESC LIMIT 1'''
            now_rate = (executeSession.getArrResult(ratesql,autoClose=True)[0][1])/100
        except:
            now_rate = 0.13
        # 人工制费
        personsql = r'''SELECT productsize,capacityuse,batterywage,modulewage FROM "public"."cost_person" '''
        personcost = executeSession.getArrResult(personsql,autoClose=True)
        # 非硅成本：（sum（电池BOM预估金额）/运营指标电池单片瓦数 /（运营指标电池入库良率-硅片来料不良））/(1+税率)
        # 电池成本：（每瓦成本*电池面积系数*运营指标平均投档效率* 运营指标组件版型*（1+运营指标组件碎片率））/运营指标组件入库良率/（运营指标组件平均投档效率*面积系数*组件版型*CTM*（1-运营指标组件标称功率差））
        def fetchall(aim):
            productsize = aim[2]
            tabletsize = int(aim[3])
            guicost = aim[4]
            batteryare = aim[6]
            singlew = aim[7]
            inbad = aim[8]/100
            batteryinstockgood = aim[9]/100
            avgrate = aim[10]/100
            CTM = aim[11]/100
            wrate = aim[12]/100
            piesrate = aim[13]/100
            componentinstockgood = aim[14]/100

            # 判断是否为双玻
            if '双玻' in productsize:
                isshuangbo = True
            else:
                isshuangbo = False

            battery_sum_bom = ''
            for battery in battery_bom:
                if battery[0] == productsize:
                    battery_sum_bom = battery[1]
                    break
            productlist = []
            try:
                # 电池非硅成本
                battery_nongui_cost = batnonguiCost(battery_sum_bom,singlew,batteryinstockgood,inbad,now_rate)
                # 电池硅片成本
                gui = batguiCost(guicost,singlew,batteryinstockgood,inbad,now_rate)
                # 各种尺寸玻璃的价格
                for i in bolicosts:
                    if i[0] == productsize and i[1] == tabletsize:
                        bolicost = i[2]
                        break
                else:
                    bolicost = 0
                # 默认材料方案价格
                materialestimated = ''
                spec = ''
                for material in materialestimateddamount:
                    if material[1] == productsize and material[2] == tabletsize:
                        spec = material[0]
                        materialestimated = material[3]
                        break
                component_sum_bom = ''
                for component in component_bom:
                    if component[0] == productsize and component[1] == tabletsize:
                        component_sum_bom = component[2]
                # 组件非硅成本 版本保存
                if isshuangbo:
                    component_nongui_cost = newComnonguiCost(component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate)
                else:
                    component_nongui_cost = comnonguiCost(bolicost,now_rate,materialestimated,component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate)
                # 所有方案都受到人工制费的影响
                for i in personcost:
                    if i[0] == productsize:
                        capacityuse = i[1]
                        batterywage = i[2]
                        modulewage = i[3]
                        # 电池每瓦成本
                        singlew_cost = batsinglewCost(gui,battery_nongui_cost,batterywage)
                        # 电池成本
                        batterycost = combatCost(singlew_cost,batteryare,avgrate,tabletsize,piesrate,componentinstockgood,CTM,wrate)
                        batteryaftcost = batterycost * (1+now_rate)
                        # 组件每瓦成本
                        component = comsinglewCost(component_nongui_cost,batterycost,modulewage)
                        componentaftrate = component * (1+now_rate)
                        id = UUIDTools.uuid1_hex()
                        costtrend = (id,batterycost,component,batteryaftcost,componentaftrate,guicost,productsize,tabletsize,capacityuse,createid,createname,createtime,spec,gui,battery_nongui_cost,component_nongui_cost,singlew_cost)
                        productlist.append(costtrend)
            except Exception as e:
                print('/cost/saveCostVersion',e)
            return productlist
        # 将数据存入到数据库 cost_trend
        try:
            for fileds in map(fetchall,aimall):
                for filed in fileds:
                    type = 'insert'
                    table = '"public"."cost_trend"'
                    executeSession.executeSql(type,table,filed[0],battery=filed[1],component=filed[2],batteryaftrate=filed[3],componentaftrate=filed[4],guicost=filed[5],productsize=filed[6],tabletsize=filed[7],capacityuse=filed[8],createid=filed[9],
                                              createname=filed[10],createtime=filed[11],datatype=filed[12],batterygui=filed[13],batterynongui=filed[14],componentnongui=filed[15],batterysinglew=filed[16])
        except Exception as e:
            print('/cost/saveCostVersion ---',e)
        # 保存成本版本管理人信息 cost_version
        try:
            versionsql = '''SELECT * FROM "public"."cost_version" WHERE versionsavetime='{}' '''.format(createtime)
            # 当天保存过就不再保存用户当天记录
            if not executeSession.getArrResult(versionsql,autoClose=True):
                type = 'insert'
                table = '"public"."cost_version"'
                id = UUIDTools.uuid1_hex()
                executeSession.executeSql(type,table,id,versionsaverid=createid,versionsaver=createname,versionsavetime=createtime)
            resultObj['code'] = '1'
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
        return Response(resultObj)

# 删除成本版本管理记录
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def deleteCostVersion(request):
    if request.method == "POST":
        ids = request.POST.get("datas")
        table = '"public"."cost_version"'
        # 删除保存好的对应数据
        executeSession = sqlutils.SqlUtils(dbType="extension")
        try:
            for id in ids.split(','):
                if id:
                    versionidsql = r'''SELECT versionsavetime FROM "public"."cost_version" WHERE id={} '''.format(id)
                    date = executeSession.getArrResult(versionidsql,autoClose=True)[0][0]
                    deletesql = r'''DELETE FROM "public"."cost_trend" WHERE createtime='{}' '''.format(date)
                    executeSession.excuteSqlByBulkParams(deletesql)
            resultObj = deleteRecord(table,ids)
        except Exception as e:
            resultObj = tools.errorMes(e.args)
            resultObj['code'] = '0'
        return Response(resultObj)

# 从营运指标获取产品尺寸
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def getProductSize(request):
    type = request.POST['code']
    datas = []
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    if type == 'productSize':
        sql = "select distinct productsize from cost_aim"
    else:
        sql = "select distinct tabletsize from cost_aim"
    try:
        fetchall = executeSession.getArrResult(sql,autoClose=True)
        for obj in fetchall:
            dics = {}
            dics['name'] = obj[0]
            datas.append(dics)
    except Exception as err:
        logger.error(err)
    result = {}
    result['data'] = datas
    return Response({"successful": "true", "rows": datas})

# 重新生成表数据（定制方法）
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def regenerateData(request):
    """ 此方法包含重新生成表数据方法,同时设置默认值  """
    resultsObj = tools.successMes()
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    # 接收前台传递的表格名称，电池端计算结果为battery  组件端计算结果为component   外购组件端为 component_out
    # 获取表格的类型
    tabletype = request.GET.get('tabletype')
    # 获取前端数据
    guicost = request.GET.get('guicost')
    CTM1 = request.GET.get('CTM')
    if CTM1:
        CTM = float(CTM1)/100
    else:
        CTM = None
    materials = request.GET.get('materials')
    # 此处玻璃为每平米的价格
    glassPrice = request.GET.get('glassPrice')
    # 获取外购电池价格
    buybatteryprice = request.GET.get("buybatteryprice")
    # 前端是否输入
    inputcomprice = request.GET.get('inputcomprice')
    inputbatprice = request.GET.get('inputbatprice')

    #设置默认值
    # 获取产品尺寸的默认值(获取第一条即可) 初始化使用查询的默认值
    if 'productsize' in request.GET:
        productsize = request.GET.get('productsize')
        first = False
    else:
        objs = scenes.objects.all()
        productsize = ''
        for ob in objs:
            item = json.loads(ob.items)
            for it in item:
                data = it.get('data')
                id = data.get('id')
                if '5367F8C3EF3FDB4972A659EA37BA6AE2' == id or 'F27BFE8193ED1C49C3DFEAB4AE4BAE82' == id:
                    productsize = it['data']['defaultValText']
        sql = r''' select productsize from cost_aim where productsize ='{}' '''.format(productsize)
        try:
            productsize = executeSession.getArrResult(sql, autoClose=True)[0][0]
        except:
            sql = r'''select productsize from cost_aim  ORDER BY createtime desc limit 1'''
            productsize = executeSession.getArrResult(sql, autoClose=True)[0][0]
        first = True
    # 此处判断是否为双玻新产品
    if '双玻' in productsize:
        isshuangbo = True
    else:
        isshuangbo = False

    # 获得前端人工制费和组件制费
    batterycapacityuse = request.GET.get('batterycapacityuse',"100")
    batterycapacityuse = batterycapacityuse.replace('%','')
    componentcapacityuse = request.GET.get('componentcapacityuse','100')
    componentcapacityuse = componentcapacityuse.replace('%','')
    perbatterycostsql =r'''SELECT batterywage FROM cost_person WHERE productsize='{}' AND capacityuse='{}' '''.format(productsize,batterycapacityuse)
    prebatterywage = executeSession.getArrResult(perbatterycostsql, autoClose=True)[0][0]

    permodulewagecostsql = r'''SELECT modulewage FROM cost_person WHERE productsize='{}' AND capacityuse='{}' '''.format(productsize,componentcapacityuse)
    permodulewage = executeSession.getArrResult(permodulewagecostsql, autoClose=True)[0][0]

    try:

        if first:
            glasssql = r''' select distinct  spec,rateprice from cost_bomz where productsize='{}' and datatype='玻璃' LIMIT 1'''.format(productsize)
            glassPriceRes = executeSession.getArrResult(glasssql, autoClose=True)[0]
            n1 = glassPriceRes[0].split('*')[0]
            n2 = glassPriceRes[0].split('*')[1]
            glassPrice = glassPriceRes[1]/(decimal.Decimal(n1)*decimal.Decimal(n2)/1000000)
            # 获得硅片和ctm的默认值
            ctmsql = r''' select distinct guicost,ctm from cost_aim where productsize='{}' '''.format(productsize)
            fetchall = executeSession.getArrResult(ctmsql, autoClose=True)
            guicost = fetchall[0][0]
            CTM = fetchall[0][1] / 100
            # 获取人工制费
            batterycapacityusesql = r''' SELECT batterywage FROM cost_person WHERE productsize='{}' AND capacityuse='{}' '''.format(productsize,batterycapacityuse)
            prebatterywage = executeSession.getArrResult(batterycapacityusesql, autoClose=True)[0][0]
            componentcapacityusesql = r'''SELECT modulewage FROM cost_person WHERE productsize='{}' AND capacityuse='{}' '''.format(productsize,componentcapacityuse)
            permodulewage = executeSession.getArrResult(componentcapacityusesql, autoClose=True)[0][0]
            # 获取材料组合
            if not isshuangbo:
                materialssql = r'''SELECT   distinct code,spec  FROM "public"."cost_bomz"  WHERE datatype='材料组合' AND productsize='{}' LIMIT 1'''.format(productsize)
                materials = executeSession.getArrResult(materialssql, autoClose=True)[0][1]
            # 获取外购电池价格
            sql = r'''select price from cost_purchase where productsize = '{}' '''.format(productsize)
            buybatteryprice = executeSession.getArrResult(sql, autoClose=True)[0][0]

        if first:
            def obj(js):
                data = js.get('data')
                id = data.get('id')
                if '5367F8C3EF3FDB4972A659EA37BA6AE2' == id or 'F27BFE8193ED1C49C3DFEAB4AE4BAE82' == id:
                    js['data']['defaultValText'] = productsize
                if '4229F9A72918589D9F81B3466D84DFA0' == id or '76C2A9813F16D80078354A2040866EE8' == id:
                    js['data']['defaultValText'] = materials
                if '926A0FF8BC5FBF36B468BF3AF5D5B71B' == id:
                    if guicost:
                        js['data']['defaultValText'] = str(decimal.Decimal("%.4f" % float(guicost)))
                if '083F1E0E854A5D41A9966FFCF975FC96' == id:
                    js['data']['customValue'] = buybatteryprice
                if 'A741E37EDCDC8645DFB26C89B1580E02' == id or '02ECD9DA7A75342A7A0A79D251ADB148' == id:
                    if glassPrice:
                        js['data']['defaultValText'] = str(decimal.Decimal("%.4f" % float(glassPrice)))
                # if '30A83706963F5BFDC1EB6F2E54BE2430' == id or '0745E4C5BF45ED78F566CB09A6DE02F1' == id:
                #     if permodulewage:
                #         js['data']['defaultValText'] = str(decimal.Decimal("%.4f" % float(permodulewage)))
                # if '8CE9E4643B070F9D7F71698EF806FE7C' == id:
                #     if prebatterywage:
                #         js['data']['defaultValText'] = str(decimal.Decimal("%.4f" % float(prebatterywage)))
                if '99A5C4C7A2EB9A8F0A165F3FC8FAC31D' == id:
                    if CTM:
                        js['data']['customValue'] = str(CTM*100)
                return js
            objs = scenes.objects.all()
            for ob in objs:
                item = json.loads(ob.items)
                items = list(map(obj,item))
                items = json.dumps(items,cls=DecimalEncoder)
                ob.items = items
                ob.save()

    except Exception as err:
        print('errr',err)

    # 电池sum 预估金额
    batbomsql = r'''SELECT productsize,SUM(estimatedamount) FROM "public"."cost_bom" GROUP BY productsize'''
    battery_bom = executeSession.getArrResult(batbomsql, autoClose=True)
    battery_sum_bom = ''
    for battery in battery_bom:
        if battery[0] == productsize:
            battery_sum_bom = battery[1]
            break
    # 当前税率
    try:
        ratesql = r'''SELECT * FROM "public"."cost_taxrate" ORDER BY createtime DESC LIMIT 1'''
        now_rate = (executeSession.getArrResult(ratesql, autoClose=True)[0][1]) / 100
    except:
        now_rate = 0.13
    # 营运指标
    aimsql = r'''select * from "public"."cost_aim"'''
    aimall = executeSession.getArrResult(aimsql, autoClose=True)
    if tabletype == 'battery':
        try:
            '''计算电池端'''
            resultsObj['data'] = []
            # 硅片含税
            resultbattery = {}
            resultbattery['costitem'] = '硅片(含税)'
            resultbattery['cost'] = guicost
            resultsObj['data'].append(resultbattery)
            sql = r'''select singlew ,instockgood, inbad from cost_aim  where productsize='{}' '''.format(productsize)
            fetchall = executeSession.getArrResult(sql, autoClose=True)[0]  # 获取其中一条即可，60  72  电池端相同
            singlew = fetchall[0]       # 电池单片瓦数
            instockgood = fetchall[1]/100   # 电池入库良率
            inbad = fetchall[2]  /100       # 硅片来料不良
            # 电池硅片成本
            siliconCost = batguiCost(guicost,singlew,instockgood,inbad,now_rate)
            resultbattery = {}
            resultbattery['costitem'] = '硅片成本'
            resultbattery['cost'] = round(siliconCost,4)
            resultsObj['data'].append(resultbattery)
            # 电池非硅成本
            nonSiliconCost = batnonguiCost(battery_sum_bom,singlew,instockgood,inbad,now_rate)
            resultbattery = {}
            resultbattery['costitem'] = '非硅成本'
            resultbattery['cost'] = '{:0.4f}'.format(nonSiliconCost)
            resultsObj['data'].append(resultbattery)

            # 人工制费
            resultbattery = {}
            resultbattery['costitem'] = '人工制费'
            resultbattery['cost'] = prebatterywage
            resultsObj['data'].append(resultbattery)
            # 电池每瓦成本
            resultbattery = {}
            resultbattery['costitem'] = '每瓦成本(未税)'
            costPerWatt = batsinglewCost(siliconCost,nonSiliconCost,prebatterywage)
            resultbattery['cost'] = '{:0.4f}'.format(costPerWatt)
            resultsObj['data'].append(resultbattery)
            # 外售电池片成本：每瓦成本*（1+税率）
            resultbattery = {}
            resultbattery['costitem'] = '每瓦成本(含税)'
            p = costPerWatt * ( 1 + now_rate)
            resultbattery['cost'] = '{:0.4f}'.format(p)
            resultsObj['data'].append(resultbattery)
            # 输入了电池售价
            if inputbatprice:
                # 每瓦售价(电池)
                resulteachwbat = {}
                resulteachwbat['costitem'] = '毛利率(100%)'
                resulteachwbat['cost'] = '{:0.2f}%'.format(eachWprice(inputbatprice,p))
                resultsObj['data'].append(resulteachwbat)
        except Exception as e:
            print(e,"-"*50)

        # *组件区分60 72  默认 sum(预估价格)   计算需要加上玻璃
    combomsql = r'''SELECT  productsize,tablesize,sum(estimatedamount) FROM "public"."cost_bomz" WHERE datatype = '默认'  GROUP BY productsize,tablesize'''
    component_bom = executeSession.getArrResult(combomsql, autoClose=True)
    spec = materials
    print({"获取到的参数":[productsize,spec,guicost]})
    if tabletype == 'component':
        resultsObj['data'] = []
        batterycost60 = 0
        batterycost72 = 0
        resultnongui = {}
        resultnongui['costinfo'] = '非硅成本'
        resultsinglewnonrax = {}
        resultsinglewnonrax['costinfo'] = '每瓦成本(未税)'
        resultsinglew = {}
        resultsinglew['costinfo'] = '每瓦成本(含税)'
        # 每瓦售价(组件)
        resulteachwcom = {}
        resulteachwcom['costinfo'] = '毛利率(100%)'
        for aim in aimall:
            aimproductsize = aim[2]
            tabletsize = int(aim[3])
            batteryare = aim[6]
            singlew = aim[7]
            inbad = aim[8] / 100
            batteryinstockgood = aim[9] / 100
            avgrate = aim[10] / 100
            aimCTM = aim[11] / 100
            wrate = aim[12] / 100
            piesrate = aim[13] / 100
            componentinstockgood = aim[14] / 100
            try:
                for component in component_bom:
                    if component[0] == productsize == aimproductsize and component[1] == tabletsize:
                        if isshuangbo:
                            materialestimated = None
                        else:
                            # 获取到材料对应的编码
                            codesql = r'''SELECT   distinct code,spec  FROM "public"."cost_bomz"  WHERE datatype='材料组合' AND productsize='{}' AND spec = '{}' '''.format(productsize,spec)
                            code = executeSession.getArrResult(codesql,autoClose=True)[0][0]
                            # 获取到材料方案价格
                            materialsql = r'''SELECT  estimatedamount  FROM "public"."cost_bomz" WHERE code = '{}' AND productsize='{}' AND tablesize='{}' LIMIT 1'''.format(code,productsize,tabletsize)
                            materialestimated = executeSession.getArrResult(materialsql,autoClose=True)[0][0]
                        component_sum_bom = component[2]
                        # 电池singlew_cost成本   每瓦成本：硅片+非硅+人工制费
                        battery_nongui_cost = batnonguiCost(battery_sum_bom,singlew,batteryinstockgood,inbad,now_rate)
                        # 电池硅成本
                        gui_cost = batguiCost(guicost,singlew,batteryinstockgood,inbad,now_rate)
                        # 电池每瓦成本
                        singlew_cost = batsinglewCost(gui_cost,battery_nongui_cost,prebatterywage)
                        # 电池成本
                        battery_const = combatCost(singlew_cost,batteryare,avgrate,tabletsize,piesrate,componentinstockgood,aimCTM,wrate)
                        if tabletsize == 60:
                            try:
                                # 是否有玻璃的价格没有就为0不参与计算
                                isglasspricesql = r''' select distinct  spec,rateprice from cost_bomz where datatype='玻璃' and productsize='{}' and tablesize='{}' '''.format(productsize,tabletsize)
                                eachmi = executeSession.getArrResult(isglasspricesql,autoClose=True)[0]
                                n1 = eachmi[0].split('*')[0]
                                n2 = eachmi[0].split('*')[1]
                                totalGlassPrice = float(glassPrice)*(float(n1)*float(n2)/1000000)
                            except:
                                totalGlassPrice = 0
                            # 组件非硅成本 双玻为新公式
                            if isshuangbo:
                                component_nongui_cost = newComnonguiCost(component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,aimCTM,wrate)
                            else:
                                component_nongui_cost = comnonguiCost(totalGlassPrice,now_rate,materialestimated,component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,aimCTM,wrate)
                            # 组件每瓦成本(未税)
                            component_singlew_cost = comsinglewCost(component_nongui_cost,battery_const,permodulewage)
                            batterycost60 = battery_const
                            resultnongui['component60'] = '{:0.4f}'.format(component_nongui_cost)
                            resultsinglewnonrax['component60'] = '{:0.4f}'.format(component_singlew_cost)
                            # 组件每瓦成本(含税税)
                            comp = component_singlew_cost * (1 + now_rate)
                            resultsinglew['component60'] = '{:0.4f}'.format(comp)
                            # 输入了组件售价
                            if inputcomprice:
                                # 每瓦售价(组件)
                                resulteachwcom['component60'] = '{:0.2f}%'.format(eachWprice(inputcomprice,comp))
                        if tabletsize ==72:
                            try:
                                # 是否有玻璃的价格没有就为0不参与计算
                                isglasspricesql = r''' select distinct  spec,rateprice from cost_bomz where datatype='玻璃' and productsize='{}' and tablesize='{}' '''.format(productsize,tabletsize)
                                eachmi = executeSession.getArrResult(isglasspricesql,autoClose=True)[0]
                                n1 = eachmi[0].split('*')[0]
                                n2 = eachmi[0].split('*')[1]
                                totalGlassPrice = float(glassPrice)*(float(n1)*float(n2)/1000000)
                            except:
                                totalGlassPrice = 0
                            # 组件非硅成本 双玻为新公式
                            if isshuangbo:
                                component_nongui_cost = newComnonguiCost(component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,aimCTM,wrate)
                            else:
                                component_nongui_cost = comnonguiCost(totalGlassPrice,now_rate,materialestimated,component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,aimCTM,wrate)

                            # 组件每瓦成本(未税)
                            component_singlew_cost = comsinglewCost(component_nongui_cost,battery_const,permodulewage)
                            batterycost72 = battery_const
                            resultnongui['component72'] = '{:0.4f}'.format(component_nongui_cost)
                            resultsinglewnonrax['component72'] = '{:0.4f}'.format(component_singlew_cost)
                            # 组件每瓦成本含税
                            comp = component_singlew_cost * (1 + now_rate)
                            resultsinglew['component72'] = '{:0.4f}'.format(comp)
                            if inputcomprice:
                                resulteachwcom['component72'] = '{:0.2f}%'.format(eachWprice(inputcomprice,comp))

            except Exception as e:
                print(e)
        resultsObj['data'].append(resultnongui)
        resultbattery = {}
        resultbattery['costinfo'] = '电池成本'
        resultbattery['component60'] = '{:0.4f}'.format(batterycost60)
        resultbattery['component72'] = '{:0.4f}'.format(batterycost72)
        resultsObj['data'].append(resultbattery)
        # 人工制费
        resultpercost = {}
        resultpercost['costinfo'] = '人工制费'
        resultpercost['component60'] = '{:0.4f}'.format(permodulewage)
        resultpercost['component72'] = '{:0.4f}'.format(permodulewage)
        resultsObj['data'].append(resultpercost)
        resultsObj['data'].append(resultsinglewnonrax)
        resultsObj['data'].append(resultsinglew)
        if inputcomprice:
            # 组件毛利率
            resultsObj['data'].append(resulteachwcom)

    # 外购页面
    if tabletype == 'component_out':
        resultsObj['data'] = []
        resultsinglewnonrax = {}
        resultsinglewnonrax['costinfo'] = '每瓦成本(未税)'
        resultnongui = {}
        resultnongui['costinfo'] = '非硅成本'
        resultsinglew = {}
        resultsinglew['costinfo'] = '每瓦成本(含税)'
        # 每瓦售价(组件)
        resulteachwcom = {}
        resulteachwcom['costinfo'] = '毛利率(100%)'
        # 采购成本
        price = {}
        price['costinfo'] = '采购成本'

        for aim in aimall:
            aimproductsize = aim[2]
            tabletsize = int(aim[3])
            guicost = aim[4]
            batteryare = aim[6]
            avgrate = aim[10] / 100
            wrate = aim[12] / 100
            piesrate = aim[13] / 100
            componentinstockgood = aim[14] / 100
            try:
                for component in component_bom:
                    if component[0] == productsize == aimproductsize and component[1] == tabletsize:
                        if not isshuangbo:
                            # 获取到材料对应的编码
                            codesql = r'''SELECT  code  FROM "public"."cost_bomz"  WHERE datatype='材料组合' AND productsize='{}' AND spec = '{}' '''.format(productsize,spec)
                            code = executeSession.getArrResult(codesql,autoClose=True)[0][0]
                            # 获取到材料方案价格
                            materialsql = r'''SELECT  estimatedamount  FROM "public"."cost_bomz" WHERE code = '{}' AND productsize='{}' AND tablesize='{}' LIMIT 1'''.format(code,productsize,tabletsize)
                            materialestimated = executeSession.getArrResult(materialsql,autoClose=True)[0][0]
                        component_sum_bom = component[2]
                        if tabletsize == 60:
                            try:
                                # 是否有玻璃的价格没有就为0不参与计算
                                isglasspricesql = r''' select distinct  spec,rateprice from cost_bomz where datatype='玻璃' and productsize='{}' and tablesize='{}' '''.format(productsize,tabletsize)
                                eachmi = executeSession.getArrResult(isglasspricesql,autoClose=True)[0]
                                n1 = eachmi[0].split('*')[0]
                                n2 = eachmi[0].split('*')[1]
                                totalGlassPrice = float(glassPrice)*(float(n1)*float(n2)/1000000)
                            except:
                                totalGlassPrice = 0
                            # 组件非硅成本 双玻为新公式
                            if isshuangbo:
                                component_nongui_cost = newComnonguiCost(component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate)
                            else:
                                component_nongui_cost = comnonguiCost(totalGlassPrice,now_rate,materialestimated,component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate)
                            # 采购成本
                            procurement_cost = out_price(buybatteryprice,piesrate,CTM,componentinstockgood,now_rate)
                            price['component60'] = '{:0.4f}'.format(procurement_cost)

                            # 组件每瓦成本(未税)
                            component_singlew_cost = comsinglewCost(component_nongui_cost,buybatteryprice,permodulewage)
                            resultnongui['component60'] = '{:0.4f}'.format(component_nongui_cost)
                            resultsinglewnonrax['component60'] = '{:0.4f}'.format(component_singlew_cost)
                            compout = component_singlew_cost * (1 + now_rate)
                            resultsinglew['component60'] = '{:0.4f}'.format(compout)
                            # 输入了组件售价
                            if inputcomprice:
                                # 每瓦售价(组件)
                                resulteachwcom['component60'] = '{:0.2f}%'.format(eachWprice(inputcomprice,compout))
                        if tabletsize ==72:
                            try:
                                # 是否有玻璃的价格没有就为0不参与计算
                                isglasspricesql = r''' select distinct  spec,rateprice from cost_bomz where datatype='玻璃' and productsize='{}' and tablesize='{}' '''.format(productsize,tabletsize)
                                eachmi = executeSession.getArrResult(isglasspricesql,autoClose=True)[0]
                                n1 = eachmi[0].split('*')[0]
                                n2 = eachmi[0].split('*')[1]
                                totalGlassPrice = float(glassPrice)*(float(n1)*float(n2)/1000000)
                            except:
                                totalGlassPrice = 0
                            # 组件非硅成本 双玻为新公式
                            if isshuangbo:
                                component_nongui_cost = newComnonguiCost(component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate)
                            else:
                                component_nongui_cost = comnonguiCost(totalGlassPrice,now_rate,materialestimated,component_sum_bom,componentinstockgood,avgrate,batteryare,tabletsize,CTM,wrate)

                            # 采购成本
                            procurement_cost = out_price(buybatteryprice, piesrate, CTM, componentinstockgood,now_rate)
                            price['component72'] = '{:0.4f}'.format(procurement_cost)
                            # 组件每瓦成本(未税)
                            component_singlew_cost = comsinglewCost(component_nongui_cost,buybatteryprice,permodulewage)
                            resultnongui['component72'] = '{:0.4f}'.format(component_nongui_cost)
                            resultsinglewnonrax['component72'] = '{:0.4f}'.format(component_singlew_cost)
                            compout = component_singlew_cost * (1 + now_rate)
                            resultsinglew['component72'] = '{:0.4f}'.format(compout)
                            if inputcomprice:
                                resulteachwcom['component72'] = '{:0.2f}%'.format(eachWprice(inputcomprice,compout))
            except Exception as e:
                print(e)
        resultsObj['data'].append(resultnongui)
        # 人工制费
        resultpercost = {}
        resultpercost['costinfo'] = '人工制费'
        resultpercost['component60'] = '{:0.4f}'.format(permodulewage)
        resultpercost['component72'] = '{:0.4f}'.format(permodulewage)
        resultsObj['data'].append(price)
        resultsObj['data'].append(resultpercost)
        resultsObj['data'].append(resultsinglewnonrax)
        resultsObj['data'].append(resultsinglew)
        # 组件毛利率
        if inputcomprice:
            resultsObj['data'].append(resulteachwcom)
    else:
        result = {}
        total = 0
    return Response(resultsObj)

# 筛选框联动方法
@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def getLinkageData(request):
    # 获取需要更改的下拉框
    dropDownBox = request.GET.get('dropdownbox')
    resultsObj = tools.successMes()
    # 获取产品尺寸
    productsize = request.GET.get('productsize')
    superdep = request.GET.get('superdep')
    if superdep:
        # oa报表级联下拉框
        executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        sql = r'''select distinct departmentname from oa_department_attendance where superdep='{}' '''.format(superdep)
        objs = executeSession.getArrResult(sql, autoClose=True)
        results = {}
        result = []
        for obj in objs:
            dics = {}
            dics['id'] = obj[0]
            dics['name'] = obj[0]
            dics['checked'] = False
            dics['show'] = True
            result.append(dics)
            results['superdep'] = (np.array(result))

    # 查找对应的材料方案
    if productsize:
        executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
        sql = r'''SELECT distinct spec  FROM cost_bomz WHERE datatype='材料组合' AND productsize='{}' '''.format(productsize)
        objs = executeSession.getArrResult(sql, autoClose=True)
        results = {}
        result = []
        for obj in objs:
            dics = {}
            dics['id'] = obj[0]
            dics['name'] = obj[0]
            dics['checked'] = False
            dics['show'] = True
            result.append(dics)
            results['materials'] = (np.array(result))
        # 查找电池人工制费
        sql = r'''SELECT capacityuse  FROM cost_person WHERE productsize='{}' '''.format(productsize)
        objs = executeSession.getArrResult(sql, autoClose=True)
        result = []
        for obj in objs:
            dics = {}
            dics['id'] = round(obj[0],0)
            dics['name'] = str(round(obj[0],0))
            dics['checked'] = False
            dics['show'] = True
            result.append(dics)
            results['prebatterywage'] = (np.array(result))

        # 查找组件人工制费
        sql = r'''select capacityuse from cost_person where productsize='{}' '''.format(productsize)
        objs = executeSession.getArrResult(sql, autoClose=True)
        result = []
        for obj in objs:
            dics = {}
            dics['id'] = round(obj[0],0)
            dics['name'] = str(round(obj[0],0))
            dics['checked'] = False
            dics['show'] = True
            result.append(dics)
            results['permodulewage'] = (np.array(result))
        # 查找硅成本
        guisql = r'''SELECT DISTINCT  guicost from cost_aim where productsize = '{}' '''.format(productsize)
        guicost = executeSession.getArrResult(guisql,autoClose=True)[0][0]
        result = []
        dics ={}
        dics['id'] = round(guicost,4)
        dics['name'] = str(round(guicost,4))
        dics['checked'] = False
        dics['show'] = True
        result.append(dics)
        results['guicost'] = (np.array(result))

        # 查找外购电池成本
        buybatterypricesql = r'''SELECT DISTINCT  price from cost_purchase where productsize = '{}' '''.format(productsize)
        try:
            buybatteryprice = executeSession.getArrResult(buybatterypricesql, autoClose=True)[0][0]
        except:
            buybatteryprice = 0
        result = []
        dics = {}
        dics['id'] = round(buybatteryprice, 4)
        dics['name'] = str(round(buybatteryprice, 4))
        dics['checked'] = False
        dics['show'] = True
        result.append(dics)
        results['buybatteryprice'] = (np.array(result))


        # 查找ctm
        sql = r'''select distinct guicost,ctm from cost_aim where productsize='{}' '''.format(productsize)
        objs = executeSession.getArrResult(sql, autoClose=True)[0][1]
        result = []
        dics = {}
        dics['id'] = objs
        dics['name'] = objs
        dics['checked'] = False
        dics['show'] = True
        result.append(dics)
        results['ctm'] = (np.array(result))
    resultsObj['data'] = results
    resultsObj['code'] = '1'
    return Response(resultsObj)



# 将数据导入到pg数据库
def importpostgr():
    os.environ['NLS_LANG'] = 'AMERICAN_AMERICA.AL32UTF8'
    # 连接两个数据库
    orengine = create_engine("oracle://JINGNENG:123456@129.204.88.98/orcl", encoding='utf-8', echo=True)
    pgengine = create_engine('postgresql://postgres:!@#QWE123@106.12.75.246:5432/datax_extension')
    # SQL
    department_sql = '''SELECT * FROM department_attendance '''
    personal_sql = '''SELECT * FROM personal_approval '''
    process_sql = '''SELECT * FROM process_signed '''
    # 查询oracle数据库
    department_df = pd.read_sql(department_sql,orengine)
    personal_df = pd.read_sql(personal_sql,orengine)
    process_df = pd.read_sql(process_sql,orengine)
    # 写入pg数据库
    print('start import postgresql')
    department_df.to_sql('oa_department_attendance',pgengine,index=True,if_exists='replace')
    personal_df.to_sql('oa_personal_approval',pgengine,index=True,if_exists='replace')
    process_df.to_sql('oa_process_signed',pgengine,index=True,if_exists='replace')
    print('import postgresql successfully')
    # 定时写入
    t = Timer(3600,importpostgr)
    t.start()
# try:
#     Timer(1200,importpostgr).start()
# except:
#     print('停止定时导入pg数据库')


@api_view(http_method_names=['GET','POST'])
@permission_classes((permissions.AllowAny,))
def getdinguserinfo(request):
    code = request.GET['code']
    #获取 access_token
    data = urllib.parse.urlencode({'appkey':'dingee7y1sxlfqzbd2ga', 'appsecret':'AtSPhx9JH6HNZb_dkBoi4DOo88KDVYthHscZ-7D5iT5Y5bWV5b3b4B_HY4yOQo-a'})
    response = urllib.request.urlopen('https://oapi.dingtalk.com/gettoken?%s' % data)
    html = response.read()
    returnMsg = json.loads(html.decode('utf-8'))
    access_token = returnMsg["access_token"]
    # 通过临时授权码获取登陆人信息
    response = urllib.request.urlopen('https://oapi.dingtalk.com/user/getuserinfo?access_token='+ access_token+'&code='+code)
    html = response.read()
    returnMsg = json.loads(html.decode('utf-8'))
    userid = returnMsg['userid']
    # 通过access_token和用户id获取详细信息
    #response = urllib.request.urlopen('https://oapi.dingtalk.com/user/get?access_token='+ access_token+'&userid='+userid)
    response = urllib.request.urlopen('https://oapi.dingtalk.com/user/get?access_token='+ access_token+'&userid=093111674520342683')

    
    html = response.read()
    returnMsg = json.loads(html.decode('utf-8'))
    username=returnMsg['name']
    departmentid = returnMsg['department'][0]
    # 获取部门名称
    response = urllib.request.urlopen('https://oapi.dingtalk.com/department/list?access_token='+access_token)
    html = response.read()
    returnMsg = json.loads(html.decode('utf-8'))
    returnMsg = returnMsg['department']
    # 得到当前登陆人的部门名称和上级部门id
    departmentname = ''
    parentDepartmentname = ''
    for dep in returnMsg:
        if str(departmentid) == str(dep['id']):
           departmentname = dep['name']
           parentid = dep['parentid']

    # 得到上级部门名称
    for dep in returnMsg:
        if str(parentid) == str(dep['id']):
           parentDepartmentname = dep['name']
    departmentname = departmentname
    parentDepartmentname = parentDepartmentname
    # 设置场景筛选框默认值
    objs = scenes.objects.get(id='9b3acfdac33811e9a21c005056bac0e6')
    items = json.loads(objs.items)
    for item in items:
        # 更改一级部门
        if item['data']['id'] == '513758E26B892A84ACFA61015749ED82':
            if parentDepartmentname == '集团':
                item['data']['defaultValText']=departmentname
            else:
                item['data']['defaultValText']=parentDepartmentname
            objs.items =  json.dumps(items,cls=DecimalEncoder)
            objs.save() 
        # 更改二级部门
        if item['data']['id'] == '826D7F55E5498B2DCCBC7BA540E97621':
            if parentDepartmentname == '集团':
                executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
                sql = r'''select distinct departmentname from oa_department_attendance where superdep='{}' '''.format(departmentname)
                item['data']['defaultValText'] = executeSession.getArrResult(sql)[0][0]
                executeSession.closeConnect
            else:
                item['data']['defaultValText']=departmentname
            objs.items =  json.dumps(items,cls=DecimalEncoder)
            objs.save()  
    # 个人审批加载当前登陆人信息
    objs = scenes.objects.get(id='eb0246c2917311e9939ff40f241ab3c9')
    items = json.loads(objs.items)
    for item in items:
        # 更改登陆人信息
        if item['data']['id'] == '389E9D04F90EFA13A9C08B75B83F7794':
            item['data']['defaultValText']=username
            objs.items =  json.dumps(items,cls=DecimalEncoder)
            objs.save()
    # 将当前登陆人部门信息入库缓存表，用来分配下拉框权限
    executeSession = sqlutils.SqlUtils(DBTypeCode.EXTENSION_DB.value)
    insertsql = r'''insert into oa_cache_ding(department,superdepartment,departmentid,parentid) values('{}','{}','{}','{}')'''.format(departmentname,parentDepartmentname,departmentid,parentid)
    executeSession.excuteSqlByBulkParams(insertsql)
    executeSession.closeConnect
    result = []
    dics = {}
    dics['departmentname'] = departmentname
    dics['parentDepartmentname'] = parentDepartmentname
    dics['username'] = username
    result.append(dics)
    return Response(result)



