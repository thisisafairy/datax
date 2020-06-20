import compileall
import os
# 项目目录
p = os.getcwd()
print("项目目录路径："+str(p))
# 项目上级目录
p_upward = os.path.abspath('..')

sure = input('确认项目目录 y/n: ')
if sure == 'y' or sure == "Y" or sure == "yes":
    print('继续编译...')
else:
    print('退出编译，请确认终端所在目录环境')
    exit()

# 拷贝文件
def copyFiles(sourceDir,  targetDir):
    if sourceDir.find(".svn") > 0:
        return
    for file in os.listdir(sourceDir):
        sourceFile = os.path.join(sourceDir,  file)
        targetFile = os.path.join(targetDir,  file)
        if os.path.isfile(sourceFile):
            if not os.path.exists(targetDir):
                os.makedirs(targetDir)
            if not os.path.exists(targetFile) or(os.path.exists(targetFile) and (os.path.getsize(targetFile) != os.path.getsize(sourceFile))):
                open(targetFile, "wb").write(open(sourceFile, "rb").read())
        if os.path.isdir(sourceFile):
            copyFiles(sourceFile, targetFile)

# 删除文件和目录
def deldir(path):
    for i in os.listdir(path):
        new_path = os.path.join(path,i)
        if os.path.isfile(new_path):
            os.remove(new_path)
        if os.path.isdir(new_path):
            deldir(new_path)
    os.rmdir(path)
    
# 删除不必要的文件
def deldatax(dataxpath):
    dellist = ['.DS_Store', '.localized','.idea','.vscode', 'migrations', '__pycache__']
    for i in os.listdir(dataxpath):
        new_path = os.path.join(dataxpath, i)
        if i in dellist:
            if os.path.isfile(new_path):
                os.remove(new_path)
            if os .path.isdir(new_path):
                deldir(new_path)
        else:
            if os.path.isdir(new_path):
                deldatax(new_path)

# 删除py文件
def delpy(path):
    for i in os.listdir(path):
        new_path = os.path.join(path,i)
        if os.path.isfile(new_path):
            tail = i.split('.')[-1]
            if tail == 'py':
                if i != 'pyc.py':
                    os.remove(new_path)
        if os.path.isdir(new_path):
            delpy(new_path)

# 移动pyc文件 并改名
def renamepyc(path):
    renamepyclist = os.listdir(path)
    for i in renamepyclist:
        renamepyc_path = os.path.join(path,i)
        renamepyc_path_upward = os.path.abspath(os.path.join(renamepyc_path, ".."))
        if os.path.isdir(renamepyc_path):
            if i == '__pycache__':
                for j in os.listdir(renamepyc_path):
                    new_name = j.replace('.cpython-36','')
                    old_path = os.path.join(renamepyc_path,j)
                    new_path = os.path.join(renamepyc_path_upward,new_name)
                    os.rename(old_path,new_path)
            else:
                renamepyc(renamepyc_path)

def delpyc(path):
    for i in os.listdir(path):
        if i == 'pyc.py' or i == 'pyc.pyc':
            pyc_path = os.path.join(path,i)
            os.remove(pyc_path)



# 创建编译文件
print('正在创建编译文件...')
copy_path = os.path.join(p_upward,'datax_compile')
if not os.path.exists(copy_path):
    os.makedirs(copy_path)
    sourceDir = os.path.join(p)
    targetDir = copy_path
    copyFiles(sourceDir,targetDir)
    print('----------编译文件已创建----------')
else:
    print('当前目录下文件名datax_compile已存在,无法创建编译文件...')
    print('----------退出编译----------')
    exit()

# 删除指定文件
deldatax(copy_path)
print('----------隐藏文件/编译文件 删除成功----------')

# 编译文件
compileall.compile_dir(copy_path)

# 删除py文件
delpy(copy_path)

# 将编译好的文件放在对应位置
renamepyc(copy_path)

# 删除pyc.py文件
delpyc(copy_path)
print('\nsuccessful.')




















