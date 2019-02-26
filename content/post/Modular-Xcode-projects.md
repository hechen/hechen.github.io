---
title: 模块化 Xcode 工程
date: 2017-11-19 18:17:15
categories: ["Translation"]
tags: ["iOS","XCode","CocoaPods","Carthage"]
---



> 原文：[Modular Xcode projects](https://ppinera.es/2017/09/29/modular-xcode-projects.html)
> 原作者 & Copyright [@pepibumur](http://twitter.com/pepibumur)
> 翻译：[@OgreMergO](https://twitter.com/OgreMergO)



使用 Xcode 构建模块化的工程就需要对工程结构以及其基础概念有很好的理解才行。<!-- more --> 我们平时不怎么关注工程结构本身，只有在工程逐渐变大，要添加更多依赖的时候才会注意的到。而即使到了这个时候，我们大多数的工程都会使用  [CocoaPods](https://cocoapods.org/) 来设置那些依赖项，或者 [Carthage](https://github.com/carthage), 后者虽然没有帮我们做依赖性的设置，但是使得我们会更容易的，通过在工程的 build phase 选项中添加一些内容，达到同样的目的。当配置项越来越复杂，我们就很容易产生困惑，这是因为我们并没有完全掌握 Xcode 工程中所涉及的所有元素。我经常被问到的问题如下：

* 我能不能在工程里同时使用 Carthage，Cocoapods 以及自己个人的依赖设置？
* 我添加了依赖，但是当模拟器打开 App 的时候 Crash 了。
* 为什么我需要只在某些 targets 里嵌入 framework？
* 我的 framework 应该是静态的还是动态的？

在这篇博文中，我会引导你遍历 Xcode Project 中的各个元素，指导你如何通过改变这些元素来模块化你的设置项。我希望下次你遇到上面这些问题的时候，你不需要再花大量时间取 Stack Overflow 上查这些确定的答案。

### Elements ⚒

#### Target

工程（Projects）都是由多个更小的叫做 target 的单元组成的。这些 target 包含编译特定平台产品，比如 frameworks, libraries, apps, testing bundles, extensions 等所需要的配置。 你可以在[这里](https://github.com/xcodeswift/xcproj/blob/master/Sources/xcproj/PBXProductType.swift)看到 target 所有可用的类型。 Target 可以相互依赖，当一个 target A 依赖另外一个 target B 的时候，target B 就会被先构建出来以便 target A 使用其产出。而 target 的配置项会涉及以下几个地方：

* **Info.plist 文件**: 该文件包含产出特定的设置项，比如 版本、App 的名字或者 App 的类型，你可以在[这里](https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Introduction/Introduction.html)详细了解这个文件。
* **Entitlements**: 其指定了应用的能力。如果在授权文件中指定的能力和开发者平台上设置的无法匹配，签名过程就会出错。
* **Build settings**: 如其名字所描述的那样，这些都是构建 target 所必要的设置项。构建设置项要么在 target 自身定义或者在 `xcconfig` 文件中定义。一个 target 的配置项可以继承而来，首先是配置文件本身，其次是 target 的配置项，最后是 project 配置项。
* **Build phases**: 构建流水线由 build phase 定义。当一个 target 被创建出来之后，其包含默认的构建阶段（包含 *构建源码、拷贝资源等*），但是你可以自行添加你需要的。举个例子，这些阶段里，有个 shell script phase 允许你在构建过程中执行一些脚本。这些脚本可以读取 Xcode 暴露出来的那些[构建参数](http://ppinera.es/2017/09/15/modular-xcode-projects.html)。

基于`.xcconfig`文件的可组合性以及其可重用性的考虑，强烈建议你在这些文件中定义你那些编译设置。Target 的配置，比如 build setting 、build phase 等的变更都体现在 `.pbxproj` 文件中，这个文件是一种特殊的plist 文件，当我们使用 Git 管理我们的工程的时候，这个文件很容易出现冲突。当然，更新 `pbxproj` 文件中配置的最简单方式就是使用 Xcode，其了解如何从这些文件中读取配置和向其中写入配置。如果你对不使用 Xcode 更新 `pbxproj` 文件感兴趣的话，你可以试试 [Xcodeproj](https://github.com/cocoapods/xcodeproj) 或者 [xcproj](https://github.com/swift-xcode/xcodeproj)。

构建这些 target 的输出要么是比如 app，extension 或者测试文件等 **bundles**，要么就是**intermediate products** ，例如 library 或者那些封装了代码和资源文件用来给别的 target 使用的 framework。这些 Target 的输出内容你可以在工程文件中的 `Products` 的 Group 下找到，如果有红色的文件引用表示没有 product 输出，很大可能是你还没有构建过这个 target。


#### Scheme

Xcode 工程中另外一个要素是 scheme。 一个工程可以包含多个 scheme，他们可以被共享，作为工程的一部分被人们使用。这些 scheme 指定了 Xcode 中每个具体动作的配置，这些动作包括：**run**，**test**，**profile**，**analyze** 以及 **archive**。 细的来讲，可以指定哪些 target 需要被构建，以什么顺序构建甚至针对每一种动作指定不同的配置。

关于 scheme 的编译配置有一些东西要讲。当我们指定针对哪些动作构建哪些 target 的时候，在下面两种情况下，我们不需要指定每个 target 的依赖项：

1. 如果依赖项是是相同 project 中的一部分，并且已经在 `Target dependencies` 的 `Build Phases` 中定义过；
2. 开启了 `Find implicit dependencies`。

第 2 点中开启的标识，构建过程必须找到 target 的依赖项，并且先行构建。另外，如果你开启了`Parallelize build` 的话，一旦 target 相互之间没有依赖的话，就能够并行构建，因而会节省一部分时间。

一个有问题的构建配置会导致你编译 target 的时候出现错误，比如 `Framework XXX not found`。如果你曾经或者当前遇到了类似的报错，检查一下在构建每个 scheme 的时候，你的 target 的所有依赖是否已经被构建。

scheme 文件定义是存储在 `Project.xcodeproj/xcshareddata/xcodeproj.xcscheme` 路径下的一个标准的 XML 文本，因此你可以很容易的使用任意 XML 编辑器来修改它。

#### Workspace

多个 project 文件被组合成一个 workspace。当 project 被添加到一个 workspace 的时候：

1. 其 schemes 会出现在 workspace 的 scheme 列表中；
2. project 彼此可以产生依赖关系，后文会讲到。

和 scheme 类似，workspace 也是普通的 XML 文件，修改起来很方便。

![工程构建组合中的每一个基础元素： target、scheme、project 以及 workspace 是如何被组织起来的](https://i.imgur.com/wGXI5fy.png)


#### Dependencies 🌱

每个 target 都可以有依赖，这些依赖是 target 需要链接的那些 framework 以及 library等，其包含了能够被 target 共享的源代码以及资源。这些依赖项可以被静态或者动态的链接。

**静态链接：**

* 发生在编译阶段；
* 库（Library）中的代码文件会被包含到应用的二进制文件中（会增大应用的二进制大小）；
* 库使用 .a 作为文件后缀，其来自 (ar)chive file3 type；
* 如果相同的库被多次链接，编译器会由于 duplicated symbols 编译失败。


**动态链接：**

* 模块在应用启动或者运行过程中被加载；
* 应用或者扩展的 target 都可以共享相同的动态库（仅被复制一份）

关于 framework 和 library（无论是静态链接还是动态链接）的区别在于前者可以在相同的 bundle 中包含多个版本，还可以包含额外的资源文件。

> 一个 Library 是一个 .a 文件，其来源于 归档（archive）文件类型。一个单一的归档文件仅支持单一的架构。如果需要打包多个架构，则需要将其打包成胖Match-O二进制（**fat Match-O binary**），该二进制文件是一种容器格式，其将支持不同架构的Mach-O打包在一起。如果我们想生成、修改一个胖二进制文件或者从其中提取某个特定架构的库的话，可以使用命令行工具`lipo`。

你可以在[这里](https://pewpewthespells.com/blog/static_and_dynamic_libraries.html)了解更多关于 frameworks/libraries 以及 static/dynamic 的内容。


![动态链接和静态链接的区别](https://i.imgur.com/qKHdwhp.png)

应用的依赖项分为预编译过的（**precompiled**）和未经编译过（**not-compiled**）两类。

##### Precompiled dependencies

[Carthage](https://github.com/carthage) 是这类型依赖的典型代表。某些 SDK，比如 [Firebase](https://github.com/CocoaPods/Specs/blob/master/Specs/0/3/5/Firebase/4.2.0/Firebase.podspec.json#L23) 就是作为编译过的依赖来发布的。当预编译过的依赖是库（library）的时候，这些依赖就包含 `.a` 的库及一个公共头文件，包含了该库所暴露出的公共接口。当这些依赖是 framework 的时候，这些依赖就以包含了库和资源文件的 `.framework` 文件发布。

当我们的 app 依赖的是预编译依赖的时候，很重要的一点是，这些依赖也是依照我们 app 所构建架构来构建出来的。一旦其中缺失某个架构的代码，我们就会在编译 app 的时候收到编译错误。一会儿后文会看到，Carthage 使用 lipo 工具生成那些包含模拟器或者真机所必须的架构的 framework 的，同时根据构建配置来剔除掉那些不需要的 framework。


##### Non-compiled dependencies

[CocoaPods](https://cocoapods.org/) 是该种类型的典型代表。依赖项被定义在我们要链接的 frameworks/libraries 的 target 中。这里有多种方式在 Xcode 中指定我们的 target 依赖其他 target 的输出。

* **如果这些 target 分布在同一个 project 中**，你可以在 Build Phase 的*Target dependencies* 中指定依赖。 Xcode 会在编译该 target 的时候首先编译这些指定的依赖项；
* **如果这些 target 分布在不同的 project 中**，我们就可以使用*Scheme*来定义这些 target 之间的依赖关系。在 scheme 的 Build 部分，我们可以定义要被构建的 target 以及以什么顺序构建（基于他们之间的依赖关系）。如果你开启了*Find implicit dependencies*标识，Xcode 能够根据每个 target 的输入输出来猜测依赖。如果 scheme 中有错误配置，你就会得到类似`xxxx.framework not found`的错误。如果在 framework 之间出现了循环依赖也会报类似的错误。

> 关于依赖项和配置项有个需要注意的地方：所有依赖项的配置一定要完全匹配。如果你在使用 Alpha 配置项构建你的 app，但是其依赖项中但凡出现了不包含这种配置，编译过程都会因为找不到某个 framework 而失败。当这种情况发生的时候，Xcode 不会编译该 framework 但是不报任何错误。

![各个依赖项是如何基于 project 的配置得到编译的](https://i.imgur.com/TrXKUTJ.png)


### Linking with Xcode

Target 本身可以链接其他 target 的输出，我们可以使用 Xcode 中的工具，比如 scheme 或者 target dependencies 来指定依赖，但是，我们是如何通过定义这些依赖的链接关系来将它们融为一体的？

#### 1\. 动态或者静态链接 libraries 和 frameworks

我们可以通过以下的方式定义链接：

* **一个构建阶段（build phase）：**，在所有可用的 build phase 中，有一个是定义链接的，*Link Binary With Libraries*。你可以在这里添加某个 target 的依赖项，这些依赖项可以来自于同一个 project，也可以来自同一个 workspace 中的其他 project。这个 build phase 被 Xcode 用来识别 target 被构建时所需的依赖项；
* **编译器构建设置：**一个 build phase 中所定义的内容会被转换成编译器参数。其中某些内容你也可以通过定义编译设置项做到：
* `FRAMEWORK_SEARCH_PATHS`：定义编译器所链接的 framework 所在路径
* `LIBRARY_SEARCH_PATHS`：定义编译器所链接的 library 所在路径
* `OTHER_LDFLAGS` *(Other Linker Flags)*：我们可以使用`-l`参数指定链接的 library，比如`-l"1PasswordExtension" -l"Adjust"`。如果需要链接一个 framework，就需要使用`-framework`参数，比如：`-framework "GoogleSignIn" -framework "HockeySDK"`。如果我们尝试链接一个无法在上方指定路径中找到的 framework 或者 library 的话，编译过程就会失败。


#### 2\. 暴露库的头文件

Library 的头文件需要暴露给依赖该库的 targe。为了做到这个，有一个编译设置项：`HEADER_SEARCH_PATHS`用来指定头文件所在路径。如果我们链接某个库，但是忘记暴露该库的头文件，编译过程就会因为找不到其头文件而失败。

#### 3\. 将 Framework 嵌入到应用中

App 的 target 链接动态 framework，需要把这些依赖项复制到应用的 bundle 中。这个过程被称作 **framework embedding**。为了达到这个目的，我们需要使用 Xcode 的**Copy Files Phase**，其拷贝 这些 framework 到 `Frameworks`目录中。不仅仅需要把这些直接依赖项嵌入应用中，还包括直接依赖所依赖的项目。如果缺少任意的 framework，当我们尝试打开 app 的时候都会抛出错误。

* * *


### 案例学习 👨‍💻

在这个部分，我们会分析以下 Cocopods 和 Carthage 是如何贯彻上面这些概念来管理你的工程依赖的。

#### CocoaPods

![CocoaPods](https://i.imgur.com/yYLLsbQ.png)


Cocoapods 解析你的工程依赖，并将它们融合到你的工程中。虽然直接修改你的工程配置是不太推荐的，但是它从最初的版本已经有了很大的提升，用这种方式，我们几乎不需要对 project 做很多改变。那么它底层到底是怎么做到的？

* 它创建一个工程（project）*(*`*Pods.xcodeproj*`*)* ，其包含了所有的依赖项，每个依赖项以 target 的形式存在。每个 target 各自编译需要被链接到 app 中的依赖项；
* 它创建一个额外的 target，其依赖于其他所有的依赖项。该 target 是一个 umbrella target，用来触发其他 target 的编译。这样做也最小程度的减少了你的 project 中所需要的改变。通过链接这个 target，Xcode 会先编译其所有依赖项，然后是你的 app；
* 它创建了一个 workspace，包含了你的 project 以及 Pods project；
* Frameworks 和 libraries 使用`.xcconfig`文件链接。这些文件被加到了你的 project 群组中，并且被设置为你 project 中 target 的配置项；
* 嵌入过程是通过一个构建阶段脚本（build phase script）来做到的。类似的，所有的 framework 所需要的资源也通过一个构建阶段（build phase）来完成。

下面这张图展示了整个设置过程：

![CocoaPods 如何将依赖项融合到整个 Project 中](https://i.imgur.com/UARMUhl.png)


#### Carthage

![Carthage](https://i.imgur.com/IUXCxhQ.png)


Carthage 的方式和 CocoaPods 比起来大不同。除了依赖项的解析，该工具是还一种去中心化的模式，其生成那些需要被链接或者嵌入到 app 的依赖项的预编译版本。

* Carthage 解析依赖项，并且编译它们生成你能够链接到 app 中的动态 framework，或者为了调试所需要的符号。这些 framework 是 fat framework，支持模拟器和真机的架构；
* 这些 framework 被用户使用 *Link Binary With Libraries* 的构建阶段（build phase）手动的链接；
* 嵌入过程使用 Carthage 提供的脚本完成。这个脚本会剔除那些我们正在构建目标所不必要的架构版本；
* 使用同样的脚本，复制符号到合适的文件夹，使得调试能够正常进行。


![Carthage 是如何生成依赖项的 framework 和 symbol](https://i.imgur.com/HXqtoDl.png)


### References

* [Framework vs Library](http://www.knowstack.com/framework-vs-library-cocoa-ios/)
* [Static and dynamic libraries](https://pewpewthespells.com/blog/static_and_dynamic_libraries.html)
* [Xcode Build Settings Reference](https://pewpewthespells.com/blog/buildsettings.html)
* [Embedding Frameworks in an App](https://developer.apple.com/library/content/technotes/tn2435/_index.html)
* [Introduction to Framework Programming Guide](https://developer.apple.com/library/content/documentation/MacOSX/Conceptual/BPFrameworks/Frameworks.html)
* [Skippy Copy Phase Strip](https://www.cocoanetics.com/2015/04/skipping-copy-phase-strip/)



