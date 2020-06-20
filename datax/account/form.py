
from django import forms
class userForm(forms.Form):
    id = forms.CharField(widget=forms.HiddenInput(),label='', required=False)
    username = forms.CharField(max_length=30,
                               widget=forms.TextInput(attrs={'class': 'form-control'}),
                               label='用户名')

    nickname = forms.CharField(max_length=30,
                               widget=forms.TextInput(attrs={'class': 'form-control'}),
                               label='昵称',required=False)

    password = forms.CharField(max_length=30,
                               widget=forms.PasswordInput(attrs={'class': 'form-control'}),
                               label='密码',required=False)

    email = forms.EmailField(max_length=30,
                               widget=forms.EmailInput(attrs={'class': 'form-control'}),
                               label='邮箱')

    mobile = forms.CharField(required=False,widget=forms.TextInput(attrs={'class': 'form-control'}),
                               label='手机')
