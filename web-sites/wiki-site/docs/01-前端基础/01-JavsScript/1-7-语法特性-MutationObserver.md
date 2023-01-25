# 语法特性-MutationObserver


> http://javascript.ruanyifeng.com/dom/mutationobserver.html

Mutation Observer API 用来监听DOM的变动事件, 包含了节点, 属性, 文本内容的变化, 这个API都可以得到通知. 

它类似于事件, 但是与事件有个本质的区别: 事件是同步触发, 也就是说DOM的变动会立即触发对应的事件; Mutation Observer则是异步触发的. 需要等到当前所有的DOM操作结束才会触发. 

这样的设计师为了应对DOM变动频繁的特点. 例如文档中连续插入元素这样的情况下, Mutation Observer会等到所有插入都结束之后才触发, 并且只触发一次. 

Mutation Observe有以下特点:

- 异步触发
- 将变动记录封装为数组进行处理
- 可以观察DOM的所有变动类型, 也可以只观察某一类变动

## 构造

```js
// 构造函数
let observer = new MutationObserver(callback);
```

上面的回调函数会在每次DOM变动后调用. 该回调函数接受两个参数, 第一个是变动数组, 第二个是观察器实例. 下面是一个例子:

```js
let observer = new MutationObserver(function (mutations, observer) {
    mutations.forEach(function(mutation){
        console.log(mutation);
    });
});
```

## 实例方法

### observe()

启动监听, 接受两个参数:

- 所要观察的DOM节点
- 一个配置对象, 指定要观察的特定变动

```js
let article = document.querySelector('article');

let optiosn = {
    'childList': true,
    'attributes':true
};

observer.observe(article, options);
```

观察器能观察的DOM变动类型, 有以下几种:

- `childList`: 子节点的变动(新增, 删除, 修改)
- `attributes`: 属性的变动
- `characterData`: 节点内容或节点文本的变动

想要观察哪一种变动类型, 就在`option`对象中指定为`true`, 需要注意, 必须指定至少一种, 否则会报错. 

除了变动类型, `options`对象还可以设定一下属性:

- `subtree`: 布尔值, 表示是否将该观察器应用于该节点的所有后代节点
- `attributeOldValue`: 布尔值, 表示观察`attributes`变动时, 是否需要记录变动前的值.
- `characterDataOldValue`: 布尔值, 表示观察`characterData`变动时, 是否需要记录变动前的值.
- `arrtibuteFilter`: 数组, 表示需要观察的特定属性, 例如: `['class', 'src']`.

```js
// 开始监听文档根节点（即<html>标签）的变动
mutationObserver.observe(document.documentElement, {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
  attributeOldValue: true,
  characterDataOldValue: true
});
```

对一个节点添加观察器, 就像使用`addEventListener`一样, 多次添加同一个观察器是无效的, 回调函数依然只会触发一次, 但是如果自定不同的`options`对象, 就会被当做两个不同的观察器. 

下面是一个观察新增子节点的例子:

```js
let insertedNodes = [];
let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function(mutation) {
        for (let i = 0;i < mutation.addedNodes.length; i++){
            insertedNodes.push(mutation.addedNodes[i]);
        }
    });
    observer.observe(document, { childList: true });
    console.log(insertedNodes);
});
```

### disconnect(), takeRecords()

`disconnect`方法用来停止观察, 调用该方法后, DOM再发生变动, 也不会触发观察器. 

```js
observer.disconnect();
```

`takeRecords`方法用来清除变动记录, 即不再处理未处理的变动. 该方法返回变动记录的数组.

```js
observer.takeRecords();
```

下面是一个结合使用的例子:

```js
// 保存所有没有被观察器处理的变动
let changes = mutationObserver.takeRecords();

// 停止观察
mutationObserver.disconnect();
```

## MutationRecord 对象

DOM每次变化, 就会生成一条变动记录(Mutation Record 实例). 该实例包含了与变化相关的所有信息. Mutation Observer 处理的就是一个个`MutationRecord`实例所组成的数组. 

`MutationRecord`对象包含了DOM的相关信息:

- `type`: 观察的变动类型(`arrtibute`, `characterData`或`childList`).
- `target`: 发生变动的DOM节点
- `addedNodes`: 新增的DOM节点
- `removedNodes`: 删除的节点
- `previousSibling`: 前一个同级节点, 如果没有则返回`null`
- `nextSibling`: 下一个同级节点, 如果没有则返回`null`
- `attributeName`: 发生变动的属性, 如果设置了`attributeFilter`, 则只返回预先指定的属性. 
- `oldValue`: 变动前的值. 这个属性只对`attribute`和`characterData`变动有效, 如果发生`childList`变动, 则返回`null`.

## 例子

### 监听子元素变动

```js
let callback = function (records){
  records.map(function(record){
    console.log('Mutation type: ' + record.type);
    console.log('Mutation target: ' + record.target);
  });
};

let mo = new MutationObserver(callback);

let option = {
  'childList': true,
  'subtree': true
};

mo.observe(document.body, option);
```

该例子中的观察器, 观察`body`的所有下级节点(`childList`表示观察子节点, `subtree`表示观察后代节点)的变动. 回调函数会在控制台显示所有变动的类型和目标节点. 

### 监听属性的变动

```js
let callback = function (records) {
  records.map(function (record) {
    console.log('Previous attribute value: ' + record.oldValue);
  });
};

let mo = new MutationObserver(callback);

let element = document.getElementById('#my_element');

let options = {
  'attributes': true,
  'attributeOldValue': true
}

mo.observe(element, options);
```

上面代码先设定追踪属性变动(`'attribute':true`), 然后设定记录变动前的值. 实际发生变动时, 会将变动前的值显示在控制台. 

### 取代`DOMContentLoaded`事件

网页加载的时候, DOM节点的生成会产生变动记录, 因此只要观察DOM的变动, 就能在第一事件触发相关的事件, 可以用来取代`DOMContentLoaded`事件.

```js
var observer = new MutationObserver(callback);
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
```

上面代码中, 监听`document.documentELement`的子节点的变动, `subtree`属性指定监听还包括后代节点. 因此, 任意一个网页元素一旦生成, 就立刻被监听到. 

下面是一个封装了监听DOM生成的函数:

```js
(function(win){
  'use strict';

  var listeners = [];
  var doc = win.document;
  var MutationObserver = win.MutationObserver || win.WebKitMutationObserver;
  var observer;

  function ready(selector, fn){
    // 储存选择器和回调函数
    listeners.push({
      selector: selector,
      fn: fn
    });
    if(!observer){
      // 监听document变化
      observer = new MutationObserver(check);
      observer.observe(doc.documentElement, {
        childList: true,
        subtree: true
      });
    }
    // 检查该节点是否已经在DOM中
    check();
  }

  function check(){
  // 检查是否匹配已储存的节点
    for(var i = 0; i < listeners.length; i++){
      var listener = listeners[i];
      // 检查指定节点是否有匹配
      var elements = doc.querySelectorAll(listener.selector);
      for(var j = 0; j < elements.length; j++){
        var element = elements[j];
        // 确保回调函数只会对该元素调用一次
        if(!element.ready){
          element.ready = true;
          // 对该节点调用回调函数
          listener.fn.call(element, element);
        }
      }
    }
  }

  // 对外暴露ready
  win.ready = ready;

})(this);

ready('.foo', function(element){
  // ...
});
```