---
title: 三个简单步骤让你测试使用系统单例的代码
date: 2018-07-17 17:09:57
categories: ["Translation"]
tags: ["iOS","Xcode","Swift","Singleton"]
---

> 原文：[Testing Swift code that uses system singletons in 3 easy steps](https://www.swiftbysundell.com/articles/testing-swift-code-that-uses-system-singletons-in-3-easy-steps/)
>
> 原作者 [@johnsundell](https://twitter.com/johnsundell)

大部分在 Apple 平台开发的 App 都会依赖基于单例的 API。从 UIScreen 到 UIApplication，再到 NSBundle，而 Foundation，UIKit 以及 AppKit 里到处充斥着静态的 API。

尽管单例非常方便，并且随时随地都可以很轻易的获取到特定的 API，但是当它们一旦要面临代码解耦和测试的时候就会出现挑战。单例同时也是平时遇到 Bug 里最常见的一种，在单例中状态会以共享的方式终结，那些针对状态做的变更并不能很好的广播到整个系统层面。

然而，尽管我们能够重构自己的代码，让它们只在真正需求的地方使用单例，我们针对系统 API 也做不了太多。但是，好消息是，这里有一些技巧让你使用系统单例的代码依然变得容易管理和测试。

让我们看一些使用了 URLSession.shared 单例的代码：


``` Swift

class DataLoader {
    enum Result {
        case data(Data)
        case error(Error)
    }

    func load(from url: URL, completionHandler: @escaping (Result) -> Void) {
        let task = URLSession.shared.dataTask(with: url) { (data, response, error) in
            if let error = error {
                return completionHandler(.error(error))
            }

            completionHandler(.data(data ?? Data()))
        }

        task.resume()
    }
}

```

上面这个 **DataLoader** 现在就变得很难测试，因为它内部会自主调用共享的 URL Session 来执行一个网络调用。这就需要我们为测试代码中增加一些等待和超时代码，然后很快这部分代码就会变得糟糕和不稳定。

## 抽象成一个协议

我们第一个任务就是把我们需要的 URLSession 的部分移到一个协议里，这样我们在测试中也能够很容易的进行 mock。在作者的[一次 talk](http://www.ustream.tv/recorded/101118612)中作者建议尽可能的避免 mock，尽管它是一种很好的策略。但是当你和系统的单例打交道的时候，mock 就是一个增加可预测性的重要工具。

让我们创建一个 **NetworkEngine** 协议，然后让 URLSession 符合它:

``` Swift

protocol NetworkEngine {
    typealias Handler = (Data?, URLResponse?, Error?) -> Void

    func performRequest(for url: URL, completionHandler: @escaping Handler)
}

extension URLSession: NetworkEngine {
    typealias Handler = NetworkEngine.Handler

    func performRequest(for url: URL, completionHandler: @escaping Handler) {
        let task = dataTask(with: url, completionHandler: completionHandler)
        task.resume()
    }
}

```

如上所见，我们使得 **URLSessionDataTask** 成了 **URLSession** 的一个实现细节。这样，我们就避免了在测试代码中不得不创建不同的 mock ，而只需要关注 NetworkEngine 就行。

## 协议中把单例作为默认值

现在，让我们更新我们的 **DataLoader** 来使用新的 NetworkEngine 协议，把它作为依赖项注入。我们把 URLSession.shared 作为默认参数传递，以此做到了向后兼容并且和之前一样方便。

``` Swift

class DataLoader {
    enum Result {
        case data(Data)
        case error(Error)
    }

    private let engine: NetworkEngine

    init(engine: NetworkEngine = URLSession.shared) {
        self.engine = engine
    }

    func load(from url: URL, completionHandler: @escaping (Result) -> Void) {
        engine.performRequest(for: url) { (data, response, error) in
            if let error = error {
                return completionHandler(.error(error))
            }

            completionHandler(.data(data ?? Data()))
        }
    }
}

```

通过使用默认参数，我们依然可以像之前一样很容易的生成 **DataLoader**，而不需要提供一个 **NetworkEngine**。

## 在你的测试中 Mock 协议

最后，让我们写个测试，在这里我们通过 mock **NetworkEngine** 使得我们的测试快速，可预测并且容易维护。

``` Swift

func testLoadingData() {
    class NetworkEngineMock: NetworkEngine {
        typealias Handler = NetworkEngine.Handler 

        var requestedURL: URL?

        func performRequest(for url: URL, completionHandler: @escaping Handler) {
            requestedURL = url

            let data = “Hello world”.data(using: .utf8)
            completionHandler(data, nil, nil)
        }
    }

    let engine = NetworkEngineMock()
    let loader = DataLoader(engine: engine)

    var result: DataLoader.Result?
    let url = URL(string: “my/API”)!
    loader.load(from: url) { result = $0 }

    XCTAssertEqual(engine.requestedURL, url)
    XCTAssertEqual(result, .data(“Hello world”.data(using: .utf8)!))
}

```

如上所见，作者试图让 mock 尽可能的简单。不需要创建包含大量逻辑的复杂 mock，你只需要让自己的代码返回一些 hardcode 的值通常是一个好主意，这样，你能够在自己的测试中进行断言。然而，风险就是你可能最后测试的是自己的 mock 而不是生产环境的代码。


## 最后

我们现在通过以下三个步骤让这些依然方便的使用了系统的单例可被测试：

1. 抽象协议
2. 协议中把单例作为默认值
3. 在你的测试中 Mock 该协议































