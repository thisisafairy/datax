# -*-coding: utf-8 -*-
import os
#
# FILE_PATH           	= os.path.dirname( os.path.abspath(__file__) )
# PROJECT_ROOT_PATH   	= os.path.abspath( os.path.join(FILE_PATH, os.pardir) )
# TEMPLATE_PATH       	= os.path.join(PROJECT_ROOT_PATH, "templates")
# STATIC_PATH         	= os.path.join(PROJECT_ROOT_PATH, "static")
# REQUIREJS_MODULE_PATH	= os.path.join(PROJECT_ROOT_PATH, 'templates/widget/add')
# MARIONETTE_PATH         = os.path.join(PROJECT_ROOT_PATH, 'templates/widget/widget_add')
#
# TEMP_DRAW_DATA_FILE		= os.path.join(PROJECT_ROOT_PATH, 'temp/111.json')
# LOG_PATH                = os.path.join(PROJECT_ROOT_PATH, 'log')
#
# #皮肤文件
# SCENE_SKIN_PATH         = os.path.join(PROJECT_ROOT_PATH, "static/skin/scene/")
# WIDGET_SKIN_PATH        = os.path.join(PROJECT_ROOT_PATH, "static/skin/widget/")
# SKIN_FILE_TYPE          = '.json'

# 默认数据信息
# sample:
# 'ip': '127.0.0.1:5432'
# 'db': 'datax'
# 'kind': 'pgsql'
# 'user': 'postgres'
# 'pwd': 'sasa'

# DEFAULT_DB_INFO         = {
#       'ip':             '127.0.0.1:5432'
#     , 'db':             'datax_cost'
#     , 'kind':           'pgsql'
#     , 'user':           'postgres'
#     , 'pwd':            '1qaz@WSX'
# }
# DATAXEXTENSION_DB_INFO  = {
#     'ip':             '127.0.0.1:5432'
#     , 'db':             'datax_extension_cost'
#     , 'kind':           'pgsql'
#     , 'user':           'postgres'
#     , 'pwd':            '1qaz@WSX'
# }
DEFAULT_DB_INFO         = {
    'ip':             '47.100.198.97:54321'
    , 'db':             'datax_cost'
    , 'kind':           'pgsql'
    , 'user':           'postgres'
    , 'pwd':            '123!@#'
}
DATAXEXTENSION_DB_INFO  = {
    'ip':             '47.100.198.97:54321'
    , 'db':             'datax_extension_cost'
    , 'kind':           'pgsql'
    , 'user':           'postgres'
    , 'pwd':            '123!@#'
}

# 匹配日期的正则表达式
REGEX_FOR_DATE          = '(\d{2}|\d{4})((?:\-)|(?:/))([0]{1}\d{1}|[1]{1}[0-2]{0,1})((?:\-)|(?:/))([0-2]{0,1}\d{0,1}|[3]{1}[0-1]{0,1})(?:\s)?([0-1]{1}\d{0,1}|[2]{1}[0-3]{1})?(?::)?([0-5]{1}\d{1}){0,1}(?::)?([0-5]{1}\d{1,2}){0,1}'

# 匹配数字的正则表达式
REGEX_FOR_NUMBER        = '^(-)?(?!(0[0-9]{0,}$))[0-9]{1,}[.]{0,}[0-9]{0,}$'

LIMIT = 10

LOG_COUNT = 500
	
SUPPORTED_DBS = ['postgres', 'mysql']

INT_TYPE = ['int','int4','int6','int8','bigint','decimal','Decimal','float','money','numeric','real','smallmoney','tinyint', 'mediumint']

#当用户没有在数据库中新增密码时使用这个初始密码，如果在数据库中新增了密码则使用数据库配置的默认密码
defaultPassword = 'admin123'
