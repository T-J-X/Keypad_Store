import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  safelist: [
    'shadow-[0_12px_35px_-20px_rgba(0,0,0,0.75)]',
    'hover:shadow-[0_18px_55px_-25px_rgba(56,189,248,0.65)]',
    'active:translate-y-[1px]',
    'hover:ring-sky-400/70',
    'focus-visible:ring-sky-400',
    'bg-[radial-gradient(80%_120%_at_50%_50%,rgba(56,189,248,0.35)_0%,rgba(30,64,175,0.22)_45%,rgba(0,0,0,0)_75%)]',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
        sans: ['var(--font-geist-sans)', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0E111A',
          muted: '#525866',
          subtle: '#99A0AE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F7F8FA',
          border: '#E2E4E9',
        },
        // "The Unified Geist System" - Dark Panel Tokens
        panel: {
          DEFAULT: '#0A1628', // Deep Navy (Solid)
          light: '#0E1E38',   // Lighter Navy (Nested cards)
          border: '#1A3058',  // Panel Borders
          muted: '#8BA3C7',   // Muted Text on Dark
          input: '#0d1f3b',   // Input background
          ring: '#1E2D4A',    // Input ring/border
        },
        mist: '#f5f3ef',
        shell: '#ffffff',
        cloud: '#e7ecf3',
        moss: '#1b7f6a',
        coral: '#ff6b57',
        sky: {
          DEFAULT: '#4aa4ff',
          400: '#38bdf8',
        },
        'deep-navy': '#020617',
        'pure-white': '#ffffff',
      },
      borderRadius: {
        DEFAULT: '8px',
        btn: '8px',
        input: '8px',
        card: '12px',
        sm: '4px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        refined: '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 0 0 1px rgba(56, 189, 248, 0.25), 0 8px 20px rgba(56, 189, 248, 0.1)',
      }
    }
  },
  plugins: []
} satisfies Config;
