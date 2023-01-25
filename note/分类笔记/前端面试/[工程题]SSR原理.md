# ssr

服务端渲染, Server-Side Rendering.

指由服务侧完成页面的HTML结构凭拼接的页面处理技术, 发送到浏览器, 然后为其绑定状态和事件, 成为完全可交互页面的过程.

SSR解决方案, 首先有后端渲染出完整的首屏的dom结构返回, 前端拿到的内容包括首屏以及完整的spa结构, 应用激活后依然按照spa的方式去运行

![alt](https://camo.githubusercontent.com/6b8be8606f5781d1876b0e47e544b779207538ac0778c12d70628c44710f193a/68747470733a2f2f70392d6a75656a696e2e62797465696d672e636f6d2f746f732d636e2d692d6b3375316662706663702f66313630346537636661643734333166393939323065386162383333626333377e74706c762d6b3375316662706663702d77617465726d61726b2e696d616765)

> vue 是构建客户端应用程序的框架. 默认情况下, 可以在浏览器中输出Vue, 进行生成DOM操作和操作DOM. 然后也可以将同一个组件渲染为服务端的HTML字符串, 将他们直接发送到浏览器, 最后将这些静态标记为"激活"为客户端上可以完全交互的应用程序
> 
> 服务端渲染的vue应用程序也可以被认为是"同构"或者"通用", 因为应用程序的大部分代码都可以在服务器和客户端上运行

这里有几个结论:

- vue ssr是一个在spa上进行改良的服务端渲染
- 通过vue ssr渲染的页面, 需要在客户端激活之后才能实现交互
- vue ssr将包含两部分: 服务端渲染的首屏, 包含交互的spa

## 解决的问题

- seo: 搜索引擎优先爬取页面的HTML结果, 使用SSR的时候, 服务端已经生成了和业务关联的HTML, 有利于SEO
- 首屏呈现渲染: 用户不需要等待js加载完成就能看到页面视图(压力到了服务器端)

缺点:

- 复杂度: 整个项目会变得更加复杂
- 需要考虑库的支持, 代码的兼容问题
- 性能问题:
  - 每个请求都是n个实例的创建, 不然会污染, 资源消耗会增大
  - 需要缓存`node serve`, `nginx`判断当前用户是否过期, 如果没有过期的话就缓存, 用刚刚的结果
  - 需要降级: 监控`cpu`, 内存. 当占用过多的时候, 降级为`spa`, 返回单个的壳.

所以我们选择是否使用SSR, 我们要问问这几个问题:

1. 需要SEO的页面是否只有少数几个, 这些是否可以使用预渲染实现
2. 首屏的请求逻辑是否负责, 数据返回是否大量并且缓慢

## 实现原理

对于同构应用, 我们依然是使用`webpack`进行打包的. 我们需要解决的问题有两个: 服务端的首屏渲染以及客户端激活

这里需要生成一个服务器的`bundle`文件用于服务端首屏渲染和一个客户端`boundle`文件用于客户端的激活.

![alt](https://camo.githubusercontent.com/cd8d3d1127872a11b74d25626c9f054beba6d169a057d4975f551057bb8d15fa/68747470733a2f2f7374617469632e7675652d6a732e636f6d2f39646364313263302d343938362d313165622d383566362d3666616337376330633962332e706e67)

在代码结构上, 会增加两个不同的入口:

```
src
├── router
├────── index.js # 路由声明
├── store
├────── index.js # 全局状态
├── main.js # ⽤于创建vue实例
├── entry-client.js # 客户端⼊⼝，⽤于静态内容“激活”
└── entry-server.js # 服务端⼊⼝，⽤于⾸屏内容渲染
```

路由配置:

```js
import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);
//导出⼯⼚函数

export function createRouter() {
    return new Router({
        mode: 'history',
        routes: [
            // 客户端没有编译器，这⾥要写成渲染函数
            { path: "/", component: { render: h => h('div', 'index page') } },
            { path: "/detail", component: { render: h => h('div', 'detail page') } }
        ]
    });
}
```

主文件`main.js`, 与之前不同, 主文件是负责创建`vue`实例的工厂, 每次请求都会有独立的`vue`实例创建:

```js
import Vue from "vue";
import App from "./App.vue";
import { createRouter } from "./router";
// 导出Vue实例⼯⼚函数，为每次请求创建独⽴实例
// 上下⽂⽤于给vue实例传递参数
export function createApp(context) {
    const router = createRouter();
    const app = new Vue({
        router,
        context,
        render: h => h(App)
    });
    return { app, router };
}
```

然后来看服务端的入口`entry-server.js`:

它的任务是创建Vue实例并根据传入的url指定首屏

```js
import { createApp } from "./main";
// 返回⼀个函数，接收请求上下⽂，返回创建的vue实例
export default context => {
    // 这⾥返回⼀个Promise，确保路由或组件准备就绪
    return new Promise((resolve, reject) => {
        const { app, router } = createApp(context);
        // 跳转到⾸屏的地址
        router.push(context.url);
        // 路由就绪，返回结果
        router.onReady(() => {
            resolve(app);
        }, reject);
    });
};
```

然后来看客户端的入口文件`entry-client.js`

客户端入口只需要创建`vue`实例并挂载并执行挂载, 这一步称为激活:

```js
import { createApp } from "./main";
// 创建vue、router实例
const { app, router } = createApp();
// 路由就绪，执⾏挂载
router.onReady(() => {
    app.$mount("#app");
});
```

然后对`webpack`进行配置. 

安装依赖:

```js
npm install webpack-node-externals lodash.merge -D
```

然后对`vue.config.js`进行配置:

```js
// 两个插件分别负责打包客户端和服务端
const VueSSRServerPlugin = require("vue-server-renderer/server-plugin");
const VueSSRClientPlugin = require("vue-server-renderer/client-plugin");
const nodeExternals = require("webpack-node-externals");
const merge = require("lodash.merge");
// 根据传⼊环境变量决定⼊⼝⽂件和相应配置项
const TARGET_NODE = process.env.WEBPACK_TARGET === "node";
const target = TARGET_NODE ? "server" : "client";
module.exports = {
    css: {
        extract: false
    },
    outputDir: './dist/'+target,
    configureWebpack: () => ({
        // 将 entry 指向应⽤程序的 server / client ⽂件
        entry: `./src/entry-${target}.js`,
        // 对 bundle renderer 提供 source map ⽀持
        devtool: 'source-map',
        // target设置为node使webpack以Node适⽤的⽅式处理动态导⼊，
        // 并且还会在编译Vue组件时告知`vue-loader`输出⾯向服务器代码。
        target: TARGET_NODE ? "node" : "web",
        // 是否模拟node全局变量
        node: TARGET_NODE ? undefined : false,
        output: {
            // 此处使⽤Node⻛格导出模块
            libraryTarget: TARGET_NODE ? "commonjs2" : undefined
        },
        // https://webpack.js.org/configuration/externals/#function
        // https://github.com/liady/webpack-node-externals
        // 外置化应⽤程序依赖模块。可以使服务器构建速度更快，并⽣成较⼩的打包⽂件。
        externals: TARGET_NODE
        ? nodeExternals({
            // 不要外置化webpack需要处理的依赖模块。
            // 可以在这⾥添加更多的⽂件类型。例如，未处理 *.vue 原始⽂件，
            // 还应该将修改`global`（例如polyfill）的依赖模块列⼊⽩名单
            whitelist: [/\.css$/]
        })
        : undefined,
        optimization: {
            splitChunks: undefined
        },
        // 这是将服务器的整个输出构建为单个 JSON ⽂件的插件。
        // 服务端默认⽂件名为 `vue-ssr-server-bundle.json`
        // 客户端默认⽂件名为 `vue-ssr-client-manifest.json`。
        plugins: [TARGET_NODE ? new VueSSRServerPlugin() : new
                  VueSSRClientPlugin()]
    }),
    chainWebpack: config => {
        // cli4项⽬添加
        if (TARGET_NODE) {
            config.optimization.delete('splitChunks')
        }

        config.module
            .rule("vue")
            .use("vue-loader")
            .tap(options => {
            merge(options, {
                optimizeSSR: false
            });
        });
    }
};
```

对脚本进行配置, 安装依赖:

```js
npm i cross-env -D
```

并且创建脚本:

```js
"scripts": {
 "build:client": "vue-cli-service build",
 "build:server": "cross-env WEBPACK_TARGET=node vue-cli-service build",
 "build": "npm run build:server && npm run build:client"
}
```

执行打包: `npm run build`

最后修改宿主文件: `/public/index.html`.

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <!--vue-ssr-outlet-->
    </body>
</html>
```

> 是服务端渲染入口位置, 注意不能为了好看而在前后加空格

安装`vuex`:

```js
npm install -S vuex
```

创建工厂函数:

```js
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
export function createStore () {
    return new Vuex.Store({
        state: {
            count:108
        },
        mutations: {
            add(state){
                state.count += 1;
            }
        }
    })
}
```

在`main.js`文件挂载`store`:

```js
import { createStore } from './store'
export function createApp (context) {
    // 创建实例
    const store = createStore()
    const app = new Vue({
        store, // 挂载
        render: h => h(App)
    })
    return { app, router, store }
}
```

服务端渲染的是应用程序的快烧, 如果应用依赖于一些异步数据, 那么在开始渲染之前, 需要先预取和解析好这些数据, 在`store`中进行数据获取:

```js
export function createStore() {
    return new Vuex.Store({
        mutations: {
            // 加⼀个初始化
            init(state, count) {
                state.count = count;
            },
        },
        actions: {
            // 加⼀个异步请求count的action
            getCount({ commit }) {
                return new Promise(resolve => {
                    setTimeout(() => {
                        commit("init", Math.random() * 100);
                        resolve();
                    }, 1000);
                });
            },
        },
    });
}
```

组件中的数据预取逻辑:

```js
export default {
    asyncData({ store, route }) { // 约定预取逻辑编写在预取钩⼦asyncData中
        // 触发 action 后，返回 Promise 以便确定请求结果
        return store.dispatch("getCount");
    }
};
```

服务端数据预取:

```js
import { createApp } from "./app";
export default context => {
    return new Promise((resolve, reject) => {
        // 拿出store和router实例
        const { app, router, store } = createApp(context);
        router.push(context.url);
        router.onReady(() => {
            // 获取匹配的路由组件数组
            const matchedComponents = router.getMatchedComponents();

            // 若⽆匹配则抛出异常
            if (!matchedComponents.length) {
                return reject({ code: 404 });
            }

            // 对所有匹配的路由组件调⽤可能存在的`asyncData()`
            Promise.all(
                matchedComponents.map(Component => {
                    if (Component.asyncData) {
                        return Component.asyncData({
                            store,
                            route: router.currentRoute,
                        });
                    }
                }),
            )
                .then(() => {
                // 所有预取钩⼦ resolve 后，
                // store 已经填充⼊渲染应⽤所需状态
                // 将状态附加到上下⽂，且 `template` 选项⽤于 renderer 时，
                // 状态将⾃动序列化为 `window.__INITIAL_STATE__`，并注⼊ HTML
                context.state = store.state;

                resolve(app);
            })
                .catch(reject);
        }, reject);
    });
};
```

客户端在瓜子啊到应用程序之前, 就应该获取到状态, `store`:

```js
// 导出store
const { app, router, store } = createApp();
// 当使⽤ template 时，context.state 将作为 window.__INITIAL_STATE__ 状态⾃动嵌⼊到最终的 HTML 
// 在客户端挂载到应⽤程序之前，store 就应该获取到状态：
if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__);
}
```

客户端的数据预取处理:

```js
Vue.mixin({
    beforeMount() {
        const { asyncData } = this.$options;
        if (asyncData) {
            // 将获取数据操作分配给 promise
            // 以便在组件中，我们可以在数据准备就绪后
            // 通过运⾏ `this.dataPromise.then(...)` 来执⾏其他任务
            this.dataPromise = asyncData({
                store: this.$store,
                route: this.$route,
            });
        }
    },
});
```

修改服务器启动文件:

```js
// 获取⽂件路径
const resolve = dir => require('path').resolve(__dirname, dir)
// 第 1 步：开放dist/client⽬录，关闭默认下载index⻚的选项，不然到不了后⾯路由
app.use(express.static(resolve('../dist/client'), {index: false}))
// 第 2 步：获得⼀个createBundleRenderer
const { createBundleRenderer } = require("vue-server-renderer");
// 第 3 步：服务端打包⽂件地址
const bundle = resolve("../dist/server/vue-ssr-server-bundle.json");
// 第 4 步：创建渲染器
const renderer = createBundleRenderer(bundle, {
    runInNewContext: false, // https://ssr.vuejs.org/zh/api/#runinnewcontext
    template: require('fs').readFileSync(resolve("../public/index.html"), "utf8"), // 宿主⽂件
    clientManifest: require(resolve("../dist/client/vue-ssr-clientmanifest.json")) // 客户端清单
});
app.get('*', async (req,res)=>{
    // 设置url和title两个重要参数
    const context = {
        title:'ssr test',
        url:req.url
    }
    const html = await renderer.renderToString(context);
    res.send(html)
})
```

- 使用`ssr`不存在单例模式, 每次请求都会创建一个新的vue实例
- 实现ssr需要实现服务端首屏渲染和客户端激活
- 服务端异步获取数据`asyncData`可以分为首屏异步获取和切换组件获取
  - 首屏异步获取数据, 在服务端预渲染的时候就应该已经完成
  - 切换组件通过`mixin`混入, 在`beforeMount`钩子完成数据获取

