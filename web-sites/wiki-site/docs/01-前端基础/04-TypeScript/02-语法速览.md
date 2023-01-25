# TS-语法速览


## 基础类型

### Boolean

逻辑类型

```ts
let isDone: boolean = false;
```

### Number

数字类型

```ts
let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;
let big: bigint = 100n;
```

### String

字符串类型

```ts
let color: string = "blue";
```

### Array

数组

```ts
let list: number[] = [1, 2, 3];
```

### Tuple

元组: 元素类型不同的数组

```ts
let x: [string, number];
x = ["hello", 10]; 
```

### Enum

枚举

```ts
enum Color {
  Red = 1,
  Green = 2,
  Blue = 4,
}
let c: Color = Color.Green;
```

### Unknown

专用来表示未知的类型, 该数据可以是任何类型

```ts
let notSure: unknown = 4;
notSure = "maybe a string instead";

// OK, definitely a boolean
notSure = false;
```

`unknown`只能赋值给`any`和`unknown`

### Any

表示任意的类型的变量, 表示一些我们不希望进行类型检查的变量, 比如第三方的库

```ts
declare function getValue(key: string): any;
// OK, return value of 'getValue' is not checked
const str: string = getValue("myString");
```

### Void

表示无类型, 比如函数的返回

```ts
function warnUser(): void {
  console.log("This is my warning message");
}
```

### Null / Undefined

```ts
let u: undefined = undefined;
let n: null = null;
```

### Nerver

对于永远不会出现的类型, 比如函数一定会抛出一个异常的时候, 就是`never`类型:

```ts
function error(message: string): never {
  throw new Error(message);
}
```

### Object

对于非以上基本类型的类型, 就是`obejct`

#### Object / object / {}

- `Object`: 一个包含了js原始所有原始方法的对象
- `{}`: 一个无键值的空对象
- `object`: 非基本类型的类型

## 接口

结构类型的定义方式:

```ts
interface LabeledValue {
  label: string;
}
```

### 可选属性

```ts
interface SquareConfig {
  color?: string;
  width?: number;
}
```

### 只读属性

```ts
interface Point {
  readonly x: number;
  readonly y: number;
}
```

### 剩余参数

```ts
interface SquareConfig {
  color?: string;
  width?: number;
  [propName: string]: any;
}
```

### 函数接口

```ts
interface SearchFunc {
  (source: string, subString: string): boolean;
}
```

### 索引类型

```ts
interface StringArray {
  [index: number]: string;
}

let myArray: StringArray;
myArray = ["Bob", "Fred"];
```

### 对象接口

```ts
interface ClockInterface {
  currentTime: Date;
}

class Clock implements ClockInterface {
  currentTime: Date = new Date();
  constructor(h: number, m: number) {}
}
```

### 接口继承

```ts
interface Shape {
  color: string;
}

interface Square extends Shape {
  sideLength: number;
}
```

多继承:

```ts
interface Square extends Shape, PenStroke {
  sideLength: number;
}
```

### 混合类型

```ts
interface Counter {
  (start: number): string;
  interval: number;
  reset(): void;
}
```

### 接口继承对象

```ts
class Control {
  private state: any;
}

// 扩展了类的申明
interface SelectableControl extends Control {
  select(): void;
}

class Button extends Control implements SelectableControl {
  select() {}
}

class TextBox extends Control {
  select() {}
}

class ImageControl implements SelectableControl {
  // 这里的私有属性只能有Control的子类实现, 因此这里会报错
  // 如果把state改成可选, 这里也一样会报错, 需要同时把state声明删除
  private state: any;
  select() {}
}
```

## 函数

函数类型的声明

```ts
function add(x: number, y: number): number {
  return x + y;
}

let myAdd = function (x: number, y: number): number {
  return x + y;
};
```

### 可选/默认参数

可选参数:

```ts
function buildName(firstName: string, lastName?: string) {
  if (lastName) return firstName + " " + lastName;
  else return firstName;
}
```

默认参数:

```ts
function buildName(firstName: string, lastName = "Smith") {
  return firstName + " " + lastName;
}
```

### 剩余参数

```ts
function buildName(firstName: string, ...restOfName: string[]) {
  return firstName + " " + restOfName.join(" ");
}
```

### 函数重载

```ts
function pickCard(x: { suit: string; card: number }[]): number;
function pickCard(x: number): { suit: string; card: number };
function pickCard(x: any): any {
  // Check to see if we're working with an object/array
  // if so, they gave us the deck and we'll pick the card
  if (typeof x == "object") {
    let pickedCard = Math.floor(Math.random() * x.length);
    return pickedCard;
  }
  // Otherwise just let them pick the card
  else if (typeof x == "number") {
    let pickedSuit = Math.floor(x / 13);
    return { suit: suits[pickedSuit], card: x % 13 };
  }
}
```

## Literal(可遍历) 类型

`ts`中有三种可遍历类型: `string`, `numbers`, `booleans`.

### 字符串可遍历

```ts
type Easing = "ease-in" | "ease-out" | "ease-in-out";

class UIElement {
  animate(dx: number, dy: number, easing: Easing) {
    if (easing === "ease-in") {
      // ...
    } else if (easing === "ease-out") {
    } else if (easing === "ease-in-out") {
    } else {
      // It's possible that someone could reach this
      // by ignoring your types though.
    }
  }
}
```

### 数字可遍历

```ts
function rollDice(): 1 | 2 | 3 | 4 | 5 | 6 {
  return (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
}

const result = rollDice();Try
```

### 逻辑可遍历

```ts
interface ValidationSuccess {
  isValid: true;
  reason: null;
}

interface ValidationFailure {
  isValid: false;
  reason: string;
}

type ValidationResult = ValidationSuccess | ValidationFailure;
```

## 类型联合 / 交叉

### 类型联合

```ts
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

declare function getSmallPet(): Fish | Bird;

let pet = getSmallPet();
pet.layEggs();
```

使用`|`获取两个类型的交集形成一个新的类型. 

### 类型交叉

```ts
interface ErrorHandling {
  success: boolean;
  error?: { message: string };
}

interface ArtworksData {
  artworks: { title: string }[];
}

interface ArtistsData {
  artists: { name: string }[];
}

// These interfaces are composed to have
// consistent error handling, and their own data.

type ArtworksResponse = ArtworksData & ErrorHandling;
type ArtistsResponse = ArtistsData & ErrorHandling;
```

使用`&`获取两个类型之间的并集

## 类

```ts
class Greeter {
  greeting: string;

  constructor(message: string) {
    this.greeting = message;
  }

  greet() {
    return "Hello, " + this.greeting;
  }
}

let greeter = new Greeter("world");
```

### 类的继承

```ts
class Animal {
  move(distanceInMeters: number = 0) {
    console.log(`Animal moved ${distanceInMeters}m.`);
  }
}

class Dog extends Animal {
  bark() {
    console.log("Woof! Woof!");
  }
}

const dog = new Dog();
dog.bark();
dog.move(10);
dog.bark();
```

### 公有/私有/保护

```ts
class Animal {
  public name: string;

  public constructor(theName: string) {
    this.name = theName;
  }

  public move(distanceInMeters: number) {
    console.log(`${this.name} moved ${distanceInMeters}m.`);
  }
}
```

对于私有变量, 有两种写法: 一种是使用`private`关键字, 或者ecma的`#`关键字:

```ts
// private
class Animal {
  public name: string;

  public constructor(theName: string) {
    this.name = theName;
  }

  public move(distanceInMeters: number) {
    console.log(`${this.name} moved ${distanceInMeters}m.`);
  }
}

// ECMA
class Animal {
  #name: string;
  constructor(theName: string) {
    this.#name = theName;
  }
}
```

对于`protected`: 收到保护的属性只能允许类本身或者类的子类访问

```ts
class Person {
  protected name: string;
  constructor(name: string) {
    this.name = name;
  }
}
```

### readonly

```ts
class Octopus {
  readonly name: string;
  readonly numberOfLegs: number = 8;

  constructor(theName: string) {
    this.name = theName;
  }
}
```


readonly属性必须初始化或者声明的时候赋值

### 参数属性

```ts
class Octopus {
  readonly numberOfLegs: number = 8;
  constructor(readonly name: string) {}
}
```

### 访问控制

```ts
class Employee {
  private _fullName: string = "";

  get fullName(): string {
    return this._fullName;
  }

  set fullName(newName: string) {
    if (newName && newName.length > fullNameMaxLength) {
      throw new Error("fullName has a max length of " + fullNameMaxLength);
    }

    this._fullName = newName;
  }
}
```

### 静态属性

```ts
class Grid {
  static origin = { x: 0, y: 0 };

  calculateDistanceFromOrigin(point: { x: number; y: number }) {
    let xDist = point.x - Grid.origin.x;
    let yDist = point.y - Grid.origin.y;
    return Math.sqrt(xDist * xDist + yDist * yDist) / this.scale;
  }

  constructor(public scale: number) {}
}
```

### 抽象类

```ts
abstract class Animal {
  abstract makeSound(): void;

  move(): void {
    console.log("roaming the earth...");
  }
}
```

## 枚举

枚举的成员一般被看做常量

### 数字枚举

```ts
enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}
```

这里的`down`会被自动赋值`2`, 以此类推.

默认会从`0`开始自动赋值

或者手动赋值:

```ts
enum UserResponse {
  No = 0,
  Yes = 1,
}
```

### 字符串枚举

```ts
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}
```

### 混合枚举

```ts
enum BooleanLikeHeterogeneousEnum {
  No = 0,
  Yes = "YES",
}
```

## 泛型

泛型是类型的变量

```ts
function identity<T>(arg: T): T {
  return arg;
}
```

### 泛型在type中

```ts
interface GenericIdentityFn {
  <T>(arg: T): T;
}

function identity<T>(arg: T): T {
  return arg;
}

let myIdentity: GenericIdentityFn = identity;
```

### 泛型在类中

```ts
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}

let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function (x, y) {
  return x + y;
};
```

### 泛型约束

```ts
function loggingIdentity<T>(arg: T): T {
  console.log(arg.length);
// ERROR: Property 'length' does not exist on type 'T'.
  return arg;
}
```

正确的写法:

```ts
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length); // Now we know it has a .length property, so no more error
  return arg;
}
```

### 在约束中使用类型参数

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

let x = { a: 1, b: 2, c: 3, d: 4 };

getProperty(x, "a");
getProperty(x, "m");
// Argument of type '"m"' is not assignable to parameter of type '"a" | "b" | "c" | "d"'.
```

### 泛型和类类型

```ts
function create<T>(c: { new (): T }): T {
  return new c();
}
```

## 装饰器

```ts
// single
@f @g x

// muti
@f
@g
x
```

下面是一个装饰器工厂的例子:

```ts
function f() {
    console.log("f(): evaluated");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("f(): called");
    }
}

function g() {
    console.log("g(): evaluated");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("g(): called");
    }
}

class C {
    @f()
    @g()
    method() {}
}
```

输入如下:

```ts
f(): evaluated
g(): evaluated
g(): called
f(): called
```

### 装饰器求值

类中不同声明上的装饰器, 将按一下规定的顺序应用:

1. 实例成员: 参数装饰器 -> 方法装饰器 -> 访问符装饰器 -> 属性装饰器
2. 静态成员: 参数装饰器 -> 方法装饰器 -> 访问符装饰器 -> 属性装饰器
3. 构造函数: 参数装饰器
4. 类装饰器

### 类装饰器

```ts
@sealed
class Greeter {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        return "Hello, " + this.greeting;
    }
}
```

seal 实现如下:

```ts
function sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
}
```

比如这是一个重载构造函数的装饰器:

```ts
function classDecorator<T extends {new(...args:any[]):{}}>(constructor:T) {
    return class extends constructor {
        newProperty = "new property";
        hello = "override";
    }
}

@classDecorator
class Greeter {
    property = "property";
    hello: string;
    constructor(m: string) {
        this.hello = m;
    }
}

console.log(new Greeter("world"));
```

### 方法装饰器

在方法声明之前可以声明方法装饰器. 装饰器中会传入下面三个参数:

1. 对于静态成员来说是类的构造函数, 对于实例成员是类的原型对象
2. 成员的名字
3. 成员的属性描述符

对于es5版本一下的输出目标, 属性描述符是`undefined`

如果方法装饰器返回一个值, 它会被用作方法的属性描述符

下面是一个例子:

```ts
class Greeter {
    greeting: string;
    constructor(message: string) {
        this.greeting = message;
    }

    @enumerable(false)
    greet() {
        return "Hello, " + this.greeting;
    }
}
```

`enumerable`的定义如下:

```ts
function enumerable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = value;
    };
}
```

### 访问器装饰器

ts不允许同时装饰一个成员的`get`和`set`, 取而代之的是, 一个成员的所有装饰器必须应用在文档顺序的第一个访问器上. 因为在装饰器应用于一个属性描述符的时候, 它联合了`get`和`set`, 而不是分开声明的.

对于访问器装饰器表达式会在运行的时候被当做函数被调用, 并传入下面三个参数:

1. 对于静态成员来说是类的构造函数, 对于实例成员是类的原型对象
2. 成员的名字
3. 成员的属性描述符

```ts
class Point {
    private _x: number;
    private _y: number;
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    @configurable(false)
    get x() { return this._x; }

    @configurable(false)
    get y() { return this._y; }
}
```

其中`configurable`的实现如下:

```ts
function configurable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = value;
    };
}
```

### 属性装饰器

属性装饰器声明在一个属性声明之前. 表达式会传入下面这两个参数:

1. 对于静态成员来说是类的构造函数, 对于实例成员是类的原型对象
2. 成员的名字

属性描述符不会作为参数被传入, 因为到目前没有办法在定义一个原型对象的成员时描述一个实例属性, 并且没办法监视或修改一个属性的初始化方法. 返回值也会被忽略. 因此, 属性描述符只能用来监视类中是否声明了某个名字的属性

```ts
class Greeter {
    @format("Hello, %s")
    greeting: string;

    constructor(message: string) {
        this.greeting = message;
    }
    greet() {
        let formatString = getFormat(this, "greeting");
        return formatString.replace("%s", this.greeting);
    }
}
```

然后定义`@format`装饰器和`getFormat`函数:

```ts
import "reflect-metadata";

const formatMetadataKey = Symbol("format");

function format(formatString: string) {
    return Reflect.metadata(formatMetadataKey, formatString);
}

function getFormat(target: any, propertyKey: string) {
    return Reflect.getMetadata(formatMetadataKey, target, propertyKey);
}
```

当`@format('Hello, %s')`被调用的时候, 他会添加一条元数据, 然后通过`ferFormat`读取

### 参数装饰器

参数装饰器传参如下:

1. 对于静态成员来说是类的构造函数, 对于实例成员是类的原型对象
2. 成员的名字
3. 参数在函数参数列表中的索引

参数装饰器只能用来监视一个方法的参数是否被传入

参数装饰器的返回值会被忽略

```ts
class Greeter {
    greeting: string;

    constructor(message: string) {
        this.greeting = message;
    }

    @validate
    greet(@required name: string) {
        return "Hello " + name + ", " + this.greeting;
    }
}
```

其中`@required`和`@validate`定义如下:

```ts
import "reflect-metadata";

const requiredMetadataKey = Symbol("required");

function required(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    let existingRequiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];
    existingRequiredParameters.push(parameterIndex);
    Reflect.defineMetadata(requiredMetadataKey, existingRequiredParameters, target, propertyKey);
}

function validate(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) {
    let method = descriptor.value;
    descriptor.value = function () {
        let requiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyName);
        if (requiredParameters) {
            for (let parameterIndex of requiredParameters) {
                if (parameterIndex >= arguments.length || arguments[parameterIndex] === undefined) {
                    throw new Error("Missing required argument.");
                }
            }
        }

        return method.apply(this, arguments);
    }
}
```

