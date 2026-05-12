/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#B76E79",
          light: "#E8C4C8",
          dark: "#8B4A52",
        },
        secondary: {
          DEFAULT: "#D4A574",
          light: "#F0DCC8",
        },
        background: "#FAF7F5",
        surface: "#FFFFFF",
        "text-primary": "#2D2D2D",
        "text-secondary": "#757575",
        "text-hint": "#BDBDBD",
        divider: "#EEEEEE",
        status: {
          success: "#4CAF50",
          warning: "#FF9800",
          error: "#F44336",
          info: "#2196F3",
        },
      },
    },
  },
  plugins: [],
};
