# -*- coding:utf-8 -*-
import os
import glob
import shutil

PYCCACHE = '__pycache__'
PY34 = '.cpython-34'
SKIP_FILES = ['settings.py','head.py']

def publishfile():
    files=['account','api','bi','common','connect','dashboard','datax',]
    preDir=os.path.dirname(os.path.realpath(__file__))
    for dirobj in files:
        exeDir=os.path.join(preDir,dirobj)
        executeDir(exeDir)

#对路径下的文件执行发布操作，将__pycache__文件夹下的文件改名字并拷贝到外层，删除外层的py文件
def executeDir(fileDir):
    currFolderName=os.path.split(fileDir)[1]
    if currFolderName == PYCCACHE:
        renamedFiles=renameFile(fileDir)#重命名pyc文件
        tranFile(fileDir,renamedFiles)#复制pyc文件到父目录
        deleParanetPyFile(fileDir,renamedFiles)#删除父目录下对应的py文件，__pycache__文件夹

    for root,dirs,files in os.walk(fileDir):
        for dr in dirs:
            searchDir=os.path.join(root,dr)
            executeDir(searchDir)


#将目录下的pyc文件重命名（去掉PY34）
def renameFile(pycDir):
    renamedFiles=[]
    pycDir = os.path.join(pycDir, '*.pyc')
    for filename in glob.glob(pycDir):
        (fpath,fname)=os.path.split(filename)
        if PY34 in fname:
            newFileName=fname.replace(PY34,'')
            newPathFile=os.path.join(fpath,newFileName)
            os.rename(filename,newPathFile)
            renamedFiles.append(newFileName)
    return renamedFiles

#将pyc文件拷贝到父目录下
def tranFile(pycDir,renamedFiles):
    parentDir=os.path.abspath(os.path.dirname(pycDir)+os.path.sep+'.')
    for pycf in renamedFiles:
        if pycf[:-1] not in SKIP_FILES:#略过不需要移动的pyc文件
            reNmPathFile=os.path.join(pycDir,pycf)
            copyPathFile = os.path.join(parentDir, pycf)
            shutil.copyfile(reNmPathFile, copyPathFile)

#删除目录的父目录下renameFiles对应的py文件
def deleParanetPyFile(pycDir,renamedFiles):
    parentDir=os.path.abspath(os.path.dirname(pycDir)+os.path.sep+'.')
    for fname in renamedFiles:
        try:
            if fname[:-1] not in SKIP_FILES:#略过不需要删除的py文件
                os.remove(os.path.join(parentDir, fname[:-1]))
        except Exception as e:
            print(e.args)
    # shutil.rmtree(os.path.join(parentDir,PYCCACHE))#删除__pycache__文件夹



if __name__ == '__main__':
    publishfile()

