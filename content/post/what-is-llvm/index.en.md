---
title: 'What is LLVM'
slug: 'what-is-llvm'
date: 2018-07-10T12:05:58+00:00
draft: false
categories: ['swift', 'translation']
tags: ['animation', 'carthage', 'closure', 'cocoapods', 'compiler', 'ios', 'ir', 'llvm', 'objective-c', 'optional', 'swift', 'xcode']
---

# What is LLVM? The secret behind Swift, Rust, Clang, and more

> Understanding how a compiler emits native machine code makes it dramatically easier to invent a new language or enhance an existing one.

New programming languages — and ambitious upgrades to existing ones — are appearing everywhere. Mozilla's **Rust**, Apple's **Swift**, JetBrains' **Kotlin**, and many others give developers more options around speed, safety, convenience, portability, and performance.

Why now? A big part of the answer is the new tooling for building language implementations. The single most important piece of that tooling is LLVM — short for Low-Level Virtual Machine. LLVM is an open-source project that started as a research project at the University of Illinois, led by Chris Lattner, who would later go on to invent Swift.

LLVM doesn't just make it easier to create new languages — it also makes it easier to enhance the ones that already exist. It provides tooling that automates many of the painful parts of language implementation: building a compiler, emitting code that works across multiple platforms and architectures, and handling notoriously fiddly aspects of language design (exceptions being a classic example). LLVM's permissive licence lets you freely use it as a software component or deploy it as a service.

If you look at the roster of languages using LLVM, you'll find a lot of familiar names. Apple's Swift uses LLVM as its compiler framework. Rust uses LLVM as a core component of its toolchain. Many existing compilers have an LLVM-based variant — Clang, for example, is a C/C++ compiler and a close sibling project to LLVM. There's even Kotlin, nominally a JVM language, that's developing a variant called [Kotlin Native](https://www.infoworld.com/article/3187370/application-development/kotlin-compiles-directly-to-native-code-via-llvm.html) that uses LLVM to compile to native machine code.

## What LLVM is

At its core, LLVM lets you produce native machine code programmatically. A developer can use its API to create instructions in an intermediate representation, or IR for short. LLVM can then compile that IR down to a standalone binary, or JIT-compile it to run inside another program — for instance, an interpreter for some language.

LLVM's API gives you first-class support for many of the structures and patterns that show up across most programming languages. Almost every language has the concept of a function or a global variable, for example, and LLVM models functions and globals as standalone elements in its IR. That means you don't have to reinvent those wheels for your particular language — you can use LLVM's, and spend your time on what actually makes your language interesting.

![An example of LLVM IR. On the right is a simple C program; on the left is the same code translated to LLVM IR by Clang](https://i.imgur.com/xIbW9gq.jpg)

## LLVM: designed for portability

One point about LLVM often comes up in the same breath as C. C has sometimes been described as a portable high-level assembly language — it has instructions that map closely to the hardware, and it's been ported to nearly every architecture in existence. But "portable assembler" is really a side effect for C; it wasn't actually the design goal.

LLVM IR, by contrast, was designed from day one to be a portable assembler. One sign of that is its machine-independent semantics — integer types, for example, aren't bounded by the maximum bit width of a specific piece of hardware (32-bit or 64-bit). You can create an integer type of whatever bit width you need, say a 128-bit integer. You also don't need to worry about retargeting to a specific processor's instruction set; LLVM has already thought about that for you.

If you want to see what LLVM IR actually looks like, take a look at the [ELLCC project](http://ellcc.org/) and try the [demo](http://ellcc.org/demo/index.cgi) that converts C code to LLVM IR right in the browser.

## How languages use LLVM

The most common use case is as the back end for an ahead-of-time (AOT) compiler for a language, but that's not the only thing LLVM is good for.

### Using LLVM for JIT compilation

Some situations call for code to be generated at runtime rather than compiled ahead of time. [Julia](https://www.infoworld.com/article/3241107/python/julia-vs-python-julia-language-rises-for-data-science.html?nsdr=true), for example, JIT-compiles its code because it needs to be fast and because users interact with it through an interactive parser ([REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop)) or interactive notebook. Mono, the .Net implementation, can [compile to native code via an LLVM back end](http://www.mono-project.com/docs/advanced/runtime/docs/llvm-backend/).

[Numba](https://www.infoworld.com/article/2880767/python/5-projects-push-python-performance.html), a math-acceleration package for Python, JIT-compiles selected Python functions down to machine code. It can also AOT-compile Numba-decorated code, but (like Julia) Python is an interpreted language and gets a lot of its productivity from fast iteration. Using JIT compilation gives you a more interactive workflow than AOT compilation does.

There are other languages experimenting with LLVM as a JIT in less traditional ways — for instance, [JIT-Compiling SQL Queries in PostgreSQL Using LLVM](https://www.pgcon.org/2017/schedule/events/1092.en.html), which yields up to a 5x speedup.

![Numba uses LLVM to JIT-compile its numerical code, speeding up execution. The JIT-accelerated sum2d function runs roughly 139x faster than the regular Python implementation](https://i.imgur.com/viRT3KE.jpg)

### Automatic code optimization with LLVM

LLVM doesn't just translate IR into native machine code. You can also direct it to perform fairly aggressive optimizations across the entire link step. Optimizations include inlining functions, dead-code elimination (including unused type declarations and function parameters), [loop unrolling](https://en.wikipedia.org/wiki/Loop_unrolling), and more.

Again, you don't have to do any of this yourself. LLVM handles it, and you can turn pieces of it off when you need to. If you want to sacrifice some performance to shrink your binary, for instance, you can tell LLVM through your compiler front end to disable loop unrolling.

### Domain-specific languages with LLVM

LLVM has been used to build compilers for plenty of general-purpose programming languages, but it's also great for generating very vertical or narrowly-scoped languages. In some ways this is where LLVM really shines — it removes a huge chunk of the tedious work involved in building a language and lets the language itself be the focus.

For example, the [Emscripten](https://github.com/kripken/emscripten) project takes LLVM IR and translates it into JavaScript, theoretically allowing any language with an LLVM back end to export code that runs in the browser. Emscripten's long-term plan is to have an LLVM-based back end that generates WebAssembly, but it's already a great showcase of LLVM's flexibility.

Another way LLVM gets used is to add domain-specific extensions to existing languages. Nvidia used LLVM to build the [Nvidia CUDA Compiler](https://developer.nvidia.com/cuda-llvm-compiler), which lets languages add native CUDA support directly rather than going through a library.

## Using LLVM from various languages

A typical way to get started with LLVM is to find some code written in a language you're comfortable with — one that supports LLVM, of course.

Two common choices are C and C++. A lot of LLVM developers default to one of those for a few reasons:

1.  LLVM itself is written in C++;
2.  The LLVM API works seamlessly from both C and C++;
3.  A lot of languages tend to be built on top of C or C++.

That said, those two aren't the only options. Many languages can call C libraries natively, so in theory you can use them to do LLVM development. It also helps to have a library in your language that wraps the LLVM API nicely. Fortunately, many languages and runtimes have one, including [C#/.Net/Mono](https://github.com/Microsoft/LLVMSharp), [Rust](https://crates.io/crates/llvm-sys), [Haskell](https://hackage.haskell.org/package/llvm), [OCAML](https://opam.ocaml.org/packages/llvm/), [Node.js](https://www.npmjs.com/package/llvm-node), [Go](https://llvm.org/svn/llvm-project/llgo/trunk/README.TXT), and [Python](https://github.com/numba/llvmlite).

One caveat: the LLVM bindings for some of these languages are less complete than others. Python is a good example — there are several choices, and they vary in completeness and how actively they're maintained:

- The LLVM project [maintains a set of bindings to LLVM's C API for Python](https://github.com/llvm-mirror/llvm/tree/master/bindings/python), but they're no longer actively maintained.

- [llvmpy](https://www.infoworld.com/article/3247799/development-tools/what-is-llvm-the-power-behind-swift-rust-clang-and-more.html) stopped being maintained in 2015, which isn't a great sign for any software project — especially one wrapping LLVM, given how much each new LLVM release changes.

- [llvmlite](https://github.com/numba/llvmlite), built by the Numba team, has become a strong contender for LLVM work in Python today. It only implements a subset of LLVM's functionality based on what Numba needs, but that subset is enough for most LLVM developers.

- [llvmcpy](https://github.com/revng/llvmcpy) aims to refresh Python's bindings to the C library so they can be kept up to date automatically, with idiomatic Python syntax. llvmcpy is still early, but a lot of the groundwork for working with the LLVM API is already in place.

If you're curious about what it looks like to build a language using LLVM's libraries, the LLVM authors have written a tutorial that walks you through building a small language called Kaleidoscope from scratch using C++ or OCAML. The tutorial has been ported to many other languages:

- [Haskell](http://www.stephendiehl.com/llvm/): the closest port to the original tutorial.

- Python: [one version](https://github.com/eliben/pykaleidoscope) closely follows the tutorial, and [another version](https://github.com/frederickjeanguerin/pykaleidoscope) goes further, rewriting the project with an interactive command line. Both use llvmlite as the LLVM binding.

- [Rust](https://github.com/jauhien/iron-kaleidoscope) and [Swift](https://harlanhaskins.com/2017/01/08/building-a-compiler-with-swift-in-llvm-part-1-introduction-and-the-lexer.html): probably inevitable that we'd end up with ports in both, since LLVM was kind of the reason those languages exist in the first place.

Finally, the tutorial has been translated to other human languages too. There are Chinese versions for both [C++](https://github.com/liancheng/llvm-tutorial-cn) and [Python](https://github.com/moevis/Kaleidoscope-LLVM-tutorial-zh-cn).

## What LLVM doesn't do

Everything above is what LLVM can do for you. It's also worth knowing what it can't.

For example, LLVM doesn't do parsing. Plenty of tools — [lex/yacc](http://dinosaur.compilertools.net/), [flex/bison](http://aquamentus.com/flex_bison.html), [ANTLR](http://www.antlr.org/), and others — already handle that. Parsing is naturally decoupled from compilation, so it's not surprising that LLVM doesn't try to take it on.

LLVM also doesn't try to solve the broader ecosystem around a specific language. You still have to install the compiler binary yourself, manage packages, and update the toolchain.

Finally — and this is the most important caveat — there's still a fair amount of language-common functionality that LLVM doesn't natively support. Many languages perform garbage collection, either as the primary memory-management strategy or as a complement to schemes like RAII (used in C++ and Rust). LLVM doesn't provide a garbage collector, but it does [provide tooling](https://llvm.org/docs/GarbageCollection.html) that lets code be annotated with metadata to make writing a garbage collector easier.

That said, native garbage collection support might eventually find its way into LLVM. LLVM moves quickly, with major releases roughly every six months. A lot of that pace is driven by mainstream languages that have made LLVM core to their development process.
