---
title: 'A few notes on LetsMove'
slug: 'letsmove'
date: 2019-07-04T01:19:10+08:00
draft: false
categories: ['macos']
tags: ['agent', 'applescript', 'build', 'cocoa', 'compile', 'dock', 'framework', 'launchddaemon', 'letsmove', 'library', 'login', 'mach-o', 'menu', 'nstask', 'nsviewcontroller', 'preprocess', 'process', 'shell', 'sourcecode', 'uiviewcontroller', 'xcode', 'xpc']
---

When you download a Mac app from the web, it usually ends up in your Downloads folder. But some apps really need to live in /Applications to work properly — self-update being the most common case, since it's gated on the current install location. So when you open a freshly downloaded `.app`, you often see a prompt asking whether to move it to /Applications. LetsMove is the open-source library most Mac apps either reference or integrate to handle this flow.

![LetsMove](https://i.imgur.com/99z1BQf.png)

The library has been around for years; its most recent commit was in 2017. There are a few interesting bits worth digging into.

### The general idea

Despite the name "Move", what it actually does is copy the current app bundle to /Applications, then kill itself and delete the original.

1.  After the user confirms "Move to Applications Folder",
2.  copy the current `.app` to /Applications,
3.  delete the currently running `.app` (this works on Mac — unlike Windows, there's no "file in use" lock to worry about),
4.  spawn a child process to handle the relaunch (more on this below).

### Acquiring privileges (privilege escalation)

To check whether a path is writable, LetsMove uses `NSFileManager`'s `isWritableFileAtPath`. If it returns false, LetsMove proactively requests elevated privileges.

The API it uses for that is `AuthorizationExecuteWithPrivileges`, which has been marked deprecated since OS X 10.7 Lion but still works as of macOS 10.14.

To guard against Apple eventually removing the function outright, the author looks it up dynamically with `dlsym` instead of linking directly — that way, if the symbol disappears, the rest of the app still works.

![Privileges Acquirement](https://i.imgur.com/LPQw1VR.png)

This call gets the `rm` and `cp` commands permission to operate on the target directory. The user sees a prompt to enter their admin password during this step.

For the record, Apple's official recommendation is to use a launchd-launched helper tool or the Service Management framework. Both of those came up earlier when I looked at app auto-launch, and honestly, neither is as simple as what LetsMove does. If you're curious, look up LaunchdDaemon.

> Use a launchd-launched helper tool and/or the Service Mangement framework
> for this functionality.

### Relaunch

The `relaunch` step kicks in after the app has been moved to /Applications.

![Relaunch Code](https://i.imgur.com/VnRvggh.png)

The shell script that NSTask uses to restart the process looks like this:

![Relaunch Shell Script](https://i.imgur.com/hBftQB9.png)

Two things are happening here:

1.  Adjusting the extended attributes on the freshly-copied `.app` in /Applications.
2.  Running a shell script that kills the current parent process and relaunches the new copy from /Applications.

On the first point — the script uses `kill` to kill the current process, but with `kill -0`, which isn't actually a valid signal. `kill -0` is really just a way to check whether you have permission to send a signal to the process. I never quite figured out the intent here; if you know, please drop me a line.

On the second point — it uses the `xattr` command, which manipulates extended file attributes. The command above strips the `com.apple.quarantine` attribute from the `.app` we just moved into /Applications. You probably know the prompt this is meant to suppress — open something downloaded from the web (say, the GitHub Desktop client) and you get:

![Download from Web](https://i.imgur.com/i9qfEtf.png)

This is macOS's built-in security check. Apps downloaded from the web are tagged with `com.apple.quarantine`; removing that attribute means the `open` command won't trigger the prompt and pester the user.

All of this only works for non-sandboxed apps, of course — the authorization APIs are heavily restricted inside the sandbox. If you need a similar flow for a sandboxed app, the usual approach is to ship a `.dmg` so the user can do the drag-to-Applications gesture themselves.

## References

1.  [What does `kill -0` do?](https://unix.stackexchange.com/questions/169898/what-does-kill-0-do)
2.  [Extended file attributes - Wikipedia](https://en.wikipedia.org/wiki/Extended_file_attributes)
3.  [Doesn't work with sandboxed apps](https://github.com/potionfactory/LetsMove/issues/41)
