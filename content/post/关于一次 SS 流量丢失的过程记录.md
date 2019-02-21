---
title: 关于一次 SS 流量丢失的过程记录
date: 2019-01-28 17:51:35
tags: ["Safari", "Traffic"]
categories: ["Mac"]
---

## 2019-01-29 更新

早上一到办公室连接上公司网络，网速直接就飚到了 600KB/s，甚至一度有过 M 的趋势，果不其然，还是 com.apple.Safari.SafeBrowsing.Service 这个服务进程。这就尴尬了，看来并不是说你不用 Safari 就不会触发。

![Surge Dashboard](https://i.imgur.com/yifgIEZ.png)

直接把 Surge 规则中的 Rule 由 Direct 改成了 Reject。


## 问题追踪

在 2018 年 12 月底的时候，一大早打开电脑查询刚买的 SS 服务。

刚刚在前几天购买的 SS 流量，每个月 150GB 的限额在短短的 4 天之内就耗了将近 95GB，就在 1 月 1 日元旦当天就耗了接近 75GB，要知道，我并不只有 AgentNEO 一家的流量服务，相对来说在 ping test 上其还不如 Shadowsocks 家的好，所以理论上规则命中也应该是后者的，而且就算我用 A 服务看小电影也不至于这么多流量消耗。

![AgentNEO 流量面板](https://i.imgur.com/9tRs9vh.png)

在最初看到这个统计数据之后，我一度怀疑是他们网站的流量统计有问题。

后续几天，我实际上对流量耗损比较关注，有一天注意到，Surge 的流量监控速率一直持续不断的显示达五六百 KB/s 的下载流量，但是我知道自己当时并没有下载任何东西。

![Surge Menu Bar](https://i.imgur.com/nWz8JAt.png)

打开 Surge Dashboard，看到如下的情形：

![Surge Dashboard](https://i.imgur.com/9kVX27V.png)

可以看到当时在持续不断的进行下载动作的进程名称是 `com.apple.Safari.SafeBrowsing.Service`，看请求地址是 safebrowsing.googleapis.com。

从进程名字来看应该是 Safari 和安全流量相关的服务，通过 Snitch 的数据库查到对其的说明：

> Safari has built-in support for Google’s Safe Browsing service to identify fraudulent and unsafe websites. Right before Safari navigates to a certain website, the website gets checked for possible security concerns using Google’s Safe Browsing online database. Accessing the online database requires connections to Google servers.

说的大概是该服务是针对 Safari 浏览器启用的，在 Safari 要帮你导航到下一级页面的时候，会识别该页面是否是欺诈🐶或者不安全⚠️的网站，我们在 Safari 的 Security 菜单中可以找到启用关于欺诈网站的检测功能的开关。以我本机上看到的内容如下

> Safari uses Tencent Safe Browsing and Google Safe Browsing to identify fraudulent websites.

大概意思就是 Safari 使用腾讯的安全浏览服务和 Google 的安全浏览服务来鉴别欺诈网站，腾讯应该是本地化的产物。

![Little Snitch Network Monitor](https://i.imgur.com/wEhv8iu.png)

通过针对该进程的出口请求 host 也可以验证这一点，该进程发起的网络请求会有如下两个 host 出口：
1. safebrowsing.googleapis.com 
2. safebrowsing.urlsec.qq.com

其实在 iOS 设备上也有同样的进程来做这件事情，抓包有时候也能捕捉到这两个请求（国行）：


![iPhone 上的 Safebrowsing](https://i.imgur.com/g9JCPdU.jpg)


而这次出问题的就是 google 提供的欺诈网站特征库。

![Little Snitch Network Monitor](https://i.imgur.com/BtfvMIV.png)


尝试关闭 Surge 作为系统流量代理之后，看到 Activity Monitor 中进程又开始了下载，如下图所示，只是连接请求主体从原来 Surge 切换到了独立进程而已（Surge 会接管网络流量，因此之前该任务的下载会算到 Surge 的头上），但是针对该 host 的下载任务一致持续不断。

> 说起来，Little Snitch Network Monitor 这款软件也是当时为了查流量丢失问题，才买的。

![Little Snitch Network Monitor](https://i.imgur.com/SUT5qQC.png)


而在我关闭 Surge 作为代理之前，可以看到该进程大概在 7 个小时之内耗了 12.4 GB 的流量。

![Little Snitch Network Monitor](https://i.imgur.com/Gnxc4bB.png)

而在网络上目前未看到针对 safebrowsing 进程的大量讨论，国内论坛 [V2EX](https://www.v2ex.com/t/404025) 里也看到有人遇到该问题。

目前暂时不清楚是官方 Bug 还是我电脑安装了什么插件或者软件导致。暂时先停掉使用 Safari 了，用 Chrome 用上一段时间之后再用 Snitch 看下情况吧。

另一方面，因为不放心，在 Surge 的自定义规则中加了一条：
	NAME,com.apple.Safari.SafeBrowsing.Service,DIRECT
	
针对该进程的所有流量都直连，不用代理了。 后续有任何进展会更新到 Blog 中。