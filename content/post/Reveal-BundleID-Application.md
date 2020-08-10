---
title: "获取某个 Mac 应用的 BundleID"
date: 2020-08-10T12:05:54+08:00
categories: ["macOS"]
tags: ["Plist", "BundleID"]
---

我们知道无论是 iOS 还是 macOS 上的应用，其配置信息都是通过 plist 文件组织的，该应用的 BundleID 就藏在这个文件中，通过读取 plist 文件就能够知道其 Bundle ID 以及应用版本号等信息。我们以 App [Store.app](http://store.app) 为例，其 plist 文件就存储在如下路径，其他应用也是如此。

![App Store in Alfred](https://tva1.sinaimg.cn/large/007S8ZIlly1ghll6b7ut0j30x50srte2.jpg)

打开该 plist 文件就能找到该应用的配置信息。如下图所示。

![plist text](https://tva1.sinaimg.cn/large/007S8ZIlly1ghll68zwtzj30u50u0ndg.jpg)

大家知道 plist 本质上是 XML 格式的文件，我们需要找到键为 CFBundleIdentifier 的值，在上图中是 51 行， 52 行为其值，为 com.apple.AppStore.

知道了原理，就好办多了，macOS 内置有 plist 的工具 PlistBuddy，我们输入 plist 文件的路径，抽取某个 Key 的值就行。

![PlistBuddy](https://tva1.sinaimg.cn/large/007S8ZIlly1ghll60762tj31l202m0sr.jpg)

## Reference

1. [What is PlistBuddy?](https://medium.com/@marksiu/what-is-plistbuddy-76cb4f0c262d)
2. [Getting the bundle identifier of an OS X application in a shell script](https://superuser.com/questions/346369/getting-the-bundle-identifier-of-an-os-x-application-in-a-shell-script)
