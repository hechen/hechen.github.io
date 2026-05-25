/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './layouts/**/*.html',
    './content/**/*.{html,md}',
    './static/**/*.html',
  ],
  // Samwanng-inspired redesign: light mode only. Drop the `dark:` variants;
  // the theme toggle is removed from the header. If a Tailwind `dark:` class
  // survives from the legacy pages, it stays inert (no `dark` class on
  // <html>), which is the desired behaviour during the transitional period
  // before legacy markup is restyled.
  darkMode: 'class',
  theme: {
    extend: {
      // Type stack — Source Serif 4 (Latin) paired with Noto Serif SC (CJK),
      // matching the Jinhua Serif Latin / Jinhua Serif C pairing on
      // samwanng.com. Both fonts are free / Google Fonts-hosted; the CJK
      // fallback chain (Songti SC → STSong) targets system fonts for
      // CJK readers when the webfont is slow or blocked.
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        // Phase 2d: blog post body type. Source Serif 4 (Adobe, free,
        // open-source, optical sizing) → ui-serif fallback → Charter
        // (ships on macOS) → Georgia (universally available).
        serif: ['"Source Serif 4"', 'ui-serif', 'Charter', 'Georgia', 'Cambria', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      // Palette taken straight from samwanng.com's :root custom properties.
      // No accent: samwanng has effectively zero brand colour — the dot
      // separator and underline-on-hover do all the wayfinding. Tailwind
      // colour keys mirror the CSS variables so utilities and bare CSS
      // refer to the same hex values.
      colors: {
        paper: '#ffffff',
        surface: '#ffffff',
        'surface-muted': '#f5f5f5',
        ink: '#0a0a0a',
        muted: '#525252',
        faint: '#a3a3a3',
        line: '#ebebeb',
        'line-strong': '#e0e0e0',
        // Status pills keep their semantic colours (App Store green,
        // TestFlight amber). These remain the only chromatic punctuation
        // on the site.
        'pill-live': '#15803d',
        'pill-tf': '#b45309',
        'pill-coming': '#525252',
        // Legacy alias — content/now and content/tools still reference
        // .text-accent and .bg-accent for accent-coloured chips and the
        // pulse dot. Aliasing accent → ink keeps those pages rendering
        // acceptably without rewriting the markup. samwanng's design
        // language has no accent colour, so ink is the right fallback.
        accent: { DEFAULT: '#0a0a0a', dark: '#0a0a0a' },
      },
      maxWidth: {
        // samwanng uses --max-content: 1320px on .site-container. The
        // entry-list inner width is narrower (~960px effective via padding).
        // Match both: container 1320, prose column 720.
        content: '1320px',
        prose: '720px',
      },
      letterSpacing: {
        // Tight tracking on the wordmark, per samwanng's -2.4px @ 30px
        // (-0.08em) and -2px @ 56px on detail-page titles.
        brand: '-0.08em',
        title: '-0.025em',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
