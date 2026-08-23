/** @type {import('tailwindcss').Config} */
// Colores de marca sincronizados con packages/shared/src/theme.ts (picachoTheme).
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        primary: "#0D8A4B",
        accent: "#F97316",
        foreground: "#1F2937",
      },
    },
  },
  plugins: [],
};
