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

The updated build prepares all required conversions in the background before activating the new currency. It saves the completed result once, so scrolling reuses prepared amounts. You can cancel preparation or choose a different currency without changing the current collection. Original purchase amounts, currencies, photos and use records stay intact.

Latest reference rates refresh automatically once a day, or when you tap Refresh. Saved historical purchase and sale rates are reused. The currency controls explain this schedule.

Validation uses an isolated copy of a real collection with 792 items and 679 photos. Release-build checks passed in the iPhone simulator, including cancellation, switching currencies, scrolling, manual refresh and cache reuse after restarting. Each new currency produced one completed collection update, and browsing produced none. Physical iPhone smoothness still needs verification.

[Explore Keeps](https://getkeepsapp.com/) or see the [current App Store version](https://apps.apple.com/app/id6811795155).
