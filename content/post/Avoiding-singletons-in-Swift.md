---
title: 避免在 Swift 中使用单例
date: 2018-07-16 17:34:36
categories: ["Translation"]
tags: ["iOS","XCode","Swift","Singleton"]
---



“我知道单例不好，但是...”，这是开发者常常在讨论代码的时候会提到的。貌似社区大家有共识 ── 单例不好。但是同时，包括 Apple 和第三方的 Swift 开发者还是在 App 内部或者共享的 frameworks 里不断在用它们。

这周，让我们好好看一看单例的问题到底在哪里，探索更多的技巧以便我们日常能够避免使用它们。这就开始吧！

### 为什么单例这么流行？

首先一点我们要想的是问问自己，为什么单例这么流行？热过大多数开发者都认同，单例应该被避免的话，为什么它们还不断的出现呢？

我认为有两部分原因。

我觉得日常开发 Apple 平台上的 App 时候大量使用单例，最大的原因是苹果自己也在经常的用。作为第三方开发者来讲，我们常常会把 Apple 的做法作为最佳实践来用，任何 Apple 自己常常使用的模式在社区也会发展的很迅速。

这个谜题的第二个原因是单例非常方便。单例因为它可以在任何地方获取到，因而经常会扮演一个获取特定核心值或者对象的快捷方式。可以看下下面这个例子，在这个例子中，我们想在 **ProfileViewController** 中展示当前登录用户的名字，同时当某个按钮按下的时候，退登当前用户。


``` Swift

class ProfileViewController: UIViewController {
    private lazy var nameLabel = UILabel()
    override func viewDidLoad() {
        super.viewDidLoad()
        nameLabel.text = UserManager.shared.currentUser?.name
    }
    private func handleLogOutButtonTap() {
        UserManager.shared.logOut()
    }
}

```

按照上面这样，把一个 UserManager 单例的用户和账户处理的功能封装起来，确实很方便（而且很常见！），那这种模式的使用到底不好在哪里呢？

### 为什么单例会很糟糕？

当讨论类似模式和架构这些东西的时候，很容易陷入一个特别理论化的圈套。虽然让我们的代码理论上“正确”，遵循最佳实践和原则是很美好的，但是现实经常会很受打击，我们需要寻找一些中间方案。

所以，关于单例引起的实质性问题是什么呢？为什么它们要应该被避免呢？这里我倾向于三个原因：

1. 这些单例是全局的可变的共享状态。它们的状态是在整个 App 里自动共享的，因此当其状态发生不可预期的变化的时候，Bug 也就可能开始发生了；
2. 单例之间的关系以及依赖这些单例的代码常常不那么好定义。因为单例是如此方便和容易获得，大量的使用它们常常会导致很难维护[面条式代码](https://zh.wikipedia.org/wiki/%E9%9D%A2%E6%9D%A1%E5%BC%8F%E4%BB%A3%E7%A0%81)，这些代码中对象和对象之间没有清晰的隔离；
3. 管理这些单例的生命周期非常的难。因为单例本身会在应用的整个生命周期内存活，管理它们就变得异常困难，因此常常会不得不依赖可选值来跟踪值的变化。这也使得依赖单例的代码变得很难测试，因为你没法在一个测试 case 里把状态重置。

在我们前面的 **ProfileViewController** 的例子中，我们已经看到了有这三个问题的信号出现。首先它依赖 UserManager 导致这二者关系很不清晰，其次，它不得不让 currentUser 作为可选值出现，因为我们没办法在编译期就能够确定视图控制器实际上出现的时候这个数据一定在。听起来就感觉要有 bug 发生的感觉 😬!


### 依赖注入

相对于使用 **ProfileViewController** 通过单例来获取它所需的依赖项，我们要在其初始化方法中将依赖项传入。这里我们是将当前的 User 作为非可选传入的，同样，传入一个 **LogOutService** 来进行登出操作：


```Swift

class ProfileViewController: UIViewController {
    private let user: User
    private let logOutService: LogOutService
    private lazy var nameLabel = UILabel()
    init(user: User, logOutService: LogOutService) {
        self.user = user
        self.logOutService = logOutService
        super.init(nibName: nil, bundle: nil)
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        nameLabel.text = user.name
    }
    private func handleLogOutButtonTap() {
        logOutService.logOut()
    }
}

```

这样的话，代码就会变得更加清晰，并且容易管理。我们的代码现在安全的依赖其 Model，并且有一个清晰的 API 进行登出的交互。一般情况下，将各种单例以及管理器重构成清晰分离的服务能够使得一个 App 的核心对象之间的关系更加清晰。

### Services

举个例子，让我们更近一些来看下 **LogOutService** 这个类是如何实现的。它内部也对其依赖的服务使用了依赖注入，并且提供了一个优雅的，定义清晰的 API 来只做一件事情 ── 登出。

``` Swift

class LogOutService {
    private let user: User
    private let networkService: NetworkService
    private let navigationService: NavigationService
    init(user: User,
         networkService: NetworkService,
         navigationService: NavigationService) {
        self.user = user
        self.networkService = networkService
        self.navigationService = navigationService
    }
    func logOut() {
        networkService.request(.logout(user)) { [weak self] in
            self?.navigationService.showLoginScreen()
        }
    }
}

```

### 翻新

从一个重度使用单例的设置到完全使用服务，依赖注入以及本地状态来改造会非常的困难，会花费大量时间。而且，会很难认为花大量时间在这上面是合理的，而且有些时候可能会需要一次更大规模的重构才行。

谢天谢地，我们可以使用相近的技术，在[Testing Swift code that uses system singletons in 3 easy steps](https://www.swiftbysundell.com/posts/testing-swift-code-that-uses-system-singletons-in-3-easy-steps)这篇文章中也使用到过，其允许我们可以以一种非常容易的方式单例开始。和很多其他解决方案类似 ── 协议来救场！

我们不是一次性重构所有的单例，而是创建 Service 类，我们可以很简单的把我们的 Service 定义成 Protocol，如下所示：


``` Swift

protocol LogOutService {
    func logOut()
}
protocol NetworkService {
    func request(_ endpoint: Endpoint, completionHandler: @escaping () -> Void)
}
protocol NavigationService {
    func showLoginScreen()
    func showProfile(for user: User)
    ...
}

```

然后我们就能通过将单例符合我们新创建的 Service 协议来使其翻新为一堆 Service。在很多情况下，我们甚至不需要改变任何实现，只是简单的传递它们 shared 实例作为一个 Service 即可。

同样的技巧也能够被用作重构我们 app 中其他核心对象，那些对象我们也许也都正在以某种单例形式在使用着，例如使用 AppDelegate 来做导航。


``` Swift

extension UserManager: LoginService, LogOutService {}
extension AppDelegate: NavigationService {
    func showLoginScreen() {
        navigationController.viewControllers = [
            LoginViewController(
                loginService: UserManager.shared,
                navigationService: self
            )
        ]
    }
    func showProfile(for user: User) {
        let viewController = ProfileViewController(
            user: user,
            logOutService: UserManager.shared
        )
        navigationController.pushViewController(viewController, animated: true)
    }
}

```

我们现在通过使用依赖注入以及 Service 的方式，开始使得我们工程处在 Singleton free 的状态，而不需要进行特别巨大的工程改造和重写。接下来我们就能够使用 Service 或者其他类型的 API 逐个替换掉单例，比如说使用[这篇博文](https://www.swiftbysundell.com/posts/replacing-legacy-code-using-swift-protocols)中的技巧。

### 结论

单例也不是都是不好的，只是在很多情况下，它们会引发一系列问题，这些问题可以通过使用依赖注入的方式为你程序里的对象建立良好的关系来解决。

如果你现在正在开发的 App 里在使用大量的单例，那你一定也在经历或者已经经历过它们所带来的 bug 了吧。希望这篇文章能够给你一些灵感让你没有那么慌乱的开始远离它们。









