---
title: What is LLVM
date: 2018-07-10 12:05:58
lastmod: 2019-04-13T22:30:23+08:00
categories: ["Translation"]
tags: ["LLVM","Compiler","Swift","IR"]
---


# 什么是 LLVM？隐藏在 Swift，Rust，Clang 等语言背后的奥秘

> 了解编译器是如何生成机器原生代码会使得倒腾新语言或者加强已经存在的编程语言变得比以往更加容易了。

新的编程语言，针对现存语言的优化如同雨后春笋般产生。 Mozilla 的 **Rust**， Apple 的 **Swift**，JetBrain 的 **Kotlin**等语言给开发者提供了在速度，安全性，便捷性，可移植性以及性能等方面更多的选择。

为什么是这个时间点呢？一个重大的原因是那些构建具体语言相关的新式工具的出现。在这一堆工具中，最重要的就是 LLVM，其全称是 Low-Level Virtual Machine，它是一个开源项目，其最早是由 Swift 语言的发明人 Chris Lattner 在伊利诺斯州州立大学期间的一个研究项目而来。

LLVM 不仅仅使得创建新式语言更加容易，也使得针对现存编程语言进行增强完善更加便捷。它提供了一堆工具使得创造语言的过程中需要的那些令人头疼的事情变得自动化：创建一个编译器，输出代码需要适配多平台和架构，编写代码处理语言当中通常都存在的那些比较晦涩的部分，比如异常。LLVM 的自由开发许可使得它可以被自由的作为一个软件组件或者被部署成服务来使用。

使用了 LLVM 的编程语言花名册种有很多熟悉的名字。Apple 的 Swift 语言使用 LLVM 作为其编译器框架，Rust 语言使用 LLVM 作为其工具链中的一个核心组件。同样，许多编译器也有其 LLVM 版本，例如 Clang，一个 C/C++ 编译器，它是和 LLVM 功能特别相近的一个项目。还有 Kotlin 语言，其名义上是一门 JVM 语言，也正在开发该语言的一个版本： [Kotlin Native](https://www.infoworld.com/article/3187370/application-development/kotlin-compiles-directly-to-native-code-via-llvm.html)，其使用 LLVM 编译成机器原生代码。

## LLVM 是什么

LLVM 最核心的功能就是，可以通过编码方式创造机器原生代码。一个开发者可以使用其 API 创造指令，该指令是一种 intermediate representation 格式，简称 IR。之后，LLVM 能够将 IR 编译成独立的二进制文件，或者对其执行即时编译以运行在另外一个程序，例如某编程语言的解释器的上下文中。

很多编程语言中很常见的结构体或者模式，LLVM 的 API 都提供了原始语义的支持。例如，几乎所有的语言都有函数或者全局变量的概念，LLVM 在其 IR 中把函数和全局变量作为独立元素定义出来，因此你不需要花太多时间和精力来重复造这些特定的轮子，你只需要使用 LLVM 的实现，专注于你的语言最需要关注的地方即可。

![一个 LLVM 的 IR 的例证. 右侧是一个简单的 C 程序; 左侧是同样的代码被 Clang 编译器翻译成的 LLVM IR](https://i.imgur.com/xIbW9gq.jpg)


## LLVM: 专为移植性而设计

涉及 LLVM 的一点就是，经常在讨论 C 语言的时候被提及： C 语言有时候会被描述为一门可移植的高阶汇编语言，就是因为其具备能被映射成很接近硬件设备的指令，而且它已经被移植到几乎所有的系统架构上。但是 C 语言只能作为一种可移植的汇编语言实际上也有其副作用，这个确实也不是其设计目标。

作为对比，LLVM 的 IR 从最初就是被设计作为一个可移植的汇编。体现的第一点就是其提供独立于特定机器架构的语义，例如，integer 类型并不会被限制在特定硬件设备上的最大位数（比如 32 位 或者 64 位）。你可以按照你的需要的位数来创建你所需要的 integer 类型，比如 一个 128 位的 integer。你也不需要担心针对特定处理器指令集来再加工，LLVM 已经为了考虑了这些。

如果你想看到 LLVM IR 长的什么样子，可以去看一下 [ELLCC 项目](http://ellcc.org/)，尝试一下 [Demo](http://ellcc.org/demo/index.cgi) 直接使用浏览器将 C 代码转换为 LLVM IR。

## 编程语言是如何使用 LLVM 的

最常用的场景就是作为某一种语言的编译器前端（ahead-of-time (AOT) compiler），除了如此，LLVM 还有其他很多可能性。

### 使用 LLVM 进行即时编译

一些情形需要我们的代码在运行时即时生成，而不是提前编译好。比如 [Julia 语言](https://www.infoworld.com/article/3241107/python/julia-vs-python-julia-language-rises-for-data-science.html?nsdr=true)，JIT 编译其代码，因为其需要运行很快，能够使得用户通过交互式解析器（[REPL](https://en.wikipedia.org/wiki/Read–eval–print_loop)）或者可交互弹窗来交互。Mono，使用 .Net 实现，能够利用 [LLVM 后端编译为机器原生代码](http://www.mono-project.com/docs/advanced/runtime/docs/llvm-backend/)。

[Numba](https://www.infoworld.com/article/2880767/python/5-projects-push-python-performance.html)，一个为 Python 提供的数学计算加速包，JIT 将选择的 Python 函数编译为机器代码。它也能提前编译 Numba 修饰的代码，但是（例如 Julia），Python 由于其解释性语言的特性能够提供快速的开发工作。使用 JIT 编译能够产出比提前编译更好的 Python 的交互工作流。

其他的语言还有用非传统方式把 LLVM 作为 JIT 来实验的语言，比如 [JIT-Compiling SQL Queries in PostgreSQL Using LLVM](https://www.pgcon.org/2017/schedule/events/1092.en.html)，能够达到高达 5 倍的性能提升。

![Numba 使用 LLVM 即时编译其数值代码从而加速其执行速度。JIT 加速的 sum2d 函数完成执行比使用常规 Python 代码的实现快大约 139 倍](https://i.imgur.com/viRT3KE.jpg)


### 利用 LLVM 进行自动化的代码优化

LLVM 不仅仅是将 IR 编译成原生机器代码。你也可以通过编码引导其进行更大粒度的优化工作，整个工作会贯穿整个链接过程。优化工作可以非常激进，包括对函数进行内联，移除死代码（包含无用的类型声明以及函数参数）或者[展开循环](https://en.wikipedia.org/wiki/Loop_unrolling)等。

这次依然，上面这些你并不需要都自己来做。 LLVM 能够帮你处理这些事情，你也可以按需关闭这些功能。举例来讲，如果你想牺牲一部分性能来减小二进制的大小，你可以使用自己的编译器前端来告知 LLVM 来关闭循环展开。

### 使用 LLVM 的领域特定语言

LLVM 已经被用以为许多跨领域通用计算机语言产生编译器，但是它在生成非常垂直或者解决某些具体问题的语言方面也非常有用。在某些程度上，这才是 LLVM 最闪光的点所在，因为它移除了一大堆创建该语言过程中的单调烦躁的工作，并且使得它表现的更好。

比如，[Emscripten](https://github.com/kripken/emscripten) 项目，采用了 LLVM IR 代码，将其转换成 JavaScript，理论上允许任何具备 LLVM 后端的语言可以导出在浏览器中运行的代码。虽然 Emscripten 的长期计划是能够拥有可生成 WebAssembly 的基于 LLVM 的后端，但是它是一个展示 LLVM 灵活性的很好的例证。

另外一种 LLVM 可以被使用的方式就是为已存在的编程语言增加特定领域的扩展。Nvidia 使用 LLVM 创造了[Nvidia CUDA Compiler](https://developer.nvidia.com/cuda-llvm-compiler)，其能够让编程语言增加针对 CUDA 的原生支持，而不是通过加载某个库来唤起。

## 在多种语言中使用 LLVM

和 LLVM 打交道的一种典型方式就是找到你很舒服的一种编程语言的代码来体会，当然，这种编程语言要支持 LLVM。

两种常见选择的语言是 C 和 C++。许多 LLVM 的开发者默认选择这二者之一有以下几个原因：

1. LLVM 本身就是 C++ 写的；
2. LLVM 的 API 能够在 C 和 C++ 中无缝使用；
3. 需要语言都倾向于基于 C 和 C++ 进行开发。

尽管，这两种语言并不是唯一的选择。许多语言能够原生调用 C 库的方法，所以理论上是可以使用这些语言来进行 LLVM 开发的，但是其也有助于在某种语言中实际存在一个库，能够优雅的封装 LLVM 的 API。幸运的是，许多语言和运行时都有这些库，包括 [C#/.Net/Mono](https://github.com/Microsoft/LLVMSharp), [Rust](https://crates.io/crates/llvm-sys), [Haskell](https://hackage.haskell.org/package/llvm), [OCAML](https://opam.ocaml.org/packages/llvm/), [Node.js](https://www.npmjs.com/package/llvm-node), [Go](https://llvm.org/svn/llvm-project/llgo/trunk/README.TXT), 和 [Python](https://github.com/numba/llvmlite)。

不过，你需要注意的一点是，这些语言中有一些针对 LLVM 的绑定支持并不完整。以 Python 语言举例，虽然存在多种选择，但是它们都会在完整性和功效性上有差别：

- LLVM 项目下[维护有针对 LLVM 的 C 版 API 的绑定集合](https://github.com/llvm-mirror/llvm/tree/master/bindings/python)，但是它们已经不再被维护了；

- [llvmpy](https://www.infoworld.com/article/3247799/development-tools/what-is-llvm-the-power-behind-swift-rust-clang-and-more.html) 在 2015 年停止的维护，这对于任何的软件项目来讲都不是一件好事。在使用 LLVM 的时候更是如此，考虑到每一个版本的 LLVM 所带来的变化数量。

- [llvmlite](https://github.com/numba/llvmlite) 是由 Numba 的开发团队创建的，已经成为了当下在 Python 中做 LLVM 开发的有力竞争者。它基于 Numba 项目的需求，只实现了一小部分 LLVM 的功能。但是这个功能子集已经能够满足大部分 LLVM 开发者使用了。

- [llvmcpy](https://github.com/revng/llvmcpy) 旨在更新 Python 为 C 库提供的绑定，使得它们能够以自动化的形式保持更新，并且 Python 的原生语法使得它们能够很方便的使用。llvmcpy 依然处于初级阶段，但是已经做了很多和 LLVM API 打交道的基础工作。

如果你很好奇如何使用 LLVM 库构建一门语言的话，LLVM 的创造者们提供了教程，该教程使用 C++ 或者 OCAML ，指导你从从 0 到 1 创造一门简单的语言 Kaleidoscope，而且这个示例已经被移植到其他语言上了：

- [Haskell](http://www.stephendiehl.com/llvm/): 和原始教程最接近的移植；

- Python：[一个版本](https://github.com/eliben/pykaleidoscope)和该教程非常接近，[另外一个版本](https://github.com/frederickjeanguerin/pykaleidoscope) 更激进一些，重写了一个交互命令行。两者都使用了 llvmlite 作为和 LLVM 的绑定；

- [Rust](https://github.com/jauhien/iron-kaleidoscope) 和 [Swift](https://harlanhaskins.com/2017/01/08/building-a-compiler-with-swift-in-llvm-part-1-introduction-and-the-lexer.html)：似乎不可避免，我们会得到这两个语言版本的移植版本教程，因为 LLVM 本身更就是因为这二者才得以创造的。

最后，这个教程也有其他人类语言的版本。它已经被翻译成中文了，有使用 [C++](https://github.com/liancheng/llvm-tutorial-cn) 的，也有 [Python](https://github.com/moevis/Kaleidoscope-LLVM-tutorial-zh-cn)。


## LLVM 做不到哪些

以上提到的都是 LLVM 能够提供的功能，它还有一些无法做到的事情，了解一下会比较有用。

举例而言，LLVM 不会进行语法解析。许多工具，比如 [lex/yacc](http://dinosaur.compilertools.net/)，[ﬂex/bison](http://aquamentus.com/flex_bison.html) 以及 [ANTLR](http://www.antlr.org/) 等都已经做了这些工作。解析语法就意味着要和编译行为进行解耦，所以，LLVM 没有试图去做这部分工作也不意外。

LLVM 也不会试图解决围绕某种特定语言更大范围的周边行为。你需要自行安装编译器二进制，管理安装过程中的包以及升级工具链。

最后一点，也是最重要的是，依然又很多语言通用的部分 LLVM 没有原生支持的。许多编程语言都存在垃圾回收内存管理的行为，要么作为管理内存的主要方式，要么作为某种策略，例如 RAII（C++ 和 Rust 语言中使用的）的辅助。LLVM 不提供垃圾回收机制，但是它确实[提供一些工具](https://llvm.org/docs/GarbageCollection.html)，能够允许代码可以使用元数据来做标记使得编写垃圾收集器更加容易。

尽管如此，LLVM 还是存在最终添加原生支持执行垃圾回收机制的可能性。LLVM 正在以每 6 个月一个大版本更新在快速发展。而这个发展步速很大程度上因为目前很多主流编程语言已经把其作为它们开发过程的核心一环。