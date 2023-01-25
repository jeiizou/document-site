# Dart 简介

## 基础

Dart 的设计借鉴了 java 和 javascript, swift 等诸多语言.

-   Dart 是强类型语言

## 变量声明

-   var:一旦赋值, 类型不能改变.
-   dynamic: 动态类型, 声明的对象可以修改为任何类型
-   Object: Object 类型, 声明的对象可以修改为任何类型, 对象只允许使用 Obejct 的属性和方法.
-   final: 常量, 第一次使用时被初始化
-   const: 编译时常量, const 与 final 修饰的变量, 变量类型可以省略.

## 函数

1. 没有显示声明的返回值类型时会默认当做`dymaic`处理, 函数返回值没有类型推断.

```dart
//不指定返回类型, 默认为dynamic, 不是bool
bool isNoble(int atomicNumber) {
  return _nobleGases[atomicNumber] != null;
}
```

2. 对于只有一个表达式的函数, 可以采用箭头函数写法

```dart
bool isNoble(int atomicNumber)=>_nobleGases[atomicNumber]!=null;
```

3. 函数可以作为变量或者参数传递:

```dart
var say = (str){
  print(str);
};
say("hi world");

void execute(var callback) {
    callback();
}
execute(() => print("xxx"))
```

4. 可选的位置参数

```dart
String say(String from, String msg, [String device]) {
    var result = '$from says $msg';
    if (device != null) {
        result = '$result with a $device';
    }
    return result;
}
```

5. 可选的命名参数

使用`{param1, param2, …}`，用于指定命名参数

```dart
//设置[bold]和[hidden]标志
void enableFlags({bool bold, bool hidden}) {
    // ...
}
```

调用函数式, 可以使用指定命名参数:

```dart
enableFlags(bold: true, hidden: false);
```

## 异步

Dart 支持`async`与`await`关键字.

### Future

Future 非常相似于 JS 的 Promise, 其所有 API 的返回值仍是一个 Future:

-   Future.then

```dart
Future.delayed(new Duration(seconds: 2),(){
   return "hi world!";
}).then((data){
   print(data);
});
```

-   Future.catchError

```dart
Future.delayed(new Duration(seconds: 2),(){
   //return "hi world!";
   throw AssertionError("Error");
}).then((data){
   //执行成功会走到这里
   print("success");
}).catchError((e){
   //执行失败会走到这里
   print(e);
});
```

-   Future.whenComplete: 类似于`Promise.finally`

```dart
Future.delayed(new Duration(seconds: 2),(){
   //return "hi world!";
   throw AssertionError("Error");
}).then((data){
   //执行成功会走到这里
   print(data);
}).catchError((e){
   //执行失败会走到这里
   print(e);
}).whenComplete((){
   //无论成功或失败都会走到这里
});
```

-   Future.wait: 接受一个数组, 数组中所有的 Future 都执行成功后, 才会触发 then

```js
Future.wait([
  // 2秒后返回结果
  Future.delayed(new Duration(seconds: 2), () {
    return "hello";
  }),
  // 4秒后返回结果
  Future.delayed(new Duration(seconds: 4), () {
    return " world";
  })
]).then((results){
  print(results[0]+results[1]);
}).catchError((e){
  print(e);
});
```

### Async/await

用法类似于 js 中的 async/await

### Stream

Stream 可以接受多个异步操作的结果. 常用语多次读取数据的异步任务场景, 如网络内容下载, 文件读写等:

```dart
Stream.fromFutures([
  // 1秒后返回结果
  Future.delayed(new Duration(seconds: 1), () {
    return "hello 1";
  }),
  // 抛出一个异常
  Future.delayed(new Duration(seconds: 2),(){
    throw AssertionError("Error");
  }),
  // 3秒后返回结果
  Future.delayed(new Duration(seconds: 3), () {
    return "hello 3";
  })
]).listen((data){
   print(data);
}, onError: (e){
   print(e.message);
},onDone: (){

});
```

上面的代码会依次输出:

```bash
I/flutter (17666): hello 1
I/flutter (17666): Error
I/flutter (17666): hello 3
```
