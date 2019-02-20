---
title: "理解Objective-C运行时"
date: 2015-09-07 17:55:33
categories: ["Translation"]
top_img: https://i.imgur.com/5SKmTN3.png
tags: ["iOS","Objective-C","Runtime"]
---


Objective-C 运行时对于刚刚踏入 Cocoa/Objective 世界的人是很容易忽
略的 Objective-C 语言的特性之一。原因就是尽管 Objective-C 是一门几个小时之内入门的语言，但是投身 Cocoa 的新手们会花费大量时间在 Cocoa 框架中，试图搞清楚他到底是怎么工作的。<!-- more --> 我觉得每个开发者都应该对其有深入的了解，明白一些内部的实现细节，而不仅仅只知道代码 `[target doMethodWith:var]` 会被编译器转换成 `objc_msgSend(target,@selector(doMethodWith:),var1);` 而已。了解 Objective-C 运行时的原理有助于你对 Objective-C 语言有更深入的理解，清楚你得 App 是怎么运行的。我觉得这对无论是 Mac/iPhone 新手或者老手都会有所帮助。


[TOC]

#### Objective-C运行时是开源的

Objective-C 运行时是开源的，你可以随时从 [Apple](http://opensource.apple.com) 获取到。实际上查看 Objective-C 运行时源码是我搞清楚这个语言是怎么运作的首选方法，而不是去查看和它相关的苹果文档。你可以到[这里](http://opensource.apple.com/tarballs/objc4/objc4-437.1.tar.gz) 下载到运行时的源码（截止到译者翻译的时候，最新版本的文件是objc4-647.tar.gz）。

#### 动态 Vs. 静态

Objective-C 是一门动态的面向对象语言，这意味着它可以将编译链接时决定的事情推迟到运行时进行。这就给了你很大的灵活性，你可以按照自己的需要重定向消息到适当的对象上，你甚至可以交换方法实现（译者注：method swizzling，方法调配，开发者常用此技术向原有实现中添加新功能）。而运行时可以使对象明白自己可以响应哪些消息，不能响应哪些消息（译者注：introspect 内省），并正确的派发消息。

> 译者注： 内省（introspection）是面向对象语言和环境的一个强大特性，Objective-C和Cocoa在这个方面尤其的丰富。内省是对象揭示自己作为一个运行时对象的详细信息的一种能力。这些详细信息包括对象在继承树上的位置，对象是否遵循特定的协议，以及是否可以响应特定的消息。NSObject协议和类定义了很多内省方法，用于查询运行时信息，以便根据对象的特征进行识别。
> 
> 参考: [Objective-C 的 Introspection](https://developer.apple.com/library/archive/documentation/General/Conceptual/CocoaEncyclopedia/Introspection/Introspection.html)

我们将这些特征和C语言进行对比来看，在C中，你从`main()`函数开始，然后按顺序从上往下写你的代码逻辑或者执行函数方法。C结构体是无法将请求转发到其他目标对象来执行方法的。你很可能写了如下类似的代码：

``` objc
#include < stdio.h >
 
int main(int argc, const char **argv[]) {
    printf("Hello World!");
    return 0;
}
```

编译器解析、优化然后将优化后的代码转换成如下的汇编语言：

``` objc
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

然后将其和C库链接生成可执行文件。相比之下，Objective-C语言整个过程和上面类似，不过代码的产生依赖Objective-C运行时的具体表现（译者注：运行时按照不同情况，生成不同的代码吧）。当我们刚接触Objective-C语言的时候，我们可能被告知像如下代码

``` objc
[self doSomethingWithVar:var1];
```
会被转换成

``` objc
objc_msgSend(self,@selector(doSomethingWithVar:),var1);
```
而除了这些，我们似乎就不清楚运行时还干了什么。


#### 什么是 Objective-C 运行时？

Objective-C Runtime 是一个运行时库，主要是由C语言和汇编语言写成，为 C 语言添加面向对象的能力而创造了 Objective-C（译者注：正是 OC Runtime，才有 OC 这门语言）。这意味着它可以加载类信息，进行方法派发以及方法转发等等。Objective-C 运行时最重要的就是为Objective-C语言的面向对象特性的实现提供了所有的基础支撑。

#### Objective-C 运行时术语

在我们进一步了解整个运行时之前，需要先了解一些接下来出现的术语。截至目前Mac和iPhone的开发者关心的有两个运行时：Modern Runtime & Legacy Runtime 。前者覆盖所有64位Mac OS X 的app和所有的iOS app，后者覆盖其余的（全部的Mac OS X 32位 App）。关于方法，这里有两种基本类型的方法，一种是实例方法（'-'开头， 例如`-(void)doFoo`，作用于对象实例），另一种是类方法（'+'开头，例如`+(id)alloc`）。方法就像C语言中的函数类似，一段代码完成一个小的任务，如下：

``` objc
- (NSString *)movieTitle {
    return @"Futurama: Into the Wild Green Yonder";
}
```
**Selector**  
Objective-C中的Selector（选择子）是一个重要的C数据结构，用以标识你要一个对象执行的Objective-C方法。在运行时中，Selector的定义应该和下面这样类似：

``` objc
typedef struct objc_selector  *SEL; 
```

用法就像下面这样：

``` objc
SEL aSel = @selector(movieTitle); 
```


**Message**

``` objc
[target getMovieTitleForObject:obj];
```

Objective-C中的方法由两个方括号[]组成，括号中间是你将要将消息发往的目标对象和你将要该对象执行的方法以及所需要发送的参数列表。Objective-C中的消息和C函数类似，但是又不同。你向一个对象发送消息并不意味着该对象就一定会执行它。这个对象会检查该消息的发送者，然后基于该发送者要么执行一个不同的方法或者将该消息转发给另外的不同的对象。

**Class**
如果你看过Runtime中关于类的定义信息，你可能会遇到这样的定义：

``` objc
typedef struct objc_class *Class;
typedef struct objc_object {
    Class isa;
} *id; 
```

这其中有一些事情要注意。
每一个Objective-C类拥有一个结构体，每一个对象也有一个结构体。所有的对象都包含一个isa指针。所有的Objective-C运行时需要这个isa指针，用以检查一个对象具体的类型是什么，然后判别其是否能够响应你所派发过来的消息。
最后我们还注意到了id指针，这个id指针仅仅告诉我们其指向的是Objective-C对象，仅此而已。当你拥有一个id指针，你可以查询该对象的类型，然后查看该类型是否可以响应某个方法等等。还有就是当你知道了当前所指向的具体对象的具体类别，你就可以做出更具体的动作。


**Blocks** 

你也可以在LLVM/Clang文档中对Blocks 的定义中发现和上面类似的东西。

``` objc
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

Blocks被设计成能够与Objective-C运行时兼容，因此它们可以被当做对象处理，并可以响应消息（像`-retain`, `-release`, `-copy`等）。

**IMP**（Method Implementations）

``` objc
typedef id (*IMP)(id self,SEL _cmd,...); 
```

IMP是编译器生成的函数指针，指向方法执行处。如果你刚接触Objective-C语言，你不需要直接和这些东西打交道，但是慢慢深入之后接触的就多了。后面我们会看到这也是Objective-C运行时唤醒方法的方式。


**Objective-C Classes** 

Objective-C 的类内部有些什么东西呢？一个Objective-C的类的样子大体如下：

``` objc
@interface MyClass : NSObject {
    // vars
    NSInteger counter;
}
// methods
-(void)doFoo;
@end
```

但是运行时还会追加更多的内容以便跟踪（类每一时刻的状态）。

``` objc
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
我们可以看到一个类中包含一个指向其父类的引用，该类的名字、实例变量、方法集合、缓存以及该类遵循的协议列表。运行时需要这些信息以便响应那些分发到该类或者类实例对象上得方法。

#### 因此类定义了对象而不是对象本身，那这又是如何实现的？

正如我前面说过的，Objective-C类本身也同样是对象（译者注：意味着你可以向一个类发送消息），运行时通过创建元类来处理它们。当你发送类似`[NSObject alloc]`的消息时，你实际上是向类对象发送了消息，而这个类对象需要是**元类**的实例，而元类本身又是**根元类**的一个实例。
当你说一个类继承自NSObject，那就意味着你的类指向NSObject作为其父类。而所有的元类指向根元类作为它们的父类，所有的元类都仅包含那些它能够响应的消息中的类方法。所以当你向一个类对象发送消息，例如`[NSObject alloc]`的时候，`objc_msgSend()`实际上会查看元类来确定该对象是否能够响应该消息，那如果找到了一个能响应该消息的方法，就在该对象上执行它。

> 译者注：Objective-C类体系结构图如下所示：![ios-runtime-class](https://i.imgur.com/D7GUGKB.png)




#### 为什么我们都要继承自Apple的类呢？

当你刚踏入Cocoa开发的时候，很多代码例子都告诉你这样做：先继承NSObject类然后再进行其他编码。你也乐在其中，确实享受到了很多继承自Apple类所提供的便利。但是你甚至可能都没有发现实际上你的类在和Objective-C运行时打交道。当你为我们的类实例化的时候，像这样：

``` objc
MyObject *object = [[MyObject alloc] init];
```

第一个你要执行的消息就是`+alloc`。如果你[查看文档][6]，里面会讲到“一个新生实例的isa实例会被初始化为一个描述该类信息的数据结构，其余的实例变量的内存均被设置为空。”所以通过继承自Apple的类，我们不仅继承了一些很棒的属性，同时也继承了这些在内存上分配空间（大小是我们类的大小），创建对象的能力（就是创建运行时所期望的带有isa指针的数据结构）。

#### 类缓存（objc\_cache\* cache）是什么？
当Objective-C运行时通过一个对象的isa指针检查对象的时候，它会找到能够执行很多方法的类。然后你只需要调用其中很小一部分，所以每次运行时在进行一次查询动作时需要查找类分发表中所有的selectors这个动作是毫无意义的。这就是为什么类会由cache这个东西，当你查询一个类体系中的派发表的时候，一旦找到对应的selector时，就将该selector放到cache中。当`objc_msgSend()`方法在一个类中查询selector时，会先在cache中查找，这个理论的基础就是如果你曾经调用过一个类的消息，你有很大可能在之后还调用同样的方法。（译者注：CACHE的局部性原理）。所以按照这样考虑，如果我们先在有一个NSObject的子类MyObject如下：


``` objc
MyObject *obj = [[MyObject alloc] init];
 
@implementation MyObject
-(id)init {
    if(self = [super init]) {
        [self setVarA:@”blah”];
    }
    return self;
}
@end
```

具体发生了以下几点：
1. `[MyObject alloc]`首先被执行，MyObject类没有实现该方法，因此在该类中没有找到`+alloc`方法，接着顺着superclass指针找到其父类`NSObject`；
2. 我们询问`NSObject`类是否能够响应`+alloc`方法，而它能够响应。`+alloc`方法检查接受者类（也就是`MyObject`），分配该类大小的一块内存空间，然后初始化其isa指针指向`MyObject`类，此时我们拥有一个实例了，同时稍早我们将`+alloc`方法放置于`NSObject`的类缓存（cache）中；
3. 到目前为止，我们都是在发送类方法，此刻我们需要向一个实例对象发送消息，这里简单的调用`-init`方法或者指定初始化方法（designated initializer），当然我们的类实现了该方法，因此我们将`-(id)init`方法放置于cache中；
4. 接下来`self = [super init]`被调用，`super`是一个神奇的关键字（**magic keyword**），其指向类的父类，也即`NSObject`，我们调用`NSObject`的`init`方法。这样做的目的是为了确保面向对象编程的集成体系能够正确运行，在你正确初始化自身变量之前需要先初始化该类的所有父类的变量，如果你需要，你还可以覆写父类的方法。在该例中，对于NSObject类来说并没有多少特别重要的操作要进行，不过这并不是常态。有时候初始化中会做非常重要的事情，考虑以下代码：

``` objc
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


如果你是刚刚接触Cocoa，我让你猜以上代码打印结果是什么，你很可能会给出这样的结果：

``` objc

NSMutableArray
NSMutableArray 
NSArray
NSArray
MyObject
MyObject

```

但实际上是如下结果：

``` objc 

obj1 class is __NSPlaceholderArray
obj2 class is NSCFArray
obj3 class is __NSPlaceholderArray
obj4 class is NSCFArray
obj5 class is MyObject
obj6 class is MyObject

```

> 译者注：（本机XCode 7 beta6 运行结果如下：）

``` objc
2015-09-07 13:43:06.922 ObjMessage[5185:1441448] obj1 class is __NSPlaceholderArray
2015-09-07 13:43:11.201 ObjMessage[5185:1441448] obj2 class is __NSArrayM
2015-09-07 13:43:17.987 ObjMessage[5185:1441448] obj3 class is __NSPlaceholderArray
2015-09-07 13:43:18.503 ObjMessage[5185:1441448] obj4 class is __NSArrayI
2015-09-07 13:43:32.228 ObjMessage[5185:1441448] obj5 class is MyObject
2015-09-07 13:43:33.478 ObjMessage[5185:1441448] obj6 class is MyObject
```


原因就是Objective-C语言这里使用`+alloc`方法返回某个类的对象，但随后`-init`方法又可能返回另一个类的对象。

#### 那 objc\_msgSend 方法都发生了什么呢？

实际上`objc_msgSend()`方法内部发生了许多事情。如下我们有这样的代码：

``` objc
[self printMessageWithString:@"Hello World!"];
```

编译器会把其翻译成如下所示代码：

``` objc

objc_msgSend(self, @selector(printMessageWithString:), @"Hello World!");

```
我们通过目标对象的isa指针来查询该类或者其继承体系中的父类是否能够响应 `@selector(printMessageWithString:)`。假设我们在类的派发表或者它的cache中找到了该selector，然后我们通过该函数指针来执行该方法。因此我们可以了解`objc_msgSend()`方法永远不会返回，它从执行开始，通过指针查找到你的方法执行，然后是你的方法执行之后返回，因此看起来好像`objc_msgSend()`方法返回似的。Bill Bumgarner对此过程有更多的细节探索（[Part 1](http://www.friday.com/bbum/2009/12/18/objc_msgsend-part-1-the-road-map), [Part 2](http://www.friday.com/bbum/2009/12/18/objc_msgsend-tour-part-3-the-fast-path) & [Part 3](http://www.friday.com/bbum/2009/12/18/objc_msgsend-tour-part-2-setting-the-stage)）。

我这里总结下他所讲的，也就是你会在运行时代码中看到的：
1. 检查那些忽略掉的Selectors和Short Circut， 很明显如果我们运行在垃圾回收环境下，我们可以忽略掉针对`-retain`，`-release`等的调用；

2. 检查那些nil的目标。不像其他语言，Objective-C中向nil派发消息是合法的。当然你肯定也有很多理由希望这样。这里假设我们有一个非空的目标；

3. 接下来我们需要在该类中找到IMP，我们首先查找该类的缓存（cache），如果找到我们便通过缓存中的指针跳转到该函数执行处；

4. 如果缓存中没有找到该IMP，我们便紧接着查找类的派发表（dispatch table），如果找到同样跳转到函数执行处；

5. 如果类的派发表中也未找到我们就需要触发消息分发机制了，这意味着最终你得代码会被编译器转换成了C函数。因此一个如下方法：

``` objc
-(int)doComputeWithNum:(int)aNum 
```

会被转换成如下：
 
``` objc
int aClass_doComputeWithNum(aClass *self,SEL _cmd,int aNum) 
```

Objective-C运行时通过触发指向这些方法的函数指针来调用你的方法。告诉你，你没法直接调用这些转换之后的方法，尽管Cocoa框架确实提供了能够获取这些指针的方法。

``` objc
//declare C function pointer
int (computeNum *)(id,SEL,int);
 
//methodForSelector is COCOA & not ObjC Runtime
//gets the same function pointer objc_msgSend gets
computeNum = (int (*)(id,SEL,int))[target methodForSelector:@selector(doComputeWithNum:)];
 
//execute the C function pointer returned by the runtime
computeNum(obj,@selector(doComputeWithNum:),aNum); 
```
通过这个方法，你可以获取到在运行时直接获取该方法并调用它。甚至在你确认一个指定的方法需要被执行的时候可以绕过运行时机制。这也是Objective-C运行时如何调用你的方法的，但还是使用`objc_msgSend()`方法为好。

#### Objective-C 消息转发

在Objective-C中，向一个根本不知道怎么响应方法的对象发送方法是合法的（也可能是该语言内部设计哲理）。Apple这样做的其中一个原因就是模拟Objective-C语言原生不支持的多重继承。或者你也许想抽象化自己的设计，隐藏该消息响应背后的其他类或者对象。这对于运行时系统也是非常必要的。它的工作流程大体是这样：

1. 运行时在该类或者其继承体系中的缓存中和派发表中查找，然后查找失败；

2. Objective-C运行时在所属对象的类上调用`+ (BOOL) resolveInstanceMethod:(SEL)aSEL`类方法，该类给予你一次机会来新增一个处理选择子`aSEL`的方法，然后告诉运行时你已经解决了该方法，消息转发机制会找到该方法。

如下示例，你定义了一个函数：

``` objc
void fooMethod(id obj, SEL _cmd) {
    NSLog(@"Doing Foo");
}
```

你可以使用`class_addMethod()`方法类解决它：

``` objc
+(BOOL)resolveInstanceMethod:(SEL)aSEL {
    if(aSEL == @selector(doFoo:)) {
        class_addMethod([self class],aSEL,(IMP)fooMethod,"v@:");
        return YES;
    }
    return [super resolveInstanceMethod];
}
```

其中方法`class_addMethod()`中的`v@:`标明了方法的返回类型以及其参数类型。你可以在运行时文档中[Type Encodings][10]分查看到详细的说明。

3. 如果2中`+(BOOL)resolveInstanceMethod:(SEL)aSEL`返回NO表示无法解析该方法的话，运行时接着调用`- (id)forwardingTargetForSelector:(SEL) aSelector`来给你再一次机会是否能够将该消息转发给其他接收者来处理。这要比之后运行完整的消息转发`- (void)forwardInvocation:(NSInvocation *)anInvocation`要好。你可以这样执行：

``` objc
- (id)forwardingTargetForSelector:(SEL)aSelector {
    if(aSelector == @selector(mysteriousMethod:)) {
        return alternateObject;
    }
    return [super forwardingTargetForSelector:aSelector];
}
```

很明显，你肯定不想返回 self，否则会引起死循环。

4. 如果上一步没有找到合适的目标对象来执行上面的消息，接着运行时会尝试最后一步 `- (void)forwardInvocation:(NSInvocation *)anInvocation`。你可能没见过NSInvocation，它实际上是Objective-C语言中的消息类型。一旦你有一个NSInvocation，你基本上能够改变这个消息的任何东西，包括其目标、选择子以及参数。所以你可以这样做：

``` objc
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
默认情况下，如果你继承自NSObject类，它所实现的`- (void)forwardInvocation:(NSInvocation *)anInvocation`内部仅仅简单的调用了`-doesNotRecognizeSelector:`方法，如果你想给自己最后一次机会做一些事情的话，你可以重载该方法。


#### Non Fragile ivars (Modern Runtime)

一个Modern Runtime新增加的概念就是Non Fragile ivars。当编译器编译我们的类时，编译器会生成一个变量布局来显示每次我们从什么位置去取我们的实例变量，其底层的实现细节是这样的，查看类成员变量和类对象指针指向位置的偏移，读取该变量大小的字节就可以将该变量读取出来。所以你得变量布局可能如下所示，左侧列标明字节偏移量：

![NSObject 布局](https://i.imgur.com/35waSjN.png)


这里我们有NSObject类型的变量布局，然后我们继承NSObject来扩展它，并添加自己的变量，这在Apple发布新版本OSX SDK之前都运行良好。

![NSObject 布局](https://i.imgur.com/xPo1FAw.png)

我们的代码就无法正常运行，我们自定义对象中的内容被擦出了，因为NSObject增加了两个成员变量，而MyObject类成员变量布局在编译时已经确定，有两个成员变量和基类的内存区域重叠。唯一能够阻止这个发生的就是Apple维持它之前的布局策略，但是一旦这样他们的框架就无法再往前发展了，因为它们的变量布局已经固化了。在这种情况下（也就是fragile ivars）你只能通过重新编译这些继承自Apple类的类来使得代码得以兼容。那在 non fragile ivars下会发生什么呢？

![NSObject 布局](https://i.imgur.com/w9Fxvpa.png)

在Non Fragile ivars下编译器虽然生成了和fragile ivars同样的布局，但是运行时会通过计算基类大小，动态调整MyObject类成员布局。结果如上图所示。

#### Objective-C 关联对象

最近引入Mac OS X 10.6系统有一个特性称作“关联引用”。Objective-C不像其他语言，其原生不支持向对象动态添加变量。所以到目前为止，你都必须要费很大的劲，编译整个体系结构来假装自己向类中添加一个变量。不过在Mac OS X 10.6系统中，Objective-C 运行时原生支持（动态添加变量）。如果我们想向每一个已经存在的类中添加一个变量，例如向NSView类中添加，如下所示：

``` objc
#import < Cocoa/Cocoa.h> //Cocoa
#include < objc/runtime.h> //objc runtime api’s
 
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

你可以在[runtime.h][11]，（译者注：最新版 [runtime.h][12]）文件中看到向`objc_setAssociatedObject()`传递的几个选项：

``` objc
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

这些和你通过`@property`方式传递的选项相吻合。

#### 混合的虚表派生
如果你查看Modern runtime 代码，你会在[objc-runtime-new.m]()（译者注： 最新版objc runtime源码为[objc-runtime-new.mm][14] 已经去掉了这个特性，译者发现从[objc4-551.1][15]版本开始就不支持了，不过读者还是可以借鉴下之前版本的实现方式。）中发现这个：

``` objc
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

这背后的原理就是，运行时试图去存储你最近调用过的选择子（selector）以便能够为你的App加速，因为其比`objc_msgSend`方法使用更少的指令。这个`vTable`存储你最近全局调用的16个选择子，实际上，在代码文件往下接着看你就会看到垃圾回收和非垃圾回收类型的App的默认选择子（selectors）。
 
``` objc
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


#### 因此你如何能知道你正在和它打交道呢？
当你进行调试的时候，你会在你的调试栈中看到稍后讲解到的某些方法的身影。你就把这些方法按照`objc_msgSend()`方法来对待就行，不过这些方法都是为了调试，具体有如下几个方法。
1.  当运行时正在将你所有调用的这些方法中的其中一个插入到虚表（vTable）中时，会调用`objc_msgSend_fixup`。

2. 而当`objc_msgSend_fixedup`发生时，表明你当前所调用的一个方法本应该存在于虚表中`objc_msgSend_vtable[0-15]`的位置，但却并不在

3. 你可能会看到`objc_msgSend_vtable5`类似的东西，其意味着你正在调用虚表中的一个方法。运行时可以根据需要动态调整虚表中的内容。因此你不应该期望这次代码循环调用的`objc_msgSend_vtable10`对应了`-length`方法，而之后每次代码循环还依然会这样。（因为vTable也在不断变化中）

译者注：参考[[objc explain]: objc\_msgSend\_vtable](http://www.sealiesoftware.com/blog/archive/2011/06/17/objc\_explain\_objc\_msgSend\_vtable.html)

#### 总结

我希望你们能够喜欢以上这些东西，这篇文章主要讲述了我和Des Moines Cocoaheads关于Objective-C runtime的谈话（我们的讨论估计能打包一箩筐）。Objective-C Runtime是一项很了不起的工程，它为我们Cocoa/Objective-C下制作的Apps注入能量，使得我们能够实现很多我们认为理所当然的特性。希望你能够看一看Apple官方文档对Objective-C运行时的讲解，这样能够使你更好的利用Objective-C运行时。谢谢。



####  参考链接
[Objective-C Runtime Programming Guide](https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Introduction/Introduction.html)
[Objective-C Runtime Reference](https://developer.apple.com/library/mac/documentation/Cocoa/Reference/ObjCRuntimeRef/index.html)