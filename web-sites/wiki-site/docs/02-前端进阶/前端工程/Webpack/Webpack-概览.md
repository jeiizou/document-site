# Webpack-概览

## 前端打包工具概述

### webpack

webpack是一个打包模块化js的工具

优点在于:

- 专注于处理模块化的项目
- 通过plugin扩展
- 使用场景可以不限于web开发
- 社区庞大活跃
- 良好的开发体验

webpack的缺点则在于只能用于模块化开发的项目

### rollup

rollup是一个类似于webpack的打包工具, 亮点在于能针对es6的源码进行tree shaking以去除那些已经被定义但没有被使用的代码, 以及scope hoisting(作用域提升). 不过这些内容在随后的webpack版本中也实现了, rollup和webpack的差别在于:

- rollup是webpack流行后出现的替代品
- rollup生态不如webpack完善
- rollup功能没有webpack强大
- rollup不支持code spliting, 但好处是打包出来的代码中没有webpack那段模块的加载, 执行和缓存的代码

## 核心概念

- Entry: 入口, Webpack执行构建的第一步将从`Entry`开始, 可以抽象成输入.
- Module: 模块, 在webpack中, 一切都是模块, 一个模块对应着一个文件, webpack会从配置的entry开始递归找到所有依赖的模块
- Chunk: 代码块, 一个Chunk由多个模块组成, 用于代码合并与分割
- Plugin: 扩展插件, 在webpack构建流程中的特定时机注入扩展逻辑来改变构建结果或做你想要做的事情
- Output: 输出结果, 在webpack经过一系列处理并得出最终想要的代码后输出结果

流程: 

- webpack启动后, 从Entry配置Module开始递归解析Entry依赖的所有Module.
- 每找到Module, 就会根据配置的Loader找到对应的转换规则, 对Module进行转换后, 再解析出当前Module依赖的Module.
- 这些模块会议Entry为单位进行分组, 一个Entry和其所有依赖的Module被分到一个组, 也就是一个Chunk.
- 最后Webpack会把所有Chunk转换成文件输出.
- 在整个流程中webpack会恰当的时机执行Plugin里定义的逻辑.

## 主要配置

### Entry

entry 是配置模块的入口, 可抽象成输入. 必填.

- context: webpack 在寻找相对路径的文件时会以`context`为根目录, `context`默认为执行启动`webpack`时所在的当前工作目录

```js
module.exports = {
  context: path.resolve(__dirname, 'app')
}
```

- chunk: webpack会为每个生成的chunk取一个名称, chunk的名称和entry的配置有关
  - 如果entry是一个string或者array, 就只会生成一个chunk, 此时chunk的名称是main
  - 如果entry是一个object, 就可能会出现多个chunk, 此时chunk的名称是object键值对里键的值

entry可以是多种类型:

- 字符串: `./app/entry`
- 数组: `['./app/entry1', './app/entry2']`
- 对象: `{ a: './app/entry-a', b: ['./app/entry-b1', './app/entry-b2']}`
- 函数:

```js
// 同步函数
entry: () => {
  return {
    a:'./pages/a',
    b:'./pages/b',
  }
};
// 异步函数
entry: () => {
  return new Promise((resolve)=>{
    resolve({
       a:'./pages/a',
       b:'./pages/b',
    });
  });
};
```

### Output

表示最终输出的代码, 是一个`object`, 里面包含了一些列配置项. 

#### filename

输出文件的名称, 可以用一些变量动态控制文件名称: 

可用变量: 
- id: Chunk 的唯一标识，从0开始
- name: Chunk 的名称
- hash: Chunk 的唯一标识的 Hash 值
- chunkhash: Chunk 内容的 Hash 值

其中`hash`和`chunkhash`的长度可以指定, `[hash:8]`表示取8位的hash值. 默认是20位

#### chunkFilename

配置无入口的chunk在输出时的文件名称. chunkFilename和上面的filename类似, 但chunkFilename只用于指定在运行过程中生成的Chunk在输出的文件名称. 常见的会在运行时生成Chunk场景有在CommonChunkPlugin, 使用`import('path/to/module')`动态加载等时. chunkFilename支持和filename一致的内置变量. 

#### path

path配置输出文件存放在本地的目录, 必须是string类型的绝对路径. 通常通过node.js模块去获取绝对路径. 

```js
path: path.resolve(__dirname, 'dist_[hash]')
```

#### publicPath

在复杂的项目中可能会有一些构建出的资源需要异步加载, 加载这些异步资源需要对应的地址. 

该配置用于配置发布到线上资源的URL前缀, 为string类型. 默认值是空字符串`''`, 即使用相对路径. 

`path`和`publicPath`都支持字符串模板, 内置变量只有一个`hash`, 表示一次编译操作的hash值.

#### crossOriginLoading

输出的部分代码可能需要异步加载, 而异步加载是通过`JSONP`方式实现的. 该配置用于配置这个异步插入的标签的`crossorigin`值.

script标签的crossorigin属性可以取以下值:

- `anonymous`(默认): 在加载此脚本资源时不会带上用户的Cookie
- `use-credentials`: 在加载此脚本资源时会带上用户的Cookie

通常用设置 crossorigin 来获取异步加载的脚本执行时的详细错误信息。

#### libraryTarget / library

- `output.libraryTarget`: 配置以何种方式导出库。
- `output.library`: 配置导出库的名称。

libraryTarget是字符串的枚举类型, 支持以下的配置:

##### var

加入配置`output.library='LibraryName'`, 则输出和使用的代码如下

```js
// Webpack 输出的代码
var LibraryName = lib_code;

// 使用库的方法
LibraryName.doSomething();
```

##### commonjs

如果配置为`output.library='LibraryName'`, 则输出和使用的代码如下:

```js
// Webpack 输出的代码
exports['LibraryName'] = lib_code;

// 使用库的方法
require('library-name-in-npm')['LibraryName'].doSomething();
```

##### commonjs2

编写的库将通过CommonJS2规范导出, 输出和使用的代码如下:

```js
// Webpack 输出的代码
module.exports = lib_code;

// 使用库的方法
require('library-name-in-npm').doSomething();
```

CommonJS和CommonJS2规范类似, 差别在于CommonJS只能用`exports`导出, 而CommonJS2在CommonJS的基础上增加了`mocule.exports`的导出方式. 

##### this

编写的库将通过 this 被赋值给通过 library 指定的名称:

```js
// Webpack 输出的代码
this['LibraryName'] = lib_code;

// 使用库的方法
this.LibraryName.doSomething();
```

##### window

```js
// Webpack 输出的代码
window['LibraryName'] = lib_code;

// 使用库的方法
window.LibraryName.doSomething();
```

##### global

与window类似

##### libraryExport

配置要导出的模块中哪些子模块需要被导出。 它只有在`output.libraryTarget`被设置成`commonjs`或者`commonjs2`时使用才有意义

### Module

module主要配置如何处理模块

#### loader

`rules`配置模块的读取和解析规则, 类型时一个数组, 数组的每一项描述了如何处理部分文件.

1. 条件配置: 通过`test`, `include`, `exclude`三个配置来命中loader要应用规则的文件
2. 应用规则: 对选中后的文件通过`use`配置项来应用loader, 可以只应用一个loader或者按照从后往前的顺序应用一组loader, 通过还可以在loader传入参数
3. 重置顺序: 一组loader的执行顺序默认是从右到左, 通过enforece选项可以让其中一个loader的执行顺序放到最后或者最前

```js
module: {
  rules: [
    {
      // 命中 JavaScript 文件
      test: /\.js$/,
      // 用 babel-loader 转换 JavaScript 文件
      // ?cacheDirectory 表示传给 babel-loader 的参数，用于缓存 babel 编译结果加快重新编译速度
      use: ['babel-loader?cacheDirectory'],
      // 只命中src目录里的js文件，加快 Webpack 搜索速度
      include: path.resolve(__dirname, 'src')
    },
    {
      // 命中 SCSS 文件
      test: /\.scss$/,
      // 使用一组 Loader 去处理 SCSS 文件。
      // 处理顺序为从后到前，即先交给 sass-loader 处理，再把结果交给 css-loader 最后再给 style-loader。
      use: ['style-loader', 'css-loader', 'sass-loader'],
      // 排除 node_modules 目录下的文件
      exclude: path.resolve(__dirname, 'node_modules'),
    },
    {
      // 对非文本文件采用 file-loader 加载
      test: /\.(gif|png|jpe?g|eot|woff|ttf|svg|pdf)$/,
      use: ['file-loader'],
    },
  ]
}
```

当一个loader需要传入很多参数时, 你还可以通过Object来描述, 例如在上面的balbel-loader配置中有如下代码:

```js
use: [
  {
    loader:'babel-loader',
    options:{
      cacheDirectory:true,
    },
    // enforce:'post' 的含义是把该 Loader 的执行顺序放到最后
    // enforce 的值还可以是 pre，代表把 Loader 的执行顺序放到最前面
    enforce:'post'
  },
  // 省略其它 Loader
]
```

#### noParse

`noParse`配置项可以让`Webpack`忽略对部分没采用模块化的文件的递归解析和处理, 这样能提高构建性能. 

`noParse`是可选配置项, 类型需要是`RegExp`, `[RegExp]`, `function`中的一个

```js
// 使用正则表达式
noParse: /jquery|chartjs/

// 使用函数，从 Webpack 3.0.0 开始支持
noParse: (content)=> {
  // content 代表一个模块的文件路径
  // 返回 true or false
  return /jquery|chartjs/.test(content);
}
```

> 注意被忽略掉的文件里不应该包含 import 、 require 、 define 等模块化语句，不然会导致构建出的代码中包含无法在浏览器环境下执行的模块化语句。

#### parser

webpack是以模块化的js为入口, 所以内置了对模块化js的解析功能, 支持amd, commonjs, systemjs, es6. parser属性可以更细粒度的配置哪些模块语法要解析哪些不解析, 和`noParse`配置项的区别在于`parser`可以精确到语法层面, 而`noParse`只能控制哪些文件不被解析. 

```js
module: {
  rules: [
    {
      test: /\.js$/,
      use: ['babel-loader'],
      parser: {
      amd: false, // 禁用 AMD
      commonjs: false, // 禁用 CommonJS
      system: false, // 禁用 SystemJS
      harmony: false, // 禁用 ES6 import/export
      requireInclude: false, // 禁用 require.include
      requireEnsure: false, // 禁用 require.ensure
      requireContext: false, // 禁用 require.context
      browserify: false, // 禁用 browserify
      requireJs: false, // 禁用 requirejs
      }
    },
  ]
}
```

### Resolve

webpack在启动后会从配置的入口模块触发找到所有依赖的模块, resolve配置webpack如何寻找模块所对应的文件. 

#### alias

该配置用于配置别名

```js
// Webpack alias 配置
resolve:{
  alias:{
    components: './src/components/'
  }
}
```

alias支持`$`符号来缩小范围到只命中以关键字结尾的导入语句:

```js
resolve:{
  alias:{
    'react$': '/path/to/react.min.js'
  }
}
```

`react$`只会命中以react结尾的导入语句, 即只会把`import'react'`关键字替换成`import '/path/to/react.min.js'`

#### mainFields

有一些第三方模块会针对不同环境提供不同的代码. 

```json
{
  "jsnext:main": "es/index.js",// 采用 ES6 语法的代码入口文件
  "main": "lib/index.js" // 采用 ES5 语法的代码入口文件
}
```

webpack会根据`mainFields`的配置去决定优先采用哪份代码, 默认如下:

```js
mainFields: ['browser', 'main']
```

假如你想优先采用 ES6 的那份代码，可以这样配置：

```js
mainFields: ['jsnext:main', 'browser', 'main']
```

#### extensions

`resolve.extensions`用于配置在尝试过程中用到的后缀列表:

```js
extensions: ['.ts', '.js', '.json']
```

#### modules

`modules`配置 Webpack 去哪些目录下寻找第三方模块, 默认是`node_modules`:

```js
modules:['./src/components','node_modules']
```

#### descriptionFiles

第三方模块的文件名称:

```js
descriptionFiles: ['package.json']
```

#### enforceExtension

强制所有导入语句都必须带文件后缀

#### enforceModuleExtension

和上一个作用类似, 但该选项只对`node_modules`下的模块生效. 

### Plugin

plugin 的配置主要看插件本身设计的api

```js
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

module.exports = {
  plugins: [
    // 所有页面都会用到的公共代码提取到 common 代码块中
    new CommonsChunkPlugin({
      name: 'common',
      chunks: ['a', 'b']
    }),
  ]
};
```

### DevServer

- hot: 是否启用热替换
- inline: 用于配置是否自动注入这个代理客户端到将运行在页面里的 Chunk 里去, 默认注入
- historyApiFallback: 针对任何命中的路由时都返回一个对应的html文件
- contentBase: 服务器的文件更目录, 默认为当前执行目录, DevServer 服务器通过 HTTP 服务暴露出的文件分为两类: 本地文件或者webpack的构建结果, 这里的选项只能配置暴露本地文件的规则
- headers: 注入一些 HTTP 响应头
- host: devserver服务监听的地址, 例如你想要局域网中的其它设备访问你本地的服务，可以在启动 DevServer 时带上 --host 0.0.0.0。 host 的默认值是 127.0.0.1 即只有本地可以访问 DevServer 的 HTTP 服务
- port: 服务监听的端口
- allowedHosts: 只有 HTTP 请求的 HOST 在列表里才正常返回
- disableHostCheck: 用于配置是否关闭用于DNS重绑定的HTTP请求的HOST检查
- https: 切换https协议服务
- clientLogLevel: 客户端的日志级别, 会影响在浏览器的开发者工具控制台中看到的日志内容
- compress: 是否启用gzip
- open: 是否启动且第一次构建完后自动打开浏览器


## 其他配置

### Target

target 配置项可以让 Webpack 构建出针对不同运行环境的代码。 target 可以是以下之一：

| target值          | 描述                                           |
| ----------------- | ---------------------------------------------- |
| web               | 针对浏览器 (默认)，所有代码都集中在一个文件里  |
| node              | 针对 Node.js，使用 require 语句加载 Chunk 代码 |
| async-node        | 针对 Node.js，异步加载 Chunk 代码              |
| webworker         | 针对 WebWorker                                 |
| electron-main     | 针对 Electron 主线程                           |
| electron-renderer | 针对 Electron 渲染线程                         |

例如当你设置`target:'node'`时，源代码中导入 Node.js 原生模块的语句`require('fs')`将会被保留，`fs`模块的内容不会打包进`Chunk`里。

### Devtool

devtool 配置 Webpack 如何生成 Source Map，默认值是 false 即不生成 Source Map，想为构建出的代码生成 Source Map 以方便调试，可以这样配置：

```js
module.export = {
  devtool: 'source-map'
}
```

### Watch / WatchOption

支持监听文件更新, 在文件发生变化的时候重新编译:

```js
module.export = {
  watch: true
}
```

此外可以用`watchOption`配置相关参数:

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

### Externals

Externals 用来告诉 Webpack 要构建的代码中使用了哪些不用被打包的模块，也就是说这些模版是外部环境提供的，Webpack 在打包时可以忽略它们。

比如在html里面有手动引入的外部库:

```js
<script src="path/to/jquery.js"></script>
```

则:

```js
import $ from 'jquery';
$('.my-element');
```

通过配置:

```js
module.export = {
  externals: {
    // 把导入语句里的 jquery 替换成运行环境里的全局变量 jQuery
    jquery: 'jQuery'
  }
}
```

### ResolveLoader

ResolveLoader用于高速webpack如何去寻找loader, 因为在使用loader时是通过其包名称去引用的, webpack需要根据配置的loader包名去找到Loader的实际代码, 以调用Loader去处理源文件

```js
module.exports = {
  resolveLoader:{
    // 去哪个目录下寻找 Loader
    modules: ['node_modules'],
    // 入口文件的后缀
    extensions: ['.js', '.json'],
    // 指明入口文件位置的字段
    mainFields: ['loader', 'main']
  }
}
```

