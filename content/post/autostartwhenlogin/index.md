---
title: '关于 Mac 应用的自启动是如何做到的'
date: 2019-03-18T17:29:54+08:00
draft: false
categories: ['macos', 'productivity', 'rxswift']
tags: ['agent', 'backgroundcolor', 'cocoa', 'dock', 'dockless', 'evernote', 'login', 'macos', 'menu', 'nsview', 'safari', 'sandbox', 'shadowsocks', 'subject', 'traffic', 'variable', '印象笔记']
---

开机自启动是 Cocoa 应用最常见的一种功能，尤其是针对需要常驻 Menu 的服务来说更是如此，今天我们对开机启动项的功能加入做个梳理。

在 [Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLoginItems.html#//apple_ref/doc/uid/10000172i-SW5-SW1) 中我们能找到关于自启动项的开发说明：

> Applications can contain a helper application as a full application bundle, stored inside the main application bundle in the Contents/Library/LoginItems directory. Set either the LSUIElement or LSBackgroundOnly key in the Info.plist file of the helper application’s bundle.

> Use the SMLoginItemSetEnabled function (available in OS X v10.6.6 and later) to enable a helper application. It takes two arguments, a CFStringRef containing the bundle identifier of the helper application, and a Boolean specifying the desired state. Pass true to start the helper application immediately and indicate that it should be started every time the user logs in. Pass false to terminate the helper application and indicate that it should no longer be launched when the user logs in. This function returns true if the requested change has taken effect; otherwise, it returns false. This function can be used to manage any number of helper applications.

> If multiple applications (for example, several applications from the same company) contain a helper application with the same bundle identifier, only the one with the greatest bundle version number is launched. Any of the applications that contain a copy of the helper application can enable and disable it.

如文档中描述的那样，你可以在主应用中包含一个辅助应用，并且路径固定为 `Contents/Library/LoginItems`，

另外一种方式就是使用 `Shared File List`，其相关 API 在 [Launch Services Reference](https://developer.apple.com/documentation/coreservices/launch_services) 能找到，其实具体的 API 就在 `LSSharedFileList.h` 中。

## 沙盒应用

在官方文档 [App Sandbox Design Guide](http://developer.apple.com/library/mac/documentation/Security/Conceptual/AppSandboxDesignGuide/DesigningYourSandbox/DesigningYourSandbox.html#//apple_ref/doc/uid/TP40011183-CH4-SW3) 中有如下针对开机自启动的描述：

> To create a login item for your sandboxed app, use the SMLoginItemSetEnabled function (declared in ServiceManagement/SMLoginItem.h) as described in Adding Login Items Using the Service Management Framework.
>
> (With App Sandbox, you cannot create a login item using functions in the LSSharedFileList.h header file. For example, you cannot use the function LSSharedFileListInsertItemURL. Nor can you manipulate the state of Launch Services, such as by using the function LSRegisterURL.)

其实上面提及的方式也就是在第一小节中提到的两种方式中的第一种，而且第二种共享文件列表的 API 是无法针对沙盒应用使用的，而且 `LSSharedFileList.h` 已经在 10.10 系统版本之后标记为废弃了。

综合上面的说明，目前在 macOS 上加入自启动项的方式也有且仅有一种方式，也就是加入辅助应用来引导主应用启动。整个思路应该是如下：

1.  将辅助应用加入系统启动项中；
2.  系统启动，进而自启动辅助应用；
3.  辅助应用引导主应用启动；
4.  主应用启动完成，干掉辅助应用

是的，就是这么绕，具体要怎么做呢？ 主要分为如下几个步骤：

1.  创建辅助应用，其作为主应用的 Target 新建出来
2.  将辅助应用的 Info.plist 文件中指定属性 `LSBackgroundOnly` 为 `YES`；
3.  在辅助应用 Target 的 build setting 中设置 `Skip Install` 为 `YES`（关于其作用主要是不需要 Xcode archive 执行将 Product 拷贝到最终的包里，因为我们执行加入了步骤 4）;
4.  在主应用的 build phase 中加入 `Copy Files` 阶段，
    - 指定 destination 为 Wrapper
    - 指定 subpath 为 `Contents/Library/LoginItems`
    - 加入辅助应用的 Product

大家第一眼看到这些步骤的时候是不是头都大了，没错，这仅仅是写代码之前的参数配置工作。

## 启动项支持

![Add New Target](https://i.imgur.com/fJUpG26.png)

指定 CocoaApp

![Specify Cocoa App](https://i.imgur.com/tXJDr1Y.png)

指定 Product ID 为 `StartAtLoginLauncher`,该 Target 的 BundleID 为 `app.chen.osx.demo.StartAtLoginLauncher`。

![Modify BundleID](https://i.imgur.com/uj2yhht.png)

然后，修改 StartAtLoginLauncher 的 Info.plist 文件，指定 `LSBackgroundOnly` 为 YES

![BackgroundOnly](https://i.imgur.com/BqNsFm7.png)

修改 StartAtLoginLauncher Target 的 Build Setting 中 `Skip Install` 为 `YES`

![Skill Install](https://i.imgur.com/qKZzECK.png)

紧接着是设置主应用 StartAtLogin Target，为其加入 Copy Files Build Phase，如下设置，路径是固定的 `Contents/Library/LoginItems`，Copy 对象为 `StartAtLoginLauncher`

![Copy files Build Phase](https://i.imgur.com/wfaxgmZ.png)

至此，所有设置均已完成，你可以 Command+B 产出一个 Product 看看，在主应用里是否已经将启动项目包含进去了。

![Build Product](https://i.imgur.com/XfyYMG1.png)

![Reveal Package Content](https://i.imgur.com/OGXYmxw.png)

还没有结束，因为 StartAtLoginLauncher 应用是指在后台运行，我们不希望辅助应用启动的时候弹出 UI，因此还需要删除相关的 UI 代码，在 Main.storyboard 中，删除 Window 以及 ViewController，只保留 Application Scene 即可

![Demo Start When Login](https://i.imgur.com/poclDG1.png)

至此，所有写代码之前的工作已经完成，我们已经为主应用生成了对应的辅助应用，帮助其启动。

### 加入启动项

代码核心逻辑包含两部分：

1.  主应用启动之后杀掉辅助应用，因为其已经完成了使命；
2.  助应用启动之后将主应用唤醒

#### 主应用

``` swift
extension Notification.Name {
    static let killLauncher = Notification.Name("killLauncher")
}

func applicationDidFinishLaunching(_ aNotification: Notification) {
    // Insert code here to initialize your application
    let launcherAppId = "app.chen.osx.demo.StartAtLoginLauncher"
    let runningApps = NSWorkspace.shared.runningApplications
    let isRunning = !runningApps.filter { $0.bundleIdentifier == launcherAppId }.isEmpty
    if isRunning {
    DistributedNotificationCenter.default().post(name: .killLauncher,
                                                         object: Bundle.main.bundleIdentifier!)
        }
    }
```

主应用在完成启动之后，检查当前正在执行的 Application 列表中是否包含了我们的辅助应用，如果包含，发送通知，让其 Terminate

#### 辅助应用

``` swift
func applicationDidFinishLaunching(_ aNotification: Notification) {
    let mainAppIdentifier = "app.chen.osx.demo.StartAtLogin"
    let runningApps = NSWorkspace.shared.runningApplications
    let isRunning = !runningApps.filter { $0.bundleIdentifier == mainAppIdentifier }.isEmpty
        
    if !isRunning {
        DistributedNotificationCenter.default().addObserver(self,
                                                                selector: #selector(self.terminate),
                                                                name: .killLauncher,
                                                                object: mainAppIdentifier)
            
        let path = Bundle.main.bundlePath as NSString
        var components = path.pathComponents
        components.removeLast()
        components.removeLast()
        components.removeLast()
        components.append("MacOS")
        components.append("StartAtLogin") //main app name
            
        let newPath = NSString.path(withComponents: components)            
            NSWorkspace.shared.launchApplication(newPath) 
        } else {
            self.terminate()
        }
    }
```

辅助应用启动之后，查询主应用是否已经运行，如果已经运行，就自觉干掉自己。如果没有运行，我们唤醒主 App，在此之前设置监听，等到主应用启动之后会发给自己通知，然后再自杀 😂

这其中我们使用了 DistributedNotificationCenter，和平时我们使用的 NotificationCenter 不同，其发出的通知是跨任务（进程间）的，也就是其他进程如果注册了同样的通知，也是能够收到监听通知的。 系统的日夜间通知就是这种类型，其会在所有 Task 之间进行广播，该通知的 NotificationName 是 `AppleInterfaceThemeChangedNotification`.

``` swift
private static let notificationName = NSNotification.Name("AppleInterfaceThemeChangedNotification")

func reigsterThemeChangedNotification() {
    DistributedNotificationCenter.default().addObserver(self, selector: #selector(selectorHandler), name: notificationName, object: nil)
}

@objc
private static func selectorHandler() {
    print("Theme Changed!")     
}
```

因此 Demo 中的通知名字只是示例，在实际开发中，尽可能的确保通知的唯一性。

#### 切换自启动状态

关于自启动状态的设置包含两个主要的 API：

1.  SMCopyAllJobDictionaries
2.  SMLoginItemSetEnabled

##### SMCopyAllJobDictionaries

获取当前我们的启动项设置情况是通过 `SMCopyAllJobDictionaries` 方法，如下定义。

``` c
/*!
 * @function SMCopyAllJobDictionaries
 * @abstract
 * Copy the job description dictionaries for all jobs in the given domain.
 *
 * @param domain
 * The job's domain (e.g. {@link kSMDomainSystemLaunchd} or
 * {@link kSMDomainUserLaunchd}).
 *
 * @result
 * A new array containing all job dictionaries, or NULL if an error occurred. 
 * Must be released by the caller.
 *
 * @discussion
 * SMCopyAllJobDictionaries returns an array of the job description dictionaries
 * for all jobs in the given domain, or NULL if an error occurred. This routine
 * is deprecated and will be removed in a future release. There will be no
 * provided replacement.
 *
 * For the specific use of testing the state of a login item that may have been
 * enabled with SMLoginItemSetEnabled() in order to show that state to the
 * user, this function remains the recommended API. A replacement API for this
 * specific use will be provided before this function is removed.
 */
__OSX_AVAILABLE_BUT_DEPRECATED(__MAC_10_6, __MAC_10_10, __IPHONE_3_0, __IPHONE_8_0)
XPC_EXPORT
CFArrayRef
SMCopyAllJobDictionaries(CFStringRef domain);
```

该方法虽然标记 10.10 系统开始废弃，但是到目前的 10.14 版本还未提供替换的 API，所以还是可以继续使用的（文档所说）。

传入的参数可以理解就是指定获取任务类型的，我们使用 kSMDomainUserLaunchd 来获取所有加入到用户启动项列表中的任务，其中每一个 Job 都是一个字典结构，内容大概类似：

![Launch Job-c500](https://i.imgur.com/KDLqn9a.png)

我们可以通过 Label 来查找我们需要的 Job，

``` swift
let launchHelperIdentifier = "app.chen.osx.demo.StartAtLoginLauncher"
let jobs = SMCopyAllJobDictionaries(kSMDomainUserLaunchd).takeRetainedValue() as? [[String: AnyObject]]
var autoLaunchRegistered = jobs?.contains(where: { $0["Label"] as! String == launchHelperIdentifier }) ?? false
```

##### SMLoginItemSetEnabled

设置启动项是通过 `SMLoginItemSetEnabled` 方法，参数为要自启动的应用的 BundleID 以及自启动状态。

要记住，这里我们进行更改的是针对 Launch Helper 的设置。

``` swift
var startAtLogin = true

// ....

let launchHelperIdentifier = "app.chen.osx.demo.StartAtLoginLauncher"
SMLoginItemSetEnabled(launchHelperIdentifier as CFString, startAtLogin)
```

### 测试

至此，关于自启动项的工作已经完成，想要测试，可以先 Archive 出一个安装包，然后将 Demo App 拖到 /Applications 目录，启动之后，设置 Start At Login 选项 checked 状态。

![StartAtLogin](https://i.imgur.com/szvqHoG.png)

如果不放心，退出登录之前，Quit 掉测试应用，并且取消 Reopen 选项。

![Not Reopen](https://i.imgur.com/5KrpAuU.png)

然后，Log Out 当前用户，之后再次登录进来，看 Demo 应用是否被启动了。在我的电脑上测试再次启动之后 Demo 应用就会被顺利启动了。

![Desktop](https://i.imgur.com/XJsUmVS.png)

其中还有一点是关于 Target 的 Sandbox 属性，作为目前唯一可行的自启动官方方案，其同时适用于沙盒应用和非沙盒应用的。

## 工具推荐

推荐下 Github 上 [sindresorhus](https://github.com/sindresorhus)
写的小工具 [LaunchAtLogin](https://github.com/sindresorhus/LaunchAtLogin)，简化了上述的步骤。

## 参考链接

1.  [App Sandbox Design Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/AppSandboxDesignGuide/AboutAppSandbox/AboutAppSandbox.html#//apple_ref/doc/uid/TP40011183-CH1-SW1)
2.  [Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/Introduction.html#//apple_ref/doc/uid/10000172i-SW1-SW1)
3.  [Launch Services Programming Guide](https://developer.apple.com/library/archive/documentation/Carbon/Conceptual/LaunchServicesConcepts/LSCIntro/LSCIntro.html#//apple_ref/doc/uid/TP30000999)
4.  [NSDistributedNotificationCenter](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Notifications/Articles/NotificationCenters.html)
5.  [What the Skip-Install mean?](https://stackoverflow.com/questions/16374851/xcode-4-target-build-setting-skip-install-what-is-it)
