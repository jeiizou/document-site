# Git-原理


> 本文来自(稍有整理): https://zhuanlan.zhihu.com/p/96631135?utm_source=cn.ticktick.task&utm_medium=social&utm_oi=46613825323008


## Git的信息存储方式

### add 暂存区

我们知道, git的文件系统中大致有三种状态: 工作区, 暂存区(下文的Index 索引区域)和版本库. 

假定有一个简单的git工作目录刚初始化结束, 然后我们创建两个文件提交到暂存区:

```sh
$ git init
$ echo '111' > a.txt
$ echo '222' > b.txt
$ git add *.txt
```

Git 会将整个数据库存在`.git/`目录下, 并且在`.git/objects`目录下创建两个`object`:

```sh
$ tree .git/objects
.git/objects
├── 58
│   └── c9bdf9d017fcd178dc8c073cbfcbb7ff240d6c
├── c2
│   └── 00906efd24ec5e783bee7f23b5d7c941b0c12c
├── info
└── pack
```

打开其中一个object, 输出的是一串乱码:

```sh
$ cat .git/objects/58/c9bdf9d017fcd178dc8c073cbfcbb7ff240d6c
xKOR0a044K%
```

实际上, Git将信息压缩成二进制文件. 可以通过`git cat-file [-t] [-p]`, `-t`可以查看`object`的类型, `-p`可以查看`object`的具体内容.

```sh
$ git cat-file -t 58c9
blob
$ git cat-file -p 58c9
111
```

这里的object是一种blob类型的节点, 内容为`111`, 也就是说这个`object`存储着`a.txt`文件的内容. 

bloc类型只存储文件内容, 不包括文件名等其他信息, 这些信息经过SHA1哈希算法得到对应的哈希值`58c9bdf9d017fcd178dc8c073cbfcbb7ff240d6c`, 作为这个object在git仓库中的唯一身份认定.


### commit 版本库

我们继续, 创建一个`commit`:

```sh
$ git commit -am '[+] init'
$ tree .git/objects
.git/objects
├── 4c
│   └── aaa1a9ae0b274fba9e3675f9ef071616e5b209
├── c1
│   └── a85702d7606ab4d2829b422403f116939caaaf
...
```

这个时候多出了两个object, 同样使用`cat-file`命令看那看那分别是什么类型以及具体的内容:

```sh
$ git cat-file -t 4caa
tree

$ git cat-file -p 4caa
100644 blob 58c9bdf9d017fcd178dc8c073cbfcbb7ff240d6c    a.txt
100644 blob c200906efd24ec5e783bee7f23b5d7c941b0c12c    b.txt
```

这里出现了第二种Git Object类型: tree. 它将当前的目录接口打了一个快照, 从存储的内容来看, 存储了一个目录接口, 以及每一个文件的权限, 类型, 对应的SHA1值, 以及文件名称.

看看另一个文件:

```sh
$ git cat-file -t c1a8
commit

$ git cat-file -p c1a8
tree 4caaa1a9ae0b274fba9e3675f9ef071616e5b209     
author j_pc <997282173@qq.com> 1578406497 +0800   
committer j_pc <997282173@qq.com> 1578406497 +0800

[+] init
```

这里出现了第三种Git Object类型: commit. 它存储的是一个提交的信息, 包括对应目录接口的快照tree的hash值, 上一个提交的哈希值(由于是第一个提交, 所以没有父节点, 在一个merge提交中还会出现多个父节点), 提交的作者以及提交的具体时间, 最后是该提交的信息. 

三者的关系大致如下:

![image](/assets/2021-3-9/git_1.jpg)

到这里一个commit提交的步骤就完整了, 但是分支的信息存储却还没有明确. 实际上, 在Git仓库中, HEAD, 分支, 普通的tag可以简单的理解为一个指针, 指向对应commit的SHA1值.

```sh
$ cat .git/HEAD
ref: refs/heads/master

$ cat .git/refs/heads/master
0c96bfc59d0f02317d002ebbf8318f46c7e47ab2
```

如下图所示:

![image](/assets/2021-3-9/git_2.jpg)

实际上还有第四种Git Object: tag. 在添加含辅助的tag(git tag -a)的时候会新建. 

Git的存储结构本质上是一个 **key-value的数据库加上默克尔树形成的有向无环图(DAG)** . 

### 三个分区

Git的三个分区分别是工作区, 暂存区以及版本库. 

目前的仓库状态如下:

![image](/assets/2021-3-9/git_3.jpg)

这三个区域分别存储的信息是:

- 工作区: 操作系统上的文件, 所有的代码编辑都在这里完成
- 索引区(暂存区): 这里的代码会在下一次commit提交到git仓库
- 版本库(Git仓库): 有Git Object记录每一次提交的快照, 以及链式结构的提交变更历史.

整个提交过程如下动图所示:

![image](/assets/2021-3-9/git_4.gif)

上文便是最基本的一个commit过程中的git内部的文件存储过程了. 后续准备整理一下其他过程, 比如分支, rebase, reset, 和一些高级操作.