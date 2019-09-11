---
title: 处理 Swift 中非可选的可选值类型
date: 2017-11-14 21:53:52
categories: ["Translation"]
tags: ["iOS","Swift","Optional"]
---

> 原文：[Handling non-optional optionals in Swift](https://www.swiftbysundell.com/articles/handling-non-optional-optionals-in-swift/)
> 原作者 & Copyright [@johnsundell](https://twitter.com/johnsundell)


可选值（optionals）无可争议的是 `swift` 语言中最重要的特性之一，也是和其他语言，例如 `Objective-C` 的最大区别。通过强制处理那些有可能出现 `nil` 的地方，我们就能写出更有预测性的以及更健壮的代码。

然而，有些时候可选值可能会致你于尴尬的境地，尤其是你作为开发者了解（甚至是有些猜测的成分在），有的特定变量始终是非空（non-nil）的，即使它是一个可选类型。例如，我们在一个视图控制器中处理视图的时候：

<!-- more -->


``` Swift
class TableViewController: UIViewController {
    var tableView: UITableView?

    override func viewDidLoad() {
        super.viewDidLoad()
        tableView = UITableView(frame: view.bounds)
        view.addSubview(tableView!)
    }

    func viewModelDidUpdate(_ viewModel: ViewModel) {
        tableView?.reloadData()
    }
}
```


这也是对于很多 Swift 程序员争论比较激烈的地方，程度不亚于讨论 tabs 和 spaces 的用法。有的人会说：

> 既然它是一个可选值，你就应该时刻使用 `if let` 或者 `guard let` 的方式进行解包。

然而另外一些人则采用完全相反，说：

> 既然你知道这个变量在使用的时候不会为 `nil`，使用 `!` 强制解包多好。崩溃也要比让你的程序处于一个未知状态要好吧。

本质上来讲，我们这里讨论的是要不要采用防御性编程（[defensive programming](https://en.wikipedia.org/wiki/Defensive_programming)）的问题。我们是试图让程序从一个未知状态恢复还是简单的放弃，然后让它崩溃掉？

如果非得让我对这个问题给出一个答案的话，我更倾向于后者。未知状态真的很难追踪 bug，会导致执行很多不想执行的逻辑，采用防御性编程就会使得你的代码很难追踪，出现问题很难追踪。

但是，我不太喜欢给出一个二选一的答案。相反，我们可以寻找一些技术手法，用更精妙的方式的解决上面提到的问题。


## 它真的可选的吗？

那些可选类型的，但是被代码逻辑真实需要的变量和属性，实际上是架构瑕疵的一个体现。如果在某些地方确实需要它，但是它又不在，就会使得你的代码逻辑处于未知状态，那么它就不应该是可选类型的。

当然，在某些特定场景下，可选值确实很难避免（尤其是和特定的系统 API 交互的时候），那对于大部分这种情况，我们有一些技术来处理从而避免可选值。

### lazy 要比非可选的可选值更好

某些属性的值需要在其父类创建之后再生成（比如视图控制器中的那些视图，应该在 `loadView()`或者 `viewDidLoad()`方法中被创建），对于这种属性要避免其可选类型的方法就是使用 `lazy` 属性。一个`lazy`属性是可以是非可选类型的，同时也不在其父类的初始化方法里被需要，它会在其第一次被获取的时候创建出来。

让我们改一下上面的代码，使用 lazy 来改造 tableView 属性：


``` Swift
class TableViewController: UIViewController {
    lazy var tableView = UITableView()

    override func viewDidLoad() {
        super.viewDidLoad()
        tableView.frame = view.bounds
        view.addSubview(tableView)
    }

    func viewModelDidUpdate(_ viewModel: ViewModel) {
        tableView.reloadData()
    }
}
```

这样，没有可选值了，也不会有未知状态咯🎉


### 适当的依赖管理要比非可选的可选值要好

可选值类型另外一种常用的场景就是用来打破循环依赖（[circular dependencies](https://en.wikipedia.org/wiki/Circular_dependency)）。有的时候，你就陷入 A 依赖 B，B 又依赖 A 的情况，如下：


``` Swift
class UserManager {
    private weak var commentManager: CommentManager?

    func userDidPostComment(_ comment: Comment) {
        user.totalNumberOfComments += 1
    }

    func logOutCurrentUser() {
        user.logOut()
        commentManager?.clearCache()
    }
}

class CommentManager {
    private weak var userManager: UserManager?

    func composer(_ composer: CommentComposer
                  didPostComment comment: Comment) {
        userManager?.userDidPostComment(comment)
        handle(comment)
    }

    func clearCache() {
        cache.clear()
    }
}
```

从上面的代码，我们可以看到，`UserManager` 和 `CommentManager` 之间有一个循环依赖的问题，它们二者都没法假设自己拥有对方，但是它们都在各自的代码逻辑里依赖彼此。这里就很容易产生 bug。

那要解决上面的问题，我们创建一个 `CommentComposer` 来做一个协调者，负责通知`UserManager` 和 `CommentManager`二人一个评论产生了。


``` Swift
class CommentComposer {
    private let commentManager: CommentManager
    private let userManager: UserManager
    private lazy var textView = UITextView()

    init(commentManager: CommentManager,
         userManager: UserManager) {
        self.commentManager = commentManager
        self.userManager = userManager
    }

    func postComment() {
        let comment = Comment(text: textView.text)
        commentManager.handle(comment)
        userManager.userDidPostComment(comment)
    }
}
```


通过这种形式，UserManager 可以强持有 CommentManager 也不产生任何依赖循环。


``` Swift
class UserManager {
    private let commentManager: CommentManager

    init(commentManager: CommentManager) {
        self.commentManager = commentManager
    }

    func userDidPostComment(_ comment: Comment) {
        user.totalNumberOfComments += 1
    }
}
```

我们又一次的移除了所有的可选类型，代码也更好预测了🎉。


### 优雅的崩溃（Crashing gracefully）

通过上面几个例子，我们通过对代码做一些调整，移除了可选类型从而排除了不确定性。然而，有的时候，移除可选类型是不可能的。让我们举个例子，比如你在加载一个本地的包含针对你 App 的配置项的 JSON 文件，这个操作本身一定会存在失败的情况，我们就需要添加错误处理。

继续上面这个场景，加载配置文件失败的时候继续执行代码就会使得你的 app 进入一个未知状态，在这种情况下，最好的方式让它崩溃。这样，我们会得到一个崩溃日志，希望这个问题能够在用户感知之前早早的被我们的测试人员以及 QA 处理掉。

所以，我们如何崩溃。。。最简单的方式就是添加 `!` 操作符，针对这个可选值强制解包，就会在其是 nil 的时候发生崩溃：

``` Swift
let configuration = loadConfiguration()!
```

虽然这个方法比较简单，但是它有个比较大的问题，就是一旦这段代码崩溃，我们能得到的只有一个错误信息：

> fatal error: unexpectedly found nil while unwrapping an Optional value


这个错误信息并不告诉我们为什么发生这个错误，在哪里发生的，给不了我们什么线索来解决它。这个时候，我们可以使用 guard 关键字，结合 `preconditionFailure()` 函数，在程序退出的时候给出定制消息。

``` Swift
guard let configuration = loadConfiguration() else {
    preconditionFailure("Configuration couldn't be loaded. " +
                        "Verify that Config.JSON is valid.")
}
```

上面这段代码发生崩溃的时候，我们就能获得更多更有效的错误信息：

> fatal error: Configuration couldn’t be loaded. Verify that Config.JSON is valid.: file /Users/John/AmazingApp/Sources/AppDelegate.swift, line 17


这样，我们现在有了一个更清晰的解决问题的办法，能够准确的知道这个问题在我们代码里的哪个未知发生的。

### 引入 Require 库

使用上面的 guard-let-preconditionFailure 的方案还是有一些冗长，确实让我们呃代码更难驾驭。我们也确实不希望在我们的代码里占很多篇幅去些这种代码，我们想更专注于我们的代码逻辑上。

我的解决方案就是使用 `Require`。它只是简单的在可选值添加简单的 `require()` 方法，但能够使得调用的地方更简洁。用这种方法来处理上面加载 `JSON` 文件的代码就可以这样写：

``` Swift
let configuration = loadConfiguration().require(hint: "Verify that Config.JSON is valid")
```

当出现异常的时候，会给出下面的错误信息：


> fatal error: Required value was nil. Debugging hint: Verify that Config.JSON is valid: file /Users/John/AmazingApp/Sources/AppDelegate.swift, line 17

`Require` 的另一个优势就是它和调用 `preconditionFailure()` 方法一样也会抛异常 `NSException`，就能使得那些异常上报工具能够捕获异常发生时候的元数据。

你如果想在自己代码中使用的话，[Require 现在在 Github 上开源了](https://github.com/JohnSundell/Require.git)


## 总结

所以，总结来看，在 `Swift` 语言里处理那些非可选的可选值，我有几点自己的贴心小提示给大家：

1. `lazy` 属性要比非可选的可选值要更好
2. 适当的依赖管理要比非可选的可选值要好
3. 当你使用非可选的可选值的时候，优雅的崩溃

如果有任何问题、建议或者反馈，都欢迎随时在 [Twitter](https://twitter.com/johnsundell) 上联系我，我非常乐意听到你们希望我在接下来的文章里谈论哪些主题哦。

谢谢阅读。


