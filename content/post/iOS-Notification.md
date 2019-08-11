---
title: "关于 iOS10 Notification 的那些事儿"
date: 2017-05-20 10:10:54
categories: ["iOS"]
tags: ["iOS","Swift","Notification"]
---

## 概览

推送通知我们大家都不陌生，可以说几乎每个使用智能手机的人每天都会被不同的通知 *打扰* 到，正式因为合适的推送是吸引用户注意力的利器，其成为了各 App 吸引用户，将用户带回到 App 本身，提升用户的活跃度的一种必要的方式。

<!-- more -->

当然，过度的推送本身则是一件对用户影响特别大的事情，毕竟注意力被打断，因此合适的推送时机也是各个 App 开发者所要注意的，否则他的 App 就会成为用户勿扰名单里的一员了。

之前刚开始学习 iOS 开发的时候还整理了下当时部署 iOS 远程推送的流程，详见：[iOS 远端推送部署详解](http://hechen.info/2015/07/30/iOS-Push-Notification/)

接下来，我们大致回顾一下 iOS 平台关于推送都有哪些历程？

## 历史

- <= iOS 6 
	- 远程推送通知 （iOS 3）
	- 本地通知 （iOS 4）

- iOS 7  参考 
	- 引入 Silent Remote Notifications

- iOS 8  参考 [WWDC 2014 Session 713](https://developer.apple.com/videos/play/wwdc2014/713/)
	- 引入 Actionable Notifications
	- 修改 Notification 的权限请求

- iOS 9  参考 [WWDC 2015 Session 720](https://developer.apple.com/videos/play/wwdc2015/720/)
	- 引入 Text Input Action
	- UIUserNotificationActionBehavior

- iOS 10 参考 [WWDC 707 Introduction to Notifications](https://developer.apple.com/videos/play/wwdc2016/707) && [WWDC 708 Advanced Notifications](https://developer.apple.com/videos/play/wwdc2016/708)
   - UserNotification Framework
   - Extensions

WWDC 2016 大会上，Apple 在 iOS 10 上引入了 **UserNotification** 框架，可以说是对之前的各种代码做了一次重构。该框架统一了通知的行为，尤其是针对远程推送和本地推送不再有两套完全不同的使用方式了。

## 变化

关于 iOS 10 上 UserNotification 框架的变化，主要从几个方面来讲述：

1. 权限申请
2. 推送内容变更
3. 推送管理
4. Extensions


### 权限申请

``` Swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) {
    granted, error in
    if granted {
        // 用户允许进行通知
    }
}
```

### 远程推送

``` Swift
// 向 APNs 请求 token：

// iOS 10 support
if #available(iOS 10, *) {  
    UNUserNotificationCenter.current().requestAuthorization(options:[.badge, .alert, .sound]){ (granted, error) in }
    application.registerForRemoteNotifications()
}
// iOS 9 support
else if #available(iOS 9, *) {  

UIApplication.shared.registerUserNotificationSettings(UIUserNotificationSettings(types: [.badge, .sound, .alert], categories: nil))
    UIApplication.shared.registerForRemoteNotifications()
}
```

关于注册远程通知的回调方法一致，

``` Swift
// AppDelegate.swift
 func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let tokenString = deviceToken.hexString
    print("Get Push token: \(tokenString)")
}
```

### Payloads 

<  iOS 10

``` JSON
 {
   "aps":{
     "alert":"Test",
     "sound":"default",
     "badge":1
   }
 }
```

iOS 10 系统提供了更为丰富的结构，比如可以指定 Title，Subtitle 等

``` JSON
{
   "aps":{
     "alert":{
       "title":"This is a title",
       "subtitle":"This is a subtitle",
       "body":"This is body"
     },
     "sound":"default",
     "badge":1
   }
 }
```

甚至，现在可以支持多媒体的展示了，在 payload 上也有相应的体现，例如下面几例：

1. 支持图片

    ``` JSON
    {
        "aps":{
            "alert": {
                "title": "Title: Notification Demo", 
                "subtitle": "Subtitle: show iOS 10 support!",
                "body": "The Main Body For Notification!"
                },
                "mutable-content": 1
            },
        "image" : "https://pic1.zhimg.com/v2-0314056e4f13141b6ca2277078ec067c.jpg",
    }
    ```

2. 支持音频

    ``` JSON
    
    {
        "aps":{
            "alert": {
            "title": "Title: Notification Demo", 
            "subtitle": "Subtitle: show iOS 10 support!", 
            "body": "The Main Body For Notification!"
            },
            "mutable-content": 1,
        },
        "audio" : "http://hao.1015600.com/upload/ring/000/982/d9924a7f4e4ab06e52a11dfdd32ffae1.mp3",
    }
    
    ```

具体所有的 Key 可以参考官方文档 [Payload Key Reference](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html)

> 注意到有个 key:  launch-image ，可以指定用户点击通知启动 App 的时候的 Launch Image

### 可以撤销和更新通知了！

UserNotification 框架 API 提供了通知的更新和撤销的接口。具体功能主要包含几个部分：

1. 删除未展示的通知
    
    ``` Swift
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3, repeats: false)
            let identifier = Constants.pendingRemoveNotificationIdentifier
            let request = UNNotificationRequest(identifier: identifier, content: title1Content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("remove pending notification error: \(error)")
                } else {
                    print("Notification request added: \(identifier)")
                }
            }
            
            delay(2) {
                print("Notification request removed: \(identifier)")
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
            }
    ```


2. 更新未展示的通知

    ``` Swift
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3, repeats: false)
            let identifier = Constants.pendingUpdateNotificationIdentifier
            let request = UNNotificationRequest(identifier: identifier, content: title1Content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("update pending notification error: \(error)")
                } else {
                    print("Notification request added: \(identifier) with title1")
                }
            }
            
            delay(2) {
                let newTrigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                
                // Add new request with the same identifier to update a notification.
                let newRequest = UNNotificationRequest(identifier: identifier, content: self.title2Content, trigger: newTrigger)
                UNUserNotificationCenter.current().add(newRequest) { error in
                    if let error = error {
                        print("update delivered notification error: \(error)")
                    } else {
                        print("Notification request updated: \(identifier) with title2")
                    }
                }
            }
    ```

3. 删除已经展示的通知

    ``` Swift
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3, repeats: false)
            let identifier = Constants.pendingUpdateNotificationIdentifier
            let request = UNNotificationRequest(identifier: identifier, content: title1Content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("update pending notification error: \(error)")
                } else {
                    print("Notification request added: \(identifier) with title1")
                }
            }
            
            delay(2) {
                let newTrigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                
                // Add new request with the same identifier to update a notification.
                let newRequest = UNNotificationRequest(identifier: identifier, content: self.title2Content, trigger: newTrigger)
                UNUserNotificationCenter.current().add(newRequest) { error in
                    if let error = error {
                        print("update delivered notification error: \(error)")
                    } else {
                        print("Notification request updated: \(identifier) with title2")
                    }
                }
            }
    ```


4. 更新已经展示的通知

    ``` Swift
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3, repeats: false)
            let identifier = Constants.deliveredUpdateNotificationIdentifier
            let request = UNNotificationRequest(identifier: identifier, content: title1Content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    
                } else {
                    print("Notification request added: \(identifier) with title1")
                }
            }
            
            delay(4) {
                let newTrigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                
                // Add new request with the same identifier to update a notification.
                let newRequest = UNNotificationRequest(identifier: identifier, content: self.title2Content, trigger: newTrigger)
                UNUserNotificationCenter.current().add(newRequest) { error in
                    if let error = error {
                        
                    } else {
                        print("Notification request updated: \(identifier) with title2")
                    }
                }
            }
    ```

当然，上述均是针对本地通知的操作，关于远程推送通知，目前只支持更新通知，远程推送可以进行通知的更新，在使用 Provider API 向 APNs 提交请求时，在 HTTP/2 的 header 中 apns-collapse-id key 的内容将被作为该推送的标识符进行使用。多次推送同一标识符的通知即可进行更新。


### Notification Extension

iOS 10 中最重要的一个变化就是 Extension，从 iMessage Extension 到 SiriKit 中提供的  Intent Extension 等，那对于 UserNotification 来讲就是下面这两种 Extension：

![18D62919-DA73-4D3D-9B05-6071E6945764](http://7xilk1.com1.z0.glb.clouddn.com/18D62919-DA73-4D3D-9B05-6071E6945764-1.png)


1. Service Extension 

具体而言，就是我们可以在收到通知之后，在展示给用户之前 ，也就是以Banner 或者 Alert 的形式 或者 进入通知中心之前，给我们一次截取并处理的机会，这样就给开发者提供了针对推送通知再加工的手段，并且远程推送多媒体也是通过 Service Extension 来实现的。

> 使用在本机截取推送并替换内容的方式，可以完成端到端 (end-to-end) 的推送加密。你在服务器推送 payload 中加入加密过的文本，在客户端接到通知后使用预先定义或者获取过的密钥进行解密之后再显示。这样一来，即使推送信道被第三方截取，其中所传递的内容也还是安全的。使用这种方式来发送密码或者敏感信息，对于一些金融业务应用和聊天应用来说，应该是必备的特性。

生成 Extension 之后，系统已经为我们提供了模板，代码如下：

``` Swift
class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    // 1
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
    
    // 2
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
```


2. Content Extension
iOS 10 SDK 新加的另一个 Content Extension 可以用来自定义通知的详细页面的视图。 下图中就是几款市面上目前已经实现过自定义 Content Extension 的 App 截图。需要注意的是：

第一个 PriceTag App 的通知样式，实际上是默认的系统显示行为。


![IMG_AD4882D0ECDE-1](http://7xilk1.com1.z0.glb.clouddn.com/IMG_AD4882D0ECDE-1.jpeg)


其中需要注意的一点是。如果不想默认显示通知内容，需要在 Content Extension 的 info.plist 文件中添加 UNNotificationExtensionDefaultContentHidden  并设置为 YES


#### 支持多媒体资源在通知中心的展示

iOS 10 中另一个比较显著的特点就是支持了多媒体的推送和展示。开发者现在可以在通知中嵌入图片、音频甚至视频，这极大丰富了推送内容的可读性和趣味性。


1. 本地推送支持
本地通知添加多媒体比较简单一些，只需要通过本地磁盘上的文件 URL 创建一个 UNNotificationAttachment 对象，然后将这个对象放到数组中赋值给 content 的 attachments 属性就行了：

``` Swift
let content = UNMutableNotificationContent()
content.title = "Image Notification"
content.body = "Show me an image!"

if let imageURL = Bundle.main.url(forResource: "image", withExtension: "jpg"),
   let attachment = try? UNNotificationAttachment(identifier: "imageAttachment", url: imageURL, options: nil) {
    content.attachments = [attachment]
}
```


2. 远程推送支持

首先需要在 payloads 结构中添加对富媒体的支持，aps 字典中添加字段`mutable-content`并置为 1 来标识该远程通知是需要支持。 然后可以在 payloads 中添加资源地址，可以是本地的资源，也可以是需要 App 下载的。

``` JSON
{
  "aps":{
    "alert":{
      "title":"Image Notification",
      "body":"Show me an image from web!"
    },
    "mutable-content":1
  },
  "zh_image": "https://pic1.zhimg.com/v2-0314056e4f13141b6ca2277078ec067c.jpg"
}
```

具体支持多媒体文件的富媒体类型以及每一种类型所支持的大小详官方文档  [UNNotificationAttachment](https://developer.apple.com/reference/usernotifications/unnotificationattachment)

一旦远程推送在 aps 中添加 mutable-content 的key 并设置为 1 之后，iOS 系统接收到该推送之后就会唤起我们配套的 Service Extension 来做进一步处理，我们可以在其中下载对应 zh_image 链接的图片，然后生成 Attachment 再丢给系统处理即可。 详细做法就是在上一节讲 Service Extension 中的 `didReceive` 中写相应逻辑即可，具体代码如下所示：

当然，这里的处理时间是存在时间限制的，如果处理超时系统就会回收该 Extension，并且调用 `serviceExtensionTimeWillExpire` 方法，因此每个人收到带有附件的推送之后不一定展示相同，例如下图所示的情况，第一张和第二张就属于正常设置了附件的情况，而第三张就是没有在有限时间内正确设置附件的情况。

![未成功设置附件的情况](http://7xilk1.com1.z0.glb.clouddn.com/14953507334611.png)




### 推送证书的配置

下图是获取推送通知证书并将其注册到 Leancloud 的流程，最关键的地方其实就是需要在本机生成 CSR 文件提交到 Apple Developer Website 生成 Push Certification 文件。

主要有几个步骤：

1. AppID 关于 Remote Push 的 注册
2. 生成推送证书
3. 转换证书为 P12 文件，并提供给 Leancloud

![02](http://7xilk1.com1.z0.glb.clouddn.com/02.png)

XCode 8 的 Auto Signing 已经省去了难以名状的复杂，但是还是有一点小事情我们需要做。

![iOS App IDs - Apple Developer Google Chrome, 今天 at 下午5.01.22](http://7xilk1.com1.z0.glb.clouddn.com/iOS App IDs - Apple Developer Google Chrome, 今天 at 下午5.01.22.png)

![0CB09A98-0D9B-4E76-BA7C-9A1766CFE](http://7xilk1.com1.z0.glb.clouddn.com/0CB09A98-0D9B-4E76-BA7C-9A1766CFEC42.png)

![Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.07.47](http://7xilk1.com1.z0.glb.clouddn.com/Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.07.47.png)


我们需要生成 CSR 文件 ，按照指定步骤按部就班来就行，最后会生成 默认文件 *CertificateSigningRequest.certSigningRequest*


![Finder Finder, 今天 at 下午4.59.55](http://7xilk1.com1.z0.glb.clouddn.com/Finder Finder, 今天 at 下午4.59.55.png)
![证书助理 证书助理, 今天 at 下午5.05.42](http://7xilk1.com1.z0.glb.clouddn.com/证书助理 证书助理, 今天 at 下午5.05.42.png)


接着之前的步骤，选择 CSR 文件上传。

![Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.07](http://7xilk1.com1.z0.glb.clouddn.com/Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.07.png)


上传成功之后就会生成 Push 证书，下载到本机安装上。

![Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.58](http://7xilk1.com1.z0.glb.clouddn.com/Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.58.png)


### Demo 演示 

可以使用 [Knuff](https://github.com/KnuffApp/Knuff) 进行通知推送测试。


参考资料

1. [Local and Remote Notification Programming Guide](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/index.html#//apple_ref/doc/uid/TP40008194-CH3-SW1)
2. [UserNotifications 官方文档](https://developer.apple.com/reference/usernotifications)
3. [iOS App 签名的原理](http://wereadteam.github.io/2017/03/13/Signature/)
4. [iPhone 的后台刷新](https://medium.com/@scomper/探究-iphone-的后台刷新-a7a96cb426d4)







