---
title: '@autoclosure && @escape'
date: 2017-11-12 20:01:54
categories: ["Swift"]
tags: ["iOS","Swift"]
---

我们知道在 `swift` 中，闭包（closure）是一等公民，因此可以被当作参数传递，在学习 swift 的过程中经常会看到某些关键字修饰该闭包，`@autoclosure`， `@escape` 就是其中比较常见的两种关键字。


### @escape 和 @nonescape

当一个闭包被当作参数传递给一个函数，但是当该函数内容执行完毕返回之后，该闭包才会被执行，我们就称该闭包要 escape 某个函数，那 `@escape` 关键字就是用来表示该闭包是允许在函数返回之后被调用的。

我们用 swift 官方文档的例子来看，如下所示

``` Swift
var completionHandlers: [() -> Void] = []

func someFunctionWithEscapingClosure(completionHandler: @escaping () -> Void) {
    completionHandlers.append(completionHandler)
}
```

`someFunctionWithEscapingClosure(_:)` 的参数是一个闭包，函数内部会把传入的闭包存到之前声明的数组里以便之后进行调用，可以看到，在函数参数的声明部分添加了 `@escaping` 关键字，如果这里不添加的话，就会在编译的时候报错：

``` sh
error: passing non-escaping parameter 'completionHandler' to function expecting an @escaping closure
    completionHandlers.append(completionHandler)    
```

针对标记了 @escaping 关键字含义代表你必须在该闭包内部显式的使用 self 关键字，官方文档中又列举了另外一个例子，如下所示：

``` Swift
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

`someFunctionWithEscapingClosure(_:)` 是一个可逃逸的闭包，意味着你需要显示的调用 self 关键字， 而 `someFunctionWithNonescapingClosure(_:)` 是非逃逸的闭包，意味着你可以隐式的调用 self。


### @autoclosure


#### 例子讲解

通过一个🌰来说明 `@autoclosure` 关键字到底起到什么作用。

考虑下面这个函数 f，其需传入一个参数，类型是 `()-> Bool` 的闭包。

``` Swift
func f(predicate: () -> Bool) {
    if predicate() {
        print("It's true")
    }
}
```

然后通过传入符合此类型的闭包进行调用

``` Swift
f(predicate: {2 > 1})
// "It's true"
```

但是，如果我们忽略传入闭包的 `{` 和 `}` ，编译就会错误。

``` Swift
f(predicate: 2 > 1)
// error: '>' produces 'Bool', not the expected contextual result type '() -> Bool'
```

如文档中所说，一个 autoclosure (自主闭包？)是这样一种闭包: 当某个表达式被当做参数传递给一个函数的时候会被 wrap 成一个闭包，该闭包没有任何参数，其被调用的时候，返回的是其 wrap 的表达式的值。swift 提供这种语法糖就能够让你省略 {} 而直接写一个表达式。

结合上面的例子来看，当你写个表达式类似 2 > 1 传给函数 f 的时候，该表达式会被自动包裹到一个闭包中，会自动处理为 { 2 > 1 } 而传递给函数 f。

``` Swift
func f(predicate: @autoclosure () -> Bool) {
    if predicate() {
        print("It's true")
    }
}

f(predicate: 2 > 1)
// It's true
```

⚠️ @autoclosure 并不支持带有输入参数的写法，也就是说只有形如 () -> T 的参数才能简化


#### Delay Evaluation

swift 提供了 ?? 操作符，如下所示：

``` Swift
let nickName: String? = nil
let fullName: String = "John Appleseed"
let informalGreeting = "Hi \(nickName ?? fullName)
```

如果某 Optional 存在就会返回其值，如果没有就会返回后面的默认值，当我们去看 ?? 的实现的时候能看到如下定义：

``` Swift
func ??<T>(optional: T?, defaultValue: @autoclosure () -> T?) -> T?

func ??<T>(optional: T?, defaultValue: @autoclosure () -> T) -> T
```

看得出来 `??` 是一个二元操作符，optional 指代 ?? 前面的输入，defaultValue 指代 `??` 后面的参数，那我们就会想，我们上面的例子中 `fullName` 只是一个 `String`，怎么变成 `() -> T` 类型的呢？ 这个就看前面的 `@autoclosure` 的威力了，前面讲过了，该关键字把表达式的值封装成闭包并且返回该表达式的值了。 其实传入该方法的第二个参数是 `{ fullName }`。

所以可以想到该方法的实现应该如下所示，（当然 fullName 为 String 类型，应该会重载第二个函数实现）


``` Swift
func ??<T>(optional: T?, defaultValue: @autoclosure () -> T) -> T {
    switch optional {
        case .Some(let value):
            return value
        case .None:
            return defaultValue()
        }
}

```

这里我们还需要注意一点的是，使用 `@autoclosure ` 来修饰的表达式可以实现延迟计算，也就是说直到该闭包被调用之前，闭包里所被包裹的表达式都不会进行取值计算，也就避免了一定的开销，尤其是上面默认值是复杂计算得到的话。


