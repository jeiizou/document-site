# 2021-01-31

## Typescript 高级技巧(直播录像回看)

### ConstructorParameters

`ConstructorParameters`, 获取构造函数参数类型:

```ts
class User {
    constructor(uname: string, age: number) {}
}

type TCtor = ConstructorParameters<typeof User>;

function init(...info: TCtor) {} // type TCtor = [uname: string, age: number]
```

### Extract & Exclude

```ts
interface FirstType {
    id: number;
    firstName: string;
    lastName: string;
}

interface SecondType {
    id: number;
    address: string;
    city: string;
}

// 选择在父级中存在的属性
type ExtractType1 = Extract<keyof FirstType, keyof SecondType>;
// type ExtractType1 = "id"

// 选择在父级中不存在的属性
type ExtractType2 = Exclude<keyof FirstType, keyof SecondType>;
// type ExtractType2 = "firstName" | "lastName"
```

### 工厂模式

```ts
declare function create<T extends new () => any>(c: T): InstanceType<T>;

class demoA {}
class demoB {}

let a1 = create(demoA);
```

### Ioc

```ts
interface IContainer<T extends new () => any> {
    callback: () => InstanceType<T>;
    singleton: boolean;
    instance?: InstanceType<T>;
}

interface NewAble<T> {
    new (...args: any): T;
}

type TBind<T> = [key: string, Fn: NewAble<T>];

class CreareIoc {
    private contianer: Map<PropertyKey, IContainer<any>>;
    constructor() {
        this.contianer = new Map<string, IContainer<any>>();
    }
    public bind<T>(...params: TBind<T>) {
        this.helpBind(params, false);
    }

    public singleton<T>(...params: TBind<T>) {
        this.helpBind(params, true);
    }

    private helpBind<T>(params: TBind<T>, singleton: boolean) {
        const [key, Fn] = params;
        const callback = () => new Fn();
        const _instance: IContainer<typeof Fn> = { callback, singleton };
        this.contianer.set(key, _instance);
    }

    public restore(key: string) {
        this.contianer.delete(key);
    }

    public use<T>(namespace: string) {
        const item = this.contianer.get(namespace);
        if (item !== undefined) {
            if (item.singleton && !item.instance) {
                item.instance = item.callback();
            }
            return item.singleton ? <T>item.instance : <T>item?.callback();
        } else {
            // 没有找到Item
            throw new Error('没有找到item');
        }
    }
}

interface IUserService {
    test(str: string): void;
}
class UserService implements IUserService {
    constructor() {}
    public test(str: string): void {
        console.log('[ str ]', str);
    }
}

const ioc = new CreareIoc();
ioc.bind<IUserService>('userService', UserService);
const user = ioc.use<IUserService>('userService');
user.test('123123');
```

### NonAble

```ts
type TNon = NonNullable<string | number | undefined>;
// type TNon = string | number
```

### Parameters

```ts
type IFoo = (
    uname: string,
    uage: number,
) => {
    name: string;
    age: number;
};

type Ibar = Parameters<IFoo>;
// type Ibar = [uname: string, uage: number]
```

### Partial

```ts
interface User {
    id: number;
    age: number;
}

type PartialUser = Partial<User>;
// type PartialUser = {
//     id?: number;
//     age?: number;
// };
```

### Readonly

```ts
interface User {
    id?: number;
    age?: number;
}

type PartialUser = Readonly<User>;
// type PartialUser = {
//     readonly id?: number;
//     readonly age?: number;
// };
```

### ReadonlyArray

不可变的数组

```ts
type Ibar = Parameters<IFoo>;
// type Ibar = [uname: string, uage: number]

const arr = [1, 2, 3, 4];

let r: ReadonlyArray<number> = arr;
r.push(123)
// 类型“readonly number[]”上不存在属性“push”
```

### Pick

```ts
interface User {
    id: string;
    age: number;
}

type PickUser = Pick<User, 'id'>;
// type PickUser = {
//     id: string;
// };
```

### Requied

必选的, 类似`-?`

### Record

从键类型映射到值类型

```ts
type petGroup = 'dog' | 'cat' | 'fish';
interface IPetInfo {
    name: string;
    age: number;
}

type IPet = Record<petGroup, IPetInfo>;
// type IPet = {
//     dog: IPetInfo;
//     cat: IPetInfo;
//     fish: IPetInfo;
// }
```

### ReturnType

获取函数参数返回值

```ts
type IFoo = (
    uname: string,
    uage: number,
) => {
    name: string;
    age: number;
};

type IFooReturn = ReturnType<IFoo>;
// type IFooReturn = {
//     name: string;
//     age: number;
// }
```

### typeof keyof instanceof


### XX [keyof ] [K in O]

### 特殊符号 

- `+`: 只读 
- `-?`: 取消可选
- `?`: 可选
- `!`: 非空生命
- 变量 as number === <number>变量
- is 函数返回类型的防护

## TypeScript React 最佳实践

1. interface 用类实现SOLID框架, 编写库和第三方的环境定义VUE
2. type 用于Props, State, Fetch数据 shared BFF node的模式
3. quicltype 生成cli 集成进来


- React
- TS
- playwright(e2e unit)
- css Next
- 性能sdk
- CI/CD
- Webpack5

- React Query
- Recoil
- React Hook From
- swr-loader

- vite 
- esbuild / swc
- vue-cli 编译优化



## Typescript React 最佳实践二

### 0. 引入react库

```ts
// tsconfig.json 同步开启allowSyntheticDefaultImports, 就可以省略 `* as React`这样的写法了
import React from 'react';
import ReactDOM from 'react-dom';
```

### 1. props的类型写法

- 使用type去写prop的类型, 而不要使用interface, interface更适合在`SOLID框架`, 编写`库`和第三方的`环境定义`中使用
- type 用于Props、State、fecth数据 shared BFF node的模式
- quicktype 可以用于接口数据的生成类型

下面是一个典型的props的类型写法

```ts
export type AppProps = {
  str: string;
  count: number;
  disabled: boolean;
  names: string[];
  /** string literals to specify exact string values, with a union type to join them together */
  status: 'waiting' | 'success';
  /** any object as long as you dont use its properties (NOT COMMON but useful as placeholder) */
  obj: object;
  obj2: {}; // 与object几乎相同 Object完全相同
  /** an object with any number of properties (PREFERRED) */
  obj3: {
    id: string;
    title: string;
  };
  /** array of objects! (common) */
  objArr: {
    id: string;
    title: string;
  }[];
  /** a dict object with any number of properties of the same type */
  dict1: {
    [key: string]: MyTypeHere;
  };
  dict2: Record<string, MyTypeHere>; // equivalent to dict1
  /** 任何函数 不调用它（不推荐使用） */
  onSomething: Function;
  /** 如果你想省事的话 */
  // onClick: () => void;
  /** function with named prop (VERY COMMON) */
  onChange: (id: number) => void;
  /** 接受事件可选参数 */
  onClick(event: React.MouseEvent<HTMLButtonElement>): void;
  /** an optional prop (VERY COMMON!) */
  optional?: OptionalType;
};
```

然后是对于节点的一些类型的写法:

```ts
//有关于React的更多实用类型 type interface都可以实现 d.ts 才使用declare
export interface AppProps2 {
  children1: JSX.Element; //这种是没考虑数组的
  children2: JSX.Element | JSX.Element[]; //不接收字符串
  children3: React.ReactChildren; // despite the name, not at all an appropriate type; it is a utility
  children4: React.ReactChild[]; // better
  children: React.ReactNode; // 最佳实践
  functionChildren: (name: string) => React.ReactNode; // recommended function as a child render prop type
  style?: React.CSSProperties; // to pass through style props
  //表单事件 从event.target中生成它
  onChange?: React.FormEventHandler<HTMLInputElement>;
  //  more info: https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#wrappingmirroring
  //显式不转发ref
  //props: Props & React.ComponentPropsWithoutRef<'button'>;
  //显式的转发ref
  //props2: Props & React.ComponentPropsWithRef<MyButtonWithForwardRef>; // to impersonate all the props of MyButtonForwardedRef and explicitly forwarding its ref
}
```

### 2. 函数式组件

react提供了一些内置类型

```ts
import { FC, VFC, SFC } from 'react';
```

传统的类型是这样的:

```ts
//非常传统的组件接受参数
type AppProps = { message: string };
const App = ({ message }: AppProps) => <div>{message}</div>;
console.log(App);
```

正常的函数组件的FC(Function Component), 默认会有一个children:

```ts
const App22: FC<{ title: string }> = ({ children, title }) => (
  <div title={title}>{children}</div>
);
```

如果没有返回的children, 可以用VFC(VoidFunctionComponent):

```ts
// 明确的的表示这是一个不带有children =》FunctionComponent
const VoidFunctionComponent: VFC<Props> = ({ foo }) => {
  return (
    <div>
      {foo}
      {/* {children} */}
    </div>
  );
};
```

可能存在问题:

```ts
const MyConditionalComponent = ({ shouldRender = true }) =>
  shouldRender ? <div /> : false; // JS中常见的操作引擎React内部的错误
const el = <MyConditionalComponent />; // throws an error

// const MyArrayComponent = () => Array(5).fill(<div />);
const MyArrayComponent2 = () =>
  (Array(5).fill(<div />) as unknown) as JSX.Element;
const el2 = <MyArrayComponent2 />; // throws an error
```

### 3. hooks的类型

#### 3.1 useState

如果state的类型比较复杂或者比较重要, 就要使用泛型:

```ts
const [user, setUser] = useState<IUser | null>(null);
```

明确的知道了某个值的类型, 不需要手动的添加类型, 而是直接用`typeof`进行反向的推断.

不要为了ts而ts

#### 3.2 useReducer

```ts
const initialState = { count: 1 };

type ACTIONTYPE =
  | { type: 'increment'; payload: number }
  | { type: 'decrement'; payload: string };

function reducer(state: typeof initialState, action: ACTIONTYPE) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + action.payload };
    case 'decrement':
      return { count: state.count - parseInt(action.payload, 10) };
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'decrement', payload: '5' })}>
        -
      </button>
      <button onClick={() => dispatch({ type: 'increment', payload: 5 })}>
        +
      </button>
    </>
  );
}
```

#### 3.3 useRef

这里有个技巧, null后面加一个`!`可以避免每次的非空判断

```ts
function TextInputWithFocusButton() {
  // initialise with null, but tell TypeScript we are looking for an HTMLInputElement
  const inputEl = useRef<HTMLInputElement>(null!);
  const onButtonClick = () => {
    // if (inputEl) {
    inputEl.current.focus();
    // }
  };
  return (
    <>
      {/* in addition, inputEl only can be used with input elements. Yay! */}
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

#### 3.4 useImperativeHandle

```ts
import { useImperativeHandle } from 'react';
type ListProps<ItemType> = {
  items: ItemType[];
  //没有特殊的设置 只有在透传子ref的时候记得
  innerRef?: React.Ref<{ scrollToItem(item: ItemType): void }>;
};

function List<ItemType>(props: ListProps<ItemType>) {
  useImperativeHandle(props.innerRef, () => ({
    scrollToItem() {},
  }));
  return null;
}

```

### 4. default Props

默认赋值小技巧: `& typeof`

```ts
type GreetProps1 = { myname: string } & typeof defaultProps;
const defaultProps = {
  age: 21,
};

const Greet = ({ age, myname }: GreetProps1) => {
  // etc
};
Greet.defaultProps = defaultProps;
```

子组件继承父组件类型的一个技巧:

```ts
interface IProps {
  name: string;
}
const defaultProps = {
  age: 25,
};
const GreetComponent = ({ name, age }: IProps & typeof defaultProps) => (
  <div>{`Hello, my name is ${name}, ${age}`}</div>
);
GreetComponent.defaultProps = defaultProps;

const TestComponent = (props: React.ComponentProps<typeof GreetComponent>) => {
  return <h1 />;
};

// Property 'age' is missing in type '{ name: string; }' but required in type '{ age: number; }'
const el = <TestComponent name="foo" />;

// 换一种写法
type ComponentProps<T> = T extends
  | React.ComponentType<infer P>
  | React.Component<infer P>
  ? JSX.LibraryManagedAttributes<T, P>
  : never;

const TestComponent = (props: ComponentProps<typeof GreetComponent>) => {
  return <h1 />;
};

// No error
const el = <TestComponent name="foo" />;
```
### 5. formsEvents

注意, 写TS的过程中忌讳:

- 输入无类型
- 输出无类型
