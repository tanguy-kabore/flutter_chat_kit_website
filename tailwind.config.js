/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        violet: {
          deep: '#5B4A8A',
          accent: '#9C7CF4',
          mid: '#7B6BA8',
          soft: '#B39DDB',
          light: '#EDE7F6',
          pale: '#F3EEFF',
          bg: '#F8F5FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
