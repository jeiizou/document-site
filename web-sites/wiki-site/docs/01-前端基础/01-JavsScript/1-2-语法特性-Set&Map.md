# 语法特性-Set&Map


ES6 提供了新的数据结构 Set/Map, 前者用来生成一个没有重复值的数组, Map 则提供了一种值到值的映射关系.

## Set

```js
new Set([iterable]);
```

> Set 接受一个可迭代对象, 将其所有元素不重复的被添加到新的 Set 中, 如不指定此参数或者值为 null, 则 Set 为空

1. 我们通过`set`实例的`size`访问到内容的数量而不是`length`
2. `set`内部的`NaN`等于自身的.
3. 向`set`加入值的时候, 不会发生类型转换.
4. 对象总是不相等的, 即是是两个空对象, 除非是同一个对象(指向同一个内存)

### 属性和方法

set 的实例方法分为两类: 操作和遍历.

操作方法有如下四个:

-   add(value): 添加某个值, 返回 Set 结构本身
-   delete(value): 删除某个值, 返回一个 boolean
-   has(value): 返回一个布尔值, 表示该值是否为`Set`的成员
-   clear(): 清除所有成员, 没有返回值

对比 Object 和 set 在判断属性存在性上写法的区别:

```js
//set
s.add(1)
    .add(2)
    .add(2);
// 注意2被加入了两次

s.size; // 2

s.has(1); // true
s.has(2); // true
s.has(3); // false

s.delete(2);
s.has(2); // false

// 对象的写法
const properties = {
    width: 1,
    height: 1
};

if (properties[someName]) {
    // do something
}

// Set的写法
const properties = new Set();

properties.add('width');
properties.add('height');

if (properties.has(someName)) {
    // do something
}
```

`Array.from`可以将`Set`转为数组.

```js
const items = new Set([1, 2, 3, 4, 5]);
const array = Array.from(items);
```

所以我们可以借助 set 来为数组去重:

```js
function dedupe(array) {
    return Array.from(new Set(array));
}

dedupe([1, 1, 2, 3]); // [1, 2, 3]
```

遍历方法有四个, 可以用于遍历成员:

-   `keys()`: 返回键名的遍历器
-   `values()`: 返回键值的遍历器
-   `entries()`: 返回键值对的遍历器
-   `forEach()`: 使用回调函数遍历每个成员

注意, Set 的遍历顺序就是插入顺序. 这个特性有时非常有用, 比如使用`set`保存一个回调函数的列表, 调用时就能保证按照添加顺序进行调用.

`keys()`, `values()`, `entries()`这三个方法都会返回 set 的遍历对象. 由于 Set 结构没有键名, 所以`keys()`和`values()`方法的行为是完全一致的.

```js
let set = new Set(['red', 'green', 'blue']);

for (let item of set.keys()) {
    console.log(item);
}
// red
// green
// blue

for (let item of set.values()) {
    console.log(item);
}
// red
// green
// blue

for (let item of set.entries()) {
    console.log(item);
}
// ["red", "red"]
// ["green", "green"]
// ["blue", "blue"]
```

### Set 的应用

Set 结构的实例默认可遍历, 所以也可以直接在 set 结构上调用`for of`方法.

```js
let set = new Set(['red', 'green', 'blue']);

for (let x of set) {
    console.log(x);
}
// red
// green
// blue
```

此外, 我们知道`...`扩展元算法内部使用的`for...of`循环, 所以也可以用于`Set`结构.

```js
let arr = [3, 5, 2, 2, 5, 5];
let unique = [...new Set(arr)];
// [3, 5, 2]
```

所以数组的 mao 和 filter 方法也可以用于 Set 了:

```js
let set = new Set([1, 2, 3]);
set = new Set([...set].map(x => x * 2));
// 返回Set结构：{2, 4, 6}

let set = new Set([1, 2, 3, 4, 5]);
set = new Set([...set].filter(x => x % 2 == 0));
// 返回Set结构：{2, 4}
```

使用 Set 可以很方便的实现交并差的运算:

```js
let a = new Set([1, 2, 3]);
let b = new Set([4, 3, 2]);

// 并集
let union = new Set([...a, ...b]);
// Set {1, 2, 3, 4}

// 交集
let intersect = new Set([...a].filter(x => b.has(x)));
// set {2, 3}

// 差集
let difference = new Set([...a].filter(x => !b.has(x)));
// Set {1}
```

在语法的层面上我们没有直接在遍历操作中修改 Set 结构的方法, 不过可变通的实现这样的操作:

```js
// 方法一: 先转为数组再重新转为set
let set = new Set([1, 2, 3]);
set = new Set([...set].map(val => val * 2));
// set的值是2, 4, 6

// 方法二: 使用Array.from
let set = new Set([1, 2, 3]);
set = new Set(Array.from(set, val => val * 2));
// set的值是2, 4, 6
```

### WeakSet

`weakset`是不重复对象的弱引用集合. 类似于 set 的加强版. 主要区别有两个:

1. 成员对象必须为对象
2. 这些对象都是弱引用(如果指向的对象被回收了, 那么集合中的对象也会消失)

基于这两点,`weakset`不适合用来引用, 适合临时存放一组对象, 并且由于成员个数的不确定性, `weakset`是不可遍历的.

```js
const ws = new WeakSet();

const a = [[1, 2], [3, 4]];
const ws = new WeakSet(a);
// WeakSet {[1, 2], [3, 4]}
```

`weakset`接受一个`[Iterable]`对象作为参数. 但不接受非对象组成的 Iterable 作为参数.

`weakset`的方法类似于`set`, 但是没有`size`和一系列的遍历方法:

```js
const ws = new WeakSet();
const obj = {};
const foo = {};

ws.add(window);
ws.add(obj);

ws.has(window); // true
ws.has(foo); // false

ws.delete(window);
ws.has(window); // false

ws.size; // undefined
ws.forEach; // undefined

ws.forEach(function(item) {
    console.log('WeakSet has ' + item);
});
// TypeError: undefined is not a function
```

`weakset`有一个很好的应用场景, 就是保存 DOM 节点, 从而不用担心这些节点从文档移除的时候引发内存泄漏.

## Map

原本的 JS 中, 对象的键只能使用字符串, 这带来了一些限制. Map 对象允许使用对象作为键来创建键值对.

```js
const m = new Map();
const o = { p: 'Hello World' };

m.set(o, 'content');
m.get(o); // "content"

m.has(o); // true
m.delete(o); // true
m.has(o); // false
```

`Map`也能接受一个数组(本质上就是一个具有双元素数组结构 `Iterable` 对象)作为构造参数:

```js
const map = new Map([['name', '张三'], ['title', 'Author']]);

map.size; // 2
map.has('name'); // true
map.get('name'); // "张三"
map.has('title'); // true
map.get('title'); // "Author"
```

其本质上执行的操作如下:

```js
const items = [['name', '张三'], ['title', 'Author']];

const map = new Map();

items.forEach(([key, value]) => map.set(key, value));
```

所以, `set`和`map`本身也是可以用来进行构造 Map 的:

```js
const set = new Set([['foo', 1], ['bar', 2]]);
const m1 = new Map(set);
m1.get('foo'); // 1

const m2 = new Map([['baz', 3]]);
const m3 = new Map(m2);
m3.get('baz'); // 3
```

对于同一个对象的在 Map 中会被看作同一个键.

### 属性和方法

对于 Map 的对象的属性的访问和操作与 set 具有一定的类似性:

```js
const m = new Map();
const o = { p: 'Hello World' };

m.set(o, 'content');
m.get(o); // "content"

m.has(o); // true
m.delete(o); // true
m.has(o); // false
```

同样的, 对于遍历操作, Map 和 set 几乎亦一样的.

```js
const map = new Map([['F', 'no'], ['T', 'yes']]);

for (let key of map.keys()) {
    console.log(key);
}
// "F"
// "T"

for (let value of map.values()) {
    console.log(value);
}
// "no"
// "yes"

for (let item of map.entries()) {
    console.log(item[0], item[1]);
}
// "F" "no"
// "T" "yes"

// 或者
for (let [key, value] of map.entries()) {
    console.log(key, value);
}
// "F" "no"
// "T" "yes"

// 等同于使用map.entries()
for (let [key, value] of map) {
    console.log(key, value);
}
// "F" "no"
// "T" "yes"
```

同样的, 可以使用`...`扩展运算符来转为数组结构:

```js
const map = new Map([
  [1, 'one'],
  [2, 'two'],
  [3, 'three'],
]);

[...map.keys()]
// [1, 2, 3]

[...map.values()]
// ['one', 'two', 'three']

[...map.entries()]
// [[1,'one'], [2, 'two'], [3, 'three']]

[...map]
// [[1,'one'], [2, 'two'], [3, 'three']]
```

### 类型转换

转换数组和对象都相对简单:

```js
//map转数组
const myMap = new Map().set(true, 7).set({ foo: 3 }, ['abc']);
[...myMap];
// [ [ true, 7 ], [ { foo: 3 }, [ 'abc' ] ] ]

//数组转map
new Map([[true, 7], [{ foo: 3 }, ['abc']]]);
// Map {
//   true => 7,
//   Object {foo: 3} => ['abc']
// }

//map转对象: map的键会被转为字符串
function strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
        obj[k] = v;
    }
    return obj;
}

const myMap = new Map().set('yes', true).set('no', false);
strMapToObj(myMap);
// { yes: true, no: false }

//对象转map
function objToStrMap(obj) {
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
        strMap.set(k, obj[k]);
    }
    return strMap;
}

objToStrMap({ yes: true, no: false });
// Map {"yes" => true, "no" => false}
```

在和 JSON 转换的时候, 本质上就是中间使用`JSON.parse`和`JSON.stringify`来县序列化为对象, 在转换为`Map`. 但是对于 Map 的键名是否为字符串的时候需要区分对待:

```js
//字符Map转JSON
function strMapToJson(strMap) {
    return JSON.stringify(strMapToObj(strMap));
}

let myMap = new Map().set('yes', true).set('no', false);
strMapToJson(myMap);
// '{"yes":true,"no":false}'

//Map转数组对象
function mapToArrayJson(map) {
    return JSON.stringify([...map]);
}

let myMap = new Map().set(true, 7).set({ foo: 3 }, ['abc']);
mapToArrayJson(myMap);
// '[[true,7],[{"foo":3},["abc"]]]'

//JSON转字符Map
function jsonToStrMap(jsonStr) {
    return objToStrMap(JSON.parse(jsonStr));
}

jsonToStrMap('{"yes": true, "no": false}');
// Map {'yes' => true, 'no' => false}

//JSON转数组Map
function jsonToMap(jsonStr) {
    return new Map(JSON.parse(jsonStr));
}

jsonToMap('[[true,7],[{"foo":3},["abc"]]]');
// Map {true => 7, Object {foo: 3} => ['abc']}
```

### WeakMap

WeakMap 与 Map 之间的关系就像 WeakSet 与 Set 之间的关系, 他俩的区别在于:

1. Weakmap 只接受对象(除了 NULL)作为键名
2. WeakMap 对对象弱引用.

弱引用在上面解释了. 本质就是不会计入垃圾回收机制. 可以方便的应用在一些可能回造成内存泄漏的情况中

基于同样的理由, WeakMap 可以操作属性, 但是没有便利操作.

此外, 不支持`szie`,`forEach`,`clear`这三个方法. 剩余能用的, 实际上只有这四个:

-   get()
-   set()
-   has()
-   delete()

除了 DOM 节点的场景下我们可以使用 WeakMap, 再部署私有属性的时候也可以使用它:

```js
const _counter = new WeakMap();
const _action = new WeakMap();

class Countdown {
    constructor(counter, action) {
        _counter.set(this, counter);
        _action.set(this, action);
    }
    dec() {
        let counter = _counter.get(this);
        if (counter < 1) return;
        counter--;
        _counter.set(this, counter);
        if (counter === 0) {
            _action.get(this)();
        }
    }
}

const c = new Countdown(2, () => console.log('DONE'));

c.dec();
c.dec();
// DONE
```

这样在实例被删除的时候, 它们就会自动消失了.
