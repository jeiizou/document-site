# 腾讯课堂: Vue渲染器原理与项目实战

## 侧面探索react和vue架构

### 开发时

react: jsx, js代码和模板代码可以混合编写
vue: 模板是模板, js是js, 不能混合写

### 编译时

#### react

react: 在编译的时候, 仅仅是把jsx转换为js函数代码, 因此, **写jsx本质上就是在写js**, 所以js代码可以和模板代码混合着写. 

react 没有编译时优化, 所以性能优化完全依赖于运行时优化

#### vue

vue的模板和js不能混着写, 就是因为vue需要进行编译时优化. 

vue的模板代码编译产物也是js. 

vue的编译分为在线编译和离线编译.

比如:

```js
new Vue({
    template: ''
})
```

这种里面的`template`代码是运行时候编译的, 所以属于在线编译, webpack编译就属于离线编译. 

编译产物描述的是虚拟dom的构建js代码.

vue的编译过程:

createCompile() => (编译模板的函数)compileToFunctions(template)
   1. html => AST: 正则解析对应的模板字符串, 然后分节点进行解析(parseHtml)
   2. optimize(ast, options), 默认优化AST: 
      1. 优化静态节点(标记那些不会改变的节点, 在后续的diff中跳过), AST static, VNode `__static__`
      2. 静态节点创建提升: 把静态节点的创建提到外面, 只执行一次, 后面直接获取创建的结果
   3. generate(), 将优化后的ast, 转换成代码

### 运行时

#### vue

双向数据绑定: 

```js
Objecy.defineProperty(data, key, {
    get: function () {
        
    },
    set: function () {
        
    }
})
```

vue1: 一个动态数据对应一个watcher, 一个组件可能就对应20个watcher, 一个render对应一个节点的指令, 收集的依赖很多, 运行时效率比较低
vue2: 把watcher提升到组件正面, 一个render对应一个watcher. 所以vue2需要进行组件级别的diff.

在diff的过程中, 遇到组件的static标记, 就会跳过该组件的diff, 从而达到优化的效果. 

小结:

1. vue的数据直接定向到组件
2. 组件层面进行diff
3. 跳过`__static__`节点的优化

#### Object.defineProperty

是可以监听数组的变化的, 问题在于:

在使用一些数组方法的时候, 会多次触发getter和setter