/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // QuickQuote brand tokens
        qq: {
          night: "#0a0e24",
          deep: "#121845",
          violet: "#8b5cf6",
          cyan: "#22d3ee",
          mint: "#34d399",
        },
      },
      boxShadow: {
        // Glassmorphism tokens
        glass: "0 8px 32px rgba(8, 10, 40, 0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
        glow: "0 0 0 1px rgba(139,92,246,.4), 0 10px 30px -10px rgba(139,92,246,.6)",
      },
      backgroundImage: {
        "qq-gradient": "linear-gradient(135deg, #8b5cf6 0%, #22d3ee 100%)",
      },
    },
  },
  plugins: [],
};
