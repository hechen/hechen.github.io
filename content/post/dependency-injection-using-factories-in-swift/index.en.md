---
title: 'Dependency injection using factories in Swift'
slug: 'dependency-injection-using-factories-in-swift'
date: 2017-11-19T18:17:15+00:00
draft: false
categories: ['ios', 'swift', 'translation']
tags: ['animation', 'carthage', 'closure', 'cocoapods', 'ios', 'notification', 'objective-c', 'optional', 'swift', 'xcode']
---

> Original: [Dependency injection using factories in Swift](https://www.swiftbysundell.com/articles/dependency-injection-using-factories-in-swift/)
>
> Original author & copyright: [@johnsundell](https://twitter.com/johnsundell)

Dependency injection is one of the key tools for making code more testable. Instead of holding onto objects, creating their dependencies ourselves, or grabbing them from singletons, we pass in everything an object needs to function from the outside. The upside is twofold: you can see every dependency an object has at a glance, and testing becomes much easier (since you can substitute mock dependencies to capture and verify state and values).

The thing is — useful as dependency injection is, it does come with friction when used pervasively across a project. As an object accumulates dependencies, its initializer turns into something awkward. Making code testable is great, but having to write something like this every time you instantiate the thing isn't:

``` text
class UserManager {
    init(dataLoader: DataLoader, database: Database, cache: Cache,
        keychain: Keychain, tokenManager: TokenManager) {
        // ...
    }
}
```

So this week, let's take a closer look at a dependency injection technique that keeps our code testable without forcing us to write a wall of initializer parameters or maintain complex dependency-wiring code.

## Passing dependencies around

The reason the code above gets uncomfortable is that we have to hand so many dependencies through to an object so it can use them later. Say we're building a messaging app, and we have a view controller that needs to display all of a user's messages:

``` text
class MessageListViewController: UITableViewController {
    private let loader: MessageLoader

    init(loader: MessageLoader) {
        self.loader = loader
        super.init(nibName: nil, bundle: nil)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        loader.load { [weak self]() messages in
            self?.reloadTableView(with: messages)
        }
    }
}
```

So far, so good — we hand `MessageListViewController` a single dependency, `MessageLoader`, which it uses to load data. Not really a problem, since it's just one dependency. But our list view isn't going to be a dead-end display: in certain states it'll also need to navigate to other view controllers.

Specifically, when a user taps a cell in the message list, we want to navigate to a new view. We create a `MessageViewController` for that view, so the user can read a single message in isolation and reply to it. To support replies, we have a `MessageSender` class, and when we create `MessageViewController` we pass it in. The code looks like:

``` text
override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    let message = messages[indexPath.row]()
    let viewController = MessageViewController(message: message, sender: sender)
    navigationController?.pushViewController(viewController, animated: true)
}
```

Here's the catch: `MessageViewController` needs a `MessageSender` instance, which means `MessageListViewController` has to be aware of one too. One option is to just add `sender` to the list view controller's initializer:

``` text
class MessageListViewController: UITableViewController {
    init(loader: MessageLoader, sender: MessageSender) {
        ...
    }
}
```

The moment we start writing code like this, we're on the road to bloated initializers, and `MessageListViewController` becomes increasingly awkward to use (and confusing for callers — why does a message list view controller care about who sends messages?).

Another common solution is to make `MessageSender` a singleton, so we can grab its instance anywhere and inject it into `MessageViewController` on demand:

``` text
let viewController = MessageViewController(
    message: message,
    sender: MessageSender.shared
)
```

But as [Avoiding singletons in Swift](https://www.swiftbysundell.com/posts/avoiding-singletons-in-swift) points out, singletons come with a set of obvious drawbacks — they obscure the dependency graph and make the architecture as a whole harder to reason about.

## Factories to the rescue

Wouldn't it be nice if we could just skip all of the above, and enable `MessageListViewController` to be completely unaware of `MessageSender` and any other dependencies that subsequent view controllers might need?

If we had some kind of factory we could hand a message to and ask it for a `MessageViewController` in return, something like:

``` text
let viewController = factory.makeMessageViewController(for: message)
```

As we saw in [Using the factory pattern to avoid shared state in Swift](https://www.swiftbysundell.com/posts/using-the-factory-pattern-to-avoid-shared-state-in-swift?rq=factories), the thing I love most about the factory pattern is that it decouples *creating* an object from *using* it. It also loosens the coupling between many objects and their dependencies, which makes it much easier to refactor or move things around later.

### So how do we do it?

First, we define a factory protocol. The protocol lets us create any view controller we need in the app without knowing its dependencies or its initializer:

``` text
protocol ViewControllerFactory {
    func makeMessageListViewController() -> MessageListViewController
    func makeMessageViewController(for message: Message) -> MessageViewController
}
```

We don't stop there. We also add helper protocols on the factory side for creating each view controller's dependencies, like this one for producing a `MessageLoader` for the list view controller:

``` text
protocol MessageLoaderFactory {
    func makeMessageLoader() -> MessageLoader
}
```

## A single dependency

With those factory protocols in place, we go back to `MessageListViewController` and refactor it to take a single factory instead of holding instances of its dependencies:

``` text
class MessageListViewController: UITableViewController {
    
    
    typealias Factory = MessageLoaderFactory & ViewControllerFactory

    private let factory: Factory
    
    private lazy var loader = factory.makeMessageLoader()

    init(factory: Factory) {
        self.factory = factory
        super.init(nibName: nil, bundle: nil)
    }
}
```

Doing this gets us two things at once:

1.  We've collapsed a whole pile of dependencies down to a single factory.
2.  `MessageListViewController` no longer has to know anything about `MessageViewController`'s dependencies.

## An example with a container

Next we need to implement the factory protocols. We start by defining a `DependencyContainer` — an object holding the core utility objects that, in normal app code, get injected as dependencies. Not just things like `MessageSender`, but also lower-level infrastructure classes like a `NetworkManager`:

``` text
class DependencyContainer {
    private lazy var messageSender = MessageSender(networkManager: networkManager)
    private lazy var networkManager = NetworkManager(urlSession: .shared)
}
```

Notice we use lazy properties so that we can reference other properties of the same instance during construction. It's a really clean way to set up your dependency graph, and you get the compiler's help to avoid problems like [circular references](https://en.wikipedia.org/wiki/Circular_dependency).

Finally, we make `DependencyContainer` conform to our factory protocols so we can hand it to any view controller or other object that needs it:

``` text
extension DependencyContainer: ViewControllerFactory {
    func makeMessageListViewController() -> MessageListViewController {
        return MessageListViewController(factory: self)
    }

    func makeMessageViewController(for message: Message) -> MessageViewController {
        return MessageViewController(message: message, sender: messageSender)
    }
}

extension DependencyContainer: MessageLoaderFactory {
    func makeMessageLoader() -> MessageLoader {
        return MessageLoader(networkManager: networkManager)
    }
}
```

## Distributed ownership

One last question: where does the dependency container actually live? Who owns it, and where does it get set up? Here's the cool part — because the container *is* the factory implementation, and objects strongly hold the factory they use, we don't actually need to store the container anywhere global.

For example, if `MessageListViewController` is the initial view controller in our app, we can just create a `DependencyContainer` on the spot and pass it in:

``` text
let container = DependencyContainer()
let listViewController = container.makeMessageListViewController()

window.rootViewController = UINavigationController(
    rootViewController: listViewController
)
```

No global state, no optional property on the app delegate.

## Wrapping up

Setting up dependency injection with factory protocols and a container is a great way to avoid bloated initializers caused by lots of dependencies. It makes dependency injection more pleasant to use, gives you a clear picture of what an object actually depends on, and makes testing much easier.

Because factories are protocols, it's trivial in tests to provide different test-specific implementations to simulate any output you need. I'll be writing a lot more about mocking and getting the most out of dependency injection in tests in future posts.
