---
title: 'UserDefaults and Keychain'
slug: 'userdefaults-and-keychain'
date: 2018-12-21T14:30:50+00:00
draft: false
categories: ['ios', 'productivity']
tags: ['2do', 'bookmark', 'category', 'document', 'iap', 'ios', 'keychain', 'notification', 'omnifocus', 'push', 'receipt', 'safari', 'swift', 'things', 'uigesturerecognizer', 'uiresponder', 'userdefaults']
---

Apple offers several persistence options, and UserDefaults and Keychain are the two you reach for most often in day-to-day app development. From past conversations with colleagues I've noticed that some of the details around these two are still a bit fuzzy for people, so this post is a closer look at both.

## UserDefaults

After reading through Apple's documentation on UserDefaults, two things stood out as worth focusing on:

1.  What UserDefaults is actually made of
2.  What UserDefaults is for

### What UserDefaults is made of

Let's look at where UserDefaults actually stores things. In the screenshot below, we're writing some demo data into the app:

![Write Key-Value to UserDefaults](https://i.imgur.com/wq9onOa.png)

Then we print the Library path and open it in Finder:

![Library](https://i.imgur.com/65ybYX6.png)

Inside the Preferences directory you'll see a file — for this app, the Library directory contains `app.chen.ios.PersistenceDemo.plist`:

![Cache](https://i.imgur.com/ChqnDJa.png)

![Preferences](https://i.imgur.com/cPvlFdR.png)

The contents of that plist are exactly the key-value pairs we wrote from the app:

![plist](https://i.imgur.com/shdXoZN.png)

So reading from and writing to UserDefaults is, in essence, reading from and writing to a plist file.

iOS handles the reading and caching of that plist file for you. Depending on the situation it syncs your in-memory changes back to the file (UserDefaults-to-memory is synchronous; memory-to-database is asynchronous — starting with iOS 8, there's a long-running process called `cfprefsd` that's responsible for that sync).

This is also why you sometimes see iOS interview questions like: "What is UserDefaults really, and how does it differ from reading and writing a plist file directly?" (Way too obscure for an interview, in my opinion.)

> UserDefaults caches the information to avoid having to open the user's defaults database each time you need a default value. When you set a default value, it's changed synchronously within your process, and asynchronously to persistent storage and other processes.

So in theory you could operate directly on the plist file that UserDefaults ultimately produces. But that's risky, and there are no guarantees it'll keep working. Apple explicitly warns developers against it:

> Don't try to access the preferences subsystem directly. Modifying preference property list files may result in loss of changes, delay of reflecting changes, and app crashes. To configure preferences, use the defaults command-line utility in macOS instead.

Since UserDefaults is backed by a plist file, the values you store are limited to types that plists support — `String`, `Number`, `Array`, `Data`, `Date`, and so on. If you want to store a custom type, it needs to conform to `Codable` (which still archives down to `Data` underneath).

![plist](https://i.imgur.com/cxWHfvS.png)

### What UserDefaults is for

> The defaults system allows an app to customize its behavior to match a user's preferences. For example, you can allow users to specify their preferred units of measurement or media playback speed. Apps store these preferences by assigning values to a set of parameters in a user's defaults database.

What we typically store in `UserDefaults` are user-facing settings — preferences that shouldn't get lost if something goes wrong mid-session. Whether dark mode is enabled, whether high-resolution image mode is on, that kind of thing. Or any data that isn't sensitive from a security standpoint.

Don't put large blobs into `UserDefaults` — don't store a whole image in there, for example. For larger files, write the file to disk and store only the path in `UserDefaults`.

After the app launches, UserDefaults does some I/O to read the local plist file, so keeping the file small probably also reduces how much time the UserDefaults APIs spend hitting the plist after launch. That's a guess on my part — I haven't actually measured it.

### UserDefaults in Extensions

On iOS, data sharing between an Extension and its host app also goes through UserDefaults. Once you've turned on App Groups, both the host app and the extension can read and write the same configuration. The host-app/extension relationship is worth reading up on in Apple's docs; at a high level it looks like this:

![app\_extensions\_container\_restrictions](https://i.imgur.com/cZFlz6o.png)

The extension and the host app share data through a Shared Container. That shared container is private — it doesn't live inside any single app's sandbox. The system carves out a dedicated area for the shared data.

> After you enable app groups, an app extension and its containing app can both use the NSUserDefaults API to share access to user preferences. To enable this sharing, use the initWithSuiteName: method to instantiate a new NSUserDefaults object, passing in the identifier of the shared group.

Because UserDefaults ultimately lives in a file that's accessible locally, don't store anything security-sensitive in it. For sensitive data, you want the other persistence option — Keychain.

## Keychain

Keychain is Apple's mechanism for storing security-sensitive data: login passwords, user tokens, encrypted data, and so on. The official diagram is below — note that the Keychain API also handles the encrypt/decrypt step for you.

![Keychain services API](https://i.imgur.com/tvA4lV3.png)

Most of Apple's Keychain APIs are written in C and aren't pleasant to use directly, so in practice we almost always reach for a wrapper library — at Zhihu we use SAMKeychain.

Keychain data is fully managed and encrypted by the system (AES 128 in GCM — Galois/Counter Mode), so security is taken care of.

If you're interested in the encryption side, the "Keychain data protection" section of [Apple's white paper](https://www.apple.com/business/site/docs/iOS_Security_Guide.pdf) is a good read.

One other thing: Keychain data does not live inside the app's sandbox. Even after the user deletes the app, the data stays in the keychain. If they reinstall the app, it can read those values back.

### Sharing within a single app

Like UserDefaults, Keychain supports sharing between an Extension and its host app. You need to enable Keychain Sharing in each target's Capabilities and put them in the same group.

### Sharing across different apps

Unlike UserDefaults, Keychain data can be shared *across* apps — but only across apps from the same developer, i.e. apps that share a Team ID.

This is the basis for SSO between apps. For example, Zhihu Daily logging in via the main Zhihu app uses exactly this.

![shared items](https://i.imgur.com/0L2MA23.png)

Once you enable Keychain Sharing on the apps that need it, any app under the same Team ID can read those Keychain entries. Similar to App Groups, there's a Keychain Group concept here.

> Allows this application to share passwords from its keychain with other applications made by your team.

![Keychain Sharing](https://i.imgur.com/DJsInJb.png)

## References

1.  [https://developer.apple.com/documentation/foundation/userdefaults](https://developer.apple.com/documentation/foundation/userdefaults)
2.  [https://www.reddit.com/r/jailbreak/comments/2qpqi9/ios\_812\_has\_protection\_against\_plist\_file\_editing/](https://www.reddit.com/r/jailbreak/comments/2qpqi9/ios_812_has_protection_against_plist_file_editing/)
3.  [http://iphonedevwiki.net/index.php/PreferenceBundles](http://iphonedevwiki.net/index.php/PreferenceBundles)
4.  [https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/ExtensionScenarios.html](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/ExtensionScenarios.html)
5.  [https://developer.apple.com/documentation/security/keychain\_services](https://developer.apple.com/documentation/security/keychain_services)
6.  [https://github.com/soffes/SAMKeychain](https://github.com/soffes/SAMKeychain)
7.  [https://developer.apple.com/documentation/security/keychain\_services/keychain\_items/sharing\_access\_to\_keychain\_items\_among\_a\_collection\_of\_apps](https://developer.apple.com/documentation/security/keychain_services/keychain_items/sharing_access_to_keychain_items_among_a_collection_of_apps)
