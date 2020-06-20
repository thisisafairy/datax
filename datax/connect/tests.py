
from connect.models import *
from sqlalchemy import Column, String, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base


class SqlUtils:
    def connect(self):
        engine = create_engine(self.dbUrl, echo=False)
        DBSession = sessionmaker(bind=engine)
        self.session = DBSession()

    def getArrResult(self, sql, autoClose=False):
        queryList = self.session.execute(sql)
        res = queryList.fetchall()
        if autoClose:
            self.closeConnect()
        return res

    def getDictResult(self, sql):
        list = self.session.execute(sql)
        cols = list.cursor.description
        res = list.fetchall()
        resArr = []
        for row in res:
            resRow = []
            for i, col in enumerate(cols):
                resRow.append({
                    col.name: row[i]
                })
            resArr.append(resRow)
        return resArr

    def closeConnect(self):
        self.session.commit()
        self.session.close()

    def __init__(self, dbType='default', dbId='0'):
        print('初始化')
        print('dbType', dbType)
        if dbType == 'default':
            self.dbUrl = 'postgresql://sola:a@123456B@pgm-bp1kyk50ab84p141eo.pg.rds.aliyuncs.com:3432/sola_test'
        elif dbType == 'extension':
            self.dbUrl = 'postgresql://sola:a@123456B@pgm-bp1kyk50ab84p141eo.pg.rds.aliyuncs.com:3432/sola_test'
        elif dbType == 'custom':
            database = Database.objects.get(id=dbId)
            data = {}
            data['ip'] = database.ip
            data['db'] = database.database
            data['user'] = database.user_name
            data['pwd'] = database.password
            data['kind'] = database.database_type
            data['id'] = id
            self.dbUrl = 'postgresql://sola:a@123456B@pgm-bp1kyk50ab84p141eo.pg.rds.aliyuncs.com:3432/sola_test'
        else:
            raise Exception('缺少类型,dbType=%s' % dbType)
        self.connect()


sql = 'select * FRom test_table'
s = SqlUtils('custom', 1)
list1 = s.getDictResult(sql)
list2 = s.getDictResult(sql)
list3 = s.getDictResult(sql)
list4 = s.getDictResult(sql)
list5 = SqlUtils('custom', 1).getDictResult(sql, 'asd')
print(list)
s.closeConnect()