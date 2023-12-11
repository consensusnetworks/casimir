/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      padding: {
      },
      colors: {
        // Backgrounds
        lightBg: "#FFF",
        darkBg: "#09090B",
        // text-colors
        mainLightText: "#FAFAFA",
        mainDarkText: "#09090B",
      },
      spacing: {
      }
    },
    fontFamily: {
    },
    screens: {
    },
  },
  plugins: [],
}