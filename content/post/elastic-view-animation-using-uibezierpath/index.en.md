---
title: 'Building an elastic view animation with UIBezierPath'
slug: 'elastic-view-animation-using-uibezierpath'
date: 2015-12-02T18:53:51+00:00
draft: false
categories: ['ios', 'leetcode', 'translation']
tags: ['algorithm', 'animation', 'category', 'ios', 'notification', 'objective-c', 'push', 'runtime', 'string', 'swift', 'tree']
---

> Original: [Elastic view animation, or how I built DGElasticPullToRefresh](https://hackernoon.com/elastic-view-animation-or-how-i-built-dgelasticpulltorefresh-269a3ba8636e)
> Author: [@gontovnik](https://twitter.com/gontovnik)

[DGElasticPullToRefresh](https://github.com/gontovnik/DGElasticPullToRefresh) demonstrates a springy elastic effect. Here's what it looks like:

![DGElasticPullToRefresh.gif](https://i.imgur.com/NzdoFS9.gif)

Environment:
Xcode 7
Swift 2.0

Prerequisite: some familiarity with UIBezierPath and UIGestureRecognizer.

### How it works

You can probably tell from the gif what's going on under the hood. The animation is built on top of UIBezierPath. We create a CAShapeLayer with a bezier path, and as the finger moves across the screen, we move all the control points to drive the animation. Each control point is represented by a visible UIView. The diagrams below illustrate the setup — I've marked the control points in red.

![1\_vAmk8ulHh4OJji\_X35zW4g](media/1_vAmk8ulHh4OJji_X35zW4g.png)

![1\_ru8KwJ6DZWXgJm1tm\_Sw\_Q](media/1_ru8KwJ6DZWXgJm1tm_Sw_Q.png)

The second image labels each control-point view's variable name (L3, L2, and so on).

When the finger lifts, we kick off a spring animation that returns every control point to its starting position with a bouncy feel. While the views are animating, we have to recompute the bezier path on every frame. That's a job for CADisplayLink — it ticks once per frame on the main runloop and runs whatever selector you give it.

> A CADisplayLink object is a timer object that allows your application to synchronize its drawing to the refresh rate of the display. - Apple doc

Let's code.

------------------------------------------------------------------------

### Build

Create a single-view controller and paste the following into the class body of `viewController.swift`:

``` text
// MARK: -
// MARK: Vars

private let minimalHeight: CGFloat = 50.0  
private let shapeLayer = CAShapeLayer()

// MARK: -

override func loadView() {  
    super.loadView()

    shapeLayer.frame = CGRect(x: 0.0, y: 0.0, width: view.bounds.width, height: minimalHeight)
    shapeLayer.backgroundColor = UIColor(red: 57/255.0, green: 67/255.0, blue: 89/255.0, alpha: 1.0).CGColor
    view.layer.addSublayer(shapeLayer)

    view.addGestureRecognizer(UIPanGestureRecognizer(target: self, action: "panGestureDidMove:"))
}

// MARK: -
// MARK: Methods

func panGestureDidMove(gesture: UIPanGestureRecognizer) {  
    if gesture.state == .Ended || gesture.state == .Failed || gesture.state == .Cancelled {

    } else {
        shapeLayer.frame.size.height = minimalHeight + max(gesture.translationInView(view).y, 0)
    }
}

override func preferredStatusBarStyle() -> UIStatusBarStyle {  
    return .LightContent
}
```

A quick rundown of what just happened:

1.  Declared two properties: `shapeLayer` and `minimalHeight`. The former represents the bezier path; the latter defines `shapeLayer`'s minimum height.
2.  Added `shapeLayer` to the view's layer.
3.  Added a pan gesture recogniser to the view, with `panGestureDidMove` as the target. As the finger moves, we update `shapeLayer`'s height.
4.  Overrode `preferredStatusBarStyle` to clean up the look.

Build and run. You should see something like this:

![1\_XNtBBQ6VX2vU30VxX-5R6](media/1_XNtBBQ6VX2vU30VxX-5R6w.gif)

Almost what we want — except `shapeLayer`'s height changes with a slight lag (an implicit animation). We don't want that. Before adding `shapeLayer` to the view's sublayers, disable implicit animations for `position`, `bounds`, and `path`:

``` text
shapeLayer.actions = ["position" : NSNull(), "bounds" : NSNull(), "path" : NSNull()]  
```

Run again, and the lag is gone.

![1\_lSWR6zbrMJSVDEvqFAaNAQ](media/1_lSWR6zbrMJSVDEvqFAaNAQ.gif)

Next, we add the control points (L3, L2, L1, C, R1, R2, R3) and the necessary logic.

One step at a time:

- First, declare a `maxWaveHeight` — purely so the final effect looks nicer. Without a cap, it gets ugly.

``` text
private let maxWaveHeight: CGFloat = 100.0  
```

- Declare a view for each control point:

``` text
private let l3ControlPointView = UIView()  
private let l2ControlPointView = UIView()  
private let l1ControlPointView = UIView()  
private let cControlPointView = UIView()  
private let r1ControlPointView = UIView()  
private let r2ControlPointView = UIView()  
private let r3ControlPointView = UIView()  
```

- Size each control-point view at 3×3, set the background colour to red so we can see what's happening (we'll hide them later), and add them as subviews. Paste this at the end of `loadView`:

``` text
l3ControlPointView.frame = CGRect(x: 0.0, y: 0.0, width: 3.0, height: 3.0)  
l2ControlPointView.frame = CGRect(x: 0.0, y: 0.0, width: 3.0, height: 3.0)  
l1ControlPointView.frame = CGRect(x: 0.0, y: 0.0, width: 3.0, height: 3.0)  
cControlPointView.frame = CGRect(x: 0.0, y: 0.0, width: 3.0, height: 3.0)  
r1ControlPointView.frame = CGRect(x: 0.0, y: 0.0, width: 3.0, height: 3.0)  
r2ControlPointView.frame = CGRect(x: 0.0, y: 0.0, width: 3.0, height: 3.0)  
r3ControlPointView.frame = CGRect(x: 0.0, y: 0.0, width: 3.0, height: 3.0)

l3ControlPointView.backgroundColor = .redColor()  
l2ControlPointView.backgroundColor = .redColor()  
l1ControlPointView.backgroundColor = .redColor()  
cControlPointView.backgroundColor = .redColor()  
r1ControlPointView.backgroundColor = .redColor()  
r2ControlPointView.backgroundColor = .redColor()  
r3ControlPointView.backgroundColor = .redColor()

view.addSubview(l3ControlPointView)  
view.addSubview(l2ControlPointView)  
view.addSubview(l1ControlPointView)  
view.addSubview(cControlPointView)  
view.addSubview(r1ControlPointView)  
view.addSubview(r2ControlPointView)  
view.addSubview(r3ControlPointView)  
```

- Add a UIView extension just above the ViewController declaration:

``` text
extension UIView {  
    func dg_center(usePresentationLayerIfPossible: Bool) -> CGPoint {
        if usePresentationLayerIfPossible, let presentationLayer = layer.presentationLayer() as? CALayer {
            return presentationLayer.position
        }
        return center
    }
}
```

- When a UIView animates from one frame to another, reading `UIView.frame` or `UIView.center` gives you the final value, not the per-frame in-between value. So we need a helper that returns the live position from `UIView.layer.presentationLayer` instead.

> More on `presentationLayer` in the [official docs](https://developer.apple.com/library/ios/documentation/GraphicsImaging/Reference/CALayer_class/#//apple_ref/occ/instm/CALayer/presentationLayer).

- Declare `currentPath()`:

``` text
private func currentPath() -> CGPath {  
    let width = view.bounds.width

    let bezierPath = UIBezierPath()

    bezierPath.moveToPoint(CGPoint(x: 0.0, y: 0.0))
    bezierPath.addLineToPoint(CGPoint(x: 0.0, y: l3ControlPointView.dg_center(false).y))
    bezierPath.addCurveToPoint(l1ControlPointView.dg_center(false), controlPoint1: l3ControlPointView.dg_center(false), controlPoint2: l2ControlPointView.dg_center(false))
    bezierPath.addCurveToPoint(r1ControlPointView.dg_center(false), controlPoint1: cControlPointView.dg_center(false), controlPoint2: r1ControlPointView.dg_center(false))
    bezierPath.addCurveToPoint(r3ControlPointView.dg_center(false), controlPoint1: r1ControlPointView.dg_center(false), controlPoint2: r2ControlPointView.dg_center(false))
    bezierPath.addLineToPoint(CGPoint(x: width, y: 0.0))

    bezierPath.closePath()

    return bezierPath.CGPath
}
```

This returns `shapeLayer`'s current `CGPath`, built from the control points we just defined.

- Declare `updateShapeLayer`:

``` text
func updateShapeLayer() {  
    shapeLayer.path = currentPath()
}
```

This gets called whenever `shapeLayer` needs to be updated. It isn't a private func because we'll wire it to CADisplayLink via `Selector()`.

- Declare `layoutControlPoints`:

``` text
private func layoutControlPoints(baseHeight baseHeight: CGFloat, waveHeight: CGFloat, locationX: CGFloat) {  
    let width = view.bounds.width

    let minLeftX = min((locationX - width / 2.0) * 0.28, 0.0)
    let maxRightX = max(width + (locationX - width / 2.0) * 0.28, width)

    let leftPartWidth = locationX - minLeftX
    let rightPartWidth = maxRightX - locationX

    l3ControlPointView.center = CGPoint(x: minLeftX, y: baseHeight)
    l2ControlPointView.center = CGPoint(x: minLeftX + leftPartWidth * 0.44, y: baseHeight)
    l1ControlPointView.center = CGPoint(x: minLeftX + leftPartWidth * 0.71, y: baseHeight + waveHeight * 0.64)
    cControlPointView.center = CGPoint(x: locationX , y: baseHeight + waveHeight * 1.36)
    r1ControlPointView.center = CGPoint(x: maxRightX - rightPartWidth * 0.71, y: baseHeight + waveHeight * 0.64)
    r2ControlPointView.center = CGPoint(x: maxRightX - (rightPartWidth * 0.44), y: baseHeight)
    r3ControlPointView.center = CGPoint(x: maxRightX, y: baseHeight)
}
```

What each variable does:

1.  `baseHeight` — the base height. `baseHeight + waveHeight` is the total height we want.
2.  `waveHeight` — the height of the wave. `maxWaveHeight` is its cap.
3.  `locationX` — the finger's X coordinate inside the view.
4.  `width` — the view's width. Self-explanatory.
5.  `minLeftX` — the minimum X for `l3ControlPointView`. Can be negative.
6.  `maxRightX` — the mirror of `minLeftX`: the maximum X for `r3ControlPointView`.
7.  `leftPartWidth` — distance from `minLeftX` to `locationX`.
8.  `rightPartWidth` — distance from `locationX` to `maxRightX`.

Why these specific numbers for positioning the control points? Simple: I used PaintCode to draw the bezier curve, tweaked until it looked right, and then plugged the resulting numbers into the code.

- Update `panGestureDidMove` so the control points move when the finger moves. Replace the body with:

``` text
func panGestureDidMove(gesture: UIPanGestureRecognizer) {  
    if gesture.state == .Ended || gesture.state == .Failed || gesture.state == .Cancelled {

    } else {
        let additionalHeight = max(gesture.translationInView(view).y, 0)

        let waveHeight = min(additionalHeight * 0.6, maxWaveHeight)
        let baseHeight = minimalHeight + additionalHeight - waveHeight

        let locationX = gesture.locationInView(gesture.view).x

        layoutControlPoints(baseHeight: baseHeight, waveHeight: waveHeight, locationX: locationX)
        updateShapeLayer()
    }
}
```

We compute the wave height, base height, and finger location, then call `layoutControlPoints` and `updateShapeLayer`.

- Add two lines at the end of `loadView` so things look right at launch:

``` text
layoutControlPoints(baseHeight: minimalHeight, waveHeight: 0.0, locationX: view.bounds.width / 2.0)  
updateShapeLayer()  
```

- Change

``` text
shapeLayer.backgroundColor = UIColor(red: 57/255.0, green: 67/255.0, blue: 89/255.0, alpha: 1.0).CGColor  
```

to

``` text
shapeLayer.fillColor = UIColor(red: 57/255.0, green: 67/255.0, blue: 89/255.0, alpha: 1.0).CGColor  
```

It should look like this now:

![1\_8IP7zFTjhgZMO6HSR1GETg](media/1_8IP7zFTjhgZMO6HSR1GETg.gif)

The last thing to wire up: the spring-back animation when the finger lifts.
Step by step:

- Declare `displayLink`:

``` text
private var displayLink: CADisplayLink!
```

Initialise it at the end of `loadView`:

``` text
displayLink = CADisplayLink(target: self, selector: Selector("updateShapeLayer"))  
        displayLink.addToRunLoop(NSRunLoop.mainRunLoop(), forMode: NSDefaultRunLoopMode)
        displayLink.paused = true
```

As mentioned earlier, the CADisplayLink fires every frame and calls the specified selector (`updateShapeLayer`), which lets us update `shapeLayer.path` in real time during the UIView animation.

- Declare `animating`:

``` text
private var animating = false {  
    didSet {
        view.userInteractionEnabled = !animating
        displayLink.paused = !animating
    }
}
```

This toggles user interaction and pauses or resumes the display link. (You don't want the user gesturing mid-animation and breaking the effect.)

``` text
private func currentPath() -> CGPath {  
    let width = view.bounds.width

    let bezierPath = UIBezierPath()

    bezierPath.moveToPoint(CGPoint(x: 0.0, y: 0.0))
    bezierPath.addLineToPoint(CGPoint(x: 0.0, y: l3ControlPointView.dg_center(animating).y))
    bezierPath.addCurveToPoint(l1ControlPointView.dg_center(animating), controlPoint1: l3ControlPointView.dg_center(animating), controlPoint2: l2ControlPointView.dg_center(animating))
    bezierPath.addCurveToPoint(r1ControlPointView.dg_center(animating), controlPoint1: cControlPointView.dg_center(animating), controlPoint2: r1ControlPointView.dg_center(animating))
    bezierPath.addCurveToPoint(r3ControlPointView.dg_center(animating), controlPoint1: r1ControlPointView.dg_center(animating), controlPoint2: r2ControlPointView.dg_center(animating))
    bezierPath.addLineToPoint(CGPoint(x: width, y: 0.0))

    bezierPath.closePath()

    return bezierPath.CGPath
}
```

Updated `currentPath` — `dg_center` now takes `animating` so we only read the presentation-layer's intermediate values while the animation is running.

- Last step: update the if branch in `panGestureDidMove`:

``` text
if gesture.state == .Ended || gesture.state == .Failed || gesture.state == .Cancelled {  
    let centerY = minimalHeight

    animating = true
    UIView.animateWithDuration(0.9, delay: 0.0, usingSpringWithDamping: 0.57, initialSpringVelocity: 0.0, options: [], animations: { () -> Void in
        self.l3ControlPointView.center.y = centerY
        self.l2ControlPointView.center.y = centerY
        self.l1ControlPointView.center.y = centerY
        self.cControlPointView.center.y = centerY
        self.r1ControlPointView.center.y = centerY
        self.r2ControlPointView.center.y = centerY
        self.r3ControlPointView.center.y = centerY
        }, completion: { _ in
            self.animating = false
    })
} else {
    let additionalHeight = max(gesture.translationInView(view).y, 0)

    let waveHeight = min(additionalHeight * 0.6, maxWaveHeight)
    let baseHeight = minimalHeight + additionalHeight - waveHeight

    let locationX = gesture.locationInView(gesture.view).x

    layoutControlPoints(baseHeight: baseHeight, waveHeight: waveHeight, locationX: locationX)
    updateShapeLayer()
}
```

We've added a spring animation on UIView so the control points bounce back to their starting positions. Tweak the numbers above to taste.

Run it on a device and enjoy the effect:

![1\_i67gfk96fveNB1yQqj9Lc](media/1_i67gfk96fveNB1yQqj9Lcw.gif)

You probably don't want the red dots in production. Remove the frame/background-colour code for the control-point views from `loadView`.

Run again:

![1\_jsDkgFaoAtyIljyBukq1Ug](media/1_jsDkgFaoAtyIljyBukq1Ug.gif)

Looks great — but in this example we only update the `path`, not the `shapeLayer`'s height. That's not perfect. Fixing it is a good exercise for you. Mess with the frame, path, and any of the variables.

> Demo source: [here](https://github.com/gontovnik/DGElasticBounceTutorial)
> [DGElasticPullToRefresh](https://github.com/gontovnik/DGElasticPullToRefresh) source here
