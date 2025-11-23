/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 启用暗色模式
  theme: {
    extend: {
      colors: {
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
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(147, 51, 234, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
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
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
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
  plugins: [],
}