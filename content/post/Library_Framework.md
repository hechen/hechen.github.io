---
title: "关于 Library 和 Framework"
date: 2019-04-26T00:35:30+08:00
draft: true
categories: ["macOS"]
tags: ["Library", "Framework","Mach-O"]
---

在链接 Library 以及 Framework 之前，我们需要先了解一下 Mach—O，这篇文章并不是讲述 Mach-O 格式本身的，这里只先了解点概念。 

提到 Mach-O ，需要明确下 object file（目标文件）的概念，其实质上是指那些由源代码编译之后生成的，还未进行链接的中间文件（比如 Linux 下的 .o 以及 Windows 下的 .obj），它和可执行文件的内容和结构很相似，所以一般上会跟可执行文件格式采用一样的格式存储。

那在 Unix 系统上的 COFF 是当时发明的在 Unix 表示一个目标文件的存取格式，后来 Linux 基于 COFF 发明了 ELF，而 Windows 基于 COFF 发明了 PE 格式。广义上来说，目标文件与可执行文件几乎一样。在 Linux 下统称为 ELF 文件，Windows 上统称为 PE-COFF 文件，而在 Mac 上我们的目标文件就是 Mach-O 格式，其在目标文件的大体组成上和其他两种很相似。

我们以 Linux 上 ELF 结构的一张图来大概说明一下情况，不同的源文件通过分类，将代码和数据，以及变量放入不同的职责段，代码段 _TEXT，数据段 _DATA 等。
![ELF](https://i.imgur.com/ozMscrW.jpg)


而 Mach-O 文件格式大致如下：


我们通过将如下代码编译输出成可执行文件来看，

``` C
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

通过 clang 工具套件编译源文件生成可执行文件。

``` Shell
// output the main.o
clang -c main.m
// link main.o with c lib
// default output file is a.out, you can specify another name with -o
clang main.o -Wl,`xcrun --show-sdk-path`/usr/lib/libSystem.B.tbd
```

接着可以使用 MachOView 来查看刚才 a.out 以及 main.o 文件。
> MachOView 是一款开源软件，用以查看目标文件格式的，不过已经好几年没有更新了，所有有的 Load Command 识别不出。

![a.out 的内容](https://i.imgur.com/ehG4guP.png)
我们再看看 main.o 这个目标文件的结构是怎么样的。

![main.o 的内容](https://i.imgur.com/tOzXqC1.png)
在 Header 的信息中，我们能看到具体该目标文件能够执行的 CPU 指令集，具体该文件的类型，以及有多少 Load Commands。



### Library

上面提到，每个源文件最终都会生成对应的目标文件，当工程项目变大之后，我们希望能够将具体协同工作的单一组件内的目标文件一起进行交付，对于功能稳定的代码无需参与再次编译的过程，我们需要将同一个组件内部的所有目标文件归拢到一起，这也是初期库（Library） 出现的由来。简单而言，库就是一堆目标文件的集合。

通过简单的 ar 命令即可将多个 .o 文件整合成一个 .a 文件，同时使用 ranlib 命令更新静态库 .a 的符号索引。

  
``` 
ar -r libfoo.a foo.o bar.o baz.o
ranlib libfoo.a
```

### Static Library

关于静态和动态的由来，是因为链接过程的不同而产生，基于静态链接的库被称作静态库，基于动态链接的库被称作动态库（共享库）。

静态库实质上是目标文件的集合。它是把很多目标文件捆绑在一起形成一个文件，再加上一些索引，你可以简单地把它理解为一个包含有很多目标文件的文件包。也就是上面我们介绍的 .a 文件。

静态库的存在形式使得不同的成员开发者和部门都能够独立的自行开发自己的功能功能和程序模块，在一定阶段和程度上是大大提高了开发效率的，但是静态库也有一些问题：

1. 浪费内存和磁盘空间
2. 模块更新难

以最简单的 HelloWorld.c 为例，如果使用静态库引入，也就是 C 的标准库要以静态库的方式参与链接到程序内部，平均一个 C 程序会使用到大概 1MB 的空间（磁盘以及内存），如果我们操作系统运行 100 个这样简单的程序就需要近 100MB 的空间，这个不太可取，而且这些标准库本身所有的程序都需要一人带一份，不太可取。

另外一个问题是模块更新问题，因为最终要在链接阶段直接链接到可执行文件中，因此一旦某个模块发生变化，我们需要将该静态库重新进行编译，链接，发布，而且整个可执行文件都做了变更，因此需要完整的替换掉当下的可执行文件。

例如一个程序如果包含 20 个模块，每个模块 1 MB，每次更新任何一个模块，用户需要重新获取 20MB 的程序。

要想解决以上两个问题，最简单的办法就是将程序的每个模块隔离开，形成单独的文件，而不再将其都混合在一起。简单的来说，就是不再对那些组成程序的目标文件进行链接，而是等到程序用的时候再实时的进行链接，这个也是动态链接的基本思想，而基于动态链接产生的 Library 支持，即为共享库（动态链接库）

### Dynamic Library

动态链接最大的变化在于可执行程序和动态链接的目标文件是独立的两个文件，只是在程序初始执行的目标文件（比如 main 入口所在的文件）内部持有动态链接库的符号，当真正运行起来，需要用到对应的符号时，链接器才去查找对应目标文件，然后链接执行。

当运行程序需要更新的时候，我们不需要完整的编译二进制可执行文件，而只需要在动态库的接口不变的前提下，仅仅更新那部分包含了所需升级功能的动态库而已。这一点，在 Windows 系统上体现的尤为明显。

当然动态链接也存在自身的问题，很常见的一个问题，当程序所使用的其中一个模块发生更新之后，很容易造成库接口不兼容导致程序无法运行，这也是为什么有的时候你更新完系统，原来使用好好的 App 打开发生闪退或者某个功能无法使用了的缘故。

另外一个缺点就是，由于所需调用的符号不再和可执行文件在一起，在进行方法调用的时候，过程要比之前复杂的多，要先找对应的动态库文件，如果在内存中不存在，还需要再去磁盘中实时加载，导致动态库的方法调用时间要比静态链接的情况下慢。

在 Mac / iOS 上所有的动态库都是通过 dyld 来进行动态加载的，这里不详细说明了，大概列一下动态库的加载顺序：

1. 首先会加载系统级别的dylib, 目录在设备的`/usr/lib/`, 文件:`libsqlite3.dylib、libc++.1.dylib...`
2. 然后加载系统级别的framework, 目录在设备的`/System/Library/Frameworks`, 文件:`Foundation.framework`
3. 再引入runtime、gcd存放的dylib, 目录在设备的`/usr/lib/`, 文件:`libSystem.B.dylib、libobjc.A.dylib`
4. 再引入自己注入的dylib, `@executable_path/`(目录存放在当前可执行文件底下)

而对于 App 来讲，实际上的路径是通过 @rpath 来指定的，该符号说白了就是占位符，当你的 App 成功安装到 iOS 系统之后，@rpath 就是该 App 的安装路径，以某个 iap 文件内部的可执行文件为例，使用 otool 查看其依赖的动态库如下：

``` Shell
    otool -L osee2unifiedRelease.app/osee2unifiedRelease
    
    
    osee2unifiedRelease.app/osee2unifiedRelease:
    	/usr/lib/libbz2.1.0.dylib (compatibility version 1.0.0, current version 1.0.5)
    	/usr/lib/libc++.1.dylib (compatibility version 1.0.0, current version 400.9.4)
    	/usr/lib/libiconv.2.dylib (compatibility version 7.0.0, current version 7.0.0)
    	/usr/lib/libicucore.A.dylib (compatibility version 1.0.0, current version 62.1.0)
    	/usr/lib/libresolv.9.dylib (compatibility version 1.0.0, current version 1.0.0)
    	/usr/lib/libsqlite3.dylib (compatibility version 9.0.0, current version 274.20.0)
    	/usr/lib/libxml2.2.dylib (compatibility version 10.0.0, current version 10.9.0)
    	/usr/lib/libz.1.dylib (compatibility version 1.0.0, current version 1.2.11)
    	/System/Library/Frameworks/AVFoundation.framework/AVFoundation (compatibility version 1.0.0, current version 2.0.0)
    	/System/Library/Frameworks/Accelerate.framework/Accelerate (compatibility version 1.0.0, current version 4.0.0)
    	/System/Library/Frameworks/AdSupport.framework/AdSupport (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/AudioToolbox.framework/AudioToolbox (compatibility version 1.0.0, current version 492.0.0)
    	/System/Library/Frameworks/CFNetwork.framework/CFNetwork (compatibility version 1.0.0, current version 975.0.3)
    	/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation (compatibility version 150.0.0, current version 1560.10.0)
    	/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics (compatibility version 64.0.0, current version 1245.9.2)
    	/System/Library/Frameworks/CoreLocation.framework/CoreLocation (compatibility version 1.0.0, current version 2245.8.12)
    	/System/Library/Frameworks/CoreMotion.framework/CoreMotion (compatibility version 1.0.0, current version 2245.8.12)
    	/System/Library/Frameworks/CoreSpotlight.framework/CoreSpotlight (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/CoreTelephony.framework/CoreTelephony (compatibility version 1.0.0, current version 0.0.0)
    	/System/Library/Frameworks/CoreText.framework/CoreText (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/ExternalAccessory.framework/ExternalAccessory (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/Foundation.framework/Foundation (compatibility version 300.0.0, current version 1560.10.0)
    	/System/Library/Frameworks/GLKit.framework/GLKit (compatibility version 1.0.0, current version 103.2.0)
    	/System/Library/Frameworks/ImageIO.framework/ImageIO (compatibility version 1.0.0, current version 0.0.0)
    	/System/Library/Frameworks/MediaPlayer.framework/MediaPlayer (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/MobileCoreServices.framework/MobileCoreServices (compatibility version 1.0.0, current version 935.2.0)
    	/System/Library/Frameworks/OpenGLES.framework/OpenGLES (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/Photos.framework/Photos (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/QuartzCore.framework/QuartzCore (compatibility version 1.2.0, current version 1.11.0)
    	/System/Library/Frameworks/Security.framework/Security (compatibility version 1.0.0, current version 58286.222.2)
    	/System/Library/Frameworks/SystemConfiguration.framework/SystemConfiguration (compatibility version 1.0.0, current version 963.200.27)
    	/System/Library/Frameworks/UIKit.framework/UIKit (compatibility version 1.0.0, current version 61000.0.0)
    	@rpath/VideoEdit.framework/VideoEdit (compatibility version 1.0.0, current version 1.0.0)
    	@rpath/VideoPlayer.framework/VideoPlayer (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/VideoToolbox.framework/VideoToolbox (compatibility version 1.0.0, current version 1.0.0)
    	@rpath/ZmFFmpeg.framework/ZmFFmpeg (compatibility version 1.0.0, current version 1.0.0)
    	@rpath/du.framework/du (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/Metal.framework/Metal (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/CoreMedia.framework/CoreMedia (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/WebKit.framework/WebKit (compatibility version 1.0.0, current version 606.2.104)
    	/System/Library/Frameworks/Social.framework/Social (compatibility version 1.0.0, current version 87.0.0)
    	/System/Library/Frameworks/Accounts.framework/Accounts (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/MessageUI.framework/MessageUI (compatibility version 1.0.0, current version 3445.100.42)
    	/System/Library/Frameworks/AddressBook.framework/AddressBook (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/StoreKit.framework/StoreKit (compatibility version 1.0.0, current version 1.0.0)
    	/usr/lib/libobjc.A.dylib (compatibility version 1.0.0, current version 228.0.0)
    	/usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.200.5)
    	/System/Library/Frameworks/AssetsLibrary.framework/AssetsLibrary (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/Contacts.framework/Contacts (compatibility version 0.0.0, current version 0.0.0)
    	/System/Library/Frameworks/CoreData.framework/CoreData (compatibility version 1.0.0, current version 866.2.0)
    	/System/Library/Frameworks/CoreImage.framework/CoreImage (compatibility version 1.0.0, current version 5.0.0)
    	/System/Library/Frameworks/CoreVideo.framework/CoreVideo (compatibility version 1.2.0, current version 1.5.0)
    	/System/Library/Frameworks/EventKit.framework/EventKit (compatibility version 1.0.0, current version 100.0.0)
    	/System/Library/Frameworks/LocalAuthentication.framework/LocalAuthentication (compatibility version 1.0.0, current version 425.222.1)
    	/System/Library/Frameworks/MapKit.framework/MapKit (compatibility version 1.0.0, current version 14.0.0)
    	/System/Library/Frameworks/MetalKit.framework/MetalKit (compatibility version 1.0.0, current version 113.0.0)
    	/System/Library/Frameworks/NetworkExtension.framework/NetworkExtension (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/PassKit.framework/PassKit (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/SafariServices.framework/SafariServices (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/UserNotifications.framework/UserNotifications (compatibility version 1.0.0, current version 1.0.0)
    	/System/Library/Frameworks/iAd.framework/iAd (compatibility version 1.0.0, current version 1.0.0)
    	@rpath/libswiftAVFoundation.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftAccelerate.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftContacts.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCore.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCoreAudio.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCoreData.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCoreFoundation.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCoreGraphics.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCoreImage.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCoreLocation.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftCoreMedia.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftDarwin.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftDispatch.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftFoundation.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftGLKit.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftMapKit.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftMediaPlayer.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftMetal.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftModelIO.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftObjectiveC.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftPhotos.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftQuartzCore.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftUIKit.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftos.dylib (compatibility version 1.0.0, current version 1000.11.42)
    	@rpath/libswiftsimd.dylib (compatibility version 1.0.0, current version 1000.11.42)
``` 

dyld 是开源的，感兴趣可以一看。

[opensource-apple/dyld](https://github.com/opensource-apple/dyld)

### Framework

在库刚出现的时候，我们将自己创建的 Library 提供给对方的时候，不仅需要将 .a 文件提供给对方，还需要同时提供 Header，用以开发人员在高级语言层面能够直观的使用该库提供的功能。后来，我们的模块越来越大，不仅仅包含代码文件，还加入了资源文件，Apple 引入了 framework 的概念用来将一个独立功能模块所需提供的内容打包提供。

> A framework is a bundle (a structured directory) that contains a dynamic shared library along with associated resources, such as nib files, image files, and header files.

所以，你要明白，framework 本质上只是一种 Bundle 存在的形式，类似于一种目录结构，其并无动静之分。 内部包含的库文件，如果是静态库，其被称作为静态 Framework，如果内部为动态库，就被称作动态 Framework。由于官方在 iOS 上推出 Framework 的时候直接以 Dynamic Framework 的形式推出，通过 Xcode 创建的 Target 我们也可以了解。 

### Text Based .dylib Stubs

自 Xcode 7 引入，目前未查找到官方正式文档说明，但是在官方论坛中有 Apple 官方人员针对 .tbd 文件的回应如下：

> For those who are curious, the .tbd files are new "text-based stub libraries", that provide a much more compact version of the stub libraries for use in the SDK, and help to significantly reduce its download size.

以  libc++ 为例，在我们 iOS 开发过程中链接的 libc++ 的动态库是通过 libc++.tbd 引入的，可以查到其原始路径位于每个 SDK 文件夹下。

```
    /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/usr/lib/libc++.tbd
```

使用文本编辑器即可打开查看：

``` Shell
--- !tapi-tbd-v3

   archs:           [ i386, x86_64 ]
    uuids:           [ 'i386: A9FCC99A-209C-348E-BB79-0A29A5FCB82B', 'x86_64: 66B692F1-FA7E-3CBB-817A-73A7FE29A765' ]
    platform:        ios
    install-name:    '/usr/lib/libc++.1.dylib'
    current-version: 400.9.4
    objc-constraint: none
    exports:         
      - archs:           [ i386 ]
        symbols:         [ __ZNKSt3__18messagesIcE6do_getEiiiRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE, 
                           __ZNKSt3__18messagesIcE8do_closeEi, __ZNKSt3__18messagesIwE6do_getEiiiRKNS_12basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEEE, 
                           __ZNKSt3__18messagesIwE8do_closeEi, __ZNSt3__111this_thread9sleep_forERKNS_6chrono8durationIxNS_5ratioILx1ELx1000000000EEEEE, 
                           __ZNSt3__112strstreambuf6__initEPciS1_, __ZNSt3__112strstreambufC1EPKai, 
                           __ZNSt3__112strstreambufC1EPKci, __ZNSt3__112strstreambufC1EPKhi, 
                           __ZNSt3__112strstreambufC1EPaiS1_, __ZNSt3__112strstreambufC1EPciS1_, 
                           __ZNSt3__112strstreambufC1EPhiS1_, __ZNSt3__112strstreambufC1Ei, 
                           __ZNSt3__112strstreambufC2EPKai, __ZNSt3__112strstreambufC2EPKci, 
                           __ZNSt3__112strstreambufC2EPKhi, __ZNSt3__112strstreambufC2EPaiS1_, 
                           __ZNSt3__112strstreambufC2EPciS1_, __ZNSt3__112strstreambufC2EPhiS1_, 
                           __ZNSt3__112strstreambufC2Ei, __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE3getEPci, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE3getEPcic, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE4readEPci, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE6ignoreEii, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE7getlineEPci, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE7getlineEPcic, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE8readsomeEPci, 
                           __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEE3getEPwi, 
                           __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEE3getEPwiw,
```

其中将本身的动态链接库所提供出的符号（函数，全局变量等）列出，因为在 macOS 以及 iOS 中系统目录下已经集成了这些动态库，因为为了避免不必要的下载和提供重复的动态链接库，因而提供了 tbd 这种格式文件用来做桥接。实质上当真正可执行文件进行链接的时候，会加载系统原有的动态链接库，这个具体的动态链接库位置由 `install-name` 给出。

简而言之，tbd 是 Apple 用来减小 SDK 体积大小所提供的中间文件。

所以，当你下载 Xcode 的时候，其自带的 SDK 中包含的动态链接库大部分均为 tbd 格式，而真正我们运行起来可执行文件之后加载的动态链接库会直接使用系统目录下的（无论是 iOS 还是 macOS）。