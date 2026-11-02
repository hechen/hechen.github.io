---
title: 'TensionRadar 1.3.1：看到的分数，提醒用的分数'
slug: 'tensionradar-alerts-and-reading-age'
date: 2026-11-01T23:00:00-08:00
draft: false
description: '紧张提醒与 Radar 显示的分数对齐；Watch 更清楚地显示测量距今多久，图表也标出了数据空缺。'
categories: ['apps']
tags: ['TensionRadar', 'iOS', 'watchOS']
---

[TensionRadar 1.3.1 已在美国区 App Store 上架](https://apps.apple.com/us/app/tensionradar/id6753273426)。这次把自动提醒的阈值和 App 里看到的 Radar 分数对齐了。

之前，基于 HRV 的提醒要求综合 Radar 分数和其中的 HRV 分项都达到所选阈值。设置里看不出还有第二道判断。现在，阈值用于综合分数，回看前一条读数是否满足确认条件时，也使用同一个口径。

单次高分仍然不够。HRV 提醒需要同一种 HRV 指标连续两次符合条件的测量，并有静息状态依据。读数时效、置信度、提醒时段和提醒间隔等条件仍然适用。调整提醒使用哪个分数，并不意味着这个分数已经能够测量情绪。

Watch 主界面也重新整理了，表盘复杂功能更清楚地显示 HRV 数值和测量距今多久。图表用虚线段标出记录中的空缺。Watch 到 iPhone 的读数更新和通知排查也做了改进。

这些仍然是通过 Apple 健康陆续收到的测量。测试通知可以检查通知展示，但不能证明之后的健康读数一定会触发提醒。后台更新和通知时机仍受系统控制。

[下载 TensionRadar](https://apps.apple.com/us/app/tensionradar/id6753273426)
