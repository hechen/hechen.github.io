---
title: 'Understanding the Objective-C runtime'
slug: 'understanding-the-objective-c-runtime'
date: 2015-09-07T17:55:33+00:00
draft: false
categories: ['data-structure', 'ios', 'leetcode', 'translation']
tags: ['algorithm', 'animation', 'ios', 'linked-list', 'notification', 'objective-c', 'push', 'runtime', 'string', 'tree']
---

The Objective-C runtime is one of those language features that's easy to overlook when you're just stepping into Cocoa/Objective-C land. The reason is simple: Objective-C is a language you can pick up in a few hours, but newcomers spend most of their time figuring out the Cocoa framework — trying to wrap their heads around how the whole thing actually works. I think every developer should have a deeper understanding of the runtime, and know the internal mechanics rather than just the surface fact that `[target doMethodWith:var]` gets translated by the compiler into `objc_msgSend(target,@selector(doMethodWith:),var1);`. Understanding how the Objective-C runtime works gives you a much deeper feel for the language and clearer insight into how your app actually runs. I think it helps Mac/iPhone developers at every level, beginner or veteran.

\[TOC\]

#### The Objective-C runtime is open source

The Objective-C runtime is open source — you can grab it from [Apple](http://opensource.apple.com) at any time. Reading the runtime source is honestly my favorite way to figure out how the language works, more so than reading Apple's docs. You can download the runtime source [here](http://opensource.apple.com/tarballs/objc4/objc4-437.1.tar.gz) (at the time of translation the latest version is objc4-647.tar.gz).

#### Dynamic vs. Static

Objective-C is a dynamic, object-oriented language. That means things that would normally be decided at compile/link time can be deferred to runtime. This gives you enormous flexibility — you can redirect messages to other objects on demand, even swap method implementations (translator's note: `method swizzling`, which is how developers commonly inject new behavior into existing implementations). The runtime also lets an object answer which messages it can respond to and which it can't (translator's note: introspection), and lets it dispatch messages correctly.

> Translator's note: Introspection is a powerful feature of object-oriented languages and environments — Objective-C and Cocoa especially so. Introspection is an object's ability to expose details about itself as a runtime object: its position in the inheritance hierarchy, whether it conforms to a particular protocol, whether it can respond to a particular message. The NSObject protocol and class define a rich set of introspection methods for querying runtime info and identifying objects by their characteristics.
>
> Reference: [Objective-C Introspection](https://developer.apple.com/library/archive/documentation/General/Conceptual/CocoaEncyclopedia/Introspection/Introspection.html)

Compare this with C: in C, you start at `main()` and write your logic or execute function calls top-down in order. C structs can't forward a request to some other object to execute a method. You might write something like:

``` objectivec
#include < stdio.h >
 
int main(int argc, const char **argv[]) {
    printf("Hello World!");
    return 0;
}
```

The compiler parses it, optimizes, and translates it into assembly like this:

``` objectivec
.text
 .align 4,0x90
 .globl _main
_main:
Leh_func_begin1:
 pushq %rbp
Llabel1:
 movq %rsp, %rbp
Llabel2:
 subq $16, %rsp
Llabel3:
 movq %rsi, %rax
 movl %edi, %ecx
 movl %ecx, -8(%rbp)
 movq %rax, -16(%rbp)
 xorb %al, %al
 leaq LC(%rip), %rcx
 movq %rcx, %rdi
 call _printf
 movl $0, -4(%rbp)
 movl -4(%rbp), %eax
 addq $16, %rsp
 popq %rbp
 ret
Leh_func_end1:
 .cstring
LC:
 .asciz "Hello World!"
```

Then it gets linked against the C library to produce an executable. Objective-C goes through a similar pipeline, except the generated code depends on the behavior of the Objective-C runtime (translator's note: the runtime emits different code depending on the situation). When we first learn Objective-C, we get told that something like this:

``` objectivec
[self doSomethingWithVar:var1];
```

Gets translated into:

``` objectivec
objc_msgSend(self,@selector(doSomethingWithVar:),var1);
```

But beyond that, it's not always clear what else the runtime is doing.

#### What is the Objective-C runtime?

The Objective-C runtime is a runtime library, written primarily in C and assembly, that adds object-oriented capabilities to C — that's how Objective-C was created (translator's note: it's the Objective-C runtime that makes Objective-C the language it is). The runtime can load class information, dispatch methods, forward messages, and more. The most important thing the Objective-C runtime does is provide the foundational support for all of Objective-C's object-oriented features.

#### Objective-C runtime terminology

Before we go further, let's pin down some of the terms we'll see. Today, Mac and iPhone developers care about two runtimes: Modern Runtime and Legacy Runtime. The former covers all 64-bit Mac OS X apps and all iOS apps; the latter covers everything else (all 32-bit Mac OS X apps). For methods, there are two basic types: instance methods (starting with `-`, e.g. `-(void)doFoo`, operating on object instances) and class methods (starting with `+`, e.g. `+(id)alloc`). A method is similar to a function in C — a piece of code that performs a small task — like:

``` objectivec
- (NSString *)movieTitle {
    return @"Futurama: Into the Wild Green Yonder";
}
```

**Selector**  
A Selector in Objective-C is an important C data structure used to identify the Objective-C method you want an object to execute. In the runtime, Selector is defined something like:

``` objectivec
typedef struct objc_selector  *SEL; 
```

You use it like this:

``` objectivec
SEL aSel = @selector(movieTitle); 
```

**Message**

``` objectivec
[target getMovieTitleForObject:obj];
```

A method call in Objective-C is wrapped in square brackets `[]` — the target object you're sending the message to, plus the method you want it to perform, plus any arguments. An Objective-C message is similar to a C function call, but different. Sending a message to an object doesn't necessarily mean that object will execute it — the object can inspect the sender of the message and either execute a different method or forward the message to another object entirely.

**Class**
If you've read the runtime's class definition, you might have seen something like:

``` objectivec
typedef struct objc_class *Class;
typedef struct objc_object {
    Class isa;
} *id; 
```

A few things to note here.
Every Objective-C class has a struct, and every object has a struct. All objects contain an `isa` pointer. The Objective-C runtime needs this `isa` pointer to figure out an object's concrete type, so it can decide whether the object can respond to a message you've sent.
We also see the `id` pointer. The `id` pointer tells us only that what it points to is an Objective-C object — nothing more. Once you have an `id`, you can query the object's type, ask whether that type responds to a particular method, and so on. Once you know the concrete class of the object, you can take more concrete actions on it.

**Blocks**

You'll find something similar in the LLVM/Clang documentation for Blocks:

``` objectivec
struct Block_literal_1 {
    void *isa; // initialized to &_NSConcreteStackBlock or &_NSConcreteGlobalBlock
    int flags;
    int reserved; 
    void (*invoke)(void *, ...);
    struct Block_descriptor_1 {
         unsigned long int reserved; // NULL
         unsigned long int size;  // sizeof(struct Block_literal_1)
         // optional helper functions
         void (*copy_helper)(void *dst, void *src);
         void (*dispose_helper)(void *src); 
    } *descriptor;
    // imported variables
}; 
```

Blocks are designed to be compatible with the Objective-C runtime, so they can be treated as objects and respond to messages (`-retain`, `-release`, `-copy`, and so on).

**IMP** (Method Implementations)

``` objectivec
typedef id (*IMP)(id self,SEL _cmd,...); 
```

IMP is a compiler-generated function pointer pointing to the location of the method's implementation. If you're new to Objective-C, you don't need to deal with these directly — but as you go deeper you'll bump into them more. We'll see later that this is how the Objective-C runtime actually invokes your method.

**Objective-C Classes**

What does the inside of an Objective-C class look like? Roughly this:

``` objectivec
@interface MyClass : NSObject {
    // vars
    NSInteger counter;
}
// methods
-(void)doFoo;
@end
```

But the runtime tacks on more to keep track of the class's state moment to moment:

``` objectivec
#if !__OBJC2__
    Class super_class                                        OBJC2_UNAVAILABLE;
    const char *name                                         OBJC2_UNAVAILABLE;
    long version                                             OBJC2_UNAVAILABLE;
    long info                                                OBJC2_UNAVAILABLE;
    long instance_size                                       OBJC2_UNAVAILABLE;
    struct objc_ivar_list *ivars                             OBJC2_UNAVAILABLE;
    struct objc_method_list **methodLists                    OBJC2_UNAVAILABLE;
    struct objc_cache *cache                                 OBJC2_UNAVAILABLE;
    struct objc_protocol_list *protocols                     OBJC2_UNAVAILABLE;
#endif 
```

A class holds a reference to its superclass, its name, its instance variables, its method list, its cache, and its protocol list. The runtime needs all of this to respond to messages dispatched against the class or its instances.

#### So a class defines an object but isn't itself the object — how does that work?

As I mentioned, Objective-C classes are themselves objects (translator's note: meaning you can send messages to a class). The runtime makes this work by creating metaclasses. When you send a message like `[NSObject alloc]`, you're actually sending it to the class object — and that class object needs to be an instance of the **metaclass**, which itself is an instance of the **root metaclass**.
When you say a class inherits from NSObject, it means your class points to NSObject as its superclass. All metaclasses point to the root metaclass as their superclass, and all metaclasses only contain the class methods they can respond to. So when you send a message like `[NSObject alloc]`, `objc_msgSend()` looks at the metaclass to decide whether the object can respond — and if it finds a method that can respond, it executes it on that object.

> Translator's note: The Objective-C class hierarchy diagram looks like this:
>
> ![ios-runtime-class](https://i.imgur.com/D7GUGKB.png)

#### Why do we all subclass Apple's classes?

When you start out in Cocoa, lots of sample code tells you to subclass NSObject before doing anything else. And you go along happily, enjoying the convenience of inheriting from Apple's classes. But you might not realize that your class is already talking to the Objective-C runtime under the hood. When you instantiate your class like this:

``` objectivec
MyObject *object = [[MyObject alloc] init];
```

The first message you send is `+alloc`. If you read the docs, they say "the isa instance variable of the new instance is initialized to a data structure that describes the class; memory for all other instance variables is set to zero." So by subclassing Apple's classes, we don't just inherit some nice properties — we also inherit the ability to allocate space in memory (sized to our class), and to create the object (the runtime-expected data structure with an `isa` pointer).

#### What is the class cache (objc\_cache\* cache)?

When the Objective-C runtime inspects an object through its `isa` pointer, it finds a class that can execute many different methods. But you typically only call a small fraction of them, so it would be wasteful for the runtime to search the class's entire dispatch table on every call. That's why classes have a `cache`. When the dispatch table of a class hierarchy is searched and a selector is found, the runtime stores that selector in the cache. When `objc_msgSend()` looks up a selector in a class, it checks the cache first — based on the assumption that if you've called a method on a class once, you're very likely to call it again soon (translator's note: locality of reference). So consider an NSObject subclass MyObject:

``` objectivec
MyObject *obj = [[MyObject alloc] init];
 
@implementation MyObject
-(id)init {
    if(self = [super init]) {
        [self setVarA:@"blah"];
    }
    return self;
}
@end
```

Here's what actually happens:

1.  `[MyObject alloc]` runs first. MyObject doesn't implement `+alloc`, so the runtime follows the `superclass` pointer up to `NSObject`.
2.  We ask `NSObject` whether it responds to `+alloc` — it does. `+alloc` checks the receiver class (`MyObject`), allocates a chunk of memory the size of that class, and initializes its `isa` pointer to point at `MyObject`. We now have an instance. `+alloc` also gets placed in `NSObject`'s class cache.
3.  Up to here we've been sending class messages. Now we need to send a message to an instance — calling `-init` or a designated initializer. Our class implements `-init`, so `-(id)init` gets placed in the cache.
4.  Then `self = [super init]` runs. `super` is a **magic keyword** that points at the class's superclass — here, `NSObject`. We call `NSObject`'s `init`. The reason to do this is to keep the integrated object-oriented hierarchy intact — before you initialize your own variables, you should initialize your superclass's. You can also override the superclass's methods if you need to. In this example, NSObject's `init` doesn't do much special, but that's not always the case. Init can do important work — consider:

``` objectivec
#import < Foundation/Foundation.h>
 
@interface MyObject : NSObject {
    NSString *aString;
}
 
@property(retain) NSString *aString;
 
@end
 
@implementation MyObject
 
- (id)init {
    if (self = [super init]) {
      [self setAString:nil];
    }
    return self;
}
 
@synthesize aString;
 
@end

 
int main (int argc, const char * argv[]) {
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
 
    id obj1 = [NSMutableArray alloc];
    id obj2 = [[NSMutableArray alloc] init];
 
    id obj3 = [NSArray alloc];
    id obj4 = [[NSArray alloc] initWithObjects:@"Hello",nil];
      
    NSLog(@"obj1 class is %@",NSStringFromClass([obj1 class]));
    NSLog(@"obj2 class is %@",NSStringFromClass([obj2 class]));
  
    NSLog(@"obj3 class is %@",NSStringFromClass([obj3 class]));
    NSLog(@"obj4 class is %@",NSStringFromClass([obj4 class]));
  
    id obj5 = [MyObject alloc];
    id obj6 = [[MyObject alloc] init];
  
    NSLog(@"obj5 class is %@",NSStringFromClass([obj5 class]));
    NSLog(@"obj6 class is %@",NSStringFromClass([obj6 class]));
          
    [pool drain];
    return 0;
}
```

If you're new to Cocoa and I asked you to guess the output, you'd probably say:

``` objectivec
NSMutableArray
NSMutableArray 
NSArray
NSArray
MyObject
MyObject
```

But what you actually get is:

``` objectivec
obj1 class is __NSPlaceholderArray
obj2 class is NSCFArray
obj3 class is __NSPlaceholderArray
obj4 class is NSCFArray
obj5 class is MyObject
obj6 class is MyObject
```

> Translator's note: (running on my machine, Xcode 7 beta6):

``` objectivec
2015-09-07 13:43:06.922 ObjMessage[5185:1441448] obj1 class is __NSPlaceholderArray
2015-09-07 13:43:11.201 ObjMessage[5185:1441448] obj2 class is __NSArrayM
2015-09-07 13:43:17.987 ObjMessage[5185:1441448] obj3 class is __NSPlaceholderArray
2015-09-07 13:43:18.503 ObjMessage[5185:1441448] obj4 class is __NSArrayI
2015-09-07 13:43:32.228 ObjMessage[5185:1441448] obj5 class is MyObject
2015-09-07 13:43:33.478 ObjMessage[5185:1441448] obj6 class is MyObject
```

The reason: in Objective-C, `+alloc` can return one class's object, and `-init` can return an object of a different class entirely.

#### So what happens inside objc\_msgSend?

A lot happens inside `objc_msgSend()`. Consider:

``` objectivec
[self printMessageWithString:@"Hello World!"];
```

The compiler translates this into:

``` objectivec
objc_msgSend(self, @selector(printMessageWithString:), @"Hello World!");
```

We follow the target object's `isa` pointer to check whether the class — or anything up its inheritance chain — can respond to `@selector(printMessageWithString:)`. Suppose we find the selector in the class's dispatch table or its cache; we then jump to that function pointer to execute the method. So `objc_msgSend()` never actually returns — once execution starts, it jumps to your method, runs it, and then control returns from your method, making it *look* like `objc_msgSend()` returned. Bill Bumgarner has explored this in more detail ([Part 1](http://www.friday.com/bbum/2009/12/18/objc_msgsend-part-1-the-road-map), [Part 2](http://www.friday.com/bbum/2009/12/18/objc_msgsend-tour-part-3-the-fast-path), [Part 3](http://www.friday.com/bbum/2009/12/18/objc_msgsend-tour-part-2-setting-the-stage)).

Here's a summary of what he covers — i.e., what you'll see in the runtime code:

1.  Check for ignored selectors and short-circuit. Obviously, in a garbage-collected environment, calls to `-retain`, `-release`, etc., can be ignored.

2.  Check for a nil target. Unlike most languages, sending a message to nil is legal in Objective-C, and you'll find plenty of reasons to do so. Here we assume a non-nil target.

3.  Look up the IMP in the class. First, check the class's cache; if found, jump to the function via the cached pointer.

4.  If it's not in the cache, search the class's dispatch table; if found, jump to the function.

5.  If it's not in the dispatch table either, message forwarding kicks in. This means your code ultimately gets translated by the compiler into a C function. So a method like this:

``` objectivec
-(int)doComputeWithNum:(int)aNum 
```

Gets translated into:

``` objectivec
int aClass_doComputeWithNum(aClass *self,SEL _cmd,int aNum) 
```

The Objective-C runtime invokes your method by jumping through one of these function pointers. You can't call these translated functions directly, although Cocoa does provide ways to get hold of these pointers:

``` objectivec
//declare C function pointer
int (computeNum *)(id,SEL,int);
 
//methodForSelector is COCOA & not ObjC Runtime
//gets the same function pointer objc_msgSend gets
computeNum = (int (*)(id,SEL,int))[target methodForSelector:@selector(doComputeWithNum:)];
 
//execute the C function pointer returned by the runtime
computeNum(obj,@selector(doComputeWithNum:),aNum); 
```

That approach lets you grab a method at runtime and call it directly — bypassing the runtime when you know exactly which method needs to run. That's how the Objective-C runtime invokes your methods, but in practice you should stick with `objc_msgSend()`.

#### Objective-C message forwarding

In Objective-C, it's legal to send a message to an object that doesn't actually know how to respond to it (you could argue it's part of the language's design philosophy). One reason Apple did this was to simulate multiple inheritance, which Objective-C doesn't natively support. Or maybe you want to abstract your design, hiding the other classes or objects behind a message response. It's also necessary for the runtime system itself. The flow looks roughly like this:

1.  The runtime searches the class and the cache and dispatch tables up the inheritance chain — and fails to find the method.

2.  The runtime calls the class method `+ (BOOL) resolveInstanceMethod:(SEL)aSEL` on the class of the receiver, giving you a chance to add a method to handle the selector `aSEL`, and then tell the runtime that you've resolved it. Message forwarding will pick up the new method.

Example — you define a function:

``` objectivec
void fooMethod(id obj, SEL _cmd) {
    NSLog(@"Doing Foo");
}
```

And you can use `class_addMethod()` to resolve it:

``` objectivec
+(BOOL)resolveInstanceMethod:(SEL)aSEL {
    if(aSEL == @selector(doFoo:)) {
        class_addMethod([self class],aSEL,(IMP)fooMethod,"v@:");
        return YES;
    }
    return [super resolveInstanceMethod];
}
```

The `v@:` argument to `class_addMethod()` specifies the method's return type and parameter types. You can find the details in the runtime documentation under \[Type Encodings\]\[10\].

1.  If `+(BOOL)resolveInstanceMethod:(SEL)aSEL` returns NO, the runtime moves on to `- (id)forwardingTargetForSelector:(SEL) aSelector`, giving you another chance to forward the message to a different receiver. This is preferable to running the full forwarding machinery via `- (void)forwardInvocation:(NSInvocation *)anInvocation`. You can do this:

``` objectivec
- (id)forwardingTargetForSelector:(SEL)aSelector {
    if(aSelector == @selector(mysteriousMethod:)) {
        return alternateObject;
    }
    return [super forwardingTargetForSelector:aSelector];
}
```

Obviously, don't return self here — that would loop forever.

1.  If the previous step couldn't find a target object to handle the message, the runtime tries the last step: `- (void)forwardInvocation:(NSInvocation *)anInvocation`. You may not have seen NSInvocation before — it's the message type in Objective-C. Once you have an NSInvocation, you can change almost anything about the message: its target, its selector, and its arguments. So you can do:

``` objectivec
- (void)forwardInvocation:(NSInvocation *)invocation {
    SEL invSEL = invocation.selector;
 
    if([altObject respondsToSelector:invSEL]) {
        [invocation invokeWithTarget:altObject];
    } 
    else {
        [self doesNotRecognizeSelector:invSEL];
    }
}
```

By default, NSObject's `- (void)forwardInvocation:(NSInvocation *)anInvocation` just calls `-doesNotRecognizeSelector:`. If you want one last chance to do something, you can override it.

#### Non Fragile ivars (Modern Runtime)

A new concept introduced in the Modern Runtime is Non Fragile ivars. When the compiler compiles your class, it generates a variable layout that tells the runtime where each ivar lives — at runtime, you look up an ivar by reading the bytes at a known offset from the class instance pointer. So your variable layout might look like this, with the left column showing the byte offset:

![NSObject layout](https://i.imgur.com/35waSjN.png)

Here we have the layout of NSObject; then we subclass NSObject and add our own ivars. This works fine — until Apple releases a new OSX SDK.

![NSObject layout](https://i.imgur.com/xPo1FAw.png)

Now our code doesn't work — our custom object's contents get clobbered, because NSObject added two new ivars and MyObject's layout was already locked at compile time, with two of its ivars overlapping with the base class's memory region. The only way to prevent this would be for Apple to never change its layout — but that would freeze their frameworks in place forever, because their variable layout would be set in stone. Under fragile ivars, the only workaround is to recompile every class that subclasses Apple's classes. What about non-fragile ivars?

![NSObject layout](https://i.imgur.com/w9Fxvpa.png)

With non-fragile ivars, the compiler still generates the same layout as before, but the runtime computes the base class's size at runtime and dynamically adjusts MyObject's ivar layout. The result looks like the diagram above.

#### Objective-C associated objects

A more recent feature introduced in Mac OS X 10.6 is "associative references." Unlike many languages, Objective-C doesn't natively support adding variables to an object at runtime. So up until then, you had to jump through hoops — recompile the whole hierarchy — to pretend you'd added a variable to a class. In Mac OS X 10.6, the Objective-C runtime supports this natively (adding variables dynamically). If we want to add a variable to an existing class — say, NSView — it looks like this:

``` objectivec
#import < Cocoa/Cocoa.h> //Cocoa
#include < objc/runtime.h> //objc runtime api's
 
@interface NSView (CustomAdditions)
@property(retain) NSImage *customImage;
@end
 
@implementation NSView (CustomAdditions)
 
static char img_key; //has a unique address (identifier)
 
-(NSImage *)customImage {
    return objc_getAssociatedObject(self,&img_key);
}
 
-(void)setCustomImage:(NSImage *)image {
    objc_setAssociatedObject(self,&img_key,image,
                             OBJC_ASSOCIATION_RETAIN);
}
 
@end
```

You can see the options you pass to `objc_setAssociatedObject()` in \[runtime.h\]\[11\] (translator's note: latest version \[runtime.h\]\[12\]):

``` objectivec
/* Associative References */

/**
 * Policies related to associative references.
 * These are options to objc_setAssociatedObject()
 */
enum {
    OBJC_ASSOCIATION_ASSIGN = 0,           /**< Specifies a weak reference to the associated object. */
    OBJC_ASSOCIATION_RETAIN_NONATOMIC = 1, /**< Specifies a strong reference to the associated object. 
                                            *   The association is not made atomically. */
    OBJC_ASSOCIATION_COPY_NONATOMIC = 3,   /**< Specifies that the associated object is copied. 
                                            *   The association is not made atomically. */
    OBJC_ASSOCIATION_RETAIN = 01401,       /**< Specifies a strong reference to the associated object.
                                            *   The association is made atomically. */
    OBJC_ASSOCIATION_COPY = 01403          /**< Specifies that the associated object is copied.
                                            *   The association is made atomically. */
};
```

These line up with the options you'd pass through `@property`.

#### Mixed vtable dispatch

If you look at the Modern runtime code, you'll find this in [objc-runtime-new.m]() (translator's note: the latest source is now \[objc-runtime-new.mm\]\[14\] and this feature has been removed; I found that support disappeared starting in \[objc4-551.1\]\[15\]. You can still use this section to study earlier implementations):

``` objectivec
/***********************************************************************
* vtable dispatch
* 
* Every class gets a vtable pointer. The vtable is an array of IMPs.
* The selectors represented in the vtable are the same for all classes
*   (i.e. no class has a bigger or smaller vtable).
* Each vtable index has an associated trampoline which dispatches to 
*   the IMP at that index for the receiver class's vtable (after 
*   checking for NULL). Dispatch fixup uses these trampolines instead 
*   of objc_msgSend.
* Fragility: The vtable size and list of selectors is chosen at launch 
*   time. No compiler-generated code depends on any particular vtable 
*   configuration, or even the use of vtable dispatch at all.
* Memory size: If a class's vtable is identical to its superclass's 
*   (i.e. the class overrides none of the vtable selectors), then 
*   the class points directly to its superclass's vtable. This means 
*   selectors to be included in the vtable should be chosen so they are 
*   (1) frequently called, but (2) not too frequently overridden. In 
*   particular, -dealloc is a bad choice.
* Forwarding: If a class doesn't implement some vtable selector, that 
*   selector's IMP is set to objc_msgSend in that class's vtable.
* +initialize: Each class keeps the default vtable (which always 
*   redirects to objc_msgSend) until its +initialize is completed.
*   Otherwise, the first message to a class could be a vtable dispatch, 
*   and the vtable trampoline doesn't include +initialize checking.
* Changes: Categories, addMethod, and setImplementation all force vtable 
*   reconstruction for the class and all of its subclasses, if the 
*   vtable selectors are affected.
**********************************************************************/
```

The idea here is that the runtime tries to cache the selectors you've recently called to speed your app up — it uses fewer instructions than going through `objc_msgSend`. This `vTable` stores the 16 most globally invoked selectors. Read down a bit further in the source and you'll see the default selectors for both GC and non-GC apps:

``` objectivec
static const char * const defaultVtable[] = {
    "allocWithZone:", 
    "alloc", 
    "class", 
    "self", 
    "isKindOfClass:", 
    "respondsToSelector:", 
    "isFlipped", 
    "length", 
    "objectForKey:", 
    "count", 
    "objectAtIndex:", 
    "isEqualToString:", 
    "isEqual:", 
    "retain", 
    "release", 
    "autorelease", 
};
static const char * const defaultVtableGC[] = {
    "allocWithZone:", 
    "alloc", 
    "class", 
    "self", 
    "isKindOfClass:", 
    "respondsToSelector:", 
    "isFlipped", 
    "length", 
    "objectForKey:", 
    "count", 
    "objectAtIndex:", 
    "isEqualToString:", 
    "isEqual:", 
    "hash", 
    "addObject:", 
    "countByEnumeratingWithState:objects:count:", 
};
```

#### So how would you know when you're hitting this?

While debugging, you'll sometimes see some of the methods I'm about to describe in your call stack. Treat them the same as `objc_msgSend()` — they're debugging artifacts. Specifically:

1.  `objc_msgSend_fixup` shows up when the runtime is inserting one of the methods you're calling into the vTable.

2.  `objc_msgSend_fixedup` shows up when the method you're calling *should* be in one of the vTable slots `objc_msgSend_vtable[0-15]` but isn't.

3.  You might see something like `objc_msgSend_vtable5`, which means you're calling a method in the vTable. The runtime can rearrange the vTable as needed, so don't assume that the `objc_msgSend_vtable10` you saw on this iteration of the loop maps to `-length`, and that it'll still be `-length` on the next iteration. (The vTable is constantly shifting.)

Translator's note: see [\[objc explain\]: objc\_msgSend\_vtable](http://www.sealiesoftware.com/blog/archive/2011/06/17/objc%5C_explain%5C_objc%5C_msgSend%5C_vtable.html)

#### Wrap-up

I hope you enjoyed this. This post is based on my conversations with Des Moines Cocoaheads about the Objective-C runtime (the chats could fill a small basket). The Objective-C runtime is a remarkable piece of engineering — it powers the Cocoa/Objective-C apps we build and makes a lot of features we take for granted possible. I'd encourage you to read Apple's official Objective-C Runtime docs so you can put it to better use. Thanks.

#### References

[Objective-C Runtime Programming Guide](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Introduction/Introduction.html)
[Objective-C Runtime Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html)
