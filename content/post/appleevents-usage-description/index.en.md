---
title: 'Apple Event Sandboxing'
slug: 'appleevents-usage-description'
date: 2019-02-21T23:25:38+08:00
draft: false
categories: ['macos', 'swift']
tags: ['cocoapods', 'module', 'safari', 'sandbox', 'shadowsocks', 'swift', 'traffic']
---

## Background

I've been working on a small [Mac app](https://github.com/hechen/vibe) that runs an AppleScript to pull data out of OmniFocus and visualize it. Problem: it kept coming back with no data.

## The cause

The key step — running the AppleScript that actually fetches the data — was returning nothing.

``` applescript
set theProgressDetail to ""

tell application "OmniFocus"
    tell front document
        set theModifiedProjects to every flattened project
            repeat with a from 1 to length of theModifiedProjects
                set theCompletedTasks to (every flattened task of (item a of theModifiedProjects) where its number of tasks = 0)
                if theCompletedTasks is not equal to {} then
                    repeat with b from 1 to length of theCompletedTasks
                        set theProgressDetail to theProgressDetail & completion date of (item b of theCompletedTasks) & return
                    end repeat
                end if
            end repeat

        set theInboxCompletedTasks to (every inbox task where its number of tasks = 0)
    
        repeat with d from 1 to length of theInboxCompletedTasks    
            set theProgressDetail to theProgressDetail & completion date of (item d of theInboxCompletedTasks) & return
        end repeat
    end tell
end tell

display dialog theProgressDetail

return theProgressDetail
```

In Cocoa, the script is executed like this:

``` swift
let myAppleScript = "I am a piece of applescript"
if let scriptObject = NSAppleScript(source: myAppleScript) {
    var error: NSDictionary?
    let output = scriptObject.executeAndReturnError(&error)
}
```

Whether I ran the app in Debug from Xcode or archived and ran the built executable, the script always failed. The error:

``` text
"NSAppleScriptErrorMessage" : "Not authorized to send Apple events to OmniFocus."
```

Clearly: the app didn't have permission to send Apple events to OmniFocus.

Permission gating for Apple events was introduced in macOS Mojave. Apple tightened the permission model and now requires developers to explicitly tell the user what their app intends to do. iOS devs will know the drill — accessing the camera, the photo library, or FaceID all require explicit declarations in `Info.plist`.

On macOS Mojave, the equivalent for Apple events is a new key — **NSAppleEventsUsageDescription** — which you have to add to your plist with a clear description of why the app needs to send Apple events. This was covered in WWDC 2018 session ["Your Apps and the Future of macOS Security"](https://developer.apple.com/wwdc18/702): every Cocoa app that sends Apple events to other apps is affected. This is what's called **AppleEvent sandboxing**. If you don't add the key, the app silently lacks permission and the user is never prompted — which is exactly the symptom I hit.

So: add `NSAppleEventsUsageDescription` to `Info.plist` with an actual usage description.

![Capto\_Capture 2019-02-21\_11-47-11\_P](https://i.imgur.com/NEBjVZ3.png)

Launch the app again and you get a permission prompt:

![Capto\_Capture 2019-02-21\_11-47-42\_P](https://i.imgur.com/wm5GWLO.png)

The AppleScript-running API blocks synchronously waiting for the authorization result. Once the user grants permission, the app gets its data.

![Capto\_Capture 2019-02-21\_11-08-44\_P](https://i.imgur.com/sfN59K4.png)

## References

[WWDC 2018 Session 702](https://developer.apple.com/videos/play/wwdc2018/702/)
