# Webpack-优化

## 缩小文件搜索范围

webpack启动之后会从配置的entry触发, 解析出文件中的导入语句, 再递归的解析. 

在遇到导入语句时, webpack会做两件事:

1. 根据导入语句去寻找对应的要导入的文件.
2. 根据找到的要导入的文件的后缀, 使用配置中的Loader去处理文件. 

以上两个事情, 但是当项目变得庞大之后, 会消耗比较大的资源

### 优化loader配置

loader对文件的转换操作很耗时, 需要让尽量可能少的文件被loader处理

Loader可以通过`test`, `include`, `exclued`三个配置项来命中Loader要应用规则的文件. 为了尽可能少的让文件被Loader处理, 可以通过`include`去命中只有那些文件需要被处理, 比如以es6为例, 在配置`babel-loader`时, 可以:

```js
module.exports = {
  module: {
    rules: [
      {
        // 如果项目源码中只有 js 文件就不要写成 /\.jsx?$/，提升正则表达式性能
        test: /\.js$/,
        // babel-loader 支持缓存转换出的结果，通过 cacheDirectory 选项开启
        use: ['babel-loader?cacheDirectory'],
        // 只对项目根目录下的 src 目录中的文件采用 babel-loader
        include: path.resolve(__dirname, 'src'),
      },
    ]
  },
};
```

> 你可以适当的调整项目的目录结构，以方便在配置 Loader 时通过 include 去缩小命中范围。

### 优化 resolve.modules 配置

`resolve.modules`用于配置`webpack`去那些目录下寻找第三方模块.

`resolve.modules`的默认值是`['node_modules']`中去找, 再没有就去上一级的node_modules寻找, 类似node的模块寻找机制. 

当安装的第三方模块都放在项目的根目录下的时候, 就可以明确的指明存放第三方模块的绝对路径:

```js
module.exports = {
  resolve: {
    // 使用绝对路径指明第三方模块存放的位置，以减少搜索步骤
    // 其中 __dirname 表示当前工作目录，也就是项目根目录
    modules: [path.resolve(__dirname, 'node_modules')]
  },
};
```

### 优化resolve.mainFields配置

`resolve.mainFields`用于配置第三方模块使用哪个入口文件

可以存在多个字段描述入口文件的原因是因为有些模块可以同时用在多个环境中，针对不同的运行环境需要使用不同的代码。 以 isomorphic-fetch 为例，它是 fetch API 的一个实现，但可同时用于浏览器和 Node.js 环境。 它的 package.json 中就有2个入口文件描述字段：

```json
{
  "browser": "fetch-npm-browserify.js",
  "main": "fetch-npm-node.js"
}
```

resolve.mainFields 的默认值和当前的 target 配置有关系，对应关系如下：

- 当target是web或者webworker的时候, 值是`["browser", "module", "main"]`
- 当target是其他情况的时候, 值是`["module", "main"]`

以target等于web为例, webpack会先采用第三方模块中的`browser`字段去寻找模块的入口文件, 如果不存在就采用`module`字段, 以此类推. 

为了减少搜索步骤, 当你明确第三方模块的入口文件描述字段时, 你可以把它设置的尽量的少. 由于大部分第三方模块都采用`main`去描述入口文件的位置, 就可以这样配置:

```js
module.exports = {
  resolve: {
    // 只采用 main 字段作为入口文件描述字段，以减少搜索步骤
    mainFields: ['main'],
  },
};
```

> 使用本方法优化时，你需要考虑到所有运行时依赖的第三方模块的入口文件描述字段，就算有一个模块搞错了都可能会造成构建出的代码无法正常运行。

### 优化 resolve.alias 配置

```js
module.exports = {
  resolve: {
    // 使用 alias 把导入 react 的语句换成直接使用单独完整的 react.min.js 文件，
    // 减少耗时的递归解析操作
    alias: {
      'react': path.resolve(__dirname, './node_modules/react/dist/react.min.js'), // react15
      // 'react': path.resolve(__dirname, './node_modules/react/umd/react.production.min.js'), // react16
    }
  },
};
```

注意这个优化方法可能会对`tree-shaking`造成影响. 

### 优化 resolve.extensions 配置

Webpack 会自动带上后缀后去尝试询问文件是否存在:

```js
extensions: ['.js', '.json']
```

也就是说当遇到`require()`这样的导入语句时, webpack会寻找`./data.js`文件, 如果找不到就去找`./data.json`文件, 如果还找不到就报错. 

如果这个列表越长, 或者正确的后缀越后面, 就会造成尝试的次数就越多. 所以在配置`resolve.extensions`时你需要遵守以下几点，以做到尽可能的优化构建性能：

- 后缀尽可能缩小一点
- 频率出现最高的文件优先放在最前面
- 在源码中写入导入语句, 要尽可能的带上后缀.

```js
module.exports = {
  resolve: {
    // 尽可能的减少后缀尝试的可能性
    extensions: ['js'],
  },
};
```

### 优化 module.noParse 配置

`module.noParse`配置项可以让webpack忽略对部分没有采用模块化的文件的递归解析处理. 

这样做的好处是能提高构建性能. 对于那些庞大而有没有采用模块化标准的库, 让webpack去解析这些文件耗时而且没有意义.

```js
const path = require('path');

module.exports = {
  module: {
    // 独完整的 `react.min.js` 文件就没有采用模块化，忽略对 `react.min.js` 文件的递归解析处理
    noParse: [/react\.min\.js$/],
  },
};
```


## 使用DllPlugin

在widows系统, 经常会有以`.dll`为后缀的文件, 这些文件称为动态链接库, 在一个动态链接库中可以包含给其他模块调用的函数和数据. 

要给web项目构建接入动态链接库的思想, 需要完成以下事情:

- 把网页依赖的基础抽离出来, 打包到一个个单独的动态链接库中, 一个动态链接库可以包含多个模块
- 当需要导入的模块存在于某个动态链接库中时, 这个模块不能被再次打包, 而是去动态链接库中获取
- 页面依赖的所有动态链接库需要被加载

这样在构建web项目的时候, 在动态链接库中包含的模块就不会重新编译, 而是直接使用动态链接库中的代码. 

### 接入webpack

webpack内置了对动态链接库的支持, 需要通过2个内置的插件, 分别是:

- DllPugin 插件: 用于打包出一个个单独的动态链接库文件
- DllReferencePlugin: 用于在主要配置文件中去引入Dllplugin插件打包好的动态链接库文件

以React项目为例:

```js
├── main.js
├── polyfill.dll.js
├── polyfill.manifest.json
├── react.dll.js
└── react.manifest.json
```

- polyfill.dll.js 里面包含项目所有依赖的 polyfill，例如 Promise、fetch 等 API
- react.dll.js 里面包含 React 的基础运行环境，也就是 react 和 react-dom 模块。

以`react.dll.js`为例:

```js
var _dll_react = (function(modules) {
  // ... 此处省略 webpackBootstrap 函数代码
}([
  function(module, exports, __webpack_require__) {
    // 模块 ID 为 0 的模块对应的代码
  },
  function(module, exports, __webpack_require__) {
    // 模块 ID 为 1 的模块对应的代码
  },
  // ... 此处省略剩下的模块对应的代码 
]));
```

其中 polyfill.manifest.json 和 react.manifest.json 文件也是由 DllPlugin 生成出，用于描述动态链接库文件中包含哪些模块， 以 react.manifest.json 文件为例，其文件内容大致如下：

```json
{
  // 描述该动态链接库文件暴露在全局的变量名称
  "name": "_dll_react",
  "content": {
    "./node_modules/process/browser.js": {
      "id": 0,
      "meta": {}
    },
    // ... 此处省略部分模块
    "./node_modules/react-dom/lib/ReactBrowserEventEmitter.js": {
      "id": 42,
      "meta": {}
    },
    "./node_modules/react/lib/lowPriorityWarning.js": {
      "id": 47,
      "meta": {}
    },
    // ... 此处省略部分模块
    "./node_modules/react-dom/lib/SyntheticTouchEvent.js": {
      "id": 210,
      "meta": {}
    },
    "./node_modules/react-dom/lib/SyntheticTransitionEvent.js": {
      "id": 211,
      "meta": {}
    },
  }
}
```

`manifest.json`文件描述了其对应的`dll.js`文件中包含了那些模块, 以及模块的路径和ID.

`main.js`文件是编译的执行入口文件, 当遇到其依赖的模块在`dll.js`文件中时, 会直接通过`dll.js`文件暴露出来的全局变量去获取打包在`dll.js`文件的模块. 说以在`index.html`文件中需要把依赖的两个`dll.js`文件给加载进去, `index.html`内容如下:

```html
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
<div id="app"></div>
<!--导入依赖的动态链接库文件-->
<script src="./dist/polyfill.dll.js"></script>
<script src="./dist/react.dll.js"></script>
<!--导入执行入口文件-->
<script src="./dist/main.js"></script>
</body>
</html>
```

以上就是所有接入DllPlugin的最终编译出来的代码.

### 构建出动态链接库文件

```js
├── polyfill.dll.js
├── polyfill.manifest.json
├── react.dll.js
└── react.manifest.json
```

以上这四个文件和`main.js`是由两份不同的构建分别输出的.

动态链接库文件相关的文件需要由一份独立的构建输出, 用于给主构建使用. 新建一个webpack配置文件`webpack_dll.config.js`专门用于构建它们. 内容如下:

```js
const path = require('path');
const DllPlugin = require('webpack/lib/DllPlugin');

module.exports = {
  // JS 执行入口文件
  entry: {
    // 把 React 相关模块的放到一个单独的动态链接库
    react: ['react', 'react-dom'],
    // 把项目需要所有的 polyfill 放到一个单独的动态链接库
    polyfill: ['core-js/fn/object/assign', 'core-js/fn/promise', 'whatwg-fetch'],
  },
  output: {
    // 输出的动态链接库的文件名称，[name] 代表当前动态链接库的名称，
    // 也就是 entry 中配置的 react 和 polyfill
    filename: '[name].dll.js',
    // 输出的文件都放到 dist 目录下
    path: path.resolve(__dirname, 'dist'),
    // 存放动态链接库的全局变量名称，例如对应 react 来说就是 _dll_react
    // 之所以在前面加上 _dll_ 是为了防止全局变量冲突
    library: '_dll_[name]',
  },
  plugins: [
    // 接入 DllPlugin
    new DllPlugin({
      // 动态链接库的全局变量名称，需要和 output.library 中保持一致
      // 该字段的值也就是输出的 manifest.json 文件 中 name 字段的值
      // 例如 react.manifest.json 中就有 "name": "_dll_react"
      name: '_dll_[name]',
      // 描述动态链接库的 manifest.json 文件输出时的文件名称
      path: path.join(__dirname, 'dist', '[name].manifest.json'),
    }),
  ],
};
```

### 使用动态链接库

构建出的动态链接库文件用于给其它地方使用，在这里也就是给执行入口使用。

用于输出 main.js 的主 Webpack 配置文件内容如下:

```js
const path = require('path');
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin');

module.exports = {
  entry: {
    // 定义入口 Chunk
    main: './main.js'
  },
  output: {
    // 输出文件的名称
    filename: '[name].js',
    // 输出文件都放到 dist 目录下
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        // 项目源码使用了 ES6 和 JSX 语法，需要使用 babel-loader 转换
        test: /\.js$/,
        use: ['babel-loader'],
        exclude: path.resolve(__dirname, 'node_modules'),
      },
    ]
  },
  plugins: [
    // 告诉 Webpack 使用了哪些动态链接库
    new DllReferencePlugin({
      // 描述 react 动态链接库的文件内容
      manifest: require('./dist/react.manifest.json'),
    }),
    new DllReferencePlugin({
      // 描述 polyfill 动态链接库的文件内容
      manifest: require('./dist/polyfill.manifest.json'),
    }),
  ],
  devtool: 'source-map'
};
```

> 注意：在 webpack_dll.config.js 文件中，DllPlugin 中的 name 参数必须和 output.library 中保持一致。

### 执行构建

在修改好以上两个webpack配置文件后, 需要重新执行构建, 重新执行构建需要先把动态链接库相关的文件编译出来.

## 使用HappyPack

由于构建过程中有大量的文件读写和计算密集操作, 在项目变大以后, 构建慢的问题会变得非常严重. 

运行在node上的webpack是单线程模型. 可以借助`HappyPack`, 将任务分配给多个子进程去并发执行, 子进程处理完后再把结果发送给主线程. 

### 接入HappyPack 

接入HappyPack的相关代码如下: 

```js
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HappyPack = require('happypack');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        // 把对 .js 文件的处理转交给 id 为 babel 的 HappyPack 实例
        use: ['happypack/loader?id=babel'],
        // 排除 node_modules 目录下的文件，node_modules 目录下的文件都是采用的 ES5 语法，没必要再通过 Babel 去转换
        exclude: path.resolve(__dirname, 'node_modules'),
      },
      {
        // 把对 .css 文件的处理转交给 id 为 css 的 HappyPack 实例
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: ['happypack/loader?id=css'],
        }),
      },
    ]
  },
  plugins: [
    new HappyPack({
      // 用唯一的标识符 id 来代表当前的 HappyPack 是用来处理一类特定的文件
      id: 'babel',
      // 如何处理 .js 文件，用法和 Loader 配置中一样
      loaders: ['babel-loader?cacheDirectory'],
      // ... 其它配置项
    }),
    new HappyPack({
      id: 'css',
      // 如何处理 .css 文件，用法和 Loader 配置中一样
      loaders: ['css-loader'],
    }),
    new ExtractTextPlugin({
      filename: `[name].css`,
    }),
  ],
};
```

以上代码中有两点重要的修改:

- 在Loader配置中, 所有文件的处理都交给了`happypack/loader`去处理, 使用紧跟其后的queryString告诉loader去选择哪个实例处理文件. 
- 在Plugin配置中, 新增了两个HappyPack实例, 分别用于告诉`happypack/loader`去如何处理js和css文件. 选项中的id属性的值和上面的queryString中的id相对应. 

在实例化HappyPack插件的时候, 除了可以传入id和loaders两个参数外, happypack还支持如下参数:

- `threads`: 代表开启几个子进程去处理这一类型的文件, 默认是三个
- `verbose`: 是否允许HappyPack输出日志, 默认true
- `threadPool`: 代表共享进程池, 即多个HappyPack实例都使用同一个共享进程池中的子进程去处理任务, 以防止资源占用过多. 相关代码如下:

```js
const HappyPack = require('happypack');
// 构造出共享进程池，进程池中包含5个子进程
const happyThreadPool = HappyPack.ThreadPool({ size: 5 });

module.exports = {
  plugins: [
    new HappyPack({
      // 用唯一的标识符 id 来代表当前的 HappyPack 是用来处理一类特定的文件
      id: 'babel',
      // 如何处理 .js 文件，用法和 Loader 配置中一样
      loaders: ['babel-loader?cacheDirectory'],
      // 使用共享进程池中的子进程去处理任务
      threadPool: happyThreadPool,
    }),
    new HappyPack({
      id: 'css',
      // 如何处理 .css 文件，用法和 Loader 配置中一样
      loaders: ['css-loader'],
      // 使用共享进程池中的子进程去处理任务
      threadPool: happyThreadPool,
    }),
    new ExtractTextPlugin({
      filename: `[name].css`,
    }),
  ],
};
```

### HappyPack 原理

在整个Webpack构建流程中, 最耗时的操作大概就是Loader对文件的转换操作了, 因为要转换的文件数量大, 而且这些转换操作都只能一个个挨着处理. HappyPack 的核心原理就是把这部分任务分解到多个进程去并行处理, 从而减少总的构建时间. 

每通过`new HappyPack()`实例化一个HappyPack其实就是告诉HappyPack和兴调度器如何通过一系列Loader去转换一类文件, 并且可以指定入如何给这类转换操作分配子进程. 

核心调度器的代码在主进程中, 也就是运行webpack的进程中, 核心调度器会把一个个任务分配给当前空闲的子进程, 子进程处理完毕后把结果发送给核心调度器, 它们之间的数据交换是通过进程间通信API实现的.

## 使用 ParallelUglifyPlugin

在使用WEnpack构建出用于发布到线上的代码时, 都会有压缩代码这一流程, 常见的js压缩工具比如 UglifyJS. 

由于压缩代码需要先把代码解析成AST树, 然后再用各种规则分析和处理AST, 导致这个工程计算量大, 耗时非常长. 

所以针对这个过程也可以做类似的多线程优化, 就是`ParallelUglifyPlugin`插件. 

```js
const path = require('path');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

module.exports = {
  plugins: [
    // 使用 ParallelUglifyPlugin 并行压缩输出的 JS 代码
    new ParallelUglifyPlugin({
      // 传递给 UglifyJS 的参数
      uglifyJS: {
        output: {
          // 最紧凑的输出
          beautify: false,
          // 删除所有的注释
          comments: false,
        },
        compress: {
          // 在UglifyJs删除没有用到的代码时不输出警告
          warnings: false,
          // 删除所有的 `console` 语句，可以兼容ie浏览器
          drop_console: true,
          // 内嵌定义了但是只用到一次的变量
          collapse_vars: true,
          // 提取出出现多次但是没有定义成变量去引用的静态值
          reduce_vars: true,
        }
      },
    }),
  ],
};
```

在通过`new ParallelUglifyPlugin()`实例化时，支持以下参数：

- `test`: 使用正则去匹配那些文件需要给插件压缩, 默认是`/.js$/`, 也就是默认压缩所有的.js文件
- `include`: 使用正则去命中需要被`ParallelUglifyPlugin`压缩的文件. 默认是`[]`
- `exclude`: 使用正则去命中不需要被插件压缩的文件
- `cacheDir`: 缓存压缩后的结果, 下次遇到一样的输入时直接从缓存中获取压缩后的结果并返回. cacheDir用于配置缓存存放的目录路径. 默认不会缓存, 想开启缓存请设置一个目录路径. 
- `workerCount`: 开启几个子进程去并发的执行压缩, 默认是当前cpu核数 - 1
- `sourMap`: 是否输出Source Map, 这会导致压缩变慢
- `uglifyJS`: 用于压缩ES5代码时的配置
- `uglifyES`: 用于压缩ES6代码时的配置

插件完整名称: `webpack-parallel-uglify-plugin`

## 使用自动刷新

### 文件监听

webpack提供了两种文件监听的方案, 一个是`webpack`的watch选项, 另一个是`webpack-dev-server`:

```js
module.export = {
  // 只有在开启监听模式时，watchOptions 才有意义
  // 默认为 false，也就是不开启
  watch: true,
  // 监听模式运行时的参数
  // 在开启监听模式时，才有意义
  watchOptions: {
    // 不监听的文件或文件夹，支持正则匹配
    // 默认为空
    ignored: /node_modules/,
    // 监听到变化发生后会等300ms再去执行动作，防止文件更新太快导致重新编译频率太高
    // 默认为 300ms
    aggregateTimeout: 300,
    // 判断文件是否发生变化是通过不停的去询问系统指定文件有没有变化实现的
    // 默认每隔1000毫秒询问一次
    poll: 1000
  }
}
```

要让 Webpack 开启监听模式，有两种方式: 

- 在配置文件`webpack.config.js`中设置`watch: true`
- 在执行启动`webpack`命令的时候, 带上`--watch`参数

### 文件监听工作原理

在Webpack中, 监听一个文件发生变化的原理是定时去获取该文件的最后编辑时间, 每次都保存下最新的最后编辑时间, 如果发生当前获取的和最后一次保存的编辑时间不一致, 就认为该文件发生了变化. 配置项中的`watchOption.poll`就是用于控制定时检查的周期(单位毫秒)

当发现某个文件发生了变化, 并不会立即告诉坚挺着, 而是先缓存起来, 手机一段时间的变化后, 在一次性的告诉监听者. 配置项中的`aggregateTimeout`就是用于配置这个等待时间. 目的就是为了防止都懂. 

对于多个文件来说, 原理是相似的, 只不过会对每一个文件都定时的执行检查. 

但是这个需要监听的文件列表是怎么确定的呢?

默认情况下webpack会从配置的entry文件触发, 递归的解析出entry文件所依赖的所有文件, 然后把这些依赖的文件都加入监听列表. 

由于保存文件的路径和最后编辑时间需要占用内存, 定时检查周期检查需要占用CPU以及文件IO. 

因此需要设定合适的监听和变化周期. 

### 优化文件监听性能

明白监听文件的工作原理之后, 就知道要怎么优化文件监听性能了. 

首先不监听不需要的文件变化:

```js
module.export = {
  watchOptions: {
    // 不监听的 node_modules 目录下的文件
    ignored: /node_modules/,
  }
}
```

其次是:

- watchOptions.aggregateTimeout 值越大性能越好，因为这能降低重新构建的频率。
- watchOptions.poll 值越大越好，因为这能降低检查的频率。

### 自动刷新浏览器

监听到文件更新后的下一步是去刷新浏览器, webpack模块负责监听文件, webpack-dev-server 模块则负责刷新浏览器. 在使用`webpack-dev-server`模块去启动webpack模块的时候, webpack的监听模式是默认开启的. 

#### 自动刷新浏览器的原理

控制浏览器刷新有三种方法:

1. 借助浏览器扩展去通过浏览器提供的接口刷新, 比如`WebStorm`的`liveEdit`. 
2. 往要开发的网页中注入代理客户端的代码, 通过代理客户端去刷新整个页面
3. 把要开发的网页装进一个`iframe`中, 通过刷新`iframe`去看到最新效果

`devServer`支持2,3两种模式, 其中默认采用第二种. 

### 优化自动刷新的性能

在`devServer`的配置中, 有一个`inline`的选项, 它就是用来控制住是否往`Chunk`中注入代理客户端的. 默认会注入. 事实上, 在开启`inline`时, DevServer会为每个输出的Chunk中注入代理客户端的代码, 当你的项目需要输出的Chunk有很多的时候, 这回导致你的构建变慢. 实际上要完成自动刷新, 一个页面只需要一个代理客户端就行了, DevServer 之所以粗暴的为每一个Chunk注入, 是因为它不知道某个网页依赖哪些Chunk, 索性就全都注入到一个代理客户端. 

这里优化的思路是关闭还不够优雅的inline模式, 只注入一个代理客户端. 为了关闭inline模式, 在启动DevServer模式的时候, 可以通过执行``webpack-dev-server --inline false`或者在配置文件中设置. 

和前面的不同在于:

- 入口的网址变成了: `http://localhost:8080/webpack-dev-server/`
- `bundle.js`中不再包含代理客户端的代码

开发的网页会被放进到一个iframe中, 编辑源码后, iframe会被自动刷新. 

## 开启模块热替换

除了自动刷新之外, `DevServer`还支持一种叫做模块热替换的技术, 可以在不刷新整个网页的情况下做到超灵敏的实时预览. 

原理是当一个源码发生变化时, 只重新编译发生变化的模块, 再用心输出的模块替换掉浏览器中对应的老模块

模块热替换的技术优势在于:

- 实时预览反应更快, 等待时间更短
- 不刷新浏览器, 所以能保留当前网页的运行状态. 

### 模块热替换的原理

模块热替换的原理和自动刷新原理类似, 都需要往开发的网页中注入一个代理客户端用于连接`DevServer`和网页. 

不同在于模块热替换独特的模块替换机制.

DevServer默认不会开启, 配置`hot`参数即可. 

### 优化模块热替换

在发生模块热替换的时候, 浏览器会有`[HMR]`开头的日志.

其中的提示不太优化, 可以通过插件优化该信息输出:

```js
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');

module.exports = {
  plugins: [
    // 显示出被替换模块的名称
    new NamedModulesPlugin(),
  ],
};
```

## 区分环境

### 为什么要区分环境

一般开发过程中, 会有多套运行环境:

1. 在开发过程中方便调试的环境
2. 发布到线上给用户使用的运行环境

其中有些配置具有差异, 比如:

- 线上的代码是需要被压缩的
- 开发的代码包含了一些用于开发者的提示日志
- 开发用的代码所连接的后端数据接口与线上的环境也可能是不同的. 

为了尽可能的复用代码, 在构建的过程中需要根据目标代码要运行的环境而输出不同的代码, 我们需要一套机制去区分环境. 

### 如何区分环境

```js
if (process.env.NODE_ENV === 'production') {
  console.log('你正在线上环境');
} else {
  console.log('你正在使用开发环境');
}
```

大概原理是借助于环境变量的值去判断执行哪个分支

在构建线上环境代码的时候, 就可以配置相关的变量去定义环境参数:

```js
const DefinePlugin = require('webpack/lib/DefinePlugin');

module.exports = {
  plugins: [
    new DefinePlugin({
      // 定义 NODE_ENV 环境变量为 production
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
  ],
};
```

DefinePlugin 定义的环境变量只对webpack需要处理的代码有效, 而不会影响node.js运行时的环境变量的值.

通过shell脚本的方式去定义的环境比那辆, 例如`NODE_ENV = production webpack`, webpack是不认识的. 

也就是说, 只需要通过`DefinePlugin`定义环境变量就可以正常区分语句, 不需要再通过脚本定义一遍. 

如果想要让webpack使用通过shell脚本的方式去定义的环境比那辆, 你可以使用`EnvironmentPlugin`, 代码如下:

```js
new webpack.EnvironmentPlugin(['NODE_ENV'])
```

等价于:

```js
new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
})
```

### 结合 UglifyJS

webpack不能去除那些死代码, 但是结合UglifyJS可以做到这件事. 

### 第三方库中的环境区分

很多第三方库也做了环境区分的优化, 以React为例, 它就做了两台环境区分, 分别是:

1. 开发环境: 包含类型检查, HTML元素检查等等针对开发者的警告日志
2. 线上环境: 去掉了所有针对开发者的代码, 只保留React正常运行的部分, 以优化大小和性能

如果你不定义 NODE_ENV=production 那么这些警告日志就会被包含到输出的代码中，输出的文件将会非常大。

process.env.NODE_ENV !== 'production' 中的 NODE_ENV 和 'production' 两个值是社区的约定，通常使用这条判断语句在区分开发环境和线上环境。

## 压缩代码

除了对静态资源的压缩, 代码的本身也能压缩, 好处在于一方面提升网页加载速度, 另一方面能混淆代码. 

### 压缩js

目前最成熟的js代码压缩工具就是UglifyJS, 它会分析js代码语法树, 理解代码含义, 从而能做到去除无效代码, 去除日志输入代码, 缩短变量名等优化.

要在webpack中接入UglifyJS需要通过插件的形式:

- UglifyJSPlugin: UglifyJS的封装
- ParallelUglifyPlugin: 多进程并行压缩处理

UglifyJS 提供了非常多的选择用于配置在压缩过程中采用哪些规则，所有的选项说明可以在其官方文档上看到。 由于选项非常多，就挑出一些常用的拿出来详细讲解其应用方式：

- sourceMap: 是否为压缩后的代码生成对应的souce map, 默认是不生成, 开启后耗时会大大增加, 一般不会把压缩后的代码的souceMap发送给网站用户的浏览器, 而是用于内部开发人员调试线上代码的时候使用. 
- beautify: 是否输出可读性比较强的代码, 即保留空格和制表符, 默认为是, 可以设置为false
- comments: 是否保留代码中的注释
- compress.warning: 是否在删除没有用到的代码时输出警告信息, 可以设置为false.
- drop_console: 是否删除代码中所有的console语句
- collapse_vars: 是否内嵌定义了但是只用到一次的变量. 例如吧`var x = 5; y = x`转换成`y = 5`.
- reduce_vars: 是否提取出出现多次但是没有定义成变量去引用的静态值

下面是一个示例配置:

```js
const UglifyJSPlugin = require('webpack/lib/optimize/UglifyJsPlugin');

module.exports = {
  plugins: [
    // 压缩输出的 JS 代码
    new UglifyJSPlugin({
      compress: {
        // 在UglifyJs删除没有用到的代码时不输出警告
        warnings: false,
        // 删除所有的 `console` 语句，可以兼容ie浏览器
        drop_console: true,
        // 内嵌定义了但是只用到一次的变量
        collapse_vars: true,
        // 提取出出现多次但是没有定义成变量去引用的静态值
        reduce_vars: true,
      },
      output: {
        // 最紧凑的输出
        beautify: false,
        // 删除所有的注释
        comments: false,
      }
    }),
  ],
};
```

从以上配置中可以看出 Webpack 内置了 UglifyJSPlugin

### 压缩ES6

es6的代码相比于转换后的es5代码有如下的优先:

- 一样的逻辑, es6实现的代码量比es5更少
- js对es6中的语法做了性能优化, 例如`const`

所以在运行环境允许的情况下, 我们要尽可能的使用原生的es6代码去运行, 而不是用转换后的es5代码. 

在使用UglifyJS压缩es代码的时候, 会发生报错, 需要用专门针对es6代码的`UglifyES`

配置如下:

```js
const UglifyESPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  plugins: [
    new UglifyESPlugin({
      // 多嵌套了一层
      uglifyOptions: {
        compress: {
          // 在UglifyJs删除没有用到的代码时不输出警告
          warnings: false,
          // 删除所有的 `console` 语句，可以兼容ie浏览器
          drop_console: true,
          // 内嵌定义了但是只用到一次的变量
          collapse_vars: true,
          // 提取出出现多次但是没有定义成变量去引用的静态值
          reduce_vars: true,
        },
        output: {
          // 最紧凑的输出
          beautify: false,
          // 删除所有的注释
          comments: false,
        }
      }
    })
  ]
}
```

同时为了不让babel-loader 输出es5语法的代码, 需要去掉`.babelrc`配置文件中的`babel-preset-env`, 但是其他的babel插件, 比如`babel-preset-react`还是要保留的. 

### 压缩CSS

CSS代码也可以像js那样被压缩, 目前比较成熟的有`cssnano`, 基于`postCSS`.

`cssnano`能理解css代码的含义, 而不仅仅是删除空格, 例如:

- margin: 10px 20px 10px 20px 被压缩成 margin: 10px 20px
- color: #ff0000 被压缩成 color:red

把 cssnano 接入到 Webpack 中也非常简单，因为 css-loader 已经将其内置了，要开启 cssnano 去压缩代码只需要开启 css-loader 的 minimize 选项。 相关 Webpack 配置如下：

```js
const path = require('path');
const {WebPlugin} = require('web-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,// 增加对 CSS 文件的支持
        // 提取出 Chunk 中的 CSS 代码到单独的文件中
        use: ExtractTextPlugin.extract({
          // 通过 minimize 选项压缩 CSS 代码
          use: ['css-loader?minimize']
        }),
      },
    ]
  },
  plugins: [
    // 用 WebPlugin 生成对应的 HTML 文件
    new WebPlugin({
      template: './template.html', // HTML 模版文件所在的文件路径
      filename: 'index.html' // 输出的 HTML 的文件名称
    }),
    new ExtractTextPlugin({
      filename: `[name]_[contenthash:8].css`,// 给输出的 CSS 文件名称加上 Hash 值
    }),
  ],
};
```

## CDN加速

CDN的原理这里就不展开描述了.

### 接入CDN

假如我们有一个单页应用:

```js
dist
|-- app_9d89c964.js
|-- app_a6976b6d.css
|-- arch_ae805d49.png
-- index.html
```

其中入口页面如下:

```js
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="app_a6976b6d.css">
</head>
<body>
<div id="app"></div>
<script src="app_9d89c964.js"></script>
</body>
</html>
```

可以看出到导入资源时都是通过相对路径去访问的，当把这些资源都放到同一个 CDN 服务上去时，网页是能正常使用的。 但需要注意的是由于 CDN 服务一般都会给资源开启很长时间的缓存，例如用户从 CDN 上获取到了 index.html 这个文件后， 即使之后的发布操作把 index.html 文件给重新覆盖了，但是用户在很长一段时间内还是运行的之前的版本，这会新的导致发布不能立即生效。

要避免以上的问题, 业界比较成熟的做法是:

- 针对HTML文件: 不开启缓存, 把HTML放在自己的服务器上, 而不是CND服务器上, 同时关闭服务器上的缓存. 自己的服务器只提供HTML文件和数据接口
- 针对静态的js, css, 图片等文件: 开启CDN和缓存, 上传到CDN服务器. 同时给每个文件名带上由文件内容算出来的hash值. 

采用这样的方案, 在html文件中映入的资源地址也需要转换成cnd服务提供的地址. 

除此之外, 我们知道对于同一个域名的资源, 浏览器是有并行请求限制的. 如果所有的静态资源都放在同一个域名下满, 就会导致资源的加载被阻塞. 处理这个的办法可以是按照资源的类型, 把不同的资源放在不同的域名下面去. 

> 使用了多个域名后又会带来一个新问题：增加域名解析时间。是否采用多域名分散资源需要根据自己的需求去衡量得失。 当然你可以通过在 HTML HEAD 标签中 加入 `<link rel="dns-prefetch" href="//js.cdn.com">` 去预解析域名，以降低域名解析带来的延迟。

### 用Webpack实现CDN的接入

总结上面几点, 构建需要实现以下几点:

- 静态资源的导入URL需要变成指向CDN服务的绝对路径的URL而不是相对于HTML文件的URL
- 静态资源的文件名称需要带上有文件内容算出来的hash值, 以防止被缓存
- 不同类型的资源放在不同域名的CDN服务上面, 以防止资源的并行加载被阻塞

最终的webpack配置如下所示: 

```js
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {WebPlugin} = require('web-webpack-plugin');

module.exports = {
  // 省略 entry 配置...
  output: {
    // 给输出的 JavaScript 文件名称加上 Hash 值
    filename: '[name]_[chunkhash:8].js',
    path: path.resolve(__dirname, './dist'),
    // 指定存放 JavaScript 文件的 CDN 目录 URL
    publicPath: '//js.cdn.com/id/',
  },
  module: {
    rules: [
      {
        // 增加对 CSS 文件的支持
        test: /\.css$/,
        // 提取出 Chunk 中的 CSS 代码到单独的文件中
        use: ExtractTextPlugin.extract({
          // 压缩 CSS 代码
          use: ['css-loader?minimize'],
          // 指定存放 CSS 中导入的资源（例如图片）的 CDN 目录 URL
          publicPath: '//img.cdn.com/id/'
        }),
      },
      {
        // 增加对 PNG 文件的支持
        test: /\.png$/,
        // 给输出的 PNG 文件名称加上 Hash 值
        use: ['file-loader?name=[name]_[hash:8].[ext]'],
      },
      // 省略其它 Loader 配置...
    ]
  },
  plugins: [
    // 使用 WebPlugin 自动生成 HTML
    new WebPlugin({
      // HTML 模版文件所在的文件路径
      template: './template.html',
      // 输出的 HTML 的文件名称
      filename: 'index.html',
      // 指定存放 CSS 文件的 CDN 目录 URL
      stylePublicPath: '//css.cdn.com/id/',
    }),
    new ExtractTextPlugin({
      // 给输出的 CSS 文件名称加上 Hash 值
      filename: `[name]_[contenthash:8].css`,
    }),
    // 省略代码压缩插件配置...
  ],
};
```

这个配置的核心就是通过`publicPath`参数设置存放静态资源的CDN目录URL, 为了让不同类型的资源输出到不同的CDN, 因此需要分别在:

- `output.publicPath`设置js的地址
- `css-loader.publicPath`中设置CSS导入的资源的地址
- `webplugin.stylePublicPath`中设置CSS文件的地址

## 使用 Tree-shaking

### 什么是 Tree shaking

tree-shaking 可以用来提出js中用不上的死代码, 它依赖静态的es6模块化语法, 例如通过`import`和`export`导入导出. 

tree-shading 最先在rollup中出现, webpack在2.0版本引入. 

需要注意的是, 让tree-shaking正常工作的前提是交给webpack的js代码必须是采用es6模块化语法的, 因此es6模块化语法是静态的. 

> 目前的tree shaking 还是有缺陷的, 比如:
> 1. 无法对entry入口文件进行tree shaking
> 2. 不能对异步分割出去的代码进行 tree shaking


### 接入 tree shking

webpack4 只要通过`package.json`的`sideEffects`属性作为标记, 就可以安全的删除文件中未使用的部分. 

## 提取公共代码

### 为什么

大型网站通常会由多个页面组成, 每个页面都是一个独立的单页应用. 但由于所有页面都采用同样的技术栈, 以及使用同一套样式代码, 导致这些页面之间有很多相同的代码.

如果每个页面的代码都把这些公共的部分包含进去, 会造成:

- 相同的资源被重复的加载, 浪费用户的流量和服务器的成本
- 每个页面需要加载的资源太大, 导致网页首屏加载缓慢, 影响用户体验

如果把多个页面公共的代码抽离成单独的文件, 就能优化以上问题. 原因是加入用户访问了网站的其中一个网页, 那么访问这个网站下的其他网页的概率就非常大.在用户访问一次后, 这些页面的公共代码已经被缓存了, 那么在切换到其他页面的时候, 存放公共代码的文件就不会重新加载. 这样有一些好处:

- 减少网络传输流量
- 第二次访问的速度大大增加

### 如何提取公共代码

你已经知道了提取公共的理由. 那么如何去做呢? 一般有以下的原则:

- 根据你网站所使用的技术栈, 找出网站所有页面都需要用到的基础库, 以采用react技术栈为网站为例, 所有页面都会依赖`react`,`react-dom`等库, 把它们提取到一个单独的文件, 一般把这个文件叫做`base.js`, 包含网站所有网页的基础运行环境
- 在提出了各种页面中被`base.js`包含的部分代码之外, 再找出所有页面都依赖的公共部分的代码提取出来, 放到`common.js`中
- 再为每个网页都生成一个单独的文件, 这个文件中不再包含`base.js`和`common.js`中包含的部分, 而只包含各个页面单独需要的部分代码.

之所要吧`base`和`common`进行分离, 是为了可以长期缓存`base`.

### 如何通过webpack提取公共代码

webpack内置了提取多个`chunk`中公共部分的插件`CommonsChunkPlugin`:

```js
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

new CommonsChunkPlugin({
  // 从哪些 Chunk 中提取
  chunks: ['a', 'b'],
  // 提取出的公共部分形成一个新的 Chunk，这个新 Chunk 的名称
  name: 'common'
})
```

以上配置就能从网页A和B中抽离出公共的部分, 放到commn中. 

每个CommonsChunkPlugin实例都会生成一个新的Chunk, 这个新Chunk中包含了被提取出来的新代码, 在使用过程中必须制定`name`属性, 以告诉插件新生成的Chunk的名称. 其中`chunks`属性指明从哪些已有的`Chunk`中提取, 如果不填该属性, 则默认会从所有已知的Chunk中提取. 

> Chunk 是一系列文件的集合，一个 Chunk 中会包含这个 Chunk 的入口文件和入口文件依赖的文件。

通过以上配置输出的 common Chunk 中会包含所有页面都依赖的基础运行库 react、react-dom，为了把基础运行库从 common 中抽离到 base 中去，还需要做一些处理。

首先需要先配置一个Chunk, 这个Chunk中职以来所有页面都依赖的基础库以及所有页面都使用的样式, 为此需要在项目中写一个文件`base.js`来描述`base Chunk`所依赖的模块. 

```js
// 所有页面都依赖的基础库
import 'react';
import 'react-dom';
// 所有页面都使用的样式
import './base.css';
```

接着再修改Webpack配置, 在entry中加入base:

```js
module.exports = {
  entry: {
    base: './base.js'
  },
};
```

以上就完成了对新Chunk base的配置

为了从common中提取出base也包含的部分, 还需要配置一个CommonsChunkPlugin:

```js
new CommonsChunkPlugin({
  // 从 common 和 base 两个现成的 Chunk 中提取公共的部分
  chunks: ['common', 'base'],
  // 把公共的部分放到 base 中
  name: 'base'
})
```

由于common和base公共部分的base目前已经包含的部分, 所以这样配置后common将会变小, 而base将保持不变. 

以上都配置好后重新执行构建，你将会得到四个文件，它们分别是：

- `base.js`: 所有网页都依赖的基础库组成的代码'
- `common.js`: 网页A, B都需要的, 单又不在`base.js`文件中出现过的代码
- `a.js`: 网页A单独需要的代码
- `b.js`: 网页B单独需要的代码

为了让网页正常运行, 以网页A为例, 你需要在其HTML中按照以下顺序引入以下文件才能让网页正常运行:

```html
<script src="base.js"></script>
<script src="common.js"></script>
<script src="a.js"></script>
```

针对 CSS 资源，以上理论和方法同样有效，也就是说你也可以对 CSS 文件做同样的优化。

以上方法可能会出现 common.js 中没有代码的情况，原因是去掉基础运行库外很难再找到所有页面都会用上的模块。 在出现这种情况时，你可以采取以下做法之一：

- CommonsChunkPLugin提供一个选项`minChunks`, 表示文件要被提取出来时需要在指定的Chunks中最小出现最小次数, 假如`minChunks=2`, `chunks=['a','b','c','d']`, 任何一个文件只要在四个中任意两个以上的`chunk`中都出现过, 这个文件就会被提取出来. 你可以根据自己的需要去调整`minChunks`的值, `minChunks`越小越多的文件会被提取到`common.js`中去, 但这也会导致部分页面加载的不相关的资源越多; `minChunks`越大, 越少的文件会被提取到`common.js`中, 单这会导致`common.js`变小, 效果变弱.
- 根据各个页面之间的相关性选取其中的部分页面用`CommonsChunkPlugin`去提取这部分被选出来的页面的公共部分, 而不是提取所有页面的公共部分, 而且这样的操作可以叠加多次. 这样做的效果会很好, 但缺点是配置复杂, 你需要根据页面之间的关系去思考如何配置, 该方法不是通用的. 

## 按需加载

### 问什么需要按需加载

网页承载的代码量变得越来越大, 对于采用单页应用作为前端架构的网站来说, 会面临着一个网页需要加载的代码量很大的问题, 因为许多功能都集中在一个html中, 会导致网页加载缓慢.

原因在于一次性加载了所有功能对应的代码, 但其实用户每一阶段只可能使用其中一部分功能. 

### 如何使用按需加载

- 把整个网站划分成一个个小功能, 再按照每个功能的相关程序把它们分成几类
- 把每一类合并为一个Chunk, 按需加载对应的Chunk
- 对于用户首次打开你的网站时需要看到的画面所对应的功能, 不要对它们做按需加载, 而是放到执行入口所在的Chunk中, 以降低用户能感知的网页感知时间
- 对于个别依赖大量代码的功能点, 可以再按需加载

被分割出去的代码的加载需要一定时间去触发, 需要开发者根据网页的需求去衡量和确定

由于被分割出去进行按需加载的代码在加载过程中也是需要消耗时间的, 这部分的内容可以预加载. 

### 用webpack实现按需加载

webpack内置了强大的分割代码功能去实现按需加载, 实现起来也非常简单.

举个例子, 现在需要做这样一个进行了按需加载优化的网页:

- 网页首次加载只加载`main.js`文件, 网页会展示一个按钮, `main.js`文件中只包含监听按钮事件和加载按需加载的代码
- 按按钮被点击时才去加载被分割出去的`show.js`文件, 加载成功后再执行`show.js`中的函数

其中`main.js`文件内容如下:

```js
window.document.getElementById('btn').addEventListener('click', function () {
  // 当按钮被点击后才去加载 show.js 文件，文件加载成功后执行文件导出的函数
  import(/* webpackChunkName: "show" */ './show').then((show) => {
    show('Webpack');
  })
});
```

`show.js`文件的内容如下:

```js
module.exports = function (content) {
  window.alert('Hello ' + content);
};
```

代码中最关键的就是`import(...)`, webpack内置了对`import(*)`语句的支持, 当webpack遇到了类似的语句时会这样处理:

- 以`./show,js`为入口新生成一个chunk;
- 当代码执行到`import`所在语句时才会去加载由chunk对应生成的文件
- `import`返回一个promise, 当文件加载成功时可以在`promise`的then方法中获取到`show.js`导出的内容. 

> `/* webpackChunkName: "show" */` 的含义是为动态生成的 Chunk 赋予一个名称，以方便我们追踪和调试代码。 如果不指定动态生成的 Chunk 的名称，默认名称将会是 `[id].js`。 `/* webpackChunkName: "show" */` 是在 Webpack3 中引入的新特性，在 Webpack3 之前是无法为动态生成的 Chunk 赋予名称的。

为了正确的输出在`/* webpackChunkName: "show" */`中配置的`ChunkName`, 还需要配置下`WebPack`, 配置如下:

```js
module.exports = {
  // JS 执行入口文件
  entry: {
    main: './main.js',
  },
  output: {
    // 为从 entry 中配置生成的 Chunk 配置输出文件的名称
    filename: '[name].js',
    // 为动态加载的 Chunk 配置输出文件的名称
    chunkFilename: '[name].js',
  }
};
```

其中最贱的就是`chunkFilename: '[name].js'`, 它用于专门指定动态生成的Chunk在输出时的文件名称. 如果没有这行, 分割出的代码的文件名称将会是`[id].jd`.

## Prepack

### 什么是Prepack

前面的优化方法中提到了代码压缩和分块, 这些都是在网络加载层面的优化, 除此之外还可以优化代码在运行时的效率, prepack就是为此而生的. 

Prepack由facebook开源, 采用了一种比较寂静的方法, 在保持运行结果一致的情况下, 改变源代码的运行逻辑, 输出性能更高的js代码. 实际上Prepack就是一个部分求值器, 编译代码时提前将计算结果放到编译后的代码中, 而不是在代码运行时才去求值. 

以下面的代码为例:

```js
import React, {Component} from 'react';
import {renderToString} from 'react-dom/server';

function hello(name) {
  return 'hello ' + name;
}

class Button extends Component {
  render() {
    return hello(this.props.name);
  }
}

console.log(renderToString(<Button name='webpack'/>));
```

被Prepack转换后悔直接输出:

```js
console.log("hello webpack");
```

可以看到Prepack通过在编译阶段预先执行了源码得到执行结果, 再直接把运行结果输出来以提升性能. 

Prepack的工作原理和流程大致如下:

1. 通过Babel把JavaScript源码解析成抽象语法树(AST), 以方便耕细粒度的分析源码;
2. PrePack 实现了一个js解释器, 用于执行源码. 借助这个解释器Prepack掌握执行后的结果, 并把执行结果返回到输出中.

从表面上看去这似乎非常美好, 但是也有很大的局限性:

- 不能识别DOM API和部分的Node API, 如果源码中有调用依赖运行环境的API就会导致Prepack报错.
- 存在优化后的代码性能反而更低的情况;
- 存在优化后代码文件尺寸反而更大的情况

### 接入webpack

Prepack需要在Webpack输出最终的代码之前, 对这些代码进行优化, 就像UglifyJS那样. 因此需要一个新的插件: `prepack-webpack-plugin`:

```js
const PrepackWebpackPlugin = require('prepack-webpack-plugin').default;

module.exports = {
  plugins: [
    new PrepackWebpackPlugin()
  ]
};
```

## 开启 Scope Hoisting

Scope Hoisting 可以让 Webpack 打包出来的代码文件更小、运行的更快， 它又译作 "作用域提升"


### 什么是 Scope Hoisting

假如现在有两个文件`util.js`:

```js
export default 'Hello,Webpack';
```

和入口文件`main.js`:

```js
import str from './util.js';
console.log(str);
```

以上代码用webpack打包输出中的部分代码如下:

```js
[
  (function (module, __webpack_exports__, __webpack_require__) {
    var __WEBPACK_IMPORTED_MODULE_0__util_js__ = __webpack_require__(1);
    console.log(__WEBPACK_IMPORTED_MODULE_0__util_js__["a"]);
  }),
  (function (module, __webpack_exports__, __webpack_require__) {
    __webpack_exports__["a"] = ('Hello,Webpack');
  })
]
```

在开启`scoped hoisting`后, 同样的源码输出如下:

```js
[
  (function (module, __webpack_exports__, __webpack_require__) {
    var util = ('Hello,Webpack');
    console.log(util);
  })
]
```

可以看到, 在开启后, 函数声明由两个变成了一个, `util.js`中定义的内容被直接注入到`main.js`对应的模块中. 这样做的好处是:

- 代码体积更小, 因为函数声明语句会产生大量代码
- 代码在运行时因为创建的函数作用域更少了, 内存开销也随之变小

Scope Hoisting 的实现原理其实很简单: 分析出模块之间的依赖关系, 尽可能的把打散的模块合并到一个函数中去, 但前提是不能造成代码冗余. 因此只有那些被引用了一次的模块才能被合并. 

由于Scope Hoisting需要分析出模块之间的依赖关系, 因此源码必须采用ES6模块化语句, 不然它将无法生效. 


### 使用 Scope Hoisting

要在Webpack中使用Scope Hoisting非常加单, 因为这是Webpack内置的功能, 只需要配置一个插件:

```js
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');

module.exports = {
  plugins: [
    // 开启 Scope Hoisting
    new ModuleConcatenationPlugin(),
  ],
};
```

同时考虑到Scope Hoisting依赖源码需采用ES6模块化语法, 还需要配置`mainFields`. 原因: 应为大部分Npm中的第三方采用了CommonJS语法, 但部分库会同时提供ES6模块化的代码, 为了充分发挥SCope Hoisting的作用, 需要增加以下配置:

```js
module.exports = {
  resolve: {
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main']
  },
};
```

对于采用了非ES6模块语法的代码, webpack会自动降级处理, 可以在启动的时候带上`--display-optimization-bailout`参数, 这样在输出日期中就会包含类似如下的日志:

```sh
[0] ./main.js + 1 modules 80 bytes {0} [built]
    ModuleConcatenation bailout: Module is not an ECMAScript module
```

完整的配置如下:

```js
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');

module.exports = {
  resolve: {
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main']
  },
  plugins: [
    // 开启 Scope Hoisting
    new ModuleConcatenationPlugin(),
  ],
};
```

## 输出分析

虽然我们有非常多的优化方法, 但这些方法也无法涵盖所有的场景, 为此你需要对输出结果进行分析, 决定下一步的优化方向.

最直接的分析方法就是去阅读webpack输出的代码, 但是其可读性非常差, 而且文件庞大, 不能简单直接的分析输出结果. 

所以我们需要借助一些工具, 在启动Webpack时, 支持两个参数, 分别是:

- `--profile`: 记录下构建过程中的耗时信息
- `--json`: 以JSON的合适输出构建结果, 最后只输出一个`.json`文件, 这个文件中包含所有构建相关的信息

在启动Webpack时带上以上两个参数, 启动命令如下:

```sh
webpack --profile --json > stats.json
```

你会发现项目中多出了一个`stats.json`文件. 这个`stats.json`文件是给后面介绍的可视化分析工具使用的. 

### 官方可视化分析工具

Webpack 官方提供了可视化分析工具: `Webpack Analyse`, 它是一个在线的Web应用. 

打开`Webpack Analyse`链接的网页后, 你就会看到一个弹窗提示你上传JSON文件, 也就是需要上传上面的`stats.json`文件. 

`webpack analyse`不会把你选择的`stats.json`文件发送到服务器, 而是在浏览器本地解析, 你也不用单行代码的泄露问题.

![image](/assets/2021-3-9/4-15webpack-analyse-home.png)

它分为六大模块:

- Modules: 展示所有的模块, 每个模块对应一个文件, 并且还包含所有模块之间的依赖关系图, 模块路径, 模块ID, 模块所属的Chunk, 模块大小
- Chunks: 展示所有的代码块, 一个代码块中包含多个模块. 并且还包含代码块的ID, 名称, 大小, 每个代码块包含的模块数量, 以及代码块之间的依赖关系图
- Assets: 展示所有输出的文件资源, 包括`.js`, `.css`, 图片等. 并且还包括文件名称, 大小, 该文件来自哪个代码块. 
- Warning: 展示构建过程中出现的所有警告信息
- Errors: 展示构建过程中出现的所有错误信息
- Hints: 展示处理每个模块的过程中的耗时

### webpack-bundle-analyzer

这是另一个可视化工具, 可以方便的让你知道:

- 打包出的文件中都包含了什么
- 每个文件尺寸在总体中的占比, 一眼看出哪些文件尺寸比较大
- 模块之间的包含关系
- 每个文件的Gzip后的大小

接入的方法也很简单:

1. `npm i -g webpack-bundle-analyzer`
2. 按照上面提到的方法生成`stats.json`文件
3. 执行`webpack0bundle-analyzer`

## 优化总结

### 开发模式下的webpack配置文件

```js
const path = require('path');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const {AutoWebPlugin} = require('web-webpack-plugin');
const HappyPack = require('happypack');

// 自动寻找 pages 目录下的所有目录，把每一个目录看成一个单页应用
const autoWebPlugin = new AutoWebPlugin('./src/pages', {
  // HTML 模版文件所在的文件路径
  template: './template.html',
  // 提取出所有页面公共的代码
  commonsChunk: {
    // 提取出公共代码 Chunk 的名称
    name: 'common',
  },
});

module.exports = {
  // AutoWebPlugin 会找为寻找到的所有单页应用，生成对应的入口配置，
  // autoWebPlugin.entry 方法可以获取到生成入口配置
  entry: autoWebPlugin.entry({
    // 这里可以加入你额外需要的 Chunk 入口
    base: './src/base.js',
  }),
  output: {
    filename: '[name].js',
  },
  resolve: {
    // 使用绝对路径指明第三方模块存放的位置，以减少搜索步骤
    // 其中 __dirname 表示当前工作目录，也就是项目根目录
    modules: [path.resolve(__dirname, 'node_modules')],
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件，使用 Tree Shaking 优化
    // 只采用 main 字段作为入口文件描述字段，以减少搜索步骤
    mainFields: ['jsnext:main', 'main'],
  },
  module: {
    rules: [
      {
        // 如果项目源码中只有 js 文件就不要写成 /\.jsx?$/，提升正则表达式性能
        test: /\.js$/,
        // 使用 HappyPack 加速构建
        use: ['happypack/loader?id=babel'],
        // 只对项目根目录下的 src 目录中的文件采用 babel-loader
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.js$/,
        use: ['happypack/loader?id=ui-component'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        // 增加对 CSS 文件的支持
        test: /\.css$/,
        use: ['happypack/loader?id=css'],
      },
    ]
  },
  plugins: [
    autoWebPlugin,
    // 使用 HappyPack 加速构建
    new HappyPack({
      id: 'babel',
      // babel-loader 支持缓存转换出的结果，通过 cacheDirectory 选项开启
      loaders: ['babel-loader?cacheDirectory'],
    }),
    new HappyPack({
      // UI 组件加载拆分
      id: 'ui-component',
      loaders: [{
        loader: 'ui-component-loader',
        options: {
          lib: 'antd',
          style: 'style/index.css',
          camel2: '-'
        }
      }],
    }),
    new HappyPack({
      id: 'css',
      // 如何处理 .css 文件，用法和 Loader 配置中一样
      loaders: ['style-loader', 'css-loader'],
    }),
    // 4-11提取公共代码
    new CommonsChunkPlugin({
      // 从 common 和 base 两个现成的 Chunk 中提取公共的部分
      chunks: ['common', 'base'],
      // 把公共的部分放到 base 中
      name: 'base'
    }),
  ],
  watchOptions: {
    // 4-5使用自动刷新：不监听的 node_modules 目录下的文件
    ignored: /node_modules/,
  }
};
```

### 生产环境下的配置文件

```js
const path = require('path');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {AutoWebPlugin} = require('web-webpack-plugin');
const HappyPack = require('happypack');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

// 自动寻找 pages 目录下的所有目录，把每一个目录看成一个单页应用
const autoWebPlugin = new AutoWebPlugin('./src/pages', {
  // HTML 模版文件所在的文件路径
  template: './template.html',
  // 提取出所有页面公共的代码
  commonsChunk: {
    // 提取出公共代码 Chunk 的名称
    name: 'common',
  },
  // 指定存放 CSS 文件的 CDN 目录 URL
  stylePublicPath: '//css.cdn.com/id/',
});

module.exports = {
  // AutoWebPlugin 会找为寻找到的所有单页应用，生成对应的入口配置，
  // autoWebPlugin.entry 方法可以获取到生成入口配置
  entry: autoWebPlugin.entry({
    // 这里可以加入你额外需要的 Chunk 入口
    base: './src/base.js',
  }),
  output: {
    // 给输出的文件名称加上 Hash 值
    filename: '[name]_[chunkhash:8].js',
    path: path.resolve(__dirname, './dist'),
    // 指定存放 JavaScript 文件的 CDN 目录 URL
    publicPath: '//js.cdn.com/id/',
  },
  resolve: {
    // 使用绝对路径指明第三方模块存放的位置，以减少搜索步骤
    // 其中 __dirname 表示当前工作目录，也就是项目根目录
    modules: [path.resolve(__dirname, 'node_modules')],
    // 只采用 main 字段作为入口文件描述字段，以减少搜索步骤
    mainFields: ['jsnext:main', 'main'],
  },
  module: {
    rules: [
      {
        // 如果项目源码中只有 js 文件就不要写成 /\.jsx?$/，提升正则表达式性能
        test: /\.js$/,
        // 使用 HappyPack 加速构建
        use: ['happypack/loader?id=babel'],
        // 只对项目根目录下的 src 目录中的文件采用 babel-loader
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.js$/,
        use: ['happypack/loader?id=ui-component'],
        include: path.resolve(__dirname, 'src'),
      },
      {
        // 增加对 CSS 文件的支持
        test: /\.css$/,
        // 提取出 Chunk 中的 CSS 代码到单独的文件中
        use: ExtractTextPlugin.extract({
          use: ['happypack/loader?id=css'],
          // 指定存放 CSS 中导入的资源（例如图片）的 CDN 目录 URL
          publicPath: '//img.cdn.com/id/'
        }),
      },
    ]
  },
  plugins: [
    autoWebPlugin,
    // 4-14开启ScopeHoisting
    new ModuleConcatenationPlugin(),
    // 4-3使用HappyPack
    new HappyPack({
      // 用唯一的标识符 id 来代表当前的 HappyPack 是用来处理一类特定的文件
      id: 'babel',
      // babel-loader 支持缓存转换出的结果，通过 cacheDirectory 选项开启
      loaders: ['babel-loader?cacheDirectory'],
    }),
    new HappyPack({
      // UI 组件加载拆分
      id: 'ui-component',
      loaders: [{
        loader: 'ui-component-loader',
        options: {
          lib: 'antd',
          style: 'style/index.css',
          camel2: '-'
        }
      }],
    }),
    new HappyPack({
      id: 'css',
      // 如何处理 .css 文件，用法和 Loader 配置中一样
      // 通过 minimize 选项压缩 CSS 代码
      loaders: ['css-loader?minimize'],
    }),
    new ExtractTextPlugin({
      // 给输出的 CSS 文件名称加上 Hash 值
      filename: `[name]_[contenthash:8].css`,
    }),
    // 4-11提取公共代码
    new CommonsChunkPlugin({
      // 从 common 和 base 两个现成的 Chunk 中提取公共的部分
      chunks: ['common', 'base'],
      // 把公共的部分放到 base 中
      name: 'base'
    }),
    new DefinePlugin({
      // 定义 NODE_ENV 环境变量为 production 去除 react 代码中的开发时才需要的部分
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    // 使用 ParallelUglifyPlugin 并行压缩输出的 JS 代码
    new ParallelUglifyPlugin({
      // 传递给 UglifyJS 的参数
      uglifyJS: {
        output: {
          // 最紧凑的输出
          beautify: false,
          // 删除所有的注释
          comments: false,
        },
        compress: {
          // 在UglifyJs删除没有用到的代码时不输出警告
          warnings: false,
          // 删除所有的 `console` 语句，可以兼容ie浏览器
          drop_console: true,
          // 内嵌定义了但是只用到一次的变量
          collapse_vars: true,
          // 提取出出现多次但是没有定义成变量去引用的静态值
          reduce_vars: true,
        }
      },
    }),
  ]
};
```

