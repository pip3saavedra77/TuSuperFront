/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,scss}',
  ],
  theme: {
    extend: {
      colors: {
        'ts-bg': '#fbf9f8',
        'ts-surface': 'rgba(255, 255, 255, 0.4)',
        'ts-on-surface': '#1b1c1c',
        'ts-on-surface-variant': '#3c4a3c',
        'ts-primary': '#00c853',
        'ts-primary-dark': '#006e2a',
        'ts-primary-container': '#00c853',
        'ts-primary-fixed': '#69ff87',
        'ts-on-primary': '#ffffff',
        'ts-secondary': '#5f5e5e',
        'ts-secondary-container': '#e5e2e1',
        'ts-error': '#ba1a1a',
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'ts-nav': '0 15px 40px rgba(0, 0, 0, 0.1)',
        'ts-promo': '0 8px 32px rgba(0, 200, 83, 0.15)',
        'ts-card': '0 4px 12px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'ts-card': '28px',
        'ts-icon': '24px',
        'ts-order': '20px',
      },
    },
  },
  plugins: [],
}
