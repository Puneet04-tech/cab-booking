import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          purple: {
            50: "#1a0a2e",
            100: "#240e3d",
            200: "#2e1248",
            300: "#3d1a5f",
            400: "#5a2d82",
            500: "#7b3ff2",
            600: "#9d5cff",
            700: "#b47bff",
            800: "#c99dff",
            900: "#e0c3ff",
          },
          green: {
            50: "#0a1f0f",
            100: "#0d2914",
            200: "#10361a",
            300: "#14492a",
            400: "#1b6838",
            500: "#00ff9f",
            600: "#00ff88",
            700: "#33ffaa",
            800: "#66ffbb",
            900: "#99ffcc",
          },
          dark: {
            900: "#0a0014",
            800: "#10001f",
            700: "#1a0a2e",
            600: "#16213e",
            500: "#1f2937",
          },
          pink: {
            500: "#ff006e",
            600: "#ff1a85",
            700: "#ff4da0",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        cyber: ["Orbitron", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 5px theme('colors.cyber.purple.500'), 0 0 20px theme('colors.cyber.purple.500')",
        "neon-green": "0 0 5px theme('colors.cyber.green.500'), 0 0 20px theme('colors.cyber.green.500')",
        "neon-pink": "0 0 5px theme('colors.cyber.pink.500'), 0 0 20px theme('colors.cyber.pink.500')",
        "neon-lg": "0 0 10px theme('colors.cyber.purple.500'), 0 0 40px theme('colors.cyber.purple.500'), 0 0 80px theme('colors.cyber.purple.500')",
        "neon-green-lg": "0 0 10px theme('colors.cyber.green.500'), 0 0 40px theme('colors.cyber.green.500'), 0 0 80px theme('colors.cyber.green.500')",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
        "glitch": "glitch 1s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        neonPulse: {
          "0%, 100%": { 
            textShadow: "0 0 5px #7b3ff2, 0 0 20px #7b3ff2, 0 0 40px #7b3ff2",
            opacity: "1"
          },
          "50%": { 
            textShadow: "0 0 2px #7b3ff2, 0 0 10px #7b3ff2, 0 0 20px #7b3ff2",
            opacity: "0.8"
          },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
