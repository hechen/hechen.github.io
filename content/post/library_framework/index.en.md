---
title: 'Libraries and frameworks'
slug: 'library_framework'
date: 2019-04-26T00:35:30+08:00
draft: false
categories: ['macos']
tags: ['agent', 'applescript', 'backgroundcolor', 'build', 'cocoa', 'compile', 'dock', 'dockless', 'framework', 'library', 'login', 'mach-o', 'menu', 'nstask', 'nsview', 'preprocess', 'process', 'sandbox', 'xcode']
---

Most of us have a rough mental model of what a library and a framework are. This post lays out the basics — not every byte, just enough to be useful. I covered the broader compile process in [Build Process](https://hechen.xyz/post/xcode-build-system/) already.

Before getting into how libraries and frameworks get linked, it helps to understand Mach-O.

When you bring up Mach-O, the first thing to pin down is the **object file** — the intermediate file produced by compiling source code, before linking (Linux's `.o`, Windows' `.obj`). The content and structure of an object file looks an awful lot like an executable, so it usually shares the same on-disk format.

On Unix, COFF was the original object-file format. Linux later evolved ELF on top of COFF; Windows evolved PE. In a broad sense, object files and executables are nearly the same thing. On Linux they're all ELF; on Windows, PE-COFF; on iOS/macOS, they're Mach-O — short for *Mach Object* — and structurally similar to the other two.

![Object files](https://i.imgur.com/CUrWruq.png)

Here's an ELF diagram from Linux to set the scene. Different source files are split into sections by role — code, data, variables go into their own segments: text segment `_TEXT`, data segment `_DATA`, and so on.

![ELF](https://i.imgur.com/ozMscrW.jpg)

The Mach-O format (from Apple's docs) below works on the same idea: different kinds of code and data live in different sections, which are grouped into segments. Load Commands tell the loader how each segment should be loaded, where to read data from, and so on.

![Mach-O](https://i.imgur.com/8p9pwgn.png)

Let's compile a small program to an executable and look at it:

``` c
//
//  main.m
//  MachO
//
//  Created by chen he on 2019/4/22.
//  Copyright © 2019 chen he. All rights reserved.
//

#import <stdio.h>

int main(int argc, const char * argv[]) {
    printf("Hello World.\n");
    return 0;
}
```

Compile and link with the clang toolchain:

``` bash
// output the main.o
clang -c main.m
// link main.o with c lib
// default output file is a.out, you can specify another name with -o
clang main.o -Wl,`xcrun --show-sdk-path`/usr/lib/libSystem.B.tbd
```

Then open up `a.out` and `main.o` with MachOView.

> MachOView is an open-source viewer for object-file formats. It hasn't been updated in years, so some newer Load Commands aren't recognised.

![Inside a.out](https://i.imgur.com/ehG4guP.png)

And here's what the `main.o` object file looks like.

![Inside main.o](https://i.imgur.com/tOzXqC1.png)

### Library

In [this post](https://hechen.xyz/post/xcode-build-system/), I described how every source file ends up as a corresponding object file. As a project grows, you want to ship the object files for a stable component together — code that's stable shouldn't have to be recompiled every time. So you bundle all the object files of a single component into one artefact. That's the origin story of the library: a library is, at heart, a bag of object files.

A simple `ar` invocation glues `.o` files into a `.a`, and `ranlib` updates the static library's symbol index.

``` text
ar -r libfoo.a foo.o bar.o baz.o
ranlib libfoo.a
```

### Static library

The static-vs-dynamic distinction comes from how linking happens. A library that takes part in static linking is a *static library*; one that takes part in dynamic linking is a *dynamic library* (a.k.a. shared library).

A static library is just that — a collection of object files bundled together, plus an index. You can think of it as a package of `.o` files. That's the `.a` file we just produced.

Static libraries let different teams and engineers develop their own modules independently, which historically was a huge productivity boost. But they have downsides:

1.  They waste memory and disk space.
2.  They're hard to update.

Take the Hello World above: `printf`'s symbol lives in libc. If we statically link it, libc gets baked into the binary. A typical C program might take 1MB of disk/memory just for libc; run 100 such programs and you've burned ~100MB. Worse, every program has to carry its own copy of the same standard library. Not great.

The update problem is similar: because the library is linked directly into the final executable, any change to a module means recompiling, re-linking, and shipping the *entire* executable.

If a program is built from 20 modules at 1MB each, updating any one of them means re-downloading the full 20MB.

The fix for both problems is to keep modules in separate files instead of fusing them into one. Don't link the object files at build time — link them at the moment the program actually needs them. That's dynamic linking, and the resulting library is a shared (dynamically linked) library.

### Dynamic library

The big shift with dynamic linking is that the executable and its dynamic-linked object files are separate. The initial executable (the one with `main`) just carries symbol references to the dynamic library. When the program is actually running and needs one of those symbols, the linker finds the corresponding object file and resolves it on the fly.

When an update ships, you don't need to rebuild the whole executable — as long as the dynamic library's interface is stable, you ship the updated dynamic library on its own. This is especially visible on Windows.

Dynamic linking has its own issues, of course. A common one: when one of the modules a program depends on gets updated and breaks API compatibility, the program won't run. That's why an OS update sometimes makes a previously fine app crash on launch or stops a feature from working.

The other downside: because the symbols aren't right there in the executable, method calls have to first find the right dynamic library; if it isn't already in memory, it has to be loaded from disk in real time. Dynamic-library calls end up slower than statically linked ones.

On Mac/iOS, every dynamic library is loaded by `dyld`. I won't go into detail here — just the load order:

1.  First, system-level dylibs from `/usr/lib/`, e.g. `libsqlite3.dylib`, `libc++.1.dylib`...
2.  Then system-level frameworks from `/System/Library/Frameworks`, e.g. `Foundation.framework`.
3.  Then the runtime and GCD dylibs from `/usr/lib/`, e.g. `libSystem.B.dylib`, `libobjc.A.dylib`.
4.  Then any dylibs you've injected yourself, under `@executable_path/`.

For apps, the actual path is given via `@rpath` — basically a placeholder. Once your app is installed on iOS, `@rpath` resolves to the app's install path. Here's `otool -L` on the executable inside an `.ipa`, listing its dynamic-library dependencies:

``` bash
    otool -L osee2unifiedRelease.app/osee2unifiedRelease
    
    
    osee2unifiedRelease.app/osee2unifiedRelease:
        /usr/lib/libbz2.1.0.dylib (compatibility version 1.0.0, current version 1.0.5)
        /usr/lib/libc++.1.dylib (compatibility version 1.0.0, current version 400.9.4)
        /usr/lib/libiconv.2.dylib (compatibility version 7.0.0, current version 7.0.0)
        /usr/lib/libicucore.A.dylib (compatibility version 1.0.0, current version 62.1.0)
        /usr/lib/libresolv.9.dylib (compatibility version 1.0.0, current version 1.0.0)
        /usr/lib/libsqlite3.dylib (compatibility version 9.0.0, current version 274.20.0)
        /usr/lib/libxml2.2.dylib (compatibility version 10.0.0, current version 10.9.0)
        /usr/lib/libz.1.dylib (compatibility version 1.0.0, current version 1.2.11)
        /System/Library/Frameworks/AVFoundation.framework/AVFoundation (compatibility version 1.0.0, current version 2.0.0)
        /System/Library/Frameworks/Accelerate.framework/Accelerate (compatibility version 1.0.0, current version 4.0.0)
        /System/Library/Frameworks/AdSupport.framework/AdSupport (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/AudioToolbox.framework/AudioToolbox (compatibility version 1.0.0, current version 492.0.0)
        /System/Library/Frameworks/CFNetwork.framework/CFNetwork (compatibility version 1.0.0, current version 975.0.3)
        /System/Library/Frameworks/CoreFoundation.framework/CoreFoundation (compatibility version 150.0.0, current version 1560.10.0)
        /System/Library/Frameworks/CoreGraphics.framework/CoreGraphics (compatibility version 64.0.0, current version 1245.9.2)
        /System/Library/Frameworks/CoreLocation.framework/CoreLocation (compatibility version 1.0.0, current version 2245.8.12)
        /System/Library/Frameworks/CoreMotion.framework/CoreMotion (compatibility version 1.0.0, current version 2245.8.12)
        /System/Library/Frameworks/CoreSpotlight.framework/CoreSpotlight (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/CoreTelephony.framework/CoreTelephony (compatibility version 1.0.0, current version 0.0.0)
        /System/Library/Frameworks/CoreText.framework/CoreText (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/ExternalAccessory.framework/ExternalAccessory (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/Foundation.framework/Foundation (compatibility version 300.0.0, current version 1560.10.0)
        /System/Library/Frameworks/GLKit.framework/GLKit (compatibility version 1.0.0, current version 103.2.0)
        /System/Library/Frameworks/ImageIO.framework/ImageIO (compatibility version 1.0.0, current version 0.0.0)
        /System/Library/Frameworks/MediaPlayer.framework/MediaPlayer (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/MobileCoreServices.framework/MobileCoreServices (compatibility version 1.0.0, current version 935.2.0)
        /System/Library/Frameworks/OpenGLES.framework/OpenGLES (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/Photos.framework/Photos (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/QuartzCore.framework/QuartzCore (compatibility version 1.2.0, current version 1.11.0)
        /System/Library/Frameworks/Security.framework/Security (compatibility version 1.0.0, current version 58286.222.2)
        /System/Library/Frameworks/SystemConfiguration.framework/SystemConfiguration (compatibility version 1.0.0, current version 963.200.27)
        /System/Library/Frameworks/UIKit.framework/UIKit (compatibility version 1.0.0, current version 61000.0.0)
        @rpath/VideoEdit.framework/VideoEdit (compatibility version 1.0.0, current version 1.0.0)
        @rpath/VideoPlayer.framework/VideoPlayer (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/VideoToolbox.framework/VideoToolbox (compatibility version 1.0.0, current version 1.0.0)
        @rpath/ZmFFmpeg.framework/ZmFFmpeg (compatibility version 1.0.0, current version 1.0.0)
        @rpath/du.framework/du (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/Metal.framework/Metal (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/CoreMedia.framework/CoreMedia (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/WebKit.framework/WebKit (compatibility version 1.0.0, current version 606.2.104)
        /System/Library/Frameworks/Social.framework/Social (compatibility version 1.0.0, current version 87.0.0)
        /System/Library/Frameworks/Accounts.framework/Accounts (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/MessageUI.framework/MessageUI (compatibility version 1.0.0, current version 3445.100.42)
        /System/Library/Frameworks/AddressBook.framework/AddressBook (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/StoreKit.framework/StoreKit (compatibility version 1.0.0, current version 1.0.0)
        /usr/lib/libobjc.A.dylib (compatibility version 1.0.0, current version 228.0.0)
        /usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1252.200.5)
        /System/Library/Frameworks/AssetsLibrary.framework/AssetsLibrary (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/Contacts.framework/Contacts (compatibility version 0.0.0, current version 0.0.0)
        /System/Library/Frameworks/CoreData.framework/CoreData (compatibility version 1.0.0, current version 866.2.0)
        /System/Library/Frameworks/CoreImage.framework/CoreImage (compatibility version 1.0.0, current version 5.0.0)
        /System/Library/Frameworks/CoreVideo.framework/CoreVideo (compatibility version 1.2.0, current version 1.5.0)
        /System/Library/Frameworks/EventKit.framework/EventKit (compatibility version 1.0.0, current version 100.0.0)
        /System/Library/Frameworks/LocalAuthentication.framework/LocalAuthentication (compatibility version 1.0.0, current version 425.222.1)
        /System/Library/Frameworks/MapKit.framework/MapKit (compatibility version 1.0.0, current version 14.0.0)
        /System/Library/Frameworks/MetalKit.framework/MetalKit (compatibility version 1.0.0, current version 113.0.0)
        /System/Library/Frameworks/NetworkExtension.framework/NetworkExtension (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/PassKit.framework/PassKit (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/SafariServices.framework/SafariServices (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/UserNotifications.framework/UserNotifications (compatibility version 1.0.0, current version 1.0.0)
        /System/Library/Frameworks/iAd.framework/iAd (compatibility version 1.0.0, current version 1.0.0)
        @rpath/libswiftAVFoundation.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftAccelerate.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftContacts.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCore.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCoreAudio.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCoreData.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCoreFoundation.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCoreGraphics.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCoreImage.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCoreLocation.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftCoreMedia.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftDarwin.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftDispatch.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftFoundation.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftGLKit.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftMapKit.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftMediaPlayer.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftMetal.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftModelIO.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftObjectiveC.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftPhotos.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftQuartzCore.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftUIKit.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftos.dylib (compatibility version 1.0.0, current version 1000.11.42)
        @rpath/libswiftsimd.dylib (compatibility version 1.0.0, current version 1000.11.42)
```

`dyld` is open source, in case you want to read the code:

[opensource-apple/dyld](https://github.com/opensource-apple/dyld)

### Framework

In the early days of libraries, shipping a library meant handing over the `.a` plus headers — the headers were what consumers used at the source level. As modules grew to include not just code but resource files too, Apple introduced the framework concept to bundle everything an independent module needs to expose.

> A framework is a bundle (a structured directory) that contains a dynamic shared library along with associated resources, such as nib files, image files, and header files.

So a framework is, fundamentally, just a particular kind of bundle — a structured directory. It's not inherently static or dynamic. The library inside determines that: if it's a static library, it's a static framework; if it's a dynamic library, it's a dynamic framework. Apple debuted frameworks on iOS as dynamic frameworks, which is also how Xcode's framework Target template starts you off.

### Text-based .dylib stubs

Introduced in Xcode 7, with no official write-up I could find at the time, but a member of Apple staff did chime in on the developer forums:

> For those who are curious, the .tbd files are new "text-based stub libraries", that provide a much more compact version of the stub libraries for use in the SDK, and help to significantly reduce its download size.

Take `libc++`. When you link `libc++` in an iOS project, you're actually linking through `libc++.tbd`, which lives under each SDK folder:

``` text
    /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/usr/lib/libc++.tbd
```

It's plain text, so a text editor will open it:

``` bash
--- !tapi-tbd-v3

   archs:           [ i386, x86_64 ]
    uuids:           [ 'i386: A9FCC99A-209C-348E-BB79-0A29A5FCB82B', 'x86_64: 66B692F1-FA7E-3CBB-817A-73A7FE29A765' ]
    platform:        ios
    install-name:    '/usr/lib/libc++.1.dylib'
    current-version: 400.9.4
    objc-constraint: none
    exports:         
      - archs:           [ i386 ]
        symbols:         [ __ZNKSt3__18messagesIcE6do_getEiiiRKNS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE, 
                           __ZNKSt3__18messagesIcE8do_closeEi, __ZNKSt3__18messagesIwE6do_getEiiiRKNS_12basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEEE, 
                           __ZNKSt3__18messagesIwE8do_closeEi, __ZNSt3__111this_thread9sleep_forERKNS_6chrono8durationIxNS_5ratioILx1ELx1000000000EEEEE, 
                           __ZNSt3__112strstreambuf6__initEPciS1_, __ZNSt3__112strstreambufC1EPKai, 
                           __ZNSt3__112strstreambufC1EPKci, __ZNSt3__112strstreambufC1EPKhi, 
                           __ZNSt3__112strstreambufC1EPaiS1_, __ZNSt3__112strstreambufC1EPciS1_, 
                           __ZNSt3__112strstreambufC1EPhiS1_, __ZNSt3__112strstreambufC1Ei, 
                           __ZNSt3__112strstreambufC2EPKai, __ZNSt3__112strstreambufC2EPKci, 
                           __ZNSt3__112strstreambufC2EPKhi, __ZNSt3__112strstreambufC2EPaiS1_, 
                           __ZNSt3__112strstreambufC2EPciS1_, __ZNSt3__112strstreambufC2EPhiS1_, 
                           __ZNSt3__112strstreambufC2Ei, __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE3getEPci, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE3getEPcic, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE4readEPci, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE6ignoreEii, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE7getlineEPci, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE7getlineEPcic, 
                           __ZNSt3__113basic_istreamIcNS_11char_traitsIcEEE8readsomeEPci, 
                           __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEE3getEPwi, 
                           __ZNSt3__113basic_istreamIwNS_11char_traitsIwEEE3getEPwiw,
```

The file lists the symbols (functions, globals, etc.) the actual dynamic library exposes. Because macOS and iOS already ship those dylibs in their system directories, providing the full binary in the SDK would be redundant — `.tbd` is a bridge. At link time, the real system dylib gets resolved, and `install-name` tells the toolchain where it lives.

In short: `.tbd` is Apple's way of shrinking the SDK download.

So when you download Xcode, most of the dynamic libraries in its bundled SDK are `.tbd` stubs — the actual dylibs your binary loads at runtime come from the system directories on whichever OS it's running on, iOS or macOS.

# References

- [MachOView](https://github.com/gdbinit/MachOView)
- [Mach-O Executables](https://www.objc.io/issues/6-build-tools/mach-o-executables/)
- [PARSING MACH-O FILES](https://lowlevelbits.org/parsing-mach-o-files/)
