/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'], // 启用暗色模式
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 奢华色彩系统 / Luxury Color System
        'luxury-gold': '#d4af37',
        'rose-gold': '#e8b4b8',
        'bronze-gold': '#cd7f32',
        'champagne-gold': '#f7e7ce',
        'platinum': '#e5e4e2',
        'stainless-silver': '#71797e',
        'mercury': '#8b8c89',
        'royal-blue': '#4169e1',
        'deep-ruby': '#8b0000',
        
        // 奢华透明度 / Luxury Opacity
        'luxury-glass': 'rgba(212, 175, 55, 0.1)',
        'rose-gold-glass': 'rgba(232, 180, 184, 0.1)',
        'platinum-glass': 'rgba(229, 228, 226, 0.1)',
        
        // 高级黑色主题配色 / Premium dark theme colors
        'jet-black': '#0a0a0a',
        'charcoal': '#1a1a1a',
        'onyx': '#2d2d2d',
        'slate-dark': '#334155',
        'slate-darker': '#1e293b',
        'neon-blue': '#00d4ff',
        'neon-purple': '#9333ea',
        'neon-green': '#00ff88',
        'accent-cyan': '#06b6d4',
        'accent-violet': '#8b5cf6',
        'accent-pink': '#ec4899',
        'text-primary': '#ffffff',
        'text-secondary': '#e2e8f0',
        'text-tertiary': '#94a3b8',
        'text-muted': '#64748b',
        'border-dark': '#1f2937',
        'border-darker': '#111827',
        'bg-glass': 'rgba(255, 255, 255, 0.05)',
        'bg-glass-hover': 'rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
        'gradient-neon': 'linear-gradient(135deg, #00d4ff 0%, #9333ea 50%, #00ff88 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        // 奢华背景渐变 / Luxury background gradients
        'gradient-luxury': 'linear-gradient(135deg, #d4af37 0%, #b8941f 50%, #d4af37 100%)',
        'gradient-rose-gold': 'linear-gradient(135deg, #e8b4b8 0%, #d4a5a9 50%, #e8b4b8 100%)',
        'gradient-platinum': 'linear-gradient(135deg, #e5e4e2 0%, #d1d0ce 50%, #e5e4e2 100%)',
        'gradient-luxury-subtle': 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(147, 51, 234, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
        // 奢华阴影 / Luxury shadows
        'luxury': '0 4px 20px rgba(212, 175, 55, 0.3)',
        'luxury-glow': '0 0 30px rgba(212, 175, 55, 0.4)',
        'luxury-multi': '0 8px 32px rgba(0, 0, 0, 0.2), 0 4px 20px rgba(212, 175, 55, 0.3)',
        'rose-gold': '0 4px 20px rgba(232, 180, 184, 0.3)',
        'platinum': '0 4px 20px rgba(229, 228, 226, 0.2)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        // 奢华动画 / Luxury animations
        'luxury-float': 'luxuryFloat 6s ease-in-out infinite',
        'luxury-glow': 'luxuryGlow 3s ease-in-out infinite alternate',
        'luxury-pulse': 'luxuryPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 212, 255, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // 奢华动画关键帧 / Luxury animation keyframes
        luxuryFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        luxuryGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(212, 175, 55, 0.8)' },
        },
        luxuryPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
        // 奢华字体 / Luxury fonts
        'serif-luxury': ['Playfair Display', 'Source Han Serif', 'serif'],
        'sans-luxury': ['Inter', 'Source Han Sans', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}