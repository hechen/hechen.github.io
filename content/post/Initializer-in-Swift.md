---
title: Initializer in Swift
date: 2017-11-15 13:09:27
lastmod: 2019-05-31T20:30:54+08:00
draft: true
categories: ["Swift"]
tags: ["iOS","Swift","Initializer","Designated Initializer","Convenience Initializers"]
---


我想 `[[xxx alloc] init]` 应该是自己接触 iOS 开发以来写的最多的语句了吧。一个对象初始化是其得以存在的前提，无论你是使用 new 关键字与否，根本上都会执行到 init 方法。

转入 swift 语言之后，在刚接触的时候经常会因为自建初始化方法不合适，编译器报一堆错误，很是痛苦，但是当理解 Swift 语言为了保障安全的初始化行为所做的工作之后，你就会明白，Swift 初始化方法是有一定的规范要求的。 

这篇文章是想做个记录。

### 初始化方法

顺序很重要！

与 `Objective-C` 中不同，Swift 语言会保证某个类的所有属性均被初始化才行。因此初始化方法会非常严格，那第一点需要保障的就是**顺序**。

首先，祭出这张官方镇宅图：




以最简单的无继承 Class 的


在某个类的子类中，初始化方法语句的顺序并不是随意的，我们需要保证在当前子类实例的成员初始化完成后才能调用父类的初始化方法。



