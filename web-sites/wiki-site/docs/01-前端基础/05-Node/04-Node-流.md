# Node-流


> 流是数据的集合, 就像数组或者字符串. 区别在于流不是一次性获取到的. 他们不需要匹配内存. 因此可以在处理大容量数据, 或者一个额外的源每次获取一块数据的时候变得非常强大

## 一个流实例

```js
const fs = require('fs');
const file = fs.createWriteStream('./big.file');
for(let  i = 0;i<=1e7;i++) {
    file.write('Lorem ipsum dolor sit amet, consectetur adipisicing elit. \n');
}
file.end();
```

这里创建了一个很大的文件. 

fs可以用来从一个流接口里读取或者写入一个文件. 这个脚本中可以生成一个大约500mb(windows)的文件

```js
const fs = require('fs');
const server = require('http').createServer();
server.on('request', (req, res) => {
    fs.readFile('./big.file', (err, data) => {
        if(err) throw err;
        res.end(data);
    })
});
server.listen(8000);
```

然后用流的方式读取该文件

```js
const fs = require('fs');
const server = require('http').createServer();

server.on('request', (req, res) => {
  const src = fs.createReadStream('./big.file');
  src.pipe(res);
});

server.listen(8000);
```

比较两者的内存消耗


## Streams 101


Node中有四种基本的流类型: 

- 可读流(Readable): 数据可以被消费的源的抽象. 比如`fs.createReadStream`方法
- 可写流(Writable): 数据可以被写入目标的抽象. 比如`fs.createWriteStream`方法
- 双向流(Duplex): 双向流, 比如`TCP socket`
- 转换流(Transform): 基于双向流, 可以在读或者写的时候被用来更改或者转换数据. 一个例子就是`zlib.createGzip`使用`gzip`算法压缩数据. 你可以将转换流想象成一个函数, 它的输入是可写流, 输出是可读流.

所有的流都是`EventEmitter`的示例. 触发它们的时间可以读或者写入数据, 可以使用`pipe`消费流的数据

## pipe 方法

```js
readableSrc.pipe(writableDest)
```

也可以链式操作:

```js
readableSrc
  .pipe(transformStream1)
  .pipe(transformStream2)
  .pipe(finalWrtitableDest)
```

`pipe`方法返回目标流, 可以做链式调用`pipe`. 对于`a(readable)`, `b` , `c(duplex)` 以及 `d(writable)`. 可以这样写:

```sh
a.pipe(b).pipe(c).pipe(d)
# Which is equivalent to:
a.pipe(b)
b.pipe(c)
c.pipe(d)
# Which, in Linux, is equivalent to:
$ a | b | c | d
```

## Steam 事件

流可以被事件直接消费, 下面方法和`pipe`读取流等价:

```js
// readable.pipe(writable)
readable.on('data', (chunk) => {
  writable.write(chunk);
});

readable.on('end', () => {
  writable.end();
});
```

可读流和可写流的重要事件和函数列表如下:

![image](/assets/2021-3-17/stream-method-func.png)

事件和函数式相关的, 他们可以一起使用.

对于可读流:

- `data`: 当流传递给消费者一个数据块的时候就会触发
- `end`: 当在流中没有可以消费的数据的时候就会触发

对于可写流:

- `drain`: 当可写流可以接受更多的数据时的一个标志
- `finish`: 当所有的数据都写入到底层系统是会触发

事件和函数可以接口起来自定义和优化流的使用.

为了消费一个可读流, 我们可以用`pipe/unpipe`方法, 或者`read/unshift/resume`方法.

为了消费一个可写流, 我们可以将它作为`pipe/unpipe`的目标, 或者使用`warite`方法写入. 当我们完成的时候调用`end`方法

## 可读流的暂停和流动

可读流有两个主要模式影响到我们消费他们的方式:

- paused: 暂停模式
- flowing: 流动模式

有时候也会被称为`pull/push`模式

所有的可读流默认都是以暂停模式开始的, 可以切换到流动模式, 在需要的时候退回到暂停模式. 这些动作有时候是自动发生的. 

在暂停模式, 可以使用`read`方法从流中按需读取数据, 而对于一个在流动模式的可读流, 数据持续流动, 我们不得不监听事件是消费

在流动模式, 如果没有可获得的消费者去处理它, 数据实际上可能会丢失, 当有一个在流动模式的可读流, 我们需要一个data事件处理器. 实际上, 添加一个data事件处理器就能将暂停模式的流切换到流动模式. 

也可以使用`resume`和`pause`方法去手动切换两个模式

`pipe`方法则会自动管理这些模式

## 实现一个可写流

本质上使用流有两个主要的任务:

- 实现流(implementing)
- 消费流(consuming)

实现一个可写流:

```js
const { Writable } = require('stream');
```

有很多种方式可以实现一个可写流. 比如以`extend`的方式构造一个类:

```js
class myWritableStream extends Writable {
}
```

也可以通过构造函数:

```js
const { Writable } = require('stream');
const outStream = new Writable({
  write(chunk, encoding, callback) {
    console.log(chunk.toString());
    callback();
  }
});

process.stdin.pipe(outStream);
```

`warite`方法接受三个参数:

1. 如果没有配置流的格式, chunk一般是一个buffer
2. encoding, 在需要时用, 通常可以忽略
3. callback 是一个当我们处理完数据块之后需要调用的一个函数.

要消费这个流, 我们可以简单的用`process.stdin`使用它.

当我们运行上面的代码是, `process.stdin`的任何字符都会被`outStream`打印出来

等价于:

```js
process.stdin.pipe(process.stdout);
```

## 实现一个可读流

为了实现一个可读流, 我们可以获取`Readable`:

```js
const { Readable } = require('stream');
const inStream = new Readable({});
```

这里有一个实现可读流简单的方式:

```js
const { Readable } = require('stream'); 
const inStream = new Readable();
inStream.push('ABCDEFGHIJKLM');
inStream.push('NOPQRSTUVWXYZ');
inStream.push(null); // No more data
inStream.pipe(process.stdout);
```

当我们push一个null的时候, 意味着我们想要表示流没有更多的数据了

为了消费这个简单的可读的流, 我们可以简单的将它导入到可写流`process.stdout`

不过更好的方法是按需push, 当某个消费者需要它时, 我们可以在一个可读流的配置中通过read方法实现:

```js
const inStream = new Readable({
  read(size) {
    this.push(String.fromCharCode(this.currentCharCode++));
    if (this.currentCharCode > 90) {
      this.push(null);
    }
  }
});
inStream.currentCharCode = 65;
inStream.pipe(process.stdout);
```


## 实现双向流

```js
const { Duplex } = require('stream');

const inoutStream = new Duplex({
  write(chunk, encoding, callback) {
    console.log(chunk.toString());
    callback();
  },

  read(size) {
    this.push(String.fromCharCode(this.currentCharCode++));
    if (this.currentCharCode > 90) {
      this.push(null);
    }
  }
});

inoutStream.currentCharCode = 65;
process.stdin.pipe(inoutStream).pipe(process.stdout);
```

双向流的读写彼此独立, 而转换流并非如此:

```js
const { Transform } = require('stream');

const upperCaseTr = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

process.stdin.pipe(upperCaseTr).pipe(process.stdout);
```

## 流对象模式

默认的, 除了``Buffer/String`, 流还可以接受任何js对象

```js
const { Transform } = require('stream');
const commaSplitter = new Transform({
  readableObjectMode: true,
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().trim().split(','));
    callback();
  }
});
const arrayToObject = new Transform({
  readableObjectMode: true,
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    const obj = {};
    for(let i=0; i < chunk.length; i+=2) {
      obj[chunk[i]] = chunk[i+1];
    }
    this.push(obj);
    callback();
  }
});
const objectToString = new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    this.push(JSON.stringify(chunk) + '\n');
    callback();
  }
});
process.stdin
  .pipe(commaSplitter)
  .pipe(arrayToObject)
  .pipe(objectToString)
  .pipe(process.stdout)
```

我们传递一个输入字符, 通过commaSplitter流转换为(["a", "b", "c", "d"]). 就必须要在流上面加上`readableObjectMode`. 因为push了一个对象, 而不是字符串

当我们获取到数组并且pipe到ArrToObject流中, 我们就需要一个`writableObjectMode `表示让这个流接受对象. 

## 内置转换流

```js
const fs = require('fs');
const zlib = require('zlib');
const file = process.argv[2];

fs.createReadStream(file)
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream(file + '.gz'));
```

比如`zlib`和`crypto`流. 上面是一个示例, 用于创建一个文件的压缩

可以使用事件监听来获取进度信息, 比如:

```js
const fs = require('fs');
const zlib = require('zlib');
const file = process.argv[2];

fs.createReadStream(file)
  .pipe(zlib.createGzip())
  .on('data', () => process.stdout.write('.'))
  .pipe(fs.createWriteStream(file + '.zz'))
  .on('finish', () => console.log('Done'));
```

我们可以用`pipe`操作流, 也可以穿插着事件监听.

另一种可读性更好的写法是用转换流来报告进度, 用另一个pipe调用代替`.on`调用:

```js
const fs = require('fs');
const zlib = require('zlib');
const file = process.argv[2];

const { Transform } = require('stream');

const reportProgress = new Transform({
  transform(chunk, encoding, callback) {
    process.stdout.write('.');
    callback(null, chunk);
  }
});

fs.createReadStream(file)
  .pipe(zlib.createGzip())
  .pipe(reportProgress)
  .pipe(fs.createWriteStream(file + '.zz'))
  .on('finish', () => console.log('Done'));
```

`reportProgress`流简单的通过`pass-through`流, 并且准确的输出了进度报告.

再比如, 我们需要在gzip之前或者之后加密文件:

```js
const crypto = require('crypto');
// ...
fs.createReadStream(file)
  .pipe(zlib.createGzip())
  .pipe(crypto.createCipher('aes192', 'a_secret'))
  .pipe(reportProgress)
  .pipe(fs.createWriteStream(file + '.zz'))
  .on('finish', () => console.log('Done'));
```

先进行压缩然后进行加密一个传入的文件, 使得输出的压缩文件有密码.

想要解压, 就需要以一个相反的顺序使用:

```js
fs.createReadStream(file)
  .pipe(crypto.createDecipher('aes192', 'a_secret'))
  .pipe(zlib.createGunzip())
  .pipe(reportProgress)
  .pipe(fs.createWriteStream(file.slice(0, -3)))
  .on('finish', () => console.log('Done'));
```

## Buffer

<!-- TODO -->

### 常见问题

#### 新建BUffer会占用V8分配的内存吗

不会, Buffer属于堆外内存, 不是v8分配的.

#### Buffer.alloc和Buffer.allocUnsafe的区别

`Buffer.allocUnsafe`创建的`Buffer`实例的底层内存是未初始化的. 新创建的`Buffer`的内容是未知的. 可能包含敏感数据. 使用`Buffer.alloc()`可以创建以0初始化的`Buffer`实例.

#### Buffer的内存分配机制

为了高效的使用申请来的内存, Node采用了slab分配机制, slab是一种动态的内存管理机制, Node以8Kb为界限区分Buffer为大对象还是小对象. 

例如第一次分配一个1024字节的Buffer, Buffer.alloc(1024)就会分配用到一个slab, 接着如果继续Buffer.alloc(1024), 那么上一次用的slab的空间还没有用完, 因为总共是8kb, 没有一处就继续用该slab给buffer分配弓箭, 如果超过8kb, 那么直接用C++底层的SlowBuffer来给Buffer对象提供弓箭. 

#### Buffer乱码问题

一般只需要设置`rs.setEncoding('utf8')`即可解决乱码问题

```js
var rs = require('fs').createReadStream('test.md', {highWaterMark: 11});
```

## 参考链接

- [Node.js 流（stream）：你需要知道的一切](https://zhuanlan.zhihu.com/p/36728655)