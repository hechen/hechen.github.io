---
title: 'Keeps 1.6.5：修复照片同步卡住的问题'
slug: 'keeps-1-6-5-photo-sync'
date: 2026-11-02T22:58:59-08:00
lastmod: 2026-11-04T23:00:00-08:00
draft: false
description: '修复 iCloud 照片同步卡住的问题，减少概览和照片缓存的重复工作，并改进恢复购买。'
categories: ['apps']
tags: ['Keeps', 'iCloud', 'iOS', 'iPadOS']
---

[Keeps 1.6.5 已在美国 App Store 上线，适用于 iPhone 和 iPad](https://apps.apple.com/us/app/keeps-cost-per-use-tracker/id6811795155)。之前在两台设备上编辑同一件物品，有时会让照片同步卡住，这一版修复了这个问题。

两次保存发生冲突时，iCloud 可能只告诉 Keeps 服务器上的记录里有照片，回复里却没有照片文件。现在 Keeps 会先取回那条记录，读到实际的照片，再处理冲突。

我也顺手减少了打开概览时的一些重复工作。数据没变，就沿用上一次算好的汇总。照片缓存也会随写入更新占用空间，不用每次都遍历缓存文件来计算总大小。

恢复购买时，Keeps 会先检查 Apple 是否已经提供了有效的 Keeps Pro 购买记录，再决定是否需要重新同步。

## 11 月 4 日更新：Keeps 1.6.6

[Keeps 1.6.6 已在美国 App Store 上线，适用于 iPhone 和 iPad](https://apps.apple.com/us/app/keeps-cost-per-use-tracker/id6811795155)。这一版修复了部分 iOS 版本打开 iCloud 设置时的崩溃。从网站导入购买记录时，也可以在确认信息的过程中返回网页，已经改好的内容会保留。
