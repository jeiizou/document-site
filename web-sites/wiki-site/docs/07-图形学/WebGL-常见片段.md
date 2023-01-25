# WebGL-常见片段

## 创建 webgl 环境

超级简化版:

```js
//获取节点对象
let canvas = document.getElementById('canvas-example');
//创建webgl环境
let gl = canvas.getContext('webgl');
```

这里的初始化环境省略了很多环境判断和异常处理.

## 加载着色器

超级简化版(省略所有异常处理):

```js
//顶点着色器
let VSHADER_SOURCE = `
attribute vec4 a_Position;
void main(){
    gl_Position=a_Position;
    gl_PointSize=10.0;
}
`;

//片元着色器
let FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main(){
gl_FragColor=u_FragColor;
}`; //设置颜色

//现在我们有两个非常简单的顶点着色器片段和片元着色器片段
//并且在前面已经获取到了webgl上下文对象gl
let gl;

var program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
gl.useProgram(program);
gl.program = program;

function createProgram(gl, vshader, fshader) {
    var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.getProgramParameter(program, gl.LINK_STATUS);

    return program;
}

function loadShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    return shader;
}
```

## 传递参数和变量

webgl 有两种主要的变量专用于外部进行传递, 分别是专用于顶点着色器的`attribute`和专用于片源着色的`uniform`;

```js
//还是上面的着色代码
//我们现在在着色器源码中定义这两种变量
//顶点着色器
let VSHADER_SOURCE = `
attribute vec4 a_Position;
void main(){
    gl_Position=a_Position;
    gl_PointSize=10.0;
}
`;

//片元着色器
let FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main(){
gl_FragColor=u_FragColor;
}`; //设置颜色

//假定我们已经获取到gl并且初始化着色器完成
//接下去就是获取到对应变量的存储地址
let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); //变量名称是对应的
let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

//将点的位置传递到变量a_Position中
gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
//将点的颜色传输到u_FragColor变量中
gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
//绘制点
gl.drawArrays(gl.POINTS, 0, 1);
```

## 创建缓冲区对象

先看代码流程:

```js
//设置顶点位置: 创建顶点缓冲区并且把顶点数据写入
let n = initVertexBuffers(gl);
if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
}

//继续执行
...

//一次绘制三个点
gl.drawArrays(gl.POINTS, 0, n);


function initVertexBuffers(gl) {
  let vertices = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  let n = 3; // 顶点数量

  // 创建缓冲区对象
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("创建缓冲区对象失败");
    return -1;
  }

  // 绑定缓冲区对象到目标
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // 向缓冲区对象中写入数据
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  //获取变量地址
  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return -1;
  }
  //将缓冲区对象分配给a_Position变量
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // 链接a_Postion变量与分配给它的缓冲区对象
  gl.enableVertexAttribArray(a_Position);

  return n;
}
```

再整理一下:

1. 创建缓冲区对象(`gl.createBuffer()`).
2. 绑定缓冲区对象(`gl.bindBuffer()`).
3. 将数据写入缓冲区对象(`gl.bufferDate()`).
4. 将缓冲区对象分配给一个 `attribute` 对象(`gl.vertexAttribPointer()`).
5. 开启 `attribute` 变量(`gl.enableVertexAttribArray()`).

## 变换矩阵的使用

```js
//顶点着色数据
//在三角面不用指定点的大小
let VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "uniform mat4 u_xformMatrix;\n" +
  "void main() {\n" +
  "  gl_Position = u_xformMatrix * a_Position;\n" +
  "}\n";

let radian = (Math.PI * ANGLE) / 180.0; //转弧度制
let cosB = Math.cos(radian),
    sinB = Math.sin(radian);

//注意. WEbGL中矩阵是列主序的
let xformMatrix=new Float32Array([
    cosB,sinB,0.0,0.0,
    -sinB,cosB,0.0,0.0,
    0.0,0.0,1.0,0.0,
    0.0,0.0,0.0,1.0
]);

//将变换矩阵传递给对应的参数
let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');

//...

//绘制该三角形
gl.drawArrays(gl.TRIANGLES, 0, n);
```

## 基础动画

```js
//获取u_ModelMatrix变量的存储位置
let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
}

//三角形的当前旋转角度
let currentAngle = 0.0;
//模型矩阵, Matrix4对象, 这里使用了一个第三方的矩阵库用来更加方便的创建矩阵和进行矩阵运算
let modelMatrix = new Matrix4();

//开始绘制三角形
let tick = function() {
    currentAngle = animate(currentAngle); //更新旋转角
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
    requestAnimationFrame(tick, canvas); //请求浏览器调用tick
};
tick();

//重绘三角形
function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
    // 设置变换矩阵
    modelMatrix.setRotate(currentAngle, 0, 0, 1); //旋转角度, 旋转轴(0, 0, 1)
    modelMatrix.translate(0.35, 0, 0);
    //重新传递给对应的变量
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // 清理画布
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}
```

## 交错组织(interleaving)

指的是将不同的数据比如顶点的坐标和尺寸打包到同一个缓冲区对象中, 并通过某种机制分别访问缓冲区对象中不同种类的数据.

比如说, 数据是这样的:

```js
let verticesSizes = new Float32Array([
    // 顶点的坐标和尺寸
    0.0, 0.5, 10.0,
    -0.5, -0.5, 20.0,
    0.5, -0.5, 30.0
]);
```

那么在缓冲区进行分配的时候可以借助`gl.vertexAttribPointer`的第 5 个参数和第 6 个参数差别地读取不同的数据. 以上面的数据为例:

首先读取顶点位置参数:

-   stride: 在缓冲区对象中, 单个顶点的所有数据的字节数, 也就是相邻两个顶点之间的距离, 也叫步进参数, 在前面的实例中, 缓冲区只有顶点的坐标数据, 所以设置为 0 即可
-   offset: 表示当前考虑的数据距离首个元素的距离, 也叫偏移参数, 顶点的坐标数据是放在最前面的, 所以 offset 为 0.

```js
// 缓冲区对象
var vertexTexCoordBuffer = gl.createBuffer();
// 字节单位长度
var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
```

然后按照一样的原理, 读取顶点的大小数据:

```js
//将顶点尺寸写入缓冲区对象并开启
let a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 3, FSIZE * 2);
gl.enableVertexAttribArray(a_PointSize);
```

## varying 变量的传递

首先修改着色器的代码, 它看起来差不多这样:

```js
let VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'varying vec4 v_Color;\n' + //varying变量
    'void main() {\n' +
    '  gl_Position = a_Position;\n' +
    '  gl_PointSize = 10.0;' +
    '  v_Color = a_Color;\n' + //将数据传给片元着色器
    '}\n';

// Fragment shader program
let FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';
```

在 WebGL 中, 如果顶点着色器与片元着色器中类型和命名都相同的 varying 变量, 那么顶点着色器赋值给该变量的值就会被自动地传入片元着色器.

要对 `varying` 更深刻的理解, 需要理解顶点着色器到片元着色器之间的图元装配过程和 varying 的插值过程. 此处不再展开记述

## 创建图片纹理映射

在 webgl 中, 要进行纹理映射, 需要遵循以下四步:

1. 准备映射到几何图形上的纹理图像
2. 为几何图形配置纹理映射方式
3. 加载纹理图像,进行配置和使用
4. 在片元着色器中将相应的纹素从纹理中抽取出来, 并将纹素的颜色赋给片元

来看一段代码示例:

```js
//矩阵纹理渲染
// 顶点着色器
var VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "attribute vec2 a_TexCoord;\n" +
  "varying vec2 v_TexCoord;\n" +
  "void main() {\n" +
  "  gl_Position = a_Position;\n" +
  "  v_TexCoord = a_TexCoord;\n" +
  "}\n";

// 片元着色器
var FSHADER_SOURCE =
  "#ifdef GL_ES\n" +
  "precision mediump float;\n" +
  "#endif\n" +
  "uniform sampler2D u_Sampler;\n" +
  "varying vec2 v_TexCoord;\n" +
  "void main() {\n" +
  "  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n" +
  "}\n";

function main() {
  ...

  //设置顶点信息
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log("Failed to set the vertex information");
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // 配置纹理
  if (!initTextures(gl, n)) {
    console.log("Failed to intialize the texture.");
    return;
  }
}

function initVertexBuffers(gl) {
  var verticesTexCoords = new Float32Array([
    // 顶点坐标和纹理坐标
    -0.5,  0.5,   0.0, 1.0,
    -0.5, -0.5,   0.0, 0.0,
     0.5,  0.5,   1.0, 1.0,
     0.5, -0.5,   1.0, 0.0,
  ]);
  var n = 4; // The number of vertices

  // 创建缓冲区对象
  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }

  // 将顶点坐标和纹理坐标写入缓冲区对象
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  gl.enableVertexAttribArray(a_Position); // Enable the assignment of the buffer object

  //获取纹理坐标地址
  var a_TexCoord = gl.getAttribLocation(gl.program, "a_TexCoord");
  if (a_TexCoord < 0) {
    console.log("Failed to get the storage location of a_TexCoord");
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  gl.enableVertexAttribArray(a_TexCoord); // 开启纹理坐标

  return n;
}

function initTextures(gl, n) {
  var texture = gl.createTexture(); // 创建纹理对象
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  // 获取u_Smapler的存储位置
  var u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler");
  if (!u_Sampler) {
    console.log("Failed to get the storage location of u_Sampler");
    return false;
  }
  var image = new Image(); // 创建image对象
  if (!image) {
    console.log("Failed to create the image object");
    return false;
  }
  // 注册图像加载事件响应函数
  image.onload = function() {
    loadTexture(gl, n, texture, u_Sampler, image);
  };
  // 告诉浏览器去加载图像
  image.src = "../resources/sky.jpg";

  return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //对纹理图像进行y周翻转
  // 开启0号纹理单元
  gl.activeTexture(gl.TEXTURE0);
  // 向target绑定纹理对象
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 配置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // 配置纹理图像
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  //将0号纹理传递给着色器
  gl.uniform1i(u_Sampler, 0);

  gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}
```

1. 首先在`initVertexBuffers()`函数中将纹理坐标传入顶点着色器, 然后将纹理坐标分配给`a_TextCoord`, 并开启它.
2. 然后再`initTextures()`函数中创建纹理对象
3. 创建 image 对象异步加载纹理图像, 之后调用`loadTexture()`函数处理纹理图像
4. 在`loadTexture()`中, 首先使用`gl.pixelStorei()`需要对纹理图像进行 y 轴反转, 因为在 webgl 中纹理系统中的 t 轴的方向和图片的坐标系统中的 y 轴的方向是相反的.
5. 然后使用`gl.activeTexture()`激活纹理单元.
6. 绑定纹理对象(`gl.bindTexture()`)
7. 配置纹理对象的参数(`gl.texParameteri()`)
8. 将图像分配给纹理对象(`gl.texImageD()`)
9. 将纹理单元传递给片元着色器(`gl.uniform1i()`)
10. 顶点着色器获得纹理坐标, 传递给片元着色器
11. 片元着色器使用内置函数 `texture2D`抽取纹素颜色

传递多幅纹理的方法, 可以看片元着色器代码:

```glsl
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
varying vec2 v_TexCoord;
void main() {
  vec4 color0 = texture2D(u_Sampler0, v_TexCoord);
  vec4 color1 = texture2D(u_Sampler1, v_TexCoord);
  gl_FragColor = color0 * color1;
};
```

主要就是重复的传入两张纹理, 然后进行矢量相乘

## 隐藏面消除

webgl 在默认情况下会按照缓冲区中的顺序绘制图形, 而且后绘制的图形会覆盖先绘制的图形, 因为这样做很高效. 如果场景中的对象不发生运动, 这样做是没有问题的, 但是当我们移动视角的时候, 是不可能事先决定事物的出现顺序的.

为了解决这个问题, WebGL 提供了 **隐藏面消除(hidden surface removal)** , 这个功能会帮助我们消除那些被遮挡的表面(隐藏面), 使我们可以放心的绘制场景, 交给系统去判断物体的远景关系. 开启这个功能只需要两步:

```js
//开启隐藏面消除功能
gl.enable(gl.DEPTH_TEST);

//绘制之前, 清除深度缓冲区
gl.clear(gl.DEPTH_BUFFER_BIT);
```

## 多边形偏移(polygon offset)

多边形偏移是为了解决深度冲突的问题, 该机制就是自动在 Z 值上面增加一个偏移量, 偏移量的值由物体表面相对于观察者视线的角度来确定. 启用该机制只需要两行代码:

```js
//启用多边形偏移
gl.enable(gl.POLYGON_OFFSET_FILL);
//在绘制之前指定用来计算偏移量的参数
gl.polyginOffset(1.0, 1.0);
```

## 创建正方体

```js
//顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// 片元着色器
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

function main() {
    var canvas = document.getElementById('webgl');

    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    //开启深度检测
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of u_MvpMatrix');
        return;
    }

    // 设置观察点和透视投影
    var mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);

    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var verticesColors = new Float32Array([
        // Vertex coordinates and color
        1.0,1.0,1.0,1.0,1.0,1.0, // v0 White
        -1.0,1.0,1.0,1.0,0.0,1.0, // v1 Magenta
        -1.0,-1.0,1.0,1.0,0.0,0.0, // v2 Red
        1.0,-1.0,1.0,1.0,1.0,0.0, // v3 Yellow
        1.0,-1.0,-1.0,0.0,1.0,0.0, // v4 Green
        1.0,1.0,-1.0,0.0,1.0,1.0, // v5 Cyan
        -1.0,1.0,-1.0,0.0,0.0,1.0, // v6 Blue
        -1.0,-1.0,-1.0,0.0,0.0,0.0 // v7 Black
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0,1,2,0,2,3, // front
        0,3,4,0,4,5, // right
        0,5,6,0,6,1, // up
        1,6,7,1,7,2, // left
        7,4,3,7,3,2, // down
        4,7,6,4,6,5 // back
    ]);

    // Create a buffer object
    var vertexColorBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    if (!vertexColorBuffer || !indexBuffer) {
        return -1;
    }

    // Write the vertex coordinates and color to the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);
    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}
```
`main`函数的流程如下:

1. 首先使用`initVertexBuffers()`函数将顶点数据写入缓冲区. 
2. 然后开启隐藏面消除, 使WebGL能够根据立方体各表面的前后关系正确的进行绘制.
3. 设置视点和可视空间, 吧模型视图投影矩阵传给顶点着色器中的`u_MvpMatrix`变量
4. 清空颜色和深度缓冲区, 使用`gl.drawElements`绘制立方体.


这种情况下, 我们无法将颜色定义在索引值上, 颜色仍然是依赖于顶点的.

如果需要创建每个表面都是不同颜色的正方体, 我们需要将顶点重绘三次. 

## 多颜色的正方体

本节中的代码与上一节的束腰区别在于顶点数据存储在缓冲区中的形式:

1. 本节中将顶点坐标和颜色分别存储在不同的缓冲区中
2. 顶点数据, 颜色数组和索引数组进行了修改
3. 为了程序结构紧凑, 定义了函数`initArrayBuffer()`, 封装了缓冲区对象的创建, 绑定, 数据写入和开启等操作.

```js
...
function main() {
  ...
  var n = initVertexBuffers(gl);
  ...
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
   ...
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var colors = new Float32Array([     // Colors
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  ...
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
  ]);

  var indices = new Uint8Array([       // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  ...
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
 ...
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
```

## 平行光下的漫反射

以一个立方体为例展示不同条件下的光照效果, 首先计算好每个平面的法向量, 接下来就是将数据传给着色器程序. 以前的程序把颜色作为"逐顶点数据"存储在缓冲区中, 并传给做色器, 对法向量数据也可以这样. 

```js
// LightedCube.js
// 顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        //法向量
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // 光线颜色
  'uniform vec3 u_LightDirection;\n' + // 归一化的世界坐标
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position ;\n' +
  // 对法向量进行归一化
  '  vec3 normal = normalize(a_Normal.xyz);\n' +
  //计算光线方向和法向量的点击
  '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
  // 计算漫反射光的颜色
  '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '  v_Color = vec4(diffuse, a_Color.a);\n' +
  '}\n';
...

function main() {
...

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 设置顶点坐标, 颜色和法向量
  var n = initVertexBuffers(gl);
...

  // Get the storage locations of uniform variables and so on
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
...

  // 设置光线颜色为白色
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // 设置光线方向
  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // 归一化
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // 计算模型视图投影矩阵
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
  // 将模型视图投影矩阵传给u_MvpMatrix变量
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
...
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // 顶点坐标
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);

...

  var normals = new Float32Array([    // 法向量
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

...
  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

...

  return indices.length;
}
...
```

顶点着色器中`a_Color`变量表示表面基底色, `a_Normal`变量表示表面法线方向, `u_LightColor`变量表示入射光颜色, `u_LightDirection`变量表示入射光方向. 注意, 入射光方向`u_LightDirection`是在世界坐标系下的, 而且在转入着色器之前已经在 js 中归一化了, 这样就能避免在顶点着色器每次执行的时候都对它进行归一化.

有了这些信息, 就可以在顶点着色器中进行计算了. `a_Normal`变量是 vec4 类型的, 使用前三个分量 x,y,z 表示法线方向, 所以我们将这三个分量提取出来进行归一化, 对 vec3 类型的变量进行归一化就不必这样. 本例使用 vec4 类型的`a_Normal`变量是为了方便对下一个示例程序进行扩展. GLSL ES 提供了内置函数`normalize()`对矢量常函数进行归一化. 归一化的结果赋给 vec3 类型的 normal 变量供之后使用.


```GLSL
float nDotL = max(dot(u_LightDirection, normal), 0.0);
```

光线方向存储在`u_lightDirection`变量中, 而且已经被归一化了, 可以直接使用. 法线方向存储在之前进行归一化后的结果 normal 变量中. 使用 GLSL ES 提供的内置函数`dot()`计算两个矢量的点击`<光线方向>·<法线方向>`, 该函数接受两个矢量作为参数, 返回它们的点积, 如果点积大于 0, 那就将点积赋值给`nDotL`, 如果小于 0, 就直接赋值 0. 因为点积值小于 0 意味着 cosθ 大于 90 度.说明光线照射在表面的背面上, 因此赋值 0.

a_Color 变量就是顶点的颜色. 被从 vec4 对象转换成了 vec3 对象, 因为其第四个分量(透明度)与计算的式子无关.

实际上, 物体表面的透明度确是会影响物体的外观. 但这里的光照计算较为复杂, 我们暂时认为物体是不透明的, 这样就计算出了漫反射光的颜色`diffuse`:

```GLSL
vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
v_Color = vec4(diffuse, a_Color.a);
```

然后, 将`diffuse`的值赋给`v_Color`并补上第 4 分量.

顶点着色器运行的结果就是计算出了`v_Color`变量. 下面看一下 js 如何将数据传给顶点着色器的.


接下来就是js的程序流程:

js 将光的颜色`u_LightColor`和方向`u_LightDirection`传给顶点着色器. 首先用`gl.uniform3f`函数将`u_LightColor`赋值为(1.0,1.0,1.0),表示入射光是白光.

```js
gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
```

下一步是设置光线方向, 注意光线方向必须被归一化. cuon-matrix 为 vector3 类型提供了归一化函数,使用方法就像代码所展示的那样. 注意 js 和 GLSL ES 对矢量归一化有不同之处.

归一化之后, 使用`gl.uniform3fv`将其分配给着色器中的`u_LightDirection`变量, 最后再`initVertexBuffers`函数中为每个顶点定义法向量. 法向量数据存储在 normal 数组中, 然后被`initArrayBuffer()`函数传给了顶点着色器的`a_Normal`变量.


## 环境光下的漫反射

环境光是由墙壁等其他物体反射产生的, 所以环境光的强度通常比较弱, 假设环境光是较弱的白光(0.2,0.2,0.2), 而物体表面是红色的(1.0,0.0,0.0), 根据式子, 有环境光产生的反射光颜色就是暗红色(0.2,0.0,0.0).

```js
// LightedCube_ambient.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
 ...
  'uniform vec3 u_AmbientLight;\n' +   // Color of an ambient light
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
...
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
     // Add the surface colors due to diffuse reflection and ambient reflection
  '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +
  '}\n';

...

function main() {
 ..
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
 ...
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

 ...
}

...
```

这个示例程序相比较上一个而言, 只修改了关键的几处代码.

顶点着色器中新增了`u_AmbientLight`变量用来接受环境光的颜色值. 接着根据式子, 使用该变量和表面的基底色`a_Color`计算出反射光的颜色, 将其存储在`ambient`变量中. 这样我们就有环境反射产生的颜色`ambient`和平行光漫反射产生的颜色`diffuse`. 最后根据式子进行计算.

## 运动物体的光照效果

立方体旋转时, 每个表面的法向量也会随之变化. 一般规律如下:

-   平移变换不会改变法向量, 因为平移不会改变物体的方向.
-   旋转变换会改变法向量
-   缩放变换对法向量的影响比较复杂, 如果缩放比例在所有轴上都一致的话, 法向量不会变化. 即是物体在某些轴上的缩放比例并不一致, 法向量也并不一定会变化.

## 点光源光

与平行光相比, 点光源发出的光, 在三维空间的不同位置上其方向也不同. 所以对点光源光下的物体进行着色时需要在每个入射点计算点光源光在该处的方向.

下面来看一个示例程序:

```js
// PointLightedCube.js (c) 2012 matsuda
// 顶点着色器程序
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  ...
  'uniform mat4 u_ModelMatrix;\n' +   // 模型矩阵
  'uniform mat4 u_NormalMatrix;\n' +  // 用来变换法向量的矩阵
  'uniform vec3 u_LightColor;\n' +    // 光的颜色
  'uniform vec3 u_LightPosition;\n' + // 光源位置(世界坐标系)
  'uniform vec3 u_AmbientLight;\n' +  // 环境光颜色
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // 计算比那换后的法向量并归一化
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
  '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
  '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +
  '}\n';

...

function main() {
 ...

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
 ...
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
...

  //设置光的颜色
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
 ...

  var modelMatrix = new Matrix4();  // 模型矩阵
  var mvpMatrix = new Matrix4();
  var normalMatrix = new Matrix4();

  modelMatrix.setRotate(90, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  ...
}
```

最关键的变化发生在顶点着色器中. 首先使用模型矩阵变换顶点坐标, 获得顶点在世界坐标系中的坐标(即变换后的坐标), 以便计算点光源光在顶点出的方向. 点光源向四周放射光线, 所以顶点出的光线方向是由点光源坐标减去顶点坐标而得到的矢量. 点光源在世界坐标系中的坐标已经传给了着色器中的`u_LightPosition`, 而前面已经算出了顶点在世界坐标系中的坐标, 这样就计算出了光线方向矢量. 注意归一化. 最后点积运算.

## 逐片元光照

要在表面的每一点上计算光照产生的颜色, 似乎时刻不可能完成的任务. 但实际上, 我们只需要逐片元的进行计算. 终于使用上片元着色器了.

先来看示例程序:

```js
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    //  'attribute vec4 a_Color;\n' + // Defined constant in main()
    'attribute vec4 a_Normal;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' + // Model matrix
    'uniform mat4 u_NormalMatrix;\n' + // Transformation matrix of the normal
    'varying vec4 v_Color;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +
    'void main() {\n' +
    '  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);\n' + // Sphere color
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    // Calculate the vertex position in the world coordinate
    '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  v_Color = color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform vec3 u_LightColor;\n' + // Light color
    'uniform vec3 u_LightPosition;\n' + // Position of the light source
    'uniform vec3 u_AmbientLight;\n' + // Ambient light color
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    // Normalize the normal because it is interpolated and not 1.0 in length any more
    '  vec3 normal = normalize(v_Normal);\n' +
    // Calculate the light direction and make it 1.0 in length
    '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
    // The dot product of the light direction and the normal
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    // Calculate the final color from diffuse reflection and ambient reflection
    '  vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
    '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
    '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
    '}\n';
```

为了逐片元的计算光照, 你需要知道:

1. 片元在世界坐标系下的坐标
2. 片元出表面的法向量.

可以在顶点着色器中, 将顶点的世界坐标和法向量以 varying 变量的形式传入片元着色器, 片元着色器中的同名变量就已经是内插后的逐片元值了.

顶点着色器使用模型矩阵乘以顶点坐标计算出顶点的世界坐标, 将其赋值非 v_Position 变量. 经过内插过程后, 片元着色器就获得了逐片元的 v_Position 变量, 也就是片元的世界坐标, 类似的, 同样的去获取法向量.

片元着色器计算光照效果的方法和前面相同, 首先对法向量进行归一化,饭后分别计算点光源光和环境光产生的反射光的颜色, 并将两个结果加起来, 赋值给 gl_FragColor, 片元就会显示为这个颜色.

如果场景中有超过一个点光源, 那么就需要在片元着色器中计算每一个点光源(以及环境光)对片元的颜色贡献, 并将他们全部加起来.
