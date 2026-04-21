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
        glow: '0 0 0 1px rgba(148,163,184,0.12), 0 8px 24px rgba(15,23,42,0.4)',
      },
      animation: {
        pulseSlow: 'pulse 2s ease-in-out infinite',
        wave: 'wave 1.2s ease-in-out infinite alternate',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
      },
      keyframes: {
        wave: {
          '0%': { transform: 'scaleY(0.35)' },
          '100%': { transform: 'scaleY(1)' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
