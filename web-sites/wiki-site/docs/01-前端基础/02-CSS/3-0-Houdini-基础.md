---
slug: /FrontendFoundation/CSS/Houdini
---
# Houdini-基础

CSS Houdini API是CSS引擎暴露出来的一套api，通过这套API，开发者可以直接触及CSSOM，告诉浏览器如何去解析CSS, 从而影响浏览器的渲染过程, 实现一些原来无法实现的功能.

## 优势

与使用JS进行样式更改相比, Houdini解析更快:

- 浏览器会在应用脚本中的任何样式更新之前解析CSSOM, 包括布局, 绘制和合成过程

## 特性

### CSS Typed Object Model API

一个具有类型和方法的CSS对象模型, 可以通过JS访问, 相较于`HTMLElement.style`操作更加直观. 每个元素和样式表规则通过`StylePropertyMap`进行映射.

### PaintWorklet

使用`Worklets`可以运行JS和`WebAssembly`代码来进行高性能的图形渲染或者音频的处理.

工作集只能用于特定的用例, 不能像Web Workers那样用于任意计算. `Worklet`是这一类方法的抽象类, 包含了所有类型的工作集中共有的属性的方法. 它不能直接使用, 只能调用具体的类型.

我们这里主要关注CSS Houdini相关的Worklet:

**PaintWorklet**: 通过`CSS.paintWorklet`接口, 读取CSS属性生成图像, 具体的API实现是: [`css-paint-api`](https://drafts.css-houdini.org/css-paint-api-1/#paint-worklet)

使用Worklet可以创建模块化的CSS, 只需要一行JS既可以导入和配置CSS组件, 不需要任何预处理, 后处理或者JS框架:

```js
CSS.paintWorklet.addModule('css-component.js');
```

## API

### CSS属性和值 API

可以用于创建自定义的属性类型, 继承行为, 初始值等逻辑处理.

举例:

```js
window.CSS.registerProperty({
  // 属性名称
  name: '--my-color',
  // 可选的, 预期的属性类型, 这里指需要一个颜色值 
  syntax: '<color>',
  // 是否继承已定义的属性
  inherits: false,
  // 可选的, 表示已定义属性初始值的字符串
  initialValue: '#c0ffee',
});
```

现在, `--my-color`已经用语法`color`完成注册.

```css
.registered {
  --my-color: #c0ffee;
  background-image: linear-gradient(to right, #fff, var(--my-color));
  transition: --my-color 1s ease-in-out;
}

.registered:hover,
.registered:focus {
  --my-color: #b4d455;
}
```

这里注册的--my-color可以很好的完成颜色的渐变计算.

### CSS类型OM

将CSSOM字符串值转换为有意义的JS对象, 允许JS对齐进行高性能的操作.

举例:

```js
// 获取对应的DOM
const myElement = document.querySelector('a');

// 通过computedStyleMap获取样式映射
const defaultComputedStyles = myElement.computedStyleMap();

// 遍历对象可以获取到所有的CSS属性以及对应的值
for (const [prop, val] of defaultComputedStyles) {
  // 属性
  console.log('属性:', prop);
  // 值
  console.log('值:', val);
}
```

### CSS绘制API

允许JS通过`paint()`函数直接绘制到元素的背景, 边框或者内容中的API

要用JS创建CSS样式表使用的图像, 大致可以分成几个步骤:

1. 通过`registerPaint()`函数定义一个 paint worklet
2. 注册这个 worklet
3. 通过`paint()`函数使用`worklet`

举例:

1. 定义`paint worklet`:

```js
registerPaint(
  "headerHighlight",
  class {
    /**
     * 定义是否允许alpha透明度
     * 默认设置为true。如果设置为false，则所有画布上使用的颜色将完全不透明
     */
    static get contextOptions() {
      return { alpha: true };
    }

    /**
     * ctx 是一个二维绘制上下文, 是Html Canvas API的一个子集
     */
    paint(ctx) {
      ctx.fillStyle = "hsl(55 90% 60% / 1.0)";
      ctx.fillRect(0, 15, 200, 20); /* order: x, y, w, h */
    }
  }
);
```

2. 注册

```js
CSS.paintWorklet.addModule("nameOfPaintWorkletFile.js");
```

3. 通过`paint`使用这个worklet

```js
.fancy {
  background-image: paint(headerHighlight);
}
```


### 其他API

这些API目前来说还没有完善实现或者只是一个提案, 这里仅做记录:

- CSS Layout API: 用于实现自定义布局
- CSS Parser API: 一种更加公开的CSS解析器的API, 可以将任意`类CSS`语言解析为CSS
- Font Metrics API: 公开字体标准的API, 可以访问排版的布局结果

## 参考链接

1. [Mdn web docs: Houdini](https://developer.mozilla.org/en-US/docs/Web/Guide/Houdini)
2. [Mdn web docs: Worklet](https://developer.mozilla.org/en-US/docs/Web/API/Worklet)
