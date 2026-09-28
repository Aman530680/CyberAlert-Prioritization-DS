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
        app: '#09090b',
        sidebar: '#0b0b0e',
        card: '#101013',
        'card-hover': '#131317',
        inset: '#0c0c0f',
        border: '#1c1c22',
        'border-strong': '#27272f',
        'text-1': '#f4f4f5',
        'text-2': '#a1a1aa',
        'text-3': '#71717a',
        'text-4': '#52525b',
        amber: {
          DEFAULT: '#d4a03c',
          dim: 'rgba(212,160,60,0.12)',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          dim: 'rgba(6,182,212,0.12)',
        },
        blue: {
          DEFAULT: '#3b82f6',
          dim: 'rgba(59,130,246,0.12)',
        },
        green: {
          DEFAULT: '#22c55e',
          dim: 'rgba(34,197,94,0.12)',
        },
        orange: {
          DEFAULT: '#f59e0b',
          dim: 'rgba(245,158,11,0.12)',
        },
        red: {
          DEFAULT: '#dc2626',
          dim: 'rgba(220,38,38,0.14)',
        },
      },
      borderRadius: {
        card: '10px',
        btn: '6px',
        input: '6px',
        badge: '4px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'kpi': ['38px', { lineHeight: '1', fontWeight: '500', letterSpacing: '-0.02em' }],
        'title': ['16px', { lineHeight: '24px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body': ['13px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0' }],
        'small': ['12px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0' }],
        'card-label': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.12em' }],
        'micro': ['10px', { lineHeight: '12px', fontWeight: '500', letterSpacing: '0.14em' }],
      },
      boxShadow: {
        'card-top': 'inset 0 1px 0 rgba(255,255,255,0.03)',
        'glow-blue': '0 0 40px rgba(59,130,246,0.18)',
        'glow-amber': '0 0 24px rgba(212,160,60,0.12)',
      },
      transitionTimingFunction: {
        'soc-ease': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '320ms',
      },
      spacing: {
        'sidebar-w': '208px',
        'sidebar-collapsed': '56px',
        'topbar-h': '56px',
        'subbar-h': '36px',
      },
    },
  },
  plugins: [],
}
