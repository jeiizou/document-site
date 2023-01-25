# Shell语法速查


## 基础

- 解释器前缀：`#!/bin/bash`
- 运行的两种方式：
    - 运行脚本文件：

    ```sh
    chmod +x ./test.sh  #使脚本具有执行权限
    ./test.sh  #执行脚本
    ```

    - 运行解释器：

    ```sh
    /bin/sh test.sh
    /bin/php test.php
    ```
## 变量

### 定义变量

```sh
your_name="runoob.com"
```

规则:
- 命名只能有英文,数字,下划线, 不能以数字开头
- 中间不能有空格
- 不能使用关键字和标签符号

### 使用变量

```sh
your_name="qinjx"
echo $your_name
echo ${your_name}
```

外面的花括号是可选的. 花括号能帮助解释变量的边界. 


### 只读变量

```sh
#!/bin/bash
myUrl="http://www.google.com"
readonly myUrl
myUrl="http://www.runoob.com"

# 运行结果
# /bin/sh: NAME: This variable is read only.
```

### 删除变量

```sh
unset variable_name
```

### 变量类型

- 局部变量: 在局部脚本或命令中定义, 仅在当前shell实例中有效, 其他shell启动的程序不能访问局部变量
- 环境变量: 所有的程序, 包括shell启动的程序, 都能访问环境变量
- shell比那里能够: 有shell程序设置的特殊变量, 有一部分是环境变量一部分是局部变量

## 字符串

### 单引号

```sh
str='this is a string'
```

### 双引号

```sh
your_name='runoob'
str="Hello, I know you are \"$your_name\"! \n"
echo -e $str

# 输出结果
# Hello, I know you are "runoob"! 
```

双引号的优点: 可以有变量, 可以出现转义字符串. 

### 拼接字符串

```sh
your_name="runoob"
# 使用双引号拼接
greeting="hello, "$your_name" !"
greeting_1="hello, ${your_name} !"
echo $greeting  $greeting_1
# 使用单引号拼接
greeting_2='hello, '$your_name' !'
greeting_3='hello, ${your_name} !'
echo $greeting_2  $greeting_3
```

### 字符串长度

```sh
string="abcd"
echo ${#string} #输出 4
```

### 提取子字符串

```sh
string="runoob is a great site"
echo ${string:1:4} # 输出 unoo
```

### 查找子字符串

查找字符或o出现的位置

```sh
string="runoob is a great site"
echo `expr index "$string" io`  # 输出 4
```

## 数组

bash支持一维数组, 不支持多维数组, 并且没有限定数组的大小. 

### 定义数组

定义数组, 数组元素使用空格隔开:

```sh
数组名=(值1 值2 ... 值n)
```

例如:

```sh
# 方式1
array_name=(value0 value1 value2 value3)

# 方式2
array_name=(
value0
value1
value2
value3
)

# 方式3
array_name[0]=value0
array_name[1]=value1
array_name[n]=valuen
```

### 读取数组

```sh
${数组名[下标]}
```

例如:

```sh
valuen=${array_name[n]}
```

使用`@`符号可以获取数组中的所有元素:

```sh
valuen=${array_name[n]}
```

### 数组长度

```sh
# 取得数组元素的个数
length=${#array_name[@]}
# 或者
length=${#array_name[*]}
# 取得数组单个元素的长度
lengthn=${#array_name[n]}
```

## 注释

单行:

```sh
# 单行注释
```

多行注释:

```sh
:<<EOF
注释内容...
注释内容...
注释内容...
EOF

:<<'
注释内容...
注释内容...
注释内容...
'

:<<!
注释内容...
注释内容...
注释内容...
!
```

## 传递参数

执行脚本的时候可以向脚本传递参数, 获取参数的格式为`$n`, n代表一个数字. 

实例:

```sh
#!/bin/bash
# author:菜鸟教程
# url:www.runoob.com

echo "Shell 传递参数实例！";
echo "执行的文件名：$0";
echo "第一个参数为：$1";
echo "第二个参数为：$2";
echo "第三个参数为：$3";
```

运行脚本:

```sh
$ chmod +x test.sh 
$ ./test.sh 1 2 3
Shell 传递参数实例！
执行的文件名：./test.sh
第一个参数为：1
第二个参数为：2
第三个参数为：3
```

特殊字符用来处理参数:

| 参数处理 | 说明                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `$#`     | 参数个数                                                                                                                   |
| `$*`     | 以一个单字符串显示所有向脚本传递的参数,如"`$*`"用「"」括起来的情况、以"`$1 $2 … $n`"的形式输出所有参数。                     |
| `$$`       | 脚本运行的当前进程ID号                                                                                                     |
| `$!`     | 后台运行的最后一个进程的ID号                                                                                               |
| `$@`     | 与\$*相同，但是使用时加引号，并在引号中返回每个参数。如"`$@`"用「"」括起来的情况、以"`$1`" "`$2`" … "`$n`" 的形式输出所有参数。 |
| `$-`     | 显示Shell使用的当前选项，与set命令功能相同。                                                                               |
| `$?`     | 显示最后命令的退出状态。0表示没有错误，其他任何值表明有错误。                                                              |

### $* 与 $@ 区别

- 相同点: 都是引用所有参数
- 不同点: 只有在双引号中有体现, 假设在脚本运行时写了三个参数 1、2、3，，则 " * " 等价于 "1 2 3"（传递了一个参数），而 "@" 等价于 "1" "2" "3"（传递了三个参数）。

```sh
#!/bin/bash
# author:菜鸟教程
# url:www.runoob.com

echo "-- \$* 演示 ---"
for i in "$*"; do
    echo $i
done

echo "-- \$@ 演示 ---"
for i in "$@"; do
    echo $i
done
```

输出:

```sh
$ chmod +x test.sh 
$ ./test.sh 1 2 3
-- $* 演示 ---
1 2 3
-- $@ 演示 ---
1
2
3
```

## 运算符

### 算数运算符

假定a=10,b=20:

- `+`:	加法	`expr $a + $b` 结果为 30。
- `-`:	减法	`expr $a - $b` 结果为 -10。
- `*`:	乘法	`expr $a \* $b` 结果为  200。
- `/`:	除法	`expr $b / $a` 结果为 2。
- `%`:	取余	`expr $b % $a` 结果为 0。
- `=`:	赋值	a=$b 将把变量 b 的值赋给 a。
- `==`:	相等。  用于比较两个数字，相同则返回 true。	[ $a == $b ] 返回 false。
- `!=`:	不相等。用于比较两个数字，不相同则返回 true。	[ $a != $b ] 返回 true。

### 关系运算符

- `-eq`: 检测两个数是否相等，相等返回 true。	[ $a -eq $b ] 返回 false。
- `-ne`: 检测两个数是否不相等，不相等返回 true。	[ $a -ne $b ] 返回 true。
- `-gt`: 检测左边的数是否大于右边的，如果是，则返回 true。	[ $a -gt $b ] 返回 false。
- `-lt`: 检测左边的数是否小于右边的，如果是，则返回 true。	[ $a -lt $b ] 返回 true。
- `-ge`: 检测左边的数是否大于等于右边的，如果是，则返回 true。	[ $a -ge $b ] 返回 false。
- `-le`: 检测左边的数是否小于等于右边的，如果是，则返回 true。	[ $a -le $b ] 返回 true。

### 布尔运算符

- `!`:  非运算，表达式为 true 则返回 false，否则返回 true。	[ ! false ] 返回 true。
- `-o`:	或运算，有一个表达式为 true 则返回 true。	[ $a -lt 20 -o $b -gt 100 ] 返回 true。
- `-a`:	与运算，两个表达式都为 true 才返回 true。	[ $a -lt 20 -a $b -gt 100 ] 返回 false。


### 逻辑运算符

- `&&`:	逻辑的 AND	[[ $a -lt 100 && $b -gt 100 ]] 返回 false
- `||`:	逻辑的 OR	[[ $a -lt 100 || $b -gt 100 ]] 返回 true

### 字符串运算符

- `=`:	检测两个字符串是否相等，相等返回 true。	[ $a = $b ] 返回 false。
- `!=`:	检测两个字符串是否相等，不相等返回 true。	[ $a != $b ] 返回 true。
- `-z`:	检测字符串长度是否为0，为0返回 true。	[ -z $a ] 返回 false。
- `-n`:	检测字符串长度是否为0，不为0返回 true。	[ -n "$a" ] 返回 true。
- `$`:  检测字符串是否为空，不为空返回 true。	[ $a ] 返回 true。


### 文件测试运算符

- `-b file`:	检测文件是否是块设备文件，如果是，则返回 true。	[ -b $file ] 返回 false。
- `-c file`:	检测文件是否是字符设备文件，如果是，则返回 true。	[ -c $file ] 返回 false。
- `-d file`:	检测文件是否是目录，如果是，则返回 true。	[ -d $file ] 返回 false。
- `-f file`:	检测文件是否是普通文件（既不是目录，也不是设备文件），如果是，则返回 true。	[ -f $file ] 返回 true。
- `-g file`:	检测文件是否设置了 SGID 位，如果是，则返回 true。	[ -g $file ] 返回 false。
- `-k file`:	检测文件是否设置了粘着位(Sticky Bit)，如果是，则返回 true。	[ -k $file ] 返回 false。
- `-p file`:	检测文件是否是有名管道，如果是，则返回 true。	[ -p $file ] 返回 false。
- `-u file`:	检测文件是否设置了 SUID 位，如果是，则返回 true。	[ -u $file ] 返回 false。
- `-r file`:	检测文件是否可读，如果是，则返回 true。	[ -r $file ] 返回 true。
- `-w file`:	检测文件是否可写，如果是，则返回 true。	[ -w $file ] 返回 true。
- `-x file`:	检测文件是否可执行，如果是，则返回 true。	[ -x $file ] 返回 true。
- `-s file`:	检测文件是否为空（文件大小是否大于0），不为空返回 true。	[ -s $file ] 返回 true。
- `-e file`:	检测文件（包括目录）是否存在，如果是，则返回 true。	[ -e $file ] 返回 true。

其他检查符:

- `-S`: 判断文件是否socket
- `-L`: 检测文件是否存在并且是一个符号链接

示例:

```sh
#!/bin/bash
# author:菜鸟教程
# url:www.runoob.com

file="/var/www/runoob/test.sh"
if [ -r $file ]
then
   echo "文件可读"
else
   echo "文件不可读"
fi
if [ -w $file ]
then
   echo "文件可写"
else
   echo "文件不可写"
fi
if [ -x $file ]
then
   echo "文件可执行"
else
   echo "文件不可执行"
fi
if [ -f $file ]
then
   echo "文件为普通文件"
else
   echo "文件为特殊文件"
fi
if [ -d $file ]
then
   echo "文件是个目录"
else
   echo "文件不是个目录"
fi
if [ -s $file ]
then
   echo "文件不为空"
else
   echo "文件为空"
fi
if [ -e $file ]
then
   echo "文件存在"
else
   echo "文件不存在"
fi
```

## Echo 命令

1. 普通字符串

```sh
echo "It is a test"

# 或者
echo It is a test
```

2. 转译字符串

```sh
echo "\"It is a test\""
```

3. 变量

```sh
#!/bin/sh
read name 
echo "$name It is a test"
```

4. 换行

```sh
echo -e "OK! \n" # -e 开启转义
echo "It is a test"
```

5. 显示不换行

```sh
#!/bin/sh
echo -e "OK! \c" # -e 开启转义 \c 不换行
echo "It is a test"
```

6. 重定向到文件

```sh
echo "It is a test" > myfile
```

7. 原样输出(使用单引号)

```sh
echo '$name\"'
```

8. 显示命令执行结果

```sh
echo `date`
```

## printf

```sh
printf  format-string  [arguments...]
```

- format-string: 为格式控制字符串
- arguments: 参数列表

示例:

```sh
#!/bin/bash
 
printf "%-10s %-8s %-4s\n" 姓名 性别 体重kg  
printf "%-10s %-8s %-4.2f\n" 郭靖 男 66.1234 
printf "%-10s %-8s %-4.2f\n" 杨过 男 48.6543 
printf "%-10s %-8s %-4.2f\n" 郭芙 女 47.9876 
```

输出结果:

```sh
姓名     性别   体重kg
郭靖     男      66.12
杨过     男      48.65
郭芙     女      47.99
```

### 参数

- `\a`: 	警告字符，通常为ASCII的BEL字符
- `\b`: 	后退
- `\c`: 	抑制（不显示）输出结果中任何结尾的换行字符（只在%b格式指示符控制下的参数字符串中有效），而且，任何留在参数里的字符、任何接下来的参数以及任何留在格式字符串中的字符，都被忽略
- `\f`: 	换页（formfeed）
- `\n`: 	换行
- `\r`: 	回车（Carriage return）
- `\t`: 	水平制表符
- `\v`: 	垂直制表符
- `\\`: 	一个字面上的反斜杠字符
- `\ddd`:	    表示1到3位数八进制值的字符。仅在格式字符串中有效
- `\0ddd`:	    表示1到3位的八进制值字符

## Test 命令

Shell中的 test 命令用于检查某个条件是否成立，它可以进行数值、字符和文件三个方面的测试。

- `-eq`:	等于则为真
- `-ne`:	不等于则为真
- `-gt`:	大于则为真
- `-ge`:	大于等于则为真
- `-lt`:	小于则为真
- `-le`:	小于等于则为真


示例:

```sh
num1=100
num2=100
if test $[num1] -eq $[num2]
then
    echo '两个数相等！'
else
    echo '两个数不相等！'
fi
```

输出:

```sh
两个数相等！
```

### 字符串测试

- `=`:等于则为真
- `!=`:	不相等则为真
- `-z`: 字符串	字符串的长度为零则为真
- `-n`: 字符串	字符串的长度不为零则为真

### 文件测试

- `-e 文件名`:	如果文件存在则为真
- `-r 文件名`:	如果文件存在且可读则为真
- `-w 文件名`:	如果文件存在且可写则为真
- `-x 文件名`:	如果文件存在且可执行则为真
- `-s 文件名`:	如果文件存在且至少有一个字符则为真
- `-d 文件名`:	如果文件存在且为目录则为真
- `-f 文件名`:	如果文件存在且为普通文件则为真
- `-c 文件名`:	如果文件存在且为字符型特殊文件则为真
- `-b 文件名`:	如果文件存在且为块特殊文件则为真


## 流程控制

### if

```sh
if condition1
then
    command1
elif condition2 
then 
    command2
else
    commandN
fi
```

### for

```sh
for var in item1 item2 ... itemN
do
    command1
    command2
    ...
    commandN
done
```

### while

```sh
while condition
do
    command
done
```

### until

until 循环执行一系列命令直至条件为 true 时停止。

```sh
until condition
do
    command
done
```

### case

```sh
case 值 in
模式1)
    command1
    command2
    ...
    commandN
    ;;
模式2）
    command1
    command2
    ...
    commandN
    ;;
esac
```

### 跳出循环

- break: 跳出所有循环
- continue: 跳出当前循环


## 函数

```sh
[ function ] funname [()]

{

    action;

    [return int;]

}
```

1. 可以带function fun() 定义，也可以直接fun() 定义,不带任何参数。
2. 参数返回，可以显示加：return 返回，如果不加，将以最后一条命令运行结果，作为返回值。 return后跟数值n(0-255

示例:

```sh
#!/bin/bash

demoFun(){
    echo "这是我的第一个 shell 函数!"
}
echo "-----函数开始执行-----"
demoFun
echo "-----函数执行完毕-----"
```

输出:

```sh
-----函数开始执行-----
这是我的第一个 shell 函数!
-----函数执行完毕-----
```

### 函数参数

```sh
#!/bin/bash
# author:菜鸟教程
# url:www.runoob.com

funWithParam(){
    echo "第一个参数为 $1 !"
    echo "第二个参数为 $2 !"
    echo "第十个参数为 $10 !"
    echo "第十个参数为 ${10} !"
    echo "第十一个参数为 ${11} !"
    echo "参数总数有 $# 个!"
    echo "作为一个字符串输出所有参数 $* !"
}
funWithParam 1 2 3 4 5 6 7 8 9 34 73
```

## 输入/输出重定向

### 命令

- `command > file`	将输出重定向到 file。
- `command < file`	将输入重定向到 file。
- `command >> file`	将输出以追加的方式重定向到 file。
- `n > file`	将文件描述符为 n 的文件重定向到 file。
- `n >> file`	将文件描述符为 n 的文件以追加的方式重定向到 file。
- `n >& m`	将输出文件 m 和 n 合并。
- `n <& m`	将输入文件 m 和 n 合并。
- `<< tag`	将开始标记 tag 和结束标记 tag 之间的内容作为输入。

一般情况下，每个 Unix/Linux 命令运行时都会打开三个文件：

- 标准输入文件(stdin)：stdin的文件描述符为0，Unix程序默认从stdin读取数据。
- 标准输出文件(stdout)：stdout 的文件描述符为1，Unix程序默认向stdout输出数据。
- 标准错误文件(stderr)：stderr的文件描述符为2，Unix程序会向stderr流中写入错误信息。

默认情况下, `command > file`表示将stdout重定向到file, 如果希望使用stderr, 可以这样写:

```sh
command 2 > file
```

### Here Document

Here Document 是 Shell 中的一种特殊的重定向方式，用来将输入重定向到一个交互式 Shell 脚本或程序。

基本形式如下:

```sh
command << delimiter
    document
delimiter
```

它的作用是将两个 delimiter 之间的内容(document) 作为输入传递给 command。

注意:
- 结尾的delimiter 一定要顶格写，前面不能有任何字符，后面也不能有任何字符，包括空格和 tab 缩进。
- 开始的delimiter前后的空格会被忽略掉。

### /dev/null

如果希望执行某个命令，但又不希望在屏幕上显示输出结果，那么可以将输出重定向到 /dev/null：

```sh
command > /dev/null
```

这是一个页数的文件, 写入的内容都会被丢弃, 读取的内容永远为空. 可以使用这个实现禁止输出的效果, 例如屏蔽stdout和stderr:

```sh
$ command > /dev/null 2>&1
```

## 文件包含

shell可以包含外部脚本:

```sh
. filename   # 注意点号(.)和文件名中间有一空格

或

source filename
```

示例:

```sh
# test1.sh
#!/bin/bash

url="http://www.baidu.com"


# test2.sh
#!/bin/bash

#使用 . 号来引用test1.sh 文件
. ./test1.sh

# 或者使用以下包含文件代码
# source ./test1.sh

echo "地址: $url"
```


注意: 被包含的文件 test1.sh 不需要可执行权限。