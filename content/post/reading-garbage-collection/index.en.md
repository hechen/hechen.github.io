---
title: 'Reading "Garbage Collection: Algorithms and Implementations"'
slug: 'reading-garbage-collection'
date: 2017-02-12T16:38:24+00:00
draft: false
categories: ['book']
tags: ['garbage-collection', 'python']
---

The book *Garbage Collection: Algorithms and Implementations* has been making the rounds recently, and since I've always been curious about how GC actually works under the hood, I've been chewing through it bit by bit. I can only say I've stumbled through most of it so far — for the implementation half I read just the Python chapter; the parts on the Dalvik VM, Rubinius, and V8 I skipped, mostly because I haven't gone deep enough on JavaScript or Ruby to make those readings worthwhile. I think you only get value out of a language's GC implementation when you also understand the language's own semantics. This post is just a summary of the main takeaways.

### Key concepts

I haven't expanded the implementation half in the mind map either — I'll come back to it once I'm more familiar with Ruby and JavaScript.

![GC algorithms](http://7xilk1.com1.z0.glb.clouddn.com/GC%e7%ae%97%e6%b3%95.png)
