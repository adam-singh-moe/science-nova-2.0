import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Color Psychology Enhancement
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          gradient: 'linear-gradient(135deg, #dcfce7 0%, #22c55e 100%)'
        },
        progress: {
          warm: '#f97316',
          cool: '#3b82f6',
          gradient: 'linear-gradient(90deg, #f97316 0%, #3b82f6 100%)'
        },
        subject: {
          physics: {
            50: '#eff6ff',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8'
          },
          chemistry: {
            50: '#f3e8ff',
            500: '#8b5cf6',
            600: '#7c3aed',
            700: '#6d28d9'
          },
          biology: {
            50: '#f0fdf4',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d'
          },
          math: {
            50: '#fff7ed',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c'
          }
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 40px -7px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.15)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.15)',
        'glow-orange': '0 0 15px rgba(249, 115, 22, 0.15)',
        'layered': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'layered-lg': '0 4px 6px rgba(0, 0, 0, 0.07), 0 5px 15px rgba(0, 0, 0, 0.12)',
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'elevation-2': '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        'elevation-3': '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
        'elevation-4': '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
        'elevation-5': '0 20px 40px rgba(0, 0, 0, 0.2)'
      },
      backdropBlur: {
        'glass': '12px'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-2px)' }
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'subtle-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }
        },
        // Enhanced Micro-Interaction Animations
        'button-press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' }
        },
        'shake-error': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
        },
        'success-checkmark': {
          '0%': { transform: 'scale(0) rotate(45deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotate(45deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(45deg)', opacity: '1' }
        },
        'progress-fill': {
          '0%': { width: '0%', opacity: '0.7' },
          '50%': { opacity: '1' },
          '100%': { width: 'var(--progress-width)', opacity: '1' }
        },
        // Educational Animations
        'crossword-type': {
          '0%': { opacity: '0', transform: 'scale(0.8) rotateY(90deg)' },
          '50%': { opacity: '0.7', transform: 'scale(1.1) rotateY(45deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateY(0deg)' }
        },
        'quiz-correct': {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.05)' },
          '50%': { transform: 'scale(0.98)' },
          '75%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' }
        },
        'quiz-incorrect': {
          '0%, 100%': { transform: 'translateX(0) scale(1)' },
          '20%': { transform: 'translateX(-3px) scale(1.01)' },
          '40%': { transform: 'translateX(3px) scale(1.01)' },
          '60%': { transform: 'translateX(-2px) scale(1.01)' },
          '80%': { transform: 'translateX(2px) scale(1.01)' }
        },
        'achievement-unlock': {
          '0%': { opacity: '0', transform: 'scale(0.3) rotate(-10deg)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1) rotate(5deg)' },
          '70%': { transform: 'scale(0.95) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' }
        },
        'completion-celebration': {
          '0%': { transform: 'scale(1)' },
          '20%': { transform: 'scale(1.15) rotate(5deg)' },
          '40%': { transform: 'scale(1.05) rotate(-3deg)' },
          '60%': { transform: 'scale(1.08) rotate(2deg)' },
          '80%': { transform: 'scale(1.02) rotate(-1deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' }
        },
        // Page Transitions
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'modal-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(-20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'stagger-fade': {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        // Loading States
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' }
        },
        'morph-content': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.98)' },
          '100%': { opacity: '0', transform: 'scale(1)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 2s ease-in-out infinite',
        'subtle-glow': 'subtle-glow 3s ease-in-out infinite',
        // Enhanced Micro-Interaction Animations
        'button-press': 'button-press 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'shake-error': 'shake-error 0.5s ease-in-out',
        'success-checkmark': 'success-checkmark 0.6s ease-out forwards',
        'progress-fill': 'progress-fill 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        // Educational Animations
        'crossword-type': 'crossword-type 0.3s ease-out forwards',
        'quiz-correct': 'quiz-correct 0.5s ease-out',
        'quiz-incorrect': 'quiz-incorrect 0.5s ease-out',
        'achievement-unlock': 'achievement-unlock 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'completion-celebration': 'completion-celebration 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        // Page Transitions
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slide-in-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'modal-scale-in': 'modal-scale-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-up': 'fade-up 0.7s ease-out forwards',
        'stagger-fade': 'stagger-fade 0.6s ease-out forwards',
        // Loading States
        'skeleton-shimmer': 'skeleton-shimmer 1.5s infinite',
        'morph-content': 'morph-content 0.4s ease-out forwards',
        // Interactive Visual Elements
        'float': 'float 3s ease-in-out infinite',
        'enhanced-glow': 'enhanced-glow 2s ease-in-out infinite',
        'wave': 'wave 2s ease-in-out infinite',
        'icon-hover': 'icon-hover 0.3s ease-out',
        'focus-ring': 'focus-ring 1s ease-out',
        'thumbnail-zoom': 'thumbnail-zoom 300ms ease-out forwards',
        'chart-reveal': 'chart-reveal 2s ease-out forwards',
        'progress-ring': 'progress-ring 1.5s ease-out forwards',
        'badge-unlock': 'badge-unlock 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'nav-hover': 'nav-item-hover 0.2s ease-out forwards',
        // Responsive & Touch Interactions
        'touch-ripple': 'touch-ripple 0.6s ease-out',
        'touch-feedback': 'touch-feedback 0.2s ease-out',
        'swipe-left': 'swipe-left 0.3s ease-out forwards',
        'swipe-right': 'swipe-right 0.3s ease-out forwards',
        'swipe-up': 'swipe-up 0.3s ease-out forwards',
        'swipe-in-right': 'swipe-in-from-right 0.3s ease-out',
        'swipe-in-left': 'swipe-in-from-left 0.3s ease-out',
        // Loading & Feedback States
        'blur-to-sharp': 'blur-to-sharp 0.8s ease-out',
        'saving-pulse': 'saving-pulse 1.5s ease-in-out infinite',
        'saved-checkmark': 'saved-checkmark 0.6s ease-out forwards',
        'save-success': 'save-success 0.8s ease-out forwards',
        'connection-pulse': 'connection-pulse 2s ease-in-out infinite',
        'offline-fade': 'offline-fade 0.5s ease-out forwards',
        'online-fade': 'online-fade 0.5s ease-out forwards',
        'upload-progress': 'upload-progress 0.3s ease-out forwards',
        'upload-complete': 'upload-complete 0.6s ease-out forwards',
        'auto-save': 'auto-save-indicator 3s ease-out'
      },
      backgroundImage: {
        'subtle-texture': "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23f8fafc\" fill-opacity=\"0.03\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"3\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"3\"/%3E%3C/g%3E%3C/svg%3E')",
        'geometric-light': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23f1f5f9\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
