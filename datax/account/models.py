from django.db import models
from django.contrib.auth.models import AbstractUser,Group
from django.http import request
from datax import settings
from common.tools import UUIDTools
# Create your models here.

# def user_directory_path(instance, filename):
#     # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
#     return 'user_{0}/{1}'.format(instance.user.id, filename)

class sys_userextension(AbstractUser):     #继承AbstractUser
    desc = models.TextField()
    picture = models.TextField(null=True)
    mobile = models.TextField(null=True)
    tagfield = models.TextField(null=True)

class user_menus(models.Model):
  menu_id = models.CharField(max_length=32,null=True)
  user_id = models.IntegerField()
  orderby = models.IntegerField(default=0)

class group_menus(models.Model):
    group_id = models.IntegerField()
    menu_id = models.CharField(max_length=32,null=True)
    orderby = models.IntegerField(default=0)

class user_tag(models.Model):
    id = models.CharField(primary_key=True, default=UUIDTools.uuid1_hex, editable=False, max_length=32)
    name = models.CharField(max_length=30)
    remark = models.CharField(max_length=255)
    options = models.TextField(null=True)  # 用于可能的扩展数据


class organization(models.Model):
    id = models.AutoField(primary_key=True, db_column='id')
    org_name = models.CharField(max_length=200, null=True)
    org_abbreviation_name = models.CharField(max_length=100,verbose_name='缩写名', null=True)
    num_of_people = models.IntegerField(null=True, verbose_name='核定人数')
    code = models.CharField(max_length=50, verbose_name='code', null=True)
    parentid = models.IntegerField(null=True,verbose_name='父id')
    full_path_id = models.CharField(max_length=500, verbose_name='全路径', null=True)
    path_level = models.IntegerField(null=True,verbose_name='父id层级')
    org_type=models.CharField(max_length=32, verbose_name='类型', null=True)
    status = models.IntegerField(null=True,verbose_name='是否可用',default=1)
    sort_index=models.IntegerField(null=True,verbose_name='排序',default=0)
    description=models.CharField(max_length=500, verbose_name='描述', null=True)
    modified_sort_index=models.IntegerField(null=True,verbose_name='修改后的排序',default=0)
    email=models.CharField(max_length=200, verbose_name='机构邮箱', null=True)
    address=models.CharField(max_length=500, verbose_name='机构地址', null=True)
    mobile=models.CharField(max_length=50, verbose_name='机构电话', null=True)
    update_by=models.CharField(max_length=50, verbose_name='修改者', null=True)
    create_date = models.DateTimeField(auto_now_add=True, null=True)
    modify_date = models.DateTimeField(auto_now=True, null=True)
    # dashboardmenu=models.ManyToManyField()
    # portmenu=models.ManyToManyField()

class org_user_group(models.Model):
    id = models.AutoField(primary_key=True, db_column='id', auto_created=True)
    orgid=models.IntegerField(null=True)
    userid=models.IntegerField(null=True)
    groupid=models.IntegerField(null=True)

class org_menu(models.Model):
    id = models.AutoField(primary_key=True, db_column='id', auto_created=True)
    orgid=models.IntegerField(null=True)
    menuid=models.CharField(max_length=32,null=True)

# class default_password(models.Model):
#     id = models.AutoField(primary_key=True, db_column='id', auto_created=True)
#     defaultpassword = models.CharField(max_length=24,null=True)
#     create_date = models.DateTimeField(auto_now_add=True, null=True)
#     modify_date = models.DateTimeField(auto_now=True, null=True)
