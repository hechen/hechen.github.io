---
title: 如何制作 Send to 2Do 的 Safari 书签
date: 2018-11-26 14:59:50
categories: ["Productivity"]
tags: ["Bookmark","2Do","Things","OmniFocus","Safari"]
---

使用鼠标拖拽下面这个链接到你的 Favorites Bar 上，默认点击行为实际上是模拟在当前页面进行导航，而目标地址由 `avascript:window.location` 来指定，目标地址实际上就是各个 App 的 URL Scheme。
你可以在 [AppTalk](https://app-talk.com/)查看各个主流 App 的 URL Scheme。

## 2Do

[Send to 2Do](javascript:window.location='')

然后编辑地址，将其替换为如下：

```
javascript:window.location='twodo://x-callback-url/add?task='+encodeURIComponent(document.title)+'&note='+encodeURIComponent(window.location)+'&action=url:'+encodeURIComponent(window.location)
```

![Change Value](https://i.imgur.com/7M0xN1g.jpg)

所以，本质上是执行了一段 JS 代码，结合当前文档的上下文信息，调用 URL Scheme，其中 

1. `document.title` 为标题
2. `window.location` 为当前页面链接


## Things

我们知道 Things 的 URL Scheme 的规则如下：
``` C
/// add a todo due when tomorrow
things:///add?title=iamtitle&notes=iamnotes&when=tomorrow
```

[Add a todo to Things](things:///add?title=iamtitle&notes=iamnotes&when=tomorrow)

比如你可以把链接内容改为支持 Send To Things：

``` JavaScript
javascript:window.location='things:///add?title='+encodeURIComponent(document.title)+'&notes='+encodeURIComponent(window.location)+'&when=today'
```

## OmniFocus

同理，可以有 Send To OmniFocus ，如下：

``` JavaScript
javascript:window.location='omnifocus:///add?note='+encodeURIComponent(window.location)+'&name='+encodeURIComponent(document.title)
```

[Add a todo to OmniFocus](things:///add?title=iamtitle&notes=iamnotes&when=tomorrow)

或者直接去 [OmniFocus 页面](http://people.omnigroup.com/kc/OmniFocus/SendToOmniFocusBookmarklet.html) 用相同方式把起已经设置好正确 Value 的链接拖到上方工具条上即可。

如果你找不到 Favorites Bar，点击 Safari 菜单栏上的 View 菜单就能看到（中文系统叫视图）

![Favorites Bar](https://i.imgur.com/ZBqkn4Z.jpg)
