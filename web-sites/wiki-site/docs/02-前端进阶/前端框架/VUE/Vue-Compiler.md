# Vue-Compiler

编译优化主要有:

- diff算法优化
- 静态提升
- 事件监听缓存
- SSR优化

## Block Tree 和 PatchFlags

`Block Tree`和`PatchFlags`是vue3利用编译信息在Diff阶段进行的优化. 

在tempalte中, 会把模板内容分为静态节点和动态节点. 比如这段模板中:

```js
<div>
    <p class="foo">bar</p>
</div>
```

这这就是一个静态vDom, 它在组件的更新阶段是不会发生变化的. 如果能在`diff`阶段跳过这部分的比较, 就能避免无效的vdom树的遍历和比对. 这就是早起的优化思路: 跳过静态内容, 只比较动态内容.

静态类型的枚举如下:

```js
export const enum PatchFlags {
  TEXT = 1,// 动态的文本节点
  CLASS = 1 << 1,  // 2 动态的 class
  STYLE = 1 << 2,  // 4 动态的 style
  PROPS = 1 << 3,  // 8 动态属性，不包括类名和样式
  FULL_PROPS = 1 << 4,  // 16 动态 key，当 key 变化时需要完整的 diff 算法做比较
  HYDRATE_EVENTS = 1 << 5,  // 32 表示带有事件监听器的节点
  STABLE_FRAGMENT = 1 << 6,   // 64 一个不会改变子节点顺序的 Fragment
  KEYED_FRAGMENT = 1 << 7, // 128 带有 key 属性的 Fragment
  UNKEYED_FRAGMENT = 1 << 8, // 256 子节点没有 key 的 Fragment
  NEED_PATCH = 1 << 9,   // 512
  DYNAMIC_SLOTS = 1 << 10,  // 动态 solt
  HOISTED = -1,  // 特殊标志是负整数表示永远不会用作 diff
  BAIL = -2 // 一个特殊的标志，指代差异算法
}
```

### Block

```js
<div>
    <p>foo</p>
    <p>{{ bar }}</p>
</div>
```

在这段代码中, 只有`<p>{{ bar }}</p>`是动态的, 因此只需要靶向更新该文本节点就可以了, 这在包含大量静态节点内容而只有少量动态内容的场景下能提成很大的性能. 

这段代码对应的vDom大概如下:

```js
const vnode = {
    tag: 'div',
    children: [
        { tag: 'p', children: 'foo' },
        { tag: 'p', children: ctx.bar },  // 这是动态节点
    ]
}
```

vue3的compiler可以分析模板并且提取有效信息: 那些节点是动态节点, 以及它为什么是动态的, 有了这些信息, 我们就可以在创建`vnode`的过程中为动态的节点打标记, 也就是`patchFlags`.

`patchFlags`可以简单的理解为一个数字标记, 把这些数字赋予不同含义:

- 1: 代表节点有动态的textContent
- 2: 代表元素有动态的class
- 3: ...

然后把这些标记挂到对应的vdom属性上:

```js
const vnode = {
    tag: 'div',
    children: [
        { tag: 'p', children: 'foo' },
        { tag: 'p', children: ctx.bar, patchFlag: 1 /* 动态的 textContent */ },
    ]
}
```

有了这个信息, 我们就可以在`vnode`的创建阶段把动态节点提取出来, 通过判断节点属性上带有`patchFlag`, 就把这个节点提取出来放在一个数组中:

```js
const vnode = {
    tag: 'div',
    children: [
        { tag: 'p', children: 'foo' },
        { tag: 'p', children: ctx.bar, patchFlag: 1 /* 动态的 textContent */ },
    ],
    dynamicChildren: [
        { tag: 'p', children: ctx.bar, patchFlag: 1 /* 动态的 textContent */ },
    ]
}
```

`dynamicChildren`就是用来存储一个节点下所有`子代`动态节点的数组. 

比如:

```js
const vnode = {
    tag: 'div',
    children: [
        { tag: 'section', children: [
            { tag: 'p', children: ctx.bar, patchFlag: 1 /* 动态的 textContent */ },
        ]},
    ],
    dynamicChildren: [
        { tag: 'p', children: ctx.bar, patchFlag: 1 /* 动态的 textContent */ },
    ]
}
```

它收集的是所有子孙节点中的动态节点信息. 这些节点信息会保存在'顶层'的`Block`中.

实际上, 一个`Block`就是一个`VNode`, 只不过它有一些特殊属性. 

现在, 我们已经拿到了所有的动态节点数组, 因此在diff的时候就只需要遍历这个数组进行更新即可. 

这就是所谓的靶向更新.

### 节点不稳定: Block-Tree

一个Block是无法构成Tree的, 这就意味着在一颗vdom树种, 会有多个`vnode`节点充当`Block`的角色, 进而构成一个`Block Tree`. 那么什么情况下, 一个`vnode`节点会充当`block`的角色呢?

```html
<div>
  <section v-if="foo">
    <p>{{ a }}</p>
  </section>
  <div v-else>
    <p>{{ a }}</p>
  </div>
</div>
```

假设只要最外层的`div`标签是`Block`, 那么`foo`为`true`的时候, 收集到的节点为:

```js
cosnt block = {
    tag: 'div',
    dynamicChildren: [
        { tag: 'p', children: ctx.a, patchFlag: 1 }
    ]
}
```

当`foo`为`false`的时候, `block`为:

```js
cosnt block = {
    tag: 'div',
    dynamicChildren: [
        { tag: 'p', children: ctx.a, patchFlag: 1 }
    ]
}
```

可以发现, 无论`foo`为真还是假, `block`的内容是不变的, 这意味着在`diff`阶段不会进行任何的更新. 

这个问题的本质在于`dynamaicChildren`的`diff`是忽略层级的. 

### v-if block

那么, 如果让使用了`v-if/v-else-if/v-else`等指令的元素也作为`Block`呢?

```html
<div>
  <section v-if="foo">
    <p>{{ a }}</p>
  </section>
  <section v-else> <!-- 即使这里是 section -->
       <div> <!-- 这个 div 标签在 diff 过程中被忽略 -->
            <p>{{ a }}</p>
        </div>
  </section >
</div>
```

以这段模板为例, 将两个`section`作为`block`:

```
Block(Div)
    - Block(Section v-if)
    - Block(Section v-else)
```

父级的Block, 会收集子代动态节点之外, 也会收集子Block. 

```js
cosnt block = {
    tag: 'div',
    dynamicChildren: [
        { tag: 'section', { key: 0 }, dynamicChildren: [...]}, /* Block(Section v-if) */
        { tag: 'section', { key: 1 }, dynamicChildren: [...]}  /* Block(Section v-else) */
    ]
}
```

这样当v-if判断变化的时候, 渲染器就会知道这是两个不同的block, 进行替换操作, 这样就解决了DOM结构不稳定引起的问题. 这就是`Block Tree`.

### v-for block

同理, `v-for`也会引起DOM结构的不稳定, 但是它的情况就稍微复杂一些. 

```js
<div>
    <p v-for="item in list">{{ item }}</p>
    <i>{{ foo }}</i>
    <i>{{ bar }}</i>
</div>
```

假如`list`由`[1, 2]`变为了`[1]`, 按照之前的思路, 最外层的`div`作为一个`block`, 那么它更新前后对应的`Block Tree`应该是:

```js
// 前
const prevBlock = {
    tag: 'div',
    dynamicChildren: [
        { tag: 'p', children: 1, 1 /* TEXT */ },
        { tag: 'p', children: 2, 1 /* TEXT */ },
        { tag: 'i', children: ctx.foo, 1 /* TEXT */ },
        { tag: 'i', children: ctx.bar, 1 /* TEXT */ },
    ]
}

// 后
const nextBlock = {
    tag: 'div',
    dynamicChildren: [
        { tag: 'p', children: item, 1 /* TEXT */ },
        { tag: 'i', children: ctx.foo, 1 /* TEXT */ },
        { tag: 'i', children: ctx.bar, 1 /* TEXT */ },
    ]
}
```

其中, `prevBlock`有四个动态节点, `nextBlock`中有三个动态节点, 这时候如何进行Diff. 这里是无法使用传统的`Diff`操作的, 因为传统的`Diff`的前置条件是同层节点之间的`Diff`, 然`dynamicChildren`内的节点未必是同层级的. 

实际上, 我们只需要让`v-for`作为一个单独的block就可以了:

```js
const block = {
    tag: 'div',
    dynamicChildren: [
        // 这是一个 Block 哦，它有 dynamicChildren
        { tag: Fragment, dynamicChildren: [/*.. v-for 的节点 ..*/] }
        { tag: 'i', children: ctx.foo, 1 /* TEXT */ },
        { tag: 'i', children: ctx.bar, 1 /* TEXT */ },
    ]
}
```

这里我们使用了一个`Fragment`, 并让他充当了`Block`的角色, 解决了`v-for`元素所在层级的结构稳定性问题.

### 不稳定的Fragment

我们来看下`Fragment`这个元素本身:

```js
{ tag: Fragment, dynamicChildren: [/*.. v-for 的节点 ..*/] }
```

对于这样的模板:

```html
<p v-for="item in list">{{ item }}</p>
```

在`list`从`[1,2]`变为`[1]`的前后, block如下:

```js
// 前
const prevBlock = {
    tag: Fragment,
    dynamicChildren: [
        { tag: 'p', children: item, 1 /* TEXT */ },
        { tag: 'p', children: item, 2 /* TEXT */ }
    ]
}

// 后
const prevBlock = {
    tag: Fragment,
    dynamicChildren: [
        { tag: 'p', children: item, 1 /* TEXT */ }
    ]
}
```

在这种情况下, 我们发现结构仍然是不稳定的(结构不稳定从结果上看指的是更新前后一个 block 的 dynamicChildren 中收集的动态节点数量或顺序的不一致). 这种不稳定会导致我们无法直接进行靶向Diff, 所以只能退回到传统的Diff, 也就是Diff Fragment的children而不是dynamicChildren.

注意, Fragment的子节点还可以是Block.

```js
const block = {
    tag: Fragment,
    children: [
        { tag: 'p', children: item, dynamicChildren: [/*...*/], 1 /* TEXT */ },
        { tag: 'p', children: item, dynamicChildren: [/*...*/], 1 /* TEXT */ }
    ]
}
```

这里就又要回复到`Block-tree`的`Diff`模式.

### 稳定的 Fragment

所谓的稳定的`Fragment`, 指的是:

1. v-for的表达式是常量

```html
<p v-for="n in 10"></p>
<!-- 或者 -->
<p v-for="s in 'abc'"></p>
```

由于`10`和`abc`是常量, 所以这里是稳定的, 不需要回退到传统的diff. 能带来一定的性能优势.

2. 多个根元素

```html
<template>
    <div></div>
    <p></p>
    <i></i>
</template>
```

这也是一个稳定的Fragment. 

即便是:

```html
<template>
    <div v-if="condition"></div>
    <p></p>
    <i></i>
</template>
```

它也是稳定的, 因为`v-if`本身是一个稳定的`block`. 

3. 插槽出口

```js
<Comp>
    <p v-if="ok"></p>
    <i v-else></i>
</Comp>
```

组件内的`children`将作为插槽的内容, 在经过编译以后, 应该作为`Block`角色的内容, 自然会是`Block`, 可以保证结构的稳定. 

4. `<template v-for>`


如下模板:

```html
<template>
    <template v-for="item in list">
        <p>{{ item.name }}</P>
        <p>{{ item.age }}</P>
    </template>
</template> 
```

对于带有`v-for`的`template`元素本身来说, 它是一个不稳定的`Fragment`, 因为`list`不是常量, 除此之外, `template`元素本身不渲染任何真实的DOM, 因此如果它含有多个元素, 这些元素节点也会作为`Fragment`存在, 这个`Fragment`也是稳定的. 

## 静态提升

vue3的`compiler`是支持`hoistStatic`的. 如下模板:

```html
<div>
    <p>text</p>
</div>
```

在没有被提升的情况下, 其渲染函数相当于:

```js
function render() {
    return (openBlock(), createBlock('div', null, [
        createVNode('p', null, 'text')
    ]))
}
```

这里我们知道`p`标签是静态的, 它是不会改变的. 开启静态提升后, 渲染函数变为:

```js
const hoist1 = createVNode('p', null, 'text')

function render() {
    return (openBlock(), createBlock('div', null, [
        hoist1
    ]))
}
```

这里减少的性能的消耗. 静态提升是以树为单位的. 如下模板:

```js
<div>
  <section>
    <p>
      <span>abc</span>
    </p>
  </section >
</div>
```

除了根节点的`div`作为`block`不可被提升, 整个的`section`元素以及子孙及诶点都会被提升, 因为他们整个树都是静态的. 

### 元素不会被提升的情况

1. 元素带有动态的key

```html
<div :key="foo"></div>
```

实际上一个元素拥有任何动态绑定都不应该被提升, `key`是作为特殊的一种绑定, 其意义是不同的. 普通的`props`如果是动态的, 那么只需要体现在`patchFlags`即可:

```html
<div>
    <p :foo="bar"></p>
</div>
```

转为render:

```js
render(ctx) {
    return (openBlock(), createBlock('div', null, [
        createVNode('p', { foo: ctx }, null, PatchFlags.PROPS, ['foo'])
    ]))
}
```

对于`key`来说, 本身具有特殊意义, 它作为`VNode`的唯一标识, 如果两个元素的`key`不同, 就需要完全的替换.

如果`key`的值是动态可变的, 对于这样的元素应该始终参与到`diff`中, 并且不能简单的打`patchFlags`, 需要把拥有动态`key`的元素也作为`Block`:

```html
<div>
    <div :key="foo"></div>
</div>
```

其渲染函数应该为:

```js
render(ctx) {
    return (openBlock(), createBlock('div', null, [
        (openBlock(), createBlock('div', { key: ctx.foo }))
    ]))
}
```

2. 使用ref的元素

```js
<div ref="domRef"></div>
```

如果一个元素使用的`ref`, 无论是否绑定了动态值, 这个元素都不会被静态提升, 这是因为在每一次`patch`的时候都需要设置`ref`的值.

为什么呢? 看下面这个场景:

```html
<template>
    <div>
        <p ref="domRef"></p>
    </div>
</template>
<script>
export default {
    setup() {
        const refP1 = ref(null)
        const refP2 = ref(null)
        const useP1 = ref(true)

        return {
            domRef: useP1 ? refP1 : refP2
        }
    }
}
</script>
```

如上代码所示, p标签使用了非动态的ref属性, 值为字符串`domRef`, 然setup返回了同名的`domRef`属性, 他们之间会建立联系:

- 当userp1为true, refp1.value引用p元素
- 反之, refp2.value引用p元素

虽然`ref`是静态的, 但很显然在更新的过程中由于`useP1`的变化, 我们不得不更新`domRef`, 所以只要一个元素使用了`ref`, 它就不会被静态提升, 并且这个元素对应的VNode也会被收集到父Block的`dynamicChildren`中.

但由于`p`标签除了需要更新`ref`外, 并不需要更新其他的`props`, 所以在真实的渲染函数中, 会为它打上一个特殊的`PatchFlag`, 叫做: `PatchFlags.NEED_PATCH`.

```js
render() {
    return (openBlock(), createBlock('div', null, [
        createVNode('p', { ref: 'domRef' }, null, PatchFlags.NEED_PATCH)
    ]))
}
```

3. 使用自定义指令的元素

实际上一个元素如果使用除`v-pre/v-cloak`之外的所有`Vue`原生提供的指令, 都不会被提升, 使用自定义指令也不会被提升, 比如:

```html
<p v-custom></p>
```

和使用`key`一样, 会为这段模板对应的`VNode`打上`NEED_PATCH`标志. 

顺便讲一下手写渲染函数时如何应用自定义指令, 自定义指令是一种运行时指令, 与组件的生命周期类似, 一个`VNode`对象也有它自己生命周期:

- beforeMount
- mounted
- beforeUpdate
- updated
- beforeUnmount
- unmounted

编写一个自定义指令:

```js
const myDir: Directive = {
  beforeMount(el, binds) {
    console.log(el)
    console.log(binds.value)
    console.log(binds.oldValue)
    console.log(binds.arg)
    console.log(binds.modifiers)
    console.log(binds.instance)
  }
}
```

使用该指令:

```js
const App = {
  setup() {
    return () => {
      return h('div', [
        // 调用 withDirectives 函数
        withDirectives(h('h1', 'hahah'), [
          // 四个参数分别是：指令、值、参数、修饰符
          [myDir, 10, 'arg', { foo: true }]
        ])
      ])
    }
  }
}
```

一个元素可以绑定多个指令:

```js
const App = {
  setup() {
    return () => {
      return h('div', [
        // 调用 withDirectives 函数
        withDirectives(h('h1', 'hahah'), [
          // 四个参数分别是：指令、值、参数、修饰符
          [myDir, 10, 'arg', { foo: true }],
          [myDir2, 10, 'arg', { foo: true }],
          [myDir3, 10, 'arg', { foo: true }]
        ])
      ])
    }
  }
}
```

## 静态提升Props

静态节点的提升以树为单位, 如果一个`VNode`存在非静态的子代节点, 那么该`VNode`就不是静态的, 也就不会被提升. 但这个`Vnode`的`props`却可能是静态的, 这使得我们可以将它的`props`进行提升, 这同样可以节约`VNode`对象的创建开销, 内存占用等. 例如:

```html
<div>
    <p foo="bar" a=b>{{ text }}</p>
</div>
```

在这段模板中, `p`标签有动态的文本内容, 因此不可以被提升, 但`p`标签的所有属性都是静态的, 因此可以提升它的属性, 经过提升以后其渲染函数如下:

```js
const hoistProp = { foo: 'bar', a: 'b' }

render(ctx) {
    return (openBlock(), createBlock('div', null, [
        createVNode('p', hoistProp, ctx.text)
    ]))
}
```

即使动态绑定的属性值, 但如果值是常量, 那么也会被提升.

```html
<p :foo="10" :bar="'abc' + 'def'">{{ text }}</p>
```

这里的`abc+def`就是常量, 也可以被提升.

## 预字符串化

静态提升的`VNode`节点或者节点数本身是静态的, 那么能够将其预先字符串化呢? 如下模板所示:

```html
<div>
    <p></p>
    <p></p>
    ...20 个 p 标签
    <p></p>
</div>
```

假如标签中有大量连续的静态的`p`标签, 当采用了`hoist`优化之后, 结果如下:

```js
cosnt hoist1 = createVNode('p', null, null, PatchFlags.HOISTED)
cosnt hoist2 = createVNode('p', null, null, PatchFlags.HOISTED)
// ... 20 个 hoistx 变量
cosnt hoist20 = createVNode('p', null, null, PatchFlags.HOISTED)

render() {
    return (openBlock(), createBlock('div', null, [
        hoist1, hoist2, ...20 个变量, hoist20
    ]))
}
```

预字符串化会将这些静态节点序列化为字符串并生成一个`Static`类型的`VNode`:

```js
const hoistStatic = createStaticVNode('<p></p><p></p><p></p>...20个...<p></p>')

render() {
    return (openBlock(), createBlock('div', null, [
       hoistStatic
    ]))
}
```

这里的优势在于:

- 生成代码的体积减小了
- 减少了创建VNode的开销
- 减少了内存的占用

静态节点在运行时会通过`innerHTML`来创建真实节点, 因此并非所有静态节点都是可以预字符串化的. 

可以预字符串化的静态节点需要满足以下条件:

- 非表格类标签: caption, thread, tr, th, tbody, td, tfoot, colgroup, col
- 标签的属性必须是: 标准的`html attribute`,或者`data-/aria-`类属性

当一个节点满足这些条件的时候, 说明这个节点是可以预字符串化的, 但如果只有一个节点, 那么也不会将其字符串化, 可字符串化的节点必须连续并且达到一定的数量才行:

- 如果节点没有属性, 那么必须有连续20个及以上的静态节点存在才行

```html
<div>
    <p></p>
    <p></p>
    ... 20 个 p 标签
    <p></p>
</div>
```

- 或者在这些连续的节点中有5个及以上的节点是有属性绑定的节点:

```html
<div>
    <p id="a"></p>
    <p id="b"></p>
    <p id="c"></p>
    <p id="d"></p>
    <p id="e"></p>
</div>
```

这些节点不一定要兄弟节点, 父子节点也可以:

```html
<div>
    <p id="a">
        <p id="b">
            <p id="c">
                <p id="d">
                    <p id="e"></p>
                </p>
            </p>
        </p>
    </p>
</div>
```

预字符串化会在编译的时候计算属性的值, 比如:

```html
<div>
    <p :id="'id-' + 1">
        <p :id="'id-' + 2">
            <p :id="'id-' + 3">
                <p :id="'id-' + 4">
                    <p :id="'id-' + 5"></p>
                </p>
            </p>
        </p>
    </p>
</div>
```

字符串化之后: 

```js
const hoistStatic = createStaticVNode('<p id="id-1"></p><p id="id-2"></p>.....<p id="id-5"></p>'）
```

## Cache Event handler 事件监听缓存

如下模板:

```html
<Comp @change="a + b" />
```

这段模板如果手写渲染函数的话相当于:

```js
render(ctx) {
    return h(Comp, {
        onChange: () => (ctx.a + ctx.b)
    })
}
```

很显然, 每次`render`函数执行的时候, `Comp`的`props`都是新的对象, `onChange`也是新的函数, 这就会导致`Comp`组件的更新. 

当`Vue3 Compiler`开启`prefixIdentifiers`以及`cacheHandlers`的时候, 这段模板会被编译为:

```js
render(ctx, cache) {
    return h(Comp, {
        onChange: cache[0] || (cache[0] = ($event) => (ctx.a + ctx.b))
    })
}
```

这样即使多次调用渲染函数也不会触发`Comp`组件的更新, 因为在`Vue`的`patch`阶段对比的时候, `props`的`onChange`的引用是没有变化的. 

如上代码中的`render`函数的`cache`对象是`Vue`内部在调用渲染函数式注入的一个数组, 想下面这种:

```js
render.call(ctx, ctx, [])
```

当然我们不依赖编译也能写出类似具备cache能力的代码:

```js
const Comp = {
    setup() {
        // 在 setup 中定义 handler
        const handleChange = () => {/* ... */}
        return () => {
            return h(AnthorComp, {
                onChange: handleChange  // 引用不变
            })
        }
    }
}
```

## v-once

这在vue2中也有支持, 这是一个很"指令"的指令, 因为它就是给编译器看的, 当编译器遇到`v-once`的时候, 会利用我们刚刚讲过的`cache`来缓存全部或者一部分渲染函数的执行结果, 比如下面这个模板:

```html
<div>
    <div v-once>{{ foo }}</div>
</div>
```

会被编译为:

```js
render(ctx, cache) {
    return (openBlock(), createBlock('div', null, [
        cache[1] || (cache[1] = h("div", null, ctx.foo, 1 /* TEXT */))
    ]))
}
```

这样就缓存了这段`vnode`, 既然`vnode`已经被缓存了, 后续的更新就都会读取缓存的内容, 而不会重新创建`vnode`对象了, 同时在Diff的过程中也就不需要这段`vnode`参与了. 通常看到编译后的代码更接近如下内容:

```js
render(ctx, cache) {
    return (openBlock(), createBlock('div', null, [
        cache[1] || (
            setBlockTracking(-1), // 阻止这段 VNode 被 Block 收集
            cache[1] = h("div", null, ctx.foo, 1 /* TEXT */),
            setBlockTracking(1), // 恢复
            cache[1] // 整个表达式的值
        )
    ]))
}
```

`openBlock()` 和`createBlock()`函数用来创建一个 `Block`。而 `setBlockTracking(-1)` 则用来暂停收集的动作.

所以在`v-once`编译生成代码中你会看到它, 这样使用`v-once`包裹的内容就不会被收集到父Block中, 也就不参与Diff了. 

所以, `v-once`的性能提升来自两个方面:

1. VNode的创建开销
2. 无用的Diff开销. 

## SSR优化

当静态内容达到一定量级的时候, 会用`createStaticVnode`方法在客户端去生成一个`static node`, 这些静态的node, 会被直接`innerHtml`, 就不需要创建对象, 然后根据对象渲染.

```html
<div>
	<div>
		<span>你好</span>
	</div>
	...  // 很多个静态属性
	<div>
		<span>{{ message }}</span>
	</div>
</div>
```

编译后:

```js
import { mergeProps as _mergeProps } from "vue"
import { ssrRenderAttrs as _ssrRenderAttrs, ssrInterpolate as _ssrInterpolate } from "@vue/server-renderer"

export function ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _cssVars = { style: { color: _ctx.color }}
  _push(`<div${
    _ssrRenderAttrs(_mergeProps(_attrs, _cssVars))
  }><div><span>你好</span>...<div><span>你好</span><div><span>${
    _ssrInterpolate(_ctx.message)
  }</span></div></div>`)
}
```

