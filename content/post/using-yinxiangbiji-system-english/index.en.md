---
title: 'Using Yinxiangbiji in Safari on an English-language macOS'
slug: 'using-yinxiangbiji-system-english'
date: 2019-03-13T00:30:49+08:00
draft: false
categories: ['macos', 'productivity', 'rxswift']
tags: ['2do', 'app', 'backgroundcolor', 'bookmark', 'evernote', 'mac', 'macos', 'nsview', 'omnifocus', 'safari', 'sandbox', 'shadowsocks', 'subject', 'things', 'traffic', 'variable', '印象笔记']
---

> Evernote runs a separate account system in China — Yinxiangbiji (印象笔记) — and last year the team there spun off entirely. But the Safari Web Clipper is still the same extension ([download here](https://safari-extensions.apple.com/details/?id=com.evernote.safari.clipper-Q79WDW8YH9)). The awkward part: if your system language is English, there's no obvious way to sign in to your Yinxiangbiji account from the clipper. This post is a note on how to work around it.

By default Safari doesn't show the Develop menu, so the first step is to enable it. Open Safari's Preferences, go to the Advanced tab, and tick the checkbox at the bottom as shown.

![Capto\_Capture 2019-03-13\_12-39-08\_A](https://i.imgur.com/J5HvXn1.png)

Now the Develop menu shows up in Safari's top menu bar:

![Capto\_Capture 2019-03-13\_12-40-57\_A](https://i.imgur.com/OxPf4Ji.png)

After you install the Evernote clipper extension and click its button in Safari, you'll find it sends you straight to the Evernote login page — there's no entry point for Yinxiangbiji. Even if you're already signed in to Yinxiangbiji in Safari, the session and cookies don't help here.

![Capto\_Capture 2019-03-13\_12-50-48\_A](https://i.imgur.com/gVTWCOc.png)

So sign in with an international Evernote account. If you don't have one, register one. The point is you need to be logged in so that the clipper UI is actually displayed.

Once signed in, open any page and trigger the clipper. Now you can finally see the clipping menu:

![Capto\_Capture 2019-03-13\_12-52-36\_A](https://i.imgur.com/VtvROcP.png)

![Capto\_Capture 2019-03-13\_12-53-45\_A](https://i.imgur.com/LsitsxG.png)

Click Options at the bottom to open the settings panel.

![Capto\_Capture 2019-03-13\_12-56-16\_A](https://i.imgur.com/KpQefZc.png)

Now, because we enabled the Develop menu earlier, you can right-click the panel.

![Capto\_Capture 2019-03-13\_12-58-02\_A](https://i.imgur.com/ylecnyS.png)

Click Inspect Element to open the element inspector. With the elements pane focused, hit Command+F and search for **DeveloperContainer**.

![Capto\_Capture 2019-03-13\_12-59-28\_A](https://i.imgur.com/0DSMO39.png)

![Capto\_Capture 2019-03-13\_01-02-18\_A](https://i.imgur.com/t3uqMa4.png)

You can guess what's going on: this panel hides some developer options behind `display:none`. Just delete the `display:none` — double-click to select it and remove it.

You'll see the div contains several more divs (developer-only options, hidden from the normal UI). They're hidden via `style="display:none;"` — a CSS rule that hides everything inside. Delete it and press Enter.

The Yinxiangbiji clipper extension up top refreshes, and the previously hidden options appear:

![Capto\_Capture 2019-03-13\_01-05-31\_A](https://i.imgur.com/95qql8h.png)

The Developer Options form is now visible, and a bit further down there's an option called `Simulate Simplified Chinese`. Tick that checkbox. The clipper will automatically log out of the current Evernote account. Click the clipper button again and it'll trigger the Yinxiangbiji login flow — the URL will switch into the `https://app.yinxiang.com` domain.

![Capto\_Capture 2019-03-13\_01-10-22\_A](https://i.imgur.com/DH2DdLa.png)

Once you've signed in, your clipper is now using the Yinxiangbiji account.

![Capto\_Capture 2019-03-13\_01-11-52\_A](https://i.imgur.com/PXCjU4U.png)

Enjoy it.
