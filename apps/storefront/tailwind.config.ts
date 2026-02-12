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
        mist: '#f5f3ef',
        shell: '#ffffff',
        cloud: '#e7ecf3',
        moss: '#1b7f6a',
        coral: '#ff6b57',
        sky: {
          DEFAULT: '#4aa4ff',
          400: '#38bdf8',
        }
      },
      letterSpacing: {
        tightest: '-0.02em',
        widest: '0.1em',
      },
      boxShadow: {
        soft: '0 16px 40px rgba(14, 17, 26, 0.12)',
        glow: '0 0 0 1px rgba(74, 164, 255, 0.25), 0 16px 40px rgba(14, 17, 26, 0.18)',
        premium: '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 4px 10px -5px rgba(0, 0, 0, 0.02)',
        glass: '0 8px 32px 0 rgba(14, 17, 26, 0.05)',
      }
    }
  },
  plugins: []
} satisfies Config;
