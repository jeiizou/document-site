# React Router 使用记录以及备查

<!-- more -->

## 相关链接

-   教程: http://www.ruanyifeng.com/blog/2016/05/react_router.html
-   文档: https://reacttraining.com/react-router/web/guides/quick-start
-   代码地址: https://github.com/ReactTraining/react-router

<!-- more -->

## 使用方法

-   安装:

```s
$ npm install -S react-router
```

-   引入:

```js
# import { Router } from 'react-router';
render(<Router />, document.getElementById('app'));
```

-   基础用法:

```js
import { Router, Route, hashHistory } from 'react-router';

render(
    <Router history={hashHistory}>
        <Route path="/" component={App} />
    </Router>,
    document.getElementById('app')
);
```

`history`的`hasHistory`表示使用'/#/'模式

-   简单嵌套:

```js
<Router history={hashHistory}>
    <Route path="/" component={App}>
        <Route path="/repos" component={Repos} />
        <Route path="/about" component={About} />
    </Route>
</Router>
```

访问`/repos`:

```js
<App>
    <Repos />
</App>
```

子路由可以不写在`router`组件里面, 单独传入`Router`组件的`routes`属性.

## path 属性

`Route`组件的`path`属性指定路由的匹配规则. 这个规则是可以省略的, 这样的话, 不管路径是否匹配, 总会加载指定组件.

```js
<Route path="inbox" component={Inbox}>
    <Route path="messages/:id" component={Message} />
</Route>
```

## 通配符

```js
<Route path="/hello/:name">
// 匹配 /hello/michael
// 匹配 /hello/ryan

<Route path="/hello(/:name)">
// 匹配 /hello
// 匹配 /hello/michael
// 匹配 /hello/ryan

<Route path="/files/*.*">
// 匹配 /files/hello.jpg
// 匹配 /files/hello.html

<Route path="/files/*">
// 匹配 /files/
// 匹配 /files/a
// 匹配 /files/a/b

<Route path="/**/*.jpg">
// 匹配 /files/hello.jpg
// 匹配 /files/path/to/file.jpg
```

规则如下:

1. `:paramName` : `:paramName`匹配 URL 的一个部分下一个`/`,`?`.`#`为止, 这个路径参数可以通过`this.props.params.paramName`取出.
2. `()`: 表示这个部分可选的
3. `*`: 匹配任意字符, 知道模式里面的下一个字符为止, 匹配方式是费贪婪模式.
4. `**`: 匹配任意字符, 直到下一个`/`,`?`,`#`为止. 匹配方式是贪婪模式.

`path`不以`/`开头, 匹配时就会相对于父组件的路径, 可以参考上一节的例子. 嵌套路由如果想要摆脱这个规则, 可以使用绝对路由.

此外, 匹配规则从上到下执行, 一旦发现匹配就不在匹配其余的规则:

```js
<Router>
    <Route path="/:userName/:id" component={UserPage} />
    <Route path="/about/me" component={About} />
</Router>
```

带参数的路径一般要写在路由规则的底部.

## IndexRoute

```js
<Router>
    <Route path="/" component={App}>
        <IndexRoute component={Home} />
        <Route path="accounts" component={Accounts} />
        <Route path="statements" component={Statements} />
    </Route>
</Router>
```

IndexRoute 显式指定 Home 是根路由的子组件，即指定默认情况下加载的子组件。你可以把 IndexRoute 想象成某个路径的 index.html。

注意，IndexRoute 组件没有路径参数 path。

## Redirect

<Redirect>组件用于路由的跳转，即用户访问一个路由，会自动跳转到另一个路由。

```js
<Route path="inbox" component={Inbox}>
    {/* 从 /inbox/messages/:id 跳转到 /messages/:id */}
    <Redirect from="messages/:id" to="/messages/:id" />
</Route>
```

## IndexRedirect

IndexRedirect 组件用于访问根路由的时候，将用户重定向到某个子组件。

```js
<Route path="/" component={App}>
    <IndexRedirect to="/welcome" />
    <Route path="welcome" component={Welcome} />
    <Route path="about" component={About} />
</Route>
```

## Link

Link 组件用于取代`<a>`元素，生成一个链接，允许用户点击后跳转到另一个路由。它基本上就是`<a>`元素的 React 版本，可以接收 Router 的状态。

如果希望当前的路由与其他路由有不同样式，这时可以使用 Link 组件的 activeStyle 属性。

```js
<Link to="/about" activeStyle={{color: 'red'}}>About</Link>
<Link to="/repos" activeStyle={{color: 'red'}}>Repos</Link>
```

以及可以使用`activeClassName`指定当前路由的`Class`:

```js
<Link to="/about" activeClassName="active">About</Link>
<Link to="/repos" activeClassName="active">Repos</Link>
```

导航到路由页面, 可以使用浏览器的 History API, 像下面这样:

```js
import { browserHistory } from 'react-router';
browserHistory.push('/some/path');
```

## IndexLink

连接到跟路由`/`不要使用`Link`而是用`IndexLink`组件

因为对于根路由 `activeStyle`和`activeClassName`会一直处于激活状态, `IndexLink`会使用路径的精确匹配.

或者使用`Link`组件的`onlyActiveOnIndex`属性也可以达到同样的效果.

```jsx
<Link to="/" activeClassName="active" onlyActiveOnIndex={true}>
    Home
</Link>
```

## history

`Router`组件的`history`属性, 用来监听浏览器地址栏的变化, 并将 URL 解析成一个地址对象, 供 React Router 匹配

history 属性, 一共可以设置三种值:

-   browserHistory: 正常路由, 调用 History API, 需要对服务器进行改造.

```js
import { browserHistory } from 'react-router';

render(<Router history={browserHistory} routes={routes} />, document.getElementById('app'));
```

-   hashHistory: 路由中有`/#/`, 路由通过 URL 的 hash 的部分切换

```js
import { hashHistory } from 'react-router';

render(<Router history={hashHistory} routes={routes} />, document.getElementById('app'));
```

-   createMemoryHistory: 主要用于服务器渲染, 创建一个内存中的`history`对象, 不予浏览器 URL 互动.

```js
const history = createMemoryHistory(location);
```

## 表单处理

现在有一个表单:

```js
<form onSubmit={this.handleSubmit}>
    <input type="text" placeholder="userName" />
    <input type="text" placeholder="repo" />
    <button type="submit">Go</button>
</form>
```

有两种方式, 一(`browserHistory.push`):

```js
import { browserHistory } from 'react-router'

// ...
  handleSubmit(event) {
    event.preventDefault()
    const userName = event.target.elements[0].value
    const repo = event.target.elements[1].value
    const path = `/repos/${userName}/${repo}`
    browserHistory.push(path)
  },
```

二(context 对象):

```js
export default React.createClass({
    // ask for `router` from context
    contextTypes: {
        router: React.PropTypes.object
    },

    handleSubmit(event) {
        // ...
        this.context.router.push(path);
    }
});
```

## 路由的钩子

路由有`Enter`和`Leave`两种钩子:

```js
<Route path="about" component={About} />
<Route path="inbox" component={Inbox}>
  <Redirect from="messages/:id" to="/messages/:id" />
</Route>
```

以离开`/messages/:id`, 进入`/about`为例:

1. /messages/:id 的 onLeave
2. /inbox 的 onLeave
3. /about 的 onEnter

下面是几个例子:

1. 替代`<Redirect>`组件:

```js
<Route path="inbox" component={Inbox}>
    <Route path="messages/:id" onEnter={({ params }, replace) => replace(`/messages/${params.id}`)} />
</Route>
```

2. `onEnter`钩子还可以用来做认证:

```js
const requireAuth = (nextState, replace) => {
    if (!auth.isAdmin()) {
        // Redirect to Home page if not an Admin
        replace({ pathname: '/' });
    }
};
export const AdminRoutes = () => {
    return <Route path="/admin" component={Admin} onEnter={requireAuth} />;
};
```

3. 路由跳转确认

```js
const Home = withRouter(
    React.createClass({
        componentDidMount() {
            this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
        },

        routerWillLeave(nextLocation) {
            // 返回 false 会继续停留当前页面，
            // 否则，返回一个字符串，会显示给用户，让其自己决定
            if (!this.state.isSaved) return '确认要离开？';
        }
    })
);
```
