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

Build 111 shortens preparation by fetching historical rates in date ranges. If rates are unavailable, it keeps the current currency and clears preparation so you can retry. The progress and Cancel controls have their own space below the currency list.

Latest reference rates refresh automatically once a day, or when you tap Refresh. Saved historical purchase and sale rates are reused. The currency controls explain this schedule.

Validation uses an isolated copy of a real collection with 792 items and 679 photos. Device feedback exposed a stuck preparation state and overlapping controls in the previous build. Build 111 passed Release checks in the iPhone simulator for complete currency switching, cancellation, scrolling, manual refresh, restart and cache reuse. A companion collection with unavailable historical dates passed failure recovery without changing the selected currency or saved items. Subsequent iPhone feedback confirms that the scrolling issue is resolved. The new detail and calendar fixes still need physical-device acceptance.

Build 112 is in internal TestFlight testing for iPhone/iPad and Mac. It also constrains item details to the screen width and gives purchase and month labels separate rows in the punch calendar. Focused Release checks passed on the real collection in English/USD and Chinese/CNY, including rotation and larger text. Short and multi-year date ranges were checked on a smaller iPhone simulator. A separate native Mac copy passed the reported detail and calendar checks too. This is focused coverage, not a full device matrix.

[Explore Keeps](https://getkeepsapp.com/) or see the [current App Store version](https://apps.apple.com/app/id6811795155).
