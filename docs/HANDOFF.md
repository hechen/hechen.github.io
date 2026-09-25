# hechen.github.io handoff

Last updated 2026-09-25 (America/Los_Angeles). Start here; `AGENTS.md` has the short rules.

## Where things stand

| | |
|---|---|
| Site | https://hechen.github.io/ (GitHub Pages) |
| Repo | github.com/hechen/hechen.github.io, branch `master`; local clone `/Users/chen/.openclaw/workspace/projects/hechen.github.io` |
| Stack | Hugo 0.165 extended (CI pins `HUGO_VERSION`), Tailwind 3 for legacy pages, Node 20 in CI, theme submodule `themes/PaperMod` (only a few partials are still used) |
| Deploy | `.github/workflows/hugo.yml`: push to `master` builds and deploys. It also runs hourly to refresh `apps/closet/cloud-model-catalog.json` from hechen/ai-model-catalog and redeploys only when that file changed. |
| Languages | English default at `/…`; Chinese originals of posts at `/zh-cn/post/…`. Apps, Gear, About are English only; `/zh-cn/` forwards to `/zh-cn/post/`. |
| Comments | Giscus on posts and gear notes, one thread per post shared by both languages, keyed to the English permalink (`layouts/partials/comments.html`). `commentId` in front matter overrides it (Keeps post uses its old `/zh-cn/…` thread). |

## Open items (as of 2026-09-25)

1. **Three local commits are not pushed.** `git log origin/master..master`:
   - `6151fd57` Keeps 1.2.1 status copy (Chen, 2026-09-24).
   - `45ae54d9` App Store release watcher (see below).
   - the commit adding this handoff and `AGENTS.md`.
   The push is rejected because the `gh` token lacks the `workflow` scope (it has
   `repo`, `gist`, `read:org`), and `45ae54d9` adds `.github/workflows/release-watch.yml`.
   Chen needs to run `gh auth refresh -h github.com -s workflow` (browser sign-in),
   then `git push origin master`.
2. **Release watcher needs its App Store Connect key.** Create a Team API key and set
   repo secrets `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`; steps in
   `docs/release-watch.md`. The minimum key role is unverified: try Marketing, use
   App Manager if the first run gets a 403. The watcher has been tested with fixture
   data and a sandbox clone only, not against the real API. First real trigger is
   likely LiftCoach 1.0.1 (iOS + Mac, Waiting for Review) or Keeps 1.2.1 (iOS + Mac,
   Waiting for Review). Check the first PR it opens carefully.
3. **Chen's uncommitted work in the tree — leave it alone unless asked:**
   `assets/css/main.css` + `content/apps/closet/_index.html` (a new "browser import"
   section for Closet), `static/images/posts/reveal-bundleid-application/finder-info-plist.png`
   (replacement screenshot), `design-qa.md` (notes from an older design pass, now stale).
4. The Now page (`content/now/_index.html`) says "Last updated 28 April 2026" and its
   status list is out of date. Only LiftCoach was removed from its TestFlight list.
5. Dependabot reports 6 vulnerabilities (3 high) in npm dev dependencies
   (Tailwind toolchain); open dependabot branches exist on origin.
6. Hugo warns `.Language.LanguageCode` is deprecated; it comes from the PaperMod theme
   (`rss.xml`, `opengraph.html`), not from our layouts.
7. Photography (`content/photography/_index.html`) is a placeholder page.

## Design system ("Workbench", Sept 2026)

- `assets/css/site.css`: tokens (`--bg`, `--ink`, `--accent`, `--signal`, fonts,
  `--measure: 680px`) on `:root`, dark values on `html.dark`. Everything is scoped by
  class; `body.chen` is the page root. Fonts from Google Fonts in
  `layouts/partials/head.html`: Instrument Serif (display), Geist (UI), Geist Mono
  (metadata), Newsreader (English long-form, posts and gear only). Chinese posts use
  the system CJK sans (`.is-cjk`).
- Dark mode: inline script in `head.html` sets `html.dark` from
  `localStorage['chen-theme']` or the system setting; `assets/js/site.js` handles the
  toggle, masthead scroll state, `.reveal` fade-ins, and tells Giscus to switch theme.
  Code blocks follow the page theme unless the reader picked one
  (`localStorage['chen-code-theme']`, `assets/js/code-themes.js`, `assets/css/code-themes.css`).
- `.legacy` (in `site.css`) re-skins the hand-authored Tailwind app pages, Now and
  Tools: it remaps slate/white/accent utility classes to the tokens. New pages should
  use the token-based components, not Tailwind utilities.

## Layout map

| Page | Template |
|---|---|
| Base, head, header, footer | `layouts/_default/baseof.html`, `layouts/partials/{head,header,footer,extend_head}.html` |
| Home | `layouts/index.html` (hero, live "On the bench" board, apps, 6 latest notes, 3 gear photos) |
| Writing archive (all posts on one page, grouped by year; no pagination) | `layouts/post/list.html` |
| Post | `layouts/post/single.html` (TOC rail ≥1180px, progress bar, translation link, optional `video:` bundle file) |
| Gear list / note | `layouts/gear/list.html` (category filter JS), `layouts/gear/single.html` |
| Apps catalog / app pages | `layouts/apps/list.html` + `layouts/partials/app-catalog.html`; app pages render `content/apps/<app>/_index.html` inside `.legacy` |
| About | `layouts/page/about.html` (content file only sets `layout: about`) |
| Topics, tag pages, 404 | `layouts/_default/terms.html`, `layouts/_default/list.html`, `layouts/404.html` |
| Shortcodes | `note`, `warning`, `pullquote`, `full-width-image`, `photo-gallery` (gear `gallery:` front matter) |

## Content how-tos

- **New post:** create `content/post/<slug>/index.en.md` and `index.zh-cn.md` with the
  same `slug` and `date`. Front matter: `title`, `slug`, `date`, `description`,
  `categories`, `tags`. The post template detects Chinese automatically.
- **App catalog:** `data/apps.yaml` drives the home page and `/apps/`. `featured: true`
  gets a large home card (Structly, LiftCoach). `appStoreId` is the App Store Connect
  Apple ID used by the release watcher. `store:` adds the "Get the app" button.
- **App page:** hand-authored HTML in `content/apps/<app>/_index.html`, plus
  `privacy.html` / `support.html`. App Store Connect support and privacy URLs point at
  these, so keep the paths stable. Keeps uses its own `assets/css/keeps.css` (`keeps: true`).
- **Gear note:** `content/gear/<slug>.md` (or a bundle) with `category`, `date`,
  `image`, `imageAlt`, optional `gallery`, `purchaseURL`, `purchased`. Photos go in
  `static/gear/<slug>/`; run `npm run check:photos`.
- **App released:** the watcher opens a PR (below). By hand, follow the LiftCoach
  example: `store:` in `data/apps.yaml`, swap the TestFlight button on the app page for
  an App Store link, remove the app from the Now page's TestFlight list, and write a
  bilingual post (`content/post/liftcoach-on-the-app-store/`).

## App Store release watcher

`scripts/release_watch.py`, run hourly by `.github/workflows/release-watch.yml`
(not yet on origin; see open item 1). For each app with an `appStoreId`, it lists App
Store versions; a version newer than any already recorded that App Store Connect
reports as distributed produces a `release/<slug>` branch and a PR containing:

- a bilingual post from the version's localizations (`en-US`, `zh-Hans`): What's New
  for updates, promotional text + description for a first release;
- a `store:` link in `data/apps.yaml` on a first release;
- marker files in `.github/release-watch/seen/` (seeded 2026-09-25 with every released
  version, so nothing old gets posted).

Chen merges to publish or closes the PR (keeping the branch) to skip. The PR warns
when store text mentions a price. Promo videos come from the App Store Connect app's
Share button (no API): Chen saves them to iCloud Drive › Blog › Release videos and runs
`python3 scripts/attach_release_video.py <slug>`, which converts with `avconvert` and
pushes `release.mp4` to the PR branch. Full details: `docs/release-watch.md`.
Dry run: `python3 scripts/release_watch.py --fixture scripts/release_watch_fixture.json --out /tmp/preview`.

## Verifying a change

1. `hugo --gc --minify` with no errors (the PaperMod deprecation warning is expected),
   then `npm run build:css`.
2. Serve `public/` and check the home page, `/post/`, a post in both languages, `/gear/`,
   `/apps/`, one legacy app page (e.g. `/apps/liftcoach/`) in light and dark mode, at
   desktop width and at 375px (no horizontal scroll).
3. After pushing, `gh run list --limit 1` should show the Pages deploy succeeded.

## Recent history

| Commit | Change |
|---|---|
| `8f52798d` | Workbench redesign: new design system, all core templates, dark mode |
| `9110d2a5` → `01d90380` | Briefly English-only, then bilingual: Chinese originals renamed to `index.zh-cn.md` and published at `/zh-cn/post/` |
| `3c2e9d6a`, `c1930411` | LiftCoach 1.0.0 (iOS) on the App Store: store links and launch post |
| `39e5f39f` | Chen corrected LiftCoach claims: no Mac app yet, demos without custom video |
| `47238448`, `fc439343`, `6151fd57` | Keeps availability and 1.2.1 review-status copy |
| `45ae54d9` | Release watcher, video helper, `appStoreId` in the catalog (unpushed) |
