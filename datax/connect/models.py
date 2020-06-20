from django.db import models
import django.utils.timezone as timezone
from common.tools import UUIDTools
import datetime
current_time = timezone.now

# Create your models here.
class Database(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    ip = models.TextField(null=True)
    odbcdriver = models.TextField(max_length=200,null=True,verbose_name='odbc驱动')
    user_name = models.TextField(null=True, verbose_name='用户名', help_text='用户名')
    password = models.TextField(max_length=30, verbose_name='密码')
    database = models.TextField(null=True, verbose_name='数据库')
    contitle = models.TextField(max_length=300,null=True, verbose_name='连接名称')
    odbcstatus = models.TextField(max_length=100, null=True, verbose_name='odbc连接')
    dsnstatus = models.TextField(max_length=100, null=True, verbose_name='是否dsn连接(t/f)')
    create_user = models.TextField(null=True, verbose_name='创建用户')
    database_type = models.TextField(null=True, verbose_name='数据库类型')
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据
    fromolapadd = models.CharField(null=True,max_length=10) #用于区别是数据源接入还是olap数据新增时的接入

class source(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    databaseid = models.CharField(null=True,max_length=32)
    config = models.TextField(null=True, verbose_name='配置详情')
    custom = models.CharField(max_length=5, verbose_name='是否自定义')
    sql = models.TextField(verbose_name='sql语句')
    title = models.TextField(verbose_name='标题')
    receive_user = models.TextField(null=True, verbose_name='收件人')
    cc_user = models.TextField(null=True, verbose_name='抄送人')
    desc = models.TextField(null=True, verbose_name='描述')
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    enabled = models.TextField(null=True, verbose_name='是否启用')
    options = models.TextField(null=True)  # 用于可能的扩展数据
    datatype=models.CharField(null=True,max_length=32)
    conntype=models.CharField(null=True,max_length=50)#实时还是数据提取

class sourcedetail(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    sourceid = models.CharField(null=True,max_length=32)
    column = models.CharField(max_length=50)
    table = models.CharField(max_length=50, null=True)
    title = models.CharField(max_length=100, null=True)
    type = models.CharField(max_length=50, null=True)
    iscustom = models.CharField(max_length=10, default='0')
    formatcolumn = models.TextField(null=True,default='')
    ifshow = models.CharField(max_length=10, null=True, default='1')
    distconfig = models.TextField(null=True)
    column_formula = models.CharField(max_length=100, null=True, verbose_name='列计算公式')
    options = models.TextField(null=True)  # 用于可能的扩展数据

class globaldist(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    databaseid = models.CharField(max_length=32,null=True)
    sourceid = models.CharField(max_length=32,null=True)
    tablename = models.CharField(max_length=50)
    columnname = models.CharField(max_length=50)
    dist = models.TextField()
    disttype = models.CharField(max_length=20)
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    column_formula = models.CharField(max_length=100, null=True, verbose_name='列计算公式')
    formatcolumn = models.TextField(null=True, default='')

class customcolumn(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    databaseid = models.CharField(max_length=32,null=True)
    table = models.CharField(max_length=50, verbose_name='表名')
    column = models.CharField(max_length=50, verbose_name='列名')
    title = models.CharField(max_length=50, verbose_name='标题')


class Tables(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    database_id = models.CharField(max_length=32,null=True)
    tables = models.TextField(max_length=30, verbose_name='表名')
    name = models.TextField(max_length=30, null=True, verbose_name="显示名称")
    ifshow = models.CharField(max_length=10, default="1")
    options = models.TextField(null=True)  # 用于可能的扩展数据
    createtime = models.DateTimeField(auto_now_add=True,null=True)

class Columns(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    database_id = models.CharField(max_length=32, null=True)
    tables = models.CharField(max_length=50, null=True, verbose_name='归属表')
    columns = models.TextField(max_length=30, verbose_name='列名')
    type = models.CharField(max_length=50, null=True, verbose_name='列类型')
    name = models.TextField(max_length=30, null=True, verbose_name='显示名称')
    column_formula = models.CharField(max_length=100, null=True, verbose_name='列计算公式')
    ifshow = models.CharField(max_length=10, default="1")

class olap(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    sourceid = models.CharField(max_length=32, null=True)
    name = models.CharField(max_length=50)
    charttype=models.CharField(max_length=32, null=True)
    desc = models.TextField()
    columns = models.TextField()
    filters = models.TextField()
    table = models.CharField(max_length=50,null=True)
    status = models.CharField(max_length=50, default='1')
    dispatchid = models.CharField(max_length=32, null=True)
    businesstype = models.CharField(max_length=20, null=True)
    expand = models.TextField()
    ifexpand = models.CharField(max_length=20)
    olaptype = models.CharField(max_length=20,default="olap")
    dispatchconfig = models.TextField(null=True)
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    enabled = models.TextField(null=True, verbose_name='是否启用')
    tag_config = models.TextField(null=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据
    directconn=models.CharField(max_length=20,null=True)#是否直连（直连即直接对接数据仓库，不用新建olap表）
    execute_status = models.CharField(max_length=50,null=True)#olap执行状态，（running，done，error，prepare）

class olapcolumn(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    olapid = models.CharField(max_length=32, null=True)
    column = models.CharField(max_length=50)
    title = models.CharField(max_length=100, null=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据

class dispatch(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    dispatch_fun = (
        ('once', '单次执行'),
        ('loop', '循环执行')
    )
    loop_fun = (
        ('intervals','循环'),
        ('day', '每天'),
        ('week', '每周'),
        ('month', '每月'),
        ('year', '每年')
    )
    name = models.CharField(max_length=50)
    desc = models.TextField(null=True)
    quency = models.CharField(choices=dispatch_fun,max_length=50)
    loopmodel = models.CharField(choices=loop_fun,max_length=50,null=True)
    loopdetai = models.CharField(max_length=100,null=True)
    time = models.TextField(null=True)
    date = models.TextField(null=True)
    shorttime = models.CharField(max_length=50)
    shortdate = models.CharField(max_length=50)
    crontabid = models.IntegerField(null=True)
    crontabType = models.CharField(null=True, default='crontab', max_length=20)
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据

class dispatchlog(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    status_type = (
        ('starting','正在启动'),
        ('running', '正在执行'),
        ('done', '完成')
    )
    olapid = models.CharField(max_length=32, null=True)
    olapname = models.CharField(max_length=255, null=True)
    tablename = models.CharField(max_length=50)
    totalcount = models.IntegerField()
    nowcount = models.IntegerField()
    errorcount = models.IntegerField()
    starttime = models.DateTimeField()
    endtime = models.DateTimeField(null=True)
    status = models.CharField(choices=status_type,max_length=30)
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    options = models.TextField(null=True)
    currstatus = models.TextField(null=True)

class monitor(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    warning_name = models.CharField(max_length=100,default='')
    proposal_content = models.CharField(max_length=500,default='')
    warning_type = models.CharField(max_length=100,default='')
    warning_color = models.CharField(max_length=100,default='')
    addressee = models.CharField(max_length=100,default='')
    waring_calculation_info = models.CharField(max_length=3000,default='')
    contrast_mode = models.CharField(max_length=100,default='')
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    enabled = models.TextField(null=True, verbose_name='是否启用')
# 新业务规则简化 不需要此表
class monitorDetail(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    monitorid = models.CharField(max_length=32, null=True)
    tagname = models.CharField(max_length=50)
    color = models.CharField(max_length=50, null=True)
    issend = models.CharField(max_length=1, null=True)
    condition = models.TextField()
    condition_str = models.TextField(null=True)
    msg_type = models.CharField(max_length=1, null=True)
    advice_content = models.TextField(null=True)
    show_condition_str = models.TextField(null=True)
    use_tables = models.TextField(null=True)


class monitortype(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    title = models.CharField(max_length=100)
    desc = models.TextField()
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)

class maillogs(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    mail_title = models.CharField(max_length=100, verbose_name='邮件标题')
    mail_from = models.CharField(max_length=100, verbose_name='发件人')
    mail_to = models.CharField(max_length=300, verbose_name='收件人')
    mail_acc = models.CharField(max_length=300, verbose_name='抄送人')
    mail_content = models.TextField(verbose_name='邮件内容')
    has_file = models.CharField(max_length=1, verbose_name='是否包含附件')
    send_success = models.CharField(max_length=1, verbose_name='是否发送成功')
    receive_msg = models.TextField(verbose_name='邮件服务器返回的信息')
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    is_read = models.CharField(max_length=1, default='0', verbose_name='是否已读')  # 0表示未读，1表示已读
    img_path = models.CharField(max_length=100, verbose_name='图片路径', default='')
    options = models.TextField(null=True)  # 用于可能的扩展数据
    rule_id = models.CharField(max_length=32, null=True)  # 存储业务规则id
    monitordetail_id = models.CharField(max_length=32, null=True)  #存储警告详情id

class systemmessage(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    username = models.CharField(max_length=300, verbose_name='用户名')
    unread_mess_mun = models.BigIntegerField(verbose_name='未读消息数量')
    user_mail = models.CharField(max_length=300, verbose_name='用户邮箱')  # 用户更换邮箱时也可以查询得到信息
    options = models.TextField(null=True)  # 用于可能的扩展数据

class olapextcols(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    olapid = models.CharField(max_length=32, null=True)
    title = models.CharField(max_length=100, verbose_name='列名', null=True)
    name = models.CharField(max_length=100, verbose_name='列别名', null=True)
    coltype = models.CharField(max_length=100, verbose_name='类型', null=True)
    configs = models.TextField(verbose_name='列配置', null=True)
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据
