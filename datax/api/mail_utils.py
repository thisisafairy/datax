import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
import email.mime.multipart
import email.mime.text
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from connect.models import maillogs, systemmessage
from django.core.mail import send_mail
from common import globalvariable
from django.db.models import F
from api.accountapi import accountview
from api import utils
from dashboard.models import emailconf,smsconf,syserrorconf,wechatconf
from account.models import sys_userextension
from qcloudsms_py import SmsMultiSender
from qcloudsms_py.httpclient import HTTPError
import itchat
#from channels import Channel, Group
import datetime, os, platform,time
from common.constantcode import DBTypeCode,LoggerCode
import logging
logger = logging.getLogger(LoggerCode.DJANGOINFO.value)
from connect.models import monitor

#msgFrom = globalvariable.MAIL_ADRESS  # 从该邮箱发送
# smtpSever = globalvariable.MAIL_SMTP  # 163邮箱的smtp Sever地址
# smtpPort = globalvariable.MAIL_SMTP_PORT  # 开放的端口
# sqm = globalvariable.MAIL_PW  # 在登录smtp时需要login中的密码应当使用授权码而非账户密码


# 发送只包含文本的邮件
# mail_to:收件人,逗号分隔
# acc:抄送收件人,逗号分隔
def sendTextMail(mail_title, content, mail_to, acc='', rule_id='', monitordetail_id='', type=1):
    obj = emailconf.objects.filter(status=1)
    if obj:
        if obj[0].status == 1:
            msgFrom = obj[0].mailaddress
            smtpSever = obj[0].smptaddress
            smtpPort = obj[0].smptport
            sqm = obj[0].mailpassword
    else:
        msgFrom = ''
        smtpSever = ''
        smtpPort = ''
        sqm = ''
    if msgFrom != '':
        print('发送邮件')
    else:
        print('邮件配置未启用')
    msg = email.mime.multipart.MIMEMultipart()
    msg['from'] = msgFrom
    msg['to'] = mail_to # 发送到该邮箱
    if acc != '':
        msg['Cc'] = acc #抄送到该邮箱
    msg['subject'] = mail_title
    # content = '''
    # 你好:
    #     这是一封python3发送的邮件
    # '''
    txt = email.mime.text.MIMEText(content, 'html', 'utf-8')
    msg.attach(txt)
    smtp = smtplib
    smtp = smtplib.SMTP()
    # '''
    # smtplib的connect（连接到邮件服务器）、login（登陆验证）、sendmail（发送邮件）
    # '''
    try:
        smtp.connect(smtpSever, smtpPort)
        smtp.login(msgFrom, sqm)
        if msgFrom != '':
            if acc != None and acc != '':
                receive_msg = smtp.sendmail(msgFrom, mail_to.split(',') + acc.split(','), str(msg))
            else:
                receive_msg = smtp.sendmail(msgFrom, mail_to.split(','), str(msg))
            send_success = 'y'
    except Exception as e:
        receive_msg = e.args
        send_success = 'n'
        print(e)
    finally:
        # 邮件异常，先暂时关闭
        # if msgFrom != '':
        #     smtp.quit()
        # 邮件内容录入
        print('type',type)
        for mailto in mail_to.split(','):
            maillogs.objects.create(mail_title=mail_title, mail_from=msgFrom, mail_to=mailto, mail_acc=acc
                                    , mail_content=content, has_file='n', send_success=send_success
                                    , receive_msg=receive_msg, rule_id=rule_id, options=type, monitordetail_id=monitordetail_id)
            maillogsid = ''
        # 系统消息录入(未读消息采用累加，新用户则直接录入)
        obj = monitor.objects.get(id=monitordetail_id)
        users = obj.addressee
        for user in users.split(','):
            where = 'username=' + user
            fetchall = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper(
                'select count(*) from connect_systemmessage where ' + where,
                logger, 'mail_utils.py',
                'sendPicMail')
            numof = fetchall[0]
            if int(str(numof)[1]) > 0:
                obj = systemmessage.objects.get(username=user.replace("'",''))
                obj.unread_mess_mun += 1
                obj.save()
            else:
                systemmessage.objects.create(username=user.replace("'",''), unread_mess_mun=1)
    return maillogsid

# 发送带有图片的邮件
def sendPicMail(mail_title, content, picPath, mail_to, users):
    obj = emailconf.objects.filter(status=1)
    if obj:
        if obj[0].status == 1:
            msgFrom = obj[0].mailaddress
            smtpSever = obj[0].smptaddress
            smtpPort = obj[0].smptport
            sqm = obj[0].mailpassword
    else:
        msgFrom = ''
        smtpSever = ''
        smtpPort = ''
        sqm = ''
    if msgFrom != '':
        print('发送邮件')
    else:
        print('邮件配置未启用')
    msg = MIMEMultipart()  # 创建一个带附件的实例
    msg['from'] = msgFrom
    msg['to'] = mail_to  # 发送到该邮箱
    msg['subject'] = mail_title
    msg.attach(MIMEText('本次主题分享，详情请查看附件', 'plain', 'utf-8'))

    att1 = MIMEText(open(picPath, 'rb').read(), 'base64', 'utf-8')
    att1["Content-Type"] = 'application/octet-stream'
    # 这里的filename可以任意写，写什么名字，邮件中显示什么名字
    att1["Content-Disposition"] = 'attachment; filename="share1.png"'
    msg.attach(att1)
    smtp = smtplib.SMTP()
    # '''
    # smtplib的connect（连接到邮件服务器）、login（登陆验证）、sendmail（发送邮件）
    # '''
    try:
        if msgFrom != '':
            smtp.connect(smtpSever, smtpPort)
            smtp.login(msgFrom, sqm)
            # if acc != None and acc != '':
            #     receive_msg = smtp.sendmail(msgFrom, mail_to.split(',') + acc.split(','), str(msg))
            # else:
            receive_msg = smtp.sendmail(msgFrom, mail_to.split(','), str(msg))
            send_success = 'y'
        else:
            receive_msg = smtp.sendmail(msgFrom, mail_to.split(','), str(msg))
            send_success = 'n'
    except Exception as e:
        receive_msg = e.args
        send_success = 'n'
        print(e)
    finally:
        if msgFrom != '':
            smtp.quit()
        #入库前对图片路径进行更改，方便展示
        print(picPath)
        picPath = '..'+picPath[10:]
        # 系统消息录入(未读消息采用累加，新用户则直接录入)
        for user in users:
            where = 'username=' + "'" + user['username'] + "'"
            fetchall = utils.SqlUtils(DBTypeCode.EXTENSION_DB.value).getArrResultWrapper('select count(*) from connect_systemmessage where ' + where,
                                                                                           logger, 'mail_utils.py',
                                                                                           'sendPicMail')
            numof = fetchall[0]
            if int(str(numof)[1]) > 0:
                where = 'mail_to=' + "'" + user['email'] + "'" + "and is_read = '0' "
                fetchall = utils.getResultBySql('select count(*) from connect_maillogs where ' + where)
                numof = fetchall[0]
                obj = systemmessage.objects.get(username=user['username'])
                obj.unread_mess_mun = int(str(numof)[1])+1
                obj.save()
            else:
                systemmessage.objects.create(username=user['username'], user_mail=user['email'], unread_mess_mun=1)

        # 邮件内容录入
        for mailto in mail_to.split(','):
            maillogs.objects.create(mail_title=mail_title, mail_from=msgFrom, mail_to=mailto
                                , mail_content=content, has_file='n', send_success=send_success
                                , receive_msg=receive_msg, img_path=picPath, options='0')


    return send_success

# 发送短信(腾讯云)
def sendsms():
    obj = smsconf.objects.filter(status=1)
    if obj:
        appid = obj[0].appid
        appkey = obj[0].appkey
        template_id = obj[0].templateid
        sms_sign = obj[0].template
    obj = syserrorconf.objects.filter(is_use=1)
    sms_to_user = obj[0].candidate_sms
    phone_numbers = []
    for user in sms_to_user.split(','):
        obj = sys_userextension.objects.get(username=user[1:-1])
        phone_numbers.append(obj.mobile)
    msender = SmsMultiSender(appid, appkey)
    params = ["5678"]  # 数组具体的元素个数和模板中变量个数必须一致，例如事例中templateId:5678对应一个变量，参数数组中元素个数也必须是一个
    try:
        result = msender.send_with_param(86, phone_numbers,
                                         template_id, params, sign=sms_sign, extend="",
                                         ext="")  # 签名参数未提供或者为空时，会使用默认签名发送短信
    except HTTPError as e:
        print(e)
    except Exception as e:
        print(e)

    print(result)

# def timerfun(sched_time) :
#     flag = 0
#     while True:
#         now = datetime.datetime.now()
#         if now > sched_time:  # 因为时间秒之后的小数部分不一定相等，要标记一个范围判断
#             send_move()
#             time.sleep(1)    # 每次判断间隔1s，避免多次触发事件
#             flag = 1
#         else:
#             if flag == 1 :
#                 sched_time = sched_time + datetime.timedelta(hours=0.1)  # 把目标时间增加一个小时，一个小时后触发再次执行
#                 flag = 0


#发送微信消息
def send_move():
    itchat.login()
    obj = wechatconf.objects.filter()
    names = obj[0].userid
    #for user in names.split('&'):
    users = itchat.search_friends(name='周丰裕')   # 使用备注名来查找实际用户名
    # 获取好友全部信息,返回一个列表,列表内是一个字典
    # 获取`UserName`,用于发送消息
    if users:
        userName = users[0]['UserName']
        # itchat.send('hello', 'filehelper')
        itchat.send("python发送微信报警测试！",toUserName=userName)
    print('succeed')


