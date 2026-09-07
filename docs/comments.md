# Article and gear comments

The site includes a shared [Giscus](https://giscus.app/) integration for blog posts
and individual gear notes, including older HTML gear pages. The local configuration
is enabled with the repository's Announcements category. Discussions and the
Giscus app are enabled on GitHub; the app is scoped to `hechen/hechen.github.io`
only. Index, app, support, and privacy pages do not get comments.

## Activate

1. Enable Discussions in the `hechen/hechen.github.io` repository settings.
2. Install the [Giscus GitHub app](https://github.com/apps/giscus) for this repository.
3. In [Giscus configuration](https://giscus.app/), select `hechen/hechen.github.io`
   and the Announcements category (or create a dedicated announcement-type category).
4. Copy the real `data-category-id` into `params.giscus.categoryId` in `hugo.toml`.
   If using another category, also update `category`. The repository ID is already set.
5. Set `params.comments = true`, build, preview an article and a gear note, and deploy.
   The build fails if comments are enabled with incomplete configuration.
6. Verify the live embed and GitHub login. With the site owner's authorization,
   leave a real comment, reload, and check that it persists in Discussions. This
   creates public content; a successful Hugo build alone does not verify delivery.

Readers can view comments without signing in. Posting requires a GitHub account
and authorizing Giscus. Replies, reactions, and moderation live in GitHub Discussions.
No API tokens belong in the website configuration. The widget uses lazy iframe
loading, a light theme matching the site, and a GitHub link if the embed is blocked.

## Thread identity and controls

- Chinese and English versions share the Chinese page's permalink as a strict
  discussion key. Chinese blog pages show the Chinese widget; English articles
  and gear notes show the English widget.
- Before changing an article URL, add `commentId: /post/original-slug/` to the
  canonical article's front matter to retain its existing thread. The same applies
  to gear URLs. Titles can change without splitting comments.
- Set `comments: false` in a page's front matter to hide its comments.
- Set `params.comments = false` to disable comments site-wide (unless a page
  explicitly opts in with `comments: true`). Disabling the widget does not delete
  discussions.
- Giscus creates a discussion on the first comment or reaction. An empty thread
  before that is expected.

## Local validation

Run `hugo --gc --minify`, `npm run build:css`, and `git diff --check`.
After activation, inspect a Chinese/English article pair, a Markdown gear note,
and an older HTML gear note at desktop and mobile widths. Check that paired
articles have the same `data-term` and that index and app pages have no widget.
