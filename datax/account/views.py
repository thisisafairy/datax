from django.shortcuts import render
from django.contrib.auth import logout,login,authenticate,get_user
from django.http import request,response,HttpResponseRedirect, HttpResponse
import base64, json, datetime,decimal,time

from rest_framework.decorators import api_view

from account.form import userForm
from .models import sys_userextension
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.decorators import login_required
from common import globalvariable, tools
from dashboard.models import loginpageconf
from common.head import defaultPassword as defaultPwd

# Create your views here.
def dologin(request):
    currentuser = get_user(request)
    if currentuser.pk is not None:
        HttpResponseRedirect('/dashboard/index')

    nextUrl = '/dashboard/index'
    if request.GET:
        nextUrl = request.GET['next']

    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        nexturl = request.POST['nexturl']
        user = None
        if username and password and password.strip():#为更加严谨这里必须对密码进行判空处理，在新增用户和编辑用户处讨论说的可以密码为空，
            user = authenticate(username=username, password=password)
        if user is not None and user.is_active:
            login(request, user)
            for loginUser in globalvariable.LOGINUSERS:
                if username == loginUser['loginName']:
                    globalvariable.LOGINUSERS.remove(loginUser)
            if not nexturl or nexturl is None:
                nexturl = '/dashboard/index'
            return HttpResponseRedirect(nexturl)
        else:
            objs = loginpageconf.objects.filter(is_use=1)
            if objs:
                for obj in objs:
                    if obj.use_type == 3 or obj.use_type == 1:
                        return render(request, obj.homepage, {'errorcode': '404', 'next': nextUrl})
            else:
                return render(request, "loginpackage/login1/login.html", {'errorcode': '404','next':nextUrl})
    nextUrl = '/dashboard/index'
    if request.GET:
        nextUrl = request.GET['next']
    objs = loginpageconf.objects.filter(is_use=1)
    if objs:
        for obj in objs:
            if obj.use_type == 3 or obj.use_type == 1:
                return render(request, obj.homepage, {'next': nextUrl})
    else:
        return render(request, "loginpackage/login1/login.html", {'errorcode': '404','next': nextUrl})

def login_out(request):
    logout(request)
    return HttpResponseRedirect("/account/login")

@api_view(http_method_names=['POST'])
def singup(request):
    resultObj = tools.successMes()
    resultObj["code"] =1
    ## 限制用户数量
    try:
        # if sys_userextension.objects.all().count() > globalvariable.LIMITS:
        if sys_userextension.objects.all().count() < globalvariable.LIMITS:
            resultObj['code'] = 0
            resultObj['msg'] = '注册用户数量已达上限，请联系管理员！'
            return HttpResponse(json.dumps(resultObj))
    except Exception as e:
        resultObj = tools.errorMes(e)
        return HttpResponse(json.dumps(resultObj))


    if request.method == 'POST':
        # add.html中的表单
        username = request.data.get('username')
        nickname = username
        if request.data.get("nickname"):
            nickname = request.data.get("nickname")
        password = request.data.get("password")
        email = request.data.get("email")
        mobile = request.data.get("mobile")
        # 如果存在id就是编辑 不存在就是新增
        if request.data.get('id'):
            p = sys_userextension.objects.get(id=request.data.get("id"))
        else:
            p = sys_userextension()
            p.is_active = True
        # 默认密码或用户密码
        pwd = getPasswordByStatus(request.data.get('id'),password)
        # 如果有ID并且修改了 更新密码
        if request.data.get("id") and pwd:
            p.password = make_password(pwd)
        if not request.data.get("id"):
            p.password = make_password(pwd)
        # 新增用户
        if not request.data.get("id"):
            p.is_superuser = False
            p.last_name = ''
            p.is_staff = False
            p.is_active = True
            p.date_joined = datetime.datetime.now()
            p.desc = ''
        p.username = username
        p.first_name = nickname
        p.email = email
        p.mobile = mobile
        try:
            # 保存
            p.save()
            resultObj['msg'] = '成功'
        except Exception as e:
            print(e)
            resultObj = tools.errorMes(e)
            resultObj['code'] = 0
            resultObj['msg'] = e.args
    else:
        resultObj = tools.errorMes('访问页面错误')
        resultObj['code'] = 0
        resultObj['msg'] = '访问页面错误'
    return HttpResponse(json.dumps(resultObj))

#用户新增如果没有输入密码则给默认密码，如果输入了密码则使用输入密码
#用户编辑的时候如果没有输入密码则不修改密码,返回None
def getPasswordByStatus(userid,password):
    print('-----执行singup方法，当前正在调用getPasswordByStatus---')
    if userid:#修改（包括admin用户的修改），如果有密码就使用，如果没有密码就不修改密码
        if not password or not password.strip():
            return None
        return password
    else:
        if not password or not password.strip():#如果是新增又没有输入密码则使用默认密码,如果有输入密码则使用
            # defaultPassword = default_password.objects.filter()#本来想做从数据库取默认密码，但新增时页面必须输入密码也就不用了
            # if defaultPassword:
            #     return defaultPassword[0].defaultpassword
            # else:
            #     return defaultPwd
            return defaultPwd
        return password


@login_required
def grouplist(request):
    return render(request, "system/group/index.html",{"nowversion":str(int(time.time()))})

@login_required
def test(request):
    return render(request, 'polestar/index.html') ;#"system/test/index.html")


def homePageLogout(request):
    logout(request)
    return HttpResponseRedirect("/account/homepage/login")

# Create your views here.
def homePageLogin(request):
    currentuser = get_user(request)
    if currentuser.pk is not None:
        return HttpResponseRedirect('/bi/homepage')

    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        nexturl = request.POST['nexturl']
        user = authenticate(username=username, password=password)
        if user is not None and user.is_active:
            login(request, user)
            for loginUser in globalvariable.LOGINUSERS:
                if username == loginUser['loginName']:
                    globalvariable.LOGINUSERS.remove(loginUser)
            return HttpResponseRedirect(nexturl)
        else:
            objs = loginpageconf.objects.filter(is_use=1)

            if objs:
                for obj in objs:
                    if obj.use_type == 3 or obj.use_type == 2:
                        return render(request, obj.homepage, {'errorcode': '404'})
                return render(request, "account/homepagelogin.html", {'errorcode': '404'})
            else:
                return render(request, "account/homepagelogin.html", {'errorcode': '404'})

    nextUrl = '/bi/homepage'
    if request.GET:
        nextUrl = request.GET['next']
    objs = loginpageconf.objects.filter(is_use=1)

    if objs:
        for obj in objs:
            if obj.use_type == 3 or obj.use_type == 2:
                return render(request, obj.homepage, {'next': nextUrl})
        return render(request, "account/homepagelogin.html", {'next': nextUrl})
    else:
        return render(request, "account/homepagelogin.html", {'next': nextUrl})


