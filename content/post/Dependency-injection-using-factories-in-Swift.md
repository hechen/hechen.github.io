---
title: 在 Swift 中使用工厂模式进行依赖注入
date: 2017-11-19 18:17:15
categories: ["Translation"]
tags: ["iOS","XCode","Swift"]
---

依赖注入是一项使得代码更加可测试的关键工具。我们不需要持有某些对象，或者创建这些对象的自有依赖，或者通过单例来获取他们，而是尽可能使那些对象能够正常运转所必须的一切内容（其他对象）通过外界传入，这样做的好处在于，一方面能清晰的看得到某个对象的所有依赖项，另一方便也使得测试工作变得更为简单（因为我们可以模拟这些依赖项来捕获、验证状态以及值。）

然而，尽管依赖注入确实很有用，但是当在工程中广泛使用的时候还是会有一些痛点。随着某个对象的依赖项越来越多，初始化该对象就变得越来越蹩脚。虽然使得代码可测没毛病，但是如果像下面这种每次需要这样来写初始化方法，也太不爽了。

```
class UserManager {
    init(dataLoader: DataLoader, database: Database, cache: Cache,
        keychain: Keychain, tokenManager: TokenManager) {
        // ...
    }
}
```

所以，这周咱们来深入了解一下某种依赖注入的技巧，使得我们的代码不失去可测性，我们也不需要再强迫自己去写一团初始化方法或者复杂的依赖管理的代码。

## 传递依赖项

我们遇到上面代码 demo 中的问题，最主要的原因是我们需要把这么多依赖项传递给某个对象，以便之后来使用。举例来说，我们在构建一个消息收发的 App，这里有一个 view controller 需要展示某个用户所有的消息：

```
class MessageListViewController: UITableViewController {
    private let loader: MessageLoader

    init(loader: MessageLoader) {
        self.loader = loader
        super.init(nibName: nil, bundle: nil)
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        loader.load { [weak self]() messages in
            self?.reloadTableView(with: messages)
        }
    }
}
```

如上代码能看到，我们给 `MessageListViewController` 传入某个依赖项 `MessageLoader`，之后其被用来加载数据。这里其实并没有太大的问题，因为仅仅只有一个依赖而已。然而，我们的列表视图并不是一个死气沉沉的展示而已，某些状态下还需要们进行导航到某视图控制器的工作。

具体来讲，我们想让用户在点击消息列表中某个 cell 的时候，导航到一个新的视图中。我们为这个新的视图创建一个视图控制器 `MessageViewController`，使得用户能够单独查看某条消息，并且能够回复该消息。为了该功能，我们实现了 `MessageSender` 类，当创建该类的时候，我们将前面那个新的视图控制器传递给他，代码类似下面这样：

```
override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
    let message = messages[indexPath.row]()
    let viewController = MessageViewController(message: message, sender: sender)
    navigationController?.pushViewController(viewController, animated: true)
}
```

问题来了，`MessageViewController` 需要有一个 `MessageSender` 实例，我们也需要使得 `MessageListViewController` 看到该类。一种办法就是简单的，将 sender 加入到 列表视图控制器的初始化方法中，如下所示：

```
class MessageListViewController: UITableViewController {
    init(loader: MessageLoader, sender: MessageSender) {
        ...
    }
}
```

一旦如上面这样开始写代码，我们就逐步的进入庞大初始化方法的不归路上咯，然后使得 `MessageListViewController` 会变得越来越难用（也会让调用这很困惑，为什么一个列表视图控制器还需要关心某个发送消息的人？）。

另外一个可能的解决方案（也是一个很常用的解决方案），就是把 MessageSender 做成一个单例，这样的话，我们可以很容易在任何地方取到他的值，也可以随时将单例对象注入`MessageViewController` 中：

```
let viewController = MessageViewController(
    message: message,
    sender: MessageSender.shared
)
```

然而，就如 [Avoiding singletons in Swift](https://www.swiftbysundell.com/posts/avoiding-singletons-in-swift) 这篇文章中讲的，单例这种方式会伴随一些明显的缺陷，导致我们会难以看清依赖关系，从而对整个框架都难以理解。

## 工厂模式来救场

Wouldn't it be nice if we could just skip all of the above, and enable MessageListViewController to be completely unaware of MessageSender, and all other dependencies that any subsequent view controllers might need?

如果我们能够避免掉上面这些问题，能够使得 `MessageListViewController` 完全不关心 `MessageSender`，甚至是后续的视图控制器的其他依赖，岂不是很爽？

如果我们有某种形式的工厂，我们可以给其传入指定的 message，然后很方便的产出一个 `MessageViewController` 出来，类似下面这样，就能够很方便并且简洁的实现上面的理想：

```
let viewController = factory.makeMessageViewController(for: message)
```

如 [Using the factory pattern to avoid shared state in Swift](https://www.swiftbysundell.com/posts/using-the-factory-pattern-to-avoid-shared-state-in-swift?rq=factories) 这篇文章中我们看到的，关于工厂模式中，我最喜欢的一点就是，他能够使得你将某个对象的创建和使用两者解耦，也能使得许多对象和这些对象的依赖之间有一个相对解耦的关系，进而能使得我们想重构代码或者修改某些部分的时候相对更容易一些。

### 那我们该怎么做呢？

首先，我们定义一个工厂协议，该协议使得我们能够在并不知道某个视图控制器的依赖项或者其初始化方法的前提下，很容易的在我们的应用中创建出我们需要的任意的视图控制器。

```
protocol ViewControllerFactory {
    func makeMessageListViewController() -> MessageListViewController
    func makeMessageViewController(for message: Message) -> MessageViewController
}
```

到这里我们还不能停止。我们同样为工厂添加一些附件的协议用来创建视图控制器的依赖，比如下面这个协议，使得我们可以为某个列表视图控制器生成一个 `MessageLoader` 出来：


```
protocol MessageLoaderFactory {
    func makeMessageLoader() -> MessageLoader
}
```

## 单例依赖

一旦我们准备好这些工厂协议之后，回到上面 `MessageListViewController` 的地方，重构这段代码，无需使用其依赖项的实例而是简单的引入一个工厂实例即可。

```
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

通过上面这么做，我们可以做到两点：

1. 我们将一堆依赖项简化成了一个单一的工厂；
2. `MessageListViewController` 无需再需再关心 `MessageViewController` 的依赖项了

## 一个使用 Container 的例子

接下来，我们该实现工厂协议了。首先，我们需要定义一个 `DependencyContainer`，该对象会包含我们应用中那些正常情况下会被直接用来作为依赖的核心工具对象们。这些不仅仅包括类似之前 `MessageSender`，也包括更加底层的业务逻辑上的类，比如我们可能会用到 `NetworkManager`。

```
class DependencyContainer {
    private lazy var messageSender = MessageSender(networkManager: networkManager)
    private lazy var networkManager = NetworkManager(urlSession: .shared)
}
```

从上面这段代码，你能看到，我们使用了懒加载属性以便能够在初始化该对象的时候能够引用相同类中的其他属性。这是设置你依赖关系的一种非常方便而且优雅的方式，你可以利用编译器帮助你避免比如[引用循环](https://en.wikipedia.org/wiki/Circular_dependency)等问题。

最后，我们为 `DependencyContainer` 实现我们的工厂协议，使得我们能够将该工厂注入各种视图控制器或其他对象中：


```
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

## 分布式的所有权

最后一步了，我们在哪里实际储存依赖存储器，谁应该拥有它？它应该在哪里设置？这里有些比较 cool 的事情就是，由于我们把依赖容器作为对象们所需要的工厂的一种实现，而对象们强持有其工厂，所以，我们其实无需在任何地方储存该依赖容器。

举例来说，如果 `MessageListViewController` 是我们应用的初始化视图控制器，我们可以很简单的创建一个 `DependencyContainer` 的实例传入：


```
let container = DependencyContainer()
let listViewController = container.makeMessageListViewController()

window.rootViewController = UINavigationController(
    rootViewController: listViewController
)
```

无需保留任何全局的变量或者在 app delegate 中使用可选属性。


## 总结

使用工厂协议和容器配置依赖注入是一种很好的方式，其可以避免需要传递大量依赖而创建很复杂的初始化方法。它可以使得依赖注入使用起来更加方便，使得你能够对自己创建的对象实际的依赖关系有很明晰的判断，也使得测试更加简单。

因为我们能够把工厂定义为协议，因此可以很容易的在测试中通过给定不同测试指定版本的具体实现来模拟输出。未来我会写大量关于模拟数据以及如何在测试中充分利用依赖注入的博文。


