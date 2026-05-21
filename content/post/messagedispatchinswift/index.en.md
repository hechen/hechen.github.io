---
title: 'Method dispatch in Swift'
slug: 'messagedispatchinswift'
date: 2019-09-15T20:56:50+00:00
draft: false
categories: ['swift', 'translation']
tags: ['cocoapods', 'dispatch', 'inline', 'ios', 'module', 'protocol', 'pwt', 'singleton', 'swift', 'xcode']
---

![What is method dispatch](https://i.imgur.com/ggQZyRp.png)

# What is method dispatch?

Method dispatch is the process by which the program, at runtime, decides which concrete instruction to use when a particular method is called. Dispatch is happening constantly in our code. Knowing how it works helps you write more efficient code day to day, and gives you a mental model when you run into a dispatch-related question while coding.

For compiled languages there are roughly three categories of method dispatch: Direct Dispatch, Table Dispatch, and Message Dispatch. The first is also called Static Dispatch; the latter two are Dynamic Dispatch.

# Categories of method dispatch

At its core, dispatch is about telling the CPU which memory address to jump to in order to execute the right code when a method is called. Let's walk through the three flavors below — each has its own strengths and trade-offs.

## Direct Dispatch

Direct dispatch is also called static dispatch. It's the fastest of the three, both because the assembly it lowers to is shorter and because the compiler can do more aggressive optimizations on top of it — like function inlining. C is the classic representative of this style. The catch is that as programming scenarios get more complex, static dispatch becomes pretty limiting — you have to nail everything down before the code runs, which severely restricts how flexibly you can express things. One sentence summary: the compiler resolves the call path at compile time, and the program just follows the predetermined route at runtime.

## Table Dispatch

Table dispatch is the most common form of dynamic dispatch in compiled languages. At the compiler level it uses a table to store function pointers for every method declared on a type. In C++ this table is called the virtual table (or V-Table for short). In Swift, classes with inheritance also use a V-Table to support polymorphism. For value types, polymorphism that comes from protocols uses a different table-dispatch variant called the Protocol Witness Table (PWT for short) — more on that in a moment.

### V-Table

For the V-Table approach, every class maintains a function table containing all of that class's function pointers. It includes:

1.  The addresses of methods inherited from the superclass;
2.  If a subclass overrides a parent method, the table stores the overridden function;
3.  Methods newly added by the subclass are appended at the end of the table.

At runtime the program looks up which function to actually call using this table. This dramatically improves the flexibility of code and is the foundation for polymorphism in languages like Java and C++. The trade-off compared to static dispatch is the implicit cost: a function call is no longer direct — you first look up the real function pointer in the table, and then execute. The compiler also can't do compile-time optimizations like `inline` anymore.

Let's borrow a WWDC example to illustrate the V-Table dispatch process. There are three classes: `Drawable` is the base class, with `Point` and `Line` as subclasses.

![image-20190919233507171](https://i.imgur.com/49YUt1Y.png)

When `drawables` is actually accessed (notice that the array structure here, aside from the `refCount` for reference counting, stores a 1-word reference per element — the address of each concrete instance), the program follows the pointer to the instance on the heap, finds the V-Table in the instance's type information, and then locates the actual function address from there.

![](https://i.imgur.com/9T6aHwq.png)

Each class's metatype stores the V-Table, and the table holds the real function addresses for the type.

![](https://i.imgur.com/8n9ZDBT.png)

### PWT

In Swift, there's also the more important case of Protocols. Objects that conform to the same protocol don't necessarily share an inheritance relationship, so V-Table can't be used here. Swift's solution is the Protocol Witness Table, a data structure that supports dynamic dispatch for protocol methods. Take the example above and abstract `Drawable` into a protocol:

![Code with Protocol](https://i.imgur.com/GaIILyH.png)

In short, Swift generates a **uniformly-sized** struct for each object that implements the protocol. This struct is called the `Existential Container`, and inside it is the PWT, where each entry points into the conforming type's information. Beyond the PWT, the container also reserves three words of `valueBuffer` for storing the data members, plus a Value Witness Table holding addresses of a set of functions that operate on those data members. I won't dig further into that here. The PWT itself holds the addresses of the protocol method implementations on that instance.

![](https://i.imgur.com/Twp4Juj.png)

So fundamentally, protocol dispatch is more complex than V-Table dispatch, but it's still based on looking up a function address through a table.

## Message Dispatch

The third one is message dispatch. As someone who has used Objective-C for years, `sendMessage` is probably second nature. Message dispatch is the most dynamic of the three forms — it's the foundation of the entire Cocoa stack. Tools like KVO and Target-Action are built on top of it, and it's also what makes Objective-C's notorious black magic — `method swizzling` — possible, letting you swap function addresses at runtime.

Most people have read the core code of the Objective-C runtime. The runtime walks the class's method list, and follows the super class chain to keep searching until the method is found — that core lives in objc runtime. We also know that the heart of the Objective-C runtime is `objc_msgSend`, which walks the class's inheritance chain looking for every possible method. Here's the forwarding flow one more time:

![CleanShot 2019-09-18 at 00.05.07](https://i.imgur.com/PQWgrbn.png)

Notice the difference between message dispatch and table dispatch above. With table dispatch, the lookup table is fixed, and the subclass inherits all the visible methods of the parent (which is also relatively safe). With message dispatch, the runtime can dynamically walk the inheritance chain; the subclass doesn't need to copy the parent's methods — it just traverses the entire chain via the `superClass` pointer.

With those three dispatch strategies in mind, let's look at where each mainstream language stands today:

![](https://i.imgur.com/J6FlTnn.png)

You might say "wait, can't Objective-C mix with C++? So it must support Table Dispatch too, right?" That's a misconception. Objc and C++ have a similar historical role — they're both languages built on top of C — but Objective-C natively uses Message Dispatch. Because it's built on top of C and its core runtime is written in C, it interoperates very well with C and naturally inherits C's Direct Dispatch. C++ being able to mix with Objective-C is basically wishful thinking — anyone who's been on the receiving end of Objective-C++ knows the feeling.

# SIL

Before diving into Swift's method dispatch, let's talk about SIL. SIL stands for Swift Intermediate Language. It's a high-level intermediate language designed specifically for Swift, sitting at the compiler front end as the main artifact between the AST and LLVM IR, used primarily for semantic analysis, code optimization, and generic specialization for Swift. The SIL output reveals a lot about how method dispatch actually works.

Here's a slide from a WWDC talk showing the stages of Swift's compiler front end.

![Swift Compiler Frontend](https://i.imgur.com/c9QmdsA.jpg)

You can generate the SIL file for a Swift file using swiftc:

``` swift
swiftc -emit-sil test.swift > test.sil
```

For example, the following file produces the SIL below:

![Simple Swift](https://i.imgur.com/nO6OwLT.png)

Generated SIL:

![SIL Generated](https://i.imgur.com/LAjbdYh.png)

### A few SIL instructions

Since we're talking about method dispatch, here are four SIL instructions worth knowing:

#### class\_method

For `class_method`, the [VTables](https://github.com/apple/swift/blob/master/docs/SIL.rst#id34) section explains that the current Swift semantic instruction is using V-Table dynamic dispatch.

> SIL represents dynamic dispatch for class methods using the [class\_method](https://github.com/apple/swift/blob/master/docs/SIL.rst#class-method), [super\_method](https://github.com/apple/swift/blob/master/docs/SIL.rst#super-method), [objc\_method](https://github.com/apple/swift/blob/master/docs/SIL.rst#objc-method), and [objc\_super\_method](https://github.com/apple/swift/blob/master/docs/SIL.rst#objc-super-method) instructions.
>
> The potential destinations for [class\_method](https://github.com/apple/swift/blob/master/docs/SIL.rst#class-method) and [super\_method](https://github.com/apple/swift/blob/master/docs/SIL.rst#super-method) are tracked in `sil_vtable` declarations for every class type.

#### objc\_method

The name says it all — this dispatches via the Objective-C runtime. From the GitHub page:

> Performs Objective-C method dispatch using `objc_msgSend()`.

#### witness\_method

The semantics are: look up the method in the Protocol Witness Table.

#### function\_ref

A reference to a function.

#### apply

You can read `apply` as: call a function.

If you want the full list with all the details, the [Swift GitHub page](https://github.com/apple/swift/blob/master/docs/SIL.rst#dynamic-dispatch) has them.

OK — with SIL out of the way, let's get to the point.

# What does method dispatch look like in Swift?

To start with one sentence: Swift supports all three dispatch strategies above. First, because of its historical baggage, it must support the Objective-C runtime, so message dispatch is in. Second, because of value types and the traditional class types, Swift supports the other two as well.

There are a few factors that determine which dispatch form a Swift method uses:

1.  Where the method is declared
2.  Modifiers
3.  Compiler visibility optimizations

## Declaration location

Method declarations in different places dispatch differently. Here's an example — we define two methods on a class and its extension.

![Carbonize 2019-09-15 at 8.16.43 P](https://i.imgur.com/LeKq69v.png)

For this snippet, `MyClass` uses table dispatch, and the extension method uses static dispatch.

1.  Value types always use direct dispatch;
2.  Methods declared on a class that might be inherited use V-Table dispatch;
3.  Methods in a protocol extension or class extension use direct dispatch (all extension methods, except for `NSObject` extensions, are statically dispatched);
4.  Methods declared on the protocol itself use PWT dispatch.

![PWT](https://i.imgur.com/rGxsWt7.png)

### Example

Here's something that comes up regularly in everyday development:

![An extension](https://i.imgur.com/UOlgU25.png)

We define a method in a type's extension, and a method with the same name in a protocol extension. The result of calling these methods differs depending on the declared type at the call site — which tells us static dispatch is at play.

When we move that method into the `MyProtocol` declaration itself, it switches back to standard PWT dispatch — the implementation is looked up through the PWT.

![Carbonize 2019-09-15 at 8.21.12 P](https://i.imgur.com/nm0ISlh.png)

Protocol extensions are strictly statically dispatched, because there's no virtual function table to put the method implementations into. Extensions can provide default implementations of protocol methods because a conforming type stores the extension's implementation in its own protocol witness table (PWT) — and only when the type itself hasn't already implemented the method.

The PWT only contains methods defined in the Protocol itself, so protocol extension methods (which aren't really part of the Protocol) have nowhere to go. Calls to protocol extension methods don't go through the V-Table; the only thing the runtime can do is statically invoke the extension's implementation. And because it's static dispatch, there's no overriding.

The only way to make protocol extension methods use V-Table dispatch would be to give the extension its own V-Table — but at compile time, a conforming type doesn't necessarily know about every extension on the protocol, so it can't add all the extension methods to its own PWT.

Unless you convert all protocol dispatch into dynamic dispatch — which the Swift team doesn't want.

> \[Protocol extensions\] are strictly static typing, all the way. Which makes sense, because there's no virtual function table (or in Swift terms, protocol witness table) to put the methods into. Extensions can provide default implementations of protocol methods because the type that conforms to the protocol puts the extension method implementation into its own protocol witness table (and they only do this if the type doesn't already implement the method itself). Since the protocol witness table only contains things defined in the protocol itself, protocol extension methods that aren't part of the protocol don't get put anywhere. So invoking one of those methods has no possible virtual function table to check, the only thing it can do is statically invoke the method from the extension. And this is why you can't override them (or rather, why your override isn't called if the method resolution is done via the protocol).
> The only way to make protocol extension methods work via virtual dispatch is to define a new protocol witness table for the extension itself, but types that were defined without being able to see the extension won't know to create and populate this protocol witness table. \[…\]
> The only other solution that comes to mind is turning all protocol dispatch into dynamic dispatch, which I hope you'll agree is not a good idea.

For this situation, just remember these rules:

1.  If a variable's type is inferred as the Protocol, the decision depends on whether the method is declared in the Protocol. If it is, the type's own implementation is called (regardless of any default implementation in a protocol extension). If it isn't, the extension's implementation is called.
2.  If a variable's type is inferred as the concrete type, the concrete type's implementation is always called.

## Explicitly choosing a dispatch strategy

Swift has several modifiers that change how a method is dispatched.

As we mentioned, the Swift compiler first generates SIL on the front-end side and runs some optimizations there — which is where we can see what the compiler is actually doing. Let's look at this:

![Modifier Test](https://i.imgur.com/FOSvscu.png)

At the end of the file there's V-Table information:

![V-Table](https://i.imgur.com/KIr6PcI.png)

1.  The default class method appears, which means default class methods use table dispatch;
2.  Methods marked `final` don't appear in the V-Table;
3.  `@objc`-marked methods look the same as default methods;
4.  Methods marked `dynamic` don't appear in the V-Table;

Now let's look at what those call sites actually become, one by one.

### default class method

The SIL for the default method on MyClass:

![default class method](https://i.imgur.com/4mOvakz.png)

### final

The `final` keyword guarantees static dispatch. Methods marked `final` are also hidden from the Objective-C runtime — no selector is generated for them.

Here's the `final` method in the SIL:

![final](https://i.imgur.com/e869Ybt.png)

You can see `function_ref` pulls the function pointer directly, passes the instance to it, and `apply` invokes it.

### dynamic

`dynamic` guarantees that a method is dispatched via message dispatch — meaning the call goes through `objc_msgSend()`. Before Swift 4, `dynamic` was always paired with `@objc`. From Swift 4 on, the two were split: `@objc` only ensures Objective-C visibility.

In MyClass's V-Table, `performDynamicOperation` (marked `dynamic`) is missing — confirming the method is no longer table-dispatched.

And here's what the call site actually compiles to:

![dynamic](https://i.imgur.com/hBnDKha.png)

You can see `objc_method` here — the instance is being handed straight to `objc_method` for execution. So a `dynamic`-marked method is neither direct dispatch nor table dispatch — the instance is converted into Objective-C runtime code for execution.

### @objc

These two keywords control whether the method is visible to the Objective-C runtime. `@objc` is often used to expose a Swift method to Objc. Importantly, `@objc` does **not** change the dispatch mechanism — in the SIL, `performOcOperation` and the default class method `performOperation` both appear in the V-Table.

![@objc](https://i.imgur.com/XeU21sp.png)

In the generated SIL, an `@objc`-marked method is identical to a default method — both use table dispatch.

### A note on inlining

Inlining is a compiler optimization for function calls that's been around since C. Once the compiler decides a function is a candidate for inlining, it expands the function call inline at the call site — as if the function body itself were inserted there, with no call at all. Quick example:

If the compiler decides to inline the method, at compile time the code is rewritten to look like this:

![Inline Code](https://i.imgur.com/KkjZV24.png)

A function call has a real cost. It varies with a lot of factors, but there are some recurring ones — stack frame setup, indirect pointer jumps, and register allocation.

Of course, the compiler weighs many things when deciding whether to inline. I've linked some references at the bottom; here are a few rules of thumb:

1.  The function body contains a loop;
2.  The function body is long (imagine expanding it everywhere — binary size blows up due to repeated code);
3.  Recursive functions;

Inlining isn't all upside — it grows the binary, for one. So the compiler has its own cost model. Swift gives you knobs to influence the decision: `@inline(__always)` and `@inline(never)`.

Swift supports inlining; that attribute tells the compiler to use direct (static) dispatch as the optimization. Whether the function actually ends up inlined is still up to the compiler.

OK — that's the picture for explicitly controlling dispatch with modifiers:

![dispatch for modifier](https://i.imgur.com/AKBneR0.jpg)

## Optimizations from visibility

From the discussion above, you can see that if the compiler has more information to work with, it can apply a lot of optimizations automatically. How do you give it more information? By controlling Visibility appropriately. Swift introduced Whole Module Optimization (WMO) starting in 2.0, which dramatically lifts Swift's overall performance.

Here's an example from the Swift blog illustrating what this flag does. Say our Module contains only two files, `utils.swift` and `main.swift`:

![Carbonize 2019-09-18 at 1.00.20 AM-squashed](https://i.imgur.com/VwS1kIu.png)

By default, the compiler optimizes each source file independently. When optimizing the current file, it only considers that file — so when looking at `main.swift`, the compiler knows there's a function called `getElement` but doesn't know its body. When optimizing `utils.swift`, it doesn't know what type `T` will be, so it can't specialize the generic — it emits a generic version, and the actual type is resolved at runtime based on what's passed in.

Or take inlining: inlining depends on the compiler being able to see the function body in order to decide. When the function is defined in another file, the file that calls it can't inline it. All because the compiler only sees the current file. With WMO enabled, the compiler considers the entire module globally — it explicitly looks at every Swift file in the current Module at compile time.

So in the example above, with WMO turned on, the compiler can do things like specialize the method defined in `utils.swift`, and inline its use inside `main.swift`:

![Carbonize 2019-09-18 at 1.03.14 AM-squashed](https://i.imgur.com/rAh4ykK.png)

What does this mean for dispatch? The inline expansion above is already a clue — dynamic dispatch, which is comparatively expensive, gets folded into static dispatch.

Let's use the WWDC demo for a clearer picture.

![](https://i.imgur.com/nzj6724.png)

By default, when `Dog.swift` is compiled on its own, the compiler can't prove that `Dog` won't be subclassed elsewhere, so it falls back to V-Table dispatch in case the method needs to be overridden. With WMO enabled, `Dog` is `Internal` and can't be subclassed from another Module — and the compiler can now scan the entire Module to verify that nothing in it subclasses `Dog` either. With both facts in hand, the dispatch can be optimized to direct dispatch, saving an indirect jump.

![](https://i.imgur.com/RztcEm8.png)

Previously, single-file optimization meant the compiler had no way to know whether `Dog`'s methods would be overridden, and had to keep `noise` in the V-Table for Table Dispatch. With global visibility, the compiler can confirm that no subclass of `Dog` exists anywhere in the current Module, so the call to `noise` gets switched straight to Direct Dispatch.

So enabling `Whole Module Optimizations` gives the Swift compiler much more information — inheritance relationships, access control, and more — to optimize against.

# Wrap-up

With all that, here's the full picture of method dispatch:

![](https://i.imgur.com/EpyLztd.png)

Compiler optimizations have come a long way, but as developers we still understand the complexity of business logic better than the compiler does — and that complexity often hides optimizations the compiler can't see. So it's still on us, as Coders, to recognize where those wins are and write efficient code from the ground up.

## References

1.  [Virtual method table](https://en.wikipedia.org/wiki/Virtual_method_table)
2.  [Proposal: Universal dynamic dispatch for method calls](https://forums.swift.org/t/proposal-universal-dynamic-dispatch-for-method-calls/237/28)
3.  [Increasing Performance by Reducing Dynamic Dispatch - Swift Blog](https://developer.apple.com/swift/blog/?id=27)
4.  [@objc and dynamic - Swift Unboxed](https://swiftunboxed.com/interop/objc-dynamic/)
5.  [Whole-Module Optimization in Swift 3](https://swift.org/blog/whole-module-optimizations/)
6.  [Inline Functions in C++ - GeeksforGeeks](https://www.geeksforgeeks.org/inline-functions-cpp/)
7.  [The Cost - A Function Call](https://mortoray.com/2010/10/12/the-cost-a-function-call/)
8.  [Swift Intermediate Language](https://github.com/apple/swift/blob/master/docs/SIL.rst)
