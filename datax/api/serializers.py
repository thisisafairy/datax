from django.contrib.auth.models import User, Group
from account.models import sys_userextension
from rest_framework import serializers


# class UserSerializer(serializers.HyperlinkedModelSerializer):
#     class Meta:
#         model = User
#         fields = ('url', 'username', 'email', 'groups')
#
#
# class GroupSerializer(serializers.HyperlinkedModelSerializer):
#     class Meta:
#         model = Group
#         fields = ('url', 'name')

class UserExtensionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = sys_userextension
        fields = ('id','username', 'email')