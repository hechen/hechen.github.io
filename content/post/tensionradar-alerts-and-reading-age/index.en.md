---
title: 'TensionRadar 1.3.1: the score and the alert'
slug: 'tensionradar-alerts-and-reading-age'
date: 2026-11-01T23:00:00-08:00
draft: false
description: 'Tension alerts use the Radar score you see, while the Watch makes measurement age clearer and charts mark gaps in the data.'
categories: ['apps']
tags: ['TensionRadar', 'iOS', 'watchOS']
---

[TensionRadar 1.3.1 is available on the US App Store](https://apps.apple.com/us/app/tensionradar/id6753273426). This update brings the automatic alert threshold into line with the Radar score shown in the app.

Previously, an HRV-based alert required both the combined Radar score and its HRV component to cross the selected threshold. That second check was not apparent from the setting. Now the selected threshold applies to the combined score, including when checking the preceding reading.

One high reading still does not suffice. The HRV alert path needs two consecutive qualifying measurements of the same HRV statistic, with resting-state evidence. Freshness, confidence, alert hours and the interval between alerts still apply. Changing which score is checked does not validate the score as a measure of emotion.

The Watch dashboard has also been reworked, and complications make the HRV value and time since measurement easier to read. Charts use dotted segments to identify gaps in recorded data. Watch-to-iPhone updates and notification troubleshooting have been improved too.

These are still occasional measurements arriving through Apple Health. A notification test checks presentation; it does not prove that a future health reading will produce an alert. Background updates and notification timing remain subject to the system.

[Get TensionRadar](https://apps.apple.com/us/app/tensionradar/id6753273426)
