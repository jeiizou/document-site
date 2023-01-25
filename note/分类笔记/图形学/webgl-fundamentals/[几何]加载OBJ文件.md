# [几何]Obj模型加载

`.obj`文件是网上最常用的3d文件格式, 他们并不是难以解析的格式.

## `.obj`文件概览

OBJ文件相关的文献参考如下:

- [Object Files (.obj)](http://paulbourke.net/dataformats/obj/)

下面是一个Blender导出的简单的立方题的Obj文件内容:

```
# Blender v2.80 (sub 75) OBJ File: ''
# www.blender.org
mtllib cube.mtl
o Cube
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vt 0.375000 0.000000
vt 0.625000 0.000000
vt 0.625000 0.250000
vt 0.375000 0.250000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.625000 0.500000
vt 0.375000 0.500000
vt 0.625000 0.750000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.625000 1.000000
vt 0.375000 1.000000
vt 0.125000 0.500000
vt 0.375000 0.500000
vt 0.375000 0.750000
vt 0.125000 0.750000
vt 0.625000 0.500000
vt 0.875000 0.500000
vt 0.875000 0.750000
vn 0.0000 1.0000 0.0000
vn 0.0000 0.0000 1.0000
vn -1.0000 0.0000 0.0000
vn 0.0000 -1.0000 0.0000
vn 1.0000 0.0000 0.0000
vn 0.0000 0.0000 -1.0000
usemtl Material
s off
f 1/1/1 5/2/1 7/3/1 3/4/1
f 4/5/2 3/6/2 7/7/2 8/8/2
f 8/8/3 7/7/3 5/9/3 6/10/3
f 6/10/4 2/11/4 4/12/4 8/13/4
f 2/14/5 1/15/5 3/16/5 4/17/5
f 6/18/6 5/19/6 1/20/6 2/11/6
```

## obj文件参数

### v, vt, vn

v开始的行表示顶点, vt开始的行表示纹理坐标, vn开始的行表示法向量.

看起来, obj文件是一个文本文件, 所以我们首先要加载文本文件. 

```js
async function main() {
  ...
 
  const response = await fetch('resources/models/cube/cube.obj');
  const text = await response.text();
}
```

然后我们一行一行的解析:

```
keyword data data data ...
```

大致如下:

```js
function parseOBJ(text) {
 
  const keywords = {
  };
 
  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')){
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword, ' at line', lineNo + 1);
      continue;
    }
    handler(parts, unparsedArgs);
  }
}
```

### f

在OBJ文件的最后一部分, `f`代表的是"面"或者多边形, 每部分数据都代表了顶点, 纹理坐标以及法线.

如果一个索引是正数, 表示从序列1开始的偏移. 如果索引是负数, 表示从序列结尾开始偏移. 索引的顺序是: 顶点/纹理坐标/法线.

```js
f 1 2 3             # 只包含顶点索引
f 1/1 2/2 3/3       # 包含顶点索引和纹理座标索引
f 1/1/1 2/2/2 3/3/3 # 包含顶点索引、纹理座标索引和法线索引
f 1//1 2//2 3//3    # 包含顶点索引和法线索引
```

通常在webgl中, 我们不单独说明顶点, 纹理坐标和法线. `webgl顶点`代表了包含该顶点的顶点坐标, 纹理坐标和法线的数据集合. 

例如, 要绘制一个立方体, WebGL需要36个顶点, 每个面是两个三角形, 每个三角形是3个顶点. 尽管一个立方体只有8个不重复的顶点和6条不重复的法线. 

所以可以这么解析:

```js
function parseOBJ(text) {
  // 因为索引是从 1 开始的，所以填充索引为 0 的位置
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
 
  // 和 `f` 一样的索引顺序
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];
 
  // 和 `f` 一样的索引顺序
  let webglVertexData = [
    [],   // 顶点
    [],   // 纹理座标
    [],   // 法线
  ];
 
  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }
 
  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
  };
```

这里创建了3个数组来保存从object文件中解析出来的顶点位置, 纹理坐标和法线.

同时创建了3个数组来保存WebGL的顶点. 为了方便使用, 数组的顺序和f中索引的顺序是一样的:

```js
f 1/2/3/ 4/5/6 7/8/9
```

比如说, 4/5/6表示对这个面的一个顶点使用"顶点4", "纹理坐标5", "法线6". 我们就将顶点, 纹理坐标, 法线数据方法哦`objVertexData`数组里面, 这样就能简单的表示为: 对webglData的第i项, 使用objData第i个数组中的第n个元素, 这样就会简化我们的代码.

在函数的结尾, 返回我们构建的数据:

```js
 ...
 
  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
```

下面就是将解析出来的数据绘制到屏幕上就可以了.

### usemtl

`usemtl`是一个比较重要的属性, 它指明了后面出现的所有几何体都使用指定的材质.

比如, 你有一个车辆的模型, 你可能会希望车窗是透明的, 保险杠是金属反光的. 所以它们需要和车体不一样的绘制方法. `usemtl`就是标记了这部分的信息. 

因为我们需要单独绘制这些部分, 所以我们需要修改代码, 每次遇到`usemtl`, 我们就创建一个新的webgl数据集. 

`usemtl`不是必要的, 如果在文件中没有`usemtl`, 我们想要有默认的几何体. 所以在`f`函数中我们调用了`setGeometry`来创建. 

最后我们返回`geometries`对象数组, 每个对象包含`name`和`data`.

### mtlib

`mtllib`: 指定包含材质信息的独立的一个或多个文件. 不幸的是, 在实际应用中, 文件名可以包含空格, 但是`.obj`格式中没有提供逃逸字符来实现空格或者引号. 

### o

`o`指定表明接下来的条目属于命名为"object"的对象, 但是我们不清楚如何使用它. 

### s

`s`指明了一个`smoothing group`. 他们通常在建模程序中用来自动生成顶点法线.

顶点发现的计算, 需要先计算每个面的法线, 而每个面的法相则使用叉乘等到. 对于任意的顶点, 我们可以对改顶点所在的面去均值. 但是有时我们需要一条边的时候, 我们需要能够告诉程序忽略一些面.

`smoothing group`让我们指定计算顶点法线时那些面需要被包含. 

### g

`g`代表组(group), 通常它只是一些元数据. `Objects`可以存在于多个group中. 


### 注意

1. 这个加载器是不完整的
2. 这个加载器没有进行错误检查
3. 假设数据是一致的
4. 可以将所有的数据放在一个缓冲中
5. 可以重建顶点的索引
6. 这段代码没有处理只有顶点坐标, 或者只有顶点坐标和纹理坐标的情况
7. obj文件并不是一个好的模型格式, 理由如下:
   1. 不支持光线或者视角
   2. 没有层级, 没有场景图
   3. 不支持动画或者蒙皮
   4. obj不支持更多现在的材质
   5. obj需要解析, 不能直接加载进GPU中


所以, 最好的办法是将它转换为其他的格式, 然后在你的页面中使用.

## MTL 材质文件

mtl 是obj的补充文件, 用来说明对应的材质.

看起来大概是这样的:

```js
# Blender MTL File: 'None'
# Material Count: 11
 
newmtl D1blinn1SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 0.500000 0.500000 0.500000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2
 
newmtl D1lambert2SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 0.020000 0.020000 0.020000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2
 
newmtl D1lambert3SG
Ns 323.999994
Ka 1.000000 1.000000 1.000000
Kd 1.000000 1.000000 1.000000
Ks 0.500000 0.500000 0.500000
Ke 0.0 0.0 0.0
Ni 1.000000
d 1.000000
illum 2

...
```

`newmtl`关键字以及后面跟随的就是材质额名称. 

我们可以用下面的方法去解析它:

```js
function parseMTL(text) {
  const materials = {};
  let material;
 
  const keywords = {
    newmtl(parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },
  };
 
  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }
 
  return materials;
}
```

一样的, 我们只需要为每个关键词添加对应的方法:

- Ns: 镜面光泽的设置
- Ka: 材质的环境光
- Kd: 散射光
- Ks: 镜面光
- Ke: 放射光
- Ni: 光学密度
- d: 代表"溶解", 表示透明度
- illum: 指定材质的光照模型. 文档中列出了11中光照模型

我们可以通过obj文件中的mtl地址作为相对路径构建相关mtl文件的地址.

然后开始解析材质就可以了.

然后向修改着色器代码, 比如镜面相关的材质设置.

`ambient`是材质在无方向光源下的反射颜色. 

`emissive`是材质自身发光的颜色, 与所有的光照无关. 

这里可以参考一下[DEMO](./code/Obj模型加载-MTL/index.html)'

### MTL文件中引用纹理的obj文件

在这个mtl文件中, 他看起来是这样的:

```mtl
# Blender MTL File: 'windmill_001.blend'
# Material Count: 2
 
newmtl Material
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_lopatky_COL.jpg
map_Bump windmill_001_lopatky_NOR.jpg
 
newmtl windmill
Ns 0.000000
Ka 1.000000 1.000000 1.000000
Kd 0.800000 0.800000 0.800000
Ks 0.000000 0.000000 0.000000
Ke 0.000000 0.000000 0.000000
Ni 1.000000
d 1.000000
illum 1
map_Kd windmill_001_base_COL.jpg
map_Bump windmill_001_base_NOR.jpg
map_Ns windmill_001_base_SPEC.jpg
```

我们可以看到`map_Kd`, `map_Bump`, `map_Ns`中, 制定了图片文件, 让我们来解析这些图片文件.


下面是一个[DEMO](./code/obj-mtl-texture/index.html)

我们回头看`.mtl`文件, 看到`map_Ks`基本上是黑白的纹理, 它制定了特定表面的光泽度, 或者说是多少镜面反射的效果. 

```js
颜色 = KaIa + Kd { SUM j=1...ls, (N * Lj)Ij }

颜色 = 环境色 * 环境光 + 漫反射色 * 光照计算和
```

`map_Bump`可以支持凹凸贴图. 


还有其他很多mtl文件的特性, 比如`refl`关键词制定了反射贴图, 也就是环境贴图, 还有很多`map_`加各种选项参数的关键词, 比如:

- `-clamp on | off`指定纹理是否重复
- `-mm base gain`指定纹理值的偏移和倍数
- `-o u v w`来指定纹理坐标的偏移.
- `-s u v w`来指定纹理坐标的缩放

我们不知道有多少mtl文件使用了这些设置, 或用了多少. 

比如, 要支持`-o`和`-s`, 我们就要假设所有的贴图都有区别, 并且支持全部的纹理. 这就需要我们为每个纹理传不同的纹理矩阵. 而这又需要我们从顶点着色器为每个纹理传不同的纹理坐标到片段, 或者在片段着色器中进行纹理矩阵乘法.(而不是传统的, 在顶点着色器中进行)

更重要的是, 如果支持所有的特性, 会让着色器变得又大又复杂. 上面的代码是一种超级着色器的样子: 一个试图处理所有情况的着色器. 通过传默认值来让它正常的工作. 

更常见的做法是, 生成一个可以开关这些特性的着色器, 如果没有丁点颜色, 就通过操作字符串, 生成一个着色器, 着色器中没有`a_color`属性和其他相关代码. 类似的, 如果一个材质没有漫反射贴图, 就生成一个没有`uniform sampler2D diffuseMap`的着色器, 并且移除相关代码. 如果不包含任何贴图, 就不要纹理坐标, 我们就可以把他们全部移除.

如果将这些组合都加上, 可能会有1000多种着色器. 

- 漫反射贴图 有/无
- 镜面贴图 有/无
- 法线贴图 有/无
- 顶点颜色 有/无
- 环境贴图 有/无 （我们不支持，但 .mtl 文件中有）
- 反射贴图 有/无 （我们不支持，但 .mtl 文件中有）

## 尽量避免在着色器中使用条件语句

通常的建议是避免在着色器中使用条件语句. 比如:

```glsl
uniform bool hasDiffuseMap;
uniform vec4 diffuse;
uniform sampler2D diffuseMap
 
...
vec4 effectiveDiffuse = diffuse;
if (hasDiffuseMap) {
effectiveDiffuse \*= texture2D(diffuseMap, texcoord);
}
...
```

这样的语句依赖于GPU或者驱动, 它们没有很好的性能. 

当没有纹理的时候, 我们用一个1x1像素的白色纹理, 这样就不用考虑条件语句了

