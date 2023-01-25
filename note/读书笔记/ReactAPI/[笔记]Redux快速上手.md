---
title: '[笔记]Redux快速上手'
date: 2018-11-23 14:02:17
category:
    - 笔记
    - React
tags:
    - redux
---

> 还是跟随教程的学习笔记: Redux学习

<!-- more -->

## 相关链接

-   中文文档: https://www.redux.org.cn/
-   Flux 教程(阮一峰):https://www.cnblogs.com/fliu/articles/5245923.html
-   Redux 入门教程: http://www.ruanyifeng.com/blog/2016/09/redux_tutorial_part_one_basic_usages.html
-   视频教程: https://egghead.io/courses/getting-started-with-redux

## 基本用法

### 设计思想

1. Web 应用是一个状态机, 视图与状态是一一对应的.
2. 所有的状态保存在一个对象里面

### 基本概念和 API

#### 创建`Store`: `createStore()`

```js
import { createStore } from 'redux';
const store = createStore(reducer);
```

该方法可以接受第二个参数作为 State 的初始状态:

```
let store = createStore(todoApp, window.STATE_FROM_SERVER)
```

这个参数会覆盖`Reducer`函数的默认初始值

#### 获取状态:　`store.getState()`

```js
const state = store.getState();
```

#### 发送状态: `store.dispatch(action)`

```js
store.dispatch({
    type: 'ADD_TODO', //Action的名称
    payload: 'Learn Redux' //传送的信息
});
```

#### 处理状态`Reducer`:

```js
const reducer = function(state, action) {
    // ...
    return new_state;
};
```

#### 连续处理状态: `Reduce`:

```js
const actions = [{ type: 'ADD', payload: 0 }, { type: 'ADD', payload: 1 }, { type: 'ADD', payload: 2 }];

const total = actions.reduce(reducer, 0); // 3
```

#### 监听`store`的变化: `store.subscribe`

```js
store.subscribe(listener);
```

对于 React, 如果把`render`方法或者`setState`放入`listenser`就可以实现自动监听. `store.subscribe`返回一个函数, 调用该函数尅解除监听.

### 拆分 Reducer

一个大的 Reducer 可以拆分成三个小的 reducer, 拆分方式如下:

```js
const chatReducer = (state = defaultState, action = {}) => {
    return {
        chatLog: chatLog(state.chatLog, action),
        statusMessage: statusMessage(state.statusMessage, action),
        userName: userName(state.userName, action)
    };
};

// 或者
const chatReducer = combineReducers({
    chatLog,
    statusMessage,
    userName
});

//等于:
const reducer = combineReducers({
    a: doSomethingWithA,
    b: processB,
    c: c
});
//等于:
function reducer(state = {}, action) {
    return {
        a: doSomethingWithA(state.a, action),
        b: processB(state.b, action),
        c: c(state.c, action)
    };
}
```

所有的 reducer 组织成一个文件:

```js
import { combineReducers } from 'redux';
import * as reducers from './reducers';

const reducer = combineReducers(reducers);
```

## 中间件与异步

### 中间件

`createStore`现在可以接受第三个参数了:

```js
const store = createStore(
  reducer,
  initial_state,
  applyMiddleware(middleware1[,middleware2,...,middlewareN])
);
```

`applyMiddlewares`是 Redux 提供的原生方法, 作用是吧所有中间件组成一个数组, 依次执行.

中间件有执行顺序, 这点注意一下.

### 异步操作的思路

同步操作只要发出一种`Action`, 但是异步操作需要`Action`:

```md
-   操作发起时的 Action
-   操作成功时的 Action
-   操作失败时的 Action
```

这三个 Action 有两种写法:

```js
// 写法一：名称相同，参数不同
{ type: 'FETCH_POSTS' }
{ type: 'FETCH_POSTS', status: 'error', error: 'Oops' }
{ type: 'FETCH_POSTS', status: 'success', response: { ... } }

// 写法二：名称不同
{ type: 'FETCH_POSTS_REQUEST' }
{ type: 'FETCH_POSTS_FAILURE', error: 'Oops' }
{ type: 'FETCH_POSTS_SUCCESS', response: { ... } }
```

State 应该修改为:

```js
let state = {
    // ...
    isFetching: true, //是否在抓取数据
    didInvalidate: true, //数据是否过时
    lastUpdated: 'xxxxxxx' //上次更新时间
};
```

流程如下:

-   操作开始, 送出 Action, 触发 State"正在操作", View 重新渲染
-   操作结束, 再送出 Action, 触发 State"操作结束", View 再重新渲染

### redux-thunk

异步 Action 至少需要发出两个 Action, 触发第一个 Action 自然没问题, 如何让系统自动在操作结束的时候触发第二个 Action? 看下面这个例子:

```js
class AsyncApp extends Component {
  componentDidMount() {
    const { dispatch, selectedPost } = this.props
    dispatch(fetchPosts(selectedPost))
  }

// ...
```

这里的`fetchPosts`就是`Action Creator`:

```js
const fetchPosts = postTitle => (dispatch, getState) => {
  dispatch(requestPosts(postTitle));
  return fetch(`/some/API/${postTitle}.json`)
    .then(response => response.json())
    .then(json => dispatch(receivePosts(postTitle, json)));
  };
};

// 使用方法一
store.dispatch(fetchPosts('reactjs'));
// 使用方法二
store.dispatch(fetchPosts('reactjs')).then(() =>
  console.log(store.getState())
);
```

这里的`fectch`返回一个函数, 这个函数执行后, 先发出一个 Action(`dispatch(requestPosts(postTitle));`), 然后进行一步操作. 拿到结果后转成 JSON, 然后再发出一个 Action(`receivePosts(postTitle, json)`). 这里有几个要点:

1. `fetchPosts`返回了一个函数, 二普通的`Action Creator`默认返回一个对象.
2. 返回的函数参数是`dispatch`和`getState`这两个`Redux`方法, 普通的`Action Creator`的参数是 Action 的内容,
3. 返回的函数中, 先发出一个 Action, 表示操作开始
4. 一步操作结束后, 再发出一个 Action, 表示操作结束.

这样自动发送第二个 Action 的问题就解决了. 但是 Action 是有`store.dispatch`方法发送的, 而一般情况下, 它的参数只能是对象, 不能使函数. 这时我们就要使用中间件`redux-thunk`:

```js
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from './reducers';

// Note: this API requires redux@>=3.1.0
const store = createStore(reducer, applyMiddleware(thunk));
```

该中间件改造了`store.dispatch`, 使得后者可以接收函数作为参数.

### redux-promise

`Action Creator`既然可以返回函数, 当然也能返回一个`Promise`对象.

```js
import { createStore, applyMiddleware } from 'redux';
import promiseMiddleware from 'redux-promise';
import reducer from './reducers';

const store = createStore(reducer, applyMiddleware(promiseMiddleware));
```

这个中间件可以使得`store.dispatch`接受`Promise`对象作为参数, 此时我们的`Action Creator`有两种写法. 第一, 返回一个 Promise 对象:

```js
const fetchPosts =
  (dispatch, postTitle) => new Promise(function (resolve, reject) {
     dispatch(requestPosts(postTitle));
     return fetch(`/some/API/${postTitle}.json`)
       .then(response => {
         type: 'FETCH_POSTS',
         payload: response.json()
       });
});
```

写法二, Action 对象的`payload`属性是一个 Promis 对象,这需要从 redux-actions 模块引入 createAction 方法, 并且要这样写:

```js
import { createAction } from 'redux-actions';

class AsyncApp extends Component {
    componentDidMount() {
        const { dispatch, selectedPost } = this.props;
        // 发出同步 Action
        dispatch(requestPosts(selectedPost));
        // 发出异步 Action
        dispatch(createAction('FETCH_POSTS', fetch(`/some/API/${postTitle}.json`).then(response => response.json())));
    }
}
```

这样发出的 Action, 只能等到操作结束, 才会是激发出. 注意, `createAction`的第二个参数必须是一个 Promise 对象.

## React-Redux

### 两类组件

按照 react-redux 把所有组件分成两大类: UI 组件和容器组件.

UI 组件:

-   只负责 UI 的呈现, 不带有任何业务逻辑
-   没有状态(不使用 this.state 这个变量)(在我看来未必, 适当的还是可以用的, 因为 state 是封闭在组件内部的, 不会影响外部的数据, 例如菜单的开闭这种)
-   所有数据都由参数(this.props)提供
-   不使用任何 Redux 的 API

容器组件:

-   负责管理数据和业务逻辑, 不负责 UI
-   带有状态
-   使用 Redux

### connect()

`React-Redux`提供了`connect`方法用于从 UI 组件生成容器组件. `connect`的意思就是将这两种组件连起来:

```js
import { connect } from 'react-redux';
const VisibleTodoList = connect()(TodoList);
```

`TodoList`是 UI 组件, `VisibleTodoList`就是由`connect`方法自动生成的容器组件.

但是因为没有定义业务逻辑, 这个容器组件没有意义, 只是 UI 组件的一个包装层, 定义业务逻辑需要给出下面两个方面的信息:

1. 输入逻辑: 外部的逻辑(即 state 对象)如何转换为 UI 组件的参数
2. 输出逻辑: 用户发出的动作如何变为`Action`对象, 从 UI 组件传出去.

完整的方法 API 如下:

```js
import { connect } from 'react-redux';

const VisibleTodoList = connect(
    mapStateToProps, //负责输入逻辑, 将state映射到UI组件的参数(props)
    mapDispatchToProps //负责输出逻辑, 即将用户对UI组件的操作映射成Action
)(TodoList);
```

#### mapStateToProps()

`mapStateToProps`是一个函数, 建立一个从(外部的)state 对象到(UI 组件)`props`对象的映射关系.

`mapStateToProps`执行后应该返回一个对象, 里面的每一个键值对就是一个映射:

```js
const mapStateToProps = state => {
    return {
        todos: getVisibleTodos(state.todos, state.visibilityFilter)
    };
};
```

`mapStateToProps`接受`state`作为参数, 返回一个对象, 这个对象. 这个对象有一个`todos`属性, 代表 UI 组件的同名参数, 后面的`getVisibleTodos`也是一个函数, 可以从`state`算出`todos`的值.

```js
const getVisibleTodos = (todos, filter) => {
    switch (filter) {
        case 'SHOW_ALL':
            return todos;
        case 'SHOW_COMPLETED':
            return todos.filter(t => t.completed);
        case 'SHOW_ACTIVE':
            return todos.filter(t => !t.completed);
        default:
            throw new Error('Unknown filter: ' + filter);
    }
};
```

`mapStateToProps`会订阅 Store, 每当`state`更新, 就会自动执行, 重新计算 UI 组件的参数, 从而触发 UI 组件的重新渲染.

`mapStateToProps`的第一个参数总是`state`对象，还可以使用第二个参数，代表容器组件的`props`对象。

connect 方法可以省略这个参数, 那样 UI 组件就不会因为 Store 的更新而更新.

#### mapDispatchToProps()

`mapDispatchToProps`用来简历 UI 组件到`store.dispatch`的映射, 定义了哪些用户的操作应当作 Action.

`mapDispatchToProps`可以是一个函数或者一个对象.

如果`mapDispatchToProps`是一个函数, 会得到`dispatch`和`ownProps`(容器组件的 props 对象)两个参数.

```js
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onClick: () => {
            dispatch({
                type: 'SET_VISIBILITY_FILTER',
                filter: ownProps.filter
            });
        }
    };
};
```

`mapDispatchToProps`应当返回一个对象, 该对象的每一个键值对都是一个映射, 定义了 UI 组件的参数怎样发出 Action.

如果`mapDispatchToProps`是一个对象, 它的每个键名也是对应 UI 组件的同名参数, 键值应该是一个函数, 会被当做 Action creator, 返回的 Action 会由 Redux 自动发出.

```js

const mapDispatchToProps = {
  onClick: (filter) => {
    type: 'SET_VISIBILITY_FILTER',
    filter: filter
  };
}
```

### <Provider>

生成容器组件以后, 需要让容器组件拿到 state, 才能生成 UI 组件的参数.

react-redux 提供了 provider 组件, 可以让容器组件拿到`state`:

```js
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import todoApp from './reducers';
import App from './components/App';

let store = createStore(todoApp);

render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);
```

Provider 在根组件外面包了一层, 这样 App 的所有子组件就默认都可以拿到`state`了.

### 实例

1. 定义 UI 组件:

```js
class Counter extends Component {
    render() {
        const { value, onIncreaseClick } = this.props;
        return (
            <div>
                <span>{value}</span>
                <button onClick={onIncreaseClick}>Increase</button>
            </div>
        );
    }
}
```

2. 定义映射

```js
function mapStateToProps(state) {
    return {
        value: state.count
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onIncreaseClick: () => dispatch(increaseAction)
    };
}

// Action Creator
const increaseAction = { type: 'increase' };
```

3. 生成容器:

```js
const App = connect(
    mapStateToProps,
    mapDispatchToProps
)(Counter);
```

4. 定义 Reducer

```js
// Reducer
function counter(state = { count: 0 }, action) {
    const count = state.count;
    switch (action.type) {
        case 'increase':
            return { count: count + 1 };
        default:
            return state;
    }
}
```

5. 生成`store`对象, 并使用`Provider`包裹:

```js
import { loadState, saveState } from './localStorage';

const persistedState = loadState();
const store = createStore(todoApp, persistedState);

store.subscribe(
    throttle(() => {
        saveState({
            todos: store.getState().todos
        });
    }, 1000)
);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);
```
