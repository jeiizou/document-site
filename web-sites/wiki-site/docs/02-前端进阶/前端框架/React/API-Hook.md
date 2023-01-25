# API-Hook


`react hook` 是在 react16.8 以后更新的新语法, 能够给**函数组件**添加状态而不需要转变为 `class` 组件.

最常用的是两种基础的 `hook`: `state hook` 和 `effect hook`.

## StateHook

`state hook`对应于`class`组件中的`state`, 语法非常的简单:

```js
const [count, setCount] = useState(0);
```

-   count: 变量编程, 对应于`state`中的值
-   setCount: 控制变量的函数, 对应于`setState`方法
-   useState(0): 设置变量初始值为 0

`stateHook` 相较于 `class`组件中的 state, 在数据的组织上更加的灵活, 拆分程度更高.

## EffectHook

`class`组件使用`state`保存状态, 使用生命周期来控制组件的行为, 在函数组件中, 完成这个功能的是`effectHook`, 但是这两者的设计目标是不同的. 前者是渲染周期的钩子函数, 后者是为了处理副作用而被设计出来的.

`effectHook`会在组件更新的时候被触发, 并且可以返回一个函数, 这个函数会自动在组件销毁的时候被触发.

```js
userEffect(()=>{
    API.getSomeStatus(par1,func1);

    retutn function clear(){
        API.clearSomeStatus(par1,func1);
    }
})
```

官方告诉我们, 我们可以把`effectHook`看做是`componentDidMount`,`componDidUpdate`以及`componentWillUnmount`三个函数的组合.

其优势不仅在于写起来更方便, 更重要的是使用`effectHook`不会阻塞浏览器更新屏幕, 使得应用的响应看起来更快.

对于`effectHook`, 每次执行一个`effect`的时候都会执行上一个`effect`的清除事件. 这样可以减少 bug 的产生.

此外, `userEffect`实际上可以接受第二个参数来指定仅在某个参数改变时执行该`effect`, 例如下面的代码:

```js
useEffect(() => {
    document.title = `You clicked ${count} times`;
}, [count]); // 仅在 count 更改时更新
```

注意此种优化方式, 要必须确认你在 effect 中使用的变量都在这个数组中了, 否则就可能会应用到先前渲染中的旧的值.

## 逻辑复用和代码重组

`Hook`的设计, 并不是简单的提供了两种新的语法来让我们学习, 单纯的这样做是没有意义的.

`Hook`更多的是使我们思考从前的代码中不尽如人意的地方. 官方给出思路是代码复用以及逻辑分离.

我们还是来看官方的例子:

```js
import React, { useState, useEffect } from 'react';

function useFriendStatus(friendID) {
    const [isOnline, setIsOnline] = useState(null);

    function handleStatusChange(status) {
        setIsOnline(status.isOnline);
    }

    useEffect(() => {
        ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
        return () => {
            ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
        };
    });

    return isOnline;
}
```

这个封装的逻辑, 可以的多个组件内重复的使用:

```js
function FriendStatus(props) {
    const isOnline = useFriendStatus(props.friend.id);

    if (isOnline === null) {
        return 'Loading...';
    }
    return isOnline ? 'Online' : 'Offline';
}
```

```js
function FriendListItem(props) {
    const isOnline = useFriendStatus(props.friend.id);

    return <li style={{ color: isOnline ? 'green' : 'black' }}>{props.friend.name}</li>;
}
```

并且这两个 state 是完全独立的, Hook 是一种状态逻辑的方式, 并不是对数据本身的复用

## HOOK 规则

-   只在最顶层使用 hook
    -   不在循环， 条件或者嵌套函数中调用 Hook
-   只在 React 函数中调用 Hook
    -   不在普通的 js 函数中调用 Hook，只在 recat 的函数组建或者自定义 Hook 中调用其它的 Hook

### 为什么

React 通过调用 Hook 的顺序来确定 state 对应的 useState，一旦我们把 Hook 放在条件语句或者循环中， 就无法保证每次渲染的 Hook 顺序的一致性。

## 自定义 Hook

单纯从代码上去看，自定义 Hook 实际上就是一段封装了 Hook 逻辑的函数， 并且返回了我们想要的数据结构而已。

不过需要遵循一些规则以及约定。

1. 自定义 Hook 必须以`use`开头, 否则无法判断某个函数是否包含对 Hook 的调用, React 的自动检查机制将会失效
2. 即使是相同的 Hook, 也不会共享 state

## useReducer

useReducer 也是一种封装, 它借鉴于分散的 useState 实际上不太便于复杂逻辑的统一变化, 而 reducer 比较擅长这个, 因此我们可以封装出一个 userReducer 来这样使用:

```js
function useReducer(reducer, initialState) {
    //普通的useState
    const [state, setState] = useState(initialState);
    //对应的reducer
    function dispatch(action) {
        const nextState = reducer(state, action);
        setState(nextState);
    }

    //返回的数据
    return [state, dispatch];
}
```

在组件中, 可以这样使用:

```js
function Todos() {
    const [todos, dispatch] = useReducer(todosReducer, []);

    function handleAddClick(text) {
        dispatch({ type: 'add', text });
    }

    // ...
}
```

方便之处在于, 这个 Hook 因为其常见性, 已被内置到 React 中.

一个完整的示例看起来是这样:

```js
const initialState = { count: 0 };

function reducer(state, action) {
    switch (action.type) {
        case 'increment':
            return { count: state.count + 1 };
        case 'decrement':
            return { count: state.count - 1 };
        default:
            throw new Error();
    }
}

function Counter() {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <>
            Count: {state.count}
            <button onClick={() => dispatch({ type: 'increment' })}>+</button>
            <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
        </>
    );
}
```

### 惰性初始化

将 init 函数作为 useReducer 的第三个参数传入, 这样初始 state 将被设置为`init(initialArg)`, 可以吧用于计算 state 的逻辑提取到 reducer 外部:

```js
function init(initialCount) {
    return { count: initialCount };
}

function reducer(state, action) {
    switch (action.type) {
        case 'increment':
            return { count: state.count + 1 };
        case 'decrement':
            return { count: state.count - 1 };
        case 'reset':
            return init(action.payload);
        default:
            throw new Error();
    }
}

function Counter({ initialCount }) {
    const [state, dispatch] = useReducer(reducer, initialCount, init);
    return (
        <>
            Count: {state.count}
            <button onClick={() => dispatch({ type: 'reset', payload: initialCount })}>Reset</button>
            <button onClick={() => dispatch({ type: 'increment' })}>+</button>
            <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
        </>
    );
}
```

## 其他 Hook

所有的内置 Hook 的概念和用法, 都可以在[官方的文档](https://react.docschina.org/docs/hooks-reference.html)中查询到.
