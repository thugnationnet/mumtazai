/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // shadcn/ui CSS Variable Colors
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Brand Colors — Crystal Flow Purple/Violet
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        neural: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Crystal Flow Theme Palette
        crystal: {
          lavender: '#e8e0f0',
          lilac: '#d5d0e8',
          mauve: '#c8bfdd',
          mist: '#ddd8ec',
          frost: '#eae5f3',
        },
        dark: {
          base: '#110d1a',
          elevated: '#1a1028',
          surface: '#201535',
          gradient: {
            center: '#150d20',
            plum: '#1a1028',
          },
          shadow: {
            indigo: '#0a0618',
            plum: '#1a1133',
          },
          button: {
            purple: '#3b235a',
            indigo: '#2e1f5e',
            violet: '#4c1d95',
          },
          text: {
            primary: '#e2e8f0',
            secondary: '#94a3b8',
            muted: '#64748b',
          },
        },
      },
      // Typography Scale
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      // Consistent Spacing System
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      // Container Sizes
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      // Border Radius for shadcn/ui
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Animation & Transitions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.8' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      // Shadows for depth — Crystal Flow
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 10px 20px -2px rgba(0, 0, 0, 0.03)',
        medium: '0 4px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        large: '0 10px 50px -12px rgba(139, 92, 246, 0.15)',
        glass: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.03), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
        'glass-hover': '0 30px 50px -12px rgba(139, 92, 246, 0.15), inset 0 0 10px rgba(255, 255, 255, 1)',
        'purple-glow': '0 8px 40px rgba(139, 92, 246, 0.12)',
        'dark-soft': '0 2px 15px -3px rgba(15, 15, 35, 0.3), 0 10px 20px -2px rgba(26, 17, 51, 0.2)',
        'dark-medium': '0 4px 25px -5px rgba(15, 15, 35, 0.4), 0 10px 30px -5px rgba(26, 17, 51, 0.3)',
        'dark-large': '0 10px 50px -12px rgba(15, 15, 35, 0.6), 0 25px 80px -15px rgba(26, 17, 51, 0.4)',
        'dark-glow': '0 0 20px rgba(139, 92, 246, 0.2), 0 0 40px rgba(99, 102, 241, 0.15)',
      },
    },
  },
  plugins: [],
};
