---
title: '如何获取 Mac 应用的 Bundle ID'
slug: 'reveal-bundleid-application'
date: 2020-08-10T12:05:54+08:00
lastmod: 2026-09-07T12:00:00-07:00
draft: false
categories: ['macos']
tags: ['bundleid', 'plist', 'shell']
---

应用名称和 Bundle ID 是两回事。例如，App Store 的 Bundle ID 是 `com.apple.AppStore`。脚本或配置描述文件要求填写应用标识符时，需要的就是这个值。

它保存在应用的 `Info.plist` 中，对应的键是 `CFBundleIdentifier`。可以在 Finder 里查看，也可以用 macOS 自带的命令直接读取，不需要启动应用。

*2026 年 9 月 7 日更新：更换了截图，并在 macOS 27 测试版上验证了下方命令。Finder 的操作步骤也与 Apple 当前的部署指南一致。*

## 在 Finder 中查看

找到应用，按住 Control 点击它，选择**显示包内容（Show Package Contents）**，再打开 **Contents** 文件夹，找到 **Info.plist**。这也是 [Apple 文档介绍的方法](https://support.apple.com/guide/deployment/get-the-bundle-id-for-a-mac-app-dep0af2cd611/web)。

![Finder 中选中了 App Store.app 内的 Info.plist，底部显示了应用包路径。](/images/posts/reveal-bundleid-application/finder-info-plist.png)

这台 Mac 上，App Store 的 plist 路径是：

```text
/System/Applications/App Store.app/Contents/Info.plist
```

下载的应用通常在 `/Applications`，Apple 自带应用也可能位于 `/System/Applications`。以实际安装位置为准，不要直接套用其他应用的路径。

用文本编辑打开 plist，搜索 `CFBundleIdentifier`。如果安装了 Xcode，也可以使用它的属性列表编辑器；界面中这个键可能显示为 **Bundle identifier**。

![文本编辑在 App Store 的 Info.plist 中找到了 CFBundleIdentifier，下一行的值为 com.apple.AppStore。](/images/posts/reveal-bundleid-application/textedit-bundle-identifier.png)

XML 格式的 plist 中，这一项是：

```xml
<key>CFBundleIdentifier</key>
<string>com.apple.AppStore</string>
```

原文有一点需要纠正：plist 不一定是 XML，也可能是二进制格式。如果文本编辑打开后显示乱码，直接用下方的 `plutil` 读取即可，不必转换或修改应用里的文件。

## 在终端中读取

只想拿到标识符时，运行这条命令就够了：

```bash
/usr/bin/plutil -extract CFBundleIdentifier raw -o - \
  "/System/Applications/App Store.app/Contents/Info.plist"
```

输出是 `com.apple.AppStore`。`plutil` 支持 XML 和二进制 plist，`-o -` 表示将结果输出到标准输出。

`App Store.app` 包含空格，所以路径外的引号不能省略。查看其他应用时，替换路径即可。也可以先输入文件名之前的命令，留一个空格，再[将 Info.plist 从 Finder 拖入终端](https://support.apple.com/guide/terminal/drag-items-into-a-terminal-window-trml106/mac)，让终端填入路径。

原文使用的 `PlistBuddy` 现在仍然适用：

```bash
/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' \
  "/System/Applications/App Store.app/Contents/Info.plist"
```

如果旧版 macOS 的 `plutil` 不支持 `raw` 输出格式，也可以使用它。当前系统支持的具体选项，可以通过 `man plutil` 或 `man PlistBuddy` 查看。

## 没有结果，或者结果不对？

先检查路径。如果同时安装了正式版和测试版，要读取目标版本内部的 plist。辅助进程、扩展和 framework 也可能有自己的标识符；查应用本身的 ID 时，从最外层的 `.app` 开始。

Spotlight 也能做快速查询：

```bash
/usr/bin/mdls -name kMDItemCFBundleIdentifier -raw \
  "/System/Applications/App Store.app"
```

这次验证中，它返回了相同的标识符。不过，这个方法依赖 Spotlight 元数据。如果输出 `(null)`，先直接读取 `Info.plist`，不要据此判断应用没有 Bundle ID。

## 参考资料

- [Apple 平台部署：获取 Mac 应用的 Bundle ID](https://support.apple.com/guide/deployment/get-the-bundle-id-for-a-mac-app-dep0af2cd611/web)
- [Apple Developer：CFBundleIdentifier](https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier)
- [Apple Developer：Property list types](https://developer.apple.com/documentation/uniformtypeidentifiers/uttype-swift.struct/propertylist)——XML 与二进制格式。
- [Apple Developer：Bundle structures](https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html)——归档文档，可参考其中的 macOS 应用包目录结构。
- [终端使用手册：将项目拖入终端窗口](https://support.apple.com/guide/terminal/drag-items-into-a-terminal-window-trml106/mac)
- macOS 本地手册：`man plutil`、`man PlistBuddy`、`man mdls`。
