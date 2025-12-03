/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        accent: '#2563EB',
        'accent-dark': '#1D4ED8',
        'neutral-bg': '#F5F7FB',
        'surface-light': '#FFFFFF',
        'surface-muted': '#EFF1F6',
      },
      boxShadow: {
        card: '0 25px 45px rgb(15 23 42 / 0.12)',
      },
    },
  },
  plugins: [],
}
