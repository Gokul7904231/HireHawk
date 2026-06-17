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
        // HawkHire Brand colors - Redesigned Dark Space-Navy Palette
        "surface": "#050814",
        "on-surface": "#f8fafc",
        "on-surface-variant": "#94a3b8",
        "outline-variant": "#1e293b",
        "primary": "#8b5cf6",
        "primary-container": "#7c3aed",
        "on-primary-container": "#f5f3ff",
        "secondary": "#6366f1",
        "secondary-container": "#1e1b4b",
        "on-secondary-container": "#e0e7ff",
        "surface-container-lowest": "#090d1a",
        "surface-container-low": "#0c1122",
        "surface-container": "#0f162a",
        "surface-container-high": "#1e293b",
        "surface-container-highest": "#334155",
        "surface-dim": "#04060f",
        "surface-bright": "#0b0f19",
        "inverse-surface": "#f8fafc",
        "inverse-on-surface": "#0f172a",
        "outline": "#475569",
        "agent-indigo": "#1E1B4B",
        "gold-accent": "#B8860B",
        "error": "#ef4444",
        "error-container": "#450a0a",
        "on-error-container": "#fca5a5",
        "card": "#0c1122",
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
        headline: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
