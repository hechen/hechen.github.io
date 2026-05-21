---
title: 'Avoiding singletons in Swift'
slug: 'avoiding-singletons-in-swift'
date: 2018-07-16T17:34:36+00:00
draft: false
categories: ['translation']
tags: ['animation', 'carthage', 'closure', 'cocoapods', 'ios', 'objective-c', 'optional', 'singleton', 'swift', 'xcode']
---

> Original: [Avoiding singletons in Swift](https://www.swiftbysundell.com/articles/avoiding-singletons-in-swift/)
> Original author & Copyright [@johnsundell](https://twitter.com/johnsundell)

"I know singletons are bad, but…" — you hear it all the time when developers are talking through their code. The community seems to have settled on a consensus: singletons are bad. And yet Swift developers — Apple included, plus plenty of third parties — keep using them, both inside apps and across shared `frameworks`.

This week, let's take a serious look at what's actually wrong with singletons, and explore a few techniques that help us avoid reaching for them day to day. Here we go.

### Why are singletons so popular?

The first question worth asking ourselves is: why are singletons so popular? If most developers agree they should be avoided, why do they keep showing up?

I think there are two reasons.

The biggest reason singletons get used so heavily when building apps for Apple platforms is, I think, that Apple itself uses them all the time. As third-party developers, we tend to treat Apple's conventions as best practice, and any pattern Apple leans on tends to spread fast through the community.

The second piece of the puzzle is that singletons are incredibly convenient. Because they're reachable from anywhere, they often end up as a shortcut for grabbing some core value or object. Take the example below: in **ProfileViewController** we want to display the currently logged-in user's name, and log them out when a button is tapped.

``` swift
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

Wrapping the user and account-management logic up in a `UserManager` singleton like this is genuinely convenient (and very common!). So what's actually wrong with using it this way?

### Why are singletons bad?

When the conversation turns to patterns and architecture, it's easy to fall into a very theoretical trap. It's lovely to have code that's "correct" in theory, that follows best practices and principles — but reality tends to push back, and we have to find a middle ground.

So what are the concrete problems caused by singletons? Why should we avoid them? I lean on three reasons:

1.  Singletons are global, mutable, shared state. Their state is automatically shared across the whole app, so when that state changes unexpectedly, bugs start to appear.
2.  The relationships between singletons — and between singletons and the code that depends on them — tend to be poorly defined. Because singletons are so convenient and so easy to reach, heavy use of them often leads to hard-to-maintain [spaghetti code](https://en.wikipedia.org/wiki/Spaghetti_code), with no clear separation between objects.
3.  Managing a singleton's lifecycle is very hard. Because the singleton lives for the entire lifetime of the app, controlling it becomes painful, and you often end up leaning on optionals to track value changes. That also makes code that depends on singletons hard to test, because you can't reset the state between test cases.

In our earlier **ProfileViewController** example, all three problems are already showing. First, the dependency on `UserManager` makes the relationship between the two unclear. Second, `currentUser` has to be an optional, because there's no way at compile time to guarantee the data is actually there when the view controller appears. Smells like bugs incoming 😬!

### Dependency injection

Instead of having **ProfileViewController** reach for its dependencies through a singleton, we pass them in via its initializer. Here we pass the current `User` in as non-optional, and a **LogOutService** for the logout operation:

``` swift
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

The code is now clearer and easier to manage. It depends on its model in a type-safe way, and there's a clear API for the logout interaction. As a rule, refactoring various singletons and managers into well-separated services makes the relationships between an app's core objects much more obvious.

### Services

For example, let's take a closer look at how **LogOutService** is implemented. It uses dependency injection internally too, and exposes one clean, well-defined API that does one thing — log out.

``` swift
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

### Renovating

Migrating from a heavily singleton-driven setup to one that's fully on services, dependency injection, and local state is hard, and takes a lot of time. It can also be hard to justify the investment, and in some cases you may need a much larger refactor to pull it off.

Thankfully, we can use a similar technique to the one in [Testing Swift code that uses system singletons in 3 easy steps](https://www.swiftbysundell.com/posts/testing-swift-code-that-uses-system-singletons-in-3-easy-steps), which lets us start chipping away at singletons in a much lighter way. Like a lot of other answers — protocols to the rescue.

Rather than refactoring every singleton at once into a freshly written service class, we can just define our services as protocols, like so:

``` swift
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

Then we make the existing singletons conform to the new service protocols, "renovating" them into a pile of services. In many cases we don't even need to change the implementation — we just pass their `shared` instance around as a service.

The same trick can be applied to other core objects in our app that we may currently be using as singletons in some form — for example, leaning on `AppDelegate` for navigation.

``` swift
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

By using dependency injection plus services, our project starts moving toward a Singleton-free state — without a huge rewrite. From there, we can replace singletons one at a time with proper services or other API styles, using techniques like the one in [this post](https://www.swiftbysundell.com/posts/replacing-legacy-code-using-swift-protocols).

### Conclusion

Singletons aren't all bad — but in many cases they cause a chain of problems that can be solved by using dependency injection to build clearer relationships between the objects in your program.

If your current app leans heavily on singletons, you're probably already living with — or have already lived through — the bugs they bring. Hopefully this post gives you a little inspiration to start backing away from them without panicking.
