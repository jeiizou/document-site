# 语法特性-ArrayBuffer


> [原文链接: 阮一峰的 ES6 入门](http://es6.ruanyifeng.com/#docs/arraybuffer)

ArrayBuffer 是很早就存在一种数据接口, ES6 开始将其正式纳入 ECMAScript 规格. 用于处理二进制的数据.

二进制数据有三类对象:

1. `ArrayBuffer`对象: 代表内存中的一段二进制数据, 可以通过"视图"进行操作, "视图"部署了数组接口, 所以可以用数组的方法来操作内存.
2. `TypedArray`视图: 包含了 9 种类型的视图, `Uint8Array`(无符号 8 位整数), `int16Array`(16 位数组接口),`Float32Array`(32 位浮点数)等等
3. `DataView`视图: 可以自定义符合格式的视图. 比如第一个字节是`Unit8`, 第二, 三个字节是`Int16`,等等, 此外还可以自定义字节序.

## 1. 使用

`ArrayBuffer`不能直接读写, 只能通过视图来读写, 视图的作用就是以指定的格式来解读二进制数据.

```js
//创建一段32字节的内存区域, 每个字节的值默认为0
const buf = new ArrayBuffer(32);
//创建DataView视图, 以无符号8位整数从偷渡去8位二进制数据, 结果得到0.
const dataView = new DataView(buf);
dataView.getUint8(0); // 0
```

另一种是`TypeArray`视图, 与`DataView`视图的一个区别是, 它不是一个构造函数, 而是一组构造函数, 代表不同的数据格式:

```js
const buffer = new ArrayBuffer(12);
//32位有符号整数类型
const x1 = new Int32Array(buffer);
x1[0] = 1;
//8位无符号整数类型
const x2 = new Uint8Array(buffer);
x2[0] = 2;

x1[0]; // 2
```

两个视图对应的是同一段内存, 一个视图修改底层内存, 会影响另一个视图.

`TypedArray`视图的构造函数, 除了接受`ArrayBuffer`实例, 还可以接受普通数组, 直接分配内存生成底层的`ArrayBuffer`实例, 并同时赋值:

```js
const typedArray = new Uint8Array([0, 1, 2]);
typedArray.length; // 3

typedArray[0] = 5;
typedArray; // [5, 1, 2]
```

## 2. 字节序

字节序指的是数值在内存中的表示方式.

```js
const buffer = new ArrayBuffer(16);
const int32View = new Int32Array(buffer);

for (let i = 0; i < int32View.length; i++) {
    int32View[i] = i * 2;
}
```

上面的代码中`ArrayBuffer`有 16 个字节, 在他的基础上, 建立了一个 32 位整数的视图, 每个 32 位的整数占据 4 个字节, 所以可以写入 4 个整数, 依次为 0,2,4,6.

如果在这段数据上建立一个 16 位整数, 则读取的结果会完全不同:

```js
const int16View = new Int16Array(buffer);

for (let i = 0; i < int16View.length; i++) {
    console.log('Entry ' + i + ': ' + int16View[i]);
}
// Entry 0: 0
// Entry 1: 0
// Entry 2: 2
// Entry 3: 0
// Entry 4: 4
// Entry 5: 0
// Entry 6: 6
// Entry 7: 0
```

由于每个 16 位整数占据 2 个字节, 所以整个`ArrayBuffer`现在被分成了 8 段吗然后由于 x86 体系的计算机都采用小端字节序, 权重高的字节排在其后面的内存, 权重轻的字节排在前面的内存地址, 所以就得到了上面的结果.

`DataView`视图可以设定字节序. 为一些大端字节序的设备和系统作出调整.

```js
// 假定某段buffer包含如下字节 [0x02, 0x01, 0x03, 0x07]
const buffer = new ArrayBuffer(4);
const v1 = new Uint8Array(buffer);
v1[0] = 2;
v1[1] = 1;
v1[2] = 3;
v1[3] = 7;

const uInt16View = new Uint16Array(buffer);

// 计算机采用小端字节序
// 所以头两个字节等于258
if (uInt16View[0] === 258) {
    console.log('OK'); // "OK"
}

// 赋值运算
uInt16View[0] = 255; // 字节变为[0xFF, 0x00, 0x03, 0x07]
uInt16View[0] = 0xff05; // 字节变为[0x05, 0xFF, 0x03, 0x07]
uInt16View[1] = 0x0210; // 字节变为[0x05, 0xFF, 0x10, 0x02]
```

下面的代码可以判断当前的视图是小端字节序还是大端字节序:

```js
const BIG_ENDIAN = Symbol('BIG_ENDIAN');
const LITTLE_ENDIAN = Symbol('LITTLE_ENDIAN');

function getPlatformEndianness() {
    let arr32 = Uint32Array.of(0x12345678);
    let arr8 = new Uint8Array(arr32.buffer);
    switch (arr8[0] * 0x1000000 + arr8[1] * 0x10000 + arr8[2] * 0x100 + arr8[3]) {
        case 0x12345678:
            return BIG_ENDIAN;
        case 0x78563412:
            return LITTLE_ENDIAN;
        default:
            throw new Error('Unknown endianness');
    }
}
```

### 2.1 BYTES_PER_ELEMENT

该属性可以表示这种数据类型占据的字节数:

```js
Int8Array.BYTES_PER_ELEMENT; // 1
Uint8Array.BYTES_PER_ELEMENT; // 1
Uint8ClampedArray.BYTES_PER_ELEMENT; // 1
Int16Array.BYTES_PER_ELEMENT; // 2
Uint16Array.BYTES_PER_ELEMENT; // 2
Int32Array.BYTES_PER_ELEMENT; // 4
Uint32Array.BYTES_PER_ELEMENT; // 4
Float32Array.BYTES_PER_ELEMENT; // 4
Float64Array.BYTES_PER_ELEMENT; // 8
```

也可以直接在`TypedArray`中获取到:`TypedArray.prototype.BYTES_PER_ELEMENT`

## 3. 溢出

不同的视图类型, 内存空间是确定的. 超出范围的数据就会出现溢出. 比如, 8 位视图就只能容纳一个 8 位的二进制值, 如果放入一个 9 位的值, 就会溢出. `TypedArray`数组的溢出处理规则, 简单来说, 就是抛弃溢出的位, 然后按照视图类型进行解释.

```js
const uint8 = new Uint8Array(1);

uint8[0] = 256;
uint8[0]; // 0

uint8[0] = -1;
uint8[0]; // 255
```

负数在计算机内部在用"2 的补码"表示, 将对应的整数值进行否运算, 然后加 1, 比如`-1`对应的正值为`1`, 进行否运算, 得到`11111110`, 再加上`1`就是补码形式:`11111111`. `unit8`按照无符号的 8 位整数解释`11111111`, 返回结果就是`255`.

一个简单的转换规则, 可以这样表示:

-   正向溢出(overflow): 当输入值大于当前数据类型的最大值, 结果等于当前数据类型的最小值加上余值, 再减去 1.
-   负向溢出(underflow): 当输入值小于当前数据类型的最小值, 结果等于当前数据类型的最大值减去余值的绝对值, 再加上 1.

(余值指的是取模运算的结果)

```js
const int8 = new Int8Array(1);

int8[0] = 128;
int8[0]; // -128 (-128+(128%127)-1)

int8[0] = -129;
int8[0]; // 127 (127-(128%127)+1)
```

比较特殊的是`Uint8ClampedArray`视图的溢出规则, 它规定凡是发生正向溢出, 该值一律等于当前数据类型的最大值(255), 如果发生负向溢出, 该值一律等于当前数据类型的最小值(0).

## 4. ArrayBuffer 方法

### 4.1 ArrayBuffer.prototype.byteLength

`ArrayBuffer`实例的`byteLength`属性, 返回所分配内存区域的自节长度.

```js
const buffer = new ArrayBuffer(32);
buffer.byteLength;
// 32
```

如果要丰碑的内存区域很大, 是有可能分配失败的(没有那么多的连续空余内存), 所以有必要检查是否分配成功.

```js
if (buffer.byteLength === n) {
    // 成功
} else {
    // 失败
}
```

### 4.2 ArrayBuffer.prototype.slice()

`ArrayBuffer`实例有一个`slice`方法, 允许将内存区域的一部分, 拷贝生成一个新的`ArrayBuffer`对象.

```js
const buffer = new ArrayBuffer(8);
const newBuffer = buffer.slice(0, 3);
```

除了`slice`方法, `ArrayBuffer`不提供任何直接读写内存的方法, 只允许在其上方建立视图, 然后通过视图读写.

### 4.3 ArrayBuffer.isView()

`isView`返回一个布尔值, 表示参数是否为`ArrayBuffer`的视图实例, 这个方法大致相当于判断参数是否为`TypedArray`实例或`DataView`实例:

```js
const buffer = new ArrayBuffer(8);
ArrayBuffer.isView(buffer); // false

const v = new Int32Array(buffer);
ArrayBuffer.isView(v); // true
```

## 5. ArrayBuffer <--> string

主要使用的是原生的`TextEncoder`和`TextDecoder`方法

```ts
/**
 * Convert ArrayBuffer/TypedArray to String via TextDecoder
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
 */
function ab2str(
    input: ArrayBuffer | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array,
    outputEncoding: string = 'utf8'
): string {
    const decoder = new TextDecoder(outputEncoding);
    return decoder.decode(input);
}

/**
 * Convert String to ArrayBuffer via TextEncoder
 *
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/TextEncoder
 */
function str2ab(input: string): ArrayBuffer {
    const view = str2Uint8Array(input);
    return view.buffer;
}

/** Convert String to Uint8Array */
function str2Uint8Array(input: string): Uint8Array {
    const encoder = new TextEncoder();
    const view = encoder.encode(input);
    return view;
}
```

## 6. TypedArray 视图

`ArrayBuffer`作为内存区域, 可以存放多种类型的数据, 同一段内存, 不同数据有不同的解毒方式, 这就叫做视图. `ArrayBuffer`有两种视图, 一种是`TypedArray`视图, 另一种是`DataView`视图. 前者的数组成员都是同一个数据类型, 后者的数组成员可以使不同的数据类型.

`TypedArray`有 9 种类型, 每一种视图都是一种构造函数:

-   `Int8Array`: 8 位有符号整数，长度 1 个字节。
-   `Uint8Array`: 8 位无符号整数，长度 1 个字节。
-   `Uint8ClampedArray`: 8 位无符号整数，长度 1 个字节，溢出处理不同。
-   `Int16Array`: 16 位有符号整数，长度 2 个字节。
-   `Uint16Array`: 16 位无符号整数，长度 2 个字节。
-   `Int32Array`: 32 位有符号整数，长度 4 个字节。
-   `Uint32Array`: 32 位无符号整数，长度 4 个字节。
-   `Float32Array`: 32 位浮点数，长度 4 个字节。
-   `Float64Array`: 64 位浮点数，长度 8 个字节。

在`TypeArray`视图上所有的数组方法在它上面都能使用. 普通数组与 TypedArray 数组的差异主要有以下几点:

-   TypedArray 数组的所有成员都是同一类型
-   TypedArray 数组的成员是连续的, 不会有空位
-   TypedArray 数组的成员默认值为 0.
-   TypedArray 本质只是一个视图, 本身不存储数据, 数据都存储在底层的`ArrayBuffer`中.

### 6.1 构造 TypedArray

构造`TypedArray`有 9 中构造函数, 用来生成响应类型的数组实例.

构造函数有四种用法(?:可选),=:默认:

1. TypedArray(buffer, bytedOffset?=0, length?): ArrayBuffer 对象, 字节序号, 数据个数
2. TypedArray(length): 直接分配内存生成
3. TypedArray(typedArray): 接受另一个`TypedArray`实例作为参数. 此时对应的此等内存是不一样的, 会开辟一段新的内存存储数据, 不会再原数组的内存之上建立视图.
4. TypedArray(arrayLikeObject): 接受一个普通数组, 然后直接生成`TypedArray`实例.

当然 TypedArray 数组也可以转换回普通数组.

```js
const normalArray = [...typedArray];
// or
const normalArray = Array.from(typedArray);
// or
const normalArray = Array.prototype.slice.call(typedArray);
```

几乎所有的数组方法都可以在`TypedArray`上使用, 但是`TYpedArray`没有`concat`方法, 如果想要合并多个`TypedArray`数组, 可以使用下面这个方法:

```js
function concatenate(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (let arr of arrays) {
        totalLength += arr.length;
    }
    let result = new resultConstructor(totalLength);
    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

concatenate(Uint8Array, Uint8Array.of(1, 2), Uint8Array.of(3, 4));
// Uint8Array [1, 2, 3, 4]
```

此外, `TypedArray`数组与普通数组一样, 部署了`Iterator`接口, 所以可以被遍历.

```js
let ui8 = Uint8Array.of(0, 1, 2);
for (let byte of ui8) {
    console.log(byte);
}
// 0
// 1
// 2
```

### 6.2TypedArray 方法

#### 6.2.1 TypedArray.prototype.buffer

该方法返回整段内存区域对应的`ArrayBuffer`对象, 归属性为只读属性:

```js
const a = new Float32Array(64);
const b = new Uint8Array(a.buffer);
```

#### 6.2.2 TypedArray.prototype.byteLength，TypedArray.prototype.byteOffset

`byteLength`属性返回`TypedArray`数组占据的内存长度, 单位为字节. `byteOffset`属性返回`TypedArray`数组从底层`ArrayBuffer`对象的哪个字节开始, 这两个属性都只是只读属性.

```js
const b = new ArrayBuffer(8);

const v1 = new Int32Array(b);
const v2 = new Uint8Array(b, 2);
const v3 = new Int16Array(b, 2, 2);

v1.byteLength; // 8
v2.byteLength; // 6
v3.byteLength; // 4

v1.byteOffset; // 0
v2.byteOffset; // 2
v3.byteOffset; // 2
```

#### 6.2.3 TypedArray.prototype.length

该属性表示`TypedArray`数组含有多少个成员, 注意将`length`属性和`byteLength`属性区分, 前者是成员长度, 后者是字节长度.

```js
const a = new Int16Array(8);

a.length; // 8
a.byteLength; // 16
```

#### 6.2.4 TypedArray.prototype.set()

`set`方法用于复制数据, 将一段内容完全复制到另一段内存:

```js
const a = new Uint8Array(8);
const b = new Uint8Array(8);

b.set(a);
```

上面代码复制 a 数组的内容到 b 数组，它是整段内存的复制，比一个个拷贝成员的那种复制快得多。

set 方法还可以接受第二个参数，表示从 b 对象的哪一个成员开始复制 a 对象。

```js
const a = new Uint16Array(8);
const b = new Uint16Array(10);

b.set(a, 2);
```

#### 6.2.5 TypedArray.prototype.subarray()

`subarray`可以针对`TypedArray`数组的一部分, 再建立一个新的视图:

```js
const a = new Uint16Array(8);
const b = a.subarray(2, 3);

a.byteLength; // 16
b.byteLength; // 2
```

#### 6.2.6 TypedArray.prototype.slice()

`slice`方法，可以返回一个指定位置的新的 TypedArray 实例。

```js
let ui8 = Uint8Array.of(0, 1, 2);
ui8.slice(-1);
// Uint8Array [ 2 ]
```

#### 6.2.7 TypedArray.of()

用于将参数转为一个 TypedArray 实例:

```js
Float32Array.of(0.151, -8, 3.7);
// Float32Array [ 0.151, -8, 3.7 ]
```

#### 6.2.8 TypedArray.from()

```js
Uint16Array.from([0, 1, 2]);
// Uint16Array [ 0, 1, 2 ]
```

## 7. 复合视图

由于视图的构造函数可以指定起始位置和长度, 所以在同一段内存之中, 可以依次存放不同的数据, 就叫做"复合视图":

```js
const buffer = new ArrayBuffer(24);

const idView = new Uint32Array(buffer, 0, 1);
const usernameView = new Uint8Array(buffer, 4, 16);
const amountDueView = new Float32Array(buffer, 20, 1);
```

这种数据结构用 c 语言来描述就是:

```c
struct someStruct {
  unsigned long id;
  char username[16];
  float amountDue;
};
```

## 8. DataView 视图

除了上面那种复合视图, `ArrayBuffer`实际上提供了`DataView`来创建复合视图, 并提供了一些操作方法:

`DataView`支持设定字节序. 设计目的在于处理网络设备传来的数据.

`DataView`本身也是构造函数, 接受一个`ArrayBuffer`对象作为参数生成视图:

```js
DataView(ArrayBuffer buffer [, 字节起始位置 [, 长度]]);
```

`DataView`实例具有以下属性, 含义与`TypedArray`相同.

-   `DataView.prototype.buffer`:返回对应的 ArrayBuffer 对象
-   `DataView.prototype.byteLength`:返回占据的内存字节长度
-   `DataView.prototype.byteOffset`:返回当前视图从对应的 ArrayBuffer 对象的哪个字节开始

`DataView`实例提供 8 个方法读取内存:

-   `getInt8`:读取 1 个字节，返回一个 8 位整数。
-   `getUint8`:读取 1 个字节，返回一个无符号的 8 位整数。
-   `getInt16`:读取 2 个字节，返回一个 16 位整数。
-   `getUint16`:读取 2 个字节，返回一个无符号的 16 位整数。
-   `getInt32`:读取 4 个字节，返回一个 32 位整数。
-   `getUint32`:读取 4 个字节，返回一个无符号的 32 位整数。
-   `getFloat32`:读取 4 个字节，返回一个 32 位浮点数。
-   `getFloat64`:读取 8 个字节，返回一个 64 位浮点数

这一系列`get`方法的参数都是一个字节序号, 表示从哪个字节开始读取.

```js
const buffer = new ArrayBuffer(24);
const dv = new DataView(buffer);

// 从第1个字节读取一个8位无符号整数
const v1 = dv.getUint8(0);

// 从第2个字节读取一个16位无符号整数
const v2 = dv.getUint16(1);

// 从第4个字节读取一个16位无符号整数
const v3 = dv.getUint16(3);
```

如果一次读取两个及以上字节, 几必须明确数据的存储方式, 到底是小端字节序还是大端字节序. 默认下, `DataView`是的`get`方法是使用大端字节序解读数据, 如果需要使用小端字节序解读, 必须在`get`方法的第二个参数指定`true`:

```js
// 小端字节序
const v1 = dv.getUint16(1, true);

// 大端字节序
const v2 = dv.getUint16(3, false);

// 大端字节序
const v3 = dv.getUint16(3);
```

`DataView`视图提供 8 个方法写入内存:

-   `setInt8`:写入 1 个字节的 8 位整数。
-   `setUint8`:写入 1 个字节的 8 位无符号整数。
-   `setInt16`:写入 2 个字节的 16 位整数。
-   `setUint16`:写入 2 个字节的 16 位无符号整数。
-   `setInt32`:写入 4 个字节的 32 位整数。
-   `setUint32`:写入 4 个字节的 32 位无符号整数。
-   `setFloat32`:写入 4 个字节的 32 位浮点数。
-   `setFloat64`:写入 8 个字节的 64 位浮点数。

这一系列`set`方法类似`get`, 接受两个参数, 第一个参数是字节序列, 表示从哪个字节开始写入, 第二个参数为写入的数据. 对于那些写入两个以上字节的方法, 需要在第三个参数指定, `false`和`undefined`表示大端字节序, `true`表示小端字节序.

```js
// 在第1个字节，以大端字节序写入值为25的32位整数
dv.setInt32(0, 25, false);

// 在第5个字节，以大端字节序写入值为25的32位整数
dv.setInt32(4, 25);

// 在第9个字节，以小端字节序写入值为2.5的32位浮点数
dv.setFloat32(8, 2.5, true);
```

不确定字节序的话, 可以使用这个方法进行判断:

```js
const littleEndian = (function() {
    const buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
})();
```

返回`true`为小端字节序, 返回`false`为大端字节序.

## 9. ArrayBuffer 的应用

### 9.1 Ajax

`XMLHttpRequest`第二版`XHR2`允许服务器返回二进制数据, 如果明确知道返回二进制数据类型, 可以把返回类型`responseType`设置为`arraybuffer`, 如果不知道就设为`blob`

```js
let xhr = new XMLHttpRequest();
xhr.open('GET', someUrl);
xhr.responseType = 'arraybuffer';

xhr.onload = function() {
    let arrayBuffer = xhr.response;
    // ···
};

xhr.send();
```

如果知道传回来的是 32 位整数, 可以向这样处理:

```js
xhr.onreadystatechange = function() {
    if (req.readyState === 4) {
        const arrayResponse = xhr.response;
        const dataView = new DataView(arrayResponse);
        const ints = new Uint32Array(dataView.byteLength / 4);

        xhrDiv.style.backgroundColor = '#00FF00';
        xhrDiv.innerText = 'Array is ' + ints.length + 'uints long';
    }
};
```

### 9.2 Canvas

`canvas`元素输出的二进制像素数据, 就是`typedArray`数组.

```js
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const uint8ClampedArray = imageData.data;
```

`uint8ClampedArray`是一种针对`canvsa`转悠的类型, 特点是针对颜色, 把每个字节解读为无符号的 8 位整数, 在发生运算的时候自动过滤高位移除, 为图像处理带来了巨大的方便.

比如, 如果把像素的颜色值设置`Uint8Array`类型, 那么乘以一个 gamma, 就必须这样计算:

```js
u8[i] = Math.min(255, Math.max(0, u8[i] * gamma));
```

而只用`Uint8ClampArray`就只需要:

```js
pixels[i] *= gamma;
```

### 9.3 WebSocket

`websocket`可以通过`arraybuffer`发送或者接受二进制数据:

```js
let socket = new WebSocket('ws://127.0.0.1:8081');
socket.binaryType = 'arraybuffer';

// Wait until socket is open
socket.addEventListener('open', function(event) {
    // Send binary data
    const typedArray = new Uint8Array(4);
    socket.send(typedArray.buffer);
});

// Receive binary data
socket.addEventListener('message', function(event) {
    const arrayBuffer = event.data;
    // ···
});
```

### 9.4 Fetch Api

FetchApi 取回的数据就是`ArrayBuffer`对象:

```js
fetch(url)
    .then(function(response) {
        return response.arrayBuffer();
    })
    .then(function(arrayBuffer) {
        // ...
    });
```

### 9.5 File Api

如果知道一个文件的二进制数据类型, 也可以将这个文件读取为`ArrayBuffer`对象.

```js
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
const reader = new FileReader();
reader.readAsArrayBuffer(file);
reader.onload = function() {
    const arrayBuffer = reader.result;
    // ···
};
```

这是一个读取 BMP 文件的示例, 假定 file 变量是一个指向 bmp 文件的文件对象:

```js
const reader = new FileReader();
reader.addEventListener('load', processimage, false);
reader.readAsArrayBuffer(file);
```

然后定义处理图像的回调函数: 简历`DataView`视图, 在建立一个`bitmap`对象用于存放处理后的数据, 最后将图像展示在`canvas`元素之中:

```js
function processimage(e) {
    const buffer = e.target.result;
    const datav = new DataView(buffer);
    const bitmap = {};
    // 具体的处理步骤
}
```

具体处理图像数据, 先处理 bmp 的文件头:

```js
bitmap.fileheader = {};
bitmap.fileheader.bfType = datav.getUint16(0, true);
bitmap.fileheader.bfSize = datav.getUint32(2, true);
bitmap.fileheader.bfReserved1 = datav.getUint16(6, true);
bitmap.fileheader.bfReserved2 = datav.getUint16(8, true);
bitmap.fileheader.bfOffBits = datav.getUint32(10, true);
```

处理图像图元信息:

```js
bitmap.infoheader = {};
bitmap.infoheader.biSize = datav.getUint32(14, true);
bitmap.infoheader.biWidth = datav.getUint32(18, true);
bitmap.infoheader.biHeight = datav.getUint32(22, true);
bitmap.infoheader.biPlanes = datav.getUint16(26, true);
bitmap.infoheader.biBitCount = datav.getUint16(28, true);
bitmap.infoheader.biCompression = datav.getUint32(30, true);
bitmap.infoheader.biSizeImage = datav.getUint32(34, true);
bitmap.infoheader.biXPelsPerMeter = datav.getUint32(38, true);
bitmap.infoheader.biYPelsPerMeter = datav.getUint32(42, true);
bitmap.infoheader.biClrUsed = datav.getUint32(46, true);
bitmap.infoheader.biClrImportant = datav.getUint32(50, true);
```

最后处理图像本身的像素信息:

```js
const start = bitmap.fileheader.bfOffBits;
bitmap.pixels = new Uint8Array(buffer, start);
```

然后下一步就可以根据需要进行图像变形或者转换格式.

### 9.6 SharedArrayBuffer

浏览器引入了`web worker`作为多线程的实现.

不同的`worder`线程之间可以通过`postMessage`进行通信.

```js
// 主线程
const w = new Worker('myworker.js');

// 主线程
w.postMessage('hi');
w.onmessage = function(ev) {
    console.log(ev.data);
};

// Worker 线程
onmessage = function(ev) {
    console.log(ev.data);
    postMessage('ho');
};
```

线程之间的数据交换可以是二进制的. 这种交换采用的是复制机制, 在数据量较大的时候会比较低效, 此时使用`SharedArrayBuffer`(ES7), 可以运行 worker 共享同一块内存. 达到数据分享的目的. `SharedArrayBuffer`与`ArrayBuffer`一样, 唯一的区别在于后者无法共享数据.

```js
// 主线程

// 新建 1KB 共享内存
const sharedBuffer = new SharedArrayBuffer(1024);

// 主线程将共享内存的地址发送出去
w.postMessage(sharedBuffer);

// 在共享内存上建立视图，供写入数据
const sharedArray = new Int32Array(sharedBuffer);

// Worker 线程
onmessage = function(ev) {
    // 主线程共享的数据，就是 1KB 的共享内存
    const sharedBuffer = ev.data;

    // 在共享内存上建立视图，方便读写
    const sharedArray = new Int32Array(sharedBuffer);

    // ...
};
```

### 9.7. Atomic 对象

多线程共享内存, 就会出现如何防止两个线程同时修改某个地址的问题. `SharedArrayBuffer`API 提供`Atomics`对象, 保证所有共享内存的操作都是"原子性"的, 并且可以在所有线程内同步.

#### 9.7.1 Atomics.store()，Atomics.load()

`store()`方法用来向共享内存写入数据, `load()`方法用来从共享内存读取数据.

```js
Atomics.load(array, index);
Atomics.store(array, index, value);
```

`store`方法接受三个参数: `SharedBuffer`的视图, 位置索引和值, 返回`sharedArray[index]`的值.

`load`方法接受两个参数: `SharedBuffer`的视图和位置索引, 也是返回`sharedArray[index]`的值.

```js
// 主线程
const worker = new Worker('worker.js');
const length = 10;
const size = Int32Array.BYTES_PER_ELEMENT * length;
// 新建一段共享内存
const sharedBuffer = new SharedArrayBuffer(size);
const sharedArray = new Int32Array(sharedBuffer);
for (let i = 0; i < 10; i++) {
    // 向共享内存写入 10 个整数
    Atomics.store(sharedArray, i, 0);
}
worker.postMessage(sharedBuffer);

// worker.js
self.addEventListener(
    'message',
    event => {
        const sharedArray = new Int32Array(event.data);
        for (let i = 0; i < 10; i++) {
            const arrayValue = Atomics.load(sharedArray, i);
            console.log(`The item at array index ${i} is ${arrayValue}`);
        }
    },
    false
);
```

#### 9.7.2 Atomics.exchange()

`exchange`方法是除了`store`外的另一种写入数据的方法, 区别在于`store`返回写入的值, `exchange`返回被替换的值.

```js
// Worker 线程
self.addEventListener(
    'message',
    event => {
        const sharedArray = new Int32Array(event.data);
        for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
                const storedValue = Atomics.store(sharedArray, i, 1);
                console.log(`The item at array index ${i} is now ${storedValue}`);
            } else {
                const exchangedValue = Atomics.exchange(sharedArray, i, 2);
                console.log(`The item at array index ${i} was ${exchangedValue}, now 2`);
            }
        }
    },
    false
);
```

上面的代码将共享内存的偶数位置的值改为 1, 奇数位置的值改为 2

#### 9.7.3 Atomics.wait()，Atomics.wake()

`wait`方法和`wake`方法用于等待通知. 这两个方法相当于锁内存, 记载一个县城进行操作时, 让其他线程休眠, 等到操作结束, 才唤醒那些休眠的线程:

```js
// Worker 线程
self.addEventListener(
    'message',
    event => {
        const sharedArray = new Int32Array(event.data);
        const arrayIndex = 0;
        const expectedStoredValue = 50;
        Atomics.wait(sharedArray, arrayIndex, expectedStoredValue);
        console.log(Atomics.load(sharedArray, arrayIndex));
    },
    false
);
```

`wait`方法告诉 worder 只要满足给定条件, 就在这一行 worder 线程进入休眠.

主线程一旦更改了指定位置的值, 就可以唤醒 Worker 线程:

```js
// 主线程
const newArrayValue = 100;
Atomics.store(sharedArray, 0, newArrayValue);
const arrayIndex = 0;
const queuePos = 1;
Atomics.wake(sharedArray, arrayIndex, queuePos);
```

`Atomics.wait()`方法的使用格式如下:

```js
Atomics.wait(sharedArray, index, value, timeout);
```

分别为: 共享内存的视图数组, 视图数据的位置, 该位置的预期值, 经过多少毫秒后自动唤醒(默认无穷大)

返回三种字符串:

-   如果`sharedArray[index]`不等于`value`, 返回`not-equal`, 否则进入休眠
-   如果`wake`唤醒, 就返回`ok`
-   如果超时唤醒, 返回`timed-out`

`Atomice.wake()`方法的使用格式如下:

```js
Atomics.wake(sharedArray, index, count);
```

分别为: 共享内存的视图数组, 视图数据的位置, 需要唤醒的 worker 数量(默认无穷大)

`wake`方法一旦唤醒休眠的 worder 线程, 就会让它继续往下运行.

```js
// 主线程
console.log(ia[37]); // 163
Atomics.store(ia, 37, 123456);
Atomics.wake(ia, 37, 1);

// Worker 线程
Atomics.wait(ia, 37, 163);
console.log(ia[37]); // 123456
```

#### 9.7.4 运算方法: add, sub, and, or, xor

-   `Atomics.add(sharedArray, index, value)`: 将`value`加到`sharedAttay[index]`
-   `Atomics.sub(sharedArray, index, value)`: 将`value`从`sharedAttay[index]`减去
-   `Atomics.and(sharedArray, index, value)`: 将`value`与`sharedAttay[index]`进行`and`位运算
-   `Atomics.or(sharedArray, index, value)`: 将`value`与`sharedAttay[index]`进行`or`位运算
-   `Atomics.xor(sharedArray, index, value)`: 将`value`与`sharedAttay[index]`进行`xor`位运算

#### 9.7.5 其他方法

-   `Atomics.compareExchange(sharedArray, index, oldval, newval)`: 如果`sharedArray[index]`等于`oldval`，就写入`newval`，返回`oldval`, 可以用于从`buffer`读取一个值, 单后对该值进行操作, 操作完检查值是否发生变化.
-   `Atomics.isLockFree(size)`: 返回一个布尔值，表示`Atomics`对象是否可以处理某个`size`的内存锁定。如果返回`false`，应用程序就需要自己来实现锁定。
