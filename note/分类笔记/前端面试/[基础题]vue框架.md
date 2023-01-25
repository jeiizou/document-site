# vue 面试系列

## 对vue的理解

### 核心特点

- 数据驱动视图(MVVM): Model-View-ViewModel
  - model: 模型层, 负责处理业务逻辑以及和服务端的交互
  - view: 视图层, 负责将数据模型转换为UI展示出来
  - viewModel: 视图模型层, 用来连接model和view, 是model和view之间的通信桥梁
- 组件化: 
  - 降低系统的整体耦合性
  - 调试方便, 可以直接判断bug到某个组件
  - 提高可维护性
- 指令系统等等

### 与传统开发的区别

- 所有的界面事件都是只去操作数据的
- 所有的界面变动都是根据数据自动渲染的

### 与react的区别

1. 相同点: 

- 都有组件化的思想
- 都支持服务器端渲染
- 都有virtal dom
- 数据驱动视图
- 都有支持native的方案
- 都有自己的脚手架

2. 不同点:

- 数据流向不同, react是单向数据流, vue是双向数据流
- 数据变化的实现原理不同, react使用的是不可变数据, vue使用的是可变的数据
- 组件化的通信不同. react中通过使用回调函数进行通信, 在vue中子组件向父组件传递消息可以通过事件, 也可以通过回调函数
- diff算法不同. react主要使用diff队列保存需要更新哪些dom, 得到patch树, 在统一的批量更新dom. vue使用双向指针, 一边对比, 一边更新dom

## spa

spa指单页应用.

优点:

- 具有桌面应用良好的即时性, 网站的可移植性和可访问性
- 用户体验好, 快, 内容的改变不需要重新加载整个页面
- 良好的前后端分离, 分工更加明确

缺点:

- 不利于搜索引擎的抓取
- 首次渲染速度相对比较慢

### spa的实现

1. 方式一: 监听hash的变化, 关键在于监听load和hashchange的变化
2. 方式二: 借助html5的history api实现对浏览器浏览历史的监听和操作

### 如何给spa进行seo优化

1. 服务端渲染, 比如nuxt.js方案
2. 静态化方案: 主流的静态化方案有两种:
   1. 通过程序将动态页面抓取并保存为静态页面, 这样的静态页面实际保存在服务器的硬盘中
   2. 通过web服务的`url rewrite`方式, 原理是通过web服务器内部模块按一定的规则将外部的url请求转化为内容的文件地址, 简单的说就是把外部请求的静态地址转化为实际的动态地址页面, 而静态页面实际是不存在. 
3. 使用Phantomjs针对爬虫处理: 原理是通过nginx配置, 判断访问来源是否是爬虫, 如果是则搜索引擎的爬虫请求会转发到一个`node server`, 再通过`PhantomJS`来解析完整的`html`, 返回给爬虫. 

### spa的首屏加载优化

首屏加载: 指的是浏览器从响应用户输入网址, 到首屏内容渲染完成的时间点.

常见的几种spa首屏优化方式:

- 减小入口文件的体积
- 静态资源本地缓存
- UI框架按需加载
- 图片资源的压缩
- 组件重复打包
- 开启GZip
- 使用ssr

## 组件通信

组件之间的通信方式分为以下几种:

- 父子组件之间的通信
- 兄弟组件之间的通信
- 祖孙与后代组件之间的通信
- 非关系组件之间的通信

常规的通信方案有8中:

1. 通过props传递: 适用于父组件传递给子组件
2. 通过$emit触发自定义事件: 子组件触发自定义事件, 父组件绑定监听器
3. 使用ref通信: 在使用子组件的时候设置ref, 通过ref获取数据
4. 使用eventBus: 创建一个外部的eventBus来监听通信
5. 使用`$parent`或者`$root`: 通过`$parent`或者`$root`直接访问实例上的方法
6. `attrs`与`listeners`: 父组件中不作为props被识别的特性, 可以在子组件中获取到
7. `provide`和`inject`: 祖先定义provide, 然后在后代组件中使用
8. vuex: 全局状态树
   1. state: 用来存放共享变量的地方
   2. getter: 派生状态
   3. mutations: 存放修改state的方法
   4. action: 用来存放state的方法, 是在mutations基础上的, 常用来进行一些异步操作

## nextTick

在下次DOM更新循环结束之后执行延迟回调. 在修改数据之后立即使用这个方法, 获取更新后的DOM

vue在更新DOM的时候是异步的, 当数据发生变化, vue会开启一个异步更新队列, 视图需要等队列中所有数据变化完成之后, 进行统一的更新

想要获取到更新后的dom节后, 就可以使用`vue.nexttick`

## mixin

mixin 用于逻辑的复用. 使用方法参见官方文档.

注意: 在合并的时候, 如果组件存在和mixnin对象相同的选项的时候, 进行递归合并的时候组件的选项会覆盖mixin的选项. 但是如果相同的选项是生命周期钩子的时候, 会合并成一个数组, 先执行minxin的钩子, 再执行组件的钩子

## slot

插槽分为: 默认插槽, 具名插槽以及作用域插槽

其中默认插槽我们就略过不谈. 

具名插槽的使用也比较的简单, 子组件中:

```html
<template>
    <slot>插槽后备的内容</slot>
    <slot name="content">插槽后备的内容</slot>
</template>
```

然后在父组件中:

```html
<child>
    <template v-slot:default>具名插槽</template>
    <!-- 具名插槽⽤插槽名做参数 -->
    <template v-slot:content>内容...</template>
</child>
```

作用域插槽可以用来在子组件中给父组件提供参数.

子组件中:

```html
<template> 
    <slot name="footer" testProps="子组件的值">
          <h3>没传footer插槽</h3>
    </slot>
</template>
```

然后在父组件中:

```html
<child> 
    <!-- 把v-slot的值指定为作⽤域上下⽂对象 -->
    <template v-slot:default="slotProps">
      来⾃⼦组件数据：{{slotProps.testProps}}
    </template>
    <template #default="slotProps">
      来⾃⼦组件数据：{{slotProps.testProps}}
    </template>
</child>
```

特性小节:

- `v-slot`属性只能在`template`标签上使用, 但在只有默认插槽的时候可以在组件标签上使用
- 默认插槽为`default`, 可省略`default`直接写`v-slot`
- 缩写为`#`的时候不能不写参数, 写`#default`
- 可以通过解构获取`v-slot={user}`, 还可以重命名`v-slot="{user: newName}"`和定义默认值`v-slot="{user = '默认值'}"`

### 原理分析

`slot`的本质是返回`VNode`函数, 一般情况下, 我们的组件渲染的流程是这样的:

```
template -> render function -> VNode -> DOM
```

假定我们有个buttonCounter的组件, 使用匿名插槽:

```js
Vue.component('button-counter', {
  template: '<div> <slot>我是默认内容</slot></div>'
})
```

其组件渲染函数如下:

```js
(function anonymous() {
    with(this){
        return _c(
            'div',
            [ 
                _t("default", 
                    [_v("我是默认内容")]
                )
            ],
            2
        )
    }
})
```

其中, `_v`表示创建普通文本节点, `_t`表示渲染插槽的函数

渲染操作的函数大致的流程如下:

```js
function renderSlot (
  name,
  fallback,
  props,
  bindObject
) {
  // 得到渲染插槽内容的函数    
  var scopedSlotFn = this.$scopedSlots[name];
  var nodes;
  // 如果存在插槽渲染函数，则执行插槽渲染函数，生成nodes节点返回
  // 否则使用默认值
  nodes = scopedSlotFn(props) || fallback;
  return nodes;
}
```

其中`name`表示定义插槽的名字, 默认是`default`, `fallback`表示子组件中的`slot`节点的默认值.

其中的`this.$scopredSlots`, 要从`slot`的定义看起.

在初始化render的时候, 会生成vm实例对象上的`$slot`

```js
function initRender (vm) {
  ...
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  ...
}
```

该函数主要是对`children`节点进行归类和过滤, 返回`slots`:

```js
function resolveSlots (
    children,
    context
  ) {
    if (!children || !children.length) {
      return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var data = child.data;
      // remove slot attribute if the node is resolved as a Vue slot node
      if (data && data.attrs && data.attrs.slot) {
        delete data.attrs.slot;
      }
      // named slots should only be respected if the vnode was rendered in the
      // same context.
      if ((child.context === context || child.fnContext === context) &&
        data && data.slot != null
      ) {
        // 如果slot存在(slot="header") 则拿对应的值作为key
        var name = data.slot;
        var slot = (slots[name] || (slots[name] = []));
        // 如果是tempalte元素 则把template的children添加进数组中，这也就是为什么你写的template标签并不会渲染成另一个标签到页面
        if (child.tag === 'template') {
          slot.push.apply(slot, child.children || []);
        } else {
          slot.push(child);
        }
      } else {
        // 如果没有就默认是default
        (slots.default || (slots.default = [])).push(child);
      }
    }
    // ignore slots that contains only whitespace
    for (var name$1 in slots) {
      if (slots[name$1].every(isWhitespace)) {
        delete slots[name$1];
      }
    }
    return slots
}
```

`_render`渲染函数通过`normalizeScopedSlots`得到`vm.$scopedSlots`:

```js
vm.$scopedSlots = normalizeScopedSlots(
  _parentVnode.data.scopedSlots,
  vm.$slots,
  vm.$scopedSlots
);
```

在作用域插槽中, 父组件能够得到子组件的值是因为在`renderSlot`的时候执行会传入`props`, 也就是上面`_t`的第三个参数, 所以父组件能够得到子组件传递过来的值

## Vue.Observable

Vue.Observable是让一个对象编程响应式的方法. Vue的内部用它来处理data函数返回的对象. 

返回的对象可以直接用于渲染函数和计算属性的内部, 并且会在发生变更的时候触发相应的更新. 也可以作为最小化的跨组件状态的存储器.

```js
Vue.observable({ count : 1})
```

类似于:

```js
new vue({ count : 1})
```

在非父子组件通信的时候, 使用这种方式是一个比较好的选择. 

## vue中的 Key

key 是给每一个vnode的唯一id, 也是diff的一种优化策略, 可以根据key, 更准确, 更快的找到对应的vnode节点.

场景背后的逻辑:

- 当我们在使用`v-for`的时候, 需要给单元加上`key`, 
- 如果不使用`key`, vue会采用就地复用原则: 最小化`element`的移动, 并且会尝试最大程度的在适当的地方对相同类型的lement, 进行patch或者reuse.
- 如果我们使用了key, vue会根据顺序记录element. 曾经拥有了key的elemnt如果不再出现的话, 会被直接remove或者destroyed

使用`+new Date()`生成时间戳作为`key`, 手动强制触发重新渲染

## keep-alive

keep-alive是vue中的内置组件, 能在组件切换过程中将状态保留在内存中, 防止重复渲染DOM

keep-alive包裹动态组件的时候, 会缓存不活动的组件实例, 而不是销毁他们

keep-alive可以设置如下的props:

- include: 字符串或者正则, 只有名称匹配的组件会被缓存
- exclude: 字符串或者正则, 名称匹配的组件不会被缓存
- max: 最多可以缓存多少组件实例

```html
<keep-alive include="a,b">
  <component :is="view"></component>
</keep-alive>

<!-- 正则表达式 (使用 `v-bind`) -->
<keep-alive :include="/a|b/">
  <component :is="view"></component>
</keep-alive>

<!-- 数组 (使用 `v-bind`) -->
<keep-alive :include="['a', 'b']">
  <component :is="view"></component>
</keep-alive>
```

匹配首先检查自身的`name`选项, 如果`name`不可用, 则匹配它的局部注册组件名称, 匿名的组件不能被匹配

设置了`keep-alive`的组件, 会多出两个生命周期钩子: activated以及deactivated.

- 首次进入组件: beforeRouteEnter > beforeCreate > created> mounted > activated > ... ... > beforeRouteLeave > deactivated
- 再次进入组件: beforeRouteEnter >activated > ... ... > beforeRouteLeave > deactivated

### 使用场景

当我们在某些场景下不需要让页面重新加载的时候, 我们可以使用`keepalive`.

比如: 我们从`首页 => 列表页 => 详情页 => 返回`, 这时候的列表页需要`keep-live`.

从`首页 => 列表页 => 详情页 => 列表页(需要缓存) => 首页(需要缓存) => 列表页(不需要缓存)`, 这时候可以按需控制`keep-alive`.

在路由中设置`keepalive`属性判断是否需要缓存.

```js
{
    path: 'list',
    name: 'itemList', // 列表页
    component (resolve) {
        require(['@/pages/item/list'], resolve)
    },
    meta: {
        keepAlive: true,
        title: '列表页'
    }
}
```

使用`keep-alive`:

```html
<div id="app" class='wrapper'>
    <keep-alive>
        <!-- 需要缓存的视图组件 --> 
        <router-view v-if="$route.meta.keepAlive"></router-view>
     </keep-alive>
      <!-- 不需要缓存的视图组件 -->
     <router-view v-if="!$route.meta.keepAlive"></router-view>
</div>
```

### 原理分析

`keep-alive`是`vue`中内置的一个组件.

```js
export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: [String, RegExp, Array],
    exclude: [String, RegExp, Array],
    max: [String, Number]
  },

  created () {
    this.cache = Object.create(null)
    this.keys = []
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  render() {
    /* 获取默认插槽中的第一个组件节点 */
    const slot = this.$slots.default
    const vnode = getFirstComponentChild(slot)
    /* 获取该组件节点的componentOptions */
    const componentOptions = vnode && vnode.componentOptions

    if (componentOptions) {
      /* 获取该组件节点的名称，优先获取组件的name字段，如果name不存在则获取组件的tag */
      const name = getComponentName(componentOptions)

      const { include, exclude } = this
      /* 如果name不在inlcude中或者存在于exlude中则表示不缓存，直接返回vnode */
      if (
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      /* 获取组件的key值 */
      const key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
     /*  拿到key值后去this.cache对象中去寻找是否有该值，如果有则表示该组件有缓存，即命中缓存 */
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key)
      }
        /* 如果没有命中缓存，则将其设置进缓存 */
        else {
        cache[key] = vnode
        keys.push(key)
        // prune oldest entry
        /* 如果配置了max并且缓存的长度超过了this.max，则从缓存中删除第一个 */
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }

      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
```

可以看到, 组件没有`template`, 而是一个`render`, 在组件渲染的时候会自动执行`render`函数.

`this.cache`是一个对象, 用来存储需要缓存的组件. 如下:

```js
this.cache = {
    'key1':'组件1',
    'key2':'组件2',
    // ...
}
```

在组件销毁的时候执行`pruneCacheEntry`函数

```js
function pruneCacheEntry (
  cache: VNodeCache,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const cached = cache[key]
  /* 判断当前没有处于被渲染状态的组件，将其销毁*/
  if (cached && (!current || cached.tag !== current.tag)) {
    cached.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}
```

在`mounted`钩子函数中观测`include`和`excluede`的变化, 如下:

```js
mounted () {
    this.$watch('include', val => {
        pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
        pruneCache(this, name => !matches(val, name))
    })
}
```

如果`include`或者`exclude`发生了变化, 表示定义需要缓存的组件的规则或者不需要缓存组件的规则发生了变化, 那么就执行`pruneCache`函数.

```js
function pruneCache (keepAliveInstance, filter) {
  const { cache, keys, _vnode } = keepAliveInstance
  for (const key in cache) {
    const cachedNode = cache[key]
    if (cachedNode) {
      const name = getComponentName(cachedNode.componentOptions)
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}
```

在这个函数中, 对`this.cache`对象进行遍历, 取出每一项的`name`, 用新的缓存规则匹配. 如果该组件已经不需要被缓存了, 就调用`pruneCacheEntry`函数将其从`this.cache`对象剔除就可以了.

`keep-alive`的缓存功能是在`render`中实现的.

1. 首先获取组件的`key`的值:

```js
const key = vnode.key == null? 
componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
: vnode.key
```

2. 拿到`key`之后, 去`this.cache`对象中寻找是否存在该值, 如果有则表示该组件有缓存, 即命中缓存.

```js
/* 如果命中缓存，则直接从缓存中拿 vnode 的组件实例 */
if (cache[key]) {
    vnode.componentInstance = cache[key].componentInstance
    /* 调整该组件key的顺序，将其从原来的地方删掉并重新放在最后一个 */
    remove(keys, key)
    keys.push(key)
} 
```

直接从缓存中获取`vnode`的组件实例, 此时重新调整该组件的`key`的顺序, 将其从原来的地方删掉并重新放在`this.keys`中最后一个`this.cache`对象中没有该key的情况下:

```js
/* 如果没有命中缓存，则将其设置进缓存 */
else {
    cache[key] = vnode
    keys.push(key)
    /* 如果配置了max并且缓存的长度超过了this.max，则从缓存中删除第一个 */
    if (this.max && keys.length > parseInt(this.max)) {
        pruneCacheEntry(cache, keys[0], keys, this._vnode)
    }
}
```

这表明该组件还没有被缓存过, 则以该组件的`key`为键, 组件`vnode`为值, 将其存到`this.cache`中. 并且把`key`存入到`this.keys`中. 此时再判断如果缓存组件的数量超过了设置的最大缓存数量值`this.max`, 就把第一个缓存的组件删除.

### 缓存后如何获取数据

- beforeRouteEnter
- actived

这两个钩子都可以重新获取数据:

```js
beforeRouteEnter(to, from, next){
    next(vm=>{
        console.log(vm)
        // 每次进入路由执行
        vm.getData()  // 获取数据
    })
},

activated(){
	  this.getData() // 获取数据
},
```

> 注意：服务器端渲染期间 avtived 不被调用

## 修饰符

vue中的修饰符分为:

- 表单修饰符: 
  - lazy: change之后在进行同步 
  - trim: 自动过滤首空格
  - number: 自动转为数字
- 事件修饰符
  - stop: 阻止事件冒泡
  - prevent: 阻止默认行为
  - self: 是自身元素时触发函数
  - once: 只触发一次
  - capture: 使事件从包含这个元素的顶层往下触发
  - passive: 给`onscroll`整了一个`lazy`.
  - native: 原生事件, 会监听到根元素的原生事件
- 鼠标按键修饰符
  - left: 左键点击
  - right: 右键点击
  - middle: 中键点击
- 键值修饰符
  - keyCode
- v-bind修饰符
  - sync: 建立双向绑定
  - prop: 设置自定义标签属性
  - camel: 命名为驼峰命名法


## 自定义指令

全局注册一个自定义指令可以通过下面的方式:

```js
// 注册一个全局自定义指令 `v-focus`
Vue.directive('focus', {
  // 当被绑定的元素插入到 DOM 中时……
  inserted: function (el) {
    // 聚焦元素
    el.focus()  // 页面加载完成之后自动让输入框获取到焦点的小功能
  }
})
```

局部注册通过在组件的`options`上设置`directive`:

```js
directives: {
  focus: {
    // 指令的定义
    inserted: function (el) {
      el.focus() // 页面加载完成之后自动让输入框获取到焦点的小功能
    }
  }
}
```

然后你可以在模板的任何元素上使用新的`v0focus`property. 如下:

```js
<input v-focus />
```

自定义指令先像组件那样存在钩子函数:

- `bind`: 只调用一次, 指令第一次绑定到元素的时候调用
- `inserted`: 被绑定元素插入父节点的时候调用
- `update`: 所在组件的`VNode`更新的时候调用, 但是可能发生在子组件之前
- `componentUpdated`: 所在组件的vnode及其子的vnode全部更新后调用
- `unbind`: 只调用一次, 解绑时调用

所有的钩子参数, 都有以下的参数:

- el: 绑定的元素, 用来直接操作DOM
- `binding`: 对象, 包含:
  - name: 指令名称
  - value: 绑定的值
  - oldValue: 上一个值
  - expression: 字符串形式的指令表达式
  - arg: 参数
  - modifiers: 修饰符对象
- vnode: 虚拟节点信息
- oldVnode: 上一个虚拟节点, 仅在updaye和componentUpdate有

### 自定义指令场景

- 防抖
- 图片懒加载
- 一键copy

## 过滤器

filter, 就是把一些不必要的东西过滤, 在v3中已经废弃了

## vue的项目结构

基本原则:

- 文件夹和文件夹的内部的语义一致性
- 单一入口/出口
- 就近原则, 紧耦合的文件应该放到一起, 并且应该用相对路径去引用
- 公共的文件应该用绝对路径的方式从根目录应用
- `/src`外的文件不应该被引用

## vue 项目的错误处理

主要的错误来源:

- 后端接口错误
- 代码本身的逻辑错误

### 处理方式

对于后端接口错误, 可以通过请求拦截器, 以axios为例:

```js
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response.status == 401) {
      router.push({ name: "Login" });
    } else {
      message.error("出错了");
      return Promise.reject(error);
    }
  }
);
```

代码逻辑错误:

这是全局错误处理函数:

```js
Vue.config.errorHandler = function (err, vm, info) {
  // handle error
  // `info` 是 Vue 特定的错误信息，比如错误所在的生命周期钩子
  // 只在 2.2.0+ 可用
}
```

`errorHandler`指定组件的渲染和观察期间未捕获错误的处理函数. 这个处理函数被调用的时候, 可以获取错误信息和`vue`实例.

不过值得注意的是，在不同 Vue 版本中，该全局 API 作用的范围会有所不同：

- 从 2.2.0 起，这个钩子也会捕获组件生命周期钩子里的错误。同样的，当这个钩子是 `undefined` 时，被捕获的错误会通过 `console.error` 输出而避免应用崩溃
- 从 2.4.0 起，这个钩子也会捕获 `Vue` 自定义事件处理函数内部的错误了
- 从 2.6.0 起，这个钩子也会捕获 `v-on DOM` 监听器内部抛出的错误。另外，如果任何被覆盖的钩子或处理函数返回一个 `Promise` 链 (例如 `async` 函数)，则来自其 `Promise` 链的错误也会被处理.


**生命周期钩子**

`errorCaptured`是一个新增的生命周期钩子, 当捕获到一个来自子孙组件的错误是被调用. 

```js
(err: Error, vm: Component, info: string) => ?boolean
```

会受到三个参数: 错误对象, 发生错误的组件实例以及一个包含错误来源信息的字符串. 此钩子可以返回`false`以组织该错误继续向上传播.

错误传播的规则如下:

- 默认情况下，如果全局的 `config.errorHandler` 被定义，所有的错误仍会发送它，因此这些错误仍然会向单一的分析服务的地方进行汇报
- 如果一个组件的继承或父级从属链路中存在多个 `errorCaptured` 钩子，则它们将会被相同的错误逐个唤起。
如果此 `errorCaptured` 钩子自身抛出了一个错误，则这个新错误和原本被捕获的错误都会发送给全局的`config.errorHandler`
- 一个 `errorCaptured` 钩子能够返回 `false` 以阻止错误继续向上传播。本质上是说“这个错误已经被搞定了且应该被忽略”。它会阻止其它任何会被这个错误唤起的 `errorCaptured` 钩子和全局的 `config.errorHandler`

下面是一个例子:

```js
Vue.component('cat', {
    template:`
        <div>
			<h1>Cat: </h1>
        	<slot></slot>
        </div>`,
    props:{
        name:{
            required:true,
            type:String
        }
    },
    errorCaptured(err,vm,info) {
        console.log(`cat EC: ${err.toString()}\ninfo: ${info}`); 
        return false;
    }

});
```

定义一个子组件`kitten`, 其中`dontextist()`并没有定义, 存在错误.

```js
Vue.component('kitten', {
    template:'<div><h1>Kitten: {{ dontexist() }}</h1></div>',
    props:{
        name:{
            required:true,
            type:String
        }
    }
});
```

页面中使用组件:

```js
<div id="app" v-cloak>
    <cat name="my cat">
        <kitten></kitten>
    </cat>
</div>
```

父组件能捕获:

```js
cat EC: TypeError: dontexist is not a function
info: render
```

### 源码分析

```js
// Vue 全局配置,也就是上面的Vue.config
import config from '../config'
import { warn } from './debug'
// 判断环境
import { inBrowser, inWeex } from './env'
// 判断是否是Promise，通过val.then === 'function' && val.catch === 'function', val ！=== null && val !== undefined
import { isPromise } from 'shared/util'
// 当错误函数处理错误时，停用deps跟踪以避免可能出现的infinite rendering
// 解决以下出现的问题https://github.com/vuejs/vuex/issues/1505的问题
import { pushTarget, popTarget } from '../observer/dep'

export function handleError (err: Error, vm: any, info: string) {
    // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
    pushTarget()
    try {
        // vm指当前报错的组件实例
        if (vm) {
            let cur = vm
            // 首先获取到报错的组件，之后递归查找当前组件的父组件，依次调用errorCaptured 方法。
            // 在遍历调用完所有 errorCaptured 方法、或 errorCaptured 方法有报错时，调用 globalHandleError 方法
            while ((cur = cur.$parent)) {
                const hooks = cur.$options.errorCaptured
                // 判断是否存在errorCaptured钩子函数
                if (hooks) {
                    // 选项合并的策略，钩子函数会被保存在一个数组中
                    for (let i = 0; i < hooks.length; i++) {
                        // 如果errorCaptured 钩子执行自身抛出了错误，
                        // 则用try{}catch{}捕获错误，将这个新错误和原本被捕获的错误都会发送给全局的config.errorHandler
                        // 调用globalHandleError方法
                        try {
                            // 当前errorCaptured执行，根据返回是否是false值
                            // 是false，capture = true，阻止其它任何会被这个错误唤起的 errorCaptured 钩子和全局的 config.errorHandler
                            // 是true capture = fale，组件的继承或父级从属链路中存在的多个 errorCaptured 钩子，会被相同的错误逐个唤起
                            // 调用对应的钩子函数，处理错误
                            const capture = hooks[i].call(cur, err, vm, info) === false
                            if (capture) return
                        } catch (e) {
                            globalHandleError(e, cur, 'errorCaptured hook')
                        }
                    }
                }
            }
        }
        // 除非禁止错误向上传播，否则都会调用全局的错误处理函数
        globalHandleError(err, vm, info)
    } finally {
        popTarget()
    }
}
// 异步错误处理函数
export function invokeWithErrorHandling (
handler: Function,
 context: any,
 args: null | any[],
    vm: any,
        info: string
        ) {
            let res
            try {
                // 根据参数选择不同的handle执行方式
                res = args ? handler.apply(context, args) : handler.call(context)
                // handle返回结果存在
                // res._isVue an flag to avoid this being observed，如果传入值的_isVue为ture时(即传入的值是Vue实例本身)不会新建observer实例
                // isPromise(res) 判断val.then === 'function' && val.catch === 'function', val ！=== null && val !== undefined
                // !res._handled  _handle是Promise 实例的内部变量之一，默认是false，代表onFulfilled,onRejected是否被处理
                if (res && !res._isVue && isPromise(res) && !res._handled) {
                    res.catch(e => handleError(e, vm, info + ` (Promise/async)`))
                    // avoid catch triggering multiple times when nested calls
                    // 避免嵌套调用时catch多次的触发
                    res._handled = true
                }
            } catch (e) {
                // 处理执行错误
                handleError(e, vm, info)
            }
            return res
        }

//全局错误处理
function globalHandleError (err, vm, info) {
    // 获取全局配置，判断是否设置处理函数，默认undefined
    // 已配置
    if (config.errorHandler) {
        // try{}catch{} 住全局错误处理函数
        try {
            // 执行设置的全局错误处理函数，handle error 想干啥就干啥💗
            return config.errorHandler.call(null, err, vm, info)
        } catch (e) {
            // 如果开发者在errorHandler函数中手动抛出同样错误信息throw err
            // 判断err信息是否相等，避免log两次
            // 如果抛出新的错误信息throw err Error('你好毒')，将会一起log输出
            if (e !== err) {
                logError(e, null, 'config.errorHandler')
            }
        }
    }
    // 未配置常规log输出
    logError(err, vm, info)
}

// 错误输出函数
function logError (err, vm, info) {
    if (process.env.NODE_ENV !== 'production') {
        warn(`Error in ${info}: "${err.toString()}"`, vm)
    }
    /* istanbul ignore else */
    if ((inBrowser || inWeex) && typeof console !== 'undefined') {
        console.error(err)
    } else {
        throw err
    }
}
```

