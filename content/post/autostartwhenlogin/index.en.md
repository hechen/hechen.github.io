---
title: 'How Mac apps launch at login'
slug: 'autostartwhenlogin'
date: 2019-03-18T17:29:54+08:00
draft: false
categories: ['macos', 'productivity', 'rxswift']
tags: ['agent', 'backgroundcolor', 'cocoa', 'dock', 'dockless', 'evernote', 'login', 'macos', 'menu', 'nsview', 'safari', 'sandbox', 'shadowsocks', 'subject', 'traffic', 'variable', '印象笔记']
---

Launching at login is one of the most common features for a Cocoa app — especially the menu-bar utilities that are meant to be always-on. Let's walk through how to add this functionality.

The [Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLoginItems.html#//apple_ref/doc/uid/10000172i-SW5-SW1) has a section on building login items:

> Applications can contain a helper application as a full application bundle, stored inside the main application bundle in the Contents/Library/LoginItems directory. Set either the LSUIElement or LSBackgroundOnly key in the Info.plist file of the helper application's bundle.

> Use the SMLoginItemSetEnabled function (available in OS X v10.6.6 and later) to enable a helper application. It takes two arguments, a CFStringRef containing the bundle identifier of the helper application, and a Boolean specifying the desired state. Pass true to start the helper application immediately and indicate that it should be started every time the user logs in. Pass false to terminate the helper application and indicate that it should no longer be launched when the user logs in. This function returns true if the requested change has taken effect; otherwise, it returns false. This function can be used to manage any number of helper applications.

> If multiple applications (for example, several applications from the same company) contain a helper application with the same bundle identifier, only the one with the greatest bundle version number is launched. Any of the applications that contain a copy of the helper application can enable and disable it.

As described in the docs, you embed a helper application inside the main application bundle, at the fixed path `Contents/Library/LoginItems`.

The other option is `Shared File List`, whose APIs live under [Launch Services Reference](https://developer.apple.com/documentation/coreservices/launch_services) — specifically in `LSSharedFileList.h`.

## Sandboxed apps

The [App Sandbox Design Guide](http://developer.apple.com/library/mac/documentation/Security/Conceptual/AppSandboxDesignGuide/DesigningYourSandbox/DesigningYourSandbox.html#//apple_ref/doc/uid/TP40011183-CH4-SW3) has this to say about launching at login:

> To create a login item for your sandboxed app, use the SMLoginItemSetEnabled function (declared in ServiceManagement/SMLoginItem.h) as described in Adding Login Items Using the Service Management Framework.
>
> (With App Sandbox, you cannot create a login item using functions in the LSSharedFileList.h header file. For example, you cannot use the function LSSharedFileListInsertItemURL. Nor can you manipulate the state of Launch Services, such as by using the function LSRegisterURL.)

So this is the first of the two approaches mentioned above. The Shared File List APIs can't be used by sandboxed apps at all, and `LSSharedFileList.h` was deprecated in 10.10 anyway.

Put it all together, and there's effectively *one* way to add a login item on macOS today: ship a helper app that boots the main app. The flow is:

1.  Add the helper app to the system's login items;
2.  System boots and starts the helper;
3.  Helper boots the main app;
4.  Main app finishes launching, then kills the helper.

Yes, it's that convoluted. Here are the concrete steps:

1.  Create a helper app as a new target of the main app;
2.  In the helper's Info.plist, set `LSBackgroundOnly` to `YES`;
3.  In the helper's build settings, set `Skip Install` to `YES` (this tells Xcode not to copy the helper's Product into the archive on its own, because step 4 already takes care of that);
4.  In the main app's Build Phases, add a `Copy Files` phase that:
    - sets Destination to Wrapper
    - sets Subpath to `Contents/Library/LoginItems`
    - copies the helper app's Product

If your head is spinning already, fair enough — and this is all just project setup, before we write a line of code.

## Setting up the launcher

![Add New Target](https://i.imgur.com/fJUpG26.png)

Pick CocoaApp:

![Specify Cocoa App](https://i.imgur.com/tXJDr1Y.png)

Set the Product ID to `StartAtLoginLauncher` and the target's Bundle ID to `app.chen.osx.demo.StartAtLoginLauncher`.

![Modify BundleID](https://i.imgur.com/uj2yhht.png)

Edit `StartAtLoginLauncher`'s Info.plist and set `LSBackgroundOnly` to YES:

![BackgroundOnly](https://i.imgur.com/BqNsFm7.png)

In the launcher's Build Settings, set `Skip Install` to `YES`:

![Skill Install](https://i.imgur.com/qKZzECK.png)

Now in the main `StartAtLogin` target, add a Copy Files build phase with the path fixed to `Contents/Library/LoginItems` and `StartAtLoginLauncher` as the file to copy:

![Copy files Build Phase](https://i.imgur.com/wfaxgmZ.png)

That's it for setup. Hit Command+B and check the resulting product to confirm the launcher is bundled inside the main app:

![Build Product](https://i.imgur.com/XfyYMG1.png)

![Reveal Package Content](https://i.imgur.com/OGXYmxw.png)

Almost done. Since `StartAtLoginLauncher` is meant to run entirely in the background, we don't want it to pop a window when it launches. So delete the UI code: in Main.storyboard, remove the Window and ViewController and keep only the Application Scene.

![Demo Start When Login](https://i.imgur.com/poclDG1.png)

That wraps up the configuration work — the main app now has a helper that knows how to boot it.

### Wiring it up

The runtime logic has two pieces:

1.  When the main app launches, kill the helper, because its job is done;
2.  When the helper launches, wake the main app.

#### Main app

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

Once the main app finishes launching, it checks the list of running applications for the helper. If it's there, it posts a notification asking the helper to terminate.

#### Helper app

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

When the helper launches, it checks whether the main app is already running. If it is, the helper terminates itself. Otherwise, it wakes up the main app — but first it registers a listener, so once the main app is up it gets the notification and self-destructs. 😂

We're using `DistributedNotificationCenter` here, which differs from the regular `NotificationCenter` in that the notifications it posts cross process boundaries. Any other process that has registered for the same notification will receive it. The system's day/night switch is one of these, and posts under the notification name `AppleInterfaceThemeChangedNotification`:

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

So the notification name in the demo is just illustrative — in real code, make sure your notification names are unique.

#### Toggling the launch-at-login state

There are two key APIs for managing the launch-at-login state:

1.  SMCopyAllJobDictionaries
2.  SMLoginItemSetEnabled

##### SMCopyAllJobDictionaries

To check the current state, use `SMCopyAllJobDictionaries`:

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

It's been marked deprecated since 10.10, but as of 10.14 there's still no replacement, so we keep using it (per Apple's own note above).

The argument specifies which kind of job to fetch — pass `kSMDomainUserLaunchd` to get every job in the user's login items. Each Job is a dictionary, and its contents look roughly like this:

![Launch Job-c500](https://i.imgur.com/KDLqn9a.png)

We look up our launcher by its Label:

``` swift
let launchHelperIdentifier = "app.chen.osx.demo.StartAtLoginLauncher"
let jobs = SMCopyAllJobDictionaries(kSMDomainUserLaunchd).takeRetainedValue() as? [[String: AnyObject]]
var autoLaunchRegistered = jobs?.contains(where: { $0["Label"] as! String == launchHelperIdentifier }) ?? false
```

##### SMLoginItemSetEnabled

To toggle the launch-at-login state, use `SMLoginItemSetEnabled`. It takes the bundle ID of the app to launch and the desired state.

Remember — what we're toggling here is the *launcher's* state, not the main app's.

``` swift
var startAtLogin = true

// ....

let launchHelperIdentifier = "app.chen.osx.demo.StartAtLoginLauncher"
SMLoginItemSetEnabled(launchHelperIdentifier as CFString, startAtLogin)
```

### Testing it

That's all the code. To test, archive the app, drag it to `/Applications`, launch it, and tick the Start At Login checkbox.

![StartAtLogin](https://i.imgur.com/szvqHoG.png)

To be safe, Quit the test app before logging out and untick the Reopen option:

![Not Reopen](https://i.imgur.com/5KrpAuU.png)

Log out, log back in, and check whether the demo app launches on its own. On my machine, it does:

![Desktop](https://i.imgur.com/XJsUmVS.png)

One last thing on the target's Sandbox setting: as the only viable official path to launch at login, this approach works for both sandboxed and non-sandboxed apps.

## Recommended tool

A shout-out to [LaunchAtLogin](https://github.com/sindresorhus/LaunchAtLogin) by [sindresorhus](https://github.com/sindresorhus) on GitHub — a small utility that wraps up all of the above into something far less painful.

## References

1.  [App Sandbox Design Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/AppSandboxDesignGuide/AboutAppSandbox/AboutAppSandbox.html#//apple_ref/doc/uid/TP40011183-CH1-SW1)
2.  [Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/Introduction.html#//apple_ref/doc/uid/10000172i-SW1-SW1)
3.  [Launch Services Programming Guide](https://developer.apple.com/library/archive/documentation/Carbon/Conceptual/LaunchServicesConcepts/LSCIntro/LSCIntro.html#//apple_ref/doc/uid/TP30000999)
4.  [NSDistributedNotificationCenter](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Notifications/Articles/NotificationCenters.html)
5.  [What does Skip-Install mean?](https://stackoverflow.com/questions/16374851/xcode-4-target-build-setting-skip-install-what-is-it)
