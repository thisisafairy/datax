from enum import Enum, unique


@unique
class ConstantCode(Enum):
    #  成功
    SUCCESS = 1
    #  格式化出错
    FORMAT_EXCEPTION = 2
    #  编码出错
    ENCODING_EXCEPTION = 3
    #  解码出错
    DECODING_EXCEPTION = 4
    # json、xml层级过多
    TOO_MANY_LEVELS = 5
    # 读入的json不是集合形式
    NOT_LIST = 6

@unique
class LoggerCode(Enum):
    #自定义的日志
    DJANGOINFO = 'djangoInfo'

@unique
class DBTypeCode(Enum):
    #系统库
    SYSTEM_DB = 'default'
    # 扩展库
    EXTENSION_DB = 'extension'
    # 通过id连接
    CUSTOM_DB = 'custom'


