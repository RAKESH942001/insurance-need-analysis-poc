/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        axis: {
          burgundy: '#871834',
          deepBurgundy: '#650f24',
          lightBurgundy: '#a82344',
          accent: '#b8274d'
        },
        max: {
          blue: '#004f9e',
          deepBlue: '#00356b',
          sky: '#0284c7'
        }
      }
    },
  },
  plugins: [],
}

