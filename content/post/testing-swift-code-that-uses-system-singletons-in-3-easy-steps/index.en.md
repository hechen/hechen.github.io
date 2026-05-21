---
title: 'Testing Swift code that uses system singletons in 3 easy steps'
slug: 'testing-swift-code-that-uses-system-singletons-in-3-easy-steps'
date: 2018-07-17T17:09:57+00:00
draft: false
categories: ['translation']
tags: ['carthage', 'closure', 'cocoapods', 'ios', 'optional', 'singleton', 'swift', 'xcode']
---

> Original: [Testing Swift code that uses system singletons in 3 easy steps](https://www.swiftbysundell.com/articles/testing-swift-code-that-uses-system-singletons-in-3-easy-steps/)
>
> Original author [@johnsundell](https://twitter.com/johnsundell)

Most apps built on Apple platforms lean on singleton-based APIs. From UIScreen to UIApplication to NSBundle — Foundation, UIKit, and AppKit are full of static APIs.

Singletons are super convenient and let you grab a particular API from anywhere at any time, but they get tricky the moment you try to decouple your code or write tests for it. They're also one of the most common sources of bugs out there: state ends up shared, and changes made in one place don't always propagate cleanly across the rest of the system.

That said, while we can refactor our own code to use singletons only where we really need to, there's not much we can do about the system APIs themselves. The good news is that there are a few techniques that keep code that uses system singletons easy to manage and easy to test.

Here's some code that uses the `URLSession.shared` singleton:

``` swift
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

This `DataLoader` is now hard to test, because it reaches out to the shared URL session on its own and fires off a real network call. To test it, you have to add waits and timeouts — and that kind of code quickly turns flaky and unpleasant to maintain.

## Abstract it into a protocol

Our first job is to pull the bit of URLSession we actually need out into a protocol, so we can easily mock it in tests. In one of [his talks](http://www.ustream.tv/recorded/101118612), the author argues for avoiding mocks where you can — and that's a good rule of thumb. But when you're dealing with system singletons, mocking is an important tool for adding predictability.

Let's create a `NetworkEngine` protocol and make URLSession conform to it:

``` swift
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

Notice how we've made `URLSessionDataTask` an implementation detail of `URLSession`. That way, we don't have to create different mocks in our tests — we only have to worry about `NetworkEngine`.

## Use the singleton as the default value in the protocol

Now let's update `DataLoader` to use the new `NetworkEngine` protocol, injected as a dependency. We pass `URLSession.shared` as the default, which keeps backwards compatibility and is just as convenient to use as before.

``` swift
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

Thanks to the default parameter, we can still create a `DataLoader` the way we used to — no need to supply a `NetworkEngine` ourselves.

## Mock the protocol in your tests

Finally, let's write a test where we mock `NetworkEngine` to make the test fast, predictable, and easy to maintain.

``` swift
func testLoadingData() {
    class NetworkEngineMock: NetworkEngine {
        typealias Handler = NetworkEngine.Handler 

        var requestedURL: URL?

        func performRequest(for url: URL, completionHandler: @escaping Handler) {
            requestedURL = url

            let data = "Hello world".data(using: .utf8)
            completionHandler(data, nil, nil)
        }
    }

    let engine = NetworkEngineMock()
    let loader = DataLoader(engine: engine)

    var result: DataLoader.Result?
    let url = URL(string: "my/API")!
    loader.load(from: url) { result = $0 }

    XCTAssertEqual(engine.requestedURL, url)
    XCTAssertEqual(result, .data("Hello world".data(using: .utf8)!))
}
```

The author keeps the mock as simple as possible. Rather than building a complex mock with lots of logic, it's usually a good idea to have your mock return hard-coded values you can assert against in your tests. The risk, of course, is that you end up testing the mock rather than your production code.

## Wrapping up

So now we have system-singleton-based code that's still convenient *and* testable, in three steps:

1.  Abstract into a protocol
2.  Use the singleton as the default value in the protocol
3.  Mock the protocol in your tests
