/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quantum: {
          400: '#A855F7',
          500: '#8B5CF6',
          900: '#1A0B2E'
        }
      }
    },
  },
  plugins: [],
}
