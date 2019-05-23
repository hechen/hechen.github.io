---
title: "关于 MetaType"
date: 2019-05-17T15:01:54+08:00
categories: ["Swift"]
tags: ["MetaType"]
---


## MetaType

关于 MetaType，在 Swift 的官方文档中是这样说明的，

> A metatype type refers to the type of any type, including class types, structure types, enumeration types, and protocol types.
> The metatype of a class, structure, or enumeration type is the name of that type followed by .Type. The metatype of a protocol type—not the concrete type that conforms to the protocol at runtime—is the name of that protocol followed by .Protocol. 

说的很清楚，代表任何类型的类型信息，我们知道在编程语言的世界里，每一个实例自身是一个具体类型的实体化，而对于每个类型的定义就是由 MetaType 决定的，例如常见的 「类的类型」、「结构体的类型」、「枚举的类型」以及「协议的类型」。

我们可以通过 .self 来获取某个类或者结构体的具体的元类型信息，也就是其类型的值。大家可以按照平时定义一个简单值这样来理解。

![What is the metaType](https://i.imgur.com/SeHkinN.png)

### Protocol

对于协议类型获取其元类型信息是通过 .Protocol 来获取的，而非其具体实现该协议的类的元类型信息，比如，如果你使用👇这种写法：

![Get a Protocol Type](https://i.imgur.com/ACmHog7.png)

编译器会报错，因为使用 MyProtocol 自身的元类型是 .Protocol 类型。

![Protocol MetaType Demo](https://i.imgur.com/ETSopLS.png)

你需要使用 .Protocol 来获取协议本身的元类型信息，如下

![Carbonize 2019-05-23 at 2.39.25 P](https://i.imgur.com/208plpn.png)


## type(:of)

我们可以通过 `type(of:)` 来获取某个某个值的类型信息，而且是动态类型信息。其方法签名如下：

```
func type<T, Metatype>(of value: T) -> Metatype
```

其返回值是某元类型的实例，也即元类型的值。

想要明白 `type(of:)` 这里我们需要明确两个概念： static metatype 和 dynamic metatype。

static type 指的是编译时期，编译器所决议的某个值的类型，而 dynamic type 指的该值真实的类型信息，我们看下面的例子理解。

![Demo](https://i.imgur.com/W27kJ9X.png)

在 `printMetaType(of:)` 中对于编译器来讲 value 的类型就是 Any，其就是 static type，而真正由 type(of:) 得到的类型信息是 Child，其才是真实的值的类型，也即 dynamic type。

再以如下的官方的 Sample Code 为例：

![MetaType](https://i.imgur.com/I2FxwAo.png)

尽管 someInstance 的声明类型是 SomeBaseClass（也是 Static Type），但是其真实的类型信息是其实例化时的类型 —— SomeSubClass。



## References

- [Types](https://docs.swift.org/swift-book/ReferenceManual/Types.html)
- [What's .self, .Type and .Protocol? Understanding Swift Metatypes](https://swiftrocks.com/whats-type-and-self-swift-metatypes.html)