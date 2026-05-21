---
title: 'A Swift quiz'
slug: 'a-swift-quiz'
date: 2019-05-14T16:01:54+08:00
draft: false
categories: ['macos', 'swift']
tags: ['agent', 'applescript', 'build', 'cocoa', 'cocoapods', 'compile', 'dock', 'framework', 'ios', 'library', 'login', 'mach-o', 'menu', 'metatype', 'module', 'nstask', 'overload', 'preprocess', 'process', 'quiz', 'swift', 'xcode']
---

A puzzle showed up on [Twitter](https://twitter.com/krzyzanowskim/status/1127875626579288064?s=12) the other day. It exercises overload resolution and `type(of:)` together. This is just a note for myself; I'll write up MetaType separately.

``` text
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

Judging from the spread of answers, this one is genuinely confusing 🤔.

The three `add` overloads are a small misdirection. Overload resolution in Swift uses the **static** type of the argument — so what matters is the declared return type of `build()`, which is `View`. That means the `add(_ v: View)` overload is the one that gets called.

Inside that overload, the output then depends on `type(of:)`. Apple's signature is:

``` text
func type<T, Metatype>(of value: T) -> Metatype
```

> You can use the type(of:) function to find the dynamic type of a value, particularly when the dynamic type is different from the static type. The static type of a value is the known, compile-time type of the value. The dynamic type of a value is the value's actual type at run-time, which can be a subtype of its concrete type.

So `type(of:)` returns the **dynamic** type of the value — its real runtime type. In this case the value handed to `add` was actually constructed from `B`, so its dynamic type is `B`.

![Quiz](https://i.imgur.com/vB7DuWI.png)

## References

[type(of:)](https://developer.apple.com/documentation/swift/2885064-type)
