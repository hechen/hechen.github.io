
---
title: "写个小工具 Swwwitch"
date: 2019-03-30T11:29:54+08:00
lastmod: 2019-02-30T17:20:38+08:00
categories: ["macOS"]
tags: ["Menu","AppleScript","NSTask","Process"]
---

最近追热点 😂 ，做了个小工具，仅做练手。一键切换功能开发，现在只包含了两个开关：切换系统主题和隐藏桌面 icon 的功能。其实，从我个人而言，有 Alfred 以及 LaunchBar 这些工具在手，这种工具存在意义并不大。

<!-- more -->

![Swwwitch-c500](https://i.imgur.com/U9RTmVU.png)

## 功能点

1. 切换系统主题
2. 显式或者印象桌面图标
3. 完全的 Menu Only 应用

关于第三点的实现在[另外一篇文章](https://hechen.xyz/post/dockless-cocoaapps/)有写过。

### 系统主题切换

关于系统主题切换主要是基于 AppleScript 所写，

``` AppleScript
tell application "System Events"
	tell appearance preferences
		set dark mode to not dark mode
	end tell
end tell
```

你完全可以自行执行这段 Apple Script 来切换主题，你可以点击下面链接尝试。

[Click Here to run](applescript://com.apple.scripteditor?action=new&name=Change%20Theme&script=tell%20application%20%22System%20Events%22%0D%09tell%20appearance%20preferences%0D%09%09set%20dark%20mode%20to%20not%20dark%20mode%0D%09end%20tell%0Dend%20tell)


### 显式/隐藏桌面图标

关于隐藏桌面图标，实际上是执行系统的 Command 来实现的，Cocoa 应用可以显式使用 Process（也就是 NSTask）来执行任务，我们也是通过 NSTask 执行了一段如下的命令行达到的目的：

```Shell
defaults write com.apple.finder CreateDesktop false
killall Finder
```

你可以自行点击以下链接尝试。

[Click here to hide Desktop Icons](applescript://com.apple.scripteditor?action=new&name=Hide%20Desktop%20Icons&script=tell%20application%20%22Terminal%22%0D%20%20%20%20do%20script%20%22defaults%20write%20com.apple.finder%20CreateDesktop%20false%3b%20killall%20Finder%22%0Dend%20tell)

[Click here to show Desktop Icons](applescript://com.apple.scripteditor?action=new&name=Hide%20Desktop%20Icons&script=tell%20application%20%22Terminal%22%0D%20%20%20%20do%20script%20%22defaults%20write%20com.apple.finder%20CreateDesktop%20true%3b%20killall%20Finder%22%0Dend%20tell)


感兴趣可以去看下代码，领会意思即可。
[Releases](https://github.com/hechen/Swwwitch/releases)



## TODO
1. Add more switch
2. Add User-Customized switch setting


## Links

[Checkout all command lines macOS Support](https://ss64.com/osx/)