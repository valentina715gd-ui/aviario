/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#23332c',
        moss: '#506b52',
        sage: '#dce8d8',
        coral: '#e8785d',
        cream: '#f5f7f2',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
}
