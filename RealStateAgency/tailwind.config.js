/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17130e",
        umber: "#221c15",
        cream: "#f4efe4",
        brass: "#c6a15b",
        stone: "#8d8578",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["Jost", "sans-serif"],
      },
    },
  },
  plugins: [],
};
