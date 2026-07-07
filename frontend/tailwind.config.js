/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bloodred: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#d91a2a', // Primary blood red
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#4c0505',
        },
        slate: {
          950: '#070a13', // Premium extra dark slate
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        glow: '0 0 15px rgba(217, 26, 42, 0.4)',
      }
    },
  },
  plugins: [],
}
