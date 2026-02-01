/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées OMNI/J.A.R.V.I.S.
        "cyber-cyan": "#22d3ee",
        "cyber-red": "#ef4444",
        "cyber-purple": "#a855f7",
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
        "spin-reverse": "spin 15s linear infinite reverse",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
