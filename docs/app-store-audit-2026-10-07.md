# Public app listing audit — October 7, 2026

Scope: all 12 existing catalog entries, the separate Stash introduction, and the
static Open in Tower introduction. Baseline: `755ac296`, including the approved
icon refresh and Keeps/Closet website links. Release history posts, the repair
draft and the separate Web Keeps navigation proposal are outside this change.

## Confirmed public Apple apps

The [public developer page](https://apps.apple.com/us/developer/chen-he/id1843281784)
lists four apps. Its Mac section lists Keeps and Structly; its Watch section lists
LiftCoach and TensionRadar. No additional public Apple apps were found there.
US, UK and China public lookup results returned the same four catalog app IDs.

| App | Public version checked | Native product platforms | Correction |
| --- | --- | --- | --- |
| [Structly](https://apps.apple.com/us/app/structly-json-formatter/id6753774575) | 2.0.0 | iPhone, iPad, Mac | Catalog now describes the native JSON viewer and its Safari extension. Existing download link and introduction are current. |
| [LiftCoach](https://apps.apple.com/us/app/liftcoach/id6812929269) | 1.0.1 | iPhone, iPad, Apple Watch | Remove the stale China-mainland exclusion; its China public listing now resolves. Use the current LiftCoach Pro name and qualified AI availability wording. Replace the orange site icon with the blue artwork of the published release. |
| [Keeps](https://apps.apple.com/us/app/keeps-cost-per-use-tracker/id6811795155) | 1.4.1 | iPhone, iPad, Mac; Messages extension | Remove the version-pinned availability sentence and describe the released Messages stickers and remembered filters. Keep the correctly dated 1.4.0 screenshot captions and release-history link. |
| [TensionRadar](https://apps.apple.com/us/app/tensionradar/id6753273426) | 1.0.1 | iPhone, Apple Watch | Add the App Store link to the catalog and introduction. Remove the development/testing block, retain the supported public features, and avoid calling intermittent HRV readings real-time. |

Platform verification uses the product page's native `appPlatforms` and media
sections, corroborated by the developer page. Generic compatibility alone is not
native-platform evidence: LiftCoach also has an Apple-silicon compatibility entry
marked “Designed for iPad. Not verified for macOS,” so this update does not claim
a released native Mac app. Compatible Vision devices are likewise not promoted
as native Vision products.

The public product pages and metadata verify minimum requirements: Keeps needs
iOS/iPadOS 18 and macOS 15; Structly needs iOS/iPadOS 17.6 and macOS 13.5;
LiftCoach needs iOS/iPadOS 18 and watchOS 10; TensionRadar needs iOS 18 and
watchOS 11. These are audit facts, not a new promise of support for every device.

## Apple apps without a confirmed public listing

| Introduction | Catalog ID | Result in US, UK and China | Action |
| --- | --- | --- | --- |
| Closet | 6758357191 | No public record returned | Its live product website says it is in beta for iPhone, iPad and Mac. Align the introduction with that beta availability, retain the approved website/support/privacy links, and add no App Store release claim. |
| Distill | 6759821801 | No public record returned | Keep existing introduction and support/privacy links; public platform availability remains unconfirmed. |
| SpendWisely | 6761079192 | No public record returned | Keep existing introduction and support/privacy links; public platform availability remains unconfirmed. |
| EatWisely | 6759225918 | No public record returned | Keep existing introduction and support/privacy links; public platform availability remains unconfirmed. |
| TrainInsight | 6759210309 | No public record returned | Add the existing support and privacy pages to its catalog links; add no download link. |
| Market Mood | 6761278234 | No public record returned | Keep existing introduction and support/privacy links; public platform availability remains unconfirmed. |
| Stash | Documented identity checked | No public record returned | Keep the existing separate introduction, support and privacy pages. Do not invent a public App Store link or add it as a newly released catalog app. |

Missing records in three checked territories do not establish worldwide
availability or App Store Connect review state. Except for Closet's explicit
public beta website, existing platform/feature copy on these pages is not
independently confirmed by a public shipping listing. This
audit records that limit rather than silently treating project or TestFlight
evidence as proof of a release.

Lookup evidence comes from Apple's public endpoints, for example:

- [US catalog lookup](https://itunes.apple.com/lookup?id=6811795155,6753774575,6812929269,6753273426,6758357191,6759821801,6761079192,6759225918,6759210309,6761278234&country=us&entity=software)
- [UK catalog lookup](https://itunes.apple.com/lookup?id=6811795155,6753774575,6812929269,6753273426,6758357191,6759821801,6761079192,6759225918,6759210309,6761278234&country=gb&entity=software)
- [China catalog lookup](https://itunes.apple.com/lookup?id=6811795155,6753774575,6812929269,6753273426,6758357191,6759821801,6761079192,6759225918,6759210309,6761278234&country=cn&entity=software)

Individual-ID lookup is authoritative for the matching public record, but the
`entity=macSoftware` filter did not reliably distinguish native Mac records in
this check. The platform conclusions above therefore use Apple's product and
developer pages instead of that filter.

## Browser extensions and Stream Deck plugin

| Product | Public destination | Result |
| --- | --- | --- |
| Course Book Builder | [Chrome Web Store](https://chromewebstore.google.com/detail/course-book-builder/kalbioiplchbbekfphaobmkcekoliklb) | Search-indexed listing describes the existing desktop Chrome/EPUB/PDF product, but the live anonymous browser redirects to an unavailable-item page asking for sign-in. Replace the unconditional Add to Chrome label with a neutral store link. Public install availability remains unconfirmed. |
| Stock Price | [Elgato Marketplace](https://marketplace.elgato.com/product/stock-price-c8878f24-2a1b-448b-b6fa-060118d0c0b1) | Existing destination lists Mac and Windows. Honor its Marketplace label in the catalog. |
| Open in Tower | [Chrome Web Store](https://chromewebstore.google.com/detail/open-in-tower-unofficial/amkfflhhjlihielfjkiibchiogknjmlh) | Existing live introduction was omitted from the catalog. Add it with the official store icon, store/privacy/support links and the installed-Tower requirement. Use Chen in authored introduction copy. |

The Keeps and Closet product websites remain the approved destinations from
the baseline. Both return HTTP 200 in a fresh browser with their expected product
headings. Basic HTTP clients received 403, so their browser readback was checked
separately. This audit does not change those websites or any native app.

## Icons and validation

The baseline refreshed the app icons. A normalized pixel comparison against
current public artwork found matching Keeps, Structly and TensionRadar icons
(mean channel differences below 1.5 on a 0–255 scale). LiftCoach was visibly
different: orange/black on the site versus blue/cream in its public release.
Use the public blue icon and refresh its cache fingerprint wherever referenced.
The other new catalog artwork is Open in Tower's official Chrome-store icon.
No alternate design or generated app icon is used.

Build with Hugo, then run `npm run build:css`. Verify all catalog/detail/support/
privacy links and icons, all introduction pages at 1280px and 375px in light and
dark mode, and the repository smoke pages. Record any incomplete public
availability checks in the PR rather than claiming them as verified releases.
