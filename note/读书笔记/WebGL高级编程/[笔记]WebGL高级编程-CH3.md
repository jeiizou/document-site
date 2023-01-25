---
title: '[笔记]WebgGL高级编程-CH3'
date: 2019-07-26 11:25:09
mathjax: true
category:
    - 笔记
    - WebGL高级编程
tags:
    - webgl
---

> WebGl 高级编程指南一书的学习摘录笔记-第三章 绘图

<!-- more -->

## 第三章 绘图

### 使用 WebGL 绘制图元和绘图方法

`gl.drawArray()`是绘制图元的两个可用方法之一. 另一个方法是`gl.drawElements()`. 下面会介绍这两个方法. 此前, 首先讨论顶点可以定义那些图元. 下面介绍的图元是可以作为`gl.drawArray()`或`gl.drawElements()`方法的第一个参数传入的图形对象

#### 图元

可以用 WebGL 建立复杂的 3D 模型, 但是, 这些 3D 模型都是由以下三种基本几何图元构建的:

-   三角形
-   线
-   点精灵

1. 三角形

点是用来构建几何对象的基本单元. 但是在 3D 图形硬件的角度来看, 三角形才是实际上的基本单元. 虽说一个三角形需要三个顶点, 但是在硬件优化以后, 三角形是快速绘制的. WebGL 中可以使用各个不同的三角形图元是 WebGLRenderingCOntext 的一部分:

-   gl.TEIANGLES: 基本三角形图元, 必须为每个三角形定义 3 个顶点, 利用他们可以绘制独立的三角形, 三角形数量=顶点数/3
-   gl.TRIANGLE_STRIP: 三角形带, 第一个三角形(V0,V1,V2), 第二个三角形(V2,V1,V3), 因为第一个三角形逆时针定义, 所以后续所有三角形必须与第一个三角形顺序一致, 三角形数量=顶点数-2
-   gl.TRIANGLE_FAN: 三角山, 第一个三角形(V0,V1,V2), 第二个三角形(V0,V2,V3), 三角形数量=顶点数-2

![](/img/WebGL2/TIM截图20190126094500.png)

2. 线

虽然 3D 图形主要与三角形绘制有关, 但是有时也需要绘制线, 下面是常用的三种不同的线图元:

-   gl.LINES: 独立线, 不重用任何顶点, 线数量=count/2
-   gl.LINE_STRIP: 线带, 首尾相连的线. 线数量=count-1
-   gl.LINE_LOOP: 线环, 绘制方式类似于线带, 区别在于形成了闭环, 线数量=count

![](/img/WebGL2/360截图18141219171813.png)

3. 点精灵

最后一种图元是点精灵, 它可以用 gl.POINTS 绘制得到. 绘制点精灵时, 一个点精灵由顶点数据中的一个坐标来决定. 在使用点精灵是, 还需要在顶点着色器中设置点精灵的大小, 即要给内置的特殊变量 gl_PointSize 设置像素大小.

支持的点精灵大小与硬件有关, 保存在 gl_PointSize 中的值会截断为硬件支持的某个点大小范围. 硬件支持的最大点大小至少为 1. 在下面的顶点着色器示例中, 点大小设置为直径 5 个像素:

```glsl
attribute vec3 aVertextPos
void main(){
  gl_Position = vec4(aVertexPos,1.0);
  gl_PointSize = 5.0
}
```

在 WebGL 中, 点精灵经常用来呈现粒子效果. 粒子效果常用来实时模拟真实的自然现象. 比如: 爆炸, 大火, 烟雾, 灰尘等. 粒子效果在 3D 图形中比较常见. 该书不介绍.

#### 顶点组绕顺序

在 WebGL 中, 三角形的一个重要属性是顶点组绕顺序. 三角形的奠定组绕顺序是逆时针(CCW)或者顺时针(CW), 当三角形按顶点的逆时针顺序构建时, 我们称它的组绕顺序为逆时针. 反之亦然.

组绕顺序之所以很重要是因为它决定了三角形的面是否朝向观察者, 朝向观察者的三角形为正面三角形, 否则为背面三角形. 在许多情形中, WebGL 不需要背对三角形进行光栅化处理.

![](/img/WebGL2/360截图17571120757768.png)

可以使用一些方法来剔除这些无法看到的面:

-   gl.frontFace(gl.CCW): 采用逆时针的三角形是正面三角形(这是 WebGL 默认的做法), 顺时针传入`gl.CW`
-   gl.enable(gl.CULL_FACE): 激活面剔除功能(默认该功能处于禁用状态)
-   gl.cullFace(gl.BACK): 剔除背面三角形(默认处理方式), 如果要剔除正面, 传入`gl.FROMT`

#### WebGL 绘图方法

在 WebGL 中, 有三个方法可以用来更新绘图缓冲:

-   gl.drawArrays()
-   gl.drawElements()
-   gl.clear()

但是在绘制几何对象时, 必须使用前两个方法中的一个. 第三个方法用于把全部像素设置为一个事先用`gl.clearColor()`定义的颜色. 我们在前面已经用过`gl.drawArrays()`方法, 现在来看看它的详细介绍:

##### 1. gl.drawArrays() 方法

gl.drawArrays()方法根据启用的 WebGLbuffer 对象中的顶点数据, 绘制由第一个参数定义的图元. 启用的 WebGLBuffer 对象绑定到 gl.ARRAY_BUFFER 目标上.

在调用该方法之前, 必须执行以下操作:

-   gl.createBuffer()=>建立一个 WebGLBuffer 对象
-   gl.bindBuffer()=>把 WebGLBuffer 对象绑定到 gl.ARRAY_BUFFER 目标
-   gl.bufferDate()=>把顶点数据载入到缓冲中
-   gl.enableVertexAttribute()=>激活通用顶点属性
-   gl.vertexAttribPointer()=>把顶点着色器的属性连接到 WebGLBugger 对象中的正确数据

gl.drawArrays()定义如下:

```glsl
void drawArrays(GLenum mode,Gline fitst,GLsizei count);
```

-   mode: 定义了所要渲染的图元的类型, 可以取:
    -   gl.POINTS
    -   gl.LINES
    -   gl.LINE_LOOP
    -   gl.LINE_STRIP
    -   gl.TRIANGLE
    -   gl.TRIANGLE_STRIP
    -   gl.TRIANGLE_FAN
-   first: 定义顶点数据数组中的哪个索引用作第一个索引
-   count: 定义需要使用的顶点数

工作方式的概念图如下:

![](/img/WebGL2/360截图18180718281619.png)

`gl.drawArray`方法的设计要求表示图元的顶点必须按正确的顺序进行绘制, 如果顶点之间不存在共享, 则使用这种方法既简单有快速, 但是如果一个对象的表面由一个三角形网格组成, 而且每个顶点都比网格上的多个三角形共享, 则使用`gl.drawElements()`方法可能更好.

##### 2. gl.drawElements()方法

`gl.drawElements()`方法有时也称为索引绘图, 它可以进一步提高顶点的重用程度, 从前面可知, `gl.drawArrays()`直接使用一个或多个数组缓冲(即绑定到目标`gl.ARRAY_BUFFER`的`WebGLBuffer`对象), 这些数组缓冲以正确的顺序包含顶点数据. `gl.drawElements()`方法也利用包含顶点数据的数据缓冲, 但是它还是用一个元素数组缓冲(即绑定到`gl.ELEMENT_ARRAY_BUFFER`目标上的`WerbGLBuffer`)对象. 这个元素组缓冲包含了带有顶点数据的数组缓冲的索引.

这意味着, 顶点数据在数组缓冲中可以是任何顺序, 因为在元素数组缓冲对象中的索引决定`gl.drawElements()`方法使用的顶点的顺序(但从程序的性能来看,应尽可能按循序读取顶点的顺序). 此外要实现顶点共享, 这种方法比较容易实现, 即只要把元素数组缓冲中的某些项指向数组缓冲中的同一个索引.

![](/img/WebGL2/360截图16860706152220.png)

在调用`gl.drawElements()`方法之前, 需要先设置元素数组缓冲:

-   gl.createBuffer()=> 创建一个 WebGLBuffer 对象
-   gl.bindBuffer()=>把这个 WebGLBuffer 对象绑定到`gl.ELEMENT_ARRAY_BUFFER`目标上

用`gl.bufferDate()`把决定顶点数据使用顺序的索引载入到此缓冲中.

```glsl
void drawElements(GLenum mode,GLsizei count,GLenum type,GLintptr offset);
```

-   mode: 与`drawArrays()`的`mode`参数一样.
-   count: 绑定到`gl.ELEMENT_ARRAY_BUFFER`目标上的缓冲中的索引数.
-   type: 元素索引的类型, 元素索引存储在绑定到`gl.ELEMENT_ARRAY_BUFFER`目标上的缓冲中, 可以指定`gl.UNSIGNED_BYTE`或者`gl.UNSIGNED_SHORT`
-   offset: 定义绑定到`gl.ELEMENT_ARRAY_BUFFER`目标的缓冲中的偏移量, 索引从此处开始.

##### 3. 退化三角形

从性能的角度看, 以上两个函数的调用次数越少越好. 如果使用独立三角形图元(`gl.TRIANGLES`)很容易实现, 但是如果使用`gl.TRANGLE_STRIP`图元, 则当三角形带之间存在不连续性是, 就不那么容易组合不同的三角形带.

这种不连续性或在两个三角形带间存在跳转的解决方法是插入额外的索引, 这样就得到退化三角形.

退化三角形是指三角形至少有两个索引是相同的. 因此存在面积为 0 的三角形, 这样的三角形很容易被 GPU 检测并删除.

连接两个三角形带需要增加额外的索引, 额外索引的数量取决于第一个三角形带所使用的索引数. 这是因为, 三角形的组绕顺序起决定作用. 假设我们想使第一个和第二个三角形带都使用相同的组绕顺序, 则需要考虑两种:

-   第一个三角形带有偶数个三角形, 则为了链接第二个三角形带, 则需要增加两个额外的索引
-   如果第一个三角形带包含奇数个三角形, 则为链接第二个三角形带, 则为了保证组绕顺序不变而需要增加 3 个额外的索引.

![](/img/WebGL2/微信截图_20190126180815.png)

如上图所示, 为了连接这两个三角形带, 需要在这两个三角形带之间添加两个额外的索引.

![](/img/WebGL2/微信截图_20190126181628.png)

对于奇数个三角形添加索引的方式如上所示. 添加索引的目的是为了保证三角形带的组绕顺序不变.

### 类型化数组

在 js 中处理二进制数据并不是想 c/c++中那样方便. 为了处理二进制数据, 类型化数组规范定义了缓冲和一个或多个缓冲视图等概念. 缓冲是一个固定长度的二进制数据存储区, 有类型`ArrayBuffer`表示. 例如创建一个 8 字节的缓冲:

```js
var buffer = new ArrayBuffer(8);
```

我们无法直接对这个缓冲中的数据进行处理, 需要创建 ArrayBuffer 的一个视图.

```js
var viewFloat32 = new Float32Array(buffer);
var viewUint16 = new Unit16Array(buffer);
var viewUint8 = new Unit8Array(buffer);
```

![](/img/WebGL2/微信截图_20190126183735.png)

### 不同的绘图方法

在 WebGL 中, 最常绘制的图元可能是三角形, 绘制三角形可以使用`gl.drawArrays()`或者`gl.drawElements()`方法. 图元则常用`glTRUABGKES`或`gl.TRUANGLE_STRIP`.

![](/img/WebGL2/微信截图_20190126184302.png)

以上图的示例, 看看使用不同的方法来绘制有什么区别.

#### 1. gl.drawArrays()和 glTRIANGLES

对于这样的这, 不需要使用元素组缓冲, 每个三角形需要三个顶点:

-   需要的顶点=3x 三角形数=3x50=150 个顶点
-   所需内存=150 个顶点 x3x4(字节/顶点)=1800 字节

下面这段代码说明如何建立一个缓冲, 以及如何用这个方法绘制网格:

```js
function setupBuffers(){
    meshVertexPositionBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositionBuffer);

    var meshVertexPosition=[
        1.0,5.0,0.0,//v0
        0.0,5.0,0.0,//v1
        1.0,4.0,0.0,//v2

        1.0,4.0,0.0,//v3=v2
        0.0,5.0,0.0,//v4
        0.0,4.0,0.0,//v5

        1.0,4.0,0.0,//v6=v3=v2
        0.0,4.0,0.0,//v7=v5
        1.0,3.0,0.0,//v8

        1.0,3.0,0.0,//v9=v8
        0.0,4.0,0.0,//v10=v7=v5
        0.0,3.0,0.0,//v11

        ...

        5.0,0.0,0.0//v148
        4.0,1.0,0.0//v149
        4.0,0.0,0.0//v150
    ];

    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(meshVertexPositions),gl.STATIC_DRAW);
}

...

function draw(){
    ...
    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositonBuffer);

    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,meshVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

    gl.drawArrays(gl.TRIANGLES,0,meshVertexPositionBuffer.numberOfItems);
}
```

#### 2. gl.drawArrays()方法和 gl.TRIANGLE_STRIP 图元

这种模式也需要调用 gl.drawArrays()方法, 因此不需要元素数组缓冲. 然而由于使用了 gl.TRIANGLE_STRIP, 因此与独立三角形相比, 这种模式中的每个三角形需要较少的顶点.

-   所绘制三角形数=count-2
-   所需要的顶点数=所绘制三角形数+2=50+2=52
-   需要的内存大小=60 个顶点 x3x4(字节/顶点)=720 字节

3 个坐标, 每个 4 字节. 代码如下:

```js
function setupBuffers(){
    meshVertexPositionBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositionBuffer);

    var meshVertexPositions=[
        1.0,5.0,0.0,//v0
        0.0,5.0,0.0,//v1
        1.0,4.0,0.0,//v2
        0.0,4.0,0.0,//v3
        1.0,3.0,0.0,//v4
        0.0,3.0,0.0,//v5
        1.0,2.0,0.0,//v6
        0.0,2.0,0.0,//v7
        1.0,1.0,0.0,//v8
        0.0,1.0,0.0,//v9
        1.0,0.0,0.0,//v10
        0.0,0.0,0.0,//v11

        ...
        //连接三角形带创建的索引
        0.0,0.0,0.0,//索引1
        2.0,5.0,0.0,//索引2

        2.0,5.0,0.0,//v14
        1.0,5.0,0.0,//v15
        2.0,4.0,0.0,//v16

        ...

        4.0,1.0,0.0,//v58
        5.0,0.0,0.0,//v59
        4.0,0.0,0.0,//v60
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertexPositions),gl.STATIC_DRAW);
    meshVertexPositionBuffer.itemSize=3;
    meshVertexPositionBuffer.numberOfItems=60;

    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
}

...

function draw(){
    ...

    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositionBuffer);


    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, meshVertexPositionBuffer.itemSizem,gl.FLOAT,false,0,0);

    gl.drawArrays(gl.TRIANGLE_STRIP,0,meshVertexPositionBuffer.numberOfItems);
}
```

#### 3. gl.drawElements()方法和 gl.TRIANGLES 图元

如果使用 gl.drawElements()方法, 则需要定义一个数组缓冲保存顶点数据和一个元素数组缓冲保存索引. 对于数组缓冲, 由于实际上次网格只有 36 个不同的顶点, 因此只需要在数组缓冲中保存这 36 个顶点,所需内存:

-   数组缓冲所需内存=36 个顶点 x3x4(字节/顶点)=432 个字节
-   需要的索引=3x 所绘制三角形数=3x50=150 个索引
-   元素数组所需要的内存大小=150 个索引 x2(字节/索引)=300 字节
-   总内存=432+300=732 字节

```js
function setupBuffers(){
    meshVertexPositionBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositionBuffer);

    var meshVertexPositions=[
        1.0,5.0,0.0,//v0
        0.0,5.0,0.0,//v1
        1.0,4.0,0.0,//v2
        0.0,4.0,0.0,//v3
        1.0,3.0,0.0,//v4
        0.0,3.0,0.0,//v5
        1.0,2.0,0.0,//v6
        0.0,2.0,0.0,//v7
        1.0,1.0,0.0,//v8
        0.0,1.0,0.0,//v9
        1.0,0.0,0.0,//v10
        0.0,0.0,0.0,//v11

        ...

        4.0,1.0,0.0,//v34
        5.0,1.0,0.0,//v35
        4.0,0.0,0.0,//v36
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertexPositions),gl.STATIC_DRAW);
    meshVertexPositionBuffer.itemSize=3;
    meshVertexPositionBuffer.numberOfItems=36;

    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    meshIndexBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesgIndexBuffer);

    var meshIndex=[
        0,1,2,
        2,1,3,
        2,3,4,
        4,3,5,
        4,5,6,
        6,5,7,

        ...

        35,34,36
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(meshIndex),gl.STATIC_DRAW);
    meshIndexBuffer.itemSize=1;
    meshIndexBuffer.numberOfItems=150;
}

...

function draw(){
    ...

    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,meshVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,meshIndexBuffer);

    gl.drawElements(gl.TRIANGLES,meshIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}
```

#### 4. gl.drawElemnets()方法和 gl.TRIANLE_STRIP 图元

由于这种情形也要用到`gl.drawElements()`方法, 因此需要一个数组缓冲和一个元素数组缓冲. 数组缓冲的内容与前一个示例使用的数组缓冲完全一样. 这个网格需要 36 个完全不同的定点位置, 每个顶点位置由 x,y,z 三个坐标分量来确定, 每个分量占用 4 个字节, 因此所需要的内存为

-   数组缓冲所需要的内存=36x3x4=432 字节
-   所绘制的三角形=count-2
-   所需要的索引数=所绘制三角形数+2=50+2=52 个索引
-   元素缓冲内存=60 个索引 x2=120 字节
-   总内存=432+120=552

```js
function setupBuffers(){
    meshVertexPositionBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositionBuffer);

    var meshVertexPositions=[
        1.0,5.0,0.0,//v0
        0.0,5.0,0.0,//v1
        1.0,4.0,0.0,//v2
        0.0,4.0,0.0,//v3
        1.0,3.0,0.0,//v4
        0.0,3.0,0.0,//v5
        1.0,2.0,0.0,//v6
        0.0,2.0,0.0,//v7
        1.0,1.0,0.0,//v8
        0.0,1.0,0.0,//v9
        1.0,0.0,0.0,//v10
        0.0,0.0,0.0,//v11
        //start of colum 2
        2.0,5.0,0.0,//v12
        1.0,5.0,0.0,//v13
        2.0,4.0,0.0,//v14
        ...

        4.0,1.0,0.0,//v34
        5.0,1.0,0.0,//v35
        4.0,0.0,0.0,//v36
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshVertexPositions),gl.STATIC_DRAW);
    meshVertexPositionBuffer.itemSize=3;
    meshVertexPositionBuffer.numberOfItems=36;

    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    meshIndexBuffer=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesgIndexBuffer);

    var meshIndex=[
        0,1,2,
        3,4,5
        6,7,8
        9,10,11,
        11,12,//
        12,13,14,
        ...
        34,35,36
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(meshIndex),gl.STATIC_DRAW);
    meshIndexBuffer.itemSize=1;
    meshIndexBuffer.numberOfItems=60;
}

...

function draw(){
    ...

    gl.bindBuffer(gl.ARRAY_BUFFER,meshVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,meshVertexPositionBuffer.itemSize,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,meshIndexBuffer);

    gl.drawElements(gl.TRIANGLES,meshIndexBuffer.numberOfItems,gl.UNSIGNED_SHORT,0);
}
```

### 前期变换顶点缓存和后期变换顶点缓存

通过 WebGL 传递的顶点在到达 WebGL 流水线之前需要经过顶点着色的变换处理, 到达流水线之后, 顶点要经过图元装配, 光栅化, 片段着色, 逐片段处理, 最后作为像素出现在绘图缓冲中. 同一个顶点可能经常出现在网格的几个不同的三角形中. 这意味着如果已经对某一个顶点进行变换, 则之后对同一个顶点的变换都是多余的.

为了解决这问题, 现代的 GPU 都内置了一个缓存, 它通常称为后期变换顶点缓存, 它的使用时为了避免顶点着色器对同一个顶点多次处理. 一个顶点经过顶点着色器变换后就保存在后期变换顶点缓存中, 这缓存比较小, 而且采用先进先出(FIFO), 这意味着它只缓存最近变换的顶点的结果.

如果三角形的顶点安随机顺序传送, 则许多定点即使在前面已经经过变换也可能会未命中次缓存. 为了表示后期变换顶点缓存的效率, 采用 ACMR(平均缓存未命中率)这个概念, 定义为:

ACMR=缓存未命中次数/所绘制三角形数.

显然, ACMR 越小越好, 对于一个很大的网格, 三角形数接近于顶点数的两倍, 这在理论上意味着 ACMR 的最小值为 0.5, 即每个顶点都只变换一次. 但实际上最坏的情形是, 每个三角形的 3 个顶点都未命中缓存. 此时 ACMR 的值为 3.0.

如果网格的三角形按某一个方法进行组织可以使得后期变换顶点缓存能够得到充分利用, 则会提高性能. 现在已经有一些这类的工具了.

除了后期变换顶点缓存外，有些 GPU 还提供前期变换顶点缓存。 如果在前期变换定点缓存中没有找到一个顶点， 则需要读取这个顶点并把它传送给定点着色器进行变换。

当需要读取一个顶点时，通常同时把这个顶点附近的一块比较大的连续顶点数据块赌徒缓存中。 这意味着，及时在使用`gl.drawElements()`的索引绘图模式时， 定点数据在定点数组缓冲中也可以采用任何顺序，但是尽量使顶点的索引顺序与顶点的使用顺序相一致。

![](/img/WebGL2/TIM截图20190207112544.png)

### 为提高性能交叉存放顶点数据

在前面的大多数示例中, 顶点数据只包含顶点位置信息. 在实际的 WebGL 应用程序中, 顶点数据通常好包含更多的信息. 除了顶点位置信息, 还包括顶点发现, 顶点颜色和纹理坐标等.

当顶点包含多种数据时, 可以采用两种方法组织这些数据:

-   把每类顶点数据保存在 WebGLBuffer 对象的单独数组中, 这意味着, 除了顶点位置数据外, 可能还有其他数组, 例如法线数组. 这通常称为数组结构.
-   把所有类型的数据都保存在 WebGLBuffer 对象的一个数据中. 这意味着, 需要把不同类型的数据交叉保存在同一个数组中. 这通常称为结构数组.

一般来说, 第一个方法是建立缓冲并把数据载入缓冲的最简单方法. 每类顶点数据都有自己的顶点数组.

![](/img/WebGL2/TIM截图20190207113207.png)

如上图, 显示了当顶点数据包含了位置信息和颜色信息时的数组结构.

如果使用结构数组, 则在建立缓冲和载入数据时需要更多的操作. 下图显示了如何把位置数据和颜色数据交叉保存在同一个顶点数组中:

![](/img/WebGL2/TIM截图20190207113617.png)

从性能角度来看, 把顶点数据按交叉模式保存在一个结构数组中是首选的顶点数据组织方式. 这是因为它提供顶点数据的更好的内存局部性. 当顶点着色器需要某个顶点的位置数据时, 在同一个时刻, 它也可能需要同一个顶点的法线数据和纹理数据. 如果把这些数据保存在内存相近位置, 则读取其中一个数据很可能同时读取同一个块中的其他数据. 因此当顶点着色器需要它们时, 它们已经出现在前期变换顶点缓存中.

#### 结构数组的使用

理解结构数组的原理后, 使用结构数组实际上并不困难. 但是第一次使用时确实需要一点技巧, 因此, 这里提供了一个完整的示例介绍它的用法.
