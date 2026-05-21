---
title: 'Making a "Send to 2Do" Safari bookmarklet'
slug: 'send-to-2do'
date: 2018-11-26T14:59:50+00:00
draft: false
categories: ['productivity', 'translation']
tags: ['2do', 'app', 'bookmark', 'compiler', 'devonthink', 'ios', 'ir', 'llvm', 'mac', 'marginnote', 'omnifocus', 'pdfexpert', 'safari', 'singleton', 'swift', 'things', 'xcode']
---

Drag the link below onto your Favorites Bar. The default click behaviour simulates navigation on the current page, and the destination URL is whatever you put after `javascript:window.location` — which in this case is just the target app's URL scheme.
You can look up most apps' URL schemes at [AppTalk](https://app-talk.com/).

## 2Do

[Send to 2Do](#ZgotmplZ)

Then edit the address and replace it with:

``` text
javascript:window.location='twodo://x-callback-url/add?task='+encodeURIComponent(document.title)+'&note='+encodeURIComponent(window.location)+'&action=url:'+encodeURIComponent(window.location)
```

![Change Value](https://i.imgur.com/7M0xN1g.jpg)

So really it's just a snippet of JavaScript that picks up the current page's context and hands it off to the URL scheme. Specifically:

1.  `document.title` — the page title
2.  `window.location` — the page URL

## Things

Things's URL scheme looks like this:

``` c
/// add a todo due when tomorrow
things:///add?title=iamtitle&notes=iamnotes&when=tomorrow
```

[Add a todo to Things](#ZgotmplZ)

So a Send-to-Things variant becomes:

``` javascript
javascript:window.location='things:///add?title='+encodeURIComponent(document.title)+'&notes='+encodeURIComponent(window.location)+'&when=today'
```

## OmniFocus

Same idea for OmniFocus:

``` javascript
javascript:window.location='omnifocus:///add?note='+encodeURIComponent(window.location)+'&name='+encodeURIComponent(document.title)
```

[Add a todo to OmniFocus](#ZgotmplZ)

Or just grab the pre-baked link from [OmniFocus's own page](http://people.omnigroup.com/kc/OmniFocus/SendToOmniFocusBookmarklet.html) and drag it onto the Favorites Bar.

If you can't see the Favorites Bar, click the Safari menu's View entry to enable it (called "视图" on Chinese systems).

![Favorites Bar](https://i.imgur.com/ZBqkn4Z.jpg)
