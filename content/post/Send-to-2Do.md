---
title: 如何做 Send to 2Do 的书签
date: 2018-11-26 14:59:50
categories: ["Productivity"]
tags: ["Bookmark","2Do","Things","OmniFocus"]
---


使用鼠标拖拽下面这个链接到你的 Favorites Bar 上，

[Send to 2Do](javascript:window.location='')

然后编辑地址，将其替换为如下：

```
javascript:window.location='twodo://x-callback-url/add?task='+encodeURIComponent(document.title)+'&note='+encodeURIComponent(window.location)+'&action=url:'+encodeURIComponent(window.location)
```

![Change Value](https://i.imgur.com/7M0xN1g.jpg)


所以，其实还是在触发调用 URL Scheme，其中 

1. `document.title` 为标题
2. `window.location` 为当前页面链接

我们知道 Things 的 URL Scheme 为 

`things:///add?title=iamtitle&notes=iamnotes&when=tomorrow`

比如你可以把链接内容改为支持 Send To Things：

```
javascript:window.location='things:///add?title='+encodeURIComponent(document.title)+'&notes='+encodeURIComponent(window.location)+'&when=today'
```

以及 Send To OmniFocus ，如下：

```
javascript:window.location='omnifocus:///add?note='+encodeURIComponent(window.location)+'&name='+encodeURIComponent(document.title)
```

或者直接去 [OmniFocus 页面](http://people.omnigroup.com/kc/OmniFocus/SendToOmniFocusBookmarklet.html) 用相同方式把起已经设置好正确 Value 的链接拖到上方工具条上即可。


如果你找不到 Favorites Bar，点击 Safari 菜单栏上的 View 菜单就能看到（中文系统叫视图）

![Favorites Bar](https://i.imgur.com/ZBqkn4Z.jpg)

