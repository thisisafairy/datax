import datetime,time
from django.apps import apps
import uuid
import re

from django.forms import model_to_dict


def formattime(date):
    msg = ''
    try:
        h = datetime.datetime.strptime(date,'%H')
        m = datetime.datetime.strptime(date, '%m')
        msg =  datetime.datetime.strptime(date,'%Y-%m-%d')
    except Exception as e:
        msg = e
    print(msg)


def errorMes(mes):
    errObj = {
        "data": {},
        "status": "failure"
    }
    if mes is not None:
        errObj['data'] = mes
    return errObj;


def successMes():
    successObj = {
        "data": {},
        "status": "success"
    }
    return successObj;


def getJsonObjFromModel(appName, modelName, result):
    dist = model_to_dict(result)
    fieldList = getModelFields(appName, modelName)
    dist = {}
    for field in fieldList:
        dist[field] = result.get(field)
    print(dist)


def getModelFields(appName, modelName):
    modelObj = apps.get_model(appName, modelName)
    fieldList = []
    for field in modelObj._meta.fields:
        fieldList.append(field.name)
    return fieldList


class UUIDTools(object):
    """uuid function tools"""

    @staticmethod
    def uuid1_hex():
        """
        return uuid1 hex string

        eg: 23f87b528d0f11e696a7f45c89a84eed
        """
        return str(uuid.uuid1().hex)

#判断一个值是否在list[obj]中
def existValue(listObj,valObj,key,onlyV=None):
    #判断值是否存在list[obj]中
    try:
        if onlyV:
            for tempObj in listObj:
                if tempObj[key] == valObj:
                    return 1
        else:  # 判断对象是否存在list[obj]中
            for tempObj in listObj:
                if tempObj[key] == valObj[key]:
                    return 1
    except Exception as e:
        print('=============')
        print('listObj=',listObj)
        print('valObj=',valObj)
        print('key=',key)
        print('onlyV=',onlyV)
        print(e.args)
    return -1

#判断一个字符串是否是日期格式
def isVaildDate(date):
    rsdate=''
    try:
        if "/" in date:
            date=date.replace("/","-")

        if ":" in date:
            rsdate=time.strptime(date, "%Y-%m-%d %H:%M:%S")
        else:
            rsdate=time.strptime(date, "%Y-%m-%d")
        return time.strftime('%Y-%m-%d',rsdate)
    except:
        try:
            date=date.split(' ')[0]
            dateStrArry=re.findall(r"(\d{1,2}-\d{1,2}-\d{4})",date)
            if dateStrArry:
                dateSplitArry=(dateStrArry[0]).split('-')
                yearstr=dateSplitArry[-1]
                monthstr=dateSplitArry[0]
                monthstr=monthstr if len(monthstr)>1 else ('0'+str(monthstr))
                daystr=dateSplitArry[1]
                daystr=daystr if len(daystr)>1 else ('0'+str(daystr))
                return str(yearstr)+'-'+str(monthstr)+'-'+str(daystr)
        except:
            return rsdate
