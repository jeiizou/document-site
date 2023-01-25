# [文字]二维Canvas

除了使用HTML元素显示文字, 还可以使用一个新的画布, 并且是只使用其二维的上下文. 

和其他例子一样我们先创建一个容器，但是这次放两个画布进去.

```html
<div class="container">
  <canvas id="canvas"></canvas>
  <canvas id="text"></canvas>
</div>
```

设置让画布称为覆盖层:

```css
.container {
    position: relative;
}
 
#text {
    position: absolute;
    left: 0px;
    top: 0px;
    z-index: 10;
}
```

在初始化的时候找到文字画布, 并创建一个二维上下文:

```js
// 找到画布
var textCanvas = document.querySelector("#text");
 
// 创建一个二维上下文
var ctx = textCanvas.getContext("2d");
```

渲染的时候也想webgl一样, 每一帧都清空二维画布:

```js
function drawScene() {
    ...
 
    // 清空二维画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
```

然后只调用`fillText`绘制文字.

```js
ctx.fillText(someMsg, pixelX, pixelY);
```

文字会显得比较小, 因为默认的尺寸就是比较小的. 使用二维画布的另一个原因是可以很容易的绘制各种图形, 比如添加一个箭头:

```js
// 绘制箭头和文字
 
// 保存画布设置
ctx.save();
 
// 将画布原点移动到 F 的正面右上角
ctx.translate(pixelX, pixelY);
 
// 绘制箭头
ctx.beginPath();
ctx.moveTo(10, 5);
ctx.lineTo(0, 0);
ctx.lineTo(5, 10);
ctx.moveTo(0, 0);
ctx.lineTo(15, 15);
ctx.stroke();
 
// 绘制文字
ctx.fillText(someMessage, 20, 20);
 
// 还原画布设置
ctx.restore();
```

