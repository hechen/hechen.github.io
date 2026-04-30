/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan everything that could emit Tailwind classes — Hugo templates,
  // markdown content (some pages embed raw HTML with utility classes),
  // and the static/ tree (the legacy hand-edited HTML before Phase 2's
  // Hugo conversion). Keep static/ in scope so the runtime Tailwind in
  // pages we haven't migrated yet still gets its classes generated.
  content: [
    './layouts/**/*.html',
    './content/**/*.{html,md}',
    './static/**/*.html',
  ],
  // Class-based dark mode so the theme toggle in the header can flip
  // between light/dark by setting/removing the `dark` class on <html>.
  // Without this, dark: variants only fire from prefers-color-scheme
  // and the manual toggle has no effect.
  darkMode: 'class',
  // Inline tailwind.config from the legacy pages so the theme extensions
  // round-trip identically: the same accent teal, the same custom box
  // shadows, the same Inter font stack.
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        // Phase 2d: blog post body type. Source Serif 4 (Adobe, free,
        // open-source, optical sizing) → ui-serif fallback → Charter
        // (ships on macOS) → Georgia (universally available).
        serif: ['"Source Serif 4"', 'ui-serif', 'Charter', 'Georgia', 'Cambria', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        accent: { DEFAULT: '#0d9488', dark: '#14b8a6' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)',
        cardHover: '0 8px 24px rgba(13,148,136,0.10), 0 2px 6px rgba(15,23,42,0.08)',
        cardTilt: '0 20px 40px rgba(13,148,136,0.12), 0 6px 12px rgba(15,23,42,0.08)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
