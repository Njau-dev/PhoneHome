/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgdark: 'var(--background-dark)',
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary)',
        accent: 'var(--accents)',
        border: 'var(--border-color)'
      },
    },
  },
  plugins: [],
};