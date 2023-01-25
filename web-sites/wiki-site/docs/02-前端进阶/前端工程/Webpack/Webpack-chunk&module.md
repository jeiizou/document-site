# Webpack-chunk&module

## module

webpack本质上是模块打包器, 编写的任何文件, 对于webpack来说, 就是一个模块(module).

所以webpack中有一个module的字段, module下有一个`rules`字段用来配置处理模块的规则. 

```js
module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          }, {
            loader: "css-loader"
          }
        ]
      },
      ...
    ]
}
```

## chunk

chunk 是 webpack 打包过程中, module的集合, 我们知道webpack的打包是从一个入口文件开始的. 也能说是入口模块, 入口模块引用其他的模块, 其他模块再引用门模块, webpack通过引用关系逐个打包, 这些module就形成了一个chunk.

如果我们有多个入口文件, 就能产出多条打包路径, 一条路径就会形成一个Chunk

除了入口文件会产生chunk, 也有其他路径.

## chunk vs bundle

bundle是我们最终输出的一个或者多个打包文件. 大部分情况下, 一个chunk会生产一个bundle. 但也不是完全一对一的关系, 比如我们把`dev-tool`设置为`source-map`, 然后配置一个入口文件, 不配置代码分割:

```js
// webpack配置
entry: {
    main: __dirname + "/app/main.js",
},
output: {
    path: __dirname + "/public",//打包后的文件存放的地方
    filename: "[name].js", //打包后输出文件的文件名
},
devtool: 'source-map'
```

这样就是一个chunk, 产生两个bundle.

这就是chunk和boundle的区别, chunk是过程中的代码块, bundle是结果的代码块.

webpack在运行中会生成chunk对象, 而一旦构建完成chunk就会变成bundle

## chunk 产生途径

1. entry产生chunk
2. 异步模块产生chunk
3. 代码分割产生chunk

### entry产生chunk

webpack入口文件entry的配置有三种方式:

1. 传递字符串, 产生一个chunk

```js
entry: './src/js/main.js'
```

2. 传递一个数组, 也只产生一个chunk

```js
entry: ['./src/js/main.js','./src/js/other.js']
```

3. 传递一个对象, 可能产生多个chunk

```js
entry: {
  main: './src/js/main.js',
  other: './src/js/other.js'
},
output: {
  // path: __dirname + "/public",
  // filename:'bundle.js'
  // 以上2行会报错
  path: __dirname + "/public",//打包后的文件存放的地方
  filename: "[name].js", //打包后输出文件的文件名
}
```

对象中的一个字段就会产生一个chunk, 所以在output中filename直接写死名称是会报错的. 

在上面的配置中, 产生了两个chunk, 最终会生成两个`Bundle`.

### 异步模块产生的Chunk

除了入口文件的影响, 异步加载的模块也会产生Chunk.

```js
{
    entry: {
        "index": "pages/index.jsx"
    },
    output: {
        filename: "[name].min.js",
        chunkFilename: "[name].min.js"
    }
}

// code file
const myModel = r => require.ensure([], () => r(require('./myVue.vue')), 'myModel')
```

这个时候, `chunkFilename`中的字段就会作为异步加载的chunk名称.

### 代码分割产生Chunk

最后一种是代码分割产生的Chunk

以下面的配置为例:

```js
// main.js 和 other.js 都引用了同一个 greeter.js 文件。main.js 中使用了 react。
module.exports = {
  entry: {
    main: __dirname + "/app/main.js",
    other: __dirname + "/app/other.js",
  },
  output: {
    path: __dirname + "/public",//打包后的文件存放的地方
    filename: "[name].js", //打包后输出文件的文件名
    chunkFilename: '[name].js',
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: "initial",
          minChunks: 2,
          maxInitialRequests: 5, // The default limit is too small to showcase the effect
          minSize: 0 // This is example is too small to create commons chunks
        },
        vendor: {
          test: /node_modules/,
          chunks: "initial",
          name: "vendor",
          priority: 10,
          enforce: true
        }

      },
    }
  }
}
```

- 两个入口文件分别产生一个Boudle
- `runtimeChunk:single`会将webpack在浏览器端运行时单独抽离到一个文件, 生成一个Chunk
- `commons`下的配置会生成一个Chunk
- `venrder`下的配置会产生一个Chunk

最终会生成5个Boudle

## 参考链接

- [webpack 中，module，chunk 和 bundle 的区别是什么？](https://www.cnblogs.com/skychx/p/webpack-module-chunk-bundle.html)