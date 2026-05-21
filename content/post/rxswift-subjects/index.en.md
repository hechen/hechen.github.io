---
title: 'The Subjects in RxSwift'
slug: 'rxswift-subjects'
date: 2019-02-26T10:24:38+08:00
draft: false
categories: ['macos', 'rxswift', 'swift']
tags: ['cocoapods', 'module', 'safari', 'sandbox', 'shadowsocks', 'subject', 'swift', 'traffic', 'variable']
---

> All diagrams in this post are from the book *RxSwift - Reactive Programming with Swift*.

In the Rx world, a Subject is something that's both an observer and an observable. The obvious use is as a bridge for signals: it subscribes to some stream, and the moment that stream emits, it turns around and forwards the emission to its own observers.

RxSwift gives you a few different flavours of Subject. Quick rundown:

1.  PublishSubject
2.  BehaviorSubject
3.  ReplaySubject
4.  Variable (slated for deprecation in 5.0)

## PublishSubject

A PublishSubject only forwards *new* elements to its subscribers — meaning subscribers see only the signals emitted after they subscribed. A picture says it all:

![publishSubject](https://i.imgur.com/Cw4FjCT.png)

The top row is a Subject playing the Observable role, with time running left to right. Rows 2 and 3 are observers subscribing to that Subject, and the dashed arrows mark the moment of subscription. Each observer only catches signals the Subject fires off *after* it subscribed.

## BehaviorSubject

A BehaviorSubject emits the most recent element to a subscriber the moment it subscribes, which means you have to give it an initial value when you create it (otherwise — for the very first subscriber — what would the "most recent emission" even be?). If you can't supply a sensible default, you probably want PublishSubject instead. The familiar `Variable` and `BehaviorRelay` are both wrappers around BehaviorSubject.

![BehaviorSubject](https://i.imgur.com/ei6pCwT.png)

The difference from PublishSubject is right there in the diagram: as soon as the observer subscribes, it gets the most recent prior signal.

## ReplaySubject

True to its name, a ReplaySubject replays signals that were emitted *before* a subscriber subscribed. How many it replays is controlled by `bufferSize` — the number of signals it caches. In the diagram below, the buffer size is 2, so when the second observer subscribes it receives the two most recent signals, 1 and 2.

``` swift
/// 指定发射多少最新信号
let subject = ReplaySubject<String>.create(bufferSize: 2)
```

![replaySubject](https://i.imgur.com/uuHAQ9c.png)

> One thing to watch out for: every cached signal lives in memory. So you need to think about both the buffer size and the payload of each signal. If each signal is, say, an image, and you've cached a fair number of them, memory pressure adds up fast. Use ReplaySubject with that in mind.

## Variable

`Variable` is really just a wrapper around BehaviorSubject, so it has the same property of handing the latest element to every new subscriber. The difference from BehaviorSubject is that it doesn't terminate on an Error event — only a completion signal will end the sequence, and that completion is fired in its `deinit`.

The reason most of us reach for Variable in day-to-day code is that you can grab its value directly without having to subscribe. No subscription dance, just read it. And because its lifecycle is tied to ARC, you don't have to explicitly tear down the subscription either.

``` swift
var variable = Variable("Initial value")
variable.value = "New initial value"
print(variable.value)
```

RxSwift has now marked Variable as deprecated. If you use it, the compiler prints this in the console:

``` text
`Variable` is planned for future deprecation. Please consider `BehaviorRelay` as a replacement. Read more at: https://git.io/vNqvx
```

The recommended replacement is `BehaviorRelay`. The detailed reasoning, straight from the source:

```
/// Current recommended replacement for this API is `RxCocoa.BehaviorRelay` because:
/// * `Variable` isn't a standard cross platform concept, hence it's out of place in RxSwift target.
/// * It doesn't have a counterpart for handling events (`PublishRelay`). It models state only.
/// * It doesn't have a consistent naming with *Relay or other Rx concepts.
/// * It has an inconsistent memory management model compared to other parts of RxSwift (completes on `deinit`).
```

In short: Variable is a name RxSwift introduced for the Apple ecosystem — it isn't a shared concept across Rx implementations, and the name doesn't fit alongside the other Rx primitives, so strictly speaking it doesn't really belong.

Functionally, it's almost identical to BehaviorRelay; you can do the same things with BehaviorRelay.

And finally, its memory semantics don't match the rest of Rx. Other signals terminate strictly on completion/error events, but Variable doesn't fire its default completion until the object itself is deallocated.

The full upstream discussion is [here](https://github.com/ReactiveX/RxSwift/issues/1501).
