# Vue-双向绑定


## 可观测数据

Vue中的数据绑定是通过`Object.defineProperty`这个Api实现的. 

下面是一个简单的例子:

```js
let car = {}
let val = 3000
Object.defineProperty(car, 'price', {
  enumerable: true,
  configurable: true,
  get(){
    console.log('price属性被读取了')
    return val
  },
  set(newVal){
    console.log('price属性被修改了')
    val = newVal
  }
})
```

在读取或者设置`car.price`的时候, `get()`和`set()`就会被触发.

将一个对象的所有属性都变得如同该属性一样, 可以通过一个封装的`Obeserver`类来实现:

```js
// 源码位置：src/core/observer/index.js

/**
 * Observer类会通过递归的方式把一个对象的所有属性都转化成可观测对象
 */
export class Observer {
  constructor (value) {
    this.value = value
    // 给value新增一个__ob__属性，值为该value的Observer实例
    // 相当于为value打上标记，表示它已经被转化成响应式了，避免重复操作
    def(value,'__ob__',this)
    if (Array.isArray(value)) {
      // 当value为数组时的逻辑
      // ...
    } else {
      this.walk(value)
    }
  }

  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
}
/**
 * 使一个对象转化成可观测对象
 * @param { Object } obj 对象
 * @param { String } key 对象的key
 * @param { Any } val 对象的某个key的值
 */
function defineReactive (obj,key,val) {
  // 如果只传了obj和key，那么val = obj[key]
  if (arguments.length === 2) {
    val = obj[key]
  }
  if(typeof val === 'object'){
      new Observer(val)
  }
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get(){
      console.log(`${key}属性被读取了`);
      return val;
    },
    set(newVal){
      if(val === newVal){
          return
      }
      console.log(`${key}属性被修改了`);
      val = newVal;
    }
  })
}
```

在这里的代码中, 定义了`observer`类, 用来将一个正常的`Object`转换成可观测的`object`, 并且给`value`新增一个`__ob__`属性, 值为该`value`的`Observer`实例, 这个操作相当于给`value`打上标记, 表示已经为转换为响应式了, 避免重复操作.

通过判断数据的类型, 只有`object`类型的数据才会调用`walk`将每一个属性转换成`getter/setter`的形式来侦测变化. 最后, 在`defineReactive`中传入的属性值是一个`obejct`时使用`new observer(val)`来继续递归子属性. 这样就讲一个对象所有的属性都添加监听了. 

用这种方法定义一个响应式变量:

```js
let car = new Observer({
  'brand':'BMW',
  'price':3000
})
```

## 依赖收集

Vue的运行原理是: 数据=>视图. 当数据发生变化的时候就会通知视图更新. 如何通知? 在Vue中的处理方法是通过依赖收集. 

在可观测的数据被获取时会触发`getter`属性, 因此可以在`getter`中收集这个依赖, 同样的, 当这个数据变化时会触发`setter`属性, 所以可以在`setter`中通知依赖进行更新. 

将这个依赖收集的过程抽象为一个依赖管理器, 就得到了`Dep`类:

```js
// 源码位置：src/core/observer/dep.js
export default class Dep {
  constructor () {
    this.subs = []
  }

  addSub (sub) {
    this.subs.push(sub)
  }
  // 删除一个依赖
  removeSub (sub) {
    remove(this.subs, sub)
  }
  // 添加一个依赖
  depend () {
    if (window.target) {
      this.addSub(window.target)
    }
  }
  // 通知所有依赖更新
  notify () {
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

/**
 * Remove an item from an array
 */
export function remove (arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
```

在上面的依赖管理器`Dep`类中, 先初始化了一个`subs`数组, 用来存放依赖, 并且定义了几个实例方向用来对依赖进行添加, 删除, 通知等操作. 

有了依赖管理器之后, 就可以在`getter`中收集依赖, 在`setter`中通知依赖的更新:

```js
function defineReactive (obj,key,val) {
  if (arguments.length === 2) {
    val = obj[key]
  }
  if(typeof val === 'object'){
    new Observer(val)
  }
  const dep = new Dep()  //实例化一个依赖管理器，生成一个依赖管理数组dep
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get(){
      dep.depend()    // 在getter中收集依赖
      return val;
    },
    set(newVal){
      if(val === newVal){
          return
      }
      val = newVal;
      dep.notify()   // 在setter中通知依赖更新
    }
  })
}
```

## 依赖观察者

`Vue`中还实现了一个`Watcher`的类, 而`Watcher`类的实例就是依赖的观察者, 也就是依赖的使用者. 数据变化时, 我们不直接通知依赖更新, 而是通知依赖对应的`Watch`实例, 由`Watcher`实例去通知真正的视图:

```js
export default class Watcher {
  constructor (vm,expOrFn,cb) {
    this.vm = vm;
    this.cb = cb;
    this.getter = parsePath(expOrFn)
    this.value = this.get()
  }
  get () {
    window.target = this;
    const vm = this.vm
    let value = this.getter.call(vm, vm)
    window.target = undefined;
    return value
  }
  update () {
    const oldValue = this.value
    this.value = this.get()
    this.cb.call(this.vm, this.value, oldValue)
  }
}

/**
 * Parse simple path.
 * 把一个形如'data.a.b.c'的字符串路径所表示的值，从真实的data对象中取出来
 * 例如：
 * data = {a:{b:{c:2}}}
 * parsePath('a.b.c')(data)  // 2
 */
const bailRE = /[^\w.$]/
export function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
```

谁使用了数据, 谁就是依赖, 我们就为它创建一个`watcher`实例, 在创建`Watcher`实例的过程中会自动的把自己添加到这个数据对应的依赖管理器中, 以后这个`Watcher`实例就代表这个依赖, 当数据发生变化的时候, 就有`Watcher`去通知真正的依赖.

`Watcher`类的代码逻辑如下:

1. 实例化`Watcher`类, 执行其构造函数
2. 在构造函数中调用`this.get()`实例方法
3. 在`get()`方法中, 首先通过`window.target=this`把实例自身赋给一个全局的唯一对象`window.target`上, 然后通过`let value=this.getter.call(vm,vm)`获取被依赖的数据, 获取被依赖数据的目的是触发数据上的`getter`, 在`getter`中调用`dep.depend()`收集依赖, 在`dep.depend()`中取到挂载`window.target`上的值并存入依赖数据, 在`get()`方法的最后将`window.target`释放.
4. 当数据变化时, 会触发数据的`setter`, 在`setter`中调用了`dep.botify()`方法, 在`dep.notify()`中比耐力所有的依赖, 执行依赖的`update`方法, 在该方法中调用更新回调, 更新界面

![image](/assets/2021-4-23/vue-watcher.jpg)


需要注意的是, `Object.defineProperty`方法实现了对`object`的数据监控, 但是只能观察到取值和赋值, 而无法观察到属性的添加和删除, 因此需要借助额外的`Vue.set`和`Vue.delete`进行处理.

## 数组的观察

由于`Object.defineProperty`只能观察`Object`而不能观察`Array`, 所以`Vue`设计了另外一套双向绑定机制.

由于我们在使用`Vue`的时候一般会把数组定义在`Data`中, 也就是一个对象中, 所以也可以在`define`进行依赖收集.

```js
data(){
  return {
    arr:[1,2,3]
  }
}
```

但是数组数据的变化则需要通过另一套机制来实现

### 数组方法拦截器

在`Vue`中, 对于`Array`数据的变化的检测则是通过重写数组方法来实现的, 比如下面的`push`方法:

```js
let arr = [1,2,3]
arr.push(4)
Array.prototype.newPush = function(val){
  console.log('arr被修改了')
  this.push(val)
}
arr.newPush(4)
```

本质上, `Vue`创建了一个数组方法拦截器, `Array`原型中拦截器主要有`push,pop,shift,unshift,splice,sort,reverse`, 代码如下:

```js
// 源码位置：/src/core/observer/array.js

const arrayProto = Array.prototype
// 创建一个对象作为拦截器
export const arrayMethods = Object.create(arrayProto)

// 改变数组自身内容的7个方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  const original = arrayProto[method]      // 缓存原生方法
  Object.defineProperty(arrayMethods, method, {
    enumerable: false,
    configurable: true,
    writable: true,
    value:function mutator(...args){
      const result = original.apply(this, args)
      return result
    }
  })
})
```

实际上在调用这些方法的时候会先调用`mutator`函数来执行发送变化通知. 

然后把这个拦截器挂载到数据实例与`Array.prototype`之间:

```js
// 源码位置：/src/core/observer/index.js
export class Observer {
  constructor (value) {
    this.value = value
    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
    } else {
      this.walk(value)
    }
  }
}
// 能力检测：判断__proto__是否可用，因为有的浏览器不支持该属性
export const hasProto = '__proto__' in {}

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object, keys: any) {
  target.__proto__ = src
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}
```

### 数组依赖收集

数据数组的依赖同样的`getter`中收集, 而给数组数据添加`getter/setter`都是在`Observe`中完成的, 所以我们也应该在`Observer`类中收集依赖:

```js
// 源码位置：/src/core/observer/index.js
export class Observer {
  constructor (value) {
    this.value = value
    this.dep = new Dep()    // 实例化一个依赖管理器，用来收集数组依赖
    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
    } else {
      this.walk(value)
    }
  }
}
```

依赖管理器定义在`Observer`类中, 而我们需要在`getter`中收集依赖, 也就是说必须在  `getter`中能够访问到`Observer`的依赖管理器:

```js
function defineReactive (obj,key,val) {
  let childOb = observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get(){
      if (childOb) {
        childOb.dep.depend()
      }
      return val;
    },
    set(newVal){
      if(val === newVal){
        return
      }
      val = newVal;
      dep.notify()   // 在setter中通知依赖更新
    }
  })
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * 尝试为value创建一个0bserver实例，如果创建成功，直接返回新创建的Observer实例。
 * 如果 Value 已经存在一个Observer实例，则直接返回它
 */
export function observe (value, asRootData){
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else {
    ob = new Observer(value)
  }
  return ob
}
```

通知依赖:

首先要能访问到依赖, 然后调用依赖管理器的`dep.notify()`方法, 让它去通知以来更新:

```js
/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    // notify change
    ob.dep.notify()
    return result
  })
})
```

由于拦截器是挂载到数组数据的原型上, 所以拦截器中的`this`就是数据`value`, 拿到`value`上的`Observer`类实例, 从而就可以调用`Observer`类实例上面依赖管理器的`dep.notify()`方法, 以达到通知依赖的目的. 

### 深度检测

前文的`Array`数据的变化侦测仅仅是数组自身变化的侦测, 比如数组新增一个元素或者删除一个元素, 在`Vue`中, 不论是`Object`类型或者`Array`型数据所实现的数据变化侦测都是深度侦测, 所谓深度检测就是不但侦测数据自身的变化, 还要侦测数据中所有子数据的变化. 

比如:

```js
let arr = [
  {
    name:'NLRX'，
    age:'18'
  }
]
```

在源码中实现如下:

```js
export class Observer {
  value: any;
  dep: Dep;

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      this.observeArray(value)   // 将数组中的所有元素都转化为可被侦测的响应式
    } else {
      this.walk(value)
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

export function observe (value, asRootData){
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else {
    ob = new Observer(value)
  }
  return ob
}
```

在`Array`数据中, 调用`observerArray()`方法, 比那里数组中的每一个元素, 通过调用`observer`函数, 将每一个元素转化为可侦测的响应式数据. 

而对应`object`数据, 在`defineReactive`函数中进行了递归操作. 

### 数组新增元素的侦测

对于新增元素的侦测, 需要先拿到这个新增的元素, 然后调用`observer`函数将其转化. 分别监听`push`,`unshift`,`splice`三个方法进行处理:

```js
/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args   // 如果是push或unshift方法，那么传入参数就是新增的元素
        break
      case 'splice':
        inserted = args.slice(2) // 如果是splice方法，那么传入参数列表中下标为2的就是新增的元素
        break
    }
    if (inserted) ob.observeArray(inserted) // 调用observe函数将新增的元素转化成响应式
    // notify change
    ob.dep.notify()
    return result
  })
})
```

在拦截器定义代码中, 如果是`push`或`unshift`方法, 那么传入参数就是新增的元素, 如果是`splice`方法, 那么传入参数列表中下标为2的就是新增元素吗拿到新增的元素, 就可以调用`observe`函数将新增的元素转化为响应式. 

### 不足

只有通过数组方法对数组进行操作时才能侦测到, 但是数组下标则不可以, 因此需要通过`Vue.set`和`Vue.delete`来手动的侦测. 


## 实现一个简单的双向绑定

模板:

```js
<div>{{ name }}</div>
```

解析模板添加订阅:

```js
function observe(obj) {
    // 判断类型
    if (!obj || typeof obj !== 'object') {
        return;
    }
    Object.keys(obj).forEach(key => {
        defineReactive(obj, key, obj[key]);
    });
}

function defineReactive(obj, key, val) {
    // 递归子属性
    observe(val);
    let dp = new Dep();
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            console.log('get value');
            // 将 Watcher 添加到订阅
            if (Dep.target) {
                dp.addSub(Dep.target);
            }
            return val;
        },
        set: function reactiveSetter(newVal) {
            console.log('change value');
            val = newVal;
            // 执行 watcher 的 update 方法
            dp.notify();
        }
    });
}

// 通过 Dep 解耦
class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(sub) {
        // sub 是 Watcher 实例
        this.subs.push(sub);
    }
    notify() {
        this.subs.forEach(sub => {
            sub.update();
        });
    }
}
// 全局属性，通过该属性配置 Watcher
Dep.target = null;

function update(value) {
    document.querySelector('div').innerText = value;
}

class Watcher {
    constructor(obj, key, cb) {
        // 将 Dep.target 指向自己
        // 然后触发属性的 getter 添加监听
        // 最后将 Dep.target 置空
        Dep.target = this;
        this.cb = cb;
        this.obj = obj;
        this.key = key;
        this.value = obj[key];
        Dep.target = null;
    }
    update() {
        // 获得新值
        this.value = this.obj[this.key];
        // 调用 update 方法更新 Dom
        this.cb(this.value);
    }
}
var data = { name: 'yck' };
observe(data);
// 模拟解析到 `{{name}}` 触发的操作
new Watcher(data, 'name', update);
// update Dom innerText
data.name = 'yyy';
```

## Proxy 与 Object.defineProperty 的区别

`Object.defineProperty` 虽然已经能够实现双向绑定了，但是他还是有缺陷的。

- 对一个对象进行删除和添加属性操作时无法劫持的
- 如果存在深层的嵌套对象关系, 需要深层的递归进行监听, 造成性能的极大问题
- 数组API的方法也无法监听到

Proxy 就没以上的问题，原生支持监听数组变化，并且可以直接对整个对象进行拦截: 

```js
let onWatch = (obj, setBind, getLogger) => {
    let handler = {
        get(target, property, receiver) {
            getLogger(target, property);
            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            setBind(value);
            return Reflect.set(target, property, value);
        }
    };
    return new Proxy(obj, handler);
};

let obj = { a: 1 };
let value;
let p = onWatch(
    obj,
    v => {
        value = v;
    },
    (target, property) => {
        console.log(`Get '${property}' = ${target[property]}`);
    }
);
p.a = 2; // bind `value` to `2`
p.a; // -> Get 'a' = 2
```

## 参考链接

- [逐行剖析 Vue.js 源码-变化侦测篇](https://nlrx-wjc.github.io/Learn-Vue-Source-Code/reactive/object.html#_1-%E5%89%8D%E8%A8%80)