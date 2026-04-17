import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          blue: '#60a5fa',
          cyan: '#22d3ee',
          lime: '#84cc16',
          rose: '#fb7185',
          amber: '#f59e0b',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(148,163,184,0.2), 0 12px 36px rgba(15,23,42,0.35)',
      },
      animation: {
        pulseSlow: 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
