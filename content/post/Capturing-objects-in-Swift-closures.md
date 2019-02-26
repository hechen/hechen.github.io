---
title: Capturing objects in Swift closures
date: 2017-11-12 20:56:50
categories: ["Translation"]
tags: ["iOS","Swift","Closure"]
---


> 原文：[Capturing objects in Swift closures](https://www.swiftbysundell.com/posts/capturing-objects-in-swift-closures)
> 原作者 [@johnsundell](https://twitter.com/johnsundell)
> 翻译：[@OgreMergO](https://twitter.com/OgreMergO)

自从 Block 在 iOS4 被引入 Objective-C 的世界之后就成为了 Apple 各平台上最时髦的 API 的重要组成部分了。当 Swift 语言出现的时候，blocks 的概念就摇身一变通过 closure 的形式引入，成为了目前我们可能每一天都在用的语言特性之一了。

Closure 目前已经被我们广泛的使用了，即使如此，我们在使用它的时候还是需要有很多需要注意的点，并且需要做很多额外的操作。这篇文章，我们来近距离的了解 closure，主要是了解其捕获变量的机制以及那些能够更好的让我们来处理变量捕获的技术。

## 伟大的 escape

Closure 有两种类型：escaping 和 non-escaping。当一个 closure 是 escaping（使用 `@escaping` 修饰闭包参数）的，也就意味着其会被以各种形式存储下来（无论是通过 property 还是被其他 closure 捕获）。相反，Non-Escaping 的　closure 意味着其不能被存储，而且在使用它的地方就必须直接被执行。

> 译者注： 可以参见 [《@autoclosure && @escape》](http://hechen.info/2017/11/12/autoclosure-escape/) 一文。

一个显而易见的例子就是当你在一个集合类型上使用函数式操作的时候，例如 `forEach`：

```
[1, 2, 3].forEach { number in
    ...
}
```

如上代码所示，closure 都直接作用于集合的每一个元素上，也就无需把该闭包变为 escaping 的。

而 escaping 的 closures 最常见的就是在那些异步 API 中，例如 `DispatchQueue`。例如，当你异步执行某 closure 的时候，这个 closure 就会 escape。

```
DispatchQueue.main.async {
    ...
}
```

所以，这两种的区别在哪里呢？ 由于 escaping 的 closure 会被以某种形式存储下来，因此，这些 closure 会同时存储当前其所处的上下文，同时就会把上下文中用到的值或者对象都捕获（capture）到，以至于当该 closure 被执行的时候，所需用到的内容没有丢失。实践中最常见的就是在 closure 中使用 self 的 API，此时，我们就需要某种办法显式的捕获 self。


## 捕获 & 引用循环

因为 escaping 的 closures 会自助捕获在其内部使用的任何值和对象，因此很容易发生引用循环。举个例子，下面描述的是一个 view controller 被其存储的 viewModel 的 closure 捕获的情况：

```
class ListViewController: UITableViewController {
    private let viewModel: ListViewModel

    init(viewModel: ListViewModel) {
        self.viewModel = viewModel

        super.init(nibName: nil, bundle: nil)

        viewModel.observeNumberOfItemsChanged {
            // This will cause a retain cycle, since our view controller
            // retains its view model, which in turn retains the view
            // controller by capturing it in an escaping closure.
            self.tableView.reloadData()
        }
    }
}
```

最常见的方式，也就是你们大部分人也都会用的解决方式，通过弱引用的方式打破这个循环引用。

```
viewModel.observeNumberOfItemsChanged { [weak self] in
    self?.tableView.reloadData()
}
```


## 捕获 context 而不是捕获 self

上面提到的 [weak self] 的解决方案已经是你希望避免引用循环的最常用，也常常是最有效的解决方案了。但是这种方式也有一些问题：

1. 很容易忘掉写，尤其是编译器又没检查出来潜在的引用循环的时候；
2. 当你希望从 weak self 中强持有 self 的时候还需要写一堆代码（weak strong dance），例如下面这段代码所示：

```
dataLoader.loadData(from: url) { [weak self] data in
    guard let strongSelf = self else {
        return
    }

    let model = try strongSelf.parser.parse(data, using: strongSelf.schema)
    strongSelf.titleLabel.text = model.title
    strongSelf.textLabel.text = model.text
}
```

这里其实有一个可选的解决方案，也就是不要捕获 self，而去捕获那些闭包中所需要的对象即可。例如上面例子中的 labels 和 schema 等，我们可以直接捕获它们而不至于引发引用循环（因为其也并不持有 closure 本身），下面是个解决方案，通过使用 context 的 tuple 来解决。

```
// We define a context tuple that contains all of our closure's dependencies
let context = (
    parser: parser,
    schema: schema,
    titleLabel: titleLabel,
    textLabel: textLabel
)

dataLoader.loadData(from: url) { data in
    // We can now use the context instead of having to capture 'self'
    let model = try context.parser.parse(data, using: context.schema)
    context.titleLabel.text = model.title
    context.textLabel.text = model.text
}
```

## 通过显式传递参数而不是隐式的捕获

这里，还有另外一种捕获对象的方式，就是显式的把这些对象通过参数传入。这种手法我在设计我的 [Image Engine]() 项目中的 Event API 的时候用到了，这个 API 就是当使用 closure 来监听 event 的时候，需要你传递一个 observer 给它。如下所示，你把 self 传入进来的同时也使得其被传递到了 event 的 closure 中了，这也使得 self 被隐式的带入，你也无需手动的捕获它了。

```
actor.events.moved.addObserver(self) { scene in
    ...
}
```

我们回到之前的 ListViewController 的例子中，看一看当我们要监听其 viewModel 的时候，我们是如何通过上面这种手法来实现同样的 API 的。这种方式正好使得我们可以将要 reload 的 tableView 作为观测者传递，实现一个很优雅的调用：

```
viewModel.numberOfItemsChanged.addObserver(tableView) { tableView in
    tableView.reloadData()
}
```

当然，需要实现上面这段代码，我们还需要做一些事情，就像 Image Engine 的事件系统如何工作类似。我们首先定义一个简单的 Event 类型，其可以记录那些观测闭包。

```
class Event {
    private var observers = [() -> Void]()
}
```

然后，我们添加一个方法，该方法会传两个参数进来，一个是引用类型的观测者，另外一个是一个闭包，当观察动作一旦触发，该闭包就会被调用。核心就在这里，我们会封装该闭包，并且在内部闭包中弱捕获该观测者：

```
func addObserver<T: AnyObject>(_ observer: T, using closure: @escaping (T) -> Void) {
    observers.append { [weak observer] in
        observer.map(closure)
    }
}
```

这样就使得我们只需要做这么一次 weak/string 的操作，也不影响其调用的地方。

最后，我们添加一个 trigger 方法来使得我们能够触发事件本身。

```
func trigger() {
    for observer in observers {
        observer()
    }
}
```

然后回到 `ListViewModel`，为 `numberOfItemsChanged` 方法添加事件，当某个条件满足的时候，就会触发该事件。

```
class ListViewModel {
    let numberOfItemsChanged = Event()
    var items: [Item] { didSet { itemsDidChange(from: oldValue) } }

    private func itemsDidChange(from previousItems: [Item]) {
        if previousItems.count != items.count {
            numberOfItemsChanged.trigger()
        }
    }
}
```

如上面所看到的，基于 event 的 API 的最大优势就是最大程度上避免了引用循环的发生。我们也可以在我们的代码中为任意类型的观察事件重用相同的执行代码。当然，上面的 demo 中 Event 实现非常简单，缺乏一些高级特性，比如针对观察者的移除等等，但是对于简单使用已经足够了。

我们会在之后的博文中详细的讲述事件驱动的编程范式，你也可以详细看下在 Image Engine 项目中的 [Event 类型的完整实现](https://github.com/JohnSundell/ImagineEngine/blob/master/Sources/Core/API/Event.swift)。


## 总结

Closure 自动捕获其内部所使用的对象和值本身是一个非常棒的特色，它使得 closure 本身变得非常好用。但是，捕获同时也引入了一些 bug 和引用循环的问题，甚至最后使得代码变得复杂和难以理解。

当然，我并不是建议大家在所有的场景下去避免捕获发生，而是想通过这篇文章提供给大家一些捕获 self 的选择。在某些场景下，使用经典的 [weak self] 是最有效的解决方案，另外一些场景则可以使用某些手法来帮助你把自己的闭包代码写的更容易使用，也更容易理解吧。

