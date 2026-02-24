/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          pink: '#FF00FF',
          blue: '#00BFFF',
          dark: '#1a1a2e',
          darker: '#0f0f1e',
        },
      },
      fontFamily: {
        anton: ['Anton', 'sans-serif'],
        'anton-sc': ['Anton SC', 'sans-serif'],
        'lilita-one': ['Lilita One', 'cursive'],
        'saira-condensed': ['Saira Condensed', 'sans-serif'],
        'rock-salt': ['Rock Salt', 'cursive'],
      },
    },
  },
  plugins: [],
}
