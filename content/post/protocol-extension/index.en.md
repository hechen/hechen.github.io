---
title: 'Protocol Extension'
slug: 'protocol-extension'
date: 2019-08-08T19:00:20+08:00
draft: false
categories: ['swift', 'translation']
tags: ['cocoapods', 'codable', 'ios', 'metatype', 'module', 'overload', 'protocol', 'quiz', 'singleton', 'swift', 'tuple', 'xcode']
---

Protocol is *the* most important building block in the Swift ecosystem — the scaffolding that holds everything else together.

A few of the obvious wins of using protocols over inheritance:

1.  No forced subclassing — you don't have to inherit from some specific class.
2.  Protocols can retrofit capabilities onto types that already exist.
3.  They apply more broadly — value types like `struct` and `enum` get to participate, not just classes.
4.  Swift doesn't support multiple inheritance, so you'd otherwise spend mental energy picking which class to subclass. The moment a capability you need is spread across two different parents, you're stuck — sometimes you even end up modifying the parent class.
5.  With inheritance you also have to worry about overriding behaviour — like when to call `super` from inside an override.

This post is a quick note on one subtle distinction inside Protocol Extension.

Swift protocols don't have an `optional` keyword, which means anything declared in a protocol becomes a Protocol Requirement: every conforming type must implement it, or the conformance is incomplete. Think about implementing your own TableView — if you forced callers to implement every single delegate method, that'd be pretty cruel.

![Protocol](https://i.imgur.com/yA76SiN.png)

The fix is to extend the protocol and give those methods default implementations, so callers only need to implement the methods that really demand it.

![Optional Protocol](https://i.imgur.com/MRA0k6z.png)

Given a protocol `P`, there are two ways to add a new method via extension:

1.  Add the method declaration to the protocol itself — now every conforming type must implement it.
2.  Add the method on a protocol extension — conforming types are not required to implement it.

What's the difference? Look at this:

![Static Dispatch](https://i.imgur.com/T3filbG.png)

`s` calls the method we added in the extension on `S`, while `s2` calls the method from the extension on `P`. Even though the underlying dynamic type is `S` in both cases, the declared static types differ — and so the call results differ too.

For case 1, dispatch happens at runtime — it's resolved based on the actual concrete type. For case 2, dispatch is static — whichever type you declared the variable as, that's the method that gets called. Above, `s1`'s static type is inferred to be `S`, while `s2` is declared as `P`. Hence the difference in behaviour when invoking the extension method.

If you want the call to behave consistently regardless of static type, move the method declaration into the protocol definition itself. From that point on, every conforming type must implement it — and dispatch becomes dynamic.

![Dynamic Dispatch](https://i.imgur.com/LzDWuWp.png)

Once you internalize this, the TableView example up top makes more sense. Method declarations inside a Protocol force runtime dispatch on every conforming type (based on the object's dynamic type), and if the object provides its own implementation, that's what gets called.
