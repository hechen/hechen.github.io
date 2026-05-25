---
title: 'A bit about Category in Objective-C'
slug: 'objective-c中category的一点东西'
date: 2015-09-14T15:36:07+00:00
draft: false
categories: ['ios', 'leetcode', 'translation']
tags: ['algorithm', 'animation', 'category', 'ios', 'notification', 'objective-c', 'push', 'runtime', 'string', 'tree']
---

A category in Objective-C is a compile-time mechanism that lets you tack extra methods onto an existing class. There's one catch: you can't add new instance variables this way.

Here's the setup. `MyClass` is a trivial class with an instance method `-print`:

``` objectivec
#import <Foundation/Foundation.h>
@interface MyClass : NSObject

- (void)print;

@end
```

``` myclass
#import "MyClass.h"
@implementation MyClass

- (void)print
{
    NSLog(@"MyClass...");
}

@end
```

Say we want to add another method, `hello`, to `MyClass`. We can do it with categories. Let's add two — `MyAddition1` and `MyAddition2`:

``` objectivec
#import "MyClass.h"
@interface MyClass (MyAddition1)

@property (nonatomic, copy) NSString *name;
- (void)hello;
@end
```

``` objectivec
#import "MyClass+MyAddition1.h"

@implementation MyClass (MyAddition1)

- (void)hello
{
    NSLog(@"hello!!!");
}

@end
```

`MyAddition1` is the category name, and the file naming convention is `ClassName+CategoryName`. With that in place we can call the new method on `MyClass`:

``` objectivec
#import "MyClass+MyAddition1.h"

int main() {
    //...
    MyClass my = [MyClass new];
    [my hello];
    //...
}
```

Categories typically show up in a few situations:

1.  Requirements shift and you need to add methods to an existing class.
2.  You want to split a class's implementation into chunks: (a) splitting the implementation across multiple files, or (b) handing different feature areas off to different developers via separate category files.
3.  You want to add your own methods to Apple's foundation classes — basically the same as (1).

A couple of things to watch out for, though:

1.  A category can read the original class's instance variables, but it can't add new ones.
2.  If a category implements a method with the same signature as one in the original class, it overrides the original.

Both of these have workarounds.

### Adding instance variables in a category

You add instance variables to a category using associated objects:

``` objectivec
#import "MyClass.h"
@interface MyClass (MyAddition1)

@property (nonatomic, copy) NSString *name;

@end
```

``` objectivec
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

#### Calling the original method that a category overrode

If you actually dig into the Objc runtime source, you find that a category method doesn't truly *replace* the original — it just gets looked up first because of how the method list is ordered. This is where Objc runtime internals come in.

In the runtime source, `objc-runtime-new.mm` contains `attachCategoryMethods`, which is what splices category methods into the class's method list:

``` objectivec
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

So `attachCategoryMethods` stitches all of the category instance-method lists together into one bigger `mlists`, then hands that off to `attachMethodLists`:

``` objectivec
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

Notice the comment "copy old methods to the method list array" — the class's original methods get *appended* to the end of the new list. So if a category and the original class both define `methodA`, the merged `newLists` ends up holding two `methodA` entries. At runtime, method lookup walks the list in order and returns the first matching signature it finds. The original method, sitting at the end, ends up "covered" by the category's same-signature method that's now in front of it.

What about when more than one category overrides the same method? That comes down to the file compile order — try it for yourself if you're curious. About that compile order...

![XCode文件编译顺序调整](http://7xilk1.com1.z0.glb.clouddn.com/iosXCode%e7%bc%96%e8%af%91%e9%a1%ba%e5%ba%8f%e8%b0%83%e6%95%b4.png)

Once you understand all that, calling the original (overridden) method becomes straightforward: walk the class's instance method list looking for the matching signature. The entries at the front are from categories; the last one is the original `MyClass` method.

``` objectivec
#import <Foundation/Foundation.h>
@interface MyClass : NSObject

- (void)print;

@end
```

``` objectivec
#import "MyClass.h"

@implementation MyClass

- (void)print {
    NSLog(@"MyClass");
}

@end
```

Add the `MyAddition1` category to `MyClass`:

``` objectivec
#import "MyClass.h"

@interface MyClass (MyAddition1)

- (void) print;

@end
```

``` objectivec
#import "MyClass+MyAddition1.h"

@implementation MyClass (MyAddition1)

- (void)print {
    NSLog(@"MyAddition1");
}

@end
```

Then add a `MyAddition2` category:

``` objectivec
#import "MyClass.h"

@interface MyClass (MyAddition2)

- (void) print;

@end
```

``` objectivec
#import "MyClass+MyAddition2.h"

@implementation MyClass (MyAddition2)

- (void)print {
    NSLog(@"MyAddition2");
}

@end
```

Now once everything is compiled we can pull out all of `MyClass`'s methods, like this:

``` objectivec
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

The code grabs the class's method list, finds the *last* entry with that name, retrieves its function pointer, and invokes it.

The output:

``` objectivec
2015-09-14 15:26:59.793 ObjMessage[88888:10428876] MyAddition2
2015-09-14 15:26:59.794 ObjMessage[88888:10428876] methodName: print
2015-09-14 15:26:59.795 ObjMessage[88888:10428876] methodName: print
2015-09-14 15:26:59.795 ObjMessage[88888:10428876] methodName: print
2015-09-14 15:30:38.941 ObjMessage[88888:10428876] MyClass
```

Calling `print` runs the `MyAddition2` implementation. The `MyClass` method list has three `print` methods on it, and pulling out the last one and invoking it gives us the original `MyClass` implementation — exactly what we were after. As an extra exercise, you can swap the build order of `MyClass+MyAddition1.m` and `MyClass+MyAddition2.m` and verify it for yourself; the default output will become `MyAddition1`.
