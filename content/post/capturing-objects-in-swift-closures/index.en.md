---
title: 'Capturing objects in Swift closures'
slug: 'capturing-objects-in-swift-closures'
date: 2017-11-12T20:56:50+00:00
draft: false
categories: ['ios', 'swift', 'translation']
tags: ['animation', 'category', 'closure', 'ios', 'notification', 'objective-c', 'runtime', 'swift']
---

> Original: [Capturing objects in Swift closures](https://www.swiftbysundell.com/posts/capturing-objects-in-swift-closures)
> Original author [@johnsundell](https://twitter.com/johnsundell)

Ever since blocks were introduced to Objective-C in iOS 4, they've been a core part of the most fashionable APIs across Apple's platforms. When Swift arrived, the block concept came along too — reborn as closures — and they've become a language feature most of us use every day.

Closures are everywhere now, but using them well still takes care and a fair amount of extra work. In this post we'll take a closer look at closures — mainly at how they capture variables, and at techniques that help us handle that capturing better.

## The great escape

Closures come in two flavours: escaping and non-escaping. An escaping closure (marked with `@escaping` on the closure parameter) is one that gets stored somewhere — whether on a property or by being captured inside another closure. A non-escaping closure, on the other hand, can't be stored — it has to run right there at the call site.

> Translator's note: see [《@autoclosure && @escape》](http://hechen.info/2017/11/12/autoclosure-escape/) for more.

An obvious example is functional operations on a collection, like `forEach`:

``` text
[1, 2, 3].forEach { number in
    ...
}
```

As above, the closure runs directly against each element of the collection — there's no reason for it to be escaping.

Escaping closures, on the other hand, show up most often in async APIs like `DispatchQueue`. When you run a closure asynchronously, it escapes:

``` text
DispatchQueue.main.async {
    ...
}
```

So what's the difference between the two? Because an escaping closure gets stored in some form, it also holds on to the context it was created in — capturing the values and objects used in that context — so that when the closure eventually runs, nothing it needs has gone missing. In practice, the most common case is using `self`'s APIs inside a closure, which is where we need some way to capture `self` explicitly.

## Capturing & retain cycles

Because escaping closures automatically capture any value or object they use internally, it's easy to land in a retain cycle. The example below shows a view controller getting captured by a closure stored on its `viewModel`:

``` text
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

The most common fix — and the one most of you reach for — is to break the cycle with a weak reference:

``` text
viewModel.observeNumberOfItemsChanged { [weak self] in
    self?.tableView.reloadData()
}
```

## Capture the context, not self

The \[weak self\] pattern above is the most common and usually the most effective way to avoid retain cycles. But it has a couple of issues:

1.  It's easy to forget, especially when the compiler doesn't catch the potential cycle for you.
2.  When you want to promote `weak self` back to a strong `self`, you end up writing a chunk of boilerplate (the weak/strong dance), like so:

``` text
dataLoader.loadData(from: url) { [weak self] data in
    guard let strongSelf = self else {
        return
    }

    let model = try strongSelf.parser.parse(data, using: strongSelf.schema)
    strongSelf.titleLabel.text = model.title
    strongSelf.textLabel.text = model.text
}
```

There's another option here: don't capture `self` at all — capture just the objects the closure actually needs. In the example above that's the labels, the schema, etc. Capturing them directly doesn't cause a retain cycle (they don't hold on to the closure themselves). One approach is to bundle them up into a context tuple:

``` text
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

## Pass objects explicitly instead of capturing them implicitly

There's yet another way to capture objects: pass them in explicitly as parameters. I used this approach when designing the Event API for my [Image Engine]() project — when you observe an event with a closure, you also pass an observer along. As shown below, you pass `self` in and it gets handed back to you inside the event closure, so `self` arrives implicitly without you having to capture it manually:

``` text
actor.events.moved.addObserver(self) { scene in
    ...
}
```

Going back to the `ListViewController` example, here's how the same technique looks when we observe its `viewModel`. It also lets us pass the `tableView` we want to reload as the observer directly, which makes for a really clean call site:

``` text
viewModel.numberOfItemsChanged.addObserver(tableView) { tableView in
    tableView.reloadData()
}
```

Of course, to make the code above work we have to do a bit of plumbing, similar to how Image Engine's event system works. First we define a simple `Event` type that records its observer closures:

``` text
class Event {
    private var observers = [() -> Void]()
}
```

Then we add a method that takes two arguments — a reference-typed observer, and a closure that fires when the event is triggered. The trick is in here: we wrap the caller's closure in our own, and capture the observer weakly:

``` text
func addObserver<T: AnyObject>(_ observer: T, using closure: @escaping (T) -> Void) {
    observers.append { [weak observer] in
        observer.map(closure)
    }
}
```

That way we do the weak/strong dance once, here, and the call site stays clean.

Finally, we add a `trigger` method so we can fire the event:

``` text
func trigger() {
    for observer in observers {
        observer()
    }
}
```

Then back in `ListViewModel`, we add a `numberOfItemsChanged` event and trigger it when the right condition is met:

``` text
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

As you can see, the big win of an event-based API is that it largely sidesteps retain cycles. We can also reuse the same implementation for observing any kind of event in our code. The `Event` shown here is bare-bones — it's missing things like observer removal — but it's plenty for simple use cases.

We'll dig into event-driven programming in a later post. In the meantime, you can see the [full Event implementation](https://github.com/JohnSundell/ImagineEngine/blob/master/Sources/Core/API/Event.swift) in the Image Engine project.

## Wrap-up

Closures automatically capturing the objects and values they use is a great feature — it's a big part of what makes closures pleasant to use. But that same automatic capture also brings bugs and retain cycles, and can make code more complicated and harder to reason about.

I'm not arguing you should avoid capturing in every situation. The point of this post is to give you a few options for capturing `self`. In some cases the classic \[weak self\] is the most effective fix. In others, the techniques above can help you write closure code that's easier to use and easier to understand.
