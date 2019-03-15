---
title: 如何在英文语言系统的 Safari 中使用印象笔记？
date: 2019-03-13T00:30:49+08:00
lastmod: 2019-03-15T11:01:23+08:00
categories: ["Productivity"]
tags: ["Evernote","印象笔记","macOS"]
---


> 因为 Evernote 在国内使用了不同的账户体系，去年团队也彻底独立出来，但是 Safari 的剪藏插件是同一个，[下载地址](https://safari-extensions.apple.com/details/?id=com.evernote.safari.clipper-Q79WDW8YH9)，但是当你系统是英文系统的时候，使用 Safari 剪藏有点尴尬，就是根本找不到印象笔记的登录入口，该文做个记录。

首先 Safari 默认是没有 Develop 菜单的，因此先开启 Develop 模式，进入 Safari 的选项设置面板中，最后 Advanced 选项卡最下方如图勾选。

![Capto_Capture 2019-03-13_12-39-08_A](https://i.imgur.com/J5HvXn1.png)


此时，在 Safari 的顶部菜单中会多出 Develop 菜单入口，如下图所示：

![Capto_Capture 2019-03-13_12-40-57_A](https://i.imgur.com/OxPf4Ji.png)


安装印象笔记的插件之后，点击 Safari 上的印象笔记剪藏按钮，你会发现直接带到 Evernote 的登录界面，没有渠道让我登录印象笔记，即使你 Safari 已经登录了印象笔记，登录的 Session 和 Cookie 信息并没有任何用。

![Capto_Capture 2019-03-13_12-50-48_A](https://i.imgur.com/gVTWCOc.png)


这时，你就登录国际版 Evernote 账户，如果你没有，那就注册一个。总之，你需要先登录进去，因为我们必须让剪藏菜单展示出来才行。

登录 Evernote 之后，打开一个页面进行剪裁，之后如图，我们终于看到了剪藏菜单：

![Capto_Capture 2019-03-13_12-52-36_A](https://i.imgur.com/VtvROcP.png)


![Capto_Capture 2019-03-13_12-53-45_A](https://i.imgur.com/LsitsxG.png)


点击下方的 Options，打开设置选项

![Capto_Capture 2019-03-13_12-56-16_A](https://i.imgur.com/KpQefZc.png)


此时，因为刚才开启了 Develop 菜单选项卡，此时右键点击该窗口，

![Capto_Capture 2019-03-13_12-58-02_A](https://i.imgur.com/ylecnyS.png)


点击 Inspect Element 打开页面元素查看器，在下方元素展示区为焦点的前提下，Command +F 搜索 **DeveloperContainer** 关键字。


![Capto_Capture 2019-03-13_12-59-28_A](https://i.imgur.com/0DSMO39.png)


![Capto_Capture 2019-03-13_01-02-18_A](https://i.imgur.com/t3uqMa4.png)

所以大概猜得出来，这个面板实际上隐藏了一些开发者选项，这里通过 display:none 执行隐藏了，我们直接把 `display:none` 删掉，双击就能选中。



我们看到这个 div 下面包含很多 div（是一些开发者功能选项，就像很多程序一样，这些功能都被隐藏了，平时看不到），发现后面有一个 style =“display:none;”这是前端里面经常看到的一个样式语句，作用就是隐藏下面这个表里面的内容，然后按回车确定。

你会发现上方印象笔记的剪藏插件刷新了，之后你会发现之前被隐藏的选项出现了，如下图所示：


![Capto_Capture 2019-03-13_01-05-31_A](https://i.imgur.com/95qql8h.png)

Developer Options 这个选项表单出现了，就在不远处看到了选项 `Simulate Simplified Chinese`，选中后面复选框。之后剪藏插件会自动退登当前的 Evernote 账户，这时候再次点击剪藏按钮，就会触发印象笔记的登录了，地址会被带入地址 `https://app.yinxiang.com` 域下。

![Capto_Capture 2019-03-13_01-10-22_A](https://i.imgur.com/DH2DdLa.png)

登录完成之后，你的剪藏插件已经是印象笔记的账户了。


![Capto_Capture 2019-03-13_01-11-52_A](https://i.imgur.com/PXCjU4U.png)


Enjoy it.
