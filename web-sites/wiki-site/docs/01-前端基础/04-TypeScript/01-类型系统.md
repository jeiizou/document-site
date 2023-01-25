# TS-类型系统

## 类型保护

```ts
interface Bird {
    fly();
    layEggs();
}

interface Fish {
    swim();
    layEggs();
}

function getSmallPet(): Fish | Bird {
    // ...
}

let pet = getSmallPet();
pet.layEggs(); // okay
pet.swim();    // errors
```

假定我们确实需要访问`swim`方法, 我们该如何修改呢?

### 类型保护和区分类型

```ts
let pet = getSmallPet();

// 每一个成员访问都会报错
if (pet.swim) {
    pet.swim();
}
else if (pet.fly) {
    pet.fly();
}
```

为了这段代码正常工作, 我们可能需要使用类型断言:

```ts
let pet = getSmallPet();
let fishPet = pet as Fish;
let birdPet = pet as Bird;

if (fishPet.swim) {
  fishPet.swim();
} else if (birdPet.fly) {
  birdPet.fly();
}
```

但是这样的代码就比较丑陋了. 因此, 使用类型保护(Type Guards)就是比较好的方式. 其中的`pet is Fish`被称为类型谓词(Type predicate)

```ts
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
```

对于类型谓词, 形式如`parameterName is Type`, 其中的`parameterName`必须是当前函数签名中参数的名称.

任何时候`isFish`使用某个变量调用时, 如果原始类型兼容, ts就会将该变量缩小为特定类型. 

```ts
// Both calls to 'swim' and 'fly' are now okay.
let pet = getSmallPet();

if (isFish(pet)) {
  pet.swim();
} else {
  pet.fly();
}
```

注意在这里, ts不仅知道`if`分支中的`pet`是`Fish`类型, 它同时也知道`else`分支中一定是`Bird`类型.

### `in`运算符

使用`in`操作符也可以进行类型收缩.

```ts
function move(pet: Fish | Bird) {
  if ("swim" in pet) {
    return pet.swim();
  }
  return pet.fly();
}
```

### `typeof`类型保护

```ts
function isNumber(x: any): x is number {
    return typeof x === "number";
}

function isString(x: any): x is string {
    return typeof x === "string";
}

function padLeft(value: string, padding: string | number) {
    if (isNumber(padding)) {
        return Array(padding + 1).join(" ") + value;
    }
    if (isString(padding)) {
        return padding + value;
    }
    throw new Error(`Expected string or number, got '${padding}'.`);
}
```

不过这样的写法非常不舒服, ts内置识别这样的原始类型类型判断:

```ts
function padLeft(value: string, padding: string | number) {
    if (typeof padding === "number") {
        return Array(padding + 1).join(" ") + value;
    }
    if (typeof padding === "string") {
        return padding + value;
    }
    throw new Error(`Expected string or number, got '${padding}'.`);
}
```

不过这样的`typeof`类型保护只有两种形式能够被识别: `typeof v === "typename"`和`typeof v !== "typename"`. 

### `instanceof`类型保护

```ts
interface Padder {
    getPaddingString(): string
}

class SpaceRepeatingPadder implements Padder {
    constructor(private numSpaces: number) { }
    getPaddingString() {
        return Array(this.numSpaces + 1).join(" ");
    }
}

class StringPadder implements Padder {
    constructor(private value: string) { }
    getPaddingString() {
        return this.value;
    }
}

function getRandomPadder() {
    return Math.random() < 0.5 ?
        new SpaceRepeatingPadder(4) :
        new StringPadder("  ");
}

// 类型为SpaceRepeatingPadder | StringPadder
let padder: Padder = getRandomPadder();

if (padder instanceof SpaceRepeatingPadder) {
    padder; // 类型细化为'SpaceRepeatingPadder'
}
if (padder instanceof StringPadder) {
    padder; // 类型细化为'StringPadder'
}
```

`instanceof`要求右边是构造函数, 并且会把类型范围按照下面的顺序进行缩小:

1. 该类型不为any则为函数`prototype`的类型
2. 该类型的构造签名返回的类型的并集

### 字面量类型保护

```ts
type Foo = {
  kind: 'foo'; // 字面量类型
  foo: number;
};

type Bar = {
  kind: 'bar'; // 字面量类型
  bar: number;
};

function doStuff(arg: Foo | Bar) {
  if (arg.kind === 'foo') {
    console.log(arg.foo); // ok
    console.log(arg.bar); // Error
  } else {
    // 一定是 Bar
    console.log(arg.foo); // Error
    console.log(arg.bar); // ok
  }
}
```

### 自定义类型保护

js没有内置的运行时的自我检查机制. 所以可以自建一个类型保护函数:

```ts
// 仅仅是一个 interface
interface Foo {
  foo: number;
  common: string;
}

interface Bar {
  bar: number;
  common: string;
}

// 用户自己定义的类型保护！
function isFoo(arg: Foo | Bar): arg is Foo {
  return (arg as Foo).foo !== undefined;
}

// 用户自己定义的类型保护使用用例：
function doStuff(arg: Foo | Bar) {
  if (isFoo(arg)) {
    console.log(arg.foo); // ok
    console.log(arg.bar); // Error
  } else {
    console.log(arg.foo); // Error
    console.log(arg.bar); // ok
  }
}

doStuff({ foo: 123, common: '123' });
doStuff({ bar: 123, common: '123' });
```

## Null

在ts中, null和undefined会被区别对待

```ts
let exampleString = "foo";
exampleString = null;
// Type 'null' is not assignable to type 'string'.

let stringOrNull: string | null = "bar";
stringOrNull = null;

stringOrNull = undefined;
// Type 'undefined' is not assignable to type 'string | null'.
```

## 类型别名

```ts
type Second = number;

let timeInSecond: number = 10;
let time: Second = 10;
```

这里的`timeInSecond`不会创建一个新的类型. 同时这样的别名也可以在泛型中使用

```ts
type Container<T> = { value: T };
```

也可以使用类型别名来在属性里面引用自身

```ts
type Tree<T> = {
    value: T;
    left: Tree<T>;
    right: Tree<T>;
}
```

与交叉类型一起使用, 我们可以创建出一些非常奇怪的类型:

```ts
type LinkedList<Type> = Type & { next: LinkedList<Type> };

interface Person {
  name: string;
}

let people = getDriversLicenseQueue();
people.name;
people.next.name;
people.next.next.name;
people.next.next.next.name;
//                  ^ = (property) next: LinkedList
```

但是类型别名不能出现在声明的右边: 

```ts
type Yikes = Array<Yikes>; // error
```

### 接口和类型别名

接口和类型是相似的. 接口的几乎有所能力都可以在类型中使用, 其最关键的区别在于: 类型是无法添加新属性的, 而接口是始终可以扩展的. 并且接口是可以继承的.

```ts
// interface
interface Animal {
  name: string
}

interface Bear extends Animal {
  honey: boolean
}

const bear = getBear() 
bear.name
bear.honey

// type
type Animal = {
  name: string
}

type Bear = Animal & { 
  honey: Boolean 
}

const bear = getBear();
bear.name;
bear.honey;

// interface
interface Window {
  title: string
}

interface Window {
  ts: import("typescript")
}

const src = 'const a = "Hello World"';
window.ts.transpileModule(src, {});

// type
type Window = {
  title: string
}

type Window = {
  ts: import("typescript")
}

// Error: 重复定义
```

## 多态`this`类型

多态`this`类型表示所包含的类或接口的子类型

这里是一个`F-bounded`的多态类型:

```ts
class BasicCalculator {
  public constructor(protected value: number = 0) {}
  public currentValue(): number {
    return this.value;
  }
  public add(operand: number): this {
    this.value += operand;
    return this;
  }
  public multiply(operand: number): this {
    this.value *= operand;
    return this;
  }
  // ... other operations go here ...
}

let v = new BasicCalculator(2).multiply(5).add(1).currentValue();
```

这种链式调用的接口更容易表达逻辑

## 索引类型

在js中, 比如我们要选择一个对象中的某些属性, 我们可以这样实现:

```js
function pluck(o, propertyNames) {
  return propertyNames.map((n) => o[n]);
}
```

在js中, 我们可以借助索引类型来实现类似操作:

```ts
function pluck<T, K extends keyof T>(o: T, propertyNames: K[]): T[K][] {
  return propertyNames.map((n) => o[n]);
}

interface Car {
  manufacturer: string;
  model: string;
  year: number;
}

let taxi: Car = {
  manufacturer: "Toyota",
  model: "Camry",
  year: 2014,
};

// Manufacturer and model are both of type string,
// so we can pluck them both into a typed string array
let makeAndModel: string[] = pluck(taxi, ["manufacturer", "model"]);

// If we try to pluck model and year, we get an
// array of a union type: (string | number)[]
let modelYear = pluck(taxi, ["model", "year"]);
```

其中的`keyof T`是T的所有公共属性的并集

```ts
let carProps: keyof Car;
//         ^ = let carProps: "manufacturer" | "model" | "year"
```

## 索引类型和索引签名

```ts
interface Dictionary<T> {
  [key: string]: T;
}
let keys: keyof Dictionary<number>;
//     ^ = let keys: string | number
let value: Dictionary<number>["foo"];
//      ^ = let value: number
```

如果类型中带有数字索引的签名, 则`keyof T`则会是`number`:

```ts
interface Dictionary<T> {
  [key: number]: T;
}

let keys: keyof Dictionary<number>;
//     ^ = let keys: number
let numberValue: Dictionary<number>[42];
//     ^ = let numberValue: number
let value: Dictionary<number>["foo"];
// Property 'foo' does not exist on type 'Dictionary<number>'.
```

## 类型映射

```ts
// 把类型中的属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 把类型中的属性变为只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

使用示例如下:

```ts
// Use this:
type PartialWithNewMember<T> = {
  [P in keyof T]?: T[P];
} & { newMember: boolean }

// This is an error!
type WrongPartialWithNewMember<T> = {
    [P in keyof T]?: T[P];
    newMember: boolean;
    //   'boolean' only refers to a type, but is being used as a value here.
    // '}' expected.
}
// Declaration or statement expected.
```

再比如:

```ts
type Nullable<T> = { [P in keyof T]: T[P] | null };
```

可以把一个类型转换为可为null的类型

这些示例中, 都是把属性通过`keyof T`, 转换为`T[P]`. 对于映射类型的任何常规使用, 这都是很好的模板. 并且这种转换是'同态'的.

`Readonly<T>`和`Partial<T>`都非常有用，因此它们与`Pick`和`Record`一同被包含进了TypeScript的标准库

```ts
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

`Readonly`, `Partial`和`Pick`是同态的, 但是`Record`不是的.

```ts
type ThreeStringProps = Record<'prop1' | 'prop2' | 'prop3', string>
```

非同态本质上会创建新的属性, 因此它们不会从它处拷贝属性修饰符

### 由映射类型进行推断

现在我们知道如何包装一个类型的属性, 那么进行拆包也就非常容易了. 

```ts
function unproxify<T>(t: Proxify<T>): T {
    let result = {} as T;
    for (const k in t) {
        result[k] = t[k].get();
    }
    return result;
}

let originalProps = unproxify(proxyProps);
```

拆包的推算只能适用于'同态'的映射类型. 如果映射类型不是同态的, 那么需要给拆包一个明确的类型参数.

### 预定义的有条件类型

- `Exclude<T, U>`: 从T中期初可以赋值给`U`的类型
- `Extract<T, U>`: 提取T中可以复制给U的类型
- `NonNullable<T>`: 从T中剔除null和undefined。
- `ReturnType<T>`: 获取函数返回值类型。
- `InstanceType<T>`: 获取构造函数类型的实例类型。

## 条件类型

条件类型的表示如下:

```ts
T extends U ? X : Y
```

这里的`extend`是一种类型判断, 类似于`typeof`

```ts
declare function f<T extends boolean>(x: T): T extends true ? string : number;

// Type is 'string | number'
let x = f(Math.random() < 0.5);
//  ^ = let x: string | number
```

并且这种条件判断是可以嵌套的:

```ts
type TypeName<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : T extends undefined
  ? "undefined"
  : T extends Function
  ? "function"
  : "object";

type T0 = TypeName<string>;
//   ^ = type T0 = "string"
type T1 = TypeName<"a">;
//   ^ = type T1 = "string"
type T2 = TypeName<true>;
//   ^ = type T2 = "boolean"
type T3 = TypeName<() => void>;
//   ^ = type T3 = "function"
type T4 = TypeName<string[]>;
//   ^ = type T4 = "object"
```

### 分布条件类型

对于`T extends U ? X : Y`, 假定`T`是`A | B | C`. ts会把他拆解成为:

```ts
(A extends U ? X : Y) 
  | (B extends U ? X : Y) 
  | (C extends U ? X : Y).
```

下面是一个例子:

```ts
// 删除T中 T, U都存在的属性
type Diff<T, U> = T extends U ? never : T;
// 获取T中, T,U中存在的属性
type Filter<T, U> = T extends U ? T : never;

type T1 = Diff<"a" | "b" | "c" | "d", "a" | "c" | "f">;
//   ^ = type T1 = "b" | "d"
type T2 = Filter<"a" | "b" | "c" | "d", "a" | "c" | "f">; // "a" | "c"
//   ^ = type T2 = "a" | "c"
type T3 = Diff<string | number | (() => void), Function>; // string | number
//   ^ = type T3 = string | number
type T4 = Filter<string | number | (() => void), Function>; // () => void
//   ^ = type T4 = () => void

// 删除T中的null和undefined
type NotNullable<T> = Diff<T, null | undefined>;

type T5 = NotNullable<string | number | undefined>;
//   ^ = type T5 = string | number
type T6 = NotNullable<string | string[] | null | undefined>;
//   ^ = type T6 = string | string[]
```

在和类型映射结合一起使用的时候, 条件类型非常有用:

```ts
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

interface Part {
  id: number;
  name: string;
  subparts: Part[];
  updatePart(newName: string): void;
}

type T1 = FunctionPropertyNames<Part>;
//   ^ = type T1 = "updatePart"
type T2 = NonFunctionPropertyNames<Part>;
//   ^ = type T2 = "id" | "name" | "subparts"
type T3 = FunctionProperties<Part>;
//   ^ = type T3 = {
//       updatePart: (newName: string) => void;
//   }
type T4 = NonFunctionProperties<Part>;
//   ^ = type T4 = {
//       id: number;
//       name: string;
//       subparts: Part[];
//   }
```

与联合类型和类型交叉相似, 条件类型时不允许递归引用自己的. 下面就是一个错误示例:

```ts
type ElementType<T> = T extends any[] ? ElementType<T[number]> : T; // Error
```

### 条件类型中的类型推断

在`extends`条件类型的子句中, 可以用`infer`引入要推断的类型变量的声明. `infer`同一类型变量可能有多个位置.

比如下面的代码提取函数类型的返回类型

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

`infer`表示`extends`条件语句中待推断的类型变量. 

比如这个函数的作用就是提取函数中参数的类型:

```ts
type ParamType<T> = T extends (param: infer P) => any ? P : T;
```

表示: 如果T能赋值给`(param: infer P) => any`, 则结果是`(param: infer P) => any`类型中的参数P, 否则返回为T

```ts
interface User {
  name: string;
  age: number;
}

type Func = (user: User) => void;

type Param = ParamType<Func>; // Param = User
type AA = ParamType<string>; // string
```

可以嵌套条件类型来形成一些列的顺序求值的模式匹配:

```ts
type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: any[]) => infer U
  ? U
  : T extends Promise<infer U>
  ? U
  : T;

type T0 = Unpacked<string>;
//   ^ = type T0 = string
type T1 = Unpacked<string[]>;
//   ^ = type T1 = string
type T2 = Unpacked<() => string>;
//   ^ = type T2 = string
type T3 = Unpacked<Promise<string>>;
//   ^ = type T3 = string
type T4 = Unpacked<Promise<string>[]>;
//   ^ = type T4 = Promise
type T5 = Unpacked<Unpacked<Promise<string>[]>>;
//   ^ = type T5 = string
```

下面这个示例演示了同时存在多个待推断位置时候会生成联合类型:

```ts
type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;

type T1 = Foo<{ a: string; b: string }>;
//   ^ = type T1 = string
type T2 = Foo<{ a: string; b: number }>;
//   ^ = type T2 = string | number
```

同样的, 在待推断位置中针对同一类型变量的多个候选就会导致类型交叉:

```js
type Bar<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void }
  ? U
  : never;

type T1 = Bar<{ a: (x: string) => void; b: (x: string) => void }>;
//   ^ = type T1 = string
type T2 = Bar<{ a: (x: string) => void; b: (x: number) => void }>;
//   ^ = type T2 = never
```

而对于多个签名的类型, 比如重载的函数进行推算的时候, 将从最后一个签名进行腿短. 无法基于参数类型列表执行重载解析:

```ts
declare function foo(x: string): number;
declare function foo(x: number): string;
declare function foo(x: string | number): string | number;

type T1 = ReturnType<typeof foo>;
//   ^ = type T1 = string | number
```

对于常规类型参数, 不能在约束子句中使用声明:

```ts
type ReturnedType<T extends (...args: any[]) => infer R> = R;
// 'infer' declarations are only permitted in the 'extends' clause of a conditional type.
// Cannot find name 'R'.
```

可以这样修改:

```ts
type AnyFunction = (...args: any[]) => any;
type ReturnType<T extends AnyFunction> = T extends (...args: any[]) => infer R
  ? R
  : any;
```

## 实用的类型函数

### `Partial<Type>`

将所有属性设置为可选

### `Readonly<Type>`

将所有属性都设置为`readonly`

### `Record<Keys,Type>`

将`key`映射到`type`:

```ts
interface PageInfo {
  title: string;
}

type Page = "home" | "about" | "contact";

const nav: Record<Page, PageInfo> = {
  about: { title: "about" },
  contact: { title: "contact" },
  home: { title: "home" },
};

nav.about;
//   ^(property) about: PageInfo
```

### `Pick<Type, Keys>`

通过`Keys`中选择属性集来构造类型`Type`:

```ts
interface Person {
    name: string;
    age?: number;
}

type Person5 = Pick<Person, 'name'>;
// Person5 === {name: string}
```

### `Omit<Type, Keys>`

通过从中选择所有属性`Type`, 然后移除来构造一个类型

```ts
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

type TodoPreview = Omit<Todo, "description">;

const todo: TodoPreview = {
  title: "Clean room",
  completed: false,
};

todo;
// ^ = const todo: Pick
```

### `Exclude<Type, ExcludedUnion>`

从`Type`中删除联合成员中的属性来构造类型

```ts
type T0 = Exclude<"a" | "b" | "c", "a">;
//    ^ = type T0 = "b" | "c"
type T1 = Exclude<"a" | "b" | "c", "a" | "b">;
//    ^ = type T1 = "c"
type T2 = Exclude<string | number | (() => void), Function>;
//    ^ = type T2 = string | number
```

### `Extract<Type, Union>`

取两个类型中的并集

```ts
type T0 = Extract<"a" | "b" | "c", "a" | "f">;
//    ^ = type T0 = "a"
type T1 = Extract<string | number | (() => void), Function>;
//    ^ = type T1 = () => void
```

### `NonNullable<Type>`

删除`undiefined/null`类型

```ts
type T0 = NonNullable<string | number | undefined>;
//    ^ = type T0 = string | number
type T1 = NonNullable<string[] | null | undefined>;
//    ^ = type T1 = string[]
```

### `Parameters<Type>`

从函数类型的参数中使用的类型构造一个元组类型Type

```ts
type T1 = Parameters<(s: string) => void>;
//    ^ = type T1 = [s: string]
```

### `ConstructorParameters<Type>`

获取构造函数中的类型

```ts
type T0 = ConstructorParameters<ErrorConstructor>;
//    ^ = type T0 = [message?: string]
type T1 = ConstructorParameters<FunctionConstructor>;
//    ^ = type T1 = string[]
type T2 = ConstructorParameters<RegExpConstructor>;
//    ^ = type T2 = [pattern: string | RegExp, flags?: string]
type T3 = ConstructorParameters<any>;
//    ^ = type T3 = unknown[]
```

### `ReturnType<Type>`
 
获取函数的返回类型

```ts
type T0 = ReturnType<() => string>;
//    ^ = type T0 = string
```

### `InstanceType<Type>`

返回构造函数类型T的实例类型

```ts
class C {
  x = 0;
  y = 0;
}

type T0 = InstanceType<typeof C>;
//    ^ = type T0 = C
```

### `Required<Type>`

将所有类型转换为必选

```ts
interface Props {
  a?: number;
  b?: string;
}

const obj: Props = { a: 5 };
```

### `ThisParameterType<Type>`

提取this中的参数类型

```ts
function toHex(this: Number) {
  return this.toString(16);
}

function numberToString(n: ThisParameterType<typeof toHex>) {
  return toHex.apply(n);
}
```

### `OmitThisParameter<Type>`

```ts
function toHex(this: Number) {
  return this.toString(16);
}

const fiveToHex: OmitThisParameter<typeof toHex> = toHex.bind(5);

console.log(fiveToHex());
```

从`this`中删除`Type`

### `ThisType<Type>`

作为上下文this的标记

```ts
type ObjectDescriptor<D, M> = {
  data?: D;
  methods?: M & ThisType<D & M>; // Type of 'this' in methods is D & M
};

function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
  let data: object = desc.data || {};
  let methods: object = desc.methods || {};
  return { ...data, ...methods } as D & M;
}

let obj = makeObject({
  data: { x: 0, y: 0 },
  methods: {
    moveBy(dx: number, dy: number) {
      this.x += dx; // Strongly typed this
      this.y += dy; // Strongly typed this
    },
  },
});

obj.x = 10;
obj.y = 20;
obj.moveBy(5, 5);
```

## 泛型的应用

### 自动检查结构

```ts
function get<T, K extends keyof T>(p: T, key: K): any {
    return p[key]
}
```

### 泛型类

泛型不仅应用于函数签名, 也可以用来定义泛型类. 这提供了将通用逻辑封装到可复用构造中的能力. 

```ts
abstract class Animal {
    handle() { throw new Error("Not implemented") }
}

class Horse extends Animal{
    color: string
    handle() {
        console.log("Riding the horse...")
    }
}

class Dog extends Animal{
    name: string 
    handle() {
        console.log("Feeding the dog...")
    }
}

class Handler<T extends Animal> {
    animal: T

    constructor(animal: T) {
        this.animal = animal
    }

    handle() {
        this.animal.handle()
    }
}

class DogHandler extends Handler<Dog> {}
class HorseHandler extends Handler<Horse> {}
```

### 可变参数元组(Variadic Tuples)

普通的元组定义:

```ts
type MyTuple = [string, string, number]

let myList:MyTuple = ["Fernando", "Doglio", 37]
```

利用泛型的可变参数元组:

```ts
type MyTuple<T extends unknown[]> = [string, string, ...T, number]

let myList:MyTuple<[boolean, number]> = ["Fernando", "Doglio", true, 3, 37]
let myList:MyTuple<[number, number, number]> = ["Fernando", "Doglio", 1,2,3,4]
```


## 参考

- [TypeScript：一个好泛型的价值](https://mp.weixin.qq.com/s/WE8cJlfv9t__vddufKI2mw)