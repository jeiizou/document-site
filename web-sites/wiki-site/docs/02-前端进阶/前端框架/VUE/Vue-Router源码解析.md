# Vue-Router源码解析


## 路由的实现原理

### 路由对象的创建

vue router 提供了一个createRouterApi, 可以用他来创建一个路由对象. 

```ts
function createRouter(options) {
  // 定义一些辅助方法和变量 
  
  // ...
  
  // 创建 router 对象
  const router = {
    // 当前路径
    currentRoute,
    addRoute,
    removeRoute,
    hasRoute,
    getRoutes,
    resolve,
    options,
    push,
    replace,
    go,
    back: () => go(-1),
    forward: () => go(1),
    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,
    onError: errorHandlers.add,
    isReady,
    install(app) {
      // 安装路由函数
    }
  }
  return router
}
```

这里省略的大部分的代码, 可以看到路由router就是一个对象, 它委会了当前路径currentRoute, 并且拥有很多辅助方法. 

### 路由的安装

当执行app.use的时候, 就是在执行`router.install`方法来安装路由:

```ts
const router = {
  install(app) {
    const router = this
    // 注册路由组件
    app.component('RouterLink', RouterLink)
    app.component('RouterView', RouterView)
    // 全局配置定义 $router 和 $route
    app.config.globalProperties.$router = router
    Object.defineProperty(app.config.globalProperties, '$route', {
      get: () => unref(currentRoute),
    })
    // 在浏览器端初始化导航
    if (isBrowser &&
      !started &&
      currentRoute.value === START_LOCATION_NORMALIZED) {
      // see above
      started = true
      push(routerHistory.location).catch(err => {
        warn('Unexpected error when starting the router:', err)
      })
    }
    // 路径变成响应式
    const reactiveRoute = {}
    for (let key in START_LOCATION_NORMALIZED) {
      reactiveRoute[key] = computed(() => currentRoute.value[key])
    }
    // 全局注入 router 和 reactiveRoute
    app.provide(routerKey, router)
    app.provide(routeLocationKey, reactive(reactiveRoute))
    let unmountApp = app.unmount
    installedApps.add(app)
    // 应用卸载的时候，需要做一些路由清理工作
    app.unmount = function () {
      installedApps.delete(app)
      if (installedApps.size < 1) {
        removeHistoryListener()
        currentRoute.value = START_LOCATION_NORMALIZED
        started = false
        ready = false
      }
      unmountApp.call(this, arguments)
    }
  }
}
```

安装过程中我们主要关注两件事:

1. 全局注册了RouterView和RouterLink组件.
2. 通过provider方式全局注入了router对象和reactiveRoute对象, 其中router表示用户通过creareRouter创建的路由对象, 我们可以通过它去动态的操作路由, reactiveRoute表示响应式的路径对象, 它维护了路径相关信息.

下面的问题就只剩下了: 路径是如何管理的, 路径和路由组件的渲染是如何映射的/

### 路径的管理

路由的基础结构就是一个路径对应一种视图, 当我们切换路径的时候对应的视图也会切换, 因此路径的管理就尤为重要.

首先我们需要维护当前的路径currentRoute, 可以给他一个初始值`START_LOCATION_NORMALIZED`, 如下:

```ts
const START_LOCATION_NORMALIZED = {
  path: '/',
  name: undefined,
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
  redirectedFrom: undefined
}
```

路由发生变化, 就是通过改变路径完成的, 路由对象提供了很多改变路径的方法, 比如`router.push`等等, 底层都是通过`pushWithRedirect`完成路径的切换, 其实现如下:

```ts
function pushWithRedirect(to, redirectedFrom) {
  const targetLocation = (pendingLocation = resolve(to))
  const from = currentRoute.value
  const data = to.state
  const force = to.force
  const replace = to.replace === true
  const toLocation = targetLocation
  toLocation.redirectedFrom = redirectedFrom
  let failure
  if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
    failure = createRouterError(16 /* NAVIGATION_DUPLICATED */, { to: toLocation, from })
    handleScroll(from, from, true, false)
  }
  return (failure ? Promise.resolve(failure) : navigate(toLocation, from))
    .catch((error) => {
      if (isNavigationFailure(error, 4 /* NAVIGATION_ABORTED */ |
        8 /* NAVIGATION_CANCELLED */ |
        2 /* NAVIGATION_GUARD_REDIRECT */)) {
        return error
      }
      return triggerError(error)
    })
    .then((failure) => {
      if (failure) {
        // 处理错误
      }
      else {
        failure = finalizeNavigation(toLocation, from, true, replace, data)
      }
      triggerAfterEach(toLocation, from, failure)
      return failure
    })
}
```

`pushWithRedirect`的核心思路, 首先to可能有多种情况, 可以是一个字符串, 也可以是一个路径对象, 所以要先经过一层resolve返回一个新的路径对象, 会多一个matched属性.

得到新的目标路径后, 接下来执行navigate方法, 实际上是执行留有切换过程中的一系列导航守卫函数, navigate成功后, 会执行`finalizeNavigation`方法完成导航. 

```ts
function finalizeNavigation(toLocation, from, isPush, replace, data) {
  const error = checkCanceledNavigation(toLocation, from)
  if (error)
    return error
  const isFirstNavigation = from === START_LOCATION_NORMALIZED
  const state = !isBrowser ? {} : history.state
  if (isPush) {
    if (replace || isFirstNavigation)
      routerHistory.replace(toLocation.fullPath, assign({
        scroll: isFirstNavigation && state && state.scroll,
      }, data))
    else
      routerHistory.push(toLocation.fullPath, data)
  }
  currentRoute.value = toLocation
  handleScroll(toLocation, from, isPush, isFirstNavigation)
  markAsReady()
}
```

这里有两个重点逻辑:

- 更新当前的路径currentRoute值
- 执行routerHistory.push或者routerHistory.replace方法更新浏览器的URL记录

当我们切换路由的时候, 你就会发现URL发生了变化, 但是页面没有刷新, 是应为借助了H5的historyAPI

```ts
function createWebHistory(base) {
  base = normalizeBase(base)
  const historyNavigation = useHistoryStateNavigation(base)
  const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace)
  function go(delta, triggerListeners = true) {
    if (!triggerListeners)
      historyListeners.pauseListeners()
    history.go(delta)
  }
  const routerHistory = assign({
    // it's overridden right after
    location: '',
    base,
    go,
    createHref: createHref.bind(null, base),
  }, historyNavigation, historyListeners)
  Object.defineProperty(routerHistory, 'location', {
    get: () => historyNavigation.location.value,
  })
  Object.defineProperty(routerHistory, 'state', {
    get: () => historyNavigation.state.value,
  })
  return routerHistory
}
```

routerHistory的作用一个是路径的切换, 一个是监听路径的变化. 

其中路径切换主要通过`historyNavigation`来完成的, 它是`useHistoryStateNavigation`函数的返回值:

```ts
function useHistoryStateNavigation(base) {
  const { history, location } = window
  let currentLocation = {
    value: createCurrentLocation(base, location),
  }
  let historyState = { value: history.state }
  if (!historyState.value) {
    changeLocation(currentLocation.value, {
      back: null,
      current: currentLocation.value,
      forward: null,
      position: history.length - 1,
      replaced: true,
      scroll: null,
    }, true)
  }
  function changeLocation(to, state, replace) {
    const url = createBaseLocation() +
      // preserve any existing query when base has a hash
      (base.indexOf('#') > -1 && location.search
        ? location.pathname + location.search + '#'
        : base) +
      to
    try {
      history[replace ? 'replaceState' : 'pushState'](state, '', url)
      historyState.value = state
    }
    catch (err) {
      warn('Error with push/replace State', err)
      location[replace ? 'replace' : 'assign'](url)
    }
  }
  function replace(to, data) {
    const state = assign({}, history.state, buildState(historyState.value.back,
      // keep back and forward entries but override current position
      to, historyState.value.forward, true), data, { position: historyState.value.position })
    changeLocation(to, state, true)
    currentLocation.value = to
  }
  function push(to, data) {
    const currentState = assign({},
      historyState.value, history.state, {
        forward: to,
        scroll: computeScrollPosition(),
      })
    if ( !history.state) {
      warn(`history.state seems to have been manually replaced without preserving the necessary values. Make sure to preserve existing history state if you are manually calling history.replaceState:\n\n` +
        `history.replaceState(history.state, '', url)\n\n` +
        `You can find more information at https://next.router.vuejs.org/guide/migration/#usage-of-history-state.`)
    }
    changeLocation(currentState.current, currentState, true)
    const state = assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data)
    changeLocation(to, state, false)
    currentLocation.value = to
  }
  return {
    location: currentLocation,
    state: historyState,
    push,
    replace
  }
}
```

该函数返回的push和replace函数, 会添加给routerHistory对象上, 因此当我们调用routerHistory.push或者routerHistory.replace方法的时候就是在执行这两个函数.

push和replace方法内部都是执行了changeLoaction方法, 该函数内部执行了浏览器的history.pushState/histpry.replaceState方法, 会想当前浏览器绘画的历史堆栈中添加一个状态. 

此外我们还需要监听浏览器的回退事件:

```ts
function useHistoryListeners(base, historyState, currentLocation, replace) {
  let listeners = []
  let teardowns = []
  let pauseState = null
  const popStateHandler = ({ state, }) => {
    const to = createCurrentLocation(base, location)
    const from = currentLocation.value
    const fromState = historyState.value
    let delta = 0
    if (state) {
      currentLocation.value = to
      historyState.value = state
      if (pauseState && pauseState === from) {
        pauseState = null
        return
      }
      delta = fromState ? state.position - fromState.position : 0
    }
    else {
      replace(to)
    }
    listeners.forEach(listener => {
      listener(currentLocation.value, from, {
        delta,
        type: NavigationType.pop,
        direction: delta
          ? delta > 0
            ? NavigationDirection.forward
            : NavigationDirection.back
          : NavigationDirection.unknown,
      })
    })
  }
  function pauseListeners() {
    pauseState = currentLocation.value
  }
  function listen(callback) {
    listeners.push(callback)
    const teardown = () => {
      const index = listeners.indexOf(callback)
      if (index > -1)
        listeners.splice(index, 1)
    }
    teardowns.push(teardown)
    return teardown
  }
  function beforeUnloadListener() {
    const { history } = window
    if (!history.state)
      return
    history.replaceState(assign({}, history.state, { scroll: computeScrollPosition() }), '')
  }
  function destroy() {
    for (const teardown of teardowns)
      teardown()
    teardowns = []
    window.removeEventListener('popstate', popStateHandler)
    window.removeEventListener('beforeunload', beforeUnloadListener)
  }
  window.addEventListener('popstate', popStateHandler)
  window.addEventListener('beforeunload', beforeUnloadListener)
  return {
    pauseListeners,
    listen,
    destroy
  }
}
```

该函数返回了listen方法, 允许添加一些侦听器, 侦听history的变化, 同时该方法也被挂载到了routerHistory对象上, 这样外部那就可以访问到了. 

还函数内部还监听了浏览器底层的window.popstate事件, 当我们点击浏览器的回退或者执行back方法的时候, 会触发事件的回调函数popStateHandler, 进而遍历真题器listeners, 执行每一个侦听器函数. 

这些侦听器在安装路由的时候, 会执行一次初始化导航, 通过`push->finalizeNavigation->markAsReady`方法进行增加:

```ts
function markAsReady(err) {
  if (ready)
    return
  ready = true
  setupListeners()
  readyHandlers
    .list()
    .forEach(([resolve, reject]) => (err ? reject(err) : resolve()))
  readyHandlers.reset()
}
```

markAsReady 内部会执行 setupListeners 函数初始化侦听器，且保证只初始化一次:

```ts
function setupListeners() {
  removeHistoryListener = routerHistory.listen((to, _from, info) => {
    const toLocation = resolve(to)
    pendingLocation = toLocation
    const from = currentRoute.value
    if (isBrowser) {
      saveScrollPosition(getScrollKey(from.fullPath, info.delta), computeScrollPosition())
    }
    navigate(toLocation, from)
      .catch((error) => {
        if (isNavigationFailure(error, 4 /* NAVIGATION_ABORTED */ | 8 /* NAVIGATION_CANCELLED */)) {
          return error
        }
        if (isNavigationFailure(error, 2 /* NAVIGATION_GUARD_REDIRECT */)) {
          if (info.delta)
            routerHistory.go(-info.delta, false)
          pushWithRedirect(error.to, toLocation
          ).catch(noop)
          // avoid the then branch
          return Promise.reject()
        }
        if (info.delta)
          routerHistory.go(-info.delta, false)
        return triggerError(error)
      })
      .then((failure) => {
        failure =
          failure ||
          finalizeNavigation(
            toLocation, from, false)
        if (failure && info.delta)
          routerHistory.go(-info.delta, false)
        triggerAfterEach(toLocation, from, failure)
      })
      .catch(noop)
  })
}
```

侦听器函数也是执行navigate方法, 执行路由切换过程中的一些列导航守卫函数, 在navigate成功后执行finalizeNavigatetion完成导航, 完成真正的路径切换. 这样就保证了回退的时候可以恢复到上一个路径以及更新路由视图. 

## 路径和路由组件的映射

RouterView的实现如下:

```ts
const RouterView = defineComponent({
  name: 'RouterView',
  props: {
    name: {
      type: String,
      default: 'default',
    },
    route: Object,
  },
  setup(props, { attrs, slots }) {
    warnDeprecatedUsage()
    const injectedRoute = inject(routeLocationKey)
    const depth = inject(viewDepthKey, 0)
    const matchedRouteRef = computed(() => (props.route || injectedRoute).matched[depth])
    provide(viewDepthKey, depth + 1)
    provide(matchedRouteKey, matchedRouteRef)
    const viewRef = ref()
    watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
      if (to) {
        to.instances[name] = instance
        if (from && instance === oldInstance) {
          to.leaveGuards = from.leaveGuards
          to.updateGuards = from.updateGuards
        }
      }
      if (instance &&
        to &&
        (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
        (to.enterCallbacks[name] || []).forEach(callback => callback(instance))
      }
    })
    return () => {
      const route = props.route || injectedRoute
      const matchedRoute = matchedRouteRef.value
      const ViewComponent = matchedRoute && matchedRoute.components[props.name]
      const currentName = props.name
      if (!ViewComponent) {
        return slots.default
          ? slots.default({ Component: ViewComponent, route })
          : null
      }
      const routePropsOption = matchedRoute.props[props.name]
      const routeProps = routePropsOption
        ? routePropsOption === true
          ? route.params
          : typeof routePropsOption === 'function'
            ? routePropsOption(route)
            : routePropsOption
        : null
      const onVnodeUnmounted = vnode => {
        if (vnode.component.isUnmounted) {
          matchedRoute.instances[currentName] = null
        }
      }
      const component = h(ViewComponent, assign({}, routeProps, attrs, {
        onVnodeUnmounted,
        ref: viewRef,
      }))
      return (
        slots.default
          ? slots.default({ Component: component, route })
          : component)
    }
  },
})
```

通常被不带插槽的情况下, 会返回component变量, 它是根据ViewComponent渲染出来的, 而ViewComponent是根据`matchedRoute.components[props.name]`求得的, 而`matchedRoute`是`matchRouteRef`对应的value.

`matchedRouteRef`一个计算属性, 在不考虑prop传入route的情况下, 它的getter是由`injectedRoute.matched[depth]`求得的, 而`injectedRoute`, 就是我们在前面在安装路由的时候, 注入的响应式currentRoute对象. 

RouterView 的渲染的路由组件和当前路径 currentRoute 的 matched 对象相关，也和 RouterView 自身的嵌套层级相关

当我们执行 createRouter 函数创建路由的时候，内部会执行如下代码来创建一个 matcher 对象：

```ts
const matcher = createRouterMatcher(options.routes, options)
```

执行了`createRouterMatcher`函数，并传入 routes 路径配置数组，它的目的就是根据路径配置对象创建一个路由的匹配对象，再来看它的实现：

```ts
function createRouterMatcher(routes, globalOptions) {
  const matchers = []
  const matcherMap = new Map()
  globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions)
  
  function addRoute(record, parent, originalRecord) {
    let isRootAdd = !originalRecord
    let mainNormalizedRecord = normalizeRouteRecord(record)
    mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record
    const options = mergeOptions(globalOptions, record)
    const normalizedRecords = [
      mainNormalizedRecord,
    ]
    let matcher
    let originalMatcher
    for (const normalizedRecord of normalizedRecords) {
      let { path } = normalizedRecord
      if (parent && path[0] !== '/') {
        let parentPath = parent.record.path
        let connectingSlash = parentPath[parentPath.length - 1] === '/' ? '' : '/'
        normalizedRecord.path =
          parent.record.path + (path && connectingSlash + path)
      }
      matcher = createRouteRecordMatcher(normalizedRecord, parent, options)
      if ( parent && path[0] === '/')
        checkMissingParamsInAbsolutePath(matcher, parent)
      if (originalRecord) {
        originalRecord.alias.push(matcher)
        {
          checkSameParams(originalRecord, matcher)
        }
      }
      else {
        originalMatcher = originalMatcher || matcher
        if (originalMatcher !== matcher)
          originalMatcher.alias.push(matcher)
        if (isRootAdd && record.name && !isAliasRecord(matcher))
          removeRoute(record.name)
      }
      if ('children' in mainNormalizedRecord) {
        let children = mainNormalizedRecord.children
        for (let i = 0; i < children.length; i++) {
          addRoute(children[i], matcher, originalRecord && originalRecord.children[i])
        }
      }
      originalRecord = originalRecord || matcher
      insertMatcher(matcher)
    }
    return originalMatcher
      ? () => {
        removeRoute(originalMatcher)
      }
      : noop
  }
  
  function insertMatcher(matcher) {
    let i = 0
    while (i < matchers.length &&
    comparePathParserScore(matcher, matchers[i]) >= 0)
      i++
    matchers.splice(i, 0, matcher)
    if (matcher.record.name && !isAliasRecord(matcher))
      matcherMap.set(matcher.record.name, matcher)
  }
 
  // 定义其它一些辅助函数
  
  // 添加初始路径
  routes.forEach(route => addRoute(route))
  return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher }
}
```

createRouterMatcher 函数内部定义了一个 matchers 数组和一些辅助函数，我们先重点关注 addRoute 函数的实现，我们只关注核心流程

在 createRouterMatcher 函数的最后，会遍历 routes 路径数组调用 addRoute 方法添加初始路径。

在 addRoute 函数内部，首先会把 route 对象标准化成一个 record，其实就是给路径对象添加更丰富的属性。

然后再执行createRouteRecordMatcher 函数，传入标准化的 record 对象，我们再来看它的实现：

```ts
function createRouteRecordMatcher(record, parent, options) {
  const parser = tokensToParser(tokenizePath(record.path), options)
  {
    const existingKeys = new Set()
    for (const key of parser.keys) {
      if (existingKeys.has(key.name))
        warn(`Found duplicated params with name "${key.name}" for path "${record.path}". Only the last one will be available on "$route.params".`)
      existingKeys.add(key.name)
    }
  }
  const matcher = assign(parser, {
    record,
    parent,
    children: [],
    alias: []
  })
  if (parent) {
    if (!matcher.record.aliasOf === !parent.record.aliasOf)
      parent.children.push(matcher)
  }
  return matcher
}
```

resolve 函数主要做的事情就是根据 location 的 name 或者 path 从我们前面创建的 matchers 数组中找到对应的 matcher，然后再顺着 matcher 的 parent 一直找到链路上所有匹配的 matcher，然后获取其中的 record 属性构造成一个 matched 数组，最终返回包含 matched 属性的新的路径对象。

这么做的目的就是让 matched 数组完整记录 record 路径，它的顺序和嵌套的 RouterView 组件顺序一致，也就是 matched 数组中的第 n 个元素就代表着 RouterView 嵌套的第 n 层。

因此 targetLocation 和 to 相比，其实就是多了一个 matched 对象，这样再回到我们的 RouterView 组件，就可以从injectedRoute.matched[depth] [props.name]中拿到对应的组件对象定义，去渲染对应的组件了。

至此，我们就搞清楚路径和路由组件的渲染是如何映射的了。

前面的分析过程中，我们提到过在路径切换过程中，会执行 navigate 方法，它包含了一系列的导航守卫钩子函数的执行，接下来我们就来分析这部分的实现原理。

## 导航守卫

```ts
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' }) else {
    next()
  }
})
```

这里大致含义就是进入路由前检查用户是否登录，如果没有则跳转到登录的视图组件，否则继续。

router.beforeEach 传入的参数是一个函数，我们把这类函数就称为导航守卫。

```ts
function navigate(to, from) {
  let guards
  const [leavingRecords, updatingRecords, enteringRecords,] = extractChangingRecords(to, from)
  guards = extractComponentsGuards(leavingRecords.reverse(), 'beforeRouteLeave', to, from)
  for (const record of leavingRecords) {
    for (const guard of record.leaveGuards) {
      guards.push(guardToPromiseFn(guard, to, from))
    }
  }
  const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from)
  guards.push(canceledNavigationCheck)
  return (runGuardQueue(guards)
    .then(() => {
      guards = []
      for (const guard of beforeGuards.list()) {
        guards.push(guardToPromiseFn(guard, to, from))
      }
      guards.push(canceledNavigationCheck)
      return runGuardQueue(guards)
    })
    .then(() => {
      guards = extractComponentsGuards(updatingRecords, 'beforeRouteUpdate', to, from)
      for (const record of updatingRecords) {
        for (const guard of record.updateGuards) {
          guards.push(guardToPromiseFn(guard, to, from))
        }
      }
      guards.push(canceledNavigationCheck)
      return runGuardQueue(guards)
    })
    .then(() => {
      guards = []
      for (const record of to.matched) {
        if (record.beforeEnter && from.matched.indexOf(record) < 0) {
          if (Array.isArray(record.beforeEnter)) {
            for (const beforeEnter of record.beforeEnter)
              guards.push(guardToPromiseFn(beforeEnter, to, from))
          }
          else {
            guards.push(guardToPromiseFn(record.beforeEnter, to, from))
          }
        }
      }
      guards.push(canceledNavigationCheck)
      return runGuardQueue(guards)
    })
    .then(() => {
      to.matched.forEach(record => (record.enterCallbacks = {}))
      guards = extractComponentsGuards(enteringRecords, 'beforeRouteEnter', to, from)
      guards.push(canceledNavigationCheck)
      return runGuardQueue(guards)
    })
    .then(() => {
      guards = []
      for (const guard of beforeResolveGuards.list()) {
        guards.push(guardToPromiseFn(guard, to, from))
      }
      guards.push(canceledNavigationCheck)
      return runGuardQueue(guards)
    })
    .catch(err => isNavigationFailure(err, 8 /* NAVIGATION_CANCELLED */)
      ? err
      : Promise.reject(err)))
}
```

可以看到 navigate 执行导航守卫的方式是先构造 guards 数组，数组中每个元素都是一个返回 Promise 对象的函数。

然后通过 runGuardQueue 去执行这些 guards:

```ts
function runGuardQueue(guards) {
  return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve())
}
```

其实就是通过数组的 reduce 方法，链式执行 guard 函数，每个 guard 函数都会返回一个 Promise对象。

但是从我们的例子看，我们添加的是一个普通函数，并不是一个返回 Promise对象的函数，那是怎么做的呢？

原来在把 guard 添加到 guards 数组前，都会执行 guardToPromiseFn 函数把普通函数 Promise化:

```ts
import { warn as warn$1 } from "vue/dist/vue"
function guardToPromiseFn(guard, to, from, record, name) {
  const enterCallbackArray = record &&
    (record.enterCallbacks[name] = record.enterCallbacks[name] || [])
  return () => new Promise((resolve, reject) => {
    const next = (valid) => {
      if (valid === false)
        reject(createRouterError(4 /* NAVIGATION_ABORTED */, {
          from,
          to,
        }))
      else if (valid instanceof Error) {
        reject(valid)
      }
      else if (isRouteLocation(valid)) {
        reject(createRouterError(2 /* NAVIGATION_GUARD_REDIRECT */, {
          from: to,
          to: valid
        }))
      }
      else {
        if (enterCallbackArray &&
          record.enterCallbacks[name] === enterCallbackArray &&
          typeof valid === 'function')
          enterCallbackArray.push(valid)
        resolve()
      }
    }
    const guardReturn = guard.call(record && record.instances[name], to, from, next )
    let guardCall = Promise.resolve(guardReturn)
    if (guard.length < 3)
      guardCall = guardCall.then(next)
    if (guard.length > 2) {
      const message = `The "next" callback was never called inside of ${guard.name ? '"' + guard.name + '"' : ''}:\n${guard.toString()}\n. If you are returning a value instead of calling "next", make sure to remove the "next" parameter from your function.`
      if (typeof guardReturn === 'object' && 'then' in guardReturn) {
        guardCall = guardCall.then(resolvedValue => {
          // @ts-ignore: _called is added at canOnlyBeCalledOnce
          if (!next._called) {
            warn$1(message)
            return Promise.reject(new Error('Invalid navigation guard'))
          }
          return resolvedValue
        })
      }
      else if (guardReturn !== undefined) {
        if (!next._called) {
          warn$1(message)
          reject(new Error('Invalid navigation guard'))
          return
        }
      }
    }
    guardCall.catch(err => reject(err))
  })
}
```

guardToPromiseFn 函数返回一个新的函数，这个函数内部会执行 guard 函数。

这里我们要注意 next 方法的设计，当我们在导航守卫中执行 next 时，实际上就是执行这里定义的 next 函数。

在执行 next 函数时，如果不传参数，那么则直接 resolve，执行下一个导航守卫；如果参数是 false，则创建一个导航取消的错误 reject 出去；如果参数是一个 Error 实例，则直接执行 reject，并把错误传递出去；如果参数是一个路径对象，则创建一个导航重定向的错误传递出去。

有些时候我们写导航守卫不使用 next 函数，而是直接返回 true 或 false，这种情况则先执行如下代码：

```ts
guardCall = Promise.resolve(guardReturn)
```

把导航守卫的返回值 Promise化，然后再执行 guardCall.then(next)，把导航守卫的返回值传给 next 函数。

当然，如果你在导航守卫中定义了第三个参数 next，但是你没有在函数中调用它，这种情况也会报警告。

所以，对于导航守卫而言，经过 Promise化后添加到 guards 数组中，然后再通过 runGuards 以及 Promise 的方式链式调用，最终依次顺序执行这些导航守卫。

