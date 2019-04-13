---
title: 理解响应者和响应链
date: 2017-11-13 21:22:44
lastmod: 2019-04-13T21:45:23+08:00
categories: ["iOS"]
tags: ["UIResponder","UIGestureRecognizer"]
---

Apps 是通过响应者（responder）对象来接收和处理事件的。一个响应者对象是 UIResponder 类的一个实例，我们常见的 UIView，UIViewController 以及 UIApplication 都是 UIResponder 的子类。 UIKit 自动帮你管理着这些 responder 相关的行为，包括事件是如何从一个 responder 传递给另一个 responder 的等等。当然，你也可以修改你的 app 中事件传递的默认行为。

UIKit 会把大部分的事件都传递给最适合的 responder 对象来处理。如果该 responder 无法处理该事件，UIKit 就会继续把该事件沿着当前的响应者链传递到下一个 responder。响应者链就是你的 App 中所有响应者的动态配置，也因为其是动态的，你的 App 中不可能只存在单一的响应者链。由于事件总是从特定的响应者那里流转到更通用的响应者那里，因此很容易确定某响应者链中下一个响应者是谁。举个例子，一个 view 的下一个响应者是其 superview 或者负责管理它的 view controller。事件就是这样在响应者链中传递直到其被处理掉。

下图展示了一个界面中包含了 一个 Label，一个 TextField，一个 Button 以及两个容器 view 的 App 中响应链是什么样子的。如果 TextField 不处理某个事件，UIKit 就会把该事件发送给 TextField 的父级 UIView 对象，同样的，如果该对象依然处理不了，就会传递给该 view 对象的 window。如果 window 对象也依然无法处理该事件，UIKit 最终会把该事件传递给 UIApplication 对象，一般上该 UIApplication 对象是 App 的 delegate 对象并且是 UIResponder 实例，当然这个时候已经脱离了响应者链了。

![图1 - 一个响应者链的例子](https://i.imgur.com/qvT1XMO.png)

针对每一个事件，UIKit 都会指定一个第一响应者（first responder），然后把该事件首先发送给对象处理。这个第一响应者基于事件类型而不同。

1. **Touch events.** 第一响应者是 Touch 发生所在的 view。
2. **Press events.** 第一响应者是当前焦点所在的响应者。
3. **Motion event.** 第一响应者是你显式指定用以处理事件的对象。 Core Motion 处理所有的和加速器、气压仪以及磁力计相关的事件。Motion events 不随响应者链流动。
4. **Shake-motion events.** 第一响应者是你或者 UIKit 框架指定的对象。
5. **Remote-control events.** 第一响应者是你或者 UIKit 框架指定的对象。
6. **Editing-menu messages.** 第一响应者是你或者 UIKit 框架指定的对象。


Controls 向其关联的对象发送动作消息本身不是事件，但是依然能够享受到响应者链的好处。当一个 Control 的 target object 是 nil 的时候，UIKit 就会在该 target object 的响应者链上寻找合适的对象用以妥善处理动作消息。例如，UIKit 编辑按钮使用这种行为来寻找响应者对象来执行`cut:`, `copy:` 或者 `paste:` 等方法。

如果一个 view 自身还有附加的手势识别器的话，该手势识别器会延迟针对该 view 的 touch 和 press 事件的传递。`delaysTouchesBegan`, `delaysTouchesEnded` 以及 `UIGestureRecognizer` 的 `cancelsTouchesInView` 属性都是用来决定这些 touches 什么时间以及以什么方式被延迟处理。


## 识别包含 Touch 事件的响应者

UIKit 使用基于视图的碰撞检测（hit-testing）来决定 touch 事件发生的地点。具体而言，UIKit  拿该 touch 的位置和视图层级中所有的视图对象的 bounds 进行比较。UIView 的 `hitTest:withEvent:` 方法会游历整个视图层级，找到该 touch 事件发生所在的视图树最底端的视图，其也就是处理该 touch 事件的第一响应者。

> 如果一个 touch 的位置发生在某个视图的外围，`hitTest:withEvent:`方法就会忽略该视图和其所有子视图。所以，如果你将 view 的`clipsToBounds`属性设置为 NO 的化，即使其子视图将该 touch 包含在自己领域也是无效的。

就这样，UIKit 持续不断的把每个 touch 指派给包含该 touch 的视图。当 touch 发生的时候，UIKit 创建一个 `UITouch` 对象，直到 touch 结束该对象才会被释放。当 touch 位置或者其他参数发生变化的时候，UIKit 就更新这个 UITouch 对象的信息。当然，其中有的属性当然是不会变化的，比如该 touch 附属的 view，甚至当 touch 位置已经超出原始 view 的外围的时候，UITouch 对象中的 view 属性依然保持和之前一样。

## 变更响应者链

你可以通过覆写响应者的 nextResponder 属性来改变响应者链。许多 UIKit 的类已经覆写了该方法并且返回了特定的对象。

1. 如果你覆写了任意类的 `nextResponder` 属性，那该对象的下一个响应者就是你返回的那个；
2. `UIView`
	2.1 如果该视图是某个视图控制器的根视图（root view），其下一个响应者就是该视图控制器；
	2.2 如果该视图不是某个视图控制器的根视图，其下一个响应者就是该视图的父视图；
3. `UIViewController`
	3.1 如果该视图控制器的视图是某个 window 的根视图（root view），其下一个响应者就是 window；
	3.2 如果该视图控制器是由另一个视图控制器展示出来的，其下一个响应者就是那个视图控制器（presenting view controller）；
4. `UIWindow`  window 的下一个响应者就是 `UIApplication` 对象
5. `UIApplication`  UIApplication 对象的下一个响应者是 App delegate，而且要求该 delegate 必须是 `UIRespponder` 的实例并且不能是一个视图、视图控制器或者 `UIApplication` 对象自己。