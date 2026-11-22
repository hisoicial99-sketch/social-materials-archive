/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./site/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#142438', 2: '#243B55' },
        surface: '#F4F6F9',
        line: '#E2E8F0',
        muted: '#64748B',
        body: '#475569',
      },
    },
  },
  plugins: [],
};
