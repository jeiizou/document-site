# 语法特性-Proxy


> [原文链接: 阮一峰的 ES6 入门](http://es6.ruanyifeng.com/#docs/proxy)
> 
> Proxy 可以用于修改某些操作的默认行为, 等同于在语言层面做出修改, 所以属于一种`meta programming`(元编程), 即对编程语言进行编程.

## 1. 使用

`Proxy`可以理解成为, 在目标对象之前架设一层"拦截", 外界对该对象的访问, 都必须先通过这层拦截, 因此提供了一种机制, 可以对外界的访问进行过滤和改写, `Proxy`意为代理, 表示可以来代理某些操作.

```js
var obj = new Proxy(
    {},
    {
        get: function(target, key, receiver) {
            console.log(`getting ${key}!`);
            return Reflect.get(target, key, receiver);
        },
        set: function(target, key, value, receiver) {
            console.log(`setting ${key}!`);
            return Reflect.set(target, key, value, receiver);
        }
    }
);
```

这段代码对一个空对象架设了一层拦截, 重定义了属性的读取(get)和设置(set)行为. 这里暂时不限解释具体的语法, 只看运行结果, 对设置了拦截行为的对象`obj`, 去读写它的属性, 就会得到下面的结果.

```js
obj.count = 1;
//  setting count!
++obj.count;
//  getting count!
//  setting count!
//  2
```

所以实际上 Proxy 重载了点运算符, 即用自己的定义覆盖了语言的原始定义.

ES6 原生提供了 Proxy 构造函数, 用来生成 Proxy 实例.

```js
var proxy = new Proxy(target, handler);
```

Proxy 作为构造函数接受两个参数, 第一个参数是所要代理的目标对象, 如果没有 Proxy 介入, 操作原来要访问的就是这个对象, 第二个参数是一个配置对象, 对于每一个被代理的操作, 需要提供一个对应的处理函数, 该函数将拦截对应的操作.

## 2. 拦截器

Proxy 有十三种拦截器, 下面是一张速览表:

| 方法                                        | 介绍                                                                                                                                                                                                                               |
| ------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get(target, propKey, receiver)`            | 拦截对象属性的读取，比如 proxy.foo 和 proxy['foo']                                                                                                                                                                                 |
| `set(target, propKey, value, receiver)`     | 拦截对象属性的设置，比如 proxy.foo = v 或 proxy['foo'] = v，返回一个布尔值。`has(target, propKey)`：拦截 propKey in proxy 的操作，返回一个布尔值。                                                                                 |
| `deleteProperty(target, propKey)`           | 拦截 delete proxy[propKey]的操作，返回一个布尔值。                                                                                                                                                                                 |
| `ownKeys(target)`                           | 拦截 Object.getOwnPropertyNames(proxy)、Object.getOwnPropertySymbols(proxy)、Object.keys(proxy)、for...in 循环，返回一个数组。该方法返回目标对象所有自身的属性的属性名，而 Object.keys()的返回结果仅包括目标对象自身的可遍历属性。 |
| `getOwnPropertyDescriptor(target, propKey)` | 拦截 Object.getOwnPropertyDescriptor(proxy, propKey)，返回属性的描述对象。                                                                                                                                                         |
| `defineProperty(target, propKey, propDesc)` | 拦截 Object.defineProperty(proxy, propKey, propDesc）、Object.defineProperties(proxy, propDescs)，返回一个布尔值。                                                                                                                 |
| `preventExtensions(target)`                 | 拦截 Object.preventExtensions(proxy)，返回一个布尔值。                                                                                                                                                                             |
| `getPrototypeOf(target)`                    | 拦截 Object.getPrototypeOf(proxy)，返回一个对象。                                                                                                                                                                                  |
| `isExtensible(target)`                      | 拦截 Object.isExtensible(proxy)，返回一个布尔值。                                                                                                                                                                                  |
| `setPrototypeOf(target, proto)`             | 拦截 Object.setPrototypeOf(proxy, proto)，返回一个布尔值。如果目标对象是函数，那么还有两种额外操作可以拦截。                                                                                                                       |
| `apply(target, object, args)`               | 拦截 Proxy 实例作为函数调用的操作，比如 proxy(...args)、proxy.call(object, ...args)、proxy.apply(...)。                                                                                                                            |
| `construct(target, args)`                   | 拦截 Proxy 实例作为构造函数调用的操作，比如 new proxy(...args)。                                                                                                                                                                   |

### 2.1 Get()

get 方法拦截对属性的读取操作, 依次接受目标对象, 属性名以及操作所针对的对象本身, 随后一个参数可选. 下面的代码定义了一个操作: 如果对象中没有这个属性则抛出一个异常

```js
var person = {
    name: '张三'
};

var proxy = new Proxy(person, {
    get: function(target, property) {
        if (property in target) {
            return target[property];
        } else {
            throw new ReferenceError('Property "' + property + '" does not exist.');
        }
    }
});

proxy.name; // "张三"
proxy.age; // 抛出一个错误
```

get 方法是可以继承的:

```js
let proto = new Proxy(
    {},
    {
        get(target, propertyKey, receiver) {
            console.log('GET ' + propertyKey);
            return target[propertyKey];
        }
    }
);

let obj = Object.create(proto);
obj.foo; // "GET foo"
```

在读取`obj`对象继承的属性时, 拦截会生效.

`receiver`属性指向 proxy 所定义的对象本身:

```js
const proxy = new Proxy(
    {},
    {
        get: function(target, property, receiver) {
            return receiver;
        }
    }
);

const d = Object.create(proxy);
d.a === d; // true
```

如果一个属性不可配置(configurable)且不可写(writable), 则 Proxy 不能修改该属性, 否则会报错.

**使用 get 的应用场景:**

1. 数组读取负数的索引:

```js
function createArray(...elements) {
    let handler = {
        get(target, propKey, receiver) {
            let index = Number(propKey);
            if (index < 0) {
                propKey = String(target.length + index);
            }
            return Reflect.get(target, propKey, recevier);
        }
    };
}

let arr = createArray('a', 'b', 'c');
arr[-1]; // c
```

2. 将读取属性的操作, 转变为执行某个函数, 从而实现属性的链式操作

```js
var pipe = (function() {
    return function(value) {
        var funcStack = [];
        var oproxy = new Proxy(
            {},
            {
                get: function(pipeObject, fnName) {
                    if (fnName === 'get') {
                        return funcStack.reduce(function(val, fn) {
                            return fn(val);
                        }, value);
                    }
                    funcStack.push(window[fnName]);
                    return oproxy;
                }
            }
        );

        return oproxy;
    };
})();

var double = n => n * 2;
var pow = n => n * n;
var reverseInt = n =>
    n
        .toString()
        .split('')
        .reverse()
        .join('') | 0;

pipe(3).double.pow.reverseInt.get; // 63
```

3. 利用`get`拦截, 实现一个生成各种 DOM 节点的通用函数`dom`:

```js
const dom = new Proxy(
    {},
    {
        get(target, property) {
            return function(attrs = {}, ...children) {
                const el = document.createElement(property);
                for (let prop of Object.keys(attrs)) {
                    el.setAttribute(prop, attrs[prop]);
                }
                for (let child of children) {
                    if (typeof child === 'string') {
                        child = document.createTextNode(child);
                    }
                    el.appendChild(child);
                }
                return el;
            };
        }
    }
);

const el = dom.div(
    {},
    'Hello, my name is ',
    dom.a({ href: '//example.com' }, 'Mark'),
    '. I like:',
    dom.ul({}, dom.li({}, 'The web'), dom.li({}, 'Food'), dom.li({}, "…actually that's it"))
);

document.body.appendChild(el);
```

### 2.2 Set()

`set()`方法用来拦截某个属性的赋值操作, 可以接受四个参数, 一次为目标对象, 属性名, 属性值, 以及 Proxy 实例本身. (最后一个可选).

同样的, 如果目标对象的属性不可写且不可配置, 那么 set 方法将不起作用.

此外, 注意在严格模式下, `set`代理必须返回一个 true, 否则就会报错.

**set 的典型应用场景:**

1. 利用`set()`方法可以实现数据验证, 还可以实现数据绑定.

```js
let validator = {
    set: function(obj, prop, value) {
        if (prop === 'age') {
            if (!Number.isInteger(value)) {
                throw new TypeError('The age is not an integer');
            }
            if (value > 200) {
                throw new RangeError('The age seems invalid');
            }
        }

        // 对于满足条件的 age 属性以及其他属性，直接保存
        obj[prop] = value;
    }
};

let person = new Proxy({}, validator);

person.age = 100;

person.age; // 100
person.age = 'young'; // 报错
person.age = 300; // 报错
```

2. 约定俗成的, 我们在对象上面设置内部属性, 属性名的第一个字符使用下划线开头, 表示是一个内部变量, 结合`set`和`get`就可以防止这些内部属性被外部读写:

```js
const handler = {
    get(target, key) {
        invariant(key, 'get');
        return target[key];
    },
    set(target, key, value) {
        invariant(key, 'set');
        target[key] = value;
        return true;
    }
};
function invariant(key, action) {
    if (key[0] === '_') {
        throw new Error(`Invalid attempt to ${action} private "${key}" property`);
    }
}

const target = {};
const proxy = new Proxy(target, handler);
proxy._prop;
// Error: Invalid attempt to get private "_prop" property
proxy._prop = 'c';
// Error: Invalid attempt to set private "_prop" property
```

### 2.3 Apply()

`apple`方法拦截函数的调用, `call`以及`apply`操作,

`apple`方法接受三个参数, 依次是目标对象, 目标对象的上下文对象(this)以及目标对象的参数数组.

```js
var target = function() {
    return 'I am the target';
};
var handler = {
    apply: function() {
        return 'I am the proxy';
    }
};

var p = new Proxy(target, handler);

p();
// "I am the proxy"
```

这是使用`apply`的另外一个例子:

```js
var twice = {
    apply(target, ctx, args) {
        return Reflect.apply(...arguments) * 2;
    }
};
function sum(left, right) {
    return left + right;
}
var proxy = new Proxy(sum, twice);
proxy(1, 2); // 6
proxy.call(null, 5, 6); // 22
proxy.apply(null, [7, 8]); // 30
```

此外直接调用`Reflect.apply`方法也会被拦截:

```js
Reflect.apply(proxy, null, [9, 10]); // 38
```

### 2.4 Has()

`has`方法主要用于来接`HasProperty`方法, 即判断对象是否具有某个属性, 这个方法就会生效, 典型的比如`in`运算符.

`has`方法接受两个参数: 目标对象, 需要查询的属性名.

这个例子中使用`has`来隐藏某些属性不被`in`运算符发现

```js
var handler = {
    has(target, key) {
        if (key[0] === '_') {
            return false;
        }
        return key in target;
    }
};
var target = { _prop: 'foo', prop: 'foo' };
var proxy = new Proxy(target, handler);
'_prop' in proxy; // false
```

如果原对象不可配置或者禁止扩展, `has`拦截会报出一个异常.

此外:

1. `has`方法拦截`HasProperty`, 但是不拦截`HasOwnProperty`, 即`has`不判断一个属性是对象自身的属性, 还是继承的属性.
2. 不拦截`for...in`中的`in`运算符.

### 2.5 Construct()

`construct`方法用于拦截`new`命令, 接受两个参数: target: 目标对象, args: 构造函数的参数对象.

```js
var p = new Proxy(function() {}, {
    construct: function(target, args) {
        console.log('called: ' + args.join(', '));
        return { value: args[0] * 10 };
    }
});

new p(1).value;
// "called: 1"
// 10
```

`construct`方法返回的必须是一个对象, 否则就会报错:

```js
var p = new Proxy(function() {}, {
    construct: function(target, argumentsList) {
        return 1;
    }
});

new p(); // 报错
// Uncaught TypeError: 'construct' on proxy: trap returned non-object ('1')
```

### 2.6 DeleteProperty()

`deleteProperty`方法用于拦截`delete`操作, 如果这个方法抛出错误或者返回`false`, 当前属性就无法被`delete`删除. 对象的不可配置属性不能被删除.

下面这个例子中, 删除`_`开头的属性会报错.

```js
var handler = {
    deleteProperty(target, key) {
        invariant(key, 'delete');
        delete target[key];
        return true;
    }
};
function invariant(key, action) {
    if (key[0] === '_') {
        throw new Error(`Invalid attempt to ${action} private "${key}" property`);
    }
}

var target = { _prop: 'foo' };
var proxy = new Proxy(target, handler);
delete proxy._prop;
// Error: Invalid attempt to delete private "_prop" property
```

### 2.7 DefineProperty()

`defineProperty`方法拦截了`Object.defineProperty`操作.

```js
var handler = {
    defineProperty(target, key, descriptor) {
        return false;
    }
};
var target = {};
var proxy = new Proxy(target, handler);
proxy.foo = 'bar'; // 不会生效
```

如果目标对象不可扩展, 则`defineProperty`不能增加目标对象上不存在的属性, 若目标对象的某个属性不可写(writable)或不可配置, 则`defineProperty`不得改变这两个设置.

### 2.8 GetOwnPropertyDescriptor()

`getOwnPropertyDescriptor`方法拦截`Object.getOwnPropertyDescriptor()`,返回一个属性描述对象或者`undefined`。

```js
var handler = {
    getOwnPropertyDescriptor(target, key) {
        if (key[0] === '_') {
            return;
        }
        return Object.getOwnPropertyDescriptor(target, key);
    }
};
var target = { _foo: 'bar', baz: 'tar' };
var proxy = new Proxy(target, handler);
Object.getOwnPropertyDescriptor(proxy, 'wat');
// undefined
```

### 2.9 GetPrototypeOf()

getPrototypeOf 方法主要用来拦截获取对象原型。具体来说，拦截下面这些操作。

-   `Object.prototype.__proto__`
-   `Object.prototype.isPrototypeOf()`
-   `Object.getPrototypeOf()`
-   `Reflect.getPrototypeOf()`
-   `instanceof`

### 2.10 IsExtensible()

`isExtensible`方法拦截`Object.isExtensible`操作. 来决定一个对象是否是可扩展的.

该方法只能返回布尔值, 否则返回值会被自动转为布尔值. 并且它的返回值必须与目标对象的`isExtensible`属性保持一致, 否则就会抛出错误.

```js
Object.isExtensible(proxy) === Object.isExtensible(target);

var p = new Proxy(
    {},
    {
        isExtensible: function(target) {
            return false;
        }
    }
);

Object.isExtensible(p);
// Uncaught TypeError: 'isExtensible' on proxy: trap result does...
```

### 2.11 OwnKeys()

`ownKeys`方法用来拦截对象自身属性的读取操作。具体来说，拦截以下操作。

-   `Object.getOwnPropertyNames()`
-   `Object.getOwnPropertySymbols()`
-   `Object.keys()`
-   `for...in`循环

```js
let target = {
    _bar: 'foo',
    _prop: 'bar',
    prop: 'baz'
};

let handler = {
    ownKeys(target) {
        return Reflect.ownKeys(target).filter(key => key[0] !== '_');
    }
};

let proxy = new Proxy(target, handler);
for (let key of Object.keys(proxy)) {
    console.log(target[key]);
}
// "baz"
```

目标对象上不存在的属性, Symbol 值以及不可遍历的属性都会被`ownKeys`忽略.

### 2.12 PreventExtensions()

`preventExtensions`方法拦截`Object.preventExtensions()`。该方法必须返回一个布尔值，否则会被自动转为布尔值。

这个方法有一个限制，只有目标对象不可扩展时（即`Object.isExtensible(proxy)`为 false），`proxy.preventExtensions`才能返回 true，否则会报错。

为了防止这个问题, 通常要在`proxy.preventExtensions`方法里面，调用一次`Object.preventExtensions`。

```js
var proxy = new Proxy(
    {},
    {
        preventExtensions: function(target) {
            console.log('called');
            Object.preventExtensions(target);
            return true;
        }
    }
);

Object.preventExtensions(proxy);
// "called"
// Proxy {}
```

### 2.13 SetPrototypeOf()

`setPrototypeOf`方法主要用来拦截`Object.setPrototypeOf`方法。

```js
var handler = {
    setPrototypeOf(target, proto) {
        throw new Error('Changing the prototype is forbidden');
    }
};
var proto = {};
var target = function() {};
var proxy = new Proxy(target, handler);
Object.setPrototypeOf(proxy, proto);
// Error: Changing the prototype is forbidden
```

上面代码中，只要修改 target 的原型对象，就会报错。

注意，该方法只能返回布尔值，否则会被自动转为布尔值。另外，如果目标对象不可扩展（non-extensible），`setPrototypeOf`方法不得改变目标对象的原型。

## 3. Proxy.revocable()

`Proxy.revocable`方法返回一个可取消的 Proxy 实例.

```js
let target = {};
let handler = {};

let { proxy, revoke } = Proxy.revocable(target, handler);

proxy.foo = 123;
proxy.foo; // 123

revoke();
proxy.foo; // TypeError: Revoked
```

该放在可以用在访问结束就收回代理权不允许再次访问的场景.

## 4. Proxy 的 this

`Proxy`并不是一种透明代理, 原因就在于对象向内部的`this`关键字会指向`Proxy`代理.

```js
const target = {
    m: function() {
        console.log(this === proxy);
    }
};
const handler = {};

const proxy = new Proxy(target, handler);

target.m(); // false
proxy.m(); // true
```

由于`this`的变化, `Proxy`无法代理目标对象:

```js
const _name = new WeakMap();

class Person {
    constructor(name) {
        _name.set(this, name);
    }
    get name() {
        return _name.get(this);
    }
}

const jane = new Person('Jane');
jane.name; // 'Jane'

const proxy = new Proxy(jane, {});
proxy.name; // undefined
```

此外, 有些原生对象的内部属性依赖于`this`访问, 此时`Proxy`也无法进行代理:

```js
const target = new Date();
const handler = {};
const proxy = new Proxy(target, handler);

proxy.getDate();
// TypeError: this is not a Date object.
```

解决问题的方法是进行手动绑定:

```js
const target = new Date('2015-01-01');
const handler = {
    get(target, prop) {
        if (prop === 'getDate') {
            return target.getDate.bind(target);
        }
        return Reflect.get(target, prop);
    }
};
const proxy = new Proxy(target, handler);

proxy.getDate(); // 1
```

## 5. 实例 1:web 服务器的客户端

```js
const service = createWebService('http://example.com/data');

service.employees().then(json => {
    const employees = JSON.parse(json);
    // ···
});

function createWebService(baseUrl) {
    return new Proxy(
        {},
        {
            get(target, propKey, receiver) {
                return () => httpGet(baseUrl + '/' + propKey);
            }
        }
    );
}
```

上面的代码中新建了一个 Web 服务接口, 这个接口返回各种数据, Proxy 可以拦截这个对象的任意属性, 所以不用为每一种数据写一个方法, 只需要写一个 Proxy 拦截就可以了.

同样的道理, 我们可以使用`Proxy`来实现数据库的 ORM 层.

## 6. Reflect

`Reflect`类似于`Proxy`, 目的:

1. 将`Object`对象的一些内部方法放到`Reflect`上, 并且未来的新方法都只部署在`Reflect`上.
2. 修改某些`Object`方法的返回结果, 使其更加合理.

```js
// 老写法
try {
    Object.defineProperty(target, property, attributes);
    // success
} catch (e) {
    // failure
}

// 新写法
if (Reflect.defineProperty(target, property, attributes)) {
    // success
} else {
    // failure
}

// 老写法
Function.prototype.apply.call(Math.floor, undefined, [1.75]); // 1

// 新写法
Reflect.apply(Math.floor, undefined, [1.75]); // 1
```

3. 让`Object`操作变成函数行为.

```js
// 老写法
'assign' in Object; // true

// 新写法
Reflect.has(Object, 'assign'); // true
```

4. `Reflect`对象的方法与`Proxy`对象的方法是一一对应的. 这就可以让`Proxy`对象很方便的调用对应的`Reflect`对象, 完成默认行为的修改. 也就是说,不论`Proxy`怎么修改默认行为, 你总可以`Reflect`上获取默认行为.

```js
Proxy(target, {
    set: function(target, name, value, receiver) {
        var success = Reflect.set(target, name, value, receiver);
        if (success) {
            console.log('property ' + name + ' on ' + target + ' set to ' + value);
        }
        return success;
    }
});
```

这部分代码拦截了`set`行为, 然后把`set`赋值给`success`, 返回`success`可以确保完成原有的行为, 然后再部署额外的功能.

### 6.1 静态方法

对 Proxy 对应的十三中静态方法:

```js
Reflect.apply(target, thisArg, args);
Reflect.construct(target, args);
Reflect.get(target, name, receiver);
Reflect.set(target, name, value, receiver);
Reflect.defineProperty(target, name, desc);
Reflect.deleteProperty(target, name);
Reflect.has(target, name);
Reflect.ownKeys(target);
Reflect.isExtensible(target);
Reflect.preventExtensions(target);
Reflect.getOwnPropertyDescriptor(target, name);
Reflect.getPrototypeOf(target);
Reflect.setPrototypeOf(target, prototype);
```

## 7. 实例 2: 使用 Proxy 实现观察者模式

观察者模式指的是函数自动观察数据对象, 一旦对象有变化, 函数就会自动执行.

```js
const queuedObservers = new Set();

const observe = fn => queuedObservers.add(fn);
const observable = obj => new Proxy(obj, { set });

function set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver);
    queuedObservers.forEach(observer => observer());
    return result;
}
```

在这个代码中 先定义了一个`Set`集合, 所有观察者函数都放进这个集合. 然后, `observable`函数返回原始对象的代理, 拦截赋值操作. 拦截函数`set`之中, 会自动执行所有观察者.

这就是一个观察者模式的最简单实现, 即实现`observable`和`observe`这两个函数.

```js
const person = observable({
    name: '张三',
    age: 20
});

function print() {
    console.log(`${person.name}, ${person.age}`);
}

observe(print);
person.name = '李四';
// 输出
// 李四, 20
```
