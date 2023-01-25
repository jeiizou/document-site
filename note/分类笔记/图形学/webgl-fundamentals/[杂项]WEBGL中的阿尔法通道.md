# WEBGL中的阿尔法通道

WEBGL和OPENGL中的阿尔法通道是有些不同的.

OpenGL是渲染到一个后备缓冲中的, 不会和其他的东西混合, 或者说不和操作系统窗口管理器中的其他东西混合, 所以阿尔法通道是什么都无所谓.

WebGL则会被浏览器混合到页面中, 默认使用的是预乘阿尔法通道, 和带有透明的png图像, img标签以及二维画布是相同的.

WebGL有几种方法可以模仿OpenGL.

## 1.告诉WebGL你想它是非预乘阿尔法通道的

```javascript
gl = canvas.getContext("webgl", {
  premultipliedAlpha: false  // 请求非预乘阿尔法通道
});
```

这里的默认值是`true`.

当然结果还是会和背景缓和的, 可能是画布的背景色, 可能是画布的容器的背景色或者页面的背景色等等.

当遇到阿尔法通道问题的时候, 一个比较好用的办法就是把画布的背景色设置为一个亮色, 用于找到稳定

```html
<canvas style="background: red;"><canvas>
```

当然也可以这是为黑色, 来隐藏你的阿尔法通道的问题

## 2. 告诉WebGL你不想要在后备缓冲中使用阿尔法通道

```js
gl = canvas.getContext("webgl", { alpha: false }};
```

这就很想OpenGL, 因为后备缓冲就只有RGB, 这可能是比较好的方式, 因为好的浏览器知道你没有阿尔法, 并优化WebGL的缓和方式. 不过这意味着后备缓冲中没有阿尔法通道, 如果你处于某些原因想在后备缓冲中使用阿尔法通道就不太合适了. 我知道的只有极少数的应用在后备缓冲中使用阿尔法通道, 所以大部分的情况下没什么问题. 

## 3. 在渲染结束后清除阿尔法通道

```js
..
renderScene();
..
// 设置后备缓冲的阿尔法为 1.0
gl.clearColor(1, 1, 1, 1);
gl.colorMask(false, false, false, true);
gl.clear(gl.COLOR_BUFFER_BIT);
```

大多数的硬件使用清除的时候非常的快速, 不过第二种方法可能会显得更加聪明一点.

## 4. 清除一次阿尔法通道并不再渲染

```js
// 在初始化阶段，清楚后备缓冲
gl.clearColor(1,1,1,1);
gl.clear(gl.COLOR_BUFFER_BIT);
 
// 关闭向阿尔法通道的渲染
gl.colorMask(true, true, true, false);
```

当然如果你想在帧缓冲中使用阿尔法通道, 可以在渲染前开启, 在渲染后再关闭, 保证渲染到画布之前是关闭的. 

## 5. 处理图像

默认的如果你将带有阿尔法的图像加载到WebGL中, WebGL会将它的值当做PNG的颜色值, 不是预乘阿尔法的, 这也是我在OpenGL程序中经常用的方法. 

```js
1, 0.5, 0.5, 0  // RGBA
```

你想要的话, 可以让WenGL使用预乘值. 

```js
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
```

默认值是非预乘值.

要注意的是大多数二维画布使用的是预乘阿尔法通道的值。这就意味着你将 `UNPACK_PREMULTIPLY_ALPHA_WEBGL` 设置为 false 时，WebGL会将传入的值转换成非预乘值。

## 6. 对非预乘阿尔法的值使用混合方程

```js
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
```

这适用于非预乘的阿尔法通道的纹理

如果你确实想要使用预乘阿尔法通道的纹理, 可能就要使用:

```js
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
```

