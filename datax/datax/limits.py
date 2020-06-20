from django.shortcuts import HttpResponseRedirect
from django.shortcuts import render, render_to_response
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5 as Cipher_pkcs1_v1_5
import base64
import xml.etree.ElementTree as ET
import time
from datetime import datetime
from common import constantcode, cpuid
from common import globalvariable as gvar
import platform
import os


try:
    from django.utils.deprecation import MiddlewareMixin  # Django 1.10.x  
except ImportError:
    MiddlewareMixin = object  # Django 1.4.x - Django 1.9.x  

# 授权验证
def validateLicense():
    flag = False
    try:
        day = datetime.now().day
        if day != gvar.VALIDATE_DAY or gvar.IS_VALIDATE == False:
            encryptKey = getKeyFromLicenseFile()
            if encryptKey != '':

                pemPath = gvar.PRJ_PATH + '/master-private.pem'
                with open(pemPath) as f:
                    key = f.read()
                    rsakey = RSA.importKey(key)  # 导入读取到的私钥
                    cipher = Cipher_pkcs1_v1_5.new(rsakey)  # 生成对象
                    text = cipher.decrypt(base64.b64decode(str.encode(encryptKey)), "ERROR")  # 将密文解密成明文，返回的是一个bytes类型数据，需要自己转换成str
                if text != 'ERROR':
                    licences = bytes.decode(text).split("_")
                    gvar.VERSION = str(licences[4])
                    gvar.LIMITS = int(licences[3])
                    print('version:' + str(licences[4]))
                    dateArray = datetime.utcfromtimestamp(int(licences[1]))
                    otherStyleTime = dateArray.strftime("%Y-%m-%d")
                    print('limits_day:' + str(otherStyleTime))
                    currTime = int(time.time())
                    if int(licences[1]) > currTime:
                        # 测试版 限定windows,mac使用
                        if str(licences[4]) == 'test':
                            flag = True
                            gvar.VALIDATE_DAY = day
                            osPlatform = str(platform.platform())
                            if 'server' in osPlatform or 'Server' in osPlatform:
                                gvar.IS_VALIDATE = False
                            else:
                                gvar.IS_VALIDATE = True
                        else:
                            #专业版。。。企业版，检测cpuid
                            q=cpuid.CPUID()
                            eax, ebx, ecx, edx = q(1)
                            cpuKey = str(eax) + str(ecx) + str(edx)
                            if cpuKey == licences[2]:
                                flag = True
                                gvar.VALIDATE_DAY = day
                                gvar.IS_VALIDATE = True

        else:
            flag = True
    except Exception as e:
        print('license validate error:')
        print(e)
    return 1

# 获取授权码
def getKeyFromLicenseFile():
    key = ''
    try:
        licensePath = gvar.PRJ_PATH + '/datax/datax_license.xml'
        tree = ET.parse(licensePath)
        root = tree.getroot()
        for licenseGroup in root:
            for license in licenseGroup:
                key = license.attrib['key']
        # root_node = ElementTree.fromstring(ftext)
    except Exception as e:
        print(e)
    return key

# web拦截器
class SimpleMiddleware(MiddlewareMixin):

    def process_request(self, request):
        # summerlight_token = str(request.META.get("HTTP_ORIGIN"))
        # # if summerlight_token.find('localhost') > -1 or summerlight_token.find('127.0.0.1') > -1:
        # if 1 > 2:
        #     pass
        # else:
        # 授权验证，每天验证一次
        validateStatus = validateLicense()
        if validateStatus == False:
            return render(request, "no_permission.html")
        path = request.path
        # 外链访问
        # if 'remoteview' in path:
        #     user = u.objects.get(username='admin')
        #     login(request, user)
        if 'remoteview' not in path and 'mobileAppLogin' not in path and gvar.IS_REMOTE_LOGIN is False:
            # 确保单用户只能在一个地方登陆
            alreadyLogin = False
            loginName = request.user.username
            if 'csrftoken' in request.COOKIES and loginName != '':
                loginToken = request.COOKIES['csrftoken']

                # 拦截除了登陆和注销之外的url
                if 'logout' not in path and 'login' not in path:
                    for loginUser in gvar.LOGINUSERS:
                        if loginName == loginUser['loginName']:
                            if loginToken != loginUser['loginToken']:
                                gvar.LOGINUSERS.remove(loginUser)
                                return HttpResponseRedirect('/account/logout')
                            else:
                                alreadyLogin = True
                    if alreadyLogin == False:
                        gvar.LOGINUSERS.append({
                            'loginName': loginName,
                            'loginToken': loginToken
                        })
                elif 'logout' in path:#如果是logout，不管是account/logout还是account/homePage/logout，登出时必须清除gvar.LOGINUSERS里的数据
                    for loginUser in gvar.LOGINUSERS:
                        if loginName == loginUser['loginName']:
                            gvar.LOGINUSERS.remove(loginUser)
