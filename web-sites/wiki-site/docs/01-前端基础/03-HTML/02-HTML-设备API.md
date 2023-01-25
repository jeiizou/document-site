# HTML-设备API
 
## online state

获取设备的网络状态

```js
window.addEventListener('online', xxx);

window.addEventListener('offline', () => {
    alert('你断网啦！');
});
```

## battery state

获取设备的电池状态：

```js
navigator.getBattery().then(battery => console.log(battery));

// 返回
{
    charging, // 是否在充电
        chargingTime, // 充满电所需时间
        dischargingTime, // 当前电量可使用时间
        level,
        剩余电量;

    onchargingchange, // 监听充电状态变化
        onchargingtimechange, // 监听充满电所需时间变化
        ondischargingtimechange, // 监听当前电量可使用时间变化
        onlevelchange; // 监听电量变化
}
```

## vibration

使设备进行震动：

```js
// 震动一次
navigator.vibrate(100);

// 连续震动，震动200ms、暂停100ms、震动300ms
navigator.vibrate([200, 100, 300]);
```

## page visibility

顾名思义，这个 API 是用来监听页面可见性变化的，在 PC 端标签栏切换、最小化会触发、在移动端程序切到后台会触发，简单说就是页面消失了

```js
document.addEventListener('visibilitychange', () => {
    console.log(`页面可见性：${document.visibilityState}`);
});
```

## deviceOrientation

陀螺仪，也就是设备的方向，又名重力感应，该 API 在 IOS 设备上失效的解决办法，将域名协议改成 https；

```js
window.addEventListener('deviceorientation', event => {
    let { alpha, beta, gamma } = event;

    console.log(`alpha：${alpha}`);
    console.log(`beta：${beta}`);
    console.log(`gamma：${gamma}`);
});
```

方向示意如下, 从左到右分别为:`alpha`,`beta`,`gamma`:

![image](/assets/2021-3-9/deviceor.png)

## notification

PC 端的桌面通知，如网页端的微信，当收到消息时，右下角会出现一个通知（尽管你把浏览器最小化），因为这个通知时独立于浏览器的，是系统的一个原生控件；

```js
const notice = new Notification('前端宇宙情报局', {
    body: '这20个不常用的Web API真的有用吗?，别问，问就是有用🈶',
    icon: '我的掘金头像',
    data: {
        url: 'https://www.baidu.com'
    }
});

// 点击回调
notice.onclick = () => {
    window.open(notice.data.url); // 当用户点击通知时，在浏览器打开百度网站
};
```

注意：想要成功的调起通知，首先要用户的授权.

```js
Notification.requestPermission(prem => {
    prem == 'granted'; // 同意
    prem == 'denied'; // 拒绝
});
```

所以，再调用之前先向用户发起请求：

```js
let permission = Notification.permission;

if (permission == "granted") {
  // 已同意，开始发送通知
  ...
} else if (permission == "denied") {
  // 不同意，发不了咯
} else {
  // 其他状态，可以重新发送授权提示
  Notification.requestPermission();
}
```

## fullScreen

全屏不咯? 之前的一个项目刚好用上，不仅仅可以作用在 documentElement 上，还可以作用在指定元素；

```js
/**
 * @method launchFullScreen 开启全屏
 * @param {Object} elem = document.documentElement 作用的元素
 */
const launchFullScreen = (elem = document.documentElement) => {
    if (elem.requestFullScreen) {
        elem.requestFullScreen();
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullScreen) {
        elem.webkitRequestFullScreen();
    }
};
```

关闭全屏的时候需要注意的是，统一用 document 对象：

```js
/**
 * @method exitFullScreen 关闭全屏
 */
const exitFullScreen = () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    }
};
```

## orientation

可以监听用户手机设备的旋转方向变化；

```js
window.addEventListener(
    'orientationchange',
    () => {
        document.body.innerHTML += `<p>屏幕旋转后的角度值：${window.orientation}</p>`;
    },
    false
);
```

`css`的媒体查询也可以做到相同的效果:

```css
/* 竖屏时样式 */
@media all and (orientation: portrait) {
    body::after {
        content: '竖屏';
    }
}

/* 横屏时样式 */
@media all and (orientation: landscape) {
    body::after {
        content: '横屏';
    }
}
```

## 参考链接

-   [这些 Web API 真的有用吗? 别问，问就是有用](https://juejin.im/post/5d5df391e51d453b1e478ad0)