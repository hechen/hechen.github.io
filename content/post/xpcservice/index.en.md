---
title: 'XPC Services'
slug: 'xpcservice'
date: 2019-07-04T01:01:10+08:00
draft: false
categories: ['macos']
tags: ['agent', 'applescript', 'build', 'cocoa', 'compile', 'dock', 'dockless', 'framework', 'library', 'login', 'mach-o', 'menu', 'nstask', 'nsviewcontroller', 'preprocess', 'process', 'uiviewcontroller', 'xcode', 'xpc']
---

## About XPC

I've been doing some work in this area lately, so here are my notes — a quick recap of what XPC is and how it works.

XPC is the umbrella term for inter-process communication on macOS. It lets you split a Mac app's functionality across multiple processes, with the IPC plumbing fully wrapped by the system — you just follow the prescribed pattern. The two biggest wins are:

1.  Better app stability.
2.  Privilege separation.

The work I'm doing right now hits both of those needs squarely. The upper-layer feature runs shell commands and reads back the output, with the execution itself handled by NSTask. The shape looks roughly like this:

![shared-42f9e747-a47b-46fd-b445-0c7615b41020](https://i.imgur.com/8glAV2u.png)

If we move the NSTask-execution layer into its own process, the whole thing gets safer. Even if the XPC process crashes, the next time the main app calls into it the system will spin up a fresh XPC process automatically — the main app doesn't even notice.

## XPC architecture

Apple's documentation has a diagram that lays out the NSXPC architecture cleanly.

The main app and the XPC Service talk to each other via an `NSXPCConnection` object. The communication interface is defined by a Protocol, with each side exposing an object that conforms to it.

All XPC Services themselves are managed and supervised by `launchd`, the system-level process manager.

![NSXPC\_intro\_2x-337fb6a3-4df5-47b3-a322-e52c48905753](https://i.imgur.com/OdvfZk4.png)

## Building one

The interaction between the main app and the XPC Service is a textbook client/server setup. The client asks for data; the server answers. The serialization in between is entirely handled by the system.

### Step by step

#### Add a new XPC Service target

![Add New XPC Service Target](https://i.imgur.com/BNFRaG7.png)

![Input Target Info](https://i.imgur.com/AyEq9Iv.png)

One thing worth noting: Xcode's XPC Service template doesn't give you a language choice — it defaults to Objective-C boilerplate. But you can delete every file it generates and add a `main.swift` of your own; works just fine.

#### Set up the Listener

Once the target is in place, Xcode's default files already lay out roughly what needs to happen, between the comments and the code. I rewrote that logic in Swift:

![NSXCListener](https://i.imgur.com/o3gCND7.png)

Each service starts up an `NSXPCListener`. Its delegate is an `NSXPCListenerDelegate`, and the moment the main app initiates a connection, the delegate method fires to do the setup. The four things it needs to do are:

1.  Tell the connection which interface (protocol) the service exposes.
2.  Hand the connection an object that conforms to that protocol.
3.  Resume the connection.
4.  Return whether the incoming connection should be accepted.

`ServiceDemo` is the concrete object implementing the protocol.

#### Initiating the connection from the main app

Usually you kick off the connection at app launch. The steps are:

1.  Create an `NSXPCConnection` pointing at the right Service.
2.  Specify the protocol interface (the Protocol file's target membership has to cover both the main app and the XPC Service target).
3.  Call `resume`.

![Main Application](https://i.imgur.com/3UTQgK6.png)

At this point the Service's listener still hasn't actually run anything — that doesn't happen until the first request. You make a request by grabbing the protocol proxy off the `NSXPCConnection` you just created and calling methods on it.

![Request](https://i.imgur.com/9vACIeA.png)

The whole flow matches the diagram from Apple's docs:

![NSXPC\_connection\_2x-38a1e530-7c34-400b-a39b-eca9eaadbe22](https://i.imgur.com/BWf2G3l.png)

### Gotchas I've hit

- A method on an `NSXPCInterface` can only have *one* reply block. More than one and you get an exception:

``` text
XPCDemo[46250:3466789] NSXPCInterface: Only one reply block is allowed per selector (XPCDemo.DragonServiceProtocol / fireWithTimes:withSuccess:withFailure:)
```

- One request, multiple responses

Think download progress — somewhere in the middle of porting my NSTask layer, I needed the XPC service to stream the ongoing NSTask output back to the client as the task ran. But a reply block only fires once.

What you really want on the client side is a single block that gets called repeatedly with the latest data. Unfortunately, XPC doesn't support that. For example, this kind of streaming status callback isn't possible:

![Run Command with multiple replies](https://i.imgur.com/x2qwpVP.png)

There's an Apple-staff thread on this at [https://forums.developer.apple.com/thread/35731](https://forums.developer.apple.com/thread/35731). Two takeaways:

1.  Have the client and service track state themselves, and turn "one request, many callbacks" into "many requests, many callbacks."
2.  Have the client hand off the third-party work (an API call, say) directly to the service to handle.

### References

1.  [Creating XPC Services](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingXPCServices.html)
2.  [XPC · objc.io](https://www.objc.io/issues/14-mac/xpc/)
3.  [XPC…Can't call a reply block multiple times? \|Apple Developer Forums](https://forums.developer.apple.com/thread/35731)
