/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#7dd3fc",
        "on-primary": "#001f2e",
        "primary-container": "#0e4d6e",
        "on-primary-container": "#c8eaff",
        secondary: "#88b4cc",
        "secondary-container": "#1a3a4e",
        tertiary: "#c8a0f0",
        surface: {
          light: "#f0f4f9",
          dark:  "#0b1220",
        },
        "surface-container": {
          light: "#ffffff",
          dark:  "#111a2e",
        },
        "surface-container-high": {
          light: "#e2eaf4",
          dark:  "#16233b",
        },
        "on-surface": {
          light: "#0f172a",
          dark:  "#e2eaf4",
        },
        "on-surface-variant": {
          light: "#475569",
          dark:  "#94a8bc",
        },
        glacier: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          glow: "rgba(125, 211, 252, 0.18)"
        }
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        'cyan-glow': '0 0 24px -2px rgba(125, 211, 252, 0.35)',
        'cyan-sm': '0 0 12px rgba(125, 211, 252, 0.25)',
        'modal-glow': '0 28px 70px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(125, 211, 252, 0.35)',
      }
    },
  },
  plugins: [],
}
