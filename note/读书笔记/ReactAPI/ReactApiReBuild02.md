---
title: 'React查漏补缺 CH02'
date: 2019-03-12 21:09:52
category:
    - 笔记
    - React
tags:
    - react
---

> react 相关 API 的查漏补缺 第二部分

<!-- more -->

## (续)高级指引

### Context

> Context 提供了一种 props 外的传递数据的方法, 从而避免了在每一个层级手动传递 props

在一个典型的 React 应用中, 数据流是从上而下的, 对于一些全局的数据(地区. UI 主题)等, 就比较繁琐了. Context 就是解决这些问题的方式.

#### Contex 使用情景

类似于主题, 认证用户, 首选语言这样的"全局数据", 我们可以使用 Context, 比如下面的例子中, 我们通过`theme`属性来手动调整一个按钮组件的样式:

```js
function ThemedButton(props) {
    return <Button theme={props.theme} />;
}

// 中间组件
function Toolbar(props) {
    // Toolbar 组件必须添加一个额外的 theme 属性
    // 然后传递它给 ThemedButton 组件
    return (
        <div>
            <ThemedButton theme={props.theme} />
        </div>
    );
}

class App extends React.Component {
    render() {
        return <Toolbar theme="dark" />;
    }
}
```

使用 Context 的代码就如下所示:

```js
// 创建一个 theme Context,  默认 theme 的值为 light
const ThemeContext = React.createContext('light');

function ThemedButton(props) {
    // ThemedButton 组件从 context 接收 theme
    return <ThemeContext.Consumer>{(theme) => <Button {...props} theme={theme} />}</ThemeContext.Consumer>;
}

// 中间组件
function Toolbar(props) {
    return (
        <div>
            <ThemedButton />
        </div>
    );
}

class App extends React.Component {
    render() {
        return (
            <ThemeContext.Provider value="dark">
                <Toolbar />
            </ThemeContext.Provider>
        );
    }
}
```

#### API

创建 Context: React.createContext

```js
const { Provider, Consumer } = React.createContext(defaultValue);
```

创建一队`{Provider, Consumer}`, 当 React 渲染 context 组件 Consumer 时, 它将从组件树的上层中最近的匹配的 Provider 读取当前的 context 值

如果没有匹配的`Provider`, 而此时你需要一个`Consumer`组件, 那么可以用一个`defaultValue`来在不封装的情况下对组件进行测试.

**Provider**

```js
<Provider value={/* some value */}>
```

React 组件运行 Consumers 定于 context 的改变. 接受一个`value`来传递给 Rovider 的后代 Consumers, 一个 Provider 可以联系到多个 Consumers, Provider 可以被嵌套以覆盖组件树内更深层次的值.

**Consumer**

```js
<Consumer>
  {value => /* render something based on the context value */}
</Consumer>
```

一个可以订阅 context 变化的 React 组件, 接受一个函数作为自己点, 函数接受当前 context 的值并返回一个 React 节点传递给函数的 value 将等于组件树上层 context 的最近的 Provider

每次 Provider 的值发生改变, 作为后代的所有 Consumers 都会重新渲染, 从 Provider 到其后代的 Consumers 传播不收 shouldComponentUpdate 方法的约束, 因此即使祖先组件退出更新时, 后代 Consumer 也会被更新

#### 父子耦合

从上而下传递 context 的过程中, 我们需要一种方式从子组件中更新 context, 可以通过 context 向下传递一个函数, 来允许 Consumer 更新 context:

```js
// 确保默认值按类型传递
// createContext() 匹配的属性是 Consumers 所期望的
export const ThemeContext = React.createContext({
    theme: themes.dark,
    toggleTheme: () => {}
});
```

#### 作用于多个上下文

为了保持 context 快速进行二次渲染, React 需要使每一个 Consunmer 在组件树中称为单独一个节点

当然两个或者多个上下文可以一起使用:

```js
// 主题上下文, 默认light
const ThemeContext = React.createContext('light');

// 登陆用户上下文
const UserContext = React.createContext();

// 一个依赖于两个上下文的中间组件
function Toolbar(props) {
    return (
        <ThemeContext.Consumer>
            {(theme) => (
                <UserContext.Consumer>{(user) => <ProfilePage user={user} theme={theme} />}</UserContext.Consumer>
            )}
        </ThemeContext.Consumer>
    );
}

class App extends React.Component {
    render() {
        const { signedInUser, theme } = this.props;

        // App组件提供上下文的初始值
        return (
            <ThemeContext.Provider value={theme}>
                <UserContext.Provider value={signedInUser}>
                    <Toolbar />
                </UserContext.Provider>
            </ThemeContext.Provider>
        );
    }
}
```

#### 生命周期中访问 Context

```js
class Button extends React.Component {
    componentDidMount() {
        // ThemeContext value is this.props.theme
    }

    componentDidUpdate(prevProps, prevState) {
        // Previous ThemeContext value is prevProps.theme
        // New ThemeContext value is this.props.theme
    }

    render() {
        const { theme, children } = this.props;
        return <button className={theme ? 'dark' : 'light'}>{children}</button>;
    }
}

export default (props) => (
    <ThemeContext.Consumer>{(theme) => <Button {...props} theme={theme} />}</ThemeContext.Consumer>
);
```

#### 高阶组件 Context

```js
const ThemeContext = React.createContext('light');

function ThemedButton(props) {
    return <ThemeContext.Consumer>{(theme) => <button className={theme} {...props} />}</ThemeContext.Consumer>;
}
```

创建一个高阶组件就可以是这样:

```js
const ThemeContext = React.createContext('light');

// 在函数中引入组件
export function withTheme(Component) {
    // 然后返回另一个组件
    return function ThemedComponent(props) {
        // 最后使用context theme渲染这个被封装组件
        // 注意我们照常引用了被添加的属性
        return <ThemeContext.Consumer>{(theme) => <Component {...props} theme={theme} />}</ThemeContext.Consumer>;
    };
}
```

使用高阶组件:

```js
function Button({ theme, ...rest }) {
    return <button className={theme} {...rest} />;
}

const ThemedButton = withTheme(Button);
```

#### 转发 refs

在使用 refs 的时候, 它不会自动的传递给被封装的元素, 此时,可以使用`React.forwardRef`:

```js
class FancyButton extends React.Component {
    focus() {
        // ...
    }

    // ...
}

// 使用 context 传递当前的 "theme" 给 FancyButton.
// 使用 forwardRef 传递 refs 给 FancyButton 也是可以的.
export default React.forwardRef((props, ref) => (
    <ThemeContext.Consumer>{(theme) => <FancyButton {...props} theme={theme} ref={ref} />}</ThemeContext.Consumer>
));
```

```js
import FancyButton from './fancy-button';

const ref = React.createRef();

// ref属性将指向 FancyButton 组件,
// ThemeContext.Consumer 没有包裹它
// 这意味着我们可以调用 FancyButton 的方法就像这样 ref.current.focus()
<FancyButton ref={ref} onClick={handleClick}>
    Click me!
</FancyButton>;
```

### Fragments

Fragments 看起来像空的 JSX 标签:

```js
render() {
  return (
    <>
      <ChildA />
      <ChildB />
      <ChildC />
    </>
  );
}
```

#### 情景

当一个组件返回一个子元素列表的时候, 比如`table`标签中:

```js
class Table extends React.Component {
    render() {
        return (
            <table>
                <tr>
                    <Columns />
                </tr>
            </table>
        );
    }
}
```

那么可以返回:

```js
class Columns extends React.Component {
    render() {
        return (
            <>
                <td>Hello</td>
                <td>World</td>
            </>
        );
    }
}
```

或者使用语义清晰的标签(前面的只是一种语法糖):

```js
class Columns extends React.Component {
    render() {
        return (
            <React.Fragment>
                <td>Hello</td>
                <td>World</td>
            </React.Fragment>
        );
    }
}
```

除了 key, Fragment 不接受键值或属性:

```js
function Glossary(props) {
    return (
        <dl>
            {props.items.map((item) => (
                // 没有`key`，将会触发一个key警告
                <React.Fragment key={item.id}>
                    <dt>{item.term}</dt>
                    <dd>{item.description}</dd>
                </React.Fragment>
            ))}
        </dl>
    );
}
```

### Portals

> Portals 提供了一种将子节点渲染到父组件以外的 DOM 节点的方式

```js
ReactDOM.createPortal(child, container);
```

这是一个简单的用例:

```js
render() {
  // React mounts a new div and renders the children into it
  return (
    <div>
      {this.props.children}
    </div>
  );
}
```

正常情况下我们通过上面这种方式渲染子节点, 使用 portal 可以这样写:

```js
render() {
  // React does *not* create a new div. It renders the children into `domNode`.
  // `domNode` is any valid DOM node, regardless of its location in the DOM.
  return ReactDOM.createPortal(
    this.props.children,
    domNode,
  );
}
```

典型的一个应用场景是当父组件有`overflow:hidden`或`z-index`这样的样式, 而又恰巧需要在视觉上`break out`出容器, 比如对话框或者提示框.

#### 事件冒泡

尽管 Protals 可以放在 DOM 树的任何地方, 但是在其他方面和普通的子节点行为是一致的, 比如上下文的特性. 其中就包含了事件冒泡.

下面是一个例子

{% codepen jGBWpE  gaearon %}

### Error Boundaries: 错误边界

部分 UI 的异常不应该破坏整个应用. 为了解决这个问题, React16 引入了 **"错误边界"** 的概念.

错误边界用于捕获子组件树的 js 异常, 记录错误并展示一个回退的 UI 的 React 组件, 而不是整个组件树的异常. 错误边界在渲染期间, 生命周期方法内, 以及整个组件树构造函数内捕获错误

{% note warning %}

    注意: 错误边界无法捕获如下错误:

    - 事件处理
    - 异步代码
    - 服务端渲染
    - 错误边界自身抛出的错误

{% endnote %}

大致用法如下:

```js
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // You can also log the error to an error reporting service
        logErrorToMyService(error, info);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
    }
}
```

一个类组件定义了生面周期`static getDerivedStateFromError`和`componentDidCatch`中的任意一个或两个, 就成为一个错误边界. 前者渲染一个退路 UI, 后者记录错误信息. 然后像一个普通的组件一样使用
:

```js
<ErrorBoundary>
    <MyWidget />
</ErrorBoundary>
```

看起来就像是 js 中的`catch`. 我们可以把这个错误边界放到`APP`组件的外层来捕获全局的错误, 或者放在某一个部分来保护其他的 UI 组件不出错.

从 Recat16 开始, 任何没有被错误边界捕获的错误会导致卸载整个 React 组件树.

#### 事件处理器

错误边界不能捕获事件处理器内部的错误.

React 不需要错误边界恢复位于事件处理器内部的错误, 其内部的错误使用普通的`try..catch`即可捕获.

### WEB Components

> [Web Components MDN](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components)

WebComponents 为可重用组件提供了强大的封装能力, 与 React 保持 DOM 和数据同步的目标互补, 我们可以再 WebComponents 中使用 Rect 也可以在 React 中使用 WebComponents.

#### 在 React 中使用 WebComponents

```js
class HelloMessage extends React.Component {
    render() {
        return (
            <div>
                Hello <x-search>{this.props.name}</x-search>!
            </div>
        );
    }
}
```

1. webComponents 通常需要暴露一个方法,为了访问组件必要 API, 需要一个引用来直接和 DOM 节点交互, 最好的解决方案是编写一个 React 组件来包装 Web 组件
2. WebComponents 触发的事件可能无法通过 React 渲染来正确冒泡, 需要手动捕获事件来处理那些在 React 中的事件.

#### 在 Web 组件中使用 React

```js
const proto = Object.create(HTMLElement.prototype, {
    attachedCallback: {
        value: function() {
            const mountPoint = document.createElement('span');
            this.createShadowRoot().appendChild(mountPoint);

            const name = this.getAttribute('name');
            const url = 'https://www.google.com/search?q=' + encodeURIComponent(name);
            ReactDOM.render(<a href={url}>{name}</a>, mountPoint);
        }
    }
});
document.registerElement('x-search', { prototype: proto });
```

### 高阶组件(HOC)

高阶组件并不是 React API, 它只是一种模式, 具体而言, 高阶组件就是一个函数, 接受一个组件作为参数, 返回一个新的组件.

```js
const EnhancedComponent = higherOrderComponent(WrappedComponent);
```

#### 使用高阶组件解决横切关注点

在 React 中, 组件是代码复用的主要单元, 但有时比较但复用不同组件的同类逻辑, 比如下面这个例子:

```js
class CommentList extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            // "DataSource" is some global data source
            comments: DataSource.getComments()
        };
    }

    componentDidMount() {
        // Subscribe to changes
        DataSource.addChangeListener(this.handleChange);
    }

    componentWillUnmount() {
        // Clean up listener
        DataSource.removeChangeListener(this.handleChange);
    }

    handleChange() {
        // Update component state whenever the data source changes
        this.setState({
            comments: DataSource.getComments()
        });
    }

    render() {
        return (
            <div>
                {this.state.comments.map((comment) => (
                    <Comment comment={comment} key={comment.id} />
                ))}
            </div>
        );
    }
}
```

我们定义了一个评论列表组件, 该组件从外部订阅数据, 并渲染.

然后我们又有一个博客文章的组件, 类似的逻辑处理:

```js
class BlogPost extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            blogPost: DataSource.getBlogPost(props.id)
        };
    }

    componentDidMount() {
        DataSource.addChangeListener(this.handleChange);
    }

    componentWillUnmount() {
        DataSource.removeChangeListener(this.handleChange);
    }

    handleChange() {
        this.setState({
            blogPost: DataSource.getBlogPost(this.props.id)
        });
    }

    render() {
        return <TextBlock text={this.state.blogPost} />;
    }
}
```

这两个组件中有许多实现是相同的:

-   挂载组件时, 向`DataSource`添加一个改变监听器
-   在监听器内, 每当数据源发生改变的时候代用`setState`, 卸载组件时, 移除改变监听器.

因此我们希望有一个抽象来抽离出这种逻辑用于系统间许多地方:

```js
const CommentListWithSubscription = withSubscription(CommentList, (DataSource) => DataSource.getComments());

const BlogPostWithSubscription = withSubscription(BlogPost, (DataSource, props) => DataSource.getBlogPost(props.id));
```

实现如下:

```js
// This function takes a component...
function withSubscription(WrappedComponent, selectData) {
    // ...and returns another component...
    return class extends React.Component {
        constructor(props) {
            super(props);
            this.handleChange = this.handleChange.bind(this);
            this.state = {
                data: selectData(DataSource, props)
            };
        }

        componentDidMount() {
            // ... that takes care of the subscription...
            DataSource.addChangeListener(this.handleChange);
        }

        componentWillUnmount() {
            DataSource.removeChangeListener(this.handleChange);
        }

        handleChange() {
            this.setState({
                data: selectData(DataSource, this.props)
            });
        }

        render() {
            // ... and renders the wrapped component with the fresh data!
            // Notice that we pass through any additional props
            return <WrappedComponent data={this.state.data} {...this.props} />;
        }
    };
}
```

编写高阶组件, 不能修改输入组件, 也不要继承拷贝它的行为. 高阶组件就是一个没有副作用的纯函数.

下面是编写高阶组件的几个约定

#### 约定一: 贯穿传递不相关的 props 属性给被包裹的组件

高阶组件应当贯穿传递与它无关的 Props 属性:

```js
render() {
  // 过滤掉专用于这个阶组件的props属性，
  // 不应该被贯穿传递
  const { extraProp, ...passThroughProps } = this.props;

  // 向被包裹的组件注入props属性，这些一般都是状态值或
  // 实例方法
  const injectedProp = someStateOrInstanceMethod;

  // 向被包裹的组件传递props属性
  return (
    <WrappedComponent
      injectedProp={injectedProp}
      {...passThroughProps}
    />
  );
}
```

#### 约定二: 最大化的组合性

当然高阶组件并不是都看起来一样的, 有时候是这样:

```js
const NavbarWithRouter = withRouter(Navbar);
```

一般而言, 高阶组件会接受额外的参数, 在下面这个示例中, 一个 config 对象用于指定组件的数据依赖:

```js
const CommentWithRelay = Relay.createContainer(Comment, config);
```

常用签名如下:

```js
// React Redux's `connect`
const ConnectedComment = connect(
    commentSelector,
    commentActions
)(Comment);
```

#### 约定三: 包装显示以便于调试

我们约定高阶组件用`with...`开头, 如果组件名字是`withSubscription`, 那么就是

```js
WithSubscription(CommentList);
```

#### 其他告诫

此外, 还有一些需要避免的代码风格:

-   不要再 render 方法内使用高阶组件
-   必须将静态方法做拷贝
-   refs 属性不能贯穿传递


