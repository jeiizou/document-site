---
slug: /DeepLearning/ChatGPTPrinciple
---

# Chat GPT 原理

ChatGPT 本质是在尝试产生**"合理的延续"**任何东西, 合理的意思是: 人可能会写出的东西

不理解字面意义的文本而是寻找某种意义匹配的内容. 

只是在一次又一的问: "现有文本的基础上, 下一个词应该是什么"

然后再每次都添加一个词.

这里生成的词是堆积俺概率排序的.

这意味着我们多次使用相同的提示, 每次得到的文章内容可能是不同的.

## 概率从何而来

- 取一个英文文本样本, 计算不同字母在其中出现的频率
- 进一步的, 不仅考虑单个词的概率, 还要考虑词对更长的词组的概率.

## 模型是什么

- 理论科学的本质: 建立一个模型, 提供一种计算答案的方案, 而不仅仅是测量和记住每个情况

识别图像:

