# [01]StackArchitecture

## 项目结构

- fixtures: 小型的react测试项目
- build: 打包产物
- packages: 包含元数据
  - react: 核心代码
  - react-dom: DOM Renderer, 用于渲染到浏览器的渲染器
  - react-test-renderer: TEST Redenerer, 用于将组件渲染为JSON树,用于Jest的快照测试
  - react-reconciler: React Fiber 相关的调度系统
  - react-dom/src/events: 事件系统


## 组件的挂载

- react元素是用来表示组件的类型和props的简单对象
- 用户定义的组件可以是类也可以是函数,但是它们都渲染产生元素
- 挂载是一个递归的过程,根据特定的顶层React元素产生DOM树(或者Native树)

一个简化了的组件树的挂载过程如下:

```js
// 判断是否是一个类组件
function isClass(type) {
  // 类组件会有这个标识位
  return (
    Boolean(type.prototype) &&
    Boolean(type.prototype.isReactComponent)
  );
}

// 此函数仅处理组合类型的元素
// 例如，处理 <App /> 和 <Button />, 但不处理 <div />
function mountComposite(element) {
  var type = element.type;
  var props = element.props;

  var renderedElement;
  if (isClass(type)) {
    // 类组件
    var publicInstance = new type(props);
    // 设置 props
    publicInstance.props = props;
    // 如果有生命周期方法就调用
    if (publicInstance.componentWillMount) {
      publicInstance.componentWillMount();
    }
    renderedElement = publicInstance.render();
  } else if (typeof type === 'function') {
    // 函数组件
    renderedElement = type(props);
  }

  // 这是递归的，但是当元素是宿主(例如： <div />)而不是组合(例如 <App />)时，
  // 我们最终会到达递归的底部：
  return mount(renderedElement);
}


// 此函数只处理宿主类型的元素
// 例如： 处理 <div /> 和 <p />，但不处理 <App />.
function mountHost(element) {
  var type = element.type;
  var props = element.props;
  var children = props.children || [];
  if (!Array.isArray(children)) {
    children = [children];
  }
  children = children.filter(Boolean);

  // 这段代码不应该出现在 reconciler。
  // 不同的 renderer 可能会以不同方式初始化节点。
  // 例如，React Native 会创建 iOS 或 Android 的视图。
  var node = document.createElement(type);
  Object.keys(props).forEach(propName => {
    if (propName !== 'children') {
      node.setAttribute(propName, props[propName]);
    }
  });

  // 挂载子元素
  children.forEach(childElement => {
    // 子元素可能是宿主(例如：<div />)或者组合 (例如：<Button />).
    // 我们还是递归挂载他们
    var childNode = mount(childElement);

    // 这一行代码也是特殊的 renderer。
    // 根据 renderer 不同，方式也不同：
    node.appendChild(childNode);
  });

  // DOM 节点作为挂载的结果返回。
  // 这是递归结束的位置。
  return node;
}

// 实际执行的 mount 方法, 判断是用户定义组件还是平台定义的组件
function mount(element) {
  var type = element.type;
  if (typeof type === 'function') {
    // 用户定义组件
    return mountComposite(element);
  } else if (typeof type === 'string') {
    // 平台特定组件
    return mountHost(element);
  }
}

var rootEl = document.getElementById('root');
var node = mount(<App />);
rootEl.appendChild(node);
```

这部分代码主要通过`mount`方法作为渲染的入口, 区分了`组件`和`元素`的渲染逻辑.

不过仍然是缺少更新的逻辑的. 

## 组件的更新

上面的代码只能知道怎么挂载一开始的树, 是没有办法更新某个节点的.

要使其能够完成组件的更新, 需要这么几个步骤;

### 引入内部实例

用`DomComponent`和`CompositeComponent`两个类来代替`mountHost`和`mountComposite`两个方法. 

```js
function instantiateComponent(element) {
  var type = element.type;
  if (typeof type === 'function') {
    // 用户定义组件
    return new CompositeComponent(element);
  } else if (typeof type === 'string') {
    // 平台特定组件
    return new DOMComponent(element);
  }  
}
```

对于组件类, 可以这么修改:

```js
class CompositeComponent {
  constructor(element) {
    this.currentElement = element;
    this.renderedComponent = null;
    this.publicInstance = null;
  }

  getPublicInstance() {
    // 对于组合组件，公共类实例
    return this.publicInstance;
  }

  mount() {
    var element = this.currentElement;
    var type = element.type;
    var props = element.props;

    var publicInstance;
    var renderedElement;
    if (isClass(type)) {
      // 组件类
      publicInstance = new type(props);
      // 设置 props
      publicInstance.props = props;
      // 如果有生命周期方法就调用
      if (publicInstance.componentWillMount) {
        publicInstance.componentWillMount();
      }
      renderedElement = publicInstance.render();
    } else if (typeof type === 'function') {
      // 函数组件
      publicInstance = null;
      renderedElement = type(props);
    }

    // 保存公共实例
    this.publicInstance = publicInstance;

    // 根据元素实例化子内部实例。
    // <div /> 或者 <p /> 是 DOMComponent，
    // 而 <App /> 或者 <Button /> 是 CompositeComponent。
    var renderedComponent = instantiateComponent(renderedElement);
    this.renderedComponent = renderedComponent;

    // 挂载渲染后的输出
    return renderedComponent.mount();
  }
}
```

与`mountComposite`不同, 我们可以保留一些信息到当前的渲染上下文中, 比如当前正在渲染的元素等, 用于更新的时候使用

`element.type`是用户定义的组件, 而`CompositeComponent`这个对象是我们的`reconciler`的实现细节. 这是两个不同的实体.

我们把`CompositeComponent`和`DomComponent`的实例叫做"内部实例". 我们可以把一些需要长期存在的数据放在其中, 只有`render`和`reconciler`能意识到他们的存在.

而对应的, 我们把用户定义的类就可以叫做"公共实例", 就是我们在`render`方法中传入的那些自定义组件.

`mountHost`也会同样的重构成`DOMComponent`类的`mount()`方法. 看起来是这样:

```js
class DOMComponent {
  constructor(element) {
    this.currentElement = element;
    this.renderedChildren = [];
    this.node = null;
  }

  getPublicInstance() {
    // 对于 DOM 组件，只公共 DOM 节点
    return this.node;
  }

  mount() {
    var element = this.currentElement;
    var type = element.type;
    var props = element.props;
    var children = props.children || [];
    if (!Array.isArray(children)) {
      children = [children];
    }

    // 创建并保存节点
    var node = document.createElement(type);
    this.node = node;

    // 设置属性
    Object.keys(props).forEach(propName => {
      if (propName !== 'children') {
        node.setAttribute(propName, props[propName]);
      }
    });

    // 创建并保存包含的子项
    // 他们每个都可以是 DOMComponent 或者是 CompositeComponent，
    // 取决于类型是字符串还是函数
    var renderedChildren = children.map(instantiateComponent);
    this.renderedChildren = renderedChildren;

    // 收集他们在 mount 上返回的节点
    var childNodes = renderedChildren.map(child => child.mount());
    childNodes.forEach(childNode => node.appendChild(childNode));

    // DOM 节点作为挂载结果返回
    return node;
  }
}
```

现在, 每个内部实例, 组合或者宿主, 都指向了它的`子内部实例`.

假设现在有一个函数组件`<App>`, 内部有一个`<Button>`, `Button`渲染了一个`<div>`. 那么它的内部实例树是这样的:

```js
[object CompositeComponent] {
  currentElement: <App />,
  publicInstance: null,
  renderedComponent: [object CompositeComponent] {
    currentElement: <Button />,
    publicInstance: [object Button],
    renderedComponent: [object DOMComponent] {
      currentElement: <div />,
      node: [object HTMLDivElement],
      renderedChildren: []
    }
  }
}
```

最后, 我们需要一个将树挂载到容器节点的函数, 类似这样:

```js
function mountTree(element, containerNode) {
  // 创建顶层内部实例
  var rootComponent = instantiateComponent(element);

  // 挂载顶层组件到容器中
  var node = rootComponent.mount();
  containerNode.appendChild(node);

  // 返回它提供的公共实例
  var publicInstance = rootComponent.getPublicInstance();
  return publicInstance;
}

var rootEl = document.getElementById('root');
mountTree(<App />, rootEl);
```

### 卸载

我们的内部梳理上, 保留了其子节点和DOM节点, 卸载的逻辑也是递归的:

```js
unmount() {
  // 如果有生命周期方法就调用
  var publicInstance = this.publicInstance;
  if (publicInstance) {
    if (publicInstance.componentWillUnmount) {
      publicInstance.componentWillUnmount();
    }
  }
  // 卸载单个渲染的组件
  var renderedComponent = this.renderedComponent;
  renderedComponent.unmount();
}
```

对于元素(DOMComponent)来说, 也是这样的:

```js
unmount() {
  // 卸载所有的子项
  var renderedChildren = this.renderedChildren;
  renderedChildren.forEach(child => child.unmount());
}
```

同样的增加顶层的卸载函数:

```js
function unmountTree(containerNode) {
  // 从 DOM 节点读取内部实例:
  // (这还不起作用,我们需要更改 mountTreeTree() 来存储它。)
  var node = containerNode.firstChild;
  var rootComponent = node._internalInstance;

  // 卸载树并清空容器
  rootComponent.unmount();
  containerNode.innerHTML = '';
}
```

修改之前的`mountTree`函数:

```js
function mountTree(element, containerNode) {
  // 销毁所有现有的树
  if (containerNode.firstChild) {
    unmountTree(containerNode);
  }

  // 创建顶层的内部实例
  var rootComponent = instantiateComponent(element);

  // 挂载顶层组件到容器中
  var node = rootComponent.mount();
  containerNode.appendChild(node);

  // 保存对内部实例的引用
  node._internalInstance = rootComponent;

  // 返回它提供的公共实例
  var publicInstance = rootComponent.getPublicInstance();
  return publicInstance;
}
```

### 更新

在上面的`mountTree`中, 每次都会先卸载整个树然后重新挂载. 这是不能接受的.

`reconciler`应该尽量的复用现有的实例来保留DOM和状态.

在`CompositeComponent`方法上新增一个`receive(nextElement)`的方法, 用于组件更新. 这是所谓的`virtual DOM diffing`的部分, 但实际来说, 是我们遍历内部树, 让每个内部梳理接收更新. 

#### 更新组件

组件接收到一个`nextElement`的时候, 会运行`componentWillUpdate`方法, 然后用新的`prop`重新渲染组件. 

```js
class CompositeComponent {

  // ...

  receive(nextElement) {
    var prevProps = this.currentElement.props;
    var publicInstance = this.publicInstance;
    var prevRenderedComponent = this.renderedComponent;
    var prevRenderedElement = prevRenderedComponent.currentElement;

    // 更新*自己的*元素
    this.currentElement = nextElement;
    var type = nextElement.type;
    var nextProps = nextElement.props;

    // 找下一次 render() 输出的是什么
    var nextRenderedElement;
    if (isClass(type)) {
      // 类组件
      // 如果有生命周期方法就调用
      if (publicInstance.componentWillUpdate) {
        publicInstance.componentWillUpdate(nextProps);
      }
      // 更新 props 
      publicInstance.props = nextProps;
      // 重新渲染
      nextRenderedElement = publicInstance.render();
    } else if (typeof type === 'function') {
      // 函数组件
      nextRenderedElement = type(nextProps);
    }

    // ...
```

接下去就要看下渲染元素的`type`, 如果上次的`type`和这次相同, 则就地更新, 否则需要先卸载再更新.

```js
// 如果渲染元素的 type 没有更改，
// 重用已经存在组件实例并退出。
if (prevRenderedElement.type === nextRenderedElement.type) {
  prevRenderedComponent.receive(nextRenderedElement);
  return;
}else {
  // 挂载新的组件，并交换其节点。
  // 查找旧节点，因为需要替换它
  var prevNode = prevRenderedComponent.getHostNode();
  // 卸载旧的子组件并挂载新的子组件
  prevRenderedComponent.unmount();
  var nextRenderedComponent = instantiateComponent(nextRenderedElement);
  var nextNode = nextRenderedComponent.mount();
  // 替换子组件的引用
  this.renderedComponent = nextRenderedComponent;
  // 将旧节点替换为新节点
  // 注意：这是 renderer 特定的代码,
  // 理想情况下应位于 CompositeComponent 之外：
  prevNode.parentNode.replaceChild(nextNode, prevNode);
}
```

这里有一种特殊情况, 就是当元素的`key`更改的时候. 也会发生重新挂载.

在这之后, 添加`getHostNode`方法, 用于在更新期间找到平台节点并且替换它.

```js
class CompositeComponent {
  // ...

  getHostNode() {
    // 要求渲染组件提供它。
    // 递归深入任意组合组件。
    return this.renderedComponent.getHostNode();
  }
}

class DOMComponent {
  // ...

  getHostNode() {
    return this.node;
  }  
}
```

#### 更新元素

`DomComponent`的更新逻辑不太一样. 当他们收到以一个元素的时候, 它需要刚更新平台特定的视图. 在DOM环境下, 需要更新DOM的属性.

```js
class DOMComponent {
  // ...

  receive(nextElement) {
    var node = this.node;
    var prevElement = this.currentElement;
    var prevProps = prevElement.props;
    var nextProps = nextElement.props;    
    this.currentElement = nextElement;

    // 删除旧的属性
    Object.keys(prevProps).forEach(propName => {
      if (propName !== 'children' && !nextProps.hasOwnProperty(propName)) {
        node.removeAttribute(propName);
      }
    });
    // 设置新的属性
    Object.keys(nextProps).forEach(propName => {
      if (propName !== 'children') {
        node.setAttribute(propName, nextProps[propName]);
      }
    });

    // ...
```

宿主组件需要更新其子组件, 与组合组件不同的是, 他们是可能包含多个子组件的.

我们需要遍历组件树, 然后根据接受到的type和之前的type进行匹配更新或者替换内部实例. 真正的`reconciler`还会在描述中获取元素的key, 并且存储和跟踪移动,插入,删除操作. 

#### 顶层更新

修改顶层的`mountTree`函数就能实现了:

```js
function mountTree(element, containerNode) {
  // 检查现有的树
  if (containerNode.firstChild) {
    var prevNode = containerNode.firstChild;
    var prevRootComponent = prevNode._internalInstance;
    var prevElement = prevRootComponent.currentElement;

    // 如果可以，重用现有的根组件
    if (prevElement.type === element.type) {
      prevRootComponent.receive(element);
      return;
    }

    // 否则，卸载现有树
    unmountTree(containerNode);
  }

  // ...

}
```


