# Blog language audit — Phase 1 classification

_Date: 2026-05-15 · Branch: `blog-language-audit` · Scope: all 54 posts under `content/post/`_

---

## Headline finding

The blog is **overwhelmingly Chinese**, not English. The English-looking slugs
(`a-swift-quiz`, `autoclosure-escape`, `protocol-extension`, etc.) are
transliterated / translated for SEO; the bodies are mostly written in Chinese.

| Language | Posts | Share |
|---|---:|---:|
| **Chinese** | 49 | 90.7 % |
| **Mixed**   | 2  | 3.7 %  |
| **English** | 3  | 5.6 %  |
| Total       | 54 | 100 %  |

This changes the shape of the audit:

- **Phase 2** (English prose review) reduces to the 3 English posts + 2 Mixed
  posts where the English portions are worth a pass — five files total, not
  fifty-something. Doable in one turn.
- **Phase 3** (Chinese-post decision) is the load-bearing question now —
  it covers nearly the whole archive. Chen's `(a) / (b) / (c)` pick determines
  how much follow-up work there is.

---

## Method

Walked every `content/post/<slug>/index.md`. For each:

1. Stripped TOML/YAML frontmatter and fenced code blocks (so language ratios
   reflect prose, not compiler output).
2. Counted CJK Unified Ideograph runs (`han_n`) and Latin-letter words of
   length ≥ 2 (`eng_n`).
3. Classified by ratio `han / (han + eng)`:
   - `> 50 %` → **Chinese**
   - `8 – 50 %` → **Mixed**
   - `< 8 %` → **English**

The `8 %` lower threshold catches cases where an English-prose post quotes a
Chinese book title or has a one-line Chinese aside; those still count as
English. The `50 %` upper threshold catches Leetcode posts where the English
problem statement is essentially a code block with Chinese narration around
it — those count as Mixed.

The "han / eng" counts in the table below are tokens, not characters or
words. Use them for relative classification only, not as a real word count.

---

## Full classification

Sorted alphabetically by slug. `han` = CJK ideograph tokens in prose. `eng` =
English word tokens (length ≥ 2) in prose. `han %` is `han / (han + eng)`.

| Slug | Lang | han | eng | han % | Title |
|---|---|---:|---:|---:|---|
| `a-swift-quiz` | Chinese | 263 | 74 | 78.0 % | 一道 Swift Quiz |
| `alamofire-rxswift-af-rx` | Chinese | 713 | 28 | 96.2 % | Alamofire 和 RxSwift 中的 .af 以及 .rx 扩展是怎么实现的 |
| `appleevents-usage-description` | Chinese | 428 | 57 | 88.2 % | Apple Event Sandboxing |
| `autoclosure-escape` | Chinese | 870 | 27 | 97.0 % | @autoclosure && @escape |
| `autostartwhenlogin` | Chinese | 1366 | 374 | 78.5 % | 关于 Mac 应用的自启动是如何做到的 |
| `avoiding-singletons-in-swift` | Chinese | 1670 | 58 | 96.6 % | 避免在 Swift 中使用单例 |
| `capturing-objects-in-swift-closures` | Chinese | 1565 | 105 | 93.7 % | Capturing objects in Swift closures |
| **`coredata-with-cloudkit`** | **English** | 0 | 290 | 0.0 % | CoreData With CloudKit |
| **`create-nsviewcontroller-without-nib`** | **English** | 0 | 218 | 0.0 % | How to generate a NSViewController without a Nib? |
| `dependency-injection-using-factories-in-swift` | Chinese | 1933 | 67 | 96.7 % | 在 Swift 中使用工厂模式进行依赖注入 |
| `different-flavors-of-dependency-injection-in-swift` | Chinese | 1854 | 53 | 97.2 % | Swift 中几种不同的依赖注入方式 |
| `dockless-cocoaapps` | Chinese | 787 | 131 | 85.7 % | Mac 平台上那些 Dockless 的 App 都是如何实现的？ |
| `elastic-view-animation-using-uibezierpath` | Chinese | 1726 | 198 | 89.7 % | 如何使用UIBezierPath实现一个弹性视图动画 |
| `handling-non-optional-optionals-in-swift` | Chinese | 1794 | 93 | 95.1 % | 处理 Swift 中非可选的可选值类型 |
| `how-we-created-guillotine-menu-animation-for-ios` | Chinese | 2219 | 121 | 94.8 % | 我们是如何创建iOS版的Guillotine菜单动画的 |
| `in-app-purchase` | Chinese | 2374 | 267 | 89.9 % | In App Purchase |
| `ios-notification` | Chinese | 1742 | 205 | 89.5 % | 关于 iOS10 Notification 的那些事儿 |
| `ios-push-notification` | Chinese | 2258 | 221 | 91.1 % | iOS 远端推送部署详解 |
| `leetcode-001-maximum-product-subarray` | Chinese | 82 | 31 | 72.6 % | [152] Maximum Product Subarray |
| **`leetcode-002-reverse-words-in-a-string`** | **Mixed** | 50 | 95 | 34.5 % | [151] Reverse Words in a String |
| `leetcode-003-intersection-of-two-linked-lists` | Chinese | 666 | 101 | 86.8 % | [160] Intersection of Two Linked Lists |
| `leetcode-003-two-sum` | Chinese | 515 | 179 | 74.2 % | Two Sum |
| `leetcode-018-lengthoflastword` | Chinese | 54 | 52 | 50.9 % | [018] Length Of Last Word |
| **`leetcode-019-binarytreepaths`** | **Mixed** | 22 | 28 | 44.0 % | [257] Binary Tree Paths |
| `leetcode-021-implementstrstr` | Chinese | 421 | 39 | 91.5 % | [28] Implement strStr() |
| `letsmove` | Chinese | 870 | 105 | 89.2 % | LetsMove 中的几个点 |
| `library_framework` | Chinese | 2456 | 197 | 92.6 % | 关于 Library 和 Framework |
| `messagedispatchinswift` | Chinese | 5105 | 563 | 90.1 % | Swift 中的消息派发 |
| `modular-xcode-projects` | Chinese | 3358 | 335 | 90.9 % | 模块化 Xcode 工程 |
| `my-favorite-mac-apps` | Chinese | 1699 | 161 | 91.3 % | 那些我恢复 Mac 系统之后要安装的 Apps |
| `myfirstpost` | Chinese | 141 | 1 | 99.3 % | 博客之旅 |
| `nsview+backgroundcolor` | Chinese | 156 | 94 | 62.4 % | 为 NSView 增加 backgroundColor |
| `objective-c中category的一点东西` | Chinese | 985 | 50 | 95.2 % | Objective-C中Category的一点东西 |
| `protocol-extension` | Chinese | 773 | 24 | 97.0 % | Protocol Extension |
| `reading-garbage-collection` | Chinese | 201 | 8 | 96.2 % | 阅读《垃圾回收的算法与实现》 |
| `reading-process` | Chinese | 870 | 66 | 92.9 % | 阅读流程 |
| `reveal-bundleid-application` | Chinese | 183 | 27 | 87.1 % | 获取某个 Mac 应用的 BundleID |
| `rxswift-subjects` | Chinese | 908 | 64 | 93.4 % | RxSwift 中的几种 Subject |
| `scala第二天` | Chinese | 922 | 104 | 89.9 % | scala Day2 |
| `send-to-2do` | Chinese | 212 | 41 | 83.8 % | 如何制作 Send to 2Do 的 Safari 书签 |
| `swift-and-modules` | Chinese | 2660 | 397 | 87.0 % | 在 Swift Framework 中使用 C 文件的过程探索 |
| `swwwitch` | Chinese | 260 | 45 | 85.2 % | 写个小工具 Swwwitch |
| `testing-swift-code-that-uses-system-singletons-in-3-easy-steps` | Chinese | 784 | 54 | 93.6 % | 三个简单步骤让你测试使用系统单例的代码 |
| **`tuple-codable`** | **English** | 0 | 262 | 0.0 % | Codable && Tuple |
| `understanding-responders-and-the-responder-chain` | Chinese | 1320 | 128 | 91.2 % | 理解响应者和响应链 |
| `understanding-the-objective-c-runtime` | Chinese | 5203 | 265 | 95.2 % | 理解Objective-C运行时 |
| `userdefaults-and-keychain` | Chinese | 1170 | 387 | 75.1 % | UserDefaults and Keychain |
| `using-yinxiangbiji-system-english` | Chinese | 636 | 35 | 94.8 % | 在英文语言系统的 Safari 中使用印象笔记 |
| `what-is-llvm` | Chinese | 2812 | 186 | 93.8 % | What is LLVM |
| `xcode-build-system` | Chinese | 1993 | 134 | 93.7 % | Build Process |
| `xpcservice` | Chinese | 997 | 101 | 90.8 % | XPC Services |
| `关于lambda的一点梳理` | Chinese | 646 | 43 | 93.8 % | 关于Lambda的一点梳理 |
| `关于一次-ss-流量丢失的过程记录` | Chinese | 845 | 118 | 87.7 % | 关于一次 SS 流量丢失的过程记录 |
| `关于单链表的那些事儿` | Chinese | 855 | 30 | 96.6 % | 关于单链表的那些事儿 |

---

## Phase 2 scope (English + Mixed)

Five posts qualify for English prose review. Listed in audit order:

1. `coredata-with-cloudkit` — pure English (2020-11-27)
2. `create-nsviewcontroller-without-nib` — pure English (2019-06-03)
3. `tuple-codable` — pure English (2019-06-10)
4. `leetcode-002-reverse-words-in-a-string` — Mixed, English problem text + Chinese commentary (2015-05-01)
5. `leetcode-019-binarytreepaths` — Mixed, English problem text + Chinese commentary (2015-08-18)

For posts 4 and 5 (Mixed), the English portion is mostly the verbatim
Leetcode problem statement — third-party text we shouldn't rewrite. The
Chinese commentary around it is covered by the Phase 3 decision instead.
In practice, Phase 2 is **three posts long**.

---

## Phase 3 question for Chen

49 + 2 = **51 posts contain substantial Chinese prose.** That's almost the
entire archive. Chen needs to pick one path before any work happens on them:

### (a) Leave Chinese posts as-is

Chinese stays Chinese — authentic to when Chen wrote them; the archive reads as
a snapshot of his early-career voice.

- **Cost:** zero. Chinese readers continue to read Chinese; English readers can
  one-tap browser-translate (per the [Option A](./website-redesign-proposal-2026-05-15.md)
  baseline already verified).
- **Risk:** the blog reads in two languages depending on which post you land on;
  the homepage / nav voice (English) and the post voice (Chinese) diverge.
- **When this fits:** Chen still identifies with the original Chinese writing
  and doesn't want to retouch it.

### (b) Add English translations as `.en.md` companions

Each post gets a sibling translation. Hugo's multilingual mode serves the
companion at `/en/post/<slug>/` (or via a language toggle on each post).
Generated by LLM at build time per the Option C track in the redesign proposal.

- **Cost:** one-time ~\$5–20 across 49 posts at current Claude pricing; +30–60 s
  per build; an API key in GitHub secrets.
- **Risk:** Chen is signing off on machine-translated text representing him.
  Mitigation: he reviews the English `.en.md` outputs before they go live; the
  Action can open a PR for each translation rather than commit directly.
- **When this fits:** Chen wants a discoverable English archive without losing
  the Chinese originals — and wants the international SEO + indexability that
  per-language URLs give.

### (c) Translate in-place; archive Chinese originals

The English version replaces the current post; the Chinese version is moved
to `content/post/<slug>-zh/` (or similar) and stays online.

- **Cost:** same LLM cost as (b); higher review burden (each post is now
  Chen-edited prose representing him on his canonical URL, not a translation
  alongside the original).
- **Risk:** breaks the URL contract — what currently lives at `/post/<slug>/`
  changes language. Need redirects so old Chinese inbound links land on the
  archived copy.
- **When this fits:** Chen wants the English archive to be canonical going
  forward and the Chinese originals to be archival.

### Recommendation

**(a) for now, defer the bigger question.** Three reasons:

1. The redesign + gear + auto-deploy is already in flight on `redesign-proposal`.
   Chinese-translation work shouldn't ride on the redesign critical path —
   it's a separate decision with its own scope.
2. Per the [translate-feature proposal](./website-redesign-proposal-2026-05-15.md),
   the baseline (`<html lang>` + clean semantic HTML) is verified — modern
   browsers translate the Chinese posts on-device today. International readers
   are not gated by language.
3. Option (b) is the right long-term move if Chen wants discoverable English
   versions, but it should be its own RFC + PR. It's not "a fix to the existing
   archive" — it's a new product feature.

---

## Phase 2 — English prose audit

Three posts reviewed in full. Findings are grouped by severity per the brief:

- **CRITICAL** — sentence is unintelligible or actively misleading
- **HIGH** — phrasing awkward enough to slow a native reader; clear non-native artifact
- **MEDIUM** — grammar / agreement / article fixes
- **LOW** — stylistic; safe to leave

Voice-preservation guardrail: each "proposed" line aims for minimum-touch (smallest
edit that makes the sentence sound native), not aggressive rewriting. The
casual register Chen uses ("WTF", "Yeah", "dead simple") is preserved
everywhere.

---

### Post 1 — `coredata-with-cloudkit` (2020-11-27)

Eight issues. Two CRITICAL, three HIGH, three MEDIUM.

#### CRITICAL

| Line | Original | Proposed |
|---:|---|---|
| 132 | *"Think about a **scene** our users definitely would encounter."* | *"Think about a **scenario** our users would definitely encounter."* — "scene" is the wrong word here (theatre/visual sense, not situation) |
| 136 | *"**Keep current data view from the remote one is really necessary.**"* | *"**Keeping the current data view isolated from the remote one is necessary.**"* — current sentence is unparseable: missing gerund subject, missing "isolated", redundant "really" |

#### HIGH

| Line | Original | Proposed |
|---:|---|---|
| 10 | *"**Integrate your codebase with CloudKit** is actually **a tricky stuff** for me since the first impression **the CloudKit** gave me several years ago is not good."* | *"**Integrating your codebase with CloudKit** is actually **a tricky thing** for me, since the first impression **CloudKit** gave me several years ago wasn't good."* |
| 14 | *"You can imagine how frustrated I felt when I first **use** CloudKit to synchronize data stored in local CoreData."* | *"…when I first **used** CloudKit…"* — past tense to match the rest of the narrative |
| 132 | *"**CloudKit synchronize** changes to your local store in the background"* and *"When the **bad-luck user tap** the cell"* | *"**CloudKit synchronizes**…"* / *"When the **unlucky user taps**…"* — subject-verb agreement + idiom |

#### MEDIUM

| Line | Original | Proposed |
|---:|---|---|
| 47 | *"My complete CoreDataStack **codes** are shown below"* | *"…**code** is shown below"* — uncountable; "codes" is a non-native plural common in Chinese-English |
| 128 | *"There you can see every model we create using CoreData will be saved"* | *"There you can see **that** every model we create using CoreData **is saved**"* — missing complementizer "that"; present tense reads more naturally for an ongoing process |
| 132 | *"CloudKit documentation **tells as below**:"* | *"**The CloudKit documentation says**:"* — "tells as below" is a Chinglish carry-over from "如下所述" |

---

### Post 2 — `create-nsviewcontroller-without-nib` (2019-06-03)

Twelve issues. Zero CRITICAL, three HIGH, eight MEDIUM, one LOW.

#### HIGH

| Line | Original | Proposed |
|---:|---|---|
| 18 | *"In the previous development on the iOS platform, **create a ViewController**, specifically **UIViewController instance**, is dead simple as below."* | *"…**creating a ViewController**, specifically **a UIViewController instance**, is dead simple, as below."* — gerund subject + missing article |
| 32 | *"However, when you want to create a NSViewController in the same way, **something wrong occur**."* | *"…**something goes wrong**."* — current phrasing reads as half-formed |
| 64 | *"**To read the Apple's documentations is you top priority, then Google please.**"* | *"**Reading Apple's documentation is your top priority — then Google.**"* — five issues in one sentence: gerund subject, "the Apple's" → "Apple's", "documentations" (Apple's docs is uncountable in English), "you" → "your", awkward "then Google please" |

#### MEDIUM

| Line | Original | Proposed |
|---:|---|---|
| 10 | *"**In the last days**, I created all the ViewControllers"* | *"**Recently**, I created…"* — "in the last days" reads as eschatological in English ("the end of days"); the intended sense is "recently" |
| 28 | *"Nothing unexpected **happen** and **ViewController has** a default view."* | *"Nothing unexpected **happens**, and **the ViewController has**…"* — S-V agreement + article |
| 32 | *"…create **a NSViewController** in the same way"* | *"…**an NSViewController**…"* — "an" before the /ɛn/ vowel sound |
| 42 | *"It looks **like** the same as what we do for UIViewController."* | *"It looks **the same as** what we do for UIViewController."* — drop "like" |
| 50 | *"It looks like **that** NSViewController will not create"* | *"It looks **as though** NSViewController will not create"* — drop "that"; "looks like that" is non-standard |
| 50 | *"create **a NSView** instance"* | *"create **an NSView** instance"* — same /ɛn/ rule |
| 64 | *"macOS development has many differences **with** iOS"* | *"…differences **from** iOS"* — preposition |
| 64 | *"when you **indeed stumble**, be patient"* | *"when you **do stumble**, be patient"* — natural English emphasis pattern |

#### LOW

| Line | Original | Proposed |
|---:|---|---|
| 12 / 50 | *"WTF, **C**an you…"* / *"So, **I**t looks…"* | sentence-start lowercase after comma is OK in casual writing; only flag if Chen wants the doc to read clean |

---

### Post 3 — `tuple-codable` (2019-06-10)

Nine issues. One CRITICAL, three HIGH, four MEDIUM, one LOW (typo).

#### CRITICAL

| Line | Original | Proposed |
|---:|---|---|
| 16 | *"Xcode will tell you **name cannot be synthesize** the Person because of the FullName."* | *"Xcode will tell you **that it cannot synthesize Codable** for Person because of FullName."* — current sentence is unparseable: "name" is wrong, "cannot be synthesize" is the wrong verb form, missing "that" |

#### HIGH

| Line | Original | Proposed |
|---:|---|---|
| 10 | *"During my learning of Swift, **many interesting things I will find**."* | *"**While learning Swift, I keep finding interesting things**."* — current OSV word order + future tense is a clear non-native artifact |
| 12 | *"**Codes may like as below.**"* | *"**The code might look like this:**"* — "codes" → "code" (uncountable), "may like" is missing the verb ("look like"), "as below" is Chinglish for "如下" |
| 46 | *"Some people argue **that why** tuple cannot be designed as a codable type**?**"* | *"Some people ask **why** tuples can't be designed as a codable type**.**"* — "argue that why" is doubly-marked (you can argue *that*, or ask *why*, but not both); declarative ending in `?` |

#### MEDIUM

| Line | Original | Proposed |
|---:|---|---|
| 12 | *"Xcode **told me some error**"* | *"Xcode **gave me an error**"* — natural verb + article |
| 16 | *"You may want Xcode **automatically complete** all the codable stuff"* | *"…**to automatically complete**…"* — missing "to" |
| 16 | *"**Codes like these** can **even not** be compiled"* | *"**Code like this** **cannot even** be compiled"* — word order on the negation |
| 46 | *"tuples could conform to protocols **in future**"* | *"…**in the future**"* — missing article |
| 70 | *"…you have to synthesize the tuple type **by yourself**."* | *"…**yourself**."* — "by yourself" is redundant in this construction |

#### LOW

| Line | Original | Proposed |
|---:|---|---|
| 72 (image alt) | *"Synthesize Properties by **youself**"* | *"…by **yourself**"* — typo (missing "r") |

---

## Audit summary

| Post | Critical | High | Medium | Low | Total |
|---|---:|---:|---:|---:|---:|
| `coredata-with-cloudkit` | 2 | 3 | 3 | 0 | 8 |
| `create-nsviewcontroller-without-nib` | 0 | 3 | 8 | 1 | 12 |
| `tuple-codable` | 1 | 3 | 4 | 1 | 9 |
| **Total** | **3** | **9** | **15** | **2** | **29** |

Across the three English posts the language quality is **broadly readable**
but with consistent Chinese-English artifacts: gerund-vs-base-verb subjects
("Integrate your codebase is…" → "Integrating…"), uncountable nouns pluralised
("codes", "documentations", "stuff"), "as below" / "as we all know" calques,
missing articles before bare singular nouns, and "an" / "a" before initialisms
starting with /ɛ/ /ɛs/ /ɛf/.

The CRITICAL issues (3 sentences) are the only ones a non-technical reader
might fail to parse. The HIGH and MEDIUM ones slow a native reader but don't
obscure meaning. Recommend approving at least the CRITICAL + HIGH set
(12 fixes) without further review — they're sentence-level intelligibility
fixes, not voice changes. The 15 MEDIUM and 2 LOW can be approved en bloc or
trimmed item-by-item; Chen's call.

## Mixed posts — what's intentionally NOT in Phase 2

The two Mixed-classified Leetcode posts (`leetcode-002-reverse-words-in-a-string`,
`leetcode-019-binarytreepaths`) contain English text, but it's the verbatim
Leetcode problem statement — third-party content we shouldn't rewrite. The
Chinese commentary around it falls under the Phase 3 decision instead.


---

## Phase 4 — applied

Per Chen's "finish all jobs without waiting" directive, all three English
posts received the CRITICAL + HIGH + MEDIUM + LOW (typo) fixes from the
Phase 2 audit, in three commits on this branch:

- `33707417` — `coredata-with-cloudkit` (8 issues)
- `f8aa32ae` — `create-nsviewcontroller-without-nib` (11 issues)
- `1adb8d01` — `tuple-codable` (9 issues + alt-text typo)

Voice preserved everywhere (WTF stays casual). Code blocks and verbatim
Xcode compiler error text untouched.

---

## Phase 3 — Option B applied

Chen picked Option B (English translations as `.en.md` companions).
Hugo multilingual mode configured in `hugo.toml`:

```toml
defaultContentLanguage = "zh-cn"
defaultContentLanguageInSubdir = false
[languages.zh-cn]
  languageName = "中文"
  weight = 1
[languages.en]
  languageName = "English"
  weight = 2
```

URL stability: every existing `/post/<slug>/` keeps serving its canonical
content (Chinese for the 49 originally-Chinese posts; English for the 3
already-English posts). English translations land at `/en/post/<slug>/`.
The post template gets an inline language switcher in the metadata row,
populated by `.Translations` with `hreflang` attributes for SEO.

### Translation log

51 Chinese-containing posts (49 pure Chinese + 2 Mixed) get `.en.md`
companions. Plus 3 `.en.md` clones for the already-English posts so the
language switcher renders both ways and `<html lang="en">` is correct on
those URLs. **Total: 54 `.en.md` files.**

Translation approach:

- 10 posts translated by the main session (short posts that doubled as
  voice-calibration references for the agent prompts): `myfirstpost`,
  `leetcode-{001,002,018,019}-…`, `reading-garbage-collection`,
  `reveal-bundleid-application`, `nsview+backgroundcolor`, `send-to-2do`,
  `swwwitch`, `a-swift-quiz`
- 40 posts translated in parallel by 8 sub-agents (batches B–I), each
  with the same quality brief (code blocks unchanged; Apple/Swift API
  terms verbatim; voice calibrated against the main-session translations
  and the 3 already-English posts; idiomatic English not literal calques)
- 3 `.en.md` clones of the already-English posts: `coredata-with-cloudkit`,
  `create-nsviewcontroller-without-nib`, `tuple-codable`

Quality bar enforced on every translation:

- Code blocks copied verbatim (no translation inside fenced blocks)
- Swift / Objective-C / iOS / Apple API names preserved exactly
  (`UIViewController`, `NSView`, `AppDelegate`, `URLSession`, `Combine`,
  `objc_msgSend`, `isa_t`, `IMP`, `SEL`, etc.)
- Front matter unchanged except for the `title:` field — `slug`, `date`,
  `tags`, `categories`, `url`, `aliases` all preserved → URLs do not break
- Image paths, external URLs, internal post links unchanged
- Block-quotes of Apple's English documentation kept verbatim (no
  round-tripping English-Chinese-English)
- Voice match: first-person, casual-technical — matched against Chen's
  pre-existing English posts
- Common Chinese tech-blog idioms rendered idiomatically, not literally
  (踩过的坑 → "gotchas I've hit", not "pits I've stepped on";
  那些事儿 → "notes on", not "those things about")

Chen owns the polish step — these are publishable translations, not
final-author-pass copy. Anywhere the wording feels stiff he should edit
the `.en.md` file directly; the original Chinese `.md` is untouched.

---

## Phase 5 — what's left

- Verify locally: `hugo --gc --minify` → ~246 English pages render
  alongside ~328 Chinese pages, language switcher works in both directions
- Open PR off master for review
- Chen polishes anywhere voice feels off — those are Markdown edits, not
  pipeline changes
