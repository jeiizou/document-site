---
title: 'Python 入门学习(三)'
date: 2018-11-19 21:45:04
category:
    - 笔记
    - python入门学习
tags:
    - 编程语言
    - python
---

> 跟随廖雪峰的Python教程的学习笔记(三)

<!-- more -->

## 图形界面

python 支持内置的 Tk, wxWidgets, Qt, GTK 等等.

这是一个 Tkinter 的"Hello world".

```py
from tkinter import *

# 所有Widget的父容器
class Application(Frame):
    def __init__(self, master=None):
        Frame.__init__(self, master)
        self.pack()
        self.createWidgets()

    def createWidgets(self):
        self.nameInput = Entry(self)
        self.nameInput.pack()
        self.alertButton = Button(self, text='Hello', command=self.hello)
        self.alertButton.pack()

    def hello(self):
        name = self.nameInput.get() or 'world'
        messagebox.showinfo('Message', 'Hello, %s' % name)

# 实例化 Application, 并启动消息循环
app = Application()
# 设置窗口标题:
app.master.title('Hello World')
# 主消息循环:
app.mainloop()
```

### 海龟绘图

```py
from turtle import *

def drawStar(x, y):
    pu()
    goto(x, y)
    pd()
    # set heading: 0
    seth(0)
    for i in range(5):
        fd(40)
        rt(144)

for x in range(0, 250, 50):
    drawStar(x, 0)

done()
```

## 网络编程

### TCP 编程

大多数连接都是可靠的 TCP 连接, 创建 TCP 连接时, 主动发起连接的叫客户端, 被动响应连接的服务器.

创建一个基于 TCP 连接的 Socket, 可以这样做:

```py
# 导入socket库:
import socket

# 创建一个socket:
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# 建立连接:
s.connect(('www.sina.com.cn', 80))
```

创建 Socket 时，AF_INET 指定使用 IPv4 协议，如果要用更先进的 IPv6，就指定为 AF_INET6。SOCK_STREAM 指定使用面向流的 TCP 协议，这样，一个 Socket 对象就创建成功. 随后就是根据服务器的 IP 和端口建立连接了.

注意 connect 函数的参数是一个 tuple, 包含 IP 地址和端口号.

建立 TCP 连接后, 我们可以向新浪服务器发送请求, 要求返回首页的内容:

```py
# 发送数据:
s.send(b'GET / HTTP/1.1\r\nHost: www.sina.com.cn\r\nConnection: close\r\n\r\n')
```

TCP 撞见的是双向通道, 双方都可以同时给对方发数据. 但是谁先发睡后发, 怎么协调, 要根据具体的协议来决定. 例如, HTTP 协议规定客户端必须先发请求给服务器, 服务器收到后才发数据给客户端.

发送的文本格式必须符合 HTTP 标准, 如果格式没有问题, 就能接受新浪服务器返回的数据了.

```py
# 接收数据:
buffer = []
while True:
    # 每次最多接收1k字节:
    d = s.recv(1024)
    if d:
        buffer.append(d)
    else:
        break
data = b''.join(buffer)
```

接受数据时, 调用`recv(max)`方法, 一次最多接受指定的字节数, 所以可以在一个 while 循环中反复接受, 知道`recv()`返回空数据, 表示接收完毕,退出循环.

接受完毕以后通过`s.close()`关闭连接.

接收到的数据包括 HTTP 头和网页本身, 我们只需要把 HTTP 头和网页分离开, 吧 HTTP 头打印出来, 网页内容保存到文件:

```py
header, html = data.split(b'\r\n\r\n', 1)
print(header.decode('utf-8'))
# 把接收的数据写入文件:
with open('sina.html', 'wb') as f:
    f.write(html)
```

这样就获得了新浪的首页了.

#### 服务端

和客户端相比, 服务器编程稍复杂些. 服务器进程首先要绑定一个端口, 并监听来自其他客户端的链接. 如果某个个客户端连接发起了, 就建立 Socket 连接, 随后的通信就靠这个 Socket 连接了.

所以, 服务器会打开固定端口的监听. 每一个客户端都会根据"服务器地址, 服务器端口, 客户端地址, 客户端端口来唯一确定一个 Socket".

```py
# 创建一个基于IPV4和TCP协议的Socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 监听端口:
s.bind(('127.0.0.1', 9999))

#监听端口, 传入参数指定最大连接数
s.listen(5)
print('Waiting for connection...')


while True:
    # 接受一个新连接:
    sock, addr = s.accept()
    # 创建新线程来处理TCP连接:
    t = threading.Thread(target=tcplink, args=(sock, addr))
    t.start()

# 新建一个线程来处理连接
def tcplink(sock, addr):
    print('Accept new connection from %s:%s...' % addr)
    sock.send(b'Welcome!')
    while True:
        data = sock.recv(1024)
        time.sleep(1)
        if not data or data.decode('utf-8') == 'exit':
            break
        sock.send(('Hello, %s!' % data.decode('utf-8')).encode('utf-8'))
    sock.close()
    print('Connection from %s:%s closed.' % addr)
```

对应的客户端程序:

```py
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# 建立连接:
s.connect(('127.0.0.1', 9999))
# 接收欢迎消息:
print(s.recv(1024).decode('utf-8'))
for data in [b'Michael', b'Tracy', b'Sarah']:
    # 发送数据:
    s.send(data)
    print(s.recv(1024).decode('utf-8'))
s.send(b'exit')
s.close()
```

同一个端口, 被一个 Socket 绑定以后, 就不能被别的 Socket 绑定了.

### UDP

TCP 建立可靠连接, UDP 则是面向无连接的协议. 使用 UDP 协议不需要建立连接, 只需要 IP 和端口, 但不保证可达.

```py
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
# 绑定端口:
s.bind(('127.0.0.1', 9999))
```

`SOCK_DGRAM`指定 socket 类型为 UDP. 对于服务器, 绑定端口和 TCP 一样, 但是不需要调用`listen()`, 而是直接接受来自任何客户端的数据:

```py
print('Bind UDP on 9999...')
while True:
    # 接收数据:
    data, addr = s.recvfrom(1024)
    print('Received from %s:%s.' % addr)
    s.sendto(b'Hello, %s!' % data, addr)
```

`recvfrom()`方法返回数据和客户端的地址与端口, 服务器收到数据后, 直接调用`sendto()`就可以把数据用 UDP 发给客户端.

这里省掉了多线程.

客户端使用 UDP, 则创建 socket, 不要调用 connnect, 直接通过 sendto 给服务器发送数据:

```py
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
for data in [b'Michael', b'Tracy', b'Sarah']:
    # 发送数据:
    s.sendto(data, ('127.0.0.1', 9999))
    # 接收数据:
    print(s.recv(1024).decode('utf-8'))
s.close()
```

## 数据库

### SQLite

SQLite 是一种嵌入式数据库, 它的数据库就是一个文件. 由于 SQLite 本身是 C 写的, 并且体积很小, 所以常用于集成到各种应用程序中, 甚至在 IOS 和 Android 的 APP 中.

Python 就内置了 SQLite3, 所以在 Python 中直接使用就可以了.

```py
# 导入SQLite驱动:
import sqlite3
# 连接到SQLite数据库
# 数据库文件是test.db
# 如果文件不存在，会自动在当前目录创建:
conn = sqlite3.connect('test.db')
# 创建一个Cursor:
cursor = conn.cursor()
# 执行一条SQL语句，创建user表:
cursor.execute('create table user (id varchar(20) primary key, name varchar(20))')
# <sqlite3.Cursor object at 0x10f8aa260>
# 继续执行一条SQL语句，插入一条记录:
cursor.execute('insert into user (id, name) values (\'1\', \'Michael\')')
# <sqlite3.Cursor object at 0x10f8aa260>
# 通过rowcount获得插入的行数:
cursor.rowcount
1
# 关闭Cursor:
cursor.close()
# 提交事务:
conn.commit()
# 关闭Connection:
conn.close()
```

使用 python 的 DB-API 时, 只要搞清楚`Connection`和`Cursor`对象, 打开后记得关闭, 就可以放心的使用.

使用`Cursor`执行`insert`,`update`,`delete`时, 执行结果由`rowcount`返回影响的行数, 就可以拿到执行结果.

使用`Cursor`执行`select`时, 通过`featchall()`可以拿到结果集, 结果集是一个`list`, 每个元素都是一个 tuple, 对应一行记录.

如果 SQL 语句带有参数，那么需要把参数按照位置传递给 execute()方法，有几个?占位符就必须对应几个参数，例如：

```py
cursor.execute('select * from user where name=? and pwd=?', ('abc', 'password'))
```

### MySql

#### 安装 MySQL 驱动

安装`mysql-connector-python`

```s
$ pip install mysql-connector-python --allow-external mysql-connector-python
```

或者`mysql-connector`:

```s
$ pip install mysql-connector
```

#### 连接

实际操作和 SQLite 差不多:

```py
# 导入MySQL驱动:
import mysql.connector
# 注意把password设为你的root口令:
conn = mysql.connector.connect(user='root', password='password', database='test')
cursor = conn.cursor()
# 创建user表:
cursor.execute('create table user (id varchar(20) primary key, name varchar(20))')
# 插入一行记录，注意MySQL的占位符是%s:
cursor.execute('insert into user (id, name) values (%s, %s)', ['1', 'Michael'])
cursor.rowcount
# 1
# 提交事务:
conn.commit()
cursor.close()
# 运行查询:
cursor = conn.cursor()
cursor.execute('select * from user where id = %s', ('1',))
values = cursor.fetchall()
values
# [('1', 'Michael')]
# 关闭Cursor和Connection:
cursor.close()
True
conn.close()
```

### ORM

我们在前面介绍过 ORM, python 中最著名的 ORM 框架是 SQLAlchemy.

首先安装:

```s
$ pip install sqlalchemy
```

使用示例:

```py
# 导入:
from sqlalchemy import Column, String, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 创建对象的基类:
Base = declarative_base()

# 定义User对象:
class User(Base):
    # 表的名字:
    __tablename__ = 'user'

    # 表的结构:
    id = Column(String(20), primary_key=True)
    name = Column(String(20))

# 初始化数据库连接:
engine = create_engine('mysql+mysqlconnector://root:password@localhost:3306/test')
# 创建DBSession类型:
DBSession = sessionmaker(bind=engine)
```

`create_engine()`用来初始化数据库连接。SQLAlchemy 用一个字符串表示连接信息:

```txt
'数据库类型+数据库驱动名称://用户名:口令@机器地址:端口号/数据库名'
```

添加记录:

```py
# 创建session对象:
session = DBSession()
# 创建新User对象:
new_user = User(id='5', name='Bob')
# 添加到session:
session.add(new_user)
# 提交即保存到数据库:
session.commit()
# 关闭session:
session.close()
```

查询数据:

```py
# 创建Session:
session = DBSession()
# 创建Query查询，filter是where条件，最后调用one()返回唯一行，如果调用all()则返回所有行:
user = session.query(User).filter(User.id=='5').one()
# 打印类型和对象的name属性:
print('type:', type(user))
print('name:', user.name)
# 关闭Session:
session.close()
```

## 异步 IO

在 IO 操作过程中, 当前线程被挂起, 而其他需要 CPU 执行的代码就无法被当前线程执行了.

因为一个 IO 操作就阻塞了当前线程, 导致其他代码无法执行, 所以我们必须使用所线程或者多进程来并发执行代码, 为多个用户服务. 每个用户都会分配一个线程. 如果遇到 IO 导致线程被挂起, 其他用户的线程不受影响. 多线程和多进程的模型虽然解决了并发问题, 但是系统不能无上限的增加线程.

所以有了异步 IO.

异步 IO 模型需要一个消息循环, 在消息循环中, 主线程不断地重复"读取消息->处理消息"这一过程:

```py
loop = get_event_loop()
while True:
    event = loop.get_event()
    process_event(event)
```

### 协程

协程, 又称微线程, Coroutine.

子程序, 或者称函数, 在所有语言中都是层级调用, 子程序的调用是通过栈实现的, 一个线程就是执行一个子程序.

子程序调用总是一个入口, 一次返回, 调用顺序是明确的. 而协程的调用和子程序不同. 协程看上去也是子程序, 但执行过程中, 在子程序内部可中断, 然后转而执行其他程序, 在适当的时候再返回继续执行.

python 中对协程的支持是通过 generator 实现的. 在 generator 中, 我们不但可以通过 for 循环来迭代, 还可以不断调用 next 获取有 yield 语句返回的下一个值. 此外, yield 还可以接受调用者发出的参数.

### asyncio

asyncio 是 python3.4 引入的标准库, 直接内置了对异步 IO 的支持.

asyncio 的编程模型就是一个消息循环. 我们从`asyncio`模块中直接获取一个`Eventloop`的引用, 然后把需要执行的协程扔到`EventLoop`中执行, 就实现了异步 IO:

```py
import asyncio

@asyncio.coroutine
def hello():
    print("Hello world!")
    # 异步调用asyncio.sleep(1):
    r = yield from asyncio.sleep(1)
    print("Hello again!")

# 获取EventLoop:
loop = asyncio.get_event_loop()
# 执行coroutine
loop.run_until_complete(hello())
loop.close()
```

`@asyncio.coroutine`把一个`generator`标记为`coroutine`类型，然后，我们就把这个`coroutine`扔到`EventLoop`中执行。

`hello()`会首先打印出`Hello world!`，然后，`yield from`语法可以让我们方便地调用另一个`generator`。由于`asyncio.sleep()`也是一个`coroutine`，所以线程不会等待`asyncio.sleep()`，而是直接中断并执行下一个消息循环。当`asyncio.sleep()`返回时，线程就可以从`yield from`拿到返回值（此处是 None），然后接着执行下一行语句。

把`asyncio.sleep(1)`看成是一个耗时 1 秒的 IO 操作，在此期间，主线程并未等待，而是去执行`EventLoop`中其他可以执行的`coroutine`了，因此可以实现并发执行。

### async/await

为了让`coroutine`代码更加简洁, python3.5 引入了`async`和`await`.

请注意，`async`和`await`是针对`coroutine`的新语法，要使用新的语法，只需要做两步简单的替换：

1. 把`@asyncio.coroutine`替换为`async`；
2. 把`yield from`替换为`await`。

```py
# 原来的语法
@asyncio.coroutine
def hello():
    print("Hello world!")
    r = yield from asyncio.sleep(1)
    print("Hello again!")

# 新的语法
async def hello():
    print("Hello world!")
    r = await asyncio.sleep(1)
    print("Hello again!")
```
