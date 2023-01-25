# Lit-Element快速入门


Lit Elemnet 是一个简单的web-component工具库

## 模板语法

### 基础使用

```js
import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  render() {
    return html`<p>template content</p>`;
  }
}
```

### 动态属性

- 文本: `<p>${...}</p>`
- 基础属性: `id="${...}"`
- 逻辑属性: `?disabled="${...}"`
- 元素属性: `.value="${...}"`
- 事件处理: `@click="${...}"`

例子:

```js
import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() {
    return {
      prop1: String,
      prop2: String,
      prop3: Boolean,
      prop4: String
    };
  }
  constructor() {
    super();
    this.prop1 = 'text binding';
    this.prop2 = 'mydiv';
    this.prop3 = true;
    this.prop4 = 'pie';
  }
  render() {
    return html`
      <!-- 文本 -->
      <div>${this.prop1}</div>

      <!-- 基础属性 -->
      <div id="${this.prop2}">attribute binding</div>

      <!-- 逻辑属性 -->
      <div>
        boolean attribute binding
        <input type="text" ?disabled="${this.prop3}"/>
      </div>

      <!-- 元素属性 -->
      <div>
        property binding
        <input type="text" .value="${this.prop4}"/>
      </div>

      <!-- 事件 -->
      <div>event handler binding
        <button @click="${this.clickHandler}">click</button>
      </div>
    `;
  }
  clickHandler(e) {
    console.log(e.target);
  }
}

customElements.define('my-element', MyElement);
```

### 模板逻辑

类似react:

#### 循环

```js
html`<ul>
  ${this.myArray.map(i => html`<li>${i}</li>`)}
</ul>`;
```

#### 三目运算

```js
html`
  ${this.myBool?
    html`<p>Render some HTML if myBool is true</p>`:
    html`<p>Render some other HTML if myBool is false</p>`}
`;
```

### slot

#### 基本slot

```js
render(){
  return html`
    <div>
      <slot></slot>
    </div>
  `;
}
```

#### 命名slot

```js
render(){
  return html`
    <div>
      <slot name="one"></slot>
    </div>
  `;
}
```

### 内建指令(TODO)

- https://lit-html.polymer-project.org/guide/template-reference#built-in-directives

## 样式

### 基础使用

```js
import { LitElement, css, html } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      div { color: red; }
    `;
  }
  render() { 
    return html`
      <div>I'm styled!</div> 
    `;
  }
}
```

### 多组样式

```js
static get styles() {
  return [ css`...`, css`...`];
}
```

### 样式逻辑

```js
const mainColor = css`red`;
// ...
static get styles() {
    return css`
      div { color: ${mainColor} }
    `;
}
```

或者:

```js
static get styles() {
    const mainColor = 'red';

    return css`
      div { color: ${unsafeCSS(mainColor)} }
    `;
}
```

### 继承

```js
class MyElement extends SuperElement {
  static get styles() {
    return [
      super.styles,
      css`...`
    ];
  }
}
```

### 共享

被共享的样式: 

```js
import { css } from 'lit-element';

export const buttonStyles = css`
  .blue-button {
    color: white;
    background-color: blue;
  }
  .blue-button:disabled {
    background-color: grey;
  }`;

```

调用共享的样式:

```js
import { buttonStyles } from './button-styles.js';

class MyElement extends LitElement {
  static get styles() {
    return [
      buttonStyles,
      css`
        :host { display: block;
          border: 1px solid black;
        }`
    ]
  }
  ...
}
```

### CSS in Shadow Dom

CSS 天然样式隔离, 只能影响改组件中的样式, 例如下面的代码: 

```js
class MyElement extends LitElement {
  static get styles() {
    // Write styles in standard CSS
    return css`
      * { color: red; }
      p { font-family: sans-serif; }
      .myclass { margin: 100px; }
      #main { padding: 30px; }
      h1 { font-size: 4em; }
    `;
  }
  render() {
    return html`
      <p>Hello World</p>
      <p class="myclass">Hello World</p>
      <p id="main">Hello World</p>
      <h1>Hello World</h1>
    `;
  }
}
```

### 宿主样式

- `:host`: 指定到宿主元素
- `:host(selector)`: 指定选择器的宿主元素

```js
static get styles() {
  return css`
    /* Selects the host element */
    :host { 
      display: block; 
    }

    /* Selects the host element if it is hidden */
    :host([hidden]) { 
      display: none; 
    }
  `;
}
```

### slot 样式

- `::slotted()`: 指定到slot元素的样式
- `::slotted(*)`: 匹配所有的slot元素
- `::slotted(p)`: 匹配slot中的所有p元素
- `p ::slotted(*)`: 匹配p标签中的所有slot元素

> 注意: `::slotted()`样式应该被看做可以覆盖的默认样式。

```js
import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      ::slotted(*) { font-family: Roboto; }
      ::slotted(p) { color: blue; }
      div ::slotted(*) { color: red; }
    `;
  }
  render() {
    return html`
      <slot></slot>
      <div><slot name="hi"></slot></div>
    `;
  }
}
```

### 使用css变量

```js
static get styles() {
  return css`
    :host { color: var(--themeColor); }
  `;
} 
```

```js
<style>
  html { 
    --themeColor: #123456;
  }
</style>
<my-element></my-element>
```

### `<style>` 标签

#### 内部`style`

不推荐: 会产生性能限制以及可能产生内部变量不会更新的问题

```js
render() {
  return html`
    <style>
      /* updated per instance */
    </style>
    <div>template content</div>
  `;
}
```

#### 外部`style`

- `ShadyCSS polyfill`不支持外部样式表
- 外部样式在加载时可能导致内容未显示样式（`FOUC`）闪烁
- 路径是相对于主文档的, 需要处理路径问题

```js
// css
:host {
  display: block;
  color: blue;
}
div { 
  background: aliceblue; 
}
button { 
  width: 200px; 
}

// js
render() {
    return html`
      <link rel="stylesheet" href="./app-styles.css">
      <button>a button</button>
      <div>a div</div>
    `;
}
```

### classMap & styleMap

```js
import { LitElement, html, css } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map';

class MyElement extends LitElement {
  static get properties() {
    return {
      classes: { type: Object },
      styles: { type: Object }
    }
  }
  static get styles() {
    return css`
      .mydiv { background-color: blue; }
      .someclass { border: 1px solid red; }
    `
  }
  constructor() {
    super();
    this.classes = { mydiv: true, someclass: true };
    this.styles = { color: 'green', fontFamily: 'Roboto' };
  }
  render() {
    return html`
      <div class=${classMap(this.classes)} style=${styleMap(this.styles)}>
        Some content
      </div>
    `;
  }
}
```

## 属性

### 基础使用

```js
static get properties() { 
  return { 
    greeting: {type: String},
    data: {attribute: false},
    items: {}
  };
}
```

### 属性选项

- `attribute`: 是否为`attribute`
- `converter`: 自定义转换器
- `hadChanged`: 提供一个函数在属性变化的时候触发
- `noAccessor`: 不允许被覆盖
- `reflect`: 反射
- `type`: 属性的类型


### 两种声明方式

```js
// 方式1
static get properties() { 
  return { 
    prop1: { type: String },
    prop2: { type: Number },
    prop3: { type: Boolean }
  };
}

// 方式2
@property({type : String})  prop1 = 'Hello World';
```

### 初始化

#### JS下

```js
static get properties() { return { /* Property declarations */ }; } 

constructor() {
  // Always call super() first
  super();

  // Initialize properties 
  this.prop1 = 'Hello World';
}
```

> 组件实现类的所有构造方法中都必须手动调用父类的构造方法 super()

#### TS下

```js
@property({ type : String }) prop1 = 'Hello World';
```

#### 标签中

```html
<my-element 
  mystring="hello world"
  mynumber="5"
  mybool
  myobj='{"stuff":"hi"}'
  myarray='[1,2,3,4]'></my-element>
```

### 属性配置

#### properties/arrtibutes

- properties: 可以是任何类型
- attributes: 始终是字符串

- `oberve`: attribute => property
- `reflect`: property => arrtibute

#### type

```js
// Use LitElement's default converter 
prop1: { type: String },
prop2: { type: Number },
prop3: { type: Boolean },
prop4: { type: Array },
prop5: { type: Object }
```

#### converter 

自定义转换, 在`attribute`转换到`property`的过程中, 存在默认的转换方式, 也可以自定义:

```js
prop1: { 
  converter: { 
    fromAttribute: (value, type) => { 
      // `value` is a string
      // Convert it to a value of type `type` and return it
    },
    toAttribute: (value, type) => { 
      // `value` is of type `type` 
      // Convert it to a string and return it
    }
  }
}
```

或者提供一个函数:

```js
myProp: { 
  converter: (value, type) => { 
    // `value` is a string
    // Convert it to a value of type `type` and return it
  }
} 
```

### 监听属性和非监听属性

```js
// myprop
myProp: { type: Number }

// my-prop
myProp: { attribute: 'my-prop' }

// 非监听
myProp: { attribute: false }
```

监听属性一旦发生变化, 就会调用`attributeChangedCallback`. 某个属性触发次回调, 就会调用属性的`fromAttribute`

### 反射

当`prop`改变是, 其值会反射到对应的`observer attribute`中

```js
myProp: { reflect: true }
```

### 自定义访问器

```js
static get properties() { return { myProp: { type: String } }; }

set myProp(value) {
  const oldValue = this.myProp;
  // Implement setter logic here... 
  this.requestUpdate('myProp', oldValue);
} 
get myProp() { ... }

...

// Later, set the property
this.myProp = 'hi'; // Invokes your accessor
```

#### 装饰器写法

```js
_myProp: string = '';

  @property({ type: String })
  public get myProp(): string {
    return this._myProp;
  }
  public set myProp(value: string) {
    const oldValue = this.myProp;
    this._myProp = value;
    this.requestUpdate('myProp', oldValue);
  }
```

### noAccessor

防止LitElement生成覆盖父类的已定义访问器的属性访问器, 可以将属性声明为`true`

```js
// 父类中
static get properties() {
    return { prop: { type: Number } };
}

// 子类中
static get properties() { 
    return { prop: { reflectToAttribute: true, noAccessor: true } };
}
```

### hadChanged

要为属性定制hasChanged，可以指定该选项来自定义属性更改的比较规则

```js
myProp: { hasChanged(newVal, oldVal) {
  // compare newVal and oldVal
  // return `true` if an update should proceed
}}
```

## 事件

### 事件绑定位置

#### 模板中绑定

```js
render() {
  return html`<button @click="${this.handleClick}">`;
}
```

#### 构造函数中绑定

可以添加监听将组件添加到DOM之前可能发生的事件.

```js
constructor() {
  super();
  this.addEventListener('DOMContentLoaded', this.handleLoaded);
}
```

#### firstUpdated

首次更新和渲染组建后, 会触发`firstUpdated`.

```js
firstUpdated(changedProperties) {
  this.addEventListener('click', this.handleClick);
}
```

#### connectedCallback

当将自定义元素附加到文档链接的元素中, `connectedCallback`会被处罚. 

如果想要吧事件监听到自身或者子级以外的任何事物(window, document)等, 可以在这个钩子中添加监听, 并且在`disconnectedCallback`删除. 

```js
connectedCallback() {
  super.connectedCallback();
  document.addEventListener('readystatechange', this.handleChange);
}
disconnectedCallback() {
  document.removeEventListener('readystatechange', this.handleChange);
  super.disconnectedCallback();
}
```

### 事件中的this

this指向组件本身:

```js
class MyElement extends LitElement {
  render() {
    return html`<button @click="${this.handleClick}">click</button>`;
  }
  handleClick(e) {
    console.log(this.prop);
  }
}
```

### 事件触发

#### 自定义事件

```js
let event = new CustomEvent('my-event', {
      detail: {
        message: 'Something important happened'
      }
    });
this.dispatchEvent(event);
```

#### 标准事件

```js
let click = new Event('click');
this.dispatchEvent(click);
```

#### 处理事件

绑定事件: 

```html
<my-element @my-event="${(e) => { console.log(e.detail.message) }}"></my-element>
```

监听事件:

```js
const myElement = document.querySelector('my-element');
myElement.addEventListener('my-event', (e) => {console.log(e)});
```

### 冒泡重定位

`shadow-dom`中的冒泡会被重新定位, 对组件外部来说, 这些事件看起来都来自于组件本身. 

```js
<my-element onClick="(e) => console.log(e.target)"></my-element>
```

```js
render() {
  return html`
    <button id="mybutton" @click="${(e) => console.log(e.target)}">
      click me
    </button>`;
}
```

可以使用`composedPath`寻找起源:

```js
handleMyEvent(event) {
  console.log('Origin: ', event.composedPath()[0]);
}
```

### 事件穿透

默认的, 组件内部的事件冒泡到`shadow-root`就停止了, 需要穿透的话需要将`composed`和`bubbles`置为`true`:

```js
firstUpdated(changedProperties) {
  let myEvent = new CustomEvent('my-event', { 
    detail: { message: 'my-event happened.' },
    bubbles: true, 
    composed: true });
  this.dispatchEvent(myEvent);
}
```

## 生命周期

### 组件更新流程

1. 属性更改
2. 检查是否需要更新
3. 执行更新
    - properties/attribute
    - render
4. promise.resolve()

### 默认的组件钩子

LitElement 继承默认的生命周期.

- `connectedCallback`: 组件被添加到`document`
- `disconnectedCallback`: 组件被删除
- `adoptedCallback`: 组件被移动到一个新的`document`
- `attributeChangedCallback`: 组件属性被修改

> adoptedCallback 没有 polyfilled

所有的生命周期回调中都需要调用其父类的回调:

```js
connectedCallback() {
  super.connectedCallback()

  console.log('connected')
}
```

### 异步

```js
// `async` makes the function return a Promise & lets you use `await`
async myFunc(data) {
  // Set a property, triggering an update
  this.myProp = data;

  // Wait for the updateComplete promise to resolve
  await this.updateComplete;
  // ...do stuff...
  return 'done';
}
```

```js
let result = await myFunc('stuff');
// `result` is resolved! You can do something with it
```

### 生命周期函数

按照调用顺序: 

- `someProperty.hasChanged`: 调用属性更改
- `requestUpdate`: 手动更新
- `performUpdate`: performUpdate在执行下一次浏览器事件循环之前被调用
- `shouldUpdate`: 控制是否应继续进行更新, 默认情况下，此方法始终返回true。
- `update`: 将property值反射为attributes属性，并通过lit-html调用render来渲染DOM
- `render`: 使用lit-html渲染元素模板
- `firstUpdate`: 在元素的DOM第一次更新之后，即在调用更新之前立即调用
- `update`: 在元素的DOM已更新和呈现时调用
- `updateComplete`: 完成更新

### 手动更新

```js
//手动调用更新
this.requestUpdate();

// 从一个自定义属性的setter函数中调用
this.requestUpdate(propertyName, oldValue);
```

## 参考文档与链接

- https://lit-element.polymer-project.org/guide/templates
- https://lit-element.polymer-project.org/api/modules/_lit_element_.html
