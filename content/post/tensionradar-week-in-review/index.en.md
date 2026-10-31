---
title: 'TensionRadar 1.3: a week, with the gaps'
slug: 'tensionradar-week-in-review'
date: 2026-10-30T23:00:00-07:00
draft: false
description: 'Week in Review keeps HRV metrics separate and shows how many days actually have data before comparing two weeks.'
categories: ['apps']
tags: ['TensionRadar', 'iOS', 'HealthKit']
---

[TensionRadar 1.3.0 is on the App Store](https://apps.apple.com/us/app/tensionradar/id6753273426). Trends now has a Week in Review card: a summary of the seven complete days before today, alongside the preceding week.

SDNN, RMSSD and resting heart rate each get their own average and recorded-day count. The two HRV statistics stay separate. Having SDNN readings does not fill a gap in RMSSD.

Missing days remain missing. They do not become zeroes or estimated readings. Each recorded day's average has equal weight, so a day with more measurements does not dominate the week. Today stays out because it is still incomplete.

A change between weeks appears only when each week has at least three recorded days for that metric. That is a display rule for data coverage, not a test of statistical significance or evidence that health improved. The card summarizes recorded measurements; it does not measure mood.

This release also puts measured heart rate beside resting heart rate, with clearer explanations across the iPhone app, Watch and heart-rate widgets. The weekly summary is in the iPhone app's Trends view.

[Get TensionRadar](https://apps.apple.com/us/app/tensionradar/id6753273426)
