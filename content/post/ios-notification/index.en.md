---
title: 'Everything you need to know about iOS 10 notifications'
slug: 'ios-notification'
date: 2017-05-20T10:10:54+00:00
draft: false
categories: ['book', 'ios', 'translation']
tags: ['animation', 'category', 'garbage-collection', 'ios', 'notification', 'objective-c', 'push', 'python', 'runtime', 'swift']
---

## Overview

Push notifications are something we're all familiar with — pretty much anyone with a smartphone gets *interrupted* by them every day. The right notification is a powerful tool for grabbing a user's attention, which is why notifications have become a staple way for apps to pull users back in and keep engagement up.

Of course, too many notifications cuts the other way and ends up being deeply annoying — once you break someone's concentration, getting it back is hard. So picking the right moment to send a push matters. Otherwise, your app ends up in the Do Not Disturb list.

When I first started learning iOS development, I put together a guide on setting up remote push notifications: [iOS remote push deployment, explained](http://hechen.info/2015/07/30/iOS-Push-Notification/).

Let's quickly review how iOS notifications have evolved.

## History

- &lt;= iOS 6

  - Remote push notifications (iOS 3)
  - Local notifications (iOS 4)

- iOS 7

  - Introduced silent remote notifications

- iOS 8 — see [WWDC 2014 Session 713](https://developer.apple.com/videos/play/wwdc2014/713/)

  - Introduced actionable notifications
  - Changed the way notification permissions are requested

- iOS 9 — see [WWDC 2015 Session 720](https://developer.apple.com/videos/play/wwdc2015/720/)

  - Introduced text-input actions
  - UIUserNotificationActionBehavior

- iOS 10 — see [WWDC 707 Introduction to Notifications](https://developer.apple.com/videos/play/wwdc2016/707) && [WWDC 708 Advanced Notifications](https://developer.apple.com/videos/play/wwdc2016/708)

  - UserNotification framework
  - Extensions

At WWDC 2016, Apple introduced the **UserNotification** framework in iOS 10 — essentially a refactor of all the older notification code. It unifies the behaviour of notifications: in particular, remote and local pushes are no longer two completely separate APIs.

## Changes

The main areas where iOS 10's UserNotification framework changed things:

1.  Requesting permission
2.  Changes to the push payload
3.  Managing notifications
4.  Extensions

### Requesting permission

``` swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) {
    granted, error in
    if granted {
        // user granted permission for notifications
    }
}
```

### Remote pushes

``` swift
// Request a token from APNs:

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

The callback for remote registration is unchanged:

``` swift
// AppDelegate.swift
 func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let tokenString = deviceToken.hexString
    print("Get Push token: \(tokenString)")
}
```

### Payloads

&lt; iOS 10

``` json
 {
   "aps":{
     "alert":"Test",
     "sound":"default",
     "badge":1
   }
 }
```

iOS 10 introduced a richer structure — you can specify a Title, Subtitle, and more:

``` json
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

And now you can attach media too. Here are a couple of examples:

1.  Image

    ``` json
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

2.  Audio

    ``` json
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

The full list of supported keys lives in Apple's [Payload Key Reference](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/PayloadKeyReference.html).

> Note that there's a `launch-image` key you can use to specify the launch image shown when the user taps the notification to open the app.

### You can now update and cancel notifications!

The UserNotification framework's API exposes update and cancel operations. The main pieces:

1.  Remove a pending (undelivered) notification

    ``` swift
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

2.  Update a pending notification

    ``` swift
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

3.  Remove a delivered notification

    ``` swift
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

4.  Update a delivered notification

    ``` swift
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

The examples above are all for local notifications. For remote pushes, only updates are supported. When you submit a request to APNs via the Provider API, the `apns-collapse-id` key in the HTTP/2 headers acts as the identifier for that push. Sending another push with the same identifier updates the original.

### Notification Extensions

The biggest change in iOS 10 across the board is Extensions — iMessage Extensions, SiriKit's Intent Extensions, you name it. For UserNotification, there are two:

![18D62919-DA73-4D3D-9B05-6071E6945764](http://7xilk1.com1.z0.glb.clouddn.com/18D62919-DA73-4D3D-9B05-6071E6945764-1.png)

1.  Service Extension

A Service Extension gives us a chance to intercept and modify a notification *after* it arrives and *before* it's shown to the user — as a banner, an alert, or in Notification Center. That gives developers a hook for post-processing pushes, and it's also how media attachments on remote pushes are delivered.

> Intercepting and rewriting the push payload locally lets you do end-to-end push encryption. You ship an encrypted body in the server-side payload and decrypt it on-device with a pre-shared or pre-fetched key before display. Even if the push channel is intercepted by a third party, the content is still safe. For passing passwords or sensitive info, this should be table stakes for finance and chat apps.

When you create the extension, Xcode gives you a starter template:

``` swift
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

1.  Content Extension
    The other new extension in iOS 10, Content Extension, lets you build a custom view for the detail view of a notification. Below are screenshots from a few apps that have shipped custom Content Extensions. One thing to call out:

The first one (PriceTag) actually uses the default system layout — that's not a custom Content Extension.

![IMG\_AD4882D0ECDE-1](http://7xilk1.com1.z0.glb.clouddn.com/IMG_AD4882D0ECDE-1.jpeg)

One more thing to know: if you don't want the default notification body to be shown, add `UNNotificationExtensionDefaultContentHidden` and set it to YES in the Content Extension's Info.plist.

#### Media attachments in Notification Center

Another big iOS 10 feature is media-rich notifications. Developers can now embed images, audio, and even video — much richer and more engaging than plain text.

1.  Local notifications
    Adding media to a local notification is easy: create a `UNNotificationAttachment` from a local file URL, stick it in an array, and assign it to the content's `attachments`:

``` swift
let content = UNMutableNotificationContent()
content.title = "Image Notification"
content.body = "Show me an image!"

if let imageURL = Bundle.main.url(forResource: "image", withExtension: "jpg"),
   let attachment = try? UNNotificationAttachment(identifier: "imageAttachment", url: imageURL, options: nil) {
    content.attachments = [attachment]
}
```

1.  Remote notifications

First, the payload needs to declare media support: add `mutable-content` to the `aps` dictionary and set it to 1. Then you can put a resource URL in the payload — either local or one your app needs to download.

``` json
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

For the full list of supported media types and size limits, see [UNNotificationAttachment](https://developer.apple.com/reference/usernotifications/unnotificationattachment).

Once the push has `mutable-content` set to 1 in `aps`, iOS wakes up your Service Extension when it receives the push so it can do further processing. In the extension, you can download the `zh_image` URL, build an Attachment from it, and hand it back to the system. The implementation lives inside the `didReceive` method we saw earlier.

There's a time limit on this work, though. If you take too long, the system reclaims the extension and calls `serviceExtensionTimeWillExpire` — which means the same push can render differently for different users. In the screenshot below, the first two notifications had the attachment set successfully; the third one didn't make it within the deadline.

![未成功设置附件的情况](http://7xilk1.com1.z0.glb.clouddn.com/14953507334611.png)

### Setting up the push certificate

Below is the flow for grabbing a push certificate and registering it with Leancloud. The crux is generating a CSR file locally and submitting it on the Apple Developer site to produce a push certificate.

The steps are:

1.  Enable Remote Push on the App ID
2.  Generate the push certificate
3.  Convert the certificate to a P12 file and hand it to Leancloud

![02](http://7xilk1.com1.z0.glb.clouddn.com/02.png)

Xcode 8's Auto Signing took most of the unspeakable pain out of this, but a few small things still need doing manually.

\![iOS App IDs - Apple Developer Google Chrome, 今天 at 下午5.01.22\]([http://7xilk1.com1.z0.glb.clouddn.com/iOS](http://7xilk1.com1.z0.glb.clouddn.com/iOS) App IDs - Apple Developer Google Chrome, 今天 at 下午5.01.22.png)

![0CB09A98-0D9B-4E76-BA7C-9A1766CFE](http://7xilk1.com1.z0.glb.clouddn.com/0CB09A98-0D9B-4E76-BA7C-9A1766CFEC42.png)

\![Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.07.47\]([http://7xilk1.com1.z0.glb.clouddn.com/Add](http://7xilk1.com1.z0.glb.clouddn.com/Add) - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.07.47.png)

You need to generate a CSR. Follow the prompts and you'll end up with the default file *CertificateSigningRequest.certSigningRequest*.

\![Finder Finder, 今天 at 下午4.59.55\]([http://7xilk1.com1.z0.glb.clouddn.com/Finder](http://7xilk1.com1.z0.glb.clouddn.com/Finder) Finder, 今天 at 下午4.59.55.png)
\![证书助理 证书助理, 今天 at 下午5.05.42\]([http://7xilk1.com1.z0.glb.clouddn.com/](http://7xilk1.com1.z0.glb.clouddn.com/)证书助理 证书助理, 今天 at 下午5.05.42.png)

Continuing on, select the CSR file and upload it.

\![Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.07\]([http://7xilk1.com1.z0.glb.clouddn.com/Add](http://7xilk1.com1.z0.glb.clouddn.com/Add) - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.07.png)

Once that succeeds, you'll get a push certificate. Download it and install it locally.

\![Add - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.58\]([http://7xilk1.com1.z0.glb.clouddn.com/Add](http://7xilk1.com1.z0.glb.clouddn.com/Add) - iOS Certificates - Apple Developer Google Chrome, 今天 at 下午5.09.58.png)

### Demo

For sending test pushes, [Knuff](https://github.com/KnuffApp/Knuff) does the job.

References

1.  [Local and Remote Notification Programming Guide](https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/index.html#//apple_ref/doc/uid/TP40008194-CH3-SW1)
2.  [UserNotifications official docs](https://developer.apple.com/reference/usernotifications)
3.  [How iOS app signing works](http://wereadteam.github.io/2017/03/13/Signature/)
4.  [iPhone background refresh](https://medium.com/@scomper/%E6%8E%A2%E7%A9%B6-iphone-%E7%9A%84%E5%90%8E%E5%8F%B0%E5%88%B7%E6%96%B0-a7a96cb426d4)
