# [杂项]WebGL中的矩阵和数学中的矩阵

在编程的领域里面, 行通常是从左到右, 列通常是从上到下

所以当我们用js为webgl创建矩阵的时候, 它们看起来大概是这样的:

```js
const m3x3 = [
  0, 1, 2,  // 行 0
  3, 4, 5,  // 行 1
  6, 7, 8,  // 行 2
];
 
const m4x4 = [
   0,  1,  2,  3,  // 行 0
   4,  5,  6,  7,  // 行 1
   8,  9, 10, 11,  // 行 2
  12, 13, 14, 15,  // 行 3
];
```

在第一篇关于矩阵的文章中, 我们看到创建一个标准的3阶的2为变换矩阵, 变化的值`tx`和`ty`是在位置6和7上的.

```js
const some3x3TranslationMatrix = [
   1,  0,  0,
   0,  1,  0,
  tx, ty,  1,
];
```

而对于4阶的矩阵上, 变换值就位于12,13,14.

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

不过这里有一个问题, 在数学里面, 矩阵一般是竖着来写的, 比如像这样:

$$
\begin{bmatrix}
    1 & 0 & tx \\
    0 & 1 & ty \\
    0 & 0 & 1
\end{bmatrix}
$$

如果是4阶的矩阵, 则


$$
\begin{bmatrix}
    1 & 0 & 0 & tx \\
    0 & 1 & 0 & ty \\
    0 & 0 & 1 & tz \\
    0 & 0 & 0 & 1 \\
\end{bmatrix}
$$

这给我们一个问题. 如果我们想要像数学中那样写矩阵, 那就要这么写:

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  tx,
   0,  1,  0,  ty,
   0,  0,  1,  tx,
   0,  0,  0,  1,
];
```

但是这样写也有问题, 第1,2,3列通常是对应x,y,z轴的. 最后一列是位置或者变换值.

在代码中, 如果你要单独把这部分单独拿出来, 就非常的不好:

```js
const zAxis = [
  some4x4Matrix[2],
  some4x4Matrix[6],
  some4x4Matrix[10],
];
```

所以, webgl和webgl基于OpenGL ES的做法就是, 把行作为列. 

```js
const some4x4TranslationMatrix = [
   1,  0,  0,  0,   // 这是列 0
   0,  1,  0,  0,   // 这是列 1
   0,  0,  1,  0,   // 这是列 2
  tx, ty, tz,  1,   // 这是列 3
];
```

现在他和书写定义是一样的了, 和上面的例子比较, 如果我们需要获取z轴, 只需要:

```js
const zAxis = some4x4Matrix.slice(9, 11);
```

在c++中, opengl要求4x4的矩阵中的16个值在内存中是连续的, 所以可以创建一个`Vec4`结构体或者类:

```c++
// C++
struct Vec4 {
  float x;
  float y;
  float z;
  float w;
};
```

然后我们可以用4个结构体来创建4阶矩阵:

```c++
// C++
struct Mat4x4 {
  Vec4 x_axis;
  Vec4 y_axis;
  Vec4 z_axis;
  Vec4 translation;
}
```

或者:

```c++
// C++
struct Mat4x4 {
  Vec4 column[4];
}
```

但是不辛的是当你在代码中声明这样一个矩阵的时候, 就变成这样了:

```c++
// C++
Mat4x4 someTranslationMatrix = {
  {  1,  0,  0,  0, },
  {  0,  1,  0,  0, },
  {  0,  0,  1,  0, },
  { tx, ty, tz,  1, },
};
```

或者回到js, 没有C++一样的借口替:

```js
const someTranslationMatrix = [
   1,  0,  0,  0,
   0,  1,  0,  0,
   0,  0,  1,  0,
  tx, ty, tz,  1,
];
```

这些写法都是从程序员的角度出发的. 


