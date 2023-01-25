# Babel-概览


## 什么是 Babel

简单的说, Babel 能够转移 ES6以上的代码, 使它在旧的浏览器环境中也能运行. 

```js
// es2015 的 const 和 arrow function
const add = (a, b) => a + b;

// Babel 转译后
var add = function add(a, b) {
  return a + b;
};
```

`babel`的功能很纯粹, 我们传递一段源码给Babel, 然后它返回一串新的代码给我们. 只是一个简单的编译器. 

## Babel是如何工作的

Babel本质上就是操作AST来完成代码的转译.

### AST

`AST` 意为抽象语法树(Abstract Syntac Tree, AST). 

> Babel 使用一个机遇ESTree并修改过的AST, 它的内核说明文档可以在[这里](https://github.com/babel/babel/blob/master/packages/babel-parser/ast/spec.md)找到

以这段简单的代码为例:

```js
const add = (a, b) => a + b;
```

它生成的AST如下所示:

```json
{
  "type": "Program",
  "body": [
    {
      "type": "VariableDeclaration", // 变量声明
      "declarations": [ // 具体声明
        {
          "type": "VariableDeclarator", // 变量声明
          "id": {
            "type": "Identifier", // 标识符（最基础的）
            "name": "add" // 函数名
          },
          "init": {
            "type": "ArrowFunctionExpression", // 箭头函数
            "id": null,
            "expression": true,
            "generator": false,
            "params": [ // 参数
              {
                "type": "Identifier",
                "name": "a"
              },
              {
                "type": "Identifier",
                "name": "b"
              }
            ],
            "body": { // 函数体
              "type": "BinaryExpression", // 二项式
              "left": { // 二项式左边
                "type": "Identifier",
                "name": "a"
              },
              "operator": "+", // 二项式运算符
              "right": { // 二项式右边
                "type": "Identifier",
                "name": "b"
              }
            }
          }
        }
      ],
      "kind": "const"
    }
  ],
  "sourceType": "module"
}
```

AST的每一层都拥有相同的结构:

```js
// 变量声明
{
  type: "Identifier",
  name: ...
}
// 二项式
{
  type: "BinaryExpression",
  operator: ...,
  left: {...},
  right: {...}
}
// 箭头函数
{
  type: "ArrowFunctionExpression",
  id: {...},
  params: [...],
  body: {...}
}
```

这样的每一层结构被叫做 节点(Node). 一个AST可以由单一的节点或者成百上千个节点构建. 它们组合在一起可以描述用于静态分析的程序语法. 

每一个节点都有如下所示的接口(Interface):

```js
interface Node {
  type: string;
}
```

type表示节点的类型, 每一种类型的节点定义了一些附加属性用来进一步描述该节点类型.

Babel还为每个节点额外生成了一些属性, 用来描述该节点在原始代码中的位置.

```js
{
  type: ...,
  start: 0,
  end: 38,
  loc: {
    start: {
      line: 1,
      column: 0
    },
    end: {
      line: 3,
      column: 1
    }
  },
  ...
}
```

更多AST的分析和规范可以阅读:

- AST分析: https://astexplorer.net/
- AST规范: https://github.com/estree/estree

## Babel 工作过程

`Babel`是一个纯粹的编译器, 大部分编译器的工作过程可以分为三部分:

1. Parse: 解析, 将源代码转换成更加抽象的表示方法(例如抽象语法树)
2. Transform: 转换, 对抽象语法树进行一些特殊处理, 让它符合编译器的期望
3. Generate: 代码生成, 将第2步经过转换的抽象语法树生成新的代码

以第一个例子中的语句为例, 讲讲这三步到底做了什么.

### Parse 解析

一般来说, Parse阶段可以细分为两个阶段: 词法分析(Lexical Analysis, LA)和语法分析(Syntactic Analysis, SA).

#### 词法分析

词法分析阶段可以看做对代码进行'分词', 它接受一段源代码, 然后执行一段`tokenize`函数, 把代码分割成被称为`Tokens`的东西. `Tokens`是一个数组, 由一些代码的碎片组成, 比如数字, 标点符号, 运算符号等等. 上面的代码经过词法分析会生成如下的数组:

```js
[
    { "type": "Keyword", "value": "const" },
    { "type": "Identifier", "value": "add" },
    { "type": "Punctuator", "value": "=" },
    { "type": "Punctuator", "value": "(" },
    { "type": "Identifier", "value": "a" },
    { "type": "Punctuator", "value": "," },
    { "type": "Identifier", "value": "b" },
    { "type": "Punctuator", "value": ")" },
    { "type": "Punctuator", "value": "=>" },
    { "type": "Identifier", "value": "a" },
    { "type": "Punctuator", "value": "+" },
    { "type": "Identifier", "value": "b" }
]
```

> 词法分析DEMO演示网页: https://esprima.org/demo/parse.html#

看起来似乎不是很难, 我们模式实现一个简约的`tokenize`函数:

```js
/**
 * 词法分析 tokenize
 * @param {string} code JavaScript 代码
 * @return {Array} token
 */
function tokenize(code) {
    if (!code || code.length === 0) {
        return [];
    }
    var current = 0; // 记录位置
    var tokens = []; // 定义一个空的 token 数组
    
    var LETTERS = /[a-zA-Z\$\_]/i;
    var KEYWORDS = /const/; //  模拟一下判断是不是关键字
    var WHITESPACE = /\s/;
    var PARENS = /\(|\)/;
    var NUMBERS = /[0-9]/;
    var OPERATORS = /[+*/-]/;
    var PUNCTUATORS = /[~!@#$%^&*()/\|,.<>?"';:_+-=\[\]{}]/;
    
    // 从第一个字符开始遍历
    while (current < code.length) {
        var char = code[current];
        // 判断空格
        if (WHITESPACE.test(char)) {
          current++;
          continue;
        }
        // 判断连续字符
        if (LETTERS.test(char)) {
            var value = '';
            var type = 'Identifier';
            while (char && LETTERS.test(char)) {
                value += char;
                char = code[++current];
            }
            // 判断是否是关键字
            if (KEYWORDS.test(value)) {
                type = 'Keyword'
            }
            tokens.push({
                type: type,
                value: value
            });
            continue;
        }
        // 判断小括号
        if (PARENS.test(char)) {
            tokens.push({
              type: 'Paren',
              value: char
            });
            current++;
            continue;
        }
        // 判断连续数字
        if (NUMBERS.test(char)) {
          var value = '';
          while (char && NUMBERS.test(char)) {
            value += char;
            char = code[++current];
          }
          tokens.push({
            type: 'Number',
            value: value
          });
          continue;
        }
        // 判断运算符
        if (OPERATORS.test(char)) {
            tokens.push({
                type: 'Operator',
                value: char
            });
            current++;
            continue;
        }
        // 判断箭头函数
        if (PUNCTUATORS.test(char)) {
            var value = char;
            var type = 'Punctuator';
            var temp = code[++current];
            if (temp === '>') {
                type = 'ArrowFunction';
                value += temp;
                current ++;
            }
            tokens.push({
                type: type,
                value: value
            });
            continue;
        }
        tokens.push({
            type: 'Identifier',
            value: char
        });
        current++;
    }
    return tokens;
}
```

用这个函数去分析上面的代码:

```js
const tokens = tokenize('const add = (a, b) => a + b')；
console.log(tokens);

[
  { "type": "Keyword", "value": "const" },
  { "type": "Identifier", "value": "add" },
  { "type": "Punctuator", "value": "=" },
  { "type": "Paren", "value": "(" },
  { "type": "Identifier", "value": "a" },
  { "type": "Punctuator", "value": "," },
  { "type": "Identifier", "value": "b" },
  { "type": "Paren", "value": ")" },
  { "type": "ArrowFunction", "value": "=>" },
  { "type": "Identifier", "value": "a" },
  { "type": "Operator", "value": "+" },
  { "type": "Identifier", "value": "b" }
]
```

大致上是差不多的.

#### 语法分析

词法分析之后, 代码就已经变成了一个`Tokens`数组了, 现在需要通过语法分析把`Tokens`转化为上面提到的`AST`.

这里我们可以参考官方的实现: https://github.com/babel/babel/blob/master/packages/babel-parser/src/parser/index.js

### Transform 转换

这一步做的事情也很简单, 就是操作`AST`.

我们看到AST中有很多相似的元素, 他们都有一个`type`属性, 这样的节点被称为元素. 一个节点通常包含若干的属性, 可以用于描述AST的部分信息. 

比如这是一个最常见的`Identifier`节点:

```js
{
    type: 'Identifier',
    name: 'add'
}
```

表示这是一个标识符. 所以操作AST就是操作其中的节点, 可以增删这些节点, 从而转换成实际需要的AST. 

`babel`对于AST的遍历是深度优先遍历, 对于AST上的每一个分支`Babel`都会先遍历到叶子节点, 然后再向上遍历退出刚刚遍历过的节点, 然后寻找下一个分支. 

以上面的AST为例, 从`declarations`开始遍历:

1. 声明了一个变量, 并且知道内部属性(`id`, `init`), 然后我们以此访问每一个属性以及它们的子节点
2. `id`是一个`Identifier`, 有一个`name`属性表示变量名.
3. 之后是`init`, `init`有几个内部属性:
   1. `type: ArrowFunctionExpression`: 表示这是一个箭头函数表达式
   2. `params`是这个箭头函数的入参, 其中每一个参数都是一个`Identifier`类型的节点;
   3. `body`是这个箭头函数的主体, 这是一个`BinaryExpression`二项式: `left, operator, right`分别表示二项式的左变量, 运算符, 右变量.

在Babel中, 会维护一个叫做`Visitor`的对象, 这个对象定义了用于`AST`中获取具体节点的方法. 

### Generate 代码生成

经过上面两个节点, 需要转移的代码已经经过转换, 生成新的AST了, 最后一个节点就是根据这个AST来输出代码. 

```js
class Generator extends Printer {
  constructor(ast, opts = {}, code) {
    const format = normalizeOptions(code, opts);
    const map = opts.sourceMaps ? new SourceMap(opts, code) : null;
    super(format, map);
    this.ast = ast;
  }
  ast: Object;
  generate() {
    return super.generate(this.ast);
  }
}
```

## Babel 其他概念

### Visitor 访问者

当我们说到 '进入' 一个节点, 实际上是说我们在访问它们, 之所以使用这样的属于是因为有一个访问者模式(visitor)的概念.

访问者是一个用于AST比那里的跨语言的模式. 简单的说它们就是一个对象, 定义了用于在一个树状结构中获取具体节点的方法. 

一个Visitor一般是这样的:

```js
var visitor = {
    ArrowFunction() {
        console.log('我是箭头函数');
    },
    IfStatement() {
        console.log('我是一个if语句');
    },
    CallExpression() {}
};
```

当我们遍历`AST`的时候, 如果匹配到一个`type`, 就会调用`visitor`中的方法.
. 比如, 这个`visitor`来遍历这样一个`AST`:

```js
params: [ // 参数
    {
        "type": "Identifier",
        "name": "a"
    },
    {
        "type": "Identifier",
        "name": "b"
    }
]
```

过程就是这样的:

- 进入 `Identifier(params[0])`
- 走到尽头
- 退出 `Identifier(params[0])`
- 进入 `Identifier(params[1])`
- 走到尽头
- 退出 `Identifier(params[1])`

当然, Babel中会比这个复杂的多. 

回到上面的例子, 箭头函数是ES5不支持的语法, 所以Babel会把它转换成普通函数, 一层层遍历下去, 找到`ArrowFunctionExpression`节点, 然后把它替换成`FunctionDeclaration`节点. 假设箭头函数的处理如下:

```js
import * as t from "@babel/types";

var visitor = {
    ArrowFunction(path) {
        path.replaceWith(t.FunctionDeclaration(id, params, body));
    }
};
```

### Paths 路径

AST 通常会有许多的节点, 那么节点之间如何相互关联呢? 我们可以使用可以可操作, 可访问的巨大可变对象表示节点之间的关联关系, 或者也可以用`paths`来简化这件事情.

Path 是表示两个节点之间连接的对象.

比如有下面这样一个节点及其子节点:

```js
{
  type: "FunctionDeclaration",
  id: {
    type: "Identifier",
    name: "square"
  },
  ...
}
```

我们把这个节点表示为一个路径的话, 看起来是这样的:

```js
{
  "parent": {
    "type": "FunctionDeclaration",
    "id": {...},
    ....
  },
  "node": {
    "type": "Identifier",
    "name": "square"
  }
}
```

同时它还包含了关于该路径的其他元数据:

```js
{
  "parent": {...},
  "node": {...},
  "hub": {...},
  "contexts": [],
  "data": {},
  "shouldSkip": false,
  "shouldStop": false,
  "removed": false,
  "state": null,
  "opts": null,
  "skipKeys": null,
  "parentPath": null,
  "context": null,
  "container": null,
  "listKey": null,
  "inList": false,
  "parentKey": null,
  "key": null,
  "scope": null,
  "type": null,
  "typeAnnotation": null
}
```

当然, 路径对象还包含添加, 更新, 移动和删除节点有关的其他很多方法, 稍后我们再来看这些方法.

在某种意义上, 路径是一个节点在树种的位置以及关于该节点各种信息的响应式Reactive表示. 当你调用一个修改树的方法后, 路径信息也会被更新. Babel会帮你管理这一切. 

#### Path in Visitors

当你有一个`Identifier()`成员方法的访问者时, 你实际上是在访问路径而不是节点. 这样, 你操作的就是节点的响应式(路径)表示而非节点本身. 

### State 状态

状态是抽象语法树AST转换的敌人. 状态管理会不断牵扯你的精力, 而且几乎所有你对于状态的假设, 总会有一些没有考虑到的语法最终证明你的假设是错误的. 

考虑这段代码:

```js
function square(n) {
  return n * n;
}
```

假设我们要把这里的`n`改为`x`, 访问者实现如下:

```js
let paramName;

const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    paramName = param.name;
    param.name = "x";
  },

  Identifier(path) {
    if (path.node.name === paramName) {
      path.node.name = "x";
    }
  }
};
```

对上面的例子代码这段访问者代码也许能工作, 但很容易被打破:

```js
function square(n) {
  return n * n;
}
n;
```

更好的处理方式是递归, 下面我把一个访问者放到另外一个访问者中:

```js
const updateParamNameVisitor = {
  Identifier(path) {
    if (path.node.name === this.paramName) {
      path.node.name = "x";
    }
  }
};

const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    const paramName = param.name;
    param.name = "x";

    path.traverse(updateParamNameVisitor, { paramName });
  }
};

path.traverse(MyVisitor);
```

当然, 这只是一个刻意的例子, 目的在于展示如何从访问者中消除全局状态.

### Scopes 作用域

JavsScript 支持词法作用域, 在树状嵌套结构中代码块能够创建出新的作用域:

```js
// global scope

function scopeOne() {
  // scope 1

  function scopeTwo() {
    // scope 2
  }
}
```

在JavaScript中, 每当你创建了一个引用, 不管是通过变量(variable), 函数(function), 类(class), 参数(params), 模块导入(import)还是标签(label)等, 它都属于当前作用域. 

深层的作用可以使用外部作用域的引用 , 内部作用域也可以创建和外部作用域同名的引用来屏蔽外部作用域.

在编写一个`transform`的时候, 必须要注意作用域. 

我们在添加一个新的引用时需要确保新增加的引用名字和已有的所有引用不冲突. 或者我们仅仅想找出一个变量的所有应用, 我们只想在给定的作用域中找到这些引用.

作用域可以表示为如下形式:

```js
{
  path: path,
  block: path.node,
  parentBlock: path.parent,
  parent: parentScope,
  bindings: [...]
}
```

当你创建一个新的作用域的时候, 需要给出它的路径和父作用域, 之后再遍历过程中它会在该作用域内收集所有的引用('绑定').

一旦引用收集挖泥巴, 你就可以在作用域上使用各种方法.

#### Bing 绑定

所有引用属于特定的作用域, 引用和作用域的这种关系被称为: 绑定(binding)

```js
function scopeOnce() {
  var ref = "This is a binding";

  ref; // This is a reference to a binding

  function scopeTwo() {
    ref; // This is a reference to a binding from a lower scope
  }
}
```

单个的绑定看起来像这样:

```js
Text for Translation
{
  identifier: node,
  scope: scope,
  path: path,
  kind: 'var',

  referenced: true,
  references: 3,
  referencePaths: [path, path, path],

  constant: false,
  constantViolations: [path]
}
```

有了这些信息你就可以查找一个绑定的所有引用, 并且知道这是什么类型的绑定(参数, 定义等), 查找它所属的作用域, 或者拷贝它的标识符. 你甚至可以知道它是不是常量, 如果不是, 那么是哪个路径修改了它.

## Babel 核心模块

Babel是一组模块的集合. 

### babylon

babylon 是Babel的解析器. 最初是从Acorn项目fork出来的. Acorn非常的快, 易于使用, 并且针对非标准特性设计了一个基于插件的架构.

```js
import * as babylon from "babylon";

const code = `function square(n) {
  return n * n;
}`;

babylon.parse(code);
// Node {
//   type: "File",
//   start: 0,
//   end: 38,
//   loc: SourceLocation {...},
//   program: Node {...},
//   comments: [],
//   tokens: [...]
// }
```

我们还可以传递一些选项给`parse()`方法:

```js
babylon.parse(code, {
  sourceType: "module", // default: "script"
  plugins: ["jsx"] // default: []
});
```

`sourceType`可以是`module`或者`script`. 表示Babylon应该采用哪种模式来解析. `module`将会在严格模式下解析并且允许模拟定义, `script`不会.

Babylon使用了基于插件的架构, 因此有一个`plugins`选项可以开关内置的插件. 目前尚未对外部插件开放此API接口.

### babel-traverse

Babel Traverse 模块维护了整颗树的状态, 并且负责替换, 移除和添加节点. 

我们可以和Babylon一起使用来遍历和更新节点:

```js
import * as babylon from "babylon";
import traverse from "babel-traverse";

const code = `function square(n) {
  return n * n;
}`;

const ast = babylon.parse(code);

traverse(ast, {
  enter(path) {
    if (
      path.node.type === "Identifier" &&
      path.node.name === "n"
    ) {
      path.node.name = "x";
    }
  }
});
```

### babel-types

Babel Types 模块是用于AST节点的Lodash式的工具库, 包含了构造, 验证以及变换AST节点的方法. 该工具库包含考虑周到的工具方法, 对编写处理AST逻辑非常有用. 

```js
import traverse from "babel-traverse";
import * as t from "babel-types";

traverse(ast, {
  enter(path) {
    if (t.isIdentifier(path.node, { name: "n" })) {
      path.node.name = "x";
    }
  }
});
```

#### Definitions 定义

Babel Types模块拥有每一个单一类型节点的定义, 包括节点包含哪些属性, 什么是合法值, 如何构建节点, 遍历节点, 以及节点的别名等信息. 

```js
defineType("BinaryExpression", {
  builder: ["operator", "left", "right"],
  fields: {
    operator: {
      validate: assertValueType("string")
    },
    left: {
      validate: assertNodeType("Expression")
    },
    right: {
      validate: assertNodeType("Expression")
    }
  },
  visitor: ["left", "right"],
  aliases: ["Binary", "Expression"]
});
```

#### Builders 构建器

上面的定义的`BinaryExpression`有一个`builder`字段:

```js
builder: ["operator", "left", "right"]
```

这是由于每一个节点都有构造器方法builder, 按类似下面的方式使用:

```js
t.binaryExpression("*", t.identifier("a"), t.identifier("b"));
```

可以创建如下的AST:

```js
{
  type: "BinaryExpression",
  operator: "*",
  left: {
    type: "Identifier",
    name: "a"
  },
  right: {
    type: "Identifier",
    name: "b"
  }
}
```

构造器还会验证自身创建的节点, 并在错误使用的情况下抛出描述性错误.

#### Validators 验证器

`BinaryExpression`的定义还包含了节点的字段`fields`信息，以及如何验证这些字段。

```js
fields: {
  operator: {
    validate: assertValueType("string")
  },
  left: {
    validate: assertNodeType("Expression")
  },
  right: {
    validate: assertNodeType("Expression")
  }
}
```

### babel-generator

Babel Generator 模块是Babel的代码生成器, 它读取AST并将其装换为代码和源码映射(source maps)

```js
import * as babylon from "babylon";
import generate from "babel-generator";

const code = `function square(n) {
  return n * n;
}`;

const ast = babylon.parse(code);

generate(ast, {}, code);
// {
//   code: "...",
//   map: "..."
// }
```

也可以给`generate()`方法传递选项:

```js
generate(ast, {
  retainLines: false,
  compact: "auto",
  concise: false,
  quotes: "double",
  // ...
}, code);
```

### babel-template

babel-template 是另一个虽然很小但是非常有用的模块, 它能让你编写字符串形式并且带有占位符的代码来替换手动编码. 在生成大规模AST的时候非常有用. 在SC中, 这种能力被称为准引用(quasiquotes).

```js
import template from "babel-template";
import generate from "babel-generator";
import * as t from "babel-types";

const buildRequire = template(`
  var IMPORT_NAME = require(SOURCE);
`);

const ast = buildRequire({
  IMPORT_NAME: t.identifier("myModule"),
  SOURCE: t.stringLiteral("my-module")
});

console.log(generate(ast).code);
```

生成的代码如下:

```js
var myModule = require("my-module");
```

## 参考

- [初学 Babel 工作原理](https://github.com/axuebin/articles/issues/31)
- [Babel 插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md)