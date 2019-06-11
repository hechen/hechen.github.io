---
title: "Codable && Tuple"
date: 2019-06-10T23:50:54+08:00
lastmod: 2019-06-11T00:10:38+08:00
categories: ["Swift"]
tags: ["Tuple", "Codable"]
---

During my learning of Swift, many interesting things I will find. Codable is one of them.

Today, I defined a model with a tuple type, then Xcode told me some error. Codes may like as below.

![Codable Person](https://i.imgur.com/c67KrA8.png)

You may want Xcode automatically complete all the codable stuff. However, life is hard. Codes like these can even not be compiled. Xcode will tell you name cannot be synthesize the Person because of the FullName.

```
error: default.playground:5:8: error: type 'Person' does not conform to protocol 'Decodable'
struct Person: Codable {
       ^

Swift.Decodable:2:12: note: protocol requires initializer 'init(from:)' with type 'Decodable'
    public init(from decoder: Decoder) throws
           ^

default.playground:6:9: note: cannot automatically synthesize 'Decodable' because 'FullName' (aka '(firstName: String, secondName: String)') does not conform to 'Decodable'
    var name: FullName
        ^

error: default.playground:5:8: error: type 'Person' does not conform to protocol 'Encodable'
struct Person: Codable {
       ^

Swift.Encodable:2:17: note: protocol requires function 'encode(to:)' with type 'Encodable'
    public func encode(to encoder: Encoder) throws
                ^

default.playground:6:9: note: cannot automatically synthesize 'Encodable' because 'FullName' (aka '(firstName: String, secondName: String)') does not conform to 'Encodable'
    var name: FullName
        ^
```

So, We know that if a struct or class is codable implicitly, it must not contain properties which are not codable. Tuple is one of them.

Some people argue that why tuple cannot be designed as a codable type? Yeah, the hope is that tuples could conform to protocols in future. This is covered in the generics manifesto as "Extensions of Structural Types 28".


> Extensions of structural types
> Currently, only nominal types (classes, structs, enums, protocols) can be extended. One could imagine extending structural types--particularly tuple types--to allow them to, e.g., conform to protocols. For example, pulling together variadic generics, parameterized extensions, and conditional conformances, one could express "a tuple type is Equatable if all of its element types are Equatable":

```
extension<...Elements : Equatable> (Elements...) : Equatable {   // extending the tuple type "(Elements...)" to be Equatable
}
```
> There are some natural bounds here: one would need to have actual structural types. One would not be able to extend every type:

```
extension<T> T { // error: neither a structural nor a nominal type
}
```
> And before you think you're cleverly making it possible to have a conditional conformance that makes every type T that conforms to protocol P also conform to protocol Q, see the section "Conditional conformances via protocol extensions", below:

```
extension<T : P> T : Q { // error: neither a structural nor a nominal type
}
```

So for now, you have to synthesize the tuple type by yourself.

![Synthesize Properties by youself](https://i.imgur.com/CsXtVWP.png)


## References

1. [Codable Tuples](https://forums.swift.org/t/codable-tuples/14174)
2. [Swift GenericsManifesto.md](https://github.com/apple/swift/blob/master/docs/GenericsManifesto.md#extensions-of-structural-types)