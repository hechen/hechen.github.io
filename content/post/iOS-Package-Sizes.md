---
title: "关于 iOS 安装包的几种大小"
date: 2018-12-20T17:29:54+08:00
draft: true
categories: ["性能优化"]
tags: ["Dock","Cocoa", "Menu", "Agent","Login"]
---

该文章针对在 iOS App 从编译输出，到 iTunes Connect 后台上传，接着 App Store 发售这几个阶段中 App Size 的变化总结而来。旨在希望能够了解各个阶段每个 App 包大小的区别。

<!-- more -->


首先需要明确几个大小显示：

iTunes Connect 后台显示的预估大小
TestFlight App 内显示的 Build 预览
App Store 显示的 App 大小
实际下载的 IPA 文件大小
本地解压缩之后的 IPA 目录大小以及其中 .app 文件大小


下面以知乎 App 为例，针对这几种大小进行解释：



iTunes Connect 后台显示的预估大小列表

当开发人员上传新的 IPA 包到 iTunes 后台之后，在 iTunes Connect 上即可看到我们上传的 Build 以及本次 Build 的审核状态等信息，在某个 Build 的详情页面，这里以 4.30.0（1158） Build 为例，如下图所示：





此时可以看到有一项 App Store File Sizes 会明确告知你当前 Build 的 IPA 包在 App Store 中针对各个机型所显示的大小详情：



1158 Build 为线上 4.30.0 版本正式包，从上图可以看到几个需要注意的点：

1. 大小分为 Download Size 和 Install Size 两种；
2. 知乎 App 在所有机型上都是一样的 Size。



我们逐一解释，



首先，存在两种大小 Download Size 和 Install Size 也就解释了，我们实际上从 App Store 下载一个 App 包的实际下载大小并不是之后安装完毕之后真正需要耗费的手机空间的大小，AppStore 上显示的是在下载 IPA 文件之后解压之后需要占用的空间大小，而实际下载的是针对目标机型的压缩包。而在 App Store 中显示的某个 Build 的大小是一个大而全，包揽了所有目前支持机型的架构，资源等的一个压缩包。

其次，针对各个机型为何还存在不同的下载大小和安装大小呢，为什么知乎 App 都是一样的大小显示呢？为什么基本和我们那个上传完成之后的压缩包基本一致的大小呢？



这里有几个原因是知乎 App 的目前的属性决定的：

通用 App；
图片资源并未通过 Assets Category 管理，因此所有的设备不会因为是否是是否支持 Retina 或者 LCD 等不同而下载不同的 @1x 或者 @2x @3x 等图片（This is a side effect for Zhihu's Resources.）；
只支持 arm64 Architecture 的设备，所以如上图中列表，我们只支持 iPhone5S 系列年代 及之后的设备；
而具体针对这些包做了什么处理，下文会有讲。因此 Apple 在 iOS 9 引入的 Apple Slicing 对知乎 App 而言没有任何影响。



TestFlight App 中展示大小


1157 Build 的版本如下显示， 1157 Build 和 1158 Build 的代码相同，只是区分 TF 和正式包所用，在 TF 的显示页面也印证了该大小，其上显示 200.9 MB ～ 201 MB

移动平台团队 > 001 关于 iOS 安装包的几种大小区别 > TF_1157.png



App Store 显示大小


> When your application is approved by Apple to sell on the App Store, it is encrypted for DRM purposes and re-compressed. When the encryption is added, the size of the compressed file will increase. The exact size of the increase will vary from app to app, however, the size increase can be large when the binary contains a lot of contiguous zeros. We are unable to guarantee the size of your file after the encryption has been added.



1158 Build在 App Store 显示如下图所示为 200.9 MB，因此是和 TF 展示的大小一样，和 Apple Connect 后台给出的一致。

移动平台团队 > 001 关于 iOS 安装包的几种大小区别 > IMG_ECB7AC0EE981-1.jpeg

下载到本地的流量消耗大小


我们进行抓包，看到下载的 IPA 实际需要流量如下图所示的 125.53 MB，这里可能和之前预估的有一些出入

移动平台团队 > 001 关于 iOS 安装包的几种大小区别 > IMG_EB91411F1607-1.jpeg移动平台团队 > 001 关于 iOS 安装包的几种大小区别 > IMG_96B08028EEF8-1.jpeg





从我们下载的 ipa 包的文件名 rsp_raw_pre_thinned585438170827180261-2Ethinned-2Esigned-2Edpkg  来看，该 IPA 包为 Thinned，Signed，dpkg 包也印证了 Apple 是进行了 Slicing 这个过程的，不过我们就算做了这个过程也是没有任何变化的，具体原因在 【02】关于减小包体积 Apple 做了哪些事情 有说明。其中 thinned .ipa 在官方技术 QA 中是这样描述的：

A thinned .ipa is a compressed app bundle that contains only the resources needed to run the app on a specific device. Bitcode has been recompiled, and additional resources needed by the App Store, such as .dSYM files and On Demand Resources, are removed. For App Store apps, this .ipa is downloaded to devices running iOS 9 or later.



由于 IPA 包本质上是 ZIP 包，因此可以自行解压，看到具体每一项的大小，针对上面的  rsp_raw_pre_thinned585438170827180261-2Ethinned-2Esigned-2Edpkg.ipa 文件解压之后如图示，占用大小

移动平台团队 > 001 关于 iOS 安装包的几种大小区别 > image2018-12-17_17-17-2.png



iPhone Storage 的 App 占用大小


在系统设置的 iPhone 存储中的 App 大小列表中可以查看刚刚安装完毕的 App 在本机所实际占用的大小，如图：



移动平台团队 > 001 关于 iOS 安装包的几种大小区别 > IMG_F0A331DE0930-1.png



参考链接：


1. [](https://help.apple.com/xcode/mac/current/#/devbbdc5ce4f)
2. [](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/On_Demand_Resources_Guide/index.html#//apple_ref/doc/uid/TP40015083-CH2-SW1)