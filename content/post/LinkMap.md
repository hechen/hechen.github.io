---
title: "通过 LinkMap 做崩溃日志分发"
date: 2018-11-18T17:29:54+08:00
lastmod: 2019-04-01T10:20:38+08:00
draft: true
categories: ["iOS"]
tags: ["Crash","LinkMap","Dispatch"]
---

## LinkMap 是什么？

我们编写的代码都是要经过编译，链接等一步一步生成可执行文件。而 LinkMap 文件是 Xcode 产生可执行文件的同时生成的链接信息，用来描述可执行文件的构造成分，包括代码段（__TEXT）和数据段（__DATA）的分布情况。LinkMap 说白了就是整个链接过程中涉及到的目标文件的记录，它是一个纯文本文件。

## 如何生成？

具体生成需要 Xcode 配合开启某个参数，具体在对应 App 的主 Target 的 Build Setting 选项里，参数为 Write Link Map File，将其修改为 YES，即可在编译阶段生成对应的 Link Map 文件。 相对应的在 Project 文件中的控制参数为 LD_GENERATE_MAP_FILE

![Project Target Setting](https://i.imgur.com/wpKkAGW.png)

LinkMap 文件生成的默认地址如下，其实在上图中的 Path to Link Map File 就能看到，可以指定不同 Scheme 下的文件路径，我这里直接使用默认路径了（只是有点长）：

    $(TARGET_TEMP_DIR)/$(PRODUCT_NAME)-LinkMap-$(CURRENT_VARIANT)-$(CURRENT_ARCH).txt

那实际在我的电脑上，结合知乎 iOS 工程，编译完成之后在 DerivedData 目录下会生成一堆 build 副产品，其中名称为 {Target}-LinkMap-xxx.txt 文件就是我们所说的 LinkMap 文件。如下图所示：

![LinkMap 文件所在](https://i.imgur.com/24Su9xe.png)

## LinkMap 内容解析

使用知乎主项目 Debug Scheme 下编译完成之后，在 Derived Data 目录下生成的 LinkMap 文件大小达到了 120+M。其本质上是一个 txt 文件，我们看下主要包含几个部分：

### 头部基础信息


```    
Path: /Users/chen/Library/Developer/Xcode/DerivedData/osee2unified-fwevarpdypzxobaetkykvdvesdbf/Build/Products/Debug-iphonesimulator/osee2unifiedRelease.app/osee2unifiedRelease
Arch: x86_64
```

### 类信息

列举可执行文件中所有的 .obj 文件，如下所示，第一列为对应的类文件编号，我们在代码文件中编译完成的类都会生成一个对应的 Object File. 其中第一列的文件编号在后续符号进行查找回溯来源的时候有用。

```
    # Object files:
    
    [ 0] linker synthesized
    [ 1] dtrace
    [ 2] /Users/chen/Library/Developer/Xcode/DerivedData/osee2unified-fwevarpdypzxobaetkykvdvesdbf/Build/Intermediates.noindex/osee2unified.build/Debug-iphonesimulator/osee2unifiedRelease.build/Objects-normal/x86_64/ZHEmailAutocompleteTextField.o
    [ 3] /Users/chen/Library/Developer/Xcode/DerivedData/osee2unified-fwevarpdypzxobaetkykvdvesdbf/Build/Intermediates.noindex/osee2unified.build/Debug-iphonesimulator/osee2unifiedRelease.build/Objects-normal/x86_64/ZHURLProtocolStartupItem.o
    ...
    [7808] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftQuartzCore.dylib
    [7809] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftCore.dylib
    [7810] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftFoundation.dylib
    [7811] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftCoreGraphics.dylib
    [7812] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftDispatch.dylib
    [7813] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftDarwin.dylib
    [7814] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftUIKit.dylib
    [7815] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftSwiftOnoneSupport.dylib
    [7816] /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphonesimulator/libswiftObjectiveC.dylib

```
### 段信息

第二部分，主要编译阶段生成的 Section 信息。如下所示：

```
    # Sections:
    
    # Address Size Segment Section
    
    0x100002860 0x04B8E6AD __TEXT __text
    0x104B90F0E 0x0000A0B0 __TEXT __stubs
    0x104B9AFC0 0x00005C9A __TEXT __stub_helper
    0x104BA0C60 0x00259CBE __TEXT __cstring
    0x104DFA91E 0x00188A6C __TEXT __objc_methname
    0x104F8338A 0x0002E326 __TEXT __objc_classname
    0x104FB16B0 0x00066ABF __TEXT __objc_methtype
    0x105018170 0x000267C6 __TEXT __ustring
    0x10503E938 0x0029C500 __TEXT __gcc_except_tab
    0x1052DAE40 0x000CE490 __TEXT __const
    0x1053A92D0 0x000493AC __TEXT __swift3_typeref
    0x1053F267C 0x00017BCC __TEXT __swift3_capture
    0x10540A250 0x0000E6B7 __TEXT __swift3_reflstr
    0x105418908 0x000112EC __TEXT __swift3_fieldmd
    0x105429BF4 0x00002850 __TEXT __swift3_assocty
    0x10542C448 0x00007BA0 __TEXT __swift2_proto
    0x105433FE8 0x000011F0 __TEXT __swift2_types
    0x1054351D8 0x000007BC __TEXT __swift3_builtin
    0x105435994 0x00000378 __TEXT __entitlements
    0x105435D0C 0x0000037B __TEXT __dof_RACSignal
    0x105436087 0x000002E8 __TEXT __dof_RACCompou
    0x105436370 0x00069B70 __TEXT __unwind_info
    0x10549FEE0 0x0002D120 __TEXT __eh_frame
    0x1054CD000 0x00000010 __DATA __nl_symbol_ptr
    0x1054CD010 0x000037D0 __DATA __got
    0x1054D07E0 0x0000D640 __DATA __la_symbol_ptr
    0x1054DDE20 0x00000CC0 __DATA __mod_init_func
    0x1054DEAE0 0x00000008 __DATA __mod_term_func
    0x1054DEAF0 0x0019A0A0 __DATA __const
    0x105678B90 0x000E2940 __DATA __cfstring
    0x10575B4D0 0x0000DF48 __DATA __objc_classlist
    0x105769418 0x00000108 __DATA __objc_nlclslist
    0x105769520 0x00001468 __DATA __objc_catlist
    0x10576A988 0x000001D8 __DATA __objc_nlcatlist
    0x10576AB60 0x000022C0 __DATA __objc_protolist
    0x10576CE20 0x00000008 __DATA __objc_imageinfo
    0x10576CE28 0x005E2510 __DATA __objc_const
    0x105D4F338 0x0005EBB0 __DATA __objc_selrefs
    0x105DADEE8 0x000009B8 __DATA __objc_protorefs
    0x105DAE8A0 0x0000B890 __DATA __objc_classrefs
    0x105DBA130 0x000088B0 __DATA __objc_superrefs
    0x105DC29E0 0x00033288 __DATA __objc_ivar
    0x105DF5C68 0x0009EDB8 __DATA __objc_data
    0x105E94A20 0x0008EDE0 __DATA __data
    0x105F23800 0x0001A034 __DATA __bss
    0x105F3D840 0x00004168 __DATA __common

```

其中描述了各个段在可执行文件中的地址，具体的段大小以及该段的类别。从内容可以看到每个段的地址都是上一个段的地址+上一段的大小所得。 具体公式：

 
```  
Address(n) = Address(n-1) + Size(n-1)
```

但是，因为编译器优化，会将段地址进行一定的偏移，让地址在带宽的整数倍位置启动，因此有可能会有不一致的情况，比如下面实际上看到的地址是 **0x104B90F0E**。官方文档有说明：

> For best performance, segments should be aligned on virtual memory page boundaries—4096 bytes for PowerPC and x86 processors. To calculate the size of a segment, add up the size of each section, then round up the sum to the next virtual memory page boundary (4096 bytes, or 4 kilobytes). Using this algorithm, the minimum size of a segment is 4 kilobytes, and thereafter it is sized at 4 kilobyte increments.

其中第三列标记出了该段的类型，比如 代码段，数据段等信息，第四列列举除了真实代码块所对应生成的 Section， 这里需要给大家再强调下 Segment 和 Section 的区别和联系。

> 我们知道 Mach-O 是 iOS 和 OSX 系统上使用的可执行文件格式类型，类似于 Linux 系统下的 ELF（Executable Linkable Format） 文件格式以及 Windows 上使用的 PE(Portable Executable) 文件格式，其本质上都是基于最早的 COFF（Common file format）的变种。其中有一个目前大家所熟知的就是针对参与编译的代码文件中不同部分的代码最后会被编译进入不同的 Section 中，比如代码段 .text 数据段 .data 等。后续在发展虚拟存储地址和内存物理地址的对应关系中，因为为了避免段过多导致的空间浪费问题，对于相同权限的段被合并到了一起作为一个段进行映射，前者就是之前的 section，后者就是 Segment。
实际上 Segment 的概念是从装载的角度重新划分了 ELF 文件的各个段。将目标文件链接成可执行文件的时候，链接器会尽量把相同权限属性的段分配在同一空间。在 ELF 中把这些属性相似的又连在一起的段叫做一个 Segment。
> Segment 和 Section 是从不同的角度来划分同一个ELF文件。这个在ELF中被称为不同的视图（View），从“Section”的角度来看ELF文件就是链接视图（Linking View），从“Segment”的角度来看就是执行视图（Execution View）。当我们在谈到ELF装载时，“段”专门指“Segment”；而在其他的情况下，“段”指的是 Section。

### 符号信息

第三部分就是具体的每一项符号信息，具体是位置信息，比如在内存映像中的地址以及所属的文件是什么，第三列中的 Index 指的就是上面具体每一个 object file 列表中第一列的序号。

```
    # Symbols:
    
    # Address Size File Name
    
    0x100002860 0x000000D0 [ 2] -[ZHEmailAutocompleteTextField initWithFrame:]
    0x100002930 0x00000690 [ 2] -[ZHEmailAutocompleteTextField setupAutocompleteTextField]
    0x100002FC0 0x000007B0 [ 2] -[ZHEmailAutocompleteTextField textField:completionForPrefix:ignoreCase:]
    0x100003770 0x00000030 [ 2] -[ZHEmailAutocompleteTextField emailDomains]
    0x1000037A0 0x00000040 [ 2] -[ZHEmailAutocompleteTextField setEmailDomains:]
    0x1000037E0 0x00000033 [ 2] -[ZHEmailAutocompleteTextField .cxx_destruct]
    0x100003820 0x00000020 [ 3] -[ZHURLProtocolStartupItem introduction]
    0x100003840 0x0000014A [ 3] -[ZHURLProtocolStartupItem execute:]
    
    ...
    
    0x104BA0C32 0x0000000A [7816] __T010ObjectiveC2eeoiSbAA8SelectorV_ADtF
    0x104BA0C3C 0x0000000A [7816] __T010ObjectiveC2eeoiSbSo8NSObjectC_ADtF
    0x104BA0C46 0x0000000A [7816] __T010ObjectiveC8SelectorV11descriptionSSvg
    0x104BA0C50 0x0000000A [7816] __T010ObjectiveC8SelectorV9hashValueSivg
    0x104BA0C60 0x00000027 [ 2] literal string: kNSObjectUpdateThemeNormalNotification
    0x104BA0C87 0x00000025 [ 2] literal string: kNSObjectUpdateThemeHighNotification
    0x104BA0CAC 0x0000000C [ 2] literal string: emailDomain
    0x104BA0CB8 0x0000000A [ 2] literal string: [gmail.com](http://gmail.com/)
    0x104BA0CC2 0x00000009 [ 2] literal string: [live.com](http://live.com/)
    0x104BA0CCB 0x0000000C [ 2] literal string: [hotmail.com](http://hotmail.com/)
    
    ...
    
    0x104DFA7D6 0x00000018 [7802] literal string: T@"NSArray",R,N,V_codes
    0x104DFA7EE 0x00000011 [7805] literal string: kCFAllocatorNull
    0x104DFA7FF 0x0000001C [7805] literal string: CFDataCreateWithBytesNoCopy
    0x104DFA81B 0x0000001D [7805] literal string: CFPropertyListCreateWithData
    0x104DFA838 0x00000020 [7805] literal string: CFPropertyListCreateFromXMLData
    0x104DFA858 0x00000020 [7805] literal string: CFStringCreateWithCStringNoCopy
    0x104DFA878 0x00000015 [7805] literal string: CFDictionaryGetValue
    0x104DFA88D 0x0000000C [7805] literal string: CFGetTypeID
    0x104DFA899 0x00000012 [7805] literal string: CFStringGetTypeID
    0x104DFA8AB 0x00000013 [7805] literal string: CFStringGetCString
    0x104DFA8BE 0x0000000A [7805] literal string: CFRelease
    0x104DFA8C8 0x00000031 [7805] literal string: /System/Library/CoreServices/SystemVersion.plist
    0x104DFA8F9 0x00000016 [7805] literal string: IPHONE_SIMULATOR_ROOT
    0x104DFA90F 0x0000000F [7805] literal string: ProductVersion
    0x104DFA91E 0x0000000F [ 2] literal string: initWithFrame:
    0x104DFA92D 0x00000011 [ 2] literal string: setKeyboardType:
    0x104DFA93E 0x0000001B [ 2] literal string: setupAutocompleteTextField
    
    ...
    
    0x104F83383 0x00000007 [7802] literal string: _codes
    0x104F8338A 0x0000001D [ 2] literal string: ZHEmailAutocompleteTextField
    0x104F833A7 0x00000019 [ 2] literal string: ZHAutocompleteDataSource
    0x104F833C0 0x00000009 [ 2] literal string: NSObject
    0x104F833C9 0x00000002 [ 2] literal string:
    0x104F833CB 0x00000019 [ 3] literal string: ZHURLProtocolStartupItem
    
    ...
    
    0x104FB165B 0x00000016 [7802] literal string: PLCrashReporterConfig
    0x104FB1671 0x00000020 [7802] literal string: PLCrashUncaughtExceptionHandler
    0x104FB1691 0x0000001F [7802] literal string: PLCrashReportMachExceptionInfo
    0x104FB16B0 0x0000000B [ 2] literal string: B24@0:8@16
    0x104FB16BB 0x00000008 [ 2] literal string: #16@0:8
    0x104FB16C3 0x00000008 [ 2] literal string: @16@0:8
    0x104FB16CB 0x0000000B [ 2] literal string: @24@0:8:16
    0x104FB16D6 0x0000000E [ 2] literal string: @32@0:8:16@24
    0x104FB16E4 0x00000011 [ 2] literal string: @40@0:8:16@24@32
    0x104FB16F5 0x00000008 [ 2] literal string: B16@0:8
    
    ...
    
    0x10501808E 0x00000042 [7802] literal string: @228@0:8{plcrash_mach_exception_port_set=I[13I][13I][13i][13i]}16
    0x1050180D0 0x0000003E [7802] literal string: {plcrash_mach_exception_port_set=I[13I][13I][13i][13i]}16@0:8
    0x10501810E 0x00000061 [7802] literal string: {plcrash_mach_exception_port_set="count"I"masks"[13I]"ports"[13I]"behaviors"[13i]"flavors"[13i]}
    0x105018170 0x0000002C [ 3] l_.str.465
    0x10501819C 0x0000000C [ 5] l_.str.5
    0x1050181A8 0x00000010 [ 5] l_.str.9
    0x1050181B8 0x0000000A [ 5] l_.str.13
    0x1050181C2 0x0000000E [ 5] l_.str.15
    0x1050181D0 0x00000042 [ 5] l_.str.17
    0x105018212 0x00000006 [ 5] l_.str.138
    
    ...
```

看到在 File 一列中的数字就指代第一部分统计出来的各个 .o 文件，比如下面前几行记录 File 为 2，也就是第一部分中记录的 ZHEmailAutocompleteTextField.o ，然后其中第一列地址是该符号在指定 .o 文件中的地址，我们通过看该地址能够知道其处于第二部分哪个段中，比如第一行的 `initWithFrame` 位于 __TEXT.__text 中，地址为 0x100002860，占用大小为 208 字节。

因此，比如我们要查找某一个 Symbol 所属的 Framework 的话，就能够通过 index 回溯到具体 object 文件。

## LinkMap 能用来做什么？

既然了解了 LinkMap 具体的文件结构，我们能够用这个文件来做什么？

首先，是该文件列举了所有被打入可执行文件的库文件中所有的目标文件（理解一个目标文件就是一个 Source），无论是 framework 还是 静态库文件都有，并且给出了每个 Symbol 的信息，我们能够回溯到该 Symbol 对应的目标文件，进而能够知道该目标文件所处的 framework。

例如，如下图，从 bugly 上看到某一个 Crash 发生的地方，我们首先定位和知乎 App 本身相关的堆栈如下所示，从堆栈信息提取出具体的 Symbol 是 `[ZHPinTextView touchesEnded:withEvent:]`


![](https://i.imgur.com/pegf6J6.png)

那我们通过在 LinkMap 文件中查找该符号，得到如下信息：

![](https://i.imgur.com/IeWodUn.png)

可以确定为 Index 为 5135 的目标文件中的 Symbol，那此时通过回溯 Object 文件，可以得到如下：

![](https://i.imgur.com/tKUEqKE.png)

这样就可以很确定该 Symbol 出自于 ZHModuleDB.framework 了。从而为 Crash 日志的业务分发提供了可行性的保障。

其次，除了能够追溯符号所属大的目标文件，通过上面的文件结构好能够计算得知每一个 Framework 都有多少 目标文件（.o 文件），并且每个 .o 文件的大小是多少以及这单个 framework 的总体大小，从而对包体积的监控也具备了可行性。

1. 统计可执行包中每个业务模块具体占用可执行文件的大小以及占比；
2. 对比不同版本，可以知道每个具体模块新增文件大小，从而可以做出主动报警来对包体积大小做一定的控制


## 注意事项：

### 关于 Symbol 匹配规则

因为真实的 Symbol 会被编译系统进行一定程度的混淆，所以不能直接精准匹配，最好的方式是通过模糊查找，在实现的时候通过正则匹配或者尽可能的缩小 Symbol 查找精准度来做，还有就是 Swift 中的 Symbol 因为加入了 namespace 和 method overload 的概念导致符号信息更是不能完全匹配。

举个🌰：

比如在 ZHPaymentSDK 中定义了某个 swift 类为  KMSubscriptionLauncher.swift 文件中定义个方法，

```    
@objc public func subscribe(withSkuID skuID: String?, autoRenewable: Bool = true, begin: SubscriptionBeginCallback?, cancel: SubscriptionCancelledCallback?, pollingBegin: SubscriptionBeginPollingCallback?, success: SubscriptionSuccessCallback?, failed: SubscriptionFailedCallback?) { }
```

生成对应符号的时候，系统就会把所有的可用的方法全生成出来，如下所示：

``` 
0x104587950 0x00000008 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFfA0*
    0x104587958 0x000004B0 [7834] __T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtF
    0x104587E08 0x00000038 [7834] l_objectdestroy
    0x104587E40 0x00000868 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFyycfU*
    0x1045886A8 0x000000F4 [7834] l_objectdestroy.8
    0x10458879C 0x00000078 [7834] __T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFyycfU_TA
    0x104588814 0x000000B4 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFyycfU_yAEcfU*
    0x1045888C8 0x00000244 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFyycfU_yAE_SaySSGSgtcfU0*
    0x104588B0C 0x000000B4 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFyycfU_yAEcfU1*
    0x104588BC0 0x00000168 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFyycfU_yAN_AEtcfU2*
    0x104588D28 0x00000164 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFyycfU_yAN_AEtcfU2_s23CustomStringConvertible_pyXKfu*
    0x104588E8C 0x00000134 [7834] _*T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFySo16ZHKMContractInfoCSg_ANtcfU0*
    0x104588FC0 0x0000005C [7834] l_objectdestroy.11
    0x10458901C 0x0000002C [7834] __T012ZHPaymentSDK22KMSubscriptionLauncherC9subscribeySSSg9withSkuID_Sb13autoRenewableyycSg5beginAH6cancelAH12pollingBeginAH7successys5Error_pSgcSg6failedtFySo16ZHKMContractInfoCSg_ANtcfU0_TA

```

这就是符号修饰和方法签名，越是复杂的语法，修饰机制越是复杂。比如拥有类、继承、虚机制、重载、名称空间等特性的 C++ 语言，其对符号的管理更为复杂。专业术语叫 Name Mangling。Swift 在一定程度上借鉴了其签名机制，不过我们不用深究，如果想知道其对应的原符号签名，使用现有工具即可。

Xcode 工具集中提供了 swift 的 demangle 工具，你可以使用以下命令对某个符号的逆向解析。

```
xcrun swift-demangle xxxxxxx
```

## Crash 解析

以上，我们了解了 LinkMap 都是什么并且能够做什么了，用 Python 写了一段脚本，放在了 [Github](https://github.com/hechen/CrashReportParser) 上，有兴趣可以用一下。

## 参考链接

1. [mikeash.com: Friday Q&A 2014-08-15: Swift Name Mangling](https://mikeash.com/pyblog/friday-qa-2014-08-15-swift-name-mangling.html)
2. [mattgallagher/CwlDemangle](https://github.com/mattgallagher/CwlDemangle/)
3. [Comparing Swift to C++ for parsing](https://www.cocoawithlove.com/blog/2016/05/01/swift-name-demangling.html)