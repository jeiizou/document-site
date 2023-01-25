# Git-GitFlow

git flow 是一种基于 git 开发的分支管理规范.

## 分支

-   master 分支存放所有正式发布的版本, 作为项目的历时版本记录分支, 不直接提交代码, 仅用于保持一个对应线上运行代码的 code base
-   develop 分支为主开发分支, 一般不直接提交代码
-   feature 分支为新功能分支, feature 分支基于 develop 创建, 开发完成后合并到 develop 分支上, 同时存在多个
-   release 分支基于最新的 develop 分支创建, 当新功能足够发布一个新版本, 从 develop 分支创建一个 release 分支作为新版本的起点, 用于测试, 所有的测试 bug 在这个分支修改. 修改完成后合并到 master 并打上版本号, 同时也合并到 develop, 作为最新开发分支. (一旦 release 之后不要从 develop 分支上合并新的改动到 release 分支), 同一时间只有 1 个, 生命周期短, 只是为了发布
-   hotfix 分支基于 master 分支创建, 对于线上版本的 bug 进行修复, 完成后直接合并到 master 分支和 develop 分支, 如果当前还有新功能 release 分支, 也同步到 release 分支 , 同时间只能有一个, 生命周期较短.

![image](/assets/2021-3-9/gitflow.png)

## git flow 命令

### init

-   `git flow init`: 初始化一个现有的 git 库, 将会设置一些初始参数, 例如分支前缀等, 建议使用默认值

### feature

-   `git flow feature start [featureBranchName]`: 创建一个基于 develop 的 feature 分支, 并切换到这个分支之下
-   `git flow feature finish [featureBranchName]`: 开发完成开发新分支, 合并 MYFEATURE 分支到 'develop', 删除这个新特性分支, 切换回 'develop' 分支。
-   `git flow feature publish [featureBranchName]`: 发布新特性分支到远程服务器，也可以使用 git 的 push 命令
-   `git flow feature pull origin [featureBranchName]`: 取得其它用户发布的新特性分支，并签出远程的变更。也可以使用 git 的 pull 命令
-   `git flow feature track [featureBranchName]`:跟踪在 origin 上的 feature 分支。

### release

-   `git flow release start [releaseBranchName]`: 开始准备 release 版本，从 'develop' 分支开始创建一个 release 分支。
-   `git flow release publish [releaseBranchName]`: 创建 release 分支之后立即发布允许其它用户向这个 release 分支提交内容。
-   `git flow release track [releaseBranchName]`: 签出 release 版本的远程变更。
-   `git flow release finish [releaseBranchName]`: 归并 release 分支到 'master' 分支，用 release 分支名打 Tag，归并 release 分支到 'develop'，移除 release 分支。

### hotfix

-   `git flow hotfix start [hotfixBranchName]`: 开始 git flow 紧急修复，从 master 上建立 hotfix 分支
-   `git flow hotfix finish [hotfixBranchName]`: 结束 git flow 紧急修复，代码归并回 develop 和 master 分支。相应地，master 分支打上修正版本的 TAG。

> 你依旧可以继续使用你所知道和了解的 git 命令按照 git flow 的流程走，git flow 只是一个工具集合

Git Flow 只是定义的一套常规的开发流程模型，如果公司有特殊的流程，可以灵活运用 Git Flow，增加或者修改一些节点使之成为适合自己的流程
