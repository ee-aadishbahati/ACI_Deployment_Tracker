/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D6EFD',
          dark: '#0b5ed7',
          light: '#6ea8fe',
        }
      },
    },
  },
  plugins: [],
}
