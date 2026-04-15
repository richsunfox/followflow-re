import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-pjs)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        // ── Always On design tokens ─────────────────────────────────────────
        ao: {
          // Backgrounds
          navy:    '#0F1629',   // primary bg (dark)
          surface: '#1A2540',   // card / panel surfaces
          light:   '#F7F8FC',   // main content bg (light)
          // Borders
          border:  '#1E2D4A',   // default subtle border
          // Accents
          blue:    '#3B7BFF',   // primary CTA, active states
          'blue-hover': '#2E6AEE',
          gold:    '#C9A84C',   // premium / guarantee badges only
          // Text
          muted:   '#8B9BB4',   // secondary labels, metadata
        },
      },
      keyframes: {
        'modal-in': {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1.00)' },
        },
        'backdrop-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'modal-in':    'modal-in 200ms ease-out both',
        'backdrop-in': 'backdrop-in 150ms ease-out both',
        'slide-up':    'slide-up 200ms ease-out both',
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)',
        'blue':   '0 0 24px rgba(59,123,255,0.30)',
        'blue-lg': '0 0 48px rgba(59,123,255,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
