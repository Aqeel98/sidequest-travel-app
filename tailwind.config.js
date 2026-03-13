/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        // Custom aesthetic colors based on your image
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf', // Main bright teal
          500: '#14b8a6', // Darker teal
          600: '#0d9488',
          800: '#115e59',
          900: '#134e4a',
        }
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1', borderColor: 'rgba(45,212,191,0.6)' },
          '50%':       { opacity: '0.85', borderColor: 'rgba(45,212,191,1)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}