# 基础-SetState


## setState 的执行顺序

![image](/assets/2021-3-9/1459640-20181124224144801-1561228641.png)

state 是在 class 组件中保存组件状态的一个内部对象, 它有一些独特的机制来是的将数据的变更自动的反映到界面中.

其机制有几个关键要点:

1. setState 不会立刻改变 React 组件中的 state 的值
2. setState 通过引发一次组件的更新来引发重绘
3. 多次的 setState 会触发 BatchUpdate

当 shouldeComponentUpdate 返回 true 时, setState 会依次调用 4 个生命周期方法:

1. shouldComponentUpdate
2. componentWillUpdate
3. render()
4. compnentDidUpdate

其中最消耗性能的步骤在`render()`函数中对 Virtual DOM 的 diff 算法.

React 的策略是讲 setState 的效果放在队列中, 积攒一些操作, 再一起更新. 这就是关键点中的第三点`batchUpdate`.

## 批量更新-Batch Update

setState 在正常的使用情况下是**异步更新**, 这个异步指的的在下一次生命周期中才能访问到更新后的值.

但是连续调用掉多次的 setState, 在 React 内部会进行性能优化, 并将其 merge.

就像这样:

```js
// multiple setState() calls
  increaseScoreBy3 () {
    this.setState({score : this.state.score + 1});
    this.setState({score : this.state.score + 1});
    this.setState({score : this.state.score + 1});
  }

...

//==>内部处理
const singleObject = Object.assign(
  {},
  objectFromSetState1,
  objectFromSetState2,
  objectFromSetState3
);
```

在下一次生命周期中, score 只会增长`1`, 这就是所谓的 Batch Update

## Functional setState

Functional setState 是另一种给 setState 传值的方式, 可以解决上面的问题.

```js
// multiple functional setState call
increaseScoreBy3 () {
    this.setState( (state) => ({score : state.score + 1}) ),
    this.setState( (state) => ({score : state.score + 1}) ),
    this.setState( (state) => ({score : state.score + 1}) )
}
```

在 react 内, 使用函数作为 setState 时, React 会将所有的更新组成一个队列, 然后按照他们调用的顺序来执行.

这样避免了 state 合并成一个对象的问题.

此外, 由于传递进入的是一个函数, 我们还可以把行为抽象出来:

```js
function increment(state, props) {
    return {
        value: state.value + props.step
    };
}

function decrement(state, props) {
    return {
        value: state.value - props.step
    };
}

class Counter extends React.Component {
    state = { value: 0 };
    handleIncrement = () => {
        this.setState(increment);
    };
    handleDecrement = () => {
        this.setState(decrement);
    };

    render() {
        return (
            <div>
                <span>{this.state.value}</span>
                <button onClick={this.handleIncrement}>+</button>
                <button onClick={this.handleDecrement}>-</button>
            </div>
        );
    }
}

ReactDOM.render(<Counter step={1} />, document.getElementById('root'));
```

## 同步更新的 “除此之外”

绕过 react 的机制, 我们是可以实现同步执行的, 比如通过`addEventListener`直接添加的事件处理函数, 还有通过`setTimeOut/setInterval`产生的异步调用.

在 React 的`setState`函数实现中, 会根据一个变量`isBatchingUpdates`来判断是否直接更新`this.state`还是放到队列中. 这个变量默认为`false`, 函数`batchedUpdates`会修改这个值为`true`, react 在调用事件处理函数之前就会调用这个函数, 使得`setState`不会同步更新`this.state`.

下面是一个具体的实例:

```js
class App extends React.Component {
    constructor() {
        super(...arguments);

        this.onClick = this.onClick.bind(this);
        this.onClickLater = this.onClickLater.bind(this);

        this.state = {
            count: 0
        };
    }

    onClick() {
        this.setState({ count: this.state.count + 1 });
        //判断是否同步更新了this.state
        console.log('# this.state', this.state);
    }

    onClickLater() {
        setTimeout(() => {
            this.onClick();
        });
    }

    componentDidMount() {
        document.querySelector('#btn-raw').addEventListener('click', this.onClick);
    }

    render() {
        console.log('#enter render');
        return (
            <div>
                <div>
                    {this.state.count}
                    <button onClick={this.onClick}>Increment</button>
                    <button id="btn-raw">Increment Raw</button>
                    <button onClick={this.onClickLater}>Increment Later</button>
                </div>
            </div>
        );
    }
}
```

同步更新 state, 每一次调用 setState 都会引发同步的更新过程, 这会导致频繁的更新, 降低网页的性能.

所以虽然 React 具备了让 setState 同步更新 this.state 的功能, 我们应该还是避免这种使用方式.

## 小结

setState 有时候是同步的, 有时候是异步的.

1. `setState`在合成事件和钩子函数中是"异步"的, 在原生事件和`setTimeout`中是同步的.
2. `setState`的异步并不是说内部有一步代码实现, 其实本身执行的过程和代码都是同步的, 只是合成事件和钩子函数的调用顺序在更新之前, 导致这两者没法立马拿到更新后的值, 形成所谓的异步, 当然可以在第二个参数中通过`callback`拿到更新后的结果.
3. `setState`的批量更新优化也是建立在"异步"之上的, 在原生时间和`setTimeout`中不会批量更新, 也没有批量更新的优化策略.



## 参考链接

-   [setState 到底是异步还是同步](http://www.cxymsg.com/guide/react.html#react%E7%9A%84%E8%AF%B7%E6%B1%82%E5%BA%94%E8%AF%A5%E6%94%BE%E5%9C%A8%E5%93%AA%E4%B8%AA%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%B8%AD)
