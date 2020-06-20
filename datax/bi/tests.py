from django.test import TestCase

# Create your tests here.
import urllib.parse  
import urllib.request
import json



#获取 access_token
data = urllib.parse.urlencode({'appkey':'dingee7y1sxlfqzbd2ga', 'appsecret':'AtSPhx9JH6HNZb_dkBoi4DOo88KDVYthHscZ-7D5iT5Y5bWV5b3b4B_HY4yOQo-a'})
response = urllib.request.urlopen('https://oapi.dingtalk.com/gettoken?%s' % data)
html = response.read()
returnMsg = json.loads(html.decode('utf-8'))
access_token = returnMsg["access_token"]
# 通过access_token和用户id获取详细信息
# response = urllib.request.urlopen('https://oapi.dingtalk.com/user/get?access_token='+ access_token+'&userid=6712230426315244')
# html = response.read()
# returnMsg = json.loads(html.decode('utf-8'))
# print('returnMsg======',returnMsg)
#  # 获取部门名称
response = urllib.request.urlopen('https://oapi.dingtalk.com/department/list?access_token='+access_token)
html = response.read()
returnMsg = json.loads(html.decode('utf-8'))
returnMsg = returnMsg["department"]

for obj in returnMsg:

    
    #获取部门下的员工
    data = urllib.parse.urlencode({'access_token': access_token, 'department_id':obj['id'], 'offset': 0, 'size': 100})
    response = urllib.request.urlopen('https://oapi.dingtalk.com/user/listbypage?%s' % data)
    html = response.read()
    userMsg = json.loads(html.decode('utf-8'))
    userMsg = userMsg['userlist']
    for user in userMsg:
    # if user['name'] in ('杨振宇','吴敬磊','刘思杰','庞娟娟','杨立友','何文中','侯彩文','师锐鹏','胡晓光','刘莉'):
        if user['name'] in ('刘思杰'):
            print('name=',user['name'],'id=',user['userid'])
                #发送推送
                # url = 'https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2'
                # values = {
                #     'agent_id': '259974667',
                #     'access_token': access_token,
                #     'userid_list': user['userid'],
                #     'msg': {"msgtype":"text","text":{"content": user['name'] + "您好，链接为应收款项到期提醒周报，请点击查看。" + "http://erpreport.jinergy.com:8056/ex/dingaccountRemind?dd_orientation=auto"}}
                # }
                # data = urllib.parse.urlencode(values)
                # data = data.encode('utf-8')
                # req = urllib.request.Request(url, data)
                # req.add_header('User-Agent', 'Mozilla/6.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/8.0 Mobile/10A5376e Safari/8536.25')
                # response = urllib.request.urlopen(req)

                # html = response.read()
                # returnMsg = html.decode('utf-8')
                # print(returnMsg)

        

# 获取部门下的员工
# data = urllib.parse.urlencode({'access_token': '4d1efbd54d6b302291457e7abb0ae9fa', 'department_id':64811598, 'offset': 0, 'size': 100})
# response = urllib.request.urlopen('https://oapi.dingtalk.com/user/listbypage?%s' % data)
# html = response.read()
# userMsg = json.loads(html.decode('utf-8'))
# print(userMsg['userlist'])

# #发送推送
# url = 'https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2'
# values = {
#     'agent_id': '258327267',
#     'access_token': '4d1efbd54d6b302291457e7abb0ae9fa',
#     'userid_list': '074325025820985611',
#     'msg': {"msgtype":"text","text":{"content":"刘思杰您好，链接为应收款项到期提醒表，请点击查看" + "http://erpreport.jinergy.com:8056/ex/dingaccountRemind?dd_orientation=auto"}}
# }
# data = urllib.parse.urlencode(values)
# data = data.encode('utf-8')
# req = urllib.request.Request(url, data)
# req.add_header('User-Agent', 'Mozilla/6.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/8.0 Mobile/10A5376e Safari/8536.25')
# response = urllib.request.urlopen(req)

# html = response.read()
# returnMsg = html.decode('utf-8')
# print(returnMsg)
