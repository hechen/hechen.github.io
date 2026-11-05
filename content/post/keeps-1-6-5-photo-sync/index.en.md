---
title: 'Keeps 1.6.5: a fix for stalled photo sync'
slug: 'keeps-1-6-5-photo-sync'
date: 2026-11-02T22:58:59-08:00
lastmod: 2026-11-04T23:00:00-08:00
draft: false
description: 'Keeps fixes an iCloud photo sync stall, cuts repeated work in Overview, and improves Restore Purchases.'
categories: ['apps']
tags: ['Keeps', 'iCloud', 'iOS', 'iPadOS']
---

[Keeps 1.6.5 is out for iPhone and iPad](https://apps.apple.com/us/app/keeps-cost-per-use-tracker/id6811795155). It fixes a case where photo syncing could stall after edits to the same item on two devices.

When two saves conflict, iCloud can tell Keeps that the copy on the server has a photo without sending the photo file in the conflict response. Keeps now fetches that copy before resolving the conflict, so it can read the actual photo.

I also cut some repeated work when you open Overview again. Keeps reuses the summary until the underlying data changes, and the photo cache keeps a running count of its size without scanning the entire cache on every write.

Restore Purchases now checks whether Apple already reports a verified Keeps Pro purchase before requesting a fresh sync.

## November 4 update: Keeps 1.6.6

[Keeps 1.6.6 is now available for iPhone and iPad](https://apps.apple.com/us/app/keeps-cost-per-use-tracker/id6811795155). It fixes a crash when opening iCloud settings on some iOS versions. When reviewing a purchase imported from a website, you can also return to the page without losing your edits.
