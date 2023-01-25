# 原理-TreeShaking


Tree Shaking的本质是消除无用的JS代码. 无用代码消除广泛的存在于传统编程语言编译器中. 编译器可以判断出某些代码不影响输出, 然后消除这些代码, 称为DCE(Dead Code Elimination).

Tree-Shaking 是DCE的一种新的实现, JS和传统编程语言不同之处在于, js绝大多数情况下需要通过网络进行加载, 然后执行, 加载的文件大小越小, 整体的执行时间更短, 所以去除无用代码以减少文件体积, 对js来说更加有意义.

Tree-Shaking 和传统的DCE又有不同之处, 传统的DCE消灭不可能执行的代码, 而Tree-shaking更关注消除没有用到的代码.

## DCE消除

Dead Code 一般具有这些特点:

- 代码不会被执行, 不可到达
- 代码执行的结果不会被用到
- 代码只会影响死亡变量(只写不读)

传统的编译语言, 都是由编译器将Dead Code从AST中删除, 在JS中, 由uglify完成对js的DCE.

## Tree Shaking

tree-shaking 更加关注于无用模块的消除, 消除那些引用了但并没有被使用的模块.

其消除原理是依赖于ES6的模块特性的. 

ESM的特点:

- 只能作为模块顶层的语句出现
- import的模块只能是字符串常量
- import binding是immutable的

ES6模块依赖关系是确定的, 和运行时的状态无关, 可以进行可靠的静态分析, 这就是`tree-shaking`的基础. 

所谓的静态分析就是不执行代码, 从字面量上对代码进行分析, ES6之前的模块化, 比如我们动态的`require`一个模块, 只有执行之后才知道引用的是什么模块, 就无法通过静态分析去进行优化. 

这是ES6模块设计时就考虑进去的, 也是为什么没有直接采用CommonJS. 

这部分的功能在rollup和webpack中都得到了比较好的支持.

不过要注意, **没有用到的`import`是不会被消除的.**

- `rollup`只处理函数和顶层的`import/export`变量, 不能把没有用到的类的方法消除掉
- js动态语言的特性使得静态分析比较困难
- 代码可能会存在副作用, 不能影响执行

比如下面这个模块:

```js
function Menu() {
}

Menu.prototype.show = function() {
}

Array.prototype.unique = function() {
    // 将 array 中的重复元素去除
}

export default Menu;
```

在其他文件中引入, 即便不使用, 也不能去消除. 

总的来说, `tree-shaking`对函数的效果比较好. 因为函数的副作用相对比较少, 顶层函数相对来说更加容易分析, 加上babel默认是启用严格模式的, 减少了顶层函数的动态访问的方式, 也使得分析更加容易. 


## 参考链接

- [Tree-Shaking性能优化实践](https://juejin.cn/post/6844903544756109319)
- [说说Vue 3.0中Treeshaking特性？](https://github.com/febobo/web-interview/issues/67)