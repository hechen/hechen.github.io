---
title: 'LiftCoach 适配 iPhone Duo'
slug: 'liftcoach-on-iphone-duo'
date: 2026-09-25T16:30:00-07:00
draft: false
description: '抢先看 LiftCoach 在 iPhone Duo 上的样子：展开后分成两页，半折放在训练凳上免手操作，控件放进侧边栏，实时活动也适配了新的灵动岛。'
categories: ['apps']
tags: ['LiftCoach', 'iOS', 'iPhone Duo']
---

iPhone Duo 下个月发布，过去几周我一直在让 LiftCoach 为它做好准备。

{{< note >}}
以下画面来自 Xcode 27.1 中的 iPhone Duo 模拟器。iPhone Duo 适配仍在开发中，计划在设备发布时随 LiftCoach 更新一同推出。
{{< /note >}}

## 按你拿手机的方式来设计

iPhone Duo 不只是一块屏幕。合上时，它是一部屏幕比其他 iPhone 更宽、更矮的手机；展开后，它像一台小平板：可以像书一样横着拿，可以竖过来，也可以半折起来立在训练凳上。

把手机布局直接拉伸到大屏上，会浪费大部分空间。所以 LiftCoach 把每个训练界面分成两部分：隔着器械也要看清的内容，和需要点按的控件。

## 横向展开：两页

展开设备，专注模式就变成两页。左页是动作本身：动画演示、分步说明、上次练了多少，以及实时心率。右页是记录：这一组的重量和次数、记录按钮、组间计时，以及已经完成的组。训练操作放在右边缘的侧边栏里，就在拇指旁边。

<figure class="full-width-image"><img class="screen" src="/post/liftcoach-on-iphone-duo/wide-focus.jpg" alt="展开的 iPhone Duo 上的 LiftCoach 专注模式：左页是卧推演示和说明，右页是组记录，训练操作在侧边栏。" loading="lazy" decoding="async"><figcaption>横向展开的专注模式：左边看，右边记。</figcaption></figure>

训练页面也是同样的思路：左边是所有动作和各自的进度，右边完整显示当前动作。

<figure class="full-width-image"><img class="screen" src="/post/liftcoach-on-iphone-duo/wide-overview.jpg" alt="展开的 iPhone Duo 上的训练页面：左边是三个动作及完成的组数，右边是选中的动作和它的组表格。" loading="lazy" decoding="async"><figcaption>一页是整场训练，另一页是当前动作。</figcaption></figure>

## 半折立起：放在训练凳上免手操作

把它折到一半放下。上半部分像一块小屏幕立起来，在训练的位置就能看清动作演示，或者组间的倒计时。需要点按的内容都平放在下半部分：重量和次数、记录按钮、休息时间调整、跳过休息，以及下一个动作。

{{< image-pair a="/post/liftcoach-on-iphone-duo/seated-focus.jpg" a-alt="半折立起：立起的上半部分显示动作演示和说明，平放的下半部分是重量、次数和记录按钮。" b="/post/liftcoach-on-iphone-duo/seated-rest.jpg" b-alt="半折立起、组间休息时：上半部分是大号倒计时，下半部分是休息时间调整和跳过休息。" caption="半折立起：训练时看演示，休息时看倒计时。" >}}

像书一样半折时，两页会分别停在折痕两侧，需要点按的内容都不会落在折痕上。

<figure class="full-width-image"><img class="screen" src="/post/liftcoach-on-iphone-duo/book-focus.jpg" alt="像书一样半折的 iPhone Duo 上的 LiftCoach 专注模式：演示页和记录页分别停在折痕两侧。" loading="lazy" decoding="async"><figcaption>书本姿势：两页都避开折痕。</figcaption></figure>

## 合上：单手操作，控件在侧边

合上时，iPhone Duo 会把工具栏放在右边缘的一条竖栏里，LiftCoach 也用上了它。退出、完成、杠铃片计算器、动作说明和替换动作放在上方，上一个和下一个放在下方，正好在拇指的位置。组卡片和组表格可以用满整块屏幕的高度。

{{< image-pair a="/post/liftcoach-on-iphone-duo/closed-focus.jpg" a-alt="合上的 iPhone Duo 上的专注模式：组卡片占满屏幕，训练操作在侧边栏。" b="/post/liftcoach-on-iphone-duo/closed-overview.jpg" b-alt="合上的 iPhone Duo 上的训练页面：动作和组表格，完成、专注、添加动作和备注在侧边栏。" caption="合上时的专注模式和训练页面，操作都在侧边栏。" >}}

## 放得下的实时活动

训练时，LiftCoach 的实时活动会在灵动岛里显示已训练时长或组间倒计时。在 iPhone Duo 上，灵动岛位于屏幕角落：在侧边竖栏里是一个窄窄的胶囊，在时钟旁边则是一个小药丸。现在计时会根据这块空间自动调整大小，始终完整显示。

{{< image-pair size="small" a="/post/liftcoach-on-iphone-duo/live-activity-wide.jpg" a-alt="时钟上方竖直胶囊形状的 LiftCoach 实时活动，显示举重图标和 1:01。" b="/post/liftcoach-on-iphone-duo/live-activity-tall.jpg" b-alt="时钟旁边药丸形状的 LiftCoach 实时活动，显示举重图标和 2:15。" caption="侧边竖栏里和时钟旁边的实时活动。" >}}

## 接下来

离发布还有一个月。接下来要做的是：两页布局下的大字体、跨两页的旁白（VoiceOver）支持，以及在真机上测试。

LiftCoach 现已[上架 App Store](https://apps.apple.com/app/id6812929269)，支持 iPhone、iPad 和 Apple Watch。iPhone Duo 适配将通过更新推出。

[了解 LiftCoach](/apps/liftcoach/)。
