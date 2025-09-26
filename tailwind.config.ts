
import type {Config} from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['"Poppins"', 'sans-serif'],
        headline: ['"Poppins"', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
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
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
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
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 10px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'text-glow': {
          '0%, 100%': { 'text-shadow': '0 0 5px hsl(var(--primary)), 0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary))' },
          '50%': { 'text-shadow': '0 0 10px hsl(var(--accent)), 0 0 20px hsl(var(--accent)), 0 0 30px hsl(var(--accent))' },
        },
        'logo-glow': {
            '0%, 100%': { 'box-shadow': '0 0 15px 5px hsla(var(--primary), 0.4), 0 0 30px 10px hsla(var(--primary), 0.2)' },
            '50%': { 'box-shadow': '0 0 20px 8px hsla(var(--accent), 0.5), 0 0 40px 15px hsla(var(--accent), 0.3)' },
        },
        'progress-glow': {
            '0%, 100%': { 'box-shadow': '0 0 8px 2px hsla(var(--primary), 0.7)' },
            '50%': { 'box-shadow': '0 0 12px 4px hsla(var(--accent), 0.8)' },
        },
        'float-up': {
            '0%': { transform: 'translateY(0) translateX(-50%)', opacity: '1' },
            '100%': { transform: 'translateY(-60px) translateX(-50%)', opacity: '0' },
        },
        'line-across': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'line-across-reverse': {
            'from': { transform: 'translateX(100%)' },
            'to': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'text-glow': 'text-glow 3s ease-in-out infinite',
        'logo-glow': 'logo-glow 4s ease-in-out infinite',
        'progress-glow': 'progress-glow 2s ease-in-out infinite',
        'float-up': 'float-up 1.5s ease-out forwards',
        'line-across': 'line-across 1.5s linear infinite',
        'line-across-reverse': 'line-across-reverse 1.5s linear infinite',
      },

      },
    },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

module.exports = config;
