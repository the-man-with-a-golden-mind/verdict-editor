/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{purs,ts,js}",
    "./src/Notebook/**/*.{purs,js}",
    "./vis/hylograph-vis/src/**/*.purs",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}