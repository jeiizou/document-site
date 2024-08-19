# Document Sites

文档 & wiki & 笔记

## wiki-site

- wiki
- blog

## note

杂七杂八的文档和代码


## 使用指南


### 依赖安装

- 本项目为`monorepo`架构, 并使用`rush`管理多个项目包
- [RUSH 官方文档](https://rushjs.io/zh-cn/pages/intro/welcome/)

- 初始化仓库 & 安装依赖: `rush update`


### note 书写

- 建议新建一个feat分支用于记录笔记
  - 因为直接在master分支上,每次push都会触发wiki的部署Action



### wiki 文档部署

- 目标部署在 GitHub Page
- 并通过Github Action + Docusaurus 的能力自动化部署
- 触发: 当master分支被推送