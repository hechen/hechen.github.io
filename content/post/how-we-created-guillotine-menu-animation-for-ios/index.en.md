---
title: 'How we built the Guillotine menu animation for iOS'
slug: 'how-we-created-guillotine-menu-animation-for-ios'
date: 2015-09-01T15:52:07+00:00
draft: false
categories: ['data-structure', 'ios', 'leetcode', 'translation']
tags: ['algorithm', 'animation', 'ios', 'linked-list', 'notification', 'objective-c', 'push', 'string', 'tree']
---

> Original: [How We Created Guillotine Menu Animation for iOS](https://yalantis.com/blog/how-we-created-guillotine-menu-animation/)
> Author: [@johnsundell](https://twitter.com/johnsundell)

Ever wondered why nearly every app's menu is a **side**bar? Why isn't it a **top**Bar, a **bottom**Bar, or even a **corner**Bar?

This post is about a fresh trend in navigation-bar animation.

Animations are fun, but more importantly they pull real weight: they shift how a user thinks about a problem, make a product easier to use, and lift the whole feel of the app. What we're about to show is a great idea from designer **Vitaly Rubtsov**:

"Every designer has those moments of boredom. So much of the polish — the trimming, the spec work — leaves very little room for imagination. When that hits, I open Adobe After Effects and make something interesting.

I was thinking about what to build, and I had a thought: side menus always slide in from the left and push the content to the right. That convention is *boring*. What if we turned the side menu into a top menu? It falls from the top of the screen and lands in some unusual way. Sounds great, right?"

**Vitaly**'s topBar animation was implemented in `swift` by our iOS engineer **Maksym Lazebnyi**, who gave it a fun name — **Guillotine Menu**.

![Guillotine Menu Animation](https://i.imgur.com/Q2GueMC.gif)

------------------------------------------------------------------------

### How we built Guillotine Menu

**by Maksym Lazebnyi**

Our iOS team had seen plenty of ways to pull this animation off. We went with one that lets the developer customise the menu however they want in Storyboard.

To pull off our transitioning animation, we made a `UIStoryboardSegue` subclass and a custom animation controller. Strictly speaking, that's all you need — unless you want to dress it up. Which we did, so we built a few helper classes too.

In total, you need three classes plus a `UIView` extension to put this together:

- `GuillotineMenuSegue`. A `UIStoryboardSegue` subclass. We use it to present the menu modally, with the presentation animation handled by `GuillotineMenuTransitionAnimation`. `GuillotineMenuSegue` lets you give the menu transparency — though we didn't go there in this post.

- `GuillotineMenuTransitionAnimation`. Handles the custom animation for presenting the view of `GuillotineMenuViewController`.

- `GuillotineMenuViewController`. A `UIViewController` subclass that hosts the menu view.

On top of that, we extended UIView with a helper that adds constraints to a subview to fit its parent.

Going through them one at a time.

#### GuillotineMenuSegue

Nothing too exotic in this class — just a few highlights.

In the overridden `init`, we check that the destination view controller conforms to `GuillotineAnimationProtocol` (we'll get to it). In the overridden `perform`, we set `self` as the transitioning delegate.

In the delegate method `animationControllerForPresentedController`, we use an associated object to attach the `GuillotineMenuSegue` instance (**self**) to the view controller being presented, so the segue isn't deallocated while the menu view controller is on screen. (Translator's note: code below.)

``` objectivec
- (id <UIViewControllerAnimatedTransitioning>)animationControllerForPresentedController:(UIViewController *)presented presentingController:(UIViewController *)presenting sourceController:(UIViewController *)source
{
    // 将segue示例self关联到将要呈现的试图控制器presented中，这样确保presented生命周期内segue实例不会被释放
    objc_setAssociatedObject(presented, &key, self, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    
    return [[GuillotineTransitionAnimation alloc] initWithMode:AnimationModePresentation];
}
```

#### GuillotineMenuTransitionAnimation

All of the animation logic lives here.

We initially considered using `animateWithDuration usingSpringWithDamping & initialSprintVelocity`. But after thinking the animation through, we changed our minds. We needed the menu, after dropping from the top, to collide with the left edge of the parent view and bounce off it. UIKit's spring would let the bounce overshoot the boundary — so we dropped that approach and reached for `UIDynamicAnimator` instead.

To pull off our animation, `GuillotineMenuTransitionAnimation` has to conform to `UIViewControllerAnimatedTransitioning`, which has two delegate methods:

- `transitionDuration` — the transition duration doesn't matter much for us; return anything.

- `animationDuration` — called both when the menu opens and when it closes.

------------------------------------------------------------------------

### How do we figure out the animation positions?

We need to know where the animation is at every moment. `GuillotineMenuTransitionAnimation` needs `GuillotineMenuViewController` to hand it the centre of the menu button — the rotation `anchorPoint`. We also need a couple of other properties, so we made a protocol that `GuillotineMenuViewController` conforms to:

``` swift
 @objc protocol GuillotineAnimationProtocol: NSObjectProtocol {
      func navigationBarHeight() ->CGFloat
      func anchorPoint() ->CGPoint
      func hostTitle() ->NSString
 }
```

Translator's note: the Objective-C version:

``` objectivec
@protocol GuillotineAnimationProtocol <NSObject>
    - (CGFloat) navigationBarHeight;
    - (CGPoint) anchorPoint;
    - (NSString*) hostTitle;
@end
```

What each method does:

- **navigationBarHeight** — `GuillotineMenuViewController` rotates 90° during presentation and covers the navigation bar. We set `GuillotineMenuViewController`'s view position to `CGPoint(0, navigationBarHeight)`.

- **anchorPoint** — the rotation axis for the animation: the centre of the menu button in `GuillotineMenuViewController`.

- **hostTitle** — asks `GuillotineMenuViewController` for the host view controller's title.

------------------------------------------------------------------------

### How do we make the menu drop and rotate?

To pull off the drop-and-rotate animation, we use `UIDynamicAnimator` with four dynamic behaviours:
(Translator's note: this implements UIKit Dynamics — push, attachment, collision, and item behaviour. More at [UIKit Dynamics](http://www.coderyi.com/archives/426).)

- `UIPushBehavior` — drags the view. When presenting the menu, the force is applied at the bottom of the view; when dismissing, at the top.

- `UIAttachmentBehavior` — pins the view at the menu button's centre, like a nail.

- `UICollisionBehavior` — we add a boundary on the superview, running from the view's centre to its bottom-left corner. This gives `GuillotineMenuViewController` something to collide against at the end of its drop. (Translator's note: when the menu closes and springs back up, you need a boundary in the corresponding place — horizontally from the view's centre to the top-right corner.)

- `UIDynamicItemBehavior` — produces the bounce after the menu hits the left boundary.

In short: we use `CGAffineTransformRotate` to rotate `GuillotineMenuViewController`'s view 90° clockwise, position its bounds at `CGPoint(0, navigationBarHeight)`, then attach each of those `UIDynamicBehavior`s (`UIPushBehavior`, `UIAttachmentBehavior`, `UICollisionBehavior`, `UIDynamicItemBehavior`).

`UIDynamicAnimator` runs the animation until all the attached forces reach equilibrium.

We use the `UIDynamicAnimatorDelegate` protocol to notify the view controller when the animation completes. We also need to call `endAppearanceTransition()`.

One tricky bit is setting the **anchorPoint**. For the animation to look right, the distance from the anchor point to the left edge of `GuillotineMenuViewController`'s view has to match the distance from the anchor point to the bottom of the top navigation bar. And the anchor point needs to be updated when the device rotates. But `GuillotineMenuTransitionAnimation` calls the `anchorPoint()` delegate method *before* `viewDidLayoutSubviews()`.

So we hard-coded the button position for the horizontal orientation.

Translator's note: any layout change — like a device rotation — triggers `viewDidLayoutSubviews()`. We could dynamically adjust the button position (i.e. the anchor point) there. But the transition animation has to read the anchor point *before* that method fires, which is the conflict. The author chose to hard-code the menu button's position post-layout-change.

#### UIViewExtension

A simple UIView extension for adding constraints that make a subview fit its parent. The code is self-explanatory, so I won't walk through it.

Translator's note: ObjC categories work differently from Swift extensions. In the ObjC implementation the files are `UIView+ConstraintExtension.h` / `.m`.

#### Guillotine Menu View Controller

You can subclass it, customise it, or override it. The only rule is conforming to `GuillotineAnimationProtocol`.

------------------------------------------------------------------------

### How do you customise the animation?

Any way you like! Just write a custom `GuillotineMenuSegue` where the source view controller is your host view controller and the destination is the menu view controller you want to present.

I'll be honest: when I started, I thought this animation would be simple and uneventful. In hindsight, there's a lot of untapped potential here for iOS developers. The animation can also live as a standalone animated view, or as a `UINavigationController` subclass with a custom navigation bar. We plan to keep iterating, aiming for a full `UINavigationController` subclass with a custom transition animation.

You can find the source and design here:

- [GitHub](https://github.com/Yalantis/GuillotineMenu)
- [Dribbble](https://dribbble.com/shots/2018249-Side-Topbar-Animation)

> Translator's note: an Objective-C port is at [GuillotineMenu-objc](https://github.com/hechen/GuillotineMenu-objc).
