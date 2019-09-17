---
title: Swift 中的消息派发
date: 2019-09-15 20:56:50
categories: ["Swift"]
tags: ["iOS","Swift","Dispatch","Inline","PWT","Protocol"]
---

![What is the method dispatch](https://i.imgur.com/ggQZyRp.png)

# 什么是消息派发？

消息派发，英文名称 Method Dispatch，是指程序在运行过程中调用某个方法的时候决议使用哪个具体指令的过程。消息派发的行为在我们代码中时时刻刻的在发生。了解消息派发的机制对于我们日常写出相对高效的代码也是有利的，日常 Coding 的时候遇到一些派发相关的问题，也能做到心里有数。

对于编译型语言来讲，有主要三种类型的方法派发方式：Direct Dispatch，Table Dispatch 以及 Message Dispatch，前者也被称作 Static Dispatch，后两个为 Dynamic Dispatch。



# 方法派发类型

本质上来讲，派发的目的就是告诉 CPU，在某个特定方法被调用的时候去内存的哪个地址去读执行代码。下面我们先了解下这三种类型的派发形式，这三种可以说各有优劣。



## Direct Dispatch

直接派发也叫静态派发。它是这三种形式中最快速的，不仅仅是底层翻译的汇编指令少，也是因为编译器可以针对这种情况做更多优化的事情，比如说函数内联等。C 语言就是这种的典型代表，然而，对于日渐复杂的编程场景来说，静态派发限制非常大，我们必须在代码运行之前把事情安排的明明白白的，这个极大的限制了代码书写的灵活性。一句话总结，编译器在编译期间就已经确定了的推断路径，运行期间按照既定路线走就行。



## Table Dispatch

函数表派发这种是编译型语言中最常见的动态派发实现形式，编译器层面使用一个表格结构来存储类型声明中的每一个函数指针。C++ 语言把这种表格称作虚函数表（virtual table，简称 V-Table），而在 Swift 中，针对拥有继承的 Class 类型来说，依然采用了 V-Table 这种实现形式达到对多态的支持，而针对值类型由于 Protocol 产生的多态而采用了另外一种函数表派发形式，这个表格被称为协议目击表 （Protocol Witness Table，简称 PWT），这个暂时略去不表。



### V-Table

对于 V-Table 的应用场景下，每一个类都会维护一个函数表，里面记录着该类所有的函数指针，主要包含：

1. 由父类继承而来的方法执行地址；
2. 如果子类覆写了父类方法的话，表格里面就会保存被重载之后的函数。
3. 子类新添加的函数会插入到这个表格的末尾



在程序运行期间会根据这个表去查询真正要调用的函数是哪一个。这种特性就极大的提升了代码的灵活性，也是 Java，C++ 等语言得以支持多态这种语言特性的基石。当然，相对于静态派发而言，表格派发则多了很多的隐式花销，因为函数调用不再是直接调用了，而是需要通过先行查表的形式找到真实的函数指针来执行，编译器也无法再进行诸如 inline 等编译期优化了。

我们以 WWDC 的某个例子来大概说明下 V-Table 的具体派发过程，如下代码，共有三个 Class，其中 Drawable 是基类，子类化的 Point 和 Line。

![GoXy7tO-squashed](https://i.imgur.com/JiHAs1x.png)

在 drawables 真正调用的时候（大家注意下，数组的这个结构中除了 refCount 做引用计数之外，每个元素都是 1 个字长的引用，也就是每一个具体实例的地址），先通过指针找到在堆上的实例，通过实例中存储的类型信息中的虚函数表（V-Table）找到具体的函数执行地址。



<img src="https://i.imgur.com/9T6aHwq.png" style="zoom: 67%;" />



每一个类的元类型信息中存储着虚函数表，表中就是所有该类型真实的函数地址。



<img src="https://i.imgur.com/8n9ZDBT.png" style="zoom:67%;" />



### PWT

对于 Swift 来说，还有更为重要的 Protocol，对于符合同一协议的对象本身是不一定拥有继承关系的，因此 V-Table 就没法使用了。这里，Swift 使用了 Protocol Witness Table 的数据结构达到动态查询协议方法的目的。如果将上面的例子中的 Drawable 抽象成协议。

<img src="https://i.imgur.com/GaIILyH.png" alt="Code with Protocol" style="zoom:33%;" />

简单来说，Swift 会为每一个实现了该协议的对象生成一个**大小一致**的结构体，这个结构体被称为 `Existential Container`，它内部就包含了 PWT，而这个 Table 中的每一个条目指向了符合该协议的类型信息，而除了 PWT，该结构体中还保留了三个字长的 valueBuffer 用以存储数据成员，一个 Value Witness Table 存储着一组函数的执行地址，这些函数都是针对前面数据成员的具体操作方法，细节这里不展开讲了。 PWT 中包含着该实例实现的协议方法实现地址。



<img src="https://i.imgur.com/Twp4Juj.png" style="zoom: 33%;" />



所以，本质上来讲，Protocol 的消息派发要比 V-Table 更加复杂，但是还是基于这种表格查询的形式找到真正需要执行的方法地址。



## Message Dispatch

第三种就是消息派发类型，作为一个使用 Objective-C 这么多年的老同志，想必对 sendMessage 不能更熟悉了，消息派发是目前最为动态的一种方式，这个也是整个 Cocoa 架的基础。像平时我们常用的 KVO ，Target-Action 等都建立在消息派发的基础之上，这也才有了 Objective-C 中常炒不衰的黑魔法 ── `method swizzling` ，你可以用这个调换函数执行地址。

关于基于 OC 层面运行时库的核心代码估计大家都已经看过。运行时通过查找该类的方法列表，同时通过 super class 回溯一直查找到该方法即可，这部份核心内容是 objc runtime。而我们知道 Objective-C 运行时的核心方法是 `obj_msgSend`，其会在类的继承链查找所有可能的方法。整个运行时消息的转发过程再发一次。

<img src="media/CleanShot%202019-09-18%20at%2000.05.07.png" alt="CleanShot 2019-09-18 at 00.05.07" style="zoom: 50%;" />



大家体会一下消息派发模式和之前的表格派发的区别，表格派发查询的表是固定的，子类也会将父类的可见方法继承过来（这也相对安全），而消息派发还可以动态的回溯继承链，子类无需复制父类方法，而是通过 superClass 指针遍历完整个继承链的方法。



介绍完这三种方法派发形式之后，大家有了一个概念之后，我们看下几个主流语言目前是什么情况。



![](https://i.imgur.com/J6FlTnn.png)



大家可能会说 Objective-C 不是能和 C++ 混编么？那它也支持 Table Dispatch 吧，这个是误解。 Objc 的历史地位和 C++ 是类似的，都是在 C 语言的基础之上的一门语言，而天然 Objective-C 就是采用的 Message Dispatch 形式，但是因为是基于 C 语言的，包括它的核心运行时都是使用  C 语言构建的，因而能很好的兼容 C，也自然支持 C 的 Direct Dispatch。 而 C++ 语言能够和 Objective-C 混编也算是一厢情愿吧，想想被 Objective-C++ 支配的恐惧。



# SIL

在讲解 Swift 的方法派发之前，我们先了解一下 SIL，SIL 全程是 Swift Intermediate Language，它是为 Swift 编程语言而设计的高级中间语言，它工作在编译器前端，其作为 AST 和 LLVM IR 的中间过程的主要产物，主要针对 Swift 语言做语义分析，代码优化，泛型特化等事情。从 SIL 的生成文件我们能够一窥方法派发的一些门道。

下图是一张 WWDC 上讲述 Swift 语言的编译前端的几个阶段。



![Swift Compiler Fontend](https://i.imgur.com/c9QmdsA.jpg)



可以使用 swiftc 生成某个 Swift 文件对应的 SIL 文件。




``` swift
swiftc -emit-sil test.swift > test.sil
```



比如针对下面这份文件会生成对应的 SIL 如下。

<img src="https://i.imgur.com/nO6OwLT.png" alt="Simple Swift"  />
生成的 SIL 文件如下：

![SIL Generated](https://i.imgur.com/LAjbdYh.png)
### SIL 几个方法

因为我们在讲述方法派发，因此我们关心几个相关的 SIL 语法，主要有如下四个：

1. class_method
2. objc_method
3. witness_method
4. apply



想了解完整的其他详细参数，可以到 Swift 的 [Github 页面](https://github.com/apple/swift/blob/master/docs/SIL.rst#dynamic-dispatch)查看。



OK，了解完 SIL 之后，进入正题。



# Swift 中的方法派发是什么样子的

首先一句话， Swift 中支持以上三种派发方式，首先，因为其背负的历史负担，必须支持 Objective-C Runtime，因此一定会支持消息派发方式，又由于值类型和传统类类型的存在，Swift 支持了以上三种。

首先我们需要先知道影响目前 Swift 中方法派发形式的几个要素：

1. 声明方法的地方
2. 修饰符修改
3. 编译器的可见优化

## 声明位置

首先，不同位置的方法声明，派发的时候各不相同，先看个例子，我们为类和其扩展分别定义了两个方法。

<img src="https://i.imgur.com/LeKq69v.png" alt="Carbonize 2019-09-15 at 8.16.43 P" style="zoom: 50%;" />
针对上面这段代码，实际上 `MyClass` 使用的是函数表派发，而其分类中的方法是使用的静态派发。

1. 值类型毫无疑问进行直接派发；
2. 存在继承关系可能的类的初始声明下的方法采用虚函数表派发（V-Table）；
3. 对协议的扩展或者类的扩展进采用直接派发（非 `NSObject` 下的 extension 的方法均为直接派发）
4. 协议的初始声明下的方法均采用协议目击表派发（PWT）；

![PWT](https://i.imgur.com/rGxsWt7.png)



### 案例

这其中有个问题是日常开发过程中也经常会遇到的，如下代码。

<img src="https://i.imgur.com/UOlgU25.png" alt="An extension" style="zoom: 33%;" />

我们在某个类型的扩展中定义了方法，协议扩展中也定义了同名方法，在进行调用的时候，因为声明类型的不同，表现完全不一样，通过调用的结果就能知道是静态派发。

而当我们将该同名方法声明在 MyProtocol 中的时候，这也变成了原始的协议表格派发形式了，通过 PWT 来查找该协议方法的具体实现。

<img src="https://i.imgur.com/nm0ISlh.png" alt="Carbonize 2019-09-15 at 8.21.12 P" style="zoom: 33%;" />

协议扩展是严格的静态派发的，因为没有虚函数表可以把方法的实现地址放进去。扩展能够实现协议的默认实现，那是因为符合这个协议的类型会把扩展的实现方法存到自己的协议目击表里（PWT），而且只有在这些类型没有实现这些协议方法的时候。

因为协议目击表中包含定义在 Protocol 中的方法而已，因此协议扩展方法（不应该算作 Protocol 的一部分）并不知道把这些实现置于何处。因此调用协议扩展方法是不经过虚函数表派发的，它们唯一能做的事情就是静态调用扩展中的方法实现。而且因为是静态派发，也就不存在重载这一支持。

唯一能够让协议扩展方法进行虚函数表派发的方式就是为 Extension 增加虚函数表，但是在编译期间，符合该协议的类型并没有必要获知该协议所有扩展中的方法，因此没办法说将所有扩展的方法均添加到自身的 PWT 中。

当然除非将所有协议派发均改为动态派发，但是 Swift 团队的人并不希望出现这种情况。

> [Protocol extensions] are strictly static typing, all the way. Which makes sense, because there’s no virtual function table (or in Swift terms, protocol witness table) to put the methods into. Extensions can provide default implementations of protocol methods because the type that conforms to the protocol puts the extension method implementation into its own protocol witness table (and they only do this if the type doesn’t already implement the method itself). Since the protocol witness table only contains things defined in the protocol itself, protocol extension methods that aren’t part of the protocol don’t get put anywhere. So invoking one of those methods has no possible virtual function table to check, the only thing it can do is statically invoke the method from the extension. And this is why you can’t override them (or rather, why your override isn’t called if the method resolution is done via the protocol).
The only way to make protocol extension methods work via virtual dispatch is to define a new protocol witness table for the extension itself, but types that were defined without being able to see the extension won’t know to create and populate this protocol witness table. […]
The only other solution that comes to mind is turning all protocol dispatch into dynamic dispatch, which I hope you’ll agree is not a good idea.

针对这个情况，大家记住一个规则就行：

1. 如果一个变量的类型被推断为协议 Protocol，那么依据是否在 Protocol 中声明了该方法来做决策，如果声明了，就调用类型自身的实现（无论协议扩展中有无默认实现），如果未声明，一定是调用的扩展中的实现；
2. 如果一个变量的类型被推断为实际的类型，那么一定执行的是该类型内部的基于实现；

## 显式指定派发方式

Swift 语言自身提供了一些修饰符，能够对方法的派发方式做变更，主要有如下几种。

大家都知道，Swift 语言在生成编译器前端这一侧会先生成 SIL，让编译器进行一些优化，这个阶段我们能看到具体编译器做了哪些优化。 我们先看下

![Modifier Test](https://i.imgur.com/FOSvscu.png)

在文件末尾有 V-Table 信息，如下所示：

![V-Table](https://i.imgur.com/KIr6PcI.png)

1. 默认的类方法出现，意味着默认类的方法采用表格派发；
2. 标记了 `final` 的方法没有出现在虚函数表中；
3. `@objc` 标记的方法和默认的方法相同；
4. `dynamic` 标记的方法没有出现在虚函数表中；

那我们那几句执行代码如今都什么样子，我们一个一个来看下。

### default class method

MyClass 的默认方法的 SIL 内容如下：

![default class method](https://i.imgur.com/4mOvakz.png)

### final

final 关键字能够确保方法进行静态派发，添加了该关键字的方法也会对 Objective-C 运行时隐藏该方法，使得 OC 运行时不会为该方法生成 selector. 

在上面 SIL 文件里找到 final 标记的方法：

![final](https://i.imgur.com/e869Ybt.png)

这里可以看到，function_ref 表明直接拿到函数指针，将实例对象传递给该方法，apply 就是执行的意思。

### dynamic

dynamic 是确保该方法能够进行消息派发，也就是说该确保该方法是通过 obj_msgSend() 来调用的。在 Swift 4 之前，dynamic 关键字是和 @objc 关键字一起出现的，到了Swift4 之后，官方将这两个关键字的功能拆开了。@objc 只确保 Objective-C 可见。

我们看到 MyClass 的虚函数表中，使用 dynamic 修饰的方法 `performDynamicOperation`  并不在其中，这也证明了该方法的派发已经不是 Table Dispatch 了。

而我们再看下实际生成的调用处的代码：
![dynamic](https://i.imgur.com/hBnDKha.png)

看到这里有 objc_method ，我们实际上是将实例对象直接传递给 objc_method 来执行了。从这里首先我们能知道 dynamic 修饰的方法不是直接派发，也不是表格派发，是将该实例对象转换成 Objc 运行时的代码进行执行。

### @objc

这两个关键字是来确保方法是否能够被 Objective-C 运行时看到。@objc 这个经常是为了暴露 Swift 方法给 Objc 来使用。一定要知道 @objc 并不是改变派发方式，在 SIL 文件中我们看到 performOcOperation 和默认类方法 performOperation 一样均在 V-Table 中出现。

![@objc](https://i.imgur.com/XeU21sp.png)
从生成的 SIL 来看，使用 @objc 标记的方法和默认的方法完全一致，都是进行表格派发。


### 关于内联

内联是自从 C 语言开始，编译器针对函数调用的一种优化措施。一旦编译器判定某个函数能够进行内联优化，则会将一次函数调用直接在当前调用处展开，就如同不存在函数本身，而直接将函数中的代码插入到当前调用处。我们拿个例子来看。

编译器如果判定该方法进行内联的话，在编译期就会将代码转换成如下：

![Inline Code](https://i.imgur.com/KkjZV24.png)
因为一次函数调用的代价是存在的，虽然一次函数调用的代价受到多种因素影响，但是有几个关键的因素，比如说函数调用栈的开辟，间接指针跳转以及分配寄存器。

当然，编译器是需要很多多种情况衡量这个方法是否适合进行内联优化的，具体的因素在下面的参考文献里已经列举出来了，我就不详细说了，感兴趣的同学可以看下[这篇文章]([https://www.geeksforgeeks.org/inline-functions-cpp/)了解下，我这里大致列举了几种：

1. 函数体中有循环；
2. 函数体过长（想象一下，要是都展开了，无形中增加了包体积，重复代码）；
3. 递归函数；

内联也不是都是好处，比如说增大二进制体积等。所以针对内联与否，编译器是有一套完整的考量标准的。当然，所以 Swift 而言，有内联参数来主动干预， `@inline(__always)` 以及 `@inline(never)`.

Swift 支持内联，该参数告知编译器进行派发优化，使用直接派发（静态派发）的形式。当然具体能不能做成内联函数还是要看编译器怎么抉择了。

OK，通过修饰符来主动修改派发方式大体是这样，

![dispatch for modifier](https://i.imgur.com/AKBneR0.jpg)


## 可见性带来的优化

通过前面的介绍，我们知道如果能够给编译器传递很多的信息，编译器就能按照既定规则来帮助开发者做一定的优化，如何给予编译器很多信息呢？那就是合适的控制 Visibility 了。对于 Swift 而言，从 2.0 开始提供了 Whole Module Optimizations 开关，很大程度上提升了 Swift 的整体性能。



我们摘录 Swift Blog 中的一个例子来说明这个参数的意义，假如我们的 Module 中只有utils.swift 和 main.swift 两个文件，如下所示:

<img src="https://i.imgur.com/VwS1kIu.png" alt="Carbonize 2019-09-18 at 1.00.20 AM-squashed" style="zoom: 50%;" />

和以往大家对编译文件的认识一样，编译器是针对独立的每一个源文件进行编译，优化等一系列操作。当编译器优化当前文件的时候，只会考虑当前的文件，比如 main.swift 文件，编译器只知道有个函数为 getElement，但是不知道其具体实现。而在编译器准备优化 utils.swift 文件时，因为它并不知道具体类型 T 是什么，这个时候它就没法做泛型参数具体化，只能生成一个泛型版本的函数实现，然后会在运行时阶段动态的根据传递具体的类型来确定返回什么。



再举个例子，我们前面说内联，内联优化的前提是编译器能够解析当前函数体来确定是否进行内联，而如果这种分离优化的情况下，内联优化也是做不到的，比如你把函数定义在其他独立的文件，当前调用该函数的文件就没法做内联展开。这一切都是因为编译器仅关心当前文件而无法获知其他文件信息而导致的。而开启了 WMO ，理论很简单就是使得编译器全局考虑整个模块，显式的让编译器在编译阶段全局考察当前 Module 内部所有的 Swift 文件。



所以上面的例子，开启了 WMO 之后，编译器就会针对这两个文件做一些优化工作，比如 utils.swift 中定义的方法就会被直接特化，而使用该方法的 main.swift 的方法中的使用也会进行内敛优化，如下所示。

<img src="https://i.imgur.com/rAh4ykK.png" alt="Carbonize 2019-09-18 at 1.03.14 AM-squashed" style="zoom:50%;" />

那这个对类型派发的意义在哪里呢？ 首先通过上面的例子中的内联展开就已经体现出了优化策略。将原本相对高代价的动态派发转换成了静态派发。



我们再以官方 WWDC 的 Demo 为例了解下这个优化点，加深一下影响。



<img src="https://i.imgur.com/nzj6724.png" style="zoom: 67%;" />



默认 Dog 的 noise 方法，在独立编译 Dog.swift 文件的时候，编译器是无法保证其不被其他类继承的，因此它只能默认其是需要进行重载的形式进行 V-Table 派发。而一旦开启了 WMO，如上图的例子，Dog 自身作为 Internal 已经没有其他 Module 继承的可能性，而纵观整个 Module ，编译器发现如果没有任何继承自 Dog 的类，那么它就被优化为直接派发，省略一次间接跳转的代价。



<img src="https://i.imgur.com/RztcEm8.png" style="zoom: 67%;" />



之前因为单个文件做优化，编译器并不知道 Dog 的方法有没有被重载而不得不将 noise 方法存入虚函数表中做 Table Dispatch，而现在通过全局掌控，编译器明确知道作为 Internal 控制的 Dog 在当前 Module 内并无任何子类出现，此时其 noise 方法的调用就会被直接更改为 Direct Dispatch。

因此通过开启 `Whole Module Optimizations` 开关，使得 Swift 编译器能够获取很多信息，包括类型的继承关系以及 Access Control 的情况来进行优化。



# 总结

通过上面的讲解，我们可以列出目前所有的方法派发情况：



![](https://i.imgur.com/EpyLztd.png)



虽然现在编译器优化方面做的已经足够优秀了，但是对于代码开发者的我们还是要比编译器更能应付业务逻辑的复杂代码，而这些复杂代码导致可以优化的地方被编译器忽略。因此，还是需要 Coder 自己能够主观上有认识到这些可以优化的一些点，从小处着手，写出更加高效的代码。



## References

1. [Virtual method table](https://en.wikipedia.org/wiki/Virtual_method_table)
2. [Proposal: Universal dynamic dispatch for method calls](https://forums.swift.org/t/proposal-universal-dynamic-dispatch-for-method-calls/237/28)
3. [Increasing Performance by Reducing Dynamic Dispatch - Swift Blog](https://developer.apple.com/swift/blog/?id=27)
4. [@objc and dynamic - Swift Unboxed](https://swiftunboxed.com/interop/objc-dynamic/)
5. [Whole-Module Optimization in Swift 3](https://swift.org/blog/whole-module-optimizations/)
6. [Inline Functions in C++ - GeeksforGeeks](https://www.geeksforgeeks.org/inline-functions-cpp/)
7. [The Cost - A Function Call](https://mortoray.com/2010/10/12/the-cost-a-function-call/)
8. [Swift Intermediate Language](https://github.com/apple/swift/blob/master/docs/SIL.rst)