---
title: "RxSwift 中的几种 Subject"
date: 2019-02-26T10:24:38+08:00
draft: false
categories: ["RxSwift"]
tags: ["Subject","Variable"]
---

Subject 在 Rx 的世界里是这么一种存在，其既可以作为观测者，也可以作为被观测者。自然而然想到的是 Subject 本身就可以作为一种过渡桥接信号的手段，它订阅某个信号，一旦信号收到序列，转头它就又把信号散发给自己的观测者了。

在 RxSwift 的世界里涉及几种 Subject，这里先行做个记录：

1. PublishSubject
2. BehaviorSubject
3. ReplaySubject
4. Variable （预计在 5.0 废弃）

## PublishSubject

PublishSubject 只给订阅者发送新元素，也就是订阅者只能接受到订阅之后发出的信号。

![publishSubject](media/15511431275815/publishSubject.png)


## BehaviorSubject

![CleanShot 2019-02-26 at 09.41.41@2x](media/15511431275815/CleanShot%202019-02-26%20at%2009.41.41@2x.png)

## ReplaySubject

顾名思义，ReplaySubject 会重新发射在订阅者订阅之间发出的信号，具体发多少是由调用者决定的，其指定 Cache 多少信号，如下图中所示，Buffer Size 为 2，因此当第二个订阅者订阅 Subject 之后，其会受到最新的 1 和 2 两个信号。

``` Swift
/// 指定发射多少最新信号
let subject = ReplaySubject<String>.create(bufferSize: 2)
```

![replaySubject](media/15511431275815/replaySubject.png)

> 需要注意一点：所有被 Cache 的信号本身都是在内存中的，因此需要考虑到缓存信号的最大个数以及每个信号的负载，比如你的每个信号本身是 Image 数据，然后又 Cache 了比较多的数目，这时候内存压力就会很大，所以使用这个 ReplaySubject 的时候需要注意内存问题。


## Variable

Variable 自身实质上是 BehaviorSubject 的封装，所以它具备 Behavior 每次订阅就会接收到最新信号元素的属性，但是和 BehaviorSubject 不同在于其不会因为收到 Error 事件导致整个序列停止（也就是说只有 completion 信号才会让该信号终结），而它的信号完成是在其 deinit 方法中。

我们在日常使用中喜欢 Variable 的一个最大原因可能就是直接获取它的值，而不需要像常规信号一般需要订阅之后获取它的值。

``` Swift
var variable = Variable("Initial value")
variable.value = "New initial value"
print(variable.value)
```

目前在 RxSwift 中 Variable 已经被标记为废弃，如果你使用了 Variable 类型，编译器会在 Console 中打印出以下内容：

```
`Variable` is planned for future deprecation. Please consider `BehaviorRelay` as a replacement. Read more at: https://git.io/vNqvx
```

目前官方给出的推荐使用时 BehaviorRelay，详细解释如下：

``` Comments
/// Current recommended replacement for this API is `RxCocoa.BehaviorRelay` because:
/// * `Variable` isn't a standard cross platform concept, hence it's out of place in RxSwift target.
/// * It doesn't have a counterpart for handling events (`PublishRelay`). It models state only.
/// * It doesn't have a consistent naming with *Relay or other Rx concepts.
/// * It has an inconsistent memory management model compared to other parts of RxSwift (completes on `deinit`).
```

首先 Variable 是 RxSwift 为 Apple 生态加入的一个名词，并不是 Rx 生态共有的概念，而且名字上也显得和其他概念格格不入，因此严格意义算起来并不是 Rx 生态的一部分了；

另外，它功能上几乎和 BehaviorRelay 一样，只是多了一些状态保存。

最后一点，其内存管理语义和 Rx 其他概念也不一样，其他的信号终结是严格按照 completion 和 error 信号，但是 Variable 直到对象被释放掉才默认触发 completion 信号。

详细官方讨论在[这里](https://github.com/ReactiveX/RxSwift/issues/1501)