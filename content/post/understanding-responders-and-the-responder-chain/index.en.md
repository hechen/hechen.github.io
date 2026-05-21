---
title: 'Understanding responders and the responder chain'
slug: 'understanding-responders-and-the-responder-chain'
date: 2017-11-13T21:22:44+00:00
draft: false
categories: ['book', 'ios', 'swift', 'translation']
tags: ['category', 'closure', 'document', 'garbage-collection', 'ios', 'notification', 'push', 'python', 'swift', 'uigesturerecognizer', 'uiresponder']
---

Apps receive and handle events through responder objects. A responder is an instance of the UIResponder class — and UIView, UIViewController, and UIApplication, all the usual suspects, are all subclasses of UIResponder. UIKit manages the responder-related behaviour for you, including how events get passed from one responder to the next. You can, of course, override the default event-routing behaviour if you need to.

UIKit dispatches most events to the responder best-suited to handle them. If that responder can't deal with the event, UIKit passes it along to the next responder in the current responder chain. The responder chain is the dynamic configuration of all the responders in your app — and because it's dynamic, your app never has just a single fixed responder chain. Events flow from specific responders toward more general ones, which makes it easy to figure out who the next responder is. For example, a view's next responder is its superview, or the view controller that manages it. Events keep travelling down the chain until something handles them.

The diagram below shows the responder chain for an app whose interface contains a Label, a TextField, a Button, and two container views. If the TextField doesn't handle some event, UIKit sends it to the TextField's parent UIView; if that doesn't handle it either, on to the view's window. If the window can't handle it either, UIKit eventually delivers the event to the UIApplication object. Usually the app delegate is also a UIResponder, and at this point we've left the responder chain proper.

![Figure 1 — an example responder chain](https://i.imgur.com/qvT1XMO.png)

For each event, UIKit designates a first responder and sends the event there first. What counts as the first responder depends on the type of event:

1.  **Touch events.** The first responder is the view in which the touch occurred.
2.  **Press events.** The first responder is the responder that currently holds focus.
3.  **Motion event.** The first responder is whichever object you explicitly designate to handle the event. Core Motion handles everything from the accelerometer, barometer, and magnetometer. Motion events don't flow through the responder chain.
4.  **Shake-motion events.** The first responder is the object you or UIKit designates.
5.  **Remote-control events.** The first responder is the object you or UIKit designates.
6.  **Editing-menu messages.** The first responder is the object you or UIKit designates.

Controls sending action messages to their associated targets aren't themselves events, but they still benefit from the responder chain. When a control's target object is nil, UIKit walks up the responder chain looking for an object that can handle the action. This is how, for example, UIKit's edit buttons find a responder to perform `cut:`, `copy:`, or `paste:`.

If a view has a gesture recognizer attached, the recognizer can delay delivery of touch and press events to that view. The `delaysTouchesBegan` and `delaysTouchesEnded` properties on `UIGestureRecognizer`, along with `cancelsTouchesInView`, control when and how those touches are delayed.

## Identifying the responder containing a touch

UIKit uses view-based hit-testing to figure out where a touch event happened. Specifically, UIKit compares the touch location against the bounds of every view in the view hierarchy. UIView's `hitTest:withEvent:` method walks the whole hierarchy and finds the deepest view containing the touch — that view becomes the first responder for the touch event.

> If a touch location falls outside a view's bounds, `hitTest:withEvent:` ignores that view and all of its subviews. So if you've set a view's `clipsToBounds` property to NO, a subview can extend beyond the parent's bounds visually, but a touch in that overflow area won't register.

In this way UIKit keeps assigning each touch to the view containing it. When a touch begins, UIKit creates a `UITouch` object that lives until the touch ends. As the touch's location or other parameters change, UIKit updates that UITouch. Some attributes don't change, though — the view the touch is associated with, for instance, stays the same even if the touch's current location moves outside that view's bounds.

## Modifying the responder chain

You can change the responder chain by overriding a responder's `nextResponder` property. Many UIKit classes have already done this and return specific objects.

1.  If you override `nextResponder` on any class, the next responder is whatever you return.
2.  `UIView`
    2.1 If the view is a view controller's root view, its next responder is the view controller.
    2.2 If the view isn't a view controller's root view, its next responder is its superview.
3.  `UIViewController`
    3.1 If the view controller's view is the root view of a window, the next responder is the window.
    3.2 If the view controller was presented by another view controller, the next responder is the presenting view controller.
4.  `UIWindow` — the window's next responder is the `UIApplication` object.
5.  `UIApplication` — the next responder is the app delegate, which must be a `UIResponder` instance and must not be a view, view controller, or the `UIApplication` object itself.
