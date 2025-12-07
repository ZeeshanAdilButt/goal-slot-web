import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neo-brutalism color palette
        primary: {
          DEFAULT: '#FFD700', // Bright yellow
          dark: '#E5C100',
          light: '#FFE44D',
        },
        secondary: {
          DEFAULT: '#000000',
          light: '#1a1a1a',
        },
        accent: {
          pink: '#EC4899',
          blue: '#3B82F6',
          green: '#22C55E',
          orange: '#F97316',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        },
        brutalist: {
          bg: '#FEF3C7', // Light cream/yellow background
          card: '#FFFFFF',
          border: '#000000',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-xl': '8px 8px 0px 0px #000000',
        'brutal-hover': '6px 6px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
