from rest_framework import permissions
from django.contrib.auth import get_user
from account.models import sys_userextension
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from connect.sqltool import PysqlAgent, stRestoreLocal,stRestoreBySourceId
from connect.olap import OlapClass, startOlapById
from connect.models import *
from dashboard.models import *
from connect.olap import  olapFilter
from sqlalchemy import *
from sqlalchemy.orm import sessionmaker
import json
from urllib import parse
from django.forms.models import model_to_dict
from common import tools
from api import utils
from connect import tasks
import pandas as pd
import numpy as np
from dashboard import pd_tools as pt
import pyodbc


@api_view(http_method_names=['POST'])
@permission_classes((permissions.AllowAny,))
def test1Method(request):
    results = tools.successMes()
    dims = ['datax_contract__year', 'datax_contract__month', 'datax_contract__dept_name']
    kpis = ['datax_contract__contract_amount', 'datax_contract__purecontract_amount']
    conditions = [{'conditions': [{'name':'datax_contract__dept_name', 'operate': 'like', 'value': '\'%所%\'', 'connect': 'and'},
                                  {'name': 'datax_contract__month', 'operate': 'in', 'value': '(1,4,8,10)', 'connect': 'or'}]},
                  {'conditions':[{'name': 'datax_contract__year', 'operate': '>', 'value': '2014', 'connect': 'and'}]}]
    table = 'contract_amount_dept_20180601'
    result = pt.statsKPIByDIM(['dept', 'dept_type'], ['amount'], ['dept_type'], [{'conditions': [{'name':'version', 'operate': '=', 'value': '1', 'connect': 'and'}]}], 'test_table', 3)
    print(result)
    # tableStructure = utils.getTableStructure('collect_info_20180611',utils.DATAXEXTENSION_DB_CHAR)
    # columns = []
    # for structure in tableStructure:
    #     columns.append(structure['column_name'])
    # list = utils.getListFromOlapTable('collect_info_20180611')
    # df = pd.DataFrame(list, columns=columns)
    # # df2 = df.groupby(['datax_contract__dept_name','datax_contract__year', 'datax_contract__month'])\
    # #     .agg({'datax_contract__contract_amount': np.sum})
    # # df2 = arr.to_frame()
    # # df2['datax_contract__dept_name','datax_contract__year', 'datax_contract__month'] = df2.index
    # # df2 = df2.reset_index(drop=True)
    # # print(df2.index)
    # # print(df2.reindex().head(5))
    # # dist2 = df2.to_dict(orient='dict')
    # df2 = df[['datax_collect__year', 'datax_collect__month']]
    # grouped = df.groupby('datax_collect__year')
    # arr = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    # count = df.shape[0]
    # for name, group in grouped:
    #     print(name)
    #     missMonths = []
    #     # print(group)
    #     monthArr = []
    #     for mo in group['datax_collect__month']:
    #         monthArr.append(str(mo))
    #     for mo2 in arr:
    #         if mo2 not in monthArr and mo2 is not None:
    #             missMonths.append(int(mo2))
    #     for missMonth in missMonths:
    #         count = count + 1
    #         df.loc[count] = {'datax_collect__year': int(name), 'datax_collect__month': missMonth,
    #                                    'datax_collect__collect_amount': 0,
    #                                    'add_time': None, 'version': None, 'extra_processing': None, 'tb1': None,
    #                                    'hb1': None, 'bl1': None,
    #                                    'total1': None, 'quniandangyueleiji1': None, 'quota1': None,
    #                                    'tongbishuzhi1': None, 'huanbishuzhi1': None}
    #     pass
    #
    # # print(df)
    # sumValue = ((df[['datax_collect__collect_amount']].sum()).values)[0]
    # print(sumValue)
    # left = pd.DataFrame({
    #     'id': [1, 2, 3, 4, 5],
    #     'Name': ['Alex', 'Amy', 'Allen', 'Alice', 'Ayoung'],
    #     'subject_id': ['sub2', 'sub2', 'sub4', 'sub2', 'sub4']})
    # right = pd.DataFrame(
    #     {'id23': [1, 2],
    #      'Name343': ['Billy', 'Brian'],
    #      'subject_id': ['sub2', 'sub4']})
    # rs = pd.merge(left, right, on='subject_id', how='left')
    #
    # for row in rs.to_dict(orient='records'):
    #     print(row)
    #     pass
    #
    # pass


    return Response(results)



@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def testPyODBC(request):
    # shows ODBC data sources with driver info
    sources = pyodbc.dataSources()
    dsns = sources.keys()
    sl = []
    for dsn in dsns:
        sl.append('%s [%s]' % (dsn, sources[dsn]))
    print('\n'.join(sl))

    # cnxn=pyodbc.connect('DRIVER={PostgreSQL Unicode(x64)};SERVER=localhost;DATABASE=datax;UID=postgres;PWD=86chuan')
    # cnxn=pyodbc.connect('DRIVER={MySQL ODBC 5.3 Unicode Driver};SERVER=localhost;DATABASE=analys;UID=root;PWD=86chuan')
    # cnxn=pyodbc.connect('DRIVER={SQL Server};SERVER=10.17.52.11;DATABASE=EOS_PDIET_F;UID=sa;PWD=pdiwt.2010')
    #no #cnxn=pyodbc.connect('DRIVER={Oracle 12c ODBC driver};SERVER=192.168.0.114;DATABASE=projdev;UID=projdev;PWD=projdev')
    cnxn=pyodbc.connect('DRIVER={Teradata};DBCNAME=172.20.70.73;UID=pu_edwadmin;PWD=feiliks2017')
    cursor = cnxn.cursor()
    dt=cursor.execute("select * from PV_PMART.DIM_INVOICE_CATEGORY sample 10")

    print('cols=',dt.fetchone())
    print('cols=',dt.fetchall().description)
    row = cursor.fetchall()
    for o in row:
        print(o)

    return Response()

