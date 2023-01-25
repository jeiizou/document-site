# 优化-CSS

## 重绘与回流

在页面的生命周期中, 网页生成的时候, 至少会渲染一次. 在用户访问的过程中, 还会不断的触发重绘和回流. 

重绘和回流是渲染步骤中的一小步, 但是这两个步骤对于性能的影响比较大.

-   重绘是当前节点需要更改外观而不会影响布局的, 比如改变 color 就称为重绘
-   回流是布局或者集合属性需要改变就称为回流

回流必定重绘, 重绘不一定引发回流. 回流所需的成本比重绘高得多, 改变深层次的节点更可能导致父节点的一些列回流.

重绘和回流实际上和 Event Loop 有关

1. 当 EventLoop 执行完 MincroTasks 后, 会判断 documeny 是否需要更新, 因为浏览器时 60HZ 刷新率, 所以每 16ms 才会更新一次.
2. 判断是否有 resize/scroll, 有就触发, 所以这两个事件实际上至少 16ms 才会触发一次, 自带节流
3. 判断是否触发了 media query
4. 更新动画并且发送事件
5. 判断是否有全屏操作事件
6. 执行 requestAnimationFrame 回调
7. 执行 IntersectionObserver 回到, 该方法用于判断元素是否可见, 可以用于懒加载, 但是兼容性不太好
8. 更新界面
9. 一帧完成, 如果一帧中有空闲时间, 就会去执行`requestIdleCallback`回调

### 回流(重排)

当DOM的变化影响了元素的几何信息(元素的位置和尺寸的大小), 浏览器需要重新计算元素的几何属性, 将其安排在界面中的正确位置, 这个过程叫做回流.

简单的说就是重新生成布局, 排列元素.

下面的几种机框会发生回流:

- 页面初始渲染，这是开销最大的一次回流
- 添加/删除可见的DOM元素
- 改变元素位置
- 改变元素尺寸，比如边距、填充、边框、宽度和高度等
- 改变元素内容，比如文字数量，图片大小等
- 改变元素字体大小
- 改变浏览器窗口尺寸，比如resize事件发生时
- 激活CSS伪类（例如：:hover）
- 设置`style`属性的值，因为通过设置`style`属性改变结点样式的话，每一次设置都会触发一次reflow
- 查询某些属性或调用某些计算方法：`offsetWidth`、`offsetHeight`等，除此之外，当我们调用 `getComputedStyle`方法，或者IE里的 `currentStyle` 时，也会触发重排，原理是一样的，都为求一个“即时性”和“准确性”。

常见引起重排属性和方法: 

```
width
height
margin
padding
display
border-width
border
position
overflow
font-size
vertical-align
min-height
clientWidth
clientHeight
clientTop
clientLeft
offsetWudth
offsetHeight
offsetTop
offsetLeft
scrollWidth
scrollHeight
scrollTop
scrollLeft
scrollIntoView()
scrollTo()
getComputedStyle()
getBoundingClientRect()
scrollIntoViewIfNeeded()
```

#### 回流影响的范围

由于浏览器渲染界面是基于流式布局模型的, 所以触发回流会对周围DOM重新排列, 影响的范围有两种:

- 全局范围: 从根节点开始对整个渲染树进行重新布局
- 局部范围: 对渲染树的某个部分或者一个渲染对象进行重新布局. 比如把一个dom的宽高定死, 在dom内部触发回流.

### 重绘

当一个元素的外观发生变化, 但没有改变布局, 重新吧元素外观绘制出来的过程, 叫做重绘.

常见的引起重绘的属性:

```
color
border-style
visibility
background
text-decoration
background-image
background-position
background-repeat
outline-color
outline
outline-style
border-radius
outline-width
box-shadow
background-size
```

## 优化重绘与回流

### 减少回流范围

以局部布局的形式组织html结构，尽可能小的影响重排的范围:

- 尽可能在低层级的DOM节点上，而不是像上述全局范围的示例代码一样，如果你要改变p的样式，class就不要加在div上，通过父元素去影响子元素不好。
- 不要使用 table 布局，可能很小的一个小改动会造成整个 table 的重新布局。不得已使用table的场合，可以设置table-layout:auto;或者是table-layout:fixed这样可以让table一行一行的渲染，这种做法也是为了限制reflow的影响范围。

### 减少回流次数

1. 样式集中改变

不要频繁的操作样式，对于一个静态页面来说，明智且可维护的做法是更改类名而不是修改样式，对于动态改变的样式来说，相较每次微小修改都直接触及元素，更好的办法是统一在`cssText`变量中编辑。虽然现在大部分现代浏览器都会有`Flush`队列进行渲染队列优化，但是有些老版本的浏览器比如IE6的效率依然低下。

```js
// bad
var left = 10;
var top = 10;
el.style.left = left + "px";
el.style.top = top + "px";

// 当top和left的值是动态计算而成时...
// better 
el.style.cssText += "; left: " + left + "px; top: " + top + "px;";

// better
el.className += " className";
```

2. 分离读写操作

DOM 的多个读操作（或多个写操作），应该放在一起。不要两个读操作之间，加入一个写操作。

```js
// bad 强制刷新 触发四次重排+重绘
div.style.left = div.offsetLeft + 1 + 'px';
div.style.top = div.offsetTop + 1 + 'px';
div.style.right = div.offsetRight + 1 + 'px';
div.style.bottom = div.offsetBottom + 1 + 'px';


// good 缓存布局信息 相当于读写分离 触发一次重排+重绘
var curLeft = div.offsetLeft;
var curTop = div.offsetTop;
var curRight = div.offsetRight;
var curBottom = div.offsetBottom;

div.style.left = curLeft + 1 + 'px';
div.style.top = curTop + 1 + 'px';
div.style.right = curRight + 1 + 'px';
div.style.bottom = curBottom + 1 + 'px';
```

原来的操作会导致四次重排，读写分离之后实际上只触发了一次重排，这都得益于浏览器的渲染队列机制：

> 当我们修改了元素的几何属性，导致浏览器触发重排或重绘时。它会把该操作放进渲染队列，等到队列中的操作到了一定的数量或者到了一定的时间间隔时，浏览器就会批量执行这些操作。

3. 将DOM离线

- 使用`display:none`: 一旦我们给元素设置 display:none 时（只有一次重排重绘），元素便不会再存在在渲染树中，相当于将其从页面上“拿掉”，我们之后的操作将不会触发重排和重绘，添加足够多的变更后，通过 display属性显示（另一次重排重绘）。通过这种方式即使大量变更也只触发两次重排。另外，visibility : hidden 的元素只对重绘有影响，不影响重排。
- 通过`DocumentFragment`创建一个 dom 碎片,在它上面批量操作 dom，操作完成之后，再添加到文档中，这样只会触发一次重排
- 复制节点，在副本上工作，然后替换它！

4. 使用absolute或者fixed脱离文档流

使用绝对定位会使的该元素单独成为渲染树中 body 的一个子元素，重排开销比较小，不会对其它节点造成太多影响。当你在这些节点上放置这个元素时，一些其它在这个区域内的节点可能需要重绘，但是不需要重排。

5. 优化动画

- 可以把动画效果应用到position属性为 `absolute` 或 `fixed` 的元素上，这样对其他元素影响较小。
- 启用GPU加速: GPU 加速通常包括以下几个部分：Canvas2D，布局合成, CSS3转换（transitions），CSS3 3D变换（transforms），WebGL和视频(video)。

6. 其他

-   不要把 DOM 结点的属性值放在一个循环里当成循环里的变量

```js
for (let i = 0; i < 1000; i++) {
    // 获取 offsetTop 会导致回流，因为需要去获取正确的值
    console.log(document.querySelector('.test').style.offsetTop);
}
```

-   使用 visibility 替换 display: none ，因为前者只会引起重绘，后者会引发回流（改变了布局）
-   不要使用 table 布局，可能很小的一个小改动会造成整个 table 的重新布局
-   动画实现的速度的选择，动画速度越快，回流次数越多，也可以选择使用 requestAnimationFrame
-   CSS 选择符从右往左匹配查找，避免 DOM 深度过深
-   将频繁运行的动画变为图层，图层能够阻止该节点回流影响别的元素。比如对于 video 标签，浏览器会自动将该节点变为图层
-   使用`translate`替代`top`

```html
<div class="test"></div>
<style>
    .test {
        position: absolute;
        top: 10px;
        width: 100px;
        height: 100px;
        background: red;
    }
</style>
<script>
    setTimeout(() => {
        // 引起回流
        document.querySelector('.test').style.top = '100px';
    }, 1000);
</script>
```

## 压缩和最小化css

这部分借助webpack的插件可以很好的实现, 比如使用`Terser`, 或者使用webpack自带的工具.

## 删除未使用的CSS

可以通过`UnusedCSS`或者`PurifyCSS`, 帮助查询不必要的CSS样式, 但是必须要配合仔细的视觉回归测试. 

或者使用`CSS-in-JS`: 每个组件内渲染的样式都是只需要CSS. 在`CSS-in-JS`中可以将其内敛到页面中, 或者将其提取到外部CSS文件中.

## 优先考虑关键的CSS

关键CSS是一种CSS优化技术, 它提取并内嵌CSS以获得页面以上的内容. 在HTML文档的`head`中内联提取的样式.

但是这些内容需要保持在14kb以下. 

为了确定关键的CSS并不完全的准确, 因此你需要对折叠位置进行假设. 这对于高度动态的网站是非常困难的. 我们可以通过`Critical`, `CriticalCSS`和`Penthouse`等工具进行自动化处理

## 异步加载CSS

除了关键CSS之外的部分, 可以异步加载. 实现的方式是将`link media`属性设置为`print`.

```html
<link rel ="stylesheet" href="non-critical.css"   media = "print" onload="this.media='all'">
```

另一种方法是使用`<link rel="preload">`

## 避免在CSS文件中使用@import

使用`@import`会阻塞渲染流程, 而使用`link`是并行下载的. 

## contain 属性

contain CSS属性告诉浏览器, 该元素机器子元素是独立于文档树的.浏览器会优化页面独立部分的渲染

contain属性在包含许多独立小组件的页面上非常的有用. 可以使用它来防止每个小组件的更改影响边框外的副作用.

## 使用CSS优化字体加载

1. 避免在加载字体时出现不可见的文件

字体通常是需要一段时间来加载大文件. 一些浏览器会隐藏文本, 直到字体加载完毕(导致不可见文本的闪烁, FOIT)来处理这个问题. 在优化速度时, 你会希望避免不可见文本的闪烁, 并使用系统字体立即向人们展示内容. 

可以使用`font-display`来控制字体的显示顺序

2. 使用可变字体以减少文件大小

可变字体使字体的许多不同变化能够被整合到一个文件中, 而不是为每一种宽度, 重量或者样式都有一个单独的字体文件. 

## 内容可见性（content-visibility）

一般来说, web应用中有些内容会在设备的可视区域之外. 

我们可以使用CSS的`content-visibility`来跳过屏幕外的内容渲染. 也就是说, 如果你有大量的离屏内容(Off-screen content), 这会大幅减少页面渲染的时间.

这个是CSS新增的特性. 

content-visibility有点类似于CSS的display和visibility, 但是其实现方式又与之不同. 

content-visibility的关键能力, 它允许我们推迟我们选择的HTML元素渲染. 默认的情况下, 浏览器会渲染DOM树内所有可以被用户查看的元素. 用户可以看到视窗可视区域的所有元素, 并通过滚动查看页面内的其他元素. 一次渲染所有的元素, 可以让浏览器正确计算页面尺寸, 同时保持整个页面的布局和滚动条的一致性. 

如果浏览器不渲染一些元素, 滚动的计算将变得非常复杂.

`content-visibility`会将分配给它的元素的高度视为0, 浏览器在渲染之前会将这个元素的高度变为0, 从而使我们的页面高度和滚动变得混乱. 但如果已经为元素或者其子元素显示的设置了高度, 这个行为就会被覆盖. 如果没有显示的设置高度, 并且因为显示设置height可能会带来一定的副作用而没有设置, 那么可以使用`contain-intrinsic-size`来确保元素的正确渲染, 同时保留延迟渲染的好处:

```css
.card {
    content-visibility: auto;
    contain-intrinsic-size: 200px;
}
```

这会启用一个占位符尺寸来代替渲染的内容.

`content-visibility`的另一个能力, 是可以通过`visibile`和`hidden`实现元素的显示和隐藏能力, 类似display但是能提高渲染的性能. 因为他的渲染原理是不一样的.

- `display: none`, 隐藏元素并破话渲染状态. 其隐藏和渲染具有一样的性能消耗


## 参考链接

- [重排(reflow)和重绘(repaint)](https://juejin.cn/post/6844904083212468238)
- [How to Improve CSS Performance](https://calibreapp.com/blog/css-performance)
- [提高web页面渲染速度的7个技巧](https://mp.weixin.qq.com/s/vAP24RkjAVEUkn0QAZfI3A)