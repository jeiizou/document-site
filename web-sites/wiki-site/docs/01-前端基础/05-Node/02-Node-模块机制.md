# Node-模块机制


## CommonJS

使用示例:

```js
//test.js
//引入一个模块到当前上下文中
const math = require('math');
math.add(1, 2);

//math.js
exports.add = function () {
    let sum = 0, i = 0, args = arguments, l = args.length;
    while(i < l) {
        sum += args[i++];
    }
    return sum;
}
```

**模块标识**指的就是传递给`require()`方法的参数, 必须是小驼峰命名的字符串, 或者以`.`,`..`开头的相对路径或者绝对路径, 可以省略文件后缀名`.js`等. 

## 模块加载概览

在Node中引入模块, 需要经历四个步骤:

1. 路径分析
2. 文件定位
3. 编译执行
4. 加入内存

其中, 路径分析和文件定位可以一起说.

Node中的模块分为两种:

- 核心模块: Node自身提供的模块, 在Node的进程开始的时候就预加载了
- 文件模块: 用户编写的模块, 包括npm安装的第三方模块. 

## requier 的加载规则

假设在Y路径的js文件中执行了`require(X)`, 其大致流程如下(这部分内容来自[Node使用手册](https://nodejs.org/api/modules.html#modules_all_together)):

```
require(X) from module at path Y
1. If X is a core module,
   a. return the core module
   b. STOP
2. If X begins with '/'
   a. set Y to be the filesystem root
3. If X begins with './' or '/' or '../'
   a. LOAD_AS_FILE(Y + X)
   b. LOAD_AS_DIRECTORY(Y + X)
   c. THROW "not found"
4. If X begins with '#'
   a. LOAD_PACKAGE_IMPORTS(X, dirname(Y))
5. LOAD_PACKAGE_SELF(X, dirname(Y))
6. LOAD_NODE_MODULES(X, dirname(Y))
7. THROW "not found"

LOAD_AS_FILE(X)
1. If X is a file, load X as its file extension format. STOP
2. If X.js is a file, load X.js as JavaScript text. STOP
3. If X.json is a file, parse X.json to a JavaScript Object. STOP
4. If X.node is a file, load X.node as binary addon. STOP

LOAD_INDEX(X)
1. If X/index.js is a file, load X/index.js as JavaScript text. STOP
2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
3. If X/index.node is a file, load X/index.node as binary addon. STOP

LOAD_AS_DIRECTORY(X)
1. If X/package.json is a file,
   a. Parse X/package.json, and look for "main" field.
   b. If "main" is a falsy value, GOTO 2.
   c. let M = X + (json main field)
   d. LOAD_AS_FILE(M)
   e. LOAD_INDEX(M)
   f. LOAD_INDEX(X) DEPRECATED
   g. THROW "not found"
2. LOAD_INDEX(X)

LOAD_NODE_MODULES(X, START)
1. let DIRS = NODE_MODULES_PATHS(START)
2. for each DIR in DIRS:
   a. LOAD_PACKAGE_EXPORTS(X, DIR)
   b. LOAD_AS_FILE(DIR/X)
   c. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
1. let PARTS = path split(START)
2. let I = count of PARTS - 1
3. let DIRS = [GLOBAL_FOLDERS]
4. while I >= 0,
   a. if PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. let I = I - 1
5. return DIRS

LOAD_PACKAGE_IMPORTS(X, DIR)
1. Find the closest package scope SCOPE to DIR.
2. If no scope was found, return.
3. If the SCOPE/package.json "imports" is null or undefined, return.
4. let MATCH = PACKAGE_IMPORTS_RESOLVE(X, pathToFileURL(SCOPE),
  ["node", "require"]) defined in the ESM resolver.
5. RESOLVE_ESM_MATCH(MATCH).

LOAD_PACKAGE_EXPORTS(X, DIR)
1. Try to interpret X as a combination of NAME and SUBPATH where the name
   may have a @scope/ prefix and the subpath begins with a slash (`/`).
2. If X does not match this pattern or DIR/NAME/package.json is not a file,
   return.
3. Parse DIR/NAME/package.json, and look for "exports" field.
4. If "exports" is null or undefined, return.
5. let MATCH = PACKAGE_EXPORTS_RESOLVE(pathToFileURL(DIR/NAME), "." + SUBPATH,
   `package.json` "exports", ["node", "require"]) defined in the ESM resolver.
6. RESOLVE_ESM_MATCH(MATCH)

LOAD_PACKAGE_SELF(X, DIR)
1. Find the closest package scope SCOPE to DIR.
2. If no scope was found, return.
3. If the SCOPE/package.json "exports" is null or undefined, return.
4. If the SCOPE/package.json "name" is not the first segment of X, return.
5. let MATCH = PACKAGE_EXPORTS_RESOLVE(pathToFileURL(SCOPE),
   "." + X.slice("name".length), `package.json` "exports", ["node", "require"])
   defined in the ESM resolver.
6. RESOLVE_ESM_MATCH(MATCH)

RESOLVE_ESM_MATCH(MATCH)
1. let { RESOLVED, EXACT } = MATCH
2. let RESOLVED_PATH = fileURLToPath(RESOLVED)
3. If EXACT is true,
   a. If the file at RESOLVED_PATH exists, load RESOLVED_PATH as its extension
      format. STOP
4. Otherwise, if EXACT is false,
   a. LOAD_AS_FILE(RESOLVED_PATH)
   b. LOAD_AS_DIRECTORY(RESOLVED_PATH)
5. THROW "not found"
```

举个例子, 比如在`/home/ry/projects/foo.js`执行了`require('bar')`, Node的运行过程如下:

首先, 确定X的绝对路径可能是下面这些位置, 一次搜索每一个目录:

```
/home/ry/projects/node_modules/bar
/home/ry/node_modules/bar
/home/node_modules/bar
/node_modules/bar
```

搜索的时候, 先把`bar`当成文件名, 依次尝试加载下面这些文件, 只要有成功就返回:

```
bar
bar.js
bar.json
bar.node
```

如果都不成功, 则说明`bar`可能是目录名, 于是一次尝试加载下面这些文件:

```
bar/package.json（main字段）
bar/index.js
bar/index.json
bar/index.node
```

如果所有目录中, 都无法找到对应的文件或者目录, 就抛出一个错误. 

## Module 源码概览

在 Node 中, 每个文件模块都是一个对象, 它的定义如下:

```js
function Module(id, parent) {
  this.id = id;
  this.exports = {};
  this.parent = parent;
  this.filename = null;
  this.loaded = false;
  this.children = [];
}

module.exports = Module;

var module = new Module(filename, parent);
```

所有的模块都是`Module`的实例. 

### Module._load

并且`require()`方法其实内部调用的也是`Module._load`方法:

```js
// require 其实内部调用Module._load方法
Module._load=function(request,parentm, isMain){
    // 计算绝对路径
    var filename=Module._resolveFilename(request, parent);

    // 第一步: 如果有缓存, 取出缓存
    var cacheModule = Module._cache[filename];
    if(cacheModule){
        return cacheModule.exports;
    }

    // 第二步: 是否为内置模块
    if(NativeModule.exists(filename)){
        return NativeModule.require(filename);
    }

    // 第三步: 生成模块实例, 存入缓存
    // 这里的MOdule就是上面一小节中定义的Module
    var module = new Module(filename, parent);
    Module._cache[filename] = module;

    // 第四步: 加载模块
    // 下面的module.load实际上是Module原型上有一个方法叫Module.prototype.load
    try {
        module.load(filename);
        hadException = false;
    } finally {
        if (hadException) {
        delete Module._cache[filename];
        }
    }

    // 第五步：输出模块的exports属性
    return module.exports;
}
```

可以看到在require的过程中, 是会缓存已经加载的模块的, 这样在后面的时候, 就不需要每次都重新搜索和处理文件路径了. 

### Module.__resolveFilename

其中, `Module.__resolveFilename`的源码如下:

```js
Module._resolveFilename = function(request, parent) {
  // 第一步：如果是内置模块，不含路径返回
  if (NativeModule.exists(request)) {
    return request;
  }

  // 第二步：确定所有可能的路径
  var resolvedModule = Module._resolveLookupPaths(request, parent);
  var id = resolvedModule[0];
  var paths = resolvedModule[1];

  // 第三步：确定哪一个路径为真
  var filename = Module._findPath(request, paths);
  if (!filename) {
    var err = new Error("Cannot find module '" + request + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }
  return filename;
};
```

在该方法内部调用了`Module.resolveLookupPaths`和`Module._findPath()`, 前者用来列出可能的路径, 后者用来确认那个路径是对的:

### Module._findPath

`_findPath`的具体流程如下:

```js
Module._findPath = function(request, paths) {

  // 列出所有可能的后缀名：.js，.json, .node
  var exts = Object.keys(Module._extensions);

  // 如果是绝对路径，就不再搜索
  if (request.charAt(0) === '/') {
    paths = [''];
  }

  // 是否有后缀的目录斜杠
  var trailingSlash = (request.slice(-1) === '/');

  // 第一步：如果当前路径已在缓存中，就直接返回缓存
  var cacheKey = JSON.stringify({request: request, paths: paths});
  if (Module._pathCache[cacheKey]) {
    return Module._pathCache[cacheKey];
  }

  // 第二步：依次遍历所有路径
  for (var i = 0, PL = paths.length; i < PL; i++) {
    var basePath = path.resolve(paths[i], request);
    var filename;

    if (!trailingSlash) {
      // 第三步：是否存在该模块文件
      filename = tryFile(basePath);

      if (!filename && !trailingSlash) {
        // 第四步：该模块文件加上后缀名，是否存在
        filename = tryExtensions(basePath, exts);
      }
    }

    // 第五步：目录中是否存在 package.json 
    if (!filename) {
      filename = tryPackage(basePath, exts);
    }

    if (!filename) {
      // 第六步：是否存在目录名 + index + 后缀名 
      filename = tryExtensions(path.resolve(basePath, 'index'), exts);
    }

    // 第七步：将找到的文件路径存入返回缓存，然后返回
    if (filename) {
      Module._pathCache[cacheKey] = filename;
      return filename;
    }
  }

  // 第八步：没有找到文件，返回false 
  return false;
};
```

### Module.load

有了模块的绝对路径, 就可以加载该模块了:

```js
Module.prototype.load = function(filename) {
  var extension = path.extname(filename) || '.js';
  if (!Module._extensions[extension]) extension = '.js';
  Module._extensions[extension](this, filename);
  this.loaded = true;
};
```

首先确定模块的后缀名, 不同的后缀名对应不同的加载方法, 比如`.js`和`.json`:

```js
Module._extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(stripBOM(content), filename);
};

Module._extensions['.json'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  try {
    module.exports = JSON.parse(stripBOM(content));
  } catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
};
```

以`.js`文件的加载为例, 首先, 将模块文件读取为字符串, 然后剥离`utf8`编码特有的BOM文件头, 最后编译该模块.

### Module.__compile

```js
Module.prototype._compile = function(content, filename) {
  var self = this;
  var args = [self.exports, require, self, filename, dirname];
  return compiledWrapper.apply(self.exports, args);
};
```

等同于:

```js
(function (exports, require, module, __filename, __dirname) {
  // 模块源码
});
```

本质上就是注入了`export`, `require`, `module`三个模块. 

## 常见问题

### 如何清除 require缓存

开发node的时候会面临一个问题, 如果修改了配置数据, 必须重启服务器才能看到修改的结果. 这是因为模块缓存的原因. 

可以这样删除缓存:

```js
delete require.cache[require.resolve('./server.js')];
app = require('./server.js');
```

### `exports.xxx=xxx`和`module.exports={}`的区别

很多时候，你会看到，在Node环境中，有两种方法可以在一个模块中输出变量：

方法一：对module.exports赋值:

```js
function hello() {
    console.log('Hello, world!');
}

function greet(name) {
    console.log('Hello, ' + name + '!');
}

module.exports = {
    hello: hello,
    greet: greet
};
```

方法二: 直接使用exports

```js
// hello.js
function hello() {
    console.log('Hello, world!');
}

function greet(name) {
    console.log('Hello, ' + name + '!');
}

function hello() {
    console.log('Hello, world!');
}

exports.hello = hello;
exports.greet = greet;

// 但是你不可以直接对exports赋值：
// 代码可以执行，但是模块并没有输出任何变量:
exports = {
    hello: hello,
    greet: greet
};
```

如果你对上面的写法感到十分困惑，不要着急，我们来分析Node的加载机制：

首先，Node会把整个待加载的hello.js文件放入一个包装函数load中执行。在执行这个load()函数前，Node准备好了module变量：

```js
var module = {
    id: 'hello',
    exports: {}
};
```

load()函数最终返回module.exports：

```js
var load = function (exports, module) {
    // hello.js的文件内容
    ...
    // load函数返回:
    return module.exports;
};

var exportes = load(module.exports, module);
```

也就是说，默认情况下，Node准备的`exports`变量和`module.exports`变量实际上是同一个变量，并且初始化为空对象`{}`，于是，我们可以写：

```js
exports.foo = function () { return 'foo'; };
exports.bar = function () { return 'bar'; };
```

也可以写：

```js
module.exports.foo = function () { return 'foo'; };
module.exports.bar = function () { return 'bar'; };
```

换句话说，Node默认给你准备了一个空对象{}，这样你可以直接往里面加东西。

但是，如果我们要输出的是一个函数或数组，那么，只能给module.exports赋值：

```js
module.exports = function () { return 'foo'; };
```

给exports赋值是无效的，因为赋值后，`module.exports`仍然是空对象`{}。`

结论:

如果要输出一个键值对象`{}`，可以利用`exports`这个已存在的空对象`{}`，并继续在上面添加新的键值；

如果要输出一个函数或数组，必须直接对`module.exports`对象赋值。

所以我们可以得出结论：直接对`module.exports`赋值，可以应对任何情况：

```js
module.exports = {
    foo: function () { return 'foo'; }
};

// 或者
module.exports = function () { return 'foo'; };
```

建议使用`module.exports = xxx`的方式来输出模块变量，这样，你只需要记忆一种方法。


## 参考链接

- [深入了解Nodejs模块机制](https://juejin.cn/post/6844904030905303054)
- [Node.js 使用手册](https://nodejs.org/api/modules.html#modules_all_together)
- [require() 源码解读](http://www.ruanyifeng.com/blog/2015/05/require.html)
- [阿里前端攻城狮们写了一份前端面试题答案，请查收](https://juejin.cn/post/6844904097556987917)