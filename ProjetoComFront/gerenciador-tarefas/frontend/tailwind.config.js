/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── DARK / NIGHT CANVAS ──────────────────────────
        canvas: {
          light: '#0e0c14',   // near‑black with purple tint
          dark:  '#07060d',   // pure deep black
        },
        surface: {
          light: '#16121f',
          dark:  '#110e1a',
        },
        surfaceHover: {
          light: '#1e1830',
          dark:  '#1a1528',
        },
        border: {
          light: '#2a2040',
          dark:  '#1f1835',
        },
        // ── NEON ACCENT PALETTE (SKZ-inspired) ──────────
        brand: {
          50:  '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',   // electric yellow core
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        neon: {
          yellow:  '#e8f400',   // hyper‑yellow
          lime:    '#39ff14',   // neon green
          magenta: '#ff2d78',   // hot pink / magenta
          purple:  '#9333ea',   // electric violet
          cyan:    '#00f5ff',   // electric cyan
        },
        void: {
          900: '#07060d',
          800: '#0d0b17',
          700: '#14112a',
          600: '#1c1840',
          500: '#251f52',
          400: '#2f2867',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight:   '-0.025em',
        wide:    '0.08em',
        wider:   '0.14em',
      },
      boxShadow: {
        'subtle':      '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'card':        '0 2px 8px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(148,51,234,0.08)',
        'card-hover':  '0 4px 24px 0 rgba(0,0,0,0.5), 0 0 0 1px rgba(232,244,0,0.18)',
        'modal':       '0 25px 50px -12px rgba(0,0,0,0.8)',
        'neon-yellow': '0 0 16px 2px rgba(232,244,0,0.4)',
        'neon-purple': '0 0 16px 2px rgba(147,51,234,0.45)',
        'neon-pink':   '0 0 16px 2px rgba(255,45,120,0.4)',
      },
      backgroundImage: {
        'grid-dots': 'radial-gradient(rgba(148,51,234,0.18) 1px, transparent 1px)',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(147,51,234,0.35), transparent)',
        'card-shine': 'linear-gradient(135deg, rgba(232,244,0,0.06) 0%, transparent 60%)',
      },
      backgroundSize: {
        'dots': '22px 22px',
      },
      animation: {
        'fade-in':       'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-up':      'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':      'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-pulse':    'glowPulse 2.4s ease-in-out infinite',
        'glitch':        'glitch 3.5s steps(2, end) infinite',
        'scan-line':     'scanLine 5s linear infinite',
        'float':         'float 3s ease-in-out infinite',
        'neon-flicker':  'neonFlicker 4s linear infinite',
        'border-spin':   'borderSpin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%':   { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px 1px rgba(232,244,0,0.3)' },
          '50%':      { boxShadow: '0 0 22px 4px rgba(232,244,0,0.55)' },
        },
        glitch: {
          '0%':   { clipPath: 'inset(0 0 100% 0)', transform: 'translate(0)' },
          '2%':   { clipPath: 'inset(30% 0 50% 0)', transform: 'translate(-2px, 2px)' },
          '4%':   { clipPath: 'inset(60% 0 10% 0)', transform: 'translate(2px, -1px)' },
          '5%':   { clipPath: 'inset(0 0 100% 0)', transform: 'translate(0)' },
          '100%': { clipPath: 'inset(0 0 100% 0)', transform: 'translate(0)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.7' },
        },
        borderSpin: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
