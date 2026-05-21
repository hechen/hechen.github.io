---
title: 'My reading workflow'
slug: 'reading-process'
date: 2018-10-16T17:01:44+00:00
draft: false
categories: ['ios', 'productivity', 'translation']
tags: ['app', 'compiler', 'devonthink', 'iap', 'ios', 'ir', 'llvm', 'mac', 'marginnote', 'pdfexpert', 'receipt', 'singleton', 'swift', 'xcode']
---

I've been tightening up my reading workflow lately, so here's an update. The tools involved:

1.  DEVONThink Pro
2.  PDFExpert
3.  MarginNote

(1) is the inbox and archive; (3) is the output. The whole thing looks roughly like this:

![Reading Process](https://i.imgur.com/SrcVtP1.png)

## Capturing

When I'm browsing the web and stumble across an article I want to mark up or take notes on, there are a few options:

1.  Clip the page straight into Evernote and read/annotate it there.
2.  Push it to a read-later service like Pocket or Instapaper.
3.  Use Safari's built-in "Save as PDF", then open it in a separate PDF tool.

Over the last few months, MarginNote 3 came out, and its auto-generated outline mind maps give me a really convenient way to break a long article apart — so I've started funnelling everything I read into a single pipeline.

The Clip To DEVONthink browser extension makes it painless to file articles into DEVONthink. The big win is that it saves a WebArchive, so even if the original article disappears later, I still have it.

![Clip To DEVONthink](https://i.imgur.com/Kw7CoBl.png)

Hit Cmd+S and the page lands in the right DEVONthink group with the original preserved.

![DEVONthink](https://i.imgur.com/m3jM9kx.png)

WebArchives can't be highlighted, though — so that's where DEVONthink's OCR comes in. I use it to convert the WebArchive into a PDF.

![WebArchive To PDF](https://i.imgur.com/YxEsN2G.png)

## Cleaning up

Once DEVONthink has spat out a PDF, you can read it right there in the built-in PDF viewer — it's perfectly capable. But I want to read in MarginNote, so I'll send the PDF over there instead.

In practice, I usually take one extra step first: I run the PDF through PDF Expert to crop it, because most web pages have absurdly generous left/right margins that I'd rather lose.

![PDF With Margin](https://i.imgur.com/8I8UcFY.png)

Trim that fat and the PDF is dramatically more readable.

![Final PDF](https://i.imgur.com/1CwG33x.png)

## Reading and output

Now I can pull the document into MarginNote:

![MarginNote Import](https://i.imgur.com/DmADrxk.png)

Hit **Add to Study** and MarginNote will roll my highlights and notes into a notebook. The killer feature is that it pulls the highlighted bits into a connected mind map automatically, and you can still attach your own notes to any specific section.

![MarginNote Add To Study](https://i.imgur.com/9uvu95H.png)

A lot of the time, reading one article sends me down a rabbit hole — I'll chase the references at the bottom, which are usually on the same topic, and I want all those related articles to end up in the same notebook. MarginNote handles this beautifully. For example, while I was reading Apple's URL Session Programming Guide I pulled in a bunch of related pieces and kept all the notes together.

![MarginNote Note Group](https://i.imgur.com/kIvn6v8.png)

I've set up a dedicated folder in MarginNote called **Article** just for the things I capture out of DEVONthink. Once I'm done reading, I can archive the notes — MarginNote can share to Evernote, Word, or back into DEVONthink.

![Export](https://i.imgur.com/yyQ3pOr.png)

That closes the loop: capture → process → read → output, all in one pipeline.

All three tools have iOS apps, so I don't have to break the flow when I'm on my phone. The catch is that DEVONthink for iOS can't convert WebArchives to PDF — that step still has to happen on the Mac. But because capture and output both work on mobile, I can grab anything interesting wherever I am, drop it into the read-later list, let it sync to the Mac for processing, and then pick it up in MarginNote for iOS. At home I usually do my reading on the iPad Pro and the experience is great.

![iPad MarginNote](https://i.imgur.com/ZJsdxyS.jpg)
