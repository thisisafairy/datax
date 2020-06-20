import sys
from base64 import b64decode
from base64 import b64encode
from Crypto.Cipher import AES
from binascii import b2a_hex, a2b_hex
import base64
from urllib.parse import quote


class AESCipher:
    def __init__(self, key):
        self.key = key[0:16] #只截取16位

    def encrypt(self, source):
        """加密"""
        pad_it = lambda s: s + (16 - len(s) % 16) * self.padding
        generator = AES.new(self.key, AES.MODE_CBC, self.key)
        text = pad_it(source)
        crypt = generator.encrypt(text.encode("utf8"))
        cryptedStr = base64.b64encode(crypt)
        return cryptedStr.decode("utf-8")

    def decrypt(self, crypt):
        """解密"""
        PADDING = '\0'
        generator = AES.new(self.key, AES.MODE_CBC, self.key)
        recovery = (generator.decrypt(base64.b64decode(crypt))).decode("utf-8")
        returnStr = recovery.rstrip(PADDING)
        return returnStr


# pc = prpcrypt(b'datax_encryptkey')
if __name__ == '__main__':
    PADDING = '\0'
    pad_it = lambda s: s+(16 - len(s)%16)*PADDING  
    key = ('datax_encryptkey').encode("utf8")
    # source = 'datax___admin___scene___72c5c36889a811e8acfadc5360808e4f___hjjhhj'
    source = '1526543458_1841903458_22197016915918185882701231384169_50_test'
    generator = AES.new(key, AES.MODE_CBC, key)
    text = pad_it(source)
    crypt = generator.encrypt(text.encode("utf8"))   
    cryptedStr = base64.b64encode(crypt)
    print('enc_str: ' + quote(cryptedStr.decode("utf-8").replace('=', '_equal_').replace('+', '_add_').replace('/', '_bias_'), 'utf-8'))
    generator2 = AES.new(key, AES.MODE_CBC, key)
    recovery = (generator2.decrypt(base64.b64decode(cryptedStr))).decode("utf-8")
    returnVal = recovery.rstrip(PADDING)
    print(returnVal)