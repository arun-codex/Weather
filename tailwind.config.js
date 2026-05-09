/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode via a CSS class on <html>
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sky: {
          950: '#0a1628',
        },
        // Weather accent colors
        weather: {
          sunny: '#fbbf24',
          cloudy: '#94a3b8',
          rain: '#3dd5f3',
          snow: '#bfdbfe',
          thunder: '#818cf8',
          fog: '#cbd5e1',
          hot: '#f87171',
          cold: '#06b6d4',
        }
      },
      fontSize: {
        // Enhanced typography scale
        'hero': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.005em', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'large': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(1rem, env(safe-area-inset-top))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
