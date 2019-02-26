---
title: Swift 中几种不同的依赖注入方式
date: 2018-07-16 13:57:24
categories: ["Translation"]
tags: ["iOS","XCode","Swift"]
---


> 原文：[Modular Xcode projects](https://ppinera.es/2017/09/29/modular-xcode-projects.html)
> 原作者 & Copyright [@pepibumur](http://twitter.com/pepibumur)
> 翻译：[@OgreMergO](https://twitter.com/OgreMergO)


在之前的几篇博客中，我们已经了解了几种使用依赖注入方式使得某个 swift app 拥有一个更加解耦可测试的架构。比如在 [在 Swift 中使用工厂模式进行依赖注入](https://hechen.xyz/2017/11/19/Dependency-injection-using-factories-in-Swift/) 中和工厂模式结合，以及在[避免在 Swift 中使用单例](http://hechen.xyz/2018/07/16/Avoiding-singletons-in-Swift/)中替换程序中的单例对象等方式进行依赖注入。

到目前为止，大部分我的博文以及例子中都使用了基于初始化的依赖注入方式。然而，就像大部分的编程技巧一样，还有很多 “口味” 的进行依赖注入的方式 ── 每一种都有其优缺点。 这周，让我们来看看其中三种方式以及如何在 Swift 中使用它们。

### 基于初始化方法

让我们快速回顾一下用的最为广泛的依赖注入方式 ── initializer-based。这个想法是在某个类被初始化的时候传入其所需的依赖的方式。这种形式最大的好处就是，它保证了能够立即满足该类完成其功能所需要的所有东西。

让我们建一个类 ── FileLoader 来从磁盘加载文件。为了实现该 Loader 的功能，需要两个依赖项，系统所提供的实例对象 ── **FileManager** 和 **Cache**。使用基于初始化的依赖注入的执行代码如下所示：


``` Swift

class FileLoader {
    private let fileManager: FileManager
    private let cache: Cache

    init(fileManager: FileManager = .default,
         cache: Cache = .init()) {
        self.fileManager = fileManager
        self.cache = cache
    }
}

```

可以关注下初始化方法里默认参数的设置，其可以避免每次都需要自行创建的问题。这样能够简化我们在生产环境下使用 **FileLoader** 类创建文件加载器的工作，而且也能够能够传入 mock 数据或者我们的测试代码中的创建的实例进行测试。


### 基于属性

虽然前一种基于初始化的依赖注入形式常常给我们自定义类带来很多好处，但是有时候，当你不得不继承自某个系统类的时候会遇到一些困难。其中一个例子就是，当我们构建 view controller，尤其是你在使用 XIB 以及 Storyboard 类定义它们的时候，因为此时你不再能够掌控它们的初始化方法了。

对于这些情况，基于属性的依赖注入方式是一个更好的选择。相对于初始化的时候进行对象的依赖项注入，基于属性的形式可以在之后通过简单的赋值来做到，其能够让你减少模板代码的书写，尤其是在你确实没有必要进行注入的时候能够有更好的默认实现。

让我们再来看一个例子，在这个例子中，我们在构建一个 **PhotoEditorViewController** ，这个视图控制器使得用户编辑它们照片库中的图片。为了达到这个功能，该视图控制器需要用到系统提供的 PHPhotoLibrary 类型的一个实例（该类本身是一个单例）以及我们自己实现的类 **PhotoEditorEngine** 的一个实例。那为了不通过自定义初始化方法进行依赖注入的话，我们可以创建一些具有默认值的可变属性，例如下面这样：


``` Swift

class PhotoEditorViewController: UIViewController {
    var library: PhotoLibrary = PHPhotoLibrary.shared()
    var engine = PhotoEditorEngine()
}

```

使用 [Testing Swift code that uses system singletons in 3 easy steps](https://www.swiftbysundell.com/posts/testing-swift-code-that-uses-system-singletons-in-3-easy-steps) 这篇文章中的手法，通过使用一个协议提供一个更为抽象的 **PhotoLibrary** 接口来获取系统的图片库。这样会使得测试和 Mock 数据特别的容易。

上面这些工作比较好的是我们依然能够通过简单的给视图控制器来赋值，从而在我们的测试中简单的注入 Mock 代码：


``` Swift

class PhotoEditorViewControllerTests: XCTestCase {
    func testApplyingBlackAndWhiteFilter() {
        let viewController = PhotoEditorViewController()

        // Assign a mock photo library to gain complete control over
        // what photos are stored in it
        let library = PhotoLibraryMock()
        library.photos = [TestPhotoFactory.photoWithColor(.red)]
        viewController.library = library

        // Run our testing commands
        viewController.selectPhoto(atIndex: 0)
        viewController.apply(filter: .blackAndWhite)
        viewController.savePhoto()

        // Assert that the outcome is correct
        XCTAssertTrue(photoIsBlackAndWhite(library.photos[0]))
    }   
}

```

### 基于参数

最后一种，让我们来看下基于参数的依赖注入形式。这种方式尤其在你想让旧有代码更加可测试，而不需要对现存的结构进行更多改动的时候尤其有效。

许多时候，我们仅需要某个特定的依赖项一次，或者我们仅仅需要在某些特定条件下进行 mock。不需要改变某个对象的初始化方法或者暴露可变属性（通常都不是一个好主意），我们可以开发出一个接受一个依赖项作为参数的特定 API。

让我们看一个 **NoteManager** 类，该类是某个笔记类应用的一部分。它的工作就是管理所有用户已经书写的笔记，提供一个 API 让用户能够查询笔记。考虑到这个操作可能耗时（如果用户有许多笔记，通常情况下是这样），我们把该动作正常放置于一个后台线程执行，如下：

``` Swift

class NoteManager {
    func loadNotes(matching query: String,
                   completionHandler: @escaping ([Note]) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async {
            let database = self.loadDatabase()
            let notes = database.filter { note in
                return note.matches(query: query)
            }

            completionHandler(notes)
        }
    }
}

```

尽管上面的代码在我们的生产环境里也算是一个很好的解决方案，但在测试中我们正常情况下是想避免一些异步代码的，尽可能的平行化以避免 [flakiness](https://www.swiftbysundell.com/posts/reducing-flakiness-in-swift-tests). 如果要类似于基于初始化或者基于属性的依赖注入能够指定一个显式的队列提供给 NoteManager 来用的方式，需要对该类进行很多改变，这是我们在当下无法做或者不愿意做的。

这时候，基于参数的依赖注入方式的实现就能够达到。相对于不得不对整个类进行重构，我们通过插入队列相关代码使得 `loadNotes` 方法在该队列上执行：


``` Swift

class NoteManager {
    func loadNotes(matching query: String,
                   on queue: DispatchQueue = .global(qos: .userInitiated),
                   completionHandler: @escaping ([Note]) -> Void) {
        queue.async {
            let database = self.loadDatabase()
            let notes = database.filter { note in
                return note.matches(query: query)
            }

            completionHandler(notes)
        }
    }
}

```

这样就使得我们能够很容易的在测试代码中使用某个定制的我们可等待的队列。这样也几乎使得我们把上面的接口转变成了一个同步接口，使得一切变得更加容易和可预测。

另外一个基于参数的依赖注入的使用案例是当你想测试某个静态的 API 的时候。因为静态的 API 我们是不存在初始化方法的，同时我们理想情况下也是不应该维护任何静态的状态的，那基于参数的依赖注入方式就是一个很好的选择。让我们看一个静态的类 **MessageSender**， 该类当前依赖某个单例：


``` Swift

class MessageSender {
    static func send(_ message: Message, to user: User) throws {
        Database.shared.insert(message)

        let data: Data = try wrap(message)
        let endpoint = Endpoint.sendMessage(to: user)
        NetworkManager.shared.post(data, to: endpoint.url)
    }
}

```

当然，一个长远的解决方案更可能是重构 **MessageSender** 这个类，让它变成一个非静态的，能够在其所有被使用的地方被正确的注入依赖。但是基于我们能够更容易的测试它（比如，重现或者验证某个 Bug），我们能简单的使用参数作为依赖项进行注入，而不是基于某个单例：



``` Swift

class MessageSender {
    static func send(_ message: Message,
                     to user: User,
                     database: Database = .shared,
                     networkManager: NetworkManager = .shared) throws {
        database.insert(message)

        let data: Data = try wrap(message)
        let endpoint = Endpoint.sendMessage(to: user)
        networkManager.post(data, to: endpoint.url)
    }
}

```

我们又再次使用了缺省的参数，不仅仅更加方便而已，更重要的是，能够在 100% 向后兼容的情况下为我们的代码增加测试支持。


## 结论

所以，哪一种依赖注入的方案是最好的呢？就像大部分时候一样，我的答案很无聊的： 看情况！我在该博客中所视图去做的一件事情就是针对某个特定问题给出需要不同的解决方案。原因很简单，我真的不相信又所谓银弹的存在。我认为，按照我们意愿具备多个工具或者对于特定技巧的多种解决方案能够使我们变得更好，在写代码的时候也能够游刃有余。
