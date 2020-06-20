import urllib.request
import urllib.parse
import json
#这个是百度翻译api的地址
url = 'http://api.k780.com'
#准备一下头
headers = {
    'User-Agent': 'Mozilla/4.0 (compatible; MSIE 5.5; Windows NT)'
}
#还有我们准备用Post传的值，这里值用字典的形式
values = {
    'app' : 'weather.future',
    'weaid' : '北京',
    'appkey' : '39777',
    'sign' : 'f17306dc8d0057e27f9cd522128811dd',
    'format' : 'json',
}
#将字典格式化成能用的形式
data = urllib.parse.urlencode(values).encode('utf-8')
#创建一个request,放入我们的地址、数据、头
request = urllib.request.Request(url, data, headers)
#访问
html = urllib.request.urlopen(request).read().decode('utf-8')
#利用json解析包解析返回的json数据 拿到翻译结果
print(json.loads(html))
