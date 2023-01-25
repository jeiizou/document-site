# [02]FiberArchitecture

React Fiber 是React核心算法的重新实现, 主要的特性是:

- 渐进式渲染
- 可暂停, 取消和重用渲染
- 给不同更新分配优先级
- 并发渲染

## 基本概念 

- 协调器: 进行diff的算法
- 更新: React中应用数据的一次变化. 会导致重新渲染.
- work: 任何必须执行的计算. 通常是更新的结果

### 什么是Fiber

Fiber的主要目的在于能够解决:

- 暂停工作, 稍后回来
- 给不同类型的工作分配优先级
- 重用之前已经完成的工作
- 当工作不再需要的时候取消

为了做到这一点, 我们需要将工作分解为单元. Fiber本质上就是代表了一种工作的单位.

计算机通常跟踪程序执行的方式是使用调用堆栈, 执行函数的时候, 会把新的堆栈帧推入堆栈中. 

每个堆栈都会执行完毕, 直到堆栈被清空为止.

在现代浏览器中, 是有一种`requestIdleCallback`的API, 不同于堆栈调用, 它会在空闲期间调用. 而`requestAnimationFrame`则是会在动画帧上进行调用. 

将我们的渲染工作分解为增量单元, 利用这些API, 就可以自定义调用堆栈, 来优化渲染UI的能力. 可以随意的中断堆栈并且手动的操作堆栈. 

Fiber本质就是专用于React的堆栈的重新实现. 每一个单独的Fiber都可以视为**虚拟堆栈帧**. 

这种重新实现的好处在于, 我们可以啊堆栈帧保留在内存中, 然后在任意的时间执行他们. 

除了调度之外, 手动处理堆栈帧可以释放并发和处理错误边界等能力. 

### Fiber的结构

具体的来说, Fiber是一个JS的对象, 它包含了相关组件的输入和输出信息.

一个Fiber对应一个堆栈帧, 也对应一个组件实例.

下面是具体的属性的含义

#### type & key

这两个字段和React元素的用途是一致的, type表述了其对应的组件, key则用来确定Fiber是否可以重复使用

#### child & slibling

这两个字段用来指向其他的Fiber, 描述Fiber的递归树解构. child指向子组件, 类似于这样:

```js
function  Parent（）{
   return  < Child / > 
}
```

而`slibing`则用来表示render返回多个子节点的情况:

```js
function Parent() {
  return [<Child1 />, <Child2 />]
}
```

#### return

`return`字段是程序在处理当前fiber后应该返回的`fiber`, 在概念上, 和堆栈帧的返回地址是类似的, 也可以被认为是`parent`fiber. 

如果`fiber`有多个子`fiber`, 那么每个子的Fiber返回的`Fiber`就是父`Fiber`。

#### pendingProps & memoizedProps

在概念上讲， props是函数的参数， 一个Fiber的pendingProps在执行开始的时候设置, 并在结束的时候设置`memoizedProps`.

当输入的`pendingProps`等于`memoizedProps`的时候, 表示Fiber是可以重复使用的, 从而跳过这部分的工作. 

#### pendingWorkPriority

一个数字, 表示Fiver所代表的工作的优先级.

除了NoWork(0)之外, 数字越大, 优先级越低. 

