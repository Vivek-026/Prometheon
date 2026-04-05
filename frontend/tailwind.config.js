/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#111111",
        accent: "#F97316",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#1a1a1a",
          foreground: "#ffffff",
        },
        border: "#2a2a2a",
        input: "#2a2a2a",
        ring: "#F97316",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
