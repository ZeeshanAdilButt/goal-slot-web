import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          dark: '#E5C100',
          light: '#FFE44D',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          light: '#1a1a1a',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          pink: '#EC4899',
          blue: '#3B82F6',
          green: '#22C55E',
          orange: '#F97316',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        brutalist: {
          bg: '#FEF3C7',
          card: '#FFFFFF',
          border: '#000000',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Space Grotesk', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #000000',
        'brutal-sm': '2px 2px 0px 0px #000000',
        'brutal-lg': '6px 6px 0px 0px #000000',
        'brutal-xl': '8px 8px 0px 0px #000000',
        'brutal-hover': '6px 6px 0px 0px #000000',
        border: 'var(--ds-shadow-border)',
        'border-small': 'var(--ds-shadow-border-small)',
        'border-medium': 'var(--ds-shadow-border-medium)',
        'border-large': 'var(--ds-shadow-border-large)',
        tooltip: 'var(--ds-shadow-tooltip)',
        menu: 'var(--ds-shadow-menu)',
        modal: 'var(--ds-shadow-modal)',
        fullscreen: 'var(--ds-shadow-fullscreen)',
        'focus-ring': 'var(--ds-focus-ring)',
        'focus-input': 'var(--ds-input-ring)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        'fade-spin': 'fade-spin 1.2s linear infinite',
        'flip-y': 'flip-y 1s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': {
            transform: 'rotate(-3deg)',
          },
          '50%': {
            transform: 'rotate(3deg)',
          },
        },
        'fade-spin': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.25',
          },
        },
        'flip-y': {
          '0%': {
            transform: 'rotateY(0deg)',
          },
          '50%': {
            transform: 'rotateY(180deg)',
          },
          '100%': {
            transform: 'rotateY(360deg)',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
