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
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
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
        glass: '0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
        'glass-hover': '0 10px 20px rgba(0,0,0,0.04)',
        'timer-glow': '0 0 40px rgba(242, 204, 13, 0.15)',
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
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        'fade-spin': 'fade-spin 1.2s linear infinite',
        'flip-y': 'flip-y 1s ease-in-out infinite',
        'screen-enter': 'screenEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        blink: 'blink 1s step-start infinite',
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
        screenEnter: {
          from: { opacity: '0', transform: 'scale(0.99) translateY(4px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
