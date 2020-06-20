from django.contrib import admin

# Register your models here.
from account.models import sys_userextension,organization,org_user_group
admin.site.register(sys_userextension)
admin.site.register(organization)
admin.site.register(org_user_group)