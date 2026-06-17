/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{purs,ts,js}",
    // The Visual-tab block renderer is PureScript that emits Tailwind classes;
    // it lives outside ./src, so scan it too or its classes get purged.
    "./vis/hylograph-vis/src/**/*.purs",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}