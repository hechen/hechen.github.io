---
title: 'Using a C file in a Swift Framework: an exploration'
slug: 'swift-and-modules'
date: 2019-01-03T21:19:24+00:00
draft: false
categories: ['swift', 'translation']
tags: ['cocoapods', 'compiler', 'ios', 'ir', 'llvm', 'module', 'singleton', 'swift', 'xcode']
---

## The problem

While building a diagnostics tool, we shipped it as a single Pod containing only pure Swift code. The Swift code needed to call into a few system C library features — specifically, `resolv.h` from the system C library, which we used for DNS resolution.

Once the Pod's functionality was complete and the Example project compiled cleanly, we tried integrating into the main project — and ran into this compile error:

![Error When Compile](https://i.imgur.com/ADh0sy6.png)

The full text of the error:

``` plaintext
/Users/chen/Repos/Work/ZHDiagnosisTool/ZHDiagnosisTool/Classes/Core/Network/ZHDiagnosisTool-Network-Header.h:8:10: 
    Include of non-modular header inside framework module 'Diagnosis.ZHDiagnosisTool_Network_Header': '/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS12.1.sdk/usr/include/resolv.h'
```

Roughly: the bridging header included by the Umbrella Header pulls in a C header, but that C header itself isn't a modular header, so compilation fails. This dives straight into the Module concept that's now everywhere in the iOS ecosystem.

## A few concepts

### Modules

Modules first showed up for iOS developers in Xcode 5 — the LLVM compiler has had built-in support since then. The history is covered in detail in [WWDC 2013 Session notes — what's new in Xcode 5 and ObjC](https://onevcat.com/2013/06/new-in-xcode5-and-objc/), so I won't repeat it. In one sentence:

> Modules were introduced at the LLVM level to solve the proliferation of \#include and \#import references — and the long compile times — that plagued C/C++.

Especially since Swift came along, the Module concept should be familiar to everyone. You're probably already used to writing @import to pull in a module or one of its submodules. When you integrate with CocoaPods in particular, a lot of module work is happening under the hood — the Pods directory is full of `.modulemap` files, which I'm sure you've noticed.

A module's properties are defined by its `.modulemap` file. The syntax looks roughly like:

``` bash
module module_name [system] {
    header "header.h"
    link "linked_library"
    export *
}
```

If you're curious about the [module-map syntax](https://clang.llvm.org/docs/Modules.html#module-map-language), reading through Clang's official documentation will give you a much clearer picture of how the Module system works.

### Umbrella Header

The Umbrella Header concept was introduced alongside Frameworks. You can think of it as a single header per module that bundles all the headers you want to expose to the outside world, so users of the module don't have to import many headers manually. The concept has been on Mac for a long time; on iOS, it really shows up with the official introduction of Dynamic Frameworks in iOS 8.

Without an Umbrella Header, you have to import every public header explicitly:

``` objectivec
#import <XYZModule/XYZCustomCell.h>
#import <XYZModule/XYZCustomView.h>
#import <XYZModule/XYZCustomViewController.h>
```

With an Umbrella Header, a single import does the job:

``` objectivec
#import <XYZModule/XYZModule.h>
```

There's also the concept of an umbrella framework — if you're curious, see [Apple's docs](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPFrameworks/Concepts/FrameworkAnatomy.html#//apple_ref/doc/uid/20002253-97623-BAJJHAJC).

### Bridging-Header

A bridging header is what Apple introduced after Swift launched — a way to bridge between Swift and Objective-C in the same codebase (Mix and Match). As shown below, if you want to use Objective-C-defined types from Swift, you create a Bridging Header and import the Objective-C headers you want to expose into it.

![Bridging Header](https://i.imgur.com/YwqHEKJ.png)

The official documentation walks through this for both the [single-app-target case and the single-framework case](https://developer.apple.com/documentation/swift/imported_c_and_objective-c_apis/importing_objective-c_into_swift).

> While going through these concepts I realized I had a misconception about bridging headers. If you need to mix Objective-C and Swift in your app's main target, a Bridging Header is required. If the mixing is happening inside a single framework, a Bridging Header is *not* needed — all you have to do is add the Objective-C headers you want exposed to Swift to the Umbrella Header. I'd always been explicitly creating a Bridging Header and then including it from the Umbrella Header — which, looking back, was just double-wrapping the same headers. CocoaPods adds all public headers to the umbrella header anyway, so for development inside a single framework, the symbols get exposed to Swift even without a bridging header.

### CocoaPods

Every time you run `pod install`, if you pass `--verbose` you'll see that for each Pod that's being installed, CocoaPods runs two steps: generating the module map and generating the umbrella header. The relevant code lives in `lib/cocoapods/installer/xcode/pods_project_generator/aggregate_target_installer.rb`:

``` ruby
def install!
       UI.message "- Installing target `#{target.name}` #{target.platform}" do
       native_target = add_target
       create_support_files_dir
       create_support_files_group
       create_xcconfig_file(native_target)
       if target.host_requires_frameworks?
          create_info_plist_file(target.info_plist_path, native_target, target.version, target.platform)
            create_module_map(native_target)
          create_umbrella_header(native_target)
       elsif target.uses_swift?
          create_module_map(native_target)
                create_umbrella_header(native_target)
       end
      
     # Some Code
     # Some Code
     # Some Code      
    end
```

Pretty clearly, CocoaPods creates a module map file and an umbrella header file whenever it installs a Pod. The detailed code is in the CocoaPods source under `lib/cocoapods/generator` — specifically `module_map.rb` and `umbrella_header.rb`.

The comments at the top of each file describe what the generated file is for. `module_map.rb` describes the role of the module map:

> Generates LLVM module map files. A module map file is generated for each Pod and for each Pod target definition that is built as a framework. It specifies a different umbrella header than usual to avoid name conflicts with existing headers of the podspec.

And `umbrella_header.rb` describes the role of the umbrella header:

> Generates an umbrella header file for clang modules, which are used by dynamic frameworks on iOS 8 and OSX 10.10 under the hood. If the target is a +PodTarget+, then the umbrella header is required to make all public headers in a convenient manner available without the need to write out header declarations for every library header.

## Why the problem happens

First, why does the Example project compile but the main project fail?

Because in the main project our Pods are required to ship as dynamic frameworks, while in the Example project the `podfile` didn't specify `use_frameworks!` and we weren't producing a dynamic framework — so the problem never surfaced. In other words, this is only a problem when the module is built as a framework — more precisely, as a Dynamic Framework.

With those concepts in mind, back to our problem: we're calling system C library code from inside a framework. From Xcode's error message, we know the C header pulled in via the bridging header isn't a module, so the compiler complains.

## Working through the fix

You can certainly think, "fine, just wrap it in Objective-C, or rewrite the C code in OC entirely." But what about next time? Or when you're cleaning up a pure-Swift library? It's worth understanding why this happens so you don't fall in again.

> Objective-C's compiler does the modular-ization for you. There's a catch with the OC-wrapper option, though — you can't put the C header in an OC header, because that OC header is ultimately exposed via the Umbrella Header anyway.

First — can we tell the compiler to allow non-modular header includes inside a module?

Xcode has a build setting, `Allow Non-modular Includes In Framework Modules`, for exactly this. It doesn't apply to pure-Swift projects, and even when it does apply, it forces every translation unit that uses the framework to give up module-form header imports and fall back to flat `#include ""` style.

![Build Setting](https://i.imgur.com/S4i2chx.png)

So we have to fix this at the root: since the header we need to include should be a modular header, we have to wrap it in a module ourselves. As I dug around for solutions, I found this is the exact same problem people hit when Swift first launched — most often with `CommonCrypto`, the C library that exposes things like MD5. For years Apple hadn't modular-ized that library, so you couldn't just write `#import <CommonCrypto/CommonCrypto.h>` from Swift. A lot of workarounds appeared; this Stack Overflow thread, [Importing CommonCrypto in a Swift framework](https://stackoverflow.com/questions/25248598/importing-commoncrypto-in-a-swift-framework/37125785#37125785), has a few of them.

> Same thing applies — you can always go through Objective-C to get the same effect. But Swift was designed to leave the C baggage behind, so if you want a pure-Swift codebase without any C scent on it, there's a bit of work involved.

The root problem is defining a module for the `CommonCrypto` translation unit. As mentioned above, LLVM recognizes modules via a `modulemap` file, so we define one:

``` text
    module CommonCrypto [system] {
        header "/usr/include/CommonCrypto/CommonCrypto.h"
        export *
    }
```

You can place this modulemap anywhere the compiler can find it. Add the path to Xcode's Build Settings under Swift Compiler — Search Paths. At compile time LLVM will find the `.modulemap` and generate the module info automatically, and at that point you can use modular header imports for CommonCrypto.

A few years later Apple did modular-ize it. In the iOS SDK shipped with Xcode you can find `/usr/include/CommonCrypto/module.modulemap`:

``` text
module CommonCrypto [system] [extern_c] {
      umbrella header "CommonCrypto.h"
      export *
      module * { export * }
      
      module Error {
          header "CommonCryptoError.h"
          export *
      }
      
      module Random {
          header "CommonRandom.h"
          export *
      }
    }
```

You may also have noticed that the same directory contains many other system C libraries with their own `module.modulemap`. Here's a trimmed-down sample:

``` text
module Compression [system] [extern_c] {
    header "compression.h"
    export *
    link "compression"
}
    
module Darwin [system] [extern_c] [no_undeclared_includes] {
    // Headers that are repeatedly included, and therefore should not be
        // assigned to any given module.
        exclude header "_structs.h"
        exclude header "sys/_structs.h"
    
        // C standard library
        module C {
            textual header "assert.h"
    
          module setjmp {
                header "setjmp.h"
                export *
            }
    
            module signal {
                header "signal.h"
                export *
            }
    
            module stdio {
                header "stdio.h"
                export *
            }
    }
    
    module zlib [system] [extern_c] {
        header "zlib.h"
        export *
        link "z"
    }
    
    module SQLite3 [system] [extern_c] {
        header "sqlite3.h"
        link "sqlite3"
        explicit module Ext {
            header "sqlite3ext.h"
            export *
        }
        export *
    }
```

That's why Swift code can directly write things like `import Darwin.C.stdio`. But there are still C libraries that haven't been turned into modules — and `resolv.h`, which we needed for DNS resolution this time, is one of them.

For our case, that means defining the modulemap ourselves and figuring out how to integrate it with our existing CocoaPods setup. Since we're developing this as a Pod, the module map needs to live inside the Pod's source. For example, you can drop it at the Pod's root and configure the podspec to add its path to the Swift Search Paths. The `resolv.modulemap` looks like:

``` bash
module Resolv [system] {
    header "/usr/include/resolv.h"
    export *
}
```

Then configure the corresponding build settings in the podspec, like this:

``` ruby
s.subspec 'Core' do |core|
    core.source_files   = ['ZHDiagnosisTool/Classes/Core/**/*'] 
    core.preserve_paths = 'ZHDiagnosisTool/Classes/Core/ModuleMap'
    core.pod_target_xcconfig = {
        'SWIFT_INCLUDE_PATHS[sdk=macosx*]'           => '$(PODS_ROOT)/ZHDiagnosisTool/Classes/Core/ModuleMap',
        'SWIFT_INCLUDE_PATHS[sdk=iphoneos*]'         => '$(PODS_ROOT)/ZHDiagnosisTool/Classes/Core/ModuleMap',
        'SWIFT_INCLUDE_PATHS[sdk=iphonesimulator*]'  => '$(PODS_ROOT)/ZHDiagnosisTool/Classes/Core/ModuleMap',
      }
end
```

The catch here is the `PODS_ROOT` path. If you're doing local development, that path resolves to the temporary Pods directory CocoaPods produces after `pod install` — not the directory the original podspec lives in. Apple's official position is that they won't provide a separate environment variable just for these Local Pods. See this issue for the full discussion:

[local pod development on a project that includes libraries · Issue \#809 · CocoaPods/CocoaPods](https://github.com/CocoaPods/CocoaPods/issues/809)

As you can see in the linked thread, using `$(PODS_ROOT)` doesn't work during Local Pod development, so you'd have to manually piece together the path as suggested there. We want to avoid `PODS_ROOT` entirely and find a path that doesn't change based on the Pod's location.

In the end, we adopted the approach used in this repo:

[onmyway133/Arcane](https://github.com/onmyway133/Arcane)

The author uses a script phase in the Pod to generate the `.modulemap` on the fly, which is much more flexible.

Adapted to our needs, the script in the `.podspec` looks like:

``` bash
# Create
FRAMEWORK_DIR="${BUILT_PRODUCTS_DIR}/RESOLV.framework"
          
if [ -d "${FRAMEWORK_DIR}" ]; then
    echo "${FRAMEWORK_DIR} already exists, so skipping the rest of the script."
    exit 0
fi
          
mkdir -p "${FRAMEWORK_DIR}/Modules"
          
echo "module RESOLV [system] {
    header \"${SDKROOT}/usr/include/resolv.h\"
    export *
}" > "${FRAMEWORK_DIR}/Modules/module.modulemap"
               
    
# Generate fake header...
[ -d "${FRAMEWORK_DIR}/Headers" ] || mkdir "${FRAMEWORK_DIR}/Headers"
touch "${FRAMEWORK_DIR}/Headers/resolv.h"
    
# Soft link C header to local framework Headers
ln -sf "${SDKROOT}/usr/include/resolv.h" "${FRAMEWORK_DIR}/Headers/resolv.h"
```

Before each build, we synthesize a `Resolv.framework`: drop an empty file in `Headers/` and symlink it to the real header we want, then create a modulemap inside the framework.

We then hook the script phase into the `.podspec` so it runs before compile:

``` ruby
s.script_phase = {
    :name => 'Resolv',
    :script => script_above,
    :execution_position => :before_compile
}
```

With `Resolv.framework` acting as the bridge, Swift code can now just `import RESOLV`. The linking part can be done in one of two ways:

1.  Declare the dependency in the podspec, e.g. `core.library = "resolv"`.
2.  Link explicitly from the `.modulemap`:

``` bash
module Resolv [system] {
    header "/usr/include/resolv.h"
    link "resolv"
    export *
}
```

Putting the module map file inside the products directory also takes care of the path-resolution issue — the products folder is on the default compiler search path.

## Wrap-up

So all in all, this is what it takes to pull a system C library into a pure-Swift project (specifically a non-modular-ized one — some C libraries have already been wrapped into modules by the system). The notes here only scratch the surface; the whole compile toolchain is the product of years of evolution, and I've barely outlined some of the concepts. If you find any of this interesting, dig into the source materials and try it yourself.

## References

1.  [Modules](http://llvm.org/devmtg/2012-11/Gregor-Modules.pdf)
2.  [LLVM — Wikipedia](https://zh.wikipedia.org/wiki/LLVM)
3.  [Modules — Clang 8 documentation](https://clang.llvm.org/docs/Modules.html#introduction)
4.  [WWDC 2013 Session notes — what's new in Xcode 5 and ObjC](https://onevcat.com/2013/06/new-in-xcode5-and-objc/)
5.  [Importing CommonCrypto in a Swift framework](https://stackoverflow.com/questions/25248598/importing-commoncrypto-in-a-swift-framework/37125785#37125785)
6.  [Adding CommonCrypto to custom Swift framework \| Apple Developer Forums](https://forums.developer.apple.com/thread/46477)
7.  [How to call C code from Swift — The.Swift.Dev.](https://theswiftdev.com/2018/01/15/how-to-call-c-code-from-swift/)
8.  [Using a C library inside a Swift framework — Swift and iOS Writing — Medium](https://medium.com/swift-and-ios-writing/using-a-c-library-inside-a-swift-framework-d041d7b701d9/)
