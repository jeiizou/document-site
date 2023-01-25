# JSBridge概述


JSBridge的目的是为了实现Native端和Web端的双向通信: 以JavaScript引擎或者Webview容器作为媒介, 通过协定协议进行通信.

通过HSBridge, Web端可以调用Native端的Java接口, 同样Native端也可以通过JSBridge调用Web端的JavaScript接口, 实现彼此的双向通信.

## WebView

webView是移动端提供的运行js的环境, 是系统渲染Web网页的一个控件, 可以与页面js交互, 实现混合开发, 其中Android和iOS有些不同

android的webview在低版本和高版本采用的`webkit`内核是不同的, 4.4之后直接使用`Chrome`.

iOS中`UIWebView`算是自IOS2就有的, 特性支持比较差, `WKWebView`则是在iOS8之后的升级版本.

## JSBridge的实现原理

Web端和Native可以类似于Client/Server模式, Web端调用原生接口时就像Client向Server端发送一个请求类似, JSBridge在此充当类似HTTP协议的角色, 实现JSBridge主要需要两点:

- 将Native端原生接口封装为JS接口
- 将web端的js接口封装为原生接口

### Native -> Web

JS作为一种解释性的语言, 最大的特点就是可以随时随地的通过解释器执行一段JS代码, 所以可以将拼接的js代码字符串, 传入js解析器执行, js解释器就是指webview

在安卓4.4之前只能使用loadURL来实现, 并且无法执行回调:

```java
String jsCode = String.format("window.showWebDialog('%s')", text);
webView.loadUrl("javascript: " + jsCode);
```

在安卓4.4之后提供了`evaluateJavascript`来执行JS代码, 并且可以获取返回值执行回调:

```java
String jsCode = String.format("window.showWebDialog('%s')", text);
webView.evaluateJavascript(jsCode, new ValueCallback<String>() {
  @Override
  public void onReceiveValue(String value) {

  }
});
```

IOS的UIWebView使用`stringByEvalutingJavaScriptFromString`:

```c
NSString *jsStr = @"执行的JS代码";
[webView stringByEvaluatingJavaScriptFromString:jsStr];
```

`iOS`的WKWebView使用`evaluateJavaScript`：

```c
[webView evaluateJavaScript:@"执行的JS代码" completionHandler:^(id _Nullable response, NSError * _Nullable error) {
  
}];
```

### Web -> Native

web调用Native端主要有两种方式

#### 1. 拦截WebView请求的`URL Schema`

`URL Schema`是类似URL的一种请求格式:

```
<protocol>://<host>/<path>?<qeury>#fragment
```

我们可以自定义JSBridge的URL Schema, 比如: `jsbridge://showToast?text=hello`

Native加载Webview之后, web发送的所有请求都会经过webview组件, 所以native可以重写webview里的方法, 拦截web发起的请求, 我们对请求的格式进行判断:

- 如果符合我们自定义的URL Schema, 对URL进行解析, 拿到相关操作, 进而调用原生的Native方法
- 如果不符合我们自定义的URL Schema, 则直接转发, 请求真正的服务

对于Web, 发送URL请求的方法有这么几种:

1. a标签
2. location.href
3. 使用iframe.src
4. 发送ajax请求

这些方法中, a标签需要用户操作, href可能会引起页面的丢失, ajax请求在安卓中没有相应的拦截方法, 所以使用`iframe.src`是比较常见的方案:

- 安卓提供了`shouldOverrideUrlLoading`方法拦截
- `UIWebView`使用`shouldStartLoadWithRequest`, `WKWebView`则使用`decidePolicyForNavigationAction`

这种方法从早期就存在了, 兼容性好. 缺点是基于URL, 长度受限, 并且不太直观.

#### 2. 向wenview中注入JS API

这个方法会通过webView提供的接口, App将Native的相关接口注入到JS的Context(window)的对象中, 一般来说这个对象内的方法名会与Native相关方法名是相同的, Web端就可以直接在全局window下使用这个暴露的JS对象, 进而调用原生端的方法.

这个过程更加的简单直观, 不过有兼容性的问题, 大部分情况下会使用这种方式:

```java
// 注入全局JS对象
webView.addJavascriptInterface(new NativeBridge(this), "NativeBridge");

class NativeBridge {
  private Context ctx;
  NativeBridge(Context ctx) {
    this.ctx = ctx;
  }

  // 增加JS调用接口
  @JavascriptInterface
  public void showNativeDialog(String text) {
    new AlertDialog.Builder(ctx).setMessage(text).create().show();
  }
}
```

然后在web端调用:

```js
window.NativeBridge.showNativeDialog('hello');
```

iOS的`UIWebView`提供了`JavaSciptCore`

iOS的`WKWebView`提供了`WKScriptMessageHandler`

### 带回调的调用

到目前为止, 我们现在还是一个单向通信的过程. 

所以在对端操作并返回结果, 有输入有输出才是完整的调用.

基于单向通信就可以实现这种功能, 我们在一端调用的时候再参数中加一个callbackId标记对应的回调, 对端接收到调用请求以后, 进行实际操作, 如果带有callbackId, 对端在进行一次调用, 将结果, callbackId回传回来, 这端根据`callbackId`匹配响应的回调, 将结果传入执行即可.

以安卓, 在web端实现带有回调的jsb为例:

```html
// Web端代码：
<body>
  <div>
    <button id="showBtn">获取Native输入，以Web弹窗展现</button>
  </div>
</body>
<script>
  let id = 1;
  // 根据id保存callback
  const callbackMap = {};
  // 使用JSSDK封装调用与Native通信的事件，避免过多的污染全局环境
  window.JSSDK = {
    // 获取Native端输入框value，带有回调
    getNativeEditTextValue(callback) {
      const callbackId = id++;
      callbackMap[callbackId] = callback;
      // 调用JSB方法，并将callbackId传入
      window.NativeBridge.getNativeEditTextValue(callbackId);
    },
    // 接收Native端传来的callbackId
    receiveMessage(callbackId, value) {
      if (callbackMap[callbackId]) {
        // 根据ID匹配callback，并执行
        callbackMap[callbackId](value);
      }
    }
  };

  const showBtn = document.querySelector('#showBtn');
  // 绑定按钮事件
  showBtn.addEventListener('click', e => {
    // 通过JSSDK调用，将回调函数传入
    window.JSSDK.getNativeEditTextValue(value => window.alert('Natvie输入值：' + value));
  });
</script>
```

然后在安卓端:

```java
// Android端代码
webView.addJavascriptInterface(new NativeBridge(this), "NativeBridge");

class NativeBridge {
  private Context ctx;
  NativeBridge(Context ctx) {
    this.ctx = ctx;
  }

  // 获取Native端输入值
  @JavascriptInterface
  public void getNativeEditTextValue(int callbackId) {
    MainActivity mainActivity = (MainActivity)ctx;
    // 获取Native端输入框的value
    String value = mainActivity.editText.getText().toString();
    // 需要注入在Web执行的JS代码
    String jsCode = String.format("window.JSSDK.receiveMessage(%s, '%s')", callbackId, value);
    // 在UI线程中执行
    mainActivity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        mainActivity.webView.evaluateJavascript(jsCode, null);
      }
    });
  }
}
```

## 参考链接

- [深入浅出JSBridge：从原理到使用](https://juejin.cn/post/6936814903021797389?utm_source=gold_browser_extension)