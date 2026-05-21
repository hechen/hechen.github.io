---
title: 'How to find a Mac app''s BundleID'
slug: 'reveal-bundleid-application'
date: 2020-08-10T12:05:54+08:00
draft: false
categories: ['macos']
tags: ['applescript', 'build', 'bundleid', 'compile', 'framework', 'launchddaemon', 'letsmove', 'library', 'mach-o', 'menu', 'nstask', 'nsviewcontroller', 'plist', 'preprocess', 'process', 'shell', 'sourcecode', 'uiviewcontroller', 'xcode', 'xpc']
---

Every iOS and macOS app stores its configuration in a plist file, and the app's BundleID lives in there alongside the version number. Read the plist and you've got both. Taking [Store.app](http://store.app) as an example, its plist sits at the path shown below — every other app follows the same pattern.

![App Store in Alfred](https://tva1.sinaimg.cn/large/007S8ZIlly1ghll6b7ut0j30x50srte2.jpg)

Open the plist and you'll see the app's configuration inside, like this:

![plist text](https://tva1.sinaimg.cn/large/007S8ZIlly1ghll68zwtzj30u50u0ndg.jpg)

A plist is essentially XML, so we want the value paired with the key `CFBundleIdentifier`. In the screenshot above that's line 51, with line 52 holding the value — `com.apple.AppStore`.

Now that we know the principle, the tooling is easy. macOS ships with `PlistBuddy`: feed it the path to a plist and ask it for a key's value.

![PlistBuddy](https://tva1.sinaimg.cn/large/007S8ZIlly1ghll60762tj31l202m0sr.jpg)

For more on PlistBuddy, see [What is PlistBuddy?](https://medium.com/@marksiu/what-is-plistbuddy-76cb4f0c262d)
