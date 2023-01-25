# WebGL-常用函数

## gl.clearColor(red,green,blue,alpha) 设置`<canvas>`的背景

指定绘图区域的背景色.

一旦制定了背景色, 背景色就会驻村在 webgl system 中, 在下次调用`gl.clearColor`之前都不会改变.

可以在`gl.clearColor()`之后, 再调用`gl.clear(gl.COLOR_BUFFER_BIT`来使用设定好的背景色填充整个画布.

### 参数

-   red : 指定红色值(0.0~1.0)
-   green : 指定绿色值(0.0~1.0)
-   blue : 指定蓝色值(0.0~1.0)
-   alpha : 指定透明度值(0.0~1.0)

任何值小于 0.0 或者 1.0, 那么就会分别截断为 0.0 或 1.0

### 返回值

无

### 错误值

无

## gl.clear(buffer) 清除缓冲区

将制定缓冲区设定为预定的值, 如果清空的是颜色缓冲区, 那么将使用`gl.clearColor()`指定的值(作为预定值).

### 参数

-   buffer: 指定待清空的缓冲区, 位操作符 OR(|)可用来指定多个缓冲区
    -   gl.COLOR_BUFFER_BIT: 指定颜色缓存
    -   gl.DEPTH_BUFFER_BIT: 指定深度缓冲区
    -   gl.STENCIL_BUFFER_BIT: 指定模板缓冲区

### 返回值

-   无

### 错误

-   INVALID_VALUE: 不是以上三种缓冲区

### 其他说明

如果没有指定背景色, 则会应用默认值:

| 缓冲区     | 默认值            | 函数                   |
| ---------- | ----------------- | ---------------------- |
| 颜色缓冲区 | (0.0,0.0,0.0,0.0) | gl.clearColor(r,g,b,a) |
| 深度缓冲区 | 1.0               | gl.clearDepth(depth)   |
| 模板缓冲区 | 0                 | gl.clearStencol(s)     |

## gl.drawArray(mode,first,count) 绘制

指定顶点着色器, 按照 mode 参数指定的方式绘制图形. 当程序调用`gl.drawArray`时. 顶点着色器将被执行 count 次, 每次处理一个顶点. 在着色器执行的时候, 将调用并逐行执行内存的`main()`函数.

### 参数

-   mode: 指定绘制的方式, 接受如下变量
    -   `gl.POINTS`: 一系列的点
    -   `gl.LINES`: 线段, 如果点是基数, 则最后一个点将被忽略
    -   `gl.LINE_STRIP`: 线条, 中间的点是同时被前一段的终点和下一段的起点
    -   `gl.LINE_LOOP`: 回路, 在上面模式的基础上, 最后一个点和第一个点连起来形成闭环.
    -   `gl.TRIANGLES`: 一系列单独的三角形, 三的整数倍, 否则最后一两个点将被忽略.
    -   `gl.TRIANGLE_STRIP`: 一系列条带状的三角形, 依次是是(v0,v1,v2), (v2,v1,v3),(v2,v3,v4)...(第二个三角形的顺序是为了保持第二个三角形的绘制也按照逆时针的顺序).
    -   gl.TRIANGLE_FAN: 一系列三角形组成的类似于扇形的图形, 前三个点构成了第一个三角形, 接下来的一个点和前一个三角形的最后一条边组成接下来的一个三角形, 这些三角形会这样绘制:(v0,v1,v2),(v0,v2,v3)...
-   first: 指定从哪个顶点开始绘制(整型)
-   count: 指定绘制需要用到多少个顶点(整型)

![image](/assets/2021-4-22/drawArray.png)

### 返回值

无

### 错误

-   INVALID_ENUM: 传入的 mode 参数错误
-   INVALID_VALUE: 参数是负数

## gl.getAttributeLocation(program,bane) 获取 arrtibute 变量

获取由`name`参数指定的`attribute`变量的存储地址

### 参数

-   program: 指定包含顶点着色器和片元着色的着色器程序对象
-   name: 指定想要获取其存储地址的`attribute`变量的名称

### 返回值

-   大于等于 0:arrtibute 变量的存储地址
-   -1: 指定的 arrtibute 变量不存在, 或者其命名具有`gl_`或`webgl_`前缀

### 错误

-   INVALIS_OPERATION: 程序对象未能成功连接
-   INVALID_VALUE: name 参数的长度大于`attribute`变量名的最大长度.

## gl.getUniformLocation(program,name)

获取指定名称的 uniform 变量的存储位置, 除了在返回值的处理上与`attribute`对应函数有所区别, 其他使用方式是类似的.

### 参数

-   program: 指定包含顶点着色器和片元着色的着色器程序对象
-   name: 指定想要获取其存储地址的`uniform`变量的名称

### 返回值

-   non-null: uniform 变量的存储地址
-   null: 指定的 uniform 变量不存在, 或者其命名具有`gl_`或`webgl_`前缀

### 错误

-   INVALIS_OPERATION: 程序对象未能成功连接
-   INVALID_VALUE: name 参数的长度大于`uniform`变量名的最大长度.

## gl.vertexAttrib3f 向 attribute 变量赋值

将数据(v0,v1,v2)传递给由 location 参数指定的 arrtibute 变量

### 参数

-   location: 指定将要修改的 attribute 变量的存储位置
-   v0: 指定填充的 attribute 变量第一个分量的值
-   v1: 指定填充 attribute 变量的第二个分量的值
-   v2: 指定填充 attribute 变量的第三个分量的值

### 返回值

无

### 错误

-   INVALIS_OPERATION: 没有当前的 programe 对象
-   INVALID_VALUE: location 大于等于 attribute 变量的最大数目(默认为 8)

### 其他说明

`gl.vertextAttrib3f()`是一系列同族函数中的一个, 该系列函数的任务就是从 js 向顶点着色器中的 attribute 变量传值.

-   `gl.vertexAttribut1f()` : 传输 1 个单精度值(v0),
-   `gl.vertexAttrib2f()` : 传输两个值(v0,v1),
-   `gl.vertexAttrib4f()` : 传输 4 个值(v0,v1,v2v,v3);

这些方法还有矢量版本:

```js
var position = new Float32Array([1.0, 2.0, 3.0, 1.0]);
gl.vertexAttrib4fv(a_Position, position);
//4_f_v 分别表示 4个矢量中元素个数 浮点数(f浮点,i整数) 矢量
```

这里再插一点, 关于 webgl 函数的命名:

```
gl.vertexAttrib[1234][f|i](v) (location,v0,v1,v2);
```

-   `vertextAttrib`基础函数名
-   `3`是参数个数
-   `f`是参数类型, `f`表示浮点数, `i` 表示整数
-   `v` 表示函数也可以接受数组作为参数, 这种情况下, 数字表示数组中元素的个数

```js
var positions = new Float32Array([1.0, 2.0, 3.0, 1.0]);
gl.vertexAttrib4fv(a_Posiyion, positions);
```

## gl.uniform4f(location,v0,v1,v2,v3)

将数据(v0,v1,v2)传递给由 location 参数指定的 uniform 变量

### 参数

-   location: 指定将要修改的 uniform 变量的存储位置
-   v0: 指定填充的 uniform 变量第一个分量的值
-   v1: 指定填充 uniform 变量的第二个分量的值
-   v2: 指定填充 uniform 变量的第三个分量的值

### 返回值

无

### 错误

-   INVALIS_OPERATION: 没有当前的 programe 对象, 或者 location 是非法的变量存储位置

### 其他说明

`gl.uniform4f()`与`gl.vertextAttrib3f()`类似. 也有一系列的同族函数:

-   `gl.uniform1f(location,v0)`
-   `gl.uniform2f(location,v0,v1)`
-   `gl.uniform3f(location,v0,v1,v2)`
-   `gl.uniform4f(location,v0,v1,v2,v3)`

## gl.uniformMatrix4fv(location, transpose,array) 向矩阵数组传递变量

将 array 表示的 4X4 的矩阵分配给由 location 指定的 uniform 变量

### 参数

-   location: uniform 变量的存储位置
-   Transpose: 在 WebGL 中必须指定为 false
-   array: 待传输的类型化数组, 4X4 矩阵按列主序存储在其中

### 返回值

无

### 错误

-   INVALID_OPRTATION 不存在当前程序对象
-   INVALID_VALUE transpose 不为 false, 或者数组的长度小于 16

## gl.createBuffer() 创建缓冲区

创建缓冲区对象

### 参数

无

### 返回值

-   非 null: 新创建的缓冲区对象
-   null: 创建缓冲区对象失败

### 错误

无

## gl.deleteBuffer(bugger) 删除缓冲区

删除参数 buffer 表示的缓冲区对象

### 参数

-   buffer: 待删除的缓冲区对象

### 返回值

无

### 错误

无

## gl.bindBuffer(target,buffer) 绑定缓冲区

允许使用 buffer 表示的缓冲区对象并将其绑定到 target 表示的目标上. 在创建缓冲区之后进行.

### 参数

-   target:可以是一下中的一个
    -   gl.ARRAY_BUFFER : 表示缓冲区中对象中包含了顶点的数据
    -   gl.ELEMENT_ARRAY_BUFFER : 表示缓冲区对象中包含了顶点的索引值
-   buffer 指定之前由`gl.createBUffer`创建的待绑定的缓冲区对象, 如果指定为 null, 则禁用对 target 的绑定

### 返回值

无

### 错误

-   INVALID_ENUM: target 不是枚举值之一, 此时将保持原有的绑定不变.

## gl.buggerData(target,data,usage) 向缓冲区写入数据

开辟存储空间, 向绑定在 target 上的缓冲区对象中写入数据 data

### 参数

-   target: `gl.ARRAY_BUFFER`或`gl.ELEMENT_ARRAY_BUFFER`
-   data: 写入缓冲区对象的数据
-   usage: 表示程序将如何使用存储在缓冲区对象中的数据, 该参数将帮助 webgl 优化操作, 但是就算传入了错误的值, 也仅仅是降低程序的效率
    -   `gl.STATIC_DRAM`: 只会向缓冲区对象中写入一次数据, 但需要绘制很多次.
    -   `gl.STREAM_DRAM`: 只会向缓冲区对象中写入一次数据, 然后绘制若干次.
    -   `gl.DYNMAIC_DRAM`: 会想缓冲区对象中多次写入数据, 并绘制很多次.

### 返回值

无

### 错误

-   INVALID_ENUM: target 不是上述值之一, 这是将保持原有的绑定情况不变

## gl.vertexAttribPointer(location, size, type, normalizedmstride, offset) 将缓冲区对象分配给 arrtibute 变量

将绑定到`gl.ARRAY_BUFFER`的缓冲区对象分配给由 `location` 指定的 `attribute` 变量

### 参数

-   location: 指定待分配 attribute 变量的存储位置
-   size: 指定缓冲区中每个顶点的分量个数(1~4). 若 size 比 arrtibute 变量数小, 确实分量会按与`gl.vertexAttrib[1234]f`相同的规则不全: 2,3 分量自动为 0, 4 分量自动为 1
-   type: 可选以下类型:
    -   `gl.UNSIGNED_BYTE`: 无符号字节, Uint8Array
    -   `gl.SHORT`: 短整型, Int16Array
    -   `gl.UNSIGNED_SHORT`: 无符号短整型, Uint16Array
    -   `gl.INT`: 整型, Int32Array
    -   `gl.UNSIGNED_INT`: 无符号整型, Uint32Array
    -   `gl.FLOAT`: 浮点型, Float32Array
-   normalize: 传入`boolean`, 表明是否将非浮点型的数据归一化到[0,1]或[-1,1]区间.
-   stride: 指定相邻两个顶点间的字节数, 默认为 0
-   offset: 指定缓冲区对象中的偏移量(以字节为单位), 即 attribute 变量从缓冲区中的何处开始存储, 如果从起始位置开始,offset 为 0

### 返回值

无

### 错误

-   INVALID_OPERATION: 不存在当前程序对象
-   INVALID_VALUE: location 大于等于 attribute 变量的最大数目(默认为 8), 或者 stride/offset 为负数

## gl.enableVertexAttribArray(location) 开启 attribute 变量

为了使顶点着色器能够访问缓冲区内的数据, 我们需要使用`gl.enableVertexAttribArray()`方法来开启 attribute 变量.

当执行该函数并传入一个已经分配好换中去的 attribute 变量后, 我们就开启了该变量, 也就是说, 缓冲区对象和 attribute 变量之间的链接就建立起来了.

### 参数

-   location 指定`attribute`变量的存储位置

### 返回值

无

### 错误

-   INVALID_VALUE: location 大于等于 `attribute` 变量的最大数目(默认为 8),

## gl.enableVertexAttribArray(location) 关闭 attribute 分配

关闭 location 指定的 attribute 变量

### 参数

-   location 指定`attribute`变量的存储位置

### 返回值

无

### 错误

-   INVALID_VALUE: location 大于等于 `attribute` 变量的最大数目(默认为 8),

### 其他说明

在开启`attribute`变量后, 就不能再用`gl.vertexAttribute[1234]f`向它传递数据了, 除非显示的关闭该`attribute`变量. 实际上, 你无法同时使用这两个函数.

## gl.createTexture() 创建纹理对象

创建纹理对象来存储纹理图像

### 参数

无

### 返回值

-   non-null: 新创建的纹理对象
-   null: 创建纹理对象失败

### 错误

无

## gl.deleteTexture(texture) 删除纹理对象

使用 texture 删除纹理对象

### 参数

-   texture: 待删除的纹理对象

### 返回值

无

### 错误

无

## gl.pixelStorei(panme,param) 处理图像

使用 pname 和 param 指定的方式处理加载得到的图像

### 参数

-   pname: 可以是以下二者之一
    -   gl.UNPACK_FLIP_Y_WEBGL: 对图像进行 Y 轴反转, 默认值为 false
    -   gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL: 将图像 RGB 颜色值的每一个分量乘以 A. 默认为 fasle
-   param: 指定非 0(true)或 0(false). 必须为整数

### 返回值

无

### 错误

-   INVALID_ENUM : pname 不是合法的值.

## gl.activeTexture(texUnit) 激活纹理单元

激活 texUnit 指定的纹理单元

### 参数

-   texUnit: 指定准备激活的纹理单元: `gl.TEXTURE0`,`gl.TEXTURE1`,...,`gl.TEXTURE7`

### 返回值

无

### 错误

-   INVALID_ENUM: texUnit 的值不合法

## gl.bindTexture() 绑定纹理对象

开启 texture 指定的纹理对象, 并将其绑定到 target 上, 此外, 如果已经通过`gl.activeTexture()`激活了某个纹理单元, 则纹理对象也会绑定到这个纹理单元上.

### 参数

-   target :
    -   gl.TEXTURE_2D : 二维纹理
    -   gl.TEXTURE_CUBE_MAP :　立方体纹理
-   texture : 表示绑定的纹理单元

### 返回值

无

### 错误

-   INVALID_ENUM: target 不是合法的值

## gl.texParameteri() 配置纹理对象的参数

将 param 的值赋给绑定到目标的纹理对象的 pname 参数上. , 用来设置纹理图像映射到图形上的具体方式: 如何根据纹理坐标获取纹素颜色, 按哪种方式重复填充纹理.

### 参数

-   target :
    -   gl.TEXTURE_2D : 二维纹理
    -   gl.TEXTURE_CUBE_MAP :　立方体纹理
-   pname 纹理参数
-   param 纹理参数的值

纹理参数和其对应的值如下所示:

-   `gl.TEXTURE_MAG_FILTER` 纹理放大

-   `gl.TEXTURE_MIN_FILTER` 纹理缩小
    -   gl.NEAREST_MIPMAP_LINEAR 默认值

纹理参数介绍如下:

纹理的缩放:

-   `gl.TEXTURE_MAG_FILTER` 纹理放大, 默认值: gl.LINEAR
-   `gl.TEXTURE_MIN_FILTER` 纹理缩小, 默认值: gl.NEAREST_MIPMAP_LINEAR

对应的赋值:

-   `gl.NEAREST`: 使用原纹理上距离映射后像素(新像素)中心最近的那个像素的颜色值, 作为新像素的值(使用曼哈顿距离)
-   `gl.LINEAR`: 使用距离新像素中心最近的四个像素的颜色的加权平均, 作为新像素的值(与 gl.LINEAR 相比, 该方法图像质量更好, 但是开销较大)

填充方式:

-   `gl.TEXTURE_WRAP_S`纹理水平填充: gl.REPEAT
-   `gl.TEXTURE_WRAP_T` 纹理垂直填充: gl.REPEAT

对应的赋值:

-   `gl.REPEAT` 平铺式的重复纹理
-   `gl.MIRPORED_REPEAT` 镜像对称式的重复纹理
-   `gl.CLAMP_TO_EGDE` 使用纹理图像边缘值

### 返回值

无

### 错误

-   INVALID_ENUM: target 不是合法的值
-   INVALID_OPERATION: 当前目标上没有绑定纹理对象

## gl.texImage2D(target, level, internalformat, format,type,image) 将纹理图像分配给纹理对象

将 image 指定的图像分配给绑定到目标上的纹理对象

### 参数

-   target:
    -   gl.TEXTURE_2D : 二维纹理
    -   gl.TEXTURE_CUBE_MAP :　立方体纹理
-   level: 传入 0(实际上, 该参数是为金字塔纹理准备的)
-   internalformat: 图像的内部格式
    -   gl.RGB
    -   gl.RGBA
    -   gl.ALPHA
    -   gl.LUMINANCE L,L,L,1L:流明
    -   gl.LUMINANCE_ALPHA L,L,L 透明度
-   format: 纹理数据的格式
-   type: 纹理数据的类型
    -   gl.UNSIGNED_BYTE : 无符号整型, 每个颜色分量占用 1 字节
    -   gl.UNSIGNED_SHORT_5_6_5: RGB, 每个分量分别占据 5,6,5byte
    -   gl.UNSIGNED_SHORT_4_4_4_4: RGBA, 每个分量分别占据 4,4,4,4byte
    -   gl.UNSIGNED_SHORT_5_5_5_1: RGBA, 每个分量分别占据 5,5,5,1byte
-   image: 包含纹理图像的 Image 对象

PNG 格式的图像通常使用`gl.RGBA`, JPG,BMP 通常指定为`gl.RGB`, 而`gl.LUMINANCE`和`gl.LUMINANCE_ALPHA`通常用在灰度图像上.

### 返回值

无

### 错误

-   INVALID_ENUM: target 不是合法的值
-   INVALID_OPERATION: 当前目标上没有绑定纹理对象

## gl.uniform1i(pname,number) 将纹理单元传递给片元着色器

### 参数

-   pname: 着色器中的取样器变量
-   number: 指定的纹理单元编号

### 返回值

无

## gl.enable（cap）

### 参数

-   cap: 指定需要开启的功能, 可能是下面几种之一
    -   gl.DEPTH_TEST: 隐藏面消除,
    -   gl.BLEND: 混合
    -   gl.POLYGON_OFFSET_FILL: 多边形位移.

### 返回值

无

### 错误

-   INVALUE_ENUM: cap 值无效

## gl.disable(cap)

关闭 cap 表示的功能, 与

-   cap

## gl.polyginOffset(factor,units)

指定加到每个顶点绘制后 z 值上的偏移量, 偏移量按照公式`m*factor+r*units`计算, 其中 m 表示顶点所在表面相对于观察者的实现的角度, 而 r 表示硬件能够区分两个 z 值之间的最小值.

### 返回值

无

### 错误

无

## gl.drawElements(mode, count, type, offset)

执行着色器, 按照 mode 参数指定的方法, 根据绑定到`gl.ELEMENT_ARRAY_BUFFER`的缓冲区中的顶点索引值来绘制图形

### 参数

-   mode： 制定绘制的方式， 可以接受：

    -   gl.POINTS
    -   gl.LINES
    -   gl.LINE_STRIP
    -   gl.LINE_LOOP
    -   gl.TRIANGLES
    -   gl.TRIANGLE_STRIP
    -   gl.TRIANGLE_FAN

-   count: 指定绘制顶点的个数
-   type: 指定索引值数据类型:gl.UNSIGNED_BYTE 或 gl.UNSIGNED_SHORT
-   offset: 指定索引数组中开始绘制的位置, 以字节为单位

### 返回值

无

### 错误

-   INVALID_ENUM: 传入的 mode 参数不是前述参数之一
-   INVALID_VALUE: 参数 count 或者 offset 是负数

## gl.createShader(type) 创建着色器对象

所有的说色器对象都必须通过调用`gl.createShader()`来创建.

### 参数

- type: 指定创建着色器的类型
  - gl.VERTEX_SHADER 表示顶点着色器
  - gl.FRAGMENT_SHADER 表示片元着色器

### 返回值

- not-null: 创建的着色器
- null: 创建失败

### 错误

- INVLID_ENUM: 参数非给定枚举值


## gl.deleteShader(shader) 删除着色器对象

### 参数

- shader 待删除的着色器对象


## gl.shaderSouce(shader, source) 指定着色器对象的代码

将source指定的字符串形式的代码传入shader指定的着色器, 如果之前已经向shader传入过代码, 旧的代码将会被替换

### 参数

- shader: 指定需要传入代码的着色器对象
- souce: 指定字符串形式的代码

## gl.compileShader(shader) 编译着色器

编译shader指定的着色器中的源代码

### 参数

- shader: 待编译的着色器


## gl.getShaderInfoLog(shader) 获取着色器的信息日志

获取shader指定的着色器的信息日志

### 参数 

- shader : 指定带获取信息日志的说择期


### 返回值

- non-null 包含日志信息的字符串
- null 没有编译错误

## gl.getShaderParameter(shader,pname) 

获取shader指定的着色器中, pname指定的参数信息

### 参数

- shader: 着色器
- pname: 指定带获取的参数的类型
  - gl.SHADER_TYPE
  - gl.DELETE_STATUS
  - gl.COMPILE_STATUS


### 返回值

根据pname的不同返回

  - gl.SHADER_TYPE: 返回顶点着色器还是片元着色器
  - gl.DELETE_STATUS: 返回着色器是否被删除成功
  - gl.COMPILE_STATUS: 返回着色器是否被编译成功


### 错误

- INVALID_ENUM: 值无效


## gl.createProgram()

创建程序对象

## gl.deleteProgram(program)
 
删除program指定的程序对象, 如果改程序对象正在被使用, 则不利己删除, 而是等它不再被使用后删除

### 参数

- program: 程序对象

## gl.attchShader(program, shader)

将shader指定的着色器对象分配给program指定的程序对象

### 参数 

- program: 指定的程序对象
- shader: 指定着色器独享

### 错误

- INVALID_OPERATION: shader已经被分配了


## gl.detachShader(program,shader)

取消shader指定的着色器对象对program指定的程序对象的分配

### 参数

- program: 程序对象
- shader: 着色器独享

### 错误

- INVALID_OPERATION: shader没有被分配给program


## gl.linProgram(program) 连接程序对象

链接program指定程序对象中的着色器

### 参数

- program: 指定程序对象


## gl.getProgramParameter(program, pname)

获取program指定的程序对象中pname指定的参数信息

### 参数

- program: 程序独享
- pname: 指定参数类型
  - gl.DELETE_STATUS
  - gl.LINK_STATUS
  - gl.VALIDATE_STATUS
  - gl.ATTACHED_SHADERS
  - gl.ACTIVE_ARRTIBUTES
  - gl.ACTIVE_UNIFORMS


### 返回值

- 根据pnam的不同:
  - gl.DELETE_STATUS: 程序是否被删除
  - gl.LINK_STATUS: 程序是否成功连接
  - gl.VALIDATE_STATUS: 程序是否已经通过验证
  - gl.ATTACHED_SHADERS: 已被分配给程序的着色器数量
  - gl.ACTIVE_ARRTIBUTES: 顶点着色器中attribute变量的数量
  - gl.ACTIVE_UNIFORMS: 程序中uniform的数量


## gl.getProgramInfoLog()

获取program指定的程序对象的信息日志

### 参数

program: 指定待获取信息日志的程序对象

## gl.useProgram()

告知WebGL系统绘制时使用program指定的程序对象

### 参数

- program: 指定待使用的程序对象
