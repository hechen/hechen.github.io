---
title: "How to generate a NSViewController without a Nib?"
date: 2019-06-03T20:55:54+08:00
categories: ["macOS"]
tags: ["NSViewController","UIViewController"]
---

In the last days, I created all the ViewControllers through the storyboard or the Nib (for views). Today, when I created a demo project without any Nib file, the ViewController did not show as I expected.

<!-- more -->

WTF, Can you believe that? I cannot even create a ViewController now. 

There exist some differences between iOS and macOS.

## iOS

In the previous development on the iOS platform, create a ViewController, specifically UIViewController instance, is dead simple as below.

``` Swift
import UIKit

class ViewController: UIViewController {}
let vc = ViewController()
print("vc.view.frame = \(vc.view.frame)")
```

You can create a UIViewController without a nib file, and customize the view's properties as you like. Nothing unexpected happen and ViewController has a default view.

## macOS (Cocoa)

However, when you want to create a NSViewController in the same way, something wrong occur.

``` Swift
import Cocoa

class ViewController: NSViewController {}
let viewController = ViewController()
print("vc.view.frame = \(vc.view.frame)")
```

It looks like the same as what we do for UIViewController. And it should work like UIViewController.

However, an exception is thrown, which shows that 'could not load the nibName'. Why?

```
[General] -[NSNib _initWithNibNamed:bundle:options:] could not load the nibName: Demo.ViewController in bundle (null).
```

So, It looks like that NSViewController will not create a default rootView for us. We must create one by ourselves. The key is the `loadView`. Just override the loadView() method, then create a NSView instance.

``` Swift
import Cocoa

class ViewController: NSViewController {
  override func loadView() {
    self.view = NSView()
  }
}

```

That's it.

Now, I have found that macOS development has many differences with iOS. You may encounter many fundamental pitfalls, and when you indeed stumble, be patient. To read the Apple's documentations is you top priority, then Google please.

## References

1. [Instantiate a UIViewController without Nib](https://stackoverflow.com/questions/37526411/instantiate-uiviewcontroller-programmatically-without-nib)
2. [Instantiate a NSViewController without Nib](https://medium.com/hyperoslo/how-to-write-an-nsviewcontroller-without-interface-builder-on-macos-760283648f12)