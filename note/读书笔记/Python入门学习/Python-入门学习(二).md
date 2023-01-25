---
title: 'Python 入门学习(二)'
date: 2018-11-17 12:34:44
category:
    - 笔记
    - python入门学习
tags:
    - 编程语言
    - python
---

> 跟随廖雪峰的Python教程的学习笔记(一)

<!-- more -->

## 错误, 调试和测试

### 错误处理

python 内置了`try..except...finally`的错误处理机制.

```js
try:
    print('try...')
    r = 10 / int('a')
    print('result:', r)
except ValueError as e:
    print('ValueError:', e)
except ZeroDivisionError as e:
    print('ZeroDivisionError:', e)
else:
    print('no error!')
finally:
    print('finally...')
print('END')
```

错误有很多种类, 如果发生了不同类型的错误, 应该由不同的`expcept`语句块处理, 可以有多个`except`来捕获不同类型的错误.

比如`int()`可能会抛出`ValueError`, 所以我可以用一个`except`捕获`ValueError`, 用另一个`except`捕获`ZeroDivisionError`.

此外, 如果没有错误发生, 可以在`except`语句块后面加一个`else`, 当没有错误发生时, 就会自动执行`else`语句.

Python 的错误其实也是 class, 所有的错误类型都继承自`BaseException`, 所以在使用`except`时注意, 它不但捕获该类型的错误, 还把子类也"一网打尽". 比如下面的代码:

```py
try:
    foo()
except ValueError as e:
    print('ValueError')
except UnicodeError as e:
    print('UnicodeError')
```

第二个`except`永远不会捕捉到`UnicodeErrpr`, 因为`UnicodeErrpr`是`ValueError`的子类.

常见的错误类型和继承关系: https://docs.python.org/3/library/exceptions.html#exception-hierarchy

使用`try...except`捕获错误可以跨越多层调用.


#### 调用栈

如果错误没有被捕获, 就是一直"冒泡", 最后被解释器捕获, 抛出异常.

```py
# err.py:
def foo(s):
    return 10 / int(s)

def bar(s):
    return foo(s) * 2

def main():
    bar('0')

main()
```

执行结果如下:

```py
> python3 err.py
Traceback (most recent call last):
  File "err.py", line 11, in <module>
    main()
  File "err.py", line 9, in main
    bar('0')
  File "err.py", line 6, in bar
    return foo(s) * 2
  File "err.py", line 3, in foo
    return 10 / int(s)
ZeroDivisionError: division by zero
```

#### 记录错误

如果不捕获错误, 自然可以让 python 解释器打印出错误堆栈, 但程序也被结束了. 既然我们能捕获错误, 就可以吧错误堆栈打印出来, 然后分析错误原因. 然后继续执行程序.

python 内置 logging 模块可以非常容易的记录错误信息:

```py
# err_logging.py

import logging

def foo(s):
    return 10 / int(s)

def bar(s):
    return foo(s) * 2

def main():
    try:
        bar('0')
    except Exception as e:
        logging.exception(e)

main()
print('END')
```

同样会报错, 但是程序打印完错误信息会继续执行, 并正常退出:

```py
$ python3 err_logging.py
ERROR:root:division by zero
Traceback (most recent call last):
  File "err_logging.py", line 13, in main
    bar('0')
  File "err_logging.py", line 9, in bar
    return foo(s) * 2
  File "err_logging.py", line 6, in foo
    return 10 / int(s)
ZeroDivisionError: division by zero
END
```

通过配置`loggin`还可以吧错误记录写入日志文件, 方便事后排查

#### 抛出错误

因为错误是 class, 捕获一个错误就是捕获到改 class 的一个实例, 因此, 错误并不是凭空产生的, 而是有意创建抛出的.python 的内置函数会抛出很多类型的错误, 我们自己编写的函数也可以报出错误.

如果要抛出错误, 首先根据需要, 定义一个错误的 class, 选择好继承关系, 然后, 用`raise`语句抛出一个错误的实例:

```py
# err_raise.py
class FooError(ValueError):
    pass

def foo(s):
    n = int(s)
    if n==0:
        raise FooError('invalid value: %s' % s)
    return 10 / n

foo('0')
```

执行, 然后跟踪到我们自己定义的错误:

```py
$ python3 err_raise.py
Traceback (most recent call last):
  File "err_throw.py", line 11, in <module>
    foo('0')
  File "err_throw.py", line 8, in foo
    raise FooError('invalid value: %s' % s)
__main__.FooError: invalid value: 0
```

只有在必要的时候才定义我们自己的错误类型, 如果可以选择 python 已有的内置的错误类型(比如:`ValueError`,`TypeError`), 尽量使用 python 内置的错误类型.

现在我们看看另一种错误处理的方式:

```py
# err_reraise.py

def foo(s):
    n = int(s)
    if n==0:
        raise ValueError('invalid value: %s' % s)
    return 10 / n

def bar():
    try:
        foo('0')
    except ValueError as e:
        print('ValueError!')
        raise

bar()
```

`raise`语句如果不带参数, 就会把当前错误原样抛出, 此外, 在`except`中`raise`一个 Error, 还可以吧一种类型的错误转啊混为另一种类型:

```py
try:
    10 / 0
except ZeroDivisionError:
    raise ValueError('input error!')
```

这样的转换应当符合逻辑.

### 调试

#### 断言

print 可用来简单粗暴的输出调试信息, 但凡是用`print()`辅助查看的地方, 都可以用断言`assert`来代替:

```py
def foo(s):
    n = int(s)
    assert n != 0, 'n is zero!'
    return 10 / n

def main():
    foo('0')
```

`assert`的意思是`n!=0`应该是`True`, 否则, 断言失败, 抛出`AssertionError`:

```py
Traceback (most recent call last):
...
AssertionError: n is zero!
```

启动 python 解释器的时候可以用`-O` 参数来关闭`assert`, 关闭后, 可以把所有的`assert`当成`pass`.

#### logging

把`pint()`替换为`logging`是第三种方式, 它不会抛出错误, 并且可以输出到文件:

```py
import logging
logging.basicConfig(level=logging.INFO)

s = '0'
n = int(s)
logging.info('n = %d' % n)
print(10 / n)
```

`logging`允许指定记录信息的级别: `debug`,`info`,`warning`,`error`等从下到上几个级别, 指定`level=logging.WARNING`以后, `debug`和`info`就不起作用了.

#### pdb

python 的调试器 pdb 可以让程序以单步方式运行, 并随时查看运行状态:

```py
# 启动
python -m pdb err.py

# 查看代码
(Pdb) l
  1     # err.py
  2  -> s = '0'
  3     n = int(s)
  4     print(10 / n)

#单步执行
(Pdb) l

# p 变量名查看变量
(Pdb) p s

# q 退出调试
(Pdb) q
```

##### pdb.set_trace()

`import pdb`之后, 在可能出错的地方放一个`pdb.set_trace()`就可以设置一个断点, 运行代码, 程序会在断点处自动暂停并进入 pdb 环境, 使用`c`继续运行

#### IDE

这就不多说了

### 单元测试

单元测试来自"测试驱动开发"(TDD: Test-Driven Development), 是用来对一个模块, 一个函数或者一个类来进行正确性检验的测试工作.

我们建立了一个`Dice`类, 这个类的行为和`dict`一直, 但是可通过属性来访问, 向下面这样:

```py
>>> d = Dict(a=1, b=2)
>>> d['a']
1
>>> d.a
1
```

代码如下:

```py
class Dict(dict):

    def __init__(self, **kw):
        super().__init__(**kw)

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(r"'Dict' object has no attribute '%s'" % key)

    def __setattr__(self, key, value):
        self[key] = value
```

编写单元测试, 引入`unittest`模块:

```py
import unittest

from mydict import Dict

class TestDict(unittest.TestCase):

    def test_init(self):
        d = Dict(a=1, b='test')
        self.assertEqual(d.a, 1)
        self.assertEqual(d.b, 'test')
        self.assertTrue(isinstance(d, dict))

    def test_key(self):
        d = Dict()
        d['key'] = 'value'
        self.assertEqual(d.key, 'value')

    def test_attr(self):
        d = Dict()
        d.key = 'value'
        self.assertTrue('key' in d)
        self.assertEqual(d['key'], 'value')

    def test_keyerror(self):
        d = Dict()
        with self.assertRaises(KeyError):
            value = d['empty']

    def test_attrerror(self):
        d = Dict()
        with self.assertRaises(AttributeError):
            value = d.empty
```

我们编写测试类需要从`unittest.testCase`继承, 并以`test`开头(不以`test`开头的方法不被认为是测试方法, 测试的时候不会被执行).

对每一类用例提供一个`test_xxx()`方法, 因为`unittest.TestCase`内置了许多条件判断, 我们只需要调用这些方法就能断言输出是否是我们所需要的, 比如`assertEqual`:

```py
self.assertEqual(abs(-1), 1) # 断言函数返回的结果与1相等
```

另一种就是期待抛出指定类型的 Error:

```py
# d['empty']访问不存在的key, 抛出KetError
with self.assertRaises(KeyError):
    value = d['empty']
# d.empty访问不存在的key, 抛出AttributeError
with self.assertRaises(AttributeError):
    value = d.empty
```

#### 运行单元测试

1. 直接加上两行代码, 然后想正常调用一样运行 python 脚本:

```py
if __name__ == '__main__':
    unittest.main()
```

2. 另一种是在命令行通过参数`-m unittest`直接运行单元测试, 这种可以批量运行很多的单元测试:

```py
$ python -m unittest mydict_test
.....
----------------
Ran 5 tests in 0.000s

OK
```

#### setUp 和 tearDown

`setUp()`和`tearDown()`作为两个特殊的方法, 会在每调用一个测试方法的前后分别被执行. 可以用在像启动数据库和关闭数据库等需要特定环境的测试用例中, 并且不必再每个测试方法中重复相同的代码:

```py
class TestDict(unittest.TestCase):

    def setUp(self):
        print('setUp...')

    def tearDown(self):
        print('tearDown...')
```

### 文档测试

我们在编写注释时, 如果下上函数的期望输入和输出, 可以使用`doctest`模块直接提取注释中的代码并执行:

```py
def abs(n):
    '''
    Function to get absolute value of number.

    Example:

    >>> abs(1)
    1
    >>> abs(-1)
    1
    >>> abs(0)
    0
    '''
    return n if n >= 0 else (-n)
```

但是需要严格按照相关的格式. 上一节中的单元测试可以这样写:

```py
'''
Simple dict but also support access as x.y style.

>>> d1 = Dict()
>>> d1['x'] = 100
>>> d1.x
100
>>> d1.y = 200
>>> d1['y']
200
>>> d2 = Dict(a=1, b=2, c='3')
>>> d2.c
'3'
>>> d2['empty']
Traceback (most recent call last):
    ...
KeyError: 'empty'
>>> d2.empty
Traceback (most recent call last):
    ...
AttributeError: 'Dict' object has no attribute 'empty'
'''
```

运行没有报错, 就说明测试正确.

## IO 编程

### 文件读写

#### 读文件

```py
f = open('/Users/michael/test.txt', 'r')
```

标识符`r`表示读, 这样就成功打开了一个文件, 否则就会跑出一个`IOError`错误, 并且给出错误码和详细的信息.

如果文件打开成功, 调用`read()`方法可以依次读取文件的全部内容, 用一个`str`对象表示:

```py
f.read()
# 'Hello, world!'
```

最后是调用`close`关闭文件. 文件对象会占用操作系统的资源, 并且操作系统同一时间能保持打开的文件数量也是有限的.

```py
f.close()
```

由于文件读写时都有可能产生`IOError`，一旦出错，后面的`f.close()`就不会调用。所以，为了保证无论是否出错都能正确地关闭文件，我们可以使用`try ... finally`来实现:

```py
try:
    f = open('/path/to/file', 'r')
    print(f.read())
finally:
    if f:
        f.close()
```

或者使用`with`语句自动调用`close()`方法:

```py
with open('/path/to/file', 'r') as f:
    print(f.read())
```

如果文件小, `read()`一次性读取没问题, 否则需要反复调用`read(size)`, 或者调用`readLine`来读取一行的内容. `readLines`会一次读取所有内容并按行返回`list`(读取配置文件非常合适).

#### file-like Object

像这用有个`read()`方法的对象, 在 python 中统称为`file-like Object`. 除了 file 外, 还可以是内存的字节流, 网络流, 自定义流. 并且`file-like Object`不要求从特定类继承, 只要写个`read()`方法就行了.

比如`StringIO`可以在内存中创建`file-like Object`, 用作临时缓存.

#### 二进制文件

```py
>>> f = open('/Users/michael/test.jpg', 'rb')
>>> f.read()
b'\xff\xd8\xff\xe1\x00\x18Exif\x00\x00...' # 十六进制表示的字节
```

指定编码格式. 并指定错误的编码处理方式:

```py
 f = open('/Users/michael/gbk.txt', 'r', encoding='gbk', errors='ignore')
```

#### 写文件

```py
>>> f = open('/Users/michael/test.txt', 'w')
>>> f.write('Hello, world!')
>>> f.close()
```

`w`表示文本文件. `wb`表示文本文件或写二进制文件.

调用`close`方法才会把数据写入磁盘, 否则可能只写入了一部分. 当然用`with`会更保险一点.

### 内存读写

数据读写当然不一定是文件, 还有内存.

#### `StringIO`

`StringIO`就是在内存中读写`str`, 首先创建一个`StrtingIO`, 然后想文件一样写入:

```py
>>> from io import StringIO
>>> f = StringIO()
>>> f.write('hello')
5
>>> f.write(' ')
1
>>> f.write('world!')
6
>>> print(f.getvalue())
hello world!
```

`getvalue()`用于获得写入后的 str, 要读取`StringIO`, 可以用一个`str`初始化`StringIO`, 然后向文件一样读取:

```py
>>> from io import StringIO
>>> f = StringIO('Hello!\nHi!\nGoodbye!')
>>> while True:
...     s = f.readline()
...     if s == '':
...         break
...     print(s.strip())
...
Hello!
Hi!
Goodbye!
```

#### `BytesIO`

对应`str`, 二进制数据的操作, 就要使用`BytesIO`:

```py
>>> from io import BytesIO
>>> f = BytesIO()
>>> f.write('中文'.encode('utf-8'))
6
>>> print(f.getvalue())
b'\xe4\xb8\xad\xe6\x96\x87'
```

这里我们写入的不是`str`, 而是经过 UTF-8 编码的 bytes.

同样,可以用一个 bytes 初始化`BytesIO`, 然后像文件一样操作.

### 文件操作和目录

python 内置的`os`模块提供了调用操作系统的接口函数.

```py
import os
os.name #'posix，说明系统是Linux、Unix或Mac OS X，如果是nt，就是Windows'
```

os 的某些操作函数跟操作系统是相关的.

`os.uname`可以获取系统的详细信息, 但是 windows 上面没有.

`os.environ`保存了操作系统的环境变量. 通过`os.environ.get('key')`可以获取某个环境变量的值.

#### 操作文件和目录

```py
# 查看当前目录的绝对路径:
>>> os.path.abspath('.')
'/Users/michael'
# 在某个目录下创建一个新目录，首先把新目录的完整路径表示出来:
>>> os.path.join('/Users/michael', 'testdir')
'/Users/michael/testdir'
# 然后创建一个目录:
>>> os.mkdir('/Users/michael/testdir')
# 删掉一个目录:
>>> os.rmdir('/Users/michael/testdir')
```

处理路径的时候不要直接处理字符串, 而是通过函数`os.path.join()`, 这样可以正确处理不同操作系统的路径分隔符.

同样的, 拆分路径通过`os.path.split()`:

```py
>>> os.path.split('/Users/michael/testdir/file.txt')
('/Users/michael/testdir', 'file.txt')
```

后一部分总是最后级别的目录或文件名:

```py
>>> os.path.split('/Users/michael/testdir/file.txt')
('/Users/michael/testdir', 'file.txt')
```

`os.path.splitext()`可以直接得到文件扩展名, 很多时候非常方便.

```py
>>> os.path.splitext('/path/to/file.txt')
('/path/to/file', '.txt')
```

这些操作只是涉及字符串操作, 不会受系统中是否曾在真实文件的影响. 下面这些则相反:

```py
# 对文件重命名:
>>> os.rename('test.txt', 'test.py')
# 删掉文件:
>>> os.remove('test.py')
```

不过, 复制文件的函数在`os`模块中不存在. 因为这不是由操作系统提供的系统调用. 除了使用文件读写完成文件复制的方法外, 我们可以使用`shutil`模块中的`copyfile`函数, `shutil`模块有许多实用的函数, 可以看做`os`模块的补充.

体会两个例子:

```py
# 列出当前目录下的所有目录
>>> [x for x in os.listdir('.') if os.path.isdir(x)]
['.lein', '.local', '.m2', '.npm', '.ssh', '.Trash', '.vim', 'Applications', 'Desktop', ...]

# 列出所有的.py文件
>>> [x for x in os.listdir('.') if os.path.isfile(x) and os.path.splitext(x)[1]=='.py']
['apis.py', 'config.py', 'models.py', 'pymonitor.py', 'test_db.py', 'urls.py', 'wsgiapp.py']
```

### 序列化

把变量从内存中编程可存储或传输的过程称之为序列化, 在 python 中教 picking, 在其他语言中可能叫 serialization, marshalling, flattening 等.

反序列化, 就是 unpicking, 就是把序列化的对象重新读到内存里.

先来试试序列化:

```py
>>> import pickle
>>> d = dict(name='Bob', age=20, score=88)
>>> pickle.dumps(d)
b'\x80\x03}q\x00(X\x03\x00\x00\x00ageq\x01K\x14X\x05\x00\x00\x00scoreq\x02KXX\x04\x00\x00\x00nameq\x03X\x03\x00\x00\x00Bobq\x04u.'
```

序列化的结果就可以写入文件了, 或者使用`pickle.dump()`直接把对象序列化写入一个 file-like Object:

```py
f = open('dump.txt', 'wb')
pickle.dump(d, f)
f.close()
```

反序列化如下:

```py
>>> f = open('dump.txt', 'rb')
>>> d = pickle.load(f)
>>> f.close()
>>> d
{'age': 20, 'score': 88, 'name': 'Bob'}
```

#### JOSN

python 可以序列化成 json 数据:

```py
import json
d = dict(name='Bob', age=20, score=88)
json.dumps(d)
# '{"age": 20, "score": 88, "name": "Bob"}'
```

或者反序列化:

```py
json_str = '{"age": 20, "score": 88, "name": "Bob"}'
json.loads(json_str)
# {'age': 20, 'score': 88, 'name': 'Bob'}
```

OBJ 转 JSON:

```py
def student2dict(std):
    return {
        'name': std.name,
        'age': std.age,
        'score': std.score
    }
json.dumps(s, default=student2dict)
# {"age": 20, "name": "Bob", "score": 88}

# 或者
json.dumps(s, default=lambda obj: obj.__dict__)
```

JSON 转 OBJ:

```py
def dict2student(d):
    return Student(d['name'], d['age'], d['score'])
json_str = '{"age": 20, "score": 88, "name": "Bob"}'
json.loads(json_str, object_hook=dict2student)
# <__main__.Student object at 0x10cd3c190>
```

## 进程和线程

### 多进程

`multiprocessing`是一个跨平台的多进程模块. 它提供了一个`Process`类来代表一个进程对象:

```py
from multiprocessing import Process
import os

# 子进程要执行的代码
def run_proc(name):
    print('Run child process %s (%s)...' % (name, os.getpid()))

if __name__=='__main__':
    print('Parent process %s.' % os.getpid())
    p = Process(target=run_proc, args=('test',))
    print('Child process will start.')
    p.start()
    p.join()
    print('Child process end.')
```

执行结果:

```py
Parent process 928.
Process will start.
Run child process test (929)...
Process end.
```

创建子进程时,只需要传入一个执行函数和函数的参数, 创建一个`Process`实例, 用`start()`启动, `join()`等待紫禁城结束再继续往下运行, 通常用于进程间的同步.

#### Pool

如果要启动大量的子进程, 可以使用 pool 进程池:

```py
from multiprocessing import Pool
import os, time, random

def long_time_task(name):
    print('Run task %s (%s)...' % (name, os.getpid()))
    start = time.time()
    time.sleep(random.random() * 3)
    end = time.time()
    print('Task %s runs %0.2f seconds.' % (name, (end - start)))

if __name__=='__main__':
    print('Parent process %s.' % os.getpid())
    p = Pool(4)
    for i in range(5):
        p.apply_async(long_time_task, args=(i,))
    print('Waiting for all subprocesses done...')
    p.close()
    p.join()
    print('All subprocesses done.')
```

对`Pool`对象调用`join()`会等待所有子进程执行完毕, 调用`join`之前必须先调用`close()`, 调用`close()`之后就不能继续添加新的`Porcess`了.

注意: task0~3 是立即执行的, 而 task4 要等待前面某个 task 完成后才执行, 这是因为`Pool`默认大小在这里是 4,默认大小是你的 CPU 数:

```py
p = Pool(5)
```

#### 子进程

很多时候, 子进程可能是一个外部进程, 我们创建了子进程后, 还需要控制子进程的输入和输出.

`subprocess`模块可以让我们方便的启动一个子进程, 并且控制输入和输出.

```py
import subprocess

print('$ nslookup www.python.org')
r = subprocess.call(['nslookup', 'www.python.org'])
print('Exit code:', r)
```

如果子进程还需要输入, 可以通过`communicate()`方法输入:

```py
import subprocess

print('$ nslookup')
p = subprocess.Popen(['nslookup'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
output, err = p.communicate(b'set q=mx\npython.org\nexit\n')
print(output.decode('utf-8'))
print('Exit code:', p.returncode)
```

这个代码相当于在命令行执行:

```
set q=mx
python.org
exit
```

#### 进程间通信

python 的`multiprocessing`模块包装了底层的机制, 提供了`Queue`, `Pipes`等多种方式来交换数据. 以`Queue`为例, 在父进程中创建两个子进程, 一个往`Queue`里面写数据, 一个从`Queue`里面读数据:

```py
from multiprocessing import Process, Queue
import os, time, random

# 写数据进程执行的代码:
def write(q):
    print('Process to write: %s' % os.getpid())
    for value in ['A', 'B', 'C']:
        print('Put %s to queue...' % value)
        q.put(value)
        time.sleep(random.random())

# 读数据进程执行的代码:
def read(q):
    print('Process to read: %s' % os.getpid())
    while True:
        value = q.get(True)
        print('Get %s from queue.' % value)

if __name__=='__main__':
    # 父进程创建Queue，并传给各个子进程：
    q = Queue()
    pw = Process(target=write, args=(q,))
    pr = Process(target=read, args=(q,))
    # 启动子进程pw，写入:
    pw.start()
    # 启动子进程pr，读取:
    pr.start()
    # 等待pw结束:
    pw.join()
    # pr进程里是死循环，无法等待其结束，只能强行终止:
    pr.terminate()
```

### 多线程

python 的线程是真正的 Posix Thread 而不是模拟出来的线程.

python 的标准库提供了两个模块: `_thread`和`threading`, `_thread`是低级模块,`threading`是高级模块, 对前者进行了封装, 所以多数情况下, 我们只需要使用`threading`就行了.

启动一个线程就是把一个函数传入并创建`Thread`实例, 然后调用`start()`开始执行:

```py
import time, threading

# 新线程执行的代码:
def loop():
    print('thread %s is running...' % threading.current_thread().name)
    n = 0
    while n < 5:
        n = n + 1
        print('thread %s >>> %s' % (threading.current_thread().name, n))
        time.sleep(1)
    print('thread %s ended.' % threading.current_thread().name)

print('thread %s is running...' % threading.current_thread().name)
t = threading.Thread(target=loop, name='LoopThread')
t.start()
t.join()
print('thread %s ended.' % threading.current_thread().name)
```

执行输出:

```py
thread MainThread is running...
thread LoopThread is running...
thread LoopThread >>> 1
thread LoopThread >>> 2
thread LoopThread >>> 3
thread LoopThread >>> 4
thread LoopThread >>> 5
thread LoopThread ended.
thread MainThread ended.
```

由于任何进程默认会启动一个线程, 我们把该线程称为主线程, 主线程又可以启动新的线程, `threading`模块中的`current_thread()`函数永远返回当前线程的实例. 主线程实例的名字叫`MainThread`, 子线程的名字在创建时指定, 我们用`LoopThread`命名子线程. 名字除了在打印的时候显示, 没有其他意义. 不指定也会自动命名`Thread-1`...

#### Lock

多线程与多进程最大的不同在于, 多进程不共享变量, 而多线程共享. 因此要引入 Lock. 一个 Lock 只能被一个线程持有, 持有时, 其他线程必须等待.

```py
balance = 0
# 创建一个锁
lock = threading.Lock()

def run_thread(n):
    for i in range(100000):
        # 先要获取锁:
        lock.acquire()
        try:
            # 放心地改吧:
            change_it(n)
        finally:
            # 改完了一定要释放锁:
            lock.release()
```

多个线程同时执行`lock.acquire()`的时候, 只有一个线程能成功获得锁, 然后继续执行代码, 其他线程就一直等待知道获得锁为止.

锁的作用在于确保某段代码只能由一个线程从头到尾完整的执行, 确定在于效率和造成死锁, 导致线程挂起.

### ThreadLocal

在多线程环境下, 每个线程都有自己的数据. 一个线程使用自己的局部变量比使用全局变量好, 因为局部变量只有线程自己能看到, 而修改全局变量就要加锁.

但是函数传递的时候无法访问到上一层的作用域, 就需要一层层的传参.

`ThreadLocal`可以创建一个全局的`dict`, 然后以`thread`自身作为`key`获得线程对应的参数对象.

```py
import threading

# 创建全局ThreadLocal对象:
local_school = threading.local()

def process_student():
    # 获取当前线程关联的student:
    std = local_school.student
    print('Hello, %s (in %s)' % (std, threading.current_thread().name))

def process_thread(name):
    # 绑定ThreadLocal的student:
    local_school.student = name
    process_student()

t1 = threading.Thread(target= process_thread, args=('Alice',), name='Thread-A')
t2 = threading.Thread(target= process_thread, args=('Bob',), name='Thread-B')
t1.start()
t2.start()
t1.join()
t2.join()
```

每个线程都可以读写`local_school`的`student`属性,但互不影响.

`ThreadLocal`最常用的地方就是为每个线程绑定一个数据库连接, HTTP 请求, 用户身份信息等, 这样一个线程的所有调用到的处理函数都可以随意访问这些资源.

### 分布式进程

python 的`multiprocessing`模块不但支持多进程, 其中`managers`子模块还支持吧多进程分布到多台机器上. 我们可以很简单的调用 API 而不用了解网络通信的细节.

下面举个例子:

如果我们已经有一个通过`Queue`通信的多进程程序在同一台机器上运行. 现在我们希望把发送任务的进程和处理人物的进程分布到两台机子上. 我们可以通过`managers`模块把`Queue`通过网络暴露出去, 就可以让其他机器的进程访问`Queue`了.

```py
# task_master.py

import random, time, queue
from multiprocessing.managers import BaseManager

# 发送任务的队列:
task_queue = queue.Queue()
# 接收结果的队列:
result_queue = queue.Queue()

# 从BaseManager继承的QueueManager:
class QueueManager(BaseManager):
    pass

# 把两个Queue都注册到网络上, callable参数关联了Queue对象:
QueueManager.register('get_task_queue', callable=lambda: task_queue)
QueueManager.register('get_result_queue', callable=lambda: result_queue)
# 绑定端口5000, 设置验证码'abc':
manager = QueueManager(address=('', 5000), authkey=b'abc')
# 启动Queue:
manager.start()
# 获得通过网络访问的Queue对象:
task = manager.get_task_queue()
result = manager.get_result_queue()
# 放几个任务进去:
for i in range(10):
    n = random.randint(0, 10000)
    print('Put task %d...' % n)
    task.put(n)
# 从result队列读取结果:
print('Try get results...')
for i in range(10):
    r = result.get(timeout=10)
    print('Result: %s' % r)
# 关闭:
manager.shutdown()
print('master exit.')
```

在分布式多进程环境下, 添加任务到`Queue`不可以直接对原始`task_queue`进行操作, 那样就绕过了`QueueManager`的封装, 必须通过`manager.get_task_queue()`获得`Queue`接口添加.

然后再另一台机器上启动任务进程(本机也可以):

```py
# task_worker.py

import time, sys, queue
from multiprocessing.managers import BaseManager

# 创建类似的QueueManager:
class QueueManager(BaseManager):
    pass

# 由于这个QueueManager只从网络上获取Queue，所以注册时只提供名字:
QueueManager.register('get_task_queue')
QueueManager.register('get_result_queue')

# 连接到服务器，也就是运行task_master.py的机器:
server_addr = '127.0.0.1'
print('Connect to server %s...' % server_addr)
# 端口和验证码注意保持与task_master.py设置的完全一致:
m = QueueManager(address=(server_addr, 5000), authkey=b'abc')
# 从网络连接:
m.connect()
# 获取Queue的对象:
task = m.get_task_queue()
result = m.get_result_queue()
# 从task队列取任务,并把结果写入result队列:
for i in range(10):
    try:
        n = task.get(timeout=1)
        print('run task %d * %d...' % (n, n))
        r = '%d * %d = %d' % (n, n, n*n)
        time.sleep(1)
        result.put(r)
    except Queue.Empty:
        print('task queue is empty.')
# 处理结束:
print('worker exit.')
```

## 常用内建模块

### re

python 提供`re`模块, 包含所有正则表达式的功能. 注意由于 python 本身也用`\`转义, 所以要特别注意:

```p
s = 'ABC\\-001' # Python的字符串
# 对应的正则表达式字符串变成：
# 'ABC\-001'

# 使用`r`前缀就能解决这个问题了

s = r'ABC\-001' # Python的字符串
# 对应的正则表达式字符串不变：
# 'ABC\-001'
```

`match`方法判断是否匹配成功, 成功返回`Match`对象, 否则返回 None.

```py
test = '用户输入的字符串'
if re.match(r'正则表达式', test):
    print('ok')
else:
    print('failed')
```

### datetime

#### 获取当前日期和时间

```py
now = datetime.now() # 获取当前datetime
# 2015-05-18 16:28:07.198690
```

#### 获取指定日期和时间

```py
dt = datetime(2015, 4, 19, 12, 20) # 用指定日期时间创建datetime
# 2015-04-19 12:20:00
```

#### datetime 转换为 timestamp

```py
dt = datetime(2015, 4, 19, 12, 20)
dt.timestamp()
# 1429417200.0 小数为毫秒, 个位为秒

# 逆过程
t = 1429417200.0
datetime.fromtimestamp(t)#本地时间
# 2015-04-19 12:20:00
print(datetime.utcfromtimestamp(t)) # UTC时间
# 2015-04-19 04:20:00
```

#### str 转 datetime

```py
cday = datetime.strptime('2015-6-1 18:19:59', '%Y-%m-%d %H:%M:%S')
# 2015-06-01 18:19:59

# 逆过程
now = datetime.now()
print(now.strftime('%a, %b %d %H:%M'))
# Mon, May 05 16:28
```

#### 加减运算

需要导入`timelta`这个类:

```py
from datetime import datetime, timedelta
now = datetime.now()
now
# datetime.datetime(2015, 5, 18, 16, 57, 3, 540997)
now + timedelta(hours=10)
# datetime.datetime(2015, 5, 19, 2, 57, 3, 540997)
now - timedelta(days=1)
# datetime.datetime(2015, 5, 17, 16, 57, 3, 540997)
now + timedelta(days=2, hours=12)
# datetime.datetime(2015, 5, 21, 4, 57, 3, 540997)
```

### collections

collection 是 python 内建的一个集合模块, 提供了许多有用的集合类

#### namedtuple

`nametuple`是一个函数, 用来创建一个自定义的`tuple`对象, 并且规定了`tuple`元素的个数, 并可以用属性而不是索引来应用`tuple`某个元素.

```py
>>> from collections import namedtuple
>>> Point = namedtuple('Point', ['x', 'y'])
>>> p = Point(1, 2)
>>> p.x
1
>>> p.y
2
```

它具备 tuple 的不变形, 而可以根据属性来引用.

#### deque

deque 是为了高效实现插入和删除操作的双向列表, 适用于队列和栈:

```py
>>> from collections import deque
>>> q = deque(['a', 'b', 'c'])
>>> q.append('x')
>>> q.pop('x')
>>> q.appendleft('y')
>>> q.popleft('x')
>>> q
deque(['a', 'b', 'c'])
```

#### defaultdict

```py
>>> from collections import defaultdict
>>> dd = defaultdict(lambda: 'N/A')
>>> dd['key1'] = 'abc'
>>> dd['key1'] # key1存在
'abc'
>>> dd['key2'] # key2不存在，返回默认值
'N/A'
```

#### OrderedDict

保持 Key 的顺序, 可以使用`Orderdict`:

```py
>>> from collections import OrderedDict
>>> d = dict([('a', 1), ('b', 2), ('c', 3)])
>>> d # dict的Key是无序的
{'a': 1, 'c': 3, 'b': 2}
>>> od = OrderedDict([('a', 1), ('b', 2), ('c', 3)])
>>> od # OrderedDict的Key是有序的
OrderedDict([('a', 1), ('b', 2), ('c', 3)])
```

注意，OrderedDict 的 Key 会按照插入的顺序排列，不是 Key 本身排序

#### ChainMap

ChainMap 可以把一组 dict 串起来并组成一个逻辑上的 dict. `ChainMap`本身也是一个 dict, 但是查找的时候, 会按照顺序在内部的 dict 依次查找.

举个例子, 应用程序需要传入命令行参数的时候, 可以通过环境变量传入, 还可以有默认参数. 我们可以用`ChainMap`实现参数的优先级查找, 即先查命令行参数, 如果没有传入, 再查环境变量, 如果没有, 就是用默认参数:

```py
from collections import ChainMap
import os, argparse

# 构造缺省参数:
defaults = {
    'color': 'red',
    'user': 'guest'
}

# 构造命令行参数:
parser = argparse.ArgumentParser()
parser.add_argument('-u', '--user')
parser.add_argument('-c', '--color')
namespace = parser.parse_args()
command_line_args = { k: v for k, v in vars(namespace).items() if v }

# 组合成ChainMap:
combined = ChainMap(command_line_args, os.environ, defaults)

# 打印参数:
print('color=%s' % combined['color'])
print('user=%s' % combined['user'])
```

没有任何参数, 打印默认参数:

```cmd
$ python3 use_chainmap.py
color=red
user=guest
```

传入命令行参数:

```
$ python3 use_chainmap.py -u bob
color=red
user=bob
```

同时传入命令行参数和环境变量:

```
$ user=admin color=green python3 use_chainmap.py -u bob
color=green
user=bob
```

#### Count

`Count`是一个简单的计数器:

```py
from collections import Counter
c = Counter()
for ch in 'programming':
    c[ch] = c[ch] + 1
c
# >>>　Counter({'g': 2, 'm': 2, 'r': 2, 'a': 1, 'i': 1, 'o': 1, 'n': 1, 'p': 1})
```

####　 Base64

Base64 是一种用 64 个字符表示任意二进制数据的方法. Base64 的原理很简单, 首先, 准备一个包含 64 个字符的数组:

```py
['A', 'B', 'C', ... 'a', 'b', 'c', ... '0', '1', ... '+', '/']
```

然后对二进制数据进行处理, 每三个字节一组, 一共是`3x8=24`bit, 划分为 4 组, 每组 6bit. 得到四个数组作为索引, 然后查表, 获得相应的 4 个字符, 就是编码后的字符串.

Base64 编码会把 3 字节的二进制数据编码为 4 字节的文本数据, 长度增加 33%, 但是编码后的文本数据可以在邮件正文, 网页等直接显示.

如果要编码的二进制数据不是 3 的倍数, 最后会剩下 1 或 2 个字节, Base64 用`\x00`在末尾不足, 再在编码的尾部加上 1 或者 2 个=号, 表示补了多少字节, 解码的时候会自动去掉.

python 内置`base64`可以直接进行 base64 的编解码:

```py
import base64
base64.b64encode(b'binary\x00string')
# b'YmluYXJ5AHN0cmluZw=='
base64.b64decode(b'YmluYXJ5AHN0cmluZw==')
# b'binary\x00string'
```

由于标准的 base64 编码中有'+'和'/', 在 URL 中不能直接作为参数, 所以有下面的方法, 把'+'和'/'分别编程'-'和'\_':

```py
base64.b64encode(b'i\xb7\x1d\xfb\xef\xff')
# b'abcd++//'
base64.urlsafe_b64encode(b'i\xb7\x1d\xfb\xef\xff')
# b'abcd--__'
base64.urlsafe_b64decode('abcd--__')
# b'i\xb7\x1d\xfb\xef\xff'
```

base64 是一种查表的编码方法, 不能用于加密, 适用于小段内容的编码(数字证书,Cookie 等)

### struct

python 提供了一个`struct`模块来解决`bytes`和其他二进制数据类型的转换.

`struct`的`pack`把任意数据变成`bytes`:

```py
import struct
struct.pack('>I', 10240099)
# b'\x00\x9c@c'
```

第一个参数是处理指令, `'>I'`中,`>`表示字节顺序是 big-endian, 也就是网络序, `I`表示 4 字节无符号整数.

后面的参数个数要和处理指令一致.

`unpack`把`bytes`变成相应的数据类型:

```py
struct.unpack('>IH', b'\xf0\xf0\xf0\xf0\x80\x80')
# (4042322160, 32896)
```

根据>IH 的说明，后面的 bytes 依次变为 I：4 字节无符号整数和 H：2 字节无符号整数。

### hashlib

`hashlib`提供了常见的摘要算法, 如 MD5,SHA1 等.

### hmac

为了防止入侵者通过彩虹表根据哈希值反推原始口令, 在计算哈希的时候, 不能仅针对原始输入计算, 需要增加一个 salt 来是的相同的输入也能得到不同的哈希.

python 的`hmac`模块实现了标准的 Hmac 算法, 我们来看看如何使用`hmax`实现带 key 的 hash:

```py
>>> import hmac
>>> message = b'Hello, world!'
>>> key = b'secret'
>>> h = hmac.new(key, message, digestmod='MD5')
>>> # 如果消息很长，可以多次调用h.update(msg)
>>> h.hexdigest()
'fa4ee7d173f2d97ee79022d1a7355bcf'
```

### itertools

python 内建`itertools`模块提供了用于操作迭代对象的函数.

几个无限迭代器:

```py
import itertools

# 无限迭代器
natuals = itertools.count(1)
for n in natuals:
    print(n)
# >>> 1 2 3 ...

# 无限循环迭代
cs = itertools.cycle('ABC') # 注意字符串也是序列的一种
for c in cs:
    print(c)
# >>> A B C A B C ...

# 无限重复迭代
ns = itertools.repeat('A', 3)
# >>> A A A
```

无限序列虽然可以无限迭代, 但是通常我们会通过`takewhile()`等函数根据条件判断来截取出一个有限的序列:

```py
natuals = itertools.count(1)
ns = itertools.takewhile(lambda x: x <= 10, natuals)
list(ns)
# [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

`chain()`可以把一组迭代对象串联起来，形成一个更大的迭代器:

```py
for c in itertools.chain('ABC', 'XYZ'):
    print(c)
# 迭代效果：'A' 'B' 'C' 'X' 'Y' 'Z'
```

`groupby()`把迭代器中相邻的重复元素挑出来放在一起:

```py
for key, group in itertools.groupby('AAABBBCCAAA'):
    print(key, list(group))
# A ['A', 'A', 'A']
# B ['B', 'B', 'B']
# C ['C', 'C']
# A ['A', 'A', 'A']

# 忽略大小写
for key, group in itertools.groupby('AaaBBbcCAAa', lambda c: c.upper()):
    print(key, list(group))
# A ['A', 'a', 'a']
# B ['B', 'B', 'b']
# C ['c', 'C']
# A ['A', 'A', 'a']
```

### contextlib

还记得文件读写, 需要正确关闭文件. 我们用`with`来自动的关闭使用资源:

```py
with open('/path/to/file', 'r') as f:
    f.read()
```

并不是文件中才能使用`with`, 实际上, 任何对象,只要正确实现了上下文管理, 都可以用于`with`语句.

实现上下文管理通过`__enter`和`__exit__`来实现:

```py
class Query(object):

    def __init__(self, name):
        self.name = name

    def __enter__(self):
        print('Begin')
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type:
            print('Error')
        else:
            print('End')

    def query(self):
        print('Query info about %s...' % self.name)
```

这样, 我们就可以把自己写的资源对象用于`with`语句:

```py
with Query('Bob') as q:
    q.query()
```

#### @contextmanager

编写`__enter__`和`__exit__`仍然很繁琐, 所以 python 提供了更简单的写法:

```py
from contextlib import contextmanager

class Query(object):

    def __init__(self, name):
        self.name = name

    def query(self):
        print('Query info about %s...' % self.name)

@contextmanager
def create_query(name):
    print('Begin')
    q = Query(name)
    yield q
    print('End')
```

`@contextmanager`接受一个 generator, 用`yield`语句把`with ... as var`把变量输出, 然后,`with`就可以正常的工作了:

```py
with create_query('Bob') as q:
    q.query()
```

或者我们希望在某段代码执行前后自动执行特定代码, 也可以用这个来实现.

#### @closing

如果一个对象没有实现上下文, 我们就不能将它用于`with`语句. 这是, 可以用`closing`把该对象变为上下文对象:

```py
from contextlib import closing
from urllib.request import urlopen

with closing(urlopen('https://www.python.org')) as page:
    for line in page:
        print(line)
```

`closing`也是一个经过`@contextmanager`装饰的 generator, 这个`generator`编写起来非常简单:

```py
@contextmanager
def closing(thing):
    try:
        yield thing
    finally:
        thing.close()
```

它的作用就是把任意对象变为上下文对象，并支持 with 语句。

@contextlib 还有一些其他 decorator，便于我们编写更简洁的代码。

### urllib

urllib 提供了一系列用于操作 URL 功能.

#### Get

urllib 的`request`模板可以非常方便的抓取 URL 内容, 也就是发送一个 GET 请求到指定的页面, 然后返回 HTTP 的相应:

```py
from urllib import request

with request.urlopen('https://api.douban.com/v2/book/2129650') as f:
    data = f.read()
    print('Status:', f.status, f.reason)
    for k, v in f.getheaders():
        print('%s: %s' % (k, v))
    print('Data:', data.decode('utf-8'))
```

可以得到 HTTP 响应的头和 JSON 数据:

```py
Status: 200 OK
Server: nginx
Date: Tue, 26 May 2015 10:02:27 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 2049
Connection: close
Expires: Sun, 1 Jan 2006 01:00:00 GMT
Pragma: no-cache
Cache-Control: must-revalidate, no-cache, private
X-DAE-Node: pidl1
Data: {"rating":{"max":10,"numRaters":16,"average":"7.4","min":0},"subtitle":"","author":["廖雪峰编著"],"pubdate":"2007-6",...}
```

如果我们要想摸你浏览器发送 GET 请求, 就需要使用`Request`对象, 通过往`Request`对象添加 HTTP 头, 我们就可以把请求伪装成浏览器.

```py
from urllib import request

req = request.Request('http://www.douban.com/')
req.add_header('User-Agent', 'Mozilla/6.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/8.0 Mobile/10A5376e Safari/8536.25')
with request.urlopen(req) as f:
    print('Status:', f.status, f.reason)
    for k, v in f.getheaders():
        print('%s: %s' % (k, v))
    print('Data:', f.read().decode('utf-8'))
```

#### POST

如果想要摸你 POST, 只需要把参数`data`以`bytes`形式传入.

我们摸你一个微博登录, 先读取登录的邮箱和口令, 然后按照 weibo.cn 的登录页的格式, 以`username=xxx&password=xxx`的编码传入:

```py
from urllib import request, parse

print('Login to weibo.cn...')
email = input('Email: ')
passwd = input('Password: ')
login_data = parse.urlencode([
    ('username', email),
    ('password', passwd),
    ('entry', 'mweibo'),
    ('client_id', ''),
    ('savestate', '1'),
    ('ec', ''),
    ('pagerefer', 'https://passport.weibo.cn/signin/welcome?entry=mweibo&r=http%3A%2F%2Fm.weibo.cn%2F')
])

req = request.Request('https://passport.weibo.cn/sso/login')
req.add_header('Origin', 'https://passport.weibo.cn')
req.add_header('User-Agent', 'Mozilla/6.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/8.0 Mobile/10A5376e Safari/8536.25')
req.add_header('Referer', 'https://passport.weibo.cn/signin/login?entry=mweibo&res=wel&wm=3349&r=http%3A%2F%2Fm.weibo.cn%2F')

with request.urlopen(req, data=login_data.encode('utf-8')) as f:
    print('Status:', f.status, f.reason)
    for k, v in f.getheaders():
        print('%s: %s' % (k, v))
    print('Data:', f.read().decode('utf-8'))
```

#### Handle

如果还要更复杂的控制, 比如通过一个 Proxy 去访问网站, 我们需要利用`ProxyHandler`来处理, 示例代码如下:

```py
proxy_handler = urllib.request.ProxyHandler({'http': 'http://www.example.com:3128/'})
proxy_auth_handler = urllib.request.ProxyBasicAuthHandler()
proxy_auth_handler.add_password('realm', 'host', 'username', 'password')
opener = urllib.request.build_opener(proxy_handler, proxy_auth_handler)
with opener.open('http://www.example.com/login.html') as f:
    pass
```

### XML

#### DOM & SAX

XML 比 JSON 复杂, 操作 XML 有两种方法: DOM 和 SAX. DOM 会把整个 XML 读入内存, 因此占用内存大, 解析慢, 有点是可以任意便利树的节点. SAX 是流模式, 边读边解析, 占用内存小, 解析快, 缺点是我们需要自己处理事件.

正常情况下, 优点考虑 SAX, 因为 DOM 是在太占内存.

在 Python 中使用 SAX 解析非常解析, 通常我们关心的是`start_element`,`end_element`和`char_data`, 准备好这 3 个函数, 然后就可以解析 xml 了.

举个例子, 当 SAX 解析器读到一个节点时:

```py
<a href="/">python</a>
```

会产生 3 个事件:

1. start_element 事件，在读取`<a href="/">`时;
2. char_data 事件，在读取`python`时;
3. end_element 事件，在读取`</a>`时.

### HTMLParser

HTMLParser 非常方便解析 HTML, 只需要几行代码:

```py
from html.parser import HTMLParser
from html.entities import name2codepoint

class MyHTMLParser(HTMLParser):

    def handle_starttag(self, tag, attrs):
        print('<%s>' % tag)

    def handle_endtag(self, tag):
        print('</%s>' % tag)

    def handle_startendtag(self, tag, attrs):
        print('<%s/>' % tag)

    def handle_data(self, data):
        print(data)

    def handle_comment(self, data):
        print('<!--', data, '-->')

    def handle_entityref(self, name):
        print('&%s;' % name)

    def handle_charref(self, name):
        print('&#%s;' % name)

parser = MyHTMLParser()
parser.feed('''<html>
<head></head>
<body>
<!-- test html parser -->
    <p>Some <a href=\"#\">html</a> HTML&nbsp;tutorial...<br>END</p>
</body></html>''')
```

`feed()`方法可以多次调用，也就是不一定一次把整个 HTML 字符串都塞进去，可以一部分一部分塞进去。

特殊字符有两种，一种是英文表示的`&nbsp;`，一种是数字表示的`&#1234;`，这两种字符都可以通过 Parser 解析出来。

## 常用第三方模块

基本上所有的模块都可以用 pip 安装.

### Pillow

PIL：Python Imaging Library, 已经是 python 平台事实上的图像处理标准哭了. 志愿者吗在 PIL 的基础上为 python3.x 创建了兼容版本 Pillow, 并加入了许多新的特性.

#### 操作图像

最常见的比如图像缩放:

```py
from PIL import Image

# 打开一个jpg图像文件，注意是当前路径:
im = Image.open('test.jpg')
# 获得图像尺寸:
w, h = im.size
print('Original image size: %sx%s' % (w, h))
# 缩放到50%:
im.thumbnail((w//2, h//2))
print('Resize image to: %sx%s' % (w//2, h//2))
# 把缩放后的图像用jpeg格式保存:
im.save('thumbnail.jpg', 'jpeg')
```

其他还有切片, 旋转, 滤镜, 文字, 调色板, 模糊. 以及一系列的绘图方法, 比如生成字母验证码图片:

```py
from PIL import Image, ImageDraw, ImageFont, ImageFilter

import random

# 随机字母:
def rndChar():
    return chr(random.randint(65, 90))

# 随机颜色1:
def rndColor():
    return (random.randint(64, 255), random.randint(64, 255), random.randint(64, 255))

# 随机颜色2:
def rndColor2():
    return (random.randint(32, 127), random.randint(32, 127), random.randint(32, 127))

# 240 x 60:
width = 60 * 4
height = 60
image = Image.new('RGB', (width, height), (255, 255, 255))
# 创建Font对象:
font = ImageFont.truetype('Arial.ttf', 36)
# 创建Draw对象:
draw = ImageDraw.Draw(image)
# 填充每个像素:
for x in range(width):
    for y in range(height):
        draw.point((x, y), fill=rndColor())
# 输出文字:
for t in range(4):
    draw.text((60 * t + 10, 10), rndChar(), font=font, fill=rndColor2())
# 模糊:
image = image.filter(ImageFilter.BLUR)
image.save('code.jpg', 'jpeg')
```

### requests

`requests`是比 urllib 更好用的处理 URL 资源特别方便.

```py
import requests
r = requests.get('https://www.douban.com/') # 豆瓣首页
r.status_code
# 200
r.text
# '<!DOCTYPE HTML>\n<html>\n<head>\n<meta name="description" content="提供图书、电影、音乐唱片的推荐、评论和...'
```

对于带参数的 URL，传入一个`dict`作为`params`参数:

```py
r = requests.get('https://www.douban.com/search', params={'q': 'python', 'cat': '1001'})
r.url # 实际请求的URL
# 'https://www.douban.com/search?q=python&cat=1001'
```

request 自动检测编码, 可以使用`encoding`属性查看:

```py
r.encoding
# 'utf-8'
```

无论响应式文本还是二进制内容, 我们都可以用`content`属性获得`bytes`对象:

```py
r.content
# b'<!DOCTYPE html>\n<html>\n<head>\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\n...'
```

requests 对于特定类型的响应, 比如 JSON 可以直接获取:

```py
r = requests.get('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20%3D%202151330&format=json')
r.json()
# {'query': {'count': 1, 'created': '2017-11-17T07:14:12Z', ...
```

发送 post 请求, 可以传入 data 参数作为 POST 请求的数据.

requests 默认使用`application/x-www-form-urlencoded`对 POST 数据编码. 如果要传递 JSON 数据, 可以直接传入 json 参数:

```py
params = {'key': 'value'}
r = requests.post(url, json=params) # 内部自动序列化为JSON
```

类似的, 上传文件所需要的复杂的编码格式, 简化为:

```py
upload_files = {'file': open('report.xls', 'rb')}
r = requests.post(url, files=upload_files)
```

在读取文件时，注意务必使用'rb'即二进制模式读取，这样获取的 bytes 长度才是文件的长度。

把 post()方法替换为 put()，delete()等，就可以以 PUT 或 DELETE 方式请求资源。

除了能轻松获取响应内容外，requests 对获取 HTTP 响应的其他信息也非常简单。例如，获取响应头：

```py
r.headers
# {Content-Type': 'text/html; charset=utf-8', 'Transfer-Encoding': 'chunked', 'Content-Encoding': 'gzip', ...}
r.headers['Content-Type']
# 'text/html; charset=utf-8'
```

`requests`对`Cookie`做了特殊处理，使得我们不必解析 Cookie 就可以轻松获取指定的 Cookie:

```py
r.cookies['ts']
# 'example_cookie_12345'
```

要在请求中传入 Cookie，只需准备一个 dict 传入 cookies 参数:

```py
cs = {'token': '12345', 'status': 'working'}
r = requests.get(url, cookies=cs)
```

最后指定超时, 传入以秒为单位的 timeout 参数:

```py
r = requests.get(url, timeout=2.5) # 2.5秒后超时
```

### chardet

`chardet`可以用来检测编码

```py
chardet.detect(b'Hello, world!')
# {'encoding': 'ascii', 'confidence': 1.0, 'language': ''}
```

### psutil

psutil = process and system utilities，它不仅可以通过一两行代码实现系统监控，还可以跨平台使用，支持 Linux／UNIX／OSX／Windows 等，是系统管理员和运维小伙伴不可或缺的必备模块。

#### CPU

```py
import psutil
psutil.cpu_count() # CPU逻辑数量
# 4
psutil.cpu_count(logical=False) # CPU物理核心
# 2
# 2说明是双核超线程, 4则是4核非超线程


# 统计CPU的用户／系统／空闲时间
psutil.cpu_times()
scputimes(user=10963.31, nice=0.0, system=5138.67, idle=356102.45)

# 再实现类似top命令的CPU使用率，每秒刷新一次，累计10次
for x in range(10):
    psutil.cpu_percent(interval=1, percpu=True)
# [14.0, 4.0, 4.0, 4.0]
# [12.0, 3.0, 4.0, 3.0]
# [8.0, 4.0, 3.0, 4.0]
# [12.0, 3.0, 3.0, 3.0]
# [18.8, 5.1, 5.9, 5.0]
# [10.9, 5.0, 4.0, 3.0]
# [12.0, 5.0, 4.0, 5.0]
# [15.0, 5.0, 4.0, 4.0]
# [19.0, 5.0, 5.0, 4.0]
# [9.0, 3.0, 2.0, 3.0]
```

#### 内存

使用 psutil 获取物理内存和交换内存信息，分别使用:

```py
psutil.virtual_memory()
# svmem(total=8589934592, available=2866520064, percent=66.6, used=7201386496, free=216178688, active=3342192640, inactive=2650341376, wired=1208852480)
psutil.swap_memory()
# sswap(total=1073741824, used=150732800, free=923009024, percent=14.0, sin=10705981440, sout=40353792)
```

返回的是字节为单位的整数，可以看到，总内存大小是 8589934592 = 8 GB，已用 7201386496 = 6.7 GB，使用了 66.6%。

而交换区大小是 1073741824 = 1 GB。

#### 磁盘

```py
>>> psutil.disk_partitions() # 磁盘分区信息
[sdiskpart(device='/dev/disk1', mountpoint='/', fstype='hfs', opts='rw,local,rootfs,dovolfs,journaled,multilabel')]
>>> psutil.disk_usage('/') # 磁盘使用情况
sdiskusage(total=998982549504, used=390880133120, free=607840272384, percent=39.1)
>>> psutil.disk_io_counters() # 磁盘IO
sdiskio(read_count=988513, write_count=274457, read_bytes=14856830464, write_bytes=17509420032, read_time=2228966, write_time=1618405)
```

#### 网络

```py
>>> psutil.net_io_counters() # 获取网络读写字节／包的个数
snetio(bytes_sent=3885744870, bytes_recv=10357676702, packets_sent=10613069, packets_recv=10423357, errin=0, errout=0, dropin=0, dropout=0)
>>> psutil.net_if_addrs() # 获取网络接口信息
{
  'lo0': [snic(family=<AddressFamily.AF_INET: 2>, address='127.0.0.1', netmask='255.0.0.0'), ...],
  'en1': [snic(family=<AddressFamily.AF_INET: 2>, address='10.0.1.80', netmask='255.255.255.0'), ...],
  'en0': [...],
  'en2': [...],
  'bridge0': [...]
}
>>> psutil.net_if_stats() # 获取网络接口状态
{
  'lo0': snicstats(isup=True, duplex=<NicDuplex.NIC_DUPLEX_UNKNOWN: 0>, speed=0, mtu=16384),
  'en0': snicstats(isup=True, duplex=<NicDuplex.NIC_DUPLEX_UNKNOWN: 0>, speed=0, mtu=1500),
  'en1': snicstats(...),
  'en2': snicstats(...),
  'bridge0': snicstats(...)
}
```

要获取当前网络连接信息，使用 net_connections():

```py
$ sudo python3
Password: ******
Python 3.6.3 ... on darwin
Type "help", ... for more information.
>>> import psutil
>>> psutil.net_connections()
[
    sconn(fd=83, family=<AddressFamily.AF_INET6: 30>, type=1, laddr=addr(ip='::127.0.0.1', port=62911), raddr=addr(ip='::127.0.0.1', port=3306), status='ESTABLISHED', pid=3725),
    sconn(fd=84, family=<AddressFamily.AF_INET6: 30>, type=1, laddr=addr(ip='::127.0.0.1', port=62905), raddr=addr(ip='::127.0.0.1', port=3306), status='ESTABLISHED', pid=3725),
    sconn(fd=93, family=<AddressFamily.AF_INET6: 30>, type=1, laddr=addr(ip='::', port=8080), raddr=(), status='LISTEN', pid=3725),
    sconn(fd=103, family=<AddressFamily.AF_INET6: 30>, type=1, laddr=addr(ip='::127.0.0.1', port=62918), raddr=addr(ip='::127.0.0.1', port=3306), status='ESTABLISHED', pid=3725),
    sconn(fd=105, family=<AddressFamily.AF_INET6: 30>, type=1, ..., pid=3725),
    sconn(fd=106, family=<AddressFamily.AF_INET6: 30>, type=1, ..., pid=3725),
    sconn(fd=107, family=<AddressFamily.AF_INET6: 30>, type=1, ..., pid=3725),
    ...
    sconn(fd=27, family=<AddressFamily.AF_INET: 2>, type=2, ..., pid=1)
]
```

#### 进程

```py
>>> psutil.pids() # 所有进程ID
[3865, 3864, 3863, 3856, 3855, 3853, 3776, ..., 45, 44, 1, 0]
>>> p = psutil.Process(3776) # 获取指定进程ID=3776，其实就是当前Python交互环境
>>> p.name() # 进程名称
'python3.6'
>>> p.exe() # 进程exe路径
'/Users/michael/anaconda3/bin/python3.6'
>>> p.cwd() # 进程工作目录
'/Users/michael'
>>> p.cmdline() # 进程启动的命令行
['python3']
>>> p.ppid() # 父进程ID
3765
>>> p.parent() # 父进程
<psutil.Process(pid=3765, name='bash') at 4503144040>
>>> p.children() # 子进程列表
[]
>>> p.status() # 进程状态
'running'
>>> p.username() # 进程用户名
'michael'
>>> p.create_time() # 进程创建时间
1511052731.120333
>>> p.terminal() # 进程终端
'/dev/ttys002'
>>> p.cpu_times() # 进程使用的CPU时间
pcputimes(user=0.081150144, system=0.053269812, children_user=0.0, children_system=0.0)
>>> p.memory_info() # 进程使用的内存
pmem(rss=8310784, vms=2481725440, pfaults=3207, pageins=18)
>>> p.open_files() # 进程打开的文件
[]
>>> p.connections() # 进程相关网络连接
[]
>>> p.num_threads() # 进程的线程数量
1
>>> p.threads() # 所有线程信息
[pthread(id=1, user_time=0.090318, system_time=0.062736)]
>>> p.environ() # 进程环境变量
{'SHELL': '/bin/bash', 'PATH': '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:...', 'PWD': '/Users/michael', 'LANG': 'zh_CN.UTF-8', ...}
>>> p.terminate() # 结束进程
Terminated: 15 <-- 自己把自己结束了
```
