# [07]Hooks

如果把组件Component看做React世界中的原子, 那么Hooks更像是React世界中的电子. 它更贴近源码运行的规律.

## 一个极简的Hooks实现

对于`useState`, 我们考虑一个简单的例子:

```js
function App() {
  const [num, updateNum] = useState(0);

  return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;
}
```

我们可以将工作分成两部分:

1. 通过一些方法产生`更新`, `更新`会造成组件的`render`.
2. 组件`render`的时候, `useState`返回的`num`为更新后的结果

其中, 步骤1的更新可以分成`mount`和`update`.

1. 调用`ReactDom.render`会产生`mount`的更新, 更新内容为`useState`的`initialValueu`.
2. 点击`p`标签触发`updateNum`会产生一次`update`的更新, `更新`内容为`num => num + 1`.

### 更新是什么.

在我们的例子中, 更新是一个对象:

```js
const update = {
    // 更新执行的函数
    action,
    // 与同一个Hook的其他更新形成链表
    next: null
}
```

对于App来说, 点击`p`标签产生的`update`为`action`为`num => num + 1`.

```js
// 之前
return <p onClick={() => updateNum(num => num + 1)}>{num}</p>;

// 之后
return <p onClick={() => {
  updateNum(num => num + 1);
  updateNum(num => num + 1);
  updateNum(num => num + 1);
}}>{num}</p>;
```

那么点击p标签的时候会产生3个`update`.

### Update的数据结构

这些产生的update会形成`环状单向链表`.

调用`updateNum`实际上调用的是`dispatchAction.bind(null, hook.queue)`, 我们来看这个函数的逻辑:

```js
function dispatchAction(queue, action) {
  // 创建update
  const update = {
    action,
    next: null
  }

  // 环状单向链表操作
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  // 模拟React开始调度更新
  schedule();
}
```

### 保存状态

更新产生的update对象会保存在`queue`中, 不同于类组件的实例可以存储数据, 对于函数组件中的`queue`是保存在对应的`fiber`中的.

我们使用一个简化的`fiber`结构:

```js
// App组件对应的fiber对象
const fiber = {
  // 保存该FunctionComponent对应的Hooks链表
  memoizedState: null,
  // 指向App函数
  stateNode: App
};
```

### Hooks数据结构

我们专注`memoizedState`中保存的`Hook`的数据结构, 可以看到`Hook`和`update`类似, 都是通过`链表`连接的, 不过`Hook`是无环的单项链表.

```js
hook = {
  // 保存update的queue，即上文介绍的queue
  queue: {
    pending: null
  },
  // 保存hook对应的state
  memoizedState: initialState,
  // 与下一个Hook连接形成单向无环链表
  next: null
}
```

> update与hook:
> 每个`useState`对应一个`hook`对象
> 调用`const [num, updateNum] = useState(0)`的时候, 会产生一个`update`保存在`useState`对应的`hook.queue`中.


### 模拟React调度更新流程

在上面的`dispatchAction`中调用了`schedule`方法来模拟`React`调度更新流程.

现在需要来看看如何实现它. 

用`isMount`变量来标识是`mount`还是`update`.

```js
// 首次render时是mount
isMount = true;

function schedule() {
  // 更新前将workInProgressHook重置为fiber保存的第一个Hook
  workInProgressHook = fiber.memoizedState;
  // 触发组件render
  fiber.stateNode();
  // 组件首次render为mount，以后再触发的更新为update
  isMount = false;
}
```

其中, `workInProgressHook`变量指向当前正在工作的`hook`.

```js
workInProgressHook = fiber.memoizedState;
```

在组件`render`的时候, 每当遇到下一个`useState`我们就移动对应的指针:

```js
workInProgressHook = workInProgressHook.next;
```

这样, 只要每次组件`render`的时候`useState`的调用顺序以及数量是一致的, 那么之中可以通过`workInProgressHook`找到当前`useState`对应的`hook`对象.

到这里, 我们实现了第一步: 通过产生更新造成组件的`render`.

下面就要实现第二步: 组件`render`的时候`useState`返回的`num`为更新后的结果.

### 计算state

组件render的时候会调用`useState`. 大致上的逻辑如下:

```js
function useState(initialState) {
  // 当前useState使用的hook会被赋值该该变量
  let hook;

  if (isMount) {
    // ...mount时需要生成hook对象
  } else {
    // ...update时从workInProgressHook中取出该useState对应的hook
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    // ...根据queue.pending中保存的update更新state
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```

在`mount`时, 获取`hook`对象.

```js
if (isMount) {
  // mount时为该useState生成hook
  hook = {
    queue: {
      pending: null
    },
    memoizedState: initialState,
    next: null
  }

  // 将hook插入fiber.memoizedState链表末尾
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook;
  } else {
    workInProgressHook.next = hook;
  }
  // 移动workInProgressHook指针
  workInProgressHook = hook;
} else {
  // update时找到对应hook
  hook = workInProgressHook;
  // 移动workInProgressHook指针
  workInProgressHook = workInProgressHook.next;
}
```

当找到`useState`对应的`hook`后, 如果该`hook.queue.pending`不为空, 即存在`update`, 则更新`state`.

```js
// update执行前的初始state
let baseState = hook.memoizedState;

if (hook.queue.pending) {
  // 获取update环状单向链表中第一个update
  let firstUpdate = hook.queue.pending.next;

  do {
    // 执行update action
    const action = firstUpdate.action;
    baseState = action(baseState);
    firstUpdate = firstUpdate.next;

    // 最后一个update执行完后跳出循环
  } while (firstUpdate !== hook.queue.pending.next)

  // 清空queue.pending
  hook.queue.pending = null;
}

// 将update action执行完后的state作为memoizedState
hook.memoizedState = baseState;
```

### 对触发事件进行抽象

最后, 抽象一下React的事件触发方式.

通过调用App返回的click方法模拟组件`click`的行为:

```js
function App() {
  const [num, updateNum] = useState(0);

  console.log(`${isMount ? 'mount' : 'update'} num: `, num);

  return {
    click() {
      updateNum(num => num + 1);
    }
  }
}
```

## Hooks数据结构 

在极简代码中, 我们使用了一个`isMount`来区分`mount`与`update`.

在真实`Hooks`中, 组件`mount`时候的hook与update时的hook来源于不同的对象, 这类对象在源码中被称为`dispatcher`.

```js
// mount时的Dispatcher
const HooksDispatcherOnMount: Dispatcher = {
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  // ...省略
};

// update时的Dispatcher
const HooksDispatcherOnUpdate: Dispatcher = {
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  // ...省略
};
```

所以本质上这里调用的是两个不同的函数. 

在函数式组件render之前, 会根据FunctionComponent对应`fiber`的一下条件区分`mount`和`update`.

```js
current === null || current.memoizedState === null
```

并将不同的情况对应的`dispatcher`赋值给全局变量`ReactCurrentDispath`的`current`属性.

```js
ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;  
```

在函数值组件渲染的时候, 会从`ReactCurrentDispatcher.current`中寻找需要的`hook`.

换句话说, 不同的调用栈上下文为`ReactCurrentDispatcher.current`赋值不同的`dispather`, 则函数式组件渲染的时候调用的`hook`也是不同的函数.

### memoizedState

```js
const hook: Hook = {
  memoizedState: null,

  baseState: null,
  baseQueue: null,
  queue: null,

  next: null,
};
```

其中除了`memoizedState`以外的字段的意义和`updateQueue`是类似的.

> hook和functionComponent fiber中都存在`memorizedState`属性, 但是概念是不一样的:
> - fiber.memoizedState: FunctionComponent对应的fiber保存的是hooks链表
> - hook.memoizedState: Hooks链表中保存的是单一hook对应的数据.

对于不同类型的`hook`的`memoizedState`保存的是不同的类型的数据.

- useState: 保存的是`state`的值
- useReducer: 保存的是`state`的值
- useEffect: 保存包含`useEffect`回调函数, 依赖项等链表数据结构的`effect`.
- useRef: 保存的是`{current: value}`.
- useMemo: 对于`useMemo(callback, [depA])`, 保存的是`[callback(), depA]`
- useCallback: 对于`useCallback(callback, [depA])`, 保存的是`[callback,depA]`. 与`useMemo`的区别在于, useCallback保存的是callback函数本身, 而useMemo保存的是callback函数的执行结果.

部分hooks是没有`memorizedState`的, 比如`useContext`.

## useState 和 useReducer

本质上来说, `useState`只是预置了`reducer`的`useReducer`.

### 流程概览

这两个Hook的工作流程分为'声明阶段'和'调用阶段'. 对于:

```js
function App() {
  const [state, dispatch] = useReducer(reducer, {a: 1});

  const [num, updateNum] = useState(0);
  
  return (
    <div>
      <button onClick={() => dispatch({type: 'a'})}>{state.a}</button>  
      <button onClick={() => updateNum(num => num + 1)}>{num}</button>  
    </div>
  )
}
```

`声明阶段`即`App`调用时, 会依次执行`useReducer`和`useState`方法.
`调用阶段`即点击按钮后, `dispath`或者`updateNum`被调用时.

### 声明阶段

当`FunctionComponent`进入`render阶段`的`beginWork`时, 会调用`renderWithHooks`方法.

该方法内部会执行`FunctionComponent`对应的函数(fiber.type).

对于这两个Hook, 他们的源码大致如下:

```js
function useState(initialState) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
function useReducer(reducer, initialArg, init) {
  var dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
```

在不同的场景下, 同一个Hook会调用不同的处理函数. 以`mount`和`update`为例:

#### mount

此时`useReducer`会调用`mountReducer`, `useState`会调用`mountState`.

简单的对比这两个方法:

```js
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 创建并返回当前的hook
  const hook = mountWorkInProgressHook();

  // ...赋值初始state

  // 创建queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });

  // ...创建dispatch
  return [hook.memoizedState, dispatch];
}

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 创建并返回当前的hook
  const hook = mountWorkInProgressHook();

  // ...赋值初始state

  // 创建queue
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });

  // ...创建dispatch
  return [hook.memoizedState, dispatch];
}
```

其中`mountWorkInProgressHook`方法会创建并返回对应的`hook`, 对应我们极简Hooks实现中`useState`方法的`isMount`逻辑部分.

大致逻辑和那里都是类似的.

#### update

在`update`时, `useReducer`和`useState`调用的是同一个函数`updateReducer`.

```js
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 获取当前hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  
  queue.lastRenderedReducer = reducer;

  // ...同update与updateQueue类似的更新逻辑

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

整体的过程就是:

> 找到对应的hook, 根据`update`计算改`hook`的新`state`并返回.

### 调用阶段

调用阶段会执行`dispatchAction`, 此时`FunctionComponent`对应的`fiber`以及`hook.queue`已经通过调用`bind`方法预先作为参数传入了.

```js
function dispatchAction(fiber, queue, action) {

  // ...创建update
  var update = {
    eventTime: eventTime,
    lane: lane,
    suspenseConfig: suspenseConfig,
    action: action,
    eagerReducer: null,
    eagerState: null,
    next: null
  }; 

  // ...将update加入queue.pending
  
  var alternate = fiber.alternate;

  if (fiber === currentlyRenderingFiber$1 || alternate !== null && alternate === currentlyRenderingFiber$1) {
    // render阶段触发的更新
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  } else {
    if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
      // ...fiber的updateQueue为空，优化路径
    }

    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
```

整个过程就是:

> 创建`update`, 将`update`加入`queue.pending`, 并开启调度.

