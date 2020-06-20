# encoding: utf-8
import re
from decimal import Decimal
from common import globalvariable as glbv


class ReportUtils:
    def __init__(self, formulaStr, dataList, decimalPointNum=6):
        self.formula = formulaStr.replace('，',',').replace('（','(').replace('）',')').replace(' ','').upper()
        self.source = dataList
        self.fcList = glbv.REPORT_FUNCTION_CODE
        self.isMatch = True
        self.decimalPoint = '0'
        if decimalPointNum > 0:
            self.decimalPoint = '0.'
        for num in range(decimalPointNum):
            self.decimalPoint += '0'


    # 根据行列下标取值
    def getDataByCoordinateFromList(self, fcType, rowIndex, colIndex):
        tempNum = 0
        colData = self.source[rowIndex]['col'][colIndex]
        fcData = colData['list']
        # objName = colData['cellDataSource']['col']
        if not fcType or ',SUM,'.find(fcType) > 0:
            for val in fcData:
                tempNum += val
        elif ',AVERAGE,'.find(fcType) > 0:
            for val in fcData:
                tempNum += val
            tempNum = Decimal(tempNum/len(fcData)).quantize(Decimal(self.decimalPoint))
        elif ',MAX,'.find(fcType) > 0:
            for i, val in enumerate(fcData):
                if i == 0:
                    tempNum = val
                else:
                    if val > tempNum:
                        tempNum = val
        elif ',MIN,'.find(fcType) > 0:
            for i, val in enumerate(fcData):
                if i == 0:
                    tempNum = val
                else:
                    if val < tempNum:
                        tempNum = val
        return tempNum


    # 将a1 转换成 行列下标
    def translateCoordinate(self, formulaStr, fcType):
        tempFormulaStr = formulaStr
        # 找出所有类似A2这种数据
        m = re.findall(r'[A-Z]{1,5}[1-9]{1,5}', formulaStr)
        # 去重
        fcs = list(set(m))
        for coordinate in fcs:
            strs = ''
            nums = ''
            for i, w in enumerate(coordinate):
                if re.search(r'[A-Z]', str(w)):
                    if i == 0:
                        strs += str(ord(w) - 64)
                    else:
                        strs = str(ord(w) - 64 + int(strs) * 26)
                else:
                    nums += str(w)
            tempNum = self.getDataByCoordinateFromList(fcType, int(nums)-1, int(strs)-1)
            tempFormulaStr = tempFormulaStr.replace(str(coordinate), str(tempNum))
        return tempFormulaStr


    # 将sum(a1,a2) 转换成 (a1+a2)
    def translateFc(self, fcName, fcStr):
        tempFormula = (fcStr[len(fcName)+1:len(fcStr)-1])
        if  ',SUM,MAX,MIN,'.find(fcName) > 0:
            tempFormula = self.translateCoordinate(tempFormula, fcName)
            tempFormula = str(eval(tempFormula.replace(',','+')))
            self.formula = self.formula.replace(fcStr, tempFormula)
        elif fcName == 'AVERAGE':
            tempFormula = self.translateCoordinate(tempFormula, fcName)
            tempResult = eval('(' + tempFormula.replace(',','+') + ')/' + str(len(tempFormula.split(','))))
            tempFormula = str(Decimal(tempResult).quantize(Decimal(self.decimalPoint)))
            self.formula = self.formula.replace(fcStr, tempFormula)


    # 将 函数名(参数1, 参数2) 形式替换成数学公式
    def getMethod(self):
        matchs = []
        for i, val in enumerate(self.fcList):
            if val['code'] is not 'commonFunction':
                for j, fcCode in enumerate(val['child']):
                    reStr = fcCode['code'] + '[(][A-Z]{0,3}[0-9]{1,10}[\.]{0,1}[,]{0,1}'
                    for xx in range(20):
                        reStr += '[A-Z]{0,3}[0-9]{0,10}[,]{0,1}'
                    reStr += '[)]'
                    matchs = re.findall(reStr, self.formula)
                    matchs = list(set(matchs))
                    if len(matchs) > 0:
                        self.isMatch = True
                        break
                if self.isMatch:
                    break
        if len(matchs) > 0:
            for k, matchStr in enumerate(matchs):
                self.translateFc(fcCode['code'], matchStr)
        else:
            self.isMatch = False


    # 格式化不带函数的公式
    def parseNoFcFormula(self):
        # 找出坐标，计算最大需要多少行
        maxRow = 0
        tempCoors = re.findall(r'[A-Z]{1,5}[1-9]{1,5}', self.formula)
        coors = list(set(tempCoors))
        for j, val in enumerate(coors):
            strs = ''
            nums = ''
            for i, w in enumerate(val):
                if re.search(r'[A-Z]', str(w)):
                    if i == 0:
                        strs += str(ord(w) - 64)
                    else:
                        strs = str(ord(w) - 64 + int(strs) * 26)
                else:
                    nums += str(w)
            rowIndex = int(nums)-1
            colIndex = int(strs)-1
            colData = self.source[rowIndex]['col'][colIndex]
            if colData['list'] and len(colData['list']) > maxRow:
                maxRow = len(colData['list'])
            objName = colData['cellDataSource']['col']
            # self.formula = self.formula.replace(val, 'self.source['+str(rowIndex)+'][\'col\']['+str(colIndex)+'][\'list\'][listRowIndex][\''+objName+'\']')
            self.formula = self.formula.replace(val, 'self.source['+str(rowIndex)+'][\'col\']['+str(colIndex)+'][\'list\'][listRowIndex]')
        if maxRow > 0:
            self.resultList = []
            for k in range(maxRow):
                try:
                    self.resultList.append(eval(self.formula.replace('listRowIndex', str(k))))
                except:
                    self.resultList.append(0)
        else:
            self.resultList = [0]

    def parseFormula(self):
        # 判断整个公式里是不是有函数
        hasFc = False
        for i, val in enumerate(self.fcList):
            if val['code'] is not 'commonFunction':
                for j, fcCode in enumerate(val['child']):  
                    matchs = re.findall(fcCode['code'], self.formula)
                    if len(matchs) > 0:
                        hasFc = True
        # 没有的话:
        if not hasFc:
            self.parseNoFcFormula()
            return self.resultList
        # 有的话
        if hasFc:
            while self.isMatch:
                self.getMethod()   


            # 最后将没有放入函数的坐标对应的数取出来
            self.formula = self.translateCoordinate(self.formula, None)
            return self.formula