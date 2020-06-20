#!/usr/bin/env python

# -*- coding: utf8 -*-
from celery import task
import sys,os,datetime,shutil
from datax import settings

@task
def backupDatabase():
    """备份数据库所有数据，备份当天和昨天的数据，修改时间请在deltatime里调整天数"""

    ip=settings.DATABASES['default']['HOST']
    db_name=settings.DATABASES['default']['NAME']
    db_port = settings.DATABASES['default']['PORT']
    db_user=settings.DATABASES['default']['USER']
    passwd=settings.DATABASES['default']['PASSWORD']
    # print(ip,db_name,db_port,db_user,passwd)
    # ip = '127.0.0.1'
    # db_name = 'datax'
    # db_port='5432'
    # db_user = 'postgres'
    # passwd = '86chuan'

    backup_path='/venv/backupDB/'   #备份在项目下的venv/backupDB文件夹下,必须以/结尾
    cmd_path='E:/pgdatabase/installer/bin/'     #pg数据库

    basepath=os.path.dirname(os.path.dirname(__file__))
    file_path=basepath+backup_path
    # print('file_path=',file_path)
    yesterday=datetime.datetime.now() + datetime.timedelta(days=-1)#备份的日期应该是当前时间的昨天，在凌晨1点备份应当是备份的昨天的数据
    today=file_path+yesterday.strftime('%Y-%m-%d')
    fname= today + os.sep + yesterday.strftime('%Y-%m-%d') + '_' + db_name + '.backup'
    # print('fname=',fname)
    # print('today=',today)
    if not os.path.exists(today):
        if (os.makedirs(today)) == None:
            print("成功创建备份目录！%s" % today)
        else:
            print("**************创建备份目录失败！**************")
    else:
        print("***目录已经存在！***")

    #拼接执行命令，备份命令
    cmd_dump = "%spg_dump \"host=%s hostaddr=%s port=%s user=%s password=%s dbname=%s\" > %s" % \
               (cmd_path,ip,ip,db_port,db_user,passwd,db_name,fname)

    # print('cmd_dump=',cmd_dump)
    backed=False
    if os.system(cmd_dump)==0:
        backed=True
        print('数据备份为: ' + fname)
    else:
        print('数据备份失败')

    #删除设定日期以前的数据
    allbackup = os.listdir(file_path)
    sortedFileList = sorted(allbackup)#排序后根据顺序查找并删除

    if backed:  #如果备份成功就删除以前备份的文件
        lastDate=yesterday+datetime.timedelta(days = -2)    #根据日期计算需要删除的文件
        lastDay = lastDate.strftime('%Y-%m-%d')
        # print('lastDay=',lastDay)
        delFname = sortedFileList[sortedFileList.index(lastDay):]  # 找到需要删除的所有文件，包括lastday文件
        for delf in delFname:
            if os.path.exists(file_path+delf):
                shutil.rmtree(file_path+delf)
                print('****成功删除旧文件备份：%s'%file_path+delf)
            else:
                print('****文件夹不存在！不能删除*****')

    sys.exit()

# if __name__ == '__main__':
#     backupDatabase()