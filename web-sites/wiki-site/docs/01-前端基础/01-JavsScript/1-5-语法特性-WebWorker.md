# 语法特性-WebWorker


浏览器提供了一种"任务并行机制", 作为一种 JS 本身之外的多线程能力.

在 JS 中, 我们可以这样初始化一个 webworker:

```js
var w1 = new Worker('http://some.url.1/mycoolworker.js');
```

指向的 js 文件会加载到一个 worker, 然后浏览器会启动一个分离的线程, 让这个文件在这个线程上作为独立的程序运行.

注意有几个特点:

1. webworker 不会相互共享任何作用域和资源
2. w1 是一个事件的监听器和触发器, 可以监听或者发送事件.

    ```js
    w1.addEventListener('message', function(evt) {
        // evt.data
    });

    w1.postMessage('something cool to say');
    ```

    在 worker 内部, 消息是完全对称的:

    ```js
    // "mycoolworker.js"

    addEventListener('message', function(evt) {
        // evt.data
    });

    postMessage('a really cool reply');
    ```

3. worker 和创建它的程序是一对一的
4. 调用`w1.terminate()`可以终结一个 worder, 这类似于关闭浏览器的标签页来杀死一个页面.
5. Worker 不能访问 DOM, 主程序的任何全局变量, 但是可以实施网络操作(ajax,websocket)和设置定时器, 此外,worker 可以访问一些重要的全局变量的拷贝, 比如`navigator`,`location`等.
6. 还可以使用`importScripts('foo.js','bar.js')`来加载额外的 JS 脚本到 worker 中
7. web worker 常用于密集型数学计算/大数据集合的排序/数据操作/高流量网络通信等.

## 数据传输

早些时候, webwoker 双向的数据传输一般选择数据序列化为字符串. 这种方法会降低性能.
现在有一些更好的选择:

1. “结构化克隆算法”: 如果你传递一个对象, 在另一段这个算法就会用于拷贝/复制这个对象.
2. 更好的选择: “Transferable 对象”. 它是使对象的所有权被传送, 而对象本身没动. 一旦传送一个对象给 Worker, 它在原来的位置就空了出来或者不可访问. 要使用这个对象不需要做什么, 任何实现了 Transferabe 接口的数据结构都将自动的用这种方式传递(Firefox 和 Chrome 支持)

## 共享的 workers

创建一个单独的中心化 Worker, 让网站或者应用的所有网页示例可以共享它(仅被 firefox/chrome 支持):

```js
var w1 = new SharedWorker('http://some.url.1/mycoolworker.js');
```

worker 需要知道消息来自哪里,这种唯一标识被称为端口(port):

```js
w1.port.addEventListener('message', handleMessages);

// ..

w1.port.postMessage('something cool');
```

此外, 端口连接必须初始化:

```js
w1.port.start();
```

保持多个分离的连接的最简单的方法是在 port 上使用闭包,同时在 connect 事件的处理器内部定义这个连接事件的监听与传送:

```js
// 在共享Worker的内部
addEventListener( "connect", function(evt){
	// 为这个连接分配的端口
	var port = evt.ports[0];

	port.addEventListener( "message", function(evt){
		// ..

		port.postMessage( .. );

		// ..
	} );

	// 初始化端口连接
	port.start();
} );
```

**注意：** 如果在一个端口的连接终结时还有其他端口的连接存活着的话，共享 Worker 也会存活下来，而专用 Worker 会在与初始化它的程序间接终结时终结。
