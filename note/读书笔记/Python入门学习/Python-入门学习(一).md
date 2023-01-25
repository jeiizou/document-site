---
title: 'Python 入门学习(一)'
date: 2018-11-12 18:00:23
category:
    - 笔记
    - python入门学习
tags:
    - 编程语言
    - python
---

> 跟随廖雪峰的Python教程的学习笔记(一)

<!-- more -->

## 基础

### 输入和输出

- `print(value1[,value2,...])` >>> `value1 value2 ...`
- `name=input()`

### 数据类型

- 整数(1), 浮点数(1.00), 字符串('abc'), 布尔值(True/False), 空值(None), 常亮(全部大写的变量名:PI, 这只是个习惯用法, 没有语法保证)

- 除法: `/` 精确除法,  `//` 地板除, 结果只取整数, `%` 余数除法

### 字符编码

python 3字符以Unicode编码, 下面是一些方法

- `ord()` 获取字符的整数表示: `ord('A') >>> 65`
- `chr()` 把编码转换为对应的字符: `chr(66) >>> 'B'`

对于 `\u4e2d\u6587` 这样的16进制写法和 `中文` 这样的写法是完全等价的. 

注意区分`'ABD'`和`b'ABC'`, 前者是`str`, 后者是`bytes`类型的字符,它的每个字符都只占用一个字节. 


#### encode()

`encode()` 方法可以将以Unicode表示的`str`编码为指定的`bytes`, 例如: 

```py
>>> 'ABD'.encode('ascii')
b'ABC'
```

中文可以用`utf-8`编码但是不能用`ascii`编码.

无法用ASCII表示的字节, 会用`\x##`表示

#### decode()

我们从网络或者磁盘上读取字节流, 读到的数据就是`bytes`, 使用`decode()`将`bytes`变为`str`.

```py
>>> b'ABC'.decode('ascii')
'ABC'
```

`bytes`中存在无法解码会报错, 如果无法解码只有一小部分, 可以传入`errors='ignore'`来忽略错误: 

```py
>>> b'\xe4\xb8\xad\xff'.decode('utf-8', errors='ignore')
'中'
```

`len()`可以用于计算`str`或者`bytes`的长度

#### 文件头

```py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
```

第一行告诉Linux/OS X系统这是一个Py程序, 第二行告诉解释器, 按照`utf-8`读取源代码. 

注意确保文件保存也是相同的编码格式. 

#### 格式化

```py
>>> 'Hello, %s' % 'world'
'Hello, world'
>>> 'Hi, %s, you have $%d.' % ('Michael', 1000000)
'Hi, Michael, you have $1000000.'
```

| 占位符 | 替换内容     |
| ------ | ------------ |
| %d     | 整数         |
| %f     | 浮点数       |
| %s     | 字符串       |
| %x     | 十六进制整数 |

- 如果你不太确定应该用什么，`%s`永远起作用，它会把任何数据类型转换为字符串
- 用%%来表示一个%


`format()`函数: 

```py
>>> 'Hello, {0}, 成绩提升了 {1:.1f}%'.format('小明', 17.125)
'Hello, 小明, 成绩提升了 17.1%'
```

### list数组和tuple元组

```py
listVa = ['Michael', 'Bob', 'Tracy']
tupleVa = ('Michael', 'Bob', 'Tracy')
```

tuple一旦初始化就不能修改. tuple没有append(), insert()这样的方法, 其他获取元素的方法是一样的, 但是不能赋值为其他元素. tuple更安全.

tuple在只有一个参数时需要消除歧义: 

```py
>>> t = (1)
>>> t
1 # 数字

>>> t = (1,)
>>> t
(1,) # 元组
```

### 条件

```py
if flag == 1:
    print(1)
elif flag == 2:
    print(2)
else:
    print(flag)
```

### 循环

```py
# for循环
for x in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
    sum = sum + x

# while循环
while n > 0:
    sum = sum + n
    n = n - 2
```

`break`: 跳出循环  
`continue`: 跳过这次循环

### dict和set

dict全称dictionary, 意义为map, 使用key-value存储, 查找速度快. 

```py
>>> d = {'Michael': 95, 'Bob': 75, 'Tracy': 85}
>>> d['Michael']
95
```

- 通过`in`判断key是否存在:

```py
>>> 'Thomas' in d
False
```

- `get()`方法

```py
>>> d.get('Thomas')
>>> d.get('Thomas', -1)
-1
```
- `pop()`方法:删除一个键值对

```py
>>> d.pop('Bob')
75
>>> d
{'Michael': 95, 'Tracy': 85}
```

set类似于dict, 创建一个set需要提供一个list:

```py
>>> s = set([1, 2, 3])
>>> s
{1, 2, 3}
```

set会自动过滤重复元素: 

```py
>>> s = set([1, 1, 2, 2, 3, 3])
>>> s
{1, 2, 3}
```

- `add(key)`方法添加一个元素:　`s.add(4)>>>{1, 2, 3, 4}`
- `remove(key)`方法删除一个元素: `s.remove(4)>>>{1,2,3}`

## 函数

### 内置函数

-  帮助函数`help()`

```py
>>> help(abs)
Help on built-in function abs in module builtins:

abs(x, /)
    Return the absolute value of the argument.
```

- 类型转换: 
    - `int('123')>>>123`
    - `float('12.34')>>>12.34`
    - `str(100)>>>'100'`
    - `bool(1)>>>True`

### 定义

```py
def my_abs(x):
    if x >= 0:
        return x
    else:
        return -x
```


- 空函数和pass占位符:　

```py
def nop():
    pass
```

### 参数

#### 默认参数: 

```py
def power(x, n=2):
    s = 1
    while n > 0:
        n = n - 1
        s = s * x
    return s
```

定义默认参数要牢记一点：默认参数必须指向不变对象！

```py
def add_end(L=[]):
    L.append('END')
    return L

# >>> add_end()
# ['END']
# >>> add_end()
# ['END', 'END']
# >>> add_end()
# ['END', 'END', 'END']

# 修改为: 
def add_end(L=None):
    if L is None:
        L = []
    L.append('END')
    return L

# >>> add_end()
# ['END']
# >>> add_end()
# ['END']
```

#### 可变参数:

```py
def calc(*numbers):
    sum = 0
    for n in numbers:
        sum = sum + n * n
    return sum
```

在函数内部, 参数`numbers`接收到的是一个tuple,调用该函数可以传入任意个参数: 

```py
>>> calc(1, 2)
5
>>> calc()
0
```

传入一个list或者tuple:

```py
>>> nums = [1, 2, 3]
>>> calc(*nums)
14
```

#### 关键字参数

可变参数允许传入0或者任意个参数, 并会自动组装为tuple, 关键字参数允许传入0或任意个含参数名的参数:

```py
def person(name, age, **kw):
    print('name:', name, 'age:', age, 'other:', kw)

>>> person('Adam', 45, gender='M', job='Engineer')
name: Adam age: 45 other: {'gender': 'M', 'job': 'Engineer'}
```

和可变参数一样, 我们也可以先组装出一个dict, 然后把这个dict转换为关键字参数传进去:

```py
>>> extra = {'city': 'Beijing', 'job': 'Engineer'}
>>> person('Jack', 24, **extra)
name: Jack age: 24 other: {'city': 'Beijing', 'job': 'Engineer'}
```

#### 命名关键字参数

如果我们只接受`city`和`job`作为关键字参数, 就可以定义命名关键字参数: 

```py
def person(name, age, *, city, job):
    print(name, age, city, job)
```

`*`后面跟着的参数被视为命名关键字参数, 调用如下: 

```py
>>> person('Jack', 24, city='Beijing', job='Engineer')
Jack 24 Beijing Engineer
```

如果已经有了一个可变参数, 后面就不需要另外加一个作为分隔符了: 

```py
def person(name, age, *args, city, job):
    print(name, age, args, city, job)
```

命名关键字参数必须传入参数名, 这和位置参数不同, 如果没有传入参数名, 调用就会报错. 

同样可以使用默认参数简化调用. 

#### 参数组合

参数有五种, 定义的顺序必须是: 必选参数, 默认参数, 可变参数, 命名关键字参数以及关键字参数.

比如顶一个函数, 包含上述若干种参数: 

```py
def f1(a, b, c=0, *args, **kw):
    print('a =', a, 'b =', b, 'c =', c, 'args =', args, 'kw =', kw)

def f2(a, b, c=0, *, d, **kw):
    print('a =', a, 'b =', b, 'c =', c, 'd =', d, 'kw =', kw)
```

调用示例: 

```py
>>> f1(1, 2)
a = 1 b = 2 c = 0 args = () kw = {}
>>> f1(1, 2, c=3)
a = 1 b = 2 c = 3 args = () kw = {}
>>> f1(1, 2, 3, 'a', 'b')
a = 1 b = 2 c = 3 args = ('a', 'b') kw = {}
>>> f1(1, 2, 3, 'a', 'b', x=99)
a = 1 b = 2 c = 3 args = ('a', 'b') kw = {'x': 99}
>>> f2(1, 2, d=99, ext=None)
a = 1 b = 2 c = 0 d = 99 kw = {'ext': None}
```

或者通过一个tuple和dict, 你也可以调用上述函数:

```py
>>> args = (1, 2, 3, 4)
>>> kw = {'d': 99, 'x': '#'}
>>> f1(*args, **kw)
a = 1 b = 2 c = 3 args = (4,) kw = {'d': 99, 'x': '#'}
>>> args = (1, 2, 3)
>>> kw = {'d': 88, 'x': '#'}
>>> f2(*args, **kw)
a = 1 b = 2 c = 3 d = 88 kw = {'x': '#'}
```

## 递归函数

```py
def fact(n):
    if n==1:
        return 1
    return n * fact(n - 1)
```

### 尾递归优化

尾递归是指, 在函数返回的时候调用自身本身, 而且return语句不能包含表达式. 这样编译器或者解释器就可以把尾递归进行优化, 防止出现栈溢出. 

```py
def fact(n):
    return fact_iter(n, 1)

def fact_iter(num, product):
    if num == 1:
        return product
    return fact_iter(num - 1, num * product)
```

## 高级特性

### 切片

python提供了Slice, 用来取一个list或tuple的部分元素.

```py
L = ['Michael', 'Sarah', 'Tracy', 'Bob', 'Jack']

# 起始索引:长度:每多少取1个
L[0:3:1] #>>> ['Michael', 'Sarah', 'Tracy']

# 如果第一个是0, 还可以省略
L[:3] #>>> ['Michael', 'Sarah', 'Tracy']

# 如果是负数, 则倒数开始取
L[-2:] #>>> ['Bob', 'Jack']

# 前4个每2个去一个
L[:4:2] #>>> ['Michael', 'Sarah', 'Tracy']
```

tuple以及字符串都可以看成一种list:

```py
(0, 1, 2, 3, 4, 5)[:3] # >>> (0, 1, 2)
'ABCDEFG'[:3] # >>> 'ABC'
```

### 迭代

通过`for`循环便利list或者tuple, 就叫做迭代. 

在python中, `for..in`就是进行迭代的方式. 只要是可迭代对象, 都可以进行forin迭代. 其中因为dict的存储不是按照list的方式顺序排列, 所以迭代出的结果顺序很可能不一样.

默认的, 迭代的值为`key`, 如果要迭代`value`或者同时迭代, 应当这样写: 

```py
# 迭代value
for value in d.values()
# 同时迭代
for k, v in d.items()
```

字符串也是可迭代对象. 如何判断可迭代, 可以通过`collections`模块的`Iterable`类型判断: 

```py
from collections import Iterable
isinstance('abc', Iterable) # str是否可迭代 >>> True
isinstance([1,2,3], Iterable) # list是否可迭代 >>>True
isinstance(123, Iterable) # 整数是否可迭代 >>> False
```

如何进行下标循环? 写法如下: 

```py
for i, value in enumerate(['A', 'B', 'C']):
    print(i, value)
# 0 A
# 1 B
# 2 C
```

for循环中使用多个变量是比较常见的: 

```py
for x, y in [(1, 1), (2, 4), (3, 9)]:
    print(x, y)
```

### 列表生成式

List Comprehensions 是python内置的非常简单但是强大的可以用来创建list的生成式. 

```py
list(range(1, 11)) # >>> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

配合`for`循环生成一些复杂的list: 

```py
L=[]
for x in range(1, 11):
    L.append(x * x)
# >>> [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

它还有简约的写法:

```py
[x * x for x in range(1, 11)]
#　>>>　[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
```

还能加上if判断:　

```py
[x * x for x in range(1, 11) if x % 2 == 0]
# >>>　[4, 16, 36, 64, 100]
```

还能双重循环, 生成全排列:

```py
[m + n for m in 'ABC' for n in 'XYZ']
# >>> ['AX', 'AY', 'AZ', 'BX', 'BY', 'BZ', 'CX', 'CY', 'CZ']
```

这种语法可以写出非常简洁的代码, 例如列出所有文件和目录名称: 

```py
import os
[d for d in os.listdir('.')]
# >>>  ['Desktop', 'Documents', 'Downloads', 'Library', 'Movies', 'Music', 'Pictures']
```

当然, for循环和前面一样接受多个参数, 语法不变. 


###  生成器

如果列表元素按照某种规则推算出来, 那么我们可以不必创建完整的list, 而是在循环的过程中不断推算出后续的元素, 从而节省大量的空间. 这就是python中的generator. 创建generator很简单, 第一种方式如下所示: 

```py
g = (x * x for x in range(10))
g
# >>> <generator object <genexpr> at 0x1022ef630>
```

创建list和generator的区别仅在于最外层的[]和(), 我们可以通过`next()`获取generator的下一个返回值:

```py
next(g) #>>> 0
next(g) #>>> 1
next(g) #>>> 4
next(g) #>>> 9
```

或者用`for...in`循环generator对象. 

斐波拉契数列用列表生成式写不出来，但是，用函数把它打印出来却很容易:

```py
def fib(max):
    n, a, b = 0, 0, 1
    while n < max:
        print(b)
        a, b = b, a + b
        n = n + 1
    return 'done'
```

其中有一句:

```py
a, b = b, a + b
```

相当于: 

```py
t = (b, a + b) # t是一个tuple
a = t[0]
b = t[1]
```

然后把这个函数编程generator: 

```py
def fib(max):
    n, a, b = 0, 0, 1
    while n < max:
        yield b #就是改了这句
        a, b = b, a + b
        n = n + 1
    return 'done'
```

generator函数在调用`next()`的时候开始执行, 遇到`yield`就返回, 再次执行时从该`yield`语句处继续执行. 

我们可以用for循环来回去generator来获取返回值:(这有些让人困惑) 

```py
for n in fib(6):
    print(n)
```

但是在用`for`循环调用generator时, 拿不到`return`语句的返回值, 必须直接捕获`StopIteration`, 拿到其中的`value`. 

### 迭代器

可以直接作用于`for`循环的数据类型有以下几种: 

1. 集合数据类型: list, tuple, dict, set, str等
2. generator: 包括生成器和generator function
   
这两种类型统称为 `Iterable`, 可迭代对象. 

判断方法如下: `isinstance(*, Iterable)`. 

生成器不但可以作用于`for`循环, 还可以被`next()`函数不断调用并返回下一个值, 直到最后抛出`StopIteration`表示无法继续返回下一个值了.

这里我们区分一个概念: `Iterator`迭代器, 可以被`next()`函数调用并不断返回下一个值得对象称为迭代器. 同样我们可以使用下面的方法判断是否是`Iterator`迭代器:

```py
isinstance((x for x in range(10)), Iterator)
# >>> True
```

生成器都是`Iterator`对象, 但是list,dict,str虽然是Iterable却不是`Iterator`, 把list,dict,str等`Iterable`变成`Iterator`可以使用`iter()`函数: 

```py
isinstance(iter([]), Iterator) # True
isinstance(iter('abc'), Iterator) # True
```

`Iterator`对象表示的是一个数据流, 这是一个有序序列, 但是我们不知道序列的长度, 它可以是无限大的, 这是list不能表示的. 



##  函数式编程

函数式面向过程的程序设计的基本单元, 函数值编程(Functional Programming)的思想来源于数学中的集合论. 

函数式编程是一种抽象度很高的编程范式, 纯粹的函数式编程语言编写的函数没有变量, 所有的函数确定输入, 就确定输出, 定义为没有副作用的纯函数.

函数式编程的一个特点是, 允许把函数本身作为参数传递到其他函数, 还允许返回另一个函数. 

Python支持部分的函数式编程, 但是Python允许使用变量, 所以也不是纯函数式编程语言.

### 高阶函数

#### map/reduce

Python内建了`map()`和`reduce()`. 

map语法如下: `map(function, Iterable)`, 方法将传入的函数一次作用于序列的每个元素, 并把结果作为新的`Iterator`返回. 

```py
def f(x):
    return x * x
r = map(f, [1, 2, 3, 4, 5, 6, 7, 8, 9])
list(r)
# >>> [1, 4, 9, 16, 25, 36, 49, 64, 81]
```

结果`r`是一个`Iterator`, 惰性序列, 因此通过`list()`函数让它整个序列都计算出来, 并返回一个list. 

在举一个例子: 

```py
list(map(str, [1, 2, 3, 4, 5, 6, 7, 8, 9]))
# >>> ['1', '2', '3', '4', '5', '6', '7', '8', '9']
```

`reduce()`吧一个函数作用在一个序列`[x1,x2,x3,...]`上, 这个函数必须接受两个参数, `reduce`把结果继续和序列的下一个元素做累计计算, 其效果如下: 

```py
reduce(f, [x1, x2, x3, x4]) = f(f(f(x1, x2), x3), x4)
```

比如一个序列求和: 

```py
from functools import reduce
def add(x, y):
    return x + y

reduce(add, [1, 3, 5, 7, 9])  
# >>> 25
```

#### filter

`filter()`函数用于过滤序列. 与`map()`类似, `filter()`也接受一个函数和一个序列. 和`map()`不同, `filter()`把传入的函数一次作用于每个元素, 然后根据返回值是`True`还是`Flase`决定保留还是丢弃该元素. 

比如过滤一个list中的偶数: 

```py
def is_odd(n):
    return n % 2 == 1

list(filter(is_odd, [1, 2, 4, 5, 6, 9, 10, 15]))
# 结果: [1, 5, 9, 15]
```

注意`filter()`这个高阶函数返回的也是一个`Iterator`惰性序列, 所以我们用一个`list()`获得所有结果并返回list. 

这里是一个例子: 

```py
# 生成器
def _odd_iter():
    n = 1
    while True:
        n = n + 2
        yield n

# 筛选函数
def _not_divisible(n):
    return lambda x: x % n > 0

# 不断返回下一个素数
def primes():
    yield 2
    it = _odd_iter() # 初始序列
    while True:
        n = next(it) # 返回序列的第一个数
        yield n
        it = filter(_not_divisible(n), it) # 构造新序列

# 打印1000以内的素数:
for n in primes():
    if n < 1000:
        print(n)
    else:
        break
```

#### sorted 

`sorted()`函数接受一个key函数来实现自定义的排序: 

```py
sorted([36, 5, -12, 9, -21]) # >>> [-21, -12, 5, 9, 36]

# 按绝对值大小排序
sorted([36, 5, -12, 9, -21], key=abs) # >>> [5, 9, -12, -21, 36]
```

key指定的函数将作用于list的每一个元素上, 并根据key函数返回的结果进行排序. 

```py
# 默认对字符串排序
sorted(['bob', 'about', 'Zoo', 'Credit']) # >>>　['Credit', 'Zoo', 'about', 'bob']

# 忽略大小写
sorted(['bob', 'about', 'Zoo', 'Credit'], key=str.lower) # >>> ['about', 'bob', 'Credit', 'Zoo']

# 反向排序
sorted(['bob', 'about', 'Zoo', 'Credit'], key=str.lower, reverse=True) # >>> ['Zoo', 'Credit', 'bob', 'about']
```

### 闭包

python可以返回一个函数, 并且同样有闭包语法. 

### 匿名函数

```py
list(map(lambda x: x * x, [1, 2, 3, 4, 5, 6, 7, 8, 9]))
# >>> [1, 4, 9, 16, 25, 36, 49, 64, 81]

# def f(x):
#     return x * x
```

关键字`lambda`表示匿名函数，冒号前面的x表示函数参数。不过, 匿名函数有个限制, 只能有一个表达式. 此外, 匿名函数可以赋值给一个变量, 通过变量来调用函数: 

```py
f = lambda x: x * x
f(3) # >>> 9
```


### 装饰器

现在有一个函数: 

```py
def now():
     print('2015-3-25')
```

然后我要增强这个函数的功能, 所以我要定义一个装饰器`Decortor`: 

```py
def log(func):
    def wrapper(*args, **kw):
        print('call %s():' % func.__name__)
        return func(*args, **kw)
    return wrapper
```

这里的`log`是一个decorator, 接受一个函数作为参数, 并返回一个函数, 借助`@`语法, 把该装饰器放在函数头上: 

```py
@log
def now():
    print('2015-3-25')
```

这个时候再运行now函数, 就会执行装饰器中的语句: 

```py
call now():
2015-3-25
```

`@log`的语法相当于:`now=log(now)`, 使得now指向了新的函数, 这个函数由log返回. 

`wrapper()`函数的参数是:`(*args, **kw)`, 所以wrapper可以接受任意参数的调用. 

如果decorator本身需要传入参数, 那就需要编写一个返回decorator的高阶函数:　

```py
def log(text):
    def decorator(func):
        def wrapper(*args, **kw):
            print('%s %s():' % (text, func.__name__))
            return func(*args, **kw)
        return wrapper
    return decorator
```

用法如下: 

```py
@log('execute')
def now():
    print('2015-3-25')

now()
# >>> execute now():
# >>> 2015-3-25
```

还有一点容易忽略的是返回的函数的name被改变了, 需要手动的修改回来, 修改方法使用python内置的`functools.wraps`就可以了, 所以, 一个完整的decorator写法如下: 

```py
import functools

def log(func):
    @functools.wraps(func)
    def wrapper(*args, **kw):
        print('call %s():' % func.__name__)
        return func(*args, **kw)
    return wrapper
```

带参数的decorator写法类似. 


### 偏函数

偏函数(区分于数学中的概念)能力由python中的`functools`模块提供. 用于创建一个提供某些固定参数的包装函数: 

```py
# 包装int函数
def int2(x, base=2):
    return int(x, base)

# python提供的包装工具
import functools
int2 = functools.partial(int, base=2)
```

当然, 这里固定的方式是提供了一个默认参数, 所以可以显示的提供该改变这个默认参数. 

还有一点, 创建偏函数时, 实际上可以接受函数对象,`*args`和`**kw`三个删除, 比如: 

```py
int2 = functools.partial(int, base=2)
```

实际上固定了`int()`函数的关键字参数`base`, 也就是:

```py
int2('10010')

# 相当于: 
kw={'base':2}
int2('10010', **kw)
```

如果传入: 

```py
max2 = functools.partial(max, 10)
```

实际上`10`会作为`*args`的一部分自动加到左边:

```py
max2(5, 6, 7)
# 相当于
args = (10, 5, 6, 7)
max(*args)
```


## 模块

### 使用模块

python内置了很多有用的模块, 以`sys`为例, 编写一个`hello`模块: 

```py
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

' a test module '

__author__ = 'Michael Liao'

import sys

def test():
    args = sys.argv
    if len(args)==1:
        print('Hello, world!')
    elif len(args)==2:
        print('Hello, %s!' % args[1])
    else:
        print('Too many arguments!')

if __name__=='__main__':
    test()
```

前两行是标准注释, 第四行表示模块的注释, 任何模块的第一个字符串都被视为模块的文档注释. 

第六行使用`__author__`添加作者名称. 

`sys`模块通过`import`语句进行导入. `sys`模块有一个`argv`变量, 用`list`存储了命令行的所有参数, `argv`至少有一个参数, 永远是`.py`文件的名称, 例如: 

- `python3 hello.py` 获得的`sys.argv`就是`['hello.py']`;
- `python3 hello.py Michael` 就获得`[hello.py, 'Michael']`

注意最后两行, 在python命令行运行这个模块文件的时候, 解释器会把一个`__name__`这个特殊变量置为`__main__`, 在其他地方导入时, `if`判断就会失效. 这种方法常用来运行测试

#### 作用域

在python中, 可以通过`_`前缀来区分私有变量(private)和公有变量(public). 这是一种编程习惯, 而不是语法限制. 

### 第三方模块

以安装`Pillow`模块为例: 

```py
pip install Pillow
```

`Anaconda`是一个基于Python的数据处理和科学计算平台, 内置了许多有用的第三方库. 

#### 模块搜索路径

模块搜索的路径存放在`sys`模块的`path`变量中, 要添加自己的搜索目录有两种方法: 

1. 直接修改`sys.path`: 

```py
import sys
sys.path.append('/Users/michael/my_py_scripts')
```

这种方法适用于临时修改, 运行结束以后就失效了

2. 修改环境变量`PYTHONPATH`, 其内容会自动添加到模块搜索路径中. 



##  面向对象

### 定义类

```py
class Student(object):
    pass
```

`Student`是类名, 通常大写字母开头. `(object)`表示父类, 如果没有继承的父类, 就用object即可.  创建类的实例如下: 

```py
bart = Student()
```

构造函数: `__init__`:

```py
class Student(object):

    def __init__(self, name, score):
        self.name = name
        self.score = score
```

创建实例的时候需要传入除了`self`以外的所有参数. `self`表示实例变量. 

在类中的函数与其他函数唯一不同的是第一个参数永远是`self`, 其他都一样.

### 访问限制

Class内部可以有属性和方法, 而外部代码可以通过直接调用实例变量的方法来操作数据, 这样, 就隐藏了内部的复杂逻辑. 

如果要让内部属性不被外部访问, 在属性前面添加'__', 该属性就变成了一个私有变量(private), 只有内部可以访问, 外部不能访问. 以修改`Stundent`类为例: 

```py
class Student(object):

    def __init__(self, name, score):
        self.__name = name
        self.__score = score

    def print_score(self):
        print('%s: %s' % (self.__name, self.__score))
    

bart = Student('Bart Simpson', 59)

bart.__name

# >>> Traceback (most recent call last):
#  File "<stdin>", line 1, in <module>
# AttributeError: 'Student' object has no attribute '__name'
```

类似于`__xx__`属于特殊变量, 是可以直接访问的. 

实际上, 不能直接访问`__name`是因为python解释器把这个变量变成了`_Student_name`, 所以任然可以通过`_Student_name`来进行访问. 

当然, 不同的解释器有不同的命名方法, 这种访问是不可靠的. 

### 继承, 多态

继承和多态的关键原则: "对扩展开放, 对修改关闭". 意思是允许添加新的子类和覆盖父类方法, 不允许修改父类方法. 

### 类判断

使用`type()`可以进行基础类型或者函数或者类的判断:

```py
# 基本类型
type(123) # >>> <class 'int'>
type('str') # >>> <class 'str'>
type(None) # >>> <type(None) 'NoneType'>
# 指向函数或者类
type(abs) # >>>> <class 'builtin_function_or_method'>
type(a) # >>> <class '__main__.Animal'>
```

type可以用来比较两个变量的type是否相同. 

```py
>>> type(123)==type(456)
True
>>> type(123)==int
True
>>> type('abc')==type('123')
True
>>> type('abc')==str
True
>>> type('abc')==type(123)
False


# 使用一些内部定义的敞亮
>>> import types
>>> def fn():
...     pass
...
>>> type(fn)==types.FunctionType
True
>>> type(abs)==types.BuiltinFunctionType
True
>>> type(lambda x: x)==types.LambdaType
True
>>> type((x for x in range(10)))==types.GeneratorType
True
```

对于class的继承关系, 我们使用`ininstance()`函数: 

```py
# 假定继承关系: object -> Animal -> Dog -> Husky

a = Animal()
d = Dog()
h = Husky()

isinstance(h, Husky) # >>>true
...
```

使用`dir()`可以获得一个对象的所有属性和方法: 

```py
dir('ABC')
# >>> ['__add__', '__class__',..., '__subclasshook__', 'capitalize', 'casefold',..., 'zfill']
```

### __slots__

动态语言可以在运行过程中给class添加属性和方法. 如果我们要限制这种行为可以通过特殊的`__slots__`变量: 

```py
class Student(object):
    __slots__ = ('name', 'age') # 用tuple定义允许绑定的属性名称
```

运行如下: 

```py
>>> s = Student() # 创建新的实例
>>> s.name = 'Michael' # 绑定属性'name'
>>> s.age = 25 # 绑定属性'age'
>>> s.score = 99 # 绑定属性'score'
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
AttributeError: 'Student' object has no attribute 'score'
```

有一点: `__slots__`定义的属性仅对当前类实例起作用, 对继承的子类是不起作用的, 除非子类中也定义了`__slots__`, 那么子类实例允许定义的属性就是自身的`__slots__`加上父类的`__slots__`. 

### 使用@property

`@property`是一种内置的装饰器, 复杂吧一个方法变成属性调用: 

```py
class Student(object):

    @property
    def score(self):
        return self._score

    @score.setter
    def score(self, value):
        if not isinstance(value, int):
            raise ValueError('score must be an integer!')
        if value < 0 or value > 100:
            raise ValueError('score must between 0 ~ 100!')
        self._score = value
```

这样就可以对暴露出去的属性进行一定的限制. 

如果我们之定义了getter(@property)而不定义setter(@score.setter), 那么该属性就变成了一个只读属性. 

```py
class Student(object):

    @property
    def birth(self):
        return self._birth

    @birth.setter
    def birth(self, value):
        self._birth = value

    @property
    def age(self):
        return 2015 - self._birth
```

上面的代码中. `birth`就是可读写的, `age`就是只读的. 

### 多重继承

通过多重继承, 一个子类就可以同时获得多个父类的所有功能: 

```py
class Dog(Mammal, RunnableMixIn, CarnivorousMixIn):
    pass
```

这就是混入(MixIn), MixIn的目的就是给一个类增加多个功能, 这样, 在设计类的时候, 优先考虑通过多继承很来组合功能, 而不是设计复杂的继承关系. 

python多乘继承遵循C3拓扑排序算法. 

### 其他特殊成员

我们已经知道了`__slote__`和`__len__`这两个特殊成员. 现在来介绍一些其他的: 

#### `__str__`

`print()`打印输出对象, 就会调用对象的`__str__`属性. 如果不用`print`, 就会调用`__repr__`属性: 

```py
class Student(object):
    def __init__(self, name):
        self.name = name
    def __str__(self):
        return 'Student object (name=%s)' % self.name
    __repr__ = __str__

print(Student('Michael'))
# >>> Student object (name: Michael)

s = Student('Michael')
s
# >>> Student object (name: Michael)
```

#### `__iter__`

如果一个类想被用于`for...in`循环, 就必须实现一个`__iter__()`方法, 该方法返回一个迭代对象, 然后for循环就会不断调用该迭代对象的`__next__()`方法拿到循环的下一个值, 直到`Stopiteration`. 

```py
class Fib(object):
    def __init__(self):
        self.a, self.b = 0, 1 # 初始化两个计数器a，b

    def __iter__(self):
        return self # 实例本身就是迭代对象，故返回自己

    def __next__(self):
        self.a, self.b = self.b, self.a + self.b # 计算下一个值
        if self.a > 100000: # 退出循环的条件
            raise StopIteration()
        return self.a # 返回下一个值
```

#### `__getitem__`

我们使用`__iter__`构造了一个类似list, 但还不能想list一样通过`[]`拿到元素, 这时就需要借助定义`__getitem()`方法:

```py
class Fib(object):
    def __getitem__(self, n):
        a, b = 1, 1
        for x in range(n):
            a, b = b, a + b
        return a

f = Fib()

f[0] # >>> 1
```

我们来模拟实现简单的切片方法:

```py
class Fib(object):
    def __getitem__(self, n):
        if isinstance(n, int): # n是索引
            a, b = 1, 1
            for x in range(n):
                a, b = b, a + b
            return a
        if isinstance(n, slice): # n是切片
            start = n.start
            stop = n.stop
            if start is None:
                start = 0
            a, b = 1, 1
            L = []
            for x in range(stop):
                if x >= start:
                    L.append(a)
                a, b = b, a + b
            return L

f = Fib()
f[0:5]　# >>> [1, 1, 2, 3, 5]
```


#### `__getattr__`

正常情况下, 当我们调用类不存在的方法或属性时, 会报一个错误. 我们可以写一个`__getattr__`来动态返回一个属性. 

```py
class Student(object):

    def __init__(self):
        self.name = 'Michael'

    def __getattr__(self, attr):
        if attr=='score':
            return 99
```

这时, 如果试图调用`score`, 解释器会调用`__getattr__(self,'score')`来获取属性. 对于函数也一样. 

#### `__call__`

我们通过定义`__call__()`方法对实例进行调用: 

```py
class Student(object):
    def __init__(self, name):
        self.name = name

    def __call__(self):
        print('My name is %s.' % self.name)



s = Student('Michael')
s() # self参数不要传入
# >>> My name is Michael.
```

如何判断一个变量是对象还是函数? 更多的时候, 我们判断的是一个变量能否被调用: 

```py
>>> callable(Student())
True
>>> callable(max)
True
>>> callable([1, 2, 3])
False
>>> callable(None)
False
>>> callable('str')
False
```

### 枚举类

定义月份: 

```py
from enum import Enum

Month = Enum('Month', ('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'))
```

除了直接`Month.Jan`来引用一个常量, 或者枚举所有成员: 

```py
for name, member in Month.__members__.items():
    print(name, '=>', member, ',', member.value)
```

`value`属性自动赋给成员的`int`常量, 默认从`1`开始计数. 

```py
Jan => Month.Jan , 1
Feb => Month.Feb , 2
Mar => Month.Mar , 3
Apr => Month.Apr , 4
May => Month.May , 5
Jun => Month.Jun , 6
Jul => Month.Jul , 7
Aug => Month.Aug , 8
Sep => Month.Sep , 9
Oct => Month.Oct , 10
Nov => Month.Nov , 11
Dec => Month.Dec , 12
```

### type()

动态语言和静态语言最大的不同, 就是函数和类的定义不是在编译时定义的, 而是运行时动态创建的. 

```py
class Hello(object):
    def hello(self, name='world'):
        print('Hello, %s.' % name)
```

当python解释器载入`hello`模块时吗就会一次执行该模块的所有语句, 执行结果就是动态创建出一个`Hello`的class对象

`type()`函数可以查看一个类型或变量的类型. 此外, `type()`含税还能创建出新的类型, 我们可以用这个函数创建出`Hello`类, 而无需通过`class`定义: 

```py
>>> def fn(self, name='world'): # 先定义函数
...     print('Hello, %s.' % name)
...
>>> Hello = type('Hello', (object,), dict(hello=fn)) # 创建Hello class
>>> h = Hello()
>>> h.hello()
Hello, world.
>>> print(type(Hello))
<class 'type'>
>>> print(type(h))
<class '__main__.Hello'>
```

创建一个class, `type()`函数依次传入三个参数: 

1. class名称
2. 继承的父类集合
3. class的方法名称与函数绑定, 这里我们把fn绑定能够到hello上

通过`type()`创建的函数和直接写的class是完全一致的. 因为python解释器遇到class定义也是这样创建的. 


#### metaclass

除了使用`type()`动态创建类以外, 要控制类的创建行为, 还可以使用metaclass(元类). 

当我们定义了类以后, 就可以根据这个类创建出实例, 所以: 先定义类, 然后创建实例. 

如果我们想创建出类, 则必须根据metaclass创建出类, 所以: 先定义metaclass, 然后创建类, 最后创建实例. 

metaclass允许你创建类或者修改类. 换句话说, 可以把类看成metaclass创建出来的"实例". 

先看一个简单的例子, 这个metaclass给我们自定义的MyList增加一个`add`方法: 

定义`ListMetaclass, 这是默认习惯, metaclass类名总以Metaclass结尾, 以便清除的表示这是一个metaclass

```py
# metaclass是类的模板，所以必须从`type`类型派生：
class ListMetaclass(type):
    def __new__(cls, name, bases, attrs):
        attrs['add'] = lambda self, value: self.append(value)
        return type.__new__(cls, name, bases, attrs)
```

有了`ListMetaclass`, 我们在定义类的时候还要指示使用`Listmetaclass`来定制类, 传入管啊镜子参数`metaclass`:

```py
class MyList(list, metaclass=ListMetaclass):
    pass
```

当我们传入关键字参数`metaclass`时, 它指示python解释器在创建`Mylist`时, 要通过`ListMetaclass.__new__()`来创建爱你, 在此, 我们可以修改类的定义, 比如, 加上新的方法, 然后, 返回修改后的定义. 

`__new__()`方法接收到的参数依次是: 

1. 当前准备创建的类的对象;
2. 类的名字
3. 类继承的父类集合
4. 类的方法集合

所以`Mylist`上面可以调用`add()`方法, 而普通的`list`没有`add()`方法. 

这种动态修改有什么意义呢?  ORM是一个典型的例子. 

ORM(Object Relactional Mapping), 即对象-关系映射, 就是把关系数据库的一行映射为一个对象, 也就是一个类对应一个表, 这样写代码更简单, 不用直接操作SQL语句. 

要编写一个ORM框架, 所有的类都只能动态定义, 因为只有使用者才能根据表的结构定义出对应的类来. 

下面我们稍微尝试一下: 

第一步, 把接口调用写出来. 

```py
class User(Model):
    # 定义类的属性到列的映射：
    id = IntegerField('id')
    name = StringField('username')
    email = StringField('email')
    password = StringField('password')

# 创建一个实例：
u = User(id=12345, name='Michael', email='test@orm.org', password='my-pwd')
# 保存到数据库：
u.save()
```

其中, 父类`Model`和属性类型`StringField`,`IntegerField`是由ORM框架提供的, 剩下的魔术方法`save()`等, 全部由metaclass完成. 这样, 实现复杂, 但是调用简单. 

首先来定义`Field`类, 负责保存数据库表的字段名和字段类型: 

```py
class Field(object):

    def __init__(self, name, column_type):
        self.name = name
        self.column_type = column_type

    def __str__(self):
        return '<%s:%s>' % (self.__class__.__name__, self.name)
```

定义不同类型的`Field`: 

```py
class StringField(Field):

    def __init__(self, name):
        super(StringField, self).__init__(name, 'varchar(100)')

class IntegerField(Field):

    def __init__(self, name):
        super(IntegerField, self).__init__(name, 'bigint')
```

编写`ModelMetaclass`: 

```py
class ModelMetaclass(type):

    def __new__(cls, name, bases, attrs):
        if name=='Model':
            return type.__new__(cls, name, bases, attrs)
        print('Found model: %s' % name)
        mappings = dict()
        for k, v in attrs.items():
            if isinstance(v, Field):
                print('Found mapping: %s ==> %s' % (k, v))
                mappings[k] = v
        for k in mappings.keys():
            attrs.pop(k)
        attrs['__mappings__'] = mappings # 保存属性和列的映射关系
        attrs['__table__'] = name # 假设表名和类名一致
        return type.__new__(cls, name, bases, attrs)
```



基类`Model`:

```py
class Model(dict, metaclass=ModelMetaclass):

    def __init__(self, **kw):
        super(Model, self).__init__(**kw)

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(r"'Model' object has no attribute '%s'" % key)

    def __setattr__(self, key, value):
        self[key] = value

    def save(self):
        fields = []
        params = []
        args = []
        for k, v in self.__mappings__.items():
            fields.append(v.name)
            params.append('?')
            args.append(getattr(self, k, None))
        sql = 'insert into %s (%s) values (%s)' % (self.__table__, ','.join(fields), ','.join(params))
        print('SQL: %s' % sql)
        print('ARGS: %s' % str(args))
```

当用户定义一个`class User(Model)`时, python解释器首先在当前类`User`的定义中查找`metaclass`, 如果没有找到, 就继续在父类`Model`中查找`metaclass`, 找到了, 就是用`model`中定义的`ModelMetaclass`来创建`User`, 这里说明metaclass可以隐式的继承. 

`ModelMetaclass`执行了这样几件事: 

1. 排除掉对`Model`类的修改;
2. 在当前类中查找定义的类的所有属性, 如果找到一个field属性,就保存到`__mapping__`的dict中, 同时从类属性中删除该Field属性, 否则, 容易造成运行时错误.
3. 把表名保存到`__table__`中, 这里简化为表名默认为类名. 

编写示例: 

```py
u = User(id=12345, name='Michael', email='test@orm.org', password='my-pwd')
u.save()

'''
输出如下:　

Found model: User
Found mapping: email ==> <StringField:email>
Found mapping: password ==> <StringField:password>
Found mapping: id ==> <IntegerField:uid>
Found mapping: name ==> <StringField:username>
SQL: insert into User (password,email,username,id) values (?,?,?,?)
ARGS: ['my-pwd', 'test@orm.org', 'Michael', 12345]
'''
```