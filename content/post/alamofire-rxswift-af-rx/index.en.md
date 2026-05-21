---
title: 'How the .af and .rx extensions work in Alamofire and RxSwift'
slug: 'alamofire-rxswift-af-rx'
date: 2019-09-29T10:30:30+08:00
draft: false
categories: ['swift']
tags: ['alamofire', 'associatedtype', 'cocoapods', 'codable', 'dispatch', 'extension', 'generic', 'inline', 'ios', 'metatype', 'module', 'overload', 'protocol', 'pwt', 'quiz', 'rxswift', 'swift', 'tuple']
---

Another lightweight post today — this time about how the `.af` and `.rx` namespacing extensions in Alamofire and RxSwift actually work. Anyone who's used those libraries (￣ω￣(￣ω￣〃 (￣ω￣〃)ゝ has seen the pattern. Consider this a stream-of-consciousness note for my own reference.

First, the `af` extension in Alamofire:

![Alamofire](https://i.imgur.com/AbPIzgX.png)

You use the extension like this:

``` swift
struct Demo {}
extension Demo: AlamofireExtended {}
extension AlamofireExtension where ExtendedType == Demo {
    func printSomething() {
        print("Something arrived.")
    }
}
let d = Demo()
d.af.printSomething()
```

Two things to notice:

1.  We make the `Demo` type conform to the `AlamofireExtended` protocol — that's what adds the `af` extension property, which returns a wrapper object of type `AlamofireExtension`.
2.  We extend `AlamofireExtension` (the wrapper from step 1) with a method that's specific to the `Demo` type.

Honestly, the fact that the wrapper struct and the protocol have nearly identical names threw me off the first time I read this code. I prefer RxSwift's naming.

Here's the same idea in RxSwift:

![RxSwift](https://i.imgur.com/m5O7lo5.png)

The usage is identical — just different names.

So we can generalize this pattern. To add a namespaced extension surface to your own library, there are three pieces:

### Declare the extension properties

To support both instances and types, you need two computed properties:

- A `static` one for use on the type itself.
- An instance one for use on individual values.

### Wrap the metatype information

To let `.af` / `.rx` carry metadata about the underlying instance or type, both libraries reach for the same trick: wrap things in a generic struct. The wrapper just holds onto `self`.

You can see what the extension returns by checking what the compiler infers:

![Compiler Inference](https://i.imgur.com/09ikWMm.png)

From the `print` call you can tell the type is `AlamofireExtension` (since that's the type we extended), and inside it there's a `type` property holding the original `Demo`. The `printSomething` method we added fires when the wrapped type is `Demo`.

### Extend the target type

By now you've seen that the extension property hands you an object carrying an associated type. That associated type is exactly what lets you write `where` clauses to scope methods to specific underlying types.

Following this recipe, you can write your own namespaced extension surface for a module:

``` swift
    import Foundation
    
    // We implemented a module named Wonderful.
    // Extension name will be named as wf
    
    // Step 0.
    // Encapsulate a type which is unknown until now.
    struct Extensible<EncapsulatedType> {
        let type: EncapsulatedType
        init(_ type: EncapsulatedType) {
            self.type = type
        }
    }
    
    // Step 1.
    // Extension a type to add two properties. a static var and a var
    protocol WonderfulExtension {
        associatedtype ExtendedType
        
        // static entry point
        static var wf: Extensible<ExtendedType>.Type { get set }
        // instance entry point
        var wf: Extensible<ExtendedType> { get set }
    }
    
    // Step 2.
    extension WonderfulExtension {
        static var wf: Extensible<Self>.Type {
            set { }
            get { return Extensible<Self>.self }
        }
        
        var wf: Extensible<Self> {
            set { }
            get { return Extensible(self) }
        }
    }
    
    // Step3.
    // Extend the type we want to, which the type will have wf var.
    struct Ordinary {}
    extension Ordinary: WonderfulExtension {}
    
    // Step4.
    // Restrict methods in the scope of type we want to extend
    extension Extensible where EncapsulatedType == Ordinary {
        func wow() {
            print("Wow, Wonderful extension.")
        }
    }
    
    // Use methods of wf extension
    let obj = Ordinary()
    obj.wf.wow()
```

Two big benefits of this approach:

1.  It makes scope obvious — callers immediately know "this method belongs to that module".
2.  The library itself becomes easier to extend further (it carries the namespace marker forward), which is exactly how the whole ecosystem of RxSwift-derived libraries grew.

So, this small chunk of code leans on three key features of the Swift type system:

1.  Associated Types
2.  Generics
3.  Default implementations in extensions

![Overview](https://i.imgur.com/6YvVnCM.png)
