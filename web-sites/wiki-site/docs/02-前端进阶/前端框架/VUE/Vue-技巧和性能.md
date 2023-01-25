# Vue-技巧和性能


## 使用技巧

### 监听组件的生命周期

常规做法:

```js
// Parent.vue
<Child @mounted="doSomething"/>

// Child.vue
mounted() {
  this.$emit("mounted");
}
```

简约做法:

```html
<Child @hook:mounted="doSomething" />
<Child @hook:updated="doSomething" />
```

### 路由参数变化组件不更新的解决方案

1. watch监听路由变化

   ```js
    // 方法1 监听路由是否变化
    watch: {
    '$route' (to, from) {
    if(to.query.id !== from.query.id){
                this.id = to.query.id;
                this.init();//重新加载数据
            }
    }
    }
    //方法 2  设置路径变化时的处理函数
    watch: {
    '$route': {
        handler: 'init',
        immediate: true
    }
    }
    ```

2. 路由key

   ```html
    <router-view :key="$route.fullpath"></router-view>
    ```

### 路由懒加载的三种方式

```js
// 1、Vue异步组件技术：
{
   path: '/home',
   name: 'Home',
   component: resolve => reqire(['path路径'], resolve)
}

// 2、es6提案的import()
const Home = () => import('path路径')

// 3、webpack提供的require.ensure()
{
    path: '/home',
    name: 'Home',
    component: r => require.ensure([],() =>  r(require('path路径')), 'demo')
}
```

### require.context()

`require.context(directory,useSubdirectories,regExp)`

- `directory`:说明需要检索的目录
- `useSubdirectories`: 是否检索子目录
- `regExp`: 匹配文件的正则表达式,一般是文件名

#### 使用场景

页面需要导入多个组件:

```js
import titleCom from '@/components/home/titleCom'
import bannerCom from '@/components/home/bannerCom'
import cellCom from '@/components/home/cellCom'

// ...
components: {
  titleCom, bannerCom, cellCom
}
```

利用`require.context`: 

```js
const path = require('path')
const files = require.context('@/components/home', false, /\.vue$/)
const modules = {}
files.keys().forEach(key => {
  const name = path.basename(key, '.vue')
  modules[name] = files(key).default || files(key)
})

// ...
components: modules
```

## 性能优化


### 利用好函数式组件

优化前代码:

```js
<template>
  <div class="cell">
    <div v-if="value" class="on"></div>
    <section v-else class="off"></section>
  </div>
</template>

<script>
export default {
  props: ['value'],
}
</script>
```

优化后:

```js
<template functional>
  <div class="cell">
    <div v-if="props.value" class="on"></div>
    <section v-else class="off"></section>
  </div>
</template>
```

这样的技巧可以减少js的执行时间. 函数式组件和普通的响应式组件不同, 它不会有状态, 也不会有响应式的数据, 生命周期钩子函数等. 可以当做一个生成DOM的Function. 

其基本原理就是监听滚动事件, 动态更新需要显示的DOM元素, 计算出它们在视图中的位移.


### 子组件拆分

优化前:

```html
<template>
  <div :style="{ opacity: number / 300 }">
    <ChildComp/>
  </div>
</template>

<script>
export default {
  components: {
    ChildComp: {
      methods: {
        heavy () {
          const n = 100000
          let result = 0
          for (let i = 0; i < n; i++) {
            result += Math.sqrt(Math.cos(Math.sin(42)))
          }
          return result
        },
      },
      render (h) {
        return h('div', this.heavy())
      }
    }
  },
  props: ['number']
}
</script>
```

优化后:

```html
<template>
  <div :style="{ opacity: number / 300 }">
    <ChildComp/>
  </div>
</template>

<script>
export default {
  components: {
    ChildComp: {
      methods: {
        heavy () {
          const n = 100000
          let result = 0
          for (let i = 0; i < n; i++) {
            result += Math.sqrt(Math.cos(Math.sin(42)))
          }
          return result
        },
      },
      render (h) {
        return h('div', this.heavy())
      }
    }
  },
  props: ['number']
}
</script>
```

优化前的组件通过`heavy`函数模拟了一个耗时的任务, 并且这个函数会在每次渲染的时候都执行一次, 所以每次组件的渲染都会消耗比较长的时间执行js, 优化后把这个任务封装在子组件`childcomp`中, 由于vue的更新是组件粒度的, 虽然每一帧都通过数据修改了父组件的重新渲染, 然是`childcomp`却不会重新渲染, 因此内部没有使用任何响应式的数据变化, 所以优化后的组件不会再每次渲染都执行耗时任务, 自然性能就提高了. 同样的, **计算属性**也能满足这种情况的性能优化. 



### 使用局部变量

优化前:

```html
<template>
  <div :style="{ opacity: start / 300 }">{{ result }}</div>
</template>

<script>
export default {
  props: ['start'],
  computed: {
    base () {
      return 42
    },
    result () {
      let result = this.start
      for (let i = 0; i < 1000; i++) {
        result += Math.sqrt(Math.cos(Math.sin(this.base))) + this.base * this.base + this.base + this.base * 2 + this.base * 3
      }
      return result
    },
  },
}
</script>
```

优化后:

```html
<template>
  <div :style="{ opacity: start / 300 }">{{ result }}</div>
</template>

<script>
export default {
  props: ['start'],
  computed: {
    base () {
      return 42
    },
    result ({ base, start }) {
      let result = start
      for (let i = 0; i < 1000; i++) {
        result += Math.sqrt(Math.cos(Math.sin(base))) + base * base + base + base * 2 + base * 3
      }
      return result
    },
  },
}
</script>
```

这里主要优化了`computed`的使用, 优化前的组件会多次访问`this.base`, 优化后会在计算前先用局部变量`base`, 缓存了`this.base`的值, 后面直接访问`base`. 

能优化的理由是: `this.base`实际上是在访问`getter`, 将其求值的结果返回给局部变量`base`, 后面再次访问就不会触发`getter`了, 也不会走依赖收集的逻辑了. 

### 合理的 v-show

优化前:

```html
<template functional>
  <div class="cell">
    <div v-if="props.value" class="on">
      <Heavy :n="10000"/>
    </div>
    <section v-else class="off">
      <Heavy :n="10000"/>
    </section>
  </div>
</template>
```

优化后:

```html
<template functional>
  <div class="cell">
    <div v-show="props.value" class="on">
      <Heavy :n="10000"/>
    </div>
    <section v-show="!props.value" class="off">
      <Heavy :n="10000"/>
    </section>
  </div>
</template>
```

优化前后的主要区别在于使用`v-show`替代了`v-if`. 虽然逻辑相似, 但是其内部实现差距还是比较大的.

`v-if`指令在编译阶段会编译为一个三元运算符, 条件渲染, 比如优化前的组件模板编译之后是这样的:

```js
function render() {
  with(this) {
    return _c('div', {
      staticClass: "cell"
    }, [(props.value) ? _c('div', {
      staticClass: "on"
    }, [_c('Heavy', {
      attrs: {
        "n": 10000
      }
    })], 1) : _c('section', {
      staticClass: "off"
    }, [_c('Heavy', {
      attrs: {
        "n": 10000
      }
    })], 1)])
  }
}
```

当`props.value`的值变化的时候, 会触发对应的组件更新, 对于`v-if`渲染的节点, 由于新旧节点的`vnode`不一致, 在核心的diff算法中, 会移除旧的vnode节点, 创建新的vnode节点, 会重新触发组件的初始化, 渲染, patch等过程. 

但是使用`v-show`, 则不同, 其组件模板编译后如下:

```js
function render() {
  with(this) {
    return _c('div', {
      staticClass: "cell"
    }, [_c('div', {
      directives: [{
        name: "show",
        rawName: "v-show",
        value: (props.value),
        expression: "props.value"
      }],
      staticClass: "on"
    }, [_c('Heavy', {
      attrs: {
        "n": 10000
      }
    })], 1), _c('section', {
      directives: [{
        name: "show",
        rawName: "v-show",
        value: (!props.value),
        expression: "!props.value"
      }],
      staticClass: "off"
    }, [_c('Heavy', {
      attrs: {
        "n": 10000
      }
    })], 1)])
  }
}
```

当`props.value`的值变化的时候, 会触发对应的组件更新, 对于`v-show`渲染的节点, 由于新旧节点是一样的, 它们只需要一直`patchVnode`就行了, 其内部原理大概是:

在`patchVNode`的过程中, 内部对执行`v-show`指令对应的钩子函数`update`, 然后根据`v-show`的值设置DOM元素的`display`的值. 

相比于`v-if`不断的删除和创建函数的新的DOM, `v-show`仅仅控制DOM的显示和隐藏. 

两个指令都有不同的使用场景, 需要根据合适的需求使用

### Deferred features 分批渲染组件

优化前:

```html
<template>
  <div class="deferred-off">
    <VueIcon icon="fitness_center" class="gigantic"/>

    <h2>I'm an heavy page</h2>

    <Heavy v-for="n in 8" :key="n"/>

    <Heavy class="super-heavy" :n="9999999"/>
  </div>
</template>
```

优化后:

```html
<template>
  <div class="deferred-on">
    <VueIcon icon="fitness_center" class="gigantic"/>

    <h2>I'm an heavy page</h2>

    <template v-if="defer(2)">
      <Heavy v-for="n in 8" :key="n"/>
    </template>

    <Heavy v-if="defer(3)" class="super-heavy" :n="9999999"/>
  </div>
</template>

<script>
import Defer from '@/mixins/Defer'

export default {
  mixins: [
    Defer(),
  ],
}
</script>
```

其中`@mixin/Defer`的工作原理如下:

```js
export default function (count = 10) {
  return {
    data () {
      return {
        displayPriority: 0
      }
    },

    mounted () {
      this.runDisplayPriority()
    },

    methods: {
      runDisplayPriority () {
        const step = () => {
          requestAnimationFrame(() => {
            this.displayPriority++
            if (this.displayPriority < count) {
              step()
            }
          })
        }
        step()
      },

      defer (priority) {
        return this.displayPriority >= priority
      }
    }
  }
}
```

`Defer`的主要思想是把一个组件的一次渲染拆分为多次, 它内部维护了`displayPriorty`, 然后通过`requestAnimationFrame`在每一帧渲染的时候自增, 最多加到`count`, 然后使`displayPriority`增加到`x`的时候渲染某些区块. 

当你有渲染耗时的组件, 使用`Deferred`做渐进式渲染是不错的方式. 

### Time slicing

优化前:

```js
fetchItems ({ commit }, { items }) {
  commit('clearItems')
  commit('addItems', items)
}
```

优化后:

```js
fetchItems ({ commit }, { items, splitCount }) {
  commit('clearItems')
  const queue = new JobQueue()
  splitArray(items, splitCount).forEach(
    chunk => queue.addJob(done => {
      // 分时间片提交数据
      requestAnimationFrame(() => {
        commit('addItems', chunk)
        done()
      })
    })
  )
  await queue.start()
}
```

优化后, 我们可以将大量数据进行拆分, 这种情况下, 就能避免页面直接卡死. 

### Non-reactive data

使用非响应式数据, 优化前:

```js
const data = items.map(
  item => ({
    id: uid++,
    data: item,
    vote: 0
  })
)
```

优化后:

```js
const data = items.map(
  item => optimizeItem(item)
)

function optimizeItem (item) {
  const itemData = {
    id: uid++,
    vote: 0
  }
  Object.defineProperty(itemData, 'data', {
    // Mark as non-reactive
    configurable: false,
    value: item
  })
  return itemData
}
```

优化后的代码执行时间会好于优化前的, 这是因为在内部提交数据的时候, 会默认把新提交的数据也定义成响应式的, 如果数据的子属性是对象形式, 还会递归的让子属性也变为响应式, 因此当提交的数据很多的嘶吼, 这个过程就变成了一个耗时的过程. 

而优化后我们把数据对象变为不可配置, 这样内部在walk获取对象属性的时候就会忽略这个`dtata`, 减少响应式的逻辑. 

类似这种还有直接挂在变量的方式:

```js
export default {
  created() {
    this.scroll = null
  },
  mounted() {
    this.scroll = new BScroll(this.$el)
  }
}
```

这样就可以在上下文中访问`scroll`, 又不进行响应式的监听.

### Virtual Scrolling 虚拟列表

优化前:

```html
<div class="items no-v">
  <FetchItemViewFunctional
    v-for="item of items"
    :key="item.id"
    :item="item"
    @vote="voteItem(item)"
  />
</div>
```

优化后:

```html
<recycle-scroller
  class="items"
  :items="items"
  :item-size="24"
>
  <template v-slot="{ item }">
    <FetchItemView
      :item="item"
      @vote="voteItem(item)"
    />
  </template>
</recycle-scroller>
```

### 使用 Keep-Alive 缓存组件状态

在组件之间切换的时候, 可以使用该API来避免组件来回切换重复渲染导致的问题. 使用`keep-alive`缓存组件可以让组件在被移除的时候缓存器Vnode信息, 而不是直接释放他们.

```html
<keep-alive>
    <component v-bind:is="currentComponent" class="tab"></component>
</keep-alive>
```


## 参考链接

- [揭秘 Vue.js 九个性能优化技巧](https://juejin.cn/post/6922641008106668045)