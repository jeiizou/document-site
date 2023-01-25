# Svelte快速入门


特别说明: 本文根据`Svelte`官方整理而来, 精简了内容, 方便速查

看就是了, 别问我为什么, 问就是我也不知道. (滑稽)

## 快速上手

```sh
# 创建项目, my-svelte-project为你的项目文件夹名称
npx degit sveltejs/template my-svelte-project
# or download and extract 
cd my-svelte-project

# 安装依赖
npm install 
# 运行开发环境
npm run dev
```

## API速览

## 基础使用

### 变量声明

```html
<script>
	let name = 'world';
</script>

<h1>Hello world!</h1>
```

### 动态属性和简写

```html
<script>
	let src = 'tutorial/image.gif';
</script>

<img {src}>
```

### 样式编写

```html
<style>
	p {
		color: purple;
		font-family: 'Comic Sans MS', cursive;
		font-size: 2em;
	}
</style>

<p>This is a paragraph.</p>
```

### 组件加载

```html
<script>
	import Nested from './Nested.svelte';
</script>

<p>This is a paragraph.</p>
<Nested/>
```

### HTML原生渲染

```html
<script>
	let string = `this string contains some <strong>HTML!!!</strong>`;
</script>

<p>{@html string}</p>
```

### 构建APP

- Rollup: [rollup-plugin-svelte](https://github.com/sveltejs/rollup-plugin-svelte)
- Webpack: [svelter-loader](https://github.com/sveltejs/svelte-loader)

加载App

```js
import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		// we'll learn about props later
		answer: 42
	}
});
```

## 响应式API

### 事件绑定: `on:`

```html
<script>
	let count = 0;

	function handleClick() {
		// event handler code goes here
	}
</script>

<button on:click={handleClick}>
	Clicked {count} {count === 1 ? 'time' : 'times'}
</button>
```

### 响应式声明(declarations)

```js
let count = 0;
$: doubled = count * 2;
```

`$:`可以声明一个依赖于响应识别的变量, 类似于`vue`的`computed`和`watch`的集合版本.

`$:`可以声明变量, 也可以声明一段代码块或者一个if语句:

```js
$: {
	console.log(`the count is ${count}`);
	alert(`I SAID THE COUNT IS ${count}`);
}

$: if (count >= 10) {
	alert(`count is dangerously high!`);
	count = 9;
}
```

### 监听不到的变化

1. 数组变化无法监听

在对数组进行操作的时候, 如果使用了数组方法, 类似`push`,`splice`这样的方法, 就无法监听到响应式变化, 必须进行如下处理:

```js
function addNumber() {
	numbers.push(numbers.length + 1);
	numbers = numbers;
}

// 或者
function addNumber() {
	numbers = [...numbers, numbers.length + 1];
}
```

对于`pop`,`shift`,`unshift`等都可以采用同样的方法. 

对于数组和对象的属性的赋值和对值本身进行赋值是一样的.

```js
function addNumber() {
	numbers[numbers.length] = numbers.length + 1;
}
```

比如这样的写法也是可以的. 

一个简单的经验是: 更新变量的名称必须出现在赋值的左侧. 例如:

```js
const foo = obj.foo;
foo.bar = 'baz';
```

这将不会更新`obj.foo.bar`, 除非再加一句:`obj = obj`.

## props

### 单一Porps

声明一个`Props`并且提供一个默认值

```html
// App.svelte
<script>
	import Nested from './Nested.svelte';
</script>

<Nested answer={42}/>

// Nested.svelte
<script>
	export let answer='default value';
</script>

<p>The answer is {answer}</p>
```

### 展开Props

props展开对象:

```html
// svelte
<script>
	import Info from './Info.svelte';

	const pkg = {
		name: 'svelte',
		version: 3,
		speed: 'blazing',
		website: 'https://svelte.dev'
	};
</script>

<Info {...pkg}/>

// Info.svelte
<script>
	export let name;
	export let version;
	export let speed;
	export let website;
</script>

<p>
	The <code>{name}</code> package is {speed} fast.
	Download version {version} from <a href="https://www.npmjs.com/package/{name}">npm</a>
	and <a href={website}>learn more here</a>
</p>
```

## 模板逻辑

### 条件渲染

1. 单纯的if

```html
<script>
	let user = { loggedIn: false };

	function toggle() {
		user.loggedIn = !user.loggedIn;
	}
</script>

{#if user.loggedIn}
	<button on:click={toggle}>
		Log out
	</button>
{/if}

{#if !user.loggedIn}
	<button on:click={toggle}>
		Log in
	</button>
{/if}
```

2. if-else

```html
{#if user.loggedIn}
	<button on:click={toggle}>
		Log out
	</button>
{:else}
	<button on:click={toggle}>
		Log in
	</button>
{/if}
```

3. if-else-if

```html
{#if x > 10}
	<p>{x} is greater than 10</p>
{:else if 5 > x}
	<p>{x} is less than 5</p>
{:else}
	<p>{x} is between 5 and 10</p>
{/if}
```

### 循环渲染

1. each

```html
<ul>
	{#each cats as {name, id}, i}
	<li><a target="_blank" href="https://www.youtube.com/watch?v={id}">
		{i + 1}: {name}
	</a></li>
{/each}
</ul>
```

当然其中的`cats`得是个可遍历对象(iterable)

这里有个需要注意的地方, 默认情况下, 你添加或者删除项目的时候, 都会修改对象的最后一个值, 这可能并不是我们想要的效果.

```html
<script>
	import Thing from './Thing.svelte';

	let things = [
		{ id: 1, color: '#0d0887' },
		{ id: 2, color: '#6a00a8' },
		{ id: 3, color: '#b12a90' },
		{ id: 4, color: '#e16462' },
		{ id: 5, color: '#fca636' }
	];

	function handleClick() {
		things = things.slice(1);
	}
</script>

<button on:click={handleClick}>
	Remove first thing
</button>

{#each things as thing}
	<Thing current={thing.color}/>
{/each}
```

你可以运行这段代码查看实例. 

为了避免这样的问题, 你可以给循环中的实例一个唯一的id, 想是这样:

```html
{#each things as thing (thing.id)}
	<Thing current={thing.color}/>
{/each}
```

这个`(thing.id)`是告诉框架如何去指出哪个实例发生了变化. 你可以使用任何对象作为key, `Svelte`内部使用`Map`. 不过通常字符串和数字更安全. 

### 异步渲染块

这是比较特殊的一种模块渲染逻辑, 可以查看这个实例:

```html
<script>
	let promise = getRandomNumber();

	async function getRandomNumber() {
		const res = await fetch(`tutorial/random-number`);
		const text = await res.text();

		if (res.ok) {
			return text;
		} else {
			throw new Error(text);
		}
	}

	function handleClick() {
		promise = getRandomNumber();
	}
</script>

<button on:click={handleClick}>
	generate random number
</button>

{#await promise}
	<p>...waiting</p>
{:then number}
	<p>The number is {number}</p>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}
```

当`promise`得到返回的时候, 模块渲染的内容也会发生变化

如果你知道你的`promise`不会被`reject`, 那么也可以这样写:

```html
{#await promise then value}
	<p>the value is {value}</p>
{/await}
```

## 事件

简单的事件绑定前面提到了:

```html
<div on:mousemove={handleMousemove}>
	The mouse position is {m.x} x {m.y}
</div>
```

### 内联事件

事件绑定支持内联函数:

```html
<div on:mousemove="{e => m = { x: e.clientX, y: e.clientY }}">
	The mouse position is {m.x} x {m.y}
</div>
```

这里的引号写不写都行. 内联和外置没有什么性能上的区别. 

### 事件修饰符

```html
<script>
	function handleClick() {
		alert('no more alerts')
	}
</script>

<button on:click|once={handleClick}>
	Click me
</button>
```

没什么好说的, 走你:

- preventDefault: 阻止默认事件
- stopPropagation: 停止冒泡
- passive: 改进滚动/触摸事件性能, 框架会在安全的地方自动处理
- capture: 在事件捕获阶段触发事件
- once: 只触发一次
- self: 仅当`event.target`是元素本身才触发事件

所有修饰符可以用过`|`连接起来使用. 

### 事件分发

类似于`vue`的`emit`, `svelte`想要进行事件分发需要借助一个内部的方法:

```html
// Inner.svelte
<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function sayHello() {
		dispatch('message', {
			text: 'Hello!'
		});
	}
</script>

<button on:click={sayHello}>
	Click to say hello
</button>
```

在`Inner.svelte`组件中使用创建一个分发器`dispatch`, 然后再父组件中调用:

```html
<script>
	import Inner from './Inner.svelte';

	function handleMessage(event) {
		alert(event.detail.text);
	}
</script>

<Inner on:message={handleMessage}/>
```

和原生事件不同, 这类事件不会冒泡, 想要监听事件必须在中间组件中进行转发.

```html
// Inner.svelter
<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function sayHello() {
		dispatch('message', {
			text: 'Hello!'
		});
	}
</script>

<button on:click={sayHello}>
	Click to say hello
</button>

// Outer.svelte
<script>
	import Inner from './Inner.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function forward(event) {
		dispatch('message', event.detail);
	}
</script>

<Inner on:message={forward}/>

// App.svelte
<script>
	import Outer from './Outer.svelte';

	function handleMessage(event) {
		alert(event.detail.text);
	}
</script>

<Outer on:message={handleMessage}/>
```

不过这显然太麻烦了, 框架提供了这样的写法:

```html
<script>
	import Inner from './Inner.svelte';
</script>

<Inner on:message/>
```

`on:message`啥都不跟就意味着进行事件的转发. 

这样的事件转发也适用于原生事件

```html
<button on:click>
	Click me
</button>
```

## 双向数据绑定: bind

### 简单绑定

前面的代码中, 数据发生变化, 会导致dom的更新. 但是Dom中的数据变化并不会反向修改数据. 也就是说, 这是一种单向数据绑定. 框架提供了类似于`vue`的双向绑定写法:

```html
<script>
	let name = 'world';
</script>

<input bind:value={name}>

<h1>Hello {name}!</h1>
```

当然你也可以通过`on:click`手动进行更新. 说其类似于`vue`的`bind`是不准确的, 应该类似于`v-model`.

### range

当然, 在DOM中, 所有的数据都是字符串, 框架层面帮助你处理了这个问题

```html
<script>
	let a = 1;
	let b = 2;
</script>

<label>
	<input type=number bind:value={a} min=0 max=10>
	<input type=range bind:value={a} min=0 max=10>
</label>

<label>
 	<input type=number bind:value={b} min=0 max=10>
 	<input type=range bind:value={b} min=0 max=10>
</label>

<p>{a} + {b} = {a + b}</p>
```

### checkbox

对于`checkbox`, 可以把数据绑定到`checked`上:

```html
<input type=checkbox bind:checked={yes}>
```

### bind:group

如果你有一组`input`都有相同的值, 可以使用`bind:group`来把他们绑定到一个值上.

```html
<script>
	let scoops = 1;
	let flavours = ['Mint choc chip'];

	function join(flavours) {
		if (flavours.length === 1) return flavours[0];
		return `${flavours.slice(0, -1).join(', ')} and ${flavours[flavours.length - 1]}`;
	}
	
	let menu = [
	'Cookies and cream',
	'Mint choc chip',
	'Raspberry ripple'
];
</script>

<h2>Size</h2>

<label>
	<input type=radio bind:group={scoops} value={1}>
	One scoop
</label>

<label>
	<input type=radio bind:group={scoops} value={2}>
	Two scoops
</label>

<label>
	<input type=radio bind:group={scoops} value={3}>
	Three scoops
</label>

<h2>Flavours</h2>

{#each menu as flavour}
	<label>
		<input type=checkbox bind:group={flavours} value={flavour}>
		{flavour}
	</label>
{/each}

{#if flavours.length === 0}
	<p>Please select at least one flavour</p>
{:else if flavours.length > scoops}
	<p>Can't order more flavours than scoops!</p>
{:else}
	<p>
		You ordered {scoops} {scoops === 1 ? 'scoop' : 'scoops'}
		of {join(flavours)}
	</p>
{/if}
```

### teatarea

`textarea`其实是类似的

```html
<script>
	import marked from 'marked';
	let value = `Some words are *italic*, some are **bold**`;
</script>

<style>
	textarea { width: 100%; height: 200px; }
</style>

<textarea bind:value={value}></textarea>

{@html marked(value)}
```

不过其中"={value}"也可以省略

```html
<textarea bind:value></textarea>
```

这对于所有的`binding`都有效.

### select

在`select`上, 也可以使用`bind:value`:

```html
<script>
	let questions = [
		{ id: 1, text: `Where did you go to school?` },
		{ id: 2, text: `What is your mother's name?` },
		{ id: 3, text: `What is another personal fact that an attacker could easily find with Google?` }
	];

	let selected;
</script>

<style>
	input { display: block; width: 500px; max-width: 100%; }
</style>

<select bind:value={selected} on:change="{() => answer = ''}">
	{#each questions as question}
		<option value={question}>
			{question.text}
		</option>
	{/each}
</select>
```

`option`中的值可以是一个`obj`

如果你给`select`添加`multiple`属性, 就会变成一个多选框:

```html
<h2>Flavours</h2>

<select multiple bind:value={flavours}>
	{#each menu as flavour}
		<option value={flavour}>
			{flavour}
		</option>
	{/each}
</select>
```

### contenteditable div

支持可编辑div的绑定:

```html
<script>
	let html = '<p>Write some text!</p>';
</script>

<div
	contenteditable="true"
	bind:innerHTML={html}
></div>

<pre>{html}</pre>

```

### 数组中的bind

这里有一个todo的例子:

```html
<script>
	let todos = [
		{ done: false, text: 'finish Svelte tutorial' },
		{ done: false, text: 'build an app' },
		{ done: false, text: 'world domination' }
	];

	function add() {
		todos = todos.concat({ done: false, text: '' });
	}

	function clear() {
		todos = todos.filter(t => !t.done);
	}

	$: remaining = todos.filter(t => !t.done).length;
</script>

<style>
	.done {
		opacity: 0.4;
	}
</style>

<h1>Todos</h1>

{#each todos as todo}
	<div class:done={todo.done}>
		<input
	type=checkbox
	bind:checked={todo.done}
>

<input
	placeholder="What needs to be done?"
	bind:value={todo.text}
>
	</div>
{/each}

<p>{remaining} remaining</p>

<button on:click={add}>
	Add new
</button>

<button on:click={clear}>
	Clear completed
</button>
```

### 特殊属性绑定

1. 每个块级元素都可以绑定四个值, 分别是:
   1. `clientWidth`
   2. `clientHieght`
   3. `offsetWidth`
   4. `offsetHeight`

```html
<div bind:clientWidth={w} bind:clientHeight={h}>
	<span style="font-size: {size}px">{text}</span>
</div>
```

2. `this`绑定, 可获取Dom元素本身, 类似于`ref`

```html
<canvas
	bind:this={canvas}
	width={32}
	height={32}
></canvas>
```

注意, 这里的`canvas`变量一开始是`undefined`, 直到组件被挂上去. 这里具体的可以参考生命周期. 

### 自定义组件的Bind

`bind:`也可以绑定到自定义组件的`prop`上, 其语法也是比较简单的:

```html
<Keypad bind:value={pin} on:submit={handleSubmit}/>
```

## 生命周期

### onMount

组件被挂载之后会触发的钩子函数

```html
<script>
	import { onMount } from 'svelte';

	let photos = [];

	onMount(async () => {
		const res = await fetch(`https://jsonplaceholder.typicode.com/photos?_limit=20`);
		photos = await res.json();
	});
</script>
```

### OnDestroy

当自己按被销毁的时候会调用的钩子

```html
<script>
	import { onDestroy } from 'svelte';

	let seconds = 0;
	const interval = setInterval(() => seconds += 1, 1000);

	onDestroy(() => clearInterval(interval));
</script>
```

### beforeUpdate & afterUpdate 

更新界面前调用的钩子和更新界面后调用的钩子

```js
import Eliza from 'elizabot';
import { beforeUpdate, afterUpdate } from 'svelte';

let div;
let autoscroll;

beforeUpdate(() => {
	autoscroll = div && (div.offsetHeight + div.scrollTop) > (div.scrollHeight - 20);
});

afterUpdate(() => {
	if (autoscroll) div.scrollTo(0, div.scrollHeight);
});
```

### tick 

tick函数不同于其他的生命周期, 可以随时调用, 返回一个`promise`, 会在下一次界面更新的时候被调用, 类似于`vue.nextTick()`

## Store

类似于`Vuex`或者`Redux`的全局数据状态解决方案.

先看一个例子:

```js
import { writable } from 'svelte/store';

export const count = writable(0);
```

创建一个可写的数据对象, 通过`set`,`update`等方法更新数据:

```html
<script>
	import { count } from './stores.js';

	function reset() {
		count.set(0);
	}
</script>

<button on:click={reset}>
	reset
</button>
```

```html
<script>
	import { count } from './stores.js';

	function increment() {
		count.update(n => n + 1);
	}
</script>

<button on:click={increment}>
	+
</button>
```

然后在需要的地方订阅该数据:

```js
import { onDestroy } from 'svelte';
import { count } from './stores.js';
import Incrementer from './Incrementer.svelte';
import Decrementer from './Decrementer.svelte';
import Resetter from './Resetter.svelte';

let count_value;

const unsubscribe = count.subscribe(value => {
	count_value = value;
});

onDestroy(unsubscribe);
```

记得在组件销毁的时候关闭订阅

### 自动订阅

显然如果想示例这样写就太麻烦了, 所以框架可以帮助你做一些自动订阅的工作:

```html
<script>
	import { count } from './stores.js';
	import Incrementer from './Incrementer.svelte';
	import Decrementer from './Decrementer.svelte';
	import Resetter from './Resetter.svelte';
</script>

<h1>The count is {$count}</h1>
```

这里要注意, 要使用`$`来调用该数据. 在JS中也可以进行这样的调用. 所以在我们声明变量的时候需要注意不要使用`$`开头的变量. 

### 只读Store

不是所有的变量都应该可写的, 比如鼠标位置, 地理坐标, 这些数据外部手动去写是没有意义的. 

比如一个表示当前时间的`store`值:

```js
import { readable } from 'svelte/store';

export const time = readable(null, function start(set) {
	// implementation goes here
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});
```

### Derived Store

可以创建基于一个Store的Store:

```js
import { readable, derived } from 'svelte/store';

export const time = readable(new Date(), function start(set) {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

const start = new Date();

export const elapsed = derived(
	time,
	$time => Math.round(($time - start) / 1000)
);
```

### 自定义 Store

```js
import { writable } from 'svelte/store';

function createCount() {
	const { subscribe, set, update } = writable(0);

	return {
		subscribe,
		increment: () => {},
		decrement: () => {},
		reset: () => {}
	};
}

export const count = createCount();
```

可以把Store这个过程封装起来, 进行逻辑的组合和复用.

### Store 和 bind

如果一个`store`是可写的, 那么它可以和`bind`一起使用:

定义store:

```js
import { writable, derived } from 'svelte/store';

export const name = writable('world');

export const greeting = derived(
	name,
	$name => `Hello ${$name}!`
);
```

调用store:

```html
<script>
	import { name, greeting } from './stores.js';
</script>

<h1>{$greeting}</h1>

<input bind:value={$name}>

<button on:click="{() => $name += '!'}">
	Add exclamation mark!
</button>
```

## 动效: Motion

### Tween: 补间动画

用来给两个值中间插值, 形成平滑的过渡:

```html
<script>
import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	const progress = tweened(0, {
		duration: 400,
		easing: cubicOut
	});

	// 直接这样写也是一样的, 不过动画为线性动画
	// const progress = tweened(0);
</script>

<style>
	progress {
		display: block;
		width: 100%;
	}
</style>

<progress value={$progress}></progress>

<button on:click="{() => progress.set(0)}">
	0%
</button>

<button on:click="{() => progress.set(0.25)}">
	25%
</button>

<button on:click="{() => progress.set(0.5)}">
	50%
</button>

<button on:click="{() => progress.set(0.75)}">
	75%
</button>

<button on:click="{() => progress.set(1)}">
	100%
</button>
```

`svelte/easing`模块包含了一个[Penner缓动方程](https://web.archive.org/web/20190805215728/http://robertpenner.com/easing/), 或者你可以自己提供`p(t)`方程. 

`tweened`函数的所有选项如下:

- `delay`: 延迟时间
- `duration`: 持续时间
- `easing`: `p(t)`方程
- `interpolate`: 自定义插值方法, 默认可以对数字, 时间, 日期等进行插值, 如果需要对颜色, 字符串或者矩阵之类的数据, 需要自定义插值方法. 

我们可以通过`progress.set`和`progress.update`方法来更新数据.

### Spring

`Spring`比较适合经常变化的值.

```html
<script>
	import { spring } from 'svelte/motion';

	let coords = spring({ x: 50, y: 50 });
	let size = spring(10);
</script>

<style>
	svg { width: 100%; height: 100%; margin: -8px; }
	circle { fill: #ff3e00 }
</style>

<div style="position: absolute; right: 1em;">
	<label>
		<h3>stiffness ({coords.stiffness})</h3>
		<input bind:value={coords.stiffness} type="range" min="0" max="1" step="0.01">
	</label>

	<label>
		<h3>damping ({coords.damping})</h3>
		<input bind:value={coords.damping} type="range" min="0" max="1" step="0.01">
	</label>
</div>

<svg
	on:mousemove="{e => coords.set({ x: e.clientX, y: e.clientY })}"
	on:mousedown="{() => size.set(30)}"
	on:mouseup="{() => size.set(10)}"
>
	<circle cx={$coords.x} cy={$coords.y} r={$size}/>
</svg>
```

这个例子中, 一个`store`表示圆点的坐标, 另一个表示圆点的大小, 然后把它们装换为`spring`.

其中的`stiffness`表示的是刚度, `damping`表示的是阻尼度. 你可以使用弹簧去理解这两个值的意思. 

## 动效: Transitions

组件变化时候的动画效果, 类似`vue`的`transition`. 使用方法如下:

```html
<script>
	import { fade } from 'svelte/transition';
	let visible = true;
</script>

<label>
	<input type="checkbox" bind:checked={visible}>
	visible
</label>

{#if visible}
	<p transition:fade>
		Fades in and out
	</p>
{/if}
```

### fly

`fly`意味着飞入, 可以传入一些参数进行控制, 下面是一个例子:

```html
<script>
	import { fly } from 'svelte/transition';
	let visible = true;
</script>

<label>
	<input type="checkbox" bind:checked={visible}>
	visible
</label>

{#if visible}
	<p transition:fly="{{ y: 200, duration: 2000 }}">
		Flies in and out
	</p>
{/if}
```

### In And Out

对于进入和退出使用不同的动效:

```html
<p in:fly="{{ y: 200, duration: 2000 }}" out:fade>
	Flies in, fades out
</p>
```

### 自定义CSS变换

`svelte/transition`模块有一些内置的过渡, 不过也可以自己创建过渡效果:

```html
<script>
	import { fade } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	let visible = true;

	function spin(node, { duration }) {
		return {
			duration,
			css: t => {
				const eased = elasticOut(t);

				return `
					transform: scale(${eased}) rotate(${eased * 1080}deg);
					color: hsl(
						${~~(t * 360)},
						${Math.min(100, 1000 - 1000 * t)}%,
						${Math.min(50, 500 - 500 * t)}%
					);`
			}
		};
	}
</script>

<style>
	.centered {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%,-50%);
	}

	span {
		position: absolute;
		transform: translate(-50%,-50%);
		font-size: 4em;
	}
</style>

<label>
	<input type="checkbox" bind:checked={visible}>
	visible
</label>

{#if visible}
	<div class="centered" in:spin="{{duration: 8000}}" out:fade>
		<span>transitions!</span>
	</div>
{/if}
```

返回的对象可以提供这样一些属性:

- delay: 延迟时间
- duratoin: 持续时间
- easing: 插值函数
- css: css动画方法
- tick: 对节点有影响的功能

大多数时候, 应该返回`css`而不是`tick`. 以免造成混乱. 

### 自定义JS变换

虽然大部分时候我们最好使用CSS动效, 但是后时候CSS动效确实无法满足需求, 比如打字机效果. 这个时候就只能使用`tick`来进行JS动效: 

```html
<script>
	let visible = false;

	function typewriter(node, { speed = 50 }) {
	const valid = (
		node.childNodes.length === 1 &&
		node.childNodes[0].nodeType === 3
	);

	if (!valid) {
		throw new Error(`This transition only works on elements with a single text node child`);
	}

	const text = node.textContent;
	const duration = text.length * speed;

	return {
		duration,
		tick: t => {
			const i = ~~(text.length * t);
			node.textContent = text.slice(0, i);
		}
	};
}
</script>

<label>
	<input type="checkbox" bind:checked={visible}>
	visible
</label>

{#if visible}
	<p in:typewriter>
		The quick brown fox jumps over the lazy dog
	</p>
{/if}
```

### Transition event

Transition提供了几个钩子来执行一些逻辑事件:

```html
<p
	transition:fly="{{ y: 200, duration: 2000 }}"
	on:introstart="{() => status = 'intro started'}"
	on:outrostart="{() => status = 'outro started'}"
	on:introend="{() => status = 'intro ended'}"
	on:outroend="{() => status = 'outro ended'}"
>
	Flies in and out
</p>
```

### Local Trsnsition

一般来说, 当添加或者销毁任何容器的时候, transition会在元素上也起作用. 可以用过添加`local`取消这种作用:

```html
<script>
	import { slide } from 'svelte/transition';

	let showItems = true;
	let i = 5;
	let items = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
</script>

<style>
	div {
		padding: 0.5em 0;
		border-top: 1px solid #eee;
	}
</style>

<label>
	<input type="checkbox" bind:checked={showItems}>
	show list
</label>

<label>
	<input type="range" bind:value={i} max=10>

</label>

{#if showItems}
	{#each items.slice(0, i) as item}
		<div transition:slide|local>
			{item}
		</div>
	{/each}
{/if}
```

### Deferred Transition

`transition`可以延迟动作, 来配合不同组件之间的变化.

```html
<script>
	import { quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	const [send, receive] = crossfade({
		duration: d => Math.sqrt(d * 200),

		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});

	let uid = 1;

	let todos = [
		{ id: uid++, done: false, description: 'write some docs' },
		{ id: uid++, done: false, description: 'start writing blog post' },
		{ id: uid++, done: true,  description: 'buy some milk' },
		{ id: uid++, done: false, description: 'mow the lawn' },
		{ id: uid++, done: false, description: 'feed the turtle' },
		{ id: uid++, done: false, description: 'fix some bugs' },
	];

	function add(input) {
		const todo = {
			id: uid++,
			done: false,
			description: input.value
		};

		todos = [todo, ...todos];
		input.value = '';
	}

	function remove(todo) {
		todos = todos.filter(t => t !== todo);
	}

	function mark(todo, done) {
		todo.done = done;
		remove(todo);
		todos = todos.concat(todo);
	}
</script>

<div class='board'>
	<input
		placeholder="what needs to be done?"
		on:keydown={e => e.which === 13 && add(e.target)}
	>

	<div class='left'>
		<h2>todo</h2>
		{#each todos.filter(t => !t.done) as todo (todo.id)}
			<label in:receive="{{key: todo.id}}"
	out:send="{{key: todo.id}}">
				<input type=checkbox on:change={() => mark(todo, true)}>
				{todo.description}
				<button on:click="{() => remove(todo)}">remove</button>
			</label>
		{/each}
	</div>

	<div class='right'>
		<h2>done</h2>
		{#each todos.filter(t => t.done) as todo (todo.id)}
			<label class="done" in:receive="{{key: todo.id}}"
	out:send="{{key: todo.id}}">
				<input type=checkbox checked on:change={() => mark(todo, false)}>
				{todo.description}
				<button on:click="{() => remove(todo)}">remove</button>
			</label>
		{/each}
	</div>
</div>

<style>
	.board {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-gap: 1em;
		max-width: 36em;
		margin: 0 auto;
	}

	.board > input {
		font-size: 1.4em;
		grid-column: 1/3;
	}

	h2 {
		font-size: 2em;
		font-weight: 200;
		user-select: none;
		margin: 0 0 0.5em 0;
	}

	label {
		position: relative;
		line-height: 1.2;
		padding: 0.5em 2.5em 0.5em 2em;
		margin: 0 0 0.5em 0;
		border-radius: 2px;
		user-select: none;
		border: 1px solid hsl(240, 8%, 70%);
		background-color:hsl(240, 8%, 93%);
		color: #333;
	}

	input[type="checkbox"] {
		position: absolute;
		left: 0.5em;
		top: 0.6em;
		margin: 0;
	}

	.done {
		border: 1px solid hsl(240, 8%, 90%);
		background-color:hsl(240, 8%, 98%);
	}

	button {
		position: absolute;
		top: 0;
		right: 0.2em;
		width: 2em;
		height: 100%;
		background: no-repeat 50% 50% url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23676778' d='M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M17,7H14.5L13.5,6H10.5L9.5,7H7V9H17V7M9,18H15A1,1 0 0,0 16,17V10H8V17A1,1 0 0,0 9,18Z'%3E%3C/path%3E%3C/svg%3E");
		background-size: 1.4em 1.4em;
		border: none;
		opacity: 0;
		transition: opacity 0.2s;
		text-indent: -9999px;
		cursor: pointer;
	}

	label:hover button {
		opacity: 1;
	}
</style>
```

## 动效: Animations

可以使用`svelte/animate`完成一些动画指令

```js
import { flip } from 'svelte/animate';
```

然后在html中:

```html
<label
	in:receive="{{key: todo.id}}"
	out:send="{{key: todo.id}}"
	animate:flip
>
<!-- 或者传递参数 -->
<label
	in:receive="{{key: todo.id}}"
	out:send="{{key: todo.id}}"
	animate:flip="{{duration: 200}}"
>
```

## Action

Action 本质上是元素级别的生命周期功能. 可以用在:

1. 第三方库的接口
2. 图片的懒加载
3. 提示信息
4. 添加自定义事件处理

比如在下面的例子中, 我们希望能够通过`pannable`,`panmove`,`paned`三个事件来控制方块的移动, 但是显然这三个不是原生的DOM事件. 我们必须自己来实现他们. 

将相关的逻辑放在`pannable`中, 然后倒入进来.

```html
<script>
	import { spring } from 'svelte/motion';
	import { pannable } from './pannable.js';

	const coords = spring({ x: 0, y: 0 }, {
		stiffness: 0.2,
		damping: 0.4
	});

	function handlePanStart() {
		coords.stiffness = coords.damping = 1;
	}

	function handlePanMove(event) {
		coords.update($coords => ({
			x: $coords.x + event.detail.dx,
			y: $coords.y + event.detail.dy
		}));
	}

	function handlePanEnd(event) {
		coords.stiffness = 0.2;
		coords.damping = 0.4;
		coords.set({ x: 0, y: 0 });
	}
</script>

<style>
	.box {
		--width: 100px;
		--height: 100px;
		position: absolute;
		width: var(--width);
		height: var(--height);
		left: calc(50% - var(--width) / 2);
		top: calc(50% - var(--height) / 2);
		border-radius: 4px;
		background-color: #ff3e00;
		cursor: move;
	}
</style>

<div class="box"
	use:pannable
	on:panstart={handlePanStart}
	on:panmove={handlePanMove}
	on:panend={handlePanEnd}
	style="transform:
		translate({$coords.x}px,{$coords.y}px)
		rotate({$coords.x * 0.2}deg)"
></div>
```

其中`pannable.js`的内容如下. 类似于`transition`函数, 一个`action`函数接受一个`node`和一些可选的配置对象并返回一个`action`对象. 这个对象会拥有一个`destroy`对象, 会在元素被销毁的时候被调用.

我们希望在恰当的实际触发我们想要触发的事件, 一种可能是实现如下: 

```js
export function pannable(node) {
	let x;
	let y;

	function handleMousedown(event) {
		x = event.clientX;
		y = event.clientY;

		node.dispatchEvent(new CustomEvent('panstart', {
			detail: { x, y }
		}));

		window.addEventListener('mousemove', handleMousemove);
		window.addEventListener('mouseup', handleMouseup);
	}

	function handleMousemove(event) {
		const dx = event.clientX - x;
		const dy = event.clientY - y;
		x = event.clientX;
		y = event.clientY;

		node.dispatchEvent(new CustomEvent('panmove', {
			detail: { x, y, dx, dy }
		}));
	}

	function handleMouseup(event) {
		x = event.clientX;
		y = event.clientY;

		node.dispatchEvent(new CustomEvent('panend', {
			detail: { x, y }
		}));

		window.removeEventListener('mousemove', handleMousemove);
		window.removeEventListener('mouseup', handleMouseup);
	}

	node.addEventListener('mousedown', handleMousedown);

	return {
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
		}
	};
}
```

### Action 传参

与`Transitions`和`Animations`类似, `action`也是可以接受参数的. `action`函数会和它所在的函数一起被调用. 

在下面这个例子中, 我们使用了`longpress`这个动作表示一个用户按下并按住按钮到给定的时间, 该动作就会触发一个具有相同名称的事件. 

```html
<script>
	import { longpress } from './longpress.js';

	let pressed = false;
	let duration = 2000;
</script>

<label>
	<input type=range bind:value={duration} max={2000} step={100}>
	{duration}ms
</label>

<button use:longpress={duration}
	on:longpress="{() => pressed = true}"
	on:mouseenter="{() => pressed = false}"
>press and hold</button>

{#if pressed}
	<p>congratulations, you pressed and held for {duration}ms</p>
{/if}
```

现在, 我们需要在`longpress`中实现相关的逻辑:

```js
export function longpress(node, duration) {
	let timer;
	
	const handleMousedown = () => {
		timer = setTimeout(() => {
			node.dispatchEvent(
				new CustomEvent('longpress')
			);
		}, duration);
	};
	
	const handleMouseup = () => {
		clearTimeout(timer)
	};

	node.addEventListener('mousedown', handleMousedown);
	node.addEventListener('mouseup', handleMouseup);

	return {
		update(newDuration) {
			duration = newDuration;
		},
		destroy() {
			node.removeEventListener('mousedown', handleMousedown);
			node.removeEventListener('mouseup', handleMouseup);
		}
	};
}
```

## Classes 

类似于其他属性, 你可以使用js来控制元素的`class`. 

```html
<button
	class="{current === 'foo' ? 'active' : ''}"
	on:click="{() => current = 'foo'}"
>foo</button>
```

在`svelte`中, 可以用一个特殊化的指令:

```html
<button
	class:active="{current === 'foo'}"
	on:click="{() => current = 'foo'}"
>foo</button>
```

只有当表达式的值为真的时候, 就会将活动类添加到元素, 当为`falsy`时, 就会将其删除. 

如果其值和类型一致的话, 可以省略:

```html
<div class:big={big}>
	<!-- ... -->
</div>

<!-- 等价于 -->
<div class:big>
	<!-- ... -->
</div>
```

## 组件组合

### slot

非常相似与`vue`中的`slot`. 

```html
<Box>
	<h2>Hello!</h2>
	<p>This is a box. It can contain anything.</p>
</Box>

<!-- Box.svelte -->
<div class="box">
	<slot></slot>
</div>
```

如果没有任何的`slot`内容传递到组件中, 那么`slot`中的内容会作为一个默认内容显示出来.

```html
<div class="box">
	<slot>
		<em>no content was provided</em>
	</slot>
</div>
```

### 命令的Slots

这部分的语法和`vue`一模一样, 在组件中, 通过`name`对`slot`进行命名: 

```html
<article class="contact-card">
	<h2>
		<slot name="name">
			<span class="missing">Unknown name</span>
		</slot>
	</h2>

	<div class="address">
		<slot name="address">
			<span class="missing">Unknown address</span>
		</slot>
	</div>

	<div class="email">
		<slot name="email">
			<span class="missing">Unknown email</span>
		</slot>
	</div>
</article>
```

外部调用使用`slot`prop指定到命名的`slot`:

```html
<ContactCard>
	<span slot="name">
		P. Sherman
	</span>

	<span slot="address">
		42 Wallaby Way<br>
		Sydney
	</span>
</ContactCard>
```

#### slot props

我们需要将组件中的额数据传递给父组件, 来更新`slot`的内容. 这时, 便可以通过`slot props`来处理: 

```html
<div on:mouseenter={enter} on:mouseleave={leave}>
	<slot hovering={hovering}></slot>
</div>
```

然后, 我们吧`hovering`通过`let`指令暴露为prop:

```html
<Hoverable let:hovering={hovering}>
	<div class:active={hovering}>
		{#if hovering}
			<p>I am being hovered upon.</p>
		{:else}
			<p>Hover over me!</p>
		{/if}
	</div>
</Hoverable>
```

当然, 为了不引起混淆, 我们可以在父组件中重命名:

```html
<Hoverable let:hovering={active}>
	<div class:active>
		{#if active}
			<p>I am being hovered upon.</p>
		{:else}
			<p>Hover over me!</p>
		{/if}
	</div>
</Hoverable>
```

## Context API

`context api`为组件提供了一种相互对话的机制，而无需将数据和函数作为道具传递， 或者发送大量的事件。

比如在下面的使用`MapBox`的示例中，我们希望展示`Marker`, 但是我们希望并不要在每个组件上将`MapBox`对象作为数据进行传递. 

`context`有两个API接口:`setContext`和`getContext`. 如果一个组件通过`setContext(key,context)`设置`context`, 那么它的所有子组件都可以通过`const context=getContext(key)`来获取到`context`的值. 

```js
import { onMount, setContext } from 'svelte';
import { mapbox, key } from './mapbox.js';

setContext(key, {
	getMap: () => map
});
```

`context`可以是任何的对象, `setContext`和`getContext`都必须在组件初始化后进行调用, 因为父组件的`map`都还没有初始化. 

```js
import { getContext } from 'svelte';
import { mapbox, key } from './mapbox.js';

const { getMap } = getContext(key);
const map = getMap();
```

现在我们可以直接使用组件嵌套来进行:

```html
<Map lat={35} lon={-84} zoom={3.5}>
	<MapMarker lat={37.8225} lon={-122.0024} label="Svelte Body Shaping"/>
	<MapMarker lat={33.8981} lon={-118.4169} label="Svelte Barbershop & Essentials"/>
	<MapMarker lat={29.7230} lon={-95.4189} label="Svelte Waxing Studio"/>
	<MapMarker lat={28.3378} lon={-81.3966} label="Svelte 30 Nutritional Consultants"/>
	<MapMarker lat={40.6483} lon={-74.0237} label="Svelte Brands LLC"/>
	<MapMarker lat={40.6986} lon={-74.4100} label="Svelte Medical Systems"/>
</Map>
```

### Context keys

```js
const key = {};
```

### Contexts vs. stores

对于`key`, 我们可以使用任何东西来作为key, 使用字符串可能会造成冲突, 使用对象则可以依靠地址引用保证唯一性. 

和存储的区别在于, 存储是全局通用的, 但是`context`可以有效的约束在一个组件的范围中. 

当然同时使用两者也是可以的.

## 特殊元素

### `<svelte:self>`

自引用组件, 允许组件递归包含自身. 比如我们需要做个树节点组件, 则需要引用自身:

```html
{#if file.type === 'folder'}
	<svelte:self {...file}/>
{:else}
	<File {...file}/>
{/if}
```

直接应用`Folder`是不可行的. 

### `<svelte:component>`

```html
{#if selected.color === 'red'}
	<RedThing/>
{:else if selected.color === 'green'}
	<GreenThing/>
{:else if selected.color === 'blue'}
	<BlueThing/>
{/if}
```

当我们需要根据条件来改变组件的渲染的时候, 可以借助改特殊组件:

```html
<script>
	import RedThing from './RedThing.svelte';
	import GreenThing from './GreenThing.svelte';
	import BlueThing from './BlueThing.svelte';

	const options = [
		{ color: 'red',   component: RedThing   },
		{ color: 'green', component: GreenThing },
		{ color: 'blue',  component: BlueThing  },
	];

	let selected = options[0];
</script>

<svelte:component this={selected.component}/>
```

### `<svelte: window>`

可以通过这个特殊组件给`window`对象添加事件监听. 

```html
<svelte:window on:keydown={handleKeydown}/>
```

`window`组件上, 下面的组件属性可以使用:

- innnerWidth
- innerHeight
- outerWidth
- outerHeight
- scrollX: 只读
- scrollY: 只读
- online: 是`window.navigator.onLine`的别名

### `<svelte:body>`

类似于`svelte:window`, `svelte:body`允许你去监听``document.body`. 这对于`mouseenter`和`mouseleave`事件. 

```html
<svelte:body
	on:mouseenter={handleMouseenter}
	on:mouseleave={handleMouseleave}
/>
```

### `<svelte:head>`

`head`组件可以帮助我们定义一些`head`中的属性

### `<svelte:options>`

`options`组件可以帮助我们定义一些编译选项. 

下面有一个TODO的例子:

```html
<script>
	import Todo from './Todo.svelte';

	let todos = [
		{ id: 1, done: true, text: 'wash the car' },
		{ id: 2, done: false, text: 'take the dog for a walk' },
		{ id: 3, done: false, text: 'mow the lawn' }
	];

	function toggle(toggled) {
		todos = todos.map(todo => {
			if (todo === toggled) {
				// return a new object
				return {
					id: todo.id,
					text: todo.text,
					done: !todo.done
				};
			}

			// return the same object
			return todo;
		});
	}
</script>

<h2>Todos</h2>
{#each todos as todo}
	<Todo {todo} on:click={() => toggle(todo)}/>
{/each}
```

```html
<svelte:options immutable={true}/>

<script>
	import { afterUpdate } from 'svelte';
	import flash from './flash.js';

	export let todo;

	let div;

	afterUpdate(() => {
		flash(div);
	});
</script>

<style>
	div {
		cursor: pointer;
		line-height: 1.5;
	}
</style>

<!-- the text will flash red whenever
     the `todo` object changes -->
<div bind:this={div} on:click>
	{todo.done ? '👍': ''} {todo.text}
</div>
```

其中`flash`方法如下:

```js
export default function flash(element) {
	requestAnimationFrame(() => {
		element.style.transition = 'none';
		element.style.color = 'rgba(255,62,0,1)';
		element.style.backgroundColor = 'rgba(255,62,0,0.2)';

		setTimeout(() => {
			element.style.transition = 'color 1s, background 1s';
			element.style.color = '';
			element.style.backgroundColor = '';
		});
	});
}
```

如果没有指定`<svelte:options immutable/>`, 我们会看到整个`TODOS`都会因为父组件的数据更新而刷新. 而指定了以后, 则只会刷新对应状态改变的组件. 

诸如这样的例子还有一些其他的选项:

- `immutable={true}`: 永远不会使用可变数据, 所以编译器可以执行简单的引用相等来判断值时候更改
- `immutable={false}`: 默认的选项. 框架对于对象是否更改将采用更加保守的动作. 
- `accessors={true}`: 为组件的`prop`添加`getter`和`setter`.
- `accessors={false}`: 默认的选项
- `namespace="..."`: 将使用这个组件的命名空间, 最常见的比如`svg`
- `tag="..."`: 将此组件编译为自定义元素时使用的名称. 


## Module Context

通过声明`<script context =“ module”>`, 使得`script`中的代码在模块第一次求值而不是在实例化组件的时候运行. 其中包含的代码将运行一次. 并且把这部分代码放在组件顶部. 

```html
<script context="module">
	let current;
</script>
```

比如我们引用了5个一样的但是彼此独立地组件, 又希望组件之间可以关联.

```html
<script>
	import AudioPlayer from './AudioPlayer.svelte';
</script>

<!-- https://musopen.org/music/9862-the-blue-danube-op-314/ -->
<AudioPlayer
	src="https://sveltejs.github.io/assets/music/strauss.mp3"
	title="The Blue Danube Waltz"
	composer="Johann Strauss"
	performer="European Archive"
/>

<!-- https://musopen.org/music/43775-the-planets-op-32/ -->
<AudioPlayer
	src="https://sveltejs.github.io/assets/music/holst.mp3"
	title="Mars, the Bringer of War"
	composer="Gustav Holst"
	performer="USAF Heritage of America Band"
/>

<!-- https://musopen.org/music/8010-3-gymnopedies/ -->
<AudioPlayer
	src="https://sveltejs.github.io/assets/music/satie.mp3"
	title="Gymnopédie no. 1"
	composer="Erik Satie"
	performer="Prodigal Procrastinator"
/>

<!-- https://musopen.org/music/2567-symphony-no-5-in-c-minor-op-67/ -->
<AudioPlayer
	src="https://sveltejs.github.io/assets/music/beethoven.mp3"
	title="Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio"
	composer="Ludwig van Beethoven"
	performer="European Archive"
/>

<!-- https://musopen.org/music/43683-requiem-in-d-minor-k-626/ -->
<AudioPlayer
	src="https://sveltejs.github.io/assets/music/mozart.mp3"
	title="Requiem in D minor, K. 626 - III. Sequence - Lacrymosa"
	composer="Wolfgang Amadeus Mozart"
	performer="Markus Staab"
/>
```

比如播放一个声音的时候, 其他的声音可以停止. 通过上面的步骤, 可以更简单的使他们互相通信:

```html
<script context="module">
	let current;
</script>

<script>
	export let src;
	export let title;
	export let composer;
	export let performer;

	let audio;
	let paused = true;

	function stopOthers() {
		if (current && current !== audio) current.pause();
		current = audio;
	}
</script>

<style>
	article { margin: 0 0 1em 0; max-width: 800px }
	h2, p { margin: 0 0 0.3em 0; }
	audio { width: 100%; margin: 0.5em 0 1em 0; }
	.playing { color: #ff3e00; }
</style>

<article class:playing={!paused}>
	<h2>{title}</h2>
	<p><strong>{composer}</strong> / performed by {performer}</p>

	<audio
		bind:this={audio}
		bind:paused
		on:play={stopOthers}
		controls
		{src}
	></audio>
</article>
```

### Exports

从`context='module'`脚本导出的所有内容都是模块本身的导出. 

比如在上个例子中, 我们添加一个`stopALL`方法:

```html
<script context="module">
	const elements = new Set();

	export function stopAll() {
		elements.forEach(element => {
			element.pause();
		});
	}
</script>
```

然后再父组件中引用:

```html
<script>
	import AudioPlayer, { stopAll } from './AudioPlayer.svelte';
</script>

<button on:click={stopAll}>
	stop all audio
</button>
```

就可以操作到所有的实例.

## Debugging

通过使用`@debug`关键字, 可以打印出实时变化的数据:

```html
<script>
	let user = {
		firstname: 'Ada',
		lastname: 'Lovelace'
	};
</script>

<input bind:value={user.firstname}>
<input bind:value={user.lastname}>

{@debug user}

<h1>Hello {user.firstname}!</h1>
```

