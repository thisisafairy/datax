import os
import time

VALIDATE_DAY = 0

IS_VALIDATE = False

VERSION = ''

LIMITS = -1

LOGINUSERS = []

# 邮箱地址
MAIL_ADRESS = 'qwl3076@163.com'

# 邮箱密码
MAIL_PW = 'qwl123'

# smpt地址
MAIL_SMTP = 'smtp.163.com'

# smtp端口
MAIL_SMTP_PORT = '25'

ENCRYPT_KEY = b'datax_encryptkey'

IS_REMOTE_LOGIN = False

DASHBOARD2_VERSION = 2.01

PRJ_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PIC_MARK_TEXT = 'RONGWEI_DATAX'

PIC_MARK_PIC = ''

PIC_MARK_TYPE = 'default'

nowversion = str(int(time.time()))

REPORT_FUNCTION_CODE = [
    {
        'name': '常用函数',
        'code': 'commonFunction',
        'child': [
            {
                'code': 'SUM',
                'des': 'SUM(A1, B2, number)：求括号中所有数值之和，数值之间使用逗号分隔'
            }, {
                'code': 'AVERAGE',
                'des': 'AVERAGE(A1, B2, number)：返回指定数据的平均值'
            }, {
                'code': 'COUNT',
                'des': 'COUNT(A1, B1)：统计数据区域内的数据出现次数'
            }, {
                'code': 'MAX',
                'des': 'MAX(B2)：返回数据区域的所有数字中的最大值'
            }, {
                'code': 'MIN',
                'des': 'MIN(B2)：返回数据区域的所有数字中的最小值'
            }, {
                'code': 'YEAR',
                'des': 'YEAR(B1)：截取日期字段中的年份'
            }, {
                'code': 'MONTH',
                'des': 'YEAR(B1)：截取日期字段中的年份'
            }, {
                'code': 'DAY',
                'des': 'YEAR(B1)：截取日期字段中的年份'
            }
        ]
    }, {
        'name': '数学函数',
        'code': 'mathFunction',
        'child': [
            {
                'code': 'ABS',
                'des': 'ABS(number): 返回指定数字的绝对值'
            }, {
                'code': 'AVERAGE',
                'des': 'AVERAGE(A1, B2, number)：返回指定数据的平均值'
            }, {
                'code': 'INT',
                'des': 'INT(numer)：四舍五入截取数据的整数部分'
            }, {
                'code': 'MAX',
                'des': 'MAX(B2)：返回数据区域的所有数字中的最大值'
            }, {
                'code': 'MIN',
                'des': 'MIN(B2)：返回数据区域的所有数字中的最小值'
            }, {
                'code': 'MOD',
                'des': 'MOD(number, divisor):返回两数相除的余数。结果的正负号与除数相同。number:为被除数。divisor:为除数。示例:MOD(3, 2) 等于 1 MOD(3, -2) 等于 -1'
            }, {
                'code': 'POWER',
                'des': 'POWER(number, power): 返回指定数字的乘幂。Number:底数，可以为任意实数。Power:指数。参数number按照该指数次幂乘方。 示例:POWER(6,2)等于36。POWER(14,5)等于537824。POWER(4,2/3)等于2.519842100。POWER(3,-2.3)等于0.079913677。'
            }, {
                'code': 'SQRT',
                'des': 'SQRT(number)：返回一个正数的平方根。Number:要求其平方根的任一正数。备注:Number必须是一个正数，否则函数返回错误信息*NUM!。示例:SQRT(64)等于8。SQRT(-64)返回*NUM!。'
            }, {
                'code': 'SUM',
                'des': 'SUM(A1, B2, number)：求括号中所有数值之和，数值之间使用逗号分隔'
            }
        ]
    }, {
        'name': '日期函数',
        'code': 'dateFunction',
        'child': [
            {
                'code': 'YEAR',
                'des': 'YEAR(B1)：截取日期字段中的年份'
            }, {
                'code': 'MONTH',
                'des': 'MONTH(B1)：截取日期字段中的年份'
            }, {
                'code': 'DAY',
                'des': 'DAY(B1)：截取日期字段中的年份'
            }, {
                'code': 'DFF',
                'des': 'DFF(\'yyyy-MM-dd\')：自定义日期显示格式'
            }
        ]
    }, {
        'name': '其它函数',
        'code': 'otherFunction',
        'child': [
            {
                'code': 'NULLTO',
                'des': 'NULLTO(A1, xxx): 判断当前数据区域是否为空, 如果为空则显示成xxx'
            }, {
                'code': 'USER',
                'des': 'USER(): 返回当前登陆用户名'
            }, {
                'code': 'REPORT_NAME',
                'des': 'REPORT_NAME(): 返回当前报表名称'
            }, {
                'code': 'REPORT_TYPE',
                'des': 'REPORT_TYPE(): 返回当前报表类型'
            }
        ]
    }
]

#拼sql时拼接的引号，这里根据不同数据库来区分,AS_QUOTA作为对字段取别名需要使用的引号，例如xxx as "TEMP_COLNM"
#COL_QUOTA作为select字段的引号，例如select table."COL_NAME"
QUOTA_FOR_DBSQL = {
    "mysql":{
        "AS_QUOTA":'"',
        "COL_QUOTA":'`'
    },
    "oracle":{
        "AS_QUOTA":'"',
        "COL_QUOTA":'"'
    },
    "mssql":{
        "AS_QUOTA":'"',
        "COL_QUOTA":'"'
    },
    "pgsql":{
        "AS_QUOTA":'"',
        "COL_QUOTA":'"'
    },
}
# 前后台菜单缓存
menu_cache ={
    'user_id':[],
    'user_back':[],
    'user_front':[]
}
