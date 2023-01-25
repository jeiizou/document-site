# Node-npm原理


## npm 模块安装机制

-   收到`npm install`命令
-   查询`node_modules`目录之中是否已经存在指定模块
    -   若存在, 不再重新安装
    -   若不存在:
        -   `npm`向`register`查询模块压缩包的网址
        -   下载压缩包, 存放在根目录下的`.npm`目录中
        -   解压压缩包到当前项目的`node_modules`目录

## npm 模块安装过程

输入 npm install 命令并敲下回车后, 会经历如下几个阶段:

### 1. 执行工程自身 preinstall

当前 npm 工程如果定义了 preinstall 钩子此时会被执行

### 2. 确定首层依赖

首先需要确定工程中的首层依赖(`depandencies`/`devDependencies`中直接指定的模块), 假定此时没有添加`npm install`参数.

工程本身是整个依赖树的根节点, 每个首层以来模块都是跟节点下面的一个子树, npm 会开启多进程从每个首层以来模块开始逐步寻找更深层级的节点.

### 3. 获取模块

获取模块是一个递归过程, 分为:

1. 获取模块信息, 确定版本, 此时 package.json 中往往是 semantic version（semver，语义化版本）. 此时如果版本描述文件(npm-shrinkwrap.json 或 package-lock.json)中有该模块的信息直接拿取, 如果没有则从仓库获取. 如`package.json`中包的版本是 ^1.1.0，npm 就会去仓库中获取符合 1.x.x 形式的最新版本。
2. 获取模块实体. 上一步会获取到模块的压缩包地址,npm 会用此地址检查本地缓存，缓存中有就直接拿，如果没有则从仓库下载.
3. 查找该模块依赖，如果有依赖递归执行第一步。

### 4. 模块扁平化

从 npm3 开始, 会有一个 dedupe 过程, 遍历所有的节点, 逐个将模块放在根节点下面, 也就是 node-module 的第一层, 当发现有重复模块时, 将其丢弃.

这里需要对重复模块进行一个定义，它指的是**模块名相同**且**semver 兼容**。每个 semver 都对应一段版本允许范围，如果两个模块的版本允许范围存在交集，那么就可以得到一个兼容版本，而不必版本号完全一致，这可以使更多冗余模块在 dedupe 过程中被去掉。

### 5. 安装模块

这一步将会更新工程中的 node_modules，并执行模块中的生命周期函数（按照 preinstall、install、postinstall 的顺序）。

### 6. 执行工程自身生命周期

当前 npm 工程如果定义了钩子此时会被执行（按照 install、postinstall、prepublish、prepare 的顺序）。

最后一步是生成或更新版本描述文件，npm install 过程完成。

## 参考资料

-   [npm 模块安装机制简介](http://www.ruanyifeng.com/blog/2016/01/npm-install.html)
