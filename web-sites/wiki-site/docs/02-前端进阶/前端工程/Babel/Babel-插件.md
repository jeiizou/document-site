# Babel-插件


- [babel option doc](https://babel.dev/docs/en/options#compact)
- [babel types api](https://babeljs.io/docs/en/babel-types#importspecifier)
- [babel handbook api](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-get-the-path-of-a-sub-node)
- [babel plugin list](https://babeljs.io/docs/en/plugins/)

## 第一个 Babel 插件

首先定义一个函数:

```js
export default function(babel) {
  // plugin contents
}
```

通常我们经常用到其中的types对象, 所以一般会直接解构出types来使用:

```js
export default function({ types: t }) {
  // plugin contents
}
```

然后你需要在函数中返回一个包含`visitor`的对象:

```js
export default function({ types: t }) {
  return {
    visitor: {
      // visitor contents
    }
  };
};
```

每个visitor都会接受两个参数: `path`以及`state`:

```js
export default function({ types: t }) {
  return {
    visitor: {
      Identifier(path, state) {},
      ASTNodeTypeHere(path, state) {}
    }
  };
};
```

在每个visitor中添加你的逻辑即可. 比如下面这个简单的例子:

```js
BinaryExpression(path) {
  if (path.node.operator !== "===") {
    return;
  }

  path.node.left = t.identifier("sebmck");
  path.node.right = t.identifier("dork");
}
```

## 转换操作

### 遍历

#### 获取子节点的路径. 

需要访问一个节点的属性的时候, 可以通过`path.node.property`去访问:

```js
// the BinaryExpression AST node has properties: `left`, `right`, `operator`
BinaryExpression(path) {
  path.node.left;
  path.node.right;
  path.node.operator;
}
```

如果你需要访问`path`的属性, 则使用`get`方法去访问:

```js
BinaryExpression(path) {
  path.get('left'); 
}
Program(path) {
  path.get('body.0');
}
```



[TODO](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#get-the-path-of-sub-node)