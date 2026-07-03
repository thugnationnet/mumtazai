/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'violet-500': '#4ade80',
        'indigo-500': '#22d3ee',
      },
      animation: {
        'thinkingDots': 'thinkingDots 1.5s infinite',
        'scanline': 'scanline 4s linear infinite',
        'flicker': 'flicker 0.2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'border-flow': 'border-flow 3s ease-in-out infinite',
        'fadeSlide': 'fadeSlide 4s ease-in-out infinite',
        'bounceDot': 'bounceDot 1.4s infinite ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        thinkingDots: {
          '0%, 20%': { content: '"."' },
          '40%': { content: '".."' },
          '60%': { content: '"..."' },
          '80%, 100%': { content: '""' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%': { opacity: '0.97' },
          '5%': { opacity: '0.95' },
          '10%': { opacity: '0.9' },
          '15%': { opacity: '0.95' },
          '20%': { opacity: '0.98' },
          '25%': { opacity: '0.95' },
          '100%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(34, 211, 238, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)' },
        },
        'border-flow': {
          '0%': { borderColor: 'rgba(34, 211, 238, 0.3)' },
          '50%': { borderColor: 'rgba(74, 222, 128, 0.3)' },
          '100%': { borderColor: 'rgba(34, 211, 238, 0.3)' },
        },
        fadeSlide: {
          '0%, 10%': { opacity: '0', transform: 'translateY(10px)' },
          '20%, 80%': { opacity: '1', transform: 'translateY(0)' },
          '90%, 100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%': { transform: 'scale(1.2)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
