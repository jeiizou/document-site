# Taro-框架原理

## taro的起源

taro 1.x 的最初的想法就是想使用react的语法来编写小程序. 于是借助了Babel, 将`jsx`转译为`template`语法.

由于JSX的语法非常的灵活, taro团队只能通过穷举的方式, 把常用的, React官方推荐的写法作为转换规则加以支持. 

另一个方面, 在业务中的多端需求, 促使他们希望将转译后的代码运行到不同的平台上. 这样一来, 仅仅将代码按照对应的语法规则转换就不能够满足所有情况了, 因为不同的端上有自己的原生组件和API, 代码直接进行转换, 不能直接执行, 需要运行时的适配.

所以, taro团队就按照微信小程序的组件库和API标准, 在不同的端上(H5, RN)分别实现了组件库和API库. taro 1.x的体系架构大致如下:

![alt](https://mmbiz.qpic.cn/mmbiz_png/VicflqIDTUVUP6PkibgoPSXZsNuhRBia6UcY1tZ4VrgoicGPpicmwiazbanH49IuafQVGWNiaQ9icv38uK73RGLa1LNv8g/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

## template 到 自定义组件

WXML提供模板预发, 可以在模板中定义代码片段, 然后在不同的地方调用. 大概使用如下:

1. 定义模板

```html
<!--
  index: int
  msg: string
  time: string
-->
<template name="msgItem">
  <view>
    <text> {{index}}: {{msg}} </text>
    <text> Time: {{time}} </text>
  </view>
</template>
```

2. 使用模板

利用`is`属性, 可以声明需要使用的模板, 然后将模板所需要的`data`传入

```html
<template is="msgItem" data="{{...item}}"/>
```

对应的数据如下:

```js
Page({
  data: {
    item: {
      index: 0,
      msg: 'this is a template',
      time: '2016-09-15'
    }
  }
})
```

在taro设计的初期, 由于小程序推出的自定义组件功能不完善, 存在着无法传入自定义函数等缺陷. 所以采用了`template`来实现组件. 

使用`template`实现的组件化架构能够应付大部分的情况, 但是面对复杂的循环嵌套输出组件则问题不断, 主要问题在于:

- js逻辑和模板是分离的, 需要分别处理, 导致组件传参非常的麻烦
- template实现的自定义组件无法嵌套子组件

随着小程序自定义组件的完善, 最终taro团队还是把组件库方案迁移到了自定义组件上. 

在新的架构中, taro的组件会直接编译成小程序的原生组件的`Component`方法调用, 在通过运行时的适配, 来对组件参数, 生命周期, 事件传入进行处理, 借助小程序的组件化能力来实现Taro的组件处理. 

## 重构: 进入taro2.x

1. 重构cli

1.x时代的cli存在如下的问题:

- 维护困难, 每次需要新增功能都需要直接改动cli
- 共建困难, 代码负责, 逻辑分支众多
- 可扩展性低, 自研的构建系统, 没有考虑到后续的扩展性

所以在2.0时代, taro基于webpack来实现编译构建, 抽离大量的分支逻辑, 只关注区分编译平台, 处理不同平台编译入参等操作, 随后再调用对应平台的runner编译器, 进行代码编译操作, 把大量原来的AST语法操作改造为webpack的plugin以及loader, 交给webpack来处理. 

![alt](https://mmbiz.qpic.cn/mmbiz_png/VicflqIDTUVUP6PkibgoPSXZsNuhRBia6Ucmh5Scyia7EF4yWp4XxxxBwOj417U6jLa8ZoVUpMsksWEFKW7OUkvreA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

新的编译构建系统:

- 容易维护
- 更加稳定
- 扩展性强
- 多端编译统一

## 新架构: 3.x 时代

原本的taro应该属于**重编译时, 轻运行时**的多端编译框架. 在3.x则变成了**轻编译时, 重运行时**框架. 

在使用react开发页面的时候, 渲染页面主要依靠react-dom来操作dom树, 对于react-native来说, 则是依赖于`yoga`布局引擎. 两者通过抽象的`virtual-dom`联系在一起. 小程序中虽然没有直接暴露DOM和BOM API, 但是这种系统是可以借鉴的. 通过在小程序中模拟实现DOM以及BOM的API, 从而实现直接将React运行到小程序环境中的目的. 这就是Taro3.x的基本原理. 

![alt](https://mmbiz.qpic.cn/mmbiz_png/VicflqIDTUVUP6PkibgoPSXZsNuhRBia6UcpdUa7RPBd17hg0ovu6Wibc2x8gFaBFdLE54H6yEbbKMVphw3K82TAPQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

更进一步的, 在`taro3.1`中, taro的开发团队系统将整个taro进行解耦, 打开一个开放的生态环境, 以插件的形式扩展Taro的端平台支持能力:

- 插件的开发者无需修改核心库的代码, 就能编写出一个端平台插件
- 插件使用者只需要安装和配置端平台插件, 就可以把代码编译指定的平台
- 开发者继承现有的端平台插件, 然后对平台的适配逻辑进行自定义

![alt](https://mmbiz.qpic.cn/mmbiz_png/VicflqIDTUVUP6PkibgoPSXZsNuhRBia6UcTXSxcQNIIQFaXlLLb5MzcahpN3Rb2gIr99Uo1fciaSORjIZWlOKy6HA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

