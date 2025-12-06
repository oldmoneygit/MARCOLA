import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom glass colors - Dark Theme with Emerald Teal Accents
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          hover: 'rgba(255, 255, 255, 0.06)',
          active: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.15)',
        },
        // Background - Dark Mode
        background: {
          primary: '#0a0a0f',
          secondary: '#111114',
          tertiary: '#18181b',
          elevated: '#1f1f23',
        },
        // Accent - Soft Teal & Rose
        accent: {
          DEFAULT: '#BDCDCF',
          secondary: '#E3B8B8',
          tertiary: '#8FAAAD',
          dark: '#5A7A7D',
        },
        // Teal Theme Colors
        teal: {
          50: '#E6F2F1',
          100: '#BDCDCF',
          200: '#8FAAAD',
          300: '#6B8A8D',
          400: '#5A7A7D',
          500: '#034C36',
          600: '#004442',
          700: '#003332',
          800: '#002524',
          900: '#001A19',
        },
        // Rose Accent
        rose: {
          light: '#E3B8B8',
          DEFAULT: '#D4A5A5',
          dark: '#B08888',
        },
      },
      fontFamily: {
        sans: ['LT Superior', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glow-teal': '0 0 30px rgba(189, 205, 207, 0.3), 0 0 60px rgba(189, 205, 207, 0.15)',
        'glow-rose': '0 0 30px rgba(227, 184, 184, 0.3), 0 0 60px rgba(227, 184, 184, 0.15)',
        'glow-green': '0 0 30px rgba(126, 212, 166, 0.3), 0 0 60px rgba(126, 212, 166, 0.15)',
        // Legacy shadows for compatibility
        'glow-purple': '0 0 30px rgba(189, 205, 207, 0.25), 0 0 60px rgba(189, 205, 207, 0.1)',
        'glow-blue': '0 0 30px rgba(143, 170, 173, 0.25), 0 0 60px rgba(143, 170, 173, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        dark: {
          // Dark Theme with Emerald Teal Accents
          'primary': '#BDCDCF',
          'primary-content': '#0a0a0f',
          'secondary': '#E3B8B8',
          'secondary-content': '#0a0a0f',
          'accent': '#8FAAAD',
          'accent-content': '#0a0a0f',
          'neutral': '#18181b',
          'neutral-content': '#BDCDCF',
          'base-100': '#0a0a0f',
          'base-200': '#111114',
          'base-300': '#18181b',
          'base-content': '#ffffff',
          'info': '#BDCDCF',
          'info-content': '#0a0a0f',
          'success': '#7ED4A6',
          'success-content': '#0a0a0f',
          'warning': '#E3B8B8',
          'warning-content': '#0a0a0f',
          'error': '#E57373',
          'error-content': '#ffffff',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};

export default config;
