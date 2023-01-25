# Vue-新变化

## 整体的提升和优化

### 源码体积的优化

- 重写了虚拟dom
- 移除了不常用的API
- 更好的tree shaking支持

### 响应式系统的升级

- 使用`Proxy`和`Reflect`来代替vue2中的`Object.defineproperty`
- 可以监听动态新增/删除的属性
- 可以监听数组的索引和length属性

### 代码编译优化

- 使用了组合式API来代替options api, 更方便维护
- 组件内部不需要根节点了
- vue3会标记和提升所有的静态根节点, diff只比较动态节点内容, 静态节点被提升到render方法之外, 对于动态组件, 会在其末尾添加patchFlag, 用于快速的找到动态节点, 而不用逐级遍历, 提高了dom diff的性能
- 缓存时间处理函数cacheHandler, 避免了每次触发都要重新生成function去更新之前的函数
- tree shaking 优化

## 全局API 变化

```js
import { createApp } from 'vue'

const app = createApp({})
```

现在`Vue`不会再是一个全局的属性挂载, 而是创建一个应用实例.

原本的一些全局调用的api也就被迁移到了`app`实例上面:

| 2.x 全局 API               | 3.x 实例 API (app)                  |
| -------------------------- | ----------------------------------- |
| Vue.config                 | app.config                          |
| Vue.config.productionTip   | removed (见下方)                    |
| Vue.config.ignoredElements | app.config.isCustomElement (见下方) |
| Vue.component              | app.component                       |
| Vue.directive              | app.directive                       |
| Vue.mixin                  | app.mixin                           |
| Vue.use                    | app.use (见下方)                    |

所有其他的不改变全局行为的全局API现在都成为了`exports`的属性

### `config.productionTip`移除

对于 ES 模块构建，由于它们是与 bundler 一起使用的，而且在大多数情况下，CLI 或样板已经正确地配置了生产环境，所以本技巧将不再出现

### `config.ignoredElements`替换为`config.isCustomElement`

```js
// before
Vue.config.ignoredElements = ['my-el', /^ion-/]

// after
const app = Vue.createApp({})
app.config.isCustomElement = tag => tag.startsWith('ion-')
```

并且, `Vue.use`已经停止使用, 因此现在需要开发者在应用程序实力上显示的指定使用该插件:

```js
const app = createApp(MyApp)
app.use(VueRouter)
```

## Teleport

用于把当前的组件的部分内容挂载到全局的任意位置, 例如下面这个例子:

```js
app.component('modal-button', {
  template: `
    <button @click="modalOpen = true">
        Open full screen modal! (With teleport!)
    </button>

    <teleport to="body">
      <div v-if="modalOpen" class="modal">
        <div>
          I'm a teleported modal! 
          (My parent is "body")
          <button @click="modalOpen = false">
            Close
          </button>
        </div>
      </div>
    </teleport>
  `,
  data() {
    return { 
      modalOpen: false
    }
  }
})
```

### 与 Vue Components 一起使用

```js
const app = Vue.createApp({
  template: `
    <h1>Root instance</h1>
    <parent-component />
  `
})

app.component('parent-component', {
  template: `
    <h2>This is a parent component</h2>
    <teleport to="#endofbody">
      <child-component name="John" />
    </teleport>
  `
})

app.component('child-component', {
  props: ['name'],
  template: `
    <div>Hello, {{ name }}</div>
  `
})
```

在这个例子下面, 即使在不同的地方渲染`child-component`, 它任然是`parent-component`的子组件, 并将从中接受`name`的prop. 

### 在多个目标上使用多个Teleport

对于多个同目标的挂载, 会循序挂载

```js
<teleport to="#modals">
  <div>A</div>
</teleport>
<teleport to="#modals">
  <div>B</div>
</teleport>

<!-- result-->
<div id="modals">
  <div>A</div>
  <div>B</div>
</div>
```

## 片段

Vue3 现在支持多根组件了, 不过要求明确定义属性应该分布在哪里:

```vue
<!-- Layout.vue -->
<template>
  <header>...</header>
  <main v-bind="$attrs">...</main>
  <footer>...</footer>
</template>
```

## 自定义事件

### 事件名

事件名不存在大小写转换, 因此推荐使用`kebab-case`的事件名.

### 定义自定义事件

```js
app.component('custom-form', {
  emits: ['in-focus', 'submit']
})
```

推荐定义所有发出的事件.

### 验证抛出的事件

```js
app.component('custom-form', {
  emits: {
    // 没有验证
    click: null,

    // 验证submit 事件
    submit: ({ email, password }) => {
      if (email && password) {
        return true
      } else {
        console.warn('Invalid submit event payload!')
        return false
      }
    }
  },
  methods: {
    submitForm() {
      this.$emit('submit', { email, password })
    }
  }
})
```

返回的布尔值被用来指示该事件是否有效. 

### v-model

默认的, 组件现在使用`modelValue`属性和`update:modeValue`作为时间. 我们可以通过向`v-model`传递参数来修改这些名称:

```js
<my-component v-model:foo="bar"></my-component>
```

对于这个组件, 相应的内容如下: 

```js
const app = Vue.createApp({})

app.component('my-component', {
  props: {
    foo: String
  },
  template: `
    <input 
      type="text"
      :value="foo"
      @input="$emit('update:foo', $event.target.value)">
  `
})
```

### 多个v-model

```js
<user-name
  v-model:first-name="firstName"
  v-model:last-name="lastName"
></user-name>
```

实现示例如下:

```js
const app = Vue.createApp({})

app.component('user-name', {
  props: {
    firstName: String,
    lastName: String
  },
  template: `
    <input 
      type="text"
      :value="firstName"
      @input="$emit('update:firstName', $event.target.value)">

    <input
      type="text"
      :value="lastName"
      @input="$emit('update:lastName', $event.target.value)">
  `
})
```

### 修饰符

在 3.x 中，添加到组件`v-model`的修饰符将通过`modelModifiers prop`提供给组件：

```html
<my-component v-model.capitalize="bar"></my-component>
```

该修饰符实现如下:

```js
app.component('my-component', {
  props: {
    modelValue: String,
    modelModifiers: {
      default: () => ({})
    }
  },
  template: `
    <input type="text" 
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)">
  `,
  created() {
    console.log(this.modelModifiers) // { capitalize: true }
  }
})
```

对于带参的model, 则将`model`替换为对应的参数即可.


## 响应式API

### ref

在`vue3`中, 我们通过这个方法使一个变量变成一个响应式变量

```js
import { ref } from 'vue'

const counter = ref(0)
```

`ref`接受参数并返回它包装在具有`value`property的对象中, 然后可以使用该`property`访问或者更改响应式变量的值.

```js
import { ref } from 'vue'

const counter = ref(0)

console.log(counter) // { value: 0 }
console.log(counter.value) // 0

counter.value++
console.log(counter.value) // 1
```

::: tip
因为在js中, 基础类型是值传递而不是引用传递的, 所以有必要将它放在一个对象中. `ref`的本质就是创建了一个响应式引用.
:::

### reactive

要为对象创建响应性, 可以使用`reactive`方法:

```js
import { reactive } from 'vue'

// 响应式状态
const state = reactive({
  count: 0
})
```

### 响应式解构

解构会导致`property`失去响应性. 对于这种情况, 我们可以将响应式对象转换为一组`ref`:

```js
import { reactive, toRefs } from 'vue'

const book = reactive({
  author: 'Vue Team',
  year: '2020',
  title: 'Vue 3 Guide',
  description: 'You are reading this book right now ;)',
  price: 'free'
})

let { author, title } = toRefs(book)

title.value = 'Vue 3 Detailed Guide' // 我们需要使用 .value 作为标题，现在是 ref
console.log(book.title) // 'Vue 3 Detailed Guide'
```

### readonly

`readonly`可以防止响应式对象被改变:

```js
import { reactive, readonly } from 'vue'

const original = reactive({ count: 0 })

const copy = readonly(original)

// 在copy上转换original 会触发侦听器依赖

original.count++

// 转换copy 将导失败并导致警告
copy.count++ // 警告: "Set operation on key 'count' failed: target is readonly."
```

### computed

类似于`computed`属性, 用于在vue组件外部创建计算属性:

```js
import { ref, computed } from 'vue'

const counter = ref(0)
const twiceTheCounter = computed(() => counter.value * 2)

counter.value++
console.log(counter.value) // 1
console.log(twiceTheCounter.value) // 2
```

### watchEffect

`watchEffect`会立即执行传入的一个函数, 同时响应式追踪其依赖, 并在依赖滨化时重新运行该函数:

```js
const count = ref(0)

watchEffect(() => console.log(count.value))
// -> logs 0

setTimeout(() => {
  count.value++
  // -> logs 1
}, 100)
```

`watchEffect`会在组件卸载时自动停止, 也可以手动停止:

```js
const stop = watchEffect(() => {
  /* ... */
})

// later
stop()
```

此外, 当`watchEffect`中的提供了一个失效回调:

```js
watchEffect(onInvalidate => {
  const token = performAsyncOperation(id.value)
  onInvalidate(() => {
    // id has changed or watcher is stopped.
    // invalidate previously pending async operation
    token.cancel()
  })
})
```

在执行数据请求的时候, 副作用函数往往是一个异步函数:

```js
const data = ref(null)
watchEffect(async onInvalidate => {
  onInvalidate(() => {...}) // 我们在Promise解析之前注册清除函数
  data.value = await fetchData(props.id)
})
```

清理函数必须在`Promise`被`resolve`之前被注册, 另外, Vue依赖这个返回的promise来自动处理promise链上的潜在错误.

#### 副作用的刷新时间

vue的向影心提供会缓存副作用函数, 并一步的刷新他们. 并在会在所有组件的`update`前执行.

如果你需要在组件`update`后执行`watchEffect`, 则需要传递带有`flush`选项的附加`options`:

```js
// fire before component updates
watchEffect(
  () => {
    /* ... */
  },
  {
    flush: 'post'
  }
)
```

#### 侦听器调试

- `onTrack` 将在响应式 property 或 ref 作为依赖项被追踪时被调用。
- `onTrigger` 将在依赖项变更导致副作用被触发时被调用。

```js
watchEffect(
  () => {
    /* 副作用 */
  },
  {
    onTrigger(e) {
      debugger
    }
  }
)
```

### watch

相比于`watchEffect`, `watch`可以:

- 懒执行副作用
- 具体的说明什么状态应该处罚侦听器重新运行
- 访问侦听状态变化前后的值


就像`watch`选项一样, 可以在一个`property`上设置一个侦听器, 他接受三个参数:

- 一个响应式引用或者我们想要的侦听的getter函数
- 一个回调
- 一个可选的配置项

```js
import { ref, watch } from 'vue'

// 直接侦听ref
const counter = ref(0)
watch(counter, (newValue, oldValue) => {
  console.log('The new counter value is: ' + counter.value)
})

// 侦听一个 getter
const state = reactive({ count: 0 })
watch(
  () => state.count,
  (count, prevCount) => {
    /* ... */
  }
)
```

或者侦听多个数据源:

```js
watch([fooRef, barRef], ([foo, bar], [prevFoo, prevBar]) => {
  /* ... */
})
```

对于停止侦听, 清除副作用, 副作用刷新时机和侦听器调试行为与`watchEffect`一致.

## setup

`setup`执行在创建组件之前, props被解析之后, 并作为合成API的入口

因此这个时候`setup`是无法访问`this`的, 只能访问`prop`

`setup`接受`prop`和`context`, 返回的所有内容则会暴露给组件的其余部分

### props

`setup`函数接受的第一个参数是`props`, 并且他是响应式的. 当新的`prop`被传入时, 就会更新.

::: tip
不要用es6结构prop, 这样会消解prop的响应性.
:::

如果需要解构, 则应该使用`toRefs`来手动赋予响应性:

```js
import { toRefs } from 'vue'
setup(props) {
	const { title } = toRefs(props)
	console.log(title.value)
}
```

### context

`context`是传递给`setup`函数的第二个参数, 主要暴露三个组件的`property`.

```js
export default {
  setup(props, context) {
    // Attribute (非响应式对象)
    console.log(context.attrs)

    // 插槽 (非响应式对象)
    console.log(context.slots)

    // 触发事件 (方法)
    console.log(context.emit)
  }
}
```

`context`是普通的js对象, 因此可以安全的解构:

```js
export default {
  setup(props, { attrs, slots, emit }) {
    ...
  }
}
```

### 访问组件的property

执行`setup`时, 可以访问:

- props
- attrs
- slots
- emit

无法访问:

- data
- computed
- methods

### 结合template

`setup`返回的对象属性可以在`template`中直接访问, 并且对于`refs`是不需要手动解开的:

```vue
<template>
  <div>{{ readersNumber }} {{ book.title }}</div>
</template>

<script>
  import { ref, reactive } from 'vue'

  export default {
    setup() {
      const readersNumber = ref(0)
      const book = reactive({ title: 'Vue 3 Guide' })

      // expose to template
      return {
        readersNumber,
        book
      }
    }
  }
</script>
```

### 使用渲染函数

也可以返回一个渲染函数, 该函数可以直接使用在同一作用域中声明的响应式状态

```js
import { h, ref, reactive } from 'vue'

export default {
  setup() {
    const readersNumber = ref(0)
    const book = reactive({ title: 'Vue 3 Guide' })
    return () => h('div', [readersNumber.value, book.title])
  }
}
```

### 不要误用this

在`setup`内部的`this`是不同于其他选项中的`this`的. 减少使用可以减少混淆


## 生命周期钩子

| 选项式 API      | Hook inside setup |
| --------------- | ----------------- |
| beforeCreate    | Not needed*       |
| created         | Not needed*       |
| beforeMount     | onBeforeMount     |
| mounted         | onMounted         |
| beforeUpdate    | onBeforeUpdate    |
| updated         | onUpdated         |
| beforeUnmount   | onBeforeUnmount   |
| unmounted       | onUnmounted       |
| errorCaptured   | onErrorCaptured   |
| renderTracked   | onRenderTracked   |
| renderTriggered | onRenderTriggered |

`beforeCreate`和`created`生命周期钩子是不需要显示的定义的, 这两个钩子中的任何代码都可以在`setup`中直接编写.

这些函数接受一个回调:

```js
export default {
  setup() {
    // mounted
    onMounted(() => {
      console.log('Component is mounted!')
    })
  }
}
```

## Provide / Inject

在`setup`中显示导入`provide`, `prodive`允许通过两个参数定义每个`property`:

- property 的 name
- property 的 value

```vue
<!-- src/components/MyMap.vue -->
<template>
  <MyMarker />
</template>

<script>
import { provide } from 'vue'
import MyMarker from './MyMarker.vue

export default {
  components: {
    MyMarker
  },
  setup() {
    provide('location', 'North Pole')
    provide('geolocation', {
      longitude: 90,
      latitude: 135
    })
  }
}
</script>
```

然后在子组件中显示调用`inject`, 同样的, `inject`也有两个参数:

- 要注入的`property`的名称
- 一个默认的值(可选)

```vue
<!-- src/components/MyMarker.vue -->
<script>
import { inject } from 'vue'

export default {
  setup() {
    const userLocation = inject('location', 'The Universe')
    const userGeolocation = inject('geolocation')

    return {
      userLocation,
      userGeolocation
    }
  }
}
</script>
```

### 响应性

为了增加`provide`和`inject`之间的响应性, 我们可以在`provide`里面使用`ref`或者`reactive`.

这样, 就可以为属性增加响应性:

```js
import { provide, reactive, ref } from 'vue'
import MyMarker from './MyMarker.vue

export default {
  components: {
    MyMarker
  },
  setup() {
    const location = ref('North Pole')
    const geolocation = reactive({
      longitude: 90,
      latitude: 135
    })

    provide('location', location)
    provide('geolocation', geolocation)
  }
}
```

### 修改响应式`property`

**建议尽可能，在`provide`内保持响应式 property 的任何更改**

比如这样:

```js
import { provide, reactive, ref } from 'vue'
import MyMarker from './MyMarker.vue

export default {
  components: {
    MyMarker
  },
  setup() {
    const location = ref('North Pole')
    const geolocation = reactive({
      longitude: 90,
      latitude: 135
    })

    provide('location', location)
    provide('geolocation', geolocation)

    return {
      location
    }
  },
  methods: {
    updateLocation() {
      this.location = 'South Pole'
    }
  }
}
```

如果需要在`inject`端修改输入的数据, 可以`provide`一个方法来负责修改响应式的`property`.

```js
import { provide, reactive, ref } from 'vue'
import MyMarker from './MyMarker.vue

export default {
  components: {
    MyMarker
  },
  setup() {
    const location = ref('North Pole')
    const geolocation = reactive({
      longitude: 90,
      latitude: 135
    })

    const updateLocation = () => {
      location.value = 'South Pole'
    }

    provide('location', location)
    provide('geolocation', geolocation)
    provide('updateLocation', updateLocation)
  }
}
```

在响应端:

```js
import { inject } from 'vue'

export default {
  setup() {
    const userLocation = inject('location', 'The Universe')
    const userGeolocation = inject('geolocation')
    const updateUserLocation = inject('updateLocation')

    return {
      userLocation,
      userGeolocation,
      updateUserLocation
    }
  }
}
```

最后, 如果要保证`property`不被注入的组件修改, 最好对`property`加上`readonly`:

```js
import { provide, reactive, readonly, ref } from 'vue'
import MyMarker from './MyMarker.vue

export default {
  ...
  setup() {
    ...

    provide('location', readonly(location))
    provide('geolocation', readonly(geolocation))
    provide('updateLocation', updateLocation)
  }
}
```

## 模板引用

```vue
<template> 
  <div ref="root">This is a root element</div>
</template>

<script>
  import { ref, onMounted } from 'vue'

  export default {
    setup() {
      const root = ref(null)

      onMounted(() => {
        // DOM元素将在初始渲染后分配给ref
        console.log(root.value) // <div>这是根元素</div>
      })

      return {
        root
      }
    }
  }
</script>
```

在使用组合API的时候, 响应式引用和模板引用的概念是同一的. 

这里我们在渲染上下文中暴露`root`, 并通过`ref=root`将之绑定到div作为其`ref`. 在`virtual dom`的`diff`过程中, 如果`vnode`的`ref`对应了上下文中的`ref`, 就会把`vnode`的元素或者组件的实例挂载到`ref`的值上

### JSX

```js
export default {
  setup() {
    const root = ref(null)

    return () =>
      h('div', {
        ref: root
      })

    // with JSX
    return () => <div ref={root} />
  }
}
```

### v-for

```vue
<template>
  <div v-for="(item, i) in list" :ref="el => { if (el) divs[i] = el }">
    {{ item }}
  </div>
</template>

<script>
  import { ref, reactive, onBeforeUpdate } from 'vue'

  export default {
    setup() {
      const list = reactive([1, 2, 3])
      const divs = ref([])

      // 确保在每次更新之前重置ref
      onBeforeUpdate(() => {
        divs.value = []
      })

      return {
        list,
        divs
      }
    }
  }
</script>
```

## 参考链接

- [vue3 官方文档](https://vue3js.cn/docs/zh/)
- [Vue3的优势](https://zhuanlan.zhihu.com/p/351445575)