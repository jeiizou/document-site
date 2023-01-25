---
title: 'React查漏补缺 CH01'
date: 2019-03-10 19:44:52
category:
    - 笔记
    - React
tags:
    - react
---

> react 相关 API 的查漏补缺 第一部分

<!-- more -->

## 主要概念

### 生命周期

生命周期示意图:

![](/img/react/LifecycleStates.png)

### 事件处理

在 React 中的, 事件处理有两个要注意的地方, 一个是 this 的绑定, 另一个是参数的传递.

#### this

实际上,react 中 this 的行为与 js 中的 this 行为是一致的, react 并你没有添加额外的处理逻辑, 而是把逻辑交给开发者来处理, 一般事件处理, 我会比较频繁的使用箭头函数来处理 this 的绑定行为:

```js
class LoggingButton extends React.Component {
    // This syntax ensures `this` is bound within handleClick.
    // Warning: this is *experimental* syntax.
    handleClick = () => {
        console.log('this is:', this);
    };

    render() {
        return <button onClick={this.handleClick}>Click me</button>;
    }
}
```

或者是这种直接写在 jsx 中的箭头函数:

```js
class LoggingButton extends React.Component {
    handleClick() {
        console.log('this is:', this);
    }

    render() {
        // This syntax ensures `this` is bound within handleClick
        return <button onClick={(e) => this.handleClick(e)}>Click me</button>;
    }
}
```

这两段代码来自官方文档, 其中第二段代码会有隐含的性能问题(当这个属性作为 props 传入子组件的时候, 可能会进行额外的重新渲染)

#### 参数传递

这里有两种传递参数的方式:

```jsx
<button onClick={(e) => this.deleteRow(id, e)}>Delete Row</button>
<button onClick={this.deleteRow.bind(this, id)}>Delete Row</button>
```

这两种方式是等价的, 前者通过`arrow functions`来传递参数, 后者则通过`Function.prototype.bind`来传递参数. 第二种方式的特点是默认参数是隐式传递的. 与我而言, 第二种方式更习惯一些

### 状态提升

如果两个组件需要共享状态数据, 那么, 更好的方式是把这两个组件中的数据提升到他们共同的父组件, 通过从上而下的数据流来进行管理, 而不是各自管理各自的 state.

### 组合和继承

React 更推荐使用组合而不是继承来解决不同组件之间的管理

#### 组件包含: children

```js
function FancyBorder(props) {
    return <div className={'FancyBorder FancyBorder-' + props.color}>{props.children}</div>;
}
```

这样就可以来嵌套使用:

```js
function WelcomeDialog() {
    return (
        <FancyBorder color="blue">
            <h1 className="Dialog-title">Welcome</h1>
            <p className="Dialog-message">Thank you for visiting our spacecraft!</p>
        </FancyBorder>
    );
}
```

或者, 你可以自定义入口属性来实现一些特别的情况:

```js
function SplitPane(props) {
    return (
        <div className="SplitPane">
            <div className="SplitPane-left">{props.left}</div>
            <div className="SplitPane-right">{props.right}</div>
        </div>
    );
}

function App() {
    return <SplitPane left={<Contacts />} right={<Chat />} />;
}
```

## 高级指引

### JSX

本质上来讲, JSX 只是 React.createElemnet 的语法糖. 所以如果你使用了 jsx, 那么无论 React 是否显式的被使用,代码都应当处于 React 作用域中:

```js
import React from 'react';
import CustomButton from './CustomButton';

function WarningButton() {
    // return React.createElement(CustomButton, {color: 'red'}, null);
    return <CustomButton color="red" />;
}
```

这两个`import`的库都是必须引用的. 此外, 除非是原生的 html 标签, 否则组件名称应该以大写开头.

### PropTypes 检查类型

`prop-types`这个库是从元的 15.5 以前的 react 中剥离出来的静态类型检查器(在 ts 的项目中是不必要的).

它可以用来进行针对组件 props 的一系列的静态类型检查. 下面是一个官网的例子:

```js
import PropTypes from 'prop-types';

MyComponent.propTypes = {
    // 你可以将属性声明为以下 JS 原生类型
    optionalArray: PropTypes.array,
    optionalBool: PropTypes.bool,
    optionalFunc: PropTypes.func,
    optionalNumber: PropTypes.number,
    optionalObject: PropTypes.object,
    optionalString: PropTypes.string,
    optionalSymbol: PropTypes.symbol,

    // 任何可被渲染的元素（包括数字、字符串、子元素或数组）。
    optionalNode: PropTypes.node,

    // 一个 React 元素
    optionalElement: PropTypes.element,

    // 你也可以声明属性为某个类的实例，这里使用 JS 的
    // instanceof 操作符实现。
    optionalMessage: PropTypes.instanceOf(Message),

    // 你也可以限制你的属性值是某个特定值之一
    optionalEnum: PropTypes.oneOf(['News', 'Photos']),

    // 限制它为列举类型之一的对象
    optionalUnion: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Message)]),

    // 一个指定元素类型的数组
    optionalArrayOf: PropTypes.arrayOf(PropTypes.number),

    // 一个指定类型的对象
    optionalObjectOf: PropTypes.objectOf(PropTypes.number),

    // 一个指定属性及其类型的对象
    optionalObjectWithShape: PropTypes.shape({
        color: PropTypes.string,
        fontSize: PropTypes.number
    }),

    // 你也可以在任何 PropTypes 属性后面加上 `isRequired`
    // 后缀，这样如果这个属性父组件没有提供时，会打印警告信息
    requiredFunc: PropTypes.func.isRequired,

    // 任意类型的数据
    requiredAny: PropTypes.any.isRequired,

    // 你也可以指定一个自定义验证器。它应该在验证失败时返回
    // 一个 Error 对象而不是 `console.warn` 或抛出异常。
    // 不过在 `oneOfType` 中它不起作用。
    customProp: function(props, propName, componentName) {
        if (!/matchme/.test(props[propName])) {
            return new Error(
                'Invalid prop `' + propName + '` supplied to' + ' `' + componentName + '`. Validation failed.'
            );
        }
    },

    // 不过你可以提供一个自定义的 `arrayOf` 或 `objectOf`
    // 验证器，它应该在验证失败时返回一个 Error 对象。 它被用
    // 于验证数组或对象的每个值。验证器前两个参数的第一个是数组
    // 或对象本身，第二个是它们对应的键。
    customArrayProp: PropTypes.arrayOf(function(propValue, key, componentName, location, propFullName) {
        if (!/matchme/.test(propValue[key])) {
            return new Error(
                'Invalid prop `' + propFullName + '` supplied to' + ' `' + componentName + '`. Validation failed.'
            );
        }
    })
};
```

#### 限制单个子代

使用`PropTypes.element`可以指定只传递一个子代

```js
import PropTypes from 'prop-types';

class MyComponent extends React.Component {
    render() {
        // This must be exactly one element or it will warn.
        const children = this.props.children;
        return <div>{children}</div>;
    }
}

MyComponent.propTypes = {
    children: PropTypes.element.isRequired
};
```

#### 默认属性值

使用`defaultProps`为`props`定义默认值

```js
class Greeting extends React.Component {
    render() {
        return <h1>Hello, {this.props.name}</h1>;
    }
}

// 为属性指定默认值:
Greeting.defaultProps = {
    name: 'Stranger'
};

// 渲染 "Hello, Stranger":
ReactDOM.render(<Greeting />, document.getElementById('example'));
```

或者指定静态属性`defaultProps`(需要 Babel):

```js
class Greeting extends React.Component {
    static defaultProps = {
        name: 'stranger'
    };

    render() {
        return <div>Hello, {this.props.name}</div>;
    }
}
```

顺序是: defaultProps->类型检查->this.props

### Refs

Refs 的使用场景有这样的几种:

-   处理焦点, 文本选择或者媒体控制
-   触发强制动画
-   集成第三方 `dom` 库

目前来讲, 创建 refs 的语法如下所示:

```js
class MyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();
    }
    render() {
        return <div ref={this.myRef} />;
    }
}
```

老版的字符串式的 ref 声明会在未来某个版本被移除, 因为其隐含了一些问题.

注意, **函数式的组件是不能使用 ref 属性的**, 因为他们没有实例

`ref`的更新会发生在`componentDidMount`或`componentDidUpdate`生命周期钩子之前

#### 对父组件暴露 DOM 节点

通常不建议从父组件访问子节点的 DOM, 这会破坏组件的封装, 但是偶尔的可以用于触发焦点或测量子 DOM 节点的大小或位置.

向子组件添加 ref 只能获取实例而不是 DOM 节点, 并且在函数式组件上无效.

在 React16.3 以后可以使用`ref转发(Ref forwarding, 下面的节点会介绍到)`, 16.3 以前的 Reacr 可以将 ref 作为特殊名字的 prop 直接传递.

直接暴露 DOM 节点也是一种方法, 但是需要你对子组件中进行增加一些代码, 如果你没有子组件的实现控制权, 剩下的选择只有`findDOMNode()`了.

#### 回调 Refs

除了`createRef`创建`ref`属性, 回到`ref`会传递一个函数, 这个函数接受 React 组件的实例或 HTML DOM 元素作为参数, 以存储他们并使得他们能被其它地方访问

代码会是这样:

```js
class CustomTextInput extends React.Component {
    constructor(props) {
        super(props);

        this.textInput = null;

        this.setTextInputRef = (element) => {
            this.textInput = element;
        };

        this.focusTextInput = () => {
            // 直接使用原生 API 使 text 输入框获得焦点
            if (this.textInput) this.textInput.focus();
        };
    }

    componentDidMount() {
        // 渲染后文本框自动获得焦点
        this.focusTextInput();
    }

    render() {
        // 使用 `ref` 的回调将 text 输入框的 DOM 节点存储到 React
        // 实例上（比如 this.textInput）
        return (
            <div>
                <input type="text" ref={this.setTextInputRef} />
                <input type="button" value="Focus the text input" onClick={this.focusTextInput} />
            </div>
        );
    }
}
```

### 性能优化

这部分我希望以后有一个单独的文章来详细的学习和阐述, 这里大致列下内容

1. 打包和压缩
2. 虚拟化长列表
3. 避免协调
4. shouldComponentUpdate
5. 避免突变的属性或状态
6. 使用不可突变的数据结构

### 协调

> 在 React 中, 使用了`diffing`算法来预测组件的更新.

#### 差分算法

在 React 中, 首先会比较两个根元素, 然后根据根元素的类型不同, 有不同的行为

##### 不同类型的元素

每当根元素有不同类型, React 会拆除旧树并且从零开始重新构建. 所有组件都被卸载, 状态被销毁

##### 同类型的 DOM 元素

React 会观察两者的属性(attribute), 保持相同的底层 DOM 节点. 仅仅更新变化的属性.

##### 同类型的组件元素

组件更新的时候, 实例保持相同, 通过 props 来匹配新元素, 并在底层实例上调用`componentsWiddReceiveProps`和`componentWillUpdate()`;

然后调用`render()`, 递归处理前一次的结果和新的结果

##### 子代上面的队规

默认当递归 DOM 节点的子节点是, React 就是迭代在同一时间点的两个子节点列表, 并在不同时产生一个变更, 为了不在每一次修改子节点的时候都重新生成节点, React 引入了`key`属性是的数组节点变得更高效:

```html
<ul>
    <li key="2015">Duke</li>
    <li key="2016">Villanova</li>
</ul>

<ul>
    <li key="2014">Connecticut</li>
    <li key="2015">Duke</li>
    <li key="2016">Villanova</li>
</ul>
```

现在React就知道带有`2014`的可以的元素是新的, 而`2015`和`2016`的元素仅需要移动.

key只需要在兄弟中保持唯一即可.

#### 权衡

协调算法是一个实现细节, React可以再每次操作时重新渲染整个应用, 最终结果仍是相同的. 

目前来说,React依赖于启发式算法, 若其背后的假设没得到满足, 将不利于性能:

1. 算法无法尝试匹配不同组件类型的子树
2. Keys应当稳定, 可预测, 唯一. (稳定是指不是由random之类的数据生成, 以免造成不必要的重建)

