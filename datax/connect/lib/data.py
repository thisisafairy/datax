import re
from connect.sqltool import *


def getSourceColumn(sourceid):
    columns = sourcedetail.objects.filter(sourceid=sourceid)
    result = []
    for column  in columns:
        dist = {}
        dist['distconfig'] = json.loads(column.distconfig.replace("'", "\"")) if column.distconfig is not None else []
        dist['formula'] = column.column_formula
        dist['field'] = column.table + '__' + column.column
        dist['formulacolumn'] = column.formatcolumn
        result.append(dist)
    return result

def formateRemoteByRow(row, columns):
    for column in columns:
        if column['field'] not in row:
            continue
        if 'distconfig' in column and column['distconfig'] and column['distconfig'] != '[]':
            dist = column['distconfig']
            val = row[column['field']]
            if 'str' in str(type(dist)):
                dist = json.loads(dist.replace("'", "\""))
            for distRow in dist:
                if equal2NumStr(str(val),str(distRow['key'])):
                    row[column['field']] = distRow['value']
        if row[column['field']] != row[column['field']]:
            row[column['field']] = None
            continue
        if 'formula' in column and column['formula']:
            formula = column['formula']
            val = row[column['field']]
            if val is not None:
                flag = 0
                # 截取字段中的年份
                if 'get_year' == formula or 'get_month' == formula or 'get_day' == formula:
                    # try:
                    #     valType = str(type(val))
                    #     if 'time' in valType and 'pandas' not in valType:
                    #         val = int(val.year)
                    #     elif 'pandas' in valType:
                    #         val = int(val.to_datetime().year)
                    #     else:
                    #         val = None
                    # except Exception as e:
                    #     val = None
                    flag = 1
                # 截取字段中的月份
                # if 'get_month' == formula:
                    # try:
                    #     valType = str(type(val))
                    #     if 'time' in valType and 'pandas' not in valType:
                    #         val = int(val.month)
                    #     elif 'pandas' in valType:
                    #         val = int(val.to_datetime().month)
                    #     else:
                    #         val = None
                    # except Exception as e:
                    #     val = None
                #    flag = 1
                # 合并字段 SQL处理
                if formula == 'merge':
                    flag = 1
                # 保留只有数字的数据
                if 'only_numeral' == formula:
                    if re.match(r'^(-)?\d+(.\d+)?$', str(val)):
                        flag = 1
                # 保留包含数字的数据
                elif 'include_numeral' == formula:
                    if re.search(r'(-)?\d+(.\d+)?', str(val)):
                        flag = 1
                # 保留包含数字的数据并删除数据中除数字之外的字符
                elif 'keep_numeral' == formula:
                    if re.search(r'(-)?\d+(.\d+)?', val):
                        val = re.sub(r'[^(-)?\d+(.\d+)?]', '', str(val))
                        flag = 1
                # 保留包含XX的数据
                elif re.match(r'^keep___', formula):
                    re_str = formula.replace('keep___', '')
                    if re.search(re_str, str(val)):
                        flag = 1
                # 删除包含XX的数据
                elif re.match(r'^delete___', formula):
                    re_str = formula.replace('delete___', '')
                    if re.search(re_str, str(val)):
                        flag = 0
                    else:
                        flag = 1
                # 将数据中的XX替换成YY
                elif re.search(r'^(replace___)(.+)(___to___)(.+)$', formula):
                    m = re.search(r'^(replace___)(.+)(___to___)(.+)$', formula)
                    old_str = m.group(2)
                    new_str = m.group(4)
                    val = re.sub(old_str, new_str, str(val))
                    flag = 1
                elif re.search(r'^(group___)(.+)(___get___)(.+)$', formula):
                    reArr = formula.split('___')
                    re_str = reArr[1]
                    need_index = reArr[3]
                    separator = reArr[4]
                    m = re.match(re_str, str(val))
                    if m:
                        returnVal = ''
                        indexArr = need_index.split(',')
                        for index in indexArr:
                            returnVal = returnVal + m.group(int(index) - 1)
                            if separator != 'separator':
                                if len(separator) > 0:
                                    returnVal = returnVal[:-len(separator)]
                        val = returnVal
                    flag = 1
                if flag == 1:
                    row[column['field']] = val
                else:
                    row[column['field']] = None
    return row

def formateRemote(rows,columns):
    for row in rows:
       row = formateRemoteByRow(row, columns)
    return rows

def equal2NumStr(num1,num2):
    try:
        if num1.find('.')>=0:#数字的情况需要删除.00再做比较
            tempv=num1[num1.find('.')+1:]
            if re.sub(r'0*','',tempv).strip():#后半部分不全都是0
                num1=num1.strip().rstrip('0')
            else:#后半部分全部为0
                num1=num1[:num1.find('.')]
    except Exception as e:
        print('file:data.py;method:equal2NumStr')
        print(e.args[0])
    try:
        if num2.find('.')>=0:#数字的情况需要删除.00再做比较
            tempv=num2[num2.find('.')+1:]
            if re.sub(r'0*','',tempv).strip():#后半部分不全都是0
                num2=num2.strip().rstrip('0')
            else:#后半部分全部为0
                num2=num2[:num2.find('.')]
    except Exception as e:
        print('file:data.py;method:equal2NumStr')
        print(e.args[0])
    if num1 == num2:
        return True
    else:
        return False
