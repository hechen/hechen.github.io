# App Store release watcher

Every hour, `.github/workflows/release-watch.yml` asks App Store Connect about
each app in `data/apps.yaml` that has an `appStoreId`. When a version becomes
available on the App Store, it opens a pull request with a blog post in English
and Chinese. Merge the PR to publish; the normal deploy runs on merge.

## What the post contains

- **Update (1.0.1, 1.1, 2.0):** an availability line with the App Store link, then
  the version's **What's New** text from App Store Connect.
- **First release:** the promotional text and the App Store description. The PR
  also adds the app's `store:` link to `data/apps.yaml`.
- English comes from the `en-US` localization, Chinese from `zh-Hans`. If an app
  has no Chinese listing, the post is English-only.
- Platforms released together (for example iOS and Mac 1.0.1) share one post.

The PR description warns when the store text mentions a price, because app pages
on this site avoid prices. Edit the post on the PR branch before merging if needed.

## Skipping a release

Close the PR and keep its `release/<slug>` branch. The watcher never recreates a
branch that already exists, so the release will not come back.

## Adding the promo video

App Store Connect has no API for the celebration video the App Store Connect app
offers when a version is ready. To add it:

1. In the App Store Connect app, tap **Share** on the release, then
   **Save to Files › iCloud Drive › Blog › Release videos**.
2. On the Mac, run the command from the PR description:

   ```bash
   python3 scripts/attach_release_video.py <slug>
   ```

It converts the newest video in that folder with macOS's built-in `avconvert`
(H.264, up to 1080p, location and other source metadata stripped), adds it to
the post as `release.mp4`, and pushes it to the PR branch.

## One-time setup

1. In App Store Connect, go to **Users and Access › Integrations › App Store
   Connect API › Team Keys** and generate a key. Use the lowest role that can
   read app versions and metadata (try **Marketing**; use **App Manager** if the
   first run reports a 403). Download the `.p8` file (it can only be downloaded
   once) and note the **Key ID** and the **Issuer ID**.
2. Save them as repository secrets:

   ```bash
   gh secret set ASC_KEY_ID --repo hechen/hechen.github.io
   gh secret set ASC_ISSUER_ID --repo hechen/hechen.github.io
   gh secret set ASC_PRIVATE_KEY --repo hechen/hechen.github.io < AuthKey_XXXXXXXXXX.p8
   ```

3. Start a run to check it (or wait for the hourly one):

   ```bash
   gh workflow run release-watch.yml --repo hechen/hechen.github.io
   ```

Until the secrets exist, the workflow exits early with a notice.

## State and new apps

Versions already covered are empty files in `.github/release-watch/seen/`
(`<appId>-<platform>-<version>`). Only versions newer than the newest seen one
per platform get posts, so old releases never resurface. To watch a new app,
add its App Store Connect Apple ID as `appStoreId` in `data/apps.yaml`.

Dry run with canned data:

```bash
python3 scripts/release_watch.py --fixture scripts/release_watch_fixture.json --out /tmp/release-preview
```
