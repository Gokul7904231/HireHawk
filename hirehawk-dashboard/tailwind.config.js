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
        // HawkHire Brand colors
        "surface": "#fcf9f8",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#4a4455",
        "outline-variant": "#ccc3d8",
        "primary": "#630ed4",
        "primary-container": "#7c3aed",
        "on-primary-container": "#ede0ff",
        "secondary": "#5b598c",
        "secondary-container": "#c7c3fe",
        "on-secondary-container": "#514f81",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0edec",
        "surface-container-high": "#ebe7e7",
        "surface-container-highest": "#e5e2e1",
        "surface-dim": "#dcd9d9",
        "surface-bright": "#fcf9f8",
        "inverse-surface": "#313030",
        "inverse-on-surface": "#f3f0ef",
        "outline": "#7b7487",
        "agent-indigo": "#1E1B4B",
        "gold-accent": "#B8860B",
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "card": "10px",
        "btn": "6px",
        "full": "9999px"
      },
      spacing: {
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "gutter": "24px",
        "unit": "4px",
        "margin-desktop": "40px",
        "margin-mobile": "16px",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
