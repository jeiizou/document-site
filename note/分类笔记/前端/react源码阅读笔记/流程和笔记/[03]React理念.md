# [03]React理念

React理念简单来说概括就是"快速响应"

## 老架构

在React15中, 架构分为两层:

- Reconciler(协调器), 负责找出变化的组件
- Renderer(渲染器), 负责将变化的组件渲染到页面上

在`react`中, 通过`this.setState`, `this.forceUpdate`, `ReactDOM.reander`等API触发更新. 

### Reconciler

当每次有更新发生的时候, 就会触发`Reconciler`的工作:

- 调用函数组或者class组建的`render`方法, 将返回的`JSX`转化为虚拟`DOM`.
- 将虚拟DOM和上次更新时的虚拟`DOM`对比
- 通过对比找出本次更新中变化的虚拟DOM
- 通知`renderer`将变化的虚拟DOM渲染到页面上

### Renderer

每次更新的时候， `renderer`接受到`reconcoler`的通知, 将变化的组件渲染在当前的宿主环境中.

除了我们最常用的`react-dom`是负责在浏览器环境渲染的库, 还有其他渲染库, 比如:

- ReactNative, 用来渲染APP原生组件
- ReactTest, 用来渲染出纯JS对象用于测试
- ReactArt, 用来渲染出Canvas, SVG或者VML

### 缺点

在`reconsoler`中, `mount`的组件会调用`mountComponent`, `update`的组件会调用`updateComponent`方法, 然后递归的更新子组件.

递归执行的缺点在于, 一旦更新开始, 中途就无法中断, 当递归更新超过16ms的时候, 用户的交互就会卡顿.

## 新架构

为了解决卡顿的问题, 新的架构在渲染层面分为三层:

- Scheduler(调度器), 调度任务的优先级, 高优先级任务优先进入reconsiler
- Reconiler(协调器), 负责找出变化的组件
- Renderer(渲染器), 负责将变化的组件渲染到页面上

相较于React15, React16中新增了调度器.

### Scheduler 调度器

我们以浏览器是否有剩余时间作为任务终端的标准, 那么我需要建立一种机制, 当浏览器有剩余时间的时候通知我们.

其实部分的浏览器已经实现了这个api, 也就是`requestIdleCallback`. 但是这个api有两个问题:

- 兼容性不好
- 在切换tab之后, 之前注册的`callback`触发的频率会变低.

所以react实现了自己的`requestIdleCallback`的`polyfill`, 也就是`scheduler`.

除了在空闲的时候触发回调, `scheduler`还提供了多种调度优先级来进行设置.

这个库是可以脱离react单独使用的.

### Reconciler 协调器

在旧有架构中, reconciler是递归处理虚拟dom的, 在新的架构中, 更新工作变成了可以中断的循环过程, 每次的循环都会调用`shouldYield`来判断当前是否有剩余时间.

```js
/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

那么问题来了, 更新中断的时候, DOM会渲染不完全, 这个问题怎么解决?

在新的架构中, reconciler和renderer不再是交替的工作. 当cheduler将任务交给reconciler后, reconciler会为变化的虚拟dom打上代表`增/删/更新`的标记, 类似:

```js
export const Placement = /*             */ 0b0000000000010;
export const Update = /*                */ 0b0000000000100;
export const PlacementAndUpdate = /*    */ 0b0000000000110;
export const Deletion = /*              */ 0b0000000001000;
```

整个Scheduler和Reconciler的工作都在内存中进行. 当所有的组件完成`Reconciler`的工作, 就会统一的交给`renderer`.

### Render 

然后, 渲染器根据最终的Reconciler为虚拟DOM打的标记, 同步执行对应的DOM操作

`Scheduler`和`Reconciler`的工作会被优先级更高的任务, 或者因为当前帧没有剩余时间了而发生中断.

由于这部分的工作是在内存中进行的, 所以不会更新页面上的DOM, 即便是反复的中断, 用户也不会看见更新不完全的情况.

