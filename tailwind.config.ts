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
        // Custom glass colors - Refined
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.025)',
          hover: 'rgba(255, 255, 255, 0.05)',
          active: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.06)',
          'border-hover': 'rgba(255, 255, 255, 0.12)',
        },
        // Background - Deeper
        background: {
          primary: '#09090d',
          secondary: '#0f0f15',
          tertiary: '#16161f',
          elevated: '#1c1c27',
        },
        // Accent - Brighter
        accent: {
          DEFAULT: '#a78bfa',
          secondary: '#818cf8',
          dark: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['LT Superior', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        'glass-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glow-purple': '0 0 30px rgba(167, 139, 250, 0.25), 0 0 60px rgba(167, 139, 250, 0.1)',
        'glow-blue': '0 0 30px rgba(96, 165, 250, 0.25), 0 0 60px rgba(96, 165, 250, 0.1)',
        'glow-green': '0 0 30px rgba(52, 211, 153, 0.25), 0 0 60px rgba(52, 211, 153, 0.1)',
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
          'primary': '#a78bfa',
          'primary-content': '#ffffff',
          'secondary': '#818cf8',
          'secondary-content': '#ffffff',
          'accent': '#c084fc',
          'accent-content': '#ffffff',
          'neutral': '#16161f',
          'neutral-content': '#a8a8b3',
          'base-100': '#09090d',
          'base-200': '#0f0f15',
          'base-300': '#16161f',
          'base-content': '#fafafa',
          'info': '#60a5fa',
          'info-content': '#ffffff',
          'success': '#34d399',
          'success-content': '#ffffff',
          'warning': '#fbbf24',
          'warning-content': '#000000',
          'error': '#f87171',
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
