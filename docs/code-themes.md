# Code themes

Fenced code blocks use Hugo's built-in Chroma highlighter. The shared head partial
generates GitHub Light, GitHub Dark, and Dracula CSS with `css.ChromaStyles`
(Hugo 0.165.0+, also pinned in CI). No client-side highlighter or CDN is needed.

Each code block gets a native **Code theme** selector. A choice applies to all
blocks, persists in `chen-code-theme` local storage, and follows the reader across
pages and tabs. GitHub Light is the default, with a darker syntax palette, 15px medium-weight
code, and distinct toolbar and control borders for readability. If JavaScript or storage is unavailable,
the default syntax colors remain readable; storage failures do not prevent switching
within the page. Inline code and the page theme are independent.

Use a language identifier on fenced blocks, such as `swift`, `javascript`, `json`,
or `bash`. Plain text and unrecognized languages get the same background and
controls, but cannot acquire meaningful syntax colors from a palette alone.

Keep `markup.highlight.noClasses = false`. The code palette stylesheet is loaded
after the editorial CSS so old page-specific `pre` rules cannot override it.

Verify a Swift article and another language after changes: different keyword and
string colors in all themes, synchronized selectors, reload/navigation persistence,
phone-width scrolling, and unchanged code text. Also check a page with no snippets
has no controls. See [Hugo syntax highlighting](https://gohugo.io/content-management/syntax-highlighting/)
and [css.ChromaStyles](https://gohugo.io/functions/css/chromastyles/).
