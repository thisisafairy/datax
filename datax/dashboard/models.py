from django.db import models
from common.tools import UUIDTools
import datetime
# Create your models here.
class menu(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  name = models.TextField()
  key = models.TextField()
  parent_key = models.TextField(null=True)
  url = models.TextField()
  permission_name = models.TextField()
  icon = models.TextField(null=True)
  orderby = models.IntegerField(default=0)
  options = models.TextField(null=True)#用于可能的扩展数据

class portalmenu(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  name = models.TextField()
  key = models.TextField()
  parent_key = models.TextField(null=True)
  url = models.TextField()
  permission_name = models.TextField()
  icon = models.TextField(null=True)
  orderby = models.IntegerField(default=0)
  allowusers = models.TextField(null=True)
  options = models.TextField(null=True)  # 用于可能的扩展数据

class datatable(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  name = models.CharField(max_length=100)
  kind = models.CharField(max_length=32)
  olapid = models.CharField(max_length=32,null=True)
  jsonconfig = models.TextField(null=True)
  remark = models.TextField(null=True)
  refreshspeed = models.IntegerField(default=0)
  keywords = models.TextField(null=True)
  allowusers = models.TextField(null=True)
  imgpath = models.TextField(null=True)
  createname = models.CharField(max_length=100)
  createtime = models.DateTimeField(auto_now_add=True)
  options = models.TextField(null=True)  # 用于可能的扩展数据
  modify_time = models.DateTimeField(auto_now=True)
  version = models.DecimalField(max_digits=3, decimal_places=2, default=0)

class charts(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  name = models.CharField(max_length=100)
  kind = models.CharField(max_length=32)
  jsonconfig = models.TextField(null=True)
  remark = models.TextField(null=True)
  createname = models.CharField(max_length=100)
  createtime = models.DateTimeField(auto_now_add=True)
  orderby = models.IntegerField(default=0)
  filterstring = models.TextField(null=True)
  datasetstring = models.TextField(null=True)
  charttype = models.CharField(max_length=20,default='vega')
  echartconfig = models.TextField(null=True)
  refreshspeed = models.IntegerField(default=0)
  keywords = models.TextField(null=True)
  allowusers = models.TextField(null=True)
  imgpath = models.TextField(null=True)
  options = models.TextField(null=True)  # 用于可能的扩展数据

  def toJSON(self):
    import json
    return json.dumps(dict([(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields]]))



class scenes(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  name = models.CharField(max_length=100)
  kind = models.CharField(max_length=32)
  htmlrawstring = models.TextField(null=True)
  htmlcleanconfig = models.TextField(null=True)
  remark = models.TextField(null=True)
  createname = models.CharField(max_length=100)
  createtime = models.DateTimeField(auto_now_add=True)
  orderby = models.IntegerField(default=0)
  refreshspeed = models.IntegerField(default=0)
  keywords = models.TextField(null=True)
  allowusers = models.TextField(null=True)
  basicconfig = models.TextField(null=True)
  options = models.TextField(null=True)  # 用于可能的扩展数据
  items = models.TextField(null=True)
  sceneversion = models.FloatField(default=0)
  modifytime = models.DateTimeField(auto_now=True)

class themes(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  name = models.CharField(max_length=100)
  code = models.CharField(max_length=100)
  kind = models.CharField(max_length=32)
  scenesconfig = models.TextField(null=True)
  themeconfig = models.TextField(null=True)
  remark = models.TextField(null=True)
  createname = models.CharField(max_length=100)
  createtime = models.DateTimeField(auto_now_add=True)
  orderby = models.IntegerField(default=0)
  refreshspeed = models.IntegerField(default=0)
  continues = models.CharField(max_length=10)
  keywords = models.TextField(null=True)
  allowusers = models.TextField(null=True)
  options = models.TextField(null=True)  # 用于可能的扩展数据

class charttype(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  type_name = models.CharField(max_length=50)
  level = models.IntegerField()
  parent_id = models.CharField(max_length=32,null=True)
  orderby = models.IntegerField()
  status = models.CharField(max_length=10,default='1')
  create_time = models.DateTimeField(auto_now_add=True,null=True)
  motify_time = models.DateTimeField(auto_now=True, null=True)
  create_user = models.IntegerField()
  options = models.TextField(null=True)  # 用于可能的扩展数据

class rulelogs(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  olap_id = models.CharField(max_length=32,null=True)
  monitor_id = models.CharField(max_length=32,null=True)
  monitordetail_id = models.CharField(max_length=32,null=True)
  describe = models.TextField(default='')
  create_time = models.DateTimeField(auto_now_add=True, null=True)
  motify_time = models.DateTimeField(auto_now=True, null=True)
  indicate_cnt = models.IntegerField(default=0)
  indicate_content = models.TextField(null=True)  # 触发内容

class permission_detail(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  typelists = (
        ('portal', '门户'),
        ('chart', '图表'),
        ('table', '表格'),
        ('scene', '场景'),
        ('theme', '主题')
    )
  user_id = models.CharField(max_length=32,null=True)
  target_id = models.TextField()
  permission_type= models.CharField(choices=typelists,max_length=10)
  options = models.TextField(null=True)  # 用于可能的扩展数据


class moduleconfigs(models.Model):
  id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
  module_configs = models.TextField(default='')
  index_title = models.TextField(default='')
  create_time = models.DateTimeField(auto_now_add=True, null=True)
  motify_time = models.DateTimeField(auto_now=True, null=True)
  options = models.TextField(null=True)  # 用于可能的扩展数据

class chartsbgconfig(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    confname = models.CharField(max_length=100)
    filename = models.CharField(max_length=100,null=True)
    fileurl = models.CharField(max_length=200,null=True)
    filecontent = models.TextField(null=True)
    customconfig = models.TextField(null=True)#保存配置里用户自定义函数
    configcontent = models.TextField(null=True)#保存配置的其他数据
    remark = models.CharField(max_length=255)
    status=models.IntegerField(default=0)
    creater = models.CharField(max_length=100)
    createtime = models.DateTimeField(auto_now_add=True)
    modifytime = models.DateTimeField(auto_now_add=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据

class impconfpackage(models.Model):#配置包导入，主题、场景、组件、olap及column、表和数据
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    filename=models.CharField(max_length=300)
    fileurl=models.CharField(max_length=500)
    creater=models.CharField(max_length=200)
    createdate=models.DateTimeField(auto_now_add=True)
    impIdsAndTbName=models.TextField(null=True)

class licenseconf(models.Model): # license文件替换记录
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    username = models.CharField(max_length=50)
    createdate = models.DateTimeField(auto_now_add=True)
    filename = models.CharField(max_length=100)
    filecontent = models.TextField(null=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据

# 外部访问标记
class externalaccessflag(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    token = models.CharField(max_length=100)

# 邮件配置信息
class emailconf(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    mailaddress = models.CharField(max_length=50)
    mailpassword = models.CharField(max_length=50)
    smptaddress = models.CharField(max_length=50)
    smptport = models.CharField(max_length=10)
    status = models.IntegerField(default=1)  # 表示是否启用，0未启用 1已启用。
    createdate = models.DateTimeField(auto_now_add=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据

# 短信配置信息
class smsconf(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    appid = models.CharField(max_length=50)
    appkey = models.CharField(max_length=50)
    templateid = models.CharField(max_length=50)
    template = models.CharField(max_length=300)
    status = models.IntegerField(default=0)  # 表示是否启用，0未启用 1已启用。
    createdate = models.DateTimeField(auto_now_add=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据

# 微信配置信息
class wechatconf(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    userid = models.CharField(max_length=300)
    createdate = models.DateTimeField(auto_now_add=True)
    status = models.IntegerField(default=0)  # 表示是否启用，0未启用 1已启用。
    options = models.TextField(null=True)  # 用于可能的扩展数据

# 消息模板配置表
class msgalltemplateconf(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    templatename = models.CharField(max_length=300, default='')  # 0表示分享类消息 ，1表示提醒类消息 ，2表示报错类消息
    templatetitle = models.CharField(max_length=300, default='')
    templatecontent = models.CharField(max_length=500, default='')
    status = models.IntegerField(default=0)  # 表示是否启用，0未启用 1已启用。
    options = models.TextField(null=True)  # 用于可能的扩展数据

# 系统错误提醒配置信息
class syserrorconf(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    is_use = models.IntegerField(default=0)  # 0表示未使用，1表示已使用
    is_email = models.IntegerField(default=0)
    is_sms = models.IntegerField(default=0)
    is_wechat = models.IntegerField(default=0)
    candidate_email = models.CharField(max_length=300)
    candidate_sms = models.CharField(max_length=300)
    email_template = models.CharField(max_length=300, default='')
    sms_template = models.CharField(max_length=300, default='')
    wechat_template = models.CharField(max_length=300, default='')
    createdate = models.DateTimeField(auto_now_add=True)
    options = models.TextField(null=True)  # 用于可能的扩展数据

# 登录页面配置表
class loginpageconf(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    is_use = models.IntegerField(default=0)  # 0表示未使用，1.表式已使用。
    use_type = models.IntegerField(default=0)  # 1后台登录页 ，2表示前台登录页 ，3表示前后台登录页
    showimage = models.CharField(max_length=300)  # 用来存放展示的登录页图片
    homepage = models.CharField(max_length=300, default='')  # 用来存放主页地址
    options = models.TextField(null=True)  # 用于可能的扩展数据


# 用户收藏
class usercollection(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    user_id = models.CharField(max_length=32,null=True)
    collect_type = models.CharField(max_length=32,null=True)
    collect_id = models.CharField(max_length=32, null=True)
    options = models.TextField(null=True)
    modify_time = models.DateTimeField(auto_now=True)

#用户访问记录
class uservisitlog(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    userid = models.IntegerField(null=True)
    targetid = models.CharField(max_length=32,null=True)#访问目标的id
    targettype = models.CharField(max_length=50,null=True)
    visitcount = models.IntegerField(default=0)  #访问次数
    accesssource = models.TextField(null=True)  #访问来源，iPhone, Android, pc...
    modifytime = models.DateTimeField(auto_now=True)
    options = models.TextField(null=True)

# 数据字典
class data_dictionary(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    dictionary_name = models.CharField(max_length=300, null=True)       # 字典名称
    parent_id = models.CharField(max_length=32,null=True)               # 父id
    order_num = models.CharField(max_length=32,null=True)               # 排序
    del_flag = models.IntegerField(null=True)                           # 是否删除
    code = models.CharField(max_length=32,null=True)                    # 编码值
    description = models.CharField(max_length=300, null=True)           # 描述
    full_path_id = models.CharField(max_length=300, null=True)          # 存放子节点的编码值
    create_time = models.DateTimeField(auto_now=True)                   # 创建时间
    update_time = models.DateTimeField(auto_now=True)                   # 更新时间
    status = models.CharField(max_length=32,null=True)                  # 状态
    options = models.CharField(max_length=1000, null=True)              # 扩展字段