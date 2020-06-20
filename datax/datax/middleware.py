from django.shortcuts import render
from common.constantcode import DBTypeCode,LoggerCode
from api.utils import SqlUtils

try:
    from django.utils.deprecation import MiddlewareMixin
except ImportError:
    MiddlewareMixin=object
from dashboard.models import menu

'''
拦截器检测用户是具有该url的权限
'''
class UrlMiddleware(MiddlewareMixin):

    def process_request(self,request):
        reqPath = request.path
        if reqPath == '/account/login' or reqPath == '/account/homepage/login' or request.user.is_superuser:   #如果是登陆或admin就直接放过
            return None
        elif reqPath and (reqPath.startswith('/dashboard') or reqPath.startswith('/account')):#检测用户权限
            uid=str(request.user.id)
            if not uid or uid.lower() == 'none':
                return None
            exeSql='''select dm.url from (select CAST(asm.menu_id as VARCHAR) from account_sys_userextension asu LEFT JOIN account_user_menus asm on asu.id=asm.user_id where asu.id='''+uid+'''
                      union
                      select cast(agm.menu_id as VARCHAR) from account_sys_userextension_groups asug left join account_group_menus agm on asug.group_id=agm.group_id where asug.sys_userextension_id='''+uid+'''
                      )mids LEFT JOIN dashboard_menu dm on mids.menu_id=dm.id where mids.menu_id is not NULL
                    '''
            permissionStatus=True
            try:
                allMenu=menu.objects.all()
                allMenuUrl=list(set([m.url for m in allMenu]))
                # print('allMenuUrl==',allMenuUrl)

                #请求url在allMenuUrl里而不在用户拥有的权限菜单里就转到提示页面，否则通过
                for allMUrl in allMenuUrl:
                    if allMUrl and allMUrl.find(reqPath)!=-1:
                        # 检测当前请求是否在用户拥有的菜单权限内
                        session = SqlUtils()
                        urllists = session.getArrResult(exeSql)

                        urllists = list(set([x[0] for x in urllists]))
                        for urlstr in urllists:
                            if urlstr and urlstr.find(reqPath) != -1:
                                break;
                        else:  # 如果用户没有这项菜单的请求权限
                            print('requestUrl=',reqPath)
                            print('user permission url=',urllists)
                            permissionStatus = False
                        break;
            except Exception as err:
                print('==error==file:middleware.py,method:process_request,line:47...',err.args)
                permissionStatus = False

            if not permissionStatus:
                full_path = ('http', ('', 's')[request.is_secure()], '://', request.META['HTTP_HOST'], '/account/login')
                return render(request, '404.html',{'link':''.join(full_path)})
        elif reqPath=='/':
            return None
        else:
            return None
    # def process_response(self,request,response):
    #     print('process_response...')
    #     return response