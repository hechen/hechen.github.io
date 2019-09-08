---
title: "我们是如何创建iOS版的Guillotine菜单动画的"
date: 2015-09-01 15:52:07
categories: ["Translation"]
tags: ["iOS","Animation","Objective-C"]
---


> 原文：[How We Created Guillotine Menu Animation for iOS](https://yalantis.com/blog/how-we-created-guillotine-menu-animation/)
> 原作者 [@johnsundell](https://twitter.com/johnsundell)


你是否曾经有过这样的疑问？为什么app中几乎是清一色的**侧**边栏（sidebar），为什么不把它做成**top**Bar或者**bottom**Bar，甚至**corner**Bar呢？

本文将要谈到的就是当前导航条动画的一个新趋势。

<!-- more -->

动画很有趣，但更重要的是能发挥很大的作用，它们可以改变你思考问题的方式，使得你的产品更好用并提升的app整体的用户体验。接下来我们将要展示的是设计师**Vitaly Rubtsov**的一个非常棒的点子：

“每个设计师都有那么一刻感到无聊。因为几乎所有（对动画）的完善修补、裁剪以及规格设定都给他们留下了很少发挥想象的余地。而每当这些时候，我就会驱使自己打开Adobe After Effects软件然后创作一些比较有趣的东西。

当我开始想我要创建一个什么东西的时候，我突然有个想法，通常侧边栏都从屏幕左侧划出，同时将所有的内容都移动到右侧位置。这种传统侧边栏的实现方式太过无聊了。那如果我们将侧边栏变成上边栏会怎么样呢？它从页面的上方掉落然后以一种特别的方式呈现，听起来很棒不是吗？“

**Vitaly**设计的topBar动画由我们的iOS开发工程师**Maksym Lazebnyi**使用`swift`语言实现，并且开发者给了它一个很有趣的名字—— **Guillotine Menu**。

![Guillotine Menu Animation](https://i.imgur.com/Q2GueMC.gif)

----------

### 我们是如何开发Guillotine Menu的？   
**by Makssym Lazebnyi** 

实际上，我们的iOS团队见到过很多实现这种动画效果的方法。我们选择了其中一种方式实现，这种方式允许开发者在Storyboard中以任何方式自定义菜单。

为了实现我们的转场动画（transitioning animation），我们创建了一个UIStoryboardSegue的子类和一个自定义动画管理器（custom animation controller）。基本上这就是你实现该动画所需要做的全部工作，除非你想让它更炫酷。当然我们也确实想这样做，因此还创建了一些辅助的类。

整体上，你需要三个类以及一个`UIView`的扩展类来创建这个动画，如下所示：

- `GuillotineMenuSegue`.  该类是继承自`UIStoryboardSegue`类。我们使用它来模态显示菜单，并实现由 `GuillotineMenuTransitionAnimation`类控制的呈现动画。 `GuillotineMenuSegue`允许你为菜单添加透明度，当然本文并没有做这个工作。

- `GuillotineMenuTransitionAnimation`.  该类是为了自定义呈现  `GuillotineMenuViewController` 类中视图的动画所用。

- `GuillotineMenuViewController`. 该类是一个UIViewController的子类，存放菜单视图所用。

除此之外，我们还为UIView添加了扩展方法以便能为子视图添加约束来更好的适应父视图。
   
接下来，我们逐一对每一个类进行阐述。
     
#### GuillotineMenuSegue

这个类中没有什么特别的地方，我只提及一些关键点。

在该类重载的init方法中，我们检查目标视图控制器（destination view controller）是否遵守`GuillotineAnimationProtocol` 协议（该协议我们后面会讲到）。在重载的perform方法中我们将self设置成一个过渡动画的代理。
     
在代理方法 `animationControllerForPresentedController` 中我们使用关联对象将`GuillotineMenuSegue`的实例对象（**self**）关联到具体的将要呈现的视图控制器中，这样当menu view controller呈现在屏幕上的时候，segue实例不会被销毁。（译者注：代码如下）

``` objc
- (id <UIViewControllerAnimatedTransitioning>)animationControllerForPresentedController:(UIViewController *)presented presentingController:(UIViewController *)presenting sourceController:(UIViewController *)source
{
	// 将segue示例self关联到将要呈现的试图控制器presented中，这样确保presented生命周期内segue实例不会被释放
    objc_setAssociatedObject(presented, &key, self, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    
    return [[GuillotineTransitionAnimation alloc] initWithMode:AnimationModePresentation];
}
```
     
#### GuillotineMenuTransitionAnimation
所有的动画处理逻辑都在这个类中实现。

起初我们考虑使用 `animateWithDuration usingSpringWithDamping & initialSprintVelocity`方法，但是当我们认真考虑这个动画之后我们改变了主意。我们需要实现的菜单动画中，当菜单从上方掉落之后，需要和父视图的左侧边界发生碰撞，产生碰撞效果。而上面方法中的回弹效果会穿过左边界（spring through the border of the superview），因此我们放弃了这个实现方式，转而采用了`UIDynamicAnimator`。

为了实现我们的动画，`GuillotineMenuTransitionAnimation`类必须遵从 `UIViewControllerAnimatedTransitioning` 协议，该协议中有两个代理方法：

- transitionDuration  动画的过渡时间对我们影响不是太多，因此你可以返回任意的时间值。 

- animationDuration 当菜单开启和关闭均会调用该方法


----------

###我们如何计算动画的位置信息？
     
我们需要了解动画中每一刻的精确位置。`GuillotineMenuTransitionAnimation`类需要`GuillotineMenuViewController`提供menu button中心的坐标来做为旋转动画的锚点（anchorPoint）。另外还需要`GuillotineMenuViewController`提供一些其他属性，因此我们创建一个协议`GuillotineMenuViewController`，视图控制器通过遵守该协议返回我们所需要的几个属性。
代码如下：
    
``` Swift
 @objc protocol GuillotineAnimationProtocol: NSObjectProtocol {
      func navigationBarHeight() ->CGFloat
      func anchorPoint() ->CGPoint
      func hostTitle() ->NSString
 }
```

译者注：Objective-C版本代码如下：

``` objc
@protocol GuillotineAnimationProtocol <NSObject>
	- (CGFloat) navigationBarHeight;
	- (CGPoint) anchorPoint;
	- (NSString*) hostTitle;
@end
```

这三个方法的意义如下：
- **navigationBarHeight**  `GuillotineMenuViewController`开始显示动画的时候需要旋转90度，同时覆盖导航条（navigation bar）。我们需要将`GuillotineMenuViewController`中的视图位置设置成`CGPoint(0，navigationBarHeight)`；

- **anchorPoint** 提供我们动画的旋转轴心，这里是`GuillotineMenuViewController`中的menu button的中心位置；

- **hostTitle** 用来询问`GuillotineMenuViewController`获得主视图控制器的标题。  

----------

### 我们如何实现菜单视图的掉落以及旋转？

为了实现掉落以及旋转的动画，我们使用`UIDynamicAnimator`并为其添加四种动力行为：
 （译者注：实际上实现UIKit动力学中的推动力、吸附、碰撞以及辅助行为，详见[UIKit动力学](http://www.coderyi.com/archives/426)）
- `UIPushBehavior`  为view添加一个拖拽的力，当我们需要呈现显示动画的时候，施加到view的底部，当我们需要呈现关闭菜单的动画时，施加到view的顶部；

- `UIAttachmentBehavior` 相当于一个钉子在menu button的中心点将整个view固定住。

- `UICollisionBehavior`  我们为view的父视图（**superview**）添加了一个边界，从视图中心位置到左下角位置的长度。用以实现`GuillotineMenuViewController`在掉落路径的末端模拟碰撞效果（译者注：当菜单视图关闭而回弹到上方时，同样需要添加boundary，不过此时是在顶部，屏幕水平方向菜单视图的中心位置到其右下角位置）；

- `UIDynamicItemBehavior` 实现菜单碰撞左边界之后的回弹效果。

基本上，我们的动画是这样，首先使用`CGAffineTransformRotate`将`GuillotineMenuViewController`的view旋转正向90度，设置该view的边框位置为`CGPoint(0, navigationBarHeight)`。然后，我们将该view添加以上每一种需要使用的`UIDynamicBehavior`（UIPushBehavior、UIAttachmentBehavior、UICollisionBehavior以及UIDynamicItemBehavior）。

`UIDynamicAnimator`会使得菜单的动画持续，一直到所有附加在其上的物理作用力达到平衡。

我们通过代理协议`UIDynamicAnimatorDelegate`来告知视图控制器动画的完成情况。另外，我们还需要调用`endAppearanceTransition()`方法。

这里有一个比较棘手的地方就是设置**anchorPoint**。为了使得动画正确呈现，锚点的位置到`GuillotineMenuViewController`中视图的左边界的距离必须和锚点到顶部导航条底部之间的距离相同。而且，当设备发生旋转也需要修改锚点位置。但是`GuillotineMenuTransitionAnimation`类调用代理方法`anchorPoint()`是在`viewDidLayoutSubviews()`用之前。

因此我们将设备处于水平方向时的按钮位置进行了硬编码

译者注： 设备布局一旦发生变化，例如设备进行了旋转，便会调用`viewDidLayoutSubviews()`方法，本身我们可以在该方法中动态调整按钮位置（也就是锚点位置），可是转场动画必须在该方法调用之前取到锚点位置，因此矛盾。作者就在代码里硬编码处理布局发生变化之后菜单按钮的位置了。

#### UIViewExtension
针对UIView的简单扩展，主要是针对子视图添加约束以更好的适应父视图。代码本身就很好能够说明功能了（self explanatory），这里就不叙述了。

译者注： 针对Objective-C语言的类扩展和swift语言不同，在objc实现版本中，文件名字为UIView+ConstraintExtension.h和UIView+ConstraintExtension.m

#### Guillotine Menu View Controller

你可以继承该视图控制器或者进行任何的自定义甚至重写。唯一必须要记得是的遵守`GuillotineAnimationProtocol`协议。

----------
### 你如何才能定制该动画？

你可以用任何可能的方式来定制菜单视图！你只需要创建一个自定义的`GuillotineMenuSegue`，其中源视图控制器就是你的主视图控制器（host view controller），目标视图控制器就是你需要呈现的菜单视图控制器。

实话讲，刚开始创建这个动画的时候我自认为这是一件很简单的事情，这个过程应该也没什么挑战。可是现在我们必须承认，对于iOS开发者而言这里面还有巨大的潜力可挖。另外，我们的动画还可以作为一个简单的动画视图来使用，或者作为一个带有自定义导航条的`UINavigationViewController`的子类来使用。接下来我们计划将不断更新这项工作，力图创造一个完整的带自定义转场动画效果的`UINavigationViewController`的子类。

你可以在以下这几个位置找到我们的工程源码以及设计：

* [GitHub](https://github.com/Yalantis/GuillotineMenu)
* [Dribbble](https://dribbble.com/shots/2018249-Side-Topbar-Animation)

> 译者注：Objective-C 版本实现可以参见[GuillotineMenu-objc](https://github.com/hechen/GuillotineMenu-objc)

