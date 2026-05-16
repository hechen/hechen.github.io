---
title: Marketing / Support / Privacy pages — fleet audit
date: 2026-05-15
scope: 9 apps (closet, distill, dupeout, eatwisely, liftcoach, marketmood, spendwisely, structly, traininsight)
---

# Summary

Fleet audit of public marketing, support, and privacy pages across all 9 apps on `hechen.github.io`.

Two changes applied:

1. **Email consistency** — every public contact link now uses `chen.he@icloud.com` (the standing in-app feedback recipient) instead of `hechen.dream@gmail.com` (the git-author identity). 17 files, 19 link occurrences across all 9 apps.
2. **FAQ structural cleanup on DupeOut + LiftCoach** — both used `<dl><dt><dd>` blocks that read as a wall of run-in text on small viewports. Converted to `<h3>`-per-question inside the existing `<h2>FAQ</h2>` wrapper, matching the visual hierarchy used by the rest of the fleet. Added a `Last updated: 15 May 2026` line on both support pages (the other apps' support pages already carried one). LiftCoach also gets a wording softening on the AI-provider FAQ.

Nothing else changed. The "free" / "premium" scrub was rejected as out-of-scope — those words appear in factual contexts (TestFlight being free, Apple Intelligence being free, the open-source `free-exercise-db` library name) and don't fall under Apple guideline 2.3.7, which targets App Store metadata fields rather than public webpages.

# Files touched (17)

| App | File | Change |
|---|---|---|
| closet | `support.html` | email |
| closet | `privacy.html` | email |
| distill | `support.html` | email |
| distill | `privacy.html` | email |
| dupeout | `support.html` | email + FAQ `<dl>` → `<h3>` + Last-updated line |
| dupeout | `privacy.html` | email |
| eatwisely | `support.html` | email |
| eatwisely | `privacy.html` | email |
| liftcoach | `support.html` | email × 2 + FAQ `<dl>` → `<h3>` + Last-updated line + "Apple Intelligence is Apple's **built-in** on-device model" (was "free") |
| liftcoach | `privacy.html` | email |
| marketmood | `support.html` | email |
| marketmood | `privacy.html` | email |
| spendwisely | `support.html` | email |
| structly | `support.html` | email |
| traininsight | `_index.html` | email (footer mailto) |
| traininsight | `support.html` | email |
| traininsight | `privacy.html` | email |

# Audit findings by app

Severity legend: **B** ship-blocker · **H** high polish · **M** medium · **L** low.

## closet — clean after sweep
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` line 42 + `privacy.html` line 29: gmail address. | Fixed → `chen.he@icloud.com` |
| ✓ | FAQ already uses `<h2>` per-Q (Convention A). | No action |
| ✓ | Both pages carry `Last updated: 26 April 2026`. | No action |

## distill — clean after sweep
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` line 39 + `privacy.html` line 29: gmail address. | Fixed |
| ✓ | FAQ uses `<h2>` per-Q. | No action |
| ✓ | Both pages carry Last-updated. | No action |

## dupeout — structural + sweep
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` lines 21, 54 + `privacy.html` line 49: gmail address. | Fixed |
| H | `support.html` FAQ uses `<dl><dt><dd>`, an outlier vs. the rest of the fleet's `<h2>`/`<h3>` pattern. | Fixed → `<h3>` per-question inside the FAQ section |
| M | `support.html` had no Last-updated date (other apps' supports do). | Fixed → `Last updated: 15 May 2026` |
| ✓ | Contact / FAQ / Known issues / Release notes template is intact. | No action |

## eatwisely — clean after sweep
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` line 39 + `privacy.html` line 29: gmail address. | Fixed |
| ✓ | FAQ uses `<h2>` per-Q. | No action |
| ✓ | Both pages carry Last-updated. | No action |

## liftcoach — structural + sweep + wording softening
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` lines 21, 54 + `privacy.html` line 55: gmail address. | Fixed |
| H | `support.html` FAQ uses `<dl><dt><dd>`, an outlier vs. the rest of the fleet. | Fixed → `<h3>` per-Q inside the FAQ section |
| M | `support.html` had no Last-updated date. | Fixed → `Last updated: 15 May 2026` |
| L | "Apple Intelligence is Apple's **free** on-device model" — factual but unnecessary; "free" on Support URLs is *not* a guideline 2.3.7 issue, but reviewers do follow Support URLs and the word adds zero info. Softened. | Fixed → "Apple's **built-in** on-device model" |
| ✓ | Public name matches App Store (LiftCoach, not internal "GymLog"). | No action |
| ✓ | Contact / FAQ / Known issues / Release notes template is intact. | No action |
| ✓ | `privacy.html` already carries `Last updated: 26 April 2026`. | No action |

## marketmood — clean after sweep
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` line 39 + `privacy.html` line 29: gmail address. | Fixed |
| ✓ | FAQ uses `<h2>` per-Q. | No action |
| ✓ | Both pages carry Last-updated. App name "Market Mood" matches App Store Connect. | No action |

## spendwisely — clean after sweep
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` line 42: gmail address. | Fixed |
| L | `privacy.html` ends with "email me and I'll explain or fix it" without a mailto link. Not adding one in this pass — would be a copy change, not a sweep. | Deferred |
| ✓ | FAQ uses `<h2>` per-Q. Last-updated present. | No action |

## structly — clean after sweep
| Severity | Finding | Status |
|---|---|---|
| H | `support.html` line 34: gmail address. | Fixed |
| L | `privacy.html` has no contact email at all (short page, no support reference). Acceptable since support.html exists at the same level; not fixing in this pass. | Deferred |
| ✓ | App Store badge ("Live on App Store") is the only Convention-A page that's shipped. App name matches `Structly — JSON Formatter` on the App Store. | No action |

## traininsight — clean after sweep
| Severity | Finding | Status |
|---|---|---|
| H | `_index.html` line 106 (footer mailto) + `support.html` line 42 + `privacy.html` line 29: gmail address. | Fixed (3 files) |
| L | `_index.html` uses a slightly different hero layout than the other 7 (single CTA + "Coming soon to App Store" status pill, no two-column features grid in the standard form). Intentional — TrainInsight's _index was redesigned for a different launch beat. | No action |
| ✓ | FAQ uses `<h2>` per-Q. Last-updated present on privacy + support. | No action |
| ✓ | No hydration references (per the standing rule: TrainInsight has no hydration tracking). | No action |

# Cross-cutting observations (no edits)

- **Two structural conventions remained until this pass; now harmonized at the Q-header level**:
  - **Convention A** (closet, distill, eatwisely, marketmood, spendwisely, structly, traininsight): support pages use direct topic `<h2>`s, no Contact/FAQ/Known issues/Release notes wrapper. Email link sits at the bottom in an "Anything else" section.
  - **Convention B** (dupeout, liftcoach): explicit Contact / FAQ / Known issues / Release notes sections. After this pass, both use `<h3>` per-Q inside the FAQ wrapper. Same visual rhythm; just nested one level deeper.
  - Both read fine. Not consolidating to one convention in this pass — would be a UX-template decision, not a defect fix.
- **"Free" / "Premium" wording** was reviewed and intentionally not touched outside the LiftCoach AI-provider FAQ. Every other "free" on the marketing pages is factual (TestFlight is free; Apple Intelligence is free; `free-exercise-db` is a library name). Apple guideline 2.3.7 covers App Store metadata fields (subtitle / description / promo text / keywords / screenshots / what's new / reviewer notes), not public support webpages.
- **Last-updated dates** vary across the fleet (`26 April 2026`, `27 April 2026`, `28 April 2026`). Left as-is on existing pages — each date reflects the last real content edit on that file. New `15 May 2026` lines added to DupeOut + LiftCoach support pages, which previously had none.
- **TestFlight Public Link codes** are still `REPLACE_<APP>_CODE` placeholders on 7 apps' _index.html (closet, distill, dupeout, eatwisely, liftcoach, marketmood, spendwisely, structly beta, traininsight). Tracked separately; out of scope here.
- **Mobile chrome / nav weight** was reviewed by inspection; the per-page back-arrow + `<h1>` pattern is consistent and lightweight. No regressions found, no edits.
- **App-name consistency**: every page's title / breadcrumb matches the App Store name. LiftCoach (not the internal GymLog codename), Market Mood (not the internal FearIndex codename), Structly (not "Structly — JSON Formatter" verbatim, but the trimmed form is fine for marketing).

# Verification

```
$ grep -rln "hechen.dream@gmail.com" content/apps/
(empty — clean across all 9 apps)

$ grep -rln "chen.he@icloud.com" content/apps/ | wc -l
17
```

# Deferred / not in scope

- SpendWisely privacy mailto link (low priority copy change).
- Structly privacy contact email (very short page, support.html covers it).
- TestFlight Public Link code placeholders.
- Convention A vs B consolidation across the fleet (template-level decision).
