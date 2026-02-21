import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
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
        btn: '10px',
        input: '10px',
        card: '16px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(14, 17, 26, 0.08)',
        refined: '0 2px 8px -1px rgba(14, 17, 26, 0.04)',
        glow: '0 0 0 1px rgba(56, 189, 248, 0.25), 0 8px 24px rgba(56, 189, 248, 0.15)',
        premium: '0 20px 40px -4px rgba(14, 17, 26, 0.08), 0 0 2px rgba(14, 17, 26, 0.04)',
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
      }
    }
  },
  plugins: []
} satisfies Config;
