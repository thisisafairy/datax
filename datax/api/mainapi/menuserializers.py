from dashboard.models import menu
from rest_framework import serializers

class MenuSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = menu
        fields = ('id','name','url', 'key','parent_key','permission_name')