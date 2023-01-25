
## Scrapy 入门指南

### 组成

- Scrapy Engine<引擎>: 负责控制数据流在系统中所有的组件流动, 并在相应的动作发生的时候触发事件
- Scheduler<调度器>: 从引擎接受request并将它们入队, 以便之后请求他们时提供给引擎
- Downloader<下载器>: 获取页面数据提供给引擎
- Spiders<爬虫类>: 负责特定网页的内容提取
- ItemPipeline: 负责处理被spider提取出来的item. 典型的处理有清理, 验证以及持久化
- Downloader Middlewares: 引擎和下载器之间的特定钩子, 处理DOwnloader传递给引擎的response. 提供了一个简便的机制, 通过插入自定义代码来扩展Scrapy功能, 比如自动更换user-agent, IP等
- Spider Middlewares: 是在引擎和Spider之间的特定钩子, 处理spider的输入和输出. 

### 数据流

- 引擎打开一个网站, 找到处理该网站的Spider, 并向该spider请求第一个要爬取的URL
- 从Spider中获取第一个要爬取的URL, 并在调度器中以Request调度
- 引擎向调度器请求下一个要爬取的URL
- 调度器返回下一个要爬取的URL给引擎, 引擎将URL通过下载中间件转发给下载器
- 一旦页面下载完毕, 下载器生成一个页面的Response, 并将其通过下载中间件发送给引擎
- 引擎从下载器中接受到Response并通过Spider中间件发送给Spider处理
- Spider处理Response并返回爬取到的item以及新的Request给引擎
- 从第二部重复进行调度, 直到没有更多的request, 关闭该网站

