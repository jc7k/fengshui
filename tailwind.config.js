/**
 * Design tokens from do-work/user-requests/UR-002/assets/DESIGN-apple.md.
 *
 * Two of these blocks *replace* the Tailwind defaults rather than extending
 * them, which is deliberate — it makes two of the document's rules mechanical
 * instead of aspirational:
 *
 *   - `fontWeight` drops 500 entirely. The document's ladder is 300/400/600/700
 *     with 500 "deliberately absent", so `font-medium` simply stops existing.
 *   - `borderRadius` drops xl/2xl/3xl. The document says not to mix radii
 *     grammars; the scale below is the whole grammar.
 *
 * `colors` and `spacing` extend instead, because replacing them would take out
 * white/black/transparent and the numeric spacing scale the layout relies on.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Replaced, not extended — see the note above.
    fontWeight: {
      light: '300',
      normal: '400',
      semibold: '600',
      bold: '700',
    },
    borderRadius: {
      none: '0px',
      xs: '5px',
      DEFAULT: '8px',
      sm: '8px',
      md: '11px',
      lg: '18px',
      pill: '9999px',
      full: '9999px',
    },
    extend: {
      fontFamily: {
        // System stack only: resolves to real SF Pro on Apple platforms and
        // costs zero bytes. The document offers Inter as the substitute, but
        // this app already pays 23.4s to interactive on Fast 3G.
        display: ['system-ui', '-apple-system', 'sans-serif'],
        text: ['system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: '#0066cc',
        'primary-focus': '#0071e3',
        'primary-on-dark': '#2997ff',
        // `body` from the document is intentionally omitted: it is the same hex
        // as `ink`, and defining both would make `text-body` ambiguous against
        // the `body` font-size token below.
        ink: '#1d1d1f',
        'body-on-dark': '#ffffff',
        'body-muted': '#cccccc',
        'ink-muted-80': '#333333',
        'ink-muted-48': '#7a7a7a',
        'divider-soft': '#f0f0f0',
        hairline: '#e0e0e0',
        canvas: '#ffffff',
        'canvas-parchment': '#f5f5f7',
        'surface-pearl': '#fafafc',
        'surface-tile-1': '#272729',
        'surface-tile-2': '#2a2a2c',
        'surface-tile-3': '#252527',
        'surface-black': '#000000',
        'surface-chip-translucent': '#d2d2d7',
        'on-primary': '#ffffff',
        'on-dark': '#ffffff',

        // Not in the document. Severity is semantic status, not an interactive
        // signal, so it does not violate the single-accent rule — see the
        // Deviations section in REQ-020. Tuned to sit beside Action Blue.
        'severity-warning': '#b25000',
        'severity-warning-surface': '#fff4ec',
        'severity-warning-hairline': '#f0d3c0',
        'severity-info': '#0066cc',
        'severity-info-surface': '#eef4fc',
        'severity-info-hairline': '#cfe0f5',
      },
      fontSize: {
        'hero-display': ['56px', { lineHeight: '1.07', letterSpacing: '-0.28px' }],
        'display-lg': ['40px', { lineHeight: '1.1', letterSpacing: '0px' }],
        'display-md': ['34px', { lineHeight: '1.47', letterSpacing: '-0.374px' }],
        lead: ['28px', { lineHeight: '1.14', letterSpacing: '0.196px' }],
        'lead-airy': ['24px', { lineHeight: '1.5', letterSpacing: '0px' }],
        tagline: ['21px', { lineHeight: '1.19', letterSpacing: '0.231px' }],
        'body-strong': ['17px', { lineHeight: '1.24', letterSpacing: '-0.374px' }],
        body: ['17px', { lineHeight: '1.47', letterSpacing: '-0.374px' }],
        'dense-link': ['17px', { lineHeight: '2.41', letterSpacing: '0px' }],
        caption: ['14px', { lineHeight: '1.43', letterSpacing: '-0.224px' }],
        'caption-strong': ['14px', { lineHeight: '1.29', letterSpacing: '-0.224px' }],
        'button-large': ['18px', { lineHeight: '1', letterSpacing: '0px' }],
        'button-utility': ['14px', { lineHeight: '1.29', letterSpacing: '-0.224px' }],
        'fine-print': ['12px', { lineHeight: '1', letterSpacing: '-0.12px' }],
        'micro-legal': ['10px', { lineHeight: '1.3', letterSpacing: '-0.08px' }],
        'nav-link': ['12px', { lineHeight: '1', letterSpacing: '-0.12px' }],
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '17px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '80px',
      },
    },
  },
  plugins: [],
};
