import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ink: '#0c111a',
        mist: '#f5f3ef',
        shell: '#ffffff',
        cloud: '#e7ecf3',
        moss: '#1b7f6a',
        coral: '#ff6b57',
        sky: '#4aa4ff'
      },
      boxShadow: {
        soft: '0 16px 40px rgba(14, 17, 26, 0.12)',
        glow: '0 0 0 1px rgba(74, 164, 255, 0.25), 0 16px 40px rgba(14, 17, 26, 0.18)'
      }
    }
  },
  plugins: []
} satisfies Config;
