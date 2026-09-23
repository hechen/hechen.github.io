---
title: 'How to generate a NSViewController without a Nib?'
slug: 'create-nsviewcontroller-without-nib'
date: 2019-06-03T20:55:54+08:00
draft: false
categories: ['macos']
tags: ['agent', 'applescript', 'backgroundcolor', 'build', 'cocoa', 'compile', 'dock', 'dockless', 'framework', 'library', 'login', 'mach-o', 'menu', 'nstask', 'nsview', 'nsviewcontroller', 'preprocess', 'process', 'uiviewcontroller', 'xcode']
---

Recently, I created all the ViewControllers through the storyboard or the Nib (for views). Today, when I created a demo project without any Nib file, the ViewController did not show as I expected.

WTF, Can you believe that? I cannot even create a ViewController now.

There exist some differences between iOS and macOS.

## iOS

In the previous development on the iOS platform, creating a ViewController — specifically a UIViewController instance — is dead simple, as below.

``` swift
import UIKit

class ViewController: UIViewController {}
let vc = ViewController()
print("vc.view.frame = \(vc.view.frame)")
```

You can create a UIViewController without a nib file, and customize the view’s properties as you like. Nothing unexpected happens, and the ViewController has a default view.

## macOS (Cocoa)

However, when you want to create an NSViewController in the same way, something goes wrong.

``` swift
import Cocoa

class ViewController: NSViewController {}
let viewController = ViewController()
print("vc.view.frame = \(vc.view.frame)")
```

It looks the same as what we do for UIViewController. And it should work like UIViewController.

However, an exception is thrown, which shows that ‘could not load the nibName’. Why?

``` text
[General] -[NSNib _initWithNibNamed:bundle:options:] could not load the nibName: Demo.ViewController in bundle (null).
```

So, it looks as though NSViewController will not create a default rootView for us. We must create one ourselves. The key is the `loadView`. Just override the loadView() method, then create an NSView instance.

``` swift
import Cocoa

class ViewController: NSViewController {
  override func loadView() {
    self.view = NSView()
  }
}
```

That’s it.

Now, I have found that macOS development has many differences from iOS. You may encounter many fundamental pitfalls, and when you do stumble, be patient. Reading Apple’s documentation is your top priority — then Google.

## References

1.  [Instantiate a UIViewController without Nib](https://stackoverflow.com/questions/37526411/instantiate-uiviewcontroller-programmatically-without-nib)
2.  [Instantiate a NSViewController without Nib](https://medium.com/hyperoslo/how-to-write-an-nsviewcontroller-without-interface-builder-on-macos-760283648f12)
