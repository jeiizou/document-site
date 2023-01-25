# Webpack-原理

## 基本概念

- Entry: 入口, webpack执行构建从Entry开始, 会抽象成输入
- Module: 模块, 在Webpack中的一切都是模块, 一个模块对应着一个文件
- Chunk: 代码块, 一个Chunk由多个模块组合而成, 用于代码分割和合并
- Loader: 模块转换器, 用于把模块按照原来的内容转换成新内容
- Plugin: 扩展插件, 在webpack构建流程中的特定时机会广播出对应的时间, 插件可以监听这些事件的发生, 在特定时机做对应的事

### 流程概括

整体的流程概览如下:

![image](/assets/2021-3-9/TB1GVGFNXXXXXaTapXXXXXXXXXX-4436-4244.jpg)

webpack的运行流程是一个串行的过程, 从启动到结束会依次执行以下流程:

1. 初始化参数: 从配置文件和Shell语句中读取与合并参数, 得出最终的参数
2. 开始编译: 用得到的参数初始化Compiler对象, 加载所有配置的插件, 执行对象的run方法开始执行编译.
3. 确定入口: 根据配置中的entry找到所有的入口文件
4. 编译模块: 从入口文件触发, 调用所有配置的Loader对象进行翻译, 再找出该模块依赖的模块, 再递归本步骤知道所有入口依赖的文件都经过本步骤的处理
5. 完成模块编译: 在经过第四步之后, 得到了每个模块被翻译后的最终内容以及它们之间的依赖关系
6. 输出资源: 根据入口和模块之间的依赖关系, 组装成一个个包含有多个模块的chunk, 再把每个chunk转换成一个单独文件加入到输出类表, 这一步是可以修改输出内容的最后机会
7. 输出完成: 在确定好输出内容后, 根据配置确定输出的路径和文件名, 把文件内容写入到文件系统.

在这些流程中, webpack会在特定的时间点广播出特定的事件, 插件在监听到感兴趣的事件后会执行特定的逻辑, 并且插件可以调用webpack提供的API改变Webpack的运行结果

### 细节流程

webpack 的构建流程可以分为三个阶段:

1. 初始化: 启动构建, 读取与合并配置参数, 加载Plugin, 实例化Compiler
2. 编译: 从入口出发, 针对每个Module串行调用对应的Loader去翻译文件内容, 再找到该Module依赖的Module, 递归的进行编译处理
3. 输出: 对编译后的Module组合成Chunk, 把Chunk转换成文件, 输出到文件系统

如果只执行一次构建, 上阶段将会按照顺序各执行一次. 在开启监听模式下, 流程将如下所示:

![image](/assets/2021-3-9/5-1_.png)

在每个大阶段中又会发生很多是, 下面来意义介绍

### 初始化阶段

#### 初始化参数

从配置文件和Shell语句中读取和合并参数, 得出最终的参数, 这个过程会执行配置文件中的插件实例化语句`new Plugin()`

#### 实例化Compiler

用上一步带到的参数初始化Compiler实例, Compiler负责文件的监听和启动编译. Compiler实例中包含了完整的webpack配置, 全局只有一个Compiler实例

#### 加载插件

依次调用插件的`apply`方法, 让插件可以监听后续的所有事件节点. 同时给插件传入`compiler`实例的引用, 以方便插件通过compiler调用webpack提供的API

#### environment

开始应用Node.js风格的文件系统到compiler对象, 以方便后续的文件寻找和读取

#### entry-option

读取配置的Entrys, 为每个Entry实例化一个对应的EntryPlugin, 为后面该Entry的递归解析工作做准备

#### after-plugins

调用完所有内置的和配置的插件的apply方法

#### after-resolvers

根据配置初始化万resolver, resolver负责在文件系统中寻找指定路径的文件

### 编译阶段

#### run

启动一次新的编译

#### watch-run

和run类似, 区别是在于它是监听模式下启动的编译, 在这个事件中可以获取到哪些文件发生了变化导致重新启动一次新的编译

#### compile

该事件是为了告诉插件一次新的编译将要启动, 同时会给插件带上`compiler`对象

#### compilation

当webpack以开发模式运行的时候, 每当检测到文件变化, 一次新的Compilation将被创建. 一个Compilation对象包含了当前的模块资源, 编译生成资源, 变化的文件等.

Compilation 对象也提供了很多时间回调供插件进行扩展.

compilation事件是编一阶段最重要的时间, 因为在compilation阶段调用了Loader完成了每个模块的转换操作, 在compilation中有包括很多小的事件, 他们分别是:

- `build-module`: 使用对应的Loader去转换一个模块
- `normal-module-loader`: 在用Loader对一个模块转换完后, 使用acorn解析转换后的内容, 输出对应的抽象语法树(AST), 以方便Webpack后面对代码的的分析
- `program`: 从配置的入口模块开始, 分析AST, 当遇到`require`等导入其他模块语句时, 便将其加入到依赖的模块列表, 同时对新找出的依赖模块递归分析, 最终搞清楚所有模块的依赖关系
- seal: 所有模块机器依赖的模块都通过Loader转换完成后, 根据依赖关系开始生成Chunk

#### make

一个新的Compilation创建完毕了, 即将从Entry开始读取文件, 根据文件类型和配置的Loader对文件进行斌阿姨, 编译完后再找出该文件依赖的文件, 递归的编译和解析

#### after-compile

一次Compilation执行完成

#### invalid

当遇到文件不存在, 文件编译错误等异常时会触发该事件, 该事件不会导致Webpack退出

### 输出阶段

#### should-emit

所有需要输出的文件已经生成好, 询问插件哪些文件需要输出, 哪些不需要

#### emit

确定好要输出哪些文件后, 执行文件输出, 可以在这里获取和修改输出内容

#### after-emit

文件输出完毕

#### done

成功完成一次完成的编译和输出流程

#### failed

如果在编译和输出流程中遇到异常导致Webpack退出时, 就会直接跳转到本步骤, 插件可以在本事件中获取到具体的错误原因.

在输出阶段已经得到了各个模块经过转换后的结果和其依赖关系, 并把相关模块组合在一起形成一个个Chunk. 在输出阶段会根据Chunk的类型, 使用对应的模板生成最终要输出的文件内容

下面就是如何吧Chunk输出为具体的文件

## 输出文件分析

这节主要介绍webpack输出的bundle的内容和原理.

先来看看一个简单的`bundle.js`文件内容, 代码如下:

```js
(
    // webpackBootstrap 启动函数
    // modules 即为存放所有模块的数组，数组中的每一个元素都是一个函数
    function (modules) {
        // 安装过的模块都存放在这里面
        // 作用是把已经加载过的模块缓存在内存中，提升性能
        var installedModules = {};

        // 去数组中加载一个模块，moduleId 为要加载模块在数组中的 index
        // 作用和 Node.js 中 require 语句相似
        function __webpack_require__(moduleId) {
            // 如果需要加载的模块已经被加载过，就直接从内存缓存中返回
            if (installedModules[moduleId]) {
                return installedModules[moduleId].exports;
            }

            // 如果缓存中不存在需要加载的模块，就新建一个模块，并把它存在缓存中
            var module = installedModules[moduleId] = {
                // 模块在数组中的 index
                i: moduleId,
                // 该模块是否已经加载完毕
                l: false,
                // 该模块的导出值
                exports: {}
            };

            // 从 modules 中获取 index 为 moduleId 的模块对应的函数
            // 再调用这个函数，同时把函数需要的参数传入
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            // 把这个模块标记为已加载
            module.l = true;
            // 返回这个模块的导出值
            return module.exports;
        }

        // Webpack 配置中的 publicPath，用于加载被分割出去的异步代码
        __webpack_require__.p = "";

        // 使用 __webpack_require__ 去加载 index 为 0 的模块，并且返回该模块导出的内容
        // index 为 0 的模块就是 main.js 对应的文件，也就是执行入口模块
        // __webpack_require__.s 的含义是启动模块对应的 index
        return __webpack_require__(__webpack_require__.s = 0);

    })(

    // 所有的模块都存放在了一个数组里，根据每个模块在数组的 index 来区分和定位模块
    [
        /* 0 */
        (function (module, exports, __webpack_require__) {
            // 通过 __webpack_require__ 规范导入 show 函数，show.js 对应的模块 index 为 1
            const show = __webpack_require__(1);
            // 执行 show 函数
            show('Webpack');
        }),
        /* 1 */
        (function (module, exports) {
            function show(content) {
                window.document.getElementById('app').innerText = 'Hello,' + content;
            }
            // 通过 CommonJS 规范导出 show 函数
            module.exports = show;
        })
    ]
);
```

上面的立即执行函数可以简化为:

```js
(function(modules) {

  // 模拟 require 语句
  function __webpack_require__() {
  }

  // 执行存放所有模块数组中的第0个模块
  __webpack_require__(0);

})([/*存放所有模块的数组*/])
```

`bundle.js`能直接运行在浏览器中的原因就在于输出文件中通过`__webpack_require__`函数定义了一个可以在浏览器中执行的加载函数来模拟Node.js中的`require`语句

原来一个个独立的模块文件被合并到了一个单独的`bundle.js`的原因在于浏览器不能像Node.js那样快速的去本地加载一个个模块文件, 而必须通过网络请求去加载还未得到的文件. 如果模块数量很多, 加载时间会很长, 因此把所有模块都存放在数组中, 执行一次网络加载. 

如果仔细分析`__webpack__require__`函数的实现, 你会发现webpack做了缓存优化: 执行加载过的模块不会再执行第二次, 执行结果会缓存在内存中, 当某个模块第二次被访问时会直接去内容中读取被缓存的返回值.

### 分割代码时的输出

在采用按需加载的时候, webpack的输出文件会发生变化. 例如吧`main.js`修改为:

```js
// 异步加载 show.js
import('./show').then((show) => {
  // 执行 show 函数
  show('Webpack');
});
```

重新构建后会输出两个文件, 分别是执行入口文件`bundle.js`和异步加载文件`0.bundle.js`.

其中`0.bundle.js`的内容如下:

```js
// 加载在本文件(0.bundle.js)中包含的模块
webpackJsonp(
  // 在其它文件中存放着的模块的 ID
  [0],
  // 本文件所包含的模块
  [
    // show.js 所对应的模块
    (function (module, exports) {
      function show(content) {
        window.document.getElementById('app').innerText = 'Hello,' + content;
      }

      module.exports = show;
    })
  ]
);
```

`bundle.js`内容如下:

```js
(function (modules) {
  /***
   * webpackJsonp 用于从异步加载的文件中安装模块。
   * 把 webpackJsonp 挂载到全局是为了方便在其它文件中调用。
   *
   * @param chunkIds 异步加载的文件中存放的需要安装的模块对应的 Chunk ID
   * @param moreModules 异步加载的文件中存放的需要安装的模块列表
   * @param executeModules 在异步加载的文件中存放的需要安装的模块都安装成功后，需要执行的模块对应的 index
   */
  window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules, executeModules) {
    // 把 moreModules 添加到 modules 对象中
    // 把所有 chunkIds 对应的模块都标记成已经加载成功 
    var moduleId, chunkId, i = 0, resolves = [], result;
    for (; i < chunkIds.length; i++) {
      chunkId = chunkIds[i];
      if (installedChunks[chunkId]) {
        resolves.push(installedChunks[chunkId][0]);
      }
      installedChunks[chunkId] = 0;
    }
    for (moduleId in moreModules) {
      if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
        modules[moduleId] = moreModules[moduleId];
      }
    }
    while (resolves.length) {
      resolves.shift()();
    }
  };

  // 缓存已经安装的模块
  var installedModules = {};

  // 存储每个 Chunk 的加载状态；
  // 键为 Chunk 的 ID，值为0代表已经加载成功
  var installedChunks = {
    1: 0
  };

  // 模拟 require 语句，和上面介绍的一致
  function __webpack_require__(moduleId) {
    // ... 省略和上面一样的内容
  }

  /**
   * 用于加载被分割出去的，需要异步加载的 Chunk 对应的文件
   * @param chunkId 需要异步加载的 Chunk 对应的 ID
   * @returns {Promise}
   */
  __webpack_require__.e = function requireEnsure(chunkId) {
    // 从上面定义的 installedChunks 中获取 chunkId 对应的 Chunk 的加载状态
    var installedChunkData = installedChunks[chunkId];
    // 如果加载状态为0表示该 Chunk 已经加载成功了，直接返回 resolve Promise
    if (installedChunkData === 0) {
      return new Promise(function (resolve) {
        resolve();
      });
    }

    // installedChunkData 不为空且不为0表示该 Chunk 正在网络加载中
    if (installedChunkData) {
      // 返回存放在 installedChunkData 数组中的 Promise 对象
      return installedChunkData[2];
    }

    // installedChunkData 为空，表示该 Chunk 还没有加载过，去加载该 Chunk 对应的文件
    var promise = new Promise(function (resolve, reject) {
      installedChunkData = installedChunks[chunkId] = [resolve, reject];
    });
    installedChunkData[2] = promise;

    // 通过 DOM 操作，往 HTML head 中插入一个 script 标签去异步加载 Chunk 对应的 JavaScript 文件
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.timeout = 120000;

    // 文件的路径为配置的 publicPath、chunkId 拼接而成
    script.src = __webpack_require__.p + "" + chunkId + ".bundle.js";

    // 设置异步加载的最长超时时间
    var timeout = setTimeout(onScriptComplete, 120000);
    script.onerror = script.onload = onScriptComplete;

    // 在 script 加载和执行完成时回调
    function onScriptComplete() {
      // 防止内存泄露
      script.onerror = script.onload = null;
      clearTimeout(timeout);

      // 去检查 chunkId 对应的 Chunk 是否安装成功，安装成功时才会存在于 installedChunks 中
      var chunk = installedChunks[chunkId];
      if (chunk !== 0) {
        if (chunk) {
          chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
        }
        installedChunks[chunkId] = undefined;
      }
    };
    head.appendChild(script);

    return promise;
  };

  // 加载并执行入口模块，和上面介绍的一致
  return __webpack_require__(__webpack_require__.s = 0);
})
(
  // 存放所有没有经过异步加载的，随着执行入口文件加载的模块
  [
    // main.js 对应的模块
    (function (module, exports, __webpack_require__) {
      // 通过 __webpack_require__.e 去异步加载 show.js 对应的 Chunk
      __webpack_require__.e(0).then(__webpack_require__.bind(null, 1)).then((show) => {
        // 执行 show 函数
        show('Webpack');
      });
    })
  ]
);
```

这里的`bundle.js`和上面所讲的`bundle.js`非常的相似, 区别在于:

* 多了一个`__webpack_require__.e`用于加载被分割出去的, 需要异步加载的Chunk对应的文件
* 多个一个`webpackJsonp`函数用于从异步加载的文件中安装模块

在使用了CommonsChunkPlugin去提取公共代码时输出的文件和使用了异步加载时输出的文件是一样的, 都会有`__webpack__require__.e`和`webpackJsonp`. 原因在于提取公共代码和异步加载本质上都是代码分割

## 编写Loader

Loader能把源文件经过转化后输出新的结果, 并且一个文件还可以链式的经过多个翻译员翻译.

以处理SCSS文件为例:

1. scss源代码会先交给sass-loader把scss转换成css
2. 把sass-loader输出的css交给css-loader处理, 找出css中依赖的资源, 压缩css等
3. 把css-loader输出css交给style-loader处理, 转换成通过脚本脚在的js代码

可以看到上面的处理过程是需要顺序的链式调用, 先执行`sass-loader`再`css-loader`再`style-loader`:

```js
module.exports = {
  module: {
    rules: [
      {
        // 增加对 SCSS 文件的支持
        test: /\.scss$/,
        // SCSS 文件的处理顺序为先 sass-loader 再 css-loader 再 style-loader
        use: [
          'style-loader',
          {
            loader:'css-loader',
            // 给 css-loader 传入配置项
            options:{
              minimize:true, 
            }
          },
          'sass-loader'],
      },
    ]
  },
};
```

### Loader的职责

一个Loader的职责是单一的, 只需要完成一种转换. 如果一个源文件需要经历多步转换才能正常使用, 就通过多个Loader去转换, 在调用多个Loader去转换一个文件的时候, 每个Loader会链式的顺序执行.

所以开发一个Loader, 请务必保持其职责的单一性, 你只需要关心输入和输出.

### Loader的基础

由于Webpack是运行在Node.js之上的, 一个Loader其实就是一个Node.js模块, 这个模块需要导出一个函数. 这个导出的函数的工作就是获得处理前的原内容, 对原内容执行处理后, 返回处理后的内容. 

一个简单的loader源码如下:

```js
module.exports = function(source) {
  // source 为 compiler 传递给 Loader 的一个文件的原内容
  // 该函数需要返回处理后的内容，这里简单起见，直接把原内容返回了，相当于该 Loader 没有做任何转换
  return source;
};
```

由于Loader运行在Node中, 你可以调用任何Node的API, 比如:

```js
const sass = require('node-sass');
module.exports = function(source) {
  return sass(source);
};
```

### Loader 进阶

Webpack还提供一些API供Loader调用. 

#### 获得Loader的options

```js
const loaderUtils = require('loader-utils');
module.exports = function(source) {
  // 获取到用户给当前 Loader 传入的 options
  const options = loaderUtils.getOptions(this);
  return source;
};
```

#### 返回其他结果

有些场景下, 但有些场景下还返回除了内容之外的东西. 

例如用babel-loader转换es6代码为例, 它还需要输出转换后的es5代码对应的`source-map`, 以方便调试源码. 为了吧Source Map也一起随着ES5代码返回给Webpack, 可以这样写:

```js
module.exports = function(source) {
  // 通过 this.callback 告诉 Webpack 返回的结果
  this.callback(null, source, sourceMaps);
  // 当你使用 this.callback 返回内容时，该 Loader 必须返回 undefined，
  // 以让 Webpack 知道该 Loader 返回的结果在 this.callback 中，而不是 return 中 
  return;
};
```

其中的`this.callback`是`webpack`给loader注入的API, 以方便Loader和Webpack之间通信. `this.callback`的详细使用方法如下:

```js
this.callback(
    // 当无法转换原内容时，给 Webpack 返回一个 Error
    err: Error | null,
    // 原内容转换后的内容
    content: string | Buffer,
    // 用于把转换后的内容得出原内容的 Source Map，方便调试
    sourceMap?: SourceMap,
    // 如果本次转换为原内容生成了 AST 语法树，可以把这个 AST 返回，
    // 以方便之后需要 AST 的 Loader 复用该 AST，以避免重复生成 AST，提升性能
    abstractSyntaxTree?: AST
);
```

> Source Map 的生成很耗时，通常在开发环境下才会生成 Source Map，其它环境下不用生成，以加速构建。 为此 Webpack 为 Loader 提供了 this.sourceMap API 去告诉 Loader 当前构建环境下用户是否需要 Source Map。 如果你编写的 Loader 会生成 Source Map，请考虑到这点。

#### 同步和异步

Loader有同步和异步之分, 上面介绍的Loader都是同步的Loader, 因为他们的转换流程都是同步的, 转换完成后再返回结果. 但是有些场景下转换的步骤只能异步完成, 例如你需要通过网络请求才能得出结果. 如果采用同步的方式, 网络请求就会则阻塞整个构建, 导致构建非常缓慢.

异步的处理方式可以这样:

```js
module.exports = function(source) {
    // 告诉 Webpack 本次转换是异步的，Loader 会在 callback 中回调结果
    var callback = this.async();
    someAsyncOperation(source, function(err, result, sourceMaps, ast) {
        // 通过 callback 返回异步执行后的结果
        callback(err, result, sourceMaps, ast);
    });
};
```

#### 处理二进制数据

在默认的情况下, webpack传递给loader的内容都是UTF-8格式编码的字符串. 但是有些场景下Loader需要处理二进制文件, 比如`file-loader`. 就需要webpack给Loader传入二进制格式的数据, 为此, 你需要这样编写Loader.

```js
module.exports = function(source) {
    // 在 exports.raw === true 时，Webpack 传给 Loader 的 source 是 Buffer 类型的
    source instanceof Buffer === true;
    // Loader 返回的类型也可以是 Buffer 类型的
    // 在 exports.raw !== true 时，Loader 也可以返回 Buffer 类型的结果
    return source;
};
// 通过 exports.raw 属性告诉 Webpack 该 Loader 是否需要二进制数据 
module.exports.raw = true;
```

其中最后一行就是关键代码


#### 缓存加速

在有些情况下, 有些转换操作需要大量计算, 非常耗时, 如果每次构建都重新执行重复的转换操作, 构建将会变得非常缓慢. 为此, webpack会默认缓存所有的Loader的处理结果, 也就是说在需要被处理的文件或其依赖的文件没有发生变化的时候, 是不会重新调用对应的Loader去执行转换操作的. 

如果你想让Webpack不缓存Loader的处理结果, 可以这样:

```js
module.exports = function(source) {
  // 关闭该 Loader 的缓存功能
  this.cacheable(false);
  return source;
};
```

### 其他 Loader API

除了以上提到的Loader中调用的webpack api, 还存在常用API:

- `this.context`: 当前处理文件的所在目录, 假如当前Loader处理的文件是`/src/main.js`, 则`context`指向`/src`.
- `this.resource`: 当前处理文件的完整请求路径，包括`querystring`，例如`/src/main.js?name=1`
- `this.resourcePath`: 当前处理文件的路径, 例如`/src/main.js`
- `this.resourceQuery`: 当前处理文件的queryString
- `this.target`: 等于Webpack配置中的Target
- `this.loadModule`: 当Loader在处理一个文件的时候, 如果依赖其他文件的处理结果才能得出当前文件的结果时, 就可以通过`this.loadModule(request: string, callback: function(err, source, sourceMap, module))`去获取`request`对应的文件处理
- `this.resolve`: 像`require`语句一样获得指定文件的完整路径, 使用方法为: `resolve(context: string, request: string, callback: function(err, result: string))`
- `this.addDependency`: 给当前处理文件添加其依赖的文件, 以便再其依赖的文件发生变化时, 会重新调用Loader处理该文件. 使用方法为:`addDependency(file: string)`
- `this.addContextDependency`: 和`addDependency`类似，但`addContextDependency`是把整个目录加入到当前正在处理文件的依赖中。使用方法为`addContextDependency(directory: string)`。
- `this.clearDependency`: 清除当前正在处理文件的所有依赖, 使用方法为`clearDependency()`.
- `this.emitFile`: 输出一个文件, 使用方法为`emitFile(name: string, content: Buffer|string, sourceMap: {...})`

### 加载本地Loader

在开发Loader的过程中, 为了测试编写的Loader是否正常工作, 需要把它配置到webpack中后, 才可能会调用该Loader. 在前面的章节中, 使用的Loader都是通过Npm安装, 要使用Loader时会直接使用Loader的名称, 代码如下:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader'],
      },
    ]
  },
};
```

如果还采取这种方法, 会比较麻烦, 有两种办法解决.

#### Npm link

Npm link 专用于开发和调试本地Npm模块. 

#### ResolveLoader

可以在webpack的配置之中增加`resolveLoader`:

```js
module.exports = {
  resolveLoader:{
    // 去哪些目录下寻找 Loader，有先后顺序之分
    modules: ['node_modules','./loaders/'],
  }
}
```

## 编写Plugin

webpack通过Plugin机制让其更加灵活, 以适应各种应用场景. 在Webpack运行的生命周期中会广播出许多事件, Plugin可以监听这些事件, 在合适的实际通过webpack提供的API改变输出结果. 

一个基础的Plugin的代码是这样的:

```js
class BasicPlugin{
  // 在构造函数中获取用户给该插件传入的配置
  constructor(options){
  }

  // Webpack 会调用 BasicPlugin 实例的 apply 方法给插件实例传入 compiler 对象
  apply(compiler){
    compiler.plugin('compilation',function(compilation) {
    })
  }
}

// 导出 Plugin
module.exports = BasicPlugin;
```

在使用这个Plugin时, 相关配置代码如下:

```js
const BasicPlugin = require('./BasicPlugin.js');
module.export = {
  plugins:[
    new BasicPlugin(options),
  ]
}
```

- webpack启动后, 在读取配置的过程中会先执行`new BasicPlugin(options)`初始化一个BasicPlugin获取其实例. 
- 在初始化Compile对象后, 再调用`basicPlugin.apply(compiler)`给插件实例传入compiler对象. 
- 插件实例在获取到compiler对象, 就可以通过`compiler.plugin(事件名称, 回调函数)`监听到Webpack广播出来的事件, 并且可以通过compiler对象去操作webpack.

在实际的开发中还有很多的细节需要注意:

### Compiler 和 Compilation

在开发Plugin时, 最常用的两个对象就是Compiler和Compilation, 他们是Plugin和webpack之间的桥梁. Compiler和Compilation的含义如下:

- Compiler 对象包含了Webpack环境所有的配置信息, 包含options, loaders, plugins这些信息. 这个对象在webpack启动的时候被实例化, 它是全局唯一的, 可以简单的理解为webpack实例
- Compilation 对象包含了当前的模块资源, 编译生成资源, 变化的文件等. 当webpack以开发模式运行的时候, 每当检测到一个文件变化, 一个新的Compilation将被创建. Compilation对象也提高了很多事件回调供插件做扩展. 通过Compilation也能读取到Compiler对象

Compiler 和 Compilation 的区别在于: Compiler代表了整个webpack从启动到关闭的生命周期, 而compilation只是代表了一次新的编译. 

### 事件流

webpack就像一条生产线, 要经过一系列处理流程后才能将源文件转换成输出结果. 这条生产线上的每个处理流程的职责都是单一的, 多个流程之间存在依赖关系, 只有完成当前处理后才能交给下一个流程去处理. 插件就像是一个插入到生产线中的一个功能. 在特定的实际对生产线上的资源进行处理.

webpack 通过`Tapable`来组织这条复杂的生产线. webpack在运行过程中会广播事件, 插件只需要监听它所关心的时间, 就能加入到这条生产线中, 去改变生产线的运作. webpack的时间流机制保证了插件的有序性, 使得整个系统的扩展性很好. 

webpack的时间流机制应用了观察者模式, 和node.js中的EventEmitter非常的相似. Compiler和Compilation都继承自Taopable, 可以直接在Compiler和Compilation对象上广播和监听事件. 方法如下:

```js
/**
* 广播出事件
* event-name 为事件名称，注意不要和现有的事件重名
* params 为附带的参数
*/
compiler.apply('event-name',params);

/**
* 监听名称为 event-name 的事件，当 event-name 事件发生时，函数就会被执行。
* 同时函数中的 params 参数为广播事件时附带的参数。
*/
compiler.plugin('event-name',function(params) {

});
```

同理, `compilation.apply`和`compilation.plugin`使用方式和这里是一致的. 

在开发插件的时候, 需要注意:

1. 只要能拿到Compiler或者Compilation对象, 就能广播出新的事件, 所以在新开发的插件中也能广播出事件提供给其他插件使用
2. 传给每个插件的Compiler和Compilation对象都是同一个引用, 也就是说在一个插件中修改这些对象会影响到后面的插件
3. 有些事件是异步, 这些异步的事件会附带两个参数, 第二个参数为回调函数, 在插件处理完任务的时候需要调用回调函数通知webpack, 才会进入下一处理流程:

```js
compiler.plugin('emit',function(compilation, callback) {
    // 支持处理逻辑

    // 处理完毕后执行 callback 以通知 Webpack 
    // 如果不执行 callback，运行流程将会一直卡在这不往下执行 
    callback();
});
```

### 常用 API

插件可以用来修改输出文件, 增加输出文件, 甚至可以提升webpack的性能等等. 这里介绍一些常用的API

#### 读取输出资源, 代码块, 模块以及依赖

有些插件可能需要读取webpack的处理结果, 比如输出资源, 代码块, 模块机器依赖, 以便进行下一步处理. 

在`emit`事件发生时, 代表源文件的转换和组装完成了, 在这里能获取最终的资源, 代码块, 模块及其依赖, 并修改输出资源的内容:

```js
class Plugin {
  apply(compiler) {
    compiler.plugin('emit', function (compilation, callback) {
      // compilation.chunks 存放所有代码块，是一个数组
      compilation.chunks.forEach(function (chunk) {
        // chunk 代表一个代码块
        // 代码块由多个模块组成，通过 chunk.forEachModule 能读取组成代码块的每个模块
        chunk.forEachModule(function (module) {
          // module 代表一个模块
          // module.fileDependencies 存放当前模块的所有依赖的文件路径，是一个数组
          module.fileDependencies.forEach(function (filepath) {
          });
        });

        // Webpack 会根据 Chunk 去生成输出的文件资源，每个 Chunk 都对应一个及其以上的输出文件
        // 例如在 Chunk 中包含了 CSS 模块并且使用了 ExtractTextPlugin 时，
        // 该 Chunk 就会生成 .js 和 .css 两个文件
        chunk.files.forEach(function (filename) {
          // compilation.assets 存放当前所有即将输出的资源
          // 调用一个输出资源的 source() 方法能获取到输出资源的内容
          let source = compilation.assets[filename].source();
        });
      });

      // 这是一个异步事件，要记得调用 callback 通知 Webpack 本次事件监听处理结束。
      // 如果忘记了调用 callback，Webpack 将一直卡在这里而不会往后执行。
      callback();
    })
  }
}
```


#### 监听文件变化

webpack会从配置的入口模块出发, 一次找到所有的依赖模块, 当入口模块或者其依赖的模块发生变化的时候, 就会触发一次新的Compilation. 

插件开发的时候经常会需要知道是哪个文件发生变化导致了新的Compilation:

```js
// 当依赖的文件发生变化时会触发 watch-run 事件
compiler.plugin('watch-run', (watching, callback) => {
    // 获取发生变化的文件列表
    const changedFiles = watching.compiler.watchFileSystem.watcher.mtimes;
    // changedFiles 格式为键值对，键为发生变化的文件路径。
    if (changedFiles[filePath] !== undefined) {
      // filePath 对应的文件发生了变化
    }
    callback();
});
```

默认情况下, webpack只会监听入口以及依赖的模块是否发生变化. 有些情况下, 比如引入了一个html文件, 是不会被webpack监听到的. 如果想要监听html文件的变化, 就需要把html文件加入到依赖列表:

```js
compiler.plugin('after-compile', (compilation, callback) => {
  // 把 HTML 文件添加到文件依赖列表，好让 Webpack 去监听 HTML 模块文件，在 HTML 模版文件发生变化时重新启动一次编译
    compilation.fileDependencies.push(filePath);
    callback();
});
```

#### 修改输出资源

有些场景下插件需要修改, 增加, 删除资源. 需要监听`emit`事件, 因为发生`emit`事件的时候, 所有模块的转换和代码对应的文件已经生成好了, 需要输出的资源即将输出, `emit`是修改webpack输出资源的最后时机.

所有需要输出的资源会存在`compilation.assets`中, `compilation.assets`是一个键值对. 键为需要输出的文件名称, 值为文件对应的内容.

设置`compilation.assets`的代码如下:

```js
compiler.plugin('emit', (compilation, callback) => {
  // 设置名称为 fileName 的输出资源
  compilation.assets[fileName] = {
    // 返回文件内容
    source: () => {
      // fileContent 既可以是代表文本文件的字符串，也可以是代表二进制文件的 Buffer
      return fileContent;
      },
    // 返回文件大小
      size: () => {
      return Buffer.byteLength(fileContent, 'utf8');
    }
  };
  callback();
});
```

读取`compilation.assets`的代码如下:

```js
compiler.plugin('emit', (compilation, callback) => {
  // 读取名称为 fileName 的输出资源
  const asset = compilation.assets[fileName];
  // 获取输出资源的内容
  asset.source();
  // 获取输出资源的文件大小
  asset.size();
  callback();
});
```

#### 判断Webpack使用了哪些插件

在开发一个插件的时候可能需要根据当前配置是否使用了其他某个插件而做下一步决定, 因此需要读取webpack当前的插件配置情况:

```js
// 判断当前配置使用使用了 ExtractTextPlugin，
// compiler 参数即为 Webpack 在 apply(compiler) 中传入的参数
function hasExtractTextPlugin(compiler) {
  // 当前配置所有使用的插件列表
  const plugins = compiler.options.plugins;
  // 去 plugins 中寻找有没有 ExtractTextPlugin 的实例
  return plugins.find(plugin=>plugin.__proto__.constructor === ExtractTextPlugin) != null;
}
```

## HMR 热更新原理

![alt](https://pic1.zhimg.com/80/v2-f7139f8763b996ebfa28486e160f6378_720w.jpg)

这是webpack噢诶和webpack-dev-server进行应用开发的模块热更新流程图.

- 底部的红框内为服务端, 橙色框内是浏览器端
- 绿色的框是webpack代码控制的区域, 蓝色的方框是webpack-dev-server代码控制的区域
- 洋红色的方框是文件系统, 文件修改后的变化就发生在这里
- 青色的方框表示应用本身

图中表示了我们修改代码到模块热更新完成的一个周期, 通过深绿色的阿拉伯数字符号已经将HMR的整个过程标识了出来. 

1. 在webpack的watch模式下, 文件系统中的某一个文件发生修改, webpack监听到文件变化, 根据配置文件对模块重新打包, 并将打包后的代码通过简单的JavaScript保存在内存中.
   
2. `webpack-dev-server` 和 `webpack`之间的接口交互, 在这一步, 主要是`dev-server`的中间件`webpack-dev-middleware`与`webpack`之间的交互, `webpack-dev-middleware`调用`webpack`暴露的API对代码变化进行监控, 并且告诉webpack, 将代码打包打包的内存中. 
   
3. `webpack-dev-server`在此时建立一个对文件变化的监听, 这里的监听不是监听代码变化重新打包, 而是当我们在配置文件中配置了`devSderver.watchContentBase`为`true`的时候, Server会监听这些配置文件夹中静态文件的变化, 变化后会通知浏览器端对应用进行`live reload`. 注意, 这里是浏览器的刷新, 而不是HMR.
   
4. 这一步, 主要是通过`sockjs`在浏览器端和服务端之间建立一个`websocket`长连接, 将webpack编译打包的各个阶段的状态信息通知浏览器端, 同时也包括第三部中Server监听静态文件变化的信息. 浏览器端根据这些socket消息进行不同的操作. 当然服务端传递的最主要信息还是**新模块的hash值**, 后面的步骤根据这一hash值来进行模块热替换.
   
5. `webpack-dev-server/client`端不能请求更新的代码, 也不会执行热更新模块的操作, 而是把这些工作又交还给webpack, `webpack/hot/dev-server`的工作就是根据`webpack-dev-server/client`传给它的信息以及`dev-server`的配置决定了是刷新浏览器还是进行模块热更新. 如果是刷新浏览器, 到这里就完成了热更新的工作
   
6. `HotModuleReplacement.runtime`是客户端HMR的核心, 它接受到上一步传递给它的新模块的hash值, 它通过`JsonpMainTemplate.runtime`向server端发送Ajax请求, 服务端返回一个json, 该json包含了所有要更新的模块的hash值, 获取到更新列表之后, 该模块再次通过`jsonp`请求, 获取到最新的模块代码.这就是图中对的7,8,9三个步骤.
   
7. 第十步, 这是决定HMR是否成功的关键. 在这一步中, `HotModulePlugin`将会对新旧模块进行对比, 决定是否更新模块, 在决定更新模块之后, 检查模块之间的依赖关系, 更新模块的同时更新模块间的依赖作用.
   
8. 最后一步, 当HMR失败后, 回退到`live reload`操作, 进行浏览器刷新来获取最新的打包代码

## 动态 Import

webpack 动态加载`import`模块的原理本质上就是:

1. 根据`installedChunks`检查是否加载过目标`chunk`
2. 如果没有加载过, 就发起一个`jsonp`的请求去加载`chunk`
3. 设置一些请求的错误处理, 然后返回一个`Promise`.
4. 当`promise`返回之后, 就继续执行我们之前的异步请求回调


## 参考链接

- [Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)