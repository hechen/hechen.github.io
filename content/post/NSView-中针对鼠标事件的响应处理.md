---
title: NSView 中针对鼠标事件的响应处理
date: 2019-01-23 15:33:13
draft: true
tags: ["MacOS", "NSView", "MouseEvent"]
categories: ["MacOS"]
---

Mac 开发中针对 NSView 的事件响应和 iOS 下的 UIView 有一些差别，有一些需要注意的地方，这里记录一下。

iOS 下 UIView 有对应的 UIResponder 作为其可以接收响应处理的父类赋予能力。

macOS 下 NSView 自然也有对应的 NSResponder 作为对应的响应处理父类。只不过，和 iOS 中直接复写 UIResponder 的方法不一样，macOS 还需要用到 NSTrackingArea 这个只有 Mac 系才存在的对象，其定义如下：

> A region of a view that generates mouse-tracking and cursor-update events when the pointer is over that region.
