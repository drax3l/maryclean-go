/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0EA5E9", // Color principal sugerido (Azul profesional)
        secondary: "#334155", // Gris oscuro
        background: "#F8FAFC",
      }
    },
  },
  plugins: [],
}
