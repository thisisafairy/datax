/**
 * 浮点数相加
 * @param {*} num1  数字1
 * @param {*} num2  数字2
 */
function numAdd(num1, num2) {
  var baseNum, baseNum1, baseNum2;
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2) + 1);
  return (num1 * baseNum + num2 * baseNum) / baseNum;
}
/**
 * 根据url 或者 数据集 生成 图表所需要的 数据结构
 * @param {*} data 数据地址 
 * @param {*} dataArray  数据集
 */
function vecharts(data, dataArray) {
  var dataSource, dataset;
  if (typeof dataArray === 'object') {
    dataset = dataArray;
  }
  else {
    dataSource = dl.load({ url: data.url });
    dataset = JSON.parse(dataSource);
  }

  var result = {
    name: 'page.load',
    datapoints: []
  };

  if (data.type === 'pie') {
    var s = dl.groupby(data.field.x).execute(dataset);
    var summ = function (ary) {
      var xxx = 0;
      ary.map(function (me) {
        if (data.field.y == '') {
          xxx = numAdd(xxx, 0);
        }
        else {
          xxx = numAdd(xxx, me[data.field.y]);
        }
      });
      return xxx;
    };
    s.map(function (a) {
      var b = summ(a.values);
      result.datapoints.push({
        x: a[data.field.x],
        y: b
      });
    });
  }
  if (data.type === 'gauge') {
    var summ = dataset.reduce(function (a, b) {
      return (Number(a) + Number(b[data.field.y])).toFixed(2);
    }, 0);
    result.datapoints.push({ x: data.field.y, y: summ });
  }
  return result;
}

/**
 * 根据 url 或者 数据集生成 地图图表 所需要的数据结构
 * @param {*} data 
 * @param {*} dataArray 
 */
function mapEchart(data, dataArray) {
  if (!data) {
    return false;
  }
  var dataSource, dataset;
  if (typeof dataArray === 'object') {
    dataset = dataArray;
  }
  else {
    dataSource = dl.load({ url: data.url });
    dataset = dl.read(dataSource, { type: 'json' });
  }
  var s = dl.groupby(data.field.x).execute(dataset);
  var ssss = []
  var summ = function (ary) {
    var xxx = 0;
    ary.map(function (me) {
      if (data.field.y == '') {
        xxx = numAdd(xxx, 0);
      }
      else {
        xxx = numAdd(xxx, me[data.field.y]);
      }
    });
    return xxx;
  }
  s.map(function (a) {
    var b = summ(a.values);
    if (b > 0) {
      ssss.push({
        name: a[data.field.x],
        value: b
      });
    }
  });
  return ssss;
}


