---
title: 'Modularising Xcode projects'
slug: 'modular-xcode-projects'
date: 2017-11-19T18:17:15+00:00
draft: false
categories: ['translation']
tags: ['animation', 'carthage', 'closure', 'cocoapods', 'ios', 'objective-c', 'optional', 'runtime', 'swift', 'xcode']
---

> Original: [Modular Xcode projects](https://ppinera.es/2017/09/29/modular-xcode-projects.html)
>
> Author & Copyright [@pepibumur](http://twitter.com/pepibumur)
>
> Translator: [@OgreMergO](https://twitter.com/OgreMergO)

Building a modular Xcode project takes a real understanding of project structure and the underlying concepts.

Most of the time we don't think much about the structure itself — it only starts to matter once the project grows and dependencies pile up. Even then, most projects reach for [CocoaPods](https://cocoapods.org/) to wire up dependencies, or [Carthage](https://github.com/carthage). Carthage doesn't set things up for you, but it makes it easy to reach the same outcome by adding a few entries to the project's build phases. Once the configuration gets complicated, it's easy to get confused — because we don't actually have a full grip on the elements involved in an Xcode project. Questions I get asked all the time:

- Can I use Carthage, CocoaPods, and my own custom dependency setup in the same project?
- I added a dependency, but the app crashes when the simulator launches it.
- Why do I need to embed a framework in only some targets?
- Should my framework be static or dynamic?

In this post, I'll walk through every element of an Xcode project and show how to tweak them to modularise your setup. Hopefully next time you hit one of those questions, you don't have to spend hours sifting through Stack Overflow.

### Elements

#### Target

A project is built from smaller units called *targets*. Each target contains the configuration needed to compile a specific output for a specific platform — frameworks, libraries, apps, test bundles, extensions, and so on. You can find the full list of target types [here](https://github.com/xcodeswift/xcproj/blob/master/Sources/xcproj/PBXProductType.swift). Targets can depend on each other: when target A depends on target B, B is built first so A can use its output. A target's configuration lives in a few different places:

- **Info.plist file**: holds product-specific settings — version, app name, app type, etc. Details [here](https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Introduction/Introduction.html).
- **Entitlements**: specify the app's capabilities. If the entitlements don't match what's configured on the developer portal, signing will fail.
- **Build settings**: as the name says, the settings needed to build the target. They live either on the target itself or in `.xcconfig` files. A target inherits build settings — first from the xcconfig, then from the target, then from the project.
- **Build phases**: the build pipeline is defined by build phases. New targets come with default phases (*compile sources, copy resources, etc.*), and you can add your own. For instance, a shell-script phase lets you run scripts mid-build, and those scripts can read the [build settings](http://ppinera.es/2017/09/15/modular-xcode-projects.html) Xcode exposes.

For composability and reuse, I strongly recommend defining your build settings in `.xcconfig` files. Changes to a target's configuration — build settings, build phases — get written into `.pbxproj`, a particular flavour of plist that conflicts on merge almost as a rule when you're using Git. Of course, the easiest way to update `pbxproj` is to use Xcode, which knows how to read and write it. If you want to edit `pbxproj` without Xcode, check out [Xcodeproj](https://github.com/cocoapods/xcodeproj) or [xcproj](https://github.com/swift-xcode/xcodeproj).

A target's output is either a **bundle** (an app, an extension, a test bundle) or an **intermediate product** like a library or a framework that wraps code and resources for another target to consume. You'll find these outputs under the `Products` group in the project file; if a file reference is red, there's no product yet — most likely you haven't built the target.

#### Scheme

Another piece of an Xcode project is the *scheme*. A project can have multiple schemes, and they can be shared so everyone on the team uses the same ones. Schemes spell out the configuration for each Xcode action — **run**, **test**, **profile**, **analyze**, and **archive**. In detail, they specify which targets get built, in what order, and even let you use different configurations per action.

A couple of things to know about scheme builds. When you specify which targets to build for an action, there are two cases where you don't have to spell out each target's dependencies:

1.  The dependency lives in the same project and is already listed under the target's `Build Phases` → `Target dependencies`.
2.  `Find implicit dependencies` is on.

With `Find implicit dependencies` enabled, the build process has to discover the target's dependencies and build them first. And if `Parallelize build` is on, targets with no relationship between them build in parallel — saving time.

A broken build configuration shows up as errors like `Framework XXX not found` when you compile a target. If you've ever seen one of those, check whether the scheme actually builds all of the target's dependencies.

Scheme files are plain XML at `Project.xcodeproj/xcshareddata/xcodeproj.xcscheme`, so any XML editor can tweak them.

#### Workspace

Multiple project files get composed into a *workspace*. When a project is added to a workspace:

1.  Its schemes show up in the workspace's scheme list.
2.  Projects can declare dependencies on each other (more on that below).

Like schemes, workspaces are plain XML files — easy to edit.

![How target, scheme, project, and workspace are organised within a project setup](https://i.imgur.com/wGXI5fy.png)

#### Dependencies

Every target can have dependencies — the frameworks and libraries it needs to link, which contain the source and resources to share with the target. These can be linked statically or dynamically.

**Static linking:**

- happens at compile time;
- the library's code is folded into the application binary (which grows the binary size);
- libraries use the `.a` suffix, from the (ar)chive file type;
- if the same library is linked more than once, compilation fails with duplicate-symbol errors.

**Dynamic linking:**

- the module is loaded when the app starts, or during runtime;
- multiple targets in an app — including extensions — can share the same dynamic library (it's only copied once).

The difference between a framework and a library (whether statically or dynamically linked) is that a framework can contain multiple versions in the same bundle, and can carry additional resource files.

> A library is a `.a` file, from the archive file type. A single archive supports only one architecture. To bundle multiple architectures, you pack them into a **fat Mach-O binary** — a container format that holds Mach-O slices for different architectures together. If you want to build, modify, or extract a single architecture from a fat binary, the command-line tool `lipo` is what you want.

More on frameworks/libraries and static/dynamic [here](https://pewpewthespells.com/blog/static_and_dynamic_libraries.html).

![Dynamic vs. static linking](https://i.imgur.com/qKHdwhp.png)

App dependencies come in two flavours: **precompiled** and **not-compiled**.

##### Precompiled dependencies

[Carthage](https://github.com/carthage) is the canonical example. Some SDKs — [Firebase](https://github.com/CocoaPods/Specs/blob/master/Specs/0/3/5/Firebase/4.2.0/Firebase.podspec.json#L23), say — also ship precompiled. When the precompiled dependency is a library, it comes with a `.a` plus a public header that exposes its public interface. When it's a framework, it ships as a `.framework` containing the library and its resources.

When an app depends on a precompiled dependency, that dependency has to be built for the same architectures as the app. Miss an arch, and the app's compile breaks. As we'll see, Carthage uses `lipo` to produce frameworks containing every arch needed for the simulator or device, and strips out the ones the build configuration doesn't need.

##### Non-compiled dependencies

[CocoaPods](https://cocoapods.org/) is the canonical example here. Dependencies are declared on the target that links the framework or library. There are several ways to tell Xcode that your target depends on another target's output.

- **If the targets live in the same project**, you declare dependencies under Build Phases → *Target dependencies*. Xcode will compile those dependencies before compiling the target.
- **If the targets live in different projects**, use the *scheme* to spell out the relationship. Under the scheme's Build section, you list which targets get built and in what order (based on their dependencies). With *Find implicit dependencies* on, Xcode can guess dependencies based on each target's inputs and outputs. A misconfigured scheme produces errors like `xxxx.framework not found`. Circular dependencies between frameworks produce the same error.

> A heads-up about dependencies and build configurations: all dependencies' configurations have to match exactly. If you build your app with an Alpha configuration but any dependency doesn't have that configuration, the build will fail with a "framework not found" error. When this happens, Xcode silently skips building that framework — without reporting an error.

![How dependencies get compiled based on project configuration](https://i.imgur.com/TrXKUTJ.png)

### Linking with Xcode

A target can link the output of other targets — and you can use Xcode's tools (schemes, target dependencies) to declare those dependencies. But how do those declared dependencies actually get wired together?

#### 1. Dynamically or statically linking libraries and frameworks

A few ways to define linking:

- **A build phase:** among the available build phases, one is for linking — *Link Binary With Libraries*. Here you add dependencies of the target, which can come from the same project or another project in the same workspace. Xcode uses this phase to identify what the target needs at build time.
- **Compiler build settings:** what a build phase defines ultimately becomes compiler arguments. Some of that you can also set directly via build settings:
- `FRAMEWORK_SEARCH_PATHS`: where the compiler looks for frameworks to link.
- `LIBRARY_SEARCH_PATHS`: where the compiler looks for libraries to link.
- `OTHER_LDFLAGS` *(Other Linker Flags)*: you can pass `-l` to link a library, e.g. `-l"1PasswordExtension" -l"Adjust"`. To link a framework, use `-framework`, e.g. `-framework "GoogleSignIn" -framework "HockeySDK"`. If we try to link a framework or library the compiler can't find on the search paths, the build fails.

#### 2. Exposing library headers

A library's headers have to be exposed to the target depending on it. The build setting `HEADER_SEARCH_PATHS` is where you list the paths. If you link a library but forget to expose its headers, the build fails with header-not-found.

#### 3. Embedding frameworks in the app

An app target that links dynamic frameworks needs those frameworks copied into the app bundle. That's **framework embedding**. To do it, you use Xcode's **Copy Files Phase** to copy the frameworks into the `Frameworks` directory. You have to embed not just the direct dependencies but also their transitive dependencies. Miss any, and the app throws an error on launch.

------------------------------------------------------------------------

### Case studies

Now let's look at how CocoaPods and Carthage apply all of the above to manage your project's dependencies.

#### CocoaPods

![CocoaPods](https://i.imgur.com/yYLLsbQ.png)

CocoaPods resolves your project's dependencies and merges them into your project. Directly mutating your project configuration isn't really recommended, but CocoaPods has come a long way since the early versions — these days it barely touches your project. So how does it work under the hood?

- It creates a project (`Pods.xcodeproj`) containing every dependency, each as its own target. Each target compiles a dependency that needs to be linked into the app.
- It creates one extra target that depends on all the others. This is an *umbrella target* used to kick off the build of everything else. It minimises the changes to your project — by linking this single target, Xcode builds all the dependencies first, then your app.
- It creates a workspace containing both your project and the Pods project.
- Frameworks and libraries are linked via `.xcconfig` files. These files get added to your project group and set as the target's configuration.
- Embedding is handled by a build-phase script. Similarly, the framework's resources are copied via a build phase.

This diagram shows the whole setup:

![How CocoaPods integrates dependencies into your project](https://i.imgur.com/UARMUhl.png)

#### Carthage

![Carthage](https://i.imgur.com/IUXCxhQ.png)

Carthage's approach is very different from CocoaPods'. Beyond resolving dependencies, it's also a decentralised tool: it generates precompiled versions of the dependencies for you to link or embed in your app.

- Carthage resolves dependencies and compiles them, producing dynamic frameworks you can link, plus symbol files for debugging. The frameworks are fat — they contain both simulator and device architectures.
- You link the frameworks manually via the *Link Binary With Libraries* build phase.
- Embedding is handled by a script Carthage provides. The script strips out the architectures the current target doesn't need.
- The same script also copies the symbols to the right place so debugging works.

![How Carthage produces dependency frameworks and symbols](https://i.imgur.com/HXqtoDl.png)

### References

- [Framework vs Library](http://www.knowstack.com/framework-vs-library-cocoa-ios/)
- [Static and dynamic libraries](https://pewpewthespells.com/blog/static_and_dynamic_libraries.html)
- [Xcode Build Settings Reference](https://pewpewthespells.com/blog/buildsettings.html)
- [Embedding Frameworks in an App](https://developer.apple.com/library/content/technotes/tn2435/_index.html)
- [Introduction to Framework Programming Guide](https://developer.apple.com/library/content/documentation/MacOSX/Conceptual/BPFrameworks/Frameworks.html)
- [Skippy Copy Phase Strip](https://www.cocoanetics.com/2015/04/skipping-copy-phase-strip/)
