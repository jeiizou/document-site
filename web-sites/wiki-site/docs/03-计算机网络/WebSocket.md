# WebSocket


构建网络应用过程中, 有时需要长连接来进行频繁的数据通信或者获取服务主动信息. WebSocket是一种经典并且很常用的长连接方案. 

## 其他轮询方式

在此之前, 先介绍几种常用方案:

### 传统轮询

传统轮询比较简单, 可以使用`setInterval`或者`setTimeout`实现:

```js
setInterval(function() {
    $.get("/path/to/server", function(data, status) {
        console.log(data);
    });
}, 10000);
```

或者使用`settimeout`, 保证本次数据的前提下发起下一次请求:

```js
function poll() {
    setTimeout(function() {
        $.get("/path/to/server", function(data, status) {
            console.log(data);
            // 发起下一次请求
            poll();
        });
    }, 10000);
}
```

### 长轮询

短轮询的问题是每次请求会新建一个HTTP请求, 然而并不是每次都能返回需要的新数据. 长轮询的基本思想是每次客户端发出请求后, 服务器检查上次返回的数据于此请求时的数据之间是否更新, 如果有则返回新数据并结束链接, 否则, 服务器`pending`, 直到有新的数据返回, 并且可以设置一个比较大的`HTTP timeout`, 下面是一个简单长连接示例(长轮询依赖服务器支持并且实现):

PHP:

```php
<?php
    // 示例数据为data.txt
    $filename= dirname(__FILE__)."/data.txt";
    // 从请求参数中获取上次请求到的数据的时间戳
    $lastmodif = isset( $_GET["timestamp"])? $_GET["timestamp"]: 0 ;
    // 将文件的最后一次修改时间作为当前数据的时间戳
    $currentmodif = filemtime($filename);

    // 当上次请求到的数据的时间戳*不旧于*当前文件的时间戳，使用循环"hold"住当前连接，并不断获取文件的修改时间
    while ($currentmodif <= $lastmodif) {
        // 每次刷新文件信息的时间间隔为10秒
        usleep(10000);
        // 清除文件信息缓存，保证每次获取的修改时间都是最新的修改时间
        clearstatcache();
        $currentmodif = filemtime($filename);
    }

    // 返回数据和最新的时间戳，结束此次连接
    $response = array();
    $response["msg"] =Date("h:i:s")." ".file_get_contents($filename);
    $response["timestamp"]= $currentmodif;
    echo json_encode($response);
?>
```

JS:

```js
function longPoll (timestamp) {
    var _timestamp;
    $.get("/path/to/server?timestamp=" + timestamp)
    .done(function(res) {
        try {
            var data = JSON.parse(res);
            console.log(data.msg);
            _timestamp = data.timestamp;
        } catch (e) {}
    })
    .always(function() {
        setTimeout(function() {
            longPoll(_timestamp || Date.now()/1000);
        }, 10000);
    });
}
```

长轮询可以有效的解决带宽浪费问题, 但是每次连接保持都会消耗服务器资源, 尤其是对于apache+php的服务器, 对于长连接数量过多会丢失响应. 

### 服务器发送事件(Server-Sent Event)

服务器推送(SSE)是HTML5的一个规范, 可以实现服务器到客户端的单向数据通行. 通过SSE, 客户端可以自动获取数据更新, 不用重复发送HTTP, 一旦连接建立, `事件`就会自动被推送到和护短, 服务端通过SSE通过事件流的格式产生并推送事件, 事件对应的MIME为`text/event-stream`, 包含四个字段: 

- event:事件类型; 
- data: 消息类型; 
- id: 客户端EventSource对象的`last event ID string`; 
- retry: 指定了重新连接的时间.

服务端代码:

```php
<?php
    header("Content-Type: text/event-stream");
    header("Cache-Control: no-cache");
    // 每隔1秒发送一次服务器的当前时间
    while (1) {
        $time = date("r");
        echo "event: ping\n";
        echo "data: The server time is: {$time}\n\n";
        ob_flush();
        flush();
        sleep(1);
    }
?>
```

而在客户端中, SSE借由`EventSource`对象实现, `EventSource`包含五个额外属性:

- onerror
- onmessage
- onopen
- readyState
- url

以及两个内部属性: `reconnection time` 和 `last event`, 在`onerror`属性中我们可以对错误捕获和处理, 而`onmessage`则对应着服务器事件的接受和处理. 另外也可以使用`addEventListener`方法来监听服务器发送事件, 根据`event`字段区分处理. 

客户端:

```js
var eventSource = new EventSource("/path/to/server");
eventSource.onmessage = function (e) {
    console.log(e.event, e.data);
}
// 或者
eventSource.addEventListener("ping", function(e) {
    console.log(e.event, e.data);
}, false);
```

SSE相较于轮询具有较好的实时性, 使用方法也非常简便. 然而SSE只支持服务端到客户端单向的事件推送, 而且兼容性也存在一定的问题:

![image](/assets/2021-3-11/sse.jpeg)

## WebSocket简介

在2008年, websocket诞生了, 2011年成为了国际标准, 目前为止, 所有浏览器都已经支持. 

WebSocket同样是HTML5规范的组成部分之一, 其实现原理较为复杂, 简单来说: 

1. 客户端向`WebSocket`服务端通知(notify)一个带有所有`接受者ID(recipients IDS)`的事件(event), 
2. 服务器接收后通知所有活跃的客户端, 只有ID在接受者ID序列中的客户端才会处理这个事件. 
3. 由于WebSocket本身基于TCP协议, 所以在服务器端我们可以采用构建`TCP Socket`服务器的方式来构建`WebSocket`服务器. 

WebSocket是一种全新的协议, 它将TCP的`Socket`应用在了`web page`上, 从而使通行双方建立一个保持在活动状态的连接通道, 并且属于全双工.

WebSocket协议是借用HTTP协议的`101 switch protocol`来达到协议转换, 从而使通行双方切换成`websocket`通信协议. 

其最大的特点是通信双方都可以主动发起消息推送, 其他特点包括且不限于:

- 建立在TCP协议之上, 服务端的实现比较容易
- 与HTTP协议有良好的兼容性. 默认端口是80和443, 并且握手阶段采用HTTP协议, 因此握手时可以通过各种HTTP代理服务器. 
- 数据格式比较轻量, 新能开销小, 通信高效.
- 可以发送文本, 也可以发送二进制数据
- 没有同源限制, 客户端可以有任意服务器通行
- 协议标识符为`ws`, 如果加密则为`wss`, 服务器网址就是当前的`URL`.

## 协议介绍

websocket协议被设计来取代现有的使用HTTP作为传输层的双向通信技术, 并受益于现有的基础设施(代理, 过滤, 身份验证).

### 协议概述

协议有两部分, 握手和数据传输. 

其中来自客户端的握手看起来类似:

```
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: http://example.com
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13
```

而来自于服务器的握手看起来像:

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocol: chat
```

来自客户端的首行遵循`Request-Line`格式, 来自服务器的首行遵照`Status-Line`格式. ([RFC2616](http://tools.ietf.org/html/rfc2616))

一旦客户端和服务器都发送了握手, 且握手成功, 接着开始数据传输部分, 这是每一端都可以的双向通信信道, 批次独立且随意发送数据. 

一个成功握手之后, 客户端和服务端来回的传输数据. 规范中的概念单位为"消息". 这线路上, 一个消息由一个或多个帧组成. WebSocket的消息并不一定对应一个特定的网络层帧, 可以作为一个可以被中间合并或拆分的片段消息. 

### 握手

#### 客户端: 申请协议升级

首先客户端发起协议升级请求, 可以看到采用标准的HTTP报文, 且只支持GET方法:

```
GET / HTTP/1.1
Host: localhost:8080
Origin: http://127.0.0.1:3000
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: w4v7O6xFTi36lq3RNcgctw==
```

重点请求首部意义如下:

- `Connection: Upgrade`: 表示要升级协议
- `Upgrade: websocket`: 表示要升级到websocket协议
- `Sec-WebSocket-Version: 13`: 表示websocket的版本. 如果服务端不支持该版本, 需要返回一个`Sec-WebSocket-Versionheader`, 里面包含服务端支持的版本号. 
- `Sec-WebSocket-Key`: 与后面服务端响应首部的`Sec-WebSocket-Acccept`是配套的, 提供基本的防护, 比如恶意或无意的连接. 

#### 服务端: 响应协议升级

服务端返回内容如下:

```
HTTP/1.1 101 Switching Protocols
Connection:Upgrade
Upgrade: websocket
Sec-WebSocket-Accept: Oy4NRAQ13jhfONC7bP8dTKb4PTU=
```

- 状态码101表示协议切换. 到此完成协议升级, 后续的数据交互都按照新的协议来
- `Sec-WebSocket-Accept`: 根据客户端请求首部的`Sec-WebSocket-Key`计算出来的. 计算步骤:

    1. 将`Sec-WebSocket-Key`跟`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`拼接
    2. 通过SHA1计算摘要, 转为base64字符串

### 数据帧

websocket通行的最小单位是帧(frame), 由1或多个帧组成一条完整的消息.

- 发送端: 将消息切割成多个帧, 并发送给接收端
- 接收端: 接收消息帧, 并将关联的帧组装成完整的消息

#### 数据帧格式概览

用于数据传输部分的报文格式是通过ABNF来描述的. 

下面是WebSocket数据帧的格式:

```
0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-------+-+-------------+-------------------------------+
 |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 | |1|2|3|       |K|             |                               |
 +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 |     Extended payload length continued, if payload len == 127  |
 + - - - - - - - - - - - - - - - +-------------------------------+
 |                               |Masking-key, if MASK set to 1  |
 +-------------------------------+-------------------------------+
 | Masking-key (continued)       |          Payload Data         |
 +-------------------------------- - - - - - - - - - - - - - - - +
 :                     Payload Data continued ...                :
 + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 |                     Payload Data continued ...                |
 +---------------------------------------------------------------+
```

从左到有, 单位为比特, 内容包含了标识, 操作代码, 掩码, 数据, 数据长度等.

下面是详细解释:

- FIN(1 bit): 如果为1, 表示这是最后一个分片, 否则还有后续分片.
- RSV1, RSV2, RSV3(1 bit,1 bit,1 bit): 一般全为0, 当客户端, 服务端协商采用websocket扩展时, 这三个标志位可以非0, 且值的含义由扩展进行定义. 如果出现非0只, 且没有采用websocket扩展, 连接出错. 
- Opcode(4 bit): 操作代码, Opcode的值决定了应该如何解析后续的数据载荷(data payload). 如果操作代码是不认识的, 那么接受端应该断开链接(fail the connection), 可选的操作代码如下:
  - %x0: 表示一个延迟帧, 当为0时, 表示本次数据传输采用了数据分片, 当前收到的数据帧为其中一个数据分片
  - %x1: 表示这是一个文本帧
  - %x2: 表示这是一个二进制帧
  - %x3-7: 保留的操作代码, 用于后续定义的非控制帧
  - %x8: 表示连接断开
  - %xA: 表示这是一个pong操作
  - %xB-F: 保留的操作代码, 用于后续定义的控制帧
- Mask(1 bit): 表示是否要对数据载荷进行掩码操作. 从客户端向服务端发送数据时, 需要对数据进行掩码操作, 从服务端向客户端发送数据则不需要. 如果Mask是1, 则在`Masking-key`会定义一个`masking key`, 并用这个掩码来对数据载荷进行反掩码, 所有客户端发送到服务端的数据帧, Mask都为1. 
- payload length: 数据载荷的长度, 单位为字节, 7 bit或者7+16 bit或者1+64 bit. 假设Payload length===x, 若:
  - x为0~126: 数据的长度为x字节
  - x为126: 后续2个字节代表一个16位的无符号整数, 该无符号整数的值为数据的长度
  - x为127: 后续8个字节代表一个64位的无符号整数, 概无符号整数的值为数据的长度
  - 此外如果占用多个字节, payload length的二进制表达采用网络序(big endian, 重要的位在前)
- Masking-key(0或4 bit): 所有从客户端传送到服务端的数据帧，数据载荷都进行了掩码操作，Mask 为 1，且携带了 4 字节的 Masking-key。如果 Mask 为 0，则没有 Masking-key。
- Payload data：(x+y) 字节:
  - 载荷数据: 包括了扩展数据, 应用数据. 其中, 扩展数据x字节, 应用数据y字节
  - 扩展数据: 如果没有写上使用扩展的话, 扩展数据为0字节, 所有的扩展都必须声明扩展数据的长度, 或者可以如何计算出扩展的长度. 此外, 扩展如何使用必须在握手阶段就协商好, 若果扩展数据存在, 那么载荷数据长度必须将扩展数据的长度包含在内. 
  - 应用数据: 任意的应用数据, 在扩展数据之后, 占据了数据帧剩余的位置. 载荷数据长度减去扩展数据长度, 就得到应用数据的长度

#### 掩码算法

掩码键（Masking-key）是由客户端挑选出来的 32 位的随机数。掩码操作不会影响数据载荷的长度。掩码、反掩码操作都采用如下算法：

首先假设:

- `original-octet-i`：为原始数据的第 i 字节。
- `transformed-octet-i`：为转换后的数据的第 i 字节。
- `j`：为i mod 4的结果。
- `masking-key-octet-j`：为 mask key 第 j 字节。

算法描述如下:

```
j  = i MOD 4
transformed-octet-i = original-octet-i XOR masking-key-octet-j
```

### 数据传递

一旦WebSocket链接建立, 后续的操作就是基于数据帧的传递. 

WebSocket根据opcode来区分操作的类型. 比如0x8表示断开链接, 0x0-0x2表示数据交互. 

#### 数据分片

WebSocket的每条消息可能被切分为多个数据帧, 当WebSocket的接收方收到一个数据帧是, 会根据FIN判断是否为最后一个数据帧. 

此外, opcode在数据交换的场景下, 表示的是数据的类型.

#### 连接保持+心跳

WebSocket为了保持客户端, 服务端的实施双向通信, 需要确保客户端, 服务端之间的TCP通道保持连接没有断开. 然而, 对于长时间没有数据往来的连接, 如果依旧长时间保持着, 可能会浪费包括的链接资源. 

但不排除某些场景下, 客户端, 服务端虽然没有数据往来, 单人需要保持连接. 这个时候可以采用心跳来实现:

- 发送方=>接收方: ping
- 接收方=>发送方: pong

ping, pong的操作对应WebSocket的两个控制帧, opcode分别是`0x9`, `0xA`.

### 关闭连接

一旦发送或收到一个close控制帧, 这就是说, WebSocket关闭阶段握手已启动, 且WebSocket连接处理CLOSING状态. 

当底层TCP连接已关闭, 这就是说WebSocket连接已关闭且WebSocket连接处于CLOSED状态. 如果TCP连接在WebSocket关闭阶段已经完成后被关闭, WebSocket连接就是被完全地关闭了. 

### 状态码

当关闭一个已经建立的连接, 端点可以表明关闭的原因. 由端点解释这个原因, 并且端点应该给这个原因采取动作, 本规范是没有定义的, 本规范定义了一组预定义的状态码, 并制定那些范围可以被扩展, 框架和最终应用使用. 状态码和任何相关的文本消息是关闭帧可选的组件. 

| 状态码    | 名称                 | 描述                                                                                              |
| --------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| 0–999     |                      | 保留段, 未使用.                                                                                   |
| 1000      | CLOSE_NORMAL         | 正常关闭; 无论为何目的而创建, 该链接都已成功完成任务.                                             |
| 1001      | CLOSE_GOING_AWAY     | 终端离开, 可能因为服务端错误, 也可能因为浏览器正从打开连接的页面跳转离开.                         |
| 1002      | CLOSE_PROTOCOL_ERROR | 由于协议错误而中断连接.                                                                           |
| 1003      | CLOSE_UNSUPPORTED    | 由于接收到不允许的数据类型而断开连接 (如仅接收文本数据的终端接收到了二进制数据).                  |
| 1004      |                      | 保留. 其意义可能会在未来定义.                                                                     |
| 1005      | CLOSE_NO_STATUS      | 保留.  表示没有收到预期的状态码.                                                                  |
| 1006      | CLOSE_ABNORMAL       | 保留. 用于期望收到状态码时连接非正常关闭 (也就是说, 没有发送关闭帧).                              |
| 1007      | Unsupported Data     | 由于收到了格式不符的数据而断开连接 (如文本消息中包含了非 UTF-8 数据).                             |
| 1008      | Policy Violation     | 由于收到不符合约定的数据而断开连接. 这是一个通用状态码, 用于不适合使用 1003 和 1009 状态码的场景. |
| 1009      | CLOSE_TOO_LARGE      | 由于收到过大的数据帧而断开连接.                                                                   |
| 1010      | Missing Extension    | 客户端期望服务器商定一个或多个拓展, 但服务器没有处理, 因此客户端断开连接.                         |
| 1011      | Internal Error       | 客户端由于遇到没有预料的情况阻止其完成请求, 因此服务端断开连接.                                   |
| 1012      | Service Restart      | 服务器由于重启而断开连接.                                                                         |
| 1013      | Try Again Later      | 服务器由于临时原因断开连接, 如服务器过载因此断开一部分客户端连接.                                 |
| 1014      |                      | 由 WebSocket 标准保留以便未来使用.                                                                |
| 1015      | TLS Handshake        | 保留. 表示连接由于无法完成 TLS 握手而关闭 (例如无法验证服务器证书).                               |
| 1016–1999 |                      | 由 WebSocket 标准保留以便未来使用.                                                                |
| 2000–2999 |                      | 由 WebSocket 拓展保留使用.                                                                        |
| 3000–3999 |                      | 可以由库或框架使用.不应由应用使用. 可以在 IANA 注册, 先到先得.                                    |
| 4000–4999 |                      | 可以由应用使用.                                                                                   |


## 客户端API

创建一个WebSocket实例:

```js
WebSocket WebSocket(in DOMString url, in optional DOMString protocols);
WebSocket WebSocket(in DOMString url,in optional DOMString[] protocols);
```

参数:

- url: 表示要链接的URL, 应为响应的WebSocket地址
- protocols: 可选, 单个协议字符串或者多个协议名字字符串的数组. 这些字符串用来表示子协议, 这样做可以让一个服务器实现多种WebSocket子协议, 如果没有指定这个参数, 它会默认一个空的字符串. 

异常:

- `SECRITY_ERR`: 连接端口被屏蔽

代码:

```js
var ws = new WebSocket('ws://localhost:8080');
```

实例方法:

| 属性名         | 类型           | 描述                                                                                                                                                                        |
| -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| binaryType     | DOMString      | 一个字符串表示被传输二进制的内容的类型。取值应当是"blob"或者"arraybuffer"。"blob"表示使用DOM Blob 对象，而"arraybuffer"表示使用 ArrayBuffer 对象。                          |
| bufferedAmount | unsigned long  | 调用 send() 方法将多字节数据加入到队列中等待传输，但是还未发出。该值会在所有队列数据被发送后重置为 0。而当连接关闭时不会设为0。如果持续调用send()，这个值会持续增长。只读。 |
| extensions     | DOMString      | 服务器选定的扩展。目前这个属性只是一个空字符串，或者是一个包含所有扩展的列表。                                                                                              |
| onclose        | EventListener  | 用于监听连接关闭事件监听器。当 WebSocket 对象的readyState 状态变为 CLOSED 时会触发该事件。这个监听器会接收一个叫close的 CloseEvent 对象。                                   |
| onerror        | EventListener  | 当错误发生时用于监听error事件的事件监听器。会接受一个名为“error”的event对象。                                                                                               |
| onmessage      | EventListener  | 一个用于消息事件的事件监听器，这一事件当有消息到达的时候该事件会触发。这个Listener会被传入一个名为"message"的 MessageEvent 对象。                                           |
| onopen         | EventListener  | 一个用于连接打开事件的事件监听器。当readyState的值变为 OPEN 的时候会触发该事件。该事件表明这个连接已经准备好接受和发送数据。这个监听器会接受一个名为"open"的事件对象。      |
| protocol       | DOMString      | 一个表明服务器选定的子协议名字的字符串。这个属性的取值会被取值为构造器传入的protocols参数。                                                                                 |
| readyState     | unsigned short | 连接的当前状态。取值是 Ready state constants 之一。 只读。                                                                                                                  |
| url            | DOMString      | 传入构造器的URL。它必须是一个绝对地址的URL。只读。                                                                                                                          |

常用的三个监听事件:

```js
//指定连接成功后的回调函数
ws.onopen = function () {v
  ws.send('Hello Server!');
}

// 多个回调函数
ws.addEventListener('open', function (event) {
  ws.send('Hello Server!');
});

// 指定连接关闭后的回调函数
ws.onclose = function(event) {
  var code = event.code;
  var reason = event.reason;
  var wasClean = event.wasClean;
  // handle close event
};

ws.addEventListener("close", function(event) {
  var code = event.code;
  var reason = event.reason;
  var wasClean = event.wasClean;
  // handle close event
});

// 指定收到服务器数据后的回调函数
ws.onmessage = function(event) {
  var data = event.data;
  // 处理数据
};

ws.addEventListener("message", function(event) {
  var data = event.data;
  // 处理数据
});
```

服务数据可能是文本也可能是二进制数据:

```js
ws.onmessage = function(event){
  if(typeof event.data === String) {
    console.log("Received data string");
  }

  if(event.data instanceof ArrayBuffer){
    var buffer = event.data;
    console.log("Received arraybuffer");
  }
}
```

除了动态判断, 也可以使用`binaryType`属性来显示指定收到的二进制数据类型:

```js
// 收到的是 blob 数据
ws.binaryType = "blob";
ws.onmessage = function(e) {
  console.log(e.data.size);
};

// 收到的是 ArrayBuffer 数据
ws.binaryType = "arraybuffer";
ws.onmessage = function(e) {
  console.log(e.data.byteLength);
};
```

### 常量

#### Ready state 常量

这些常量是`readyState`属性的取值, 可以用来描述WebSocket连接的状态. 

| 常量       | 值  | 描述                             |
| ---------- | --- | -------------------------------- |
| CONNECTING | 0   | 连接还没开启。                   |
| OPEN       | 1   | 连接已开启并准备好进行通信。     |
| CLOSING    | 2   | 连接正在关闭的过程中。           |
| CLOSED     | 3   | 连接已经关闭，或者连接无法建立。 |

### 方法

#### close()

关闭WebSocket连接或停止正在进行的连接请求. 如果连接的状态已经是`closed`, 这个方法不会有任何效果. 

```js
void close(in optional unsigned short code, in optional DOMString reason);
```

参数:

- code: 可选, 一个数字, 表示关闭连接的状态好, 表示连接被关闭的原因. 如果这个参数没有被指定, 默认为1000
- reason: 可选, 表示被关闭的原因, 必须是不超过123字节的UTF8文本, 可能抛出的异常:
  - INVALID_ACCESS_ERR: 选定了无效的code
  - SYNTAX_ERR: reason字符串太长或者含有`unpaired surrogates`

#### send()

通过WebSocket连接向服务器发送数据:

```js
void send(in DOMString data);
void send(in ArrayBuffer data);
void send(in Blob data); 

// 发送string
ws.send('your message');

// 发送Blob
var file = document
  .querySelector('input[type="file"]')
  .files[0];
ws.send(file);

// 发送ArrayBuffer
var img = canvas_context.getImageData(0, 0, 400, 320);
var binary = new Uint8Array(img.data.length);
for (var i = 0; i < img.data.length; i++) {
  binary[i] = img.data[i];
}
ws.send(binary.buffer);
```

data: 发送到服务器的数据

可能抛出的异常:

- INVALID_STATE_ERR: 当前的连接状态不是OPEN
- SYNTAX_ERR: 数据是一个包含`unpaired surrogates`的字符串

## 服务端API

常用的node实现有以下三种:

- [socket.io](http://socket.io/)
- [uWebSocket](https://github.com/uNetworking/uWebSockets)
- [WebSocket-Node](https://github.com/theturtle32/WebSocket-Node)

## 常见问题

### 和TCP, HTTP协议的关系

WebSocket是基于TCP的独立的协议, 它的握手时有HTTP服务器解释为一个Upgrade请求.

WebSocket试图在现有的HTTP基础上下文中解决双向通信技术, 并且被设计工作在80和443端口, 支持HTTP代理和中间件.

### 数据掩码的作用

数据掩码可以增强协议的安全性. 但数据掩码并不是为了保护数据本身而是为了防止早起版本的协议中存在的`代理缓存污染攻击`等问题. 

## 参考链接

- [WebSocket 详解](https://github.com/Pines-Cheng/blog/issues/37)