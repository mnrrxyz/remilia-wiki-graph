/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'remilia-black': '#000000',
        'remilia-gray': '#666666',
        'remilia-white': '#FFFFFF',
      },
      opacity: {
        '15': '0.15',
        '30': '0.30',
      }
    },
  },
  plugins: [],
}
