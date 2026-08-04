---
title: '写个小工具 Swwwitch'
slug: 'swwwitch'
date: 2019-03-30T11:29:54+08:00
draft: false
categories: ['macos', 'productivity']
tags: ['agent', 'applescript', 'backgroundcolor', 'cocoa', 'dock', 'dockless', 'evernote', 'login', 'macos', 'menu', 'nstask', 'nsview', 'process', 'safari', 'sandbox', 'shadowsocks', 'traffic', '印象笔记']
---

最近看到开发圈某热点，做了个小工具，总结下最近的几个 CocoaApp 上的功能，仅做练手。现在只包含了两个开关：切换系统主题和隐藏桌面 icon 的功能。

![Swwwitch-c500](https://i.imgur.com/U9RTmVU.png)

## 功能点

1.  切换系统主题
2.  显式或者印象桌面图标
3.  完全的 Menu Only 应用
4.  开机自启动

关于第三点的实现在[另外一篇文章](https://hechen.github.io/post/dockless-cocoaapps/)有讲过，第四点的实现在 [这一篇](https://hechen.github.io/post/autostartwhenlogin/) 中有讲。

### 系统主题切换

关于系统主题切换主要是基于 AppleScript 所写，

``` applescript
tell application "System Events"
    tell appearance preferences
        set dark mode to not dark mode
    end tell
end tell
```

你完全可以自行执行这段 Apple Script 来切换主题，你可以点击下面链接尝试。

[Click Here to run](#ZgotmplZ)

### 显式/隐藏桌面图标

关于隐藏桌面图标，实际上是执行系统的 Command 来实现的，Cocoa 应用可以显式使用 Process（也就是 NSTask）来执行任务，我们也是通过 NSTask 执行了一段如下的命令行达到的目的：

``` bash
defaults write com.apple.finder CreateDesktop false
killall Finder
```

你可以自行点击以下链接尝试。

[Click here to hide Desktop Icons](#ZgotmplZ)

[Click here to show Desktop Icons](#ZgotmplZ)

感兴趣可以去看下代码，领会意思即可。
[Releases](https://github.com/hechen/Swwwitch/releases)

## TODO

1.  Add more switch
2.  Add User-Customized switch setting

## Links

[Checkout all command lines macOS Support](https://ss64.com/osx/)
