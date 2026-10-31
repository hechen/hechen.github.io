---
title: 'TensionRadar 1.3：一周的数据，也包括空缺'
slug: 'tensionradar-week-in-review'
date: 2026-10-30T23:00:00-07:00
draft: false
description: '每周回顾把不同的 HRV 指标分开，先交代有几天记录，再比较两周的变化。'
categories: ['apps']
tags: ['TensionRadar', 'iOS', 'HealthKit']
---

[TensionRadar 1.3.0 已经上架](https://apps.apple.com/us/app/tensionradar/id6753273426)。趋势页多了一张「每周回顾」卡片，汇总今天之前七个完整自然日的数据，并和再往前的一周放在一起看。

SDNN、RMSSD 和静息心率各算各的平均值，也各自标出有记录的天数。两种 HRV 统计不会混在一起；有 SDNN 记录，也不会拿来填 RMSSD 的空缺。

没有记录的日子就留空，不补成零，也不推算一个数。算一周的平均值时，每个有记录的日均值权重相同，不会因为某天测得多，就让那天占更大比重。今天还没过完，先不算进去。

同一指标在两周里都至少有三天记录，才显示变化量。这只是决定什么时候显示对比的数据覆盖规则，不代表统计显著，也不能据此判断健康变好了。卡片汇总的是已有测量，不是心情。

这一版也把测得心率和静息心率放在一起，iPhone、Apple Watch 和心率小组件里的解释更一致。「每周回顾」本身在 iPhone App 的趋势页里。

[下载 TensionRadar](https://apps.apple.com/us/app/tensionradar/id6753273426)
