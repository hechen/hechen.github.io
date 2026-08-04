---
title: 'Different flavors of dependency injection in Swift'
slug: 'different-flavors-of-dependency-injection-in-swift'
date: 2018-07-16T13:57:24+00:00
draft: false
categories: ['translation']
tags: ['animation', 'carthage', 'closure', 'cocoapods', 'compiler', 'ios', 'ir', 'llvm', 'objective-c', 'optional', 'swift', 'xcode']
---

> Original: [Different flavors of dependency injection in Swift](https://www.swiftbysundell.com/articles/different-flavors-of-dependency-injection-in-swift/)
>
> Original author & copyright: [@johnsundell](https://twitter.com/johnsundell)

In previous posts we've looked at several ways of using dependency injection to give a Swift app a more decoupled, testable architecture — for instance, pairing it with the factory pattern in [Dependency injection using factories in Swift](https://hechen.github.io/2017/11/19/Dependency-injection-using-factories-in-Swift/), or using it to replace singletons in [Avoiding singletons in Swift](https://hechen.github.io/2018/07/16/Avoiding-singletons-in-Swift/).

Up to this point, most of my posts and examples have used initializer-based dependency injection. But like most programming techniques, dependency injection comes in different *flavors* — each with its own pros and cons. This week, let's look at three of them and how to use them in Swift.

### Initializer-based

Let's start with a quick recap of the most widely used form of dependency injection — initializer-based. The idea is to pass a class's dependencies in when the instance is created. The big advantage is that it guarantees the instance has everything it needs to do its job from the moment it exists.

Say we build a `FileLoader` class that loads files from disk. To do its job, it needs two dependencies — `FileManager`, provided by the system, and a `Cache`. With initializer-based injection it looks like this:

``` swift
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

Note the default values on the initializer parameters — they keep us from having to construct each dependency by hand every time. That makes `FileLoader` easy to create in production code, while still letting us hand in mocks or test-specific instances from our tests.

### Property-based

Initializer-based injection is great for classes we own, but it gets awkward when you have to subclass a system class. A common example is view controllers — especially when you define them in a XIB or Storyboard, where you no longer fully control the initializer.

For those cases, property-based injection is a better fit. Instead of supplying dependencies at init time, you assign them afterwards. That cuts down on boilerplate, and you can give each property a sensible default for when no injection is actually necessary.

Let's look at another example. We're building a `PhotoEditorViewController` that lets the user edit photos from their library. To do its job, it needs an instance of the system-provided `PHPhotoLibrary` (itself a singleton) and an instance of our own `PhotoEditorEngine` class. Instead of writing a custom initializer to inject those, we expose mutable properties with default values:

``` swift
class PhotoEditorViewController: UIViewController {
    var library: PhotoLibrary = PHPhotoLibrary.shared()
    var engine = PhotoEditorEngine()
}
```

Using the approach from [Testing Swift code that uses system singletons in 3 easy steps](https://www.swiftbysundell.com/posts/testing-swift-code-that-uses-system-singletons-in-3-easy-steps), we hide the system photo library behind a more abstract `PhotoLibrary` protocol. That makes testing and mocking very easy.

The nice part is that we can still inject mocks just by assigning them to the view controller in our tests:

``` swift
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

### Parameter-based

Finally, let's look at parameter-based injection. This one is especially handy when you want to make existing code more testable without making major structural changes.

A lot of the time, we only need a particular dependency once, or only need to mock it under a specific condition. Rather than rewriting an object's initializer or exposing a mutable property (usually not a great idea), we can design a specific API that takes the dependency as a parameter.

Take a `NoteManager` class as part of a notes app. Its job is to manage all the notes a user has written, and to expose an API that lets them search those notes. Since search can be slow (if the user has lots of notes, it usually is), we run it on a background queue:

``` swift
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

That's fine in production, but in tests we usually want to avoid asynchrony — keeping things linear cuts down on [flakiness](https://www.swiftbysundell.com/posts/reducing-flakiness-in-swift-tests). Reworking `NoteManager` to support initializer- or property-based injection of an explicit queue would require a lot of changes we don't necessarily want to make right now.

This is where parameter-based injection shines. Instead of restructuring the whole class, we just plumb a queue parameter through `loadNotes`:

``` swift
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

Now in tests we can easily hand in a custom queue we can wait on. We've effectively turned the API into a synchronous one for testing purposes, which makes everything easier and more predictable.

Another good case for parameter-based injection is when you need to test a static API. Static APIs don't have an initializer, and ideally don't keep any static state, so parameter-based injection is a natural fit. Take a static `MessageSender` that currently depends on a singleton:

``` swift
class MessageSender {
    static func send(_ message: Message, to user: User) throws {
        Database.shared.insert(message)

        let data: Data = try wrap(message)
        let endpoint = Endpoint.sendMessage(to: user)
        NetworkManager.shared.post(data, to: endpoint.url)
    }
}
```

The proper long-term fix is to refactor `MessageSender` into something non-static where dependencies get injected wherever it's used. But to make the class easier to test today (say, to reproduce or verify a bug), we can just take the dependencies as parameters instead of relying on singletons:

``` swift
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

Default parameter values come to the rescue again — not just for convenience, but because they let us add test seams to existing code while staying 100% backward-compatible.

## Conclusion

So which flavor of dependency injection is best? As usual, the boring answer is: it depends. One thing I try to do on this blog is offer different solutions for different problems — because I genuinely don't believe there's a silver bullet. I think having more than one tool at your disposal, and more than one solution to any given technique, makes you a better engineer and gives you more freedom when writing code.
