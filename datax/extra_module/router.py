from django.http import StreamingHttpResponse
from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.core import serializers
import json
import time
from django.http import HttpResponse
from django.contrib.admin.views.decorators import staff_member_required
from common import globalvariable as glbv
# glbv.nowversion: 时间戳，每次重启服务时更新

def stream_response_generator(htmlname):

    yield render_to_string(htmlname, {"title":"BigPipe Test Page"})
    for x in range(0,10):

        time.sleep(1)
    yield "</body></html>\n"


def testpage(request):
    return render_to_response('extra_module/index.html', {"nowversion": glbv.nowversion})