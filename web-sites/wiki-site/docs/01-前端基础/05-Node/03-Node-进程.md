# Node-进程


## 概述

Node运行在单线程下, 但这并不意味着无法利用多进程机器的性能优势.

## 创建进程

Node有四种创建进程的方式:

- spawn()
- exec()
- execFile()
- fork()

下面来简单的介绍这四种方法:

### spawn

```js
const { spawn } = require('child_process');
const child = spawn('pwd');
// 带参数的形式
// const child = spawn('find', ['.', '-type', 'f']);
```

`spawn()`返回`ChildProcess`的实例, `ChildProcess`同样基于事件机制(EventEmitter), 提供了一些事件:

- exit: 子进程退出时触发, 可以得知进程退出状态(code和signal)
- disconnect: 父进程调用child.disconnect()时触发
- error: 子进程创建失败, 或者被kill时触发
- close: 子进程的stdio流关闭是触发
- message: 子进程通过`process.send()`发送消息时触发, 父子进程之间可以通过这种内置的消息机制通信. 

可以通过`child.stdin`, `child.stdout`和`child.stderr`访问子进程的`stdio`流, 这些流被关闭的时候, 子进程会触发`close`事件

`close`与`exit`的区别主要体现在多进程共享同一个`stdio`流的场景, 某个进程退出了不意味着`stdio`流被关闭了. 

在子进程中, `stdout/stderr`具有Readable特性, 而`stdin`具有Writable特性, 与主进程的情况正好是相反的. 

```js
child.stdout.on('data', (data) => {
  console.log(`child stdout:\n${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`child stderr:\n${data}`);
});
```

利用`stdio`流的管道特性就可以完成一些复杂的工作:

```js
const { spawn } = require('child_process');

const find = spawn('find', ['.', '-type', 'f']);
const wc = spawn('wc', ['-l']);

find.stdout.pipe(wc.stdin);

wc.stdout.on('data', (data) => {
  console.log(`Number of files ${data}`);
});
```

#### IPC

可以通过`spawn`的`stdio`选项建立IPC机制:

```js
const { spawn } = require('child_process');

const child = spawn('node', ['./ipc-child.js'], { stdio: [null, null, null, 'ipc'] });
child.on('message', (m) => {
  console.log(m);
});
child.send('Here Here');

// ./ipc-child.js
process.on('message', (m) => {
  process.send(`< ${m}`);
  process.send('> 不要回答x3');
});
```

### exec

`spawn`方法默认不会创建shell去执行传入的命令, 而`exec()`方法会创建一个shell, 

另外`exec()`不是基于`stream`的, 而是把传入命令的执行结果暂存到`buffer`中, 再整个传递给回调函数. 

`exec()`方法的特点是完全支持shell语法, 可以直接传入任意shell脚本, 比如:

```js
const { exec } = require('child_process');

exec('find . -type f | wc -l', (err, stdout, stderr) => {
  if (err) {
    console.error(`exec error: ${err}`);
    return;
  }

  console.log(`Number of files ${stdout}`);
});
```

但是`exec()`因此也存在命令注入的安全风险, 在含有用户输入等动态内容的场景要特别注意. 所以比较适用的场景是: 希望直接使用shell语法, 并且预期输出数据量不大.(不存在内存压力)

那么有没有又支持shell, 也支持`stream IO`的方法, 答案是有的:

```js
const { spawn } = require('child_process');
const child = spawn('find . -type f | wc -l', {
  shell: true
});
child.stdout.pipe(process.stdout);
```

开启`shell`选项, 并通过`pipe()`方法把子进程的标准输出简单地接到当前进程的标准输入上, 以便看到命令执行的结果. 实际上还有更容易的方式:

```js
const { spawn } = require('child_process');
process.stdout.on('data', (data) => {
  console.log(data);
});
const child = spawn('find . -type f | wc -l', {
  shell: true,
  stdio: 'inherit'
});
```

`stdio: 'inherit'`允许子进程继承当前进程的标准输入输出（共享`stdin`，`stdou`t和`stderr`），所以上例能够通过监听当前进程`process.stdout`的`data`事件拿到子进程的输出结果.

除此之外, `spawn`还支持一些其他的选项:

```js
const child = spawn('find . -type f | wc -l', {
  stdio: 'inherit',
  shell: true,
  // 修改环境变量，默认process.env
  env: { HOME: '/tmp/xxx' },
  // 改变当前工作目录
  cwd: '/tmp',
  // 作为独立进程存在
  detached: true
});
```

#### env

`env`选项除了以环境变量形式向子进程传递数据意外, 还可以用来实现沙箱式的环境变量隔离. 默认把`process.env`作为子进程的环境变量集, 子进程与当前进程一样能够访问所有环境变量, 如果像上例中指定自定义对象作为子进程的环境变量集, 子进程就无法访问其他的环境变量. 

所以, 如果想要增删环境变量, 可以这么做:

```js
var spawn_env = JSON.parse(JSON.stringify(process.env));

// remove those env vars
delete spawn_env.ATOM_SHELL_INTERNAL_RUN_AS_NODE;
delete spawn_env.ELECTRON_RUN_AS_NODE;

var sp = spawn(command, ['.'], {cwd: cwd, env: spawn_env});
```

#### detached

```js
const { spawn } = require('child_process');

const child = spawn('node', ['stuff.js'], {
  detached: true,
  stdio: 'ignore'
});

child.unref();
```

以这种方式创建的独立进程行为取决于操作系统, window上的`detached`子进程将拥有自己的`console`窗口, 而linux上的该进程会创建新的**process group**(可以用来管理子进程, 实现类似于`tree-kill`的特性).

`unref()`方法用来断绝关系, 这样父进程可以独立退出, 不会导致子进程跟着退出, 但是要注意子进程的`sydio`也应该独立于父进程, 否则父进程退出之后子进程仍然会被影响.

### execFile

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```

类似`exec()`, 但不通过shell来执行, 所以要求传入可执行文件. windows下面某些文件无法直接执行, 比如`.bat`和`.cmd`, 这些文件就不能用这个方法, 只能借助上面的两种方式

> 与`exec()`一样也不是基于stream的，同样存在输出数据量风险


#### xxxSync

三个方法都有对应的同步阻塞版本, 一直到子进程退出:

```js
const { 
  spawnSync, 
  execSync, 
  execFileSync,
} = require('child_process');
```

### fork

`fork()`是`spawn()`的变体，用来创建Node进程，最大的特点是父子进程自带通信机制(IPC管道):

```js
var n = child_process.fork('./child.js');
n.on('message', function(m) {
  console.log('PARENT got message:', m);
});
n.send({ hello: 'world' });

// ./child.js
process.on('message', function(m) {
  console.log('CHILD got message:', m);
});
process.send({ foo: 'bar' });
```

因为`fork()`自带通信机制的优势，尤其适合用来拆分耗时逻辑，例如：

```js
const http = require('http');
const longComputation = () => {
  let sum = 0;
  for (let i = 0; i < 1e9; i++) {
    sum += i;
  };
  return sum;
};
const server = http.createServer();
server.on('request', (req, res) => {
  if (req.url === '/compute') {
    const sum = longComputation();
    return res.end(`Sum is ${sum}`);
  } else {
    res.end('Ok')
  }
});

server.listen(3000);
```

这么做的问题在于如果有人访问`/compute`, 后续的请求都无法及时的处理, 因为事件循环还被`longComputation`阻塞着. 为了避免耗时操作阻塞主进程的事件循环, 可以把`longComputation`拆分到子进程中:

```js
// compute.js
const longComputation = () => {
  let sum = 0;
  for (let i = 0; i < 1e9; i++) {
    sum += i;
  };
  return sum;
};

// 开关，收到消息才开始做
process.on('message', (msg) => {
  const sum = longComputation();
  process.send(sum);
});
```

主进程开启子进程`longComputation`:

```js
const http = require('http');
const { fork } = require('child_process');

const server = http.createServer();

server.on('request', (req, res) => {
  if (req.url === '/compute') {
    const compute = fork('compute.js');
    compute.send('start');
    compute.on('message', sum => {
      res.end(`Sum is ${sum}`);
    });
  } else {
    res.end('Ok')
  }
});

server.listen(3000);
```

## 进程通信

### 1. 通过`stdin/stdout`传递json

最直接的通信方式，拿到子进程的handle后，可以访问其stdio流，然后约定一种message格式开始愉快地通信：

```js
const { spawn } = require('child_process');

child = spawn('node', ['./stdio-child.js']);
child.stdout.setEncoding('utf8');

// 父进程-发
child.stdin.write(JSON.stringify({
  type: 'handshake',
  payload: '你好吖'
}));

// 父进程-收
child.stdout.on('data', function (chunk) {
  let data = chunk.toString();
  let message = JSON.parse(data);
  console.log(`${message.type} ${message.payload}`);
});
```

子进程于之类似:

```js
// ./stdio-child.js
// 子进程-收
process.stdin.on('data', (chunk) => {
  let data = chunk.toString();
  let message = JSON.parse(data);
  switch (message.type) {
    case 'handshake':
      // 子进程-发
      process.stdout.write(JSON.stringify({
        type: 'message',
        payload: message.payload + ' : hoho'
      }));
      break;
    default:
      break;
  }
});
```

> VS code 进程间通信就采用了这种方式.

明显的限制是需要拿到“子”进程的`handle`，两个完全独立的进程之间无法通过这种方式来通信（比如跨应用，甚至跨机器的场景）

### 2. 原生IPC支持

对于`spawn()`以及`fork()`, 进程之间是可以通过内置的IPC机制进行通信的

父进程：

- `process.on('message')`收
- `child.send()`发

子进程:

- `process.on('message')`收
- `process.send`发

限制是一样的, 需要一方拿到另外一方的handle

### 3. sockets

借助网络来完成进程间通信，不仅能跨进程，还能跨机器. 这里用`node-ipc`框架来演示如何使用:

```js
// server
const ipc=require('../../../node-ipc');

ipc.config.id = 'world';
ipc.config.retry= 1500;
ipc.config.maxConnections=1;

ipc.serveNet(
    function(){
        ipc.server.on(
            'message',
            function(data,socket){
                ipc.log('got a message : ', data);
                ipc.server.emit(
                    socket,
                    'message',
                    data+' world!'
                );
            }
        );

        ipc.server.on(
            'socket.disconnected',
            function(data,socket){
                console.log('DISCONNECTED\n\n',arguments);
            }
        );
    }
);
ipc.server.on(
    'error',
    function(err){
        ipc.log('Got an ERROR!',err);
    }
);
ipc.server.start();

// client
const ipc=require('node-ipc');

ipc.config.id = 'hello';
ipc.config.retry= 1500;

ipc.connectToNet(
    'world',
    function(){
        ipc.of.world.on(
            'connect',
            function(){
                ipc.log('## connected to world ##', ipc.config.delay);
                ipc.of.world.emit(
                    'message',
                    'hello'
                );
            }
        );
        ipc.of.world.on(
            'disconnect',
            function(){
                ipc.log('disconnected from world');
            }
        );
        ipc.of.world.on(
            'message',
            function(data){
                ipc.log('got a message from world : ', data);
            }
        );
    }
);
```

### 4. message queue

父子进程都通过外部的消息机制来通信, 跨进程的能力取决于MQ的支持.

即进程间不直接通信, 而是通过中间层(MQ), 加一个控制层来获得更多灵活性和优势:

- 稳定性: 消息机制提供了强大的稳定性保证, 比如确认送达, 失败重发, 防止多发等等
- 优先级控制: 允许调整消息响应次序
- 离线能力: 消息缓存
- 事务性消息处理: 把关联消息组合成事务, 保证送达顺序以及完成性

比如`smrchy/rsmq`, 消息的收/发/缓存/持久化依靠Redis提供的能力，在此基础上实现完整的队列机制

同样, Redis自带`pub/sub`机制, 适用于简单的通信场景, 比如一对一或者一对多, 并且不关注消息可靠性的场景. 

另外, Redis有list结构, 可以用作消息队列, 以此提高消息可靠性. 

## 守护进程

守护进程是一个在后台运行并且不受任何终端控制的进程. 

使用Node创建守护进程也不难, 大概的过程如下:

1. 创建一个进程A
2. 在进程A中创建进程B
3. 对进程B执行`setside`方法
4. 进程A退出, 进程B由`init`进程接管, 此时进程B为守护进程

### setsid

setsid主要完成三件事:

1. 该进程变为一个新会话的会话领导
2. 该进程变为一个新进程组的组长
3. 该进程没有控制终端

### 例子

具体代码如下:

```js
var spawn = require('child_process').spawn;
var process = require('process');

var p = spawn('node',['b.js'], {
    detached : true
});
console.log(process.pid, p.pid);
process.exit(0);
```

其中`b.js`如下:

```js
var fs = require('fs');
var process = require('process');

fs.open("/Users/mebius/Desktop/log.txt",'w',function(err, fd){
	console.log(fd);
	while(true)
	{
		fs.write(fd,process.pid+"\n",function(){});
	}
});
```

## 参考链接

- [Nodejs进程间通信](http://www.ayqy.net/blog/nodejs%E8%BF%9B%E7%A8%8B%E9%97%B4%E9%80%9A%E4%BF%A1/#articleHeader7)
- [Nodejs 编写守护进程](https://juejin.cn/post/6844903444839399438)