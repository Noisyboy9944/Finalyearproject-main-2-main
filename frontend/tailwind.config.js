const tailwindConfig = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marketing Theme
        marketing: {
            bg: "#020420",
            fg: "#e2e8f0",
            primary: "#a3e635",
            secondary: "#6366f1",
            accent: "#22d3ee",
            surface: "#0f172a",
        },
        // LMS Theme
        lms: {
            bg: "#f8fafc",
            fg: "#0f172a",
            primary: "#312e81",
            secondary: "#e2e8f0",
            accent: "#4f46e5",
            surface: "#ffffff",
            muted: "#94a3b8"
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Instrument Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

module.exports = tailwindConfig;
