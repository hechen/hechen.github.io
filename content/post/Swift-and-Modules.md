---
title: 在 Swift Framework 中使用 C 文件的过程探索
date: 2019-01-03 21:19:24
tags: ["Swift", "Module", "CocoaPods"]
categories: ["Swift"]
top_img: https://i.imgur.com/NJi1fs6.jpg
---


## 问题描述

我们在开发线上诊断工具需求的时候，是以单个 Pod 的形式提供支持，并且代码文件中只有纯 Swift 文件，但是其中需要用到系统的 C 库的一些功能，本次就是使用了系统 C 库中 `resolv.h` 这个文件来进行 DNS 解析所用。

当后期 Pod 功能完善之后，在 Example 工程中也已经编译通过之后，接入主项目中之后遇到了下面这个编译错误：

![Error When Compile](https://i.imgur.com/ADh0sy6.png)


具体文字错误信息如下：


```txt
/Users/chen/Repos/Work/ZHDiagnosisTool/ZHDiagnosisTool/Classes/Core/Network/ZHDiagnosisTool-Network-Header.h:8:10: 
    Include of non-modular header inside framework module 'Diagnosis.ZHDiagnosisTool_Network_Header': '/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS12.1.sdk/usr/include/resolv.h'
```

大概的意思就是在 Umbrella Header 中加入的 Bridging header 指定了 include 一个 C 文件，而该 C 文件本身并不是  Modular Header， 因此编译无法通过。这就涉及了目前 iOS 生态中普遍使用的 Modules 概念。

## 几个概念

### Modules

Modules 的概念是 XCode 5 带到 iOS 开发者面前的，从那时起 LLVM 编译器就已经内在支持了，具体关于其历史在 [WWDC 2013 Session笔记 - Xcode5和ObjC新特性](https://onevcat.com/2013/06/new-in-xcode5-and-objc/) 这篇文章中已经讲解的非常详细了，不再赘述，总结一句话就是：

> Modules 是被引入 LLVM 层面的，用以解决之前 C/C++ 系中 #include 和 #import 带来的引用泛滥以及编译时间过长的问题的一种手段。

尤其是在 Swift 引入之后，Module 的概念应该已经深入人心。大家可能已经习惯直接使用 @import 来引用某个 Module，或者其中某个功能单元。尤其是使用 CocoaPods 集成开发的时候，其内部实际上也是做了一些 module 的工作，在 Pods 目录中充斥着 `.modulemap` 的身影，想必大家经常看到。

而 一个 module 的属性是由定义它的 `.modulemap` 文件来决定的，其简单语法大概如下：

``` Shell
module module_name [system] {
    header "header.h"
    link "linked_library"
    export *
}
```

如果对其中 [Modules 的语法](https://clang.llvm.org/docs/Modules.html#module-map-language)感兴趣，可以到 Clang 的官方文档下通读下，你肯定会对 Modules 这一套有更清楚的认识。

### Umbrella Header

说起来，Umbrella Header 是在 Framework 的概念被引入的，你可以理解为一个模块均存在一个 Umbrella Header 用来将那些你想暴露给模块外界调用的头文件包裹在一起。避免使用者在使用该模块的时候需要手动输入多个 Header 的一种解决方案。 其实 Mac 端很早就有这个概念，iOS 中特指 iOS 8 开始官方加入 Dynamic Framework 以后的概念。

如下所示，没有 Umbrella Header 的情况下你需要将所有需要引入的头文件依次写出。

```objc
#import <XYZModule/XYZCustomCell.h>
#import <XYZModule/XYZCustomView.h>
#import <XYZModule/XYZCustomViewController.h>
```
在使用了 Umbrella Header 之后，你只需要下面一行即可。

```objc
#import <XYZModule/XYZModule.h>
```
当然，还存在 umbrella framework，感兴趣大家可以到[官方文档](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPFrameworks/Concepts/FrameworkAnatomy.html#//apple_ref/doc/uid/20002253-97623-BAJJHAJC)下观看。

### Bridging-Header

桥接文件是在 Swift 推出之后，Apple 引入iOS 生态的用以桥接 Swift 和 Objective-C 相互调用的一种方式 （Mix and Match），如下图所示，如果在 Swift 中想使用 Objective-C 类定义的内容，就需要建立 Bridging Header，然后在其中定义你想要暴露的 OC 头文件。

![Bridging Header](https://i.imgur.com/YwqHEKJ.png)

具体的操作在[官方文档](https://developer.apple.com/documentation/swift/imported_c_and_objective-c_apis/importing_objective-c_into_swift)有针对在同一个 App Target 和在同一个 Framework 内两种情况均有说明。

> 在梳理这些概念的过程中，发现自己之前对桥接文件有个误区，如果你在 App 的主 Target 中需要进行 OC 和 Swift 的混编，使用 Bridging Header 是必选，如果你是在同一个 Framework 中进行的混编，Bridging-Header 是并不需要的，你需要做的只是在 Umbrella Header 里加入你想暴露给 Swift 文件使用的 OC 头文件即可，之前自己一直是显式的建立一个 Bridging-Header，然后在 Umbrella Header 中引入该头文件，想来这种方式只是将你想暴露在外的头文件进行了二次包裹而已，因为 Cocoapods 是将所有 public header 均加入到 umbrella header 里了，因此单个 framework 内部开发，即使没有 bridge header 也是能够将符号暴露给 Swift 的。

### Cocoapods

我们每次执行 `pod install` 的时候，如果你使用 `—verbose` 来看详细安装过程就能看到，针对每一个将要被安装的 Pod 均会执行生成 module map 和 umbrella header 这两个阶段，如下所示部分 Install 指令的代码，代码位于 `lib/cocoapods/installer/xcode/pods_project_generator/aggregate_target_installer.rb` 

    
```ruby
def install!
       UI.message "- Installing target `#{target.name}` #{target.platform}" do
       native_target = add_target
       create_support_files_dir
       create_support_files_group
       create_xcconfig_file(native_target)
       if target.host_requires_frameworks?
          create_info_plist_file(target.info_plist_path, native_target, target.version, target.platform)
    	    create_module_map(native_target)
          create_umbrella_header(native_target)
       elsif target.uses_swift?
          create_module_map(native_target)
    			create_umbrella_header(native_target)
       end
      
     # Some Code
     # Some Code
     # Some Code      
    end
```

很明确，Cocoapods 在 install 某个 Pod 的时候会执行创建 module map 文件以及 umbrella header 文件的工作。详细的代码大家可以直接到 Cocoapods 源码下  `lib/cocoapods/generator` 目录下看，分别是 `module_map.rb` 和 `umbrella_header.rb` 文件。

其中在各自文件的注释部分也有针对生成文件的说明，比如 `module_map.rb` 中说明了 module map 的作用，

> Generates LLVM module map files. A module map file is generated for each Pod and for each Pod target definition that is built as a framework. It specifies a different umbrella header than usual to avoid name conflicts with existing headers of the podspec.

在 `umbrella_header.rb` 中说明了 umbrella header 的作用，

> Generates an umbrella header file for clang modules, which are used by dynamic frameworks on iOS 8 and OSX 10.10 under the hood. If the target is a +PodTarget+, then the umbrella header is required to make all public headers in a convenient manner available without the need to write out header declarations for every library header.

## 问题原因

首先解答：为什么 Example 工程能够编译通过 而用了主工程是无法编译通过？

因为目前主工程都要求我们自行开发的 pod 以动态 framework 的形式参与，但是在 Example 工程开发的时候我们的 `podfile` 并未指定 `use_frameworks!` 用以产出动态 framework，因此未暴露出该问题，也就是说只有以 framework 的形式的 module 才会有该问题，准确的说，应该是 `Dynamic Framework`

了解了以上概念之后，我们再来看我们的问题，首先我们的问题是在 framework 内部调用系统 C 库代码出现的问题，从 Xcode 的报错，我们知道我们通过 bridging header 引入的 C 文件并不以 module 的形式存在，因此编译器报错。

## 解决过程

其实吧，大家都能想到，使用 Objective-C 做个封装，或者干脆直接调用 C 文件的类用 OC 重写不就完了么，可是如果下次你再遇到了呢？ 或者要改造了一个纯 Swift 库呢？知其所以然，才能避免再次落坑吧。

> 因为 Objective-C 自身编译器是帮你做了 modular 化的，当然，如果你选择了前者，还有个限制，你并不能把上面 C 的头文件放到你的 Objective-C 的头文件中，因为本质上，最后这个头文件还是要暴露给 Umbrella Header 的。

首先，能否允许编译器支持在 module 中引入非 modular 的头文件呢？ 

Xcode 在 build setting 中提供了  `Allow Non-modular Includes In Framework Modules` 来控制是否允许在当前 framework 中支持非 modular 头文件引入，其并不适用于纯 Swift 项目，而且即使适用，其会导致所有用到该 framework 的大的编译单元都不能再使用 module 形式引入头文件了，也就是必须适用平坦式的 `#include ""` 形式。

![Build Setting](https://i.imgur.com/S4i2chx.png)

最后，通过只能从根源上来解决该问题了，既然需要引入的文件是 modular header，我们就要想办法来将其包裹为 module。 在查找解决方案的过程中发现，就在 Swift 刚推出的时候，大家已经遇到这个问题了，遇到最多的就是`CommonCrypto` 经常被使用到的 C 库，常见的 MD5 计算就是其提供的 API，但是在前几年官方并未将该动态库 module 化，因此导致你无法在 Swift 文件中直接使用类似 `#import <CommonCrypto/CommonCrypto.h>` 这种写法。自然而言多了很多解决方案，如下出自 StackOverflow 上 [Importing CommonCrypto in a Swift framework](https://stackoverflow.com/questions/25248598/importing-commoncrypto-in-a-swift-framework/37125785#37125785) 的帖子下面就提供了多种解决方案：

> 还是那句话，你是可以通过 Objective-C 做桥接来达到同样效果的。毕竟 Swift 本身就是一门心思想抛开 C 的历史包袱，因此想拥有一个纯纯的 Swift 代码不沾染一点 C 文件气息，你就要做一些工作。

其中根本问题就是为 `CommonCrypto` 这个 C 编译单元定义 module，上面也提到了 LLVM 是通过 `modulemap` 文件来识别的，所以只要通过 `.modulemap` 来定义即可，

```
    module CommonCrypto [system] {
        header "/usr/include/CommonCrypto/CommonCrypto.h"
        export *
    }
```

定义的 modulemap 自然可以放到任意目录，只要让编译单元在编译的时候能够搜索的到即可，Xcode 选项的 Build Settings 下的 Swift Compiler - Search Paths 。添加 .modulemap 文件所在路径即可。在编译的时候 LLVM 自然会查找到 .modulemap 文件自动生成 Module 信息。你此时就可以在使用  CommonCrypto 的地方使用 modular header 了。

过了几年之后，官方才将该库定义为 module，在 Xcode 自带的 iOS SDK 中 `/usr/include/CommonCrypto` 下可以看到 `module.modulemap` 文件：


```
module CommonCrypto [system] [extern_c] {
      umbrella header "CommonCrypto.h"
      export *
      module * { export * }
      
      module Error {
          header "CommonCryptoError.h"
          export *
      }
      
      module Random {
          header "CommonRandom.h"
          export *
      }
    }

```
大家也注意到了在 CommonCrypto 的同级目录中实际上还有很多的系统 C 库代码，并且也有一个 module.modulemap 文件，我裁剪一段代码大家看下：

 
``` 
module Compression [system] [extern_c] {
    header "compression.h"
    export *
    link "compression"
}
    
module Darwin [system] [extern_c] [no_undeclared_includes] {
    // Headers that are repeatedly included, and therefore should not be
    	// assigned to any given module.
    	exclude header "_structs.h"
    	exclude header "sys/_structs.h"
    
    	// C standard library
    	module C {
    		textual header "assert.h"
    
    	  module setjmp {
    			header "setjmp.h"
    			export *
    		}
    
    		module signal {
    			header "signal.h"
    			export *
    		}
    
    		module stdio {
    			header "stdio.h"
    			export *
    		}
    }
    
    module zlib [system] [extern_c] {
    	header "zlib.h"
    	export *
    	link "z"
    }
    
    module SQLite3 [system] [extern_c] {
    	header "sqlite3.h"
    	link "sqlite3"
    	explicit module Ext {
    		header "sqlite3ext.h"
    		export *
    	}
    	export *
    }

```
这也是为什么我们在 Swift 代码里可以直接使用类似 `import Darwin.C.stdio` 写法的原因。但是还是存在一些 C 库并没有被定义为 module，而本次用来做 DNS 解析的 `resolv.h` 就是其中一员。

具体到我们解决思路里来看就是要解决 modulemap 如何定义，如何和我们目前使用的 cocoapods 整合的问题了。既然是在作为 pod 进行开发，自然是需要将 module map 文件加入到 pod 的代码管理中去。比如将其放置于单个 pod 根目录下，然后在 podspec 中配置好路径以便编译的时候 Swift Search Paths 中有它。自然，我们可以建立 resolv.modulemap 如下：


```shell 
module Resolv [system] {
    header "/usr/include/resolv.h"
    export *
}
```

然后在对应的 podspec 文件中配置 build setting 中的参数，如下所示


```ruby
s.subspec 'Core' do |core|
    core.source_files   = ['ZHDiagnosisTool/Classes/Core/**/*'] 
    core.preserve_paths = 'ZHDiagnosisTool/Classes/Core/ModuleMap'
    core.pod_target_xcconfig = {
        'SWIFT_INCLUDE_PATHS[sdk=macosx*]'           => '$(PODS_ROOT)/ZHDiagnosisTool/Classes/Core/ModuleMap',
        'SWIFT_INCLUDE_PATHS[sdk=iphoneos*]'         => '$(PODS_ROOT)/ZHDiagnosisTool/Classes/Core/ModuleMap',
        'SWIFT_INCLUDE_PATHS[sdk=iphonesimulator*]'  => '$(PODS_ROOT)/ZHDiagnosisTool/Classes/Core/ModuleMap',
      }
end

```
可是，问题出在 PODS_ROOTS 这个路径上，如果我们进行本地开发，该路径就是 Cocoapods 执行完毕之后生成的临时 Pods 目录，并不是原始 podspec 文件所在的地方，而官方也表明了，不会对这种 Local Pods 特定提供一个环境变量来获取， 如下链接可以看到：

[local pod development on a project that includes libraries · Issue #809 · CocoaPods/CocoaPods](https://github.com/CocoaPods/CocoaPods/issues/809)

如图中，指定 $(PODS_ROOT) 路径实际上在开发 Local Pod 的时候就会找不到，所以就需要按照上面链接中的方式自行手动拼接路径，所以，我们尽可能不用 PODS_ROOT 这个路径，需要另外找一个不会因为 Pod 位置而变化的路径。

最终参考了以下 repo 中工程的解决方案，

[onmyway133/Arcane](https://github.com/onmyway133/Arcane)

其中作者使用 Pod 的 script phase 来完成 .modulemap 的操作，这样会更加灵活。

这样，针对我们自己本次的需求来看，.podspec 中的 script 如下所写即可：


```shell
# Create
FRAMEWORK_DIR="${BUILT_PRODUCTS_DIR}/RESOLV.framework"
          
if [ -d "${FRAMEWORK_DIR}" ]; then
    echo "${FRAMEWORK_DIR} already exists, so skipping the rest of the script."
    exit 0
fi
          
mkdir -p "${FRAMEWORK_DIR}/Modules"
          
echo "module RESOLV [system] {
    header \"${SDKROOT}/usr/include/resolv.h\"
    export *
}" > "${FRAMEWORK_DIR}/Modules/module.modulemap"
               
    
# Generate fake header...
[ -d "${FRAMEWORK_DIR}/Headers" ] || mkdir "${FRAMEWORK_DIR}/Headers"
touch "${FRAMEWORK_DIR}/Headers/resolv.h"
    
# Soft link C header to local framework Headers
ln -sf "${SDKROOT}/usr/include/resolv.h" "${FRAMEWORK_DIR}/Headers/resolv.h"
```

每次在编译运行前，我们会自行创建一个 `Resolv.framework`，其中 Header 目录中我们放一个空白文件并且软链接到真正想要链接的头文件上，然后在该 framework 中创建 modulemap 文件。

之后，我们在 .podspec 中指定 script phase 为编译前即可，如下所示，


``` ruby
s.script_phase = {
    :name => 'Resolv',
    :script => script_above,
    :execution_position => :before_compile
}
```

这样，通过 `Resolv.framework` 的桥接，Swift 代码中就可以直接通过 `import RESOLV` 来使用了。当然，链接这一环你可以通过以下两种形式达到：

1. 直接在 podspec 文件中指定依赖，如 `core.library = "resolv"`
2. 在 `.modulemap` 文件中显式的 link，如下所示：

```shell
module Resolv [system] {
    header "/usr/include/resolv.h"
    link "resolv"
    export *
}
```

而且通过将 module map 文件放置于 product 产出目录这里也解决了路径指定的问题，因为 product folder 是默认在编译的搜索路径下的。



## 总结

总结来看，就是想要在纯 Swift 的项目中引入系统 C 库文件（这里指的是未被 modular 化的文件，因为有些 C 文件已经被系统默认封装成了 module 了）。以上只是一些简单的概念讲解，整个编译系统以及套件都是长时间不断演化的结果，这里也只是简单的讲述，有一些概念实际上也只是点到为止，大家如果感兴趣可以多找一些相关资料阅读下，亲自试一试。

## 参考资料

1. [Modules](http://llvm.org/devmtg/2012-11/Gregor-Modules.pdf)
2. [LLVM - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/LLVM)
3. [Modules - Clang 8 documentation](https://clang.llvm.org/docs/Modules.html#introduction)
4. [WWDC 2013 Session笔记 - Xcode5和ObjC新特性](https://onevcat.com/2013/06/new-in-xcode5-and-objc/)
5. [Importing CommonCrypto in a Swift framework](https://stackoverflow.com/questions/25248598/importing-commoncrypto-in-a-swift-framework/37125785#37125785)
6. [Adding CommonCrypto to custom Swift framework |Apple Developer Forums](https://forums.developer.apple.com/thread/46477)
7. [How to call C code from Swift - The.Swift.Dev.](https://theswiftdev.com/2018/01/15/how-to-call-c-code-from-swift/)
8. [Using a C library inside a Swift framework - Swift and iOS Writing - Medium](https://medium.com/swift-and-ios-writing/using-a-c-library-inside-a-swift-framework-d041d7b701d9/)