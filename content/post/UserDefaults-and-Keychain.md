---
title: UserDefaults and Keychain
date: 2018-12-21 14:30:50
category: ["iOS"]
tags: ["UserDefaults","Keychain"]
---

Apple 提供了几种持久化方案，其中 UserDefaults 和 Keychain 是 App 开发过程中使用频率最高的方案，而且从以往和同事的探讨过程中发现对这两个概念中有一些细节还是理解不太透彻，因此本文会针对这二者展开讲一讲。

## UserDefaults

首先，阅读完 Apple 关于 UserDefaults 一节的文档描述之后，我觉得有两个需要注意的点：

1. UserDefaults 的构成
2. UserDefaults 的目的


### UserDefaults 构成

我们可以看看具体 UserDefaults 存储的地方，如下图，我们在应用中写入 Demo 数据：

![Write Key-Value to UserDefaults](https://i.imgur.com/wq9onOa.png)

打印 Library 路径，在 Finder 中打开路径:

![Library](https://i.imgur.com/65ybYX6.png)

如下展示内容，可以看到在 Preferences 目录中存在某个文件，例如该 App Library 目录下存放的文件为 `app.chen.ios.PersistenceDemo.plist`

![Cache](https://i.imgur.com/ChqnDJa.png)
![Preferences](https://i.imgur.com/cPvlFdR.png)

该 plist 内容如图所示，即为我们之前在 App 中写入的 Key-Value。

![plist](https://i.imgur.com/shdXoZN.png)


所以这也证明了，我们针对 UserDefaults 的读写实质上是针对 plist 文件的读写。

iOS 系统会自动帮你做 `plist` 文件的读入以及 Cache，根据情况会把你在内存中所做的操作同步到 `plist` 文件（UserDefaults 同步到内存是同步的，同步到 Database 是异步的， iOS 8 开始，会有一个常驻进程 `cfprefsd` 来负责同步）。

所以你会看有iOS 面试题目会问题： 系统的 `UserDefaults` 的本质以及和 plist 文件的直接读写的区别？（这题目太 TM 偏了。。。）

> UserDefaults caches the information to avoid having to open the user’s defaults database each time you need a default value. When you set a default value, it’s changed synchronously within your process, and asynchronously to persistent storage and other processes.

所以，实质上，你是可以直接针对 UserDefaults 的最终产物 plist 文件进行操作的，当然，这是有风险的，而且无法保障正常使用的。官方在文档中也提醒了开发者。

> Don’t try to access the preferences subsystem directly. Modifying preference property list files may result in loss of changes, delay of reflecting changes, and app crashes. To configure preferences, use the defaults command-line utility in macOS instead.

那既然本质上 UserDefaults 是使用 plist 文件进行存储，那也要求了我们能存储的 Value 只能支持 `plist` 所支持的格式，例如 `String`，`Number`，`Array`，`Data`，`Date` 等，当然如果你要存储自定义的类，其需要遵守 `Codable` 协议（实质也是要归档为 `Data`）

![plist](https://i.imgur.com/cxWHfvS.png)

### UserDefaults 目的

> The defaults system allows an app to customize its behavior to match a user’s preferences. For example, you can allow users to specify their preferred units of measurement or media playback speed. Apps store these preferences by assigning values to a set of parameters in a user’s defaults database. 

一般我们在 `UserDefaults` 存储的数据都是用户的某些配置项，不因为用户使用过程中出现意外而丢失，比如是否开启了日夜间模式了，是否开启了大图模式了等等。或者存储一些对安全方面不敏感的数据

不建议往 `UserDefaults` 里存储较大的数据，例如直接存储一张图片。而对于这种需要存储较大文件的需求，你可以将文件本身存储到本地，而 `UserDefaults` 里只存储该文件的路径。

毕竟在 App 启动之后，UserDefaults 会进行 IO ，读取本地 plist 文件，因此一定程度上，也会较少 App 启动之后 UserDefaults API 针对 `plist` 文件 IO 的时间，纯属个人揣测，没有经过实验验证。

### 关于 Extension 中 UserDefaults 的应用


iOS 上 Extension 和 Host App 之间做数据共享也是通过 UserDefaults，开启 App Group 之后，这二者就可以修改同一份配置。具体 Extension 和 Host App 之间的内在关系可以先看下 Apple 文档。本质上如下所示，


![app_extensions_container_restrictions](https://i.imgur.com/cZFlz6o.png)


Extension 和 Host App 之间通过 Shared Container 来做数据共享，该 SharedContainer 私有，因此不存在于单一 App 的沙盒内。应该是系统会单独开辟一块空间用以做共享数据的存储。

> After you enable app groups, an app extension and its containing app can both use the NSUserDefaults API to share access to user preferences. To enable this sharing, use the initWithSuiteName: method to instantiate a new NSUserDefaults object, passing in the identifier of the shared group.

因为 UserDefaults 既然是暴露在本地能够访问的文件当中的，因此不要在 UserDefaults 里存储任何 Security-Sensitive 的数据。 如果要存储保密级别较高的数据，就要用到另外一种持久化方案 ── Keychain


## Keychain

关于 Keychain，是 Apple 提供给开发者用来存储 Security-Sensitive 的数据了，比如登录密码，用户标识，加密数据等等。 官方示意图如下，其实中间 Keychain 的 API 还进行了 Decrypt 和 Encrypt 的动作。

![Keychain services API](https://i.imgur.com/tvA4lV3.png)


Apple 提供的 Keychain API 大部分都是 C 语言写成，使用起来相对不便，因此基本上我们都会使用二次加工过的库，比如知乎用的就是 SMKeychain。

Keychain 中的数据完全交由系统保管并加密过( AES 128 in GCM (Galois/Counter Mode))的，因此能够保证安全性。

如果对加密这一块感兴趣，可以看下[苹果的白皮书](https://www.apple.com/business/site/docs/iOS_Security_Guide.pdf)中 Keychain data protection 这一节。

另外，Keychain 的数据并不存放在 App 的 Sanbox 中，即使删除了 App，资料依然保存在 keychain 中。如果重新安装了app，还可以从 keychain 获取数据。



### 同一个 App 内部共享

类似 UserDefaults ，Keychain 也支持 Extension 和 host app 之间的共享，需要在每个 Target 的 Capability 下开启 Keychain Sharing 功能，并且设置为同一个 Group。


### 不同 App 之间共享

和 UserDefaults 不同的是，Keychain 的数据是可以跨 App 获取的，但是限于一个开发者的 App，也就是需要确保这些 App 所属的 Team ID 是相同的。

这个也是App 进行 SSO 登录的基础，比如知乎日报使用知乎主 App 登录也是基于此原理。

![shared items](https://i.imgur.com/0L2MA23.png)

在需要进行 Keychain 共享的 App 内开启 Keychain Sharing 的能力，所属同一个 Team ID 下的 App 本身都可以读取该 Keychain 的内容，类似于 AppGroup，这里也会产生 Keychain Group。

> Allows this application to share passwords from its keychain with other applications made by your team.

![Keychain Sharing](https://i.imgur.com/DJsInJb.png)


## 参考文档

1. https://developer.apple.com/documentation/foundation/userdefaults
2. https://www.reddit.com/r/jailbreak/comments/2qpqi9/ios_812_has_protection_against_plist_file_editing/
3. http://iphonedevwiki.net/index.php/PreferenceBundles
4. https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/ExtensionScenarios.html
5. https://developer.apple.com/documentation/security/keychain_services
6. https://github.com/soffes/SAMKeychain
7. https://developer.apple.com/documentation/security/keychain_services/keychain_items/sharing_access_to_keychain_items_among_a_collection_of_apps