---
title: 阅读流程
date: 2018-10-16 17:01:44
category: ["Book"]
tags: ["DEVONThink", "MarginNote", "PDFExpert"]
---

最近统一了一下自己的阅读流程，更新一下，具体用到的工具有

1. DEVONThink Pro
2. PDFExpert
3. MarginNote


其中 1 是输入和归档源，3 是输出源。 大概就是如下所示：

![Reading Process](https://i.imgur.com/SrcVtP1.png)


## 采集素材

在平时浏览网页的时候，看到自己喜欢的文章之后，想进行一些标记或者做笔记，大概有几个选择：

1. 印象笔记直接 clip 当前网页，之后在印象笔记里进行阅读或者标记
2. 放进稍后读服务中，比如 Pocket 或者 Instapaper 等；
3. 用 Safari 自带的 Save as PDF 之后再用单独的 PDF 工具查看；

而最近几个月，因为 MarginNote 3 的发布，由于其提供的大纲脑图的自动生成，给我提供了一种便利的拆书功能，因此会把平时看到的文章都归集到一处来看。

借助 DEVONthink 的 Clip To DEVONthink 的插件可以很方便的把文章归集到 DEONThink 中，最主要的是因为它能保存 WebArchive，即使后续文章被删除也没关系。

![Clip To DEVONthink](https://i.imgur.com/Kw7CoBl.png)


当按下 Cmmd + S 进行归档之后，DEVONThink 对应 Group 里就会把该原始页面保存起来。

![DEVONthink](https://i.imgur.com/m3jM9kx.png)

由于 WebArchive 无法做 Highlight 标记，这时候就用到了 DEVONthink 提供的 OCR 功能，将 WebArchive 提取为 PDF 文件。

![WebArchive To PDF](https://i.imgur.com/YxEsN2G.png)


## 二次加工处理

当你使用 DEVONthink 生成 PDF 之后，就可以直接用其自带的 PDF 阅读工具进行阅读了，它默认提供工具已经完全满足，不过我想利用 MarginNote 来阅读，因此这时候你可以选择直接发送到 MarginNote 来阅读。

其实更多时候，我会选择先使用 PDF Expert 进行 PDF 文件的裁剪，因为大多数时候网页正文内容两侧留白太多，想裁剪掉。

![PDF With Margin](https://i.imgur.com/8I8UcFY.png)

裁剪掉多余的部分之后，pdf 文件就可读性也会极大提高。
![Final PDF](https://i.imgur.com/1CwG33x.png)


## 阅读输出

到了这一步，我们就可以把文档导入到 MarginNote 中，如图所示：
![MarginNote Import](https://i.imgur.com/DmADrxk.png)

使用 **Add to Study**，将自己的标记和笔记生成笔记本，MarginNote 强大就在于能够很好的自动帮你把重点归集到一起，生成脑图关联，你还可以针对某个部分做笔记。

![MarginNote Add To Study](https://i.imgur.com/9uvu95H.png)

而且很多时候，我们看一篇文章很大可能会展开这个主题，比如看下该文章下给的参考链接，这些往往都是同样主题的内容，我们希望相关的文章能够整体归集到一个笔记本下。MarginNote 可以很方便做到，比如下图，我在阅读 Apple 官方 URL Session Programming Guide 的时候会查看很多相关文章，也都是相关内容，我会把笔记整理在一起。

![MarginNote Note Group](https://i.imgur.com/kIvn6v8.png)


我单独在 MarginNote 里建了一个 Folder ，叫 Article。专门阅读我从 DEVONthink 中采集到的文章。阅读完毕，还可以将阅读笔记归档，MarginNote 支持分享到 印象笔记，Word 或者 DEVONthink 进行归档。

![Export](https://i.imgur.com/yyQ3pOr.png)


到了这里，基本上对我来讲一个 输入 ── 处理 ── 阅读 ── 输出 的整个流程就结束了，基本上是一个闭环。

上面提到的三个工具，均有 iOS 版本，也就意味着即使拿着手机也能够不破坏整个阅读环节，不过其中 DEVONthink 提供的 iOS 版本是没办法进行 WebArchive 向 PDF 的转换的，处理这一步最后还是得放在 Mac 端处理，不过解决了输入和输出也就意味着随时随地可以捕获想看的内容放到稍后读列表，然后自动同步到 Mac 端进行处理，然后在 MarginNote 对应的 iOS 版本，平时在家的时候还是习惯用 iPad Pro 查看，体验也不错。

![iPad MarginNote](https://i.imgur.com/ZJsdxyS.jpg)