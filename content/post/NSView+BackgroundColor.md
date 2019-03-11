---
title: 为 NSView 增加 backgroundColor
date: 2019-03-11T15:19:49+08:00
tags: ["NSView","backgroundColor"]
categories: ["macOS"]
---

NSView 作为 Cocoa 中最基本的构成元素，是构成整个 Mac App 视图体系的基础，和 UIView 在 iOS 世界中的位置一样重要，可是在 UIView 里司空见惯的背景色设置，在 NSView 中却不见身影。


在 iOS 中，设置 UIView 的背景色很简单。

``` Swift

import UIKit

let frame = CGRect(origin: .zero, size: CGSize(width: 100, height: 100))
let view = UIView(frame: frame)

view.backgroundColor = .blue

```

而在 macOS 上，使用 NSView 背景色需要如下设置：

``` Swift

import Cocoa

let frame = CGRect(origin: .zero, size: CGSize(width: 100, height: 100))
let view = NSView(frame: frame)

view.wantsLayer = true
view.layer?.backgroundColor = NSColor.blue.cgColor

```

UIView 自身有一个 backgroundColor 的属性，而在 NSView 中是没有的，你需要做的是设置 View 所包含的 layer 的背景色。而且 layer 是 Optional 的，也就意味着 NSView 默认是不包含 layer 的，所以你还需要设置 wantsLayer 为 true 让 NSView 创建 layer 出来。

在 Apple 的[官方文档](https://developer.apple.com/documentation/appkit/nsview/1483695-wantslayer) 有针对 wantsLayer 的一些说明

> Setting the value of this property to true turns the view into a layer-backed view—that is, the view uses a CALayer object to manage its rendered content. Creating a layer-backed view implicitly causes the entire view hierarchy under that view to become layer-backed. Thus, the view and all of its subviews (including subviews of subviews) become layer-backed. The default value of this property is false.