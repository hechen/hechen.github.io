---
title: 'Tracking down a Shadowsocks traffic leak'
slug: '关于一次-ss-流量丢失的过程记录'
date: 2019-01-28T17:51:35+00:00
draft: false
categories: ['macos', 'productivity', 'swift']
tags: ['2do', 'bookmark', 'cocoapods', 'module', 'omnifocus', 'safari', 'shadowsocks', 'swift', 'things', 'traffic']
---

## Update — 2019-01-29

First thing this morning, the moment I plugged into the office network the download rate shot up to 600 KB/s. Sure enough, it was that same `com.apple.Safari.SafeBrowsing.Service` process again. Awkward — turns out "just don't use Safari" doesn't stop it.

![Surge Dashboard](https://i.imgur.com/yifgIEZ.png)

I changed the rule for it in Surge from Direct to Reject.

## Tracking the issue

Around late December 2018, I happened to log in to AgentNEO to check the bandwidth balance I'd just topped up. To my surprise, the SS traffic I'd bought only days earlier had burned through nearly 95 GB in just four days — about 75 GB of it on New Year's Day alone. For context, my monthly usage typically sits below 10 GB. I'm at the office most of the day and I don't watch much YouTube in my spare time either.

![AgentNEO usage panel](https://i.imgur.com/9tRs9vh.png)

When I first saw the numbers I genuinely suspected their accounting was off.

Over the next few days I kept a close eye on it. One day I noticed Surge's menu-bar throughput meter was constantly showing 500–600 KB/s of incoming traffic, even though I knew I wasn't downloading anything.

![Surge Menu Bar](https://i.imgur.com/nWz8JAt.png)

Opening the Surge Dashboard showed this:

![Surge Dashboard](https://i.imgur.com/9kVX27V.png)

The process responsible for the steady stream of downloads was `com.apple.Safari.SafeBrowsing.Service`, and the destination was `safebrowsing.googleapis.com`.

The name suggests this is Safari's safe-browsing service. Snitch's database describes it as:

> Safari has built-in support for Google's Safe Browsing service to identify fraudulent and unsafe websites. Right before Safari navigates to a certain website, the website gets checked for possible security concerns using Google's Safe Browsing online database. Accessing the online database requires connections to Google servers.

In other words: it's Safari's mechanism for checking, just before navigation, whether a page is fraudulent or unsafe. You can find the toggle for fraudulent-site detection under Safari's Security preferences. On my machine it reads:

> Safari uses Tencent Safe Browsing and Google Safe Browsing to identify fraudulent websites.

So Safari uses both Tencent's and Google's safe-browsing services to flag fraudulent sites — the Tencent piece is presumably a localization for China.

![Little Snitch Network Monitor](https://i.imgur.com/wEhv8iu.png)

Watching the outbound hosts for this process confirms the same thing — there are two destinations:

1.  safebrowsing.googleapis.com
2.  safebrowsing.urlsec.qq.com

There's an equivalent process on iOS doing the same job — packet captures sometimes pick up these two requests on China-region iPhones too:

![safebrowsing on iPhone](https://i.imgur.com/eDNI4jk.jpg)

In my case, it was Google's fraudulent-site database that was misbehaving.

![Little Snitch Network Monitor](https://i.imgur.com/BtfvMIV.png)

I tried disabling Surge as the system proxy. Activity Monitor still showed the process downloading — just now bound directly to the process instead of going through Surge (Surge had been absorbing the traffic, which is why it had been counted against Surge before). Either way, downloads to that host kept going.

> By the way — Little Snitch Network Monitor is software I only bought because of this traffic-loss issue.

![Little Snitch Network Monitor](https://i.imgur.com/SUT5qQC.png)

Before I disabled Surge as the proxy, this one process had burned through about 12.4 GB in roughly seven hours.

![Little Snitch Network Monitor](https://i.imgur.com/Gnxc4bB.png)

I couldn't find much online discussion of the safebrowsing process. The Chinese forum [V2EX](https://www.v2ex.com/t/404025) has one thread where someone hit the same problem.

I still don't know whether it's an official bug or something on my machine triggering it. For now I've parked Safari and switched to Chrome; I'll check back with Snitch after a while.

To be safe, I also added a custom rule in Surge:

```
    NAME,com.apple.Safari.SafeBrowsing.Service,DIRECT
```

All traffic from that process now bypasses the proxy. I'll update the blog as I learn more.
