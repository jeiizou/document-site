---
title: 'React查漏补缺 CH03'
date: 2019-03-18 20:16:30
category:
    - 笔记
    - React
tags:
    - react
---

> react 相关 API 的查漏补缺 第三部分

<!-- more -->

## (续)高级指引

### 传递 Refs

Forwarding Refs 是一种在组件内部将 ref 传递给它的后代组件的技术, 这种技术在高阶组件中非常有用.

我们从一个打印 props 变化的 HOC(高阶组件)开始:

```js
function logProps(WrappedComponent) {
    class LogProps extends React.Component {
        componentDidUpdate(prevProps) {
            console.log('old props:', prevProps);
            console.log('new props:', this.props);
        }

        render() {
            return <WrappedComponent {...this.props} />;
        }
    }

    return LogProps;
}
```

我们可以使用这个 HOC 包装组件来打印出被包装组件的所有的 props 变化. 现在我们假设有一个`FancyButton`, 被我们的 LogProps 组件包装着:

```js
class FancyButton extends React.Component {
    focus() {
        // ...
    }

    // ...
}

// Rather than exporting FancyButton, we export LogProps.
// It will render a FancyButton though.
export default logProps(FancyButton);
```

但是这样的话就有一个问题, ref 不会再高阶组件中被传递到子代中, 我们这样使用这个组件:

```js
import FancyButton from './FancyButton';

const ref = React.createRef();

// FancyButton实际上是被HOC包裹的组件
// 尽管他们的渲染输出是一样的
// 但是我们的ref会指向LogProps而不是内部的FancyButton组件
// 这意味着我们不能使用 例如 ref.current.focus()
<FancyButton label="Click Me" handleClick={handleClick} ref={ref} />;
```

处理这样的情况, 我们需要对 ref 进行传递:

```js
function logProps(Component) {
    class LogProps extends React.Component {
        componentDidUpdate(prevProps) {
            console.log('old props:', prevProps);
            console.log('new props:', this.props);
        }

        render() {
            const { forwardedRef, ...rest } = this.props;

            // 将自定义的props "forwardedRef" 作为一个ref
            return <Component ref={forwardedRef} {...rest} />;
        }
    }

    // Note the second param "ref" provided by React.forwardRef.
    // We can pass it along to LogProps as a regular prop, e.g. "forwardedRef"
    // And it can then be attached to the Component.
    function forwardRef(props, ref) {
        return <LogProps {...props} forwardedRef={ref} />;
    }

    //大意: 这两行不是必须的, 但是对调试更加友好
    // These next lines are not necessary,
    // But they do give the component a better display name in DevTools,
    // e.g. "ForwardRef(logProps(MyComponent))"
    const name = Component.displayName || Component.name;
    forwardRef.displayName = `logProps(${name})`;

    return React.forwardRef(forwardRef);
}
```

### Render Props

"render props"是一种在组件之间使用一个值为函数的 prosp 在 React 组件间共享代码的简单技术

带有 render props 的组件返回一个 React 元素, 并调用该函数而不是实现自己的渲染逻辑.

```js
<DataProvider render={(data) => <h1>Hello {data.target}</h1>} />
```

...

### 第三方库的协同

#### DOM 节点操作插件

是的, 我们说的是如何在 React 中使用 Jquery:, 原理实际上就是生成一个 React 不会去更新的元素, 然后交给第三方库去管理:

```js
class SomePlugin extends React.Component {
    componentDidMount() {
        this.$el = $(this.el);
        this.$el.somePlugin();
    }

    componentWillUnmount() {
        this.$el.somePlugin('destroy');
    }

    render() {
        return <div ref={(el) => (this.el = el)} />;
    }
}
```

我们给根节点添加了一个`ref`, 在`componentDidMount`中调用它, 传递给 jquery 插件, 为了防止 React 更新节点, 我们在`render()`中返回了一个空的 div. 同时, 由于很多时候我们会给 dom 添加时间监听器, 所以在组件销毁的时候需要把该监听器销毁以防止内存泄漏.

#### 使用其他引擎加载页面

通常来说, React 在页面加载的时候把一个根组件放到 DOM 中, 但是 render 方法实际上很灵活, 可以被不同的 UI 不见多次调用, 这个部件可以是一个按钮, 也可以是一个应用.

实际上 FaceBook 就是这么用的, 独立的开发每一个部件, 然后把这些部件与服务端创建的模板以及客户端代码结合起来, 形成完整的应用.

#### 在 React 中使用“字符串替换”类的库

例如这段代码:

```js
$('#container').html('<button id="btn">Say Hello</button>');
$('#btn').click(function() {
    alert('Hello!');
});
```

我们用字符串来插入 HTML 代码, 既可以很方便的替换成 React 组件:

```js
function Button() {
    return <button id="btn">Say Hello</button>;
}

ReactDOM.render(<Button />, document.getElementById('container'), function() {
    $('#btn').click(function() {
        alert('Hello!');
    });
});
```

然后我们就可以在组件中使用 React 的思来加入逻辑代码, , 比如添加 Button 的点击事件:

```js
function Button(props) {
    return <button onClick={props.onClick}>Say Hello</button>;
}

function HelloButton() {
    function handleClick() {
        alert('Hello!');
    }
    return <Button onClick={handleClick} />;
}

ReactDOM.render(<HelloButton />, document.getElementById('container'));
```

## Hooks

Hooks 是 React 在 16.7.0-alpha 中加入的新特性, 可以使得开发者在 class 以外的地方使用 state 和其他 React 特性

### 概述

#### State Hook

```js
import { useState } from 'react';

function Example() {
    // 声明一个名为“count”的新状态变量
    const [count, setCount] = useState(0);

    return (
        <div>
            <p>你点击了{count}次</p>
            <button onClick={() => setCount(count + 1)}>点我</button>
        </div>
    );
}
```

这里的 useState 是一个 Hook, 我们在一个函数式组件中调用它, 为这个组件增加一些内部状态, React 会在下一次渲染前保存此状态, useState 返回一对值: 当前的状态以及一个更新状态的函数. 类似于类组件中的`this.setState`, 但是不能将新旧状态进行合并.

`useState`唯一的参数就是初始状态(initial state). 在上面的例子中, 因为我们的计数器从零开始所以他是 0, 这里的状态也不同于`state`, 并不一定要求是一个对象.

我们可以在一个组件中多次使用状态钩子:

```js
function ExampleWithManyStates() {
    // 声明多个状态变量！
    const [age, setAge] = useState(42);
    const [fruit, setFruit] = useState('banana');
    const [todos, setTodos] = useState([{ text: 'Learn Hooks' }]);
    // ...
}
```

我们使用数组结构的语法来使用不同的名称以作区分.

> 实际上, 钩子是可以让我们与 React 状态以及函数式组件的生命周期特性挂钩的函数, 钩子是为了让我们抛弃类使用 React 的, 所以它并不能在类中运行. React 内置了少量的钩子, 我们也可以创建自己的钩子在不同的组件之间复用有状态的行为

#### Effect Hook

"副作用(side effects)"是一个来自于函数式编程的概念, 指的是影响内部组件状态的干扰. 副作用钩子`useEffect`为函数式组件带来执行副作用的能力(React 中的函数式组件是相对于类组件来说的, 不要理解为纯函数, 纯函数式组件另有所指:pureComponent), 类似于类组件中的生命周期:`componentDidMount` ，`componentDidUpdate`和 `componentWillUnmount`.

```js
import { useState, useEffect } from 'react';

function Example() {
    const [count, setCount] = useState(0);

    // 类似于 componentDidMount 和 componentDidUpdate:
    useEffect(() => {
        // 使用浏览器API更新文档标题
        document.title = `You clicked ${count} times`;
    });

    return (
        <div>
            <p>You clicked {count} times</p>
            <button onClick={() => setCount(count + 1)}>Click me</button>
        </div>
    );
}
```

当我们调用`useEffect`, 就是告诉 React 在刷新 DOM 以后运行你的副作用函数, 副作用函数在组件中声明, 所以可以使用组件的状态(state)和属性(props). React 默认在每一次渲染后运行副作用函数(包括第一次渲染).

此外. 副作用函数可以通过返回一个函数来指定如何回收他们:

```js
import { useState, useEffect } from 'react';

function FriendStatus(props) {
    const [isOnline, setIsOnline] = useState(null);

    function handleStatusChange(status) {
        setIsOnline(status.isOnline);
    }

    useEffect(() => {
        ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);

        return () => {
            ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
        };
    });

    if (isOnline === null) {
        return 'Loading...';
    }
    return isOnline ? 'Online' : 'Offline';
}
```

组件被卸载的时候,　 React 会取消订阅. 同样可以使用多个副作用 Hook. 基于 Hook, 我们可以在代码中按照代码块的相关性组织副作用, 而不是基于生命周期方法强制进行切分.

#### 钩子的使用规则

Hooks 有两条规则需要额外遵循:

-   只能在**顶层**调用钩子, 不要在循环, 控制流和嵌套的函数中调用钩子
-   只能从 React 的函数式组件中调用钩子, 不要在常规的 js 函数中调用钩子

#### 自定义钩子

组件之间的逻辑复用, 原来的解决方案有两种: 高阶组件 & 渲染属性. 现在多了一种: 自定义 Hook

在前面的例子中, 我们在前面有一个`FriendStatus`组件, 把其中订阅朋友的在线状态抽取到一个自定义钩子中:

```js
import { useState, useEffect } from 'react';

function useFriendStatus(friendID) {
    const [isOnline, setIsOnline] = useState(null);

    function handleStatusChange(status) {
        setIsOnline(status.isOnline);
    }

    useEffect(() => {
        ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
        return () => {
            ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
        };
    });

    return isOnline;
}
```

这个钩子需要一个`friendID`作为参数, 返回朋友的在线状态.

现在我们就可以同时在两个组件中使用它:

```js
//组件一
function FriendStatus(props) {
    const isOnline = useFriendStatus(props.friend.id);

    if (isOnline === null) {
        return 'Loading...';
    }
    return isOnline ? 'Online' : 'Offline';
}

//组件二
function FriendListItem(props) {
    const isOnline = useFriendStatus(props.friend.id);

    return <li style={{ color: isOnline ? 'green' : 'black' }}>{props.friend.name}</li>;
}
```

两个组件中的状态是完全独立的, 钩子支付用状态逻辑而不是状态本身, 实际上每一次调用钩子都会得到一个鼓励的状态, 所以在同一个组件中调用两次相同的自定义钩子也是可以的.

自定义钩子的命名更多的是约定俗成的, 假如一个函数的名字以`use`开头, 并且调用了其他的钩子, 我们就称为自定义钩子.

自顶钩子可以做非常多的用例, 例如表单处理, 动画, 声明式订阅, 定时器等等. 社区有很多的自定义钩子.

#### 其他钩子

`useContext`: 可以订阅 React context 而不用引入嵌套.

```js
function Example() {
    const locale = useContext(LocaleContext);
    const theme = useContext(ThemeContext);
    // ...
}
```

`useReducer`: 允许使用一个 reducer 来管理一个复杂组件的局部状态:

```js
function Todos() {
  const [todos, dispatch] = useReducer(todosReducer);
  // ...
```

对于 Hooks 的更详细的叙述我准备另外记录了. 这边到这里就可以了
