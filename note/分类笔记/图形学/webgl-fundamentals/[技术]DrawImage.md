# [技术]DrawImage

大部分的二维游戏通过绘制图像就能实现大部分的功能. 

canvas中有个非常灵活的接口: `drawImage`. 其调用方式大致如下:

```js
ctx.drawImage(image, dstX, dstY);
ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                     dstX, dstY, dstWidth, dstHeight);
```

我们现在开始用已有的一些知识点, 用webgl来实现这样一个方法. 

我们从第一个版本开始:

```js
ctx.drawImage(image, x, y);
```

它可以在`x`和`y`的位置完整的绘制一个图像. 为了实现相类似的功能, webgl需要`x`, `y`, `x+width`, `y+height`四个坐标位置来绘制图像. 另外一个更加常用的方式是传入一个单位矩阵, 然后使用矩阵变换了进行缩放和平移, 来达到期望的位置和大小. 

首先定义一组简单的着色器程序:

```glsl
// 顶点着色器
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_matrix * a_position;
    v_texcoord = a_texcoord;
}
```

```glsl
// 片元着色器
precision mediump float;

uniform sampler2D u_texture;

varying vec2 v_texcoord;

void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
}
```

核心的绘制方法大致如下:

```js
// 不同于图像，纹理没有对应的长和宽，
// 我们将向纹理传递长和宽
function drawImage(tex, texWidth, texHeight, dstX, dstY) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
 
  // 告诉WebGL使用的程序
  gl.useProgram(program);
 
  // 设置属性，从缓冲中提取数据
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.enableVertexAttribArray(texcoordLocation);
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
 
  // 从像素空间转换到裁剪空间
  var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
 
  // 平移到 dstX, dstY
  matrix = m4.translate(matrix, dstX, dstY, 0);
 
  // 缩放单位矩形的宽和高到 texWidth, texHeight 个单位长度
  matrix = m4.scale(matrix, texWidth, texHeight, 1);
 
  // 设置矩阵
  gl.uniformMatrix4fv(matrixLocation, false, matrix);
 
  // 告诉着色器使用纹理单元 0
  gl.uniform1i(textureLocation, 0);
 
  // 绘制矩形
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
```

然后是实现该方法的第二种调用方式:

```js
function drawImage(
    tex, texWidth, texHeight,
    dstX, dstY, dstWidth, dstHeight) {
  if (dstWidth === undefined) {
    dstWidth = texWidth;
  }
 
  if (dstHeight === undefined) {
    dstHeight = texHeight;
  }
 
  gl.bindTexture(gl.TEXTURE_2D, tex);
 
  ...
 
  // 从像素空间转换到裁剪空间
  var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);
 
  // 缩放单位矩形的宽和高到 dstWidth, dstHeight 个单位长度
  var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);
 
  // 平移到 dstX, dstY
  var translationMatrix = m4.translation(dstX, dstY, 0);
 
  // 将矩阵乘起来
  var matrix = m4.multiply(translationMatrix, scaleMatrix);
  matrix = m4.multiply(projectionMatrix, matrix);
 
  // 设置矩阵
  gl.uniformMatrix4fv(matrixLocation, false, matrix);
 
  // 告诉着色器使用纹理单元 0
  gl.uniform1i(textureLocation, 0);
 
  // 绘制矩形
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
```

只是用 `dstWidth` 和 `dstHeight` 代替了 `texWidth` 和 `texHeight`.

第三种方法的调用签名如下:

```js
ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                     dstX, dstY, dstWidth, dstHeight);
```

为了实现绘制部分纹理, 我们就需要操控纹理坐标. 

纹理坐标的原理之前有介绍过, 我们可以手动的创建纹理坐标. 另一种可行的方法, 我们也可以选择在运行时创建, 然后使用矩阵简单的修改坐标. 

```js
function drawImage(
    tex, texWidth, texHeight,
    srcX, srcY, srcWidth, srcHeight,
    dstX, dstY, dstWidth, dstHeight) {
  if (dstX === undefined) {
    dstX = srcX;
    srcX = 0;
  }
  if (dstY === undefined) {
    dstY = srcY;
    srcY = 0;
  }
  if (srcWidth === undefined) {
    srcWidth = texWidth;
  }
  if (srcHeight === undefined) {
    srcHeight = texHeight;
  }
  if (dstWidth === undefined) {
    dstWidth = srcWidth;
    srcWidth = texWidth;
  }
  if (dstHeight === undefined) {
    dstHeight = srcHeight;
    srcHeight = texHeight;
  }
 
  gl.bindTexture(gl.TEXTURE_2D, tex);
 
  ...
 
  // 从像素空间转换到裁剪空间
  var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);
 
  // 缩放单位矩形的宽和高到 dstWidth, dstHeight 个单位长度
  var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);
 
  // 平移到 dstX, dstY
  var translationMatrix = m4.translation(dstX, dstY, 0);
 
  // 将矩阵乘起来
  var matrix = m4.multiply(translationMatrix, scaleMatrix);
  matrix = m4.multiply(projectionMatrix, matrix);
 
  // 设置矩阵
  gl.uniformMatrix4fv(matrixLocation, false, matrix);
 
  // 因为纹理坐标的范围是 0 到 1
  // 并且我们的纹理坐标是一个单位矩形
  // 我们可以旋转平移矩形选择一部分纹理
  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
 
  // 设置纹理矩阵
  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);
 
  // 告诉着色器使用纹理单元 0
  gl.uniform1i(textureLocation, 0);
 
  // 绘制矩形
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
```

不同于画布的接口, 我们可以对图像进行更多的处理. 

一个是可以传递一些负值, 这样会绘制另一边的像素内容. 

另一个是我们使用矩阵就可以实现任何矩阵运算可以实现的效果。

比如绕纹理中心去旋转纹理坐标. 

比如我们修改纹理计算的代码如下:

```js
// 像二维投影矩阵那样将坐标从纹理空间转换到像素空间
var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);

// 选择一个旋转中心
// 移动到中心旋转后在回来
var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
var texMatrix = m4.zRotate(texMatrix, srcRotation);
var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);

// 因为在像素空间，缩放和平移现在是按像素单位
var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

// 设置纹理矩阵
gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);
```

