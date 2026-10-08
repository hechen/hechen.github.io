---
title: 'Preparing Keeps 1.4.3: scrolling after a currency change'
slug: 'keeps-1-4-3-currency-scrolling'
date: 2026-10-08T11:00:00-07:00
draft: false
description: 'Keeps 1.4.3 is in testing with a fix for slow scrolling after changing the default currency in a large collection.'
categories: ['apps']
tags: ['Keeps', 'iOS', 'iPadOS', 'macOS']
---

Keeps 1.4.3 is **in testing**. It is not yet available on the public App Store.

Changing the default currency can trigger historical exchange-rate updates for many items. In a large collection, those updates could make Collection, Overview and item details slow to scroll.

This update prepares and saves exchange-rate batches in the background. Original purchase amounts, currencies, photos and use records stay intact.

Validation uses an isolated copy of a real collection with 792 items and 679 photos. The currency-switch and scrolling checks passed in the iPhone simulator; physical iPhone smoothness still needs verification.

[Explore Keeps](https://getkeepsapp.com/) or see the [current App Store version](https://apps.apple.com/app/id6811795155).
