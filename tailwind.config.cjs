/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2050A0',
          hover: '#004098',
          pale: '#E6EEF9'
        }
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
};
