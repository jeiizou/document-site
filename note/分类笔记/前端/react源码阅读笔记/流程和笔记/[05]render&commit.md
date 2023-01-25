# [05]render&commit

## render阶段

redner阶段整体是一个递归的过程, 整个递归的过程也能分成两个阶段的步骤:

- 向下的深度优先遍历阶段(beginWork)
- 向上的回溯阶段(completeWork)

### beginWork

向下遍历的过程会调用`beginWork`方法, 其工作内容是传入当前的`Fiber`节点,创建子`fiber`节点. 

根据当前的`current fiber tree`是否存在(首次挂载的时候没有`current fiber tree`):

- update: 尽量复用当前节点并update
- mount: 根据不同的`fiber.tag`类型创建不同类型的`fiber`子节点.

update的过程中会调用`reconcileChildren`进行组件的diff.

`reconcileChildren`与`mountChildFiber`的逻辑大致是类似的, 区别在于会给`fiber`节点带上`effetcTag`属性, 而后者不会.

```js
// DOM需要插入到页面中
export const Placement = /*                */ 0b00000000000010;
// DOM需要更新
export const Update = /*                   */ 0b00000000000100;
// DOM需要插入到页面中并更新
export const PlacementAndUpdate = /*       */ 0b00000000000110;
// DOM需要删除
export const Deletion = /*                 */ 0b00000000001000;
```

所谓的`effectTag`表示了不同的`update`操作.

### completeWork

回溯的过程中,主要执行`completeWork`方法, `completeWork`也就是针对不同的`fiber.tag`执行不同的处理逻辑.

```js
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;
    case ClassComponent: {
      // ...省略
      return null;
    }
    case HostRoot: {
      // ...省略
      updateHostContainer(workInProgress);
      return null;
    }
    case HostComponent: {
      // ...省略
      return null;
    }
  // ...省略
```

#### 处理HostComponent

其中`HostComponent`是处理DOM元素的逻辑分支.

- update:
  - 处理回调函数的注册
  - 处理style
  - 处理其他prop
- mount:
  - 生成对应的DOM节点
  - 处理子组件
  - 类似update处理prop

#### effectList

在render阶段, 我们遍历了整个dom树来找到所有有`effectTag`的`fiber`节点并且执行对应的操作. 

为了减少在`commit`阶段遍历的开销, 在每个执行完成的`completeWork`并且存在`effectTag`的`fiber`节点会被保存在一条`effectList`的单向链表中.

`effectList`中的第一个`fiber`节点保存在`fiber.firstEffect`, 最后一个元素保存在`fiber.lastEffect`.

然后在向上的回溯过程中, 所有有`effectTag`的`fiber`节点都会被追加到`effectList`中, 最终形成一条以`rootFiber.firstEffect`为起点的**单向链表**.

```js
             nextEffect         nextEffect
rootFiber.firstEffect -----------> fiber -----------> fiber
```

## commit 阶段

`commit`阶段的工作,主要是`renderer`的工作, 从过程阶段来说可以分成三个部分:

- before mutation 阶段
- mutation 阶段
- layout 阶段

根据我们在`render`阶段获得到的`effectList`单向链, 在这个阶段会依次的执行链上每个`fiber`节点.

这些节点上的`updateQueue`保存了变化的prop.

在layout阶段之后还有一些额外的工作, 比如`useEffect`的触发, `优先级`的重置, `ref`的绑定和解绑等等. 

### before mutation 之前

这个部分对应执行DOM操作之前, 主要进行一些变量赋值, 状态重置的工作.

```js
do {
    // 触发useEffect回调与其他同步任务。由于这些任务可能触发新的渲染，所以这里要一直遍历执行直到没有任务
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);

  // root指 fiberRootNode
  // root.finishedWork指当前应用的rootFiber
  const finishedWork = root.finishedWork;

  // 凡是变量名带lane的都是优先级相关
  const lanes = root.finishedLanes;
  if (finishedWork === null) {
    return null;
  }
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  // 重置Scheduler绑定的回调函数
  root.callbackNode = null;
  root.callbackId = NoLanes;

  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
  // 重置优先级相关变量
  markRootFinished(root, remainingLanes);

  // 清除已完成的discrete updates，例如：用户鼠标点击触发的更新。
  if (rootsWithPendingDiscreteUpdates !== null) {
    if (
      !hasDiscreteLanes(remainingLanes) &&
      rootsWithPendingDiscreteUpdates.has(root)
    ) {
      rootsWithPendingDiscreteUpdates.delete(root);
    }
  }

  // 重置全局变量
  if (root === workInProgressRoot) {
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  } else {
  }

  // 将effectList赋值给firstEffect
  // 由于每个fiber的effectList只包含他的子孙节点
  // 所以根节点如果有effectTag则不会被包含进来
  // 所以这里将有effectTag的根节点插入到effectList尾部
  // 这样才能保证有effect的fiber都在effectList中
  let firstEffect;
  if (finishedWork.effectTag > PerformedWork) {
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // 根节点没有effectTag
    firstEffect = finishedWork.firstEffect;
  }
```

这里主要看`firstEffect`

### layout 之后

layout之后主要进行:

1. `useEffect`相关的处理
2. 性能追踪相关
3. 在`commit`阶段会触发一些生命周期的钩子, 这些回调方法中可能触发新的更新, 新的更新会开启新的`render-commit`.

```js
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

// useEffect相关
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
} else {}

// 性能优化相关
if (remainingLanes !== NoLanes) {
  if (enableSchedulerTracing) {
    // ...
  }
} else {
  // ...
}

// 性能优化相关
if (enableSchedulerTracing) {
  if (!rootDidHavePassiveEffects) {
    // ...
  }
}

// ...检测无限循环的同步任务
if (remainingLanes === SyncLane) {
  // ...
} 

// 在离开commitRoot函数前调用，触发一次新的调度，确保任何附加的任务被调度
ensureRootIsScheduled(root, now());

// ...处理未捕获错误及老版本遗留的边界问题


// 执行同步任务，这样同步任务不需要等到下次事件循环再执行
// 比如在 componentDidMount 中执行 setState 创建的更新会在这里被同步执行
// 或useLayoutEffect
flushSyncCallbackQueue();

return null;
```

### before mutation

这个阶段主要是遍历`effectList`并且调用`commitBeforeMutationEffects`.

```js
function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const current = nextEffect.alternate;

    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // ...focus blur相关
    }

    const effectTag = nextEffect.effectTag;

    // 调用getSnapshotBeforeUpdate
    if ((effectTag & Snapshot) !== NoEffect) {
      commitBeforeMutationEffectOnFiber(current, nextEffect);
    }

    // 调度useEffect
    if ((effectTag & Passive) !== NoEffect) {
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```

这里主要进行三个动作:

1. 处理DOM节点渲染或者删除之后的`autoFouce`, `blur`逻辑.
2. 调用`getSnapshotBeforeUpdate`, 因为在fiber架构中, `render`阶段是可以被取消或者重复多次的, 原来的`componentWill`生命周期就不安全了, `getSnapshotBeforeUpdate`是用来替代对应的钩子方法的.
3. 调度`useEffect`, 触发一个异步调度的函数`flushPassiveEffects`. 

#### flushPassiveEffects

`flushPassiveEffects`从全局变量`rootWithPendingPassiveEffects`中获取`effectList`, 然后执行其中的`effect`回调函数. 

其中`rootWithPendingPassiveEffects`会在`layout`阶段之后由`rootDoesHavePassiveEffects`决定是否复制.

从这里看来, 整个`useEffect`的调用分成三个部分:

- `before mutation`阶段, 在`scheduleCallback`中调用`flushPassiveEffects`
- `layout`阶段之后, 将`effectList`赋值给`rootWithPendingPassiveEffects`
- `scheduleCallback`触发`flushPassiveEfffects`, `flushPassiveEffects`内部遍历`rootWithPendingPassiveEffects`

### mutation

mutation阶段其实也是在遍历`effectList`, 执行函数, 不过执行的是`commitMutationEffects`.

`commitMutationEffects`会遍历`effectList`, 对每个`fiber`节点执行三个操作:

1. 根据`ContentReset`重置文字节点
2. 更新ref
3. 根据`effectTag`去分别处理Placement,Update, Deletion
   1. PlaceMent: 插入DOM节点
   2. Update: 更新DOM节点
   3. Deletion: 删除DOM节点

### layout

该阶段的代码在`DOM`渲染完成以后执行的, 该阶段触发的钩子和`hook`可以访问到改变后的`DOM`.

和前两个阶段类似, layout阶段会遍历`effectList`, 执行函数`commitLayoutEffects`.

```js
root.current = finishedWork;

nextEffect = firstEffect;
do {
  try {
    commitLayoutEffects(root, lanes);
  } catch (error) {
    invariant(nextEffect !== null, "Should be working on an effect.");
    captureCommitPhaseError(nextEffect, error);
    nextEffect = nextEffect.nextEffect;
  }
} while (nextEffect !== null);

nextEffect = null;
```

其中`commitLayoutEffects`干了两件事:

#### commitLayoutEffectOnFiber

`commitLayoutEffectOnFiber`: 调用生命周期钩子和hook相关操作.

1. 对于类组件: 调用类中的`componentDidMount`或者`componentDidUpdate`, 以及`setState`中的回调
2. 对于函数组件: 调用函数中的`useLayoutEffect`的hook的回到函数, 调度`useEffct`的销毁和回调函数.

`useLayoutEffect`与`useEffect`的区别在于:

`useLayoutEffect`是同步执行的.

而`useEffect`是则需要先调度, 在`Layout阶段`完成以后再异步执行.

#### commitAttachRef

`commitLayoutEffects`中做的第二件事是`commitAttachRef`.

这部分简单的来说: 获取DOM的示例, 更新`ref`.

## 切换Fiber tree

到这里, `layout`阶段就结束了. 然后会切换双缓存机制中的`fiber`树. 
