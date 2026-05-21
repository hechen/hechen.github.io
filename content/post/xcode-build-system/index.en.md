---
title: 'Build Process'
slug: 'xcode-build-system'
date: 2019-04-25T11:30:30+08:00
draft: false
categories: ['macos']
tags: ['agent', 'applescript', 'backgroundcolor', 'build', 'cocoa', 'compile', 'dock', 'dockless', 'login', 'menu', 'nstask', 'nsview', 'preprocess', 'process', 'safari', 'sandbox', 'shadowsocks', 'traffic', 'xcode']
---

A programming language goes through roughly five stages on its way to a running program, each with its own tool:

1.  Preprocessor
2.  Compiler
3.  Assembler
4.  Linker
5.  Loader

Let's walk through what each of these does with a tiny source file.

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

## Preprocessor

1.  Tokenization
2.  Macro expansion
3.  Header inclusion expansion

Run the following on the command line to dump the preprocessed output to a file:

``` c
xcrun clang -E helloworld.c > preprocessed.txt
```

Open `preprocessed.txt` and you'll see something like this:

``` c
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


// ... thousands of lines elided

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

A source file that was just a handful of lines balloons into hundreds of lines after preprocessing — and we only included a single header, `stdio.h`. You can also run the preprocessor straight from Xcode.

![xcode\_preprocess](https://i.imgur.com/vmwexNC.png)

Around the same time Swift came along, the concept of Modules was introduced to the C family of languages too. You'll find the toggle for it in Xcode's `build settings`.

![enable\_module](https://i.imgur.com/lUGiInP.png)

Modules are enabled by default (this switch only affects the C family — Swift natively exists in module form). With modules turned on, run the preprocessor again and look at the result: the output goes from 548 lines down to 14. This is one of the reasons `LLVM` pushes modules so hard — they massively cut preprocessing time.

``` c
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

Once preprocessing is done, the next step takes the expanded source, parses it into an AST, generates intermediate code, and emits the target machine code. That's what the compiler does.

## Compiler

The compiler is itself a binary whose job is to translate source files into a semantically equivalent representation — namely machine code. In Apple's ecosystem today, the tool doing that is LLVM (which showed up to replace GCC). When we casually say "compiler," we really mean a broad set of components: the compiler front end, the IR generator, the optimizer, and the compiler back end.

If you zoom into Apple's modern compiler stack (centered on the LLVM toolchain), the detailed pipeline looks like this:

![LLVM](https://i.imgur.com/fTwjs0q.png)

Clang and `swiftc` / `swift` are effectively front ends in the LLVM pipeline — though "front end" is a bit of a misnomer these days, since the toolchain has things like the assembler and the optimizer baked in too.

Whether it's Clang or swiftc, both eventually take source code and emit LLVM Intermediate Representation (LLVM IR) at the front end, run that IR through an optimization pipeline, and finally hand it off to the assembler to produce a target object file for the specific instruction set.

Xcode uses two different compiler front ends: one for Objective-C/Objective-C++ and C/C++, and another, introduced when Swift arrived, for Swift. The former is Clang; the latter is swiftc / swift.

![Clang-Swiftc](https://i.imgur.com/kN76TgI.png)

Because Swift itself has no preprocessor, you skip the first step for Swift. I used Clang above to demonstrate preprocessing — Swift files don't go through that. The file the compiler ultimately emits is the object file. On Apple platforms, object files live in a special format called `Mach-O`, which I'll get to below.

Every object file exposes a set of symbols for use by other object files. These external symbols are tracked in a symbol table. For variables and functions, the key in that table is the variable or function name, and the value is its address inside the object file.

## Assembler

The assembler takes the IR produced earlier and translates it into assembly code for the target machine's instruction set. Clang's toolchain has this built in.

## Linker

Each source file goes through the steps above and produces an object file binary. The next step is to stitch all of those object files together into a single executable. In our example above we have two files, `Foo.o` and `main.o`, plus any other libraries we depend on. Enter the linker. The whole linking step relies on each object file's symbols, and managing symbols is a big part of what the linker does.

![Linker](https://i.imgur.com/BN3Tr47.png)

Let's create two new files — `main.m` and `Foo.m`, with the corresponding header `Foo.h` — and run each through preprocessing and compilation to produce its object file. Passing `-c` to clang does all of those steps in one go and produces the object file directly:

``` bash
xcrun clang -c main.m
xcrun clang -c Foo.m
```

That gives us two object files: `main.o` and `Foo.o`. The classic linker on both Mac and Linux is `ld`, found under `/usr/bin/`. Let's start by linking the two object files with `ld`:

``` c
ld Foo.o main.o
```

That fails with:

``` bash
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

It can't find a bunch of OBJC symbols — we used some Foundation internals, but this is static linking, so every undefined symbol has to be resolved at link time. We need to also link in those libraries. `_printf` is missing for the same reason; we need to bring in the C++ runtime as well. The full link command becomes:

``` bash
ld main.o Foo.o `xcrun --show-sdk-path`/System/Library/Frameworks/Foundation.framework/Foundation `xcrun --show-sdk-path`/usr/lib/libSystem.B.tbd
```

That produces the object file we want. Of course, if you let `clang` drive the link with its defaults, like this:

``` bash
xcrun clang main.o Foo.o -Wl,`xcrun --show-sdk-path`/System/Library/Frameworks/Foundation.framework/Foundation
```

…you'll notice you don't have to include the basic C runtime libraries, because clang handles a bunch of environment path lookups for you. If you're curious, add `-v` to see the full invocation. `a.out` is the linker's default output file name.

### nm

> nm - display name list (symbol table)

Now let's bring in a new command, `nm`, which prints the symbol table of an object file. Let's use `nm` to look at our object file's symbols.

``` bash
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

Now let's look at `main.o`:

``` bash
xcrun nm -nm main.o

(undefined) external _OBJC_CLASS_$_Foo
                 (undefined) external _objc_msgSend
0000000000000000 (__TEXT,__text) external _main
```

And the symbols in the final output binary:

``` bash
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

You'll notice that every object file's symbol table contains some `undefined` symbols — names of functions or variables (no variables in this example) we didn't define in our own source. When the linker produces the final executable, it walks the symbol tables of every input object file, builds a global symbol table from them, and resolves the references between them. Symbols from non-dynamic libraries get resolved (located) at this point.

After linking, the symbols that were originally marked `undefined` are still `undefined`, but each one now carries a note about where it lives. That's the information the executable uses at load time to know which `dylib` to pull each symbol from.

### otool

> llvm-otool - the otool-compatible command line parser for llvm-objdump.
> The command line shim llvm-otool takes all the same options as the original otool(1) command and executes an equivalent objdump(1) command.

Next, the `otool` command-line tool (object file displaying tool), which under the hood is a wrapper around `objdump` — `objdump` being the standard Linux tool for inspecting binaries.

Let's use `otool` to see which libraries our object file needs and where they live.

``` bash
// -L print shared libraries used
xcrun otool -L a.out


a.out:
        /System/Library/Frameworks/Foundation.framework/Versions/C/Foundation (compatibility version 300.0.0, current version 1560.12.0)
        /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.200.5)
        /usr/lib/libobjc.A.dylib (compatibility version 1.0.0, current version 228.0.0)
```

You can also look at what `libSystem.B.dylib` itself depends on — it's the basic C library on macOS.

``` bash
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

You can even watch which dependencies `a.out` actually loads at runtime:

``` bash
(export DYLD_PRINT_LIBRARIES=; ./a.out )
```

The result drives home just how many `dylib`s a trivial program ends up linking against. Loading all of these dynamic libraries into memory takes a non-trivial amount of time, which is why the system provides a shared cache — a set of dynamic libraries pre-loaded into memory, so that when an executable needs one, it skips the disk-to-memory step.

## In one sentence

The whole compilation pipeline can be summed up as:
header files set the contract, the compiler trusts both sides, and the linker verifies.
