/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f8f9fa",
          100: "#e9ecef",
          200: "#dee2e6",
          300: "#ced4da",
          400: "#adb5bd",
          500: "#6c757d",
          600: "#495057",
          700: "#343a40",
          800: "#212529",
          850: "#1a1d21",
          900: "#0f1115",
          950: "#080a0e",
        },
        accent: {
          DEFAULT: "#4f9cf7",
          50: "#e8f1fe",
          100: "#c5ddfc",
          200: "#9ec4fa",
          300: "#74abf7",
          400: "#4f9cf7",
          500: "#2b8af5",
          600: "#1a7ae8",
          700: "#0f6ad4",
          800: "#0a5abf",
          900: "#054aab",
        },
        green: {
          DEFAULT: "#22c55e",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        orange: {
          DEFAULT: "#f59e0b",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        red: {
          DEFAULT: "#ef4444",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "barber": "barber 1s linear infinite",
      },
      keyframes: {
        barber: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "40px 0" },
        },
      },
    },
  },
  plugins: [],
};
