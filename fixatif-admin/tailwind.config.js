/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FCFAFA",
        brand: {
          white: "#FFFFFF",
          cream: "#F9F7F6",
          rose: {
            light: "#F3E5E2",
            DEFAULT: "#B76E79", // Deep Rose Gold
            gold: "#E0C0B0",    // Lighter Rose Gold
            dark: "#8E535D",
          }
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "rose-gold-gradient": "linear-gradient(135deg, #E7C1B1 0%, #D4A373 100%)",
      },
      boxShadow: {
        "premium": "0 10px 30px -10px rgba(183, 110, 121, 0.1)",
        "premium-hover": "0 20px 40px -15px rgba(183, 110, 121, 0.2)",
      }
    },
  },
  plugins: [],
};
