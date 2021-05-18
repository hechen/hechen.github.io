---
title: "一道 Swift Quiz"
date: 2019-05-14T16:01:54+08:00
lastmod: 2019-05-17T12:33:54+08:00
categories: ["Swift"]
tags: ["Quiz","MetaType","Overload"]
---

这两天在 [Twitter](https://twitter.com/krzyzanowskim/status/1127875626579288064?s=12) 上看到一道题目，主要是考察 overload 和 type(of:) 的知识点，本文仅做记录，关于 MetaType 会单独写一篇文章来总结。

```
// Swift Quiz

class View {}
class A: View {}
class B: View {}

func add(_ v: View) { print(type(of: v)) }
func add(_ v: A) { print(type(of: v)) }
func add(_ v: B) { print(type(of: v)) }

func build() -> View { return B() }
add(build())

// What is the output?
- "View"
- "A"
- "B"
```

答案的分布说明，大家对这个输出结果还是有一定的疑惑🤔

这里使用多个 add 函数，实际上是起到了一定的迷惑作用，那针对具备不同静态类型的 add 函数来讲，其重载哪个函数就是依据其传入参数的静态类型而决定，因此在本 Quiz 中 build 函数返回了实例的静态类型即为 View，所以一定是会重载具备 View 类型参数的函数。
而进入函数体内部，主要就是 `type(of:)` 方法的执行结果了，而该方法的官方定义里有如下说明：

```
func type<T, Metatype>(of value: T) -> Metatype
```

> You can use the type(of:) function to find the dynamic type of a value, particularly when the dynamic type is different from the static type. The static type of a value is the known, compile-time type of the value. The dynamic type of a value is the value’s actual type at run-time, which can be a subtype of its concrete type.

可以看到，`type(of:)` 可以获取到当前所传值的**动态类型**，也就是其原始的宿主类型。对于本例来讲，传入到该方法的值实质上是由 B 类型实例化而来，因此其动态类型应该是 B。

![Quiz](https://i.imgur.com/vB7DuWI.png)


## References
[type(of:)](https://developer.apple.com/documentation/swift/2885064-type)