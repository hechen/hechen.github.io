---
title: 'TensionRadar 1.2.1: keeping the reading and its time'
slug: 'tensionradar-1-2-1-reading-time'
date: 2026-10-24T23:00:00-07:00
draft: false
description: 'The last qualified reading keeps its original time across TensionRadar and its widgets. The scoring method and its limits are now documented too.'
categories: ['apps']
tags: ['TensionRadar', 'iOS', 'watchOS']
---

[TensionRadar 1.2.1 is on the US App Store](https://apps.apple.com/us/app/tensionradar/id6753273426). One change is small but useful: while waiting for new data, Radar keeps the last qualified reading visible, with its original measurement time. The iPhone app, Watch dashboard and Radar/score widgets use the same policy.

A reading can still be useful after it stops qualifying as current. It becomes **Last reading**. It does not describe your state now or trigger a current alert. Refreshing the app requests available Health data; it does not take a new HRV measurement or reset the age of an old one.

The [methodology page](/apps/tensionradar/how-it-works.html) now documents the released version: which measurements feed Radar, how the personal reference is built, the score formula, activity exclusions and alert rules. It also lists limitations, including incomplete separation of sleep and guided-breathing samples in the reference. The 0–100 score is an app-defined estimate; its bands and coefficients have not been clinically validated, and it cannot directly measure emotions.

The homepage is simpler, with reading details and supporting metrics side by side when unfolded on iPhone Duo. Health references are available beside metric explanations and reports.

[How TensionRadar works](/apps/tensionradar/how-it-works.html) · [Get TensionRadar](https://apps.apple.com/us/app/tensionradar/id6753273426)
