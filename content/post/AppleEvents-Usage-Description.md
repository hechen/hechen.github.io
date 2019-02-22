---
title: "Apple Event Sandboxing"
date: 2019-02-21T23:25:38+08:00
lastmod: 2018-02-21T24:00:23+08:00
draft: false
categories: ["macOS"]
tags: ["Sandbox"]
---

## 问题背景

最近在修改某个 [Mac 应用](https://github.com/hechen/vibe)，其原理就是通过执行一段 AppleScript 获取 OmniFocus 的信息，然后进行可视化展示，但是总取不到数据。


## 原因

关键数据获取阶段执行的 AppleScript 的时候总是取不到数据。

``` AppleScript
set theProgressDetail to ""

tell application "OmniFocus"
    tell front document
        set theModifiedProjects to every flattened project
            repeat with a from 1 to length of theModifiedProjects
                set theCompletedTasks to (every flattened task of (item a of theModifiedProjects) where its number of tasks = 0)
                if theCompletedTasks is not equal to {} then
                    repeat with b from 1 to length of theCompletedTasks
                        set theProgressDetail to theProgressDetail & completion date of (item b of theCompletedTasks) & return
                    end repeat
                end if
            end repeat

        set theInboxCompletedTasks to (every inbox task where its number of tasks = 0)
    
        repeat with d from 1 to length of theInboxCompletedTasks    
            set theProgressDetail to theProgressDetail & completion date of (item d of theInboxCompletedTasks) & return
        end repeat
    end tell
end tell

display dialog theProgressDetail

return theProgressDetail
```

在 Cocoa 中是通过执行如下代码执行：

``` Swift
let myAppleScript = "I am a piece of applescript"
if let scriptObject = NSAppleScript(source: myAppleScript) {
    var error: NSDictionary?
    let output = scriptObject.executeAndReturnError(&error)
}
```

进行 Debug 启动 App 或者 Archive 安装包执行可执行文件，均无法正常获取执行结果，直接报错。 具体错误原因：

```
"NSAppleScriptErrorMessage" : "Not authorized to send Apple events to OmniFocus."
```	

很显然，没有权限执行该脚本来发送 Apple Event 给 OmniFocus 从而执行对应操作。

针对 Apple Event 的权限控制， 是 macOS Mojave 系统带入 macOS 的，Apple 把权限控制进一步收缩，并且要求开发者显示告知用户你的 App 要干什么。当然 iOS 开发同学肯定很清楚，我们无论是拿摄像头，读取相册，甚至是 FaceID 等都是要明确的在 App 中声明的，也就是要在 Info.plist 文件中声名的。

对于 macOS Mojave 系统而言，新增了针对 Apple Event 的权限控制，需要开发者在 plist 文件中增加 **NSAppleEventsUsageDescription** 信息，并且明确告知用户 Apple Event 会用来做什么事情。这也是去年 WWDC 2018 Session  ["Your Apps and the Future of macOS Security"](https://developer.apple.com/wwdc18/702) 中提到的，所有给其他 App 发送 AppleEvent 的 Cocoa App 均会受到影响，这就是  **AppleEvent sandboxing**。 如果你不添加该声明字段，App 就默认不进行任何显示授权行为并且默认无权限进行相关操作，也就是本文前面出现的情况。

话不多说，在 info.plist 中加入 NSAppleEventsUsageDescription 字段，并且填入具体权限声明,

![Capto_Capture 2019-02-21_11-47-11_P](https://i.imgur.com/NEBjVZ3.png)


再次启动 App 之后就会有如下弹窗提示：

![Capto_Capture 2019-02-21_11-47-42_P](https://i.imgur.com/wm5GWLO.png)


前面执行 Apple Script 的方法会同步等待授权结果，用户点击允许之后，App 就能正常获取数据了。

![Capto_Capture 2019-02-21_11-08-44_P](https://i.imgur.com/sfN59K4.png)


## 参考文档

[WWDC 2018 Session 702](https://developer.apple.com/videos/play/wwdc2018/702/)
