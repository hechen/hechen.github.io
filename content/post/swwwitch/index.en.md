---
title: 'Building a little utility: Swwwitch'
slug: 'swwwitch'
date: 2019-03-30T11:29:54+08:00
draft: false
categories: ['macos', 'productivity']
tags: ['agent', 'applescript', 'backgroundcolor', 'cocoa', 'dock', 'dockless', 'evernote', 'login', 'macos', 'menu', 'nstask', 'nsview', 'process', 'safari', 'sandbox', 'shadowsocks', 'traffic', '印象笔记']
---

I saw something making the rounds in the dev community recently, so I built a small tool — a quick way to consolidate a few Cocoa-app features I'd been meaning to try. Practice project, basically. Right now it includes two switches: toggle the system theme, and hide the desktop icons.

![Swwwitch-c500](https://i.imgur.com/U9RTmVU.png)

## Features

1.  Toggle the system theme
2.  Show or hide desktop icons
3.  Pure menu-bar-only app (no Dock icon)
4.  Launch on login

I covered the implementation of point 3 in [another post](https://hechen.xyz/post/dockless-cocoaapps/), and point 4 in [this one](https://hechen.xyz/post/autostartwhenlogin/).

### Toggling the system theme

The system-theme toggle is built on top of AppleScript:

``` applescript
tell application "System Events"
    tell appearance preferences
        set dark mode to not dark mode
    end tell
end tell
```

You can run this AppleScript yourself to toggle the theme — try the link below.

[Click here to run](#ZgotmplZ)

### Showing/hiding desktop icons

Hiding the desktop icons is really just running a system shell command. A Cocoa app can launch a process via `Process` (the new name for `NSTask`), and that's exactly what we do here — kick off a short command line via `NSTask`:

``` bash
defaults write com.apple.finder CreateDesktop false
killall Finder
```

Try it:

[Click here to hide Desktop Icons](#ZgotmplZ)

[Click here to show Desktop Icons](#ZgotmplZ)

If you're curious, take a look at the code — the gist is straightforward.
[Releases](https://github.com/hechen/Swwwitch/releases)

## TODO

1.  Add more switches
2.  Add user-customised switch settings

## Links

[All command lines macOS supports](https://ss64.com/osx/)
