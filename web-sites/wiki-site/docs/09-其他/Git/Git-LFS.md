# Git-LFS


## 什么是 Git LFS

`git`是分布式版本控制系统. 对于包含大文件, 初始克隆需要大量的时间, 因为客户端会下载每个文件的每个版本. Git LFS(Large File Storage)是由开源贡献者开发的Git扩展, 通过延迟(lazily)下载大文件的相关版本来减少大文件在仓库中的影响, 具体来说, 大文件是在`checkout`的过程中下载的, 而不是`clone`或者`fetch`过程中下载的. 

> 这意味着你在后代定时fetch远端仓库到本地的时候, 并不会下载大文件内容, 而是在你checkout到工作区的时候才会真正去下载大文件的内容. 

Git LFS 通过将仓库中的大文件替换为微小的指针(pointer)文件来做到这一点, 这对于使用者无感, 而是由Git LFS自动处理:

1. 当你`git add`一个文件到仓库的时候, Git LFS用一个指针替换其内容, 并将文件内容存储在本地的 Git LFS 缓存中(.git/lfs/objects)

![image](/assets/2021-3-9/640.png)

2. 当你推送新的提交到服务器的时候, 新推送的提交引用的所有Git LFS文件都会从本地Git LFS缓存传输到绑定到Git仓库的远程Git LFS存储(也就是说, LFS文件内容会直接从本地的GitLFS缓存直接传输到远程的GitLFS存储服务器)

3. 当你checkout一个包含Git LFS存储指针的提交时, 执政文件将替换为本地Git LFS缓存中的文件, 或者从远程的Git LFS存储区下载.

**关于LFS的指针文件:**  

LFS的指针是一个文本文件, 存储在Git仓库中, 对应大文件的内容存储在LFS服务器里面, 而不是Git仓库中, 下面是一个为图片LFS文件的指针文件内容:

```
version https://git-lfs.github.com/spec/v1
oid sha256:5b62e134d2478ae0bbded57f6be8f048d8d916cb876f0656a8a6d1363716d999
size 285
```

指针文件很小, 小于1kb, 其格式为`key-value`. 第一行为指针文件规范URL, 第二行为文件的对象ID, 也就是LFS文件存储对象文件的名称, 可以在`.git/lfs/objects`目录中找到该文件的存储对象, 第三行为文件的实际大小. 所有的指针文件都是这种格式的. 

Git LFS是无缝的: 你在你的工作区中, 你只会看到实际的文件内容. 这意味着你不需要更改现有的git工作流程. 只需要常规的今次那个`git checkout`, 编辑文件, `git add`和`git commit`. 并且在`pull`和`clone`的时候会变的更快. 

为了使用 Git LFS 你需要一个支持Git LFS的服务器, 比如Github, GitLab. 仓库用户将需要安装Git LFS命令行客户端, 或者支持Git LFS的GUI. 

## 安装Git LFS

有三种简单的方法来安装Git LFS:

1. 用包管理器安装, 比如`homebrew`, `macports`, `dnf`以及`pakcagecloud`
2. 从项目网站下载并安装Git LFS
3. 安装SOurceTree, 它捆绑了Git LFS

安装完成一周, 请运行`git lfs install`来初始化`git lfs`.(`sourcetree`可以忽略这一步)

```sh
$ git lfs install
Updated pre-push hook.
Git LFS initialized.
```

创建完`Git LFS`会在你的仓库中安装一个特殊的`pre-push`git 钩子, 该钩子会在执行`git push`的时候触发, 传输Git LFS文件到服务器上. 

## 加快克隆速度

如果你正在克隆包含大量lfs文件的仓库, 显示的使用`git lfs clone`可以提供更好的性能

```sh
$ git lfs clone git@bitbucket.org:tpettersen/Atlasteroids.git
Cloning into 'Atlasteroids'...
remote: Counting objects: 156, done.
remote: Compressing objects: 100% (154/154), done.
remote: Total 156 (delta 87), reused 0 (delta 0)
Receiving objects: 100% (156/156), 54.04 KiB | 0 bytes/s, done.
Resolving deltas: 100% (87/87), done.
Checking connectivity... done.
Git LFS: (4 of 4 files) 1.14 MB / 1.15 MB
```

`git lfs clone`不会一次下载一个Git LFS文件, 而是等到`checkout`完成后再批量下载所有必须的git lfs文件. 这利用了并行下载的优势, 并且显著减少了产生的http请求和进程的数量. 

## 加快拉取速度

`git lfs pull`命令批量下载Git LFS文件. 如果你知道子上次拉去以来已经更改了大量文件, 不妨显示的用`git ifs pull`来批量下载. 

也可以禁用在检出期间自动下载Git LFS, 这可以通过在调用`git pull`的时候用`-c`覆盖配置来完成:

```sh
git -c filter.lfs.smudge= -c filter.lfs.required=false pull && git lfs pull
```

由于命令较为复杂, 可以创建一个简单的别名:

```sh
$ git config --global alias.plfs "\!git -c filter.lfs.smudge= -c filter.lfs.required=false pull && git lfs pull"
$ git plfs
```

## 使用Git LFS跟踪文件

当向仓库中添加新的大文件类型时, 你需要通过使用`git lfs track`命令指定一个模式来高速`Git LFS`对齐进行跟踪:

```sh
$ git lfs track "*.ogg"
Tracking *.ogg
```

注意这里的引号很重要, 省略他们会导致通配符给`shell`扩展, 并将为当前目录中的每个`.ogg`文件创建单独的条目:

```sh
$ git lfs track *.ogg
Tracking explode.ogg
Tracking music.ogg
Tracking phaser.ogg
```

Git LFS 支持的模式与.gitignore 支持的模式相同

```sh
# track all .ogg files in any directory
$ git lfs track "*.ogg"
# track files named music.ogg in any directory
$ git lfs track "music.ogg"
# track all files in the Assets directory and all subdirectories
$ git lfs track "Assets/"
# track all files in the Assets directory but *not* subdirectories
$ git lfs track "Assets/*"
# track all ogg files in Assets/Audio
$ git lfs track "Assets/Audio/*.ogg"
# track all ogg files in any directory named Music
$ git lfs track "**/Music/*.ogg"
# track png files containing "xxhdpi" in their name, in any directory
$ git lfs track "*xxhdpi*.png
```

不过不支持`.gitignore`那样的负模式. 

运行`git lfs track`后，会创建`.gitattributes`。

`gitattributes`是一种 Git 机制，用于将特殊行为绑定到某些文件模式。

Git LFS 自动创建或更新.gitattributes 文件，以将跟踪的文件模式绑定到 Git LFS 过滤器。但是，你需要将对.gitattributes 文件的任何更改自己提交到仓库：

```sh
$ git add .gitattributes
$ git diff --cached
diff --git a/.gitattributes b/.gitattributes
new file mode 100644
index 0000000..b6dd0bb
--- /dev/null
+++ b/.gitattributes
@@ -0,0 +1 @@
+*.ogg filter=lfs diff=lfs merge=lfs -text
$ git commit -m "Track ogg files with Git LFS"
```

## 提交和推送

可以用常规的办法提交并推送到包含Git LFS内容的仓库. 如果你已经提交了给Git LFS跟踪的文件的变更, 则当Git LFS内容传输到服务器的时候, 你会从`git push`中看到一些其他的输出:

```sh
$ git push
Git LFS: (3 of 3 files) 4.68 MB / 4.68 MB
Counting objects: 8, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (8/8), done.
Writing objects: 100% (8/8), 1.16 KiB | 0 bytes/s, done.
Total 8 (delta 1), reused 0 (delta 0)
To git@bitbucket.org:tpettersen/atlasteroids.git
7039f0a..b3684d3 master -> master
```

推送失败也无妨, Git LFS与Git一样, 其存储都是内容寻址的: 内容更具密钥存储, 该密钥是内容本身的SHA-256哈希. 这意味着反复尝试都是安全的

## 主机间移动

从一个托管切换到另一个托管, 可以结合使用指定了`-all`选项的`git lfs fetch`和`git ifs push`命令

例如, 要将所有Git和Git LFS仓库从名为`github`迁移到`bitbucket`:

```sh
# create a bare clone of the GitHub repository
$ git clone --bare git@github.com:kannonboy/atlasteroids.git
$ cd atlasteroids
# set up named remotes for Bitbucket and GitHub
$ git remote add bitbucket git@bitbucket.org:tpettersen/atlasteroids.git
$ git remote add github git@github.com:kannonboy/atlasteroids.git
# fetch all Git LFS content from GitHub
$ git lfs fetch --all github
# push all Git and Git LFS content to Bitbucket
$ git push --mirror bitbucket
$ git lfs push --all bitbucket
```

## 额外的Git LFS历史记录

```sh
$ git lfs fetch --recent
Fetching master
Git LFS: (0 of 0 files, 14 skipped) 0 B / 0 B, 2.83 MB skipped Fetching recent branches within 7 days
Fetching origin/power-ups
Git LFS: (8 of 8 files, 4 skipped) 408.42 KB / 408.42 KB, 2.81 MB skipped
Fetching origin/more-music
Git LFS: (1 of 1 files, 14 skipped) 1.68 MB / 1.68 MB, 2.83 MB skipped
```

Git LFS 会考虑包含最近提交超过 7 天的提交的任何分支或标签。你可以通过设置`lfs.fetchrecentrefsdays`属性来配置被视为最近的天数：

```sh
# download Git LFS content for branches or tags updated in the last 10 days
$ git config lfs.fetchrecentrefsdays 10
```

默认情况下，git lfs fetch --recent 将仅在最近分支或标记的最新提交下载 Git LFS 内容。

## 删除本地的Git LFS

```sh
$ git lfs prune
✔ 4 local objects, 33 retained
Pruning 4 files, (2.1 MB)
✔ Deleted 4 files
```

这会删除所有被认为是旧的本地Git LFS文件. 旧文件是以下未被引用的任何文件:

- 当前检出的提交
- 尚未推送的提交
- 最近一次提交

默认情况下, 最近的提交是最近10天内创建的任何提交. 通过添加已下的内容计算得出:

- 获取额外的Git LFS历史记录中讨论的`lfs.fetchrecentrefsdays`属性的值
- `lfs.pruneoffsetdays`属性的值

你可以配置 prune 偏移量以将 Git LFS 内容保留更长的时间：

```sh
# don't prune commits younger than four weeks (7 + 21)
$ git config lfs.pruneoffsetdays 21
```

与Git内置的垃圾收集不同, Git LFS内容不会自动修建, 因此定期的运行git lfs prune是保持本地仓库大小减小的好方法

你可以使用 git lfs prune --dry-run 来测试修剪操作将产生什么效果：

```sh
$ git lfs prune --dry-run
✔ 4 local objects, 33 retained
4 files would be pruned (2.1 MB)
```

以及使用`git lfs prune --verbose --dry-run`命令精确查看哪些 Git LFS 对象将被修剪：

```sh
$ git lfs prune --dry-run --verbose
✔ 4 local objects, 33 retained
4 files would be pruned (2.1 MB)
* 4a3a36141cdcbe2a17f7bcf1a161d3394cf435ac386d1bff70bd4dad6cd96c48 (2.0 MB)
* 67ad640e562b99219111ed8941cb56a275ef8d43e67a3dac0027b4acd5de4a3e (6.3 KB)
* 6f506528dbf04a97e84d90cc45840f4a8100389f570b67ac206ba802c5cb798f (1.7 MB)
* a1d7f7cdd6dba7307b2bac2bcfa0973244688361a48d2cebe3f3bc30babcf1ab (615.7 KB)
```

作为附加的安全检查，你可以使用--verify-remote 选项在删除之前，检查远程 Git LFS 存储区是否具有你的 Git LFS 对象的副本：

```sh
$ git lfs prune --verify-remote
✔ 16 local objects, 2 retained, 12 verified with remote
Pruning 14 files, (1.7 MB)
✔ Deleted 14 files
```

这会使得修剪过程变慢, 但是可以从服务器上恢复所有修剪的对象, 可以通过全局配置`lfs.pruneverifyremotealways`属性为系统永久启用--verify-remote 选项：

```sh
$ git config --global lfs.pruneverifyremotealways true
```

或者，你可以通过省略上述命令中的--global 选项，仅对当前仓库启用远端校验。

## 删除远程的Git LFS文件

Git LFS 客户端不支持删除服务器上的文件, 如何删除取决于你的托管服务商

## 查找 Git LFS 对象

`git log --all -p -S`可以确定哪些引用提交了:

```sh
$ git log --all -p -S 3b6124b8b01d601fa20b47f5be14e1be3ea7759838c1aac8f36df4859164e4cc
commit 22a98faa153d08804a63a74a729d8846e6525cb0
Author: Tim Pettersen <tpettersen@atlassian.com>
Date: Wed Jul 27 11:03:27 2016 +1000
Projectiles and exploding asteroids
diff --git a/Assets/Sprites/projectiles-spritesheet.png
new file mode 100755
index 0000000..49d7baf
--- /dev/null
+++ b/Assets/Sprites/projectiles-spritesheet.png
@@ -0,0 +1,3 @@
+version https://git-lfs.github.com/spec/v1
+oid sha256:3b6124b8b01d601fa20b47f5be14e1be3ea7759838c1aac8f36df4859164e4cc
+size 21647


# find a particular object by OID in HEAD
$ git grep 3b6124b8b01d601fa20b47f5be14e1be3ea7759838c1aac8f36df4859164e4cc HEAD
HEAD:Assets/Sprites/projectiles-spritesheet.png:oid sha256:3b6124b8b01d601fa20b47f5be14e1be3ea7759838c1aac8f36df4859164e4cc
# find a particular object by OID on the "power-ups" branch
$ git grep e88868213a5dc8533fc9031f558f2c0dc34d6936f380ff4ed12c2685040098d4 power-ups
power-ups:Assets/Sprites/shield2.png:oid sha256:e88868213a5dc8533fc9031f558f2c0dc34d6936f380ff4ed12c2685040098d4
```

##  包含/排除 Git LFS 文件

可以用`-X`排除文件

```sh
$ git lfs fetch -X "Assets/**"
```

或者用`-I`包含指定的文件:

```sh
$ git lfs fetch -I "*.ogg,*.wav"
```

包含和排除一起使用, 会获得与包含匹配单与排除不匹配的文件, 比如获取`assets`目录中除了`gif`以外的所有文件:

```sh
$ git lfs fetch -I "Assets/**" -X "*.gif"
```

## 锁定 Git LFS文件

不幸的是，没有解决二进制合并冲突的简便方法。使用 Git LFS 文件锁定，你可以按扩展名或文件名锁定文件，并防止二进制文件在合并期间被覆盖

```sh
$ git lfs track "*.psd" --lockable
```

该命令即将PSD文件存储在LFS中, 又将他们标记为可锁定.

然后讲以下内容添加到`.gitattributes`文件中:

```
*.psd filter=lfs diff=lfs merge=lfs -text lockable
```

在准备对 LFS 文件进行更改时，你将使用 lock 命令以便将文件在 Git 服务器上注册为锁定的文件。

```sh
$ git lfs lock images/foo.psd
Locked images/foo.psd
```

也可以用`unlock`解除锁定:

```sh
$ git lfs unlock images/foo.psd
```

与 git push 类似，可以使用--force 标志覆盖 Git LFS 文件锁。除非你完全确定自己在做什么，否则不要使用--force 标志。

```sh
$ git lfs unlock images/foo.psd --force
```

