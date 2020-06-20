import pandas as pd
import numpy as np
from api import utils
from connect.models import source
from connect.sqltool import stRestoreBySourceId

# 根据维度统计指标
# dims: 维度数组 ex: ['yeat', 'month', 'dept', 'type']
# kpis: 指标数组 ex: ['contract_amount', 'working_hours']
# groups: 分组统计 ex: ['type']
# conditions: 查询条件 ex: [{conditions: [{name:'dept', operate: 'like', value: '\'%设计一所%\'', connect: 'and'},
#                                      {name: 'month', operate: 'in', value: '(1,4,8,10)', connect: 'or'}]}]
# olapObj: 当前olap对象
def statsKPIByDIM(dims, kpis, groups, conditions, olapObj, rankNum=None,ascendSta=False):
    results = []
    for kpi in kpis:
        if not olapObj.directconn:
            sql = generateSql(dims, kpi, conditions, olapObj)
        else:
            sql=generateSql(dims, kpi, conditions, olapObj)
        print('function statsKPIByDIM exeSQL=',sql)
        cols = [kpi]
        for dim in dims:
            if dim not in cols:
                cols.append(dim)
        if olapObj.directconn:
            st = stRestoreBySourceId(olapObj.sourceid)
            queryResult = st.execute(sql).fetchall()
        else:
            queryResult = utils.getResultBySql(sql,utils.DATAXEXTENSION_DB_CHAR)
        dataList = utils.queryResultToDicts(queryResult, cols)
        # print('----cols=',cols)
        # print('----dataList=',dataList)

        df = pd.DataFrame(dataList, columns=cols).fillna(0)
        if groups is None or len(groups) == 0:
            obj = {'name': kpi}
            # 总和
            obj['sum'] = df[kpi].sum()
            # 平均数
            obj['mean'] = df[kpi].mean()
            if rankNum:
                # 最小的10行
                obj['min'] = (dfMin(df, rankNum, kpi)).to_dict(orient='records')
                # 最大的10行
                obj['top'] = (dfTop(df, rankNum, kpi)).to_dict(orient='records')
            else:
                obj['top'] = (dfAll(df, ascendSta, kpi)).to_dict(orient='records')
            results.append(obj)
        else:
            grouped = df.groupby(groups)
            groupCols = []
            for groupedCol, group in grouped:
                obj = {'value': groupedCol}
                # 总和
                obj['sum'] = group[kpi].sum()
                # 平均数
                obj['mean'] = group[kpi].mean()
                if rankNum:
                    # 最小的10行
                    obj['min'] = (dfMin(group, rankNum, kpi)).to_dict(orient='records')
                    # 最大的10行
                    obj['top'] = (dfTop(group, rankNum, kpi)).to_dict(orient='records')
                else:
                    obj['top'] = (dfAll(df, ascendSta, kpi)).to_dict(orient='records')
                groupCols.append(obj)
            results.append({'groups': groupCols,'groupCol':groups})
    return results


def dfMin(df, rankNum, by):
    return ((df.sort_values(by=by)).reset_index(drop=True)).head(rankNum)


def dfTop(df, rankNum, by):
    return ((df.sort_values(by=by, ascending=False)).reset_index(drop=True)).head(rankNum)

def dfAll(df,ascendSta,by):
    return ((df.sort_values(by=by, ascending=ascendSta)).reset_index(drop=True))

# 拼查询的sql
def generateSql(dims, kpi, conditions, olapObj):
    childSqlTableName=''    #如果是直连或数据提取，拼接sql的时候有微小差别
    if olapObj.directconn:
        childSqlTableName='hero.'

    # 需要查出来的值
    sql = 'SELECT SUM( CAST('+childSqlTableName+'"'+kpi + '" AS NUMERIC)) AS "' + kpi + '", '
    for dim in dims:
        sql = sql + childSqlTableName+'"'+ dim + '", '
    if olapObj.directconn:
        sourceObj=source.objects.get(id=olapObj.sourceid)
        sqlFromSourceTable=sourceObj.sql
        sql = sql[:-2] + ' FROM (' + sqlFromSourceTable+')'+childSqlTableName[:-1]+ ' where 1=1 '
    else:
        sql = sql[:-2] + ' FROM ' + olapObj.table + ' WHERE ("version" = (SELECT MAX("version") FROM ' + olapObj.table + ')' \
                                         ' OR extra_processing = \'y\') '
    # 查询条件
    if conditions is not None and len(conditions) > 0:
        sql = sql + ' AND '
        for condition in conditions:
            sql = sql + '('
            whereSql=''
            for criteria in condition['conditions']:
                if str(criteria['value']) and criteria['operate']=='s=':#这里需要区别s=、e=和普通sql操作符，对应于dashview.py中queryConditions的赋值
                    whereSql = whereSql + childSqlTableName + '"' + criteria['name'] + '" like %% ' + \
                          str(criteria['value']) + '  ' + criteria['connect'] + ' '
                elif str(criteria['value']) and criteria['operate']=='e=':
                    whereSql = whereSql + childSqlTableName + '"' + criteria['name'] + '" like ' + \
                          str(criteria['value']) + '%%  ' + criteria['connect'] + ' '
                elif str(criteria['value']):
                    whereSql = whereSql + childSqlTableName+'"' + criteria['name'] + '" ' + criteria['operate'] + ' ' + \
                                str(criteria['value']) + '  ' + criteria['connect'] + ' '
            if not whereSql:
                sql = sql + ' 1=1 ) AND '
            else:
                sql = sql+whereSql[:-4] + ') AND '#这里的-4是因为whereSql最后多了一个空格和criteria['connect']='and'的原因
        sql = sql[:-4]
    # 分组条件
    if dims is not None and len(dims) > 0:
        sql = sql + ' GROUP BY '
    for dim in dims:
        sql = sql + childSqlTableName+'"' + dim + '", '
    sql = sql[:-2]
    return sql

#api/dashboardapi/dashview.py line293用于判断当前object是否被usertag过滤掉
def userTagCheckData(dataObj,conditionQuery):
    if not conditionQuery:
        return True
    for condObj in conditionQuery:
        conditionDict=condObj['conditions']
        if not conditionDict:
            return True
        for singleObj in conditionDict:
            dataValue=str(dataObj[singleObj['name']]).lower().strip()#整理值，有多种可能情况
            if dataValue.endswith('.0'):
                dataValue=dataValue[:-2]
            tagValue=str(singleObj['value']).lower().strip()
            if tagValue.endswith('.0'):
                tagValue=tagValue[:-2]

            if singleObj['operate'] in ['=','=='] and dataValue==tagValue:
                return True
            elif singleObj['operate']=='>' and dataValue>dataValue:
                return True
            elif singleObj['operate']=='<' and dataValue<dataValue:
                return True
            elif singleObj['operate']=='>=' and dataValue>=dataValue:
                return True
            elif singleObj['operate']=='<=' and dataValue<=dataValue:
                return True
            elif singleObj['operate']=='!=' and dataValue != tagValue:
                return True
            elif singleObj['operate']=='like' and dataValue.find(tagValue)>=0:
                return True
            elif (singleObj['operate']=='notlike' or singleObj['operate']=='not like') and dataValue.find(tagValue)<0:
                return True
            elif singleObj['operate']=='s=' and dataValue.startswith(tagValue):
                return True
            elif singleObj['operate']=='e=' and dataValue.endswith(tagValue):
                return True
    return False