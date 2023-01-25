# 语法特性-Symbol


Symbol 是 ES6 中新增加的一种基础类型, 可以创建一个独一无二的值.

```js
// 没有参数的情况
let s1 = Symbol();
let s2 = Symbol();

s1 === s2; // false

// 有参数的情况
let s1 = Symbol('foo');
let s2 = Symbol('foo');

s1 === s2; // false
```

symbol 不能与其他基础类型进行运算, 因为它不能进行隐式的类型转换. 但是可以调用`toString`方法进行显示的类型转换, 以及使用`!`运算符转换为布尔值.

```js
let sym = Symbol('My symbol');

String(sym); // 'Symbol(My symbol)'
sym.toString(); // 'Symbol(My symbol)'

let sym = Symbol();
Boolean(sym); // true
!sym; // false

if (sym) {
    // ...
}

Number(sym); // TypeError
sym + 2; // TypeError
```

## 1. description

在创建 `Symbol` 的时候, 可以添加一个描述, 通过`description`方法可以简单的调用这个描述:

```js
const sym = Symbol('foo');

String(sym); // "Symbol(foo)"
sym.toString(); // "Symbol(foo)"

sym.description; // "foo"
```

## 2. Symbol 作为属性名

由于每一个`Symbol`值都是不相等, 所以作为对象的属性名, 可以保证不会出现同名的属性, 可以防止键值被改写或覆盖:

```js
let mySymbol = Symbol();

// 第一种写法
let a = {};
a[mySymbol] = 'Hello!';

// 第二种写法
let a = {
    [mySymbol]: 'Hello!'
};

// 第三种写法
let a = {};
Object.defineProperty(a, mySymbol, { value: 'Hello!' });

// 以上写法都得到同样结果
a[mySymbol]; // "Hello!"
```

但是当`symbol`作为属性名的时候我们无法通过`.`运算符来访问对象属性.

同理在对象的内部, Symbol 值必须放在方括号之中:

```js
let s = Symbol();

let obj = {
  [s](arg) { ... }
};

obj[s](123);
```

## 3. Symbol.for(), Symbol.keyFor()

`Symbol.for`可以接受一个字符串, 然后搜索是否有该参数作为名称的 Symbol, 如果有, 就返回这个`Symbol`值, 否则就新建并返回一个一该字符串为名称的 Symbol 值:

```js
let s1 = Symbol.for('foo');
let s2 = Symbol.for('foo');

s1 === s2; // true
```

`Symbol.for()`与`Symbol()`这两种写法, 都会生成新的 Symbol. 其区别在于前者会被登记在全局环境中供搜索, 后者不会.

`Symbol.keyFor()`方法返回一个已登记的`Symbol`类型值的`key`:

```js
let s1 = Symbol.for('foo');
Symbol.keyFor(s1); // "foo"

let s2 = Symbol('foo');
Symbol.keyFor(s2); // undefined
```

`Symbol.for`注册的值是全局环境的, 可以在不同的 iframe 或 service worker 中取到同一个值:

```js
iframe = document.createElement('iframe');
iframe.src = String(window.location);
document.body.appendChild(iframe);

iframe.contentWindow.Symbol.for('foo') === Symbol.for('foo');
// true
```

## 4. Symbol 应用: 消除魔术字符串

魔术字符串值的是, 在代码之中多次出现, 与代码形成强耦合的某一个具体的字符串或者数值. 风格良好的代码, 应该是尽量消除魔术字符串, 改有含义清晰的变量代替:

```js
function getArea(shape, options) {
    let area = 0;

    switch (shape) {
        case 'Triangle': // 魔术字符串
            area = 0.5 * options.width * options.height;
            break;
        /* ... more code ... */
    }

    return area;
}

getArea('Triangle', { width: 100, height: 100 }); // 魔术字符串
```

我们可以把其中的`Triangle`提升为一个变量, 并且可以把个变量设置为 Symbol(因为变量本身是什么没有意义):

```js
const shapeType = {
    triangle: Symbol()
};

function getArea(shape, options) {
    let area = 0;
    switch (shape) {
        case shapeType.triangle:
            area = 0.5 * options.width * options.height;
            break;
    }
    return area;
}

getArea(shapeType.triangle, { width: 100, height: 100 });
```

不过, Symbol 作为属性名不会被枚举, 这意味着不会再`for...in`, `for...of`循环中, `Obejct.keys`,`Object.getOwnPropertyNames`,`JSON.stringify`中出现, 但是可以通过`Obejct.getOwnPropertySymbols`可以获取指定对象的 SYmbol 属性名.

`Object.getOwnPropertySymbols`方法返回一个数组, 成员是当前对象的所有用作属性名的 Symbol 值:

```js
const obj = {};
let a = Symbol('a');
let b = Symbol('b');

obj[a] = 'Hello';
obj[b] = 'World';

const objectSymbols = Object.getOwnPropertySymbols(obj);

objectSymbols;
// [Symbol(a), Symbol(b)]
```

此外, 使用`Reflect.ownKeys`方法可以返回所有类型的键名, 包括常规键名和 Symbol 键名:

```js
let obj = {
    [Symbol('my_key')]: 1,
    enum: 2,
    nonEnum: 3
};

Reflect.ownKeys(obj);
//  ["enum", "nonEnum", Symbol(my_key)]
```

利用这个特性可以用`Symbol`来定义一些非私有, 但是又希望只用于内部的方法.

```js
let size = Symbol('size');

class Collection {
    constructor() {
        this[size] = 0;
    }

    add(item) {
        this[this[size]] = item;
        this[size]++;
    }

    static sizeOf(instance) {
        return instance[size];
    }
}

let x = new Collection();
Collection.sizeOf(x); // 0

x.add('foo');
Collection.sizeOf(x); // 1

Object.keys(x); // ['0']
Object.getOwnPropertyNames(x); // ['0']
Object.getOwnPropertySymbols(x); // [Symbol(size)]
```

## 5. Symbol 应用: 模块的 Singleton 模型

Singleton, 即我们说的单例模式, 是一种在编程中应用很广泛的设计模式. 使用 Symbol 可以帮助我们更好的使用这种模式:

```js
const FOO_KEY = Symbol.for('foo');

function A() {
    this.foo = 'hello';
}

if (!global[FOO_KEY]) {
    global[FOO_KEY] = new A();
}

module.exports = global[FOO_KEY];
```

这个模块可以保证在调用该模块的时候, 每次返回的都是同一个实例, 并且`global[FOO_KEY]`不会被无意间覆盖, 但是该是可以进行改写的, 改写方式如下:

```js
global[Symbol.for('foo')] = { foo: 'world' };

const a = require('./mod.js');
```

如果使用`Symbol`来代替`Symbol.for()`, 则外部就无法改写这个值了.

## 6. Symbol 内置值

### 6.1 Symbol.hasInstance

对象的`Symbol.hasInstance`属性, 指向一个内部方法. 当其他对象使用`instanceof`运算符, 判断是否为该对象的实例是, 会调用该方法, 比如`foo instanceof Foo`实际调用的是`Foo[Symbol.hasInstance](foo)`:

```js
class MyClass {
    [Symbol.hasInstance](foo) {
        return foo instanceof Array;
    }
}

[1, 2, 3] instanceof new MyClass(); // true
```

### 6.2 Symbol.isConcatSpreadable

对象的`Symbol.isConcatSpreadable`为一个 boolean, 表示在用于`Array.prototype.concat()`时是否能展开.

```js
let arr1 = ['c', 'd'];
['a', 'b'].concat(arr1, 'e'); // ['a', 'b', 'c', 'd', 'e']
arr1[Symbol.isConcatSpreadable]; // undefined

let arr2 = ['c', 'd'];
arr2[Symbol.isConcatSpreadable] = false;
['a', 'b'].concat(arr2, 'e'); // ['a', 'b', ['c','d'], 'e']
```

对于数组, 它是默认展开的, 对于类似数组的对象, 则正好相反, 它默认是不展开的.

```js
let obj = { length: 2, 0: 'c', 1: 'd' };
['a', 'b'].concat(obj, 'e'); // ['a', 'b', obj, 'e']

obj[Symbol.isConcatSpreadable] = true;
['a', 'b'].concat(obj, 'e'); // ['a', 'b', 'c', 'd', 'e']
```

该属性可以定义在类的内部:

```js
//定义在实例上
class A1 extends Array {
    constructor(args) {
        super(args);
        this[Symbol.isConcatSpreadable] = true;
    }
}
//定义在类本身
class A2 extends Array {
    constructor(args) {
        super(args);
    }
    get [Symbol.isConcatSpreadable]() {
        return false;
    }
}
let a1 = new A1();
a1[0] = 3;
a1[1] = 4;
let a2 = new A2();
a2[0] = 5;
a2[1] = 6;
[1, 2].concat(a1).concat(a2);
// [1, 2, 3, 4, [5, 6]]
```

### 6.3 Symbol.species

对象的`Symbol.species`属性，指向一个构造函数。创建衍生对象时，会使用该属性。

```js
class MyArray extends Array {}

const a = new MyArray(1, 2, 3);
const b = a.map(x => x);
const c = a.filter(x => x > 1);

b instanceof MyArray; // true
c instanceof MyArray; // true
```

使用`Symbol.species`可以定义创建实例的时候调用的构造函数:

```js
class MyArray extends Array {
    static get [Symbol.species]() {
        return Array;
    }
}

const a = new MyArray();
const b = a.map(x => x);

b instanceof MyArray; // false
b instanceof Array; // true
```

### 6.4 Symbol.match

对象`Symbol.match`属性, 指向一个函数, 当执行`str.match(myobject)`时, 如果属性存在, 会调用, 返回该方法的返回值.

```js
String.prototype.match(regexp);
// 等同于
regexp[Symbol.match](this);

class MyMatcher {
    [Symbol.match](string) {
        return 'hello world'.indexOf(string);
    }
}

'e'.match(new MyMatcher()); // 1
```

### 6.5 Symbol.replace

```js
const x = {};
x[Symbol.replace] = (...s) => console.log(s);

'Hello'.replace(x, 'World'); // ["Hello", "World"]
```

### 6.6 Symbol.search

```js
String.prototype.search(regexp);
// 等同于
regexp[Symbol.search](this);

class MySearch {
    constructor(value) {
        this.value = value;
    }
    [Symbol.search](string) {
        return string.indexOf(this.value);
    }
}
'foobar'.search(new MySearch('foo')); // 0
```

### 6.7 Symbol.split

```js
String.prototype.split(separator, limit);
// 等同于
separator[Symbol.split](this, limit);

class MySplitter {
    constructor(value) {
        this.value = value;
    }
    [Symbol.split](string) {
        let index = string.indexOf(this.value);
        if (index === -1) {
            return string;
        }
        return [string.substr(0, index), string.substr(index + this.value.length)];
    }
}

'foobar'.split(new MySplitter('foo'));
// ['', 'bar']

'foobar'.split(new MySplitter('bar'));
// ['foo', '']

'foobar'.split(new MySplitter('baz'));
// 'foobar'
```

### 6.8 Symbol.iterator

对象的`Symbol.iterator`属性，指向该对象的默认遍历器方法。

```js
const myIterable = {};
myIterable[Symbol.iterator] = function*() {
    yield 1;
    yield 2;
    yield 3;
};

[...myIterable]; // [1, 2, 3]
```

### 6.9 Symbol.toPrimitive

对象的`Symbol.toPrimitive`属性，指向一个方法。该对象被转为原始类型的值时，会调用这个方法，返回该对象对应的原始类型值。

```js
let obj = {
    [Symbol.toPrimitive](hint) {
        switch (hint) {
            case 'number':
                return 123;
            case 'string':
                return 'str';
            case 'default':
                return 'default';
            default:
                throw new Error();
        }
    }
};

2 * obj; // 246
3 + obj; // '3default'
obj == 'default'; // true
String(obj); // 'str'
```

### 6.10 Symbol.toStringTag

对象的`Symbol.toStringTag`属性，指向一个方法。在该对象上面调用`Object.prototype.toStrin`g 方法时，如果这个属性存在，它的返回值会出现在`toString`方法返回的字符串之中，表示对象的类型。也就是说，这个属性可以用来定制`[object Object]`或`[object Array]`中`object`后面的那个字符串。

```js
// 例一
({ [Symbol.toStringTag]: 'Foo' }.toString());
// "[object Foo]"

// 例二
class Collection {
    get [Symbol.toStringTag]() {
        return 'xxx';
    }
}
let x = new Collection();
Object.prototype.toString.call(x); // "[object xxx]"
```

### 6.11 Symbol.unscopables

对象的`Symbol.unscopables`属性，指向一个对象。该对象指定了使用 with 关键字时，哪些属性会被 with 环境排除。
