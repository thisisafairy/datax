from django.contrib.auth import get_user

from common import tools
import common.globalvariable as glv
from dashboard.models import menu
from dashboard.models import portalmenu
from django.db.models import Q
from api import utils
from rest_framework import filters,permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import re,json

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getMenu(request):
    user = get_user(request)
    pathname = request.query_params['pathname']
    pathname = pathname.replace('%23','#')
    # permission_code = get_permission_codename(request)
    fetchall = menu.objects.filter(Q(parent_key__isnull=True)|Q(parent_key='')).order_by('-parent_key','orderby')
    # json_data = serializers.serialize("json", fetchall)
    result = []
    for row in fetchall:
        dist = makeDist(row, pathname)
        key = row.key
        child = menu.objects.filter(parent_key=key).order_by('orderby')
        childdists = []
        is_active = False
        for childrow in child:
            childdist = makeDist(childrow, pathname)
            if childdist['is_active']:
                is_active = True
            childdists.append(childdist)
        dist['child'] = childdists
        if is_active:
            dist['is_active'] = True
        result.append(dist)
    return Response(result)


@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getMenuTree(request):
    fetchall = menu.objects.filter(Q(parent_key__isnull=True)|Q(parent_key='')).order_by('-parent_key','orderby')
    resultObj = tools.successMes()
    resultObj['data'] = []
    try:
        for row in fetchall:
            dist = makeDist(row)
            dist['$$treeLevel'] = 0
            resultObj['data'].append(dist)
            key = row.key
            child = menu.objects.filter(parent_key=key).order_by('orderby')
            for childrow in child:
                childdist = makeDist(childrow)
                resultObj['data'].append(childdist)
    except Exception as e:
        resultObj = tools.errorMes(e.args)

    print(resultObj)
    return Response(resultObj)

def makeDist(row,pathname=''):
    dist = {}
    dist['id'] = row.id
    dist['name'] = row.name
    dist['key'] = row.key
    dist['url'] = row.url
    dist['parent_key'] = row.url
    dist['permission_name'] = row.permission_name
    dist['icon'] = row.icon
    dist['options'] = row.options
    try:
        if row.url != '/':
            pathname.index(row.url)
            dist['is_active'] = True
        else:
            dist['is_active'] = False
    except:
        dist['is_active'] = False
        pass
    # if pathname == row.url:
    #     dist['is_active'] = True
    # else:
    #     dist['is_active'] = False
    return dist

@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getMenuDetail(request):
    try:
        id = request.GET['id']
        menudetail = menu.objects.get(id=id)
        dist={}
        dist['name'] = menudetail.name
        dist['id'] = menudetail.id
        dist['url'] = menudetail.url
        dist['icon'] = menudetail.icon
        print(dist)
        resultObj = tools.successMes()
        resultObj['data'] = dist
    except Exception as e:
        resultObj = tools.errorMes(e.args)
    return Response(resultObj)

@api_view(http_method_names=['POST'])
def saveMenu(request):
    id = request.data.get('id')
    resultObj = tools.successMes()
    try:
        p = menu.objects.get(id=id)
        p.name = request.data.get("name")
        p.url = request.data.get('url')
        p.icon = request.data.get('icon')
        p.save()
    except Exception as e:
        resultObj = tools.errorMes(e.args)
    return Response(resultObj)
menu_cache = glv.menu_cache
# 缓存用户菜单 入参：data,showtype,userid  返回值：0清除缓存 400入参错误 200已缓存 cleardata=True 清空缓存
def usermenu_cache(cleardata=False,**kwargs):
    if cleardata:
        menu_cache.get('user_back').clear()
        menu_cache.get('user_front').clear()
        menu_cache.get('user_id').clear()
        return 0
    userid = kwargs.get('userid')
    userId_cache = menu_cache.get("user_id")
    # 判断前后台
    showtype = kwargs.get('showtype')
    data = kwargs.get('data')
    if len(kwargs)<1 or not showtype or not data:
        return 400
    # 前台
    if showtype != 'admin':
        usermenu_cache(cleardata=True)
        usermenu_front = menu_cache.get('user_front')
        usermenu_front.extend(data)
        userId_cache.extend([userid])
        return 200
    # 后台
    else:
        usermenu_cache(cleardata=True)
        usermenu_back = menu_cache.get('user_back')
        usermenu_back.extend(data)
        userId_cache.extend([userid])
        return 200

# 前后台的缓存 backorfront前台或者后台  user用户 get_user(request)
def cache_data(backorfront,user):
    userId_cache = menu_cache.get("user_id")
    if userId_cache:  # 该用户是否有缓存
        if userId_cache[-1] == str(user.id):
            menu = menu_cache.get(backorfront)
            return menu
    else:
        # 没有缓存
        menu_cache.get('user_back').clear()
        menu_cache.get('user_front').clear()
        menu_cache.get('user_id').clear()
        return False

#获取有权限的菜单
@api_view(http_method_names=['GET'])
@permission_classes((permissions.AllowAny,))
def getAuthMenu(request):
    user = get_user(request)
    pathname = request.query_params['pathname']
    isPhone = True
    # if re.search(r'.(Android|webOS|iPhone|iPod|iPad|Windows Phone|SymbianOS|BlackBerry).', str(request.META.get('HTTP_USER_AGENT', None))):
    #     isPhone = True
    # if isPhone:
    # 取出所有新版场景ID
    sceneIdTable = utils.getResultBySql('SELECT t.id FROM dashboard_scenes t WHERE t.sceneversion >= 2')
    sceneIds = []
    for tableRow in sceneIdTable:
        sceneIds.append(tableRow[0])
    if 'showtype' in request.query_params:
        showtype = request.query_params['showtype']
    else:
        showtype = 'admin'
    if not user.is_superuser:
        sql='''
            select m.id,m.name,m.key,m.url,m.parent_key,m.permission_name,m.icon,m.options from (
            select m.id,m.name,m.key,m.url,m.parent_key,m.permission_name,m.icon,m.options,m.orderby as orderflag from {1} m INNER JOIN (
                select menu_id from account_user_menus where user_id={0}
                UNION
                select menu_id from account_group_menus where group_id 
                in (select group_id from account_sys_userextension_groups where sys_userextension_id={0})) a 
            on m.id=a.menu_id
            UNION
            select m.id,m.name,m.key,m.url,m.parent_key,m.permission_name,m.icon,m.options,m.orderby as orderflag
             from {1} m INNER JOIN (
                select distinct parent_key from {1} m INNER JOIN (
                select menu_id from account_user_menus where user_id={0}
                UNION
                select menu_id from account_group_menus where group_id 
                in (select group_id from account_sys_userextension_groups where sys_userextension_id={0})) a 
                on m.id=a.menu_id) a
            on m.key=a.parent_key)m order by m.orderflag
            '''
        if showtype != 'admin':
            # 前台读取缓存
            menu_list = cache_data('user_front',user)
            if  menu_list:
                return Response(menu_list)
            # 没有缓存
            try:
                fetchall = utils.getResultBySql(sql.format(user.id, 'dashboard_portalmenu'))
            except Exception as e:
                raise e
        else:
            # 后台读取缓存 user_back
            menu_list = cache_data('user_back', user)
            if  menu_list:
                print(json.dumps(menu_list))
                return Response(menu_list)
            fetchall = utils.getResultBySql(sql.format(user.id, 'dashboard_menu'))
        result = []
        for obj in fetchall:
            if obj[4] is None or obj[4] == '':
                childdists = []
                is_active = False
                dist = makeDistIndex(obj, pathname)
                if showtype != 'admin' and isPhone:
                    isNewVersionScene(dist, sceneIds)
                for objchild in fetchall:
                    if objchild[4]==obj[2]:
                        childdist = makeDistIndex(objchild, pathname)
                        if showtype != 'admin' and isPhone:
                            isNewVersionScene(childdist, sceneIds)
                        if childdist['is_active']:
                            is_active = True
                        childdists.append(childdist)
                dist['child'] = childdists
                if is_active:
                    dist['is_active'] = True
                result.append(dist)
        # 访问一次放入缓存 下次访问不到此处
        usermenu_cache(showtype=showtype,data=result,userid=str(user.id))
        return Response(result)
    else:
        if showtype != 'admin':
            # 前台读取缓存
            menu_list = cache_data('user_front', user)
            if  menu_list:
                return Response(menu_list)
            fetchall = portalmenu.objects.filter(Q(parent_key__isnull=True) | Q(parent_key='')).order_by('orderby')
        else:
            # 后台读取缓存 user_back
            menu_list = cache_data('user_back', user)
            if  menu_list:
                return Response(menu_list)
            fetchall = menu.objects.filter(Q(parent_key__isnull=True) | Q(parent_key='')).order_by('orderby')
        # json_data = serializers.serialize("json", fetchall)
        result = []
        for row in fetchall:
            dist = makeDist(row, pathname)
            if showtype != 'admin' and isPhone:
                isNewVersionScene(dist, sceneIds)
            key = row.key
            if showtype != 'admin':
                child = portalmenu.objects.filter(parent_key=key).order_by('orderby')
            else:
                child = menu.objects.filter(parent_key=key).order_by('orderby')
            childdists = []
            is_active = False
            for childrow in child:
                childdist = makeDist(childrow, pathname)
                if showtype != 'admin' and isPhone:
                    isNewVersionScene(childdist, sceneIds)
                if childdist['is_active']:
                    is_active = True
                childdists.append(childdist)
            dist['child'] = childdists
            if is_active:
                dist['is_active'] = True
            result.append(dist)
        # 访问一次放入缓存 下次访问不到此处
        usermenu_cache(showtype=showtype, data=result,userid=str(user.id))
        return Response(result)


def makeDistIndex(row, pathname=''):
    dist = {}
    dist['id'] = row[0]
    dist['name'] = row[1]
    dist['key'] = row[2]
    dist['url'] = row[3]
    dist['parent_key'] = row[4]
    dist['permission_name'] = row[5]
    dist['icon'] = row[6]
    dist['options'] = row[7]
    if pathname == row[3]:
        dist['is_active'] = True
    else:
        dist['is_active'] = False
    return dist

def isNewVersionScene(obj, sceneIds):
    urlStr = obj['url']
    tempFlag = False
    obj['sceneId'] = -1
    obj['mobileVersion'] = False
    if re.search(r'/bi/index/scene/', urlStr):
        urlPart = re.match(r'/bi/index/scene/', urlStr)
        sceneId = urlStr.replace(str(urlPart.group(0)), '')
        for tempId in sceneIds:
            if str(sceneId) == str(tempId):
                tempFlag = True
                break
        if tempFlag:
            obj['sceneId'] = sceneId
            obj['mobileVersion'] = True