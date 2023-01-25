# API-Ref


> Refs 提供了一种方式，允许我们访问 DOM 节点或在 render 方法中创建的 React 元素。

## 何时使用 Ref

-   管理焦点，文本选择或媒体播放。
-   触发强制动画。
-   集成第三方 DOM 库。

等等.

避免使用 refs 来做任何可以通过声明式实现来完成的事情.

## 使用方法

Reat 提供了三种 ref 的使用方法:

1. 字符串(已废弃)
2. 回调函数
3. React.creatRef() (v16.3 以后)

### 字符串

1. dom 节点上使用，通过 this.refs[refName]来引用真实的 dom 节点

```js
<input ref="inputRef" /> //this.refs['inputRef']来访问
```

2. 类组件上使用，通过 this.refs[refName]来引用组件的实例

```js
<CustomInput ref="comRef" /> //this.refs['comRef']来访问
```

### 回调函数

回调函数就是在 dom 节点或组件上挂载函数，函数的入参是 dom 节点或组件实例，达到的效果与字符串形式是一样的，
都是获取其引用。

回调函数的触发时机：

1. 组件渲染后, 即 componentDidMount
2. 组件卸载后, 即 componentWillMount, 此时入参为 null
3. ref 改变后

使用情况:

1. dom 节点上使用回调函数:

```js
<input
    ref={input => {
        this.textInput = input;
    }}
    type="text"
/>
```

2. 类组件上使用:

```js
<CustomInput
    ref={input => {
        this.textInput = input;
    }}
/>
```

3. 通过 Props 跨级传递的方式来获取子组件的 DOM 节点或者组件实例:

```js
function CustomTextInput(props) {
    return (
        <div>
            <input ref={props.inputRef} />
        </div>
    );
}
function Parent(props) {
    return (
        <div>
            My input: <CustomTextInput inputRef={props.inputRef} />
        </div>
    );
}
class Grandparent extends React.Component {
    render() {
        return <Parent inputRef={el => (this.inputElement = el)} />;
    }
}
```

### React.createRef()

这是 v16.3 以后的版本调用方式:

```js
class Child extends React.Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();
    }
    componentDidMount() {
        console.log(this.myRef.current);
    }
    render() {
        return <input ref={this.myRef} />;
    }
}
```

## Forward Ref

同样是 v16 以后提供的一种转发 ref 的方式:

```js
//子组件（通过forwardRef方法创建）
const Child = React.forwardRef((props, ref) => <input ref={ref} />);

//父组件
class Father extends React.Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();
    }
    componentDidMount() {
        console.log(this.myRef.current);
    }
    render() {
        return <Child ref={this.myRef} />;
    }
}
```

子组件通过`React.forwardRef` 来创建，可以将 `ref` 传递到内部的节点或组件，进而实现跨层级的引用。

`forwardRef` 在高阶组件中可以获取到原始组件的实例.

```js
//生成高阶组件
const logProps = logProps(Child);

//调用高阶组件
class Father extends React.Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();
    }
    componentDidMount() {
        console.log(this.myRef.current);
    }
    render() {
        return <LogProps ref={this.myRef} />;
    }
}

//HOC
function logProps(Component) {
    class LogProps extends React.Component {
        componentDidUpdate(prevProps) {
            console.log('old props:', prevProps);
            console.log('new props:', this.props);
        }

        render() {
            const { forwardedRef, ...rest } = this.props;

            // Assign the custom prop "forwardedRef" as a ref
            return <Component ref={forwardedRef} {...rest} />;
        }
    }

    // Note the second param "ref" provided by React.forwardRef.
    // We can pass it along to LogProps as a regular prop, e.g. "forwardedRef"
    // And it can then be attached to the Component.
    return React.forwardRef((props, ref) => {
        return <LogProps {...props} forwardedRef={ref} />;
    });
}
```

注意:

1.  ref 在函数式组件上不可使用，函数式组件无实例，但是其内部的 dom 节点和类组件可以使用
2.  可以通过 ReactDOM.findDOMNode()，入参是一个组件或 dom 节点，返回值的组件对应的 dom 根节点或 dom 节点本身. 通过 refs 获取到组件实例后，可以通过此方法来获取其对应的 dom 节点
3.  React 的 render 函数返回的是 vDom(虚拟 dom)
