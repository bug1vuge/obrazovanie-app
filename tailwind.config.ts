import type { Config } from 'tailwindcss';

const withVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: withVar('--color-primary'),
        secondary: withVar('--color-secondary'),
      },
    },
  },
  plugins: [],
} satisfies Config;
