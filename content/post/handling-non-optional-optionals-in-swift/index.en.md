---
title: 'Handling non-optional optionals in Swift'
slug: 'handling-non-optional-optionals-in-swift'
date: 2017-11-14T21:53:52+00:00
draft: false
categories: ['ios', 'swift', 'translation']
tags: ['animation', 'closure', 'ios', 'notification', 'objective-c', 'optional', 'runtime', 'swift']
---

> Original: [Handling non-optional optionals in Swift](https://www.swiftbysundell.com/articles/handling-non-optional-optionals-in-swift/)
> Original author & copyright [@johnsundell](https://twitter.com/johnsundell)

Optionals are arguably one of the most important features of Swift, and one of the biggest things that sets it apart from languages like Objective-C. By forcing us to deal with the places where `nil` might show up, optionals push us to write more predictable, more robust code.

That said, optionals can occasionally put you in an awkward spot — especially when, as the developer, you know (or at least strongly suspect) that a particular variable is always non-nil, even though its type says otherwise. A classic example is dealing with views inside a view controller:

``` swift
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

This is one of those topics Swift developers argue about with about as much intensity as tabs vs. spaces. Some folks say:

> Since it's an optional, you should always unwrap it with `if let` or `guard let`.

Others take the exact opposite stance:

> Since you know the variable can't be nil where you use it, just force-unwrap with `!`. Crashing is better than letting your program limp along in an unknown state.

At its core, this is a debate about whether or not to do [defensive programming](https://en.wikipedia.org/wiki/Defensive_programming). Do we try to recover from an unknown state, or just give up and crash?

If I have to pick a side, I lean towards the latter. Unknown states are genuinely hard to debug — they let unwanted logic run, and defensive programming makes the code harder to follow and harder to trace when things go wrong.

But I don't love framing this as a binary choice. Instead, there are a few techniques we can reach for that handle the problem more elegantly.

## Is it actually optional?

Variables and properties that are typed as optional but are *really* required by the logic are usually a sign of an architectural flaw. If your code can't continue without it, it shouldn't be optional in the first place.

Of course, in some situations optionals are genuinely unavoidable (especially when dealing with certain system APIs). For most of these cases, though, there are techniques we can use to sidestep the optional.

### `lazy` is better than a non-optional optional

Some properties need to be created after their parent is fully initialised (think of views in a view controller, which should be created in `loadView()` or `viewDidLoad()`). The way to avoid making those properties optional is to use `lazy`. A `lazy` property can be non-optional, doesn't need to be set in the initialiser, and gets created the first time it's accessed.

Let's rewrite the `tableView` property using `lazy`:

``` swift
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

No more optional, no more unknown state. 🎉

### Proper dependency management is better than a non-optional optional

Another common reason for reaching for optionals is to break a [circular dependency](https://en.wikipedia.org/wiki/Circular_dependency). Sometimes you end up in a situation where A depends on B and B depends on A, like this:

``` swift
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

`UserManager` and `CommentManager` have a circular dependency — neither one can assume it owns the other, but they both depend on each other in their own logic. That's a great recipe for bugs.

The fix is to introduce a `CommentComposer` that acts as a coordinator, notifying both `UserManager` and `CommentManager` when a new comment is posted.

``` swift
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

With this in place, `UserManager` can strongly hold `CommentManager` without producing any reference cycle:

``` swift
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

Once again, we've removed all the optionals and the code is more predictable. 🎉

### Crashing gracefully

In the examples above we restructured the code to remove the optional and the uncertainty along with it. Sometimes, though, removing the optional isn't possible. Imagine you're loading a local JSON file that contains configuration for your app — that operation can absolutely fail, so we need to handle the error.

Continuing on this scenario: if loading the configuration file fails and we keep going anyway, the app ends up in an unknown state. In that case, the best thing to do is crash. We get a crash report, and hopefully the issue gets caught by QA before it ever reaches our users.

So, how do we crash? The simplest way is to slap a `!` on the optional and let it crash if the value is nil:

``` swift
let configuration = loadConfiguration()!
```

It's simple, but it has a big downside: when it crashes, all we get is:

> fatal error: unexpectedly found nil while unwrapping an Optional value

That tells us nothing about *why* this happened or *where*, and gives us no clue how to fix it. A better approach is to combine a `guard` with `preconditionFailure()`, so we can supply a custom message when the program bails out:

``` swift
guard let configuration = loadConfiguration() else {
    preconditionFailure("Configuration couldn't be loaded. " +
                        "Verify that Config.JSON is valid.")
}
```

When this code crashes we get something a lot more useful:

> fatal error: Configuration couldn't be loaded. Verify that Config.JSON is valid.: file /Users/John/AmazingApp/Sources/AppDelegate.swift, line 17

Now we have a much clearer trail — we know exactly where the problem happened in our code.

### Introducing Require

The guard-let-preconditionFailure pattern is a bit verbose, and it does add visual noise to the codebase. We don't really want to spend lots of lines doing this kind of plumbing — we want to focus on the actual logic.

My solution is `Require`. It just adds a simple `require()` method on optionals, so the call site stays concise. The configuration-loading example becomes:

``` swift
let configuration = loadConfiguration().require(hint: "Verify that Config.JSON is valid")
```

If it fails, you get:

> fatal error: Required value was nil. Debugging hint: Verify that Config.JSON is valid: file /Users/John/AmazingApp/Sources/AppDelegate.swift, line 17

Another nice property of `Require` is that, like `preconditionFailure()`, it raises an `NSException` — which means crash-reporting tools can capture the metadata at the point of failure.

If you want to use it in your own code, [Require is now open source on GitHub](https://github.com/JohnSundell/Require.git).

## Wrapping up

So, to recap, here are a few personal tips for dealing with non-optional optionals in Swift:

1.  `lazy` properties are better than non-optional optionals
2.  Proper dependency management is better than non-optional optionals
3.  When you do have to live with a non-optional optional, crash gracefully

If you have any questions, suggestions, or feedback, feel free to reach out on [Twitter](https://twitter.com/johnsundell) — I'd love to hear what topics you want to see covered next.

Thanks for reading.
