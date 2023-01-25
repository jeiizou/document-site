# Git-技巧

## 标准提交规范

提交的内容主要有三个部分:

- 标题行: 必填, 描述修改的类型和内容
- 主题内容: 描述为什么修改, 做了什么修改等
- 页脚注释: Closed Issues或者Breaking Changed

常用的修改项: 

- [feat]：新功能（feature）
- [fix]：修补bug
- [docs]：文档（documentation）
- [style]： 格式（不影响代码运行的变动）
- [refactor]：重构（即不是新增功能，也不是修改bug的代码变动）
- [test]：增加测试
- [chore]：构建过程或辅助工具的变动

## git 别名操作

简化命令

```sh
git config --global alias.<handle> <command>

比如：git status 改成 git st，这样可以简化命令

git config --global alias.st status
```

## 使用Commitizen代替git commit

全局安装:

```sh
npm install -g commitizen cz-conventional-changelog

echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc
```

之后使用`git cz`代替`git commit`就可以了. 

## 分支操作

分支相关的一些操作

### 快速切换到上一个分支

```sh
git checkout -
```

### 删除已经合并到master的分支

```sh
git branch --merged master | grep -v '^\*\|  master' | xargs -n 1 git branch -d
```

### 修改分支名称

```sh
git branch -m old_branch new_branch # 重命名本地分支
git push origin :old_branch # 删除旧分支
git push --set-upstream origin new_branch # 推送新分支到远程，并且本地分支进行跟踪
```

### 关联远程分支

```sh
git branch -u origin/mybranch
```

或者在push的时候加上`-u`参数:

```sh
git push origin/mybranch -u
```

### 远程删除了分支, 本地也想删除

```sh
git remote prune origin
```

### 从远程分支中创建并切换到本地分支

```sh
git checkout -b <branch-name> origin/<branch-name>
```

## 版本操作

### 重新设置第一个commit

把所有的改动都重新放回工作区, 并清空所有的commit, 这样就可以重新提交第一个commit了

```sh
git update-ref -d HEAD
```

### 回到远程仓库的状态

放弃本地的所有修改, 回到远程仓库的状态

```sh
git fetch --all && git reset --hard origin/master
```

### 合并commit节点

```sh
git log #获取目标commit的id
git rebase -i commitId #从该commit开始rebase，这里会进入vi模式
 # 根据提示对commit进行pick、fixup，或者squash
 # 修改完成后退出vi编辑器`:wq`
 # 如果修改为squash， git会自动跳转到commit message的编辑界面进行commit message的编辑
```

### 修改commit提交信息

```sh
git rebase -i commitId #从该commit开始rebase，这里会进入vi模式， 可以输入Head指针或者Root头指针
 # 进入编辑文件， 将想要修改的commit的前缀改为edit
 # ：wq 保存退出
git commit --amend
git rebase --contine
 # 交替使用这两个命令，依次修改对应的commit提交信息
git push -f origin # 强制推送到远程仓库， 覆盖分支提交信息
```

### 以新增一个commit的方式还原某个`commit`的修改

```sh
git revert <commit-id>
```

### 回到某个 commit 的状态，并删除后面的 commit

和revert的区别: reset命令会抹除某个commit id之后的所有commit

```sh
git reset <commit-id>  #默认就是-mixed参数。

git reset --mixed HEAD^  #回退至上个版本，它将重置HEAD到另外一个commit,并且重置暂存区以便和HEAD相匹配，但是也到此为止。工作区不会被更改。

git reset --soft HEAD~3  #回退至三个版本之前，只回退了commit的信息，暂存区和工作区与回退之前保持一致。如果还要提交，直接commit即可  

git reset --hard <commit-id>  #彻底回退到指定commit-id的状态，暂存区和工作区也会变为指定commit-id版本的内容
```

### 清除gitignore文件中记录的文件

```sh
git clean -X -f
```

## 状态查询

### 查看冲突文件列表

展示工作区的冲突文件列表

```sh
git diff --name-only --diff-filter=U
```

### 展示暂存区, 工作区和最近版本的区别

输出工作区, 暂存区和本地醉经版本的区别:

```sh
git diff HEAD
```

### 展示本地分支关联远程仓库的情况

```sh
git branch -vv
```

### 列出所有远程分支

```sh
git branch -r
```

### 查看某段代码是谁写的

```sh
git blame <file-name>
```

### 查看两周内的改动

```sh
git whatchanged --since='2 weeks ago'
```

### 展示简化的commit历史

```sh
git log --pretty=oneline --graph --decorate --all
```

## SubModule 相关操作
### 子模块的添加 

```sh
# 添加子模块
git submodule add <url> <path> 
```

添加成功后可以在`git status`命令下查看到`.gitmodules`文件中新增了子模块的路径


### 子模块的使用

```sh
# 下载子模块
git submodule init
git submodule update
# 或者
git submodule update --init --recursive
```

### 子模块的更新

进入子模块执行`git pull`进行更新, 查看`git log`查看相应提交. 

### 删除子模块

- `rm -rf 子模块目录`: 删除子模块目录及源码
- `vi .gitmodules`: 删除项目目录下`.gitmodules`文件中子模块相关条目
- `vi .git/config`: 删除配置项中子模块相关条目
- `rm .git/module/*`: 删除模块下的子模块目录, 每个子模块对应一个陌路

执行完成后, 再执行添加子模块的命令即可, 如果仍然报错, 可以执行:

```sh
git rm --cached <子模块名称>
```

## 参考链接

