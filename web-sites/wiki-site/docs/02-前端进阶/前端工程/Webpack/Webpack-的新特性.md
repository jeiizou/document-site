# Webpack-的新特性


webpack 5 在2020年的10月正式发布, 整体上的方向性变化如下:

- 持久化硬盘缓存提高构建性能
- 通过更好的算法改进长期缓存
- 通过更好的Tree Shaking能力和代码的生成逻辑来优化产物的大小
- 改善web平台的兼容性能力
- 清除内部结构中一些奇怪的state
- 引入一些重大的变更为未来的特性做准备

下面就来一一介绍webpakc5中的一些新特性

## 编译时新特性

### 内置静态资源构建能力 -- asset modules

在webpack5之前, 我们一般都会使用各种文件类型的loader来处理常见的静态资源, 比如:

- raw-loader: 将文件处理成字符串导入
- file-loader: 将文件打包导出
- url-loader: 当文件大小达到要求的大小的时候, 就可以将其处理成base64的URIS, 内置file-loader

而现在webpack5提供了内置的静态资源构建能力, 可以不需要安装额外的loader, 仅需要简单的配置就能实现静态资源的打包和分目录存放.

```js
// webpack.config.js
module.exports = {
    ...,
    module: {
      rules: [
          {
            test: /\.(png|jpg|svg|gif)$/,
            type: 'asset/resource',
            generator: {
                // [ext]前面自带"."
                filename: 'assets/[hash:8].[name][ext]',
            },
        },
      ],
    },
}
```

- `asset/source`: 类似于 raw-loader
- `asset/inline`: 类似于 url-loader
- `asset/resource`: 类似于 file-loader
- `asset`: 默认会根据文件大小来选择使用哪种类型, 当文件小于8kb的时候会使用`asset/inline`模式, 否则会使用`asset/resource`模式.

### 内置FileSystem Cache能力加速二次构建

webpack5之前, 我们会使用cache-loader缓存一些性能开销比较大的loader, 或者使用`hard-source-webpack-plugin`为模块提供一些中间缓存. 在webpack5之后, 默认就集成了一种自带的缓存能力.

```js
// webpack.config.js
module.exports = {
    ...,
    cache: {
        type: 'filesystem',
        // 可选配置
        buildDependencies: {
            config: [__filename],  // 当构建依赖的config文件（通过 require 依赖）内容发生变化时，缓存失效
        },
        name: '',  // 配置以name为隔离，创建不同的缓存文件，如生成PC或mobile不同的配置缓存
        ...,
    },
}
```

生产环境下默认的缓存存放目录在`node_modules/.cache/webpack.default-production`.

如果你直接调用`webpack compiler`实例的`run`方法来执行定制化构建操作的时候, 需要调用`compiler.close`去输出缓存文件.

### 内置WebAssembly编译以及异步加载能力 (sync/async)

webAssembly 被设计为一种面向web的二进制的格式文件, 以其更接近于机器码而拥有更小的文件体积和更快的执行小路.

webpack5是拓展了webpack4的wasm的加载能力, 可以进行异步加载.

在webpack5之前, 是需要通过`wasm-loader`去配置wasm文件的处理的, 在5里面就不需要了:

```js
// webpack.config.js
module.exports = {
    ...,
    experiments: {
        asyncWebAssembly: true,
    },
    module: {
        rules: [
            ...,
           {
                test: /\.wasm$/,
                type: 'webassembly/async',
            },
         ],
    },
}
```

要用的时候, 就直接引入:

```js
import { sum } from './program.wasm'
console.log(sum(1, 2))
```

### 内置 web worker 构建能力

web worker 为web后台线程提供了一种简单的方法. 线程可以执行任务二不干扰用户界面. 通常, 我们可以将一些加解密或者图片处理等一些比较复杂的算法至于子线程中, 当执行完成后再和主线程通信.

在webpack5之前, 需要用`worker-loader`来处理:

```js
// webpack.config.js
module.exports = {
    ...,
     module: {
        rules: [
            {
                test: /\.worker\.js$/,
                use: { loader: 'worker-loader' },
            },
        ],
    },
}
```

然后在使用的时候, 就能直接构造一个worker对象:

```js
// master.js
import Worker from './calc.worker.js';
const worker = new Worker();
worker.onmessage = e => {
  console.log(e.data.value);
};
```

在webpack5中, 就不需要添加loader的处理方式, 并且不需要针对worker配置特定的`work.js`之类的文件名. 直接借助URL就行了.

```js
// master.js
const worker = new Worker(new URL('./calc.js', import.meta.url), {
    name: "calc"
  /* webpackEntryOptions: { filename: "workers/[name].js" } */
});
worker.onmessage = e => {
  console.log(e.data.value);
};
```

> 在new URL()中不能使用.worker.js命名文件，否则会优先被 worker-loader 解析而导致最终你的 worker 无法正常运行

## 运行时新特性

### 移除了`Node.js polyfill`. 

需要自己配置对应的nodejs的process

### 新增了`Prepack`

会在编译阶段生成优化后代码

### 深度的`tree shaking`

能够在打包的过程中移除js上下文中没有被引用到的变量, 来减少打包后的体积. 特别是能够支持深层嵌套的export的`tree shaking`

### 更友好的Long Term Cache支持性, chunkid不变

webpack5之前, 文件打包后的名称是根据ID顺序排列的, 一旦后续有了一个文件进行改动, 就会造成后面的文件打包出来的文件名产生变化. 即使文件内容没有产生改变. 也会造成资源缓存的失败.

webpack5有了更好的长期缓存能力支持, 其通过hash生成算法, 为打包后的modules和chunks计算出了一个短的数字ID, 这样即便中间删除了某个文件, 也不会造成大量的文件缓存失效.

并且, webpack5使用了真实的contenthash来支持更友好的long term cache. 意思是如果你的逻辑里面只是删除了注释或者改了一个变量名称, 本质上你的代码逻辑是没有变化的, 所以对于压缩后的文件这些内容的变更不会导致`contenthash`变化.

### 支持 Top Level Await, 从此告别 async

webpack5 支持顶级作用域的await关键字, 即允许开发者在async函数外部使用await字段. 

原型是`import`他们的模块会等待它们开始执行它的代码. 

```js
// webpack.config.js
module.exports = {
    ...,
    experiments: {
        topLevelAwait: true,
    },
}
```

这样我们就可以这么写了:

```js
// 开启 top level await 之前
import i18n from 'XXX/i18n-utils'

(async () => {
  // 国际化文案异步初始化逻辑
  await i18n.init({/* ... */})
  root.render(<AppContainer />)
})()

// 开启 top level await 之后
import i18n from 'XXX/i18n-utils'

await i18n.init({/* ... */})
root.render(<AppContainer />)
```

我们也饿可以用这个逻辑用来异步导出或者引入模块:

```js
// src/Home/index.jsx
import React from 'react';

const Test = () => {
  return <div>123</div>;
};

let Home = null;
await new Promise(resolve => {
  Home = Test;
  resolve();
});

export default Home;

// src/index.jsx
import Home from './Home'
```

为了eslint语法检测的支持, 还需要添加babel插件`@babel/plugin-syntax-top-level-await`

不同于其他es6的语法, 这个插件的作用是让babel能解析这个语法, 然后扔给后续的webpack去处理.

## 模块联邦

### NPM 模块共享机制

正常的模块共享机制, 就是把依赖安装到项目, 然后进行webpack打包构建上线.

对于两个不同的项目, 需要共享一个模块的时候, 最常见的办法就是将其抽成通用依赖并分别安装在各自的项目中. 

Monorepo可以一定程度的解决重复安装和修改困难的问题, 但依然需要走本地编译.

### UMD 模块共享机制

真正Runtime的方式可能是UMD方式共享代码模块, 即将模块用webpack umd模式打包, 然后输出的其他项目中.

对于不同的项目, 直接利用UMD包复用一个模块, 但这种技术方案的问题在于包体积无法达到本地编译时的优化效果, 并且库之间容易冲突.

### 微前端方式共享模块

微前端: micro-frontedns(MFE)也是一种比较火热的模块共享管理方式, 微前端就是要解决多项目并存的问题, 多项目并存的最大问题就是模块共享, 不能有冲突. 

微前端还要考虑样式冲突, 生命周期管理, 所以本文就只聚焦在资源加载方式上. 微前端一般有两种打包方式:

1. 子应用独立打包, 模块解耦, 但是无法抽取公共依赖
2. 整体应用一起打包, 能很好的解决上面的问题, 但是打包速度非常慢.

### 模块联邦方式

模块联邦(Module Federation)是webpack5的内置核心特点之一.

这个方案是直接将一个应用的包应用于另一个应用, 同时具备整体应用一起打包的公共依赖抽取能力.

让应用具备模块化输出能力, 其实是新增了一种新的应用形态, 即"中心应用"的概念. 这个中心应用用于在线动态的分发Runtime子模块, 并不直接提供给用户使用. 

![image](/assets/2021-3-9/20210305142051.jpg)

模块联邦的使用如下:

1. 引入远程JS文件
2. 配置webpack插件
3. 模块使用

首先, 引入远程库的入口文件, 比如我们现在有app1, app2两个应用, 端口分别为3001, 3002. app1想要引用app2中的JS, 直接用script标签:

```js
<head>
  <script src="http://localhost:3002/remoteEntry.js"></script>
</head>
```

第二步, 在app1中进行webpack配置对应的插件选项:

```js
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
   
module.exports = {
 //....
 plugins: [
  new ModuleFederationPlugin({
   name: "app1",
   library: { type: "var", name: "app1" },
   remotes: {
    app2: "app2",
   },
   shared: ["react", "react-dom"],
  }),
 ],
};
```

其中, app2的webpack配置大致如下:

```js
plugins: [
  new ModuleFederationPlugin({
   name: "app2",
   library: { type: "var", name: "app2" },
   filename: "remoteEntry.js",
   exposes: {
    "./Button": "./src/Button",
   },
   shared: ["react", "react-dom"],
  })
],
```

参数解释如下: 


- `name`: 当前应用名称, 全局唯一
- `library`: UMD标准导出，和name保持一致即可。
- `remotes`: 其他项目的`name`映射到当前项目中
- `filename`:远程应用时被其他应用引入的js文件名称。对应上面的 remoteEntry.js
- `exposes`: 表示导出的模块, 只有在这里声明的模块才可以作为远程的依赖被使用
- `shared`: 共享的依赖包
  - 如果配置了这个属性, webpack在加载的时候回先判断本地应用是否存在对应的包, 如果不存在, 则加载远程应用的依赖包
  - 以app2来说, 因为它是一个远程包, 而且被app1消费, webpack会先查找app1是否存在这两个包, 如果不存在就使用app2自带的包, app1里面同样声明了这两个参数, 因为app1是本地应用, 所以会直接用app1的依赖


## 参考

- [Webpack5 新特性业务落地实战](https://zhuanlan.zhihu.com/p/348612482)
- [webpack5 联邦模块介绍详解](https://www.jb51.net/article/190299.htm)