# AGENTS.md — hechen.github.io

Chen's personal site: blog (English + original Chinese), app catalog and app
pages, gear notes. Hugo site deployed to GitHub Pages from `master`.

**Read `docs/HANDOFF.md` first.** It has the current state, open items, and how-tos.

## Rules

- Pushing to `master` deploys the live site. Commit only files you changed; Chen
  often has unrelated work in progress in the tree (check `git status`).
- App catalog copy (`data/apps.yaml`): no prices, build numbers, or review status.
  App pages also avoid prices (since `d2246364`); prices and review status in posts
  are Chen's call. Only claim features and platforms the shipping app
  actually has; confirm against App Store Connect or the store listing, not existing
  site copy (LiftCoach copy was corrected for this in `39e5f39f`).
- Posts are bilingual page bundles: `content/post/<slug>/index.en.md` (default,
  `/post/<slug>/`) and `index.zh-cn.md` (the Chinese original, `/zh-cn/post/<slug>/`).
  Keep both when adding or editing a post.
- Design lives in `assets/css/site.css` (tokens on `:root` / `html.dark`). Don't add
  styles to `assets/css/main.css` for new templates; that file is the legacy Tailwind
  layer for hand-authored app pages.
- Gear photos must pass `npm run check:photos` (strips location metadata).

## Build and preview

```bash
hugo --gc --minify                     # site into public/
npm run build:css                      # photo checks + Tailwind into public/css/tailwind.css
python3 -m http.server 8765 -d public  # preview (hugo server lacks the Tailwind bundle)
```

CI (`.github/workflows/hugo.yml`) runs the same two builds on push and PR.
