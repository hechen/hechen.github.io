---
title: "一道 Swift Quiz"
date: 2019-05-17T15:01:54+08:00
categories: ["Swift"]
tags: ["MetaType"]
---

关于 MetaType ，在 Swift 的官方文档中是这样说明的，

> A metatype type refers to the type of any type, including class types, structure types, enumeration types, and protocol types.
> The metatype of a class, structure, or enumeration type is the name of that type followed by .Type. The metatype of a protocol type—not the concrete type that conforms to the protocol at runtime—is the name of that protocol followed by .Protocol. 

说的很清楚，代表任何类型的类型信息，我们知道在编程语言的世界里，每一个实例自身是一个具体类型的实体化，而对于每个类型的定义就是由 MetaType 决定的，例如常见的 「类的类型」、「结构体的类型」、「枚举的类型」以及「协议的类型」。
这其中文档专门举例，对于协议类型获取其元类型信息是通过 .Protocol 来获取的，而非其具体实现该协议的类的元类型信息。

我们可以通过 .self 来获取元类型

以官方的 Sample 为例：
![MetaType](https://i.imgur.com/I2FxwAo.png)

尽管 someInstance 的声明类型是 SomeBaseClass（也是 Static Type），但是其真实的类型信息是其实例化时的类型 —— SomeSubClass。




## References

[Types](https://docs.swift.org/swift-book/ReferenceManual/Types.html)