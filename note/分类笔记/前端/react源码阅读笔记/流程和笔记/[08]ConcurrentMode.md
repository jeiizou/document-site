# [08]Concurrent Mode

Concurrent Mode 是一组React的新功能, 可以帮助应用保持响应, 并且根据用户的设备性能和网速进行适当的调整.

## 概览

1. 底层架构--Fiber架构, 将单个组件作为工作单元, 使得以组件为粒度的异步可中断的更新称为可能
2. 架构的驱动力--Scheduler, 配合事件切片, 根据宿主环境的性能, 为每一个工作单元分配一个可运行时间, 可以实现"异步可中断的更新", 这就是所谓的调度器
3. 架构运行策略--lane模型. 当一次更新在运行过程中被中断, 转而开始一次新的更新, 我们可以说后面一次更新打断了前一次的更新. 这就是就县级的概念. 用于控制优先级如何打断, 优先级的升降, 赋予更新以一定的优先级. 这整个策略就是lane模型
4. 上层实现: 
   1. `batchedUpdates`: 合并更新
   2. `Suspense`: 阻断状态
   3. `useDeferredValue`: 返回一个延迟响应的值, 用于返回一个低优先级的值

## Scheduler原理和实现

Scheduler包含两个功能:

1. 时间切片
2. 优先级调度

### 时间切片原理

时间切片的本质是模拟实现`requestIdleCallback`.

这里是浏览器一帧中可以用于执行JS的时机流程:

```js
一个task(宏任务) -- 队列中全部job(微任务) -- requestAnimationFrame -- 浏览器重排/重绘 -- requestIdleCallback
```

`requestIdleCallback`是在浏览器重排和重绘后如果当前帧还有空余时间是被调用的.

浏览器并没有提供其他API能够在同样的时机去调用以模拟其实现.

唯一能够进准控制调用时机的API是`requestAnimationFrame`, 它能够让我们在浏览器重绘和重排之前执行JS.

所以退而求其次, Scheduler的时间切片是通过`task`来实现的.

常见的`task`当属于`setTimeout`, 不过还有一个`MessageChannel`, 它的执行时间更加的考前.

所以`Scgeduler`将需要被执行的回调函数作为`MessageChannel`的回调执行, 如果当前宿主环境不支持, 则退化为`setTImeout`.

在React的render阶段, 开启`Concurrent Mode`, 每次遍历前, 都会通过`Scheduler`提供的`shouldYield`方法来判断是否需要中断遍历, 使浏览器有时间去渲染:

```js
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

是否中断的依据, 最重要的一点就是每个任务的剩余时间是否用完了.

在`Scheduler`中, 为任务分配的初始剩余时间是`5ms`.

随着应用的运行, 会通过`fps`动态的调整分配给任务的可执行时间.

### 优先级调度

`Scheduler`是独立于`React`的包, 所以其定义的优先级也是独立于`React`的.

`Scheduler`对外暴露的一个方法`unstable_runWithPriority`接受一个优先级和一个回调函数, 在回调函数内部调用获取优先级的方法都会取得第一个参数对应的优先级.

```js
function unstable_runWithPriority(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
  }

  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}
```

`Scheduler`内部存在5中优先级.

在React内部涉及到优先级调度的地方, 都会使用`unstable_runWithPriority`.

比如, 我们知道`commit`阶段是同步执行的, 可以看到`commit`阶段的起点`commitRoot`方法的优先级为`ImmediateSchedulerPriority`, 即`ImmediatePriority`的别名, 为最高优先级, 会立即执行.

```js
function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel),
  );
  return null;
}
```

### 优先级的定义

不同的优先级以为这不同时长的任务过期时间:

```js
var timeout;
switch (priorityLevel) {
  case ImmediatePriority:
    timeout = IMMEDIATE_PRIORITY_TIMEOUT;
    break;
  case UserBlockingPriority:
    timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
    break;
  case IdlePriority:
    timeout = IDLE_PRIORITY_TIMEOUT;
    break;
  case LowPriority:
    timeout = LOW_PRIORITY_TIMEOUT;
    break;
  case NormalPriority:
  default:
    timeout = NORMAL_PRIORITY_TIMEOUT;
    break;
}

var expirationTime = startTime + timeout;
```

其中:

```js
// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
```

如果一个优先级是`ImmediatePriority`, 对应的过期时间是-1, 则`var expirationTime = startTime - 1;`

表示该任务的过期时间比当前时间还要段, 已经过期了, 需要立即被执行.

### 不同优先级任务的排序

优先级意味着任务的过期时间. 在一个大型的React项目的某一刻中, 存在很多不同优先级的任务, 对应不同的过期时间.

因为任务是可以被延迟的, 所以, 我们可以把这些任务按是否被延迟分为:

- 已就绪任务
- 未就绪任务

```js
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      // 任务被延迟
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }
```

所以, 在`Scheduler`存在两个队列:

- timeQueue: 保存未就绪任务
- taskQueue: 保存已就绪任务

每当有新的未就绪任务被注册, 我们就将其插入`timerQueue`并根据开始时间重新排列`timerQueue`中任务的顺序

当`timeQueue`中有任务就绪, 就将其取出加入`taskQueue`

并且取出`taskQueue`最早过期的任务并且执行.

## lane 模型

在React中, 存在多种使用不同优先级的情况, 比如:

- 过期任务或者同步任务使用同步优先级
- 用户交互产生的更新使用高优先级
- 网络请求产生的更新使用一般优先级
- suspense使用低优先级.

所以React需要设计一套满足如下需要的优先级机制:

- 可以表示优先级的不同
- 可能同时存在几个同优先级的更新, 所以还要能表示批的概念
- 方便进行优先级相关的计算.

这就是React的lane模型.

lane模型借鉴了赛道的概念, 使用31为的二进制表示31条赛道, 位数越小的赛道优先级越高. 某些相邻的赛道拥有相同的优先级.

```js
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /*      */ 0b0000000000000000000000000000100;
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;

const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000100000;
const InputContinuousLanes: Lanes = /*                  */ 0b0000000000000000000000011000000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000100000000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000001000000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000011110000000000000000000000;

export const SomeRetryLane: Lanes = /*                  */ 0b0000010000000000000000000000000;

export const SelectiveHydrationLane: Lane = /*          */ 0b0000100000000000000000000000000;

const NonIdleLanes = /*                                 */ 0b0000111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0001000000000000000000000000000;
const IdleLanes: Lanes = /*                             */ 0b0110000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;
```

其中, 同步优先级占用赛道的第一位, 从`SynvLane`往下, 赛道的优先级逐步的降低.

### 批概念

其中有几个变量占用了多条赛道.

这就用来表示批, 称为`lanes`, 区别于优先级的`lane`.

```js
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;
```

其中, `InputDiscreteLanes`用来表示用户交互产生的更新拥有的优先级范围.

`DefaultLanes`表示请求数据返回后触发的更新.

`TransitionLanes`是`Suspense`,`useTransition`, `useDeferredValue`拥有的优先级范围.

其中还有一个细节, 越低的优先级站用电额`lanes`越多.

因为越低的优先级更新越容易被打断, 导致积压下来, 所以需要更多的位, 反之, 越高的最高的同步更新就不需要同步的lanes.

### 便于计算

由于赛道的设计, 优先级计算本质上就是位运算.

比如计算`lane`是否有交集:

```js
export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
  return (a & b) !== NoLanes;
}
```

是否是子集:

```js
export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane) {
  return (set & subset) === subset;
}
```

合并:

```js
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}
```

移除:

```js
export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;
}
```
