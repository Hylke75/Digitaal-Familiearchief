import type { Config } from 'tailwindcss';

/**
 * Design tokens — the single source of truth for the visual system
 * (docs/DESIGN.md §3–§5, §55). Warm, calm, human. Photos are the colour; the
 * interface around them stays quiet. 4/8px spacing rhythm.
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand — Archive Green (docs/BRAND.md). Token names are kept stable so
        // existing `forest`/`warm`/`ink` classes adopt the refreshed palette.
        forest: {
          DEFAULT: '#1D3D2A', // Primary — Archive Green
          hover: '#142C1E', // Archive Green Dark (hover/darker panels)
        },
        archive: '#1D3D2A', // semantic alias
        // Surfaces
        warm: '#FAF6F1', // Warm Paper background
        surface: '#FFFFFF',
        border: '#E5E7E3', // decorative card borders (not interactive controls)
        'border-strong': '#7F8981', // interactive control boundaries (≥3:1)
        // Text
        ink: {
          DEFAULT: '#1B211D', // Charcoal Green — text primary
          soft: '#59635C', // Secondary text
        },
        // Accent — use sparingly (timeline, ownership/export, premium detail)
        brass: '#9B5B19',
        sage: '#A8B4A9',
        // Status
        success: '#237A57',
        warning: '#8A4B12', // accessible warning text (was #C67A19)
        danger: '#B64343',
        // Soft status fills
        'soft-green': '#E8F2ED',
        'soft-amber': '#F6ECDD',
        'soft-red': '#FAEAEA',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // docs/DESIGN.md §4 desktop scale
        caption: ['0.8125rem', { lineHeight: '1.1rem' }], // 13px
        small: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        body: ['1rem', { lineHeight: '1.6rem' }], // 16px
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        h3: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }], // 24px
        h2: ['2rem', { lineHeight: '2.4rem', fontWeight: '600' }], // 32px
        h1: ['2.75rem', { lineHeight: '3rem', fontWeight: '600' }], // 44px
      },
      borderRadius: {
        button: '10px',
        input: '10px',
        card: '16px',
        modal: '20px',
      },
      boxShadow: {
        // Very subtle, per §5
        card: '0 1px 2px rgba(23, 32, 29, 0.04), 0 4px 16px rgba(23, 32, 29, 0.05)',
        soft: '0 1px 2px rgba(23, 32, 29, 0.05)',
        modal: '0 10px 40px rgba(23, 32, 29, 0.12)',
      },
      maxWidth: {
        content: '1200px',
        shell: '1440px',
      },
      transitionDuration: {
        // §56 — 150–250ms only
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
