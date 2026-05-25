---
title: 'Adding a backgroundColor to NSView'
slug: 'nsview-backgroundcolor'
url: '/post/nsview-backgroundcolor/'
aliases: ['/post/nsview+backgroundcolor/']
date: 2019-03-11T15:19:49+08:00
draft: false
categories: ['macos', 'rxswift', 'swift']
tags: ['backgroundcolor', 'cocoapods', 'module', 'nsview', 'safari', 'sandbox', 'shadowsocks', 'subject', 'swift', 'traffic', 'variable']
---

NSView is the most basic building block in Cocoa — the foundation of every Mac app's view hierarchy, exactly like UIView is for iOS. But the dead-simple `backgroundColor` setter you take for granted on UIView is nowhere to be found on NSView.

On iOS, setting a UIView's background colour is trivial:

``` swift
import UIKit

let frame = CGRect(origin: .zero, size: CGSize(width: 100, height: 100))
let view = UIView(frame: frame)

view.backgroundColor = .blue
```

On macOS, getting a background colour onto an NSView takes a bit more:

``` swift
import Cocoa

let frame = CGRect(origin: .zero, size: CGSize(width: 100, height: 100))
let view = NSView(frame: frame)

view.wantsLayer = true
view.layer?.backgroundColor = NSColor.blue.cgColor
```

UIView has a `backgroundColor` property of its own; NSView doesn't. What you actually set is the background colour on the view's underlying layer. And `layer` is optional — meaning NSView doesn't come with a layer by default. You have to flip `wantsLayer` to true to make NSView spin one up.

Apple's [documentation](https://developer.apple.com/documentation/appkit/nsview/1483695-wantslayer) has some notes on `wantsLayer`:

> Setting the value of this property to true turns the view into a layer-backed view—that is, the view uses a CALayer object to manage its rendered content. Creating a layer-backed view implicitly causes the entire view hierarchy under that view to become layer-backed. Thus, the view and all of its subviews (including subviews of subviews) become layer-backed. The default value of this property is false.
