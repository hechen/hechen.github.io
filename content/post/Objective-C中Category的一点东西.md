---
title: "Objective-C中Category的一点东西"
date: 2015-09-14 15:36:07
categories: ["iOS"]
tags: ["iOS","Category"]
---

Objective-C中的分类（category）是一种编译时的手段，其允许我们通过给某个已知类添加方法来扩充该类的一种方式。当然这其中是有限制的，就是不能给已知类添加新的实例变量。

<!-- more -->


如下代码展示：

类`MyClass`为一个简单的类，其中有实例方法 `-print` 

``` objc
#import <Foundation/Foundation.h>
@interface MyClass : NSObject

- (void)print;

@end
```

``` MyClass.m
#import "MyClass.h"
@implementation MyClass

- (void)print
{
	NSLog(@"MyClass...");
}

@end
```

我们向为MyClass再添加一个方法Hello，那我们就可以用分类的方法实现，我们为其添加分类MyAddition1和MyAddition2，如下所示：

``` objc
#import "MyClass.h"
@interface MyClass (MyAddition1)

@property (nonatomic, copy) NSString *name;
- (void)hello;
@end
```

``` objc
#import "MyClass+MyAddition1.h"

@implementation MyClass (MyAddition1)

- (void)hello
{
	NSLog(@"hello!!!");
}

@end
```
其中MyAddition为分类的名称，而文件名字约定俗成用“类名+扩展名”的形式。这样，我们就能够为MyClass类添加hello方法了，如下调用：

``` objc
#import "MyClass+MyAddition1.h"

int main() {
	//...
	MyClass my = [MyClass new];
	[my hello];
	//...
}
```
 
Category 的使用场景主要有以下几种：
1. 需求变更，需要为已知类添加方法；
2. 将类的不同模块实现划分: a)具体可以将类的实现分开到不同的文件里面； b)将不同功能的分类文件交由不同的开发者实现；
3. 想为Apple基础类库添加自己需要的方法，实际上和1相似；

但是分类的使用目前也有需要注意的地方：
1. Category可以访问原有类的实例变量，但不能添加实例变量；
2. Category中实现和原有类中相同签名的方法时，会覆盖原有类的方法；

但是这两点均可以通过其他方式实现：

### 为分类添加实例变量
为分类添加实例变量主要通过关联对象的方法。如下所示：

``` objc
#import "MyClass.h"
@interface MyClass (MyAddition1)

@property (nonatomic, copy) NSString *name;

@end
```

``` objc
#import "MyClass+MyAddition1.h"
#import <objc/objc-runtime.h>

@implementation MyClass (MyAddition1)

- (void)setName:(NSString *)name {
    objc_setAssociatedObject(self, "key", name, OBJC_ASSOCIATION_COPY);
}

- (NSString *)name {
    NSString *name = objc_getAssociatedObject(self, "key");
    return name;
}

@end
```

#### 如果调用被分类覆盖掉的原方法
实际上，通过查看Objc runtime源码可以获知，分类方法并不是绝对意义上的覆盖原有类的方法，只是在调用的时候调用顺序导致而已，这涉及到Objc runtime的一些内容。

在下载到的运行时源码中objc-runtime-new.mm文件中有attachCategoryMethods方法，其就是将类的分类方法添加到类的方法列表中去的：

``` objc
// objc-runtime-new.mm
static void 
attachCategoryMethods(Class cls, category_list *cats, bool flushCaches) {
    if (!cats) return;
    if (PrintReplacedMethods) printReplacements(cls, cats);

    bool isMeta = cls->isMetaClass();
    method_list_t **mlists = (method_list_t **)
        _malloc_internal(cats->count * sizeof(*mlists));

    // Count backwards through cats to get newest categories first
    int mcount = 0;
    int i = cats->count;
    BOOL fromBundle = NO;
    while (i--) {
        method_list_t *mlist = cat_method_list(cats->list[i].cat, isMeta);
        if (mlist) {
            mlists[mcount++] = mlist;
            fromBundle |= cats->list[i].fromBundle;
        }
    }

    attachMethodLists(cls, mlists, mcount, NO, fromBundle, flushCaches);

    _free_internal(mlists);
}
```

那`attachCategoryMethods`的工作就是将所有分类的实例方法列表进行拼接，形成更大的`mlists`表，然后转交给`attachMethodLists`方法来执行。

``` objc
static void 
attachMethodLists(Class cls, method_list_t **addedLists, int addedCount, 
                  bool baseMethods, bool methodsFromBundle, 
                  bool flushCaches) {
    rwlock_assert_writing(&runtimeLock);

    // Don't scan redundantly
    bool scanForCustomRR = !UseGC && !cls->hasCustomRR();
    bool scanForCustomAWZ = !UseGC && !cls->hasCustomAWZ();

    // There exist RR/AWZ special cases for some class's base methods. 
    // But this code should never need to scan base methods for RR/AWZ: 
    // default RR/AWZ cannot be set before setInitialized().
    // Therefore we need not handle any special cases here.
    if (baseMethods) {
        assert(!scanForCustomRR  &&  !scanForCustomAWZ);
    }

    // Method list array is nil-terminated.
    // Some elements of lists are nil; we must filter them out.

    method_list_t *oldBuf[2];
    method_list_t **oldLists;
    int oldCount = 0;
    if (cls->data()->flags & RW_METHOD_ARRAY) {
        oldLists = cls->data()->method_lists;
    } else {
        oldBuf[0] = cls->data()->method_list;
        oldBuf[1] = nil;
        oldLists = oldBuf;
    }
    if (oldLists) {
        while (oldLists[oldCount]) oldCount++;
    }
        
    int newCount = oldCount;
    for (int i = 0; i < addedCount; i++) {
        if (addedLists[i]) newCount++;  // only non-nil entries get added
    }

    method_list_t *newBuf[2];
    method_list_t **newLists;
    if (newCount > 1) {
        newLists = (method_list_t **)
            _malloc_internal((1 + newCount) * sizeof(*newLists));
    } else {
        newLists = newBuf;
    }

    // Add method lists to array.
    // Reallocate un-fixed method lists.
    // The new methods are PREPENDED to the method list array.

    newCount = 0;
    int i;
    for (i = 0; i < addedCount; i++) {
        method_list_t *mlist = addedLists[i];
        if (!mlist) continue;

        // Fixup selectors if necessary
        if (!isMethodListFixedUp(mlist)) {
            mlist = fixupMethodList(mlist, methodsFromBundle, true/*sort*/);
        }

        // Scan for method implementations tracked by the class's flags
        if (scanForCustomRR  &&  methodListImplementsRR(mlist)) {
            cls->setHasCustomRR();
            scanForCustomRR = false;
        }
        if (scanForCustomAWZ  &&  methodListImplementsAWZ(mlist)) {
            cls->setHasCustomAWZ();
            scanForCustomAWZ = false;
        }

        // Update method caches
        if (flushCaches) {
            cache_eraseMethods(cls, mlist);
        }
        
        // Fill method list array
        newLists[newCount++] = mlist;
    }

    // Copy old methods to the method list array
    for (i = 0; i < oldCount; i++) {
        newLists[newCount++] = oldLists[i];
    }
    if (oldLists  &&  oldLists != oldBuf) free(oldLists);

    // nil-terminate
    newLists[newCount] = nil;

    if (newCount > 1) {
        assert(newLists != newBuf);
        cls->data()->method_lists = newLists;
        cls->setInfo(RW_METHOD_ARRAY);
    } else {
        assert(newLists == newBuf);
        cls->data()->method_list = newLists[0];
        assert(!(cls->data()->flags & RW_METHOD_ARRAY));
    }
}
```

注意上面代码中注释copy old methods to the method list array，可以获知该类原有的方法被追加到了新方法列表的后面，因此可以了解如果category和原来的都由methodA方法，那newLists中肯定存在两个methodA方法。而运行时在查找类方法的时候是在方法列表中按序查找的，一旦发现对应签名的方法则就返回，因此被后置的原有方法自然而然就被方法列表前面的同签名方法所覆盖了。

当然，如果还有一个分类也覆盖了同样的方法，顺序又是什么样子呢？根据文件的编译顺序，有兴趣的童鞋可以尝试一下，关于编译顺序。。。

![XCode文件编译顺序调整](http://7xilk1.com1.z0.glb.clouddn.com/iosXCode编译顺序调整.png)


明白了这种情况，如果我们需要调用类的被覆盖的方法，则通过查找类的实例方法列表中对应签名的方法，在方法列表前面的自然就是分类所对应的方法，而最后一个则是MyClass的原有方法了。

``` objc
#import <Foundation/Foundation.h>
@interface MyClass : NSObject

- (void)print;

@end
```

``` objc
#import "MyClass.h"

@implementation MyClass

- (void)print {
    NSLog(@"MyClass");
}

@end
```

为MyClass添加分类MyAddition1，代码如下：

``` objc
#import "MyClass.h"

@interface MyClass (MyAddition1)

- (void) print;

@end
```

``` objc
#import "MyClass+MyAddition1.h"

@implementation MyClass (MyAddition1)

- (void)print {
    NSLog(@"MyAddition1");
}

@end
```

然后再添加`MyAddition2`分类，

``` objc
#import "MyClass.h"

@interface MyClass (MyAddition2)

- (void) print;

@end
```

``` objc
#import "MyClass+MyAddition2.h"

@implementation MyClass (MyAddition2)

- (void)print {
    NSLog(@"MyAddition2");
}

@end
```

当我们将整个文件编译之后我们就可以获得MyClass所有的方法了，如下代码所示：

``` objc
#import "MyClass.h"
#import <objc/objc-runtime.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        
        Class cls = [MyClass class];
        MyClass *my = [MyClass new];
        
        [my print];
        
        if(cls) {
            unsigned int methodCount;
            Method *methodList = class_copyMethodList(cls, &methodCount);
            
            IMP lastImp = NULL;
            SEL lastSel = NULL;
            for (NSInteger i = 0; i < methodCount; i++) {
                Method method = methodList[i];
                NSString *methodName = [NSString stringWithCString:sel_getName(method_getName(method)) encoding:NSUTF8StringEncoding];
				NSLog(@"methodName: %@", methodName);

                if([methodName isEqualToString:@"print"]) {
                    lastImp = method_getImplementation(method);
                    lastSel = method_getName(method);
                }
            }
        
            typedef void(*fn)(id, SEL);
            
            if(lastImp != NULL) {
                fn f = (fn)(lastImp);
                f(my, lastSel);
            }
            
            free(methodList);
        }
    }
    return 0;
}
```

代码内容就是将类所对应的方法列表取出，找到最后一个对应名称的方法，取得函数指针，然后传入参数执行。

输出结果如下：

``` objc
2015-09-14 15:26:59.793 ObjMessage[88888:10428876] MyAddition2
2015-09-14 15:26:59.794 ObjMessage[88888:10428876] methodName: print
2015-09-14 15:26:59.795 ObjMessage[88888:10428876] methodName: print
2015-09-14 15:26:59.795 ObjMessage[88888:10428876] methodName: print
2015-09-14 15:30:38.941 ObjMessage[88888:10428876] MyClass
```

当我们使用print方法时，打印为MyAddition2中的实现，并且MyClass类方法列表中有三个方法，并且均为print，取出列表中最后一个print并调用打印结果为MyClass类原有类中的实现。此时就达到了我们的目的。
当然，你也可以调整下MyClass+MyAddition1.m文件和MyClass+MyAddition2.m文件的顺序验证下，结果MyClass默认输出为MyAddition1.

