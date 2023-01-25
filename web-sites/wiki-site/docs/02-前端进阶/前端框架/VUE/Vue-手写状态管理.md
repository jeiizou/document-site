# Vue-手写状态管理

```js
import { reactive, provide, inject } from 'vue';

export default {
    // 状态容器
    store: {
        state: {}, // 全局状态
        init: () => {}, // 初始化全局状态
        reg: {}, // 注册局部状态
        get: {}, // 获取局部状态
    },

    // 用symbol 做个标识, 避免重名
    storeFlag: Symbol('vue-data-state'),

    // 创建安装插件的实例
    createStore(
        info = {
            // 全局状态, 接受一组对象
            global: {},
            // 局部状态, 接受一组函数
            local: {},
            // 初始化参数
            init(state) {},
        },
    ) {
        for (const key in info.global) {
            if (Object.hasOwnProperty.call(info.global, key)) {
                // 把全局的状态存入state
                this.store.state[key] = reactive(info.global[key]);
            }
        }

        for (const key in info.local) {
            if (Object.hasOwnProperty.call(info.local, key)) {
                const localKey = Symbol(key);
                // 加上注册函数
                this.store.reg[key] = () => {
                    // 把局部状态编程响应式
                    const state = reactive(info.local[key]());
                    // 注入
                    provide(localKey, state);
                    // 返回状态
                    return state;
                };
                this.store.get[key] = () => {
                    // 把局部状态变为响应式
                    const state = inject(localKey);
                    // 返回状态
                    return state;
                };
            }
        }

        // 加上初始化函数
        if (typeof info.init === 'function') {
            this.store.init = info.init;
        }

        const _store = this.store;
        const _storeFlag = this.storeFlag;
        return {
            install(app, options) {
                // 注入状态
                app.provide(_storeFlag, _store);
                // 设置模板使用状态
                app.config.globalProperties.$state = _store.state;
                // 调用初始化, 给全局状态赋值
                _store.init(_store.state);
            },
        };
    },

    // 代码中调用
    useStore() {
        // 获取全局状态
        const { state, reg, get } = inject(this.storeFlag);

        return {
            state, // 返回全局状态
            reg, // 注册局部状态的函数, 并且返回对应的局部状态
            get, // 子组件中用于获取状态
        };
    },
};
```

## 参考链接

- [嗨，带你做个轻量级的状态管理](https://mp.weixin.qq.com/s/eyGr2NC14j02tg6n64BKdw)