---
title: 'How do dockless Mac apps work?'
slug: 'dockless-cocoaapps'
date: 2019-03-13T17:29:54+08:00
draft: false
categories: ['macos', 'productivity', 'rxswift', 'swift']
tags: ['agent', 'backgroundcolor', 'cocoa', 'cocoapods', 'dock', 'dockless', 'evernote', 'macos', 'menu', 'module', 'nsview', 'safari', 'sandbox', 'shadowsocks', 'subject', 'swift', 'traffic', 'variable', '印象笔记']
---

Menu-only apps are one of the most common patterns in Cocoa-land. They don't take up a spot in your Dock, they don't get in the way when you're switching across multiple workspaces, and they're always one click away from the menu bar at the top of the screen. For apps that lean heavily on quick access, having a menu bar entry is essentially required. This post is a quick tour of the key steps for building one.

# Background

Take [Shimo](https://www.shimovpn.com/) as an example.

![Shimo](https://i.imgur.com/vT7EEVK.png)

In its settings, the "Show Shimo in" menu has three options:

1.  Menubar only
2.  Dock only
3.  Menubar & Dock

![Shimo Menu](https://i.imgur.com/WywIVkV.png)

This is a common pattern across a lot of Cocoa apps — DayOne, Dash, Todoist, and so on.

![Dash](https://i.imgur.com/ioUvpNw.png)

![Todoist](https://i.imgur.com/ORYAEcZ.png)

There are really only two pieces here:

1.  Show or hide the Dock icon.
2.  Show or hide the menu bar item — and any combination of the two.

# The core steps

## Dock

A normal Cocoa Application shows up in the Dock by default. To hide the Dock icon, the app first needs the *capability* to do so, which is declared via a key in `info.plist`. The key is `LSUIElement`, which you set to `true`:

```
    <key>LSUIElement</key>
    <true/>
```

When you view the plist in Xcode's visual editor, the description for this key reads "Application is agent (UIElement)".

![plist](https://i.imgur.com/ef3w8TR.png)

Now relaunch the app and you'll see its Dock icon is gone. That's what `UIElement` does — it declares the Cocoa app to be a UIElement (a.k.a. agent) application: not shown in the Dock, but allowed to present some user interface. The header file for `TransformProcessType` lists the common Cocoa application types:

``` swift
/*
 *  TransformProcessType()
 *  
 *  Summary:
 *    Changes the 'type' of the process specified in the psn parameter.
 *     The type is specified in the transformState parameter.
 *  
 *  Discussion:
 *    Given a psn for an application, this call transforms that
 *    application into the given type.  Foreground applications have a
 *    menu bar and appear in the Dock.  Background applications do not
 *    appear in the Dock, do not have a menu bar ( and should not have
 *    windows or other user interface ).  UIElement applications do not
 *    have a menu bar, do not appear in the dock, but may in limited
 *    circumstances present windows and user interface. If a foreground
 *    application is frontmost when transformed into a background
 *    application, it is first hidden and another application is made
 *    frontmost.  A UIElement or background-only application which is
 *    transformed into a foreground application is not brought to the
 *    front (use SetFrontProcess() after the transform if this is
 *    required) nor will it be shown if it is hidden ( even if hidden
 *    automatically by being transformed into a background-only
 *    application ), so the caller should use ShowHideProcess() to show
 *    the application after it is transformed into a foreground
 *    application. Applications can only transform themselves; this
 *    call cannot change the type of another application.

extern OSStatus 
TransformProcessType(
  const ProcessSerialNumber *        psn,
  ProcessApplicationTransformState   transformState)          AVAILABLE_MAC_OS_X_VERSION_10_3_AND_LATER;  
```

The comment lays it out clearly. A Cocoa application falls into one of three buckets:

1.  Foreground applications — have a menu bar and appear in the Dock.
2.  Background applications — don't appear in the Dock, don't have a menu bar, and shouldn't present any UI (per the recommendation).
3.  UIElement applications — same as background apps, but allowed to present user interface in certain situations.

`TransformProcessType` is the API you use to switch between these modes:

``` swift
func toggleDock(show: Bool) -> Bool {

    // ProcessApplicationTransformState
    let transformState = show ? 
    // show to foreground application 
    // or not show to background application
        ProcessApplicationTransformState(kProcessTransformToForegroundApplication) 
    : ProcessApplicationTransformState(kProcessTransformToUIElementApplication)

    // transform current application type.
    var psn = ProcessSerialNumber(highLongOfPSN: 0, lowLongOfPSN: UInt32(kCurrentProcess))
    return TransformProcessType(&psn, transformState) == 0
}
```

There's actually another approach that a lot of developers prefer: set the app's `ActivationPolicy`. The core API is `setActivationPolicy`:

``` swift
    /* Attempts to modify the application's activation policy.  In OS X 10.9, any policy may be set; prior to 10.9, the activation policy may be changed to NSApplicationActivationPolicyProhibited or NSApplicationActivationPolicyRegular, but may not be changed to NSApplicationActivationPolicyAccessory.  This returns YES if setting the activation policy is successful, and NO if not.
     */
    @available(OSX 10.6, *)
    open func setActivationPolicy(_ activationPolicy: NSApplication.ActivationPolicy) -> Bool
```

The header file also explains what each `ActivationPolicy` actually means:

``` swift
   /* The following activation policies control whether and how an application may be activated.  They are determined by the Info.plist. */
    public enum ActivationPolicy : Int {
        /* The application is an ordinary app that appears in the Dock and may have a user interface.  This is the default for bundled apps, unless overridden in the Info.plist. */
        case regular

        /* The application does not appear in the Dock and does not have a menu bar, but it may be activated programmatically or by clicking on one of its windows.  This corresponds to LSUIElement=1 in the Info.plist. */
        case accessory
        
        /* The application does not appear in the Dock and may not create windows or be activated.  This corresponds to LSBackgroundOnly=1 in the Info.plist.  This is also the default for unbundled executables that do not have Info.plists. */
        case prohibited
    }
```

The different activation policies are effectively equivalent to setting the corresponding keys in `Info.plist`. The `regular` policy is what you'd expect for a normal app — it shows up in the Dock. The `accessory` policy turns the app into an agent and removes it from the Dock.

Showing or hiding the Dock icon then boils down to toggling the activation policy:

``` swift
func toggleDock2(show: Bool) -> Bool {
        return show ?
               NSApp.setActivationPolicy(.regular)
             : NSApp.setActivationPolicy(.accessory)
    }
```

## Menu bar

Once you can hide the Dock icon, you still need to give the app a menu bar entry. The class to use is `NSStatusItem`, which represents an entry in the system menu bar:

``` swift
let statusItem = NSStatusBar.system.statusItem(withLength:NSStatusItem.squareLength)
```

The system creates a button slot in the menu bar, but you still need to set its UI:

``` swift
if let button = statusItem.button {
            button.image = NSImage(named:NSImage.Name("ic_dock"))
            button.action = #selector(doWhatYouWantToDo(_:))
        }
```

Now when the app launches, you'll see an icon in the menu bar. For a more detailed walkthrough, see Ray Wenderlich's tutorial — no point in repeating it here. \[[Menus and Popovers in Menu Bar Apps for macOS](https://www.raywenderlich.com/450-menus-and-popovers-in-menu-bar-apps-for-macos)\]

There's also a library called [CCNStatusItem](https://github.com/phranck/CCNStatusItem) that covers most of what you'd want — customizing the menu button, click popovers, drag and drop support, and so on. It hasn't been maintained in a while, though, so use it for reference only.

# References

1.  [Show/Hide dock icon on macOS App](https://medium.com/@jackymelb/show-hide-dock-icon-on-macos-app-3a59f7df282d)
2.  [NSStatusItem](https://developer.apple.com/documentation/appkit/nsstatusitem)
3.  [Menus and Popovers in Menu Bar Apps for macOS](https://www.raywenderlich.com/450-menus-and-popovers-in-menu-bar-apps-for-macos)
4.  [CCNStatusItem](https://github.com/phranck/CCNStatusItem)
