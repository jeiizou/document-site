# 基础-Fiber


## 前言

### React 的核心思想

React 的哲学是`App=f(data)`, 框架在内存中维护一个虚拟的 DOM 树, 当数据发生变化的时候, 自动更新虚拟 DOM, 得到一颗新树, 然后 Diff 新老虚拟 DOM 树, 找到变化的部分, 得到一个 Change(Patch), 将这个 Patch 加入队列, 最终批量更新这些 Patch.

### React16 之前

React 工作流程是这样的, 当我们通过`render()`和`setState()`进行组件的渲染和更新的时候, React 主要有两个阶段:

-   `reconciler`:调和阶段, 官方解释, React 会自顶向下通过递归, 遍历新的数据生成新的 VirtualDOM, 然后通过 Diff 算法, 找到需要变更的元素, 放到更新的队列中区.
-   `Renderer`: 渲染阶段, 遍历更新队列, 通过调用宿主环境的 API, 实际更行渲染对应元素. 宿主环境, 比如 DOM, Native, WebGL 等.

在协调阶段, 由于采用递归的遍历方式, 这种也被称为`StackReconcoler`, 主要是为了区别`Fiber Reconciler`而取的一个名称. 这种方式有一个特点, 一单任务开始进行, 就无法终端, js 会之一直用主线程, 一直要等到 virtual dom 结算完成之后, 才能把执行权交给渲染引擎, 会导致用户交互和动画等任务无法立即处理而出现卡段.

所以React16就提出了Fiber结构, 其能够将任务分片, 划分优先级, 同时能够实现类似于操作系统中对线程的抢占式调度, 非常的强大

## 从一个简单程序开始

```js
import React, { Component } from 'react';

export default class ClickCounter extends Component{
    constructor(props) {
        super(props);
        this.state = {count: 0};
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState((state) => {
            return {count: state.count + 1};
        });
    }


    render() {
        return [
            <button key="1" onClick={this.handleClick}>Update counter</button>,
            <span key="2">{this.state.count}</span>
        ]
    }
}
```

这是一个非常简单的组件, 它从render方法返回了两个子元素button和span, 单击button后, 组件的state将在处理程序内更新, 这会导致span元素的文本更新. 

React会在`reconciliation`期间执行各种活动. 例如, 一下是React在上面这个程序中第一次渲染和状态更新之后执行的高级操作:

1. 更新state中的count属性
2. 检索并比较ClickCounter子组件以及props
3. 更新span元素的props

同时, 在`reconciliation`期间, 还会执行其他活动包括调用生命周期方法或更新引用. 所有这些活动在fiber架构中统称为work, work类型通常取决于React元素的类型. 比如, 对于class组件, React需要创建实例, 而function组件就不需要此操作. 并且, React中有许多的元素, 比例, `class/function`组件, Host组件(DOM节点), protals等. React元素的类型由`createElement`函数的第一个参数定义, 此函数通常在`render`方法中用于创建元素. 

总结起来, 就是更新组件的内部状态, 触发`side-effects`执行.

在了解fiber算法之前, 先需要熟悉React内部使用的数据结构.

## 从React Elemnet 到 Fiber Nodes

React中的每个组件都有一个UI表示, 这个UI可以通过调用一个view或者一个从render方法返回. 这是`ClickCounter`组件的模板. 

```js
<button key="1" onClick={this.onClick}>Update counter</button>
<span key="2">{this.state.count}</span>
```

### React Elements

一旦模板通过JSX编译器编译, 就会得到一堆的React元素, 这是从React组件的render方法返回的, 而不是html, 由于我们不需要使用JSX, 因此我们的ClickCounter组件的render方法可以这么写:

```js
class ClickCounter {
    ...
    render() {
        return [
            React.createElement(
                'button',
                {
                    key: '1',
                    onClick: this.onClick
                },
                'Update counter'
            ),
            React.createElement(
                'span',
                {
                    key: '2'
                },
                this.state.count
            )
        ]
    }
}
```

在render方法中调用`React.createElemnet`会创建两个数据结构:

```js
[
    {
        $$typeof: Symbol(react.element),
        type: 'button',
        key: "1",
        props: {
            children: 'Update counter',
            onClick: () => { ... }
        }
    },
    {
        $$typeof: Symbol(react.element),
        type: 'span',
        key: "2",
        props: {
            children: 0
        }
    }
]
```

可以看到React将`$$typeof`属性添加到这些对象, 以将他们唯一的标识位React元素. 然后我们可以通过`type`, `key`以及`props`属性来描述元素. 注意我们这里是如何描述子节点, 文本以及click处理程序的. 实际的代码中还有很多其他字段比如`ref`, 这里不再赘述.

同时, ClickCounter元素还米有任何的props或者key:

```js
{
    $$typeof: Symbol(react.element),
    key: null,
    props: {},
    ref: null,
    type: ClickCounter
}
```

### Fiber Nodes

在`reconciliation`期间, 来自render方法返回的每个React元素的数据被合并到`fiber node`树中, 每个React元素都有一个相应的`fiber node`. 与React元素不同, 每次渲染过程不会再重新创建`fiber`. 这些可变的数据包含组件的state和DOM. 

之前我们说到, 根据React元素的类型, 框架需要执行不同的活动. 在我们实例应用程序中, 对于class组件ClickCounter, 它调用生命周期方法和render方法, 而对于span Host组件, 它执行DOM更新. 因此, 每个React元素都会转换为相应类型的Fiber节点, 用于描述需要完成的工作. 

可以这么认为: Fiber提供了一种数据结构, 用户代表某些worker, 换句话, 就是**一个worker单元, 通过Fiber的架构, 提供了一种跟踪, 调度, 暂停和中止工作的便捷方式**. 

当React元素第一次转换为fiber节点的时候, React使用`createElement`返回的数据来创建Fiber, 这段代码在[createFiberFromTypeAndProps](https://github.com/facebook/react/blob/769b1f270e1251d9dbdce0fcbd9e92e502d059b8/packages/react-reconciler/src/ReactFiber.js#L414)函数中. 在随后的更新中, React重用Fiber节点, 并使用来自相应React元素的数据来更新必要的属性. 如果不再从render方法返回相应的React元素, React可能还要根据key来移动层次结构中的节点或者删除他. 

可以查看[ChildReconciler](https://github.com/facebook/react/blob/95a313ec0b957f71798a69d8e83408f40e76765b/packages/react-reconciler/src/ReactChildFiber.js#L239)函数的实现, 来了解React为现有fiber节点执行的所有活动和相应函数的列表. 因为React为每个React元素创建了一个fiber node, 并且我们也有一个这些元素组成的树, 所以我们也有一个fiber node tree. 

所有的fiber节点都通过使用fiber节点上的`child`, `sibling`和`return`来构成一个`fiber node`的`linked list`(链表). 

![image](/assets/2021-3-9/v2-0ab001d3801fefcd634c9e0339b26545_720w.jpg)

## Current and work in progress trees

在第一次渲染之后, React最终得到一个fiber tree, 它反映了用于渲染UI的应用程序的状态. 这棵树通常被称为`current tree`. 当`React`开始处理更新的时候, 它会构建一个所谓的`workInProgress tree`, 反映了要刷新到屏幕的未来状态. 

所有的work都在`WorkInProgress tree`中的fiber上执行. 当React遍历`current tree`的时候, 对于每个现有的fiber节点, 它会使用`render`方法返回React元素, 以其中的数据创建一个备用的fiber节点, 这些节点用于构成一个备用的`workInProcess tree`, 处理完更新并完成所有相关工作之后, React将备用Tree刷新到屏幕. 一旦这个`workInProgress tree`在屏幕上呈现, 就会变成`current tree`.

React的核心原则之一是一致性. React总是一次更新DOM, 它不会显示部分结果, `WorkInProgress Tree`对用户是不可见的, 因此React可以先处理完所有的组件, 然后将其更改刷新到屏幕. 

在源码中, 我们可以看到很多函数从`current tree`和`workInProgress tree`中获取fiber节点:

```js
function updateHostComponent(current, workInProgress, renderExpirationTime) {...}
```

每个fiber节点都会通过alternate字段保持对另一个树的对应节点的引用. current tree中的节点指向`workInProgress tree`中的备用节点, 反之亦然.

## Side-effects

我们可以将React中的一个组件视为一个使用`state`和`props`来计算UI的函数. 每个其他活动, 比如改变DOM或者调用生命周期的方法, 都应该被认为是`side-effects`. 

fiber节点可以很方便的跟踪effects. 每个fiber节点都有相关的effects, 挂载在`fiber Node`的`effectTag`字段中. 

Fiber中的effects基本上定义了处理更新后需要为实例完成的工作, 对于Host组件(DOM元素), 这些工作包含添加, 更新/删除元素. 对于Class组件, react可能需要更新ref并且调用`componentDidMount`和`componentDidUpdate`声明周期方法. 以及一些其他类型的`fiber`对应的`effects`.

## Effects List

React能够非常快速的更新, 并且为了实现高性能, 它采用了一些有趣的技术. 其中之一是构建带有`side-effects`的fiber节点的线性链表, 其具有快速迭代的效果. 迭代线性链表比树要快的多, 并且没有必要在没有`side effects`的节点上花费时间. 

此链表的目标是标记具有DOM更新或与其关联的其他的Effects的节点, 此列表是`finishedWork tree`的子集, 并使用`nextEffect`属性, 而不是`current`和`WorkInProgress`树中使用的child属性进行链接. 

`effects list`类似于一个圣诞树, 圣诞灯将所有带有`effects`的节点绑定在一起. 为了使这个`effects list`可视化, 我们假定下面这一个`fiber node tree`, 其中橙色的节点都有一些effects需要处理. 例如, 我们的更新导致c2被插入到DOM中, d2和c1被用于更改颜色, 而b2被用于激活生命周期方法. effect list将他们链接在一起, 以便Reacr可以在之后跳过其他的节点

![image](/assets/2021-3-9/v2-b805de025ddf9e4c56e3ac669cea102d_720w.jpg)

你可以看到带有`effects`的节点时如何链接在一起的, 当遍历节点的时候, `React`就是用`firstEffect`指针来开始确定`effects list`的开始位置. 所以上图可以表示为这样的线性列表:

![image](/assets/2021-3-9/v2-99b799d44b1f32c2d493ef61398ca8cf_720w.png)

## Root of fiber tree

每个React应用程序都有一个或者多个作为`container`的DOM元素. 在我们的例子中, 它是带有id为`container`的div元素:

```js
const domContainer = document.querySelector('#container');
ReactDOM.render(React.createElement(ClickCounter), domContainer);
```

React为container创建一个`fiber root`对象, 可以使用对DOM元素的引用来访问它: 

```js
const fiberRoot = query('#container')._reactRootContainer._interalRoot
```

这个`fiber root`是React保存对`fiber tree`引用的地方, 它存储在`fiber tree`的current属性中.

```js
const hostRootFiberNode = fiberRoot.current
```

`fiber tree`以特殊类型的fiber节点(HostRoot)开始, 它是在内部创建的, 并充当最顶层组件的父级, HostRoot fiber节点通过stateNode属性指向FiberRoot.

```js
fiberRoot.current.stateNode === fiberRoot; // true
```

可以通过fiber root访问最顶端的HostRoot的fiber node来探索fiber tree. 或者, 可以从组件实例中获取单个fiber节点, 如下:

```js
compInstance._reactInternalFiber
```

## Fiber node structure

现在让我们看下为ClickCounter组件创建的fiber节点的结构:

```js
{
    stateNode: new ClickCounter,
    type: ClickCounter,
    alternate: null,
    key: null,
    updateQueue: null,
    memoizedState: {count: 0},
    pendingProps: {},
    memoizedProps: {},
    tag: 1,
    effectTag: 0,
    nextEffect: null
}
```

以及span节点:

```js
{
    stateNode: new HTMLSpanElement,
    type: "span",
    alternate: null,
    key: "2",
    updateQueue: null,
    memoizedState: null,
    pendingProps: {children: 0},
    memoizedProps: {children: 0},
    tag: 5,
    effectTag: 0,
    nextEffect: null
}
```

fiber节点上有很多的字段, 我在前面的部分描述了`alternate`字段, `effectTag`和`nextEffect`的用途, 现在让我们看看为什么我们需要其他的字段:

- **stateNode**: 保存对组件的类实例, DOM节点或者与fiber节点关联的其他React元素类型的引用, 一般来说, 可以认为这个属性用于保存于fiber相关的本地状态
- **type**: 定义于此fiber关联的功能或者类. 对于类组件, 它指向构造函数; 对于DOM元素, 它指定HTML tag. 可以使用这个字段来理解fiber节点与哪个元素相关
- **tag**: 定义fiber的类型. 它在reconcile算法中用于确定需要完成的工作. 如前所偶数, 工作取决于React元素的类型, 函数createFiberFromTypeAndProps将React元素映射到相应的fiber节点类型. 在我们应用程序中, ClickCounter组件的属性标记是1, 表示`ClassCompnent`, 而`span`元素的标记是5, 表示`Host Component`.
- **updateQueue**: 用于状态更新, 回调函数, DOM更新的队列
- **memoizedState**: 用于创建输出的fiber状态. 处理更新时, 它会反映当前在屏幕上呈现的状态
- **memoizedProps**: 在前一次渲染期间用于创建输出的props
- **pendingProps**: 已从React元素中的新数据更新, 并且需要应用于子组件或者DOM元素的props
- **key**: 具有一组children的唯一标识符, 可以帮助React确定哪些项已经更改, 已添加或从列表中删除. 它与此处描述的React的`list and key`有关

在上面的解释中省略了一堆字段，尤其跳过了`child`，`sibling`和`return`，组成了树数据结构。以及特定于`Scheduler`的`expirationTime`，`childExpirationTime`和`mode`等字段类别。

## General Algorithm

React 将一次渲染分为两个阶段: `render`和`commit`

在render阶段, React通过`setState`或者`React.render`来执行组件的更新, 并确定需要在UI中更新的内容. 如果是第一次渲染, React会为render方法返回的每个元素, 创建一个新的fiber节点. 在接下来的更新中, 将重用和更新现有的React元素的fiber节点. **render阶段的结果是生成一个部分节点标记了side effects的fiber节点树**, side effects描述了在下一个commit阶段需要完成的工作。在此阶段，React采用标有side effects的fiber树并将其应用于实例。它遍历side effects列表并执行DOM更新和用户可见的其他更改。

一个很重要的点在于: render阶段是可以异步执行的. React可以根据可用时间来处理一个或者多个fiber节点, 然后停止已经完成的工作, 并且让出调度权来处理某些事件. 然后它从它停止的地方继续. 但有时候, 它可能需要丢弃完成的工作并在此从头. 由于render阶段执行的工作不会导致任何用户可见的更改, 所以这些暂停是没问题的. 相反, 在接下来的commit阶段始终是同步, 因此在此阶段执行的工作, 将会生成用户可见的变化. 例如DOM更新, 所以React需要一次性的完成他们.

调用生命周期方法是React执行的一种工作。在render阶段调用某些方法，在commit阶段调用其他方法。在render阶段时调用的生命周期列表如下：

- `[UNSAFE_]`componentWillMount (**已废弃**)
- `[UNSAFE_]`componentWillReceiveProps (**已废弃**)
- getDerivedStateFromProps
- shouldComponentUpdate
- `[UNSAFE_]`componentWillUpdate (**已废弃**)
- render

可以看到，在render阶段执行的一些遗留生命周期方法在react 16.3中标记为`UNSAFE`。它们现在在文档中称为遗留生命周期，将在未来的16.x版本中弃用，而没有UNSAFE前缀的版本将在17.0中删除。可以在此处详细了解这些更改以及建议的迁移路径。

**为什么会废弃这些声明周期函数呢呢？**

因为在render阶段不会产生像DOM更新这样的副作用，所以React可以异步处理与组件异步的更新（甚至可能在多个线程中执行）。然而，标有UNSAFE的生命周期经常被误解和滥用，开发人员倾向于将带有副作用的代码放在这些方法中，这可能会导致新的异步渲染方法出现问题。虽然只有没有UNSAFE前缀的副本会被删除，但它们仍然可能在即将出现的concurrent模式中引起问题。

以下是commit阶段执行的生命周期方法列表：

- getSnapshotBeforeUpdate
- componentDidMount
- componentDidUpdate
- componentWillUnmount

因为这些方法在同步commit阶段执行, 所以他们可能包含副作用并获取DOM

### Render 阶段

`reconciliation`算法始终使用renderRoot函数从最顶端的`HostRoot fiber`节点开始. 但是, React会跳过已经处理过的fiber节点, 直到找到未完成工作的节点. 例如, 如果在组件树中调用`setState`, 则React将从顶部开始, 但会快速的跳过父节点, 直到到达调用了setState方法的组件. 

#### Main steps of the work loop

所有的fiber节点都在`work loop`中处理. 这是循环的同步部分的实现. 

```js
function workLoop(isYieldy) {
  if (!isYieldy) {
    while (nextUnitOfWork !== null) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
  } else {...}
}
```

在上面的代码中, `nextUnitOfWork`从`workInProress`树种保存对`fiber`节点(这些节点有部分任务要处理)的引用. 当React遍历Fibers树时, 它是使用此变量来直到是否有任何其他fiber节点具有未完成的工作. 处理当前fiber后, 变量将包含对树种下一个fiber节点的引用或`null`. 在这种情况下, React退出工作循环并准备提交更改.

有4个主要功能用于遍历树并启动或完成工作:

- performUnitOfWork
- beginWork
- completeUnitOfWork
- completeWork

要演示如何使用它们，请查看以下遍历fiber树的动画。已经在演示中使用了这些函数的简化实现。每个函数都需要一个fiber节点进行处理，当React从树上下来时，可以看到当前活动的fiber节点发生了变化，可以清楚地看到算法如何从一个分支转到另一个分支。它首先完成child 节点的工作，然后转移到parent身边.

![alt](https://pic2.zhimg.com/v2-4d6d43020835a41fd20492f29aea1a41_b.webp)

> 注意，垂直连接表示sibling，而弯曲的连接表示child，例如b1没有child，而b2有一个childc1.

可以简单的看到，这里适用的树遍历算法是深度优先搜索(DFS). 这里是[视频的连接](https://vimeo.com/302222454)

从前两个函数performUnitOfWork和beginWork开始:

```js
function performUnitOfWork(workInProgress) {
    let next = beginWork(workInProgress);
    if (next === null) {
        next = completeUnitOfWork(workInProgress);
    }
    return next;
}

function beginWork(workInProgress) {
    console.log('work performed for ' + workInProgress.name);
    return workInProgress.child;
}
```

`performUnitOfWork`函数从`workInProgress`树种接受fiber节点, 并通过调用`beginWork`函数启动工作, 即通过这个函数启动fiber需要执行的所有活动. 出于演示的目的, 我们只需要记录fiber的名称即可表示已完成工作. beginWork函数始终返回要在循环处理的下一个子节点的指针或null.

如果有下一个子节点, 它将被复制给workLoop函数中的nextUnitOfWork变量. 但是, 如果没有子节点, React知道它到达了分支的末尾, 因此它就完成当前节点. 一旦节点完成, 它将需要为兄弟节点执行工作并在此之后回溯到父节点. 这是在`completeUnitOfWork`函数中完成的

```js
function completeUnitOfWork(workInProgress) {
    while (true) {
        let returnFiber = workInProgress.return;
        let siblingFiber = workInProgress.sibling;

        nextUnitOfWork = completeWork(workInProgress);

        if (siblingFiber !== null) {
            // If there is a sibling, return it
            // to perform work for this sibling
            return siblingFiber;
        } else if (returnFiber !== null) {
            // If there's no more work in this returnFiber,
            // continue the loop to complete the parent.
            workInProgress = returnFiber;
            continue;
        } else {
            // We've reached the root.
            return null;
        }
    }
}

function completeWork(workInProgress) {
    console.log('work completed for ' + workInProgress.name);
    return null;
}
```

可以看到函数的重点是一个很大的循环。当`workInProgress`节点没有子节点时，React会进入此函数。完成当前fiber的工作后，它会检查是否有兄弟节点；如果找到，React退出该函数并返回指向兄弟节点的指针。它将被赋值给`nextUnitOfWork`变量，React将从这个兄弟开始执行分支的工作。重要的是要理解，在这一点上，React只完成了前面兄弟姐妹的工作。它尚未完成父节点的工作，只有在完成所有子节点工作后，才能完成父节点和回溯的工作.

从实现中可以看出，`performUnitOfWork`和`completeUnitOfWork`主要用于迭代目的，而主要活动则在`beginWork`和`completeWork`函数中进行。在后面的部分，我们将了解当React进入`beginWork`和`completeWork`函数时，`ClickCounter`组件和`span`节点会发生什么.

### Commit phase

该阶段以`completeRoot`函数开始，这是React更新DOM并调用`mutation`生命周期方法的地方。

当React进入这个阶段时，它有2棵树和`effects list`。第一棵树是`current tree`, 表示当前在屏幕上呈现的状态，然后是在渲染阶段构建了一个备用树，它在源代码中称为`finishedWork`或`workInProgress`，表示需要在屏幕上反映的状态。此备用树通过子节点和兄弟节点指针来与`current`树类似地链接。

然后，有一个`effects list` - 通过`nextEffect`指针链接的，`finishedWork`树中节点的子集。请记住，`effects list `是`render`阶段运行的结果。`render`阶段的重点是确定需要插入，更新或删除哪些节点，以及哪些组件需要调用其生命周期方法，其最终生成了`effects list`，也正是在提交阶段迭代的节点集。

出于调试目的，可以通过`fiber root`的`current`属性访`current tree`，可以通过`current tree`中`HostFiber`节点的`alternate`属性访问`finishedWork`树。

在提交阶段运行的主要功能是`commitRoot`。它会执行以下操作:

- 在标记了`Snapshot effect`的节点上使用getSnapshotBeforeUpdate生命周期方法
- 在标记了`Deletion effect`的节点上调用componentWillUnmount生命周期方法
- 执行所有DOM插入，更新和删除
- 将`finishedWork`树设置为current树
- 在标记了`Placement effect`的节点上调用componentDidMount生命周期方法
- 在标记了`Update effect`的节点上调用componentDidUpdate生命周期方法

在调用pre-mutation方法`getSnapshotBeforeUpdate`之后，React会在树中提交所有`side-effects`。

它通过两个部分: 第一个部分执行所有DOM插入, 更新, 删除和ref卸载, 然后, React将finishedWork树分配给FiberRoot, 将workInProgress树标记为current树. 前面这些都是在commit阶段的第一部分完成的, 因此在`componentWillUnmount`中指向的仍然是前一个树，但在第二部分之前，因此在`componentDidMount / Update`中指向的是最新的树。在第二部分中，React调用所有其他生命周期方法和`ref callback`, 这些方法将会单独执行，因此已经调用了整个树中的所有放置(`placement`)，更新和删除.

下面这段代码运行上述步骤的函数的要点，其中`root.current=finishWork`及以前为第一部分，其之后为第二部分.

```js
function commitRoot(root, finishedWork) {
    commitBeforeMutationLifecycles()
    commitAllHostEffects();
    root.current = finishedWork;
    commitAllLifeCycles();
}
```

这些子函数中的每一个都实现了一个循环，该循环遍历`effects list并`检查`effect`的类型, 当它找到与函数功能相关的`effects`时，就会执行它.

#### Pre-mutation lifecycle methods

例如，这是在`effect tree`上迭代并检查节点是否具有`Snapshot effect`的代码:

```js
function commitBeforeMutationLifecycles() {
    while (nextEffect !== null) {
        const effectTag = nextEffect.effectTag;
        if (effectTag & Snapshot) {
            const current = nextEffect.alternate;
            commitBeforeMutationLifeCycles(current, nextEffect);
        }
        nextEffect = nextEffect.nextEffect;
    }
}
```

对于类组件，该effect意味着调用`getSnapshotBeforeUpdate`生命周期方法.

## DOM updates

`commitAllHostEffects`是React执行DOM更新的函数。该函数基本上定义了需要为节点完成并执行它的操作类型.

```js
unction commitAllHostEffects() {
    switch (primaryEffectTag) {
        case Placement: {
            commitPlacement(nextEffect);
            ...
        }
        case PlacementAndUpdate: {
            commitPlacement(nextEffect);
            commitWork(current, nextEffect);
            ...
        }
        case Update: {
            commitWork(current, nextEffect);
            ...
        }
        case Deletion: {
            commitDeletion(nextEffect);
            ...
        }
    }
}
```

有趣的是，React调用`componentWillUnmount`方法作为`commitDeletion`函数中删除过程的一部分.

### Post-mutation lifecycle methods

`commitAllLifecycles`是React调用所有剩余生命周期方法`componentDidUpdate`和`componentDidMount`的函数.

## 参考链接

- [Deep In React之浅谈 React Fiber 架构(一)](https://mp.weixin.qq.com/s/dONYc-Y96baiXBXpwh1w3A)
- [[译]深入React fiber架构及源码](https://zhuanlan.zhihu.com/p/57346388)