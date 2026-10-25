---
title: 'TensionRadar 1.2.1：保留读数，也保留它的时间'
slug: 'tensionradar-1-2-1-reading-time'
date: 2026-10-24T23:00:00-07:00
draft: false
description: '等待新数据时，TensionRadar 和小组件保留上次符合条件的读数及其原始时间。评分方法和局限也有了完整说明。'
categories: ['apps']
tags: ['TensionRadar', 'iOS', 'watchOS']
---

[TensionRadar 1.2.1 已在美国区 App Store 上架](https://apps.apple.com/us/app/tensionradar/id6753273426)。这次有个不大但实用的变化：等待新数据时，Radar 会保留上次符合条件的读数，同时保留原始测量时间。iPhone App、Watch 主界面和 Radar／评分小组件使用同一套规则。

一条读数不再符合「当前读数」的条件后，仍然可以供回看。它会标为**上次读数**，不代表此刻的状态，也不会触发当前提醒。刷新 App 只是请求已有的健康数据，不会发起一次新的 HRV 测量，更不会把旧读数的时间重置。

[计算方法页面](/apps/tensionradar/how-it-works.html)也已更新，说明这个已发布版本使用哪些测量、怎样建立个人基线、评分公式、活动排除规则和提醒条件。局限也列在其中，例如基线尚未完整区分睡眠和引导呼吸时的样本。0–100 分是 App 自定义的估算；分档和系数没有经过临床验证，也不能直接测量情绪。

首页做了精简，在 iPhone Duo 展开时，可以并排查看读数说明和相关指标。指标解释和报告旁也能找到健康参考资料。

[了解 TensionRadar 的计算方法（英文）](/apps/tensionradar/how-it-works.html) · [下载 TensionRadar](https://apps.apple.com/us/app/tensionradar/id6753273426)
