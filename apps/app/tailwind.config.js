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
                darkBg: "#1C1C1F",

                // text-colors
                mainLightText: "#FAFAFA",
                mainDarkText: "#09090B",

                // borders
                lightBorder: "#E4E4E7",
                darkBorder: "#27272A",

                // Primary

                black: "#18181B",
                hover_black: "#334155",
                active_black: "#64748B",

                white: "#FAFAFA",
                hover_white: "#D4D4D4",
                active_white: "#737373",

                // Grays
                gray_1: "#C3C3CB",
                gray_2: "#09090B",
                gray_3: "#9D9D9F",
                gray_4: "#F4F4F5",
                gray_5: "#27272A",
                gray_6: "#71717A",

                // Blacks
                black_1: "#09090B",

                // Functional Colors
                red: "#FF8080",
                green: "#26CB0B",
            },
            spacing: {
            }
        },
        fontFamily: {
        },
        screens: {
            "1300s": { "min": "0px", "max": "1300px" },
            "900s": { "min": "0px", "max": "900px" },
            "800s": { "min": "0px", "max": "800px" },
            "700s": { "min": "0px", "max": "700px" },
            "600s": { "min": "0px", "max": "600px" },
            "630s": { "min": "0px", "max": "630px" },
            "500s": { "min": "0px", "max": "500px" },
            "400s": { "min": "0px", "max": "400px" },
        },
    },
    plugins: [],
}