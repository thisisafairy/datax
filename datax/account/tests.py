import time

from django.test import TestCase
import re
import psycopg2
import numpy as np
import pandas as pd


def calcExtraCol(dfRow):
    #if dfRow['year'] == row['year'] - 1:
    # row['tongbi'] = ''
    return dfRow

# Create your tests here.
df = pd.read_csv('d:/violations.csv')

# list_start = int(time.time())
# dfList = df.to_dict(orient='records')
# temp1 = []
# for row in dfList:
#     temp1.append(row)
# list_end = int(time.time())
# print('list time:', (list_end - list_start))
#
#
# index_start = int(time.time())
# temp1 = []
# for index in df.index.values:
#     str1 = str(df.loc[index, 'number']) + str(df.loc[index, 'points'])
#     temp1.append(str1)
# index_end = int(time.time())
# print('index time:', (index_end - index_start))
#
#
# apply_start = int(time.time())
# temp1 = []
# df.apply(calcExtraCol, axis=1)
# apply_end = int(time.time())
# print('apply time:', (apply_end - apply_start))


# print(df.loc[0:5])
dfGroup = df.groupby(['number', 'number_new'])
count = 0
procesCount = 0
start_time = int(time.time())
print('iteration start:', start_time)
# df['extra_col'] = None
sqlList = []
for name, group in dfGroup:
    if count % 10000 == 0:
        print('count', count)
        print('procesCount', procesCount)
        print('time', int(time.time()))
    rows = group.to_dict(orient='records')
    for row in rows:
        # group.apply(calcExtraCol, axis=1, args=(row,))
        tongBi = ''
        huanBi = ''
        for index in group.index.values:
            # if df.loc[index, 'number'] == row['year'] - 1:
            tongBi = '145'
            # if df.loc[index, 'number'] == row['year']:
            huanBi = '655'
            pass
        sqlStr = str(row['points']) + ',' + str(row['number'] + ',' + str(tongBi) + ',' + str(huanBi))
        sqlList.append(sqlStr)
    count = count + 1
    procesCount = procesCount + len(group.index.values)
end_time = int(time.time())
print('iteration end:', end_time)
print('use time:', (end_time-start_time))
print('iteration count:', count)
print('update count:', df.shape)

start_join = int(time.time())
print('start join:', start_join)
print('sqlList length:', len(sqlList))

sql = 'INSERT INTO ' + ''.join(sqlList)

end_join = int(time.time())
print('end join:', end_join)
print('sql length:', len(sql))



# arr = ['contract_amount_date_sum.datax_contract__year',
#        'contract_amount_date_sum.datax_contract__month',
#        'contract_amount_date_sum.datax_contract__contract_amount',
#        'contract_amount_date_sum.datax_contract__purecontract_amount',
#        'contract_amount_date_sum.add_time',
#        'contract_amount_date_sum.version',
#        'contract_amount_date_sum.extra_processing',
#        'contract_amount_date_sum.tb1',
#        'contract_amount_date_sum.hb1',
#        'contract_amount_date_sum.bl1',
#        'contract_amount_date_sum.total1',
#        'contract_amount_date_sum.quniandangyueleiji1',
#        'contract_amount_date_sum.quota1',
#        'contract_amount_date_sum.tongbishuzhi1',
#        'contract_amount_date_sum.huanbishuzhi1',
#        'contract_amount_date_sum.tb2',
#        'contract_amount_date_sum.hb2',
#        'contract_amount_date_sum.bl2',
#        'contract_amount_date_sum.total2',
#        'contract_amount_date_sum.quniandangyueleiji2',
#        'contract_amount_date_sum.quota2',
#        'contract_amount_date_sum.tongbishuzhi2',
#        'contract_amount_date_sum.huanbishuzhi2']
# for colName in arr:
#     print(colName.name)

# reg = '(\d{2}|\d{4})((?:\-)|(?:/))([0]{1}\d{1}|[1]{1}[0-2]{0,1})((?:\-)|(?:/))([0-2]{0,1}\d{0,1}|[3]{1}[0-1]{0,1})(?:\s)?([0-1]{1}\d{0,1}|[2]{1}[0-3]{1})?(?::)?([0-5]{1}\d{1}){0,1}(?::)?([0-5]{1}\d{1}){0,1}'
#
# if re.match(reg, '2017-1'):
#     print('q')
#
# arr = ['a','f','q']
# arr.insert(0, 'u')
# print(arr)
#
# x = eval('(1+2)/0')
#
# print(x)
#
# list = [{'name': '张三', 'class': '一班', 'subject': '语文', 'score': 80},
#         {'name': '张三', 'class': '一班', 'subject': '数学', 'score': 90},
#         {'name': '张三', 'class': '一班', 'subject': '英语', 'score': 70},
#         {'name': '张三', 'class': '一班', 'subject': '生物', 'score': 85},
#         {'name': '李四', 'class': '一班', 'subject': '数学', 'score': 85},
#         {'name': '李四', 'class': '一班', 'subject': '语文', 'score': 70},
#         {'name': '李四', 'class': '一班', 'subject': '生物', 'score': 75},
#         {'name': '李四', 'class': '一班', 'subject': '英语', 'score': 90},
#         {'name': '王五', 'class': '二班', 'subject': '英语', 'score': 80},
#         {'name': '王五', 'class': '二班', 'subject': '数学', 'score': 90},
#         {'name': '王五', 'class': '二班', 'subject': '语文', 'score': 95}]
#
#
#
#
# dims = [{'field': 'name', 'title': '姓名'}, {'field': 'class', 'title': '班级'}]
# dimCols = []
# cols = [{'field': 'subject', 'title': '学科'}]
# datas = [{'field': 'score', 'title': '成绩'}]
# df1 = pd.DataFrame(list)
# conversionCols = []
# conversionCols.append(cols[0]['field'])
# conversionCols.append(datas[0]['field'])
#
# # 将要转换成列头的列中的中文替换成英文
# dfColGrouped = df1.groupby(cols[0]['field'])
# groupCount = 1
# columns = []
# for name, group in dfColGrouped:
#     column = {'field': 'column_' + str(groupCount), 'title': name}
#     testObj = df1.loc[df1[cols[0]['field']] == name, cols[0]['field']] = 'column_' + str(groupCount)
#     columns.append(column)
#     groupCount += 1
#
# for dim in dims:
#     column = {'field': dim['field'], 'title': dim['title']}
#     columns.append(column)
#     dimCols.append(dim['field'])
#     groupCount += 1
#
# print(df1)
# df1Group = df1.groupby(dimCols)
#
# count = 1
# df0 = pd.DataFrame()
# for groupedCol, group in df1Group:
#     name = groupedCol
#     df2 = group[conversionCols]
#     df2.set_index(cols[0]['field'], inplace=True)
#     df3 = df2.T.reset_index(drop=True)
#     dimCount = 0
#     for dim in dimCols:
#         df3[dim] = name[dimCount]
#         dimCount = dimCount + 1
#     print(df3)
#     if count == 1:
#         df0 = df3
#     else:
#         df0 = df0.append(df3, ignore_index=True)
#     valuess = df3.values[0]
#     indexs = df3.index
#     columnss = df3.columns.values
#     count = count + 1
#     pass
#
# for col in columns:
#     colType = df0[col['field']].dtype
#     if 'int' or 'float' in colType:
#         col['type'] = 'float'
#     elif 'date' or 'time' in colType:
#         col['type'] = 'date'
#     else:
#         col['type'] = 'varchar'
#     col['ifshow'] = '1'
#     col['isedit'] = '0'
#     col['formula'] = ''
#     col['formatcolumn'] = col['field']
#     col['distconfig'] = []
#     pass
# print('df0:')
# print(df0)
# print(columns)
# conn = psycopg2.connect(dbname='datax', user='postgres', password='postgres', host='60.205.204.26', port='5432')
# try:
#     cur = conn.cursor()
#     cur.execute('''
#     INSERT INTO "public"."test_table" ("dept", "dept_type", "amount", "version", "extra_processing", "cdate") VALUES ('5345所', '生产部门', '100', '1', NULL, '2018/01/09');
#
#     ''')
#     cur.execute('''
#     INSERT INTO "public"."test_table" ("dept", "dept_type", "amount", "version", "extra_processing", "cdate") VALUES ('4235所', '生产部门', '100', '1', NULL, '2018-01-09');
#
#     ''')
#     cur.execute('''
#     INSERT INTO "public"."test_table" ("dept", "dept_type", "amount", "version", "extra_processing", "cdate") VALUES ('123所', '生产部门', '100', '1', NULL, '2018-01-09');
#
#     ''')
#     cur.execute('''
#     INSERT INTO "public"."test_table" ("dept", "dept_type", "amount", "version", "extra_processing", "cdate") VALUES ('11所', '生产部门', 'asfwe', '1', NULL, '2018-01-09');
#
#     ''')
#     # 提交事务
#     conn.commit()
# except Exception as e:
#     raise
# # 关闭连接
# conn.close()