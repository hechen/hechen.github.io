---
title: '@autoclosure && @escape'
slug: 'autoclosure-escape'
date: 2017-11-12T20:01:54+00:00
draft: false
categories: ['ios', 'swift', 'translation']
tags: ['animation', 'category', 'ios', 'notification', 'objective-c', 'push', 'runtime', 'swift']
---

Closures are first-class citizens in Swift, which means you can pass them around as arguments. While learning Swift, you keep running into keywords that decorate these closure parameters — `@autoclosure` and `@escape` being two of the most common.

### @escape and @nonescape

When a closure is passed as an argument to a function but only gets executed after that function has already returned, we say the closure escapes the function. The `@escape` keyword marks that the closure is allowed to be called after the function returns.

Here's the example from the official Swift docs:

``` swift
var completionHandlers: [() -> Void] = []

func someFunctionWithEscapingClosure(completionHandler: @escaping () -> Void) {
    completionHandlers.append(completionHandler)
}
```

The argument to `someFunctionWithEscapingClosure(_:)` is a closure, and inside the function we stash that closure into an array so we can call it later. Notice the `@escaping` keyword on the parameter declaration — without it the compiler will yell at you:

``` bash
error: passing non-escaping parameter 'completionHandler' to function expecting an @escaping closure
    completionHandlers.append(completionHandler)    
```

One consequence of `@escaping` is that you must refer to `self` explicitly inside the closure. The docs include another example to illustrate:

``` swift
func someFunctionWithNonescapingClosure(closure: () -> Void) {
    closure()
}
 
class SomeClass {
    var x = 10
    func doSomething() {
        someFunctionWithEscapingClosure { self.x = 100 }
        someFunctionWithNonescapingClosure { x = 200 }
    }
}
 
let instance = SomeClass()
instance.doSomething()
print(instance.x)
// Prints "200"
 
completionHandlers.first?()
print(instance.x)
// Prints "100”
```

`someFunctionWithEscapingClosure(_:)` is an escaping closure, so you have to reference `self` explicitly. `someFunctionWithNonescapingClosure(_:)` is non-escaping, so you can leave `self` implicit.

### @autoclosure

#### Walking through an example

Let's see what `@autoclosure` actually does with a small example.

Consider this function `f`, which takes a single argument of type `() -> Bool`:

``` swift
func f(predicate: () -> Bool) {
    if predicate() {
        print("It's true")
    }
}
```

You can call it by passing a closure of the right type:

``` swift
f(predicate: {2 > 1})
// "It's true"
```

But if you drop the `{` and `}` around the closure, it won't compile:

``` swift
f(predicate: 2 > 1)
// error: '>' produces 'Bool', not the expected contextual result type '() -> Bool'
```

As the docs put it: an autoclosure is a closure that gets wrapped around an expression you pass as an argument to a function. The closure takes no arguments, and when it's called it returns the value of the expression it wraps. Swift offers this syntactic sugar so you can drop the `{}` and just write the expression directly.

Going back to the example: if you write something like `2 > 1` and pass it to `f`, the expression is automatically wrapped, becoming `{ 2 > 1 }` before being handed to `f`.

``` swift
func f(predicate: @autoclosure () -> Bool) {
    if predicate() {
        print("It's true")
    }
}

f(predicate: 2 > 1)
// It's true
```

⚠️ `@autoclosure` doesn't support parameters that take inputs — only `() -> T` signatures can be simplified this way.

#### Delay evaluation

Swift's `??` operator looks like this:

``` swift
let nickName: String? = nil
let fullName: String = "John Appleseed"
let informalGreeting = "Hi \(nickName ?? fullName)
```

If the Optional has a value, return it; otherwise return the default value on the right-hand side. If you look at the actual implementation of `??`, you'll see:

``` swift
func ??<T>(optional: T?, defaultValue: @autoclosure () -> T?) -> T?

func ??<T>(optional: T?, defaultValue: @autoclosure () -> T) -> T
```

So `??` is a binary operator — `optional` is the left-hand side and `defaultValue` is the right-hand side. You might wonder: in our example above, `fullName` is just a `String`, so how does it become `() -> T`? That's `@autoclosure` doing its work. As we just covered, the keyword wraps the expression into a closure that returns the expression's value. What actually gets passed as the second argument is `{ fullName }`.

So we can guess the implementation looks roughly like this (since `fullName` is `String`, the second overload is the one selected):

``` swift
func ??<T>(optional: T?, defaultValue: @autoclosure () -> T) -> T {
    switch optional {
        case .Some(let value):
            return value
        case .None:
            return defaultValue()
        }
}
```

One more thing worth noting: an expression decorated with `@autoclosure` evaluates lazily. That is, the expression inside the closure isn't evaluated until the closure is actually called, which avoids unnecessary work — especially valuable when the default value is the result of an expensive computation.
