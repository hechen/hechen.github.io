---
title: "关于 MetaType"
date: 2019-07-04T1:01:10+08:00
categories: ["Swift"]
tags: ["MetaType"]
draft: true
---

开发过程中总是说某个类定义了实例方法和类方法，我们知道类方法和类包含的静态变量是和该类型自身密切相关的，和具体实例无关。还记得在 Objective-C 中每个实例类型会持有 isa 指针，其指向具体该实例对象自身的类信息，如下：

![objc_object 定义](https://i.imgur.com/lTSImnV.png)

而其中 `objc_class` 结构体定义了一个 Objective-C 实例所属类型的具体信息

![objc_class 定义](https://i.imgur.com/d4oaI0D.png)

而我们在 objc_class 定义中也看到，其中也有一个指针指向同样的 objc_class 类型，这个也就是 Objective-C 中的 metaclass，其在全局唯一（可以理解，类型本身）

而同样类似于，我们在 Swift 中想要获取类型信息，我们经常会写下面这种代码：

``` swift
class SomeClass {
    static let code = 1
    class func tellEveryone() {}
}
SomeClass.tellEveryone()
```

而在 Swift 中，这种写法实际上是编译器帮我们省略的一种简便写法，补全之后的写法其实如下：

```
SomeClass.self.tellEveryone()
```

而通过 .self 获取到的就是 SomeClass 的类型信息的具体化值，而对于这些类型信息具体是什么类型呢？ 这就牵涉到一个概念 MetaType

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

![Protocol's correct usage](https://i.imgur.com/208plpn.png)


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


### 举个🌰️

这个栗子来自于 《Advanced Swift》 一书

![🌰️](https://i.imgur.com/BRzKDN4.png)


## References

- [Types](https://docs.swift.org/swift-book/ReferenceManual/Types.html)
- [What's .self, .Type and .Protocol? Understanding Swift Metatypes](https://swiftrocks.com/whats-type-and-self-swift-metatypes.html)