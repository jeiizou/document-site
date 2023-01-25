---
title: 'Cesium学习笔记(一)--Buffer/Shader'
date: 2019-07-26 11:22:00
category:
    - 笔记
    - Cesium
tags:
    - cesium
    - webgl
---

> 本文是阅读 `法克鸡丝` 大佬博文的一系列笔记, 学习关于 Cesium 的一些简单的运行原理, 渲染策略等等.

<!-- more -->

## Buffer

任意一个非参数化的几何对象(参数化的通过差值转化为非参数化, 比如一个参数化的圆, 对应参数是圆心和半径, 通过差值将圆转为一个多边形, 圆周对应的点越密, 则效果越好, 代价越大), 对应的 N 的顶点之间的空间关系.

通过 WEbGL 渲染该几何对象时, 首先要将该几何对象转化为 WebGL 可以识别的数据格式:

1. 构建该对象的顶点数组, 里面包括每一个点的 XYZ 位置(\*), 颜色, 纹理坐标, 法线等信息.
2. 构建该对象对应的索引信息, 也就是点之间的先后顺序.

这些就是 VBO 的概念(顶点缓存).

webgl 中的 bufferData 接口如下:

```glsl
void gl.bufferData(target, size, usage);
void gl.bufferData(target, data, usage);
```

参数说明如下:

-   target:
    -   gl.ARRAY_BUFFER: 顶点数据, 比如位置, 颜色, 法线, 纹理坐标或自定义属性
    -   gl.ELEMENT_ARRAY_BUFFER: 顶点索引
-   size: 数据长度, 预留的空间, 内部数据为空
-   data: 数据内容, 此时 WebGL 内部可以判断该数据内容对应的长度
-   usage:
    -   gl.STATIC_DRAW: 静态数据, 数据保存在 GPU 中, 适合一次写入不再更改, 多次使用的情况
    -   gl.DYNAMIC_DRAW: 动态数据, 保存在内存中, 适合多次写入, 多次使用的情况'
    -   gl.STREAM_DRAW: 流数据, 保存在 GPU 中, 适合一次写入一次使用的情况.

直接调用 WebGL 提供的方法创建顶点属性的代码如下:

```js
// 获取WebGL对象
var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl');
// 创建顶点缓存
var buffer = gl.createBuffer();
// 绑定该顶点缓存类型为顶点属性数据
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// 指定其对应的数据长度及方式
gl.bufferData(gl.ARRAY_BUFFER, 1024, gl.STATIC_DRAW);
// 解除绑定
gl.bindBuffer(bufferTarget, null);
```

顶点属性和顶点缩影的调用方法完全相同, 逻辑上的创建过程也如出一辙, 知识具体的参数稍有不同, 因此, 在 Cesium 中把创建 VBO 的过程化的函数封装为一个抽象的 Buffer 类, 大致伪代码如下:

```js
function Buffer(options) {
    var gl = options.context._gl;
    var bufferTarget = options.bufferTarget;
    var typedArray = options.typedArray;
    var sizeInBytes = options.sizeInBytes;
    var usage = options.usage;
    var hasArray = defined(typedArray);

    if (hasArray) {
        sizeInBytes = typedArray.byteLength;
    }
    // ……
    var buffer = gl.createBuffer();
    gl.bindBuffer(bufferTarget, buffer);
    gl.bufferData(bufferTarget, hasArray ? typedArray : sizeInBytes, usage);
    gl.bindBuffer(bufferTarget, null);
    // ……
    this._gl = gl;
    this._bufferTarget = bufferTarget;
    this._sizeInBytes = sizeInBytes;
    this._usage = usage;
    this._buffer = buffer;
    this.vertexArrayDestroyable = true;
}
```

再次基础上还提供了简单二次封装:

```js
Buffer.createVertexBuffer = function(options) {
    return new Buffer({
        context: options.context,
        bufferTarget: WebGLConstants.ARRAY_BUFFER,
        typedArray: options.typedArray,
        sizeInBytes: options.sizeInBytes,
        usage: options.usage
    });
};

Buffer.createIndexBuffer = function(options) {
    return new Buffer({
        context: options.context,
        bufferTarget: WebGLConstants.ELEMENT_ARRAY_BUFFER,
        typedArray: options.typedArray,
        sizeInBytes: options.sizeInBytes,
        usage: options.usage
    });
};
```

用户创建顶点属性和顶点索引的范例如下:

```js
var buffer = Buffer.createVertexBuffer({
    context: context,
    sizeInBytes: 16,
    usage: BufferUsage.DYNAMIC_DRAW
});

var buffer = Buffer.createIndexBuffer({
    context: context,
    typedArray: new Uint16Array([0, 1, 2]),
    usage: BufferUsage.STATIC_DRAW,
    indexDatatype: IndexDatatype.UNSIGNED_SHORT
});
```

如果使用的是`DYNAMIC_DRAW`的方式, 并没有指定 bufferdata, 则创建该顶点缓存对象, 数据留空, 在获取数据后调用`Buffer.prototype.copyFromArrayView`方法来更新改数据.

```js
Buffer.prototype.copyFromArrayView = function(arrayView, offsetInBytes) {
    var gl = this._gl;
    var target = this._bufferTarget;
    gl.bindBuffer(target, this._buffer);
    gl.bufferSubData(target, offsetInBytes, arrayView);
    gl.bindBuffer(target, null);
};
```

VBO 是渲染中最基本和最重要的概念和渲染对象, 通过 Buffer 进行封装具有重要的意义.

通过 Buffer 我们可以将`Primitive`(图元)中的稽核数据转化为 VBO, 这相当于创建了该几何对象的骨架, 通常我们还需要纹理信息贴在这个骨架的标签. 这就是接下来的 Texture.

## Texture

Texture 是 WebGL 中重要的概念. 创建一个纹理的最简过程如下:

```js
var canvas = document.getElementById('canvas');
var gl = canvas.getContext('webgl');
// 创建纹理句柄
var texture = gl.createTexture();
// 填充纹理内容
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
// 设置纹理参数
//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// 释放
gl.bindTexture(gl.TEXTURE_2D, null);
```

一个再简单的纹理, 在实际中也会有变幻无穷的方式, Cesium 提供了 Texture 类, 整体上考虑了主要的使用场景, 简化学习成本:

```js
function Texture(options) {
    // 如下三个if判断，用来查看是否是深度纹理、深度模版纹理或浮点纹理
    //  并判断当前浏览器是否支持，数据类型是否满足要求
    if (pixelFormat === PixelFormat.DEPTH_COMPONENT) {
    }

    if (pixelFormat === PixelFormat.DEPTH_STENCIL) {
    }

    if (pixelDatatype === PixelDatatype.FLOAT) {
    }

    var preMultiplyAlpha =
        options.preMultiplyAlpha || pixelFormat === PixelFormat.RGB || pixelFormat === PixelFormat.LUMINANCE;
    var flipY = defaultValue(options.flipY, true);

    var gl = context._gl;
    var textureTarget = gl.TEXTURE_2D;
    var texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, texture);

    if (defined(source)) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMultiplyAlpha);
        // Y轴方向是否翻转
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        if (defined(source.arrayBufferView)) {
            // 纹理数据是arraybuffer的形式下，调用此方法
            gl.texImage2D(
                textureTarget,
                0,
                internalFormat,
                width,
                height,
                0,
                pixelFormat,
                pixelDatatype,
                source.arrayBufferView
            );
        } else if (defined(source.framebuffer)) {
            // 纹理数据是纹理缓冲区中的数据时，调用此方法
            if (source.framebuffer !== context.defaultFramebuffer) {
                source.framebuffer._bind();
            }

            gl.copyTexImage2D(textureTarget, 0, internalFormat, source.xOffset, source.yOffset, width, height, 0);

            if (source.framebuffer !== context.defaultFramebuffer) {
                source.framebuffer._unBind();
            }
        } else {
            // 纹理数据是其他类型: ImageData, HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
            gl.texImage2D(textureTarget, 0, internalFormat, pixelFormat, pixelDatatype, source);
        }
    } else {
        // 纹理数据为空
        gl.texImage2D(textureTarget, 0, internalFormat, width, height, 0, pixelFormat, pixelDatatype, null);
    }
    gl.bindTexture(textureTarget, null);
}
```

Cesium.Textture 支持纹理贴图, 还有深度和模板, 以及浮点纹理等扩展用法, 保证了 Cesium 可以支持深度值, 模板等操作, 满足一些复杂情况下的需求, 同时通过 text.fromFramebuffer 等方式, 可以支持 FBO 作为一张纹理, 实现离屏渲染的效果, 因此, 在纹理数据创建上, Cesium 还是比较完整的.

## Shader

Cesium 提供了`ShaderSource`类来加载 GLSL 代码:

```js
ShaderSource.prototype.clone = function() {
    return new ShaderSource({
        sources: this.sources,
        defines: this.defines,
        pickColorQuantifier: this.pickColorQualifier,
        includeBuiltIns: this.includeBuiltIns
    });
};
```

-   sources: 代码本身, 这里是一个数组, 可以使多个代码片段的叠加
-   defines(Optional): 执行该代码时声明的预编译宏
-   pickColor(Optional): 需要点击选中物体时设置此参数, 值为'uniform'
-   includeBuiltlns(Optional): 默认为 true, 认为需要加载 Cesium 自带的 GLSL 变量或 function

创建顶点或者偏远着色器如下:

```js
// 顶点着色器
this._surfaceShaderSet.baseVertexShaderSource = new ShaderSource({
    sources: [GroundAtmosphere, GlobeVS]
});

// 片元着色器
this._surfaceShaderSet.baseFragmentShaderSource = new ShaderSource({
    sources: [GlobeFS]
});
```

### ShaderSource

先介绍两个前置知识点: CzmBuiltins & AutomaticUniforms

#### CzmBuiltins

Cesium 中提供了一些常用的 GLSL 文件, 主要分为常量, 方法, 结构体, 这些都是 Cesium 内部比较常用的基本结构和方法, 属于内建类型, 前缀都为`czm_`并且通过 CzmBuiltins.js 引入所有内建的 GLSL 代码.

```glsl
// 1 常量，例如：1 / Pi
const float czm_oneOverPi = 0.3183098861837907;

// 方法，例如：八进制解码，地形数据中用于数据压缩
 vec3 czm_octDecode(vec2 encoded)
 {
    encoded = encoded / 255.0 * 2.0 - 1.0;
    vec3 v = vec3(encoded.x, encoded.y, 1.0 - abs(encoded.x) - abs(encoded.y));
    if (v.z < 0.0)
    {
        v.xy = (1.0 - abs(v.yx)) * czm_signNotZero(v.xy);
    }

    return normalize(v);
 }

 // 结构体，例如：材质
 struct czm_material
{
    vec3 diffuse;
    float specular;
    float shininess;
    vec3 normal;
    vec3 emission;
    float alpha;
};
```

#### Automaticniforms

Cesium 提供了 AutomaticUniform 类, 用来封装这些内建的变量, 构造函数如下:

```js
function AutomaticUniform(options) {
    this._size = options.size;
    this._datatype = options.datatype;
    this.getValue = options.getValue;
}
```

所有的内部变量都可以基于该构造函数创建并添加到 AutomaticUniform 数组中, 并且在命名上遵守`czm_*`的格式, 通过命名就可以知道改变里那个是不是内建的, 是则从 CzmBuiltins 和 AutomaticUniforms 对应的列表中寻找对应的值. 否则需要用户自定义一个 uniformMap 的数据来自己维护. 下面是 AutomaticUniforms 的一段代码:

```js
var AutomaticUniforms = {
    czm_viewport: new AutomaticUniform({
        size: 1,
        datatype: WebGLConstants.FLOAT_VEC4,
        getValue: function(uniformState) {
            return uniformState.viewportCartesian4;
        }
    })
};
return AutomaticUniforms;
```

`AutomaticUniforms`创建了 vec4 类型的`czm_viewport`变量, 并且提供了 getValue 方式来传入值(把值转到 GLSL)中, 但这个值如何获得(setValue)不需要用户来关心. getValue 中有一个 uniformState 参数, Scene 在初始化时会创建该属性, 通过`Uniform`提供的 update 方法在每一帧中更新这些变量, 不需要我们去维护.

### Shader 创建

创建完 VertexShaderSource 和 FragmentShaderSource 后, 下面就要创建 ShaderProgram, 将这两个 ShaderSource 关联起来. 如下所示:

```js
command.shaderProgram = ShaderProgram.fromCache({
    context: context,
    vertexShaderSource: SkyBoxVS,
    fragmentShaderSource: SkyBoxFS,
    attributeLocations: attributeLocations
});
```
