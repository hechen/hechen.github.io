---
title: "Alamofire 和 RxSwift 中的 .af 以及 .rx 扩展是怎么实现的"
date: 2019-09-29T10:30:30+08:00
categories: ["Swift"]
tags: ["Alamofire","RxSwift","Generic","Protocol", "AssociatedType","Extension"]
---

今天继续来一篇水文，关于 Alamofire 和 RxSwift 两个组件中扩展后缀 .af 以及 .rx 是怎么实现的。相信用过的 (￣ω￣(￣ω￣〃 (￣ω￣〃)ゝ 都看过了。我这里权当自己的记录流水账了。

先来看 Alamofire 中关于 af 扩展的实现：

![Alamofire](https://i.imgur.com/AbPIzgX.png)

使用 Alamofire 扩展的方式如下：

``` Swift
    struct Demo {}
    extension Demo: AlamofireExtended {}
    extension AlamofireExtension where ExtendedType == Demo {
        func printSomething() {
            print("Something arrived.")
        }
    }
    let d = Demo()
    d.af.printSomething()
```

这里主要有两点：

1. 为将要使用的类 Demo 扩展 AlamofireExtended 协议，也就是增加 af 扩展属性，其返回的是一个封装对象 AlamofireExtension；
2. 为 AlamofireExtension 对象（1 中返回的封装类型）扩展专属于 Demo 这个类型的方法；

说实话，这里用来封装元类型信息的结构体名称和扩展协议名称一样，我初次看的时候确实是蒙的。相对于 Alamofire 的命名来说，个人更喜欢 RxSwift 的命名。

接下来是 RxSwift 中 Rx 扩展的实现：

![RxSwift](https://i.imgur.com/m5O7lo5.png)

可以看到，整个使用方式上是完全相同的。仅仅是各项名字不同。

所以我们可以总结这种方式的使用路径，如何为我们自己开发的

### 声明扩展属性

为了能够支持实例变量和类型两者，需要分别增加两个计算属性：
- 一个是 static 的，提供给类型使用；
- 一个是实例变量，提供给单个实例来用；

### 封装元类型信息

为了能够使得 `.af/.rx` 这些扩展属性也能够获得当前实例或者类型的元信息，不约而同的使用了结构体封装的形式，通过泛型类型实现。我们知道这个封装对象内部就是记录的就是 self 

我们可以通过编译器提示来看下扩展返回的类型是什么。

![Compiler Inference](https://i.imgur.com/09ikWMm.png)

从 print 这个方法可以推断出，这个类型是个 `AlamofireExtension` 对象（因为我们是针对该类型增加的扩展方法），并且其内部有个变量 type 就是我们扩展的类型 `Demo`。而我们为该对象扩展的方法 `printSomething` 也能够在实例是 Demo 类型的时候触发。

### 扩展目标类

我们已经知道扩展后缀拿到的是一个携带了关联类型的对象，因为有了关联类型，所以才能够通过 Where 子句写出针对不同类型存在的专属方法。

按照这个步骤，我们可以在自己的工程中写属于自己模块的扩展。

``` Swift
    import Foundation
    
    // We implemented a module named Wonderful.
    // Extension name will be named as wf
    
    // Step 0.
    // Encapsulate a type which is unknown until now.
    struct Extensible<EncapsulatedType> {
        let type: EncapsulatedType
        init(_ type: EncapsulatedType) {
            self.type = type
        }
    }
    
    // Step 1.
    // Extension a type to add two properties. a static var and a var
    protocol WonderfulExtension {
        associatedtype ExtendedType
        
        // static entry point
        static var wf: Extensible<ExtendedType>.Type { get set }
        // instance entry point
        var wf: Extensible<ExtendedType> { get set }
    }
    
    // Step 2.
    extension WonderfulExtension {
        static var wf: Extensible<Self>.Type {
            set { }
            get { return Extensible<Self>.self }
        }
        
        var wf: Extensible<Self> {
            set { }
            get { return Extensible(self) }
        }
    }
    
    // Step3.
    // Extend the type we want to, which the type will have wf var.
    struct Ordinary {}
    extension Ordinary: WonderfulExtension {}
    
    // Step4.
    // Restrict methods in the scope of type we want to extend
    extension Extensible where EncapsulatedType == Ordinary {
        func wow() {
            print("Wow, Wonderful extension.")
        }
    }
    
    // Use methods of wf extension
    let obj = Ordinary()
    obj.wf.wow()
```


总体上对于这种形式，带来两个显著的好处：
1. 明确作用域，告知调用者调用的专属方法属于该组件相关；
2. 提供该扩展的组件自身就更容易被扩展了（打上了烙印），也有了 RxSwift 所衍生的各种组件；

总结下来，如下

![Overview](https://i.imgur.com/6YvVnCM.png)

尽管非常小的一段代码，可以说利用的正是 Swift 提供的 Protocol Extension 以及 Generic Type，其中每一个点对我来讲都是需要吃透的，明确怎么用，还要明确为何这么用。