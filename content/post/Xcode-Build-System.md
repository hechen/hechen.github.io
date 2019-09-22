---
title: "Build Process"
date: 2019-04-25T11:30:30+08:00
categories: ["macOS"]
tags: ["Xcode", "Build", "Compile", "Preprocess"]
---


编程语言的处理过程大致会有五个阶段，其每个阶段均有对应的工具：

1. 预处理器 Preprocessor
2. 编译器 Compiler
3. 汇编器 Assembler
4. 链接器 Linker
5. 加载器 Loader


我们以一个简单的源文件，来看看具体这几个步骤都做了哪些事情。


``` c
//
//  main.m
//  MachO
//
//  Created by chen he on 2019/4/22.
//  Copyright © 2019 chen he. All rights reserved.
//

#import <stdio.h>

int main(int argc, const char * argv[]) {
    printf("Hello World.\n");
    return 0;
}
```



## 预处理器 Preprocessor

1. 符号化
2. 宏定义展开
3. 头文件引入展开



在命令行执行如下命令，我们导出输出到本地文件

``` C
xcrun clang -E helloworld.c > preprocessed.txt
```

打开 preprocessed.txt 看输出如下：

``` C
# 1 "helloworld.c"
# 1 "<built-in>" 1
# 1 "<built-in>" 3
# 361 "<built-in>" 3
# 1 "<command line>" 1
# 1 "<built-in>" 2
# 1 "helloworld.c" 2
# 1 "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include/stdio.h" 1 3 4
# 64 "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include/stdio.h" 3 4
# 1 "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include/_stdio.h" 1 3 4
# 68 "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include/_stdio.h" 3 4
# 1 "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include/sys/cdefs.h" 1 3 4


// 省略一万字

extern int __vsnprintf_chk (char * restrict, size_t, int, size_t,
       const char * restrict, va_list);
# 412 "/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include/stdio.h" 2 3 4
# 2 "helloworld.c" 2

int main(int argc, char *argv[])
{
    printf("Hello World!\n");
    return 0;
}
```

可以看到预编译处理之后的源文件，仅仅只有几行的源文件进行头文件展开之后能增加到几百行，而我们仅仅只引入了 `stdio.h` 一个头文件。当然，你可以使用 Xcode 来执行预处理命令。

![xcode_preprocess](https://i.imgur.com/vmwexNC.png)

而在 Swift 提出的同时，Module 的概念被同时引入 C 系语言中，在 Xcode 的 `build settings` 中能找到其开关。

![enable_module](https://i.imgur.com/lUGiInP.png)

Modules 默认是开启的（当然这个开关也只是针对 C 系语言，Swift 原生就是以 Module 形式存在的），大家可以在开启的情况下再进行预处理命令看结果，已经由原来的 548 行减少到了 14 行，这也是 `LLVM` 极力推荐 Module 的其中一个原因，大大减少了预编译处理时间。

``` C
# 1 "/Users/chen/Desktop/Share/Code/MachO/MachO/1/helloworld.m"
# 1 "<built-in>" 1
# 1 "<built-in>" 3
# 374 "<built-in>" 3
# 1 "<command line>" 1
# 1 "<built-in>" 2
# 1 "/Users/chen/Desktop/Share/Code/MachO/MachO/1/helloworld.m" 2
# 10 "/Users/chen/Desktop/Share/Code/MachO/MachO/1/helloworld.m"
@import Darwin.libc;

int main(int argc, const char * argv[]) {
    printf("Hello World.\n");
    return 0;
}
```

当进行预处理完成之后，下一步就是基于展开的源码进行 AST 语法树解析，生成中间代码，并且输出目标机器代码的过程。这就是编译器做的事情。

## 编译器 Compiler

编译器自身就是个二进制程序，用来将代码源文件转换成语义上完全一致的等价语言的，该等价语言就是机器码（machine code）。目前在 Apple 的生态里完成这件事情的就是 LLVM（出现就是为了替换掉 GCC）。我们平时所说的编译器实质上是一个广义上的概念，其还包括编译器前端，中间代码生成器，代码优化器，编译器后端。

以目前 Apple 生态下编译器（核心是 LLVM 套件）进行细化之后，可以看到详细的划分阶段如下所示。

![LLVM](https://i.imgur.com/fTwjs0q.png)


其中 Clang 以及 swiftc / swift 实质上是 LLVM 编译链条中的前端，虽然是前端，但是目前工具集本身已经内置了一些注入汇编器，代码优化等功能。

无论是 Clang 还是 swiftc 最终都会在编译前端将源文件生成中间代码 LLVM Intermediate representation （LLVM IR），然后会经历中间代码优化等阶段，最后交由汇编器生成对应目标指令集的目标文件。

Xcode 使用两种不同的编译器前端，一种是针对 Objective-C/Objective-C++ 或者 C/C++ 代码使用的，另一种就是在 Swift 出现之后针对 Swift 语言使用的。前者就是 clang，后者是 swiftc / swift。

![Clang-Swiftc](https://i.imgur.com/kN76TgI.png)


因为 swift 语言本身是没有预处理器的，因此忽略前一步。在预编译阶段，我使用了 Clang 作为演示，而 Swift 文件是无需进行预编译处理的。最终编译器生成的文件，称之为目标文件，在 Apple 平台中以特殊的格式存在，这种格式就是 `Mach-O` 格式，下文会讲。
而每个目标文件中都有暴露给其他目标文件所使用的符号，这些也就是外部符号，这些符号被管理起来，以一个符号表的形式存在，对于变量和函数来说，其符号表中的 Key 就是这些变量和函数的名字，而 Value 就是其在目标文件中的地址。

## 汇编器 Assembler

汇编器实际上是将中间过程生成的中间代码翻译成指定机器指令集的汇编代码，其实 Clang 工具集中已经集成了


## 链接器 Linker

每个源文件就按照上面的步骤，生成了一个一个我们称之为目标文件的二进制，接下来我们需要将所有的目标文件整合成一个可执行文件。比如上面的例子中，我们有两个文件，Foo.o 以及 main.o 文件，当然还有依赖的其他库，Linker 该出场了。整个链接过程正是基于每个目标文件中的符号才能正确完成，链接过程中很关键的一部分就是符号的管理。

![Linker](https://i.imgur.com/BN3Tr47.png)


我们新建两个文件，分别是 main.m，Foo.m 以及其对应的头文件 Foo.h。分别经历预处理，编译生成对应目标文件，给 clang 传递 -c 是用来完成以上所有工作集合，直接生成目标文件的。

``` Shell
xcrun clang -c main.m
xcrun clang -c Foo.m
```

生成产物为两个对应的目标文件，main.o 以及 Foo.o ，使用链接器进行链接，传统的链接器，无论是 Mac 还是 Linux 上都会有 ld 这个工具，在 /usr/bin/ 下，我们先使用 ld 将对应两个目标文件链接起来，如下：

``` C
ld Foo.o main.o
```

但是报错，如下所示:

``` Shell
ld: warning: No version-min specified on command line
Undefined symbols for architecture x86_64:
  "_OBJC_CLASS_$_NSObject", referenced from:
      _OBJC_CLASS_$_Foo in Foo.o
  "_OBJC_METACLASS_$_NSObject", referenced from:
      _OBJC_METACLASS_$_Foo in Foo.o
  "__objc_empty_cache", referenced from:
      _OBJC_METACLASS_$_Foo in Foo.o
      _OBJC_CLASS_$_Foo in Foo.o
  "_objc_msgSend", referenced from:
      _main in main.o
  "_printf", referenced from:
      -[Foo hello] in Foo.o
ld: symbol(s) not found for inferred architecture x86_64
```

其中，报了一堆 OBJC 库找不到的问题，因为是静态链接，我们内部使用了 Foundation 的一些内容，这里也在侧面证明了，想要完成静态链接，所有未定义的符号都需要在静态链接阶段进行修正，因此我们还需要将这些库也链进来，当然，还有 `_printf` 也找不到，我们还需要把 C++ 相关的库也同时一并链接，最后的链接命令如下：

``` Shell
ld main.o Foo.o `xcrun --show-sdk-path`/System/Library/Frameworks/Foundation.framework/Foundation `xcrun --show-sdk-path`/usr/lib/libSystem.B.tbd
```

这样就能够顺利的生成我们所需要的目标文件了。当然，如果你要是使用 clang 提供的默认命令来做，如下，

``` Shell
xcrun clang main.o Foo.o -Wl,`xcrun --show-sdk-path`/System/Library/Frameworks/Foundation.framework/Foundation
```

会看到你不需要把一些基础的 C 库引入，是因为 clang 本身工具帮你做了一堆环境路径查找的事情，感兴趣可以加上 -v 指令来看完整的输出，a.out 是链接器默认生成的文件名称。

### nm
> nm - display name list (symbol table)

接下来，引入一个新的命令 nm，其是用来展示目标文件中的符号表信息的。我们使用 nm 命令来查看该可执行文件的符号表信息。

``` Shell
xcrun nm -nm Foo.o


(undefined) external _OBJC_CLASS_$_NSObject
                 (undefined) external _OBJC_METACLASS_$_NSObject
                 (undefined) external __objc_empty_cache
                 (undefined) external _printf
0000000000000000 (__TEXT,__text) non-external -[Foo hello]
0000000000000040 (__DATA,__objc_const) non-external l_OBJC_METACLASS_RO_$_Foo
0000000000000088 (__DATA,__objc_const) non-external l_OBJC_$_INSTANCE_METHODS_Foo
00000000000000a8 (__DATA,__objc_const) non-external l_OBJC_CLASS_RO_$_Foo
00000000000000f0 (__DATA,__objc_data) external _OBJC_METACLASS_$_Foo
0000000000000118 (__DATA,__objc_data) external _OBJC_CLASS_$_Foo
```

同时，我们再查看下 main.o 这个目标文件。

``` Shell
xcrun nm -nm main.o

(undefined) external _OBJC_CLASS_$_Foo
                 (undefined) external _objc_msgSend
0000000000000000 (__TEXT,__text) external _main
```

再查看下最终的目标输出文件的符号信息，如下：

``` Shell
xcun nm -nm a.out

(undefined) external _OBJC_CLASS_$_NSObject (from libobjc)
                 (undefined) external _OBJC_METACLASS_$_NSObject (from libobjc)
                 (undefined) external __objc_empty_cache (from libobjc)
                 (undefined) external _objc_msgSend (from libobjc)
                 (undefined) external _printf (from libSystem)
                 (undefined) external dyld_stub_binder (from libSystem)
0000000000001000 (__TEXT,__text) [referenced dynamically] external __mh_execute_header
0000000000001ef0 (__TEXT,__text) external _main
0000000000001f50 (__TEXT,__text) non-external -[Foo hello]
0000000000002100 (__DATA,__objc_data) external _OBJC_METACLASS_$_Foo
0000000000002128 (__DATA,__objc_data) external _OBJC_CLASS_$_Foo
```

大家会看到每一个目标文件符号表信息中会存储着 undefined 字样的符号，名字均为我们没有在代码中所体现出来的函数名字或者字符变量（本例没有引入变量）名称，在生成对应的可执行文件的过程中，链接器会查找所有输入的目标文件中每一个的符号表，然后组成全局符号表，相互找所需要的符号，并且对非动态库文件的符号进行定位。

在进行链接之后，所有原来标记为 undefined 的符号依然是 undefined，但是会发现在对应符号后方会标记出该符号来自于哪里。这个也就是当我们可执行文件需要使用该符号的时候，对应去哪里加载对应的 dylib。

### otool

> llvm-otool - the otool-compatible command line parser for llvm-objdump.
> The  command  line  shim  llvm-otool  takes all the same options as the original otool(1) command and executes an  equivalent  objdump(1) command.

接下来再介绍一个命令行工具 otool(object file displaying tool)，其底层是对 objdump 的封装，而 objdump 是 Linux 下查看二进制文件的工具。

我们就用 otool 来查看目标文件所需要使用的库的地址在哪里。

``` Shell
// -L print shared libraries used
xcrun otool -L a.out


a.out:
        /System/Library/Frameworks/Foundation.framework/Versions/C/Foundation (compatibility version 300.0.0, current version 1560.12.0)
        /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.200.5)
        /usr/lib/libobjc.A.dylib (compatibility version 1.0.0, current version 228.0.0)
```

当然，我们也可以查看一下其中的 libSystem.B.dylib 的情况，其实 macOS 上的 C 基础库。

``` Shell
xcrun otool -L /usr/lib/libSystem.B.dylib
    
    /usr/lib/libSystem.B.dylib:
            /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.250.1)
            /usr/lib/system/libcache.dylib (compatibility version 1.0.0, current version 81.0.0)
            /usr/lib/system/libcommonCrypto.dylib (compatibility version 1.0.0, current version 60118.250.2)
            /usr/lib/system/libcompiler_rt.dylib (compatibility version 1.0.0, current version 63.4.0)
            /usr/lib/system/libcopyfile.dylib (compatibility version 1.0.0, current version 1.0.0)
            /usr/lib/system/libcorecrypto.dylib (compatibility version 1.0.0, current version 602.250.23)
            /usr/lib/system/libdispatch.dylib (compatibility version 1.0.0, current version 1008.250.7)
            /usr/lib/system/libdyld.dylib (compatibility version 1.0.0, current version 655.1.1)
            /usr/lib/system/libkeymgr.dylib (compatibility version 1.0.0, current version 30.0.0)
            /usr/lib/system/liblaunch.dylib (compatibility version 1.0.0, current version 1336.251.2)
            /usr/lib/system/libmacho.dylib (compatibility version 1.0.0, current version 927.0.2)
            /usr/lib/system/libquarantine.dylib (compatibility version 1.0.0, current version 86.220.1)
            /usr/lib/system/libremovefile.dylib (compatibility version 1.0.0, current version 45.200.2)
            /usr/lib/system/libsystem_asl.dylib (compatibility version 1.0.0, current version 356.200.4)
            /usr/lib/system/libsystem_blocks.dylib (compatibility version 1.0.0, current version 73.0.0)
            /usr/lib/system/libsystem_c.dylib (compatibility version 1.0.0, current version 1272.250.1)
            /usr/lib/system/libsystem_configuration.dylib (compatibility version 1.0.0, current version 963.250.1)
            /usr/lib/system/libsystem_coreservices.dylib (compatibility version 1.0.0, current version 66.0.0)
            /usr/lib/system/libsystem_darwin.dylib (compatibility version 1.0.0, current version 1.0.0)
            /usr/lib/system/libsystem_dnssd.dylib (compatibility version 1.0.0, current version 878.250.4)
            /usr/lib/system/libsystem_info.dylib (compatibility version 1.0.0, current version 1.0.0)
            /usr/lib/system/libsystem_m.dylib (compatibility version 1.0.0, current version 3158.200.7)
            /usr/lib/system/libsystem_malloc.dylib (compatibility version 1.0.0, current version 166.251.2)
            /usr/lib/system/libsystem_networkextension.dylib (compatibility version 1.0.0, current version 1.0.0)
            /usr/lib/system/libsystem_notify.dylib (compatibility version 1.0.0, current version 172.200.21)
            /usr/lib/system/libsystem_sandbox.dylib (compatibility version 1.0.0, current version 851.250.12)
            /usr/lib/system/libsystem_secinit.dylib (compatibility version 1.0.0, current version 30.220.1)
            /usr/lib/system/libsystem_kernel.dylib (compatibility version 1.0.0, current version 4903.251.3)
            /usr/lib/system/libsystem_platform.dylib (compatibility version 1.0.0, current version 177.250.1)
            /usr/lib/system/libsystem_pthread.dylib (compatibility version 1.0.0, current version 330.250.2)
            /usr/lib/system/libsystem_symptoms.dylib (compatibility version 1.0.0, current version 1.0.0)
            /usr/lib/system/libsystem_trace.dylib (compatibility version 1.0.0, current version 906.250.5)
            /usr/lib/system/libunwind.dylib (compatibility version 1.0.0, current version 35.4.0)
            /usr/lib/system/libxpc.dylib (compatibility version 1.0.0, current version 1336.251.2)
```

甚至查看 a.out 可执行文件在执行时所需要依赖的所有依赖。

``` Shell
(export DYLD_PRINT_LIBRARIES=; ./a.out )
```

可以通过结果看到，一个简单的程序所需要链接的 `dylib` 有多少，就是因为有这么多动态库要加载，在可执行程序加载到内存中执行的时候，不断的需要装载动态库进入内存，所需要花费的时间其实很可观，所以系统层面提供了共享缓存，也即会提前加载到内存中的动态链接库集合，当需要链接到对应动态库的时候就省略了从磁盘写入内存的过程。



## 总结一句话

整个编译过程可以归结为：
头文件约定，编译器信任彼此，链接器验证

