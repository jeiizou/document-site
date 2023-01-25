# 语法特性-ES~ES11特性汇总


## ES7(2016)

### Array.prototype.includes()

判断数组中是否包含一个指定的值.

```js
const arr = [1, 3, 5, 2, '8', NaN, -0]
arr.includes(1) // true
arr.includes(1, 2) // false 该方法的第二个参数表示搜索的起始位置，默认为 0
arr.includes('1') // false
arr.includes(NaN) // true
arr.includes(+0) // true
```

原来的indexOf有两个缺陷:

1. 返回的值是给定元素的第一个索引, 不够直观
2. 内部使用严格相等运算符进行判断, 会导致对NaN的误判

```js
[NaN].indexOf(NaN)// -1
```

还有一种方法是使用`find()`和`findIndex()`. 这两种方法弥补了indexOf方法的不足.

```js
[1, 4, -5, 10].find((n) => n < 0) // -5
[1, 5, 10, 15].findIndex(function(value) {
  return value > 9;
}) // 2
[NaN].findIndex(y => Object.is(NaN, y)) // 0
```

### 求幂运算符: `**`

具有与 Math.pow() 等效的计算结果:

```js
console.log(2**10);// 输出 1024
console.log(Math.pow(2, 10)) // 输出 1024
```

## ES8(2017)

### Async / Await 

是一种语义化更好的异步流程控制:

```js
async function foo () {
  try {
    let response1 = await fetch('https://blog.csdn.net/')
    console.log(response1)
    let response2 = await fetch('https://juejin.im/')
    console.log(response2)
  } catch (err) {
    console.error(err)
  }
}
foo()
```

### Object.values() / Object.entries()

ES5引入了`Object.keys()`方法, 返回一个数组, 成员是参数对象自身的所有可遍历属性的键名. ES8引入了跟`Object.keys`配套的`Object.values`, 作为遍历对象的一个补充手段, 供`for..of`使用. 

`Object.values`方法返回一个数组，成员是参数对象自身的（不含继承的）所有可遍历（enumerable）属性的键值。

```js
const obj = { foo: 'bar', baz: 42 };
Object.values(obj) // ["bar", 42]
const obj = { 100: 'a', 2: 'b', 7: 'c' };
Object.values(obj) // ["b", "c", "a"]
```

需要注意的是: **如果属性名为数值的属性，是按照数值大小，从小到大遍历的**.

Object.entries() 方法返回一个数组，成员是参数对象自身的（不含继承的）所有可遍历（enumerable）属性的键值对数组。

```js
const obj = { foo: 'bar', baz: 42 };
Object.entries(obj) // [ ["foo", "bar"], ["baz", 42] ]
const obj = { 10: 'xxx', 1: 'yyy', 3: 'zzz' };
Object.entries(obj); // [['1', 'yyy'], ['3', 'zzz'], ['10': 'xxx']]
```

### String padding

ES8新增了两个实例函数`String.prototype.padStart`和`String.prototype.padEnd`, 允许将空字符串或者其他字符串添加到原始字符串的开头或者结尾.

```js
String.padStart(targetLength,[padString])
```

- targetLength(必填): 当前字符串需要填充到的目标长度. 如果这个数值小于当前字符串的长度, 则返回当前字符串本身
- padString(可选): 填充字符串, 如果字符串太长, 使填充后的字符串长度超过了目标长度, 则只保留最左侧的部分, 其他部分会被节点, 缺省值为`" "`. 

`padEnd`类似:

```js
'x'.padStart(4, 'ab') // 'abax'
'x'.padEnd(5, 'ab') // 'xabab'
```

处理日期或者金额的格式化的时候, 这个特性会派上用场:

```js
'12'.padStart(10, 'YYYY-MM-DD') // "YYYY-MM-12"
'09-12'.padStart(10, 'YYYY-MM-DD') // "YYYY-09-12"
```

### Object.getOwnPropertyDescriptors()

ES5的`Object.getOwnPropertyDescriptor()`会返回某个对象属性的描述对象(descriptor). ES8引入了`Object.getOwnPropertyDescriptors()`方法, 返回指定对象的所有自身属性的描述对象. 主要是为了解决`Object.assign()`无法正确拷贝`get/set`属性的问题. 

**Object.assign 方法总是拷贝一个属性的值，而不会拷贝它背后的赋值方法或取值方法。**

两者配合才能正确拷贝对象属性:

```js
const source = {
  set foo (value) {
    console.log(value)
  },
  get bar () {
    return '浪里行舟'
  }
}
const target2 = {}
Object.defineProperties(target2, Object.getOwnPropertyDescriptors(source))
console.log(Object.getOwnPropertyDescriptor(target2, 'foo'))
```

## ES9(2018)

### for await of

`for of`方法能够遍历具有`Symbol.iterator`接口的同步迭代器数据, 但是不能遍历异步迭代器. ES9新增的`for await of`可以用来比那里具有`Symbol.asyncLterator`方法的数据结构, 也就是异步迭代器, 且会等待前一个成员的状态改变后才会遍历到下一个成员, 相当于async函数内部的await.

```js
function Gen (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(time)
    }, time)
  })
}
async function test () {
  let arr = [Gen(2000), Gen(100), Gen(3000)]
  for await (let item of arr) {
    console.log(Date.now(), item)
  }
}
test()
// 1575536194608 2000
// 1575536194608 100
// 1575536195608 3000
```

使用 for await of 遍历时，会等待前一个 Promise 对象的状态改变后，再遍历到下一个成员。

### Object Rest Spread

ES6中添加了解构操作符:

```js
const arr1 = [10, 20, 30];
const copy = [...arr1]; // 复制
console.log(copy); // [10, 20, 30]
const arr2 = [40, 50];
const merge = [...arr1, ...arr2]; // 合并
console.log(merge); // [10, 20, 30, 40, 50]
console.log(Math.max(...arr)); // 30 拆解
```

ES9通过向对象文本添加扩展经一部扩展了这种语法:

```js
const input = {
  a: 1,
  b: 2,
  c: 1
}
const output = {
  ...input,
  c: 3
}
```

如果存在相同的属性, 只有最后一个会生效.

注意这里的拷贝是一种浅拷贝:

```js
onst input = {
  a: 1,
  b: 2
}
const output = {
  ...input,
  c: 3
}
input.a= 3
console.log(input,output) // {a: 3, b: 2} {a: 1, b: 2, c: 3}
```

以及object rest:

```js
const input = {
  a: 1,
  b: 2,
  c: 3
}
let { a, ...rest } = input
console.log(a, rest) // 1 {b: 2, c: 3}
```

注意，**rest 属性必须始终出现在对象的末尾**

### Promise.prototype.finally()

Promise.prototype.finally() 方法返回一个`Promise`，在`promise`执行结束时，无论结果是`fulfilled`或者是`rejected`，在执行`then()`和`catch()`后，都会执行`finally` 指定的回调函数。

```js
fetch('https://www.google.com')
  .then((response) => {
    console.log(response.status);
  })
  .catch((error) => {
    console.log(error);
  })
  .finally(() => {
    document.querySelector('#spinner').style.display = 'none';
  });
```

### 新的正则表达式特性

- s (dotAll) 标志
- 命名捕获组
- Lookbehind 后行断言
- Unicode 属性转义

#### s(dotAll)标志

在正则中`.`是一个特殊字符, 表示任意的单个字符, 但是有两个例外, 一个是四个字节的UTF-16字符, 这个可以用u修饰符解决, 另一个是行终止符, 例如换行符`\n`或者回车符`\r`, 这个可以通过ES9的`s(dotAll)flag`解决:

```js
console.log(/foo.bar/.test('foo\nbar')) // false
console.log(/foo.bar/s.test('foo\nbar')) // true
```

判断当前正则是否用了dotAll模式:

```js
const re = /foo.bar/s // Or, `const re = new RegExp('foo.bar', 's');`.
console.log(re.test('foo\nbar')) // true
console.log(re.dotAll) // true
console.log(re.flags) // 's'
```

#### 命名捕获组

在一些正则模式中, 使用数字进行匹配可能会令人混淆. 比如下面这个例子:

```js
const re = /(\d{4})-(\d{2})-(\d{2})/;
const match= re.exec('2019-01-01');
console.log(match[0]); // → 2019-01-01
console.log(match[1]); // → 2019
console.log(match[2]); // → 01
console.log(match[3]); // → 01
```

ES9 引入了命名捕获组, 可以为每一个组指定一个名字, 既便于阅读代码, 又便于引用.

```js
const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = re.exec('2019-01-01');
console.log(match.groups); // → {year: "2019", month: "01", day: "01"}
console.log(match.groups.year); // → 2019
console.log(match.groups.month); // → 01
console.log(match.groups.day); // → 01
```

命名捕获组在圆括号内部, 模式的头部添加`?<groupName>`作为命名.

甚至可以用在replace方法中:

```js
const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
const usDate = '2018-04-30'.replace(re, '$<month>-$<day>-$<year>')
console.log(usDate) // 04-30-2018
```

#### Lookbehind 后行断言

Js的正则表达式只支持先行断言, 不支持后行断言. 先行断言我们可以简单的理解为"先遇到一个条件, 在判断后面是否满足", 例如:

```js
let test = 'hello world'
console.log(test.match(/hello(?=\sworld)/))
// ["hello", index: 0, input: "hello world", groups: undefined]
```

但我们有时候想要判断workd前面是否为hello, 这个代码是实现不了的, ES9开始支持这种模式:

```js
let test = 'world hello'
console.log(test.match(/(?<=world\s)hello/))
// ["hello", index: 6, input: "world hello", groups: undefined]
```

**`(?<…)`是后行断言的符号，`(?..)`是先行断言的符号**, 然后结合`=(等于)`, `!(不等)`, `\1(捕获匹配)`. 

#### Unicode 属性转义

ES9引入了一种新的类的写法`\p{...}`和`\P{...}`, 允许正则表达式匹配符合Unicode 某种属性的所有字符. 比如你可以使用`\p{Number}`来匹配所有的Unicode数字, 比如你想要匹配Unicode字符㉛字符串: 

```js
const str = '㉛';
console.log(/\d/u.test(str)); // → false
console.log(/\p{Number}/u.test(str)); // → true
```

可以使用`\p{Alphabetic}`来匹配所有的 Unicode 单词字符:

```js
const str = ' ';
console.log(/\p{Alphabetic}/u.test(str)); // → true
// the \w shorthand cannot match  
console.log(/\w/u.test(str)); // → false
```

同样有一个负向的Unicode属性转义模板: `\P{...}`:

```js
console.log(/\P{Number}/u.test('㉛')); // → false
console.log(/\P{Number}/u.test(' ')); // → true
console.log(/\P{Alphabetic}/u.test('㉛')); // → true
console.log(/\P{Alphabetic}/u.test(' ')); // → false
```

## ES10(2019)

### Array.prototype.flat()

多维数组的深度降低:

```js
const numbers1 = [1, 2, [3, 4, [5, 6]]]
console.log(numbers1.flat())// [1, 2, 3, 4, [5, 6]]
const numbers2 = [1, 2, [3, 4, [5, 6]]]
console.log(numbers2.flat(2))// [1, 2, 3, 4, 5, 6]
```

默认降低1.

### Array.prototype.flatMap()

降低map的层级:

```js
let arr = [1, 2, 3]
console.log(arr.map(item => [item * 2]).flat()) // [2, 4, 6]
console.log(arr.flatMap(item => [item * 2])) // [2, 4, 6]
```

实际上就是综合了map和flap的操作.

### Object.fromEntries()

与`Object.entries`相反的操作. 是的根据对象的`entries`很容易得到`object`.

```js
const object = { x: 23, y:24 };
const entries = Object.entries(object); // [['x', 23], ['y', 24]]
const result = Object.fromEntries(entries); // { x: 23, y: 24 }
```

### String.trimStart 和 String.trimEnd

移除开头和结尾的空格.

```js
let str = ' 前端工匠 '
console.log(str.length) // 6
str = str.trimStart()
console.log(str.length) // 5
let str1 = str.trim() // 清除前后的空格
console.log(str1.length) // 4
str.replace(/^\s+/g, '') // 也可以用正则实现开头删除空格


let str = ' 浪里行舟 '
console.log(str.length) // 6
str = str.trimEnd()
console.log(str.length) // 5
let str1 = str.trim() // 清除前后的空格
console.log(str1.length) // 4
str.replace(/\s+$/g, '') // 也可以用正则实现右端移除空白字符
```

### String.prototype.matchAll

一次性的去除所有匹配:

```js
function collectGroup1 (regExp, str) {
  let results = []
  for (const match of str.matchAll(regExp)) {
    results.push(match[1])
  }
  return results
}
console.log(collectGroup1(/"([^"]*)"/g, `"foo" and "bar" and "baz"`))
// ["foo", "bar", "baz"]
```

### try-catch

在ES10中, try-catch语句中的参数变为了一个可选项.

```js
// ES10
try {
  console.log('Foobar')
} catch {
  console.error('Bar')
}
```

### BigInt

原来的js中, 所有的数字都保存为64位的浮点数, 这带来了两个限制:

1. 数值的精度只能到53个二进制位, 大于这个范围的整数, js无法精确表示
2. 大于或者等于2的1024次方的数值, js无法表示, 会返回Infinity.

```js
// 超过 53 个二进制位的数值，无法保持精度
Math.pow(2, 53) === Math.pow(2, 53) + 1 // true
// 超过 2 的 1024 次方的数值，无法表示
Math.pow(2, 1024) // Infinity
```

BigInt 只用来表示整数，没有位数的限制，任何位数的整数都可以精确表示.

```js
const aNumber = 111;
const aBigInt = BigInt(aNumber);
aBigInt === 111n // true
typeof aBigInt === 'bigint' // true
typeof 111 // "number"
typeof 111n // "bigint"
```

### Symbol.prototype.description

`Symbol`的描述只被存储在内部的`[[Description]]`，没有直接对外暴露，我们只有调用`Symbol`的`toString()`时才可以读取这个属性, 现在则可以直接通过`description`读取了:

```js
Symbol('desc').description; // "desc"
Symbol('').description; // ""
Symbol().description; // undefined
```

### Function.prototype.toString()

ES2019 中，Function.toString() 发生了变化。之前执行这个方法时，得到的字符串是去空白符号的。而现在，得到的字符串呈现出原本源码的样子:

```js
function sum(a, b) {
  return a + b;
}
console.log(sum.toString());
// function sum(a, b) {
// return a + b;
// }
```

## ES11(2020)

### 私有变量

只需要在变量前面添加`#`即可. 

```js
class Hero {
    #aggressivity = 0
    constructor (aggressivity){
      this.#aggressivity = aggressivity
    }
    getHurt(){
      return this.#aggressivity
    }
    setAggressivity(aggressivity){
      this.#aggressivity = aggressivity
    }
}

const shooter = new Hero(100)
let hurt = shooter.getHurt()
console.log(hurt) //100
console.log(shooter.#aggressivity) //Error : Uncaught SyntaxError: Private field '#aggressivity' must be declared in an enclosing class
```

### Promise.allSettled

Promise.all: 可以将多个Promise实例包装成一个新的Promise实例, 当所有Promise实例resolve了再回resolve, 否则reject.

使用`Promise.allSetted`会创建一个新的`prmise`, 在所有Promise完成后返回一个包含每个`promise`结果的数组:

```js
const promises = [
    Promise.reject('c'),
    Promise.resolve('a'),
    Promise.resolve('b'),
];
Promise.allSettled(promises).then(res =>{
 console.log(res)
})
// 打印结果
// [{"status":"rejected","reason":"c"},
// {"status":"fulfilled","value":"a"},
// {"status":"fulfilled","value":"b"}]
```

### ??: 空位合并运算符

新增一个逻辑运算符??，处理null和undefined，工作原理与逻辑or（ || ）类似，但是与此相反.

```js
0 || 5 // return 5
"" || 5 // return 5
"asasd" || 'V5' //return "asasd"

0 ?? 5 //return 0
"" ?? 5 //return ""
null ?? 5 // return 5
undefined ?? 5 // return 5
false ?? 5 //return false
NaN ?? 5 // return NaN
```

注意: 不可与其他运算符组合使用，例如&&、||, 如果要使用必须用括号包裹

```js
"空位合并" || undefined ?? "Sneaker" //Uncaught SyntaxError: Unexpected token '??'
"空位合并" && undefined ?? "Sneaker" //Uncaught SyntaxError: Unexpected token '??'

("空位合并" || undefined) ?? "(๑•̀ㅂ•́) ✧" //"空位合并"
("空位合并" && null) ?? "一起学习" //"一起学习"
```

### `?.`: 可选链运算符

```js
const obj = {
  foo: {
    bar: {
      baz: 42,
    },
}

console.log(obj?.foo?.bar?.baz) //42
console.log(obj.foo.bar?.baz) //42 },
```

### 动态导入

```js
//通用导入方式
import("/module/sneaker/test.js")
.then(module => {
 //模块相关操作
})

//await
const getModule = await import("/module/sneaker/test.js")

//通过async await
const getUserInfo = async (hasLogin) => {
 if(!hasLogin){
  const user = await import("/module/sneaker/user.js")
    user.getInfo()
 }
}
```

### globalThis

目的是提供一个统一的全局访问对象.

```js
const globalObj = (()=>{
 if(self) return self
  if(window) return window
  if(global) return global
  throw new Error('Sorry!No global obj found')
})

//Browser 
globalThis === window //true

//Webworker
globalThis === self //true

//Node
globalThis === global //true
```

### 导入特定命名空间

```js
export * as ns from './module

//等同于
import * as ns from './module'
export {ns}
```

导入特定命名空间实际上是对模块进行转发. 

